import { useEffect, useState, useRef } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { listAssets } from '../api/assets.api';
import {
  Server, Monitor, Wifi, Cloud, AppWindow, Smartphone,
  Plus, Search, SlidersHorizontal, X, ChevronDown, Check,
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────

const CRITICALITY_CONFIG = {
  Critical: { color: '#FF3B3B', dot: '#FF3B3B' },
  High:     { color: '#FF6B00', dot: '#FF6B00' },
  Medium:   { color: '#F0B429', dot: '#F0B429' },
  Low:      { color: '#4A9EFF', dot: '#4A9EFF' },
};

const CRITICALITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];

const TYPE_ICONS = {
  Server:      Server,
  Endpoint:    Monitor,
  Network:     Wifi,
  Cloud:       Cloud,
  Application: AppWindow,
  Mobile:      Smartphone,
};

const ASSET_TYPES = ['Server', 'Endpoint', 'Network', 'Cloud', 'Application', 'Mobile'];
const DEPARTMENTS = ['Engineering', 'Infrastructure', 'Security', 'Executive', 'Legal', 'Sales', 'Operations', 'IT'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CriticalityBadge({ value }) {
  const cfg = CRITICALITY_CONFIG[value] || CRITICALITY_CONFIG.Low;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        fontWeight: 500,
        letterSpacing: '0.03em',
        color: cfg.color,
        fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '9999px',
          backgroundColor: cfg.dot,
          boxShadow: `0 0 6px ${cfg.dot}`,
          flexShrink: 0,
        }}
      />
      {value}
    </span>
  );
}

function TypeCell({ type }) {
  const Icon = TYPE_ICONS[type] || Server;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-secondary)',
        fontFamily: "'PP Neue Montreal Mono', monospace",
        fontSize: '12px',
        letterSpacing: '0.02em',
      }}
    >
      <Icon size={13} strokeWidth={1.5} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
      {type}
    </span>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({ selectedCriticalities, onChange, onClose }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        zIndex: 100,
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '8px',
        width: '180px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <p
        style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          padding: '4px 8px 8px',
          fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
        }}
      >
        Criticality
      </p>
      {CRITICALITY_ORDER.map((c) => {
        const cfg = CRITICALITY_CONFIG[c];
        const checked = selectedCriticalities.includes(c);
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '7px 8px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: checked ? 'var(--bg-elevated)' : 'transparent',
              cursor: 'pointer',
              transition: 'background-color 120ms ease',
            }}
            onMouseEnter={e => { if (!checked) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'; }}
            onMouseLeave={e => { if (!checked) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '6px', height: '6px', borderRadius: '9999px',
                  backgroundColor: cfg.dot, boxShadow: `0 0 5px ${cfg.dot}`, flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
                {c}
              </span>
            </span>
            {checked && <Check size={12} style={{ color: 'var(--accent)' }} strokeWidth={2.5} />}
          </button>
        );
      })}
      {selectedCriticalities.length > 0 && (
        <>
          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '8px 0' }} />
          <button
            onClick={() => onChange('__clear__')}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: '5px', border: 'none',
              backgroundColor: 'transparent', cursor: 'pointer', fontSize: '12px',
              color: 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
              textAlign: 'left', transition: 'color 120ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}

// ─── Add Asset Modal ──────────────────────────────────────────────────────────

function AddAssetModal({ onClose, onAdd, nextId }) {
  const [form, setForm] = useState({
    asset_name: '',
    asset_type: 'Server',
    criticality: 'Medium',
    owner_department: '',
    owner_name: '',
  });
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.asset_name.trim()) { setError('Asset name is required.'); return; }
    onAdd({ ...form, asset_id: nextId, asset_name: form.asset_name.trim() });
    onClose();
  };

  const inputStyle = {
    width: '100%',
    height: '36px',
    padding: '0 12px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    fontSize: '13px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 150ms ease',
  };

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-tertiary)',
    fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
    display: 'block',
    marginBottom: '6px',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '460px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
              Add Asset
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
              Register a new asset to the inventory
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              borderRadius: '6px', cursor: 'pointer', color: 'var(--text-tertiary)', transition: 'all 120ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Asset Name */}
          <div>
            <label style={labelStyle}>Asset Name *</label>
            <input
              value={form.asset_name}
              onChange={e => { set('asset_name', e.target.value); setError(''); }}
              placeholder="e.g. PROD-SERVER-01"
              style={{ ...inputStyle, borderColor: error ? '#FF3B3B' : undefined }}
              onFocus={e => e.target.style.borderColor = error ? '#FF3B3B' : 'var(--border-default)'}
              onBlur={e => e.target.style.borderColor = error ? '#FF3B3B' : 'var(--border-subtle)'}
            />
            {error && <p style={{ fontSize: '11px', color: '#FF3B3B', marginTop: '4px', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{error}</p>}
          </div>

          {/* Type + Criticality row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={form.asset_type}
                onChange={e => set('asset_type', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--border-default)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              >
                {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Criticality</label>
              <select
                value={form.criticality}
                onChange={e => set('criticality', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', color: CRITICALITY_CONFIG[form.criticality]?.color }}
                onFocus={e => e.target.style.borderColor = 'var(--border-default)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
              >
                {CRITICALITY_ORDER.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Department */}
          <div>
            <label style={labelStyle}>Department</label>
            <select
              value={form.owner_department}
              onChange={e => set('owner_department', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--border-default)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            >
              <option value="">Select department...</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Owner */}
          <div>
            <label style={labelStyle}>Owner</label>
            <input
              value={form.owner_name}
              onChange={e => set('owner_name', e.target.value)}
              placeholder="e.g. Jane Smith"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--border-default)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: '36px', padding: '0 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px', color: 'var(--text-secondary)',
              fontSize: '13px', fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
              fontWeight: 500, cursor: 'pointer', transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              height: '36px', padding: '0 16px',
              backgroundColor: 'var(--accent)', border: 'none',
              borderRadius: '6px', color: '#0D0A08',
              fontSize: '13px', fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
              fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(255,69,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Asset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCriticalities, setSelectedCriticalities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    listAssets({ limit: 50 })
      .then((r) => setAssets(r.data || []))
      .finally(() => setLoading(false));
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCriticalityToggle = (c) => {
    if (c === '__clear__') { setSelectedCriticalities([]); return; }
    setSelectedCriticalities(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  };

  const handleAddAsset = (newAsset) => {
    setAssets(prev => [...prev, newAsset]);
  };

  const filtered = assets.filter((a) => {
    const matchSearch =
      a.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.asset_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.owner_department || '').toLowerCase().includes(search.toLowerCase());
    const matchCriticality =
      selectedCriticalities.length === 0 || selectedCriticalities.includes(a.criticality);
    return matchSearch && matchCriticality;
  });

  const nextId = assets.length > 0 ? Math.max(...assets.map(a => a.asset_id || 0)) + 1 : 1;
  const activeFilters = selectedCriticalities.length;

  return (
    <PageWrapper>
      {/* ── Page header ── */}
      <div style={{ padding: '0 20px 32px' }}>
      {/* ── Page header ── */}
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
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
            }}
          >
            Assets
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
              fontWeight: 400,
              fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
            }}
          >
            {filtered.length} asset{filtered.length !== 1 ? 's' : ''} registered
          </p>
        </div>

        {/* Actions — consistent height 36px throughout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              style={{
                position: 'absolute', left: '11px', top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)', pointerEvents: 'none',
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              style={{
                height: '36px',
                paddingLeft: '32px',
                paddingRight: '12px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '200px',
                fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                transition: 'border-color 150ms ease',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-default)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>

          {/* Filter btn */}
          <div style={{ position: 'relative' }} ref={filterRef}>
            <button
              onClick={() => setShowFilter(v => !v)}
              style={{
                height: '36px',
                padding: '0 12px',
                backgroundColor: showFilter || activeFilters > 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                border: `1px solid ${activeFilters > 0 ? 'var(--accent)' : 'var(--border-subtle)'}`,
                borderRadius: '6px',
                color: activeFilters > 0 ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '13px',
                fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 150ms ease',
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => {
                if (activeFilters === 0) {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (activeFilters === 0) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <SlidersHorizontal size={13} strokeWidth={1.5} />
              Filter
              {activeFilters > 0 && (
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '16px', height: '16px', borderRadius: '9999px',
                    backgroundColor: 'var(--accent)', color: '#0D0A08',
                    fontSize: '10px', fontWeight: 700, lineHeight: 1,
                  }}
                >
                  {activeFilters}
                </span>
              )}
            </button>

            {showFilter && (
              <FilterDropdown
                selectedCriticalities={selectedCriticalities}
                onChange={handleCriticalityToggle}
                onClose={() => setShowFilter(false)}
              />
            )}
          </div>

          {/* Add asset btn */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              height: '36px',
              padding: '0 14px',
              backgroundColor: 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              color: '#0D0A08',
              fontSize: '13px',
              fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 150ms ease, box-shadow 150ms ease',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(255,69,0,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Plus size={14} strokeWidth={2} />
            Add Asset
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr',
            padding: '0 20px',
            height: '40px',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          {['Asset Name', 'Type', 'Criticality', 'Department', 'Owner'].map((col) => (
            <span
              key={col}
              style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
              }}
            >
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            Loading assets...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            No assets found
          </div>
        ) : (
          filtered.map((a, i) => (
            <div
              key={a.asset_id}
              onMouseEnter={() => setHoveredRow(a.asset_id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr',
                padding: '0 20px',
                height: '52px',
                alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                borderLeft: hoveredRow === a.asset_id ? '2px solid var(--accent)' : '2px solid transparent',
                backgroundColor: hoveredRow === a.asset_id ? 'var(--bg-elevated)' : 'transparent',
                transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
              }}
            >
              {/* Asset name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span
                  style={{
                    fontSize: '13px', fontWeight: 500,
                    color: 'var(--text-primary)',
                    fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                  }}
                >
                  {a.asset_name}
                </span>
                <span
                  style={{
                    fontFamily: "'PP Neue Montreal Mono', monospace",
                    fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.04em',
                  }}
                >
                  #{String(a.asset_id).padStart(4, '0')}
                </span>
              </div>

              <TypeCell type={a.asset_type} />
              <CriticalityBadge value={a.criticality} />

              {/* Department */}
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
                {a.owner_department || '—'}
              </span>

              {/* Owner */}
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
                {a.owner_name || '—'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── Footer ── */}
      {!loading && filtered.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: "'PP Neue Montreal Mono', monospace",
              fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.04em',
            }}
          >
            {filtered.length} / {assets.length} assets
          </span>
          {(search || activeFilters > 0) && (
            <button
              onClick={() => { setSearch(''); setSelectedCriticalities([]); }}
              style={{
                fontSize: '11px', color: 'var(--accent)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Add Asset Modal ── */}
      {showAddModal && (
        <AddAssetModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddAsset}
          nextId={nextId}
        />
      )}
      </div>
    </PageWrapper>
  );
}