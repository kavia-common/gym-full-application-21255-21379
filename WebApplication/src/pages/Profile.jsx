import { useState } from 'react';

// PUBLIC_INTERFACE
export default function Profile({ user, loading, onReload }) {
  /** Profile page: displays /users/me data and allows refresh. */
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      setBusy(true);
      await onReload?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container" style={{ padding: 24, maxWidth: 640 }}>
      <h2>Profile</h2>
      {(loading || busy) && <div>Loading...</div>}
      {user ? (
        <div style={{ marginTop: 12, border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, background: 'var(--bg-secondary)' }}>
          <div><strong>Email:</strong> {user.email || '—'}</div>
          <div><strong>Name:</strong> {user.name || '—'}</div>
          <div><strong>Member Since:</strong> {user.created_at || '—'}</div>
        </div>
      ) : (
        <div>No profile data.</div>
      )}
      <button onClick={refresh} disabled={busy} className="btn" style={{ marginTop: 12 }}>
        {busy ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}
