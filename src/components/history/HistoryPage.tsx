import React, { useState, useMemo } from 'react';
import { 
  History, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Gift, 
  Users, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  Search,
  Filter,
  Check,
  X,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Transaction, TransactionType, TransactionStatus } from '../../types';

export type StatusCategory = 'all' | 'successful' | 'pending' | 'cancelled';

export const HistoryPage: React.FC = () => {
  const { user, transactions, deposits, withdrawals } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to categorize any status into successful, pending, or cancelled
  const getStatusCategory = (status: string, credited?: boolean): 'successful' | 'pending' | 'cancelled' => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'credited' || s === 'approved' || credited === true) {
      return 'successful';
    }
    if (s === 'pending' || s === 'processing') {
      return 'pending';
    }
    if (s === 'rejected' || s === 'cancelled' || s === 'failed') {
      return 'cancelled';
    }
    return 'pending';
  };

  // Combine transactions, deposits, and withdrawals strictly belonging to the logged-in user
  const combinedItems = useMemo(() => {
    if (!user) return [];

    const TWENTY_MINUTES_MS = 20 * 60 * 1000;
    const isPendingExpired = (status: string, timeStr?: string) => {
      const cat = getStatusCategory(status);
      if (cat !== 'pending') return false;
      const t = new Date(timeStr || '').getTime();
      return !isNaN(t) && Date.now() - t > TWENTY_MINUTES_MS;
    };

    const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');

    const isUserOwner = (item: { userId?: string; userPhone?: string; metadata?: any }) => {
      if (!user) return false;
      if (item.userId && item.userId === user.id) return true;
      const itemPhone = (item.userPhone || item.metadata?.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 10 && itemPhone.length >= 10 && itemPhone.endsWith(cleanPhone.slice(-10))) {
        return true;
      }
      return false;
    };

    // Strictly scope deposits and withdrawals to the active user
    const myDeposits = deposits.filter((d) => isUserOwner(d));
    const myWithdrawals = withdrawals.filter((w) => isUserOwner(w));
    const myDepIds = new Set(myDeposits.map((d) => d.id));
    const myWithIds = new Set(myWithdrawals.map((w) => w.id));

    const isTxOwner = (t: Transaction) => {
      if (isUserOwner(t)) return true;
      if (t.referenceId && (myDepIds.has(t.referenceId) || myWithIds.has(t.referenceId))) {
        return true;
      }
      return false;
    };

    const items: Transaction[] = [];

    transactions.forEach((t) => {
      if (!isTxOwner(t)) return;

      let currentStatus: TransactionStatus = t.status;
      let currentAmount = t.amount;
      let currentNote = t.note;

      if (t.referenceId) {
        // Check deposit match
        const matchingDep = myDeposits.find((d) => d.id === t.referenceId);
        if (matchingDep) {
          const isUsdt = matchingDep.method === 'USDT' || matchingDep.id.startsWith('USDT');
          const isCompleted = matchingDep.status === 'completed' || matchingDep.status === 'credited' || matchingDep.status === 'approved' || matchingDep.credited === true;
          currentStatus = (isCompleted ? 'completed' : matchingDep.status) as TransactionStatus;
          currentAmount = matchingDep.totalInr || t.amount;
          currentNote = isCompleted
            ? (isUsdt ? `USDT Deposit Approved (+₹${(matchingDep.totalInr || t.amount).toFixed(2)})` : `INR Deposit Approved (+Bonus)`)
            : (matchingDep.status === 'rejected' ? (isUsdt ? 'USDT Deposit Rejected' : 'INR Deposit Rejected') : (isUsdt ? `USDT Deposit (${matchingDep.amount} USDT • Pending Verification)` : `INR Deposit (₹${matchingDep.amount} • Pending Verification)`));
        } else {
          // Check withdrawal match
          const matchingWith = myWithdrawals.find((w) => w.id === t.referenceId);
          if (matchingWith) {
            currentStatus = matchingWith.status as TransactionStatus;
            currentAmount = matchingWith.amount;
            currentNote = matchingWith.status === 'rejected' && matchingWith.rejectionReason 
              ? `Withdrawal via ${matchingWith.method.toUpperCase()} (Rejected: ${matchingWith.rejectionReason})` 
              : `Withdrawal via ${matchingWith.method.toUpperCase()} (Net: ₹${matchingWith.netAmount.toFixed(2)})`;
          }
        }
      }

      // Hide pending transaction if older than 20 minutes
      if (!isPendingExpired(currentStatus, t.timestamp)) {
        items.push({
          ...t,
          status: currentStatus,
          amount: currentAmount,
          note: currentNote,
        });
      }
    });

    const existingRefIds = new Set(items.map((t) => t.referenceId || t.id));

    // Ensure all active deposits of this user are included
    myDeposits.forEach((dep) => {
      if (!existingRefIds.has(dep.id)) {
        const isUsdt = dep.method === 'USDT' || dep.id.startsWith('USDT');
        const isCompleted = dep.status === 'completed' || dep.status === 'credited' || dep.status === 'approved' || dep.credited === true;
        const depStatus = (isCompleted ? 'completed' : dep.status) as TransactionStatus;

        // Hide pending deposit if older than 20 minutes
        if (!isPendingExpired(depStatus, dep.createdAt)) {
          items.push({
            id: dep.id,
            userId: dep.userId,
            type: 'deposit',
            amount: dep.totalInr || dep.amount,
            currency: 'INR',
            status: depStatus,
            timestamp: dep.createdAt,
            note: isUsdt
              ? `USDT Deposit (${dep.amount} USDT • ${isCompleted ? 'Approved & Credited' : dep.status === 'rejected' ? 'Rejected' : 'Pending Verification'})`
              : `INR Deposit (₹${dep.amount} • ${isCompleted ? 'Approved & Credited' : dep.status === 'rejected' ? 'Rejected' : 'Pending Verification'})`,
            referenceId: dep.id,
          });
        }
      }
    });

    // Ensure all active withdrawals of this user are included
    myWithdrawals.forEach((w) => {
      if (!existingRefIds.has(w.id)) {
        const withStatus = w.status as TransactionStatus;

        // Hide pending withdrawal if older than 20 minutes
        if (!isPendingExpired(withStatus, w.createdAt)) {
          items.push({
            id: w.id,
            userId: w.userId,
            type: 'withdrawal',
            amount: w.amount,
            currency: 'INR',
            status: withStatus,
            timestamp: w.createdAt,
            note: w.status === 'rejected' && w.rejectionReason 
              ? `Withdrawal via ${w.method.toUpperCase()} (Rejected: ${w.rejectionReason})` 
              : `Withdrawal via ${w.method.toUpperCase()} (Net: ₹${w.netAmount.toFixed(2)})`,
            referenceId: w.id,
          });
        }
      }
    });

    // Strict chronological sort: Newest on TOP, Oldest at the BOTTOM
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [user, transactions, deposits, withdrawals]);

  // Filter by primary Type tab first
  const typeFiltered = useMemo(() => {
    return combinedItems.filter((t) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'reward' && (t.type === 'reward' || t.type === 'commission')) return true;
      return t.type === activeTab;
    });
  }, [combinedItems, activeTab]);

  // Compute 3 Sections totals & items for the selected Type
  const successfulItems = useMemo(() => {
    return typeFiltered.filter((t) => getStatusCategory(t.status) === 'successful');
  }, [typeFiltered]);

  const pendingItems = useMemo(() => {
    return typeFiltered.filter((t) => getStatusCategory(t.status) === 'pending');
  }, [typeFiltered]);

  const cancelledItems = useMemo(() => {
    return typeFiltered.filter((t) => getStatusCategory(t.status) === 'cancelled');
  }, [typeFiltered]);

  const successfulAmount = useMemo(() => {
    return successfulItems.reduce((sum, item) => sum + item.amount, 0);
  }, [successfulItems]);

  const pendingAmount = useMemo(() => {
    return pendingItems.reduce((sum, item) => sum + item.amount, 0);
  }, [pendingItems]);

  const cancelledAmount = useMemo(() => {
    return cancelledItems.reduce((sum, item) => sum + item.amount, 0);
  }, [cancelledItems]);

  // Filter items by status tab and search query
  const displayItems = useMemo(() => {
    let list = typeFiltered;
    if (statusFilter !== 'all') {
      list = list.filter((t) => getStatusCategory(t.status) === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.note.toLowerCase().includes(q) ||
          (t.referenceId && t.referenceId.toLowerCase().includes(q))
      );
    }
    return list;
  }, [typeFiltered, statusFilter, searchQuery]);

  const getStatusBadge = (status: TransactionStatus) => {
    const cat = getStatusCategory(status);
    switch (cat) {
      case 'successful':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved & Credited
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            Pending Verification
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Cancelled / Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <ArrowDownToLine className="w-4 h-4" />
          </div>
        );
      case 'withdrawal':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
            <ArrowUpFromLine className="w-4 h-4" />
          </div>
        );
      case 'reward':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
            <Gift className="w-4 h-4" />
          </div>
        );
      case 'commission':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
            <Users className="w-4 h-4" />
          </div>
        );
      case 'quota_purchase':
        return (
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
        );
    }
  };

  const renderTransactionCard = (t: (typeof combinedItems)[0]) => {
    const isCredit = t.type === 'deposit' || t.type === 'reward' || t.type === 'commission';
    const cat = getStatusCategory(t.status);

    return (
      <div
        key={t.id}
        className={`glass-card rounded-2xl p-4 flex items-center justify-between border transition-all ${
          cat === 'successful'
            ? 'hover:border-emerald-300'
            : cat === 'pending'
            ? 'hover:border-amber-300 bg-amber-50/20'
            : 'hover:border-rose-300 bg-rose-50/20'
        }`}
      >
        <div className="flex items-center gap-3">
          {getTypeIcon(t.type)}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">{t.note}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {t.id} • {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="text-right space-y-1">
          <div
            className={`text-sm font-extrabold font-outfit ${
              cat === 'cancelled'
                ? 'text-slate-400 line-through'
                : isCredit
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {isCredit ? '+' : '-'}₹{t.amount.toFixed(2)}
          </div>
          <div>{getStatusBadge(t.status)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Title */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-black text-[#0B1528] font-outfit">Transaction History</h1>
          <p className="text-xs text-slate-500 font-medium">Successful, Pending & Cancelled Records</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
          Total: {combinedItems.length}
        </span>
      </div>

      {/* Primary Category Filter Tabs: All, Deposit, Withdrawal, Reward, Team Bonus */}
      <div className="flex items-center gap-1.5 bg-[#0B1528] p-1.5 rounded-2xl overflow-x-auto no-scrollbar border border-orange-500/20 shadow-md">
        {[
          { id: 'all', label: 'All Records', activeBg: 'from-[#FF6B00] to-amber-500 shadow-[0_2px_10px_rgba(255,107,0,0.5)]' },
          { id: 'deposit', label: '💰 Deposits', activeBg: 'from-emerald-600 to-teal-400 shadow-[0_2px_10px_rgba(16,185,129,0.5)]' },
          { id: 'withdrawal', label: '💸 Withdrawals', activeBg: 'from-rose-600 to-pink-500 shadow-[0_2px_10px_rgba(244,63,94,0.5)]' },
          { id: 'reward', label: '🎁 Rewards', activeBg: 'from-amber-500 to-yellow-400 shadow-[0_2px_10px_rgba(245,158,11,0.5)]' },
          { id: 'commission', label: '👥 Team Bonus', activeBg: 'from-blue-600 to-indigo-500 shadow-[0_2px_10px_rgba(59,130,246,0.5)]' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setStatusFilter('all');
            }}
            className={`flex-1 min-w-[95px] py-2 px-3 text-center text-xs font-black font-outfit rounded-xl transition-all duration-300 ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.activeBg} text-white scale-[1.03]`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          3 DISTINCT SECTIONS SUMMARY CARDS: SUCCESSFUL, PENDING, CANCELLED
          (Tapping any card instantly filters by that status section)
         ========================================================================= */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. Successful Card */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'successful' ? 'all' : 'successful')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'successful'
              ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500 ring-2 ring-emerald-400/50 shadow-md scale-[1.02]'
              : 'bg-white border-emerald-200/80 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Successful
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-sm font-black font-outfit text-emerald-700">
            ₹{successfulAmount.toFixed(2)}
          </div>
          <div className="text-[10px] font-bold text-emerald-600/80 mt-0.5">
            {successfulItems.length} {successfulItems.length === 1 ? 'Order' : 'Orders'}
          </div>
          {statusFilter === 'successful' && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>

        {/* 2. Pending Card */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'pending'
              ? 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border-amber-500 ring-2 ring-amber-400/50 shadow-md scale-[1.02]'
              : 'bg-white border-amber-200/80 hover:border-amber-300 hover:bg-amber-50/40 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
              Pending
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          </div>
          <div className="text-sm font-black font-outfit text-amber-700">
            ₹{pendingAmount.toFixed(2)}
          </div>
          <div className="text-[10px] font-bold text-amber-800/80 mt-0.5">
            {pendingItems.length} {pendingItems.length === 1 ? 'Order' : 'Orders'}
          </div>
          {statusFilter === 'pending' && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
          )}
        </button>

        {/* 3. Cancelled Card */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'cancelled' ? 'all' : 'cancelled')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            statusFilter === 'cancelled'
              ? 'bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-transparent border-rose-500 ring-2 ring-rose-400/50 shadow-md scale-[1.02]'
              : 'bg-white border-rose-200/80 hover:border-rose-300 hover:bg-rose-50/40 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">
              Cancelled
            </span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-sm font-black font-outfit text-rose-700">
            ₹{cancelledAmount.toFixed(2)}
          </div>
          <div className="text-[10px] font-bold text-rose-600/80 mt-0.5">
            {cancelledItems.length} {cancelledItems.length === 1 ? 'Order' : 'Orders'}
          </div>
          {statusFilter === 'cancelled' && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </button>
      </div>

      {/* Status Segment Filter Buttons: All | Successful | Pending | Cancelled */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold font-outfit">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
            statusFilter === 'all'
              ? 'bg-white text-slate-900 shadow-xs font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({typeFiltered.length})
        </button>
        <button
          onClick={() => setStatusFilter('successful')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
            statusFilter === 'successful'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'text-emerald-700 hover:text-emerald-900'
          }`}
        >
          ✅ Successful ({successfulItems.length})
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-xs font-black'
              : 'text-amber-800 hover:text-amber-950'
          }`}
        >
          ⏳ Pending ({pendingItems.length})
        </button>
        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
            statusFilter === 'cancelled'
              ? 'bg-rose-600 text-white shadow-xs font-black'
              : 'text-rose-700 hover:text-rose-900'
          }`}
        >
          ❌ Cancelled ({cancelledItems.length})
        </button>
      </div>

      {/* Active Pending Alert Banner (only shown when user views pending records) */}
      {pendingItems.length > 0 && statusFilter === 'pending' && (
        <div className="p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 rounded-2xl border-2 border-amber-400/50 shadow-sm space-y-1 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <Clock className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div>
                <h3 className="font-outfit font-black text-xs text-amber-950 tracking-wide uppercase">
                  {pendingItems.length} Orders Awaiting Verification
                </h3>
                <p className="text-[11px] font-bold text-amber-800">
                  Total Pending: ₹{pendingAmount.toFixed(2)} • Active verification window: 20 mins
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500 text-white shadow-xs uppercase tracking-wider animate-pulse">
              PENDING
            </span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Transaction ID or note..."
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
        />
      </div>

      {/* =========================================================================
          TRANSACTION LIST - CLEAN UNIFIED CHRONOLOGICAL LIST (NEW ON TOP, OLD AT BOTTOM)
         ========================================================================= */}
      {displayItems.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center space-y-2">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Transactions Found</h4>
          <p className="text-xs text-slate-400">
            {statusFilter !== 'all' 
              ? `No ${statusFilter} records found for this category.` 
              : 'There are no records matching your current selection.'}
          </p>
        </div>
      ) : (
        /* Dedicated Clean Unified View - Newest First, Clean Cards */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {statusFilter === 'all'
                ? `All Records (${displayItems.length}) • Newest on top, oldest at bottom`
                : `Showing ${displayItems.length} ${statusFilter} records`}
            </span>
          </div>
          {displayItems.map(renderTransactionCard)}
        </div>
      )}
    </div>
  );
};
