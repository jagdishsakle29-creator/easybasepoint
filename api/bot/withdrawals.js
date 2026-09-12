import { fetchLedgerFromGitHub, recordWithdrawal } from './ledgerHelper.js';

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
      const list = Object.values(data || {})
        .filter((item) => item.type === 'withdrawal' || (item.id && item.id.startsWith('WDR-')))
        .sort((a, b) => {
          const tA = new Date(a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
      return res.status(200).json(list);
    } catch (err) {
      console.error('[API_WITHDRAWALS] Error listing withdrawals:', err.message);
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const wdrId = body.id || `WDR-${Math.floor(100000 + Math.random() * 900000)}`;
      body.id = wdrId;

      const recorded = await recordWithdrawal(body);
      return res.status(200).json({ ok: true, withdrawal: recorded });
    } catch (err) {
      console.error('[API_WITHDRAWALS] Error recording withdrawal:', err.message);
      return res.status(400).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
}
