import React from 'react';
import { isAppMode } from '../../utils/appDetector';

/**
 * Official PhonePe Logo
 * Iconic purple circle (#5F259F) with crisp white Devanagari "पे" glyph
 */
export const PhonePeLogo: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-5 h-5',
  size,
}) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <div
      style={style}
      className={`rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm shrink-0 ${className}`}
    >
      <div className="w-full h-full rounded-full bg-[#5F259F] flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 24 24"
          className="w-[90%] h-[90%]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#FFFFFF"
            d="M10.206 9.941h2.949v4.692c-.402.201-.938.268-1.34.268-1.072 0-1.609-.536-1.609-1.743zm13.47 4.816c-1.523 6.449-7.985 10.442-14.433 8.919C2.794 22.154-1.199 15.691.324 9.243C1.847 2.794 8.309-1.199 14.757.324c6.449 1.523 10.442 7.985 8.919 14.433m-6.231-5.888a.887.887 0 0 0-.871-.871h-1.609l-3.686-4.222c-.335-.402-.871-.536-1.407-.402l-1.274.401c-.201.067-.268.335-.134.469l4.021 3.82H6.386c-.201 0-.335.134-.335.335v.67c0 .469.402.871.871.871h.938v3.217c0 2.413 1.273 3.82 3.418 3.82.67 0 1.206-.067 1.877-.335v2.145c0 .603.469 1.072 1.072 1.072h.938a.432.432 0 0 0 .402-.402V9.874h1.542c.201 0 .335-.134.335-.335v-.67z"
          />
        </svg>
      </div>
    </div>
  );
};

/**
 * Official Paytm Logo
 * Iconic white badge with Navy Blue "Pay" (#002E6E) + Cyan Blue "tm" (#00BAF2)
 */
export const PaytmLogo: React.FC<{ className?: string }> = ({
  className = 'px-1.5 py-0.5 text-xs',
}) => {
  return (
    <div
      className={`rounded-md bg-white flex items-center justify-center shadow-xs shrink-0 font-outfit font-black tracking-tight leading-none select-none ${className}`}
    >
      <span className="text-[#002E6E]">Pay</span>
      <span className="text-[#00BAF2]">tm</span>
    </div>
  );
};

export interface LaunchUpiOptions {
  appKey: 'phonepe' | 'paytm' | 'gpay' | 'upi';
  appName: string;
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
  onOpenModal?: () => void;
  addToast?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

/**
 * Foolproof cross-platform UPI App launcher.
 * Works seamlessly on:
 * 1. EasyBasePoint Android APK (WebView)
 * 2. Android Chrome / Firefox / Brave / Samsung Internet
 * 3. iOS Safari
 * 4. Desktop (falls back to QR code + auto-copy)
 */
export const launchUpiPayment = ({
  appKey,
  appName,
  upiId,
  payeeName,
  amount,
  note = 'TopUp',
  onOpenModal,
  addToast,
}: LaunchUpiOptions): void => {
  if (typeof window === 'undefined') return;

  // 1. Proactively copy UPI ID to clipboard
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(upiId).catch(() => {});
    }
  } catch {}

  // 2. Open deposit/verification modal so user can enter UTR immediately upon return
  if (onOpenModal) {
    onOpenModal();
  }

  // 3. Platform & Environment checks
  const inApp = isAppMode();
  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMobile = isAndroid || isIOS || inApp || (typeof window !== 'undefined' && window.innerWidth <= 768);

  if (!isMobile) {
    addToast?.(
      'info',
      `Selected ₹${amount} for ${appName}. Please scan the QR code or pay to UPI ID: ${upiId}`
    );
    return;
  }

  // 4. Construct clean UPI URIs (No &mode=02 to guarantee P2P compatibility)
  const encodedUpiId = encodeURIComponent(upiId);
  const encodedPayee = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(note);

  const standardUpi = `upi://pay?pa=${encodedUpiId}&pn=${encodedPayee}&am=${amount}&cu=INR&tn=${encodedNote}`;

  // PhonePe URIs
  const phonepeScheme = `phonepe://pay?pa=${encodedUpiId}&pn=${encodedPayee}&am=${amount}&cu=INR&tn=${encodedNote}`;
  const phonepeIntent = `intent://pay?pa=${encodedUpiId}&pn=${encodedPayee}&am=${amount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=com.phonepe.app;action=android.intent.action.VIEW;end`;

  // Paytm URIs
  const paytmScheme = `paytmmp://pay?pa=${encodedUpiId}&pn=${encodedPayee}&am=${amount}&cu=INR&tn=${encodedNote}`;
  const paytmIntent = `intent://pay?pa=${encodedUpiId}&pn=${encodedPayee}&am=${amount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=net.one97.paytm;action=android.intent.action.VIEW;end`;

  // Google Pay URIs
  const gpayScheme = `gpay://upi/pay?pa=${encodedUpiId}&pn=${encodedPayee}&am=${amount}&cu=INR&tn=${encodedNote}`;
  const gpayIntent = `intent://pay?pa=${encodedUpiId}&pn=${encodedPayee}&am=${amount}&cu=INR&tn=${encodedNote}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.VIEW;end`;

  // 5. Native APK Bridge check
  const bridge = (window as any).AndroidBridge || (window as any).Android;
  if (bridge) {
    if (typeof bridge.openUpi === 'function') {
      try {
        const handled = bridge.openUpi(standardUpi);
        if (handled) {
          addToast?.('success', `Opening ${appName} for ₹${amount}...`);
          return;
        }
      } catch (err) {
        console.warn('AndroidBridge.openUpi failed:', err);
      }
    }
  }

  addToast?.('success', `Opening ${appName} directly for ₹${amount}... (UPI ID Copied)`);

  // Helper to trigger navigation reliably
  const triggerUrl = (url: string) => {
    try {
      window.location.href = url;
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 6. App Dispatch Logic
  if (appKey === 'phonepe') {
    if (inApp || isIOS) {
      // Inside APK WebView or iOS: direct scheme
      triggerUrl(phonepeScheme);
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          triggerUrl(standardUpi);
        }
      }, 900);
    } else if (isAndroid) {
      // Android Chrome: package intent
      triggerUrl(phonepeIntent);
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          triggerUrl(phonepeScheme);
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              triggerUrl(standardUpi);
            }
          }, 800);
        }
      }, 700);
    } else {
      triggerUrl(phonepeScheme);
    }
  } else if (appKey === 'paytm') {
    if (inApp || isIOS) {
      // Inside APK WebView or iOS: direct scheme
      triggerUrl(paytmScheme);
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          triggerUrl(standardUpi);
        }
      }, 900);
    } else if (isAndroid) {
      // Android Chrome: package intent
      triggerUrl(paytmIntent);
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          triggerUrl(paytmScheme);
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              triggerUrl(standardUpi);
            }
          }, 800);
        }
      }, 700);
    } else {
      triggerUrl(paytmScheme);
    }
  } else if (appKey === 'gpay') {
    if (inApp || isIOS) {
      triggerUrl(gpayScheme);
    } else if (isAndroid) {
      triggerUrl(gpayIntent);
    } else {
      triggerUrl(standardUpi);
    }
  } else {
    // Generic UPI
    triggerUrl(standardUpi);
  }
};
