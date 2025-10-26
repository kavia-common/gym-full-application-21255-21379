import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import PublicHome from './pages/PublicHome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Workouts from './pages/Workouts';
import Admin from './pages/Admin';
import { getAuthToken, setAuthToken } from './api/client';

// PUBLIC_INTERFACE
function App() {
  /** Root application: sets theme, routing, and minimal auth/role state. */
  const [theme, setTheme] = useState('light');
  const [auth, setAuth] = useState({ token: null, role: null, user: null });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const isAuthed = !!auth.token;
  const role = auth.role;

  const handleLogin = (res) => {
    const token = res?.access_token || null;
    const r = res?.role || 'member';
    const user = res?.user || null;
    setAuth({ token, role: r, user });
    setAuthToken(token);
  };

  const handleLogout = async () => {
    // Clear local app state and client token store
    setAuth({ token: null, role: null, user: null });
    setAuthToken(null);
    // Optionally inform backend (ignore errors)
    try {
      const { apiPost } = await import('./api/client');
      const { ENDPOINTS } = await import('./api/endpoints');
      await apiPost(ENDPOINTS.AUTH.LOGOUT, {});
    } catch (_) {
      // no-op on logout errors
    }
  };

  // Attempt to hydrate token if page reload retained in-memory? In-memory only by spec (no storage).
  useEffect(() => {
    const token = getAuthToken();
    if (token && !auth.token) {
      setAuth((prev) => ({ ...prev, token }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const themeLabel = useMemo(() => (theme === 'light' ? '🌙 Dark' : '☀️ Light'), [theme]);

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar role={role} isAuthed={isAuthed} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />

          {/* Protected general area */}
          <Route element={<ProtectedRoute isAuthed={isAuthed} userRole={role} />}>
            <Route path="/dashboard" element={<Dashboard role={role} user={auth.user} />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/workouts" element={<Workouts />} />
          </Route>

          {/* Admin-only */}
          <Route element={<ProtectedRoute isAuthed={isAuthed} allowedRoles={['admin']} userRole={role} />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<div style={{padding:24}}>Not found</div>} />
        </Routes>
      </BrowserRouter>

      <button
        className="theme-toggle"
        onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        aria-label={`Switch theme: ${themeLabel}`}
        title={`Switch theme: ${themeLabel}`}
      >
        {themeLabel}
      </button>
    </div>
  );
}

export default App;
