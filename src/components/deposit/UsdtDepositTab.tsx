import React, { useState } from 'react';
import { 
  DollarSign, 
  Coins, 
  Sparkles, 
  Copy, 
  Check, 
  QrCode, 
  ArrowRight, 
  ShieldAlert, 
  Clock, 
  X,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UsdtDepositTab: React.FC = () => {
  const { settings, submitUsdtDeposit, addToast } = useApp();
  
  const [usdtAmount, setUsdtAmount] = useState<number>(50);
  const [selectedNetwork, setSelectedNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const presets = [
    { amount: 10, tag: 'BASIC' },
    { amount: 20, tag: 'BASIC' },
    { amount: 30, tag: 'BASIC' },
    { amount: 50, tag: 'BASIC' },
    { amount: 100, tag: 'VIP' },
    { amount: 200, tag: 'VIP' },
    { amount: 500, tag: 'VIP' },
    { amount: 1000, tag: 'VIP' },
    { amount: 1500, tag: 'VIP' },
  ];

  // Calculations
  const calculatedInr = usdtAmount * settings.usdtRate;
  const estimatedBonusInr = (calculatedInr * settings.inrRewardPercent) / 100;
  const activityRewardInr = usdtAmount >= 100 ? (calculatedInr * 0.03) : 0;
  const totalInr = calculatedInr + estimatedBonusInr + activityRewardInr;

  const demoAddress = selectedNetwork === 'TRC20' 
    ? (settings.adminUsdtTrc20 || 'TTsZk5wTANw2MrBxn6xTNdHpeFFtBG4rLW') 
    : (settings.adminUsdtBep20 || '0x71C836eB399C8c0F82f0E0f4Ec7aAc89F17Ac9E5');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('success', 'USDT Wallet address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      submitUsdtDeposit(usdtAmount, selectedNetwork, txHash || `SIM-HASH-${Date.now()}`);
      setIsSubmitting(false);
      setIsOrderModalOpen(false);
      setTxHash('');
    }, 1200);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* USDT Comparison Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Normal Price */}
        <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            NORMAL PRICE
          </div>
          <div className="text-xl font-bold text-slate-700 font-outfit mt-1">
            {settings.normalUsdtPrice.toFixed(2)} INR
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Standard market rate
          </div>
        </div>

        {/* Platform Price (Highlighted) */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#0B1528] to-[#1E293B] text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              PLATFORM PRICE
            </span>
            <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-semibold">
              +4.7% HIGHER
            </span>
          </div>
          <div className="text-xl font-bold text-white font-outfit mt-1">
            {settings.usdtRate.toFixed(2)} INR
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5">
            1 USDT = {settings.usdtRate.toFixed(2)} INR
          </div>
        </div>
      </div>

      {/* Preset Amount Badges */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          SELECT USDT AMOUNT
        </label>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((preset) => {
            const isSelected = usdtAmount === preset.amount;
            const isVip = preset.tag === 'VIP';

            return (
              <button
                key={preset.amount}
                onClick={() => setUsdtAmount(preset.amount)}
                className={`relative py-3 px-2 rounded-2xl border text-center transition-all touch-press ${
                  isSelected
                    ? 'border-[#FF6B00] bg-orange-50/70 text-[#FF6B00] shadow-sm font-extrabold'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 text-slate-700 font-bold'
                }`}
              >
                <span className="text-base font-outfit">{preset.amount}</span>
                <span className="text-[11px] ml-1 opacity-70">USDT</span>

                {/* VIP / BASIC Pill */}
                <span
                  className={`absolute -top-2 right-2 text-[9px] px-1.5 py-0.2 rounded-full font-bold tracking-wider ${
                    isVip
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {preset.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Input */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-600 uppercase tracking-wider">OR ENTER CUSTOM USDT</span>
          <span className="text-slate-400">Min 10 USDT</span>
        </div>
        <div className="relative">
          <input
            type="number"
            min={10}
            step={1}
            value={usdtAmount || ''}
            onChange={(e) => setUsdtAmount(Math.max(0, Number(e.target.value)))}
            placeholder="Enter USDT"
            className="w-full pl-4 pr-16 py-3.5 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-slate-900 font-bold font-outfit text-lg shadow-sm"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            USDT
          </span>
        </div>
      </div>

      {/* Calculation Summary Card */}
      <div className="glass-card rounded-2xl p-4 border border-orange-100/80 space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs text-slate-500">Exchange Rate:</span>
          <span className="text-xs font-bold text-slate-800 font-outfit">
            1 USDT = {settings.usdtRate.toFixed(2)} INR
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Calculated Value:</span>
          <span className="font-semibold text-slate-800">₹{calculatedInr.toFixed(2)} INR</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Estimated bonus ({settings.inrRewardPercent}%):</span>
          <span className="font-semibold text-emerald-600">+₹{estimatedBonusInr.toFixed(2)} INR</span>
        </div>

        {activityRewardInr > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Activity reward (VIP Bonus 3%):</span>
            <span className="font-semibold text-amber-600">+₹{activityRewardInr.toFixed(2)} INR</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-sm font-bold text-slate-800">Total Receiving:</span>
          <span className="text-lg font-black text-[#FF6B00] font-outfit">
            ₹{totalInr.toFixed(2)} INR
          </span>
        </div>
      </div>

      {/* CTA: Create Order */}
      <button
        onClick={() => {
          if (usdtAmount < 10) {
            addToast('error', 'Minimum USDT deposit is 10 USDT.');
            return;
          }
          setIsOrderModalOpen(true);
        }}
        className="w-full py-4 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-extrabold text-base rounded-2xl shadow-orange-glow transition-all active:scale-98 flex items-center justify-center gap-2 touch-press"
      >
        <span>Create Order</span>
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* USDT Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-outfit">USDT Deposit Order</h3>
                  <p className="text-[11px] text-slate-400">Order ID: USDT-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Network Selector */}
            <div className="mt-4 space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Select Network
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNetwork('TRC20')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    selectedNetwork === 'TRC20'
                      ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  TRC20 (Tron) - Fast
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNetwork('BEP20')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    selectedNetwork === 'BEP20'
                      ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  BEP20 (BSC)
                </button>
              </div>
            </div>

            {/* Order Details & QR */}
            <div className="my-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-3">
              <div className="text-xs text-slate-500 font-medium">
                Send exactly <strong className="text-slate-900 text-sm font-outfit">{usdtAmount} USDT</strong> ({selectedNetwork})
              </div>

              {/* QR Code Container */}
              <div className="inline-block p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-36 h-36 bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-2">
                  <QrCode className="w-20 h-20 text-white stroke-[1.5]" />
                  <span className="text-[10px] font-mono mt-1 opacity-80">{selectedNetwork}</span>
                </div>
              </div>

              {/* Address Copy Box */}
              <div className="space-y-1 text-left">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Deposit Address:
                </label>
                <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
                  <span className="font-mono text-xs text-slate-700 truncate flex-1 select-all">
                    {demoAddress}
                  </span>
                  <button
                    onClick={() => handleCopy(demoAddress)}
                    className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#FF6B00] transition flex-shrink-0"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Tx Hash input for demonstration */}
            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-semibold text-slate-600">
                Transaction Hash / Reference (Optional for Demo)
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Enter blockchain TxID after sending"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>

            {/* Notice / Demo disclosure */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-800 mb-4 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                {settings.isDemoMode 
                  ? 'Demo Mode Active: Clicking confirm will simulate instant blockchain confirmation and credit ₹' + totalInr.toFixed(2) + ' to your wallet.' 
                  : 'Production Mode: Orders require 12 network confirmations before funds reflect in your account.'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmOrder}
                className="flex-1 py-3 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-xs rounded-2xl shadow-orange-glow transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming...' : 'I Have Transferred'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
