import React, { useState } from 'react';
import { Menu, Search, HelpCircle, LogIn, Moon, Sun } from 'lucide-react';

function Header({ onToggleSidebar, isDarkMode, onToggleTheme }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className={`flex items-center justify-between px-5 py-3 transition-colors duration-300 border-b gap-5 ${
      isDarkMode 
        ? 'bg-dark-card border-dark-border' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button 
          className={`bg-transparent border-none cursor-pointer p-1 flex items-center justify-center hover:opacity-70 transition-opacity ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
          onClick={onToggleSidebar}
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

      <div className="flex items-center gap-3 flex-shrink-0">
        <button 
          onClick={onToggleTheme}
          className={`bg-transparent border px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs transition-all duration-300 ${
            isDarkMode
              ? 'border-gray-600 text-white hover:border-gray-500 hover:bg-dark-hover'
              : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
          }`}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button className={`bg-transparent border px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs transition-all duration-300 ${
          isDarkMode
            ? 'border-gray-600 text-white hover:border-gray-500 hover:bg-dark-hover'
            : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
        }`}>
          <HelpCircle size={20} />
          <span>Help Center</span>
        </button>
        <button className={`bg-transparent border px-3 py-2 rounded cursor-pointer text-xs transition-all duration-300 ${
          isDarkMode
            ? 'border-gray-600 text-white hover:border-gray-500 hover:bg-dark-hover'
            : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
        }`}>
          Sign Up Free
        </button>
        <button className={`bg-transparent border px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs transition-all duration-300 ${
          isDarkMode
            ? 'border-gray-600 text-white hover:border-gray-500 hover:bg-dark-hover'
            : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100'
        }`}>
          <LogIn size={20} />
          <span>Log In</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
