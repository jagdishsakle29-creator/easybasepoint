const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || '6527377657';

const recentAlerts = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { text, message, reply_markup, customChatId } = body;
    const targetChatId = customChatId || TELEGRAM_ADMIN_CHAT_ID;

    const messageText = text || message;
    if (!messageText) {
      return res.status(400).json({ ok: false, error: 'Message text is required' });
    }

    // Deduplication check: prevent sending the identical alert within 30 seconds
    const alertKey = `${targetChatId}_${messageText.slice(0, 100)}`;
    const now = Date.now();
    if (recentAlerts.has(alertKey) && now - recentAlerts.get(alertKey) < 30000) {
      return res.status(200).json({ ok: true, deduplicated: true, message: 'Duplicate alert suppressed' });
    }
    recentAlerts.set(alertKey, now);

    // Cleanup old keys
    if (recentAlerts.size > 200) {
      for (const [k, time] of recentAlerts.entries()) {
        if (now - time > 60000) recentAlerts.delete(k);
      }
    }

    const payload = {
      chat_id: targetChatId,
      text: messageText,
      parse_mode: 'Markdown',
    };

    if (reply_markup) {
      payload.reply_markup = reply_markup;
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await tgRes.json();
    return res.status(200).json({
      ok: Boolean(data.ok),
      result: data.result,
      description: data.description,
      message: data.ok ? 'Alert sent successfully via secure server' : data.description,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
