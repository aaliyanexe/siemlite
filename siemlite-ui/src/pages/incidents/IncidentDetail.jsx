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

  if (!incident) {
    return (
      <PageWrapper title="Incident">
        <p className="text-secondary">Loading...</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={`Incident #${id}`}>
      <Link to="/incidents" className="text-orange-400 text-sm hover:text-orange-300 mb-6 inline-block">
        ← Back
      </Link>
      <div className="flex gap-2 mb-6">
        {['details', 'timeline'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors duration-base ${
              tab === t ? 'bg-orange-500 text-gray-950' : 'btn-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'details' && (
        <div className="surface-card p-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge className={severityColors[incident.severity]}>{incident.severity}</Badge>
            <Badge className={statusColors[incident.status]}>{incident.status}</Badge>
            {incident.sla_breached && (
              <Badge className="bg-severity-critical-bg text-severity-critical border border-severity-critical-border">
                SLA Breached
              </Badge>
            )}
          </div>
          <h3 className="section-heading">{incident.title}</h3>
          <p className="body-text">{incident.description}</p>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="label-caps mb-1">Reporter</dt>
              <dd className="text-gray-50">{incident.reporter_name}</dd>
            </div>
            <div>
              <dt className="label-caps mb-1">Analyst</dt>
              <dd className="text-gray-50">{incident.analyst_name || 'Unassigned'}</dd>
            </div>
            <div>
              <dt className="label-caps mb-1">Threat</dt>
              <dd className="text-gray-50">{incident.threat_type}</dd>
            </div>
            <div>
              <dt className="label-caps mb-1">Asset</dt>
              <dd className="text-gray-50">{incident.asset_name}</dd>
            </div>
            <div>
              <dt className="label-caps mb-1">Reported</dt>
              <dd className="timestamp">{new Date(incident.date_reported).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="label-caps mb-1">SLA Deadline</dt>
              <dd className="timestamp">{new Date(incident.sla_deadline).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
      )}
      {tab === 'timeline' && (
        <ul className="space-y-3">
          {timeline.map((e) => (
            <li key={`${e.entry_type}-${e.entry_id}`} className="surface-card p-4">
              <div className="flex justify-between mb-2">
                <span className="label-caps">
                  {e.entry_type === 'log' ? e.action_type : e.response_action_type}
                </span>
                <span className="timestamp">{new Date(e.event_time).toLocaleString()}</span>
              </div>
              <p className="body-text">{e.action_description || e.new_value || '—'}</p>
              <p className="text-gray-400 text-xs mt-2 font-data">{e.actor_name}</p>
            </li>
          ))}
        </ul>
      )}
    </PageWrapper>
  );
}
