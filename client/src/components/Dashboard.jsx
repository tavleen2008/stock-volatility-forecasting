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

function Dashboard({ isDarkMode = true }) {
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
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-2">
        <h1 className={`text-4xl font-bold m-0 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Today's Markets</h1>
        <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          <span>Last 24 Hours</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border rounded-lg p-4 transition-all duration-300 ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} hover:shadow-lg hover:shadow-accent-cyan/10`}>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs uppercase tracking-wider font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Market Index</span>
            <DollarSign size={20} className="text-accent-cyan" />
          </div>
          <div className={`text-2xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$3,245.67</div>
          <div className="flex items-center gap-1.5 text-sm text-accent-green">
            <TrendingUp size={16} />
            <span>+2.45%</span>
          </div>
        </div>

        <div className={`border rounded-lg p-4 transition-all duration-300 ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} hover:shadow-lg hover:shadow-accent-cyan/10`}>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs uppercase tracking-wider font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Trading Volume</span>
            <Activity size={20} className="text-accent-cyan" />
          </div>
          <div className={`text-2xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>2.3B</div>
          <div className="flex items-center gap-1.5 text-sm text-accent-green">
            <TrendingUp size={16} />
            <span>+12.3%</span>
          </div>
        </div>

        <div className={`border rounded-lg p-4 transition-all duration-300 ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} hover:shadow-lg hover:shadow-accent-cyan/10`}>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs uppercase tracking-wider font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>52-Week High</span>
            <TrendingUp size={20} className="text-accent-cyan" />
          </div>
          <div className={`text-2xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>$3,456.78</div>
          <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            <span>At 98.5% of High</span>
          </div>
        </div>

        <div className={`border rounded-lg p-4 transition-all duration-300 ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} hover:shadow-lg hover:shadow-accent-cyan/10`}>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs uppercase tracking-wider font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Market Status</span>
            <Activity size={20} className="text-accent-cyan" />
          </div>
          <div className="text-2xl font-bold mb-2 text-accent-cyan">OPEN</div>
          <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            <span>Regular Hours</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`border rounded-lg p-5 transition-all duration-300 ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`m-0 text-base font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Price Performance</h3>
            <div className="flex gap-1.5">
              <button className={`bg-transparent border px-2.5 py-1 rounded text-xs cursor-pointer transition-all ${isDarkMode ? 'border-gray-600 text-gray-500 hover:border-gray-500 hover:text-white active:bg-accent-cyan active:border-accent-cyan active:text-black active:font-semibold' : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900 active:bg-accent-cyan active:border-accent-cyan active:text-white active:font-semibold'}`}>1D</button>
              <button className={`bg-transparent border px-2.5 py-1 rounded text-xs cursor-pointer transition-all ${isDarkMode ? 'border-gray-600 text-gray-500 hover:border-gray-500 hover:text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>1W</button>
              <button className={`bg-transparent border px-2.5 py-1 rounded text-xs cursor-pointer transition-all ${isDarkMode ? 'border-gray-600 text-gray-500 hover:border-gray-500 hover:text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>1M</button>
              <button className={`bg-transparent border px-2.5 py-1 rounded text-xs cursor-pointer transition-all ${isDarkMode ? 'border-gray-600 text-gray-500 hover:border-gray-500 hover:text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>3M</button>
              <button className={`bg-transparent border px-2.5 py-1 rounded text-xs cursor-pointer transition-all ${isDarkMode ? 'border-gray-600 text-gray-500 hover:border-gray-500 hover:text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>1Y</button>
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
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#2a2a2a' : '#e5e7eb'} />
              <XAxis dataKey="time" stroke={isDarkMode ? '#666' : '#999'} />
              <YAxis stroke={isDarkMode ? '#666' : '#999'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                  border: `1px solid ${isDarkMode ? '#2a2a2a' : '#e5e7eb'}`,
                  borderRadius: '6px',
                }}
                labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
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

        <div className={`border rounded-lg p-5 transition-all duration-300 ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`m-0 text-base font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Trading Volume</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#2a2a2a' : '#e5e7eb'} />
              <XAxis dataKey="time" stroke={isDarkMode ? '#666' : '#999'} />
              <YAxis stroke={isDarkMode ? '#666' : '#999'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                  border: `1px solid ${isDarkMode ? '#2a2a2a' : '#e5e7eb'}`,
                  borderRadius: '6px',
                }}
                labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
              />
              <Bar dataKey="volume" fill="#0099ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stocks Table */}
      <div className={`border rounded-lg p-5 transition-all duration-300 ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
        <div className="mb-4 flex justify-between items-baseline">
          <h3 className={`m-0 text-base font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Movers</h3>
          <span className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>24-hour changes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className={`border-b ${isDarkMode ? 'border-dark-border' : 'border-gray-200'}`}>
              <tr>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>Symbol</th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>Name</th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>Price</th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>Change</th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>% Change</th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => (
                <tr key={stock.symbol} className={`border-b transition-colors duration-300 ${isDarkMode ? 'border-dark-border text-dark-text hover:bg-gray-800' : 'border-gray-200 text-gray-900 hover:bg-gray-50'}`}>
                  <td className={`px-4 py-3 font-semibold font-mono transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.symbol}</td>
                  <td className="px-4 py-3">{stock.name}</td>
                  <td className={`px-4 py-3 font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${stock.price.toFixed(2)}</td>
                  <td className={`px-4 py-3 flex items-center gap-1.5 ${stock.change > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    <span className="flex items-center">
                      {stock.change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </span>
                    ${stock.change.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${stock.changePercent > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </td>
                  <td className={`px-4 py-3 text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>{(stock.volume / 1000000).toFixed(1)}M</td>
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
