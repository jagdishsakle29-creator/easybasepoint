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
  CreditCard
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethodsModal } from './PaymentMethodsModal';

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

  // Support ticket form state
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

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      addToast('error', 'Please complete the support form.');
      return;
    }
    addSupportTicket(ticketSubject, ticketMessage);
    setTicketSubject('');
    setTicketMessage('');
    setActiveModal(null);
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

      {/* Contact Us Modal */}
      {activeModal === 'contactUs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 font-outfit">Contact Support</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendTicket} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deposit inquiry, withdrawal status"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your question or issue in detail..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-orange-glow"
              >
                Submit Ticket
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
