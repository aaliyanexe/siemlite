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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {types.map((t) => (
          <div
            key={t.threat_type_id}
            className={`surface-card p-4 ${!t.is_active ? 'opacity-50' : ''}`}
          >
            <h3 className="card-title">{t.name}</h3>
            <p className="text-secondary mt-2">
              {t.category} · Default: {t.severity_default}
            </p>
            <p className="text-gray-400 text-sm mt-3 line-clamp-2">{t.description}</p>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
