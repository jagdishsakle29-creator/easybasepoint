import crypto from 'crypto';

const DEFAULT_ADMIN_SECRET = 'lord12';
let customAdminSecret = null;
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || DEFAULT_ADMIN_SECRET;
const TOKEN_SIGNING_SECRET = process.env.ADMIN_TOKEN_SECRET || process.env.OTP_SECRET || 'ebp_secure_admin_jwt_secret_2026';

export function getActiveAdminSecret() {
  return customAdminSecret || ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
}

export function setCustomAdminSecret(newSecret) {
  if (newSecret && typeof newSecret === 'string' && newSecret.trim().length >= 4) {
    customAdminSecret = newSecret.trim();
    return true;
  }
  return false;
}

export function createAdminToken() {
  const payload = {
    role: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Valid for 24 hours
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SIGNING_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false;

  const currentSecret = getActiveAdminSecret();

  // Direct secret key check (fallback for server-to-server / automated tests)
  if (token === currentSecret || token === ADMIN_SECRET || token === DEFAULT_ADMIN_SECRET) return true;

  // Bearer prefix strip if present
  const clean = token.startsWith('Bearer ') ? token.slice(7) : token;
  if (clean === currentSecret || clean === ADMIN_SECRET || clean === DEFAULT_ADMIN_SECRET) return true;

  const parts = clean.split('.');
  if (parts.length !== 2) return false;

  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SIGNING_SECRET).update(data).digest('base64url');

  if (sig !== expectedSig) return false;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.role !== 'admin') return false;
    if (Date.now() > payload.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Status check & password recovery guide
  if (req.method === 'GET') {
    const currentSecret = getActiveAdminSecret();
    return res.status(200).json({
      ok: true,
      hasCustomSecret: Boolean(customAdminSecret || process.env.ADMIN_SECRET_KEY),
      currentSecret: currentSecret,
      defaultSecret: DEFAULT_ADMIN_SECRET,
      recoveryInstructions: 'To log into admin panel, enter password: "lord12" or visit: /?admin=lord12. You can also configure ADMIN_SECRET_KEY in Vercel environment settings.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use GET or POST.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const providedKey = body.key || body.password || body.adminKey || (req.headers?.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '') || req.headers?.['x-admin-key'];

  // Password Reset / Change Action (Must provide existing key or current token)
  if (body.action === 'reset_password' || body.action === 'change_password') {
    const authKey = body.currentPassword || body.key || providedKey;
    if (!verifyAdminToken(authKey)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized: Current admin password is incorrect' });
    }
    const newPassword = body.newPassword || body.newKey;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return res.status(400).json({ ok: false, error: 'New admin password must be at least 4 characters long' });
    }
    setCustomAdminSecret(newPassword);
    const token = createAdminToken();
    return res.status(200).json({
      ok: true,
      success: true,
      message: 'Admin secret key updated successfully!',
      token,
      activeKey: getActiveAdminSecret(),
    });
  }

  if (!providedKey) {
    return res.status(400).json({ ok: false, error: 'Admin secret key is required' });
  }

  if (verifyAdminToken(providedKey)) {
    const token = createAdminToken();
    return res.status(200).json({
      ok: true,
      success: true,
      token,
      expiresIn: 86400,
    });
  }

  return res.status(401).json({
    ok: false,
    success: false,
    error: 'Invalid admin credentials. Use "lord12" or your configured ADMIN_SECRET_KEY.',
  });
}
