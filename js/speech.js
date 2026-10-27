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
  voicesCache = synth.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  return voicesCache;
}
if (synth) {
  loadVoices();
  synth.addEventListener && synth.addEventListener("voiceschanged", loadVoices);
}

export function englishVoices() {
  return voicesCache.length ? voicesCache : loadVoices();
}

function chooseVoice(accent, voiceURI) {
  const voices = englishVoices();
  if (voiceURI) {
    const v = voices.find((x) => x.voiceURI === voiceURI);
    if (v) return v;
  }
  const wanted = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === accent.toLowerCase());
  return wanted.find((v) => /google|natural|samantha|daniel|premium|enhanced/i.test(v.name)) || wanted[0] || voices[0] || null;
}

export function speak(text, { accent = "en-US", rate = 0.9, voiceURI = "" } = {}) {
  if (!synth || !text) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = accent;
      u.rate = rate;
      const v = chooseVoice(accent, voiceURI);
      if (v) u.voice = v;
      u.onend = u.onerror = () => resolve();
      synth.speak(u);
    } catch { resolve(); }
  });
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
