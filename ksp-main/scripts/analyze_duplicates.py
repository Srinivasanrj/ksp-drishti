import pandas as pd
from pathlib import Path

def main():
    project_dir = Path(__file__).resolve().parent.parent
    input_file = project_dir / "output" / "final" / "crime_statistics.csv"
    output_file = project_dir / "output" / "final" / "duplicate_analysis.csv"
    
    if not input_file.exists():
        print(f"Error: Dataset not found at {input_file}")
        return
        
    df = pd.read_csv(input_file)
    total_rows = len(df)
    
    # Columns that define a unique row data-wise
    group_cols = ['Month', 'Year', 'Crime_Category', 'Subcategory', 'Cases']
    
    # Check if Source_File is available
    has_source = 'Source_File' in df.columns
    
    if has_source:
        # Group by data columns, get size and unique source files
        grouped = df.groupby(group_cols).agg(
            Duplicate_Count=('Cases', 'size'),
            Source_Files=('Source_File', lambda x: " | ".join(sorted(x.unique())))
        ).reset_index()
    else:
        grouped = df.groupby(group_cols).size().reset_index(name='Duplicate_Count')
        
    unique_rows = len(grouped)
    
    # Filter to only keep duplicates
    duplicates = grouped[grouped['Duplicate_Count'] > 1].copy()
    
    # Sort descending by count
    duplicates = duplicates.sort_values(by='Duplicate_Count', ascending=False)
    
    # Save the output CSV
    duplicates.to_csv(output_file, index=False)
    
    duplicate_groups = len(duplicates)
    max_duplicate_count = duplicates['Duplicate_Count'].max() if not duplicates.empty else 0
    
    print("\n=== Duplicate Analysis Summary ===")
    print(f"Total rows:           {total_rows}")
    print(f"Unique rows:          {unique_rows}")
    print(f"Duplicate groups:     {duplicate_groups}")
    print(f"Max duplicate count:  {max_duplicate_count}")
    
    if has_source:
        print("\nNote: Source metadata (Source_File) was successfully utilized.")
    else:
        print("\nNote: Source metadata not found.")
        
    print("\n--- Top 20 Most Frequent Duplicates ---")
    if duplicates.empty:
        print("No duplicates found.")
    else:
        top_20 = duplicates.head(20)
        for _, row in top_20.iterrows():
            print(f"[{row['Duplicate_Count']}x] {row['Month']} {row['Year']} | {row['Crime_Category']} - {row['Subcategory']}: {row['Cases']}")
            if has_source:
                print(f"      Sources: {row['Source_Files']}")
                
    print(f"\nDetailed analysis saved to: {output_file}")

if __name__ == "__main__":
    main()
