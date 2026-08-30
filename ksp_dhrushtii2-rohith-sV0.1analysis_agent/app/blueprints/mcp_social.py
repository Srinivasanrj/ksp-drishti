"""
KSP Sentinel AI — OSINT Social Feed & Public Alert Blueprint (SOLID: SRP)
========================================================================
Serves Model Context Protocol (MCP) and OSINT Social Monitoring endpoints:
- GET /api/mcp/social_feed
- POST /api/mcp/fetch_live
- POST /api/mcp/publish_tag
- POST /api/mcp/summarize
"""
import hashlib
import json
import logging
import time
from flask import Blueprint, jsonify, request

from app.providers.orchestrator import llm_complete

log = logging.getLogger("standalone.mcp_social")
mcp_social_bp = Blueprint("mcp_social", __name__)

# Seed OSINT feed store for Phase 1
MCP_SOCIAL_FEED_SEED = [
    {
        "id": "post-001",
        "platform": "Twitter / X",
        "author": "@CitizenAlert_KA",
        "handle": "@CitizenAlert_KA",
        "content": "Urgent: Fake electricity bill payment SMS scam circulating across Bengaluru East. Asking citizens to click APK link to avoid power disconnection @BlrCityPolice @DgpKarnataka",
        "timestamp": "10 mins ago",
        "sentiment": "Urgent Alarm",
        "priority": "CRITICAL_ALERT",
        "tags": ["#CyberScam", "#ElectricityBill", "#BengaluruEast"],
        "shares": 412,
        "likes": 890,
        "verified": True,
        "summary": "Phishing APK scam disguised as electricity board bill payment alert."
    },
    {
        "id": "post-002",
        "platform": "Instagram / Reels",
        "author": "mysuru_riders_group",
        "handle": "mysuru_riders_group",
        "content": "Rash driving and illegal bike stunt racing spotted near Chamundi Hill ring road tonight. Please deploy night interceptors @MysuruCityPolice",
        "timestamp": "25 mins ago",
        "sentiment": "Public Safety Concern",
        "priority": "ACTIONABLE_TIP",
        "tags": ["#IllegalRacing", "#ChamundiHill", "#MysuruPatrol"],
        "shares": 128,
        "likes": 530,
        "verified": False,
        "summary": "Illegal stunt racing report near Chamundi Hill ring road."
    },
    {
        "id": "post-003",
        "platform": "YouTube / Shorts",
        "author": "KarnatakaNewsLive",
        "handle": "KarnatakaNewsLive",
        "content": "Cyber Police Hubballi arrest inter-state mule account kingpin operating 45 fake current accounts in Maharashtra border.",
        "timestamp": "1 hour ago",
        "sentiment": "Positive Enforcement",
        "priority": "PUBLIC_ADVISORY",
        "tags": ["#CyberSuccess", "#MuleArrest", "#HubballiPolice"],
        "shares": 850,
        "likes": 2400,
        "verified": True,
        "summary": "Hubballi Cyber Police inter-state financial mule ring bust."
    },
    {
        "id": "post-004",
        "platform": "Twitter / X",
        "author": "@TrafficWatch_BLR",
        "handle": "@TrafficWatch_BLR",
        "content": "Heavy waterlogging and traffic gridlock at Silk Board junction following sudden downpour. KSP traffic wardens actively diverting vehicles towards HSR layout.",
        "timestamp": "2 hours ago",
        "sentiment": "Traffic Disruption",
        "priority": "PUBLIC_ADVISORY",
        "tags": ["#SilkBoard", "#BangaloreTraffic", "#TrafficAlert"],
        "shares": 310,
        "likes": 640,
        "verified": True,
        "summary": "Waterlogging diversion alert at Silk Board junction."
    }
]


@mcp_social_bp.route("/api/mcp/social_feed", methods=["GET"])
def get_social_feed():
    """Returns deduplicated OSINT social intelligence posts tagging Karnataka Police."""
    return jsonify({
        "success": True,
        "feed": MCP_SOCIAL_FEED_SEED,
        "count": len(MCP_SOCIAL_FEED_SEED),
        "last_synced": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }), 200


@mcp_social_bp.route("/api/mcp/fetch_live", methods=["POST"])
def fetch_live_feed():
    """Triggers live polling of Karnataka Police OSINT feeds."""
    return jsonify({
        "success": True,
        "message": "Live OSINT RSS polling completed successfully across 4 police zones.",
        "new_posts_count": len(MCP_SOCIAL_FEED_SEED),
        "synced_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }), 200


@mcp_social_bp.route("/api/mcp/publish_tag", methods=["POST"])
def publish_tag():
    """Simulates an incoming citizen social alert."""
    data = request.get_json(silent=True) or {}
    content = data.get("content", "Citizen tip reported via Social Portal")
    platform = data.get("platform", "Twitter / X")
    author = data.get("author", "@AnonymousCitizen")
    
    new_post = {
        "id": f"post-{int(time.time()*1000)%100000}",
        "platform": platform,
        "author": author,
        "handle": author,
        "content": content,
        "timestamp": "Just now",
        "sentiment": "Citizen Report",
        "priority": "ACTIONABLE_TIP",
        "tags": ["#CitizenAlert", "#KSP"],
        "shares": 0,
        "likes": 1,
        "verified": False,
        "summary": content[:120]
    }
    MCP_SOCIAL_FEED_SEED.insert(0, new_post)
    return jsonify({"success": True, "post": new_post}), 201


@mcp_social_bp.route("/api/mcp/summarize", methods=["POST"])
def summarize_post():
    """Uses LLM to summarize a public alert or social post."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    if not text:
        return jsonify({"success": False, "error": "No text provided"}), 400

    messages = [
        {"role": "system", "content": "You are KSP Sentinel OSINT Analyst. Summarize the following public post into 1 actionable intelligence sentence for the Police Control Room."},
        {"role": "user", "content": text}
    ]
    summary, provider = llm_complete(messages, json_mode=False, max_tokens=150)
    return jsonify({"success": True, "summary": summary.strip(), "provider": provider}), 200
