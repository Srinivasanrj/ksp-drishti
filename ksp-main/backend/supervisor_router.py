import re
import json
import logging
from typing import List, Dict, Any, Optional
from llm import call_glm

logger = logging.getLogger(__name__)

# ============================================================
# SUPERVISOR AGENT ROUTER & AGENT METADATA
# Routes each query to the best specialized agent based on intent
# ============================================================

SUPERVISOR_ROUTER_PROMPT = """You are the Supervisor Router for the Karnataka State Police (KSP) Sentinel Command AI system.
Your job is to analyze the user's intent and dynamically route their query to one or more specialist agents. If the user's query requires multiple pieces of information (e.g., getting statistics AND asking for a procedure), you MUST select multiple agents.

Target Agents:
1. "analytics_agent": For numerical, statistical, counting, or database table queries (e.g., "How many murders happened in 2024?", "Total cyber crime cases in Bengaluru", "Show statistics for robbery").
2. "document_agent": For any query referencing official documents, PDFs, crime analysis reports, written narratives, annual reports, standard operating procedures (SOP), legal guidelines, rules, acts, zero FIR procedures, definitions, handbook instructions, policy explanations, or written document knowledge (e.g., "according to official documents", "report me the crime analysis", "What are the crime statistics in the document?", "What is the procedure for Zero FIR?"). NOTE: If the user asks for statistics AND mentions "documents", "reports", or "official files", select BOTH "analytics_agent" and "document_agent".
3. "pattern_agent": For finding similar crime cases, matching modus operandi (M.O.), finding repeated patterns, or discovering clusters/hotspots across cases.
4. "intelligence_agent": For tracking money mules, financial trails, bank accounts, UPI IDs, cross-district syndicates, or suspect networks.
5. "general_agent": For platform greetings, general help, or questions outside police operations.

Return ONLY a raw JSON object with the following schema:
{"agents": [{"name": "agent_name", "purpose": "brief reason why this agent is needed"}], "overall_confidence": 0.95}
"""

AGENT_META = {
    'analytics_agent':    {'label': 'Analytics Agent',    'icon': '📊', 'color': '#2563eb', 'description': 'Crime Statistics & SQL Database'},
    'document_agent':     {'label': 'Document Agent',     'icon': '📄', 'color': '#059669', 'description': 'RAG Knowledge Store & Case PDFs'},
    'pattern_agent':      {'label': 'Pattern Agent',      'icon': '🔍', 'color': '#d97706', 'description': 'Crime Pattern Matching & Similarity'},
    'intelligence_agent': {'label': 'Intelligence Agent', 'icon': '🕵️', 'color': '#7c3aed', 'description': 'Criminal Network & Mule Trail'},
    'general_agent':      {'label': 'KSP Sentinel AI',   'icon': '🛡️', 'color': '#1e40af', 'description': 'General Command Operations'},
}


def supervisor_agent_router(query: str, history: Optional[list] = None) -> dict:
    """
    Supervisor Agent: Semantically routes the query using the LLM classifier.
    Can route to multiple agents simultaneously.
    """
    q_clean = query.lower().strip()

    # ── EXPLICIT SLASH / BACKSLASH COMMAND DIRECT ROUTING ──────────────────────
    # Handles \document, /document, \analytics, /analytics, \pattern, /pattern
    if q_clean.startswith('\\document') or q_clean.startswith('/document'):
        logger.info(f"[Supervisor Agent] Explicit '\\document' command detected for query: '{query}'")
        return {
            'agents': [{
                'agent_type': 'document_agent',
                'purpose': 'Explicit \\document command trigger',
                'agent_label': 'Document Agent',
                'agent_icon': '📄',
                'agent_color': '#10b981',
                'agent_description': 'Zoho Catalyst RAG & Knowledge Base Search'
            }],
            'routing_confidence': 1.0
        }

    if q_clean.startswith('\\analytics') or q_clean.startswith('/analytics'):
        logger.info(f"[Supervisor Agent] Explicit '\\analytics' command detected for query: '{query}'")
        return {
            'agents': [{
                'agent_type': 'analytics_agent',
                'purpose': 'Explicit \\analytics command trigger',
                'agent_label': 'Analytics Agent',
                'agent_icon': '📊',
                'agent_color': '#3b82f6',
                'agent_description': 'Crime Statistics & SQL Database'
            }],
            'routing_confidence': 1.0
        }

    if q_clean.startswith('\\pattern') or q_clean.startswith('/pattern'):
        logger.info(f"[Supervisor Agent] Explicit '\\pattern' command detected for query: '{query}'")
        return {
            'agents': [{
                'agent_type': 'pattern_agent',
                'purpose': 'Explicit \\pattern command trigger',
                'agent_label': 'Pattern Agent',
                'agent_icon': '🔍',
                'agent_color': '#8b5cf6',
                'agent_description': 'Modus Operandi & Tactical Interrogation Co-Pilot'
            }],
            'routing_confidence': 1.0
        }
    
    # ── DOMAIN GUARDRAIL CHECK ────────────────────────────────────────────────
    # Off-topic queries (math like 1+1, pop culture like Mark Zuckerberg, general trivia/recipes)
    off_topic_patterns = [
        r'^\d+\s*[\+\-\*\/\^]\s*\d+$', # 1+1, 2*2, 10/2
        r'\b(mark zuckerberg|elon musk|taylor swift|movie|recipe|bake a cake|capital of france|who won the ipl|cricket score)\b'
    ]
    if any(re.search(pat, q_clean) for pat in off_topic_patterns):
        logger.warning(f"[Guardrail Agent] Off-topic query blocked: '{query}'")
        return {
            'agents': [{
                'agent_type': 'guardrail_agent',
                'purpose': 'Off-topic non-police query blocked by domain guardrail',
                'agent_label': '🛡️ KSP Guardrail Policy',
                'agent_icon': '🛡️',
                'agent_color': '#ef4444',
                'agent_description': 'Law Enforcement Boundary Enforcement'
            }],
            'routing_confidence': 1.0,
            'is_off_topic': True
        }

    # ── QUICK PRE-ROUTING FOR SPECIFIC INTENTS ─────────────────────────────────
    if any(w in q_clean for w in ['what is fir', 'what is a fir', 'what is zero fir', 'zero fir procedure', 'section 65b', '2-hour golden window']):
        return {
            'agents': [{
                'agent_type': 'general_agent',
                'purpose': 'Legal definition & SOP knowledge query',
                'agent_label': 'KSP Sentinel AI',
                'agent_icon': '🛡️',
                'agent_color': '#1e40af',
                'agent_description': 'General Command & Legal Operations'
            }],
            'routing_confidence': 1.0
        }
        
    if any(w in q_clean for w in ['interrogation strategy', 'questionnaire', 'interrogate', 'accused', 'victim', 'witness', 'fled']):
        return {
            'agents': [{
                'agent_type': 'pattern_agent',
                'purpose': 'Case narrative & Interrogation Co-Pilot',
                'agent_label': 'Pattern Agent',
                'agent_icon': '🔍',
                'agent_color': '#8b5cf6',
                'agent_description': 'Modus Operandi & Tactical Interrogation Co-Pilot'
            }],
            'routing_confidence': 1.0
        }

    selected_agents = [{'name': 'general_agent', 'purpose': 'Fallback semantic classification'}]
    confidence = 0.5

    try:
        messages = [
            {"role": "system", "content": SUPERVISOR_ROUTER_PROMPT},
            {"role": "user", "content": f"User Query: {query}"}
        ]
        res = call_glm(messages)
        content = res.get("response", "").strip()
        
        # Clean markdown wrappers if returned
        if "```json" in content:
            content = content.split("```json")[-1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[-1].split("```")[0].strip()
            
        parsed = json.loads(content)
        agents = parsed.get("agents", [])
        
        # Validate selected agents
        valid_agents = []
        for a in agents:
            if a.get("name") in AGENT_META:
                valid_agents.append(a)
                
        if valid_agents:
            selected_agents = valid_agents
            confidence = float(parsed.get("overall_confidence", 0.9))
            
    except Exception as e:
        logger.warning(f"[Supervisor Router] LLM semantic routing failed: {e}. Falling back to rule-based check.")
        q = query.lower()
        selected_agents = []
        if any(w in q for w in ['accused', 'victim', 'witness', 'complaint', 'assault', 'attack', 'fled', 'interrogate', 'interrogation', 'questionnaire', 'narrative', 'story', 'suspect']):
            selected_agents.append({'name': 'pattern_agent', 'purpose': 'Case narrative / interrogation strategy detected'})
        elif any(w in q for w in ['how many', 'total', 'count', 'statistics', 'trend', 'number', 'cases']):
            selected_agents.append({'name': 'analytics_agent', 'purpose': 'Count/statistics detected'})
        elif any(w in q for w in ['sop', 'guideline', 'policy', 'report', 'pdf']):
            selected_agents.append({'name': 'document_agent', 'purpose': 'Document/report query detected'})
        elif any(w in q for w in ['what is fir', 'what is zero fir', 'definition', 'legal definition', 'what is']):
            selected_agents.append({'name': 'general_agent', 'purpose': 'Legal definition query detected'})
            
        if not selected_agents:
            selected_agents = [{'name': 'general_agent', 'purpose': 'Fallback rule'}]
        confidence = 0.85

    # Enrich with metadata
    enriched_agents = []
    for a in selected_agents:
        meta = AGENT_META[a["name"]]
        enriched_agents.append({
            'agent_type': a["name"],
            'purpose': a["purpose"],
            'agent_label': meta['label'],
            'agent_icon': meta['icon'],
            'agent_color': meta['color'],
            'agent_description': meta['description']
        })
        logger.info(f"[Supervisor Agent] Orchestrator selected '{a['name']}' | Purpose: {a['purpose']}")

    return {
        'agents': enriched_agents,
        'routing_confidence': confidence
    }


def fallback_local_query(user_query: str) -> dict:
    """
    Fallback regex/keyword parser for local SQLite crime queries when LLM is unavailable.
    """
    query_lower = user_query.lower()
    
    year = None
    year_match = re.search(r'\b(202[0-9])\b', query_lower)
    if year_match:
        year = year_match.group(1)
        
    months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
    month = None
    for m in months:
        if m in query_lower:
            month = m.capitalize()
            break
            
    categories = {
        "murder": "Murder",
        "dacoity": "Dacoity",
        "robbery": "Robbery",
        "burglary": "Burglary",
        "theft": "Theft",
        "riot": "Riots",
        "hurt": "Hurt",
        "pocso": "POCSO",
        "cyber": "Cyber Crimes",
        "economic": "Economic Offences",
        "drug": "NDPS Cases",
        "ndps": "NDPS Cases",
        "security": "Security Cases"
    }
    
    category = None
    for k, v in categories.items():
        if k in query_lower:
            category = v
            break
            
    operation = "list_categories"
    if any(w in query_lower for w in ["count", "how many", "number of", "total"]):
        operation = "count"
    elif any(w in query_lower for w in ["highest", "most", "maximum", "peak"]):
        operation = "highest_crime"
    elif any(w in query_lower for w in ["statistics", "subcategory", "breakdown", "details"]):
        operation = "show_statistics"
        
    intent = {
        "operation": operation,
        "crime_category": category,
        "month": month,
        "year": year
    }
    return intent


def fallback_format_answer(user_query: str, intent: dict, rows: list, rag_results: list = None) -> str:
    """
    Fallback formatter for local SQLite results and RAG chunks.
    """
    ans_parts = []
    
    if rag_results:
        ans_parts.append("### 🧠 RAG Knowledge Base Retrieval")
        for idx, r in enumerate(rag_results, 1):
            doc_name = r.get("doc_name")
            score_pct = int(r.get("similarity_score", 0) * 100)
            passage = r.get("passage")
            ans_parts.append(f"**[{idx}] Source: `{doc_name}`** *(Match Relevance: {score_pct}%)*\n> \"{passage}\"\n")
        ans_parts.append("---")

    operation = intent.get("operation") if intent else "unknown"
    category = intent.get("crime_category") if intent else None
    month = intent.get("month") if intent else None
    year = intent.get("year") if intent else None
    
    if rows:
        if operation == "count":
            total_cases = rows[0].get("Total_Cases")
            if total_cases is not None:
                msg = f"According to local SCRB crime records, there were **{total_cases}** total cases reported"
                if category:
                    msg += f" under the **{category}** category"
                if month or year:
                    msg += " in "
                    if month:
                        msg += f"{month} "
                    if year:
                        msg += f"{year}"
                msg += "."
                ans_parts.append(msg)
                
        elif operation == "highest_crime":
            cat = rows[0].get("Crime_Category")
            cases = rows[0].get("Total_Cases")
            msg = f"The highest recorded crime category"
            if year:
                msg += f" for the year {year}"
            msg += f" was **{cat}** with **{cases}** cases."
            ans_parts.append(msg)
            
        elif operation == "list_categories":
            lines = []
            for r in rows[:8]:
                lines.append(f"- **{r['Crime_Category']}**: {r['Total_Cases']} cases")
            title = "Local database category breakdown:\n"
            ans_parts.append(title + "\n".join(lines))
            
        elif operation == "show_statistics":
            lines = []
            for r in rows[:10]:
                lines.append(f"- **{r['Subcategory']}**: {r['Cases']} cases")
            title = f"Detailed subcategory breakdown:\n"
            ans_parts.append(title + "\n".join(lines))

    if not ans_parts:
        return "I searched both the RAG Knowledge Store and local SQLite database, but found no matching records."
    return "\n\n".join(ans_parts)
