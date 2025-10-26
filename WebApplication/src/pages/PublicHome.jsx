import { Link } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function PublicHome() {
  /** Public landing page for marketing and onboarding links. */
  return (
    <div className="container" style={styles.wrap}>
      <h1 className="title">Welcome to GymPro</h1>
      <p className="description">Train smarter. Book classes. Track progress.</p>
      <div style={styles.actions}>
        <Link to="/register" className="btn" style={styles.btn}>Get Started</Link>
        <Link to="/login" className="btn" style={{...styles.btn, ...styles.ghost}}>Login</Link>
      </div>
      <section style={{marginTop: 24}}>
        <h3>Why GymPro?</h3>
        <ul>
          <li>Flexible class scheduling</li>
          <li>Member and trainer portals</li>
          <li>Admin dashboard for operations</li>
        </ul>
      </section>
    </div>
  );
}

const styles = {
  wrap: { padding: 24, textAlign: 'left' },
  actions: { display: 'flex', gap: 12, marginTop: 12 },
  btn: {
    background: 'var(--button-bg)',
    color: 'var(--button-text)',
    border: 'none',
    padding: '10px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 600
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)'
  }
};
