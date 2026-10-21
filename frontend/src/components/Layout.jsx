import {
  Menu,
  X,
  LayoutDashboard,
  ScanSearch,
  ShieldCheck,
  Gamepad2,
  History,
  UserRound,
  LogOut,
  Users,
  Images,
  ClipboardCheck,
  FileBarChart2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const userItems = [
  ['modules', 'Modules', LayoutDashboard],
  ['detection', 'Deepfake Detection', ScanSearch],
  ['identity', 'Identity Guardian', ShieldCheck],
  ['games', 'Game Center', Gamepad2],
  ['history', 'History', History],
  ['profile', 'Profile', UserRound],
];

const adminItems = [
  ['admin-dashboard', 'Dashboard', LayoutDashboard],
  ['admin-users', 'Users', Users],
  ['admin-reports', 'Reports', FileBarChart2],
];

export function Brand({ compact = false }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <ShieldCheck size={compact ? 19 : 22} />
      </span>
      <span>
        DeepTrust <b>Academy</b>
      </span>
    </div>
  );
}

export function Sidebar({ page, go, admin = false, open, setOpen, notify }) {
  const { user, logout } = useAuth();
  const list = admin ? adminItems : userItems;

  const navigate = (id) => {
    go(id);
    if (setOpen) setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (notify) notify('You have been logged out.');
      go(admin ? 'admin-login' : 'landing');
    } catch {
      go('landing');
    }
  };

  return (
    <>
      <button className="mobile-menu" onClick={() => setOpen(true)}>
        <Menu />
      </button>

      <aside className={`sidebar ${open ? 'shown' : ''}`}>
        <div className="sidebar-top">
          <Brand />
          <button className="sidebar-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>

        <div className="area-label">{admin ? 'ADMIN CONSOLE' : 'USER SPACE'}</div>

        {user && (
          <div
            style={{
              padding: '0.75rem 1rem',
              margin: '0.25rem 0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  background:
                    user.role === 'ADMIN'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(6, 182, 212, 0.2)',
                  color: user.role === 'ADMIN' ? '#fca5a5' : '#67e8f9',
                  fontWeight: 600,
                  marginTop: '2px',
                }}
              >
                {user.role}
              </span>
            </div>
          </div>
        )}

        <nav>
          {list.map(([id, name, Icon]) => (
            <button
              className={page === id ? 'active' : ''}
              key={id}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {id === 'identity' && !admin && <i className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button onClick={handleLogout}>
            <LogOut size={19} />
            <span>Logout</span>
          </button>
          <small>© 2026 DeepTrust Academy</small>
        </div>
      </aside>

      {open && <div className="side-scrim" onClick={() => setOpen(false)} />}
    </>
  );
}

export default { Brand, Sidebar };
