import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.providers.gemini_provider import GeminiProvider

SUPERVISOR_PROMPT = """You are the Triage Supervisor for the KSP Sentinel AI system.
Your job is ONLY to read the user's query and the active context, and route the query to the correct Worker Agent.
You must output a raw JSON object containing the key "route" and a "reasoning" key. Do not output markdown code blocks, just raw JSON.

Available Routes:
- "analytics": Queries asking for statistical charts, loss comparisons, multi-disciplinary data analysis.
- "document": Queries asking to search SOPs, laws, or RAG documents.
- "network": Queries asking to trace connections, links, syndicates, or paths between entities.
- "forensics": Queries asking to analyze audio, translate, or map text to BNS (Bharatiya Nyaya Sanhita) laws.
- "spatial": Queries asking to investigate maps, dispatch Zoho Desk tickets, or query Zoho CRM for repeat offenders in a district.
- "general": Queries that are casual greetings or do not fit the above.

Example Output:
{"route": "analytics", "reasoning": "User asked for financial loss vs vehicle theft comparison."}
"""

def run_feasibility_test():
    print("=== STARTING SUPERVISOR FEASIBILITY TEST ===")
    
    test_cases = [
        {
            "query": "Perform a multi-disciplinary analysis on financial loss vs vehicle theft.",
            "context": None,
            "expected_route": "analytics"
        },
        {
            "query": "Check Zoho CRM for repeat suspects operating here.",
            "context": {"type": "SPATIAL_HOTSPOT", "district": "Bengaluru Urban"},
            "expected_route": "spatial"
        },
        {
            "query": "Trace the connection between Ramesh and Imran.",
            "context": None,
            "expected_route": "network"
        },
        {
            "query": "Transcribe this intercepted audio and map it to BNS.",
            "context": None,
            "expected_route": "forensics"
        },
        {
            "query": "Hello Sentinel, what is your operational status?",
            "context": None,
            "expected_route": "general"
        }
    ]

    success_count = 0
    
    try:
        provider = GeminiProvider()
    except Exception as e:
        print(f"[FAIL] Could not initialize GeminiProvider: {e}")
        return

    for i, test in enumerate(test_cases):
        print(f"\n[Test {i+1}] Query: '{test['query']}'")
        if test['context']:
            print(f"         Context: {test['context']}")
            
        content_text = f"User Query: {test['query']}\n"
        if test['context']:
            content_text += f"Active Context: {test['context']}\n"
            
        messages = [
            {"role": "system", "content": SUPERVISOR_PROMPT},
            {"role": "user", "content": content_text}
        ]
            
        print("         Evaluating route...")
        try:
            response_text, provider_name = provider.complete(messages, json_mode=True)
            print(f"         Raw Output: {response_text}")
            
            # Simple check if expected route is in the output
            if test["expected_route"] in response_text.lower():
                print(f"         [PASS] Correctly routed to: {test['expected_route']}")
                success_count += 1
            else:
                print(f"         [FAIL] Did not route to expected: {test['expected_route']}")
                
        except Exception as e:
            print(f"         [ERROR] Exception during generation: {e}")
            
    print(f"\n=== FEASIBILITY TEST COMPLETE: {success_count}/{len(test_cases)} PASSED ===")
    if success_count == len(test_cases):
        print("CONCLUSION: The Agentic Swarm Supervisor design is 100% FEASIBLE with the current architecture.")
    else:
        print("CONCLUSION: The Agentic Swarm Supervisor design needs prompt tuning.")

if __name__ == "__main__":
    run_feasibility_test()
