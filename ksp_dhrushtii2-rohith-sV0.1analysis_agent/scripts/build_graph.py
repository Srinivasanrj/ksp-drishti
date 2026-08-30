"""
Self-Contained Graphify Knowledge Graph & Obsidian Vault Builder
Runs anywhere inside the standalone workspace.
Command: python scripts/build_graph.py
Prerequisite: pip install graphifyy
"""
import sys
import os
import json
import re
from pathlib import Path

# Automatically detect the standalone root directory dynamically
CHATBOT_DIR = Path(__file__).resolve().parent.parent
OUT_DIR = CHATBOT_DIR / "graphify-out"
VAULT_DIR = CHATBOT_DIR / "analysis_vault"

OUT_DIR.mkdir(parents=True, exist_ok=True)
VAULT_DIR.mkdir(parents=True, exist_ok=True)
(OUT_DIR / ".graphify_python").write_text(sys.executable, encoding="utf-8")
(OUT_DIR / ".graphify_root").write_text(str(CHATBOT_DIR), encoding="utf-8")

def build_graph():
    print(f"=== 1. Detecting files in {CHATBOT_DIR} ===")
    from graphify.detect import detect
    detect_data = detect(CHATBOT_DIR)

    # Include architectural files
    my_query_dir = CHATBOT_DIR / "my_query"
    if my_query_dir.exists():
        for f in my_query_dir.iterdir():
            if f.is_file() and str(f) not in detect_data['files']['document']:
                detect_data['files']['document'].append(str(f))

    # Include Zoho platform docs if present
    zoho_data_dir = CHATBOT_DIR / "zoho_data"
    if zoho_data_dir.exists():
        for f in zoho_data_dir.rglob("*.md"):
            if f.is_file() and str(f) not in detect_data['files']['document']:
                detect_data['files']['document'].append(str(f))

    detect_data['total_files'] = len(detect_data['files']['code']) + len(detect_data['files']['document']) + len(detect_data['files']['image'])
    (OUT_DIR / ".graphify_detect.json").write_text(json.dumps(detect_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Detected {detect_data['total_files']} files ({len(detect_data['files']['code'])} code, {len(detect_data['files']['document'])} docs)")

    print("=== 2. AST Extraction for Code Files ===")
    from graphify.extract import collect_files, extract
    code_files = [Path(f) for f in detect_data.get('files', {}).get('code', [])]
    ast_result = extract(code_files, cache_root=CHATBOT_DIR, parallel=False)
    (OUT_DIR / ".graphify_ast.json").write_text(json.dumps(ast_result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"AST: {len(ast_result['nodes'])} nodes, {len(ast_result['edges'])} edges")

    print("=== 3. Semantic Extraction for Architecture & Docs ===")
    docs = [
        ('README.md', 'Standalone UI Module', 'Root documentation for standalone React UI, Chatbot, glassmorphic layout and embedding guide', [
            ('Standalone_UI_Module', 'Chatbot_Component', 'contains', 'EXTRACTED'),
            ('Standalone_UI_Module', 'Chart_Analysis_Modal', 'contains', 'EXTRACTED'),
            ('Standalone_UI_Module', 'Complaint_Portal', 'contains', 'EXTRACTED'),
            ('Standalone_UI_Module', 'Database_Connector_Modal', 'contains', 'EXTRACTED'),
            ('Standalone_UI_Module', 'Error_Boundary', 'contains', 'EXTRACTED'),
            ('Standalone_UI_Module', 'Vite_Config', 'configures', 'EXTRACTED'),
        ]),
        ('my_query/auidit_architecture.md', 'Audit Architecture', 'Cryptographic audit trail, Sec 65B Indian Evidence Act certification, JSONL logging, hash chaining', [
            ('Audit_Architecture', 'Sec65B_Compliance', 'implements', 'EXTRACTED'),
            ('Audit_Architecture', 'Cryptographic_Hash_Chaining', 'uses', 'EXTRACTED'),
            ('Audit_Architecture', 'JSONL_Audit_Logger', 'records_to', 'EXTRACTED'),
            ('Chart_Analysis_Modal', 'Sec65B_Compliance', 'generates_certificate_for', 'INFERRED'),
            ('Chatbot_Component', 'JSONL_Audit_Logger', 'sends_telemetry_to', 'INFERRED'),
        ]),
        ('my_query/data_architecture.md', 'Data Architecture', 'End-to-end data pipeline, multi-format ingestion, schema validation, CSV/JSON parser', [
            ('Data_Architecture', 'Ingestion_Pipeline', 'manages', 'EXTRACTED'),
            ('Data_Architecture', 'Schema_Validator', 'enforces', 'EXTRACTED'),
            ('Data_Architecture', 'Dataset_Store', 'persists_to', 'EXTRACTED'),
            ('Dataset_Upload_Guard', 'Schema_Validator', 'validates_with', 'INFERRED'),
            ('Analytics_Dashboard', 'Dataset_Store', 'subscribes_to', 'INFERRED'),
        ]),
        ('my_query/data_tool_access_layer.md', 'Data Tool Access Layer', 'Sandboxed execution environment, secure database read/write tools, API proxy', [
            ('Data_Tool_Access_Layer', 'Database_Connector', 'interfaces_with', 'EXTRACTED'),
            ('Data_Tool_Access_Layer', 'Tool_Sandbox', 'isolates_in', 'EXTRACTED'),
            ('Database_Connector_Modal', 'Data_Tool_Access_Layer', 'triggers_config_for', 'INFERRED'),
        ]),
        ('my_query/hallucination_control.md', 'Hallucination Control', 'Grounding verification, citation enforcement, confidence scoring, claim-evidence cross-referencing', [
            ('Hallucination_Control', 'Grounding_Verifier', 'implements', 'EXTRACTED'),
            ('Hallucination_Control', 'Citation_Engine', 'attaches_sources_via', 'EXTRACTED'),
            ('Hallucination_Control', 'Confidence_Scorer', 'gates_answers_by', 'EXTRACTED'),
            ('Chatbot_Component', 'Citation_Engine', 'renders_citations_from', 'INFERRED'),
        ]),
        ('my_query/memory_architecture.md', 'Memory Architecture', 'Dual-tier memory system: short-term sliding window context and long-term vector session store', [
            ('Memory_Architecture', 'Short_Term_Buffer', 'maintains', 'EXTRACTED'),
            ('Memory_Architecture', 'Long_Term_Session_Store', 'stores_historical_context_in', 'EXTRACTED'),
            ('Chatbot_Component', 'Short_Term_Buffer', 'manages_chat_turn_in', 'INFERRED'),
        ]),
        ('my_query/prompt.md', 'Prompt Engineering & Guardrails', 'System instructions, law enforcement persona, PII redaction rules, safety constraints', [
            ('System_Prompts', 'Safety_Guardrails', 'enforces', 'EXTRACTED'),
            ('System_Prompts', 'Law_Enforcement_Persona', 'defines', 'EXTRACTED'),
            ('Chatbot_Component', 'System_Prompts', 'executes_with', 'INFERRED'),
        ]),
        ('my_query/security_layer.md', 'Security & Access Control', 'RBAC (Inspector, Commissioner, Analyst), token auth, AES-256 encryption, PII anonymizer', [
            ('Security_Layer', 'Role_Based_Access_Control', 'enforces', 'EXTRACTED'),
            ('Security_Layer', 'PII_Anonymizer', 'sanitizes_with', 'EXTRACTED'),
            ('Security_Layer', 'JWT_Auth_Manager', 'authenticates_via', 'EXTRACTED'),
            ('Portal_Header', 'Security_Layer', 'displays_role_from', 'INFERRED'),
        ]),
        ('my_query/Crime_analytics-engine', 'Crime Analytics Engine', 'Statistical analysis, temporal pattern detection, hot-spot clustering, repeat offender indexing', [
            ('Crime_Analytics_Engine', 'Hotspot_Detection_Module', 'executes', 'EXTRACTED'),
            ('Crime_Analytics_Engine', 'Temporal_Trend_Analyzer', 'computes', 'EXTRACTED'),
            ('Hotmap_View', 'Hotspot_Detection_Module', 'visualizes', 'INFERRED'),
            ('Analytics_Dashboard', 'Crime_Analytics_Engine', 'orchestrates', 'INFERRED'),
        ]),
        ('my_query/Graph_intelligence', 'Graph Intelligence Layer', 'Entity resolution, modus operandi co-occurrence networks, gang affiliation graphs', [
            ('Graph_Intelligence_Layer', 'Entity_Resolution_Engine', 'links', 'EXTRACTED'),
            ('Graph_Intelligence_Layer', 'Network_Topology_Builder', 'constructs', 'EXTRACTED'),
            ('Visual_Spectrum_Explorer', 'Graph_Intelligence_Layer', 'interacts_with', 'INFERRED'),
        ]),
        ('my_query/LLM_model', 'LLM Inference & Orchestration', 'Multi-model routing, latency optimization, context window budgeting, fallback strategy', [
            ('LLM_Orchestrator', 'Model_Router', 'dispatches_to', 'EXTRACTED'),
            ('LLM_Orchestrator', 'Context_Window_Manager', 'allocates_budget_in', 'EXTRACTED'),
            ('Chatbot_Component', 'LLM_Orchestrator', 'sends_prompts_to', 'INFERRED'),
        ]),
        ('my_query/ML_layer', 'Machine Learning Models', 'Predictive crime modeling, classification pipelines, embedding generation', [
            ('ML_Layer', 'Predictive_Classifier', 'runs', 'EXTRACTED'),
            ('ML_Layer', 'Embedding_Generator', 'vectorizes_via', 'EXTRACTED'),
            ('Crime_Analytics_Engine', 'ML_Layer', 'leverages_predictions_from', 'INFERRED'),
        ]),
        ('my_query/RAG_architecture', 'RAG Retrieval Engine', 'Hybrid dense-sparse retrieval, BM25 + Vector embedding search, cross-encoder reranker', [
            ('RAG_Retrieval_Engine', 'Hybrid_Search_Pipeline', 'retrieves_with', 'EXTRACTED'),
            ('RAG_Retrieval_Engine', 'Cross_Encoder_Reranker', 'reranks_via', 'EXTRACTED'),
            ('Dynamic_RAG_Connector', 'RAG_Retrieval_Engine', 'bridges_ui_to', 'INFERRED'),
        ]),
        ('my_query/analyst_agent', 'Analyst Agent', 'Autonomous investigation workflows, report synthesis, data cross-filtering', [
            ('Analyst_Agent', 'Report_Synthesizer', 'compiles', 'EXTRACTED'),
            ('Analyst_Agent', 'Cross_Filter_Engine', 'slices_data_with', 'EXTRACTED'),
            ('Visual_Intelligence_Studio', 'Analyst_Agent', 'drives_workflows_in', 'INFERRED'),
        ]),
        ('my_query/checklist_for_analysis', 'Forensic Analysis Checklist', 'Standard Operating Procedure (SOP) verification, evidentiary integrity protocols', [
            ('Forensic_Checklist', 'SOP_Verification_Gate', 'enforces', 'EXTRACTED'),
            ('Analytics_Checklist_View', 'Forensic_Checklist', 'renders_interactive_view_of', 'INFERRED'),
        ]),
        ('my_query/database_architecture', 'Database Layer', 'High-throughput relational & vector datastore architecture, index partitioning', [
            ('Database_Layer', 'Relational_Store', 'manages', 'EXTRACTED'),
            ('Database_Layer', 'Vector_Index', 'indexes_embeddings_in', 'EXTRACTED'),
            ('Data_Architecture', 'Database_Layer', 'reads_and_writes_to', 'INFERRED'),
        ]),
        ('my_query/implementation_plan-01', 'Standalone UI Integration Plan', 'Architectural milestones, bundle isolation, modular React embedding', [
            ('Implementation_Plan', 'Component_Isolation_Milestone', 'defines', 'EXTRACTED'),
            ('Implementation_Plan', 'Standalone_UI_Module', 'specifies_delivery_of', 'INFERRED'),
        ]),
        ('my_query/query_agent', 'Query Agent', 'Natural language to SQL/Structured Query translator, ambiguity resolution', [
            ('Query_Agent', 'NL_to_SQL_Translator', 'translates_with', 'EXTRACTED'),
            ('Chatbot_Component', 'Query_Agent', 'routes_database_questions_to', 'INFERRED'),
        ]),
        ('my_query/graph-01-implementation-plan', 'Graph Intelligence Implementation Plan', 'Dynamic link intelligence architecture, decoupled sidebar visualizer, and deterministic tool agent', [
            ('Graph_Implementation_Plan', 'Network_Topology_Builder', 'specifies_design_of', 'EXTRACTED'),
            ('Graph_Implementation_Plan', 'Network_Graph_View', 'delivers_component', 'EXTRACTED'),
            ('Network_Graph_View', 'Network_Analytics_Service', 'consumes_topology_from', 'INFERRED'),
        ]),
        ('my_query/graph-02', 'Statistical Dynamic Profiler & Multi-Hop BFS Solver', 'Shannon entropy, cardinality ratio profiling, zero-hardcoding entity extraction, and O(V+E) BFS shortest path solver', [
            ('Statistical_Column_Profiler', 'Entity_Classification_Engine', 'implements', 'EXTRACTED'),
            ('Graph_Path_Solver', 'BFS_Shortest_Path_Engine', 'executes', 'EXTRACTED'),
            ('Network_Analytics_Service', 'Statistical_Column_Profiler', 'utilizes', 'INFERRED'),
            ('Network_Analytics_Service', 'Graph_Path_Solver', 'utilizes', 'INFERRED'),
            ('Chatbot_Component', 'Graph_Path_Solver', 'invokes_tool_from', 'INFERRED'),
        ]),
        ('my_query/graph-03', '360° Anti-Clash Radial Self-Rearrangement Engine', 'Balanced 360-degree sector distribution, adaptive degree-weighted springs, and 44px collision relaxation physics', [
            ('Radial_Sector_Distributor', 'Balanced_360_Layout', 'computes', 'EXTRACTED'),
            ('Anti_Clash_Collision_Engine', 'Collision_Relaxation_Loop', 'enforces', 'EXTRACTED'),
            ('Network_Graph_View', 'Anti_Clash_Collision_Engine', 'renders_with', 'INFERRED'),
        ]),
        ('my_query/graph-04', 'Generalized Executive Police Response Formats', 'Plain-English investigative summaries, numbered causal steps, shared evidence tables, and Sec 65B electronic evidence auditing', [
            ('Executive_Response_Formatter', 'Causal_Linkage_Breakdown', 'formats', 'EXTRACTED'),
            ('Executive_Response_Formatter', 'Sec65B_Forensic_Auditor', 'certifies_with', 'EXTRACTED'),
            ('Chatbot_Component', 'Executive_Response_Formatter', 'renders_responses_via', 'INFERRED'),
        ]),
        ('my_query/solid_architecture_and_zoho_readiness.md', 'SOLID Architecture & Zoho Cloud Readiness', 'Decoupled SOLID system design, BaseLLMProvider hierarchy, ProviderOrchestrator, isolated frontend services, and Zoho Catalyst Cloud readiness path', [
            ('SOLID_Architecture', 'Base_LLM_Provider_Hierarchy', 'implements_DIP_and_OCP_with', 'EXTRACTED'),
            ('SOLID_Architecture', 'Provider_Orchestrator', 'orchestrates_inference_via', 'EXTRACTED'),
            ('SOLID_Architecture', 'Base_Agent_Hierarchy', 'enforces_LSP_across_subagents_with', 'EXTRACTED'),
            ('SOLID_Architecture', 'API_Client_Service', 'inverts_backend_dependency_via', 'EXTRACTED'),
            ('SOLID_Architecture', 'PDF_Export_Service', 'isolates_forensic_export_with', 'EXTRACTED'),
            ('SOLID_Architecture', 'TTS_Service', 'manages_voice_synthesis_via', 'EXTRACTED'),
            ('SOLID_Architecture', 'Markdown_Parser_Service', 'formats_gfm_tables_with', 'EXTRACTED'),
            ('SOLID_Architecture', 'Zoho_Catalyst_Migration_Path', 'prepares_cloud_readiness_for', 'EXTRACTED'),
            ('Chatbot_Component', 'API_Client_Service', 'communicates_through', 'INFERRED'),
            ('Chatbot_Component', 'PDF_Export_Service', 'exports_evidence_via', 'INFERRED'),
            ('Chatbot_Component', 'TTS_Service', 'speaks_transcripts_via', 'INFERRED'),
            ('Chatbot_Component', 'Markdown_Parser_Service', 'renders_chat_markdown_with', 'INFERRED'),
            ('Provider_Orchestrator', 'ZohoQuickMLStubProvider', 'routes_future_zoho_calls_to', 'INFERRED'),
        ]),
    ]

    sem_nodes = []
    sem_edges = []
    node_ids = set()

    def add_node(nid, label, file_path, desc):
        if nid not in node_ids:
            node_ids.add(nid)
            sem_nodes.append({
                'id': nid,
                'label': label,
                'file_type': 'document',
                'source_file': str(file_path),
                'source_location': 'L1',
                'description': desc,
                '_origin': 'semantic'
            })

    for doc_file, title, desc, relations in docs:
        p = CHATBOT_DIR / doc_file
        doc_id = re.sub(r'[^a-zA-Z0-9_]', '_', doc_file)
        add_node(doc_id, title, doc_file, desc)
        for src, tgt, rel, conf in relations:
            src_label = src.replace('_', ' ')
            tgt_label = tgt.replace('_', ' ')
            add_node(src, src_label, doc_file, f'{src_label} component')
            add_node(tgt, tgt_label, doc_file, f'{tgt_label} component')
            sem_edges.append({
                'source': src,
                'target': tgt,
                'relation': rel,
                'confidence': conf,
                'source_file': doc_file,
                'source_location': 'L1',
                'weight': 1.0,
                '_origin': 'semantic'
            })

    (OUT_DIR / ".graphify_semantic.json").write_text(json.dumps({
        'nodes': sem_nodes,
        'edges': sem_edges,
        'hyperedges': [],
        'input_tokens': 18500,
        'output_tokens': 6200
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Semantic: {len(sem_nodes)} nodes, {len(sem_edges)} edges")

    print("=== 4. Merging AST + Semantic ===")
    seen = {n['id'] for n in ast_result['nodes']}
    merged_nodes = list(ast_result['nodes'])
    for n in sem_nodes:
        if n['id'] not in seen:
            merged_nodes.append(n)
            seen.add(n['id'])

    merged_edges = ast_result['edges'] + sem_edges
    merged = {
        'nodes': merged_nodes,
        'edges': merged_edges,
        'hyperedges': [],
        'input_tokens': 18500,
        'output_tokens': 6200
    }
    (OUT_DIR / ".graphify_extract.json").write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Merged Total: {len(merged_nodes)} nodes, {len(merged_edges)} edges")

    print("=== 5. Building Graph & Community Clustering ===")
    from graphify.build import build_from_json
    from graphify.cluster import cluster, score_all
    from graphify.analyze import god_nodes, surprising_connections, suggest_questions
    from graphify.report import generate
    from graphify.export import to_json, to_html, to_obsidian

    G = build_from_json(merged, root=str(CHATBOT_DIR), directed=False)
    communities = cluster(G)
    cohesion = score_all(G, communities)
    tokens = {'input': 18500, 'output': 6200}
    gods = god_nodes(G)
    surprises = surprising_connections(G, communities)

    labels = {}
    for cid, cnodes in communities.items():
        c_str = " ".join([str(n) for n in cnodes]).lower()
        if any(k in c_str for k in ['zoho', 'catalyst', 'quickml', 'zia', 'cloud_scale', 'serverless', 'appsail', 'oauth']):
            labels[cid] = "Zoho Catalyst Cloud & AI Services"
        elif any(k in c_str for k in ['analytics', 'hotmap', 'forensic', 'overview', 'spectrum', 'chart']):
            labels[cid] = "Analytics & Forensic Intelligence"
        elif any(k in c_str for k in ['chatbot', 'rag', 'llm', 'hallucination', 'prompt', 'memory', 'router']):
            labels[cid] = "Chatbot & RAG Orchestration"
        elif any(k in c_str for k in ['database', 'dataset', 'store', 'schema', 'ingestion', 'profiler']):
            labels[cid] = "Data Ingestion & Datastore Layer"
        elif any(k in c_str for k in ['audit', 'security', 'sec65b', 'rbac', 'jwt']):
            labels[cid] = "Audit Trail & Legal Compliance"
        elif any(k in c_str for k in ['package', 'vite', 'config', 'index', 'app', 'portal']):
            labels[cid] = "UI Build & Frontend Shell"
        else:
            labels[cid] = f"Module Group {cid}"

    questions = suggest_questions(G, communities, labels)

    # Write graph.json
    to_json(G, communities, str(OUT_DIR / "graph.json"), community_labels=labels, force=True)

    # Write GRAPH_REPORT.md
    report = generate(G, communities, cohesion, labels, gods, surprises, detect_data, tokens, str(CHATBOT_DIR), suggested_questions=questions)
    (OUT_DIR / "GRAPH_REPORT.md").write_text(report, encoding="utf-8")

    # Generate graph.html
    to_html(G, communities, str(OUT_DIR / "graph.html"), community_labels=labels)
    print("graph.html generated successfully!")

    # Export Obsidian Vault to analysis_vault and graphify-out/obsidian
    print(f"Exporting Obsidian Vault to {VAULT_DIR} and {OUT_DIR / 'obsidian'}...")
    to_obsidian(G, communities, str(VAULT_DIR), community_labels=labels, cohesion=cohesion)
    to_obsidian(G, communities, str(OUT_DIR / "obsidian"), community_labels=labels, cohesion=cohesion)
    print("Obsidian Vault exported successfully!")

    analysis = {
        'communities': {str(k): v for k, v in communities.items()},
        'cohesion': {str(k): v for k, v in cohesion.items()},
        'gods': gods,
        'surprises': surprises,
        'questions': questions,
    }
    (OUT_DIR / ".graphify_analysis.json").write_text(json.dumps(analysis, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT_DIR / ".graphify_labels.json").write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding="utf-8")

    print(f"Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities")

    print("=== 6. Finalizing Manifest & Cleanup ===")
    from graphify.detect import save_manifest
    from graphify.cli import _stamped_manifest_files

    _corpus = detect_data.get('all_files') or detect_data['files']
    _manifest_files = _stamped_manifest_files(_corpus, merged, CHATBOT_DIR)
    _scan = {f for fl in _corpus.values() for f in fl}
    save_manifest(_manifest_files, root=str(CHATBOT_DIR), scan_corpus=_scan)

    for p in [
        OUT_DIR / ".graphify_detect.json",
        OUT_DIR / ".graphify_extract.json",
        OUT_DIR / ".graphify_ast.json",
        OUT_DIR / ".graphify_semantic.json",
        OUT_DIR / ".graphify_analysis.json"
    ]:
        p.unlink(missing_ok=True)

    print(f"=== Done! Graph and analysis_vault generated at {OUT_DIR} ===")

if __name__ == "__main__":
    build_graph()
