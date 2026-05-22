import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Badge from '../../components/ui/Badge';
import { listIncidents } from '../../api/incidents.api';
import { severityColors, statusColors } from '../../utils/severity';

export default function IncidentList() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listIncidents({ limit: 50, search: search || undefined })
      .then((res) => setIncidents(res.data || []))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <PageWrapper title="Incidents">
      <div className="mb-4 flex gap-4">
        <input
          placeholder="Search title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 rounded bg-soc-panel border border-soc-border text-white text-sm"
        />
        <Link
          to="/incidents/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium"
        >
          Report Incident
        </Link>
      </div>
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-soc-border">
          <table className="w-full text-sm text-left">
            <thead className="bg-soc-panel text-slate-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Analyst</th>
                <th className="px-4 py-3">SLA</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.incident_id} className="border-t border-soc-border hover:bg-soc-panel/50">
                  <td className="px-4 py-3">
                    <Link to={`/incidents/${inc.incident_id}`} className="text-blue-400 hover:underline">
                      #{inc.incident_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white">{inc.title}</td>
                  <td className="px-4 py-3">
                    <Badge className={severityColors[inc.severity]}>{inc.severity}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[inc.status]}>{inc.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{inc.analyst_name || '—'}</td>
                  <td className="px-4 py-3">
                    {inc.sla_breached ? (
                      <span className="text-red-400 font-medium">Breached</span>
                    ) : (
                      <span className="text-slate-400">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  );
}
