import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PageWrapper from '../components/layout/PageWrapper';
import api from '../api/axiosInstance';

export default function Analytics() {
  const [threats, setThreats] = useState([]);
  const [sla, setSla] = useState(null);

  useEffect(() => {
    api.get('/analytics/threat-frequency').then((r) => setThreats(r.data.data || []));
    api.get('/analytics/sla-compliance').then((r) => setSla(r.data.data));
  }, []);

  return (
    <PageWrapper title="Analytics">
      <div className="bg-soc-panel border border-soc-border rounded-xl p-4 mb-6">
        <h3 className="text-white font-medium mb-4">Threat Frequency</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={threats.filter((t) => t.total > 0).slice(0, 12)}>
            <XAxis dataKey="threat_type" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
            <YAxis tick={{ fill: '#94a3b8' }} />
            <Tooltip />
            <Bar dataKey="total" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {sla?.by_severity && (
        <div className="bg-soc-panel border border-soc-border rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">SLA Compliance by Severity</h3>
          <ul className="space-y-2">
            {sla.by_severity.map((row) => (
              <li key={row.severity} className="flex justify-between text-sm text-slate-300">
                <span>{row.severity}</span>
                <span>{row.compliance_pct ?? 0}% ({row.total} incidents)</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageWrapper>
  );
}
