// Aralıklı tekrar (SRS) mantığı. Saf fonksiyonlar: DOM ve depolamadan bağımsız, test edilebilir.
//
// Kart durumları: s = 1 öğreniliyor (oturum içinde), 2 tekrar aşamasında, 3 "biliyorum" (tekrardan çıkarıldı).
// Notlar: 0 yanlış, 1 zor (ipucu / ikinci deneme), 2 iyi, 3 kolay.

export const LEVELS = ["a1", "a2", "b1", "b2", "c1"];
export const LEVEL_LABELS = {
  a1: "A1 · Başlangıç",
  a2: "A2 · Temel",
  b1: "B1 · Orta",
  b2: "B2 · Orta üstü",
  c1: "C1 · İleri",
  k: "Kendi kelimem",
};
export const MAX_INTERVAL = 180;
export const MIN_EASE = 1.3;
export const LEECH_LAPSES = 4;

export function newProgress(today) {
  return { s: 1, due: today, iv: 0, ease: 2.5, reps: 0, lapses: 0, ok: 0, seen: 0, fav: 0 };
}

/**
 * Bir tekrar sonrası kartı günceller (değiştirmez, yeni nesne döner).
 * - Yanlış: aralık 1 güne iner, ease sınırlı düşer ("ease hell" önlemek için taban 1.3).
 * - Zor: aralık az büyür.
 * - İyi: 1 → 3 → ease'e göre büyüyen aralıklar (kabaca 1, 3, 8, 20, 50, 125 gün).
 * - Kolay: ease artar, aralık daha çok büyür.
 */
export function review(card, grade, today) {
  const c = { ...card, seen: (card.seen || 0) + 1 };
  if (grade >= 1) c.ok = (c.ok || 0) + 1;
  if (grade === 0) {
    c.lapses = (c.lapses || 0) + 1;
    c.ease = Math.max(MIN_EASE, c.ease - 0.2);
    c.iv = 1;
    c.reps = 0;
  } else if (grade === 1) {
    c.ease = Math.max(MIN_EASE, c.ease - 0.15);
    c.iv = Math.max(c.iv + 1, Math.round((c.iv || 1) * 1.2));
    c.reps = Math.max(1, c.reps);
  } else {
    c.reps = (c.reps || 0) + 1;
    if (grade === 3) c.ease = Math.min(3, c.ease + 0.1);
    let iv;
    if (c.reps <= 1) iv = grade === 3 ? 3 : 1;
    else if (c.reps === 2) iv = grade === 3 ? 5 : 3;
    else iv = Math.round(c.iv * c.ease * (grade === 3 ? 1.3 : 1));
    c.iv = Math.max(c.iv + 1, iv);
  }
  c.iv = Math.min(MAX_INTERVAL, c.iv);
  c.s = 2;
  c.due = today + c.iv;
  return c;
}

/** Yeni kelime oturum içinde yeterince doğru yapıldığında tekrar aşamasına geçer. */
export function graduate(card, mistakes, today) {
  const grade = mistakes === 0 ? 2 : 1;
  const base = { ...card, s: 2, iv: 0, reps: 0 };
  if (mistakes >= 2) base.ease = Math.max(MIN_EASE, base.ease - 0.2);
  const r = review(base, grade, today);
  r.iv = 1;
  r.due = today + 1;
  r.reps = 1;
  return r;
}

export function isLeech(card) {
  return !!card && (card.lapses || 0) >= LEECH_LAPSES;
}

/** Vadesi gelmiş kartların kelimeleri; en geciken önce. */
export function dueWords(prog, today) {
  return Object.entries(prog)
    .filter(([, c]) => c.s === 2 && c.due <= today)
    .sort((a, b) => a[1].due - b[1].due)
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
