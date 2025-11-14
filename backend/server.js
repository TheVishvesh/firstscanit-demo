const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const qrcode = require('qrcode');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// STORAGE (In-Memory Database)
// ============================================

let batches = [];
let scans = [];

class Storage {
  static createBatch(batchData) {
    const batch = {
      id: batches.length,
      ...batchData,
      createdAt: new Date()
    };
    batches.push(batch);
    return batch;
  }

  static getBatch(batchId) {
    return batches.find(b => b.batchId === batchId);
  }

  static getBatchByHash(qrHash) {
    return batches.find(b => b.qrHash === qrHash);
  }

  static getAllBatches() {
    return batches;
  }

  static recordScan(scanData) {
    const scan = {
      id: scans.length,
      ...scanData,
      timestamp: Date.now()
    };
    scans.push(scan);
    return scan;
  }

  static getScanHistoryForUnit(unitId) {
    return scans.filter(s => s.unitId === unitId);
  }

  static getStats() {
    return {
      totalBatches: batches.length,
      totalScans: scans.length,
      totalUnits: batches.reduce((sum, b) => sum + (b.quantity || 1), 0)
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateBatchId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `BATCH-${timestamp}-${random}`;
}

function generateUnitId(batchId, index) {
  return `${batchId}-UNIT-${String(index).padStart(4, '0')}`;
}

// ============================================
// ENDPOINTS: HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// ENDPOINTS: GENERATE QR CODES
// ============================================

/**
 * Generate Encrypted QR Codes
 * POST /api/generate-qr
 */
app.post('/api/generate-qr', async (req, res) => {
  try {
    const {
      productName = 'Amoxicillin 500mg',
      brandName = 'Demo Pharma Ltd',
      quantity = 5,
      facility = 'Mumbai Plant'
    } = req.body;

    const batchId = generateBatchId();
    const generatedC
