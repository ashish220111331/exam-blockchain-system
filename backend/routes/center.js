const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ExamFile = require('../models/ExamFile');
const { authMiddleware, centerOnly } = require('../middleware/auth');
const blockchain = require('../blockchain/blockchain');

// Get all available files
router.get('/files', authMiddleware, centerOnly, async (req, res) => {
  try {
    const files = await ExamFile.find({ encrypted: true }).sort({ examDate: 1 });
    
    const today = new Date().toISOString().split('T')[0];
    
    const filesWithAccess = files.map(file => ({
      ...file.toObject(),
      isAccessible: file.examDate.toISOString().split('T')[0] === today
    }));

    res.json(filesWithAccess);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download file
router.get('/download/:fileId', authMiddleware, centerOnly, async (req, res) => {
  try {
    const file = await ExamFile.findById(req.params.fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if today is exam date
    const today = new Date().toISOString().split('T')[0];
    const examDate = file.examDate.toISOString().split('T')[0];

    if (today !== examDate) {
      return res.status(403).json({ 
        error: 'File not accessible yet. Available on: ' + examDate 
      });
    }

    // Decrypt file
    const encryptedBuffer = Buffer.from(file.encryptedData, 'hex');
    const iv = Buffer.from(file.encryptionIV, 'hex');
    const key = Buffer.from(process.env.AES_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Log access
    file.accessedBy.push({
      centerId: req.user.email,
      centerName: req.user.email,
      accessedAt: new Date()
    });
    await file.save();

    // Add to blockchain
    await blockchain.addBlock({
      fileId: file._id.toString(),
      filename: file.originalName,
      examDate: file.examDate,
      action: 'FILE_ACCESSED',
      performedBy: req.user.email
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.send(decrypted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;