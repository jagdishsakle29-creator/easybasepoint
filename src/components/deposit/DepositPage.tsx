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
  Coins,
  QrCode,
  Clock,
  Send,
  XCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuotaPackage, QuotaLevel } from '../../types';
import { UsdtDepositTab } from './UsdtDepositTab';

export const DepositPage: React.FC = () => {
  const { 
    packages, 
    wallet, 
    settings, 
    deposits,
    buyQuota, 
    submitInrDeposit, 
    refreshDeposits,
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

  // Buy Flow Modal State & Explicit State Machine: IDLE | SELECTED | PROCESSING | SUCCESS | FAILED
  type PurchaseStatus = 'IDLE' | 'SELECTED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  const [selectedPkg, setSelectedPkg] = useState<QuotaPackage | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>('IDLE');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Direct INR Wallet Top-Up Modal State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(500);
  const [utrRef, setUtrRef] = useState<string>('');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState<boolean>(false);
  const [depositStatusFilter, setDepositStatusFilter] = useState<'all' | 'successful' | 'pending' | 'cancelled'>('all');

  // Mandatory Payment Screenshot State
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState<boolean>(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDeposits();
      addToast('info', 'Synced with cloud ledger & updated.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectPackage = (pkg: QuotaPackage) => {
    setTopUpAmount(pkg.price);
    setSelectedPkg(null);
    setScreenshotFile(null);
    setScreenshotUrl('');
    setScreenshotError(null);
    setIsTopUpModalOpen(true);
    addToast('info', `Selected ₹${pkg.price.toLocaleString('en-IN')} package. Pay via PhonePe, Paytm or QR with remark "cousin".`);
  };

  const processScreenshotFile = (file: File) => {
    setScreenshotError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      const err = 'Unsupported file type. Please upload JPG, PNG, or WebP.';
      setScreenshotError(err);
      addToast('error', err);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      const err = 'File size exceeds 5MB limit. Please upload a smaller screenshot.';
      setScreenshotError(err);
      addToast('error', err);
      return;
    }

    setIsUploadingScreenshot(true);
    setUploadProgress(25);

    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const percent = Math.min(90, Math.round((ev.loaded / ev.total) * 90));
        setUploadProgress(percent);
      }
    };
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setScreenshotUrl(dataUrl);
        } else {
          setScreenshotUrl(reader.result as string);
        }
        setScreenshotFile(file);
        setUploadProgress(100);
        setIsUploadingScreenshot(false);
        addToast('success', '✓ Payment screenshot uploaded successfully!');
      };
      img.onerror = () => {
        setScreenshotUrl(reader.result as string);
        setScreenshotFile(file);
        setUploadProgress(100);
        setIsUploadingScreenshot(false);
        addToast('success', '✓ Payment screenshot uploaded successfully!');
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setIsUploadingScreenshot(false);
      setScreenshotError('Failed to read image file. Please try again.');
      addToast('error', 'Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmTopUp = () => {
    if (topUpAmount <= 0) {
      addToast('error', 'Please enter or select a valid deposit amount.');
      return;
    }
    const cleanUtr = utrRef.trim();
    if (!cleanUtr || cleanUtr.length !== 12) {
      addToast('error', '⚠️ 12-digit numeric UTR is mandatory to submit your deposit for approval.');
      return;
    }
    if (!screenshotUrl) {
      addToast('error', 'Payment screenshot is required to complete payment verification.');
      return;
    }
    setIsProcessingTopUp(true);
    setTimeout(() => {
      const res = submitInrDeposit(topUpAmount, cleanUtr, screenshotUrl, 'cousin');
      setIsProcessingTopUp(false);
      if (res && res.success) {
        setIsTopUpModalOpen(false);
        setUtrRef('');
        setScreenshotFile(null);
        setScreenshotUrl('');
      }
    }, 600);
  };

  const isMobileDevice = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isTouch = (navigator.maxTouchPoints || 0) > 0;
    const isMobileUa = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileUa || (isTouch && isSmallScreen);
  };

  const getAppLaunchUrl = (app: 'phonepe' | 'paytm' | 'gpay' | 'upi') => {
    const upiId = settings.adminUpiId || 'basepnt@ybl';
    const amount = topUpAmount || 500;
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const payeeName = settings.adminUpiName || 'EasyBasePoint';
    const remark = 'cousin';

    const standardUpi = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(remark)}&tr=${encodeURIComponent(remark)}`;

    if (app === 'phonepe') {
      if (isAndroid) {
        // Direct official Android Intent for PhonePe
        return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(remark)}&tr=${encodeURIComponent(remark)}#Intent;scheme=upi;package=com.phonepe.app;action=android.intent.action.VIEW;end`;
      }
      if (isIOS) {
        // Direct official iOS scheme for PhonePe
        return `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(remark)}&tr=${encodeURIComponent(remark)}`;
      }
      return standardUpi;
    }

    if (app === 'paytm') {
      if (isAndroid) {
        // Direct official Android Intent for Paytm with remark "cousin"
        return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(remark)}&tr=${encodeURIComponent(remark)}#Intent;scheme=upi;package=net.one97.paytm;action=android.intent.action.VIEW;end`;
      }
      if (isIOS) {
        // Direct official iOS scheme for Paytm with remark "cousin"
        return `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(remark)}&tr=${encodeURIComponent(remark)}`;
      }
      return standardUpi;
    }

    if (app === 'gpay') {
      if (isAndroid) {
        // Direct official Android Intent for Google Pay
        return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(remark)}&tr=${encodeURIComponent(remark)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.VIEW;end`;
      }
      if (isIOS) {
        // Direct official iOS scheme for Google Pay / Tez
        return `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(remark)}&tr=${encodeURIComponent(remark)}`;
      }
      return standardUpi;
    }

    return standardUpi;
  };

  const handleLaunchUpi = (e: React.MouseEvent, appName: string, appKey: 'phonepe' | 'paytm' | 'gpay' | 'upi') => {
    e.preventDefault();
    if (!topUpAmount || topUpAmount <= 0) {
      addToast('error', 'Please select or enter a valid deposit amount.');
      return;
    }

    const upiId = settings.adminUpiId || 'basepnt@ybl';
    try {
      navigator.clipboard.writeText(upiId);
    } catch {}

    // Open deposit verification modal so UTR and screenshot upload sections are ready
    setIsTopUpModalOpen(true);

    const onPhone = isMobileDevice();

    if (!onPhone) {
      // Desktop: Prevent custom URI scheme invocation that triggers Safari/Chrome "address is invalid"
      addToast('info', `Selected ₹${topUpAmount} via ${appName}. Please scan the QR code with your phone or use UPI ID.`);
      return;
    }

    // Real Mobile Phone (Android or iPhone):
    addToast('success', `Opening ${appName} directly for ₹${topUpAmount}...`);
    const appUrl = getAppLaunchUrl(appKey);

    // Direct user action invocation via hidden anchor click
    try {
      const link = document.createElement('a');
      link.href = appUrl;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = appUrl;
    }
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
          {/* =======================================================
              COMPACT FAST AMOUNT SELECTOR (NO SCROLLING NEEDED)
             ======================================================= */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-[#0B1528] via-[#121F38] to-[#1E3052] text-white border-2 border-orange-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black font-outfit text-white tracking-wide">
                    Instant INR Deposit
                  </h3>
                  <p className="text-[11px] text-slate-300">Fast UPI & PhonePe Scanner • 5-7 Mins Settlement</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase">
                +{settings.inrRewardPercent}% Bonus Active
              </span>
            </div>

            {/* Daily Free Cash Bonus Tier Buttons */}
            <div className="p-3 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 rounded-2xl border border-amber-400/40 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-black text-amber-200 uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Daily Free Cash Bonus Tiers</span>
                </span>
                <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Free Amount
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setTopUpAmount(5000)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    topUpAmount === 5000
                      ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 border-white shadow-md font-black scale-[1.02]'
                      : 'bg-black/30 border-white/10 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-black">₹5,000</div>
                  <div className="text-[10px] font-black text-emerald-300">+₹100 Free</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTopUpAmount(20000)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    topUpAmount === 20000
                      ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 border-white shadow-md font-black scale-[1.02]'
                      : 'bg-black/30 border-white/10 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-black">₹20,000</div>
                  <div className="text-[10px] font-black text-emerald-300">+₹1,000 Free</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTopUpAmount(50000)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    topUpAmount === 50000
                      ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 border-white shadow-md font-black scale-[1.02]'
                      : 'bg-black/30 border-white/10 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-black">₹50,000</div>
                  <div className="text-[10px] font-black text-emerald-300">+₹5,000 Free</div>
                </button>
              </div>
            </div>

            {/* Quick Amounts Grid */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Select Quick Amount
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[500, 890, 1400, 2100, 3000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-2 rounded-xl border text-xs font-bold font-outfit transition cursor-pointer ${
                      topUpAmount === amt
                        ? 'border-[#FF6B00] bg-[#FF6B00] text-white shadow-md font-black scale-[1.03]'
                        : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min={100}
                step={50}
                value={topUpAmount || ''}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                placeholder="Or enter custom amount (Min ₹100)"
                className="w-full pl-8 pr-3 py-3 bg-white/10 text-white font-bold font-outfit rounded-2xl border border-white/20 text-xs focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            {/* Bonus Preview & Proceed to Pay CTA */}
            {(() => {
              let extraTier = 0;
              if (topUpAmount >= 50000) extraTier = 5000;
              else if (topUpAmount >= 20000) extraTier = 1000;
              else if (topUpAmount >= 5000) extraTier = 100;
              const regBonus = (topUpAmount * settings.inrRewardPercent) / 100;
              const totalBns = regBonus + extraTier;
              const totalRec = topUpAmount + totalBns;

              return (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs px-1 text-slate-300">
                    <span>You Deposit: <strong className="text-white">₹{topUpAmount || 0}</strong></span>
                    <span>Free Bonus: <strong className="text-emerald-400 font-black">+₹{totalBns.toFixed(0)}</strong></span>
                    <span>Total Wallet: <strong className="text-amber-300 font-black">₹{totalRec.toFixed(0)}</strong></span>
                  </div>

                  {/* Three Direct Payment Options: PhonePe, Paytm, Google Pay */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>Direct Pay via App (Select & Pay)</span>
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Auto-Fills ₹{topUpAmount}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* 1. PhonePe */}
                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'PhonePe', 'phonepe')}
                        className="p-3 rounded-2xl bg-gradient-to-b from-[#5f259f] to-[#421774] text-white flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-purple-950/40 border border-purple-400/40 hover:scale-[1.02] active:scale-95 transition cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#5f259f] font-black text-base font-outfit shadow">
                          पे
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-black tracking-wide font-outfit">PhonePe</div>
                          <div className="text-[10px] text-purple-200 group-hover:text-white">Pay ₹{topUpAmount} ➔</div>
                        </div>
                      </button>

                      {/* 2. Paytm */}
                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'Paytm', 'paytm')}
                        className="p-3 rounded-2xl bg-gradient-to-b from-[#002970] to-[#001c4e] text-white flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/40 border border-cyan-400/40 hover:scale-[1.02] active:scale-95 transition cursor-pointer group relative overflow-hidden"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#002970] font-black text-xs font-outfit shadow">
                          Pay
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-black tracking-wide font-outfit">Paytm</div>
                          <div className="text-[10px] text-cyan-200 group-hover:text-white">Pay ₹{topUpAmount} ➔</div>
                        </div>
                        <div className="absolute top-1 right-1 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                          cousin
                        </div>
                      </button>

                      {/* 3. Google Pay */}
                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'Google Pay', 'gpay')}
                        className="p-3 rounded-2xl bg-gradient-to-b from-[#1e3a8a] to-[#172554] text-white flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-blue-950/40 border border-blue-400/40 hover:scale-[1.02] active:scale-95 transition cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#2563eb] font-black text-base font-outfit shadow">
                          G
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-black tracking-wide font-outfit">Google Pay</div>
                          <div className="text-[10px] text-blue-200 group-hover:text-white">Pay ₹{topUpAmount} ➔</div>
                        </div>
                      </button>
                    </div>

                    {/* Scan QR / Other UPI Button */}
                    <button
                      type="button"
                      onClick={() => setIsTopUpModalOpen(true)}
                      className="w-full py-3 bg-gradient-to-r from-[#FF6B00] via-[#FF7E1D] to-amber-500 hover:from-[#E55F00] hover:to-orange-500 text-white font-black text-xs font-outfit rounded-2xl shadow-orange-glow transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Scan QR Code / Open Universal UPI Gateway (₹{topUpAmount}) ➔</span>
                    </button>
                  </div>
                </div>
              );
            })()}
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
                    onClick={() => handleSelectPackage(pkg)}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-[#E55F00] hover:to-orange-500 text-white font-black text-xs font-outfit rounded-xl shadow-orange-glow transition-all active:scale-95 touch-press flex-shrink-0 flex items-center gap-1"
                  >
                    <span>Deposit & Buy</span>
                    <span>➔</span>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Recent Deposit Orders Section with 3 Sections: Successful, Pending, Cancelled */}
          {deposits.length > 0 && (() => {
            const isDepSuccessful = (d: typeof deposits[0]) =>
              d.status === 'completed' || d.status === 'credited' || d.status === 'approved' || d.credited === true;
            const isDepPending = (d: typeof deposits[0]) =>
              d.status === 'pending' || (d.status as string) === 'processing';
            const isDepCancelled = (d: typeof deposits[0]) =>
              d.status === 'rejected' || d.status === 'failed' || (d.status as string) === 'cancelled';

            const successfulDeps = deposits.filter(isDepSuccessful);
            const pendingDeps = deposits.filter(isDepPending);
            const cancelledDeps = deposits.filter(isDepCancelled);

            const successfulTotal = successfulDeps.reduce((sum, d) => sum + (d.totalInr || d.amount), 0);
            const pendingTotal = pendingDeps.reduce((sum, d) => sum + (d.totalInr || d.amount), 0);
            const cancelledTotal = cancelledDeps.reduce((sum, d) => sum + (d.totalInr || d.amount), 0);

            const filteredDeps = deposits.filter((d) => {
              if (depositStatusFilter === 'successful') return isDepSuccessful(d);
              if (depositStatusFilter === 'pending') return isDepPending(d);
              if (depositStatusFilter === 'cancelled') return isDepCancelled(d);
              return true;
            });

            return (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider font-outfit">
                    <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Your Deposit Status & Orders</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Total: {deposits.length} Orders
                  </span>
                </div>

                {/* 3 Status Summary Stat Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositStatusFilter(depositStatusFilter === 'successful' ? 'all' : 'successful')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      depositStatusFilter === 'successful'
                        ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-400/50 shadow-xs'
                        : 'bg-white border-emerald-200 hover:bg-emerald-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800">
                        Successful
                      </span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div className="text-xs font-black font-outfit text-emerald-700 mt-0.5">
                      ₹{successfulTotal.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-emerald-600/80 font-bold">
                      {successfulDeps.length} Orders
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositStatusFilter(depositStatusFilter === 'pending' ? 'all' : 'pending')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      depositStatusFilter === 'pending'
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-400/50 shadow-xs'
                        : 'bg-white border-amber-200 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-900">
                        Pending
                      </span>
                      <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                    </div>
                    <div className="text-xs font-black font-outfit text-amber-700 mt-0.5">
                      ₹{pendingTotal.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-amber-800/80 font-bold">
                      {pendingDeps.length} Orders
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositStatusFilter(depositStatusFilter === 'cancelled' ? 'all' : 'cancelled')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      depositStatusFilter === 'cancelled'
                        ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-400/50 shadow-xs'
                        : 'bg-white border-rose-200 hover:bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-800">
                        Cancelled
                      </span>
                      <XCircle className="w-3 h-3 text-rose-600" />
                    </div>
                    <div className="text-xs font-black font-outfit text-rose-700 mt-0.5">
                      ₹{cancelledTotal.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-rose-600/80 font-bold">
                      {cancelledDeps.length} Orders
                    </div>
                  </button>
                </div>

                {/* Status Segment Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                  <button
                    onClick={() => setDepositStatusFilter('all')}
                    className={`flex-1 py-1 rounded-lg transition-all ${
                      depositStatusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({deposits.length})
                  </button>
                  <button
                    onClick={() => setDepositStatusFilter('successful')}
                    className={`flex-1 py-1 rounded-lg transition-all ${
                      depositStatusFilter === 'successful'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    ✅ Successful ({successfulDeps.length})
                  </button>
                  <button
                    onClick={() => setDepositStatusFilter('pending')}
                    className={`flex-1 py-1 rounded-lg transition-all ${
                      depositStatusFilter === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'text-amber-800 hover:text-amber-950'
                    }`}
                  >
                    ⏳ Pending ({pendingDeps.length})
                  </button>
                  <button
                    onClick={() => setDepositStatusFilter('cancelled')}
                    className={`flex-1 py-1 rounded-lg transition-all ${
                      depositStatusFilter === 'cancelled'
                        ? 'bg-rose-600 text-white shadow-xs font-black'
                        : 'text-rose-700 hover:text-rose-900'
                    }`}
                  >
                    ❌ Cancelled ({cancelledDeps.length})
                  </button>
                </div>

                {/* Filtered Deposit List */}
                {filteredDeps.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                    No {depositStatusFilter} deposit records found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDeps.slice(0, 10).map((dep) => {
                      const isPending = isDepPending(dep);
                      const isCompleted = isDepSuccessful(dep);

                      return (
                        <div
                          key={dep.id}
                          className={`glass-card rounded-2xl p-3.5 border transition-all ${
                            isPending
                              ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                              : isCompleted
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : 'border-rose-200 bg-rose-50/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-slate-900">{dep.id}</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase">
                                  {dep.method}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(dep.createdAt).toLocaleDateString()} {new Date(dep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-black font-outfit text-[#0B1528]">
                                ₹{(dep.totalInr || dep.amount).toFixed(2)}
                              </div>
                              <div className="mt-0.5">
                                {isPending ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                    <Clock className="w-3 h-3 animate-spin text-amber-600" />
                                    Pending Approval
                                  </span>
                                ) : isCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Approved & Credited
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                    <XCircle className="w-3 h-3 text-rose-600" />
                                    Rejected / Cancelled
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}



      {/* =======================================================
          DEDICATED PAYMENT GATEWAY MODAL (OPENS CLEANLY, CLOSES ON SUBMIT)
         ======================================================= */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative bg-gradient-to-b from-[#0F1E36] via-[#0A1424] to-[#060D18] text-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(255,107,0,0.3)] border-2 border-orange-500/40 space-y-4 max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-black text-base text-white">
                    Official Payment Gateway
                  </h3>
                  <p className="text-[11px] text-slate-300">Scan QR & enter 12-digit numeric UTR to credit balance</p>
                </div>
              </div>
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Summary Pill */}
            {(() => {
              let extraTier = 0;
              if (topUpAmount >= 50000) extraTier = 5000;
              else if (topUpAmount >= 20000) extraTier = 1000;
              else if (topUpAmount >= 5000) extraTier = 100;
              const regBonus = (topUpAmount * settings.inrRewardPercent) / 100;
              const totalBns = regBonus + extraTier;
              const totalRec = topUpAmount + totalBns;
              const isUtrReady = utrRef.trim().length === 12;

              return (
                <div className="space-y-4">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/15 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Pay Amount</div>
                      <div className="text-lg font-black font-outfit text-amber-300">₹{topUpAmount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Free Bonus</div>
                      <div className="text-lg font-black font-outfit text-emerald-400">+₹{totalBns.toFixed(0)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Credit</div>
                      <div className="text-lg font-black font-outfit text-white">₹{totalRec.toFixed(0)}</div>
                    </div>
                  </div>

                  {/* Payment Remark Box */}
                  <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-300 font-bold">Remark:</span>
                      <span className="font-mono font-black text-amber-300 px-2.5 py-0.5 bg-black/40 rounded border border-amber-400/40 select-all">
                        cousin
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">(Auto-filled in Paytm/UPI)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('cousin');
                        addToast('success', 'Copied remark "cousin" to clipboard!');
                      }}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Remark</span>
                    </button>
                  </div>

                  {/* 1-Tap Direct UPI App Launcher (PhonePe, Paytm, Google Pay, BHIM) */}
                  <div className="space-y-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-[#FF6B00]" />
                        <span>⚡ 1-Tap Pay via App (Direct Open)</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Auto-Fill ₹{topUpAmount}
                      </span>
                    </div>

                    {/* Official UPI ID 1-Tap Copy Bar */}
                    <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/10">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Official UPI ID:</span>
                        <span className="font-mono font-black text-amber-300 select-all">{settings.adminUpiId || 'basepnt@ybl'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settings.adminUpiId || 'basepnt@ybl');
                          addToast('success', `Copied ${settings.adminUpiId || 'basepnt@ybl'} to clipboard!`);
                        }}
                        className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition"
                      >
                        Copy UPI
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Tap any app below to open directly with ₹{topUpAmount} pre-filled and remark <strong>"cousin"</strong>:
                    </p>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* PhonePe */}
                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'PhonePe', 'phonepe')}
                        className="p-3 rounded-2xl bg-gradient-to-r from-[#5f259f] to-[#7b32c6] text-white flex items-center gap-2.5 shadow-lg shadow-purple-900/40 border border-purple-400/30 hover:scale-[1.02] active:scale-98 transition group cursor-pointer text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#5f259f] font-black text-sm font-outfit shadow-xs flex-shrink-0">
                          पे
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black tracking-wide font-outfit truncate">PhonePe</div>
                          <div className="text-[10px] text-purple-200 group-hover:text-white truncate">Open PhonePe ➔</div>
                        </div>
                      </button>

                      {/* Paytm */}
                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'Paytm', 'paytm')}
                        className="p-3 rounded-2xl bg-gradient-to-r from-[#002970] to-[#00b9f1] text-white flex items-center gap-2.5 shadow-lg shadow-cyan-900/40 border border-cyan-400/30 hover:scale-[1.02] active:scale-98 transition group cursor-pointer text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#002970] font-black text-xs font-outfit shadow-xs flex-shrink-0">
                          Pay
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black tracking-wide font-outfit truncate">Paytm</div>
                          <div className="text-[10px] text-cyan-200 group-hover:text-white truncate">Open Paytm ➔</div>
                        </div>
                      </button>

                      {/* Google Pay */}
                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'Google Pay', 'gpay')}
                        className="p-3 rounded-2xl bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white flex items-center gap-2.5 shadow-lg shadow-blue-900/40 border border-blue-400/30 hover:scale-[1.02] active:scale-98 transition group cursor-pointer text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#2563eb] font-black text-sm font-outfit shadow-xs flex-shrink-0">
                          G
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black tracking-wide font-outfit truncate">Google Pay</div>
                          <div className="text-[10px] text-blue-200 group-hover:text-white truncate">Open GPay ➔</div>
                        </div>
                      </button>

                      {/* BHIM / Other UPI */}
                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'UPI App', 'upi')}
                        className="p-3 rounded-2xl bg-gradient-to-r from-[#047857] to-[#10b981] text-white flex items-center gap-2.5 shadow-lg shadow-emerald-900/40 border border-emerald-400/30 hover:scale-[1.02] active:scale-98 transition group cursor-pointer text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#047857] font-black text-xs font-outfit shadow-xs flex-shrink-0">
                          UPI
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black tracking-wide font-outfit truncate">BHIM / Other</div>
                          <div className="text-[10px] text-emerald-200 group-hover:text-white truncate">Open Any UPI ➔</div>
                        </div>
                      </button>
                    </div>

                    {/* Universal Chooser Button */}
                    <button
                      type="button"
                      onClick={(e) => handleLaunchUpi(e, 'UPI Payment App', 'upi')}
                      className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-98 transition text-xs font-black font-outfit cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
                      <span>⚡ Open Any Installed UPI App (Auto-Detect)</span>
                    </button>
                  </div>

                  {/* QR Code and Official UPI */}
                  <div id="deposit-qr-section" className="bg-white rounded-2xl p-3 text-center space-y-2 shadow-md">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                        `upi://pay?pa=${settings.adminUpiId || 'basepnt@ybl'}&pn=${encodeURIComponent(settings.adminUpiName || 'EasyBasePoint')}&am=${topUpAmount}&cu=INR&tn=cousin&tr=cousin`
                      )}`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/deposit_qr.jpg';
                      }}
                      alt="Official Payment QR" 
                      className="w-44 h-44 object-contain rounded-xl mx-auto border border-slate-200"
                    />
                    <div className="text-[11px] font-extrabold text-slate-800 flex items-center justify-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span>Scan with PhonePe, Paytm, or GPay to auto-fill ₹{topUpAmount}</span>
                    </div>
                  </div>

                  {/* Official UPI ID Box */}
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                        OFFICIAL PLATFORM UPI ID
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settings.adminUpiId || 'basepnt@ybl');
                          addToast('success', 'UPI ID copied to clipboard!');
                        }}
                        className="text-xs font-black text-[#FF6B00] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy UPI</span>
                      </button>
                    </div>
                    <div className="font-mono text-sm font-black text-amber-300 select-all tracking-wide break-all">
                      {settings.adminUpiId || 'basepnt@ybl'}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Verified Payee: <strong>{settings.adminUpiName || 'EasyBasePoint Enterprise Solutions'}</strong>
                    </div>
                  </div>

                  {/* 12-Digit Numeric UTR Input */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                        <span>Enter 12-Digit Bank UTR / Ref *</span>
                      </label>
                      <span className="text-xs font-mono font-black text-slate-300">
                        {utrRef.length}/12 Digits
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      maxLength={12}
                      value={utrRef}
                      onChange={(e) => setUtrRef(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                      placeholder="Enter 12-digit numeric UTR from payment receipt"
                      className={`w-full px-4 py-3 bg-white text-slate-900 font-mono font-black text-sm tracking-wider rounded-xl border-2 focus:outline-none transition ${
                        isUtrReady
                          ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-400'
                          : 'border-orange-400 focus:ring-2 focus:ring-[#FF6B00]'
                      }`}
                    />
                  </div>

                  {/* UTR Acceptance / Validation Badge */}
                  {isUtrReady ? (
                    <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>✓ UTR Verified: {utrRef}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
                      <span>
                        {utrRef.length === 0
                          ? '⚠️ 12-digit numeric UTR is mandatory! Enter 12 digits from receipt to proceed.'
                          : `⚠️ Please enter ${12 - utrRef.length} more digits (strictly 12 digits required).`}
                      </span>
                    </div>
                  )}

                  {/* =======================================================
                      MANDATORY PAYMENT SCREENSHOT SECTION
                     ======================================================= */}
                  <div className="space-y-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#FF6B00]" />
                        <span>Payment Screenshot *</span>
                      </label>
                      {screenshotUrl ? (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ✓ Payment screenshot uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Compulsory *
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300">
                      {isUtrReady 
                        ? 'Please upload your payment screenshot to complete verification.' 
                        : 'Upload the screenshot of your successful payment. Required for verification.'}
                    </p>

                    {/* Screenshot Preview or Upload Dropzone */}
                    {screenshotUrl ? (
                      <div className="p-3 bg-black/40 rounded-xl border border-emerald-500/40 space-y-2">
                        <div className="relative group rounded-lg overflow-hidden border border-white/10 max-h-48 flex items-center justify-center bg-black/60">
                          <img
                            src={screenshotUrl}
                            alt="Payment Screenshot Receipt"
                            className="max-h-48 w-auto object-contain rounded-lg shadow"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Screenshot Verified</span>
                          </div>
                          <label className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>Replace Screenshot</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) processScreenshotFile(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
                          isUtrReady 
                            ? 'border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/15 hover:border-amber-400' 
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 flex items-center justify-center text-white shadow">
                            {isUploadingScreenshot ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5" />
                            )}
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-black text-amber-300 block">
                              {isUploadingScreenshot ? 'Uploading Screenshot...' : 'Upload Payment Screenshot'}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Accepts JPG, JPEG, PNG, or WebP (Max 5MB)
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            className="hidden"
                            disabled={isUploadingScreenshot}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) processScreenshotFile(file);
                            }}
                          />
                        </label>

                        {/* Upload Progress Bar */}
                        {isUploadingScreenshot && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-300 font-bold">
                              <span>Uploading & Optimizing...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#FF6B00] to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {screenshotError && (
                          <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-400/40 text-rose-200 text-xs font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />
                            <span>{screenshotError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* SLA Guarantee Notice */}
                  <div className="p-3 bg-emerald-950/90 rounded-2xl border-2 border-emerald-500/70 text-emerald-200 flex items-start gap-2 text-xs shadow-inner">
                    <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-xs text-emerald-300 font-outfit">
                        Payment will be verified and balance will be credited within 5-7 minutes.
                      </p>
                      <p className="text-[10px] text-emerald-200/80 mt-0.5">
                        Admin will review UTR and screenshot before approving.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsTopUpModalOpen(false)}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
                    >
                      Cancel / Back
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingTopUp || !isUtrReady || !screenshotUrl || isUploadingScreenshot}
                      onClick={handleConfirmTopUp}
                      className={`flex-2 py-3.5 text-white font-black text-xs rounded-2xl shadow-orange-glow transition active:scale-95 flex items-center justify-center gap-1.5 ${
                        isUtrReady && screenshotUrl
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 cursor-pointer'
                          : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isProcessingTopUp 
                          ? 'Submitting for Verification...' 
                          : !isUtrReady 
                          ? 'Enter 12-Digit UTR to Continue' 
                          : !screenshotUrl 
                          ? 'Upload Payment Screenshot *' 
                          : `Submit for Verification (₹${topUpAmount})`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
