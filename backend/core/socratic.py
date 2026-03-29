"""
Socratic Query Generator
========================
When the entropy gate blocks a response, this module generates a targeted
clarification question to guide the user toward a more answerable prompt.

Strategy
--------
1. Pattern-match the prompt against known ambiguity categories
2. Return a Socratic question that narrows the uncertainty
3. Never guess or hallucinate an answer

Categories
----------
- AMBIGUOUS   : Missing a key specificity (who, what, where, when)
- CONTEXT     : Requires private/domain-specific knowledge
- UNSAFE      : Medical, legal, financial — needs professional verification
- TEMPORAL    : Time-sensitive — data may be outdated
- DEFAULT     : Generic clarification when no category matches
"""

from __future__ import annotations

import re
from typing import Tuple

# ── Category patterns ─────────────────────────────────────────────────────────

_PATTERNS: list[Tuple[str, list[str], str]] = [
    (
        "MEDICAL",
        [
            r"\b(symptom|disease|medication|drug|dosage|side effect|ibuprofen|aspirin|cancer|diabetes|treat|diagnos|cure|pain|fever)\b",
        ],
        (
            "🩺 I detected medical content with high uncertainty. "
            "To give you a safe response, could you clarify:\n"
            "• Are you asking for general educational information, or about a specific patient situation?\n"
            "• Has a licensed healthcare provider already been consulted?\n"
            "• What symptoms or context should I be aware of?"
        ),
    ),
    (
        "LEGAL",
        [
            r"\b(law|legal|lawsuit|court|sue|contract|liability|policy|refund|rights|gdpr|compliance|regulation|attorney|lawyer)\b",
        ],
        (
            "⚖️ This query touches on legal or policy matters where high confidence is required. "
            "Please help me narrow this down:\n"
            "• Which jurisdiction or country does this apply to?\n"
            "• Are you asking about a specific document, agreement, or general law?\n"
            "• What is the specific outcome you're trying to understand?"
        ),
    ),
    (
        "FINANCIAL",
        [
            r"\b(invest|stock|crypto|bitcoin|portfolio|return|revenue|profit|loss|tax|financial|money|fund|market|trade)\b",
        ],
        (
            "📊 I detected financial terminology with elevated uncertainty. "
            "To ensure I give you accurate, relevant information:\n"
            "• Are you asking about a specific company, asset, or market?\n"
            "• What time period are you referencing (current data may differ)?\n"
            "• Is this for educational purposes or a specific financial decision?"
        ),
    ),
    (
        "TEMPORAL",
        [
            r"\b(latest|current|today|now|recent|2024|2025|2026|last (week|month|year)|breaking|news|update)\b",
        ],
        (
            "⏱️ Your query appears to reference recent or time-sensitive information. "
            "Since my knowledge has a training cutoff, could you:\n"
            "• Specify the exact date range you're asking about?\n"
            "• Provide any relevant recent context you already have?\n"
            "• Confirm whether a real-time source (like a news site) would better serve you?"
        ),
    ),
    (
        "AMBIGUOUS_PRONOUN",
        [
            r"\b(it|they|he|she|this|that|these|those|my situation|the thing|the issue)\b",
        ],
        (
            "🔍 Your query contains references I can't resolve without more context. "
            "Could you help me understand:\n"
            "• What specific subject, person, or document are you referring to?\n"
            "• What background information should I know?\n"
            "• What outcome are you hoping for from this query?"
        ),
    ),
    (
        "MISSING_SUBJECT",
        [
            r"^(what should|what would|how should|should i|can i|is it|do i|will it|does it)",
        ],
        (
            "🧭 To give you a confident, accurate answer I need a bit more specificity:\n"
            "• Who or what is the primary subject you're asking about?\n"
            "• What is the relevant context or existing situation?\n"
            "• What is your specific goal or decision you're trying to make?"
        ),
    ),
]

# ── Public API ────────────────────────────────────────────────────────────────

def generate_clarification(prompt: str, entropy: float) -> str:
    """
    Given a blocked prompt and its entropy score, return a Socratic
    clarification question.

    Parameters
    ----------
    prompt  : The original user query that was blocked
    entropy : The computed Shannon entropy (used to calibrate message tone)

    Returns
    -------
    A clarification question string (Markdown-safe)
    """
    lower = prompt.lower().strip()

    for _category, pattern_list, question in _PATTERNS:
        for pattern in pattern_list:
            if re.search(pattern, lower):
                return question

    # Default: high-entropy generic clarification
    confidence_pct = max(0, int((1.0 - entropy / 10.0) * 100))
    return (
        f"🤔 My confidence in answering this query is insufficient "
        f"(H={entropy:.2f} nats, confidence ≈{confidence_pct}%). "
        f"To improve accuracy, please clarify:\n"
        f"• What is the precise topic or subject you're asking about?\n"
        f"• What specific aspect would you like me to address?\n"
        f"• Are there any constraints, context, or examples you can share?"
    )
