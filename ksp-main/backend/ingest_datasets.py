import os
import sqlite3
import pandas as pd
import logging
from pathlib import Path

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

BASE_DIR = Path(__file__).parent
PROJECT_DIR = BASE_DIR.parent
DATASET_DIR = PROJECT_DIR / "datathon_dataset"
DB_PATH = BASE_DIR / "crime.db"

def clean_cols(df):
    cols = []
    seen = {}
    for c in df.columns:
        clean = str(c).strip().replace('/', '_').replace(' ', '_').replace('-', '_').replace('.', '_').upper()
        if clean in seen:
            seen[clean] += 1
            clean = f"{clean}_{seen[clean]}"
        else:
            seen[clean] = 0
        cols.append(clean)
    df.columns = cols
    return df

def ingest_all():
    """
    Ingests all 10 real CSV files from datathon_dataset/ into structured SQLite tables
    and initializes FTS5 virtual tables for lexical hybrid search.
    """
    if not DB_PATH.exists():
        logger.error(f"Database path {DB_PATH} does not exist.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    logger.info("=== Starting Data Ingestion Pipeline for Datathon Datasets ===")

    # --------------------------------------------------------------------------
    # 1. KA_DistrictDetailedCrimes (2024 & 2025 District Crime Head Counts)
    # --------------------------------------------------------------------------
    file_2024_district = DATASET_DIR / "2024_data" / "2a1e057f-3b0b-42e4-ae4b-6cdb49902d31.csv"
    if file_2024_district.exists():
        df_2024 = pd.read_csv(file_2024_district)
        df_2024 = clean_cols(df_2024)
        df_2024['YEAR'] = 2024
        df_2024.to_sql("KA_DistrictDetailedCrimes", conn, if_exists="replace", index=False)
        logger.info(f"Ingested KA_DistrictDetailedCrimes (2024): {len(df_2024)} rows")

    # --------------------------------------------------------------------------
    # 2. KA_DistrictCrimes (2025 District Totals)
    # --------------------------------------------------------------------------
    file_2025_district = DATASET_DIR / "2025_data" / "ka-district-wise-2025.csv"
    if file_2025_district.exists():
        df_2025_dist = pd.read_csv(file_2025_district)
        df_2025_dist = clean_cols(df_2025_dist)
        df_2025_dist['YEAR'] = 2025
        df_2025_dist.to_sql("KA_DistrictCrimes", conn, if_exists="replace", index=False)
        logger.info(f"Ingested KA_DistrictCrimes (2025): {len(df_2025_dist)} rows")

    # --------------------------------------------------------------------------
    # 3. KA_CrimeReview (Granular State IPC Breakdown for 2025 & 2024)
    # --------------------------------------------------------------------------
    file_2025_review = DATASET_DIR / "2025_data" / "crime_review_for_the_month_of_december_2025_9.csv"
    file_2024_review = DATASET_DIR / "2024_data" / "f3dc65a9-63ae-49fd-82c4-873048e9fa7c.csv"

    review_dfs = []
    if file_2025_review.exists():
        df_rev_25 = pd.read_csv(file_2025_review)
        df_rev_25['YEAR'] = 2025
        review_dfs.append(df_rev_25)

    if file_2024_review.exists():
        df_rev_24 = pd.read_csv(file_2024_review)
        df_rev_24['YEAR'] = 2024
        review_dfs.append(df_rev_24)

    if review_dfs:
        df_review = pd.concat(review_dfs, ignore_index=True)
        df_review = clean_cols(df_review)
        df_review.to_sql("KA_CrimeReview", conn, if_exists="replace", index=False)
        logger.info(f"Ingested KA_CrimeReview: {len(df_review)} rows")

    # --------------------------------------------------------------------------
    # 4. India_CrimeIncidents (40K All-India Incident Records)
    # --------------------------------------------------------------------------
    file_india = DATASET_DIR / "Indian_crimes_data_cities" / "crime_dataset_india.csv"
    if file_india.exists():
        df_india = pd.read_csv(file_india)
        df_india = clean_cols(df_india)
        df_india.to_sql("India_CrimeIncidents", conn, if_exists="replace", index=False)
        logger.info(f"Ingested India_CrimeIncidents: {len(df_india)} rows")

    # --------------------------------------------------------------------------
    # 5. CyberCrimeByCity (Cyber Motives)
    # --------------------------------------------------------------------------
    file_cyber = DATASET_DIR / "cyber_crime_data" / "Dataset_CyberCrime_Sean.csv"
    if file_cyber.exists():
        df_cyber = pd.read_csv(file_cyber)
        df_cyber = clean_cols(df_cyber)
        df_cyber.to_sql("CyberCrimeByCity", conn, if_exists="replace", index=False)
        logger.info(f"Ingested CyberCrimeByCity: {len(df_cyber)} rows")

    # --------------------------------------------------------------------------
    # 6. KA_WomenChildCrimes (2025 Crimes Against Women / Children)
    # --------------------------------------------------------------------------
    file_women = DATASET_DIR / "2025_data" / "ka-crimes-women-children-scssts.csv"
    if file_women.exists():
        df_women = pd.read_csv(file_women)
        df_women = clean_cols(df_women)
        df_women['YEAR'] = 2025
        df_women.to_sql("KA_WomenChildCrimes", conn, if_exists="replace", index=False)
        logger.info(f"Ingested KA_WomenChildCrimes: {len(df_women)} rows")

    # --------------------------------------------------------------------------
    # 7. Audit Log Table
    # --------------------------------------------------------------------------
    cur.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            user_id TEXT DEFAULT 'officer',
            query_text TEXT,
            agent_type TEXT,
            sql_generated TEXT,
            response_ms INTEGER
        );
    """)
    logger.info("Initialized audit_log table.")

    # --------------------------------------------------------------------------
    # 8. FTS5 Lexical Search Table on FIR_Records
    # --------------------------------------------------------------------------
    cur.execute("DROP TABLE IF EXISTS FIR_Records_FTS;")
    cur.execute("""
        CREATE VIRTUAL TABLE FIR_Records_FTS USING fts5(
            FIR_Number,
            District,
            Police_Station,
            Crime_Head,
            Status,
            content='FIR_Records',
            content_rowid='rowid'
        );
    """)
    cur.execute("""
        INSERT INTO FIR_Records_FTS(rowid, FIR_Number, District, Police_Station, Crime_Head, Status)
        SELECT rowid, FIR_Number, District, Police_Station, Crime_Head, Status FROM FIR_Records;
    """)
    logger.info("Initialized FIR_Records_FTS5 Virtual Search Table.")

    conn.commit()
    conn.close()
    logger.info("=== Data Ingestion Completed Successfully ===")

if __name__ == "__main__":
    ingest_all()
