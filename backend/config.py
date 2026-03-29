"""
Ignorance Protocol Engine — Configuration
=========================================
Tune model, entropy threshold (gamma), and runtime settings here.
"""

import os
import torch

# ── Model ────────────────────────────────────────────────────────────────────
# The HuggingFace model used for raw logit entropy calculations.
MODEL_NAME: str = "Qwen/Qwen2.5-1.5B-Instruct"

# Auto-detect CUDA; falls back to CPU
DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"

# Max tokens the model generates per query
MAX_NEW_TOKENS: int = 150

# ── Entropy / Decision ────────────────────────────────────────────────────────
# γ (gamma) — Shannon entropy threshold, in nats.
# If H(x) >= GAMMA  →  BLOCK response, trigger clarification.
# If H(x) <  GAMMA  →  PASS, return answer.
# Range: typically 0.0 – 3.0 for GPT-family vocab sizes.
# Matches the UI default (gammaLimit = 1.8).
GAMMA: float = 1.8

# Confidence score below this value also triggers a block
# (confidence = 1 − normalised_entropy, range 0..1)
CONFIDENCE_THRESHOLD: float = 0.40

# ── Flask / CORS ─────────────────────────────────────────────────────────────
FLASK_HOST: str = "0.0.0.0"
FLASK_PORT: int = 5000
FLASK_DEBUG: bool = False          # Set True for development hot-reload

# Origins allowed to call the API (add your production domain here)
CORS_ORIGINS: list = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ── Logging ──────────────────────────────────────────────────────────────────
LOG_BLOCKED_QUERIES: bool = True
LOG_PASSED_QUERIES:  bool = True
LOG_FILE: str = "ignorance_protocol.log"
