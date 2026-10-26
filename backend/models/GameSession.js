import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for a game session'],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    questionsAttempted: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    incorrectAnswers: {
      type: Number,
      default: 0,
    },
    inconclusiveAnswers: {
      type: Number,
      default: 0,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'abandoned'],
        message: 'Status must be active, completed, or abandoned',
      },
      default: 'active',
      index: true,
    },
    sessionBonusAwarded: {
      type: Boolean,
      default: false,
    },
    fiveBonusAwarded: {
      type: Boolean,
      default: false,
    },
    tenBonusAwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

gameSessionSchema.index({ userId: 1, createdAt: -1 });

export const GameSession = mongoose.models.GameSession || mongoose.model('GameSession', gameSessionSchema);
export default GameSession;
