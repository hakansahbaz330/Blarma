// Kavram birleşimleri: data-src/concepts/*.psv (kelime|ana|rozet|köşe) -> data/concepts.js
// Her kelime, çizim kümesinden (art/ + x-* piktogramları) en fazla üç parçanın birleşiminden oluşur;
// hiçbir iki kelimenin birleşimi aynı olamaz. Çalıştır: node tools/art/build_concepts.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";


// Anlamca yakın parçalar: çakışan bir kelimenin rozetini/köşesini bunlarla değiştirerek benzersizleştiririz.
const RING = [
  "x-check thumb stamp medal trophy x-shield x-sparkle", "x-cross x-minus x-trenddown skull x-lock-open",
  "x-document book newspaper envelope x-folder diary notebook page letter magazine dictionary",
  "x-people x-family x-handshake x-person man woman boy girl child", "x-fist muscle lion rock x-hammer x-lightning fire",
  "x-eyes x-glasses x-magnifier camera lens", "x-lightning fire bomb rocket x-wind firework", "x-bulb lamp candle brain star x-sparkle",
  "x-up2 x-trendup ladder rocket mountain stair", "x-down2 x-trenddown cliff stair", "x-right2 arrow right x-footprints road x-path x-signpost",
  "x-speech x-chat2 x-megaphone x-thought phone x-mic", "x-exclaim bell x-whistle x-megaphone", "x-target x-pin north flag key",
  "x-scales x-equals x-pie x-bars", "clock x-hourglass x-calendar minute hour", "x-tools x-hammer gear engine x-magnet",
  "x-link rope chain plug cable", "heart rose x-wave gift ring flower", "x-sparkle star diamond crown rainbow medal",
  "x-spiral x-question x-loop x-bubbles cloud", "x-loop x-swap clock", "x-puzzle2 brick gear x-link", "x-shield umbrella lock fence",
  "coin dollar x-wallet gold cash x-tag bank", "building house castle church embassy apartment school", "map globe earth x-pin x-signpost north",
  "hand finger thumb x-wave x-fist x-handshake", "x-bubbles water glass bottle", "box bag x-suitcase basket x-cart", "x-thermometer pill bed hospital",
  "tree flower seed x-seed leaf plant", "x-wifi phone laptop computer tv", "sun moon star cloud rain snow", "ball football basketball tennis trophy",
].map((g) => g.split(" "));
const alt = (p) => RING.filter((g) => g.includes(p)).flatMap((g) => g.filter((x) => x !== p && has(x)));

const dir = new URL("../../data-src/concepts/", import.meta.url);
const byWord = new Map();
for (const f of readdirSync(dir).filter((x) => x.endsWith(".psv")).sort())
  for (const l of readFileSync(new URL(f, dir), "utf8").split("\n").filter(Boolean)) {
    const [word, main, badge = "", mod = ""] = l.split("|");
    byWord.set(word, { word, parts: [main, badge, mod], f });
  }
const rows = [...byWord.values()];
const artDir = new URL("../../art/", import.meta.url);
const has = (n) => existsSync(new URL(encodeURIComponent(n) + ".svg", artDir));
const bad = [], seen = new Map(), out = {}, dup = [];
let resolved = 0;
for (const r of rows) {
  for (const p of r.parts) if (p && !has(p)) bad.push(`${r.word}: ${p}`);
  let key = r.parts.join(",").replace(/,+$/, "");
  if (seen.has(key)) {
    const k0 = key, [a, b, c] = r.parts;
    const tries = [];
    for (const x of alt(b)) tries.push([a, x, c]);
    for (const x of c ? alt(c) : [...alt(b), ...alt(a)]) tries.push([a, b, x]);
    for (const x of alt(a)) tries.push([x, b, c]);
    for (const x of alt(b)) for (const y of c ? alt(c) : alt(a)) tries.push([a, x, y]);
    const ok = tries.find((t) => t[1] !== t[0] && t[1] !== t[2] && t[0] !== t[2] && !seen.has(t.join(",").replace(/,+$/, "")));
    if (ok) { key = ok.join(",").replace(/,+$/, ""); r.parts = ok; resolved++; }
    else dup.push(`${r.word} = ${seen.get(k0)} (${k0})`);
  }
  if (!seen.has(key)) seen.set(key, r.word);
  if (out[r.word]) dup.push(`${r.word} iki kez`);
  out[r.word] = key;
}
if (process.argv.includes("--check")) {
  console.log("otomatik düzeltilen", resolved, "| satır", rows.length, "| eksik parça", bad.length, "| çakışma", dup.length);
  console.log([...new Set(bad.map((b) => b.split(": ")[1]))].join(" "));
  console.log(dup.join("\n"));
  process.exit(0);
}
writeFileSync(new URL("../../data/concepts.js", import.meta.url), `// Otomatik üretildi: node tools/art/build_concepts.mjs (kelime -> "ana,rozet,köşe" çizim adları)\nself.KB_CONCEPT = ${JSON.stringify(out)};\n`);
console.log(Object.keys(out).length, "kavram birleşimi");
