import pandas as pd

try:
    df = pd.read_csv('public/data/brokers.csv', encoding='utf-8-sig')
    print(f"Column 2 Name: {df.columns[2]}")
    print(f"Column 23 Name: {df.columns[23]}")
    
    print("\nFirst 5 Rows (Index 2 and 23):")
    for i in range(5):
        if i < len(df):
            row = df.iloc[i]
            print(f"Row {i}: Col 2={row.iloc[2]}, Col 23={row.iloc[23]}")

except Exception as e:
    print(f"Error: {e}")
