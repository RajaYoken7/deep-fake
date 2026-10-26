import { useState, useEffect, useMemo } from 'react';
import {
  Camera,
  FileClock,
  Gamepad2,
  Image,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  Target,
  UserRound,
  Users,
  X,
  KeyRound,
  ShieldAlert,
  CheckCircle,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Trash2,
  Laptop,
  Smartphone,
  Globe,
  Search,
  Filter,
  Shield,
  Info,
  AlertCircle,
  Eye,
  LogOut,
  Trophy,
  Award,
  Flame,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button, GlassCard, SectionHead } from '../components/UI';
import { BackButton, PublicNav } from './Modules';
import { useAuth } from '../contexts/AuthContext';
import { getUserGameStats } from '../features/game/services/gameApi';
import {
  updateUserProfile,
  changeUserPassword,
  getUserHistory,
  deleteDetectionRecord,
  getUserStats,
  getUserSessions,
  revokeSession,
  logoutOtherSessions,
  getAdminOverview,
  getAdminUsers,
  toggleAdminUserStatus,
  getAdminAuditLogs,
} from '../services/userService';

/**
 * User History Page
 * Displays authenticated user's own deepfake detections and identity verifications
 * with search, filtering, report modal inspection, and report deletion.
 */
export function HistoryPage({ go, back, notify }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState({ detections: [], identityReports: [] });
  const [activeTab, setActiveTab] = useState('detections');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassification, setFilterClassification] = useState('ALL');
  const [inspectModal, setInspectModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchHistory() {
      try {
        const data = await getUserHistory();
        if (active) {
          setHistory(data);
        }
      } catch {
        // Fallback to empty history
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchHistory();
    return () => {
      active = false;
    };
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getClassificationBadge = (classification) => {
    switch (classification) {
      case 'AI_GENERATED':
        return (
          <span
            style={{
              color: '#ffffff', background: '#000000', border: '1px solid #000000',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            AI-GENERATED
          </span>
        );
      case 'NOT_AI_GENERATED':
        return (
          <span
            style={{
              color: '#000000', background: '#ffffff', border: '1px solid #000000',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            REAL / NOT AI
          </span>
        );
      default:
        return (
          <span
            style={{
              color: '#000000', background: '#ffffff', border: '1px dashed #000000',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            INCONCLUSIVE
          </span>
        );
    }
  };

  const handleDeleteRecord = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this detection record?')) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteDetectionRecord(id);
      setHistory((prev) => ({
        ...prev,
        detections: prev.detections.filter((d) => d.id !== id),
      }));
      if (inspectModal?.id === id) {
        setInspectModal(null);
      }
      if (notify) notify('Detection report deleted successfully.');
    } catch (err) {
      if (notify) notify(err.message || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered detections based on search & classification
  const filteredDetections = useMemo(() => {
    return history.detections.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClassification =
        filterClassification === 'ALL' || item.classification === filterClassification;

      return matchesSearch && matchesClassification;
    });
  }, [history.detections, searchQuery, filterClassification]);

  return (
    <Shell go={go} back={back}>
      <SectionHead
        eyebrow="YOUR ACTIVITY"
        title="Personal Verification History"
        copy="Review, filter, inspect, and manage your past AI-generated image checks and biometric identity reports."
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <Button
          variant={activeTab === 'detections' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('detections')}
        >
          <Camera size={16} /> Deepfake Checks ({history.detections.length})
        </Button>
        <Button
          variant={activeTab === 'identity' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('identity')}
        >
          <ShieldCheck size={16} /> Identity Verifications ({history.identityReports.length})
        </Button>
      </div>

      {activeTab === 'detections' && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: '#ffffff',
              border: '1px solid var(--line)',
              borderRadius: '10px',
              width: 'min(360px, 100%)',
              
            }}
          >
            <Search size={16} color="var(--muted)" />
            <input
              type="text"
              placeholder="Search by filename or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '13px',
                color: 'var(--text)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Classification Filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              ['ALL', 'All'],
              ['AI_GENERATED', 'AI-Generated'],
              ['NOT_AI_GENERATED', 'Real / Not AI'],
              ['INCONCLUSIVE', 'Inconclusive'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterClassification(val)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: filterClassification === val ? '1px solid var(--cyan)' : '1px solid var(--line)',
                  background: filterClassification === val ? '#000000' : '#ffffff',
                  color: filterClassification === val ? '#ffffff' : '#000000',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#000000' }}>
          Loading your history records...
        </div>
      ) : activeTab === 'detections' ? (
        filteredDetections.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredDetections.map((item) => (
              <GlassCard
                key={item.id}
                onClick={() => setInspectModal(item)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  flexWrap: 'wrap',
                  gap: '14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#000000', color: '#ffffff',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--cyan)',
                      flexShrink: 0,
                    }}
                  >
                    <ScanSearch size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontWeight: 650 }}>
                      {item.fileName}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {formatDate(item.createdAt)} · Sightengine GenAI
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
                  {item.score !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block' }}>
                        AI Score
                      </span>
                      <strong style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 700 }}>
                        {(item.score * 100).toFixed(1)}%
                      </strong>
                    </div>
                  )}
                  {getClassificationBadge(item.classification)}

                  <button
                    onClick={(e) => handleDeleteRecord(item.id, e)}
                    disabled={deletingId === item.id}
                    title="Delete record"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#000000',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                      display: 'grid',
                      placeItems: 'center',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#000000')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#000000')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="empty-grid">
            <Empty
              icon={Camera}
              title="No Matching Detection Records"
              text={
                searchQuery || filterClassification !== 'ALL'
                  ? 'No results matched your search or classification filter.'
                  : "You haven't analyzed any images yet. Head over to Deepfake Detection to test your first image."
              }
            />
          </div>
        )
      ) : history.identityReports.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {history.identityReports.map((item) => (
            <GlassCard
              key={item.reportId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#000000', color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--purple)',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text)', fontWeight: 650 }}>
                    {item.reportId}
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {formatDate(item.createdAt)} ·{' '}
                    {item.verificationType === 'id_photo_verification'
                      ? 'ID Card Verification'
                      : 'AI Face Comparison'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {item.similarityScore !== null && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block' }}>
                      Similarity
                    </span>
                    <strong style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 700 }}>
                      {item.similarityScore.toFixed(1)}%
                    </strong>
                  </div>
                )}
                <span
                  style={{
                    color:
                      item.decision === 'LIKELY SAME PERSON' || item.decision === 'SAME PERSON' ? '#ffffff' : '#000000',
                    background:
                      item.decision === 'LIKELY SAME PERSON' || item.decision === 'SAME PERSON' ? '#000000' : '#ffffff',
                    border:
                      '1px solid #000000',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {item.decision || item.status.toUpperCase()}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="empty-grid">
          <Empty
            icon={ShieldCheck}
            title="No Identity Verifications"
            text="No identity comparisons performed yet. Use Identity Guardian to verify portrait photos."
          />
        </div>
      )}

      {/* Report Inspection Modal */}
      {inspectModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '540px' }}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setInspectModal(null)}
            >
              <X />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#000000', color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--cyan)',
                }}
              >
                <ScanSearch size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
                  Detection Report Details
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  ID: {inspectModal.id}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px', margin: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>File Name</span>
                <strong style={{ color: 'var(--text)', fontSize: '13px' }}>{inspectModal.fileName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Analyzed At</span>
                <strong style={{ color: 'var(--text)', fontSize: '13px' }}>{formatDate(inspectModal.createdAt)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>AI Model Score</span>
                <strong style={{ color: 'var(--text)', fontSize: '15px' }}>
                  {inspectModal.score !== null ? (inspectModal.score * 100).toFixed(2) + '%' : 'N/A'}{' '}
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'normal' }}>
                    ({inspectModal.score?.toFixed(4)})
                  </span>
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Classification</span>
                {getClassificationBadge(inspectModal.classification)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Provider</span>
                <strong style={{ color: 'var(--text)', fontSize: '13px' }}>Sightengine GenAI Engine</strong>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid var(--line)',
                fontSize: '12px',
                color: 'var(--muted)',
                lineHeight: '1.6',
                marginBottom: '20px',
              }}
            >
              <strong>Threshold Policy:</strong> Scores ≥ 0.80 indicate strong synthetic indicators; scores ≤ 0.20 indicate natural imagery; intermediate scores are inconclusive.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <Button
                variant="secondary"
                onClick={(e) => handleDeleteRecord(inspectModal.id, e)}
                style={{ color: '#000000', borderColor: '#000000' }}
              >
                <Trash2 size={16} /> Delete Report
              </Button>
              <Button onClick={() => setInspectModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

/**
 * User Profile Page
 * Displays authenticated user's profile, editable details, password change, stats,
 * and the Security & Session Dashboard (Feature A).
 */
export function ProfilePage({ go, back, notify }) {
  const { user, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'game' | 'sessions'
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [stats, setStats] = useState({ detections: 0, identityChecks: 0, missions: 0, games: 0 });
  const [gameStats, setGameStats] = useState(null);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  // Profile edit draft
  const [draftName, setDraftName] = useState(user?.name || '');
  const [draftEmail, setDraftEmail] = useState(user?.email || '');
  const [draftBio, setDraftBio] = useState(user?.bio || '');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Password change draft
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDraftName(user.name || '');
      setDraftEmail(user.email || '');
      setDraftBio(user.bio || '');
    }
    async function loadStats() {
      try {
        const data = await getUserStats();
        setStats(data);
      } catch {
        // Fallback
      }
    }
    async function loadGameStatsData() {
      try {
        const gData = await getUserGameStats();
        setGameStats(gData);
      } catch {
        // Fallback
      }
    }
    loadStats();
    loadGameStatsData();
  }, [user]);

  // Load sessions when switching to sessions tab
  useEffect(() => {
    if (activeTab === 'sessions') {
      loadSessions();
    }
  }, [activeTab]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const sessionList = await getUserSessions();
      setSessions(sessionList);
    } catch (err) {
      if (notify) notify('Could not load active sessions.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (notify) notify('Session revoked successfully.');
    } catch (err) {
      if (notify) notify(err.message || 'Failed to revoke session.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutOtherSessions = async () => {
    if (!window.confirm('Are you sure you want to log out all other devices?')) return;
    setRevokingOthers(true);
    try {
      await logoutOtherSessions();
      await loadSessions();
      if (notify) notify('Logged out of all other devices successfully.');
    } catch (err) {
      if (notify) notify(err.message || 'Failed to log out other devices.');
    } finally {
      setRevokingOthers(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSaving(true);

    try {
      const updated = await updateUserProfile({
        name: draftName,
        email: draftEmail,
        bio: draftBio,
      });
      updateUser(updated);
      setEditing(false);
      if (notify) notify('Profile updated successfully.');
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setEditSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdSaving(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (notify) notify('Password changed successfully. Please log in with your new password.');
      await logout();
      go('login');
    } catch (err) {
      setPwdError(err.message || 'Failed to change password.');
    } finally {
      setPwdSaving(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Not available';
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Shell go={go} back={back}>
      <div className="profile-breadcrumb" style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '18px' }}>
        DeepTrust Academy <span style={{ color: 'var(--cyan)' }}>/</span> Profile
      </div>

      <GlassCard className="profile-hero-card" style={{ marginBottom: '22px' }}>
        <div className="profile-large-avatar" style={{ background: '#000000', border: '1px solid #000000' }}>
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" />
          ) : (
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserRound />}
            </span>
          )}
        </div>

        <div className="profile-hero-copy">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>{user?.name || 'Cadet'}</h1>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '6px',
                background:
                  user?.role === 'ADMIN' ? '#000000' : '#ffffff',
                color: user?.role === 'ADMIN' ? '#ffffff' : '#000000',
                fontWeight: 700,
              }}
            >
              {user?.role || 'USER'}
            </span>
          </div>
          <p style={{ margin: '6px 0', color: 'var(--muted)', fontSize: '13px' }}>
            {user?.bio || 'Trust & Verification Cadet at DeepTrust Academy'}
          </p>
          <span style={{ fontSize: '12px', color: '#000000' }}>{user?.email}</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button onClick={() => setEditing(true)}>Edit Profile</Button>
          <Button variant="secondary" onClick={() => setChangingPassword(true)}>
            <KeyRound size={16} /> Change Password
          </Button>
        </div>
      </GlassCard>

      {/* Tabs: Overview vs Active Sessions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Button
          variant={activeTab === 'overview' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('overview')}
        >
          <UserRound size={16} /> Profile Overview
        </Button>
        <Button
          variant={activeTab === 'game' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('game')}
        >
          <Gamepad2 size={16} /> Game Statistics
        </Button>
        <Button
          variant={activeTab === 'sessions' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('sessions')}
        >
          <Laptop size={16} /> Active Sessions & Device Security
        </Button>
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="profile-summary-grid">
            <Summary
              icon={ScanSearch}
              title="Deepfake Checks"
              count={stats.detections}
              note="Images Checked"
              color="cyan"
            />
            <Summary
              icon={ShieldCheck}
              title="Identity Checks"
              count={stats.identityChecks}
              note="Identity Verifications"
              color="purple"
            />
            <Summary
              icon={Target}
              title="Missions"
              count={stats.missions}
              note="Missions Completed"
              color="blue"
            />
            <Summary
              icon={Gamepad2}
              title="Games"
              count={stats.games}
              note="Games Completed"
              color="green"
            />
          </div>

          <div className="profile-content-grid" style={{ marginTop: '20px' }}>
            <GlassCard className="profile-content-card identity-card">
              <div>
                <span className="module-icon">
                  <ShieldCheck />
                </span>
                <h3>Identity Guardian</h3>
                <p>Your biometric security records and identity protection state.</p>
              </div>
              <div className="profile-empty-details">
                <span>
                  Identity Status<b>Protected</b>
                </span>
                <span>
                  Total Verifications<b>{stats.identityChecks}</b>
                </span>
                <span>
                  Privacy Guarantee<b>Zero Raw Biometrics Stored</b>
                </span>
              </div>
              <Button variant="secondary" onClick={() => go('identity')}>
                Open Identity Guardian
              </Button>
            </GlassCard>

            <GlassCard className="profile-content-card">
              <span className="module-icon purple">
                <ScanSearch />
              </span>
              <h3>Detection Activity</h3>
              <p>You have conducted {stats.detections} AI-generated image analyses.</p>
              <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                <Button variant="secondary" onClick={() => go('history')}>
                  View Full History
                </Button>
              </div>
            </GlassCard>
            <GlassCard className="profile-content-card">
              <span className="module-icon" style={{ background: '#ffffff', color: '#000000' }}>
                <Gamepad2 />
              </span>
              <h3>Deepfake Detective</h3>
              <p>
                {gameStats?.currentRank || 'Bronze Detective'} · Level {gameStats?.currentLevel || 1}
              </p>
              <div className="profile-empty-details" style={{ margin: '12px 0' }}>
                <span>
                  Total XP<b>{(gameStats?.totalXP || 0).toLocaleString()} XP</b>
                </span>
                <span>
                  Accuracy<b>{gameStats?.accuracy || 0}%</b>
                </span>
                <span>
                  Winning Streak<b>🔥 {gameStats?.currentStreak || 0}</b>
                </span>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button onClick={() => go('deepfake-detective')}>Play Detective</Button>
                <Button variant="secondary" onClick={() => setActiveTab('game')}>Game Stats</Button>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="account-info-card" style={{ marginTop: '20px' }}>
            <h3>Account Information</h3>
            <span>
              Email<b>{user?.email}</b>
            </span>
            <span>
              Account Status<b>{user?.isActive ? 'Active' : 'Inactive'}</b>
            </span>
            <span>
              Account Created<b>{formatDate(user?.createdAt)}</b>
            </span>
            <span>
              Last Login<b>{formatDate(user?.lastLogin)}</b>
            </span>
          </GlassCard>
        </>
      ) : activeTab === 'game' ? (
        /* Section 7: Deepfake Detective Game Statistics Dashboard */
        <div>
          <GlassCard style={{ padding: '24px 28px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '18px',
                    background: '#000000', border: '1px solid #000000',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '34px',
                    boxShadow: 'none',
                  }}
                >
                  {gameStats?.levelInfo?.badge || '🕵️'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{gameStats?.currentRank || 'Bronze Detective'}</h2>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: '#000000', color: '#ffffff', fontWeight: 800, border: '1px solid #000000' }}>
                      LEVEL {gameStats?.currentLevel || 1}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
                    Title: <strong>{gameStats?.levelInfo?.title || 'Beginner'}</strong> · {(gameStats?.totalXP || 0).toLocaleString()} Total XP
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button onClick={() => go('deepfake-detective')}>
                  <Gamepad2 size={16} /> Play Detective
                </Button>
                <Button variant="secondary" onClick={() => go('leaderboard')}>
                  <Trophy size={16} /> Leaderboard
                </Button>
              </div>
            </div>

            {/* Level Progress */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ color: 'var(--cyan)' }}>Level Progress ({gameStats?.levelInfo?.progressPercent || 0}%)</span>
                <span style={{ color: 'var(--muted)' }}>
                  {gameStats?.levelInfo?.xpNeededForNext > 0
                    ? `${gameStats.levelInfo.xpNeededForNext.toLocaleString()} XP to Level ${(gameStats?.currentLevel || 1) + 1}`
                    : 'DeepTrust Legend (Max Level)'}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: '#000000', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${gameStats?.levelInfo?.progressPercent || 0}%`,
                    height: '100%',
                    background: '#000000',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          </GlassCard>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '22px' }}>
            <GlassCard style={{ padding: '18px 20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL XP</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#000000', marginTop: '4px' }}>
                {(gameStats?.totalXP || 0).toLocaleString()} XP
              </div>
            </GlassCard>

            <GlassCard style={{ padding: '18px 20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>ACCURACY</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#000000', marginTop: '4px' }}>
                {gameStats?.accuracy || 0}%
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Decisive predictions only</span>
            </GlassCard>

            <GlassCard style={{ padding: '18px 20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>GLOBAL LEADERBOARD</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#000000', marginTop: '4px' }}>
                #{gameStats?.leaderboardPosition || '--'}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Global ranking</span>
            </GlassCard>

            <GlassCard style={{ padding: '18px 20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>WINNING STREAK</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#000000', marginTop: '4px' }}>
                🔥 {gameStats?.currentStreak || 0}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Highest: {gameStats?.highestStreak || 0} consecutive</span>
            </GlassCard>
          </div>

          {/* Forensic Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <GlassCard style={{ padding: '22px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>Analysis Statistics</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #000000' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Total Games Played</span>
                  <strong style={{ fontSize: '14px' }}>{gameStats?.gamesPlayed || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #000000' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Total Images Analysed</span>
                  <strong style={{ fontSize: '14px' }}>{gameStats?.totalAttempts || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #000000' }}>
                  <span style={{ color: '#000000', fontSize: '13px' }}>Correct Predictions</span>
                  <strong style={{ fontSize: '14px', color: '#000000' }}>{gameStats?.correctAnswers || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #000000' }}>
                  <span style={{ color: '#000000', fontSize: '13px' }}>Incorrect Predictions</span>
                  <strong style={{ fontSize: '14px', color: '#000000' }}>{gameStats?.incorrectAnswers || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#000000', fontSize: '13px' }}>Inconclusive Results</span>
                  <strong style={{ fontSize: '14px', color: '#000000' }}>{gameStats?.inconclusiveAnswers || 0}</strong>
                </div>
              </div>
            </GlassCard>

            <GlassCard style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Forensic Badges</h3>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700 }}>
                  {gameStats?.totalAchievementsUnlocked || 0} / 8 Unlocked
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {(gameStats?.achievements || []).map((ach) => (
                  <div
                    key={ach.id}
                    title={`${ach.name}: ${ach.description} (${ach.isUnlocked ? 'Unlocked' : 'Locked'})`}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '12px',
                      background: ach.isUnlocked ? '#000000' : '#ffffff',
                      border: '1px solid',
                      borderColor: '#000000',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '22px',
                      opacity: ach.isUnlocked ? 1 : 0.4,
                      cursor: 'pointer',
                    }}
                  >
                    {ach.badge || '🎖️'}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        /* Feature A: Security & Session Dashboard */
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>
                Active Browser & Device Sessions
              </h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
                Manage all devices currently signed in to your DeepTrust Academy account.
              </p>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="secondary"
                onClick={handleLogoutOtherSessions}
                disabled={revokingOthers}
                style={{ color: '#000000', borderColor: '#000000' }}
              >
                <LogOut size={16} /> {revokingOthers ? 'Logging out...' : 'Log Out All Other Devices'}
              </Button>
            )}
          </div>

          {loadingSessions ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              Loading active sessions...
            </div>
          ) : sessions.length > 0 ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              {sessions.map((sess) => (
                <GlassCard
                  key={sess.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 22px',
                    flexWrap: 'wrap',
                    gap: '14px',
                    borderColor: '#000000',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: sess.isCurrent ? '#000000' : '#ffffff', border: '1px solid #000000',
                        display: 'grid',
                        placeItems: 'center',
                        color: sess.isCurrent ? '#ffffff' : '#000000',
                      }}
                    >
                      <Laptop size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--text)' }}>
                          {sess.deviceInfo || 'Browser Session'}
                        </strong>
                        {sess.isCurrent && (
                          <span
                            style={{
                              background: '#000000', color: '#ffffff', border: '1px solid #000000',
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                            }}
                          >
                            Current Device
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
                        IP: {sess.ipAddress || 'Unknown IP'} · Created {new Date(sess.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      Last active: {new Date(sess.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!sess.isCurrent && (
                      <Button
                        variant="secondary"
                        onClick={() => handleRevokeSession(sess.id)}
                        disabled={revokingId === sess.id}
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                      >
                        {revokingId === sess.id ? 'Revoking...' : 'Revoke'}
                      </Button>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="empty-grid">
              <Empty
                icon={Laptop}
                title="No Active Sessions"
                text="Unable to locate active sessions."
              />
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {editing && (
        <div className="profile-modal-overlay">
          <form className="profile-modal" onSubmit={saveProfile}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setEditing(false)}
            >
              <X />
            </button>
            <h2>Edit Profile</h2>

            {editError && (
              <div
                style={{
                  color: '#000000', background: '#ffffff', border: '1px solid #000000',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '12px',
                }}
              >
                {editError}
              </div>
            )}

            <label>
              Full Name
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Your Name"
                required
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </label>

            <label>
              Short Bio
              <textarea
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                placeholder="Describe your role or security interests..."
              />
            </label>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(false)}
                disabled={editSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Modal */}
      {changingPassword && (
        <div className="profile-modal-overlay">
          <form className="profile-modal" onSubmit={handlePasswordChange}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setChangingPassword(false)}
            >
              <X />
            </button>
            <h2>Change Password</h2>

            {pwdError && (
              <div
                style={{
                  color: '#000000', background: '#ffffff', border: '1px solid #000000',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '12px',
                }}
              >
                {pwdError}
              </div>
            )}

            <label>
              Current Password
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            <label>
              New Password (min 8 characters)
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setChangingPassword(false)}
                disabled={pwdSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pwdSaving}>
                {pwdSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Shell>
  );
}

/**
 * Admin Area Component
 * Live Admin Dashboard, User Management, and Feature E: Admin Activity & Audit Logs
 */
export function AdminArea({ go, back, notify }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview'); // 'overview' | 'users' | 'audit_logs'
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [statusToggling, setStatusToggling] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadAdminData() {
      try {
        const [overviewData, usersList, logsList] = await Promise.all([
          getAdminOverview(),
          getAdminUsers(),
          getAdminAuditLogs().catch(() => []),
        ]);
        if (active) {
          setOverview(overviewData);
          setUsers(usersList);
          setAuditLogs(logsList);
        }
      } catch (err) {
        if (notify) notify('Could not load administrative data.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAdminData();
    return () => {
      active = false;
    };
  }, []);

  const handleToggleStatus = async (targetUser) => {
    setStatusToggling(targetUser.id);
    try {
      const updated = await toggleAdminUserStatus(targetUser.id, !targetUser.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: updated.isActive } : u))
      );
      // Reload audit logs to reflect the action
      getAdminAuditLogs().then((logs) => setAuditLogs(logs)).catch(() => {});
      if (notify)
        notify(`User ${updated.name} has been ${updated.isActive ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to update user status.');
    } finally {
      setStatusToggling(null);
    }
  };

  return (
    <Shell go={go} back={back}>
      <SectionHead
        eyebrow="ADMINISTRATION CONSOLE"
        title="Admin Management Hub"
        copy="Manage platform users, inspect security audit trails, and monitor platform integrity."
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Button
          variant={tab === 'overview' ? 'primary' : 'secondary'}
          onClick={() => setTab('overview')}
        >
          <Users size={16} /> Overview
        </Button>
        <Button
          variant={tab === 'users' ? 'primary' : 'secondary'}
          onClick={() => setTab('users')}
        >
          <UserRound size={16} /> Users ({users.length})
        </Button>
        <Button
          variant={tab === 'audit_logs' ? 'primary' : 'secondary'}
          onClick={() => setTab('audit_logs')}
        >
          <Clock size={16} /> Audit Logs ({auditLogs.length})
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Loading admin data...
        </div>
      ) : tab === 'overview' && overview ? (
        <div>
          <div className="profile-summary-grid">
            <Summary
              icon={Users}
              title="Registered Users"
              count={overview.stats.totalUsers}
              note="Total Accounts"
              color="cyan"
            />
            <Summary
              icon={CheckCircle}
              title="Active Users"
              count={overview.stats.activeUsers}
              note="Active Accounts"
              color="green"
            />
            <Summary
              icon={ScanSearch}
              title="Total Detections"
              count={overview.stats.totalDetections}
              note="Deepfake Checks"
              color="blue"
            />
            <Summary
              icon={ShieldCheck}
              title="Identity Checks"
              count={overview.stats.totalIdentityReports}
              note="Verifications"
              color="purple"
            />
          </div>

          <GlassCard style={{ marginTop: '24px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text)' }}>
              Recent Registrations
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {overview.recentUsers?.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text)', display: 'block' }}>{u.name}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{u.email}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      background:
                        u.role === 'ADMIN' ? '#000000' : '#ffffff',
                      color: u.role === 'ADMIN' ? '#ffffff' : '#000000',
                      fontWeight: 700,
                    }}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      ) : tab === 'users' ? (
        <GlassCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text)' }}>
            User Management Directory
          </h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{u.email}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background:
                            u.role === 'ADMIN' ? '#000000' : '#ffffff',
                          color: u.role === 'ADMIN' ? '#ffffff' : '#000000',
                          fontWeight: 700,
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: u.isActive ? '#000000' : '#ffffff',
                          color: u.isActive ? '#ffffff' : '#000000',
                          fontWeight: 700,
                        }}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={statusToggling === u.id}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#000000', textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {statusToggling === u.id
                            ? 'Updating...'
                            : u.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : tab === 'audit_logs' ? (
        /* Feature E: Admin Activity & Audit Logs */
        <GlassCard style={{ padding: '24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '18px', margin: '0 0 4px', color: 'var(--text)' }}>
              Administrative Security Audit Trail
            </h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>
              Immutable record of administrative actions, account suspensions, and session terminations.
            </p>
          </div>

          {auditLogs.length > 0 ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Admin Name</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id || log.id}>
                      <td style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background:
                              log.action?.includes('DEACTIVAT') || log.action?.includes('REVOKE') ? '#000000' : '#ffffff',
                            color:
                              log.action?.includes('DEACTIVAT') || log.action?.includes('REVOKE') ? '#ffffff' : '#000000',
                            fontFamily: "'DM Mono', monospace",
                            fontWeight: 700,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.targetEntity || log.targetId || '--'}</td>
                      <td>{log.adminName || 'Admin'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {log.details ? JSON.stringify(log.details) : 'Administrative operation'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-grid">
              <Empty
                icon={Clock}
                title="No Audit Logs Recorded"
                text="Administrative actions such as user activation or role updates will appear here."
              />
            </div>
          )}
        </GlassCard>
      ) : null}
    </Shell>
  );
}

function Empty({ icon: Icon, title, text }) {
  return (
    <GlassCard className="empty-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '14px',
          background: '#000000', color: '#ffffff',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--cyan)',
          margin: '0 auto 16px',
        }}
      >
        <Icon size={26} />
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>{text}</p>
    </GlassCard>
  );
}

function Summary({ icon: Icon, title, count = 0, note, color = 'cyan' }) {
  return (
    <GlassCard className={`profile-summary-card ${color}`} style={{ padding: '20px' }}>
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: '#000000', border: '1px solid #000000',
          color: '#ffffff',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon size={22} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>{title}</h3>
        <strong style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', display: 'block', margin: '2px 0' }}>
          {count}
        </strong>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{note}</span>
      </div>
    </GlassCard>
  );
}

function Shell({ children, go, back }) {
  return (
    <div className="modules-page module-detail">
      <PublicNav go={go} />
      <main>
        <BackButton back={back} />
        {children}
      </main>
    </div>
  );
}

export default { HistoryPage, ProfilePage, AdminArea };
