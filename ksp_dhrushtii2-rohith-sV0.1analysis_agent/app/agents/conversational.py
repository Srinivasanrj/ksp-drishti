"""
KSP Sentinel AI — Conversational Agent (SOLID: SRP + LSP)
"""
from app.config import KSP_CONVERSATIONAL_PROMPT
from app.core.interfaces import AgentManifest, AgentResponse, BaseAgent, ExecutionContext
from app.providers.orchestrator import llm_complete


class ConversationalAgent(BaseAgent):
    """
    SRP: Handles qualitative tactical guidance, detective advice, clarifications, and conversational context.
    Output: 2-4 decisive, disciplined sentences. Preserves active visual studio canvas.
    """
    @property
    def manifest(self) -> AgentManifest:
        return AgentManifest(
            intent_name="CONVERSATIONAL",
            label="KSP Sentinel AI",
            icon="🛡️",
            color="#1e40af",
            description="Trigger for greetings (hi, hello, namaskara), officer introductions (who are you, system capabilities), qualitative detective advice, investigative hypotheses, reactions, clarifications, or general police assistant queries.",
            requires_visual_studio=False,
            system_prompt=KSP_CONVERSATIONAL_PROMPT
        )

    def execute(self, ctx: ExecutionContext) -> AgentResponse:
        messages = [
            {"role": "system", "content": self.manifest.system_prompt},
            {"role": "system", "content": f"Division context: {ctx.division}."}
        ]
        for h in ctx.history:
            if isinstance(h, dict) and h.get("role") in ("user", "assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": ctx.query})

        # Fast-path for greetings to avoid RAG lookup failures
        q_lower = ctx.query.lower().strip("!?. ,")
        greetings = ["hi", "hello", "hey", "namaskara", "namaste", "good morning", "good evening", "good afternoon"]
        if q_lower in greetings or any(q_lower.startswith(g + " ") for g in ["hi", "hello", "hey", "namaskara", "namaste"]):
            answer = "Hello! KSP Sentinel AI intelligence engine is active. How can I assist you with your investigation today?"
            provider = "fast_path"
        else:
            answer, provider = llm_complete(
                messages,
                json_mode=False,
                max_tokens=300,
                required_tags=self.manifest.required_provider_tags
            )

        manifest = self.manifest

        return AgentResponse(
            answer=answer,
            agent_type="conversational_agent",
            agent_label=manifest.label,
            agent_icon=manifest.icon,
            agent_color=manifest.color,
            charts=[],
            executive_decision=None,
            provider=provider,
            visuals_updated=False
        )
