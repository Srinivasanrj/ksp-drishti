"""
KSP Sentinel AI — System Bootstrap & Agent Registration (SOLID: OCP)
"""
import logging
from app.core.registry import registry
from app.agents.analytical import AnalyticalAgent
from app.agents.conversational import ConversationalAgent
from app.agents.data_query import DataQueryAgent
from app.agents.document import DocumentAgent
from app.agents.graph import GraphAgent
from app.agents.federated import FederatedAgent
from app.agents.pattern import PatternAgent
from app.agents.spatial import SpatialTacticalAgent

log = logging.getLogger("standalone.bootstrap")


def initialize_system():
    """Registers all specialized agents with the dynamic registry."""
    registry.register(AnalyticalAgent())
    registry.register(ConversationalAgent())
    registry.register(DataQueryAgent())
    registry.register(DocumentAgent())
    registry.register(GraphAgent())
    registry.register(FederatedAgent())
    registry.register(PatternAgent())
    registry.register(SpatialTacticalAgent())
    log.info("KSP Sentinel AI: All domain agents initialized and registered (including PatternAgent, GraphAgent & SpatialTacticalAgent).")


initialize_system()
