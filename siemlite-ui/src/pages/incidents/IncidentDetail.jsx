import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Badge from '../../components/ui/Badge';
import { getIncident, getTimeline } from '../../api/incidents.api';
import { severityColors, statusColors } from '../../utils/severity';

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    getIncident(id).then((r) => setIncident(r.data));
    getTimeline(id).then((r) => setTimeline(r.data || []));
  }, [id]);

  if (!incident) return <PageWrapper title="Incident"><p className="text-slate-400">Loading...</p></PageWrapper>;

  return (
    <PageWrapper title={`Incident #${id}`}>
      <Link to="/incidents" className="text-blue-400 text-sm hover:underline mb-4 inline-block">← Back</Link>
      <div className="flex gap-2 mb-6">
        {['details', 'timeline'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-soc-panel text-slate-300'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'details' && (
        <div className="bg-soc-panel border border-soc-border rounded-xl p-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge className={severityColors[incident.severity]}>{incident.severity}</Badge>
            <Badge className={statusColors[incident.status]}>{incident.status}</Badge>
            {incident.sla_breached && <Badge className="bg-red-600 text-white">SLA Breached</Badge>}
          </div>
          <h3 className="text-xl text-white font-semibold">{incident.title}</h3>
          <p className="text-slate-300">{incident.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-slate-500">Reporter</dt><dd className="text-white">{incident.reporter_name}</dd></div>
            <div><dt className="text-slate-500">Analyst</dt><dd className="text-white">{incident.analyst_name || 'Unassigned'}</dd></div>
            <div><dt className="text-slate-500">Threat</dt><dd className="text-white">{incident.threat_type}</dd></div>
            <div><dt className="text-slate-500">Asset</dt><dd className="text-white">{incident.asset_name}</dd></div>
            <div><dt className="text-slate-500">Reported</dt><dd className="text-white">{new Date(incident.date_reported).toLocaleString()}</dd></div>
            <div><dt className="text-slate-500">SLA Deadline</dt><dd className="text-white">{new Date(incident.sla_deadline).toLocaleString()}</dd></div>
          </dl>
        </div>
      )}
      {tab === 'timeline' && (
        <ul className="space-y-3">
          {timeline.map((e) => (
            <li key={`${e.entry_type}-${e.entry_id}`} className="bg-soc-panel border border-soc-border rounded-lg p-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{e.entry_type === 'log' ? e.action_type : e.response_action_type}</span>
                <span>{new Date(e.event_time).toLocaleString()}</span>
              </div>
              <p className="text-white text-sm">{e.action_description || e.new_value || '—'}</p>
              <p className="text-slate-400 text-xs mt-1">{e.actor_name}</p>
            </li>
          ))}
        </ul>
      )}
    </PageWrapper>
  );
}
