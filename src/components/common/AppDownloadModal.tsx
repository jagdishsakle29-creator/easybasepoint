import React from 'react';
import { 
  X, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { markAppInstalled } from '../../utils/appDetector';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-gradient-to-b from-[#0F1E36] via-[#0A1424] to-[#060D18] text-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(255,107,0,0.35)] border-2 border-orange-500/40 space-y-4">
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
              <div className="text-xs font-black text-emerald-300 font-outfit">44 MB</div>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Safety</div>
              <div className="text-xs font-black text-amber-300 font-outfit">100% Safe</div>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Rating</div>
              <div className="text-xs font-black text-yellow-300 font-outfit">★ 4.1 / 5.0</div>
            </div>
          </div>
        </div>

        {/* Primary Action Button - Download Android APK */}
        <div className="space-y-3">
          <a
            href="/EasyBasePoint.apk"
            download="EasyBasePoint.apk"
            onClick={() => markAppInstalled()}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF6B00] via-[#FF7E1D] to-amber-500 hover:from-[#E55F00] hover:to-orange-500 text-white font-black text-sm font-outfit rounded-2xl shadow-[0_4px_24px_rgba(255,107,0,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer no-underline"
          >
            <Download className="w-5 h-5 text-white animate-bounce" />
            <span>📲 Download Official Android APK (44 MB)</span>
          </a>
          
          {/* Quick APK Installation Steps */}
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-[11px] text-emerald-200 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>APK Download Hone Ke Baad Install Kaise Karein:</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-normal pl-4">
              • Notification / Downloads par click karke <strong>Open</strong> karein.<br />
              • <strong>Install</strong> dabayein aur login karein.
            </p>
          </div>
        </div>

        {/* Trust Badges Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Official Client</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>256-Bit Encrypted</span>
          </span>
          <span>Fast 60FPS</span>
        </div>
      </div>
    </div>
  );
};
