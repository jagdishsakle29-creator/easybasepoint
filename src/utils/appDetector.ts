/**
 * Detects if the current user is accessing via the installed Android APK, PWA standalone, or mobile Webview.
 * When true, download prompts, install modals, and the header 'App' button are hidden.
 */
export const isAppMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = Boolean((window.navigator as any).standalone);
    const isAndroidAppReferrer = document.referrer.startsWith('android-app://');
    const isWv = /wv|Android.*Version\/[0-9.]+|EasyBaseApp|Cordova|Capacitor/i.test(navigator.userAgent) || 
                 Boolean((window as any).Android) || 
                 Boolean((window as any).isNativeApp);
    const hasAppQuery = new URLSearchParams(window.location.search).get('app') === 'true' || 
                        new URLSearchParams(window.location.search).get('source') === 'apk' ||
                        new URLSearchParams(window.location.search).get('apk') === 'true' ||
                        new URLSearchParams(window.location.search).get('utm_source') === 'apk';
    const isStoredApp = localStorage.getItem('ebp_is_apk_mode') === 'true' || 
                        localStorage.getItem('ebp_app_already_installed') === 'true';

    const inApp = Boolean(isStandalone || isIosStandalone || isAndroidAppReferrer || isWv || hasAppQuery || isStoredApp);
    if (inApp) {
      localStorage.setItem('ebp_is_apk_mode', 'true');
    }
    return inApp;
  } catch {
    return false;
  }
};

export const markAppInstalled = (): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ebp_is_apk_mode', 'true');
      localStorage.setItem('ebp_app_already_installed', 'true');
    }
  } catch {
    // Ignore storage errors
  }
};

