// Uygulama kabuğu: gezinme, ana sayfa, kelime listesi, istatistik ve ayarlar.
import { ctx } from "./ctx.js";
import { createStore } from "./store.js";
import { toWordObjects, buildIndex, posLabel, shortMeaning } from "./exercises.js";
import { LEVELS, LEVEL_LABELS, dueWords, isLeech, forecast, newProgress } from "./srs.js";
import { dayNumber, escapeHtml as h, foldTurkish } from "./util.js";
import { icons } from "./icons.js";
import { englishVoices, caps as speechCaps } from "./speech.js";
import { startSession, startPlacement, say } from "./sessionui.js";
import { pickStoryWords, generateStory, renderStoryHtml, DEFAULT_MODEL } from "./stories.js";

const store = createStore();
ctx.store = store;
const baseWords = toWordObjects(window.BLARMA_WORDS || []);

function rebuild() {
  const custom = store.state.custom.map((c) => ({ word: c.word, level: "k", pos: c.pos || "n", tr: c.tr, example: c.example || "" }));
  ctx.words = [...custom, ...baseWords];
  ctx.index = buildIndex(ctx.words);
}
rebuild();

const $app = document.getElementById("app");
const $nav = document.getElementById("nav");
const $overlay = document.getElementById("overlay");
const $toast = document.getElementById("toast");

let route = "home";
const wordsState = { q: "", level: "all", status: "all", limit: 60 };

ctx.toast = (msg) => {
  $toast.textContent = msg;
  $toast.classList.add("show");
  clearTimeout(ctx.toast.t);
  ctx.toast.t = setTimeout(() => $toast.classList.remove("show"), 2600);
};
ctx.rerender = () => render();

function applyTheme() {
  const t = store.state.settings.theme;
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}

/* -------------------------------------------------------------- yardımcılar */

function cardState(word) {
  const c = store.state.prog[word];
  return c ? c.s : 0;
}

function counts() {
  const prog = store.state.prog;
  let learning = 0, review = 0, known = 0, leech = 0, fav = 0;
  for (const w of Object.keys(prog)) {
    if (!ctx.index.byWord.has(w)) continue;
    const c = prog[w];
    if (c.s === 1) learning++;
    else if (c.s === 2) review++;
    else if (c.s === 3) known++;
    if (isLeech(c)) leech++;
    if (c.fav) fav++;
  }
  return { learning, review, known, leech, fav };
}

function download(name, text, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function modal(html, { onClose } = {}) {
  closeModal();
  const back = document.createElement("div");
  back.className = "modal-back";
  back.id = "modal";
  back.innerHTML = `<div class="modal stack" role="dialog" aria-modal="true">${html}</div>`;
  back.addEventListener("click", (e) => { if (e.target === back) closeModal(); });
  document.body.appendChild(back);
  back._onClose = onClose;
  return back;
}
function closeModal() {
  const m = document.getElementById("modal");
  if (m) { m._onClose && m._onClose(); m.remove(); }
}

/* ---------------------------------------------------------------- ana sayfa */

function homeView() {
  const st = store.state;
  const today = dayNumber();
  const ds = store.dayStats(today);
  const due = dueWords(st.prog, today).filter((w) => ctx.index.byWord.has(w)).length;
  const goal = st.settings.goal;
  const leftNew = Math.max(0, goal - ds.n);
  const c = counts();
  const pct = goal ? Math.min(100, Math.round((100 * ds.n) / goal)) : 100;
  const streak = store.currentStreak(today);
  const todo = Math.min(due, st.settings.maxReviews) + leftNew + c.learning;
  const finished = todo === 0;
  const cta = finished ? "Bugünlük tamam 🎉" : ds.q ? "Devam et" : "Çalışmaya başla";

  const lvRows = [...st.settings.levels, ...(st.custom.length ? ["k"] : [])].map((lv) => {
    const list = ctx.index.byLevel.get(lv) || [];
    const learned = list.filter((w) => cardState(w.word) >= 2).length;
    const p = list.length ? Math.round((100 * learned) / list.length) : 0;
    return `<div class="lvl-row"><span><span class="chip lv lv-${lv}">${lv === "k" ? "Kendi" : lv.toUpperCase()}</span></span><div class="bar"><i style="width:${p}%"></i></div><small>${learned}/${list.length}</small></div>`;
  }).join("");

  return `
    <div class="top">
      <div class="brand">Kelime<span>Bahçesi</span></div>
      <div class="row">
        <span class="chip streak" title="Günlük seri">${icons.flame.replace('width="22" height="22"', 'width="16" height="16"')} ${streak}</span>
        ${st.stats.freezes ? `<span class="chip" title="Seri dondurma hakkı: bir gün kaçırırsan serin korunur">${icons.snow.replace('width="22" height="22"', 'width="14" height="14"')} ${st.stats.freezes}</span>` : ""}
        <span class="chip xp">${st.stats.xp} XP</span>
      </div>
    </div>

    <section class="card stack" aria-label="Bugünün hedefi">
      <div class="hero">
        <div class="ring" style="--p:${pct}" role="img" aria-label="Günlük yeni kelime hedefi: ${ds.n} / ${goal}">
          <div><b>${Math.min(ds.n, goal)}/${goal}</b><small>yeni kelime</small></div>
        </div>
        <div class="stack">
          <div><b style="font-size:20px">${finished ? "Harika gidiyorsun!" : "Bugün için sırada"}</b></div>
          <div class="muted">${due} tekrar · ${leftNew} yeni${c.learning ? ` · ${c.learning} yarım kalan` : ""}</div>
        </div>
      </div>
      <button class="btn primary block" data-a="start-daily" ${finished ? "disabled" : ""}>${cta}</button>
      ${finished ? `<button class="btn block" data-a="start-extra">+5 yeni kelime daha</button>` : ""}
    </section>

    <div class="stat-row" style="margin-top:14px">
      <div class="stat"><b>${c.review + c.known}</b><span>öğrenilen</span></div>
      <div class="stat"><b>${c.known}</b><span>bildiğim</span></div>
      <div class="stat"><b>${c.leech}</b><span>zor kelime</span></div>
    </div>

    ${!st.placed ? `<section class="card row" style="margin-top:14px">
        <div class="grow"><b>Seviyeni ölçelim mi?</b><div class="muted" style="font-size:14px">Yaklaşık 3 dakikalık test; bildiğin kelimelerle vakit kaybetme.</div></div>
        <button class="btn soft" data-a="placement">Teste başla</button></section>` : ""}

    <h2 class="sec">Seviyelerim</h2>
    <section class="card stack">${lvRows}
      <button class="btn ghost sm" data-a="go-settings">Seviyeleri değiştir</button></section>

    <h2 class="sec">Hikâye</h2>
    <section class="card row">
      <div class="grow"><b>Kelimelerinle kısa hikâye</b><div class="muted" style="font-size:14px">Öğrendiğin kelimeleri bağlam içinde oku (yapay zekâ, isteğe bağlı).</div></div>
      <button class="btn soft" data-a="story-open">Aç</button>
    </section>

    <h2 class="sec">Pratik</h2>
    <div class="stack">
      <button class="btn block" data-a="practice-due" ${due ? "" : "disabled"}>Sadece tekrarlar (${due})</button>
      <button class="btn block" data-a="practice-leech" ${c.leech ? "" : "disabled"}>Zor kelimelerim (${c.leech})</button>
      <button class="btn block" data-a="practice-fav" ${c.fav ? "" : "disabled"}>Favorilerim (${c.fav})</button>
    </div>`;
}

/* ------------------------------------------------------------------ kelimeler */

function statusOf(w) {
  const c = store.state.prog[w.word];
  return c ? c.s : 0;
}

function filteredWords() {
  const { q, level, status } = wordsState;
  const needle = foldTurkish(q.trim());
  const prog = store.state.prog;
  return ctx.words.filter((w) => {
    if (level !== "all" && w.level !== level) return false;
    if (status !== "all") {
      const c = prog[w.word];
      const s = c ? c.s : 0;
      if (status === "new" && s !== 0) return false;
      if (status === "learning" && s !== 1 && s !== 2) return false;
      if (status === "known" && s !== 3) return false;
      if (status === "fav" && !(c && c.fav)) return false;
      if (status === "leech" && !isLeech(c)) return false;
    }
    if (needle) {
      const en = w.word.toLowerCase();
      if (!en.includes(needle) && !w.tr.some((t) => foldTurkish(t).includes(needle))) return false;
    }
    return true;
  });
}

function wordsView() {
  const list = filteredWords();
  const shown = list.slice(0, wordsState.limit);
  const lvBtn = (v, label) => `<button data-a="w-level" data-v="${v}" aria-pressed="${wordsState.level === v}">${label}</button>`;
  const stBtn = (v, label) => `<button data-a="w-status" data-v="${v}" aria-pressed="${wordsState.status === v}">${label}</button>`;
  return `
    <div class="top"><div class="brand">Kelimeler</div><button class="btn soft sm" data-a="add-word">${icons.plus} Kelime ekle</button></div>
    <div class="search">${icons.search}<input id="q" type="search" placeholder="İngilizce veya Türkçe ara…" value="${h(wordsState.q)}" aria-label="Kelime ara" autocomplete="off"></div>
    <div class="filters" role="group" aria-label="Seviye filtresi">${lvBtn("all", "Hepsi")}${LEVELS.map((l) => lvBtn(l, l.toUpperCase())).join("")}${store.state.custom.length ? lvBtn("k", "Kendi") : ""}</div>
    <div class="filters" role="group" aria-label="Durum filtresi">${stBtn("all", "Tümü")}${stBtn("new", "Yeni")}${stBtn("learning", "Öğreniyorum")}${stBtn("known", "Biliyorum")}${stBtn("fav", "Favori")}${stBtn("leech", "Zor")}</div>
    <p class="muted" style="font-size:14px;margin:4px 2px">${list.length} kelime</p>
    <div class="wlist" id="wlist">
      ${shown.map((w) => `<button class="witem" data-a="w-open" data-w="${h(w.word)}">
          <span class="dot s${statusOf(w)}" title="durum"></span>
          <span class="grow"><span class="w" lang="en">${h(w.word)}</span> <span class="chip lv lv-${w.level}" style="font-size:11px;padding:1px 7px">${w.level === "k" ? "Kendi" : w.level.toUpperCase()}</span>
          <div class="m">${h(w.tr.join(" · "))}</div></span>
          ${store.state.prog[w.word] && store.state.prog[w.word].fav ? icons.star.replace("<svg", '<svg fill="currentColor" style="color:var(--accent)"') : ""}
        </button>`).join("") || `<div class="empty">Eşleşen kelime yok.</div>`}
    </div>
    ${list.length > shown.length ? `<button class="btn block" style="margin-top:12px" data-a="w-more">Daha fazla göster (${list.length - shown.length})</button>` : ""}`;
}

function openWord(word) {
  const w = ctx.index.byWord.get(word);
  if (!w) return;
  const c = store.state.prog[word];
  const s = c ? c.s : 0;
  const stateLabel = ["Yeni", "Öğreniliyor", "Tekrar aşamasında", "Biliyorum"][s];
  const nextDue = c && c.s === 2 ? ` · sonraki tekrar: ${Math.max(0, c.due - dayNumber())} gün sonra` : "";
  modal(`
    <div class="row between"><span class="chip lv lv-${w.level}">${w.level === "k" ? "Kendi" : w.level.toUpperCase()}</span>
      <button class="icon-btn" data-a="close-modal" aria-label="Kapat">${icons.close}</button></div>
    <div style="text-align:center" class="stack">
      <div style="font-size:40px;font-weight:800" lang="en">${h(w.word)}</div>
      <div class="muted">${h(posLabel(w.pos))}</div>
      <button class="icon-btn" style="margin:0 auto" data-a="say" data-t="${h(w.word)}" aria-label="Dinle">${icons.speaker}</button>
      <ul style="list-style:none;padding:0;margin:0;font-size:22px;font-weight:700">${w.tr.map((m) => `<li>${h(m)}</li>`).join("")}</ul>
      ${w.example ? `<div class="card" style="font-style:italic" lang="en">${h(w.example)} <button class="icon-btn" data-a="say" data-t="${h(w.example)}" aria-label="Cümleyi dinle">${icons.speaker}</button></div>` : ""}
      <p class="muted">${stateLabel}${nextDue}${c && c.lapses ? ` · ${c.lapses} kez unutuldu` : ""}</p>
    </div>
    <div class="stack">
      ${s === 3 ? `<button class="btn block" data-a="w-reset" data-w="${h(word)}">Tekrar öğrenmek istiyorum</button>`
        : `<button class="btn block" data-a="w-known" data-w="${h(word)}">Bu kelimeyi biliyorum</button>`}
      ${s === 0 ? `<button class="btn soft block" data-a="w-start" data-w="${h(word)}">Öğrenme listeme ekle</button>` : ""}
      ${s === 1 || s === 2 ? `<button class="btn block" data-a="w-reset" data-w="${h(word)}">İlerlemeyi sıfırla</button>` : ""}
      <button class="btn block" data-a="w-fav" data-w="${h(word)}">${icons.star} ${c && c.fav ? "Favorilerden çıkar" : "Favorilere ekle"}</button>
      <button class="btn ghost block" data-a="s:flag" data-w="${h(word)}">${icons.flag} Çeviri hatalı</button>
      ${w.level === "k" ? `<button class="btn danger block" data-a="w-delete" data-w="${h(word)}">Bu kelimeyi sil</button>` : ""}
    </div>`);
}

function addWordModal() {
  modal(`
    <div class="row between"><h2>Kendi kelimeni ekle</h2><button class="icon-btn" data-a="close-modal" aria-label="Kapat">${icons.close}</button></div>
    <form id="add-form" class="stack" autocomplete="off">
      <div class="field"><label for="f-en">İngilizce</label><input id="f-en" required maxlength="40" lang="en" autocapitalize="none"></div>
      <div class="field"><label for="f-tr">Türkçe karşılıklar (virgülle ayır)</label><input id="f-tr" required maxlength="120" placeholder="örn: elma, meyve"></div>
      <div class="field"><label for="f-ex">Örnek cümle (isteğe bağlı)</label><input id="f-ex" maxlength="160" lang="en"></div>
      <p class="muted" id="f-err" style="color:var(--danger)"></p>
      <button class="btn primary block" type="submit">Ekle</button>
    </form>`);
  const form = document.getElementById("add-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const word = document.getElementById("f-en").value.trim();
    const tr = document.getElementById("f-tr").value.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    const example = document.getElementById("f-ex").value.trim();
    const err = document.getElementById("f-err");
    if (!word || !tr.length) { err.textContent = "İngilizce kelime ve en az bir Türkçe karşılık gerekli."; return; }
    if (ctx.index.byWord.has(word.toLowerCase()) || ctx.index.byWord.has(word)) { err.textContent = "Bu kelime zaten listede var."; return; }
    store.state.custom.push({ word, tr: tr.slice(0, 4), example, pos: "n" });
    store.save();
    rebuild();
    closeModal();
    ctx.toast(`“${word}” eklendi. Sıradaki çalışmada ilk sırada gelecek.`);
    render();
  });
  setTimeout(() => document.getElementById("f-en").focus(), 50);
}

/* -------------------------------------------------------------------- hikâye */

let storyState = { source: "recent", loading: false, story: null, error: "", showTr: false };

function storyModal() {
  const st = store.state;
  const have = Object.values(st.prog).filter((c) => c.s === 2).length;
  const seg = (v, l) => `<button data-a="story-src" data-v="${v}" aria-pressed="${storyState.source === v}">${l}</button>`;
  const story = storyState.story;
  modal(`
    <div class="row between"><h2>Hikâye</h2><button class="icon-btn" data-a="close-modal" aria-label="Kapat">${icons.close}</button></div>
    ${!st.settings.apiKey ? `<p class="muted">Hikâye üretmek için Ayarlar'dan kendi Anthropic API anahtarını gir. Anahtar yalnızca bu cihazda saklanır.</p>
        <button class="btn soft block" data-a="story-settings">Ayarlara git</button>` : ""}
    ${have < 3 ? `<p class="muted">Önce en az 3 kelime öğren; hikâye bu kelimelerden yazılır.</p>` : ""}
    <div class="field"><label>Hangi kelimelerle?</label><div class="seg">${seg("recent", "Yeni öğrendiklerim")}${seg("hard", "Zorlandıklarım")}${seg("due", "Tekrarı yaklaşanlar")}</div></div>
    <button class="btn primary block" data-a="story-go" ${storyState.loading || !st.settings.apiKey || have < 3 ? "disabled" : ""}>${storyState.loading ? "Yazılıyor…" : story ? "Yeni hikâye yaz" : "Hikâye yaz"}</button>
    ${storyState.error ? `<p style="color:var(--danger)" role="alert">${h(storyState.error)}</p>` : ""}
    ${story ? `<article class="card stack" id="story-box">
        <h3 lang="en">${h(story.title)}</h3>
        <div class="story" lang="en">${renderStoryHtml(story.en)}</div>
        <div class="row"><button class="btn sm" data-a="story-say">${icons.speaker} Oku</button>
          <button class="btn sm" data-a="story-tr" aria-pressed="${storyState.showTr}">${storyState.showTr ? "Türkçeyi gizle" : "Türkçesini göster"}</button></div>
        ${storyState.showTr ? `<div class="story muted" lang="tr">${renderStoryHtml(story.tr, { highlight: false })}</div>` : ""}
        ${story.missing && story.missing.length ? `<p class="muted" style="font-size:13px">Not: şu kelimeler metinde işaretlenemedi: ${h(story.missing.join(", "))}</p>` : ""}
      </article>` : ""}`);
}

/* ---------------------------------------------------------------- istatistik */

function statsView() {
  const st = store.state;
  const today = dayNumber();
  const c = counts();
  const days = Array.from({ length: 14 }, (_, i) => today - 13 + i);
  const maxQ = Math.max(1, ...days.map((d) => (st.stats.daily[d] ? st.stats.daily[d].q : 0)));
  const bars = days.map((d) => {
    const x = st.stats.daily[d];
    const q = x ? x.q : 0;
    return `<div title="${q} soru"><i style="height:${Math.round((q / maxQ) * 100)}%"></i><span>${new Date((d + 0) * 86400000 + new Date().getTimezoneOffset() * 60000).getDate()}</span></div>`;
  }).join("");
  let q = 0, ok = 0;
  for (const d of days) { const x = st.stats.daily[d]; if (x) { q += x.q; ok += x.ok; } }
  const fc = forecast(st.prog, today, 7);
  const maxF = Math.max(1, ...fc);
  const fbars = fc.map((n, i) => `<div title="${n} tekrar"><i class="alt" style="height:${Math.round((n / maxF) * 100)}%"></i><span>${i === 0 ? "bugün" : "+" + i}</span></div>`).join("");
  const leechWords = Object.keys(st.prog).filter((w) => isLeech(st.prog[w]) && ctx.index.byWord.has(w)).slice(0, 12);
  const lvRows = LEVELS.map((lv) => {
    const list = ctx.index.byLevel.get(lv) || [];
    const learned = list.filter((w) => cardState(w.word) >= 2).length;
    return `<div class="lvl-row"><span><span class="chip lv lv-${lv}">${lv.toUpperCase()}</span></span><div class="bar"><i style="width:${Math.round((100 * learned) / list.length)}%"></i></div><small>${learned}/${list.length}</small></div>`;
  }).join("");
  return `
    <div class="top"><div class="brand">İstatistik</div></div>
    <div class="stat-row">
      <div class="stat"><b>${st.stats.streak && store.currentStreak() ? store.currentStreak() : 0}</b><span>günlük seri</span></div>
      <div class="stat"><b>${st.stats.best}</b><span>en uzun seri</span></div>
      <div class="stat"><b>${st.stats.xp}</b><span>toplam XP</span></div>
    </div>
    <div class="stat-row" style="margin-top:10px">
      <div class="stat"><b>${c.review + c.known}</b><span>öğrenilen kelime</span></div>
      <div class="stat"><b>${q ? Math.round((100 * ok) / q) : 0}%</b><span>14 gün doğruluk</span></div>
      <div class="stat"><b>${c.learning}</b><span>öğreniliyor</span></div>
    </div>
    <h2 class="sec">Son 14 gün (çözülen soru)</h2>
    <section class="card"><div class="bars" role="img" aria-label="Son 14 günde çözülen soru sayıları">${bars}</div></section>
    <h2 class="sec">Önümüzdeki 7 gün (planlanan tekrar)</h2>
    <section class="card"><div class="bars" role="img" aria-label="Önümüzdeki 7 gün için planlanan tekrarlar">${fbars}</div></section>
    <h2 class="sec">Seviye ilerlemesi</h2>
    <section class="card stack">${lvRows}</section>
    ${leechWords.length ? `<h2 class="sec">Zorlandığın kelimeler</h2><div class="pill-list" style="justify-content:flex-start">${leechWords.map((w) => `<button class="pill" data-a="w-open" data-w="${h(w)}"><b lang="en">${h(w)}</b>${h(shortMeaning(ctx.index.byWord.get(w), 1))}</button>`).join("")}</div>` : ""}`;
}

/* -------------------------------------------------------------------- ayarlar */

function settingsView() {
  const s = store.state.settings;
  const seg = (key, vals) => `<div class="seg" role="group">${vals.map(([v, l]) => `<button data-a="set" data-k="${key}" data-v="${v}" aria-pressed="${String(s[key]) === String(v)}">${l}</button>`).join("")}</div>`;
  const voices = englishVoices();
  return `
    <div class="top"><div class="brand">Ayarlar</div></div>
    <div class="stack">
      <section class="card stack">
        <div class="field"><label>Günlük yeni kelime hedefi</label>${seg("goal", [[5, "5"], [10, "10"], [15, "15"], [20, "20"], [30, "30"]])}</div>
        <div class="field"><label>Çalışılacak seviyeler</label>
          <div class="seg" role="group">${LEVELS.map((lv) => `<button data-a="toggle-level" data-v="${lv}" aria-pressed="${s.levels.includes(lv)}">${lv.toUpperCase()}</button>`).join("")}</div>
          <span class="muted" style="font-size:13px">Yeni kelimeler seçili seviyelerden, düşükten yükseğe doğru gelir.</span></div>
        <button class="btn soft" data-a="placement">Seviye belirleme testi yap</button>
      </section>

      <section class="card stack">
        <div class="field"><label>Aksan</label>${seg("accent", [["en-US", "Amerikan"], ["en-GB", "İngiliz"]])}</div>
        <div class="field"><label>Okuma hızı</label>${seg("rate", [[0.7, "Yavaş"], [0.9, "Normal"], [1.1, "Hızlı"]])}</div>
        ${voices.length ? `<div class="field"><label for="voice">Ses</label><select id="voice" data-a-change="voice"><option value="">Otomatik</option>${voices.map((v) => `<option value="${h(v.voiceURI)}" ${s.voice === v.voiceURI ? "selected" : ""}>${h(v.name)} (${h(v.lang)})</option>`).join("")}</select></div>` : `<p class="muted">Bu cihazda sesli okuma bulunamadı; telaffuz özellikleri kapalı.</p>`}
        <button class="btn sm" data-a="say" data-t="Hello! Let's learn some new words today.">${icons.speaker} Sesi dene</button>
        <label class="switch"><span>Sesi otomatik çal</span><input type="checkbox" data-a-change="autoplay" ${s.autoplay ? "checked" : ""}></label>
        <label class="switch"><span>Konuşma alıştırmaları ${speechCaps.speaking ? "" : "<small class='muted'>(bu tarayıcıda desteklenmiyor)</small>"}</span><input type="checkbox" data-a-change="speaking" ${s.speaking && speechCaps.speaking ? "checked" : ""} ${speechCaps.speaking ? "" : "disabled"}></label>
      </section>

      <section class="card stack">
        <div class="field"><label>Tema</label>${seg("theme", [["auto", "Otomatik"], ["light", "Açık"], ["dark", "Koyu"]])}</div>
        <div class="field"><label>Bir oturumdaki en fazla tekrar</label>${seg("maxReviews", [[20, "20"], [40, "40"], [80, "80"]])}</div>
      </section>

      <section class="card stack">
        <h3>Yapay zekâ hikâyeleri (isteğe bağlı)</h3>
        <p class="muted" style="font-size:14px">Kendi Anthropic API anahtarını girersen öğrendiğin kelimelerle hikâye üretilir. Anahtar yalnızca bu tarayıcıda saklanır ve doğrudan Anthropic'e gönderilir; sunucumuz yoktur.</p>
        <div class="field"><label for="apikey">API anahtarı</label><input id="apikey" type="password" autocomplete="off" placeholder="sk-ant-…" value="${h(s.apiKey || "")}" data-a-change="apikey"></div>
        <div class="field"><label for="model">Model</label><input id="model" value="${h(s.model || DEFAULT_MODEL)}" data-a-change="model"></div>
      </section>

      <section class="card stack">
        <h3>Verilerin</h3>
        <p class="muted" style="font-size:14px">İlerlemen yalnızca bu cihazda saklanır. Cihaz değiştirirken yedek al.</p>
        <button class="btn" data-a="export">İlerlemeyi yedekle (JSON)</button>
        <label class="btn" style="cursor:pointer">Yedekten geri yükle<input type="file" accept="application/json,.json" data-a-change="import" hidden></label>
        <button class="btn" data-a="export-flags">Hatalı çeviri bildirimlerini indir (${Object.keys(store.state.flags).length})</button>
        <button class="btn danger" data-a="reset">Tüm ilerlemeyi sil</button>
      </section>

      <section class="card" style="font-size:14px">
        <b>Hakkında</b>
        <p class="muted">Kelime listesi Oxford 3000/5000 yapısına (A1–C1) göre düzenlenmiştir. Türkçe karşılıklar ve örnek cümleler yapay zekâ ile hazırlanmıştır; hatalı gördüğün çeviriyi “Çeviri hatalı” ile bildirebilirsin.</p>
      </section>
    </div>`;
}

/* --------------------------------------------------------------- yönlendirme */

const NAV = [
  ["home", "Ana sayfa", icons.home],
  ["words", "Kelimeler", icons.book],
  ["stats", "İstatistik", icons.chart],
  ["settings", "Ayarlar", icons.gear],
];

function render() {
  applyTheme();
  const views = { home: homeView, words: wordsView, stats: statsView, settings: settingsView };
  const prevQ = document.getElementById("q");
  const hadFocus = prevQ && document.activeElement === prevQ;
  const caret = hadFocus ? prevQ.selectionStart : 0;
  $app.innerHTML = views[route]();
  $nav.innerHTML = `<div class="nav-in">${NAV.map(([id, label, icon]) => `<button data-a="nav" data-v="${id}" ${id === route ? 'aria-current="page"' : ""}>${icon}<span>${label}</span></button>`).join("")}</div>`;
  const q = document.getElementById("q");
  if (q && hadFocus) { q.focus(); q.setSelectionRange(caret, caret); }
}

function go(r) {
  route = r;
  try { sessionStorage.setItem("kb.route", r); } catch { /* yok say */ }
  window.scrollTo(0, 0);
  render();
}

/* ------------------------------------------------------------------- eylemler */

Object.assign(ctx.actions, {
  nav: (el) => go(el.dataset.v),
  "go-settings": () => go("settings"),
  say: (el) => say(el.dataset.t),
  "close-modal": () => closeModal(),
  "start-daily": () => startSession({ mode: "daily", title: "Günlük çalışma" }),
  "start-extra": () => startSession({ mode: "new", newCount: 5, title: "Ekstra kelimeler" }),
  placement: () => { closeModal(); startPlacement(); },
  "practice-due": () => startSession({ mode: "review", title: "Tekrarlar" }),
  "practice-leech": () => startSession({ mode: "practice", words: Object.keys(store.state.prog).filter((w) => isLeech(store.state.prog[w])), title: "Zor kelimeler" }),
  "practice-fav": () => startSession({ mode: "practice", words: Object.keys(store.state.prog).filter((w) => store.state.prog[w].fav), title: "Favoriler" }),
  "story-open": () => { storyState.error = ""; storyModal(); },
  "story-settings": () => { closeModal(); go("settings"); },
  "story-src": (el) => { storyState.source = el.dataset.v; storyModal(); },
  "story-tr": () => { storyState.showTr = !storyState.showTr; storyModal(); },
  "story-say": () => storyState.story && say(storyState.story.en.replace(/\*\*/g, "")),
  "story-go": async () => {
    const st = store.state;
    const words = pickStoryWords(st.prog, ctx.index, storyState.source, 8, dayNumber());
    storyState.loading = true; storyState.error = ""; storyModal();
    try {
      const lv = st.settings.levels[st.settings.levels.length - 1] || "a2";
      storyState.story = await generateStory({ apiKey: st.settings.apiKey, model: st.settings.model, words, level: lv });
      storyState.showTr = false;
    } catch (e) {
      storyState.error = e.message || "Hikâye üretilemedi.";
    }
    storyState.loading = false;
    if (document.getElementById("modal")) storyModal();
  },
  "w-level": (el) => { wordsState.level = el.dataset.v; wordsState.limit = 60; render(); },
  "w-status": (el) => { wordsState.status = el.dataset.v; wordsState.limit = 60; render(); },
  "w-more": () => { wordsState.limit += 80; render(); },
  "w-open": (el) => openWord(el.dataset.w),
  "add-word": () => addWordModal(),
  "w-known": (el) => { const w = el.dataset.w; store.state.prog[w] = { ...(store.state.prog[w] || newProgress(dayNumber())), s: 3, due: 0 }; store.save(); closeModal(); ctx.toast("Biliyorum olarak işaretlendi."); render(); },
  "w-start": (el) => { const w = el.dataset.w; store.state.prog[w] = newProgress(dayNumber()); store.save(); closeModal(); ctx.toast("Sıradaki çalışmada ilk sırada gelecek."); render(); },
  "w-reset": (el) => { delete store.state.prog[el.dataset.w]; store.save(); closeModal(); render(); },
  "w-fav": (el) => { const w = el.dataset.w; const c = store.state.prog[w] || { ...newProgress(dayNumber()), s: 1 }; c.fav = c.fav ? 0 : 1; store.state.prog[w] = c; store.save(); closeModal(); render(); },
  "w-delete": (el) => {
    const w = el.dataset.w;
    store.state.custom = store.state.custom.filter((c) => c.word !== w);
    delete store.state.prog[w];
    store.save(); rebuild(); closeModal(); render();
  },
  set: (el) => {
    const k = el.dataset.k;
    let v = el.dataset.v;
    if (["goal", "rate", "maxReviews"].includes(k)) v = Number(v);
    store.state.settings[k] = v;
    store.save();
    render();
  },
  "toggle-level": (el) => {
    const lv = el.dataset.v;
    const s = store.state.settings;
    const has = s.levels.includes(lv);
    if (has && s.levels.length === 1) { ctx.toast("En az bir seviye seçili olmalı."); return; }
    s.levels = LEVELS.filter((l) => (l === lv ? !has : s.levels.includes(l)));
    store.save();
    render();
  },
  export: () => download(`kelime-bahcesi-yedek-${new Date().toISOString().slice(0, 10)}.json`, store.exportJson()),
  "export-flags": () => download("hatali-ceviriler.json", JSON.stringify(store.state.flags, null, 2)),
  reset: () => {
    modal(`<h2>Tüm ilerleme silinsin mi?</h2><p class="muted">Bu işlem geri alınamaz. Önce yedek almanı öneririz.</p>
      <button class="btn danger block" data-a="reset-yes">Evet, her şeyi sil</button><button class="btn block" data-a="close-modal">Vazgeç</button>`);
  },
  "reset-yes": () => { store.reset(); rebuild(); closeModal(); go("home"); showOnboarding(); },
  "onb-goal": (el) => { store.state.settings.goal = Number(el.dataset.v); store.save(); document.querySelectorAll("[data-a='onb-goal']").forEach((b) => b.setAttribute("aria-pressed", String(b === el))); },
  "onb-test": () => { closeModal(); startPlacement(); },
  "onb-a1": () => { store.state.placed = true; store.state.settings.levels = ["a1", "a2"]; store.save(); closeModal(); render(); },
});

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-a]");
  if (!el || el.disabled) return;
  const fn = ctx.actions[el.dataset.a];
  if (fn) fn(el, e);
});

document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-a-change]");
  if (!el) return;
  const s = store.state.settings;
  switch (el.dataset.aChange) {
    case "voice": s.voice = el.value; break;
    case "apikey": s.apiKey = el.value.trim(); break;
    case "model": s.model = el.value.trim() || DEFAULT_MODEL; break;
    case "autoplay": s.autoplay = el.checked; break;
    case "speaking": s.speaking = el.checked; break;
    case "import": {
      const f = el.files[0];
      if (!f) return;
      f.text().then((t) => {
        try { store.importJson(t); rebuild(); ctx.toast("Yedek yüklendi."); render(); }
        catch { ctx.toast("Geçersiz yedek dosyası."); }
      });
      return;
    }
    default: return;
  }
  store.save();
});

document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "q") {
    wordsState.q = e.target.value;
    wordsState.limit = 60;
    render();
  }
});

function showOnboarding() {
  modal(`
    <div class="stack" style="text-align:center">
      <div style="font-size:52px" aria-hidden="true">🌱</div>
      <h1>Kelime Bahçesi'ne hoş geldin</h1>
      <p class="muted">Her gün birkaç kelime, doğru zamanda tekrar. Oxford A1–C1 listesinden İngilizce kelimeleri, her biri için birkaç yaygın Türkçe karşılığıyla öğren.</p>
      <div class="field" style="text-align:left"><label>Günde kaç yeni kelime?</label>
        <div class="seg">${[5, 10, 15, 20].map((n) => `<button data-a="onb-goal" data-v="${n}" aria-pressed="${store.state.settings.goal === n}">${n}</button>`).join("")}</div></div>
      <button class="btn primary block" data-a="onb-test">Seviyemi ölç (≈3 dk)</button>
      <button class="btn block" data-a="onb-a1">A1'den başla</button>
    </div>`);
}

/* --------------------------------------------------------------------- başlat */

try { route = sessionStorage.getItem("kb.route") || "home"; } catch { /* yok say */ }
if (!["home", "words", "stats", "settings"].includes(route)) route = "home";
render();
if (!store.state.placed && Object.keys(store.state.prog).length === 0) showOnboarding();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* çevrimdışı önbellek olmadan da çalışır */ });
}

window.__kb = { store, ctx, render, currentExercise: () => window.__kbExercise && window.__kbExercise() }; // hata ayıklama ve uçtan uca testler için
