import React, { createContext, useContext, useState, useEffect } from 'react';
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
  buyQuota: (pkg: QuotaPackage) => { success: boolean; message: string };
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
  approveDeposit: (id: string) => void;
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

  // Instant Real-Time Cloud Sync (SSE Stream + 2s Polling Fallback)
  useEffect(() => {
    const processedEvents = new Set<string>();

    const applyApprovalEvent = (event: { depId: string; action: 'approved' | 'rejected'; totalInr?: number }) => {
      const key = `${event.depId}-${event.action}`;
      if (processedEvents.has(key)) return;
      processedEvents.add(key);

      if (event.action === 'approved') {
        const allCurrentDeps = storage.getDeposits();
        const matched = allCurrentDeps.find((d) => d.id === event.depId) || deposits.find((d) => d.id === event.depId);
        const amountToAdd = matched ? matched.totalInr : (event.totalInr && event.totalInr > 0 ? event.totalInr : 565);
        const quotaToAdd = matched ? matched.amount : 500;

        // 1. Credit wallet in React state and localStorage immediately
        setWallet((prev) => {
          const newBal = parseFloat(((Number(prev.balance) || 0) + amountToAdd).toFixed(2));
          const newQuota = parseFloat(((Number(prev.quota) || 0) + quotaToAdd).toFixed(2));
          const updatedW: Wallet = { ...prev, balance: newBal, quota: newQuota, todayReceive: parseFloat(((Number(prev.todayReceive) || 0) + amountToAdd).toFixed(2)) };
          storage.setWallet(updatedW);
          return updatedW;
        });

        // 2. Mark deposit as completed
        setDeposits((prev) => {
          const updated = prev.map((d) => d.id === event.depId ? { ...d, status: 'completed' as const } : d);
          storage.setDeposits(updated);
          return updated;
        });

        // 3. Mark transaction as completed
        setTransactions((prev) => {
          const updated = prev.map((t) =>
            t.referenceId === event.depId
              ? { ...t, status: 'completed' as const, amount: amountToAdd, note: `INR Deposit Approved (+Bonus)` }
              : t
          );
          storage.setTransactions(updated);
          return updated;
        });

        // 4. Update matching registered accounts
        const accounts = storage.getAccounts();
        accounts.forEach((acc) => {
          if (!matched || acc.user.id === matched.userId || (matched.userPhone && acc.user.phone.endsWith(matched.userPhone.slice(-10)))) {
            acc.wallet.balance = parseFloat(((Number(acc.wallet.balance) || 0) + amountToAdd).toFixed(2));
            acc.wallet.quota = parseFloat(((Number(acc.wallet.quota) || 0) + quotaToAdd).toFixed(2));
            storage.saveAccount(acc);
          }
        });

        // 5. Fire celebratory screen Confetti
        try {
          confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
        } catch {}

        // 6. Show big success toast
        addToast('success', `🎉 Payment Approved! ₹${amountToAdd.toFixed(2)} credited to your game wallet!`);
        window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
      }
    };

    // Connect SSE stream (0.1s instant event delivery!)
    const unsubscribeSSE = cloudSync.subscribeToApprovals(applyApprovalEvent);

    // Also poll recent approvals every 2 seconds as backup
    let isCancelled = false;
    const pollFallback = async () => {
      if (isCancelled) return;
      const recent = await cloudSync.getRecentApprovals();
      for (const ev of recent) {
        applyApprovalEvent(ev);
      }
    };

    const intervalId = setInterval(pollFallback, 2000);
    pollFallback();

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
      unsubscribeSSE();
    };
  }, []);

  // Listen for incoming deposits from players across all devices in real-time
  useEffect(() => {
    const unsubscribeDeposits = cloudSync.subscribeToDeposits((incoming) => {
      setDeposits((prev) => {
        if (prev.some((d) => d.id === incoming.id)) return prev;
        const newDep: DepositOrder = {
          id: incoming.id,
          userId: incoming.userId,
          userPhone: incoming.userPhone,
          amount: incoming.amount,
          method: 'INR',
          calculatedInr: incoming.amount,
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

  // Watch for completed/approved deposits to notify user with popup
  const [notifiedDepositIds, setNotifiedDepositIds] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    deposits.forEach((dep) => {
      if (dep.status === 'completed' && !notifiedDepositIds.has(dep.id)) {
        setNotifiedDepositIds((prev) => new Set(prev).add(dep.id));
        // If this belongs to user or user is active
        if (!user || dep.userId === user.id || (user.phone && dep.userPhone && user.phone.endsWith(dep.userPhone.slice(-10)))) {
          addToast('success', `🎉 Payment Approved! ₹${dep.totalInr.toFixed(2)} added to your game wallet!`);
        }
      } else if (dep.status === 'rejected' && !notifiedDepositIds.has(dep.id)) {
        setNotifiedDepositIds((prev) => new Set(prev).add(dep.id));
        if (!user || dep.userId === user.id || (user.phone && dep.userPhone && user.phone.endsWith(dep.userPhone.slice(-10)))) {
          addToast('error', `❌ Payment of ₹${dep.totalInr.toFixed(2)} was rejected by admin.`);
        }
      }
    });
  }, [deposits, user]);

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
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
      addToast('error', '❌ Account not found! Pehle register karke account banayein.');
      return { success: false, notFound: true, message: 'Account not found. Kripya pehle Sign Up karein.' };
    }

    if (existingAccount.password && existingAccount.password !== pass) {
      addToast('error', '❌ Galat password! Password check karke dobara enter karein.');
      return { success: false, wrongPassword: true, message: 'Incorrect password. Galat password dala aapne.' };
    }

    setUser(existingAccount.user);
    setWallet(existingAccount.wallet);
    addToast('success', `Welcome back, ${existingAccount.user.name}!`);
    window.dispatchEvent(new CustomEvent('ebp:user-logged-in'));
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

  // Buying Quota
  const buyQuota = (pkg: QuotaPackage): { success: boolean; message: string } => {
    if (!user) {
      addToast('error', 'Please log in to purchase a quota package.');
      return { success: false, message: 'Not logged in' };
    }
    if (wallet.balance < pkg.price) {
      addToast('error', `Insufficient wallet balance (₹${wallet.balance.toFixed(2)}). Please top up first.`);
      return { success: false, message: 'Insufficient balance' };
    }

    const newBalance = wallet.balance - pkg.price;
    const newQuota = wallet.quota + pkg.quota;
    const rewardEarned = pkg.income;

    setWallet((prev) => ({
      ...prev,
      balance: parseFloat(newBalance.toFixed(2)),
      quota: parseFloat(newQuota.toFixed(2)),
      todayReceive: parseFloat((prev.todayReceive + rewardEarned).toFixed(2)),
    }));

    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTx: Transaction = {
      id: txnId,
      userId: user.id,
      type: 'quota_purchase',
      amount: pkg.price,
      currency: 'INR',
      status: 'completed',
      timestamp: new Date().toISOString(),
      note: `Quota Purchase: ₹${pkg.price} (+${pkg.incomePercent}% Bonus)`,
      referenceId: pkg.id,
      metadata: { quotaReceived: pkg.quota, income: pkg.income }
    };

    setTransactions((prev) => [newTx, ...prev]);
    logAudit('QUOTA_BUY', `User ${user.name} bought quota package ₹${pkg.price}`, user.id);
    addToast('success', `Successfully purchased ₹${pkg.price} quota package!`);
    return { success: true, message: 'Purchase successful' };
  };

  // Submitting INR Deposit
  const submitInrDeposit = (amount: number, refNumber: string): { success: boolean; message: string } => {
    if (amount <= 0) return { success: false, message: 'Invalid amount' };

    // Ensure active user exists (auto-provision guest player if needed so deposit is never lost)
    const activeUser: User = user || {
      id: `USR-${Date.now().toString().slice(-6)}`,
      name: 'Player',
      phone: '9876543210',
      email: 'player@gmail.com',
      referralCode: 'EBP100',
      isGoogleAuthEnabled: false,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    if (!user) {
      setUser(activeUser);
      storage.setUser(activeUser);
    }

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
      addToast('info', `Deposit of ₹${amount} submitted! Check karke 5-7 minutes me balance add ho jayega.`);
    }

    return { success: true, message: 'Deposit recorded' };
  };

  // Submitting USDT Deposit
  const submitUsdtDeposit = (usdtAmount: number, network: string, txHash: string): { success: boolean; message: string } => {
    if (!user) return { success: false, message: 'Not logged in' };
    if (usdtAmount <= 0) return { success: false, message: 'Invalid amount' };

    const calculatedInr = usdtAmount * settings.usdtRate;
    const bonusInr = (calculatedInr * settings.inrRewardPercent) / 100;
    const activityReward = usdtAmount >= 100 ? (calculatedInr * 0.03) : 0;
    const totalInr = calculatedInr + bonusInr + activityReward;

    const newDeposit: DepositOrder = {
      id: `USDT-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      amount: usdtAmount,
      method: 'USDT',
      calculatedInr,
      bonusInr,
      activityRewardInr: activityReward,
      totalInr,
      network,
      walletAddress: settings.adminUsdtTrc20,
      status: settings.isDemoMode ? 'completed' : 'pending',
      createdAt: new Date().toISOString(),
      proofUrl: txHash,
    };

    setDeposits((prev) => [newDeposit, ...prev]);
    telegramService.sendDepositAlert(newDeposit, user.name, user.phone, settings);

    if (settings.isDemoMode) {
      setWallet((prev) => ({
        ...prev,
        balance: parseFloat((prev.balance + totalInr).toFixed(2)),
        quota: parseFloat((prev.quota + calculatedInr).toFixed(2)),
      }));

      const newTx: Transaction = {
        id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        userId: user.id,
        type: 'deposit',
        amount: totalInr,
        currency: 'INR',
        status: 'completed',
        timestamp: new Date().toISOString(),
        note: `USDT Deposit: ${usdtAmount} USDT @ ₹${settings.usdtRate} (Demo Credited)`,
        referenceId: newDeposit.id,
      };
      setTransactions((prev) => [newTx, ...prev]);
      addToast('success', `Demo USDT credited: ₹${totalInr.toFixed(2)} added!`);
    } else {
      addToast('info', 'USDT Order created! Blockchain confirmation pending.');
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
  const approveDeposit = (id: string) => {
    let allDeps = storage.getDeposits();
    const deposit = allDeps.find((d) => d.id === id) || deposits.find((d) => d.id === id);
    if (!deposit) return;

    // 1. Mark deposit as completed in state and storage
    const updatedDeposits = (allDeps.length > 0 ? allDeps : deposits).map((d) =>
      d.id === id ? { ...d, status: 'completed' as const } : d
    );
    setDeposits(updatedDeposits);
    storage.setDeposits(updatedDeposits);

    // 2. Add full amount to game wallet balance and quota!
    setWallet((prevWallet) => {
      const curBal = Number(prevWallet.balance) || 0;
      const curQuota = Number(prevWallet.quota) || 0;
      const addBal = Number(deposit.totalInr) || 0;
      const addQuota = Number(deposit.amount) || 0;
      const newWallet: Wallet = {
        ...prevWallet,
        balance: parseFloat((curBal + addBal).toFixed(2)),
        quota: parseFloat((curQuota + addQuota).toFixed(2)),
        todayReceive: parseFloat(((Number(prevWallet.todayReceive) || 0) + addBal).toFixed(2)),
      };
      storage.setWallet(newWallet);
      return newWallet;
    });

    const rawWallet = storage.getWallet();
    const updatedRawWallet: Wallet = {
      ...rawWallet,
      balance: parseFloat(((Number(rawWallet.balance) || 0) + deposit.totalInr).toFixed(2)),
      quota: parseFloat(((Number(rawWallet.quota) || 0) + deposit.amount).toFixed(2)),
      todayReceive: parseFloat(((Number(rawWallet.todayReceive) || 0) + deposit.totalInr).toFixed(2)),
    };
    storage.setWallet(updatedRawWallet);

    // 3. Update target account in registered accounts if exists
    const accounts = storage.getAccounts();
    accounts.forEach((acc) => {
      if (acc.user.id === deposit.userId || (deposit.userPhone && acc.user.phone.endsWith(deposit.userPhone.slice(-10)))) {
        acc.wallet.balance = parseFloat(((Number(acc.wallet.balance) || 0) + deposit.totalInr).toFixed(2));
        acc.wallet.quota = parseFloat(((Number(acc.wallet.quota) || 0) + deposit.amount).toFixed(2));
        acc.wallet.todayReceive = parseFloat(((Number(acc.wallet.todayReceive) || 0) + deposit.totalInr).toFixed(2));
        storage.saveAccount(acc);
      }
    });

    // 4. Update or create transaction record in history
    setTransactions((prev) => {
      const exists = prev.some((t) => t.referenceId === id);
      let updatedTxList: Transaction[];
      if (exists) {
        updatedTxList = prev.map((t) =>
          t.referenceId === id
            ? { ...t, status: 'completed' as const, amount: deposit.totalInr, note: `INR Deposit Approved (+₹${(deposit.bonusInr + deposit.activityRewardInr).toFixed(0)} Bonus)` }
            : t
        );
      } else {
        const newTx: Transaction = {
          id: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          userId: deposit.userId,
          type: 'deposit',
          amount: deposit.totalInr,
          currency: 'INR',
          status: 'completed',
          timestamp: new Date().toISOString(),
          note: `INR Deposit Approved (+₹${(deposit.bonusInr + deposit.activityRewardInr).toFixed(0)} Bonus)`,
          referenceId: deposit.id,
        };
        updatedTxList = [newTx, ...prev];
      }
      storage.setTransactions(updatedTxList);
      return updatedTxList;
    });

    // 5. Instant Real-Time Broadcast to all players via ntfy.sh (0.1s latency)
    cloudSync.broadcastApproval(deposit.id, 'approved', deposit.totalInr);

    // 6. Celebration confetti & audit log
    try {
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 },
      });
    } catch {}

    window.dispatchEvent(new CustomEvent('ebp:wallet-updated'));
    logAudit('APPROVE_DEPOSIT', `Approved deposit ${id}: ₹${deposit.totalInr} added to wallet`, deposit.userId);
    addToast('success', `🎉 Payment Approved! ₹${deposit.totalInr.toFixed(2)} has been added to game wallet!`);
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
