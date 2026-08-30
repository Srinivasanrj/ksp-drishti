import logging
import json
import re
from typing import List, Dict, Any
from database import execute_query, get_dynamic_schema
from prompts import get_text_to_sql_prompt, ANALYTICS_SYNTHESIS_PROMPT
from llm import call_glm

logger = logging.getLogger(__name__)

class AnalyticsAgent:
    """
    Autonomous agent responsible for translating natural language to SQL,
    executing it safely, and synthesizing a conversational response.
    """
    
    @classmethod
    def run(cls, user_query: str, history: List[Dict[str, str]] = None, session_id: str = None, division: str = None) -> dict:
        logger.info(f"[AnalyticsAgent] Starting Text-to-SQL workflow (Session: {session_id}, Division: {division})")
        
        # Step 1: Generate & Normalize SQL (_normalize_sql is called inside _generate_sql)
        sql_query = cls._generate_sql(user_query, history, session_id=session_id, division=division)
        
        # Step 2: Execute SQL (check for isolated session DB first)
        rows = cls._execute_sql(sql_query, session_id=session_id)
        
        # Step 3: Analyze Data
        answer = cls._analyze_results(user_query, sql_query, rows)
        
        # Step 4: Visual Chart Payload
        chart_data = cls._generate_chart_payload(user_query, rows)
        
        return {
            "sql": sql_query,
            "rows": rows,
            "answer": answer,
            "chart_data": chart_data
        }

    @classmethod
    def _generate_chart_payload(cls, user_query: str, rows: list) -> dict:
        if not rows or not isinstance(rows, list) or len(rows) == 0:
            return None

        negative_keywords = ["do not", "no chart", "no report", "skip analysis", "text only"]
        query_lower = user_query.lower()
        if any(kw in query_lower for kw in negative_keywords):
            logger.info("[AnalysisAgent] Visual chart aborted due to negative constraint in prompt.")
            return None

        # Convert sqlite3.Row objects to plain Python dicts
        clean_rows = []
        for r in rows:
            if hasattr(r, 'keys'):
                clean_rows.append({k: r[k] for k in r.keys()})
            elif isinstance(r, dict):
                clean_rows.append(r)

        if not clean_rows:
            return None

        def is_num(val):
            if isinstance(val, (int, float)):
                return True
            if isinstance(val, str):
                v_str = val.strip().replace(',', '')
                try:
                    float(v_str)
                    return True
                except ValueError:
                    return False
            return False

        def parse_num(val):
            if isinstance(val, (int, float)):
                return float(val)
            if isinstance(val, str):
                try:
                    return float(val.strip().replace(',', ''))
                except ValueError:
                    return 0.0
            return 0.0

        # Case A: Single row with multiple numeric columns
        if len(clean_rows) == 1:
            r = clean_rows[0]
            labels = []
            data = []
            for k, v in r.items():
                if is_num(v):
                    labels.append(str(k).replace("_", " ").title())
                    data.append(parse_num(v))
            if labels and data and len(labels) >= 1:
                return {
                    "type": "combination",
                    "labels": labels,
                    "datasets": [{
                        "label": "Metric Value",
                        "data": data
                    }],
                    "rows": clean_rows
                }

        # Case B: Multi-row data
        first_row = clean_rows[0]
        keys = list(first_row.keys())
        if len(keys) < 1:
            return None

        skip_cols = {'year', 'yr', 'id', 'month', 'code', 'sno', 'sl_no', 'slno'}

        # Priority 1: non-skip int/float columns
        value_col = None
        for k in keys:
            if k.lower() not in skip_cols and isinstance(first_row[k], (int, float)):
                value_col = k
                break

        # Priority 2: non-skip numeric string columns
        if not value_col:
            for k in keys:
                if k.lower() not in skip_cols and is_num(first_row[k]):
                    value_col = k
                    break

        # Priority 3: any numeric column
        if not value_col:
            for k in reversed(keys):
                if is_num(first_row[k]):
                    value_col = k
                    break

        if not value_col:
            value_col = keys[-1]

        label_cols = [k for k in keys if k != value_col and k.lower() not in skip_cols]
        if not label_cols:
            label_cols = [k for k in keys if k != value_col]
        if not label_cols:
            label_cols = [keys[0]]

        labels = []
        for r in clean_rows[:15]:
            parts = [str(r.get(k, '')) for k in label_cols if r.get(k) is not None]
            labels.append(" | ".join(parts) if parts else "Metric")

        data = [parse_num(r.get(value_col, 0)) for r in clean_rows[:15]]

        return {
            "type": "combination",
            "labels": labels,
            "datasets": [
                {
                    "label": str(value_col).replace("_", " ").title(),
                    "data": data
                }
            ],
            "rows": clean_rows[:15]
        }

    @classmethod
    def _normalize_sql(cls, sql: str) -> str:
        if not sql or not isinstance(sql, str):
            return sql

        # FIR_Records Year fix
        if 'FIR_Records' in sql and re.search(r'\bWHERE\b.*\bYear\b', sql, re.IGNORECASE):
            sql = re.sub(r'WHERE\s+Year\s*=\s*[\'"]?(\d{4})[\'"]?', r"WHERE strftime('%Y', Date) = '\1'", sql, flags=re.IGNORECASE)
            sql = re.sub(r'AND\s+Year\s*=\s*[\'"]?(\d{4})[\'"]?', r"AND strftime('%Y', Date) = '\1'", sql, flags=re.IGNORECASE)

        # District column fix
        if 'KA_DistrictDetailedCrimes' in sql:
            sql = re.sub(r'\bDistrict\b', 'DISTRICT_UNITS', sql, flags=re.IGNORECASE)

        # Month normalization (matches 'Jan', 'mar', 'mar 2026', etc.)
        months = {
            'jan': 'January', 'feb': 'February', 'mar': 'March',
            'apr': 'April', 'may': 'May', 'jun': 'June',
            'jul': 'July', 'aug': 'August', 'sep': 'September',
            'oct': 'October', 'nov': 'November', 'dec': 'December'
        }
        for abbr, full in months.items():
            sql = re.sub(r"=\s*['\"]" + abbr + r"[a-z0-9\s]*['\"]", f"='{full}'", sql, flags=re.IGNORECASE)

        # Year normalization (matches '2026', '2026.0', and 2026)
        sql = re.sub(r"\bYear\s*=\s*['\"]?(\d{4})(?:\.0)?['\"]?", r"(Year = '\1' OR Year = '\1.0' OR CAST(Year AS INT) = \1)", sql, flags=re.IGNORECASE)

        return sql

    @classmethod
    def _generate_sql(cls, user_query: str, history: List[Dict[str, str]], session_id: str = None, division: str = None) -> str:
        import os
        import sqlite3
        session_db_path = os.path.join(os.path.dirname(__file__), 'isolated_workspaces', f"session_{session_id}.db") if session_id else None

        if session_db_path and os.path.exists(session_db_path):
            try:
                conn = sqlite3.connect(session_db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
                schema_parts = []
                for (tbl,) in tables:
                    cursor.execute(f"PRAGMA table_info({tbl});")
                    cols = [row[1] for row in cursor.fetchall()]
                    schema_parts.append(f"TABLE: {tbl} ({', '.join(cols)})")
                conn.close()
                live_schema = "\n".join(schema_parts)
            except Exception as e:
                logger.error(f"Error fetching session schema: {e}")
                live_schema = get_dynamic_schema()
        else:
            # Dynamically fetch live schema from base database
            live_schema = get_dynamic_schema()

        system_prompt = get_text_to_sql_prompt(live_schema)
        
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        if history:
            for msg in history:
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
                
        user_prompt_content = f"[Active Division Context: {division}]\n{user_query}" if division else user_query
        messages.append({"role": "user", "content": user_prompt_content})
        
        try:
            response_data = call_glm(messages)
            content = response_data.get("response", "").strip()
            
            # Strip out reasoning thoughts if present
            if '</think>' in content:
                content = content.split('</think>')[-1].strip()
                
            # Extract content wrapped in <sql> ... </sql> tags first
            tag_match = re.search(r'<sql>([\s\S]*?)</sql>', content, re.IGNORECASE)
            if tag_match:
                content = tag_match.group(1).strip()
            else:
                # Fallback: Extract code block if wrapped in ```sql ... ```
                code_match = re.search(r'```(?:sql)?\s*([\s\S]+?)```', content, re.IGNORECASE)
                if code_match:
                    content = code_match.group(1).strip()

            # Locate SELECT or WITH keyword and strip any preamble
            select_match = re.search(r'\b(SELECT|WITH\s+[a-zA-Z_]+\s+AS)\b', content, re.IGNORECASE)
            if select_match:
                content = content[select_match.start():]

            # Extract query up to semicolon or trailing markdown
            sql_match = re.search(r'\b((?:SELECT|WITH\s+[a-zA-Z_]+\s+AS)\s+[\s\S]+?)(?:;|\`|\Z)', content, re.IGNORECASE)
            if sql_match:
                sql = sql_match.group(1).strip()
            else:
                # If we still haven't found a clean SQL statement, just take the raw string but
                # it's likely bad output.
                sql = content.strip()

            # Apply comprehensive SQL normalization
            sql = cls._normalize_sql(sql)

            # Final validation: Ensure the SQL string strictly starts with SELECT or WITH
            if not re.match(r'^(SELECT|WITH\s+[a-zA-Z_]+\s+AS)\b', sql, re.IGNORECASE):
                logger.warning(f"[AnalyticsAgent] Generated text is not valid SQL: '{sql[:50]}...'. Aborting SQL execution.")
                return "SELECT 1" # Safe fallback returning dummy result instead of SQLite syntax error

            logger.info(f"[AnalyticsAgent] Cleaned SQL: {sql}")
            return sql
            
        except Exception as e:
            logger.error(f"[AnalyticsAgent] SQL Generation failed: {e}")
            return "SELECT 1" # Safe fallback

    @classmethod
    def _execute_sql(cls, sql_query: str, session_id: str = None) -> list:
        # Safety Check: Prevent SQL Injection for destructive commands
        dangerous_keywords = [r'\bDROP\s+TABLE\b', r'\bDROP\s+DATABASE\b', r'\bDROP\s+VIEW\b', r'\bDELETE\s+FROM\b', r'\bINSERT\s+INTO\b', r'\bALTER\s+TABLE\b', r'\bTRUNCATE\b']
        query_upper = sql_query.upper()
        
        for pattern in dangerous_keywords:
            if re.search(pattern, query_upper):
                logger.warning(f"[AnalyticsAgent] BLOCKED dangerous SQL query pattern: {pattern}")
                return [{"error": f"Security Policy Blocked: Destructive operation matching '{pattern}' is not allowed."}]

        # Apply SQL normalization before execution
        sql_query = cls._normalize_sql(sql_query)

        try:
            import os
            import sqlite3
            session_db_path = os.path.join(os.path.dirname(__file__), 'isolated_workspaces', f"session_{session_id}.db") if session_id else None
            
            if session_db_path and os.path.exists(session_db_path):
                logger.info(f"[AnalyticsAgent] Executing SQL query against isolated session database: {session_db_path}")
                conn = sqlite3.connect(session_db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(sql_query)
                rows = cursor.fetchall()
                conn.close()
                clean_rows = [dict(row) for row in rows]
            else:
                rows = execute_query(sql_query)
                clean_rows = [dict(row) for row in rows] if rows else []

            # Automatic Fallback for Analytics queries returning 0 rows:
            # Ensures officer ALWAYS gets statistics + visual combination charts instead of text fallback
            if not clean_rows:
                logger.info("[AnalyticsAgent] Query returned 0 rows. Fetching top crime statistics fallback for visual dashboard...")
                fallback_sql = "SELECT Crime_Category, Subcategory, Cases FROM CrimeStatistics WHERE Cases > 0 ORDER BY Cases DESC LIMIT 15"
                fb_rows = execute_query(fallback_sql)
                clean_rows = [dict(row) for row in fb_rows] if fb_rows else []

            return clean_rows
        except Exception as e:
            logger.error(f"[AnalyticsAgent] SQL Execution failed: {e}")
            try:
                fb_rows = execute_query("SELECT Crime_Category, Subcategory, Cases FROM CrimeStatistics WHERE Cases > 0 ORDER BY Cases DESC LIMIT 15")
                return [dict(row) for row in fb_rows]
            except Exception:
                return []

    @classmethod
    def _analyze_results(cls, user_query: str, sql_query: str, rows: list) -> str:
        if not rows:
            return "No matching records were found for this query in the Karnataka SCRB crime database. Please verify the query parameters or try rephrasing."
            
        # Prevent Zoho Catalyst 400 MORE_THAN_MAX_LENGTH by capping result size
        truncated_rows = rows[:15]

        messages = [
            {"role": "system", "content": ANALYTICS_SYNTHESIS_PROMPT},
            {"role": "user", "content": f"USER QUESTION: {user_query}\nSQL EXECUTED: {sql_query}\nDATABASE RESULTS (showing up to 15 rows):\n{json.dumps(truncated_rows)}"}
        ]
        
        try:
            response_data = call_glm(messages)
            content = response_data.get("response", "").strip()
            
            # Strip chain-of-thought reasoning blocks comprehensively
            content = re.sub(r'<thought>[\s\S]*?</thought>', '', content, flags=re.IGNORECASE).strip()
            if '</think>' in content:
                content = content.split('</think>')[-1].strip()
            if '</thought>' in content:
                content = content.split('</thought>')[-1].strip()
                
            answer_match = re.search(r'<final_answer>([\s\S]*?)</final_answer>', content, re.IGNORECASE)
            if answer_match:
                content = answer_match.group(1).strip()
            else:
                # If LLM hallucinates and drops final_answer tags, we still stripped the thought block above.
                # Just remove any trailing XML tags it might have hallucinated.
                content = re.sub(r'<[^>]+>', '', content).strip()
                
            return content
        except Exception as e:
            logger.error(f"[AnalyticsAgent] Synthesis failed: {e}")
            return "Here is the raw data: " + json.dumps(rows)
