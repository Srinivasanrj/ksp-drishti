"""
KSP Sentinel AI — Groq Inference Provider (Primary)
"""
import logging
from typing import Dict, List, Tuple
from app.config import GROQ_API_KEY
from app.providers.base import BaseLLMProvider

log = logging.getLogger("standalone.provider.groq")


class GroqProvider(BaseLLMProvider):
    name = "groq"
    tags = ["free_reasoning", "json_schema"]
    MODELS = ["qwen/qwen3.8-27b", "qwen/qwen3.6-27b", "openai/gpt-oss-120b"]

    def __init__(self):
        self._client = None
        if GROQ_API_KEY:
            try:
                from groq import Groq
                self._client = Groq(api_key=GROQ_API_KEY, timeout=15.0)
            except ImportError:
                log.warning("[GroqProvider] groq package not installed")

    def is_available(self) -> bool:
        return self._client is not None

    def complete(self, messages: List[Dict[str, str]], json_mode: bool = False, max_tokens: int = 2500) -> Tuple[str, str]:
        if not self.is_available():
            raise RuntimeError("GroqProvider is not configured or unavailable")

        last_err = None
        for m_name in self.MODELS:
            try:
                kwargs = {
                    "model": m_name,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": 0.2 if json_mode else 0.4
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}

                response = self._client.chat.completions.create(**kwargs)
                content = response.choices[0].message.content or ""
                return content, self.name
            except Exception as e:
                log.warning(f"[GroqProvider] Model {m_name} failed: {e}")
                last_err = e

        raise last_err or RuntimeError("All Groq models failed")
