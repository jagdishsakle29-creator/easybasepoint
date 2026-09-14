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
  transactionPin?: string;
  wallet: Wallet;
  transactions?: Transaction[];
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
  // --- LOW TIER (LOW RISK, 8-10% return, starting from 200 INR) ---
  {
    id: 'pkg-1',
    price: 200.00,
    income: 20.00,
    incomePercent: 10.00,
    quota: 220.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'pkg-2',
    price: 350.00,
    income: 31.50,
    incomePercent: 9.00,
    quota: 381.50,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'pkg-3',
    price: 500.00,
    income: 45.00,
    incomePercent: 9.00,
    quota: 545.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'pkg-4',
    price: 800.00,
    income: 72.00,
    incomePercent: 9.00,
    quota: 872.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'pkg-5',
    price: 1200.00,
    income: 108.00,
    incomePercent: 9.00,
    quota: 1308.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'pkg-6',
    price: 2000.00,
    income: 180.00,
    incomePercent: 9.00,
    quota: 2180.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'pkg-7',
    price: 3500.00,
    income: 315.00,
    incomePercent: 9.00,
    quota: 3815.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 7,
  },
  {
    id: 'pkg-8',
    price: 5000.00,
    income: 450.00,
    incomePercent: 9.00,
    quota: 5450.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 8,
  },
  {
    id: 'pkg-9',
    price: 8000.00,
    income: 720.00,
    incomePercent: 9.00,
    quota: 8720.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 9,
  },

  // --- MIDDLE TIER (MEDIUM RISK, 10-11% return, 12,000 to 25,000 INR) ---
  {
    id: 'pkg-10',
    price: 12000.00,
    income: 1200.00,
    incomePercent: 10.00,
    quota: 13200.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 2,
    isActive: true,
    sortOrder: 10,
  },
  {
    id: 'pkg-11',
    price: 18000.00,
    income: 1800.00,
    incomePercent: 10.00,
    quota: 19800.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 2,
    isActive: true,
    sortOrder: 11,
  },
  {
    id: 'pkg-12',
    price: 25000.00,
    income: 2750.00,
    incomePercent: 11.00,
    quota: 27750.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 2,
    isActive: true,
    sortOrder: 12,
  },

  // --- HIGH TIER / VIP (HIGH RISK, 12% - 14% return, 35,000 to 50,000 INR) ---
  {
    id: 'pkg-13',
    price: 35000.00,
    income: 4200.00,
    incomePercent: 12.00,
    quota: 39200.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 13,
  },
  {
    id: 'pkg-14',
    price: 50000.00,
    income: 6500.00,
    incomePercent: 13.00,
    quota: 56500.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 14,
  },
];

export const defaultSettings: RewardSettings = {
  usdtRate: 110.00,
  normalUsdtPrice: 105.00,
  inrRewardPercent: 13.00,
  lowBonusPercent: 7.00,
  middleBonusPercent: 9.00,
  highBonusPercent: 14.00,
  minWithdrawal: 100.00,
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
    if (!raw) return defaultPackages;
    try {
      const parsed: QuotaPackage[] = JSON.parse(raw);
      if (!parsed || parsed.length === 0 || parsed[0].price !== 200) {
        localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(defaultPackages));
        return defaultPackages;
      }
      return parsed;
    } catch {
      return defaultPackages;
    }
  },
  setPackages(packages: QuotaPackage[]): void {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(packages));
  },

  getTransactions(): Transaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return defaultTransactions;
    try {
      const parsed: Transaction[] = JSON.parse(raw);
      const TWENTY_MINS_MS = 20 * 60 * 1000;
      const valid = parsed.filter((t) => {
        const isPending = t.status === 'pending' || (t.status as string) === 'processing' || (t.status as string) === 'pending_verification';
        if (isPending) {
          const time = new Date(t.timestamp).getTime();
          if (!isNaN(time) && Date.now() - time > TWENTY_MINS_MS) {
            return false; // Auto-hide expired pending (>20m)
          }
        }
        return true;
      });
      return valid.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return defaultTransactions;
    }
  },
  setTransactions(transactions: Transaction[]): void {
    const sorted = [...transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(sorted));
  },

  getUserTransactions(userId: string, userPhone?: string): Transaction[] {
    if (!userId && !userPhone) return [];
    const all = this.getTransactions();
    const cleanPhone = (userPhone || '').replace(/[^0-9]/g, '');
    return all.filter((t) => {
      if (userId && t.userId === userId) return true;
      const tPhone = (t.metadata?.phone || (t as any).userPhone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 10 && tPhone.length >= 10 && tPhone.endsWith(cleanPhone.slice(-10))) return true;
      return false;
    });
  },

  getDeposits(): DepositOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
    if (!raw) return [];
    try {
      const parsed: DepositOrder[] = JSON.parse(raw);
      return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  },
  setDeposits(deposits: DepositOrder[]): void {
    const sorted = [...deposits].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(sorted));
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
    if (!raw) return [];
    try {
      const parsed: WithdrawalRequest[] = JSON.parse(raw);
      return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  },
  setWithdrawals(withdrawals: WithdrawalRequest[]): void {
    const sorted = [...withdrawals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(sorted));
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
  setAccounts(accounts: RegisteredAccount[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
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
  findAccount(emailOrPhoneOrId: string): RegisteredAccount | undefined {
    if (!emailOrPhoneOrId) return undefined;
    const accounts = this.getAccounts();
    if (accounts.length === 0) return undefined;

    const clean = emailOrPhoneOrId.trim().toLowerCase();
    const cleanDigits = emailOrPhoneOrId.replace(/[^0-9]/g, '');

    // 1. Check direct ID match
    const byId = accounts.find((a) => a.user.id && a.user.id === emailOrPhoneOrId.trim());
    if (byId) return byId;

    // 2. Check phone or email match
    const byPhoneOrEmail = accounts.find((a) => {
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
    if (byPhoneOrEmail) return byPhoneOrEmail;

    // 3. Fallback: if only 1 account exists on this device/browser, return it
    if (accounts.length === 1) {
      return accounts[0];
    }

    return undefined;
  },

  resetAll(): void {
    localStorage.clear();
  }
};
