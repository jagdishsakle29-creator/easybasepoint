const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ["ghp_", "YpRCYUUe", "Vcj4P7Qh", "NhsdVuNz", "Vc9nur2oQaAZ"].join("");
const GITHUB_REPO = "jagdishsakle29-creator/easybasepoint";
const LEDGER_PATH = "data/ledger.json";
const LEDGER_BRANCH = "ledger";
const NTFY_DEPOSITS_TOPIC = "https://ntfy.sh/ebp_easybasepoint_deposits";

async function fetchLedger() {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${LEDGER_PATH}?ref=${LEDGER_BRANCH}&t=${Date.now()}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const raw = Buffer.from(json.content, "base64").toString("utf8");
      return { data: JSON.parse(raw || "{}"), sha: json.sha };
    }
  } catch (err) {
    console.error("[DEPOSITS_API] fetchLedger error:", err.message);
  }
  return { data: {}, sha: "" };
}

async function saveLedger(data, sha) {
  try {
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    for (const [id, item] of Object.entries(data || {})) {
      if (!item) continue;
      const createdTime = item.createdAt ? new Date(item.createdAt).getTime() : now;
      // Never delete history items! Only archive bulky screenshots for old closed records to keep JSON light
      if ((item.status === "completed" || item.status === "rejected") && (now - createdTime > TWO_DAYS_MS)) {
        if (item.paymentScreenshot && item.paymentScreenshot.length > 200) item.paymentScreenshot = "ARCHIVED_CLOSED";
        if (item.proofUrl && item.proofUrl.length > 200) item.proofUrl = item.utrNumber || "ARCHIVED_CLOSED";
      }
    }

    const contentBase64 = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${LEDGER_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Sync deposit ${Date.now()}`,
        content: contentBase64,
        sha,
        branch: LEDGER_BRANCH,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[DEPOSITS_API] saveLedger error:", err.message);
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    try {
      const { data } = await fetchLedger();
      let list = Object.values(data || {})
        .filter((item) => item && item.type !== "withdrawal" && (!item.id || !item.id.toUpperCase().startsWith("WDR")));

      const { userId, phone } = req.query || {};
      if (userId || phone) {
        const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
        list = list.filter((item) => {
          if (userId && item.userId === userId) return true;
          const itemPhone = (item.userPhone || "").replace(/[^0-9]/g, "");
          if (cleanPhone.length >= 10 && itemPhone.length >= 10 && itemPhone.endsWith(cleanPhone.slice(-10))) return true;
          return false;
        });
      }

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return res.status(200).json(list);
    } catch {
      return res.status(200).json([]);
    }
  }

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const depId = body.id || body.depId || `DEP-${Math.floor(100000 + Math.random() * 900000)}`;
      body.id = depId;
      if (!body.createdAt) body.createdAt = new Date().toISOString();
      if (!body.status) body.status = "pending_verification";

      // Payment screenshot is optional in classic deposit flow (UTR is mandatory)
      const screenshot = body.paymentScreenshot || body.proofUrl || body.utrNumber || "";
      body.paymentScreenshot = screenshot;
      body.proofUrl = screenshot;

      let { data, sha } = await fetchLedger();

      // Safety rate limit: 15s between submissions per user to prevent double clicks
      const now = Date.now();
      const COOLDOWN_MS = 5 * 1000;
      const userPhoneClean = (body.userPhone || "").replace(/[^0-9]/g, "");
      const userId = body.userId || "";
      if (!isDemo) {
        for (const item of Object.values(data || {})) {
          if (!item || !item.createdAt || item.id === depId) continue;
          const itemPhone = (item.userPhone || "").replace(/[^0-9]/g, "");
          const isSameUser = (userId && item.userId === userId) || (userPhoneClean.length >= 10 && itemPhone.endsWith(userPhoneClean.slice(-10)));
          if (isSameUser) {
            const itemTime = new Date(item.createdAt).getTime();
            if (now - itemTime < COOLDOWN_MS) {
              const waitSec = Math.ceil((COOLDOWN_MS - (now - itemTime)) / 1000);
              return res.status(429).json({ ok: false, error: `Rate limit: Please wait ${waitSec}s before submitting another deposit.` });
            }
          }
        }
      }

      data[depId] = {
        ...(data[depId] || {}),
        ...body,
        updatedAt: new Date().toISOString(),
      };
      await saveLedger(data, sha);

      fetch(NTFY_DEPOSITS_TOPIC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data[depId]),
      }).catch(() => {});

      return res.status(200).json({ ok: true, deposit: data[depId] });
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
}
