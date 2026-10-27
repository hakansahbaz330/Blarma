// Hikâyeler sekmesi: kütüphane, okuyucu (dokunarak çeviri), günün hikâyesi ve isteğe bağlı AI hikâye üretici.
import { ctx } from "./ctx.js";
import { icons } from "./icons.js";
import { say } from "./sessionui.js";
import { lookupToken, tokenize } from "./lemma.js";
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

function readerHtml(s) {
  const prog = ctx.store.state.prog;
  const paras = s.en.map((p, i) => {
    const toks = tokenize(p).map((t) => {
      if (!t.word) return h(t.t);
      const w = lookupToken(t.t, ctx.index.byWord);
      if (!w) return h(t.t);
      const k = prog[w.word] && prog[w.word].s >= 2 ? "known" : "unk";
      return `<button class="tok ${k}" data-a="tok" data-w="${h(w.word)}" data-t="${h(t.t)}">${h(t.t)}</button>`;
    }).join("");
    return `<div class="para"><p lang="en">${toks}</p><div class="para-tools">
        <button class="btn ghost sm" data-a="para-say" data-i="${i}">${icons.speaker} Dinle</button></div>
        ${storyState.showTr ? `<p class="tr muted" lang="tr">${h(s.tr[i])}</p>` : ""}</div>`;
  }).join("");
  return paras;
}

export function openReader(id) {
  const s = stories().find((x) => x.id === id);
  if (!s) return;
  storyState.current = s;
  const st = ctx.store.state;
  const fav = !!st.stories.fav[s.id];
  document.getElementById("overlay").innerHTML = `
    <section class="sess reader" role="dialog" aria-label="${h(s.title)}">
      <header class="sess-head">
        <button class="icon-btn" data-a="reader-close" aria-label="Geri">${icons.chevronLeft}</button>
        <h2 class="grow reader-title" lang="en">${s.emoji} ${h(s.title)}</h2>
        <button class="icon-btn" data-a="reader-fav" aria-label="Favori" aria-pressed="${fav}" style="${fav ? "color:var(--accent)" : ""}">${icons.star.replace("<svg", fav ? '<svg fill="currentColor"' : "<svg")}</button>
      </header>
      <div class="sess-body" id="reader-body">
        <div class="row" style="gap:8px;margin-bottom:10px"><span class="chip lv lv-${s.level}">${LV_NAME[s.level]}</span>
          <button class="btn sm" data-a="reader-all">${icons.speaker} Hepsini oku</button>
          <button class="btn sm" data-a="reader-tr" aria-pressed="${storyState.showTr}">${storyState.showTr ? "Türkçeyi gizle" : "Türkçesini göster"}</button></div>
        <p class="muted" style="font-size:13px;margin-bottom:10px">Bir kelimeye dokununca anlamını görürsün. <span class="tok known demo">Yeşil</span> kelimeleri zaten öğrendin.</p>
        <div id="reader-text">${readerHtml(s)}</div>
      </div>
      <footer class="sess-foot"><button class="btn primary block" data-a="reader-done">${st.stories.read[s.id] ? "Tekrar okudum ✓" : "Okudum ✓"}</button></footer>
    </section>`;
  document.body.classList.add("in-session");
}

function closeReader() {
  document.getElementById("overlay").innerHTML = "";
  document.body.classList.remove("in-session");
  storyState.current = null;
  ctx.rerender();
}

function tokenSheet(wordKey, tokenText) {
  const w = ctx.index.byWord.get(wordKey);
  if (!w) return;
  const c = ctx.store.state.prog[w.word];
  say(w.word);
  const back = document.createElement("div");
  back.className = "modal-back";
  back.style.zIndex = 80;
  back.id = "tok-sheet";
  back.innerHTML = `<div class="modal stack" role="dialog" aria-label="${h(w.word)}">
      <div class="row">${tileHtml(w, "lg")}<div class="grow"><div style="font-size:26px;font-weight:800" lang="en">${h(w.word)}</div>
        <div class="muted">${h(posLabel(w.pos))} · <span class="chip lv lv-${w.level}">${w.level.toUpperCase()}</span>${tokenText.toLowerCase() !== w.word ? ` · metinde: <i>${h(tokenText)}</i>` : ""}</div></div>
        <button class="icon-btn" data-a="say" data-t="${h(w.word)}" aria-label="Dinle">${icons.speaker}</button></div>
      <ul style="list-style:none;padding:0;margin:0;font-size:20px;font-weight:700">${w.tr.map((m) => `<li>${h(m)}</li>`).join("")}</ul>
      ${w.example ? `<div class="card" style="font-style:italic" lang="en">${h(w.example)}</div>` : ""}
      <div class="row">${!c ? `<button class="btn soft grow" data-a="tok-add" data-w="${h(w.word)}">Öğrenme listeme ekle</button>` : `<span class="muted grow">${c.s === 3 ? "Bildiğin kelime" : "Öğrenme listende"}</span>`}
        <button class="btn grow" data-a="tok-close">Kapat</button></div></div>`;
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
  "story-read": (el) => openReader(el.dataset.id),
  "reader-close": closeReader,
  "reader-tr": () => { storyState.showTr = !storyState.showTr; openReader(storyState.current.id); },
  "reader-fav": () => {
    const f = ctx.store.state.stories.fav, id = storyState.current.id;
    if (f[id]) delete f[id]; else f[id] = 1;
    ctx.store.save(); openReader(id);
  },
  "reader-all": () => say(storyState.current.en.join(" ")),
  "para-say": (el) => say(storyState.current.en[Number(el.dataset.i)]),
  "reader-done": () => {
    const s = storyState.current, st = ctx.store.state, today = dayNumber();
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
  "tok-add": (el) => {
    const w = el.dataset.w;
    ctx.store.state.prog[w] = newProgress(dayNumber());
    ctx.store.save();
    ctx.toast(`“${w}” öğrenme listene eklendi.`);
    const s = document.getElementById("tok-sheet"); if (s) s.remove();
    if (storyState.current) { const body = document.getElementById("reader-text"); if (body) body.innerHTML = readerHtml(storyState.current); }
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
