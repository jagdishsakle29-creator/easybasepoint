import React, { useState } from 'react';
import { 
  TrendingUp, 
  Coins, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownLeft
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
  const { settings, setActiveTab, wallet } = useApp();

  const buyRate = settings.usdtBuyRate || 102.00;
  const sellRate = settings.usdtSellRate || 129.00;

  const [activeTab, setActiveTabMode] = useState<'BUY' | 'SELL'>('BUY');
  const [usdtAmount, setUsdtAmount] = useState<number>(100);

  const quickAmounts = [20, 50, 100, 250, 500, 1000];

  const handleAction = () => {
    if (activeTab === 'BUY') {
      if (onNavigateToDeposit) {
        onNavigateToDeposit();
      } else {
        setActiveTab('deposit');
      }
    } else {
      if (onNavigateToWithdraw) {
        onNavigateToWithdraw();
      } else {
        setActiveTab('withdraw');
      }
    }
  };

  const calculatedInr = activeTab === 'BUY' 
    ? (usdtAmount || 0) * buyRate 
    : (usdtAmount || 0) * sellRate;

  const profitSpread = sellRate - buyRate; // ₹27 per USDT!

  return (
    <div className={`rounded-3xl p-4 sm:p-6 bg-gradient-to-br from-[#070E1C] via-[#0D1A30] to-[#14233D] text-white border-2 border-orange-500/30 shadow-2xl relative overflow-hidden group ${className}`}>
      {/* Ambient glowing highlights */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <Coins className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-outfit font-black text-base tracking-wide text-white">
                USDT P2P OTC Exchange Desk
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live 24/7
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Direct Crypto-to-INR Clearing • Instant Settlement • 0% OTC Slippage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold bg-amber-500/15 border border-amber-400/30 px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3 text-yellow-300" />
          <span>Spread Yield: +₹{profitSpread.toFixed(0)}/USDT</span>
        </div>
      </div>

      {/* Classy Live Rate Ticker Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-3 pt-3">
        {/* BUY RATE CARD */}
        <div 
          onClick={() => setActiveTabMode('BUY')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
            activeTab === 'BUY'
              ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg scale-[1.02]'
              : 'bg-black/30 border-white/10 hover:border-emerald-500/40 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] pb-1">
            <span className="font-black text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>We Sell / You Buy</span>
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              0% Fee
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-outfit text-white tracking-tight">
              ₹{buyRate.toFixed(2)}
            </span>
            <span className="text-[11px] font-bold text-slate-400">/ USDT</span>
          </div>
          <p className="text-[10px] text-slate-300 mt-1">
            Buy USDT at flat ₹{buyRate.toFixed(0)} with fast UPI or TRC20 credit
          </p>
        </div>

        {/* SELL RATE CARD */}
        <div 
          onClick={() => setActiveTabMode('SELL')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
            activeTab === 'SELL'
              ? 'bg-gradient-to-br from-orange-500/25 to-amber-900/40 border-[#FF6B00] ring-2 ring-orange-400/30 shadow-lg scale-[1.02]'
              : 'bg-black/30 border-white/10 hover:border-orange-500/40 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] pb-1">
            <span className="font-black text-amber-300 flex items-center gap-1 uppercase tracking-wider">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>We Buy / You Sell</span>
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 uppercase">
              VIP High
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-black font-outfit text-amber-300 tracking-tight">
              ₹{sellRate.toFixed(2)}
            </span>
            <span className="text-[11px] font-bold text-slate-400">/ USDT</span>
          </div>
          <p className="text-[10px] text-slate-300 mt-1">
            Cash out USDT at highest market rate ₹{sellRate.toFixed(0)} to Bank/UPI
          </p>
        </div>
      </div>

      {/* Interactive Trade Desk Calculator */}
      <div className="relative z-10 pt-3 space-y-3">
        {/* Toggle Switch */}
        <div className="bg-black/40 p-1 rounded-2xl flex items-center border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTabMode('BUY')}
            className={`flex-1 py-2 text-xs font-black font-outfit rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'BUY'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Buy USDT (@ ₹{buyRate.toFixed(0)})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMode('SELL')}
            className={`flex-1 py-2 text-xs font-black font-outfit rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'SELL'
                ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Sell USDT (@ ₹{sellRate.toFixed(0)})</span>
          </button>
        </div>

        {/* Quick USDT Amount Chips */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-300 font-bold uppercase">
            <span>Select Amount (USDT)</span>
            <span className="text-amber-300">TRON TRC20 • BSC BEP20</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setUsdtAmount(amt)}
                className={`py-1.5 rounded-xl border text-xs font-black font-outfit transition cursor-pointer ${
                  usdtAmount === amt
                    ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white border-white shadow-sm scale-[1.03]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input and Result Calculation Box */}
        <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">
                {activeTab === 'BUY' ? 'You Buy (USDT)' : 'You Sell (USDT)'}
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min={10}
                  step={5}
                  value={usdtAmount || ''}
                  onChange={(e) => setUsdtAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="USDT Amount"
                  className="w-full px-3 py-2 bg-white/10 rounded-xl border border-white/15 text-white font-black font-outfit text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  USDT
                </span>
              </div>
            </div>

            <div className="text-center font-bold text-slate-500 text-lg pt-4">
              ⇄
            </div>

            <div className="flex-1 text-right">
              <label className="text-[10px] text-slate-400 font-bold uppercase block">
                {activeTab === 'BUY' ? 'You Pay (INR)' : 'You Receive (INR)'}
              </label>
              <div className="mt-1 py-2 px-3 bg-white/5 rounded-xl border border-white/10 text-right">
                <span className={`text-base sm:text-lg font-black font-outfit ${
                  activeTab === 'BUY' ? 'text-white' : 'text-emerald-400'
                }`}>
                  ₹{calculatedInr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Spread Summary Pill */}
          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300">
            <span>Rate Applied: <strong className="text-white">1 USDT = ₹{activeTab === 'BUY' ? buyRate : sellRate}</strong></span>
            {activeTab === 'SELL' ? (
              <span className="text-emerald-300 font-bold">
                Profit Margin: +₹{((sellRate - buyRate) * (usdtAmount || 0)).toFixed(0)} INR
              </span>
            ) : (
              <span className="text-amber-300 font-bold">
                +{settings.inrRewardPercent}% Quota Bonus Included
              </span>
            )}
          </div>
        </div>

        {/* Main Action CTA */}
        <button
          type="button"
          onClick={handleAction}
          className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm font-outfit text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'BUY'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40'
              : 'bg-gradient-to-r from-[#FF6B00] via-[#FF7E1D] to-amber-500 hover:from-[#E55F00] hover:to-orange-500 shadow-orange-950/40'
          }`}
        >
          {activeTab === 'BUY' ? (
            <>
              <Coins className="w-4 h-4 text-emerald-200" />
              <span>Buy {usdtAmount || 0} USDT Now for ₹{calculatedInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ➔</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 text-yellow-200" />
              <span>Sell {usdtAmount || 0} USDT Now for ₹{calculatedInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ➔</span>
            </>
          )}
        </button>

        {/* Real & Classy Trust Row */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Settlement</span>
            </div>
            <div className="text-xs font-black text-white font-outfit mt-0.5">
              5 - 7 Mins
            </div>
          </div>

          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#FF6B00]" />
              <span>Security</span>
            </div>
            <div className="text-xs font-black text-white font-outfit mt-0.5">
              100% Escrow
            </div>
          </div>

          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-yellow-300" />
              <span>Networks</span>
            </div>
            <div className="text-xs font-black text-white font-outfit mt-0.5">
              TRC20 / BEP20
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
