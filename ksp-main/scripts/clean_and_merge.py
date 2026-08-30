import os
import logging
from pathlib import Path
import pandas as pd
from typing import Tuple, Optional, List
import sys

# Add current script directory to path so we can import validation module
sys.path.append(str(Path(__file__).parent))
try:
    from validate_dataset import perform_validation_checks
    VALIDATION_AVAILABLE = True
except ImportError:
    VALIDATION_AVAILABLE = False

def setup_logger(log_file: Path) -> logging.Logger:
    """
    Sets up a logger for the clean and merge process to record skipped files and errors.
    """
    logger = logging.getLogger("CleanMerge")
    logger.setLevel(logging.INFO)
    
    # Clear existing handlers
    if logger.hasHandlers():
        logger.handlers.clear()
        
    handler = logging.FileHandler(log_file, mode='w', encoding='utf-8')
    formatter = logging.Formatter('%(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger

def detect_table_category(subcategories: List[str]) -> str:
    """
    Automatically detects the Crime Category based on the subcategory column names.
    Applies logic by checking for known keywords.
    """
    cols_str = " ".join(subcategories).lower()
    
    if 'murder' in cols_str: return 'Murder'
    if 'dacoity' in cols_str: return 'Dacoity'
    if 'chain' in cols_str or 'robbery' in cols_str: return 'Robbery'
    if 'burglary' in cols_str: return 'Burglary'
    if 'motor vehicle' in cols_str or 'm.v.' in cols_str: return 'Motor Vehicles Theft'
    if 'theft' in cols_str: return 'Theft'
    if 'riot' in cols_str: return 'Riots'
    if 'hurt' in cols_str: return 'Hurt'
    if 'rape' in cols_str or 'dowry' in cols_str or 'women' in cols_str: return 'Crime against Women'
    if 'pocso' in cols_str: return 'POCSO'
    if 'sc/st' in cols_str or 'sc & st' in cols_str: return 'SC/ST POA Act'
    if 'cyber' in cols_str: return 'Cyber Crimes'
    if 'economic' in cols_str: return 'Economic Offences'
    if 'mmdr' in cols_str or 'kmmc' in cols_str: return 'MMDR & KMMCR'
    if 'ndps' in cols_str: return 'NDPS Cases'
    if 'special' in cols_str or 'local laws' in cols_str or 'sll' in cols_str: return 'Special & Local Laws'
    if 'security' in cols_str: return 'Security Cases'
    
    # Some tables just have "Reported" for Theft
    if 'reported' in cols_str and len(subcategories) == 1: return 'Theft'
    
    return 'Other Crimes'

def clean_dataframe_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies the required cleaning rules:
    - Removes blank rows
    - Trims whitespace
    - Converts Cases to integers
    """
    # Remove rows where Cases is entirely missing or blank string
    df = df.dropna(subset=['Cases'])
    df = df[df['Cases'].astype(str).str.strip() != '']
    
    # Trim whitespace for all string columns
    df['Month'] = df['Month'].astype(str).str.strip()
    df['Year'] = df['Year'].astype(str).str.strip()
    df['Subcategory'] = df['Subcategory'].astype(str).str.strip()
    
    # Clean up empty placeholder strings that appear after stripping or from np.nan
    df = df[~df['Month'].str.lower().isin(['nan', 'none', ''])]
    df = df[~df['Year'].str.lower().isin(['nan', 'none', ''])]
    
    # Convert numeric values to integers
    # First, handle potential thousands separators (e.g., '1,742' -> '1742')
    df['Cases'] = df['Cases'].astype(str).str.replace(',', '')
    
    # Convert to numeric; non-parsable will become NaN
    df['Cases'] = pd.to_numeric(df['Cases'], errors='coerce')
    
    # Drop rows where Cases is NaN after parsing (e.g., textual errors)
    df = df.dropna(subset=['Cases'])
    
    # Finally, convert to integer as required
    df['Cases'] = df['Cases'].astype(int)
    
    return df

def process_csv(csv_path: Path) -> Tuple[Optional[pd.DataFrame], str]:
    """
    Reads a single CSV, skips if invalid, normalizes into the unified schema,
    and returns the processed dataframe with original source metadata.
    """
    try:
        # Ignore completely empty files
        if csv_path.stat().st_size == 0:
            return None, "Empty file"
            
        # Read the CSV assuming the first row contains headers
        df = pd.read_csv(csv_path)
        
        if df.empty:
            return None, "Empty dataframe"
            
        # Check if it has 'Month' and 'Year' to identify it as a valid crime table
        cols_lower = [str(c).strip().lower() for c in df.columns]
        if 'month' not in cols_lower or 'year' not in cols_lower:
            return None, "Not a crime table (Missing Month/Year)"
            
        # Standardize 'Month' and 'Year' column names exactly, and clean others
        col_map = {}
        for c in df.columns:
            cl = str(c).strip().lower()
            if cl == 'month':
                col_map[c] = 'Month'
            elif cl == 'year':
                col_map[c] = 'Year'
            else:
                col_map[c] = str(c).strip().replace('\n', ' ')
        
        df = df.rename(columns=col_map)
        
        # Identify subcategories (all columns except Month and Year)
        subcategories = [c for c in df.columns if c not in ['Month', 'Year'] and not str(c).startswith('Unnamed:')]
        if not subcategories:
            return None, "No subcategory columns found"
            
        # Automatically detect the Crime_Category for this table
        crime_category = detect_table_category(subcategories)
        
        # Melt the dataframe into the normalized format
        df_melted = pd.melt(
            df, 
            id_vars=['Month', 'Year'], 
            value_vars=subcategories, 
            var_name='Subcategory', 
            value_name='Cases'
        )
        
        # Extract precise metadata from the filename (e.g. crime_1_page_04_table_01.csv)
        try:
            parts = csv_path.stem.split('_page_')
            source_file = parts[0] + ".pdf"
            page_table = parts[1].split('_table_')
            page_number = int(page_table[0])
            table_number = int(page_table[1])
        except Exception:
            source_file = csv_path.name
            page_number = -1
            table_number = -1
            
        # Add the detected Crime_Category and Source Metadata
        df_melted['Crime_Category'] = crime_category
        df_melted['Source_File'] = source_file
        df_melted['Page_Number'] = page_number
        df_melted['Table_Number'] = table_number
        
        # Clean the dataframe values as requested
        df_clean = clean_dataframe_values(df_melted)
        
        if df_clean.empty:
            return None, "All data dropped during cleaning (likely invalid rows)"
            
        # Ensure exact column order with metadata
        df_clean = df_clean[['Month', 'Year', 'Crime_Category', 'Subcategory', 'Cases', 'Source_File', 'Page_Number', 'Table_Number']]
        
        return df_clean, "Success"
        
    except pd.errors.EmptyDataError:
        return None, "Empty CSV data"
    except Exception as e:
        return None, f"Error: {str(e)}"

def main():
    """
    Main execution pipeline for Phase 2:
    - Scans output/csv/
    - Normalizes data and embeds metadata
    - Generates merged statistics dataset
    - Performs intelligent deduplication
    - Produces deduplication audit report
    - Automatically executes validation
    """
    project_dir = Path(__file__).resolve().parent.parent
    input_csv_dir = project_dir / "output" / "csv"
    output_final_dir = project_dir / "output" / "final"
    
    output_final_dir.mkdir(parents=True, exist_ok=True)
    
    log_file_path = project_dir / "output" / "merge_log.txt"
    logger = setup_logger(log_file_path)
    
    csv_files = list(input_csv_dir.glob("*.csv"))
    if not csv_files:
        print(f"No CSV files found in {input_csv_dir}")
        return
        
    all_dataframes = []
    stats = {"processed": 0, "skipped": 0, "errors": 0, "rows_generated": 0}
    
    print("Starting clean and merge process...")
    
    for csv_file in sorted(csv_files):
        df, status = process_csv(csv_file)
        if df is not None:
            all_dataframes.append(df)
            stats["processed"] += 1
            stats["rows_generated"] += len(df)
        else:
            if status.startswith("Error"):
                stats["errors"] += 1
                logger.error(f"{csv_file.name}: {status}")
            else:
                stats["skipped"] += 1
                logger.info(f"{csv_file.name}: Skipped - {status}")

    # Process final combined dataset
    if all_dataframes:
        final_df = pd.concat(all_dataframes, ignore_index=True)
        final_csv_path = output_final_dir / "crime_statistics.csv"
        final_df.to_csv(final_csv_path, index=False)
        print(f"\nSuccessfully saved original merged dataset to: {final_csv_path}")
        
        # --- INTELLIGENT DEDUPLICATION & CONFLICT RESOLUTION ---
        print("\nStarting intelligent deduplication and conflict resolution process...")
        original_rows = len(final_df)
        
        # Sort chronologically and sequentially by source
        month_map = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12
        }
        
        # Extract numeric part of Source_File to determine the latest report (higher number = latest)
        final_df['Source_Num'] = final_df['Source_File'].str.extract(r'(\d+)').astype(float).fillna(0)
        
        # Temporary chronological ordering map
        final_df['Month_Num'] = final_df['Month'].astype(str).str.strip().str.lower().map(month_map).fillna(99)
        
        # Sort by Year, Month, and then Source_Num so the latest report comes LAST
        df_sorted = final_df.sort_values(by=['Year', 'Month_Num', 'Source_Num'])
        df_sorted = df_sorted.drop(columns=['Month_Num', 'Source_Num'])
        
        # Detect conflicts based on these 4 columns
        subset_cols = ['Month', 'Year', 'Crime_Category', 'Subcategory']
        
        # Generate conflict resolution report
        df_dups = df_sorted[df_sorted.duplicated(subset=subset_cols, keep=False)]
        report_data = []
        conflicts_found = 0
        conflicts_resolved = 0
        
        if not df_dups.empty:
            for name, group in df_dups.groupby(subset_cols, sort=False):
                # Check if case counts actually differ (a conflict)
                if group['Cases'].nunique() > 1:
                    conflicts_found += 1
                    
                    # Since it's sorted by Source_Num, the last one is the latest report
                    latest_record = group.iloc[-1]
                    kept = latest_record['Source_File']
                    new_cases = latest_record['Cases']
                    
                    # Removed records are all except the last
                    removed_records = group.iloc[:-1]
                    removed = " | ".join(removed_records['Source_File'].unique().tolist())
                    old_cases_str = " | ".join(removed_records['Cases'].astype(str).unique().tolist())
                    
                    row = dict(zip(subset_cols, name))
                    row['Old_Cases'] = old_cases_str
                    row['New_Cases'] = new_cases
                    row['Kept_Source_File'] = kept
                    row['Removed_Source_File'] = removed
                    row['Resolution_Reason'] = "Updated in latest report"
                    report_data.append(row)
                    
                    conflicts_resolved += 1
                
        report_df = pd.DataFrame(report_data)
        report_csv_path = output_final_dir / "conflict_resolution_report.csv"
        report_df.to_csv(report_csv_path, index=False)
        
        # Perform duplicate removal, keeping the LAST occurrence (latest report)
        df_dedup = df_sorted.drop_duplicates(subset=subset_cols, keep='last')
        
        final_rows = len(df_dedup)
        duplicates_removed = original_rows - final_rows
        
        # Save finalized clean dataset
        dedup_csv_path = output_final_dir / "crime_statistics_final.csv"
        df_dedup.to_csv(dedup_csv_path, index=False)
        
        print("\n--- Conflict Resolution Summary ---")
        print(f"Conflicts found:           {conflicts_found}")
        print(f"Conflicts resolved:        {conflicts_resolved}")
        print(f"Final rows:                {final_rows}")
        
        # Automated Validation
        if VALIDATION_AVAILABLE:
            print("\nRunning automated validation on deduplicated dataset...")
            results = perform_validation_checks(df_dedup)
            print(f"Validation status: {results['status']}")
            
            if results['status'] == 'PASS':
                print("\nDataset ready for Catalyst Data Store.")
        else:
            print("\nValidation module not found. Skipping automated validation.")
            
    else:
        print("\nNo valid dataframes were produced to merge.")

if __name__ == "__main__":
    main()
