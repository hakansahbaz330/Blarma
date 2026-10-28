// Konuşma: sesli okuma (TTS) ve konuşma tanıma. Tarayıcı desteği yoksa sessizce devre dışı kalır.

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const caps = {
  get audio() { return !!synth; },
  get speaking() { return !!Recognition; },
};

let voicesCache = [];
function loadVoices() {
  if (!synth) return [];
  voicesCache = synth.getVoices();
  return voicesCache;
}
if (synth) {
  loadVoices();
  synth.addEventListener && synth.addEventListener("voiceschanged", loadVoices);
}

const allVoices = () => (voicesCache.length ? voicesCache : loadVoices());
const norm = (l) => String(l || "").replace("_", "-").toLowerCase();

/**
 * Ses kalitesi tahmini: tarayıcılar kalite bilgisi vermez, bu yüzden adından çıkarırız.
 * "Doğal/sinirsel" sesler (Edge Natural, Google çevrimiçi, Apple Premium/Enhanced) robot sesinden belirgin biçimde
 * daha insansıdır; "compact/espeak" gibi küçük sesler en zayıflarıdır.
 */
export function voiceInfo(v) {
  const n = v.name || "";
  let score = 0;
  if (/natural|neural|online|premium|enhanced|studio|wavenet/i.test(n)) score += 6;
  if (/google/i.test(n)) score += 4;
  if (/samantha|ava\b|allison|susan|zoe|serena|daniel|oliver|karen|moira|tessa|kate|arthur|martha|aria|jenny|guy|sonia|ryan|libby|emel|yelda|filiz/i.test(n)) score += 3;
  if (v.localService === false) score += 2;
  if (/compact|espeak|festival|flite|fred|albert|bahh|bells|boing|bubbles|cellos|deranged|hysterical|jester|organ|trinoids|whisper|zarvox|novelty|junior/i.test(n)) score -= 8;
  return { score, quality: score >= 6 ? "high" : score >= 2 ? "std" : "low" };
}
export const QUALITY_LABEL = { high: "Doğal", std: "Standart", low: "Robotik" };

/** Bir dil için sesler, en iyi kaliteden başlayarak (lang: "en" ya da "tr"). */
export function voicesFor(lang) {
  const re = new RegExp("^" + lang + "(-|$)", "i");
  return allVoices().filter((v) => re.test(norm(v.lang))).map((v) => ({ v, ...voiceInfo(v) }))
    .sort((a, b) => b.score - a.score || a.v.name.localeCompare(b.v.name));
}
export const englishVoices = () => voicesFor("en").map((x) => x.v);
export const turkishVoices = () => voicesFor("tr").map((x) => x.v);

/** Bu cihazdaki en iyi sesin kalite sınıfı (hiç ses yoksa null) — ayarlarda uyarı için. */
export function bestQuality(lang = "en") {
  const l = voicesFor(lang);
  return l.length ? l[0].quality : null;
}

function chooseVoice(lang, accent, voiceURI) {
  const list = voicesFor(lang);
  if (voiceURI) {
    const hit = list.find((x) => x.v.voiceURI === voiceURI);
    if (hit) return hit.v;
  }
  const exact = accent ? list.filter((x) => norm(x.v.lang) === norm(accent)) : [];
  return (exact[0] || list[0] || {}).v || null;
}

function utter(text, lang, { rate = 0.9, voice = null, pitch = 1 } = {}) {
  if (!synth || !text) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      u.pitch = pitch;
      if (voice) { u.voice = voice; u.lang = voice.lang || lang; }
      u.onend = u.onerror = () => resolve();
      synth.speak(u);
    } catch { resolve(); }
  });
}

/** İngilizce okuma. Tek kelimede yapay yavaşlatma yerine ses kendi doğal hızında kalır (rate 1'e yaklaşır). */
export function speak(text, { accent = "en-US", rate = 0.9, voiceURI = "" } = {}) {
  return utter(text, accent, { rate, voice: chooseVoice("en", accent, voiceURI) });
}

/** Türkçe okuma (anlamlar ve çeviriler için). */
export function speakTr(text, { rate = 0.95, trVoiceURI = "" } = {}) {
  return utter(text, "tr-TR", { rate, voice: chooseVoice("tr", "tr-TR", trVoiceURI) });
}

export function stopSpeaking() { try { synth && synth.cancel(); } catch { /* yok say */ } }

/** Mikrofondan bir kez dinler; alternatif transkriptlerin listesini döner (boş olabilir). */
export function listenOnce(lang = "en-US", timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    if (!Recognition) return reject(new Error("unsupported"));
    const rec = new Recognition();
    rec.lang = lang;
    rec.maxAlternatives = 5;
    rec.interimResults = false;
    let done = false;
    const finish = (val, err) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { rec.stop(); } catch { /* yok say */ }
      err ? reject(err) : resolve(val);
    };
    const timer = setTimeout(() => finish([]), timeoutMs);
    rec.onresult = (e) => {
      const alts = [];
      for (const r of e.results) for (let i = 0; i < r.length; i++) alts.push(r[i].transcript);
      finish(alts);
    };
    rec.onerror = (e) => finish([], e.error === "no-speech" ? null : new Error(e.error || "error"));
    rec.onend = () => finish([]);
    try { rec.start(); } catch (err) { finish([], err); }
  });
}
