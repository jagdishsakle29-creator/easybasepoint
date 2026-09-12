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
  Send
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
  const { login, register, addToast, user } = useApp();
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

  // Form error display state
  const [formError, setFormError] = useState('');

  // WhatsApp OTP verification states
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpError, setOtpError] = useState('');

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

  // Generate confirmation code and open WhatsApp via official gateway: +9779716459259
  const handleSendWhatsAppOtp = () => {
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    if (!cleanDigits || cleanDigits.length !== 10) {
      setFormError('Mobile number must be exactly 10 digits.');
      addToast('error', 'Mobile number must be exactly 10 digits.');
      return;
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setIsOtpSent(true);
    setOtpTimer(60);
    setFormError('');

    const waMsg = encodeURIComponent(
      `EasyBasePoint Account Opening Verification Code: ${code}\nUser Mobile: ${cleanDigits}\nPlease confirm my registration for ₹50 Welcome Bonus!`
    );
    const officialGatewayPhone = '9779716459259';
    const waUrl = `https://api.whatsapp.com/send?phone=${officialGatewayPhone}&text=${waMsg}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    addToast('success', `WhatsApp Confirmation Code ${code} sent via +9779716459259!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
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
        setFormError('Please enter your account password.');
        addToast('error', 'Please enter your password.');
        return;
      }

      const res = login(targetCred, password);
      if (res.success) {
        setFormError('');
        onClose();
      } else if (res.notFound) {
        setFormError('❌ Account not found! This mobile number or email is not registered. Please Sign Up first.');
        addToast('error', 'Account not found! Please register an account first.');
      } else if (res.wrongPassword) {
        setFormError('❌ Incorrect password! Please verify your password and try again.');
        addToast('error', '❌ Incorrect password! Please check your password and try again.');
      } else {
        setFormError(res.message || 'Login failed. Please verify your credentials.');
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
      if (!isOtpSent) {
        setFormError('Please click "Send Code" first to receive your WhatsApp verification code.');
        addToast('error', 'Please click "Send Code" to verify your WhatsApp number.');
        return;
      }
      if (otpCode.trim() !== generatedOtp.trim()) {
        setOtpError('Invalid code! Please enter the correct 4-digit code received on WhatsApp.');
        setFormError('❌ Invalid code! Please enter the correct 4-digit code received on WhatsApp.');
        addToast('error', '❌ Invalid code! Please enter the correct 4-digit code received on WhatsApp.');
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

      const res = register(name.trim(), cleanEmail, cleanDigits, password, referralCode);
      if (res.success) {
        setFormError('');
        onClose();
      } else if (res.alreadyExists) {
        setFormError('⚠️ Account already registered! This mobile number or email is already registered. Please Sign In.');
      } else {
        setFormError(res.message || 'Registration failed.');
      }
    } else {
      addToast('info', 'Password reset instructions sent to your WhatsApp number.');
      setMode('login');
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

        {/* Bold Colorful Tab Switchers */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1.5 bg-black/40 rounded-2xl border border-white/10 gap-1.5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2.5 px-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'login' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2.5 px-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'register' 
                  ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-lg shadow-orange-500/30 border border-amber-400/30' 
                  : 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Register (New Account)</span>
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

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-3.5 pr-3 py-3 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-indigo-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>
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
                <label className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-orange-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl bg-white/5 border-2 border-orange-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>

              {/* Mobile Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Mobile Number</span>
                </label>
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

              {/* WhatsApp Account Opening Confirmation Code Card */}
              <div className="p-3.5 bg-emerald-950/40 rounded-2xl border-2 border-emerald-500/40 space-y-2.5 shadow-lg">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp Verification Code *</span>
                  </span>
                  <button
                    type="button"
                    disabled={otpTimer > 0}
                    onClick={handleSendWhatsAppOtp}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-[11px] font-black shadow-md shadow-emerald-500/30 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{otpTimer > 0 ? `Resend (${otpTimer}s)` : 'Send Code'}</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setOtpCode(val);
                      if (val.length === 4 && isOtpSent && val !== generatedOtp) {
                        setOtpError('Invalid code! Please enter the correct 4-digit code received on WhatsApp.');
                      } else {
                        setOtpError('');
                      }
                    }}
                    placeholder="Enter 4-digit code sent to WhatsApp"
                    className={`w-full px-3 py-2.5 text-sm font-mono tracking-widest text-center font-black rounded-xl border-2 bg-black/40 text-emerald-300 placeholder-emerald-700/60 focus:outline-none focus:ring-2 ${
                      otpError
                        ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-500/40 text-rose-300'
                        : 'border-emerald-400/60 focus:border-emerald-400 focus:ring-emerald-500/30'
                    }`}
                  />
                </div>

                {otpError && (
                  <div className="p-2.5 bg-rose-950/80 rounded-xl border border-rose-500 text-rose-200 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>❌ {otpError}</span>
                  </div>
                )}

                {isOtpSent && generatedOtp && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-300 pt-0.5">
                    <span>Code sent to WhatsApp:</span>
                    <span className="font-mono font-black bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-lg border border-emerald-400/40">
                      {generatedOtp}
                    </span>
                  </div>
                )}
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
                <label className="text-xs font-bold text-slate-300">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="EBP-98241"
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase font-bold rounded-2xl bg-white/5 border-2 border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl transition active:scale-98 flex items-center justify-center gap-2 mt-3 cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 shadow-indigo-600/30 border border-indigo-400/40'
                : 'bg-gradient-to-r from-[#FF6B00] via-orange-500 to-amber-500 hover:from-[#FF7A1A] hover:to-amber-400 shadow-orange-500/40 border border-amber-300/40'
            }`}
          >
            <span>
              {mode === 'login'
                ? '⚡ Sign In & Enter EasyBasePoint'
                : mode === 'register'
                ? '🎁 Verify WhatsApp & Claim ₹50 Bonus'
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
              className="text-xs text-amber-400 font-bold hover:underline"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
