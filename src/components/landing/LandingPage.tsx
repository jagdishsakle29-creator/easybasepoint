import React from 'react';
import { 
  Send, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Coins, 
  TrendingUp, 
  Users, 
  Lock,
  ExternalLink,
  Gift
} from 'lucide-react';
import { COMPANY_CONFIG, openOfficialTelegramChannel } from '../../config/constants';
import { useApp } from '../../context/AppContext';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenRegister }) => {
  const { user, wallet } = useApp();

  const handleJoinTelegram = () => {
    openOfficialTelegramChannel();
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-white flex flex-col font-sans selection:bg-[#FF6B00] selection:text-white relative overflow-hidden">
      {/* Background ambient lighting glows */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#0088cc]/20 via-[#FF6B00]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-20 border-b border-slate-800/80 bg-[#070D18]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0B1528] to-[#1E293B] border border-slate-700/80 flex items-center justify-center shadow-lg shadow-[#FF6B00]/10">
              <div className="w-5 h-5 rounded-md bg-[#FF6B00] flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-xs">E</span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline font-outfit">
                <span className="text-xl font-black tracking-tight text-white">Easy</span>
                <span className="text-xl font-black tracking-tight text-[#FF6B00]">BasePoint</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Official Financial Game
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleJoinTelegram}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0088cc]/15 hover:bg-[#0088cc]/25 text-[#29b6f6] border border-[#0088cc]/30 text-xs font-semibold transition-all hover:scale-105"
            >
              <Send className="w-3.5 h-3.5" />
              <span>@easybasepoint</span>
            </button>

            {user ? (
              <button
                onClick={onEnterApp}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold transition-all shadow-md shadow-[#FF6B00]/20"
              >
                <span>Dashboard (₹{wallet.balance.toFixed(2)})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onEnterApp}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold transition-all"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-10 w-full flex flex-col justify-center relative z-10">
        
        {/* HERO SECTION: Attractively framed Company Graphic Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-gradient-to-b from-slate-900 via-[#0B1528] to-[#070D18] mb-8 group">
          {/* Banner Image with overlay */}
          <div className="relative h-52 sm:h-72 w-full overflow-hidden">
            <img 
              src="/telegram_banner.jpg" 
              alt="EasyBasePoint Official Community Banner" 
              className="w-full h-full object-cover object-center transform group-hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-[#070D18]/50 to-transparent" />
            
            {/* Top Badge Overlay */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#FF6B00] text-xs font-extrabold border border-[#FF6B00]/30 shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                OFFICIAL COMPANY PORTAL
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Real Payouts
              </span>
            </div>
          </div>

          {/* Hero Banner Text & Branding Info */}
          <div className="p-5 sm:p-8 -mt-8 relative z-10 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-black font-outfit tracking-tight text-white">
                  Welcome to <span className="text-[#FF6B00]">EasyBasePoint</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-xl font-medium">
                  {COMPANY_CONFIG.tagline}. Start with a free ₹50 welcome bonus, earn daily quota profit, and enjoy instant bank withdrawals.
                </p>
              </div>

              {/* Free Bonus Callout Pill */}
              <div className="inline-flex sm:flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#FF6B00]/20 to-amber-500/10 border border-[#FF6B00]/30 text-center">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-extrabold uppercase">
                  <Gift className="w-4 h-4 text-[#FF6B00]" />
                  <span>Welcome Gift</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white font-outfit">
                  ₹50 FREE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY CALL-TO-ACTIONS (Visually Prominent & Highly Responsive) */}
        <div className="space-y-3.5 mb-10">
          
          {/* Main Hero Button: JOIN TELEGRAM */}
          <button
            onClick={handleJoinTelegram}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0088cc] via-[#0099ff] to-[#229ED9] hover:from-[#0077b5] hover:to-[#1e8bc3] text-white font-black text-lg sm:text-xl font-outfit tracking-wide shadow-xl shadow-[#0088cc]/30 border border-sky-400/40 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] group relative overflow-hidden"
          >
            {/* Shimmer light effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Send className="w-4 h-4 text-white fill-white" />
            </div>
            <span>JOIN TELEGRAM</span>
            <ExternalLink className="w-4 h-4 text-sky-100 opacity-80" />
          </button>

          <p className="text-center text-xs text-slate-400 font-medium">
            Official Channel: <strong className="text-sky-300 font-semibold">@easybasepoint</strong> • Daily Codes, Quota Signals & 24/7 Help
          </p>

          {/* Secondary Action: CONTINUE / LOGIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={onEnterApp}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/25 transition-all hover:scale-[1.01]"
            >
              <span>CONTINUE TO GAME & WALLET</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenRegister}
              className="w-full py-3.5 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm sm:text-base border border-slate-700 flex items-center justify-center gap-2 transition-all hover:border-slate-600"
            >
              <Gift className="w-4 h-4 text-[#FF6B00]" />
              <span>CLAIM ₹50 SIGNUP BONUS</span>
            </button>
          </div>
        </div>

        {/* TRUST & KEY FEATURES SECTION */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Instant UPI / USDT</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Automated Deposits</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
              <Coins className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">Fast Withdrawals</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Direct to Bank / Crypto</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">High Daily Profit</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Daily Quota Growth</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white">100% Verified</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Secure Cloud Ledger</p>
          </div>
        </div>

        {/* Live Metrics Ticker */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex flex-wrap items-center justify-around gap-4 text-center">
          <div>
            <div className="text-base sm:text-lg font-black text-white font-outfit">₹4.8M+</div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Paid Out</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-outfit">18,400+</div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Members</p>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-base sm:text-lg font-black text-[#FF6B00] font-outfit">24 / 7</div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Live Support</p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        <p>© 2026 EasyBasePoint. All rights reserved. Strictly 18+.</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Official Support: <button onClick={handleJoinTelegram} className="text-sky-400 hover:underline">@easybasepoint on Telegram</button>
        </p>
      </footer>
    </div>
  );
};
