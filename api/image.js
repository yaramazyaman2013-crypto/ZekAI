// Vercel Serverless Function: image generation proxy.
// Önce Together AI denenir (TOGETHER_KEY varsa); hata/402 durumunda
// otomatik olarak Pollinations.ai'ye düşer (anahtarsız, ücretsiz).
// Endpoint: /api/image  Body: { prompt, width?, height? }

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    return res.status(204)
      .setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
      .setHeader("Access-Control-Allow-Headers", "Content-Type")
      .end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: "Geçersiz JSON" }); }

  const prompt = (body.prompt || "").toString().trim();
  if (!prompt) return res.status(400).json({ error: "prompt gerekli" });
  if (prompt.length > 2000) return res.status(413).json({ error: "prompt çok uzun" });

  const width  = Math.min(Math.max(parseInt(body.width)  || 1024, 256), 1440);
  const height = Math.min(Math.max(parseInt(body.height) || 1024, 256), 1440);

  // 1) Together AI varsa onu dene.
  if (process.env.TOGETHER_KEY) {
    try {
      const r = await fetch("https://api.together.xyz/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + process.env.TOGETHER_KEY,
        },
        body: JSON.stringify({
          model: "black-forest-labs/FLUX.1-schnell-Free",
          prompt, width, height, steps: 4, n: 1,
          response_format: "b64_json",
        }),
      });
      if (r.ok) {
        const text = await r.text();
        return res.status(200).setHeader("Content-Type","application/json").send(text);
      }
      console.warn("Together AI hata, Pollinations'a düşülüyor:", r.status, await r.text());
    } catch (e) {
      console.warn("Together AI exception, Pollinations'a düşülüyor:", e.message);
    }
  }

  // 2) Pollinations.ai — anahtarsız, ücretsiz fallback.
  try {
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
                `?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&private=true`;
    const r = await fetch(url);
    if (!r.ok) {
      return res.status(r.status).json({ error: "Pollinations hata: " + r.status });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const b64 = buf.toString("base64");
    return res.status(200)
      .setHeader("Content-Type","application/json")
      .json({ data: [{ b64_json: b64 }] });
  } catch (e) {
    return res.status(502).json({ error: "Resim üretilemedi: " + e.message });
  }
}
