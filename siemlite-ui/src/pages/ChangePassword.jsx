import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changeMyPassword } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

export default function ChangePassword() {
  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]       = useState(false);
  const [focused, setFocused]   = useState(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { user, setAuth, accessToken } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (next !== confirm) { setError('New passwords do not match'); return; }
    if (next.length < 8)  { setError('Password must be at least 8 characters'); return; }
    
    setLoading(true);
    try {
      // Ensure keys match backend auth.controller.js expectations exactly
      await changeMyPassword(current, next); 
      
      setAuth(accessToken, { ...user, force_pw_change: false });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message ?? 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = (field) => ({
    width: '100%', height: 48,
    padding: '0 44px 0 14px',
    background: 'var(--bg-elevated)',
    border: `1px solid ${focused === field ? 'var(--accent)' : 'var(--border-subtle)'}`,
    borderRadius: 8, fontSize: 14,
    color: 'var(--text-primary)', outline: 'none',
    fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
    boxSizing: 'border-box',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    boxShadow: focused === field ? '0 0 0 3px rgba(255,69,0,0.12)' : 'none',
  });

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: 8,
    fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
    letterSpacing: '-0.01em',
  };

  const EyeToggle = ({ show, onToggle }) => (
    <button type="button" onClick={onToggle} tabIndex={-1}
      style={{
        position: 'absolute', right: 14, top: '50%',
        transform: 'translateY(-50%)', background: 'none',
        border: 'none', color: 'var(--text-tertiary)',
        cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center',
        transition: 'color 150ms ease',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,69,0,0.06) 0%, transparent 60%)`,
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 0 1px var(--border-subtle), 0 4px 16px rgba(0,0,0,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 6v4c0 4.4 3 8.5 7 9.5 4-1 7-5.1 7-9.5V6L10 2z"
                fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M7 10l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1, marginBottom: 8, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
            <span style={{ color: 'var(--text-primary)' }}>SIEM</span>
            <span style={{ color: 'var(--accent)' }}>lite</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
            Security Operations Center
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: 32,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.15)',
        }}>
          <p style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
            Set a new password
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
            Your account requires a password change before continuing.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Current password */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle} htmlFor="current">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="current"
                  type={showCurrent ? 'text' : 'password'}
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  onFocus={() => setFocused('current')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  required
                  style={inputBase('current')}
                />
                <EyeToggle show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />
              </div>
            </div>

            {/* New password */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle} htmlFor="next">New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="next"
                  type={showNext ? 'text' : 'password'}
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  onFocus={() => setFocused('next')}
                  onBlur={() => setFocused(null)}
                  placeholder="Min. 8 characters"
                  required
                  style={inputBase('next')}
                />
                <EyeToggle show={showNext} onToggle={() => setShowNext(v => !v)} />
              </div>
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: error ? 12 : 24 }}>
              <label style={labelStyle} htmlFor="confirm">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirm"
                  type={showNext ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  required
                  style={{
                    ...inputBase('confirm'),
                    borderColor: confirm && next !== confirm ? 'rgba(255,59,59,0.5)' : focused === 'confirm' ? 'var(--accent)' : 'var(--border-subtle)',
                  }}
                />
              </div>
              {confirm && next !== confirm && (
                <p style={{ fontSize: 12, color: '#FF3B3B', marginTop: 6, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px',
                background: 'rgba(255,59,59,0.08)',
                border: '1px solid rgba(255,59,59,0.2)',
                borderRadius: 6, marginBottom: 20,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF3B3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ fontSize: 13, color: '#FF3B3B', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 46,
                background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
                border: 'none', borderRadius: 8,
                color: loading ? 'var(--text-tertiary)' : '#0D0A08',
                fontSize: 14, fontWeight: 500,
                fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                letterSpacing: '-0.01em',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 150ms ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,69,0,0.25)'; }}}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; }}}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Updating...
                </>
              ) : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
