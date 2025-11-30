import pandas as pd

try:
    df = pd.read_csv('public/data/brokers.csv', encoding='utf-8-sig')
    print("Columns:")
    print(df.columns.tolist())
    
    print("\nFirst Row Data:")
    first_row = df.iloc[0]
    for i, (col, val) in enumerate(first_row.items()):
        print(f"{i} [{col}]: {val}")
        
except Exception as e:
    print(f"Error: {e}")
