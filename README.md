# ZekAI

Depodaki PDF ve metin dosyalarına soru sorabileceğiniz, Vercel'de host edilen
bir sohbet arayüzü. Dosyalar **build zamanında** işlenir; sayfa açıldığında
tek bir `data.json` indirip anında hazır olur.

## Vercel'de kurulum

1. Bu depoyu Vercel'e import edin.
2. **Settings → Environment Variables** → ekleyin:
   - `GROQ_KEY` — console.groq.com/keys adresinden alınan Groq anahtarı.
3. **Deployments** → son deployment → **Redeploy** (env var yeni deploy'da yüklenir).
4. Vercel URL'sini açın. Depo dosyaları anında hazır olur.

## Mimari

- `index.html` — tek sayfalık UI. Açılışta `/data.json`'u çeker, hazır.
- `api/groq.js` — Groq (OpenAI-uyumlu) proxy; `GROQ_KEY`'i sunucuda tutar.
- `scripts/build-data.js` — depoyu tarar, PDF'leri `pdf-parse` ile metne
  çevirir, hepsini `data.json` olarak yazar.
- `vercel.json` — Vercel'e `npm run build` komutunu çalıştırmasını söyler.
- `package.json` — `pdf-parse` bağımlılığı ve `build` script'i.

`data.json` `.gitignore`'da; depoya commit edilmez, her deploy'da Vercel
üretir.

## Yeni dosya ekleyince

Depoya yeni PDF/metin push'layın → Vercel otomatik yeniden build eder,
yeni `data.json` üretir. Sayfa bir sonraki açılışta yeni içerikle gelir.
