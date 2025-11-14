const auditLogModel = `
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'REGISTER',
      'FILE_UPLOAD',
      'FILE_ENCRYPT',
      'FILE_DOWNLOAD',
      'FILE_DELETE',
      'USER_CREATE',
      'USER_UPDATE',
      'USER_DELETE',
      'PASSWORD_CHANGE',
      'BLOCKCHAIN_VERIFY'
    ]
  },
  resourceType: {
    type: String,
    enum: ['USER', 'FILE', 'BLOCKCHAIN', 'SYSTEM']
  },
  resourceId: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  location: {
    country: String,
    region: String,
    city: String
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING'],
    default: 'SUCCESS'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
`;