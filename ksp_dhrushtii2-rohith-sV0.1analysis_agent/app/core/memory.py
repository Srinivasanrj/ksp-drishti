"""
KSP Sentinel AI — Autonomous Session Memory & History Manager (SOLID: SRP)
==========================================================================
Maintains long-term session context by storing stateful conversation history
in the officer's isolated DuckDB session store and semantically compressing
dialogue that exceeds the configured sliding window.
"""
import json
import logging
import time
from typing import Any, Dict, List, Optional, Tuple

from app.config import (
    ENABLE_MEMORY_COMPRESSION,
    KSP_MEMORY_PROMPT,
    MEMORY_COMPRESS_THRESHOLD,
    MEMORY_WINDOW_SIZE,
)
from app.engine.session_store import session_store
from app.providers.orchestrator import llm_reasoning_complete

log = logging.getLogger("standalone.memory")


class MemoryAgent:
    """
    SRP: Manages stateful conversation turns and context compression within a session.
    Thread-safe and session-isolated via DuckDB.
    """

    @classmethod
    def init_memory_table(cls, session_id: str):
        """Ensures the session_memory table exists in the session's DuckDB store with all columns."""
        try:
            con = session_store.get_connection(session_id)
            con.execute("""
                CREATE TABLE IF NOT EXISTS session_memory (
                    session_id VARCHAR PRIMARY KEY,
                    summary TEXT,
                    turn_count INTEGER,
                    updated_at VARCHAR,
                    history_json TEXT,
                    last_agent_type VARCHAR
                )
            """)
            # Safe migrations if the table was created earlier without the new columns
            try:
                con.execute("ALTER TABLE session_memory ADD COLUMN IF NOT EXISTS history_json TEXT")
            except Exception:
                pass
            try:
                con.execute("ALTER TABLE session_memory ADD COLUMN IF NOT EXISTS last_agent_type VARCHAR")
            except Exception:
                pass
        except Exception as e:
            log.warning(f"[MemoryAgent] Could not initialize session_memory table: {e}")

    @classmethod
    def get_session_history(cls, session_id: str) -> Tuple[List[Dict[str, Any]], Optional[str], Optional[str]]:
        """
        Retrieves the stateful message history, active memory summary, and last agent type.
        Returns: (history_list, memory_summary, last_agent_type)
        """
        if not session_id:
            return [], None, None
        try:
            cls.init_memory_table(session_id)
            con = session_store.get_connection(session_id)
            row = con.execute(
                "SELECT history_json, summary, last_agent_type FROM session_memory WHERE session_id = ?",
                [session_id]
            ).fetchone()

            if not row:
                return [], None, None

            raw_history_json, summary, last_agent_type = row[0], row[1], row[2]
            history: List[Dict[str, Any]] = []
            if raw_history_json:
                try:
                    history = json.loads(raw_history_json)
                except Exception as je:
                    log.warning(f"[MemoryAgent] Failed to deserialize history_json for '{session_id}': {je}")

            return history, summary or None, last_agent_type or None
        except Exception as e:
            log.warning(f"[MemoryAgent] Error fetching session history for '{session_id}': {e}")
            return [], None, None

    @classmethod
    def save_session_turn(
        cls,
        session_id: str,
        role: str,
        content: str,
        agent_type: Optional[str] = None
    ):
        """
        Appends a conversation turn to the stateful history in DuckDB and updates last_agent_type.
        Automatically triggers semantic compression if turn count exceeds the threshold.
        """
        if not session_id or not content:
            return
        try:
            cls.init_memory_table(session_id)
            history, summary, last_agent = cls.get_session_history(session_id)

            new_turn = {
                "role": role,
                "content": content,
                "agent_type": agent_type or last_agent or "CONVERSATIONAL",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            history.append(new_turn)

            effective_last_agent = agent_type if agent_type else last_agent

            # Compression trigger if history exceeds window threshold
            if ENABLE_MEMORY_COMPRESSION and len(history) > MEMORY_COMPRESS_THRESHOLD:
                try:
                    history, summary = cls._compress_old_turns(session_id, history, summary)
                except Exception as ce:
                    log.error(f"[MemoryAgent] Semantic compression failed: {ce}", exc_info=True)

            con = session_store.get_connection(session_id)
            now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            con.execute("""
                INSERT OR REPLACE INTO session_memory (session_id, summary, turn_count, updated_at, history_json, last_agent_type)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [session_id, summary, len(history), now_str, json.dumps(history), effective_last_agent])

            log.info(f"[MemoryAgent] Saved turn for '{session_id}' [{role}|agent:{effective_last_agent}] Total turns: {len(history)}")
        except Exception as e:
            log.warning(f"[MemoryAgent] Error saving session turn: {e}", exc_info=True)

    @classmethod
    def _compress_old_turns(
        cls,
        session_id: str,
        history: List[Dict[str, Any]],
        existing_summary: Optional[str]
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Compresses turns older than the recent 4 turns into an updated summary.
        Preserves critical investigation entities.
        """
        if len(history) <= 4:
            return history, existing_summary

        turns_to_compress = history[:-4]
        recent_turns = history[-4:]

        history_str = ""
        if existing_summary:
            history_str += f"Prior Investigation Baseline: {existing_summary}\n\n"

        for msg in turns_to_compress:
            role_label = "Officer" if msg.get("role") == "user" else "KSP Sentinel AI"
            cnt = str(msg.get("content") or "").strip()
            if cnt:
                history_str += f"{role_label}: {cnt}\n"

        if not history_str.strip():
            return history, existing_summary

        log.info(f"[MemoryAgent] Compressing {len(turns_to_compress)} turns for session '{session_id}'...")

        messages = [
            {"role": "system", "content": KSP_MEMORY_PROMPT},
            {
                "role": "user",
                "content": (
                    "Compress the following police investigation conversation into a 2-3 sentence rolling summary. "
                    "Explicitly preserve suspect names, locations, crime categories, FIR numbers, and key directives:\n\n"
                    f"{history_str}"
                )
            }
        ]

        summary, _ = llm_reasoning_complete(messages, json_mode=False, max_tokens=250)
        summary = summary.strip()
        if "</think>" in summary:
            summary = summary.split("</think>")[-1].strip()

        log.info(f"[MemoryAgent] New rolling memory summary generated: '{summary[:80]}...'")
        return recent_turns, summary

    @classmethod
    def get_memory_summary(cls, session_id: str) -> Optional[str]:
        """Backward-compatible summary getter."""
        _, summary, _ = cls.get_session_history(session_id)
        return summary

    @classmethod
    def save_memory_summary(cls, session_id: str, summary: str, turn_count: int):
        """Backward-compatible summary setter."""
        if not session_id or not summary:
            return
        try:
            cls.init_memory_table(session_id)
            con = session_store.get_connection(session_id)
            now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            con.execute("""
                INSERT OR REPLACE INTO session_memory (session_id, summary, turn_count, updated_at, history_json, last_agent_type)
                VALUES (?, ?, ?, ?, COALESCE((SELECT history_json FROM session_memory WHERE session_id = ?), '[]'), COALESCE((SELECT last_agent_type FROM session_memory WHERE session_id = ?), 'CONVERSATIONAL'))
            """, [session_id, summary, turn_count, now_str, session_id, session_id])
        except Exception as e:
            log.warning(f"[MemoryAgent] Error saving memory summary: {e}")

    @classmethod
    def compress_history(cls, session_id: str, history: List[Dict[str, str]]) -> Tuple[List[Dict[str, str]], Optional[str]]:
        """Legacy helper maintained for backward compatibility."""
        stored_history, summary, _ = cls.get_session_history(session_id)
        if stored_history:
            return stored_history, summary
        return history, summary
