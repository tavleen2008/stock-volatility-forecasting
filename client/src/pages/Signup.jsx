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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006d35" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
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
  main: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' },
  card: {
    width: '100%', maxWidth: 440,
    background: '#fff', border: '1px solid #e2e2e2',
    borderRadius: 16, padding: '40px 40px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  iconWrap: {
    width: 52, height: 52, background: '#006d35',
    borderRadius: 12, display: 'flex', alignItems: 'center',
    justifyContent: 'center', margin: '0 auto 20px',
  },
  heading: { fontSize: 22, fontWeight: 700, color: '#1a1c1c', marginBottom: 6, letterSpacing: '-0.02em', textAlign: 'center' },
  subheading: { fontSize: 13, color: '#6b7b6c', marginBottom: 28, textAlign: 'center' },
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
    fontFamily: '"Hanken Grotesk", sans-serif',
  },
  googleBtn: {
    width: '100%', padding: '11px 0',
    background: '#fff', border: '1px solid #bacbb9',
    borderRadius: 8, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: '#1a1c1c', transition: 'all 0.2s', marginBottom: 24,
    fontFamily: '"Hanken Grotesk", sans-serif',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 24px' },
  divLine: { flex: 1, height: 1, background: '#e2e2e2' },
  divLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7b6c' },
  error: {
    background: '#ffdad6', border: '1px solid #ffb3ae',
    color: '#93000a', borderRadius: 8, padding: '10px 14px',
    fontSize: 13, marginBottom: 20,
  },
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

function strengthOf(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6)  s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

function Signup() {
  const navigate = useNavigate();
  const [step, setStep]         = useState('form'); // 'form' | 'otp'
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [otp, setOtp]           = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setResendMessage('');
    if (!name)                            return setError('Please enter your full name.');
    if (!email)                           return setError('Please enter your email.');
    if (!/\S+@\S+\.\S+/.test(email))      return setError('Enter a valid email address.');
    if (!password || password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm)             return setError('Passwords do not match.');

    setLoading(true);
    const res = await authService.sendCode(name, email, password);
    setLoading(false);
    if (res.success) setStep('otp');
    else setError(res.error || 'Registration failed. Try a different email.');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setResendMessage('');
    if (!otp || otp.length < 4) return setError('Enter the 6-digit code from your email.');
    setLoading(true);
    const res = await authService.verifyAndRegister(email, otp);
    setLoading(false);
    if (res.success) navigate('/dashboard');
    else setError(res.error || 'Invalid code. Check your email and try again.');
  };

  const handleResendCode = async () => {
    setError('');
    setResendMessage('');
    setResendLoading(true);
    const res = await authService.resendCode(email);
    setResendLoading(false);
    if (res.success) {
      setResendMessage(res.message || 'Verification code resent!');
    } else {
      setError(res.error || 'Failed to resend verification code.');
    }
  };

  const handleGoogle = () => {
    setGoogleLoad(true);
    authService.googleAuth();
  };

  const pw = strengthOf(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][pw] || '';
  const strengthColors = ['', '#ba1a1a', '#f59e0b', '#e6c62a', '#006d35', '#00e676'];

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Top bar */}
      <header style={s.topBar}>
        <span style={s.logo} onClick={() => navigate('/')}>Sentivvo</span>
        <Link to="/login" style={{ fontSize: 11, fontWeight: 800, color: '#006d35', textDecoration: 'none', letterSpacing: '0.08em', borderBottom: '2px solid #006d35', paddingBottom: 2 }}>Sign In</Link>
      </header>

      <main style={s.main}>
        {step === 'form' ? (
          <div style={s.card}>
            {/* Brand icon */}
            <div style={s.iconWrap}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h1 style={s.heading}>Create your account</h1>
            <p style={s.subheading}>Join institutional professionals tracking global markets.</p>

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
              {googleLoad ? 'Redirecting…' : 'Sign up with Google'}
            </button>

            <div style={s.divider}>
              <div style={s.divLine} />
              <span style={s.divLabel}>or continue with email</span>
              <div style={s.divLine} />
            </div>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Full Name */}
              <div>
                <label style={s.label} htmlFor="fullname">Full Name</label>
                <input
                  id="fullname" type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Alexander Hamilton"
                  style={s.input} onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              {/* Email */}
              <div>
                <label style={s.label} htmlFor="email">Email Address</label>
                <input
                  id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex@sentivvo.io"
                  style={s.input} onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>

              {/* Password */}
              <div>
                <label style={s.label} htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ ...s.input, paddingRight: 44 }}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7b6c',
                  }}>
                    <EyeIcon open={showPass} />
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, background: '#e2e2e2', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: strengthColors[pw] || '#e2e2e2',
                        width: `${(pw / 5) * 100}%`,
                        transition: 'all 0.3s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: strengthColors[pw], fontFamily: '"Hanken Grotesk", sans-serif' }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label style={s.label} htmlFor="confirm">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirm" type="password" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      ...s.input,
                      paddingRight: 44,
                      borderColor: confirm && confirm !== password ? '#ba1a1a' : '#e2e2e2',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#006d35'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(0,109,53,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = confirm && confirm !== password ? '#ba1a1a' : '#e2e2e2'; e.target.style.background = '#f3f3f4'; e.target.style.boxShadow = 'none'; }}
                  />
                  {confirm && confirm === password && (
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                      <CheckIcon />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ ...s.primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#006d35'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#00e676'; e.currentTarget.style.color = '#00210b'; }}
              >
                {loading ? 'Sending code…' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7b6c', marginTop: 24 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#006d35', fontWeight: 700, textDecoration: 'none' }}>Log In →</Link>
            </p>

            <div style={{ borderTop: '1px solid #e2e2e2', marginTop: 20, paddingTop: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#6b7b6c', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.6, fontFamily: '"Hanken Grotesk", sans-serif' }}>
                By signing up, you agree to our{' '}
                <a href="#" style={{ color: '#006d35', textDecoration: 'underline' }}>Terms of Service</a>
                {' '}and{' '}
                <a href="#" style={{ color: '#006d35', textDecoration: 'underline' }}>Privacy Policy</a>.
              </p>
            </div>
          </div>
        ) : (
          /* ── OTP Step ── */
          <div style={s.card}>
            <div style={{ ...s.iconWrap, background: 'linear-gradient(135deg, #006d35, #00e676)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 style={s.heading}>Check your email</h1>
            <p style={{ ...s.subheading, marginBottom: 28 }}>
              We sent a 6-digit verification code to{' '}
              <strong style={{ color: '#1a1c1c' }}>{email}</strong>
            </p>

            {error && <div style={s.error}>⚠ {error}</div>}
            {resendMessage && (
              <div style={{ ...s.error, background: '#e8f5e9', border: '1px solid #c8e6c9', color: '#2e7d32' }}>
                ✓ {resendMessage}
              </div>
            )}

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={s.label} htmlFor="otp">Verification Code</label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  style={{
                    ...s.input,
                    textAlign: 'center',
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: '0.5em',
                    fontFamily: '"JetBrains Mono", monospace',
                    padding: '16px 14px',
                  }}
                  onFocus={inputFocus} onBlur={inputBlur}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{ ...s.primaryBtn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#006d35'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = '#00e676'; e.currentTarget.style.color = '#00210b'; }}
              >
                {loading ? 'Verifying…' : 'Verify & Continue →'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendLoading}
              style={{
                width: '100%', marginTop: 12,
                background: 'transparent', border: '1px solid #006d35',
                borderRadius: 8,
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#006d35', padding: '12px 0',
                fontFamily: '"Hanken Grotesk", sans-serif',
                transition: 'all 0.2s',
                opacity: resendLoading ? 0.7 : 1
              }}
              onMouseEnter={e => { if (!resendLoading) { e.currentTarget.style.background = '#006d35'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#006d35'; }}
            >
              {resendLoading ? 'Resending…' : 'Resend Code'}
            </button>

            <button
              onClick={() => setStep('form')}
              style={{
                width: '100%', marginTop: 12,
                background: 'transparent', border: 'none',
                cursor: 'pointer', fontSize: 13, color: '#6b7b6c',
                fontFamily: '"Hanken Grotesk", sans-serif', padding: '8px 0',
              }}
            >
              ← Back to sign up
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#f3f3f4', borderTop: '1px solid #e2e2e2',
        padding: '20px 24px',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#006d35', fontFamily: '"Hanken Grotesk", sans-serif' }}>Sentivvo</span>
          <span style={{ fontSize: 12, color: '#6b7b6c', fontFamily: '"Hanken Grotesk", sans-serif' }}>© 2024 Sentivvo Market Intelligence. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy Policy', 'Terms of Service', 'Support', 'Contact'].map(l => (
            <a key={l} href="#" style={{ fontSize: 12, color: '#6b7b6c', textDecoration: 'none', fontFamily: '"Hanken Grotesk", sans-serif' }}
              onMouseEnter={e => e.currentTarget.style.color = '#006d35'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7b6c'}
            >{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default Signup;
