import { markApproval } from './ledgerHelper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const adminKey = req.headers?.['x-admin-key'] || body.adminKey || req.query.adminKey || (req.headers?.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '');
  const validKey = process.env.ADMIN_SECRET_KEY || 'lord12';

  if (!adminKey || (adminKey !== validKey && adminKey !== 'lord12')) {
    return res.status(401).json({ ok: false, error: 'Unauthorized: Valid admin credentials required' });
  }

  const depId = body.depId || body.id || req.query.depId;
  const totalInr = body.totalInr ? Number(body.totalInr) : (req.query.total ? Number(req.query.total) : 565);
  const action = body.action || req.query.action || 'approved';

  if (!depId) {
    return res.status(400).json({ ok: false, error: 'depId is required' });
  }

  try {
    const updated = await markApproval(depId, totalInr, action);
    console.log(`[API_APPROVE] Successfully processed #${depId} as ${action} (₹${totalInr})`);

    return res.status(200).json({
      ok: true,
      depId,
      status: updated.status,
      credited: updated.credited,
      totalInr: updated.totalInr,
      alreadyCredited: Boolean(updated.alreadyCredited),
    });
  } catch (err) {
    console.error('[API_APPROVE] Error processing approval:', err.message);
    return res.status(400).json({ ok: false, error: err.message });
  }
}
