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

// -------------------------------------------------------------
// Admin-Specific API Client Methods
// -------------------------------------------------------------

export async function adminLoginApi(email, password) {
  const res = await apiRequest('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function adminLogoutApi() {
  const res = await apiRequest('/api/admin/auth/logout', {
    method: 'POST',
  });
  return res;
}

export async function getAdminOverview() {
  const res = await apiRequest('/api/admin/dashboard/stats');
  return res.data;
}

export async function getAdminUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/users${query ? `?${query}` : ''}`);
  return res.data;
}

export async function getAdminUserDetails(userId) {
  const res = await apiRequest(`/api/admin/users/${userId}/details`);
  return res.data;
}

export async function toggleAdminUserStatus(userId, isActive) {
  const res = await apiRequest(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
  return res.data?.user;
}

export async function getAdminDetectionHistory(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/detection-history${query ? `?${query}` : ''}`);
  return res.data;
}

export async function getAdminIdentityHistory(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/identity-history${query ? `?${query}` : ''}`);
  return res.data;
}

export async function getAdminQuestions(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/games/questions${query ? `?${query}` : ''}`);
  return res.data;
}

export async function createAdminQuestion(formDataOrJson) {
  const isFormData = formDataOrJson instanceof FormData;
  const res = await apiRequest('/api/admin/games/questions', {
    method: 'POST',
    body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson),
  });
  return res.data?.question;
}

export async function updateAdminQuestion(id, formDataOrJson) {
  const isFormData = formDataOrJson instanceof FormData;
  const res = await apiRequest(`/api/admin/games/questions/${id}`, {
    method: 'PUT',
    body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson),
  });
  return res.data?.question;
}

export async function deleteAdminQuestion(id) {
  const res = await apiRequest(`/api/admin/games/questions/${id}`, {
    method: 'DELETE',
  });
  return res;
}

export async function toggleAdminQuestionStatus(id) {
  const res = await apiRequest(`/api/admin/games/questions/${id}/toggle`, {
    method: 'PATCH',
  });
  return res.data?.question;
}

export async function publishAdminQuestion(id) {
  const res = await apiRequest(`/api/admin/games/questions/${id}/publish`, {
    method: 'PATCH',
  });
  return res.data?.question;
}

// -------------------------------------------------------------
// Image Management API Client Methods
// -------------------------------------------------------------

export async function getAdminImages(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/games/images${query ? `?${query}` : ''}`);
  return res.data;
}

export async function createAdminImage(formDataOrJson) {
  const isFormData = formDataOrJson instanceof FormData;
  const res = await apiRequest('/api/admin/games/images', {
    method: 'POST',
    body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson),
  });
  const img = res.data?.image;
  if (img && !img.id) img.id = img._id;
  return img;
}

export async function updateAdminImage(id, formDataOrJson) {
  const isFormData = formDataOrJson instanceof FormData;
  const res = await apiRequest(`/api/admin/games/images/${id}`, {
    method: 'PUT',
    body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson),
  });
  const img = res.data?.image;
  if (img && !img.id) img.id = img._id;
  return img;
}

export async function deleteAdminImage(id) {
  const res = await apiRequest(`/api/admin/games/images/${id}`, {
    method: 'DELETE',
  });
  return res;
}

export async function toggleAdminImageStatus(id) {
  const res = await apiRequest(`/api/admin/games/images/${id}/toggle`, {
    method: 'PATCH',
  });
  return res.data?.image;
}

export async function publishAdminImage(id) {
  const res = await apiRequest(`/api/admin/games/images/${id}/publish`, {
    method: 'PATCH',
  });
  return res.data?.image;
}

export async function getAdminGameHistory(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/games/history${query ? `?${query}` : ''}`);
  return res.data;
}

export async function getAdminLeaderboard(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/leaderboard${query ? `?${query}` : ''}`);
  return res.data;
}

export async function getAdminReports(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/reports${query ? `?${query}` : ''}`);
  return res.data;
}

export function getAdminReportCsvUrl(params = {}) {
  const query = new URLSearchParams({ ...params, format: 'csv' }).toString();
  const rawBase = import.meta.env.VITE_API_URL || '';
  const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
  return `${base}/api/admin/reports?${query}`;
}

export async function getAdminAuditLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/activity-logs${query ? `?${query}` : ''}`);
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
  adminLoginApi,
  adminLogoutApi,
  getAdminOverview,
  getAdminUsers,
  toggleAdminUserStatus,
  getAdminDetectionHistory,
  getAdminIdentityHistory,
  getAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  toggleAdminQuestionStatus,
  getAdminGameHistory,
  getAdminLeaderboard,
  getAdminReports,
  getAdminReportCsvUrl,
  getAdminAuditLogs,
};

export async function getAdminCyberCrimeRounds(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/cybercrime/rounds${query ? `?${query}` : ''}`);
  return res.data;
}

export async function createAdminCyberCrimeRound(data) {
  const res = await apiRequest('/api/admin/cybercrime/rounds', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data?.round;
}

export async function updateAdminCyberCrimeRound(id, data) {
  const res = await apiRequest(`/api/admin/cybercrime/rounds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data?.round;
}

export async function deleteAdminCyberCrimeRound(id) {
  const res = await apiRequest(`/api/admin/cybercrime/rounds/${id}`, {
    method: 'DELETE',
  });
  return res;
}

export async function publishAdminCyberCrimeRound(id) {
  const res = await apiRequest(`/api/admin/cybercrime/rounds/${id}/publish`, {
    method: 'PATCH',
  });
  return res.data?.round;
}

export async function toggleAdminCyberCrimeRound(id) {
  const res = await apiRequest(`/api/admin/cybercrime/rounds/${id}/toggle`, {
    method: 'PATCH',
  });
  return res.data?.round;
}

export async function getAdminCyberCrimeQuestions(roundId, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await apiRequest(`/api/admin/cybercrime/rounds/${roundId}/questions${query ? `?${query}` : ''}`);
  return res.data;
}

export async function createAdminCyberCrimeQuestion(roundId, data) {
  const res = await apiRequest(`/api/admin/cybercrime/rounds/${roundId}/questions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data?.question;
}

export async function updateAdminCyberCrimeQuestion(id, data) {
  const res = await apiRequest(`/api/admin/cybercrime/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.data?.question;
}

export async function deleteAdminCyberCrimeQuestion(id) {
  const res = await apiRequest(`/api/admin/cybercrime/questions/${id}`, {
    method: 'DELETE',
  });
  return res;
}

export async function publishAdminCyberCrimeQuestion(id) {
  const res = await apiRequest(`/api/admin/cybercrime/questions/${id}/publish`, {
    method: 'PATCH',
  });
  return res.data?.question;
}

export async function toggleAdminCyberCrimeQuestion(id) {
  const res = await apiRequest(`/api/admin/cybercrime/questions/${id}/toggle`, {
    method: 'PATCH',
  });
  return res.data?.question;
}

export async function reorderAdminCyberCrimeQuestions(roundId, questionIds) {
  const res = await apiRequest(`/api/admin/cybercrime/rounds/${roundId}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ questionIds }),
  });
  return res;
}
