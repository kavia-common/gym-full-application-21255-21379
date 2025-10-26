import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fakeAuth } from '../api/client';

// PUBLIC_INTERFACE
export default function Login({ onLogin }) {
  /** Minimal login form. Uses fakeAuth stub; replace with real backend call later. */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fakeAuth(email, password);
      onLogin(res);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed');
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
          placeholder="member@demo | trainer@demo | admin@demo"
          style={styles.input}
          type="email"
          required
        />
        <label style={styles.label}>Password</label>
        <input
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          placeholder="password"
          style={styles.input}
          type="password"
          required
        />
        {error && <div style={styles.error}>{error}</div>}
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
