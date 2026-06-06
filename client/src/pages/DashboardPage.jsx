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
  // On mobile start with sidebar closed, on desktop start open
  const [sidebarOpen, setSidebarOpen] = React.useState(() => window.innerWidth >= 768);
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('sentivvo_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Auto-close sidebar on small screens when resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch latest user profile from the backend to ensure correct name is shown
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    authApi.me()
      .then((data) => {
        const freshUser = data?.user;
        if (freshUser) {
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
      .catch(() => {});
  }, []);

  return (
    <div className={`sv-app-shell flex h-screen overflow-hidden ${isDarkMode ? 'sv-dashboard-dark' : 'bg-gray-50'}`}>
      {/* Mobile overlay — clicking it closes the sidebar */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar isOpen={sidebarOpen} isDarkMode={isDarkMode} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
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
