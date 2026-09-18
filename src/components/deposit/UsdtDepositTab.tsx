import React from 'react';
import { 
  Coins, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface UsdtDepositTabProps {
  onSwitchToInr?: () => void;
}

export const UsdtDepositTab: React.FC<UsdtDepositTabProps> = ({ onSwitchToInr }) => {
  const { settings, setActiveTab } = useApp();

  const handleSwitch = () => {
    if (onSwitchToInr) {
      onSwitchToInr();
    } else {
      setActiveTab('deposit');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Prominent Under Maintenance Poster Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0B1528] via-[#151D2E] to-[#1E293B] text-white border-2 border-amber-500/40 shadow-2xl relative overflow-hidden text-center space-y-5">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Maintenance Icon Badge */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-950/50 mb-3 animate-bounce">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Under Maintenance</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-outfit text-white tracking-tight">
            Crypto USDT Deposit Under Maintenance
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1.5 leading-relaxed">
            USDT (TRC20 / BEP20) blockchain node is currently undergoing scheduled network maintenance. 
            All crypto deposit addresses and QR codes have been temporarily disabled for your safety.
          </p>
        </div>

        {/* Status Highlights */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Status</span>
            </div>
            <div className="text-xs font-black text-amber-300 font-outfit">
              Temporarily Suspended
            </div>
            <p className="text-[10px] text-slate-400">
              Upgrading blockchain gateway
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Recommended Method</span>
            </div>
            <div className="text-xs font-black text-emerald-300 font-outfit">
              INR Instant UPI (Active)
            </div>
            <p className="text-[10px] text-slate-400">
              Instant 5-7 mins wallet credit
            </p>
          </div>
        </div>

        {/* Action Button to switch to Instant INR */}
        <div className="relative z-10 pt-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={handleSwitch}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-[#FF6B00] via-[#FF7E1D] to-amber-500 hover:from-[#E55F00] hover:to-orange-500 text-white font-black text-sm font-outfit rounded-2xl shadow-orange-glow transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Use Instant INR Deposit (UPI / PhonePe) ➔</span>
          </button>
          <p className="text-[10px] text-slate-400 mt-2">
            PhonePe, Paytm, Google Pay & QR scanner are 100% active with +{settings.inrRewardPercent}% bonus!
          </p>
        </div>
      </div>
    </div>
  );
};
