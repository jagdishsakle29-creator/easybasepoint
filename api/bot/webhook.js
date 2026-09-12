import { markApproval } from './ledgerHelper.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '6527377657';

async function callTelegram(method, payload) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`[TG_WEBHOOK] ${method} error:`, err.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, status: 'Telegram Webhook Active' });

  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    // 1. Handle Callback Queries (Inline Button Clicks)
    if (update.callback_query) {
      const cb = update.callback_query;
      const cbId = cb.id;
      const data = cb.data || '';
      const message = cb.message;
      const chatId = message?.chat?.id;
      const messageId = message?.message_id;

      if (data.startsWith('approve_dep:') || data === 'approve_dep_demo') {
        const parts = data.replace('approve_dep:', '').split(':');
        const depId = parts[0] || 'DEP-DEMO';
        const totalInr = parts[1] ? Number(parts[1]) : 565;

        // Mark approved in Cloud Ledger & Broadcast via SSE to player game
        await markApproval(depId, totalInr, 'approved');

        // Answer callback query popup
        await callTelegram('answerCallbackQuery', {
          callback_query_id: cbId,
          text: `✅ Approved deposit #${depId} (₹${totalInr})! Credited to user wallet.`,
          show_alert: true,
        });

        // Edit original message in Telegram
        if (chatId && messageId) {
          const originalText = message.text || '';
          const updatedText = `${originalText}\n\n✅ *STATUS: APPROVED BY ADMIN*\n💰 *Credited:* ₹${totalInr.toFixed(2)} INR\n⚡ *Time:* ${new Date().toLocaleTimeString()}`;
          
          await callTelegram('editMessageText', {
            chat_id: chatId,
            message_id: messageId,
            text: updatedText,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Confirmed & Credited', callback_data: `credited_info:${depId}` },
                  { text: '📊 Open Admin Portal', url: 'https://easybasepoint.vercel.app/?admin=lord12' },
                ]
              ]
            }
          });
        }

        return res.status(200).json({ ok: true, action: 'approved', depId });
      }

      if (data.startsWith('reject_dep:')) {
        const depId = data.replace('reject_dep:', '');
        await markApproval(depId, undefined, 'rejected');

        await callTelegram('answerCallbackQuery', {
          callback_query_id: cbId,
          text: `❌ Rejected deposit #${depId}.`,
          show_alert: true,
        });

        if (chatId && messageId) {
          const originalText = message.text || '';
          const updatedText = `${originalText}\n\n❌ *STATUS: REJECTED BY ADMIN*\n⏱ *Time:* ${new Date().toLocaleTimeString()}`;
          
          await callTelegram('editMessageText', {
            chat_id: chatId,
            message_id: messageId,
            text: updatedText,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '❌ Payment Rejected', callback_data: `rejected_info:${depId}` },
                ]
              ]
            }
          });
        }

        return res.status(200).json({ ok: true, action: 'rejected', depId });
      }

      // Default callback answer
      await callTelegram('answerCallbackQuery', { callback_query_id: cbId });
      return res.status(200).json({ ok: true });
    }

    // 2. Handle Text Messages (/start or commands)
    if (update.message) {
      const msg = update.message;
      const text = (msg.text || '').trim();
      const chatId = msg.chat?.id;

      if (text === '/start' || text === '/admin') {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: `👋 *Welcome to EasyBasePoint Admin Bot!*\n\n` +
            `⚡ *Real-time Deposit & Withdrawal Control*\n` +
            `Interactive approval buttons will appear here whenever a player submits a deposit.\n\n` +
            `🔗 *Admin Portal:* https://easybasepoint.vercel.app/?admin=lord12`,
          parse_mode: 'Markdown',
        });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[TG_WEBHOOK] Handler error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
