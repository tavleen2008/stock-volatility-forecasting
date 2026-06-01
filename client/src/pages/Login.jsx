import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}
  </svg>
);

const s = {
  page: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    fontFamily: '"Hanken Grotesk", Inter, sans-serif',
    background: '#f9f9f9', color: '#1a1c1c',
  },
  topBar: {
    background: '#fff', borderBottom: '1px solid #e2e2e2',
    padding: '0 24px', height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 50,
  },
  logo: { fontWeight: 700, fontSize: 18, color: '#006d35', letterSpacing: '-0.02em', cursor: 'pointer' },
  backBtn: {
    background: '#fff', border: '1px solid #bacbb9',
    padding: '7px 16px', cursor: 'pointer', fontSize: 11,
    fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#1a1c1c', borderRadius: 6, transition: 'all 0.2s',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: {
    width: '100%', maxWidth: 440,
    background: '#fff', border: '1px solid #e2e2e2',
    borderRadius: 16, padding: '40px 40px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  heading: { fontSize: 28, fontWeight: 700, color: '#1a1c1c', marginBottom: 6, letterSpacing: '-0.02em' },
  subheading: { fontSize: 14, color: '#3b4a3d', marginBottom: 28 },
  label: {
    display: 'block', fontSize: 11, fontWeight: 800,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#3b4a3d', marginBottom: 8,
  },
  input: {
    width: '100%', padding: '11px 14px',
    background: '#f3f3f4', border: '1px solid #e2e2e2',
    borderRadius: 8, fontSize: 14, color: '#1a1c1c',
    outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
    fontFamily: '"Hanken Grotesk", sans-serif',
  },
  primaryBtn: {
    width: '100%', padding: '13px 0',
    background: '#00e676', color: '#00210b',
    border: 'none', borderRadius: 8, cursor: 'pointer',
    fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
    transition: 'all 0.2s', marginTop: 8,
  },
  googleBtn: {
    width: '100%', padding: '11px 0',
    background: '#fff', border: '1px solid #bacbb9',
    borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#1a1c1c', transition: 'all 0.2s', marginBottom: 24,
  },
  divider: { display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 24px' },
  divLine: { flex: 1, height: 1, background: '#e2e2e2' },
  divLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7b6c' },
  error: {
    background: '#ffdad6', border: '1px solid #ffb3ae',
    color: '#93000a', borderRadius: 8, padding: '10px 14px',
    fontSize: 13, marginBottom: 20,
  },
  footer: {
    background: '#f3f3f4', borderTop: '1px solid #e2e2e2',
    padding: '20px 24px',
    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
    gap: 12,
  },
  footerText: { fontSize: 12, color: '#6b7b6c', fontFamily: '"Hanken Grotesk", sans-serif' },
  footerLinks: { display: 'flex', gap: 20 },
  footerLink: { fontSize: 12, color: '#6b7b6c', textDecoration: 'none' },
};

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
    authService.googleAuth();
  };

  const handleGuest = () => {
    authService.guestLogin();
    navigate('/dashboard');
  };

  const inputFocus = (e) => {
    e.target.style.borderColor = '#006d35';
    e.target.style.background = '#fff';
    e.target.style.boxShadow = '0 0 0 3px rgba(0,109,53,0.1)';
  };
  const inputBlur = (e) => {
    e.target.style.borderColor = '#e2e2e2';
    e.target.style.background = '#f3f3f4';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Top bar */}
      <header style={s.topBar}>
        <span style={s.logo} onClick={() => navigate('/')}>Sentivvo</span>
        <button style={s.backBtn} onClick={() => navigate('/')}
          onMouseEnter={e => { e.currentTarget.style.background = '#f3f3f4'; e.currentTarget.style.borderColor = '#006d35'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#bacbb9'; }}
        >Back to Market</button>
      </header>

      <main style={s.main}>
        <div style={s.card}>
          <h1 style={s.heading}>Sign In</h1>
          <p style={s.subheading}>Enter your credentials to access the terminal.</p>

          {/* Error */}
          {error && <div style={s.error}>⚠ {error}</div>}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoad}
            style={{ ...s.googleBtn, opacity: googleLoad ? 0.6 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f3f4'; e.currentTarget.style.borderColor = '#006d35'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#bacbb9'; }}
          >
            <GoogleIcon />
            {googleLoad ? 'Redirecting…' : 'Sign in with Google'}
          </button>

          {/* Divider */}
          <div style={s.divider}>
            <div style={s.divLine} />
            <span style={s.divLabel}>or email</span>
            <div style={s.divLine} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={s.label} htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                style={s.input}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ ...s.label, marginBottom: 0 }} htmlFor="password">Password</label>
                <a href="#" style={{ fontSize: 11, fontWeight: 700, color: '#006d35', textDecoration: 'none', letterSpacing: '0.05em' }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...s.input, paddingRight: 44 }}
                  onFocus={inputFocus}
                  onBlur={inputBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7b6c',
                  }}
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input id="remember" type="checkbox" style={{ width: 16, height: 16, accentColor: '#006d35' }} />
              <label htmlFor="remember" style={{ fontSize: 13, color: '#3b4a3d' }}>Keep me signed in for 30 days</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...s.primaryBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#006d35'; if (!loading) e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#00e676'; e.currentTarget.style.color = '#00210b'; }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Guest */}
          <button
            onClick={handleGuest}
            style={{
              width: '100%', padding: '10px 0', marginTop: 12,
              background: 'transparent', border: '1px solid #e2e2e2',
              borderRadius: 8, cursor: 'pointer',
              fontSize: 12, color: '#6b7b6c', fontFamily: '"Hanken Grotesk", sans-serif',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f3f4'; e.currentTarget.style.color = '#1a1c1c'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7b6c'; }}
          >
            Continue as Guest (no account needed)
          </button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7b6c', marginTop: 28 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#006d35', fontWeight: 700, textDecoration: 'none' }}>Sign Up →</Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#006d35', fontFamily: '"Hanken Grotesk", sans-serif' }}>Sentivvo</span>
          <span style={s.footerText}>© 2024 Sentivvo Market Intelligence. All rights reserved.</span>
        </div>
        <div style={s.footerLinks}>
          {['Privacy Policy', 'Terms of Service', 'Support', 'Contact'].map(l => (
            <a key={l} href="#" style={s.footerLink}
              onMouseEnter={e => e.currentTarget.style.color = '#006d35'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7b6c'}
            >{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default Login;
