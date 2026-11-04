import mongoose from 'mongoose';

const gameImageSchema = new mongoose.Schema(
  {
    imageId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL or file path is required'],
      trim: true,
    },
    imageCategory: {
      type: String,
      trim: true,
      default: 'Facial Synthesis',
      index: true,
    },
    imageType: {
      type: String,
      enum: {
        values: ['REAL', 'AI_GENERATED'],
        message: 'Image type must be REAL or AI_GENERATED',
      },
      required: [true, 'Image type is required (REAL or AI_GENERATED)'],
      index: true,
    },
    correctAnswer: {
      type: String,
      enum: {
        values: ['REAL', 'AI_GENERATED'],
        message: 'Correct answer must be REAL or AI_GENERATED',
      },
      index: true,
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
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
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'PUBLISHED'],
        message: 'Status must be DRAFT or PUBLISHED',
      },
      default: 'PUBLISHED',
      index: true,
    },
    publicationStatus: {
      type: String,
      enum: {
        values: ['DRAFT', 'PUBLISHED'],
        message: 'Publication status must be DRAFT or PUBLISHED',
      },
      default: 'PUBLISHED',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

gameImageSchema.pre('validate', function () {
  if (this.correctAnswer && !this.imageType) {
    this.imageType = this.correctAnswer;
  } else if (this.imageType && !this.correctAnswer) {
    this.correctAnswer = this.imageType;
  }
  if (this.publicationStatus && !this.status) {
    this.status = this.publicationStatus;
  } else if (this.status && !this.publicationStatus) {
    this.publicationStatus = this.status;
  }
  if (this.explanation && !this.notes) {
    this.notes = this.explanation;
  } else if (this.notes && !this.explanation) {
    this.explanation = this.notes;
  }
});

gameImageSchema.index({ createdAt: -1 });

export const GameImage =
  mongoose.models.GameImage || mongoose.model('GameImage', gameImageSchema);

export default GameImage;

