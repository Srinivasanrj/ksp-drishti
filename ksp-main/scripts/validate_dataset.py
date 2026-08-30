import pandas as pd
from pathlib import Path
import datetime
from typing import Dict, Any

def perform_validation_checks(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Executes all required data validation checks against the dataset.
    Returns a dictionary mapping check names to results.
    """
    results = {}
    
    # Core Counts
    results['total_rows'] = len(df)
    
    # 1. Check for duplicate rows
    results['duplicate_rows'] = int(df.duplicated().sum())
    
    # Fill NA string representations for robustness in missing checks
    df['Month'] = df['Month'].astype(str).replace(['nan', 'None'], '')
    df['Year'] = df['Year'].astype(str).replace(['nan', 'None'], '')
    df['Crime_Category'] = df['Crime_Category'].astype(str).replace(['nan', 'None'], '')
    df['Subcategory'] = df['Subcategory'].astype(str).replace(['nan', 'None'], '')
    
    # 2-6. Check for missing values
    results['missing_month'] = int((df['Month'].str.strip() == '').sum())
    results['missing_year'] = int((df['Year'].str.strip() == '').sum())
    results['missing_category'] = int((df['Crime_Category'].str.strip() == '').sum())
    results['missing_subcategory'] = int((df['Subcategory'].str.strip() == '').sum())
    results['missing_cases'] = int(df['Cases'].isna().sum())
    
    results['total_missing'] = (
        results['missing_month'] + 
        results['missing_year'] + 
        results['missing_category'] + 
        results['missing_subcategory'] + 
        results['missing_cases']
    )
    
    # 7. Verify Cases are integers
    results['cases_are_integers'] = pd.api.types.is_integer_dtype(df['Cases'])
    
    # 8. Detect negative case counts
    if results['cases_are_integers']:
        results['negative_cases'] = int((df['Cases'] < 0).sum())
    else:
        results['negative_cases'] = "N/A (Cases not integers)"
        
    # 9. Detect impossible years
    try:
        years = pd.to_numeric(df['Year'], errors='coerce')
        current_year = datetime.datetime.now().year
        impossible_years = ((years < 1900) | (years > current_year + 5)).sum()
        results['impossible_years'] = int(impossible_years)
    except Exception:
        results['impossible_years'] = "Error parsing years"
        
    # 10. List all unique Crime Categories
    results['unique_categories'] = sorted(df['Crime_Category'].unique().tolist())
    
    # 11. Count rows per Crime Category
    results['counts_per_category'] = df['Crime_Category'].value_counts().to_dict()
    
    # 12. Count rows per Year
    results['counts_per_year'] = df['Year'].value_counts().to_dict()
    
    # 13. Count rows per Month
    results['counts_per_month'] = df['Month'].value_counts().to_dict()
    
    # Determine PASS/FAIL Status
    passed = True
    if results['duplicate_rows'] > 0: passed = False
    if results['total_missing'] > 0: passed = False
    if not results['cases_are_integers']: passed = False
    if results['negative_cases'] != 0: passed = False
    if results['impossible_years'] != 0: passed = False
    
    results['status'] = "PASS" if passed else "FAIL"
    
    return results

def generate_report_text(results: Dict[str, Any]) -> str:
    """
    Formats the validation results dictionary into a readable report string.
    """
    lines = [
        "========================================",
        "      DATASET VALIDATION REPORT         ",
        "========================================",
        f"Total Rows: {results['total_rows']}",
        f"Duplicate Rows: {results['duplicate_rows']}",
        "",
        "--- Missing Values ---",
        f"Month: {results['missing_month']}",
        f"Year: {results['missing_year']}",
        f"Crime Category: {results['missing_category']}",
        f"Subcategory: {results['missing_subcategory']}",
        f"Cases: {results['missing_cases']}",
        "",
        "--- Data Integrity ---",
        f"Cases are Integers: {results['cases_are_integers']}",
        f"Negative Case Counts: {results['negative_cases']}",
        f"Impossible Years: {results['impossible_years']}",
        "",
        "--- Categorical Summaries ---",
        f"Unique Crime Categories ({len(results['unique_categories'])}):"
    ]
    
    for cat in results['unique_categories']:
        lines.append(f"  - {cat}")
        
    lines.append("\nRows per Crime Category:")
    for cat, count in sorted(results['counts_per_category'].items(), key=lambda x: x[1], reverse=True):
        lines.append(f"  {cat}: {count}")
        
    lines.append("\nRows per Year:")
    for yr, count in sorted(results['counts_per_year'].items()):
        lines.append(f"  {yr}: {count}")
        
    lines.append("\nRows per Month:")
    for mth, count in sorted(results['counts_per_month'].items()):
        lines.append(f"  {mth}: {count}")
        
    lines.append("\n========================================")
    lines.append(f"FINAL STATUS: {results['status']}")
    lines.append("========================================")
    
    return "\n".join(lines)

def print_summary(results: Dict[str, Any]) -> None:
    """
    Prints a short summary of the validation checks to the console.
    """
    print("\n--- Validation Summary ---")
    print(f"Total rows:      {results['total_rows']}")
    print(f"Duplicate rows:  {results['duplicate_rows']}")
    print(f"Missing values:  {results['total_missing']}")
    print(f"Status:          {results['status']}")
    print("--------------------------\n")
    
    if results['status'] == "PASS":
        print("Dataset ready for Catalyst Data Store.")

def main():
    project_dir = Path(__file__).resolve().parent.parent
    input_file = project_dir / "output" / "final" / "crime_statistics.csv"
    report_file = project_dir / "output" / "final" / "validation_report.txt"
    
    if not input_file.exists():
        print(f"Error: Dataset not found at {input_file}")
        return
        
    print(f"Loading dataset: {input_file.name}...")
    df = pd.read_csv(input_file)
    
    print("Running validation checks...")
    results = perform_validation_checks(df)
    
    report_text = generate_report_text(results)
    
    # Save validation report
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report_text)
        
    print(f"Validation report saved to: {report_file}")
    
    # Print summary & status
    print_summary(results)

if __name__ == "__main__":
    main()
