import { useEffect, useState } from 'react';
import PageWrapper from '../components/layout/PageWrapper';
import { listAssets } from '../api/assets.api';

export default function Assets() {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    listAssets({ limit: 50 }).then((r) => setAssets(r.data || []));
  }, []);

  return (
    <PageWrapper title="Assets">
      <div className="overflow-x-auto rounded-xl border border-soc-border">
        <table className="w-full text-sm">
          <thead className="bg-soc-panel text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Criticality</th>
              <th className="px-4 py-3 text-left">Department</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.asset_id} className="border-t border-soc-border">
                <td className="px-4 py-3 text-white">{a.asset_name}</td>
                <td className="px-4 py-3 text-slate-300">{a.asset_type}</td>
                <td className="px-4 py-3 text-slate-300">{a.criticality}</td>
                <td className="px-4 py-3 text-slate-300">{a.owner_department || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
