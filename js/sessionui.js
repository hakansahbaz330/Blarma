// Çalışma oturumu ve seviye belirleme testi arayüzü.
import { ctx } from "./ctx.js";
import { createSession } from "./session.js";
import { makeExercise, checkTyped, posLabel, shortMeaning } from "./exercises.js";
import { LEVELS, LEVEL_LABELS } from "./srs.js";
import { speak, stopSpeaking, listenOnce, caps as speechCaps } from "./speech.js";
import { icons } from "./icons.js";
import { escapeHtml as h, dayNumber, shuffle } from "./util.js";

let S = null;            // etkin oturum
let ui = null;           // {answered, hinted, el...}
let placement = null;

const overlay = () => document.getElementById("overlay");
const sayOpts = () => {
  const s = ctx.store.state.settings;
  return { accent: s.accent, rate: s.rate, voiceURI: s.voice };
};
export const say = (text) => speak(text, sayOpts());

function closeAll() {
  stopSpeaking();
  overlay().innerHTML = "";
  document.body.classList.remove("in-session");
  S = null; ui = null; placement = null;
  document.removeEventListener("keydown", onKey);
  ctx.rerender();
}

function shell(title) {
  overlay().innerHTML = `
    <section class="sess" role="dialog" aria-label="${h(title)}">
      <header class="sess-head">
        <button class="icon-btn" data-a="s:exit" aria-label="Kapat">${icons.close}</button>
        <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="s-bar" style="width:0%"></i></div>
        <span class="chip xp" id="s-xp">+0 XP</span>
      </header>
      <div class="sess-body" id="s-body"></div>
      <footer class="sess-foot" id="s-foot"></footer>
    </section>`;
  document.body.classList.add("in-session");
  document.addEventListener("keydown", onKey);
}

const body = () => document.getElementById("s-body");
const foot = () => document.getElementById("s-foot");

function setProgress(p, xp) {
  const bar = document.getElementById("s-bar");
  if (bar) { bar.style.width = Math.round(p * 100) + "%"; bar.parentElement.setAttribute("aria-valuenow", Math.round(p * 100)); }
  if (xp != null) document.getElementById("s-xp").textContent = `+${xp} XP`;
}

/* ------------------------------------------------------------------ oturum */

export function startSession({ mode = "daily", words = null, newCount = null, title = "Çalışma" } = {}) {
  const caps = { audio: speechCaps.audio, speaking: speechCaps.speaking && ctx.store.state.settings.speaking };
  const s = createSession({ store: ctx.store, index: ctx.index, mode, words, newCount, caps });
  if (s.done) { ctx.toast("Şu an çalışılacak kelime yok."); return false; }
  S = s;
  ui = { answered: false, hinted: false, xp: 0 };
  shell(title);
  next();
  return true;
}

function next() {
  const t = S.current();
  if (!t) return finish();
  ui.answered = false;
  ui.hinted = false;
  setProgress(S.progress());
  if (t.kind === "intro") renderIntro(t);
  else renderExercise(t);
}

function wordOf(t) { return ctx.index.byWord.get(t.word); }

function lvChip(w) {
  return `<span class="chip lv lv-${w.level}">${w.level === "k" ? "Kendi" : w.level.toUpperCase()}</span>`;
}

function meaningsHtml(w) {
  return `<ul>${w.tr.map((m) => `<li>${h(m)}</li>`).join("")}</ul>`;
}

function renderIntro(t) {
  const w = wordOf(t);
  body().innerHTML = `
    <div class="intro-wrap">
      <article class="card flash" id="flash" aria-label="Yeni kelime">
        <span class="stamp l">BİLİYORUM</span><span class="stamp r">ÖĞRENELİM</span>
        ${lvChip(w)} <span class="chip">${h(posLabel(w.pos))}</span>
        <div class="big" lang="en">${h(w.word)}</div>
        <button class="icon-btn say" data-a="s:say" data-t="${h(w.word)}" aria-label="Dinle">${icons.speaker}</button>
        ${meaningsHtml(w)}
        ${w.example ? `<div class="example" lang="en"><span class="grow">${h(w.example)}</span><button class="icon-btn" data-a="s:say" data-t="${h(w.example)}" aria-label="Cümleyi dinle">${icons.speaker}</button></div>` : ""}
      </article>
      <p class="swipe-hint">Kartı sağa kaydır: öğren · sola kaydır: zaten biliyorum</p>
    </div>`;
  foot().innerHTML = `<div class="intro-actions">
      <button class="btn" data-a="s:known">Zaten biliyorum</button>
      <button class="btn primary" data-a="s:learn">Öğrenelim ${icons.arrowRight}</button></div>`;
  setupSwipe(document.getElementById("flash"));
  if (ctx.store.state.settings.autoplay) say(w.word);
}

function setupSwipe(el) {
  let x0 = null, dx = 0;
  const stampL = el.querySelector(".stamp.l"), stampR = el.querySelector(".stamp.r");
  el.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    x0 = e.clientX; dx = 0;
    el.setPointerCapture && el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
    if (x0 == null) return;
    dx = e.clientX - x0;
    el.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
    stampR.style.opacity = Math.max(0, Math.min(1, dx / 90));
    stampL.style.opacity = Math.max(0, Math.min(1, -dx / 90));
  });
  const end = () => {
    if (x0 == null) return;
    const d = dx; x0 = null;
    if (d > 90) fling(el, 1, () => decideIntro("learn"));
    else if (d < -90) fling(el, -1, () => decideIntro("known"));
    else { el.style.transition = "transform .2s"; el.style.transform = ""; stampL.style.opacity = stampR.style.opacity = 0; setTimeout(() => (el.style.transition = ""), 220); }
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

function fling(el, dir, cb) {
  el.style.transition = "transform .18s, opacity .18s";
  el.style.transform = `translateX(${dir * 420}px) rotate(${dir * 14}deg)`;
  el.style.opacity = "0";
  setTimeout(cb, 170);
}

function decideIntro(d) {
  if (!S) return;
  S.decideIntro(d);
  if (d === "known") ctx.toast("Tamam, bu kelimeyi bir daha göstermeyeceğiz.");
  next();
}

/* -------------------------------------------------------------- alıştırmalar */

function promptHtml(ex, w) {
  const audioBtn = (txt) => `<button class="icon-btn say" data-a="s:say" data-t="${h(txt)}" aria-label="Dinle" style="margin:8px auto 0">${icons.speaker}</button>`;
  switch (ex.type) {
    case "mcq_en_tr":
      return `<div class="q-prompt"><div class="kicker">Türkçesi nedir?</div><div class="big" lang="en">${h(ex.prompt)}</div><div class="sub">${h(ex.sub)}</div>${audioBtn(w.word)}</div>`;
    case "mcq_tr_en":
      return `<div class="q-prompt"><div class="kicker">İngilizcesi nedir?</div><div class="big tr">${h(ex.prompt)}</div><div class="sub">${h(ex.sub)}</div></div>`;
    case "listen_mcq":
      return `<div class="q-prompt"><div class="kicker">${h(ex.prompt)}</div><button class="icon-btn say" data-a="s:say" data-t="${h(w.word)}" aria-label="Tekrar dinle" style="width:84px;height:84px;margin:6px auto">${icons.speaker.replace('width="22" height="22"', 'width="38" height="38"')}</button></div>`;
    case "type_en":
      return `<div class="q-prompt"><div class="kicker">İngilizce yaz</div><div class="big tr">${h(ex.prompt)}</div><div class="sub">${h(ex.sub)}</div></div>`;
    case "dictation":
      return `<div class="q-prompt"><div class="kicker">${h(ex.prompt)}</div><button class="icon-btn say" data-a="s:say" data-t="${h(w.word)}" aria-label="Tekrar dinle" style="width:84px;height:84px;margin:6px auto">${icons.speaker.replace('width="22" height="22"', 'width="38" height="38"')}</button>${ex.sub ? `<div class="sub">${h(ex.sub)}</div>` : ""}</div>`;
    case "cloze": {
      const c = ex.cloze;
      return `<div class="q-prompt"><div class="kicker">${h(ex.prompt)} · <span lang="tr">${h(ex.sub)}</span></div></div>
        <p class="cloze" lang="en">${h(c.before)}<span class="blank">${"&nbsp;".repeat(Math.min(8, c.token.length))}</span>${h(c.after)}</p>`;
    }
    case "speak":
      return `<div class="q-prompt"><div class="kicker">${h(ex.prompt)}</div><div class="big" lang="en">${h(ex.display)}</div><div class="sub">${h(ex.sub)}</div>${audioBtn(w.word)}</div>`;
    default: return "";
  }
}

function renderExercise(t) {
  const ex = t.ex;
  const w = wordOf(t);
  const optionsHtml = ex.options
    ? `<div class="options" id="opts">${ex.options.map((o, i) => `<button class="opt" data-a="s:opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${h(o.label)}</span></button>`).join("")}</div>`
    : "";
  const typed = ex.type === "type_en" || ex.type === "dictation" || (ex.type === "cloze" && ex.mode === "type");
  const typedHtml = typed
    ? `<input class="type-in" id="ans" type="text" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" lang="en" aria-label="Cevabın">
       <div class="hintline" id="hintline"></div>`
    : "";
  const speakHtml = ex.type === "speak"
    ? `<button class="mic" id="mic" data-a="s:mic" aria-label="Konuşmaya başla">${icons.mic}</button><p class="muted" style="text-align:center" id="mic-msg">Mikrofon simgesine dokun ve kelimeyi söyle.</p>`
    : "";
  body().innerHTML = promptHtml(ex, w) + typedHtml + speakHtml + optionsHtml + `<div id="fb"></div>`;
  const tools = [];
  if (typed) {
    tools.push(`<button class="btn ghost sm" data-a="s:hint">İpucu</button>`);
    foot().innerHTML = `<div class="row"><button class="btn" data-a="s:idk">Bilmiyorum</button><button class="btn primary grow" data-a="s:check">Kontrol et</button></div>`;
  } else if (ex.type === "speak") {
    foot().innerHTML = `<div class="row"><button class="btn" data-a="s:idk">Bilmiyorum</button><button class="btn grow" data-a="s:skipspeak">Şimdi söyleyemem</button></div>`;
  } else {
    foot().innerHTML = `<div class="row"><button class="btn ghost sm" data-a="s:idk">Bilmiyorum</button></div>`;
  }
  const ans = document.getElementById("ans");
  if (ans) setTimeout(() => ans.focus(), 50);
  const auto = ctx.store.state.settings.autoplay;
  if (ex.audio && auto) say(ex.audio);
  else if (ex.type === "mcq_en_tr" && auto) say(w.word);
}

function lockOptions(correctIdx, pickedIdx) {
  document.querySelectorAll("#opts .opt").forEach((b, i) => {
    b.disabled = true;
    if (i === correctIdx) b.classList.add("ok");
    else if (i === pickedIdx) b.classList.add("bad");
  });
}

function currentTask() { return S && S.current(); }

// Uçtan uca testler için: etkin alıştırma (yalnızca okuma).
if (typeof window !== "undefined") window.__kbExercise = () => { const t = currentTask(); return t && t.ex; };

function feedbackHtml(ok, close, w, extra = "") {
  const title = ok ? (close ? "Neredeyse! Doğru yazım:" : ["Harika!", "Doğru!", "Süper!", "Tam isabet!"][Math.floor(Math.random() * 4)]) : "Doğrusu:";
  return `<div class="feedback ${ok ? "ok" : "bad"}" role="status">
      <h3>${h(title)}</h3>
      <div class="w" lang="en">${h(w.word)} <span class="muted" style="font-weight:600;font-size:15px">· ${h(posLabel(w.pos))}</span></div>
      <div>${h(w.tr.join(" · "))}</div>
      ${w.example ? `<div class="ex" lang="en">${h(w.example)}</div>` : ""}
      ${extra}
      <div class="tools">
        <button class="btn sm" data-a="s:say" data-t="${h(w.word)}">${icons.speaker} Dinle</button>
        <button class="btn sm ghost" data-a="s:skipknown">Bu kelimeyi biliyorum</button>
        <button class="btn sm ghost" data-a="s:flag" data-w="${h(w.word)}">${icons.flag} Çeviri hatalı</button>
      </div>
    </div>`;
}

function finishAnswer({ correct, close = false }) {
  const t = currentTask();
  const w = wordOf(t);
  const res = S.submit({ correct, close, hinted: ui.hinted });
  ui.answered = true;
  ui.lastWord = w.word;
  ui.xp += res ? res.xp : 0;
  setProgress(S.progress(), S.summary().xp);
  document.getElementById("fb").innerHTML = feedbackHtml(correct, close, w);
  foot().innerHTML = `<button class="btn primary block" data-a="s:next" id="btn-next">Devam <kbd class="sr">Enter</kbd></button>`;
  document.getElementById("btn-next").focus();
  if (correct && t.ex && t.ex.type !== "listen_mcq" && t.ex.type !== "dictation" && ctx.store.state.settings.autoplay) say(w.word);
  // Cevaplanan görev kuyruktan çıktı; sonraki görev next() ile gelir.
  const fb = document.getElementById("fb");
  fb.scrollIntoView && fb.scrollIntoView({ block: "nearest" });
}

function onOption(i) {
  if (ui.answered) return;
  const t = currentTask();
  const ex = t.ex;
  const idx = ex.options.findIndex((o) => o.correct);
  lockOptions(idx, i);
  finishAnswer({ correct: ex.options[i].correct });
}

function onCheck() {
  if (ui.answered) return;
  const t = currentTask();
  const ex = t.ex;
  const input = document.getElementById("ans");
  const r = checkTyped(ex.answer, input.value);
  if (!input.value.trim()) { input.focus(); return; }
  input.classList.add(r.ok ? "ok" : "bad");
  input.disabled = true;
  finishAnswer({ correct: r.ok, close: r.close });
}

function onIdk() {
  if (ui.answered) return;
  const t = currentTask();
  if (t.ex.options) {
    const idx = t.ex.options.findIndex((o) => o.correct);
    lockOptions(idx, -1);
  }
  const input = document.getElementById("ans");
  if (input) { input.classList.add("bad"); input.disabled = true; }
  finishAnswer({ correct: false });
}

async function onMic() {
  if (ui.answered || ui.listening) return;
  const mic = document.getElementById("mic");
  const msg = document.getElementById("mic-msg");
  const t = currentTask();
  ui.listening = true;
  mic.classList.add("rec");
  msg.textContent = "Dinliyorum…";
  try {
    const alts = await listenOnce(ctx.store.state.settings.accent, 6000);
    if (!S || ui.answered) return;
    const ok = alts.map((a) => checkTyped(t.ex.answer, a)).find((r) => r.ok);
    if (alts.length === 0) { msg.textContent = "Ses algılanmadı. Tekrar dene."; return; }
    msg.textContent = `Duyduğum: “${alts[0]}”`;
    finishAnswer({ correct: !!ok, close: !!(ok && ok.close) });
  } catch {
    msg.textContent = "Mikrofon kullanılamadı. Aşağıdan geçebilirsin.";
  } finally {
    ui.listening = false;
    mic.classList.remove("rec");
  }
}

function next2() { if (!S) return; next(); }

function finish() {
  const sum = S.summary();
  const learned = sum.learned.map((w) => ctx.index.byWord.get(w)).filter(Boolean);
  const missed = sum.missed.map((w) => ctx.index.byWord.get(w)).filter(Boolean);
  const pct = Math.round(sum.accuracy * 100);
  setProgress(1, sum.xp);
  body().innerHTML = `
    <div class="summary stack">
      <div class="trophy" aria-hidden="true">🌱</div>
      <h1>Oturum tamam!</h1>
      <p class="muted">${sum.answers ? `${sum.answers} soru · %${pct} doğru` : "Bu oturumda soru çözmedin."}</p>
      <div class="stat-row">
        <div class="stat"><b>${learned.length}</b><span>yeni kelime</span></div>
        <div class="stat"><b>${sum.reviewed}</b><span>tekrar</span></div>
        <div class="stat"><b>+${sum.xp}</b><span>XP</span></div>
      </div>
      ${learned.length ? `<div><h2 class="sec">Bugün öğrendiklerin</h2><div class="pill-list">${learned.map((w) => `<span class="pill"><b lang="en">${h(w.word)}</b>${h(shortMeaning(w, 1))}</span>`).join("")}</div></div>` : ""}
      ${missed.length ? `<div><h2 class="sec">Zorlandıkların (yakında tekrar edilecek)</h2><div class="pill-list">${missed.map((w) => `<span class="pill"><b lang="en">${h(w.word)}</b>${h(shortMeaning(w, 1))}</span>`).join("")}</div></div>` : ""}
    </div>`;
  foot().innerHTML = `<button class="btn primary block" data-a="s:done">Tamam</button>`;
  if (learned.length || sum.reviewed >= 5) confetti();
}

function confetti() {
  const box = document.createElement("div");
  box.className = "confetti";
  const colors = ["#0f9d6b", "#f59e0b", "#2f8fd8", "#d6336c", "#8b5cf6"];
  for (let i = 0; i < 36; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
    p.style.animationDelay = Math.random() * 0.5 + "s";
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4000);
}

function exitConfirm() {
  if (!S && !placement) return closeAll();
  const back = document.createElement("div");
  back.className = "modal-back";
  back.style.zIndex = 70;
  back.innerHTML = `<div class="modal stack" role="alertdialog" aria-label="Çıkış">
      <h2>Oturumu bitirelim mi?</h2>
      <p class="muted">İlerlemen kaydedildi. Cevapladığın kelimeler zaten ilerlemene yazıldı.</p>
      <button class="btn primary block" data-a="s:exit-yes">Evet, çık</button>
      <button class="btn block" data-a="s:exit-no">Devam et</button></div>`;
  document.body.appendChild(back);
}

function onKey(e) {
  if (!document.body.classList.contains("in-session")) return;
  const inInput = e.target && e.target.tagName === "INPUT";
  if (e.key === "Enter") {
    if (e.target && e.target.tagName === "BUTTON") return; // düğme kendi tıklamasını işler
    if (ui && ui.answered) { e.preventDefault(); next2(); }
    else if (inInput) { e.preventDefault(); onCheck(); }
  } else if (!inInput && /^[1-5]$/.test(e.key) && ui && !ui.answered) {
    const b = document.querySelectorAll("#opts .opt")[Number(e.key) - 1];
    if (b) b.click();
  } else if (e.key === "Escape") {
    exitConfirm();
  }
}

/* ---------------------------------------------------------------- eylemler */

Object.assign(ctx.actions, {
  "s:say": (el) => say(el.dataset.t),
  "s:exit": () => exitConfirm(),
  "s:exit-yes": () => { document.querySelectorAll(".modal-back").forEach((m) => m.remove()); closeAll(); },
  "s:exit-no": () => document.querySelectorAll(".modal-back").forEach((m) => m.remove()),
  "s:learn": () => { const f = document.getElementById("flash"); f ? fling(f, 1, () => decideIntro("learn")) : decideIntro("learn"); },
  "s:known": () => { const f = document.getElementById("flash"); f ? fling(f, -1, () => decideIntro("known")) : decideIntro("known"); },
  "s:opt": (el) => (placement && placement.current ? placementPick(Number(el.dataset.i)) : onOption(Number(el.dataset.i))),
  "s:check": () => onCheck(),
  "s:idk": () => (placement && placement.current ? placementPick(-1) : onIdk()),
  "s:hint": () => {
    const t = currentTask();
    if (!t || !t.ex.hint || ui.answered) return;
    ui.hinted = true;
    document.getElementById("hintline").textContent = t.ex.hint;
  },
  "s:mic": () => onMic(),
  "s:skipspeak": () => { if (!ui.answered) { ui.hinted = true; finishAnswer({ correct: true }); } },
  "s:next": () => next2(),
  "s:done": () => closeAll(),
  "s:skipknown": () => {
    if (!S || !ui || !ui.lastWord) return;
    S.markKnown(ui.lastWord);
    ctx.toast(`“${ui.lastWord}” bilinen kelimelere eklendi.`);
    const b = document.querySelector('[data-a="s:skipknown"]');
    if (b) b.disabled = true;
  },
  "s:flag": (el) => {
    ctx.store.state.flags[el.dataset.w] = new Date().toISOString().slice(0, 10);
    ctx.store.save();
    ctx.toast("Bildirildi, teşekkürler. (Ayarlar'dan dışa aktarabilirsin.)");
  },
  "s:placement-done": () => closeAll(),
});

/* ------------------------------------------------------- seviye belirleme testi */

const PER_LEVEL = 6;

export function startPlacement() {
  const rng = Math.random;
  placement = { levelIdx: 0, qIdx: 0, results: {}, current: null, queue: [], words: [] };
  shell("Seviye belirleme");
  loadLevel();
  placementNext();
}

function loadLevel() {
  const lv = LEVELS[placement.levelIdx];
  const pool = ctx.index.byLevel.get(lv) || [];
  placement.queue = shuffle(pool).slice(0, PER_LEVEL);
  placement.qIdx = 0;
  placement.results[lv] = { ok: 0, n: 0, words: [] };
}

function placementNext() {
  const total = LEVELS.length * PER_LEVEL;
  const done = placement.levelIdx * PER_LEVEL + placement.qIdx;
  setProgress(done / total);
  if (placement.qIdx >= placement.queue.length) {
    const lv = LEVELS[placement.levelIdx];
    const r = placement.results[lv];
    if (r.ok / r.n < 0.5 || placement.levelIdx === LEVELS.length - 1) return placementFinish();
    placement.levelIdx++;
    loadLevel();
  }
  const w = placement.queue[placement.qIdx];
  const ex = makeExercise("mcq_en_tr", w, ctx.index, Math.random, {});
  placement.current = { w, ex, answered: false };
  body().innerHTML = `<div class="q-prompt"><div class="kicker">Seviye testi · ${placement.qIdx + 1}/${PER_LEVEL}</div><div class="big" lang="en">${h(w.word)}</div>
      <button class="icon-btn say" data-a="s:say" data-t="${h(w.word)}" aria-label="Dinle" style="margin:8px auto 0">${icons.speaker}</button></div>
    <div class="options" id="opts">${ex.options.map((o, i) => `<button class="opt" data-a="s:opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${h(o.label)}</span></button>`).join("")}</div>`;
  foot().innerHTML = `<button class="btn block" data-a="s:idk">Bilmiyorum</button>`;
  ui = { answered: false };
}

function placementPick(i) {
  const c = placement.current;
  if (!c || c.answered) return;
  c.answered = true;
  const ok = i >= 0 && c.ex.options[i].correct;
  const lv = LEVELS[placement.levelIdx];
  const r = placement.results[lv];
  r.n++;
  if (ok) { r.ok++; r.words.push(c.w.word); }
  const idx = c.ex.options.findIndex((o) => o.correct);
  lockOptions(idx, i);
  placement.qIdx++;
  setTimeout(() => { if (placement) placementNext(); }, ok ? 350 : 700);
}

function placementFinish() {
  const st = ctx.store.state;
  const today = dayNumber();
  let est = 0; // en yüksek başarılı seviye indeksi
  LEVELS.forEach((lv, i) => {
    const r = placement.results[lv];
    if (r && r.n && r.ok / r.n >= 0.67) est = i;
  });
  // Doğru bilinen kelimeler 3 gün sonra doğrulama tekrarına girer.
  for (const lv of Object.keys(placement.results)) {
    for (const w of placement.results[lv].words) {
      if (!st.prog[w]) st.prog[w] = { s: 2, due: today + 3, iv: 3, ease: 2.5, reps: 2, lapses: 0, ok: 1, seen: 1, fav: 0 };
    }
  }
  const start = LEVELS[est];
  const nextLv = LEVELS[est + 1];
  st.settings.levels = nextLv ? [start, nextLv] : [LEVELS[est - 1] || start, start];
  st.placed = true;
  ctx.store.save();
  const rows = LEVELS.map((lv) => {
    const r = placement.results[lv];
    return r ? `<div class="lvl-row"><span>${LEVEL_LABELS[lv]}</span><div class="bar"><i style="width:${Math.round((r.ok / r.n) * 100)}%"></i></div><small>${r.ok}/${r.n}</small></div>` : "";
  }).join("");
  placement.current = null;
  setProgress(1);
  body().innerHTML = `<div class="summary stack">
      <div class="trophy">🎯</div>
      <h1>Seviyen: ${LEVEL_LABELS[start]}</h1>
      <p class="muted">Çalışma seviyelerin <b>${st.settings.levels.map((l) => l.toUpperCase()).join(" + ")}</b> olarak ayarlandı. Ayarlar'dan istediğin zaman değiştirebilirsin.</p>
      <div class="card stack" style="text-align:left">${rows}</div>
      <p class="muted">Doğru bildiklerin 3 gün sonra tekrar listene gelir; böylece şans eseri bildiklerin de sınanır.</p></div>`;
  foot().innerHTML = `<button class="btn primary block" data-a="s:placement-done">Başlayalım</button>`;
}
