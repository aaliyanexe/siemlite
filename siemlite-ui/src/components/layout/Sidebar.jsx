import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const linkClass = ({ isActive }) =>
  `block px-4 py-2 rounded-lg text-sm ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-soc-panel'}`;

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  return (
    <aside className="w-56 bg-soc-panel border-r border-soc-border min-h-screen p-4 flex flex-col">
      <h1 className="text-lg font-bold text-white mb-6 px-2">SIEMlite</h1>
      <nav className="flex flex-col gap-1 flex-1">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/incidents" className={linkClass}>Incidents</NavLink>
        <NavLink to="/assets" className={linkClass}>Assets</NavLink>
        <NavLink to="/threat-types" className={linkClass}>Threat Types</NavLink>
        <NavLink to="/analytics" className={linkClass}>Analytics</NavLink>
        {isAdmin && (
          <>
            <NavLink to="/users" className={linkClass}>Users</NavLink>
            <NavLink to="/audit-log" className={linkClass}>Audit Log</NavLink>
          </>
        )}
      </nav>
      <div className="text-xs text-slate-400 px-2 pt-4 border-t border-soc-border">
        {user?.name} · {user?.role}
      </div>
    </aside>
  );
}
