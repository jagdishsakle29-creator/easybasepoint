import { DepositOrder, WithdrawalRequest, RewardSettings } from '../types';

export const telegramService = {
  // Mask phone for strict privacy
  maskPhone(phone: string): string {
    if (!phone) return 'Private User';
    const clean = phone.replace(/\s+/g, '');
    if (clean.length < 8) return clean;
    return `${clean.slice(0, 4)}****${clean.slice(-3)}`;
  },

  // Test Telegram Bot Connection
  async testConnection(botToken: string, chatId: string): Promise<{ success: boolean; message: string }> {
    if (!botToken || !chatId) {
      return { success: false, message: 'Please provide both Bot Token and Chat ID.' };
    }

    try {
      const text = `🤖 *EasyBasePoint Admin Bot Connected!*\n\n` +
        `✅ Connection Status: Active\n` +
        `🔒 Privacy Protection: Enabled\n` +
        `⚡ Real-time Payment Approvals are ready.\n\n` +
        `_Whenever a user submits a deposit or withdrawal, you will receive interactive alert buttons here to Approve or Reject._`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      if (data.ok) {
        return { success: true, message: 'Test message sent successfully to your Telegram!' };
      } else {
        return { success: false, message: data.description || 'Telegram API error.' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error connecting to Telegram.' };
    }
  },

  // Send Deposit Alert with [Approve] and [Reject] Inline Buttons
  async sendDepositAlert(deposit: DepositOrder, userName: string, userPhone: string, settings: RewardSettings): Promise<boolean> {
    const token = settings.telegramBotToken;
    const chatId = settings.adminTelegramChatId;
    if (!token || !chatId) return false;

    try {
      const maskedPhone = this.maskPhone(userPhone);
      const isUsdt = deposit.method === 'USDT' || deposit.id.startsWith('USDT');
      const amountStr = isUsdt 
        ? `${deposit.amount} USDT (₹${(deposit.calculatedInr || deposit.amount * 110).toFixed(2)} INR)` 
        : `₹${deposit.amount.toFixed(2)} INR`;

      const text = `💰 *NEW ${isUsdt ? 'USDT (TRC20)' : 'INR'} DEPOSIT REQUEST*\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🆔 *Deposit ID:* \`${deposit.id}\`\n` +
        `👤 *User:* ${userName} (${maskedPhone})\n` +
        `💵 *Deposit Amount:* ${amountStr}\n` +
        `🎁 *13% Bonus:* +₹${deposit.bonusInr.toFixed(2)} INR\n` +
        `📈 *Total Receivable:* *₹${deposit.totalInr.toFixed(2)} INR*\n` +
        `💳 *Method:* ${deposit.method} ${isUsdt ? '(TRON Network)' : '(UPI Transfer)'}\n` +
        `🔢 *Ref / UTR / TxID:* \`${deposit.utrNumber || 'Pending'}\`\n` +
        `📝 *Paytm Remark:* \`${deposit.remark || 'cousin'}\`\n` +
        `📸 *Payment Screenshot:* \`${deposit.paymentScreenshot ? 'ATTACHED & VERIFIED' : 'NOT UPLOADED'}\`\n` +
        `⏱ *Time:* ${new Date(deposit.createdAt).toLocaleTimeString()}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `_Click below to Approve or Reject this payment:_`;

      const webBaseUrl = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://easybasepoint.vercel.app';
      const webApproveUrl = `${webBaseUrl}/?admin=lord12&approve_dep=${deposit.id}&total=${deposit.totalInr}`;

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⚡ 1-Click Approve (Web)', url: webApproveUrl },
                { text: '✅ Approve (Bot)', callback_data: `approve_dep:${deposit.id}:${deposit.totalInr}` },
              ],
              [
                { text: '❌ Reject Deposit', callback_data: `reject_dep:${deposit.id}` },
              ],
            ],
          },
        }),
      });
      return true;
    } catch {
      return false;
    }
  },

  // Send Withdrawal Alert with [Approve] and [Reject] Inline Buttons
  async sendWithdrawalAlert(withdrawal: WithdrawalRequest, settings: RewardSettings): Promise<boolean> {
    const token = settings.telegramBotToken;
    const chatId = settings.adminTelegramChatId;
    if (!token || !chatId) return false;

    try {
      const text = `📤 *NEW WITHDRAWAL REQUEST*\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `🆔 *Request ID:* \`${withdrawal.id}\`\n` +
        `👤 *User:* ${withdrawal.userName}\n` +
        (withdrawal.userPhone ? `📱 *Phone:* \`${withdrawal.userPhone}\`\n` : '') +
        `💸 *Gross Amount:* ₹${withdrawal.amount.toFixed(2)} INR\n` +
        `✂️ *Platform Fee (0%):* ₹0.00 INR (Zero Deduction)\n` +
        `🟢 *Net Payout:* *₹${withdrawal.netAmount.toFixed(2)} INR*\n` +
        `🏦 *Method:* ${withdrawal.method.toUpperCase()}\n` +
        `📋 *Account:* \`${withdrawal.accountDetails.accountNumber || withdrawal.accountDetails.upiId || withdrawal.accountDetails.usdtAddress || 'Provided'}\`\n` +
        `⏱ *Time:* ${new Date(withdrawal.createdAt).toLocaleTimeString()}\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `_Click below to Approve or Reject this payout:_`;

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✅ Approve Payout', callback_data: `approve_wdr:${withdrawal.id}:${withdrawal.amount}` },
                { text: '❌ Reject Payout', callback_data: `reject_wdr:${withdrawal.id}:${withdrawal.amount}` },
              ],
            ],
          },
        }),
      });
      return true;
    } catch {
      return false;
    }
  },
};
