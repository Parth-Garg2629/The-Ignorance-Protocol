"""
Entropy Engine — Shannon Entropy Computation
============================================
Converts raw model logits → probabilities → Shannon entropy.

All operations are vectorized PyTorch / NumPy for minimal latency.

Key formulas
------------
Softmax:    p_i = exp(z_i) / Σ exp(z_j)
Entropy:    H   = -Σ p_i * log(p_i)          (natural log → nats)
Confidence: C   = 1 − H / log(vocab_size)     (normalized 0..1)
"""

from __future__ import annotations

from typing import Dict, List

import torch
import torch.nn.functional as F


# ── Core math ────────────────────────────────────────────────────────────────

def _softmax(logits: torch.Tensor) -> torch.Tensor:
    """Convert a 1-D logit tensor to a probability distribution."""
    return F.softmax(logits.float(), dim=-1)


def _token_entropy(probs: torch.Tensor, eps: float = 1e-12) -> float:
    """
    Shannon entropy of a single probability distribution (in nats).
    H = -Σ p * log(p),  with p > eps to avoid log(0).
    """
    p = probs.clamp(min=eps)
    return -(p * p.log()).sum().item()


def _max_entropy(vocab_size: int) -> float:
    """Upper bound: uniform distribution entropy = log(vocab_size)."""
    import math
    return math.log(vocab_size)


# ── Public API ────────────────────────────────────────────────────────────────

def compute_sequence_entropy(
    per_token_logits: List[torch.Tensor],
) -> Dict[str, object]:
    """
    Given a list of per-token raw logit tensors (shape: [vocab_size]),
    compute:

    Returns
    -------
    {
        "token_entropies":  list[float],   # one per generated token
        "mean_entropy":     float,         # average H across tokens
        "max_entropy":      float,         # theoretical ceiling
        "confidence":       float,         # 1 - mean_H / max_H  (0..1)
    }
    """
    if not per_token_logits:
        return {
            "token_entropies": [],
            "mean_entropy": 0.0,
            "max_entropy": 1.0,
            "confidence": 1.0,
        }

    token_entropies: List[float] = []
    vocab_size = per_token_logits[0].shape[0]
    h_max = _max_entropy(vocab_size)

    for logits in per_token_logits:
        probs = _softmax(logits)
        h = _token_entropy(probs)
        token_entropies.append(round(h, 4))

    mean_h = sum(token_entropies) / len(token_entropies)
    confidence = max(0.0, min(1.0, 1.0 - mean_h / h_max))

    return {
        "token_entropies": token_entropies,
        "mean_entropy": round(mean_h, 4),
        "max_entropy": round(h_max, 4),
        "confidence": round(confidence, 4),
    }
