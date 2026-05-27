# SpeakUp — AI Communication Skills Trainer

#### Live Demo: https://speakup-xkjo.onrender.com
#### Video Demo: https://youtu.be/oMtkoZgZvx0

| Field | Details |
|---|---|
| **Project** | SpeakUp |
| **Name** | Nilanchal Jena |
| **GitHub** | https://github.com/Nilanchal0107 |
| **edX** | NJ_2702 |
| **Location** | Kalyan, India |
| **Date** | 26 May 2026 |

---

# Description

SpeakUp is an AI-powered web application designed to help users improve spoken English and communication skills through structured speaking practice and intelligent feedback.

Users select a speaking scenario, record or upload their response, and receive detailed AI-generated analysis across six communication parameters:

- Clarity
- Relevance
- Fluency
- Grammar
- Confidence
- Structure

The platform uses Groq Whisper large-v3 for highly accurate speech transcription and Groq Llama 3.3 70B for structured communication evaluation.

Unlike browser-based speech recognition systems, SpeakUp performs server-side transcription, making it more reliable across browsers and significantly more accurate for Indian accents and multilingual speakers.

The application also performs deterministic analytics in Python such as filler word counting and speaking pace analysis before passing structured statistics to the LLM. This ensures consistent and fair scoring.

---

# Features

- 🎙️ Live browser recording using the MediaRecorder API
- 📁 Audio upload support (MP3, WAV, M4A, WebM)
- 🤖 AI transcription using Groq Whisper large-v3
- 📊 Structured AI evaluation with scores and comments
- 🔢 Filler word detection using Python regex
- ⏱️ Speaking pace analysis using words-per-minute calculation
- ✍️ AI-generated improved response rewrite
- 🎯 15 speaking scenarios across 3 categories
- 🛡️ Prompt injection protection
- 💾 Filesystem session storage for large feedback objects
- 📱 Responsive mobile-friendly interface
- 🔒 Environment variables securely managed in production

---

# Live Deployment

SpeakUp is publicly deployed on Render.

### Live Website

https://speakup-xkjo.onrender.com

### Deployment Stack

- Platform: Render
- Backend Server: Gunicorn
- Framework: Flask
- HTTPS: Enabled automatically by Render
- Environment Variables: Managed securely using Render dashboard secrets

### Production Notes

- Uploaded audio files are deleted immediately after transcription.
- `.env` is excluded from version control using `.gitignore`.
- Render automatically installs dependencies from `requirements.txt`.
- `Procfile` is used to launch Gunicorn in production.

---

# Project Structure

```text
speakup/
│
├── app.py
├── feedback.py
├── scenarios.py
│
├── requirements.txt
├── Procfile
├── .env
├── .gitignore
│
├── templates/
│   ├── layout.html
│   ├── index.html
│   ├── scenarios.html
│   ├── practice.html
│   └── feedback.html
│
├── static/
│   ├── css/
│   │   └── styles.css
│   │
│   └── js/
│       ├── speech.js
│       └── feedback.js
│
├── uploads/
└── flask_session/
```

---

# System Architecture

```text
Browser
   │
   ├── Record / Upload Audio
   │
   ▼
Flask Server (app.py)
   │
   ├── Validate File
   ├── Save Upload
   ├── Call feedback.py
   │
   ▼
feedback.py
   │
   ├── Groq Whisper → Transcription
   ├── Filler Word Analysis
   ├── WPM Calculation
   ├── Prompt Construction
   └── Groq Llama 3.3 → Evaluation
   │
   ▼
Structured JSON Feedback
   │
   ▼
feedback.html
```

---

# Feedback JSON Schema

```json
{
  "overall_score": 7,
  "parameters": {
    "clarity": {
      "score": 8,
      "comment": "Specific observation"
    },
    "relevance": {
      "score": 7,
      "comment": "Specific observation"
    },
    "fluency": {
      "score": 6,
      "comment": "Specific observation",
      "filler_count": 4
    },
    "grammar": {
      "score": 8,
      "comment": "Specific observation"
    },
    "confidence": {
      "score": 7,
      "comment": "Specific observation"
    },
    "structure": {
      "score": 6,
      "comment": "Specific observation"
    }
  },
  "strengths": [
    "Strength 1",
    "Strength 2"
  ],
  "improvements": [
    "Tip 1",
    "Tip 2",
    "Tip 3"
  ],
  "example_rewrite": "Improved opening response."
}
```

---

# Practice Categories

| Category | Difficulty | Time Limit |
|---|---|---|
| Speaking Skills | Beginner | 60 seconds |
| Public Speaking | Intermediate | 90 seconds |
| Presentation Skills | Advanced | 120 seconds |

---

# Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask 3.1 |
| Production Server | Gunicorn |
| Sessions | Flask-Session |
| AI Transcription | Groq Whisper large-v3 |
| AI Evaluation | Groq Llama 3.3 70B |
| Frontend | HTML5, CSS3, Bootstrap 5 |
| JavaScript | Vanilla JavaScript |
| Recording | MediaRecorder API |
| Deployment | Render |

---

# How to Run Locally

## 1. Clone Repository

```bash
git clone https://github.com/Nilanchal0107/speakup.git
cd speakup
```

## 2. Create `.env`

```env
GROQ_API_KEY=your_api_key_here
FLASK_SECRET_KEY=your_secret_key_here
```

## 3. Install Dependencies

### Windows

```bash
py -m pip install -r requirements.txt
```

### macOS / Linux

```bash
python3 -m pip install -r requirements.txt
```

## 4. Run Application

### Windows

```bash
set FLASK_APP=app.py
flask run
```

### macOS / Linux

```bash
export FLASK_APP=app.py
flask run
```

Open:

```text
http://127.0.0.1:5000
```

---

# Design Decisions

## Why Groq Whisper instead of Web Speech API?

The Web Speech API is browser-dependent and struggles with Indian accents and multilingual speech. Groq Whisper provides significantly more reliable and accurate server-side transcription.

## Why count filler words in Python?

LLMs are inconsistent at deterministic counting tasks. Python regex guarantees accurate filler counts every time.

## Why filesystem sessions?

Flask cookie sessions have a 4 KB size limit, which is insufficient for large structured feedback JSON objects.

## Why use low temperature (0.2)?

Lower temperature values produce more stable and repeatable scoring across evaluations.

## Why transcript delimiters?

Transcripts are wrapped in delimiters to prevent prompt injection attacks and ensure the model treats spoken content only as evaluative input.

---

# Motivation

As an Indian student, I observed that many learners understand English grammar and vocabulary but struggle with spoken communication confidence.

SpeakUp was built to provide accessible AI-powered speaking practice with practical, real-world feedback tailored for communication improvement.

---

# CS50x Final Project

SpeakUp is the CS50x Final Project by Nilanchal Jena.

> “This was CS50x!”
