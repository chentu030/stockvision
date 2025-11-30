import json
import os

filepath = 'public/data/stock_info.json'
print(f"Checking {filepath}...")

if not os.path.exists(filepath):
    print("File not found!")
else:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"Loaded {len(data)} records.")
            if len(data) > 0:
                print("Keys:", list(data[0].keys()))
                print("Sample:", data[0])
    except Exception as e:
        print(f"Error: {e}")
