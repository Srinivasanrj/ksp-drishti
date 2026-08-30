import logging
from typing import List, Dict, Any, Tuple
from database import execute_query

logger = logging.getLogger(__name__)

def build_where_clause(conditions: List[str]) -> str:
    """Helper to safely construct WHERE clauses if conditions exist."""
    if not conditions:
        return ""
    return " WHERE " + " AND ".join(conditions)

def get_crime_count(category: str = None, month: str = None, year: str = None) -> Tuple[str, tuple]:
    """Builds SQL to get the total cases for a specific category, month, and year."""
    query = "SELECT SUM(Cases) as Total_Cases FROM CrimeStatistics"
    conditions = []
    params = []
    
    if category:
        conditions.append("Crime_Category = ?")
        params.append(category)
    if month:
        conditions.append("Month = ?")
        params.append(month)
    if year:
        conditions.append("Year = ?")
        params.append(str(year))
        
    query += build_where_clause(conditions)
    return query, tuple(params)

def compare_years(category: str, month: str, year1: str, year2: str) -> Tuple[str, tuple]:
    """Builds SQL to compare cases for a specific category and optionally month across two years."""
    query = "SELECT Year, SUM(Cases) as Total_Cases FROM CrimeStatistics"
    conditions = []
    params = []
    
    if category:
        conditions.append("Crime_Category = ?")
        params.append(category)
    if month:
        conditions.append("Month = ?")
        params.append(month)
        
    if year1 and year2:
        conditions.append("Year IN (?, ?)")
        params.extend([str(year1), str(year2)])
        
    query += build_where_clause(conditions)
    query += " GROUP BY Year ORDER BY Year"
    return query, tuple(params)

def list_categories(month: str = None, year: str = None) -> Tuple[str, tuple]:
    """Builds SQL to list all crime categories and their counts for a specific time."""
    query = "SELECT Crime_Category, SUM(Cases) as Total_Cases FROM CrimeStatistics"
    conditions = []
    params = []
    
    if month:
        conditions.append("Month = ?")
        params.append(month)
    if year:
        conditions.append("Year = ?")
        params.append(str(year))
        
    query += build_where_clause(conditions)
    query += " GROUP BY Crime_Category ORDER BY Total_Cases DESC"
    return query, tuple(params)

def highest_crime(year: str = None) -> Tuple[str, tuple]:
    """Builds SQL to find the highest recorded crime category in a given year."""
    query = "SELECT Crime_Category, SUM(Cases) as Total_Cases FROM CrimeStatistics"
    conditions = []
    params = []
    
    if year:
        conditions.append("Year = ?")
        params.append(str(year))
        
    query += build_where_clause(conditions)
    query += " GROUP BY Crime_Category ORDER BY Total_Cases DESC LIMIT 1"
    return query, tuple(params)

def show_statistics(category: str = None, month: str = None, year: str = None) -> Tuple[str, tuple]:
    """Builds SQL to show subcategory breakdown for a specific category."""
    query = "SELECT Subcategory, SUM(Cases) as Cases FROM CrimeStatistics"
    conditions = []
    params = []
    
    if category:
        conditions.append("Crime_Category = ?")
        params.append(category)
    if month:
        conditions.append("Month = ?")
        params.append(month)
    if year:
        conditions.append("Year = ?")
        params.append(str(year))
        
    query += build_where_clause(conditions)
    query += " GROUP BY Subcategory ORDER BY Cases DESC"
    return query, tuple(params)

def process_intent(intent: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes the structured JSON intent, builds the appropriate parameterized SQL,
    executes it via database.py, and returns the query, params, and result rows.
    """
    operation = intent.get("operation")
    category = intent.get("crime_category")
    month = intent.get("month")
    year = intent.get("year")
    year1 = intent.get("year1")
    year2 = intent.get("year2")
    
    sql = ""
    params = ()
    
    if operation == "count":
        sql, params = get_crime_count(category, month, year)
    elif operation == "compare_years":
        sql, params = compare_years(category, month, year1, year2)
    elif operation == "list_categories":
        sql, params = list_categories(month, year)
    elif operation == "highest_crime":
        sql, params = highest_crime(year)
    elif operation == "show_statistics":
        sql, params = show_statistics(category, month, year)
    else:
        # Fallback for unknown intent so it doesn't crash the server
        return {
            "sql": None,
            "parameters": (),
            "rows": [],
            "fallback_message": "I couldn't understand your query. Try asking about specific crime types, months, or years."
        }
        
    logger.info(f"Generated SQL: {sql} | Params: {params}")
    
    # Execute query safely using parameterized inputs
    rows = execute_query(sql, params)
    
    return {
        "sql": sql,
        "parameters": params,
        "rows": [dict(row) for row in rows]
    }
