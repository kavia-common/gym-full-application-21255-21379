import { useEffect, useState } from 'react';

// PUBLIC_INTERFACE
export default function Trainer({ user, loading }) {
  /** Trainer portal: basic overview of clients and sessions. */
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise(r => setTimeout(r, 400));
      if (!mounted) return;
      setOverview({ clients: 8, sessionsToday: 3, pendingPrograms: 2 });
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Trainer Portal</h2>
      {loading && <div>Loading your profile...</div>}
      <p>Welcome{user?.email ? `, ${user.email}` : ''}.</p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 12 }}>
        <Tile title="Clients" value={overview?.clients ?? '—'} />
        <Tile title="Sessions Today" value={overview?.sessionsToday ?? '—'} />
        <Tile title="Programs Pending" value={overview?.pendingPrograms ?? '—'} />
      </div>
    </div>
  );
}

function Tile({ title, value }) {
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, background: 'var(--bg-secondary)' }}>
      <div style={{ fontSize: 14, opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
