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
      <div className="mb-6 flex gap-4">
        <input
          placeholder="Search title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="surface-input flex-1 max-w-md px-3 py-2"
        />
        <Link to="/incidents/new" className="btn-primary shrink-0">
          Report Incident
        </Link>
      </div>
      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : (
        <div className="overflow-x-auto surface-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-800 text-gray-400">
              <tr>
                <th className="px-4 py-3 label-caps">ID</th>
                <th className="px-4 py-3 label-caps">Title</th>
                <th className="px-4 py-3 label-caps">Severity</th>
                <th className="px-4 py-3 label-caps">Status</th>
                <th className="px-4 py-3 label-caps">Analyst</th>
                <th className="px-4 py-3 label-caps">SLA</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr
                  key={inc.incident_id}
                  className="border-t border-subtle hover:bg-gray-800/50 transition-colors duration-base"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/incidents/${inc.incident_id}`}
                      className="incident-id text-orange-400 hover:text-orange-300"
                    >
                      #{inc.incident_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-50">{inc.title}</td>
                  <td className="px-4 py-3">
                    <Badge className={severityColors[inc.severity]}>{inc.severity}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[inc.status]}>{inc.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-200">{inc.analyst_name || '—'}</td>
                  <td className="px-4 py-3">
                    {inc.sla_breached ? (
                      <span className="text-severity-critical font-medium text-sm">Breached</span>
                    ) : (
                      <span className="text-gray-500 text-sm">OK</span>
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
