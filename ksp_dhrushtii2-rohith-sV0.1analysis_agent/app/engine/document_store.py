"""
KSP Sentinel AI — DuckDB Document Storage & Search Engine (SOLID: DIP + SRP)
Thread-safe, session-isolated document store for PDFs, FIRs, and SOP circulars.
"""
import io
import json
import logging
import re
import threading
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
import duckdb

from app.core.interfaces import DocumentChunk, IDocumentRepository

log = logging.getLogger("standalone.document_store")


class DuckDBDocumentStore(IDocumentRepository):
    """
    SRP: Handles session-isolated document parsing, chunking, indexing, and lexical retrieval.
    DIP: Concrete implementation of IDocumentRepository.
    Thread-safe via threading.RLock().
    """
    def __init__(self):
        self.sessions: Dict[str, dict] = {}  # session_id -> { "con": duckdb_con, "docs": {} }
        self._lock = threading.RLock()

    def _get_connection(self, session_id: str):
        with self._lock:
            if session_id not in self.sessions:
                con = duckdb.connect(database=":memory:")
                # Initialize schema
                con.execute("""
                    CREATE TABLE IF NOT EXISTS doc_chunks (
                        chunk_id VARCHAR PRIMARY KEY,
                        doc_name VARCHAR,
                        chunk_index INTEGER,
                        content VARCHAR
                    )
                """)
                con.execute("""
                    CREATE TABLE IF NOT EXISTS doc_registry (
                        doc_name VARCHAR PRIMARY KEY,
                        chunk_count INTEGER,
                        file_size_kb DOUBLE,
                        ingested_at VARCHAR
                    )
                """)
                con.execute("""
                    CREATE TABLE IF NOT EXISTS staged_transcripts (
                        stage_id VARCHAR PRIMARY KEY,
                        session_id VARCHAR,
                        filename VARCHAR,
                        transcript_kn VARCHAR,
                        transcript_en VARCHAR,
                        entities VARCHAR,
                        created_at VARCHAR,
                        status VARCHAR
                    )
                """)
                self.sessions[session_id] = {
                    "con": con,
                    "docs": {}
                }
            return self.sessions[session_id]["con"]

    def _extract_text(self, filename: str, file_bytes: bytes) -> str:
        """
        Polymorphic text extraction for PDF, TXT, MD, and JSON files.
        """
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                extracted_pages = []
                for idx, page in enumerate(reader.pages):
                    text = page.extract_text() or ""
                    if text.strip():
                        extracted_pages.append(f"--- Page {idx + 1} ---\n{text}")
                return "\n\n".join(extracted_pages)
            except Exception as e:
                log.warning(f"[DocumentStore] pypdf extraction fallback: {e}")
                # Fallback to Latin-1 stream extraction
                raw_str = file_bytes.decode("latin-1", errors="ignore")
                clean_str = re.sub(r"[^\x20-\x7E\n\t]", " ", raw_str)
                return re.sub(r"\s+", " ", clean_str)

        elif lower_name.endswith((".txt", ".md", ".json", ".log", ".csv")):
            return file_bytes.decode("utf-8", errors="replace")

        else:
            return file_bytes.decode("utf-8", errors="replace")

    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
        """
        Splits text into contextually bounded chunks respecting sentence breaks.
        """
        if not text or not text.strip():
            return []

        cleaned_text = re.sub(r"\r\n", "\n", text).strip()
        paragraphs = cleaned_text.split("\n\n")
        chunks: List[str] = []
        current_chunk = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_len = len(para)
            if current_length + para_len <= chunk_size:
                current_chunk.append(para)
                current_length += para_len + 2
            else:
                if current_chunk:
                    chunk_str = "\n\n".join(current_chunk)
                    chunks.append(chunk_str)
                    # Handle overlap by keeping the trailing section
                    if overlap > 0 and len(chunk_str) > overlap:
                        current_chunk = [chunk_str[-overlap:]]
                        current_length = len(current_chunk[0])
                    else:
                        current_chunk = []
                        current_length = 0

                # If paragraph itself is larger than chunk_size, split by sentences
                if para_len > chunk_size:
                    sentences = re.split(r"(?<=[.?!])\s+", para)
                    for sent in sentences:
                        sent = sent.strip()
                        if not sent:
                            continue
                        if current_length + len(sent) <= chunk_size:
                            current_chunk.append(sent)
                            current_length += len(sent) + 1
                        else:
                            if current_chunk:
                                chunks.append(" ".join(current_chunk))
                            current_chunk = [sent]
                            current_length = len(sent)
                else:
                    current_chunk.append(para)
                    current_length += para_len + 2

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        return [c.strip() for c in chunks if c.strip()]

    def ingest_document(self, session_id: str, filename: str, file_bytes: bytes) -> Dict[str, Any]:
        """
        Ingests a document, extracts text, generates chunks, and inserts them into DuckDB.
        """
        con = self._get_connection(session_id)
        raw_text = self._extract_text(filename, file_bytes)
        chunks = self._chunk_text(raw_text, chunk_size=500, overlap=80)
        file_size_kb = round(len(file_bytes) / 1024, 2)
        ingested_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with self._lock:
            # Delete old chunks if document with same name exists
            con.execute("DELETE FROM doc_chunks WHERE doc_name = ?", [filename])
            con.execute("DELETE FROM doc_registry WHERE doc_name = ?", [filename])

            for idx, chunk_content in enumerate(chunks):
                chunk_id = f"{filename}_{idx}_{int(time.time() * 1000)}"
                con.execute(
                    "INSERT INTO doc_chunks VALUES (?, ?, ?, ?)",
                    [chunk_id, filename, idx, chunk_content]
                )

            con.execute(
                "INSERT INTO doc_registry VALUES (?, ?, ?, ?)",
                [filename, len(chunks), file_size_kb, ingested_at]
            )

        log.info(f"[DocumentStore] Ingested '{filename}' ({len(chunks)} chunks, {file_size_kb} KB) for session '{session_id}'")
        return {
            "success": True,
            "filename": filename,
            "session_id": session_id,
            "chunk_count": len(chunks),
            "file_size_kb": file_size_kb,
            "ingested_at": ingested_at,
            "char_count": len(raw_text)
        }

    def search_chunks(self, session_id: str, query: str, limit: int = 5) -> List[DocumentChunk]:
        """
        Lexical & keyword scoring search over session document chunks.
        """
        if not self.has_documents(session_id):
            return []

        con = self._get_connection(session_id)
        tokens = [t.lower().strip() for t in re.findall(r"\w+", query) if len(t.strip()) > 2]
        if not tokens:
            # Fallback: grab recent chunks
            with self._lock:
                rows = con.execute("SELECT chunk_id, doc_name, chunk_index, content FROM doc_chunks LIMIT ?", [limit]).fetchall()
                return [DocumentChunk(chunk_id=r[0], doc_name=r[1], chunk_index=r[2], content=r[3], score=1.0) for r in rows]

        with self._lock:
            all_chunks = con.execute("SELECT chunk_id, doc_name, chunk_index, content FROM doc_chunks").fetchall()

        results: List[DocumentChunk] = []
        for r in all_chunks:
            chunk_id, doc_name, chunk_index, content = r[0], r[1], r[2], r[3]
            content_lower = content.lower()
            
            # Compute term frequency score + exact phrase match bonus
            score = 0.0
            for token in tokens:
                count = content_lower.count(token)
                if count > 0:
                    score += 1.0 + (count * 0.2)
            
            # Phrase bonus
            if query.lower() in content_lower:
                score += 5.0

            if score > 0:
                results.append(DocumentChunk(
                    chunk_id=chunk_id,
                    doc_name=doc_name,
                    chunk_index=chunk_index,
                    content=content,
                    score=score
                ))

        results.sort(key=lambda x: x.score, reverse=True)
        return results[:limit]

    def list_documents(self, session_id: str) -> List[Dict[str, Any]]:
        """Lists all registered documents in the session."""
        with self._lock:
            if session_id not in self.sessions:
                return []
            con = self._get_connection(session_id)
            rows = con.execute("SELECT doc_name, chunk_count, file_size_kb, ingested_at FROM doc_registry").fetchall()
            return [
                {
                    "doc_name": r[0],
                    "chunk_count": r[1],
                    "file_size_kb": r[2],
                    "ingested_at": r[3]
                }
                for r in rows
            ]

    def delete_document(self, session_id: str, filename: str) -> bool:
        """Deletes a document and its chunks from the session."""
        with self._lock:
            if session_id not in self.sessions:
                return False
            con = self._get_connection(session_id)
            con.execute("DELETE FROM doc_chunks WHERE doc_name = ?", [filename])
            con.execute("DELETE FROM doc_registry WHERE doc_name = ?", [filename])
            return True

    def has_documents(self, session_id: str) -> bool:
        """Checks if session has any indexed documents."""
        with self._lock:
            if session_id not in self.sessions:
                return False
            con = self._get_connection(session_id)
            count = con.execute("SELECT COUNT(*) FROM doc_registry").fetchone()[0]
            return count > 0

    def stage_transcript(
        self,
        session_id: str,
        stage_id: str,
        filename: str,
        transcript_kn: str,
        transcript_en: str,
        entities: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Sandboxed stage insertion for human-in-the-loop audio review.
        Does NOT ingest into doc_chunks RAG table yet.
        """
        con = self._get_connection(session_id)
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entities_json = json.dumps(entities) if isinstance(entities, dict) else str(entities or "{}")

        with self._lock:
            con.execute("DELETE FROM staged_transcripts WHERE stage_id = ?", [stage_id])
            con.execute(
                """
                INSERT INTO staged_transcripts (stage_id, session_id, filename, transcript_kn, transcript_en, entities, created_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'staged')
                """,
                [stage_id, session_id, filename, transcript_kn, transcript_en, entities_json, created_at]
            )

        log.info(f"[DocumentStore] Staged audio transcript '{stage_id}' for session '{session_id}'")
        return {
            "success": True,
            "stage_id": stage_id,
            "session_id": session_id,
            "filename": filename,
            "created_at": created_at,
            "status": "staged"
        }

    def get_staged_transcripts(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all currently staged (un-injected) audio transcripts for a session.
        Allows UI rehydration across tab switching.
        """
        with self._lock:
            if session_id not in self.sessions:
                return []
            con = self._get_connection(session_id)
            rows = con.execute(
                """
                SELECT stage_id, session_id, filename, transcript_kn, transcript_en, entities, created_at, status
                FROM staged_transcripts
                WHERE session_id = ? AND status = 'staged'
                ORDER BY created_at DESC
                """,
                [session_id]
            ).fetchall()

            result = []
            for r in rows:
                try:
                    ents = json.loads(r[5]) if r[5] else {}
                except Exception:
                    ents = {}
                result.append({
                    "stage_id": r[0],
                    "session_id": r[1],
                    "filename": r[2],
                    "transcript_kn": r[3],
                    "transcript_en": r[4],
                    "entities": ents,
                    "created_at": r[6],
                    "status": r[7]
                })
            return result

    def confirm_and_inject_transcript(
        self,
        session_id: str,
        stage_id: str,
        markdown_content: str,
        filename: str = ""
    ) -> Dict[str, Any]:
        """
        Human-in-the-Loop Gateway:
        Moves verified transcript from staged state to official session doc_chunks RAG table.
        """
        con = self._get_connection(session_id)
        doc_name = filename if filename else f"audio_statement_{stage_id}.md"
        if not doc_name.lower().endswith(".md"):
            doc_name = f"{doc_name}.md"

        # Strict Replacement Model: Purge any previously injected audio documents from session RAG
        with self._lock:
            audio_docs = con.execute("SELECT doc_name FROM doc_registry WHERE doc_name LIKE 'audio_%'").fetchall()
            for (old_doc,) in audio_docs:
                con.execute("DELETE FROM doc_chunks WHERE doc_name = ?", [old_doc])
                con.execute("DELETE FROM doc_registry WHERE doc_name = ?", [old_doc])
                log.info(f"[DocumentStore] Strict Replacement: Purged prior audio doc '{old_doc}' from session '{session_id}'")

            # Mark staged entry as injected and discard any previous staged entries
            con.execute(
                "UPDATE staged_transcripts SET status = 'injected' WHERE stage_id = ?",
                [stage_id]
            )
            con.execute(
                "DELETE FROM staged_transcripts WHERE session_id = ? AND stage_id != ? AND status = 'staged'",
                [session_id, stage_id]
            )

        # Ingest into official DuckDB Document Store
        ingest_res = self.ingest_document(
            session_id=session_id,
            filename=doc_name,
            file_bytes=markdown_content.encode("utf-8")
        )

        log.info(f"[DocumentStore] Confirmed and injected audio transcript '{doc_name}' into RAG for session '{session_id}'")
        return {
            "success": True,
            "stage_id": stage_id,
            "doc_name": doc_name,
            "session_id": session_id,
            "chunk_count": ingest_res.get("chunk_count", 0),
            "file_size_kb": ingest_res.get("file_size_kb", 0.0),
            "ingested_at": ingest_res.get("ingested_at", "")
        }

    def delete_staged_transcript(self, session_id: str, stage_id: str) -> bool:
        """Discards an unconfirmed staged transcript."""
        with self._lock:
            if session_id not in self.sessions:
                return False
            con = self._get_connection(session_id)
            con.execute("DELETE FROM staged_transcripts WHERE stage_id = ?", [stage_id])
            return True

    def clear_session(self, session_id: str) -> None:
        """Completely drops session storage."""
        with self._lock:
            if session_id in self.sessions:
                try:
                    self.sessions[session_id]["con"].close()
                except Exception:
                    pass
                del self.sessions[session_id]


# Global singleton instance
document_store = DuckDBDocumentStore()
