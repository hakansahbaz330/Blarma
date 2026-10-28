"""Remotion tanıtım sesi: Türkçe seslendirme (Piper, CC0 ses verisi) + sentezlenmiş müzik.
Kullanım: python3 audio_tr.py <piper-ses-klasörü> <public-klasörü>
Çıktı: public/audio/{vo,music,mix}.wav ve public/vo.json (her cümlenin başlangıç/bitişi; sahne süreleri buradan türer)."""
import sys, io, os, json, wave, subprocess, numpy as np
from piper import PiperVoice, SynthesisConfig

SR = 44100
model_dir, pub = sys.argv[1], sys.argv[2]
LEN = float(os.environ.get("VO_LENGTH", "1.08"))
os.makedirs(f"{pub}/audio", exist_ok=True)
rng = np.random.default_rng(11)

TEXTS = [
    "Kelimeleri öğreniyorsun… sonra unutuyorsun.",
    "Çözüm basit: tam unutacağın anda tekrar et.",
    "Kelime Bahçesi, bunu senin yerine planlar.",
    "Kelimeyi görür, dinler, yazar ve söylersin.",
    "Zayıf olduğun beceri, daha sık karşına gelir.",
    "Dört bin dokuz yüz elli dört kelime, hepsi görselli.",
    "Kelime Bahçesi. Günde beş dakika, unutmadan öğren.",
]
GAP, LEAD, TAIL = 0.55, 0.7, 1.9

name = [p for p in os.listdir(model_dir) if p.endswith(".onnx")][0]
voice = PiperVoice.load(f"{model_dir}/{name}", config_path=f"{model_dir}/{name}.json")

def synth(text):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=LEN, noise_scale=0.7, noise_w_scale=0.85))
    buf.seek(0)
    with wave.open(buf) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return x, w.getframerate()

def ff(x, flt, ch=1):
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", flt, "-f", "f32le", "-ar", str(SR), "-ac", "1", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32)

clips, segs, t = [], [], LEAD
for text in TEXTS:
    x, sr = synth(text)
    x = np.interp(np.arange(int(len(x) * SR / sr)) / (SR / sr), np.arange(len(x)), x)
    x = ff(x, "lowpass=f=9500")                       # ara değerlemenin yüksek frekans yansımasını kes
    segs.append({"start": round(t, 3), "end": round(t + len(x) / SR, 3), "text": text})
    clips.append((t, x))
    t += len(x) / SR + GAP
DUR = segs[-1]["end"] + TAIL
N = int(DUR * SR)
vo = np.zeros(N, np.float32)
for st, x in clips:
    i = int(st * SR); vo[i:i + len(x)] += x
vo = ff(vo, "highpass=f=85,equalizer=f=220:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=8:release=140,aecho=0.8:0.3:30:0.15,loudnorm=I=-15:TP=-1.5:LRA=7")
vo = vo[:N] if len(vo) >= N else np.pad(vo, (0, N - len(vo)))
json.dump({"duration": round(DUR, 3), "segments": segs}, open(f"{pub}/vo.json", "w"), ensure_ascii=False, indent=1)
for s in segs: print(f"{s['start']:5.2f}–{s['end']:5.2f}  {s['text']}")

# ------------------------------------------------------------------ müzik
BPM = 104; beat = 60 / BPM
tt_ = np.arange(N) / SR
def add(buf, x, at):
    i = int(at * SR)
    if i >= N: return
    x = x[: N - i]; buf[i:i + len(x)] += x
def env(n, a=0.005, d=0.3, s=0.0):
    tt = np.arange(n) / SR
    return np.minimum(tt / a, 1) * (s + (1 - s) * np.exp(-tt / d))
def pluck(f, dur=0.5, br=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    y = sum((1 / h**1.4) * np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * (3 + h * 2.2 / br)) for h in range(1, 7))
    return (y * env(n, 0.003, 0.25)).astype(np.float32)
def bell(f, dur=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3.2) + 0.45 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * 11)
    return (y * env(n, 0.002, 0.4)).astype(np.float32)
def bass(f, dur=0.45):
    n = int(SR * dur); tt = np.arange(n) / SR
    return ((np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2 * tt)) * env(n, 0.01, 0.3, 0.25)).astype(np.float32)
def kick():
    n = int(SR * 0.28); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(48 + 90 * np.exp(-tt * 28)) / SR) * np.exp(-tt * 11)).astype(np.float32)
def clap():
    n = int(SR * 0.16); x = ff(rng.standard_normal(n), "highpass=f=900,lowpass=f=6500")
    return (x * np.exp(-np.arange(n) / SR * 28) * 0.5).astype(np.float32)
def hat():
    n = int(SR * 0.05); x = ff(rng.standard_normal(n), "highpass=f=7000")
    return (x * np.exp(-np.arange(n) / SR * 70) * 0.35).astype(np.float32)
fm = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [(48, [60, 64, 67]), (55, [59, 62, 67]), (57, [60, 64, 69]), (53, [60, 65, 69])]
MEL = {0: [76, 79, 84, 79], 1: [74, 79, 83, 79], 2: [72, 76, 81, 76], 3: [72, 77, 81, 77]}
T_ARP, T_FULL, T_END = segs[1]["start"] - 0.4, segs[2]["start"] - 0.5, segs[-1]["start"] - 0.4
music = np.zeros(N, np.float32); pad = np.zeros(N, np.float32)
bars = int(DUR / (4 * beat)) + 1
for bar in range(bars):
    t0 = bar * 4 * beat; root, tri = CH[bar % 4]
    n = int(SR * 4 * beat); tt = np.arange(n) / SR
    pe = np.minimum(tt / 0.8, 1) * np.minimum((4 * beat - tt) / 0.6 + 0.2, 1)
    for m in tri:
        add(pad, (np.sin(2 * np.pi * fm(m - 12) * tt) + 0.3 * np.sin(2 * np.pi * fm(m) * tt)).astype(np.float32) * pe * 0.13, t0)
    full = T_FULL <= t0 < T_END
    for k in range(8):
        tk = t0 + k * beat / 2
        if tk >= T_ARP and tk < segs[-1]["end"] + 0.3:
            m = tri[[0, 1, 2, 1, 0, 2, 1, 2][k]] + (12 if k % 4 == 3 else 0)
            add(music, pluck(fm(m), 0.45, 1.1 if full else 0.7) * (0.20 if full else 0.15), tk)
            add(music, hat() * (0.9 if k % 2 else 0.5), tk)
    if full:
        for k in range(4):
            tk = t0 + k * beat
            if k in (0, 2): add(music, kick() * 0.62, tk)
            if k in (1, 3): add(music, clap() * 0.55, tk)
            add(music, bass(fm(root + (12 if k == 2 else 0)), 0.5) * 0.42, tk)
        for k, m in enumerate(MEL[bar % 4]): add(music, bell(fm(m)) * 0.11, t0 + k * beat)
    if T_END <= t0 < T_END + 4 * beat:
        add(music, kick() * 0.5, t0); add(music, bass(fm(root), 1.2) * 0.4, t0)
    if bar < 1: add(music, bell(fm(76), 1.6) * 0.1, 0.2)
for m in [60, 64, 67, 72]: add(music, pluck(fm(m), 1.8, 0.6) * 0.16, segs[-1]["end"] + 0.1)
add(music, bell(fm(84), 1.9) * 0.12, segs[-1]["end"] + 0.1)
music += pad
ir = (rng.standard_normal(int(SR * 0.9)) * np.exp(-np.arange(int(SR * 0.9)) / SR * 4.5)).astype(np.float32)
rev = np.fft.irfft(np.fft.rfft(music, N + len(ir)) * np.fft.rfft(ir, N + len(ir)))[:N].astype(np.float32)
music = ff(music + 0.12 * rev / (np.abs(rev).max() + 1e-6) * np.abs(music).max(), "lowpass=f=9000,highpass=f=40")
music = music / (np.abs(music).max() + 1e-6) * 0.9
e = np.abs(vo); k = int(SR * 0.12)
e = np.convolve(e, np.ones(k) / k, mode="same"); e = np.clip(e / (np.percentile(e[e > 1e-4], 90) + 1e-6), 0, 1)
e = np.convolve(e, np.ones(int(SR * 0.25)) / int(SR * 0.25), mode="same")
music = music * (1 - 0.62 * e) * np.minimum(1, tt_ / 0.8) * np.minimum(1, (DUR - tt_) / 1.8)
music = music.astype(np.float32)

def wav(path, L, R):
    st = np.stack([L, R], 1); st = np.clip(st / max(1, np.abs(st).max() / 0.97), -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
d = int(SR * 0.011)
mR = np.concatenate([np.zeros(d, np.float32), music[:-d]])
wav(f"{pub}/audio/vo.wav", vo, vo)
wav(f"{pub}/audio/music.wav", 0.48 * music, 0.48 * mR)
wav(f"{pub}/audio/mix.wav", 0.48 * music + 0.95 * vo, 0.48 * mR + 0.95 * vo)
print("süre:", round(DUR, 2), "sn")
