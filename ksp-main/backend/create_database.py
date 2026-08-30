import pandas as pd
from pathlib import Path
import logging
import sys

# Ensure backend directory is in path to import database functions
sys.path.append(str(Path(__file__).parent))
from database import connect_database, close_database

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def create_database():
    """
    Reads the deduplicated dataset and imports it into the local SQLite database.
    Replaces the CrimeStatistics table if it already exists.
    """
    project_dir = Path(__file__).resolve().parent.parent
    # Use the final clean dataset without metadata columns
    csv_path = project_dir / "output" / "final" / "crime_statistics_final.csv"
    db_path = Path(__file__).parent / "crime.db"
    
    if not csv_path.exists():
        logging.error(f"CSV file not found: {csv_path}")
        return
        
    conn = None
    try:
        logging.info(f"Loading data from {csv_path.name}...")
        df = pd.read_csv(csv_path)
        
        logging.info(f"Connecting to database at {db_path.name}...")
        conn = connect_database(db_path)
        
        # Use pandas to push the dataframe into SQLite
        # Using if_exists="replace" handles creating the schema and replacing old tables
        df.to_sql("CrimeStatistics", conn, if_exists="replace", index=False)
        
        row_count = len(df)
        print("Database created successfully.")
        print(f"Number of rows imported: {row_count}")
        
    except Exception as e:
        logging.error(f"Error creating database: {e}")
    finally:
        if conn:
            close_database(conn)

if __name__ == "__main__":
    create_database()
