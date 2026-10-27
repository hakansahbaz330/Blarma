// Uygulama kabuğu: 4 sekme (Öğren, Pratik yap, Hikâyeler, İlerleme) + kelime listesi ve ayarlar.
import { ctx } from "./ctx.js";
import { createStore } from "./store.js";
import { toWordObjects, buildIndex, posLabel, shortMeaning, clozeParts } from "./exercises.js";
import { LEVELS, dueWords, isLeech, forecast, newProgress } from "./srs.js";
import { dayNumber, escapeHtml as h, foldTurkish, shuffle } from "./util.js";
import { icons } from "./icons.js";
import { englishVoices, caps as speechCaps } from "./speech.js";
import { startSession, startPlacement, say } from "./sessionui.js";
import { startSlideshow } from "./slideshow.js";
import { openMeditation } from "./meditation.js";
import { startRecorder, recordingSupported } from "./recorder.js";
import { storiesView, storyOfTheDay, storyReadToday, openReader } from "./storiesui.js";
import { DEFAULT_MODEL } from "./stories.js";
import { tileHtml, hasEmoji } from "./visuals.js";
import { hashKey } from "./srs.js";

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
const $toast = document.getElementById("toast");

const ROUTES = ["learn", "practice", "stories", "progress", "words", "settings"];
let route = "learn";
let prevRoute = "learn";
const wordsState = { q: "", level: "all", status: "all", limit: 60 };
const practiceState = { source: "learned" };

ctx.toast = (msg) => {
  $toast.textContent = msg;
  $toast.classList.add("show");
  clearTimeout(ctx.toast.t);
  ctx.toast.t = setTimeout(() => $toast.classList.remove("show"), 2600);
};
ctx.rerender = () => render();
ctx.go = (r) => go(r);

function applyTheme() {
  const t = store.state.settings.theme;
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}

/* -------------------------------------------------------------- yardımcılar */

const small = (svg, n = 16) => svg.replace('width="22" height="22"', `width="${n}" height="${n}"`);
const cardState = (word) => { const c = store.state.prog[word]; return c ? c.s : 0; };

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

/* ------------------------------------------------------------------- ÖĞREN */

function dailyState() {
  const st = store.state;
  const today = dayNumber();
  const ds = store.dayStats(today);
  const due = dueWords(st.prog, today).filter((w) => ctx.index.byWord.has(w)).length;
  const c = counts();
  const goal = st.settings.goal;
  const leftNew = Math.max(0, goal - ds.n);
  return { today, ds, due, c, goal, leftNew,
    newDone: leftNew === 0 && c.learning === 0, reviewDone: due === 0, storyDone: storyReadToday(today) };
}

function wordsOfTheDay(today) {
  const levels = store.state.settings.levels;
  const pool = ctx.words.filter((w) => levels.includes(w.level) && hasEmoji(w.word) && !store.state.prog[w.word]);
  const fallback = pool.length >= 6 ? pool : ctx.words.filter((w) => hasEmoji(w.word) && !store.state.prog[w.word]);
  return fallback.slice().sort((a, b) => hashKey(a.word, today) - hashKey(b.word, today)).slice(0, 6);
}

function taskCard({ icon, tone, title, sub, done, action }) {
  return `<button class="task ${done ? "done" : ""}" data-a="${action}">
    <span class="ticon tone-${tone}">${icon}</span>
    <span class="grow"><b>${title}</b><span class="tsub">${sub}</span></span>
    <span class="tcheck" aria-label="${done ? "tamamlandı" : "yapılacak"}">${done ? icons.check2 : icons.chevronRight}</span>
  </button>`;
}

function learnView() {
  const st = store.state;
  const d = dailyState();
  const streak = store.currentStreak(d.today);
  const allDone = d.newDone && d.reviewDone && d.storyDone;
  const sod = storyOfTheDay(d.today);
  const accent = st.settings.accent === "en-GB" ? "🇬🇧 İngilizce (UK)" : "🇺🇸 İngilizce (US)";
  const wod = wordsOfTheDay(d.today);
  return `
    <div class="topbar">
      <button class="pill-btn" data-a="lang" aria-label="Dil">${accent} ${small(icons.chevronRight, 14).replace("<svg", '<svg style="transform:rotate(90deg)"')}</button>
      <div class="row">
        <span class="chip streak big" title="Günlük seri">${small(icons.flame)} ${streak}</span>
        <button class="avatar" data-a="go-settings" aria-label="Ayarlar ve profil">${icons.user}</button>
      </div>
    </div>
    <h1 class="page-title">${allDone ? "Tüm görevler tamamlandı 🎉" : "Bugünün görevleri"}</h1>
    <div class="stack">
      ${taskCard({ icon: icons.book, tone: "blue", title: "Yeni kelimeler öğren", sub: d.newDone ? `${d.goal}/${d.goal} tamam` : `${d.ds.n}/${d.goal} · ${d.leftNew}${d.c.learning ? " + " + d.c.learning + " yarım kalan" : ""} kaldı`, done: d.newDone, action: "task-new" })}
      ${taskCard({ icon: icons.shuffle, tone: "orange", title: "Tekrar et", sub: d.reviewDone ? "Bugün tekrar yok" : `${d.due} kelime seni bekliyor`, done: d.reviewDone, action: "task-review" })}
      ${taskCard({ icon: icons.sparkles, tone: "purple", title: "Günün hikâyesi", sub: sod ? h(sod.title) : "Yakında", done: d.storyDone, action: "task-story" })}
    </div>
    ${allDone
      ? `<div class="cta-block"><p class="muted">Daha fazla çalışmak ister misin? Ek görevler var.</p><button class="btn primary block lg3d" data-a="more-tasks">Daha fazla görev</button></div>`
      : `<button class="btn primary block lg3d" style="margin-top:16px" data-a="start-daily">${d.ds.q ? "Devam et" : "Çalışmaya başla"}</button>`}
    ${!st.placed ? `<section class="card row" style="margin-top:16px">
        <div class="grow"><b>Seviyeni ölçelim mi?</b><div class="muted" style="font-size:14px">Yaklaşık 3 dakika; bildiğin kelimeleri atla.</div></div>
        <button class="btn soft" data-a="placement">Teste başla</button></section>` : ""}
    <h2 class="sec">Günün kelimeleri</h2>
    <div class="wod">${wod.map((w) => `<button class="wod-item" data-a="w-open" data-w="${h(w.word)}">${tileHtml(w, "fill")}<span class="wod-w" lang="en">${h(w.word)}</span><span class="wod-m">${h(w.tr[0])}</span></button>`).join("")}</div>`;
}

function moreTasksSheet() {
  modal(`
    <div class="row between"><h2>Daha fazla görev</h2><button class="icon-btn" data-a="close-modal" aria-label="Kapat">${icons.close}</button></div>
    <div class="stack">
      <button class="plist-row" data-a="more-new"><span class="ticon tone-blue">${icons.book}</span><span class="grow"><b>+5 yeni kelime</b><span class="tsub">Günlük hedefin dışında</span></span>${icons.chevronRight}</button>
      <button class="plist-row" data-a="pr:mix"><span class="ticon tone-orange">${icons.shuffle}</span><span class="grow"><b>Karma pratik</b><span class="tsub">10 soru, her türden</span></span>${icons.chevronRight}</button>
      <button class="plist-row" data-a="pr:visual"><span class="ticon tone-teal">${icons.eye}</span><span class="grow"><b>Görsel testi</b><span class="tsub">Resme bakıp kelimeyi seç</span></span>${icons.chevronRight}</button>
      <button class="plist-row" data-a="more-story"><span class="ticon tone-purple">${icons.sparkles}</span><span class="grow"><b>Başka bir hikâye oku</b><span class="tsub">Kütüphaneden seç</span></span>${icons.chevronRight}</button>
    </div>`);
}

/* ---------------------------------------------------------------- PRATİK YAP */

const PRACTICE = [
  { id: "mix", icon: icons.shuffle, tone: "orange", title: "Karma pratik", sub: "Her türden 10 soru", min: 4 },
  { id: "meditate", icon: icons.sparkles, tone: "purple", title: "Meditasyon", sub: "Sakin bir ortamda, sesli kelime turu", min: 3 },
  { id: "slides", icon: icons.slides, tone: "green", title: "Slayt gösterisi", sub: "Kelimeleri sesli, otomatik izle", min: 2 },
  { id: "listen", icon: icons.headphones, tone: "blue", title: "Dinleme", sub: "Duyduğun kelimeyi ya da görseli seç", type: "listen_mcq", min: 4, needAudio: true },
  { id: "speak", icon: icons.mic, tone: "pink", title: "Telaffuz", sub: "Yüksek sesle söyle", type: "speak", min: 3, needSpeech: true },
  { id: "record", icon: icons.mic, tone: "red", title: "Ses kayıt", sub: "Kendi sesini kaydet ve karşılaştır", min: 2, needRecorder: true },
  { id: "write", icon: icons.pencil, tone: "amber", title: "Yazma", sub: "Türkçesinden İngilizcesini yaz", type: "type_en", min: 3 },
  { id: "dictation", icon: icons.speaker, tone: "indigo", title: "Dikte", sub: "Duyduğunu yaz", type: "dictation", min: 3, needAudio: true },
  { id: "visual", icon: icons.eye, tone: "teal", title: "Görsel testi", sub: "Görsele bakıp kelimeyi seç", type: "emoji_mcq", min: 4, needEmoji: true },
  { id: "translate", icon: icons.languages, tone: "orange", title: "Çeviri testi", sub: "İngilizce → Türkçe", type: "mcq_en_tr", min: 4 },
  { id: "reverse", icon: icons.languages, tone: "purple", title: "Ters çeviri", sub: "Türkçe → İngilizce", type: "mcq_tr_en", min: 4 },
  { id: "cloze", icon: icons.fill, tone: "red", title: "Cümle tamamlama", sub: "Boşluğa uyan kelimeyi bul", type: "cloze", min: 4, needCloze: true },
];

function practicePool() {
  const prog = store.state.prog;
  const src = practiceState.source;
  return Object.keys(prog).filter((w) => {
    if (!ctx.index.byWord.has(w)) return false;
    const c = prog[w];
    if (src === "hard") return isLeech(c);
    if (src === "fav") return !!c.fav;
    return c.s >= 2;
  });
}

function startPractice(id) {
  const spec = PRACTICE.find((p) => p.id === id);
  if (!spec) return;
  closeModal();
  let pool = practicePool();
  if (spec.needEmoji) pool = pool.filter(hasEmoji);
  if (spec.needCloze) pool = pool.filter((w) => clozeParts(ctx.index.byWord.get(w)));
  if (spec.needAudio && !speechCaps.audio) return ctx.toast("Bu cihazda sesli okuma yok.");
  if (spec.needRecorder && !recordingSupported()) return ctx.toast("Bu tarayıcı ses kaydını desteklemiyor.");
  if (spec.needSpeech && !speechCaps.speaking) return ctx.toast("Bu tarayıcıda konuşma tanıma desteklenmiyor (Chrome/Edge deneyin).");
  if (pool.length < spec.min) {
    const hint = spec.needEmoji ? "görseli olan " : "";
    return ctx.toast(`En az ${spec.min} ${hint}kelime gerekli (şu an ${pool.length}). Önce birkaç kelime öğren ya da kaynağı değiştir.`);
  }
  if (id === "slides") return startSlideshow(pool, spec.title);
  if (id === "meditate") return openMeditation(pool);
  if (id === "record") return startRecorder(pool);
  const sample = shuffle(pool).slice(0, store.state.settings.practiceCount);
  startSession({ mode: "practice", words: sample, forceType: spec.type || null, title: spec.title });
}

function practiceView() {
  const n = practicePool().length;
  const src = (v, l) => `<button data-a="pr-src" data-v="${v}" aria-pressed="${practiceState.source === v}">${l}</button>`;
  return `
    <div class="page-head"><h1>Pratik yap</h1></div>
    <div class="field"><label>Hangi kelimelerle? <span class="muted">(${n} kelime)</span></label>
      <div class="seg">${src("learned", "Öğrendiklerim")}${src("hard", "Zor kelimelerim")}${src("fav", "Favorilerim")}</div></div>
    <div class="field"><label>Tur uzunluğu</label><div class="seg">${[10, 15, 20].map((n) => `<button data-a="set" data-k="practiceCount" data-v="${n}" aria-pressed="${store.state.settings.practiceCount === n}">${n} soru</button>`).join("")}</div></div>
    <div class="stack">
      ${PRACTICE.map((p) => `<button class="plist-row" data-a="pr:${p.id}"><span class="ticon tone-${p.tone}">${p.icon}</span><span class="grow"><b>${p.title}</b><span class="tsub">${p.sub}</span></span>${icons.chevronRight}</button>`).join("")}
    </div>`;
}

/* ------------------------------------------------------------------- İLERLEME */

const STAGES = ["Yeni", "1 gün", "3 gün", "1 hafta", "1 ay", "4 ay"];
function stageOf(c) {
  if (c.s === 1) return 0;
  if (c.s !== 2) return -1;
  return c.iv <= 1 ? 1 : c.iv <= 3 ? 2 : c.iv <= 10 ? 3 : c.iv <= 40 ? 4 : 5;
}

function dots(n) {
  const on = (i) => (i < n ? "var(--ok)" : "var(--border)");
  return `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><circle cx="12" cy="11" r="4.5" fill="${on(0)}"/><circle cx="28" cy="11" r="4.5" fill="${on(1)}"/><circle cx="20" cy="20" r="2.5" fill="${on(2)}"/><circle cx="12" cy="29" r="4.5" fill="${on(3)}"/><circle cx="28" cy="29" r="4.5" fill="${on(4)}"/></svg>`;
}

function progressView() {
  const st = store.state;
  const today = dayNumber();
  const c = counts();
  const levels = st.settings.levels;
  const inScope = ctx.words.filter((w) => levels.includes(w.level) || w.level === "k");
  const learnedInScope = inScope.filter((w) => cardState(w.word) >= 2).length;
  const unlocked = Object.keys(st.prog).filter((w) => ctx.index.byWord.has(w)).length;
  const pct = inScope.length ? Math.floor((100 * learnedInScope) / inScope.length) : 0;
  const stageCounts = [0, 0, 0, 0, 0, 0];
  for (const w of Object.keys(st.prog)) { if (!ctx.index.byWord.has(w)) continue; const s = stageOf(st.prog[w]); if (s >= 0) stageCounts[s]++; }
  const days = Array.from({ length: 14 }, (_, i) => today - 13 + i);
  const maxQ = Math.max(1, ...days.map((d) => (st.stats.daily[d] ? st.stats.daily[d].q : 0)));
  const bars = days.map((d) => {
    const q = st.stats.daily[d] ? st.stats.daily[d].q : 0;
    const label = new Date(d * 86400000 + new Date().getTimezoneOffset() * 60000).getDate();
    return `<div title="${q} soru"><i style="height:${Math.round((q / maxQ) * 100)}%"></i><span>${label}</span></div>`;
  }).join("");
  let q = 0, ok = 0;
  for (const d of days) { const x = st.stats.daily[d]; if (x) { q += x.q; ok += x.ok; } }
  const fc = forecast(st.prog, today, 7);
  const maxF = Math.max(1, ...fc);
  const fbars = fc.map((n, i) => `<div title="${n} tekrar"><i class="alt" style="height:${Math.round((n / maxF) * 100)}%"></i><span>${i === 0 ? "bugün" : "+" + i}</span></div>`).join("");
  const lvRows = LEVELS.map((lv) => {
    const list = ctx.index.byLevel.get(lv) || [];
    const learned = list.filter((w) => cardState(w.word) >= 2).length;
    return `<div class="lvl-row"><span><span class="chip lv lv-${lv}">${lv.toUpperCase()}</span></span><div class="bar"><i style="width:${Math.round((100 * learned) / list.length)}%"></i></div><small>${learned}/${list.length}</small></div>`;
  }).join("");
  const row = (icon, tone, label, n, status) => `<button class="stat-row-item" data-a="prog-open" data-v="${status}"><span class="ticon sm tone-${tone}">${icon}</span><span class="grow">${label}</span><b class="${n ? "" : "zero"}">${n}</b></button>`;
  return `
    <div class="page-head"><h1>İlerleme</h1></div>
    <section class="card hero-card">
      <div class="row between"><div><div class="hero-title">${st.settings.accent === "en-GB" ? "İngilizce (UK)" : "İngilizce (US)"}</div>
        <div class="hero-pct">${pct}%<span> tamamlandı</span></div></div><div class="hero-trophy" aria-hidden="true">🏆</div></div>
      <div class="bar" style="margin:10px 0 8px" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(pct, learnedInScope ? 2 : 0)}%"></i></div>
      <p class="muted" style="font-size:14px">Seçili seviyelerdeki <b>${inScope.length}</b> kelimeden <b style="color:var(--ok)">${learnedInScope}</b> tanesini öğrendin; toplam <b>${unlocked}</b> kelimenin kilidini açtın.</p>
    </section>
    <section class="card list-card" style="margin-top:14px">
      ${row(icons.bolt, "blue", "Öğrendiğim kelimeler", c.learning + c.review, "learning")}
      ${row(icons.flag, "red", "Zor kelimeler", c.leech, "leech")}
      ${row(icons.check2, "green", "Bildiğim kelimeler", c.known, "known")}
      ${row(icons.star, "amber", "Favori kelimeler", c.fav, "fav")}
    </section>
    <button class="search-fake" data-a="prog-open" data-v="all" data-focus="1"><span>Ara…</span>${icons.search}</button>
    <h2 class="sec">Aralıklı tekrar</h2>
    <section class="card"><div class="stages">${STAGES.map((l, i) => `<div class="stage"><span class="stage-l">${l}</span>${dots(i === 0 ? 0 : i)}<b class="${stageCounts[i] ? "" : "zero"}">${stageCounts[i]}</b></div>`).join("")}</div>
      <p class="muted" style="font-size:13px;margin-top:10px">Bir kelimeyi doğru bildikçe sağa ilerler; unutursan başa döner.</p></section>
    <div class="stat-row" style="margin-top:14px">
      <div class="stat"><b>${store.currentStreak(today)}</b><span>günlük seri</span></div>
      <div class="stat"><b>${st.stats.best}</b><span>en uzun seri</span></div>
      <div class="stat"><b>${st.stats.xp}</b><span>toplam XP</span></div>
    </div>
    <h2 class="sec">Son 14 gün · %${q ? Math.round((100 * ok) / q) : 0} doğruluk</h2>
    <section class="card"><div class="bars" role="img" aria-label="Son 14 günde çözülen soru sayıları">${bars}</div></section>
    <h2 class="sec">Önümüzdeki 7 gün · planlanan tekrar</h2>
    <section class="card"><div class="bars" role="img" aria-label="Önümüzdeki 7 gün için planlanan tekrarlar">${fbars}</div></section>
    <h2 class="sec">Seviyelere göre</h2>
    <section class="card stack">${lvRows}</section>
    <button class="btn block" style="margin-top:14px" data-a="prog-open" data-v="all">Tüm kelimeler</button>`;
}

/* ------------------------------------------------------------------ KELİMELER */

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
    <div class="page-head"><button class="icon-btn" data-a="back-progress" aria-label="Geri">${icons.chevronLeft}</button><h1 class="grow">Kelimeler</h1>
      <button class="btn soft sm" data-a="add-word">${icons.plus} Ekle</button></div>
    <div class="search">${icons.search}<input id="q" type="search" placeholder="İngilizce veya Türkçe ara…" value="${h(wordsState.q)}" aria-label="Kelime ara" autocomplete="off"></div>
    <div class="filters" role="group" aria-label="Seviye filtresi">${lvBtn("all", "Hepsi")}${LEVELS.map((l) => lvBtn(l, l.toUpperCase())).join("")}${store.state.custom.length ? lvBtn("k", "Kendi") : ""}</div>
    <div class="filters" role="group" aria-label="Durum filtresi">${stBtn("all", "Tümü")}${stBtn("new", "Yeni")}${stBtn("learning", "Öğrendiğim")}${stBtn("known", "Biliyorum")}${stBtn("fav", "Favori")}${stBtn("leech", "Zor")}</div>
    <p class="muted" style="font-size:14px;margin:4px 2px">${list.length} kelime</p>
    <div class="wlist" id="wlist">
      ${shown.map((w) => `<button class="witem" data-a="w-open" data-w="${h(w.word)}">
          ${tileHtml(w, "sm")}
          <span class="grow"><span class="w" lang="en">${h(w.word)}</span> <span class="chip lv lv-${w.level}" style="font-size:11px;padding:1px 7px">${w.level === "k" ? "Kendi" : w.level.toUpperCase()}</span>
          <div class="m">${h(w.tr.join(" · "))}</div></span>
          ${wordsState.status === "known" ? `<span class="x-btn" role="button" tabindex="0" data-a="w-unknown" data-w="${h(w.word)}" aria-label="Bildiklerimden çıkar">${icons.x}</span>` : `<span class="dot s${cardState(w.word)}" title="durum"></span>`}
          ${store.state.prog[w.word] && store.state.prog[w.word].fav ? small(icons.star, 18).replace("<svg", '<svg fill="currentColor" style="color:var(--accent)"') : ""}
        </button>`).join("") || `<div class="empty">Eşleşen kelime yok.</div>`}
    </div>
    ${list.length > shown.length ? `<button class="btn block" style="margin-top:12px" data-a="w-more">Daha fazla göster (${list.length - shown.length})</button>` : ""}
    ${wordsState.status !== "all" && list.length >= 4 ? `<button class="fab-bottom btn primary lg3d" data-a="list-practice">Pratik yap (${Math.min(list.length, store.state.settings.practiceCount)})</button>` : ""}`;
}

function openWord(word) {
  const w = ctx.index.byWord.get(word);
  if (!w) return;
  const c = store.state.prog[word];
  const s = c ? c.s : 0;
  const stateLabel = ["Yeni", "Öğreniliyor", "Tekrar aşamasında", "Biliyorum"][s];
  const nextDue = c && c.s === 2 ? ` · sonraki tekrar ${Math.max(0, c.due - dayNumber())} gün sonra` : "";
  modal(`
    <div class="row between"><span class="chip lv lv-${w.level}">${w.level === "k" ? "Kendi" : w.level.toUpperCase()}</span>
      <button class="icon-btn" data-a="close-modal" aria-label="Kapat">${icons.close}</button></div>
    <div style="text-align:center" class="stack">
      <div style="display:flex;justify-content:center">${tileHtml(w, "xl")}</div>
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
  document.getElementById("add-form").addEventListener("submit", (e) => {
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

/* -------------------------------------------------------------------- AYARLAR */

function settingsView() {
  const s = store.state.settings;
  const seg = (key, vals) => `<div class="seg" role="group">${vals.map(([v, l]) => `<button data-a="set" data-k="${key}" data-v="${v}" aria-pressed="${String(s[key]) === String(v)}">${l}</button>`).join("")}</div>`;
  const voices = englishVoices();
  return `
    <div class="page-head"><button class="icon-btn" data-a="back" aria-label="Geri">${icons.chevronLeft}</button><h1 class="grow">Ayarlar</h1></div>
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
        <div class="field"><label>Yazma alıştırmaları</label>${seg("writeMode", [["tiles", "Harf kutuları"], ["keyboard", "Klavye"]])}</div>
        <div class="field"><label>Slayt gösterisi hızı</label>${seg("slideSeconds", [[4, "Hızlı"], [6, "Normal"], [9, "Yavaş"]])}</div>
        ${voices.length ? `<div class="field"><label for="voice">Ses</label><select id="voice" data-a-change="voice"><option value="">Otomatik</option>${voices.map((v) => `<option value="${h(v.voiceURI)}" ${s.voice === v.voiceURI ? "selected" : ""}>${h(v.name)} (${h(v.lang)})</option>`).join("")}</select></div>` : `<p class="muted">Bu cihazda sesli okuma bulunamadı; dinleme/telaffuz özellikleri kapalı.</p>`}
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
        <p class="muted">Kelime listesi Oxford 3000/5000 yapısına (A1–C1) göre düzenlenmiştir. Türkçe karşılıklar, örnek cümleler ve hikâyeler yapay zekâ ile hazırlanmıştır; hatalı gördüğün çeviriyi “Çeviri hatalı” ile bildirebilirsin.</p>
      </section>
    </div>`;
}

/* --------------------------------------------------------------- YÖNLENDİRME */

const NAV = [
  ["learn", "Öğren", icons.book],
  ["practice", "Pratik yap", icons.bolt],
  ["stories", "Hikâyeler", icons.sparkles],
  ["progress", "İlerleme", icons.chart],
];
const NAV_OF = { words: "progress", settings: "learn" };

function render() {
  applyTheme();
  const views = { learn: learnView, practice: practiceView, stories: storiesView, progress: progressView, words: wordsView, settings: settingsView };
  const prevQ = document.getElementById("q");
  const hadFocus = prevQ && document.activeElement === prevQ;
  const caret = hadFocus ? prevQ.selectionStart : 0;
  $app.innerHTML = views[route]();
  const active = NAV_OF[route] || route;
  $nav.innerHTML = `<div class="nav-in">${NAV.map(([id, label, icon]) => `<button data-a="nav" data-v="${id}" ${id === active && route !== "settings" ? 'aria-current="page"' : ""}>${icon}<span>${label}</span></button>`).join("")}</div>`;
  const q = document.getElementById("q");
  if (q && hadFocus) { q.focus(); q.setSelectionRange(caret, caret); }
}

function go(r) {
  if (r !== route) prevRoute = route;
  route = r;
  try { sessionStorage.setItem("kb.route", r); } catch { /* yok say */ }
  window.scrollTo(0, 0);
  render();
}

/* ------------------------------------------------------------------- EYLEMLER */

Object.assign(ctx.actions, {
  nav: (el) => go(el.dataset.v),
  "go-settings": () => go("settings"),
  back: () => go(prevRoute === "settings" ? "learn" : prevRoute),
  "back-progress": () => go("progress"),
  say: (el) => say(el.dataset.t),
  lang: () => ctx.toast("Şimdilik İngilizce ↔ Türkçe. Yeni diller yolda."),
  "close-modal": () => closeModal(),
  "start-daily": () => startSession({ mode: "daily", title: "Günlük çalışma" }),
  "task-new": () => {
    const d = dailyState();
    if (d.newDone) return ctx.toast("Bugünün yeni kelimeleri tamam. “Daha fazla görev” ile devam edebilirsin.");
    startSession({ mode: "new", title: "Yeni kelimeler" });
  },
  "task-review": () => {
    if (dailyState().reviewDone) return ctx.toast("Bugün tekrar edecek kelime yok.");
    startSession({ mode: "review", title: "Tekrarlar" });
  },
  "task-story": () => { const s = storyOfTheDay(); if (s) openReader(s.id); },
  "more-tasks": () => moreTasksSheet(),
  "more-new": () => { closeModal(); startSession({ mode: "new", newCount: 5, title: "Ekstra kelimeler" }); },
  "more-story": () => { closeModal(); go("stories"); },
  placement: () => { closeModal(); startPlacement(); },
  "pr-src": (el) => { practiceState.source = el.dataset.v; render(); },
  "prog-open": (el) => { wordsState.status = el.dataset.v; wordsState.level = "all"; wordsState.q = ""; wordsState.limit = 60; go("words"); if (el.dataset.focus) setTimeout(() => document.getElementById("q") && document.getElementById("q").focus(), 30); },
  "w-level": (el) => { wordsState.level = el.dataset.v; wordsState.limit = 60; render(); },
  "w-status": (el) => { wordsState.status = el.dataset.v; wordsState.limit = 60; render(); },
  "w-more": () => { wordsState.limit += 80; render(); },
  "w-open": (el) => openWord(el.dataset.w),
  "w-unknown": (el) => { delete store.state.prog[el.dataset.w]; store.save(); ctx.toast("Bildiklerinden çıkarıldı."); render(); },
  "list-practice": () => {
    const sample = shuffle(filteredWords().map((w) => w.word)).slice(0, store.state.settings.practiceCount);
    startSession({ mode: "practice", words: sample, title: "Pratik" });
  },
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
    if (["goal", "rate", "maxReviews", "slideSeconds", "practiceCount"].includes(k)) v = Number(v);
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
  "reset-yes": () => { store.reset(); rebuild(); closeModal(); go("learn"); showOnboarding(); },
  "onb-goal": (el) => { store.state.settings.goal = Number(el.dataset.v); store.save(); document.querySelectorAll("[data-a='onb-goal']").forEach((b) => b.setAttribute("aria-pressed", String(b === el))); },
  "onb-test": () => { closeModal(); startPlacement(); },
  "onb-a1": () => { store.state.placed = true; store.state.settings.levels = ["a1", "a2"]; store.save(); closeModal(); render(); },
});
for (const p of PRACTICE) ctx.actions["pr:" + p.id] = () => startPractice(p.id);

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

/* --------------------------------------------------------------------- BAŞLAT */

try { route = sessionStorage.getItem("kb.route") || "learn"; } catch { /* yok say */ }
if (!ROUTES.includes(route)) route = "learn";
render();
if (!store.state.placed && Object.keys(store.state.prog).length === 0) showOnboarding();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* çevrimdışı önbellek olmadan da çalışır */ });
}

window.__kb = { store, ctx, render, currentExercise: () => window.__kbExercise && window.__kbExercise() };
