"""
KSP Sentinel AI — Google Gemini Inference Provider (Fallback)
"""
import logging
from typing import Dict, List, Tuple
from app.config import GEMINI_API_KEY
from app.providers.base import BaseLLMProvider

log = logging.getLogger("standalone.provider.gemini")


class GeminiProvider(BaseLLMProvider):
    name = "gemini"
    tags = ["free_reasoning", "json_schema"]
    MODEL = "gemini-3.7-flash"

    def __init__(self):
        self._configured = False
        if GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=GEMINI_API_KEY)
                self._genai = genai
                self._configured = True
            except ImportError:
                log.warning("[GeminiProvider] google-generativeai package not installed")

    def is_available(self) -> bool:
        return self._configured

    def complete(self, messages: List[Dict[str, str]], json_mode: bool = False, max_tokens: int = 1000) -> Tuple[str, str]:
        if not self.is_available():
            raise RuntimeError("GeminiProvider is not configured or unavailable")

        # Format system prompt and history
        sys_instructions = [m["content"] for m in messages if m["role"] == "system"]
        sys_text = "\n\n".join(sys_instructions)

        history_contents = []
        for m in messages:
            if m["role"] == "user":
                history_contents.append({"role": "user", "parts": [m["content"]]})
            elif m["role"] == "assistant":
                history_contents.append({"role": "model", "parts": [m["content"]]})

        generation_config = {
            "temperature": 0.2 if json_mode else 0.4,
            "max_output_tokens": max_tokens
        }
        if json_mode:
            generation_config["response_mime_type"] = "application/json"

        model = self._genai.GenerativeModel(
            model_name=self.MODEL,
            system_instruction=sys_text if sys_text else None,
            generation_config=generation_config
        )

        try:
            if history_contents:
                contents = history_contents
            else:
                contents = [{"role": "user", "parts": ["Analyze operational context."]}]
            
            response = model.generate_content(contents, request_options={"timeout": 5})
            return response.text or "", self.name
        except Exception as e:
            log.warning(f"[GeminiProvider] generate_content failed ({e}), raising for upstream fallback.")
            raise e
