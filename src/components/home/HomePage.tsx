import React from 'react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  TrendingUp, 
  Gift, 
  DollarSign, 
  Users, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HomePage: React.FC = () => {
  const { wallet, settings, setActiveTab } = useApp();

  return (
    <div className="space-y-3 pb-20 animate-fadeIn">
      {/* EasyBasePoint Quota Arena Game Banner */}
      <div 
        onClick={() => setActiveTab('deposit')}
        className="relative overflow-hidden rounded-3xl border border-orange-500/30 shadow-lg cursor-pointer group transition-transform duration-300 hover:scale-[1.01]"
      >
        <img 
          src="/game_banner.jpg" 
          alt="EasyBasePoint Quota Arena" 
          className="w-full h-40 sm:h-48 object-cover rounded-3xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528] via-black/30 to-transparent flex flex-col justify-end p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#FF6B00] text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                  Quota Arena
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  Up to 14% Returns
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-outfit mt-1 drop-shadow-md">
                Select Your Risk & Maximize Quota
              </h3>
            </div>
            <button className="px-3.5 py-1.5 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-black font-outfit text-xs rounded-xl shadow-orange-glow transition flex items-center gap-1">
              <span>PLAY NOW</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 20% Lifetime Referral Promotional Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF6B00] via-[#FF8526] to-[#FFA24D] text-white p-3.5 sm:p-4 shadow-orange-glow">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>20% Lifetime Referral Bonus</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-100 bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-400/30">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                Real Commission • Instant Payout
              </span>
            </div>

            <h2 className="text-sm sm:text-base font-black font-outfit leading-tight tracking-tight truncate sm:whitespace-normal">
              INVITE YOUR FRIENDS & EARN 20% LIFETIME
            </h2>
            <p className="text-[11px] text-white/90 leading-tight line-clamp-1 sm:line-clamp-none font-normal">
              Share your link and earn direct <strong>20% L1 Lifetime Commission</strong> on every recharge!
            </p>
          </div>

          {/* Compact CTA */}
          <button
            onClick={() => setActiveTab('team')}
            className="flex-shrink-0 px-3.5 py-2 bg-white text-[#FF6B00] hover:bg-orange-50 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-1"
          >
            <span>INVITE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Wallet Card */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 transition-all duration-300">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold tracking-wider uppercase">
            <WalletIcon className="w-4 h-4 text-[#FF6B00]" />
            <span>WALLET BALANCE</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            100% Real Payouts
          </span>
        </div>

        <div className="flex items-baseline justify-between flex-wrap gap-4 mt-1">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1528] font-outfit tracking-tight">
              ₹{wallet.balance.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Available for instant quota purchase or withdrawal
            </p>
          </div>

          <button
            onClick={() => setActiveTab('deposit')}
            className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-sm rounded-2xl shadow-orange-glow transition-all active:scale-95 flex items-center gap-1.5 touch-press"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Top Up</span>
          </button>
        </div>
      </div>

      {/* Rates Grid: USDT Rate & INR Reward */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* USDT Rate Card */}
        <div 
          onClick={() => setActiveTab('deposit')}
          className="glass-card rounded-3xl p-4 sm:p-5 hover:border-orange-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">USDT RATE</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0B1528] font-outfit">
            {settings.usdtRate.toFixed(2)} ₹
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            per 1 USDT
          </div>
        </div>

        {/* INR Reward Card */}
        <div 
          onClick={() => setActiveTab('deposit')}
          className="glass-card rounded-3xl p-4 sm:p-5 hover:border-emerald-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">INR REWARD</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 font-outfit">
            {settings.inrRewardPercent.toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            bonus active
          </div>
        </div>
      </div>

      {/* Metric Cards: Referral Balance, Today Receive, Team Commission */}
      <div className="space-y-2.5">
        {/* Referral Balance Card */}
        <div
          onClick={() => setActiveTab('team')}
          className="glass-card rounded-2xl p-4 flex items-center justify-between hover:translate-x-0.5 hover:border-orange-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100/80 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                REFERRAL BALANCE
              </div>
              <div className="text-lg font-bold text-[#0B1528] font-outfit">
                ₹{wallet.referralBalance.toFixed(2)}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
        </div>

        {/* Today Receive Card */}
        <div
          onClick={() => setActiveTab('history')}
          className="glass-card rounded-2xl p-4 flex items-center justify-between hover:translate-x-0.5 hover:border-orange-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                TODAY RECEIVE
              </div>
              <div className="text-lg font-bold text-[#0B1528] font-outfit">
                ₹{wallet.todayReceive.toFixed(2)}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
        </div>

        {/* Team Commission Card */}
        <div
          onClick={() => setActiveTab('team')}
          className="glass-card rounded-2xl p-4 flex items-center justify-between hover:translate-x-0.5 hover:border-orange-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                TEAM COMMISSION
              </div>
              <div className="text-lg font-bold text-[#0B1528] font-outfit">
                ₹{wallet.teamCommission.toFixed(2)}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};
