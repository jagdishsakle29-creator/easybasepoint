import React, { useState, useMemo, useEffect } from 'react';
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
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuotaPackage, QuotaLevel } from '../../types';
import { UsdtDepositTab } from './UsdtDepositTab';
import QRCode from 'qrcode';
import { verifyPaymentScreenshot, OcrVerificationResult } from '../../utils/ocrPaymentVerifier';
import { openOfficialTelegramChannel } from '../../config/constants';
import { PhonePeLogo, PaytmLogo, launchUpiPayment } from '../common/UpiLogos';
import { formatIndianDateTime } from '../history/HistoryPage';
import confetti from 'canvas-confetti';

export const DepositPage: React.FC = () => {
  const { 
    user,
    packages, 
    wallet, 
    settings, 
    deposits,
    buyQuota, 
    submitInrDeposit, 
    approveDeposit,
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
  const [topUpAmount, setTopUpAmount] = useState<number>(350);
  const [utrRef, setUtrRef] = useState<string>('');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState<boolean>(false);
  const [depositStatusFilter, setDepositStatusFilter] = useState<'all' | 'successful' | 'pending' | 'cancelled'>('all');

  // Mandatory Payment Screenshot State
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState<boolean>(false);
  const [qrViewMode, setQrViewMode] = useState<'dynamic' | 'official'>('dynamic');
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string>('');
  const [officialQrDataUrl, setOfficialQrDataUrl] = useState<string>('');
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);


  // Smart AI OCR Auto-Accept State & 10-Minute Freshness Check
  const [orderInitiatedAt, setOrderInitiatedAt] = useState<number>(Date.now());
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'scanning' | 'passed' | 'failed'>('idle');
  const [ocrProgressText, setOcrProgressText] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<OcrVerificationResult | null>(null);
  const [aiModalStatus, setAiModalStatus] = useState<'idle' | 'verifying' | 'approved' | 'rejected'>('idle');
  const [aiModalMessage, setAiModalMessage] = useState<string>('');

  // Monitor 2-minute rate limit for payment screenshot submissions
  useEffect(() => {
    const userIdentifier = user?.id || user?.phone || 'active_user';
    const lastDepositKey = `ebp_last_dep_${userIdentifier}`;
    const checkCooldown = () => {
      const lastDepTime = Number(localStorage.getItem(lastDepositKey) || 0);
      const now = Date.now();
      const COOLDOWN_MS = 5 * 1000;
      if (lastDepTime && now - lastDepTime < COOLDOWN_MS) {
        setCooldownSeconds(Math.ceil((COOLDOWN_MS - (now - lastDepTime)) / 1000));
      } else {
        setCooldownSeconds(0);
      }
    };
    checkCooldown();
    const timer = setInterval(checkCooldown, 1000);
    return () => clearInterval(timer);
  }, [user]);

  // 3 QR Options requested by user:
  // QR 1: Khushi (Main QR) - narwariya321@axl
  // QR 2: Lord VIP QR - manishkey@fam
  // QR 3: Pradeep QR - 9589022172@ybl
  const qrOptions = useMemo(() => [
    {
      id: 'khushi' as const,
      label: 'QR 1 (Main): Khushi',
      tabLabel: '🌟 QR 1: Khushi',
      upiId: settings.adminUpiId || 'narwariya321@axl',
      payeeName: 'Khushi Naravriya',
      imageSrc: '/deposit_qr_clean.png?v=v11_3qrs',
      badge: 'MAIN QR',
      subtitle: 'Official Main QR (narwariya321@axl)',
    },
    {
      id: 'lord' as const,
      label: 'QR 2: Lord VIP QR',
      tabLabel: '👑 QR 2: Lord VIP',
      upiId: 'manishkey@fam',
      payeeName: 'LORD PAID HACK SELLER',
      imageSrc: '/deposit_qr_lord.png?v=v11_3qrs',
      badge: 'VIP QR',
      subtitle: 'Lord VIP QR (manishkey@fam)',
    },
    {
      id: 'kumkum' as const,
      label: 'QR 3: Kumkum Sakle (PhonePe)',
      tabLabel: '⚡ QR 3: Kumkum',
      upiId: 'kushalsaini108@axl',
      payeeName: 'KUMKUM SAKLE',
      imageSrc: '/deposit_qr_kumkum.png?v=v20261018_kumkum_phonepe_direct',
      badge: 'PHONEPE',
      subtitle: 'Official PhonePe QR (kushalsaini108@axl)',
      isMaintenance: false,
    },
  ], [settings.adminUpiId]);

  const [selectedQrId, setSelectedQrId] = useState<'khushi' | 'lord' | 'kumkum'>('khushi');
  const activeQr = qrOptions.find((q) => q.id === selectedQrId) || qrOptions[0];
  const activeUpiId = activeQr.upiId;
  const activePayeeName = activeQr.payeeName;

  // Generate dynamic amount UPI QR code on any amount change
  useEffect(() => {
    let isCancelled = false;
    const amount = topUpAmount || 350;
    const note = 'TopUp';
    const upiUri = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activePayeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

    QRCode.toDataURL(upiUri, {
      width: 600,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (!isCancelled) {
          setDynamicQrDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Error generating dynamic QR:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [topUpAmount, activeUpiId, activePayeeName]);

  // Generate dynamic Official Poster QR code with amount pre-filled
  useEffect(() => {
    let isCancelled = false;
    const amount = topUpAmount || 350;
    const officialUri = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activePayeeName)}&am=${amount}&cu=INR&tn=TopUp`;

    QRCode.toDataURL(officialUri, {
      width: 600,
      margin: 1.5,
      color: {
        dark: '#2D2335',
        light: '#E6D7F9',
      },
      errorCorrectionLevel: 'H',
    })
      .then((rawQrUrl) => {
        if (isCancelled) return;
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setOfficialQrDataUrl(rawQrUrl);
          return;
        }

        const img = new Image();
        img.onload = () => {
          if (isCancelled) return;
          ctx.drawImage(img, 0, 0, 600, 600);

          // Center circle dimensions matching user's uploaded poster
          const centerX = 300;
          const centerY = 300;
          const radius = 62;

          // Outer dark circle
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = '#1D1A20';
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#3E3447';
          ctx.stroke();

          // Golden 'X' mark
          ctx.fillStyle = '#F59E0B';
          ctx.font = '900 68px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('X', centerX, centerY + 2);

          const compositeUrl = canvas.toDataURL('image/png');
          setOfficialQrDataUrl(compositeUrl);
        };
        img.onerror = () => {
          if (!isCancelled) setOfficialQrDataUrl(rawQrUrl);
        };
        img.src = rawQrUrl;
      })
      .catch((err) => {
        console.error('Error generating official dynamic QR:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [topUpAmount, activeUpiId, activePayeeName]);

  // Instant image preloading for zero-latency switching across all 3 QRs
  useEffect(() => {
    ['/deposit_qr_clean.png?v=v11_3qrs', '/deposit_qr_lord.png?v=v11_3qrs', '/deposit_qr_kumkum.png?v=v20261018_kumkum_phonepe_direct', '/deposit_qr_pradeep.png'].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

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
    setOrderInitiatedAt(Date.now());
    setOcrResult(null);
    setOcrStatus('idle');
    setOcrProgressText('');
    setIsTopUpModalOpen(true);
    addToast('info', `Selected ₹${pkg.price.toLocaleString('en-IN')} package. Pay via PhonePe, Paytm or QR with remark "cousin".`);
  };

  const processScreenshotFile = (file: File) => {
    setScreenshotError(null);
    if (file.type && !file.type.toLowerCase().startsWith('image/')) {
      const err = 'Unsupported file type. Please upload JPG, PNG, or WebP.';
      setScreenshotError(err);
      addToast('error', err);
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      const err = 'File size exceeds 25MB limit. Please upload a smaller screenshot.';
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
        const maxDim = 800;
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
        let finalDataUrl = reader.result as string;
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          finalDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setScreenshotUrl(finalDataUrl);
        } else {
          setScreenshotUrl(finalDataUrl);
        }
        setScreenshotFile(file);
        setUploadProgress(100);
        setIsUploadingScreenshot(false);
        addToast('success', '✓ Payment screenshot attached!');
      };
      img.onerror = () => {
        const fallbackUrl = reader.result as string;
        setScreenshotUrl(fallbackUrl);
        setScreenshotFile(file);
        setUploadProgress(100);
        setIsUploadingScreenshot(false);
        addToast('success', '✓ Payment screenshot attached!');
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

  const handleConfirmTopUp = async () => {
    const minDep = settings.minDeposit || 350;
    const amt = topUpAmount > 0 ? topUpAmount : minDep;
    const cleanUtr = utrRef.trim();

    if (!cleanUtr || cleanUtr.length !== 12) {
      addToast('error', '⚠️ 12-digit numeric UTR is mandatory to submit your deposit.');
      return;
    }

    setIsProcessingTopUp(true);
    setAiModalStatus('verifying');
    setAiModalMessage('🤖 AI Scanner receipt verify kar raha hai... Kripya 2-3 second wait karein.');

    try {
      if (screenshotUrl && (screenshotUrl.startsWith('data:image') || screenshotUrl.startsWith('http'))) {
        // Run OCR in background with strict 6s timeout so whole flow finishes under 10 seconds
        const ocrPromise = verifyPaymentScreenshot({
          imageSource: screenshotUrl,
          expectedAmount: amt,
          orderCreatedAt: orderInitiatedAt,
          maxMinutesDiff: settings.ocrMaxTimeWindowMins || 10,
        });

        const timeoutFallback = new Promise<OcrVerificationResult>((resolve) => {
          setTimeout(() => {
            resolve({
              success: false,
              amountMatched: false,
              statusMatched: false,
              timeValid: false,
              rawText: '',
              reason: 'Payment receipt verification failed: 10s rule timeout. Sahi receipt attach karein.',
            });
          }, 6000);
        });

        const ocrRes = await Promise.race([
          ocrPromise,
          timeoutFallback,
        ]);

        if (ocrRes.amountMatched && ocrRes.timeValid && ocrRes.statusMatched) {
          // APPROVED!
          setAiModalStatus('approved');
          setAiModalMessage(`✓ AI Verified! ₹${amt} debited successfully. Payment Auto-Approved!`);
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 }
            });
          } catch {}
          await submitInrDeposit(amt, cleanUtr, screenshotUrl, 'cousin', {
            verified: true,
            detectedAmount: ocrRes.detectedAmount,
            detectedUtr: ocrRes.detectedUtr,
            detectedTime: ocrRes.detectedTime,
            timeDiffMins: ocrRes.timeDiffMins,
            status: 'passed',
            reason: ocrRes.reason,
          });
          addToast('success', `🎉 Payment Auto-Approved! ₹${amt} credited to wallet!`);
          setTimeout(() => {
            setIsTopUpModalOpen(false);
            setAiModalStatus('idle');
            setUtrRef('');
            setScreenshotFile(null);
            setScreenshotUrl('');
          }, 2000);
        } else {
          // REJECTED RIGHT THERE ON THE PAGE!
          setAiModalStatus('rejected');
          const rejectMsg = ocrRes.reason || 'Screenshot me exact amount ya valid payment receipt nahi mili.';
          setAiModalMessage(rejectMsg);
          await submitInrDeposit(amt, cleanUtr, screenshotUrl, 'cousin', {
            verified: false,
            detectedAmount: ocrRes.detectedAmount,
            detectedUtr: ocrRes.detectedUtr,
            detectedTime: ocrRes.detectedTime,
            timeDiffMins: ocrRes.timeDiffMins,
            status: 'failed',
            reason: rejectMsg,
          });
          addToast('error', `❌ AI Rejected: ${rejectMsg}`);
        }
      } else {
        // No screenshot provided, process UTR
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const res = await submitInrDeposit(amt, cleanUtr, '', 'cousin');
        if (res && res.success) {
          setAiModalStatus('approved');
          setAiModalMessage('✓ Payment submitted successfully!');
          setTimeout(() => {
            setIsTopUpModalOpen(false);
            setAiModalStatus('idle');
            setUtrRef('');
            setScreenshotFile(null);
            setScreenshotUrl('');
          }, 1500);
        } else {
          setAiModalStatus('rejected');
          setAiModalMessage(res?.message || 'Payment submission failed.');
        }
      }
    } catch (err: any) {
      setAiModalStatus('rejected');
      setAiModalMessage(err?.message || 'Verification error. Please retry.');
      addToast('error', err?.message || 'Failed to submit payment.');
    } finally {
      setIsProcessingTopUp(false);
    }
  };

  const isMobileDevice = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isTouch = (navigator.maxTouchPoints || 0) > 0;
    const isMobileUa = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileUa || (isTouch && isSmallScreen);
  };

  const getAppLaunchUrl = (app: 'phonepe' | 'paytm' | 'gpay' | 'amazonpay' | 'upi') => {
    const upiId = activeUpiId;
    const amount = topUpAmount || 350;
    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const payeeName = activePayeeName;
    const note = "TopUp";
    const standardUpi = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

    if (app === 'amazonpay') {
      if (isAndroid) {
        return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=in.amazon.mShop.android.shopping;action=android.intent.action.VIEW;end`;
      }
      return standardUpi;
    }

    if (app === 'phonepe') {
      if (isAndroid) {
        return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.phonepe.app;action=android.intent.action.VIEW;end`;
      }
      if (isIOS) {
        return `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
      }
      return standardUpi;
    }

    if (app === 'paytm') {
      if (isAndroid) {
        return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=net.one97.paytm;action=android.intent.action.VIEW;end`;
      }
      if (isIOS) {
        return `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
      }
      return standardUpi;
    }

    if (app === 'gpay') {
      if (isAndroid) {
        return `intent://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.VIEW;end`;
      }
      if (isIOS) {
        return `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
      }
      return standardUpi;
    }

    return standardUpi;
  };

  const handleLaunchUpi = (e: React.MouseEvent, appName: string, appKey: 'phonepe' | 'paytm' | 'gpay' | 'upi') => {
    e.preventDefault();
    const minDep = settings.minDeposit || 350;
    if (!topUpAmount || topUpAmount < minDep) {
      addToast('error', `Minimum deposit amount is ₹${minDep}.`);
      return;
    }

    launchUpiPayment({
      appKey,
      appName,
      upiId: activeUpiId,
      payeeName: activePayeeName,
      amount: topUpAmount,
      note: 'TopUp',
      onOpenModal: () => setIsTopUpModalOpen(true),
      addToast,
    });
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
            <span>Crypto USDT (Maintenance)</span>
          </span>
        </button>
      </div>

      {/* If USDT Mode is selected, render UsdtDepositTab */}
      {depositMode === 'USDT' ? (
        <UsdtDepositTab onSwitchToInr={() => setDepositMode('INR')} />
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
                {[350, 500, 800, 1200, 2500].map((amt) => (
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
                min={settings.minDeposit || 350}
                step={50}
                value={topUpAmount || ''}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                placeholder={`Or enter custom amount (Min ₹${settings.minDeposit || 350})`}
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

                  {/* > ₹2,000 High-Amount Helper Notice (Gallery QR Limit Solution) */}
                  {topUpAmount > 2000 && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-400/60 rounded-2xl text-left space-y-2.5 shadow-lg animate-fadeIn">
                      <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wide">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>₹2,000+ Payment Guide (Bank / Gallery Limit Solution)</span>
                      </div>
                      <p className="text-[11px] text-amber-100/90 leading-relaxed font-sans">
                        Agar photo gallery se QR scan karne par PhonePe/Paytm me ₹2,000 limit ka error aaye, toh in 2 aasan tareeqon se payment karein:
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-black/40 rounded-xl border border-amber-400/30 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <div className="flex-1">
                            <div className="text-white font-bold text-[11px]">UPI ID Copy Karke Direct Pay Karein:</div>
                            <div className="text-slate-300 text-[11px] mt-0.5">
                              Payment box me diye <b>"Copy UPI"</b> button par tap karein, fir PhonePe/Paytm ke <b>"To UPI ID"</b> option me jakar direct <b>₹{topUpAmount}</b> bhej sakte hain (isme koi gallery limit nahi aayegi).
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-amber-400/30 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <div className="flex-1">
                            <div className="text-white font-bold text-[11px]">₹1 Pay Again Trick:</div>
                            <div className="text-slate-300 text-[11px] mt-0.5">
                              Pehle QR scan karke sirf <b>₹1</b> pay karein. Fir PhonePe/Paytm history me usi transaction par jakar <b>"Pay Again"</b> tap karein aur bacha hua pura amount bhej sakte hain!
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clean QR & Official UPI Gateway Section with 3 QR Selectors */}
                  <div className="space-y-2.5 pt-1">
                    {/* 3 QR Selectors on Card: Khushi (Main), Lord, Pradeep */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-black text-amber-300 uppercase tracking-wide flex items-center gap-1 font-outfit">
                          <QrCode className="w-3.5 h-3.5 text-[#FF6B00]" />
                          <span>Choose Payment QR Code (3 Options)</span>
                        </span>
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase font-mono">
                          {activeQr.badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 text-[11px] font-bold font-outfit">
                        {qrOptions.map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              if (q.isMaintenance) {
                                addToast('info', `🛠️ ${q.label} abhi Under Maintenance hai. Kripya doosra QR use karein.`);
                                return;
                              }
                              setSelectedQrId(q.id);
                            }}
                            className={`py-2 px-1 rounded-xl transition text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                              q.isMaintenance
                                ? 'opacity-60 bg-white/5 border border-dashed border-amber-500/40 hover:opacity-80'
                                : selectedQrId === q.id
                                ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-md font-black'
                                : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span className="truncate w-full text-[10px] sm:text-[11px]">{q.tabLabel}</span>
                            <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                              q.isMaintenance
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : selectedQrId === q.id 
                                ? 'bg-black/30 text-amber-200' 
                                : 'bg-white/10 text-slate-400'
                            }`}>
                              {q.badge}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Active QR Banner Preview */}
                    <div 
                      onClick={() => setIsTopUpModalOpen(true)}
                      className="p-3 bg-black/40 hover:bg-black/50 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-3 cursor-pointer transition hover:border-amber-400 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-white p-1 flex-shrink-0 border border-amber-400 shadow flex items-center justify-center">
                          <img 
                            src={activeQr.id === 'kumkum' ? activeQr.imageSrc : (dynamicQrDataUrl || activeQr.imageSrc)} 
                            alt="Payment QR" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-amber-300 font-outfit truncate">
                              {activeQr.label} ({activeQr.upiId})
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                              Active
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-300 truncate">
                            Payee: {activeQr.payeeName} • PhonePe & Paytm
                          </div>
                          <div className="text-[10px] text-amber-400 font-bold group-hover:underline">
                            Tap to Open QR Scanner & Pay ₹{topUpAmount} ➔
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Direct 1-Tap App Payment Buttons (PhonePe & Paytm) with Authentic Brand Logos */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'PhonePe', 'phonepe')}
                        className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#5f259f] to-[#732ec7] hover:from-[#521f8a] hover:to-[#5f259f] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 border border-purple-400/40 active:scale-95 transition cursor-pointer font-outfit"
                      >
                        <PhonePeLogo className="w-5 h-5" />
                        <span className="tracking-wide">Pay via PhonePe</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'Paytm', 'paytm')}
                        className="py-3 px-3 rounded-2xl bg-gradient-to-r from-[#002e6e] to-[#004bb3] hover:from-[#002252] hover:to-[#002e6e] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 border border-sky-400/40 active:scale-95 transition cursor-pointer font-outfit"
                      >
                        <PaytmLogo className="px-1.5 py-0.5 text-[11px]" />
                        <span className="tracking-wide">Pay via Paytm</span>
                      </button>
                    </div>

                    {/* Scan QR / Other UPI Button */}
                    <button
                      type="button"
                      onClick={() => setIsTopUpModalOpen(true)}
                      className="w-full py-3.5 bg-gradient-to-r from-[#FF6B00] via-[#FF7E1D] to-amber-500 hover:from-[#E55F00] hover:to-orange-500 text-white font-black text-xs font-outfit rounded-2xl shadow-orange-glow transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Scan QR Code & Deposit ₹{topUpAmount} ➔</span>
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
                  Up to ₹15k
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
                  ₹15k - ₹29k
                </div>
                <div className="text-sm font-extrabold text-[#FF6B00] font-outfit mt-0.5">
                  +{settings.middleBonusPercent || 25}%
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">25% High Growth</div>
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
                  ₹37k - ₹55k
                </div>
                <div className="text-sm font-extrabold text-purple-600 font-outfit mt-0.5">
                  +{settings.highBonusPercent || 30}%
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">30% Max Yield</div>
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

          {/* Recent Deposit Orders Section with Clean Look: New on Top, Old at Bottom */}
          {(() => {
            if (!user) return null;
            const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');

            const isOwner = (d: typeof deposits[0]) => {
              if (d.userId && d.userId === user.id) return true;
              const depPhone = (d.userPhone || '').replace(/[^0-9]/g, '');
              if (cleanPhone.length >= 10 && depPhone.length >= 10 && depPhone.endsWith(cleanPhone.slice(-10))) {
                return true;
              }
              return false;
            };

            const isDepSuccessful = (d: typeof deposits[0]) =>
              d.status === 'completed' || d.status === 'credited' || d.status === 'approved' || d.credited === true;
            const isDepPending = (d: typeof deposits[0]) =>
              d.status === 'pending' || d.status === 'pending_verification' || (d.status as string) === 'processing';
            const isDepCancelled = (d: typeof deposits[0]) =>
              d.status === 'rejected' || d.status === 'failed' || (d.status as string) === 'cancelled';

            // Filter ONLY current user's deposits - Never auto-hide pending deposits
            const activeDeposits = deposits.filter((d) => isOwner(d));

            if (activeDeposits.length === 0) return null;

            // Strict sorting: Newest on TOP, Oldest at the BOTTOM
            const sortedDeposits = [...activeDeposits].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            const successfulDeps = sortedDeposits.filter(isDepSuccessful);
            const pendingDeps = sortedDeposits.filter(isDepPending);
            const cancelledDeps = sortedDeposits.filter(isDepCancelled);

            const successfulTotal = successfulDeps.reduce((sum, d) => sum + (d.totalInr || d.amount), 0);
            const pendingTotal = pendingDeps.reduce((sum, d) => sum + (d.totalInr || d.amount), 0);
            const cancelledTotal = cancelledDeps.reduce((sum, d) => sum + (d.totalInr || d.amount), 0);

            const activeFilter = depositStatusFilter || 'all';

            const filteredDeps = sortedDeposits.filter((d) => {
              if (activeFilter === 'all') return true;
              if (activeFilter === 'successful') return isDepSuccessful(d);
              if (activeFilter === 'pending') return isDepPending(d);
              if (activeFilter === 'cancelled') return isDepCancelled(d);
              return true;
            });

            return (
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider font-outfit">
                    <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Your Deposit Orders • Newest First</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Total: {activeDeposits.length}
                  </span>
                </div>

                {/* Status Summary Stat Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositStatusFilter('successful')}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      activeFilter === 'successful'
                        ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-400/50 shadow-xs'
                        : 'bg-white border-emerald-200/80 hover:bg-emerald-50/40'
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
                    onClick={() => setDepositStatusFilter('pending')}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      activeFilter === 'pending'
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-400/50 shadow-xs'
                        : 'bg-white border-amber-200/80 hover:bg-amber-50/40'
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
                    onClick={() => setDepositStatusFilter('cancelled')}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      activeFilter === 'cancelled'
                        ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-400/50 shadow-xs'
                        : 'bg-white border-rose-200/80 hover:bg-rose-50/40'
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

                {/* Status Segment Filter Buttons: All | Successful | Pending | Cancelled */}
                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold font-outfit">
                  <button
                    type="button"
                    onClick={() => setDepositStatusFilter('all')}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer truncate ${
                      activeFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs font-black'
                        : 'text-slate-700 hover:text-slate-900 bg-white/60'
                    }`}
                  >
                    📋 All ({activeDeposits.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositStatusFilter('pending')}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer truncate ${
                      activeFilter === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'text-amber-800 hover:text-amber-950 bg-white/60'
                    }`}
                  >
                    ⏳ Pending ({pendingDeps.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositStatusFilter('successful')}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer truncate ${
                      activeFilter === 'successful'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-emerald-700 hover:text-emerald-900 bg-white/60'
                    }`}
                  >
                    ✅ Done ({successfulDeps.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositStatusFilter('cancelled')}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center cursor-pointer truncate ${
                      activeFilter === 'cancelled'
                        ? 'bg-rose-600 text-white shadow-xs font-black'
                        : 'text-rose-700 hover:text-rose-900 bg-white/60'
                    }`}
                  >
                    ❌ Cancel ({cancelledDeps.length})
                  </button>
                </div>

                {/* Filtered Deposit List - Clean UI with Newest on Top */}
                {filteredDeps.length === 0 ? (
                  <div className="p-5 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                    No {activeFilter} deposit records found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDeps.map((dep) => {
                      const isPending = isDepPending(dep);
                      const isCompleted = isDepSuccessful(dep);

                      return (
                        <div
                          key={dep.id}
                          className={`rounded-2xl p-3.5 border transition-all ${
                            isPending
                              ? 'border-amber-300 bg-amber-50/50 shadow-xs'
                              : isCompleted
                              ? 'border-emerald-200 bg-white hover:border-emerald-300 shadow-xs'
                              : 'border-rose-200 bg-rose-50/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs text-slate-800">{dep.id}</span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase border border-slate-200">
                                  {dep.method}
                                </span>
                                {dep.utrNumber && (
                                  <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    UTR: {dep.utrNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {formatIndianDateTime(dep.createdAt)}
                              </div>
                            </div>

                            <div className="text-right space-y-1">
                              <div className="text-sm font-black font-outfit text-slate-900">
                                +₹{(dep.totalInr || dep.amount).toFixed(2)}
                              </div>
                              <div>
                                {isPending ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                    <Clock className="w-3 h-3 animate-spin text-amber-600" />
                                    Pending Verification
                                  </span>
                                ) : isCompleted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Approved & Credited
                                  </span>
                                ) : (
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                      <XCircle className="w-3 h-3 text-rose-600" />
                                      Rejected
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openOfficialTelegramChannel('https://t.me/VIEWPOINT78')}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200 px-2 py-0.5 rounded-lg border border-sky-300 transition cursor-pointer"
                                      title="Chat with Admin on Telegram"
                                    >
                                      <Send className="w-2.5 h-2.5 text-sky-600" />
                                      <span>Telegram Chat (@VIEWPOINT78) ➔</span>
                                    </button>
                                  </div>
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
            {/* AI Real-time Background Verification Overlay (2-3s Wait & Instant Approve/Reject) */}
            {aiModalStatus !== 'idle' && (
              <div className="absolute inset-0 z-40 bg-[#07101E]/95 backdrop-blur-md rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
                {aiModalStatus === 'verifying' && (
                  <>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 flex items-center justify-center text-white shadow-[0_0_35px_rgba(255,107,0,0.6)] animate-pulse">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-2 border-white bg-emerald-500 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    </div>
                    <div className="space-y-1.5 max-w-xs">
                      <h4 className="text-base font-black text-white font-outfit">
                        🤖 AI Scanner Verification
                      </h4>
                      <div className="p-2 bg-amber-500/15 border border-amber-400/40 rounded-xl">
                        <p className="text-xs text-amber-300 font-bold">
                          ⏳ Kripya 2-3 second wait karein...
                        </p>
                        <p className="text-[11px] text-amber-100/90 mt-0.5">
                          Background me slip amount & UTR verify ho raha hai
                        </p>
                      </div>
                    </div>
                    <div className="w-48 bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#FF6B00] via-amber-400 to-emerald-400 h-1.5 rounded-full animate-pulse w-full" />
                    </div>
                  </>
                )}

                {aiModalStatus === 'approved' && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.6)] animate-bounce">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-emerald-300 font-outfit">
                        🎉 AI Verified & Auto-Approved!
                      </h4>
                      <p className="text-xs text-white font-bold">
                        ₹{topUpAmount} aapke wallet me turant credit ho gaya hai.
                      </p>
                      <p className="text-[11px] text-emerald-200">
                        {aiModalMessage}
                      </p>
                    </div>
                  </>
                )}

                {aiModalStatus === 'rejected' && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400 shadow-[0_0_35px_rgba(239,68,68,0.6)]">
                      <XCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-2 max-w-xs">
                      <h4 className="text-lg font-black text-red-400 font-outfit">
                        ❌ AI Verification: Rejected!
                      </h4>
                      <p className="text-xs text-red-200 font-bold">
                        Fake ya Invalid Screenshot Detect Hua
                      </p>
                      <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl text-[11px] text-red-300 text-left leading-relaxed">
                        <strong className="text-red-200 block mb-0.5">⚠️ Reason:</strong>
                        {aiModalMessage}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Payment request reject kar di gayi hai. Sahi payment slip attach karke dobara submit karein.
                      </p>
                    </div>
                    <div className="flex gap-2 w-full max-w-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAiModalStatus('idle');
                          setScreenshotFile(null);
                          setScreenshotUrl('');
                        }}
                        className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                      >
                        Naya Slip Upload Karein
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAiModalStatus('idle');
                          setIsTopUpModalOpen(false);
                        }}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

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

                  {/* > ₹2,000 High-Amount Helper Notice inside Modal (Gallery QR Limit Solution) */}
                  {topUpAmount > 2000 && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-2 border-amber-400/60 rounded-2xl text-left space-y-2.5 shadow-lg animate-fadeIn">
                      <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wide">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>₹2,000 Se Bada Payment Guide (Gallery Limit Solution)</span>
                      </div>
                      <p className="text-[11px] text-amber-100/90 leading-relaxed font-sans">
                        Agar photo gallery se QR scan karne par PhonePe/Paytm me ₹2,000 limit ka error aaye, toh in 2 aasan tareeqon se payment karein:
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-black/40 rounded-xl border border-amber-400/30 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <div className="flex-1">
                            <div className="text-white font-bold text-[11px]">UPI ID Copy Karke Direct Pay Karein:</div>
                            <div className="text-slate-300 text-[11px] mt-0.5">
                              Niche diye <b>"Copy UPI"</b> button par tap karein, fir apne PhonePe/Paytm ke <b>"To UPI ID"</b> option me jaakar direct <b>₹{topUpAmount}</b> pay kar sakte hain (isme koi gallery limit nahi aayegi).
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-amber-400/30 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <div className="flex-1">
                            <div className="text-white font-bold text-[11px]">₹1 Pay Again Trick:</div>
                            <div className="text-slate-300 text-[11px] mt-0.5">
                              Pehle QR scan karke sirf <b>₹1</b> send karein, fir transaction history me jakar <b>"Pay Again"</b> tap karein aur bacha hua pura amount bhej sakte hain!
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3 QR Selectors inside Modal */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wide flex items-center gap-1 font-outfit">
                        <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>Select QR Code:</span>
                      </span>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {activeQr.badge} Active
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold font-outfit">
                      {qrOptions.map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            if (q.isMaintenance) {
                              addToast('info', `🛠️ ${q.label} abhi Under Maintenance hai. Kripya doosra QR use karein.`);
                              return;
                            }
                            setSelectedQrId(q.id);
                          }}
                          className={`py-2 px-1 rounded-xl transition text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            q.isMaintenance
                              ? 'opacity-60 bg-white/5 border border-dashed border-amber-500/40 hover:opacity-80'
                              : selectedQrId === q.id
                              ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-md font-black'
                              : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate w-full text-[10px] sm:text-xs">{q.tabLabel}</span>
                          <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                            q.isMaintenance
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : selectedQrId === q.id 
                              ? 'bg-black/30 text-amber-200' 
                              : 'bg-white/10 text-slate-400'
                          }`}>
                            {q.badge}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Official UPI ID 1-Tap Copy Bar */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 text-xs min-w-0">
                      <span className="text-slate-400 shrink-0">Payee:</span>
                      <span className="font-mono font-black text-amber-300 select-all truncate">
                        {activeUpiId}
                      </span>
                      <span className="text-[10px] text-amber-200 font-bold hidden sm:inline truncate">
                        ({activePayeeName})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeUpiId);
                        addToast('success', `Copied ${activeUpiId} to clipboard!`);
                      }}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy UPI</span>
                    </button>
                  </div>

                  {/* QR Code and Official UPI */}
                  <div id="deposit-qr-section" className="bg-white rounded-3xl p-3.5 sm:p-4 text-center space-y-3 shadow-xl border-2 border-orange-400/30 overflow-hidden relative">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#FF6B00] to-amber-500 flex items-center justify-center text-white shadow-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black text-slate-900 tracking-wider font-outfit uppercase">
                          {activeQr.label} (₹{topUpAmount})
                        </span>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 uppercase">
                        ✓ Verified Merchant
                      </span>
                    </div>

                    {/* QR View Mode Toggle Tabs */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold font-outfit">
                      <button
                        type="button"
                        onClick={() => setQrViewMode('dynamic')}
                        className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                          qrViewMode === 'dynamic'
                            ? 'bg-[#FF6B00] text-white shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900 bg-white/70'
                        }`}
                      >
                        ⚡ Amount QR (₹{topUpAmount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrViewMode('official')}
                        className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                          qrViewMode === 'official'
                            ? 'bg-[#0B1528] text-white shadow-xs font-black'
                            : 'text-slate-600 hover:text-slate-900 bg-white/70'
                        }`}
                      >
                        🏛️ {activeQr.badge} Official Poster
                      </button>
                    </div>

                    {/* Pre-filled Amount Notification Tag */}
                    <div className="bg-emerald-50 border border-emerald-300/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[11px] font-black text-emerald-800 font-outfit">
                          Auto Amount Locked: ₹{topUpAmount}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
                        {activeQr.badge}
                      </span>
                    </div>

                    <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center p-3 rounded-2xl border-2 border-slate-100 bg-white shadow-inner">
                      <img 
                        src={
                          activeQr.id === 'kumkum'
                            ? activeQr.imageSrc
                            : qrViewMode === 'official' 
                            ? (activeQr.id === 'khushi' ? (officialQrDataUrl || activeQr.imageSrc) : activeQr.imageSrc)
                            : (dynamicQrDataUrl || activeQr.imageSrc)
                        } 
                        alt="Payment QR" 
                        loading="eager"
                        decoding="sync"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>

                    <div className="text-[11px] font-extrabold text-slate-800 flex items-center justify-center gap-1 font-outfit">
                      <QrCode className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span>
                        {activeQr.label}: ₹{topUpAmount} (PhonePe, Paytm)
                      </span>
                    </div>

                    <div className="flex items-center justify-center pt-0.5">
                      <a
                        href={
                          activeQr.id === 'kumkum'
                            ? activeQr.imageSrc
                            : qrViewMode === 'official' 
                            ? activeQr.imageSrc
                            : (dynamicQrDataUrl || activeQr.imageSrc)
                        }
                        download={`easybase_qr_${activeQr.id}_${topUpAmount}.png`}
                        className="text-xs font-black text-[#FF6B00] hover:text-[#e05e00] flex items-center gap-1.5 cursor-pointer bg-orange-50 hover:bg-orange-100 px-3.5 py-1.5 rounded-xl border border-orange-200 transition active:scale-95 font-outfit"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save {activeQr.badge} QR to Gallery</span>
                      </a>
                    </div>
                  </div>

                  {/* Direct 1-Tap PhonePe & Paytm App Launch Buttons */}
                  <div className="space-y-2 p-3 bg-gradient-to-r from-purple-950/40 via-slate-900 to-sky-950/40 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-outfit">
                        <Smartphone className="w-3.5 h-3.5 text-[#FF6B00]" />
                        <span>Direct 1-Tap App Payment</span>
                      </span>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {activePayeeName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'PhonePe', 'phonepe')}
                        className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#5f259f] to-[#732ec7] hover:from-[#521f8a] hover:to-[#5f259f] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 border border-purple-400/30 active:scale-95 transition cursor-pointer font-outfit"
                      >
                        <PhonePeLogo className="w-5 h-5" />
                        <span className="tracking-wide">Pay via PhonePe</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleLaunchUpi(e, 'Paytm', 'paytm')}
                        className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#002e6e] to-[#004bb3] hover:from-[#002252] hover:to-[#002e6e] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 border border-sky-400/30 active:scale-95 transition cursor-pointer font-outfit"
                      >
                        <PaytmLogo className="px-1.5 py-0.5 text-[11px]" />
                        <span className="tracking-wide">Pay via Paytm</span>
                      </button>
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
                      PAYMENT SCREENSHOT (OPTIONAL) SECTION
                     ======================================================= */}
                  <div className="space-y-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#FF6B00]" />
                        <span>Payment Screenshot (Optional)</span>
                      </label>
                      {screenshotUrl ? (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ✓ Attached
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Optional (Recommended)
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Payment receipt screenshot attach karna optional hai. Sirf 12-digit UTR daalkar bhi submit kar sakte hain.
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
                            <span>Screenshot Attached</span>
                          </div>
                          <label className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>Change</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) processScreenshotFile(file);
                              }}
                            />
                          </label>
                        </div>

                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300">
                          <span className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Payment proof ready</span>
                          </span>
                          <span className="text-[10px] text-slate-300">
                            AI background auto-verify
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className={`border-2 border-dashed rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                          isUtrReady 
                            ? 'border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/15 hover:border-amber-400' 
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}>
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 flex items-center justify-center text-white shadow">
                            {isUploadingScreenshot ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </div>
                          <div className="text-center">
                            <span className="text-xs font-black text-amber-300 block">
                              {isUploadingScreenshot ? 'Uploading Screenshot...' : 'Upload Payment Screenshot (Optional)'}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Accepts JPG, JPEG, PNG, or WebP
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
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

                  {/* Clean Simple Instructions */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-300 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-black text-amber-300 font-outfit">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Easy 2-Step Deposit Process</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      1. QR scan karke payment complete karein.<br />
                      2. Apne payment app se 12-digit UTR enter karein aur Submit button dabayein. Admin verification ke baad balance turant add ho jayega.
                    </p>
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
                      disabled={isProcessingTopUp || !isUtrReady || isUploadingScreenshot || cooldownSeconds > 0}
                      onClick={handleConfirmTopUp}
                      className={`flex-2 py-3.5 text-white font-black text-xs rounded-2xl shadow-orange-glow transition active:scale-95 flex items-center justify-center gap-1.5 font-outfit ${
                        isUtrReady && !isProcessingTopUp && cooldownSeconds === 0
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 cursor-pointer'
                          : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {isProcessingTopUp ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting Deposit...</span>
                        </>
                      ) : cooldownSeconds > 0 ? (
                        <span>Wait {cooldownSeconds}s</span>
                      ) : !isUtrReady ? (
                        <span>Enter 12-Digit UTR to Submit</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit for Approval (₹{topUpAmount})</span>
                        </>
                      )}
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
