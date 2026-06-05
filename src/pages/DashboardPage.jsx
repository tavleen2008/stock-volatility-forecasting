import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MainContent from '../components/MainContent';
import { authApi } from '../utils/api';
import { authService } from '../services/auth';

const TOKEN_KEY = 'svf_access_token';
const SESSION_KEY = 'sentivvo_current_session';

function DashboardPage() {
  const [isDarkMode, setIsDarkMode] = React.useState(() => localStorage.getItem('sentivvo_theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = React.useState(() => window.innerWidth >= 768);
  const [user, setUser] = useState(() => authService.getCurrentUser());

  // Update sidebar visibility on window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('sentivvo_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Fetch latest user profile from the backend to ensure correct name is shown
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    authApi.me()
      .then((data) => {
        const freshUser = data?.user;
        if (freshUser) {
          // Merge avatar from local session if backend doesn't return it
          const stored = authService.getCurrentUser();
          const merged = {
            ...stored,
            ...freshUser,
            avatarUrl: freshUser.avatarUrl || stored?.avatarUrl || null,
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(merged));
          setUser(merged);
        }
      })
      .catch(() => {
        // Token may be expired or server is down — just use cached session
      });
  }, []);

  return (
    <div className={`sv-app-shell flex h-screen overflow-hidden ${isDarkMode ? 'sv-dashboard-dark' : 'bg-gray-50'}`}>
      <Sidebar isOpen={sidebarOpen} isDarkMode={isDarkMode} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          user={user}
        />
        <MainContent isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

export default DashboardPage;
