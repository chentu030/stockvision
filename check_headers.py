import pandas as pd

try:
    df = pd.read_csv('public/data/brokers.csv', encoding='utf-8-sig')
    for i, col in enumerate(df.columns):
        print(f"{i}: {col}")
except Exception as e:
    print(f"Error: {e}")
