// Anlam alanı görselleri ve kelime→alan eşlemesi. Çalıştır: node tools/art/build_fields.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { makeKit } from "./kit2.mjs";
import { FIELDS } from "./fields.mjs";

const out = new URL("../../art/", import.meta.url).pathname;
for (const [code, f] of Object.entries(FIELDS)) {
  const k = makeKit("field-" + code);
  writeFileSync(`${out}field-${code}.svg`, k.render(f.draw(k), { ground: 20 }));
}
const map = {};
for (const line of readFileSync(new URL("../../data-src/fields.psv", import.meta.url), "utf8").split("\n").filter(Boolean)) {
  const i = line.lastIndexOf("|");
  const w = line.slice(0, i), c = line.slice(i + 1);
  if (FIELDS[c]) map[w] = c;
}
const labels = Object.fromEntries(Object.entries(FIELDS).map(([c, f]) => [c, f.label]));
writeFileSync(new URL("../../data/fields.js", import.meta.url), `// Otomatik üretildi: node tools/art/build_fields.mjs\nself.KB_FIELD = ${JSON.stringify(map)};\nself.KB_FIELD_LABELS = ${JSON.stringify(labels)};\n`);
console.log(Object.keys(FIELDS).length, "alan görseli,", Object.keys(map).length, "kelime eşlendi");
