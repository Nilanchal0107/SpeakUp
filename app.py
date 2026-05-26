import os

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
import uuid

from werkzeug.utils import secure_filename
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_session import Session
from dotenv import load_dotenv

from feedback import allowed_file, transcribe_audio, get_feedback
from scenarios import SCENARIOS, get_category, get_scenario

# Load environment variables from .env (never hardcode secrets in code)
load_dotenv()

app = Flask(__name__)

# Secret key for Flask (used for flash messages, CSRF, etc.)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "fallback_secret")

# IMPORTANT: Use filesystem sessions — NOT the default cookie-based sessions.
# Cookie sessions have a 4KB size limit and will silently break when storing
# large feedback JSON objects. Filesystem sessions have no such limit.
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = "./flask_session"
app.config["SESSION_PERMANENT"] = False

# IMPORTANT: Cap file uploads at 25MB.
# Groq Whisper accepts audio up to ~25MB; anything larger is rejected server-side
# before it wastes memory or hits the API.
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024

Session(app)


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle files larger than MAX_CONTENT_LENGTH gracefully."""
    flash("File too large. Maximum upload size is 25MB.")
    return redirect(request.referrer or url_for("index"))


# ---------------------------------------------------------------------------
# Route stubs — logic will be completed in later prompts
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Home page — displays the 3 category cards."""
    return render_template("index.html", scenarios=SCENARIOS)


@app.route("/scenarios/<category>")
def scenarios(category):
    """Scenarios page — lists 5 scenarios for the chosen category."""
    category_data = get_category(category)

    if not category_data:
        flash("Invalid category. Please choose from the options below.")
        return redirect(url_for("index"))

    return render_template("scenarios.html", category=category, category_data=category_data)


@app.route("/practice/<category>/<scenario_id>")
def practice(category, scenario_id):
    """Practice page — shows the prompt and recorder for a specific scenario."""
    scenario = get_scenario(category, scenario_id)
    if not scenario:
        flash("Scenario not found.")
        return redirect(url_for("scenarios", category=category))

    category_data = get_category(category)
    return render_template(
        "practice.html",
        scenario=scenario,
        category=category,
        category_data=category_data,
    )


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    POST endpoint that receives the transcript/audio from the practice page,
    processes it through Groq (Whisper + Llama), stores feedback in session,
    then redirects to /feedback. Logic added in Prompt 3.
    """
    transcript = ""
    category = request.form.get("category", "")
    scenario_id = request.form.get("scenario_id", "")
    try:
        duration_seconds = int(request.form.get("duration_seconds", 0))
    except (ValueError, TypeError):
        duration_seconds = 0

    if request.form.get("transcript"):
        transcript = request.form.get("transcript").strip()
    elif "audio_file" in request.files:
        file = request.files["audio_file"]

        if file.filename == "":
            flash("No file selected.")
            return redirect(url_for("practice", category=category, scenario_id=scenario_id))

        if not allowed_file(file.filename):
            flash("Invalid file type. Please upload mp3, wav, m4a, or webm.")
            return redirect(url_for("practice", category=category, scenario_id=scenario_id))

        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        file.save(file_path)

        try:
            transcript = transcribe_audio(file_path)
        except RuntimeError:
            flash("Audio transcription failed. Please try again or use the Record option.")
            return redirect(url_for("practice", category=category, scenario_id=scenario_id))

    if not transcript:
        flash("No speech detected. Please try again.")
        return redirect(url_for("practice", category=category, scenario_id=scenario_id))

    scenario = get_scenario(category, scenario_id)
    if not scenario:
        flash("Scenario not found.")
        return redirect(url_for("index"))

    try:
        feedback_data = get_feedback(
            scenario_prompt=scenario["prompt"],
            transcript=transcript,
            category=category,
            difficulty=scenario["difficulty"],
            duration_seconds=duration_seconds,
        )
    except Exception:
        flash("AI feedback failed. Please try again.")
        return redirect(url_for("practice", category=category, scenario_id=scenario_id))

    session["feedback"] = feedback_data
    session["transcript"] = transcript
    session["scenario"] = scenario
    session["category"] = category

    return redirect(url_for("feedback"))


@app.route("/feedback")
def feedback():
    """Feedback page — reads the processed feedback from session and displays it."""
    feedback_data = session.get("feedback")
    if not feedback_data:
        flash("No feedback found. Please complete a practice session first.")
        return redirect(url_for("index"))

    scenario = session.get("scenario", {})
    category = session.get("category", "")
    transcript = session.get("transcript", "")

    return render_template(
        "feedback.html",
        feedback=feedback_data,
        scenario=scenario,
        category=category,
        transcript=transcript,
    )


if __name__ == "__main__":
    app.run(debug=True)
