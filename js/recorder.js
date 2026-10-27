// Ses kayıt: kelimeyi duy, kendi sesini kaydet, karşılaştır. Puanlama yok; kulakla kendi kendine geri bildirim.
import { ctx } from "./ctx.js";
import { speak, stopSpeaking } from "./speech.js";
import { icons } from "./icons.js";
import { tileHtml } from "./visuals.js";
import { posLabel } from "./exercises.js";
import { escapeHtml as h, shuffle } from "./util.js";

let st = null;
const supported = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
export const recordingSupported = supported;

function opts() {
  const s = ctx.store.state.settings;
  return { accent: s.accent, rate: s.rate, voiceURI: s.voice };
}

function close() {
  if (!st) return;
  stopSpeaking();
  try { st.rec && st.rec.state === "recording" && st.rec.stop(); st.stream && st.stream.getTracks().forEach((t) => t.stop()); } catch { /* yok say */ }
  if (st.url) URL.revokeObjectURL(st.url);
  document.getElementById("overlay").innerHTML = "";
  document.body.classList.remove("in-session");
  st = null;
  ctx.rerender();
}

function draw() {
  const w = st.list[st.i];
  const el = document.getElementById("rec-body");
  el.innerHTML = `
    <div class="stack" style="text-align:center">
      <div style="display:flex;justify-content:center">${tileHtml(w, "xl")}</div>
      <div class="big-word" lang="en">${h(w.word)}</div>
      <div class="muted">${h(posLabel(w.pos))} · ${h(w.tr.slice(0, 2).join(" / "))}</div>
      <div class="row" style="justify-content:center;gap:12px">
        <button class="btn" data-a="rec:orig">${icons.speaker} Orijinal</button>
        <button class="btn" data-a="rec:mine" ${st.url ? "" : "disabled"}>${icons.headphones} Benim sesim</button>
      </div>
      <button class="mic ${st.recording ? "rec" : ""}" data-a="rec:toggle" aria-label="${st.recording ? "Kaydı durdur" : "Kayda başla"}">${st.recording ? '<span style="width:28px;height:28px;background:#fff;border-radius:6px;display:block"></span>' : icons.mic}</button>
      <p class="muted" id="rec-msg">${st.msg || (st.recording ? "Kaydediliyor…" : st.url ? "Kendi sesini orijinaliyle karşılaştır." : "Mikrofon düğmesine dokun, kelimeyi söyle, tekrar dokunarak bitir.")}</p>
    </div>`;
  document.getElementById("rec-count").textContent = `${st.i + 1}/${st.list.length}`;
  document.getElementById("s-bar").style.width = `${Math.round(((st.i + 1) / st.list.length) * 100)}%`;
}

async function toggle() {
  if (st.recording) { st.rec.stop(); return; }
  try {
    st.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    st.msg = "Mikrofon izni verilmedi."; return draw();
  }
  const chunks = [];
  st.rec = new MediaRecorder(st.stream);
  st.rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  st.rec.onstop = () => {
    st.recording = false;
    st.stream.getTracks().forEach((t) => t.stop());
    if (st.url) URL.revokeObjectURL(st.url);
    st.url = URL.createObjectURL(new Blob(chunks, { type: st.rec.mimeType || "audio/webm" }));
    st.msg = "";
    if (st) draw();
  };
  st.recording = true; st.msg = "";
  st.rec.start();
  draw();
  setTimeout(() => { if (st && st.recording && st.rec.state === "recording") st.rec.stop(); }, 8000);
}

function nextWord() {
  if (st.recording) return;
  if (st.i >= st.list.length - 1) return close();
  st.i++; if (st.url) URL.revokeObjectURL(st.url); st.url = ""; st.msg = ""; draw();
}

export function startRecorder(pool) {
  if (!supported()) { ctx.toast("Bu tarayıcı ses kaydını desteklemiyor."); return false; }
  st = { list: shuffle(pool).slice(0, Math.min(10, pool.length)).map((w) => ctx.index.byWord.get(w)).filter(Boolean), i: 0, url: "", recording: false, msg: "" };
  document.getElementById("overlay").innerHTML = `
    <section class="sess" role="dialog" aria-label="Ses kayıt">
      <header class="sess-head"><button class="icon-btn" data-a="rec:close" aria-label="Kapat">${icons.close}</button><div class="bar"><i id="s-bar" style="width:0"></i></div><span class="chip" id="rec-count"></span></header>
      <div class="sess-body" id="rec-body" style="justify-content:center"></div>
      <footer class="sess-foot"><button class="btn primary block" data-a="rec:next">Sonraki ${icons.arrowRight}</button></footer>
    </section>`;
  document.body.classList.add("in-session");
  draw();
  return true;
}

Object.assign(ctx.actions, {
  "rec:close": close,
  "rec:toggle": () => toggle(),
  "rec:next": () => nextWord(),
  "rec:orig": () => speak(st.list[st.i].word, opts()),
  "rec:mine": () => { if (st.url) { stopSpeaking(); new Audio(st.url).play().catch(() => {}); } },
});
