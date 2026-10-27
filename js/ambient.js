// Meditasyon için arka plan sesi: WebAudio ile üretilen dalga / yağmur gürültüsü (ses dosyası yok).
let ac = null, nodes = null;

export function startAmbient(kind = "waves") {
  stopAmbient();
  if (kind === "off") return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = ac || new AC();
  if (ac.state === "suspended") ac.resume();
  const len = ac.sampleRate * 4;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (kind === "rain") d[i] = white * 0.5;
    else { last = (last + 0.02 * white) / 1.02; d[i] = last * 3.5; } // kahverengi gürültü
  }
  const src = ac.createBufferSource();
  src.buffer = buf; src.loop = true;
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  gain.gain.value = 0.0;
  let lfo = null;
  if (kind === "rain") { filter.type = "highpass"; filter.frequency.value = 1800; gain.gain.value = 0.16; }
  else {
    filter.type = "lowpass"; filter.frequency.value = 700;
    // Dalga: genliği yavaşça salla
    lfo = ac.createOscillator(); lfo.frequency.value = 0.12;
    const depth = ac.createGain(); depth.gain.value = 0.12;
    lfo.connect(depth); depth.connect(gain.gain); gain.gain.value = 0.2;
    lfo.start();
  }
  src.connect(filter); filter.connect(gain); gain.connect(ac.destination);
  src.start();
  nodes = { src, lfo, gain };
}

export function stopAmbient() {
  if (!nodes) return;
  try { nodes.gain.gain.setTargetAtTime(0, ac.currentTime, 0.2); } catch { /* yok say */ }
  const n = nodes; nodes = null;
  setTimeout(() => { try { n.src.stop(); n.lfo && n.lfo.stop(); } catch { /* yok say */ } }, 400);
}
