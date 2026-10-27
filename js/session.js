// Çalışma oturumu denetleyicisi: sırayı oluşturur, cevapları puanlar, kartları günceller.
import { dayNumber } from "./util.js";
import { review, graduate, newProgress, dueWords, pickNewWords, hashKey, gradeFor, newWordBudget } from "./srs.js";
import { makeExercise, pickType } from "./exercises.js";
import { hasEmoji } from "./visuals.js";

const GROUP = 3;          // aynı anda tanıtılan yeni kelime sayısı
const RETRY_GAP = 3;      // yanlış cevaptan kaç soru sonra tekrar sorulur

/** Bugünkü yeni kelime payı: tekrarlar birikmişse ya da son günlerde başarı düşükse azaltılır. */
export function planNew(store, today = dayNumber()) {
  const st = store.state;
  const days = Array.from({ length: 5 }, (_, i) => st.stats.daily[today - i]).filter((d) => d && d.r >= 3);
  const r = days.reduce((a, d) => a + d.r, 0);
  const rok = days.reduce((a, d) => a + (d.rok || 0), 0);
  return newWordBudget({
    goal: st.settings.goal,
    doneToday: store.dayStats(today).n,
    dueCount: dueWords(st.prog, today).length,
    recentAccuracy: r >= 10 ? rok / r : null,
  });
}

export function createSession({ store, index, mode = "daily", words = null, newCount = null, forceType = null, rng = Math.random, caps = {}, today = dayNumber() }) {
  const st = store.state;
  const prog = st.prog;
  const meta = new Map();   // kelime -> {mistakes}
  const log = { answers: 0, correct: 0, learned: [], reviewed: 0, missed: new Set(), known: [], xp: 0 };
  let queue = [];
  let total = 0;
  let lastType = null;
  const inSessionNew = new Set();   // bu oturumda yeni olarak tanıtılan kelimeler

  const m = (w) => meta.get(w) || (meta.set(w, { mistakes: 0 }), meta.get(w));
  const push = (t) => { queue.push(t); total++; };

  function wordObj(w) { return index.byWord.get(w); }

  function newCandidates(count) {
    const levels = ["k", ...st.settings.levels];
    // Bu oturumda zaten sıraya alınmış kelimeleri (henüz ilerlemesi olmasa bile) tekrar seçme.
    const taken = (w) => prog[w] || inSessionNew.has(w);
    const free = Object.fromEntries(index.words.filter((w) => taken(w.word)).map((w) => [w.word, 1]));
    return pickNewWords(index.words, free, levels, count, (w) => hashKey(w, st.seed));
  }

  function queueNewGroup(list) {
    list.forEach((w) => inSessionNew.add(w.word));
    for (const w of list) push({ word: w.word, kind: "intro" });
    for (const w of list) push({ word: w.word, kind: "new", stage: 1 });
    for (const w of list) push({ word: w.word, kind: "new", stage: 2 });
  }

  if (mode === "daily" || mode === "review") {
    dueWords(prog, today)
      .filter((w) => index.byWord.has(w))
      .slice(0, st.settings.maxReviews)
      .forEach((w) => push({ word: w, kind: "review" }));
  }
  if (mode === "daily" || mode === "new") {
    const budget = newCount != null ? newCount : planNew(store, today).count;
    // Önceki oturumda başlanıp bitirilmemiş kelimeler önce gelir.
    const carry = Object.keys(prog).filter((w) => prog[w].s === 1 && index.byWord.has(w)).map(wordObj);
    const cands = [...carry, ...newCandidates(Math.max(0, budget - carry.length))];
    for (let i = 0; i < cands.length; i += GROUP) queueNewGroup(cands.slice(i, i + GROUP));
  }
  if (mode === "practice" && words) {
    words.filter((w) => index.byWord.has(w)).forEach((w) => push({ word: w, kind: "practice" }));
  }

  function requeue(t, gap = RETRY_GAP) {
    const copy = { ...t, ex: null };
    queue.splice(Math.min(gap, queue.length), 0, copy);
    total++;
  }

  function dropWord(word) {
    const before = queue.length;
    queue = queue.filter((t) => t.word !== word);
    total -= before - queue.length;
  }

  /** Şu anki görev; alıştırma gerekiyorsa tembelce üretilir. */
  function current() {
    const t = queue[0];
    if (!t) return null;
    if (t.kind === "intro" || t.ex) return t;
    const w = wordObj(t.word);
    const card = prog[t.word];
    let type;
    if (t.kind === "new") {
      type = t.stage === 1 ? "mcq_en_tr" : (caps.audio && lastType !== "listen_mcq" && rng() < 0.5 ? "listen_mcq" : "mcq_tr_en");
    } else if (t.kind === "practice" && forceType) {
      type = forceType === "listen_mcq" && hasEmoji(t.word) && rng() < 0.6 ? "listen_emoji" : forceType;
    } else if (t.kind === "relearn") {
      type = lastType === "mcq_en_tr" ? "mcq_tr_en" : "mcq_en_tr";
    } else {
      type = pickType(card, w, caps, lastType, rng);
    }
    const reps = card ? card.reps || 0 : 0;
    t.ex = makeExercise(type, w, index, rng, { clozeTyping: reps >= 4, showMeaning: reps < 6 });
    lastType = t.ex.type;
    return t;
  }

  /** Tanıtım kartı kararı: 'learn' ya da 'known'. */
  function decideIntro(decision) {
    const t = queue[0];
    if (!t || t.kind !== "intro") return;
    if (decision === "known") {
      markKnown(t.word);
    } else {
      queue.shift();
      prog[t.word] = newProgress(today);
      store.recordAnswer({ ok: true, xp: 2 }, today);
      log.xp += 2;
      store.save();
    }
  }

  /** Kelimeyi "biliyorum" olarak işaretler; bu oturumdaki kalan görevlerini siler ve yerine yeni kelime ekler. */
  function markKnown(word) {
    dropWord(word);
    prog[word] = { ...(prog[word] || newProgress(today)), s: 3, due: 0 };
    log.known.push(word);
    store.save();
    // Yeni kelime hedefi bozulmasın: bilinen kelimenin yerine bir yenisi gelir.
    if (inSessionNew.has(word) && (mode === "daily" || mode === "new")) {
      const [next] = newCandidates(1);
      if (next) queueNewGroup([next]);
    }
  }

  /** Mevcut alıştırmayı "bu kelimeyi biliyorum" diyerek geçer. */
  function skipKnown() {
    const t = queue[0];
    if (t) markKnown(t.word);
  }

  function submit({ correct, close = false, hinted = false, ms = null }) {
    const t = queue.shift();
    if (!t) return null;
    const word = t.word;
    const card = prog[word];
    const typed = t.ex && (t.ex.type === "type_en" || t.ex.type === "dictation" || (t.ex.type === "cloze" && t.ex.mode === "type"));
    log.answers++;
    if (correct) log.correct++;
    let xp = 0;
    let grade = null;

    if (t.kind === "new") {
      const mm = m(word);
      if (!correct) {
        mm.mistakes++;
        log.missed.add(word);
        requeue(t);
        store.recordAnswer({ ok: false, xp: 0 }, today);
      } else {
        xp = mm.mistakes ? 5 : 10;
        if (t.stage === 2) {
          prog[word] = graduate(card || newProgress(today), mm.mistakes + (close ? 1 : 0), today, st.settings.retention);
          log.learned.push(word);
          store.recordAnswer({ ok: true, isNew: "graduated", xp }, today);
        } else {
          store.recordAnswer({ ok: true, xp }, today);
        }
      }
    } else if (t.kind === "review") {
      log.reviewed++;
      if (!correct) {
        grade = 0;
        log.missed.add(word);
        prog[word] = review(card, 0, today, st.settings.retention);
        requeue({ word, kind: "relearn" }, 4);
      } else {
        grade = gradeFor({ correct, hinted, close, typed: !!typed, ms, reps: card.reps || 0 });
        prog[word] = review(card, grade, today, st.settings.retention);
        xp = grade === 1 ? 6 : 10;
      }
      store.recordAnswer({ ok: correct, isNew: "review", xp }, today);
    } else if (t.kind === "relearn") {
      if (!correct) requeue(t, 4);
      else xp = 3;
      store.recordAnswer({ ok: correct, xp }, today);
    } else {
      // practice: zamanlamayı değiştirmez
      if (!correct && !t.retried) requeue({ ...t, retried: true });
      else if (correct) xp = 5;
      store.recordAnswer({ ok: correct, xp }, today);
      if (!correct) log.missed.add(word);
    }
    log.xp += xp;
    store.save();
    return { xp, grade };
  }

  return {
    current, submit, decideIntro, skipKnown, markKnown,
    get remaining() { return queue.length; },
    get total() { return total; },
    get done() { return queue.length === 0; },
    progress() { return total ? Math.min(1, (total - queue.length) / total) : 1; },
    summary() { return { ...log, missed: [...log.missed], accuracy: log.answers ? log.correct / log.answers : 0 }; },
  };
}
