"""
KSP Sentinel AI — Zoho Catalyst QuickML & GenAI Provider (Primary)
SOLID: DIP Compliant BaseLLMProvider Implementation
"""
import logging
import os
import requests
from typing import Dict, List, Optional, Tuple
from app.config import (
    CATALYST_ORG_ID,
    CATALYST_PROJECT_ID,
    ZOHO_ACCESS_TOKEN,
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
)
from app.providers.base import BaseLLMProvider

log = logging.getLogger("standalone.provider.zoho")

# Default 51 Indexed Knowledge Base Document IDs from Zoho Catalyst Knowledge Store
_DEFAULT_KNOWLEDGE_DOCS = [
    "3407000000004223", "3407000000003546", "3407000000004461", "3407000000004473",
    "3407000000004469", "3407000000004465", "3407000000003542", "3407000000003527",
    "3407000000003502", "3407000000004439", "3407000000003512", "3407000000003506",
    "3407000000003507", "3407000000003520", "3407000000003500", "3407000000003486",
    "3407000000003483", "3407000000003476", "3407000000004391", "3407000000003470",
    "3407000000003464", "3407000000003462", "3407000000003458", "3407000000003444",
    "3407000000003451", "3407000000003445", "3407000000003446", "3407000000004377",
    "3407000000003422", "3407000000004365", "3407000000003417", "3407000000003414",
    "3407000000004361", "3407000000003410", "3407000000004369", "3407000000003405",
    "3407000000003399", "3407000000003397", "3407000000004339", "3407000000003382",
    "3407000000004335", "3407000000003355", "3407000000004320", "3407000000004300",
    "3407000000003363", "3407000000003346", "3407000000004315", "3407000000004308",
    "3407000000004304", "3407000000003343", "3407000000003351"
]

def get_knowledge_doc_ids() -> List[str]:
    """Dynamically loads knowledge doc IDs from environment or default catalogue."""
    env_docs = os.getenv("ZOHO_KNOWLEDGE_DOCS", "")
    if env_docs:
        return [d.strip() for d in env_docs.split(",") if d.strip()]
    return list(_DEFAULT_KNOWLEDGE_DOCS)

ZOHO_KNOWLEDGE_DOCS = get_knowledge_doc_ids()


class ZohoQuickMLProvider(BaseLLMProvider):
    name = "zoho_quickml"
    tags = ["rag_document"]

    def __init__(self):
        self.access_token = ZOHO_ACCESS_TOKEN
        self.refresh_token = ZOHO_REFRESH_TOKEN
        self.client_id = ZOHO_CLIENT_ID
        self.client_secret = ZOHO_CLIENT_SECRET
        self.project_id = CATALYST_PROJECT_ID
        self.org_id = CATALYST_ORG_ID
        self.endpoint_url = f"https://console.catalyst.zoho.in/quickml/v1/project/{self.project_id}/rag/answer"

    def is_available(self) -> bool:
        return bool((self.access_token or self.refresh_token) and self.project_id)

    def refresh_access_token(self) -> Optional[str]:
        """Auto-refreshes OAuth access token using permanent refresh token."""
        if not (self.refresh_token and self.client_id and self.client_secret):
            log.warning("[ZohoQuickMLProvider] Missing credentials to refresh token")
            return None

        try:
            url = "https://accounts.zoho.in/oauth/v2/token"
            data = {
                "refresh_token": self.refresh_token,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "refresh_token"
            }
            res = requests.post(url, data=data, timeout=10)
            if res.status_code == 200:
                new_token = res.json().get("access_token")
                if new_token:
                    self.access_token = new_token
                    log.info("[ZohoQuickMLProvider] OAuth access token auto-refreshed successfully")
                    return new_token
            log.error(f"[ZohoQuickMLProvider] Token refresh failed ({res.status_code}): {res.text}")
        except Exception as e:
            log.error(f"[ZohoQuickMLProvider] Token refresh exception: {e}")
        return None

    def complete(self, messages: List[Dict[str, str]], json_mode: bool = False, max_tokens: int = 2500) -> Tuple[str, str]:
        if not self.is_available():
            raise RuntimeError("ZohoQuickMLProvider is not configured or unavailable")

        # Extract user query and optional system context
        user_query = ""
        system_context = ""
        for m in messages:
            if m.get("role") == "user":
                user_query = m.get("content", "")
            elif m.get("role") == "system":
                system_context = m.get("content", "")

        query_payload = user_query
        if system_context and not json_mode:
            query_payload = f"{user_query}\n\n[System Directive: {system_context[:200]}]"

        headers = {
            "Authorization": f"Zoho-oauthtoken {self.access_token}",
            "CATALYST-ORG": str(self.org_id),
            "Content-Type": "application/json"
        }

        body = {
            "query": query_payload,
            "documents": ZOHO_KNOWLEDGE_DOCS
        }

        # Attempt call with token auto-refresh retry on 401
        for attempt in range(2):
            try:
                res = requests.post(self.endpoint_url, headers=headers, json=body, timeout=25)
                if res.status_code == 401 and attempt == 0:
                    log.info("[ZohoQuickMLProvider] 401 Unauthorized received. Refreshing token...")
                    new_token = self.refresh_access_token()
                    if new_token:
                        headers["Authorization"] = f"Zoho-oauthtoken {new_token}"
                        continue

                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "")
                    if response_text:
                        lower_resp = response_text.strip().lower()
                        # If Zoho QuickML cloud KB cannot find the info in its 51 documents,
                        # fail over so downstream LLM providers (Groq/Gemini) synthesize in-prompt evidence chunks.
                        scope_limit_indicators = (
                            "cannot find the relevant information", "unable to find",
                            "outside the scope", "cannot provide", "does not contain",
                            "no information", "not mentioned in", "not found in the document",
                            "based on the provided context", "insufficient information",
                            "no specific solution", "no specific countermeasures"
                        )
                        if any(ind in lower_resp for ind in scope_limit_indicators):
                            log.info("[ZohoQuickMLProvider] Query outside cloud KB scope. Returning scope limit message directly.")
                        return response_text, self.name

                raise RuntimeError(f"Zoho QuickML returned status {res.status_code}: {res.text[:200]}")

            except Exception as e:
                if attempt == 1:
                    raise e
                log.warning(f"[ZohoQuickMLProvider] Attempt {attempt+1} failed: {e}")

        raise RuntimeError("Zoho QuickML completion failed after retry")
