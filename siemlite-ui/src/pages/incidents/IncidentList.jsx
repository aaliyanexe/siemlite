import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import {
  listIncidents,
  createIncident,
} from '../../api/incidents.api';
import { listThreatTypes } from '../../api/threatTypes.api';
import { listAssets } from '../../api/assets.api';
import { useAuthStore } from '../../store/authStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['Open', 'Investigating', 'Resolved', 'Reopened'];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

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

const EMPTY_FORM = {
  title: '',
  description: '',
  severity: '',
  threat_type_id: '',
  asset_id: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SlaCell({ deadline, breached }) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline) - Date.now();
      if (breached || diff <= 0) {
        const over = Math.abs(diff);
        const h = Math.floor(over / 3600000);
        const m = Math.floor((over % 3600000) / 60000);
        setDisplay(h > 0 ? `${h}h ${m}m over` : `${m}m over`);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setDisplay(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [deadline, breached]);

  const isOver = breached || new Date(deadline) <= Date.now();
  return (
    <span
      style={{
        fontFamily: 'PP Neue Montreal Mono, monospace',
        fontSize: 12,
        color: isOver ? '#ef4444' : 'var(--text-secondary)',
        fontWeight: isOver ? 600 : 400,
      }}
    >
      {isOver ? '⚠ ' : ''}{display}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.Low;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      
      
      
      fontSize: 11, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: cfg.color,
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
      
      
      
      fontSize: 11, fontWeight: 500,
      letterSpacing: '0.04em',
      color: cfg.color,
      fontFamily: 'inherit',
    }}>
      {status}
    </span>
  );
}

function StatCard({ label, value, color, sublabel }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      padding: '16px 20px',
      minWidth: 0,
    }}>
      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-tertiary)',
        marginBottom: 8, fontFamily: 'inherit',
      }}>{label}</p>
      <p style={{
        fontSize: 28, fontWeight: 700, color: color ?? 'var(--text-primary)',
        letterSpacing: '-0.02em', fontFamily: 'PP Neue Montreal Mono, monospace',
        lineHeight: 1,
      }}>{value}</p>
      {sublabel && (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 6 }}>{sublabel}</p>
      )}
    </div>
  );
}

// ─── Create Drawer ────────────────────────────────────────────────────────────

function CreateDrawer({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [threatTypes, setThreatTypes] = useState([]);
  const [assets, setAssets] = useState([]);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 80);
      // load dropdowns
      listThreatTypes({ active_only: 'true' })
        .then(r => setThreatTypes(Array.isArray(r) ? r : (r?.data ?? [])));
      listAssets({ limit: 200 })
        .then(r => setAssets(Array.isArray(r) ? r : (r?.data ?? [])));
    }
  }, [open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.title.trim().length > 100) e.title = 'Max 100 characters';
    if (!form.severity) e.severity = 'Select a severity';
    if (!form.threat_type_id) e.threat_type_id = 'Select a threat type';
    if (!form.asset_id) e.asset_id = 'Select an asset';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await createIncident({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        severity: form.severity,
        threat_type_id: Number(form.threat_type_id),
        asset_id: Number(form.asset_id),
      });
      const created = Array.isArray(res) ? res : (res?.data ?? res);
      onCreated(created);
      onClose();
    } catch (err) {
      setErrors({ submit: err?.response?.data?.error?.message ?? 'Failed to create incident' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 460,
        background: 'var(--bg-elevated)',
        borderLeft: '1px solid var(--border-default)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.2s ease',
      }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Report Incident</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Create a new security incident</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {errors.submit && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6 }}>
              <p style={{ fontSize: 12, color: '#fca5a5' }}>{errors.submit}</p>
            </div>
          )}

          <DrawerField label="Title" error={errors.title} required>
            <input
              ref={firstInputRef}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Suspicious login attempt on VPN"
              style={drawerInput(!!errors.title)}
            />
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textAlign: 'right' }}>{form.title.length}/100</p>
          </DrawerField>

          <DrawerField label="Severity" error={errors.severity} required>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {SEVERITIES.map(s => {
                const cfg = SEVERITY_CONFIG[s];
                const active = form.severity === s;
                return (
                  <button key={s} onClick={() => set('severity', s)} style={{
                    flex: 1, padding: '7px 4px', borderRadius: 6,
                    border: `1px solid ${active ? cfg.color : 'var(--border-default)'}`,
                    background: active ? cfg.bg : 'transparent',
                    color: active ? cfg.color : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 7, transition: 'all 0.15s',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                    {s}
                  </button>
                );
              })}
            </div>
          </DrawerField>

          <DrawerField label="Threat Type" error={errors.threat_type_id} required>
            <select
              value={form.threat_type_id}
              onChange={e => set('threat_type_id', e.target.value)}
              style={{ ...drawerInput(!!errors.threat_type_id), cursor: 'pointer' }}
            >
              <option value="">Select threat type...</option>
              {threatTypes.map(t => (
                <option key={t.threat_type_id} value={t.threat_type_id}>{t.name}</option>
              ))}
            </select>
          </DrawerField>

          <DrawerField label="Asset" error={errors.asset_id} required>
            <select
              value={form.asset_id}
              onChange={e => set('asset_id', e.target.value)}
              style={{ ...drawerInput(!!errors.asset_id), cursor: 'pointer' }}
            >
              <option value="">Select asset...</option>
              {assets.map(a => (
                <option key={a.asset_id} value={a.asset_id}>{a.asset_name}</option>
              ))}
            </select>
          </DrawerField>

          <DrawerField label="Description">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the incident in detail..."
              rows={4}
              style={{ ...drawerInput(false), resize: 'vertical' }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, textAlign: 'right' }}>{form.description.length}/1000</p>
          </DrawerField>
        </div>

        {/* footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={btnPrimary}>
            {saving ? 'Reporting...' : 'Report Incident'}
          </button>
        </div>
      </div>
    </>
  );
}

function DrawerField({ label, error, required, children }) {
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

// ─── Shared styles ────────────────────────────────────────────────────────────

const drawerInput = (hasError) => ({
  width: '100%', padding: '8px 12px',
  background: 'var(--bg-overlay)',
  border: `1px solid ${hasError ? '#ef4444' : 'var(--border-default)'}`,
  borderRadius: 6, color: 'var(--text-primary)',
  fontSize: 13, fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.15s',
});

const btnPrimary = {
  flex: 1, padding: '8px 0',
  background: 'var(--accent)', border: 'none',
  borderRadius: 6, color: '#111',
  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
};

const btnSecondary = {
  flex: 1, padding: '8px 0',
  background: 'var(--bg-overlay)',
  border: '1px solid var(--border-default)',
  borderRadius: 6, color: 'var(--text-secondary)',
  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
};

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

export default function IncidentList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [severityFilter, setSeverityFilter] = useState(null);
  const [slaBreached, setSlaBreached] = useState(false);
  const [sortField, setSortField] = useState('date_reported');
  const [sortOrder, setSortOrder] = useState('desc');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const searchTimer = useRef(null);

  const toast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchIncidents = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        page: opts.page ?? page,
        limit: 20,
        ...(opts.status ?? statusFilter ? { status: opts.status ?? statusFilter } : {}),
        ...(opts.severity ?? severityFilter ? { severity: opts.severity ?? severityFilter } : {}),
        ...(opts.slaBreached ?? slaBreached ? { sla_breached: 'true' } : {}),
        ...(opts.search ?? search ? { search: opts.search ?? search } : {}),
        sort: opts.sort ?? sortField,
        order: opts.order ?? sortOrder,
      };
      const res = await listIncidents(params);
      const rows = Array.isArray(res) ? res : (res?.data ?? []);
      const meta = res?.pagination ?? null;
      setIncidents(rows);
      setPagination(meta);
    } catch {
      toast('Failed to load incidents', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, severityFilter, slaBreached, search, sortField, sortOrder]);

  useEffect(() => { fetchIncidents(); }, [page, statusFilter, severityFilter, slaBreached, search, sortField, sortOrder]);

  // debounced search
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  const handleStatusFilter = (s) => {
    setStatusFilter(prev => prev === s ? null : s);
    setPage(1);
  };

  const handleSeverityFilter = (s) => {
    setSeverityFilter(prev => prev === s ? null : s);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(p => p === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // ── Stats derived from current data ───────────────────────────────────────
  const stats = useMemo(() => {
    const open = incidents.filter(i => i.status === 'Open').length;
    const investigating = incidents.filter(i => i.status === 'Investigating').length;
    const breached = incidents.filter(i => i.sla_breached).length;
    const critical = incidents.filter(i => i.severity === 'Critical').length;
    return { open, investigating, breached, critical };
  }, [incidents]);

  const handleCreated = (incident) => {
    toast('Incident reported successfully');
    navigate(`/incidents/${incident.incident_id}`);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>↕</span>;
    return <span style={{ color: 'var(--accent)', marginLeft: 4 }}>{sortOrder === 'desc' ? '↓' : '↑'}</span>;
  };

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <PageWrapper>
      <div style={{ padding: '0 var(--content-pad, 32px) 32px' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Incidents</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, fontFamily: 'PP Neue Montreal Mono, monospace' }}>
              {pagination ? `${pagination.total} total` : `${incidents.length} loaded`}
              {(statusFilter || severityFilter || slaBreached || search) && ' · filtered'}
            </p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', background: 'var(--accent)',
              border: 'none', borderRadius: 6, color: '#111',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            + Report Incident
          </button>
        </div>

        {/* ── Stats bar ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <StatCard label="Open" value={stats.open} color="var(--accent)" sublabel="awaiting assignment" />
          <StatCard label="Investigating" value={stats.investigating} color="#3b82f6" sublabel="in progress" />
          <StatCard label="SLA Breached" value={stats.breached} color="#ef4444" sublabel="overdue" />
          <StatCard label="Critical" value={stats.critical} color="#ef4444" sublabel="this page" />
        </div>

        {/* ── Filter bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 13, pointerEvents: 'none' }}>⌕</span>
            <input
              value={searchInput}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder="Search incidents..."
              style={{
                paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
                width: 220, fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

          {/* status pills */}
          {STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => handleStatusFilter(s)} style={{
                padding: '4px 12px', borderRadius: 20,
                border: `1px solid ${active ? cfg.color : 'var(--border-default)'}`,
                background: active ? cfg.bg : 'transparent',
                color: active ? cfg.color : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>{s}</button>
            );
          })}

          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

          {/* severity pills */}
          {SEVERITIES.map(s => {
            const cfg = SEVERITY_CONFIG[s];
            const active = severityFilter === s;
            return (
              <button key={s} onClick={() => handleSeverityFilter(s)} style={{
                padding: '4px 12px', borderRadius: 20,
                border: `1px solid ${active ? cfg.color : 'var(--border-default)'}`,
                background: active ? cfg.bg : 'transparent',
                color: active ? cfg.color : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>{s}</button>
            );
          })}

          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />

          {/* SLA breached toggle */}
          <button onClick={() => { setSlaBreached(p => !p); setPage(1); }} style={{
            padding: '4px 12px', borderRadius: 20,
            border: `1px solid ${slaBreached ? '#ef4444' : 'var(--border-default)'}`,
            background: slaBreached ? 'rgba(239,68,68,0.10)' : 'transparent',
            color: slaBreached ? '#ef4444' : 'var(--text-secondary)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>⚠ SLA Breached</button>

          {/* clear all */}
          {(statusFilter || severityFilter || slaBreached || search) && (
            <button onClick={() => { setStatusFilter(null); setSeverityFilter(null); setSlaBreached(false); setSearch(''); setSearchInput(''); setPage(1); }} style={{
              padding: '4px 10px', borderRadius: 20, border: 'none',
              background: 'transparent', color: 'var(--text-tertiary)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              textDecoration: 'underline', transition: 'color 0.15s',
            }}>Clear all</button>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
          {/* thead */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr 110px 130px 160px 120px',
            padding: '0 16px', height: 40, alignItems: 'center',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
          }}>
            {[
              { label: 'ID', field: null },
              { label: 'Title', field: 'date_reported' },
              { label: 'Severity', field: 'severity' },
              { label: 'Status', field: 'status' },
              { label: 'Analyst', field: null },
              { label: 'SLA', field: 'sla_deadline' },
            ].map(({ label, field }) => (
              <span
                key={label}
                onClick={field ? () => handleSort(field) : undefined}
                style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--text-tertiary)',
                  cursor: field ? 'pointer' : 'default',
                  userSelect: 'none', display: 'flex', alignItems: 'center',
                }}
              >
                {label}
                {field && <SortIcon field={field} />}
              </span>
            ))}
          </div>

          {/* rows */}
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Loading incidents...
            </div>
          ) : incidents.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
              <p style={{ marginBottom: 8 }}>No incidents found</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {(statusFilter || severityFilter || slaBreached || search) ? 'Try adjusting your filters' : 'Report the first incident'}
              </p>
            </div>
          ) : (
            incidents.map((inc, i) => {
              const isBreached = inc.sla_breached;
              const isCritical = inc.severity === 'Critical';
              const hovered = hoveredRow === inc.incident_id;
              return (
                <div
                  key={inc.incident_id}
                  onClick={() => navigate(`/incidents/${inc.incident_id}`)}
                  onMouseEnter={() => setHoveredRow(inc.incident_id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr 110px 130px 160px 120px',
                    padding: '0 16px', height: 56, alignItems: 'center',
                    borderBottom: i < incidents.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    background: hovered
                      ? 'var(--bg-elevated)'
                      : isBreached
                        ? 'rgba(239,68,68,0.03)'
                        : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                    borderLeft: isBreached ? '2px solid rgba(239,68,68,0.4)' : '2px solid transparent',
                  }}
                >
                  {/* ID */}
                  <span style={{
                    fontFamily: 'PP Neue Montreal Mono, monospace',
                    fontSize: 12, color: 'var(--accent)', fontWeight: 500,
                  }}>
                    #{String(inc.incident_id).padStart(4, '0')}
                  </span>

                  {/* Title */}
                  <div style={{ minWidth: 0, paddingRight: 16 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{inc.title}</p>
                    <p style={{
                      fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1,
                      fontFamily: 'PP Neue Montreal Mono, monospace',
                    }}>
                      {inc.threat_type} · {inc.asset_name}
                    </p>
                  </div>

                  {/* Severity */}
                  <SeverityBadge severity={inc.severity} />

                  {/* Status */}
                  <StatusBadge status={inc.status} />

                  {/* Analyst */}
                  <span style={{
                    fontSize: 13,
                    color: inc.analyst_name ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    fontStyle: inc.analyst_name ? 'normal' : 'italic',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {inc.analyst_name || 'Unassigned'}
                  </span>

                  {/* SLA */}
                  <SlaCell deadline={inc.sla_deadline} breached={inc.sla_breached} />
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal Mono, monospace' }}>
              Page {page} of {totalPages} · {pagination.total} incidents
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 14px', borderRadius: 6,
                  border: '1px solid var(--border-default)',
                  background: 'transparent', color: page === 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                  fontSize: 12, cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >← Prev</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 14px', borderRadius: 6,
                  border: '1px solid var(--border-default)',
                  background: 'transparent', color: page === totalPages ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                  fontSize: 12, cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create drawer ── */}
      <CreateDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
      />

      <Toast toasts={toasts} />
    </PageWrapper>
  );
}