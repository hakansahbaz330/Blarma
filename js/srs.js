// Hafıza modeli ve aralıklı tekrar. Saf fonksiyonlar: DOM ve depolamadan bağımsız, test edilebilir.
//
// Her kart iki sayıyla izlenir:
//   st  kararlılık (gün): kelimenin hafızadan ~%90 olasılıkla hâlâ çağrılabildiği süre
//   d   güçlük (1–10): kelimenin bu kişi için ne kadar zor olduğu
// Unutma eğrisi güç yasasıdır: R(t) = (1 + t / (9·st))⁻¹  (t = son tekrardan beri geçen gün; t = st iken R = 0,9).
// Bu, Ebbinghaus'tan beri bilinen "unutma önce hızlı, sonra yavaş olur" bulgusunu ve aralıklı tekrar
// araştırmasındaki (Cepeda ve ark., 2006/2008) iki bulguyu kullanır:
//   1) Aralık arttıkça kalıcılık artar; en iyi aralık, hatırlanması gereken süreyle birlikte uzar.
//   2) Hafıza zayıfken (unutmaya yakın) başarılı bir çağırma, kararlılığı daha çok artırır ("istenen zorluk").
// Formüller bu uygulamaya özgüdür; sabitler kabaca aralıklı tekrar yazınına göre ayarlanmıştır, kişisel
// veriyle henüz kalibre edilmemiştir.
//
// Kart durumları: s = 1 öğreniliyor (oturum içinde), 2 tekrar aşamasında, 3 "biliyorum" (tekrardan çıkarıldı).
// Notlar: 0 yanlış, 1 zor (ipucu / yavaş / ikinci deneme), 2 iyi, 3 kolay.

export const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
export const LEVEL_LABELS = {
  a1: "A1 · Başlangıç",
  a2: "A2 · Temel",
  b1: "B1 · Orta",
  b2: "B2 · Orta üstü",
  c1: "C1 · İleri",
  k: "Kendi kelimem",
};

export const MAX_INTERVAL = 365;
export const LEECH_LAPSES = 4;
export const TARGET_RETENTION = 0.9;
export const LASTING_DAYS = 30;       // kararlılık bu değere ulaşınca kelime "kalıcı" sayılır

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function newProgress(today) {
  return { s: 1, due: today, iv: 0, st: 0, d: 5, last: today, reps: 0, lapses: 0, ok: 0, seen: 0, fav: 0 };
}

/** Eski (kararlılık alanı olmayan) kartları yeni modele çevirir; yeni kartlara dokunmaz. */
export function normalize(card) {
  if (!card || card.st != null || card.s === 3) return card;
  const ease = card.ease || 2.5;
  const iv = card.iv || 0;
  return { ...card, st: Math.max(iv, card.s === 2 ? 1 : 0), d: clamp(5 + (2.5 - ease) * 3, 1, 10), last: (card.due || 0) - iv };
}

/** Şu anki hatırlama olasılığı (0–1). Henüz hiç tekrarlanmamış kartlar için 0. */
export function retrievability(card, today) {
  const c = normalize(card);
  if (!c || !c.st) return 0;
  const t = Math.max(0, today - (c.last ?? today));
  return 1 / (1 + t / (9 * c.st));
}

/** Hedef hatırlama olasılığına göre bir sonraki aralık (gün). */
export function intervalFor(st, retention = TARGET_RETENTION) {
  return clamp(Math.round(9 * st * (1 / retention - 1)), 1, MAX_INTERVAL);
}

// Kararlılık artışı: kolay kelimede, düşük kararlılıkta ve hafıza zayıfken daha büyük.
function growth(c, R, grade) {
  const base = 1.45 * ((11 - c.d) / 6) * Math.pow(c.st, -0.2) * Math.exp(2.2 * (1 - R));
  const mult = grade === 1 ? 0.35 : grade === 3 ? 1.35 : 1;
  return base * mult;
}

/**
 * Bir tekrar sonrası kartı günceller (değiştirmez, yeni nesne döner).
 * grade 0: unuttu → kararlılık düşer, ertesi gün yeniden sorulur.
 * grade 1: zorlandı → kararlılık az artar. 2: iyi. 3: kolay.
 */
export function review(card, grade, today, retention = TARGET_RETENTION) {
  const c = { ...normalize(card), seen: (card.seen || 0) + 1 };
  const R = c.st ? retrievability(c, today) : 1;
  if (grade >= 1) c.ok = (c.ok || 0) + 1;
  const dShift = [1.0, 0.4, -0.1, -0.5][grade];
  c.d = clamp(c.d + dShift + (5 - c.d) * 0.05, 1, 10);
  if (grade === 0) {
    c.lapses = (c.lapses || 0) + 1;
    c.reps = 0;
    c.st = Math.max(0.6, Math.min(c.st * 0.5, 0.5 * Math.pow(Math.max(c.st, 1), 0.65)));
  } else {
    c.reps = (c.reps || 0) + 1;
    c.st = Math.min(MAX_INTERVAL * 2, Math.max(c.st, 0.8) * (1 + growth({ ...c, st: Math.max(c.st, 0.8) }, R, grade)));
  }
  c.iv = intervalFor(c.st, retention);
  if (grade === 0) c.iv = 1;
  c.s = 2;
  c.last = today;
  c.due = today + c.iv;
  return c;
}

/**
 * Yeni kelime oturum içinde yeterince doğru yapıldığında tekrar aşamasına geçer.
 * İlk tekrar ertesi gün: uykudan sonra yapılan ilk çağırma, kalıcılaşmayı en çok destekleyen adımdır.
 */
export function graduate(card, mistakes, today, retention = TARGET_RETENTION) {
  const c = { ...normalize(card), s: 2, last: today, reps: 1 };
  c.st = mistakes === 0 ? 1.2 : mistakes === 1 ? 0.9 : 0.7;
  c.d = clamp(5 + mistakes * 0.8, 1, 10);
  c.iv = Math.max(1, intervalFor(c.st, retention));
  c.due = today + c.iv;
  return c;
}

/**
 * Cevaptan otomatik not: öğrenciden "ne kadar kolaydı?" diye sormaya gerek kalmaz.
 * Yazarak ve hızlı doğru = kolay; ipucu, yakın yazım ya da çok yavaş doğru = zor.
 * Çoktan seçmeli sorularda şans payı vardır, bu yüzden "kolay" yalnızca yazılı cevapta verilir.
 */
export function gradeFor({ correct, hinted = false, close = false, typed = false, ms = null, reps = 0 }) {
  if (!correct) return 0;
  if (hinted || close) return 1;
  if (ms != null && ms > (typed ? 25000 : 12000)) return 1;
  if (typed && reps >= 2 && ms != null && ms < 9000) return 3;
  return 2;
}

export function isLeech(card) {
  return !!card && (card.lapses || 0) >= LEECH_LAPSES;
}

/** Hafıza aşamaları (bahçe benzetmesi): kararlılığa göre. */
export const STAGES = [
  { id: "seed", label: "Tohum", hint: "Yeni ekildi" },
  { id: "sprout", label: "Filiz", hint: "Birkaç gün dayanır" },
  { id: "sapling", label: "Fidan", hint: "Birkaç hafta dayanır" },
  { id: "tree", label: "Ağaç", hint: "Aylarca kalıcı" },
];

export function stageIndex(card) {
  const c = normalize(card);
  if (!c || c.s === 3) return -1;
  if (c.s === 1 || !c.st) return 0;
  return c.st < 3 ? 0 : c.st < 10 ? 1 : c.st < LASTING_DAYS ? 2 : 3;
}

export function isLasting(card) {
  const c = normalize(card);
  return !!c && c.s === 2 && c.st >= LASTING_DAYS;
}

/** Vadesi gelmiş kartların kelimeleri; hatırlama olasılığı en düşük olan önce. */
export function dueWords(prog, today) {
  return Object.entries(prog)
    .filter(([, c]) => c.s === 2 && c.due <= today)
    .map(([w, c]) => [w, retrievability(c, today)])
    .sort((a, b) => a[1] - b[1])
    .map(([w]) => w);
}

/** Önümüzdeki n gün için beklenen tekrar sayıları (bugün dahil, gecikenler bugüne yazılır). */
export function forecast(prog, today, n = 7) {
  const out = Array(n).fill(0);
  for (const c of Object.values(prog)) {
    if (c.s !== 2) continue;
    const d = Math.max(0, c.due - today);
    if (d < n) out[d]++;
  }
  return out;
}

/** Tekrar aşamasındaki kelimelerin şu anki ortalama hatırlama olasılığı (0–1); kelime yoksa null. */
export function memoryStrength(prog, today) {
  let n = 0, sum = 0;
  for (const c of Object.values(prog)) {
    if (c.s !== 2) continue;
    n++;
    sum += retrievability(c, today);
  }
  return n ? sum / n : null;
}

/**
 * Bugün kaç yeni kelime alınmalı? Bekleyen tekrarlar birikmişse ya da son günlerde tekrar başarısı düşmüşse
 * yeni kelime azaltılır: hafıza, yeni bilgiyle boğulmadan önce eskisini pekiştirmeli.
 * @returns {{count:number, reason:string|null}}
 */
export function newWordBudget({ goal, doneToday, dueCount, recentAccuracy }) {
  const left = Math.max(0, goal - doneToday);
  if (dueCount >= 30) return { count: 0, reason: "backlog" };
  if (dueCount >= 18) return { count: Math.min(left, Math.ceil(goal / 3)), reason: "backlog" };
  if (recentAccuracy != null && recentAccuracy < 0.7) return { count: Math.min(left, Math.ceil(goal / 2)), reason: "accuracy" };
  return { count: left, reason: null };
}

/**
 * Yeni kelime seçimi: hedef seviyelerden, henüz görülmemiş kelimeler.
 * Düşük seviyeden yükseğe doğru ilerler, seviye içinde kullanıcıya özgü sabit karışık sıra kullanır.
 */
export function pickNewWords(words, prog, levels, count, orderKey) {
  const lv = levels.length ? levels : LEVELS;
  const order = (w) => lv.indexOf(w.level);
  const cands = words.filter((w) => order(w) >= 0 && !prog[w.word]);
  cands.sort((a, b) => order(a) - order(b) || orderKey(a.word) - orderKey(b.word));
  return cands.slice(0, count);
}

/** Basit, deterministik 32-bit karma (kelime sırasını kullanıcı başına sabit karıştırmak için). */
export function hashKey(str, seed = 0) {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
