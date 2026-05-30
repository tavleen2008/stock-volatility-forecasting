import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import Portfolio from './Portfolio';

function MainContent({ isDarkMode }) {
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Check current route based on URL
    const path = window.location.pathname;
    if (path.includes('/portfolio')) {
      setCurrentPage('portfolio');
    } else {
      setCurrentPage('dashboard');
    }

    // Listen for popstate events (back/forward button)
    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (newPath.includes('/portfolio')) {
        setCurrentPage('portfolio');
      } else {
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <main className={`flex-1 overflow-y-auto p-5 transition-colors duration-300 ${
      isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'
    }`}>
      {currentPage === 'portfolio' ? (
        <Portfolio isDarkMode={isDarkMode} />
      ) : (
        <Dashboard isDarkMode={isDarkMode} />
      )}
    </main>
  );
}

export default MainContent;
