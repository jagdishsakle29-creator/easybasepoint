/**
 * EasyBasePoint - Centralized Application Constants & Configuration
 * 
 * All external links, company branding details, and channel references 
 * are maintained in this single source of truth.
 */

// Official Configured Company Telegram Channel
export const TELEGRAM_CHANNEL_URL = 'https://t.me/easybasepoint';
export const TELEGRAM_APP_URL = 'tg://resolve?domain=easybasepoint';
export const TELEGRAM_SUPPORT_HANDLE = '@easybasepoint';

// Company Branding & Meta
export const COMPANY_CONFIG = {
  name: 'EasyBasePoint',
  shortName: 'EBP',
  tagline: 'Official High-Yield Base Point Community',
  description: 'Join thousands of verified players earning daily returns, instant INR/USDT deposits, and 24/7 automated settlements.',
  officialTelegram: TELEGRAM_CHANNEL_URL,
  supportTelegram: 'https://t.me/easybasepoint',
  welcomeBonusInr: 50.00,
  minDepositInr: 500,
  minWithdrawalInr: 200,
};

/**
 * Robust cross-platform Telegram Channel Opener:
 * - On Mobile: Tries natural deep-link (tg://) to open native Telegram App with fallback to Web.
 * - On Desktop: Safely opens official Telegram Web in a clean new tab.
 */
export const openOfficialTelegramChannel = (customUrl?: string): void => {
  const targetUrl = customUrl || TELEGRAM_CHANNEL_URL;
  if (typeof window === 'undefined') return;

  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

  if (isMobile) {
    let appOpened = false;
    const startTime = Date.now();

    // Try native app scheme first
    window.location.href = TELEGRAM_APP_URL;

    // Fallback to web link if app doesn't take over within 1.2s
    setTimeout(() => {
      if (Date.now() - startTime < 2000 && !appOpened) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    }, 1200);
  } else {
    // Desktop: Open in new tab securely
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
};
