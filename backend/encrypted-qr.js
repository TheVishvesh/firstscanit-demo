const crypto = require('crypto');
const qrcode = require('qrcode');

/**
 * Encryption Keys (Keep PRIVATE!)
 * In production: Store in AWS KMS or HashiCorp Vault
 */
const ENCRYPTION_KEY = crypto.randomBytes(32); // 256-bit key
const INITIALIZATION_VECTOR = crypto.randomBytes(16);

console.log('🔐 Encryption initialized');

/**
 * Generate Encrypted QR Code
 * Only your app can decrypt it!
 */
function generateEncryptedQR(unitId, batchId, productData) {
  // Step 1: Create payload
  const payload = {
    unitId,
    batchId,
    productName: productData.productName,
    brandName: productData.brandName,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex') // Unique per unit
  };

  // Step 2: Encrypt the payload with AES-256-CBC
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    ENCRYPTION_KEY,
    INITIALIZATION_VECTOR
  );

  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Step 3: Add signature to detect tampering
  const hmac = crypto
    .createHmac('sha256', ENCRYPTION_KEY)
    .update(encrypted)
    .digest('hex');

  // Step 4: Combine encrypted data + HMAC
  const encryptedPayload = `${encrypted}::${hmac}`;

  // Step 5: Create hash (what gets stored)
  const qrHash = crypto
    .createHash('sha256')
    .update(encryptedPayload)
    .digest('hex');

  console.log(`\n🔐 Generated Encrypted QR:`);
  console.log(`   Unit: ${unitId}`);
  console.log(`   QR Hash: ${qrHash.substring(0, 16)}...`);

  return {
    unitId,
    batchId,
    encryptedData: encryptedPayload,
    qrHash,
    // Generate QR code showing the hash (NOT the data!)
    qrContent: `https://firstscanit.com/verify?h=${qrHash}`
  };
}

/**
 * Decrypt QR (Only authorized app can do this)
 */
function decryptQR(encryptedPayload) {
  try {
    // Step 1: Split encrypted data and HMAC
    const [encrypted, receivedHmac] = encryptedPayload.split('::');

    // Step 2: Verify HMAC (detect tampering)
    const expectedHmac = crypto
      .createHmac('sha256', ENCRYPTION_KEY)
      .update(encrypted)
      .digest('hex');

    if (receivedHmac !== expectedHmac) {
      console.log('❌ HMAC verification failed - data tampered!');
      return null;
    }

    // Step 3: Decrypt
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      ENCRYPTION_KEY,
      INITIALIZATION_VECTOR
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (error) {
    console.log('❌ Decryption failed:', error.message);
    return null;
  }
}

/**
 * Create QR Code Image (shows only hash, not actual data)
 */
async function createEncryptedQRImage(qrHash) {
  const qrUrl = `https://firstscanit.com/app?scan=${qrHash}`;
  return await qrcode.toDataURL(qrUrl, {
    errorCorrectionLevel: 'H',
    width: 400
  });
}

module.exports = {
  generateEncryptedQR,
  decryptQR,
  createEncryptedQRImage,
  ENCRYPTION_KEY
};

