import React, { useState, useEffect } from 'react';
import { 
  ArrowUpFromLine, 
  Building2, 
  Smartphone, 
  Coins, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Info, 
  CreditCard,
  MessageCircle,
  Send,
  Mail
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WithdrawalMethod } from '../../types';
import { otpService } from '../../services/otpService';

export const WithdrawPage: React.FC = () => {
  const { 
    user,
    wallet, 
    settings, 
    submitWithdrawal, 
    addToast, 
    setActiveTab, 
    withdrawals,
    bankCards,
    upis,
    usdts 
  } = useApp();

  const [method, setMethod] = useState<WithdrawalMethod>('bank');
  const [amount, setAmount] = useState<number>(() => Math.max(450, settings.minWithdrawal || 450));
  
  // Bank fields
  const [accountHolder, setAccountHolder] = useState(() => bankCards[0]?.accountHolder || '');
  const [bankName, setBankName] = useState(() => bankCards[0]?.bankName || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState(() => bankCards[0]?.ifscCode || '');

  // UPI field
  const [upiId, setUpiId] = useState(() => upis[0]?.upiId || '');

  // USDT field
  const [usdtAddress, setUsdtAddress] = useState(() => usdts[0]?.address || '');

  // Company Withdrawal OTP Confirmation states
  const [waOtp, setWaOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [maskedContact, setMaskedContact] = useState('');
  const [userEmail, setUserEmail] = useState(() => (user?.email && !user.email.endsWith('@ebp.com')) ? user.email : '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 0% Withdrawal Fee (Zero Deductions as requested)
  const feeAmount = 0.00;
  const netAmount = amount;

  // OTP Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handlePercentageSelect = (percent: number) => {
    if (percent === 100) {
      setAmount(parseFloat(wallet.balance.toFixed(2)));
    } else {
      const calculated = Math.floor((wallet.balance * percent) / 100);
      setAmount(calculated);
    }
  };

  const handleSendVerificationCode = async () => {
    if (amount < settings.minWithdrawal) {
      addToast('error', `Minimum withdrawal amount is ₹${settings.minWithdrawal}.`);
      return;
    }
    if (amount > wallet.balance) {
      addToast('error', `Insufficient wallet balance. Available: ₹${wallet.balance.toFixed(2)}`);
      return;
    }

    const targetEmail = userEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!targetEmail || !emailRegex.test(targetEmail)) {
      const err = 'Please enter a valid Gmail / Email address to receive your OTP.';
      setOtpError(err);
      addToast('error', err);
      return;
    }

    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await otpService.requestOtp(targetEmail, 'email');
      if (res.success || res.ok) {
        setIsOtpSent(true);
        setOtpTimer(res.cooldownSeconds || 60);
        setMaskedContact(res.maskedContact || targetEmail);
        addToast('success', res.message || `Verification OTP sent to ${targetEmail}!`);
      } else {
        const errorMsg = res.message || 'Failed to send verification code. Please try again.';
        setOtpError(errorMsg);
        addToast('error', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error requesting verification code. Please try again.';
      setOtpError(errorMsg);
      addToast('error', errorMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount < settings.minWithdrawal) {
      addToast('error', `Minimum withdrawal amount is ₹${settings.minWithdrawal}.`);
      return;
    }

    if (amount > wallet.balance) {
      addToast('error', `Insufficient wallet balance. Available: ₹${wallet.balance.toFixed(2)}`);
      return;
    }

    if (method === 'bank') {
      if (!accountHolder.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        addToast('error', 'Please fill in all bank details.');
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        addToast('error', 'Account numbers do not match.');
        return;
      }
      if (ifscCode.length < 5) {
        addToast('error', 'Please enter a valid IFSC code.');
        return;
      }
    } else if (method === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        addToast('error', 'Please enter a valid UPI ID (e.g. yourname@okhdfcbank).');
        return;
      }
    } else if (method === 'usdt') {
      if (!usdtAddress.trim() || usdtAddress.length < 25) {
        addToast('error', 'Please provide a valid USDT TRC20 address.');
        return;
      }
    }

    // Require OTP confirmation code
    if (!isOtpSent) {
      addToast('error', 'Please request a verification OTP to confirm your withdrawal.');
      return;
    }
    if (!waOtp || waOtp.trim().length < 4) {
      setOtpError('Please enter the verification code sent to your registered contact.');
      addToast('error', 'Please enter the verification OTP.');
      return;
    }

    const targetEmail = userEmail.trim().toLowerCase();
    setIsSubmitting(true);
    setOtpError('');

    (async () => {
      try {
        const verifyRes = await otpService.verifyOtp(targetEmail, waOtp.trim());
        if (!verifyRes.success && !verifyRes.ok) {
          setIsSubmitting(false);
          const errMsg = verifyRes.message || 'Invalid verification code.';
          setOtpError(errMsg);
          addToast('error', `❌ ${errMsg}`);
          return;
        }

        const details = {
          accountHolder: method === 'bank' ? accountHolder : undefined,
          bankName: method === 'bank' ? bankName : undefined,
          accountNumber: method === 'bank' ? accountNumber : undefined,
          ifscCode: method === 'bank' ? ifscCode.toUpperCase() : undefined,
          upiId: method === 'upi' ? upiId : undefined,
          usdtAddress: method === 'usdt' ? usdtAddress : undefined,
        };

        const res = submitWithdrawal(amount, method, details);
        setIsSubmitting(false);

        if (res.success) {
          setAmount(0);
          setAccountNumber('');
          setConfirmAccountNumber('');
          setWaOtp('');
          setIsOtpSent(false);
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setOtpError('Verification failed. Please try again.');
        addToast('error', 'Verification failed.');
      }
    })();
  };

  // Recent withdrawals for this user
  const recentWithdrawals = withdrawals.slice(0, 3);

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-black text-[#0B1528] font-outfit">Withdraw</h1>
        <button
          onClick={() => setActiveTab('history')}
          className="text-xs font-semibold text-[#FF6B00] hover:underline"
        >
          View History →
        </button>
      </div>

      {/* Available Balance Display Card */}
      <div className="glass-card rounded-3xl p-5 border border-slate-200/80">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          AVAILABLE BALANCE
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-3xl font-extrabold text-[#0B1528] font-outfit">
            ₹{wallet.balance.toFixed(2)}
          </div>
          <span className="text-xs font-medium text-slate-500">
            Min: ₹{settings.minWithdrawal}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Method Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-black font-outfit text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Select Payout Destination</span>
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setMethod('bank')}
              className={`p-3.5 rounded-2xl border text-center transition-all duration-300 touch-press flex flex-col items-center justify-center gap-2 relative ${
                method === 'bank'
                  ? 'border-orange-500 bg-gradient-to-b from-orange-500/15 to-orange-500/5 text-[#FF6B00] shadow-[0_4px_16px_rgba(255,107,0,0.18)] scale-[1.03]'
                  : 'border-slate-200/90 bg-white/90 text-slate-500 hover:border-orange-300 hover:text-slate-800'
              }`}
            >
              <div className={`p-2 rounded-xl transition ${method === 'bank' ? 'bg-[#FF6B00] text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>
                <Building2 className="w-4 h-4" />
              </div>
              <span className={`text-xs font-outfit tracking-wide ${method === 'bank' ? 'font-black text-[#FF6B00]' : 'font-semibold'}`}>
                Bank Transfer
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('upi')}
              className={`p-3.5 rounded-2xl border text-center transition-all duration-300 touch-press flex flex-col items-center justify-center gap-2 relative ${
                method === 'upi'
                  ? 'border-orange-500 bg-gradient-to-b from-orange-500/15 to-orange-500/5 text-[#FF6B00] shadow-[0_4px_16px_rgba(255,107,0,0.18)] scale-[1.03]'
                  : 'border-slate-200/90 bg-white/90 text-slate-500 hover:border-orange-300 hover:text-slate-800'
              }`}
            >
              <div className={`p-2 rounded-xl transition ${method === 'upi' ? 'bg-[#FF6B00] text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>
                <Smartphone className="w-4 h-4" />
              </div>
              <span className={`text-xs font-outfit tracking-wide ${method === 'upi' ? 'font-black text-[#FF6B00]' : 'font-semibold'}`}>
                UPI Instant
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('usdt')}
              className={`p-3.5 rounded-2xl border text-center transition-all duration-300 touch-press flex flex-col items-center justify-center gap-2 relative ${
                method === 'usdt'
                  ? 'border-orange-500 bg-gradient-to-b from-orange-500/15 to-orange-500/5 text-[#FF6B00] shadow-[0_4px_16px_rgba(255,107,0,0.18)] scale-[1.03]'
                  : 'border-slate-200/90 bg-white/90 text-slate-500 hover:border-orange-300 hover:text-slate-800'
              }`}
            >
              <div className={`p-2 rounded-xl transition ${method === 'usdt' ? 'bg-[#FF6B00] text-white shadow-xs' : 'bg-slate-100 text-slate-600'}`}>
                <Coins className="w-4 h-4" />
              </div>
              <span className={`text-xs font-outfit tracking-wide ${method === 'usdt' ? 'font-black text-[#FF6B00]' : 'font-semibold'}`}>
                USDT (TRC20)
              </span>
            </button>
          </div>
        </div>

        {/* Amount Input & Percentage Buttons */}
        <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <label className="font-bold text-slate-600 uppercase tracking-wider">
              Withdrawal Amount
            </label>
            <span className="text-slate-400">Processing Fee: {settings.withdrawalFeePercent}%</span>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount === 0 ? '' : amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                const parts = val.split('.');
                const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                setAmount(sanitized === '' ? 0 : parseFloat(sanitized) || 0);
              }}
              placeholder={`Min ₹${settings.minWithdrawal}`}
              className="w-full pl-9 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 font-extrabold font-outfit text-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
            />
          </div>

          {/* Quick Percentage Presets */}
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentageSelect(pct)}
                className="py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-orange-50 hover:border-[#FF6B00] hover:text-[#FF6B00] transition"
              >
                {pct === 100 ? 'Max' : `${pct}%`}
              </button>
            ))}
          </div>

          {/* Fee & Net Amount Summary - 0% Fee Promoted */}
          <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gross Withdrawal:</span>
              <span className="font-semibold text-slate-800">₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Fee:</span>
              <span className="font-black text-emerald-600">₹0.00 (0% Fee • Zero Deduction)</span>
            </div>
            <div className="pt-2 border-t border-emerald-200/80 flex justify-between text-sm">
              <span className="font-bold text-slate-800">Total Net Amount to Receive:</span>
              <span className="font-black text-emerald-700 font-outfit text-base">
                ₹{netAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Account Details Form */}
        <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {method === 'bank' ? 'Bank Account Details' : method === 'upi' ? 'UPI Details' : 'USDT Wallet Details'}
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('me')}
              className="text-[11px] font-semibold text-[#FF6B00] hover:underline"
            >
              Manage Saved Accounts →
            </button>
          </div>

          {/* Quick select from saved accounts */}
          {method === 'bank' && bankCards.length > 0 && (
            <div className="space-y-1.5 pb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Saved Bank Accounts</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {bankCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setBankName(card.bankName);
                      setAccountHolder(card.accountHolder);
                      setIfscCode(card.ifscCode);
                      addToast('info', `Selected ${card.bankName}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0 ${
                      bankName === card.bankName
                        ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{card.bankName}</span>
                    <span className="text-[10px] text-slate-400">({card.accountNumber})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {method === 'upi' && upis.length > 0 && (
            <div className="space-y-1.5 pb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Saved UPI IDs</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {upis.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setUpiId(item.upiId);
                      addToast('info', `Selected ${item.upiId}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0 ${
                      upiId === item.upiId
                        ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{item.upiId}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {method === 'usdt' && usdts.length > 0 && (
            <div className="space-y-1.5 pb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Saved USDT Wallets</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {usdts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setUsdtAddress(item.address);
                      addToast('info', `Selected ${item.label || item.network}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition flex-shrink-0 ${
                      usdtAddress === item.address
                        ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>{item.label || item.network}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {method === 'bank' && (
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Full name as in bank passbook"
                  className="w-full mt-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, HDFC, ICICI"
                  className="w-full mt-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Account Number</label>
                  <input
                    type="password"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full mt-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Confirm Account Number</label>
                  <input
                    type="text"
                    required
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    placeholder="Re-enter account number"
                    className="w-full mt-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                  maxLength={11}
                  className="w-full mt-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          )}

          {method === 'upi' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Virtual Payment Address (UPI ID)</label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@okhdfcbank"
                className="w-full mt-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Supports Google Pay, PhonePe, Paytm, BHIM</p>
            </div>
          )}

          {method === 'usdt' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-500">USDT TRC20 Wallet Address</label>
              <input
                type="text"
                required
                value={usdtAddress}
                onChange={(e) => setUsdtAddress(e.target.value)}
                placeholder="T..."
                className="w-full mt-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Please double check TRC20 network. Tokens sent to other networks are unrecoverable.</p>
            </div>
          )}
        </div>

        {/* Company Security Email OTP Verification Box */}
        <div className="p-4 bg-orange-50/90 rounded-2xl border border-orange-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
              <span>Company Security Verification</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
              100% Free Email OTP
            </span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Your Registered Gmail / Email ID</span>
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => {
                  setUserEmail(e.target.value.trim());
                  setOtpError('');
                }}
                placeholder="Enter your Gmail / Email (e.g. name@gmail.com)"
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
              <button
                type="button"
                disabled={otpTimer > 0 || isSendingOtp || amount < settings.minWithdrawal || amount > wallet.balance}
                onClick={handleSendVerificationCode}
                className="px-3.5 py-2.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl text-xs font-black shadow-xs transition disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSendingOtp
                    ? 'Sending OTP...'
                    : otpTimer > 0
                      ? `Sent (${otpTimer}s)`
                      : isOtpSent
                        ? 'Resend OTP'
                        : 'Get Email OTP'}
                </span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Verification code will be delivered instantly to this email inbox.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">Enter Received 6-Digit OTP</label>
            <input
              type="text"
              required
              maxLength={6}
              value={waOtp}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setWaOtp(val);
                setOtpError('');
              }}
              placeholder="Enter 6-digit company OTP"
              className={`w-full mt-1 px-3.5 py-2.5 text-sm font-mono tracking-widest text-center font-black rounded-xl border bg-white focus:outline-none focus:ring-2 text-slate-900 ${
                otpError 
                  ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/40 text-rose-950' 
                  : 'border-slate-200 focus:ring-[#FF6B00]'
              }`}
            />
          </div>

          {otpError && (
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-300 text-rose-700 font-bold text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>❌ {otpError}</span>
            </div>
          )}

          {isOtpSent && (
            <div className="flex items-center justify-between text-xs text-emerald-800 pt-0.5">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                OTP sent to {maskedContact || userEmail}
              </span>
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Expires in 5 mins
              </span>
            </div>
          )}
        </div>

        {/* Security & Verification Notice */}
        <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span>
            Withdrawals are processed with <strong>0% Fee</strong>. Average settlement time is 15-45 minutes directly to your verified account.
          </span>
        </div>

        {/* Submit Withdrawal Button */}
        <button
          type="submit"
          disabled={isSubmitting || amount <= 0 || amount > wallet.balance}
          className="w-full py-4 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-extrabold text-base rounded-2xl shadow-orange-glow transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 touch-press"
        >
          <span>{isSubmitting ? 'Submitting Request...' : 'Confirm & Submit Withdrawal'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      {/* Recent Withdrawal Requests */}
      {recentWithdrawals.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Recent Withdrawal Requests
          </h4>
          <div className="space-y-2">
            {recentWithdrawals.map((req) => (
              <div key={req.id} className="glass-card rounded-2xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">
                    ₹{req.amount.toFixed(2)} ({req.method.toUpperCase()})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                      req.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : req.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Net: ₹{req.netAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
