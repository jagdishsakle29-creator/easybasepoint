const CLOUD_LEDGER_URL = 'https://api.restful-api.dev/objects/ff808181a067127101a096aef1d80342';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const resp = await fetch(CLOUD_LEDGER_URL, { cache: 'no-store' });
      if (resp.ok) {
        const json = await resp.json();
        const dataObj = (json && json.data) || {};
        const list = Object.entries(dataObj).map(([id, val]) => ({
          id,
          ...(typeof val === 'object' ? val : { totalInr: val, status: 'completed', credited: true }),
        }));
        return res.status(200).json(list);
      }
    } catch (err) {
      console.error('[API_DEPOSITS] Cloud ledger fetch error:', err.message);
    }
    return res.status(200).json([]);
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const depId = body.id || body.depId;
      if (depId) {
        const resp = await fetch(CLOUD_LEDGER_URL, { cache: 'no-store' });
        const json = resp.ok ? await resp.json() : {};
        const currentData = (json && json.data) || {};

        currentData[depId] = {
          id: depId,
          totalInr: body.totalInr || body.amount || 565,
          amount: body.amount || 500,
          method: body.method || 'INR',
          userId: body.userId || '',
          userPhone: body.userPhone || '',
          status: body.status || 'completed',
          credited: body.credited !== undefined ? body.credited : true,
          createdAt: body.createdAt || new Date().toISOString(),
          approvedAt: body.approvedAt || new Date().toISOString(),
          creditedAt: body.creditedAt || new Date().toISOString(),
        };

        await fetch(CLOUD_LEDGER_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'ebp_approvals_ledger',
            data: currentData,
          }),
        });
      }
      return res.status(200).json({ ok: true, depId });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
}
