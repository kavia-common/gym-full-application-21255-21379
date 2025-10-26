import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Member from './pages/Member';
import Trainer from './pages/Trainer';
import Profile from './pages/Profile';
import Memberships from './pages/Memberships';
import Payments from './pages/Payments';
import { apiGet, getAuthToken, setAuthToken } from './api/client';
import { ENDPOINTS } from './api/endpoints';

// PUBLIC_INTERFACE
function App() {
  /** Root application: sets theme, routing, and auth/role state hydrated from /users/me. */
  const [theme, setTheme] = useState('light');
  const [auth, setAuth] = useState({ token: null, role: null, user: null, loadingMe: false, meError: '' });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const isAuthed = !!auth.token;
  const role = auth.role;

  const loadMe = async () => {
    // Fetch current user context from backend, set role and user.
    setAuth(prev => ({ ...prev, loadingMe: true, meError: '' }));
    try {
      const me = await apiGet(ENDPOINTS.USERS.ME);
      // Expect { user: {...}, role: 'member'|'trainer'|'admin' }
      const detectedRole = me?.role || me?.user?.role || 'member';
      const userObj = me?.user || me || null;
      setAuth(prev => ({ ...prev, role: detectedRole, user: userObj, loadingMe: false }));
    } catch (e) {
      setAuth(prev => ({ ...prev, loadingMe: false, meError: e?.message || 'Failed to load profile' }));
    }
  };

  const handleLogin = (res) => {
    const token = res?.access_token || null;
    const r = res?.role || 'member';
    const user = res?.user || null;
    setAuth({ token, role: r, user, loadingMe: false, meError: '' });
    setAuthToken(token);
    // After login, refresh /users/me to get canonical backend role/user
    loadMe();
  };

  const handleLogout = async () => {
    // Clear local app state and client token store
    setAuth({ token: null, role: null, user: null, loadingMe: false, meError: '' });
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

  // Attempt to hydrate token (in-memory) and fetch /users/me when available.
  useEffect(() => {
    const token = getAuthToken();
    if (token && !auth.token) {
      setAuth((prev) => ({ ...prev, token }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When token becomes available, load /users/me
  useEffect(() => {
    if (auth.token) {
      loadMe();
    } else {
      // reset me when logged out
      setAuth(prev => ({ ...prev, role: null, user: null, meError: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token]);

  const themeLabel = useMemo(() => (theme === 'light' ? '🌙 Dark' : '☀️ Light'), [theme]);

  return (
    <div className="App">
      <BrowserRouter>
        <Navbar role={role} isAuthed={isAuthed} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />

          {/* Member portal */}
          <Route element={<ProtectedRoute isAuthed={isAuthed} allowedRoles={['member']} userRole={role} />}>
            <Route path="/member" element={<Member user={auth.user} loading={auth.loadingMe} />} />
            <Route path="/profile" element={<Profile user={auth.user} loading={auth.loadingMe} onReload={loadMe} />} />
            <Route path="/memberships" element={<Memberships user={auth.user} />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/workouts" element={<Workouts />} />
          </Route>

          {/* Trainer portal */}
          <Route element={<ProtectedRoute isAuthed={isAuthed} allowedRoles={['trainer']} userRole={role} />}>
            <Route path="/trainer" element={<Trainer user={auth.user} loading={auth.loadingMe} />} />
            <Route path="/profile" element={<Profile user={auth.user} loading={auth.loadingMe} onReload={loadMe} />} />
          </Route>

          {/* Admin-only */}
          <Route element={<ProtectedRoute isAuthed={isAuthed} allowedRoles={['admin']} userRole={role} />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile user={auth.user} loading={auth.loadingMe} onReload={loadMe} />} />
          </Route>

          {/* Shared protected area (all authenticated roles) */}
          <Route element={<ProtectedRoute isAuthed={isAuthed} userRole={role} />}>
            <Route path="/dashboard" element={<Dashboard role={role} user={auth.user} />} />
            <Route path="/payments" element={<Payments />} />
          </Route>

          {/* Root redirects to role home when authed */}
          <Route path="/home" element={
            isAuthed ? (
              role === 'admin' ? <Navigate to="/admin" replace /> :
              role === 'trainer' ? <Navigate to="/trainer" replace /> :
              <Navigate to="/member" replace />
            ) : <Navigate to="/" replace />
          } />

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
