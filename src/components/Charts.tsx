import React, { useMemo } from 'react';
import { Scatter, Chart, Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    ArcElement,
    type ChartOptions
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    ArcElement,
    annotationPlugin
);

export interface BrokerData {
    company: string;
    date: string;
    serialNumber: string; // 序號
    broker: string;
    targetPriceLow: number; // 目標價下限
    targetPriceHigh: number; // 目標價上限
    targetPrice: number; // 平均目標價
    forecastPeriod: string; // 預測價格期間
    closePrice: number;
    upside: number;
    rating: string;
    epsNext: number;
    peNext: number;
    summary: string;
    fileSource: string; // 檔案來源
}

interface ChartProps {
    data: BrokerData[];
}

// --- Generic Components ---

interface ScatterProps extends ChartProps {
    xKey: keyof BrokerData;
    yKey: keyof BrokerData;
    xLabel: string;
    yLabel: string;
    color: string;
    isPercentage?: boolean;
}

export const SimpleScatterChart: React.FC<ScatterProps> = ({ data, xKey, yKey, xLabel, yLabel, color, isPercentage }) => {
    const chartData = useMemo(() => {
        const validData = data.filter(d => {
            const x = d[xKey];
            const y = d[yKey];
            return x != null && y != null && !isNaN(x as number) && !isNaN(y as number);
        });

        if (validData.length === 0) return null;

        return {
            datasets: [{
                label: `${xLabel} vs ${yLabel}`,
                data: validData.map(d => ({
                    x: d[xKey] as number,
                    y: isPercentage ? (d[yKey] as number) * 100 : (d[yKey] as number),
                    broker: d.broker,
                    date: d.date
                })),
                backgroundColor: color,
                borderColor: color,
            }]
        };
    }, [data, xKey, yKey, color, isPercentage]);

    if (!chartData) return <div className="no-data">No data available</div>;

    const options: ChartOptions<'scatter'> = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => {
                        const pt = ctx.raw;
                        const yVal = isPercentage ? pt.y.toFixed(2) + '%' : pt.y;
                        return `${pt.broker} (${pt.date}): ${yVal}`;
                    }
                }
            }
        },
        scales: {
            x: { title: { display: true, text: xLabel }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { title: { display: true, text: yLabel }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { callback: (v) => isPercentage ? v + '%' : v } }
        }
    };

    return <div style={{ height: '300px' }}><Scatter data={chartData} options={options} /></div>;
};

interface HistoryProps extends ChartProps {
    dataKey: keyof BrokerData;
    label: string;
    color: string;
    isPercentage?: boolean;
}

export const TimeHistoryChart: React.FC<HistoryProps> = ({ data, dataKey, label, color, isPercentage }) => {
    const chartData = useMemo(() => {
        const validData = data.filter(d => {
            const val = d[dataKey];
            const date = new Date(d.date);
            return val != null && !isNaN(val as number) && !isNaN(date.getTime());
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (validData.length === 0) return null;

        return {
            datasets: [{
                type: 'scatter' as const,
                label: label,
                data: validData.map(d => ({
                    x: d.date,
                    y: isPercentage ? (d[dataKey] as number) * 100 : (d[dataKey] as number),
                    broker: d.broker
                })),
                backgroundColor: color,
                borderColor: color,
            }]
        };
    }, [data, dataKey, label, color, isPercentage]);

    if (!chartData) return <div className="no-data">No data available</div>;

    const options: any = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => {
                        const val = isPercentage ? ctx.raw.y.toFixed(2) + '%' : ctx.raw.y;
                        return `${ctx.raw.broker}: ${val}`;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: { unit: 'month', displayFormats: { month: 'yyyy/MM' } },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
                title: { display: true, text: label },
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { callback: (v: any) => isPercentage ? v + '%' : v }
            }
        }
    };

    return <div style={{ height: '300px' }}><Chart type='scatter' data={chartData} options={options} /></div>;
};

interface HistogramProps extends ChartProps {
    dataKey: keyof BrokerData;
    color: string;
}

export const HistogramChart: React.FC<HistogramProps> = ({ data, dataKey, color }) => {
    const { chartData } = useMemo(() => {
        const valid = data
            .map(d => d[dataKey] as number)
            .filter(v => v != null && !isNaN(v) && v > 0);

        if (valid.length === 0) return { chartData: null, labels: [] };

        const min = Math.min(...valid);
        const max = Math.max(...valid);

        // Handle case where all values are the same
        if (min === max) {
            return {
                labels: [min.toFixed(1)],
                chartData: {
                    labels: [min.toFixed(1)],
                    datasets: [{
                        label: 'Count',
                        data: [valid.length],
                        backgroundColor: color + '80',
                        borderColor: color,
                        borderWidth: 1
                    }]
                }
            };
        }

        const binCount = 10;
        const range = max - min;
        const step = range / binCount;

        const bins = new Array(binCount).fill(0);
        const binLabels = [];

        for (let i = 0; i < binCount; i++) {
            const s = min + i * step;
            const e = s + step;
            binLabels.push(`${s.toFixed(1)} - ${e.toFixed(1)}`);
        }

        valid.forEach(v => {
            let idx = Math.floor((v - min) / step);
            if (idx >= binCount) idx = binCount - 1;
            if (idx < 0) idx = 0; // Safety check
            bins[idx]++;
        });

        return {
            labels: binLabels,
            chartData: {
                labels: binLabels,
                datasets: [{
                    label: 'Count',
                    data: bins,
                    backgroundColor: color + '80',
                    borderColor: color,
                    borderWidth: 1
                }]
            }
        };
    }, [data, dataKey, color]);

    if (!chartData) return <div className="no-data">No data available</div>;

    const options: any = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    };

    return <div style={{ height: '300px' }}><Bar data={chartData} options={options} /></div>;
};

interface LatestBarProps extends ChartProps {
    dataKey: keyof BrokerData;
    label: string;
    color: string;
}

export const LatestBarChart: React.FC<LatestBarProps> = ({ data, dataKey, label, color }) => {
    const { chartData, average } = useMemo(() => {
        // Get latest data per broker
        const map = new Map<string, BrokerData>();
        data.forEach(d => {
            if (!d.broker) return;
            const existing = map.get(d.broker);
            if (!existing || (new Date(d.date) > new Date(existing.date))) {
                map.set(d.broker, d);
            }
        });

        const latest = Array.from(map.values())
            .filter(d => {
                const val = d[dataKey];
                return typeof val === 'number' && !isNaN(val) && val > 0;
            })
            .sort((a, b) => (b[dataKey] as number) - (a[dataKey] as number));

        if (latest.length === 0) return { chartData: null, average: 0 };

        // Calculate Average
        const total = latest.reduce((sum, d) => sum + (d[dataKey] as number), 0);
        const avg = total / latest.length;

        return {
            average: avg,
            chartData: {
                labels: latest.map(d => d.broker),
                datasets: [
                    {
                        label: label,
                        data: latest.map(d => d[dataKey] as number),
                        backgroundColor: color,
                        borderRadius: 4,
                    }
                ]
            }
        };
    }, [data, dataKey, color]);

    if (!chartData) return <div className="no-data">No data available</div>;

    const options: any = {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            annotation: {
                annotations: {
                    averageLine: {
                        type: 'line',
                        xMin: average,
                        xMax: average,
                        borderColor: '#fbbf24', // Amber-400
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                            display: true,
                            content: `Avg: ${average.toFixed(2)}`,
                            position: 'end',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: '#fbbf24',
                            font: { size: 10 }
                        }
                    }
                }
            }
        },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { grid: { display: false } }
        }
    };

    // Dynamic height based on number of brokers
    const height = Math.max(300, (chartData.labels?.length || 0) * 30);

    return <div style={{ height: `${height}px` }}><Chart type='bar' data={chartData} options={options} /></div>;
};

export const RatingDistribution: React.FC<ChartProps> = ({ data }) => {
    const chartData = useMemo(() => {
        const counts: Record<string, number> = {};
        // Get latest rating per broker
        const map = new Map<string, BrokerData>();
        data.forEach(d => {
            if (!d.broker) return;
            const existing = map.get(d.broker);
            if (!existing || (new Date(d.date) > new Date(existing.date))) {
                map.set(d.broker, d);
            }
        });

        if (map.size === 0) return null;

        Array.from(map.values()).forEach(d => {
            const r = d.rating || 'Unknown';
            counts[r] = (counts[r] || 0) + 1;
        });

        return {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
                borderColor: 'rgba(15, 17, 26, 0.8)',
                borderWidth: 2
            }]
        };
    }, [data]);

    if (!chartData) return <div className="no-data">No data available</div>;

    const options: any = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { color: '#e2e8f0' } } }
    };

    return <div style={{ height: '300px' }}><Doughnut data={chartData} options={options} /></div>;
};
