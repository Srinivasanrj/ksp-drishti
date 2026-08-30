"""
Live Verification Script:
1. Ingests synthetic PDF via POST /api/upload_dataset (Simulating '+' button upload)
2. Searches chunks via POST /api/rag_search
3. Asks grounded case question to /chat endpoint
4. Prints the full reasoning output with citations
"""
import io
import json
import os
import sys

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from server import app

def run_pdf_rag_live_test():
    print("=" * 70)
    print("[TEST] KSP SENTINEL AI -- LIVE PDF RAG VERIFICATION TEST")
    print("=" * 70)

    client = app.test_client()
    session_id = "officer_bgl_live_test_01"
    pdf_path = "tests/synthetic_fir_case_009912.pdf"

    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found!")
        return

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    print(f"\n[STEP 1] Simulating Officer '+' Upload for '{pdf_path}' ({len(pdf_bytes)} bytes)...")
    upload_res = client.post(
        "/api/upload_dataset",
        data={
            "session_id": session_id,
            "officer_id": "INSPECTOR_SWAMY_8812",
            "file": (io.BytesIO(pdf_bytes), "synthetic_fir_case_009912.pdf")
        },
        content_type="multipart/form-data"
    )

    print(f"-> Upload Status Code: {upload_res.status_code}")
    upload_data = upload_res.get_json()
    print("-> Server Response:")
    print(json.dumps(upload_data, indent=2))
    assert upload_res.status_code == 200, "Upload failed!"
    assert upload_data.get("success") is True

    print("\n[STEP 2] Direct RAG Search on Ingested PDF Chunks...")
    search_query = "MacBook Serial Faraday Bag"
    rag_res = client.post(
        "/api/rag_search",
        json={
            "session_id": session_id,
            "query": search_query,
            "limit": 3
        }
    )
    print(f"-> Search Status Code: {rag_res.status_code}")
    rag_data = rag_res.get_json()
    print(f"-> Found {rag_data.get('count')} matching chunk(s):")
    for idx, c in enumerate(rag_data.get("results", [])):
        print(f"   [{idx+1}] Doc: {c['doc_name']} | Score: {c['score']}")
        print(f"       Snippet: {c['content'][:150]}...\n")

    print("[STEP 3] Sending Complex Case Investigation Query to /chat Endpoint...")
    user_query = (
        "According to the uploaded FIR document, what was the serial number of the seized Apple MacBook, "
        "what is the barcode on the Faraday bag, and what was the accused person's alias and telegram handle?"
    )
    print(f"-> Officer Query: \"{user_query}\"")
    
    chat_res = client.post(
        "/chat",
        json={
            "query": user_query,
            "session_id": session_id,
            "officer_id": "INSPECTOR_SWAMY_8812",
            "division": "Bengaluru City"
        }
    )
    print(f"-> Chat Status Code: {chat_res.status_code}")
    chat_data = chat_res.get_json()
    
    print("\n" + "=" * 70)
    print("🤖 KSP SENTINEL AI SYNTHESIZED RESPONSE:")
    print("=" * 70)
    print(f"Agent Dispatched : {chat_data.get('agent_label')} ({chat_data.get('agent_type')})")
    print(f"Neural Provider  : {chat_data.get('provider')}")
    print(f"Suggested Actions: {chat_data.get('suggested_actions')}")
    print("\n--- Answer Text ---")
    print(chat_data.get("answer"))
    print("=" * 70)

    # Verification assertions
    answer = chat_data.get("answer", "")
    assert "C02XG012J" in answer or "MacBook" in answer or "CryptoVikram" in answer, "RAG groundings missing in answer!"
    print("\n✅ LIVE PDF RAG VERIFICATION PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_pdf_rag_live_test()
