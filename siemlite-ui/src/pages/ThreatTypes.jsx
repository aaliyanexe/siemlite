import { useEffect, useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { listThreatTypes } from '../api/threatTypes.api';

export default function ThreatTypes() {
  const [types, setTypes] = useState([]);

  useEffect(() => {
    listThreatTypes().then((r) => setTypes(r.data || []));
  }, []);

  return (
    <PageWrapper title="Threat Types">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {types.map((t) => (
          <div
            key={t.threat_type_id}
            className={`bg-soc-panel border rounded-xl p-4 ${t.is_active ? 'border-soc-border' : 'border-slate-600 opacity-60'}`}
          >
            <h3 className="text-white font-medium">{t.name}</h3>
            <p className="text-slate-400 text-xs mt-1">{t.category} · Default: {t.severity_default}</p>
            <p className="text-slate-500 text-sm mt-2 line-clamp-2">{t.description}</p>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
