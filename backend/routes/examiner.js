const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const ExamFile = require('../models/ExamFile');
const { authMiddleware, examinerOnly } = require('../middleware/auth');
const blockchain = require('../blockchain/blockchain');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads', { recursive: true });
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 }
});

// Upload file
router.post('/upload', authMiddleware, examinerOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { examDate, examTime } = req.body;

    // Calculate file hash
    const fileContent = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');

    const examFile = new ExamFile({
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileHash: fileHash,
      examDate: new Date(examDate),
      examTime: examTime,
      uploaderId: req.user.userId,
      uploaderName: req.user.email
    });

    await examFile.save();

    // Add to blockchain
    await blockchain.addBlock({
      fileId: examFile._id.toString(),
      filename: examFile.originalName,
      examDate: examFile.examDate,
      action: 'FILE_UPLOADED',
      performedBy: req.user.email
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: examFile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Encrypt file
router.post('/encrypt/:fileId', authMiddleware, examinerOnly, async (req, res) => {
  try {
    const file = await ExamFile.findById(req.params.fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.encrypted) {
      return res.status(400).json({ error: 'File already encrypted' });
    }

    // Read and encrypt file
    const fileContent = fs.readFileSync(file.filePath);
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(process.env.AES_KEY, 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(fileContent);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Update file record
    file.encrypted = true;
    file.encryptedData = encrypted.toString('hex');
    file.encryptionIV = iv.toString('hex');
    
    await file.save();

    // Delete original file
    fs.unlinkSync(file.filePath);

    // Add to blockchain
    const block = await blockchain.addBlock({
      fileId: file._id.toString(),
      filename: file.originalName,
      examDate: file.examDate,
      action: 'FILE_ENCRYPTED',
      performedBy: req.user.email
    });

    file.blockchainHash = block.hash;
    await file.save();

    res.json({
      message: 'File encrypted successfully',
      blockchainHash: block.hash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get examiner's files
router.get('/files', authMiddleware, examinerOnly, async (req, res) => {
  try {
    const files = await ExamFile.find({ uploaderId: req.user.userId }).sort({ uploadedAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;