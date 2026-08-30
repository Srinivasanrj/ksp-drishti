"""
KSP Sentinel AI — Data Query Agent (SOLID: SRP + LSP)
"""
from app.config import KSP_DATA_QUERY_PROMPT
from app.core.interfaces import AgentManifest, AgentResponse, BaseAgent, ExecutionContext
from app.engine.session_store import session_store
from app.providers.orchestrator import llm_complete


class DataQueryAgent(BaseAgent):
    """
    SRP: Handles specific count, total, or factual metric queries from the dataset.
    Output: 1-2 sentence precise factual answer.
    """
    @property
    def manifest(self) -> AgentManifest:
        return AgentManifest(
            intent_name="DATA_QUERY",
            label="Data Query Agent",
            icon="🔢",
            color="#8b5cf6",
            description="Trigger when the officer asks for one specific count, total, percentage, or factual statistic from the dataset.",
            requires_visual_studio=False,
            system_prompt=KSP_DATA_QUERY_PROMPT
        )

    def execute(self, ctx: ExecutionContext) -> AgentResponse:
        # Chain of Responsibility: Check if dataset exists in session
        if not ctx.session_id or not session_store.has_dataset(ctx.session_id):
            return AgentResponse(
                answer="",
                agent_type="data_query_agent",
                agent_label=self.manifest.label,
                agent_icon=self.manifest.icon,
                agent_color=self.manifest.color,
                charts=[],
                executive_decision=None,
                provider="chain_of_responsibility",
                handoff_target="DOCUMENT"
            )

        schema_summary = session_store.get_schema_summary(ctx.session_id) if ctx.session_id else ""
        messages = [
            {"role": "system", "content": self.manifest.system_prompt},
            {"role": "system", "content": f"Division: {ctx.division}. Active Dataset in DuckDB: {schema_summary}"}
        ]
        for h in ctx.history[-4:]:
            if h.get("role") in ("user", "assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": ctx.query})

        answer, provider = llm_complete(
            messages,
            json_mode=False,
            max_tokens=200,
            required_tags=self.manifest.required_provider_tags
        )
        manifest = self.manifest

        return AgentResponse(
            answer=answer,
            agent_type="data_query_agent",
            agent_label=manifest.label,
            agent_icon=manifest.icon,
            agent_color=manifest.color,
            charts=[],
            executive_decision=None,
            provider=provider,
            visuals_updated=False
        )
