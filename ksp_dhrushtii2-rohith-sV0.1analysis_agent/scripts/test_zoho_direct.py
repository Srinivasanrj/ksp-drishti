"""
Direct Live Test for Zoho Catalyst QuickML RAG API Model
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.providers.zoho_provider import ZOHO_KNOWLEDGE_DOCS, ZohoQuickMLProvider

def test_zoho_live_queries():
    print("=" * 75)
    print("TESTING ZOHO CATALYST QUICKML API DIRECTLY")
    print("=" * 75)

    provider = ZohoQuickMLProvider()
    print(f"Provider Available: {provider.is_available()}")
    print(f"Project ID        : {provider.project_id}")
    print(f"Org ID            : {provider.org_id}")
    print(f"Endpoint URL      : {provider.endpoint_url}")
    print(f"Knowledge Doc IDs : {len(ZOHO_KNOWLEDGE_DOCS)} pre-indexed docs")

    test_queries = [
        "What are the major crime categories and crime statistics reported in Karnataka?",
        "Explain the procedure for cyber crime and online fraud reporting under police guidelines.",
        "Summarize the crime analytics and trends from the crime dataset documents."
    ]

    for idx, q in enumerate(test_queries, 1):
        print(f"\n[{idx}] Testing Query: '{q}'")
        messages = [
            {"role": "system", "content": "You are KSP Sentinel AI, Karnataka Police Intelligence Assistant."},
            {"role": "user", "content": q}
        ]
        try:
            answer, name = provider.complete(messages, max_tokens=1000)
            print(f"-> Provider: [{name}]")
            print("-> Response:")
            print("-" * 60)
            print(answer)
            print("-" * 60)
        except Exception as e:
            print(f"-> Error/Scope limit: {e}")

if __name__ == "__main__":
    test_zoho_live_queries()
