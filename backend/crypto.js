const crypto = require('crypto');

function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

function signData(data, privateKey) {
  try {
    const dataString = JSON.stringify(data);
    const signature = crypto.sign('sha256', Buffer.from(dataString), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    });
    return signature.toString('base64');
  } catch (error) {
    throw new Error('Failed to sign data');
  }
}

function verifySignature(data, signatureBase64, publicKey) {
  try {
    const dataString = JSON.stringify(data);
    const signature = Buffer.from(signatureBase64, 'base64');
    return crypto.verify('sha256', Buffer.from(dataString), {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    }, signature);
  } catch (error) {
    return false;
  }
}

function generateBatchId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BATCH-${timestamp}-${random}`;
}

module.exports = { generateKeyPair, signData, verifySignature, generateBatchId };
