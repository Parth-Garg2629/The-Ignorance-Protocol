"""
/query Route — Main API Endpoint
=================================
POST /query

Request body (JSON):
    {
        "prompt": "user input string",
        "gamma":  1.8             // optional override
    }

Response (JSON):
    {
        "status":          "allowed" | "blocked",
        "response":        "answer text OR clarification question",
        "entropy":         0.74,
        "confidence":      0.82,
        "token_entropies": [0.5, 0.8, ...],
        "latency_ms":      142
    }
"""

from __future__ import annotations

import logging
import time

from flask import Blueprint, request, jsonify, current_app

from core.decision import analyze_uncertainty, should_block
from core.socratic import generate_clarification

logger = logging.getLogger(__name__)

query_bp = Blueprint("query", __name__)


@query_bp.route("/query", methods=["POST"])
def query():
    """Main entropy-gated inference endpoint."""
    t_start = time.perf_counter()

    # ── Parse request ─────────────────────────────────────────────────────────
    data = request.get_json(silent=True)
    if not data or "prompt" not in data:
        return jsonify({"error": "Missing 'prompt' field in request body."}), 400

    prompt: str = str(data["prompt"]).strip()
    if not prompt:
        return jsonify({"error": "'prompt' must be a non-empty string."}), 400

    # Allow per-request gamma override; fall back to config
    from config import GAMMA, MAX_NEW_TOKENS
    gamma = float(data.get("gamma", GAMMA))

    # ── Model inference ───────────────────────────────────────────────────────
    loader = current_app.config["MODEL_LOADER"]
    try:
        generated_text, per_token_logits = loader.generate(
            prompt, max_new_tokens=MAX_NEW_TOKENS
        )
    except Exception as exc:
        logger.exception("Model generation failed.")
        return jsonify({"error": f"Model error: {str(exc)}"}), 500

    # ── Entropy analysis ──────────────────────────────────────────────────────
    uncertainty = analyze_uncertainty(per_token_logits)
    entropy: float   = uncertainty["entropy"]
    confidence: float = uncertainty["confidence"]
    token_entropies: list = uncertainty["token_entropies"]

    # ── Decision gate ─────────────────────────────────────────────────────────
    blocked = should_block(entropy, gamma)

    if blocked:
        status = "blocked"
        response_text = generate_clarification(prompt, entropy)
        logger.info(
            f"[BLOCK] prompt={prompt!r:.60}  H={entropy:.3f}  γ={gamma}"
        )
    else:
        status = "allowed"
        response_text = generated_text
        logger.info(
            f"[PASS ] prompt={prompt!r:.60}  H={entropy:.3f}  γ={gamma}"
        )

    latency_ms = int((time.perf_counter() - t_start) * 1000)

    return jsonify(
        {
            "status":          status,
            "response":        response_text,
            "entropy":         round(entropy, 4),
            "confidence":      round(confidence, 4),
            "token_entropies": token_entropies[:20],   # cap to 20 for payload size
            "latency_ms":      latency_ms,
        }
    )


@query_bp.route("/health", methods=["GET"])
def health():
    """Quick liveness check for the UI to verify backend is reachable."""
    loader = current_app.config.get("MODEL_LOADER")
    return jsonify(
        {
            "status": "ok",
            "model_loaded": loader._initialized if loader else False,
        }
    )
