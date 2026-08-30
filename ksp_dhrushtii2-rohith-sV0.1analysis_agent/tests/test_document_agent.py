"""
Integration & Contract tests for DocumentAgent — SOLID & LSP compliance.
"""
import unittest
from app.core.interfaces import ExecutionContext, IDocumentRepository, DocumentChunk
from app.agents.document import DocumentAgent


class MockDocumentRepository(IDocumentRepository):
    def __init__(self, chunks=None):
        self.chunks = chunks or []

    def ingest_document(self, session_id, filename, file_bytes):
        return {"success": True, "chunk_count": len(self.chunks)}

    def search_chunks(self, session_id, query, limit=5):
        return self.chunks[:limit]

    def list_documents(self, session_id):
        return [{"doc_name": "mock_sop.pdf", "chunk_count": len(self.chunks)}]

    def delete_document(self, session_id, filename):
        return True

    def has_documents(self, session_id):
        return len(self.chunks) > 0


class TestDocumentAgent(unittest.TestCase):
    def test_manifest_contract(self):
        agent = DocumentAgent()
        manifest = agent.manifest
        self.assertEqual(manifest.intent_name, "DOCUMENT")
        self.assertEqual(manifest.label, "Document & Legal Agent")
        self.assertEqual(manifest.icon, "📄")
        self.assertFalse(manifest.requires_visual_studio)

    def test_execute_with_grounded_chunks(self):
        mock_chunks = [
            DocumentChunk(
                chunk_id="c1",
                doc_name="ksp_sop_cyber_65b.pdf",
                chunk_index=0,
                content="Standard Operating Procedure for Section 65B BSA Certificate: Hash algorithm SHA-256 is mandatory.",
                score=10.0
            )
        ]
        mock_repo = MockDocumentRepository(chunks=mock_chunks)
        agent = DocumentAgent(doc_repo=mock_repo)

        ctx = ExecutionContext(
            query="What is the mandatory hash algorithm for Section 65B certificate in our SOP?",
            session_id="test_legal_session"
        )
        response = agent.execute(ctx)

        self.assertEqual(response.agent_type, "document_agent")
        self.assertIsInstance(response.answer, str)
        self.assertGreater(len(response.answer), 10)
        self.assertTrue(response.data_available)


if __name__ == "__main__":
    unittest.main()
