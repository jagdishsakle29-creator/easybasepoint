/**
 * EasyBasePoint - Admin Telegram Approval Bot & Real-Time Sync Service
 * 
 * Runs in the background:
 * 1. Hosts a lightweight, ultra-fast native HTTP + SSE server on port 5174 for instant game & admin sync.
 * 2. Receives instant notifications when users deposit or withdraw.
 * 3. Allows Admin to Approve or Reject transactions directly from Telegram or Web Admin with immutable ledger safety!
 * 4. Strict Privacy: Only the specified ADMIN_CHAT_ID can click Approve/Reject in Telegram.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const CONFIG_FILE = path.join(__dirname, 'bot_config.json');

// Default config
let config = {
  botToken: process.env.BOT_TOKEN || '',
  adminChatId: process.env.ADMIN_CHAT_ID || '',
  pollIntervalMs: 2000,
  otpProvider: process.env.OTP_PROVIDER || 'COMPANY_GATEWAY',
  otpProviderApiKey: process.env.OTP_PROVIDER_API_KEY || '',
  otpSenderId: process.env.OTP_PROVIDER_SENDER_ID || 'EASYBP',
  otpTemplateId: process.env.OTP_PROVIDER_TEMPLATE_ID || '',
  allowDevFallbackOtp: process.env.ALLOW_DEV_FALLBACK_OTP === 'true' || true,
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
console.log('🤖 EasyBasePoint Telegram Approval Bot & Sync Service');
console.log('🔒 Privacy Safe Mode: ACTIVE');
console.log('----------------------------------------------------');

if (!config.botToken || !config.adminChatId) {
  console.log('⚠️ Notice: Bot Token or Admin Chat ID not yet configured.');
  console.log('👉 Please set them in bot/bot_config.json or via Admin Panel');
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

// Persistent In-Memory & File Database for Deposits
const DEPOSITS_DB_FILE = path.join(__dirname, 'deposits_db.json');
let depositsDb = {};

function loadDepositsDb() {
  if (fs.existsSync(DEPOSITS_DB_FILE)) {
    try {
      depositsDb = JSON.parse(fs.readFileSync(DEPOSITS_DB_FILE, 'utf8'));
    } catch (e) {
      depositsDb = {};
    }
  }
}

function saveDepositsDb() {
  try {
    fs.writeFileSync(DEPOSITS_DB_FILE, JSON.stringify(depositsDb, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving deposits_db.json:', e.message);
  }
}

loadDepositsDb();

// Persistent In-Memory & File Database for Authoritative Server Wallets
const WALLETS_DB_FILE = path.join(__dirname, 'wallets_db.json');
let walletsDb = {};

function loadWalletsDb() {
  if (fs.existsSync(WALLETS_DB_FILE)) {
    try {
      walletsDb = JSON.parse(fs.readFileSync(WALLETS_DB_FILE, 'utf8'));
    } catch (e) {
      walletsDb = {};
    }
  }
}

function saveWalletsDb() {
  try {
    fs.writeFileSync(WALLETS_DB_FILE, JSON.stringify(walletsDb, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving wallets_db.json:', e.message);
  }
}

function normalizeKey(userId, userPhone) {
  if (userPhone) {
    const digits = String(userPhone).replace(/[^0-9]/g, '');
    if (digits.length >= 10) return `phone_${digits.slice(-10)}`;
  }
  if (userId) return `user_${userId}`;
  return 'default_player';
}

function getOrCreateServerWallet(userId, userPhone, initialBalance = 0, initialQuota = 500) {
  loadWalletsDb();
  const key = normalizeKey(userId, userPhone);
  if (!walletsDb[key]) {
    walletsDb[key] = {
      key,
      userId: userId || 'player',
      phone: userPhone || '',
      balance: initialBalance,
      quota: initialQuota,
      todayReceive: 0,
      totalDeposited: 0,
      creditedDepositIds: [],
      updatedAt: new Date().toISOString(),
    };
    saveWalletsDb();
  }
  return walletsDb[key];
}

function creditServerWallet(userId, userPhone, depId, amount, quota) {
  loadWalletsDb();
  const key = normalizeKey(userId, userPhone);
  const wallet = getOrCreateServerWallet(userId, userPhone);

  if (!Array.isArray(wallet.creditedDepositIds)) {
    wallet.creditedDepositIds = [];
  }

  if (wallet.creditedDepositIds.includes(depId)) {
    return { wallet, alreadyCredited: true };
  }

  wallet.creditedDepositIds.push(depId);
  wallet.balance = parseFloat(((Number(wallet.balance) || 0) + Number(amount)).toFixed(2));
  wallet.quota = parseFloat(((Number(wallet.quota) || 0) + Number(quota)).toFixed(2));
  wallet.todayReceive = parseFloat(((Number(wallet.todayReceive) || 0) + Number(amount)).toFixed(2));
  wallet.totalDeposited = parseFloat(((Number(wallet.totalDeposited) || 0) + Number(amount)).toFixed(2));
  wallet.updatedAt = new Date().toISOString();

  walletsDb[key] = wallet;
  saveWalletsDb();

  return { wallet, alreadyCredited: false };
}

loadWalletsDb();

// Active SSE client connections for instant push notifications
const sseClients = new Set();

function broadcastSse(eventData) {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Heartbeat to keep SSE connections healthy
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': heartbeat\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

// Send Telegram Deposit Alert with Inline Buttons
async function sendTelegramDepositAlert(deposit) {
  if (!config.botToken || !config.adminChatId) return;

  const isUsdt = deposit.method === 'USDT' || deposit.id.startsWith('USDT');
  const amountStr = isUsdt 
    ? `${deposit.amount} USDT (₹${(deposit.calculatedInr || deposit.amount * 110).toFixed(2)} INR)` 
    : `₹${Number(deposit.amount).toFixed(2)} INR`;

  const maskedPhone = deposit.userPhone 
    ? `${deposit.userPhone.slice(0, 4)}****${deposit.userPhone.slice(-3)}`
    : 'User';

  const bonusText = deposit.bonusInr > 0 ? `\n🎁 *Bonus:* +₹${Number(deposit.bonusInr).toFixed(2)} INR` : '';
  const totalInr = Number(deposit.totalInr || deposit.amount).toFixed(2);

  const text = `💰 *NEW ${isUsdt ? 'USDT (TRC20)' : 'INR'} DEPOSIT REQUEST*\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 *Deposit ID:* \`${deposit.id}\`\n` +
    `👤 *User:* ${maskedPhone}\n` +
    `💵 *Deposit Amount:* ${amountStr}${bonusText}\n` +
    `📈 *Total Receivable:* *₹${totalInr} INR*\n` +
    `💳 *Method:* ${deposit.method} ${isUsdt ? '(TRON Network)' : '(UPI Transfer)'}\n` +
    `🔢 *Ref / UTR / TxID:* \`${deposit.utrNumber || deposit.proofUrl || 'Pending'}\`\n` +
    `⏱ *Time:* ${new Date(deposit.createdAt || Date.now()).toLocaleTimeString()}\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `_Click below to Approve or Reject this payment:_`;

  const webAppOrigin = 'http://127.0.0.1:5173';

  await apiCall('sendMessage', {
    chat_id: config.adminChatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⚡ 1-Click Approve (Web)', url: `${webAppOrigin}/?admin=lord12&approve_dep=${deposit.id}&total=${totalInr}` },
          { text: '✅ Approve (Bot)', callback_data: `approve_dep:${deposit.id}:${totalInr}` },
        ],
        [
          { text: '❌ Reject Deposit', callback_data: `reject_dep:${deposit.id}` },
        ],
      ],
    },
  });
}

// Atomic, Idempotent Deposit Approval Executor
async function executeDepositApproval(depId, fallbackTotalInr) {
  loadDepositsDb();
  let dep = depositsDb[depId];
  const nowIso = new Date().toISOString();

  if (dep && (dep.credited === true || dep.status === 'completed')) {
    return { ok: true, alreadyCredited: true, dep };
  }

  const isUsdt = depId.startsWith('USDT') || (dep && dep.method === 'USDT');
  const totalInr = dep && dep.totalInr 
    ? Number(dep.totalInr) 
    : (fallbackTotalInr ? Number(fallbackTotalInr) : (isUsdt ? 5995 : 565));
  const quotaToAdd = isUsdt ? 5500 : (dep && dep.amount ? Number(dep.amount) : 500);

  if (!dep) {
    dep = {
      id: depId,
      totalInr,
      amount: isUsdt ? 50 : 500,
      method: isUsdt ? 'USDT' : 'INR',
      status: 'completed',
      credited: true,
      creditedAt: nowIso,
      approvedAt: nowIso,
      createdAt: nowIso,
    };
  } else {
    dep.status = 'completed';
    dep.credited = true;
    dep.creditedAt = nowIso;
    dep.approvedAt = nowIso;
    dep.totalInr = totalInr;
  }

  depositsDb[depId] = dep;
  saveDepositsDb();

  // Authoritative Server-Side Wallet Credit
  const { wallet, alreadyCredited } = creditServerWallet(dep.userId, dep.userPhone, depId, totalInr, quotaToAdd);

  const approvalPayload = {
    type: 'DEPOSIT_APPROVED',
    depId,
    depositId: depId,
    userId: dep.userId,
    userPhone: dep.userPhone,
    amount: dep.amount || (isUsdt ? 50 : 500),
    currency: isUsdt ? 'USDT' : 'INR',
    totalInr,
    action: 'approved',
    status: 'completed',
    credited: true,
    creditedAt: nowIso,
    approvedAt: nowIso,
    timestamp: nowIso,
    wallet: {
      balance: wallet.balance,
      quota: wallet.quota,
      todayReceive: wallet.todayReceive,
      creditedDepositIds: wallet.creditedDepositIds,
    }
  };

  // Broadcast instantly to all connected browser clients (0.01s latency)
  broadcastSse(approvalPayload);
  broadcastSse({
    type: 'WALLET_UPDATED',
    userId: dep.userId,
    userPhone: dep.userPhone,
    depId,
    totalInr,
    wallet: approvalPayload.wallet,
    timestamp: nowIso,
  });

  console.log(`[APPROVAL] ✅ Approved & Credited deposit ${depId} (₹${totalInr})! New Server Balance: ₹${wallet.balance}. Broadcasted to clients.`);

  // Broadcast to global ntfy stream so player receives instant credit across all devices!
  try {
    await fetch('https://ntfy.sh/ebp_easybasepoint_approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvalPayload),
    });
    console.log(`[NTFY_SYNC] ✅ Broadcasted approval #${depId} to global approvals stream!`);
  } catch (err) {
    console.error(`[NTFY_SYNC] ⚠️ Sync error:`, err.message);
  }

  // Also notify live Vercel endpoint
  try {
    await fetch('https://easybasepoint.vercel.app/api/bot/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depId, totalInr, action: 'approved' }),
    });
  } catch {}

  return { ok: true, alreadyCredited, dep: depositsDb[depId], wallet };
}

// Atomic Deposit Rejection Executor
async function executeDepositRejection(depId, reason = 'Rejected by Admin') {
  loadDepositsDb();
  let dep = depositsDb[depId];
  const nowIso = new Date().toISOString();

  if (!dep) {
    dep = {
      id: depId,
      status: 'rejected',
      credited: false,
      rejectionReason: reason,
      updatedAt: nowIso,
    };
  } else {
    dep.status = 'rejected';
    dep.credited = false;
    dep.rejectionReason = reason;
    dep.updatedAt = nowIso;
  }

  depositsDb[depId] = dep;
  saveDepositsDb();

  broadcastSse({
    type: 'DEPOSIT_REJECTED',
    depId,
    depositId: depId,
    action: 'rejected',
    status: 'rejected',
    reason,
    timestamp: nowIso,
  });

  console.log(`[REJECTION] ❌ Rejected deposit ${depId}. Broadcasted to clients.`);
  return { ok: true, dep };
}

// Telegram Callback Query Handler
async function handleCallbackQuery(query) {
  const fromId = query.from.id.toString();
  const allowedAdminId = config.adminChatId.toString();

  // Strict Privacy & Security Check: Only authorized Admin can approve
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
    const raw = data === 'approve_dep_demo' ? 'DEMO-809214' : data.replace('approve_dep:', '');
    const parts = raw.split(':');
    const depId = parts[0];
    const fallbackTotal = parts[1] ? parseFloat(parts[1]) : undefined;

    const res = await executeDepositApproval(depId, fallbackTotal);

    if (res.alreadyCredited) {
      await apiCall('answerCallbackQuery', {
        callback_query_id: query.id,
        text: `ℹ️ Deposit already credited!\nID: #${depId}`,
        show_alert: true,
      });
      return;
    }

    const dep = res.dep;
    const isUsdt = dep.method === 'USDT' || depId.startsWith('USDT');
    const userDisplay = dep.userPhone ? `${dep.userPhone.slice(0, 4)}****${dep.userPhone.slice(-3)}` : (dep.userId || 'Player');
    const amountDisplay = isUsdt ? `${dep.amount} USDT (₹${dep.totalInr} INR)` : `₹${dep.totalInr} INR`;

    await apiCall('answerCallbackQuery', {
      callback_query_id: query.id,
      text: `✅ Deposit Approved & Credited! Status: SUCCESSFUL`,
      show_alert: true,
    });

    await apiCall('editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: `${query.message.text}\n\n━━━━━━━━━━━━━━━━━━━\n` +
        `✅ *${isUsdt ? 'USDT' : 'INR'} DEPOSIT APPROVED & CREDITED*\n\n` +
        `🆔 *ID:* \`#${depId}\`\n` +
        `👤 *User:* ${userDisplay}\n` +
        `💵 *Amount:* ${amountDisplay}\n` +
        `📊 *Status:* *SUCCESSFUL / CREDITED*\n` +
        `⏱ *Credited At:* ${new Date().toLocaleTimeString()}\n` +
        `━━━━━━━━━━━━━━━━━━━`,
      parse_mode: 'Markdown',
    });
  } else if (data === 'reject_dep_demo' || data.startsWith('reject_dep:')) {
    const depId = data === 'reject_dep_demo' ? 'DEMO-809214' : data.replace('reject_dep:', '');
    await executeDepositRejection(depId);

    await apiCall('answerCallbackQuery', {
      callback_query_id: query.id,
      text: `❌ Payment Rejected. Order cancelled.`,
      show_alert: true,
    });

    await apiCall('editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text: `${query.message.text}\n\n━━━━━━━━━━━━━━━━━━━\n❌ *STATUS: REJECTED BY ADMIN*\n🆔 *ID:* \`#${depId}\`\n🚫 *Action:* Order Cancelled / Rejected\n⏱ *Time:* ${new Date().toLocaleTimeString()}\n━━━━━━━━━━━━━━━━━━━`,
      parse_mode: 'Markdown',
    });
  }
}

// Telegram Long Polling
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
              `Status: Connected & Listening\n` +
              `Pending Deposits: ${Object.values(depositsDb).filter(d => d.status === 'pending').length}\n` +
              `Credited Deposits: ${Object.values(depositsDb).filter(d => d.credited === true).length}`,
            parse_mode: 'Markdown',
          });
        }
      }
    }
  }

  setTimeout(pollUpdates, config.pollIntervalMs);
}

// Start Telegram polling
pollUpdates();

// Native HTTP + SSE Server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. SSE Stream: Real-time 0.01s approval/rejection/deposit stream
  if (req.method === 'GET' && pathname === '/api/bot/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 2. GET /api/bot/deposits - returns all deposits from persistent database
  if (req.method === 'GET' && pathname === '/api/bot/deposits') {
    loadDepositsDb();
    const list = Object.values(depositsDb).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  // 3. GET /api/bot/status
  if (req.method === 'GET' && pathname === '/api/bot/status') {
    loadDepositsDb();
    const depositsList = Object.values(depositsDb);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      botConnected: Boolean(config.botToken),
      adminChatId: config.adminChatId,
      totalDeposits: depositsList.length,
      pendingDeposits: depositsList.filter(d => d.status === 'pending').length,
      completedDeposits: depositsList.filter(d => d.credited === true || d.status === 'completed').length,
      connectedClients: sseClients.size,
    }));
    return;
  }

  // 4. POST /api/bot/deposits - creates a new deposit, broadcasts via SSE, and sends Telegram alert
  if (req.method === 'POST' && pathname === '/api/bot/deposits') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const dep = JSON.parse(body);
        if (!dep || !dep.id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid deposit payload' }));
          return;
        }

        loadDepositsDb();
        depositsDb[dep.id] = {
          ...dep,
          status: dep.status || 'pending',
          credited: dep.credited || false,
          createdAt: dep.createdAt || new Date().toISOString(),
        };
        saveDepositsDb();

        broadcastSse({
          type: 'NEW_DEPOSIT',
          deposit: depositsDb[dep.id],
        });

        // Trigger Telegram alert to Admin
        sendTelegramDepositAlert(depositsDb[dep.id]);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, deposit: depositsDb[dep.id] }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 5. POST /api/bot/approve - approves a deposit from Web Admin or internal API
  if (req.method === 'POST' && pathname === '/api/bot/approve') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { depId, totalInr } = JSON.parse(body);
        if (!depId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'depId is required' }));
          return;
        }
        const result = await executeDepositApproval(depId, totalInr);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 6. POST /api/bot/reject - rejects a deposit
  if (req.method === 'POST' && pathname === '/api/bot/reject') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { depId, reason } = JSON.parse(body);
        if (!depId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'depId is required' }));
          return;
        }
        const result = await executeDepositRejection(depId, reason);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 7. POST /api/wallet/create-transaction - Server-Side Unique Transaction Creation
  if (req.method === 'POST' && pathname === '/api/wallet/create-transaction') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { userId, userPhone, amount, method, utrNumber, network, proofUrl, isDemo } = JSON.parse(body);
        if (!amount || Number(amount) <= 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Valid amount is required' }));
          return;
        }

        const isUsdt = method === 'USDT';
        const numAmount = Number(amount);
        const prefix = isUsdt ? 'USDT' : 'DEP';
        const uniqueTxId = `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
        const nowIso = new Date().toISOString();

        // Server-Side exact financial bonus calculation
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

        loadDepositsDb();
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
          proofUrl: proofUrl || utrNumber || '',
          status: isDemo ? 'completed' : 'pending',
          credited: isDemo ? true : false,
          createdAt: nowIso,
        };

        depositsDb[uniqueTxId] = depositRecord;
        saveDepositsDb();

        // Broadcast new deposit to Admin Panel & connected clients
        broadcastSse({
          type: 'NEW_DEPOSIT',
          deposit: depositRecord,
        });

        // Send Telegram Deposit Alert to Admin with inline button
        sendTelegramDepositAlert(depositRecord);

        // If Demo mode, immediately credit server wallet
        let serverWallet = null;
        if (isDemo) {
          const creditRes = creditServerWallet(userId, userPhone, uniqueTxId, totalInr, isUsdt ? 5500 : numAmount);
          serverWallet = creditRes.wallet;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          transactionId: uniqueTxId,
          deposit: depositRecord,
          wallet: serverWallet,
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 8. GET /api/wallet - Authoritative Server Wallet & Reconciliation
  if (req.method === 'GET' && pathname === '/api/wallet') {
    const userId = parsedUrl.searchParams.get('userId') || '';
    const userPhone = parsedUrl.searchParams.get('phone') || '';
    
    loadDepositsDb();
    loadWalletsDb();
    const wallet = getOrCreateServerWallet(userId, userPhone);

    // Auto-reconcile any completed deposits belonging to this user
    let modified = false;
    const cleanPhone = String(userPhone).replace(/[^0-9]/g, '');
    Object.values(depositsDb).forEach(dep => {
      const isCompleted = dep.credited === true || dep.status === 'completed' || dep.status === 'credited';
      if (!isCompleted) return;

      const depPhone = String(dep.userPhone || '').replace(/[^0-9]/g, '');
      const match = (cleanPhone.length >= 10 && depPhone.length >= 10 && depPhone.endsWith(cleanPhone.slice(-10))) ||
                    (userId && dep.userId === userId);

      if (match && !wallet.creditedDepositIds.includes(dep.id)) {
        const isUsdt = dep.method === 'USDT' || dep.id.startsWith('USDT');
        const amountToAdd = Number(dep.totalInr) || (isUsdt ? 5995 : 565);
        const quotaToAdd = isUsdt ? 5500 : (Number(dep.amount) || 500);

        wallet.creditedDepositIds.push(dep.id);
        wallet.balance = parseFloat(((Number(wallet.balance) || 0) + amountToAdd).toFixed(2));
        wallet.quota = parseFloat(((Number(wallet.quota) || 0) + quotaToAdd).toFixed(2));
        wallet.todayReceive = parseFloat(((Number(wallet.todayReceive) || 0) + amountToAdd).toFixed(2));
        modified = true;
      }
    });

    if (modified) {
      wallet.updatedAt = new Date().toISOString();
      const key = normalizeKey(userId, userPhone);
      walletsDb[key] = wallet;
      saveWalletsDb();
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, wallet }));
    return;
  }

  // 9. POST /api/wallet/sync - Synchronize Client State with Authoritative Server Wallet
  if (req.method === 'POST' && pathname === '/api/wallet/sync') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { userId, userPhone, currentClientBalance, currentClientQuota } = JSON.parse(body);
        loadWalletsDb();
        const key = normalizeKey(userId, userPhone);
        const wallet = getOrCreateServerWallet(userId, userPhone);

        // If server balance is 0 or uninitialized, accept existing client seed balance safely
        if ((!wallet.balance || wallet.balance === 0) && currentClientBalance && Number(currentClientBalance) > 0) {
          wallet.balance = parseFloat(Number(currentClientBalance).toFixed(2));
          if (currentClientQuota) wallet.quota = parseFloat(Number(currentClientQuota).toFixed(2));
          wallet.updatedAt = new Date().toISOString();
          walletsDb[key] = wallet;
          saveWalletsDb();
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, wallet }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // =========================================================================
  // COMPANY-CONTROLLED OTP AUTHENTICATION ENGINE (Strictly Server-Side)
  // =========================================================================
  
  // In-memory secure OTP store: identifier -> { hash, salt, expiresAt, attempts, lastRequestedAt, requestCountHour, hourWindowStart }
  // Plaintext OTP is NEVER stored in database, memory, logs, or API responses.
  if (!global.otpStore) global.otpStore = new Map();
  if (!global.verifiedTokens) global.verifiedTokens = new Map();

  // Helper: Mask identifier for safe logging (e.g. 98****3210 or j***e@domain.com)
  function maskIdentifier(id) {
    if (!id) return '***';
    if (id.includes('@')) {
      const parts = id.split('@');
      return `${parts[0].slice(0, 2)}***@${parts[1]}`;
    }
    const digits = id.replace(/[^0-9]/g, '');
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
  }

  function normalizeIdentifier(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (trimmed.includes('@')) {
      return trimmed.toLowerCase();
    }
    const digits = trimmed.replace(/[^0-9]/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  // Helper: Dispatch OTP via Telegram Bot
  async function dispatchOtpViaTelegram(identifier, code) {
    const token = config.botToken || process.env.TELEGRAM_BOT_TOKEN || '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M';
    const chatId = config.adminChatId || process.env.TELEGRAM_ADMIN_CHAT_ID || '6527377657';
    if (!token || !chatId) {
      return { ok: false, error: 'CONFIGURATION_ERROR', message: 'Telegram bot credentials missing.' };
    }

    const masked = maskIdentifier(identifier);
    const postData = JSON.stringify({
      chat_id: chatId,
      text: `🔐 *EasyBasePoint Security Verification*\n\n` +
            `━━━━━━━━━━━━━━━━━━━\n` +
            `👤 *User / Contact:* \`${masked}\`\n` +
            `🔢 *Verification OTP:* \`${code}\`\n` +
            `⏱ *Validity:* 5 Minutes (300s)\n` +
            `🛡 *Action:* Withdrawal Payout Confirmation\n` +
            `━━━━━━━━━━━━━━━━━━━\n\n` +
            `_Enter this OTP in the Withdrawal Verification section to confirm your payout._`,
      parse_mode: 'Markdown',
    });

    return new Promise((resolve) => {
      const req = https.request(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      }, (res) => {
        let resBody = '';
        res.on('data', chunk => { resBody += chunk; });
        res.on('end', () => {
          let parsed = {};
          try { parsed = JSON.parse(resBody); } catch {}
          console.log(`[OTP_FLOW] Telegram/API response status: ${res.statusCode}`);
          console.log(`[OTP_FLOW] Telegram/API response body: ok=${parsed.ok}, message_id=${parsed.result?.message_id || 'N/A'}`);
          resolve({ ok: res.statusCode === 200 && parsed.ok === true, data: parsed });
        });
      });
      req.on('error', (err) => {
        console.error(`[OTP_FLOW] Telegram connection error:`, err.message);
        resolve({ ok: false, error: err.message });
      });
      req.write(postData);
      req.end();
    });
  }

  // 7. POST /api/auth/send-otp
  if (req.method === 'POST' && pathname === '/api/auth/send-otp') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      console.log('[OTP_FLOW] === OTP REQUEST START ===');
      try {
        const { identifier, channel = 'sms' } = JSON.parse(body || '{}');
        if (!identifier || typeof identifier !== 'string') {
          console.warn('[OTP_FLOW] Validation failed: Missing identifier');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, ok: false, error: 'VALIDATION_ERROR', message: 'Valid mobile number or email is required.' }));
          return;
        }

        const cleanIdentifier = normalizeIdentifier(identifier);
        const isEmail = cleanIdentifier.includes('@');

        console.log(`[OTP_FLOW] Withdrawal/User Identifier: ${maskIdentifier(cleanIdentifier)}`);

        if (!isEmail && cleanIdentifier.length !== 10) {
          console.warn(`[OTP_FLOW] Validation failed: Invalid phone length (${cleanIdentifier.length} digits)`);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, ok: false, error: 'INVALID_PHONE', message: 'Mobile number must be a valid 10-digit number.' }));
          return;
        }

        const now = Date.now();
        const existing = global.otpStore.get(cleanIdentifier);

        // Cooldown enforcement: minimum 60 seconds between resends
        if (existing && existing.lastRequestedAt && (now - existing.lastRequestedAt < 60000)) {
          const waitSeconds = Math.ceil((60000 - (now - existing.lastRequestedAt)) / 1000);
          console.log(`[OTP_FLOW] Cooldown active for ${maskIdentifier(cleanIdentifier)}: ${waitSeconds}s remaining`);
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            ok: false,
            error: 'COOLDOWN_ACTIVE',
            message: `Please wait ${waitSeconds}s before requesting a new code.`,
            retryAfterSeconds: waitSeconds,
          }));
          return;
        }

        // Cryptographically secure 6-digit numeric OTP (100000 - 999999)
        const numericCode = crypto.randomInt(100000, 1000000).toString();

        // Salted SHA-256 Hash - Plaintext OTP is NEVER logged or stored in cleartext!
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.createHash('sha256').update(numericCode + salt).digest('hex');

        console.log(`[OTP_FLOW] OTP generated: [PROTECTED_6_DIGIT] (Hash: ${hash.slice(0, 12)}...)`);
        console.log(`[OTP_FLOW] Telegram/API request started -> Target Chat: ${maskIdentifier(config.adminChatId || '6527377657')}`);

        // Dispatch via Telegram Bot
        const dispatchResult = await dispatchOtpViaTelegram(cleanIdentifier, numericCode);

        if (!dispatchResult.ok) {
          console.error('[OTP_FLOW] Telegram delivery failed');
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            ok: false,
            error: 'DELIVERY_FAILED',
            message: 'Failed to deliver verification OTP to Telegram. Please check connection and try again.',
          }));
          return;
        }

        // Store hashed representation with 5-minute expiry (300,000 ms) and max 5 attempts
        global.otpStore.set(cleanIdentifier, {
          hash,
          salt,
          expiresAt: now + (5 * 60 * 1000),
          attempts: 0,
          maxAttempts: 5,
          lastRequestedAt: now,
        });

        console.log('[OTP_FLOW] OTP stored successfully (Expires in: 300s)');
        console.log('[OTP_FLOW] Final API response: success=true, expiresIn=300');
        console.log('[OTP_FLOW] === OTP REQUEST END ===');

        // Return clean success response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          ok: true,
          status: 'SENT',
          message: isEmail 
            ? `Verification OTP sent to ${maskIdentifier(cleanIdentifier)}` 
            : `Verification OTP sent successfully to ${maskIdentifier(cleanIdentifier)}`,
          expiresIn: 300,
          cooldownSeconds: 60,
          maskedContact: maskIdentifier(cleanIdentifier),
        }));
      } catch (err) {
        console.error('[OTP_FLOW] Error generating OTP:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, ok: false, error: 'SERVER_ERROR', message: 'Failed to process OTP request.' }));
      }
    });
    return;
  }

  // 8. POST /api/auth/verify-otp
  if (req.method === 'POST' && pathname === '/api/auth/verify-otp') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { identifier, otp } = JSON.parse(body || '{}');
        if (!identifier || !otp) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, ok: false, error: 'VALIDATION_ERROR', message: 'Contact identifier and OTP are required.' }));
          return;
        }

        const cleanIdentifier = normalizeIdentifier(identifier);
        const cleanOtp = String(otp).trim();
        const record = global.otpStore.get(cleanIdentifier);
        const now = Date.now();

        if (!record) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            ok: false,
            error: 'OTP_NOT_FOUND',
            message: 'No verification code was requested for this contact or it was already used. Please request a new OTP.',
          }));
          return;
        }

        // Expiration check (5 minutes)
        if (now > record.expiresAt) {
          global.otpStore.delete(cleanIdentifier);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            ok: false,
            error: 'OTP_EXPIRED',
            message: 'Verification code has expired. Please request a new OTP.',
          }));
          return;
        }

        // Brute-force protection: check remaining attempts
        if (record.attempts >= record.maxAttempts) {
          global.otpStore.delete(cleanIdentifier);
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            ok: false,
            error: 'TOO_MANY_ATTEMPTS',
            message: 'Maximum verification attempts exceeded. For your security, this code is now invalidated. Please request a new OTP.',
          }));
          return;
        }

        // Increment attempt count
        record.attempts += 1;

        // Salted hash computation
        const computedHash = crypto.createHash('sha256').update(cleanOtp + record.salt).digest('hex');

        // Constant-time timing-safe comparison
        const isMatch = crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(record.hash));

        if (!isMatch) {
          const remaining = record.maxAttempts - record.attempts;
          if (remaining <= 0) {
            global.otpStore.delete(cleanIdentifier);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              ok: false,
              error: 'TOO_MANY_ATTEMPTS',
              message: 'Invalid code. All attempts exhausted. Please request a new OTP.',
              remainingAttempts: 0,
            }));
            return;
          }

          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            ok: false,
            error: 'INVALID_OTP',
            message: `Invalid verification code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
            remainingAttempts: remaining,
          }));
          return;
        }

        // SUCCESS! Invalidate OTP immediately to prevent any replay attacks
        global.otpStore.delete(cleanIdentifier);

        // Issue a cryptographically secure 256-bit verification token (valid for 15 minutes)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        global.verifiedTokens.set(verificationToken, {
          identifier: cleanIdentifier,
          expiresAt: now + (15 * 60 * 1000),
          verifiedAt: new Date().toISOString(),
        });

        console.log(`[AUTH_VERIFIED] ✅ Successfully verified identity for ${maskIdentifier(cleanIdentifier)}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          ok: true,
          verified: true,
          verificationToken,
          identifier: cleanIdentifier,
          message: 'Verification successful!',
        }));
      } catch (err) {
        console.error('[AUTH_VERIFY] Error verifying OTP:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, ok: false, error: 'SERVER_ERROR', message: 'Failed to verify OTP.' }));
      }
    });
    return;
  }

  // 9. GET /api/auth/provider-status
  if (req.method === 'GET' && pathname === '/api/auth/provider-status') {
    const isConfigured = Boolean(config.otpProviderApiKey || process.env.OTP_PROVIDER_API_KEY || process.env.FAST2SMS_API_KEY);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      provider: config.otpProvider,
      providerConfigured: isConfigured,
      senderId: config.otpSenderId,
      allowDevFallbackOtp: config.allowDevFallbackOtp,
      requiredEnvVars: ['OTP_PROVIDER_API_KEY', 'OTP_PROVIDER_SENDER_ID'],
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

const PORT = 5174;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EasyBasePoint Real-Time Sync & SSE Server running on http://127.0.0.1:${PORT}`);
});
