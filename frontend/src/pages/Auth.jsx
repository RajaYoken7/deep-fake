import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/UI';
import { Brand } from '../components/Layout';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useAuth } from '../contexts/AuthContext';

export function AuthPage({ mode, go, back, notify }) {
  const { login, register } = useAuth();

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Controlled form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isRegister = mode === 'register';
  const isAdmin = mode === 'admin-login';

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your password.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const data = await register(name, email, password);
        notify(`Welcome to DeepTrust Academy, ${data.user.name}!`);
        go('modules');
      } else if (isAdmin) {
        const data = await login(email, password);
        if (data.user.role !== 'ADMIN') {
          setError('Access denied: This account does not have administrator privileges.');
          return;
        }
        notify(`Welcome to the Admin Portal, ${data.user.name}.`);
        go('admin-dashboard');
      } else {
        const data = await login(email, password);
        notify(`Welcome back, ${data.user.name}!`);
        go(data.user.role === 'ADMIN' ? 'admin-dashboard' : 'modules');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', top: '22px', right: '24px', zIndex: 30 }}>
        <ThemeSwitcher />
      </div>
      <button className="back-home" onClick={back}>
        <ArrowLeft size={17} /> Back
      </button>

      <div className="auth-layout">
        <section className="auth-pitch">
          <Brand />
          <div>
            <span className="eyebrow">
              {isAdmin
                ? 'SECURE ADMIN PORTAL'
                : 'YOUR DIGITAL TRUST COMPANION'}
            </span>
            <h1>
              {isAdmin
                ? 'Manage a safer digital space.'
                : isRegister
                ? 'Start building digital confidence.'
                : 'Welcome back to the truth.'}
            </h1>
            <p>
              {isAdmin
                ? 'Access platform intelligence, manage activity and review content signals.'
                : 'Discover, protect and learn — all in one intelligent safety space.'}
            </p>
          </div>
          <div className="auth-orbit">
            <div className="orbit-ring" />
            <span className="orbit-icon">
              <ShieldCheck />
            </span>
            <i className="orbit-dot d1" />
            <i className="orbit-dot d2" />
            <div className="orbit-card">
              <BrainCircuit />
              <span>
                AI protection
                <br />
                <b>always learning</b>
              </span>
            </div>
          </div>
        </section>

        <section className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <Brand />
          </div>

          <form className="auth-card" onSubmit={submit}>
            <span className="eyebrow">
              {isAdmin
                ? 'ADMIN ACCESS'
                : isRegister
                ? 'CREATE ACCOUNT'
                : 'WELCOME BACK'}
            </span>
            <h2>
              {isAdmin
                ? 'Admin login'
                : isRegister
                ? 'Create your account'
                : 'Sign in to DeepTrust'}
            </h2>
            <p>
              {isRegister
                ? 'Begin your journey to a safer online world.'
                : 'Enter your details to continue.'}
            </p>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '1rem',
                }}
                role="alert"
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {isRegister && (
              <label className="field">
                <span>Name</span>
                <div>
                  <UserRound size={18} />
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </label>
            )}

            <label className="field">
              <span>Email</span>
              <div>
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </label>

            <label className="field">
              <span>Password</span>
              <div>
                <LockKeyhole size={18} />
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {isRegister && (
              <label className="field">
                <span>Confirm Password</span>
                <div>
                  <LockKeyhole size={18} />
                  <input
                    type={show ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </label>
            )}

            {!isRegister && !isAdmin && (
              <button
                type="button"
                className="text-link forgot"
                onClick={() => notify('Password reset link is delivered to registered addresses.')}
              >
                Forgot Password?
              </button>
            )}

            <Button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <span>Please wait...</span>
              ) : isRegister ? (
                <>
                  Create Account <ArrowRight size={17} />
                </>
              ) : isAdmin ? (
                <>
                  Admin Login <ArrowRight size={17} />
                </>
              ) : (
                <>
                  Login <ArrowRight size={17} />
                </>
              )}
            </Button>

            <div className="auth-switch">
              {isRegister ? 'Already have an account?' : 'New to DeepTrust?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  go(isRegister ? 'login' : 'register');
                }}
              >
                {isRegister ? 'Login' : 'Create Account'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
