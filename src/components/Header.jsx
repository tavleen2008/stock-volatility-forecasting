import React, { useState } from 'react';
import { Menu, Search, HelpCircle, LogIn } from 'lucide-react';
import './Header.css';

function Header({ onToggleSidebar }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="logo">
          <div className="logo-icon">K</div>
          <span>Koyfin Analytics</span>
        </div>
      </div>

      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search for a name, ticker, or function"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="header-right">
        <button className="header-btn help-btn">
          <HelpCircle size={20} />
          <span>Help Center</span>
        </button>
        <button className="header-btn signup-btn">Sign Up Free</button>
        <button className="header-btn login-btn">
          <LogIn size={20} />
          <span>Log In</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
