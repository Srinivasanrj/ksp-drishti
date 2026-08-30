"""
KSP Sentinel AI — Document Agent (SOLID: SRP + LSP + DIP)
Handles legal statutory law (BNS/BNSS/BSA), SOP circulars, FIR filings,
and session-isolated document/PDF evidence synthesis with citations.
"""
import logging
from typing import List, Optional
from app.config import KSP_DOCUMENT_PROMPT
from app.core.interfaces import AgentManifest, AgentResponse, BaseAgent, ExecutionContext, IDocumentRepository
from app.engine.document_store import document_store
from app.providers.orchestrator import llm_complete

log = logging.getLogger("standalone.agents.document")


class DocumentAgent(BaseAgent):
    """
    SRP: Legal reasoning, statutory provisions, FIR procedural guidelines,
         and evidence document semantic/lexical RAG.
    DIP: Injects IDocumentRepository for document chunk retrieval.
    LSP: Returns standardized AgentResponse contract.
    """
    def __init__(self, doc_repo: Optional[IDocumentRepository] = None):
        self.doc_repo = doc_repo or document_store

    @property
    def manifest(self) -> AgentManifest:
        return AgentManifest(
            intent_name="DOCUMENT",
            label="Document & Legal Agent",
            icon="📄",
            color="#10b981",
            description="Trigger for legal sections (IPC, BNS, BNSS, BSA, IT Act, CrPC), FIR filing procedures, Section 65B certification, evidence PDFs, or statutory police SOPs.",
            requires_visual_studio=False,
            system_prompt=KSP_DOCUMENT_PROMPT,
            required_provider_tags=["rag_document", "free_reasoning"]
        )

    def execute(self, ctx: ExecutionContext) -> AgentResponse:
        session_id = ctx.session_id or "default_session"
        has_docs = self.doc_repo.has_documents(session_id)
        retrieved_chunks = []
        doc_context = ""
        citations: List[str] = []

        # ── 1. Session Document Search (RAG Grounding) ────────────────────────
        if has_docs:
            retrieved_chunks = self.doc_repo.search_chunks(session_id, ctx.query, limit=4)
            if retrieved_chunks:
                context_parts = []
                for chunk in retrieved_chunks:
                    context_parts.append(
                        f"[DOCUMENT: {chunk.doc_name} | CHUNK {chunk.chunk_index + 1}]\n{chunk.content}"
                    )
                    if chunk.doc_name not in citations:
                        citations.append(chunk.doc_name)

                doc_context = (
                    "\n\n=== RELEVANT EVIDENCE / CASE DOCUMENT EXCERPTS ===\n"
                    + "\n\n".join(context_parts)
                    + "\n===================================================\n"
                    "Instructions for Document Grounding:\n"
                    "1. Use the above document excerpts to answer the officer's query accurately.\n"
                    "2. Explicitly cite the document name and section whenever referencing facts.\n"
                    "3. If the excerpt does not contain the answer, apply statutory KSP legal standards.\n"
                )

        # ── 2. Construct Neural Inference Messages ────────────────────────────
        system_content = self.manifest.system_prompt
        if doc_context:
            system_content = f"{system_content}\n{doc_context}"

        messages = [
            {"role": "system", "content": system_content}
        ]

        for h in ctx.history:
            if isinstance(h, dict) and h.get("role") in ("user", "assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})

        messages.append({"role": "user", "content": ctx.query})

        # ── 3. Orchestrated LLM Completion (Zoho QuickML / Groq / Gemini) ─────
        answer, provider = llm_complete(
            messages,
            json_mode=False,
            max_tokens=750,
            required_tags=self.manifest.required_provider_tags
        )
        manifest = self.manifest

        # ── 4. Dynamic Suggested Actions ──────────────────────────────────────
        suggested_actions = []
        if has_docs:
            suggested_actions.append("Review Evidence Citations")
            suggested_actions.append("Search Cross-Referenced FIRs")
        else:
            suggested_actions.append("Upload Case PDF / FIR Document")
            suggested_actions.append("Check Section 65B BSA Requirements")
            suggested_actions.append("Review Standard Operating Procedure")

        return AgentResponse(
            answer=answer,
            agent_type="document_agent",
            agent_label=manifest.label,
            agent_icon=manifest.icon,
            agent_color=manifest.color,
            charts=[],
            executive_decision=None,
            provider=provider,
            visuals_updated=False,
            data_available=True,
            suggested_actions=suggested_actions
        )
