"""
Decision Engine — Uncertainty Analysis & Block/Pass Gate
========================================================
Wraps entropy computation and applies the γ (gamma) threshold rule:

    if H(x) >= gamma  →  BLOCK  (high uncertainty)
    if H(x) <  gamma  →  PASS   (model is confident)
"""

from __future__ import annotations

from typing import Dict, List

import torch

from core.entropy import compute_sequence_entropy


def analyze_uncertainty(
    per_token_logits: List[torch.Tensor],
) -> Dict[str, object]:
    """
    Run the full entropy pipeline on model logits.

    Parameters
    ----------
    per_token_logits : list of [vocab_size] tensors (raw, pre-softmax)

    Returns
    -------
    {
        "entropy":        float,   # mean Shannon entropy across tokens (nats)
        "confidence":     float,   # normalized confidence score 0..1
        "max_entropy":    float,   # theoretical ceiling for this vocab
        "token_entropies": list,   # per-token entropy values
    }
    """
    result = compute_sequence_entropy(per_token_logits)
    return {
        "entropy":        result["mean_entropy"],
        "confidence":     result["confidence"],
        "max_entropy":    result["max_entropy"],
        "token_entropies": result["token_entropies"],
    }


def should_block(entropy: float, gamma: float) -> bool:
    """
    Returns True if the model is too uncertain to return a response.

    Rule: block when H(x) >= γ
    """
    return entropy >= gamma
