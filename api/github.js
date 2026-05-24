// Vercel Serverless Function: GitHub proxy
// Endpoints:
//   GET /api/github?op=list           -> depo dosya ağacını döner
//   GET /api/github?op=file&path=...  -> belirtilen dosyanın ham içeriği
// Env vars (Vercel → Settings → Environment Variables):
//   GITHUB_PAT     (zorunlu) — fine-grained PAT, Contents: Read-only
//   GITHUB_OWNER   (varsayılan: yaramazyaman2013-crypto)
//   GITHUB_REPO    (varsayılan: ZekAI)
//   GITHUB_BRANCH  (varsayılan: main)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const pat    = process.env.GITHUB_PAT;
  const owner  = process.env.GITHUB_OWNER  || "yaramazyaman2013-crypto";
  const repo   = process.env.GITHUB_REPO   || "ZekAI";
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!pat) return res.status(500).json({ error: "GITHUB_PAT env var ayarlanmamış" });

  const ghHeaders = {
    "Authorization": "Bearer " + pat,
    "User-Agent": "zekai-proxy",
  };

  const op = (req.query.op || "").toString();

  if (op === "list") {
    const r = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers: { ...ghHeaders, Accept: "application/vnd.github+json" } }
    );
    const text = await r.text();
    return res.status(r.status)
      .setHeader("Content-Type", "application/json")
      .send(text);
  }

  if (op === "file") {
    const path = (req.query.path || "").toString();
    if (!path) return res.status(400).json({ error: "path gerekli" });
    if (path.includes("..") || path.startsWith("/"))
      return res.status(400).json({ error: "Geçersiz path" });

    const encoded = path.split("/").map(encodeURIComponent).join("/");
    const r = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`,
      { headers: { ...ghHeaders, Accept: "application/vnd.github.raw" } }
    );
    const buf = Buffer.from(await r.arrayBuffer());
    const ct = r.headers.get("Content-Type") || "application/octet-stream";
    return res.status(r.status)
      .setHeader("Content-Type", ct)
      .send(buf);
  }

  return res.status(400).json({ error: "op 'list' veya 'file' olmalı" });
}
