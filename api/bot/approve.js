const CLOUD_LEDGER_URL = 'https://api.restful-api.dev/objects/ff808181a067127101a096aef1d80342';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const depId = body.depId || body.id || req.query.depId;
  const totalInr = body.totalInr ? Number(body.totalInr) : (req.query.total ? Number(req.query.total) : 565);
  const action = body.action || req.query.action || 'approved';
  const nowIso = new Date().toISOString();

  if (!depId) {
    return res.status(400).json({ ok: false, error: 'depId is required' });
  }

  try {
    const resp = await fetch(CLOUD_LEDGER_URL, { cache: 'no-store' });
    const json = resp.ok ? await resp.json() : {};
    const currentData = (json && json.data) || {};

    const existing = currentData[depId] || {};
    currentData[depId] = {
      ...existing,
      id: depId,
      totalInr: totalInr || existing.totalInr || 565,
      status: action === 'approved' ? 'completed' : 'rejected',
      credited: action === 'approved',
      approvedAt: nowIso,
      creditedAt: action === 'approved' ? nowIso : undefined,
    };

    await fetch(CLOUD_LEDGER_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'ebp_approvals_ledger',
        data: currentData,
      }),
    });

    console.log(`[API_APPROVE] Saved approval for #${depId} (₹${totalInr}) to cloud ledger!`);

    return res.status(200).json({
      ok: true,
      depId,
      status: action === 'approved' ? 'completed' : 'rejected',
      credited: action === 'approved',
      totalInr,
    });
  } catch (err) {
    console.error('[API_APPROVE] Error saving approval:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
