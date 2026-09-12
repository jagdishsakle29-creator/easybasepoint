import React, { useState, useEffect } from 'react';
import { Send, Sparkles, X, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { openOfficialTelegramChannel } from '../../config/constants';

interface JoinCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinCommunityModal: React.FC<JoinCommunityModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useApp();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleJoin = () => {
    if (dontShowAgain) {
      localStorage.setItem('ebp_hide_community_popup', 'true');
    }
    openOfficialTelegramChannel(settings.telegramChannelUrl);
    onClose();
  };

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('ebp_hide_community_popup', 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 relative animate-scaleUp">
        {/* Banner Graphic Header with embedded telegram_banner.jpg */}
        <div className="relative overflow-hidden">
          <img 
            src="/telegram_banner.jpg" 
            alt="EasyBasePoint Telegram VIP" 
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF6B00] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3 h-3" />
                VIP Community
              </span>
              <span className="text-[10px] font-bold text-sky-300">
                @easybasepoint
              </span>
            </div>
            <h3 className="text-base font-black font-outfit mt-1 tracking-tight">
              Join EasyBasePoint Official VIP
            </h3>
            <p className="text-[11px] text-slate-200">
              Get Daily Codes, Quota Signals & 20% Referrals
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>13% Guaranteed Rewards:</strong> Daily tasks & quota signals</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>Real Amount • 100% Genuine:</strong> Verified settlements</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span><strong>24/7 Priority Assistance:</strong> Direct team manager chat</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleJoin}
            className="w-full py-3.5 bg-gradient-to-r from-[#0088cc] to-[#0099e6] hover:from-[#0077b3] hover:to-[#0088cc] text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>Join Official Telegram</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Do not show again checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded text-[#FF6B00] focus:ring-[#FF6B00]"
              />
              <span>Don't show again today</span>
            </label>

            <button
              onClick={handleClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
