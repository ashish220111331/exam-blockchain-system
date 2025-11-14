const crypto = require('crypto');
const Block = require('../models/Block');

class Blockchain {
  constructor() {
    this.difficulty = 2;
  }

  calculateHash(index, timestamp, data, previousHash, nonce) {
    // Convert timestamp to consistent format
    const timestampStr = typeof timestamp === 'object' 
      ? timestamp.getTime().toString() 
      : timestamp.toString();
    
    return crypto
      .createHash('sha256')
      .update(index + timestampStr + JSON.stringify(data) + previousHash + nonce)
      .digest('hex');
  }

  async mineBlock(index, timestamp, data, previousHash) {
    let nonce = 0;
    let hash;
    
    do {
      nonce++;
      hash = this.calculateHash(index, timestamp, data, previousHash, nonce);
    } while (!hash.startsWith('0'.repeat(this.difficulty)));

    return { hash, nonce };
  }

  async createGenesisBlock() {
    const existingBlocks = await Block.countDocuments();
    if (existingBlocks > 0) return;

    const timestamp = Date.now();
    const genesisData = {
      fileId: 'genesis',
      filename: 'Genesis Block',
      examDate: new Date(),
      action: 'GENESIS',
      performedBy: 'SYSTEM'
    };

    const { hash, nonce } = await this.mineBlock(0, timestamp, genesisData, '0');

    const genesisBlock = new Block({
      index: 0,
      timestamp: new Date(timestamp),
      data: genesisData,
      previousHash: '0',
      hash: hash,
      nonce: nonce
    });

    await genesisBlock.save();
    console.log('✅ Genesis block created');
  }

  async addBlock(data) {
    const lastBlock = await Block.findOne().sort({ index: -1 });
    
    if (!lastBlock) {
      await this.createGenesisBlock();
      return await this.addBlock(data);
    }

    const newIndex = lastBlock.index + 1;
    const timestamp = Date.now();
    const { hash, nonce } = await this.mineBlock(
      newIndex,
      timestamp,
      data,
      lastBlock.hash
    );

    const newBlock = new Block({
      index: newIndex,
      timestamp: new Date(timestamp),
      data: data,
      previousHash: lastBlock.hash,
      hash: hash,
      nonce: nonce
    });

    await newBlock.save();
    return newBlock;
  }

  async verifyChain() {
    const blocks = await Block.find().sort({ index: 1 });
    
    if (blocks.length === 0) {
      return { valid: false, error: 'No blocks in chain' };
    }

    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // Recalculate hash using stored timestamp
      const calculatedHash = this.calculateHash(
        currentBlock.index,
        currentBlock.timestamp,
        currentBlock.data,
        currentBlock.previousHash,
        currentBlock.nonce
      );

      // Verify current block hash
      if (currentBlock.hash !== calculatedHash) {
        console.error(`Block ${i} hash mismatch`);
        console.error(`Expected: ${calculatedHash}`);
        console.error(`Got: ${currentBlock.hash}`);
        return { valid: false, error: `Block ${i} has been tampered with` };
      }

      // Verify chain link
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`Block ${i} chain link broken`);
        return { valid: false, error: `Block ${i} chain link broken` };
      }

      // Verify proof of work
      if (!currentBlock.hash.startsWith('0'.repeat(this.difficulty))) {
        return { valid: false, error: `Block ${i} does not meet difficulty requirement` };
      }
    }

    return { valid: true, message: 'Blockchain is valid' };
  }

  async getFileHistory(fileId) {
    return await Block.find({ 'data.fileId': fileId }).sort({ index: 1 });
  }

  // NEW: Rebuild corrupted blockchain
  async rebuildChain() {
    console.log('🔄 Rebuilding blockchain...');
    
    const blocks = await Block.find().sort({ index: 1 });
    
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];
      
      // Recalculate hash
      const { hash, nonce } = await this.mineBlock(
        currentBlock.index,
        currentBlock.timestamp.getTime(),
        currentBlock.data,
        previousBlock.hash
      );
      
      currentBlock.hash = hash;
      currentBlock.nonce = nonce;
      currentBlock.previousHash = previousBlock.hash;
      
      await currentBlock.save();
    }
    
    console.log('✅ Blockchain rebuilt successfully');
  }
}

module.exports = new Blockchain();