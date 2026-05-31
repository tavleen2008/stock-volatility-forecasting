import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Scrolling Ticker ───────────────────────────────────────────── */
const TICKERS = [
  { sym: 'SPY', label: '88th Percentile', up: true },
  { sym: 'VIX', label: '+12.4%', up: true },
  { sym: 'QQQ', label: 'Implied Vol 22.1', up: false },
  { sym: 'BTC', label: '30D Skew -1.2', up: true },
  { sym: 'HYG', label: 'Spread 312bps', neutral: true },
  { sym: 'AAPL', label: '+2.94%', up: true },
  { sym: 'NVDA', label: '+5.21%', up: true },
  { sym: 'MSFT', label: '-0.56%', up: false },
  { sym: 'TSLA', label: '+1.83%', up: true },
];

function TickerBar() {
  const items = [...TICKERS, ...TICKERS];
  return (
    <div
      className="ticker-wrap"
      style={{
        overflow: 'hidden',
        background: 'rgba(14,14,14,0.95)',
        borderBottom: '1px solid rgba(53,53,52,0.5)',
        display: 'flex',
        alignItems: 'center',
        height: '40px',
        width: '100%',
      }}
    >
      <div
        className="ticker-inner"
        style={{
          display: 'flex',
          animation: 'tickerScroll 30s linear infinite',
          whiteSpace: 'nowrap',
        }}
      >
        {items.map((t, i) => (
          <span
            key={i}
            style={{
              padding: '0 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '12px',
              fontFamily: 'monospace',
              letterSpacing: '-0.01em',
              color: '#c8c6c5',
            }}
          >
            <span style={{ color: '#535352' }}>/</span>
            <span style={{ fontWeight: 600 }}>{t.sym}</span>
            <span
              style={{
                color: t.neutral ? '#8e9379' : t.up ? '#c3f400' : '#ffb4ab',
              }}
            >
              {t.label}
            </span>
            <span
              style={{
                color: t.neutral ? '#8e9379' : t.up ? '#c3f400' : '#ffb4ab',
                fontSize: '11px',
              }}
            >
              {t.neutral ? '—' : t.up ? '↑' : '↓'}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Glassmorphism Feature Card ─────────────────────────────────── */
function GlassCard({ icon, title, desc }) {
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '14px',
        padding: '28px',
        transition: 'all .25s ease',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#334155';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1f2937';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: '#0f172a',
          border: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          fontSize: 22
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          color: '#fff',
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 10
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: '#94a3b8',
          lineHeight: 1.7,
          fontSize: 14
        }}
      >
        {desc}
      </p>
    </div>
  );
}

/* ─── Step Item ──────────────────────────────────────────────────── */
function StepItem({ num, title, desc, isLast }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: isLast ? 0 : 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(195,244,0,0.1)',
            border: '1px solid rgba(195,244,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#c3f400',
            flexShrink: 0,
            fontFamily: 'monospace',
          }}
        >
          {num}
        </div>
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: 1,
              background: 'linear-gradient(to bottom, rgba(195,244,0,0.2), transparent)',
              minHeight: 32,
              marginTop: 8,
            }}
          />
        )}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 32 }}>
        <h4
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#e5e2e1',
            marginBottom: 6,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h4>
        <p style={{ fontSize: 13, color: '#8e9379', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────── */
function LandingNav({ onLogin, onSignup }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled
          ? 'rgba(11,15,20,0.95)'
          : 'rgba(11,15,20,0.75)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid transparent',
        transition: 'all .25s ease'
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px'
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 800
            }}
          >
            S
          </div>

          <span
            style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: 16
            }}
          >
            Sentivvo
          </span>
        </div>

        {/* Links */}
        <div
          style={{
            display: 'flex',
            gap: 32,
            color: '#94a3b8',
            fontSize: 14
          }}
        >
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>
            Features
          </a>

          <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>
            How it Works
          </a>

          <a href="#for-you" style={{ color: 'inherit', textDecoration: 'none' }}>
            For Investors
          </a>
        </div>

        {/* CTA */}
        <div
          style={{
            display: 'flex',
            gap: 12
          }}
        >
          <button
            onClick={onLogin}
            style={{
              background: 'transparent',
              color: '#fff',
              border: '1px solid #334155',
              padding: '10px 18px',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            Login
          </button>

          <button
            onClick={onSignup}
            style={{
              background: '#22c55e',
              color: '#000',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Main Landing Page ──────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '📊',
      title: 'Predictive Analytics',
      desc: 'Forecast volatility using statistical models trained on historical OHLCV data with annualised vol, RSI, and momentum signals.',
    },
    {
      icon: '📰',
      title: 'Sentiment Intelligence',
      desc: 'Real-time financial news — track market narratives and sentiment shifts that precede price movements.',
    },
    {
      icon: '⚡',
      title: 'Unified Dashboard',
      desc: 'All your volatility forecasts, portfolio holdings, live prices, and risk signals in one premium dark-mode interface.',
    },
    {
      icon: '🛡',
      title: 'Secure by Design',
      desc: 'JWT + refresh token auth, Google OAuth, email OTP verification. Your data stays yours.',
    },
    {
      icon: '📡',
      title: 'Live Market Data',
      desc: 'Live quotes, 52-week ranges, OHLCV history with 1D / 1M / 1Y timeframe selector.',
    },
    {
      icon: '💼',
      title: 'Portfolio Tracker',
      desc: 'Track your holdings with live P&L, today\'s % change, distribution pie chart, and 30-day performance curve.',
    },
  ];

  const steps = [
    { num: '01', title: 'Connect Market Data', desc: 'Live OHLCV feeds power every chart — no API key, no delays.' },
    { num: '02', title: 'Run Volatility Engine', desc: 'Annualised historical vol, RSI, SMA-20/50, and trend computed on 3-month price history.' },
    { num: '03', title: 'Read the Signal', desc: 'Bullish / Bearish / Neutral signal badge with expected price range (±1 SD, 5 & 30 day).' },
    { num: '04', title: 'Make Decisions', desc: 'Navigate your portfolio, read breaking news, and act — all from one premium interface.' },
  ];

  const personas = [
    { name: 'Retail Investors', desc: 'Manage personal portfolios with institutional-grade volatility risk insights.' },
    { name: 'Active Traders', desc: 'Exploit market fluctuations and optimise entry/exit points before movements.' },
    { name: 'Finance Students', desc: 'Learn structural market risks and study volatility models visually with real data.' },
    { name: 'Researchers', desc: 'Analyse historical vol correlations across multiple timeframes and symbols.' },
  ];

  const stats = [
    { val: '4', label: 'Live Symbols' },
    { val: '3mo', label: 'Deep History' },
    { val: 'Real-Time', label: 'Market Feed' },
    { val: 'RSI+Vol', label: 'Vol Engine' },
  ];

  return (
    <div
      style={{
        background: '#131313',
        color: '#e5e2e1',
        fontFamily: 'Inter, system-ui, sans-serif',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* CSS animations injected via style tag */}
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .glass-card {
          background: rgba(26, 26, 26, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(53, 53, 52, 0.5);
          border-radius: 12px;
          padding: 28px;
          transition: all 0.3s ease;
          cursor: default;
        }
        .glass-card:hover {
          border-color: rgba(195, 244, 0, 0.3);
          background: rgba(26, 26, 26, 0.7);
          transform: translateY(-3px);
          box-shadow: 0 16px 40px -10px rgba(195, 244, 0, 0.06);
        }
        .persona-card {
          background: rgba(26,26,26,0.3);
          border: 1px solid rgba(53, 53, 52, 0.5);
          border-radius: 12px;
          padding: 28px;
          transition: all 0.3s ease;
        }
        .persona-card:hover {
          border-color: rgba(195,244,0,0.3);
          background: rgba(26,26,26,0.6);
        }
        .fade-up {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .label-caps {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #abd600;
        }
      `}</style>

      {/* Ticker */}
      <TickerBar />

      {/* Navbar */}
      <LandingNav onLogin={() => navigate('/login')} onSignup={() => navigate('/signup')} />

      {/* ── HERO ── */}
      <section
  style={{
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    alignItems: 'center',
    gap: '80px',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '140px 48px 100px',
    position: 'relative'
  }}
>
  {/* Left Side */}
  <div>
    <div
      style={{
        color: '#22c55e',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: '24px'
      }}
    >
      Market Intelligence Platform
    </div>

    <h1
      style={{
        fontSize: '76px',
        lineHeight: 1,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '-0.05em',
        marginBottom: '28px'
      }}
    >
      Predict
      <br />
      Volatility.
      <br />
      Trade Smarter.
    </h1>

    <p
      style={{
        color: '#94a3b8',
        fontSize: '18px',
        lineHeight: 1.8,
        maxWidth: '620px',
        marginBottom: '40px'
      }}
    >
      Sentivvo combines real-time market data,
      volatility forecasting models and financial
      news sentiment analysis to help investors
      understand risk before it happens.
    </p>

    <div
      style={{
        display: 'flex',
        gap: '14px'
      }}
    >
      <button
        onClick={() => navigate('/signup')}
        style={{
          background: '#22c55e',
          color: '#000',
          border: 'none',
          padding: '14px 28px',
          borderRadius: '10px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        Start For Free
      </button>

      <button
        onClick={() => navigate('/login')}
        style={{
          background: 'transparent',
          color: '#fff',
          border: '1px solid #334155',
          padding: '14px 28px',
          borderRadius: '10px',
          cursor: 'pointer'
        }}
      >
        Login
      </button>
    </div>
  </div>

  {/* Right Side */}
  <div
    style={{
      background: '#111827',
      border: '1px solid #1f2937',
      borderRadius: '18px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
    }}
  >
    <img
      src="/dashboard-preview.png"
      alt="dashboard"
      style={{
        width: '100%',
        display: 'block'
      }}
    />
  </div>
</section>

      {/* ── ABOUT / SPLIT CARD ── */}
      <section
        id="about"
        style={{
          padding: '96px 24px',
          borderTop: '1px solid rgba(53,53,52,0.5)',
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 0,
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(53,53,52,0.5)',
          }}
        >
          {/* Left */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(32,31,31,0.8) 0%, rgba(19,19,19,0.9) 100%)',
              borderRight: '1px solid rgba(53,53,52,0.5)',
              padding: '56px 48px',
            }}
          >
            <div className="label-caps" style={{ marginBottom: 16 }}>The Volatility Problem</div>
            <h2
            style={{
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-0.04em',
    color: '#fff',
    marginBottom: 24
  }}
  >
  Market volatility
  <br />
  shouldn't surprise you.
</h2>
            <p style={{ fontSize: 16,lineHeight: 1.8,color: '#94a3b8'}}>
              Markets react instantly to macro events,
              earnings announcements and news cycles.

              Sentivvo helps investors identify volatility
              patterns before they become obvious.</p>
            <p style={{ fontSize: 14, color: '#8e9379', lineHeight: 1.7 }}>
              Sentivvo couples{' '}
              <strong style={{ color: '#c4c9ac' }}>statistical volatility models</strong> with live{' '}
              <strong style={{ color: '#c4c9ac' }}>real-time market feeds</strong> to build
              forward-looking probability ranges — so you prepare instead of react.
            </p>
          </div>

          {/* Right — live sample card */}
          <div
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(28,27,27,0.8) 0%, rgba(14,14,14,0.9) 100%)',
              padding: '56px 48px',
            }}
          >
            {/* Glow top-right */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 240,
                height: 240,
                background: 'radial-gradient(circle at top right, rgba(195,244,0,0.06), transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 32,
              }}
            >
              <div className="label-caps">Live Sample</div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: '#c3f400',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#c3f400',
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }}
                />
                AAPL
              </span>
            </div>

            {[
              { label: 'Historical Volatility (Ann.)', value: '28.4%', color: '#f59e0b' },
              { label: 'RSI (14-period)', value: '42.1', color: '#c4c9ac' },
              { label: '5-Day Expected Range', value: '$178 – $195', color: '#c3f400' },
              { label: 'Signal', value: '↑ Bullish', color: '#c3f400' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: '1px solid rgba(53,53,52,0.4)',
                }}
              >
                <span style={{ fontSize: 13, color: '#8e9379' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace', letterSpacing: '-0.01em' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="features"
        style={{
          padding: '96px 24px',
          borderTop: '1px solid rgba(53,53,52,0.5)',
        }}
      >
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="label-caps" style={{ marginBottom: 16 }}>Platform Features</div>
            <h2
              style={{
                fontSize: 'clamp(28px, 3vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#ffffff',
              }}
            >
              Everything You Need to Trade Smarter
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {features.map((f, i) => (
              <GlassCard key={f.title} {...f} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        style={{
          padding: '96px 24px',
          borderTop: '1px solid rgba(53,53,52,0.5)',
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 64,
            alignItems: 'start',
          }}
        >
          <div>
            <div className="label-caps" style={{ marginBottom: 16 }}>How It Works</div>
            <h2
              style={{
                fontSize: 'clamp(28px, 3vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                lineHeight: 1.2,
                marginBottom: 20,
              }}
            >
              From Raw Data to Actionable Signal
            </h2>
            <p style={{ fontSize: 14, color: '#8e9379', lineHeight: 1.7 }}>
              Our four-step pipeline turns thousands of price ticks and news articles into a single,
              clear forecast — updated every time you load the app.
            </p>
          </div>
          <div>
            {steps.map((s, i) => (
              <StepItem key={s.num} {...s} isLast={i === steps.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section
        id="for-you"
        style={{
          padding: '96px 24px',
          borderTop: '1px solid rgba(53,53,52,0.5)',
          background: 'rgba(14,14,14,0.5)',
        }}
      >
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="label-caps" style={{ marginBottom: 16 }}>Who It's For</div>
            <h2
              style={{
                fontSize: 'clamp(28px, 3vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#ffffff',
              }}
            >
              Built for Every Market Participant
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
            }}
          >
            {personas.map((p) => (
              <div key={p.name} className="persona-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '2px solid #c3f400',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 10,
                      color: '#c3f400',
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e5e2e1', letterSpacing: '-0.01em' }}>
                    {p.name}
                  </h3>
                </div>
                <p style={{ fontSize: 13, color: '#8e9379', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          position: 'relative',
          padding: '96px 24px',
          borderTop: '1px solid rgba(53,53,52,0.5)',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(195,244,0,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 560, margin: '0 auto' }}>
          <div className="label-caps" style={{ marginBottom: 16 }}>Get Started Today</div>
          <h2
            style={{
              fontSize: 'clamp(28px, 3vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Ready to See the Signal?
          </h2>
          <p style={{ fontSize: 14, color: '#8e9379', lineHeight: 1.7, marginBottom: 40 }}>
            Join Sentivvo and get instant access to live volatility forecasts, portfolio tracking,
            and market news.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: '14px 32px',
                borderRadius: 10,
                border: 'none',
                background: '#c3f400',
                color: '#131313',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 0 40px rgba(195,244,0,0.15)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#d4ff1a';
                e.currentTarget.style.boxShadow = '0 0 60px rgba(195,244,0,0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#c3f400';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(195,244,0,0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Create Free Account →
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 32px',
                borderRadius: 10,
                border: '1px solid rgba(195,244,0,0.2)',
                background: 'transparent',
                color: '#e5e2e1',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(195,244,0,0.06)';
                e.currentTarget.style.borderColor = 'rgba(195,244,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(195,244,0,0.2)';
              }}
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: '1px solid rgba(53,53,52,0.5)',
          padding: '40px 24px',
          textAlign: 'center',
          background: '#0e0e0e',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: '#c3f400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13,
              color: '#131313',
            }}
          >
            S
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#635e5c',
              letterSpacing: '-0.02em',
            }}
          >
            Sentivvo
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#444933' }}>
          © {new Date().getFullYear()} Sentivvo. Built for educational and research purposes. Not financial advice.
        </p>
      </footer>
    </div>
  );
}
