import { useEffect, useState, useCallback, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuthStore } from '../store/authStore';
import api from '../api/axiosInstance';
import {
  TrendingUp, Shield, Clock, AlertTriangle,
  RefreshCw, ExternalLink,
} from 'lucide-react';

const T = {
  bgSurface:    'var(--bg-surface)',
  bgElevated:   'var(--bg-elevated)',
  bgOverlay:    'var(--bg-overlay)',
  borderSubtle: 'var(--border-subtle)',
  borderDefault:'var(--border-default)',
  textPrimary:  'var(--text-primary)',
  textSecondary:'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  accent:       'var(--accent)',
  accentHover:  'var(--accent-hover)',
  borderStrong: 'var(--border-strong)',
  bgAccent: 'var(--accent)',
  textBlack:'var(--bg-base)',
};

const SEVERITY_COLORS = {
  Critical: '#FF3B3B',
  High:     '#FF6B00',
  Medium:   '#F0B429',
  Low:      '#4A9EFF',
};

const STATUS_COLORS = {
  Open:          '#FF3B3B',
  Investigating: '#F0B429',
  Resolved:      '#22C55E',
  Reopened:      '#A855F7',
};

const RANGE_OPTIONS = [
  { label: '7d',  value: 7  },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: 'All', value: 0  },
];

const TREND_MODES = ['Daily', 'Weekly', 'Monthly'];

function Skeleton({ width = '100%', height = 16, radius = 4, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      animation: 'skelPulse 1.6s ease-in-out infinite',
      ...style,
    }} />
  );
}

function SkeletonStatCard() {
  return (
    <div style={{
      background: T.bgSurface,
      border: '1px solid var(--border-subtle)',
      borderRadius: 8, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width={80} height={10} />
        <Skeleton width={28} height={28} radius={6} />
      </div>
      <Skeleton width={60} height={26} radius={4} />
      <Skeleton width={100} height={10} />
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-overlay)',
      border: '1px solid var(--border-default)',
      borderRadius: 6, padding: '8px 12px',
      fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
      fontSize: 12, minWidth: 120,
    }}>
      <p style={{ color: T.textTertiary, marginBottom: 6, fontSize: 11, letterSpacing: '0.04em' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: T.textSecondary, fontSize: 11 }}>{p.name}</span>
          <span style={{ color: T.textPrimary, fontWeight: 600, marginLeft: 'auto', paddingLeft: 12 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={{
      background: T.bgSurface,
      border: `1px solid ${T.borderSubtle}`,
      borderRadius: 8, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: color || T.accent, opacity: 0.6,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 9, fontWeight: 500, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: T.textTertiary,
          fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
        }}>{label}</span>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: T.bgElevated, border: `1px solid ${T.borderSubtle}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={12} style={{ color: color || T.accent }} strokeWidth={1.5} />
        </div>
      </div>
      <div>
        <p style={{
          fontSize: 26, fontWeight: 700, color: T.textPrimary,
          letterSpacing: '-0.03em', lineHeight: 1,
          fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
        }}>{value ?? 0}</p>
        {sub && (
          <p style={{
            fontSize: 11, color: T.textTertiary, marginTop: 4,
            fontFamily: "'PP Neue Montreal Mono', monospace",
            letterSpacing: '0.03em',
          }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

function Card({ title, subtitle, action, children, style = {} }) {
  return (
    <div style={{
      background: T.bgSurface,
      border: `1px solid ${T.borderSubtle}`,
      borderRadius: 10, overflow: 'hidden', ...style,
    }}>
      {(title || action) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: `1px solid ${T.borderSubtle}`,
          background: T.bgElevated,
        }}>
          <div>
            <p style={{
              fontSize: 13, fontWeight: 600, color: T.textPrimary,
              fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
              letterSpacing: '-0.01em',
            }}>{title}</p>
            {subtitle && (
              <p style={{
                fontSize: 11, color: T.textTertiary, marginTop: 2,
                fontFamily: "'PP Neue Montreal Mono', monospace",
              }}>{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2,
      background: 'var(--bg-base)',
      border: `1px solid ${T.borderSubtle}`,
      borderRadius: 6, padding: 2,
    }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          padding: '4px 10px', borderRadius: 4, border: 'none',
          background: value === opt ? T.bgOverlay : 'transparent',
          color: value === opt ? T.textPrimary : T.textTertiary,
          fontSize: 11, fontWeight: 500,
          fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
          cursor: 'pointer', transition: 'all 120ms ease',
          letterSpacing: '0.02em',
        }}>{opt}</button>
      ))}
    </div>
  );
}

function SLARow({ severity, pct, total }) {
  const color = SEVERITY_COLORS[severity] || T.accent;
  const p = Math.min(100, Math.max(0, pct ?? 0));
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0,
          }} />
          <span style={{
            fontSize: 12, fontWeight: 500, color: T.textPrimary,
            fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
          }}>{severity}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'PP Neue Montreal Mono', monospace",
            fontSize: 12, color, fontWeight: 600,
          }}>{p}%</span>
          <span style={{
            fontFamily: "'PP Neue Montreal Mono', monospace",
            fontSize: 10, color: T.textTertiary,
          }}>({total ?? 0} incidents)</span>
        </div>
      </div>
      <div style={{
        height: 5, borderRadius: 9999,
        background: T.bgElevated, overflow: 'hidden',
        border: `1px solid ${T.borderSubtle}`,
      }}>
        <div style={{
          height: '100%', width: `${p}%`,
          background: color, borderRadius: 9999, opacity: 0.85,
          transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  );
}

function DrillModal({ title, incidents, onClose }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 600, maxHeight: '70vh',
        background: T.bgSurface, border: `1px solid ${T.borderSubtle}`,
        borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: `1px solid ${T.borderSubtle}`,
          background: T.bgElevated, flexShrink: 0,
        }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: T.textPrimary,
            fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
          }}>{title}</p>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.textTertiary, fontSize: 18, lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {incidents?.length === 0 && (
            <p style={{ padding: 24, textAlign: 'center', color: T.textTertiary, fontSize: 13 }}>
              No incidents found
            </p>
          )}
          {incidents?.map((inc, i) => (
            <div key={inc.incident_id || i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: i < incidents.length - 1 ? `1px solid ${T.borderSubtle}` : 'none',
              cursor: 'pointer', transition: 'background 120ms ease',
            }}
              onMouseEnter={e => e.currentTarget.style.background = T.bgElevated}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => window.location.href = `/incidents/${inc.incident_id}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{
                  fontSize: 13, fontWeight: 500, color: T.textPrimary,
                  fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                }}>{inc.title}</span>
                <span style={{
                  fontSize: 10, color: T.textTertiary,
                  fontFamily: "'PP Neue Montreal Mono', monospace",
                  letterSpacing: '0.04em',
                }}>#{String(inc.incident_id).padStart(4,'0')} · {inc.asset_name || '—'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 11, color: SEVERITY_COLORS[inc.severity] || T.textTertiary,
                  fontFamily: "'PP Neue Montreal Mono', monospace",
                }}>{inc.severity}</span>
                <ExternalLink size={11} style={{ color: T.textTertiary }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'Admin';

  const [threats, setThreats]   = useState([]);
  const [sla, setSla]           = useState(null);
  const [trends, setTrends]     = useState([]);
  const [assets, setAssets]     = useState([]);
  const [workload, setWorkload] = useState([]);
  const [breached, setBreached] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [range, setRange]           = useState(30);
  const [trendMode, setTrendMode]   = useState('Daily');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [drill, setDrill]           = useState(null);
  const refreshTimer = useRef(null);

  const fetchAll = useCallback(async () => {
    const params = range > 0 ? `?days=${range}` : '';
    const tSep   = range > 0 ? '&' : '?';
    const mode   = trendMode.toLowerCase();
    const breachQ = range > 0
      ? `?days=${range}&sla_breached=true&limit=20`
      : '?sla_breached=true&limit=20';

    const [threatRes, slaRes, trendRes, assetRes, workloadRes, breachRes] =
      await Promise.allSettled([
        api.get(`/analytics/threat-frequency${params}`),
        api.get(`/analytics/sla-compliance${params}`),
        api.get(`/analytics/incident-trends${params}${tSep}groupBy=${mode}`),
        api.get(`/analytics/asset-exposure${params}`),
        api.get(`/analytics/analyst-workload${params}`),
        api.get(`/incidents${breachQ}`),
      ]);

    if (threatRes.status   === 'fulfilled') setThreats(threatRes.value.data.data || []);
    if (slaRes.status      === 'fulfilled') setSla(slaRes.value.data.data ?? null);
    if (trendRes.status    === 'fulfilled') setTrends(trendRes.value.data.data?.over_time || []);
    if (assetRes.status    === 'fulfilled') setAssets(assetRes.value.data.data?.ranked || []);
    if (workloadRes.status === 'fulfilled') setWorkload(workloadRes.value.data.data?.analysts || []);
    if (breachRes.status   === 'fulfilled') setBreached(breachRes.value.data.data || []);
    setLoading(false);
    setLastUpdated(new Date());
  }, [range, trendMode]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (autoRefresh) {
      refreshTimer.current = setInterval(fetchAll, 60000);
    } else {
      clearInterval(refreshTimer.current);
    }
    return () => clearInterval(refreshTimer.current);
  }, [autoRefresh, fetchAll]);

  const openDrill = async (title, endpoint) => {
    const res = await api.get(endpoint).catch(() => null);
    setDrill({ title, incidents: res?.data?.data || [] });
  };

  const overallSLA = (() => {
    if (!sla?.by_severity?.length) return 0;
    const total = sla.by_severity.reduce((s, r) => s + (r.total || 0), 0);
    const within = sla.by_severity.reduce((s, r) => s + (r.within_sla || 0), 0);
    return total > 0 ? Math.round((within / total) * 100) : 0;
  })();

  const avgTTR = workload.length
    ? Math.round(workload.reduce((s, w) => s + (w.avg_ttr_minutes || 0), 0) / workload.length)
    : 0;

  const topThreat = threats[0]?.threat_type || '—';
  const totalBreached = breached.length;

  const avgIncidentCount = workload.length
    ? workload.reduce((s, w) => s + (Number(w.incidents_handled ?? 0)), 0) / workload.length
    : 0;

  const timeSince = lastUpdated
    ? Math.round((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>SIEMlite Analytics Report</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #fff; color: #111; padding: 32px; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            .meta { color: #666; font-size: 13px; margin-bottom: 32px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            th { text-align: left; font-size: 11px; text-transform: uppercase;
                 letter-spacing: 0.06em; color: #888; padding: 8px 12px;
                 border-bottom: 2px solid #eee; }
            td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
            h2 { font-size: 15px; font-weight: 600; margin: 32px 0 8px;
                 padding-bottom: 8px; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <h1>SIEMlite — Analytics Report</h1>
          <p class="meta">Generated ${new Date().toLocaleString()} · ${range > 0 ? `Last ${range} days` : 'All time'} · Overall SLA: ${overallSLA}%</p>

          <h2>Threat Frequency</h2>
          <table>
            <thead><tr><th>Threat Type</th><th>Total Incidents</th></tr></thead>
            <tbody>
              ${threats.filter(t => t.total > 0).map(t =>
                `<tr><td>${t.threat_type}</td><td>${t.total}</td></tr>`
              ).join('')}
            </tbody>
          </table>

          <h2>SLA Compliance by Severity</h2>
          <table>
            <thead><tr><th>Severity</th><th>Total</th><th>Within SLA</th><th>Compliance %</th></tr></thead>
            <tbody>
              ${(sla?.by_severity || []).map(r =>
                `<tr><td>${r.severity}</td><td>${r.total}</td><td>${r.within_sla}</td><td>${r.compliance_pct ?? 0}%</td></tr>`
              ).join('')}
            </tbody>
          </table>

          <h2>Analyst Workload</h2>
          <table>
            <thead><tr><th>Analyst</th><th>Incidents Handled</th><th>Response Actions</th><th>Avg TTR</th></tr></thead>
            <tbody>
              ${workload.map(w =>
                `<tr>
                  <td>${w.name || w.analyst_name || '—'}</td>
                  <td>${w.incidents_handled ?? 0}</td>
                  <td>${w.response_actions ?? 0}</td>
                  <td>${w.avg_ttr_minutes ? Math.round(w.avg_ttr_minutes) + 'm' : '—'}</td>
                </tr>`
              ).join('')}
            </tbody>
          </table>

          <h2>Asset Exposure</h2>
          <table>
            <thead><tr><th>Asset</th><th>Type</th><th>Incidents</th><th>Severity Score</th></tr></thead>
            <tbody>
              ${assets.slice(0, 10).map(a =>
                `<tr><td>${a.asset_name}</td><td>${a.asset_type}</td><td>${a.incident_count}</td><td>${a.severity_score}</td></tr>`
              ).join('')}
            </tbody>
          </table>

          <h2>SLA Breached — Active</h2>
          <table>
            <thead><tr><th>Incident</th><th>Severity</th><th>Status</th><th>Asset</th></tr></thead>
            <tbody>
              ${breached.map(inc =>
                `<tr><td>${inc.title}</td><td>${inc.severity}</td><td>${inc.status}</td><td>${inc.asset_name || '—'}</td></tr>`
              ).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <PageWrapper>
      <div style={{ padding: '0 20px 32px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12, paddingBottom: 16,
        }}>
          <div>
            <h1 style={{
              fontSize: 24, fontWeight: 700, color: T.textPrimary,
              letterSpacing: '-0.02em', lineHeight: 1.2,
              fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
            }}>Analytics</h1>
            <p style={{
              fontSize: 13, color: T.textSecondary, marginTop: 4,
              fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
            }}>
              {timeSince !== null ? `Updated ${timeSince}s ago` : 'Loading...'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Range */}
            <div style={{
              display: 'flex', gap: 2,
              background: 'var(--bg-base)',
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 6, padding: 2,
            }}>
              {RANGE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setRange(opt.value)} style={{
                  padding: '5px 11px', borderRadius: 4, border: 'none',
                  background: range === opt.value ? T.bgOverlay : 'transparent',
                  color: range === opt.value ? T.textPrimary : T.textTertiary,
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                  transition: 'all 120ms ease',
                }}>{opt.label}</button>
              ))}
            </div>

          <button onClick={exportToPDF} style={{
            height: 36, padding: '0 12px',
            background: T.bgAccent,
            border: `1px solid ${T.borderDefault}`,
            borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: T.textPrimary,
            fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
            fontWeight: 500, transition: 'all 150ms ease',
            color: T.textBlack,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.accentHover; e.currentTarget.style.borderColor = T.accentHover; e.currentTarget.style.color = 'var(--bg-base)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.accent; e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = 'var(--bg-base)'; }}
          onMouseDown={e => { e.currentTarget.style.background = 'var(--accent-pressed)'; e.currentTarget.style.borderColor = 'var(--accent-pressed)'; e.currentTarget.style.color = 'var(--bg-base)'; }}
          onMouseUp={e => { e.currentTarget.style.background = T.accentHover; e.currentTarget.style.borderColor = T.accentHover; e.currentTarget.style.color = 'var(--bg-base)'; }}
          >
            <ExternalLink size={12} strokeWidth={1.5} />
            Export PDF
          </button>

            {/* Auto refresh */}
            <button onClick={() => setAutoRefresh(v => !v)} style={{
              height: 36, padding: '0 12px',
              background: autoRefresh ? 'rgba(255,69,0,0.08)' : T.bgElevated,
              border: `1px solid ${autoRefresh ? T.accent : T.borderSubtle}`,
              borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: autoRefresh ? T.accent : T.textSecondary,
              fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
              fontWeight: 500, transition: 'all 150ms ease',
            }}>
              <RefreshCw size={12} strokeWidth={2}
                style={{ animation: autoRefresh ? 'spin 2s linear infinite' : 'none' }}
              />
              Auto
            </button>

            {/* Manual refresh */}
            <button onClick={fetchAll} style={{
              height: 36, width: 36,
              background: T.bgElevated,
              border: `1px solid ${T.borderSubtle}`,
              borderRadius: 6, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textTertiary, transition: 'all 150ms ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = T.textPrimary; e.currentTarget.style.borderColor = T.borderDefault; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.textTertiary; e.currentTarget.style.borderColor = T.borderSubtle; }}
            >
              <RefreshCw size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* ── Stat strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {loading ? [0,1,2,3].map(i => <SkeletonStatCard key={i} />) : (
            <>
              <StatCard icon={TrendingUp}    label="SLA Compliance" value={`${overallSLA}%`} sub="overall this period"                    color="#22C55E" />
              <StatCard icon={Clock}         label="Avg TTR"         value={`${avgTTR}m`}      sub="mean time to resolve"                   color="#4A9EFF" />
              <StatCard icon={AlertTriangle} label="SLA Breached"    value={totalBreached}      sub="currently overdue"                      color="#FF3B3B" />
              <StatCard icon={Shield}        label="Top Threat"      value={topThreat}          sub={`${threats[0]?.total ?? 0} incidents`}  color={T.accent} />
            </>
          )}
        </div>

        {/* ── Incident Trends ── */}
        <Card
          title="Incident Trends"
          subtitle={`${trendMode} breakdown · ${range > 0 ? `last ${range} days` : 'all time'}`}
          action={<ToggleGroup options={TREND_MODES} value={trendMode} onChange={setTrendMode} />}
          style={{ marginBottom: 20 }}
        >
          {loading ? (
            <Skeleton width="100%" height={240} radius={6} />
          ) : trends.length === 0 ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTertiary, fontSize: 13 }}>
              No trend data for this period
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                {[['Total', '#FF4500'], ['Resolved', '#22C55E']].map(([name, color]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, opacity: 0.85 }} />
                    <span style={{ fontSize: 11, color: T.textTertiary, fontFamily: "'PP Neue Montreal Mono', monospace" }}>{name}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trends} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#FF4500" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF4500" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tick={{ fill: '#5c4a32', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#5c4a32', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="total"    name="Total"    stroke="#FF4500" strokeWidth={2} fill="url(#gradTotal)"    dot={false} activeDot={{ r: 4, fill: '#FF4500' }} />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#22C55E" strokeWidth={2} fill="url(#gradResolved)" dot={false} activeDot={{ r: 4, fill: '#22C55E' }} />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}
        </Card>

        {/* ── Row 2: Threat Frequency + SLA ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          <Card title="Threat Frequency" subtitle="click a bar to drill down">
            {loading ? (
              <Skeleton width="100%" height={320} radius={6} />
            ) : threats.length === 0 ? (
              <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTertiary, fontSize: 13 }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={threats.filter(t => t.total > 0).slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                  onClick={e => e?.activePayload?.[0] && openDrill(
                    `${e.activePayload[0].payload.threat_type} — Incidents`,
                    `/incidents?threat_type_name=${encodeURIComponent(e.activePayload[0].payload.threat_type)}&limit=50`
                  )}
                >
                  <XAxis type="number" tick={{ fill: '#5c4a32', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="threat_type" width={140}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false} axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,69,0,0.04)' }} />
                  <Bar dataKey="total" name="Incidents" radius={[0,4,4,0]} cursor="pointer" barSize={15}>
                    {threats.filter(t => t.total > 0).slice(0, 10).map((_, i) => (
                      <Cell key={i} fill={`rgba(255,69,0,${1 - i * 0.08})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="SLA Compliance" subtitle="% resolved within deadline by severity">
            {loading ? (
              <Skeleton width="100%" height={320} radius={6} />
            ) : !sla?.by_severity ? (
              <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTertiary, fontSize: 13 }}>No data</div>
            ) : (
              <div style={{ paddingTop: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  marginBottom: 24, padding: '12px 16px',
                  background: T.bgElevated, border: `1px solid ${T.borderSubtle}`,
                  borderRadius: 8,
                }}>
                  <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="var(--border-subtle)" strokeWidth="5" />
                      <circle cx="28" cy="28" r="22" fill="none"
                        stroke={overallSLA >= 80 ? '#22C55E' : overallSLA >= 50 ? '#F0B429' : '#FF3B3B'}
                        strokeWidth="5"
                        strokeDasharray={`${(overallSLA / 100) * 138.2} 138.2`}
                        strokeLinecap="round"
                        transform="rotate(-90 28 28)"
                      />
                    </svg>
                    <span style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: T.textPrimary,
                      fontFamily: "'PP Neue Montreal Mono', monospace",
                    }}>{overallSLA}%</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
                      Overall compliance
                    </p>
                    <p style={{ fontSize: 11, color: T.textTertiary, marginTop: 2, fontFamily: "'PP Neue Montreal Mono', monospace" }}>
                      {(sla.by_severity || []).reduce((s, r) => s + (r.within_sla || 0), 0)} resolved within SLA · {(sla.breached_incidents || []).length} currently overdue
                    </p>
                  </div>
                </div>
                {['Critical','High','Medium','Low'].map(sev => {
                  const row = sla.by_severity?.find(r => r.severity === sev);
                  return <SLARow key={sev} severity={sev} pct={row?.compliance_pct != null ? Number(row.compliance_pct) : null} total={row?.total} />;
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── Row 3: Asset Exposure + Analyst Workload ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          <Card title="Asset Exposure" subtitle="severity-weighted score · click to drill down">
            {loading ? (
              <Skeleton width="100%" height={260} radius={6} />
            ) : assets.length === 0 ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTertiary, fontSize: 13 }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={assets.slice(0, 8)}
                  margin={{ top: 4, right: 8, bottom: 44, left: -4 }}
                  onClick={e => e?.activePayload?.[0] && openDrill(
                    `${e.activePayload[0].payload.asset_name} — Incidents`,
                    `/assets/${e.activePayload[0].payload.asset_id}/incidents?limit=50`
                  )}
                >
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="asset_name"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                    tickLine={false} axisLine={false}
                    angle={-30} textAnchor="end" height={52}
                  />
                  <YAxis tick={{ fill: '#5c4a32', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,69,0,0.04)' }} />
                  <Bar dataKey="severity_score" name="Exposure score" radius={[4,4,0,0]} cursor="pointer">
                    {assets.slice(0, 8).map((a, i) => (
                      <Cell key={i} fill={
                        a.severity_score > 20 ? '#FF3B3B' :
                        a.severity_score > 10 ? '#FF6B00' :
                        a.severity_score > 5  ? '#F0B429' : '#4A9EFF'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card
            title="Analyst Workload"
            subtitle={isAdmin ? 'all analysts · above-average flagged' : 'your performance'}
          >
            {loading ? (
              <Skeleton width="100%" height={260} radius={6} />
            ) : workload.length === 0 ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textTertiary, fontSize: 13 }}>No data</div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: 260 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px',
                  padding: '0 0 8px', marginBottom: 4,
                  borderBottom: `1px solid ${T.borderSubtle}`,
                }}>
                  {['Analyst','Handled','Actions','Avg TTR'].map(h => (
                    <span key={h} style={{
                      fontSize: 9, fontWeight: 500, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: T.textTertiary,
                      fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                      textAlign: h !== 'Analyst' ? 'right' : 'left',
                    }}>{h}</span>
                  ))}
                </div>
                {workload.map((w, i) => {
                  const aboveAvg = Number(w.incidents_handled ?? 0) > avgIncidentCount * 1.3;
                  return (
                    <div key={w.user_id || i} style={{
                      display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px',
                      padding: '9px 0',
                      borderBottom: i < workload.length - 1 ? `1px solid ${T.borderSubtle}` : 'none',
                      alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%',
                          background: T.bgElevated,
                          border: `1px solid ${aboveAvg ? 'rgba(255,69,0,0.3)' : T.borderSubtle}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 600,
                          color: aboveAvg ? T.accent : T.textTertiary,
                          fontFamily: "'PP Neue Montreal Mono', monospace",
                          flexShrink: 0,
                        }}>
                          {(w.name || 'U').slice(0,2).toUpperCase()}
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 500, color: T.textPrimary,
                          fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                        }}>{w.name || '—'}</span>
                        {aboveAvg && (
                          <span style={{
                            fontSize: 9, padding: '1px 5px', borderRadius: 3,
                            background: 'rgba(255,69,0,0.1)',
                            border: '1px solid rgba(255,69,0,0.2)',
                            color: T.accent,
                            fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                            fontWeight: 500, letterSpacing: '0.04em',
                          }}>HIGH</span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: aboveAvg ? '#FF3B3B' : T.textSecondary, fontFamily: "'PP Neue Montreal Mono', monospace", textAlign: 'right' }}>
                        {w.incidents_handled ?? 0}
                      </span>
                      <span style={{ fontSize: 12, color: T.textSecondary, fontFamily: "'PP Neue Montreal Mono', monospace", textAlign: 'right' }}>
                        {w.response_actions ?? 0}
                      </span>
                      <span style={{ fontSize: 12, color: T.textTertiary, fontFamily: "'PP Neue Montreal Mono', monospace", textAlign: 'right' }}>
                        {w.avg_ttr_minutes ? `${Math.round(w.avg_ttr_minutes)}m` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── SLA Breach List ── */}
        <Card
          title="SLA Breached — Active"
          subtitle="incidents currently overdue · open or investigating"
          action={
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4,
              background: totalBreached > 0 ? 'rgba(255,59,59,0.1)' : 'transparent',
              border: `1px solid ${totalBreached > 0 ? 'rgba(255,59,59,0.25)' : T.borderSubtle}`,
              color: totalBreached > 0 ? '#FF3B3B' : T.textTertiary,
              fontFamily: "'PP Neue Montreal Mono', monospace",
            }}>{totalBreached} overdue</span>
          }
        >
          {loading ? (
            <Skeleton width="60%" height={13} radius={4} />
          ) : breached.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: T.textTertiary, fontSize: 13 }}>
              <Shield size={20} style={{ color: '#22C55E', display: 'block', margin: '0 auto 8px' }} />
              All incidents within SLA
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: '1.8fr 100px 130px 1fr 100px',
                padding: '0 0 12px', borderBottom: `1px solid ${T.borderSubtle}`, marginBottom: 4,
              }}>
                {['Incident','Severity','Status','Asset','Overdue by'].map(h => (
                  <span key={h} style={{
                    fontSize: 9, fontWeight: 500, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: T.textTertiary,
                    fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                  }}>{h}</span>
                ))}
              </div>
              {breached.map((inc, i) => {
                const overdue = inc.sla_deadline
                  ? Math.round((Date.now() - new Date(inc.sla_deadline).getTime()) / 60000)
                  : null;
                return (
                  <div key={inc.incident_id} style={{
                    display: 'grid', gridTemplateColumns: '1.8fr 100px 130px 1fr 100px',
                    padding: '13px 0',
                    borderBottom: i < breached.length - 1 ? `1px solid ${T.borderSubtle}` : 'none',
                    alignItems: 'center', cursor: 'pointer',
                    borderLeft: '2px solid transparent', transition: 'all 120ms ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.bgElevated; e.currentTarget.style.borderLeftColor = '#FF3B3B'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
                    onClick={() => window.location.href = `/incidents/${inc.incident_id}`}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 8 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 500, color: T.textPrimary,
                        fontFamily: 'PP Neue Montreal, system-ui, sans-serif',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{inc.title}</span>
                      <span style={{
                        fontSize: 10, color: T.textTertiary,
                        fontFamily: "'PP Neue Montreal Mono', monospace", letterSpacing: '0.04em',
                      }}>#{String(inc.incident_id).padStart(4,'0')}</span>
                    </div>
                    <span style={{
                      fontSize: 11, color: SEVERITY_COLORS[inc.severity] || T.textTertiary,
                      fontFamily: "'PP Neue Montreal Mono', monospace",
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: SEVERITY_COLORS[inc.severity],
                        boxShadow: `0 0 5px ${SEVERITY_COLORS[inc.severity]}`,
                      }} />
                      {inc.severity}
                    </span>
                    <span style={{
                      fontSize: 11, color: STATUS_COLORS[inc.status] || T.textTertiary,
                      fontFamily: "'PP Neue Montreal Mono', monospace", whiteSpace: 'nowrap',
                    }}>{inc.status}</span>
                    <span style={{ fontSize: 12, color: T.textSecondary, fontFamily: 'PP Neue Montreal, system-ui, sans-serif' }}>
                      {inc.asset_name || '—'}
                    </span>
                    <span style={{ fontSize: 11, color: '#FF3B3B', fontFamily: "'PP Neue Montreal Mono', monospace" }}>
                      {overdue !== null ? `+${overdue}m` : '—'}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </Card>

        {drill && <DrillModal title={drill.title} incidents={drill.incidents} onClose={() => setDrill(null)} />}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes skelPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </PageWrapper>
  );
}