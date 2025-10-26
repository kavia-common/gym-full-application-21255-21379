import { useEffect, useState } from 'react';

// PUBLIC_INTERFACE
export default function Memberships({ user }) {
  /** Memberships page: shows current and available membership plans. */
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise(r => setTimeout(r, 450));
      if (!mounted) return;
      setCurrent({ plan: 'Gold', renewsOn: '2025-12-31' });
      setPlans([
        { id: 'basic', name: 'Basic', price: '$19/mo' },
        { id: 'gold', name: 'Gold', price: '$39/mo' },
        { id: 'pro', name: 'Pro', price: '$59/mo' },
      ]);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading memberships...</div>;

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Memberships</h2>
      <div style={{ marginTop: 8, border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, background: 'var(--bg-secondary)' }}>
        <div style={{ fontWeight: 600 }}>Current Plan</div>
        <div>Plan: {current?.plan || '—'}</div>
        <div>Renews On: {current?.renewsOn || '—'}</div>
      </div>

      <h3 style={{ marginTop: 16 }}>Available Plans</h3>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {plans.map(p => (
          <div key={p.id} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, background: 'var(--bg-secondary)' }}>
            <div style={{ fontWeight: 700 }}>{p.name}</div>
            <div style={{ opacity: 0.8 }}>{p.price}</div>
            <button className="btn" style={{ marginTop: 8 }}>Choose</button>
          </div>
        ))}
      </div>
    </div>
  );
}
