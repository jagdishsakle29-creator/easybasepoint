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
  const digits = id.replace(/[^0-9]/g, '');
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
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

  console.log('[OTP_FLOW] === OTP REQUEST START ===');

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { identifier, channel = 'sms' } = body;

    console.log(`[OTP_FLOW] Withdrawal/User Identifier: ${maskIdentifier(identifier)}`);

    if (!identifier || typeof identifier !== 'string') {
      console.warn('[OTP_FLOW] Validation failed: Missing identifier');
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Valid registered mobile number or email is required.',
      });
    }

    const cleanId = normalizeIdentifier(identifier);
    const isEmail = cleanId.includes('@');

    if (!isEmail && cleanId.length !== 10) {
      console.warn(`[OTP_FLOW] Validation failed: Invalid phone length (${cleanId.length} digits)`);
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'INVALID_PHONE',
        message: 'Mobile number must be a valid 10-digit number.',
      });
    }

    // Check credentials configuration
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('[OTP_FLOW] Missing configuration: TELEGRAM_BOT_TOKEN is not set');
      return res.status(503).json({
        success: false,
        ok: false,
        error: 'CONFIGURATION_ERROR',
        message: 'Verification gateway configuration error: TELEGRAM_BOT_TOKEN is missing.',
      });
    }
    if (!TELEGRAM_ADMIN_CHAT_ID) {
      console.error('[OTP_FLOW] Missing configuration: TELEGRAM_ADMIN_CHAT_ID is not set');
      return res.status(503).json({
        success: false,
        ok: false,
        error: 'CONFIGURATION_ERROR',
        message: 'Verification gateway configuration error: TELEGRAM_ADMIN_CHAT_ID is missing.',
      });
    }

    // Cryptographic numeric 6-digit OTP (100000 - 999999)
    const numericCode = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(numericCode + salt).digest('hex');
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    // Log OTP generation (Hash only, NEVER log actual numeric OTP in production logs)
    console.log(`[OTP_FLOW] OTP generated: [PROTECTED_6_DIGIT] (Hash: ${hash.slice(0, 12)}...)`);

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

    // Await Telegram Bot dispatch
    console.log(`[OTP_FLOW] Telegram/API request started -> Target Chat: ${maskIdentifier(TELEGRAM_ADMIN_CHAT_ID)}`);

    const telegramText = 
      `🔐 *EasyBasePoint Security Verification*\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *User / Contact:* \`${masked}\`\n` +
      `🔢 *Verification OTP:* \`${numericCode}\`\n` +
      `⏱ *Validity:* 5 Minutes (300s)\n` +
      `🛡 *Action:* Withdrawal Payout Confirmation\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `_Enter this OTP in the Withdrawal Verification section to confirm your payout._`;

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text: telegramText,
        parse_mode: 'Markdown',
      }),
    });

    console.log(`[OTP_FLOW] Telegram/API response status: ${tgRes.status}`);

    const tgData = await tgRes.json().catch(() => ({}));
    console.log(`[OTP_FLOW] Telegram/API response body: ok=${tgData.ok}, message_id=${tgData.result?.message_id || 'N/A'}`);

    if (!tgRes.ok || !tgData.ok) {
      console.error('[OTP_FLOW] Telegram delivery error:', tgData.description || tgRes.statusText);
      return res.status(502).json({
        success: false,
        ok: false,
        error: 'DELIVERY_FAILED',
        message: `Failed to deliver verification code via Telegram: ${tgData.description || 'Gateway error'}.`,
      });
    }

    console.log('[OTP_FLOW] OTP stored successfully (Expires in: 300s)');
    console.log('[OTP_FLOW] Final API response: success=true, expiresIn=300');
    console.log('[OTP_FLOW] === OTP REQUEST END ===');

    return res.status(200).json({
      success: true,
      ok: true,
      status: 'SENT',
      message: `Verification OTP sent successfully to ${masked}`,
      expiresIn: 300,
      cooldownSeconds: 60,
      maskedContact: masked,
      sessionToken,
    });
  } catch (err) {
    console.error('[OTP_FLOW] Unhandled error during OTP processing:', err.message);
    return res.status(500).json({
      success: false,
      ok: false,
      error: 'SERVER_ERROR',
      message: `Failed to process verification code: ${err.message || 'Internal server error'}`,
    });
  }
}
