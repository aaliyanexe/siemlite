import { useEffect, useState, useRef, useCallback } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { listUsers, createUser, updateUser, deactivateUser, resetPassword } from '../api/users.api';
import { listIncidents } from '../api/incidents.api';
import { useAuthStore } from '../store/authStore';
import {
  Plus, Search, X, Check, Eye, EyeOff,
  Shield, User, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  Admin:   { color: '#FF4500', bg: 'rgba(255,69,0,0.10)',  label: 'Admin'   },
  Analyst: { color: '#4A9EFF', bg: 'rgba(74,158,255,0.10)', label: 'Analyst' },
};

function timeAgo(ts) {
  if (!ts) return 'Never';
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function availabilityScore(openCount) {
  return Math.max(0, 100 - openCount * 15);
}

function availabilityColor(score) {
  if (score >= 70) return '#22C55E';
  if (score >= 40) return '#F0B429';
  return '#FF3B3B';
}

function isAtRisk(user) {
  if (!user.is_active) return false;
  if (user.open_incident_count === 0) return false;
  if (!user.last_login) return true;
  const daysSince = (Date.now() - new Date(user.last_login).getTime()) / 86400000;
  return daysSince >= 7;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 32, inactive }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: inactive ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
      border: `1px solid ${inactive ? 'var(--border-subtle)' : 'var(--border-default)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 600,
      color: inactive ? 'var(--text-tertiary)' : 'var(--text-secondary)',
      fontFamily: "'PP Neue Montreal Mono', monospace",
      flexShrink: 0,
      opacity: inactive ? 0.5 : 1,
    }}>
      {initials}
    </div>
  );
}

// ── Role Badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.Analyst;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 500,
      color: cfg.color,
      fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Availability Bar ──────────────────────────────────────────────────────────

function AvailabilityBar({ openCount, inactive }) {
  if (inactive) return <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: "'PP Neue Montreal Mono', monospace" }}>—</span>;
  const score = availabilityScore(openCount);
  const color = availabilityColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 60, height: 4, borderRadius: 9999, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score}%`,
          background: color, borderRadius: 9999,
          transition: 'width 600ms ease',
        }} />
      </div>
      <span style={{ fontSize: 11, color, fontFamily: "'PP Neue Montreal Mono', monospace", fontWeight: 600 }}>{score}</span>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px',
          background: t.type === 'error' ? 'rgba(255,59,59,0.1)' : 'var(--bg-elevated)',
          border: `1px solid ${t.type === 'error' ? 'rgba(255,59,59,0.3)' : 'var(--border-strong)'}`,
          borderLeft: `3px solid ${t.type === 'error' ? '#FF3B3B' : 'var(--accent)'}`,
          borderRadius: 6, color: 'var(--text-primary)', fontSize: 13,
          minWidth: 260, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
          animation: 'slideUp 0.2s ease',
        }}>{t.message}</div>
      ))}
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

function Drawer({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 420, background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRight: 'none', zIndex: 101,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
        animation: 'slideIn 200ms ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', letterSpacing: '-0.01em' }}>{title}</p>
            {subtitle && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-tertiary)', transition: 'all 120ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
          ><X size={13} strokeWidth={2} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>{children}</div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

// ── Form helpers ──────────────────────────────────────────────────────────────

function FormField({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 11, color: '#FF3B3B', marginTop: 4, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  width: '100%', height: 38, padding: '0 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 6, fontSize: 13,
  color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
  boxSizing: 'border-box', transition: 'border-color 150ms ease',
};

// ── Create / Edit User Drawer ─────────────────────────────────────────────────

function UserFormDrawer({ open, onClose, editTarget, onSaved, toast }) {
  const isEdit = !!editTarget;
  const [form, setForm] = useState({ name: '', email: '', role: 'Analyst', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(isEdit
        ? { name: editTarget.name.replace(' [Deactivated]', ''), email: editTarget.email, role: editTarget.role, password: '' }
        : { name: '', email: '', role: 'Analyst', password: '' }
      );
      setErrors({});
    }
  }, [open, editTarget]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!isEdit && !form.password) e.password = 'Password is required';
    if (!isEdit && form.password && form.password.length < 8) e.password = 'Min 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        const res = await updateUser(editTarget.user_id, { name: form.name, email: form.email, role: form.role });
        onSaved(res?.data ?? res);
        toast('User updated');
      } else {
        const res = await createUser({ name: form.name, email: form.email, role: form.role, password: form.password });
        onSaved(res?.data ?? res, true);
        toast('User created — they must change password on first login');
      }
      onClose();
    } catch (err) {
      toast(err?.response?.data?.error?.message ?? 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose}
      title={isEdit ? 'Edit User' : 'Create User'}
      subtitle={isEdit ? `Editing ${editTarget?.name}` : 'Add a new team member'}
    >
      <FormField label="Full Name" error={errors.name}>
        <input value={form.name} onChange={e => { set('name', e.target.value); setErrors(p => ({ ...p, name: '' })); }}
          placeholder="Jane Smith" style={{ ...inputStyle, borderColor: errors.name ? '#FF3B3B' : undefined }}
          onFocus={e => e.target.style.borderColor = errors.name ? '#FF3B3B' : 'var(--border-default)'}
          onBlur={e => e.target.style.borderColor = errors.name ? '#FF3B3B' : 'var(--border-subtle)'}
        />
      </FormField>

      <FormField label="Email" error={errors.email}>
        <input type="email" value={form.email} onChange={e => { set('email', e.target.value); setErrors(p => ({ ...p, email: '' })); }}
          placeholder="jane@company.com" style={{ ...inputStyle, borderColor: errors.email ? '#FF3B3B' : undefined }}
          onFocus={e => e.target.style.borderColor = errors.email ? '#FF3B3B' : 'var(--border-default)'}
          onBlur={e => e.target.style.borderColor = errors.email ? '#FF3B3B' : 'var(--border-subtle)'}
        />
      </FormField>

      <FormField label="Role">
        <div style={{ display: 'flex', gap: 8 }}>
          {['Analyst', 'Admin'].map(r => {
            const cfg = ROLE_CONFIG[r];
            const active = form.role === r;
            return (
              <button key={r} onClick={() => set('role', r)} style={{
                flex: 1, height: 38, borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${active ? cfg.color : 'var(--border-subtle)'}`,
                background: active ? cfg.bg : 'transparent',
                color: active ? cfg.color : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500,
                fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                transition: 'all 150ms ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {r === 'Admin' ? <Shield size={12} strokeWidth={1.5} /> : <User size={12} strokeWidth={1.5} />}
                {r}
              </button>
            );
          })}
        </div>
      </FormField>

      {!isEdit && (
        <FormField label="Initial Password" error={errors.password}>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => { set('password', e.target.value); setErrors(p => ({ ...p, password: '' })); }}
              placeholder="Min. 8 characters"
              style={{ ...inputStyle, paddingRight: 40, borderColor: errors.password ? '#FF3B3B' : undefined }}
              onFocus={e => e.target.style.borderColor = errors.password ? '#FF3B3B' : 'var(--border-default)'}
              onBlur={e => e.target.style.borderColor = errors.password ? '#FF3B3B' : 'var(--border-subtle)'}
            />
            <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex' }}>
              {showPass ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
            User will be prompted to change this on first login
          </p>
        </FormField>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, height: 38, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', transition: 'all 150ms ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >Cancel</button>
        <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, height: 38, background: saving ? 'var(--bg-elevated)' : 'var(--accent)', border: 'none', borderRadius: 6, color: saving ? 'var(--text-tertiary)' : '#0D0A08', fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', transition: 'all 150ms ease' }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--accent)'; }}
        >{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}</button>
      </div>
    </Drawer>
  );
}

// ── Reset Password Modal ──────────────────────────────────────────────────────

function ResetPasswordModal({ user, onClose, toast }) {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!password || password.length < 8) { setError('Min 8 characters'); return; }
    setSaving(true);
    try {
      await resetPassword(user.user_id, password);
      toast(`Password reset for ${user.name} — they must change it on next login`);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 400, background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12, zIndex: 201, padding: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>Reset Password</p>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
          Set a temporary password for <strong style={{ color: 'var(--text-secondary)' }}>{user?.name}</strong>. They will be required to change it on next login.
        </p>
        <div style={{ position: 'relative', marginBottom: error ? 6 : 16 }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="New temporary password"
            style={{ ...inputStyle, paddingRight: 40 }}
            onFocus={e => e.target.style.borderColor = 'var(--border-default)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
          />
          <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0, display: 'flex' }}>
            {showPass ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
          </button>
        </div>
        {error && <p style={{ fontSize: 11, color: '#FF3B3B', marginBottom: 12, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, height: 38, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, height: 38, background: saving ? 'var(--bg-elevated)' : 'var(--accent)', border: 'none', borderRadius: 6, color: saving ? 'var(--text-tertiary)' : '#0D0A08', fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
            {saving ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Deactivate Confirm Modal ──────────────────────────────────────────────────

function DeactivateModal({ user, onClose, onConfirm, loading }) {
  if (!user) return null;
  const hasIncidents = user.open_incident_count > 0;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 420, background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12, zIndex: 201, padding: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={16} style={{ color: '#FF3B3B' }} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>Deactivate User</p>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: hasIncidents ? 12 : 20, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
          Deactivating <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong> will prevent them from logging in.
        </p>

        {hasIncidents && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 20,
            background: 'rgba(255,59,59,0.06)',
            border: '1px solid rgba(255,59,59,0.2)',
          }}>
            <p style={{ fontSize: 12, color: '#FF3B3B', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', lineHeight: 1.5 }}>
              ⚠ This analyst has <strong>{user.open_incident_count}</strong> open incident{user.open_incident_count !== 1 ? 's' : ''} that will become unassigned.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, height: 38, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, height: 38, background: '#FF3B3B', border: 'none', borderRadius: 6, color: '#111', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Expandable Incident Row ───────────────────────────────────────────────────

function UserIncidentExpand({ userId }) {
  const [incidents, setIncidents] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listIncidents({ assigned_analyst_id: userId, limit: 5 })
      .then(r => setIncidents(r?.data || []))
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const SEV_COLOR = { Critical: '#FF3B3B', High: '#FF6B00', Medium: '#F0B429', Low: '#4A9EFF' };

  return (
    <div style={{ padding: '12px 20px 12px 64px', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)' }}>
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>Loading incidents...</p>
      ) : incidents?.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>No open incidents</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {incidents.map(inc => (
            <div key={inc.incident_id}
              onClick={() => window.location.href = `/incidents/${inc.incident_id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 6, transition: 'background 120ms ease' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: SEV_COLOR[inc.severity], flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</span>
              <span style={{ fontSize: 10, color: SEV_COLOR[inc.severity], fontFamily: "'PP Neue Montreal Mono', monospace" }}>{inc.severity}</span>
              <span style={{ fontSize: 10, color: inc.sla_breached ? '#FF3B3B' : 'var(--text-tertiary)', fontFamily: "'PP Neue Montreal Mono', monospace" }}>
                {inc.sla_breached ? 'BREACHED' : inc.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Users() {
  const { user: currentUser } = useAuthStore();

  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedRow, setExpandedRow] = useState(null);

  // drawer / modal state
  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [resetTarget, setResetTarget]   = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const [toasts, setToasts] = useState([]);

  const toast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await listUsers({ limit: 100 });
      setUsers(res?.data || []);
    } catch {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    const matchStatus =
      statusFilter === 'All' ? true :
      statusFilter === 'Active' ? u.is_active :
      !u.is_active;
    return matchSearch && matchRole && matchStatus;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:    users.length,
    analysts: users.filter(u => u.role === 'Analyst' && u.is_active).length,
    admins:   users.filter(u => u.role === 'Admin' && u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaved = (saved, isNew) => {
    if (isNew) {
      setUsers(p => [saved, ...p]);
    } else {
      setUsers(p => p.map(u => u.user_id === saved.user_id ? saved : u));
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const res = await deactivateUser(deactivateTarget.user_id);
      const updated = res?.data ?? res;
      setUsers(p => p.map(u => u.user_id === updated.user_id ? updated : u));
      toast(`${deactivateTarget.name} deactivated`);
      setDeactivateTarget(null);
    } catch (err) {
      toast(err?.response?.data?.error?.message ?? 'Failed to deactivate', 'error');
    } finally {
      setDeactivating(false);
    }
  };

  const toggleExpand = (userId) => {
    setExpandedRow(prev => prev === userId ? null : userId);
  };

  const pillBtn = (active) => ({
    padding: '5px 12px', borderRadius: 6, border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`,
    background: active ? 'rgba(255,69,0,0.08)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
    transition: 'all 150ms ease',
  });

  return (
    <PageWrapper>
      <div style={{ padding: '0 20px 40px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>Users</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
              Manage team members and access
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ height: 36, padding: '0 16px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#0D0A08', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 150ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(255,69,0,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Plus size={13} strokeWidth={2} />
            Add User
          </button>
        </div>

        {/* ── Stats bar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Users',      value: stats.total,    color: 'var(--accent)' },
            { label: 'Active Analysts',  value: stats.analysts, color: '#4A9EFF' },
            { label: 'Active Admins',    value: stats.admins,   color: '#FF4500' },
            { label: 'Inactive',         value: stats.inactive, color: 'var(--text-tertiary)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: s.color, opacity: 0.5 }} />
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 8, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap', padding: '0 4px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 280 }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
              style={{ ...inputStyle, height: 36, paddingLeft: 32 }}
              onFocus={e => e.target.style.borderColor = 'var(--border-default)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>

          {/* Role pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: 2 }}>Role</span>
            {['All', 'Analyst', 'Admin'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={pillBtn(roleFilter === r)}>{r}</button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', flexShrink: 0 }} />

          {/* Status pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px'}}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginRight: 2 }}>Status</span>
            {['All', 'Active', 'Inactive'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={pillBtn(statusFilter === s)}>{s}</button>
            ))}
          </div>

          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: "'PP Neue Montreal Mono', monospace", marginLeft: 'auto' }}>
            {filtered.length} / {users.length}
          </span>
        </div>

        {/* ── Table ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 100px 120px 130px', padding: '0 20px', height: 40, alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
            {['User', 'Role', 'Status', 'Incidents', 'Availability', 'Last Login', 'Actions'].map(col => (
              <span key={col} style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{col}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading users...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>No users found</div>
          ) : (
            filtered.map((u, i) => {
              const atRisk = isAtRisk(u);
              const isExpanded = expandedRow === u.user_id;
              const isSelf = u.user_id === currentUser?.user_id;

              return (
                <div key={u.user_id}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 80px 100px 120px 130px',
                    padding: '0 20px', minHeight: 56, alignItems: 'center',
                    borderBottom: (!isExpanded && i < filtered.length - 1) ? '1px solid var(--border-subtle)' : 'none',
                    background: isExpanded ? 'var(--bg-elevated)' : 'transparent',
                    opacity: !u.is_active ? 0.6 : 1,
                    transition: 'background 120ms ease',
                  }}>

                    {/* User cell */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={u.name} inactive={!u.is_active} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.name}
                          </span>
                          {isSelf && (
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,69,0,0.1)', border: '1px solid rgba(255,69,0,0.2)', color: 'var(--accent)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', fontWeight: 500 }}>YOU</span>
                          )}
                          {u.force_pw_change && u.is_active && (
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)', color: '#F0B429', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', fontWeight: 500 }}>PW CHANGE</span>
                          )}
                          {atRisk && (
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.2)', color: '#FF3B3B', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', fontWeight: 500 }}>AT RISK</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{u.email}</span>
                      </div>
                    </div>

                    {/* Role */}
                    <RoleBadge role={u.role} />

                    {/* Status */}
                    <span style={{ fontSize: 11, color: u.is_active ? '#22C55E' : 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: u.is_active ? '#22C55E' : 'var(--text-tertiary)', flexShrink: 0 }} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>

                    {/* Open incidents — clickable to expand */}
                    <button onClick={() => u.open_incident_count > 0 && toggleExpand(u.user_id)} style={{ background: 'none', border: 'none', cursor: u.open_incident_count > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: u.open_incident_count > 0 ? '#FF6B00' : 'var(--text-tertiary)', fontFamily: "'PP Neue Montreal Mono', monospace" }}>{u.open_incident_count}</span>
                      {u.open_incident_count > 0 && (
                        isExpanded ? <ChevronUp size={11} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={11} style={{ color: 'var(--text-tertiary)' }} />
                      )}
                    </button>

                    {/* Availability */}
                    <AvailabilityBar openCount={u.open_incident_count} inactive={!u.is_active} />

                    {/* Last login */}
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: "'PP Neue Montreal Mono', monospace" }}>
                      {timeAgo(u.last_login)}
                    </span>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setEditTarget(u)} style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', padding: '3px 6px', borderRadius: 4, transition: 'color 120ms ease' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                      >Edit</button>
                      <button onClick={() => setResetTarget(u)} style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', padding: '3px 6px', borderRadius: 4, transition: 'color 120ms ease' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                      >Reset</button>
                      {!isSelf && u.is_active && (
                        <button onClick={() => setDeactivateTarget(u)} style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', padding: '3px 6px', borderRadius: 4, transition: 'color 120ms ease' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#FF3B3B'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        >Deactivate</button>
                      )}
                    </div>
                  </div>

                  {/* Expanded incidents */}
                  {isExpanded && <UserIncidentExpand userId={u.user_id} />}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Drawers & Modals ── */}
      <UserFormDrawer
        open={showCreate || !!editTarget}
        onClose={() => { setShowCreate(false); setEditTarget(null); }}
        editTarget={editTarget}
        onSaved={handleSaved}
        toast={toast}
      />

      {resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          toast={toast}
        />
      )}

      <DeactivateModal
        user={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        loading={deactivating}
      />

      <Toast toasts={toasts} />

      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </PageWrapper>
  );
}