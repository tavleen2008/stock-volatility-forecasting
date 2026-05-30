import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const [chartData, setChartData] = useState([]);
  const [stocks, setStocks] = useState([]);

  // Generate mock data
  useEffect(() => {
    // Market data for chart
    const data = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      price: 150 + Math.sin(i / 3) * 30 + Math.random() * 20,
      volume: 1000000 + Math.random() * 500000,
    }));
    setChartData(data);

    // Stock data
    const mockStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 182.45, change: 5.23, changePercent: 2.94, volume: 52000000 },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: -2.15, changePercent: -0.56, volume: 18000000 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 140.23, change: 8.76, changePercent: 6.65, volume: 24500000 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 175.43, change: -4.32, changePercent: -2.41, volume: 45000000 },
    ];
    setStocks(mockStocks);
  }, []);

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <h1>Today's Markets</h1>
        <div className="date-range">
          <span>Last 24 Hours</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Market Index</span>
            <DollarSign size={20} className="stat-icon" />
          </div>
          <div className="stat-value">$3,245.67</div>
          <div className="stat-change positive">
            <TrendingUp size={16} />
            <span>+2.45%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Trading Volume</span>
            <Activity size={20} className="stat-icon" />
          </div>
          <div className="stat-value">2.3B</div>
          <div className="stat-change positive">
            <TrendingUp size={16} />
            <span>+12.3%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">52-Week High</span>
            <TrendingUp size={20} className="stat-icon" />
          </div>
          <div className="stat-value">$3,456.78</div>
          <div className="stat-change neutral">
            <span>At 98.5% of High</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Market Status</span>
            <Activity size={20} className="stat-icon" />
          </div>
          <div className="stat-value" style={{ color: '#00d4ff' }}>
            OPEN
          </div>
          <div className="stat-change">
            <span>Regular Hours</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Price Performance</h3>
            <div className="chart-controls">
              <button className="time-btn active">1D</button>
              <button className="time-btn">1W</button>
              <button className="time-btn">1M</button>
              <button className="time-btn">3M</button>
              <button className="time-btn">1Y</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#00d4ff"
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Trading Volume</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="volume" fill="#0099ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>Top Movers</h3>
          <span className="table-subtitle">24-hour changes</span>
        </div>
        <div className="table-wrapper">
          <table className="stocks-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
                <th>% Change</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.symbol}>
                  <td className="symbol">{stock.symbol}</td>
                  <td>{stock.name}</td>
                  <td className="price">${stock.price.toFixed(2)}</td>
                  <td className={`change ${stock.change > 0 ? 'positive' : 'negative'}`}>
                    <span className="change-icon">
                      {stock.change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </span>
                    ${stock.change.toFixed(2)}
                  </td>
                  <td className={`percent ${stock.changePercent > 0 ? 'positive' : 'negative'}`}>
                    {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </td>
                  <td className="volume">{(stock.volume / 1000000).toFixed(1)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
