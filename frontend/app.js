const API_URL = 'https://api.firstscanit.com';

// Initialize when page loads
window.addEventListener('DOMContentLoaded', () => {
  const generateForm = document.getElementById('generateForm');
  const verifyForm = document.getElementById('verifyForm');

  if (generateForm) {
    generateForm.addEventListener('submit', handleGenerateQR);
  }

  if (verifyForm) {
    verifyForm.addEventListener('submit', handleVerifyQR);
  }
});

// ============================================
// GENERATE QR CODE FUNCTIONALITY
// ============================================

function handleGenerateQR(e) {
  e.preventDefault();

  const productName = document.getElementById('productName').value;
  const brandName = document.getElementById('brandName').value;
  const batchNumber = document.getElementById('batchNumber').value;
  const quantity = parseInt(document.getElementById('quantity').value);
  const facility = document.getElementById('facility').value || 'Unknown';
  const mfgDate = document.getElementById('mfgDate').value;
  const expDate = document.getElementById('expDate').value;

  // Update preview
  updatePreview({
    productName,
    brandName,
    batchNumber,
    quantity,
    facility,
    mfgDate,
    expDate
  });

  // Generate QR codes
  generateQRCodes({
    productName,
    brandName,
    batchNumber,
    quantity,
    facility,
    mfgDate,
    expDate
  });
}

function updatePreview(data) {
  const previewInfo = document.getElementById('previewInfo');
  
  previewInfo.innerHTML = `
    <div style="text-align: left;">
      <p><strong>Product:</strong> ${data.productName}</p>
      <p><strong>Brand:</strong> ${data.brandName}</p>
      <p><strong>Batch:</strong> ${data.batchNumber}</p>
      <p><strong>Quantity:</strong> ${data.quantity} units</p>
      <p><strong>Facility:</strong> ${data.facility}</p>
      ${data.mfgDate ? `<p><strong>Mfg Date:</strong> ${data.mfgDate}</p>` : ''}
      ${data.expDate ? `<p><strong>Exp Date:</strong> ${data.expDate}</p>` : ''}
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
        <p style="color: #10b981; font-weight: 600;">✓ Ready to generate ${data.quantity} QR codes</p>
      </div>
    </div>
  `;
}

function generateQRCodes(data) {
  const resultsDiv = document.getElementById('qrResults');
  const container = document.getElementById('qrCodesContainer');

  // Show loading
  resultsDiv.classList.remove('hidden');
  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #e0e7ff; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 1rem; color: #666;">Generating QR codes...</p>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    </div>
  `;

  container.scrollIntoView({ behavior: 'smooth' });

  // Call API
  fetch(`${API_URL}/api/generate-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productName: data.productName,
      brandName: data.brandName,
      quantity: data.quantity,
      facility: data.facility
    })
  })
  .then(r => r.json())
  .then(response => displayQRCodes(response, container))
  .catch(err => {
    console.error('Error:', err);
    container.innerHTML = `
      <div style="grid-column: 1/-1; color: #ef4444; text-align: center; padding: 2rem;">
        <p>Error generating QR codes. Please try again.</p>
      </div>
    `;
  });
}

function displayQRCodes(response, container) {
  if (!response.batch || !response.batch.qrCodes) {
    container.innerHTML = '<p style="color: #999;">No QR codes generated</p>';
    return;
  }

  let html = '';
  response.batch.qrCodes.forEach((qr, index) => {
    html += `
      <div class="qr-card">
        <img src="${qr.qrImage}" alt="QR Code ${index + 1}">
        <p><strong>${qr.unitId}</strong></p>
        <p style="font-size: 0.85rem; color: #999;">${qr.qrHash.substring(0, 12)}...</p>
        <div class="qr-buttons">
          <button onclick="copyToClipboard('${qr.qrHash}')" class="btn btn-secondary">
            📋 Copy
          </button>
          <button onclick="downloadQR('${qr.qrImage}', '${qr.unitId}')" class="btn btn-secondary">
            ⬇️ Download
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('QR hash copied to clipboard!');
  });
}

function downloadQR(imageData, unitId) {
  const link = document.createElement('a');
  link.href = imageData;
  link.download = `${unitId}.png`;
  link.click();
}

// ============================================
// VERIFY QR CODE FUNCTIONALITY
// ============================================

function handleVerifyQR(e) {
  e.preventDefault();

  const qrData = document.getElementById('qrData').value.trim();
  const productSerial = document.getElementById('productSerial').value.trim();

  if (!qrData) {
    alert('Please enter QR code data');
    return;
  }

  verifyQRCode(qrData, productSerial);
}

function verifyQRCode(qrHash, productSerial) {
  const resultCard = document.getElementById('verifyResult');
  const resultContent = document.getElementById('resultContent');

  // Show loading
  resultCard.classList.remove('hidden');
  resultContent.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #e0e7ff; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 1rem; color: #666;">Verifying product...</p>
      <p style="margin-top: 0.5rem; color: #999; font-size: 0.9rem;">Checking encrypted QR code against blockchain...</p>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    </div>
  `;

  resultCard.scrollIntoView({ behavior: 'smooth' });

  // Call API
  fetch(`${API_URL}/api/verify-encrypted-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qrHash: qrHash,
      latitude: 0,
      longitude: 0,
      deviceId: 'web-verify'
    })
  })
  .then(r => r.json())
  .then(data => displayVerificationResult(data, resultContent, resultCard))
  .catch(err => {
    console.error('Error:', err);
    resultContent.innerHTML = `
      <div class="result-status">⚠️</div>
      <h3 class="result-title">Verification Error</h3>
      <p class="result-subtitle">Failed to verify product</p>
      <div class="result-details">
        <p>Error: ${err.message}</p>
        <p>Please check your internet connection and try again.</p>
      </div>
    `;
  });
}

function displayVerificationResult(data, resultContent, resultCard) {
  const isGenuine = data.valid;
  const className = isGenuine ? 'genuine' : 'counterfeit';

  resultCard.classList.add(className);

  let html = `
    <div class="result-status">${isGenuine ? '✅' : '❌'}</div>
    <h3 class="result-title">${isGenuine ? 'Genuine Product' : 'Counterfeit Detected'}</h3>
    <p class="result-subtitle">${data.message || 'Verification complete'}</p>

    <div class="result-details">
      <p><strong>Confidence:</strong> ${data.confidence || 0}%</p>
      <p><strong>Status:</strong> ${data.reason}</p>
      <p><strong>Method:</strong> Encrypted QR + Blockchain</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
  `;

  if (data.product) {
    html += `
      <div class="result-details" style="background: #f0f9ff; border-left: 3px solid #2563eb;">
        <p><strong>Product:</strong> ${data.product.name}</p>
        <p><strong>Brand:</strong> ${data.product.brand}</p>
        <p><strong>Unit ID:</strong> ${data.product.unit}</p>
      </div>
    `;
  }

  if (isGenuine) {
    html += `
      <div class="result-details" style="background: #ecfdf5; border-left: 3px solid #10b981; color: #065f46;">
        <p><strong>✓ Product verified successfully</strong></p>
        <p>This product has passed all security checks and is safe to use.</p>
      </div>
    `;
  } else {
    html += `
      <div class="result-details" style="background: #fee2e2; border-left: 3px solid #ef4444; color: #7f1d1d;">
        <p><strong>⚠️ DO NOT PURCHASE</strong></p>
        <p>This product failed verification and is likely counterfeit.</p>
      </div>
    `;
  }

  html += `
    <div style="text-align: center; margin-top: 1.5rem;">
      <button onclick="document.getElementById('qrData').value = ''; document.getElementById('verifyResult').classList.add('hidden');" class="btn btn-secondary">
        Verify Another Product
      </button>
    </div>
  `;

  resultContent.innerHTML = html;
}

// Handle URL parameters if QR data passed in URL
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const qrData = urlParams.get('qr');
  
  if (qrData) {
    setTimeout(() => {
      const qrInput = document.getElementById('qrData');
      if (qrInput) {
        qrInput.value = qrData;
        verifyQRCode(qrData, '');
      }
    }, 500);
  }
});
