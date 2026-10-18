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
  Calendar,
  AlertCircle,
  Send,
  Loader2,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { otpService } from '../../services/otpService';

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
  const { login, register, resetPasswordWithPin, logout, addToast, user } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Form states
  const [loginCredential, setLoginCredential] = useState(''); // Email or Phone
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState(''); // Empty by default to force explicit selection
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form error display state
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lifetime 6-Digit Security PIN States
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // Password Recovery States
  const [forgotPin, setForgotPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Prefill referral code if URL has ?ref=... or from stored invite
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('invite') || params.get('code') || localStorage.getItem('ebp_pending_ref') || sessionStorage.getItem('ebp_pending_ref');
      if (ref) {
        setReferralCode(ref.trim().toUpperCase());
      }
      // Never override explicit login intent with register
      if (initialMode === 'login') {
        setMode('login');
      } else if (initialMode === 'register') {
        setMode('register');
      } else if (ref && !user) {
        setMode('register');
      } else {
        setMode('login');
      }
    } catch {}
  }, [isOpen, initialMode, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (mode === 'login') {
      const targetCred = loginCredential.trim();
      if (!targetCred) {
        setFormError('Please enter your registered mobile number or email.');
        addToast('error', 'Please enter your registered mobile number or email.');
        return;
      }
      if (!password) {
        setFormError('Please enter your account password or 6-digit PIN.');
        addToast('error', 'Please enter your password or PIN.');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await login(targetCred, password);
        if (res.success) {
          setFormError('');
          onClose();
        } else if (res.notFound) {
          setFormError('❌ Account not found! This mobile number or email is not registered. Please tap "Sign Up" below to register.');
        } else if (res.wrongPassword) {
          setFormError('❌ Incorrect password or Security PIN! You can enter your account password OR your 6-digit PIN. If you forgot your password, tap "Reset with PIN" below.');
        } else {
          setFormError(res.message || 'Login failed. Please verify your credentials.');
        }
      } catch {
        setFormError('Server connection error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (mode === 'register') {
      if (!age || Number(age) < 18) {
        setFormError('⚠️ Age selection is mandatory! You must select your age and be 18+ to register.');
        addToast('error', '⚠️ Age selection is mandatory! You must select your age and be 18+ to register.');
        return;
      }
      if (!name.trim()) {
        setFormError('Please enter your full name.');
        addToast('error', 'Please enter your full name.');
        return;
      }
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.endsWith('@gmail.com') || cleanEmail.length <= 10) {
        setFormError('Email address must end with @gmail.com (e.g. yourname@gmail.com).');
        addToast('error', 'Email address must end with @gmail.com (e.g. yourname@gmail.com).');
        return;
      }
      const cleanDigits = phone.replace(/[^0-9]/g, '');
      if (cleanDigits.length !== 10) {
        setFormError('Mobile number must be exactly 10 digits.');
        addToast('error', 'Mobile number must be exactly 10 digits.');
        return;
      }
      const cleanPin = pinCode.replace(/[^0-9]/g, '').trim();
      if (!cleanPin || cleanPin.length !== 6) {
        setPinError('Please enter your 6-digit lifetime security PIN.');
        setFormError('Please enter a 6-digit permanent security PIN (strictly 6 numbers).');
        addToast('error', '6-digit permanent security PIN is required.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Passwords do not match. Please re-enter your password.');
        addToast('error', 'Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        addToast('error', 'Password must be at least 6 characters long.');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await register(name.trim(), cleanEmail, cleanDigits, password, referralCode, cleanPin);
        if (res.success) {
          try {
            localStorage.removeItem('ebp_pending_ref');
            sessionStorage.removeItem('ebp_pending_ref');
          } catch {}
          setFormError('');
          onClose();
        } else if (res.alreadyExists) {
          // Attempt auto-login if they entered their correct password or 6-digit PIN
          let autoRes = await login(cleanDigits, password);
          if (!autoRes.success && cleanPin.length === 6) {
            autoRes = await login(cleanDigits, cleanPin);
          }
          if (autoRes.success) {
            addToast('success', '✓ Welcome back! Logged in successfully.');
            setFormError('');
            onClose();
          } else {
            setMode('login');
            setLoginCredential(cleanDigits);
            setPassword('');
            setFormError('⚠️ Yeh account pehle se bana hua hai! Kripya apna Password ya 6-digit Security PIN daal kar Sign In karein.');
            addToast('info', 'Account already exists. Please Sign In with your password or PIN.');
          }
        } else {
          setFormError(res.message || 'Registration failed.');
        }
      } catch {
        setFormError('Server connection error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (mode === 'forgot') {
      const targetCred = loginCredential.trim();
      if (!targetCred) {
        setFormError('Please enter your registered mobile number or email.');
        addToast('error', 'Please enter your registered mobile number or email.');
        return;
      }
      const cleanForgotPin = forgotPin.replace(/[^0-9]/g, '').trim();
      if (cleanForgotPin.length !== 6) {
        setFormError('Please enter your permanent 6-digit Security PIN.');
        addToast('error', '6-digit Security PIN is required.');
        return;
      }
      if (newPassword.length < 6) {
        setFormError('New password must be at least 6 characters long.');
        addToast('error', 'New password must be at least 6 characters.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setFormError('Passwords do not match. Please re-enter your new password.');
        addToast('error', 'Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await resetPasswordWithPin(targetCred, cleanForgotPin, newPassword);
        if (res.success) {
          setFormError('');
          onClose();
        } else {
          setFormError(res.message || 'Password reset failed. Please check your credentials.');
        }
      } catch {
        setFormError('Server connection error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative bg-gradient-to-b from-[#0F1E36] via-[#0A1424] to-[#060D18] text-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(255,107,0,0.25)] border-2 border-orange-500/30 space-y-4 max-h-[94vh] overflow-y-auto">
        {/* Top vibrant glowing accent gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-rose-500 rounded-t-3xl" />

        {/* Header with Colorful Brand Logo & ALWAYS VISIBLE Cross (X) Button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 p-0.5 shadow-lg shadow-orange-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-[14px] bg-[#0B1528] flex items-center justify-center font-black text-[#FF6B00] text-lg">
                E
              </div>
            </div>
            <div>
              <div className="font-outfit font-black text-xl tracking-tight leading-none flex items-center gap-1.5">
                <span className="text-white">Easy</span>
                <span className="bg-gradient-to-r from-[#FF6B00] via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                  BasePoint
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Official Secure Authentication
              </p>
            </div>
          </div>

          {/* Close button only if already logged in and not forced */}
          {!isForced && user && (
            <button 
              type="button"
              onClick={onClose} 
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/15 cursor-pointer shadow-md"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Colorful Bonus Callout Banner */}
        <div className="p-3.5 bg-gradient-to-r from-orange-500/20 via-amber-500/25 to-rose-500/20 rounded-2xl border-2 border-orange-400/40 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4 text-yellow-200" />
            </div>
            <div>
              <div className="font-black text-xs text-amber-200 tracking-wide uppercase">New User Special Offer</div>
              <div className="text-[11px] font-bold text-slate-200">🎁 Get Free ₹50 Real Cash on Sign Up!</div>
            </div>
          </div>
          <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-md shadow-orange-500/40 uppercase tracking-wider animate-pulse">
            FREE ₹50
          </span>
        </div>

        {/* Error Alert Display */}
        {formError && (
          <div className="p-3 bg-rose-950/80 rounded-2xl border-2 border-rose-500 text-rose-200 font-bold text-xs flex flex-col gap-2.5 shadow-lg animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{formError}</span>
            </div>
            {mode === 'login' && formError.includes('Account not found') && (
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  const digits = loginCredential.replace(/[^0-9]/g, '');
                  if (digits.length >= 10) {
                    setPhone(digits.slice(-10));
                  } else if (loginCredential.includes('@')) {
                    setEmail(loginCredential.trim().toLowerCase());
                  }
                  setFormError('');
                }}
                className="w-full py-2 bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white font-extrabold rounded-xl text-xs hover:opacity-95 transition active:scale-98 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>⚡ Tap Here to Sign Up Now</span>
                <span>→</span>
              </button>
            )}
            {mode === 'login' && (formError.includes('Incorrect password') || formError.includes('Galat password')) && (
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setFormError('');
                }}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-xl text-xs hover:opacity-95 transition active:scale-98 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🔑 Forgot Password? Reset in 5 seconds with 6-Digit PIN</span>
                <span>→</span>
              </button>
            )}
            {mode === 'register' && formError.includes('pehle se') && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  const digits = phone.replace(/[^0-9]/g, '');
                  if (digits.length >= 10) setLoginCredential(digits.slice(-10));
                  else if (email) setLoginCredential(email.trim().toLowerCase());
                  setPassword('');
                  setFormError('');
                }}
                className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold rounded-xl text-xs hover:opacity-95 transition active:scale-98 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>⚡ Click here to Sign In with Password / PIN</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}

        {/* Currently logged-in status banner */}
        {user && (
          <div className="p-3 bg-blue-950/70 rounded-2xl border border-blue-500/40 flex items-center justify-between text-xs">
            <div className="text-slate-300">
              <span className="text-[10px] uppercase font-bold text-blue-400 block">Logged In Account:</span>
              <span className="font-bold text-white">{user.name} ({user.phone || user.email})</span>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                addToast('info', 'Logged out. You can now register or sign into another account.');
              }}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Log Out
            </button>
          </div>
        )}

        {/* Mode Selector Tabs */}
        {mode !== 'forgot' ? (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-black">
            <button
              type="button"
              onClick={() => { setMode('login'); setFormError(''); }}
              className={`py-2 rounded-xl transition ${
                mode === 'login' ? 'bg-[#FF6B00] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setFormError(''); }}
              className={`py-2 rounded-xl transition ${
                mode === 'register' ? 'bg-[#FF6B00] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up (+₹50 Bonus)
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold">
            <span className="text-amber-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Password Recovery</span>
            </span>
            <button
              type="button"
              onClick={() => { setMode('login'); setFormError(''); }}
              className="text-slate-300 hover:text-white underline text-[11px]"
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* ========================================================
              SIGN IN MODE
             ======================================================== */}
          {mode === 'login' && (
            <>
              {/* Email or Phone Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Email or Mobile Number</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginCredential}
                    onChange={(e) => setLoginCredential(e.target.value)}
                    placeholder="Enter email or 10-digit mobile"
                    className="w-full pl-3.5 pr-3 py-3 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-indigo-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>
              </div>

              {/* Password or Security PIN */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Password or 6-Digit Security PIN</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setFormError(''); }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter account password or 6-digit PIN"
                    className="w-full pl-3.5 pr-10 py-3 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-indigo-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  💡 Tip: You can log in using either your account password OR your 6-digit Security PIN.
                </p>
              </div>
            </>
          )}

          {/* ========================================================
              REGISTER MODE
             ======================================================== */}
          {mode === 'register' && (
            <>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-orange-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-orange-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-400" />
                    <span>Email Address (@gmail.com)</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">Strictly @gmail.com</span>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-orange-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>

              {/* Mobile Phone Number */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mobile Number (10 Digits) *</span>
                  </label>
                  <span className="text-[10px] text-emerald-300 font-extrabold bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    10 Digits Primary Mobile
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="Strictly 10-digit mobile number"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-2xl bg-white/5 border-2 border-emerald-500/40 text-emerald-300 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              {/* MANDATORY Age Requirement Field (Dropdown Selection Required) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Age (Mandatory 18+) *</span>
                  </label>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-2 py-0.5 rounded-md border border-amber-500/30">
                    Strictly 18+ Only
                  </span>
                </div>
                <select
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-2xl bg-[#0e1b2f] border-2 border-amber-500/40 text-amber-200 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
                >
                  <option value="" disabled className="text-slate-400 bg-slate-900">
                    -- Select Your Age (Mandatory) --
                  </option>
                  {Array.from({ length: 48 }, (_, i) => i + 18).map((a) => (
                    <option key={a} value={a} className="text-white bg-slate-900 font-bold">
                      {a} Years Old
                    </option>
                  ))}
                  <option value="66" className="text-white bg-slate-900 font-bold">65+ Years</option>
                </select>
              </div>

              {/* Lifetime Permanent 6-Digit Security PIN Card */}
              <div className="p-4 bg-gradient-to-b from-orange-950/50 to-[#0c1626] rounded-2xl border-2 border-orange-500/50 space-y-3 shadow-xl">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-black text-orange-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
                    <span>Permanent 6-Digit Security PIN *</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40">
                    Lifetime Security PIN
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-200">
                    Enter your lifetime 6-digit transaction PIN:
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This permanent 6-digit PIN will stay with your account forever. It is required to authorize all your withdrawals and payout requests.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setPinCode(val);
                      setPinError('');
                    }}
                    placeholder="Enter 6-digit permanent PIN (e.g. 123456)"
                    className={`w-full px-4 py-3 text-base font-mono tracking-[0.25em] text-center font-black rounded-xl border-2 bg-black/60 text-orange-300 placeholder-slate-500 focus:outline-none focus:ring-2 pr-11 ${
                      pinError
                        ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-500/40 text-rose-300'
                        : 'border-orange-500/50 focus:border-[#FF6B00] focus:ring-orange-500/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-400 p-1 cursor-pointer transition"
                    title={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {pinError && (
                  <div className="p-2.5 bg-rose-950/80 rounded-xl border border-rose-500 text-rose-200 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="text-[11px] text-emerald-300/90 flex items-center gap-1.5 pt-0.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Remember this 6-digit PIN. It will never expire and is required for cashouts.</span>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Create Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-orange-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Confirm Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-orange-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>

              {/* Referral Code (Optional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Referral / Invite Code (Optional)
                  </label>
                  {referralCode && (
                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      ✓ Bonus Active
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="EBP-98241"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase font-bold rounded-2xl bg-white/5 border-2 border-orange-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition"
                />
                {referralCode && (
                  <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <span>🎁 Extra ₹50 signup bonus unlocked via referral link!</span>
                  </p>
                )}
              </div>
            </>
          )}

          {/* ========================================================
              FORGOT / RESET PASSWORD MODE
             ======================================================== */}
          {mode === 'forgot' && (
            <div className="space-y-3 pt-1">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Instant Password Reset with 6-Digit PIN</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Enter your registered mobile or email and your permanent 6-digit Security PIN to set a new password and log in instantly.
                </p>
              </div>

              {/* Email or Phone Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Registered Mobile or Email *</span>
                </label>
                <input
                  type="text"
                  required
                  value={loginCredential}
                  onChange={(e) => setLoginCredential(e.target.value)}
                  placeholder="Enter registered mobile or email"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-amber-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition"
                />
              </div>

              {/* 6-Digit Lifetime Security PIN */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>6-Digit Security PIN *</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-bold">Strictly 6 Numbers</span>
                </div>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    value={forgotPin}
                    onChange={(e) => setForgotPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="Enter your 6-digit PIN"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono font-bold tracking-widest rounded-2xl bg-white/5 border-2 border-amber-500/30 text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>New Password (Min 6 chars) *</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-indigo-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Confirm New Password *</span>
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-indigo-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>

              {/* WhatsApp Support fallback if PIN also forgotten */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>Forgot your PIN too?</span>
                <a
                  href="https://t.me/easybasepoint"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline font-bold flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Telegram Support</span>
                </a>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-98 flex items-center justify-center gap-2 mt-3 cursor-pointer ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            } ${
              mode === 'login'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 shadow-indigo-600/30 border border-indigo-400/40'
                : mode === 'register'
                ? 'bg-gradient-to-r from-[#FF6B00] via-orange-500 to-amber-500 hover:from-[#FF7A1A] hover:to-amber-400 shadow-orange-500/40 border border-amber-300/40'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/30 border border-amber-300/40'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>
                  {mode === 'login'
                    ? '🔍 Verifying Account...'
                    : mode === 'register'
                    ? '⚡ Setting up Account...'
                    : '🔄 Updating Password...'}
                </span>
              </div>
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? '⚡ Sign In & Enter EasyBasePoint'
                    : mode === 'register'
                    ? '🎁 Complete Registration (+₹50 Bonus)'
                    : '✓ Reset Password & Sign In'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setMode('login'); setFormError(''); }}
              className="text-xs text-amber-400 font-bold hover:underline"
            >
              ← Back to Sign In Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
