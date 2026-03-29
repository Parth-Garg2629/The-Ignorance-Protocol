# Ignorance Protocol Engine

A production-ready AI middleware layer that prevents hallucinations by computing real Shannon entropy from model logits. If the model is too uncertain (high entropy), it blocks the response and triggers a Socratic clarification loop.

## Architecture

*   **Frontend**: Next.js 15 (App Router) + Tailwind CSS + Lucide Icons
*   **Backend**: Python Flask API wrapper around HuggingFace Transformers
*   **Model**: `distilgpt2` by default for fast local CPU inference (configurable to `google/gemma-2b` in `backend/config.py`)

## 🚀 Setup Instructions

### 1. Start the Python Backend

The backend runs on `http://localhost:5000` and provides the `/query` endpoint.

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
*Note: On the first run, it will automatically download the model from HuggingFace (~220MB for distilgpt2).*

### 2. Start the Next.js Frontend

The frontend runs on `http://localhost:3000`.

```powershell
# Open a new terminal window
cd "d:\ai model"
npm install
npm run dev
```

### 3. Usage

1.  Open `http://localhost:3000` in your browser.
2.  In the top header, toggle the switch from **"Cached Demo"** to **"Live API"**.
    *   *You should see a green "API LIVE" badge appear if the backend is running.*
3.  Try sending queries:
    *   **Low Entropy (Pass)**: `"What is the capital of France?"` or `"Name three primary colors."`
    *   **High Entropy (Block)**: `"What should I do about my legal situation?"` or ambiguous pronouns.
4.  Observe the real-time H(X) gauge and the per-response confidence bars.
