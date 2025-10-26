import { Link } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function Navbar({ role, isAuthed, onLogout }) {
  /** Top navigation bar with role-aware links. */
  return (
    <nav className="navbar" style={styles.nav}>
      <div style={styles.left}>
        <Link to="/" style={styles.brand}>GymPro</Link>
      </div>
      <div style={styles.center}>
        <Link to="/" style={styles.link}>Home</Link>
        {isAuthed && <Link to="/dashboard" style={styles.link}>Dashboard</Link>}
        {role === 'member' && (
          <>
            <Link to="/member" style={styles.link}>Member</Link>
            <Link to="/schedule" style={styles.link}>Schedule</Link>
            <Link to="/workouts" style={styles.link}>Workouts</Link>
            <Link to="/memberships" style={styles.link}>Memberships</Link>
            <Link to="/payments" style={styles.link}>Payments</Link>
          </>
        )}
        {role === 'trainer' && (
          <>
            <Link to="/trainer" style={styles.link}>Trainer</Link>
            <Link to="/schedule" style={styles.link}>Schedule</Link>
            <Link to="/workouts" style={styles.link}>Clients</Link>
          </>
        )}
        {role === 'admin' && (
          <>
            <Link to="/admin" style={styles.link}>Admin</Link>
            <Link to="/schedule" style={styles.link}>Schedule</Link>
            <Link to="/payments" style={styles.link}>Payments</Link>
          </>
        )}
        {isAuthed && <Link to="/profile" style={styles.link}>Profile</Link>}
      </div>
      <div style={styles.right}>
        {!isAuthed ? (
          <>
            <Link to="/login" style={styles.button}>Login</Link>
            <Link to="/register" style={{...styles.button, ...styles.ghost}}>Register</Link>
          </>
        ) : (
          <button onClick={onLogout} style={styles.button}>Logout</button>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  brand: { color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700 },
  left: { display: 'flex', alignItems: 'center', gap: 8 },
  center: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  right: { display: 'flex', alignItems: 'center', gap: 8 },
  link: { color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 },
  button: {
    background: 'var(--button-bg)',
    color: 'var(--button-text)',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    textDecoration: 'none',
    fontWeight: 600
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)'
  }
};
