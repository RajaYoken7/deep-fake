import { apiRequest } from './apiClient';

export async function getUserProfile() {
  const res = await apiRequest('/api/auth/me');
  return res.data?.user;
}

export async function updateUserProfile(profileData) {
  const res = await apiRequest('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
  return res.data?.user;
}

export async function changeUserPassword(currentPassword, newPassword) {
  const res = await apiRequest('/api/users/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res;
}

export async function getUserHistory() {
  const res = await apiRequest('/api/users/history');
  return res.data || { detections: [], identityReports: [] };
}

export async function deleteDetectionRecord(id) {
  const res = await apiRequest(`/api/detection/history/${id}`, {
    method: 'DELETE',
  });
  return res;
}

export async function getUserStats() {
  const res = await apiRequest('/api/users/stats');
  return res.data || { detections: 0, identityChecks: 0, missions: 0, games: 0 };
}

export async function getUserSessions() {
  const res = await apiRequest('/api/auth/sessions');
  return res.data?.sessions || [];
}

export async function revokeSession(sessionId) {
  const res = await apiRequest(`/api/auth/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  return res;
}

export async function logoutOtherSessions() {
  const res = await apiRequest('/api/auth/logout-other-sessions', {
    method: 'POST',
  });
  return res;
}

export async function getAdminOverview() {
  const res = await apiRequest('/api/admin/overview');
  return res.data;
}

export async function getAdminUsers() {
  const res = await apiRequest('/api/admin/users');
  return res.data?.users || [];
}

export async function toggleAdminUserStatus(userId, isActive) {
  const res = await apiRequest(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  return res.data?.user;
}

export async function getAdminAuditLogs() {
  const res = await apiRequest('/api/admin/audit-logs');
  return res.data?.logs || [];
}

export default {
  getUserProfile,
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
};
