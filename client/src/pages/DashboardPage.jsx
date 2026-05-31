import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
function DashboardPage() {
  const [isDarkMode, setIsDarkMode] = React.useState(true);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-dark-bg' : 'bg-gray-50'}`}>
      <Sidebar isOpen={sidebarOpen} isDarkMode={isDarkMode} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
        <MainContent isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

export default DashboardPage;
