import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TransactionType, TransactionStatus } from '../../types';

export const HistoryPage: React.FC = () => {
  const { transactions, deposits } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine transactions and deposits so every single deposit is guaranteed to appear in history
  const combinedItems = React.useMemo(() => {
    const items = transactions.map((t) => {
      if (t.referenceId) {
        const matchingDep = deposits.find((d) => d.id === t.referenceId);
        if (matchingDep) {
          const isUsdt = matchingDep.method === 'USDT' || matchingDep.id.startsWith('USDT');
          return {
            ...t,
            status: matchingDep.status,
            amount: matchingDep.totalInr || t.amount,
            note: matchingDep.status === 'completed'
              ? (isUsdt ? `USDT Deposit Approved (+₹${(matchingDep.totalInr || t.amount).toFixed(2)})` : `INR Deposit Approved (+Bonus)`)
              : t.note,
          };
        }
      }
      return t;
    });

    const existingRefIds = new Set(items.map((t) => t.referenceId || t.id));

    deposits.forEach((dep) => {
      if (!existingRefIds.has(dep.id)) {
        const isUsdt = dep.method === 'USDT' || dep.id.startsWith('USDT');
        items.push({
          id: dep.id,
          userId: dep.userId,
          type: 'deposit',
          amount: dep.totalInr || dep.amount,
          currency: 'INR',
          status: dep.status,
          timestamp: dep.createdAt,
          note: isUsdt
            ? `USDT Deposit (${dep.amount} USDT • ${dep.status === 'completed' ? 'Approved & Credited' : dep.status === 'rejected' ? 'Rejected' : 'Pending Confirmation'})`
            : `INR Deposit (₹${dep.amount} • ${dep.status === 'completed' ? 'Approved & Credited' : dep.status === 'rejected' ? 'Rejected' : 'Pending Verification'})`,
          referenceId: dep.id,
        });
      }
    });

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, deposits]);

  const filtered = combinedItems.filter((t) => {
    if (activeTab !== 'all') {
      if (activeTab === 'reward' && (t.type === 'reward' || t.type === 'commission')) {
        // match
      } else if (t.type !== activeTab) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.note.toLowerCase().includes(q) ||
        (t.referenceId && t.referenceId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownToLine className="w-4 h-4" />
          </div>
        );
      case 'withdrawal':
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpFromLine className="w-4 h-4" />
          </div>
        );
      case 'reward':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Gift className="w-4 h-4" />
          </div>
        );
      case 'commission':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        );
      case 'quota_purchase':
        return (
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Title */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl font-black text-[#0B1528] font-outfit">Transaction History</h1>
        <span className="text-xs text-slate-400 font-medium">Total: {combinedItems.length}</span>
      </div>

      {/* Segmented Filter Tabs: All, Deposit, Withdrawal, Reward, Commission */}
      <div className="flex items-center gap-1.5 bg-[#0B1528] p-1.5 rounded-2xl overflow-x-auto no-scrollbar border border-orange-500/20 shadow-md">
        {[
          { id: 'all', label: 'All Records', activeBg: 'from-[#FF6B00] to-amber-500 shadow-[0_2px_10px_rgba(255,107,0,0.5)]' },
          { id: 'deposit', label: '💰 Deposits', activeBg: 'from-emerald-600 to-teal-400 shadow-[0_2px_10px_rgba(16,185,129,0.5)]' },
          { id: 'withdrawal', label: '💸 Withdrawals', activeBg: 'from-rose-600 to-pink-500 shadow-[0_2px_10px_rgba(244,63,94,0.5)]' },
          { id: 'reward', label: '🎁 Rewards', activeBg: 'from-amber-500 to-yellow-400 shadow-[0_2px_10px_rgba(245,158,11,0.5)]' },
          { id: 'commission', label: '👥 20% Team Bonus', activeBg: 'from-blue-600 to-indigo-500 shadow-[0_2px_10px_rgba(59,130,246,0.5)]' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center space-y-2">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Transactions Found</h4>
          <p className="text-xs text-slate-400">There are no records matching your current selection.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t) => {
            const isCredit = t.type === 'deposit' || t.type === 'reward' || t.type === 'commission';

            return (
              <div
                key={t.id}
                className="glass-card rounded-2xl p-4 flex items-center justify-between hover:border-slate-300 transition-all"
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
                      isCredit ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isCredit ? '+' : '-'}₹{t.amount.toFixed(2)}
                  </div>
                  <div>{getStatusBadge(t.status)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
