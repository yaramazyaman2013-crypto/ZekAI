# Cloudflare Worker Kurulumu (5 dakika)

Bu Worker, Gemini API anahtarınızı sunucu tarafında saklar. `index.html`
anahtarı asla görmez; sadece Worker URL'sine istek atar.

## En kolay yol — Dashboard üzerinden

1. https://dash.cloudflare.com adresine ücretsiz hesapla giriş yapın.
2. Sol menüden **Workers & Pages** → **Create application** → **Create Worker**.
3. Worker'a bir ad verin (örn. `zekai-proxy`) → **Deploy**.
4. Açılan sayfada **Edit code** butonuna basın.
5. Soldaki `worker.js` editörünün içeriğini silin, bu depodaki `worker.js`
   dosyasının içeriğini yapıştırın → sağ üstte **Save and deploy**.
6. Editörden çıkıp Worker ana sayfasına dönün:
   **Settings** → **Variables and Secrets** → **Add variable**
   - Variable name: `GEMINI_KEY`
   - Value: Gemini API anahtarınız (aistudio.google.com/apikey)
   - **Type: Secret** (önemli — şifreli saklanır, görüntülenemez)
   - **Save and deploy**.
7. Worker'ın URL'sini kopyalayın. Şuna benzer:
   `https://zekai-proxy.<your-subdomain>.workers.dev`

## index.html'i Worker'a bağlamak

Sayfayı açtığınızda üstteki **"Worker URL"** kutusuna yapıştırın
(localStorage'a kaydedilir, bir daha girmenize gerek yok).

Veya tek seferde yer imine kaydetmek için URL hash kullanın:

```
https://<sayfanız>/index.html#worker=https://zekai-proxy.xxx.workers.dev
```

Worker URL'si tanımlıyken sayfa Gemini API anahtarını **hiç** göndermez —
tüm istekler Worker üzerinden geçer ve anahtar sunucuda kalır.

## Güvenliği daha da artırmak (opsiyonel)

`worker.js`'te `Access-Control-Allow-Origin: "*"` yerine sadece sizin
domain'inizi yazın (örn. `"https://kullanici.github.io"`). Böylece başka
siteler Worker'ınızı kullanamaz.

Cloudflare ücretsiz planı günlük 100.000 istek verir; kişisel kullanım
için fazlasıyla yeter.
