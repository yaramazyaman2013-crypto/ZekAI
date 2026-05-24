// Vercel Serverless Function: Together AI image proxy
// Endpoint: /api/image
// Body: { prompt: "...", width?: 1024, height?: 1024 }
// Env var: TOGETHER_KEY

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

  const key = process.env.TOGETHER_KEY;
  if (!key) return res.status(500).json({ error: "TOGETHER_KEY env var ayarlanmamış" });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: "Geçersiz JSON" }); }

  const prompt = (body.prompt || "").toString().trim();
  if (!prompt) return res.status(400).json({ error: "prompt gerekli" });
  if (prompt.length > 2000) return res.status(413).json({ error: "prompt çok uzun" });

  const width  = Math.min(Math.max(parseInt(body.width)  || 1024, 256), 1440);
  const height = Math.min(Math.max(parseInt(body.height) || 1024, 256), 1440);

  const r = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + key,
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt,
      width,
      height,
      steps: 4,
      n: 1,
      response_format: "b64_json",
    }),
  });

  const text = await r.text();
  res.status(r.status)
     .setHeader("Content-Type", "application/json")
     .send(text);
}
