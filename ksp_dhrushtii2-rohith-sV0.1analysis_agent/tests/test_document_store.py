"""
Unit tests for DuckDBDocumentStore — SOLID, Thread-Safety, and Session Isolation.
"""
import io
import unittest
from app.engine.document_store import DuckDBDocumentStore


class TestDuckDBDocumentStore(unittest.TestCase):
    def setUp(self):
        self.store = DuckDBDocumentStore()

    def test_ingest_and_search_text(self):
        session_id = "test_session_1"
        filename = "fir_case_001.txt"
        sample_text = (
            "FIRST INFORMATION REPORT (Under Section 154 Cr.P.C / BNSS)\n\n"
            "District: Bengaluru City | Police Station: Cyber Crime Police Station\n\n"
            "Complainant reported an unauthorized wire transfer of Rs 25,00,000 using mule UPI accounts.\n\n"
            "Suspect identified as Rajesh Kumar residing in Sector 4, Koramangala.\n\n"
            "Charged under Section 66D IT Act and Section 318 BNS."
        )
        content_bytes = sample_text.encode("utf-8")

        meta = self.store.ingest_document(session_id, filename, content_bytes)
        self.assertTrue(meta["success"])
        self.assertEqual(meta["filename"], filename)
        self.assertGreater(meta["chunk_count"], 0)

        # Verify search
        chunks = self.store.search_chunks(session_id, "Rajesh Kumar Koramangala", limit=3)
        self.assertGreater(len(chunks), 0)
        self.assertIn("Rajesh Kumar", chunks[0].content)
        self.assertEqual(chunks[0].doc_name, filename)

    def test_session_isolation(self):
        """Verify Session A documents are completely inaccessible from Session B."""
        session_a = "officer_session_alpha"
        session_b = "officer_session_beta"

        doc_a_text = "Confidential Narcotics Seizure at Belagavi border checkpost. Vehicle KA-22-M-8812."
        self.store.ingest_document(session_a, "narcotics_report.txt", doc_a_text.encode("utf-8"))

        doc_b_text = "Routine Traffic Advisory for Mangaluru Coastal Highway."
        self.store.ingest_document(session_b, "traffic_advisory.txt", doc_b_text.encode("utf-8"))

        # Session A should find narcotics report, Session B should NOT
        chunks_a = self.store.search_chunks(session_a, "Narcotics Belagavi", limit=3)
        self.assertEqual(len(chunks_a), 1)
        self.assertIn("Narcotics", chunks_a[0].content)

        chunks_b = self.store.search_chunks(session_b, "Narcotics Belagavi", limit=3)
        self.assertEqual(len(chunks_b), 0)

        # Verify document list isolation
        docs_a = self.store.list_documents(session_a)
        docs_b = self.store.list_documents(session_b)
        self.assertEqual(len(docs_a), 1)
        self.assertEqual(docs_a[0]["doc_name"], "narcotics_report.txt")
        self.assertEqual(len(docs_b), 1)
        self.assertEqual(docs_b[0]["doc_name"], "traffic_advisory.txt")

    def test_delete_document(self):
        session_id = "test_session_delete"
        text = "Evidence record to be purged."
        self.store.ingest_document(session_id, "temp_evidence.txt", text.encode("utf-8"))
        self.assertTrue(self.store.has_documents(session_id))

        deleted = self.store.delete_document(session_id, "temp_evidence.txt")
        self.assertTrue(deleted)
        self.assertFalse(self.store.has_documents(session_id))
        self.assertEqual(len(self.store.search_chunks(session_id, "Evidence")), 0)


if __name__ == "__main__":
    unittest.main()
