import { fetchLedgerFromGitHub, recordDeposit } from './bot/ledgerHelper.js';

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
        .filter((item) => item && item.type !== 'withdrawal' && (!item.id || !item.id.startsWith('WDR-')));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.status(200).json(list);
    } catch (err) {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const recorded = await recordDeposit(body);
      return res.status(200).json({ ok: true, deposit: recorded });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
}
