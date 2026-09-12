import { recordDeposit } from '../bot/ledgerHelper.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '6527377657';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { userId, userPhone, amount, method, utrNumber, network, proofUrl, isDemo, transactionId } = body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ ok: false, error: 'Valid amount is required' });
    }

    const isUsdt = method === 'USDT';
    const numAmount = Number(amount);
    const prefix = isUsdt ? 'USDT' : 'DEP';
    // Preserve client's transaction ID to prevent desync
    const uniqueTxId = transactionId || body.id || `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
    const nowIso = new Date().toISOString();

    let bonusInr = 0;
    let activityRewardInr = 0;
    let totalInr = numAmount;

    if (isUsdt) {
      const calculatedInr = numAmount * 110;
      bonusInr = calculatedInr * 0.06;
      activityRewardInr = numAmount >= 100 ? (calculatedInr * 0.03) : 0;
      totalInr = calculatedInr + bonusInr + activityRewardInr;
    } else {
      bonusInr = (numAmount * 13) / 100;
      if (numAmount >= 50000) activityRewardInr = 5000;
      else if (numAmount >= 20000) activityRewardInr = 1000;
      else if (numAmount >= 5000) activityRewardInr = 100;
      totalInr = numAmount + bonusInr + activityRewardInr;
    }

    const screenshot = body.paymentScreenshot || proofUrl || '';

    const depositRecord = {
      id: uniqueTxId,
      userId: userId || 'player',
      userPhone: userPhone || '',
      amount: numAmount,
      method: isUsdt ? 'USDT' : 'INR',
      calculatedInr: isUsdt ? numAmount * 110 : numAmount,
      bonusInr,
      activityRewardInr,
      totalInr: parseFloat(totalInr.toFixed(2)),
      utrNumber: utrNumber || (isUsdt ? 'TRC20-TRANSFER' : 'PENDING'),
      network: isUsdt ? (network || 'TRC20') : undefined,
      proofUrl: screenshot,
      paymentScreenshot: screenshot,
      remark: body.remark || 'cousin',
      status: isDemo ? 'completed' : 'pending_verification',
      credited: isDemo ? true : false,
      createdAt: nowIso,
    };

    // Save to robust cloud ledger
    try {
      await recordDeposit(depositRecord);
    } catch (err) {
      console.error('[CREATE_TX] Error recording deposit:', err.message);
      return res.status(400).json({ ok: false, error: err.message });
    }

    // Only send Telegram alert if not already sent by client
    if (body.sendTelegram !== false && !body.skipTelegram) {
      try {
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_ADMIN_CHAT_ID) {
          const text = `🔔 *NEW ${isUsdt ? 'USDT' : 'INR'} DEPOSIT SUBMITTED*\n\n` +
            `🆔 *Deposit ID:* \`${uniqueTxId}\`\n` +
            `👤 *User:* \`${userPhone || userId || 'Player'}\`\n` +
            `💰 *Amount:* ₹${totalInr.toFixed(2)}\n` +
            `🔖 *UTR / Hash:* \`${depositRecord.utrNumber}\``;

          fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TELEGRAM_ADMIN_CHAT_ID,
              text,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '⚡ 1-Click Approve (Web)', url: `https://easybasepoint.vercel.app/?admin=lord12&approve_dep=${uniqueTxId}&total=${totalInr.toFixed(2)}` },
                    { text: `✅ Approve ₹${totalInr.toFixed(2)}`, callback_data: `approve_dep:${uniqueTxId}:${totalInr.toFixed(2)}` },
                  ],
                  [
                    { text: '❌ Reject', callback_data: `reject_dep:${uniqueTxId}` },
                  ]
                ]
              }
            }),
          }).catch(() => {});
        }
      } catch {}
    }

    return res.status(200).json({
      ok: true,
      transactionId: uniqueTxId,
      deposit: depositRecord,
      wallet: isDemo ? { balance: totalInr, quota: isUsdt ? 5500 : numAmount } : null,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
