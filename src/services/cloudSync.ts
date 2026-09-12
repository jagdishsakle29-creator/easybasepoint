/**
 * EasyBasePoint Real-time Cloud Sync Service
 * 
 * Powered by high-speed, sub-second Pub/Sub (ntfy.sh) & SSE.
 * Connects Player Game Wallets, Telegram Bot, and Admin Panel across all devices and tabs in 0.1 seconds!
 */

const NTFY_BASE = 'https://ntfy.sh';
const TOPIC_APPROVALS = 'ebp_approvals_lord12';
const TOPIC_DEPOSITS = 'ebp_deposits_lord12';

export interface CloudDepositPayload {
  id: string;
  userId: string;
  userPhone: string;
  amount: number;
  totalInr: number;
  utrNumber: string;
  method: string;
  createdAt: string;
}

export interface CloudApprovalEvent {
  type?: string;
  depId: string;
  depositId?: string;
  action: 'approved' | 'rejected';
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
}

export const cloudSync = {
  // Broadcast a new deposit submission to all Admin panels in real time
  async broadcastDeposit(deposit: CloudDepositPayload): Promise<boolean> {
    try {
      await fetch(`${NTFY_BASE}/${TOPIC_DEPOSITS}`, {
        method: 'POST',
        headers: { 'Title': 'New Deposit Submitted' },
        body: JSON.stringify(deposit),
      });
      return true;
    } catch {
      return false;
    }
  },

  // Broadcast an approval or rejection to all Player game clients in real time
  async broadcastApproval(
    depIdOrMeta: string | Partial<CloudApprovalEvent>,
    actionOpt?: 'approved' | 'rejected',
    totalInrOpt?: number
  ): Promise<boolean> {
    try {
      let payload: CloudApprovalEvent;
      if (typeof depIdOrMeta === 'object') {
        payload = {
          type: 'DEPOSIT_APPROVED',
          depId: depIdOrMeta.depId || depIdOrMeta.depositId || '',
          depositId: depIdOrMeta.depositId || depIdOrMeta.depId || '',
          action: depIdOrMeta.action || 'approved',
          userId: depIdOrMeta.userId,
          userPhone: depIdOrMeta.userPhone,
          amount: depIdOrMeta.amount,
          currency: depIdOrMeta.currency,
          totalInr: depIdOrMeta.totalInr,
          status: depIdOrMeta.status || (depIdOrMeta.action === 'approved' ? 'credited' : 'rejected'),
          credited: depIdOrMeta.credited ?? (depIdOrMeta.action === 'approved'),
          creditedAt: depIdOrMeta.creditedAt || new Date().toISOString(),
          approvedAt: depIdOrMeta.approvedAt || new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };
      } else {
        const action = actionOpt || 'approved';
        payload = {
          type: 'DEPOSIT_APPROVED',
          depId: depIdOrMeta,
          depositId: depIdOrMeta,
          action,
          totalInr: totalInrOpt,
          status: action === 'approved' ? 'credited' : 'rejected',
          credited: action === 'approved',
          creditedAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };
      }

      await fetch(`${NTFY_BASE}/${TOPIC_APPROVALS}`, {
        method: 'POST',
        headers: { 'Title': `Deposit ${payload.action.toUpperCase()}` },
        body: JSON.stringify(payload),
      });
      return true;
    } catch {
      return false;
    }
  },

  // Poll recent approvals (fallback if SSE connection drops or Safari was backgrounded)
  // CRITICAL: Uses since=45s instead of since=all to NEVER replay old deposits!
  async getRecentApprovals(): Promise<CloudApprovalEvent[]> {
    try {
      const res = await fetch(`${NTFY_BASE}/${TOPIC_APPROVALS}/json?poll=1&since=45s`, {
        cache: 'no-store',
      });
      if (!res.ok) return [];
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);
      const events: CloudApprovalEvent[] = [];

      for (const line of lines) {
        try {
          const raw = JSON.parse(line);
          if (raw.event === 'message' && raw.message) {
            if (raw.message.startsWith('{')) {
              events.push(JSON.parse(raw.message));
            } else if (raw.message.includes(':')) {
              const [depId, action, total] = raw.message.split(':');
              events.push({
                type: 'DEPOSIT_APPROVED',
                depId,
                depositId: depId,
                action: action === 'rejected' ? 'rejected' : 'approved',
                totalInr: total ? parseFloat(total) : undefined,
                status: action === 'rejected' ? 'rejected' : 'credited',
                credited: action !== 'rejected',
                creditedAt: new Date().toISOString(),
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch {}
      }
      return events;
    } catch {
      return [];
    }
  },

  // Create an SSE (Server-Sent Events) stream for instant real-time approvals
  subscribeToApprovals(onEvent: (event: CloudApprovalEvent) => void): () => void {
    if (typeof EventSource === 'undefined') return () => {};

    try {
      const sse = new EventSource(`${NTFY_BASE}/${TOPIC_APPROVALS}/sse`);

      sse.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'message' && data.message) {
            if (data.message.startsWith('{')) {
              onEvent(JSON.parse(data.message));
            } else if (data.message.includes(':')) {
              const [depId, action, total] = data.message.split(':');
              onEvent({
                depId,
                action: action === 'rejected' ? 'rejected' : 'approved',
                totalInr: total ? parseFloat(total) : undefined,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch {}
      };

      sse.onerror = () => {
        // SSE handles auto-reconnect
      };

      return () => {
        sse.close();
      };
    } catch {
      return () => {};
    }
  },

  // Create an SSE stream for Admin Panel to receive incoming deposits from players
  subscribeToDeposits(onDeposit: (deposit: CloudDepositPayload) => void): () => void {
    if (typeof EventSource === 'undefined') return () => {};

    try {
      const sse = new EventSource(`${NTFY_BASE}/${TOPIC_DEPOSITS}/sse`);

      sse.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'message' && data.message && data.message.startsWith('{')) {
            onDeposit(JSON.parse(data.message));
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
