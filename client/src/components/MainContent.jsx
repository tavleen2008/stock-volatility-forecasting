import React from 'react';
import { useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import Portfolio from './Portfolio';
import Forecasts from './Forecasts';
import NewsFeed from './NewsFeed';
import StockComparison from './StockComparison';
import SecurityAnalysis from './SecurityAnalysis';
import MarketOverview from './MarketOverview';
import Settings from './Settings';

const ROUTES = {
  '/portfolio': 'portfolio',
  '/forecasts': 'forecasts',
  '/volatility': 'forecasts',
  '/news':      'news',
  '/compare':   'compare',
  '/snapshot':  'security',
  '/security':  'security',
  '/market':    'market',
  '/settings':  'settings',
};

function getPage(path) {
  for (const [key, val] of Object.entries(ROUTES)) {
    if (path.includes(key)) return val;
  }
  return 'dashboard';
}

function MainContent({ isDarkMode }) {
  const { pathname } = useLocation();
  const currentPage = getPage(pathname);


  return (
    <main
      className={`flex-1 overflow-y-auto p-5 transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950' : 'bg-gray-50'
      }`}
    >
      {currentPage === 'portfolio'  && <Portfolio  isDarkMode={isDarkMode} />}
      {currentPage === 'forecasts'  && <Forecasts  isDarkMode={isDarkMode} />}
      {currentPage === 'news'       && <NewsFeed   isDarkMode={isDarkMode} />}
      {currentPage === 'security'   && <SecurityAnalysis isDarkMode={isDarkMode} />}
      {currentPage === 'market'     && <MarketOverview isDarkMode={isDarkMode} />}
      {currentPage === 'settings'   && <Settings   isDarkMode={isDarkMode} />}
      {currentPage === 'compare'    && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div>
            <h1 className={`text-3xl font-bold mb-0.5 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>Stock Comparison</h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Compare normalised % returns across symbols</p>
          </div>
          <StockComparison isDarkMode={isDarkMode} />
        </div>
      )}
      {currentPage === 'dashboard'  && <Dashboard  isDarkMode={isDarkMode} />}
    </main>
  );
}

export default MainContent;
