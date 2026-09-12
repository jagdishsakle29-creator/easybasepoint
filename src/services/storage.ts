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
  SavedBankCard,
  SavedUpi,
  SavedUsdtAddress
} from '../types';

const STORAGE_KEYS = {
  USER: 'ebp_user',
  WALLET: 'ebp_wallet',
  PACKAGES: 'ebp_packages',
  TRANSACTIONS: 'ebp_transactions',
  DEPOSITS: 'ebp_deposits',
  WITHDRAWALS: 'ebp_withdrawals',
  TEAM: 'ebp_team',
  SETTINGS: 'ebp_settings',
  TICKETS: 'ebp_tickets',
  LOGS: 'ebp_audit_logs',
  BANK_CARDS: 'ebp_bank_cards',
  UPIS: 'ebp_upis',
  USDTS: 'ebp_usdts',
};

export const defaultUser: User = {
  id: 'ebp-usr-782914',
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@example.com',
  phone: '+91 98765 43210',
  referralCode: 'EBP-98241',
  telegram: '@rajesh_ebp',
  isGoogleAuthEnabled: false,
  role: 'user',
  status: 'active',
  createdAt: '2026-03-10T10:00:00Z',
};

export const defaultWallet: Wallet = {
  userId: 'ebp-usr-782914',
  balance: 508.20,
  quota: 508.00,
  referralBalance: 0.00,
  todayReceive: 0.00,
  teamCommission: 0.00,
  todayTeamRecharge: 0.00,
  todayTeamMembers: 0,
  totalTeamRecharge: 0.00,
  totalTeamMembers: 0,
};

export const defaultPackages: QuotaPackage[] = [
  // --- LOW TIER (LOW RISK, 7% return, up to 29,000 INR) ---
  {
    id: 'pkg-1',
    price: 500.00,
    income: 35.00,
    incomePercent: 7.00,
    quota: 535.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'pkg-2',
    price: 3000.00,
    income: 210.00,
    incomePercent: 7.00,
    quota: 3210.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'pkg-3',
    price: 10000.00,
    income: 700.00,
    incomePercent: 7.00,
    quota: 10700.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'pkg-4',
    price: 29000.00,
    income: 2030.00,
    incomePercent: 7.00,
    quota: 31030.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 4,
  },

  // --- MIDDLE TIER (MEDIUM RISK, 9% return, 28,000 to 47,000 INR) ---
  {
    id: 'pkg-5',
    price: 28000.00,
    income: 2520.00,
    incomePercent: 9.00,
    quota: 30520.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'pkg-6',
    price: 38000.00,
    income: 3420.00,
    incomePercent: 9.00,
    quota: 41420.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'pkg-7',
    price: 47000.00,
    income: 4230.00,
    incomePercent: 9.00,
    quota: 51230.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 7,
  },

  // --- HIGH TIER / VIP (HIGH RISK, 12% - 14% return, up to 1.5 Lakh INR) ---
  {
    id: 'pkg-8',
    price: 65000.00,
    income: 7800.00,
    incomePercent: 12.00,
    quota: 72800.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 7,
    isActive: true,
    sortOrder: 8,
  },
  {
    id: 'pkg-9',
    price: 100000.00,
    income: 13000.00,
    incomePercent: 13.00,
    quota: 113000.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 7,
    isActive: true,
    sortOrder: 9,
  },
  {
    id: 'pkg-10',
    price: 150000.00,
    income: 21000.00,
    incomePercent: 14.00,
    quota: 171000.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 7,
    isActive: true,
    sortOrder: 10,
  },
];

export const defaultSettings: RewardSettings = {
  usdtRate: 110.00,
  normalUsdtPrice: 105.00,
  inrRewardPercent: 13.00,
  lowBonusPercent: 7.00,
  middleBonusPercent: 9.00,
  highBonusPercent: 14.00,
  minWithdrawal: 200.00,
  withdrawalFeePercent: 5.00,
  referralL1Percent: 20.00,
  referralL2Percent: 5.00,
  isDemoMode: true,
  adminUpiId: 'easybasepoint@okhdfcbank',
  adminUpiName: 'EasyBasePoint Enterprise Solutions',
  adminBankName: 'HDFC Bank Ltd',
  adminBankAccount: '50200088991234',
  adminBankIfsc: 'HDFC0001234',
  adminBankHolder: 'EasyBasePoint Global Pvt Ltd',
  adminUsdtTrc20: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE',
  adminUsdtBep20: '0x71C836eB399C8c0F82f0E0f4Ec7aAc89F17Ac9E5',
  telegramChannelUrl: 'https://t.me/easybasepoint',
  adminSecretKey: 'lord12',
  telegramBotToken: '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M',
  adminTelegramChatId: '6527377657',
};

export const defaultTransactions: Transaction[] = [
  {
    id: 'TXN-809214',
    userId: 'ebp-usr-782914',
    type: 'deposit',
    amount: 500.00,
    currency: 'INR',
    status: 'completed',
    timestamp: '2026-09-10T14:22:10Z',
    note: 'INR Top Up via UPI Demo',
    referenceId: 'UPI-REF-99214',
  },
  {
    id: 'TXN-809215',
    userId: 'ebp-usr-782914',
    type: 'reward',
    amount: 8.20,
    currency: 'INR',
    status: 'completed',
    timestamp: '2026-09-10T14:22:15Z',
    note: 'Signup Welcome Bonus',
  },
];

export const defaultBankCards: SavedBankCard[] = [
  {
    id: 'card-1',
    bankName: 'State Bank of India',
    accountHolder: 'Rajesh Kumar',
    accountNumber: '••••••••4812',
    ifscCode: 'SBIN0001234',
    isDefault: true,
  }
];

export const defaultUpis: SavedUpi[] = [
  {
    id: 'upi-1',
    upiId: 'rajesh.kumar@okhdfcbank',
    accountHolder: 'Rajesh Kumar',
    isDefault: true,
  }
];

export const defaultUsdts: SavedUsdtAddress[] = [
  {
    id: 'usdt-1',
    address: 'TJ4b8xLm...KaxnSE',
    network: 'TRC20',
    label: 'Binance TRC20 Wallet',
    isDefault: true,
  }
];

export const storage = {
  getUser(): User {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : defaultUser;
  },
  setUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getWallet(): Wallet {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLET);
    return raw ? JSON.parse(raw) : defaultWallet;
  },
  setWallet(wallet: Wallet): void {
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(wallet));
  },

  getPackages(): QuotaPackage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    return raw ? JSON.parse(raw) : defaultPackages;
  },
  setPackages(packages: QuotaPackage[]): void {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  },

  getTransactions(): Transaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : defaultTransactions;
  },
  setTransactions(transactions: Transaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getDeposits(): DepositOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
    return raw ? JSON.parse(raw) : [];
  },
  setDeposits(deposits: DepositOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
  },

  getWithdrawals(): WithdrawalRequest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
    return raw ? JSON.parse(raw) : [];
  },
  setWithdrawals(withdrawals: WithdrawalRequest[]): void {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
  },

  getTeam(): TeamMember[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
    return raw ? JSON.parse(raw) : [];
  },
  setTeam(team: TeamMember[]): void {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
  },

  getSettings(): RewardSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return defaultSettings;
    try {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed };
    } catch {
      return defaultSettings;
    }
  },
  setSettings(settings: RewardSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getBankCards(): SavedBankCard[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BANK_CARDS);
    return raw ? JSON.parse(raw) : defaultBankCards;
  },
  setBankCards(cards: SavedBankCard[]): void {
    localStorage.setItem(STORAGE_KEYS.BANK_CARDS, JSON.stringify(cards));
  },

  getUpis(): SavedUpi[] {
    const raw = localStorage.getItem(STORAGE_KEYS.UPIS);
    return raw ? JSON.parse(raw) : defaultUpis;
  },
  setUpis(upis: SavedUpi[]): void {
    localStorage.setItem(STORAGE_KEYS.UPIS, JSON.stringify(upis));
  },

  getUsdts(): SavedUsdtAddress[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USDTS);
    return raw ? JSON.parse(raw) : defaultUsdts;
  },
  setUsdts(usdts: SavedUsdtAddress[]): void {
    localStorage.setItem(STORAGE_KEYS.USDTS, JSON.stringify(usdts));
  },

  getTickets(): SupportTicket[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return raw ? JSON.parse(raw) : [];
  },
  setTickets(tickets: SupportTicket[]): void {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },

  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  },
  setAuditLogs(logs: AuditLog[]): void {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  resetAll(): void {
    localStorage.clear();
  }
};
