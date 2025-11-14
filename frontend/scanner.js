const API_URL = 'https://firstscanit-api.onrender.com';

// PUF Challenge visualization
const PUF_CHALLENGES = [
  { id: 1, wavelength: 780, angle: 0, description: 'Infrared Horizontal' },
  { id: 2, wavelength: 850, angle: 45, description: 'Infrared 45°' },
  { id: 3, wavelength: 940, angle: 90, description: 'Infrared Vertical' },
  { id: 4, wavelength: 1064, angle: 135, description: 'Infrared 135°' }
];

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const qrData = urlParams.get('qr');
  
  if (qrData) {
    console.log('QR data found in URL, auto-verifying...');
    document.getElementById('manualQR').value = qrData;
    
    // Start with PUF challenges first
    showPUFChallenge(qrData);
  }
});

/**
 * Show PUF Challenge Interface
 * In real implementation: Send light challenges to phone camera
 * For demo: Simulate PUF response
 */
function showPUFChallenge(qrData) {
  const loadingDiv = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  
  loadingDiv.classList.remove('hidden');
  resultDiv.classList.add('hidden');
  
  // Show PUF challenge interface
  setTimeout(() => {
    showPUFChallengeUI(qrData);
  }, 1000);
}

function showPUFChallengeUI(qrData) {
  const loadingDiv = document.getElementById('loading');
  
  // Create PUF challenge UI
  let challengeHTML = `
    <div style="padding: 20px; background: #f0f9ff; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #2563eb; margin-bottom: 15px;">🔬 Physical Unclonable Function (PUF) Verification</h3>
      
      <p style="color: #666; margin-bottom: 20px;">
        <strong>Step 1 of 2:</strong> Scanning physical label pattern...
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
  `;
  
  // Show each challenge
  PUF_CHALLENGES.forEach((challenge, index) => {
    challengeHTML += `
      <div style="padding: 15px; background: white; border: 2px solid #e0e7ff; border-radius: 8px; text-align: center; animation: fadeIn 0.5s ease-in-out ${index * 0.1}s both;">
        <div style="font-size: 2rem; margin-bottom: 10px;">📡</div>
        <p style="font-weight: 600; margin: 5px 0; color: #2563eb;">${challenge.wavelength}nm</p>
        <p style="font-size: 0.85rem; color: #666; margin: 0;">${challenge.angle}° angle</p>
        <p style="font-size: 0.75rem; color: #999; margin-top: 8px;">${challenge.description}</p>
      </div>
    `;
  });
  
  challengeHTML += `
      </div>
      
      <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
        <p style="font-size: 0.9rem; color: #666; margin: 0;">
          <strong>What's happening:</strong> The system is sending different light wavelengths 
          (780nm - 1064nm infrared spectrum) to read the microscopic fiber pattern on the label.
        </p>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button onclick="simulatePUFResponse('${qrData}')" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
          ✓ Scan PUF Pattern
        </button>
        <button onclick="skipPUFChallenge('${qrData}')" style="padding: 10px 20px; background: #f3f4f6; color: #333; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer;">
          Skip (Demo)
        </button>
      </div>
    </div>
    
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    </style>
  `;
  
  loadingDiv.innerHTML = `<div>${challengeHTML}</div>`;
}

/**
 * Simulate PUF Response
 * In real system: Use camera to capture light response
 * For demo: Generate valid PUF responses
 */
function simulatePUFResponse(qrData) {
  const loadingDiv = document.getElementById('loading');
  
  loadingDiv.innerHTML = `
    <div style="text-align: center; padding: 30px;">
      <div style="font-size: 2rem; margin-bottom: 10px;">🔬</div>
      <p style="font-weight: 600; margin-bottom: 10px;">Reading PUF Pattern...</p>
      <p style="color: #666; font-size: 0.9rem; margin-bottom: 20px;">Analyzing microscopic fiber orientation...</p>
      
      <div style="width: 100%; max-width: 300px; height: 4px; background: #e0e7ff; border-radius: 2px; margin: 0 auto; overflow: hidden;">
        <div style="height: 100%; background: linear-gradient(90deg, #2563eb, #10b981); animation: progress 3s ease-in-out forwards;"></div>
      </div>
      
      <style>
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      </style>
    </div>
  `;
  
  // Generate PUF responses
  const pufResponses = PUF_CHALLENGES.map(challenge => ({
    challengeId: challenge.id,
    response: generatePUFResponse(qrData, challenge.wavelength)
  }));
  
  // Wait for animation then verify
  setTimeout(() => {
    verifyQRCodeWithPUF(qrData, pufResponses);
  }, 3500);
}

/**
 * Generate simulated PUF response
 * In real system: Camera captures actual light response
 */
function generatePUFResponse(qrData, wavelength) {
  // In real implementation: Read from physical label
  // For demo: Generate deterministic response based on QR data
  const data = qrData + wavelength.toString();
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Skip PUF Challenge (Demo Mode)
 */
function skipPUFChallenge(qrData) {
  verifyQRCodeWithPUF(qrData, []);
}

/**
 * Verify QR Code with PUF
 */
async function verifyQRCodeWithPUF(qrData, pufResponses) {
  const loadingDiv = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  
  loadingDiv.classList.add('hidden');
  resultDiv.classList.add('hidden');
  
  loadingDiv.innerHTML = `
    <div style="text-align: center; padding: 30px;">
      <div style="width: 50px; height: 50px; border: 4px solid #e0e7ff; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
      <p style="font-weight: 600;">Verifying with cryptographic signature...</p>
      <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">Checking RSA-2048 signature + PUF pattern...</p>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
  
  loadingDiv.classList.remove('hidden');
  
  try {
    console.log('Sending verification request to:', `${API_URL}/api/verify-puf`);
    
    const response = await fetch(`${API_URL}/api/verify-puf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrData: qrData,
        pufResponses: pufResponses
      })
    });
    
    const data = await response.json();
    console.log('Response data:', data);
    
    showVerificationResult(data);
  } catch (error) {
    console.error('Verification error:', error);
    showVerificationResult({
      success: false,
      valid: false,
      reason: 'NETWORK ERROR',
      message: 'Failed to verify. Make sure backend is running.',
      confidence: 0
    });
  } finally {
    loadingDiv.classList.add('hidden');
  }
}

function verifyManual() {
  const qrData = document.getElementById('manualQR').value.trim();
  if (qrData) {
    showPUFChallenge(qrData);
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
    <div style="text-align: center; padding: 30px;">
      <div style="font-size: 3rem; margin-bottom: 15px;">
        ${isGenuine ? '✅' : '❌'}
      </div>
      <h2 style="margin: 0 0 10px 0; color: ${isGenuine ? '#10b981' : '#ef4444'};">
        ${data.reason || 'Verification Result'}
      </h2>
      <p class="confidence" style="font-size: 1.5rem; font-weight: 700; margin: 10px 0; color: ${isGenuine ? '#10b981' : '#ef4444'};">
        Confidence: ${data.confidence || 0}%
      </p>
      <p style="color: #666; font-size: 1.1rem; margin: 15px 0;">
        ${data.message || ''}
      </p>
  `;
  
  // Show verification details
  if (data.verification) {
    html += `
      <div style="background: ${isGenuine ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Verification Details:</h3>
        <div style="display: flex; flex-direction: column; gap: 10px; color: #666;">
          <p style="margin: 0;"><strong>🔐 Cryptographic:</strong> ${data.verification.cryptographic}</p>
          <p style="margin: 0;"><strong>🔬 Physical (PUF):</strong> ${data.verification.physical}</p>
          <p style="margin: 0;"><strong>🛡️ Technology:</strong> ${data.verification.technology}</p>
        </div>
      </div>
    `;
  }
  
  if (data.batch) {
    html += `
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e0e7ff; text-align: left;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Product Details:</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; color: #666; font-size: 0.95rem;">
          <p style="margin: 0;"><strong>Unit ID:</strong> ${data.batch.unitId || data.batch.batchId || 'N/A'}</p>
          <p style="margin: 0;"><strong>Product:</strong> ${data.batch.productName || 'N/A'}</p>
          <p style="margin: 0;"><strong>Brand:</strong> ${data.batch.brandName || 'N/A'}</p>
          ${data.batch.manufacturingDate ? `<p style="margin: 0;"><strong>Mfg Date:</strong> ${data.batch.manufacturingDate}</p>` : ''}
          ${data.batch.expiryDate ? `<p style="margin: 0;"><strong>Exp Date:</strong> ${data.batch.expiryDate}</p>` : ''}
        </div>
      </div>
    `;
  }
  
  if (data.suspicious) {
    html += `
      <div style="background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
        <h3 style="color: #ef4444; margin: 0 0 10px 0;">⚠️ COUNTERFEIT ALERT</h3>
        <p style="color: #666; margin: 0;">
          This product has been flagged as counterfeit. The QR code pattern indicates duplicate scanning 
          or attempt to replicate genuine product. Do NOT purchase.
        </p>
      </div>
    `;
  }
  
  html += `
    <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
      <button onclick="location.href='/'" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
        ← Generate Another QR
      </button>
      <button onclick="location.reload()" style="padding: 12px 24px; background: #f3f4f6; color: #333; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; font-weight: 600;">
        Scan Another Product
      </button>
    </div>
    </div>
  `;
  
  resultDiv.innerHTML = html;
  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth' });
}
