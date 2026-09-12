import crypto from 'crypto';

const HMAC_SECRET = process.env.OTP_SECRET || 'easybasepoint-company-otp-key-2026';

// Global replay protection cache for used OTP tokens in serverless memory
if (!global.usedOtpNonces) {
  global.usedOtpNonces = new Set();
}

function normalizeIdentifier(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const digits = trimmed.replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      ok: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed. Use POST.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { identifier, otp, sessionToken } = body;

    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'MISSING_FIELDS',
        message: 'Identifier and verification OTP are required.',
      });
    }

    const cleanId = normalizeIdentifier(identifier);
    const cleanOtp = String(otp).trim();

    if (!sessionToken || typeof sessionToken !== 'string' || !sessionToken.includes('.')) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'SESSION_EXPIRED',
        message: 'Verification session expired or invalid. Please request a new OTP.',
      });
    }

    const [serialized, receivedSig] = sessionToken.split('.');
    const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(serialized).digest('base64url');

    // Cryptographic signature check
    if (
      receivedSig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig))
    ) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'INVALID_SESSION',
        message: 'Security verification session tampered or invalid.',
      });
    }

    const tokenPayload = JSON.parse(Buffer.from(serialized, 'base64url').toString('utf8'));

    // Check if this token was already used (Replay Prevention)
    if (tokenPayload.salt && global.usedOtpNonces.has(tokenPayload.salt)) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'OTP_ALREADY_USED',
        message: 'This verification code has already been used. Please request a new OTP.',
      });
    }

    // Check expiry (5 minutes)
    if (Date.now() > tokenPayload.exp) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'OTP_EXPIRED',
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    // Check identifier matches
    if (tokenPayload.id !== cleanId) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'MISMATCHED_IDENTIFIER',
        message: 'Identifier mismatch with active verification session.',
      });
    }

    // Check hash
    const computedHash = crypto.createHash('sha256').update(cleanOtp + tokenPayload.salt).digest('hex');

    if (
      computedHash.length !== tokenPayload.hash.length ||
      !crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(tokenPayload.hash))
    ) {
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'INVALID_OTP',
        message: 'Invalid verification code. Please check and try again.',
      });
    }

    // Mark as used to prevent replay attacks
    if (tokenPayload.salt) {
      global.usedOtpNonces.add(tokenPayload.salt);
    }

    const verificationToken = crypto.randomBytes(24).toString('hex');

    return res.status(200).json({
      success: true,
      ok: true,
      verified: true,
      verificationToken,
      identifier: cleanId,
      message: 'Verification successful!',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Verification failed. Please try again.',
    });
  }
}
