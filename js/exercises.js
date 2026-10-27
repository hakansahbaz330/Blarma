// Alıştırma üretimi ve cevap denetimi (DOM'dan bağımsız).
import { shuffle, pick, normalizeAnswer, levenshtein, escapeRegExp } from "./util.js";
import { LEVELS } from "./srs.js";
import { emojiFor, hasEmoji } from "./visuals.js";

export const POS_TR = {
  n: "isim", v: "fiil", adj: "sıfat", adv: "zarf", prep: "edat", conj: "bağlaç", pron: "zamir",
  det: "belirteç", excl: "ünlem", num: "sayı", modal: "kip fiili", aux: "yardımcı fiil",
  art: "tanımlık", inf: "mastar işareti", "ordinal number": "sıra sayısı", "linking verb": "bağlama fiili",
};

export function posLabel(pos) {
  return pos.split("/").map((p) => POS_TR[p] || p).join(" · ");
}

/** window.BLARMA_WORDS satırlarını nesnelere çevirir. */
export function toWordObjects(rows) {
  return rows.map(([word, level, pos, tr, example, exampleTr = ""]) => ({ word, level, pos, tr, example, exampleTr }));
}

export function buildIndex(words) {
  const byLevel = new Map();
  const byWord = new Map();
  for (const w of words) {
    if (!byLevel.has(w.level)) byLevel.set(w.level, []);
    byLevel.get(w.level).push(w);
    byWord.set(w.word, w);
  }
  return { words, byLevel, byWord };
}

export function shortMeaning(w, n = 2) {
  return w.tr.slice(0, n).join(" / ");
}

function overlaps(a, b) {
  const set = new Set(a.tr.map((t) => t.toLowerCase()));
  return b.tr.some((t) => set.has(t.toLowerCase()));
}

function samePos(a, b) {
  const pa = a.pos.split("/");
  return b.pos.split("/").some((p) => pa.includes(p));
}

/** Yakın seviyeden, anlamı çakışmayan çeldiriciler. similar=true ise yazılışı yakın olanları tercih eder. */
export function distractors(word, index, n, rng = Math.random, similar = false) {
  const li = LEVELS.indexOf(word.level);
  const near = [];
  for (const lv of [word.level, LEVELS[li - 1], LEVELS[li + 1], "k"]) {
    if (lv && index.byLevel.has(lv)) near.push(...index.byLevel.get(lv));
  }
  const sample = shuffle(near, rng).filter((w) => w.word !== word.word && !overlaps(word, w));
  let pool = sample.filter((w) => samePos(word, w));
  if (pool.length < n * 4) pool = sample;
  pool = pool.slice(0, 60);
  if (similar) {
    pool.sort((a, b) => levenshtein(a.word, word.word) - levenshtein(b.word, word.word));
  }
  return pool.slice(0, n);
}

/** Örnek cümlede kelimenin birebir geçtiği yeri bulur (cloze için). */
export function clozeParts(w) {
  if (!w.example) return null;
  const re = new RegExp(`(^|[^A-Za-z'])(${escapeRegExp(w.word)})(?![A-Za-z])`, "i");
  const m = re.exec(w.example);
  if (!m) return null;
  const start = m.index + m[1].length;
  return { before: w.example.slice(0, start), token: m[2], after: w.example.slice(start + m[2].length) };
}

export const TYPES = ["mcq_en_tr", "mcq_tr_en", "listen_mcq", "type_en", "dictation", "cloze", "speak", "emoji_mcq", "listen_emoji"];

function optionList(correct, wrongs, labelFn, rng) {
  const opts = [{ label: labelFn(correct), correct: true }, ...wrongs.map((w) => ({ label: labelFn(w), correct: false }))];
  // Aynı etiketli tekrarları ayıkla
  const seen = new Set();
  const uniq = opts.filter((o) => (seen.has(o.label) ? false : (seen.add(o.label), true)));
  return shuffle(uniq, rng);
}

export function makeExercise(type, w, index, rng = Math.random, opts = {}) {
  const base = { type, word: w.word, level: w.level };
  switch (type) {
    case "mcq_en_tr":
      return { ...base, prompt: w.word, sub: posLabel(w.pos), speak: w.word,
        options: optionList(w, distractors(w, index, 3, rng), (x) => shortMeaning(x), rng) };
    case "mcq_tr_en":
      return { ...base, prompt: w.tr.slice(0, 3).join(" / "), sub: posLabel(w.pos),
        options: optionList(w, distractors(w, index, 3, rng), (x) => x.word, rng) };
    case "emoji_mcq": {
      if (!hasEmoji(w.word)) return makeExercise("mcq_en_tr", w, index, rng, opts);
      const mine = emojiFor(w.word);
      const near = distractors(w, index, 30, rng).filter((x) => hasEmoji(x.word) && emojiFor(x.word) !== mine).slice(0, 3);
      const extra = near.length < 3
        ? shuffle(index.words.filter((x) => x.word !== w.word && hasEmoji(x.word) && emojiFor(x.word) !== mine && !near.includes(x)), rng).slice(0, 3 - near.length)
        : [];
      return { ...base, prompt: "Bu görsel hangi kelime?", emoji: mine, sub: shortMeaning(w, 1),
        options: optionList(w, [...near, ...extra], (x) => x.word, rng) };
    }
    case "listen_emoji": {
      if (!hasEmoji(w.word)) return makeExercise("listen_mcq", w, index, rng, opts);
      const mine = emojiFor(w.word);
      const near = distractors(w, index, 30, rng).filter((x) => hasEmoji(x.word) && emojiFor(x.word) !== mine).slice(0, 3);
      const extra = near.length < 3
        ? shuffle(index.words.filter((x) => x.word !== w.word && hasEmoji(x.word) && emojiFor(x.word) !== mine && !near.includes(x)), rng).slice(0, 3 - near.length)
        : [];
      return { ...base, prompt: "Duyduğun kelimenin görselini seç", audio: w.word, emojiOptions: true,
        options: optionList(w, [...near, ...extra], (x) => emojiFor(x.word), rng) };
    }
    case "listen_mcq":
      return { ...base, prompt: "Duyduğun kelimeyi seç", audio: w.word,
        options: optionList(w, distractors(w, index, 3, rng, true), (x) => x.word, rng) };
    case "type_en":
      return { ...base, prompt: w.tr.slice(0, 3).join(" / "), sub: posLabel(w.pos), answer: w.word,
        hint: w.word[0] + "·".repeat(Math.max(0, w.word.length - 1)) };
    case "dictation":
      return { ...base, prompt: "Duyduğunu yaz", audio: w.word, answer: w.word,
        sub: opts.showMeaning ? shortMeaning(w, 2) : "" };
    case "cloze": {
      const p = clozeParts(w);
      if (!p) return makeExercise("mcq_tr_en", w, index, rng, opts);
      const mode = opts.clozeTyping ? "type" : "mcq";
      const ex = { ...base, prompt: "Boşluğu doldur", cloze: p, mode, sub: shortMeaning(w, 2), answer: w.word };
      if (mode === "mcq") ex.options = optionList(w, distractors(w, index, 3, rng, true), (x) => x.word, rng);
      else ex.hint = w.word[0] + "·".repeat(Math.max(0, w.word.length - 1));
      return ex;
    }
    case "speak":
      return { ...base, prompt: "Yüksek sesle söyle", display: w.word, sub: shortMeaning(w, 2), answer: w.word, speak: w.word };
    default:
      throw new Error("Bilinmeyen alıştırma türü: " + type);
  }
}

/** Kartın olgunluğuna göre uygun alıştırma türünü seçer. */
export function pickType(card, w, caps, lastType, rng = Math.random) {
  const reps = card ? card.reps || 0 : 0;
  let pool;
  if (reps <= 1) pool = ["mcq_en_tr", "listen_mcq", "mcq_tr_en", "emoji_mcq", "listen_emoji"];
  else if (reps <= 3) pool = ["mcq_tr_en", "cloze", "listen_mcq", "type_en", "emoji_mcq", "listen_emoji"];
  else pool = ["type_en", "dictation", "cloze", "speak"];
  pool = pool.filter((t) => {
    if (t === "cloze") return !!clozeParts(w);
    if (t === "emoji_mcq") return hasEmoji(w.word);
    if (t === "speak") return caps.speaking;
    if (t === "listen_emoji") return caps.audio && hasEmoji(w.word);
    if (t === "listen_mcq" || t === "dictation") return caps.audio;
    return true;
  });
  if (!pool.length) pool = ["mcq_en_tr"];
  const alt = pool.filter((t) => t !== lastType);
  return pick(alt.length ? alt : pool, rng);
}

/**
 * Yazılı cevap denetimi. ok: tam doğru; close: bir harf hatası (kabul edilir ama "zor" sayılır).
 * Birden fazla boşluk/noktalama farkı yok sayılır.
 */
export function checkTyped(expected, input) {
  const a = normalizeAnswer(expected);
  const b = normalizeAnswer(input);
  if (!b) return { ok: false, close: false };
  if (a === b) return { ok: true, close: false };
  if (a.length >= 5 && levenshtein(a, b) <= 1) return { ok: true, close: true };
  return { ok: false, close: false };
}
