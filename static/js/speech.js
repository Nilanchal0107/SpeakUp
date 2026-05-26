// speech.js
// ---------------------------------------------------------------------------
// MediaRecorder-based recording for SpeakUp.
// Web Speech API has been removed — audio is captured as a real audio file,
// sent to Flask /analyze, and transcribed by Groq Whisper server-side.
// This correctly handles Indian names, proper nouns, and uncommon openers.
// ---------------------------------------------------------------------------

// ── State variables ──────────────────────────────────────────────────────────
let mediaRecorder = null;
let audioChunks = [];
let startTime = null;
let timerInterval = null;
let isRecording = false;

// ── Format detection ─────────────────────────────────────────────────────────
// Chrome/Edge support webm;codecs=opus, Firefox supports webm, Safari only mp4.
// Always detect at runtime — never hardcode the format.
const MIME_TYPE = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
    ? 'audio/webm'
    : 'audio/mp4';

// ── Start recording ──────────────────────────────────────────────────────────
async function startRecording() {
    try {
        // Request microphone permission from browser
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioChunks = [];
        startTime = Date.now();

        mediaRecorder = new MediaRecorder(stream, { mimeType: MIME_TYPE });

        // Collect audio data every second
        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        // When recording stops — automatically send to Flask
        mediaRecorder.onstop = async () => {
            // Stop all microphone tracks to release the mic indicator in the browser tab
            stream.getTracks().forEach(track => track.stop());

            const durationSeconds = Math.round((Date.now() - startTime) / 1000);
            const audioBlob = new Blob(audioChunks, { type: MIME_TYPE });

            await sendToFlask(audioBlob, durationSeconds);
        };

        // Start recording, collect a chunk every 1000ms
        mediaRecorder.start(1000);
        isRecording = true;

        // Update UI
        updateUI("recording");
        startTimer();

    } catch (error) {
        if (error.name === "NotAllowedError") {
            showError("Microphone permission denied. Please allow microphone access and try again.");
        } else if (error.name === "NotFoundError") {
            showError("No microphone found. Please connect a microphone and try again.");
        } else {
            showError("Could not start recording: " + error.message);
        }
    }
}

// ── Stop recording ───────────────────────────────────────────────────────────
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        stopTimer();
        updateUI("processing");
    }
}

// ── Send audio blob to Flask /analyze ────────────────────────────────────────
// Flask expects the field name "audio_file" (matches request.files["audio_file"]).
async function sendToFlask(audioBlob, durationSeconds) {
    updateLoadingMessage("📤 Uploading your recording...");

    // Determine file extension from detected MIME type
    const extension = MIME_TYPE.includes('mp4') ? 'mp4' : 'webm';

    const formData = new FormData();
    formData.append("audio_file", audioBlob, `recording.${extension}`);
    formData.append("duration_seconds", durationSeconds);

    // Read category and scenario_id from hidden inputs — required by Flask /analyze
    formData.append("category", document.getElementById("category-input").value);
    formData.append("scenario_id", document.getElementById("scenario-id-input").value);

    updateLoadingMessage("🎯 Transcribing your speech with AI...");

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            body: formData
        });

        updateLoadingMessage("🧠 Analysing your communication...");

        // Flask redirects to /feedback after successful processing
        if (response.redirected) {
            window.location.href = response.url;
        } else if (!response.ok) {
            showError("Something went wrong. Please try again.");
            updateUI("idle");
        }
    } catch (error) {
        showError("Network error. Please check your connection and try again.");
        updateUI("idle");
    }
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
    let elapsed = 0;
    const timeLimit = parseInt(document.getElementById("time-limit").value);

    timerInterval = setInterval(() => {
        elapsed++;
        const remaining = timeLimit - elapsed;

        // Format as M:SS
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        document.getElementById("timer-display").textContent =
            `${mins}:${secs.toString().padStart(2, '0')}`;

        // Warning colour when 10 seconds remain
        if (remaining <= 10) {
            document.getElementById("timer-display").classList.add("timer-warning");
        }

        // Auto-stop when time limit is reached
        if (remaining <= 0) {
            stopRecording();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ── UI state manager ──────────────────────────────────────────────────────────
// Centralised function — all UI state changes go through here.
// States: "idle" | "recording" | "processing"
function updateUI(state) {
    const recordBtn = document.getElementById("record-btn");
    const stopBtn = document.getElementById("stop-btn");
    const loadingSection = document.getElementById("loading-section");
    const recordSection = document.getElementById("record-section");
    const uploadSection = document.getElementById("upload-section");

    if (state === "idle") {
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        loadingSection.style.display = "none";
        recordSection.style.display = "block";
        uploadSection.style.display = "block";
        recordBtn.classList.remove("recording");
    } else if (state === "recording") {
        recordBtn.disabled = true;
        stopBtn.disabled = false;
        recordBtn.classList.add("recording");
        loadingSection.style.display = "none";
    } else if (state === "processing") {
        recordBtn.disabled = true;
        stopBtn.disabled = true;
        recordSection.style.display = "none";
        uploadSection.style.display = "none";
        loadingSection.style.display = "block";
    }
}

function updateLoadingMessage(message) {
    const loadingText = document.getElementById("loading-text");
    if (loadingText) {
        loadingText.textContent = message;
    }
}

function showError(message) {
    const errorDiv = document.getElementById("error-message");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
    }
}

// ── Upload file handler ───────────────────────────────────────────────────────
function handleFileUpload() {
    const fileInput = document.getElementById("audio-file-input");
    const file = fileInput.files[0];

    if (!file) {
        showError("Please select a file first.");
        return;
    }

    // Validate both MIME type and extension to handle browser inconsistencies
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/webm", "audio/x-m4a", "audio/ogg"];
    const hasValidMime = allowedTypes.includes(file.type);
    const hasValidExt = /\.(mp3|wav|m4a|webm)$/i.test(file.name);

    if (!hasValidMime && !hasValidExt) {
        showError("Invalid file type. Please upload an mp3, wav, m4a, or webm file.");
        return;
    }

    updateUI("processing");
    updateLoadingMessage("📤 Uploading your audio file...");

    const formData = new FormData();
    // Flask expects "audio_file" (matches request.files["audio_file"] in app.py)
    formData.append("audio_file", file);
    formData.append("duration_seconds", 0);
    formData.append("category", document.getElementById("category-input").value);
    formData.append("scenario_id", document.getElementById("scenario-id-input").value);

    updateLoadingMessage("🎯 Transcribing with Groq Whisper...");

    fetch("/analyze", {
        method: "POST",
        body: formData
    }).then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        } else {
            showError("Something went wrong. Please try again.");
            updateUI("idle");
        }
    }).catch(() => {
        showError("Network error. Please check your connection.");
        updateUI("idle");
    });
}

// ── Page init ─────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Check if MediaRecorder is supported (not available in very old browsers)
    if (!window.MediaRecorder || !navigator.mediaDevices) {
        const recordSection = document.getElementById("record-section");
        const browserWarning = document.getElementById("browser-warning");
        if (recordSection) recordSection.style.display = "none";
        if (browserWarning) browserWarning.style.display = "block";
    }

    // Wire up record / stop buttons
    const recordBtn = document.getElementById("record-btn");
    const stopBtn = document.getElementById("stop-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("audio-file-input");

    if (recordBtn) recordBtn.addEventListener("click", startRecording);
    if (stopBtn) stopBtn.addEventListener("click", stopRecording);
    if (uploadBtn) uploadBtn.addEventListener("click", handleFileUpload);

    // Show selected filename and reveal the selected-file row
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            const display = document.getElementById("file-name-display");
            const selectedWrap = document.getElementById("upload-selected-wrap");

            if (file) {
                if (display) display.textContent = file.name;
                if (selectedWrap) selectedWrap.style.display = "flex";
            } else {
                if (display) display.textContent = "No file chosen";
                if (selectedWrap) selectedWrap.style.display = "none";
            }
        });
    }

    // Drag-and-drop highlight on the upload zone
    const uploadZone = document.getElementById("upload-zone");
    if (uploadZone) {
        uploadZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadZone.classList.add("is-dragover");
        });
        uploadZone.addEventListener("dragleave", () => {
            uploadZone.classList.remove("is-dragover");
        });
        uploadZone.addEventListener("drop", (e) => {
            uploadZone.classList.remove("is-dragover");
            // Let the browser handle the drop into the hidden file input naturally
        });
    }
});
