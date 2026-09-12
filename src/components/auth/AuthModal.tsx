import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  Phone, 
  User, 
  KeyRound, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  isForced?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login',
  isForced = false 
}) => {
  const { login, register, addToast } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [age, setAge] = useState('22');
  const [password, setPassword] = useState('demo1234');
  const [confirmPassword, setConfirmPassword] = useState('demo1234');
  const [referralCode, setReferralCode] = useState('');

  // WhatsApp OTP verification states
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Prefill referral code if URL has ?ref=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      setMode('register');
    }
  }, []);

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

  if (!isOpen) return null;

  const handleSendWhatsAppOtp = () => {
    if (!phone || phone.length < 10) {
      addToast('error', 'Please enter a valid WhatsApp mobile number first.');
      return;
    }
    setIsOtpSent(true);
    setOtpTimer(60);
    const simulatedOtp = '8492';
    setOtpCode(simulatedOtp);
    addToast('success', `WhatsApp verification code ${simulatedOtp} sent to ${phone}!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (Number(age) < 18) {
      addToast('error', 'You must be at least 18 years of age to register.');
      return;
    }

    if (mode === 'login') {
      const ok = login(phone, password);
      if (ok) onClose();
    } else if (mode === 'register') {
      if (password !== confirmPassword) {
        addToast('error', 'Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        addToast('error', 'Password must be at least 6 characters.');
        return;
      }
      const ok = register(name || 'EasyBase Member', `${phone.replace(/\s+/g, '')}@easybase.in`, phone, password, referralCode);
      if (ok) onClose();
    } else {
      addToast('info', 'Password reset instructions sent to your WhatsApp number.');
      setMode('login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0B1528] flex items-center justify-center text-white shadow-md">
              <div className="w-5 h-5 rounded-md bg-[#FF6B00] flex items-center justify-center text-xs font-black">
                E
              </div>
            </div>
            <div className="font-outfit font-black text-lg tracking-tight">
              <span className="text-[#0B1528]">Easy</span>
              <span className="text-[#FF6B00]">BasePoint</span>
            </div>
          </div>

          {!isForced && (
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Real Amount & Trust Guarantee Badge */}
        <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>100% Real Amount • No Fraudulent Claims</span>
          </div>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
            13% Yield
          </span>
        </div>

        {/* Tab switchers: Login / Register */}
        {mode !== 'forgot' && (
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Sign In (Mobile & Age)
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Register (WhatsApp OTP)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Full Name</label>
              <div className="relative mt-1">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          )}

          {/* Mobile Phone Number */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500">Mobile Phone Number</label>
            <div className="relative mt-1">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          {/* Age Requirement Field */}
          <div>
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-slate-500">Age</label>
              <span className="text-[10px] text-emerald-600 font-bold">18+ Eligible</span>
            </div>
            <div className="relative mt-1">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={18}
                max={99}
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Must be 18 or older"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          {/* WhatsApp OTP Verification (On Register) */}
          {mode === 'register' && (
            <div>
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-500">
                  WhatsApp Verification Code
                </label>
                <button
                  type="button"
                  disabled={otpTimer > 0}
                  onClick={handleSendWhatsAppOtp}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{otpTimer > 0 ? `Resend (${otpTimer}s)` : 'Send to WhatsApp'}</span>
                </button>
              </div>
              <div className="relative mt-1">
                <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 4-digit WhatsApp OTP"
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          )}

          {/* Password */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-500">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-[#FF6B00] hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Confirm Password</label>
              <div className="relative mt-1">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-500">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="EBP-98241"
                className="w-full mt-1 px-3 py-2.5 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-extrabold text-xs rounded-2xl shadow-orange-glow transition active:scale-98 flex items-center justify-center gap-2 pt-3"
          >
            <span>
              {mode === 'login'
                ? 'Sign In & Enter Dashboard'
                : mode === 'register'
                ? 'Verify & Complete Registration'
                : 'Send WhatsApp Reset Link'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs text-[#FF6B00] font-bold hover:underline"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
