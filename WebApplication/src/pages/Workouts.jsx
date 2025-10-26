import { useEffect, useState } from 'react';

// PUBLIC_INTERFACE
export default function Workouts() {
  /** Workouts list with loading and empty states. */
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise((r) => setTimeout(r, 500));
      if (!mounted) return;
      setItems([
        { id: 1, name: 'Push Day' },
        { id: 2, name: 'Leg Day' }
      ]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading workouts...</div>;
  if (!items.length) return <div style={{ padding: 24 }}>No workouts found.</div>;

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Workouts</h2>
      <ul>
        {items.map((w) => (
          <li key={w.id}>{w.name}</li>
        ))}
      </ul>
    </div>
  );
}
