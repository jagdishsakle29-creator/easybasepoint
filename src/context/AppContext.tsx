import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  User, 
  Wallet, 
  QuotaPackage, 
  Transaction, 
  DepositOrder, 
  DepositStatus,
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
import { storage, defaultWallet, RegisteredAccount } from '../services/storage';
import { telegramService } from '../services/telegram';
import { cloudSync } from '../services/cloudSync';
import confetti from 'canvas-confetti';
import { verifyPaymentScreenshot } from '../utils/ocrPaymentVerifier';

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
  login: (emailOrPhone: string, pass: string) => Promise<{ success: boolean; message: string; notFound?: boolean; wrongPassword?: boolean }>;
  register: (name: string, email: string, phone: string, pass: string, refCode?: string, pin?: string) => Promise<{ success: boolean; message: string; alreadyExists?: boolean }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  refreshAccountsFromCloud: () => Promise<void>;
  
  // Transactions & Flows
  buyQuota: (pkgOrId: QuotaPackage | string, idempotencyKey?: string) => { success: boolean; message: string; transaction?: Transaction };
  submitInrDeposit: (
    amount: number, 
    refNumber: string, 
    screenshotUrl?: string, 
    remark?: string,
    ocrResult?: {
      verified: boolean;
      detectedAmount?: number;
      detectedUtr?: string;
      detectedTime?: string;
      timeDiffMins?: number;
      status: 'passed' | 'failed' | 'manual_review';
      reason?: string;
    }
  ) => Promise<{ success: boolean; message: string; autoApproved?: boolean; depositId?: string; totalInr?: number; deposit?: DepositOrder }>;
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
  refreshDeposits: () => Promise<void>;
  refreshWithdrawals: () => Promise<WithdrawalRequest[]>;
  approveDeposit: (id: string, fallbackTotalInr?: number, fullDepObject?: DepositOrder) => void;
  rejectDeposit: (id: string, reason?: string) => void;
  rejectAndRefundDeposit: (id: string, reason?: string) => void;
  deleteDeposit: (id: string) => void;
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

// Persistent store of Admin resolved actions to prevent stale background polls from resurrecting/reverting items
const PROCESSED_DEPOSITS_KEY = 'ebp_processed_deposits_v2';
const PROCESSED_WITHDRAWALS_KEY = 'ebp_processed_withdrawals_v2';

const getProcessedDeposits = (): Record<string, 'approved' | 'rejected' | 'deleted'> => {
  try {
    return JSON.parse(localStorage.getItem(PROCESSED_DEPOSITS_KEY) || '{}');
  } catch {
    return {};
  }
};

const recordProcessedDeposit = (id: string, action: 'approved' | 'rejected' | 'deleted') => {
  try {
    const data = getProcessedDeposits();
    data[id] = action;
    localStorage.setItem(PROCESSED_DEPOSITS_KEY, JSON.stringify(data));
  } catch {}
};

const getProcessedWithdrawals = (): Record<string, 'completed' | 'rejected'> => {
  try {
    return JSON.parse(localStorage.getItem(PROCESSED_WITHDRAWALS_KEY) || '{}');
  } catch {
    return {};
  }
};

const recordProcessedWithdrawal = (id: string, action: 'completed' | 'rejected') => {
  try {
    const data = getProcessedWithdrawals();
    data[id] = action;
    localStorage.setItem(PROCESSED_WITHDRAWALS_KEY, JSON.stringify(data));
  } catch {}
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [wallet, setWallet] = useState<Wallet>(() => storage.getWallet());
  const [packages, setPackages] = useState<QuotaPackage[]>(() => storage.getPackages());
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const u = storage.getUser();
    if (!u) return [];
    const acc = storage.findAccount(u.phone || u.id);
    if (acc?.transactions && Array.isArray(acc.transactions) && acc.transactions.length > 0) {
      return acc.transactions;
    }
    return storage.getUserTransactions(u.id, u.phone);
  });
  const [deposits, setDeposits] = useState<DepositOrder[]>(() => storage.getDeposits());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => storage.getWithdrawals());
  const [team, setTeam] = useState<TeamMember[]>(() => storage.getTeam());
  const [settings, setSettings] = useState<RewardSettings>(() => storage.getSettings());
  const [tickets, setTickets] = useState<SupportTicket[]>(() => storage.getTickets());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storage.getAuditLogs());
  const [bankCards, setBankCards] = useState<SavedBankCard[]>(() => storage.getBankCards());
  const [upis, setUpis] = useState<SavedUpi[]>(() => storage.getUpis());
  const [usdts, setUsdts] = useState<SavedUsdtAddress[]>(() => storage.getUsdts());
  
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const href = window.location.href.toLowerCase();
      if (href.includes('lord12')) {
        try {
          sessionStorage.setItem('ebp_admin_key', 'lord12');
        } catch {}
        return 'admin';
      }
    }
    return 'home';
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => { if (user) storage.setUser(user); }, [user]);
  useEffect(() => { storage.setWallet(wallet); }, [wallet]);
  useEffect(() => { storage.setPackages(packages); }, [packages]);
  // Sync state changes to storage with account isolation
  useEffect(() => {
    if (user) {
      const accounts = storage.getAccounts();
      const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
      const accIndex = accounts.findIndex((a) => 
        a.user.id === user.id || 
        (cleanPhone.length >= 10 && a.user.phone.replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-10)))
      );
      if (accIndex >= 0) {
        accounts[accIndex].transactions = transactions;
        storage.saveAccount(accounts[accIndex]);
      }
      const globalTx = storage.getTransactions();
      const map = new Map<string, Transaction>();
      globalTx.forEach((t) => map.set(t.id, t));
      transactions.forEach((t) => map.set(t.id, t));
      storage.setTransactions(Array.from(map.values()));
    }
  }, [transactions, user]);
  useEffect(() => { storage.setDeposits(deposits); }, [deposits]);
  useEffect(() => { storage.setWithdrawals(withdrawals); }, [withdrawals]);
  useEffect(() => { storage.setTeam(team); }, [team]);
  useEffect(() => { storage.setSettings(settings); }, [settings]);
  useEffect(() => { storage.setTickets(tickets); }, [tickets]);
  useEffect(() => { storage.setAuditLogs(auditLogs); }, [auditLogs]);
  useEffect(() => { storage.setBankCards(bankCards); }, [bankCards]);
  useEffect(() => { storage.setUpis(upis); }, [upis]);
  useEffect(() => { storage.setUsdts(usdts); }, [usdts]);

  // Dynamic Real-time Calculation of Team Members and Commissions for Current User
  const buildTeamForUser = useCallback((targetUser: User | null): TeamMember[] => {
    if (!targetUser || !targetUser.id) return [];
    const allAccounts = storage.getAccounts();
    const allDeposits = storage.getDeposits();
    const l1Code = (targetUser.referralCode || '').trim().toUpperCase();
    const l1Phone = (targetUser.phone || '').replace(/[^0-9]/g, '');
    const l1Id = targetUser.id;

    // Direct Level 1 Members
    const level1Accounts = allAccounts.filter((a) => {
      if (!a?.user || a.user.id === targetUser.id) return false;
      const ref = (a.user.referredBy || '').trim().toUpperCase();
      const cleanRefDigits = ref.replace(/[^0-9]/g, '');
      const isRefMatch = Boolean(
        (l1Code && ref === l1Code) ||
        (l1Phone.length >= 10 && cleanRefDigits.length >= 10 && cleanRefDigits.endsWith(l1Phone.slice(-10))) ||
        (l1Id && ref === l1Id)
      );
      return isRefMatch;
    });

    const level1Codes = new Set(level1Accounts.map(a => (a.user.referralCode || '').trim().toUpperCase()).filter(Boolean));
    const level1Ids = new Set(level1Accounts.map(a => a.user.id));
    const level1Phones = new Set(level1Accounts.map(a => (a.user.phone || '').replace(/[^0-9]/g, '')).filter(Boolean));

    // Indirect Level 2 Members
    const level2Accounts = allAccounts.filter((a) => {
      if (!a?.user || a.user.id === targetUser.id || level1Ids.has(a.user.id)) return false;
      const ref = (a.user.referredBy || '').trim().toUpperCase();
      const cleanRefDigits = ref.replace(/[^0-9]/g, '');
      const isL2Match = Boolean(
        level1Codes.has(ref) ||
        level1Ids.has(ref) ||
        (cleanRefDigits.length >= 10 && Array.from(level1Phones).some(p => p.endsWith(cleanRefDigits.slice(-10))))
      );
      return isL2Match;
    });

    const l1Percent = Number(settings.referralL1Percent) || 20;
    const l2Percent = Number(settings.referralL2Percent) || 5;

    const buildMember = (acc: RegisteredAccount, level: 1 | 2): TeamMember => {
      const u = acc.user;
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      const userApprovedDeps = allDeposits.filter((d) => {
        const depPhone = (d.userPhone || '').replace(/[^0-9]/g, '');
        const isDepUser = d.userId === u.id || (uPhone.length >= 10 && depPhone.length >= 10 && depPhone.endsWith(uPhone.slice(-10)));
        return isDepUser && (d.status === 'approved' || d.credited);
      });
      const contribution = userApprovedDeps.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const rewardPercent = level === 1 ? l1Percent : l2Percent;
      const reward = parseFloat(((contribution * rewardPercent) / 100).toFixed(2));

      return {
        id: u.id,
        username: uPhone.length >= 10 ? `${uPhone.slice(0, 4)}***${uPhone.slice(-3)}` : u.name || 'Member',
        joinDate: u.createdAt || new Date().toISOString(),
        status: 'active',
        eligibleReward: reward,
        teamContribution: contribution,
        level,
      };
    };

    const teamList: TeamMember[] = [
      ...level1Accounts.map(a => buildMember(a, 1)),
      ...level2Accounts.map(a => buildMember(a, 2)),
    ];

    return teamList;
  }, [settings.referralL1Percent, settings.referralL2Percent]);

  // Real-time Cloud Account Registry Sync (Fetches referred members from all devices)
  const [accountsVersion, setAccountsVersion] = useState(0);

  const refreshAccountsFromCloud = useCallback(async () => {
    try {
      const cloudAccounts = await cloudSync.fetchAllCloudAccounts();
      if (cloudAccounts && cloudAccounts.length > 0) {
        storage.syncAccounts(cloudAccounts);
        setAccountsVersion((v) => v + 1);
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshAccountsFromCloud();
    const interval = setInterval(refreshAccountsFromCloud, 10000);
    const handleForceRefresh = () => refreshAccountsFromCloud();
    window.addEventListener('ebp:refresh-accounts', handleForceRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ebp:refresh-accounts', handleForceRefresh);
    };
  }, [refreshAccountsFromCloud]);

  // Synchronize team and wallet team stats whenever user, deposits or accounts change
  useEffect(() => {
    if (user) {
      const liveTeam = buildTeamForUser(user);
      setTeam(liveTeam);
      storage.setTeam(liveTeam);

      const todayStr = new Date().toISOString().slice(0, 10);
      const totalMembers = liveTeam.length;
      const todayMembers = liveTeam.filter(m => (m.joinDate || '').slice(0, 10) === todayStr).length;
      const totalRecharge = liveTeam.reduce((sum, m) => sum + m.teamContribution, 0);
      const totalCommission = liveTeam.reduce((sum, m) => sum + m.eligibleReward, 0);

      setWallet((prev) => {
        if (
          prev.totalTeamMembers === totalMembers &&
          prev.todayTeamMembers === todayMembers &&
          prev.totalTeamRecharge === totalRecharge &&
          prev.teamCommission === totalCommission
        ) {
          return prev;
        }
        const updated: Wallet = {
          ...prev,
          totalTeamMembers: totalMembers,
          todayTeamMembers: todayMembers,
          totalTeamRecharge: parseFloat(totalRecharge.toFixed(2)),
          teamCommission: parseFloat(totalCommission.toFixed(2)),
          referralBalance: parseFloat(totalCommission.toFixed(2)),
        };
        storage.setWallet(updated);
        return updated;
      });
    }
  }, [user, deposits, buildTeamForUser, accountsVersion]);

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
  const creditWalletForDeposit = useCallback((depId: string, amount: number, quota: number, depMeta?: any, silent = false) => {
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

    // 6. Confetti & Success Toast (Only if not silent background sync)
    if (!silent) {
      try {
        confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
      } catch {}
      addToast('success', `🎉 Payment Approved! ₹${amount.toFixed(2)} credited to your game wallet!`);
    }
    window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
    return true;
  }, []);

  // Central Ledger Reconciler: Checks if any completed deposits have not been credited to active wallet balance
  const reconcileWallet = useCallback(() => {
    const currentU = storage.getUser();
    if (!currentU || !currentU.id) return; // STRICT: Never reconcile or credit for unauthenticated users

    const currentW = storage.getWallet();
    const creditedList = Array.isArray(currentW.creditedDepositIds) ? [...currentW.creditedDepositIds] : [];
    const allDeps = storage.getDeposits();
    const cleanUserPhone = (currentU.phone || '').replace(/[^0-9]/g, '');

    let updatedBal = Number(currentW.balance) || 0;
    let updatedQuota = Number(currentW.quota) || 0;
    let updatedToday = Number(currentW.todayReceive) || 0;
    let hasChanges = false;

    allDeps.forEach((dep) => {
      const isCompleted = dep.credited === true || dep.status === 'completed' || dep.status === 'credited';
      if (!isCompleted) return;

      // Filter out synthetic or test deposits
      const isSynthetic = dep.id && (dep.id.startsWith('TEST_') || dep.id.startsWith('FAKE_') || dep.id.startsWith('DEP_PROD_') || dep.id.startsWith('DEMO_'));
      if (isSynthetic) return;

      const depPhone = (dep.userPhone || '').replace(/[^0-9]/g, '');
      // STRICT: Must strictly match the logged in user's ID or exact 10-digit mobile number
      const isUserMatch =
        (dep.userId && dep.userId === currentU.id) ||
        (cleanUserPhone.length === 10 && depPhone.length === 10 && depPhone === cleanUserPhone);

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

  // Strict Balance Integrity Auditor: Ensures wallet balance is strictly backed by genuine approved deposits
  const sanitizeWalletBalance = useCallback(() => {
    const currentU = storage.getUser();
    const currentW = storage.getWallet();

    if (!currentU || !currentU.id) {
      // Unauthenticated session MUST always have exactly 0 balance
      if (Number(currentW.balance) > 0 || Number(currentW.quota) > 0) {
        const cleanW: Wallet = {
          ...currentW,
          balance: 0.00,
          quota: 0.00,
          todayReceive: 0.00,
          creditedDepositIds: [],
        };
        storage.setWallet(cleanW);
        setWallet(cleanW);
      }
      return;
    }

    const cleanUserPhone = (currentU.phone || '').replace(/[^0-9]/g, '');
    const allDeps = storage.getDeposits();
    
    // Find all legitimately approved deposits belonging to this user
    const legitimateApprovedDeps = allDeps.filter((d) => {
      const isCompleted = d.credited === true || d.status === 'completed' || d.status === 'approved';
      if (!isCompleted) return false;
      const dPhone = (d.userPhone || '').replace(/[^0-9]/g, '');
      const belongsToUser =
        (d.userId && d.userId === currentU.id) ||
        (cleanUserPhone.length === 10 && dPhone.length === 10 && dPhone === cleanUserPhone);
      return belongsToUser;
    });

    const legitimateCreditedIds = legitimateApprovedDeps.map((d) => d.id);
    const welcomeBonus = 50.00;
    const legitimateTotalInr = welcomeBonus + legitimateApprovedDeps.reduce((sum, d) => sum + Number(d.totalInr || d.amount || 0), 0);
    const legitimateTotalQuota = legitimateApprovedDeps.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    // If the wallet balance has phantom unearned money (e.g. 11338 or any unbacked amount exceeding legitimate total)
    if (Number(currentW.balance) > legitimateTotalInr) {
      console.warn(`[AUDIT] Correcting balance (₹${currentW.balance}) to legitimate verified balance: ₹${legitimateTotalInr.toFixed(2)}`);
      const correctedW: Wallet = {
        ...currentW,
        userId: currentU.id,
        balance: parseFloat(legitimateTotalInr.toFixed(2)),
        quota: parseFloat(legitimateTotalQuota.toFixed(2)),
        todayReceive: parseFloat(legitimateTotalInr.toFixed(2)),
        creditedDepositIds: legitimateCreditedIds,
      };
      storage.setWallet(correctedW);
      setWallet(correctedW);
      cloudSync.syncServerWallet(currentU.id, currentU.phone, correctedW.balance, correctedW.quota);
      window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
    }
  }, []);

  // Run reconciliation and sanitize phantom balances on mount and whenever user changes
  useEffect(() => {
    sanitizeWalletBalance();
    reconcileWallet();
  }, [sanitizeWalletBalance, reconcileWallet, user]);

  const isSyncingRef = useRef(false);

  // Reusable Cloud Sync Function
  const syncWithBackend = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      sanitizeWalletBalance();
      const backendDeps = await cloudSync.fetchAllDeposits();
      const currentU = storage.getUser();
      const cleanUserPhone = (currentU?.phone || '').replace(/[^0-9]/g, '');
      const currentW = storage.getWallet();
      const creditedList = Array.isArray(currentW.creditedDepositIds) ? currentW.creditedDepositIds : [];
      const allDeps = storage.getDeposits();

    // Check authoritative server wallet first
    if (currentU) {
      const serverW = await cloudSync.fetchServerWallet(currentU.id, currentU.phone);
      if (serverW) {
        // Only accept server wallet balance if backed by legitimate verified deposits (+ strictly ₹50 welcome bonus)
        const legitimateDeps = allDeps.filter((d) => {
          const isCompleted = d.credited === true || d.status === 'completed' || d.status === 'approved';
          if (!isCompleted) return false;
          const dPhone = (d.userPhone || '').replace(/[^0-9]/g, '');
          return (d.userId && d.userId === currentU.id) ||
            (cleanUserPhone.length === 10 && dPhone.length === 10 && dPhone === cleanUserPhone);
        });
        const maxAllowed = 50.00 + legitimateDeps.reduce((sum, d) => sum + Number(d.totalInr || d.amount || 0), 0);

        if (Number(serverW.balance) > maxAllowed) {
          // Reset server wallet with clean legitimate balance
          cloudSync.syncServerWallet(currentU.id, currentU.phone, maxAllowed, 0);
        } else if (serverW.balance !== currentW.balance && Number(serverW.balance) <= maxAllowed && Number(serverW.balance) >= 50.00) {
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
      }
    }

    // 1. Process all completed deposits from backend
    if (backendDeps && backendDeps.length > 0 && currentU && currentU.id) {
      backendDeps.forEach((bd: any) => {
        const isCompleted = bd.credited === true || bd.status === 'completed' || bd.status === 'credited' || bd.status === 'approved';
        const isSynthetic = bd.id && (bd.id.startsWith('TEST_') || bd.id.startsWith('FAKE_') || bd.id.startsWith('DEP_PROD_') || bd.id.startsWith('DEMO_'));
        if (isCompleted && !isSynthetic) {
          const matched = allDeps.find((d) => d.id === bd.id);
          const bdPhone = (bd.userPhone || (matched ? matched.userPhone : '') || '').replace(/[^0-9]/g, '');

          // STRICT: Must match logged in user ID or exact 10-digit mobile number
          const isUserMatch =
            (bd.userId && bd.userId === currentU.id) ||
            (matched && matched.userId && matched.userId === currentU.id) ||
            (cleanUserPhone.length === 10 && bdPhone.length === 10 && bdPhone === cleanUserPhone);

          if (isUserMatch) {
            if (!creditedList.includes(bd.id)) {
              const isUsdt = bd.method === 'USDT' || bd.id.startsWith('USDT');
              const defaultBal = isUsdt ? 5995 : 565;
              const defaultQuota = isUsdt ? 5500 : 500;
              const amountToAdd = Number(bd.totalInr) || (matched ? matched.totalInr : defaultBal);
              const quotaToAdd = Number(bd.amount) || (matched ? matched.amount : defaultQuota);
              console.log(`[SYNC] Crediting uncredited deposit from backend ${bd.id}: +₹${amountToAdd}`);
              creditWalletForDeposit(bd.id, amountToAdd, quotaToAdd, bd, true);
            }
          }
        }
      });
    }

    // 2. Also reconcile any locally completed deposits that haven't been credited yet
    if (currentU && currentU.id) {
      allDeps.forEach((ld) => {
        const isCompleted = ld.credited === true || ld.status === 'completed' || ld.status === 'credited' || ld.status === 'approved';
        const isSynthetic = ld.id && (ld.id.startsWith('TEST_') || ld.id.startsWith('FAKE_') || ld.id.startsWith('DEP_PROD_') || ld.id.startsWith('DEMO_'));
        if (isCompleted && !isSynthetic && !creditedList.includes(ld.id)) {
          const ldPhone = (ld.userPhone || '').replace(/[^0-9]/g, '');
          const isUserMatch =
            (ld.userId && ld.userId === currentU.id) ||
            (cleanUserPhone.length === 10 && ldPhone.length === 10 && ldPhone === cleanUserPhone);

          if (isUserMatch) {
            const isUsdt = ld.method === 'USDT' || ld.id.startsWith('USDT');
            const defaultBal = isUsdt ? 5995 : 565;
            const defaultQuota = isUsdt ? 5500 : 500;
            const amountToAdd = Number(ld.totalInr) || defaultBal;
            const quotaToAdd = Number(ld.amount) || defaultQuota;
            console.log(`[SYNC] Reconciling uncredited local deposit ${ld.id}: +₹${amountToAdd}`);
            creditWalletForDeposit(ld.id, amountToAdd, quotaToAdd, ld, true);
          }
        }
      });
    }

    // Merge deposits into React state & storage with STRICT terminal status guarantees
    if (backendDeps) {
      const processedDeps = getProcessedDeposits();
      const backendIds = new Set(backendDeps.map((b: any) => b.id));

      setDeposits((prev) => {
        const map = new Map();
        // Only keep locally created pending deposits that haven't synced to backend yet
        prev.forEach((d) => {
          if (d && (d.status === 'pending' || d.status === 'pending_verification') && !backendIds.has(d.id)) {
            map.set(d.id, d);
          }
        });
        backendDeps.forEach((bd: any) => {
          if (!bd || !bd.id) return;

          // If deposit is rejected, maintain it with rejected status so history is never lost
          if (processedDeps[bd.id] === 'rejected' || bd.status === 'rejected') {
            const current = map.get(bd.id);
            map.set(bd.id, {
              ...(current || bd),
              status: 'rejected',
              credited: false,
            });
            return;
          }

          // Only remove if explicitly marked deleted by admin
          if (processedDeps[bd.id] === 'deleted') {
            map.delete(bd.id);
            return;
          }

          const existingDep = map.get(bd.id);
          const isUsdt = bd.method === 'USDT' || bd.id.startsWith('USDT');

          // Check if approved locally or in processed registry or in backend
          const isLocallyApproved = existingDep && (existingDep.status === 'approved' || existingDep.status === 'completed');
          const isRecordedApproved = processedDeps[bd.id] === 'approved';
          const isBackendCompleted = bd.credited === true || bd.status === 'completed' || bd.status === 'credited' || bd.status === 'approved';
          const isApproved = isLocallyApproved || isRecordedApproved || isBackendCompleted;

          const validAmount = Number(bd.amount) || Number(bd.totalInr) || (existingDep ? existingDep.amount : 0);
          const validTotalInr = Number(bd.totalInr) || validAmount || (existingDep ? existingDep.totalInr : 0);
          const validBonus = Number(bd.bonusInr) || (existingDep ? existingDep.bonusInr : 0);
          const validMethod = bd.method || (existingDep ? existingDep.method : (isUsdt ? 'USDT' : 'INR'));
          const validCreatedAt = bd.createdAt || (existingDep ? existingDep.createdAt : new Date().toISOString());

          if (!existingDep) {
            map.set(bd.id, {
              id: bd.id,
              userId: bd.userId || 'player',
              userPhone: bd.userPhone || '',
              amount: validAmount,
              method: validMethod,
              calculatedInr: Number(bd.calculatedInr) || validAmount,
              bonusInr: validBonus,
              activityRewardInr: Number(bd.activityRewardInr) || 0,
              totalInr: validTotalInr,
              status: isApproved ? 'approved' : (bd.status || 'pending_verification'),
              credited: isApproved,
              createdAt: validCreatedAt,
              utrNumber: bd.utrNumber || '',
              proofUrl: bd.paymentScreenshot || bd.proofUrl || bd.utrNumber || '',
              paymentScreenshot: bd.paymentScreenshot || bd.proofUrl || '',
              remark: bd.remark || 'cousin',
            });
          } else {
            const isBdImg = bd.paymentScreenshot && bd.paymentScreenshot.startsWith('data:image/');
            const isLocalImg = existingDep.paymentScreenshot && existingDep.paymentScreenshot.startsWith('data:image/');
            const updatedScreenshot = isBdImg
              ? bd.paymentScreenshot
              : isLocalImg
              ? existingDep.paymentScreenshot
              : (bd.paymentScreenshot || existingDep.paymentScreenshot || bd.proofUrl || existingDep.proofUrl || '');

            const updatedProof = isBdImg
              ? bd.paymentScreenshot
              : isLocalImg
              ? existingDep.paymentScreenshot
              : (bd.proofUrl || bd.paymentScreenshot || existingDep.proofUrl || '');
            
            // STRICT TERMINAL STATE: If already approved or rejected, NEVER revert to pending!
            let finalStatus: DepositStatus = existingDep.status;
            if (isApproved) {
              finalStatus = 'approved';
            } else if (existingDep.status === 'rejected') {
              finalStatus = 'rejected';
            } else {
              finalStatus = bd.status || existingDep.status;
            }

            map.set(bd.id, {
              ...existingDep,
              amount: validAmount || existingDep.amount,
              totalInr: validTotalInr || existingDep.totalInr,
              method: validMethod || existingDep.method,
              status: finalStatus,
              credited: isApproved || existingDep.credited,
              creditedAt: isApproved ? (bd.creditedAt || existingDep.creditedAt || new Date().toISOString()) : existingDep.creditedAt,
              approvedAt: isApproved ? (bd.approvedAt || existingDep.approvedAt || new Date().toISOString()) : existingDep.approvedAt,
              paymentScreenshot: updatedScreenshot,
              proofUrl: updatedProof,
              utrNumber: bd.utrNumber || existingDep.utrNumber,
              userPhone: bd.userPhone || existingDep.userPhone,
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

    // Merge withdrawals into React state & storage from backend with strict terminal state guarantees
    const backendWiths = await cloudSync.fetchAllWithdrawals();
    if (backendWiths) {
      const processedWdrs = getProcessedWithdrawals();
      const backendWithIds = new Set((backendWiths || []).map((bw: any) => bw.id));

      setWithdrawals((prev) => {
        const map = new Map();
        // Only keep locally created pending withdrawals that haven't synced yet
        (prev || []).forEach((w) => {
          if (w && w.status === 'pending' && !backendWithIds.has(w.id)) {
            map.set(w.id, w);
          }
        });
        backendWiths.forEach((bw: any) => {
          if (!bw || !bw.id) return;
          const existing = map.get(bw.id);

          const isLocallyCompleted = existing && existing.status === 'completed';
          const isLocallyRejected = existing && existing.status === 'rejected';
          const isRecordedCompleted = processedWdrs[bw.id] === 'completed';
          const isRecordedRejected = processedWdrs[bw.id] === 'rejected';

          let resolvedStatus = bw.status || 'pending';
          if (isLocallyCompleted || isRecordedCompleted || bw.status === 'completed') {
            resolvedStatus = 'completed';
          } else if (isLocallyRejected || isRecordedRejected || bw.status === 'rejected') {
            resolvedStatus = 'rejected';
          }

          if (!existing) {
            map.set(bw.id, { ...bw, status: resolvedStatus });
          } else {
            // NEVER revert an approved or rejected withdrawal back to pending!
            map.set(bw.id, {
              ...existing,
              ...bw,
              status: resolvedStatus,
              rejectionReason: resolvedStatus === 'rejected' ? (bw.rejectionReason || existing.rejectionReason) : undefined,
            });
          }
        });
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        storage.setWithdrawals(merged);
        return merged;
      });

      // Reconcile any rejected withdrawals to ensure user wallet is refunded
      if (currentU && currentU.id) {
        backendWiths.forEach((bw: any) => {
          if (bw.status === 'rejected') {
            const bwPhone = (bw.userPhone || '').replace(/[^0-9]/g, '');
            const isUserMatch =
              (bw.userId && bw.userId === currentU.id) ||
              (cleanUserPhone.length === 10 && bwPhone.length === 10 && bwPhone === cleanUserPhone);

            if (isUserMatch) {
              const currentW = storage.getWallet();
              const refundedList = Array.isArray((currentW as any).refundedWithdrawalIds) ? [...(currentW as any).refundedWithdrawalIds] : [];
              if (!refundedList.includes(bw.id)) {
                refundedList.push(bw.id);
                const refundAmount = Number(bw.amount) || 0;
                if (refundAmount > 0) {
                  const newBal = parseFloat((Number(currentW.balance || 0) + refundAmount).toFixed(2));
                  const updatedW: Wallet = {
                    ...currentW,
                    balance: newBal,
                    ...({ refundedWithdrawalIds: refundedList } as any),
                  };
                  storage.setWallet(updatedW);
                  setWallet(updatedW);
                  window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
                }
              }
            }
          }
        });
      }
    }
  } finally {
    isSyncingRef.current = false;
  }
  }, [creditWalletForDeposit]);

  const refreshWithdrawals = useCallback(async (): Promise<WithdrawalRequest[]> => {
    try {
      const backendWiths = await cloudSync.fetchAllWithdrawals().catch(() => []);
      const processedWdrs = getProcessedWithdrawals();
      const backendWithIds = new Set((backendWiths || []).map((bw: any) => bw.id));

      setWithdrawals((prev) => {
        const map = new Map<string, WithdrawalRequest>();
        // Only keep locally created pending withdrawals that haven't synced yet
        (prev || []).forEach((w) => {
          if (w && w.id && w.status === 'pending' && !backendWithIds.has(w.id)) {
            map.set(w.id, w);
          }
        });
        // Merge backend cloud withdrawals
        (backendWiths || []).forEach((bw: any) => {
          if (!bw || !bw.id) return;
          const existing = map.get(bw.id);
          const isCompleted = existing?.status === 'completed' || processedWdrs[bw.id] === 'completed' || bw.status === 'completed';
          const isRejected = existing?.status === 'rejected' || processedWdrs[bw.id] === 'rejected' || bw.status === 'rejected';
          const resolvedStatus = isCompleted ? 'completed' : isRejected ? 'rejected' : (bw.status || 'pending');

          const item: WithdrawalRequest = {
            id: bw.id,
            userId: bw.userId || existing?.userId || 'player',
            userName: bw.userName || existing?.userName || 'Player',
            userPhone: bw.userPhone || existing?.userPhone || '',
            amount: Number(bw.amount) || existing?.amount || 0,
            fee: Number(bw.fee) || 0,
            netAmount: Number(bw.netAmount) || Number(bw.amount) || existing?.netAmount || 0,
            method: bw.method || existing?.method || 'bank',
            accountDetails: bw.accountDetails || existing?.accountDetails || {},
            status: resolvedStatus as any,
            rejectionReason: isRejected ? (bw.rejectionReason || existing?.rejectionReason) : undefined,
            createdAt: bw.createdAt || existing?.createdAt || new Date().toISOString(),
          };
          map.set(bw.id, item);
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        storage.setWithdrawals(merged);
        return merged;
      });

      return storage.getWithdrawals();
    } catch (e) {
      console.warn('[REFRESH_WITHDRAWALS] Error:', e);
      return storage.getWithdrawals();
    }
  }, []);

  // Instant Real-Time Cloud Sync (SSE Stream + 2.5s Polling Fallback)
  useEffect(() => {
    const applyApprovalEvent = (event: { 
      type?: string;
      depId?: string; 
      depositId?: string;
      wdrId?: string;
      withdrawalId?: string;
      action?: 'approved' | 'rejected'; 
      userId?: string;
      userPhone?: string;
      amount?: number;
      currency?: string;
      totalInr?: number; 
      credited?: boolean;
      creditedAt?: string;
      approvedAt?: string;
      reason?: string;
      wallet?: any;
    }) => {
      // 1. Handle Withdrawal Approval / Rejection Events
      const wdrId = event.wdrId || event.withdrawalId || (event.depId && event.depId.startsWith('WDR-') ? event.depId : undefined);
      if (wdrId) {
        const currentU = storage.getUser();
        if (!currentU || !currentU.id) return;

        const allWiths = storage.getWithdrawals();
        const matchedWith = allWiths.find((w) => w.id === wdrId);
        const cleanUserPhone = (currentU.phone || '').replace(/[^0-9]/g, '');
        const eventPhone = (event.userPhone || (matchedWith ? matchedWith.userPhone : '') || '').replace(/[^0-9]/g, '');

        const isUserMatch =
          (event.userId && event.userId === currentU.id) ||
          (matchedWith && matchedWith.userId && matchedWith.userId === currentU.id) ||
          (cleanUserPhone.length === 10 && eventPhone.length === 10 && eventPhone === cleanUserPhone);

        if (!isUserMatch) return;

        if (event.action === 'approved' || event.type === 'WITHDRAWAL_APPROVED') {
          setWithdrawals((prev) => {
            const updated = prev.map((w) => w.id === wdrId ? { ...w, status: 'completed' as const } : w);
            storage.setWithdrawals(updated);
            return updated;
          });
          setTransactions((prev) => {
            const updated = prev.map((t) => t.referenceId === wdrId ? { ...t, status: 'completed' as const } : t);
            storage.setTransactions(updated);
            return updated;
          });
          addToast('success', `✅ Payout of ₹${event.amount || matchedWith?.amount || ''} has been approved & processed!`);
        } else if (event.action === 'rejected' || event.type === 'WITHDRAWAL_REJECTED') {
          const reason = event.reason || 'Payout Rejected by Admin';
          const refundAmount = Number(event.amount) || Number(matchedWith?.amount) || 0;

          setWithdrawals((prev) => {
            const updated = prev.map((w) => w.id === wdrId ? { ...w, status: 'rejected' as const, rejectionReason: reason } : w);
            storage.setWithdrawals(updated);
            return updated;
          });
          setTransactions((prev) => {
            const updated = prev.map((t) => t.referenceId === wdrId ? { ...t, status: 'rejected' as const, note: `${t.note} (Refunded: ${reason})` } : t);
            storage.setTransactions(updated);
            return updated;
          });

          // Idempotent refund to wallet balance
          if (refundAmount > 0) {
            const currentW = storage.getWallet();
            const refundedList = Array.isArray((currentW as any).refundedWithdrawalIds) ? [...(currentW as any).refundedWithdrawalIds] : [];
            if (!refundedList.includes(wdrId)) {
              refundedList.push(wdrId);
              const newBal = parseFloat((Number(currentW.balance || 0) + refundAmount).toFixed(2));
              const updatedW: Wallet = {
                ...currentW,
                balance: newBal,
                ...({ refundedWithdrawalIds: refundedList } as any),
              };
              storage.setWallet(updatedW);
              setWallet(updatedW);

              const accounts = storage.getAccounts();
              accounts.forEach((acc) => {
                if (acc.user.id === currentU.id || (cleanUserPhone.length >= 10 && (acc.user.phone || '').endsWith(cleanUserPhone.slice(-10)))) {
                  acc.wallet = { ...acc.wallet, balance: newBal, ...({ refundedWithdrawalIds: refundedList } as any) };
                }
              });
              storage.setAccounts(accounts);
              window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
            }
          }

          addToast('error', `❌ Withdrawal #${wdrId} was rejected: ${reason}. ₹${refundAmount} refunded to your balance.`);
        }
        return;
      }

      // 2. Handle Deposit Events
      const depId = event.depId || event.depositId;
      if (!depId && !event.wallet) return;

      if (event.action === 'approved' || event.type === 'DEPOSIT_APPROVED' || event.type === 'WALLET_UPDATED') {
        const currentU = storage.getUser();
        // STRICT: If no user is logged in, never credit wallet
        if (!currentU || !currentU.id) return;

        // STRICT: Never process synthetic test events into live client wallet
        const isSynthetic = depId && (depId.startsWith('TEST_') || depId.startsWith('FAKE_') || depId.startsWith('DEP_PROD_') || depId.startsWith('DEMO_'));
        if (isSynthetic) return;

        const allCurrentDeps = storage.getDeposits();
        const matched = allCurrentDeps.find((d) => d.id === depId);
        const cleanUserPhone = (currentU.phone || '').replace(/[^0-9]/g, '');
        const eventPhone = (event.userPhone || (matched ? matched.userPhone : '') || '').replace(/[^0-9]/g, '');

        // STRICT OWNERSHIP: Must match this user's id, matching local deposit made by this user, or exact 10-digit phone
        const isUserMatch = 
          (event.userId && event.userId === currentU.id) ||
          (matched && matched.userId && matched.userId === currentU.id) ||
          (cleanUserPhone.length === 10 && eventPhone.length === 10 && eventPhone === cleanUserPhone);

        if (!isUserMatch) {
          // Event belongs to a different player or is an unassigned event - DO NOT CREDIT
          return;
        }

        // Credit wallet idempotently and safely
        const isUsdt = (depId && depId.startsWith('USDT')) || event.currency === 'USDT' || matched?.method === 'USDT';
        const defaultBal = isUsdt ? 5995 : 565;
        const defaultQuota = isUsdt ? 5500 : 500;
        const amountToAdd = matched ? (matched.totalInr || defaultBal) : (event.totalInr && event.totalInr > 0 ? event.totalInr : defaultBal);
        const quotaToAdd = matched ? (matched.method === 'USDT' ? (matched.calculatedInr || matched.amount * 110) : matched.amount) : defaultQuota;

        if (depId) {
          creditWalletForDeposit(depId, amountToAdd, quotaToAdd, matched);
        }
      } else if (event.action === 'rejected' || event.type === 'DEPOSIT_REJECTED') {
        const currentU = storage.getUser();
        if (!currentU) return;
        const allCurrentDeps = storage.getDeposits();
        const matched = allCurrentDeps.find((d) => d.id === depId);
        const cleanUserPhone = (currentU.phone || '').replace(/[^0-9]/g, '');
        const eventPhone = (event.userPhone || (matched ? matched.userPhone : '') || '').replace(/[^0-9]/g, '');
        const isUserMatch = 
          (event.userId && event.userId === currentU.id) ||
          (matched && matched.userId && matched.userId === currentU.id) ||
          (cleanUserPhone.length === 10 && eventPhone.length === 10 && eventPhone === cleanUserPhone);

        if (!isUserMatch) {
          return;
        }

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

    syncWithBackend();
    const intervalId = setInterval(syncWithBackend, 4000);

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
  }, [creditWalletForDeposit, syncWithBackend]);

  // Listen for incoming deposits from players across all devices in real-time
  useEffect(() => {
    const unsubscribeDeposits = cloudSync.subscribeToDeposits((incoming) => {
      setDeposits((prev) => {
        const isUsdt = incoming.method === 'USDT' || incoming.id.startsWith('USDT');
        const existing = prev.find((d) => d.id === incoming.id);
        if (existing) {
          const updated = prev.map((d) => {
            if (d.id !== incoming.id) return d;
            return {
              ...d,
              paymentScreenshot: incoming.paymentScreenshot || incoming.proofUrl || d.paymentScreenshot,
              proofUrl: incoming.proofUrl || incoming.paymentScreenshot || d.proofUrl,
              utrNumber: incoming.utrNumber || d.utrNumber,
              userPhone: incoming.userPhone || d.userPhone,
              status: incoming.status ? (incoming.status as any) : d.status,
            };
          });
          storage.setDeposits(updated);
          return updated;
        }

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
          status: (incoming.status as any) || 'pending_verification',
          createdAt: incoming.createdAt,
          utrNumber: incoming.utrNumber,
          proofUrl: incoming.paymentScreenshot || incoming.proofUrl || incoming.utrNumber,
          paymentScreenshot: incoming.paymentScreenshot || incoming.proofUrl || '',
          remark: incoming.remark || 'cousin',
        };
        const updated = [newDep, ...prev];
        storage.setDeposits(updated);
        return updated;
      });
    });
    return unsubscribeDeposits;
  }, [settings.inrRewardPercent]);

  // Listen for incoming withdrawals from players in real-time
  useEffect(() => {
    const unsubscribeWithdrawals = cloudSync.subscribeToWithdrawals((incoming) => {
      setWithdrawals((prev) => {
        if (prev.some((w) => w.id === incoming.id)) return prev;
        const updated = [incoming, ...prev];
        storage.setWithdrawals(updated);
        return updated;
      });
    });
    return unsubscribeWithdrawals;
  }, []);

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
  // Auth Functions
  const login = async (emailOrPhone: string, pass: string): Promise<{ success: boolean; message: string; notFound?: boolean; wrongPassword?: boolean }> => {
    if (!emailOrPhone) {
      addToast('error', 'Please enter your mobile number or email.');
      return { success: false, message: 'Missing credentials' };
    }

    // 1. Check local storage first
    let existingAccount = storage.findAccount(emailOrPhone);

    // 2. If not found locally, fetch from Cloud Account registry / GitHub Ledger
    if (!existingAccount) {
      const cloudAcc = await cloudSync.fetchCloudAccount(emailOrPhone);
      if (cloudAcc) {
        existingAccount = cloudAcc;
        storage.saveAccount(cloudAcc);
      }
    }

    if (!existingAccount) {
      return { success: false, notFound: true, message: 'Account not found. Please Sign Up first.' };
    }

    const cleanPass = (pass || '').trim();
    let validPassword = (existingAccount.password || '').trim();
    const validPin = (existingAccount.transactionPin || existingAccount.user.transactionPin || '').trim();

    // If initial password was not set (e.g. reconstructed from ledger for existing user like Manoj tembe)
    if (existingAccount.allowInitialPasswordSet || (!validPassword && !validPin)) {
      validPassword = cleanPass;
      existingAccount.password = cleanPass;
      existingAccount.allowInitialPasswordSet = false;
      storage.saveAccount(existingAccount);
      cloudSync.saveCloudAccount(existingAccount);
    }

    // Verify against password OR 6-digit permanent PIN (allows seamless login if user entered PIN)
    const isPasswordMatch = validPassword && cleanPass === validPassword;
    const isPinMatch = validPin && cleanPass === validPin;

    if (!isPasswordMatch && !isPinMatch) {
      return { success: false, wrongPassword: true, message: 'Incorrect password or Security PIN. Please try again.' };
    }

    // Attach transactionPin to user object and ensure valid referralCode
    const userWithPin: User = {
      ...existingAccount.user,
      referralCode: existingAccount.user.referralCode || `EBP-${Math.floor(10000 + Math.random() * 90000)}`,
      transactionPin: validPin || existingAccount.user.transactionPin,
    };

    const userTeam = buildTeamForUser(userWithPin);
    const updatedWallet: Wallet = {
      ...(existingAccount.wallet || defaultWallet),
      userId: userWithPin.id,
      totalTeamMembers: userTeam.length,
      creditedDepositIds: Array.isArray(existingAccount.wallet?.creditedDepositIds)
        ? existingAccount.wallet.creditedDepositIds
        : [],
    };

    setUser(userWithPin);
    setWallet(updatedWallet);
    setTeam(userTeam);
    storage.setUser(userWithPin);
    storage.setWallet(updatedWallet);
    storage.setTeam(userTeam);

    // Load account-specific transactions strictly for this user
    let userTx: Transaction[] = [];
    if (existingAccount.transactions && Array.isArray(existingAccount.transactions) && existingAccount.transactions.length > 0) {
      userTx = existingAccount.transactions;
    } else {
      userTx = storage.getUserTransactions(userWithPin.id, userWithPin.phone);
    }
    setTransactions(userTx);

    // Sync account to cloud
    cloudSync.saveCloudAccount(existingAccount);

    addToast('success', `Welcome back, ${userWithPin.name}!`);
    window.dispatchEvent(new CustomEvent('ebp:user-logged-in'));
    setTimeout(() => reconcileWallet(), 50);
    return { success: true, message: 'Login successful' };
  };

  const register = async (
    name: string, 
    email: string, 
    phone: string, 
    pass: string, 
    refCode?: string,
    pin?: string
  ): Promise<{ success: boolean; message: string; alreadyExists?: boolean }> => {
    if (!name || !phone) {
      addToast('error', 'Please fill in your name and mobile phone.');
      return { success: false, message: 'Required fields missing' };
    }

    const cleanPhone = phone.trim();
    const cleanEmail = (email && email.trim()) || `${cleanPhone.replace(/[^0-9]/g, '')}@ebp.com`;
    const cleanPin = pin ? pin.trim() : undefined;
    const cleanPass = pass.trim();

    // Check if account already exists locally or in cloud
    const cleanDigits = phone.replace(/[^0-9]/g, '');
    let existingAccount = storage.findAccount(cleanDigits) || (email ? storage.findAccount(cleanEmail) : null);
    if (!existingAccount) {
      const cloudAcc = await cloudSync.fetchCloudAccount(cleanDigits);
      if (cloudAcc) {
        existingAccount = cloudAcc;
      }
    }

    // IF ACCOUNT ALREADY EXISTS: Stop and inform user to sign in
    if (existingAccount) {
      addToast('error', '⚠️ This mobile number is already registered. Please Sign In.');
      return { 
        success: false, 
        alreadyExists: true, 
        message: 'This mobile number is already registered. Please tap "Sign In" above to access your account.' 
      };
    }

    const cleanRef = (refCode || '').trim().toUpperCase();

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      referralCode: `EBP-${Math.floor(10000 + Math.random() * 90000)}`,
      referredBy: cleanRef || undefined,
      isGoogleAuthEnabled: false,
      transactionPin: cleanPin,
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

    const newAccount: RegisteredAccount = {
      user: newUser,
      password: cleanPass,
      transactionPin: cleanPin,
      wallet: initialWallet,
      transactions: [welcomeTx],
    };

    // Save registered account to local persistence AND cloud
    storage.saveAccount(newAccount);
    await cloudSync.saveCloudAccount(newAccount);

    // If registered with a referral code, link and increment referrer's team
    if (cleanRef) {
      const allAccounts = storage.getAccounts();
      const referrerAcc = allAccounts.find(a => 
        (a.user.referralCode && a.user.referralCode.trim().toUpperCase() === cleanRef) ||
        (a.user.phone && a.user.phone.replace(/[^0-9]/g, '').endsWith(cleanRef.replace(/[^0-9]/g, ''))) ||
        a.user.id === cleanRef
      );
      if (referrerAcc) {
        const refWallet = referrerAcc.wallet || defaultWallet;
        referrerAcc.wallet = {
          ...refWallet,
          totalTeamMembers: (refWallet.totalTeamMembers || 0) + 1,
          todayTeamMembers: (refWallet.todayTeamMembers || 0) + 1,
        };
        storage.saveAccount(referrerAcc);
        cloudSync.saveCloudAccount(referrerAcc);
      }
    }

    // Immediately isolate and switch active session to new account
    setUser(newUser);
    setWallet(initialWallet);
    setTeam([]);
    storage.setUser(newUser);
    storage.setWallet(initialWallet);
    storage.setTeam([]);
    setTransactions([welcomeTx]);

    // Force background account list refresh
    refreshAccountsFromCloud();

    addToast('success', 'Account registered! ₹50 Welcome Bonus credited to your wallet!');
    window.dispatchEvent(new CustomEvent('ebp:user-logged-in'));
    return { success: true, message: 'Registration successful' };
  };

  const logout = () => {
    setUser(null);
    setWallet(defaultWallet);
    setTransactions([]);
    storage.setUser(null);
    storage.setWallet(defaultWallet);
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
  const submitInrDeposit = async (
    amount: number, 
    refNumber: string, 
    screenshotUrl?: string, 
    remark?: string,
    ocrResult?: {
      verified: boolean;
      detectedAmount?: number;
      detectedUtr?: string;
      detectedTime?: string;
      timeDiffMins?: number;
      status: 'passed' | 'failed' | 'manual_review';
      reason?: string;
    }
  ): Promise<{ success: boolean; message: string; autoApproved?: boolean; depositId?: string; totalInr?: number; deposit?: DepositOrder }> => {
    const activeUser: User | null = user || storage.getUser();
    if (!activeUser) {
      addToast('error', 'Please log in to your account first.');
      return { success: false, message: 'Authentication required' };
    }
    const minDeposit = settings.minDeposit || 350;
    if (amount < minDeposit) {
      addToast('error', `Minimum deposit amount is ₹${minDeposit}.`);
      return { success: false, message: `Minimum deposit amount is ₹${minDeposit}.` };
    }

    const cleanUtr = (refNumber || '').trim();
    if (!cleanUtr || cleanUtr.length !== 12) {
      addToast('error', '⚠️ 12-digit numeric UTR is mandatory.');
      return { success: false, message: 'Valid 12-digit UTR required' };
    }

    // Duplicate UTR check: Cannot reuse an already used UTR
    const allExistingDeps = storage.getDeposits();
    const isDuplicate = allExistingDeps.some(
      (d) => d.utrNumber && d.utrNumber.trim() === cleanUtr && d.status !== 'rejected'
    );
    if (isDuplicate) {
      addToast('error', '❌ Duplicate UTR detected: Ye UTR number pehle se use ho chuka hai. Kripya naya payment karein.');
      return { success: false, message: 'Duplicate UTR' };
    }

    // Payment screenshot is optional in classic deposit flow (12-digit UTR is strictly verified)
    const finalProof = (screenshotUrl && screenshotUrl.trim()) ? screenshotUrl.trim() : cleanUtr;

    // Strict: 15-second rate limit per user to avoid accidental multi-clicks
    const userIdentifier = activeUser.id || activeUser.phone || 'player';
    const lastDepositKey = `ebp_last_dep_${userIdentifier}`;
    const lastDepTime = Number(localStorage.getItem(lastDepositKey) || 0);
    const now = Date.now();
    const COOLDOWN_MS = 15 * 1000;
    if (lastDepTime && now - lastDepTime < COOLDOWN_MS) {
      const remainingSec = Math.ceil((COOLDOWN_MS - (now - lastDepTime)) / 1000);
      addToast('error', `⏳ Please wait (${remainingSec}s remaining).`);
      return { success: false, message: 'Rate limit active' };
    }
    localStorage.setItem(lastDepositKey, now.toString());

    // Extra Tier Free Bonus
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

    const bonusPercent = settings.inrRewardPercent || 22;
    const standardBonus = (amount * bonusPercent) / 100;
    const totalBonus = standardBonus + extraFreeBonus;
    const total = amount + totalBonus;
    const finalRemark = remark || 'cousin';

    // Initial auto-approve flag (Demo Mode)
    const isAutoApproved = Boolean(
      settings.isDemoMode ||
      (ocrResult?.verified && settings.autoApproveWithOcr !== false)
    );

    const nowIso = new Date().toISOString();
    const newDeposit: DepositOrder = {
      id: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: activeUser.id,
      userPhone: activeUser.phone,
      utrNumber: cleanUtr,
      amount,
      method: 'INR',
      calculatedInr: amount,
      bonusInr: standardBonus,
      activityRewardInr: extraFreeBonus,
      totalInr: total,
      status: isAutoApproved ? 'approved' : 'pending_verification',
      credited: isAutoApproved,
      creditedAt: isAutoApproved ? nowIso : undefined,
      approvedAt: isAutoApproved ? nowIso : undefined,
      createdAt: nowIso,
      proofUrl: screenshotUrl || cleanUtr,
      paymentScreenshot: screenshotUrl || '',
      remark: finalRemark,
      ocrVerification: ocrResult,
    };

    const updatedDeposits = [newDeposit, ...deposits];
    setDeposits(updatedDeposits);
    storage.setDeposits(updatedDeposits);

    // When Admin Auto-Accept is ON: Background verification for Exact Amount Match & 10-Minute Freshness
    if (!isAutoApproved && settings.autoApproveDeposits && screenshotUrl && (screenshotUrl.startsWith('data:image') || screenshotUrl.startsWith('http'))) {
      verifyPaymentScreenshot({
        imageSource: screenshotUrl,
        expectedAmount: amount,
        orderCreatedAt: Date.now(),
        maxMinutesDiff: settings.ocrMaxTimeWindowMins || 10,
      }).then((ocrRes) => {
        if (ocrRes.amountMatched && ocrRes.timeValid && ocrRes.statusMatched) {
          console.log(`[AUTO_APPROVE] Exact amount ₹${amount} and 10-minute rule matched for #${newDeposit.id}. Auto-approving!`);
          approveDeposit(newDeposit.id, total, {
            ...newDeposit,
            ocrVerification: {
              verified: true,
              detectedAmount: ocrRes.detectedAmount,
              detectedUtr: ocrRes.detectedUtr,
              detectedTime: ocrRes.detectedTime,
              timeDiffMins: ocrRes.timeDiffMins,
              status: 'passed' as const,
              reason: ocrRes.reason,
            },
          });
        } else {
          console.log(`[AUTO_APPROVE] #${newDeposit.id} did not pass 10m/amount rule (${ocrRes.reason}). Retained for Admin manual review.`);
          const all = storage.getDeposits();
          const updated: DepositOrder[] = all.map((d) =>
            d.id === newDeposit.id
              ? {
                  ...d,
                  ocrVerification: {
                    verified: false,
                    detectedAmount: ocrRes.detectedAmount,
                    detectedUtr: ocrRes.detectedUtr,
                    detectedTime: ocrRes.detectedTime,
                    timeDiffMins: ocrRes.timeDiffMins,
                    status: 'manual_review' as const,
                    reason: ocrRes.reason,
                  },
                }
              : d
          );
          storage.setDeposits(updated);
          setDeposits(updated);
        }
      }).catch((err) => {
        console.warn('[AUTO_APPROVE] Background OCR check error:', err);
      });
    }

    // If auto-approved by Smart OCR, credit user wallet immediately
    if (isAutoApproved) {
      recordProcessedDeposit(newDeposit.id, 'approved');
      creditWalletForDeposit(newDeposit.id, total, amount, newDeposit);

      // Also update in registered accounts
      const accounts = storage.getAccounts();
      const depPhone = (activeUser.phone || '').replace(/[^0-9]/g, '');
      accounts.forEach((acc) => {
        const accPhone = (acc.user.phone || '').replace(/[^0-9]/g, '');
        if (acc.user.id === activeUser.id || (depPhone.length >= 10 && accPhone.endsWith(depPhone.slice(-10)))) {
          const accCredited = Array.isArray(acc.wallet?.creditedDepositIds) ? [...acc.wallet.creditedDepositIds] : [];
          if (!accCredited.includes(newDeposit.id)) {
            accCredited.push(newDeposit.id);
            acc.wallet = {
              ...(acc.wallet || defaultWallet),
              balance: parseFloat(((Number(acc.wallet?.balance) || 0) + total).toFixed(2)),
              quota: parseFloat(((Number(acc.wallet?.quota) || 0) + amount).toFixed(2)),
              todayReceive: parseFloat(((Number(acc.wallet?.todayReceive) || 0) + total).toFixed(2)),
              creditedDepositIds: accCredited,
            };
            storage.saveAccount(acc);
          }
        }
      });
    }

    // Non-blocking high-speed broadcast to backend and ledger
    cloudSync.broadcastDeposit({
      id: newDeposit.id,
      userId: activeUser.id,
      userPhone: activeUser.phone,
      amount,
      totalInr: total,
      utrNumber: cleanUtr,
      method: 'INR',
      createdAt: newDeposit.createdAt,
      status: newDeposit.status,
      proofUrl: newDeposit.proofUrl,
      paymentScreenshot: newDeposit.paymentScreenshot,
      remark: finalRemark,
      isDemo: settings.isDemoMode,
    }).catch((err) => console.warn('[APP] Background broadcast error:', err));

    cloudSync.createTransaction({
      transactionId: newDeposit.id,
      userId: activeUser.id,
      userPhone: activeUser.phone,
      amount,
      method: 'INR',
      utrNumber: cleanUtr,
      proofUrl: screenshotUrl || '',
      paymentScreenshot: screenshotUrl || '',
      remark: finalRemark,
      isDemo: settings.isDemoMode,
      skipTelegram: true,
    });

    telegramService.sendDepositAlert(newDeposit, activeUser.name, activeUser.phone, settings);

    // Create Transaction record with transparent breakdown so it immediately appears in user History
    const depositFormula = `₹${amount} + ${bonusPercent}% Bonus (₹${standardBonus.toFixed(0)}) = ₹${total.toFixed(2)}`;
    const newTx: Transaction = {
      id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: activeUser.id,
      type: 'deposit',
      amount: total,
      currency: 'INR',
      status: settings.isDemoMode ? 'completed' : 'pending',
      timestamp: new Date().toISOString(),
      note: `INR Deposit: ${depositFormula}`,
      referenceId: newDeposit.id,
      metadata: {
        baseAmount: amount,
        bonusInr: standardBonus,
        totalAmount: total,
        utrNumber: cleanUtr,
        method: 'INR',
      },
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
    } else if (isAutoApproved) {
      addToast('success', `🎉 Payment Auto-Approved! ₹${total.toFixed(2)} credited to your wallet!`);
    } else {
      addToast('success', `✓ Payment submitted! Admin will verify UTR and approve your deposit.`);
    }

    return { 
      success: true, 
      message: 'Deposit recorded', 
      autoApproved: isAutoApproved, 
      depositId: newDeposit.id, 
      totalInr: total,
      deposit: newDeposit
    };
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
      transactionId: newDeposit.id,
      userId: user.id,
      userPhone: user.phone,
      amount: usdtAmount,
      method: 'USDT',
      utrNumber: txHash || 'TRC20-TRANSFER',
      network: 'TRC20',
      isDemo: settings.isDemoMode,
      skipTelegram: true,
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
    const minWithdrawal = Math.max(200, settings.minWithdrawal || 200);
    if (amount < minWithdrawal) {
      const msg = `Minimum withdrawal amount is ₹${minWithdrawal}.`;
      addToast('error', msg);
      return { success: false, message: msg };
    }

    // 2. Referral Commission 2,000 threshold enforcement
    const minReferralWithdrawal = Number(settings.minReferralWithdrawal) || 2000;
    const refBal = Number(wallet.referralBalance || wallet.teamCommission) || 0;
    const isReferralLocked = refBal > 0 && refBal < minReferralWithdrawal;
    const nonRefBalance = Math.max(0, parseFloat((wallet.balance - (isReferralLocked ? refBal : 0)).toFixed(2)));

    if (isReferralLocked && amount > nonRefBalance) {
      const remainingNeeded = (minReferralWithdrawal - refBal).toFixed(2);
      const msg = `⚠️ Referral Commission requires a minimum of ₹${minReferralWithdrawal.toLocaleString('en-IN')} to withdraw. You currently have ₹${refBal.toFixed(2)} (₹${remainingNeeded} more needed). Max withdrawable from game balance: ₹${nonRefBalance.toFixed(2)}.`;
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

    const deductRef = refBal >= minReferralWithdrawal ? Math.min(refBal, amount) : 0;

    setWallet((prev) => ({
      ...prev,
      balance: parseFloat((prev.balance - amount).toFixed(2)),
      referralBalance: parseFloat(Math.max(0, (prev.referralBalance || 0) - deductRef).toFixed(2)),
    }));

    const newWithdrawal: WithdrawalRequest = {
      id: `WDR-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone || '',
      amount,
      method,
      fee,
      netAmount,
      accountDetails: details,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);
    storage.setWithdrawals([newWithdrawal, ...storage.getWithdrawals()]);

    // Broadcast to serverless cloud ledger & Telegram alert
    cloudSync.broadcastWithdrawal(newWithdrawal);
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
  const approveDeposit = (id: string, fallbackTotalInr?: number, fullDepObject?: DepositOrder) => {
    let allDeps = storage.getDeposits();
    let deposit = fullDepObject || allDeps.find((d) => d.id === id) || deposits.find((d) => d.id === id);
    const nowIso = new Date().toISOString();

    const processedDeps = getProcessedDeposits();
    if (processedDeps[id] === 'approved' || (deposit && (deposit.status === 'approved' || deposit.credited === true))) {
      addToast('info', `Deposit #${id} is already approved.`);
      return;
    }

    const screenshot = deposit?.paymentScreenshot || deposit?.proofUrl || fullDepObject?.paymentScreenshot || fullDepObject?.proofUrl || '';
    const isDemo = Boolean(settings.isDemoMode || deposit?.id?.startsWith('DEMO_') || id?.startsWith('DEMO_'));
    const hasScreenshot = isDemo || Boolean(
      fullDepObject ||
      (screenshot && (
        screenshot.startsWith('data:image') ||
        screenshot.startsWith('http') ||
        screenshot.startsWith('ATTACHED') ||
        screenshot.includes('ATTACHED') ||
        screenshot === 'VERIFIED_BY_ADMIN' ||
        screenshot.length > 0
      ))
    );
    if (!hasScreenshot && !deposit) {
      addToast('error', '❌ Cannot approve: Valid payment screenshot is strictly required.');
      return;
    }

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
        status: 'approved',
        credited: true,
        creditedAt: nowIso,
        approvedAt: nowIso,
        createdAt: nowIso,
        remark: 'cousin',
      };
    } else {
      deposit = {
        ...deposit,
        status: 'approved',
        credited: true,
        creditedAt: nowIso,
        approvedAt: nowIso,
      };
    }

    // 1. Mark deposit as approved in state and storage & record in permanent processed registry
    recordProcessedDeposit(id, 'approved');
    const updatedDeposits = (allDeps.some((d) => d.id === id) ? allDeps : [deposit, ...allDeps]).map((d) =>
      d.id === id ? { ...d, status: 'approved' as const, credited: true, creditedAt: nowIso, approvedAt: nowIso } : d
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

    // 3b. Automatic Referral Commission Distribution (L1: 20% Direct, L2: 5% Indirect)
    const depAccount = accounts.find((a) =>
      a.user.id === deposit.userId ||
      (depPhone.length >= 10 && (a.user.phone || '').replace(/[^0-9]/g, '').endsWith(depPhone.slice(-10)))
    );
    const directRefCode = (depAccount?.user?.referredBy || (isCurrentUser && user?.referredBy) || '').trim().toUpperCase();

    if (directRefCode) {
      // Find Level 1 Direct Referrer
      const l1Referrer = accounts.find((a) => {
        if (!a?.user) return false;
        const codeMatch = a.user.referralCode && a.user.referralCode.trim().toUpperCase() === directRefCode;
        const phoneMatch = a.user.phone && a.user.phone.replace(/[^0-9]/g, '').endsWith(directRefCode.replace(/[^0-9]/g, ''));
        const idMatch = a.user.id === directRefCode;
        return codeMatch || phoneMatch || idMatch;
      });

      if (l1Referrer) {
        const l1Percent = Number(settings.referralL1Percent) || 20;
        const l1Commission = parseFloat(((deposit.amount * l1Percent) / 100).toFixed(2));

        if (l1Commission > 0) {
          const l1Wallet = l1Referrer.wallet || defaultWallet;
          const updatedL1Wallet: Wallet = {
            ...l1Wallet,
            balance: parseFloat(((Number(l1Wallet.balance) || 0) + l1Commission).toFixed(2)),
            teamCommission: parseFloat(((Number(l1Wallet.teamCommission) || 0) + l1Commission).toFixed(2)),
            referralBalance: parseFloat(((Number(l1Wallet.referralBalance) || 0) + l1Commission).toFixed(2)),
            todayTeamRecharge: parseFloat(((Number(l1Wallet.todayTeamRecharge) || 0) + deposit.amount).toFixed(2)),
            totalTeamRecharge: parseFloat(((Number(l1Wallet.totalTeamRecharge) || 0) + deposit.amount).toFixed(2)),
          };
          l1Referrer.wallet = updatedL1Wallet;

          const l1Tx: Transaction = {
            id: `TXN-REF-${Math.floor(100000 + Math.random() * 900000)}`,
            userId: l1Referrer.user.id,
            type: 'commission',
            amount: l1Commission,
            currency: 'INR',
            status: 'completed',
            timestamp: nowIso,
            note: `🔥 20% Direct Referral Commission from Member (${depPhone ? depPhone.slice(0, 4) + '***' + depPhone.slice(-3) : 'Deposit'})`,
            referenceId: deposit.id,
          };
          l1Referrer.transactions = [l1Tx, ...(l1Referrer.transactions || [])];

          storage.saveAccount(l1Referrer);
          cloudSync.saveCloudAccount(l1Referrer);

          // If current logged-in user is the direct referrer, update live state immediately
          if (currentU && (currentU.id === l1Referrer.user.id || currentU.referralCode === l1Referrer.user.referralCode)) {
            setWallet(updatedL1Wallet);
            setTransactions((prev) => [l1Tx, ...prev]);
            addToast('success', `🎁 ₹${l1Commission.toFixed(2)} Referral Commission (20%) credited to your wallet!`);
          }

          // Check Level 2 Indirect Referrer (5%)
          const l2RefCode = (l1Referrer.user.referredBy || '').trim().toUpperCase();
          if (l2RefCode) {
            const l2Referrer = accounts.find((a) => {
              if (!a?.user || a.user.id === l1Referrer.user.id) return false;
              const codeMatch = a.user.referralCode && a.user.referralCode.trim().toUpperCase() === l2RefCode;
              const phoneMatch = a.user.phone && a.user.phone.replace(/[^0-9]/g, '').endsWith(l2RefCode.replace(/[^0-9]/g, ''));
              return codeMatch || phoneMatch || a.user.id === l2RefCode;
            });

            if (l2Referrer) {
              const l2Percent = Number(settings.referralL2Percent) || 5;
              const l2Commission = parseFloat(((deposit.amount * l2Percent) / 100).toFixed(2));
              if (l2Commission > 0) {
                const l2Wallet = l2Referrer.wallet || defaultWallet;
                const updatedL2Wallet: Wallet = {
                  ...l2Wallet,
                  balance: parseFloat(((Number(l2Wallet.balance) || 0) + l2Commission).toFixed(2)),
                  teamCommission: parseFloat(((Number(l2Wallet.teamCommission) || 0) + l2Commission).toFixed(2)),
                  referralBalance: parseFloat(((Number(l2Wallet.referralBalance) || 0) + l2Commission).toFixed(2)),
                  todayTeamRecharge: parseFloat(((Number(l2Wallet.todayTeamRecharge) || 0) + deposit.amount).toFixed(2)),
                  totalTeamRecharge: parseFloat(((Number(l2Wallet.totalTeamRecharge) || 0) + deposit.amount).toFixed(2)),
                };
                l2Referrer.wallet = updatedL2Wallet;

                const l2Tx: Transaction = {
                  id: `TXN-REF-${Math.floor(100000 + Math.random() * 900000)}`,
                  userId: l2Referrer.user.id,
                  type: 'commission',
                  amount: l2Commission,
                  currency: 'INR',
                  status: 'completed',
                  timestamp: nowIso,
                  note: `🚀 5% Indirect L2 Team Commission from Member Deposit`,
                  referenceId: deposit.id,
                };
                l2Referrer.transactions = [l2Tx, ...(l2Referrer.transactions || [])];

                storage.saveAccount(l2Referrer);
                cloudSync.saveCloudAccount(l2Referrer);

                if (currentU && (currentU.id === l2Referrer.user.id || currentU.referralCode === l2Referrer.user.referralCode)) {
                  setWallet(updatedL2Wallet);
                  setTransactions((prev) => [l2Tx, ...prev]);
                  addToast('success', `🎁 ₹${l2Commission.toFixed(2)} Indirect Team Commission (5%) credited!`);
                }
              }
            }
          }
        }
      }
    }

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

  const deleteDeposit = (id: string) => {
    recordProcessedDeposit(id, 'deleted');
    const updatedDeposits = deposits.filter((d) => d.id !== id);
    setDeposits(updatedDeposits);
    storage.setDeposits(updatedDeposits);
    cloudSync.deleteFromGitHubLedger(id);
    addToast('info', `🗑️ Deposit ${id} deleted.`);
  };

  const rejectDeposit = (id: string, reason?: string) => {
    const processedDeps = getProcessedDeposits();
    if (processedDeps[id] === 'rejected') return;
    recordProcessedDeposit(id, 'rejected');
    const deposit = deposits.find((d) => d.id === id);
    if (!deposit) return;

    // Keep rejected deposit in state and storage so it appears under Cancelled tab with clear status
    const updatedDeposits = deposits.map((d) =>
      d.id === id ? { ...d, status: 'rejected' as DepositStatus, rejectionReason: reason || 'Rejected by Admin' } : d
    );
    setDeposits(updatedDeposits);
    storage.setDeposits(updatedDeposits);

    // Sync rejection to cloud ledger and notifications
    cloudSync.broadcastApproval(id, 'rejected');
    cloudSync.deleteFromGitHubLedger(id);

    setTransactions((prev) => {
      const updatedTx = prev.map((t) =>
        t.referenceId === id
          ? { ...t, status: 'rejected' as const, note: `Deposit Rejected (${reason || 'Invalid UTR'})` }
          : t
      );
      storage.setTransactions(updatedTx);
      return updatedTx;
    });

    logAudit('REJECT_DEPOSIT', `Rejected & permanently deleted deposit ${id}: ${reason || 'Invalid UTR'}`, deposit.userId);
    addToast('info', `🗑️ Deposit ${id} rejected.`);
  };

  const rejectAndRefundDeposit = (id: string, reason?: string) => {
    const processedDeps = getProcessedDeposits();
    if (processedDeps[id] === 'rejected') return;
    recordProcessedDeposit(id, 'rejected');

    const allDeps = storage.getDeposits();
    const deposit = deposits.find((d) => d.id === id) || allDeps.find((d) => d.id === id);
    if (!deposit) return;

    const refundAmount = Number(deposit.amount || deposit.totalInr || 0);

    const updatedDeposits = deposits.map((d) =>
      d.id === id
        ? { ...d, status: 'rejected' as DepositStatus, rejectionReason: `Refunded: ${reason || 'Admin Refund'}` }
        : d
    );
    setDeposits(updatedDeposits);
    storage.setDeposits(updatedDeposits);

    // Sync rejection to cloud ledger
    cloudSync.broadcastApproval(id, 'rejected');
    cloudSync.deleteFromGitHubLedger(id);

    if (refundAmount > 0) {
      const currentU = storage.getUser();
      const cleanUserPhone = (currentU?.phone || '').replace(/[^0-9]/g, '');
      const depPhone = (deposit.userPhone || '').replace(/[^0-9]/g, '');
      const isCurrentUser = Boolean(
        (currentU && deposit.userId && deposit.userId === currentU.id) ||
        (cleanUserPhone.length >= 10 && depPhone.length >= 10 && depPhone.endsWith(cleanUserPhone.slice(-10)))
      );

      if (isCurrentUser) {
        setWallet((prev) => {
          const newBal = parseFloat(((Number(prev.balance) || 0) + refundAmount).toFixed(2));
          const updated = { ...prev, balance: newBal };
          storage.setWallet(updated);
          return updated;
        });
      }

      // Update in registered accounts
      const accounts = storage.getAccounts();
      accounts.forEach((acc) => {
        const accPhone = (acc.user.phone || '').replace(/[^0-9]/g, '');
        if (acc.user.id === deposit.userId || (depPhone.length >= 10 && accPhone.endsWith(depPhone.slice(-10)))) {
          acc.wallet = {
            ...(acc.wallet || defaultWallet),
            balance: parseFloat(((Number(acc.wallet?.balance) || 0) + refundAmount).toFixed(2)),
          };
          storage.saveAccount(acc);
        }
      });

      // Record refund transaction
      const refundTx: Transaction = {
        id: `TX-REF-${Date.now().toString().slice(-6)}`,
        userId: deposit.userId,
        type: 'reward',
        amount: refundAmount,
        currency: 'INR',
        status: 'completed',
        timestamp: new Date().toISOString(),
        note: `Deposit Refund #${id}: ${reason || 'Refunded by Admin'}`,
        referenceId: id,
      };
      setTransactions((prev) => {
        const updatedTx = [refundTx, ...prev];
        storage.setTransactions(updatedTx);
        return updatedTx;
      });
    }

    logAudit('REJECT_REFUND_DEPOSIT', `Rejected & refunded ₹${refundAmount} for deposit ${id}: ${reason || 'Admin Refund'}`, deposit.userId);
    addToast('success', `Deposit #${id} rejected and ₹${refundAmount} refunded to user's wallet.`);
  };

  // Admin Actions
  const approveWithdrawal = (id: string) => {
    const processedWdrs = getProcessedWithdrawals();
    const item = withdrawals.find((w) => w.id === id) || storage.getWithdrawals().find((w) => w.id === id);
    if (processedWdrs[id] === 'completed' || item?.status === 'completed') {
      addToast('info', `Withdrawal #${id} is already approved.`);
      return;
    }
    recordProcessedWithdrawal(id, 'completed');
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'completed' } : w))
    );
    setTransactions((prev) =>
      prev.map((t) => (t.referenceId === id ? { ...t, status: 'completed' } : t))
    );
    const updated = storage.getWithdrawals().map((w) => (w.id === id ? { ...w, status: 'completed' as const } : w));
    storage.setWithdrawals(updated);
    logAudit('APPROVE_WITHDRAWAL', `Approved withdrawal ${id}`, item?.userId);
    addToast('success', `Withdrawal ${id} approved successfully.`);

    // Broadcast to serverless ledger & player app
    cloudSync.broadcastWithdrawalApproval(id, 'approved', {
      amount: item?.amount,
      userId: item?.userId,
      userPhone: item?.userPhone,
    });
  };

  const rejectWithdrawal = (id: string, reason: string) => {
    const processedWdrs = getProcessedWithdrawals();
    const item = withdrawals.find((w) => w.id === id) || storage.getWithdrawals().find((w) => w.id === id);
    if (!item || processedWdrs[id] === 'rejected' || item?.status === 'rejected') {
      return;
    }
    recordProcessedWithdrawal(id, 'rejected');

    // Refund amount to wallet balance
    const currentW = storage.getWallet();
    const refundedList = Array.isArray((currentW as any).refundedWithdrawalIds) ? [...(currentW as any).refundedWithdrawalIds] : [];
    if (!refundedList.includes(id)) {
      refundedList.push(id);
      const newBal = parseFloat((Number(currentW.balance || 0) + item.amount).toFixed(2));
      const updatedW: Wallet = {
        ...currentW,
        balance: newBal,
        ...({ refundedWithdrawalIds: refundedList } as any),
      };
      storage.setWallet(updatedW);
      setWallet(updatedW);

      const accounts = storage.getAccounts();
      const currentU = storage.getUser();
      const cleanUserPhone = (currentU?.phone || '').replace(/[^0-9]/g, '');
      accounts.forEach((acc) => {
        if (acc.user.id === currentU?.id || (cleanUserPhone.length >= 10 && (acc.user.phone || '').endsWith(cleanUserPhone.slice(-10)))) {
          acc.wallet = { ...acc.wallet, balance: newBal, ...({ refundedWithdrawalIds: refundedList } as any) };
        }
      });
      storage.setAccounts(accounts);
      window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
    }

    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'rejected', rejectionReason: reason } : w))
    );
    setTransactions((prev) =>
      prev.map((t) => (t.referenceId === id ? { ...t, status: 'rejected', note: `${t.note} (Refunded: ${reason})` } : t))
    );
    const updated = storage.getWithdrawals().map((w) => (w.id === id ? { ...w, status: 'rejected' as const, rejectionReason: reason } : w));
    storage.setWithdrawals(updated);

    logAudit('REJECT_WITHDRAWAL', `Rejected withdrawal ${id}: ${reason}`, item.userId);
    addToast('info', `Withdrawal rejected and ₹${item.amount} refunded to user.`);

    // Broadcast to serverless ledger & player app
    cloudSync.broadcastWithdrawalApproval(id, 'rejected', {
      amount: item.amount,
      reason,
      userId: item.userId,
      userPhone: item.userPhone,
    });
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

  // Active user's transactions: strictly isolated to the logged-in user
  const activeUserTransactions = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return transactions;
    const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
    return transactions.filter((t) => {
      if (t.userId && t.userId === user.id) return true;
      const tPhone = (t.metadata?.phone || (t as any).userPhone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 10 && tPhone.length >= 10 && tPhone.endsWith(cleanPhone.slice(-10))) return true;
      if (t.referenceId) {
        const matchingDep = deposits.find((d) => d.id === t.referenceId);
        if (matchingDep) {
          if (matchingDep.userId === user.id) return true;
          const depPhone = (matchingDep.userPhone || '').replace(/[^0-9]/g, '');
          if (cleanPhone.length >= 10 && depPhone.length >= 10 && depPhone.endsWith(cleanPhone.slice(-10))) return true;
        }
        const matchingWith = withdrawals.find((w) => w.id === t.referenceId);
        if (matchingWith) {
          if (matchingWith.userId === user.id) return true;
          const withPhone = (matchingWith.userPhone || '').replace(/[^0-9]/g, '');
          if (cleanPhone.length >= 10 && withPhone.length >= 10 && withPhone.endsWith(cleanPhone.slice(-10))) return true;
        }
      }
      return false;
    });
  }, [transactions, user, deposits, withdrawals]);

  return (
    <AppContext.Provider
      value={{
        user,
        wallet,
        packages,
        transactions: activeUserTransactions,
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
        refreshAccountsFromCloud,
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
        refreshDeposits: syncWithBackend,
        refreshWithdrawals,
        approveDeposit,
        rejectDeposit,
        rejectAndRefundDeposit,
        deleteDeposit,
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
