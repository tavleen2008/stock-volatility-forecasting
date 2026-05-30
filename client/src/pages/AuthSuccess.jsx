import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Landing page for the Google OAuth redirect:
 *   http://localhost:5173/auth/success?token=<jwt>
 *
 * Extracts the token, saves it via AuthContext.login(), then
 * navigates to the dashboard.
 */
function AuthSuccess() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      login(token);
      navigate('/', { replace: true });
    } else {
      // No token — auth failed, go back home
      navigate('/', { replace: true });
    }
  }, [login, navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f1117',
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        gap: '16px',
      }}
    >
      {/* Spinner */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        style={{ animation: 'spin 0.9s linear infinite' }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="4"
          strokeDasharray="80 40"
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: '15px', color: '#94a3b8' }}>
        Signing you in…
      </span>
    </div>
  );
}

export default AuthSuccess;
