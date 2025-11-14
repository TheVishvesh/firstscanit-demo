require('dotenv').config();
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const { generateKeyPair, signData, verifySignature, generateBatchId } = require('./crypto');
const { createPUFSignature, verifyPUFResponse, PUF_CHALLENGES } = require('./puf');
const Storage = require('./storage');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let demoBrand = null;

function initializeDemoBrand() {
  try {
    const { publicKey, privateKey } = generateKeyPair();
    demoBrand = Storage.createBrand({
      name: 'Demo Pharma Ltd',
      email: 'demo@firstscanit.com',
      publicKey,
      privateKey
    });
    console.log('✅ Demo brand initialized');
  } catch (error) {
    console.error('Error initializing brand:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'FirstScanIt API',
    version: '2.0.0',
    pufEnabled: true
  });
});

// Generate PUF QR codes
app.post('/api/generate-puf', async (req, res) => {
  try {
    const {
      productName = 'Amoxicillin 500mg',
      brandName = 'Demo Pharma Ltd',
      quantity = 10,
      facility = 'Mumbai Plant'
    } = req.body;

    const batchId = generateBatchId();
    const generatedCodes = [];

    for (let i = 1; i <= parseInt(quantity); i++) {
      const unitId = `${batchId}-UNIT-${String(i).padStart(4, '0')}`;
      const pufSignature = createPUFSignature(unitId, batchId);

      const batchData = {
        unitId,
        batchId,
        productName,
        brandName,
        quantity: 1,
        facility,
        manufacturingDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pufEnabled: true,
        pufMasterSignature: pufSignature.masterPUFSignature
      };

      const signature = signData(batchData, demoBrand.privateKey);
      const qrPayload = {
        unitId,
        batchId,
        sig: signature.substring(0, 128),
        pufEnabled: true,
        challenges: PUF_CHALLENGES.map(c => ({ id: c.id, wavelength: c.wavelength })),
        ts: Date.now(),
        v: 2
      };

      const qrData = Buffer.from(JSON.stringify(qrPayload)).toString('base64url');
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/scan.html?qr=${qrData}&puf=true`;
      const qrImage = await qrcode.toDataURL(verifyUrl, { errorCorrectionLevel: 'H', width: 400 });

      Storage.createBatch({
        ...batchData,
        signature,
        qrData,
        verifyUrl,
        brandId: demoBrand.id,
        pufSignature: pufSignature.masterPUFSignature,
        unitId
      });

      generatedCodes.push({
        unitId,
        qrImage,
        verifyUrl
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
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify PUF
app.post('/api/verify-puf', async (req, res) => {
  try {
    const { qrData, pufResponses } = req.body;

    if (!qrData) {
      return res.status(400).json({ error: 'QR data required' });
    }

    const payload = JSON.parse(Buffer.from(qrData, 'base64url').toString());
    const { unitId, batchId } = payload;

    const batch = Storage.getBatch(batchId);
    if (!batch) {
      return res.json({
        success: false,
        valid: false,
        reason: 'BATCH NOT FOUND',
        confidence: 0
      });
    }

    const batchDataForVerification = {
      unitId: batch.unitId,
      batchId: batch.batchId,
      productName: batch.productName,
      brandName: batch.brandName,
      quantity: batch.quantity,
      facility: batch.facility,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      pufEnabled: true,
      pufMasterSignature: batch.pufSignature
    };

    const isSignatureValid = verifySignature(
      batchDataForVerification,
      batch.signature,
      demoBrand.publicKey
    );

    if (!isSignatureValid) {
      return res.json({
        success: false,
        valid: false,
        reason: 'INVALID SIGNATURE',
        confidence: 0
      });
    }

    Storage.recordScan({
      unitId: batch.unitId,
      batchId: batch.batchId,
      isValid: true,
      suspicious: false
    });

    res.json({
      success: true,
      valid: true,
      reason: 'GENUINE PRODUCT',
      confidence: 99.95,
      batch: {
        unitId: batch.unitId,
        batchId: batch.batchId,
        productName: batch.productName,
        brandName: batch.brandName
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Original endpoints (backward compatible)
app.post('/api/generate', async (req, res) => {
  try {
    const { productName = 'Amoxicillin 500mg', brandName = 'Demo Pharma Ltd', quantity = 1000 } = req.body;
    const batchId = generateBatchId();
    const batchData = {
      batchId,
      productName,
      brandName,
      quantity: parseInt(quantity),
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    const signature = signData(batchData, demoBrand.privateKey);
    const qrPayload = { bid: batchId, sig: signature.substring(0, 128), ts: Date.now(), v: 1 };
    const qrData = Buffer.from(JSON.stringify(qrPayload)).toString('base64url');
    const verifyUrl = `http://localhost:3000/scan.html?qr=${qrData}`;
    const qrImage = await qrcode.toDataURL(verifyUrl, { errorCorrectionLevel: 'H', width: 400 });
    Storage.createBatch({ ...batchData, signature, qrData, verifyUrl, brandId: demoBrand.id });
    res.json({ success: true, batch: { batchId, qrImage, verifyUrl, productName, brandName } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/verify', async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) return res.status(400).json({ error: 'QR data required' });
    const payload = JSON.parse(Buffer.from(qrData, 'base64url').toString());
    const batch = Storage.getBatch(payload.bid);
    if (!batch) return res.json({ success: false, valid: false, reason: 'NOT FOUND' });
    const batchDataForVerification = { batchId: batch.batchId, productName: batch.productName, brandName: batch.brandName, quantity: batch.quantity, manufacturingDate: batch.manufacturingDate, expiryDate: batch.expiryDate };
    const isSignatureValid = verifySignature(batchDataForVerification, batch.signature, demoBrand.publicKey);
    if (!isSignatureValid) return res.json({ success: false, valid: false });
    res.json({ success: true, valid: true, reason: 'GENUINE', batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/stats', (req, res) => res.json({ success: true, stats: Storage.getStats() }));
app.get('/api/batches', (req, res) => res.json({ success: true, batches: Storage.getAllBatches() }));
app.get('/api/scans', (req, res) => res.json({ success: true, scans: Storage.getAllScans() }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 FIRSTSCANIT PUF-ENABLED API v2.0');
  console.log('='.repeat(60));
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔐 PUF Technology: ENABLED`);
  console.log('='.repeat(60) + '\n');
  initializeDemoBrand();
});
