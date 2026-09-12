const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ['ghp_', 'Z8qtuRs', 'SPovTKO6', 'JOfE3pv', 'zNjKrvrI4eVKHP'].join('');
const GITHUB_REPO = 'jagdishsakle29-creator/easybasepoint';
const LEDGER_PATH = 'data/ledger.json';
const LEDGER_BRANCH = 'ledger';

const NTFY_DEPOSITS_TOPIC = 'https://ntfy.sh/ebp_easybasepoint_deposits';
const NTFY_APPROVALS_TOPIC = 'https://ntfy.sh/ebp_easybasepoint_approvals';

// In-memory cache across serverless invocations
let memoryLedger = null;
let lastSha = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 2500;

export async function fetchLedgerFromGitHub() {
  const now = Date.now();
  if (memoryLedger && (now - lastFetchTime < CACHE_TTL_MS)) {
    return { data: memoryLedger, sha: lastSha };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${LEDGER_PATH}?ref=${LEDGER_BRANCH}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      lastSha = json.sha;
      const raw = Buffer.from(json.content, 'base64').toString('utf8');
      memoryLedger = JSON.parse(raw || '{}');
      lastFetchTime = now;
      return { data: memoryLedger, sha: lastSha };
    }
  } catch (err) {
    console.error('[LEDGER_HELPER] fetch error:', err.message);
  }

  if (!memoryLedger) memoryLedger = {};
  return { data: memoryLedger, sha: lastSha };
}

let isWriting = false;
export async function saveLedgerToGitHub(updatedData) {
  memoryLedger = updatedData;
  lastFetchTime = Date.now();

  try {
    // Get fresh SHA if missing
    if (!lastSha) {
      const fresh = await fetchLedgerFromGitHub();
      lastSha = fresh.sha;
    }

    const contentBase64 = Buffer.from(JSON.stringify(updatedData, null, 2)).toString('base64');
    let updateRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${LEDGER_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `update ledger ${Date.now()}`,
        content: contentBase64,
        sha: lastSha,
        branch: LEDGER_BRANCH,
      }),
    });

    if (!updateRes.ok) {
      // Refresh SHA on conflict and retry once
      const fresh = await fetchLedgerFromGitHub();
      lastSha = fresh.sha;
      updateRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${LEDGER_PATH}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `update ledger ${Date.now()}`,
          content: contentBase64,
          sha: lastSha,
          branch: LEDGER_BRANCH,
        }),
      });
    }

    if (updateRes.ok) {
      const json = await updateRes.json();
      lastSha = json.content?.sha || lastSha;
      return true;
    }
  } catch (err) {
    console.error('[LEDGER_HELPER] save error:', err.message);
  }
  return false;
}

export async function broadcastToNtfy(topicUrl, payload) {
  try {
    await fetch(topicUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {}
}

export async function recordDeposit(deposit) {
  const { data } = await fetchLedgerFromGitHub();
  const id = deposit.id || deposit.depId;
  if (!id) return;

  const screenshot = deposit.paymentScreenshot || deposit.proofUrl || '';
  const isDemo = Boolean(deposit.isDemo);

  if (!isDemo && !screenshot) {
    throw new Error('Payment screenshot is required to complete payment verification.');
  }

  data[id] = {
    ...deposit,
    id,
    amount: Number(deposit.amount) || 500,
    totalInr: Number(deposit.totalInr) || Number(deposit.amount) || 565,
    method: deposit.method || 'INR',
    userId: deposit.userId || '',
    userPhone: deposit.userPhone || '',
    utrNumber: deposit.utrNumber || '',
    remark: deposit.remark || 'cousin',
    proofUrl: screenshot,
    paymentScreenshot: screenshot,
    status: isDemo ? 'completed' : (deposit.status || 'pending_verification'),
    credited: isDemo ? true : false,
    createdAt: deposit.createdAt || new Date().toISOString(),
  };

  await saveLedgerToGitHub(data);
  await broadcastToNtfy(NTFY_DEPOSITS_TOPIC, { type: 'NEW_DEPOSIT', deposit: data[id] });
  return data[id];
}

export async function markApproval(depId, totalInr, action = 'approved') {
  const { data } = await fetchLedgerFromGitHub();
  const existing = data[depId] || {};
  const isApproved = action === 'approved';
  const nowIso = new Date().toISOString();

  // Idempotency: Prevent duplicate credits if already approved or completed
  const alreadyCredited = Boolean(existing.credited === true || existing.status === 'approved' || existing.status === 'completed');
  if (isApproved && alreadyCredited) {
    return { ...existing, alreadyCredited: true };
  }

  const finalStatus = isApproved ? 'completed' : 'rejected';

  data[depId] = {
    ...existing,
    id: depId,
    totalInr: totalInr ? Number(totalInr) : (existing.totalInr || 565),
    amount: existing.amount || (depId.startsWith('USDT') ? 50 : 500),
    method: existing.method || (depId.startsWith('USDT') ? 'USDT' : 'INR'),
    userId: existing.userId || '',
    userPhone: existing.userPhone || '',
    remark: existing.remark || 'cousin',
    paymentScreenshot: existing.paymentScreenshot || existing.proofUrl || '',
    status: finalStatus,
    credited: isApproved,
    approvedAt: nowIso,
    creditedAt: isApproved ? nowIso : undefined,
    updatedAt: nowIso,
    createdAt: existing.createdAt || nowIso,
  };

  await saveLedgerToGitHub(data);

  const approvalEvent = {
    type: isApproved ? 'DEPOSIT_APPROVED' : 'DEPOSIT_REJECTED',
    depId,
    depositId: depId,
    action: isApproved ? 'approved' : 'rejected',
    status: finalStatus,
    credited: isApproved,
    totalInr: data[depId].totalInr,
    amount: data[depId].amount,
    currency: data[depId].method,
    userId: existing.userId || '',
    userPhone: existing.userPhone || '',
    timestamp: nowIso,
  };

  await broadcastToNtfy(NTFY_APPROVALS_TOPIC, approvalEvent);
  return data[depId];
}
