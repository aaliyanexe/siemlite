import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import api from '../api/axiosInstance';
import {
  Search, X, Activity, Radio, ChevronRight,
  Filter, Download, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  surface:       'var(--bg-surface)',
  elevated:      'var(--bg-elevated)',
  overlay:       'var(--bg-overlay)',
  borderSubtle:  'var(--border-subtle)',
  borderDefault: 'var(--border-default)',
  borderStrong:  'var(--border-strong)',
  text:          'var(--text-primary)',
  textSec:       'var(--text-secondary)',
  textTer:       'var(--text-tertiary)',
  accent:        'var(--accent)',
  accentHover:   'var(--accent-hover)',
};

const mono = { fontFamily: "'PP Neue Montreal Mono', monospace" };
const sans = { fontFamily: 'PP Neue Montreal, system-ui, sans-serif' };

// ── Action config ─────────────────────────────────────────────────────────────
const ACTION_CONFIG = {
  INCIDENT_CREATED:  { label: 'Created',       color: '#4A9EFF' },
  INCIDENT_RESOLVED: { label: 'Resolved',      color: '#22C55E' },
  INCIDENT_REOPENED: { label: 'Reopened',      color: '#F0B429' },
  INCIDENT_DELETED:  { label: 'Deleted',       color: '#FF3B3B' },
  STATUS_CHANGED:    { label: 'Status',        color: '#A78BFA' },
  ANALYST_ASSIGNED:  { label: 'Assigned',      color: '#FF6B00' },
  SEVERITY_CHANGED:  { label: 'Severity',      color: '#F0B429' },
  RESPONSE_ACTION:   { label: 'Response',      color: '#4A9EFF' },
  RESPONSE_DELETED:  { label: 'Resp. Deleted', color: '#FF3B3B' },
};

const ACTION_TYPES = Object.keys(ACTION_CONFIG);

const SEV_COLOR = {
  Critical: '#FF3B3B',
  High:     '#FF6B00',
  Medium:   '#F0B429',
  Low:      '#4A9EFF',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

function humanize(actionType, oldValue, newValue) {
  switch (actionType) {
    case 'INCIDENT_CREATED':  return `Created incident`;
    case 'INCIDENT_RESOLVED': return `Marked resolved`;
    case 'INCIDENT_REOPENED': return `Reopened incident`;
    case 'INCIDENT_DELETED':  return `Deleted incident`;
    case 'STATUS_CHANGED':    return `Status changed`;
    case 'ANALYST_ASSIGNED':  return newValue === 'Unassigned' ? 'Analyst unassigned' : `Analyst assigned`;
    case 'SEVERITY_CHANGED':  return `Severity changed`;
    case 'RESPONSE_ACTION':   return `Response action added`;
    case 'RESPONSE_DELETED':  return `Response action deleted`;
    default:                  return actionType.replace(/_/g, ' ').toLowerCase();
  }
}

function groupByDate(entries) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo   = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = {};
  for (const entry of entries) {
    const d = new Date(entry.log_time); d.setHours(0, 0, 0, 0);
    let label;
    if (d.getTime() === today.getTime())         label = 'Today';
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
    else if (d >= weekAgo)                        label = 'This Week';
    else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }
  return groups;
}

// CSV export — purely frontend, no backend needed
function exportCSV(logs) {
  const headers = ['Log ID', 'Time', 'Actor', 'Role', 'Action', 'Old Value', 'New Value', 'Incident ID', 'Incident Title', 'Severity', 'Status'];
  const rows = logs.map(l => [
    l.log_id,
    new Date(l.log_time).toISOString(),
    l.actor_name?.replace(' [Deactivated]', '') || '',
    l.actor_role || '',
    l.action_type,
    l.old_value || '',
    l.new_value || '',
    l.incident_id || '',
    l.incident_title || '',
    l.incident_severity || '',
    l.incident_status || '',
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ name, role, size = 26 }) {
  const clean    = name?.replace(' [Deactivated]', '') || '?';
  const initials = clean.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const color    = role === 'Admin' ? '#FF4500' : '#4A9EFF';
  return (
    <div aria-hidden="true" style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 500, color, ...mono,
    }}>{initials}</div>
  );
}

function ActionBadge({ actionType }) {
  const cfg = ACTION_CONFIG[actionType] || { label: actionType, color: 'var(--text-tertiary)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', ...mono,
      color: cfg.color,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.color, flexShrink: 0,
      }} />
      {cfg.label.toUpperCase()}
    </span>
  );
}

function LiveDot() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#22C55E', ...sans, fontWeight: 600 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: '#22C55E',
        boxShadow: '0 0 6px #22C55E',
        animation: 'livePulse 1.5s ease-in-out infinite',
      }} />
      LIVE
    </span>
  );
}

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px',
          background: t.type === 'error' ? 'rgba(255,59,59,0.08)' : T.elevated,
          border: `1px solid ${t.type === 'error' ? 'rgba(255,59,59,0.3)' : T.borderStrong}`,
          borderLeft: `3px solid ${t.type === 'error' ? '#FF3B3B' : T.accent}`,
          borderRadius: 6, color: T.text, fontSize: 13,
          minWidth: 260, boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          ...sans, animation: 'slideUp 0.2s ease',
        }}>{t.message}</div>
      ))}
    </div>
  );
}

// ── Diff panel shown when a row is expanded ───────────────────────────────────
function DiffPanel({ entry }) {
  const hasDiff = entry.old_value || entry.new_value;
  const isDeactivated = entry.actor_name?.includes('[Deactivated]');

  return (
    <div style={{
      padding: '12px 20px 14px 60px',
      background: 'rgba(0,0,0,0.15)',
      borderBottom: `1px solid ${T.borderSubtle}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Change diff */}
      {hasDiff && (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, borderRadius: 6, overflow: 'hidden', border: `1px solid ${T.borderSubtle}` }}>
          {entry.old_value && (
            <div style={{
              flex: 1, padding: '8px 12px',
              background: 'rgba(255,59,59,0.06)',
              borderRight: `1px solid ${T.borderSubtle}`,
            }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: '#FF3B3B', marginBottom: 4, textTransform: 'uppercase', ...sans }}>Before</p>
              <p style={{ fontSize: 12, color: T.textSec, ...mono }}>{entry.old_value}</p>
            </div>
          )}
          {entry.new_value && (
            <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(34,197,94,0.05)' }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: '#22C55E', marginBottom: 4, textTransform: 'uppercase', ...sans }}>After</p>
              <p style={{ fontSize: 12, color: T.textSec, ...mono }}>{entry.new_value}</p>
            </div>
          )}
        </div>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: T.textTer, ...mono }}>
          Log #{entry.log_id}
        </span>
        <span style={{ fontSize: 11, color: T.textTer, ...mono }}>
          {new Date(entry.log_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })}
        </span>
        {entry.actor_role && (
          <span style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4,
            background: entry.actor_role === 'Admin' ? 'rgba(255,69,0,0.08)' : 'rgba(74,158,255,0.08)',
            border: `1px solid ${entry.actor_role === 'Admin' ? 'rgba(255,69,0,0.2)' : 'rgba(74,158,255,0.2)'}`,
            color: entry.actor_role === 'Admin' ? T.accent : '#4A9EFF',
            ...sans, fontWeight: 500,
          }}>{entry.actor_role}</span>
        )}
        {isDeactivated && (
          <span style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4,
            background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.2)',
            color: '#FF3B3B', ...sans, fontWeight: 500,
          }}>Deactivated account</span>
        )}
        {entry.incident_severity && (
          <span style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4,
            background: `${SEV_COLOR[entry.incident_severity]}14`,
            border: `1px solid ${SEV_COLOR[entry.incident_severity]}30`,
            color: SEV_COLOR[entry.incident_severity],
            ...sans, fontWeight: 500,
          }}>{entry.incident_severity}</span>
        )}
        {entry.incident_status && (
          <span style={{ fontSize: 11, color: T.textTer, ...mono }}>
            Status: {entry.incident_status}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Log row ───────────────────────────────────────────────────────────────────
function LogRow({ entry, isNew, navigate, expanded, onToggle }) {
  const cfg = ACTION_CONFIG[entry.action_type] || { color: T.textTer };

  return (
    <>
      <div
        role="row"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={e => {
          if (e.key === 'Enter') onToggle();
          if (e.key === 'ArrowRight' && entry.incident_id) navigate(`/incidents/${entry.incident_id}`);
        }}
        onClick={onToggle}
        style={{
          display: 'grid',
          gridTemplateColumns: '34px 120px 230px 1fr 110px 28px',
          gap: 12,
          alignItems: 'center',
          padding: '0 16px 0 12px',
          minHeight: 60,
          borderBottom: expanded ? 'none' : `1px solid ${T.borderSubtle}`,
          borderLeft: `2px solid ${isNew ? '#4A9EFF' : expanded ? cfg.color : 'transparent'}`,
          background: isNew
            ? 'rgba(74,158,255,0.04)'
            : expanded
            ? 'rgba(255,255,255,0.02)'
            : 'transparent',
          cursor: 'pointer',
          transition: 'background 200ms ease, border-left-color 200ms ease',
          outline: 'none',
        }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = T.elevated; }}
        onMouseLeave={e => { e.currentTarget.style.background = isNew ? 'rgba(74,158,255,0.04)' : expanded ? 'rgba(255,255,255,0.02)' : 'transparent'; }}
      >
        {/* Expand icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {expanded
            ? <ChevronUp size={12} style={{ color: T.textTer }} />
            : <ChevronDown size={12} style={{ color: T.textTer }} />}
        </div>

        {/* Timestamp */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 12, color: T.text, ...mono }}>{fmtTimestamp(entry.log_time)}</span>
          <span style={{ fontSize: 10, color: T.textTer, ...mono }}>{timeAgo(entry.log_time)}</span>
        </div>

        {/* Action badge */}
        <div><ActionBadge actionType={entry.action_type} /></div>

        {/* Actor + description */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Avatar name={entry.actor_name} role={entry.actor_role} size={24} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
              <span style={{
                fontSize: 13, fontWeight: 600, color: T.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 130, ...sans,
              }}>
                {entry.actor_name?.replace(' [Deactivated]', '') || 'System'}
              </span>
              <span style={{ fontSize: 12, color: T.textSec, ...sans, whiteSpace: 'nowrap' }}>
                {humanize(entry.action_type, entry.old_value, entry.new_value)}
              </span>
            </div>
            {entry.incident_title && (
              <button
                onClick={e => { e.stopPropagation(); navigate(`/incidents/${entry.incident_id}`); }}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  fontSize: 11, color: T.accent, ...sans,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: 280, display: 'block', textAlign: 'left',
                  textDecoration: 'none',
                }}
                aria-label={`Open incident ${entry.incident_id}: ${entry.incident_title}`}
              >
                #{entry.incident_id} · {entry.incident_title}
              </button>
            )}
          </div>
        </div>

        {/* Incident severity */}
        <div>
          {entry.incident_severity && (
            <span style={{
              fontSize: 11, ...mono,
              color: SEV_COLOR[entry.incident_severity] || T.textTer,
            }}>
              {entry.incident_severity}
            </span>
          )}
        </div>

        {/* Nav arrow for incident link */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {entry.incident_id && (
            <ChevronRight size={12} style={{ color: T.textTer }} />
          )}
        </div>
      </div>

      {expanded && <DiffPanel entry={entry} />}
    </>
  );
}

function DateHeader({ label, count }) {
  return (
    <div role="rowgroup" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px',
      background: T.elevated,
      borderBottom: `1px solid ${T.borderSubtle}`,
      position: 'sticky', top: 0, zIndex: 2,
    }}>
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textSec, ...sans }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: T.textTer, ...mono }}>
        {count} event{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

// ── Select dropdown ───────────────────────────────────────────────────────────
function Select({ value, onChange, options, placeholder, style = {} }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        height: 34, padding: '0 28px 0 10px',
        background: T.elevated, border: `1px solid ${T.borderSubtle}`,
        borderRadius: 6, fontSize: 12, color: value ? T.text : T.textTer,
        outline: 'none', cursor: 'pointer', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235c4a32' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        ...sans, boxSizing: 'border-box',
        transition: 'border-color 150ms ease',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--border-default)'}
      onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: 'var(--bg-overlay)' }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AuditLog() {
  const navigate = useNavigate();
  const LIMIT = 100;

  // Data
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);

  // Actors list for dropdown
  const [actors, setActors] = useState([]);

  // Filters — server-side
  const [actionFilter,   setActionFilter]   = useState('');
  const [actorFilter,    setActorFilter]     = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('');
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');

  // Filters — client-side
  const [search, setSearch]     = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // UI state
  const [expandedId, setExpandedId] = useState(null);
  const [toasts, setToasts]         = useState([]);

  // Live feed
  const [liveMode, setLiveMode]   = useState(false);
  const [newIds, setNewIds]       = useState(new Set());
  const [liveCount, setLiveCount] = useState(0);
  const liveRef         = useRef(null);
  const latestLogIdRef  = useRef(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Fetch actors for dropdown ──────────────────────────────────────────────
  useEffect(() => {
    api.get('/users').then(res => {
      const users = res.data?.data || [];
      setActors(users.map(u => ({ value: String(u.user_id), label: u.name })));
    }).catch(() => {});
  }, []);

  // ── Fetch logs ─────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (opts = {}) => {
    const { silent = false, liveCheck = false } = opts;
    if (!silent) setLoading(true);

    const params = { page, limit: LIMIT };
    if (actionFilter)   params.action_type  = actionFilter;
    if (actorFilter)    params.actor_id     = actorFilter;
    if (severityFilter) params.severity     = severityFilter;
    if (incidentFilter) params.incident_id  = incidentFilter;
    if (dateFrom)       params.date_from    = dateFrom;
    if (dateTo)         params.date_to      = dateTo;

    try {
      const res     = await api.get('/logs', { params });
      const entries = res.data?.data || [];
      const tot     = res.data?.pagination?.total || entries.length;

      if (liveCheck && latestLogIdRef.current !== null) {
        const fresh = entries.filter(e => e.log_id > latestLogIdRef.current);
        if (fresh.length > 0) {
          setLogs(prev => [...fresh, ...prev].slice(0, LIMIT));
          setNewIds(new Set(fresh.map(e => e.log_id)));
          setLiveCount(c => c + fresh.length);
          setTimeout(() => setNewIds(new Set()), 3000);
        }
      } else {
        setLogs(entries);
        setTotal(tot);
        if (entries.length > 0) latestLogIdRef.current = entries[0].log_id;
      }
    } catch {
      if (!silent) toast('Failed to load audit logs', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, actionFilter, actorFilter, severityFilter, incidentFilter, dateFrom, dateTo, toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [actionFilter, actorFilter, severityFilter, incidentFilter, dateFrom, dateTo]);

  // ── Live polling ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!liveMode) { clearInterval(liveRef.current); return; }
    liveRef.current = setInterval(() => fetchLogs({ silent: true, liveCheck: true }), 8000);
    return () => clearInterval(liveRef.current);
  }, [liveMode, fetchLogs]);

  // ── Active filter count badge ──────────────────────────────────────────────
  const activeFilterCount = [actionFilter, actorFilter, severityFilter, incidentFilter, dateFrom, dateTo].filter(Boolean).length;

  const clearAllFilters = () => {
    setActionFilter(''); setActorFilter(''); setSeverityFilter('');
    setIncidentFilter(''); setDateFrom(''); setDateTo('');
    setSearch('');
  };

  // ── Client-side search ─────────────────────────────────────────────────────
  const filtered = search
    ? logs.filter(e => {
        const q = search.toLowerCase();
        return (
          e.actor_name?.toLowerCase().includes(q) ||
          e.incident_title?.toLowerCase().includes(q) ||
          String(e.incident_id).includes(q) ||
          e.action_type.toLowerCase().includes(q) ||
          e.new_value?.toLowerCase().includes(q) ||
          e.old_value?.toLowerCase().includes(q)
        );
      })
    : logs;

  const grouped  = groupByDate(filtered);
  const dateKeys = Object.keys(grouped);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const todayCount    = grouped['Today']?.length || 0;
  const uniqueActors  = new Set(logs.map(l => l.actor_id)).size;
  const criticalCount = logs.filter(l =>
    ['INCIDENT_DELETED', 'INCIDENT_RESOLVED', 'INCIDENT_REOPENED'].includes(l.action_type)
  ).length;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const pillBtn = (active) => ({
    padding: '4px 10px', borderRadius: 6,
    border: `1px solid ${active ? T.accent : T.borderSubtle}`,
    background: active ? 'rgba(255,69,0,0.08)' : 'transparent',
    color: active ? T.accent : T.textSec,
    fontSize: 11, fontWeight: 500, cursor: 'pointer',
    ...sans, transition: 'all 150ms ease', whiteSpace: 'nowrap',
  });

  const headerBtn = (active = false) => ({
    height: 34, padding: '0 14px', borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${active ? T.accent : T.borderSubtle}`,
    background: active ? 'rgba(255,69,0,0.08)' : 'transparent',
    color: active ? T.accent : T.textSec,
    fontSize: 12, fontWeight: 500, ...sans,
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 150ms ease',
  });

  const inputStyle = {
    height: 34, padding: '0 10px',
    background: T.elevated, border: `1px solid ${T.borderSubtle}`,
    borderRadius: 6, fontSize: 12, color: T.text, outline: 'none',
    ...sans, boxSizing: 'border-box', transition: 'border-color 150ms ease',
  };

  return (
    <PageWrapper>
      <div style={{ padding: '0 20px 40px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 12, paddingBottom: 20,
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: T.text, letterSpacing: '-0.02em', ...sans }}>
              Audit Log
            </h1>
            <p style={{ fontSize: 13, color: T.textSec, marginTop: 3, ...sans }}>
              Full system activity trail — incidents, assignments, and status changes
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {liveMode && <LiveDot />}
            {liveMode && liveCount > 0 && (
              <span style={{ fontSize: 11, color: '#22C55E', ...mono }}>+{liveCount} new</span>
            )}

            {/* Export CSV */}
            <button
              onClick={() => { exportCSV(logs); toast('CSV exported'); }}
              aria-label="Export audit log as CSV"
              style={headerBtn()}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderDefault; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderSubtle; e.currentTarget.style.color = T.textSec; }}
            >
              <Download size={12} strokeWidth={1.5} />
              Export CSV
            </button>

            {/* Live toggle */}
            <button
              onClick={() => { setLiveMode(v => !v); if (!liveMode) setLiveCount(0); }}
              aria-label={liveMode ? 'Disable live feed' : 'Enable live feed'}
              style={{
                ...headerBtn(liveMode),
                border: `1px solid ${liveMode ? '#22C55E' : T.borderSubtle}`,
                background: liveMode ? 'rgba(34,197,94,0.08)' : 'transparent',
                color: liveMode ? '#22C55E' : T.textSec,
              }}
            >
              <Radio size={12} strokeWidth={liveMode ? 2 : 1.5} />
              {liveMode ? 'Live On' : 'Go Live'}
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchLogs()}
              aria-label="Refresh audit log"
              style={headerBtn()}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderDefault; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderSubtle; e.currentTarget.style.color = T.textSec; }}
            >
              <Activity size={12} strokeWidth={1.5} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Events',    value: total,         color: T.accent },
            { label: 'Today',           value: todayCount,    color: '#4A9EFF' },
            { label: 'Unique Actors',   value: uniqueActors,  color: '#A78BFA' },
            { label: 'Critical Events', value: criticalCount, color: '#FF3B3B' },
          ].map((s, i) => (
            <div key={s.label} style={{
              background: T.surface, border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8, padding: '14px 16px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: s.color, opacity: 0.6 }} />
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.textTer, marginBottom: 8, ...sans }}>
                {s.label}
              </p>
              <p style={{ fontSize: i === 0 ? 30 : 26, fontWeight: 500, color: T.text, letterSpacing: '-0.03em', lineHeight: 1, ...sans }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap',paddingBottom: 12 }}>

          {/* Search */}
          <div style={{ position: 'relative', minWidth: 220, maxWidth: 280 }}>
            <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textTer, pointerEvents: 'none' }} aria-hidden="true" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search actor, incident, action…"
              aria-label="Search audit log entries"
              style={{ ...inputStyle, width: '100%', paddingLeft: 30 }}
              onFocus={e => e.target.style.borderColor = T.borderDefault}
              onBlur={e => e.target.style.borderColor = T.borderSubtle}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textTer, padding: 0, display: 'flex' }}
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Action type pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setActionFilter('')} style={pillBtn(!actionFilter)} aria-pressed={!actionFilter}>All</button>
            {ACTION_TYPES.map(a => (
              <button
                key={a}
                onClick={() => setActionFilter(actionFilter === a ? '' : a)}
                style={pillBtn(actionFilter === a)}
                aria-pressed={actionFilter === a}
              >
                {ACTION_CONFIG[a].label}
              </button>
            ))}
          </div>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
            style={{
              ...pillBtn(showFilters || activeFilterCount > 0),
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Filter size={11} strokeWidth={1.5} aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                background: T.accent, color: 'var(--bg-base)',
                fontSize: 9, fontWeight: 500, display: 'flex',
                alignItems: 'center', justifyContent: 'center', ...mono,
              }}>{activeFilterCount}</span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} style={{ ...pillBtn(false), color: '#FF3B3B', borderColor: 'rgba(255,59,59,0.3)' }}>
              <X size={10} style={{ marginRight: 3 }} />Clear all
            </button>
          )}

          <span style={{ fontSize: 11, color: T.textTer, ...mono, marginLeft: 'auto' }}>
            {filtered.length} of {total}
          </span>
        </div>

        {/* ── Advanced filters panel ── */}
        {showFilters && (
          <div
            id="advanced-filters"
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10,
              marginBottom: 12, padding: '14px 16px',
              background: T.elevated, border: `1px solid ${T.borderSubtle}`,
              borderRadius: 8,
            }}
          >
            {/* Actor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="filter-actor" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textTer, ...sans }}>Actor</label>
              <Select
                value={actorFilter}
                onChange={setActorFilter}
                options={actors}
                placeholder="All actors"
                style={{ width: '100%' }}
              />
            </div>

            {/* Severity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="filter-severity" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textTer, ...sans }}>Severity</label>
              <Select
                value={severityFilter}
                onChange={setSeverityFilter}
                options={['Critical', 'High', 'Medium', 'Low'].map(s => ({ value: s, label: s }))}
                placeholder="All severities"
                style={{ width: '100%' }}
              />
            </div>

            {/* Incident ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="filter-incident" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textTer, ...sans }}>Incident ID</label>
              <input
                id="filter-incident"
                type="number"
                value={incidentFilter}
                onChange={e => setIncidentFilter(e.target.value)}
                placeholder="e.g. 42"
                aria-label="Filter by incident ID"
                style={{ ...inputStyle, width: '100%' }}
                onFocus={e => e.target.style.borderColor = T.borderDefault}
                onBlur={e => e.target.style.borderColor = T.borderSubtle}
              />
            </div>

            {/* Date from */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="filter-date-from" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textTer, ...sans }}>From</label>
              <input
                id="filter-date-from"
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                aria-label="Filter from date"
                style={{ ...inputStyle, width: '100%', colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = T.borderDefault}
                onBlur={e => e.target.style.borderColor = T.borderSubtle}
              />
            </div>

            {/* Date to */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="filter-date-to" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textTer, ...sans }}>To</label>
              <input
                id="filter-date-to"
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                aria-label="Filter to date"
                style={{ ...inputStyle, width: '100%', colorScheme: 'dark' }}
                onFocus={e => e.target.style.borderColor = T.borderDefault}
                onBlur={e => e.target.style.borderColor = T.borderSubtle}
              />
            </div>
          </div>
        )}

        {/* ── Log table ── */}
        <div
          role="table"
          aria-label="Audit log entries"
          style={{
            background: T.surface,
            border: `1px solid ${T.borderSubtle}`,
            borderRadius: 8, overflow: 'hidden',
          }}
        >
          {/* Column headers */}
          <div
            role="row"
            style={{
              display: 'grid',
              gridTemplateColumns: '34px 120px 230px 1fr 110px 28px',
              gap: 12,
              padding: '0 16px 0 12px', height: 36, alignItems: 'center',
              borderBottom: `1px solid ${T.borderSubtle}`,
              background: T.elevated,
            }}
          >
            {[
              ['', ''],
              ['Time', 'col-time'],
              ['Action', 'col-action'],
              ['Actor · Detail', 'col-detail'],
              ['Severity', 'col-severity'],
              ['', ''],
            ].map(([label, id]) => (
              <span
                key={id || label}
                role="columnheader"
                id={id || undefined}
                style={{
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.07em',
                  textTransform: 'uppercase', color: T.textTer, ...sans,
                }}
              >{label}</span>
            ))}
          </div>

          {loading ? (
            <div role="status" aria-live="polite" style={{ padding: '52px 20px', textAlign: 'center', color: T.textTer, fontSize: 13, ...sans }}>
              Loading audit log…
            </div>
          ) : filtered.length === 0 ? (
            <div role="status" style={{ padding: '52px 20px', textAlign: 'center', color: T.textTer, fontSize: 13, ...sans }}>
              No events found{activeFilterCount > 0 ? ' — try adjusting your filters' : ''}
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
              {dateKeys.map(dateKey => (
                <div key={dateKey} role="rowgroup">
                  <DateHeader label={dateKey} count={grouped[dateKey].length} />
                  {grouped[dateKey].map(entry => (
                    <LogRow
                      key={entry.log_id}
                      entry={entry}
                      isNew={newIds.has(entry.log_id)}
                      navigate={navigate}
                      expanded={expandedId === entry.log_id}
                      onToggle={() => setExpandedId(p => p === entry.log_id ? null : entry.log_id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Footer / pagination */}
          {!loading && filtered.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: `1px solid ${T.borderSubtle}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: T.elevated,
            }}>
              <span style={{ fontSize: 11, color: T.textTer, ...mono }}>
                Showing {filtered.length} of {total} events
              </span>
              {total > LIMIT && (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    aria-label="Previous page"
                    style={{ ...pillBtn(false), opacity: page === 1 ? 0.4 : 1 }}
                  >← Prev</button>
                  <span style={{ fontSize: 11, color: T.textTer, ...mono }}>
                    {page} / {Math.ceil(total / LIMIT)}
                  </span>
                  <button
                    disabled={page >= Math.ceil(total / LIMIT)}
                    onClick={() => setPage(p => p + 1)}
                    aria-label="Next page"
                    style={{ ...pillBtn(false), opacity: page >= Math.ceil(total / LIMIT) ? 0.4 : 1 }}
                  >Next →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Toast toasts={toasts} />

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: var(--border-strong); }
        select option { background: var(--bg-overlay); color: var(--text-primary); }
      `}</style>
    </PageWrapper>
  );
}