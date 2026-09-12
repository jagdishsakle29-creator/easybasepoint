import React, { useState } from 'react';
import { HelpCircle, ShieldAlert, ShieldCheck, Smartphone, Monitor, Lock, Sparkles, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  onOpenHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHelp }) => {
  const { 
    settings, 
    toggleDemoMode, 
    activeTab, 
    setActiveTab, 
    isMobilePreview, 
    setIsMobilePreview,
    wallet
  } = useApp();

  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0B1528] to-[#1E293B] flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform">
              <div className="w-5 h-5 rounded-md bg-[#FF6B00] flex items-center justify-center">
                <span className="text-white font-black text-xs">E</span>
              </div>
            </div>
            <div className="flex items-baseline font-outfit">
              <span className="text-xl font-black tracking-tight text-[#0B1528]">Easy</span>
              <span className="text-xl font-black tracking-tight text-[#FF6B00]">BasePoint</span>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-2">
            {/* Demo / Live Status Pill - Only visible in secret Admin session */}
            {activeTab === 'admin' && (
              <button
                onClick={toggleDemoMode}
                title="Click to toggle Demo/Production mode"
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  settings.isDemoMode
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {settings.isDemoMode ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>DEMO MODE</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>LIVE BACKEND</span>
                  </>
                )}
              </button>
            )}

            {/* Desktop / Mobile Frame View Switcher (Desktop only) */}
            <button
              onClick={() => setIsMobilePreview(!isMobilePreview)}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 transition"
              title="Toggle mobile device frame"
            >
              {isMobilePreview ? (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Full View</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                  <span>Phone Frame</span>
                </>
              )}
            </button>

            {/* Admin session indicator (Only if opened via secret link ?admin=lord12) */}
            {activeTab === 'admin' && (
              <button
                onClick={() => setActiveTab('home')}
                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold transition flex items-center gap-1 shadow-sm"
                title="Exit Admin Panel"
              >
                <Lock className="w-3 h-3" />
                <span>Exit Admin</span>
              </button>
            )}

            {/* Official Telegram Channel Quick Link */}
            <a
              href={settings.telegramChannelUrl || 'https://t.me/easybasepoint'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition"
              title="Join @easybasepoint Official Telegram"
            >
              <Send className="w-3.5 h-3.5 fill-sky-600 text-sky-600" />
              <span className="hidden sm:inline">Telegram</span>
            </a>

            {/* Help / Information Button */}
            <button
              onClick={() => (onOpenHelp ? onOpenHelp() : setShowInfoModal(true))}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              title="Information & Help"
            >
              <HelpCircle className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Info / Help Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-[#FF6B00]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-outfit">Welcome to EasyBasePoint</h3>
                <p className="text-xs text-slate-500">Fintech Quota & Rewards Platform</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600 leading-relaxed mb-6">
              <p>
                <strong>EasyBasePoint</strong> enables transparent quota management, calculated returns on daily tasks, and team commission tracking.
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform USDT Rate:</span>
                  <span className="font-semibold text-slate-800">₹{settings.usdtRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active INR Reward:</span>
                  <span className="font-semibold text-emerald-600">{settings.inrRewardPercent.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Wallet:</span>
                  <span className="font-semibold text-[#FF6B00]">₹{wallet.balance.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Notice: All transactions adhere to fair usage policies and server-side verification.
              </p>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-3 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-semibold rounded-2xl shadow-orange-glow transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
