export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { userId, userPhone, currentClientBalance = 0, currentClientQuota = 500 } = body;

  return res.status(200).json({
    ok: true,
    wallet: {
      userId,
      phone: userPhone,
      balance: parseFloat(Number(currentClientBalance).toFixed(2)),
      quota: parseFloat(Number(currentClientQuota).toFixed(2)),
      todayReceive: 0,
      totalDeposited: 0,
      creditedDepositIds: [],
      updatedAt: new Date().toISOString(),
    },
  });
}
