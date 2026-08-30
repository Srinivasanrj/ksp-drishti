"""
KSP Sentinel AI — LLM Provider Abstract Interface (SOLID: DIP)
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Tuple
from app.core.interfaces import ILLMProvider


class BaseLLMProvider(ILLMProvider):
    """
    DIP / OCP: Abstract base contract for all inference providers.
    New providers (e.g. Anthropic, Zoho QuickML, Local Ollama) can be plugged in
    without modifying agent or routing code.
    """
    name: str = "base"
    tags: List[str] = []

    @abstractmethod
    def complete(self, messages: List[Dict[str, str]], json_mode: bool = False, max_tokens: int = 1000) -> Tuple[str, str]:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass
