"""
KSP Sentinel AI — Dynamic Agent Registry (SOLID: OCP)
"""
import logging
from typing import Dict, List, Optional
from app.core.interfaces import AgentManifest, BaseAgent

log = logging.getLogger("standalone.registry")


class AgentRegistry:
    """
    OCP: Open for extension, closed for modification.
    Allows dynamic agent plug-in without modifying routing or server code.
    """
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}

    def register(self, agent: BaseAgent) -> None:
        manifest = agent.manifest
        self._agents[manifest.intent_name.upper()] = agent
        log.info(f"AgentRegistry: Registered [{manifest.intent_name}] -> {agent.__class__.__name__}")

    def get_agent(self, intent_name: str) -> Optional[BaseAgent]:
        return self._agents.get(intent_name.upper())

    def get_all_agents(self) -> Dict[str, BaseAgent]:
        return dict(self._agents)

    def get_manifests(self) -> List[AgentManifest]:
        return [agent.manifest for agent in self._agents.values()]

    def build_routing_schema_prompt(self) -> str:
        """Dynamically generates the intent classification prompt from registered manifests."""
        lines = [
            "You are an intent classifier for a Karnataka Police AI system.",
            "Classify the officer's query into EXACTLY ONE category from the registered specialist agents below:\n"
        ]
        for manifest in self.get_manifests():
            visual_tag = "(REQUIRES CHARTS)" if manifest.requires_visual_studio else "(NO CHARTS - PRESERVE CANVAS)"
            lines.append(f"- {manifest.intent_name.upper()}: {manifest.description} {visual_tag}")

        lines.extend([
            "\nExamples:",
            '"Show me theft trends and station ranking" → ANALYTICAL',
            '"I need a time series chart for this" → ANALYTICAL',
            '"What tactical countermeasures should our Cyber Wing take?" → CONVERSATIONAL',
            '"how many FIRs in Whitefield last month" → DATA_QUERY',
            '"what is the procedure for Section 65B certificate" → DOCUMENT',
            '\nReply with EXACTLY ONE intent word matching the category.'
        ])
        return "\n".join(lines)

    def build_classification_prompt(self, last_agent_type: Optional[str] = None) -> str:
        """
        Dynamically generates a JSON-schema context classification prompt from registered manifests.
        Enables QueryClassifier to determine both intent and follow-up continuity without hardcoding.
        """
        lines = [
            "You are the Lead Intelligence Dispatcher for the Karnataka State Police (KSP Sentinel AI).",
            "Your task is to analyze the officer's incoming query within the context of recent conversation turns, "
            "and classify the routing intent.\n",
            "Available Specialist Agents and Domains:"
        ]
        for manifest in self.get_manifests():
            lines.append(f"- {manifest.intent_name.upper()}: {manifest.description}")

        lines.append("- GUARDRAIL: Strictly off-topic inquiries unrelated to police work or general assistance (e.g. cooking recipes, movies, cricket scores, stocks, entertainment, personal relationship advice).")

        if last_agent_type:
            lines.append(f"\nPrevious Responding Agent: {last_agent_type.upper()}")

        lines.extend([
            "\nRouting Rules:",
            "1. If the query is a follow-up, clarification, review, doubt, or deeper interrogation regarding the immediately preceding response/investigation context without an explicit pivot to another agent's domain, mark 'is_followup': true and maintain or assign the appropriate contextual intent.",
            "2. If the query introduces a new task (e.g. asking for charts/trends when previously discussing suspect alibis, or asking for legal section 65B certificates), classify according to the new domain with 'is_followup': false.",
            "\nReturn ONLY a valid JSON object with exact keys:",
            '{"intent": "<INTENT_NAME>", "is_followup": true|false, "reason": "<1-sentence justification>"}'
        ])
        return "\n".join(lines)


# Singleton Registry
registry = AgentRegistry()
