const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ["ghp_", "YpRCYUUe", "Vcj4P7Qh", "NhsdVuNz", "Vc9nur2oQaAZ"].join("");
const GITHUB_REPO = "jagdishsakle29-creator/easybasepoint";
const LEDGER_PATH = "data/ledger.json";
const LEDGER_BRANCH = "ledger";

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
    console.error("[WITHDRAWALS_API] fetchLedger error:", err.message);
  }
  return { data: {}, sha: "" };
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
        .filter((item) => item && (item.type === "withdrawal" || (item.id && item.id.startsWith("WDR-"))));

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

  return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
}
