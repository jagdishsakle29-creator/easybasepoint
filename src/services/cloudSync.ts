/**
 * EasyBasePoint Cloud Sync Service
 * 
 * Provides real-time synchronization between Admin approvals (Web & Telegram Bot)
 * and active Player game wallets across devices and tabs.
 */

const SYNC_OBJECT_URL = 'https://api.restful-api.dev/objects/ff808181a067127101a095461303011c';

export const cloudSync = {
  async getApprovedDeposits(): Promise<string[]> {
    try {
      const res = await fetch(SYNC_OBJECT_URL, { cache: 'no-store' });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.approvedDeposits || [];
    } catch {
      return [];
    }
  },

  async markDepositApproved(depId: string): Promise<boolean> {
    if (!depId) return false;
    try {
      const current = await this.getApprovedDeposits();
      if (!current.includes(depId)) {
        current.push(depId);
        await fetch(SYNC_OBJECT_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'ebp_approvals',
            data: { approvedDeposits: current, lastUpdated: new Date().toISOString() },
          }),
        });
      }
      return true;
    } catch {
      return false;
    }
  },
};
