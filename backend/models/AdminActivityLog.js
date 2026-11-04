import mongoose from 'mongoose';

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      default: '',
    },
    adminName: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
      default: null,
      index: true,
    },
    targetType: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

adminActivityLogSchema.index({ createdAt: -1 });

export const AdminActivityLog =
  mongoose.models.AdminActivityLog ||
  mongoose.model('AdminActivityLog', adminActivityLogSchema);

export default AdminActivityLog;

