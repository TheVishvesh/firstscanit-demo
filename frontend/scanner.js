const API_URL = 'https://firstscanit-api.onrender.com';

// Check if QR data is in URL
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const qrData = urlParams.get('qr');
  
  if (qrData) {
    console.log('QR data found in URL, auto-verifying...');
    document.getElementById('manualQR').value = qrData;
    verifyQRCode(qrData);
  }
});

async function verifyQRCode(qrData) {
  const loadingDiv = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  
  loadingDiv.classList.remove('hidden');
  resultDiv.classList.add('hidden');
  
  try {
    console.log('Sending verification request to:', `${API_URL}/api/verify-puf`);
    
    const response = await fetch(`${API_URL}/api/verify-puf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrData: qrData,
        pufResponses: [] // Empty for now - can add PUF challenges later
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    showVerificationResult(data);
  } catch (error) {
    console.error('Verification error:', error);
    showVerificationResult({
      success: false,
      valid: false,
      reason: 'NETWORK ERROR',
      message: 'Failed to verify. Make sure backend is running on http://localhost:3001',
      confidence: 0
    });
  } finally {
    loadingDiv.classList.add('hidden');
  }
}

function verifyManual() {
  const qrData = document.getElementById('manualQR').value.trim();
  if (qrData) {
    verifyQRCode(qrData);
  } else {
    alert('Please paste QR data');
  }
}

function showVerificationResult(data) {
  const resultDiv = document.getElementById('result');
  
  const isGenuine = data.valid && !data.suspicious;
  const className = isGenuine ? 'genuine' : 'counterfeit';
  
  resultDiv.className = `verification-result ${className}`;
  
  let html = `
    <h2>${data.reason || 'Verification Result'}</h2>
    <p class="confidence">Confidence: ${data.confidence || 0}%</p>
    <p>${data.message || ''}</p>
  `;
  
  if (data.batch) {
    html += `
      <div class="batch-details">
        <h3>Product Details</h3>
        <p><strong>Unit ID:</strong> ${data.batch.unitId || data.batch.batchId || 'N/A'}</p>
        <p><strong>Product:</strong> ${data.batch.productName || 'N/A'}</p>
        <p><strong>Brand:</strong> ${data.batch.brandName || 'N/A'}</p>
        ${data.batch.manufacturingDate ? `<p><strong>Mfg Date:</strong> ${data.batch.manufacturingDate}</p>` : ''}
        ${data.batch.expiryDate ? `<p><strong>Exp Date:</strong> ${data.batch.expiryDate}</p>` : ''}
      </div>
    `;
  }
  
  if (data.suspicious) {
    html += `
      <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.2); border-radius: 8px;">
        <h3>⚠️ WARNING</h3>
        <p>Suspicious activity detected. This may be a counterfeit product.</p>
      </div>
    `;
  }
  
  html += `
    <button onclick="location.href='index.html'" class="btn" style="margin-top: 20px; background: white; color: #000; cursor: pointer;">
      Generate Another QR
    </button>
  `;
  
  resultDiv.innerHTML = html;
  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth' });
}
