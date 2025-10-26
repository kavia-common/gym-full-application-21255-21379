import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function Register() {
  /** Minimal register form; in real app call backend and redirect to login. */
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await new Promise((r)=>setTimeout(r, 600));
    setDone(true);
    setBusy(false);
    setTimeout(()=>navigate('/login'), 800);
  };

  return (
    <div className="container" style={{padding: 24, maxWidth: 480}}>
      <h2>Create account</h2>
      <form onSubmit={submit} style={styles.form}>
        <label style={styles.label}>Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required style={styles.input} placeholder="you@example.com" />
        <label style={styles.label}>Role</label>
        <select value={role} onChange={(e)=>setRole(e.target.value)} style={styles.input}>
          <option value="member">Member</option>
          <option value="trainer">Trainer</option>
        </select>
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
  notice: { marginTop: 10, background: '#e7f5ff', border: '1px solid #a5d8ff', color: '#1c7ed6', padding: '8px 10px', borderRadius: 8 }
};
