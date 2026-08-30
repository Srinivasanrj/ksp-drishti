"""
KSP Sentinel AI — DuckDB Session-Isolated Storage (SOLID: DIP)
"""
import logging
import re
import tempfile
import threading
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import io
import time
import pandas as pd
import duckdb

from app.core.interfaces import IDatasetRepository
from app.providers.orchestrator import orchestrator

log = logging.getLogger("standalone.session_store")


class SessionDataStore(IDatasetRepository):
    """
    Manages session-isolated in-memory DuckDB database sessions.
    Enforces Data-Empty baseline until an officer uploads a CSV/Excel/JSON file.
    Thread-safe implementation using threading.RLock().
    """
    def __init__(self):
        self.sessions: Dict[str, dict] = {}  # session_id -> { "con": duckdb_con, "tables": {}, "files": [] }
        self._lock = threading.RLock()

    def get_connection(self, session_id: str):
        with self._lock:
            if session_id not in self.sessions:
                con = duckdb.connect(database=":memory:")
                self.sessions[session_id] = {
                    "con": con,
                    "tables": {},
                    "files": []
                }
            return self.sessions[session_id]["con"]

    def ingest_dataset(self, session_id: str, filename: str, file_bytes: bytes) -> dict:
        """
        Polymorphic Ingestion for CSV, JSON, and Excel (.xlsx, .xls) files.
        Applies zero-hardcode LLM Schema-Sniffing to auto-classify and bind datasets.
        """
        con = self.get_connection(session_id)
        suffix = Path(filename).suffix.lower() or ".csv"
        
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            # Derive sanitized table name
            clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', Path(filename).stem).lower().strip('_')
            
            with self._lock:
                has_primary = "crime_dataset" in self.sessions[session_id]["tables"]
            
            table_name = "crime_dataset" if not has_primary else f"table_{clean_name}"
            con.execute(f"DROP TABLE IF EXISTS {table_name}")

            # ── 1. Polymorphic Format Loading ─────────────────────────────────
            if suffix in (".xlsx", ".xls"):
                df = pd.read_excel(io.BytesIO(file_bytes))
                con.register("df_temp_upload", df)
                con.execute(f"CREATE TABLE {table_name} AS SELECT * FROM df_temp_upload")
                con.unregister("df_temp_upload")
            elif suffix == ".json":
                con.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_json_auto('{tmp_path}')")
            else:
                con.execute(f"CREATE TABLE {table_name} AS SELECT * FROM read_csv_auto('{tmp_path}')")

            row_count = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            desc = con.execute(f"DESCRIBE {table_name}").fetchall()
            columns = [row[0] for row in desc]

            # ── 2. Universal LLM Schema-Sniffing (No Hardcoding) ──────────────
            prompt = (
                f"You are a police data router. Review these dataset columns: {columns}.\n"
                f"- If they represent relational links, transactions, or network entities (e.g. source, target, phone, upi, mule, sender, receiver, account, suspect), reply 'GRAPH'.\n"
                f"- If they represent statistical metrics, crimes, dates, amounts, or incident aggregations (e.g. fir, date, ipc, crime_type, amount, loss, recovery, station), reply 'ANALYTICAL'.\n"
                f"- If they represent both or generic multi-domain data, reply 'DUAL'.\n"
                f"Reply with exactly ONE word: GRAPH, ANALYTICAL, or DUAL."
            )
            try:
                raw_classification = orchestrator.generate_completion(
                    prompt,
                    system_instruction="You are a dataset schema classifier. Reply with exactly one word: GRAPH, ANALYTICAL, or DUAL.",
                    max_tokens=15
                ).strip().upper()
                classification = raw_classification.split()[0].rstrip(".,:") if raw_classification else "DUAL"
            except Exception as e:
                log.warning(f"[SessionDataStore] LLM schema classification error: {e}. Defaulting to DUAL")
                classification = "DUAL"

            log.info(f"[SessionDataStore] LLM Schema Classification for '{filename}': [{classification}] ({row_count} rows, {len(columns)} cols)")

            # ── 3. Relational Alias Binding ───────────────────────────────────
            if classification in ("GRAPH", "DUAL") or any(w in clean_name for w in ["network", "mule", "cdr", "telecom", "link", "syndicate"]):
                con.execute("DROP TABLE IF EXISTS network_dataset")
                con.execute(f"CREATE TABLE network_dataset AS SELECT * FROM {table_name}")

            with self._lock:
                table_meta = {
                    "filename": filename,
                    "row_count": row_count,
                    "columns": columns,
                    "schema": desc,
                    "classification": classification
                }
                self.sessions[session_id]["tables"][table_name] = table_meta
                if classification in ("GRAPH", "DUAL") or any(w in clean_name for w in ["network", "mule", "cdr", "telecom", "link", "syndicate"]):
                    self.sessions[session_id]["tables"]["network_dataset"] = table_meta

                # Track currently active visual table for dynamic Visual Studio re-binding
                self.sessions[session_id]["active_visual_table"] = table_name

                # Prevent duplicate file entries
                if not any(f["name"] == filename for f in self.sessions[session_id]["files"]):
                    self.sessions[session_id]["files"].append({
                        "name": filename,
                        "table_name": table_name,
                        "size": len(file_bytes),
                        "rows": row_count,
                        "classification": classification
                    })

            log.info(f"[SessionDataStore] Ingested {filename} -> {table_name} [{classification}] in session '{session_id}'")
            return {
                "success": True,
                "table_name": table_name,
                "row_count": row_count,
                "columns": columns,
                "classification": classification,
                "active_tables": list(self.sessions[session_id]["tables"].keys()),
                "active_visual_table": table_name
            }
        except Exception as e:
            log.error(f"[SessionDataStore] Ingestion failed for session '{session_id}' file '{filename}': {e}")
            raise e

    def ingest_csv(self, session_id: str, filename: str, csv_bytes: bytes) -> dict:
        """Backwards-compatible alias for ingest_dataset."""
        return self.ingest_dataset(session_id, filename, csv_bytes)

    def attach_live_database(self, session_id: str, db_type: str, uri: str, table_or_collection: Optional[str] = None) -> dict:
        """
        SOLID OCP: Extensible connector for live MySQL, PostgreSQL, SQLite, and MongoDB.
        """
        con = self.get_connection(session_id)
        table_name = f"live_{db_type}_{re.sub(r'[^a-zA-Z0-9_]', '_', table_or_collection or 'table').lower()}"
        
        try:
            if db_type.lower() in ("mysql", "postgres", "sqlite"):
                # DuckDB native extension attach
                con.execute(f"INSTALL {db_type.lower()}; LOAD {db_type.lower()};")
                con.execute(f"ATTACH '{uri}' AS {table_name}_db (TYPE {db_type.lower()})")
                con.execute(f"CREATE TABLE {table_name} AS SELECT * FROM {table_name}_db.{table_or_collection or 'default_table'}")
            else:
                raise ValueError(f"Database type '{db_type}' requires dedicated remote driver configuration.")

            row_count = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            desc = con.execute(f"DESCRIBE {table_name}").fetchall()
            columns = [row[0] for row in desc]

            with self._lock:
                table_meta = {
                    "filename": f"LIVE_{db_type.upper()}_{table_or_collection}",
                    "row_count": row_count,
                    "columns": columns,
                    "schema": desc,
                    "classification": "DUAL"
                }
                self.sessions[session_id]["tables"][table_name] = table_meta
                self.sessions[session_id]["active_visual_table"] = table_name

            return {
                "success": True,
                "table_name": table_name,
                "row_count": row_count,
                "columns": columns,
                "classification": "DUAL"
            }
        except Exception as e:
            log.error(f"[SessionDataStore] Live database attachment failed: {e}")
            raise e

    def get_active_visual_table(self, session_id: str) -> Optional[str]:
        with self._lock:
            if session_id not in self.sessions:
                return None
            return self.sessions[session_id].get("active_visual_table") or (list(self.sessions[session_id]["tables"].keys())[-1] if self.sessions[session_id]["tables"] else None)

    def set_active_visual_table(self, session_id: str, table_name: str):
        with self._lock:
            if session_id in self.sessions and table_name in self.sessions[session_id]["tables"]:
                self.sessions[session_id]["active_visual_table"] = table_name

    def get_table_for_query(self, session_id: str, query: str) -> str:
        with self._lock:
            if session_id not in self.sessions or not self.sessions[session_id]["tables"]:
                return "crime_dataset"

            tables = self.sessions[session_id]["tables"]
            q_lower = query.lower()

            # Relational / Network indicators
            network_tokens = ["mule", "upi", "phone", "suspect", "vehicle", "cdr", "account", "burner", "nexus", "kingpin", "hub", "chain"]
            if any(t in q_lower for t in network_tokens):
                if "network_dataset" in tables:
                    return "network_dataset"
                for tname, tmeta in tables.items():
                    cols_lower = [c.lower() for c in tmeta.get("columns", [])]
                    if any(w in cols_lower for w in ["suspect_name", "phone_number", "upi_id", "vehicle_number", "bank_account"]):
                        return tname

            # Default to active visual table or primary table
            return self.get_active_visual_table(session_id) or "crime_dataset"

    def has_dataset(self, session_id: str, table_name: Optional[str] = None) -> bool:
        with self._lock:
            if session_id not in self.sessions:
                return False
            tables = self.sessions[session_id]["tables"]
            if table_name:
                return table_name in tables
            return len(tables) > 0

    def get_columns(self, session_id: str, table_name: Optional[str] = None) -> Tuple[List[str], List[str]]:
        if not self.has_dataset(session_id):
            return [], []
        with self._lock:
            tables = self.sessions[session_id]["tables"]
            target_table = table_name if (table_name and table_name in tables) else self.get_active_visual_table(session_id)
            if not target_table or target_table not in tables:
                target_table = list(tables.keys())[0]
            meta = tables.get(target_table, {})
            columns = meta.get("columns", [])
            types = [r[1] for r in meta.get("schema", [])]
            return columns, types

    def get_schema_summary(self, session_id: str, table_name: Optional[str] = None) -> str:
        if not self.has_dataset(session_id):
            return "No dataset active in current session."
        columns, types = self.get_columns(session_id, table_name)
        active_t = self.get_active_visual_table(session_id) or "primary"
        return f"Active Table '{active_t}' ({len(columns)} columns): " + ", ".join([f"{c} ({t})" for c, t in zip(columns, types)])

    def execute_sql(self, session_id: str, query: str) -> Tuple[List[str], List[tuple]]:
        con = self.get_connection(session_id)
        try:
            rel = con.execute(query)
            cols = [desc[0] for desc in rel.description] if rel.description else []
            rows = rel.fetchall()
            return cols, rows
        except Exception as e:
            log.error(f"[SessionDataStore] SQL execution error: {e} | Query: {query}")
            raise e


# Singleton Store
session_store = SessionDataStore()
