const API_URL = 'https://api.firstscanit.com';

// Check if we're on verify page
const isVerifyPage = window.location.pathname.includes('scan') || window.location.pathname.includes('verify') || window.location.pathname.includes('index');

if (isVerifyPage) {
  // Initialize verify page functionality
  initializeVerifyPage();
}

function initializeVerifyPage() {
  const qrForm = document.getElementById('qrForm');
  const cameraBtn = document.getElementById('cameraBtn');
  const cameraInput = document.getElementById('cameraInput');

  if (qrForm) {
    qrForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const qrData = document.getElementById('qrInput').value;
      if (qrData) {
        verifyEncryptedQR(qrData);
      } else {
        alert('Please paste QR code data or scan a QR code');
      }
    });
  }

  if (cameraBtn) {
    cameraBtn.addEventListener('click', () => {
      cameraInput.click();
    });
  }

  if (cameraInput) {
    cameraInput.addEventListener('change', (e) => {
      // Handle camera upload (simplified)
      alert('Camera feature coming soon - please paste QR data for now');
    });
  }
}

function verifyEncryptedQR(qrHash) {
  const resultSection = document.getElementById('resultSection');
  const resultContainer = document.getElementById('resultContainer');

  if (!resultSection || !resultContainer) {
    console.error('Result elements not found');
    return;
  }

  // Show loading
  resultContainer.innerHTML = `
    <div style="text-align: center; padding: 3rem;">
      <div style="display: inline-block; width: 50px; height: 50px; border: 4px solid #e0e7ff; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: 1rem; color: #666; font-size: 1.1rem;">Verifying product...</p>
      <p style="margin-top: 0.5rem; color: #999; font-size: 0.9rem;">Checking encrypted QR code against blockchain...</p>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth' });

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
  .then(data => showResult(data, resultContainer, resultSection))
  .catch(err => {
    console.error('Error:', err);
    resultContainer.innerHTML = `
      <div style="color: #ef4444; text-align: center; padding: 3rem; background: rgba(239, 68, 68, 0.05); border-radius: 1rem; border: 1px solid rgba(239, 68, 68, 0.2);">
        <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">⚠️ Verification Error</p>
        <p>Error: ${err.message}</p>
        <p style="color: #999; font-size: 0.9rem; margin-top: 1rem;">Please check your internet connection and try again.</p>
      </div>
    `;
  });
}

function showResult(data, resultContainer, resultSection) {
  const isGenuine = data.valid;
  const className = isGenuine ? 'result-genuine' : 'result-counterfeit';

  let html = `
    <div class="result-container ${className}">
      <div class="result-header">
        <div class="result-status">${isGenuine ? '✅' : '❌'}</div>
        <h2 class="result-title">${isGenuine ? 'Genuine Product' : 'Counterfeit Detected'}</h2>
        <p class="result-subtitle">${data.message || 'Verification complete'}</p>
      </div>

      <div style="background: white; padding: 2rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid #e0e7ff;">
        <h3 style="margin-bottom: 1.5rem; color: #333; font-size: 1.1rem;">✓ Verification Details</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;">
          <div>
            <p style="color: #999; font-size: 0.9rem; margin-bottom: 0.5rem;">Confidence Score</p>
            <p style="font-size: 1.75rem; font-weight: 700; color: ${isGenuine ? '#10b981' : '#ef4444'};">${data.confidence || 0}%</p>
          </div>
          <div>
            <p style="color: #999; font-size: 0.9rem; margin-bottom: 0.5rem;">Status</p>
            <p style="font-size: 1.1rem; font-weight: 600; color: #333;">${data.reason}</p>
          </div>
          <div>
            <p style="color: #999; font-size: 0.9rem; margin-bottom: 0.5rem;">Verification Method</p>
            <p style="font-size: 1rem; color: #333;">Encrypted QR + Blockchain</p>
          </div>
          <div>
            <p style="color: #999; font-size: 0.9rem; margin-bottom: 0.5rem;">Timestamp</p>
            <p style="font-size: 0.9rem; color: #666;">${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
  `;

  if (data.product) {
    html += `
      <div style="background: white; padding: 2rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid #e0e7ff;">
        <h3 style="margin-bottom: 1rem; color: #333; font-size: 1.1rem;">📦 Product Information</h3>
        <div style="display: grid; gap: 0.75rem; color: #666;">
          <p><strong style="color: #333;">Product Name:</strong> ${data.product.name || 'N/A'}</p>
          <p><strong style="color: #333;">Brand:</strong> ${data.product.brand || 'N/A'}</p>
          <p><strong style="color: #333;">Unit ID:</strong> ${data.product.unit || 'N/A'}</p>
        </div>
      </div>
    `;
  }

  if (isGenuine) {
    html += `
      <div style="background: rgba(16, 185, 129, 0.1); padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid #10b981;">
        <p style="color: #065f46; font-weight: 600; margin-bottom: 0.5rem;">✓ Product Verified</p>
        <p style="color: #059669; font-size: 0.95rem;">This product has passed all security checks and is genuine. It is safe to purchase and use.</p>
      </div>
    `;
  } else {
    html += `
      <div style="background: rgba(239, 68, 68, 0.1); padding: 1.5rem; border-radius: 0.5rem; border-left: 4px solid #ef4444;">
        <p style="color: #7f1d1d; font-weight: 600; margin-bottom: 0.5rem;">⚠️ DO NOT BUY</p>
        <p style="color: #b91c1c; font-size: 0.95rem;">This product failed verification and is likely counterfeit. Please avoid purchasing and report to relevant authorities if encountered.</p>
      </div>
    `;
  }

  html += `
    </div>

    <div style="margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
      <button onclick="location.href='/'" style="padding: 0.875rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s;">
        ← Generate QR Codes
      </button>
      <button onclick="document.getElementById('qrInput').value = ''; document.getElementById('resultSection').classList.add('hidden');" style="padding: 0.875rem 1.5rem; background: #f3f4f6; color: #333; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s;">
        Verify Another Product
      </button>
    </div>
  `;

  resultContainer.innerHTML = html;
}

// Handle URL parameters if QR data passed in URL
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const qrData = urlParams.get('qr');
  
  if (qrData && isVerifyPage) {
    setTimeout(() => {
      const qrInput = document.getElementById('qrInput');
      if (qrInput) {
        qrInput.value = qrData;
        verifyEncryptedQR(qrData);
      }
    }, 500);
  }
});
