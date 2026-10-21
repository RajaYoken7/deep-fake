import { useState, useEffect } from 'react';
import { Toast } from './components/UI';
import { Landing } from './pages/Landing';
import { AuthPage } from './pages/Auth';
import { Modules } from './pages/Modules';
import { Detection, Games, Identity } from './pages/UserPages';
import { AdminArea, HistoryPage, ProfilePage } from './pages/EmptyPages';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShieldCheck } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [page, setPage] = useState('landing');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState('');

  const notify = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 3500);
  };

  const go = (to) => {
    setHistory((items) => [...items, page]);
    setPage(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setHistory((items) => {
      const previous = items.at(-1);
      if (previous) setPage(previous);
      else setPage('landing');
      return items.slice(0, -1);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route protection enforcement
  const protectedPages = ['modules', 'detection', 'identity', 'games', 'history', 'profile', 'admin-dashboard'];
  const adminPages = ['admin-dashboard'];

  useEffect(() => {
    if (isLoading) return;

    // Redirect unauthenticated users attempting to access protected pages
    if (!isAuthenticated && protectedPages.includes(page)) {
      notify('Please sign in to access this feature.');
      setPage(page === 'admin-dashboard' ? 'admin-login' : 'login');
      return;
    }

    // Role-based authorization for admin area
    if (isAuthenticated && adminPages.includes(page) && user?.role !== 'ADMIN') {
      notify('Access restricted to administrators.');
      setPage('modules');
      return;
    }

    // Redirect authenticated users trying to access login/register
    if (isAuthenticated && ['login', 'register'].includes(page)) {
      setPage('modules');
      return;
    }

    if (isAuthenticated && page === 'admin-login') {
      setPage(user?.role === 'ADMIN' ? 'admin-dashboard' : 'modules');
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
          background: '#040b17',
          color: '#e2e8f0',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 18px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'grid',
              placeItems: 'center',
              color: '#67e8f9',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.3)',
            }}
          >
            <ShieldCheck size={36} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
            DeepTrust <b style={{ color: '#67e8f9' }}>Academy</b>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
