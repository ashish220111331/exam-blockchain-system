const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  index: { type: Number, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  data: {
    fileId: String,
    filename: String,
    examDate: Date,
    action: String,
    performedBy: String
  },
  previousHash: { type: String, required: true },
  hash: { type: String, required: true },
  nonce: { type: Number, default: 0 }
});

module.exports = mongoose.model('Block', blockSchema);