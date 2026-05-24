import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Shield, Clock, TrendingUp, TrendingDown,
  Minus, Activity, ChevronRight, Zap, Target, Users,
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuthStore } from '../store/authStore';
import { getAdminDashboard, getAnalystDashboard } from '../api/analytics.api';
import api from '../api/axiosInstance';

// ── Tokens ────────────────────────────────────────────────────
const T = {
  base:          'var(--bg-base)',
  surface:       'var(--bg-surface)',
  elevated:      'var(--bg-elevated)',
  overlay:       'var(--bg-overlay)',
  borderSubtle:  'var(--border-subtle)',
  borderDefault: 'var(--border-default)',
  text:          'var(--text-primary)',
  textSec:       'var(--text-secondary)',
  textTer:       'var(--text-tertiary)',
  accent:        'var(--accent)',
  accentHover:   'var(--accent-hover)',
};

const SEV = {
  Critical: '#FF3B3B',
  High:     '#FF6B00',
  Medium:   '#F0B429',
  Low:      '#4A9EFF',
};

const ACTION_LABELS = {
  CREATED:        'reported incident',
  STATUS_CHANGED: 'changed status',
  ASSIGNED:       'assigned analyst',
  RESOLVED:       'resolved incident',
  REOPENED:       'reopened incident',
  UPDATED:        'updated incident',
};

const cardStyle = {
  background:   T.surface,
  border:       `1px solid var(--border-subtle)`,
  borderRadius: 10,
  overflow:     'hidden',
};

const mono = { fontFamily: "'PP Neue Montreal Mono', monospace" };

const sectionTitle = {
  fontSize:      10,
  fontWeight:    600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color:         T.textTer,
  fontFamily:    'PP Neue Montreal, system-ui, sans-serif',
};

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '—';
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtMin(m) {
  if (!m) return '—';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function velDelta(today, yesterday) {
  if (yesterday === 0) return { delta: today, dir: today > 0 ? 'up' : 'flat' };
  const d = today - yesterday;
  return { delta: Math.abs(d), dir: d > 0 ? 'up' : d < 0 ? 'down' : 'flat' };
}

function getPressureScore(data) {
  if (!data?.totals) return 0;
  const t = data.totals;
  const raw =
    (t.critical_high_open  || 0) * 4 +
    (t.sla_breached_count  || 0) * 3 +
    (t.unassigned_count    || 0) * 2 +
    Math.min(t.open_incidents || 0, 20);
  return Math.min(100, Math.round(raw * 1.5));
}

// ── VelArrow ──────────────────────────────────────────────────
const VelArrow = memo(({ dir, color }) => {
  if (dir === 'up')   return <TrendingUp   size={11} style={{ color }} />;
  if (dir === 'down') return <TrendingDown size={11} style={{ color }} />;
  return <Minus size={11} style={{ color: T.textTer }} />;
});

// ── StatCard ──────────────────────────────────────────────────
const StatCard = memo(function StatCard({ icon: Icon, label, value, sub, color, onClick, velDir, velValue }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...cardStyle,
        padding: '16px 18px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 150ms ease',
        background: hover && onClick ? T.elevated : T.surface,
        borderColor: hover && onClick ? T.borderDefault : 'var(--border-subtle)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: color, opacity: 0.6 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={sectionTitle}>{label}</span>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: T.elevated, border: `1px solid var(--border-subtle)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={12} style={{ color }} strokeWidth={1.5} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontSize: 28, fontWeight: 700, color: T.text,
            letterSpacing: '-0.03em', lineHeight: 1,
            fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
          }}>{value ?? 0}</p>
          {sub && (
            <p style={{ fontSize: 10, color: T.textTer, marginTop: 4, ...mono, letterSpacing: '0.03em' }}>{sub}</p>
          )}
        </div>
        {velDir && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
            <VelArrow dir={velDir} color={velDir === 'up' ? '#FF6B00' : '#22C55E'} />
            <span style={{ fontSize: 10, color: velDir === 'up' ? '#FF6B00' : velDir === 'down' ? '#22C55E' : T.textTer, ...mono }}>{velValue}</span>
          </div>
        )}
      </div>
    </div>
  );
});

// ── PressureGauge ─────────────────────────────────────────────
const PressureGauge = memo(({ score }) => {
  const pct   = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? '#FF3B3B' : pct >= 40 ? '#F0B429' : '#22C55E';
  const label = pct >= 70 ? 'HIGH' : pct >= 40 ? 'ELEVATED' : 'NORMAL';
  const R = 52, cx = 64, cy = 68;
  const circumference = Math.PI * R;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div style={{ ...cardStyle, padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ ...sectionTitle, alignSelf: 'flex-start', marginBottom: 10 }}>Threat Pressure</span>
      <svg width="128" height="90" viewBox="0 0 128 90">
        <path d={`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" strokeLinecap="round" />
        <path d={`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 800ms cubic-bezier(0.16,1,0.3,1), stroke 400ms ease' }}
        />
        <text x={cx} y={cy-6} textAnchor="middle" style={{ fill: 'var(--text-primary)', fontSize: 22, fontWeight: 700, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{pct}</text>
        <text x={cx} y={cy+10} textAnchor="middle" style={{ fill: color, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{label}</text>
        {[0,25,50,75,100].map(v => {
          const angle = Math.PI * (1 - v/100);
          const x1 = cx + (R-12) * Math.cos(angle), y1 = cy - (R-12) * Math.sin(angle);
          const x2 = cx + (R-6)  * Math.cos(angle), y2 = cy - (R-6)  * Math.sin(angle);
          return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--border-subtle)" strokeWidth="1" />;
        })}
      </svg>
      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        {[['NORMAL','#22C55E'],['ELEVATED','#F0B429'],['HIGH','#FF3B3B']].map(([l,c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
            <span style={{ fontSize: 9, color: T.textTer, ...mono, letterSpacing: '0.06em' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── HeatClock ─────────────────────────────────────────────────
const HeatClock = memo(({ data }) => {
  const [hovered, setHovered] = useState(null);
  const cx = 80, cy = 80, R = 60, innerR = 32;
  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div style={{ ...cardStyle, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={sectionTitle}>Incident Heat Clock</span>
        <span style={{ fontSize: 10, color: T.textTer, ...mono }}>by hour · all time</span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <svg width="160" height="160" viewBox="0 0 160 160" style={{ flexShrink: 0 }}>
          {data.map((d, i) => {
            const sliceAngle = (2 * Math.PI) / 24;
            const startAngle = i * sliceAngle - Math.PI / 2;
            const endAngle   = startAngle + sliceAngle - 0.02;
            const intensity  = d.total / maxTotal;
            const rOuter     = innerR + (R - innerR) * Math.max(0.08, intensity);
            const x1 = cx + innerR * Math.cos(startAngle), y1 = cy + innerR * Math.sin(startAngle);
            const x2 = cx + rOuter  * Math.cos(startAngle), y2 = cy + rOuter  * Math.sin(startAngle);
            const x3 = cx + rOuter  * Math.cos(endAngle),   y3 = cy + rOuter  * Math.sin(endAngle);
            const x4 = cx + innerR  * Math.cos(endAngle),   y4 = cy + innerR  * Math.sin(endAngle);
            const baseColor = d.critical > 0 ? '#FF3B3B' : d.total > 0 ? '#FF6B00' : 'var(--bg-elevated)';
            const opacity   = d.total === 0 ? 0.3 : 0.3 + intensity * 0.7;
            return (
              <path key={i}
                d={`M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1} Z`}
                fill={baseColor} opacity={opacity} stroke="var(--bg-base)" strokeWidth="0.5"
                style={{ cursor: 'pointer', transition: 'opacity 150ms ease' }}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
          {[0,6,12,18].map(h => {
            const angle = (h/24) * 2 * Math.PI - Math.PI/2;
            return (
              <text key={h} x={cx+(R+10)*Math.cos(angle)} y={cy+(R+10)*Math.sin(angle)+3} textAnchor="middle"
                style={{ fill: 'var(--text-tertiary)', fontSize: 9, ...mono }}
              >{h === 0 ? '00' : h}</text>
            );
          })}
          <circle cx={cx} cy={cy} r={innerR-2} fill="var(--bg-base)" />
          {hovered ? (
            <>
              <text x={cx} y={cy-4} textAnchor="middle" style={{ fill: 'var(--text-primary)', fontSize: 14, fontWeight: 700, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{hovered.total}</text>
              <text x={cx} y={cy+9} textAnchor="middle" style={{ fill: 'var(--text-tertiary)', fontSize: 7, ...mono }}>{String(hovered.hour).padStart(2,'0')}:00</text>
            </>
          ) : (
            <text x={cx} y={cy+4} textAnchor="middle" style={{ fill: 'var(--text-tertiary)', fontSize: 7, ...mono }}>HOVER</text>
          )}
        </svg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 11, color: T.textSec, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
            Peak hours show when your SOC is under most pressure.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {[...data].sort((a,b) => b.total - a.total).slice(0,3).map((d,i) => (
              <div key={d.hour} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: T.textTer, ...mono, width: 28 }}>{String(d.hour).padStart(2,'0')}:00</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.elevated, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${(d.total/maxTotal)*100}%`,
                    background: i===0 ? '#FF3B3B' : i===1 ? '#FF6B00' : '#F0B429',
                    transition: 'width 600ms ease',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: T.textTer, width: 20, textAlign: 'right', ...mono }}>{d.total}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {[['Critical','#FF3B3B'],['Other','#FF6B00']].map(([l,c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 1, background: c, opacity: 0.8 }} />
                <span style={{ fontSize: 9, color: T.textTer, ...mono }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ── ThreatPulse ───────────────────────────────────────────────
const ThreatPulse = memo(({ items }) => {
  const trackRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    if (!items.length) return;
    const animate = () => {
      setOffset(prev => {
        const el = trackRef.current;
        if (!el) return prev;
        const halfWidth = el.scrollWidth / 2;
        return prev >= halfWidth ? 0 : prev + 0.4;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [items.length]);

  if (!items.length) return null;
  const doubled = [...items, ...items];

  return (
    <div style={{
      ...cardStyle,
      display: 'flex', alignItems: 'center',
      marginBottom: 16, borderRadius: 8,
    }}>
      <div style={{
        flexShrink: 0, padding: '8px 14px',
        borderRight: `1px solid var(--border-subtle)`,
        display: 'flex', alignItems: 'center', gap: 6,
        background: T.elevated,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF3B3B', boxShadow: '0 0 6px #FF3B3B', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textTer, fontFamily: 'PP Neue Montreal, system-ui, sans-serif', whiteSpace: 'nowrap' }}>LIVE</span>
      </div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div ref={trackRef} style={{ display: 'flex', alignItems: 'center', transform: `translateX(-${offset}px)`, willChange: 'transform', whiteSpace: 'nowrap' }}>
          {doubled.map((item, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRight: `1px solid var(--border-subtle)` }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: SEV[item.severity] || T.textTer, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: SEV[item.severity] || T.textTer, fontWeight: 600, ...mono, letterSpacing: '0.04em' }}>{item.severity}</span>
              <span style={{ fontSize: 11, color: T.text, fontFamily: 'PP Neue Montreal, system-ui, sans-serif', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.incident_title}</span>
              <span style={{ fontSize: 10, color: T.textTer, ...mono }}>{timeAgo(item.log_time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── ActivityFeed ──────────────────────────────────────────────
const ActivityFeed = memo(({ items, title = 'Recent Activity' }) => {
  const navigate = useNavigate();
  return (
    <div style={{ ...cardStyle }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid var(--border-subtle)`, background: T.elevated }}>
        <span style={sectionTitle}>{title}</span>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 450 }}>
        {!items?.length && (
          <div style={{ padding: 24, textAlign: 'center', color: T.textTer, fontSize: 12 }}>No recent activity</div>
        )}
        {items?.map((item, i) => (
          <div key={item.log_id || i}
            onClick={() => navigate(`/incidents/${item.incident_id}`)}
            style={{
              padding: '10px 16px',
              borderBottom: i < items.length-1 ? `1px solid var(--border-subtle)` : 'none',
              cursor: 'pointer', transition: 'background 120ms ease',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.elevated}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: SEV[item.severity] || T.textTer, marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: T.text, lineHeight: 1.4, fontFamily: 'PP Neue Montreal, system-ui, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: T.accent, fontWeight: 500 }}>{item.actor_name || 'System'}</span>
                {' '}{ACTION_LABELS[item.action_type] || item.action_type}{' · '}
                <span style={{ color: T.textSec }}>{item.incident_title}</span>
              </p>
              <p style={{ fontSize: 10, color: T.textTer, marginTop: 2, ...mono }}>{timeAgo(item.log_time)}</p>
            </div>
            <ChevronRight size={11} style={{ color: T.textTer, flexShrink: 0, marginTop: 3 }} />
          </div>
        ))}
      </div>
    </div>
  );
});

// ── MTTRTable ─────────────────────────────────────────────────
const MTTRTable = memo(({ data }) => (
  <div style={cardStyle}>
    <div style={{ padding: '12px 16px', borderBottom: `1px solid var(--border-subtle)`, background: T.elevated, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={sectionTitle}>Mean Time to Resolve</span>
      <span style={{ fontSize: 10, color: T.textTer, ...mono }}>by severity</span>
    </div>
    {['Critical','High','Medium','Low'].map((sev, i, arr) => {
      const row = data?.find(r => r.severity === sev);
      return (
        <div key={sev} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < arr.length-1 ? `1px solid var(--border-subtle)` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: SEV[sev], boxShadow: `0 0 5px ${SEV[sev]}` }} />
            <span style={{ fontSize: 13, color: T.textSec, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{sev}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: row?.avg_ttr_minutes ? SEV[sev] : T.textTer, ...mono }}>{fmtMin(row?.avg_ttr_minutes)}</span>
        </div>
      );
    })}
  </div>
));

// ── WorkloadTable ─────────────────────────────────────────────
const WorkloadTable = memo(({ data }) => {
  const maxOpen = Math.max(...(data?.map(d => d.open_incidents) || [1]), 1);
  return (
    <div style={cardStyle}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid var(--border-subtle)`, background: T.elevated, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={sectionTitle}>Analyst Load</span>
        <Users size={11} style={{ color: T.textTer }} />
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 240 }}>
        {!data?.length && <div style={{ padding: 24, textAlign: 'center', color: T.textTer, fontSize: 12 }}>No analysts</div>}
        {data?.map((a, i) => {
          const pct = (a.open_incidents / maxOpen) * 100;
          const overloaded = a.open_incidents > maxOpen * 0.7 && a.open_incidents > 2;
          return (
            <div key={a.user_id || i} style={{ padding: '10px 16px', borderBottom: i < data.length-1 ? `1px solid var(--border-subtle)` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.elevated, border: `1px solid ${overloaded ? 'rgba(255,59,59,0.3)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: overloaded ? '#FF3B3B' : T.textTer, ...mono }}>
                    {(a.analyst_name || 'U').slice(0,2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: T.text, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>{a.analyst_name}</span>
                  {overloaded && <span style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(255,59,59,0.1)', border: '1px solid rgba(255,59,59,0.2)', color: '#FF3B3B', fontFamily: 'PP Neue Montreal, system-ui, sans-serif', fontWeight: 500 }}>HIGH</span>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: overloaded ? '#FF3B3B' : T.textSec, ...mono }}>{a.open_incidents}</span>
              </div>
              <div style={{ height: 3, borderRadius: 9999, background: T.elevated, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 9999, width: `${pct}%`, background: overloaded ? '#FF3B3B' : T.accent, opacity: 0.7, transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── FocusMode ─────────────────────────────────────────────────
const FocusMode = memo(({ data, bySeverity }) => {
  const navigate = useNavigate();
  const urgencyColor = s => s >= 60 ? '#FF3B3B' : s >= 40 ? '#FF6B00' : s >= 20 ? '#F0B429' : '#4A9EFF';
  const nextAction = inc => {
    if (inc.sla_breached) return 'SLA BREACHED — act now';
    const mins = inc.sla_minutes_remaining;
    if (mins !== null && mins < 120) return `SLA in ${Math.round(mins)}m`;
    if (inc.status === 'Open') return 'Start investigating';
    return 'Add response action';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {['Critical','High','Medium','Low'].map(sev => {
          const row = bySeverity?.find(r => r.severity === sev);
          return (
            <div key={sev} style={{ ...cardStyle, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: SEV[sev] }} />
                <span style={{ fontSize: 9, color: T.textTer, fontFamily: 'PP Neue Montreal, system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sev}</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: row?.total > 0 ? SEV[sev] : T.textTer, fontFamily: 'PP Neue Montreal, system-ui, sans-serif', letterSpacing: '-0.03em' }}>{row?.total ?? 0}</span>
            </div>
          );
        })}
      </div>

      <div style={cardStyle}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid var(--border-subtle)`, background: T.elevated, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={11} style={{ color: T.accent }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>Your Focus Queue</span>
          </div>
          <span style={{ fontSize: 10, color: T.textTer, ...mono }}>ranked by urgency score</span>
        </div>
        {!data?.length && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <Shield size={20} style={{ color: '#22C55E', display: 'block', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: T.textTer, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>No open incidents assigned to you</p>
          </div>
        )}
        {data?.map((inc, i) => {
          const score = Math.round(inc.urgency_score ?? 0);
          const color = urgencyColor(score);
          return (
            <div key={inc.incident_id}
              onClick={() => navigate(`/incidents/${inc.incident_id}`)}
              style={{
                padding: '12px 16px',
                borderBottom: i < data.length-1 ? `1px solid var(--border-subtle)` : 'none',
                cursor: 'pointer', transition: 'background 120ms ease',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.elevated}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color, ...mono }}>{score}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: T.text, fontFamily: 'PP Neue Montreal, system-ui, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{inc.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: T.textTer, ...mono }}>#{String(inc.incident_id).padStart(4,'0')}</span>
                  <span style={{ fontSize: 10, color: SEV[inc.severity] || T.textTer, ...mono }}>{inc.severity}</span>
                  <span style={{ fontSize: 10, color: T.textTer, ...mono }}>{inc.asset_name}</span>
                </div>
              </div>
              <div style={{ fontSize: 10, color: inc.sla_breached ? '#FF3B3B' : T.textTer, ...mono, textAlign: 'right', flexShrink: 0, maxWidth: 120 }}>{nextAction(inc)}</div>
              <ChevronRight size={11} style={{ color: T.textTer, flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const navigate  = useNavigate();
  const user      = useAuthStore(s => s.user);
  const isAdmin   = user?.role === 'Admin';

  const [data, setData]       = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, heatRes] = await Promise.allSettled([
        isAdmin ? getAdminDashboard() : getAnalystDashboard(),
        api.get('/analytics/incident-heatmap'),
      ]);
      if (!mounted.current) return;
      if (dashRes.status === 'fulfilled') setData(dashRes.value?.data ?? dashRes.value);
      if (heatRes.status === 'fulfilled')  setHeatmap(heatRes.value?.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; };
  }, [load]);

  const vel         = data?.velocity || {};
  const incidentVel = velDelta(vel.today ?? 0, vel.yesterday ?? 0);
  const breachedVel = velDelta(vel.breached_today ?? 0, vel.breached_yesterday ?? 0);
  const pressure    = getPressureScore(data);

  if (loading) {
    return (
      <PageWrapper>
        <div style={{ padding: '24px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ height: 96, borderRadius: 8, background: T.surface, border: `1px solid var(--border-subtle)`, animation: 'skelPulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
        </div>
        <style>{`@keyframes skelPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div style={{ padding: '0 20px 40px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.2, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
              {isAdmin ? 'Operations Dashboard' : `Welcome back, ${user?.name?.split(' ')[0]}`}
            </h1>
            <p style={{ fontSize: 13, color: T.textSec, marginTop: 3, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
              {isAdmin ? 'Live overview of your SOC' : 'Your personal incident queue'}
            </p>
          </div>
          <button
            onClick={() => navigate('/incidents?status=Open')}
            style={{ height: 34, padding: '0 14px', background: T.accent, border: 'none', borderRadius: 6, color: 'var(--bg-base)', fontSize: 13, fontWeight: 500, fontFamily: 'PP Neue Montreal, system-ui, sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 150ms ease' }}
            onMouseEnter={e => e.currentTarget.style.background = T.accentHover}
            onMouseLeave={e => e.currentTarget.style.background = T.accent}
          >
            <Zap size={11} strokeWidth={2} />
            View Open Incidents
          </button>
        </div>

        {isAdmin ? (
          <>
            {/* Threat Pulse Ticker */}
            {data?.recent_activity?.length > 0 && <ThreatPulse items={data.recent_activity} />}

            {/* Stat cards — fixed 4 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <StatCard icon={Activity}      label="Total Incidents"   value={data?.totals?.total_incidents}    sub="all time"                    color={T.accent}   onClick={() => navigate('/incidents')} />
              <StatCard icon={AlertTriangle} label="Open Incidents"    value={data?.totals?.open_incidents}     sub={`+${vel.today ?? 0} today`}  color="#FF6B00"    velDir={incidentVel.dir} velValue={incidentVel.delta} onClick={() => navigate('/incidents?status=Open')} />
              <StatCard icon={Shield}        label="Critical / High"   value={data?.totals?.critical_high_open} sub="needs immediate attention"   color="#FF3B3B"    onClick={() => navigate('/incidents?severity=Critical')} />
              <StatCard icon={Clock}         label="SLA Breached"      value={data?.totals?.sla_breached_count} sub="currently overdue"           color="#FF3B3B"    velDir={breachedVel.dir} velValue={breachedVel.delta} onClick={() => navigate('/incidents?sla_breached=true')} />
            </div>

            {/* Pressure + Heat Clock — fixed 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, marginBottom: 16 }}>
              <PressureGauge score={pressure} />
              {heatmap.length > 0
                ? <HeatClock data={heatmap} />
                : <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTer, fontSize: 13, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>No heatmap data yet</div>
              }
            </div>

            {/* Activity + Workload — fixed 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 16 }}>
              <ActivityFeed items={data?.recent_activity} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <WorkloadTable data={data?.analyst_workload} />
                <MTTRTable data={data?.mttr_by_severity} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Analyst stat cards — fixed 3 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <StatCard icon={Activity}      label="My Open Incidents"     value={data?.my_open_incidents}        sub="assigned to you"           color={T.accent}   onClick={() => navigate('/incidents')} />
              <StatCard icon={AlertTriangle} label="SLA Breached"          value={data?.my_sla_breached}          sub="needs immediate action"    color="#FF3B3B"    onClick={() => navigate('/incidents?sla_breached=true')} />
              <StatCard icon={TrendingUp}    label="Resolved This Month"   value={data?.my_resolved_this_month}   sub="great work"                color="#22C55E" />
            </div>

            <FocusMode data={data?.focus_queue} bySeverity={data?.by_severity} />

            <div style={{ marginTop: 16 }}>
              <ActivityFeed items={data?.recent_activity} title="Your Recent Activity" />
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 6px #FF3B3B}50%{opacity:0.4;box-shadow:0 0 2px #FF3B3B} }
        @keyframes skelPulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>
    </PageWrapper>
  );
}