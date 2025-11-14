const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const blockchain = require('../blockchain/blockchain');
const Block = require('../models/Block');

// Get blockchain
router.get('/chain', authMiddleware, async (req, res) => {
  try {
    const chain = await Block.find().sort({ index: 1 });
    res.json(chain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify blockchain
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const result = await blockchain.verifyChain();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file history
router.get('/history/:fileId', authMiddleware, async (req, res) => {
  try {
    const history = await blockchain.getFileHistory(req.params.fileId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post('/reset', authMiddleware, async (req, res) => {
  try {
    await Block.deleteMany({});
    await blockchain.createGenesisBlock();
    
    const verification = await blockchain.verifyChain();
    
    res.json({ 
      message: 'Blockchain reset successfully',
      verification 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;