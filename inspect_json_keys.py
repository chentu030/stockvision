import json
import sys

def inspect_json(filepath):
    print(f"--- Inspecting {filepath} ---")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list) and len(data) > 0:
                print("Keys in first record:", list(data[0].keys()))
                print("First record sample:", {k: data[0][k] for k in list(data[0].keys())[:5]})
            else:
                print("Data is not a list or is empty.")
    except Exception as e:
        print(f"Error reading file: {e}")

inspect_json('public/data/raw_stats_3y.json')
inspect_json('public/data/stock_info.json')
