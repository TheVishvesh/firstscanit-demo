/**
 * NEW: Verify QR Code WITH Serial Number Matching
 * This is the KEY function that prevents counterfeiting!
 */
function verifyWithSerial() {
  const physicalSerial = document.getElementById('physicalSerial').value.trim().toUpperCase();
  const qrData = document.getElementById('manualQR').value.trim();
  
  if (!physicalSerial || !qrData) {
    alert('Please enter both physical serial number and QR data');
    return;
  }
  
  // Extract serial from QR data
  const qrSerialMatch = qrData.match(/UNIT-\d{4}/);
  if (!qrSerialMatch) {
    showSerialMismatchResult('Invalid QR data format', physicalSerial, 'No serial found in QR');
    return;
  }
  
  const qrSerial = qrSerialMatch[0];
  
  console.log('Physical Serial:', physicalSerial);
  console.log('QR Serial:', qrSerial);
  
  // CRITICAL CHECK: Do they match?
  if (physicalSerial !== qrSerial) {
    // COUNTERFEIT DETECTED!
    showSerialMismatchResult('SERIAL MISMATCH - COUNTERFEIT DETECTED!', physicalSerial, qrSerial);
    return;
  }
  
  // Serial matches! Now verify QR cryptographically
  showPUFChallenge(qrData);
}

/**
 * Show Serial Mismatch Result (COUNTERFEIT)
 */
function showSerialMismatchResult(title, physicalSerial, qrSerial) {
  const resultDiv = document.getElementById('result');
  
  resultDiv.className = 'verification-result counterfeit';
  
  let html = `
    <div style="text-align: center; padding: 30px;">
      <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
      <h2 style="margin: 0 0 10px 0; color: #ef4444;">
        ${title}
      </h2>
      <p style="color: #ef4444; font-size: 1.2rem; font-weight: 700; margin: 15px 0;">
        PRODUCT IS FAKE
      </p>
      
      <div style="background: rgba(239, 68, 68, 0.1); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #ef4444; text-align: left;">
        <h3 style="color: #ef4444; margin: 0 0 15px 0;">Why This is Counterfeit:</h3>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ef4444;">
          <p style="margin: 0 0 10px 0; color: #333;">
            <strong>Physical Serial on Package:</strong>
            <br/>
            <code style="background: #fee2e2; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; font-weight: 700;">
              ${physicalSerial}
            </code>
          </p>
          
          <p style="margin: 10px 0 0 0; color: #333;">
            <strong>QR Code Serial (from QR scan):</strong>
            <br/>
            <code style="background: #fee2e2; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; font-weight: 700;">
              ${qrSerial}
            </code>
          </p>
          
          <p style="margin: 15px 0 0 0; color: #ef4444; font-weight: 600;">
            ❌ THEY DON'T MATCH
          </p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;">
            <strong>What this means:</strong> This QR code was taken from a different product and applied to this package. 
            This is a counterfeit product. <strong>DO NOT BUY.</strong>
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border: 2px solid #fee2e2;">
          <p style="margin: 0; color: #666; font-size: 0.9rem;">
            <strong>How counterfeiting was detected:</strong>
            <br/>Counterfeiter stole QR code from real product (${qrSerial}) and printed it on 
            fake product labeled as (${physicalSerial}). FirstScanIt's serial matching 
            technology caught this mismatch instantly.
          </p>
        </div>
      </div>
      
      <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <button onclick="location.href='/'" style="padding: 12px 24px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
          ← Report to Authorities
        </button>
        <button onclick="location.reload()" style="padding: 12px 24px; background: #f3f4f6; color: #333; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; font-weight: 600;">
          Check Another Product
        </button>
      </div>
    </div>
  `;
  
  resultDiv.innerHTML = html;
  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Override the existing showVerificationResult to show serial info
 */
const originalShowResult = showVerificationResult;
showVerificationResult = function(data) {
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
      <p style="font-size: 1.5rem; font-weight: 700; margin: 10px 0; color: ${isGenuine ? '#10b981' : '#ef4444'};">
        Confidence: ${data.confidence || 0}%
      </p>
      <p style="color: #666; font-size: 1.1rem; margin: 15px 0;">
        ${data.message || ''}
      </p>
  `;
  
  if (isGenuine) {
    html += `
      <div style="background: rgba(16, 185, 129, 0.1); padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #10b981;">
        <h3 style="color: #10b981; margin: 0 0 15px 0;">✓ Product Verified as GENUINE</h3>
        
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: left; margin-bottom: 15px;">
          <h4 style="color: #333; margin: 0 0 15px 0;">Verification Layers Passed:</h4>
          <div style="display: flex; flex-direction: column; gap: 10px; color: #666;">
            <p style="margin: 0;"><strong>✓ Serial Number Matched</strong><br/><span style="color: #999; font-size: 0.9rem;">Physical serial on package matches QR code</span></p>
            <p style="margin: 0;"><strong>✓ Cryptographic Signature</strong><br/><span style="color: #999; font-size: 0.9rem;">RSA-2048 signature verified</span></p>
            <p style="margin: 0;"><strong>✓ PUF Pattern</strong><br/><span style="color: #999; font-size: 0.9rem;">Physical fingerprint matched registered pattern</span></p>
          </div>
        </div>
      </div>
    `;
  }
  
  if (data.batch) {
    html += `
      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #e0e7ff; text-align: left;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Product Details:</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; color: #666; font-size: 0.95rem;">
          <p style="margin: 0;"><strong>Unit ID:</strong> <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${data.batch.unitId || data.batch.batchId || 'N/A'}</code></p>
          <p style="margin: 0;"><strong>Product:</strong> ${data.batch.productName || 'N/A'}</p>
          <p style="margin: 0;"><strong>Brand:</strong> ${data.batch.brandName || 'N/A'}</p>
          ${data.batch.manufacturingDate ? `<p style="margin: 0;"><strong>Mfg Date:</strong> ${data.batch.manufacturingDate}</p>` : ''}
          ${data.batch.expiryDate ? `<p style="margin: 0;"><strong>Exp Date:</strong> ${data.batch.expiryDate}</p>` : ''}
        </div>
      </div>
    `;
  }
  
  html += `
    <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
      <button onclick="location.href='/'" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
        ← Generate Another QR
      </button>
      <button onclick="location.reload()" style="padding: 12px 24px; background: #f3f4f6; color: #333; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; font-weight: 600;">
        Check Another Product
      </button>
    </div>
    </div>
  `;
  
  resultDiv.innerHTML = html;
  resultDiv.classList.remove('hidden');
  resultDiv.scrollIntoView({ behavior: 'smooth' });
};

