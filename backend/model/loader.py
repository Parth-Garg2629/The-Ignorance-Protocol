"""
Model Loader — Singleton HuggingFace Model + Tokenizer
=======================================================
Loads model once and caches it in memory.
Returns (generated_text, all_scores) where all_scores is a list of
per-token logit tensors (shape: [vocab_size]) for entropy computation.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Tuple, List, Optional

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, GenerationConfig

logger = logging.getLogger(__name__)


class ModelLoader:
    """Thread-safe singleton model loader with lazy initialization."""

    _instance: Optional["ModelLoader"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "ModelLoader":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def _initialize(self, model_name: str, device: str) -> None:
        if self._initialized:
            return

        logger.info(f"Loading model '{model_name}' on device '{device}' …")
        start = time.time()

        self.tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            use_fast=True,
        )
        # Ensure pad token is set (required for batched generation)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float32,   # float16 only on GPU
        ).to(device)
        self.model.eval()

        self.device = device
        self.model_name = model_name
        self._initialized = True

        elapsed = time.time() - start
        logger.info(f"Model ready in {elapsed:.1f}s")

    def load(self, model_name: str, device: str) -> "ModelLoader":
        """Ensure the model is loaded (idempotent)."""
        if not self._initialized:
            self._initialize(model_name, device)
        return self

    # ── Inference ─────────────────────────────────────────────────────────────

    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 150,
    ) -> Tuple[str, List[torch.Tensor]]:
        """
        Generate a response and return (text, per_token_logits).

        per_token_logits: list of [vocab_size] tensors, one per generated token.
        These are RAW logits (pre-softmax) — the entropy engine handles softmax.
        """
        if not self._initialized:
            raise RuntimeError("Model not loaded. Call .load() first.")

        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=512,
        ).to(self.device)

        with torch.no_grad():
            output = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                output_scores=True,        # ← returns per-token logits
                return_dict_in_generate=True,
                pad_token_id=self.tokenizer.pad_token_id,
            )

        # Decode only the newly generated tokens (strip prompt)
        input_len = inputs["input_ids"].shape[1]
        new_tokens = output.sequences[0][input_len:]
        generated_text = self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()

        # output.scores: tuple of (vocab_size,) tensors, one per generated token
        per_token_logits: List[torch.Tensor] = [s[0].cpu() for s in output.scores]

        return generated_text, per_token_logits


# Module-level convenience instance
model_loader = ModelLoader()
