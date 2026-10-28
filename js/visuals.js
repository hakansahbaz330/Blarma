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

/** Kavram birleşimi: [ana, rozet, köşe] çizim adları; yoksa null. Soyut kelimeler için (somut kelimelerin çizimi/emojisi önceliklidir). */
export function conceptOf(word) {
  const m = (typeof self !== "undefined" && self.KB_CONCEPT) || {};
  return m[word] ? m[word].split(",") : null;
}

/** Ekranda gösterilecek görsel: çizim, kavram birleşimi, emoji. (Görsel sınavlar yalnızca visualKey kullanır.) */
export function shownKey(word) {
  if (hasArt(word)) return `art:${word}`;
  const c = (typeof self !== "undefined" && self.KB_CONCEPT) || {};
  return c[word] ? `mix:${c[word]}` : emojiFor(word);
}

/** Soyut kelimeler için anlam alanı (ör. "mo" = para ve finans); yoksa "". */
export function fieldOf(word) {
  const m = (typeof self !== "undefined" && self.KB_FIELD) || {};
  return m[word] || "";
}
export function fieldLabel(code) {
  const l = (typeof self !== "undefined" && self.KB_FIELD_LABELS) || {};
  return l[code] || "";
}
/** Anlam alanı rozeti (HTML); alan yoksa boş. Çizimi olan somut kelimelerde gösterilmez. */
export function fieldChip(word) {
  if (hasArt(word) || emojiMap()[word]) return "";
  const c = fieldOf(word);
  return c ? `<span class="chip field">${fieldLabel(c)}</span>` : "";
}

/** Kelimenin herhangi bir görseli (çizim ya da emoji) var mı? */
export function hasEmoji(word) {
  return hasArt(word) || !!emojiMap()[word];
}

/** visualKey değerini HTML'e çevirir. */
export function renderVisual(key) {
  if (!key) return "";
  if (key.startsWith("art:")) return `<img class="art" src="art/${encodeURIComponent(key.slice(4))}.svg" alt="" draggable="false" decoding="async">`;
  if (key.startsWith("mix:")) {
    const img = (n, c) => (n ? `<img class="art ${c}" src="art/${encodeURIComponent(n)}.svg" alt="" draggable="false" decoding="async">` : "");
    const [a, b, c] = key.slice(4).split(",");
    return `<span class="mix">${img(a, "m0")}${img(b, "m1")}${img(c, "m2")}</span>`;
  }
  return key;
}

/** Kare görsel karo. size: sm | md | lg | xl | fill */
export function tileHtml(w, size = "md") {
  const v = shownKey(w.word);
  const lv = w.level || "k";
  const f = v ? "" : fieldOf(w.word);
  const inner = v ? renderVisual(v) : f ? `<img class="art field" src="art/field-${f}.svg" alt="" draggable="false" decoding="async">` : `<b>${w.word[0].toUpperCase()}</b>`;
  return `<span class="tile ${size} tile-${lv}${f ? " fieldtile" : ""}" aria-hidden="true">${inner}</span>`;
}
