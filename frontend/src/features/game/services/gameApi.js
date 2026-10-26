import { apiRequest } from '../../../services/apiClient';

/**
 * Initializes a new game session on the backend.
 * Returns session ID, curated challenges list, and current user game stats.
 */
export async function startGameSession() {
  const response = await apiRequest('/api/game/start', {
    method: 'POST',
  });
  return response?.data;
}

/**
 * Submits an answer prediction for either a curated challenge or an uploaded image.
 */
export async function submitGamePrediction({
  sessionId,
  userPrediction, // 'REAL' | 'FAKE'
  challengeId = null,
  file = null,
}) {
  if (file) {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('userPrediction', userPrediction);
    formData.append('media', file);
    if (challengeId) formData.append('challengeId', challengeId);

    const response = await apiRequest('/api/game/submit', {
      method: 'POST',
      body: formData,
    });
    return response?.data;
  }

  const response = await apiRequest('/api/game/submit', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      userPrediction,
      challengeId,
    }),
  });
  return response?.data;
}

/**
 * Completes the active game session and awards completion bonuses.
 */
export async function completeGameSession(sessionId) {
  const response = await apiRequest('/api/game/complete', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
  return response?.data;
}

/**
 * Retrieves the logged-in user's complete game statistics and level progress.
 */
export async function getUserGameStats() {
  const response = await apiRequest('/api/game/stats', {
    method: 'GET',
  });
  return response?.data;
}

/**
 * Retrieves the user's previous game sessions and attempts history.
 */
export async function getGameHistory() {
  const response = await apiRequest('/api/game/history', {
    method: 'GET',
  });
  return response?.data;
}

/**
 * Retrieves the global leaderboard with period filtering ('all_time' | 'monthly' | 'weekly').
 */
export async function getLeaderboard(filter = 'all_time', limit = 100) {
  const response = await apiRequest(`/api/game/leaderboard?filter=${filter}&limit=${limit}`, {
    method: 'GET',
  });
  return response?.data;
}

/**
 * Retrieves the logged-in user's ranking position on the leaderboard.
 */
export async function getMyRanking(filter = 'all_time') {
  const response = await apiRequest(`/api/game/leaderboard/me?filter=${filter}`, {
    method: 'GET',
  });
  return response?.data;
}

/**
 * Retrieves the full achievements catalog with unlock statuses.
 */
export async function getAchievements() {
  const response = await apiRequest('/api/game/achievements', {
    method: 'GET',
  });
  return response?.data;
}

/**
 * Retrieves curated challenges list.
 */
export async function getChallenges() {
  const response = await apiRequest('/api/game/challenges', {
    method: 'GET',
  });
  return response?.data;
}

/**
 * Claims authoritative EXP reward from Cyber Crime Investigation.
 * Synchronizes with user's global profile balance and updates levels/achievements.
 */
export async function claimCyberCrimeReward({
  rewardType, // 'campaign' | 'mission'
  attemptId = null,
  correctCount = 0,
  missionId = null,
  dateKey = null,
}) {
  const response = await apiRequest('/api/game/cyber-crime/reward', {
    method: 'POST',
    body: JSON.stringify({
      rewardType,
      attemptId,
      correctCount,
      missionId,
      dateKey,
    }),
  });
  return response?.data || response;
}

