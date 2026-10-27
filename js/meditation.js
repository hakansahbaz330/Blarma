// Meditasyon: sakin bir arka planda Türkçe → İngilizce kelime çiftleri, otomatik ve sesli.
import { ctx } from "./ctx.js";
import { speak, stopSpeaking } from "./speech.js";
import { startAmbient, stopAmbient } from "./ambient.js";
import { icons } from "./icons.js";
import { escapeHtml as h, shuffle } from "./util.js";

let st = null;
const overlay = () => document.getElementById("overlay");
const SOUNDS = [["waves", "Dalga"], ["rain", "Yağmur"], ["off", "Kapalı"]];

function opts() {
  const s = ctx.store.state.settings;
  return { accent: s.accent, rate: Math.min(0.85, s.rate), voiceURI: s.voice };
}

export function openMeditation(pool) {
  const max = Math.min(15, pool.length);
  st = { pool, count: max, max, sound: "waves", i: 0, list: [], timer: null, running: false };
  overlay().innerHTML = `
    <section class="sess" role="dialog" aria-label="Meditasyon">
      <header class="sess-head"><button class="icon-btn" data-a="med:close" aria-label="Kapat">${icons.close}</button></header>
      <div class="sess-body" style="align-items:center;text-align:center;gap:14px">
        <div class="ticon tone-purple" style="width:130px;height:130px;border-radius:32px;margin-top:10px"><span style="font-size:64px">🪷</span></div>
        <h1>Meditasyon</h1>
        <p class="muted">Kelimeler sakin bir ortamda, önce Türkçe sonra İngilizce olarak yavaşça gösterilir ve okunur. Seçtiğin kaynaktaki kelimelerden otomatik seçilir.</p>
        <div class="card stack" style="width:100%;text-align:left">
          <div class="row between"><b>Kelime sayısı</b><span class="muted" id="med-n">${st.count}/${st.max}</span></div>
          <input id="med-range" type="range" min="${Math.min(3, st.max)}" max="${st.max}" value="${st.count}" aria-label="Kelime sayısı" style="width:100%;accent-color:var(--primary)">
          <div class="field" style="margin:6px 0 0"><label>Arka plan sesi</label><div class="seg" id="med-sound">${SOUNDS.map(([v, l]) => `<button data-a="med:sound" data-v="${v}" aria-pressed="${st.sound === v}">${l}</button>`).join("")}</div></div>
        </div>
      </div>
      <footer class="sess-foot"><button class="btn primary block lg3d" data-a="med:start">Başla</button></footer>
    </section>`;
  document.body.classList.add("in-session");
  document.getElementById("med-range").addEventListener("input", (e) => {
    st.count = Number(e.target.value);
    document.getElementById("med-n").textContent = `${st.count}/${st.max}`;
  });
}

function close() {
  if (!st) return;
  clearTimeout(st.timer);
  stopSpeaking(); stopAmbient();
  overlay().innerHTML = "";
  document.body.classList.remove("in-session");
  st = null;
  ctx.rerender();
}

function begin() {
  st.list = shuffle(st.pool).slice(0, st.count).map((w) => ctx.index.byWord.get(w)).filter(Boolean);
  st.i = 0; st.running = true;
  overlay().innerHTML = `
    <section class="sess night" role="dialog" aria-label="Meditasyon">
      <div class="stars" aria-hidden="true"></div>
      <header class="sess-head night-head"><button class="icon-btn glass" data-a="med:close" aria-label="Kapat">${icons.close}</button><span class="grow" style="color:#fff;font-weight:700">Meditasyon</span><span id="med-count" style="color:#fff"></span></header>
      <div class="night-body"><div id="med-tr" class="med-tr"></div><div class="med-line"></div><div id="med-en" class="med-en" lang="en"></div></div>
      <footer class="night-foot"><button class="icon-btn glass big" data-a="med:toggle" id="med-play" aria-label="Duraklat">${icons.pause}</button></footer>
    </section>`;
  startAmbient(st.sound);
  step();
}

function step() {
  if (!st) return;
  clearTimeout(st.timer);
  const w = st.list[st.i];
  if (!w) return end();
  document.getElementById("med-count").textContent = `${st.i + 1}/${st.list.length}`;
  const tr = document.getElementById("med-tr"), en = document.getElementById("med-en"), line = document.querySelector(".med-line");
  tr.textContent = w.tr[0]; tr.classList.remove("in"); void tr.offsetWidth; tr.classList.add("in");
  en.textContent = ""; line.classList.remove("on");
  st.timer = setTimeout(() => {
    if (!st) return;
    line.classList.add("on");
    en.textContent = w.word; en.classList.remove("in"); void en.offsetWidth; en.classList.add("in");
    speak(w.word, opts()).then(() => { if (st && st.running) st.timer = setTimeout(() => { st.i++; step(); }, 3200); });
    if (!ctx.store.state.settings.autoplay === false) { /* ses ayarı speak içinde */ }
  }, 2800);
}

function end() {
  stopAmbient();
  const body = document.querySelector(".night-body");
  if (body) body.innerHTML = `<div style="font-size:60px">🌙</div><h2 style="color:#fff">Seans bitti</h2><p style="color:#c9c4ff">${st.list.length} kelime üzerinden geçtin.</p>
    <button class="btn" data-a="med:close" style="margin-top:14px">Kapat</button>`;
}

function toggle() {
  st.running = !st.running;
  document.getElementById("med-play").innerHTML = st.running ? icons.pause : icons.play;
  if (st.running) { startAmbient(st.sound); step(); } else { clearTimeout(st.timer); stopAmbient(); stopSpeaking(); }
}

Object.assign(ctx.actions, {
  "med:close": close,
  "med:start": begin,
  "med:toggle": toggle,
  "med:sound": (el) => { st.sound = el.dataset.v; document.querySelectorAll("#med-sound button").forEach((b) => b.setAttribute("aria-pressed", String(b === el))); },
});
