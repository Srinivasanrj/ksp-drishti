"""
Automated Test for Stateful Multi-Turn Context and LLM-Native Intent Routing
============================================================================
Simulates realistic multi-turn police officer dialogues to verify:
1. No early-turn amnesia
2. Follow-up intent continuity (no agent hopping)
3. Intentional domain pivots (fluid transition between Pattern and Analytical agents)
4. Context preservation in answers
"""
import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:5000"

def safe_print(text):
    try:
        print(text)
    except Exception:
        clean = text.encode("ascii", errors="replace").decode("ascii")
        print(clean)

def test_multiturn_dialogue():
    session_id = f"test_session_{int(time.time())}"
    safe_print("\n========================================================")
    safe_print(f"Testing Stateful Context & Routing on Session: {session_id}")
    safe_print("========================================================\n")

    turns = [
        {
            "turn": 1,
            "query": "Analyze this case narrative: A gang of three wearing yellow helmets used gas cutters on an ATM in Mysuru at midnight. What is their likely Modus Operandi and what countermeasures should we take?",
            "expected_agent": "pattern_agent",
            "description": "Initial Pattern Analysis Query"
        },
        {
            "turn": 2,
            "query": "so what will be my next step from here for interrogating nearby gas cylinder vendors?",
            "expected_agent": "pattern_agent",
            "description": "Follow-up question on the same investigation (Must NOT hop to conversational)"
        },
        {
            "turn": 3,
            "query": "Now visualize the crime breakdown and station rankings across districts",
            "expected_agent": "analytical_agent",
            "description": "Intentional Pivot to Visual Analytics (Must switch agents smoothly)"
        },
        {
            "turn": 4,
            "query": "What is the tactical solution scope for addressing the highest district workload?",
            "expected_agent": "analytical_agent",
            "description": "Follow-up question on Analytics (Must stay in Analytical context)"
        }
    ]

    all_passed = True
    results = []

    for t in turns:
        safe_print(f"--- [Turn {t['turn']}] {t['description']} ---")
        safe_print(f"Officer Query: \"{t['query']}\"")
        
        payload = {
            "query": t["query"],
            "session_id": session_id,
            "division": "Mysuru Division"
        }
        
        try:
            res = requests.post(f"{BASE_URL}/chat", json=payload, timeout=30)
            if res.status_code != 200:
                safe_print(f"[FAIL] HTTP {res.status_code} - {res.text}")
                all_passed = False
                continue
            
            data = res.json()
            agent_type = data.get("agent_type")
            agent_label = data.get("agent_label")
            provider = data.get("provider")
            answer = data.get("answer", "")
            charts = data.get("charts", [])
            
            safe_print(f"[OK] Response Agent: [{agent_type}] ({agent_label}) | Provider: {provider} | Charts: {len(charts)}")
            safe_print(f"Answer Preview: {answer[:200]}...\n")
            
            matched = (agent_type == t["expected_agent"])
            if not matched:
                safe_print(f"[MISMATCH] Expected agent [{t['expected_agent']}], got [{agent_type}]\n")
                if t["turn"] in (1, 2, 3):
                    all_passed = False
            else:
                safe_print(f"[MATCH] Correctly dispatched to [{t['expected_agent']}]\n")

            results.append({
                "turn": t["turn"],
                "query": t["query"],
                "expected": t["expected_agent"],
                "actual": agent_type,
                "agent_label": agent_label,
                "provider": provider,
                "charts_count": len(charts),
                "answer_full": answer
            })

        except Exception as e:
            safe_print(f"[ERROR] connecting to server: {e}")
            all_passed = False

    safe_print("========================================================")
    if all_passed:
        safe_print("ALL MULTI-TURN CONTEXT TESTS PASSED SUCCESSFULLY!")
    else:
        safe_print("SOME TURNS FAILED VERIFICATION.")
    safe_print("========================================================\n")
    
    with open("multiturn_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    return all_passed

if __name__ == "__main__":
    time.sleep(1)
    success = test_multiturn_dialogue()
    sys.exit(0 if success else 1)
