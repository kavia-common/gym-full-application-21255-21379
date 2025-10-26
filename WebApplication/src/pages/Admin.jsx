import { useEffect, useState } from 'react';

// PUBLIC_INTERFACE
export default function Admin() {
  /** Admin page with basic reporting placeholders and loading/empty states. */
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise((r)=>setTimeout(r, 700));
      if (!mounted) return;
      setReports([
        { id: 1, title: 'Monthly Memberships', value: 124 },
        { id: 2, title: 'Payments Processed', value: 87 }
      ]);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{padding: 24}}>Loading admin data...</div>;
  if (!reports.length) return <div style={{padding: 24}}>No reports.</div>;

  return (
    <div className="container" style={{padding: 24}}>
      <h2>Admin</h2>
      <div style={{display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 12}}>
        {reports.map(r => (
          <div key={r.id} style={{border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, background: 'var(--bg-secondary)'}}>
            <div style={{fontSize: 14, opacity: 0.8}}>{r.title}</div>
            <div style={{fontSize: 28, fontWeight: 700}}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
