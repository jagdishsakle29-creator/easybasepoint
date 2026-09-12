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
  USER: 'ebp_v2_user',
  WALLET: 'ebp_v2_wallet',
  PACKAGES: 'ebp_v2_packages',
  TRANSACTIONS: 'ebp_v2_transactions',
  DEPOSITS: 'ebp_v2_deposits',
  WITHDRAWALS: 'ebp_v2_withdrawals',
  TEAM: 'ebp_v2_team',
  SETTINGS: 'ebp_v2_settings',
  TICKETS: 'ebp_v2_tickets',
  LOGS: 'ebp_v2_audit_logs',
  BANK_CARDS: 'ebp_v2_bank_cards',
  UPIS: 'ebp_v2_upis',
  USDTS: 'ebp_v2_usdts',
  ACCOUNTS: 'ebp_v2_accounts',
  CREDITED_DEPOSITS: 'ebp_v2_credited_deposits',
};

export interface RegisteredAccount {
  user: User;
  password?: string;
  wallet: Wallet;
}

export const defaultUser: User | null = null;

export const defaultWallet: Wallet = {
  userId: '',
  balance: 0.00,
  quota: 0.00,
  referralBalance: 0.00,
  todayReceive: 0.00,
  teamCommission: 0.00,
  todayTeamRecharge: 0.00,
  todayTeamMembers: 0,
  totalTeamRecharge: 0.00,
  totalTeamMembers: 0,
  creditedDepositIds: [],
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
    price: 890.00,
    income: 62.30,
    incomePercent: 7.00,
    quota: 952.30,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'pkg-3',
    price: 1400.00,
    income: 98.00,
    incomePercent: 7.00,
    quota: 1498.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'pkg-4',
    price: 2100.00,
    income: 147.00,
    incomePercent: 7.00,
    quota: 2247.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'pkg-5',
    price: 3000.00,
    income: 210.00,
    incomePercent: 7.00,
    quota: 3210.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'pkg-6',
    price: 5500.00,
    income: 385.00,
    incomePercent: 7.00,
    quota: 5885.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'pkg-7',
    price: 10000.00,
    income: 700.00,
    incomePercent: 7.00,
    quota: 10700.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 7,
  },
  {
    id: 'pkg-8',
    price: 18000.00,
    income: 1260.00,
    incomePercent: 7.00,
    quota: 19260.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 8,
  },
  {
    id: 'pkg-9',
    price: 29000.00,
    income: 2030.00,
    incomePercent: 7.00,
    quota: 31030.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 9,
  },

  // --- MIDDLE TIER (MEDIUM RISK, 9% return, 28,000 to 47,000 INR) ---
  {
    id: 'pkg-10',
    price: 28000.00,
    income: 2520.00,
    incomePercent: 9.00,
    quota: 30520.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 10,
  },
  {
    id: 'pkg-11',
    price: 35000.00,
    income: 3150.00,
    incomePercent: 9.00,
    quota: 38150.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 11,
  },
  {
    id: 'pkg-12',
    price: 42000.00,
    income: 3780.00,
    incomePercent: 9.00,
    quota: 45780.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 12,
  },
  {
    id: 'pkg-13',
    price: 47000.00,
    income: 4230.00,
    incomePercent: 9.00,
    quota: 51230.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 13,
  },

  // --- HIGH TIER / VIP (HIGH RISK, 12% - 14% return, up to 1.5 Lakh INR) ---
  {
    id: 'pkg-14',
    price: 65000.00,
    income: 7800.00,
    incomePercent: 12.00,
    quota: 72800.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 7,
    isActive: true,
    sortOrder: 14,
  },
  {
    id: 'pkg-15',
    price: 85000.00,
    income: 10625.00,
    incomePercent: 12.50,
    quota: 95625.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 7,
    isActive: true,
    sortOrder: 15,
  },
  {
    id: 'pkg-16',
    price: 100000.00,
    income: 13000.00,
    incomePercent: 13.00,
    quota: 113000.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 7,
    isActive: true,
    sortOrder: 16,
  },
  {
    id: 'pkg-17',
    price: 125000.00,
    income: 16875.00,
    incomePercent: 13.50,
    quota: 141875.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 7,
    isActive: true,
    sortOrder: 17,
  },
  {
    id: 'pkg-18',
    price: 150000.00,
    income: 21000.00,
    incomePercent: 14.00,
    quota: 171000.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 7,
    isActive: true,
    sortOrder: 18,
  },
];

export const defaultSettings: RewardSettings = {
  usdtRate: 110.00,
  normalUsdtPrice: 105.00,
  inrRewardPercent: 13.00,
  lowBonusPercent: 7.00,
  middleBonusPercent: 9.00,
  highBonusPercent: 14.00,
  minWithdrawal: 450.00,
  withdrawalFeePercent: 0.00,
  referralL1Percent: 20.00,
  referralL2Percent: 5.00,
  isDemoMode: false,
  adminUpiId: 'basepnt@ybl',
  adminUpiName: 'Bank Of India (basepnt@ybl)',
  adminBankName: 'Bank Of India',
  adminBankAccount: '7855',
  adminBankIfsc: 'BKID0007855',
  adminBankHolder: 'EasyBasePoint Primary',
  adminUsdtTrc20: 'TTsZk5wTANw2MrBxn6xTNdHpeFFtBG4rLW',
  adminUsdtBep20: '0x71C836eB399C8c0F82f0E0f4Ec7aAc89F17Ac9E5',
  telegramChannelUrl: 'https://t.me/easybasepoint',
  adminSecretKey: 'lord12',
  telegramBotToken: '8787525713:AAGbp7iUbvphivcL6W-ca9TDsZ_xXGv4a7M',
  adminTelegramChatId: '6527377657',
  emailApiKey: '',
  emailProvider: 'BREVO',
  fromEmail: 'security@easybasepoint.com',
};

export const defaultTransactions: Transaction[] = [];

export const defaultBankCards: SavedBankCard[] = [];

export const defaultUpis: SavedUpi[] = [];

export const defaultUsdts: SavedUsdtAddress[] = [];

export const storage = {
  getUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  getWallet(): Wallet {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLET);
    if (!raw) return { ...defaultWallet, creditedDepositIds: [] };
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.creditedDepositIds)) {
        parsed.creditedDepositIds = [];
      }
      return parsed;
    } catch {
      return { ...defaultWallet, creditedDepositIds: [] };
    }
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

  getCreditedDepositIds(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDITED_DEPOSITS);
    return raw ? JSON.parse(raw) : [];
  },
  isDepositCredited(id: string): boolean {
    if (!id) return false;
    const list = this.getCreditedDepositIds();
    return list.includes(id);
  },
  markDepositCredited(id: string): boolean {
    if (!id) return false;
    const list = this.getCreditedDepositIds();
    if (list.includes(id)) {
      return false; // Already credited
    }
    list.push(id);
    localStorage.setItem(STORAGE_KEYS.CREDITED_DEPOSITS, JSON.stringify(list));
    return true; // Newly credited
  },
  removeCreditedDeposit(id: string): void {
    if (!id) return;
    const list = this.getCreditedDepositIds().filter((x) => x !== id);
    localStorage.setItem(STORAGE_KEYS.CREDITED_DEPOSITS, JSON.stringify(list));
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
      if (!parsed.adminUpiId || parsed.adminUpiId === 'easybasepoint@okhdfcbank') {
        parsed.adminUpiId = 'basepnt@ybl';
        parsed.adminUpiName = 'Bank Of India (basepnt@ybl)';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (!parsed.minWithdrawal || parsed.minWithdrawal < 450) {
        parsed.minWithdrawal = 450.00;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (!parsed.adminUsdtTrc20 || parsed.adminUsdtTrc20 === 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE') {
        parsed.adminUsdtTrc20 = 'TTsZk5wTANw2MrBxn6xTNdHpeFFtBG4rLW';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
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

  getAccounts(): RegisteredAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
  },
  saveAccount(account: RegisteredAccount): void {
    const accounts = this.getAccounts();
    const cleanPhone = account.user.phone.replace(/[^0-9]/g, '');
    const cleanEmail = (account.user.email || '').toLowerCase().trim();

    const index = accounts.findIndex((a) => {
      const aPhone = a.user.phone.replace(/[^0-9]/g, '');
      const aEmail = (a.user.email || '').toLowerCase().trim();
      return (
        (cleanPhone && aPhone.endsWith(cleanPhone.slice(-10))) ||
        (cleanEmail && aEmail === cleanEmail)
      );
    });

    if (index >= 0) {
      accounts[index] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },
  findAccount(emailOrPhone: string): RegisteredAccount | undefined {
    if (!emailOrPhone) return undefined;
    const accounts = this.getAccounts();
    const clean = emailOrPhone.trim().toLowerCase();
    const cleanDigits = emailOrPhone.replace(/[^0-9]/g, '');

    return accounts.find((a) => {
      const aPhone = a.user.phone.replace(/[^0-9]/g, '');
      const aEmail = (a.user.email || '').toLowerCase().trim();
      
      // Check phone match
      if (cleanDigits.length >= 10 && aPhone.endsWith(cleanDigits.slice(-10))) {
        return true;
      }
      // Check email match
      if (clean.includes('@') && aEmail === clean) {
        return true;
      }
      return false;
    });
  },

  resetAll(): void {
    localStorage.clear();
  }
};
