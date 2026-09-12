import React, { useState, useMemo } from 'react';
import { 
  RotateCw, 
  HelpCircle, 
  Sparkles, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  Filter,
  Copy,
  Check,
  Smartphone,
  Building2,
  Coins
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuotaPackage, QuotaLevel } from '../../types';
import { UsdtDepositTab } from './UsdtDepositTab';

export const DepositPage: React.FC = () => {
  const { 
    packages, 
    wallet, 
    settings, 
    buyQuota, 
    submitInrDeposit, 
    addToast,
    setActiveTab 
  } = useApp();

  // Mode: INR or USDT
  const [depositMode, setDepositMode] = useState<'INR' | 'USDT'>('INR');
  
  // Quota Filters
  const [selectedLevel, setSelectedLevel] = useState<QuotaLevel | 'ALL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [minFilter, setMinFilter] = useState<string>('');
  const [maxFilter, setMaxFilter] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Buy Flow Modal State
  const [selectedPkg, setSelectedPkg] = useState<QuotaPackage | null>(null);
  const [isBuying, setIsBuying] = useState<boolean>(false);

  // Direct INR Wallet Top-Up Modal State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [utrRef, setUtrRef] = useState<string>('');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState<boolean>(false);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => pkg.isActive)
      .filter((pkg) => {
        if (selectedLevel !== 'ALL' && pkg.level !== selectedLevel) return false;
        const min = minFilter ? parseFloat(minFilter) : 0;
        const max = maxFilter ? parseFloat(maxFilter) : Infinity;
        if (pkg.price < min || pkg.price > max) return false;
        return true;
      })
      .sort((a, b) => {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      });
  }, [packages, selectedLevel, sortOrder, minFilter, maxFilter]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('info', 'Packages list refreshed.');
    }, 500);
  };

  const handleConfirmBuy = () => {
    if (!selectedPkg) return;
    setIsBuying(true);
    setTimeout(() => {
      const res = buyQuota(selectedPkg);
      setIsBuying(false);
      if (res.success) {
        setSelectedPkg(null);
      }
    }, 600);
  };

  const handleConfirmTopUp = () => {
    if (topUpAmount <= 0) {
      addToast('error', 'Please enter a valid deposit amount.');
      return;
    }
    setIsProcessingTopUp(true);
    setTimeout(() => {
      submitInrDeposit(topUpAmount, utrRef || `UTR-${Date.now().toString().slice(-8)}`);
      setIsProcessingTopUp(false);
      setIsTopUpModalOpen(false);
      setUtrRef('');
    }, 800);
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Top Segmented Tabs: INR | USDT */}
      <div className="bg-[#0B1528] rounded-2xl p-1.5 flex items-center border border-orange-500/20 shadow-md">
        <button
          onClick={() => setDepositMode('INR')}
          className={`flex-1 py-3 text-center font-black font-outfit text-xs uppercase tracking-wider rounded-xl transition-all duration-300 relative ${
            depositMode === 'INR'
              ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-[0_4px_16px_rgba(255,107,0,0.35)] scale-[1.02]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>INR Instant Deposit</span>
          </span>
        </button>

        <button
          onClick={() => setDepositMode('USDT')}
          className={`flex-1 py-3 text-center font-black font-outfit text-xs uppercase tracking-wider rounded-xl transition-all duration-300 relative ${
            depositMode === 'USDT'
              ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-[0_4px_16px_rgba(255,107,0,0.35)] scale-[1.02]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            <span>Crypto USDT Deposit</span>
          </span>
        </button>
      </div>

      {/* If USDT Mode is selected, render UsdtDepositTab */}
      {depositMode === 'USDT' ? (
        <UsdtDepositTab />
      ) : (
        /* INR Mode */
        <div className="space-y-4">
          {/* Informational Banner */}
          <div className="p-3.5 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-2xl border border-orange-200/70 flex items-center justify-between text-xs text-orange-950">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
              <span>Complete task to earn Commission Bonus</span>
            </div>
            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="px-2.5 py-1 bg-[#FF6B00] hover:bg-[#E55F00] text-white text-[11px] font-bold rounded-xl shadow-xs transition"
            >
              + Add Balance
            </button>
          </div>

          {/* "How to Buy Quota?" Section */}
          <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6B00]" />
                <h3 className="font-extrabold text-slate-800 text-sm tracking-wide font-outfit uppercase">
                  How to Buy Quota?
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Wallet: <strong className="text-[#FF6B00]">₹{wallet.balance.toFixed(2)}</strong>
              </span>
            </div>

            {/* Three Selectable Risk & Quota Levels */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedLevel(selectedLevel === 'LOW' ? 'ALL' : 'LOW')}
                className={`p-3 rounded-2xl border text-center transition-all touch-press ${
                  selectedLevel === 'LOW'
                    ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                  🛡️ LOW RISK
                </div>
                <div className="text-xs font-black text-slate-800 font-outfit mt-0.5">
                  Up to ₹29k
                </div>
                <div className="text-sm font-extrabold text-emerald-600 font-outfit mt-0.5">
                  +{settings.lowBonusPercent}%
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Safe & Stable</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLevel(selectedLevel === 'MIDDLE' ? 'ALL' : 'MIDDLE')}
                className={`p-3 rounded-2xl border text-center transition-all touch-press ${
                  selectedLevel === 'MIDDLE'
                    ? 'border-[#FF6B00] bg-orange-50/80 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-black uppercase text-[#FF6B00] tracking-wider">
                  ⚖️ MEDIUM RISK
                </div>
                <div className="text-xs font-black text-slate-800 font-outfit mt-0.5">
                  ₹28k - ₹47k
                </div>
                <div className="text-sm font-extrabold text-[#FF6B00] font-outfit mt-0.5">
                  +{settings.middleBonusPercent}%
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Balanced Growth</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLevel(selectedLevel === 'HIGH' ? 'ALL' : 'HIGH')}
                className={`p-3 rounded-2xl border text-center transition-all touch-press ${
                  selectedLevel === 'HIGH'
                    ? 'border-purple-500 bg-purple-50/80 shadow-xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                  🚀 HIGH RISK VIP
                </div>
                <div className="text-xs font-black text-slate-800 font-outfit mt-0.5">
                  Up to ₹1.5L
                </div>
                <div className="text-sm font-extrabold text-purple-600 font-outfit mt-0.5">
                  12% - 14%
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Max High Yield</div>
              </button>
            </div>

            {/* Filters Bar: [ Low to high ▼ ] [ Min ] [ Max ] */}
            <div className="pt-2 flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Sort Order Dropdown */}
              <div className="relative flex-1 min-w-[130px]">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full pl-3 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#FF6B00] appearance-none"
                >
                  <option value="asc">Low to high ▼</option>
                  <option value="desc">High to low ▲</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Min Filter */}
              <input
                type="number"
                placeholder="Min ₹"
                value={minFilter}
                onChange={(e) => setMinFilter(e.target.value)}
                className="w-20 sm:w-24 px-2.5 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />

              {/* Max Filter */}
              <input
                type="number"
                placeholder="Max ₹"
                value={maxFilter}
                onChange={(e) => setMaxFilter(e.target.value)}
                className="w-20 sm:w-24 px-2.5 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />

              {/* Clear filters if active */}
              {(selectedLevel !== 'ALL' || minFilter || maxFilter) && (
                <button
                  onClick={() => {
                    setSelectedLevel('ALL');
                    setMinFilter('');
                    setMaxFilter('');
                  }}
                  className="text-xs text-[#FF6B00] hover:underline px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Large Orange Refresh Button */}
            <div className="pt-1">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full py-3 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-extrabold text-sm rounded-2xl shadow-orange-glow transition-all active:scale-98 flex items-center justify-center gap-2 touch-press"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Packages List */}
          <div className="space-y-2.5">
            {filteredPackages.length === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Packages Match Your Filter</h4>
                <p className="text-xs text-slate-400">Try adjusting your min/max amount or level selection.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLevel('ALL');
                    setMinFilter('');
                    setMaxFilter('');
                  }}
                  className="mt-2 text-xs font-bold text-[#FF6B00] hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between hover:border-orange-200 transition-all group"
                >
                  <div className="space-y-1">
                    {/* Price, Level, and Risk Tag */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-extrabold text-[#0B1528] font-outfit">
                        ₹{pkg.price.toLocaleString('en-IN')} INR
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          pkg.level === 'HIGH'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : pkg.level === 'MIDDLE'
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {pkg.riskLevel || `${pkg.level} RISK`}
                      </span>
                    </div>

                    {/* Income & Bonus Percent */}
                    <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Return: +₹{pkg.income.toLocaleString('en-IN')} ({pkg.incomePercent.toFixed(1)}%)</span>
                    </div>

                    {/* Total Quota Received */}
                    <div className="text-xs text-slate-500">
                      Total Maturity Quota: <strong className="text-slate-800 font-outfit">₹{pkg.quota.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => setSelectedPkg(pkg)}
                    className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-sm rounded-xl shadow-orange-glow transition-all active:scale-95 touch-press flex-shrink-0"
                  >
                    Select
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          BUY CONFIRMATION MODAL
         ======================================================= */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-outfit">Confirm Quota Purchase</h3>
                  <p className="text-[11px] text-slate-400">Package Level: {selectedPkg.level}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPkg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breakdown table */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Selected Package Price:</span>
                <span className="font-bold text-slate-900 font-outfit">₹{selectedPkg.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable Bonus ({selectedPkg.incomePercent}%):</span>
                <span className="font-bold text-emerald-600 font-outfit">+₹{selectedPkg.income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Quota Credited:</span>
                <span className="font-bold text-slate-900 font-outfit">₹{selectedPkg.quota.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                <span className="font-bold text-slate-800">Your Current Balance:</span>
                <span className={`font-extrabold font-outfit ${wallet.balance < selectedPkg.price ? 'text-rose-600' : 'text-slate-900'}`}>
                  ₹{wallet.balance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Insufficient balance notice */}
            {wallet.balance < selectedPkg.price ? (
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Insufficient Balance</p>
                  <p className="mt-0.5">
                    You need ₹{(selectedPkg.price - wallet.balance).toFixed(2)} more. Top up now to complete this purchase.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  {settings.isDemoMode
                    ? 'Demo Mode: Amount will be deducted from your simulated wallet balance and quota will update instantly.'
                    : 'Production: Verified transaction will register to your account ledger.'}
                </span>
              </div>
            )}

            {/* Modal Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPkg(null)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl transition"
              >
                Cancel
              </button>

              {wallet.balance < selectedPkg.price ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPkg(null);
                    setIsTopUpModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-xs rounded-2xl shadow-orange-glow transition"
                >
                  Top Up Balance
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isBuying}
                  onClick={handleConfirmBuy}
                  className="flex-1 py-3 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-xs rounded-2xl shadow-orange-glow transition active:scale-95 disabled:opacity-50"
                >
                  {isBuying ? 'Processing...' : 'Confirm & Buy'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          INR DIRECT TOP-UP MODAL
         ======================================================= */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-outfit">Top Up INR Balance</h3>
                  <p className="text-[11px] text-slate-400">Direct UPI / Netbanking Gateway</p>
                </div>
              </div>
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Amounts */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Quick Select Amount
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[500, 3000, 10000, 28000, 47000, 65000, 100000, 150000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2 rounded-xl border text-xs font-black font-outfit transition ${
                      topUpAmount === amt
                        ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00] shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {amt === 150000 ? '₹1.5 Lakh' : amt === 100000 ? '₹1 Lakh' : `₹${amt >= 1000 ? `${amt / 1000}k` : amt}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Amount */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={topUpAmount || ''}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-3 bg-white rounded-2xl border border-slate-200 font-bold font-outfit text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>

            {/* Bonus Preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between text-xs">
              <span className="text-slate-500">Deposit Reward Bonus ({settings.inrRewardPercent}%):</span>
              <span className="font-bold text-emerald-600">
                +₹{((topUpAmount * settings.inrRewardPercent) / 100).toFixed(2)}
              </span>
            </div>

            {/* Platform Receiving Details Configured by Admin */}
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Send to Official Platform UPI</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(settings.adminUpiId || 'easybasepoint@okhdfcbank');
                    addToast('success', 'UPI ID copied to clipboard!');
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy UPI</span>
                </button>
              </div>

              <div className="p-2 bg-white rounded-xl border border-blue-200/60 font-mono text-slate-800 text-xs select-all">
                {settings.adminUpiId || 'easybasepoint@okhdfcbank'}
                <div className="font-sans text-[10px] text-slate-400 mt-0.5">
                  Name: {settings.adminUpiName || 'EasyBasePoint Enterprise'}
                </div>
              </div>

              {/* Transaction / UTR reference */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  UPI Ref / UTR Number (Optional for Demo)
                </label>
                <input
                  type="text"
                  placeholder="12-digit UTR number"
                  value={utrRef}
                  onChange={(e) => setUtrRef(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>

            {/* Demo Notice */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
              {settings.isDemoMode
                ? 'Demo Environment: Clicking confirm simulates instant UPI authorization and adds the funds to your balance.'
                : 'Production: Your transaction will be verified against bank statements before release.'}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(false)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingTopUp}
                onClick={handleConfirmTopUp}
                className="flex-1 py-3 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-xs rounded-2xl shadow-orange-glow transition active:scale-95 disabled:opacity-50"
              >
                {isProcessingTopUp ? 'Connecting Gateway...' : 'Confirm Top Up'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
