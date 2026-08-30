"""
KSP Sentinel AI — Schema-Driven Intent Router (SOLID: SRP + OCP)
"""
import logging
from typing import Optional, Set
from app.core.registry import registry
from app.providers.orchestrator import llm_complete

log = logging.getLogger("standalone.router")


class SchemaRouter:
    """
    SRP: Reads query + context and predicts the intent type.
    Zero-hardcoding: Leverages AgentRegistry manifests and structural query patterns.
    """
    OFF_TOPIC = ["recipe", "cricket score", "movie review", "weather forecast", "stock price", "love advice", "song lyrics"]

    def __init__(self):
        self.registry = registry

    def _fast_classify(self, q: str, history_preview: str = "") -> Optional[str]:
        """
        Stage 1: Structural Fast-Path.
        Evaluates structural syntax and explicit capability requests.
        """
        # 1. Statutory / Legal Documentation Fast-Path
        legal_signals = (
            "zero fir", "procedure for", "procedure to", "mandatory procedure",
            "legal section", "which section", "what section", "under section",
            "section 65b", "section 63", "bnss", "bsa", "bns", "crpc", "ipc",
            "evidence act", "it act", "statutory", "legal provision", "legal right",
            "how to file a zero", "how do i file", "fir process", "charge sheet", "chargesheet"
        )
        if any(s in q for s in legal_signals):
            return "DOCUMENT"

        # 2. Relational Graph & Multi-Hop Link Analysis Fast-Path
        graph_signals = (
            "nexus", "connection between", "linked to", "link between", "trace path",
            "central figures", "syndicate hubs", "kingpin", "hubs", "network graph",
            "relational path", "dossier on", "profile on", "who is linked", "connected suspects",
            "shortest path", "syndicate", "conclusion", "conclude", "justify",
            "what do those connections", "meaning of connection", "money trail", "mule chain",
            "how are they connected", "crime ring"
        )
        # 4. Explicit Analytical / Visual Intelligence Fast-Path
        analytical_signals = (
            "compare", "rank", "ranking", "breakdown", "break down", "distribution",
            "trend", "trends", "trajectory", "hotspot", "hotspots", "correlation",
            "time series", "time-series", "line chart", "bar chart", "pie chart", "doughnut",
            "chart", "plot", "graph", "histogram", "scatter", "visualize", "analytics",
            "loss vs", "cases vs", "vs", "versus", "across all", "by month", "by year",
            "by station", "by district", "by division", "top 5", "top 10", "top ", "highest", "lowest",
            "caseload", "case load", "workload", "incident count", "incident breakdown",
            "crime breakdown", "station workload", "operational breakdown"
        )
        
        is_graph = any(s in q for s in graph_signals)
        is_analytical = any(s in q for s in analytical_signals)
        
        if is_graph and is_analytical:
            return "FEDERATED"
            
        if is_graph:
            return "GRAPH"

        # 3. Single Statistic / Metric Data Query Fast-Path
        data_prefixes = (
            "how many", "what is the total", "what is the count",
            "count of", "total number of", "give me the number",
            "how much", "what percentage", "what fraction", "exact count",
            "total financial", "total recovered", "sum of"
        )
        if any(q.startswith(s) or s in q for s in data_prefixes):
            return "DATA_QUERY"

        if is_analytical:
            return "ANALYTICAL"

        # 5. Reaction / Conversational Dialogue Fast-Path
        convo_starters = (
            "hello", "hi", "hey", "good morning", "good evening", "namaskara",
            "so ", "okay", "ok ", "alright", "yes ", "no ", "right ",
            "is this ", "is that ", "are these ", "are we ", "does this ",
            "that means", "so what", "what now", "what next", "and so",
            "idu ", "ade ", "sari ", "illa ", "hoda "
        )
        word_count = len(q.split())
        if word_count <= 4 and any(q.startswith(s) for s in convo_starters):
            return "CONVERSATIONAL"

        return None

    def classify(self, query: str, history_preview: str = "") -> str:
        q_lower = query.lower().strip()

        # Guardrail check
        if any(t in q_lower for t in self.OFF_TOPIC):
            return "GUARDRAIL"

        # Stage 1: Structural fast-path
        fast_result = self._fast_classify(q_lower, history_preview)
        if fast_result:
            log.info(f"SchemaRouter [fast-path] → {fast_result}")
            return fast_result

        # Stage 2: Dynamic Schema-Driven LLM Micro-Classification
        prompt = self.registry.build_routing_schema_prompt()
        full_classification_prompt = f"""{prompt}

Recent Context: {history_preview[:200] if history_preview else "None."}
Officer query: "{query}"

Reply with EXACTLY ONE intent word."""

        valid_intents = set(self.registry.get_all_agents().keys()) | {"GUARDRAIL"}

        try:
            from app.providers.orchestrator import orchestrator
            result = orchestrator.generate_completion(
                full_classification_prompt,
                system_instruction="You are a routing dispatcher for a police command system. Reply with exactly one intent word."
            )
            for token in result.strip().upper().split():
                clean = token.rstrip(".,:")
                if clean in valid_intents:
                    log.info(f"SchemaRouter [LLM] → {clean}")
                    return clean
        except Exception as e:
            log.warning(f"SchemaRouter [LLM classification error]: {e}")

        # Fallback intent: if query mentions crime/station/cases, route to ANALYTICAL
        if any(w in q_lower for w in ["case", "crime", "station", "division", "district", "fir", "loss", "recovery"]):
            return "ANALYTICAL"
        return "CONVERSATIONAL"


# Singleton Router
router = SchemaRouter()
