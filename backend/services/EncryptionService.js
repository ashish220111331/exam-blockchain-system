const encryptionService = `
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const fs = require('fs');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.key = Buffer.from(process.env.AES_KEY, 'hex');
  }

  // Encrypt file content
  encryptFile(fileContent) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(fileContent);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
      };
    } catch (error) {
      throw new Error(\`Encryption failed: \${error.message}\`);
    }
  }

  // Decrypt file content
  decryptFile(encryptedData, iv) {
    try {
      const encryptedBuffer = Buffer.from(encryptedData, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, ivBuffer);
      
      let decrypted = decipher.update(encryptedBuffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted;
    } catch (error) {
      throw new Error(\`Decryption failed: \${error.message}\`);
    }
  }

  // Generate file hash (SHA-256)
  generateFileHash(fileContent) {
    return crypto.createHash('sha256').update(fileContent).digest('hex');
  }

  // Verify file integrity
  verifyFileIntegrity(fileContent, originalHash) {
    const currentHash = this.generateFileHash(fileContent);
    return currentHash === originalHash;
  }

  // Generate encryption key
  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Encrypt sensitive data (like keys)
  encryptData(data) {
    return CryptoJS.AES.encrypt(data, process.env.ENCRYPTION_KEY).toString();
  }

  // Decrypt sensitive data
  decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

module.exports = new EncryptionService();
`;