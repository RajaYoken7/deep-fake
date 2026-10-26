import { useState, useEffect } from 'react';
import { Toast } from './components/UI';
import { Landing } from './pages/Landing';
import { AuthPage } from './pages/Auth';
import { Modules } from './pages/Modules';
import { Detection, Games, Identity } from './pages/UserPages';
import { AdminArea, HistoryPage, ProfilePage } from './pages/EmptyPages';
import { DeepfakeDetectiveGame } from './features/game/DeepfakeDetectiveGame';
import { LeaderboardPage } from './features/game/LeaderboardPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ShieldCheck } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const validPages = [
    'landing',
    'modules',
    'detection',
    'identity',
    'games',
    'deepfake-detective',
    'leaderboard',
    'history',
    'profile',
    'admin-dashboard',
    'login',
    'register',
    'admin-login',
  ];

  const [page, setPage] = useState(() => {
    const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (pathSlug && validPages.includes(pathSlug)) {
      return pathSlug;
    }
    return sessionStorage.getItem('deeptrust_active_page') || 'landing';
  });
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState('');

  const notify = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  const go = (to) => {
    setHistory((items) => [...items, page]);
    setPage(to);
    sessionStorage.setItem('deeptrust_active_page', to);
    try {
      window.history.pushState({}, '', `/${to === 'landing' ? '' : to}`);
    } catch {
      // browser fallback
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setHistory((items) => {
      const previous = items.at(-1);
      const target = previous || 'landing';
      setPage(target);
      sessionStorage.setItem('deeptrust_active_page', target);
      try {
        window.history.pushState({}, '', `/${target === 'landing' ? '' : target}`);
      } catch {
        // browser fallback
      }
      return items.slice(0, -1);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const target = pathSlug && validPages.includes(pathSlug) ? pathSlug : 'landing';
      setPage(target);
      sessionStorage.setItem('deeptrust_active_page', target);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route protection enforcement
  const protectedPages = [
    'modules',
    'detection',
    'identity',
    'games',
    'deepfake-detective',
    'leaderboard',
    'history',
    'profile',
    'admin-dashboard',
  ];
  const adminPages = ['admin-dashboard'];

  useEffect(() => {
    if (isLoading) return;

    // Redirect unauthenticated users attempting to access protected pages
    if (!isAuthenticated && protectedPages.includes(page)) {
      notify('Please sign in to access this feature.');
      const target = page === 'admin-dashboard' ? 'admin-login' : 'login';
      setPage(target);
      sessionStorage.setItem('deeptrust_active_page', target);
      return;
    }

    // Role-based authorization for admin area
    if (isAuthenticated && adminPages.includes(page) && user?.role !== 'ADMIN') {
      notify('Access restricted to administrators.');
      setPage('modules');
      sessionStorage.setItem('deeptrust_active_page', 'modules');
      return;
    }

    // Redirect authenticated users trying to access login/register
    if (isAuthenticated && ['login', 'register'].includes(page)) {
      setPage('modules');
      sessionStorage.setItem('deeptrust_active_page', 'modules');
      return;
    }

    if (isAuthenticated && page === 'admin-login') {
      const target = user?.role === 'ADMIN' ? 'admin-dashboard' : 'modules';
      setPage(target);
      sessionStorage.setItem('deeptrust_active_page', target);
    }
  }, [page, isAuthenticated, isLoading, user]);

  // Loading Splash Screen while checking session
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
          color: '#0f172a',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '2.5rem 3rem',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              margin: '0 auto 20px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)',
              border: '1px solid #bae6fd',
              display: 'grid',
              placeItems: 'center',
              color: '#0284c7',
              boxShadow: '0 8px 20px rgba(2, 132, 199, 0.15)',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          >
            <ShieldCheck size={38} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.5px', color: '#0f172a' }}>
            DeepTrust <span style={{ color: '#0284c7' }}>Academy</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  let content;
  if (page === 'landing') {
    content = <Landing go={go} />;
  } else if (['login', 'register', 'admin-login'].includes(page)) {
    content = <AuthPage mode={page} go={go} back={back} notify={notify} />;
  } else {
    const pages = {
      modules: <Modules go={go} back={back} />,
      detection: <Detection notify={notify} go={go} back={back} />,
      identity: <Identity notify={notify} go={go} back={back} />,
      games: <Games go={go} back={back} />,
      'deepfake-detective': <DeepfakeDetectiveGame go={go} back={back} notify={notify} />,
      leaderboard: <LeaderboardPage go={go} back={back} notify={notify} />,
      history: <HistoryPage go={go} back={back} />,
      profile: <ProfilePage go={go} back={back} notify={notify} />,
      'admin-dashboard': <AdminArea go={go} back={back} notify={notify} />,
    };
    content = pages[page] || <Landing go={go} />;
  }

  return (
    <>
      {content}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
