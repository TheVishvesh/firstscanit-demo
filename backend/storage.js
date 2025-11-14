const brands = new Map();
const batches = new Map();
const scans = [];

class Storage {
  static createBrand(brandData) {
    const brandId = `BRAND-${Date.now()}`;
    brands.set(brandId, { id: brandId, ...brandData, createdAt: new Date().toISOString() });
    return brands.get(brandId);
  }

  static getBrand(brandId) {
    return brands.get(brandId);
  }

  static createBatch(batchData) {
    batches.set(batchData.batchId, {
      ...batchData,
      createdAt: new Date().toISOString(),
      scanCount: 0,
      firstScan: null
    });
    return batches.get(batchData.batchId);
  }

  static getBatch(batchId) {
    return batches.get(batchId);
  }

  static getAllBatches() {
    return Array.from(batches.values());
  }

  static updateBatch(batchId, updates) {
    const batch = batches.get(batchId);
    if (batch) batches.set(batchId, { ...batch, ...updates });
    return batches.get(batchId);
  }

  static recordScan(scanData) {
    const scan = {
      id: `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...scanData,
      timestamp: new Date().toISOString()
    };
    scans.push(scan);
    return scan;
  }

  static getScansForBatch(batchId) {
    return scans.filter(scan => scan.batchId === batchId);
  }

  static getAllScans() {
    return scans;
  }

  static getStats() {
    return {
      totalBrands: brands.size,
      totalBatches: batches.size,
      totalScans: scans.length,
      genuineScans: scans.filter(s => s.isValid).length,
      counterfeitScans: scans.filter(s => !s.isValid || s.suspicious).length
    };
  }
}

module.exports = Storage;
