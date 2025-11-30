with open('public/data/brokers.csv', 'r', encoding='utf-8-sig') as f:
    print("--- Line 1 (Header) ---")
    print(f.readline())
    print("--- Line 2 (Data) ---")
    print(f.readline())
