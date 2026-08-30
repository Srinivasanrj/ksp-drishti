"""
KSP Sentinel AI — Core Interfaces & Contracts (SOLID: DIP + ISP + LSP)
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class AgentManifest:
    """
    OCP: Self-describing agent capability manifest.
    Allows dynamic registration and zero-hardcoding schema generation.
    """
    intent_name: str
    label: str
    icon: str
    color: str
    description: str
    requires_visual_studio: bool = False
    system_prompt: str = ""
    trigger_examples: List[str] = field(default_factory=list)
    required_provider_tags: List[str] = field(default_factory=lambda: ["free_reasoning"])


@dataclass
class ExecutionContext:
    """
    ISP: Encapsulated request execution context.
    Prevents parameter bloat and segregates caller concerns.
    """
    query: str
    history: List[Dict[str, str]] = field(default_factory=list)
    division: str = "Bengaluru Division"
    session_id: Optional[str] = None
    fir_number: Optional[str] = None
    memory_summary: Optional[str] = None
    last_agent_type: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AgentResponse:
    """
    SRP & LSP: Standard unified data contract returned by all domain agents.
    """
    answer: str
    agent_type: str
    agent_label: str
    agent_icon: str
    agent_color: str
    charts: List[Dict[str, Any]] = field(default_factory=list)
    executive_decision: Optional[Dict[str, Any]] = None
    provider: str = "groq"
    visuals_updated: bool = False
    data_available: bool = True
    suggested_actions: List[str] = field(default_factory=list)
    handoff_target: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": True,
            "answer": self.answer,
            "agent_type": self.agent_type,
            "agent_label": self.agent_label,
            "agent_icon": self.agent_icon,
            "agent_color": self.agent_color,
            "charts": self.charts,
            "executive_decision": self.executive_decision,
            "provider": self.provider,
            "visuals_updated": self.visuals_updated,
            "data_available": self.data_available,
            "suggested_actions": self.suggested_actions,
            "handoff_target": self.handoff_target,
        }


class BaseAgent(ABC):
    """
    LSP & DIP: Base contract for all specialized domain agents.
    """
    @property
    @abstractmethod
    def manifest(self) -> AgentManifest:
        """Returns the self-describing capability manifest."""
        pass

    @abstractmethod
    def execute(self, ctx: ExecutionContext) -> AgentResponse:
        """Executes the agent's core responsibility."""
        pass

    def handle(self, ctx: ExecutionContext) -> AgentResponse:
        """Standard invocation alias."""
        return self.execute(ctx)


class IDatasetRepository(ABC):
    """
    DIP: Abstract interface for session-isolated data storage and SQL execution.
    """
    @abstractmethod
    def has_dataset(self, session_id: str) -> bool:
        pass

    @abstractmethod
    def get_columns(self, session_id: str, table_name: str = "crime_dataset") -> tuple[list, list]:
        pass

    @abstractmethod
    def get_schema_summary(self, session_id: str, table_name: str = "crime_dataset") -> str:
        pass

    @abstractmethod
    def execute_sql(self, session_id: str, query: str) -> tuple[list, list]:
        pass


class IDataConnector(ABC):
    """
    DIP + ISP: Abstract Universal Data Fabric interface.
    Decouples agents from physical storage (DuckDB CSV, live SQL, or NoSQL Catalyst Datastore).
    """
    @abstractmethod
    def has_active_connection(self, session_id: str) -> bool:
        pass

    @abstractmethod
    def execute_query(self, session_id: str, query: str) -> tuple[list, list]:
        pass

    @abstractmethod
    def get_schema_summary(self, session_id: str) -> str:
        pass


class ILLMProvider(ABC):
    """
    DIP: Abstract interface for neural inference providers.
    """
    tags: List[str] = []

    @abstractmethod
    def complete(self, messages: List[Dict[str, str]], json_mode: bool = False, max_tokens: int = 1000) -> tuple[str, str]:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass


@dataclass
class DocumentChunk:
    """
    Data contract for retrieved document snippets.
    """
    chunk_id: str
    doc_name: str
    chunk_index: int
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    score: float = 0.0


class IDocumentRepository(ABC):
    """
    DIP: Abstract interface for session-isolated document chunk storage and semantic/lexical retrieval.
    """
    @abstractmethod
    def ingest_document(self, session_id: str, filename: str, file_bytes: bytes) -> Dict[str, Any]:
        pass

    @abstractmethod
    def search_chunks(self, session_id: str, query: str, limit: int = 5) -> List[DocumentChunk]:
        pass

    @abstractmethod
    def list_documents(self, session_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete_document(self, session_id: str, filename: str) -> bool:
        pass

    @abstractmethod
    def has_documents(self, session_id: str) -> bool:
        pass

