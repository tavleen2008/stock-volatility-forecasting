import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleToggleTheme = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${isDarkMode ? 'bg-dark-bg text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar isOpen={sidebarOpen} isDarkMode={isDarkMode} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isDarkMode={isDarkMode} onToggleTheme={handleToggleTheme} />
        <MainContent isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

export default App;
