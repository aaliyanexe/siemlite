import { useEffect, useState, useMemo, useRef } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import {
  listThreatTypes,
  createThreatType,
  updateThreatType,
  deactivateThreatType,
} from '../api/threatTypes.api';
import { useAuthStore } from '../store/authStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Network', 'Endpoint', 'Application', 'Social Engineering', 'Insider'];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

const SEVERITY_STYLES = {
  Critical: { dot: '#ef4444', label: 'text-red-400',    border: '#ef4444' },
  High:     { dot: '#f97316', label: 'text-orange-400', border: '#f97316' },
  Medium:   { dot: '#eab308', label: 'text-yellow-400', border: '#eab308' },
  Low:      { dot: '#3b82f6', label: 'text-blue-400',   border: '#3b82f6' },
};

const CATEGORY_ICONS = {
  Network:            '⬡',
  Endpoint:           '◻',
  Application:        '◈',
  'Social Engineering': '◉',
  Insider:            '◆',
};

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '',
  severity_default: '',
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function SeverityDot({ severity, size = 8 }) {
  const color = SEVERITY_STYLES[severity]?.dot ?? '#5c4a32';
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

function CategoryPill({ category, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 20,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
        background: active ? 'rgba(255,69,0,0.12)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {CATEGORY_ICONS[category]} {category}
    </button>
  );
}

// ─── Threat Type Card ─────────────────────────────────────────────────────────

function ThreatTypeCard({ tt, isAdmin, onEdit, onDeactivate }) {
  const sev = SEVERITY_STYLES[tt.severity_default] ?? SEVERITY_STYLES.Low;
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `1.5px solid ${sev.border}70`,
        borderRadius: 8,
        padding: '16px 18px',
        opacity: tt.is_active ? 1 : 0.45,
        position: 'relative',
        transition: 'border-color 0.15s',
      }}
    >
      {/* inactive badge */}
      {!tt.is_active && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border-default)',
            borderRadius: 4,
            padding: '2px 6px',
          }}
        >
          Inactive
        </span>
      )}

      {/* name */}
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, paddingRight: tt.is_active ? 0 : 64 }}>
        {tt.name}
      </p>

      {/* description */}
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: 14,
          minHeight: 40,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {tt.description || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No description</span>}
      </p>

      {/* severity row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <SeverityDot severity={tt.severity_default} />
        <span style={{ fontSize: 12, color: sev.label.replace('text-', ''), fontFamily: 'PP Neue Montreal Mono, monospace' }}>
          {tt.severity_default}
        </span>
      </div>

      {/* admin actions */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={() => onEdit(tt)}
            style={{
              flex: 1,
              padding: '6px 0',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
          >
            Edit
          </button>
          {tt.is_active && (
            <button
              onClick={() => onDeactivate(tt)}
              style={{
                flex: 1,
                padding: '6px 0',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                color: '#ef4444',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
            >
              Deactivate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Swimlane ─────────────────────────────────────────────────────────────────

function Swimlane({ category, items, isAdmin, onEdit, onDeactivate, onAddClick }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ marginBottom: 32 }}>
      {/* lane header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setCollapsed(p => !p)}
      >
        <span style={{ fontSize: 16, color: 'var(--accent)' }}>{CATEGORY_ICONS[category]}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          {category}
        </span>
        <span
          style={{
            fontSize: 11,
            fontFamily: 'PP Neue Montreal Mono, monospace',
            color: 'var(--text-tertiary)',
            marginLeft: 2,
          }}
        >
          ({items.length})
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)', marginLeft: 8 }} />
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 8, transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </div>

      {/* cards grid */}
      {!collapsed && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {items.map(tt => (
            <ThreatTypeCard
              key={tt.threat_type_id}
              tt={tt}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          ))}
          {/* empty-state add zone for admins */}
          {items.length === 0 && isAdmin && (
            <button
              onClick={() => onAddClick(category)}
              style={{
                minHeight: 120,
                border: '1px dashed var(--border-default)',
                borderRadius: 8,
                background: 'transparent',
                color: 'var(--text-tertiary)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              <span style={{ fontSize: 20 }}>+</span>
              <span>Add {category} threat type</span>
            </button>
          )}
          {items.length === 0 && !isAdmin && (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '20px 0', fontStyle: 'italic' }}>
              No threat types in this category
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Drawer (Create / Edit) ───────────────────────────────────────────────────

function ThreatTypeDrawer({ open, onClose, onSave, initial, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(initial ?? EMPTY_FORM);
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [open, initial]);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.name.trim().length > 50) e.name = 'Max 50 characters';
    if (!form.category) e.category = 'Select a category';
    if (!form.severity_default) e.severity_default = 'Select a severity';
    if (form.description && form.description.length > 300) e.description = 'Max 300 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(form);
  };

  if (!open) return null;

  const isEdit = !!initial?.threat_type_id;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
        }}
      />
      {/* drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 420,
          background: 'var(--bg-elevated)',
          borderLeft: '1px solid var(--border-default)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s ease',
        }}
      >
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Threat Type' : 'New Threat Type'}
          </p>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Field label="Name" error={errors.name} required>
            <input
              ref={firstInputRef}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. SQL Injection"
              style={inputStyle(!!errors.name)}
            />
          </Field>

          <Field label="Category" error={errors.category} required>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => set('category', c)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: `1px solid ${form.category === c ? 'var(--accent)' : 'var(--border-default)'}`,
                    background: form.category === c ? 'rgba(255,69,0,0.12)' : 'transparent',
                    color: form.category === c ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {CATEGORY_ICONS[c]} {c}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Default Severity" error={errors.severity_default} required>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {SEVERITIES.map(s => {
                const sev = SEVERITY_STYLES[s];
                const active = form.severity_default === s;
                return (
                  <button
                    key={s}
                    onClick={() => set('severity_default', s)}
                    style={{
                      flex: 1,
                      padding: '7px 4px',
                      borderRadius: 6,
                      border: `1px solid ${active ? sev.dot : 'var(--border-default)'}`,
                      background: active ? `${sev.dot}18` : 'transparent',
                      color: active ? sev.dot : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      transition: 'all 0.15s',
                    }}
                  >
                    <SeverityDot severity={s} size={6} />
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Description" error={errors.description}>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of this threat type..."
              rows={4}
              style={{ ...inputStyle(!!errors.description), resize: 'vertical' }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textAlign: 'right' }}>
              {form.description?.length ?? 0}/300
            </p>
          </Field>
        </div>

        {/* footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={btnPrimary}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Deactivate Confirm Modal ──────────────────────────────────────────────────

function DeactivateModal({ open, tt, onClose, onConfirm, loading }) {
  if (!open || !tt) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60 }} />
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 440,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 10,
          zIndex: 70,
          padding: 24,
          animation: 'fadeIn 0.15s ease',
        }}
      >
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translate(-50%,-48%); } to { opacity: 1; transform: translate(-50%,-50%); } }`}</style>

        {/* warning icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#ef4444', flexShrink: 0 }}>⚠</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Deactivate Threat Type</p>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
          You are about to deactivate <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{tt.name}</span>.
        </p>

        {/* consequence callout */}
        <div
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.6, margin: 0 }}>
            This threat type may be linked to open incidents. Deactivating will remove it from new incident creation. This action cannot be undone from this interface.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '8px 0',
              background: '#ef4444',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Deactivating...' : 'Yes, Deactivate'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '8px 12px',
  background: 'var(--bg-overlay)',
  border: `1px solid ${hasError ? '#ef4444' : 'var(--border-default)'}`,
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.15s',
});

const btnPrimary = {
  flex: 1, padding: '8px 0',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 6,
  color: '#111',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnSecondary = {
  flex: 1, padding: '8px 0',
  background: 'var(--bg-overlay)',
  border: '1px solid var(--border-default)',
  borderRadius: 6,
  color: 'var(--text-secondary)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

function Field({ label, error, required, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            padding: '10px 16px',
            background: t.type === 'error' ? '#1a0a0a' : 'var(--bg-elevated)',
            border: `1px solid ${t.type === 'error' ? '#ef4444' : 'var(--border-strong)'}`,
            borderLeft: `3px solid ${t.type === 'error' ? '#ef4444' : 'var(--accent)'}`,
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontSize: 13,
            minWidth: 260,
            animation: 'slideUp 0.2s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <style>{`@keyframes slideUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ThreatTypes() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';

  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null); // null = all

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [savingDrawer, setSavingDrawer] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [savingDeactivate, setSavingDeactivate] = useState(false);

  const [toasts, setToasts] = useState([]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const toast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTypes = async (opts = {}) => {
    setLoading(true);
    try {
      const shouldFilterActive = opts.activeOnly !== undefined ? opts.activeOnly : activeOnly;
      const params = shouldFilterActive ? { active_only: 'true' } : {};
      const res = await listThreatTypes(params);
      const rows = Array.isArray(res) ? res : (res?.data ?? []);
      setTypes(rows);
    } catch {
      toast('Failed to load threat types', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const handleActiveOnlyToggle = () => {
    const next = !activeOnly;
    setActiveOnly(next);
    fetchTypes({ activeOnly: next });
  };

  // ── Filtered + grouped ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return types.filter(t =>
      (!categoryFilter || t.category === categoryFilter) &&
      (t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q))
    );
  }, [types, search, categoryFilter]);

  const grouped = useMemo(() => {
    return CATEGORIES.reduce((acc, cat) => {
      acc[cat] = filtered.filter(t => t.category === cat);
      return acc;
    }, {});
  }, [filtered]);

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate = (presetCategory = null) => {
    setEditTarget(presetCategory ? { category: presetCategory } : null);
    setDrawerOpen(true);
  };

  const openEdit = (tt) => {
    setEditTarget(tt);
    setDrawerOpen(true);
  };

  const handleSave = async (form) => {
    setSavingDrawer(true);
    try {
      if (editTarget?.threat_type_id) {
        const res = await updateThreatType(editTarget.threat_type_id, form);
        setTypes(p => p.map(t => t.threat_type_id === editTarget.threat_type_id ? ((Array.isArray(res) ? res : res?.data) ?? t) : t));
        toast('Threat type updated');
      } else {
        const res = await createThreatType(form);
        setTypes(p => [...p, Array.isArray(res) ? res : (res?.data ?? res)]);
        toast('Threat type created');
      }
      setDrawerOpen(false);
    } catch (err) {
      toast(err?.response?.data?.error?.message ?? 'Something went wrong', 'error');
    } finally {
      setSavingDrawer(false);
    }
  };

  // ── Deactivate ────────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setSavingDeactivate(true);
    try {
      const res = await deactivateThreatType(deactivateTarget.threat_type_id);
      setTypes(p => p.map(t => t.threat_type_id === deactivateTarget.threat_type_id ? ((Array.isArray(res) ? res : res?.data) ?? t) : t));
      toast(`"${deactivateTarget.name}" deactivated`);
      setDeactivateTarget(null);
    } catch (err) {
      toast(err?.response?.data?.error?.message ?? 'Failed to deactivate', 'error');
    } finally {
      setSavingDeactivate(false);
    }
  };

  // ── Counts ────────────────────────────────────────────────────────────────
  const activeCount = types.filter(t => t.is_active).length;
  const totalCount = types.length;

  return (
    <PageWrapper>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 var(--content-pad, 32px) 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '12px',
            paddingTop: '12px',
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Threat Types
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, fontFamily: 'PP Neue Montreal Mono, monospace' }}>
              {activeCount} active · {totalCount} total
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => openCreate()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                color: '#111',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              + New Threat Type
            </button>
          )}
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 12,
            paddingBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {/* search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 13, pointerEvents: 'none' }}>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search threat types..."
              style={{
                paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                color: 'var(--text-primary)',
                fontSize: 13,
                width: 220,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          {/* active only toggle */}
          <button
            onClick={handleActiveOnlyToggle}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1px solid ${activeOnly ? 'var(--accent)' : 'var(--border-default)'}`,
              background: activeOnly ? 'rgba(255,69,0,0.12)' : 'transparent',
              color: activeOnly ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            Active only
          </button>

          {/* divider */}
          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

          {/* category pills */}
          <CategoryPill
            category="All"
            active={!categoryFilter}
            onClick={() => setCategoryFilter(null)}
          />
          {CATEGORIES.map(c => (
            <CategoryPill
              key={c}
              category={c}
              active={categoryFilter === c}
              onClick={() => setCategoryFilter(prev => prev === c ? null : c)}
            />
          ))}
        </div>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            Loading threat types...
          </div>
        ) : totalCount === 0 ? (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 14,
            }}
          >
            <p style={{ marginBottom: 8 }}>No threat types found</p>
            {isAdmin && (
              <button onClick={() => openCreate()} style={{ ...btnPrimary, flex: 'none', padding: '8px 20px', display: 'inline-block' }}>
                Create your first threat type
              </button>
            )}
          </div>
        ) : (
          CATEGORIES
            .filter(cat => !categoryFilter || categoryFilter === cat)
            .map(cat => (
              <Swimlane
                key={cat}
                category={cat}
                items={grouped[cat]}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDeactivate={tt => setDeactivateTarget(tt)}
                onAddClick={openCreate}
              />
            ))
        )}
      </div>

      {/* ── Drawer ──────────────────────────────────────────────────────────── */}
      <ThreatTypeDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
        loading={savingDrawer}
      />

      {/* ── Deactivate modal ─────────────────────────────────────────────────── */}
      <DeactivateModal
        open={!!deactivateTarget}
        tt={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        loading={savingDeactivate}
      />

      {/* ── Toasts ──────────────────────────────────────────────────────────── */}
      <Toast toasts={toasts} />
    </PageWrapper>
  );
}