import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { authApi } from '../utils/api';

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    async function verifySession() {
      const user = authService.getCurrentUser();
      if (!user) {
        setIsValid(false);
        setLoading(false);
        return;
      }

      if (user.provider === 'guest') {
        setIsValid(true);
        setLoading(false);
        return;
      }

      try {
        await authApi.me();
        setIsValid(true);
      } catch (err) {
        console.error('Session validation failed:', err);
        // Clear invalid/expired session data
        localStorage.removeItem('svf_access_token');
        localStorage.removeItem('sentivvo_current_session');
        setIsValid(false);
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '4px solid rgba(0, 230, 118, 0.1)',
            borderTopColor: '#00e676',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#00e676'
          }}>Verifying Terminal Session...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
