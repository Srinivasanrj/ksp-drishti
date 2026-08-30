"""
Test script verifying Zoho QuickML Provider as First-Preference LLM.
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.providers.orchestrator import llm_complete

def test_zoho_primary_preference():
    print("=" * 70)
    print("[TEST] VERIFYING ZOHO QUICKML AS 1ST PREFERENCE PROVIDER")
    print("=" * 70)

    # Query matching standard KSP SOPs in Zoho Catalyst KB
    messages = [
        {"role": "system", "content": "You are KSP Sentinel AI, law enforcement assistant."},
        {"role": "user", "content": "What is the standard procedure for investigating cyber crime financial fraud?"}
    ]

    print("\nExecuting query through Orchestrator (Priority 1: Zoho QuickML)...")
    answer, provider = llm_complete(messages, json_mode=False, max_tokens=500)

    print("\n" + "=" * 70)
    print(f"ACTIVE PROVIDER RESOLVED: [{provider}]")
    print("=" * 70)
    print("\n--- Model Response ---")
    print(answer)
    print("=" * 70)

    assert provider == "zoho_quickml", f"Expected 'zoho_quickml' as first preference, got '{provider}'"
    print("\n[SUCCESS] Zoho QuickML successfully responded as 1st Preference Provider!")

if __name__ == "__main__":
    test_zoho_primary_preference()
