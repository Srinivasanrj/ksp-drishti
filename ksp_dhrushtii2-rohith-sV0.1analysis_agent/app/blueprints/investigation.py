"""
KSP Sentinel AI — Spatial AI Investigation Blueprint (SOLID: SRP, OCP)
======================================================================
REST API endpoints managing the handoff from Geospatial Maps to AI Chatbot.
"""
import logging
from flask import Blueprint, jsonify, request

from app.services.session_service import session_service
from app.services.zoho_integration_service import zoho_service
from app.services.agent_service import agent_orchestrator

log = logging.getLogger("blueprint.investigation")

investigation_bp = Blueprint("investigation", __name__, url_prefix="/api/investigation")


@investigation_bp.route("/init", methods=["POST"])
def init_investigation():
    """
    Initializes a stateful investigation session from a Map Dossier click.
    Accepts: { spatial_context, hotspot_metadata, sample_records }
    Returns: { success, session_id, greeting, summary }
    """
    try:
        data = request.get_json(silent=True) or {}
        session_id = session_service.create_session(data)
        greeting = agent_orchestrator.initialize_session_briefing(session_id)
        
        spatial = data.get("spatial_context", {})
        hotspot = data.get("hotspot_metadata", {})
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "greeting": greeting,
            "district": spatial.get("district_name", "Karnataka Sector"),
            "threat_level": hotspot.get("threat_level", "HIGH"),
            "incident_count": hotspot.get("incident_count", 0),
            "primary_crimes": hotspot.get("primary_crimes", []),
            "message": f"Investigation session '{session_id}' initialized with spatial context."
        }), 201
    except Exception as e:
        log.error(f"[Investigation Init Error] {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@investigation_bp.route("/chat", methods=["POST"])
def chat_investigation():
    """
    Processes an officer query in an active investigation session.
    Accepts: { session_id, message }
    Returns: { success, response, tool_executions, session_id }
    """
    try:
        data = request.get_json(silent=True) or {}
        session_id = data.get("session_id")
        user_message = data.get("message", "").strip()

        if not session_id or not user_message:
            return jsonify({"success": False, "error": "session_id and message are required"}), 400

        response_text, tool_executions = agent_orchestrator.execute_chat_turn(session_id, user_message)

        return jsonify({
            "success": True,
            "session_id": session_id,
            "response": response_text,
            "tool_executions": tool_executions
        }), 200
    except Exception as e:
        log.error(f"[Investigation Chat Error] {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@investigation_bp.route("/session/<session_id>", methods=["GET"])
def get_session_details(session_id: str):
    """Retrieves full conversational turns and context for a session."""
    session = session_service.get_session(session_id)
    if not session:
        return jsonify({"success": False, "error": f"Session '{session_id}' not found"}), 404
        
    return jsonify({
        "success": True,
        "session": session
    }), 200


@investigation_bp.route("/tickets", methods=["GET"])
def get_zoho_tickets():
    """Returns all logged Zoho Desk priority tickets."""
    try:
        tickets = zoho_service.list_tickets()
        return jsonify({
            "success": True,
            "count": len(tickets),
            "tickets": tickets
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@investigation_bp.route("/suspects", methods=["GET"])
def get_zoho_suspects():
    """Returns Zoho CRM repeat offender profiles for a district."""
    try:
        district = request.args.get("district")
        category = request.args.get("category")
        suspects = zoho_service.query_crm_suspects(district=district, crime_category=category)
        return jsonify({
            "success": True,
            "count": len(suspects),
            "suspects": suspects
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
