import { dayNumber } from "./util.js";
import { normalize } from "./srs.js";

const KEY = "kelimebahcesi.v1";

export const DEFAULT_SETTINGS = {
  goal: 10,            // günlük yeni kelime hedefi
  levels: ["a1", "a2"],
  accent: "en-US",
  voice: "",
  trVoice: "",
  rate: 0.9,
  theme: "auto",
  speaking: true,
  autoplay: true,
  haptics: true,       // doğru/yanlışta titreşim
  sfx: false,          // doğru/yanlışta küçük ses
  reminderHour: 20,
  slideSeconds: 6,     // slayt gösterisi hızı
  practiceCount: 10,   // pratik turu uzunluğu
  writeMode: (typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches) ? "tiles" : "keyboard",
  retention: 0.9,      // hedef hatırlama olasılığı (daha yüksek = daha sık tekrar)
  maxReviews: 40,      // bir oturumdaki en fazla tekrar
  apiKey: "",          // isteğe bağlı: hikâyeler için kullanıcının kendi Anthropic anahtarı
  model: "claude-haiku-5-5",
};

export function defaultState() {
  return {
    v: 1,
    created: Date.now(),
    seed: Math.floor(Math.random() * 2 ** 31),
    placed: false,
    settings: { ...DEFAULT_SETTINGS },
    prog: {},            // kelime -> kart (srs.js)
    custom: [],          // kullanıcı kelimeleri
    notes: {},           // kelime -> kişisel hatırlatıcı not
    flags: {},           // hatalı çeviri bildirimleri: kelime -> not
    stories: { read: {}, fav: {} },   // hikâye id -> okunduğu gün / favori
    stats: { xp: 0, streak: 0, best: 0, last: 0, freezes: 1, daily: {} },
    cal: { n: 0, ok: 0, exp: 0, g: 1 },   // kişisel aralık uyarlaması (srs.calibrate)
  };
}

function migrate(s) {
  const d = defaultState();
  return {
    ...d, ...s,
    settings: { ...d.settings, ...(s.settings || {}) },
    stats: { ...d.stats, ...(s.stats || {}), daily: { ...(s.stats && s.stats.daily) } },
    prog: Object.fromEntries(Object.entries(s.prog || {}).map(([w, c]) => [w, normalize(c)])),
    notes: s.notes || {},
    custom: s.custom || [],
    flags: s.flags || {},
    stories: { read: {}, fav: {}, ...(s.stories || {}) },
  };
}

export function createStore(storage = (typeof localStorage !== "undefined" ? localStorage : null)) {
  let state;
  try {
    const raw = storage && storage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : defaultState();
  } catch {
    state = defaultState();
  }
  const listeners = new Set();

  function save() {
    try { storage && storage.setItem(KEY, JSON.stringify(state)); } catch { /* depolama dolu/kapalı olabilir */ }
    listeners.forEach((f) => f(state));
  }

  function dayStats(day = dayNumber()) {
    const d = state.stats.daily;
    if (!d[day]) d[day] = { n: 0, r: 0, q: 0, ok: 0, xp: 0 };
    return d[day];
  }

  /** Bir soru cevaplandığında günlük istatistiği ve seriyi günceller. */
  function recordAnswer({ ok, isNew, xp }, day = dayNumber()) {
    const ds = dayStats(day);
    ds.q++;
    if (ok) ds.ok++;
    ds.xp += xp;
    state.stats.xp += xp;
    if (isNew === "graduated") ds.n++;
    if (isNew === "review") { ds.r++; if (ok) ds.rok = (ds.rok || 0) + 1; }
    touchStreak(day);
  }

  function touchStreak(day) {
    const st = state.stats;
    if (st.last === day) return;
    const gap = day - st.last;
    if (st.last === 0) st.streak = 1;
    else if (gap === 1) st.streak += 1;
    else if (gap === 2 && st.freezes > 0) { st.freezes -= 1; st.streak += 1; }
    else st.streak = 1;
    if (st.streak > 0 && st.streak % 7 === 0 && st.freezes < 2) st.freezes += 1;
    st.best = Math.max(st.best, st.streak);
    st.last = day;
  }

  /** Bugün hiç çalışılmadıysa ve seri kopmuşsa görüntülenecek güncel seri değeri. */
  function currentStreak(day = dayNumber()) {
    const st = state.stats;
    if (!st.last) return 0;
    const gap = day - st.last;
    if (gap <= 1) return st.streak;
    if (gap === 2 && st.freezes > 0) return st.streak;
    return 0;
  }

  return {
    get state() { return state; },
    save, dayStats, recordAnswer, currentStreak,
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
    exportJson() { return JSON.stringify(state); },
    importJson(text) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || !parsed.prog) throw new Error("Geçersiz yedek dosyası");
      state = migrate(parsed);
      save();
    },
    reset() { state = defaultState(); save(); },
  };
}
