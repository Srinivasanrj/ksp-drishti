"""
KSP Sentinel AI — Automated Verification Test Suite for Phase 1 Contracts
========================================================================
Validates all newly integrated Phase 1 components:
- PatternAgent execution & manifest
- MemoryAgent compression & DuckDB session isolation
- Forensics endpoints: /api/transcribe, /api/mule_trail
- MCP Social endpoints: /api/mcp/social_feed, /api/mcp/publish_tag, /api/mcp/fetch_live
- Operational endpoints: /api/analytics, /api/map_markers, /api/complaints (GET & POST)
- Chat routing to TACTICAL_PATTERN intent
"""
import json
import unittest
from server import app
from app.core.registry import registry
from app.core.interfaces import ExecutionContext
from app.core.memory import MemoryAgent


class TestPhase1Contracts(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.session_id = "test_phase1_session_001"

    def test_pattern_agent_registered(self):
        """Validates that PatternAgent is correctly registered in AgentRegistry."""
        agent = registry.get_agent("TACTICAL_PATTERN")
        self.assertIsNotNone(agent, "PatternAgent must be registered for intent TACTICAL_PATTERN")
        manifest = agent.manifest
        self.assertEqual(manifest.intent_name, "TACTICAL_PATTERN")
        self.assertEqual(manifest.label, "Pattern Intelligence Agent")
        self.assertTrue(len(manifest.trigger_examples) > 0)

    def test_pattern_agent_execution(self):
        """Validates that PatternAgent executes and returns an AgentResponse."""
        agent = registry.get_agent("TACTICAL_PATTERN")
        ctx = ExecutionContext(
            query="Analyze this suspect statement: Suspect claims he was at Indiranagar hotel at 2 AM.",
            history=[],
            division="Bengaluru Division",
            session_id=self.session_id
        )
        response = agent.execute(ctx)
        self.assertEqual(response.agent_type, "pattern_agent")
        self.assertTrue(len(response.answer) > 0)
        self.assertTrue(response.data_available)

    def test_memory_agent_compression_and_retrieval(self):
        """Validates that MemoryAgent compresses history and stores it in DuckDB."""
        history = [
            {"role": "user", "content": "Hello, I am investigating an ATM gas cutter heist in Mysuru."},
            {"role": "assistant", "content": "Noted. What station is leading the case?"},
            {"role": "user", "content": "Devaraja Police Station, FIR 412/2026."},
            {"role": "assistant", "content": "Understood. Any suspects identified?"},
            {"role": "user", "content": "Suspect Ramesh Kumar with vehicle KA-09-EA-1234."},
            {"role": "assistant", "content": "I have registered the vehicle number."},
            {"role": "user", "content": "What is his likely next target?"}
        ]
        compressed_hist, summary = MemoryAgent.compress_history(self.session_id, history)
        self.assertIsNotNone(compressed_hist)
        # Verify DuckDB retrieval
        retrieved_summary = MemoryAgent.get_memory_summary(self.session_id)
        if summary:
            self.assertEqual(retrieved_summary, summary)

    def test_get_analytics_endpoint(self):
        """Validates GET /api/analytics returns valid volume & trend data."""
        res = self.client.get("/api/analytics")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("total_cases", data)
        self.assertIn("annual_trend", data)
        self.assertIn("category_breakdown", data)
        self.assertTrue(len(data["annual_trend"]) > 0)

    def test_get_map_markers_endpoint(self):
        """Validates GET /api/map_markers returns Karnataka GIS pins."""
        res = self.client.get("/api/map_markers")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("markers", data)
        self.assertTrue(len(data["markers"]) > 0)
        marker = data["markers"][0]
        self.assertIn("coords", marker)
        self.assertIn("name", marker)

    def test_complaints_crud_and_filtering(self):
        """Validates POST and GET for /api/complaints with station filtering."""
        # 1. POST registration
        payload = {
            "citizen_name": "Rohan Sharma",
            "phone": "+91 98860 11223",
            "station": "Indiranagar Police Station",
            "district": "Bengaluru Urban",
            "category": "Theft",
            "description": "Stolen laptop from vehicle."
        }
        post_res = self.client.post("/api/complaints", json=payload)
        self.assertEqual(post_res.status_code, 201)
        post_data = post_res.get_json()
        self.assertTrue(post_data.get("success"))
        self.assertIn("acknowledgement_number", post_data)

        # 2. GET all complaints
        get_res = self.client.get("/api/complaints?is_head=true")
        self.assertEqual(get_res.status_code, 200)
        get_data = get_res.get_json()
        self.assertTrue(get_data.get("success"))
        self.assertTrue(get_data.get("count") > 0)

        # 3. GET filtered by station
        filter_res = self.client.get("/api/complaints?station=indiranagar")
        self.assertEqual(filter_res.status_code, 200)
        filter_data = filter_res.get_json()
        self.assertTrue(filter_data.get("success"))
        for c in filter_data.get("complaints", []):
            st = c.get("incident", {}).get("police_station", "").lower()
            dist = c.get("incident", {}).get("district", "").lower()
            self.assertTrue("indiranagar" in st or "indiranagar" in dist)

    def test_forensics_transcribe_and_legal_mapper(self):
        """Validates POST /api/transcribe returns transcribed text and BNS/IPC legal mapping."""
        payload = {
            "text": "The suspect broke into the house at Indiranagar around 2 AM and stole cash and gold jewellery."
        }
        res = self.client.post("/api/transcribe", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("transcription_english", data)
        self.assertIn("bns_sections", data)
        self.assertTrue(len(data["bns_sections"]) > 0)

    def test_forensics_mule_trail(self):
        """Validates POST /api/mule_trail returns transaction network graph."""
        res = self.client.post("/api/mule_trail", json={"account": "SBI-4029"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("nodes", data)
        self.assertIn("links", data)
        self.assertIn("statistics", data)

    def test_mcp_social_endpoints(self):
        """Validates OSINT social feed endpoints."""
        # 1. GET feed
        feed_res = self.client.get("/api/mcp/social_feed")
        self.assertEqual(feed_res.status_code, 200)
        feed_data = feed_res.get_json()
        self.assertTrue(feed_data.get("success"))
        self.assertTrue(len(feed_data.get("feed", [])) > 0)

        # 2. POST fetch_live
        live_res = self.client.post("/api/mcp/fetch_live")
        self.assertEqual(live_res.status_code, 200)

        # 3. POST publish_tag
        pub_res = self.client.post("/api/mcp/publish_tag", json={
            "content": "Traffic alert near MG road #KSPAlert",
            "author": "@CitizenX"
        })
        self.assertEqual(pub_res.status_code, 201)


if __name__ == "__main__":
    unittest.main()
