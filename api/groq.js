// Vercel Serverless Function: Groq proxy
// Endpoint: /api/groq?model=llama-3.3-70b-versatile
// Env var (Vercel → Settings → Environment Variables): GROQ_KEY

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    return res.status(204)
      .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type")
      .end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const key = process.env.GROQ_KEY;
  if (!key) return res.status(500).json({ error: "GROQ_KEY env var ayarlanmamış" });

  const model = (req.query.model || "llama-3.3-70b-versatile").toString();
  if (!/^[\w.\-]+$/.test(model)) {
    return res.status(400).json({ error: "Geçersiz model" });
  }

  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  if (body.length > 200_000) {
    return res.status(413).json({ error: "İstek gövdesi çok büyük" });
  }

  let parsed;
  try { parsed = JSON.parse(body); }
  catch { return res.status(400).json({ error: "Geçersiz JSON" }); }
  parsed.model = model;

  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + key,
    },
    body: JSON.stringify(parsed),
  });

  const text = await r.text();
  res.status(r.status)
     .setHeader("Content-Type", "application/json")
     .send(text);
}
