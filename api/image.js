// Vercel Serverless Function: resim üretimi proxy'si.
// Akış: kullanıcı prompt'u (Türkçe olabilir) -> Groq ile detaylı İngilizce
// görsel prompt'a çevrilir -> Together AI denenir (anahtar varsa) -> hata
// olursa Pollinations.ai (ücretsiz, anahtarsız).
// Endpoint: /api/image  Body: { prompt, width?, height? }

export const config = { maxDuration: 60 };

async function refinePrompt(userPrompt) {
  if (!process.env.GROQ_KEY) return userPrompt;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_KEY,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content:
            "You convert the user's image idea (which may be in Turkish) into a vivid, " +
            "detailed English prompt for the FLUX image model. Include subject, style, " +
            "lighting, composition and color. Output ONLY the English prompt itself — " +
            "no preamble, no quotes, no explanation. Maximum 60 words." },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });
    if (!r.ok) return userPrompt;
    const data = await r.json();
    const out = data?.choices?.[0]?.message?.content?.trim();
    return out && out.length > 3 ? out : userPrompt;
  } catch {
    return userPrompt;
  }
}

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

  const rawPrompt = (body.prompt || "").toString().trim();
  if (!rawPrompt) return res.status(400).json({ error: "prompt gerekli" });
  if (rawPrompt.length > 2000) return res.status(413).json({ error: "prompt çok uzun" });

  const width  = Math.min(Math.max(parseInt(body.width)  || 1024, 256), 1440);
  const height = Math.min(Math.max(parseInt(body.height) || 1024, 256), 1440);

  // Türkçe / kısa prompt'u zengin İngilizce'ye dönüştür (mümkünse).
  const prompt = await refinePrompt(rawPrompt);

  // 1) Together AI (anahtar varsa)
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
        const data = await r.json();
        return res.status(200).json({ ...data, refined_prompt: prompt });
      }
      console.warn("Together hata:", r.status, await r.text());
    } catch (e) {
      console.warn("Together exception:", e.message);
    }
  }

  // 2) Pollinations.ai fallback
  try {
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
                `?width=${width}&height=${height}&seed=${seed}` +
                `&model=flux&nologo=true&private=true&safe=false`;
    const r = await fetch(url, {
      headers: { "Referer": "https://zekai.vercel.app" },
    });
    if (!r.ok) {
      return res.status(r.status).json({ error: "Pollinations hata: " + r.status });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    return res.status(200).json({
      data: [{ b64_json: buf.toString("base64") }],
      refined_prompt: prompt,
    });
  } catch (e) {
    return res.status(502).json({ error: "Resim üretilemedi: " + e.message });
  }
}
