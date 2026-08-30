"""
KSP Sentinel AI — Cryptographic Audit Logger (Sec 65B Indian Evidence Act Compliance)
"""
import hashlib
import json
import logging
import threading
import time
from pathlib import Path
from typing import Any, Dict

log = logging.getLogger("standalone.audit")


class AuditLogger:
    """
    Append-only causal chain audit logger.
    Writes structured JSONL logs to audit_trace.jsonl with SHA-256 hash chaining
    for Section 65B Indian Evidence Act admissibility certification.
    """
    def __init__(self, log_path: Path):
        self.log_path = Path(log_path)
        self.last_hash = "GENESIS_BLOCK_00000000000000000000000000000000000000000000000000000000"
        self._lock = threading.Lock()
        self._init_chain()

    def _init_chain(self):
        if self.log_path.exists():
            try:
                with open(self.log_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            data = json.loads(line)
                            if "current_hash" in data:
                                self.last_hash = data["current_hash"]
            except Exception as e:
                log.warning(f"[AuditLogger] Failed to reconstruct genesis hash: {e}")

    def log_event(self, event_type: str, session_id: str, officer_id: str, action: str, details: Dict[str, Any] = None) -> str:
        ts = time.time()
        payload = {
            "timestamp": ts,
            "event_type": event_type,
            "session_id": session_id,
            "officer_id": officer_id,
            "action": action,
            "details": details or {},
            "prev_hash": self.last_hash
        }
        raw_str = json.dumps(payload, sort_keys=True)
        curr_hash = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()
        payload["current_hash"] = curr_hash
        self.last_hash = curr_hash

        with self._lock:
            try:
                self.log_path.parent.mkdir(parents=True, exist_ok=True)
                with open(self.log_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(payload) + "\n")
            except Exception as e:
                log.error(f"[AuditLogger] Failed to write audit event: {e}")

        return curr_hash
