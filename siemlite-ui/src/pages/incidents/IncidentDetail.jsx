import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import {
  getIncident,
  getTimeline,
  getResponses,
  assignIncident,
  changeStatus,
  resolveIncident,
  reopenIncident,
  deleteIncident,
  createResponse,
  updateResponse,
  deleteResponse,
  listAnalysts,
} from '../../api/incidents.api';
import { useAuthStore } from '../../store/authStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)', dot: '#ef4444' },
  High:     { color: '#f97316', bg: 'rgba(249,115,22,0.10)', dot: '#f97316' },
  Medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.10)',  dot: '#eab308' },
  Low:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', dot: '#3b82f6' },
};

const STATUS_CONFIG = {
  Open:          { color: '#f97316', bg: 'rgba(249,115,22,0.10)'  },
  Investigating: { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)'  },
  Resolved:      { color: '#22c55e', bg: 'rgba(34,197,94,0.10)'   },
  Reopened:      { color: '#a855f7', bg: 'rgba(168,85,247,0.10)'  },
};

const STATUS_PIPELINE = ['Open', 'Investigating', 'Resolved'];

const ACTION_TYPES = ['Containment', 'Eradication', 'Recovery', 'Investigation', 'Escalation'];

const ACTION_TYPE_CONFIG = {
  Containment:   { color: '#f97316', icon: '⊘' },
  Eradication:   { color: '#ef4444', icon: '✕' },
  Recovery:      { color: '#22c55e', icon: '↺' },
  Investigation: { color: '#3b82f6', icon: '◎' },
  Escalation:    { color: '#a855f7', icon: '↑' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SlaCountdown({ deadline, breached }) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline) - Date.now();
      if (breached || diff <= 0) {
        const over = Math.abs(diff);
        const h = Math.floor(over / 3600000);
        const m = Math.floor((over % 3600000) / 60000);
        setDisplay(h > 0 ? `${h}h ${m}m overdue` : `${m}m overdue`);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setDisplay(h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`);
    };
    calc();
    const t = setInterval(calc, 15000);
    return () => clearInterval(t);
  }, [deadline, breached]);

  const isOver = breached || new Date(deadline) <= Date.now();
  return (
    <span style={{
      fontFamily: 'PP Neue Montreal Mono, monospace',
      fontSize: 13, fontWeight: 600,
      color: isOver ? '#ef4444' : '#22c55e',
    }}>
      {isOver ? '⚠ ' : '✓ '}{display}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.Low;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: cfg.color,
      fontFamily: 'PP Neue Montreal Mono, monospace',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Open;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: 20,
      background: cfg.bg, border: `1px solid ${cfg.color}40`,
      fontSize: 12, fontWeight: 500, color: cfg.color,
      fontFamily: 'inherit',
    }}>
      {status}
    </span>
  );
}

function MetaRow({ label, value, mono = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-tertiary)',
      }}>{label}</span>
      <span style={{
        fontSize: 13, color: 'var(--text-primary)',
        fontFamily: mono ? 'PP Neue Montreal Mono, monospace' : 'inherit',
      }}>{value || '—'}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--text-tertiary)',
      marginBottom: 12,
    }}>{children}</p>
  );
}

// ─── Status Pipeline ──────────────────────────────────────────────────────────

function StatusPipeline({ current }) {
  const idx = STATUS_PIPELINE.indexOf(current === 'Reopened' ? 'Investigating' : current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
      {STATUS_PIPELINE.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        const cfg = STATUS_CONFIG[s];
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: active ? cfg.bg : done ? 'rgba(34,197,94,0.15)' : 'var(--bg-overlay)',
                border: `2px solid ${active ? cfg.color : done ? '#22c55e' : 'var(--border-default)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: active ? cfg.color : done ? '#22c55e' : 'var(--text-tertiary)',
                fontWeight: 700, marginBottom: 4,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 500, letterSpacing: '0.04em',
                color: active ? cfg.color : done ? '#22c55e' : 'var(--text-tertiary)',
                whiteSpace: 'nowrap',
              }}>{s}</span>
            </div>
            {i < STATUS_PIPELINE.length - 1 && (
              <div style={{
                height: 2, flex: 1, marginBottom: 18,
                background: done ? '#22c55e40' : 'var(--border-subtle)',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Response Action Card ─────────────────────────────────────────────────────

function ResponseActionCard({ action, isAdmin, currentUserId, onEdit, onDelete }) {
  const cfg = ACTION_TYPE_CONFIG[action.action_type] ?? ACTION_TYPE_CONFIG.Investigation;
  const canEdit = isAdmin || action.analyst_id === currentUserId;
  const withinWindow = Date.now() - new Date(action.action_date).getTime() < 3600000;

  return (
    <div style={{
      background: 'var(--bg-overlay)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 6, padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: cfg.color }}>{cfg.icon}</span>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: cfg.color,
          }}>{action.action_type}</span>
        </div>
        {canEdit && (isAdmin || withinWindow) && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => onEdit(action)} style={{
              background: 'none', border: 'none', color: 'var(--text-tertiary)',
              fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 6px',
              borderRadius: 4, transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >Edit</button>
            {isAdmin && (
              <button onClick={() => onDelete(action)} style={{
                background: 'none', border: 'none', color: 'var(--text-tertiary)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', padding: '2px 6px',
                borderRadius: 4, transition: 'color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >Delete</button>
            )}
          </div>
        )}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>
        {action.action_description}
      </p>
      <p style={{
        fontSize: 11, color: 'var(--text-tertiary)',
        fontFamily: 'PP Neue Montreal Mono, monospace',
      }}>
        {action.analyst_name} · {new Date(action.action_date).toLocaleString()}
        {action.edited_at && ' · edited'}
      </p>
    </div>
  );
}

// ─── Response Action Form ─────────────────────────────────────────────────────

function ResponseActionForm({ incidentId, editTarget, onSaved, onCancel }) {
  const [form, setForm] = useState({ action_type: editTarget?.action_type ?? '', action_description: editTarget?.action_description ?? '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.action_type) { setError('Select an action type'); return; }
    if (!form.action_description.trim()) { setError('Description is required'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        const res = await updateResponse(incidentId, editTarget.response_id, form);
        onSaved(Array.isArray(res) ? res : (res?.data ?? res), true);
      } else {
        const res = await createResponse(incidentId, form);
        onSaved(Array.isArray(res) ? res : (res?.data ?? res), false);
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 6, padding: 14, marginBottom: 12 }}>
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{error}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {ACTION_TYPES.map(t => {
          const cfg = ACTION_TYPE_CONFIG[t];
          const active = form.action_type === t;
          return (
            <button key={t} onClick={() => setForm(p => ({ ...p, action_type: t }))} style={{
              padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${active ? cfg.color : 'var(--border-default)'}`,
              background: active ? `${cfg.color}18` : 'transparent',
              color: active ? cfg.color : 'var(--text-secondary)',
              fontSize: 11, fontWeight: 500, fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}>{cfg.icon} {t}</button>
          );
        })}
      </div>
      <textarea
        value={form.action_description}
        onChange={e => setForm(p => ({ ...p, action_description: e.target.value }))}
        placeholder="Describe the action taken..."
        rows={3}
        style={{
          width: '100%', padding: '8px 10px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
          fontFamily: 'inherit', outline: 'none', resize: 'vertical',
          marginBottom: 8,
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '6px 0', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: '6px 0', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#111', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? 'Saving...' : editTarget ? 'Update' : 'Log Action'}
        </button>
      </div>
    </div>
  );
}

// ─── Resolve Form ─────────────────────────────────────────────────────────────

function ResolveForm({ incidentId, onResolved, onCancel }) {
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!summary.trim()) { setError('Resolution summary is required'); return; }
    setSaving(true);
    try {
      const res = await resolveIncident(incidentId, { resolution_summary: summary });
      onResolved(Array.isArray(res) ? res : (res?.data ?? res));
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Failed to resolve');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: 14, marginBottom: 12 }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: '#22c55e', marginBottom: 10 }}>Resolve Incident</p>
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{error}</p>}
      <textarea
        value={summary}
        onChange={e => setSummary(e.target.value)}
        placeholder="Describe how this incident was resolved..."
        rows={3}
        style={{
          width: '100%', padding: '8px 10px',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
          fontFamily: 'inherit', outline: 'none', resize: 'vertical', marginBottom: 8,
        }}
      />
      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>{summary.length}/500</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '6px 0', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, padding: '6px 0', background: '#22c55e', border: 'none', borderRadius: 6, color: '#111', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? 'Resolving...' : 'Confirm Resolve'}
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteModal({ open, onClose, onConfirm, loading }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 400, background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)', borderRadius: 10,
        zIndex: 70, padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#ef4444', flexShrink: 0 }}>⚠</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Delete Incident</p>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
          This will permanently delete the incident and all associated logs. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px 0', background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '8px 0', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px',
          background: t.type === 'error' ? '#1a0a0a' : 'var(--bg-elevated)',
          border: `1px solid ${t.type === 'error' ? '#ef4444' : 'var(--border-strong)'}`,
          borderLeft: `3px solid ${t.type === 'error' ? '#ef4444' : 'var(--accent)'}`,
          borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
          minWidth: 260, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.2s ease',
        }}>
          <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';
  const currentUserId = user?.user_id;

  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [responses, setResponses] = useState([]);
  const [analysts, setAnalysts] = useState([]);
  const [loading, setLoading] = useState(true);

  // action states
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingIncident, setDeletingIncident] = useState(false);
  const [assigningAnalyst, setAssigningAnalyst] = useState(false);
  const [selectedAnalyst, setSelectedAnalyst] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [reopening, setReopening] = useState(false);

  const [toasts, setToasts] = useState([]);

  const toast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [incRes, tlRes, respRes] = await Promise.all([
        getIncident(id),
        getTimeline(id),
        getResponses(id),
      ]);
      const inc = Array.isArray(incRes) ? incRes : (incRes?.data ?? incRes);
      const tl  = Array.isArray(tlRes)  ? tlRes  : (tlRes?.data  ?? []);
      const resp= Array.isArray(respRes)? respRes : (respRes?.data ?? []);
      setIncident(inc);
      setTimeline(tl);
      setResponses(resp);
    } catch {
      toast('Failed to load incident', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // load analysts for admin assign dropdown
  useEffect(() => {
    if (isAdmin) {
      listAnalysts().then(r => {
        const rows = Array.isArray(r) ? r : (r?.data ?? []);
        setAnalysts(rows);
      });
    }
  }, [isAdmin]);

  // ── Assign ────────────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (isAdmin && !selectedAnalyst) { toast('Select an analyst', 'error'); return; }
    setAssigningAnalyst(true);
    try {
      const body = isAdmin ? { assigned_analyst_id: Number(selectedAnalyst) } : {};
      const res = await assignIncident(id, body);
      setIncident(Array.isArray(res) ? res : (res?.data ?? res));
      toast('Analyst assigned');
      setSelectedAnalyst('');
    } catch (err) {
      toast(err?.response?.data?.error?.message ?? 'Failed to assign', 'error');
    } finally {
      setAssigningAnalyst(false);
    }
  };

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (newStatus) => {
    setChangingStatus(true);
    try {
      const res = await changeStatus(id, { status: newStatus });
      setIncident(Array.isArray(res) ? res : (res?.data ?? res));
      toast(`Status changed to ${newStatus}`);
    } catch (err) {
      toast(err?.response?.data?.error?.message ?? 'Failed to change status', 'error');
    } finally {
      setChangingStatus(false);
    }
  };

  // ── Reopen ────────────────────────────────────────────────────────────────
  const handleReopen = async () => {
    setReopening(true);
    try {
      const res = await reopenIncident(id);
      setIncident(Array.isArray(res) ? res : (res?.data ?? res));
      toast('Incident reopened');
    } catch (err) {
      toast(err?.response?.data?.error?.message ?? 'Failed to reopen', 'error');
    } finally {
      setReopening(false);
    }
  };

  // ── Resolve ───────────────────────────────────────────────────────────────
  const handleResolved = (updated) => {
    setIncident(updated);
    setShowResolveForm(false);
    toast('Incident resolved');
    fetchAll();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeletingIncident(true);
    try {
      await deleteIncident(id);
      toast('Incident deleted');
      setTimeout(() => navigate('/incidents'), 800);
    } catch (err) {
      toast(err?.response?.data?.error?.message ?? 'Failed to delete', 'error');
      setDeletingIncident(false);
      setShowDeleteModal(false);
    }
  };

  // ── Response actions ──────────────────────────────────────────────────────
  const handleResponseSaved = (saved, isEdit) => {
    if (isEdit) {
      setResponses(p => p.map(r => r.response_id === saved.response_id ? saved : r));
    } else {
      setResponses(p => [...p, saved]);
    }
    setShowResponseForm(false);
    setEditingResponse(null);
    toast(isEdit ? 'Response action updated' : 'Response action logged');
  };

  const handleResponseDelete = async (action) => {
    try {
      await deleteResponse(id, action.response_id);
      setResponses(p => p.filter(r => r.response_id !== action.response_id));
      toast('Response action deleted');
    } catch (err) {
      toast(err?.response?.data?.error?.message ?? 'Failed to delete', 'error');
    }
  };

  // ── Primary action button logic ───────────────────────────────────────────
  const canModify = isAdmin || incident?.assigned_analyst_id === currentUserId;

  const renderPrimaryAction = () => {
    if (!incident) return null;
    const { status, assigned_analyst_id } = incident;

    if (status === 'Resolved') {
      if (!isAdmin) return null;
      return (
        <button onClick={handleReopen} disabled={reopening} style={actionBtn('#a855f7')}>
          {reopening ? 'Reopening...' : '↺ Reopen Incident'}
        </button>
      );
    }

    if (status === 'Investigating' && canModify) {
      if (showResolveForm) return null;
      return (
        <button onClick={() => setShowResolveForm(true)} style={actionBtn('#22c55e')}>
          ✓ Resolve Incident
        </button>
      );
    }

    if (status === 'Open' && !assigned_analyst_id) {
      // assign flow
      if (isAdmin) {
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedAnalyst}
              onChange={e => setSelectedAnalyst(e.target.value)}
              style={{
                flex: 1, padding: '8px 10px',
                background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
                borderRadius: 6, color: selectedAnalyst ? 'var(--text-primary)' : 'var(--text-tertiary)',
                fontSize: 13, fontFamily: 'inherit', outline: 'none',
              }}
            >
              <option value="">Assign analyst...</option>
              {analysts.map(a => (
                <option key={a.user_id} value={a.user_id}>{a.name}</option>
              ))}
            </select>
            <button onClick={handleAssign} disabled={assigningAnalyst || !selectedAnalyst} style={actionBtn('var(--accent)', !selectedAnalyst)}>
              {assigningAnalyst ? '...' : 'Assign'}
            </button>
          </div>
        );
      }
      // analyst self-assign
      return (
        <button onClick={handleAssign} disabled={assigningAnalyst} style={actionBtn('var(--accent)')}>
          {assigningAnalyst ? 'Assigning...' : '→ Assign to Me'}
        </button>
      );
    }

    if (status === 'Open' && assigned_analyst_id && canModify) {
      return (
        <button onClick={() => handleStatusChange('Investigating')} disabled={changingStatus} style={actionBtn('#3b82f6')}>
          {changingStatus ? '...' : '▶ Start Investigating'}
        </button>
      );
    }

    if (status === 'Reopened' && canModify) {
      if (showResolveForm) return null;
      return (
        <button onClick={() => setShowResolveForm(true)} style={actionBtn('#22c55e')}>
          ✓ Resolve Incident
        </button>
      );
    }

    return null;
  };

  const actionBtn = (color, disabled = false) => ({
    width: '100%', padding: '10px 0',
    background: color, border: 'none',
    borderRadius: 6, color: '#111',
    fontSize: 13, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s', marginBottom: 10,
  });

  // ── Timeline humaniser ────────────────────────────────────────────────────
  const humaniseEntry = (e) => {
    const actor = e.actor_name ?? 'System';
    switch (e.action_type) {
      case 'INCIDENT_CREATED':    return `${actor} reported this incident`;
      case 'STATUS_CHANGED':      return `${actor} changed status from ${e.old_value} → ${e.new_value}`;
      case 'SEVERITY_CHANGED':    return `${actor} changed severity from ${e.old_value} → ${e.new_value}`;
      case 'ANALYST_ASSIGNED':    return `${actor} assigned analyst${e.new_value ? ` (${e.new_value})` : ''}`;
      case 'INCIDENT_RESOLVED':   return `${actor} resolved the incident`;
      case 'INCIDENT_REOPENED':   return `${actor} reopened the incident`;
      case 'INCIDENT_DELETED':    return `${actor} deleted the incident`;
      case 'RESPONSE_ACTION_ADDED':   return `${actor} logged a response action`;
      case 'RESPONSE_ACTION_EDITED':  return `${actor} edited a response action`;
      case 'RESPONSE_ACTION_DELETED': return `${actor} removed a response action`;
      case 'RESPONSE_ACTION': return e.action_description ?? `${actor} logged: ${e.response_action_type}`;
      default: return e.action_description ?? e.new_value ?? e.action_type;
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ padding: '60px var(--content-pad, 32px)', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
          Loading incident...
        </div>
      </PageWrapper>
    );
  }

  if (!incident) {
    return (
      <PageWrapper>
        <div style={{ padding: '60px var(--content-pad, 32px)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>Incident not found</p>
          <button onClick={() => navigate('/incidents')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>← Back to incidents</button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div style={{ padding: '0 var(--content-pad, 32px) 40px' }}>

        {/* ── Back + header ── */}
        <div style={{ paddingTop: 12, paddingBottom: 16 }}>
          <button onClick={() => navigate('/incidents')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12, display: 'block', padding: 0 }}>
            ← Back to Incidents
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: 'PP Neue Montreal Mono, monospace', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                  #{String(incident.incident_id).padStart(4, '0')}
                </span>
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
                {incident.sla_breached && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase' }}>SLA BREACHED</span>
                )}
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {incident.title}
              </h1>
            </div>
            {isAdmin && (
              <button onClick={() => setShowDeleteModal(true)} style={{
                padding: '6px 14px', background: '#ef4444',
                border: 'none', borderRadius: 6,
                color: '#111', fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit', flexShrink: 0, fontWeight: 500,
              }}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* ── Two column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* ── LEFT: content ── */}
          <div>

            {/* Description */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '20px 24px', marginBottom: 16 }}>
              <SectionLabel>Description</SectionLabel>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {incident.description || <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>No description provided</span>}
              </p>
            </div>

            {/* Metadata grid */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '20px 24px', marginBottom: 16 }}>
              <SectionLabel>Details</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                <MetaRow label="Reporter" value={incident.reporter_name} />
                <MetaRow label="Assigned Analyst" value={incident.analyst_name || 'Unassigned'} />
                <MetaRow label="Threat Type" value={incident.threat_type} />
                <MetaRow label="Asset" value={incident.asset_name} />
                <MetaRow label="Asset Type" value={incident.asset_type} />
                <MetaRow label="Asset Criticality" value={incident.asset_criticality} />
                <MetaRow label="Reported" value={new Date(incident.date_reported).toLocaleString()} mono />
                <MetaRow label="SLA Deadline" value={new Date(incident.sla_deadline).toLocaleString()} mono />
                {incident.resolved_at && <MetaRow label="Resolved At" value={new Date(incident.resolved_at).toLocaleString()} mono />}
                {incident.ttr_minutes && <MetaRow label="Time to Resolve" value={`${Math.floor(incident.ttr_minutes / 60)}h ${incident.ttr_minutes % 60}m`} mono />}
              </div>
            </div>

            {/* Resolution summary */}
            {incident.resolution_summary && (
              <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '20px 24px', marginBottom: 16 }}>
                <SectionLabel>Resolution Summary</SectionLabel>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{incident.resolution_summary}</p>
              </div>
            )}

            {/* Response Actions */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <SectionLabel>Response Actions</SectionLabel>
                </div>
                {canModify && incident.status !== 'Resolved' && !showResponseForm && !editingResponse && (
                  <button onClick={() => setShowResponseForm(true)} style={{
                    padding: '5px 12px', background: 'transparent',
                    border: '1px solid var(--border-default)', borderRadius: 6,
                    color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >+ Log Action</button>
                )}
              </div>

              {(showResponseForm || editingResponse) && (
                <ResponseActionForm
                  incidentId={id}
                  editTarget={editingResponse}
                  onSaved={handleResponseSaved}
                  onCancel={() => { setShowResponseForm(false); setEditingResponse(null); }}
                />
              )}

              {responses.length === 0 && !showResponseForm ? (
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  No response actions logged yet.
                  {incident.status === 'Investigating' && ' At least one is required to resolve.'}
                </p>
              ) : (
                responses.map(r => (
                  <ResponseActionCard
                    key={r.response_id}
                    action={r}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                    onEdit={(a) => { setEditingResponse(a); setShowResponseForm(false); }}
                    onDelete={handleResponseDelete}
                  />
                ))
              )}
            </div>

            {/* Timeline */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '20px 24px' }}>
              <SectionLabel>Timeline</SectionLabel>
              {timeline.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No timeline entries yet.</p>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 1, background: 'var(--border-subtle)' }} />
                  {timeline.map((e, i) => (
                    <div key={`${e.entry_type}-${e.entry_id}`} style={{ display: 'flex', gap: 14, marginBottom: i < timeline.length - 1 ? 16 : 0, position: 'relative' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: e.entry_type === 'response' ? 'var(--bg-overlay)' : 'var(--bg-elevated)', border: `1px solid ${e.entry_type === 'response' ? 'var(--accent)' : 'var(--border-strong)'}`, flexShrink: 0, marginTop: 1, zIndex: 1 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 2 }}>
                          {humaniseEntry(e)}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal Mono, monospace' }}>
                          {new Date(e.event_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: actions panel ── */}
          <div style={{ position: 'sticky', top: 20 }}>

            {/* SLA */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '16px 20px', marginBottom: 12 }}>
              <SectionLabel>SLA Status</SectionLabel>
              <SlaCountdown deadline={incident.sla_deadline} breached={incident.sla_breached} />
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, fontFamily: 'PP Neue Montreal Mono, monospace' }}>
                Deadline: {new Date(incident.sla_deadline).toLocaleString()}
              </p>
            </div>

            {/* Status pipeline */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '16px 20px', marginBottom: 12 }}>
              <SectionLabel>Status</SectionLabel>
              <StatusPipeline current={incident.status} />
              {incident.status === 'Reopened' && (
                <div style={{ marginTop: 4, padding: '6px 10px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 4 }}>
                  <p style={{ fontSize: 11, color: '#a855f7' }}>Reopened — requires re-investigation</p>
                </div>
              )}
            </div>

            {/* Primary action */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '16px 20px', marginBottom: 12 }}>
              <SectionLabel>Actions</SectionLabel>
              {showResolveForm && (
                <ResolveForm
                  incidentId={id}
                  onResolved={handleResolved}
                  onCancel={() => setShowResolveForm(false)}
                />
              )}
              {renderPrimaryAction()}
              {!canModify && incident.status !== 'Resolved' && (
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  Only the assigned analyst or an Admin can take actions on this incident.
                </p>
              )}
            </div>

            {/* Quick meta */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '16px 20px' }}>
              <SectionLabel>Quick Info</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <MetaRow label="Threat Type" value={incident.threat_type} />
                <MetaRow label="Asset" value={incident.asset_name} />
                <MetaRow label="Analyst" value={incident.analyst_name || 'Unassigned'} />
                <MetaRow label="Response Actions" value={`${responses.length} logged`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={deletingIncident}
      />

      <Toast toasts={toasts} />
    </PageWrapper>
  );
}