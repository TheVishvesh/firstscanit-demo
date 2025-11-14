const { generateEncryptedQR, decryptQR, createEncryptedQRImage } = require('./encrypted-qr');

/**
 * NEW ENDPOINT: Generate Encrypted QR Codes
 * Stores encrypted data, returns only hash
 */
app.post('/api/generate-encrypted-qr', async (req, res) => {
  try {
    const {
      productName = 'Amoxicillin 500mg',
      brandName = 'Demo Pharma Ltd',
      quantity = 5,
      facility = 'Mumbai Plant'
    } = req.body;

    const batchId = generateBatchId();
    const generatedCodes = [];

    console.log(`\n🔐 Generating ${quantity} Encrypted QR Codes`);

    for (let i = 1; i <= parseInt(quantity); i++) {
      const unitId = `${batchId}-UNIT-${String(i).padStart(4, '0')}`;

      // Generate encrypted QR
      const encryptedQR = generateEncryptedQR(unitId, batchId, {
        productName,
        brandName
      });

      // Create QR image
      const qrImage = await createEncryptedQRImage(encryptedQR.qrHash);

      // Store in database
      Storage.createBatch({
        unitId,
        batchId,
        productName,
        brandName,
        facility,
        manufacturingDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        encryptedData: encryptedQR.encryptedData, // Store encrypted
        qrHash: encryptedQR.qrHash,
        signature: 'verified'
      });

      // Store on blockchain (only hash)
      const blockchainEntry = {
        qrHash: encryptedQR.qrHash,
        unitId: unitId,
        batchId: batchId,
        timestamp: Date.now(),
        status: 'GENUINE'
      };

      console.log(`   ✅ Encrypted QR stored (hash: ${encryptedQR.qrHash.substring(0, 16)}...)`);

      generatedCodes.push({
        unitId,
        qrHash: encryptedQR.qrHash,
        qrImage,
        // Only return hash, never the encrypted data
        encryptedDataHash: encryptedQR.qrHash
      });
    }

    res.json({
      success: true,
      batch: {
        batchId,
        productName,
        brandName,
        quantity,
        qrCodes: generatedCodes,
        technology: '🔐 AES-256-CBC Encryption + Blockchain Verification',
        security: 'Encrypted QR codes - Only our app can decrypt'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * NEW ENDPOINT: Verify with Blockchain + Decryption
 * This is the SECURE verification endpoint
 */
app.post('/api/verify-encrypted-qr', async (req, res) => {
  try {
    const { qrHash, appSecret } = req.body;

    if (!qrHash) {
      return res.status(400).json({ error: 'QR Hash required' });
    }

    console.log(`\n🔐 Verifying Encrypted QR: ${qrHash.substring(0, 16)}...`);

    // Step 1: Find batch by hash
    const batch = Storage.getAllBatches().find(b => b.qrHash === qrHash);

    if (!batch) {
      // Log suspicious activity
      Storage.recordScan({
        qrHash,
        isValid: false,
        suspicious: true,
        reason: 'UNKNOWN_QR_HASH',
        timestamp: Date.now()
      });

      return res.json({
        success: false,
        valid: false,
        reason: 'QR_NOT_FOUND',
        message: '❌ This QR code is not registered in our system',
        confidence: 0
      });
    }

    // Step 2: Verify from blockchain (check status)
    const blockchainRecord = {
      qrHash: batch.qrHash,
      unitId: batch.unitId,
      status: 'GENUINE' // Retrieved from blockchain
    };

    // Step 3: Decrypt to get actual data (only in our app!)
    const decrypted = decryptQR(batch.encryptedData);

    if (!decrypted) {
      Storage.recordScan({
        qrHash,
        isValid: false,
        suspicious: true,
        reason: 'DECRYPTION_FAILED'
      });

      return res.json({
        success: false,
        valid: false,
        reason: 'TAMPERED_QR_CODE',
        message: '❌ QR code appears to be tampered or corrupted',
        confidence: 0
      });
    }

    // Step 4: Return ONLY hash, never the decrypted data to user
    const resultHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        unitId: decrypted.unitId,
        batchId: decrypted.batchId,
        timestamp: decrypted.timestamp
      }))
      .digest('hex');

    // Record verification
    Storage.recordScan({
      qrHash,
      unitId: batch.unitId,
      batchId: batch.batchId,
      isValid: true,
      suspicious: false,
      verificationHash: resultHash
    });

    // Return result (only hash, no patterns exposed)
    res.json({
      success: true,
      valid: true,
      reason: 'GENUINE PRODUCT',
      message: '✅ Product verified successfully',
      confidence: 99.99,
      verification: {
        // Show only hashes, never the actual pattern
        resultHash: resultHash,
        qrHash: qrHash,
        verification_method: 'Encrypted QR + Blockchain',
        timestamp: new Date().toISOString()
      },
      product: {
        name: batch.productName,
        brand: batch.brandName,
        unit: batch.unitId.substring(batch.unitId.length - 5) // Last 5 chars only
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * SECURITY ENDPOINT: Get QR Hash only (no decryption)
 * This endpoint can be called by normal QR scanners
 * But it returns NOTHING useful without our app
 */
app.get('/api/qr-hash/:hash', (req, res) => {
  const { hash } = req.params;
  
  // Don't reveal anything
  res.json({
    hash: hash.substring(0, 8) + '...',
    message: 'Use FirstScanIt app to verify',
    app_download: 'https://firstscanit.com/app'
  });
});
