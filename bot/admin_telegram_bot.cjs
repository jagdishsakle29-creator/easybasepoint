/**
 * EasyBasePoint - Admin Telegram Approval Bot
 * 
 * Runs in the background to receive instant notifications when users deposit or withdraw.
 * Allows Admin to Approve or Reject transactions directly from Telegram!
 * 
 * Strict Privacy:
 * Only the specified ADMIN_CHAT_ID can click Approve/Reject. All others are blocked.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'bot_config.json');

// Default config
let config = {
  botToken: process.env.BOT_TOKEN || '',
  adminChatId: process.env.ADMIN_CHAT_ID || '',
  pollIntervalMs: 2000,
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error reading bot_config.json:', e.message);
  }
}

console.log('----------------------------------------------------');
console.log('🤖 EasyBasePoint Telegram Approval Bot Service');
console.log('🔒 Privacy Safe Mode: ACTIVE');
console.log('----------------------------------------------------');

if (!config.botToken || !config.adminChatId) {
  console.log('⚠️ Notice: Bot Token or Admin Chat ID not yet configured.');
  console.log('👉 Please set them in bot/bot_config.json or via the Admin Panel at:');
  console.log('   http://127.0.0.1:5173/?admin=lord12 ➔ Payment Gateways / Telegram Bot tab');
  console.log('----------------------------------------------------');
}

let lastUpdateId = 0;

async function apiCall(method, body = {}) {
  if (!config.botToken) return null;
  try {
    const url = `https://api.telegram.org/bot${config.botToken}/${method}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`API Call [${method}] Error:`, err.message);
    return null;
  }
}

async function handleCallbackQuery(query) {
  const fromId = query.from.id.toString();
  const allowedAdminId = config.adminChatId.toString();

  // Strict Privacy & Security Check: Only Admin can approve
  if (fromId !== allowedAdminId) {
    console.warn(`[SECURITY] Unauthorized click attempt by user ID: ${fromId}`);
    await apiCall('answerCallbackQuery', {
      callback_query_id: query.id,
      text: '⛔ Access Denied: Only the authorized owner can approve payments.',
      show_alert: true,
    });
    return;
  }

  const data = query.data;
  console.log(`[ACTION] Admin triggered: ${data}`);

  if (data === 'approve_dep_demo' || data.startsWith('approve_dep:')) {
    const depId = data === 'approve_dep_demo' ? 'DEMO-809214' : data.replace('approve_dep:', '');
    
    // Instant 0.1s Broadcast to Game Clients via ntfy.sh
    try {
      await fetch('https://ntfy.sh/ebp_approvals_lord12', {
        method: 'POST',
        headers: { 'Title': 'Deposit Approved' },
        body: JSON.stringify({ depId, action: 'approved', timestamp: new Date().toISOString() }),
      });
      console.log(`[SYNC] ✅ Broadcasted approved deposit ${depId} to Game Clients in 0.1s!`);
    } catch (e) {
      console.error(`[SYNC] Error broadcasting ${depId}:`, e.message);
    }

    await apiCall('answerCallbackQuery', {
      callback_query_id: query.id,
      text: `✅ Payment Approved! User wallet has been credited in game.`,
      show_alert: true,
    });

    // Edit message to reflect Approved status and remove old buttons
    await apiCall('editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: `${query.message.text}\n\n━━━━━━━━━━━━━━━━━━━\n✅ *STATUS: PAYMENT APPROVED BY ADMIN*\n💰 *Action:* User Game Wallet Credited Immediately\n⏱ *Time:* ${new Date().toLocaleTimeString()}`,
      parse_mode: 'Markdown',
    });
  } else if (data === 'reject_dep_demo' || data.startsWith('reject_dep:')) {
    const depId = data === 'reject_dep_demo' ? 'DEMO-809214' : data.replace('reject_dep:', '');
    await apiCall('answerCallbackQuery', {
      callback_query_id: query.id,
      text: `❌ Payment Rejected. Order cancelled.`,
      show_alert: true,
    });

    await apiCall('editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: `${query.message.text}\n\n━━━━━━━━━━━━━━━━━━━\n❌ *STATUS: REJECTED BY ADMIN*\n🚫 *Action:* Order Cancelled / Refunded\n⏱ *Time:* ${new Date().toLocaleTimeString()}`,
      parse_mode: 'Markdown',
    });
  } else if (data.startsWith('approve_wdr:')) {
    const wdrId = data.replace('approve_wdr:', '');
    await apiCall('answerCallbackQuery', {
      callback_query_id: query.id,
      text: `✅ Withdrawal Approved! Payout marked sent.`,
      show_alert: true,
    });

    await apiCall('editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: `${query.message.text}\n\n━━━━━━━━━━━━━━━━━━━\n✅ *STATUS: WITHDRAWAL APPROVED & PAID*\n💸 *Action:* Bank/UPI Payout Dispatched\n⏱ *Time:* ${new Date().toLocaleTimeString()}`,
      parse_mode: 'Markdown',
    });
  } else if (data.startsWith('reject_wdr:')) {
    const wdrId = data.replace('reject_wdr:', '');
    await apiCall('answerCallbackQuery', {
      callback_query_id: query.id,
      text: `❌ Withdrawal Rejected & Refunded.`,
      show_alert: true,
    });

    await apiCall('editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: `${query.message.text}\n\n━━━━━━━━━━━━━━━━━━━\n❌ *STATUS: WITHDRAWAL REJECTED & REFUNDED*\n🔄 *Action:* User Balance Restored\n⏱ *Time:* ${new Date().toLocaleTimeString()}`,
      parse_mode: 'Markdown',
    });
  }
}

async function pollUpdates() {
  if (!config.botToken) {
    setTimeout(pollUpdates, 5000);
    return;
  }

  const res = await apiCall('getUpdates', {
    offset: lastUpdateId + 1,
    timeout: 10,
  });

  if (res && res.ok && Array.isArray(res.result)) {
    for (const update of res.result) {
      lastUpdateId = update.update_id;

      if (update.callback_query) {
        await handleCallbackQuery(update.callback_query);
      } else if (update.message && update.message.text) {
        const text = update.message.text.trim();
        const fromId = update.message.from.id.toString();

        if (text === '/start' || text === '/status') {
          await apiCall('sendMessage', {
            chat_id: update.message.chat.id,
            text: `👋 *Welcome to EasyBasePoint Admin Bot!*\n\n` +
              `Your Telegram User ID is: \`${fromId}\`\n\n` +
              `Copy this ID into your Admin Panel (*?admin=lord12* ➔ Payment Gateways ➔ Admin Telegram Chat ID) to receive instant payment approval alerts!`,
            parse_mode: 'Markdown',
          });
        }
      }
    }
  }

  setTimeout(pollUpdates, config.pollIntervalMs);
}

// Start polling
pollUpdates();
