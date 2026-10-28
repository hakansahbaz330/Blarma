// Gerçekçi set üretici. Çalıştır: node tools/art/real.mjs <klasör> [grup...]
import { writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { makeKit } from "./kit2.mjs";

const groups = {};
for (const f of readdirSync(new URL(".", import.meta.url))) {
  const m = f.match(/^set(\d+)\.mjs$/);
  if (m) for (const set of Object.values(await import(`./${f}`))) Object.assign(groups, set);
}
const out = process.argv[2] || "art/real";
mkdirSync(out, { recursive: true });
const NOGROUND = new Set(["sun", "snow", "cloud", "rain", "star", "moon", "fire", "leaf"]);
let sheet = "", n = 0;
for (const [w, fn] of Object.entries(groups)) {
  const k = makeKit(w);
  const body = fn(k);
  const svg = k.render(body, { ground: NOGROUND.has(w) ? 0 : 22 });
  writeFileSync(`${out}/${w}.svg`, svg);
  sheet += `<figure><div class="t">${svg}</div><figcaption>${w}</figcaption></figure>`;
  n++;
}
writeFileSync(`${out}/_sheet.html`, `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:16px;background:#f4f5f1;font:13px system-ui;display:grid;grid-template-columns:repeat(10,1fr);gap:10px}figure{margin:0;text-align:center}.t{background:#e3ece8;border-radius:16px;padding:8px}svg{width:100%;height:auto;display:block}</style>${sheet}`);
console.log(n, "çizim →", out);
