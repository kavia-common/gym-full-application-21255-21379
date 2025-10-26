import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../api/client';

// PUBLIC_INTERFACE
export default function Register() {
  /** Registration form using backend API. Redirects to login on success. */
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      // Assuming backend accepts { email, password, role }
      await apiPost('/auth/register', { email, password, role });
      setDone(true);
      // brief success notice then to login
      setTimeout(()=>navigate('/login'), 800);
    } catch (err) {
      const msg =
        err?.message ||
        err?.data?.detail ||
        err?.data?.message ||
        'Registration failed';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{padding: 24, maxWidth: 480}}>
      <h2>Create account</h2>
      <form onSubmit={submit} style={styles.form}>
        <label style={styles.label}>Email</label>
        <input
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          type="email"
          required
          style={styles.input}
          placeholder="you@example.com"
          disabled={busy}
        />
        <label style={styles.label}>Password</label>
        <input
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          type="password"
          required
          style={styles.input}
          placeholder="Create a strong password"
          disabled={busy}
        />
        <label style={styles.label}>Role</label>
        <select value={role} onChange={(e)=>setRole(e.target.value)} style={styles.input} disabled={busy}>
          <option value="member">Member</option>
          <option value="trainer">Trainer</option>
        </select>
        {error && <div style={styles.error} role="alert">{error}</div>}
        <button disabled={busy} type="submit" style={styles.btn}>
          {busy ? 'Creating...' : 'Register'}
        </button>
      </form>
      {done && <div style={styles.notice}>Registered! Redirecting to login...</div>}
      <p style={{marginTop: 8}}>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  label: { fontWeight: 600 },
  input: { padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' },
  btn: { background: 'var(--button-bg)', color: 'var(--button-text)', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  notice: { marginTop: 10, background: '#e7f5ff', border: '1px solid #a5d8ff', color: '#1c7ed6', padding: '8px 10px', borderRadius: 8 },
  error: { color: '#b00020', background: '#fde7e9', border: '1px solid #f5c2c7', padding: '8px 10px', borderRadius: 8 }
};
