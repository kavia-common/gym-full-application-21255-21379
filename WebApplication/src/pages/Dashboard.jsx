import { useEffect, useState } from 'react';

// PUBLIC_INTERFACE
export default function Dashboard({ role, user }) {
  /** Dashboard with minimal widgets and role-aware greeting. */
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    // Simulate loading data
    (async () => {
      await new Promise((r)=>setTimeout(r, 500));
      if (!mounted) return;
      setStats({
        classes: role === 'member' ? 2 : role === 'trainer' ? 5 : 8,
        workouts: role === 'member' ? 6 : 12,
        alerts: role === 'admin' ? 3 : 0
      });
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [role]);

  if (loading) return <div style={{padding: 24}}>Loading dashboard...</div>;
  if (!stats) return <div style={{padding: 24}}>No data available.</div>;

  return (
    <div className="container" style={{padding: 24}}>
      <h2>Welcome{user?.email ? `, ${user.email}` : ''}!</h2>
      <p>Role: <strong>{role || 'guest'}</strong></p>
      <div style={{display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: 12}}>
        <Card title="Upcoming Classes" value={stats.classes} />
        <Card title="Workouts Completed" value={stats.workouts} />
        <Card title="Alerts" value={stats.alerts} />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, background: 'var(--bg-secondary)'}}>
      <div style={{fontSize: 14, opacity: 0.8}}>{title}</div>
      <div style={{fontSize: 28, fontWeight: 700}}>{value}</div>
    </div>
  );
}
