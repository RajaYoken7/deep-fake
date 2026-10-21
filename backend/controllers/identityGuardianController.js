import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { IdentityReport } from '../models/IdentityReport.js';
import { compareIdAndSelfieFaces } from '../services/faceComparisonService.js';
import { verifyAiPhotoAndFace } from '../services/aiDetectionService.js';
import { cleanupFiles } from '../middleware/uploadMiddleware.js';
import { isSightengineConfigured } from '../services/sightengineService.js';

/**
 * Health check endpoint for Identity Guardian
 * GET /api/identity-guardian/health
 */
export async function getHealth(req, res) {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: 'healthy',
    feature: 'Identity Guardian Verification Suite',
    timestamp: new Date().toISOString(),
    database: {
      status: dbConnected ? 'connected' : 'disconnected',
      cluster: 'DeepTrustCluster',
      targetDb: 'deeptrust_academy'
    },
    engines: {
      localCvEngine: 'DeepTrust-Spatial-MobileNetV3-Cosine',
      aiDetectionEngine: 'Spectral-FFT-Structural-Artifact-Analyzer',
      sightengineConfigured: isSightengineConfigured(),
      comprefaceConfigured: Boolean(process.env.COMPREFACE_URL && process.env.COMPREFACE_API_KEY)
    },
    privacy: {
      biometricsStored: false,
      retentionPolicy: 'Metadata only, temporary memory/disk purged immediately'
    }
  });
}

/**
 * SECTION A — ID PHOTO VERIFICATION
 * POST /api/identity-guardian/id-photo/verify
 * Expects multipart form data: 'id_photo' and 'selfie'
 */
export async function verifyIdPhoto(req, res) {
  const filesToCleanup = [];

  try {
    const idPhoto = req.files?.id_photo?.[0];
    const selfie = req.files?.selfie?.[0];

    if (!idPhoto || !selfie) {
      if (idPhoto) filesToCleanup.push(idPhoto);
      if (selfie) filesToCleanup.push(selfie);

      return res.status(400).json({
        success: false,
        error: 'Both ID Card Photo and Current Selfie must be uploaded for verification.',
        errorCode: 'MISSING_REQUIRED_UPLOADS'
      });
    }

    filesToCleanup.push(idPhoto, selfie);

    // Run verification service
    const result = await compareIdAndSelfieFaces(idPhoto.path, selfie.path);

    const reportId = `IDG-ID-${uuidv4().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // Map verification status
    let status = 'completed';
    if (result.faceComparison.decision === 'INCONCLUSIVE') {
      status = 'inconclusive';
    }

    // Persist non-biometric report metadata to MongoDB if database is connected
    try {
      if (mongoose.connection.readyState === 1) {
        await IdentityReport.create({
          reportId,
          verificationType: 'id_photo_verification',
          status,
          faceComparison: result.faceComparison,
          imageQuality: result.imageQuality,
          modelInfo: result.modelInfo,
          warnings: result.warnings,
          limitations: result.limitations
        });
      }
    } catch (dbErr) {
      console.warn(`[IdentityGuardian DB Warning] Could not persist report metadata: ${dbErr.message}`);
    }

    return res.status(200).json({
      success: true,
      reportId,
      verificationType: 'id_photo_verification',
      status,
      timestamp,
      faceComparison: result.faceComparison,
      imageQuality: result.imageQuality,
      modelInfo: result.modelInfo,
      warnings: result.warnings,
      limitations: result.limitations
    });
  } catch (error) {
    console.error(`[IdentityGuardian ID Photo Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during ID photo verification.',
      errorCode: 'VERIFICATION_PROCESSING_ERROR'
    });
  } finally {
    // Guaranteed non-destructive temporary file cleanup
    await cleanupFiles(filesToCleanup);
  }
}

/**
 * SECTION B — AI-GENERATED PHOTO VERIFICATION
 * POST /api/identity-guardian/ai-photo/verify
 * Expects multipart form data: 'suspected_photo' and 'reference_photo'
 */
export async function verifyAiPhoto(req, res) {
  const filesToCleanup = [];

  try {
    const suspectedPhoto = req.files?.suspected_photo?.[0];
    const referencePhoto = req.files?.reference_photo?.[0];

    if (!suspectedPhoto || !referencePhoto) {
      if (suspectedPhoto) filesToCleanup.push(suspectedPhoto);
      if (referencePhoto) filesToCleanup.push(referencePhoto);

      return res.status(400).json({
        success: false,
        error: 'Both Suspected AI Photo and Reference Image must be uploaded for verification.',
        errorCode: 'MISSING_REQUIRED_UPLOADS'
      });
    }

    filesToCleanup.push(suspectedPhoto, referencePhoto);

    // Run dual analysis: face comparison + independent AI generation detection
    const result = await verifyAiPhotoAndFace(suspectedPhoto.path, referencePhoto.path);

    const reportId = `IDG-AI-${uuidv4().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    let status = 'completed';
    if (result.faceComparison.decision === 'INCONCLUSIVE' || result.aiImageAnalysis.decision === 'INCONCLUSIVE') {
      status = 'inconclusive';
    }

    // Persist non-biometric report metadata to MongoDB if database is connected
    try {
      if (mongoose.connection.readyState === 1) {
        await IdentityReport.create({
          reportId,
          verificationType: 'ai_photo_verification',
          status,
          faceComparison: result.faceComparison,
          aiImageAnalysis: result.aiImageAnalysis,
          imageQuality: result.imageQuality,
          modelInfo: result.modelInfo,
          warnings: result.warnings,
          limitations: result.limitations
        });
      }
    } catch (dbErr) {
      console.warn(`[IdentityGuardian DB Warning] Could not persist report metadata: ${dbErr.message}`);
    }

    return res.status(200).json({
      success: true,
      reportId,
      verificationType: 'ai_photo_verification',
      status,
      timestamp,
      faceComparison: result.faceComparison,
      aiImageAnalysis: result.aiImageAnalysis,
      imageQuality: result.imageQuality,
      modelInfo: result.modelInfo,
      warnings: result.warnings,
      limitations: result.limitations
    });
  } catch (error) {
    console.error(`[IdentityGuardian AI Photo Error] ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during AI photo verification.',
      errorCode: 'VERIFICATION_PROCESSING_ERROR'
    });
  } finally {
    // Guaranteed non-destructive temporary file cleanup
    await cleanupFiles(filesToCleanup);
  }
}

export default {
  getHealth,
  verifyIdPhoto,
  verifyAiPhoto
};
