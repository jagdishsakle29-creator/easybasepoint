/**
 * EasyBasePoint Real-time Sync Service
 * 
 * Connected directly to the backend bot & sync server via /api/bot (port 5174).
 * Connects Player Game Wallets, Telegram Bot, and Admin Panel across all devices and tabs in 0.01 seconds!
 */

export interface CloudDepositPayload {
  id: string;
  userId: string;
  userPhone: string;
  amount: number;
  totalInr: number;
  utrNumber: string;
  method: string;
  createdAt: string;
  status?: string;
  credited?: boolean;
}

export interface ServerWallet {
  key: string;
  userId: string;
  phone: string;
  balance: number;
  quota: number;
  todayReceive: number;
  totalDeposited: number;
  creditedDepositIds: string[];
  updatedAt: string;
}

export interface CloudApprovalEvent {
  type?: string;
  depId: string;
  depositId?: string;
  action?: 'approved' | 'rejected';
  userId?: string;
  userPhone?: string;
  amount?: number;
  currency?: string;
  totalInr?: number;
  status?: string;
  credited?: boolean;
  creditedAt?: string;
  approvedAt?: string;
  timestamp: string;
  wallet?: ServerWallet;
}

const getBotBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api/bot`;
  }
  return 'http://127.0.0.1:5174/api/bot';
};

export const cloudSync = {
  // Broadcast a new deposit submission to Backend & Admin Panel in real time
  async broadcastDeposit(deposit: CloudDepositPayload): Promise<boolean> {
    try {
      const res = await fetch(`${getBotBaseUrl()}/deposits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deposit),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Broadcast an approval or rejection
  async broadcastApproval(
    depIdOrMeta: string | Partial<CloudApprovalEvent>,
    actionOpt?: 'approved' | 'rejected',
    totalInrOpt?: number
  ): Promise<boolean> {
    try {
      const depId = typeof depIdOrMeta === 'object' 
        ? (depIdOrMeta.depId || depIdOrMeta.depositId || '')
        : depIdOrMeta;
      const action = typeof depIdOrMeta === 'object'
        ? (depIdOrMeta.action || 'approved')
        : (actionOpt || 'approved');
      const totalInr = typeof depIdOrMeta === 'object'
        ? depIdOrMeta.totalInr
        : totalInrOpt;

      const endpoint = action === 'approved' ? '/approve' : '/reject';
      const res = await fetch(`${getBotBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depId, totalInr }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Fetch all deposits from the backend database
  async fetchAllDeposits(): Promise<any[]> {
    try {
      const res = await fetch(`${getBotBaseUrl()}/deposits`, {
        cache: 'no-store',
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  // Get recent approvals
  async getRecentApprovals(): Promise<CloudApprovalEvent[]> {
    try {
      const deposits = await this.fetchAllDeposits();
      const events: CloudApprovalEvent[] = [];

      for (const dep of deposits) {
        if (dep.credited === true || dep.status === 'completed' || dep.status === 'credited') {
          events.push({
            type: 'DEPOSIT_APPROVED',
            depId: dep.id,
            depositId: dep.id,
            action: 'approved',
            userId: dep.userId,
            userPhone: dep.userPhone,
            amount: dep.amount,
            currency: dep.method,
            totalInr: dep.totalInr,
            status: 'completed',
            credited: true,
            creditedAt: dep.creditedAt || dep.createdAt,
            approvedAt: dep.approvedAt || dep.createdAt,
            timestamp: dep.creditedAt || dep.createdAt || new Date().toISOString(),
          });
        } else if (dep.status === 'rejected') {
          events.push({
            type: 'DEPOSIT_REJECTED',
            depId: dep.id,
            depositId: dep.id,
            action: 'rejected',
            status: 'rejected',
            timestamp: dep.updatedAt || new Date().toISOString(),
          });
        }
      }
      return events;
    } catch {
      return [];
    }
  },

  // Create Server-Side Unique Transaction & Alert
  async createTransaction(payload: {
    userId: string;
    userPhone: string;
    amount: number;
    method: 'INR' | 'USDT';
    utrNumber: string;
    network?: string;
    proofUrl?: string;
    isDemo?: boolean;
  }): Promise<{ ok: boolean; transactionId?: string; deposit?: any; wallet?: ServerWallet; error?: string }> {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5174';
      const res = await fetch(`${base}/api/wallet/create-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  // Fetch Authoritative Server Wallet
  async fetchServerWallet(userId: string, phone: string): Promise<ServerWallet | null> {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5174';
      const res = await fetch(`${base}/api/wallet?userId=${encodeURIComponent(userId)}&phone=${encodeURIComponent(phone)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.wallet || null;
    } catch {
      return null;
    }
  },

  // Sync client initial balance with server
  async syncServerWallet(userId: string, phone: string, currentBalance?: number, currentQuota?: number): Promise<ServerWallet | null> {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5174';
      const res = await fetch(`${base}/api/wallet/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userPhone: phone,
          currentClientBalance: currentBalance,
          currentClientQuota: currentQuota,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.wallet || null;
    } catch {
      return null;
    }
  },

  // Create an SSE (Server-Sent Events) stream for instant real-time approvals
  subscribeToApprovals(onEvent: (event: CloudApprovalEvent) => void): () => void {
    if (typeof EventSource === 'undefined') return () => {};

    try {
      const sse = new EventSource(`${getBotBaseUrl()}/events`);

      sse.onmessage = (e) => {
        try {
          if (!e.data || e.data.startsWith(':')) return;
          const data = JSON.parse(e.data);
          if (
            data && (
              data.type === 'DEPOSIT_APPROVED' || 
              data.type === 'WALLET_UPDATED' || 
              data.action === 'approved' || 
              data.type === 'DEPOSIT_REJECTED' || 
              data.action === 'rejected'
            )
          ) {
            onEvent(data);
          }
        } catch {}
      };

      sse.onerror = () => {
        // EventSource will automatically reconnect
      };

      return () => {
        sse.close();
      };
    } catch {
      return () => {};
    }
  },

  // Create an SSE stream for Admin Panel to receive incoming deposits from players in real-time
  subscribeToDeposits(onDeposit: (deposit: CloudDepositPayload) => void): () => void {
    if (typeof EventSource === 'undefined') return () => {};

    try {
      const sse = new EventSource(`${getBotBaseUrl()}/events`);

      sse.onmessage = (e) => {
        try {
          if (!e.data || e.data.startsWith(':')) return;
          const data = JSON.parse(e.data);
          if (data && data.type === 'NEW_DEPOSIT' && data.deposit) {
            onDeposit(data.deposit);
          }
        } catch {}
      };

      return () => {
        sse.close();
      };
    } catch {
      return () => {};
    }
  },
};
