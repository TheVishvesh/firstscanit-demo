/**
 * ENDPOINT: Generate Encrypted QR Codes
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
    const generatedCodes = [];

    console.log(`\n🔐 Generating ${quantity} QR Codes for: ${productName}`);

    for (let i = 1; i <= parseInt(quantity); i++) {
      const unitId = `${batchId}-UNIT-${String(i).padStart(4, '0')}`;

      // Create QR data
      const qrData = {
        unitId,
        batchId,
        productName,
        brandName,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(16).toString('hex')
      };

      // Generate QR hash
      const qrHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(qrData))
        .digest('hex');

      // Create QR image
      const qrImage = await qrcode.toDataURL(
        `https://verify.firstscanit.com/verify?qr=${qrHash}`,
        {
          errorCorrectionLevel: 'H',
          width: 400
        }
      );

      // Store in database
      Storage.createBatch({
        unitId,
        batchId,
        productName,
        brandName,
        facility,
        manufacturingDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        encryptedData: JSON.stringify(qrData),
        qrHash: qrHash,
        signature: 'verified'
      });

      generatedCodes.push({
        unitId,
        qrHash,
        qrImage
      });

      console.log(`   ✅ Unit ${i}/${quantity}: ${unitId}`);
    }

    res.json({
      success: true,
      batch: {
        batchId,
        productName,
        brandName,
        facility,
        quantity,
        qrCodes: generatedCodes
      }
    });

  } catch (error) {
    console.error('Error generating QR codes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to generate batch ID
function generateBatchId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `BATCH-${timestamp}-${random}`;
}
