# ZekAI

Vercel'de host edilen sade bir Türkçe sohbet arayüzü. Groq ile metin
yanıtlar, Together AI ile resim üretir.

## Vercel kurulumu

1. Bu depoyu Vercel'e import edin.
2. **Settings → Environment Variables** (Production + Preview + Development):

   | İsim | Nereden |
   |---|---|
   | `GROQ_KEY` | console.groq.com/keys |
   | `TOGETHER_KEY` | api.together.xyz/settings/api-keys |

3. **Deployments** → son deployment → **Redeploy**.
4. Vercel URL'sini açın.

## Kullanım

- Normal sohbet: bir şey yazıp Enter'a basın.
- Resim üretme: mesajı `/resim <açıklama>` ile başlatın
  (örn: `/resim antik bir kütüphanede ışık huzmesi`).
- İngilizce alternatifler de çalışır: `/img`, `/image`.

## Dosyalar

- `index.html` — UI ve sohbet/resim mantığı
- `api/groq.js` — Groq chat completions proxy (`GROQ_KEY`)
- `api/image.js` — Together AI FLUX.1-schnell proxy (`TOGETHER_KEY`)

Anahtarlar yalnızca Vercel'in sunucu çalışma ortamında bulunur;
tarayıcıya hiç inmez.
