import mongoose from 'mongoose';

/**
 * IdentityReport Schema
 * Stores ONLY non-biometric verification metadata, decisions, confidence scores,
 * and quality metrics.
 * 
 * STRICT PRIVACY REQUIREMENT:
 * Under NO circumstances are raw portrait photos, ID documents, selfies,
 * or raw biometric embeddings saved in the database.
 */
const identityReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  verificationType: {
    type: String,
    required: true,
    enum: ['id_photo_verification', 'ai_photo_verification']
  },
  status: {
    type: String,
    required: true,
    enum: ['completed', 'inconclusive', 'failed']
  },
  faceComparison: {
    decision: {
      type: String,
      required: true,
      enum: ['SAME PERSON', 'DIFFERENT PERSON', 'INCONCLUSIVE']
    },
    similarityScore: {
      type: Number,
      default: null
    },
    threshold: {
      type: Number,
      default: 75.0
    },
    confidence: {
      type: String,
      enum: ['High', 'Moderate', 'Low', 'None'],
      default: 'None'
    },
    explanation: {
      type: String,
      required: true
    }
  },
  aiImageAnalysis: {
    decision: {
      type: String,
      enum: ['LIKELY AI-GENERATED/MANIPULATED', 'LIKELY REAL-LIKE', 'INCONCLUSIVE', null],
      default: null
    },
    aiProbability: {
      type: Number,
      default: null
    },
    confidence: {
      type: String,
      default: null
    },
    explanation: {
      type: String,
      default: null
    },
    warnings: [String]
  },
  imageQuality: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  modelInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  warnings: [String],
  limitations: [String],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // Retain metadata logs for 30 days
  }
}, {
  timestamps: true
});

export const IdentityReport = mongoose.models.IdentityReport || mongoose.model('IdentityReport', identityReportSchema);
export default IdentityReport;
