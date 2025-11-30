import csv

try:
    with open('public/data/brokers.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        headers = next(reader)
        print("Headers:")
        for i, h in enumerate(headers):
            print(f"{i}: {h}")
        
        print("\nFirst Data Row:")
        row = next(reader)
        for i, val in enumerate(row):
            print(f"{i}: {val}")
            
except Exception as e:
    print(f"Error: {e}")
