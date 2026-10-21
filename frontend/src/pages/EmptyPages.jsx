import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button, GlassCard, SectionHead } from '../components/UI';
import { BackButton, PublicNav } from './Modules';
import { useAuth } from '../contexts/AuthContext';
import {
  updateUserProfile,
  changeUserPassword,
  getUserHistory,
  getUserStats,
  getAdminOverview,
  getAdminUsers,
  toggleAdminUserStatus,
} from '../services/userService';

/**
 * User History Page
 * Displays authenticated user's own deepfake detections and identity verifications
 */
export function HistoryPage({ go, back }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState({ detections: [], identityReports: [] });
  const [activeTab, setActiveTab] = useState('detections');

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
          <span style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
            AI-GENERATED
          </span>
        );
      case 'NOT_AI_GENERATED':
        return (
          <span style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.15)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
            REAL / NOT AI
          </span>
        );
      default:
        return (
          <span style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
            INCONCLUSIVE
          </span>
        );
    }
  };

  return (
    <Shell go={go} back={back}>
      <SectionHead
        eyebrow="YOUR ACTIVITY"
        title="Personal Verification History"
        copy="Review your past deepfake image analyses and biometric identity checks."
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading your history records...
        </div>
      ) : activeTab === 'detections' ? (
        history.detections.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {history.detections.map((item) => (
              <GlassCard
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(6, 182, 212, 0.15)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--cyan)',
                    }}
                  >
                    <ScanSearch size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#f8fafc' }}>
                      {item.fileName}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#8fa7c0' }}>
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {item.score !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#8fa7c0', display: 'block' }}>
                        AI Score
                      </span>
                      <strong style={{ fontSize: '14px', color: '#e2e8f0' }}>
                        {(item.score * 100).toFixed(1)}%
                      </strong>
                    </div>
                  )}
                  {getClassificationBadge(item.classification)}
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="empty-grid">
            <Empty
              icon={Camera}
              title="No Detection Records"
              text="You haven't analyzed any images yet. Head over to Deepfake Detection to test your first image."
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
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#c4a9ff',
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#f8fafc' }}>
                    {item.reportId}
                  </h4>
                  <span style={{ fontSize: '11px', color: '#8fa7c0' }}>
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
                    <span style={{ fontSize: '10px', color: '#8fa7c0', display: 'block' }}>
                      Similarity
                    </span>
                    <strong style={{ fontSize: '14px', color: '#e2e8f0' }}>
                      {item.similarityScore.toFixed(1)}%
                    </strong>
                  </div>
                )}
                <span
                  style={{
                    color:
                      item.decision === 'SAME PERSON'
                        ? '#4ade80'
                        : item.decision === 'DIFFERENT PERSON'
                        ? '#f87171'
                        : '#fbbf24',
                    background:
                      item.decision === 'SAME PERSON'
                        ? 'rgba(74, 222, 128, 0.15)'
                        : item.decision === 'DIFFERENT PERSON'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(251, 191, 36, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
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
    </Shell>
  );
}

/**
 * User Profile Page
 * Displays authenticated user's profile, editable details, password change, and stats
 */
export function ProfilePage({ go, back, notify }) {
  const { user, updateUser, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [stats, setStats] = useState({ detections: 0, identityChecks: 0, missions: 0, games: 0 });

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
    loadStats();
  }, [user]);

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
      <div className="profile-breadcrumb">
        DeepTrust Academy <span>/</span> Profile
      </div>

      <GlassCard className="profile-hero-card">
        <div className="profile-large-avatar">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" />
          ) : (
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#fff' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserRound />}
            </span>
          )}
        </div>

        <div className="profile-hero-copy">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>{user?.name || 'Cadet'}</h1>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                background:
                  user?.role === 'ADMIN'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(6, 182, 212, 0.2)',
                color: user?.role === 'ADMIN' ? '#fca5a5' : '#67e8f9',
                fontWeight: 600,
              }}
            >
              {user?.role || 'USER'}
            </span>
          </div>
          <p>{user?.bio || 'Trust & Verification Cadet at DeepTrust Academy'}</p>
          <span>{user?.email}</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button onClick={() => setEditing(true)}>Edit Profile</Button>
          <Button variant="secondary" onClick={() => setChangingPassword(true)}>
            <KeyRound size={16} /> Change Password
          </Button>
        </div>
      </GlassCard>

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

      <div className="profile-content-grid">
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
      </div>

      <GlassCard className="account-info-card">
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
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.1)',
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
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.1)',
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
 * Live Admin Dashboard and User Management
 */
export function AdminArea({ go, back, notify }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [statusToggling, setStatusToggling] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadAdminData() {
      try {
        const [overviewData, usersList] = await Promise.all([
          getAdminOverview(),
          getAdminUsers(),
        ]);
        if (active) {
          setOverview(overviewData);
          setUsers(usersList);
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
        copy="Manage platform users, view aggregate detection metrics, and monitor platform integrity."
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
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
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
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
            <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#f8fafc' }}>
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
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div>
                    <strong style={{ color: '#f1f5f9', display: 'block' }}>{u.name}</strong>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{u.email}</span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background:
                        u.role === 'ADMIN'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(6, 182, 212, 0.2)',
                      color: u.role === 'ADMIN' ? '#fca5a5' : '#67e8f9',
                      fontWeight: 600,
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
          <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#f8fafc' }}>
            User Management Directory
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                  }}
                >
                  <th style={{ padding: '10px 12px' }}>Name</th>
                  <th style={{ padding: '10px 12px' }}>Email</th>
                  <th style={{ padding: '10px 12px' }}>Role</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <td style={{ padding: '12px', color: '#f8fafc', fontWeight: 500 }}>
                      {u.name}
                    </td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{u.email}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background:
                            u.role === 'ADMIN'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(6, 182, 212, 0.2)',
                          color: u.role === 'ADMIN' ? '#fca5a5' : '#67e8f9',
                          fontWeight: 600,
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: u.isActive
                            ? 'rgba(74, 222, 128, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          color: u.isActive ? '#4ade80' : '#f87171',
                          fontWeight: 600,
                        }}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={statusToggling === u.id}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: u.isActive ? '#f87171' : '#4ade80',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
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
      ) : null}
    </Shell>
  );
}

function Empty({ icon: Icon, title, text }) {
  return (
    <GlassCard className="empty-card">
      <Icon />
      <h3>{title}</h3>
      <p>{text}</p>
    </GlassCard>
  );
}

function Summary({ icon: Icon, title, count = 0, note, color = 'cyan' }) {
  return (
    <GlassCard className={`profile-summary-card ${color}`}>
      <Icon />
      <div>
        <h3>{title}</h3>
        <strong>{count}</strong>
        <span>{note}</span>
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
