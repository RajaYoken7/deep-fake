/**
 * Identity Guardian API Client Service
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Checks API server and database health status
 */
export async function getIdentityGuardianHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/identity-guardian/health`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      error: err.message
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

  const res = await fetch(`${API_BASE}/api/identity-guardian/id-photo/verify`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(45000) // 45s timeout for deep vision processing
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Verification failed with HTTP ${res.status}`);
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

  const res = await fetch(`${API_BASE}/api/identity-guardian/ai-photo/verify`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(45000)
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || `AI photo analysis failed with HTTP ${res.status}`);
  }

  return data;
}

export default {
  getIdentityGuardianHealth,
  verifyIdPhotoApi,
  verifyAiPhotoApi
};
