const mongoose = require('mongoose');
const Block = require('../models/Block');
const blockchain = require('../blockchain/blockchain');
require('dotenv').config();

async function resetBlockchain() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all blocks
    await Block.deleteMany({});
    console.log('🗑️  All blocks deleted');

    // Create new genesis block
    await blockchain.createGenesisBlock();
    console.log('✅ New genesis block created');

    // Verify
    const verification = await blockchain.verifyChain();
    console.log('Verification:', verification);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetBlockchain();