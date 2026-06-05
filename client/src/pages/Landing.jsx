import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Ticker data ───────────────────────────────────────────── */
const TICKERS = [
  { sym: 'AAPL', label: '+2.94%', up: true },
  { sym: 'NVDA', label: '+5.21%', up: true },
  { sym: 'MSFT', label: '-0.56%', up: false },
  { sym: 'TSLA', label: '+1.83%', up: true },
  { sym: 'VIX',  label: '+12.4%', up: true },
  { sym: 'SPY',  label: '88th Percentile', up: null },
  { sym: 'QQQ',  label: 'Implied Vol 22.1', up: null },
  { sym: 'BTC',  label: '30D Skew -1.2', up: true },
  { sym: 'HYG',  label: 'Spread 312bps', up: null },
];

/* ─── Scroll animation hook ─────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('sv-visible');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.sv-reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ─── Ticker Bar ────────────────────────────────────────────── */
function TickerBar() {
  const items = [...TICKERS, ...TICKERS, ...TICKERS];
  return (
    <div style={{
      overflow: 'hidden',
      background: '#f3f3f4',
      borderBottom: '1px solid #d6e8d7',
      display: 'flex',
      alignItems: 'center',
      height: '40px',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        animation: 'sv-ticker 40s linear infinite',
        whiteSpace: 'nowrap',
      }}>
        {items.map((t, i) => (
          <span key={i} style={{
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '11px',
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            <span style={{ color: '#3b4a3d' }}>{t.sym}</span>
            <span style={{
              color: t.up === null ? '#505f76' : t.up ? '#006d35' : '#ba1a1a',
            }}>{t.label} {t.up === true ? '↑' : t.up === false ? '↓' : ''}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Navbar ────────────────────────────────────────────────── */
function Navbar({ onLogin, onSignup, activeSection }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'Features', id: 'features' },
    { label: 'How it Works', id: 'how-it-works' },
    { label: 'For Investors', id: 'for-investors' },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(14px)',
      borderBottom: scrolled ? '1px solid rgba(0,109,53,0.12)' : '1px solid rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      boxShadow: scrolled ? '0 2px 20px rgba(0,109,53,0.06)' : 'none',
    }}>
      <nav style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 32px',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#006d35',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0,109,53,0.3)',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>S</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1c1c', letterSpacing: '-0.02em', fontFamily: '"Hanken Grotesk", sans-serif' }}>Sentivvo</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 36 }}>
          {links.map(({ label, id }) => (
            <a
              key={id}
              href={`#${id}`}
              style={{
                color: activeSection === id ? '#006d35' : '#3b4a3d',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: activeSection === id ? 600 : 500,
                fontFamily: '"Hanken Grotesk", sans-serif',
                position: 'relative',
                paddingBottom: 4,
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#006d35'}
              onMouseLeave={e => e.currentTarget.style.color = activeSection === id ? '#006d35' : '#3b4a3d'}
            >
              {label}
              {activeSection === id && (
                <span style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: 2, background: '#006d35', borderRadius: 1,
                }} />
              )}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={onLogin}
            style={{
              background: 'transparent', color: '#1a1c1c',
              border: '1px solid #bacbb9', padding: '9px 20px',
              borderRadius: 8, cursor: 'pointer', fontSize: 14,
              fontWeight: 600, fontFamily: '"Hanken Grotesk", sans-serif',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f3f4'; e.currentTarget.style.borderColor = '#006d35'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#bacbb9'; }}
          >
            Login
          </button>
          <button
            onClick={onSignup}
            style={{
              background: 'linear-gradient(135deg, #006d35, #00e676)',
              color: '#fff',
              border: 'none', padding: '10px 22px',
              borderRadius: 8, cursor: 'pointer', fontSize: 14,
              fontWeight: 700, fontFamily: '"Hanken Grotesk", sans-serif',
              boxShadow: '0 4px 16px rgba(0,109,53,0.35)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,109,53,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,109,53,0.35)'; }}
          >
            Get Started
          </button>
        </div>
      </nav>
    </header>
  );
}

/* ─── Section: Hero ─────────────────────────────────────────── */
function HeroSection({ onSignup, onLogin }) {
  return (
    <section style={{
      minHeight: 'calc(100vh - 112px)',
      display: 'grid',
      gridTemplateColumns: '1.1fr 1fr',
      gap: 80,
      alignItems: 'center',
      maxWidth: 1280,
      margin: '0 auto',
      padding: '80px 32px 80px',
      position: 'relative',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '40%', height: '60%',
        background: 'radial-gradient(circle at top right, rgba(0,109,53,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        width: '30%', height: '40%',
        background: 'radial-gradient(circle at bottom left, rgba(0,230,118,0.04), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Left */}
      <div className="sv-reveal" style={{ zIndex: 1 }}>
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: '#006d35',
          marginBottom: 24, fontFamily: '"Hanken Grotesk", sans-serif',
        }}>
          Market Intelligence Platform
        </div>
        <h1 style={{
          fontSize: 'clamp(48px, 5vw, 72px)',
          lineHeight: 1.08,
          fontWeight: 800,
          color: '#1a1c1c',
          letterSpacing: '-0.04em',
          marginBottom: 28,
          fontFamily: '"Hanken Grotesk", sans-serif',
        }}>
          Predict Volatility.<br />
          <span style={{ color: '#006d35' }}>Trade Smarter.</span>
        </h1>
        <p style={{
          color: '#3b4a3d',
          fontSize: 18,
          lineHeight: 1.8,
          maxWidth: 560,
          marginBottom: 44,
          fontFamily: '"Hanken Grotesk", sans-serif',
        }}>
          Sentivvo combines real-time market data, volatility forecasting models and financial news sentiment analysis to help investors understand risk before it happens.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 40, marginBottom: 44 }}>
          {[
            { val: '4', label: 'Live Symbols' },
            { val: '3mo', label: 'Deep History' },
            { val: 'RSI+Vol', label: 'Vol Engine' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#006d35', fontFamily: '"JetBrains Mono", monospace' }}>{val}</div>
              <div style={{ fontSize: 11, color: '#6b7b6c', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: '"Hanken Grotesk", sans-serif' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={onSignup}
            style={{
              background: '#006d35',
              color: '#fff',
              border: 'none', padding: '14px 32px',
              borderRadius: 10, cursor: 'pointer',
              fontSize: 16, fontWeight: 700,
              fontFamily: '"Hanken Grotesk", sans-serif',
              boxShadow: '0 6px 20px rgba(0,109,53,0.35)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,109,53,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,109,53,0.35)'; }}
          >
            Start For Free
          </button>
          <button
            onClick={onLogin}
            style={{
              background: 'transparent',
              color: '#1a1c1c',
              border: '1px solid #bacbb9', padding: '14px 32px',
              borderRadius: 10, cursor: 'pointer',
              fontSize: 16, fontWeight: 600,
              fontFamily: '"Hanken Grotesk", sans-serif',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f3f4'; e.currentTarget.style.borderColor = '#006d35'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#bacbb9'; }}
          >
            Request Demo
          </button>
        </div>
      </div>

      {/* Right: Live sample widget */}
      <div className="sv-reveal" style={{ zIndex: 1 }}>
        <div style={{
          background: '#fff',
          border: '1px solid #e2e2e2',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 20px 60px -15px rgba(0,109,53,0.15), 0 4px 20px rgba(0,0,0,0.06)',
        }}>
          {/* Widget header */}
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e2e2',
            background: '#f9f9f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7b6c', fontFamily: '"Hanken Grotesk", sans-serif' }}>LIVE SAMPLE</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e2e2', borderRadius: 6, padding: '3px 10px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#006d35', animation: 'sv-pulse 2s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1a1c1c', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' }}>AAPL</span>
              </div>
            </div>
            <span style={{ fontSize: 20, color: '#6b7b6c' }}>⋮</span>
          </div>

          {/* Simulated price chart */}
          <div style={{ position: 'relative', height: 180, background: '#fff', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.3,
              backgroundImage: 'radial-gradient(#bacbb9 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
            <svg width="100%" height="100%" viewBox="0 0 400 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006d35" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#006d35" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,140 Q60,120 100,130 T180,90 T270,70 T360,40 T400,30" stroke="#006d35" strokeWidth="2.5" fill="none" />
              <path d="M0,140 Q60,120 100,130 T180,90 T270,70 T360,40 T400,30 V180 H0 Z" fill="url(#heroGrad)" />
            </svg>
            <div style={{ position: 'absolute', top: 16, right: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1c1c', fontFamily: '"JetBrains Mono", monospace' }}>$189.43</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#006d35', letterSpacing: '0.08em', fontFamily: '"Hanken Grotesk", sans-serif' }}>+1.24% today</div>
            </div>
          </div>

          {/* Data table */}
          <div style={{ padding: '16px 24px 20px' }}>
            {[
              { label: 'Historical Volatility (Ann.)', value: '28.4%', color: '#1a1c1c' },
              { label: 'RSI (14-period)', value: '42.1', color: '#1a1c1c' },
              { label: '5-Day Expected Range', value: '$178 — $195', color: '#1a1c1c' },
              { label: 'Signal', value: '↑ Bullish', color: '#006d35' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid rgba(186,203,185,0.4)',
              }}>
                <span style={{ fontSize: 13, color: '#3b4a3d', fontFamily: '"Hanken Grotesk", sans-serif' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '-0.01em' }}>{value}</span>
              </div>
            ))}
            <button
              onClick={onSignup}
              style={{
                width: '100%', marginTop: 16,
                padding: '11px 0',
                background: '#f3f3f4', border: '1px solid #e2e2e2',
                borderRadius: 8, cursor: 'pointer',
                fontSize: 11, fontWeight: 800,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#1a1c1c', fontFamily: '"Hanken Grotesk", sans-serif',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#006d35'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#006d35'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f3f3f4'; e.currentTarget.style.color = '#1a1c1c'; e.currentTarget.style.borderColor = '#e2e2e2'; }}
            >
              Expand Analysis →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Section: How It Works ─────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    { num: '01', icon: '⬡', title: 'Connect Market Data', desc: 'Seamlessly ingest raw feeds from global exchanges and sentiment pools.' },
    { num: '02', icon: '⬡', title: 'Run Volatility Engine', desc: 'Execute sophisticated GARCH and Monte Carlo simulations in real-time.' },
    { num: '03', icon: '⬡', title: 'Read the Signal', desc: 'Receive high-conviction alerts translated into clear directional bias.' },
    { num: '04', icon: '⬡', title: 'Make Decisions', desc: 'Allocate capital with institutional-grade confidence and risk control.' },
  ];
  return (
    <section id="how-it-works" style={{
      padding: '96px 32px',
      background: '#f3f3f4',
      borderTop: '1px solid #e2e2e2',
      borderBottom: '1px solid #e2e2e2',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="sv-reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#006d35', marginBottom: 16, fontFamily: '"Hanken Grotesk", sans-serif' }}>How It Works</div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 700, color: '#1a1c1c', letterSpacing: '-0.03em', marginBottom: 16, fontFamily: '"Hanken Grotesk", sans-serif' }}>The Intelligence Pipeline</h2>
          <p style={{ color: '#3b4a3d', fontSize: 16, maxWidth: 560, margin: '0 auto', fontFamily: '"Hanken Grotesk", sans-serif' }}>
            Our proprietary engine processes billions of data points to deliver actionable signals in milliseconds.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 32,
          position: 'relative',
        }}>
          {steps.map((step, i) => (
            <div key={step.num} className="sv-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{
                  width: 64, height: 64,
                  background: i === 3 ? '#006d35' : '#fff',
                  border: `1px solid ${i === 3 ? '#006d35' : '#e2e2e2'}`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24,
                  boxShadow: i === 3 ? '0 4px 16px rgba(0,109,53,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                }}
              >
                <span style={{ fontSize: 22, color: i === 3 ? '#fff' : '#006d35' }}>
                  {['⬡', '◈', '◎', '◆'][i]}
                </span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#006d35', marginBottom: 10, fontFamily: '"Hanken Grotesk", sans-serif' }}>Step {step.num}</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1a1c1c', marginBottom: 12, fontFamily: '"Hanken Grotesk", sans-serif' }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: '#3b4a3d', lineHeight: 1.7, fontFamily: '"Hanken Grotesk", sans-serif' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Section: Features ─────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    { icon: '◈', title: 'Predictive Analytics', desc: 'Forecast volatility using statistical models trained on historical OHLCV data with annualised vol, RSI, and momentum signals.' },
    { icon: '◉', title: 'Sentiment Intelligence', desc: 'Real-time financial news — track market narratives and sentiment shifts that precede price movements with high precision.' },
    { icon: '▣', title: 'Unified Dashboard', desc: 'All your volatility forecasts, portfolio holdings, live prices, and risk signals in one premium light-mode interface.' },
    { icon: '◆', title: 'Secure by Design', desc: 'JWT + refresh token auth, Google OAuth, email OTP verification. Your data stays yours with institutional encryption standards.' },
    { icon: '◎', title: 'Live Market Data', desc: 'Live quotes, 52-week ranges, OHLCV history with 1D / 1M / 1Y timeframe selector for comprehensive asset analysis.' },
    { icon: '◱', title: 'Portfolio Tracker', desc: 'Track your holdings with live P&L, today\'s % change, distribution pie chart, and 30-day performance curve.' },
  ];
  return (
    <section id="features" style={{
      padding: '96px 32px',
      background: '#fff',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="sv-reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#006d35', marginBottom: 16, fontFamily: '"Hanken Grotesk", sans-serif' }}>Platform Features</div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 56px)', fontWeight: 700, color: '#1a1c1c', letterSpacing: '-0.03em', marginBottom: 16, fontFamily: '"Hanken Grotesk", sans-serif' }}>
            Everything You Need to <span style={{ color: '#006d35' }}>Trade Smarter</span>
          </h2>
          <p style={{ color: '#3b4a3d', fontSize: 16, maxWidth: 600, margin: '0 auto', fontFamily: '"Hanken Grotesk", sans-serif', opacity: 0.8 }}>
            Institutional-grade analytics and sentiment intelligence tailored for the modern data-driven investor.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="sv-reveal sv-feature-card"
              style={{
                background: '#fff',
                border: '1px solid #e2e2e2',
                borderRadius: 14,
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                cursor: 'default',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#006d35';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,109,53,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e2e2e2';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 48, height: 48,
                background: '#f3f3f4',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
                color: '#006d35',
              }}>{f.icon}</div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#1a1c1c', marginBottom: 10, fontFamily: '"Hanken Grotesk", sans-serif' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#3b4a3d', lineHeight: 1.7, fontFamily: '"Hanken Grotesk", sans-serif' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Section: For Investors ────────────────────────────────── */
function ForInvestorsSection({ onSignup }) {
  const personas = [
    {
      icon: '◉',
      title: 'Retail Investors',
      desc: 'Democratizing professional-grade volatility tools to level the playing field against institutional giants.',
      tags: ['Risk Analysis', 'Portfolio Health'],
      span: 8,
    },
    {
      icon: '◈',
      title: 'Active Traders',
      desc: 'Low-latency volatility signals for day traders and scalpers seeking the edge in rapid price discovery phases.',
      span: 4,
    },
    {
      icon: '◆',
      title: 'Finance Students',
      desc: 'Bridge the gap between academic theory and live market execution with our sandbox environments.',
      span: 4,
    },
    {
      icon: '◎',
      title: 'Researchers',
      desc: 'Deep-dive into historical datasets and alternative data pools with our comprehensive API and export tools.',
      tags: ['Historical Replay', 'API Access'],
      span: 8,
    },
  ];

  return (
    <section id="for-investors" style={{
      padding: '96px 32px',
      background: '#f9f9f9',
      borderTop: '1px solid #e2e2e2',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="sv-reveal" style={{ marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#006d35', marginBottom: 16, fontFamily: '"Hanken Grotesk", sans-serif' }}>For Investors</div>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 700, color: '#1a1c1c', letterSpacing: '-0.03em', marginBottom: 12, fontFamily: '"Hanken Grotesk", sans-serif' }}>Who Sentivvo is Built For</h2>
          <p style={{ fontSize: 16, color: '#3b4a3d', fontFamily: '"Hanken Grotesk", sans-serif' }}>Precision tools for every tier of the financial ecosystem.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'auto auto',
          gap: 24,
        }}>
          {personas.map((p, i) => (
            <div
              key={p.title}
              className="sv-reveal"
              style={{
                gridColumn: `span ${p.span || 4}`,
                background: '#fff',
                border: '1px solid #e2e2e2',
                borderRadius: 14,
                padding: '32px',
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#006d35'; e.currentTarget.style.boxShadow = '0 8px 30px -10px rgba(0,109,53,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e2e2'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{
                width: 48, height: 48, background: '#f3f3f4',
                borderRadius: 10, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, color: '#006d35',
                marginBottom: 24,
              }}>{p.icon}</div>
              <h3 style={{ fontSize: p.span === 8 ? 28 : 20, fontWeight: 600, color: '#1a1c1c', marginBottom: 12, fontFamily: '"Hanken Grotesk", sans-serif' }}>{p.title}</h3>
              <p style={{ fontSize: p.span === 8 ? 16 : 14, color: '#3b4a3d', lineHeight: 1.7, fontFamily: '"Hanken Grotesk", sans-serif', flex: 1 }}>{p.desc}</p>
              {p.tags && (
                <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                  {p.tags.map(t => (
                    <span key={t} style={{
                      padding: '4px 12px', background: '#f3f3f4',
                      borderRadius: 6, fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: '#3b4a3d', fontFamily: '"Hanken Grotesk", sans-serif',
                    }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="sv-reveal" style={{ textAlign: 'center', marginTop: 80 }}>
          <div style={{
            background: '#006d35',
            borderRadius: 20,
            padding: '64px 48px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: '50%', height: '100%',
              background: 'radial-gradient(circle at 80% 50%, rgba(0,230,118,0.15), transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 20, fontFamily: '"Hanken Grotesk", sans-serif' }}>Ready to Start?</div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16, fontFamily: '"Hanken Grotesk", sans-serif' }}>
              Your edge starts here. Free. Forever.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, maxWidth: 480, margin: '0 auto 36px', fontFamily: '"Hanken Grotesk", sans-serif', lineHeight: 1.7 }}>
              Create a free account to unlock live volatility forecasts, portfolio tracking, and financial news — all in one dashboard.
            </p>
            <button
              onClick={onSignup}
              style={{
                background: '#fff',
                color: '#006d35',
                border: 'none', padding: '14px 36px',
                borderRadius: 10, cursor: 'pointer',
                fontSize: 16, fontWeight: 800,
                fontFamily: '"Hanken Grotesk", sans-serif',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
            >
              Get Started — It's Free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      background: '#fff',
      borderTop: '1px solid #e2e2e2',
      padding: '32px',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'space-between', alignItems: 'center',
        gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: '#006d35',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>S</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1c1c', fontFamily: '"Hanken Grotesk", sans-serif' }}>Sentivvo</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
          {['Privacy Policy', 'Terms of Service', 'Legal Disclaimer', 'Contact Us'].map(l => (
            <a key={l} href="#" style={{ color: '#6b7b6c', textDecoration: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: '"Hanken Grotesk", sans-serif', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#1a1c1c'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7b6c'}
            >{l}</a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#6b7b6c', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: '"Hanken Grotesk", sans-serif' }}>
          © 2024 Sentivvo Market Intelligence. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ─── Main Export ───────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('');
  useScrollReveal();

  // Track active section on scroll
  useEffect(() => {
    const sections = ['features', 'how-it-works', 'for-investors'];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{
      background: '#f9f9f9',
      color: '#1a1c1c',
      minHeight: '100vh',
      overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

        @keyframes sv-ticker {
          0%   { transform: translate3d(0,0,0); }
          100% { transform: translate3d(-33.333%,0,0); }
        }
        @keyframes sv-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes sv-fadeup {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sv-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .sv-reveal.sv-visible {
          opacity: 1;
          transform: translateY(0);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { cursor: pointer; }
        button { font-family: inherit; }
      `}</style>

      <TickerBar />
      <Navbar
        onLogin={() => navigate('/login')}
        onSignup={() => navigate('/signup')}
        activeSection={activeSection}
      />

      <HeroSection
        onSignup={() => navigate('/signup')}
        onLogin={() => navigate('/login')}
      />

      <HowItWorksSection />
      <FeaturesSection />
      <ForInvestorsSection onSignup={() => navigate('/signup')} />
      <Footer />
    </div>
  );
}
