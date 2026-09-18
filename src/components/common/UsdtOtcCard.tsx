import React from 'react';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface UsdtOtcCardProps {
  onNavigateToDeposit?: () => void;
  onNavigateToWithdraw?: () => void;
  className?: string;
}

export const UsdtOtcCard: React.FC<UsdtOtcCardProps> = ({ 
  onNavigateToDeposit, 
  onNavigateToWithdraw,
  className = '' 
}) => {
  const { settings, setActiveTab } = useApp();

  const buyRate = settings.usdtBuyRate || 102.00;
  const sellRate = settings.usdtSellRate || 129.00;

  const handleBuy = () => {
    if (onNavigateToDeposit) {
      onNavigateToDeposit();
    } else {
      setActiveTab('deposit');
    }
  };

  const handleSell = () => {
    if (onNavigateToWithdraw) {
      onNavigateToWithdraw();
    } else {
      setActiveTab('withdraw');
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl p-3.5 sm:p-4 bg-gradient-to-r from-[#070E1C] via-[#0E1C33] to-[#142646] text-white border-2 border-orange-500/40 shadow-xl select-none group ${className}`}>
      {/* Background ambient lighting glows */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top Poster Ribbon */}
      <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 flex items-center justify-center text-white shadow-md">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-outfit font-black text-xs sm:text-sm tracking-wide text-white uppercase">
                USDT P2P POSTER DESK
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[8px] font-black uppercase">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                Live 24/7
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[9px] font-black text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase">
          <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
          <span>Profit: +₹{(sellRate - buyRate).toFixed(0)}/USDT</span>
        </div>
      </div>

      {/* Two Poster Side-by-Side Cards (Buy @ 102 & Sell @ 129) */}
      <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3 pt-2.5">
        {/* BUY POSTER PILLAR */}
        <div 
          onClick={handleBuy}
          className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-emerald-500/15 to-emerald-950/30 border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer shadow-md group/buy"
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-black text-emerald-400 uppercase flex items-center gap-0.5">
              <ArrowDownLeft className="w-3 h-3" />
              <span>USDT BUY</span>
            </span>
            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              0% Fee
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-xl sm:text-2xl font-black font-outfit text-white tracking-tight">
              ₹{buyRate.toFixed(0)}
            </span>
            <span className="text-[10px] font-bold text-slate-400">/ USDT</span>
          </div>

          <p className="text-[9px] text-slate-300 line-clamp-1 mb-2">
            Instant UPI & TRC20 credit
          </p>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleBuy(); }}
            className="w-full py-1.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-[11px] font-outfit rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Buy @ ₹{buyRate.toFixed(0)}</span>
            <span>➔</span>
          </button>
        </div>

        {/* SELL POSTER PILLAR */}
        <div 
          onClick={handleSell}
          className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-orange-500/15 to-amber-950/30 border border-orange-500/40 hover:border-orange-400 transition-all cursor-pointer shadow-md group/sell"
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-black text-amber-300 uppercase flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>USDT SELL</span>
            </span>
            <span className="text-[8px] font-black px-1 py-0.2 rounded bg-amber-400 text-slate-950 uppercase">
              VIP High
            </span>
          </div>

          <div className="flex items-baseline gap-1 my-1">
            <span className="text-xl sm:text-2xl font-black font-outfit text-amber-300 tracking-tight">
              ₹{sellRate.toFixed(0)}
            </span>
            <span className="text-[10px] font-bold text-slate-400">/ USDT</span>
          </div>

          <p className="text-[9px] text-slate-300 line-clamp-1 mb-2">
            Direct Bank/UPI payout
          </p>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleSell(); }}
            className="w-full py-1.5 px-2 bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-[#E55F00] hover:to-orange-500 text-white font-black text-[11px] font-outfit rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Sell @ ₹{sellRate.toFixed(0)}</span>
            <span>➔</span>
          </button>
        </div>
      </div>

      {/* Bottom Poster Footer Line */}
      <div className="relative z-10 pt-2 flex items-center justify-between text-[9px] text-slate-300 font-semibold px-0.5">
        <span className="flex items-center gap-1 text-emerald-300">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>102 me Buy • 129 me Sell</span>
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3 h-3 text-[#FF6B00]" />
          <span>100% Escrow • 5-7 Mins Settlement</span>
        </span>
      </div>
    </div>
  );
};
