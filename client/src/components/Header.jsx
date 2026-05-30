import React, { useState } from 'react';
import { Menu, Search, HelpCircle, LogIn, LogOut, Moon, Sun, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Header({ onToggleSidebar, isDarkMode, onToggleTheme }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, loading, logout } = useAuth();

  const handleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className={`flex items-center justify-between px-5 py-3 transition-colors duration-300 border-b gap-5 ${
      isDarkMode
        ? 'bg-dark-card border-dark-border'
        : 'bg-white border-gray-200'
    }`}>
      {/* Logo + sidebar toggle */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          className={`bg-transparent border-none cursor-pointer p-1 flex items-center justify-center hover:opacity-70 transition-opacity ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <div className={`flex items-center gap-2 font-semibold text-sm whitespace-nowrap transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <div className="w-8 h-8 bg-gradient-to-br from-accent-cyan to-accent-blue rounded flex items-center justify-center font-bold text-sm text-white">
            S
          </div>
          <span>Sentivvo</span>
        </div>
      </div>

      {/* Search bar */}
      <div className={`flex items-center gap-2 rounded px-3 py-2 flex-1 max-w-md transition-colors duration-300 border ${
        isDarkMode
          ? 'bg-dark-input border-gray-600'
          : 'bg-gray-100 border-gray-300'
      }`}>
        <Search size={18} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
        <input
          type="text"
          placeholder="Search for a name, ticker, or function"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`bg-transparent border-none outline-none flex-1 text-sm transition-colors duration-300 ${
            isDarkMode
              ? 'text-white placeholder-gray-500'
              : 'text-gray-900 placeholder-gray-400'
          }`}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          onClick={onToggleTheme}
          className={`bg-transparent border px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs transition-all duration-300 ${
            isDarkMode
              ? 'border-gray-600 text-white hover:border-gray-500 hover:bg-dark-hover'
              : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* Help */}
        <button
          id="help-center-btn"
          className={`bg-transparent border px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs transition-all duration-300 ${
            isDarkMode
              ? 'border-gray-600 text-white hover:border-gray-500 hover:bg-dark-hover'
              : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
          }`}
        >
          <HelpCircle size={20} />
          <span>Help Center</span>
        </button>

        {/* Auth section */}
        {loading ? (
          /* Skeleton while validating stored token */
          <div className={`w-24 h-8 rounded animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        ) : user ? (
          /* Authenticated — show avatar + name + logout */
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || 'User avatar'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-accent-cyan"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
            )}
            <span className={`text-xs font-medium max-w-[100px] truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              {user.name || user.email}
            </span>
            <button
              id="logout-btn"
              onClick={handleLogout}
              className={`bg-transparent border px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs transition-all duration-300 ${
                isDarkMode
                  ? 'border-gray-600 text-white hover:border-red-500 hover:text-red-400'
                  : 'border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500'
              }`}
              aria-label="Log out"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          /* Unauthenticated — show login button */
          <button
            id="login-btn"
            onClick={handleLogin}
            className={`bg-transparent border px-3 py-2 rounded cursor-pointer flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${
              isDarkMode
                ? 'border-accent-cyan text-accent-cyan hover:bg-accent-cyan hover:text-gray-900'
                : 'border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white'
            }`}
            aria-label="Log in with Google"
          >
            {/* Google G icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Log In with Google
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
