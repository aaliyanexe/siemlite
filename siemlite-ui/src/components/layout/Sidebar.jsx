import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  ShieldAlert,
  Server,
  Bug,
  BarChart3,
  Users,
  ScrollText,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/incidents', label: 'Incidents', icon: ShieldAlert },
  { to: '/assets', label: 'Assets', icon: Server },
  { to: '/threat-types', label: 'Threat Types', icon: Bug },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const ADMIN_ITEMS = [
  { to: '/users', label: 'Users', icon: Users },
  { to: '/audit-log', label: 'Audit Log', icon: ScrollText },
];

function NavItem({ to, label, icon: Icon, end = false }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <span
          className="flex items-center rounded-md text-base font-medium cursor-pointer select-none"
          style={{
            gap: '12px',           /* spacing-3 */
            paddingTop: '10px',    /* spacing-2.5 */
            paddingBottom: '10px', /* spacing-2.5 */
            paddingRight: '12px',  /* spacing-3 */
            paddingLeft: '10px',   /* 8px + 2px border compensation */
            backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderLeft: isActive
              ? '2px solid var(--accent)'
              : '2px solid transparent',
            transition: 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={e => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.transform = 'translateX(2px)';
            }
          }}
          onMouseLeave={e => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.transform = 'translateX(0px)';
            }
          }}
        >
          <Icon
            size={15}
            strokeWidth={isActive ? 2 : 1.5}
            style={{
              color: isActive ? 'var(--accent)' : 'inherit',
              flexShrink: 0,
              transition: 'color 150ms ease',
            }}
          />
          <span style={{ flex: 1 }}>{label}</span>
          <ChevronRight
            size={12}
            style={{
              color: 'var(--accent)',
              opacity: isActive ? 0.6 : 0,
              transform: isActive ? 'translateX(0px)' : 'translateX(-4px)',
              transition:
                'opacity 150ms ease, transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  return (
    <aside
      className="shrink-0 min-h-screen flex flex-col"
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* ── Logo ─────────────────────────────── */}
      <div
        style={{
          padding: '16px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
        style={{
          position: 'relative',
          top: '2.5px',
          fontSize: '22px',      // text-lg — clean, not oversized
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--text-primary)',
        }}
      >
        SIEM<span style={{ color: 'var(--accent)' }}>lite</span>
      </span>
      </div>

      {/* ── Nav ──────────────────────────────── */}
      <nav
        style={{
          flex: 1,
          padding: '20px 12px',   /* spacing-5 spacing-3 */
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',             /* tighter than spacing-1 — intentional */
        }}
      >
        {/* Section label */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            padding: '0 12px',    /* spacing-3 */
            marginBottom: '8px',  /* spacing-2 */
          }}
        >
          Operations
        </p>

        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} end={item.to === '/dashboard'} />
        ))}

        {isAdmin && (
          <>
            {/* Divider */}
            <div
              style={{
                borderTop: '1px solid var(--border-subtle)',
                margin: '16px 0',   /* spacing-4 */
              }}
            />
            <p
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                padding: '0 12px',
                marginBottom: '8px',
              }}
            >
              Admin
            </p>
            {ADMIN_ITEMS.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* ── User footer ──────────────────────── */}
      <div
        style={{
          padding: '16px',        /* spacing-4 */
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',            /* spacing-3 */
          transition: 'background-color 150ms ease',
          cursor: 'default',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '32px',        /* spacing-8 */
            height: '32px',
            borderRadius: '9999px',
            backgroundColor: 'var(--bg-overlay)',
            color: 'var(--accent)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>

        {/* Name + role */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: '13px',   /* text-sm */
              fontWeight: 500,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name}
          </span>
          <span
            style={{
              fontFamily: "'PP Neue Montreal Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.role?.toUpperCase()}
          </span>
        </div>

        {/* Online indicator */}
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '9999px',
            backgroundColor: '#22C55E',
            boxShadow: '0 0 6px rgba(34,197,94,0.6)',
            flexShrink: 0,
          }}
        />
      </div>
    </aside>
  );
}