import sqlite3
import logging
from pathlib import Path
from typing import Optional, List

# Setup basic logging for the database module
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def get_db_path() -> Path:
    """
    Returns the absolute path to the local SQLite database.
    Designed so it can easily be updated for production environments.
    """
    return Path(__file__).parent / 'crime.db'

def connect_database(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """
    Establishes a connection to the SQLite database.
    Sets row_factory to sqlite3.Row for dict-like access to rows.
    """
    if db_path is None:
        db_path = get_db_path()
        
    try:
        conn = sqlite3.connect(db_path)
        # Allows accessing columns by name
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        logging.error(f"Error connecting to database: {e}")
        raise

def execute_query(query: str, parameters: Optional[tuple] = None, db_path: Optional[Path] = None) -> List[sqlite3.Row]:
    """
    Executes a SQL query on the database.
    - If it is a SELECT query, fetches and returns the rows.
    - Otherwise, commits the transaction and returns an empty list.
    """
    conn = None
    try:
        conn = connect_database(db_path)
        cursor = conn.cursor()
        
        if parameters:
            cursor.execute(query, parameters)
        else:
            cursor.execute(query)
        
        query_upper = query.strip().upper()
        if query_upper.startswith('SELECT') or query_upper.startswith('PRAGMA'):
            results = cursor.fetchall()
            return results
        else:
            conn.commit()
            return []
            
    except sqlite3.Error as e:
        logging.error(f"Database query error: {e}")
        raise
    finally:
        if conn:
            close_database(conn)

def close_database(conn: sqlite3.Connection) -> None:
    """
    Safely closes the database connection.
    """
    try:
        if conn:
            conn.close()
    except sqlite3.Error as e:
        logging.error(f"Error closing database: {e}")

def get_dynamic_schema() -> str:
    """
    Extracts live schema (tables and columns) from the SQLite database dynamically.
    Enables zero-config AI adaptability when new tables/columns are added.
    """
    conn = None
    try:
        conn = connect_database()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = cursor.fetchall()
        
        schema_parts = []
        for table_row in tables:
            table_name = table_row['name']
            cursor.execute(f"PRAGMA table_info('{table_name}');")
            columns = cursor.fetchall()
            col_desc = [f"- {col['name']} ({col['type']})" for col in columns]
            schema_parts.append(f"TABLE: {table_name}\nCOLUMNS:\n" + "\n".join(col_desc))
            
        return "\n\n".join(schema_parts)
    except Exception as e:
        logging.error(f"Error fetching dynamic schema: {e}")
        return "TABLE: CrimeStatistics\nCOLUMNS: Month, Year, Crime_Category, Subcategory, Cases"
    finally:
        if conn:
            conn.close()

