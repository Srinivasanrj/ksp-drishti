import os
import logging
from pathlib import Path
from rag_engine import process_and_index_file

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
DATASET_DIR = BASE_DIR.parent / "datathon_dataset" / "pdf_data"

def ingest_all_pdfs():
    if not DATASET_DIR.exists():
        logger.error(f"PDF directory {DATASET_DIR} does not exist.")
        return

    pdf_files = list(DATASET_DIR.glob("*.pdf"))
    logger.info(f"Found {len(pdf_files)} PDF files to index.")

    for i, pdf_path in enumerate(pdf_files, 1):
        filename = pdf_path.name
        logger.info(f"[{i}/{len(pdf_files)}] Ingesting {filename}...")
        try:
            with open(pdf_path, "rb") as f:
                file_bytes = f.read()
                
            res = process_and_index_file(file_bytes, filename)
            if res.get("success"):
                logger.info(f" -> Success! Extracted {res.get('chunks_indexed')} chunks.")
            else:
                logger.warning(f" -> Failed or returned empty chunks.")
        except Exception as e:
            logger.error(f" -> Error ingesting {filename}: {e}")

    logger.info("=== PDF Ingestion Completed ===")
    
    logger.info("=== Generating Semantic Vectors ===")
    from rag_engine import get_local_store, load_rag_store
    store = get_local_store()
    rag_data = load_rag_store()
    chunks = rag_data.get("chunks", [])
    if chunks:
        texts = [c.get("passage", "") for c in chunks]
        logger.info(f"Embedding {len(texts)} chunks. This may take a moment...")
        vectors = store.embed_texts(texts)
        store.save_vectors(vectors)
        logger.info(f"Successfully saved {len(vectors)} semantic vectors to {store.vector_path}")

if __name__ == "__main__":
    ingest_all_pdfs()
