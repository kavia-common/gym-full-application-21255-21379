import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Helpers to format dates to YYYY-MM-DD
function toYMD(date) {
  try {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (_) {
    return '';
  }
}

// PUBLIC_INTERFACE
export default function Schedule() {
  /**
   * Schedule page:
   * - Filter by date range and trainer
   * - Fetch classes from BackendAPI (/classes) with query params
   * - Show capacity and current bookings
   * - Allow booking or cancel booking via BackendAPI
   * - Provide loading/error and success feedback
   */
  const today = useMemo(() => toYMD(new Date()), []);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [trainer, setTrainer] = useState('');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Simulated trainer list until backend endpoint is available.
  // If BackendAPI exposes /trainers, this can be replaced with a fetch.
  const [trainers, setTrainers] = useState([{ id: '', name: 'All trainers' }]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (trainer) params.append('trainer_id', trainer);
    const qs = params.toString();
    return qs ? `${ENDPOINTS.CLASSES.LIST}?${qs}` : ENDPOINTS.CLASSES.LIST;
  }, [startDate, endDate, trainer]);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Expected response: array of classes with fields:
      // { id, name, start_time, end_time, trainer: { id, name }, capacity, booked_count, user_booked (bool) }
      const data = await apiGet(query);
      const normalized = Array.isArray(data) ? data : (data?.items || []);
      setClasses(normalized);
    } catch (e) {
      const msg = e?.message || 'Failed to load classes';
      setError(msg);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Load trainers list if backend provides an endpoint; otherwise keep placeholder
      try {
        // Optional enhancement: const list = await apiGet('/trainers');
        // setTrainers([{ id: '', name: 'All trainers' }, ...list]);
        await new Promise((r) => setTimeout(r, 0));
      } catch {
        // ignore
      }
      if (!mounted) return;
      loadClasses();
    })();
    return () => {
      mounted = false;
    };
  }, [loadClasses]);

  const clearFeedbackSoon = () => {
    setTimeout(() => {
      setSuccess('');
    }, 1200);
  };

  const book = async (cls) => {
    setError('');
    setSuccess('');
    try {
      await apiPost(ENDPOINTS.CLASSES.BOOK(cls.id), {});
      setSuccess('Booked successfully.');
      // update item locally to show immediate feedback
      setClasses((prev) =>
        prev.map((c) =>
          c.id === cls.id
            ? {
                ...c,
                booked_count: Math.min((c.booked_count ?? 0) + 1, c.capacity ?? Infinity),
                user_booked: true,
              }
            : c
        )
      );
      clearFeedbackSoon();
    } catch (e) {
      setError(e?.message || 'Booking failed');
    }
  };

  // Some backends use DELETE /bookings/:id or /classes/:id/book (DELETE).
  // We'll try DELETE /classes/:id/book to cancel.
  const cancel = async (cls) => {
    setError('');
    setSuccess('');
    try {
      // Prefer DELETE to the same book endpoint to cancel
      await apiDelete(ENDPOINTS.CLASSES.BOOK(cls.id));
      setSuccess('Booking cancelled.');
      setClasses((prev) =>
        prev.map((c) =>
          c.id === cls.id
            ? {
                ...c,
                booked_count: Math.max((c.booked_count ?? 1) - 1, 0),
                user_booked: false,
              }
            : c
        )
      );
      clearFeedbackSoon();
    } catch (e) {
      // If DELETE not supported, try POST /bookings/cancel or similar
      if (e?.status === 404 || e?.status === 405) {
        try {
          await apiPost('/bookings/cancel', { class_id: cls.id });
          setSuccess('Booking cancelled.');
          setClasses((prev) =>
            prev.map((c) =>
              c.id === cls.id
                ? {
                    ...c,
                    booked_count: Math.max((c.booked_count ?? 1) - 1, 0),
                    user_booked: false,
                  }
                : c
            )
          );
          clearFeedbackSoon();
          return;
        } catch (e2) {
          setError(e2?.message || 'Cancel failed');
          return;
        }
      }
      setError(e?.message || 'Cancel failed');
    }
  };

  const onFilterSubmit = async (e) => {
    e?.preventDefault();
    await loadClasses();
  };

  const capacityText = (c) => {
    const cap = c?.capacity ?? 0;
    const booked = c?.booked_count ?? 0;
    return `${booked}/${cap} booked`;
  };

  const isFull = (c) => {
    const cap = c?.capacity ?? 0;
    const booked = c?.booked_count ?? 0;
    return cap > 0 && booked >= cap;
  };

  const renderClass = (c) => {
    const start = c?.start_time || c?.time || '';
    const end = c?.end_time || '';
    const tr = c?.trainer?.name || c?.trainer_name || '—';
    const full = isFull(c);
    const booked = !!c?.user_booked;

    return (
      <div key={c.id} style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{ fontWeight: 700 }}>{c.name || 'Class'}</div>
          <div style={styles.capacity + ''}>
            <span>{capacityText(c)}</span>
            {full && <span style={styles.fullBadge}>Full</span>}
          </div>
        </div>

        <div style={styles.cardBody}>
          <div>
            <div style={styles.meta}><strong>Time:</strong> {start}{end ? ` - ${end}` : ''}</div>
            <div style={styles.meta}><strong>Trainer:</strong> {tr}</div>
          </div>
          <div>
            {!booked && (
              <button
                className="btn"
                style={{ ...styles.btn, ...(full ? styles.btnDisabled : {}) }}
                onClick={() => book(c)}
                disabled={full}
              >
                {full ? 'No spots' : 'Book'}
              </button>
            )}
            {booked && (
              <button
                className="btn"
                style={{ ...styles.btn, ...styles.danger }}
                onClick={() => cancel(c)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Schedule</h2>

      <form onSubmit={onFilterSubmit} style={styles.filters}>
        <div style={styles.filterRow}>
          <div style={styles.field}>
            <label style={styles.label}>Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Trainer</label>
            <select
              value={trainer}
              onChange={(e) => setTrainer(e.target.value)}
              style={styles.input}
            >
              {trainers.map((t) => (
                <option key={String(t.id)} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.actions}>
            <button className="btn" type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Loading...' : 'Apply'}
            </button>
          </div>
        </div>
      </form>

      {error && <div style={styles.error} role="alert">{error}</div>}
      {success && <div style={styles.success} role="status">{success}</div>}
      {loading && <div style={{ marginTop: 8 }}>Loading classes...</div>}
      {!loading && !classes.length && <div style={{ marginTop: 8 }}>No classes found for selected filters.</div>}

      <div style={styles.grid}>
        {classes.map(renderClass)}
      </div>
    </div>
  );
}

const styles = {
  filters: { marginTop: 8, marginBottom: 12, border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, background: 'var(--bg-secondary)' },
  filterRow: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'end' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontWeight: 600, fontSize: 14 },
  input: { padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' },
  actions: { display: 'flex', alignItems: 'center' },
  btn: { background: 'var(--button-bg)', color: 'var(--button-text)', border: 'none', padding: '10px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  grid: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 12 },
  card: { border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  capacity: { display: 'flex', alignItems: 'center', gap: 8 },
  fullBadge: { marginLeft: 8, padding: '2px 6px', borderRadius: 6, fontSize: 12, background: '#ffd9d9', color: '#7d1a1a', border: '1px solid #ffb3b3' },
  cardBody: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  meta: { fontSize: 14, opacity: 0.9 },
  success: { marginTop: 8, background: '#e6ffed', border: '1px solid #b7eb8f', padding: '8px 10px', borderRadius: 8, color: '#237804' },
  error: { marginTop: 8, background: '#fde7e9', border: '1px solid #f5c2c7', padding: '8px 10px', borderRadius: 8, color: '#b00020' },
  danger: { background: '#a61e4d' },
};
