import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import Portfolio from './Portfolio';
import Forecasts from './Forecasts';
import NewsFeed from './NewsFeed';
import StockComparison from './StockComparison';
import SecurityAnalysis from './SecurityAnalysis';

const ROUTES = {
  '/portfolio': 'portfolio',
  '/forecasts': 'forecasts',
  '/volatility': 'forecasts',
  '/news':      'news',
  '/compare':   'compare',
  '/snapshot':  'security',
  '/security':  'security',
};

function getPage(path) {
  for (const [key, val] of Object.entries(ROUTES)) {
    if (path.includes(key)) return val;
  }
  return 'dashboard';
}

function MainContent({ isDarkMode }) {
  const [currentPage, setCurrentPage] = useState(() => getPage(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setCurrentPage(getPage(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Allow sidebar <a> clicks to update page without full reload
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault();
        window.history.pushState({}, '', href);
        setCurrentPage(getPage(href));
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
