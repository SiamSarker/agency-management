const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'update', 'delete', 'restore',
      'login', 'logout',
      'upload', 'download',
      'assign', 'complete',
      'approve', 'reject'
    ]
  },
  module: {
    type: String,
    required: true,
    enum: ['user', 'lead', 'student', 'task', 'invoice', 'hr', 'file', 'chat', 'report']
  },
  description: {
    type: String,
    required: true
  },
  resourceType: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Index for faster queries
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ module: 1, action: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
