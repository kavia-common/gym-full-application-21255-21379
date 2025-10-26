import { useEffect, useState } from 'react';

// PUBLIC_INTERFACE
export default function Member({ user, loading }) {
  /** Member portal: simple dashboard tiles. */
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise(r => setTimeout(r, 400));
      if (!mounted) return;
      setStats({ bookings: 2, activePlan: 'Gold', workoutsThisWeek: 3 });
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Member Portal</h2>
      {loading && <div>Loading your profile...</div>}
      <p>Welcome{user?.email ? `, ${user.email}` : ''}.</p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 12 }}>
        <Tile title="Active Plan" value={stats?.activePlan || '—'} />
        <Tile title="Bookings" value={stats?.bookings ?? '—'} />
        <Tile title="Workouts this week" value={stats?.workoutsThisWeek ?? '—'} />
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
