// Gerçekçi set üretici. Çalıştır: node tools/art/real.mjs <klasör> [grup...]
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { makeKit } from "./kit2.mjs";

const groups = {};
for (const f of readdirSync(new URL(".", import.meta.url))) {
  const m = f.match(/^set(\d+)\.mjs$/);
  if (m) { const mod = await import(`./${f}`); for (const [name, set] of Object.entries(mod)) if (/^set\d+$/.test(name)) Object.assign(groups, set); }
}
import { readFileSync } from "node:fs";
import { familyEntries } from "./families.mjs";
const wordRows = readFileSync(new URL("../../data-src/wordlist.psv", import.meta.url), "utf8").split("\n").filter(Boolean).map((l) => ({ word: l.split("|")[0] }));
const fam = familyEntries(wordRows);
const FAMILY = new Set(Object.keys(fam));
for (const [w, fn] of Object.entries(fam)) if (!groups[w]) groups[w] = fn;
const out = process.argv[2] || "art";
const sheetPath = process.argv[3];
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (f.endsWith(".svg")) unlinkSync(`${out}/${f}`);
const NOGROUND = new Set(["sun", "snow", "cloud", "rain", "star", "moon", "fire", "leaf", "beach", "sea", "river", "lake", "desert", "island", "pond", "planet", "cave", "volcano", "grass", "forest"]);
let sheet = "", n = 0;
for (const [w, fn] of Object.entries(groups)) {
  const k = makeKit(w);
  const body = fn(k);
  const svg = k.render(body, { ground: NOGROUND.has(w) || FAMILY.has(w) ? 0 : 22 });
  writeFileSync(`${out}/${w}.svg`, svg);
  sheet += `<figure><div class="t">${svg}</div><figcaption>${w}</figcaption></figure>`;
  n++;
}
if (sheetPath) writeFileSync(sheetPath, `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:16px;background:#f4f5f1;font:13px system-ui;display:grid;grid-template-columns:repeat(14,1fr);gap:10px}figure{margin:0;text-align:center}.t{background:#e3ece8;border-radius:16px;padding:8px}svg{width:100%;height:auto;display:block}</style>${sheet}`);
writeFileSync(new URL("../../data/art.js", import.meta.url), `// Otomatik üretildi: node tools/art/real.mjs (çizimi olan kelimeler)\nself.KB_ART = ${JSON.stringify(Object.keys(groups).filter((n) => !n.startsWith("x-")).sort())};\n`);
console.log(n, "çizim →", out);
