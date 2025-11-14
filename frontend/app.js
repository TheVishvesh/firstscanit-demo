const API_URL = 'https://firstscanit-api.onrender.com';

document.getElementById('generateForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const productName = document.getElementById('productName').value;
  const brandName = document.getElementById('brandName').value;
  const quantity = document.getElementById('quantity').value;
  
  showLoading();
  hideError();
  hideResult();
  
  try {
    const response = await fetch(`${API_URL}/api/generate-puf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productName,
        brandName,
        quantity
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showResult(data.batch);
    } else {
      showError(data.error || 'Failed to generate PUF-enabled QR codes');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Network error. Make sure backend is running on port 3001');
  } finally {
    hideLoading();
  }
});

function showResult(batch) {
  const resultDiv = document.getElementById('result');
  const qrCodesList = document.getElementById('qrCodesList');
  
  // Clear previous QR codes
  qrCodesList.innerHTML = '';
  
  // Add each QR code
  batch.qrCodes.forEach((code, index) => {
    const qrCard = document.createElement('div');
    qrCard.className = 'qr-card';
    qrCard.innerHTML = `
      <div class="qr-card-header">${code.unitId}</div>
      <div class="qr-display-small">
        <img src="${code.qrImage}" alt="QR Code ${index + 1}" class="qr-image-small">
      </div>
      <div class="qr-card-actions">
        <button onclick="downloadSingleQR('${code.qrImage}', '${code.unitId}')" class="btn-small">
          Download
        </button>
        <a href="${code.verifyUrl}&puf=true" target="_blank" class="btn-small" style="text-decoration: none;">
          Scan & Verify
        </a>
      </div>
    `;
    qrCodesList.appendChild(qrCard);
  });
  
  // Store for later use
  window.currentBatch = batch;
  
  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth' });
}

function downloadSingleQR(qrImage, unitId) {
  const link = document.createElement('a');
  link.download = `firstscanit-${unitId}.png`;
  link.href = qrImage;
  link.click();
}

function downloadAllQRs() {
  if (!window.currentBatch) return;
  
  window.currentBatch.qrCodes.forEach((code, index) => {
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `firstscanit-${code.unitId}.png`;
      link.href = code.qrImage;
      link.click();
    }, index * 500); // Stagger downloads
  });
}

function printAllQRs() {
  if (!window.currentBatch) return;
  
  const printWindow = window.open('', '', 'width=900,height=1200');
  let html = `
    <html>
      <head>
        <title>FirstScanIt QR Codes - ${window.currentBatch.batchId}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          .page-break {
            page-break-after: always;
          }
          h1 {
            text-align: center;
            color: #2563eb;
          }
          h2 {
            color: #666;
            margin-top: 30px;
          }
          .qr-container {
            text-align: center;
            margin: 40px 0;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
          }
          .qr-container img {
            max-width: 300px;
            border: 2px solid #ccc;
            padding: 10px;
          }
          .qr-info {
            margin-top: 10px;
            font-weight: bold;
            color: #333;
          }
        </style>
      </head>
      <body>
        <h1>FirstScanIt PUF-Enabled QR Codes</h1>
        <h2>Batch: ${window.currentBatch.batchId}</h2>
        <p><strong>Product:</strong> ${window.currentBatch.productName}</p>
        <p><strong>Brand:</strong> ${window.currentBatch.brandName}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  `;
  
  window.currentBatch.qrCodes.forEach((code, index) => {
    html += `
      <div class="qr-container ${index > 0 && index % 2 === 0 ? 'page-break' : ''}">
        <h3>${code.unitId}</h3>
        <img src="${code.qrImage}" alt="QR Code ${index + 1}">
        <div class="qr-info">Each QR has unique PUF fingerprint</div>
      </div>
    `;
  });
  
  html += `
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

function showLoading() {
  document.getElementById('loading')?.classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading')?.classList.add('hidden');
}

function showError(message) {
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  document.getElementById('error')?.classList.add('hidden');
}

function hideResult() {
  document.getElementById('result')?.classList.add('hidden');
}
