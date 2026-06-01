import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthSuccess from './pages/AuthSuccess';

function App() {
  return (
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

        {/* Legacy: redirect /portfolio, /forecasts etc to dashboard sub-routes */}
        <Route path="/portfolio" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/forecasts" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />

        {/* Catch-all → landing */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
