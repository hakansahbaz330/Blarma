// Uygulama kabuğu: 4 sekme (Öğren, Pratik yap, Hikâyeler, İlerleme) + kelime listesi ve ayarlar.
import { ctx } from "./ctx.js";
import { createStore } from "./store.js";
import { toWordObjects, buildIndex, posLabel, shortMeaning, clozeParts } from "./exercises.js";
import { LEVELS, STAGES, dueWords, isLeech, isLasting, forecast, newProgress, memoryStrength, stageIndex, retrievability } from "./srs.js";
import { dayNumber, escapeHtml as h, foldTurkish, shuffle } from "./util.js";
import { icons, plants, brandMark } from "./icons.js";
import { englishVoices, caps as speechCaps } from "./speech.js";
import { startSession, startPlacement, say } from "./sessionui.js";
import { planNew } from "./session.js";
import { startSlideshow } from "./slideshow.js";
import { openMeditation } from "./meditation.js";
import { startRecorder, recordingSupported } from "./recorder.js";
import { storiesView, storyOfTheDay, storyReadToday, openReader } from "./storiesui.js";
import { DEFAULT_MODEL } from "./stories.js";
import { tileHtml, hasEmoji, hasArt, fieldChip } from "./visuals.js";
import { hashKey } from "./srs.js";

const store = createStore();
ctx.store = store;
const baseWords = toWordObjects(window.KB_WORDS || []);

function rebuild() {
  const custom = store.state.custom.map((c) => ({ word: c.word, level: "k", pos: c.pos || "n", tr: c.tr, example: c.example || "", exampleTr: "" }));
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
  const plan = planNew(store, today);
  const left = Math.max(0, goal - ds.n);
  const newDone = left === 0 && c.learning === 0;
  return { today, ds, due, c, goal, plan, leftNew: plan.count, newDone, held: !newDone && plan.count === 0 && left > 0,
    reviewDone: due === 0, storyDone: storyReadToday(today) };
}

function wordsOfTheDay(today) {
  const levels = store.state.settings.levels;
  const fresh = (w) => hasEmoji(w.word) && !store.state.prog[w.word];
  const pick = (list) => list.slice().sort((a, b) => hashKey(a.word, today) - hashKey(b.word, today)).slice(0, 6);
  // Aynı görsel dilde kalmak için önce çizimi olan kelimeler, yetmezse emojili olanlar.
  for (const pool of [ctx.words.filter((w) => levels.includes(w.level) && fresh(w) && hasArt(w.word)), ctx.words.filter((w) => fresh(w) && hasArt(w.word)), ctx.words.filter((w) => levels.includes(w.level) && fresh(w)), ctx.words.filter(fresh)]) {
    if (pool.length >= 6) return pick(pool);
  }
  return pick(ctx.words.filter(fresh));
}

function planRow({ title, sub, done, action, held }) {
  return `<button class="plan-row ${done ? "done" : ""}" data-a="${action}">
    <span class="plan-mark" aria-hidden="true">${done ? icons.check2 : ""}</span>
    <span class="grow"><b>${title}</b><span class="tsub">${sub}</span></span>
    ${done ? "" : icons.chevronRight}
  </button>`;
}

function ringSvg(pct, label, sub) {
  const r = 38, c = 2 * Math.PI * r;
  return `<div class="ring2" role="img" aria-label="${label}">
    <svg viewBox="0 0 96 96" width="96" height="96"><circle cx="48" cy="48" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="9"/>
      <circle cx="48" cy="48" r="${r}" fill="none" stroke="var(--primary)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(c * pct) / 100} ${c}" transform="rotate(-90 48 48)"/></svg>
    <div><b>${label}</b><small>${sub}</small></div></div>`;
}

function memoryStrip(today) {
  const m = memoryStrength(store.state.prog, today);
  const lasting = Object.values(store.state.prog).filter(isLasting).length;
  if (m == null) {
    return `<button class="mem-strip" data-a="nav" data-v="progress"><span class="mem-icon">${plants[0](34)}</span><span class="grow"><b>Hafıza bahçen</b><span class="tsub">İlk kelimelerini öğrenince burada büyür.</span></span>${icons.chevronRight}</button>`;
  }
  return `<button class="mem-strip" data-a="nav" data-v="progress"><span class="mem-icon">${plants[lasting ? 3 : 2](34)}</span><span class="grow"><b>Hafıza gücü %${Math.round(m * 100)}</b><span class="tsub">Öğrendiğin kelimeleri şu an hatırlama olasılığın${lasting ? ` · ${lasting} kelime kalıcı` : ""}</span></span>${icons.chevronRight}</button>`;
}

function learnView() {
  const st = store.state;
  const d = dailyState();
  const streak = store.currentStreak(d.today);
  const allDone = (d.newDone || d.held) && d.reviewDone && d.storyDone;
  const sod = storyOfTheDay(d.today);
  const wod = wordsOfTheDay(d.today);
  const todoNew = d.leftNew + d.c.learning;
  const total = d.ds.r + d.due + d.ds.n + todoNew;
  const done = d.ds.r + d.ds.n;
  const pct = total ? Math.round((100 * done) / total) : 100;
  const mins = Math.max(1, Math.round((d.due * 12 + todoNew * 28) / 60));
  const note = d.plan.reason === "backlog"
    ? "Bekleyen tekrarlar biriktiği için bugün yeni kelimeyi azalttık. Önce eskileri pekiştirmek kalıcılığı artırır."
    : d.plan.reason === "accuracy" ? "Son tekrarlarda zorlandığın için bugün yeni kelimeyi azalttık." : "";
  return `
    <div class="topbar">
      <div class="brand">${brandMark(30)}<span>Kelime Bahçesi</span></div>
      <div class="row">
        <span class="chip streak big" title="Üst üste çalışılan gün">${small(icons.flame)} ${streak}</span>
        <button class="avatar" data-a="go-settings" aria-label="Ayarlar">${icons.gear}</button>
      </div>
    </div>
    <section class="card plan">
      <div class="plan-head">
        ${ringSvg(pct, allDone ? "Tamam" : `%${pct}`, allDone ? "bugün için" : `≈ ${mins} dk`)}
        <div class="grow">
          <h1 class="plan-title">${allDone ? "Bugünlük bu kadar" : "Bugünkü plan"}</h1>
          <p class="muted">${allDone ? "Kelimelerin dinleniyor; uyku, hafızayı pekiştirir." : `${d.due} tekrar · ${todoNew} yeni kelime`}</p>
        </div>
      </div>
      ${note ? `<p class="plan-note">${note}</p>` : ""}
      <div class="plan-list">
        ${planRow({ title: "Tekrar", sub: d.reviewDone ? "Bugün tekrar yok" : `${d.due} kelime unutmaya yaklaştı`, done: d.reviewDone, action: "task-review" })}
        ${planRow({ title: "Yeni kelimeler", sub: d.newDone ? `${d.goal} kelime tamam` : d.held ? "Önce tekrarlar" : `${d.ds.n}/${d.goal}${d.c.learning ? ` · ${d.c.learning} yarım kalan` : ""}`, done: d.newDone, action: "task-new" })}
        ${planRow({ title: "Günün hikâyesi", sub: sod ? h(sod.title) : "Yakında", done: d.storyDone, action: "task-story" })}
      </div>
      ${allDone
        ? `<button class="btn block" data-a="more-tasks">Yine de biraz daha çalış</button>`
        : `<button class="btn primary block lg3d" data-a="start-daily">${d.ds.q ? "Devam et" : "Başla"}</button>`}
    </section>
    ${memoryStrip(d.today)}
    ${!st.placed ? `<section class="card row" style="margin-top:12px">
        <div class="grow"><b>Seviyeni ölçelim mi?</b><div class="muted" style="font-size:14px">Yaklaşık 3 dakika; bildiğin kelimeleri atla.</div></div>
        <button class="btn soft" data-a="placement">Teste başla</button></section>` : ""}
    <h2 class="sec">Bugün tanışabileceğin kelimeler</h2>
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
  { id: "mix", main: true, icon: icons.shuffle, tone: "orange", title: "Karma pratik", sub: "Her türden 10 soru", min: 4 },
  { id: "meditate", icon: icons.sparkles, tone: "purple", title: "Meditasyon", sub: "Sakin bir ortamda, sesli kelime turu", min: 3 },
  { id: "slides", icon: icons.slides, tone: "green", title: "Slayt gösterisi", sub: "Kelimeleri sesli, otomatik izle", min: 2 },
  { id: "listen", main: true, icon: icons.headphones, tone: "blue", title: "Dinleme", sub: "Duyduğun kelimeyi ya da görseli seç", type: "listen_mcq", min: 4, needAudio: true },
  { id: "speak", icon: icons.mic, tone: "pink", title: "Telaffuz", sub: "Yüksek sesle söyle", type: "speak", min: 3, needSpeech: true },
  { id: "record", icon: icons.mic, tone: "red", title: "Ses kayıt", sub: "Kendi sesini kaydet ve karşılaştır", min: 2, needRecorder: true },
  { id: "write", main: true, icon: icons.pencil, tone: "amber", title: "Yazma", sub: "Türkçesinden İngilizcesini yaz", type: "type_en", min: 3 },
  { id: "dictation", icon: icons.speaker, tone: "indigo", title: "Dikte", sub: "Duyduğunu yaz", type: "dictation", min: 3, needAudio: true },
  { id: "visual", main: true, icon: icons.eye, tone: "teal", title: "Görsel testi", sub: "Görsele bakıp kelimeyi seç", type: "emoji_mcq", min: 4, needEmoji: true },
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
    <div class="page-head"><h1>Pratik</h1></div>
    <div class="field"><label>Hangi kelimelerle? <span class="muted">(${n} kelime)</span></label>
      <div class="seg">${src("learned", "Öğrendiklerim")}${src("hard", "Zor kelimelerim")}${src("fav", "Favorilerim")}</div></div>
    <div class="field"><label>Tur uzunluğu</label><div class="seg">${[10, 15, 20].map((n) => `<button data-a="set" data-k="practiceCount" data-v="${n}" aria-pressed="${store.state.settings.practiceCount === n}">${n} soru</button>`).join("")}</div></div>
    <div class="stack">
      ${PRACTICE.filter((p) => p.main).map((p) => `<button class="plist-row" data-a="pr:${p.id}"><span class="ticon">${p.icon}</span><span class="grow"><b>${p.title}</b><span class="tsub">${p.sub}</span></span>${icons.chevronRight}</button>`).join("")}
    </div>
    <details class="more-modes"><summary>Diğer pratik türleri</summary>
      <div class="stack">
        ${PRACTICE.filter((p) => !p.main).map((p) => `<button class="plist-row" data-a="pr:${p.id}"><span class="ticon">${p.icon}</span><span class="grow"><b>${p.title}</b><span class="tsub">${p.sub}</span></span>${icons.chevronRight}</button>`).join("")}
      </div>
    </details>
    <p class="muted" style="font-size:13px;margin-top:14px">Pratik ekstra çalışmadır; tekrar zamanlamanı değiştirmez. Kalıcı öğrenme için günlük planı tamamla.</p>`;
}

/* ------------------------------------------------------------------- İLERLEME */

function howItWorksModal() {
  modal(`
    <div class="row between"><h2>Nasıl öğretiyoruz?</h2><button class="icon-btn" data-a="close-modal" aria-label="Kapat">${icons.close}</button></div>
    <div class="stack how">
      <div><b>1. Hatırlamaya çalışırsın</b><p class="muted">Cevabı görmeden önce düşünürsün. Hatırlamaya çalışmak, tekrar tekrar okumaktan çok daha güçlü bir öğrenme yoludur.</p></div>
      <div><b>2. Unutmaya yaklaşırken tekrar edersin</b><p class="muted">Her kelime için ne kadar dayanacağını tahmin ederiz. Tam unutacakken sorulan kelime, hafızada daha derin iz bırakır. İlk tekrar ertesi gün gelir; uykudan sonra pekişir.</p></div>
      <div><b>3. Aralıklar uzar</b><p class="muted">Doğru bildikçe bir sonraki tekrar günlerden haftalara, aylara kayar. Unutursan kelime yeniden sık gelir.</p></div>
      <div><b>4. Zorlandıkça farklı yoldan döneriz</b><p class="muted">Önce seçenekli sorular, sonra yazarak hatırlama gelir. Dinleme, görsel ve örnek cümle aynı kelimeyi farklı kapılardan hatırlatır.</p></div>
      <div><b>5. Seni boğmayız</b><p class="muted">Tekrarlar birikirse yeni kelime azalır. Günlük hedef küçüktür; her gün azıcık, ara sıra çok olandan iyidir.</p></div>
      <p class="muted" style="font-size:13px">Tahminler genel araştırma bulgularına dayanır; kişisel verinle yeniden ayarlanmaz. "Hafıza gücü" bir ölçüm değil, bir tahmindir.</p>
    </div>`);
}

function progressView() {
  const st = store.state;
  const today = dayNumber();
  const c = counts();
  const levels = st.settings.levels;
  const inScope = ctx.words.filter((w) => levels.includes(w.level) || w.level === "k");
  const learnedInScope = inScope.filter((w) => cardState(w.word) >= 2).length;
  const stageCounts = [0, 0, 0, 0];
  let dueSoon = 0;
  for (const w of Object.keys(st.prog)) {
    if (!ctx.index.byWord.has(w)) continue;
    const card = st.prog[w];
    const i = stageIndex(card);
    if (i >= 0) stageCounts[i]++;
    if (card.s === 2 && card.due <= today) dueSoon++;
  }
  const strength = memoryStrength(st.prog, today);
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
  const row = (label, n, status) => `<button class="stat-row-item" data-a="prog-open" data-v="${status}"><span class="grow">${label}</span><b class="${n ? "" : "zero"}">${n}</b>${icons.chevronRight}</button>`;
  return `
    <div class="page-head"><h1>Bahçem</h1><button class="btn ghost sm" data-a="how">Nasıl çalışıyor?</button></div>
    <section class="card garden">
      <div class="garden-top">
        <div><div class="big-num">${strength == null ? "–" : "%" + Math.round(strength * 100)}</div><div class="muted">hafıza gücü</div></div>
        <p class="muted garden-note">${strength == null ? "Kelime öğrenmeye başlayınca bahçen burada büyür." : dueSoon ? `<b>${dueSoon}</b> kelime unutmaya yaklaştı. Şimdi tekrar etmek en verimli an.` : "Şu an hiçbir kelime unutmaya yaklaşmadı."}</p>
      </div>
      <div class="stages">${STAGES.map((sg, i) => `<div class="stage"><span class="stage-plant">${plants[i](46)}</span><b class="${stageCounts[i] ? "" : "zero"}">${stageCounts[i]}</b><span class="stage-l">${sg.label}</span><span class="stage-h">${sg.hint}</span></div>`).join("")}</div>
      ${dueSoon ? `<button class="btn primary block" data-a="task-review">Şimdi tekrar et (${dueSoon})</button>` : ""}
    </section>
    <section class="card list-card" style="margin-top:12px">
      ${row("Öğrendiğim kelimeler", c.learning + c.review, "learning")}
      ${row("Zor kelimeler", c.leech, "leech")}
      ${row("Bildiğim kelimeler", c.known, "known")}
      ${row("Favori kelimeler", c.fav, "fav")}
    </section>
    <button class="search-fake" data-a="prog-open" data-v="all" data-focus="1"><span>Kelime ara…</span>${icons.search}</button>
    <div class="stat-row" style="margin-top:12px">
      <div class="stat"><b>${store.currentStreak(today)}</b><span>günlük seri</span></div>
      <div class="stat"><b>${st.stats.best}</b><span>en uzun seri</span></div>
      <div class="stat"><b>${learnedInScope}<small>/${inScope.length}</small></b><span>seçili seviyede</span></div>
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
  const today = dayNumber();
  const si = stageIndex(c);
  let memLine = ["Henüz öğrenmedin", "Öğreniliyor", "", "Biliyorum"][s];
  if (c && c.s === 2) {
    const r = Math.round(retrievability(c, today) * 100);
    const days = c.due - today;
    memLine = `${STAGES[si].label} · şu an hatırlama olasılığın %${r} · ${days <= 0 ? "tekrar zamanı geldi" : `sonraki tekrar ${days} gün sonra`}`;
  }
  const note = store.state.notes[word] || "";
  modal(`
    <div class="row between"><span class="row" style="gap:6px;flex-wrap:wrap"><span class="chip lv lv-${w.level}">${w.level === "k" ? "Kendi" : w.level.toUpperCase()}</span>${fieldChip(w.word)}</span>
      <button class="icon-btn" data-a="close-modal" aria-label="Kapat">${icons.close}</button></div>
    <div style="text-align:center" class="stack">
      <div style="display:flex;justify-content:center">${tileHtml(w, "xl")}</div>
      <div style="font-size:40px;font-weight:800" lang="en">${h(w.word)}</div>
      <div class="muted">${h(posLabel(w.pos))}</div>
      <button class="icon-btn" style="margin:0 auto" data-a="say" data-t="${h(w.word)}" aria-label="Dinle">${icons.speaker}</button>
      <ul style="list-style:none;padding:0;margin:0;font-size:22px;font-weight:700">${w.tr.map((m) => `<li>${h(m)}</li>`).join("")}</ul>
      ${w.example ? `<div class="card" lang="en"><i>${h(w.example)}</i> <button class="icon-btn" data-a="say" data-t="${h(w.example)}" aria-label="Cümleyi dinle">${icons.speaker}</button>${w.exampleTr ? `<div class="muted" style="margin-top:4px" lang="tr">${h(w.exampleTr)}</div>` : ""}</div>` : ""}
      <p class="memline muted">${si >= 0 ? `<span class="memplant">${plants[si](30)}</span>` : ""}<span>${memLine}${c && c.lapses ? ` · ${c.lapses} kez unutuldu` : ""}</span></p>
      ${isLeech(c) ? `<p class="plan-note" style="text-align:left">Bu kelime seni zorluyor. Aşağıya kendine ait bir hatırlatıcı yaz: bir resim, bir benzetme ya da kendi cümlen. Kişisel bağlar, kelimeyi daha iyi tutar.</p>` : ""}
      <div class="field" style="text-align:left"><label for="w-note">Kendi hatırlatıcın</label>
        <textarea id="w-note" data-word="${h(word)}" rows="2" maxlength="200" placeholder="Bu kelimeyi sana ne hatırlatıyor? (örn: kendi cümlen, benzer bir Türkçe ses)">${h(note)}</textarea></div>
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
        <div class="field"><label>Tekrar sıklığı</label>${seg("retention", [[0.85, "Rahat"], [0.9, "Dengeli"], [0.95, "Sıkı"]])}
          <span class="muted" style="font-size:13px">Sıkı: kelimeleri daha az unutursun ama daha çok tekrar edersin. Rahat: daha az tekrar, biraz daha çok unutma. Çoğu kişi için Dengeli yeterlidir.</span></div>
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
        <p class="muted">Kelimeler A1–C1 arası yaklaşık seviyelere ayrılmıştır (resmî bir sınav seviyesi değildir). Türkçe karşılıklar, örnek cümleler ve hikâyeler yapay zekâ ile hazırlanmıştır; hatalı gördüğün çeviriyi “Çeviri hatalı” ile bildirebilirsin.</p>
      </section>
    </div>`;
}

/* --------------------------------------------------------------- YÖNLENDİRME */

const NAV = [
  ["learn", "Bugün", icons.home],
  ["practice", "Pratik", icons.bolt],
  ["stories", "Hikâyeler", icons.bookOpen],
  ["progress", "Bahçem", icons.sprout],
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
  how: () => howItWorksModal(),
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
    if (["goal", "rate", "maxReviews", "slideSeconds", "practiceCount", "retention"].includes(k)) v = Number(v);
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
  if (e.target && e.target.id === "w-note") {
    const word = e.target.dataset.word, v = e.target.value.trim();
    if (v) store.state.notes[word] = v; else delete store.state.notes[word];
    store.save();
    return;
  }
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
      <div style="display:flex;justify-content:center">${brandMark(56)}</div>
      <h1>Kelime Bahçesi'ne hoş geldin</h1>
      <p class="muted">Her gün birkaç kelime; unutmaya yaklaştığında tam zamanında tekrar. A1'den C1'e İngilizce kelimeleri, her biri için birkaç yaygın Türkçe karşılığıyla öğrenirsin.</p>
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
