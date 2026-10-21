import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleUserRound,
  Fingerprint,
  Image,
  LockKeyhole,
  Menu,
  ScanLine,
  ShieldCheck,
  Sparkles,
  LogOut,
  X,
  Server,
  Database,
  KeyRound,
  Cpu,
  AlertTriangle,
  FileCheck,
  Search,
  Activity,
  UserCheck,
} from 'lucide-react';
import { Button, GlassCard } from '../components/UI';
import { Brand } from '../components/Layout';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Landing({ go }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const navigate = (page) => {
    setOpen(false);
    go(page);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div className="landing rich-home">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <header>
        <Brand />
        <nav className="landing-nav" aria-label="Main navigation">
          <button
            onClick={() =>
              document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            About
          </button>
          <button
            onClick={() =>
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            What We Built
          </button>
          <button
            onClick={() =>
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            How it Works
          </button>
          <button
            onClick={() =>
              document.getElementById('tech-stack')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Tech Stack
          </button>
          <button onClick={() => navigate('modules')}>Explore Tools</button>
        </nav>

        <div className="nav-actions">
          <ThemeSwitcher />
          {isAuthenticated ? (
            <>
              <button
                className="profile-nav-icon"
                onClick={() => navigate('profile')}
                aria-label="Open profile"
                title={user?.name || 'Profile'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  color: '#0284c7',
                }}
              >
                <CircleUserRound size={18} />
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name?.split(' ')[0] || 'Cadet'}
                </span>
              </button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('register')}>Get Started</Button>
            </>
          )}
        </div>

        <button
          className="landing-menu"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>

        {open && (
          <nav className="landing-mobile-links" aria-label="Mobile navigation">
            <button
              onClick={() => {
                setOpen(false);
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              About
            </button>
            <button
              onClick={() => {
                setOpen(false);
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              What We Built
            </button>
            <button
              onClick={() => {
                setOpen(false);
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How It Works
            </button>
            <button
              onClick={() => {
                setOpen(false);
                document.getElementById('tech-stack')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Tech Stack
            </button>
            <button onClick={() => navigate('modules')}>Explore Tools</button>
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate('profile')}>Profile</button>
                <button onClick={handleLogout} style={{ color: '#ef4444' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('login')}>Login</button>
                <button onClick={() => navigate('register')}>Create Account</button>
              </>
            )}
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'center' }}>
              <ThemeSwitcher />
            </div>
          </nav>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="home-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sparkles size={14} /> AI · DIGITAL TRUST · IDENTITY VERIFICATION
            </span>
            <h1>DeepTrust Academy</h1>
            <h2>
              Verify Authenticity.
              <br />
              <em>Safeguard Identity.</em>
            </h2>
            <p>
              An enterprise-grade digital trust platform engineered to detect AI-generated
              media, verify biometric identity against fraudulent impersonation, and foster digital
              awareness through interactive forensic tools.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button className="hero-main-button" onClick={() => go('modules')}>
                Explore Detection Tools <ArrowRight size={17} />
              </Button>
              <Button
                variant="secondary"
                className="hero-main-button"
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn How It Works
              </Button>
            </div>
          </div>
          <HomeVisual />
        </section>

        {/* Section A: Project Introduction */}
        <section id="about" className="content-section about-section">
          <span className="eyebrow">PROJECT INTRODUCTION</span>
          <h2>Authenticity in an Era of Synthetic Media</h2>
          <div className="section-copy">
            <p>
              <strong>DeepTrust Academy</strong> is an AI-powered verification platform designed
              to empower users and organizations to critically examine digital media for signs of
              AI generation, manipulation, and synthetic generation. By integrating specialized
              machine learning inference services, DeepTrust provides transparent probabilistic
              indicators rather than opaque black-box assertions.
            </p>
            <p>
              Beyond standalone deepfake image detection, the platform features{' '}
              <strong>Identity Guardian</strong>, an identity verification system that allows
              individuals to compare suspicious portrait media with verified reference photographs
              under strict privacy safeguards—guaranteeing zero persistence of raw biometric
              data or face embeddings.
            </p>
          </div>
        </section>

        {/* Section B: What We Have Built */}
        <section id="features" className="content-section">
          <span className="eyebrow">VERIFIED ARCHITECTURE</span>
          <h2>What We Have Built</h2>
          <p className="section-intro" style={{ maxWidth: '720px', margin: '0 0 28px' }}>
            Every capability in DeepTrust Academy is backed by active, verified full-stack
            implementations—from specialized computer vision APIs to cryptographic session handling.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <GlassCard>
              <span className="module-icon">
                <BrainCircuit size={22} />
              </span>
              <h3>Sightengine AI Image Detection</h3>
              <p>
                Direct integration with Sightengine's GenAI model. Analyzes pixel artifacts,
                compression discrepancies, and generation signatures to calculate a normalized
                AI score with explicit classification thresholds.
              </p>
            </GlassCard>

            <GlassCard>
              <span className="module-icon">
                <ShieldCheck size={22} />
              </span>
              <h3>Identity Guardian & Facial Verification</h3>
              <p>
                Dual-mode facial comparison powered by CompreFace. Supports ID Card photo verification
                against live selfies and reference portrait matching to detect identity theft without
                storing raw biometrics.
              </p>
            </GlassCard>

            <GlassCard>
              <span className="module-icon">
                <KeyRound size={22} />
              </span>
              <h3>Persistent 7-Day Session Security</h3>
              <p>
                State-of-the-art authentication lifecycle using 15-minute in-memory access tokens and
                7-day HttpOnly refresh cookies with cryptographic rotation, reuse detection, and device
                session management.
              </p>
            </GlassCard>

            <GlassCard>
              <span className="module-icon">
                <FileCheck size={22} />
              </span>
              <h3>User History & Forensic Reports</h3>
              <p>
                Personalized user history tracking of past image analyses and identity reports.
                Includes search, classification filters (Real, AI, Inconclusive), and report inspection modals.
              </p>
            </GlassCard>

            <GlassCard>
              <span className="module-icon">
                <Activity size={22} />
              </span>
              <h3>Admin Governance & Audit Trails</h3>
              <p>
                Role-based administrative console with live aggregate metrics, user account activation
                and suspension controls, and tamper-resistant administrative audit logging.
              </p>
            </GlassCard>

            <GlassCard>
              <span className="module-icon">
                <UserCheck size={22} />
              </span>
              <h3>Security & Session Dashboard</h3>
              <p>
                User profile control center to inspect all active device sessions, IP metadata, and
                browser footprints, with one-click revocation of individual devices or universal logout.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Section C: How It Works */}
        <section id="how-it-works" className="content-section">
          <span className="eyebrow">SYSTEM PIPELINE</span>
          <h2>How DeepTrust Verifies Digital Media</h2>
          <p className="section-intro" style={{ maxWidth: '720px', margin: '0 0 32px' }}>
            A rigorous 5-step technical pipeline processes digital media from upload to transparent decision delivery.
          </p>

          <div className="project-steps" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              ['01', 'File Validation', 'Client validates image MIME format (JPEG, PNG, WebP) and 10MB bounds before transmission.', Image],
              ['02', 'Secure Dispatch', 'Express backend validates session, checks rate limits, and buffers payload securely in memory.', Server],
              ['03', 'AI Inference', 'Sightengine inspects synthetic generator patterns; CompreFace extracts 512-d facial feature vectors.', BrainCircuit],
              ['04', 'Threshold Scoring', 'Scores are mapped against calibrated thresholds (≥0.80 AI, ≤0.20 Natural, 0.20–0.80 Inconclusive).', ScanLine],
              ['05', 'Audit & Reporting', 'Results logged to MongoDB; decision explanations and caveats returned to user without storing raw biometrics.', CheckCircle2],
            ].map(([step, title, text, Icon], i) => (
              <div className="project-step" key={title}>
                <span>{step}</span>
                <div className="step-icon">
                  <Icon size={20} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section D: Actual Technology Stack */}
        <section id="tech-stack" className="content-section">
          <span className="eyebrow">VERIFIED TECH STACK</span>
          <h2>Engineered with Modern Standards</h2>
          <p className="section-intro" style={{ maxWidth: '720px', margin: '0 0 28px' }}>
            DeepTrust Academy is built exclusively with verified, industry-standard technologies running across our codebase:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {[
              { title: 'React 18 & Vite', desc: 'Fast, modern reactive frontend with instant HMR and client-side routing.', icon: Cpu },
              { title: 'Node.js & Express.js', desc: 'RESTful API gateway with centralized error handling, CORS, and auth middleware.', icon: Server },
              { title: 'MongoDB Atlas & Mongoose', desc: 'Cloud document persistence with TTL automatic session expiration indexes.', icon: Database },
              { title: 'JWT & HttpOnly Cookies', desc: 'Dual-token auth lifecycle with SHA-256 refresh hashing and automatic rotation.', icon: KeyRound },
              { title: 'Sightengine API', desc: 'High-precision GenAI detection model analyzing generative image artifacts.', icon: BrainCircuit },
              { title: 'CompreFace Service', desc: 'Self-hosted or cloud facial recognition engine for biometric similarity matching.', icon: Fingerprint },
            ].map((tech) => (
              <GlassCard key={tech.title} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(2, 132, 199, 0.1)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--cyan)',
                    }}
                  >
                    <tech.icon size={20} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text)' }}>{tech.title}</h4>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6' }}>{tech.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Section E: Mission & Responsible AI */}
        <section className="identity-story">
          <div>
            <span className="eyebrow">PROJECT MISSION</span>
            <h2>Advancing Trust in Digital Media</h2>
            <p>
              As generative artificial intelligence matures, synthetic media is becoming indistinguishable
              from optical reality. Our mission with DeepTrust Academy is twofold: provide accessible forensic
              tools to identify AI-manipulated content, and equip people with the critical awareness needed to
              navigate digital information safely.
            </p>
            <p>
              We believe in <strong>responsible AI</strong>: automated detection tools are diagnostic aids that
              empower human judgment, not unilateral or infallible arbiters of truth.
            </p>
          </div>
          <div className="identity-flow">
            {[
              ['Digital Media Authenticity', Fingerprint],
              ['Synthetic Artifact Awareness', ShieldCheck],
              ['Biometric Identity Defense', LockKeyhole],
              ['Responsible Forensic Judgment', BrainCircuit],
              ['Public Digital Literacy', CheckCircle2],
            ].map(([text, Icon], i) => (
              <div key={text}>
                <span>
                  <Icon size={16} />
                </span>
                <b>{text}</b>
                {i < 4 && <i />}
              </div>
            ))}
          </div>
        </section>

        {/* Section F: Limitations and Transparency */}
        <section className="content-section" style={{ borderBottom: '1px solid var(--line)' }}>
          <div
            style={{
              padding: '28px',
              borderRadius: '18px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              gap: '20px',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#fef3c7',
                display: 'grid',
                placeItems: 'center',
                color: '#d97706',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#92400e', fontWeight: 700 }}>
                Transparency & Detection Limitations
              </h3>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#b45309', lineHeight: '1.7' }}>
                AI-generated image detection models evaluate probabilistic patterns and visual artifacts. They
                are not capable of absolute mathematical certainty. Factors such as heavy lossy compression,
                social media re-encoding, photographic grain, artistic filters, or post-processing can lead to
                <strong> false positives</strong> (real photos flagged as AI) or <strong>false negatives</strong>{' '}
                (AI images escaping detection).
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                Always correlate automated detection scores with contextual evidence, source provenance, and human forensic review.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta">
          <Sparkles size={28} />
          <h2>Ready to Verify Digital Content?</h2>
          <p>
            Upload an image to evaluate AI generation signatures, or use Identity Guardian to verify portrait media.
          </p>
          <Button onClick={() => go('modules')}>
            Analyze an Image <ArrowRight size={17} />
          </Button>
        </section>

        <footer>
          <Brand compact />
          <span>© DeepTrust Academy · Engineered for digital authenticity and media literacy.</span>
        </footer>
      </main>
    </div>
  );
}

function HomeVisual() {
  return (
    <div className="home-visual">
      <div className="scan-grid" />
      <div className="home-visual-card">
        <div className="visual-top">
          <span>
            <span className="live-dot" /> SIGHTENGINE ACTIVE
          </span>
          <span>READY</span>
        </div>
        <div className="abstract-image">
          <i className="scan-beam" />
          <div className="corner c1" />
          <div className="corner c2" />
          <div className="corner c3" />
          <div className="corner c4" />
        </div>
        <div className="visual-ready">
          <span className="result-icon">
            <ScanLine />
          </span>
          <div>
            <small>DEEPTRUST FORENSIC ENGINE</small>
            <strong>Dual-Vector Media Analysis</strong>
          </div>
          <LockKeyhole size={18} />
        </div>
      </div>
      <div className="floating-chip chip-one">
        <ShieldCheck size={16} /> Zero Raw Biometrics
      </div>
      <div className="floating-chip chip-two">
        <BrainCircuit size={16} /> GenAI Artifact Scan
      </div>
    </div>
  );
}

export default Landing;
