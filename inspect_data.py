import pandas as pd

try:
    # Read the CSV file without header to inspect raw data
    df = pd.read_csv('public/data/brokers.csv', header=None)
    
    # Filter for rows where the first column (Company) contains '2330'
    # Column 0 is Company
    target_rows = df[df[0].astype(str).str.contains('2330', na=False)]
    
    print(f"Found {len(target_rows)} rows for 2330")
    
    # Select relevant columns: 0 (Company), 1 (Date), 3 (Broker), 5 (Target Price)
    # Also print the raw value of column 5 to see if it's '-' or empty
    result = target_rows[[0, 1, 3, 5]]
    result.columns = ['Company', 'Date', 'Broker', 'TargetPrice']
    
    # Sort by Date (descending) to see latest
    result['Date'] = pd.to_datetime(result['Date'], errors='coerce')
    result = result.sort_values('Date', ascending=False)
    
    print(result.head(30).to_string())
    
    # Check specifically for the brokers mentioned: "凱基證券", "群益證券"
    problem_brokers = ["凱基證券", "群益證券", "宏遠證券", "永豐金證券", "康和證券"]
    print("\n--- Problem Brokers Latest Data ---")
    for broker in problem_brokers:
        broker_data = result[result['Broker'] == broker]
        if not broker_data.empty:
            print(f"\nBroker: {broker}")
            print(broker_data.head(5).to_string())
        else:
            print(f"\nBroker: {broker} - No data found")

except Exception as e:
    print(f"Error: {e}")
