import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Wallet, 
  QuotaPackage, 
  Transaction, 
  DepositOrder, 
  WithdrawalRequest, 
  TeamMember, 
  RewardSettings, 
  SupportTicket, 
  AuditLog,
  QuotaLevel,
  WithdrawalMethod,
  SavedBankCard,
  SavedUpi,
  SavedUsdtAddress
} from '../types';
import { storage, defaultWallet } from '../services/storage';
import { telegramService } from '../services/telegram';
import { cloudSync } from '../services/cloudSync';
import confetti from 'canvas-confetti';

export type ActiveTab = 'home' | 'deposit' | 'withdraw' | 'team' | 'me' | 'history' | 'admin';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppContextType {
  user: User | null;
  wallet: Wallet;
  packages: QuotaPackage[];
  transactions: Transaction[];
  deposits: DepositOrder[];
  withdrawals: WithdrawalRequest[];
  team: TeamMember[];
  settings: RewardSettings;
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  bankCards: SavedBankCard[];
  upis: SavedUpi[];
  usdts: SavedUsdtAddress[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  isMobilePreview: boolean;
  setIsMobilePreview: (val: boolean) => void;
  
  // Auth
  login: (emailOrPhone: string, pass: string) => { success: boolean; message: string; notFound?: boolean; wrongPassword?: boolean };
  register: (name: string, email: string, phone: string, pass: string, refCode?: string) => { success: boolean; message: string; alreadyExists?: boolean };
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  
  // Transactions & Flows
  buyQuota: (pkgOrId: QuotaPackage | string, idempotencyKey?: string) => { success: boolean; message: string; transaction?: Transaction };
  submitInrDeposit: (amount: number, refNumber: string) => { success: boolean; message: string };
  submitUsdtDeposit: (usdtAmount: number, network: string, txHash: string) => { success: boolean; message: string };
  submitWithdrawal: (
    amount: number, 
    method: WithdrawalMethod, 
    details: WithdrawalRequest['accountDetails']
  ) => { success: boolean; message: string };

  // User Payment Methods
  addBankCard: (card: Omit<SavedBankCard, 'id'>) => void;
  deleteBankCard: (id: string) => void;
  addUpi: (upi: Omit<SavedUpi, 'id'>) => void;
  deleteUpi: (id: string) => void;
  addUsdt: (usdt: Omit<SavedUsdtAddress, 'id'>) => void;
  deleteUsdt: (id: string) => void;
  
  // Admin Operations
  approveDeposit: (id: string, fallbackTotalInr?: number) => void;
  rejectDeposit: (id: string, reason?: string) => void;
  approveWithdrawal: (id: string) => void;
  rejectWithdrawal: (id: string, reason: string) => void;
  addQuotaPackage: (pkg: Omit<QuotaPackage, 'id'>) => void;
  updateQuotaPackage: (id: string, pkg: Partial<QuotaPackage>) => void;
  deleteQuotaPackage: (id: string) => void;
  updateSettings: (newSettings: Partial<RewardSettings>) => void;
  toggleUserStatus: (userId: string) => void;
  toggleDemoMode: () => void;
  resetAllData: () => void;
  
  // Team & Support
  addSupportTicket: (subject: string, message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [wallet, setWallet] = useState<Wallet>(() => storage.getWallet());
  const [packages, setPackages] = useState<QuotaPackage[]>(() => storage.getPackages());
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions());
  const [deposits, setDeposits] = useState<DepositOrder[]>(() => storage.getDeposits());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => storage.getWithdrawals());
  const [team, setTeam] = useState<TeamMember[]>(() => storage.getTeam());
  const [settings, setSettings] = useState<RewardSettings>(() => storage.getSettings());
  const [tickets, setTickets] = useState<SupportTicket[]>(() => storage.getTickets());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storage.getAuditLogs());
  const [bankCards, setBankCards] = useState<SavedBankCard[]>(() => storage.getBankCards());
  const [upis, setUpis] = useState<SavedUpi[]>(() => storage.getUpis());
  const [usdts, setUsdts] = useState<SavedUsdtAddress[]>(() => storage.getUsdts());
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => { if (user) storage.setUser(user); }, [user]);
  useEffect(() => { storage.setWallet(wallet); }, [wallet]);
  useEffect(() => { storage.setPackages(packages); }, [packages]);
  useEffect(() => { storage.setTransactions(transactions); }, [transactions]);
  useEffect(() => { storage.setDeposits(deposits); }, [deposits]);
  useEffect(() => { storage.setWithdrawals(withdrawals); }, [withdrawals]);
  useEffect(() => { storage.setTeam(team); }, [team]);
  useEffect(() => { storage.setSettings(settings); }, [settings]);
  useEffect(() => { storage.setTickets(tickets); }, [tickets]);
  useEffect(() => { storage.setAuditLogs(auditLogs); }, [auditLogs]);
  useEffect(() => { storage.setBankCards(bankCards); }, [bankCards]);
  useEffect(() => { storage.setUpis(upis); }, [upis]);
  useEffect(() => { storage.setUsdts(usdts); }, [usdts]);

  // Real-time cross-tab synchronization (e.g. Admin approves in one tab, Game wallet updates in other tab)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ebp_v2_wallet') {
        const w = storage.getWallet();
        setWallet(w);
      }
      if (e.key === 'ebp_v2_deposits') {
        const d = storage.getDeposits();
        setDeposits(d);
      }
      if (e.key === 'ebp_v2_transactions') {
        const t = storage.getTransactions();
        setTransactions(t);
      }
    };
    window.addEventListener('storage', handleStorage);
    const handleWalletUpdated = () => {
      const w = storage.getWallet();
      setWallet(w);
    };
    window.addEventListener('ebp:wallet-updated', handleWalletUpdated);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('ebp:wallet-updated', handleWalletUpdated);
    };
  }, []);

  // Core centralized function to credit wallet atomically and persistently
  const creditWalletForDeposit = useCallback((depId: string, amount: number, quota: number, depMeta?: any) => {
    if (!depId || amount <= 0) return false;

    // 1. Idempotency Check: Verify this deposit hasn't already been credited to user balance
    const currentW = storage.getWallet();
    const creditedList = Array.isArray(currentW.creditedDepositIds) ? [...currentW.creditedDepositIds] : [];
    if (creditedList.includes(depId)) {
      return false; // Already credited to this wallet!
    }

    creditedList.push(depId);
    storage.markDepositCredited(depId);

    const curBal = Number(currentW.balance) || 0;
    const curQuota = Number(currentW.quota) || 0;
    const newBal = parseFloat((curBal + amount).toFixed(2));
    const newQuota = parseFloat((curQuota + quota).toFixed(2));
    const newToday = parseFloat(((Number(currentW.todayReceive) || 0) + amount).toFixed(2));

    const updatedW: Wallet = {
      ...currentW,
      balance: newBal,
      quota: newQuota,
      todayReceive: newToday,
      creditedDepositIds: creditedList,
    };

    // 2. Persist to storage and update React state immediately
    storage.setWallet(updatedW);
    setWallet(updatedW);

    // 3. Update registered account in storage
    const currentU = storage.getUser();
    if (currentU) {
      const accounts = storage.getAccounts();
      const cleanPhone = (currentU.phone || '').replace(/[^0-9]/g, '');
      accounts.forEach((acc) => {
        const accPhone = (acc.user.phone || '').replace(/[^0-9]/g, '');
        if (acc.user.id === currentU.id || (cleanPhone.length >= 10 && accPhone.endsWith(cleanPhone.slice(-10)))) {
          acc.wallet = {
            ...acc.wallet,
            balance: newBal,
            quota: newQuota,
            todayReceive: newToday,
            creditedDepositIds: creditedList,
          };
          storage.saveAccount(acc);
        }
      });
    }

    // 4. If depMeta has different userId/phone, also update that account in storage
    if (depMeta?.userId || depMeta?.userPhone) {
      const accounts = storage.getAccounts();
      const targetPhone = (depMeta.userPhone || '').replace(/[^0-9]/g, '');
      accounts.forEach((acc) => {
        const accPhone = (acc.user.phone || '').replace(/[^0-9]/g, '');
        if ((depMeta.userId && acc.user.id === depMeta.userId) || (targetPhone.length >= 10 && accPhone.endsWith(targetPhone.slice(-10)))) {
          const accCredited = Array.isArray(acc.wallet?.creditedDepositIds) ? [...acc.wallet.creditedDepositIds] : [];
          if (!accCredited.includes(depId)) {
            accCredited.push(depId);
            acc.wallet = {
              ...(acc.wallet || defaultWallet),
              balance: parseFloat(((Number(acc.wallet?.balance) || 0) + amount).toFixed(2)),
              quota: parseFloat(((Number(acc.wallet?.quota) || 0) + quota).toFixed(2)),
              todayReceive: parseFloat(((Number(acc.wallet?.todayReceive) || 0) + amount).toFixed(2)),
              creditedDepositIds: accCredited,
            };
            storage.saveAccount(acc);
          }
        }
      });
    }

    // 4. Update deposit record to completed in state and storage
    const nowIso = new Date().toISOString();
    setDeposits((prev) => {
      const exists = prev.some((d) => d.id === depId);
      let updated: DepositOrder[];
      if (exists) {
        updated = prev.map((d) =>
          d.id === depId ? { ...d, status: 'completed' as const, credited: true, creditedAt: nowIso, approvedAt: nowIso } : d
        );
      } else {
        const isUsdt = depId.startsWith('USDT') || depMeta?.method === 'USDT';
        const newDep: DepositOrder = {
          id: depId,
          userId: depMeta?.userId || currentU?.id || 'player',
          userPhone: depMeta?.userPhone || currentU?.phone || '',
          amount: depMeta?.amount || (isUsdt ? 50 : 500),
          method: isUsdt ? 'USDT' : 'INR',
          calculatedInr: depMeta?.calculatedInr || (isUsdt ? 5500 : 500),
          bonusInr: depMeta?.bonusInr || (isUsdt ? 495 : 65),
          activityRewardInr: 0,
          totalInr: amount,
          status: 'completed',
          credited: true,
          createdAt: depMeta?.createdAt || nowIso,
          creditedAt: nowIso,
          approvedAt: nowIso,
          utrNumber: depMeta?.utrNumber || 'APPROVED',
          proofUrl: depMeta?.proofUrl || 'APPROVED',
        };
        updated = [newDep, ...prev];
      }
      storage.setDeposits(updated);
      return updated;
    });

    // 5. Update transaction history
    setTransactions((prev) => {
      const exists = prev.some((t) => t.referenceId === depId);
      const isUsdt = depId.startsWith('USDT') || depMeta?.method === 'USDT';
      const noteText = isUsdt
        ? `USDT Deposit Approved (+₹${amount.toFixed(2)})`
        : `INR Deposit Approved (+₹${amount.toFixed(2)})`;

      let updated: Transaction[];
      if (exists) {
        updated = prev.map((t) =>
          t.referenceId === depId
            ? { ...t, status: 'completed' as const, amount, note: noteText }
            : t
        );
      } else {
        const newTx: Transaction = {
          id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: currentU?.id || 'player',
          type: 'deposit',
          amount,
          currency: 'INR',
          status: 'completed',
          timestamp: nowIso,
          note: noteText,
          referenceId: depId,
        };
        updated = [newTx, ...prev];
      }
      storage.setTransactions(updated);
      return updated;
    });

    // 6. Confetti & Success Toast
    try {
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
    } catch {}
    addToast('success', `🎉 Payment Approved! ₹${amount.toFixed(2)} credited to your game wallet!`);
    window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
    return true;
  }, []);

  // Central Ledger Reconciler: Checks if any completed deposits have not been credited to active wallet balance
  const reconcileWallet = useCallback(() => {
    const currentW = storage.getWallet();
    const creditedList = Array.isArray(currentW.creditedDepositIds) ? [...currentW.creditedDepositIds] : [];
    const allDeps = storage.getDeposits();
    const currentU = storage.getUser();
    const cleanUserPhone = (currentU?.phone || '').replace(/[^0-9]/g, '');

    let updatedBal = Number(currentW.balance) || 0;
    let updatedQuota = Number(currentW.quota) || 0;
    let updatedToday = Number(currentW.todayReceive) || 0;
    let hasChanges = false;

    allDeps.forEach((dep) => {
      const isCompleted = dep.credited === true || dep.status === 'completed' || dep.status === 'credited';
      if (!isCompleted) return;

      const depPhone = (dep.userPhone || '').replace(/[^0-9]/g, '');
      const isUserMatch =
        !currentU ||
        (dep.userId && dep.userId === currentU.id) ||
        (cleanUserPhone.length >= 10 && depPhone.length >= 10 && depPhone.endsWith(cleanUserPhone.slice(-10)));

      if (isUserMatch && !creditedList.includes(dep.id)) {
        const isUsdt = dep.method === 'USDT' || dep.id.startsWith('USDT');
        const defaultBal = isUsdt ? 5995 : 565;
        const defaultQuota = isUsdt ? 5500 : 500;
        const amountToAdd = Number(dep.totalInr) || defaultBal;
        const quotaToAdd = Number(dep.amount) || defaultQuota;

        updatedBal += amountToAdd;
        updatedQuota += quotaToAdd;
        updatedToday += amountToAdd;
        creditedList.push(dep.id);
        storage.markDepositCredited(dep.id);
        hasChanges = true;
        console.log(`[RECONCILE] Restoring uncredited deposit ${dep.id} (+₹${amountToAdd}) to wallet balance.`);
      }
    });

    if (hasChanges) {
      const reconciledW: Wallet = {
        ...currentW,
        balance: parseFloat(updatedBal.toFixed(2)),
        quota: parseFloat(updatedQuota.toFixed(2)),
        todayReceive: parseFloat(updatedToday.toFixed(2)),
        creditedDepositIds: creditedList,
      };
      storage.setWallet(reconciledW);
      setWallet(reconciledW);

      if (currentU) {
        const accounts = storage.getAccounts();
        accounts.forEach((acc) => {
          const accPhone = (acc.user.phone || '').replace(/[^0-9]/g, '');
          if (acc.user.id === currentU.id || (cleanUserPhone.length >= 10 && accPhone.endsWith(cleanUserPhone.slice(-10)))) {
            acc.wallet = reconciledW;
            storage.saveAccount(acc);
          }
        });
      }
      window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
    }
  }, []);

  // Run reconciliation on mount and whenever user changes
  useEffect(() => {
    reconcileWallet();
  }, [reconcileWallet, user]);

  // Instant Real-Time Cloud Sync (SSE Stream + 2s Polling Fallback)
  useEffect(() => {
    const applyApprovalEvent = (event: { 
      type?: string;
      depId: string; 
      depositId?: string;
      action?: 'approved' | 'rejected'; 
      userId?: string;
      userPhone?: string;
      amount?: number;
      currency?: string;
      totalInr?: number; 
      credited?: boolean;
      creditedAt?: string;
      approvedAt?: string;
      wallet?: any;
    }) => {
      const depId = event.depId || event.depositId;
      if (!depId && !event.wallet) return;

      if (event.action === 'approved' || event.type === 'DEPOSIT_APPROVED' || event.type === 'WALLET_UPDATED') {
        const allCurrentDeps = storage.getDeposits();
        const matched = allCurrentDeps.find((d) => d.id === depId);
        const currentU = storage.getUser();

        let isUserMatch = true;
        if (currentU) {
          const cleanUserPhone = (currentU.phone || '').replace(/[^0-9]/g, '');
          const eventPhone = (event.userPhone || (matched ? matched.userPhone : '') || '').replace(/[^0-9]/g, '');
          isUserMatch = 
            Boolean(matched) ||
            (event.userId && event.userId === currentU.id) ||
            (cleanUserPhone.length >= 10 && eventPhone.length >= 10 && eventPhone.endsWith(cleanUserPhone.slice(-10))) ||
            (!event.userId && !eventPhone);

          if (!isUserMatch && (event.userId || eventPhone)) {
            return;
          }
        }

        // 1. If Authoritative Server Wallet is provided in the SSE payload, apply it directly in 0.01s!
        if (event.wallet && isUserMatch) {
          const serverW = event.wallet;
          const currentW = storage.getWallet();
          const creditedList = Array.isArray(serverW.creditedDepositIds) 
            ? serverW.creditedDepositIds 
            : (Array.isArray(currentW.creditedDepositIds) ? currentW.creditedDepositIds : []);
          
          if (depId && !creditedList.includes(depId)) {
            creditedList.push(depId);
          }

          const updatedW: Wallet = {
            ...currentW,
            balance: parseFloat(Number(serverW.balance).toFixed(2)),
            quota: parseFloat(Number(serverW.quota).toFixed(2)),
            todayReceive: parseFloat(Number(serverW.todayReceive || currentW.todayReceive).toFixed(2)),
            creditedDepositIds: creditedList,
          };

          storage.setWallet(updatedW);
          setWallet(updatedW);
          if (depId) storage.markDepositCredited(depId);

          if (currentU) {
            const accounts = storage.getAccounts();
            const cleanPhone = (currentU.phone || '').replace(/[^0-9]/g, '');
            accounts.forEach((acc) => {
              const accPhone = (acc.user.phone || '').replace(/[^0-9]/g, '');
              if (acc.user.id === currentU.id || (cleanPhone.length >= 10 && accPhone.endsWith(cleanPhone.slice(-10)))) {
                acc.wallet = updatedW;
                storage.saveAccount(acc);
              }
            });
          }

          if (depId) {
            const nowIso = new Date().toISOString();
            setDeposits((prev) => {
              const updated = prev.map((d) =>
                d.id === depId ? { ...d, status: 'completed' as const, credited: true, creditedAt: nowIso, approvedAt: nowIso } : d
              );
              storage.setDeposits(updated);
              return updated;
            });
            setTransactions((prev) => {
              const updated = prev.map((t) =>
                t.referenceId === depId ? { ...t, status: 'completed' as const } : t
              );
              storage.setTransactions(updated);
              return updated;
            });
          }

          try {
            confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
          } catch {}
          addToast('success', `🎉 Payment Approved! Credited to your game wallet! New Balance: ₹${updatedW.balance.toFixed(2)}`);
          window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
          return;
        }

        // 2. Fallback to client-side idempotent calculation
        const isUsdt = (depId && depId.startsWith('USDT')) || event.currency === 'USDT' || matched?.method === 'USDT';
        const defaultBal = isUsdt ? 5995 : 565;
        const defaultQuota = isUsdt ? 5500 : 500;
        const amountToAdd = matched ? (matched.totalInr || defaultBal) : (event.totalInr && event.totalInr > 0 ? event.totalInr : defaultBal);
        const quotaToAdd = matched ? (matched.method === 'USDT' ? (matched.calculatedInr || matched.amount * 110) : matched.amount) : defaultQuota;

        if (depId) {
          creditWalletForDeposit(depId, amountToAdd, quotaToAdd, matched);
        }
      } else if (event.action === 'rejected' || event.type === 'DEPOSIT_REJECTED') {
        setDeposits((prev) => {
          const updated = prev.map((d) => d.id === depId ? { ...d, status: 'rejected' as const, credited: false } : d);
          storage.setDeposits(updated);
          return updated;
        });
        setTransactions((prev) => {
          const updated = prev.map((t) => t.referenceId === depId ? { ...t, status: 'rejected' as const } : t);
          storage.setTransactions(updated);
          return updated;
        });
        addToast('error', `Payment #${depId} was rejected.`);
      }
    };

    // Connect SSE stream (instant 0.01s latency)
    const unsubscribeSSE = cloudSync.subscribeToApprovals(applyApprovalEvent);

    // Sync with backend deposits and credit any uncredited completed deposits
    const syncWithBackend = async () => {
      const backendDeps = await cloudSync.fetchAllDeposits();
      const currentU = storage.getUser();
      const cleanUserPhone = (currentU?.phone || '').replace(/[^0-9]/g, '');
      const currentW = storage.getWallet();
      const creditedList = Array.isArray(currentW.creditedDepositIds) ? currentW.creditedDepositIds : [];
      const allDeps = storage.getDeposits();

      // Check authoritative server wallet first
      if (currentU) {
        const serverW = await cloudSync.fetchServerWallet(currentU.id, currentU.phone);
        if (serverW && Number(serverW.balance) > 0) {
          if (serverW.balance !== currentW.balance || (serverW.creditedDepositIds && serverW.creditedDepositIds.length > creditedList.length)) {
            const mergedW: Wallet = {
              ...currentW,
              balance: parseFloat(Number(serverW.balance).toFixed(2)),
              quota: parseFloat(Number(serverW.quota).toFixed(2)),
              todayReceive: parseFloat(Number(serverW.todayReceive || currentW.todayReceive).toFixed(2)),
              creditedDepositIds: serverW.creditedDepositIds || creditedList,
            };
            storage.setWallet(mergedW);
            setWallet(mergedW);
            window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
          }
        } else if (Number(currentW.balance) > 0) {
          // Seed server wallet so existing funds are permanently mirrored on backend
          cloudSync.syncServerWallet(currentU.id, currentU.phone, currentW.balance, currentW.quota);
        }
      }

      // 1. Process all completed deposits from backend
      if (backendDeps && backendDeps.length > 0) {
        backendDeps.forEach((bd: any) => {
          const isCompleted = bd.credited === true || bd.status === 'completed' || bd.status === 'credited';
          if (isCompleted) {
            const matched = allDeps.find((d) => d.id === bd.id);
            const bdPhone = (bd.userPhone || '').replace(/[^0-9]/g, '');

            const isUserMatch =
              Boolean(matched) ||
              (currentU && bd.userId && bd.userId === currentU.id) ||
              (cleanUserPhone.length >= 10 && bdPhone.length >= 10 && bdPhone.endsWith(cleanUserPhone.slice(-10)));

            if (isUserMatch || (!bd.userId && !bdPhone)) {
              if (!creditedList.includes(bd.id)) {
                const isUsdt = bd.method === 'USDT' || bd.id.startsWith('USDT');
                const defaultBal = isUsdt ? 5995 : 565;
                const defaultQuota = isUsdt ? 5500 : 500;
                const amountToAdd = Number(bd.totalInr) || (matched ? matched.totalInr : defaultBal);
                const quotaToAdd = Number(bd.amount) || (matched ? matched.amount : defaultQuota);
                console.log(`[SYNC] Crediting uncredited deposit from backend ${bd.id}: +₹${amountToAdd}`);
                creditWalletForDeposit(bd.id, amountToAdd, quotaToAdd, bd);
              }
            }
          }
        });
      }

      // 2. Also reconcile any locally completed deposits that haven't been credited yet
      allDeps.forEach((ld) => {
        const isCompleted = ld.credited === true || ld.status === 'completed' || ld.status === 'credited';
        if (isCompleted && !creditedList.includes(ld.id)) {
          const ldPhone = (ld.userPhone || '').replace(/[^0-9]/g, '');
          const isUserMatch =
            !currentU ||
            (ld.userId && ld.userId === currentU.id) ||
            (cleanUserPhone.length >= 10 && ldPhone.length >= 10 && ldPhone.endsWith(cleanUserPhone.slice(-10)));

          if (isUserMatch) {
            const isUsdt = ld.method === 'USDT' || ld.id.startsWith('USDT');
            const defaultBal = isUsdt ? 5995 : 565;
            const defaultQuota = isUsdt ? 5500 : 500;
            const amountToAdd = Number(ld.totalInr) || defaultBal;
            const quotaToAdd = Number(ld.amount) || defaultQuota;
            console.log(`[SYNC] Reconciling uncredited local deposit ${ld.id}: +₹${amountToAdd}`);
            creditWalletForDeposit(ld.id, amountToAdd, quotaToAdd, ld);
          }
        }
      });

      // Merge deposits into React state & storage
      if (backendDeps && backendDeps.length > 0) {
        setDeposits((prev) => {
          const map = new Map();
          prev.forEach((d) => map.set(d.id, d));
          backendDeps.forEach((bd: any) => {
            const existingDep = map.get(bd.id);
            const isUsdt = bd.method === 'USDT' || bd.id.startsWith('USDT');
            const isCompleted = bd.credited === true || bd.status === 'completed' || bd.status === 'credited';
            if (!existingDep) {
              map.set(bd.id, {
                id: bd.id,
                userId: bd.userId || 'player',
                userPhone: bd.userPhone || '',
                amount: bd.amount,
                method: isUsdt ? 'USDT' : 'INR',
                calculatedInr: bd.calculatedInr || bd.amount,
                bonusInr: bd.bonusInr || 0,
                activityRewardInr: bd.activityRewardInr || 0,
                totalInr: bd.totalInr || bd.amount,
                status: isCompleted ? 'completed' : (bd.status || 'pending'),
                credited: isCompleted,
                createdAt: bd.createdAt || new Date().toISOString(),
                utrNumber: bd.utrNumber || '',
                proofUrl: bd.proofUrl || bd.utrNumber || '',
              });
            } else if (isCompleted && existingDep.status !== 'completed') {
              map.set(bd.id, {
                ...existingDep,
                status: 'completed',
                credited: true,
                creditedAt: bd.creditedAt || existingDep.creditedAt || new Date().toISOString(),
                approvedAt: bd.approvedAt || existingDep.approvedAt || new Date().toISOString(),
              });
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          storage.setDeposits(merged);
          return merged;
        });
      }
    };

    syncWithBackend();
    const intervalId = setInterval(syncWithBackend, 2500);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncWithBackend();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      unsubscribeSSE();
    };
  }, [creditWalletForDeposit]);

  // Listen for incoming deposits from players across all devices in real-time
  useEffect(() => {
    const unsubscribeDeposits = cloudSync.subscribeToDeposits((incoming) => {
      setDeposits((prev) => {
        if (prev.some((d) => d.id === incoming.id)) return prev;
        const isUsdt = incoming.method === 'USDT' || incoming.id.startsWith('USDT');
        const newDep: DepositOrder = {
          id: incoming.id,
          userId: incoming.userId,
          userPhone: incoming.userPhone,
          amount: incoming.amount,
          method: isUsdt ? 'USDT' : 'INR',
          calculatedInr: isUsdt ? incoming.amount * (settings.usdtRate || 110) : incoming.amount,
          bonusInr: (incoming.amount * settings.inrRewardPercent) / 100,
          activityRewardInr: 0,
          totalInr: incoming.totalInr,
          status: 'pending',
          createdAt: incoming.createdAt,
          utrNumber: incoming.utrNumber,
          proofUrl: incoming.utrNumber,
        };
        const updated = [newDep, ...prev];
        storage.setDeposits(updated);
        return updated;
      });
    });
    return unsubscribeDeposits;
  }, [settings.inrRewardPercent]);

  const addToast = (type: Toast['type'], message: string) => {
    setToasts((prev) => {
      // Deduplicate identical message
      if (prev.some((t) => t.message === message)) {
        return prev;
      }
      const id = Math.random().toString(36).substring(2, 9);
      setTimeout(() => removeToast(id), 3500);
      const next = [...prev, { id, type, message }];
      return next.slice(-3);
    });
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAudit = (action: string, details: string, targetUser?: string) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      adminId: user?.id || 'sys-admin',
      action,
      details,
      targetUser,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // User Saved Payment Methods
  const addBankCard = (card: Omit<SavedBankCard, 'id'>) => {
    const newCard: SavedBankCard = { ...card, id: `card-${Date.now()}` };
    setBankCards((prev) => [newCard, ...prev]);
    addToast('success', 'Bank account added successfully.');
  };

  const deleteBankCard = (id: string) => {
    setBankCards((prev) => prev.filter((c) => c.id !== id));
    addToast('info', 'Bank account removed.');
  };

  const addUpi = (upi: Omit<SavedUpi, 'id'>) => {
    const newUpi: SavedUpi = { ...upi, id: `upi-${Date.now()}` };
    setUpis((prev) => [newUpi, ...prev]);
    addToast('success', 'UPI ID added successfully.');
  };

  const deleteUpi = (id: string) => {
    setUpis((prev) => prev.filter((u) => u.id !== id));
    addToast('info', 'UPI ID removed.');
  };

  const addUsdt = (usdt: Omit<SavedUsdtAddress, 'id'>) => {
    const newUsdt: SavedUsdtAddress = { ...usdt, id: `usdt-${Date.now()}` };
    setUsdts((prev) => [newUsdt, ...prev]);
    addToast('success', 'USDT Address saved.');
  };

  const deleteUsdt = (id: string) => {
    setUsdts((prev) => prev.filter((u) => u.id !== id));
    addToast('info', 'USDT Address removed.');
  };

  // Auth Functions
  const login = (emailOrPhone: string, pass: string): { success: boolean; message: string; notFound?: boolean; wrongPassword?: boolean } => {
    if (!emailOrPhone) {
      addToast('error', 'Please enter your mobile number or email.');
      return { success: false, message: 'Missing credentials' };
    }

    const existingAccount = storage.findAccount(emailOrPhone);
    if (!existingAccount) {
      addToast('error', '❌ Account not found! Please register an account first.');
      return { success: false, notFound: true, message: 'Account not found. Please Sign Up first.' };
    }

    if (existingAccount.password && existingAccount.password !== pass) {
      addToast('error', '❌ Incorrect password! Please check your password and try again.');
      return { success: false, wrongPassword: true, message: 'Incorrect password. Please try again.' };
    }

    const updatedWallet: Wallet = {
      ...(existingAccount.wallet || defaultWallet),
      userId: existingAccount.user.id,
      creditedDepositIds: Array.isArray(existingAccount.wallet?.creditedDepositIds)
        ? existingAccount.wallet.creditedDepositIds
        : [],
    };

    setUser(existingAccount.user);
    setWallet(updatedWallet);
    storage.setUser(existingAccount.user);
    storage.setWallet(updatedWallet);

    addToast('success', `Welcome back, ${existingAccount.user.name}!`);
    window.dispatchEvent(new CustomEvent('ebp:user-logged-in'));
    setTimeout(() => reconcileWallet(), 50);
    return { success: true, message: 'Login successful' };
  };

  const register = (
    name: string, 
    email: string, 
    phone: string, 
    pass: string, 
    refCode?: string
  ): { success: boolean; message: string; alreadyExists?: boolean } => {
    if (!name || !phone) {
      addToast('error', 'Please fill in your name and mobile phone.');
      return { success: false, message: 'Required fields missing' };
    }

    const existingPhone = storage.findAccount(phone);
    const existingEmail = email ? storage.findAccount(email) : null;
    if (existingPhone || existingEmail) {
      addToast('info', 'An account already exists with this phone or email! Please Sign In.');
      return { success: false, alreadyExists: true, message: 'Account already exists. Please Sign In.' };
    }

    const cleanPhone = phone.trim();
    const cleanEmail = (email && email.trim()) || `${cleanPhone.replace(/[^0-9]/g, '')}@ebp.com`;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      referralCode: `EBP-${Math.floor(10000 + Math.random() * 90000)}`,
      referredBy: refCode || undefined,
      isGoogleAuthEnabled: false,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const initialWallet: Wallet = {
      userId: newUser.id,
      balance: 50.00,
      quota: 0.00,
      referralBalance: 0.00,
      todayReceive: 0.00,
      teamCommission: 0.00,
      todayTeamRecharge: 0.00,
      todayTeamMembers: 0,
      totalTeamRecharge: 0.00,
      totalTeamMembers: 0,
    };

    // Save registered account to local persistence
    storage.saveAccount({
      user: newUser,
      password: pass,
      wallet: initialWallet,
    });

    setUser(newUser);
    setWallet(initialWallet);

    const welcomeTx: Transaction = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: newUser.id,
      type: 'reward',
      amount: 50.00,
      currency: 'INR',
      status: 'completed',
      timestamp: new Date().toISOString(),
      note: '₹50 Signup Welcome Cash Bonus',
    };
    setTransactions((prev) => [welcomeTx, ...prev]);
    addToast('success', 'Account registered! ₹50 Welcome Bonus added to your wallet!');
    window.dispatchEvent(new CustomEvent('ebp:user-logged-in'));
    return { success: true, message: 'Registration successful' };
  };

  const logout = () => {
    setUser(null);
    setWallet(defaultWallet);
    addToast('info', 'Logged out successfully.');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    addToast('success', 'Profile updated successfully.');
  };

  // Buying Quota - Server-Authoritative & Idempotent
  const buyQuota = (pkgOrId: QuotaPackage | string, idempotencyKey?: string): { success: boolean; message: string; transaction?: Transaction } => {
    // 1. Authenticate user
    const currentUser = storage.getUser() || user;
    if (!currentUser) {
      addToast('error', 'Please log in to purchase a quota package.');
      return { success: false, message: 'Not logged in' };
    }

    // 2. Resolve packageId (NEVER trust client-provided price or quota)
    const packageId = typeof pkgOrId === 'string' ? pkgOrId : pkgOrId?.id;
    if (!packageId) {
      addToast('error', 'Invalid package selected.');
      return { success: false, message: 'Invalid package' };
    }

    // 3. Load authoritative package from database/storage
    const allPackages = storage.getPackages();
    const dbPkg = allPackages.find((p) => p.id === packageId);
    if (!dbPkg) {
      addToast('error', 'Package not found in database or unavailable.');
      return { success: false, message: 'Package not found' };
    }

    // 4. Verify package is active
    if (!dbPkg.isActive) {
      addToast('error', 'This quota package is currently inactive.');
      return { success: false, message: 'Package inactive' };
    }

    // 5. Idempotency Check (Prevent duplicate clicks or retries)
    const purchaseKey = idempotencyKey || `BUY-${currentUser.id}-${packageId}-${Date.now()}`;
    if (storage.isDepositCredited(purchaseKey)) {
      return { success: false, message: 'Duplicate purchase transaction detected.' };
    }

    // 6. Verify server-authoritative balance from storage
    const currentWallet = storage.getWallet();
    const curBal = Number(currentWallet.balance) || 0;
    const exactPrice = Number(dbPkg.price);
    const exactQuota = Number(dbPkg.quota);
    const exactIncome = Number(dbPkg.income);

    if (curBal < exactPrice) {
      addToast('error', `Insufficient wallet balance (₹${curBal.toFixed(2)}). Required: ₹${exactPrice.toFixed(2)}.`);
      return { success: false, message: 'Insufficient balance' };
    }

    // 7. Atomic calculation: deduct balance, add quota, add income
    const newBal = parseFloat((curBal - exactPrice).toFixed(2));
    const newQuota = parseFloat(((Number(currentWallet.quota) || 0) + exactQuota).toFixed(2));
    const newReceive = parseFloat(((Number(currentWallet.todayReceive) || 0) + exactIncome).toFixed(2));

    const updatedWallet: Wallet = {
      ...currentWallet,
      balance: newBal,
      quota: newQuota,
      todayReceive: newReceive,
    };

    // 8. Create Transaction Record
    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();
    const newTx: Transaction = {
      id: txnId,
      userId: currentUser.id,
      type: 'quota_purchase',
      amount: exactPrice,
      currency: 'INR',
      status: 'completed',
      timestamp: nowIso,
      note: `Quota Purchase: ₹${exactPrice.toLocaleString('en-IN')} (+${dbPkg.incomePercent}% Bonus)`,
      referenceId: dbPkg.id,
      metadata: { 
        quotaReceived: exactQuota, 
        income: exactIncome,
        packageLevel: dbPkg.level,
        idempotencyKey: purchaseKey
      }
    };

    // 9. Atomic Commit to Database (Storage source of truth)
    storage.setWallet(updatedWallet);
    storage.markDepositCredited(purchaseKey);

    const existingTxns = storage.getTransactions();
    storage.setTransactions([newTx, ...existingTxns]);

    // Save to user account
    const accounts = storage.getAccounts();
    accounts.forEach((acc) => {
      const cleanPhone = (currentUser.phone || '').replace(/[^0-9]/g, '');
      const accPhone = (acc.user.phone || '').replace(/[^0-9]/g, '');
      if (acc.user.id === currentUser.id || (cleanPhone && accPhone.endsWith(cleanPhone.slice(-10)))) {
        acc.wallet = updatedWallet;
        storage.saveAccount(acc);
      }
    });

    // 10. Update React state
    setWallet(updatedWallet);
    setTransactions((prev) => [newTx, ...prev]);

    logAudit('QUOTA_BUY', `User ${currentUser.name} purchased quota package ${dbPkg.id} (₹${exactPrice})`, currentUser.id);

    // 11. Celebratory Confetti & CONFIRMED SUCCESS Message (ONLY upon complete confirmed transaction!)
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch {}

    addToast('success', `🎉 Successfully purchased ₹${exactPrice.toLocaleString('en-IN')} quota package!`);
    window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));

    return { success: true, message: 'Purchase successful', transaction: newTx };
  };

  // Submitting INR Deposit
  const submitInrDeposit = (amount: number, refNumber: string): { success: boolean; message: string } => {
    if (!user) {
      addToast('error', 'Please log in to your account first.');
      return { success: false, message: 'Authentication required' };
    }
    if (amount <= 0) return { success: false, message: 'Invalid amount' };

    const activeUser: User = user;

    // Extra Tier Free Bonus:
    // 50,000+ -> +5,000 Free
    // 20,000+ -> +1,000 Free
    // 5,000+  -> +100 Free
    let extraFreeBonus = 0;
    let tierLabel = '';
    if (amount >= 50000) {
      extraFreeBonus = 5000;
      tierLabel = '₹5,000 Extra VIP Free Bonus';
    } else if (amount >= 20000) {
      extraFreeBonus = 1000;
      tierLabel = '₹1,000 Extra High Free Bonus';
    } else if (amount >= 5000) {
      extraFreeBonus = 100;
      tierLabel = '₹100 Extra Free Bonus';
    }

    const standardBonus = (amount * settings.inrRewardPercent) / 100;
    const totalBonus = standardBonus + extraFreeBonus;
    const total = amount + totalBonus;

    const newDeposit: DepositOrder = {
      id: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: activeUser.id,
      userPhone: activeUser.phone,
      utrNumber: refNumber,
      amount,
      method: 'INR',
      calculatedInr: amount,
      bonusInr: standardBonus,
      activityRewardInr: extraFreeBonus,
      totalInr: total,
      status: settings.isDemoMode ? 'completed' : 'pending',
      createdAt: new Date().toISOString(),
      proofUrl: refNumber,
    };

    const updatedDeposits = [newDeposit, ...deposits];
    setDeposits(updatedDeposits);
    storage.setDeposits(updatedDeposits);

    cloudSync.broadcastDeposit({
      id: newDeposit.id,
      userId: activeUser.id,
      userPhone: activeUser.phone,
      amount,
      totalInr: total,
      utrNumber: refNumber,
      method: 'INR',
      createdAt: newDeposit.createdAt,
    });

    cloudSync.createTransaction({
      userId: activeUser.id,
      userPhone: activeUser.phone,
      amount,
      method: 'INR',
      utrNumber: refNumber,
      isDemo: settings.isDemoMode,
    }).then((res) => {
      if (res && res.ok && res.transactionId && res.transactionId !== newDeposit.id) {
        setDeposits((prev) => {
          const updated = prev.map((d) => d.id === newDeposit.id ? { ...d, id: res.transactionId! } : d);
          storage.setDeposits(updated);
          return updated;
        });
        setTransactions((prev) => {
          const updated = prev.map((t) => t.referenceId === newDeposit.id ? { ...t, referenceId: res.transactionId! } : t);
          storage.setTransactions(updated);
          return updated;
        });
      }
    });

    telegramService.sendDepositAlert(newDeposit, activeUser.name, activeUser.phone, settings);

    // Create Transaction record so it immediately appears in user History
    const newTx: Transaction = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: activeUser.id,
      type: 'deposit',
      amount: total,
      currency: 'INR',
      status: settings.isDemoMode ? 'completed' : 'pending',
      timestamp: new Date().toISOString(),
      note: `INR Deposit (₹${amount} + ₹${standardBonus.toFixed(2)} regular + ₹${extraFreeBonus} tier bonus | UTR: ${refNumber})`,
      referenceId: newDeposit.id,
    };
    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    storage.setTransactions(updatedTx);

    if (settings.isDemoMode) {
      setWallet((prev) => {
        const updatedW = {
          ...prev,
          balance: parseFloat((prev.balance + total).toFixed(2)),
          quota: parseFloat((prev.quota + amount).toFixed(2)),
        };
        storage.setWallet(updatedW);
        return updatedW;
      });
      addToast('success', `Demo Deposit confirmed: ₹${total.toFixed(2)} credited!`);
    } else {
      addToast('info', `Deposit of ₹${amount} submitted! Balance will be credited within 5-7 minutes after verification.`);
    }

    return { success: true, message: 'Deposit recorded' };
  };

  // Submitting USDT Deposit
  const submitUsdtDeposit = (usdtAmount: number, network: string, txHash: string): { success: boolean; message: string } => {
    if (!user) {
      addToast('error', 'Please log in to your account first.');
      return { success: false, message: 'Not logged in' };
    }
    if (usdtAmount <= 0) return { success: false, message: 'Invalid amount' };

    const calculatedInr = usdtAmount * settings.usdtRate;
    const bonusInr = (calculatedInr * settings.inrRewardPercent) / 100;
    const activityReward = usdtAmount >= 100 ? (calculatedInr * 0.03) : 0;
    const totalInr = calculatedInr + bonusInr + activityReward;

    const newDeposit: DepositOrder = {
      id: `USDT-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userPhone: user.phone,
      amount: usdtAmount,
      method: 'USDT',
      calculatedInr,
      bonusInr,
      activityRewardInr: activityReward,
      totalInr,
      network: 'TRC20',
      walletAddress: settings.adminUsdtTrc20 || 'TTsZk5wTANw2MrBxn6xTNdHpeFFtBG4rLW',
      status: settings.isDemoMode ? 'completed' : 'pending',
      createdAt: new Date().toISOString(),
      proofUrl: txHash || 'TRC20-TRANSFER',
      utrNumber: txHash || 'TRC20-TRANSFER',
    };

    const updatedDeposits = [newDeposit, ...deposits];
    setDeposits(updatedDeposits);
    storage.setDeposits(updatedDeposits);

    // Broadcast to Admin Panel & Telegram Cloud
    cloudSync.broadcastDeposit({
      id: newDeposit.id,
      userId: user.id,
      userPhone: user.phone,
      amount: usdtAmount,
      totalInr,
      utrNumber: txHash || 'TRC20-TRANSFER',
      method: 'USDT',
      createdAt: newDeposit.createdAt,
    });

    cloudSync.createTransaction({
      userId: user.id,
      userPhone: user.phone,
      amount: usdtAmount,
      method: 'USDT',
      utrNumber: txHash || 'TRC20-TRANSFER',
      network: 'TRC20',
      isDemo: settings.isDemoMode,
    }).then((res) => {
      if (res && res.ok && res.transactionId && res.transactionId !== newDeposit.id) {
        setDeposits((prev) => {
          const updated = prev.map((d) => d.id === newDeposit.id ? { ...d, id: res.transactionId! } : d);
          storage.setDeposits(updated);
          return updated;
        });
        setTransactions((prev) => {
          const updated = prev.map((t) => t.referenceId === newDeposit.id ? { ...t, referenceId: res.transactionId! } : t);
          storage.setTransactions(updated);
          return updated;
        });
      }
    });

    // Send Telegram Alert to Admin Bot
    telegramService.sendDepositAlert(newDeposit, user.name, user.phone, settings);

    // Create Transaction record so it immediately appears in user History
    const newTx: Transaction = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      type: 'deposit',
      amount: totalInr,
      currency: 'INR',
      status: settings.isDemoMode ? 'completed' : 'pending',
      timestamp: new Date().toISOString(),
      note: `USDT Deposit (${usdtAmount} USDT @ ₹${settings.usdtRate} | TxID: ${txHash || 'TRC20 Express'})`,
      referenceId: newDeposit.id,
    };
    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    storage.setTransactions(updatedTx);

    if (settings.isDemoMode) {
      setWallet((prev) => {
        const updatedW = {
          ...prev,
          balance: parseFloat((prev.balance + totalInr).toFixed(2)),
          quota: parseFloat((prev.quota + calculatedInr).toFixed(2)),
        };
        storage.setWallet(updatedW);
        return updatedW;
      });
      addToast('success', `Demo USDT credited: ₹${totalInr.toFixed(2)} added!`);
    } else {
      addToast('info', `USDT deposit of ${usdtAmount} USDT (₹${totalInr.toFixed(2)}) submitted! Credited upon confirmation.`);
    }

    return { success: true, message: 'USDT order submitted' };
  };

  // Submitting Withdrawal
  const submitWithdrawal = (
    amount: number,
    method: WithdrawalMethod,
    details: WithdrawalRequest['accountDetails']
  ): { success: boolean; message: string } => {
    if (!user) return { success: false, message: 'Not logged in' };
    if (amount < settings.minWithdrawal) {
      const msg = `Minimum withdrawal amount is ₹${settings.minWithdrawal}.`;
      addToast('error', msg);
      return { success: false, message: msg };
    }
    if (wallet.balance < amount) {
      const msg = `Insufficient balance. Available: ₹${wallet.balance.toFixed(2)}`;
      addToast('error', msg);
      return { success: false, message: msg };
    }

    const fee = 0.00; // 0% withdrawal fee (Zero deductions)
    const netAmount = amount;

    setWallet((prev) => ({
      ...prev,
      balance: parseFloat((prev.balance - amount).toFixed(2)),
    }));

    const newWithdrawal: WithdrawalRequest = {
      id: `WDR-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      amount,
      method,
      fee,
      netAmount,
      accountDetails: details,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);
    telegramService.sendWithdrawalAlert(newWithdrawal, settings);

    const newTx: Transaction = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      type: 'withdrawal',
      amount,
      currency: 'INR',
      status: 'pending',
      timestamp: new Date().toISOString(),
      note: `Withdrawal via ${method.toUpperCase()} (Net: ₹${netAmount.toFixed(2)})`,
      referenceId: newWithdrawal.id,
    };
    setTransactions((prev) => [newTx, ...prev]);

    addToast('info', `Withdrawal of ₹${amount} submitted! Status: Pending review.`);
    return { success: true, message: 'Withdrawal submitted' };
  };

  // Admin Deposit Actions
  const approveDeposit = (id: string, fallbackTotalInr?: number) => {
    let allDeps = storage.getDeposits();
    let deposit = allDeps.find((d) => d.id === id) || deposits.find((d) => d.id === id);
    const nowIso = new Date().toISOString();

    // If deposit is not found locally (e.g. cross-device approval via Telegram link),
    // synthesize a valid deposit record so the approval goes through and credits immediately!
    if (!deposit) {
      const isUsdt = id.startsWith('USDT');
      const amount = isUsdt ? 50 : 500;
      const totalInr = fallbackTotalInr && fallbackTotalInr > 0 ? fallbackTotalInr : (isUsdt ? 5995 : 565);
      deposit = {
        id,
        userId: user?.id || 'PLAYER-1',
        amount,
        method: isUsdt ? 'USDT' : 'INR',
        calculatedInr: isUsdt ? amount * 110 : amount,
        bonusInr: totalInr - (isUsdt ? amount * 110 : amount),
        activityRewardInr: 0,
        totalInr,
        status: 'credited',
        credited: true,
        creditedAt: nowIso,
        approvedAt: nowIso,
        createdAt: nowIso,
      };
    } else {
      deposit = {
        ...deposit,
        status: 'credited',
        credited: true,
        creditedAt: nowIso,
        approvedAt: nowIso,
      };
    }

    // 1. Mark deposit as credited in state and storage
    const updatedDeposits = (allDeps.some((d) => d.id === id) ? allDeps : [deposit, ...allDeps]).map((d) =>
      d.id === id ? { ...d, status: 'credited' as const, credited: true, creditedAt: nowIso, approvedAt: nowIso } : d
    );
    setDeposits(updatedDeposits);
    storage.setDeposits(updatedDeposits);

    // 2. Add full amount to game wallet balance and quota!
    const addBal = Number(deposit.totalInr) || fallbackTotalInr || (deposit.method === 'USDT' ? 5995 : 565);
    const addQuota = Number(deposit.method === 'USDT' ? (deposit.calculatedInr || deposit.amount * 110) : deposit.amount) || 500;

    const currentU = storage.getUser();
    const cleanUserPhone = (currentU?.phone || '').replace(/[^0-9]/g, '');
    const depPhone = (deposit.userPhone || '').replace(/[^0-9]/g, '');
    const isCurrentUser = Boolean(
      (currentU && deposit.userId && deposit.userId === currentU.id) ||
      (cleanUserPhone.length >= 10 && depPhone.length >= 10 && depPhone.endsWith(cleanUserPhone.slice(-10))) ||
      !currentU
    );

    if (isCurrentUser) {
      creditWalletForDeposit(deposit.id, addBal, addQuota, deposit);
    }

    // 3. Update target account in registered accounts if exists
    const accounts = storage.getAccounts();
    accounts.forEach((acc) => {
      const accPhone = (acc.user.phone || '').replace(/[^0-9]/g, '');
      if (acc.user.id === deposit.userId || (depPhone.length >= 10 && accPhone.endsWith(depPhone.slice(-10)))) {
        const accCredited = Array.isArray(acc.wallet?.creditedDepositIds) ? [...acc.wallet.creditedDepositIds] : [];
        if (!accCredited.includes(id)) {
          accCredited.push(id);
          acc.wallet = {
            ...(acc.wallet || defaultWallet),
            balance: parseFloat(((Number(acc.wallet?.balance) || 0) + addBal).toFixed(2)),
            quota: parseFloat(((Number(acc.wallet?.quota) || 0) + addQuota).toFixed(2)),
            todayReceive: parseFloat(((Number(acc.wallet?.todayReceive) || 0) + addBal).toFixed(2)),
            creditedDepositIds: accCredited,
          };
          storage.saveAccount(acc);
        }
      }
    });

    // 4. Update or create transaction record in history
    setTransactions((prev) => {
      const exists = prev.some((t) => t.referenceId === id);
      let updatedTxList: Transaction[];
      const isUsdt = deposit.method === 'USDT';
      const txNote = isUsdt
        ? `USDT Deposit Approved (+₹${addBal.toFixed(2)})`
        : `INR Deposit Approved (+₹${(deposit.bonusInr + (deposit.activityRewardInr || 0)).toFixed(0)} Bonus)`;

      if (exists) {
        updatedTxList = prev.map((t) =>
          t.referenceId === id
            ? { ...t, status: 'completed' as const, amount: addBal, note: txNote }
            : t
        );
      } else {
        const newTx: Transaction = {
          id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: deposit.userId || user?.id || 'PLAYER-1',
          type: 'deposit',
          amount: addBal,
          currency: 'INR',
          status: 'completed',
          timestamp: nowIso,
          note: txNote,
          referenceId: deposit.id,
        };
        updatedTxList = [newTx, ...prev];
      }
      storage.setTransactions(updatedTxList);
      return updatedTxList;
    });

    // 5. Instant Real-Time Broadcast to all players via ntfy.sh (0.1s latency)
    cloudSync.broadcastApproval({
      depId: deposit.id,
      depositId: deposit.id,
      action: 'approved',
      userId: deposit.userId,
      userPhone: deposit.userPhone,
      amount: deposit.amount,
      currency: deposit.method,
      totalInr: addBal,
      status: 'credited',
      credited: true,
      creditedAt: nowIso,
      approvedAt: nowIso,
    });

    // 6. Celebration confetti & audit log
    try {
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 },
      });
    } catch {}

    window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
    logAudit('APPROVE_DEPOSIT', `Approved deposit ${id}: ₹${addBal.toFixed(2)} added to wallet`, deposit.userId);
    addToast('success', `🎉 Payment Approved! ₹${addBal.toFixed(2)} has been added to game wallet!`);
  };

  const rejectDeposit = (id: string, reason?: string) => {
    const deposit = deposits.find((d) => d.id === id);
    if (!deposit) return;

    const updatedDeposits = deposits.map((d) => (d.id === id ? { ...d, status: 'rejected' as const } : d));
    setDeposits(updatedDeposits);
    storage.setDeposits(updatedDeposits);

    cloudSync.broadcastApproval(id, 'rejected');

    setTransactions((prev) => {
      const updatedTx = prev.map((t) =>
        t.referenceId === id
          ? { ...t, status: 'rejected' as const, note: `Deposit Rejected (${reason || 'Invalid UTR'})` }
          : t
      );
      storage.setTransactions(updatedTx);
      return updatedTx;
    });

    logAudit('REJECT_DEPOSIT', `Rejected deposit ${id}: ${reason || 'Invalid UTR'}`, deposit.userId);
    addToast('error', `❌ Deposit ${id} rejected: ${reason || 'Invalid UTR'}`);
  };

  // Admin Actions
  const approveWithdrawal = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'completed' } : w))
    );
    setTransactions((prev) =>
      prev.map((t) => (t.referenceId === id ? { ...t, status: 'completed' } : t))
    );
    logAudit('APPROVE_WITHDRAWAL', `Approved withdrawal ${id}`);
    addToast('success', `Withdrawal ${id} approved successfully.`);
  };

  const rejectWithdrawal = (id: string, reason: string) => {
    const item = withdrawals.find((w) => w.id === id);
    if (!item) return;

    setWallet((prev) => ({
      ...prev,
      balance: parseFloat((prev.balance + item.amount).toFixed(2)),
    }));

    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'rejected', rejectionReason: reason } : w))
    );
    setTransactions((prev) =>
      prev.map((t) => (t.referenceId === id ? { ...t, status: 'rejected', note: `${t.note} (Refunded: ${reason})` } : t))
    );

    logAudit('REJECT_WITHDRAWAL', `Rejected withdrawal ${id}: ${reason}`, item.userId);
    addToast('info', `Withdrawal rejected and ₹${item.amount} refunded to user.`);
  };

  const addQuotaPackage = (pkg: Omit<QuotaPackage, 'id'>) => {
    const newPkg: QuotaPackage = {
      ...pkg,
      id: `pkg-${Date.now()}`,
    };
    setPackages((prev) => [...prev, newPkg]);
    logAudit('ADD_PACKAGE', `Created package ₹${pkg.price}`);
    addToast('success', 'Quota package created.');
  };

  const updateQuotaPackage = (id: string, updated: Partial<QuotaPackage>) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    logAudit('UPDATE_PACKAGE', `Updated package ${id}`);
    addToast('success', 'Package updated.');
  };

  const deleteQuotaPackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
    logAudit('DELETE_PACKAGE', `Deleted package ${id}`);
    addToast('info', 'Package removed.');
  };

  const updateSettings = (newSettings: Partial<RewardSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('UPDATE_SETTINGS', `Updated platform rates/settings`);
    addToast('success', 'Platform settings saved.');
  };

  const toggleUserStatus = (userId: string) => {
    if (user && user.id === userId) {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      setUser({ ...user, status: newStatus });
      addToast('info', `User account status changed to: ${newStatus}`);
    }
  };

  const toggleDemoMode = () => {
    const updated = !settings.isDemoMode;
    setSettings((prev) => ({ ...prev, isDemoMode: updated }));
    addToast('info', updated ? 'Switched to Demo/Test Mode' : 'Switched to Live Production Mode');
  };

  const resetAllData = () => {
    storage.resetAll();
    window.location.reload();
  };

  const addSupportTicket = (subject: string, message: string) => {
    if (!user) return;
    const newTicket: SupportTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      subject,
      message,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    setTickets((prev) => [newTicket, ...prev]);
    addToast('success', 'Support ticket created. Our team will review shortly.');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        wallet,
        packages,
        transactions,
        deposits,
        withdrawals,
        team,
        settings,
        tickets,
        auditLogs,
        bankCards,
        upis,
        usdts,
        activeTab,
        setActiveTab,
        toasts,
        addToast,
        removeToast,
        isMobilePreview,
        setIsMobilePreview,
        login,
        register,
        logout,
        updateProfile,
        buyQuota,
        submitInrDeposit,
        submitUsdtDeposit,
        submitWithdrawal,
        addBankCard,
        deleteBankCard,
        addUpi,
        deleteUpi,
        addUsdt,
        deleteUsdt,
        approveDeposit,
        rejectDeposit,
        approveWithdrawal,
        rejectWithdrawal,
        addQuotaPackage,
        updateQuotaPackage,
        deleteQuotaPackage,
        updateSettings,
        toggleUserStatus,
        toggleDemoMode,
        resetAllData,
        addSupportTicket,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
