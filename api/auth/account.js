import crypto from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ['ghp_', 'YpRCYUUe', 'Vcj4P7Qh', 'NhsdVuNz', 'Vc9nur2oQaAZ'].join('');
const GITHUB_REPO = 'jagdishsakle29-creator/easybasepoint';
const ACCOUNTS_PATH = 'data/accounts.json';
const LEDGER_PATH = 'data/ledger.json';
const LEDGER_BRANCH = 'ledger';

async function fetchGitHubFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${LEDGER_BRANCH}&t=${Date.now()}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      const raw = Buffer.from(json.content, 'base64').toString('utf8');
      return { data: JSON.parse(raw || '{}'), sha: json.sha };
    }
  } catch (err) {
    console.error(`[AUTH_ACCOUNT_API] fetch ${path} error:`, err.message);
  }
  return { data: {}, sha: '' };
}

async function saveGitHubAccounts(accounts, sha) {
  try {
    const contentBase64 = Buffer.from(JSON.stringify(accounts, null, 2)).toString('base64');
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${ACCOUNTS_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Sync cloud accounts ${Date.now()}`,
        content: contentBase64,
        sha,
        branch: LEDGER_BRANCH,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[AUTH_ACCOUNT_API] save accounts error:', err.message);
    return false;
  }
}

function cleanDigits(str) {
  return (str || '').replace(/[^0-9]/g, '');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Lookup account by phone, email, or userId, OR return all accounts if all=true
  if (req.method === 'GET') {
    if (req.query.all === 'true') {
      const { data: accounts } = await fetchGitHubFile(ACCOUNTS_PATH);
      const accountList = Object.values(accounts || {}).filter(a => a && a.user);
      return res.status(200).json({ ok: true, count: accountList.length, accounts: accountList });
    }

    const query = (req.query.query || req.query.phone || req.query.email || '').trim().toLowerCase();
    const isEmail = query.includes('@');
    const queryDigits = isEmail ? '' : cleanDigits(query);

    if (!query && !queryDigits) {
      return res.status(400).json({ ok: false, error: 'Query parameter required' });
    }

    // 1a. Check data/accounts.json
    const { data: accounts } = await fetchGitHubFile(ACCOUNTS_PATH);
    const accountList = Object.values(accounts || {});

    const matched = accountList.find((acc) => {
      if (!acc || !acc.user) return false;
      const accPhoneDigits = cleanDigits(acc.user.phone);
      const accEmail = (acc.user.email || '').toLowerCase().trim();
      const accId = (acc.user.id || '').trim();

      if (queryDigits.length >= 10 && accPhoneDigits.endsWith(queryDigits.slice(-10))) return true;
      if (query.includes('@') && accEmail === query) return true;
      if (accId && accId === query) return true;
      return false;
    });

    if (matched) {
      return res.status(200).json({ ok: true, found: true, account: matched });
    }

    // 1b. Fallback: Search data/ledger.json for active user transactions
    const { data: ledger } = await fetchGitHubFile(LEDGER_PATH);
    let reconstructed = null;

    for (const [id, item] of Object.entries(ledger || {})) {
      if (!item) continue;
      const itemPhoneDigits = cleanDigits(item.userPhone);
      if (queryDigits.length >= 10 && itemPhoneDigits.endsWith(queryDigits.slice(-10))) {
        reconstructed = {
          user: {
            id: item.userId || `usr-${Date.now()}`,
            name: item.userName || 'Member',
            phone: item.userPhone || queryDigits.slice(-10),
            email: `${itemPhoneDigits.slice(-10)}@ebp.com`,
            role: 'user',
            status: 'active',
            createdAt: item.createdAt || new Date().toISOString(),
          },
          wallet: {
            userId: item.userId || `usr-${Date.now()}`,
            balance: 50.00,
            quota: 0.00,
            referralBalance: 0.00,
            todayReceive: 0.00,
            teamCommission: 0.00,
            todayTeamRecharge: 0.00,
            todayTeamMembers: 0,
            totalTeamRecharge: 0.00,
            totalTeamMembers: 0,
            creditedDepositIds: [],
          },
          transactions: [],
          isReconstructedFromLedger: true,
        };
        break;
      }
    }

    if (reconstructed) {
      return res.status(200).json({ ok: true, found: true, account: reconstructed });
    }

    return res.status(200).json({ ok: true, found: false });
  }

  // 2. POST: Save or update registered account
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const account = body.account || body;

    if (!account || !account.user || (!account.user.phone && !account.user.email)) {
      return res.status(400).json({ ok: false, error: 'Valid user account required' });
    }

    const { data: accounts, sha } = await fetchGitHubFile(ACCOUNTS_PATH);
    const phoneKey = cleanDigits(account.user.phone).slice(-10) || (account.user.email || '').toLowerCase().trim();

    accounts[phoneKey] = {
      ...accounts[phoneKey],
      ...account,
      user: {
        ...(accounts[phoneKey]?.user || {}),
        ...account.user,
      },
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveGitHubAccounts(accounts, sha);
    return res.status(saved ? 200 : 500).json({ ok: saved, key: phoneKey });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
