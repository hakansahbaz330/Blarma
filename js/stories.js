// İsteğe bağlı yapay zekâ hikâyeleri: kullanıcının kendi Anthropic API anahtarıyla, öğrenilen kelimelerden kısa hikâye.
// Çıktı doğrulanır: hedef kelimelerin hepsi metinde geçmiyorsa bir kez daha denenir (hikâye doğruluğu şikâyetine karşı).
import { escapeHtml, escapeRegExp } from "./util.js";

export const DEFAULT_MODEL = "claude-haiku-5-5";
const API_URL = "https://api.anthropic.com/v1/messages";

/** Hikâyeye konacak kelimeler: yeni öğrenilenler (en yakın tarihli), zor kelimeler ya da vadesi yakın olanlar. */
export function pickStoryWords(prog, index, source = "recent", count = 8, today = 0) {
  const entries = Object.entries(prog).filter(([w, c]) => index.byWord.has(w) && c.s === 2);
  let sorted;
  if (source === "hard") sorted = entries.sort((a, b) => (b[1].lapses || 0) - (a[1].lapses || 0) || a[1].due - b[1].due);
  else if (source === "due") sorted = entries.sort((a, b) => a[1].due - b[1].due);
  else sorted = entries.sort((a, b) => (a[1].reps || 0) - (b[1].reps || 0) || b[1].due - a[1].due);
  return sorted.slice(0, count).map(([w]) => w);
}

export function buildPrompt({ words, level = "a2", length = 120 }) {
  return [
    "You write short graded-reader stories for Turkish learners of English.",
    `Write a coherent, natural, mildly interesting story of about ${length} words at CEFR level ${level.toUpperCase()}.`,
    "Use simple grammar, short sentences and mostly high-frequency vocabulary. Do not add words that are much harder than the target words.",
    `You MUST use every one of these target words at least once, in its base form or a regular inflection: ${words.join(", ")}.`,
    "Wrap every occurrence of a target word in double asterisks, like **word**. Do not bold anything else.",
    "Then give a faithful, natural Turkish translation of the whole story (keep the same paragraph breaks; do not use asterisks in the Turkish text).",
    'Return ONLY valid JSON, no markdown fences: {"title": "...", "story_en": "...", "story_tr": "..."}',
  ].join("\n");
}

export function parseStory(text) {
  let t = String(text).trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("Yanıt çözümlenemedi");
  const obj = JSON.parse(t.slice(start, end + 1));
  if (!obj.story_en || !obj.story_tr) throw new Error("Hikâye eksik geldi");
  return { title: String(obj.title || "Hikâye"), en: String(obj.story_en), tr: String(obj.story_tr).replace(/\*\*/g, "") };
}

/** Hedef kelimelerden metinde **kalın** işaretlenmemiş olanları döndürür. */
export function missingWords(story, words) {
  const bolds = [...story.en.matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1].toLowerCase());
  return words.filter((w) => {
    const lw = w.toLowerCase();
    const stem = lw.includes(" ") || lw.length <= 4 ? lw : lw.slice(0, Math.max(3, lw.length - 2));
    return !bolds.some((b) => b.includes(stem));
  });
}

export function renderStoryHtml(text, { highlight = true } = {}) {
  const safe = escapeHtml(text);
  const body = highlight ? safe.replace(/\*\*(.+?)\*\*/g, "<mark>$1</mark>") : safe.replace(/\*\*/g, "");
  return body.split(/\n{1,}/).filter(Boolean).map((p) => `<p>${p}</p>`).join("");
}

async function callApi({ apiKey, model, prompt, fetchImpl }) {
  let res;
  try {
    res = await fetchImpl(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model, max_tokens: 1800, messages: [{ role: "user", content: prompt }] }),
    });
  } catch {
    throw new Error("Ağ hatası: bağlantını kontrol et.");
  }
  if (res.status === 401 || res.status === 403) throw new Error("API anahtarı geçersiz ya da yetkisiz.");
  if (res.status === 429) throw new Error("İstek sınırına takıldın, biraz sonra tekrar dene.");
  if (!res.ok) throw new Error(`Sunucu hatası (${res.status}).`);
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return text;
}

export async function generateStory({ apiKey, model = DEFAULT_MODEL, words, level, length = 120, fetchImpl = (...a) => fetch(...a) }) {
  if (!apiKey) throw new Error("Önce Ayarlar'dan API anahtarını gir.");
  if (!words.length) throw new Error("Hikâye için önce birkaç kelime öğrenmelisin.");
  let prompt = buildPrompt({ words, level, length });
  let story = parseStory(await callApi({ apiKey, model, prompt, fetchImpl }));
  let miss = missingWords(story, words);
  if (miss.length) {
    // Bir kez daha dene: eksik kelimeleri özellikle iste.
    prompt += `\n\nIMPORTANT: your previous attempt forgot these target words: ${miss.join(", ")}. Include them all, each wrapped in **double asterisks**.`;
    try {
      const again = parseStory(await callApi({ apiKey, model, prompt, fetchImpl }));
      const miss2 = missingWords(again, words);
      if (miss2.length <= miss.length) { story = again; miss = miss2; }
    } catch { /* ilk sonucu kullan */ }
  }
  return { ...story, words, missing: miss };
}
