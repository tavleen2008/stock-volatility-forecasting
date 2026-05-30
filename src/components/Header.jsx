import React, { useState } from 'react';
import { Menu, Search, HelpCircle, LogIn } from 'lucide-react';

function Header({ onToggleSidebar }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-dark-card border-b border-dark-border gap-5">
      <div className="flex items-center gap-3 flex-shrink-0">
        <button 
          className="bg-transparent border-none text-white cursor-pointer p-1 flex items-center justify-center hover:opacity-70 transition-opacity"
          onClick={onToggleSidebar}
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 font-semibold text-sm whitespace-nowrap">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-cyan to-accent-blue rounded flex items-center justify-center font-bold text-sm text-white">
            S
          </div>
          <span>Sentivvo</span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-dark-input border border-gray-600 rounded px-3 py-2 flex-1 max-w-md">
        <Search size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search for a name, ticker, or function"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-white outline-none flex-1 text-sm placeholder-gray-500"
        />
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="bg-transparent border border-gray-600 text-white px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs hover:border-gray-500 hover:bg-dark-hover transition-all">
          <HelpCircle size={20} />
          <span>Help Center</span>
        </button>
        <button className="bg-transparent border border-gray-600 text-white px-3 py-2 rounded cursor-pointer text-xs hover:border-gray-500 hover:bg-dark-hover transition-all">
          Sign Up Free
        </button>
        <button className="bg-transparent border border-gray-600 text-white px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs hover:border-gray-500 hover:bg-dark-hover transition-all">
          <LogIn size={20} />
          <span>Log In</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
