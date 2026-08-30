import json
import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from server import app

client = app.test_client()

print("=" * 80)
print("1. TEST: POST /chat (PatternAgent Interrogation Dilemma)")
print("=" * 80)
chat_res = client.post("/chat", json={
    "query": "Suspect Ramesh claims he was at Indiranagar hotel at 2 AM, but witness notes say he was at Koramangala. How should I interrogate him?",
    "history": [],
    "session_id": "live_test_session_001",
    "division": "Bengaluru Division"
})
chat_data = chat_res.get_json()
print(f"HTTP Status: {chat_res.status_code}")
print(f"Agent Type: {chat_data.get('agent_type')}")
print(f"Agent Label: {chat_data.get('agent_label')}")
print(f"Provider: {chat_data.get('provider')}")
print("Response Text:")
print(chat_data.get('answer'))
print()

print("=" * 80)
print("2. TEST: POST /api/transcribe (Audio / Narrative to BNS/IPC Legal Mapping)")
print("=" * 80)
trans_res = client.post("/api/transcribe", json={
    "text": "Mr. Ramesh Kumar stole my mobile phone and gold chain in Koramangala during November 2025."
})
trans_data = trans_res.get_json()
print(f"HTTP Status: {trans_res.status_code}")
print(f"Crime Category: {trans_data.get('crime_category')}")
print(f"Locations Detected: {trans_data.get('locations')}")
print(f"Suspects Detected: {trans_data.get('suspects')}")
print(f"BNS / IPC Sections Mapped: {json.dumps(trans_data.get('bns_sections'), indent=2)}")
print(f"Investigative Summary: {trans_data.get('investigative_summary')}")
print()

print("=" * 80)
print("3. TEST: GET /api/analytics (Dashboard Statistics)")
print("=" * 80)
ana_res = client.get("/api/analytics")
ana_data = ana_res.get_json()
print(f"HTTP Status: {ana_res.status_code}")
print(f"Total Cases: {ana_data.get('total_cases')}")
print(f"Recovery Rate: {ana_data.get('recovery_rate_pct')}%")
print(f"Annual Trend Sample: {ana_data.get('annual_trend')[:3]}")
print(f"Category Breakdown Sample: {ana_data.get('category_breakdown')[:3]}")
print()

print("=" * 80)
print("4. TEST: GET /api/map_markers (Geospatial Pins)")
print("=" * 80)
map_res = client.get("/api/map_markers")
map_data = map_res.get_json()
print(f"HTTP Status: {map_res.status_code}")
print(f"Markers Count: {map_data.get('count')}")
print(f"First 2 Sector Pins: {json.dumps(map_data.get('markers')[:2], indent=2)}")
print()

print("=" * 80)
print("5. TEST: POST & GET /api/complaints (Citizen e-Portal & Filter)")
print("=" * 80)
comp_post = client.post("/api/complaints", json={
    "citizen_name": "Deepak Gowda",
    "phone": "+91 99001 22334",
    "station": "Indiranagar Police Station",
    "district": "Bengaluru Urban",
    "category": "Cyber Phishing",
    "description": "Lost ₹50,000 in fake investment scheme."
})
print(f"POST Status: {comp_post.status_code}, Ack No: {comp_post.get_json().get('acknowledgement_number')}")

comp_get = client.get("/api/complaints?station=indiranagar")
print(f"GET (Indiranagar Filter) Count: {comp_get.get_json().get('count')}")
print(f"Sample Complaint: {json.dumps(comp_get.get_json().get('complaints')[0], indent=2)}")
print()

print("=" * 80)
print("6. TEST: GET /api/mcp/social_feed (OSINT Live Intelligence)")
print("=" * 80)
mcp_res = client.get("/api/mcp/social_feed")
mcp_data = mcp_res.get_json()
print(f"HTTP Status: {mcp_res.status_code}")
print(f"Feed Count: {mcp_data.get('count')}")
print(f"Top Alert: {json.dumps(mcp_data.get('feed')[0], indent=2)}")
print("=" * 80)
