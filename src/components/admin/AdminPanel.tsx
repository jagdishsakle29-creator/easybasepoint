import React, { useState } from 'react';
import { 
  Lock, 
  LayoutDashboard, 
  Package, 
  ArrowUpFromLine, 
  ArrowDownToLine,
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
import { storage } from '../../services/storage';

export const AdminPanel: React.FC = () => {
  const { 
    packages, 
    deposits,
    withdrawals, 
    settings, 
    auditLogs, 
    user, 
    approveDeposit,
    rejectDeposit,
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
    'overview' | 'usdt' | 'deposits' | 'withdrawals' | 'packages' | 'gateways' | 'users' | 'settings' | 'logs'
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
  const [adminUpiId, setAdminUpiId] = useState(settings.adminUpiId || 'basepnt@ybl');
  const [adminUpiName, setAdminUpiName] = useState(settings.adminUpiName || 'EasyBasePoint Enterprise');
  const [adminBankName, setAdminBankName] = useState(settings.adminBankName || 'HDFC Bank Ltd');
  const [adminBankAccount, setAdminBankAccount] = useState(settings.adminBankAccount || '50200088991234');
  const [adminBankIfsc, setAdminBankIfsc] = useState(settings.adminBankIfsc || 'HDFC0001234');
  const [adminBankHolder, setAdminBankHolder] = useState(settings.adminBankHolder || 'EasyBasePoint Global Pvt Ltd');
  const [adminUsdtTrc20, setAdminUsdtTrc20] = useState(settings.adminUsdtTrc20 || 'TTsZk5wTANw2MrBxn6xTNdHpeFFtBG4rLW');
  const [adminUsdtBep20, setAdminUsdtBep20] = useState(settings.adminUsdtBep20 || '0x71C836eB399C8c0F82f0E0f4Ec7aAc89F17Ac9E5');
  const [telegramBotToken, setTelegramBotToken] = useState(settings.telegramBotToken || '');
  const [adminTelegramChatId, setAdminTelegramChatId] = useState(settings.adminTelegramChatId || '');
  const [telegramChannelUrl, setTelegramChannelUrl] = useState(settings.telegramChannelUrl || 'https://t.me/easybasepoint');
  const [isTestingTg, setIsTestingTg] = useState(false);

  const pendingDeposits = deposits.filter((d) => d.status === 'pending');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');

  // Dedicated USDT Metrics
  const usdtDeposits = deposits.filter((d) => d.method === 'USDT' || d.id.startsWith('USDT'));
  const pendingUsdtDeposits = usdtDeposits.filter((d) => d.status === 'pending');
  const approvedUsdtDeposits = usdtDeposits.filter((d) => d.status === 'approved');
  const creditedUsdtDeposits = usdtDeposits.filter((d) => d.status === 'credited' || (d.status === 'completed' && d.credited !== false));
  const rejectedUsdtDeposits = usdtDeposits.filter((d) => d.status === 'rejected');
  const totalUsdtVolume = usdtDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalUsdtInrVolume = usdtDeposits.reduce((sum, d) => sum + (Number(d.totalInr) || 0), 0);

  // Status Filter States
  const [inrFilter, setInrFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [usdtFilter, setUsdtFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  // INR Deposit Metrics & Filtered List
  const inrDeposits = deposits.filter((d) => d.method !== 'USDT' && !d.id.startsWith('USDT'));
  const pendingInrDeposits = inrDeposits.filter((d) => d.status === 'pending');
  const completedInrDeposits = inrDeposits.filter((d) => d.status === 'completed' || d.status === 'credited' || d.credited === true);
  const rejectedInrDeposits = inrDeposits.filter((d) => d.status === 'rejected');

  const filteredInrDeposits = inrDeposits.filter((d) => {
    if (inrFilter === 'all') return true;
    if (inrFilter === 'pending') return d.status === 'pending';
    if (inrFilter === 'completed') return d.status === 'completed' || d.status === 'credited' || d.credited === true;
    if (inrFilter === 'rejected') return d.status === 'rejected';
    return true;
  });

  const filteredUsdtDeposits = usdtDeposits.filter((d) => {
    if (usdtFilter === 'all') return true;
    if (usdtFilter === 'pending') return d.status === 'pending';
    if (usdtFilter === 'completed') return d.status === 'completed' || d.status === 'credited' || d.status === 'approved' || d.credited === true;
    if (usdtFilter === 'rejected') return d.status === 'rejected';
    return true;
  });

  // Registered Users list from persistent storage
  const registeredAccounts = React.useMemo(() => {
    const accounts = storage.getAccounts();
    if (user && !accounts.some((a) => a.user.id === user.id)) {
      accounts.unshift({
        user,
        wallet: storage.getWallet(),
      });
    }
    return accounts;
  }, [user]);

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
          { id: 'usdt', label: 'USDT Management', icon: Coins, badge: pendingUsdtDeposits.length },
          { id: 'deposits', label: 'INR Deposits', icon: ArrowDownToLine, badge: pendingDeposits.filter(d => d.method !== 'USDT' && !d.id.startsWith('USDT')).length },
          { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine, badge: pendingWithdrawals.length },
          { id: 'packages', label: 'Packages', icon: Package },
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
          TAB: USDT MANAGEMENT & REAL-TIME INCOMING AREA
         ======================================================= */}
      {activeAdminTab === 'usdt' && (
        <div className="space-y-5">
          {/* Header & Live Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#0B1528] via-[#0F1E36] to-[#0B1528] p-4 rounded-3xl border border-emerald-500/20 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-outfit tracking-wide flex items-center gap-2">
                  USDT MANAGEMENT
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    TRC20
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real-time incoming USDT stream, approval management, and transaction ledger
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/60 text-[11px] text-slate-300 font-mono">
                1 USDT = <span className="font-bold text-emerald-400 font-sans">₹{settings.usdtRate.toFixed(2)} INR</span>
              </div>
              {pendingUsdtDeposits.length > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  {pendingUsdtDeposits.length} Pending Approval
                </span>
              )}
            </div>
          </div>

          {/* 7 Required Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            <div className="glass-card rounded-2xl p-3 border border-slate-200/80 bg-white shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total USDT</span>
              <div className="text-xl font-black text-slate-900 font-outfit mt-1">
                {usdtDeposits.length}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">deposits</span>
            </div>

            <div className="glass-card rounded-2xl p-3 border border-amber-300/80 bg-amber-50/40 shadow-xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pending USDT</span>
              <div className="text-xl font-black text-amber-600 font-outfit mt-1">
                {pendingUsdtDeposits.length}
              </div>
              <span className="text-[10px] text-amber-600 font-mono">
                {pendingUsdtDeposits.reduce((acc, d) => acc + (d.amount || 0), 0).toFixed(1)} USDT
              </span>
            </div>

            <div className="glass-card rounded-2xl p-3 border border-blue-200/80 bg-blue-50/30 shadow-xs">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Approved USDT</span>
              <div className="text-xl font-black text-blue-600 font-outfit mt-1">
                {approvedUsdtDeposits.length}
              </div>
              <span className="text-[10px] text-blue-600 font-mono">verified</span>
            </div>

            <div className="glass-card rounded-2xl p-3 border border-emerald-300/80 bg-emerald-50/40 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Credited USDT</span>
              <div className="text-xl font-black text-emerald-600 font-outfit mt-1">
                {creditedUsdtDeposits.length}
              </div>
              <span className="text-[10px] text-emerald-600 font-mono">
                {creditedUsdtDeposits.reduce((acc, d) => acc + (d.amount || 0), 0).toFixed(1)} USDT
              </span>
            </div>

            <div className="glass-card rounded-2xl p-3 border border-rose-200/80 bg-rose-50/30 shadow-xs">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Rejected USDT</span>
              <div className="text-xl font-black text-rose-600 font-outfit mt-1">
                {rejectedUsdtDeposits.length}
              </div>
              <span className="text-[10px] text-rose-500 font-mono">cancelled</span>
            </div>

            <div className="glass-card rounded-2xl p-3 border border-purple-200/80 bg-purple-50/30 shadow-xs col-span-2 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Total Volume</span>
              <div className="text-xl font-black text-purple-700 font-outfit mt-1">
                {totalUsdtVolume.toLocaleString()} USDT
              </div>
              <span className="text-[10px] text-purple-600 font-sans">
                ₹{totalUsdtInrVolume.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="glass-card rounded-2xl p-3 border border-slate-200/80 bg-white shadow-xs col-span-2 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transactions</span>
              <div className="text-xl font-black text-slate-800 font-outfit mt-1">
                {usdtDeposits.length}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">all statuses</span>
            </div>
          </div>

          {/* Section 6: USDT INCOMING AREA */}
          <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 rounded-3xl p-5 border-2 border-dashed border-amber-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FF6B00]"></span>
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-900 font-outfit uppercase tracking-wider">
                    USDT INCOMING
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    "USDT being added here in real time" — updates from PENDING → APPROVED → CREDITED
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                {pendingUsdtDeposits.length} Live Pending Request{pendingUsdtDeposits.length !== 1 ? 's' : ''}
              </span>
            </div>

            {pendingUsdtDeposits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white/80 rounded-2xl border border-slate-200/60 font-medium">
                ⚡ No pending USDT deposits waiting for approval right now. New submissions will appear here automatically in 0.1s!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsdtDeposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="p-4 bg-white rounded-2xl border border-amber-300 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#FF6B00] transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 uppercase tracking-wider animate-pulse">
                          PENDING
                        </span>
                        <span className="font-mono text-xs font-black text-slate-900">
                          #{dep.id}
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {dep.userPhone ? `${dep.userPhone.slice(0, 4)}****${dep.userPhone.slice(-3)}` : dep.userId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="text-lg font-black text-emerald-600 font-outfit">
                          {dep.amount} USDT
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="font-black text-slate-800">
                          ₹{dep.totalInr.toLocaleString('en-IN')} INR
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          (Chain: {dep.network || 'TRC20'})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-md bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        Tx Hash: {dep.proofUrl || dep.utrNumber || 'TRC20-TRANSFER'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => approveDeposit(dep.id)}
                        className="flex-1 sm:flex-initial py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Credit ₹{dep.totalInr}</span>
                      </button>
                      <button
                        onClick={() => rejectDeposit(dep.id, 'Invalid USDT TxID or payment unconfirmed')}
                        className="py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: USDT Transaction Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-outfit">
                USDT Transaction Table ({filteredUsdtDeposits.length} Records)
              </h4>
              <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl">
                {[
                  { id: 'all', label: `ALL (${usdtDeposits.length})` },
                  { id: 'pending', label: `PENDING (${pendingUsdtDeposits.length})` },
                  { id: 'completed', label: `SUCCESSFUL (${creditedUsdtDeposits.length})` },
                  { id: 'rejected', label: `REJECTED (${rejectedUsdtDeposits.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setUsdtFilter(f.id as any)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      usdtFilter === f.id
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredUsdtDeposits.length === 0 ? (
              <div className="glass-card rounded-3xl p-8 text-center text-xs text-slate-400">
                No USDT deposits match this filter.
              </div>
            ) : (
              <div className="glass-card rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase font-outfit tracking-wider">
                        <th className="py-3.5 px-3.5">Deposit ID</th>
                        <th className="py-3.5 px-3.5">User</th>
                        <th className="py-3.5 px-3.5">Telegram / Identifier</th>
                        <th className="py-3.5 px-3.5">Amount</th>
                        <th className="py-3.5 px-3.5">Currency</th>
                        <th className="py-3.5 px-3.5">Network / Chain</th>
                        <th className="py-3.5 px-3.5">Status</th>
                        <th className="py-3.5 px-3.5">Created At</th>
                        <th className="py-3.5 px-3.5">Approved At</th>
                        <th className="py-3.5 px-3.5">Credited At</th>
                        <th className="py-3.5 px-3.5">Tx / Hash</th>
                        <th className="py-3.5 px-3.5 text-right">Admin / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsdtDeposits.map((dep) => {
                        const statusBadge = () => {
                          if (dep.status === 'credited' || (dep.status === 'completed' && dep.credited !== false)) {
                            return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">CREDITED</span>;
                          }
                          if (dep.status === 'approved') {
                            return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">APPROVED</span>;
                          }
                          if (dep.status === 'rejected') {
                            return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">REJECTED</span>;
                          }
                          if (dep.status === 'failed') {
                            return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700 border border-slate-300">FAILED</span>;
                          }
                          return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">PENDING</span>;
                        };

                        return (
                          <tr key={dep.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-3.5 font-mono font-bold text-slate-900">
                              #{dep.id}
                            </td>
                            <td className="py-3.5 px-3.5">
                              <div className="font-bold text-slate-800">
                                {dep.userPhone ? `${dep.userPhone.slice(0, 4)}****${dep.userPhone.slice(-3)}` : (dep.userId || 'Player')}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">{dep.userId}</div>
                            </td>
                            <td className="py-3.5 px-3.5 font-mono text-slate-600 text-[11px]">
                              {dep.userPhone || dep.userId || '—'}
                            </td>
                            <td className="py-3.5 px-3.5">
                              <div className="font-black text-emerald-600 font-outfit text-sm">
                                {dep.amount} USDT
                              </div>
                              <div className="text-[10px] text-slate-500 font-sans">
                                ₹{dep.totalInr.toLocaleString('en-IN')} INR
                              </div>
                            </td>
                            <td className="py-3.5 px-3.5 font-bold text-slate-800 font-mono">
                              USDT
                            </td>
                            <td className="py-3.5 px-3.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 font-mono border border-slate-200">
                                {dep.network || 'TRC20'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5">
                              {statusBadge()}
                            </td>
                            <td className="py-3.5 px-3.5 text-slate-500 text-[11px] font-sans">
                              {new Date(dep.createdAt).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3.5 text-slate-500 text-[11px] font-sans">
                              {dep.approvedAt ? new Date(dep.approvedAt).toLocaleTimeString('en-IN') : (dep.status === 'credited' ? 'Credited' : '—')}
                            </td>
                            <td className="py-3.5 px-3.5 text-slate-500 text-[11px] font-sans">
                              {dep.creditedAt ? new Date(dep.creditedAt).toLocaleTimeString('en-IN') : (dep.status === 'credited' ? 'Credited' : '—')}
                            </td>
                            <td className="py-3.5 px-3.5 font-mono text-[11px] text-slate-600 max-w-[120px] truncate" title={dep.proofUrl || dep.utrNumber}>
                              {dep.proofUrl || dep.utrNumber || '—'}
                            </td>
                            <td className="py-3.5 px-3.5 text-right">
                              {dep.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => approveDeposit(dep.id)}
                                    className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs active:scale-95 transition flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => rejectDeposit(dep.id)}
                                    className="py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 font-mono">
                                  {dep.status === 'credited' ? 'Credited' : 'Processed'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================
          TAB: DEPOSIT REQUESTS APPROVAL
         ======================================================= */}
      {activeAdminTab === 'deposits' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              INR Deposit Approvals ({inrDeposits.length} Total, {pendingInrDeposits.length} Pending)
            </h3>
            {pendingInrDeposits.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                {pendingInrDeposits.length} Requires Approval
              </span>
            )}
          </div>

          {/* Status Filter Tabs: ALL, PENDING, SUCCESSFUL, REJECTED */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'all', label: `ALL (${inrDeposits.length})` },
              { id: 'pending', label: `PENDING (${pendingInrDeposits.length})` },
              { id: 'completed', label: `SUCCESSFUL (${completedInrDeposits.length})` },
              { id: 'rejected', label: `REJECTED (${rejectedInrDeposits.length})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setInrFilter(f.id as any)}
                className={`flex-1 py-1.5 px-2 text-center text-xs font-bold rounded-lg transition-all ${
                  inrFilter === f.id
                    ? 'bg-[#0B1528] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredInrDeposits.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-xs text-slate-400">
              No deposit requests match this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInrDeposits.map((dep) => (
                <div
                  key={dep.id}
                  className={`glass-card rounded-2xl p-4 border transition-all ${
                    dep.status === 'pending'
                      ? 'border-amber-400/60 bg-gradient-to-br from-white to-amber-50/40 shadow-md'
                      : 'border-slate-200/80'
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 font-outfit text-base">
                        ₹{dep.totalInr.toLocaleString('en-IN')} via {dep.method.toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Base: ₹{dep.amount.toLocaleString('en-IN')} {dep.bonusInr > 0 ? `+ Bonus: ₹${dep.bonusInr}` : ''}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        dep.status === 'completed' || dep.status === 'credited' || dep.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dep.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {dep.status === 'credited' ? 'Credited' : dep.status}
                    </span>
                  </div>

                  {/* UTR & Transaction Details */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1 text-slate-700 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">User Phone:</span>
                      <span className="font-bold text-slate-900">{dep.userPhone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">12-Digit UTR:</span>
                      <span className="font-black text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded tracking-wider text-[13px]">
                        {dep.utrNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Submitted At:</span>
                      <span className="text-slate-500 text-[11px] font-sans">
                        {new Date(dep.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons if Pending */}
                  {dep.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => approveDeposit(dep.id)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition active:scale-[0.98]"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Credit ₹{dep.totalInr}</span>
                      </button>

                      <button
                        onClick={() => rejectDeposit(dep.id, 'Invalid UTR or payment not received')}
                        className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
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
                  placeholder="basepnt@ybl"
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

          {/* Crypto USDT Receiving Addresses (TRC20 Only) */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>2. Official USDT TRC20 Deposit Address</span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  TRC20 Wallet Address (TRON Network)
                </label>
                <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Starts with 'T' • Express Network
                </span>
              </div>
              <input
                type="text"
                required
                value={adminUsdtTrc20}
                onChange={(e) => setAdminUsdtTrc20(e.target.value.trim())}
                placeholder="TTsZk5wTANw2MrBxn6xTNdHpeFFtBG4rLW"
                className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:ring-1 focus:ring-[#FF6B00]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                🟢 Official TRON TRC20 Receiving Address (e.g. <strong className="text-slate-700 font-mono">TTsZk5wTANw2MrBxn6xTNdHpeFFtBG4rLW</strong>)
              </p>
            </div>
          </div>

          {/* Telegram Approval Bot & VIP Channel Settings */}
          <div className="space-y-3 p-4 bg-sky-50/70 rounded-2xl border border-sky-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-sky-800">
                <Send className="w-4 h-4 text-sky-600" />
                <span>3. Telegram Payment Approval Bot & VIP Channel</span>
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Registered Users ({registeredAccounts.length} Total)
            </h3>
          </div>

          {registeredAccounts.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-xs text-slate-400">
              No registered users found in the system yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {registeredAccounts.map((acc) => (
                <div
                  key={acc.user.id}
                  className="glass-card rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{acc.user.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          acc.user.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {acc.user.status.toUpperCase()}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ID: {acc.user.id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {acc.user.email} • {acc.user.phone} • Referral Code: <span className="font-mono font-bold text-slate-700">{acc.user.referralCode}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Registered: {new Date(acc.user.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Wallet Balance</div>
                      <div className="font-outfit font-black text-sm text-emerald-600">
                        ₹{(Number(acc.wallet?.balance) || 0).toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleUserStatus(acc.user.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        acc.user.status === 'active'
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {acc.user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
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
