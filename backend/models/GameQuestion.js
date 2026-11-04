import mongoose from 'mongoose';

const gameQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    imageId: {
      type: String,
      default: '',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      trim: true,
      default: 'Facial Synthesis',
      index: true,
    },
    difficulty: {
      type: String,
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard',
      },
      default: 'Medium',
      index: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL or file path is required'],
      trim: true,
    },
    genuineImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    aiImageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    correctAnswer: {
      type: String,
      enum: {
        values: ['REAL', 'AI_GENERATED'],
        message: 'Correct answer must be REAL or AI_GENERATED',
      },
      required: [true, 'Correct answer is required'],
      index: true,
    },
    label: {
      type: String,
      enum: ['REAL', 'AI_GENERATED'],
      default: function () {
        return this.correctAnswer || 'REAL';
      },
      index: true,
    },
    groundTruthClassification: {
      type: String,
      enum: ['NOT_AI_GENERATED', 'AI_GENERATED'],
      default: function () {
        return (this.correctAnswer || this.label) === 'REAL'
          ? 'NOT_AI_GENERATED'
          : 'AI_GENERATED';
      },
    },
    clues: {
      type: String,
      trim: true,
      default: '',
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'PUBLISHED'],
        message: 'Status must be DRAFT or PUBLISHED',
      },
      default: 'PUBLISHED',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

gameQuestionSchema.index({ createdAt: -1 });

export const GameQuestion =
  mongoose.models.GameQuestion ||
  mongoose.model('GameQuestion', gameQuestionSchema);

export default GameQuestion;
