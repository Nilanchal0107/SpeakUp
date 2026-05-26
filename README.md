# SpeakUp — AI Communication Skills Trainer

#### Video Demo: `<URL HERE>`

#### Description:

SpeakUp is a web application that helps users improve their spoken English communication skills through AI-powered feedback. Users select a practice scenario — ranging from everyday conversation to professional presentations — record or upload their spoken response, and receive a detailed evaluation across six communication parameters: **clarity, relevance, fluency, grammar, confidence, and structure**.

The app uses **Groq Whisper** to transcribe audio server-side (handling Indian names and accents far better than in-browser speech recognition), and **Groq Llama 3.3 70B** to evaluate the transcript with structured JSON feedback. Pre-computed Python analytics (filler word detection via regex, speaking pace in WPM) are passed directly to the LLM to ensure consistent, accurate scoring rather than relying on the model to count words itself.

---

## Features

- 🎙️ **Live browser recording** via the MediaRecorder API (Chrome, Edge, Firefox, Safari)
- 📁 **Audio file upload** fallback — accepts MP3, WAV, M4A, and WebM
- 🤖 **AI Transcription** — Groq Whisper large-v3 handles Indian names and accents accurately
- 📊 **Structured feedback** — scores (1–10) with specific comments on 6 parameters
- 🔢 **Filler word counter** — pre-computed in Python for accuracy (um, uh, like, basically, etc.)
- ⏱️ **Speaking pace analysis** — WPM calculated from JS timer, mapped to human-readable interpretation
- ✍️ **Example rewrite** — the AI rewrites the user's opening sentence with better delivery
- 🎯 **15 practice scenarios** across 3 categories and 3 difficulty levels
- 🛡️ **Prompt injection protection** — transcript is wrapped in delimiters; the LLM is instructed to ignore any instructions found inside
- 💾 **Filesystem sessions** — avoids the 4 KB cookie limit when storing large feedback JSON objects

---

## Project Structure

```
speakup/
│
├── app.py                  # Flask application — all routes and request handling
├── feedback.py             # AI feedback pipeline — Whisper, Llama, filler/WPM analysis
├── scenarios.py            # Scenario data — 3 categories × 5 scenarios each
│
├── requirements.txt        # Python dependencies
├── Procfile                # Gunicorn entrypoint for deployment (e.g., Render, Railway)
├── .env                    # Secret keys — never commit this file
├── .gitignore
│
├── templates/
│   ├── layout.html         # Base template — navbar, flash messages, footer, CDN links
│   ├── index.html          # Home page — 3 category cards
│   ├── scenarios.html      # Scenario list page — 5 scenarios per category
│   ├── practice.html       # Practice page — recorder, upload zone, countdown timer
│   └── feedback.html       # Feedback page — scores, strengths, improvements, rewrite
│
├── static/
│   ├── css/
│   │   └── styles.css      # All custom styles — dark theme, cards, badges, animations
│   └── js/
│       ├── speech.js       # MediaRecorder logic — record, stop, upload, timer, UI states
│       └── feedback.js     # Feedback page interactions
│
├── uploads/                # Temporary audio files — deleted immediately after transcription
└── flask_session/          # Server-side session files (gitignored)
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                              │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  index.html  │───▶│scenarios.html│───▶│   practice.html     │   │
│  │  (3 cards)   │    │  (5 options) │    │                      │   │
│  └──────────────┘    └──────────────┘    │  ┌────────────────┐  │   │
│                                          │  │   speech.js    │  │   │
│                                          │  │                │  │   │
│                                          │  │ MediaRecorder  │  │   │
│                                          │  │ (webm/mp4)     │  │   │
│                                          │  │                │  │   │
│                                          │  │ File Upload    │  │   │
│                                          │  │ (mp3/wav/m4a)  │  │   │
│                                          │  └───────┬────────┘  │   │
│                                          └──────────┼───────────┘   │
│                                                     │               │
│                    FormData (multipart/form-data)   │               │
│                    audio_file + duration_seconds    │               │
│                    category + scenario_id           │               │
└─────────────────────────────────────────────────────┼───────────────┘
                                                      │
                                      POST /analyze   │
                                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FLASK SERVER (app.py)                       │
│                                                                     │
│   /analyze                                                          │
│   ├── Validate file type (allowed_file)                             │
│   ├── Save to uploads/ with UUID filename                           │
│   ├── Call feedback.py pipeline ──────────────────────────────────┐ │
│   ├── Store result in flask_session (filesystem)                  │ │
│   └── Redirect → /feedback                                        │ │
│                                                                   │ │
│   /feedback                                                       │ │
│   └── Read session → render feedback.html                         │ │
└───────────────────────────────────────────────────────────────────┼─┘
                                                                    │
                                                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FEEDBACK PIPELINE (feedback.py)                  │
│                                                                     │
│  1. count_fillers(transcript)                                       │
│     └── Python regex — counts um, uh, like, basically, etc.         │
│                                                                     │
│  2. calculate_wpm(transcript, duration_seconds)                     │
│     └── word_count / duration × 60 → mapped to interpretation       │
│                                                                     │
│  3. build_prompt(...)                                               │
│     ├── System prompt — role, difficulty level, security rules      │
│     └── User prompt — pre-computed stats + ===TRANSCRIPT=== block   │
│                                                                     │
│  4. transcribe_audio(file_path)  ─────────────────────────────────▶│
│     └── Groq Whisper large-v3                                       │
│         └── Deletes file from uploads/ immediately after            │
│                                                                     │
│  5. Groq Llama 3.3 70B  ──────────────────────────────────────────▶│
│     ├── temperature=0.2 (consistent, strict scoring)                │
│     └── Returns structured JSON (6 params + strengths + rewrite)    │
│                                                                     │
│  6. parse_response(raw)                                             │
│     ├── Strip markdown code fences if present                       │
│     ├── json.loads() the cleaned string                             │
│     └── Validate all required fields exist                          │
│                                                                     │
│  Retry: Attempts Groq call twice before raising RuntimeError        │
└─────────────────────────────────────────────────────────────────────┘
                              │            │
                              ▼            ▼
              ┌───────────────────┐  ┌───────────────────┐
              │  Groq Whisper     │  │  Groq Llama 3.3   │
              │  large-v3         │  │  70B Versatile    │
              │  (transcription)  │  │  (evaluation)     │
              └───────────────────┘  └───────────────────┘
```

### Request / Response Flow

```
Browser                        Flask                feedback.py                Groq Cloud
  │                             │                        │                         │
  │── POST /analyze ──────────▶ │                        │                         │
  │   (audio file)              │── transcribe() ─────▶  │                         │
  │                             │                        │── Whisper ──────────▶   │
  │                             │                        │◀─ transcript ────────   │
  │                             │                        │                          │
  │                             │                        │── count_fillers()        │
  │                             │                        │── calculate_wpm()        │
  │                             │                        │── build_prompt()         │
  │                             │                        │── Llama 3.3 ──────────▶│
  │                             │                        │◀─ JSON feedback ───────│
  │                             │◀─ feedback dict ────   │                        │
  │                             │                        │                         │
  │                             │── session.save()       │                         │
  │◀── 302 /feedback ────────  │                        │                         │
  │── GET /feedback ────────▶  │                        │                         │
  │◀── feedback.html ────────  │                        │                         │
```

---

## Feedback JSON Schema

Every feedback response from Groq follows this exact structure:

```json
{
  "overall_score": 7,
  "parameters": {
    "clarity":    { "score": 8, "comment": "Specific observation" },
    "relevance":  { "score": 7, "comment": "Specific observation" },
    "fluency":    { "score": 6, "comment": "Specific observation", "filler_count": 4 },
    "grammar":    { "score": 8, "comment": "Specific observation" },
    "confidence": { "score": 7, "comment": "Specific observation" },
    "structure":  { "score": 6, "comment": "Specific observation" }
  },
  "strengths":       ["Strength 1", "Strength 2"],
  "improvements":    ["Tip 1", "Tip 2", "Tip 3"],
  "example_rewrite": "A better version of the user's opening sentence."
}
```

---

## Practice Categories

| Category | Difficulty | Time Limit | Scenarios |
|---|---|---|---|
| Speaking Skills | Beginner | 60 seconds | Self Intro, Opinion, Describe, Daily Life, Favourite Thing |
| Public Speaking | Intermediate | 90 seconds | Impromptu, Motivational, Debate, Story, Current Affairs |
| Presentation Skills | Advanced | 120 seconds | Concept Explain, Product Pitch, Project Present, Problem Solution, Data Explain |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask 3.1, Gunicorn |
| Sessions | flask-session (filesystem) |
| AI — Transcription | Groq Whisper large-v3 |
| AI — Evaluation | Groq Llama 3.3 70B Versatile |
| Frontend | HTML5, Vanilla CSS, Bootstrap 5 |
| Icons | Bootstrap Icons |
| Recording | MediaRecorder API (browser-native) |
| Fonts | Montserrat (headings) + Sora (body) |

---

## How to Run Locally

### 1. Clone the repository

```bash
git clone <repo-url>
cd speakup
```

### 2. Create a `.env` file

```env
GROQ_API_KEY=your_groq_api_key_here
FLASK_SECRET_KEY=any_random_secret_string
```

### 3. Install dependencies

```bash
# Windows
py -m pip install -r requirements.txt

# macOS / Linux
python3 -m pip install -r requirements.txt
```

### 4. Run the development server

```bash
# Option A — Python directly
py app.py

# Option B — Flask CLI (Windows)
set FLASK_APP=app.py
py -m flask run

# Option B — Flask CLI (macOS/Linux)
export FLASK_APP=app.py
flask run
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

### Getting a Groq API key

1. Create a free account at [console.groq.com](https://console.groq.com)
2. Go to **API Keys** → **Create API Key**
3. Copy the key into your `.env` file as `GROQ_API_KEY`

---

## Design Decisions

**Why Groq Whisper instead of the Web Speech API?**
The Web Speech API (used in earlier versions) is Chrome-only, requires an internet connection, and struggles with Indian names and accents. Groq Whisper handles multilingual audio reliably and runs server-side, making it accessible across all browsers including Firefox, Safari, and mobile.

**Why pre-compute filler words in Python instead of asking the LLM?**
LLMs are inconsistent at counting. A transcript with five instances of "um" might be reported as three by Groq one time and seven the next. Python regex is deterministic and fast (~1ms). The pre-computed count is passed directly to the LLM so it only needs to comment on it, not calculate it.

**Why filesystem sessions instead of cookie sessions?**
Flask's default cookie sessions have a hard 4 KB size limit. A full feedback JSON object (six parameters with comments, strengths, improvements, and example rewrite) easily exceeds this. Filesystem sessions store data on the server with no size limit.

**Why `temperature=0.2` for the feedback call?**
Higher temperatures produce creative but inconsistent evaluations — the same transcript might score 6 one time and 9 the next. A low temperature of 0.2 makes scoring repeatable and fair across users.

**Why wrap the transcript in `===TRANSCRIPT START===` delimiters?**
Users might intentionally or accidentally include text that looks like instructions inside their spoken response (prompt injection). The system prompt instructs the LLM to treat anything inside the delimiters purely as speech content to evaluate — not as commands to follow.

---

## CS50x Final Project

SpeakUp is the CS50x Final Project by **Nilanchal Jena**.

> *"This was CS50x!"*
