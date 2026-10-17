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
  minDepositInr: 390,
  minWithdrawalInr: 200,
};

/**
 * Robust cross-platform Telegram Channel Opener:
 * - Inside EasyBase Android APK: Directly commands native AndroidBridge to dispatch
 *   ACTION_VIEW system intent to Telegram app or default browser without WebView scheme errors.
 * - On Mobile Browsers / WebViews: Copies @easybasepoint to clipboard for 1-tap backup,
 *   and initiates compliant anchor navigation to official channel.
 * - On Desktop: Safely opens official Telegram Web in a clean new tab.
 */
export const openOfficialTelegramChannel = (customUrl?: string): void => {
  const targetUrl = customUrl || TELEGRAM_CHANNEL_URL;
  if (typeof window === 'undefined') return;

  // 1. Check for native Android APK Bridge (EasyBasePoint Android App)
  const bridge = (window as any).AndroidBridge || (window as any).Android;
  if (bridge) {
    if (typeof bridge.openTelegram === 'function') {
      try {
        const handled = bridge.openTelegram(targetUrl);
        if (handled) return;
      } catch (err) {
        console.warn('AndroidBridge.openTelegram failed:', err);
      }
    }
    if (typeof bridge.openExternal === 'function') {
      try {
        const handled = bridge.openExternal(targetUrl);
        if (handled) return;
      } catch (err) {
        console.warn('AndroidBridge.openExternal failed:', err);
      }
    }
  }

  // 2. Proactively copy @easybasepoint to clipboard as a seamless convenience fallback
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(TELEGRAM_SUPPORT_HANDLE).catch(() => {});
    }
  } catch {}

  // 3. Platform detection
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const isAndroid = /Android/i.test(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid) {
    // In Android: Use invisible anchor with rel=noopener to trigger Android Intent Filter
    try {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
        } catch {}
      }, 200);
    } catch {
      window.location.href = targetUrl;
    }
    return;
  }

  if (isIos) {
    // iOS Safari / Webview
    try {
      window.location.href = TELEGRAM_APP_URL;
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 500);
    } catch {
      window.location.href = targetUrl;
    }
    return;
  }

  // Desktop: Open clean in a new window/tab
  try {
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = targetUrl;
    }
  } catch {
    window.location.href = targetUrl;
  }
};
