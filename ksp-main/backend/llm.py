import os
import json
import logging
import requests
from config import Config
from prompts import ANSWER_FORMATTING_PROMPT, RAG_ANSWER_FORMATTING_PROMPT

# Configure logging
logger = logging.getLogger(__name__)

def _clean_glm_response(content: str) -> str:
    """
    Strips GLM-4.7B chain-of-thought leakage from response text.
    GLM sometimes outputs internal monologues like 'Wait, looking at...',
    numbered reasoning steps, 'Self-Correction during drafting:', or '//NO I18N' comments.
    This function cleans all artifacts and returns only the final clean answer.
    """
    import re
    if not content:
        return content

    # Strip </think> tags
    if '</think>' in content:
        content = content.split('</think>')[-1].strip()

    # Strip <thought>...</thought> blocks entirely
    content = re.sub(r'<thought>[\s\S]*?</thought>', '', content, flags=re.IGNORECASE).strip()

    # ── NEW: Strip "Self-Correction during drafting:" and everything after it ──
    # GLM-4.7B sometimes appends a drafting/calculation section after the real answer.
    # Patterns like: "Self-Correction during drafting:", "Calculations Check:", "Draft Check:"
    self_correction_patterns = [
        r'\n\s*Self[\-\s]Correction\s+during\s+drafting\s*:.*',
        r'\n\s*Calculations?\s+Check\s*:.*',
        r'\n\s*Draft\s+Check\s*:.*',
        r'\n\s*Verification\s*:.*',
        r'\n\s*Let\s+me\s+recalculate.*',
        r'\n\s*\*\s*Total:\s*\d+.*',        # "* Total: 15000 ..." calculation lines
    ]
    for pat in self_correction_patterns:
        content = re.sub(pat, '', content, flags=re.IGNORECASE | re.DOTALL)

    # ── NEW: Strip step-label prefixes that are planning artifacts ─────────────
    # GLM sometimes starts lines with "Insight:*", "Table:*", "Context:*"
    # These are formatting instructions, not real content.
    step_label_pattern = re.compile(
        r'^\s*(Insight|Table|Context|Note|Format|Output)\s*:\s*\*?\s*',
        re.IGNORECASE | re.MULTILINE
    )
    content = step_label_pattern.sub('', content)

    # Strip internal monologue starting with "Wait, ..." or "Wait looking at..."
    if 'Wait,' in content or 'Wait ' in content:
        # If "Revised Final Output:" or "Final Answer:" exists after Wait, take what follows
        marker_match = re.search(r'(?:\*?\*?(?:Revised\s+)?Final\s+(?:Output|Answer|Version|Response)\*?\*?:?)\s*(.+)', content, re.IGNORECASE | re.DOTALL)
        if marker_match:
            content = marker_match.group(1).strip()
        else:
            # Cut off everything from "Wait," onwards if it comes after text
            parts = re.split(r'\n\s*Wait[,\s]', content, flags=re.IGNORECASE)
            if parts[0].strip():
                content = parts[0].strip()

    # Strip raw code comments like //NO I18N or // No I18N
    content = re.sub(r'//\s*NO\s*I18N', '', content, flags=re.IGNORECASE)

    # Detect numbered reasoning pattern: "1. **Analyze..." or "1. Analyze..."
    reasoning_pattern = re.compile(r'^\s*\d+\.\s+\*{0,2}(Analyze|Draft|Refin|Final|Polish|Output)', re.IGNORECASE | re.MULTILINE)
    if reasoning_pattern.search(content):
        final_markers = [
            r'(?:Revised\s+)?Final\s+(?:Output\s+Generation|Answer|Version|Response).*?:\s*(?:.*?\n)?(.+)',
            r'\*Revised Final Version\*:?\s*(.+)',
        ]
        for pattern in final_markers:
            m = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if m:
                extracted = m.group(1).strip()
                if len(extracted) > 30:
                    content = extracted.strip('"\'')
                    break
        else:
            # Clean split on line numbers without consuming leading word characters (\w)
            parts = re.split(r'\n\s*\d+\.\s+', content)
            if len(parts) > 1:
                last_part = parts[-1].strip()
                if len(last_part) > 30:
                    content = last_part

    # Clean stray trailing asterisks after colons (e.g. "Section 65B Steps:*" -> "Section 65B Steps:")
    content = re.sub(r':\s*\*+\s*$', ':', content, flags=re.MULTILINE)
    content = re.sub(r':\s*\*+\s*\n', ':\n', content)

    return content.strip()



def call_glm(messages: list) -> dict:
    """
    Sends a POST request to Zoho Catalyst QuickML GLM-4.7-Flash.
    Auto-refreshes the OAuth token on 401 and retries once.
    """
    for attempt in range(2):
        url = f"https://api.catalyst.zoho.in/quickml/v1/project/{Config.CATALYST_PROJECT_ID}/glm/chat"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Zoho-oauthtoken {Config.CATALYST_ACCESS_TOKEN}",
            "CATALYST-ORG": str(Config.CATALYST_ORG_ID)
        }
        payload = {
            "model": "crm-di-glm47b_30b_it",
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 1200
        }

        logger.info(f"API request to Catalyst GLM Chat URL (attempt {attempt+1}): {url}")

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            logger.info(f"API response status: {response.status_code}")

            # Auto-refresh token on 401 and retry once
            if response.status_code == 401 and attempt == 0:
                logger.warning("Got 401 INVALID_OAUTHTOKEN on GLM. Attempting token refresh...")
                if Config.refresh_access_token():
                    continue  # retry with new token
                else:
                    raise Exception("Token refresh failed. Cannot recover from 401.")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout as e:
            logger.error(f"Timeouts during API request: {e}")
            raise
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error occurred while calling Catalyst GLM: {e.response.status_code} - {e.response.text}")
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Network or timeout error during Catalyst API request: {e}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failures on API response: {e}")
            raise

    raise Exception("call_glm: exhausted all retry attempts.")

def call_quickml_rag_answer(user_query: str, document_ids: list = None) -> str:
    """
    Sends a POST request to Zoho Catalyst QuickML RAG Answer API.
    Endpoint: https://console.catalyst.zoho.in/quickml/v1/project/{pid}/rag/answer
    Body: { "query": "...", "documents": [<doc-id-1>, ...] }

    document_ids: list of Catalyst knowledge-base document IDs to search.
                  If None, loads all IDs from the Catalyst doc registry.
    """
    from rag_engine import get_catalyst_doc_ids

    url = f"https://console.catalyst.zoho.in/quickml/v1/project/{Config.CATALYST_PROJECT_ID}/rag/answer"

    # Load document IDs — pre-indexed knowledge base docs + any dynamically uploaded
    if document_ids is None:
        document_ids = get_catalyst_doc_ids()

    def _make_headers():
        return {
            "Content-Type": "application/json",
            "Authorization": f"Zoho-oauthtoken {Config.CATALYST_ACCESS_TOKEN}",
            "CATALYST-ORG": str(Config.CATALYST_ORG_ID)
        }

    payload = {
        "query": user_query,
        "documents": document_ids   # array of document IDs from Catalyst knowledge base
    }

    logger.info(f"Calling Catalyst RAG API — query length={len(user_query)}, doc_ids={document_ids}")

    def _post(hdrs):
        return requests.post(url, headers=hdrs, json=payload, timeout=60)

    try:
        response = _post(_make_headers())

        # Auto-refresh token on 401 and retry once
        if response.status_code == 401:
            logger.warning("Catalyst RAG 401 — refreshing token and retrying...")
            Config.refresh_access_token()
            response = _post(_make_headers())

        logger.info(f"QuickML RAG API response status: {response.status_code}")

        if not response.ok:
            logger.error(f"QuickML RAG API returned HTTP {response.status_code}: {response.text[:400]}")
            raise requests.exceptions.HTTPError(response=response)

        res_json = response.json()
        logger.info(f"QuickML RAG API response JSON: {res_json}")

        ans = (
            res_json.get("response") or
            res_json.get("answer") or
            res_json.get("result") or
            res_json.get("output") or
            (res_json.get("data") or {}).get("answer") or
            (res_json.get("data") or {}).get("response")
        )

        if ans:
            ans_str = str(ans).strip()
            if '</think>' in ans_str:
                ans_str = ans_str.split('</think>')[-1].strip()
            return ans_str

        logger.warning(f"QuickML RAG API returned empty or unknown schema: {res_json}. Returning default.")
        return "I could not find the relevant information in the Knowledge Base."
    except Exception as e:
        logger.error(f"Error calling Zoho Catalyst QuickML RAG Answer API ({url}): {e}")
        return f"Error retrieving information from Knowledge Base: {str(e)}"


def _regex_fallback_intent(query: str) -> dict:
    """Self-contained regex fallback intent extractor."""
    q = query.lower()
    cat = None
    if 'murder' in q: cat = 'Murder'
    elif 'robbery' in q: cat = 'Robbery'
    elif 'theft' in q or 'stolen' in q: cat = 'Theft'
    elif 'burglary' in q: cat = 'Burglary'
    elif 'women' in q or 'rape' in q: cat = 'Crime against Women'
    elif 'cyber' in q or 'online' in q: cat = 'Cyber Crimes'
    elif 'ndps' in q or 'drug' in q: cat = 'NDPS Cases'

    month = None
    months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    short_months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    for m, sm in zip(months, short_months):
        if m in q or sm in q:
            month = m.capitalize()
            break

    year = None
    import re
    y_match = re.search(r'\b(202[2-6])\b', q)
    if y_match:
        year = y_match.group(1)

    op = "count"
    if 'compare' in q or 'versus' in q or 'vs' in q:
        op = "compare_years"
    elif 'highest' in q or 'top' in q or 'most' in q:
        op = "highest_crime"
    elif 'list' in q or 'all' in q:
        op = "list_categories"
    elif cat:
        op = "show_statistics"

    return {
        "operation": op,
        "crime_category": cat,
        "month": month,
        "year": year,
        "year1": None,
        "year2": None
    }



def format_answer(user_query: str, intent: dict, data: list) -> str:
    """
    Calls Catalyst GLM to format the final answer based on DB results.
    """
    logger.info("Formatting final answer using Catalyst GLM")
    
    prompt = ANSWER_FORMATTING_PROMPT.format(
        user_query=user_query,
        intent_json=json.dumps(intent, indent=2),
        sql_results=json.dumps([dict(row) for row in data], indent=2)
    )
    
    messages = [
        {
            "role": "system",
            "content": "You are KSP Sentinel Command AI. Output ONLY the final answer. Do NOT show any reasoning steps, analysis, drafts, or numbered thought processes. Output the professional answer directly."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
    
    response_data = call_glm(messages)
    content = response_data.get("response", "")
    return _clean_glm_response(content)

def format_rag_answer(user_query: str, rag_results: list, db_context: str = "") -> str:
    """
    Formulates a response incorporating retrieved RAG passages.
    Delegates to QuickML RAG Answer endpoint:
    https://api.catalyst.zoho.in/quickml/v1/project/{Config.CATALYST_PROJECT_ID}/rag/answer
    Note: document_ids are loaded internally from the Catalyst registry.
    """
    return call_quickml_rag_answer(user_query)  # doc IDs loaded internally via get_catalyst_doc_ids()

def format_rag_answer_fallback(user_query: str, rag_results: list, db_context: str = "") -> str:
    """
    Fallback RAG answer formatter using Catalyst GLM Chat.
    """
    logger.info("Formatting RAG augmented answer using Catalyst GLM Chat Fallback")
    
    passages_str = ""
    if rag_results:
        for idx, r in enumerate(rag_results, 1):
            passages_str += f"\n[{idx}] Document: {r.get('doc_name')} (Type: {r.get('doc_type')}, Match: {int(r.get('similarity_score', 0)*100)}%)\nPassage: {r.get('passage')}\n"
        
    prompt = RAG_ANSWER_FORMATTING_PROMPT.format(
        user_query=user_query,
        rag_passages=passages_str if passages_str else "No explicit PDF passages retrieved.",
        db_context=db_context if db_context else "None"
    )
    
    messages = [
        {
            "role": "system",
            "content": "You are KSP Sentinel Command AI. Output ONLY the final answer. Do NOT show any reasoning steps, analysis, drafts, or numbered thought processes. Output the professional answer directly without exposing your internal monologue."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
    
    try:
        response_data = call_glm(messages)
        content = response_data.get("response", "")
        
        if '</think>' in content:
            content = content.split('</think>')[-1]
            
        return content.strip()
    except Exception as err:
        logger.error(f"Fallback GLM Chat formatting error: {err}")
        return "I retrieved the RAG document passages, but experienced a network error while formatting the response."

def synthesize_multi_agent_answer(user_query: str, sql: str, rows: list, rag_results) -> str:
    """
    Synthesizes a unified response combining SQL Analytics data and RAG Document data.
    Enforces Zoho-style structured output (Executive Summary, Key Findings, Operational Takeaways).
    """
    logger.info("Synthesizing multi-agent answer using Catalyst GLM Chat")
    import json

    db_str = "None"
    if rows:
        db_str = json.dumps([dict(row) for row in rows[:15]], indent=2)

    passages_str = "None"
    if rag_results:
        if isinstance(rag_results, str):
            passages_str = rag_results
        elif isinstance(rag_results, list):
            pass_parts = []
            for idx, r in enumerate(rag_results, 1):
                if isinstance(r, dict):
                    pass_parts.append(f"[{idx}] Source: {r.get('doc_name', 'Document')}\nPassage: {r.get('passage', '')}")
                else:
                    pass_parts.append(f"[{idx}] Passage: {str(r)}")
            passages_str = "\n\n".join(pass_parts)

    prompt = f"""You are KSP Sentinel Command AI.
The user asked a question requiring a multi-agent intelligence synthesis.
Synthesize a clean, structured, authoritative response matching this exact section layout:

### 📌 Executive Summary
(2-3 sentence high-level direct answer to the query)

### 🔹 Key Findings & Statistics
(Bullet points presenting numbers, case counts, or document details clearly)

### ⚖️ Operational Guidelines & Takeaways
(2-3 sentence practical guidance or legal next-steps for the officer)

USER QUERY: {user_query}

DATABASE DATA (From Analytics Agent):
{db_str}

DOCUMENT PASSAGES (From Document Agent):
{passages_str}

CRITICAL RULES:
1. Do NOT output any internal monologues, reasoning steps, or scratchpads like "Wait, looking at...".
2. Do NOT output code comments like "//NO I18N".
3. If no numbers exist in database or documents, state that clearly in the Key Findings.
"""

    messages = [
        {
            "role": "system",
            "content": "You are KSP Sentinel Command AI. Output ONLY the final structured response. Do NOT show reasoning steps or internal monologue."
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    try:
        response_data = call_glm(messages)
        content = response_data.get("response", "")
        return _clean_glm_response(content)
    except Exception as err:
        logger.error(f"Multi-agent synthesis error: {err}")
        return "I retrieved the intelligence from multiple agents, but experienced a network error while synthesizing the final response."

