import React, { useState } from 'react';
import { Menu, Search, HelpCircle, LogOut, Moon, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

function Header({ onToggleSidebar, isDarkMode, onToggleTheme }) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  return (
    <header className={`sticky top-0 z-50 flex items-center justify-between px-5 py-3 transition-colors duration-300 border-b gap-5 ${
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
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center font-bold text-sm text-white">
            S
          </div>
          <span>Sentivvo</span>
        </div>
      </div>

     

      {/* Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Theme Toggle */}
        <button
        onClick={onToggleTheme}
        className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-300 ${
       isDarkMode? 'bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700'
       : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
      }`}
      aria-label="Toggle theme">
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>




        {/* User info + logout */}
        <div className="flex items-center gap-2">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User avatar'}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-green-400"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
          )}
          <span className={`text-xs font-medium max-w-[100px] truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {user?.name || user?.email || 'User'}
          </span>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className={`bg-transparent border px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs transition-all duration-300 ${
              isDarkMode
                ? 'border-gray-600 text-white hover:border-red-500 hover:text-red-400'
                : 'border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600'
            }`}
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
