import React, { useState } from 'react';
import { Menu, HelpCircle, LogOut, Moon, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

function Header({ onToggleSidebar, isDarkMode, onToggleTheme, user: userProp }) {
  const navigate = useNavigate();
  // Accept user from parent (DashboardPage fetches it fresh from /api/auth/me)
  // and fall back to cached localStorage session for immediate render
  const user = userProp || authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  /* ── derive display name ──────────────────────────────────────── */
  // Priority: name → first part of email → 'User'
  const displayName = user?.name
    || (user?.email ? user.email.split('@')[0] : null)
    || 'User';

  /* ── dark-mode class helpers ─────────────────────────────────── */
  const hdrBg   = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const textMain = isDarkMode ? 'text-slate-100' : 'text-gray-900';
  const textSub  = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  return (
    <header
      className={`sticky top-0 z-50 flex items-center justify-between px-5 py-3 transition-colors duration-300 border-b gap-5 ${hdrBg}`}
    >
      {/* Logo + sidebar toggle */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          className={`bg-transparent border-none cursor-pointer p-1 flex items-center justify-center hover:opacity-70 transition-opacity ${textMain}`}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        <div className={`flex items-center gap-2 font-semibold text-sm whitespace-nowrap transition-colors duration-300 ${textMain}`}>
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
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User info + logout */}
        <div className="flex items-center gap-2">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-green-400"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
          )}

          <span className={`text-xs font-medium max-w-[120px] truncate ${textMain}`}>
            {displayName}
          </span>

          <button
            id="logout-btn"
            onClick={handleLogout}
            className={`bg-transparent border px-3 py-2 rounded cursor-pointer flex items-center gap-1 text-xs transition-all duration-300 ${
              isDarkMode
                ? 'border-slate-600 text-slate-300 hover:border-red-500 hover:text-red-400'
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
