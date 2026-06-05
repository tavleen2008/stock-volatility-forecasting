import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthSuccess from './pages/AuthSuccess';

function App() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen">
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/success" element={<AuthSuccess />} />

          {/* Protected dashboard — all sub-paths */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Legacy dashboard paths */}
          <Route path="/portfolio" element={<Navigate to="/dashboard/portfolio" replace />} />
          <Route path="/forecasts" element={<Navigate to="/dashboard/forecasts" replace />} />
          <Route path="/volatility" element={<Navigate to="/dashboard/forecasts" replace />} />
          <Route path="/news" element={<Navigate to="/dashboard/news" replace />} />
          <Route path="/compare" element={<Navigate to="/dashboard/compare" replace />} />
          <Route path="/snapshot/*" element={<Navigate to="/dashboard/snapshot" replace />} />

          {/* Catch-all → landing */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
