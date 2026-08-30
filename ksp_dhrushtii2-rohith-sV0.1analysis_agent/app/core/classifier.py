"""
KSP Sentinel AI — LLM-Native Context-Aware Intent Classifier (SOLID: SRP + DIP)
================================================================================
Evaluates user queries against conversation history and agent manifests to determine
routing intent and detect follow-up continuity without hardcoded heuristic lists.
"""
import json
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from app.core.registry import AgentRegistry, registry as global_registry
from app.core.router import router
from app.providers.orchestrator import llm_reasoning_complete

log = logging.getLogger("standalone.classifier")


@dataclass
class ClassificationResult:
    """Standardized classification output contract."""
    intent: str
    is_followup: bool = False
    reason: str = ""


class QueryClassifier:
    """
    SRP: Evaluates query in the context of recent turns to determine the target domain agent.
    DIP: Decoupled from concrete LLMs via llm_reasoning_complete.
    OCP: Dynamically reads AgentManifest schemas from AgentRegistry.
    """

    def __init__(self, agent_registry: Optional[AgentRegistry] = None):
        self.registry = agent_registry or global_registry

    def classify(
        self,
        query: str,
        recent_history: List[Dict[str, Any]],
        last_agent_type: Optional[str] = None,
        memory_summary: Optional[str] = None,
        context_injection: Optional[Dict[str, Any]] = None
    ) -> ClassificationResult:
        """
        Context-aware intent classification.
        Considers recent conversation turns, memory summary, and injected domain context.
        """
        q_clean = query.strip()
        if not q_clean:
            return ClassificationResult(intent="CONVERSATIONAL", is_followup=False, reason="Empty query")

        # 1. Structural Guardrail Fast-Path Check
        off_topic = ["recipe", "cricket score", "movie review", "weather forecast", "stock price", "love advice", "song lyrics", "chocolate cake"]
        if any(t in q_clean.lower() for t in off_topic):
            log.info(f"[QueryClassifier] Guardrail triggered for off-topic query: '{q_clean[:40]}'")
            return ClassificationResult(intent="GUARDRAIL", is_followup=False, reason="Off-topic guardrail")

        # 2. Conversational Greetings & Identity Inquiries Fast-Path
        q_lower = q_clean.lower().strip("!?. ,")
        greetings = ["hi", "hello", "hey", "namaskara", "namaste", "good morning", "good evening", "good afternoon", "who are you", "what can you do", "help", "who is sentinel", "what is sentinel"]
        if q_lower in greetings or any(q_lower.startswith(g + " ") for g in ["hi", "hello", "hey", "namaskara", "namaste"]):
            log.info(f"[QueryClassifier] Fast-path routing to CONVERSATIONAL for greeting/identity: '{q_clean}'")
            return ClassificationResult(intent="CONVERSATIONAL", is_followup=False, reason="Standard greeting / identity query")

        # Fast-Path for Explicit Spatial / Zoho Directives when Spatial Context is Active
        if context_injection:
            if any(w in q_lower for w in ["crm", "suspect", "ticket", "desk", "dispatch", "deploy", "hotspot", "cluster", "patrol", "spatial", "threat level"]):
                log.info(f"[QueryClassifier] Fast-path routing to SPATIAL_TACTICAL based on active context and spatial directives.")
                return ClassificationResult(intent="SPATIAL_TACTICAL", is_followup=True, reason="Active spatial context directive")

        # 2. Build Dialogue Context Preview
        history_lines = []
        if memory_summary:
            history_lines.append(f"[Session Memory Summary: {memory_summary}]")
        if context_injection:
            history_lines.append(f"[Active Domain Context: {json.dumps(context_injection)[:200]}]")

        for turn in recent_history[-4:]:
            role = "Officer" if turn.get("role") == "user" else "Sentinel AI"
            content = str(turn.get("content") or "").strip()
            # Truncate very long answers in history preview to preserve classifier tokens
            if len(content) > 300:
                content = content[:300] + "..."
            if content:
                history_lines.append(f"{role}: {content}")

        history_context = "\n".join(history_lines) if history_lines else "No previous dialogue in this session."

        system_instruction = self.registry.build_classification_prompt(last_agent_type=last_agent_type)
        user_prompt = (
            f"--- RECENT CONVERSATION CONTEXT ---\n{history_context}\n\n"
            f"--- NEW INCOMING OFFICER QUERY ---\n\"{q_clean}\"\n\n"
            "Classify the intent and determine if this is a follow-up to the preceding context. "
            "Return JSON matching the schema."
        )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt}
        ]

        valid_intents = set(self.registry.get_all_agents().keys()) | {"GUARDRAIL"}

        try:
            raw_response, provider = llm_reasoning_complete(messages, json_mode=True, max_tokens=120)
            clean_json = raw_response.strip()

            if "</think>" in clean_json:
                clean_json = clean_json.split("</think>")[-1].strip()

            # Extract JSON block if wrapped in markdown formatting
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[1].split("```")[0].strip()

            parsed = json.loads(clean_json)
            intent = str(parsed.get("intent", "")).upper().strip()
            is_followup = bool(parsed.get("is_followup", False))
            reason = str(parsed.get("reason", ""))

            # Handle intent mapping if agent names were returned (e.g. pattern_agent -> TACTICAL_PATTERN)
            if intent in ("PATTERN_AGENT", "PATTERN", "TACTICAL"):
                intent = "TACTICAL_PATTERN"
            elif intent in ("ANALYTICAL_AGENT", "ANALYTICS"):
                intent = "ANALYTICAL"
            elif intent in ("DOCUMENT_AGENT", "LEGAL"):
                intent = "DOCUMENT"
            elif intent in ("GRAPH_AGENT", "NETWORK"):
                intent = "GRAPH"
            elif intent in ("SPATIAL", "SPATIAL_TACTICAL", "SPATIAL_AGENT", "ZOHO", "TACTICAL_SPATIAL"):
                intent = "SPATIAL_TACTICAL"

            if intent in valid_intents:
                log.info(f"[QueryClassifier] Classified -> Intent: [{intent}] | Follow-up: {is_followup} | Reason: '{reason}' (Provider: {provider})")
                return ClassificationResult(intent=intent, is_followup=is_followup, reason=reason)
            else:
                log.warning(f"[QueryClassifier] LLM returned unrecognized intent '{intent}'. Falling back to SchemaRouter.")

        except Exception as e:
            log.warning(f"[QueryClassifier] Classification error: {e}. Falling back to SchemaRouter.", exc_info=False)

        # 3. Graceful Fallback to SchemaRouter
        fallback_history_preview = "\n".join(history_lines[-2:]) if history_lines else ""
        fallback_intent = router.classify(q_clean, history_preview=fallback_history_preview)
        
        # If spatial context is active and fallback is conversational, prefer SPATIAL_TACTICAL
        if context_injection and fallback_intent in ("CONVERSATIONAL", "GENERAL"):
            fallback_intent = "SPATIAL_TACTICAL"
            
        log.info(f"[QueryClassifier] SchemaRouter Fallback -> [{fallback_intent}]")
        return ClassificationResult(intent=fallback_intent, is_followup=False, reason="SchemaRouter fallback")


# Singleton Classifier
classifier = QueryClassifier()
