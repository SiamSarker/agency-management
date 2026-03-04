const mongoose = require('mongoose');

const trashSchema = new mongoose.Schema({
  resourceType: {
    type: String,
    required: true,
    enum: ['Lead', 'Student', 'Task', 'Invoice', 'Branch', 'User', 'File']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resourceData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deletedAt: {
    type: Date,
    default: Date.now
  },
  reason: String,
  canRestore: {
    type: Boolean,
    default: true
  },
  restoredAt: Date,
  restoredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  permanentlyDeletedAt: Date,
  permanentlyDeletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
trashSchema.index({ resourceType: 1, deletedAt: -1 });
trashSchema.index({ deletedBy: 1 });

module.exports = mongoose.model('Trash', trashSchema);
