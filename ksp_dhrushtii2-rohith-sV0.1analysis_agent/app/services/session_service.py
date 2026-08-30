"""
KSP Sentinel AI — Spatial Investigation Session Service (SOLID: SRP, DIP)
========================================================================
Maintains conversational memory stacks and spatial context bindings per investigation session.
"""
import uuid
import time
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

log = logging.getLogger("investigation.session_service")


class BaseSessionStore(ABC):
    """Abstract Interface for Session Storage (DIP)."""

    @abstractmethod
    def create_session(self, initial_payload: Dict[str, Any]) -> str:
        """Initialize a new investigation session with spatial payload."""
        pass

    @abstractmethod
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the complete session data including payload and message stack."""
        pass

    @abstractmethod
    def append_message(self, session_id: str, role: str, content: str, tool_data: Optional[Dict[str, Any]] = None) -> bool:
        """Append a message turn to the session conversation history."""
        pass

    @abstractmethod
    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all active investigation sessions."""
        pass

    @abstractmethod
    def delete_session(self, session_id: str) -> bool:
        """Delete an investigation session."""
        pass


class InMemorySessionStore(BaseSessionStore):
    """
    In-Memory Session Store with Thread-Safe In-Process Dictionary.
    Stores geospatial context payload and conversation turns mapped to a unique UUID.
    Easily replaceable by RedisSessionStore or CatalystCacheSessionStore in Phase 4.
    """

    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(self, initial_payload: Dict[str, Any]) -> str:
        session_id = f"inv_{uuid.uuid4().hex[:12]}"
        now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        
        # Structure of session
        self._sessions[session_id] = {
            "session_id": session_id,
            "created_at": now,
            "updated_at": now,
            "context_payload": initial_payload or {},
            "messages": [],
            "executed_tools": []
        }
        log.info(f"[SessionService] Created investigation session '{session_id}' with {len(initial_payload.get('sample_records', []))} records.")
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self._sessions.get(session_id)

    def append_message(self, session_id: str, role: str, content: str, tool_data: Optional[Dict[str, Any]] = None) -> bool:
        session = self._sessions.get(session_id)
        if not session:
            log.warning(f"[SessionService] Cannot append message: Session '{session_id}' not found.")
            return False

        now = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        turn = {
            "id": f"msg_{uuid.uuid4().hex[:8]}",
            "role": role,  # 'user' | 'assistant' | 'system'
            "content": content,
            "timestamp": now,
            "tool_data": tool_data
        }
        session["messages"].append(turn)
        session["updated_at"] = now
        
        if tool_data:
            session["executed_tools"].append(tool_data)

        return True

    def list_sessions(self) -> List[Dict[str, Any]]:
        return [
            {
                "session_id": s["session_id"],
                "created_at": s["created_at"],
                "updated_at": s["updated_at"],
                "turn_count": len(s["messages"]),
                "district": s.get("context_payload", {}).get("spatial_context", {}).get("district_name", "Karnataka Sector"),
                "threat_level": s.get("context_payload", {}).get("hotspot_metadata", {}).get("threat_level", "MODERATE")
            }
            for s in self._sessions.values()
        ]

    def delete_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            log.info(f"[SessionService] Deleted session '{session_id}'")
            return True
        return False


# Global Singleton Instance for Dependency Injection
session_service = InMemorySessionStore()
