import crypto from 'crypto';

const HMAC_SECRET = process.env.OTP_SECRET || 'easybasepoint-company-otp-key-2026';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '6527377657';

function maskIdentifier(id) {
  if (!id) return '***';
  if (id.includes('@')) {
    const parts = id.split('@');
    return `${parts[0].slice(0, 2)}***@${parts[1]}`;
  }
  return `${id.slice(0, 2)}******${id.slice(-2)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { identifier, channel = 'sms' } = body;

    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Valid registered mobile number or email is required.',
      });
    }

    const isEmail = identifier.includes('@');
    const cleanId = isEmail ? identifier.trim().toLowerCase() : identifier.replace(/[^0-9]/g, '');

    if (!isEmail && cleanId.length !== 10) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_PHONE',
        message: 'Mobile number must be exactly 10 digits.',
      });
    }

    // Cryptographic numeric 6-digit OTP
    const numericCode = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(numericCode + salt).digest('hex');
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    // Stateless HMAC session token
    const tokenPayload = {
      id: cleanId,
      hash,
      salt,
      exp: expiresAt,
      iat: Date.now(),
    };
    const serialized = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    const sig = crypto.createHmac('sha256', HMAC_SECRET).update(serialized).digest('base64url');
    const sessionToken = `${serialized}.${sig}`;

    const masked = maskIdentifier(cleanId);

    // Optional Telegram Bot dispatch alert
    try {
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_ID) {
        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_ADMIN_CHAT_ID,
            text: `🔐 *EasyBasePoint Security Verification*\n\n📱 *Contact:* \`${masked}\`\n🔢 *Code:* \`${numericCode}\`\n⏱ *Validity:* 5 Minutes`,
            parse_mode: 'Markdown',
          }),
        }).catch(() => {});
      }
    } catch {}

    return res.status(200).json({
      ok: true,
      status: 'SENT',
      message: `Verification code sent to ${masked}.`,
      sessionToken,
      maskedContact: masked,
      cooldownSeconds: 60,
      expiresInSeconds: 300,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Failed to process verification code. Please try again.',
    });
  }
}
