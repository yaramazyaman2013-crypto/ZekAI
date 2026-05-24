// Cloudflare Worker: ZekAI Gemini proxy
// Deploy adımları workers-deploy.md dosyasındadır.
// Tek görevi: tarayıcıdan gelen istekleri, sunucu tarafında saklanan
// GEMINI_KEY ile Google Gemini API'sine iletmek.

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") {
      return new Response("POST only", { status: 405, headers: cors });
    }
    if (!env.GEMINI_KEY) {
      return new Response("GEMINI_KEY secret yapılandırılmamış.", { status: 500, headers: cors });
    }

    const url = new URL(req.url);
    const model = url.searchParams.get("model") || "gemini-2.0-flash";
    if (!/^gemini-[\w.\-]+$/.test(model)) {
      return new Response("Geçersiz model", { status: 400, headers: cors });
    }

    // Basit kötüye kullanım önlemi: çok büyük gövdeleri reddet.
    const body = await req.text();
    if (body.length > 200_000) {
      return new Response("İstek gövdesi çok büyük", { status: 413, headers: cors });
    }

    const upstream =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
      `?key=${encodeURIComponent(env.GEMINI_KEY)}`;

    const r = await fetch(upstream, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    return new Response(await r.text(), {
      status: r.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
