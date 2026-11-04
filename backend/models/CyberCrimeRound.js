import mongoose from 'mongoose';

const cyberCrimeRoundSchema = new mongoose.Schema(
  {
    roundId: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    roundNumber: {
      type: Number,
      required: true,
      index: true,
    },
    roundTitle: {
      type: String,
      required: [true, 'Round title is required'],
      trim: true,
    },
    caseDossierTitle: {
      type: String,
      required: [true, 'Case dossier title is required'],
      trim: true,
      default: 'Case Evidence Dossier',
    },
    evidenceCategory: {
      type: String,
      required: [true, 'Evidence category is required'],
      trim: true,
      default: 'Digital Forensics',
    },
    incidentDescription: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
    },
    interceptedCommunication: {
      type: String,
      trim: true,
      default: '',
    },
    forensicClues: {
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

cyberCrimeRoundSchema.pre('validate', function () {
  if (this.publicationStatus && !this.status) {
    this.status = this.publicationStatus;
  } else if (this.status && !this.publicationStatus) {
    this.publicationStatus = this.status;
  }
});

cyberCrimeRoundSchema.index({ createdAt: -1 });

export const CyberCrimeRound =
  mongoose.models.CyberCrimeRound ||
  mongoose.model('CyberCrimeRound', cyberCrimeRoundSchema);

export default CyberCrimeRound;
