// Hikâyeler sekmesi: kütüphane, okuyucu (dokunarak çeviri), günün hikâyesi ve isteğe bağlı AI hikâye üretici.
import { ctx } from "./ctx.js";
import { icons } from "./icons.js";
import { say } from "./sessionui.js";
import { stopSpeaking } from "./speech.js";
import { lookupToken, tokenize, splitSentences } from "./lemma.js";
import { newProgress } from "./srs.js";
import { posLabel } from "./exercises.js";
import { tileHtml } from "./visuals.js";
import { pickStoryWords, generateStory, renderStoryHtml } from "./stories.js";
import { escapeHtml as h, dayNumber, foldTurkish } from "./util.js";

export const stories = () => (typeof window !== "undefined" && window.BLARMA_STORIES) || [];
export const storyState = { q: "", filter: "all", showTr: false, current: null, gen: { source: "recent", loading: false, story: null, error: "", showTr: false } };

const LV_NAME = { a1: "Başlangıç", a2: "Temel", b1: "Orta", b2: "Orta üstü", c1: "İleri" };

/** Günün hikâyesi: seçili seviyelere en uygun, güne göre sabit. */
export function storyOfTheDay(today = dayNumber()) {
  const all = stories();
  if (!all.length) return null;
  const levels = ctx.store.state.settings.levels;
  const maxIdx = Math.max(...levels.map((l) => ["a1", "a2", "b1", "b2", "c1"].indexOf(l)), 0);
  const ok = all.filter((s) => ["a1", "a2", "b1", "b2", "c1"].indexOf(s.level) <= maxIdx);
  const pool = ok.length ? ok : all;
  return pool[today % pool.length];
}

export function storyReadToday(today = dayNumber()) {
  return ctx.store.state.stats.storyDay === today;
}

function coverage(s) {
  const prog = ctx.store.state.prog;
  const toks = tokenize(s.en.join(" ")).filter((t) => t.word);
  const uniq = new Set();
  let known = 0;
  for (const t of toks) {
    const w = lookupToken(t.t, ctx.index.byWord);
    if (!w || uniq.has(w.word)) continue;
    uniq.add(w.word);
    if (prog[w.word] && prog[w.word].s >= 2) known++;
  }
  return { known, total: uniq.size };
}

export function storiesView() {
  const st = ctx.store.state;
  const q = foldTurkish(storyState.q.trim());
  const f = storyState.filter;
  const list = stories().filter((s) => {
    if (f === "fav" && !st.stories.fav[s.id]) return false;
    if (["a1", "a2", "b1", "b2", "c1"].includes(f) && s.level !== f) return false;
    if (q && !foldTurkish(s.title + " " + s.en.join(" ") + " " + s.tr.join(" ")).includes(q)) return false;
    return true;
  });
  const chip = (v, label) => `<button data-a="st-filter" data-v="${v}" aria-pressed="${f === v}">${label}</button>`;
  return `
    <div class="page-head"><h1>Hikâyeler</h1>
      <button class="btn soft sm" data-a="gen-open">${icons.sparkles} AI ile yaz</button></div>
    <div class="search">${icons.search}<input id="sq" type="search" placeholder="Hikâyelerde kelime ara…" value="${h(storyState.q)}" aria-label="Hikâyelerde ara" autocomplete="off"></div>
    <div class="filters" role="group" aria-label="Hikâye filtresi">${chip("all", "Tümü")}${chip("fav", "★ Favoriler")}${chip("a1", "Başlangıç")}${chip("a2", "Temel")}${chip("b1", "Orta")}</div>
    <div class="story-grid">
      ${list.map((s) => {
        const c = coverage(s);
        const read = st.stories.read[s.id];
        return `<button class="story-card lv-bg-${s.level}" data-a="story-read" data-id="${s.id}">
          <span class="story-emoji" aria-hidden="true">${s.emoji}</span>
          <span class="story-meta"><span class="chip lv lv-${s.level}">${LV_NAME[s.level]}</span>${read ? `<span class="chip ok">✓ Okundu</span>` : ""}${st.stories.fav[s.id] ? `<span class="chip">★</span>` : ""}</span>
          <span class="story-title" lang="en">${h(s.title)}</span>
          <span class="story-sub">${c.known}/${c.total} kelimeyi biliyorsun</span>
        </button>`;
      }).join("") || `<div class="empty" style="grid-column:1/-1">Eşleşen hikâye yok.</div>`}
    </div>`;
}

/* ------------------------------------------------------------------ okuyucu */

const FONTS = [1, 1.18, 1.36];
const reader = { story: null, sentences: [], listening: false, idx: -1, font: 0, trAll: false, trOpen: new Set(), timer: null, token: 0 };

function sentencesOf(s) {
  const out = [];
  s.en.forEach((p, pi) => {
    const en = splitSentences(p), tr = splitSentences(s.tr[pi]);
    const aligned = en.length === tr.length;
    en.forEach((e, i) => out.push({ en: e, tr: aligned ? tr[i] : i === 0 ? s.tr[pi] : "", para: pi, first: i === 0 }));
  });
  return out;
}

/** Hikâyedeki, öğrenme listende olmayan (hedef) kelimeler: tekil, 4+ harfli. */
export function targetWords(s) {
  const prog = ctx.store.state.prog;
  const seen = new Map();
  for (const t of tokenize(s.en.join(" ")).filter((x) => x.word)) {
    const w = lookupToken(t.t, ctx.index.byWord);
    if (w && w.word.length >= 4 && !prog[w.word] && !seen.has(w.word)) seen.set(w.word, w);
  }
  return [...seen.values()];
}

function tokensHtml(text) {
  const prog = ctx.store.state.prog;
  return tokenize(text).map((t) => {
    if (!t.word) return h(t.t);
    const w = lookupToken(t.t, ctx.index.byWord);
    if (!w) return h(t.t);
    const c = prog[w.word];
    const k = c && c.s >= 2 ? "known" : !c && w.word.length >= 4 ? "new" : "plain";
    return `<button class="tok ${k}" data-a="tok" data-w="${h(w.word)}" data-t="${h(t.t)}">${h(t.t)}</button>`;
  }).join("");
}

function sentenceRows() {
  let html = "";
  reader.sentences.forEach((x, i) => {
    const open = reader.trAll || reader.trOpen.has(i);
    html += `<div class="sent ${reader.idx === i ? "on" : ""} ${x.first && i ? "para-start" : ""}" id="sent-${i}">
      <button class="sent-play" data-a="sent-play" data-i="${i}" aria-label="Bu cümleyi dinle">${reader.idx === i && reader.listening ? icons.pause : icons.play}</button>
      <div class="grow"><p lang="en">${tokensHtml(x.en)}</p>${open && x.tr ? `<p class="tr" lang="tr">${h(x.tr)}</p>` : ""}</div>
      <button class="sent-tr ${open ? "on" : ""}" data-a="sent-tr" data-i="${i}" aria-label="Cümleyi çevir" aria-pressed="${open}">${icons.languages}</button></div>`;
  });
  return html;
}

function renderReader() {
  const s = reader.story;
  const el = document.getElementById("overlay");
  const done = !!ctx.store.state.stories.read[s.id];
  el.innerHTML = `
    <section class="sess reader" style="--fs:${FONTS[reader.font]}" role="dialog" aria-label="${h(s.title)}">
      <header class="sess-head rd-head">
        <button class="icon-btn flat" data-a="reader-detail" aria-label="Geri">${icons.chevronLeft}</button>
        <span class="grow reader-title" lang="en">${s.emoji} ${h(s.title)}</span>
        <button class="icon-btn flat" data-a="reader-listen" aria-label="${reader.listening ? "Duraklat" : "Baştan dinle"}">${reader.listening ? icons.pause : icons.headphones}</button>
        <button class="icon-btn flat" data-a="reader-font" aria-label="Yazı boyutu"><b style="font-size:15px">Aa</b></button>
        <button class="icon-btn flat ${reader.trAll ? "on" : ""}" data-a="reader-tr" aria-label="Tüm çeviriler" aria-pressed="${reader.trAll}">${icons.languages}</button>
      </header>
      <div class="sess-body" id="reader-body"><div id="reader-text">${sentenceRows()}</div></div>
      <footer class="sess-foot"><button class="btn primary block" data-a="reader-done">${done ? "Tekrar okudum ✓" : "Okudum ✓"}</button></footer>
    </section>`;
  document.body.classList.add("in-session");
}

function refreshSentences() {
  const box = document.getElementById("reader-text");
  if (box) box.innerHTML = sentenceRows();
}

function stopListening() {
  reader.listening = false;
  reader.token++;
  clearTimeout(reader.timer);
  stopSpeaking();
}

async function listenFrom(i) {
  stopListening();
  reader.listening = true;
  const my = ++reader.token;
  for (let k = i; k < reader.sentences.length; k++) {
    if (!reader.listening || reader.token !== my) return;
    reader.idx = k;
    refreshSentences();
    const el = document.getElementById("sent-" + k);
    el && el.scrollIntoView({ block: "center", behavior: "smooth" });
    const t0 = Date.now();
    await say(reader.sentences[k].en);
    // Ses desteği yoksa makul bir bekleme uygula.
    const min = Math.min(6000, 700 + reader.sentences[k].en.length * 55);
    if (Date.now() - t0 < 400) await new Promise((r) => (reader.timer = setTimeout(r, min)));
  }
  if (reader.token === my) { reader.listening = false; reader.idx = -1; refreshSentences(); const h2 = document.querySelector('[data-a="reader-listen"]'); if (h2) h2.innerHTML = icons.headphones; }
}

export function openDetail(id) {
  const s = stories().find((x) => x.id === id);
  if (!s) return;
  stopListening();
  reader.story = s;
  reader.sentences = sentencesOf(s);
  reader.idx = -1; reader.trOpen = new Set();
  const st = ctx.store.state;
  const fav = !!st.stories.fav[s.id];
  const tw = targetWords(s);
  document.getElementById("overlay").innerHTML = `
    <section class="sess detail" role="dialog" aria-label="${h(s.title)}">
      <div class="detail-hero lv-hero-${s.level}">
        <div class="detail-bar"><button class="icon-btn dark" data-a="reader-close" aria-label="Geri">${icons.chevronLeft}</button>
          <button class="icon-btn dark" data-a="reader-fav" aria-label="Favori" aria-pressed="${fav}">${icons.star.replace("<svg", fav ? '<svg fill="currentColor"' : "<svg")}</button></div>
        <div class="detail-emoji" aria-hidden="true">${s.emoji}</div>
        <div class="detail-title"><div class="story-meta"><span class="chip lv lv-${s.level}">${LV_NAME[s.level]}</span><span class="chip">${reader.sentences.length} cümle</span>${st.stories.read[s.id] ? '<span class="chip ok">✓ Okundu</span>' : ""}</div>
          <h1 lang="en">${h(s.title)}</h1></div>
      </div>
      <div class="sess-body detail-body">
        <button class="plist-row" data-a="target-open"><span class="ticon tone-blue">${icons.sparkles}</span><span class="grow"><b>Hedef kelimeler</b><span class="tsub">Bu hikâyede ${tw.length} yeni kelime</span></span>${icons.chevronRight}</button>
        <div class="row" style="gap:12px;margin-top:14px">
          <button class="btn primary grow lg3d" data-a="reader-start">${icons.bookOpen} Oku</button>
          <button class="btn grow lg3d-light" data-a="reader-start-listen">${icons.headphones} Dinle</button></div>
      </div>
    </section>`;
  document.body.classList.add("in-session");
}
export const openReader = openDetail;

function closeReader() {
  stopListening();
  document.getElementById("overlay").innerHTML = "";
  document.body.classList.remove("in-session");
  reader.story = null;
  ctx.rerender();
}

function targetSheet() {
  const tw = targetWords(reader.story);
  const back = document.createElement("div");
  back.className = "modal-back"; back.style.zIndex = 80; back.id = "tok-sheet";
  back.innerHTML = `<div class="modal stack" role="dialog" aria-label="Hedef kelimeler">
    <div class="row between"><h2>Hedef kelimeler</h2><button class="icon-btn" data-a="tok-close" aria-label="Kapat">${icons.close}</button></div>
    ${tw.length ? `<div class="stack">${tw.map((w) => `<div class="row">${tileHtml(w, "sm")}<div class="grow"><b lang="en">${h(w.word)}</b><div class="muted" style="font-size:14px">${h(w.tr.join(" · "))}</div></div>
        <button class="icon-btn" data-a="say" data-t="${h(w.word)}" aria-label="Dinle">${icons.speaker}</button></div>`).join("")}</div>
      <button class="btn primary block" data-a="target-add-all">Hepsini öğrenme listeme ekle (${tw.length})</button>` : `<p class="muted">Bu hikâyedeki tüm kelimeleri zaten listende görüyorum. 🎉</p>`}</div>`;
  back.addEventListener("click", (e) => { if (e.target === back) back.remove(); });
  document.body.appendChild(back);
}

function tokenSheet(wordKey, tokenText) {
  const w = ctx.index.byWord.get(wordKey);
  if (!w) return;
  const c = ctx.store.state.prog[w.word];
  const back = document.createElement("div");
  back.className = "modal-back";
  back.style.zIndex = 80;
  back.id = "tok-sheet";
  back.innerHTML = `<div class="modal stack" role="dialog" aria-label="${h(w.word)}">
      <div class="row">${tileHtml(w, "lg")}<div class="grow"><div style="font-size:26px;font-weight:800" lang="en">${h(w.word)}</div>
        <div class="muted">${h(posLabel(w.pos))} · <span class="chip lv lv-${w.level}">${w.level.toUpperCase()}</span>${tokenText.toLowerCase() !== w.word ? ` · metinde: <i>${h(tokenText)}</i>` : ""}</div></div>
        <button class="icon-btn" data-a="tok-close" aria-label="Kapat">${icons.close}</button></div>
      <ul style="list-style:none;padding:0;margin:0;font-size:20px;font-weight:700">${w.tr.map((m) => `<li>${h(m)}</li>`).join("")}</ul>
      ${w.example ? `<div class="card" lang="en"><i>${h(w.example)}</i>${w.exampleTr ? `<div class="muted" style="margin-top:4px" lang="tr">${h(w.exampleTr)}</div>` : ""}</div>` : ""}
      <div class="row"><button class="btn grow" data-a="say" data-t="${h(w.word)}">${icons.speaker} Seslendir</button>
        ${!c ? `<button class="btn soft grow" data-a="tok-add" data-w="${h(w.word)}">Sözlüğe ekle</button>` : `<span class="muted grow" style="text-align:center">${c.s === 3 ? "Bildiğin kelime" : "Listende"}</span>`}</div></div>`;
  back.addEventListener("click", (e) => { if (e.target === back) back.remove(); });
  document.body.appendChild(back);
}

/* ---------------------------------------------------------------- AI üretici */

export function openGenerator() {
  const st = ctx.store.state;
  const g = storyState.gen;
  const have = Object.values(st.prog).filter((c) => c.s === 2).length;
  const seg = (v, l) => `<button data-a="gen-src" data-v="${v}" aria-pressed="${g.source === v}">${l}</button>`;
  const m = document.getElementById("modal");
  if (m) m.remove();
  const back = document.createElement("div");
  back.className = "modal-back"; back.id = "modal";
  back.innerHTML = `<div class="modal stack" role="dialog" aria-modal="true">
    <div class="row between"><h2>Kendi hikâyeni yaz</h2><button class="icon-btn" data-a="close-modal" aria-label="Kapat">${icons.close}</button></div>
    <p class="muted" style="font-size:14px">Öğrendiğin kelimelerle yapay zekâ hikâyesi. Kendi Anthropic API anahtarın gerekir.</p>
    ${!st.settings.apiKey ? `<button class="btn soft block" data-a="gen-settings">Ayarlara git</button>` : ""}
    ${have < 3 ? `<p class="muted">Önce en az 3 kelime öğren.</p>` : ""}
    <div class="field"><label>Hangi kelimelerle?</label><div class="seg">${seg("recent", "Yeni öğrendiklerim")}${seg("hard", "Zorlandıklarım")}${seg("due", "Tekrarı yaklaşanlar")}</div></div>
    <button class="btn primary block" data-a="gen-go" ${g.loading || !st.settings.apiKey || have < 3 ? "disabled" : ""}>${g.loading ? "Yazılıyor…" : g.story ? "Yeni hikâye yaz" : "Hikâye yaz"}</button>
    ${g.error ? `<p style="color:var(--danger)" role="alert">${h(g.error)}</p>` : ""}
    ${g.story ? `<article class="card stack" id="story-box"><h3 lang="en">${h(g.story.title)}</h3>
        <div class="story" lang="en">${renderStoryHtml(g.story.en)}</div>
        <div class="row"><button class="btn sm" data-a="gen-say">${icons.speaker} Oku</button>
        <button class="btn sm" data-a="gen-tr">${g.showTr ? "Türkçeyi gizle" : "Türkçesini göster"}</button></div>
        ${g.showTr ? `<div class="story muted" lang="tr">${renderStoryHtml(g.story.tr, { highlight: false })}</div>` : ""}
        ${g.story.missing && g.story.missing.length ? `<p class="muted" style="font-size:13px">Not: şu kelimeler işaretlenemedi: ${h(g.story.missing.join(", "))}</p>` : ""}</article>` : ""}
  </div>`;
  back.addEventListener("click", (e) => { if (e.target === back) back.remove(); });
  document.body.appendChild(back);
}

/* ---------------------------------------------------------------- eylemler */

Object.assign(ctx.actions, {
  "st-filter": (el) => { storyState.filter = el.dataset.v; ctx.rerender(); },
  "story-read": (el) => openDetail(el.dataset.id),
  "reader-close": closeReader,
  "reader-detail": () => { stopListening(); openDetail(reader.story.id); },
  "reader-start": () => { stopListening(); renderReader(); },
  "reader-start-listen": () => { renderReader(); listenFrom(0); },
  "reader-listen": () => { if (reader.listening) { stopListening(); renderReader(); } else { renderReader(); listenFrom(Math.max(0, reader.idx)); } },
  "reader-font": () => { reader.font = (reader.font + 1) % FONTS.length; renderReader(); },
  "reader-tr": () => { reader.trAll = !reader.trAll; renderReader(); },
  "sent-tr": (el) => { const i = Number(el.dataset.i); reader.trOpen.has(i) ? reader.trOpen.delete(i) : reader.trOpen.add(i); refreshSentences(); },
  "sent-play": (el) => { const i = Number(el.dataset.i); if (reader.listening && reader.idx === i) { stopListening(); refreshSentences(); } else listenFrom(i); },
  "reader-fav": () => {
    const f = ctx.store.state.stories.fav, id = reader.story.id;
    if (f[id]) delete f[id]; else f[id] = 1;
    ctx.store.save(); openDetail(id);
  },
  "reader-done": () => {
    const s = reader.story, st = ctx.store.state, today = dayNumber();
    st.stories.read[s.id] = today;
    st.stats.storyDay = today;
    st.stats.xp += 15;
    ctx.store.recordAnswer({ ok: true, xp: 0 }, today); // seri için
    ctx.store.save();
    ctx.toast("+15 XP · Hikâye tamamlandı!");
    closeReader();
  },
  tok: (el) => tokenSheet(el.dataset.w, el.dataset.t),
  "tok-close": () => { const s = document.getElementById("tok-sheet"); if (s) s.remove(); },
  "target-open": () => targetSheet(),
  "target-add-all": () => {
    const tw = targetWords(reader.story), today = dayNumber();
    tw.forEach((w) => { ctx.store.state.prog[w.word] = newProgress(today); });
    ctx.store.save();
    ctx.toast(`${tw.length} kelime öğrenme listene eklendi.`);
    const s = document.getElementById("tok-sheet"); if (s) s.remove();
    openDetail(reader.story.id);
  },
  "tok-add": (el) => {
    const w = el.dataset.w;
    ctx.store.state.prog[w] = newProgress(dayNumber());
    ctx.store.save();
    ctx.toast(`“${w}” sözlüğüne eklendi.`);
    const s = document.getElementById("tok-sheet"); if (s) s.remove();
    if (reader.story && document.getElementById("reader-text")) refreshSentences();
  },
  "gen-open": () => { storyState.gen.error = ""; openGenerator(); },
  "gen-settings": () => { document.getElementById("modal")?.remove(); ctx.go("settings"); },
  "gen-src": (el) => { storyState.gen.source = el.dataset.v; openGenerator(); },
  "gen-tr": () => { storyState.gen.showTr = !storyState.gen.showTr; openGenerator(); },
  "gen-say": () => storyState.gen.story && say(storyState.gen.story.en.replace(/\*\*/g, "")),
  "gen-go": async () => {
    const st = ctx.store.state, g = storyState.gen;
    const words = pickStoryWords(st.prog, ctx.index, g.source, 8, dayNumber());
    g.loading = true; g.error = ""; openGenerator();
    try {
      const lv = st.settings.levels[st.settings.levels.length - 1] || "a2";
      g.story = await generateStory({ apiKey: st.settings.apiKey, model: st.settings.model, words, level: lv });
      g.showTr = false;
    } catch (e) { g.error = e.message || "Hikâye üretilemedi."; }
    g.loading = false;
    if (document.getElementById("modal")) openGenerator();
  },
});

document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "sq") {
    storyState.q = e.target.value;
    const pos = e.target.selectionStart;
    ctx.rerender();
    const n = document.getElementById("sq");
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  }
});
