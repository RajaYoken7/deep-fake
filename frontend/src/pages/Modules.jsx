import {
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  Gamepad2,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { Button, GlassCard, SectionHead } from '../components/UI';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const modules = [
  ['DEEPFAKE DETECTION', 'Check whether an image is real or AI-generated.', ScanSearch, 'cyan', 'detection'],
  ['IDENTITY GUARDIAN', 'Compare a suspicious image with your registered face.', Fingerprint, 'purple', 'identity'],
  ['GAME CENTER', 'Learn about deepfakes through interactive games.', Gamepad2, 'blue', 'games'],
];

export function Modules({ go, back }) {
  return (
    <div className="modules-page">
      <PublicNav go={go} />
      <main>
        <BackButton back={back} />
        <SectionHead
          eyebrow="YOUR DEEPTRUST JOURNEY"
          title="Explore DeepTrust Academy"
          copy="Choose a feature to continue."
        />
        <div className="module-grid">
          {modules.map(([title, copy, Icon, color, page]) => (
            <GlassCard className={`module-card ${color}`} key={title}>
              <div className="module-icon">
                <Icon />
              </div>
              <span className="eyebrow">{title}</span>
              <h2>
                {title === 'DEEPFAKE DETECTION' ? (
                  <>
                    Deepfake
                    <br />
                    Detection
                  </>
                ) : title === 'IDENTITY GUARDIAN' ? (
                  <>
                    Identity
                    <br />
                    Guardian
                  </>
                ) : (
                  'Game Center'
                )}
              </h2>
              <p>{copy}</p>
              <Button variant="secondary" onClick={() => go(page)}>
                Explore <ArrowRight size={16} />
              </Button>
            </GlassCard>
          ))}
        </div>
      </main>
    </div>
  );
}

export function PublicNav({ go }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const navigate = (page) => {
    setOpen(false);
    go(page);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    go('landing');
  };

  return (
    <header className={`public-nav ${open ? 'menu-open' : ''}`}>
      <BrandMark onClick={() => navigate('landing')} />
      <nav className="public-nav-links" aria-label="Main navigation">
        <button onClick={() => navigate('modules')}>Explore</button>
        <button onClick={() => navigate('detection')}>AI detection</button>
        <button onClick={() => navigate('identity')}>Identity</button>
        <button onClick={() => navigate('games')}>Learning</button>
        {isAuthenticated && <button onClick={() => navigate('history')}>History</button>}
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => navigate('admin-dashboard')}
            style={{ color: '#fca5a5', fontWeight: 600 }}
          >
            Admin Portal
          </button>
        )}
      </nav>

      <div className="public-nav-actions">
        <ThemeSwitcher />
        {isAuthenticated ? (
          <>
            <button
              className="profile-nav-icon"
              onClick={() => navigate('profile')}
              aria-label={`Open profile for ${user?.name || 'User'}`}
              title={user?.name ? `${user.name} (Profile)` : 'Profile'}
              style={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
                minHeight: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                fontSize: '15px',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                padding: 0,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {(user?.name?.trim()?.[0] || user?.email?.trim()?.[0] || 'U').toUpperCase()}
            </button>
            <Button variant="ghost" onClick={handleLogout} title="Logout">
              <LogOut size={16} /> Logout
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => navigate('login')}>
              Login
            </Button>
            <Button onClick={() => navigate('register')}>Get started</Button>
          </>
        )}
      </div>

      <button
        className="public-nav-toggle"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>

      {open && (
        <div className="public-mobile-links">
          {[
            ['modules', 'Explore'],
            ['detection', 'AI detection'],
            ['identity', 'Identity Guardian'],
            ['games', 'Game Center'],
            ...(isAuthenticated ? [['history', 'History'], ['profile', 'Profile']] : []),
            ...(user?.role === 'ADMIN' ? [['admin-dashboard', 'Admin Portal']] : []),
            ...(!isAuthenticated
              ? [
                  ['login', 'Login'],
                  ['register', 'Create account'],
                ]
              : []),
          ].map(([page, label]) => (
            <button key={page} onClick={() => navigate(page)}>
              {label}
            </button>
          ))}
          {isAuthenticated && (
            <button onClick={handleLogout} style={{ color: '#fca5a5' }}>
              Logout
            </button>
          )}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'center' }}>
            <ThemeSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}

export function BackButton({ back }) {
  return (
    <button className="back-button" onClick={back}>
      <ArrowLeft size={16} /> Back
    </button>
  );
}

function BrandMark({ onClick }) {
  return (
    <div className="brand" onClick={onClick} style={{ cursor: 'pointer' }}>
      <span className="brand-mark">
        <ShieldCheck size={22} />
      </span>
      <span>
        DeepTrust <b>Academy</b>
      </span>
    </div>
  );
}

export default { Modules, PublicNav, BackButton };
