import logging
import os
from pathlib import Path
from typing import List, Any, Iterator, Tuple, Optional

import pandas as pd
import pdfplumber

def extract_tables_from_pdf(pdf_path: Path, logger: logging.Logger) -> Iterator[Tuple[int, List[List[List[Optional[str]]]]]]:
    """
    Generator that opens a PDF, iterates through its pages, 
    and yields the page number and its extracted tables.
    Handles page-level exceptions and logging.
    """
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_idx, page in enumerate(pdf.pages):
                page_num = page_idx + 1
                try:
                    tables = page.extract_tables()
                    yield page_num, tables
                except Exception as e:
                    error_msg = f"Failed to extract tables from {pdf_path.name}, Page {page_num}: {e}"
                    logger.error(f"PDF name: {pdf_path.name} | Page number: {page_num} | Tables extracted: 0 | Failure | Error message: {e}")
                    print(f"Error: {error_msg}")
                    # Continue processing other pages by yielding an empty list of tables
                    yield page_num, []
    except Exception as e:
        error_msg = f"Failed to open PDF {pdf_path.name}: {e}"
        logger.error(f"PDF name: {pdf_path.name} | Page number: N/A | Tables extracted: 0 | Failure | Error message: {e}")
        print(f"Error: {error_msg}")


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans the extracted DataFrame by:
    - Removing completely empty rows
    - Removing completely empty columns
    - Resetting the index
    Preserves all remaining values exactly as extracted.
    """
    # Remove completely empty rows
    df = df.dropna(how='all')
    
    # Remove completely empty columns
    df = df.dropna(axis=1, how='all')
    
    # Reset index and drop the old index
    df = df.reset_index(drop=True)
    
    return df


def save_dataframe(df: pd.DataFrame, output_path: Path) -> None:
    """
    Saves a cleaned pandas DataFrame to a CSV file.
    Does not include headers or index to preserve exact data structure.
    """
    # Note: Using header=False because pdfplumber doesn't distinguish headers 
    # and we want to preserve exactly what was extracted.
    df.to_csv(output_path, index=False, header=False)


def process_pdf(pdf_path: Path, output_csv_dir: Path, logger: logging.Logger) -> None:
    """
    Processes a single PDF file:
    - Iterates pages and extracts tables
    - Cleans the tables
    - Saves the cleaned tables as individual CSV files
    """
    # Create base name replacing spaces with underscores (e.g. "crime 1" -> "crime_1")
    base_name = pdf_path.stem.replace(" ", "_")
    
    print("-" * 48)
    print(f"Processing: {pdf_path.name}")
    
    # Iterate through each page's tables
    for page_num, tables in extract_tables_from_pdf(pdf_path, logger):
        if not tables:
            continue
            
        print(f"Page {page_num} -> {len(tables)} tables extracted")
        logger.info(f"PDF name: {pdf_path.name} | Page number: {page_num} | Tables extracted: {len(tables)} | Success | Error message: None")
        
        for table_idx, table in enumerate(tables):
            table_num = table_idx + 1
            
            # Convert extracted list of lists into a DataFrame
            df = pd.DataFrame(table)
            
            # Clean the DataFrame based on requirements
            df = clean_dataframe(df)
            
            # Skip if DataFrame is completely empty after cleaning
            if df.empty:
                continue
                
            # Construct CSV filename
            csv_filename = f"{base_name}_page_{page_num:02d}_table_{table_num:02d}.csv"
            csv_path = output_csv_dir / csv_filename
            
            # Save the clean table to CSV
            save_dataframe(df, csv_path)
            print(f"Saved: {csv_filename}")


def process_all_pdfs(dataset_dir: Path, output_csv_dir: Path, logger: logging.Logger) -> None:
    """
    Scans the dataset directory for PDFs and processes each one sequentially.
    """
    pdf_files = list(dataset_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"No PDFs found in {dataset_dir}")
        return
        
    for pdf_path in sorted(pdf_files):
        process_pdf(pdf_path, output_csv_dir, logger)
        

def setup_logger(log_file: Path) -> logging.Logger:
    """
    Configures and returns a custom logger that writes to a text file.
    """
    logger = logging.getLogger("PDFExtractor")
    logger.setLevel(logging.INFO)
    
    # Clear existing handlers if any
    if logger.hasHandlers():
        logger.handlers.clear()
        
    handler = logging.FileHandler(log_file, mode='w', encoding='utf-8')
    formatter = logging.Formatter('%(asctime)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger


def main() -> None:
    """
    Main execution pipeline:
    - Sets up necessary directories
    - Initializes logging
    - Begins the batch processing of all PDFs
    """
    # Define primary directories using pathlib (relative to this script's location)
    # The script is assumed to be in DATATHON/scripts/
    project_dir = Path(__file__).resolve().parent.parent
    dataset_dir = project_dir / "datathon_dataset"
    output_dir = project_dir / "output"
    output_csv_dir = output_dir / "csv"
    
    # Create the output directories if they do not exist
    output_csv_dir.mkdir(parents=True, exist_ok=True)
    
    # Setup log file
    log_file_path = output_dir / "extraction_log.txt"
    logger = setup_logger(log_file_path)
    
    print("Starting Table Extraction Pipeline...")
    print(f"Dataset directory: {dataset_dir}")
    print(f"Output directory: {output_csv_dir}")
    print(f"Log file: {log_file_path}")
    
    # Run the pipeline
    process_all_pdfs(dataset_dir, output_csv_dir, logger)
    
    print("-" * 48)
    print("Extraction pipeline completed.")


if __name__ == "__main__":
    main()
