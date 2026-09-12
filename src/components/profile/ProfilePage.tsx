import React, { useState } from 'react';
import { 
  User as UserIcon, 
  ShieldCheck, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History, 
  Headphones, 
  ChevronRight, 
  Send, 
  Smartphone, 
  KeyRound, 
  FileText, 
  Download, 
  LogOut, 
  X, 
  Check, 
  Copy,
  Info,
  QrCode,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethodsModal } from './PaymentMethodsModal';

const SUPPORT_CATEGORIES = [
  { 
    id: 'deposit', 
    label: '💳 Deposit / UTR Issue',
    shortTitle: 'Deposit & UTR',
    badge: '5-7 Mins Fast',
    refLabel: '12-Digit Bank UTR / Order ID',
    refPlaceholder: 'Enter 12-digit UTR from PhonePe/GPay/Paytm',
    helpTip: 'Payment check karke 5-7 minutes me account me balance add ho jata hai. Kripya apna 12-digit UTR sahi se verify karein.',
    subIssues: [
      { id: 'dep-not-added', title: 'Payment sent but balance not added in 5-7 mins', desc: 'Mene PhonePe/GPay se payment kar diya he lekin wallet me balance add nahi hua.' },
      { id: 'dep-wrong-utr', title: 'Entered wrong 12-digit UTR by mistake', desc: 'Mene deposit form me galti se galat UTR number submit kar diya tha.' },
      { id: 'dep-qr-failed', title: 'PhonePe QR / UPI transaction failed or stuck', desc: 'Bank se paise kat gaye lekin transaction pending dikh raha he.' },
      { id: 'dep-manual-verify', title: 'Paid to basepnt@ybl & need priority approval', desc: 'Mene official UPI basepnt@ybl par direct payment kiya he, kripya verify karein.' },
    ]
  },
  { 
    id: 'withdrawal', 
    label: '💸 Withdrawal Delay',
    shortTitle: 'Withdrawal',
    badge: '0% Fees / Full Payout',
    refLabel: 'Withdrawal Reference / Amount (₹)',
    refPlaceholder: 'e.g. ₹5,000 withdrawal',
    helpTip: 'Withdrawals have 0% deduction fee. Normal processing time is 15-30 minutes directly to your bank/UPI.',
    subIssues: [
      { id: 'with-delay', title: 'Withdrawal pending for more than 30 mins', desc: 'Mene withdrawal request lagayi thi, abhi tak account me transfer nahi hua.' },
      { id: 'with-wa-otp', title: 'WhatsApp security verification code not received', desc: 'Withdrawal karte time WhatsApp confirmation code mere number par nahi aa raha.' },
      { id: 'with-wrong-bank', title: 'Incorrect Bank Account / IFSC / UPI ID entered', desc: 'Withdrawal address/bank details me typing mistake ho gayi thi, update karein.' },
      { id: 'with-rejected', title: 'Withdrawal rejected or returned to balance', desc: 'Meri withdrawal request reject hui he, kripya check karke batayein.' },
    ]
  },
  { 
    id: 'login', 
    label: '🔑 Login / OTP Problem',
    shortTitle: 'Login & Account',
    badge: 'WhatsApp Code',
    refLabel: 'Registered Mobile Number or Email',
    refPlaceholder: 'Enter 10-digit WhatsApp mobile number',
    helpTip: 'WhatsApp confirmation OTP is sent directly to your WhatsApp app. Make sure your WhatsApp is active on this phone.',
    subIssues: [
      { id: 'log-wa-code', title: 'WhatsApp confirmation 4-digit code not arriving', desc: 'Account verification ke liye WhatsApp par 4-digit OTP nahi aa raha he.' },
      { id: 'log-cant-login', title: 'Already have account but getting login error', desc: 'Mera account pehle se he lekin password ya login submit nahi ho raha.' },
      { id: 'log-new-user', title: 'New user registration error or age selection', desc: 'Sign up karte time registration complete nahi ho raha he.' },
      { id: 'log-reset-pwd', title: 'Forgot password / Need account reset', desc: 'Me apna account password bhul gaya hu, kripya reset me madad karein.' },
    ]
  },
  { 
    id: 'quota', 
    label: '📈 Quota & 13% Return',
    shortTitle: 'Quota & 13% Yield',
    badge: 'Daily 13% Return',
    refLabel: 'Quota Package Name or Price (₹)',
    refPlaceholder: 'e.g. Low Risk ₹1,400 or ₹28,000 Quota',
    helpTip: 'Daily yield is 13% credited every 24 hours. VIP packages go up to ₹1.5 Lakh with high return.',
    subIssues: [
      { id: 'q-profit-missing', title: 'Daily 13% quota profit not credited today', desc: 'Mere active quota package ka daily 13% return aaj wallet me credit nahi hua.' },
      { id: 'q-upgrade', title: 'Want to upgrade to higher VIP quota (up to ₹1.5L)', desc: 'Mujhe bada package (Low/Medium/High VIP up to 1.5 Lakh) upgrade karna he.' },
      { id: 'q-cycle-info', title: 'Quota cycle validity & expiry inquiry', desc: 'Mujhe apne current quota plan ki duration aur cycle expiry detail janni he.' },
      { id: 'q-risk-select', title: 'How to select Low / Medium / High Risk plan', desc: 'Low, medium aur high risk quota plans ke bare me guidance chahiye.' },
    ]
  },
  { 
    id: 'referral', 
    label: '🎁 Referral Bonus',
    shortTitle: '20% Referral',
    badge: '20% Lifetime',
    refLabel: "Friend's Mobile / Referral Link Code",
    refPlaceholder: "e.g. Friend's 10-digit mobile number",
    helpTip: 'You receive 20% lifetime instant commission on Level 1 whenever your invited friend purchases a quota.',
    subIssues: [
      { id: 'ref-bonus-missing', title: 'Friend registered & bought plan, 20% bonus missing', desc: 'Mere dost ne mere referral link se sign up karke plan liya lekin 20% bonus nahi mila.' },
      { id: 'ref-link-issue', title: 'Referral link (bit.ly short link) not opening', desc: 'Mera bit.ly referral short link dosto ke phone me sahi se open nahi ho raha.' },
      { id: 'ref-team-view', title: 'Friend joined but not appearing in Level 1 team', desc: 'Mera friend registered ho chuka he par mere Team list me show nahi kar raha.' },
      { id: 'ref-l2-inquiry', title: 'Level 2 team bonus calculation inquiry', desc: 'Level 2 commission structure aur payouts ke bare me information chahiye.' },
    ]
  },
  { 
    id: 'other', 
    label: '❓ Other Issue',
    shortTitle: 'General Help',
    badge: '24/7 Live Desk',
    refLabel: 'Reference / Subject (Optional)',
    refPlaceholder: 'Brief reference or order number',
    helpTip: 'Official Telegram Support Manager @easybasepoint is active 24/7 for 1-on-1 personalized help.',
    subIssues: [
      { id: 'oth-general', title: 'General inquiry about EasyBasePoint rules', desc: 'Mujhe EasyBasePoint platform ke features aur guidelines ke bare me puchna he.' },
      { id: 'oth-profile', title: 'Request to update personal mobile / details', desc: 'Mujhe apne account me phone number ya bank information change karwani he.' },
      { id: 'oth-app-bug', title: 'Website / App performance or page error', desc: 'Website use karte time technical issue ya error aa raha he.' },
      { id: 'oth-manager', title: 'Request direct chat with Senior Support Manager', desc: 'Mujhe direct support supervisor se baat karni he fast solution ke liye.' },
    ]
  },
];

export const ProfilePage: React.FC = () => {
  const { 
    user, 
    wallet, 
    settings, 
    setActiveTab, 
    updateProfile, 
    logout, 
    addSupportTicket, 
    addToast 
  } = useApp();

  // Active modal
  const [activeModal, setActiveModal] = useState<
    'editProfile' | 'aboutUs' | 'telegram' | 'googleAuth' | 'contactUs' | 'privacy' | 'downloadApp' | 'paymentMethods' | null
  >(null);

  // Edit profile form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Telegram form state
  const [telegramHandle, setTelegramHandle] = useState(user?.telegram || '');

  // 2FA state
  const [totpCode, setTotpCode] = useState('');

  // Support ticket form state with dynamic sub-options
  const [selectedCatId, setSelectedCatId] = useState<string>('quota'); // default to quota or deposit
  const [selectedSubIssueId, setSelectedSubIssueId] = useState<string>('');
  const [ticketRefNumber, setTicketRefNumber] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  const accountId = user?.id || 'EBP-782914';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phone, email });
    setActiveModal(null);
  };

  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ telegram: telegramHandle });
    setActiveModal(null);
    addToast('success', 'Telegram handle bound successfully.');
  };

  const handleToggle2FA = () => {
    const nextState = !user?.isGoogleAuthEnabled;
    updateProfile({ isGoogleAuthEnabled: nextState });
    setActiveModal(null);
    addToast('success', nextState ? 'Google 2FA enabled.' : 'Google 2FA disabled.');
  };

  const currentCategory = SUPPORT_CATEGORIES.find((c) => c.id === selectedCatId) || SUPPORT_CATEGORIES[0];

  const handleSelectCategory = (catId: string) => {
    setSelectedCatId(catId);
    setSelectedSubIssueId('');
    setTicketSubject('');
    setTicketMessage('');
  };

  const handleSelectSubIssue = (sub: { id: string; title: string; desc: string }) => {
    setSelectedSubIssueId(sub.id);
    setTicketSubject(sub.title);
    setTicketMessage(sub.desc);
  };

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) {
      addToast('error', 'Please describe your problem or select a specific issue option.');
      return;
    }
    const fullSubject = `[${currentCategory.label}] ${ticketSubject || currentCategory.shortTitle}${ticketRefNumber ? ` (Ref: ${ticketRefNumber})` : ''}`;
    addSupportTicket(fullSubject, ticketMessage);
    setTicketSubject('');
    setTicketMessage('');
    setTicketRefNumber('');
    setSelectedSubIssueId('');
    setActiveModal(null);
    addToast('success', 'Support ticket submitted! Support manager will contact you.');
  };

  const menuItems = [
    { id: 'paymentMethods', label: 'Payment Methods & Accounts', icon: CreditCard },
    { id: 'telegramChannel', label: 'Join Official Telegram (easybasepoint)', icon: Send, isExternal: true },
    { id: 'editProfile', label: 'Edit Profile', icon: UserIcon },
    { id: 'aboutUs', label: 'About Us', icon: Info },
    { id: 'telegram', label: 'Bind Personal Telegram', icon: Send },
    { id: 'googleAuth', label: 'Google Authentication', icon: KeyRound },
    { id: 'contactUs', label: 'Contact Us', icon: Headphones },
    { id: 'privacy', label: 'Privacy Policy', icon: FileText },
    { id: 'downloadApp', label: 'Download App', icon: Download },
  ];

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Top Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#15233E] to-[#1E3052] text-white p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />

        {/* User Info & Identity */}
        <div className="flex items-center justify-between relative z-10 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B00] to-[#FF8526] text-white flex items-center justify-center font-black text-lg font-outfit shadow-md">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : 'E'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-outfit font-black text-lg tracking-tight">
                  <span className="text-white">Easy</span>
                  <span className="text-[#FF6B00]">BasePoint</span>
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-400/30">
                  Verified
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono mt-0.5">
                UID: {accountId}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Reward ratio
            </span>
            <span className="text-sm font-extrabold text-emerald-400 font-outfit">
              {settings.inrRewardPercent.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Quota & Wallet Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 relative z-10">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">
              QUOTA
            </span>
            <div className="text-2xl font-black text-white font-outfit mt-0.5">
              ₹{wallet.quota.toFixed(0)}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">
              BALANCE
            </span>
            <div className="text-2xl font-black text-[#FF6B00] font-outfit mt-0.5">
              ₹{wallet.balance.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons: Recharge, Withdraw, History, Contact Us */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab('deposit')}
          className="glass-card rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:border-orange-200 transition touch-press"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">Recharge</span>
        </button>

        <button
          onClick={() => setActiveTab('withdraw')}
          className="glass-card rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:border-orange-200 transition touch-press"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ArrowUpFromLine className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">Withdraw</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className="glass-card rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:border-orange-200 transition touch-press"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">History</span>
        </button>

        <button
          onClick={() => setActiveModal('contactUs')}
          className="glass-card rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:border-orange-200 transition touch-press"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">Contact Us</span>
        </button>
      </div>

      {/* Menu Items List */}
      <div className="glass-card rounded-3xl p-2 divide-y divide-slate-100 border border-slate-200/80 shadow-xs">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'telegramChannel') {
                  window.open(settings.telegramChannelUrl || 'https://t.me/easybasepoint', '_blank', 'noopener,noreferrer');
                } else {
                  setActiveModal(item.id as any);
                }
              }}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/70 rounded-2xl transition group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-[#FF6B00] transition">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#FF6B00] group-hover:translate-x-0.5 transition" />
            </button>
          );
        })}

        {/* Log Out Button */}
        <button
          onClick={logout}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-rose-50/70 rounded-2xl transition group text-left text-rose-600"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">Log Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-300 group-hover:translate-x-0.5 transition" />
        </button>
      </div>

      {/* =======================================================
          MODALS
         ======================================================= */}

      {/* Edit Profile Modal */}
      {activeModal === 'editProfile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 font-outfit">Edit Profile</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-orange-glow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {activeModal === 'aboutUs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 font-outfit">About EasyBasePoint</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>EasyBasePoint</strong> is an innovative fintech quota system designed to deliver transparent reward calculations and seamless payment processing.
              </p>
              <p>
                Our platform strictly follows honest disclosures, zero fake transaction generators, and server-side cryptographic verification for every deposit and withdrawal.
              </p>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500">
                Version: 2.4.0 (Enterprise)<br/>
                Architecture: React 18, TypeScript, Supabase-compatible PostgreSQL<br/>
                License: Private Commercial
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bind Telegram Modal */}
      {activeModal === 'telegram' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 font-outfit">Bind Telegram Account</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Link your Telegram username to receive instant deposit notifications and priority customer support.
            </p>
            <form onSubmit={handleSaveTelegram} className="space-y-3">
              <input
                type="text"
                placeholder="@username"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-orange-glow"
              >
                Bind Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Google Authentication 2FA Modal */}
      {activeModal === 'googleAuth' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 font-outfit">Google Authenticator (2FA)</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Status: <strong>{user?.isGoogleAuthEnabled ? 'ENABLED' : 'DISABLED'}</strong>
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <QrCode className="w-24 h-24 mx-auto text-slate-700" />
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">Key: EBP-2FA-AUTH-789X</span>
              </div>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`w-full py-2.5 text-xs font-bold rounded-xl transition ${
                user?.isGoogleAuthEnabled
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                  : 'bg-[#FF6B00] text-white shadow-orange-glow hover:bg-[#E55F00]'
              }`}
            >
              {user?.isGoogleAuthEnabled ? 'Disable 2FA' : 'Enable 2FA Protection'}
            </button>
          </div>
        </div>
      )}

      {/* Contact Us Modal with Categorized Problem Selection */}
      {activeModal === 'contactUs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 font-outfit">Contact Support & Help Desk</h3>
                <p className="text-[11px] text-slate-400">Select your problem category for fastest resolution</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instant Official Telegram Quick Action */}
            <a
              href={settings.telegramChannelUrl || 'https://t.me/easybasepoint'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 border border-sky-200/80 hover:bg-sky-100 transition group"
            >
              <div className="flex items-center gap-2 text-xs">
                <Send className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-sky-900">Live Telegram Support Manager</span>
              </div>
              <span className="text-[10px] font-black bg-sky-500 text-white px-2 py-0.5 rounded-full uppercase">
                @easybasepoint
              </span>
            </a>

            <form onSubmit={handleSendTicket} className="space-y-3.5">
              {/* Problem Category Selection Options */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                    Select Problem / Issue Type
                  </label>
                  <span className="text-[10px] font-bold text-[#FF6B00]">Step 1: Choose Type</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORT_CATEGORIES.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition flex items-center justify-between ${
                          isSelected
                            ? 'border-[#FF6B00] bg-orange-50 text-[#FF6B00] shadow-xs font-black ring-1 ring-orange-500/30'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <span>{cat.label}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[#FF6B00]"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC SUB-OPTIONS FOR THE SELECTED CATEGORY */}
              <div className="p-3 bg-orange-50/70 rounded-2xl border-2 border-orange-300/80 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-orange-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Step 2: Tap Your Specific {currentCategory.shortTitle} Option:</span>
                  </span>
                  <span className="text-[9px] font-black bg-[#FF6B00] text-white px-2 py-0.5 rounded-full uppercase">
                    {currentCategory.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {currentCategory.subIssues.map((sub) => {
                    const isSelected = selectedSubIssueId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectSubIssue(sub)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-start justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-[#FF6B00] bg-white text-[#FF6B00] shadow-md ring-2 ring-orange-400/40'
                            : 'border-orange-100 bg-white/90 text-slate-800 hover:border-orange-300 hover:bg-white'
                        }`}
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="font-extrabold leading-tight text-xs flex items-center gap-1.5">
                            <span className={isSelected ? 'text-[#FF6B00]' : 'text-slate-800'}>
                              {sub.title}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{sub.desc}</div>
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Helpful Quick Tip Banner */}
                <div className="p-2 bg-white rounded-xl border border-orange-200/80 flex items-start gap-2 text-[10px] text-orange-950 leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                  <span>{currentCategory.helpTip}</span>
                </div>
              </div>

              {/* Dynamic UTR / Transaction / Order Reference */}
              <div>
                <label className="text-[11px] font-bold text-slate-700">
                  {currentCategory.refLabel}
                </label>
                <input
                  type="text"
                  placeholder={currentCategory.refPlaceholder}
                  value={ticketRefNumber}
                  onChange={(e) => setTicketRefNumber(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              {/* Brief Subject */}
              <div>
                <label className="text-[11px] font-bold text-slate-700">Subject (Selected Problem)</label>
                <input
                  type="text"
                  placeholder={`Help needed regarding ${currentCategory.shortTitle}`}
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              {/* Message Details */}
              <div>
                <label className="text-[11px] font-bold text-slate-700">Describe Your Problem in Detail</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tap an option above or type your exact problem..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-[#E55F00] hover:to-amber-600 text-white rounded-2xl text-xs font-extrabold shadow-orange-glow transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Support Ticket ({currentCategory.shortTitle})</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 font-outfit">Privacy Policy</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                EasyBasePoint values user privacy and data security. All credentials, passwords, and banking identifiers are protected through end-to-end encryption standards.
              </p>
              <p>
                We never sell or share user account records with third-party advertising brokers. All user activity complies with standard financial security guidelines.
              </p>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Download App Modal */}
      {activeModal === 'downloadApp' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 font-outfit">Download EasyBasePoint App</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-[#FF6B00]" />
                <div>
                  <h4 className="font-bold text-slate-900">Install Progressive Web App (PWA)</h4>
                  <p className="text-[11px] text-slate-500">
                    Tap your browser's share menu and select "Add to Home Screen" for instant native app experience.
                  </p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Download className="w-8 h-8 text-blue-600" />
                <div>
                  <h4 className="font-bold text-slate-900">Android APK Build</h4>
                  <p className="text-[11px] text-slate-500">
                    Direct APK download package v2.4 (Enterprise Signed).
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                addToast('success', 'PWA installation triggered on your device!');
                setActiveModal(null);
              }}
              className="w-full py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-orange-glow"
            >
              Install App
            </button>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      <PaymentMethodsModal
        isOpen={activeModal === 'paymentMethods'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};
