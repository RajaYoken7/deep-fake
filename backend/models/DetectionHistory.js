import mongoose from 'mongoose';

const detectionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      default: 'Uploaded Image',
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },
    classification: {
      type: String,
      required: true,
      enum: ['AI_GENERATED', 'NOT_AI_GENERATED', 'INCONCLUSIVE'],
    },
    score: {
      type: Number,
      default: null,
    },
    threshold: {
      type: Number,
      default: 0.8,
    },
    disclaimer: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DetectionHistory =
  mongoose.models.DetectionHistory ||
  mongoose.model('DetectionHistory', detectionHistorySchema);
export default DetectionHistory;
