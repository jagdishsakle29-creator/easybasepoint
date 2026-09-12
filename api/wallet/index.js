export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = req.query.userId || '';
  const userPhone = req.query.phone || '';

  return res.status(200).json({
    ok: true,
    wallet: {
      userId,
      phone: userPhone,
      balance: 0,
      quota: 500,
      todayReceive: 0,
      totalDeposited: 0,
      creditedDepositIds: [],
      updatedAt: new Date().toISOString(),
    },
  });
}
