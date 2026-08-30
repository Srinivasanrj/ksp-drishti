"""
KSP Sentinel AI — Federated Agent (SOLID: Orchestrator)
"""
import logging
from app.config import KSP_FEDERATED_PROMPT
from app.core.interfaces import BaseAgent, ExecutionContext, AgentResponse, AgentManifest
from app.agents.analytical import AnalyticalAgent
from app.agents.graph import GraphAgent
from app.providers.orchestrator import orchestrator

log = logging.getLogger("standalone.agents.federated")

class FederatedAgent(BaseAgent):
    @property
    def manifest(self) -> AgentManifest:
        return AgentManifest(
            intent_name="FEDERATED",
            label="KSP Federated Intelligence",
            icon="🌐",
            color="#a855f7",
            description="Trigger when query asks for both analytical trends and network topology.",
            requires_visual_studio=True,
            system_prompt=KSP_FEDERATED_PROMPT,
            trigger_examples=["trajectory and trace the network"]
        )

    def execute(self, ctx: ExecutionContext) -> AgentResponse:
        log.info(f"[FederatedAgent] Executing dual-stream dispatch for query: {ctx.query}")
        
        # Instantiate sub-agents
        analytics_agent = AnalyticalAgent()
        graph_agent = GraphAgent()
        
        # Execute sequentially for safety with DuckDB session.
        log.info("[FederatedAgent] -> Spawning Analytics Sub-Task")
        analytics_res = analytics_agent.execute(ctx)
        
        log.info("[FederatedAgent] -> Spawning Network Sub-Task")
        graph_res = graph_agent.execute(ctx)
        
        # Merge charts
        combined_charts = []
        if analytics_res.charts:
            combined_charts.extend(analytics_res.charts)
        if graph_res.charts:
            combined_charts.extend(graph_res.charts)
            
        # Synthesize answers using the orchestrator
        synthesis_input = f"""OFFICER QUERY: "{ctx.query}"

SUB-AGENT REPORTS:

1. ANALYTICS INVESTIGATIVE REPORT:
{analytics_res.answer}

2. NETWORK FORENSIC REPORT:
{graph_res.answer}
"""
        
        synthesized_answer = orchestrator.generate_completion(
            prompt=synthesis_input,
            system_instruction=self.manifest.system_prompt,
            max_tokens=2000,
            required_tags=self.manifest.required_provider_tags
        )
        
        return AgentResponse(
            answer=synthesized_answer,
            agent_type="federated_agent",
            agent_label="KSP Federated Intelligence",
            agent_icon="🌐",
            agent_color="#a855f7",
            charts=combined_charts,
            executive_decision=analytics_res.executive_decision or graph_res.executive_decision,
            provider="groq",
            visuals_updated=analytics_res.visuals_updated or graph_res.visuals_updated,
            data_available=True,
            suggested_actions=["Review unified intelligence dossier", "Export federated report"]
        )
