import React, { useState } from 'react';
import { 
  Lock, 
  LayoutDashboard, 
  Package, 
  ArrowUpFromLine, 
  Users, 
  Settings as SettingsIcon, 
  ScrollText, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Edit, 
  ShieldAlert, 
  RotateCcw,
  DollarSign,
  CreditCard,
  Building2,
  Smartphone,
  Coins,
  Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { QuotaPackage, QuotaLevel } from '../../types';
import { telegramService } from '../../services/telegram';

export const AdminPanel: React.FC = () => {
  const { 
    packages, 
    withdrawals, 
    settings, 
    auditLogs, 
    user, 
    approveWithdrawal, 
    rejectWithdrawal, 
    addQuotaPackage, 
    updateQuotaPackage, 
    deleteQuotaPackage, 
    updateSettings, 
    toggleUserStatus, 
    resetAllData,
    setActiveTab,
    addToast
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    'overview' | 'packages' | 'withdrawals' | 'gateways' | 'users' | 'settings' | 'logs'
  >('overview');

  // Package Form State
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [pkgPrice, setPkgPrice] = useState(1000);
  const [pkgIncomePercent, setPkgIncomePercent] = useState(7);
  const [pkgLevel, setPkgLevel] = useState<QuotaLevel>('MIDDLE');

  // Rejection reason prompt state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Settings form state
  const [usdtRate, setUsdtRate] = useState(settings.usdtRate);
  const [normalPrice, setNormalPrice] = useState(settings.normalUsdtPrice);
  const [inrReward, setInrReward] = useState(settings.inrRewardPercent);
  const [feePercent, setFeePercent] = useState(settings.withdrawalFeePercent);
  const [minWithdraw, setMinWithdraw] = useState(settings.minWithdrawal);

  // Gateway form state
  const [adminUpiId, setAdminUpiId] = useState(settings.adminUpiId || 'easybasepoint@okhdfcbank');
  const [adminUpiName, setAdminUpiName] = useState(settings.adminUpiName || 'EasyBasePoint Enterprise');
  const [adminBankName, setAdminBankName] = useState(settings.adminBankName || 'HDFC Bank Ltd');
  const [adminBankAccount, setAdminBankAccount] = useState(settings.adminBankAccount || '50200088991234');
  const [adminBankIfsc, setAdminBankIfsc] = useState(settings.adminBankIfsc || 'HDFC0001234');
  const [adminBankHolder, setAdminBankHolder] = useState(settings.adminBankHolder || 'EasyBasePoint Global Pvt Ltd');
  const [adminUsdtTrc20, setAdminUsdtTrc20] = useState(settings.adminUsdtTrc20 || 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE');
  const [adminUsdtBep20, setAdminUsdtBep20] = useState(settings.adminUsdtBep20 || '0x71C836eB399C8c0F82f0E0f4Ec7aAc89F17Ac9E5');
  const [telegramBotToken, setTelegramBotToken] = useState(settings.telegramBotToken || '');
  const [adminTelegramChatId, setAdminTelegramChatId] = useState(settings.adminTelegramChatId || '');
  const [telegramChannelUrl, setTelegramChannelUrl] = useState(settings.telegramChannelUrl || 'https://t.me/easybasepoint');
  const [isTestingTg, setIsTestingTg] = useState(false);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');

  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    const income = (pkgPrice * pkgIncomePercent) / 100;
    const quota = pkgPrice + income;

    const riskLevel = pkgLevel === 'HIGH' ? 'HIGH RISK' : pkgLevel === 'MIDDLE' ? 'MEDIUM RISK' : 'LOW RISK';

    if (editingPkgId) {
      updateQuotaPackage(editingPkgId, {
        price: pkgPrice,
        income,
        incomePercent: pkgIncomePercent,
        quota,
        level: pkgLevel,
        riskLevel,
      });
    } else {
      addQuotaPackage({
        price: pkgPrice,
        income,
        incomePercent: pkgIncomePercent,
        quota,
        level: pkgLevel,
        riskLevel,
        isActive: true,
        sortOrder: packages.length + 1,
      });
    }

    setIsPkgModalOpen(false);
    setEditingPkgId(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      usdtRate,
      normalUsdtPrice: normalPrice,
      inrRewardPercent: inrReward,
      withdrawalFeePercent: feePercent,
      minWithdrawal: minWithdraw,
    });
  };

  const handleSaveGateways = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      adminUpiId,
      adminUpiName,
      adminBankName,
      adminBankAccount,
      adminBankIfsc,
      adminBankHolder,
      adminUsdtTrc20,
      adminUsdtBep20,
      telegramBotToken,
      adminTelegramChatId,
      telegramChannelUrl,
    });
    addToast('success', 'Platform payment gateways & Telegram config updated!');
  };

  const handleTestTelegram = async () => {
    if (!telegramBotToken || !adminTelegramChatId) {
      addToast('error', 'Please enter Telegram Bot Token and Admin Chat ID first');
      return;
    }
    setIsTestingTg(true);
    try {
      const ok = await telegramService.testConnection(telegramBotToken, adminTelegramChatId);
      if (ok) {
        addToast('success', 'Telegram Bot test message sent successfully to your Telegram!');
      } else {
        addToast('error', 'Failed to send Telegram test message. Check token and Chat ID.');
      }
    } catch {
      addToast('error', 'Error connecting to Telegram Bot API');
    } finally {
      setIsTestingTg(false);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingId) return;
    rejectWithdrawal(rejectingId, rejectReason || 'Incomplete banking information');
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Admin Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0B1528] font-outfit">Admin Panel</h1>
            <p className="text-[11px] text-slate-400">Restricted Operations & Governance</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('home')}
          className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
        >
          Exit to App
        </button>
      </div>

      {/* Admin Navigation Pills */}
      <div className="flex items-center gap-1.5 bg-[#0B1528] p-1.5 rounded-2xl overflow-x-auto no-scrollbar border border-orange-500/20 shadow-md">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'packages', label: 'Packages', icon: Package },
          { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine, badge: pendingWithdrawals.length },
          { id: 'gateways', label: 'Payment Gateways', icon: CreditCard },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'settings', label: 'Settings', icon: SettingsIcon },
          { id: 'logs', label: 'Audit Logs', icon: ScrollText },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeAdminTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveAdminTab(item.id as any)}
              className={`flex items-center gap-1.5 py-2 px-3.5 text-xs font-black font-outfit rounded-xl transition-all duration-300 flex-shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF6B00] to-amber-500 text-white shadow-[0_2px_12px_rgba(255,107,0,0.45)] scale-[1.03]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-sans shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =======================================================
          TAB 1: OVERVIEW
         ======================================================= */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Packages</span>
              <div className="text-2xl font-black text-slate-900 font-outfit mt-1">
                {packages.filter((p) => p.isActive).length}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Withdrawals</span>
              <div className="text-2xl font-black text-[#FF6B00] font-outfit mt-1">
                {pendingWithdrawals.length}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">USDT Display Rate</span>
              <div className="text-2xl font-black text-blue-600 font-outfit mt-1">
                ₹{settings.usdtRate.toFixed(2)}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Environment</span>
              <div className="text-lg font-black text-emerald-600 font-outfit mt-1">
                {settings.isDemoMode ? 'Demo Sandbox' : 'Live Mode'}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="glass-card rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quick Management Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setEditingPkgId(null);
                  setIsPkgModalOpen(true);
                }}
                className="p-3 bg-orange-50 hover:bg-orange-100 text-[#FF6B00] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Quota Package</span>
              </button>

              <button
                onClick={() => setActiveAdminTab('withdrawals')}
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                <span>Review Withdrawals ({pendingWithdrawals.length})</span>
              </button>

              <button
                onClick={resetAllData}
                className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Demo Storage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 2: PACKAGES MANAGER
         ======================================================= */}
      {activeAdminTab === 'packages' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Configured Quota Packages ({packages.length})
            </h3>
            <button
              onClick={() => {
                setEditingPkgId(null);
                setPkgPrice(1000);
                setPkgIncomePercent(7);
                setPkgLevel('MIDDLE');
                setIsPkgModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-orange-glow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Package</span>
            </button>
          </div>

          <div className="space-y-2">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="glass-card rounded-2xl p-4 flex items-center justify-between border border-slate-200/80"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-slate-900 font-outfit">
                      ₹{pkg.price.toFixed(2)} INR
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {pkg.level}
                    </span>
                    {!pkg.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Income: ₹{pkg.income.toFixed(2)} ({pkg.incomePercent}%) • Quota: ₹{pkg.quota.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingPkgId(pkg.id);
                      setPkgPrice(pkg.price);
                      setPkgIncomePercent(pkg.incomePercent);
                      setPkgLevel(pkg.level);
                      setIsPkgModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteQuotaPackage(pkg.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB 3: WITHDRAWAL REQUESTS
         ======================================================= */}
      {activeAdminTab === 'withdrawals' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Withdrawal Management ({withdrawals.length} Total, {pendingWithdrawals.length} Pending)
          </h3>

          {withdrawals.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-xs text-slate-400">
              No withdrawal requests submitted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((req) => (
                <div
                  key={req.id}
                  className="glass-card rounded-2xl p-4 border border-slate-200/80 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 font-outfit text-base">
                        ₹{req.amount.toFixed(2)} via {req.method.toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Requested by: {req.userName} • ID: {req.id}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        req.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Account Details */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1 text-slate-600 font-mono">
                    {req.accountDetails.accountHolder && (
                      <div>Holder: {req.accountDetails.accountHolder}</div>
                    )}
                    {req.accountDetails.bankName && (
                      <div>Bank: {req.accountDetails.bankName}</div>
                    )}
                    {req.accountDetails.accountNumber && (
                      <div>Account: {req.accountDetails.accountNumber}</div>
                    )}
                    {req.accountDetails.ifscCode && (
                      <div>IFSC: {req.accountDetails.ifscCode}</div>
                    )}
                    {req.accountDetails.upiId && (
                      <div>UPI: {req.accountDetails.upiId}</div>
                    )}
                    {req.accountDetails.usdtAddress && (
                      <div className="truncate">USDT: {req.accountDetails.usdtAddress}</div>
                    )}
                    <div className="text-[11px] text-slate-400 font-sans pt-1">
                      Handling Fee: ₹{req.fee.toFixed(2)} • Net Payout: ₹{req.netAmount.toFixed(2)}
                    </div>
                  </div>

                  {/* Approve / Reject Buttons if Pending */}
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveWithdrawal(req.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Payout</span>
                      </button>

                      <button
                        onClick={() => setRejectingId(req.id)}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject & Refund</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          TAB: PAYMENT GATEWAYS CONFIGURATION (Admin Receiving)
         ======================================================= */}
      {activeAdminTab === 'gateways' && (
        <form onSubmit={handleSaveGateways} className="glass-card rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-outfit">
                Company Payment Receiving Details
              </h3>
              <p className="text-xs text-slate-400">
                Configure where users send money for INR UPI, Bank Transfers, and USDT deposits
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-[#FF6B00] rounded-full border border-orange-100">
              Live Gateway Settings
            </span>
          </div>

          {/* UPI Gateway Settings */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
              <Smartphone className="w-4 h-4 text-[#FF6B00]" />
              <span>1. UPI Instant Gateway</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Platform UPI ID / VPA
                </label>
                <input
                  type="text"
                  required
                  value={adminUpiId}
                  onChange={(e) => setAdminUpiId(e.target.value)}
                  placeholder="easybasepoint@okhdfcbank"
                  className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Merchant / Business Display Name
                </label>
                <input
                  type="text"
                  required
                  value={adminUpiName}
                  onChange={(e) => setAdminUpiName(e.target.value)}
                  placeholder="EasyBasePoint Enterprise Solutions"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          </div>

          {/* Bank Account Settings */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>2. Company Bank Account (Direct IMPS / NEFT Deposits)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Name</label>
                <input
                  type="text"
                  required
                  value={adminBankName}
                  onChange={(e) => setAdminBankName(e.target.value)}
                  placeholder="HDFC Bank Ltd"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={adminBankHolder}
                  onChange={(e) => setAdminBankHolder(e.target.value)}
                  placeholder="EasyBasePoint Global Pvt Ltd"
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Account Number</label>
                <input
                  type="text"
                  required
                  value={adminBankAccount}
                  onChange={(e) => setAdminBankAccount(e.target.value)}
                  placeholder="50200088991234"
                  className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={adminBankIfsc}
                  onChange={(e) => setAdminBankIfsc(e.target.value.toUpperCase())}
                  placeholder="HDFC0001234"
                  className="w-full mt-1 px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          </div>

          {/* Crypto USDT Receiving Addresses */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>3. Company USDT Crypto Deposit Addresses</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  TRC20 Wallet Address (Tron)
                </label>
                <input
                  type="text"
                  required
                  value={adminUsdtTrc20}
                  onChange={(e) => setAdminUsdtTrc20(e.target.value)}
                  placeholder="TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE"
                  className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  BEP20 Wallet Address (Binance Smart Chain)
                </label>
                <input
                  type="text"
                  required
                  value={adminUsdtBep20}
                  onChange={(e) => setAdminUsdtBep20(e.target.value)}
                  placeholder="0x71C836eB399C8c0F82f0E0f4Ec7aAc89F17Ac9E5"
                  className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          </div>

          {/* Telegram Approval Bot & VIP Channel Settings */}
          <div className="space-y-3 p-4 bg-sky-50/70 rounded-2xl border border-sky-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-sky-800">
                <Send className="w-4 h-4 text-sky-600" />
                <span>4. Telegram Payment Approval Bot & VIP Channel</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">
                100% Privacy Protected
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              When users deposit or request withdrawals, instant alerts with <b>[Approve]</b> and <b>[Reject]</b> buttons 
              are sent directly to your private Telegram Chat. Phone numbers and sensitive user data are masked to guarantee complete privacy.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Telegram Bot API Token (from @BotFather)
                </label>
                <input
                  type="password"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="e.g. 7123456789:AAHk...xyz"
                  className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Your Admin Telegram Chat ID (from @userinfobot)
                </label>
                <input
                  type="text"
                  value={adminTelegramChatId}
                  onChange={(e) => setAdminTelegramChatId(e.target.value)}
                  placeholder="e.g. 6428912345"
                  className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Public / VIP Telegram Channel Link (Shown to users after login)
                </label>
                <input
                  type="text"
                  value={telegramChannelUrl}
                  onChange={(e) => setTelegramChannelUrl(e.target.value)}
                  placeholder="https://t.me/your_channel_link"
                  className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={isTestingTg}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingTg ? 'Sending Ping...' : 'Test Telegram Alert'}</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-xs rounded-2xl shadow-orange-glow transition active:scale-98"
          >
            Save Receiving Payment Gateways & Telegram Bot Config
          </button>
        </form>
      )}

      {/* =======================================================
          TAB 5: USERS MANAGEMENT
         ======================================================= */}
      {activeAdminTab === 'users' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Registered Users
          </h3>

          {user && (
            <div className="glass-card rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      user.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {user.email} • {user.phone} • Ref: {user.referralCode}
                </div>
              </div>

              <button
                onClick={() => toggleUserStatus(user.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  user.status === 'active'
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {user.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          TAB 5: PLATFORM SETTINGS
         ======================================================= */}
      {activeAdminTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="glass-card rounded-3xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Exchange Rates & Fees
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500">
                Platform USDT Rate (INR)
              </label>
              <input
                type="number"
                step={0.1}
                value={usdtRate}
                onChange={(e) => setUsdtRate(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500">
                Normal Market USDT Price (INR)
              </label>
              <input
                type="number"
                step={0.1}
                value={normalPrice}
                onChange={(e) => setNormalPrice(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500">
                Active INR Reward Bonus (%)
              </label>
              <input
                type="number"
                step={0.5}
                value={inrReward}
                onChange={(e) => setInrReward(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500">
                Withdrawal Fee (%)
              </label>
              <input
                type="number"
                step={0.5}
                value={feePercent}
                onChange={(e) => setFeePercent(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500">
                Minimum Withdrawal (INR)
              </label>
              <input
                type="number"
                value={minWithdraw}
                onChange={(e) => setMinWithdraw(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#FF6B00] hover:bg-[#E55F00] text-white font-bold text-xs rounded-2xl shadow-orange-glow transition"
          >
            Save Platform Settings
          </button>
        </form>
      )}

      {/* =======================================================
          TAB 6: AUDIT LOGS
         ======================================================= */}
      {activeAdminTab === 'logs' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            System Audit Trail ({auditLogs.length})
          </h3>

          {auditLogs.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-xs text-slate-400">
              No audit logs registered yet.
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="glass-card rounded-2xl p-3 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{log.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Package Modal */}
      {isPkgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 font-outfit">
                {editingPkgId ? 'Edit Quota Package' : 'New Quota Package'}
              </h3>
              <button onClick={() => setIsPkgModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Price (INR)</label>
                <input
                  type="number"
                  required
                  value={pkgPrice}
                  onChange={(e) => setPkgPrice(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Income Bonus (%)</label>
                <input
                  type="number"
                  step={0.1}
                  required
                  value={pkgIncomePercent}
                  onChange={(e) => setPkgIncomePercent(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Tier Level</label>
                <select
                  value={pkgLevel}
                  onChange={(e) => setPkgLevel(e.target.value as QuotaLevel)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                >
                  <option value="LOW">LOW</option>
                  <option value="MIDDLE">MIDDLE</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Calculated Income:</span>
                  <span className="font-bold text-emerald-600">
                    ₹{((pkgPrice * pkgIncomePercent) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Quota:</span>
                  <span className="font-bold text-slate-800">
                    ₹{(pkgPrice + (pkgPrice * pkgIncomePercent) / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPkgModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FF6B00] text-white rounded-xl text-xs font-bold shadow-orange-glow"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-900 font-outfit text-sm">Reject Withdrawal Request</h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason for rejecting this payout. The full amount will be refunded to the user's wallet.
            </p>
            <input
              type="text"
              placeholder="e.g. Invalid IFSC / Account mismatch"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
