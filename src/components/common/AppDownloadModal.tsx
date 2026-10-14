import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Share2, 
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => (typeof window !== 'undefined' ? (window as any).deferredInstallPrompt : null));
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [installStep, setInstallStep] = useState<'idle' | 'installing' | 'installed'>('idle');
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    if ((window as any).deferredInstallPrompt) {
      setDeferredPrompt((window as any).deferredInstallPrompt);
    }

    // Listen for PWA install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleCustomPwa = (e: any) => {
      setDeferredPrompt(e.detail || (window as any).deferredInstallPrompt);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('ebp:can-install-pwa', handleCustomPwa);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallStep('installed');
      setDeferredPrompt(null);
    });

    // Check if already in standalone mode (already installed & opened as app)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('ebp:can-install-pwa', handleCustomPwa);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    const promptEvent = deferredPrompt || (window as any).deferredInstallPrompt;
    if (promptEvent) {
      setInstallStep('installing');
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setInstallStep('installed');
          (window as any).deferredInstallPrompt = null;
          setDeferredPrompt(null);
        } else {
          setInstallStep('idle');
        }
      } catch {
        setInstallStep('idle');
      }
    } else {
      // Browser didn't provide programmatic prompt: open instant manual guide
      setShowManualGuide(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-gradient-to-b from-[#0F1E36] via-[#0A1424] to-[#060D18] text-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(255,107,0,0.35)] border-2 border-orange-500/40 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 p-0.5 shadow-md flex items-center justify-center">
              <img 
                src="/icon-192.png" 
                alt="EasyBase App Icon" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <h3 className="font-outfit font-black text-base text-white flex items-center gap-1.5">
                <span>Download Official App</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] rounded-full uppercase">
                  v2.1.0
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">Fast, 100% Safe & Play Protect Verified</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* App Showcase Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/15 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#0B1528] border-2 border-amber-400 p-1 flex-shrink-0 shadow-lg flex items-center justify-center">
              <img 
                src="/icon-192.png" 
                alt="EasyBase App" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-outfit font-black text-sm text-white">EasyBase Point</span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 uppercase">
                  OFFICIAL
                </span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Play Protect Verified</span>
              </div>
              <div className="text-[10px] text-amber-300/90 font-bold mt-0.5">
                22% Daily Quota • 5-7 Mins Auto Payouts
              </div>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
            <div className="p-2 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Size</div>
              <div className="text-xs font-black text-emerald-300 font-outfit">197 KB</div>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Safety</div>
              <div className="text-xs font-black text-amber-300 font-outfit">100% Safe</div>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Rating</div>
              <div className="text-xs font-black text-yellow-300 font-outfit">★ 4.9 / 5.0</div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5">
          {/* Direct Download Android APK Button (Works everywhere) */}
          <a
            href="/EasyBasePoint.apk"
            download="EasyBasePoint_v2.1.0.apk"
            className="w-full py-3.5 bg-gradient-to-r from-[#FF6B00] via-[#FF7E1D] to-amber-500 hover:from-[#E55F00] hover:to-orange-500 text-white font-black text-sm font-outfit rounded-2xl shadow-[0_4px_24px_rgba(255,107,0,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer no-underline"
          >
            <Download className="w-5 h-5 text-white" />
            <span>📲 Download Official Android APK (197 KB)</span>
          </a>

          {/* 1-Tap Web App Install Button */}
          {isInstalled ? (
            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>✓ App is already installed on this device!</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNativeInstall}
              disabled={installStep === 'installing'}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs font-outfit rounded-xl border border-white/15 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>
                {installStep === 'installing' 
                  ? 'Adding App to Device...' 
                  : deferredPrompt 
                  ? '⚡ 1-Tap Add to Home Screen' 
                  : '⚡ Install as Web App on Home Screen'}
              </span>
            </button>
          )}
        </div>

        {/* In-App Browser (Telegram / WhatsApp) Help Note */}
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
            <span>💡 Agar Telegram/WhatsApp ke andar khola hai:</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Upar daayein kone me <strong>3 dots (⋮)</strong> dabayein aur <strong>"Open in Chrome" / "Open in Browser"</strong> chunein. Isse APK seedha download ho jayega aur ek click me install ho jayega.
          </p>
        </div>

        {/* Android Chrome 1-Tap Manual Guide */}
        {(!isIOS && showManualGuide) && (
          <div className="p-4 bg-orange-500/15 rounded-2xl border-2 border-[#FF6B00] text-xs space-y-2 animate-fadeIn">
            <div className="font-black text-amber-300 font-outfit text-sm flex items-center gap-1.5">
              <span>📲 Chrome me 1-Click me App Kaise Lagayein:</span>
            </div>
            <ol className="text-xs text-slate-200 space-y-1.5 pl-4 list-decimal leading-relaxed">
              <li>Chrome browser me sabse upar daayein (top right) kone me <strong>3 dots (⋮)</strong> dabayein.</li>
              <li>Menu me <strong>'Install app'</strong> ya <strong>'Add to Home screen'</strong> chunein.</li>
              <li>Neeche <strong>'Install'</strong> button dabayein — App turant phone par install ho jayegi!</li>
            </ol>
          </div>
        )}

        {/* iOS Safari Guide (if iPhone/iPad) */}
        {isIOS && (
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-400/30 text-xs space-y-1.5">
            <div className="font-black text-amber-300 font-outfit flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>How to Install on iPhone / iPad:</span>
            </div>
            <ol className="text-[11px] text-slate-300 space-y-1 pl-4 list-decimal">
              <li>Safari browser me niche <strong>Share button (⎋)</strong> dabayein.</li>
              <li>Niche scroll karke <strong>'Add to Home Screen' (⊞)</strong> chunein.</li>
              <li>Top right me <strong>'Add'</strong> par tap karein — App turant add ho jayegi!</li>
            </ol>
          </div>
        )}

        {/* Trust Badges Footer */}
        <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>No Browser URL Bar</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>256-Bit NPCI Encrypted</span>
          </span>
          <span>Zero Lag • Fast 60FPS</span>
        </div>
      </div>
    </div>
  );
};
