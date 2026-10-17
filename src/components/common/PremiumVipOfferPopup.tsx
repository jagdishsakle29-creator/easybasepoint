import React, { useState, useEffect } from 'react';
import { Sparkles, Crown, X, Smartphone, ArrowRight, CheckCircle2, ShieldCheck, Copy, QrCode } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import QRCode from 'qrcode';

interface VipOffer {
  amount: number;
  percent: number;
  profit: number;
  total: number;
}

const VIP_OFFERS: VipOffer[] = [
  { amount: 5000, percent: 25, profit: 1250, total: 6250 },
  { amount: 10000, percent: 28, profit: 2800, total: 12800 },
  { amount: 15000, percent: 30, profit: 4500, total: 19500 },
  { amount: 20000, percent: 31, profit: 6200, total: 26200 },
  { amount: 25000, percent: 32, profit: 8000, total: 33000 },
  { amount: 50000, percent: 32, profit: 16000, total: 66000 },
];

export const PremiumVipOfferPopup: React.FC = () => {
  const { user, setActiveTab, addToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<VipOffer>(VIP_OFFERS[2]); // Default ₹15,000 @ 30%
  const [showMiniQr, setShowMiniQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // VIP Payee for large amounts (>= ₹800): 2nd QR (Manish Kumar)
  const vipUpiId = 'manishkey@fam';
  const vipPayeeName = 'Manish Kumar';

  // Check if current user is the configured VIP / Premium member
  const isPremiumUser = Boolean(
    user && (
      user.isPremium || 
      user.membershipLevel === 'Premium User' || 
      user.phone?.replace(/[^0-9]/g, '').endsWith('9277389208') || 
      user.email === 'manassingh9277@gmail.com'
    )
  );

  // 10-Minute Periodic Popup Timer
  useEffect(() => {
    if (!isPremiumUser) return;

    const STORAGE_KEY = 'ebp_vip_popup_last_shown';
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    const checkAndTriggerPopup = () => {
      const now = Date.now();
      const lastShown = Number(localStorage.getItem(STORAGE_KEY) || 0);

      if (!lastShown || now - lastShown >= TEN_MINUTES_MS) {
        // Pick a dynamic high amount offer (25% - 32%)
        const randomOffer = VIP_OFFERS[Math.floor(Math.random() * VIP_OFFERS.length)];
        setCurrentOffer(randomOffer);
        setShowMiniQr(false);
        setIsOpen(true);
        localStorage.setItem(STORAGE_KEY, String(now));
      }
    };

    // First check after 3 seconds on page load
    const initialTimeout = setTimeout(checkAndTriggerPopup, 3500);

    // Periodic check every 15 seconds
    const interval = setInterval(checkAndTriggerPopup, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isPremiumUser]);

  // Generate dynamic QR code when mini QR mode is activated
  useEffect(() => {
    if (!showMiniQr || !currentOffer) return;
    let cancelled = false;

    const upiUri = `upi://pay?pa=${encodeURIComponent(vipUpiId)}&pn=${encodeURIComponent(vipPayeeName)}&am=${currentOffer.amount}&cu=INR&tn=TopUp`;

    QRCode.toDataURL(upiUri, {
      width: 400,
      margin: 1.5,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate mini VIP QR:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [showMiniQr, currentOffer]);

  if (!isPremiumUser || !isOpen) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    setShowMiniQr(false);
    // Refresh last shown time so next popup appears after 10 minutes
    localStorage.setItem('ebp_vip_popup_last_shown', String(Date.now()));
  };

  const handleOpenDepositPage = () => {
    setActiveTab('deposit');
    handleDismiss();
    addToast('info', `Redirecting to Deposit with VIP ₹${currentOffer.amount} offer (+${currentOffer.percent}%)...`);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 max-w-[320px] sm:max-w-[340px] w-full animate-slideUp">
      {/* Sleek Semi-Transparent Glassmorphism Container */}
      <div className="relative rounded-3xl p-4 bg-[#081224]/85 backdrop-blur-xl border border-amber-500/40 shadow-[0_12px_45px_rgba(255,107,0,0.35)] text-white space-y-3">
        {/* Subtle glowing ambient pulse */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header Bar with VIP Badge & Close Button */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-[#FF6B00] flex items-center justify-center text-white shadow-xs">
              <Crown className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-black font-outfit uppercase tracking-wider text-amber-300">
              VIP Flash Allocation
            </span>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition cursor-pointer"
            title="Dismiss for 10 minutes"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {!showMiniQr ? (
          /* STEP 1: COMPACT TEASER POPUP */
          <div 
            onClick={() => setShowMiniQr(true)}
            className="cursor-pointer space-y-2.5 group"
          >
            {/* Offer Highlight Box */}
            <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 group-hover:border-amber-400/50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Deposit Amount</div>
                  <div className="text-xl font-black font-outfit text-amber-300 tracking-wide">
                    ₹{currentOffer.amount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    +{currentOffer.percent}% Return
                  </span>
                  <div className="text-xs font-bold text-slate-300 mt-0.5">
                    +₹{currentOffer.profit.toLocaleString('en-IN')} Profit
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300 font-medium">
                <span>Total Balance Credit:</span>
                <strong className="text-emerald-400 font-black">
                  ₹{currentOffer.total.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 leading-relaxed">
              Yeh bada amount deposit karein aur paayein <b>25% se 32% VIP income</b>! Tap karke instant scanner open karein:
            </p>

            {/* Tap Action CTA Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMiniQr(true);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-[#FF6B00] via-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-black text-xs font-outfit rounded-xl shadow-orange-glow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Tap to Open QR Scanner (₹{currentOffer.amount}) ➔</span>
            </button>
          </div>
        ) : (
          /* STEP 2: MINI SCANNER (TAP REVEALS COMPACT QR) */
          <div className="space-y-2.5 pt-1">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-300 font-outfit">
                <span>Scan & Deposit: ₹{currentOffer.amount.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] text-emerald-300 font-bold">
                ✓ Guaranteed +{currentOffer.percent}% Commission (+₹{currentOffer.profit})
              </p>
            </div>

            {/* Compact Mini QR Image */}
            <div className="relative mx-auto w-44 h-44 p-2 rounded-2xl bg-white border border-amber-400/40 shadow-inner flex items-center justify-center">
              <img 
                src={qrDataUrl || "/deposit_qr.png?v=fixed_v7_baby_ebp"} 
                alt="VIP Payment QR" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Quick UPI Copy Bar */}
            <div className="flex items-center justify-between p-2 bg-black/40 rounded-xl border border-white/10 text-[10px]">
              <span className="text-slate-300 truncate font-mono">
                {vipUpiId} ({vipPayeeName})
              </span>
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(vipUpiId);
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                    addToast('success', 'Copied UPI ID to clipboard!');
                  } catch {}
                }}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-2.5 h-2.5" />
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* 1-Tap App Links */}
            <div className="grid grid-cols-2 gap-1.5">
              <a
                href={`phonepe://pay?pa=${encodeURIComponent(vipUpiId)}&pn=${encodeURIComponent(vipPayeeName)}&am=${currentOffer.amount}&cu=INR&tn=TopUp`}
                className="py-2 px-2 rounded-xl bg-[#5f259f] hover:bg-[#4d1d82] text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-3 h-3 text-purple-200" />
                <span>PhonePe</span>
              </a>

              <a
                href={`paytmmp://pay?pa=${encodeURIComponent(vipUpiId)}&pn=${encodeURIComponent(vipPayeeName)}&am=${currentOffer.amount}&cu=INR&tn=TopUp`}
                className="py-2 px-2 rounded-xl bg-[#002e6e] hover:bg-[#002252] text-white font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-3 h-3 text-sky-200" />
                <span>Paytm</span>
              </a>
            </div>

            <button
              type="button"
              onClick={handleOpenDepositPage}
              className="w-full py-1.5 text-slate-300 hover:text-white text-[10px] font-bold text-center underline cursor-pointer"
            >
              Open Full Deposit Page to Upload Screenshot ➔
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 border-t border-white/5">
          <span>Active for 10 Mins</span>
          <span className="text-emerald-400 font-bold">VIP 25%-32% Guarantee</span>
        </div>
      </div>
    </div>
  );
};
