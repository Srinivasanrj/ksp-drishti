"""
KSP Sentinel AI — Pattern Intelligence & Tactical Interrogation Agent (SOLID: SRP + LSP)
=========================================================================================
Specialized in qualitative detective co-pilot reasoning:
- Unstructured crime narratives and witness statement contradictions
- Modus Operandi (M.O.) signature extraction across Karnataka districts
- Tactical interrogation dilemmas, psychological pressure points, and alibi scrutiny
- Solution-oriented field directives in plain, humanized English
"""
import logging
from app.config import KSP_PATTERN_PROMPT
from app.core.interfaces import AgentManifest, AgentResponse, BaseAgent, ExecutionContext
from app.providers.orchestrator import llm_complete

log = logging.getLogger("standalone.pattern")


class PatternAgent(BaseAgent):
    """
    SRP: Handles qualitative crime pattern matching, M.O. analysis, and tactical interrogation strategies.
    LSP: Implements BaseAgent contract, returning standard AgentResponse.
    DIP: Decoupled from physical LLM providers via llm_complete orchestrator.
    """

    @property
    def manifest(self) -> AgentManifest:
        return AgentManifest(
            intent_name="TACTICAL_PATTERN",
            label="Pattern Intelligence Agent",
            icon="🕵️",
            color="#8b5cf6",
            description="Trigger when the query involves qualitative crime narratives, witness statement contradictions, suspect interrogation strategy, alibi scrutiny, Modus Operandi (M.O.) patterns, or cross-district detective dilemmas.",
            requires_visual_studio=False,
            system_prompt=KSP_PATTERN_PROMPT,
            trigger_examples=[
                "Analyze this suspect confession narrative and find contradictions",
                "What is the Modus Operandi of this gas cutter gang in Mysuru?",
                "How should I interrogate this suspect claiming an unverified alibi?",
                "Witness A and Witness B have conflicting statements on the getaway vehicle",
                "Formulate a tactical interrogation plan for cyber financial syndicate",
                "What is the likely next target based on this criminal pattern?"
            ]
        )

    def execute(self, ctx: ExecutionContext) -> AgentResponse:
        log.info(f"[PatternAgent] Executing tactical interrogation and M.O. analysis for session '{ctx.session_id}'")

        messages = [
            {"role": "system", "content": self.manifest.system_prompt},
            {"role": "system", "content": f"Operational Division: {ctx.division}."}
        ]

        if ctx.memory_summary:
            messages.append({
                "role": "system",
                "content": f"Prior Investigation Context Summary: {ctx.memory_summary}"
            })

        from app.engine.document_store import document_store
        session_id = ctx.session_id or "default_session"
        if document_store.has_documents(session_id):
            chunks = document_store.search_chunks(session_id, ctx.query, limit=3)
            if chunks:
                doc_lines = [f"[EVIDENCE: {c.doc_name}]\n{c.content}" for c in chunks]
                messages.append({
                    "role": "system",
                    "content": "=== RELEVANT EVIDENCE / CASE DOCUMENT EXCERPTS ===\n" + "\n\n".join(doc_lines) + "\n==================================================="
                })

        # Append dialogue turns from stateful context
        for h in ctx.history:
            if isinstance(h, dict) and h.get("role") in ("user", "assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})

        messages.append({"role": "user", "content": ctx.query})

        try:
            answer, provider = llm_complete(
                messages,
                json_mode=False,
                max_tokens=500,
                required_tags=self.manifest.required_provider_tags
            )
            answer = answer.strip()

            if "</think>" in answer:
                answer = answer.split("</think>")[-1].strip()

            if not answer:
                answer = (
                    "**Investigative Advisory:** I have analyzed the case update. "
                    "Please provide additional statements, suspect alibis, or physical evidence details "
                    "so I can construct a targeted cross-examination plan and M.O. correlation."
                )

            manifest = self.manifest
            return AgentResponse(
                answer=answer,
                agent_type="pattern_agent",
                agent_label=manifest.label,
                agent_icon=manifest.icon,
                agent_color=manifest.color,
                charts=[],
                executive_decision=None,
                provider=provider,
                visuals_updated=False,
                data_available=True,
                suggested_actions=[
                    "Correlate M.O. with state-wide crime database",
                    "Issue Section 91 CrPC notice for tower dump verification",
                    "Conduct structured cross-examination on timeline discrepancy"
                ]
            )

        except Exception as e:
            log.error(f"[PatternAgent] Execution error: {e}", exc_info=True)
            manifest = self.manifest
            return AgentResponse(
                answer=f"⚠️ **Pattern Intelligence Error:** An error occurred while analyzing the case narrative: `{str(e)}`",
                agent_type="pattern_agent",
                agent_label=manifest.label,
                agent_icon=manifest.icon,
                agent_color=manifest.color,
                charts=[],
                executive_decision=None,
                provider="system_error",
                visuals_updated=False,
                data_available=False
            )
