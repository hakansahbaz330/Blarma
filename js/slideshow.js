// Slayt gösterisi: seçilen kelimeler otomatik ilerleyen kartlarla, sesli olarak gösterilir (pasif tekrar).
import { ctx } from "./ctx.js";
import { speak, stopSpeaking } from "./speech.js";
import { icons } from "./icons.js";
import { tileHtml } from "./visuals.js";
import { posLabel } from "./exercises.js";
import { escapeHtml as h, shuffle } from "./util.js";

let st = null;

function close() {
  if (!st) return;
  clearTimeout(st.timer);
  stopSpeaking();
  document.removeEventListener("keydown", onKey);
  document.getElementById("overlay").innerHTML = "";
  document.body.classList.remove("in-session");
  st = null;
  ctx.rerender();
}

function opts() {
  const s = ctx.store.state.settings;
  return { accent: s.accent, rate: s.rate, voiceURI: s.voice };
}

function show() {
  clearTimeout(st.timer);
  const w = st.list[st.i];
  const el = document.getElementById("slide");
  el.classList.remove("in"); void el.offsetWidth; el.classList.add("in");
  el.innerHTML = `
    ${tileHtml(w, "xl")}
    <div class="big" lang="en">${h(w.word)}</div>
    <div class="muted">${h(posLabel(w.pos))}</div>
    <ul class="slide-tr">${w.tr.map((m) => `<li>${h(m)}</li>`).join("")}</ul>
    ${w.example ? `<p class="slide-ex" lang="en">${h(w.example)}</p>` : ""}`;
  document.getElementById("s-bar").style.width = `${Math.round(((st.i + 1) / st.list.length) * 100)}%`;
  document.getElementById("slide-count").textContent = `${st.i + 1} / ${st.list.length}`;
  document.getElementById("slide-play").innerHTML = st.playing ? icons.pause : icons.play;
  speak(w.word, opts()).then(() => {
    if (!st || st.list[st.i] !== w) return;
    if (st.playing) st.timer = setTimeout(next, Math.max(1500, ctx.store.state.settings.slideSeconds * 1000 - 800));
  });
  // Ses desteği yoksa (promise hemen çözülür) yine de ilerle.
}

function next() {
  if (!st) return;
  if (st.i >= st.list.length - 1) { st.playing = false; st.i = st.list.length - 1; return finishScreen(); }
  st.i++; show();
}
function prev() { if (st && st.i > 0) { st.i--; show(); } }
function toggle() {
  st.playing = !st.playing;
  document.getElementById("slide-play").innerHTML = st.playing ? icons.pause : icons.play;
  clearTimeout(st.timer);
  if (st.playing) st.timer = setTimeout(next, 800);
}

function finishScreen() {
  document.getElementById("slide").innerHTML = `<div class="trophy" style="font-size:56px">🎧</div><h2>Gösteri bitti</h2><p class="muted">${st.list.length} kelimeyi dinledin.</p>
    <button class="btn primary" data-a="slide:again">Tekrar izle</button>`;
  document.getElementById("slide-play").innerHTML = icons.play;
}

function onKey(e) {
  if (!st) return;
  if (e.key === "Escape") close();
  else if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
  else if (e.key === " ") { e.preventDefault(); toggle(); }
}

export function startSlideshow(words, title = "Slayt gösterisi") {
  const list = shuffle(words.map((w) => ctx.index.byWord.get(w)).filter(Boolean)).slice(0, 15);
  if (list.length < 2) { ctx.toast("Slayt gösterisi için en az 2 kelime gerekli."); return false; }
  st = { list, i: 0, playing: true, timer: null };
  document.getElementById("overlay").innerHTML = `
    <section class="sess" role="dialog" aria-label="${h(title)}">
      <header class="sess-head">
        <button class="icon-btn" data-a="slide:close" aria-label="Kapat">${icons.close}</button>
        <div class="bar"><i id="s-bar" style="width:0"></i></div>
        <span class="chip" id="slide-count"></span>
      </header>
      <div class="sess-body slide-body"><article class="slide in" id="slide" aria-live="polite"></article></div>
      <footer class="sess-foot slide-ctl">
        <button class="icon-btn" data-a="slide:prev" aria-label="Önceki">${icons.skipBack}</button>
        <button class="icon-btn big" id="slide-play" data-a="slide:toggle" aria-label="Oynat/Duraklat">${icons.pause}</button>
        <button class="icon-btn" data-a="slide:next" aria-label="Sonraki">${icons.skipNext}</button>
      </footer>
    </section>`;
  document.body.classList.add("in-session");
  document.addEventListener("keydown", onKey);
  show();
  return true;
}

Object.assign(ctx.actions, {
  "slide:close": close,
  "slide:next": () => next(),
  "slide:prev": () => prev(),
  "slide:toggle": () => toggle(),
  "slide:again": () => { st.i = 0; st.playing = true; show(); },
});
