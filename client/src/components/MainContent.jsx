import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import Portfolio from './Portfolio';
import Forecasts from './Forecasts';

const ROUTES = {
  '/portfolio': 'portfolio',
  '/forecasts': 'forecasts',
  '/volatility': 'forecasts',
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
      {currentPage === 'dashboard'  && <Dashboard  isDarkMode={isDarkMode} />}
    </main>
  );
}

export default MainContent;
