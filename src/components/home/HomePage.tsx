import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Zap,
  Clock,
  Coins
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const HomePage: React.FC = () => {
  const { wallet, settings, setActiveTab, deposits, transactions } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Calculate today's pure commission & profits earned (STRICTLY EXCLUDING deposit principal)
  const todayCommissionEarned = React.useMemo(() => {
    // 1. Extra bonus/commission from approved deposits (e.g. 13% bonus)
    const depositCommission = (deposits || [])
      .filter((d) => d.status === 'completed' || d.status === 'approved')
      .reduce((sum, d) => sum + (Number(d.bonusInr) || 0) + (Number(d.activityRewardInr) || 0), 0);

    // 2. Earnings from quota income / daily profit tasks / referral commissions
    const taskProfit = (transactions || [])
      .filter((t) => (t.type === 'reward' || t.type === 'commission') && t.status === 'completed')
      .filter((t) => !t.note?.includes('Welcome Cash Bonus'))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const teamComm = Number(wallet.teamCommission) || 0;
    const computedTotal = depositCommission + taskProfit + teamComm;

    if (computedTotal > 0) {
      return computedTotal;
    }

    // If wallet.todayReceive has a non-deposit pure commission value (< 450)
    if (wallet.todayReceive > 0 && wallet.todayReceive < 450) {
      return wallet.todayReceive;
    }

    return 0.00;
  }, [deposits, transactions, wallet.todayReceive, wallet.teamCommission]);

  // Auto-swipe banner every 4 seconds as requested!
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const banners = [
    {
      id: 0,
      badge: '🔥 DAILY 13% - 14% INCOME',
      badgeColor: 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white',
      title: 'Earn Up to 14% Daily Quota Profit',
      desc: 'Choose Low, Medium, or High Risk Quotas & multiply your cash daily. 0% withdrawal fees!',
      cta: 'PLAY NOW',
      action: () => setActiveTab('deposit'),
      bgClass: 'from-[#0B1528] via-[#121F38] to-[#1E3052]',
      image: '/game_banner.jpg'
    },
    {
      id: 1,
      badge: '🎁 ₹50 WELCOME BONUS + 20% REFERRAL',
      badgeColor: 'bg-white/20 text-white backdrop-blur-md',
      title: 'Invite Friends & Earn 20% Lifetime',
      desc: 'Claim instant ₹50 welcome bonus! Share your link and get 20% direct L1 commission on every recharge.',
      cta: 'INVITE NOW',
      action: () => setActiveTab('team'),
      bgClass: 'from-[#FF6B00] via-[#FF8526] to-[#FFA24D]',
      image: null
    },
    {
      id: 2,
      badge: '⚡ 5 - 7 MIN EXPRESS DEPOSITS',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
      title: 'Daily Extra Bonus: Up to ₹5,000 Free',
      desc: 'Add ₹5,000 get +₹100 Free • Add ₹20,000 get +₹1,000 Free • Add ₹50,000 get +₹5,000 Free cash bonus!',
      cta: 'ADD FUNDS',
      action: () => setActiveTab('deposit'),
      bgClass: 'from-[#091522] via-[#0D243B] to-[#0E3D34]',
      image: null
    }
  ];

  return (
    <div className="space-y-3 pb-20 animate-fadeIn">
      {/* 4-Second Auto-Swiping Hero Banner Carousel */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 shadow-xl select-none group">
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {banners.map((b) => (
            <div
              key={b.id}
              onClick={b.action}
              className={`min-w-full relative h-48 sm:h-52 p-5 flex flex-col justify-between cursor-pointer bg-gradient-to-r ${b.bgClass}`}
            >
              {b.image && (
                <img 
                  src={b.image} 
                  alt={b.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-overlay pointer-events-none"
                />
              )}
              {/* Decorative Blur Circles */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${b.badgeColor}`}>
                    {b.badge}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>Auto 4s</span>
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black font-outfit text-white tracking-tight leading-snug drop-shadow-md">
                  {b.title}
                </h2>

                <p className="text-xs text-white/85 font-normal max-w-sm line-clamp-2 leading-relaxed">
                  {b.desc}
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between pt-2">
                {/* Dots indicator */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentSlide === idx 
                          ? 'w-6 bg-[#FF6B00]' 
                          : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button 
                  onClick={b.action}
                  className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-[#E55F00] hover:to-orange-500 text-white font-black font-outfit text-xs rounded-xl shadow-orange-glow transition active:scale-95 flex items-center gap-1.5"
                >
                  <span>{b.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
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

        {/* Today Earn Card with Pure Commission Display */}
        <div
          onClick={() => setActiveTab('history')}
          className="glass-card rounded-2xl p-4 flex items-center justify-between hover:translate-x-0.5 hover:border-orange-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  TODAY EARN
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>+₹{todayCommissionEarned.toFixed(2)} Commission</span>
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-black text-emerald-600 font-outfit">
                  ₹{todayCommissionEarned.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-slate-500 font-outfit">
                  {todayCommissionEarned > 0
                    ? `(Today Extra Commission & Profit)`
                    : `(${settings.inrRewardPercent}% Extra Commission On Recharge)`}
                </span>
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
