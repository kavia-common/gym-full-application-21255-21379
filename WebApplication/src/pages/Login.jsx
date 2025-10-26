import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPost, setAuthToken } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// PUBLIC_INTERFACE
export default function Login({ onLogin }) {
  /** Login form using backend API. Persists token, handles errors, and redirects role-based. */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    // Basic role-based navigation
    if (role === 'admin') return navigate('/admin', { replace: true });
    // Trainers and members go to dashboard by default
    return navigate('/dashboard', { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      // Call backend login
      const res = await apiPost(ENDPOINTS.AUTH.LOGIN, { email, password });
      // Expecting { access_token, role, user }
      const token = res?.access_token || res?.token || null;
      const role = res?.role || 'member';
      const user = res?.user || { email };

      if (!token) {
        throw { message: 'Login failed: no token received' };
      }

      // Persist token in client store
      setAuthToken(token);

      // Notify app state via onLogin
      onLogin?.({ access_token: token, role, user });

      // Redirect based on role
      redirectByRole(role);
    } catch (err) {
      const msg =
        err?.message ||
        err?.data?.detail ||
        err?.data?.message ||
        'Login failed';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{padding: 24, maxWidth: 420}}>
      <h2>Login</h2>
      <form onSubmit={submit} style={styles.form}>
        <label style={styles.label}>Email</label>
        <input
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="you@example.com"
          style={styles.input}
          type="email"
          required
          disabled={busy}
        />
        <label style={styles.label}>Password</label>
        <input
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          placeholder="••••••••"
          style={styles.input}
          type="password"
          required
          disabled={busy}
        />
        {error && <div style={styles.error} role="alert">{error}</div>}
        <button disabled={busy} type="submit" style={styles.btn}>
          {busy ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <p style={{marginTop: 8}}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontWeight: 600 },
  input: { padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' },
  btn: { background: 'var(--button-bg)', color: 'var(--button-text)', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#b00020', background: '#fde7e9', border: '1px solid #f5c2c7', padding: '8px 10px', borderRadius: 8 }
};
