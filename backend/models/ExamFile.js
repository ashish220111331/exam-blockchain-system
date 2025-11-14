const mongoose = require('mongoose');

const examFileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  filePath: String,
  fileSize: Number,
  fileHash: String,
  examDate: Date,
  examTime: String,
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaderName: String,
  encrypted: { type: Boolean, default: false },
  encryptedData: String,
  encryptionIV: String,
  blockchainHash: String,
  uploadedAt: { type: Date, default: Date.now },
  accessedBy: [{
    centerId: String,
    centerName: String,
    accessedAt: Date
  }]
});

module.exports = mongoose.model('ExamFile', examFileSchema);