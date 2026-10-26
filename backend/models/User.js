import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [70, 'Name must be less than 70 characters long'],
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username must be less than 30 characters long'],
      sparse: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['USER', 'ADMIN'],
        message: 'Role must be either USER or ADMIN',
      },
      default: 'USER',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // Deepfake Detective Game Progression Fields
    totalXP: {
      type: Number,
      default: 0,
      index: true,
    },
    currentLevel: {
      type: Number,
      default: 1,
    },
    currentRank: {
      type: String,
      default: 'Bronze Detective',
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    totalAttempts: {
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
    currentStreak: {
      type: Number,
      default: 0,
    },
    highestStreak: {
      type: Number,
      default: 0,
    },
    achievements: [
      {
        id: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
        name: { type: String },
        description: { type: String },
        icon: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware to automatically hash modified passwords.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Compares candidate password against hashed password.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Returns a sanitized representation of user without sensitive fields.
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    name: this.name,
    username: this.username || this.email.split('@')[0],
    email: this.email,
    role: this.role,
    profilePicture: this.profilePicture || '',
    bio: this.bio || '',
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,
    lastLogin: this.lastLogin,
    totalXP: this.totalXP || 0,
    currentLevel: this.currentLevel || 1,
    currentRank: this.currentRank || 'Bronze Detective',
    gamesPlayed: this.gamesPlayed || 0,
    totalAttempts: this.totalAttempts || 0,
    correctAnswers: this.correctAnswers || 0,
    incorrectAnswers: this.incorrectAnswers || 0,
    inconclusiveAnswers: this.inconclusiveAnswers || 0,
    currentStreak: this.currentStreak || 0,
    highestStreak: this.highestStreak || 0,
    achievements: this.achievements || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
