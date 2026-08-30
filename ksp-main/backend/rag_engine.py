import os
import io
import re
import json
import math
import time
import sqlite3
import logging
from datetime import datetime
from pathlib import Path
import pandas as pd
import pypdf

logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent
KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledge_base"
RAG_STORE_PATH = BASE_DIR / "rag_store.json"
DATASET_REGISTRY_PATH = BASE_DIR / "dataset_registry.json"
DB_PATH = BASE_DIR / "crime.db"

def load_knowledge_base_documents():
    """Dynamically reads documents from knowledge_base directory."""
    docs = []
    if not KNOWLEDGE_BASE_DIR.exists():
        KNOWLEDGE_BASE_DIR.mkdir(parents=True, exist_ok=True)

    for file_path in KNOWLEDGE_BASE_DIR.glob("*.*"):
        if file_path.suffix.lower() in [".txt", ".pdf", ".csv", ".json", ".md"]:
            try:
                if file_path.suffix.lower() == ".pdf":
                    reader = pypdf.PdfReader(str(file_path))
                    text = "\n".join([page.extract_text() or "" for page in reader.pages])
                    doc_type = "PDF Knowledge Document"
                else:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read()
                    doc_type = "Document" if file_path.suffix.lower() != ".csv" else "CSV Dataset"

                if text.strip():
                    docs.append({
                        "doc_name": file_path.name,
                        "doc_type": doc_type,
                        "text": text
                    })
            except Exception as e:
                logger.warning(f"Failed to read knowledge document {file_path.name}: {e}")
    return docs

def initialize_rag_store():
    """Initializes the RAG JSON store and SQLite RAG table if they don't exist."""
    if not RAG_STORE_PATH.exists():
        initial_chunks = []
        seed_documents = load_knowledge_base_documents()
        for doc in seed_documents:
            chunks = create_chunks_from_text(
                text=doc["text"],
                doc_name=doc["doc_name"],
                doc_type=doc["doc_type"]
            )
            initial_chunks.extend(chunks)
            
        store_data = {
            "version": "1.0",
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "chunks": initial_chunks
        }
        with open(RAG_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(store_data, f, indent=2)
            
    if not DATASET_REGISTRY_PATH.exists():
        initial_registry = [
            {
                "id": "ds-001",
                "filename": "KSP_Cyber_Crime_SOP_2026.pdf",
                "file_type": "pdf",
                "record_count": 3,
                "upload_date": datetime.now().strftime("%Y-%m-%d"),
                "status": "Indexed & Active",
                "size_str": "145 KB"
            },
            {
                "id": "ds-002",
                "filename": "Crime_Statistics_Standard_Dataset.csv",
                "file_type": "csv",
                "record_count": 1388,
                "upload_date": datetime.now().strftime("%Y-%m-%d"),
                "status": "Indexed & Active",
                "size_str": "82 KB"
            }
        ]
        with open(DATASET_REGISTRY_PATH, "w", encoding="utf-8") as f:
            json.dump(initial_registry, f, indent=2)

def load_rag_store():
    initialize_rag_store()
    try:
        with open(RAG_STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading RAG store: {e}")
        return {"chunks": []}

def save_rag_store(store_data):
    store_data["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(RAG_STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(store_data, f, indent=2)

def load_dataset_registry():
    initialize_rag_store()
    try:
        with open(DATASET_REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading dataset registry: {e}")
        return []

def save_dataset_registry(registry):
    with open(DATASET_REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)

def create_chunks_from_text(text: str, doc_name: str, doc_type: str, chunk_size: int = 400, overlap: int = 60) -> list:
    """Splits document text into overlapping chunks for semantic retrieval."""
    clean_text = re.sub(r'\s+', ' ', text).strip()
    if not clean_text:
        return []
        
    chunks = []
    start = 0
    chunk_idx = 1
    
    while start < len(clean_text):
        end = start + chunk_size
        chunk_str = clean_text[start:end]
        
        # Try to break at sentence boundary if possible
        if end < len(clean_text):
            last_period = chunk_str.rfind('. ')
            if last_period > 100:
                end = start + last_period + 1
                chunk_str = clean_text[start:end]
                
        chunks.append({
            "chunk_id": f"{doc_name}_chunk_{chunk_idx}",
            "doc_name": doc_name,
            "doc_type": doc_type,
            "passage": chunk_str.strip(),
            "uploaded_at": datetime.now().strftime("%Y-%m-%d %H:%M")
        })
        
        chunk_idx += 1
        start = end - overlap
        
    return chunks

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Parses text from PDF bytes using pypdf."""
    extracted_text = ""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                extracted_text += f"\n--- Page {page_idx + 1} ---\n" + page_text
    except Exception as e:
        logger.error(f"Error parsing PDF with pypdf: {e}")
        # Fallback regex string extraction
        try:
            raw_str = file_bytes.decode('latin-1', errors='ignore')
            text_blocks = re.findall(r'\(([^\(\)]+)\)\s*Tj', raw_str)
            extracted_text = " ".join(text_blocks)
        except Exception as fb_err:
            logger.error(f"Fallback text extraction error: {fb_err}")
            
    return extracted_text

def process_and_index_file(file_bytes: bytes, filename: str) -> dict:
    """
    Main function to process PDF or CSV dataset upload:
    - Parses content
    - Updates SQLite CrimeStatistics DB if CSV
    - Generates chunk passages & indexes into RAG Knowledge Store
    - Updates Dataset Registry
    """
    file_ext = filename.lower().split('.')[-1]
    file_size_str = f"{round(len(file_bytes) / 1024, 1)} KB"
    
    extracted_text = ""
    doc_type = "Document"
    record_count = 1
    
    if file_ext == "pdf":
        doc_type = "PDF Knowledge Document"
        extracted_text = extract_text_from_pdf(file_bytes)
        if not extracted_text.strip():
            extracted_text = f"Document {filename} loaded. Contains binary graphics or encrypted text."
    elif file_ext in ["png", "jpg", "jpeg", "webp"]:
        doc_type = "Digital Evidence Image"
        extracted_text = f"Digital Evidence / FIR Image Record: {filename}. Indexed into KSP SCRB Evidence Repository."
    elif file_ext in ["csv", "txt", "json", "xlsx", "sql"]:
        doc_type = "CSV Dataset" if file_ext == "csv" else "Dataset File"
        
        try:
            if file_ext == "csv":
                df = pd.read_csv(io.BytesIO(file_bytes))
                record_count = len(df)
                
                # Check if this matches CrimeStatistics schema and update SQLite DB!
                required_cols = {"Crime_Category", "Cases"}
                if required_cols.issubset(set(df.columns)):
                    try:
                        conn = sqlite3.connect(DB_PATH)
                        # Append new data to existing table
                        df.to_sql("CrimeStatistics", conn, if_exists="append", index=False)
                        conn.close()
                        logger.info(f"Appended {record_count} new rows to SQLite CrimeStatistics table.")
                    except Exception as db_err:
                        logger.error(f"Error appending CSV to SQLite: {db_err}")
                
                # Convert rows into textual descriptions for RAG indexing
                row_descriptions = []
                for idx, row in df.head(100).iterrows():
                    row_dict = row.to_dict()
                    desc_parts = [f"{k}: {v}" for k, v in row_dict.items() if pd.notna(v)]
                    row_descriptions.append(f"Record #{idx+1} in dataset {filename}: " + ", ".join(desc_parts))
                extracted_text = "\n".join(row_descriptions)
                
            else:
                extracted_text = file_bytes.decode('utf-8', errors='ignore')
        except Exception as e:
            logger.error(f"Error processing CSV/Dataset: {e}")
            extracted_text = file_bytes.decode('utf-8', errors='ignore')
    else:
        extracted_text = file_bytes.decode('utf-8', errors='ignore')

    # Create chunks
    new_chunks = create_chunks_from_text(
        text=extracted_text,
        doc_name=filename,
        doc_type=doc_type
    )
    
    # Save to RAG Store
    rag_data = load_rag_store()
    # Remove existing chunks for the same filename to avoid duplicates
    rag_data["chunks"] = [c for c in rag_data.get("chunks", []) if c.get("doc_name") != filename]
    rag_data["chunks"].extend(new_chunks)
    save_rag_store(rag_data)
    
    # Save to Dataset Registry
    registry = load_dataset_registry()
    registry = [r for r in registry if r.get("filename") != filename]
    new_entry = {
        "id": f"ds-{int(time.time())}",
        "filename": filename,
        "file_type": file_ext,
        "record_count": record_count if file_ext == "csv" else len(new_chunks),
        "upload_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "status": "Indexed & Active",
        "size_str": file_size_str
    }
    registry.insert(0, new_entry)
    save_dataset_registry(registry)
    
    return {
        "success": True,
        "filename": filename,
        "doc_type": doc_type,
        "chunks_indexed": len(new_chunks),
        "total_store_chunks": len(rag_data["chunks"]),
        "file_size": file_size_str,
        "entry": new_entry
    }

def delete_dataset_entry(filename: str) -> dict:
    """Removes a file and its chunks from RAG Store and Registry."""
    rag_data = load_rag_store()
    rag_data["chunks"] = [c for c in rag_data.get("chunks", []) if c.get("doc_name") != filename]
    save_rag_store(rag_data)
    
    registry = load_dataset_registry()
    registry = [r for r in registry if r.get("filename") != filename]
    save_dataset_registry(registry)
    
    return {"success": True, "message": f"Dataset {filename} deleted from RAG Store."}

import os
import requests
import numpy as np

# Load RAG Provider flag
RAG_PROVIDER = os.environ.get("RAG_PROVIDER", "local").lower()

# ── Zoho Catalyst QuickML RAG Config ─────────────────────────────────────────
CATALYST_PROJECT_ID   = os.environ.get("CATALYST_PROJECT_ID", "54626000000013049")
CATALYST_ORG_ID       = os.environ.get("CATALYST_ORG_ID", "60077159195")
CATALYST_CLIENT_ID    = os.environ.get("CATALYST_CLIENT_ID", "")
CATALYST_CLIENT_SECRET = os.environ.get("CATALYST_CLIENT_SECRET", "")
CATALYST_REFRESH_TOKEN = os.environ.get("CATALYST_REFRESH_TOKEN", "")

# Correct endpoint from Zoho Catalyst Console
CATALYST_RAG_URL = (
    f"https://console.catalyst.zoho.in/quickml/v1/project/{CATALYST_PROJECT_ID}/rag/answer"
)

# ── Auto Token Refresh ───────────────────────────────────────────────────
_current_access_token: str = os.environ.get("CATALYST_ACCESS_TOKEN", "")

def _refresh_access_token() -> str:
    """
    Uses the Zoho OAuth refresh token flow to get a new access token.
    Automatically persists the new token to the .env file.
    """
    global _current_access_token
    try:
        resp = requests.post(
            "https://accounts.zoho.in/oauth/v2/token",
            params={
                "grant_type":    "refresh_token",
                "client_id":     CATALYST_CLIENT_ID,
                "client_secret": CATALYST_CLIENT_SECRET,
                "refresh_token": CATALYST_REFRESH_TOKEN,
            },
            timeout=15
        )
        if resp.ok:
            new_token = resp.json().get("access_token", "")
            if new_token:
                _current_access_token = new_token
                logger.info("Catalyst OAuth: Token refreshed successfully.")
                # Persist to .env so the new token survives restarts
                _write_token_to_env(new_token)
                return new_token
        logger.error(f"Token refresh failed: {resp.status_code} — {resp.text[:300]}")
    except Exception as e:
        logger.error(f"Token refresh exception: {e}")
    return _current_access_token

def _write_token_to_env(new_token: str):
    """Rewrites CATALYST_ACCESS_TOKEN line in .env with the new token."""
    try:
        env_path = BASE_DIR / ".env"
        if not env_path.exists():
            return
        lines = env_path.read_text(encoding="utf-8").splitlines(keepends=True)
        new_lines = []
        for line in lines:
            if line.strip().startswith("CATALYST_ACCESS_TOKEN="):
                new_lines.append(f"CATALYST_ACCESS_TOKEN={new_token}\n")
            else:
                new_lines.append(line)
        env_path.write_text("".join(new_lines), encoding="utf-8")
        logger.info("Catalyst OAuth: .env updated with fresh access token.")
    except Exception as e:
        logger.warning(f"Could not write token to .env: {e}")

def get_valid_access_token() -> str:
    """Returns the current access token. Refreshes it on first call if empty."""
    global _current_access_token
    if not _current_access_token:
        _current_access_token = _refresh_access_token()
    return _current_access_token

def _catalyst_headers() -> dict:
    """Returns the correct Authorization headers for Catalyst API calls."""
    return {
        "Authorization": f"Zoho-oauthtoken {get_valid_access_token()}",
        "CATALYST-ORG": str(CATALYST_ORG_ID),
        "Content-Type": "application/json"
    }

def list_catalyst_documents() -> list:
    """
    Lists all documents uploaded to the Zoho Catalyst QuickML RAG knowledge base.
    Returns a list of document IDs (used in the `documents` field of the answer API).
    """
    try:
        list_url = (
            f"https://console.catalyst.zoho.in/quickml/v1/project/{CATALYST_PROJECT_ID}/rag/document"
        )
        resp = requests.get(list_url, headers=_catalyst_headers(), timeout=20)
        if resp.ok:
            data = resp.json()
            docs = data.get("data", data.get("documents", []))
            logger.info(f"Catalyst RAG: Found {len(docs)} documents in knowledge base.")
            return docs
        else:
            logger.warning(f"Catalyst list documents failed: {resp.status_code} — {resp.text[:300]}")
            return []
    except Exception as e:
        logger.error(f"Error listing Catalyst documents: {e}")
        return []

# Cache document IDs so we don't fetch on every query
# Pre-seed with document IDs already indexed in the Catalyst knowledge base
# Add/remove IDs here as you upload more documents to the Zoho Console
_catalyst_doc_ids: list = [
    "3407000000004223",
    "3407000000003546",
    "3407000000004461",
    "3407000000004473",
    "3407000000004469",
    "3407000000004465",
    "3407000000003542",
    "3407000000003527",
    "3407000000003502",
    "3407000000004439",
    "3407000000003512",
    "3407000000003506",
    "3407000000003507",
    "3407000000003520",
    "3407000000003500",
    "3407000000003486",
    "3407000000003483",
    "3407000000003476",
    "3407000000004391",
    "3407000000003470",
    "3407000000003464",
    "3407000000003462",
    "3407000000003458",
    "3407000000003444",
    "3407000000003451",
    "3407000000003445",
    "3407000000003446",
    "3407000000004377",
    "3407000000003422",
    "3407000000004365",
    "3407000000003417",
    "3407000000003414",
    "3407000000004361",
    "3407000000003410",
    "3407000000004369",
    "3407000000003405",
    "3407000000003399",
    "3407000000003397",
    "3407000000004339",
    "3407000000003382",
    "3407000000004335",
    "3407000000003355",
    "3407000000004320",
    "3407000000004300",
    "3407000000003363",
    "3407000000003346",
    "3407000000004315",
    "3407000000004308",
    "3407000000004304",
    "3407000000003343",
    "3407000000003351",
]

def get_catalyst_doc_ids(refresh: bool = False) -> list:
    """Returns cached Catalyst document IDs, refreshing if needed."""
    global _catalyst_doc_ids
    if not _catalyst_doc_ids or refresh:
        docs = list_catalyst_documents()
        # Extract just the IDs regardless of whether docs are dicts or plain strings
        fetched = [
            doc.get("id") or doc.get("document_id") or doc
            for doc in docs
        ]
        if fetched:
            _catalyst_doc_ids = fetched
    return _catalyst_doc_ids

def upload_file_to_catalyst(file_bytes: bytes, filename: str) -> str | None:
    """
    Uploads a file to the Zoho Catalyst QuickML RAG knowledge base.
    Returns the new document ID on success, or None on failure.

    This is called by the chatbot upload button so that every file
    uploaded through the chat is automatically indexed in Catalyst
    and available for RAG queries in the same session.
    """
    try:
        upload_url = (
            f"https://console.catalyst.zoho.in/quickml/v1/project/{CATALYST_PROJECT_ID}/rag/document"
        )
        # Catalyst upload uses multipart/form-data — do NOT set Content-Type manually
        headers = {
            "Authorization": f"Zoho-oauthtoken {get_valid_access_token()}",
            "CATALYST-ORG": str(CATALYST_ORG_ID),
        }
        files = {"file": (filename, file_bytes)}
        resp = requests.post(upload_url, headers=headers, files=files, timeout=60)

        # Auto-retry on expired token
        if resp.status_code == 401:
            logger.warning("Catalyst file upload 401 — refreshing token and retrying...")
            _refresh_access_token()
            headers["Authorization"] = f"Zoho-oauthtoken {get_valid_access_token()}"
            resp = requests.post(upload_url, headers=headers, files=files, timeout=60)

        if resp.ok:
            data = resp.json()
            doc_id = (
                (data.get("data") or {}).get("id") or
                (data.get("data") or {}).get("document_id") or
                data.get("id") or
                data.get("document_id")
            )
            if doc_id:
                # Add to the in-memory cache so it's searchable immediately
                if doc_id not in _catalyst_doc_ids:
                    _catalyst_doc_ids.append(str(doc_id))
                logger.info(f"Catalyst upload success: '{filename}' → doc_id={doc_id}")
                return str(doc_id)
            logger.warning(f"Catalyst upload succeeded but no doc ID in response: {data}")
        else:
            logger.error(f"Catalyst upload failed {resp.status_code}: {resp.text[:400]}")
    except Exception as e:
        logger.error(f"Catalyst file upload exception: {e}")
    return None


def catalyst_rag_answer(query: str, document_ids: list = None) -> dict:
    """
    Calls the Zoho Catalyst QuickML RAG Answer API.
    Auto-refreshes the access token on 401 responses.
    
    Headers:
      Authorization: Zoho-oauthtoken <token>  (auto-refreshed)
      CATALYST-ORG: <org-id>
    
    Body (JSON):
      { "query": "<message>", "documents": [<array-of-document-ids>] }
    
    Returns a dict with keys: success, answer, raw_response.
    """
    if document_ids is None:
        document_ids = get_catalyst_doc_ids()
    
    payload = {
        "query": query,
        "documents": document_ids
    }
    
    def _post(hdrs):
        return requests.post(
            CATALYST_RAG_URL,
            headers=hdrs,
            json=payload,
            timeout=60
        )
    
    try:
        logger.info(f"Calling Catalyst RAG API — query='{query[:80]}' docs={len(document_ids)}")
        resp = _post(_catalyst_headers())
        
        # Auto-retry once if token expired
        if resp.status_code == 401:
            logger.warning("Catalyst token expired. Refreshing and retrying...")
            _refresh_access_token()
            resp = _post(_catalyst_headers())
        
        if resp.ok:
            data = resp.json()
            answer = (
                data.get("answer") or
                data.get("response") or
                data.get("result") or
                (data.get("data") or {}).get("answer") or
                str(data)
            )
            return {"success": True, "answer": answer, "raw_response": data}
        else:
            logger.error(f"Catalyst RAG API error {resp.status_code}: {resp.text[:500]}")
            return {"success": False, "answer": None, "raw_response": resp.text}
    except Exception as e:
        logger.error(f"Catalyst RAG request failed: {e}")
        return {"success": False, "answer": None, "raw_response": str(e)}

class LocalVectorStore:
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        logger.info("Loading Local Embedding Model (all-MiniLM-L6-v2)...")
        # Lightweight semantic model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.vector_path = BASE_DIR / "rag_vectors.npy"

    def embed_texts(self, texts: list) -> np.ndarray:
        return self.model.encode(texts, convert_to_numpy=True)

    def save_vectors(self, vectors: np.ndarray):
        np.save(str(self.vector_path), vectors)

    def load_vectors(self) -> np.ndarray:
        if self.vector_path.exists():
            return np.load(str(self.vector_path))
        return np.array([])

# Instantiate globally so the model stays in memory
_local_store = None

def get_local_store():
    global _local_store
    if _local_store is None:
        _local_store = LocalVectorStore()
    return _local_store

def _local_vector_search(query: str, top_k: int = 4, min_score: float = 0.20) -> list:
    """Internal helper: runs semantic vector search against the local RAG store."""
    rag_data = load_rag_store()
    chunks = rag_data.get("chunks", [])
    if not chunks or not query.strip():
        return []
    try:
        store = get_local_store()
        vectors = store.load_vectors()
        if vectors.size == 0 or len(vectors) != len(chunks):
            logger.warning("Local vector index out of sync. Re-run ingest_pdfs.py to rebuild.")
            return []

        query_vector = store.embed_texts([query])[0]
        norms = np.linalg.norm(vectors, axis=1) * np.linalg.norm(query_vector)
        norms[norms == 0] = 1e-10
        similarities = np.dot(vectors, query_vector) / norms
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score >= min_score:
                chunk = chunks[idx]
                results.append({
                    "chunk_id":        chunk.get("chunk_id"),
                    "doc_name":        chunk.get("doc_name"),
                    "doc_type":        chunk.get("doc_type"),
                    "passage":         chunk.get("passage", ""),
                    "similarity_score": round(score, 3),
                    "uploaded_at":     chunk.get("uploaded_at"),
                    "source":          "local"
                })
        return results
    except Exception as e:
        logger.error(f"Local vector search failed: {e}")
        return []


def search_rag(query: str, top_k: int = 4, min_score: float = 0.20) -> list:
    """
    Hybrid RAG Strategy Router.

    RAG_PROVIDER modes:
    ─────────────────────────────────────────────────────────────────
    hybrid   → Query Catalyst Cloud (pre-indexed SOPs/PDFs) FIRST,
               then also run local vector search (for dynamically
               uploaded session files — CSVs, images, any format).
               Merge and return both result sets.

    catalyst → Catalyst Cloud only. Fallback to local if Catalyst
               returns nothing.

    local    → Local vector store only (offline mode).
    ─────────────────────────────────────────────────────────────────
    """
    combined_results = []

    # ── Catalyst Cloud RAG ──────────────────────────────────────────
    if RAG_PROVIDER in ("catalyst", "hybrid"):
        logger.info(f"[{RAG_PROVIDER.upper()} RAG] Querying Catalyst Cloud knowledge base...")
        cat_result = catalyst_rag_answer(query)
        if cat_result["success"] and cat_result["answer"]:
            answer = cat_result["answer"]
            # Only include if the response is meaningful (not the "I'm not sure" stub)
            if len(answer) > 30 and "not sure" not in answer.lower():
                combined_results.append({
                    "chunk_id":         "catalyst_cloud_response",
                    "doc_name":         "Zoho Catalyst RAG — Knowledge Base (SOP / PDF)",
                    "doc_type":         "Cloud Knowledge Base",
                    "passage":          answer,
                    "similarity_score": 1.0,
                    "uploaded_at":      "",
                    "source":           "catalyst"
                })
                logger.info("[Catalyst RAG] ✅ Retrieved answer from cloud knowledge base.")
                # Fast return if Catalyst Cloud returned a full answer
                return combined_results
            else:
                logger.info("[Catalyst RAG] Cloud returned generic/empty answer — skipping.")
        else:
            logger.warning("[Catalyst RAG] No answer returned from cloud.")

    # ── Local Vector Search (Fallback or Local-only mode) ─────────────
    if RAG_PROVIDER in ("local", "hybrid"):
        logger.info(f"[{RAG_PROVIDER.upper()} RAG] Running local vector search...")
        local_results = _local_vector_search(query, top_k=top_k, min_score=min_score)
        if local_results:
            combined_results.extend(local_results)
            logger.info(f"[Local RAG] ✅ Found {len(local_results)} local chunk(s).")
        else:
            logger.info("[Local RAG] No relevant local chunks found.")

    # ── Catalyst-only fallback to local ────────────────────────────
    if RAG_PROVIDER == "catalyst" and not combined_results:
        logger.warning("[Catalyst RAG] Nothing from cloud — falling back to local vector search.")
        combined_results = _local_vector_search(query, top_k=top_k, min_score=min_score)

    return combined_results
