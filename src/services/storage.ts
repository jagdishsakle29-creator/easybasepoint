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
  allowInitialPasswordSet?: boolean;
  isReconstructedFromLedger?: boolean;
  updatedAt?: string;
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
  // --- LOW TIER (LOW RISK, 22% return, up to 15,000 INR) ---
  {
    id: 'pkg-2',
    price: 350.00,
    income: 77.00,
    incomePercent: 22.00,
    quota: 427.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'pkg-3',
    price: 500.00,
    income: 110.00,
    incomePercent: 22.00,
    quota: 610.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'pkg-4',
    price: 800.00,
    income: 176.00,
    incomePercent: 22.00,
    quota: 976.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'pkg-5',
    price: 1200.00,
    income: 264.00,
    incomePercent: 22.00,
    quota: 1464.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'pkg-6',
    price: 2000.00,
    income: 440.00,
    incomePercent: 22.00,
    quota: 2440.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'pkg-7',
    price: 3500.00,
    income: 770.00,
    incomePercent: 22.00,
    quota: 4270.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'pkg-8',
    price: 5000.00,
    income: 1100.00,
    incomePercent: 22.00,
    quota: 6100.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 7,
  },
  {
    id: 'pkg-9',
    price: 8000.00,
    income: 1760.00,
    incomePercent: 22.00,
    quota: 9760.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 8,
  },
  {
    id: 'pkg-10',
    price: 12000.00,
    income: 2640.00,
    incomePercent: 22.00,
    quota: 14640.00,
    level: 'LOW',
    riskLevel: 'LOW RISK',
    durationDays: 1,
    isActive: true,
    sortOrder: 9,
  },

  // --- MIDDLE TIER (MEDIUM RISK, 25% return, 15,000 to 29,000 INR) ---
  {
    id: 'pkg-11',
    price: 15000.00,
    income: 3750.00,
    incomePercent: 25.00,
    quota: 18750.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 2,
    isActive: true,
    sortOrder: 10,
  },
  {
    id: 'pkg-12',
    price: 20000.00,
    income: 5000.00,
    incomePercent: 25.00,
    quota: 25000.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 2,
    isActive: true,
    sortOrder: 11,
  },
  {
    id: 'pkg-13',
    price: 25000.00,
    income: 6250.00,
    incomePercent: 25.00,
    quota: 31250.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 2,
    isActive: true,
    sortOrder: 12,
  },
  {
    id: 'pkg-14',
    price: 29000.00,
    income: 7250.00,
    incomePercent: 25.00,
    quota: 36250.00,
    level: 'MIDDLE',
    riskLevel: 'MEDIUM RISK',
    durationDays: 2,
    isActive: true,
    sortOrder: 13,
  },

  // --- HIGH TIER / VIP (HIGH RISK, 30% return, 37,000 to 55,000 INR) ---
  {
    id: 'pkg-15',
    price: 37000.00,
    income: 11100.00,
    incomePercent: 30.00,
    quota: 48100.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 14,
  },
  {
    id: 'pkg-16',
    price: 45000.00,
    income: 13500.00,
    incomePercent: 30.00,
    quota: 58500.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 15,
  },
  {
    id: 'pkg-17',
    price: 55000.00,
    income: 16500.00,
    incomePercent: 30.00,
    quota: 71500.00,
    level: 'HIGH',
    riskLevel: 'HIGH RISK',
    durationDays: 3,
    isActive: true,
    sortOrder: 16,
  },
];

export const defaultSettings: RewardSettings = {
  usdtRate: 102.00,
  usdtBuyRate: 102.00,
  usdtSellRate: 129.00,
  normalUsdtPrice: 102.00,
  inrRewardPercent: 22.00,
  lowBonusPercent: 22.00,
  middleBonusPercent: 25.00,
  highBonusPercent: 30.00,
  minDeposit: 350.00,
  minWithdrawal: 200.00,
  withdrawalFeePercent: 0.00,
  referralL1Percent: 20.00,
  referralL2Percent: 5.00,
  isDemoMode: false,
  adminUpiId: 'narwariya321@axl',
  adminUpiName: 'Khushi Naravriya',
  adminBankName: '',
  adminBankAccount: '',
  adminBankIfsc: '',
  adminBankHolder: 'Krishna Dawar',
  adminUsdtTrc20: 'TTsZk5wTANw2MrBxn6xTNdHpeFFtBG4rLW',
  adminUsdtBep20: '0x71C836eB399C8c0F82f0E0f4Ec7aAc89F17Ac9E5',
  telegramChannelUrl: 'https://t.me/easybasepoint',
  adminSecretKey: '',
  telegramBotToken: '',
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
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
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
      if (!parsed || parsed.length === 0 || parsed[0].price !== 350 || !parsed.some(p => p.price === 29000 && p.incomePercent === 25)) {
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
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    
    // Auto-prune records older than 7 days & strip heavy screenshots for old closed records
    const cleaned = (deposits || [])
      .filter((d) => {
        if (!d) return false;
        const t = d.createdAt ? new Date(d.createdAt).getTime() : now;
        return now - t <= SEVEN_DAYS_MS;
      })
      .map((d) => {
        const t = d.createdAt ? new Date(d.createdAt).getTime() : now;
        const isClosed = d.status === 'completed' || d.status === 'rejected' || d.credited === true;
        if (isClosed && now - t > 24 * 60 * 60 * 1000) {
          return {
            ...d,
            paymentScreenshot: d.paymentScreenshot && d.paymentScreenshot.length > 200 ? 'ARCHIVED' : d.paymentScreenshot,
            proofUrl: d.proofUrl && d.proofUrl.length > 200 ? (d.utrNumber || 'ARCHIVED') : d.proofUrl,
          };
        }
        return d;
      });

    const sorted = [...cleaned].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    try {
      localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(sorted));
    } catch (e) {
      console.warn('[STORAGE] LocalStorage quota exceeded for deposits, archiving completed screenshots:', e);
      try {
        const light = sorted.map((d) => ({
          ...d,
          paymentScreenshot: (d.status === 'pending' || d.status === 'pending_verification') ? d.paymentScreenshot : '',
        }));
        localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(light));
      } catch {}
    }
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
    const map = new Map<string, WithdrawalRequest>();
    if (raw) {
      try {
        const parsed: WithdrawalRequest[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((w) => {
            if (w && w.id) map.set(w.id, w);
          });
        }
      } catch {}
    }

    // Auto-recover any withdrawal transactions from local transaction history
    try {
      const txs = this.getTransactions();
      txs.forEach((t) => {
        if (t && t.type === 'withdrawal') {
          const wId = t.referenceId || (t.id.startsWith('WDR-') ? t.id : `WDR-${t.id.replace('TXN-', '')}`);
          if (!map.has(wId)) {
            const method = (t.note?.toLowerCase().includes('usdt') ? 'usdt' : t.note?.toLowerCase().includes('upi') ? 'upi' : 'bank') as any;
            map.set(wId, {
              id: wId,
              userId: t.userId || 'player',
              userName: t.metadata?.userName || 'Player',
              userPhone: t.metadata?.phone || '',
              amount: t.amount || 0,
              fee: 0,
              netAmount: t.amount || 0,
              method,
              accountDetails: t.metadata?.accountDetails || {},
              status: (t.status === 'completed' ? 'completed' : t.status === 'rejected' ? 'rejected' : 'pending') as any,
              createdAt: t.timestamp || new Date().toISOString(),
            });
          }
        }
      });
    } catch {}

    const result = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return result;
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
      if (
        parsed.inrRewardPercent !== 22.00 ||
        parsed.lowBonusPercent !== 22.00
      ) {
        parsed.inrRewardPercent = 22.00;
        parsed.lowBonusPercent = 22.00;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (!parsed.adminUpiId || parsed.adminUpiId !== 'narwariya321@axl') {
        parsed.adminUpiId = 'narwariya321@axl';
        parsed.adminUpiName = 'Khushi Naravriya';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (!parsed.minDeposit || parsed.minDeposit < 350 || parsed.minDeposit === 390 || parsed.minDeposit === 200) {
        parsed.minDeposit = 350.00;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (!parsed.usdtBuyRate || parsed.usdtBuyRate !== 102 || !parsed.usdtSellRate || parsed.usdtSellRate !== 129) {
        parsed.usdtBuyRate = 102.00;
        parsed.usdtSellRate = 129.00;
        parsed.usdtRate = 102.00;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (parsed.adminBankIfsc === 'BKID0007855' || parsed.adminBankAccount === '7855') {
        parsed.adminBankName = '';
        parsed.adminBankAccount = '';
        parsed.adminBankIfsc = '';
        parsed.adminBankHolder = 'Krishna Dawar';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (!parsed.minWithdrawal || parsed.minWithdrawal < 200 || parsed.minWithdrawal === 450) {
        parsed.minWithdrawal = 200.00;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      if (!parsed.adminUsdtTrc20 || parsed.adminUsdtTrc20 === 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxnSE') {
        parsed.adminUsdtTrc20 = 'TTsZk5wTANw2MrBxn6xTNdHpeFFtBG4rLW';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      // Security purge: remove any legacy exposed secret key or bot token stored in client localStorage
      if (parsed.adminSecretKey || parsed.telegramBotToken) {
        parsed.adminSecretKey = '';
        parsed.telegramBotToken = '';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      // Ensure telegramChannelUrl is updated to https://t.me/easybasepoint
      if (!parsed.telegramChannelUrl || parsed.telegramChannelUrl !== 'https://t.me/easybasepoint') {
        parsed.telegramChannelUrl = 'https://t.me/easybasepoint';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      return { ...defaultSettings, ...parsed, telegramChannelUrl: 'https://t.me/easybasepoint', adminSecretKey: '', telegramBotToken: '' };
    } catch {
      return defaultSettings;
    }
  },
  setSettings(settings: RewardSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getBankCards(): SavedBankCard[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BANK_CARDS);
    if (!raw) return defaultBankCards;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultBankCards;
    }
  },
  setBankCards(cards: SavedBankCard[]): void {
    localStorage.setItem(STORAGE_KEYS.BANK_CARDS, JSON.stringify(cards));
  },

  getUpis(): SavedUpi[] {
    const raw = localStorage.getItem(STORAGE_KEYS.UPIS);
    if (!raw) return defaultUpis;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultUpis;
    }
  },
  setUpis(upis: SavedUpi[]): void {
    localStorage.setItem(STORAGE_KEYS.UPIS, JSON.stringify(upis));
  },

  getUsdts(): SavedUsdtAddress[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USDTS);
    if (!raw) return defaultUsdts;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultUsdts;
    }
  },
  setUsdts(usdts: SavedUsdtAddress[]): void {
    localStorage.setItem(STORAGE_KEYS.USDTS, JSON.stringify(usdts));
  },

  getTickets(): SupportTicket[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
  setTickets(tickets: SupportTicket[]): void {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  },

  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
  setAuditLogs(logs: AuditLog[]): void {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  getAccounts(): RegisteredAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
  setAccounts(accounts: RegisteredAccount[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },
  saveAccount(account: RegisteredAccount): void {
    if (!account || !account.user) return;
    const accounts = this.getAccounts();
    const cleanPhone = (account.user.phone || '').replace(/[^0-9]/g, '');
    const cleanEmail = (account.user.email || '').toLowerCase().trim();

    const index = accounts.findIndex((a) => {
      if (!a || !a.user) return false;
      const aPhone = (a.user.phone || '').replace(/[^0-9]/g, '');
      const aEmail = (a.user.email || '').toLowerCase().trim();
      return (
        (cleanPhone.length >= 10 && aPhone.endsWith(cleanPhone.slice(-10))) ||
        (cleanEmail && aEmail === cleanEmail) ||
        (account.user.id && a.user.id === account.user.id)
      );
    });

    if (index >= 0) {
      accounts[index] = account;
    } else {
      accounts.push(account);
    }
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },
  findAccountByReferralCode(code: string): RegisteredAccount | undefined {
    if (!code) return undefined;
    const clean = code.trim().toLowerCase();
    const accounts = this.getAccounts();
    return accounts.find((a) => a?.user?.referralCode && a.user.referralCode.trim().toLowerCase() === clean);
  },
  findAccount(emailOrPhoneOrId: string): RegisteredAccount | undefined {
    if (!emailOrPhoneOrId) return undefined;
    const accounts = this.getAccounts();
    const clean = emailOrPhoneOrId.trim().toLowerCase();
    const cleanDigits = emailOrPhoneOrId.replace(/[^0-9]/g, '');

    // 1. Check direct ID or Referral Code match in accounts
    const byIdOrRef = accounts.find((a) => {
      if (!a?.user) return false;
      const idMatch = a.user.id && a.user.id.trim().toLowerCase() === clean;
      const refMatch = a.user.referralCode && a.user.referralCode.trim().toLowerCase() === clean;
      return idMatch || refMatch;
    });
    if (byIdOrRef) return byIdOrRef;

    // 2. Check phone, email, or full name match in accounts
    const byPhoneOrEmailOrName = accounts.find((a) => {
      if (!a || !a.user) return false;
      const aPhone = (a.user.phone || '').replace(/[^0-9]/g, '');
      const aEmail = (a.user.email || '').toLowerCase().trim();
      const aName = (a.user.name || '').toLowerCase().trim();
      
      // Check phone match (match last 10 digits or exact)
      if (cleanDigits.length >= 8 && aPhone.length >= 8) {
        if (aPhone.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(aPhone.slice(-10)) || aPhone === cleanDigits) {
          return true;
        }
      }
      // Check email match (exact or prefix)
      if (aEmail && (aEmail === clean || aEmail.split('@')[0] === clean || (clean.includes('@') && clean === aEmail))) {
        return true;
      }
      // Check user name match
      if (clean.length >= 3 && aName && (aName === clean || aName.includes(clean) || clean.includes(aName))) {
        return true;
      }
      return false;
    });
    if (byPhoneOrEmailOrName) return byPhoneOrEmailOrName;

    // 3. Fallback: Check currently active user in localStorage (heals any local storage desync)
    const currentUser = this.getUser();
    if (currentUser) {
      const uPhone = (currentUser.phone || '').replace(/[^0-9]/g, '');
      const uEmail = (currentUser.email || '').toLowerCase().trim();
      const uName = (currentUser.name || '').toLowerCase().trim();
      const uId = (currentUser.id || '').toLowerCase().trim();
      const uRef = (currentUser.referralCode || '').toLowerCase().trim();

      const matches =
        (cleanDigits.length >= 8 && uPhone.length >= 8 && (uPhone.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(uPhone.slice(-10)))) ||
        (uEmail && (uEmail === clean || uEmail.split('@')[0] === clean)) ||
        (clean.length >= 3 && uName && (uName === clean || uName.includes(clean))) ||
        (uId && uId === clean) ||
        (uRef && uRef === clean);

      if (matches) {
        const reconstructed: RegisteredAccount = {
          user: currentUser,
          wallet: this.getWallet(),
          transactions: this.getUserTransactions(currentUser.id, currentUser.phone),
          allowInitialPasswordSet: true,
        };
        this.saveAccount(reconstructed);
        return reconstructed;
      }
    }

    return undefined;
  },

  resetAll(): void {
    localStorage.clear();
  }
};
