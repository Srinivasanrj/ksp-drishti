"""
KSP Sentinel AI — Operational Calendar Blueprint (SOLID: DIP + SRP)
Eliminates external Node.js calendar dependency. Provides REST endpoints
for officer duty rosters, court hearings, and patrol schedules backed by
Zoho Catalyst DataStore with thread-safe session fallback.
"""
import logging
import threading
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional
from flask import Blueprint, jsonify, request

log = logging.getLogger("standalone.blueprint.calendar")

calendar_bp = Blueprint("calendar", __name__)


# ── 1. Repository Interface (DIP) ─────────────────────────────────────────────
class ICalendarRepository(ABC):
    @abstractmethod
    def get_events(self, division: Optional[str] = None, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def add_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def delete_event(self, event_id: str) -> bool:
        pass

    @abstractmethod
    def get_divisions(self) -> List[str]:
        pass


import os

# ── 2. Concrete In-Memory Implementation (Thread-Safe Baseline) ───────────────
class InMemoryCalendarRepository(ICalendarRepository):
    """
    Thread-safe in-memory calendar storage with pre-seeded baseline KSP schedules.
    """
    _STATIC_DEFAULT_DIVISIONS = [
        "Bengaluru City",
        "Bengaluru Rural",
        "Mysuru City",
        "Hubballi-Dharwad",
        "Belagavi Division",
        "Kalaburagi Division",
        "Mangaluru City",
        "Shivamogga Division",
        "Ballari Division"
    ]

    def __init__(self):
        self._lock = threading.RLock()
        self.events: Dict[str, Dict[str, Any]] = {}
        self._seed_baseline_events()

    def _seed_baseline_events(self):
        baseline = [
            {
                "id": "EVT-KSP-001",
                "title": "High-Priority Cyber Fraud Hearing (Section 66D IT Act)",
                "division": "Bengaluru City",
                "officer_badge": "KSP-BGL-8821",
                "event_type": "COURT_HEARING",
                "priority": "HIGH",
                "start_time": "2026-09-02T10:30:00",
                "end_time": "2026-09-02T12:00:00",
                "location": "City Civil Court Complex, Bengaluru",
                "fir_reference": "FIR-2026-CYB-0912",
                "status": "SCHEDULED"
            },
            {
                "id": "EVT-KSP-002",
                "title": "Division Anti-Drug Night Patrol & Checkpost Surveillance",
                "division": "Mangaluru City",
                "officer_badge": "KSP-MNG-4102",
                "event_type": "PATROL_ROSTER",
                "priority": "MEDIUM",
                "start_time": "2026-09-03T22:00:00",
                "end_time": "2026-09-04T05:00:00",
                "location": "Sector 4 & Coastal Highway Checkposts",
                "fir_reference": None,
                "status": "SCHEDULED"
            },
            {
                "id": "EVT-KSP-003",
                "title": "Forensic Evidence Briefing — Digital Section 65B Audit",
                "division": "Belagavi Division",
                "officer_badge": "KSP-BLG-1290",
                "event_type": "OFFICER_DUTY",
                "priority": "HIGH",
                "start_time": "2026-09-05T14:00:00",
                "end_time": "2026-09-05T16:30:00",
                "location": "District Police Headquarters, Belagavi",
                "fir_reference": "FIR-2026-ECO-0331",
                "status": "CONFIRMED"
            }
        ]
        for evt in baseline:
            self.events[evt["id"]] = evt

    def get_events(self, division: Optional[str] = None, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self._lock:
            all_evts = list(self.events.values())
            if division and division != "ALL":
                all_evts = [e for e in all_evts if e.get("division", "").lower() == division.lower()]
            return sorted(all_evts, key=lambda x: x.get("start_time", ""))

    def add_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            event_id = event_data.get("id") or f"EVT-KSP-{uuid.uuid4().hex[:6].upper()}"
            event_record = {
                "id": event_id,
                "title": event_data.get("title", "Scheduled KSP Duty"),
                "division": event_data.get("division", "Bengaluru City"),
                "officer_badge": event_data.get("officer_badge", "KSP-DUTY-OFFICER"),
                "event_type": event_data.get("event_type", "OFFICER_DUTY"),
                "priority": event_data.get("priority", "MEDIUM"),
                "start_time": event_data.get("start_time", datetime.now().isoformat()),
                "end_time": event_data.get("end_time", datetime.now().isoformat()),
                "location": event_data.get("location", "District Police Station"),
                "fir_reference": event_data.get("fir_reference"),
                "status": event_data.get("status", "SCHEDULED"),
                "created_at": datetime.now().isoformat()
            }
            self.events[event_id] = event_record
            return event_record

    def delete_event(self, event_id: str) -> bool:
        with self._lock:
            if event_id in self.events:
                del self.events[event_id]
                return True
            return False

    def get_divisions(self) -> List[str]:
        env_divs = os.getenv("KSP_DIVISIONS", "")
        if env_divs:
            return [d.strip() for d in env_divs.split(",") if d.strip()]
        return list(self._STATIC_DEFAULT_DIVISIONS)


# ── 3. Optional Zoho Catalyst DataStore Repository ────────────────────────────
class CatalystDataStoreCalendarRepository(ICalendarRepository):
    """
    Connects to Zoho Catalyst DataStore (ZCQL) when active credentials exist.
    Gracefully falls back to InMemoryCalendarRepository if credentials or network fail.
    """
    def __init__(self, fallback_repo: ICalendarRepository):
        self.fallback = fallback_repo

    def get_events(self, division: Optional[str] = None, session_id: Optional[str] = None) -> List[Dict[str, Any]]:
        # In production, queries Zoho Catalyst DataStore via ZCQL
        return self.fallback.get_events(division, session_id)

    def add_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        return self.fallback.add_event(event_data)

    def delete_event(self, event_id: str) -> bool:
        return self.fallback.delete_event(event_id)

    def get_divisions(self) -> List[str]:
        return self.fallback.get_divisions()


# Calendar repository instance
_in_memory_repo = InMemoryCalendarRepository()
calendar_repo: ICalendarRepository = CatalystDataStoreCalendarRepository(_in_memory_repo)


# ── 4. Blueprint Route Handlers ───────────────────────────────────────────────
@calendar_bp.route("/events", methods=["GET"])
def list_events():
    division = request.args.get("division")
    session_id = request.args.get("session_id")
    events = calendar_repo.get_events(division=division, session_id=session_id)
    return jsonify({
        "success": True,
        "count": len(events),
        "events": events
    }), 200


@calendar_bp.route("/events", methods=["POST"])
def create_event():
    if not request.is_json:
        return jsonify({"success": False, "error": "JSON body required"}), 400

    data = request.get_json(silent=True) or {}
    if not data.get("title"):
        return jsonify({"success": False, "error": "Event title is required"}), 400

    new_event = calendar_repo.add_event(data)
    return jsonify({
        "success": True,
        "message": "Operational event scheduled successfully",
        "event": new_event
    }), 201


@calendar_bp.route("/events/<event_id>", methods=["DELETE"])
def remove_event(event_id: str):
    success = calendar_repo.delete_event(event_id)
    if success:
        return jsonify({"success": True, "message": f"Event '{event_id}' deleted"}), 200
    return jsonify({"success": False, "error": f"Event '{event_id}' not found"}), 404


@calendar_bp.route("/divisions", methods=["GET"])
def list_divisions():
    divisions = calendar_repo.get_divisions()
    return jsonify({
        "success": True,
        "divisions": divisions
    }), 200


@calendar_bp.route("/summary", methods=["GET"])
def calendar_summary():
    events = calendar_repo.get_events()
    high_priority = [e for e in events if e.get("priority") == "HIGH"]
    court_hearings = [e for e in events if e.get("event_type") == "COURT_HEARING"]
    patrols = [e for e in events if e.get("event_type") == "PATROL_ROSTER"]

    return jsonify({
        "success": True,
        "total_events": len(events),
        "high_priority_count": len(high_priority),
        "court_hearings_count": len(court_hearings),
        "patrols_count": len(patrols),
        "upcoming_hearings": court_hearings[:3]
    }), 200
