const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ExamFile = require('../models/ExamFile');
const Block = require('../models/Block');
const { authMiddleware } = require('../middleware/auth');

// Get dashboard stats
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        examiners: await User.countDocuments({ userType: 'examiner' }),
        centers: await User.countDocuments({ userType: 'center' })
      },
      files: {
        total: await ExamFile.countDocuments(),
        encrypted: await ExamFile.countDocuments({ encrypted: true }),
        unencrypted: await ExamFile.countDocuments({ encrypted: false })
      },
      blockchain: {
        totalBlocks: await Block.countDocuments()
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;