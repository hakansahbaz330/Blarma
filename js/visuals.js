// Kelime görselleri: somut kelimeler için emoji, diğerleri için seviye renginde harf karosu.
const map = () => (typeof window !== "undefined" && window.BLARMA_EMOJI) || {};

export function emojiFor(word) {
  return map()[word] || "";
}

export function hasEmoji(word) {
  return !!map()[word];
}

/** Kare görsel karo. size: sm | md | lg */
export function tileHtml(w, size = "md") {
  const e = emojiFor(w.word);
  const lv = w.level || "k";
  return `<span class="tile ${size} tile-${lv}" aria-hidden="true">${e || `<b>${w.word[0].toUpperCase()}</b>`}</span>`;
}
