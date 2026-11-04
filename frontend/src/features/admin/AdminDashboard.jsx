import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  ScanSearch,
  ShieldCheck,
  ShieldAlert,
  Gamepad2,
  Trophy,
  BarChart3,
  Clock,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Camera,
  FolderOpen,
  Image as ImageIcon,
  Check,
  Layers,
  Award,
  Calendar,
  Flame,
  Target,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeSwitcher } from '../../components/ThemeSwitcher';
import {
  getAdminOverview,
  getAdminUsers,
  getAdminUserDetails,
  toggleAdminUserStatus,
  getAdminDetectionHistory,
  getAdminIdentityHistory,
  getAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  toggleAdminQuestionStatus,
  publishAdminQuestion,
  getAdminImages,
  createAdminImage,
  updateAdminImage,
  deleteAdminImage,
  toggleAdminImageStatus,
  publishAdminImage,
  getAdminGameHistory,
  getAdminLeaderboard,
  getAdminAuditLogs,
  adminLogoutApi,
  getAdminCyberCrimeRounds,
  createAdminCyberCrimeRound,
  updateAdminCyberCrimeRound,
  deleteAdminCyberCrimeRound,
  publishAdminCyberCrimeRound,
  toggleAdminCyberCrimeRound,
  getAdminCyberCrimeQuestions,
  createAdminCyberCrimeQuestion,
  updateAdminCyberCrimeQuestion,
  deleteAdminCyberCrimeQuestion,
  publishAdminCyberCrimeQuestion,
  toggleAdminCyberCrimeQuestion,
} from '../../services/userService';
import './adminDashboard.css';

export function AdminDashboard({ go, back, notify }) {
  const { user, logout } = useAuth();

  // Navigation State
  const [activeSection, setActiveSection] = useState('overview');
  const [gameSubView, setGameSubView] = useState('hub'); // 'hub' | 'questions' | 'images'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Section Data States
  const [overview, setOverview] = useState(null);

  // User Management States & Filters
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ total: 0, page: 1 });
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userMinXP, setUserMinXP] = useState('');
  const [userMaxXP, setUserMaxXP] = useState('');
  const [userSortBy, setUserSortBy] = useState('newest');

  // Detection History States & Filters
  const [detections, setDetections] = useState([]);
  const [detectionSearch, setDetectionSearch] = useState('');
  const [detectionFilter, setDetectionFilter] = useState('ALL');
  const [detectionStartDate, setDetectionStartDate] = useState('');
  const [detectionEndDate, setDetectionEndDate] = useState('');
  const [detectionSortBy, setDetectionSortBy] = useState('newest');

  // Identity Guardian States & Filters
  const [identityReports, setIdentityReports] = useState([]);
  const [identitySearch, setIdentitySearch] = useState('');
  const [identityStatusFilter, setIdentityStatusFilter] = useState('ALL');
  const [identityDecisionFilter, setIdentityDecisionFilter] = useState('ALL');
  const [identityStartDate, setIdentityStartDate] = useState('');
  const [identityEndDate, setIdentityEndDate] = useState('');
  const [identitySortBy, setIdentitySortBy] = useState('newest');

  // Game Management: Question States & Filters
  const [questions, setQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('ALL');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('ALL');
  const [questionLabelFilter, setQuestionLabelFilter] = useState('ALL');
  const [questionStatusFilter, setQuestionStatusFilter] = useState('ALL');
  const [questionActiveFilter, setQuestionActiveFilter] = useState('ALL');
  const [questionSortBy, setQuestionSortBy] = useState('newest');

  // Game Management: Image Bank States & Filters
  const [images, setImages] = useState([]);
  const [imageSearch, setImageSearch] = useState('');
  const [imageTypeFilter, setImageTypeFilter] = useState('ALL');
  const [imageCategoryFilter, setImageCategoryFilter] = useState('ALL');
  const [imageDifficultyFilter, setImageDifficultyFilter] = useState('ALL');
  const [imageStatusFilter, setImageStatusFilter] = useState('ALL');
  const [imageActiveFilter, setImageActiveFilter] = useState('ALL');
  const [imageSortBy, setImageSortBy] = useState('newest');

  // Game History States & Filters
  const [gameSessions, setGameSessions] = useState([]);
  const [gameHistorySearch, setGameHistorySearch] = useState('');
  const [gameHistoryStatusFilter, setGameHistoryStatusFilter] = useState('ALL');
  const [gameHistoryMinScore, setGameHistoryMinScore] = useState('');
  const [gameHistoryMaxScore, setGameHistoryMaxScore] = useState('');
  const [gameHistoryStartDate, setGameHistoryStartDate] = useState('');
  const [gameHistoryEndDate, setGameHistoryEndDate] = useState('');
  const [gameHistorySortBy, setGameHistorySortBy] = useState('newest');

  // Leaderboard & Audit Logs
  const [leaderboard, setLeaderboard] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogActionFilter, setAuditLogActionFilter] = useState('ALL');

  // Cyber Crime Investigation Round & Question Bank States
  const [cyberRounds, setCyberRounds] = useState([]);
  const [expandedRounds, setExpandedRounds] = useState({});
  const [roundQuestionsMap, setRoundQuestionsMap] = useState({});
  const [cyberRoundModal, setCyberRoundModal] = useState(null); // null | { mode: 'create' | 'edit', data: {} }
  const [cyberQuestionModal, setCyberQuestionModal] = useState(null); // null | { mode: 'create' | 'edit', roundId, data: {} }
  const [confirmDeleteCyberRound, setConfirmDeleteCyberRound] = useState(null);
  const [confirmDeleteCyberQuestion, setConfirmDeleteCyberQuestion] = useState(null);
  const [previewCyberRoundModal, setPreviewCyberRoundModal] = useState(null);

  // Modals
  const [inspectUserModal, setInspectUserModal] = useState(null); // full dossier
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [dossierTab, setDossierTab] = useState('profile'); // 'profile' | 'games' | 'detections' | 'identity'
  const [confirmToggleUser, setConfirmToggleUser] = useState(null);

  const [questionModal, setQuestionModal] = useState(null); // null | { mode: 'create' | 'edit', data: {} }
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState(null);

  const [imageModal, setImageModal] = useState(null); // null | { mode: 'create' | 'edit', data: {} }
  const [confirmDeleteImage, setConfirmDeleteImage] = useState(null);
  const [zoomImageModal, setZoomImageModal] = useState(null);

  const [inspectDetectionModal, setInspectDetectionModal] = useState(null);
  const [inspectIdentityModal, setInspectIdentityModal] = useState(null);
  const [adminProfileModal, setAdminProfileModal] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Initial & Section-Based Data Load
  useEffect(() => {
    loadAllAdminData();
  }, [activeSection, gameSubView]);

  const loadAllAdminData = async (overrides = {}) => {
    setLoading(true);
    try {
      if (activeSection === 'overview') {
        const data = await getAdminOverview();
        setOverview(data);
      } else if (activeSection === 'users') {
        const sortToUse = overrides.userSortBy !== undefined ? overrides.userSortBy : userSortBy;
        const searchToUse = overrides.userSearch !== undefined ? overrides.userSearch : userSearch;
        const data = await getAdminUsers({
          search: searchToUse,
          sortBy: sortToUse,
        });
        let fetchedUsers = data?.users ? [...data.users] : [];
        if (sortToUse === 'highest_xp') {
          fetchedUsers.sort((a, b) => (b.totalXP || 0) - (a.totalXP || 0));
        } else if (sortToUse === 'lowest_xp') {
          fetchedUsers.sort((a, b) => (a.totalXP || 0) - (b.totalXP || 0));
        } else if (sortToUse === 'oldest') {
          fetchedUsers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortToUse === 'newest') {
          fetchedUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        setUsers(fetchedUsers);
        setUsersPagination(data?.pagination || { total: fetchedUsers.length, page: 1 });
      } else if (activeSection === 'detections') {
        const data = await getAdminDetectionHistory({
          search: detectionSearch,
          classification: detectionFilter,
          startDate: detectionStartDate,
          endDate: detectionEndDate,
          sortBy: detectionSortBy,
        });
        setDetections(data?.detections || []);
      } else if (activeSection === 'identity') {
        const data = await getAdminIdentityHistory({
          search: identitySearch,
          status: identityStatusFilter,
          decision: identityDecisionFilter,
          startDate: identityStartDate,
          endDate: identityEndDate,
          sortBy: identitySortBy,
        });
        setIdentityReports(data?.identityReports || []);
      } else if (activeSection === 'game_management') {
        // Load images and cyber crime investigation rounds for the two management cards
        const [imgData, cyberData] = await Promise.all([
          getAdminImages({
            search: imageSearch,
            imageType: imageTypeFilter,
            imageCategory: imageCategoryFilter,
            difficulty: imageDifficultyFilter,
            status: imageStatusFilter,
            isActive: imageActiveFilter,
            sortBy: imageSortBy,
          }),
          getAdminCyberCrimeRounds(),
        ]);
        setImages(imgData?.images || []);
        setCyberRounds(cyberData?.rounds || []);
      } else if (activeSection === 'leaderboard') {
        const data = await getAdminLeaderboard();
        setLeaderboard(data?.leaderboard || []);
      }
    } catch (err) {
      if (notify) notify(err.message || 'Error loading administrative data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllAdminData();
    setRefreshing(false);
    if (notify) notify('Administrative telemetry refreshed from MongoDB.');
  };

  const handleLogout = async () => {
    try {
      await adminLogoutApi();
    } catch {
      // Ignore network errors on logout
    } finally {
      if (logout) logout();
      if (go) go('admin-login');
    }
  };

  // Inspect User (Full Dossier)
  const handleOpenUserDossier = async (targetUser) => {
    setLoadingDossier(true);
    setDossierTab('profile');
    try {
      const dossierData = await getAdminUserDetails(targetUser.id || targetUser._id);
      setInspectUserModal(dossierData);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to load user dossier.');
    } finally {
      setLoadingDossier(false);
    }
  };

  // User Status Toggle Confirmation
  const handleToggleUserConfirmed = async () => {
    if (!confirmToggleUser) return;
    setActionLoading(true);
    try {
      const newStatus = !confirmToggleUser.isActive;
      await toggleAdminUserStatus(confirmToggleUser.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === confirmToggleUser.id ? { ...u, isActive: newStatus } : u))
      );
      if (inspectUserModal?.user?.id === confirmToggleUser.id) {
        setInspectUserModal((prev) => ({
          ...prev,
          user: { ...prev.user, isActive: newStatus },
        }));
      }
      if (notify) {
        notify(`User account "${confirmToggleUser.email}" has been ${newStatus ? 'activated' : 'deactivated'}.`);
      }
      setConfirmToggleUser(null);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Question CRUD Handlers
  const handleSaveQuestion = async (formDataOrJson) => {
    setActionLoading(true);
    try {
      if (questionModal.mode === 'create') {
        const newQ = await createAdminQuestion(formDataOrJson);
        setQuestions((prev) => [newQ, ...prev]);
        if (notify) notify('New challenge question added to Question Bank.');
      } else {
        const updatedQ = await updateAdminQuestion(questionModal.data.id, formDataOrJson);
        setQuestions((prev) => prev.map((q) => (q.id === questionModal.data.id ? updatedQ : q)));
        if (notify) notify('Game question updated successfully.');
      }
      setQuestionModal(null);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to save question.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestionConfirmed = async () => {
    if (!confirmDeleteQuestion) return;
    setActionLoading(true);
    try {
      await deleteAdminQuestion(confirmDeleteQuestion.id);
      setQuestions((prev) => prev.filter((q) => q.id !== confirmDeleteQuestion.id));
      if (notify) notify('Game question deleted successfully.');
      setConfirmDeleteQuestion(null);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to delete question.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleQuestionStatus = async (qId) => {
    try {
      const updated = await toggleAdminQuestionStatus(qId);
      setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, isActive: updated.isActive } : q)));
      if (notify) notify(`Question is now ${updated.isActive ? 'active' : 'disabled'}.`);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to toggle question status.');
    }
  };

  const handlePublishQuestion = async (qId) => {
    try {
      const updated = await publishAdminQuestion(qId);
      setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, status: updated.status } : q)));
      if (notify) notify(`Question status changed to ${updated.status}.`);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to toggle question publish status.');
    }
  };

  // Image CRUD Handlers
  const handleSaveImage = async (formDataOrJson) => {
    setActionLoading(true);
    try {
      if (imageModal.mode === 'create') {
        const newImg = await createAdminImage(formDataOrJson);
        setImages((prev) => [newImg, ...prev]);
        if (notify) notify('Photograph successfully registered in Image Bank.');
      } else {
        const updatedImg = await updateAdminImage(imageModal.data.id, formDataOrJson);
        setImages((prev) => prev.map((img) => (img.id === imageModal.data.id ? updatedImg : img)));
        if (notify) notify('Photograph details updated successfully.');
      }
      setImageModal(null);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to save photograph.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteImageConfirmed = async () => {
    if (!confirmDeleteImage) return;
    setActionLoading(true);
    try {
      await deleteAdminImage(confirmDeleteImage.id);
      setImages((prev) => prev.filter((img) => img.id !== confirmDeleteImage.id));
      if (notify) notify('Photograph removed from Image Bank.');
      setConfirmDeleteImage(null);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to delete photograph.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleImageStatus = async (imgId) => {
    try {
      const updated = await toggleAdminImageStatus(imgId);
      setImages((prev) => prev.map((img) => (img.id === imgId ? { ...img, isActive: updated.isActive } : img)));
      if (notify) notify(`Photograph is now ${updated.isActive ? 'active' : 'disabled'}.`);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to toggle photograph status.');
    }
  };

  const handleToggleImage = handleToggleImageStatus;

  const handlePublishImage = async (imgId) => {
    try {
      const updated = await publishAdminImage(imgId);
      setImages((prev) => prev.map((img) => (img.id === imgId ? { ...img, status: updated.status } : img)));
      if (notify) notify(`Photograph status changed to ${updated.status}.`);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to toggle photograph publish status.');
    }
  };

  // Cyber Crime Investigation Management Handlers
  const handleLoadRoundQuestions = async (roundId) => {
    try {
      const data = await getAdminCyberCrimeQuestions(roundId);
      setRoundQuestionsMap((prev) => ({
        ...prev,
        [roundId]: data?.questions || [],
      }));
    } catch (err) {
      if (notify) notify(err.message || 'Failed to load questions for round.');
    }
  };

  const handleToggleExpandRound = async (roundId) => {
    const isExpanding = !expandedRounds[roundId];
    setExpandedRounds((prev) => ({ ...prev, [roundId]: isExpanding }));
    if (isExpanding && !roundQuestionsMap[roundId]) {
      await handleLoadRoundQuestions(roundId);
    }
  };

  const handleSaveCyberRound = async (roundData) => {
    setActionLoading(true);
    try {
      if (cyberRoundModal.mode === 'create') {
        const newRound = await createAdminCyberCrimeRound(roundData);
        setCyberRounds((prev) => [...prev, { ...newRound, totalQuestions: 0, publishedQuestions: 0 }]);
        if (notify) notify('Investigation round created successfully.');
      } else {
        const updated = await updateAdminCyberCrimeRound(cyberRoundModal.data.id || cyberRoundModal.data._id, roundData);
        setCyberRounds((prev) =>
          prev.map((r) => ((r.id === updated._id || r.id === updated.id) ? { ...r, ...updated } : r))
        );
        if (notify) notify('Investigation round updated successfully.');
      }
      setCyberRoundModal(null);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to save investigation round.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCyberRoundConfirmed = async () => {
    if (!confirmDeleteCyberRound) return;
    setActionLoading(true);
    try {
      await deleteAdminCyberCrimeRound(confirmDeleteCyberRound.id || confirmDeleteCyberRound._id);
      setCyberRounds((prev) => prev.filter((r) => r.id !== confirmDeleteCyberRound.id && r._id !== confirmDeleteCyberRound.id));
      if (notify) notify('Investigation round deleted successfully.');
      setConfirmDeleteCyberRound(null);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to delete investigation round.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishCyberRound = async (roundId) => {
    try {
      const updated = await publishAdminCyberCrimeRound(roundId);
      setCyberRounds((prev) =>
        prev.map((r) => ((r.id === roundId || r._id === roundId) ? { ...r, publicationStatus: updated.publicationStatus, status: updated.status } : r))
      );
      if (notify) notify(`Investigation round status updated to ${updated.publicationStatus}.`);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to toggle round publication status.');
    }
  };

  const handleToggleCyberRound = async (roundId) => {
    try {
      const updated = await toggleAdminCyberCrimeRound(roundId);
      setCyberRounds((prev) =>
        prev.map((r) => ((r.id === roundId || r._id === roundId) ? { ...r, isActive: updated.isActive } : r))
      );
      if (notify) notify(`Investigation round is now ${updated.isActive ? 'active' : 'disabled'}.`);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to toggle round active status.');
    }
  };

  const handleSaveCyberQuestion = async (qData) => {
    setActionLoading(true);
    try {
      const { roundId } = cyberQuestionModal;
      if (cyberQuestionModal.mode === 'create') {
        const newQ = await createAdminCyberCrimeQuestion(roundId, qData);
        setRoundQuestionsMap((prev) => ({
          ...prev,
          [roundId]: [...(prev[roundId] || []), newQ],
        }));
        setCyberRounds((prev) =>
          prev.map((r) => (r.roundId === roundId ? { ...r, totalQuestions: (r.totalQuestions || 0) + 1 } : r))
        );
        if (notify) notify('Question added to investigation round.');
      } else {
        const updated = await updateAdminCyberCrimeQuestion(cyberQuestionModal.data.id || cyberQuestionModal.data._id, qData);
        setRoundQuestionsMap((prev) => ({
          ...prev,
          [roundId]: (prev[roundId] || []).map((q) => (q.id === updated._id || q.id === updated.id ? updated : q)),
        }));
        if (notify) notify('Question updated successfully.');
      }
      setCyberQuestionModal(null);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to save question.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCyberQuestionConfirmed = async () => {
    if (!confirmDeleteCyberQuestion) return;
    setActionLoading(true);
    try {
      const { id, roundId } = confirmDeleteCyberQuestion;
      await deleteAdminCyberCrimeQuestion(id);
      setRoundQuestionsMap((prev) => ({
        ...prev,
        [roundId]: (prev[roundId] || []).filter((q) => q.id !== id && q._id !== id),
      }));
      setCyberRounds((prev) =>
        prev.map((r) => (r.roundId === roundId ? { ...r, totalQuestions: Math.max(0, (r.totalQuestions || 1) - 1) } : r))
      );
      if (notify) notify('Question deleted from round.');
      setConfirmDeleteCyberQuestion(null);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to delete question.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishCyberQuestion = async (qId, roundId) => {
    try {
      const updated = await publishAdminCyberCrimeQuestion(qId);
      setRoundQuestionsMap((prev) => ({
        ...prev,
        [roundId]: (prev[roundId] || []).map((q) => (q.id === qId || q._id === qId ? { ...q, publicationStatus: updated.publicationStatus, status: updated.status } : q)),
      }));
      if (notify) notify(`Question status updated to ${updated.publicationStatus}.`);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to toggle question publication status.');
    }
  };

  const handleToggleCyberQuestion = async (qId, roundId) => {
    try {
      const updated = await toggleAdminCyberCrimeQuestion(qId);
      setRoundQuestionsMap((prev) => ({
        ...prev,
        [roundId]: (prev[roundId] || []).map((q) => (q.id === qId || q._id === qId ? { ...q, isActive: updated.isActive } : q)),
      }));
      if (notify) notify(`Question is now ${updated.isActive ? 'active' : 'disabled'}.`);
    } catch (err) {
      if (notify) notify(err.message || 'Failed to toggle question active status.');
    }
  };

  // Clear Filter Helpers
  const clearUserFilters = () => {
    setUserSearch('');
    setUserStatusFilter('all');
    setUserRoleFilter('all');
    setUserMinXP('');
    setUserMaxXP('');
    setUserSortBy('newest');
    loadAllAdminData({ userSearch: '', userSortBy: 'newest' });
  };

  const clearDetectionFilters = () => {
    setDetectionSearch('');
    setDetectionFilter('ALL');
    setDetectionStartDate('');
    setDetectionEndDate('');
    setDetectionSortBy('newest');
    setTimeout(() => loadAllAdminData(), 0);
  };

  const clearIdentityFilters = () => {
    setIdentitySearch('');
    setIdentityStatusFilter('ALL');
    setIdentityDecisionFilter('ALL');
    setIdentityStartDate('');
    setIdentityEndDate('');
    setIdentitySortBy('newest');
    setTimeout(() => loadAllAdminData(), 0);
  };

  const clearQuestionFilters = () => {
    setQuestionSearch('');
    setQuestionDifficultyFilter('ALL');
    setQuestionCategoryFilter('ALL');
    setQuestionLabelFilter('ALL');
    setQuestionStatusFilter('ALL');
    setQuestionActiveFilter('ALL');
    setQuestionSortBy('newest');
    setTimeout(() => loadAllAdminData(), 0);
  };

  const clearImageFilters = () => {
    setImageSearch('');
    setImageTypeFilter('ALL');
    setImageCategoryFilter('ALL');
    setImageDifficultyFilter('ALL');
    setImageStatusFilter('ALL');
    setImageActiveFilter('ALL');
    setImageSortBy('newest');
    setTimeout(() => loadAllAdminData(), 0);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="admin-brand-icon">
              <ShieldAlert size={22} />
            </div>
            <div className="admin-brand-text">
              <h2>DeepTrust</h2>
              <span>Admin Console</span>
            </div>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            style={{ display: 'none', background: 'transparent', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('overview');
              setMobileMenuOpen(false);
            }}
          >
            <BarChart3 size={18} /> Overview
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('users');
              setMobileMenuOpen(false);
            }}
          >
            <Users size={18} /> User Management
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'detections' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('detections');
              setMobileMenuOpen(false);
            }}
          >
            <ScanSearch size={18} /> Detection History
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'identity' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('identity');
              setMobileMenuOpen(false);
            }}
          >
            <ShieldCheck size={18} /> Identity Guardian
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'game_management' && gameSubView === 'hub' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('game_management');
              setGameSubView('hub');
              setMobileMenuOpen(false);
            }}
          >
            <Gamepad2 size={18} /> Game Management
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'game_management' && gameSubView === 'images' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('game_management');
              setGameSubView('images');
              setMobileMenuOpen(false);
            }}
          >
            <Camera size={18} /> Image Management
          </button>

          <button
            className={`admin-nav-item ${activeSection === 'leaderboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('leaderboard');
              setMobileMenuOpen(false);
            }}
          >
            <Trophy size={18} /> Leaderboard
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            onClick={() => go('modules')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid var(--line, #e2e8f0)',
              color: 'var(--text, #0f172a)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={15} /> Return to Academy
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#dc2626',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              justifyContent: 'center',
            }}
          >
            <LogOut size={15} /> Sign Out Admin
          </button>
        </div>
      </aside>

      {/* Main Administrative Content */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              className="mobile-hamburger"
            >
              <Menu size={22} />
            </button>
            <div className="admin-topbar-title">
              <h1>
                {activeSection === 'overview' && 'Platform Overview'}
                {activeSection === 'users' && 'User Management'}
                {activeSection === 'detections' && 'Deepfake Detection Records'}
                {activeSection === 'identity' && 'Identity Guardian Records'}
                {activeSection === 'game_management' &&
                  (gameSubView === 'hub'
                    ? 'Game Management'
                    : gameSubView === 'cybercrime'
                    ? 'Cyber Crime Question Bank'
                    : 'Deepfake Image Management')}
                {activeSection === 'leaderboard' && 'Platform Leaderboard'}
              </h1>
              <p>DeepTrust Academy · Administrative Security Console</p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <span className="admin-badge status-online">
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              MONGODB ONLINE
            </span>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh MongoDB Data"
              style={{
                background: '#ffffff',
                border: '1px solid var(--line, #e2e8f0)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--text, #0f172a)',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>

            <ThemeSwitcher />

            <div
              className="admin-profile-pill"
              onClick={() => setAdminProfileModal(true)}
              style={{ cursor: 'pointer' }}
              title="View Admin Profile"
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#000000',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {user?.name?.[0] || 'A'}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <strong style={{ fontSize: '13px', display: 'block' }}>{user?.name || 'Administrator'}</strong>
                <span style={{ fontSize: '10.5px', color: '#0284c7', fontWeight: 700 }}>ADMIN</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="admin-body">
          {/* ============================================================= */}
          {/* SECTION A: OVERVIEW */}
          {/* ============================================================= */}
          {activeSection === 'overview' && (
            <div>
              {loading && !overview ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                  Loading real-time MongoDB statistics...
                </div>
              ) : overview ? (
                <div>
                  {/* KPI Stats Cards */}
                  <div className="admin-stats-grid">
                    <div className="admin-kpi-card">
                      <div className="admin-kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                        <Users size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Total Registered</span>
                        <div className="admin-kpi-value">{overview.stats.totalUsers}</div>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                          {overview.stats.activeUsers} active accounts
                        </span>
                      </div>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="admin-kpi-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                        <ScanSearch size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Deepfake Detections</span>
                        <div className="admin-kpi-value">{overview.stats.totalDetections}</div>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Forensic scans recorded</span>
                      </div>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="admin-kpi-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Identity Checks</span>
                        <div className="admin-kpi-value">{overview.stats.totalIdentityReports}</div>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Guardian verifications</span>
                      </div>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="admin-kpi-icon" style={{ background: '#ffedd5', color: '#c2410c' }}>
                        <Gamepad2 size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Game Sessions</span>
                        <div className="admin-kpi-value">{overview.stats.totalGameSessions}</div>
                        <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 600 }}>
                          {overview.stats.completedGameSessions} completed ({overview.charts.gameCompletionRate}%)
                        </span>
                      </div>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="admin-kpi-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                        <Trophy size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Total XP Distributed</span>
                        <div className="admin-kpi-value">{overview.stats.totalXpEarned.toLocaleString()}</div>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Player experience points</span>
                      </div>
                    </div>

                    <div className="admin-kpi-card">
                      <div className="admin-kpi-icon" style={{ background: '#f1f5f9', color: '#0f172a' }}>
                        <Sparkles size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Question Bank</span>
                        <div className="admin-kpi-value">{overview.stats.totalQuestions}</div>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Forensic challenge cards</span>
                      </div>
                    </div>
                  </div>

                  {/* Charts & Trends Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
                    {/* Activity Trend Chart */}
                    <div className="admin-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>7-Day Platform Activity</h3>
                          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>User registrations, detections, and gameplay</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 600 }}>
                          <span style={{ color: '#0284c7' }}>● Detections</span>
                          <span style={{ color: '#c2410c' }}>● Games</span>
                        </div>
                      </div>

                      <div style={{ height: '180px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingTop: '20px' }}>
                        {overview.charts.activityTrends.map((d) => {
                          const maxVal = Math.max(
                            ...overview.charts.activityTrends.map((t) => Math.max(t.detections, t.games, 1))
                          );
                          const detH = Math.max(8, Math.round((d.detections / maxVal) * 130));
                          const gameH = Math.max(8, Math.round((d.games / maxVal) * 130));

                          return (
                            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '140px' }}>
                                <div
                                  style={{
                                    width: '14px',
                                    height: `${detH}px`,
                                    background: '#0284c7',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease',
                                  }}
                                  title={`Detections: ${d.detections}`}
                                />
                                <div
                                  style={{
                                    width: '14px',
                                    height: `${gameH}px`,
                                    background: '#ea580c',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease',
                                  }}
                                  title={`Game Sessions: ${d.games}`}
                                />
                              </div>
                              <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{d.label.split(',')[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Detection Outcome Breakdown */}
                    <div className="admin-card">
                      <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>Detection Classification Distribution</h3>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '20px' }}>
                        Real vs AI-generated ratio from historical scans
                      </span>

                      <div style={{ display: 'grid', gap: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600 }}>Synthetic / AI-Generated</span>
                            <strong>{overview.charts.detectionDistribution.AI_GENERATED} scans</strong>
                          </div>
                          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                background: '#dc2626',
                                width: `${
                                  overview.stats.totalDetections > 0
                                    ? Math.round(
                                        (overview.charts.detectionDistribution.AI_GENERATED /
                                          overview.stats.totalDetections) *
                                          100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600 }}>Real / Optical Sensor Photo</span>
                            <strong>{overview.charts.detectionDistribution.NOT_AI_GENERATED} scans</strong>
                          </div>
                          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                background: '#16a34a',
                                width: `${
                                  overview.stats.totalDetections > 0
                                    ? Math.round(
                                        (overview.charts.detectionDistribution.NOT_AI_GENERATED /
                                          overview.stats.totalDetections) *
                                          100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600 }}>Inconclusive / Mixed Signals</span>
                            <strong>{overview.charts.detectionDistribution.INCONCLUSIVE} scans</strong>
                          </div>
                          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                background: '#f59e0b',
                                width: `${
                                  overview.stats.totalDetections > 0
                                    ? Math.round(
                                        (overview.charts.detectionDistribution.INCONCLUSIVE /
                                          overview.stats.totalDetections) *
                                          100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION B: USER MANAGEMENT */}
          {/* ============================================================= */}
          {activeSection === 'users' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Registered Users</h3>
                  <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                    Accounts, roles, total XP, game progress, and activation controls
                  </span>
                </div>
              </div>

              {/* Multi-Filter Toolbar */}
              <div className="admin-filter-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                  <Search size={15} color="var(--muted)" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadAllAdminData({ userSearch: e.target.value })}
                    className="admin-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <select
                  value={userSortBy}
                  onChange={(e) => {
                    const newSort = e.target.value;
                    setUserSortBy(newSort);
                    loadAllAdminData({ userSortBy: newSort });
                  }}
                  className="admin-filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest_xp">XP: High to Low</option>
                  <option value="lowest_xp">XP: Low to High</option>
                </select>

                <button
                  onClick={clearUserFilters}
                  className="admin-btn admin-btn-secondary"
                  title="Reset all filters"
                >
                  <RotateCcw size={14} /> Clear
                </button>

                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginLeft: 'auto' }}>
                  {users.length} Matching
                </span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading users...</div>
              ) : users.length > 0 ? (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Registered</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <strong style={{ fontSize: '13.5px' }}>{u.name}</strong>
                            <span style={{ fontSize: '11.5px', color: 'var(--muted)', display: 'block' }}>{u.email}</span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                background: u.role === 'ADMIN' ? '#000000' : '#f1f5f9',
                                color: u.role === 'ADMIN' ? '#ffffff' : '#000000',
                                border: '1px solid #000000',
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                onClick={() => handleOpenUserDossier(u)}
                                style={{
                                  background: '#0284c7',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Eye size={13} /> Inspect
                              </button>

                              {u.role !== 'ADMIN' && (
                                <button
                                  onClick={() => setConfirmToggleUser(u)}
                                  style={{
                                    background: 'transparent',
                                    border: `1px solid ${u.isActive ? '#fca5a5' : '#86efac'}`,
                                    color: u.isActive ? '#dc2626' : '#16a34a',
                                    borderRadius: '6px',
                                    padding: '5px 8px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                  title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                                >
                                  {u.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No matching users found.</div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION C: DEEPFAKE DETECTION HISTORY */}
          {/* ============================================================= */}
          {activeSection === 'detections' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Forensic Detection History</h3>
                  <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                    Database records of analyzed images, classifications, and confidence scores
                  </span>
                </div>
              </div>

              {/* Multi-Filter Toolbar */}
              <div className="admin-filter-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                  <Search size={15} color="var(--muted)" />
                  <input
                    type="text"
                    placeholder="Search file name, user, or ID..."
                    value={detectionSearch}
                    onChange={(e) => setDetectionSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadAllAdminData()}
                    className="admin-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <select
                  value={detectionFilter}
                  onChange={(e) => {
                    setDetectionFilter(e.target.value);
                    setTimeout(() => loadAllAdminData(), 0);
                  }}
                  className="admin-filter-select"
                >
                  <option value="ALL">All Classifications</option>
                  <option value="AI_GENERATED">AI Generated</option>
                  <option value="NOT_AI_GENERATED">Real / Optical</option>
                  <option value="INCONCLUSIVE">Inconclusive</option>
                </select>

                <select
                  value={detectionSortBy}
                  onChange={(e) => {
                    setDetectionSortBy(e.target.value);
                    setTimeout(() => loadAllAdminData(), 0);
                  }}
                  className="admin-filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="score_desc">Highest AI Score</option>
                  <option value="score_asc">Lowest AI Score</option>
                </select>

                <button
                  onClick={clearDetectionFilters}
                  className="admin-btn admin-btn-secondary"
                  title="Reset all filters"
                >
                  <RotateCcw size={14} /> Clear
                </button>

                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginLeft: 'auto' }}>
                  {detections.length} Records
                </span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading detection records...</div>
              ) : detections.length > 0 ? (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Analyzed Date</th>
                        <th>Classification</th>
                        <th>AI Score</th>
                        <th>Analyzed By</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detections.map((d) => (
                        <tr key={d.id}>
                          <td>
                            <strong style={{ fontSize: '13px' }}>{d.fileName}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>ID: {d.id}</span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                            {new Date(d.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                background:
                                  d.classification === 'AI_GENERATED'
                                    ? '#000000'
                                    : d.classification === 'NOT_AI_GENERATED'
                                    ? '#ffffff'
                                    : '#f1f5f9',
                                color:
                                  d.classification === 'AI_GENERATED'
                                    ? '#ffffff'
                                    : '#000000',
                                border: '1px solid #000000',
                              }}
                            >
                              {d.classification}
                            </span>
                          </td>
                          <td>
                            {d.score !== null ? (
                              <strong style={{ fontSize: '13px' }}>{(d.score * 100).toFixed(1)}%</strong>
                            ) : (
                              '--'
                            )}
                          </td>
                          <td style={{ fontSize: '12.5px' }}>
                            {d.user ? `${d.user.name} (${d.user.email})` : 'Anonymous'}
                          </td>
                          <td>
                            <button
                              onClick={() => setInspectDetectionModal(d)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--line)',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Eye size={13} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>No detection records found.</div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION D: IDENTITY GUARDIAN HISTORY */}
          {/* ============================================================= */}
          {activeSection === 'identity' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Identity Guardian Verifications</h3>
                  <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                    Biometric face comparison and ID verification audit records (strict privacy compliant)
                  </span>
                </div>
              </div>

              {/* Multi-Filter Toolbar */}
              <div className="admin-filter-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                  <Search size={15} color="var(--muted)" />
                  <input
                    type="text"
                    placeholder="Search report ID or user..."
                    value={identitySearch}
                    onChange={(e) => setIdentitySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadAllAdminData()}
                    className="admin-filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <select
                  value={identityStatusFilter}
                  onChange={(e) => {
                    setIdentityStatusFilter(e.target.value);
                    setTimeout(() => loadAllAdminData(), 0);
                  }}
                  className="admin-filter-select"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="flagged">Flagged</option>
                  <option value="inconclusive">Inconclusive</option>
                </select>

                <select
                  value={identityDecisionFilter}
                  onChange={(e) => {
                    setIdentityDecisionFilter(e.target.value);
                    setTimeout(() => loadAllAdminData(), 0);
                  }}
                  className="admin-filter-select"
                >
                  <option value="ALL">All Decisions</option>
                  <option value="MATCH">MATCH</option>
                  <option value="NO_MATCH">NO_MATCH</option>
                  <option value="INCONCLUSIVE">INCONCLUSIVE</option>
                </select>

                <select
                  value={identitySortBy}
                  onChange={(e) => {
                    setIdentitySortBy(e.target.value);
                    setTimeout(() => loadAllAdminData(), 0);
                  }}
                  className="admin-filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="similarity_desc">Highest Similarity</option>
                </select>

                <button
                  onClick={clearIdentityFilters}
                  className="admin-btn admin-btn-secondary"
                  title="Reset all filters"
                >
                  <RotateCcw size={14} /> Clear
                </button>

                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginLeft: 'auto' }}>
                  {identityReports.length} Records
                </span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading identity records...</div>
              ) : identityReports.length > 0 ? (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>Verification Type</th>
                        <th>Decision / Status</th>
                        <th>Similarity</th>
                        <th>User</th>
                        <th>Timestamp</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {identityReports.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong style={{ fontSize: '12.5px', fontFamily: 'monospace' }}>{r.reportId}</strong>
                          </td>
                          <td style={{ fontSize: '12.5px' }}>
                            {r.verificationType === 'id_photo_verification' ? 'ID Photo Check' : 'AI Face Match'}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                background: r.decision === 'MATCH' ? '#dcfce7' : '#fee2e2',
                                color: r.decision === 'MATCH' ? '#15803d' : '#b91c1c',
                              }}
                            >
                              {r.decision}
                            </span>
                          </td>
                          <td>
                            {r.similarityScore !== null ? (
                              <strong style={{ fontSize: '13px' }}>{r.similarityScore.toFixed(1)}%</strong>
                            ) : (
                              '--'
                            )}
                          </td>
                          <td style={{ fontSize: '12.5px' }}>
                            {r.user ? `${r.user.name} (${r.user.email})` : 'Anonymous'}
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                            {new Date(r.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <button
                              onClick={() => setInspectIdentityModal(r)}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--line)',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={13} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No identity verification records found.
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* SECTION E: GAME MANAGEMENT (TWO DEDICATED CARDS HUB + SUB-VIEWS) */}
          {/* ============================================================= */}
          {/* SECTION E: GAME MANAGEMENT (EXACTLY TWO DEDICATED CARDS HUB + SUB-VIEWS) */}
          {/* ============================================================= */}
          {activeSection === 'game_management' && (
            <div>
              {/* VIEW 1: GAME HUB (EXACTLY TWO CARDS) */}
              {gameSubView === 'hub' && (
                <div>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Gamepad2 size={24} color="#0284c7" />
                      <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Game Management</h2>
                    </div>
                    <p style={{ color: 'var(--muted, #64748b)', fontSize: '14px', margin: '4px 0 0' }}>
                      Exclusively manage forensic challenges and photographic image bank for Deepfake Detection Game and Cyber Crime Investigation Game.
                    </p>
                  </div>

                  <div className="game-hub-container">
                    {/* CARD 1: DEEPFAKE DETECTION – IMAGE MANAGEMENT */}
                    <div className="game-hub-card">
                      <div>
                        <div className="game-hub-badge">Deepfake Detection Game</div>
                        <h3 className="game-hub-title">Image Management</h3>
                        <p className="game-hub-desc">
                          Exclusively manage the photographic challenge bank for Deepfake Detection Game. Upload authentic camera photos and AI-generated synthetic photographs, define manual correct answers (REAL or AI_GENERATED), add explanations, set difficulty, and manage draft or published status.
                        </p>

                        <div className="game-hub-stats-row">
                          <div className="game-hub-stat-item">
                            <div className="game-hub-stat-num">{images.length}</div>
                            <div className="game-hub-stat-label">Total Images</div>
                          </div>
                          <div className="game-hub-stat-item">
                            <div className="game-hub-stat-num" style={{ color: '#059669' }}>
                              {images.filter((img) => (img.publicationStatus === 'PUBLISHED' || img.status === 'PUBLISHED')).length}
                            </div>
                            <div className="game-hub-stat-label">Published</div>
                          </div>
                          <div className="game-hub-stat-item">
                            <div className="game-hub-stat-num" style={{ color: '#0284c7' }}>
                              {images.filter((img) => img.isActive).length}
                            </div>
                            <div className="game-hub-stat-label">Active</div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setGameSubView('images')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '12px 20px',
                          borderRadius: '10px',
                          background: '#000000',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <Camera size={16} /> Open Image Management <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* CARD 2: CYBER CRIME INVESTIGATION – QUESTION BANK MANAGEMENT */}
                    <div className="game-hub-card">
                      <div>
                        <div className="game-hub-badge" style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}>
                          Cyber Crime Investigation Game
                        </div>
                        <h3 className="game-hub-title">Question Bank Management</h3>
                        <p className="game-hub-desc">
                          Exclusively manage the complete investigation scenario for Cyber Crime Investigation. Create custom rounds, case dossiers, evidence categories, incident descriptions, intercepted communications, forensic clues, and A/B/C/D questions with single correct answers.
                        </p>

                        <div className="game-hub-stats-row">
                          <div className="game-hub-stat-item">
                            <div className="game-hub-stat-num">{cyberRounds.length}</div>
                            <div className="game-hub-stat-label">Total Rounds</div>
                          </div>
                          <div className="game-hub-stat-item">
                            <div className="game-hub-stat-num" style={{ color: '#059669' }}>
                              {cyberRounds.filter((r) => (r.publicationStatus === 'PUBLISHED' || r.status === 'PUBLISHED')).length}
                            </div>
                            <div className="game-hub-stat-label">Published</div>
                          </div>
                          <div className="game-hub-stat-item">
                            <div className="game-hub-stat-num" style={{ color: '#7c3aed' }}>
                              {cyberRounds.reduce((acc, r) => acc + (r.totalQuestions || 0), 0)}
                            </div>
                            <div className="game-hub-stat-label">Questions</div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setGameSubView('cybercrime')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '12px 20px',
                          borderRadius: '10px',
                          background: '#7c3aed',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <FolderOpen size={16} /> Open Question Bank Management <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: SUB-VIEW - CYBER CRIME ROUND & QUESTION BANK MANAGEMENT */}
              {gameSubView === 'cybercrime' && (
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <button
                        onClick={() => setGameSubView('hub')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'transparent',
                          border: 'none',
                          color: '#0284c7',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          marginBottom: '8px',
                          padding: 0,
                        }}
                      >
                        <ArrowLeft size={16} /> Back to Game Hub
                      </button>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Cyber Crime Investigation: Rounds & Question Bank</h3>
                      <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                        Control the complete investigation scenario: custom rounds, case dossiers, evidence categories, forensic clues, and questions
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setCyberRoundModal({
                          mode: 'create',
                          data: {
                            roundNumber: cyberRounds.length + 1,
                            roundTitle: '',
                            caseDossierTitle: 'Case Evidence Dossier',
                            evidenceCategory: '',
                            incidentDescription: '',
                            interceptedCommunication: '',
                            forensicClues: '',
                            difficulty: 'Medium',
                            publicationStatus: 'DRAFT',
                            status: 'DRAFT',
                            isActive: true,
                          },
                        })
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        background: '#7c3aed',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={15} /> Create Investigation Round
                    </button>
                  </div>

                  {/* Rounds List */}
                  {cyberRounds.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {cyberRounds.map((r) => {
                        const isExpanded = !!expandedRounds[r.roundId];
                        const questionsForRound = roundQuestionsMap[r.roundId] || [];
                        const isPublished = (r.publicationStatus === 'PUBLISHED' || r.status === 'PUBLISHED');

                        return (
                          <div
                            key={r.id || r._id}
                            style={{
                              border: '1px solid var(--line, #e2e8f0)',
                              borderRadius: '12px',
                              background: '#ffffff',
                              padding: '18px 20px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: '#f5f3ff', color: '#7c3aed' }}>
                                    Round {r.roundNumber} ({r.roundId})
                                  </span>
                                  {isPublished ? (
                                    <span className="admin-badge success">PUBLISHED</span>
                                  ) : (
                                    <span className="admin-badge warning">DRAFT</span>
                                  )}
                                  {r.isActive ? (
                                    <span className="admin-badge info">Active</span>
                                  ) : (
                                    <span className="admin-badge">Disabled</span>
                                  )}
                                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                    {r.difficulty} Difficulty
                                  </span>
                                </div>

                                <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
                                  {r.roundTitle}
                                </h4>
                                <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--muted)' }}>
                                  <strong>Dossier:</strong> {r.caseDossierTitle} · <strong>Category:</strong> {r.evidenceCategory}
                                </p>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                                  {r.incidentDescription}
                                </p>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handlePublishCyberRound(r.id || r._id)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--line)',
                                    background: isPublished ? '#f8fafc' : '#ecfdf5',
                                    color: isPublished ? 'var(--text)' : '#059669',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {isPublished ? 'Unpublish' : 'Publish'}
                                </button>

                                <button
                                  onClick={() => handleToggleCyberRound(r.id || r._id)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--line)',
                                    background: 'transparent',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {r.isActive ? 'Disable' : 'Enable'}
                                </button>

                                <button
                                  onClick={() => setPreviewCyberRoundModal(r)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--line)',
                                    background: 'transparent',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Eye size={13} /> Preview
                                </button>

                                <button
                                  onClick={() => setCyberRoundModal({ mode: 'edit', data: r })}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--line)',
                                    background: 'transparent',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Edit size={13} /> Edit
                                </button>

                                <button
                                  onClick={() => setConfirmDeleteCyberRound(r)}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #fee2e2',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>

                                <button
                                  onClick={() => handleToggleExpandRound(r.roundId)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    background: '#0f172a',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {isExpanded ? 'Hide Questions' : `Manage Questions (${r.totalQuestions || 0})`}
                                </button>
                              </div>
                            </div>

                            {/* Collapsible Questions Section */}
                            {isExpanded && (
                              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line, #e2e8f0)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Questions in Round {r.roundNumber} ({questionsForRound.length} Total)
                                  </strong>

                                  <button
                                    onClick={() =>
                                      setCyberQuestionModal({
                                        mode: 'create',
                                        roundId: r.roundId,
                                        data: {
                                          questionOrder: questionsForRound.length + 1,
                                          questionText: '',
                                          optionA: '',
                                          optionB: '',
                                          optionC: '',
                                          optionD: '',
                                          correctAnswer: 'A',
                                          explanation: '',
                                          difficulty: 'Medium',
                                          xpReward: 10,
                                          publicationStatus: 'DRAFT',
                                          status: 'DRAFT',
                                          isActive: true,
                                        },
                                      })
                                    }
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      background: '#0284c7',
                                      color: '#ffffff',
                                      border: 'none',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Plus size={13} /> Add Question
                                  </button>
                                </div>

                                {questionsForRound.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {questionsForRound.map((q) => {
                                      const isQPublished = (q.publicationStatus === 'PUBLISHED' || q.status === 'PUBLISHED');
                                      return (
                                        <div
                                          key={q.id || q._id}
                                          style={{
                                            padding: '12px 14px',
                                            borderRadius: '8px',
                                            background: '#f8fafc',
                                            border: '1px solid var(--line, #e2e8f0)',
                                          }}
                                        >
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1, minWidth: '260px' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)' }}>
                                                  #{q.questionOrder || 1} · {q.questionId}
                                                </span>
                                                {isQPublished ? (
                                                  <span className="admin-badge success" style={{ fontSize: '10px', padding: '1px 6px' }}>PUBLISHED</span>
                                                ) : (
                                                  <span className="admin-badge warning" style={{ fontSize: '10px', padding: '1px 6px' }}>DRAFT</span>
                                                )}
                                                <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                                                  +{q.xpReward || 10} XP
                                                </span>
                                              </div>
                                              <strong style={{ fontSize: '13.5px', color: 'var(--text)' }}>
                                                {q.questionText}
                                              </strong>

                                              {/* 4 Options Grid */}
                                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', marginTop: '8px' }}>
                                                {['A', 'B', 'C', 'D'].map((letter) => {
                                                  const optKey = letter.toLowerCase();
                                                  const optText = q.options?.[optKey] || '';
                                                  const isCorrect = q.correctAnswer === letter;
                                                  return (
                                                    <div
                                                      key={letter}
                                                      style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        background: isCorrect ? '#ecfdf5' : '#ffffff',
                                                        border: isCorrect ? '1px solid #059669' : '1px solid #e2e8f0',
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                      }}
                                                    >
                                                      <span style={{ fontWeight: 800, color: isCorrect ? '#059669' : 'var(--muted)' }}>{letter}.</span>
                                                      <span style={{ color: isCorrect ? '#065f46' : 'var(--text)', fontWeight: isCorrect ? 700 : 400 }}>{optText}</span>
                                                      {isCorrect && <Check size={12} color="#059669" style={{ marginLeft: 'auto' }} />}
                                                    </div>
                                                  );
                                                })}
                                              </div>

                                              {/* Explanation */}
                                              {q.explanation && (
                                                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                                                  <strong>Explanation:</strong> {q.explanation}
                                                </p>
                                              )}
                                            </div>

                                            <div style={{ display: 'flex', gap: '6px' }}>
                                              <button
                                                onClick={() => handlePublishCyberQuestion(q.id || q._id, r.roundId)}
                                                style={{
                                                  padding: '4px 8px',
                                                  borderRadius: '5px',
                                                  border: '1px solid var(--line)',
                                                  background: isQPublished ? '#f8fafc' : '#ecfdf5',
                                                  color: isQPublished ? 'var(--text)' : '#059669',
                                                  fontSize: '11px',
                                                  fontWeight: 700,
                                                  cursor: 'pointer',
                                                }}
                                              >
                                                {isQPublished ? 'Unpublish' : 'Publish'}
                                              </button>

                                              <button
                                                onClick={() =>
                                                  setCyberQuestionModal({
                                                    mode: 'edit',
                                                    roundId: r.roundId,
                                                    data: q,
                                                  })
                                                }
                                                style={{
                                                  padding: '4px 8px',
                                                  borderRadius: '5px',
                                                  border: '1px solid var(--line)',
                                                  background: 'transparent',
                                                  fontSize: '11px',
                                                  cursor: 'pointer',
                                                }}
                                              >
                                                <Edit size={11} /> Edit
                                              </button>

                                              <button
                                                onClick={() =>
                                                  setConfirmDeleteCyberQuestion({
                                                    id: q.id || q._id,
                                                    roundId: r.roundId,
                                                    questionId: q.questionId,
                                                  })
                                                }
                                                style={{
                                                  padding: '4px 8px',
                                                  borderRadius: '5px',
                                                  border: '1px solid #fee2e2',
                                                  background: '#fef2f2',
                                                  color: '#dc2626',
                                                  fontSize: '11px',
                                                  cursor: 'pointer',
                                                }}
                                              >
                                                <Trash2 size={11} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)', fontSize: '13px' }}>
                                    No questions currently in this round. Click "Add Question" to create one.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                      No investigation rounds found. Click "Create Investigation Round" to start.
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 3: SUB-VIEW - DEEPFAKE DETECTION IMAGE MANAGEMENT */}
              {gameSubView === 'images' && (
                <div className="admin-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
                    <div>
                      <button
                        onClick={() => setGameSubView('hub')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'transparent',
                          border: 'none',
                          color: '#0284c7',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          marginBottom: '8px',
                          padding: 0,
                        }}
                      >
                        <ArrowLeft size={16} /> Back to Game Hub
                      </button>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Deepfake Detection: Image Management</h3>
                      <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                        Curated collection of authentic camera photos and AI-generated synthetic images for Deepfake Detection Game
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setImageModal({
                          mode: 'create',
                          data: {
                            imageUrl: '',
                            imageType: 'AI_GENERATED',
                            correctAnswer: 'AI_GENERATED',
                            imageCategory: 'Facial Synthesis',
                            difficulty: 'Medium',
                            status: 'DRAFT',
                            publicationStatus: 'DRAFT',
                            isActive: true,
                            notes: '',
                            explanation: '',
                          },
                        })
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        background: '#000000',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={15} /> Upload Photograph
                    </button>
                  </div>

                  {/* Quick Filter Pill Buttons */}
                  <div className="image-filter-pills">
                    <button
                      type="button"
                      className={`image-filter-pill-btn ${imageTypeFilter === 'ALL' && imageStatusFilter === 'ALL' && imageActiveFilter === 'ALL' ? 'active' : ''}`}
                      onClick={() => {
                        setImageTypeFilter('ALL');
                        setImageStatusFilter('ALL');
                        setImageActiveFilter('ALL');
                        setTimeout(() => loadAllAdminData(), 0);
                      }}
                    >
                      <ImageIcon size={14} /> All Photos
                      <span className="admin-filter-badge">{images.length}</span>
                    </button>

                    <button
                      type="button"
                      className={`image-filter-pill-btn ${imageTypeFilter === 'REAL' ? 'active-real' : ''}`}
                      onClick={() => {
                        setImageTypeFilter(imageTypeFilter === 'REAL' ? 'ALL' : 'REAL');
                        setTimeout(() => loadAllAdminData(), 0);
                      }}
                    >
                      📸 Real Photos
                      <span className="admin-filter-badge">
                        {images.filter(x => x.correctAnswer === 'REAL' || x.imageType === 'REAL').length}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`image-filter-pill-btn ${imageTypeFilter === 'AI_GENERATED' ? 'active-ai' : ''}`}
                      onClick={() => {
                        setImageTypeFilter(imageTypeFilter === 'AI_GENERATED' ? 'ALL' : 'AI_GENERATED');
                        setTimeout(() => loadAllAdminData(), 0);
                      }}
                    >
                      🤖 AI Generated
                      <span className="admin-filter-badge">
                        {images.filter(x => x.correctAnswer === 'AI_GENERATED' || x.imageType === 'AI_GENERATED').length}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`image-filter-pill-btn ${imageActiveFilter === 'true' ? 'active' : ''}`}
                      onClick={() => {
                        setImageActiveFilter(imageActiveFilter === 'true' ? 'ALL' : 'true');
                        setTimeout(() => loadAllAdminData(), 0);
                      }}
                    >
                      🟢 Active Only
                    </button>

                    <button
                      type="button"
                      className={`image-filter-pill-btn ${imageStatusFilter === 'DRAFT' ? 'active' : ''}`}
                      onClick={() => {
                        setImageStatusFilter(imageStatusFilter === 'DRAFT' ? 'ALL' : 'DRAFT');
                        setTimeout(() => loadAllAdminData(), 0);
                      }}
                    >
                      📝 Drafts
                    </button>
                  </div>

                  {/* Filters Row */}
                  <div className="admin-filter-toolbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                      <Search size={15} color="var(--muted)" />
                      <input
                        type="text"
                        placeholder="Search image ID, category, explanation..."
                        value={imageSearch}
                        onChange={(e) => setImageSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadAllAdminData()}
                        className="admin-filter-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <select
                      value={imageTypeFilter}
                      onChange={(e) => {
                        setImageTypeFilter(e.target.value);
                        setTimeout(() => loadAllAdminData(), 0);
                      }}
                      className="admin-filter-select"
                    >
                      <option value="ALL">All Answer Types</option>
                      <option value="REAL">REAL (Camera)</option>
                      <option value="AI_GENERATED">AI_GENERATED</option>
                    </select>

                    <select
                      value={imageStatusFilter}
                      onChange={(e) => {
                        setImageStatusFilter(e.target.value);
                        setTimeout(() => loadAllAdminData(), 0);
                      }}
                      className="admin-filter-select"
                    >
                      <option value="ALL">All Status</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                    </select>

                    <select
                      value={imageActiveFilter}
                      onChange={(e) => {
                        setImageActiveFilter(e.target.value);
                        setTimeout(() => loadAllAdminData(), 0);
                      }}
                      className="admin-filter-select"
                    >
                      <option value="ALL">All States</option>
                      <option value="true">Active Only</option>
                      <option value="false">Disabled Only</option>
                    </select>

                    <select
                      value={imageDifficultyFilter}
                      onChange={(e) => {
                        setImageDifficultyFilter(e.target.value);
                        setTimeout(() => loadAllAdminData(), 0);
                      }}
                      className="admin-filter-select"
                    >
                      <option value="ALL">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>

                    <button
                      onClick={clearImageFilters}
                      className="admin-btn admin-btn-secondary"
                      title="Reset all filters"
                    >
                      <RotateCcw size={14} /> Clear
                    </button>

                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginLeft: 'auto' }}>
                      {images.length} In Bank
                    </span>
                  </div>

                  {/* Images Table */}
                  {images.length > 0 ? (
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Thumbnail</th>
                            <th>Image ID</th>
                            <th>Correct Answer</th>
                            <th>Category</th>
                            <th>Difficulty</th>
                            <th>Explanation</th>
                            <th>Status</th>
                            <th>Active</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {images.map((img) => {
                            const isPub = (img.publicationStatus === 'PUBLISHED' || img.status === 'PUBLISHED');
                            const isReal = (img.correctAnswer === 'REAL' || img.imageType === 'REAL');

                            return (
                              <tr key={img.id}>
                                <td>
                                  <div
                                    onClick={() =>
                                      setZoomImageModal({
                                        imageUrl: img.imageUrl,
                                        title: img.imageId,
                                        notes: img.explanation || img.notes,
                                      })
                                    }
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '6px',
                                      background: '#000000',
                                      overflow: 'hidden',
                                      cursor: 'pointer',
                                      display: 'grid',
                                      placeItems: 'center',
                                    }}
                                    title="Click to zoom photograph"
                                  >
                                    <img
                                      src={img.imageUrl}
                                      alt={img.imageId}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  </div>
                                </td>
                                <td>
                                  <strong style={{ fontSize: '12.5px', fontFamily: 'monospace' }}>{img.imageId}</strong>
                                </td>
                                <td>
                                  {isReal ? (
                                    <span className="admin-badge success" style={{ fontWeight: 800 }}>REAL</span>
                                  ) : (
                                    <span className="admin-badge" style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 800 }}>AI_GENERATED</span>
                                  )}
                                </td>
                                <td style={{ fontSize: '13px' }}>{img.imageCategory}</td>
                                <td>
                                  <span style={{ fontSize: '12px' }}>{img.difficulty}</span>
                                </td>
                                <td style={{ fontSize: '12px', maxWidth: '220px', color: 'var(--muted)' }}>
                                  {img.explanation || img.notes || '—'}
                                </td>
                                <td>
                                  {isPub ? (
                                    <span className="admin-badge success">PUBLISHED</span>
                                  ) : (
                                    <span className="admin-badge warning">DRAFT</span>
                                  )}
                                </td>
                                <td>
                                  {img.isActive ? (
                                    <span className="admin-badge info">Active</span>
                                  ) : (
                                    <span className="admin-badge">Disabled</span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => handlePublishImage(img.id)}
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid var(--line)',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {isPub ? 'Unpublish' : 'Publish'}
                                    </button>

                                    <button
                                      onClick={() => handleToggleImage(img.id)}
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid var(--line)',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {img.isActive ? 'Disable' : 'Enable'}
                                    </button>

                                    <button
                                      onClick={() => setImageModal({ mode: 'edit', data: img })}
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid var(--line)',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <Edit size={12} />
                                    </button>

                                    <button
                                      onClick={() => setConfirmDeleteImage(img)}
                                      style={{
                                        background: '#fef2f2',
                                        border: '1px solid #fee2e2',
                                        color: '#dc2626',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                      No matching photographs found in Image Bank.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}




          {/* ============================================================= */}
          {/* SECTION G: LEADERBOARD */}
          {/* ============================================================= */}
          {activeSection === 'leaderboard' && (
            <div className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Academy Leaderboard Rankings</h3>
                  <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                    Player forensic rankings, total XP, levels, and highest streak telemetry
                  </span>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>Loading leaderboard...</div>
              ) : leaderboard.length > 0 ? (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Level & Title</th>
                        <th>Total XP</th>
                        <th>Accuracy</th>
                        <th>Highest Streak</th>
                        <th>Games Played</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <span
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                fontWeight: 800,
                                fontSize: '12px',
                                background:
                                  p.rank === 1
                                    ? '#fef08a'
                                    : p.rank === 2
                                    ? '#e2e8f0'
                                    : p.rank === 3
                                    ? '#fed7aa'
                                    : '#f1f5f9',
                                color: '#000000',
                              }}
                            >
                              {p.rank}
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontSize: '13.5px' }}>{p.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>{p.email}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: '12.5px' }}>Level {p.level}</span>
                            <span style={{ fontSize: '11px', color: '#0284c7', display: 'block' }}>{p.rankTitle}</span>
                          </td>
                          <td>
                            <strong style={{ fontSize: '14px', color: '#0284c7' }}>
                              {(p.totalXP || 0).toLocaleString()} XP
                            </strong>
                          </td>
                          <td>
                            <strong style={{ fontSize: '13px' }}>{p.accuracyPercentage}%</strong>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>
                              🔥 {p.highestStreak}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px' }}>{p.gamesPlayed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No player rankings recorded yet.
                </div>
              )}
            </div>
          )}


        </main>
      </div>

      {/* =========================================================================
          MODALS & DRAWERS
          ========================================================================= */}

      {/* Detailed User Dossier Modal */}
      {inspectUserModal && (
        <div className="admin-modal-backdrop" onClick={() => setInspectUserModal(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#000000',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '20px',
                    fontWeight: 800,
                  }}
                >
                  {inspectUserModal.user.name[0] || 'U'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800 }}>{inspectUserModal.user.name}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{inspectUserModal.user.email}</span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        background: inspectUserModal.user.role === 'ADMIN' ? '#000000' : '#f1f5f9',
                        color: inspectUserModal.user.role === 'ADMIN' ? '#ffffff' : '#000000',
                        border: '1px solid #000000',
                      }}
                    >
                      {inspectUserModal.user.role}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        background: inspectUserModal.user.isActive ? '#dcfce7' : '#fee2e2',
                        color: inspectUserModal.user.isActive ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {inspectUserModal.user.isActive ? 'Active Account' : 'Deactivated'}
                    </span>
                  </div>
                </div>
              </div>

              <button onClick={() => setInspectUserModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div className="dossier-nav">
              <button
                className={`dossier-tab-btn ${dossierTab === 'profile' ? 'active' : ''}`}
                onClick={() => setDossierTab('profile')}
              >
                Profile & Progression
              </button>
              <button
                className={`dossier-tab-btn ${dossierTab === 'games' ? 'active' : ''}`}
                onClick={() => setDossierTab('games')}
              >
                Game Center Sessions ({inspectUserModal.gameHistory?.length || 0})
              </button>
              <button
                className={`dossier-tab-btn ${dossierTab === 'detections' ? 'active' : ''}`}
                onClick={() => setDossierTab('detections')}
              >
                Detection Scans ({inspectUserModal.detectionHistory?.length || 0})
              </button>
              <button
                className={`dossier-tab-btn ${dossierTab === 'identity' ? 'active' : ''}`}
                onClick={() => setDossierTab('identity')}
              >
                Identity Reports ({inspectUserModal.identityHistory?.length || 0})
              </button>
            </div>

            {/* Tab 1: Profile & XP Progression */}
            {dossierTab === 'profile' && (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total XP</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>
                      {(inspectUserModal.progression.totalXP || 0).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Level & Rank</span>
                    <div style={{ fontSize: '15px', fontWeight: 800 }}>
                      Level {inspectUserModal.progression.currentLevel} · {inspectUserModal.progression.currentRank}
                    </div>
                  </div>
                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Streaks</span>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#f59e0b' }}>
                      🔥 {inspectUserModal.progression.currentStreak} current / {inspectUserModal.progression.highestStreak} best
                    </div>
                  </div>
                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--line)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Games Completed</span>
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>
                      {inspectUserModal.progression.gamesPlayed}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#ffffff', borderRadius: '10px', border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                    Registration & Account Telemetry
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                    <div>Registered: <strong>{new Date(inspectUserModal.user.createdAt).toLocaleString()}</strong></div>
                    <div>Last Login: <strong>{inspectUserModal.user.lastLogin ? new Date(inspectUserModal.user.lastLogin).toLocaleString() : 'Never'}</strong></div>
                    <div>Email Verified: <strong>{inspectUserModal.user.isEmailVerified ? 'Yes' : 'No'}</strong></div>
                    <div>User ID: <span style={{ fontFamily: 'monospace' }}>{inspectUserModal.user.id}</span></div>
                  </div>
                </div>

                {/* Badges / Achievements */}
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px' }}>Unlocked Badges & Achievements</h4>
                  {inspectUserModal.progression.achievements?.length > 0 ? (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {inspectUserModal.progression.achievements.map((ach) => (
                        <div
                          key={ach.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            border: '1px solid var(--line)',
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>{ach.badge || '🎖️'}</span>
                          <div>
                            <strong style={{ fontSize: '12.5px', display: 'block' }}>{ach.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : 'Unlocked'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>No achievements unlocked yet.</span>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Game History */}
            {dossierTab === 'games' && (
              <div>
                {inspectUserModal.gameHistory?.length > 0 ? (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Session</th>
                          <th>Attempted</th>
                          <th>Correct / Incorrect</th>
                          <th>XP Earned</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectUserModal.gameHistory.map((s) => (
                          <tr key={s.id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.sessionId.slice(0, 12)}...</td>
                            <td>{s.questionsAttempted}</td>
                            <td>
                              <span style={{ color: '#059669', fontWeight: 700 }}>{s.correctAnswers}</span> /{' '}
                              <span style={{ color: '#dc2626', fontWeight: 700 }}>{s.incorrectAnswers}</span>
                            </td>
                            <td>
                              <strong style={{ color: '#0284c7' }}>+{s.xpEarned} XP</strong>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: s.status === 'completed' ? '#dcfce7' : '#fef3c7',
                                  color: s.status === 'completed' ? '#15803d' : '#b45309',
                                }}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {new Date(s.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    No game sessions recorded for this user.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Detection History */}
            {dossierTab === 'detections' && (
              <div>
                {inspectUserModal.detectionHistory?.length > 0 ? (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>Classification</th>
                          <th>AI Score</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectUserModal.detectionHistory.map((d) => (
                          <tr key={d.id}>
                            <td><strong>{d.fileName}</strong></td>
                            <td>
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  background: d.classification === 'AI_GENERATED' ? '#000000' : '#ffffff',
                                  color: d.classification === 'AI_GENERATED' ? '#ffffff' : '#000000',
                                  border: '1px solid #000000',
                                }}
                              >
                                {d.classification}
                              </span>
                            </td>
                            <td>{d.score !== null ? `${(d.score * 100).toFixed(1)}%` : '--'}</td>
                            <td style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {new Date(d.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    No forensic scans submitted by this user.
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Identity History */}
            {dossierTab === 'identity' && (
              <div>
                {inspectUserModal.identityHistory?.length > 0 ? (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Report ID</th>
                          <th>Type</th>
                          <th>Decision</th>
                          <th>Similarity</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectUserModal.identityHistory.map((r) => (
                          <tr key={r.id}>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{r.reportId}</td>
                            <td>{r.verificationType}</td>
                            <td>
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  background: r.decision === 'MATCH' ? '#dcfce7' : '#fee2e2',
                                  color: r.decision === 'MATCH' ? '#15803d' : '#b91c1c',
                                }}
                              >
                                {r.decision}
                              </span>
                            </td>
                            <td>{r.similarityScore !== null ? `${r.similarityScore.toFixed(1)}%` : '--'}</td>
                            <td style={{ fontSize: '12px', color: 'var(--muted)' }}>
                              {new Date(r.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    No identity verification reports found for this user.
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setInspectUserModal(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  background: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for User Activation / Deactivation */}
      {confirmToggleUser && (
        <div className="admin-modal-backdrop" onClick={() => setConfirmToggleUser(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: confirmToggleUser.isActive ? '#fef2f2' : '#ecfdf5',
                  color: confirmToggleUser.isActive ? '#dc2626' : '#059669',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>
                {confirmToggleUser.isActive ? 'Deactivate User Account?' : 'Activate User Account?'}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                {confirmToggleUser.isActive
                  ? `Are you sure you want to deactivate ${confirmToggleUser.name} (${confirmToggleUser.email})? They will be unable to log in until reactivated.`
                  : `Are you sure you want to restore access for ${confirmToggleUser.name} (${confirmToggleUser.email})?`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmToggleUser(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleToggleUserConfirmed}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: confirmToggleUser.isActive ? '#dc2626' : '#059669',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {actionLoading ? 'Processing...' : confirmToggleUser.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Create / Edit Modal */}
      {questionModal && (
        <QuestionEditorModal
          modal={questionModal}
          availableImages={images}
          onClose={() => setQuestionModal(null)}
          onSave={handleSaveQuestion}
          loading={actionLoading}
        />
      )}

      {/* Confirmation Modal for Question Deletion */}
      {confirmDeleteQuestion && (
        <div className="admin-modal-backdrop" onClick={() => setConfirmDeleteQuestion(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Trash2 size={22} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>Delete Game Question?</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Are you sure you want to delete "{confirmDeleteQuestion.title}"? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDeleteQuestion(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuestionConfirmed}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {actionLoading ? 'Deleting...' : 'Delete Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Create / Edit Modal */}
      {imageModal && (
        <ImageEditorModal
          modal={imageModal}
          onClose={() => setImageModal(null)}
          onSave={handleSaveImage}
          loading={actionLoading}
        />
      )}

      {/* Confirmation Modal for Image Deletion */}
      {confirmDeleteImage && (
        <div className="admin-modal-backdrop" onClick={() => setConfirmDeleteImage(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Trash2 size={22} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>Delete Photograph?</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Are you sure you want to delete "{confirmDeleteImage.imageId}" from the Image Bank?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDeleteImage(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImageConfirmed}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {actionLoading ? 'Deleting...' : 'Delete Photograph'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom / Full Preview Modal */}
      {/* Cyber Crime Round Editor Modal */}
      {cyberRoundModal && (
        <CyberCrimeRoundEditorModal
          modal={cyberRoundModal}
          onClose={() => setCyberRoundModal(null)}
          onSave={handleSaveCyberRound}
          loading={actionLoading}
        />
      )}

      {/* Cyber Crime Question Editor Modal */}
      {cyberQuestionModal && (
        <CyberCrimeQuestionEditorModal
          modal={cyberQuestionModal}
          onClose={() => setCyberQuestionModal(null)}
          onSave={handleSaveCyberQuestion}
          loading={actionLoading}
        />
      )}

      {/* Confirmation Modal for Cyber Crime Round Deletion */}
      {confirmDeleteCyberRound && (
        <div className="admin-modal-backdrop" onClick={() => setConfirmDeleteCyberRound(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Trash2 size={22} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>Delete Investigation Round?</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Are you sure you want to delete Round {confirmDeleteCyberRound.roundNumber} ("{confirmDeleteCyberRound.roundTitle}") and all of its questions? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDeleteCyberRound(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCyberRoundConfirmed}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {actionLoading ? 'Deleting...' : 'Delete Round'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Cyber Crime Question Deletion */}
      {confirmDeleteCyberQuestion && (
        <div className="admin-modal-backdrop" onClick={() => setConfirmDeleteCyberQuestion(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Trash2 size={22} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>Delete Question?</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
                Are you sure you want to delete question "{confirmDeleteCyberQuestion.questionId || 'selected'}" from this round?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmDeleteCyberQuestion(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCyberQuestionConfirmed}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {actionLoading ? 'Deleting...' : 'Delete Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Complete Cyber Crime Round */}
      {previewCyberRoundModal && (
        <CyberCrimeRoundPreviewModal
          round={previewCyberRoundModal}
          questions={roundQuestionsMap[previewCyberRoundModal.roundId] || []}
          onClose={() => setPreviewCyberRoundModal(null)}
        />
      )}


      {zoomImageModal && (
        <div className="admin-modal-backdrop" onClick={() => setZoomImageModal(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '680px', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{zoomImageModal.title}</h3>
              <button onClick={() => setZoomImageModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ width: '100%', maxHeight: '480px', background: '#000000', borderRadius: '10px', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
              <img
                src={zoomImageModal.imageUrl}
                alt={zoomImageModal.title}
                style={{ maxWidth: '100%', maxHeight: '480px', objectFit: 'contain' }}
              />
            </div>

            {zoomImageModal.notes && (
              <p style={{ marginTop: '14px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                {zoomImageModal.notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Inspection Modal for Detection Records */}
      {inspectDetectionModal && (
        <div className="admin-modal-backdrop" onClick={() => setInspectDetectionModal(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Detection Record Details</h3>
              <button onClick={() => setInspectDetectionModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px', margin: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>Record ID</span>
                <span style={{ fontFamily: 'monospace' }}>{inspectDetectionModal.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>File Name</span>
                <strong>{inspectDetectionModal.fileName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>Classification</span>
                <strong>{inspectDetectionModal.classification}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>AI Score</span>
                <strong>
                  {inspectDetectionModal.score !== null ? `${(inspectDetectionModal.score * 100).toFixed(2)}%` : 'N/A'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>Analyzed User</span>
                <span>{inspectDetectionModal.user ? `${inspectDetectionModal.user.name} (${inspectDetectionModal.user.email})` : 'Anonymous'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>Timestamp</span>
                <span>{new Date(inspectDetectionModal.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setInspectDetectionModal(null)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#000000', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Inspection Modal for Identity Records */}
      {inspectIdentityModal && (
        <div className="admin-modal-backdrop" onClick={() => setInspectIdentityModal(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Identity Verification Record</h3>
              <button onClick={() => setInspectIdentityModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px', margin: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>Report ID</span>
                <span style={{ fontFamily: 'monospace' }}>{inspectIdentityModal.reportId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>Verification Type</span>
                <strong>{inspectIdentityModal.verificationType}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>Decision</span>
                <strong>{inspectIdentityModal.decision}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>Similarity Score</span>
                <strong>{inspectIdentityModal.similarityScore ? `${inspectIdentityModal.similarityScore.toFixed(1)}%` : 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ color: 'var(--muted)' }}>Explanation</span>
                <span style={{ fontSize: '12px' }}>{inspectIdentityModal.explanation || 'Biometric analysis completed'}</span>
              </div>
            </div>

            <button
              onClick={() => setInspectIdentityModal(null)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#000000', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Admin Profile Modal */}
      {adminProfileModal && (
        <div className="admin-modal-backdrop" onClick={() => setAdminProfileModal(false)}>
          <div className="admin-modal-card" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Administrator Profile</h3>
              <button onClick={() => setAdminProfileModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '24px',
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px',
                }}
              >
                {user?.name?.[0] || 'A'}
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '16px' }}>{user?.name}</h4>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{user?.email}</span>
              <div style={{ marginTop: '8px' }}>
                <span style={{ padding: '3px 10px', borderRadius: '6px', background: '#000000', color: '#ffffff', fontSize: '11px', fontWeight: 700 }}>
                  ROLE: {user?.role}
                </span>
              </div>
            </div>

            <div style={{ padding: '16px 0', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>Account Status:</strong> Active Administrator
              </p>
              <p style={{ margin: '0 0 8px' }}>
                <strong>Access Level:</strong> Full administrative governance, user status controls, forensic audits, and question bank management.
              </p>
            </div>

            <button
              onClick={() => setAdminProfileModal(false)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#000000', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Question Editor Modal (Add / Edit)
function QuestionEditorModal({ modal, availableImages, onClose, onSave, loading }) {
  const [questionId, setQuestionId] = useState(modal.data?.questionId || '');
  const [title, setTitle] = useState(modal.data?.title || '');
  const [category, setCategory] = useState(modal.data?.category || 'Facial Synthesis');
  const [difficulty, setDifficulty] = useState(modal.data?.difficulty || 'Medium');
  const [correctAnswer, setCorrectAnswer] = useState(modal.data?.correctAnswer || modal.data?.label || 'AI_GENERATED');
  const [selectedImageId, setSelectedImageId] = useState(modal.data?.imageId || '');
  const [imageUrl, setImageUrl] = useState(modal.data?.imageUrl || '');
  const [clues, setClues] = useState(modal.data?.clues || '');
  const [explanation, setExplanation] = useState(modal.data?.explanation || '');
  const [status, setStatus] = useState(modal.data?.status || 'PUBLISHED');
  const [isActive, setIsActive] = useState(modal.data?.isActive ?? true);
  const [selectedFile, setSelectedFile] = useState(null);

  // If selecting from image bank, auto-fill URL and type
  const handleSelectBankImage = (imgId) => {
    setSelectedImageId(imgId);
    const found = availableImages?.find((img) => img.imageId === imgId);
    if (found) {
      setImageUrl(found.imageUrl);
      setCorrectAnswer(found.imageType);
      if (found.imageCategory) setCategory(found.imageCategory);
      if (found.difficulty) setDifficulty(found.difficulty);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (selectedFile) {
      const fd = new FormData();
      if (questionId.trim()) fd.append('questionId', questionId.trim());
      if (selectedImageId) fd.append('imageId', selectedImageId);
      fd.append('title', title.trim());
      fd.append('category', category.trim());
      fd.append('difficulty', difficulty);
      fd.append('correctAnswer', correctAnswer);
      fd.append('label', correctAnswer);
      fd.append('clues', clues.trim());
      fd.append('explanation', explanation.trim());
      fd.append('status', status);
      fd.append('isActive', isActive);
      fd.append('image', selectedFile);
      if (correctAnswer === 'REAL') fd.append('genuineImage', selectedFile);
      else fd.append('aiImage', selectedFile);
      onSave(fd);
    } else {
      onSave({
        questionId: questionId.trim() || undefined,
        imageId: selectedImageId || undefined,
        title: title.trim(),
        category: category.trim(),
        difficulty,
        correctAnswer: String(correctAnswer || 'A').trim().toUpperCase(),
        label: correctAnswer,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800',
        clues: clues.trim(),
        explanation: explanation.trim(),
        status,
        isActive,
      });
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            {modal.mode === 'create' ? 'Add New Game Question' : 'Edit Game Question'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Question ID (Optional)
              </label>
              <input
                type="text"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                placeholder="Auto-generated if blank"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Question Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Studio Lighting Portrait"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
          </div>

          {/* Image Bank Select or Custom URL */}
          {availableImages && availableImages.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Select From Image Bank (Optional)
              </label>
              <select
                value={selectedImageId}
                onChange={(e) => handleSelectBankImage(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: '#ffffff', fontSize: '13px' }}
              >
                <option value="">-- Choose registered photograph from bank --</option>
                {availableImages.map((img) => (
                  <option key={img.id} value={img.imageId}>
                    {img.imageId} — {img.imageType} ({img.imageCategory})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: '#ffffff' }}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Correct Answer Key</label>
              <div style={{ display: 'flex', gap: '12px', padding: '6px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="correctAnswer"
                    value="REAL"
                    checked={correctAnswer === 'REAL'}
                    onChange={() => setCorrectAnswer('REAL')}
                  />
                  REAL (Camera)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="correctAnswer"
                    value="AI_GENERATED"
                    checked={correctAnswer === 'AI_GENERATED'}
                    onChange={() => setCorrectAnswer('AI_GENERATED')}
                  />
                  AI_GENERATED
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Lifecycle Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: '#ffffff' }}
              >
                <option value="PUBLISHED">PUBLISHED (Eligible for game)</option>
                <option value="DRAFT">DRAFT (Admin only)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Photograph (Upload File or Enter HTTPS URL)
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => setSelectedFile(e.target.files[0] || null)}
              style={{ width: '100%', padding: '6px', marginBottom: '8px' }}
            />
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or enter image URL..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
            />
          </div>

          {imageUrl && (
            <div style={{ height: '110px', background: '#000000', borderRadius: '8px', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
              <img src={imageUrl} alt="Preview" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Clues / Forensic Hints</label>
            <textarea
              rows={2}
              value={clues}
              onChange={(e) => setClues(e.target.value)}
              placeholder="Look for pupil highlights, ear distortion, background fluid symmetry..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Educational Explanation
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Forensic explanation displayed after player answers..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#000000', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponent: Image Editor Modal (Upload / Edit)
function ImageEditorModal({ modal, onClose, onSave, loading }) {
  const [imageUrl, setImageUrl] = useState(modal.data?.imageUrl || '');
  const [imageType, setImageType] = useState(modal.data?.correctAnswer || modal.data?.imageType || 'AI_GENERATED');
  const [imageCategory, setImageCategory] = useState(modal.data?.imageCategory || 'Facial Synthesis');
  const [difficulty, setDifficulty] = useState(modal.data?.difficulty || 'Medium');
  const [status, setStatus] = useState(modal.data?.publicationStatus || modal.data?.status || 'DRAFT');
  const [isActive, setIsActive] = useState(modal.data?.isActive ?? true);
  const [explanation, setExplanation] = useState(modal.data?.explanation || modal.data?.notes || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(modal.data?.imageUrl || '');
  const [formError, setFormError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedFile && !imageUrl.trim()) {
      setFormError('Please choose a photograph file to upload or enter a direct image URL.');
      return;
    }

    if (!imageCategory.trim()) {
      setFormError('Please specify an image category (e.g. Facial Synthesis).');
      return;
    }

    if (selectedFile) {
      const fd = new FormData();
      fd.append('imageType', imageType);
      fd.append('correctAnswer', imageType);
      fd.append('imageCategory', imageCategory.trim());
      fd.append('difficulty', difficulty);
      fd.append('status', status);
      fd.append('publicationStatus', status);
      fd.append('isActive', String(isActive));
      fd.append('notes', explanation.trim());
      fd.append('explanation', explanation.trim());
      fd.append('image', selectedFile);
      onSave(fd);
    } else {
      onSave({
        imageUrl: imageUrl.trim(),
        imageType,
        correctAnswer: imageType,
        imageCategory: imageCategory.trim(),
        difficulty,
        status,
        publicationStatus: status,
        isActive,
        notes: explanation.trim(),
        explanation: explanation.trim(),
      });
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            {modal.mode === 'create' ? 'Register Photograph to Image Bank' : 'Edit Photograph Details'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div style={{ color: '#ef4444', fontSize: '13px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700 }}>
                Photograph Source *
              </label>
              {(selectedFile || imageUrl.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setImageUrl('');
                    setPreviewUrl('');
                    setFormError('');
                  }}
                  style={{
                    fontSize: '11.5px',
                    color: '#0284c7',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  Switch Upload Method
                </button>
              )}
            </div>

            {/* Case A: URL is entered -> local image upload disappears */}
            {imageUrl.trim().length > 0 ? (
              <div style={{ display: 'grid', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setPreviewUrl(e.target.value);
                      setFormError('');
                    }}
                    placeholder="Enter HTTPS direct image URL..."
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setPreviewUrl('');
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Clear URL
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: '#0284c7' }}>
                  ✓ Web Image URL active. Local file upload is hidden.
                </span>
              </div>
            ) : selectedFile ? (
              /* Case B: Local image file is uploaded/selected -> URL disappears */
              <div style={{ display: 'grid', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: '#0f172a' }}>{selectedFile.name}</strong>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>{(selectedFile.size / 1024).toFixed(1)} KB · Local file ready</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove File
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: '#0284c7' }}>
                  ✓ Local photograph selected. URL input field is hidden.
                </span>
              </div>
            ) : (
              /* Case C: Neither chosen yet -> display both choices */
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '14px', textAlign: 'center', background: '#f8fafc' }}>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    style={{ width: '100%', fontSize: '12.5px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                    Choose a genuine or AI portrait photo (PNG, JPG, WEBP)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '2px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>OR ENTER DIRECT URL</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
                </div>

                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setPreviewUrl(e.target.value);
                    setFormError('');
                  }}
                  placeholder="Paste direct HTTPS image URL..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>
            )}
          </div>

          {previewUrl && (
            <div style={{ height: '140px', background: '#000000', borderRadius: '8px', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
              <img src={previewUrl} alt="Preview" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Correct Answer *</label>
              <div style={{ display: 'flex', gap: '12px', padding: '6px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="imageType"
                    value="REAL"
                    checked={imageType === 'REAL'}
                    onChange={() => setImageType('REAL')}
                  />
                  REAL (Authentic Camera)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="imageType"
                    value="AI_GENERATED"
                    checked={imageType === 'AI_GENERATED'}
                    onChange={() => setImageType('AI_GENERATED')}
                  />
                  AI_GENERATED (Deepfake)
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Category *</label>
              <input
                type="text"
                value={imageCategory}
                onChange={(e) => setImageCategory(e.target.value)}
                placeholder="e.g. Facial Synthesis"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: '#ffffff' }}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', background: '#ffffff' }}
              >
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Explanation / Visual Forensic Clues</label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Describe why this photograph is REAL or AI_GENERATED (e.g. skin pore texture, earlobe asymmetry, iris reflections, or generator artifacts)..."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#000000', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : 'Save Photograph'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminDashboard;


// =========================================================================
// CYBER CRIME INVESTIGATION MODAL COMPONENTS
// =========================================================================

function CyberCrimeRoundEditorModal({ modal, onClose, onSave, loading }) {
  const [roundNumber, setRoundNumber] = useState(modal.data?.roundNumber || 1);
  const [roundTitle, setRoundTitle] = useState(modal.data?.roundTitle || '');
  const [caseDossierTitle, setCaseDossierTitle] = useState(modal.data?.caseDossierTitle || 'Case Evidence Dossier');
  const [evidenceCategory, setEvidenceCategory] = useState(modal.data?.evidenceCategory || '');
  const [incidentDescription, setIncidentDescription] = useState(modal.data?.incidentDescription || '');
  const [interceptedCommunication, setInterceptedCommunication] = useState(modal.data?.interceptedCommunication || '');
  const [forensicClues, setForensicClues] = useState(modal.data?.forensicClues || '');
  const [difficulty, setDifficulty] = useState(modal.data?.difficulty || 'Medium');
  const [publicationStatus, setPublicationStatus] = useState(modal.data?.publicationStatus || modal.data?.status || 'DRAFT');
  const [isActive, setIsActive] = useState(modal.data?.isActive ?? true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roundTitle.trim() || !incidentDescription.trim() || !evidenceCategory.trim()) return;

    onSave({
      roundNumber: Number(roundNumber),
      roundTitle: roundTitle.trim(),
      caseDossierTitle: caseDossierTitle.trim() || 'Case Evidence Dossier',
      evidenceCategory: evidenceCategory.trim(),
      incidentDescription: incidentDescription.trim(),
      interceptedCommunication: interceptedCommunication.trim(),
      forensicClues: forensicClues.trim(),
      difficulty,
      publicationStatus,
      status: publicationStatus,
      isActive,
    });
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            {modal.mode === 'create' ? 'Create Investigation Round' : 'Edit Investigation Round'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', maxHeight: '78vh', overflowY: 'auto', paddingRight: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Round #
              </label>
              <input
                type="number"
                min="1"
                value={roundNumber}
                onChange={(e) => setRoundNumber(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Round Title *
              </label>
              <input
                type="text"
                value={roundTitle}
                onChange={(e) => setRoundTitle(e.target.value)}
                placeholder="e.g. The Phishing Trap, The Fake Identity, Network Intrusion..."
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Case Dossier Title *
              </label>
              <input
                type="text"
                value={caseDossierTitle}
                onChange={(e) => setCaseDossierTitle(e.target.value)}
                placeholder="e.g. Case Evidence Dossier, Executive Impersonation..."
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Evidence Category / Topic *
              </label>
              <input
                type="text"
                value={evidenceCategory}
                onChange={(e) => setEvidenceCategory(e.target.value)}
                placeholder="e.g. Email Security & Suspicious Link, Financial Wire Transfer..."
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Incident Description *
            </label>
            <textarea
              rows={3}
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              placeholder="Describe the incident scenario presented to the detective..."
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Intercepted Communication (Optional Raw Email, Chat, or SMS Log)
            </label>
            <textarea
              rows={3}
              value={interceptedCommunication}
              onChange={(e) => setInterceptedCommunication(e.target.value)}
              placeholder="e.g. From: IT Support Desk <support@novatech-security.com>&#10;Subject: Urgent: Account Lock Warning&#10;Link: http://novatech-account-verify.net/login"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontFamily: 'monospace', fontSize: '12.5px', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Forensic Clues (Expandable Clues for Detectives)
            </label>
            <textarea
              rows={3}
              value={forensicClues}
              onChange={(e) => setForensicClues(e.target.value)}
              placeholder="1. Artificial Urgency: Demands verification within 30 minutes.&#10;2. Lookalike domain: novatech-security.com instead of novatech.com."
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Publication Status</label>
              <select
                value={publicationStatus}
                onChange={(e) => setPublicationStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              >
                <option value="DRAFT">Save as Draft</option>
                <option value="PUBLISHED">Published (Visible to Players)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <strong>Active Status</strong> (Inactive rounds are temporarily disabled for normal users)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--line)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Saving...' : modal.mode === 'create' ? 'Create Round' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CyberCrimeQuestionEditorModal({ modal, onClose, onSave, loading }) {
  const [questionOrder, setQuestionOrder] = useState(modal.data?.questionOrder || 1);
  const [questionText, setQuestionText] = useState(modal.data?.questionText || '');
  const [optionA, setOptionA] = useState(modal.data?.options?.a || modal.data?.optionA || '');
  const [optionB, setOptionB] = useState(modal.data?.options?.b || modal.data?.optionB || '');
  const [optionC, setOptionC] = useState(modal.data?.options?.c || modal.data?.optionC || '');
  const [optionD, setOptionD] = useState(modal.data?.options?.d || modal.data?.optionD || '');
  const [correctAnswer, setCorrectAnswer] = useState(
    String(modal.data?.correctAnswer || 'A').toUpperCase()
  );
  const [explanation, setExplanation] = useState(modal.data?.explanation || '');
  const [difficulty, setDifficulty] = useState(modal.data?.difficulty || 'Medium');
  const [xpReward, setXpReward] = useState(modal.data?.xpReward || 10);
  const [publicationStatus, setPublicationStatus] = useState(modal.data?.publicationStatus || modal.data?.status || 'DRAFT');
  const [isActive, setIsActive] = useState(modal.data?.isActive ?? true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!questionText.trim() || !optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim() || !explanation.trim()) {
      return;
    }

    onSave({
      questionOrder: Number(questionOrder),
      questionText: questionText.trim(),
      options: {
        a: optionA.trim(),
        b: optionB.trim(),
        c: optionC.trim(),
        d: optionD.trim(),
      },
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctAnswer: String(correctAnswer || 'A').trim().toUpperCase(),
      explanation: explanation.trim(),
      difficulty,
      xpReward: Number(xpReward) || 10,
      publicationStatus,
      status: publicationStatus,
      isActive,
    });
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
            {modal.mode === 'create' ? 'Add Question to Round' : 'Edit Question Details'}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', maxHeight: '78vh', overflowY: 'auto', paddingRight: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Order #
              </label>
              <input
                type="number"
                min="1"
                value={questionOrder}
                onChange={(e) => setQuestionOrder(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Difficulty & XP Reward
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  placeholder="XP (+10)"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Question Text *
            </label>
            <textarea
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. What is the most obvious warning sign that this email is a phishing attempt?"
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', resize: 'vertical' }}
            />
          </div>

          {/* 4 Answer Options */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Four Answer Options (A, B, C, D) & Select Exactly One Correct Answer:
            </label>

            <div style={{ display: 'grid', gap: '10px' }}>
              {[
                { letter: 'A', value: optionA, setter: setOptionA },
                { letter: 'B', value: optionB, setter: setOptionB },
                { letter: 'C', value: optionC, setter: setOptionC },
                { letter: 'D', value: optionD, setter: setOptionD },
              ].map(({ letter, value, setter }) => {
                const isSelectedCorrect = String(correctAnswer || '').toUpperCase() === letter;
                return (
                  <div
                    key={letter}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: isSelectedCorrect ? '#ecfdf5' : 'var(--surface2, #f8fafc)',
                      border: isSelectedCorrect ? '2px solid #059669' : '1px solid var(--line)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 800, userSelect: 'none' }}>
                      <input
                        type="radio"
                        name="correctAnswerOption"
                        checked={isSelectedCorrect}
                        onChange={() => setCorrectAnswer(letter)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#059669' }}
                      />
                      <span style={{ color: isSelectedCorrect ? '#065f46' : 'var(--text)' }}>
                        Option {letter}
                      </span>
                    </label>

                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={`Enter answer text for Option ${letter}...`}
                      required
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: '#ffffff' }}
                    />

                    <button
                      type="button"
                      onClick={() => setCorrectAnswer(letter)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: isSelectedCorrect ? '1px solid #059669' : '1px solid var(--line)',
                        background: isSelectedCorrect ? '#059669' : '#ffffff',
                        color: isSelectedCorrect ? '#ffffff' : '#64748b',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0,
                      }}
                    >
                      {isSelectedCorrect ? (
                        <>
                          <Check size={13} /> CORRECT
                        </>
                      ) : (
                        'Set as Correct'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
              Educational Explanation * (Presented to player after submission)
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why the correct answer is right and forensic clues to look for..."
              required
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Publication Status</label>
              <select
                value={publicationStatus}
                onChange={(e) => setPublicationStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <strong>Active</strong>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--line)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Saving...' : modal.mode === 'create' ? 'Add Question' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CyberCrimeRoundPreviewModal({ round, questions, onClose }) {
  const [selectedOpt, setSelectedOpt] = useState('a');
  const [previewIdx, setPreviewIdx] = useState(0);
  const q = questions[previewIdx] || null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" style={{ maxWidth: '920px', width: '92vw', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#7c3aed' }}>
              PREVIEW: INVESTIGATION ROUND {round.roundNumber}
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800 }}>
              {round.roundTitle}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Exact Preview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
          {/* Left Panel: Case Dossier */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {round.caseDossierTitle}
              </h4>
              <span className="cyber-round-badge" style={{ fontSize: '11px' }}>
                {round.evidenceCategory}
              </span>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '13.5px', lineHeight: 1.6 }}>
              <strong style={{ fontSize: '11px', textTransform: 'uppercase', color: '#0284c7', display: 'block', marginBottom: '4px' }}>
                Incident Description:
              </strong>
              {round.incidentDescription}
            </div>

            {round.interceptedCommunication && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <strong style={{ fontSize: '11px', textTransform: 'uppercase', color: '#7c3aed', display: 'block', marginBottom: '4px' }}>
                  Intercepted Communication:
                </strong>
                <pre style={{ margin: 0, fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {round.interceptedCommunication}
                </pre>
              </div>
            )}

            {round.forensicClues && (
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#92400e' }}>
                <strong>Forensic Clues:</strong>
                <p style={{ margin: '4px 0 0', whiteSpace: 'pre-line' }}>{round.forensicClues}</p>
              </div>
            )}
          </div>

          {/* Right Panel: Question */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            {q ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>
                    Question {previewIdx + 1} of {questions.length}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7' }}>
                    +{q.xpReward || 10} Global EXP
                  </span>
                </div>

                <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800 }}>
                  {q.questionText}
                </h4>

                <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
                  {['a', 'b', 'c', 'd'].map((letter) => {
                    const optText = q.options?.[letter] || '';
                    const isCorrect = q.correctAnswer?.toLowerCase() === letter;
                    return (
                      <div
                        key={letter}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: isCorrect ? '2px solid #059669' : '1px solid #e2e8f0',
                          background: isCorrect ? '#ecfdf5' : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ fontWeight: 800, textTransform: 'uppercase', color: isCorrect ? '#059669' : '#64748b' }}>
                          {letter.toUpperCase()}.
                        </span>
                        <span style={{ flex: 1, fontWeight: isCorrect ? 700 : 400 }}>{optText}</span>
                        {isCorrect && (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px' }}>
                            CORRECT ANSWER
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div style={{ padding: '10px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', fontSize: '12.5px', color: '#0369a1', marginBottom: '14px' }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}

                {/* Question switcher in preview */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    disabled={previewIdx <= 0}
                    onClick={() => setPreviewIdx((i) => i - 1)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', cursor: previewIdx <= 0 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Question {previewIdx + 1} of {questions.length}
                  </span>
                  <button
                    disabled={previewIdx >= questions.length - 1}
                    onClick={() => setPreviewIdx((i) => i + 1)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--line)', background: 'transparent', cursor: previewIdx >= questions.length - 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                No questions added to this round yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
