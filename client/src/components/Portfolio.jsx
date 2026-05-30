import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Plus, Trash2 } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart as PieChartComponent,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function Portfolio({ isDarkMode = true }) {
  const [portfolioData, setPortfolioData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalGain, setTotalGain] = useState(0);
  const [gainPercent, setGainPercent] = useState(0);

  useEffect(() => {
    // Generate mock portfolio data
    const mockPortfolio = [
      {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        shares: 50,
        buyPrice: 150.00,
        currentPrice: 182.45,
        value: 9122.50,
        gain: 1622.50,
        gainPercent: 21.63,
      },
      {
        id: 2,
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        shares: 30,
        buyPrice: 280.00,
        currentPrice: 378.91,
        value: 11367.30,
        gain: 2967.30,
        gainPercent: 35.27,
      },
      {
        id: 3,
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        shares: 20,
        buyPrice: 100.00,
        currentPrice: 140.23,
        value: 2804.60,
        gain: 804.60,
        gainPercent: 40.23,
      },
      {
        id: 4,
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        shares: 15,
        buyPrice: 120.00,
        currentPrice: 175.43,
        value: 2631.45,
        gain: 831.45,
        gainPercent: 46.19,
      },
    ];

    // Calculate totals
    const total = mockPortfolio.reduce((sum, stock) => sum + stock.value, 0);
    const totalGainAmount = mockPortfolio.reduce((sum, stock) => sum + stock.gain, 0);
    const gainPercentage = (totalGainAmount / (total - totalGainAmount)) * 100;

    setPortfolioData(mockPortfolio);
    setTotalValue(total);
    setTotalGain(totalGainAmount);
    setGainPercent(gainPercentage);

    // Generate performance chart data (30 days)
    const chartData = Array.from({ length: 30 }, (_, i) => ({
      day: `Day ${i + 1}`,
      value: 20000 + Math.sin(i / 5) * 3000 + Math.random() * 2000,
    }));
    setPerformanceData(chartData);
  }, []);

  const COLORS = ['#00d4ff', '#0099ff', '#00d966', '#ff3366'];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-2">
        <h1 className={`text-4xl font-bold m-0 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          My Portfolio
        </h1>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 border ${isDarkMode ? 'border-accent-cyan text-accent-cyan hover:bg-accent-cyan hover:text-dark-bg' : 'border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white'}`}>
          <Plus size={20} />
          Add Stock
        </button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-lg p-4 transition-all duration-300 border ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} hover:shadow-lg hover:shadow-accent-cyan/10`}>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs uppercase tracking-wider font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Total Portfolio Value
            </span>
            <DollarSign size={20} className="text-accent-cyan" />
          </div>
          <div className={`text-2xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            ${totalValue.toFixed(2)}
          </div>
          <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            {portfolioData.length} Holdings
          </div>
        </div>

        <div className={`rounded-lg p-4 transition-all duration-300 border ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} hover:shadow-lg hover:shadow-accent-cyan/10`}>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs uppercase tracking-wider font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Total Gain/Loss
            </span>
            <TrendingUp size={20} className="text-accent-green" />
          </div>
          <div className={`text-2xl font-bold mb-2 transition-colors duration-300 ${totalGain >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            ${totalGain.toFixed(2)}
          </div>
          <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            {gainPercent.toFixed(2)}% return
          </div>
        </div>

        <div className={`rounded-lg p-4 transition-all duration-300 border ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} hover:shadow-lg hover:shadow-accent-cyan/10`}>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs uppercase tracking-wider font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Best Performer
            </span>
            <TrendingUp size={20} className="text-accent-cyan" />
          </div>
          <div className={`text-2xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            AMZN
          </div>
          <div className="text-sm text-accent-green">
            +46.19%
          </div>
        </div>

        <div className={`rounded-lg p-4 transition-all duration-300 border ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'} hover:shadow-lg hover:shadow-accent-cyan/10`}>
          <div className="flex justify-between items-center mb-3">
            <span className={`text-xs uppercase tracking-wider font-semibold transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Diversification
            </span>
            <PieChart size={20} className="text-accent-cyan" />
          </div>
          <div className={`text-2xl font-bold mb-2 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            4
          </div>
          <div className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            Different stocks
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance Chart */}
        <div className={`lg:col-span-2 rounded-lg p-5 transition-all duration-300 border ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
          <h3 className={`m-0 text-base font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            30-Day Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#2a2a2a' : '#e5e7eb'} />
              <XAxis dataKey="day" stroke={isDarkMode ? '#666' : '#999'} />
              <YAxis stroke={isDarkMode ? '#666' : '#999'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                  border: `1px solid ${isDarkMode ? '#2a2a2a' : '#e5e7eb'}`,
                  borderRadius: '6px',
                }}
                labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
                formatter={(value) => `$${value.toFixed(2)}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00d4ff"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Portfolio Distribution */}
        <div className={`rounded-lg p-5 transition-all duration-300 border ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
          <h3 className={`m-0 text-base font-semibold mb-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Portfolio Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChartComponent>
              <Pie
                data={portfolioData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ symbol }) => symbol}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {portfolioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `$${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                  border: `1px solid ${isDarkMode ? '#2a2a2a' : '#e5e7eb'}`,
                  borderRadius: '6px',
                }}
                labelStyle={{ color: isDarkMode ? '#fff' : '#000' }}
              />
            </PieChartComponent>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings Table */}
      <div className={`rounded-lg p-5 transition-all duration-300 border ${isDarkMode ? 'bg-dark-card border-dark-border hover:bg-dark-hover hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>
        <div className="mb-4 flex justify-between items-baseline">
          <h3 className={`m-0 text-base font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Your Holdings
          </h3>
          <span className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            {portfolioData.length} positions
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className={`border-b ${isDarkMode ? 'border-dark-border' : 'border-gray-200'}`}>
              <tr>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>
                  Symbol
                </th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>
                  Company
                </th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>
                  Shares
                </th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>
                  Buy Price
                </th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>
                  Current Price
                </th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>
                  Value
                </th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>
                  Gain/Loss
                </th>
                <th className={`text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-500 bg-gray-900' : 'text-gray-600 bg-gray-100'}`}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.map((stock) => (
                <tr
                  key={stock.id}
                  className={`border-b transition-colors duration-300 ${
                    isDarkMode
                      ? 'border-dark-border text-dark-text hover:bg-gray-800'
                      : 'border-gray-200 text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <td className={`px-4 py-3 font-semibold font-mono transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stock.symbol}
                  </td>
                  <td className="px-4 py-3">{stock.name}</td>
                  <td className={`px-4 py-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stock.shares}
                  </td>
                  <td className="px-4 py-3">${stock.buyPrice.toFixed(2)}</td>
                  <td className={`px-4 py-3 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${stock.currentPrice.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${stock.value.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 flex items-center gap-1.5 font-semibold ${stock.gain >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                    {stock.gain >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    ${stock.gain.toFixed(2)} ({stock.gainPercent.toFixed(2)}%)
                  </td>
                  <td className="px-4 py-3">
                    <button className={`p-1 rounded transition-all duration-300 ${isDarkMode ? 'text-gray-500 hover:text-accent-red hover:bg-dark-hover' : 'text-gray-400 hover:text-accent-red hover:bg-gray-200'}`}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
