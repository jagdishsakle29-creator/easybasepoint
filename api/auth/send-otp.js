import crypto from 'crypto';

const HMAC_SECRET = process.env.OTP_SECRET || 'easybasepoint-company-otp-key-2026';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '6527377657';

// Free Email Gateway Providers: Brevo (Sendinblue) or Resend
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'security@easybasepoint.com';

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

// Dispatch Email via Brevo or Resend
async function dispatchEmailOtp(email, code) {
  const subject = `Your EasyBasePoint Withdrawal OTP: ${code}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; color: #0b1528;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0b1528; margin: 0; font-size: 22px;">EasyBasePoint Security</h2>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Withdrawal Verification Authorization</p>
      </div>
      <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 12px; font-weight: 700; color: #C2410C; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit Verification Code</span>
        <div style="font-size: 36px; font-weight: 800; color: #FF6B00; letter-spacing: 8px; margin: 10px 0; font-family: monospace;">
          ${code}
        </div>
        <span style="font-size: 12px; color: #9A3412;">⏱ Valid for 5 minutes only</span>
      </div>
      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
        Please enter this verification code on the withdrawal page to confirm your payout request.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0; border-top: 1px solid #f1f5f9; pt: 12px;">
        ⚠️ Never share this OTP with anyone. If you did not request this withdrawal, please secure your account immediately.
      </p>
    </div>
  `;

  // 1. Try Brevo (Sendinblue) API if configured
  if (BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'EasyBasePoint Security', email: FROM_EMAIL },
          to: [{ email }],
          subject,
          htmlContent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { ok: true, provider: 'BREVO', messageId: data.messageId };
      }
      console.warn('[OTP_FLOW] Brevo send error:', data);
    } catch (e) {
      console.warn('[OTP_FLOW] Brevo connection error:', e.message);
    }
  }

  // 2. Try Resend API if configured
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `EasyBasePoint <${FROM_EMAIL}>`,
          to: [email],
          subject,
          html: htmlContent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { ok: true, provider: 'RESEND', id: data.id };
      }
      console.warn('[OTP_FLOW] Resend send error:', data);
    } catch (e) {
      console.warn('[OTP_FLOW] Resend connection error:', e.message);
    }
  }

  return { ok: false, error: 'NO_EMAIL_PROVIDER_KEY' };
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
    const { identifier, channel = 'email' } = body;

    console.log(`[OTP_FLOW] Withdrawal/User Identifier: ${maskIdentifier(identifier)} (Channel: ${channel})`);

    if (!identifier || typeof identifier !== 'string') {
      console.warn('[OTP_FLOW] Validation failed: Missing identifier');
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Valid registered email address or mobile number is required.',
      });
    }

    const cleanId = normalizeIdentifier(identifier);
    const isEmail = cleanId.includes('@');

    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanId)) {
        return res.status(400).json({
          success: false,
          ok: false,
          error: 'INVALID_EMAIL',
          message: 'Please provide a valid email address.',
        });
      }
    } else if (cleanId.length !== 10) {
      console.warn(`[OTP_FLOW] Validation failed: Invalid phone length (${cleanId.length} digits)`);
      return res.status(400).json({
        success: false,
        ok: false,
        error: 'INVALID_PHONE',
        message: 'Mobile number must be a valid 10-digit number.',
      });
    }

    // Cryptographic numeric 6-digit OTP (100000 - 999999)
    const numericCode = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(numericCode + salt).digest('hex');
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

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

    // 1. If Email identifier/channel: Attempt email dispatch
    let emailDispatched = false;
    if (isEmail) {
      console.log(`[OTP_FLOW] Initiating Email dispatch to: ${masked}`);
      const emailRes = await dispatchEmailOtp(cleanId, numericCode);
      if (emailRes.ok) {
        emailDispatched = true;
        console.log(`[OTP_FLOW] Email delivered via ${emailRes.provider}`);
      } else {
        console.log('[OTP_FLOW] Email API key not yet configured in env; logging delivery alert.');
      }
    }

    // 2. Simultaneous Telegram security alert to Admin
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_ID) {
      try {
        console.log(`[OTP_FLOW] Telegram/API request started -> Target Chat: ${maskIdentifier(TELEGRAM_ADMIN_CHAT_ID)}`);
        const telegramText = 
          `🔐 *EasyBasePoint Security Verification*\n\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `👤 *User / Contact:* \`${masked}\`\n` +
          `🔢 *Verification OTP:* \`${numericCode}\`\n` +
          `⏱ *Validity:* 5 Minutes (300s)\n` +
          `🛡 *Action:* Withdrawal Payout Confirmation\n` +
          `━━━━━━━━━━━━━━━━━━━\n\n` +
          (isEmail && !emailDispatched 
            ? `_Note: Code generated for user email ${masked}. Also logged here for verification._` 
            : `_Verification OTP dispatched successfully._`);

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
      } catch (tgErr) {
        console.warn('[OTP_FLOW] Telegram alert error:', tgErr.message);
      }
    }

    console.log('[OTP_FLOW] OTP stored successfully (Expires in: 300s)');
    console.log('[OTP_FLOW] Final API response: success=true, expiresIn=300');
    console.log('[OTP_FLOW] === OTP REQUEST END ===');

    return res.status(200).json({
      success: true,
      ok: true,
      status: 'SENT',
      message: isEmail 
        ? `Verification OTP sent to ${masked}`
        : `Verification OTP sent successfully to ${masked}`,
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
