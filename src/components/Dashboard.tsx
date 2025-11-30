import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import './Dashboard.scss';
import {
    SimpleScatterChart,
    TimeHistoryChart,
    HistogramChart,
    LatestBarChart,
    RatingDistribution,
    type BrokerData
} from './Charts';
import BackgroundEffect from './BackgroundEffect';
import HeroSection from './HeroSection';

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [brokerData, setBrokerData] = useState<BrokerData[]>([]);
    const [filteredData, setFilteredData] = useState<BrokerData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'hero' | 'dashboard'>('hero');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/data/brokers.csv');
                const csvText = await response.text();

                Papa.parse(csvText, {
                    header: false,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const parsedData: BrokerData[] = results.data.slice(1).map((row: any) => {
                            // CSV Columns mapping based on brokers.csv:
                            // 0: 公司
                            // 1: 發佈日
                            // 3: 券商名稱
                            // 5: 目標價上限
                            // 7: 發佈日收盤價
                            // 8: 預估上漲空間
                            // 9: 投資建議 _ 短期
                            // 19: 預估稅後EPS-明年
                            // 21: 本益比(明年)
                            // 22: 摘要

                            const targetPrice = parseFloat(row[5]);
                            const closePrice = parseFloat(row[7]);
                            const upside = parseFloat(row[8] ? row[8].replace('%', '') : '0');
                            const epsNext = parseFloat(row[19]);
                            const peNext = parseFloat(row[21]);

                            return {
                                company: row[0] || '',
                                date: row[1],
                                broker: row[3],
                                rating: row[9],
                                targetPrice: isNaN(targetPrice) ? 0 : targetPrice,
                                closePrice: isNaN(closePrice) ? 0 : closePrice,
                                upside: isNaN(upside) ? 0 : upside,
                                summary: row[22],
                                epsNext: isNaN(epsNext) ? 0 : epsNext,
                                peNext: isNaN(peNext) ? 0 : peNext,
                                serialNumber: '',
                                targetPriceLow: 0,
                                targetPriceHigh: 0,
                                forecastPeriod: '',
                                fileSource: '',
                            };
                        });
                        // Filter out invalid data if necessary
                        setBrokerData(parsedData);
                        setLoading(false);
                    }
                });
            } catch (error) {
                console.error('Error loading data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSearch = (query: string) => {
        console.log('Searching for:', query);
        setSearchQuery(query);
        if (!query.trim()) return;

        const matched = brokerData.filter(d =>
            d.company && (d.company.includes(query) || d.company.includes(query.toUpperCase()))
        );

        console.log('Matched results:', matched.length);

        if (matched.length > 0) {
            // Group by company to find the best match
            const company = matched[0].company;
            setSelectedCompany(company);
            setFilteredData(brokerData.filter(d => d.company === company));
            setViewMode('dashboard');
        } else {
            // Handle no results (maybe show a toast or shake animation)
            console.log('No results found');
            alert('No results found for ' + query);
        }
    };

    const handleBackToHero = () => {
        setViewMode('hero');
        setSearchQuery('');
        setSelectedCompany(null);
    };

    return (
        <div className="dashboard">
            <BackgroundEffect />

            {viewMode === 'hero' ? (
                <HeroSection onSearch={handleSearch} />
            ) : (
                <div className="dashboard-container">
                    <header className="dashboard-header">
                        <div className="logo" onClick={handleBackToHero} style={{ cursor: 'pointer' }}>
                            <h1>Market<span>Vision</span></h1>
                        </div>
                        <div className="search-bar">
                            <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}>
                                <Search className="icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search Company (e.g. 2330)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>
                        </div>
                    </header>

                    <main className="dashboard-content">
                        {loading ? (
                            <div className="loading">
                                <RefreshCw className="spin" size={40} />
                                <p>Loading Market Data...</p>
                            </div>
                        ) : (
                            <div className="analysis-view">
                                <div className="company-header">
                                    <button className="back-btn" onClick={handleBackToHero}>
                                        <ArrowLeft size={20} />
                                    </button>
                                    <h2>{selectedCompany}</h2>
                                    <span className="badge">{filteredData.length} Reports</span>
                                </div>

                                <div className="charts-grid">
                                    {/* Row 1: Scatters */}
                                    <div className="chart-card">
                                        <h3>Target Price vs Upside</h3>
                                        <SimpleScatterChart
                                            data={filteredData}
                                            xKey="targetPrice" yKey="upside"
                                            xLabel="Target Price" yLabel="Upside (%)"
                                            color="#3b82f6" isPercentage={true}
                                        />
                                    </div>
                                    <div className="chart-card">
                                        <h3>EPS vs PE (Next Year)</h3>
                                        <SimpleScatterChart
                                            data={filteredData}
                                            xKey="epsNext" yKey="peNext"
                                            xLabel="EPS (Next)" yLabel="PE (Next)"
                                            color="#8b5cf6"
                                        />
                                    </div>

                                    {/* Row 2: Histograms */}
                                    <div className="chart-card">
                                        <h3>Target Price Distribution</h3>
                                        <HistogramChart data={filteredData} dataKey="targetPrice" color="#06b6d4" />
                                    </div>
                                    <div className="chart-card">
                                        <h3>PE Distribution</h3>
                                        <HistogramChart data={filteredData} dataKey="peNext" color="#10b981" />
                                    </div>

                                    {/* Row 3: History */}
                                    <div className="chart-card">
                                        <h3>Target Price History</h3>
                                        <TimeHistoryChart data={filteredData} dataKey="targetPrice" label="Target Price" color="#ef4444" />
                                    </div>
                                    <div className="chart-card">
                                        <h3>Upside History</h3>
                                        <TimeHistoryChart data={filteredData} dataKey="upside" label="Upside" color="#f59e0b" isPercentage={true} />
                                    </div>

                                    {/* Row 4: More History */}
                                    <div className="chart-card">
                                        <h3>EPS History</h3>
                                        <TimeHistoryChart data={filteredData} dataKey="epsNext" label="EPS (Next)" color="#3b82f6" />
                                    </div>
                                    <div className="chart-card">
                                        <h3>PE History</h3>
                                        <TimeHistoryChart data={filteredData} dataKey="peNext" label="PE (Next)" color="#8b5cf6" />
                                    </div>

                                    {/* Row 5: Latest Bars */}
                                    <div className="chart-card full-width">
                                        <h3>Latest Target Price by Broker</h3>
                                        <LatestBarChart data={filteredData} dataKey="targetPrice" label="Target Price" color="#06b6d4" />
                                    </div>
                                    <div className="chart-card full-width">
                                        <h3>Latest EPS by Broker</h3>
                                        <LatestBarChart data={filteredData} dataKey="epsNext" label="EPS (Next)" color="#10b981" />
                                    </div>
                                    <div className="chart-card full-width">
                                        <h3>Latest PE by Broker</h3>
                                        <LatestBarChart data={filteredData} dataKey="peNext" label="PE (Next)" color="#ef4444" />
                                    </div>

                                    {/* Row 6: Rating */}
                                    <div className="chart-card">
                                        <h3>Rating Distribution</h3>
                                        <RatingDistribution data={filteredData} />
                                    </div>
                                </div>

                                <div className="summary-section">
                                    <h3>Latest Analyst Summaries</h3>
                                    <div className="summary-list">
                                        {filteredData
                                            .filter(d => d.summary && d.summary.trim() !== '' && d.summary !== '#DIV/0!' && d.summary !== '#VALUE!')
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map((d, i) => (
                                                <div key={i} className="summary-card">
                                                    <div className="meta">
                                                        <span className="date">{d.date}</span>
                                                        <span className="broker">{d.broker}</span>
                                                        <span className={`rating ${d.rating ? d.rating.toLowerCase() : ''}`}>{d.rating}</span>
                                                    </div>
                                                    <div className="content">{d.summary}</div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
