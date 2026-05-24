// Build zamanı: depoyu tara, PDF'leri metne çevir, hepsini data.json olarak yaz.
// Vercel her deploy'da bunu çalıştırır; sayfa açıldığında /data.json tek istekte hazır gelir.

import fs from "node:fs/promises";
import path from "node:path";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const TEXT_EXT = new Set([
  "txt","md","markdown","json","csv","html","htm","xml","yml","yaml",
  "js","ts","py","java","c","cpp","h","cs","go","rs","rb","php","sh","sql","ini","toml","log"
]);

const SKIP_DIRS = new Set(["node_modules", ".git", "scripts", "api", ".vercel", ".next"]);
const SKIP_FILES = new Set(["index.html", "data.json", "package.json", "package-lock.json", "vercel.json", "README.md"]);

async function walk(dir, base = dir) {
  const out = [];
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      out.push(...await walk(path.join(dir, ent.name), base));
    } else {
      out.push(path.relative(base, path.join(dir, ent.name)));
    }
  }
  return out;
}

const files = await walk(".");
const data = { generatedAt: new Date().toISOString(), files: [] };
let totalChars = 0;

for (const rel of files) {
  if (SKIP_FILES.has(rel)) continue;
  const ext = (rel.split(".").pop() || "").toLowerCase();
  let text = "";

  try {
    if (ext === "pdf") {
      const buf = await fs.readFile(rel);
      if (buf.length > 25 * 1024 * 1024) {
        console.warn("Atlandı (>25MB):", rel);
        continue;
      }
      const r = await pdfParse(buf);
      text = r.text || "";
    } else if (TEXT_EXT.has(ext)) {
      text = await fs.readFile(rel, "utf-8");
    } else {
      continue;
    }
  } catch (e) {
    console.warn("Hata:", rel, e.message);
    continue;
  }

  data.files.push({ path: rel, ext, text });
  totalChars += text.length;
  console.log(`✓ ${rel}  (${text.length.toLocaleString()} chars)`);
}

await fs.writeFile("data.json", JSON.stringify(data));
console.log(`\nYazıldı: data.json — ${data.files.length} dosya, ${totalChars.toLocaleString()} toplam karakter`);
