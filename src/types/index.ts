export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  referredBy?: string;
  telegram?: string;
  isGoogleAuthEnabled: boolean;
  role: Role;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface Wallet {
  userId: string;
  balance: number; // e.g. 508.20
  quota: number; // e.g. 508.00
  referralBalance: number;
  todayReceive: number;
  teamCommission: number;
  todayTeamRecharge: number;
  todayTeamMembers: number;
  totalTeamRecharge: number;
  totalTeamMembers: number;
  creditedDepositIds?: string[];
}

export type QuotaLevel = 'LOW' | 'MIDDLE' | 'HIGH';
export type RiskLevel = 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK';

export interface QuotaPackage {
  id: string;
  price: number;
  income: number;
  incomePercent: number;
  quota: number;
  level: QuotaLevel;
  riskLevel: RiskLevel;
  durationDays?: number;
  isActive: boolean;
  sortOrder: number;
}

export type TransactionType = 'deposit' | 'withdrawal' | 'reward' | 'commission' | 'quota_purchase';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'failed' | 'approved' | 'credited';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: 'INR' | 'USDT';
  status: TransactionStatus;
  timestamp: string;
  note: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export type DepositStatus = 'pending' | 'approved' | 'credited' | 'completed' | 'rejected' | 'failed';

export interface DepositOrder {
  id: string;
  userId: string;
  userPhone?: string;
  utrNumber?: string;
  amount: number;
  method: 'INR' | 'USDT';
  calculatedInr: number;
  bonusInr: number;
  activityRewardInr: number;
  totalInr: number;
  network?: string;
  walletAddress?: string;
  status: DepositStatus;
  credited?: boolean;
  creditedAt?: string;
  approvedAt?: string;
  createdAt: string;
  proofUrl?: string;
  txHash?: string;
}

export type WithdrawalMethod = 'bank' | 'upi' | 'usdt';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: WithdrawalMethod;
  fee: number;
  netAmount: number;
  accountDetails: {
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
    usdtAddress?: string;
    network?: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface SavedBankCard {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  isDefault: boolean;
}

export interface SavedUpi {
  id: string;
  upiId: string;
  accountHolder: string;
  isDefault: boolean;
}

export interface SavedUsdtAddress {
  id: string;
  address: string;
  network: 'TRC20' | 'BEP20';
  label?: string;
  isDefault: boolean;
}

export interface TeamMember {
  id: string;
  username: string;
  joinDate: string;
  status: 'active' | 'pending';
  eligibleReward: number;
  teamContribution: number;
  level: 1 | 2;
}

export interface RewardSettings {
  usdtRate: number; // e.g. 110.00
  normalUsdtPrice: number; // e.g. 105.00
  inrRewardPercent: number; // e.g. 9.00
  lowBonusPercent: number; // e.g. 5
  middleBonusPercent: number; // e.g. 7
  highBonusPercent: number; // e.g. 9
  minWithdrawal: number; // e.g. 200
  withdrawalFeePercent: number; // e.g. 5
  referralL1Percent: number; // e.g. 10
  referralL2Percent: number; // e.g. 5
  isDemoMode: boolean;
  // Platform Gateway Receiving Details (Configured by Admin)
  adminUpiId: string;
  adminUpiName: string;
  adminBankName: string;
  adminBankAccount: string;
  adminBankIfsc: string;
  adminBankHolder: string;
  adminUsdtTrc20: string;
  adminUsdtBep20: string;
  telegramChannelUrl: string;
  adminSecretKey: string;
  telegramBotToken?: string;
  adminTelegramChatId?: string;
  emailApiKey?: string;
  emailProvider?: 'BREVO' | 'RESEND';
  fromEmail?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  reply?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  details: string;
  targetUser?: string;
  timestamp: string;
}
