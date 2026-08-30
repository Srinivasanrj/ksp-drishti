"""
Full integration test suite for server.py endpoints and agent dispatch.
"""
import io
import json
import unittest
from server import app


class TestServerEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("DOCUMENT", data["registered_agents"])

    def test_chat_guardrail(self):
        payload = {
            "query": "Write a recipe for chocolate cake",
            "session_id": "test_guard_session"
        }
        res = self.client.post("/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["agent_type"], "guardrail_agent")

    def test_document_upload_and_rag_search(self):
        session_id = "test_doc_rag_session"
        doc_content = (
            "KARNATAKA STATE POLICE — OPERATIONAL DIRECTIVE\n\n"
            "Subject: Standard Procedure for Seizure of Digital Storage Media.\n\n"
            "Clause 4.2: Every hard drive or mobile phone seized at crime scene must be "
            "placed inside an anti-static Faraday bag and sealed with tamper-evident tape bearing officer signature."
        )
        data = {
            "session_id": session_id,
            "officer_id": "OFFICER_TEST_99",
            "file": (io.BytesIO(doc_content.encode("utf-8")), "digital_seizure_directive.txt")
        }
        upload_res = self.client.post(
            "/api/upload_dataset",
            data=data,
            content_type="multipart/form-data"
        )
        self.assertEqual(upload_res.status_code, 200)
        upload_data = upload_res.get_json()
        self.assertTrue(upload_data["success"])
        self.assertEqual(upload_data["doc_type"], "Session DuckDB Document Index")

        # Query /api/rag_search
        rag_res = self.client.post(
            "/api/rag_search",
            json={"session_id": session_id, "query": "Faraday bag tamper-evident"}
        )
        self.assertEqual(rag_res.status_code, 200)
        rag_data = rag_res.get_json()
        self.assertTrue(rag_data["success"])
        self.assertGreaterEqual(rag_data["count"], 1)
        self.assertIn("Faraday bag", rag_data["results"][0]["content"])

        # Query /api/datasets
        datasets_res = self.client.get(f"/api/datasets?session_id={session_id}")
        self.assertEqual(datasets_res.status_code, 200)
        datasets_data = datasets_res.get_json()
        self.assertTrue(datasets_data["has_documents"])
        self.assertEqual(len(datasets_data["documents"]), 1)

    def test_document_chat_grounding(self):
        session_id = "test_doc_chat_session"
        doc_content = (
            "KSP SPECIAL CIRCULAR 2026/09: Mandatory Bail Guidelines for Economic Offenses.\n\n"
            "Under Section 437 BNSS, financial fraud exceeding Rs 5 Crore requires Special Investigation Team clearance."
        )
        self.client.post(
            "/api/upload_dataset",
            data={
                "session_id": session_id,
                "file": (io.BytesIO(doc_content.encode("utf-8")), "circular_2026_09.txt")
            },
            content_type="multipart/form-data"
        )

        chat_res = self.client.post("/chat", json={
            "query": "According to Circular 2026/09, what is the threshold for Special Investigation Team clearance?",
            "session_id": session_id
        })
        self.assertEqual(chat_res.status_code, 200)
        chat_data = chat_res.get_json()
        self.assertTrue(chat_data["success"])
        self.assertEqual(chat_data["agent_type"], "document_agent")

    def test_chain_of_responsibility_analytical_delegation(self):
        # Query that router identifies as analytical/data without active CSV
        session_id = "test_cor_analytical_session"
        chat_res = self.client.post("/chat", json={
            "query": "What are the major crime categories and crime statistics reported in Karnataka?",
            "session_id": session_id
        })
        self.assertEqual(chat_res.status_code, 200)
        chat_data = chat_res.get_json()
        self.assertTrue(chat_data["success"])
        # Should gracefully delegate to document_agent without returning data_empty_agent
        self.assertEqual(chat_data["agent_type"], "document_agent")
        self.assertNotIn("No Authorized Dataset Attached", chat_data["answer"])

    def test_explicit_chart_without_dataset_shows_guard(self):
        # Query explicitly asking to render a visual chart without active dataset
        session_id = "test_cor_chart_session"
        chat_res = self.client.post("/chat", json={
            "query": "Draw a bar chart comparing theft cases across stations",
            "session_id": session_id
        })
        self.assertEqual(chat_res.status_code, 200)
        chat_data = chat_res.get_json()
        self.assertTrue(chat_data["success"])
        self.assertEqual(chat_data["agent_type"], "analytical_agent")
        self.assertFalse(chat_data["data_available"])
        self.assertIn("No Authorized Dataset Attached", chat_data["answer"])

    def test_graph_delegation_without_dataset(self):
        # Relational query without active CSV
        session_id = "test_cor_graph_session"
        chat_res = self.client.post("/chat", json={
            "query": "What is the connection between suspect Ramesh and suspect Suresh?",
            "session_id": session_id
        })
        self.assertEqual(chat_res.status_code, 200)
        chat_data = chat_res.get_json()
        # Should gracefully delegate to document_agent
        self.assertEqual(chat_data["agent_type"], "document_agent")

    def test_federated_agent_manifest_and_prompt(self):
        from app.agents.federated import FederatedAgent
        from app.config import KSP_FEDERATED_PROMPT
        agent = FederatedAgent()
        manifest = agent.manifest
        self.assertEqual(manifest.intent_name, "FEDERATED")
        self.assertEqual(manifest.system_prompt, KSP_FEDERATED_PROMPT)

    def test_graph_agent_prompts_centralized(self):
        from app.config import KSP_GRAPH_NEXUS_PROMPT, KSP_GRAPH_HUBS_PROMPT
        self.assertIn("TARGET ENTITY NEXUS", KSP_GRAPH_NEXUS_PROMPT)
        self.assertIn("TOP CONNECTED NETWORK HUBS", KSP_GRAPH_HUBS_PROMPT)


if __name__ == "__main__":
    unittest.main()

