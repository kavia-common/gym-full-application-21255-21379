import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPatch } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

// Helpers
function fmtDateTime(v) {
  try {
    const d = v ? new Date(v) : null;
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleString();
  } catch {
    return String(v || '');
  }
}

// PUBLIC_INTERFACE
export default function Notifications() {
  /** 
   * Notifications page:
   * - Fetch list of user's notifications from GET /notifications/mine
   * - Display loading and error states
   * - Allow toggling email and SMS opt-in preferences via PATCH /users/me
   */
  const [loading, setLoading] = useState(true);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [items, setItems] = useState([]);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);

  const clearSuccessSoon = useCallback(() => {
    setTimeout(() => setSuccess(''), 1500);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Fetch notifications
      const res = await apiGet(ENDPOINTS.NOTIFICATIONS.MINE);
      const list = Array.isArray(res) ? res : (res?.items || []);
      setItems(list);

      // Try to hydrate preferences from /users/me
      try {
        const me = await apiGet(ENDPOINTS.USERS.ME);
        const prefs = me?.preferences || me?.user?.preferences || me || {};
        const email = prefs?.email_opt_in ?? prefs?.notifications_email_opt_in ?? false;
        const sms = prefs?.sms_opt_in ?? prefs?.notifications_sms_opt_in ?? false;
        setEmailOptIn(!!email);
        setSmsOptIn(!!sms);
      } catch (meErr) {
        // If /users/me fails, ignore prefs hydration and keep defaults
      }
    } catch (e) {
      setError(e?.message || 'Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadData();
    })();
  }, [loadData]);

  const savePrefs = async (updates) => {
    setPrefsLoading(true);
    setError('');
    setSuccess('');
    try {
      // Only send the updated fields; merge with current
      const body = {
        email_opt_in: ('email_opt_in' in updates) ? !!updates.email_opt_in : emailOptIn,
        sms_opt_in: ('sms_opt_in' in updates) ? !!updates.sms_opt_in : smsOptIn,
      };
      await apiPatch(ENDPOINTS.USERS.ME, body);
      if ('email_opt_in' in updates) setEmailOptIn(!!updates.email_opt_in);
      if ('sms_opt_in' in updates) setSmsOptIn(!!updates.sms_opt_in);
      setSuccess('Preferences updated');
      clearSuccessSoon();
    } catch (e) {
      setError(e?.message || 'Failed to update preferences');
    } finally {
      setPrefsLoading(false);
    }
  };

  const toggleEmail = () => savePrefs({ email_opt_in: !emailOptIn });
  const toggleSms = () => savePrefs({ sms_opt_in: !smsOptIn });

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Notifications</h2>

      {/* Preferences */}
      <div style={styles.prefsCard}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Notification Preferences</div>
        <div style={styles.prefsRow}>
          <label style={styles.switchRow}>
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={toggleEmail}
              disabled={prefsLoading}
              aria-label="Email notifications opt-in"
            />
            <span>Email notifications</span>
          </label>
          <label style={styles.switchRow}>
            <input
              type="checkbox"
              checked={smsOptIn}
              onChange={toggleSms}
              disabled={prefsLoading}
              aria-label="SMS notifications opt-in"
            />
            <span>SMS notifications</span>
          </label>
        </div>
        {prefsLoading && <div style={{ marginTop: 6, fontSize: 13, opacity: 0.8 }}>Saving preferences...</div>}
      </div>

      {error && <div style={styles.error} role="alert">{error}</div>}
      {success && <div style={styles.success} role="status">{success}</div>}
      {loading && <div style={{ marginTop: 8 }}>Loading notifications...</div>}
      {!loading && !items.length && <div style={{ marginTop: 8 }}>No notifications.</div>}

      {!loading && items.length > 0 && (
        <div style={styles.grid}>
          {items.map((n, idx) => {
            const id = n.id || `n-${idx}`;
            const title = n.title || n.subject || 'Notification';
            const body = n.body || n.message || n.content || '';
            const ts = n.created_at || n.timestamp || n.sent_at;
            const type = (n.type || n.category || '').toString().toLowerCase();

            return (
              <div key={id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ fontWeight: 700 }}>{title}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{fmtDateTime(ts)}</div>
                </div>
                <div style={styles.cardBody}>
                  {type && <div style={styles.badge}>{type}</div>}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{body}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  prefsCard: { border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', padding: 12, marginTop: 8 },
  prefsRow: { display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' },
  switchRow: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 },

  grid: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 12 },
  card: { border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 6 },

  badge: { alignSelf: 'flex-start', padding: '2px 6px', borderRadius: 6, fontSize: 12, border: '1px solid var(--border-color)', opacity: 0.85 },

  success: { marginTop: 8, background: '#e6ffed', border: '1px solid #b7eb8f', padding: '8px 10px', borderRadius: 8, color: '#237804' },
  error: { marginTop: 8, background: '#fde7e9', border: '1px solid #f5c2c7', padding: '8px 10px', borderRadius: 8, color: '#b00020' },
};
