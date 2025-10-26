import { useEffect, useState } from 'react';

// PUBLIC_INTERFACE
export default function Schedule() {
  /** Schedule page placeholder with loading/empty state. */
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await new Promise((r)=>setTimeout(r, 600));
      if (!mounted) return;
      setClasses([
        { id: 1, name: 'HIIT', time: '10:00' },
        { id: 2, name: 'Yoga', time: '12:00' }
      ]);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{padding: 24}}>Loading schedule...</div>;
  if (!classes.length) return <div style={{padding: 24}}>No classes scheduled.</div>;

  return (
    <div className="container" style={{padding: 24}}>
      <h2>Schedule</h2>
      <ul>
        {classes.map((c) => <li key={c.id}>{c.name} - {c.time}</li>)}
      </ul>
    </div>
  );
}
