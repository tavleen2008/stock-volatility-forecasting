import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, TrendingUp } from 'lucide-react';
import { authService } from '../services/auth';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email)                          return setError('Please enter your email.');
    if (!/\S+@\S+\.\S+/.test(email))     return setError('Enter a valid email address.');
    if (!password)                       return setError('Please enter your password.');
    if (password.length < 6)            return setError('Password must be at least 6 characters.');

    setLoading(true);
    const res = await authService.login(email, password);
    setLoading(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error || 'Invalid credentials. Try guest login.');
  };

  const handleGoogle = () => {
    setGoogleLoad(true);
    authService.googleAuth(); // redirects to backend OAuth
  };

  const handleGuest = () => {
    authService.guestLogin();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full flex font-sans">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gray-950 p-12 text-white relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex items-center gap-3 z-10 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-green-500/30">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">Sentivvo</span>
        </div>

        <div className="z-10">
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Predict Volatility.<br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Trade with Confidence.
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Access live stock quotes, volatility forecasts, RSI signals, and portfolio tracking — all in one premium dashboard.
          </p>

          {/* Mini metrics strip */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Historical Vol', value: '28.4%' },
              { label: 'RSI Signal', value: 'Bullish' },
              { label: 'Live Symbols', value: '4' },
              { label: 'Data Source', value: 'Real-Time Feed' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">{label}</div>
                <div className="font-bold text-white text-base">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-700 z-10">© {new Date().getFullYear()} Sentivvo. Not financial advice.</p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gray-50">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold text-white text-sm">S</div>
          <span className="text-xl font-bold text-gray-900">Sentivvo</span>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to access your dashboard</p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoad}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white text-gray-800 rounded-xl py-3 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all mb-4 shadow-sm disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {googleLoad ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <span className="text-xs text-gray-400 cursor-pointer hover:underline">Forgot password?</span>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 transition-all shadow-md disabled:opacity-60 mt-1"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Guest */}
          <button
            onClick={handleGuest}
            className="w-full mt-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-all"
          >
            Continue as Guest (no account needed)
          </button>

          <p className="text-center text-xs text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-green-600 font-semibold hover:underline">Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
