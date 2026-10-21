/**
 * Identity Guardian API Client Service
 */

import { apiRequest } from './apiClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Checks API server and database health status
 */
export async function getIdentityGuardianHealth() {
  try {
    return await apiRequest('/api/identity-guardian/health');
  } catch (err) {
    return {
      status: 'offline',
      error: err.message,
    };
  }
}

/**
 * Section A: ID Photo Verification
 * Compares portrait on ID card with current selfie image.
 * @param {File} idPhotoFile 
 * @param {File} selfieFile 
 */
export async function verifyIdPhotoApi(idPhotoFile, selfieFile) {
  const formData = new FormData();
  formData.append('id_photo', idPhotoFile);
  formData.append('selfie', selfieFile);

  const data = await apiRequest('/api/identity-guardian/id-photo/verify', {
    method: 'POST',
    body: formData,
  });

  if (!data?.success) {
    throw new Error(data?.error || data?.message || 'Verification failed');
  }

  return data;
}

/**
 * Section B: AI-Generated Photo Verification
 * Compares suspected image with reference image and analyzes suspected photo for synthetic markers.
 * @param {File} suspectedFile 
 * @param {File} referenceFile 
 */
export async function verifyAiPhotoApi(suspectedFile, referenceFile) {
  const formData = new FormData();
  formData.append('suspected_photo', suspectedFile);
  formData.append('reference_photo', referenceFile);

  const data = await apiRequest('/api/identity-guardian/ai-photo/verify', {
    method: 'POST',
    body: formData,
  });

  if (!data?.success) {
    throw new Error(data?.error || data?.message || 'AI photo analysis failed');
  }

  return data;
}

export default {
  getIdentityGuardianHealth,
  verifyIdPhotoApi,
  verifyAiPhotoApi,
};
