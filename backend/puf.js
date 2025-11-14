const crypto = require('crypto');

/**
 * PUF (Physical Unclonable Function) Management
 * Simulates optical PUF challenge-response using hash functions
 */

// Challenge set - represents different light wavelengths/angles
const PUF_CHALLENGES = [
  { id: 1, wavelength: 780, angle: 0, description: 'Near-infrared horizontal' },
  { id: 2, wavelength: 850, angle: 45, description: 'Near-infrared 45° angle' },
  { id: 3, wavelength: 940, angle: 90, description: 'Near-infrared vertical' },
  { id: 4, wavelength: 1064, angle: 135, description: 'Near-infrared 135° angle' }
];

/**
 * Generate unique PUF response for a unit
 * In real implementation: light reflects off microscopic fibers
 * Here: We simulate with hash-based function
 */
function generatePUFResponse(unitId, batchId, challenge) {
  // Simulate PUF response based on physical material properties
  // (In real world: fiber orientation, material density, etc.)
  const materialHash = crypto
    .createHash('sha256')
    .update(`${unitId}${batchId}manufacturing-random-seed-${challenge.wavelength}`)
    .digest('hex');
  
  // Challenge influences but doesn't determine response
  const response = crypto
    .createHash('sha256')
    .update(`${materialHash}${JSON.stringify(challenge)}`)
    .digest('hex');
  
  return response;
}

/**
 * Create PUF signature during manufacturing
 * Never stored as plain text, always hashed
 */
function createPUFSignature(unitId, batchId) {
  const signatures = [];
  
  // Generate response for each challenge
  for (let challenge of PUF_CHALLENGES) {
    const response = generatePUFResponse(unitId, batchId, challenge);
    signatures.push({
      challengeId: challenge.id,
      responseHash: crypto
        .createHash('sha256')
        .update(response)
        .digest('hex')
    });
  }
  
  // Create master PUF signature (hash of all responses)
  const masterSignature = crypto
    .createHash('sha256')
    .update(JSON.stringify(signatures))
    .digest('hex');
  
  return {
    unitId,
    masterPUFSignature: masterSignature,
    challengeSet: PUF_CHALLENGES.map(c => ({ id: c.id, wavelength: c.wavelength })),
    createdAt: new Date().toISOString()
  };
}

/**
 * Verify PUF response during scan
 * Regenerates response and compares hash
 */
function verifyPUFResponse(unitId, batchId, challengeId, submittedResponse) {
  // Find challenge
  const challenge = PUF_CHALLENGES.find(c => c.id === challengeId);
  if (!challenge) return false;
  
  // Regenerate expected response
  const expectedResponse = generatePUFResponse(unitId, batchId, challenge);
  const expectedHash = crypto
    .createHash('sha256')
    .update(expectedResponse)
    .digest('hex');
  
  // Hash the submitted response
  const submittedHash = crypto
    .createHash('sha256')
    .update(submittedResponse)
    .digest('hex');
  
  // Compare without revealing actual response
  return expectedHash === submittedHash;
}

/**
 * Generate all PUF challenges for a unit (for app to use)
 */
function generateAllChallenges(unitId, batchId) {
  const challengeResponses = [];
  
  for (let challenge of PUF_CHALLENGES) {
    const response = generatePUFResponse(unitId, batchId, challenge);
    challengeResponses.push({
      challengeId: challenge.id,
      wavelength: challenge.wavelength,
      angle: challenge.angle,
      response: response
    });
  }
  
  return challengeResponses;
}

module.exports = {
  PUF_CHALLENGES,
  generatePUFResponse,
  createPUFSignature,
  verifyPUFResponse,
  generateAllChallenges
};
