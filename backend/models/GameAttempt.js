import mongoose from 'mongoose';

const gameAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for a game attempt'],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      index: true,
    },
    imageReference: {
      type: String,
      required: true,
    },
    userPrediction: {
      type: String,
      enum: ['REAL', 'FAKE'],
      required: true,
    },
    aiClassification: {
      type: String,
      enum: ['AI_GENERATED', 'NOT_AI_GENERATED', 'INCONCLUSIVE', 'ERROR'],
      required: true,
    },
    aiScore: {
      type: Number,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
    xpAwarded: {
      type: Number,
      default: 0,
    },
    streakAtAttempt: {
      type: Number,
      default: 0,
    },
    explanation: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['success', 'inconclusive', 'error'],
      default: 'success',
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

gameAttemptSchema.index({ userId: 1, createdAt: -1 });
gameAttemptSchema.index({ sessionId: 1, createdAt: 1 });

export const GameAttempt = mongoose.models.GameAttempt || mongoose.model('GameAttempt', gameAttemptSchema);
export default GameAttempt;
