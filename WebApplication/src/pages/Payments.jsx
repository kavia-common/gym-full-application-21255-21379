import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Helpers
function fmtAmount(cents, currency = 'USD') {
  try {
    const val = (Number(cents) || 0) / 100;
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(val);
  } catch {
    const val = (Number(cents) || 0) / 100;
    return `${currency} ${val.toFixed(2)}`;
  }
}
function fmtDate(dt) {
  try {
    const d = dt ? new Date(dt) : null;
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch {
    return String(dt || '');
  }
}

// PUBLIC_INTERFACE
export default function Payments() {
  /**
   * Payments page:
   * - Initiate checkout session via POST /payments/create-checkout
   * - Display user's payment history via GET /payments/history
   * - Show loading and error states, and simple status indicators
   */
  // Note: 'loading' state is currently unused but reserved for future enhancements.
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [items, setItems] = useState([]);
  const [creating, setCreating] = useState(false);

  // Optional: allow productId/plan selection (simple default)
  const [plan, setPlan] = useState('monthly_basic');
  const plans = useMemo(() => ([
    { id: 'monthly_basic', name: 'Monthly Basic', amount: 1999, currency: 'USD', description: 'Basic access to gym facilities' },
    { id: 'monthly_gold', name: 'Monthly Gold', amount: 3999, currency: 'USD', description: 'Includes group classes' },
    { id: 'annual_pro', name: 'Annual Pro', amount: 49999, currency: 'USD', description: 'Full access + perks for a year' },
  ]), []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setError('');
    try {
      // Expect response to be array or { items: [], total?: number }
      const res = await apiGet(ENDPOINTS.PAYMENTS.HISTORY);
      const list = Array.isArray(res) ? res : (res?.items || []);
      setItems(list);
    } catch (e) {
      setError(e?.message || 'Failed to load payment history');
      setItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadHistory();
    })();
    return () => { mounted = false; };
  }, [loadHistory]);

  const clearSuccessSoon = () => setTimeout(() => setSuccess(''), 1500);

  const startCheckout = async () => {
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      // Call backend to create checkout session for selected plan
      // Assume backend accepts { plan_id } or { price_id } and returns { checkout_url } or { session_id, checkout_url }
      const body = { plan_id: plan };
      const res = await apiPost(ENDPOINTS.PAYMENTS.CREATE_CHECKOUT, body);
      const url = res?.checkout_url || res?.url || null;

      if (url) {
        // Typically redirect to Stripe Checkout or similar
        window.location.assign(url);
        return;
      }

      // If no URL returned, show success and refresh history (some gateways may process immediately in dev)
      setSuccess('Checkout session created.');
      clearSuccessSoon();
      await loadHistory();
    } catch (e) {
      setError(e?.message || 'Failed to start checkout');
    } finally {
      setCreating(false);
    }
  };

  const renderStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    const base = { padding: '2px 6px', borderRadius: 6, fontSize: 12, border: '1px solid var(--border-color)' };
    if (s === 'paid' || s === 'succeeded') {
      return <span style={{ ...base, background: '#e6ffed', color: '#237804', borderColor: '#b7eb8f' }}>Paid</span>;
    }
    if (s === 'pending' || s === 'requires_payment') {
      return <span style={{ ...base, background: '#fffbe6', color: '#ad6800', borderColor: '#ffe58f' }}>Pending</span>;
    }
    if (s === 'failed' || s === 'canceled' || s === 'refunded') {
      return <span style={{ ...base, background: '#fff1f0', color: '#a8071a', borderColor: '#ffa39e' }}>{status || 'Failed'}</span>;
    }
    return <span style={{ ...base, opacity: 0.8 }}>{status || '—'}</span>;
  };

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Payments</h2>

      {/* Plan selection and checkout */}
      <div style={styles.checkoutCard}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Start a new checkout</div>
        <div style={styles.checkoutRow}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={styles.label}>Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              style={styles.input}
              disabled={creating}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} – {fmtAmount(p.amount, p.currency)}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>
              {plans.find((p) => p.id === plan)?.description || ''}
            </div>
          </div>
          <div>
            <button className="btn" onClick={startCheckout} disabled={creating} style={{ minWidth: 140 }}>
              {creating ? 'Creating...' : 'Checkout'}
            </button>
          </div>
        </div>
      </div>

      {error && <div style={styles.error} role="alert">{error}</div>}
      {success && <div style={styles.success} role="status">{success}</div>}

      {/* History */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Payment History</div>
        {historyLoading && <div>Loading history...</div>}
        {!historyLoading && !items.length && <div>No payments found.</div>}
        {!historyLoading && items.length > 0 && (
          <div style={styles.grid}>
            {items.map((it, idx) => {
              // Normalize
              const id = it.id || it.payment_id || `p-${idx}`;
              const amount = it.amount || it.total_amount || 0;
              const currency = it.currency || 'USD';
              const created = it.created_at || it.created || it.timestamp || '';
              const descr = it.description || it.plan_name || it.title || '';
              const status = it.status || it.payment_status || '';

              return (
                <div key={id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={{ fontWeight: 700 }}>{descr || 'Payment'}</div>
                    <div>{fmtAmount(amount, currency)}</div>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.meta}><strong>ID:</strong> {id}</div>
                    <div style={styles.meta}><strong>Date:</strong> {fmtDate(created)}</div>
                    <div style={styles.meta}><strong>Status:</strong> {renderStatusBadge(status)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  checkoutCard: { border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', padding: 12, marginTop: 8 },
  checkoutRow: { display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' },
  label: { fontWeight: 600, fontSize: 14 },
  input: { padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' },

  grid: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 8 },
  card: { border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 6 },
  meta: { fontSize: 14, opacity: 0.9 },

  success: { marginTop: 8, background: '#e6ffed', border: '1px solid #b7eb8f', padding: '8px 10px', borderRadius: 8, color: '#237804' },
  error: { marginTop: 8, background: '#fde7e9', border: '1px solid #f5c2c7', padding: '8px 10px', borderRadius: 8, color: '#b00020' },
};
