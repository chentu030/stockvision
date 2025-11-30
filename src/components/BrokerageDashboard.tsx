import React, { useState, useEffect } from 'react';
import { Search, Calendar, BarChart2, List, Activity } from 'lucide-react';
import JSZip from 'jszip';
import Papa from 'papaparse';
import './BrokerageDashboard.scss';

interface BrokerageDashboardProps {
    basePath?: string;
}

interface BrokerSummary {
    broker: string;
    buyVol: number;
    sellVol: number;
    buyAmt: number;
    sellAmt: number;
    netVol: number;
    netAmt: number;
    avgBuyPrice: number;
    avgSellPrice: number;
}

const BrokerageDashboard: React.FC<BrokerageDashboardProps> = ({ basePath: _basePath = '' }) => {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [stockCode, setStockCode] = useState('');
    const [activeTab, setActiveTab] = useState<'charts' | 'scan' | 'query'>('charts');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');
    const [zipCache, setZipCache] = useState<Map<string, JSZip>>(new Map());

    useEffect(() => {
        // Fetch available dates
        fetch(`${import.meta.env.BASE_URL}data/chips/dates.json`)
            .then(res => res.json())
            .then(data => {
                setDates(data);
                if (data.length > 0) setSelectedDate(data[0]);
            })
            .catch(err => console.error("Failed to load dates", err));
    }, []);

    const parseDoubleColumnCSV = (csvText: string) => {
        // Parse CSV using PapaParse
        const results = Papa.parse(csvText, { header: false, skipEmptyLines: true });
        const rows = results.data as string[][];

        // The CSV has double columns: 
        // 序號,券商,價格,買進股數,賣出股數,,序號,券商,價格,買進股數,賣出股數
        // Header is usually on line 3 (index 2)

        let dataRows: any[] = [];

        // Find header row index
        let headerIndex = -1;
        for (let i = 0; i < Math.min(10, rows.length); i++) {
            if (rows[i][1] && rows[i][1].includes('券商')) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) return [];

        for (let i = headerIndex + 1; i < rows.length; i++) {
            const row = rows[i];

            // Left side (indices 0-4)
            if (row[1]) {
                dataRows.push({
                    broker: row[1].replace(/^\d+/, '').trim(),
                    price: parseFloat(row[2]) || 0,
                    buyVol: parseFloat(row[3]) || 0,
                    sellVol: parseFloat(row[4]) || 0
                });
            }

            // Right side (indices 6-10) - assuming empty col at 5
            if (row.length > 6 && row[7]) {
                dataRows.push({
                    broker: row[7].replace(/^\d+/, '').trim(),
                    price: parseFloat(row[8]) || 0,
                    buyVol: parseFloat(row[9]) || 0,
                    sellVol: parseFloat(row[10]) || 0
                });
            }
        }

        return dataRows;
    };

    const processStockData = (rawRows: any[]) => {
        // Calculate summary
        const brokerMap = new Map<string, BrokerSummary>();

        let totalBuyVol = 0;
        let totalSellVol = 0;

        rawRows.forEach(row => {
            if (!brokerMap.has(row.broker)) {
                brokerMap.set(row.broker, {
                    broker: row.broker,
                    buyVol: 0,
                    sellVol: 0,
                    buyAmt: 0,
                    sellAmt: 0,
                    netVol: 0,
                    netAmt: 0,
                    avgBuyPrice: 0,
                    avgSellPrice: 0
                });
            }

            const b = brokerMap.get(row.broker)!;
            b.buyVol += row.buyVol;
            b.sellVol += row.sellVol;
            b.buyAmt += row.buyVol * row.price;
            b.sellAmt += row.sellVol * row.price;

            totalBuyVol += row.buyVol;
            totalSellVol += row.sellVol;
        });

        const summary = Array.from(brokerMap.values()).map(b => {
            b.netVol = b.buyVol - b.sellVol;
            b.netAmt = b.buyAmt - b.sellAmt;
            b.avgBuyPrice = b.buyVol > 0 ? b.buyAmt / b.buyVol : 0;
            b.avgSellPrice = b.sellVol > 0 ? b.sellAmt / b.sellVol : 0;
            return b;
        });

        // Sort by net volume descending
        summary.sort((a, b) => b.netVol - a.netVol);

        return {
            details: rawRows,
            summary: summary
        };
    };

    const handleSearch = async () => {
        if (!stockCode || !selectedDate) return;
        setLoading(true);
        setError('');
        setData(null);

        try {
            let zip = zipCache.get(selectedDate);

            if (!zip) {
                console.log(`Downloading ZIP for ${selectedDate}...`);
                const response = await fetch(`${import.meta.env.BASE_URL}data/chips/${selectedDate}.zip`);
                if (!response.ok) throw new Error('ZIP file not found');
                const blob = await response.blob();
                zip = await JSZip.loadAsync(blob);

                // Cache the zip (careful with memory, maybe limit cache size later)
                setZipCache(prev => new Map(prev).set(selectedDate, zip!));
            }

            // Look for the CSV file
            // The zip structure is usually YYYYMMDD/STOCK.csv
            const fileName = `${selectedDate}/${stockCode}.csv`;
            const file = zip.file(fileName);

            if (!file) {
                throw new Error(`Stock ${stockCode} not found in ${selectedDate} data`);
            }

            // const csvText = await file.async('string'); // Unused

            // Need to handle encoding... JSZip returns unicode string if we ask for 'string'.
            // But the original file might be Big5. 
            // JSZip 'string' method tries to decode as UTF-8 usually.
            // If it's Big5, we might need to read as 'uint8array' and decode using TextDecoder.

            // Let's try reading as Uint8Array and decoding
            const uint8Array = await file.async('uint8array');
            let decodedText = '';

            // Try Big5 first (common for Taiwan stock data)
            try {
                const decoder = new TextDecoder('big5');
                decodedText = decoder.decode(uint8Array);
            } catch (e) {
                // Fallback to UTF-8
                const decoder = new TextDecoder('utf-8');
                decodedText = decoder.decode(uint8Array);
            }

            const rawRows = parseDoubleColumnCSV(decodedText);
            const processedData = processStockData(rawRows);

            setData(processedData);

        } catch (err: any) {
            setError(err.message || 'Error loading data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="brokerage-dashboard">
            <div className="controls-bar">
                <div className="control-group">
                    <label><Calendar size={16} /> Date</label>
                    <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
                        {dates.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div className="control-group">
                    <label><Search size={16} /> Stock</label>
                    <input
                        type="text"
                        value={stockCode}
                        onChange={e => setStockCode(e.target.value)}
                        placeholder="e.g. 2330"
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button className="search-btn" onClick={handleSearch} disabled={loading}>
                    {loading ? 'Loading...' : 'Search'}
                </button>
            </div>

            <div className="sub-tabs">
                <button
                    className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('charts')}
                >
                    <BarChart2 size={16} /> Chart Analysis
                </button>
                <button
                    className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scan')}
                >
                    <Activity size={16} /> Strong Buy/Sell Scan
                </button>
                <button
                    className={`tab-btn ${activeTab === 'query' ? 'active' : ''}`}
                    onClick={() => setActiveTab('query')}
                >
                    <List size={16} /> Data Query
                </button>
            </div>

            <div className="content-area">
                {error && <div className="error-msg">{error}</div>}

                {!data && !loading && !error && (
                    <div className="empty-state">Please select a date and enter a stock code to start analysis.</div>
                )}

                {data && (
                    <>
                        {activeTab === 'charts' && <BrokerageCharts data={data} />}
                        {activeTab === 'scan' && <BrokerageScanner />}
                        {activeTab === 'query' && <BrokerageQuery data={data} />}
                    </>
                )}
            </div>
        </div>
    );
};

// Placeholder Sub-components
const BrokerageCharts = ({ data }: { data: any }) => (
    <div className="charts-view">
        <h3>Brokerage Summary (Top 5 Buyers)</h3>
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Broker</th>
                        <th>Net Vol</th>
                        <th>Avg Buy</th>
                        <th>Avg Sell</th>
                    </tr>
                </thead>
                <tbody>
                    {data.summary.slice(0, 5).map((row: any, i: number) => (
                        <tr key={i}>
                            <td>{row.broker}</td>
                            <td style={{ color: row.netVol > 0 ? '#ef4444' : '#10b981' }}>{row.netVol}</td>
                            <td>{row.avgBuyPrice.toFixed(2)}</td>
                            <td>{row.avgSellPrice.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const BrokerageScanner = () => (
    <div className="scanner-view">
        <h3>Strong Buy/Sell Scan (Coming Soon)</h3>
        <p>This feature requires cross-stock analysis which is not available in single-stock mode.</p>
    </div>
);

const BrokerageQuery = ({ data }: { data: any }) => (
    <div className="query-view">
        <h3>Transaction Details ({data.details.length} records)</h3>
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Broker</th>
                        <th>Price</th>
                        <th>Buy Vol</th>
                        <th>Sell Vol</th>
                    </tr>
                </thead>
                <tbody>
                    {data.details.slice(0, 100).map((row: any, i: number) => (
                        <tr key={i}>
                            <td>{row.broker}</td>
                            <td>{row.price}</td>
                            <td>{row.buyVol}</td>
                            <td>{row.sellVol}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default BrokerageDashboard;
