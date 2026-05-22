import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuthStore } from '../store/authStore';
import { getAdminDashboard, getAnalystDashboard } from '../api/analytics.api';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#a855f7'];

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res =
          user?.role === 'Admin'
            ? await getAdminDashboard()
            : await getAnalystDashboard();
        setData(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.role]);

  if (loading) return <PageWrapper title="Dashboard"><p className="text-slate-400">Loading...</p></PageWrapper>;
  if (!data) return null;

  const isAdmin = user?.role === 'Admin';

  return (
    <PageWrapper title="Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {isAdmin ? (
          <>
            <StatCard label="Total Incidents" value={data.totals?.total_incidents} />
            <StatCard label="Open" value={data.totals?.open_incidents} />
            <StatCard label="Critical/High Open" value={data.totals?.critical_high_open} />
            <StatCard label="SLA Breached" value={data.totals?.sla_breached_count} highlight />
          </>
        ) : (
          <>
            <StatCard label="My Open" value={data.my_open_incidents} />
            <StatCard label="SLA Breached" value={data.my_sla_breached} highlight />
            <StatCard label="Resolved (Month)" value={data.my_resolved_this_month} />
          </>
        )}
      </div>

      {isAdmin && data.by_status && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-soc-panel border border-soc-border rounded-xl p-4">
            <h3 className="text-white font-medium mb-4">By Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.by_status} dataKey="total" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                  {data.by_status.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-soc-panel border border-soc-border rounded-xl p-4">
            <h3 className="text-white font-medium mb-4">Threat Frequency</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(data.threat_frequency || []).slice(0, 8)}>
                <XAxis dataKey="threat_type" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'border-red-500 bg-red-950/40' : 'border-soc-border bg-soc-panel'}`}>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-red-400' : 'text-white'}`}>{value ?? 0}</p>
    </div>
  );
}
