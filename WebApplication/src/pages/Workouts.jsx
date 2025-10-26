import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Helpers
 */
function safe(v, fallback = '') {
  return v ?? fallback;
}
function toDateStr(v) {
  try {
    const d = v ? new Date(v) : null;
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

// PUBLIC_INTERFACE
export default function Workouts() {
  /**
   * Workouts page:
   * - Members: view their workout history via GET /workouts/mine with pagination; edit personal notes via PATCH /workouts/:id
   * - Trainers: list workouts (GET /workouts with pagination), assign new workouts via POST /workouts, and edit existing via PATCH
   * - Role is derived via heuristic from accessible data on other pages: we infer by trying to fetch /workouts/mine first;
   *   if forbidden, we treat as trainer and fall back to /workouts.
   *   If your app provides role from a context, replace role detection with that.
   */
  const [role, setRole] = useState(null); // 'member' | 'trainer'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total, pageSize]);

  // data
  const [items, setItems] = useState([]);

  // member notes edit state
  const [editingNotes, setEditingNotes] = useState({}); // { [id]: string }
  const [savingNotes, setSavingNotes] = useState({}); // { [id]: boolean }

  // trainer assignment/edit state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    member_id: '',
    title: '',
    description: '',
    date: '',
  });
  const [editingWorkout, setEditingWorkout] = useState(null); // workout object when editing as trainer
  const [savingTrainerAction, setSavingTrainerAction] = useState(false);

  const queryMine = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    return `${ENDPOINTS.WORKOUTS.MINE}?${params.toString()}`;
  }, [page, pageSize]);

  const queryTrainerList = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    return `${ENDPOINTS.WORKOUTS.LIST}?${params.toString()}`;
  }, [page, pageSize]);

  // load with role autodetect: try member first, fallback to trainer
  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // attempt member endpoint
      const res = await apiGet(queryMine);
      const list = Array.isArray(res) ? res : (res?.items || []);
      setItems(list);
      setTotal(res?.total ?? list.length);
      setRole('member');
    } catch (e) {
      if (e?.status === 403 || e?.status === 401 || e?.status === 404) {
        // assume trainer
        try {
          const res2 = await apiGet(queryTrainerList);
          const list2 = Array.isArray(res2) ? res2 : (res2?.items || []);
          setItems(list2);
          setTotal(res2?.total ?? list2.length);
          setRole('trainer');
        } catch (e2) {
          setError(e2?.message || 'Failed to load workouts');
          setItems([]);
          setTotal(0);
        }
      } else {
        setError(e?.message || 'Failed to load workouts');
        setItems([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [queryMine, queryTrainerList]);

  useEffect(() => {
    (async () => {
      await loadWorkouts();
    })();
  }, [loadWorkouts]);

  const refresh = async () => {
    await loadWorkouts();
  };

  const clearSuccessSoon = () => setTimeout(() => setSuccess(''), 1200);

  // Member: edit notes for specific workout id using PATCH /workouts/:id with { notes }
  const onEditNotes = (w) => {
    setEditingNotes((prev) => ({ ...prev, [w.id]: w.notes || '' }));
  };
  const onCancelNotes = (id) => {
    setEditingNotes((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };
  const onChangeNotes = (id, val) => {
    setEditingNotes((prev) => ({ ...prev, [id]: val }));
  };
  const onSaveNotes = async (w) => {
    const val = editingNotes[w.id] ?? '';
    setSavingNotes((prev) => ({ ...prev, [w.id]: true }));
    setError('');
    setSuccess('');
    try {
      await apiPatch(ENDPOINTS.WORKOUTS.DETAIL(w.id), { notes: val });
      setItems((prev) => prev.map((x) => (x.id === w.id ? { ...x, notes: val } : x)));
      onCancelNotes(w.id);
      setSuccess('Notes updated');
      clearSuccessSoon();
    } catch (e) {
      setError(e?.message || 'Failed to save notes');
    } finally {
      setSavingNotes((prev) => ({ ...prev, [w.id]: false }));
    }
  };

  // Trainer: open assignment modal
  const openAssign = () => {
    setAssignOpen(true);
    setAssignForm({ member_id: '', title: '', description: '', date: '' });
    setEditingWorkout(null);
  };
  const closeAssign = () => {
    setAssignOpen(false);
    setAssignForm({ member_id: '', title: '', description: '', date: '' });
    setEditingWorkout(null);
  };
  const onAssignField = (field, value) => setAssignForm((prev) => ({ ...prev, [field]: value }));

  const submitAssign = async (e) => {
    e?.preventDefault?.();
    setSavingTrainerAction(true);
    setError('');
    setSuccess('');
    try {
      // Expected body for assign: { member_id, title, description, date }
      await apiPost(ENDPOINTS.WORKOUTS.LIST, assignForm);
      setSuccess('Workout assigned');
      closeAssign();
      await refresh();
      clearSuccessSoon();
    } catch (err) {
      setError(err?.message || 'Failed to assign workout');
    } finally {
      setSavingTrainerAction(false);
    }
  };

  // Trainer: edit existing workout
  const startEditWorkout = (w) => {
    setAssignOpen(true);
    setEditingWorkout(w);
    setAssignForm({
      member_id: String(w.member_id || ''),
      title: w.title || w.name || '',
      description: w.description || '',
      date: w.date || w.scheduled_date || '',
    });
  };
  const submitEdit = async (e) => {
    e?.preventDefault?.();
    if (!editingWorkout) return;
    setSavingTrainerAction(true);
    setError('');
    setSuccess('');
    try {
      await apiPatch(ENDPOINTS.WORKOUTS.DETAIL(editingWorkout.id), {
        member_id: assignForm.member_id,
        title: assignForm.title,
        description: assignForm.description,
        date: assignForm.date,
      });
      setSuccess('Workout updated');
      closeAssign();
      await refresh();
      clearSuccessSoon();
    } catch (err) {
      setError(err?.message || 'Failed to update workout');
    } finally {
      setSavingTrainerAction(false);
    }
  };

  const renderWorkoutItem = (w) => {
    // Normalize fields across possible backend payloads
    const title = w.title || w.name || 'Workout';
    const descr = safe(w.description);
    const date = toDateStr(w.date || w.scheduled_date || w.created_at);
    const memberName = w.member?.name || w.member_name || w.member_email || '';
    const trainerName = w.trainer?.name || w.trainer_name || '';
    const id = w.id;

    const notesBeingEdited = editingNotes[id] !== undefined;
    const notesVal = notesBeingEdited ? editingNotes[id] : (w.notes || '');

    return (
      <div key={id} style={styles.card}>
        <div style={styles.header}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div style={{ opacity: 0.8 }}>{date}</div>
        </div>

        <div style={styles.body}>
          {descr && <div style={{ marginBottom: 8 }}>{descr}</div>}
          <div style={styles.metaRow}>
            {memberName && <span style={styles.meta}><strong>Member:</strong> {memberName}</span>}
            {trainerName && <span style={styles.meta}><strong>Trainer:</strong> {trainerName}</span>}
          </div>

          {/* Member notes section */}
          {role === 'member' && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>My Notes</div>
              {!notesBeingEdited ? (
                <div style={styles.notesView}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{notesVal || '—'}</div>
                  <div>
                    <button className="btn" style={styles.btnSm} onClick={() => onEditNotes(w)}>Edit</button>
                  </div>
                </div>
              ) : (
                <div style={styles.notesEdit}>
                  <textarea
                    value={notesVal}
                    onChange={(e) => onChangeNotes(id, e.target.value)}
                    rows={3}
                    style={styles.textarea}
                    placeholder="Add personal notes about this workout..."
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn"
                      style={styles.btnSm}
                      onClick={() => onSaveNotes(w)}
                      disabled={!!savingNotes[id]}
                    >
                      {savingNotes[id] ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="btn"
                      style={{ ...styles.btnSm, ...styles.ghost }}
                      onClick={() => onCancelNotes(id)}
                      disabled={!!savingNotes[id]}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trainer controls */}
          {role === 'trainer' && (
            <div style={{ marginTop: 8 }}>
              <button className="btn" style={styles.btnSm} onClick={() => startEditWorkout(w)}>Edit</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const pager = (
    <div style={styles.pager}>
      <button
        className="btn"
        style={{ ...styles.btnSm, ...(page <= 1 ? styles.btnDisabled : {}) }}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page <= 1 || loading}
      >
        Prev
      </button>
      <div style={{ minWidth: 80, textAlign: 'center' }}>
        Page {page} / {totalPages}
      </div>
      <button
        className="btn"
        style={{ ...styles.btnSm, ...(page >= totalPages ? styles.btnDisabled : {}) }}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page >= totalPages || loading}
      >
        Next
      </button>
    </div>
  );

  return (
    <div className="container" style={{ padding: 24 }}>
      <h2>Workouts</h2>

      {role === 'trainer' && (
        <div style={{ marginBottom: 12 }}>
          <button className="btn" onClick={openAssign}>Assign Workout</button>
        </div>
      )}

      {error && <div style={styles.error} role="alert">{error}</div>}
      {success && <div style={styles.success} role="status">{success}</div>}
      {loading && <div style={{ marginTop: 8 }}>Loading workouts...</div>}
      {!loading && !items.length && <div style={{ marginTop: 8 }}>No workouts found.</div>}

      {!loading && items.length > 0 && (
        <>
          {pager}
          <div style={styles.grid}>
            {items.map(renderWorkoutItem)}
          </div>
          {pager}
        </>
      )}

      {/* Trainer Assign/Edit Modal */}
      {assignOpen && role === 'trainer' && (
        <div style={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={{ fontWeight: 700 }}>{editingWorkout ? 'Edit Workout' : 'Assign Workout'}</div>
              <button onClick={closeAssign} style={styles.modalClose} aria-label="Close">✕</button>
            </div>
            <form onSubmit={editingWorkout ? submitEdit : submitAssign} style={styles.form}>
              <label style={styles.label}>Member ID</label>
              <input
                value={assignForm.member_id}
                onChange={(e) => onAssignField('member_id', e.target.value)}
                placeholder="Member ID"
                style={styles.input}
                required
                disabled={savingTrainerAction}
              />
              <label style={styles.label}>Title</label>
              <input
                value={assignForm.title}
                onChange={(e) => onAssignField('title', e.target.value)}
                placeholder="e.g., Push Day"
                style={styles.input}
                required
                disabled={savingTrainerAction}
              />
              <label style={styles.label}>Description</label>
              <textarea
                value={assignForm.description}
                onChange={(e) => onAssignField('description', e.target.value)}
                placeholder="Workout details..."
                rows={3}
                style={styles.textarea}
                disabled={savingTrainerAction}
              />
              <label style={styles.label}>Date</label>
              <input
                type="date"
                value={assignForm.date}
                onChange={(e) => onAssignField('date', e.target.value)}
                style={styles.input}
                disabled={savingTrainerAction}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn" type="submit" disabled={savingTrainerAction}>
                  {savingTrainerAction ? (editingWorkout ? 'Saving...' : 'Assigning...') : (editingWorkout ? 'Save' : 'Assign')}
                </button>
                <button type="button" className="btn" style={{ ...styles.ghost }} onClick={closeAssign} disabled={savingTrainerAction}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 12 },
  card: { border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-secondary)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  body: { display: 'flex', flexDirection: 'column', gap: 8 },
  metaRow: { display: 'flex', gap: 12, flexWrap: 'wrap', opacity: 0.9, fontSize: 14 },
  meta: { },
  notesView: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, border: '1px solid var(--border-color)', padding: 8, borderRadius: 8, background: 'var(--bg-primary)' },
  notesEdit: { display: 'flex', flexDirection: 'column', gap: 8 },
  textarea: { padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', resize: 'vertical' },
  btnSm: { padding: '8px 10px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  ghost: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)' },
  pager: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 },
  success: { marginTop: 8, background: '#e6ffed', border: '1px solid #b7eb8f', padding: '8px 10px', borderRadius: 8, color: '#237804' },
  error: { marginTop: 8, background: '#fde7e9', border: '1px solid #f5c2c7', padding: '8px 10px', borderRadius: 8, color: '#b00020' },

  // Modal
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 },
  modal: { background: 'var(--bg-primary)', color: 'var(--text-primary)', borderRadius: 10, border: '1px solid var(--border-color)', width: '100%', maxWidth: 520, padding: 12 },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalClose: { background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-primary)' },

  form: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontWeight: 600, fontSize: 14 },
  input: { padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' },
};
