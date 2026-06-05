import React, { useState, useEffect } from 'react';
import { User, Lock, Check, AlertCircle, Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { TOKEN_KEY, SESSION_KEY } from '../utils/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/* ── helpers ─────────────────────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

/* ── sub-components ─────────────────────────────────────────────── */
function StatusBanner({ type, message }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border animate-fade-in ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
          : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300'
      }`}
    >
      {isSuccess ? <Check size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

function PasswordInput({ id, value, onChange, placeholder, isDarkMode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder || '••••••••'}
        className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-400/30 ${
          isDarkMode
            ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-green-500'
            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
        }`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
          isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
        }`}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/* ── section card wrapper ───────────────────────────────────────── */
function Card({ title, icon: Icon, iconColor = 'text-green-500', isDarkMode, children }) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isDarkMode ? 'bg-slate-800' : 'bg-gray-100'
          }`}
        >
          <Icon size={18} className={iconColor} />
        </div>
        <h2 className={`text-base font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Settings Component
══════════════════════════════════════════════════════════════════ */
function Settings({ isDarkMode }) {
  /* ── Profile section state ──────────────────────────────────── */
  const [displayName, setDisplayName] = useState('');
  const [profileStatus, setProfileStatus] = useState({ type: '', msg: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  /* ── Password section state ─────────────────────────────────── */
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ type: '', msg: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  /* ── Seed name from localStorage on mount ───────────────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        setDisplayName(u?.name || '');
      }
    } catch {}
  }, []);

  /* ── Input style helpers ────────────────────────────────────── */
  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-green-400/30 ${
    isDarkMode
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-green-500'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
  }`;

  const labelCls = `block text-xs font-semibold uppercase tracking-widest mb-2 ${
    isDarkMode ? 'text-slate-400' : 'text-gray-500'
  }`;

  const btnCls = (loading) =>
    `flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      loading ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
    } bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm shadow-green-500/20`;

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileStatus({ type: '', msg: '' });
    if (!displayName.trim()) return setProfileStatus({ type: 'error', msg: 'Display name cannot be empty.' });

    setProfileLoading(true);
    try {
      const data = await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: displayName.trim() }),
      });
      // Update cached session
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ...u, name: displayName.trim() }));
      }
      setProfileStatus({ type: 'success', msg: data.message || 'Display name updated successfully.' });
    } catch (err) {
      setProfileStatus({ type: 'error', msg: err.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', msg: '' });
    if (!oldPassword) return setPasswordStatus({ type: 'error', msg: 'Enter your current password.' });
    if (!newPassword || newPassword.length < 8)
      return setPasswordStatus({ type: 'error', msg: 'New password must be at least 8 characters.' });
    if (newPassword !== confirmPassword)
      return setPasswordStatus({ type: 'error', msg: 'New passwords do not match.' });

    setPasswordLoading(true);
    try {
      const data = await apiFetch('/api/users/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setPasswordStatus({ type: 'success', msg: data.message || 'Password changed successfully.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({ type: 'error', msg: err.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      {/* Page heading */}
      <div>
        <h1 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
          Account Settings
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          Manage your profile and security preferences
        </p>
      </div>

      {/* ── Profile Card ─── */}
      <Card title="Display Name" icon={User} isDarkMode={isDarkMode}>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <StatusBanner type={profileStatus.type} message={profileStatus.msg} />
          <div>
            <label htmlFor="displayName" className={labelCls}>
              Name shown in the app
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className={inputCls}
              maxLength={50}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileLoading} className={btnCls(profileLoading)}>
              {profileLoading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {profileLoading ? 'Saving…' : 'Save Name'}
            </button>
          </div>
        </form>
      </Card>

      {/* ── Change Password Card ─── */}
      <Card title="Change Password" icon={Shield} iconColor="text-blue-500" isDarkMode={isDarkMode}>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <StatusBanner type={passwordStatus.type} message={passwordStatus.msg} />

          <div>
            <label htmlFor="oldPassword" className={labelCls}>
              Current Password
            </label>
            <PasswordInput
              id="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Your current password"
              isDarkMode={isDarkMode}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className={labelCls}>
              New Password
            </label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              isDarkMode={isDarkMode}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className={labelCls}>
              Confirm New Password
            </label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Password strength hint */}
          {newPassword.length > 0 && (
            <div className="flex items-center gap-2">
              {[8, 12, 16].map((threshold) => (
                <div
                  key={threshold}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    newPassword.length >= threshold
                      ? threshold === 8
                        ? 'bg-yellow-400'
                        : threshold === 12
                        ? 'bg-green-400'
                        : 'bg-emerald-500'
                      : isDarkMode
                      ? 'bg-slate-700'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
              <span className={`text-xs ml-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {newPassword.length < 8 ? 'Too short' : newPassword.length < 12 ? 'Fair' : newPassword.length < 16 ? 'Good' : 'Strong'}
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={passwordLoading} className={btnCls(passwordLoading)}>
              {passwordLoading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              {passwordLoading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default Settings;
