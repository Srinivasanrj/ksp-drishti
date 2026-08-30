"""
Unit & Integration Tests for Phase 3 Context-Aware AI Investigation & Zoho Services
==================================================================================
Tests: BaseSessionStore, InMemorySessionStore, ZohoIntegrationService (SQLite),
TacticalAgentOrchestrator, and Flask REST API contracts.
"""
import json
import unittest
from pathlib import Path

from app.services.session_service import InMemorySessionStore
from app.services.zoho_integration_service import ZohoIntegrationService
from app.services.agent_service import TacticalAgentOrchestrator
from server import app


import uuid

class TestInvestigationServices(unittest.TestCase):
    test_db_path = Path(__file__).resolve().parent / f"test_zoho_{uuid.uuid4().hex[:6]}.db"

    @classmethod
    def setUpClass(cls):
        cls.zoho_service = ZohoIntegrationService(db_path=cls.test_db_path)

    @classmethod
    def tearDownClass(cls):
        try:
            if cls.test_db_path.exists():
                cls.test_db_path.unlink()
        except Exception:
            pass

    def setUp(self):
        self.session_store = InMemorySessionStore()
        self.zoho_service = self.__class__.zoho_service
        self.test_client = app.test_client()

    def test_session_store_crud_and_memory_isolation(self):
        """Verify session creation, message appending, and UUID isolation."""
        payload1 = {
            "spatial_context": {"district_name": "Bengaluru Urban", "center_coordinates": [12.97, 77.59]},
            "hotspot_metadata": {"threat_level": "CRITICAL", "incident_count": 45}
        }
        payload2 = {
            "spatial_context": {"district_name": "Mysuru", "center_coordinates": [12.29, 76.63]},
            "hotspot_metadata": {"threat_level": "MODERATE", "incident_count": 12}
        }

        s1_id = self.session_store.create_session(payload1)
        s2_id = self.session_store.create_session(payload2)

        self.assertNotEqual(s1_id, s2_id)
        self.assertTrue(s1_id.startswith("inv_"))

        # Append messages to session 1
        self.session_store.append_message(s1_id, "user", "Who are the robbery suspects?")
        self.session_store.append_message(s1_id, "assistant", "Identified Ramesh 'Blade' Kumar.")

        # Check session 1 memory
        s1_data = self.session_store.get_session(s1_id)
        self.assertIsNotNone(s1_data)
        self.assertEqual(len(s1_data["messages"]), 2)
        self.assertEqual(s1_data["context_payload"]["spatial_context"]["district_name"], "Bengaluru Urban")

        # Verify session 2 memory is untouched
        s2_data = self.session_store.get_session(s2_id)
        self.assertIsNotNone(s2_data)
        self.assertEqual(len(s2_data["messages"]), 0)
        self.assertEqual(s2_data["context_payload"]["spatial_context"]["district_name"], "Mysuru")

    def test_zoho_sqlite_crud_operations(self):
        """Verify real SQLite execution for tickets and suspects."""
        # 1. Query seeded suspects
        suspects = self.zoho_service.query_crm_suspects(district="Bengaluru Urban")
        self.assertGreaterEqual(len(suspects), 1)
        self.assertTrue(any("Ramesh" in s["name"] for s in suspects))

        # 2. Create priority ticket
        ticket = self.zoho_service.create_priority_ticket(
            district="Bengaluru Urban",
            summary="Armed robbery cluster detected near Indiranagar",
            threat_level="CRITICAL"
        )
        self.assertTrue(ticket["success"])
        self.assertTrue(ticket["ticket_number"].startswith("ZD-"))

        # 3. Verify ticket was inserted into SQLite
        tickets_list = self.zoho_service.list_tickets()
        self.assertGreaterEqual(len(tickets_list), 1)
        self.assertEqual(tickets_list[0]["district"], "Bengaluru Urban")
        self.assertEqual(tickets_list[0]["threat_level"], "CRITICAL")

    def test_orchestrator_initial_greeting(self):
        """Verify orchestrator builds context-aware briefing."""
        orchestrator = TacticalAgentOrchestrator()
        payload = {
            "spatial_context": {"district_name": "Belagavi", "center_coordinates": [15.84, 74.49]},
            "hotspot_metadata": {
                "threat_level": "HIGH",
                "incident_count": 30,
                "primary_crimes": [{"category": "Vehicle Theft", "percentage": 70}]
            }
        }
        # Use global session service
        from app.services.session_service import session_service
        s_id = session_service.create_session(payload)
        greeting = orchestrator.initialize_session_briefing(s_id)

        self.assertIn("Belagavi", greeting)
        self.assertIn("HIGH", greeting)
        self.assertIn("Vehicle Theft", greeting)

    def test_investigation_rest_endpoints(self):
        """Test POST /api/investigation/init and POST /api/investigation/chat."""
        payload = {
            "spatial_context": {"district_name": "Bengaluru Urban", "center_coordinates": [12.97, 77.59]},
            "hotspot_metadata": {
                "threat_level": "CRITICAL",
                "incident_count": 45,
                "primary_crimes": [{"category": "Robbery & Snatching", "percentage": 50}]
            },
            "sample_records": [
                {"id": "FIR-881", "title": "Night chain snatching", "category": "Robbery", "date": "2026-08-28"}
            ]
        }

        # 1. Initialize session
        init_res = self.test_client.post("/api/investigation/init", json=payload)
        self.assertEqual(init_res.status_code, 201)
        init_data = json.loads(init_res.data)
        self.assertTrue(init_data["success"])
        session_id = init_data["session_id"]
        self.assertIn("Bengaluru Urban", init_data["greeting"])

        # 2. Chat: Query suspects (triggers Zoho CRM tool)
        chat_res = self.test_client.post("/api/investigation/chat", json={
            "session_id": session_id,
            "message": "Who are the known criminal suspects operating in this district?"
        })
        self.assertEqual(chat_res.status_code, 200)
        chat_data = json.loads(chat_res.data)
        self.assertTrue(chat_data["success"])
        self.assertIsNotNone(chat_data["response"])

        # 3. Chat: Create Zoho Desk ticket
        ticket_res = self.test_client.post("/api/investigation/chat", json={
            "session_id": session_id,
            "message": "Log a priority dispatch ticket for immediate patrol deployment."
        })
        self.assertEqual(ticket_res.status_code, 200)
        ticket_data = json.loads(ticket_res.data)
        self.assertTrue(ticket_data["success"])
        self.assertGreaterEqual(len(ticket_data["tool_executions"]), 1)
        self.assertEqual(ticket_data["tool_executions"][0]["tool_name"], "zoho_desk_create_ticket")

        # 4. Verify tickets endpoint
        list_tickets_res = self.test_client.get("/api/investigation/tickets")
        self.assertEqual(list_tickets_res.status_code, 200)
        tickets_info = json.loads(list_tickets_res.data)
        self.assertTrue(tickets_info["success"])
        self.assertGreaterEqual(tickets_info["count"], 1)

        # 5. Verify suspects endpoint
        suspects_res = self.test_client.get("/api/investigation/suspects?district=Bengaluru")
        self.assertEqual(suspects_res.status_code, 200)
        suspects_info = json.loads(suspects_res.data)
        self.assertTrue(suspects_info["success"])
        self.assertGreaterEqual(suspects_info["count"], 1)


if __name__ == "__main__":
    unittest.main()
