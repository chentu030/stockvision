import pandas as pd
import json
import os
import glob

# Define paths
base_dir = r"c:\Users\User\Desktop\台股資料庫\網站設計\原始檔案\資料庫1(歷史月、季漲跌機率、幅度統計)"
output_dir = r"c:\Users\User\Desktop\台股資料庫\網站設計\stock-vision\public\data"

# Ensure output directory exists
os.makedirs(output_dir, exist_ok=True)

def process_rankings(file_path, output_path):
    print(f"Processing rankings from {file_path}...")
    try:
        xl = pd.ExcelFile(file_path)
        rankings = {}
        
        # Define markers for different tables
        markers = {
            "stocks": "[個股排名 (Top 30)]",
            "industries": "[產業排名 (Top 10)]",
            "sub_industries": "[細產業排名 (Top 10)]",
            "related_industries": "[相關產業排名 (Top 10)]",
            "related_groups": "[相關集團排名 (Top 10)]",
            "industry_types": "[產業別排名 (Top 10)]"
        }

        for sheet in xl.sheet_names:
            print(f"  Processing sheet: {sheet}")
            df = xl.parse(sheet, header=None)
            
            sheet_data = {key: [] for key in markers.keys()}
            current_section = None
            headers = None
            
            for i, row in df.iterrows():
                # Check if row contains a marker
                row_str = str(row[0]).strip() if pd.notna(row[0]) else ""
                
                found_marker = False
                for key, marker in markers.items():
                    if marker in row_str:
                        current_section = key
                        headers = None # Reset headers for new section
                        found_marker = True
                        break
                
                if found_marker:
                    continue

                if current_section:
                    # If we haven't found headers for this section yet, this row might be the header
                    if headers is None:
                        # Check if this row looks like a header (not empty)
                        # Usually the row immediately after marker is header
                        clean_row = [str(x).strip() for x in row if pd.notna(x)]
                        if clean_row:
                            headers = clean_row
                        continue
                    
                    # If we have headers, this is a data row
                    # Check if it's empty or looks like end of table
                    if pd.isna(row[0]) and pd.isna(row[1]):
                        continue
                        
                    # Map row data to headers
                    row_data = {}
                    has_data = False
                    for idx, header in enumerate(headers):
                        if idx < len(row):
                            val = row[idx]
                            if pd.notna(val):
                                row_data[header] = val
                                has_data = True
                            else:
                                row_data[header] = ""
                    
                    if has_data:
                        sheet_data[current_section].append(row_data)

            rankings[sheet] = sheet_data
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(rankings, f, ensure_ascii=False, indent=2)
        print(f"Saved rankings to {output_path}")
    except Exception as e:
        print(f"Error processing rankings {file_path}: {e}")

def process_raw_stats(file_path, output_path):
    print(f"Processing raw stats from {file_path}...")
    try:
        # Header is on row 0 based on raw inspection
        df = pd.read_csv(file_path, encoding='cp950', header=0)
        df.columns = [str(c).strip() for c in df.columns]
        
        # Identify Sub-industry columns (Index 51 is '細產業')
        if len(df.columns) > 51:
            sub_industry_cols = df.columns[51:]
            print(f"  Found {len(sub_industry_cols)} potential sub-industry columns starting from {sub_industry_cols[0]}")
            
            # Create a new column '細產業列表' by combining non-null values from these columns
            def get_sub_industries(row):
                industries = []
                for col in sub_industry_cols:
                    val = row[col]
                    if pd.notna(val) and str(val).strip() != "" and str(val).strip() != "0":
                        industries.append(str(val).strip())
                return industries

            df['細產業列表'] = df.apply(get_sub_industries, axis=1)
        else:
            df['細產業列表'] = []

        df = df.fillna(0)
        
        print(f"  Columns: {df.columns.tolist()[:5]}...")
        
        data = df.to_dict(orient='records')
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False) # Minify to save space
        print(f"Saved raw stats to {output_path}")
    except Exception as e:
        print(f"Error processing raw stats {file_path}: {e}")

def process_stock_info(files, output_path):
    print(f"Processing stock info from {files}...")
    try:
        all_info = []
        for file_path in files:
            if os.path.exists(file_path):
                try:
                    # Try to find header for stock list too, just in case
                    # Assuming header is on row 0 for these too based on standard CSV
                    df = pd.read_csv(file_path, encoding='cp950', header=0)
                except UnicodeDecodeError:
                    print(f"cp950 failed for {file_path}, trying utf-8...")
                    df = pd.read_csv(file_path, encoding='utf-8', header=0)
                
                # Rename '代號' to '代碼' if it exists
                if '代號' in df.columns:
                    df = df.rename(columns={'代號': '代碼'})
                
                df = df.fillna('')
                all_info.extend(df.to_dict(orient='records'))
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(all_info, f, ensure_ascii=False, indent=2)
        print(f"Saved stock info to {output_path}")
    except Exception as e:
        print(f"Error processing stock info: {e}")

# 1. Process Rankings
process_rankings(os.path.join(base_dir, "Stock_Analysis_Report_3Year.xlsx"), os.path.join(output_dir, "rankings_3y.json"))
process_rankings(os.path.join(base_dir, "Stock_Analysis_Report_5Year.xlsx"), os.path.join(output_dir, "rankings_5y.json"))

# 2. Process Raw Stats
process_raw_stats(os.path.join(base_dir, "漲跌幅統計(近3年).csv"), os.path.join(output_dir, "raw_stats_3y.json"))
process_raw_stats(os.path.join(base_dir, "漲跌幅統計(近5年).csv"), os.path.join(output_dir, "raw_stats_5y.json"))

# 3. Process Stock Info
stock_list_files = [
    os.path.join(base_dir, "StockList (1).csv"),
    os.path.join(base_dir, "StockList (2).csv"),
    os.path.join(base_dir, "StockList (3).csv")
]
process_stock_info(stock_list_files, os.path.join(output_dir, "stock_info.json"))

print("All processing done!")
