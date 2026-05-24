// Vercel Serverless Function: Gemini proxy
// Endpoint: /api/gemini?model=gemini-2.0-flash
// Env var (Vercel → Settings → Environment Variables): GEMINI_KEY

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(204)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type")
      .end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_KEY env var ayarlanmamış" });

  const model = (req.query.model || "gemini-2.0-flash").toString();
  if (!/^gemini-[\w.\-]+$/.test(model)) {
    return res.status(400).json({ error: "Geçersiz model" });
  }

  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  if (body.length > 200_000) {
    return res.status(413).json({ error: "İstek gövdesi çok büyük" });
  }

  const upstream =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
    `?key=${encodeURIComponent(key)}`;

  const r = await fetch(upstream, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const text = await r.text();
  res.status(r.status)
     .setHeader("Content-Type", "application/json")
     .setHeader("Access-Control-Allow-Origin", "*")
     .send(text);
}
