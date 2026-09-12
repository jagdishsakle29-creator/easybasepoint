import { fetchLedgerFromGitHub, recordDeposit } from './ledgerHelper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { data } = await fetchLedgerFromGitHub();
      const list = Object.values(data || {}).sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
      return res.status(200).json(list);
    } catch (err) {
      console.error('[API_DEPOSITS] Error listing deposits:', err.message);
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const depId = body.id || body.depId || `DEP_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      body.id = depId;

      if (!body.isDemo && !body.paymentScreenshot && !body.proofUrl) {
        return res.status(400).json({
          ok: false,
          error: 'Payment screenshot is required to complete payment verification.',
        });
      }

      const recorded = await recordDeposit(body);
      return res.status(200).json({ ok: true, deposit: recorded });
    } catch (err) {
      console.error('[API_DEPOSITS] Error recording deposit:', err.message);
      return res.status(400).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
}
