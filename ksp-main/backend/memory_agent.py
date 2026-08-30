import logging
from typing import List, Dict, Any
from llm import call_glm

logger = logging.getLogger(__name__)

MEMORY_COMPRESSION_PROMPT = """You are a Memory Agent for the Karnataka State Police (KSP) Sentinel AI Command platform.
Your job is to read the provided multi-turn conversation history between a Police Officer and KSP Sentinel AI, and compress it into a concise 2-3 sentence executive session summary.

CRITICAL INSTRUCTIONS:
1. Preserve key domain entities: districts/cities mentioned, specific crime categories (e.g., POCSO, Robbery, Theft, Cyber Crime), time periods, and the officer's ongoing investigative objective.
2. Do NOT include filler, conversational greetings, or internal system logs.
3. Output ONLY the 2-3 sentence summary directly. No preamble or explanations.
"""

class MemoryAgent:
    """
    Autonomous Memory Agent that maintains long-term session context.
    If conversation history exceeds 6 turns, it compresses the older turns into a
    semantic summary while retaining the most recent turns verbatim.
    """

    @classmethod
    def compress(cls, history: List[Dict[str, str]]) -> List[Dict[str, str]]:
        if not history or not isinstance(history, list):
            return []

        # If history is 6 turns or fewer, pass through verbatim without extra LLM overhead
        if len(history) <= 6:
            logger.info(f"[MemoryAgent] History size {len(history)} <= 6. Passing through verbatim.")
            return history

        logger.info(f"[MemoryAgent] History size {len(history)} > 6. Initiating memory compression.")

        # Take all turns except the last 2 for compression
        turns_to_compress = history[:-2]
        recent_turns = history[-2:]

        # Format history string for compression
        history_str = ""
        for idx, msg in enumerate(turns_to_compress, 1):
            role = "Officer" if msg.get("role") == "user" else "Sentinel AI"
            content = msg.get("content", "").strip()
            history_str += f"{role}: {content}\n"

        messages = [
            {"role": "system", "content": MEMORY_COMPRESSION_PROMPT},
            {"role": "user", "content": f"Compress the following conversation history:\n\n{history_str}"}
        ]

        try:
            response_data = call_glm(messages)
            summary = response_data.get("response", "").strip()

            if '</think>' in summary:
                summary = summary.split('</think>')[-1].strip()

            logger.info(f"[MemoryAgent] Compression successful. Summary: {summary[:80]}...")

            compressed_history = [
                {
                    "role": "system",
                    "content": f"[Session Memory Summary: {summary}]"
                }
            ] + recent_turns

            return compressed_history

        except Exception as e:
            logger.error(f"[MemoryAgent] Compression failed: {e}. Falling back to last 6 turns.")
            return history[-6:]
