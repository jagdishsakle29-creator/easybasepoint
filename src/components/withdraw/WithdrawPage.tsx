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
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  XCircle,
  KeyRound,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WithdrawalMethod } from '../../types';
import { storage } from '../../services/storage';
import { otpService } from '../../services/otpService';

export const WithdrawPage: React.FC = () => {
  const { 
    user,
    wallet, 
    settings, 
    submitWithdrawal, 
    updateProfile,
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

  // Security Authorization Mode: 'pin' (Permanent 6-Digit PIN) or 'otp' (Telegram / Contact OTP)
  const [authChoice, setAuthChoice] = useState<'pin' | 'otp'>('pin');

  // 6-Digit Transaction Security PIN / Password Authorization
  const [securityPin, setSecurityPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // One-Time Verification OTP States
  const [withdrawalOtp, setWithdrawalOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpError, setOtpError] = useState('');
  const [otpSessionToken, setOtpSessionToken] = useState('');

  // OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleRequestOtp = async () => {
    if (otpTimer > 0 || isSendingOtp) return;
    const identifier = user?.phone || user?.email || '';
    if (!identifier) {
      addToast('error', 'No registered mobile number or email found for your account.');
      return;
    }

    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await otpService.requestOtp(identifier);
      setIsSendingOtp(false);
      if (res.ok) {
        setIsOtpSent(true);
        setOtpTimer(res.cooldownSeconds || 60);
        if (res.sessionToken) {
          setOtpSessionToken(res.sessionToken);
        }
        addToast('success', res.message || 'OTP sent successfully to your Telegram / contact!');
      } else {
        setOtpError(res.message);
        addToast('error', res.message);
      }
    } catch {
      setIsSendingOtp(false);
      setOtpError('Failed to send verification code. Please check your connection.');
      addToast('error', 'Failed to send verification code. Please try again.');
    }
  };

  // Reset PIN Modal States
  const [isResetPinModalOpen, setIsResetPinModalOpen] = useState(false);
  const [resetAccountPassword, setResetAccountPassword] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetError, setResetError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 0% Withdrawal Fee (Zero Deductions as requested)
  const feeAmount = 0.00;
  const netAmount = amount;

  const handlePercentageSelect = (percent: number) => {
    if (percent === 100) {
      setAmount(parseFloat(wallet.balance.toFixed(2)));
    } else {
      const calculated = Math.floor((wallet.balance * percent) / 100);
      setAmount(calculated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Security Verification: Handle Either PIN or OTP
    if (authChoice === 'otp') {
      const cleanOtp = withdrawalOtp.trim();
      if (!cleanOtp || cleanOtp.length !== 6) {
        setOtpError('Please enter the 6-digit verification code received on Telegram / contact.');
        addToast('error', '6-digit verification code is required.');
        return;
      }

      setIsSubmitting(true);
      setOtpError('');
      const identifier = user?.phone || user?.email || '';
      const verifyRes = await otpService.verifyOtp(identifier, cleanOtp, otpSessionToken);
      if (!verifyRes.ok) {
        setIsSubmitting(false);
        setOtpError(verifyRes.message || 'Invalid verification code.');
        addToast('error', verifyRes.message || 'Invalid verification code. Please check and try again.');
        return;
      }
    } else {
      // Require 6-Digit Security PIN or Account Password
      const entered = securityPin.trim();
      if (!entered || (entered.length !== 6 && entered.length < 4)) {
        setPinError('Please enter your 6-digit permanent Security PIN.');
        addToast('error', '6-digit permanent Security PIN is required.');
        return;
      }

      // Verify against user registered account password or custom transactionPin
      const account = storage.findAccount(user?.id || user?.phone || user?.email || '');
      const validPassword = (account?.password || '').trim();
      const userPin = (user?.transactionPin || account?.transactionPin || account?.user?.transactionPin || '').trim();

      let isAuthorized = false;

      if (userPin && entered === userPin) {
        isAuthorized = true;
      } else if (validPassword && entered === validPassword) {
        isAuthorized = true;
        // If user authorized using password, establish this entered PIN as their transaction PIN if 6 digits
        if (entered.length === 6 && /^\d+$/.test(entered)) {
          if (user) {
            updateProfile({ transactionPin: entered });
            if (account) {
              storage.saveAccount({ ...account, transactionPin: entered, user: { ...user, transactionPin: entered } });
            }
          }
        }
      } else if (!userPin) {
        // First-time setting PIN: automatically establish this entered PIN as their permanent security PIN!
        isAuthorized = true;
        if (user) {
          updateProfile({ transactionPin: entered });
          if (account) {
            storage.saveAccount({ ...account, transactionPin: entered, user: { ...user, transactionPin: entered } });
          }
        }
      }

      if (!isAuthorized) {
        setPinError('❌ Incorrect Security PIN! If you forgot your PIN, click "Forgot or Reset 6-Digit PIN" below or use "Request OTP".');
        addToast('error', '❌ Incorrect Security PIN. Please check or reset your PIN.');
        return;
      }
    }

    setIsSubmitting(true);
    setPinError('');
    setOtpError('');

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
      setSecurityPin('');
      setWithdrawalOtp('');
      addToast('success', 'Withdrawal request authorized successfully! Processing payout.');
    }
  };

  // Status filter state for withdrawals
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState<'all' | 'successful' | 'pending' | 'cancelled'>('all');

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

        {/* Dual Security Authorization: Permanent 6-Digit PIN or One-Time OTP */}
        <div className="p-4 bg-gradient-to-b from-orange-50/95 to-amber-50/80 rounded-2xl border-2 border-orange-300 shadow-sm space-y-3">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
              <span>Withdrawal Authorization *</span>
            </span>
            
            {/* Mode Toggle Tabs */}
            <div className="flex p-0.5 rounded-xl bg-orange-200/70 border border-orange-300 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => { setAuthChoice('pin'); setPinError(''); setOtpError(''); }}
                className={`px-2.5 py-1 rounded-lg transition font-black cursor-pointer ${
                  authChoice === 'pin' ? 'bg-[#FF6B00] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                6-Digit PIN
              </button>
              <button
                type="button"
                onClick={() => { setAuthChoice('otp'); setPinError(''); setOtpError(''); }}
                className={`px-2.5 py-1 rounded-lg transition font-black cursor-pointer ${
                  authChoice === 'otp' ? 'bg-[#FF6B00] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Request OTP
              </button>
            </div>
          </div>

          {authChoice === 'pin' ? (
            <>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-800">
                  Enter your permanent 6-digit transaction PIN:
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  This permanent 6-digit PIN was created during your Sign Up. It is required to authorize all your withdrawals and payout requests.
                </p>
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  maxLength={6}
                  value={securityPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setSecurityPin(val);
                    setPinError('');
                  }}
                  placeholder="Enter 6-digit permanent PIN (e.g. 123456)"
                  className={`w-full px-4 py-3 text-base font-mono tracking-[0.25em] text-center font-black rounded-xl border-2 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 pr-11 ${
                    pinError
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/40 text-rose-950'
                      : 'border-orange-300 focus:border-[#FF6B00] focus:ring-orange-500/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition"
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-300 text-rose-700 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Permanent 6-digit PIN</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPinModalOpen(true);
                    setResetError('');
                    setResetAccountPassword('');
                    setResetNewPin('');
                  }}
                  className="text-xs font-bold text-[#FF6B00] hover:text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Reset 6-Digit PIN?</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Verification Code (OTP) via Telegram / Contact:
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tap &quot;Request OTP&quot; to receive your 6-digit confirmation code.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={otpTimer > 0 || isSendingOtp}
                  onClick={handleRequestOtp}
                  className="px-3 py-1.5 bg-[#FF6B00] hover:bg-[#e05e00] text-white rounded-xl text-xs font-black shadow-xs transition disabled:opacity-50 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingOtp ? 'Sending...' : otpTimer > 0 ? `Resend (${otpTimer}s)` : 'Request OTP'}</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={withdrawalOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                    setWithdrawalOtp(val);
                    setOtpError('');
                  }}
                  placeholder="Enter 6-digit verification code"
                  className={`w-full px-4 py-3 text-base font-mono tracking-[0.25em] text-center font-black rounded-xl border-2 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                    otpError
                      ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/40 text-rose-950'
                      : 'border-orange-300 focus:border-[#FF6B00] focus:ring-orange-500/30'
                  }`}
                />
              </div>

              {otpError && (
                <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-300 text-rose-700 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {isOtpSent && (
                <div className="flex items-center justify-between text-xs text-emerald-800 pt-0.5">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verification OTP dispatched to Telegram bot &amp; registered contact
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Valid 5 mins</span>
                </div>
              )}
            </>
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

      {/* Recent Withdrawal Requests with Clean Look: New on Top, Old at Bottom, Expired Pending (>20m) Hidden */}
      {(() => {
        if (!user) return null;
        const TWENTY_MINS_MS = 20 * 60 * 1000;
        const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');

        const isOwner = (w: typeof withdrawals[0]) => {
          if (w.userId && w.userId === user.id) return true;
          const withPhone = (w.userPhone || '').replace(/[^0-9]/g, '');
          if (cleanPhone.length >= 10 && withPhone.length >= 10 && withPhone.endsWith(cleanPhone.slice(-10))) {
            return true;
          }
          return false;
        };

        const isWithPending = (w: typeof withdrawals[0]) => w.status === 'pending' || w.status === 'processing';
        const isWithExpired = (w: typeof withdrawals[0]) => {
          if (!isWithPending(w)) return false;
          const time = new Date(w.createdAt).getTime();
          return !isNaN(time) && (Date.now() - time > TWENTY_MINS_MS);
        };

        const activeWithdrawals = withdrawals.filter((w) => isOwner(w) && !isWithExpired(w));
        if (activeWithdrawals.length === 0) return null;

        const sortedWiths = [...activeWithdrawals].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const successfulWiths = sortedWiths.filter((w) => w.status === 'completed');
        const pendingWiths = sortedWiths.filter(isWithPending);
        const cancelledWiths = sortedWiths.filter((w) => w.status === 'rejected');

        const successfulTotal = successfulWiths.reduce((sum, w) => sum + w.amount, 0);
        const pendingTotal = pendingWiths.reduce((sum, w) => sum + w.amount, 0);
        const cancelledTotal = cancelledWiths.reduce((sum, w) => sum + w.amount, 0);

        const filteredWiths = sortedWiths.filter((w) => {
          if (withdrawStatusFilter === 'successful') return w.status === 'completed';
          if (withdrawStatusFilter === 'pending') return isWithPending(w);
          if (withdrawStatusFilter === 'cancelled') return w.status === 'rejected';
          return true;
        });

        return (
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider font-outfit">
                <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Recent Withdrawal Requests • Newest First</span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Total: {activeWithdrawals.length}
              </span>
            </div>

            {/* 3 Status Summary Stat Cards */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWithdrawStatusFilter(withdrawStatusFilter === 'successful' ? 'all' : 'successful')}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  withdrawStatusFilter === 'successful'
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
                  {successfulWiths.length} Orders
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWithdrawStatusFilter(withdrawStatusFilter === 'pending' ? 'all' : 'pending')}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  withdrawStatusFilter === 'pending'
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
                  {pendingWiths.length} Orders
                </div>
              </button>

              <button
                type="button"
                onClick={() => setWithdrawStatusFilter(withdrawStatusFilter === 'cancelled' ? 'all' : 'cancelled')}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  withdrawStatusFilter === 'cancelled'
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
                  {cancelledWiths.length} Orders
                </div>
              </button>
            </div>

            {/* Status Segment Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
              <button
                onClick={() => setWithdrawStatusFilter('all')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  withdrawStatusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({activeWithdrawals.length})
              </button>
              <button
                onClick={() => setWithdrawStatusFilter('successful')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  withdrawStatusFilter === 'successful'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                ✅ Successful ({successfulWiths.length})
              </button>
              <button
                onClick={() => setWithdrawStatusFilter('pending')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  withdrawStatusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs font-black'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                ⏳ Pending ({pendingWiths.length})
              </button>
              <button
                onClick={() => setWithdrawStatusFilter('cancelled')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  withdrawStatusFilter === 'cancelled'
                    ? 'bg-rose-600 text-white shadow-xs font-black'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                ❌ Cancelled ({cancelledWiths.length})
              </button>
            </div>

            {/* Filtered Withdrawal List - Clean UI with Newest on Top */}
            {filteredWiths.length === 0 ? (
              <div className="p-5 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                No {withdrawStatusFilter !== 'all' ? withdrawStatusFilter : ''} withdrawal records found.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWiths.map((req) => (
                  <div key={req.id} className="rounded-2xl p-3.5 border border-slate-200/80 bg-white flex items-center justify-between text-xs shadow-xs hover:border-slate-300 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-800">
                          ₹{req.amount.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase border border-slate-200">
                          {req.method.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {new Date(req.createdAt).toLocaleDateString()} • {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {req.rejectionReason && (
                        <div className="text-[10px] font-bold text-rose-600">
                          Reason: {req.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <div>
                        {req.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        ) : req.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                            Pending Review
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-bold">
                        Net: ₹{req.netAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* =======================================================
          RESET SECURITY PIN MODAL
         ======================================================= */}
      {isResetPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative bg-gradient-to-b from-[#0F1E36] via-[#0A1424] to-[#060D18] text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-orange-500/40 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#FF6B00] flex items-center justify-center border border-orange-500/30">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-outfit uppercase tracking-wider text-white">
                    Reset Security PIN
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Verify account password to set a new 6-digit PIN
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPinModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetError && (
              <div className="p-3 bg-rose-950/80 rounded-2xl border-2 border-rose-500 text-rose-200 font-bold text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setResetError('');
                const account = storage.findAccount(user?.id || user?.phone || user?.email || '');
                const cleanPass = resetAccountPassword.trim();
                const cleanNewPin = resetNewPin.replace(/[^0-9]/g, '').trim();

                if (!cleanPass) {
                  setResetError('Please enter your account password.');
                  return;
                }
                if (account?.password && account.password.trim() !== cleanPass) {
                  setResetError('❌ Incorrect account password! Please verify and try again.');
                  return;
                }
                if (cleanNewPin.length !== 6) {
                  setResetError('New Security PIN must be strictly 6 numbers (0-9).');
                  return;
                }

                if (user) {
                  const updatedUser = { ...user, transactionPin: cleanNewPin };
                  updateProfile({ transactionPin: cleanNewPin });
                  if (account) {
                    storage.saveAccount({
                      ...account,
                      transactionPin: cleanNewPin,
                      user: updatedUser,
                    });
                  }
                }

                setSecurityPin(cleanNewPin);
                setPinError('');
                setIsResetPinModalOpen(false);
                setResetAccountPassword('');
                setResetNewPin('');
                addToast('success', '✅ Security PIN updated successfully! You can now withdraw.');
              }}
              className="space-y-3 pt-1"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Account Password *</span>
                </label>
                <input
                  type="password"
                  required
                  value={resetAccountPassword}
                  onChange={(e) => setResetAccountPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-indigo-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                  <span>New 6-Digit Permanent PIN *</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={resetNewPin}
                  onChange={(e) => setResetNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="Enter new 6-digit numeric PIN"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold tracking-widest text-center rounded-2xl bg-white/5 border-2 border-orange-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-orange-400"
                />
                <span className="text-[10px] text-slate-400 block text-right font-mono">
                  {resetNewPin.length}/6 Digits
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetPinModalOpen(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-black shadow-md transition"
                >
                  Save & Update PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
