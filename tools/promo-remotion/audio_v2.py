"""Tanıtım v2 sesi: Türkçe seslendirme (Piper, CC0 veri) + sentezlenmiş müzik + sentezlenmiş ses efektleri (whoosh, pop, vuruş).
Kullanım: python3 audio_v2.py <piper-ses-klasörü> <public> [--no-vo]
Çıktı: public/audio2/{vo,music,sfx,mix,mix_novo}.wav. Zamanlar public/timeline2.json ile aynıdır."""
import sys, io, os, json, wave, subprocess, numpy as np
from piper import PiperVoice, SynthesisConfig

SR = 44100
model_dir, pub = sys.argv[1], sys.argv[2]
TL = json.load(open(f"{pub}/timeline2.json")); DUR = TL["duration"]; S = TL["scenes"]
N = int(DUR * SR); rng = np.random.default_rng(5)
os.makedirs(f"{pub}/audio2", exist_ok=True)

VO = [  # (başlangıç, en geç bitiş, metin)
    (0.35, 3.5, "Bir kelimeyi gerçekten öğrenmek, kaç tekrar sürer?"),
    (3.74, 4.6, "Dur!"),
    (4.7, 7.0, "Onu hâlâ hatırlıyor musun?"),
    (7.55, 10.2, "Kelime Bahçesi, tekrarı senin yerine zamanlar."),
    (10.4, 14.5, "Kelimenin ötesini gör: çizim, anlam, örnek cümle."),
    (15.0, 19.3, "Anlam, dinleme, yazma, konuşma. Zayıf olanı daha sık sorar."),
    (19.85, 23.5, "Doğru zamanda tekrar: bir, üç, yedi, otuz gün."),
    (24.15, 27.9, "Kelime Bahçesi. Unutmadan öğren!"),
]
name = [p for p in os.listdir(model_dir) if p.endswith(".onnx")][0]
voice = PiperVoice.load(f"{model_dir}/{name}", config_path=f"{model_dir}/{name}.json")
def synth(text, scale):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=scale, noise_scale=0.7, noise_w_scale=0.85))
    buf.seek(0)
    with wave.open(buf) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768, w.getframerate()
def ff(x, flt):
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", flt, "-f", "f32le", "-ar", str(SR), "-ac", "1", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32)
def add(buf, x, at, g=1.0):
    i = int(at * SR)
    if i < 0 or i >= N: return
    x = x[: N - i]; buf[i:i + len(x)] += x * g

vo = np.zeros(N, np.float32)
for st, en, text in VO:
    scale = 1.2 if 'Unutmadan' in text or text == 'Dur!' else 1.08
    for _ in range(4):
        x, sr = synth(text, scale); d = len(x) / sr
        if d <= (en - st) * 0.98: break
        scale *= max(0.8, (en - st) * 0.97 / d)
    x = np.interp(np.arange(int(len(x) * SR / sr)) / (SR / sr), np.arange(len(x)), x)
    x = ff(x, "lowpass=f=9500")
    add(vo, x, st)
    print(f"{st:5.2f}  {len(x)/SR:4.2f}s (pencere {en-st:.2f}s, ölçek {scale:.2f})  {text}")
vo = ff(vo, "highpass=f=85,equalizer=f=220:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=8:release=140,aecho=0.8:0.3:30:0.15,loudnorm=I=-15:TP=-1.5:LRA=7")
vo = vo[:N] if len(vo) >= N else np.pad(vo, (0, N - len(vo)))

# ------------------------------------------------------------ ses efektleri
def env(n, a=0.004, d=0.2):
    t = np.arange(n) / SR; return np.minimum(t / a, 1) * np.exp(-t / d)
def whoosh(dur=0.75, up=True):
    n = int(SR * dur); t = np.linspace(0, 1, n)
    noise = rng.standard_normal(n).astype(np.float32)
    a = (0.02 + 0.5 * (t if up else 1 - t) ** 2)          # tek kutuplu süzgeç: kesim frekansı süpürülür
    y = np.zeros(n, np.float32); s = 0.0
    for i in range(n): s += a[i] * (noise[i] - s); y[i] = s
    e = np.sin(np.pi * t) ** 1.5
    return y * e * 2.2
def pop(f=720, d=0.09):
    n = int(SR * 0.16); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(f * (1 + 0.8 * np.exp(-t * 40))) / SR) * np.exp(-t / d)).astype(np.float32) * 0.5
def tick():
    n = int(SR * 0.03); x = ff(rng.standard_normal(n), "highpass=f=2500")
    return (x * np.exp(-np.arange(n) / SR * 160)).astype(np.float32) * 0.5
def impact():
    n = int(SR * 1.0); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * np.cumsum(46 + 90 * np.exp(-t * 14)) / SR) * np.exp(-t * 4.2)
    hit = ff(rng.standard_normal(n), "lowpass=f=900") * np.exp(-t * 9)
    return (low * 1.0 + hit * 0.5).astype(np.float32)
def ding(f=1318, d=0.9):
    n = int(SR * d); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t)) * env(n, 0.002, 0.35)).astype(np.float32) * 0.35
sfx = np.zeros(N, np.float32)
# kanca: kart geçişlerinde tık
for t in (0.4, 0.95, 1.55, 2.2, 2.85): add(sfx, tick(), t, 0.9); add(sfx, pop(520 - (t * 40)), t, 0.35)
add(sfx, whoosh(0.5, True), S["stop"] - 0.45, 0.35); add(sfx, impact(), S["stop"], 0.9)
for t in (5.35, 5.7, 6.05): add(sfx, pop(780 + (t - 5.35) * 300), t, 0.8)
add(sfx, whoosh(0.8, True), S["brand"] - 0.5, 0.45); add(sfx, impact(), S["brand"] + 0.05, 0.5)
add(sfx, pop(640), 8.15, 0.7); add(sfx, pop(840), 8.55, 0.7)
add(sfx, whoosh(0.7, False), S["see"] - 0.35, 0.4)
for t in (10.6, 11.0, 11.35): add(sfx, pop(700 + (t - 10.6) * 180), t, 0.6)
for k in range(8): add(sfx, tick(), 11.7 + k * 0.1, 0.55)
add(sfx, ding(), 12.65, 0.9)
add(sfx, whoosh(0.7, True), S["skills"] - 0.4, 0.4)
for i, t in enumerate((15.55, 15.95, 16.35, 16.75)): add(sfx, pop(640 + 90 * i), t, 0.7)
add(sfx, whoosh(0.7, False), S["timing"] - 0.4, 0.4)
for t in (20.25, 20.8, 21.35): add(sfx, pop(700 + (t - 20.25) * 200), t, 0.7)
for i in range(5): add(sfx, tick(), 22.1 + i * 0.22, 0.6); add(sfx, ding(660 * (1 + i * 0.12), 0.4), 22.1 + i * 0.22, 0.25)
add(sfx, whoosh(0.6, True), S["outro"] - 0.35, 0.35)
for i, m in enumerate((72, 76, 79, 84)): add(sfx, ding(440 * 2 ** ((m - 69) / 12), 1.4), S["outro"] + 0.15 + i * 0.1, 0.6)
add(sfx, pop(900), 25.75, 0.7)
sfx = ff(sfx, "highpass=f=60")

# ------------------------------------------------------------ müzik
BPM = 108; beat = 60 / BPM
def pluck(f, dur=0.45, br=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    return (sum((1 / h**1.4) * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (3 + h * 2.2 / br)) for h in range(1, 7)) * env(n, 0.003, 0.25)).astype(np.float32)
def bell(f, dur=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.45 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * env(n, 0.002, 0.4)).astype(np.float32)
def bass(f, dur=0.45):
    n = int(SR * dur); t = np.arange(n) / SR
    return ((np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2 * t)) * env(n, 0.01, 0.3)).astype(np.float32)
def kick():
    n = int(SR * 0.28); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(48 + 90 * np.exp(-t * 28)) / SR) * np.exp(-t * 11)).astype(np.float32)
def clap():
    n = int(SR * 0.16); return (ff(rng.standard_normal(n), "highpass=f=900,lowpass=f=6500") * np.exp(-np.arange(n) / SR * 28) * 0.5).astype(np.float32)
def hat():
    n = int(SR * 0.05); return (ff(rng.standard_normal(n), "highpass=f=7000") * np.exp(-np.arange(n) / SR * 70) * 0.35).astype(np.float32)
fm = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])]   # Am F C G
MEL = {0: [81, 76, 79, 76], 1: [81, 77, 81, 84], 2: [79, 76, 72, 76], 3: [79, 74, 79, 83]}
def gain(t):
    if t < S["stop"]: return 0.55
    if t < S["stop"] + 0.9: return 0.06
    if t < S["brand"]: return 0.6
    if t < S["skills"]: return 1.0
    if t < S["timing"]: return 0.62
    if t < S["outro"]: return 1.0
    return 0.75
music = np.zeros(N, np.float32); pad = np.zeros(N, np.float32)
for bar in range(int(DUR / (4 * beat)) + 1):
    t0 = bar * 4 * beat; root, tri = CH[bar % 4]
    n = int(SR * 4 * beat); tt = np.arange(n) / SR
    pe = np.minimum(tt / 0.8, 1) * np.minimum((4 * beat - tt) / 0.6 + 0.2, 1)
    for m in tri: add(pad, (np.sin(2 * np.pi * fm(m - 12) * tt) + 0.3 * np.sin(2 * np.pi * fm(m) * tt)).astype(np.float32) * pe, t0, 0.13)
    full = (S["brand"] <= t0 < S["skills"]) or (S["timing"] <= t0 < S["outro"])
    for k in range(8):
        tk = t0 + k * beat / 2
        if tk >= DUR - 3: break
        if not (S["stop"] <= tk < S["stop"] + 0.9) and tk > 0.3:
            m = tri[[0, 1, 2, 1, 0, 2, 1, 2][k]] + (12 if k % 4 == 3 else 0)
            add(music, pluck(fm(m), 0.45, 1.1 if full else 0.7), tk, 0.20 if full else 0.14)
            if full or tk > S["ask"]: add(music, hat(), tk, 0.9 if k % 2 else 0.5)
    if full:
        for k in range(4):
            tk = t0 + k * beat
            if k in (0, 2): add(music, kick(), tk, 0.62)
            if k in (1, 3): add(music, clap(), tk, 0.55)
            add(music, bass(fm(root + (12 if k == 2 else 0)), 0.5), tk, 0.42)
        for k, m in enumerate(MEL[bar % 4]): add(music, bell(fm(m)), t0 + k * beat, 0.11)
    elif S["skills"] <= t0 < S["timing"]:
        for k, m in enumerate(MEL[bar % 4]): add(music, bell(fm(m - 12), 1.4), t0 + k * beat, 0.12)
for m in (57, 64, 69, 76): add(music, pluck(fm(m), 2.2, 0.6), S["outro"] + 0.15, 0.14)
music += pad
music *= np.array([gain(i / SR) for i in range(0, N, 441)], np.float32).repeat(441)[:N]
ir = (rng.standard_normal(int(SR * 0.9)) * np.exp(-np.arange(int(SR * 0.9)) / SR * 4.5)).astype(np.float32)
rev = np.fft.irfft(np.fft.rfft(music, N + len(ir)) * np.fft.rfft(ir, N + len(ir)))[:N].astype(np.float32)
music = ff(music + 0.12 * rev / (np.abs(rev).max() + 1e-6) * np.abs(music).max(), "lowpass=f=9000,highpass=f=40")
music = music / (np.abs(music).max() + 1e-6) * 0.9
tt_ = np.arange(N) / SR
e = np.abs(vo); k = int(SR * 0.12)
e = np.convolve(e, np.ones(k) / k, mode="same"); e = np.clip(e / (np.percentile(e[e > 1e-4], 90) + 1e-6), 0, 1)
e = np.convolve(e, np.ones(int(SR * 0.25)) / int(SR * 0.25), mode="same")
music = (music * (1 - 0.55 * e) * np.minimum(1, tt_ / 0.6) * np.minimum(1, (DUR - tt_) / 1.8)).astype(np.float32)

def wav(path, L, R):
    st = np.stack([L, R], 1); st = np.clip(st / max(1, np.abs(st).max() / 0.97), -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
d = int(SR * 0.011); mR = np.concatenate([np.zeros(d, np.float32), music[:-d]])
wav(f"{pub}/audio2/vo.wav", vo, vo); wav(f"{pub}/audio2/music.wav", 0.5 * music, 0.5 * mR); wav(f"{pub}/audio2/sfx.wav", sfx, sfx)
wav(f"{pub}/audio2/mix.wav", 0.5 * music + 0.95 * vo + 0.9 * sfx, 0.5 * mR + 0.95 * vo + 0.9 * sfx)
wav(f"{pub}/audio2/mix_novo.wav", 0.62 * music + 0.9 * sfx, 0.62 * mR + 0.9 * sfx)
print("tamam", DUR, "sn")
