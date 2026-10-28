// Kelime görselleri: çizimi olan kelimelerde özgün vektör çizim (art/), yoksa emoji, o da yoksa seviye renginde harf karosu.
const emojiMap = () => (typeof window !== "undefined" && window.KB_EMOJI) || {};
let artList = null, artSet = new Set();
const arts = () => {
  const list = (typeof self !== "undefined" && self.KB_ART) || null;
  if (list !== artList) { artList = list; artSet = new Set(list || []); }
  return artSet;
};

export function emojiFor(word) {
  return emojiMap()[word] || "";
}

export const hasArt = (word) => arts().has(word);

/** Görsel kimliği: "art:kelime" ya da emoji metni. Seçenek ayrımı ve çizim için kullanılır. */
export function visualKey(word) {
  return hasArt(word) ? `art:${word}` : emojiFor(word);
}

/** Kelimenin herhangi bir görseli (çizim ya da emoji) var mı? */
export function hasEmoji(word) {
  return hasArt(word) || !!emojiMap()[word];
}

/** visualKey değerini HTML'e çevirir. */
export function renderVisual(key) {
  if (!key) return "";
  if (key.startsWith("art:")) return `<img class="art" src="art/${encodeURIComponent(key.slice(4))}.svg" alt="" draggable="false" decoding="async">`;
  return key;
}

/** Kare görsel karo. size: sm | md | lg | xl | fill */
export function tileHtml(w, size = "md") {
  const v = visualKey(w.word);
  const lv = w.level || "k";
  return `<span class="tile ${size} tile-${lv}" aria-hidden="true">${v ? renderVisual(v) : `<b>${w.word[0].toUpperCase()}</b>`}</span>`;
}
