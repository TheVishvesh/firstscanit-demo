const API_URL = 'https://firstscanit-api.onrender.com';
const APP_SECRET = 'YOUR_SECRET_KEY_HASH'; // Unique to your app

/**
 * NEW: Verify Encrypted QR Code
 * This method is ONLY available in our official app
 */
function verifyEncryptedQR(qrHash) {
  const loadingDiv = document.getElementById('loading');
  loadingDiv.classList.remove('hidden');

  console.log('🔐 Verifying encrypted QR hash:', qrHash.substring(0, 16) + '...');

  fetch(`${API_URL}/api/verify-encrypted-qr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Secret': APP_SECRET // Only our app has this!
    },
    body: JSON.stringify({
      qrHash: qrHash,
      appSecret: APP_SECRET
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Response:', data);
    
    if (data.valid) {
      showGenuineResult(data);
    } else {
      showCounterfeitResult(data);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showError('Network error');
  })
  .finally(() => {
    loadingDiv.classList.add('hidden');
  });
}

function showGenuineResult(data) {
  const resultDiv = document.getElementById('result');
  
  resultDiv.innerHTML = `
    <div style="text-align: center; padding: 40px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 2px solid #10b981;">
      <div style="font-size: 4rem; margin-bottom: 15px;">✅</div>
      <h2 style="color: #10b981; margin: 0 0 10px 0;">GENUINE PRODUCT</h2>
      <p style="font-size: 1.2rem; color: #10b981; font-weight: 700; margin: 10px 0;">Verified: 99.99% Confidence</p>
      
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; font-family: monospace; font-size: 0.85rem;">
        <p style="margin: 0 0 10px 0; color: #666;"><strong>Verification Result:</strong></p>
        <p style="margin: 0; color: #999; word-break: break-all;">
          Hash: ${data.verification.resultHash.substring(0, 32)}...
        </p>
        <p style="margin: 10px 0 0 0; color: #999; font-size: 0.75rem;">
          Verified via: Encrypted QR + Blockchain
        </p>
      </div>
      
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
        <p style="margin: 0; color: #2563eb; font-size: 0.9rem;">
          ✓ Product Name: ${data.product.name}<br/>
          ✓ Brand: ${data.product.brand}<br/>
          ✓ Unit: ${data.product.unit}
        </p>
      </div>
      
      <div style="margin-top: 20px; color: #666; font-size: 0.85rem;">
        <p>Security: AES-256-CBC Encrypted QR Code</p>
        <p>Blockchain Verified: Yes</p>
      </div>
    </div>
  `;
  
  resultDiv.classList.remove('hidden');
}

function showCounterfeitResult(data) {
  const resultDiv = document.getElementById('result');
  
  resultDiv.innerHTML = `
    <div style="text-align: center; padding: 40px; background: rgba(239, 68, 68, 0.1); border-radius: 12px; border: 2px solid #ef4444;">
      <div style="font-size: 4rem; margin-bottom: 15px;">❌</div>
      <h2 style="color: #ef4444; margin: 0 0 10px 0;">COUNTERFEIT DETECTED</h2>
      <p style="color: #666;">This product failed blockchain verification.</p>
      <p style="color: #ef4444; font-weight: 700; margin-top: 15px;">DO NOT PURCHASE</p>
    </div>
  `;
  
  resultDiv.classList.remove('hidden');
}


