// Dokunsal ve işitsel geri bildirim: doğru/yanlış cevapta kısa titreşim ve küçük bir ses (ikisi de ayarlardan kapatılabilir).
let ac = null;

function tone(freq, start, dur, vol = 0.07) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = ac || new AC();
    if (ac.state === "suspended") ac.resume();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine"; o.frequency.value = freq;
    const t0 = ac.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  } catch { /* ses desteklenmiyor */ }
}

/** kind: "ok" | "bad" | "done" */
export function feel(kind, { haptics = true, sfx = false } = {}) {
  if (haptics && navigator.vibrate) {
    try { navigator.vibrate(kind === "bad" ? [40, 40, 40] : kind === "done" ? [30, 40, 30, 40, 60] : 18); } catch { /* yok say */ }
  }
  if (!sfx) return;
  if (kind === "ok") { tone(660, 0, 0.12); tone(880, 0.09, 0.16); }
  else if (kind === "bad") { tone(220, 0, 0.22, 0.06); }
  else if (kind === "done") { tone(523, 0, 0.14); tone(659, 0.12, 0.14); tone(784, 0.24, 0.26); }
}

/** Her gün aynı saatte tekrarlayan bir takvim hatırlatıcısı (.ics). Tarayıcı bildirimi yerine takvim: sunucusuz çalışır. */
export function reminderIcs(hour = 20, minute = 0) {
  const pad = (n) => String(n).padStart(2, "0");
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hour)}${pad(minute)}00`;
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kelime Bahcesi//TR", "BEGIN:VEVENT", "UID:kelime-bahcesi-gunluk@local",
    `DTSTAMP:${stamp}`, `DTSTART:${stamp}`, "DURATION:PT10M", "RRULE:FREQ=DAILY", "SUMMARY:Kelime Bahçesi: bugünkü tekrarların hazır",
    "DESCRIPTION:5 dakikalık tekrar. Aralıklı tekrarın en önemli kuralı: zamanında tekrar.", "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY",
    "DESCRIPTION:Kelime Bahçesi", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
