# ZekAI

Depodaki PDF ve metin dosyalarına soru sorabileceğiniz, Vercel'de host edilen
bir sohbet arayüzü. Gemini API anahtarı ve GitHub PAT'i sunucu tarafında
(Vercel Environment Variables) tutulur; tarayıcıya hiç inmez.

## Vercel'de kurulum

1. Bu depoyu Vercel'e import edin (yapmışsınız zaten).
2. Vercel → Project → **Settings → Environment Variables** kısmından
   aşağıdaki değerleri ekleyin (hepsi Production + Preview + Development):

   | İsim | Değer |
   |---|---|
   | `GEMINI_KEY` | aistudio.google.com/apikey adresinden alınan Gemini anahtarı |
   | `GITHUB_PAT` | github.com → Settings → Developer settings → Personal access tokens (fine-grained) → ZekAI deposu için **Contents: Read-only** |
   | `GITHUB_OWNER` *(opsiyonel)* | varsayılan: `yaramazyaman2013-crypto` |
   | `GITHUB_REPO` *(opsiyonel)* | varsayılan: `ZekAI` |
   | `GITHUB_BRANCH` *(opsiyonel)* | varsayılan: `main` |

3. **Deployments** sekmesinden son deployment'ı **Redeploy** yapın
   (env var'lar yalnız yeni deploy'da yüklenir).
4. Vercel URL'sini açın. Sayfa otomatik olarak depodaki PDF ve metin
   dosyalarını yükler, soru sorabilirsiniz.

## Mimari

- `index.html` — tek sayfalık UI, PDF.js ile PDF metni çıkarır
- `api/gemini.js` — Gemini API proxy'si, `GEMINI_KEY` env var'ını kullanır
- `api/github.js` — GitHub Contents API proxy'si, `GITHUB_PAT`'i kullanır

Bu sayede public depo + güvenli anahtarlar mümkün: anahtarlar sadece
Vercel'in sunucu çalışma ortamında bulunur, statik koda ya da tarayıcıya
hiç dahil olmaz.

## Yeni dosya ekleyince

Depoya yeni PDF/metin push'layın → Vercel otomatik yeniden deploy eder
(commit tetiklerse) ya da `/api/github?op=list` zaten her sayfa yüklemesinde
güncel listeyi alır. Sayfada **"Depoyu Yeniden Yükle"** butonuna basmanız
yeterli.
