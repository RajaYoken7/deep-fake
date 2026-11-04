import mongoose from 'mongoose';

const cyberCrimeQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    roundId: {
      type: String,
      required: [true, 'Round ID is required'],
    },
    questionOrder: {
      type: Number,
      default: 1,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      a: {
        type: String,
        required: [true, 'Option A is required'],
        trim: true,
      },
      b: {
        type: String,
        required: [true, 'Option B is required'],
        trim: true,
      },
      c: {
        type: String,
        required: [true, 'Option C is required'],
        trim: true,
      },
      d: {
        type: String,
        required: [true, 'Option D is required'],
        trim: true,
      },
    },
    correctAnswer: {
      type: String,
      enum: {
        values: ['A', 'B', 'C', 'D'],
        message: 'Correct answer must be A, B, C, or D',
      },
      required: [true, 'Correct answer (A, B, C, or D) is required'],
      index: true,
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true,
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
    xpReward: {
      type: Number,
      default: 10,
    },
    publicationStatus: {
      type: String,
      enum: {
        values: ['DRAFT', 'PUBLISHED'],
        message: 'Publication status must be DRAFT or PUBLISHED',
      },
      default: 'DRAFT',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'PUBLISHED'],
        message: 'Status must be DRAFT or PUBLISHED',
      },
      default: 'DRAFT',
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

cyberCrimeQuestionSchema.pre('validate', function () {
  if (this.correctAnswer) {
    this.correctAnswer = String(this.correctAnswer).trim().toUpperCase();
  }
  if (this.publicationStatus && !this.status) {
    this.status = this.publicationStatus;
  } else if (this.status && !this.publicationStatus) {
    this.publicationStatus = this.status;
  }
});

cyberCrimeQuestionSchema.index({ roundId: 1, questionOrder: 1 });
cyberCrimeQuestionSchema.index({ createdAt: -1 });

export const CyberCrimeQuestion =
  mongoose.models.CyberCrimeQuestion ||
  mongoose.model('CyberCrimeQuestion', cyberCrimeQuestionSchema);

export default CyberCrimeQuestion;
