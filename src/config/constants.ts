/**
 * EasyBasePoint - Centralized Application Constants & Configuration
 * 
 * All external links, company branding details, and channel references 
 * are maintained in this single source of truth.
 */

// Official Configured Company Telegram Channel & Owner Support Handle
export const TELEGRAM_CHANNEL_URL = 'https://t.me/VIEWPOINT78';
export const TELEGRAM_APP_URL = 'tg://resolve?domain=VIEWPOINT78';
export const TELEGRAM_SUPPORT_HANDLE = '@VIEWPOINT78';

// Company Branding & Meta
export const COMPANY_CONFIG = {
  name: 'EasyBasePoint',
  shortName: 'EBP',
  tagline: 'Official High-Yield Base Point Community',
  description: 'Join thousands of verified players earning daily returns, instant INR/USDT deposits, and 24/7 automated settlements.',
  officialTelegram: TELEGRAM_CHANNEL_URL,
  supportTelegram: 'https://t.me/VIEWPOINT78',
  welcomeBonusInr: 50.00,
  minDepositInr: 390,
  minWithdrawalInr: 200,
};

/**
 * Robust cross-platform Telegram Opener:
 * Works 100% on Website (Desktop & Mobile) and Android APK / WebView.
 * 
 * 1. Checks for native Android APK Bridge.
 * 2. Copies username @VIEWPOINT78 to clipboard as seamless backup.
 * 3. Uses direct Android App Intent & tg:// scheme so Telegram app opens instantly.
 * 4. Avoids _blank popup blockers in Android WebViews.
 */
export const openOfficialTelegramChannel = (customUrl?: string): void => {
  if (typeof window === 'undefined') return;

  const rawUrl = customUrl || TELEGRAM_CHANNEL_URL;
  // Clean handle extraction (e.g. "@VIEWPOINT78" or "https://t.me/VIEWPOINT78" -> "VIEWPOINT78")
  const username = rawUrl
    .replace(/^https?:\/\/t\.me\//i, '')
    .replace(/^@/, '')
    .split('/')[0]
    .split('?')[0] || 'VIEWPOINT78';

  const webUrl = `https://t.me/${username}`;
  const appSchemeUrl = `tg://resolve?domain=${username}`;
  const androidIntentUrl = `intent://resolve?domain=${username}#Intent;package=org.telegram.messenger;scheme=tg;end`;

  // 1. Check for native Android APK Bridge (EasyBasePoint Android App)
  const bridge = (window as any).AndroidBridge || (window as any).Android;
  if (bridge) {
    if (typeof bridge.openTelegram === 'function') {
      try {
        const handled = bridge.openTelegram(webUrl);
        if (handled) return;
      } catch (err) {
        console.warn('AndroidBridge.openTelegram failed:', err);
      }
    }
    if (typeof bridge.openExternal === 'function') {
      try {
        const handled = bridge.openExternal(webUrl);
        if (handled) return;
      } catch (err) {
        console.warn('AndroidBridge.openExternal failed:', err);
      }
    }
  }

  // 2. Proactively copy username to clipboard for 1-tap backup
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(`@${username}`).catch(() => {});
    }
  } catch {}

  // 3. Platform Detection
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const isAndroid = /Android/i.test(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid) {
    // Android (Browser & APK WebView):
    // Try launching the Telegram app via intent or tg:// scheme
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = appSchemeUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 500);
    } catch {}

    // Main window navigation to Android Intent (or web fallback in same tab to avoid WebView block)
    setTimeout(() => {
      try {
        window.location.href = androidIntentUrl;
      } catch {
        window.location.href = webUrl;
      }
    }, 50);

    // Final fallback redirect if intent didn't take over within 1.2s
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.href = webUrl;
      }
    }, 1200);
    return;
  }

  if (isIos) {
    // iOS Safari / WebView
    try {
      window.location.href = appSchemeUrl;
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.location.href = webUrl;
        }
      }, 700);
    } catch {
      window.location.href = webUrl;
    }
    return;
  }

  // Desktop: Open clean in a new window/tab, fallback to current window
  try {
    const win = window.open(webUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = webUrl;
    }
  } catch {
    window.location.href = webUrl;
  }
};
