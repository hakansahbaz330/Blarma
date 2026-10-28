"""Tanıtım videosunun sesi: kendi sentezlediğimiz telifsiz müzik + Türkçe seslendirme (Piper, CC0 ses verisi).
Kullanım: python3 audio.py <ses-modeli-klasörü> <çıktı.wav> [süre]
Ses modeli: vits-piper-tr_TR-fahrettin-medium (CC0 veri). Piper çalışma zamanı GPL; ürettiği ses dosyası ona tabi değildir."""
import sys, wave, subprocess, json, numpy as np
from piper import PiperVoice, SynthesisConfig

SR = 44100
model_dir, out = sys.argv[1], sys.argv[2]
DUR = float(sys.argv[3]) if len(sys.argv) > 3 else 28.0
rng = np.random.default_rng(7)
N = int(SR * DUR)
t = np.arange(N) / SR

# ----------------------------------------------------------------- seslendirme
SCRIPT = [  # (başlangıç, en geç bitiş, metin)
    (0.45, 3.45, "Kelimeleri öğreniyorsun… sonra unutuyorsun."),
    (4.0, 8.4, "Çözüm basit: tam unutacağın anda tekrar et."),
    (9.2, 14.3, "Kelime Bahçesi'nde kelimeyi görür, dinler, örnek cümleyle öğrenirsin."),
    (14.9, 19.8, "Her kelimede dört beceri: anlam, dinleme, yazma ve konuşma."),
    (20.2, 24.2, "Dört bin dokuz yüz elli dört kelime, hepsi görselli."),
    (24.7, 27.8, "Kelime Bahçesi. Günde beş dakika, unutmadan öğren."),
]
name = [p for p in __import__("os").listdir(model_dir) if p.endswith(".onnx")][0]
voice = PiperVoice.load(f"{model_dir}/{name}", config_path=f"{model_dir}/{name}.json")

def synth(text, scale):
    import io
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        voice.synthesize_wav(text, w, syn_config=SynthesisConfig(length_scale=scale, noise_scale=0.55, noise_w_scale=0.7))
    buf.seek(0)
    with wave.open(buf) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return x, w.getframerate()

vo = np.zeros(N, dtype=np.float32)
for start, end, text in SCRIPT:
    scale = 1.0
    for _ in range(4):                      # süre pencereye sığana kadar hızı ayarla
        x, sr = synth(text, scale)
        d = len(x) / sr
        if d <= (end - start) * 0.98: break
        scale *= max(0.8, (end - start) * 0.97 / d)
    # 22,05 kHz → 44,1 kHz (doğrusal ara değer; ardından ffmpeg süzgeçleri)
    x = np.interp(np.arange(int(len(x) * SR / sr)) / (SR / sr), np.arange(len(x)), x)
    i = int(start * SR)
    vo[i:i + len(x)] += x[: N - i]
    print(f"{start:5.2f}s  {len(x)/SR:4.2f}s sürdü (pencere {end-start:.2f}s, hız ölçeği {scale:.2f})  {text}")

def ff(x, flt, rate=SR):
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(rate), "-ac", "1", "-i", "-", "-af", flt, "-f", "f32le", "-ar", str(rate), "-ac", "1", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32)

# ses işleme: alçak kesim, hafif sıkıştırma, sunum bölgesi parlaklığı, çok hafif oda yankısı, seviye
vo = ff(vo, "lowpass=f=9500,highpass=f=85,equalizer=f=220:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=8:release=140,aecho=0.8:0.35:38:0.18,loudnorm=I=-15:TP=-1.5:LRA=7")
vo = vo[:N] if len(vo) >= N else np.pad(vo, (0, N - len(vo)))

# ----------------------------------------------------------------- müzik
BPM = 104
beat = 60 / BPM
def add(buf, x, at):
    i = int(at * SR)
    if i >= N: return
    x = x[: N - i]
    buf[i:i + len(x)] += x

def env(n, a=0.005, d=0.3, s=0.0):
    tt = np.arange(n) / SR
    return np.minimum(tt / a, 1) * (s + (1 - s) * np.exp(-tt / d))

def note_pluck(f, dur=0.5, bright=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    y = sum((1 / h**1.4) * np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * (3 + h * 2.2 / bright)) for h in range(1, 7))
    return (y * env(n, 0.003, 0.25)).astype(np.float32)

def note_bell(f, dur=1.0):
    n = int(SR * dur); tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3.2) + 0.45 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * 11)
    return (y * env(n, 0.002, 0.4)).astype(np.float32)

def note_bass(f, dur=0.45):
    n = int(SR * dur); tt = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * f * 2 * tt)
    return (y * env(n, 0.01, 0.3, 0.25)).astype(np.float32)

def kick():
    n = int(SR * 0.28); tt = np.arange(n) / SR
    f = 48 + 90 * np.exp(-tt * 28)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 11)).astype(np.float32)

def clap():
    n = int(SR * 0.16); x = rng.standard_normal(n)
    x = ff(x, "highpass=f=900,lowpass=f=6500")
    return (x * np.exp(-np.arange(n) / SR * 28) * 0.5).astype(np.float32)

def hat():
    n = int(SR * 0.05); x = ff(rng.standard_normal(n), "highpass=f=7000")
    return (x * np.exp(-np.arange(n) / SR * 70) * 0.35).astype(np.float32)

fm = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [(48, [60, 64, 67]), (55, [59, 62, 67]), (57, [60, 64, 69]), (53, [60, 65, 69])]   # C G Am F
BARS = int(DUR / (4 * beat)) + 1
music = np.zeros(N, dtype=np.float32)
pad = np.zeros(N, dtype=np.float32)
MEL = {0: [76, 79, 84, 79], 1: [74, 79, 83, 79], 2: [72, 76, 81, 76], 3: [72, 77, 81, 77]}
for bar in range(BARS):
    t0 = bar * 4 * beat
    root, tri = CH[bar % 4]
    # pad (yavaş giriş, tüm süre)
    n = int(SR * 4 * beat); tt = np.arange(n) / SR
    pe = np.minimum(tt / 0.8, 1) * np.minimum((4 * beat - tt) / 0.6 + 0.2, 1)
    for m in tri:
        add(pad, (np.sin(2 * np.pi * fm(m - 12) * tt) + 0.3 * np.sin(2 * np.pi * fm(m) * tt)).astype(np.float32) * pe * 0.13, t0)
    sec = lambda a, b: a <= t0 < b
    arp = t0 >= 3.4
    full = 8.4 <= t0 < 24.4
    for k in range(8):                       # sekizlik arpej
        tk = t0 + k * beat / 2
        if arp and tk < 27:
            m = tri[[0, 1, 2, 1, 0, 2, 1, 2][k]] + (12 if k % 4 == 3 else 0)
            add(music, note_pluck(fm(m), 0.45, 1.1 if full else 0.7) * (0.20 if full else 0.15), tk)
        if t0 >= 3.4 and tk < 27.5:
            add(music, hat() * (0.9 if k % 2 else 0.5), tk)
    if full:
        for k in range(4):
            tk = t0 + k * beat
            if k in (0, 2): add(music, kick() * 0.62, tk)
            if k in (1, 3): add(music, clap() * 0.55, tk)
            add(music, note_bass(fm(root + (12 if k == 2 else 0)), 0.5) * 0.42, tk)
        for k, m in enumerate(MEL[bar % 4]):
            add(music, note_bell(fm(m)) * 0.11, t0 + (k * 1.0 + 0.0) * beat)
    if t0 >= 24.4 and t0 < 26.5:
        add(music, kick() * 0.5, t0)
        add(music, note_bass(fm(root), 1.2) * 0.4, t0)
    if bar < 1:                              # girişte tek, yumuşak nota
        add(music, note_bell(fm(76), 1.6) * 0.1, 0.2)
# final akoru
for m in [60, 64, 67, 72]:
    add(music, note_pluck(fm(m), 1.8, 0.6) * 0.16, 27.05 - 0.0)
add(music, note_bell(fm(84), 1.9) * 0.12, 27.05)
music += pad

# oda yankısı (sentetik darbe yanıtı) ve stereo genişletme
ir = (rng.standard_normal(int(SR * 0.9)) * np.exp(-np.arange(int(SR * 0.9)) / SR * 4.5)).astype(np.float32)
rev = np.fft.irfft(np.fft.rfft(music, N + len(ir)) * np.fft.rfft(ir, N + len(ir)))[:N].astype(np.float32)
music = ff(music + 0.12 * rev / (np.abs(rev).max() + 1e-6) * np.abs(music).max(), "lowpass=f=9000,highpass=f=40")
music = music / (np.abs(music).max() + 1e-6) * 0.9
# seslendirmede müziği kıs (ducking) — konuşma zarfından
e = np.abs(vo); k = int(SR * 0.12)
e = np.convolve(e, np.ones(k) / k, mode="same"); e = np.clip(e / (np.percentile(e[e > 1e-4], 90) + 1e-6), 0, 1)
e = np.convolve(e, np.ones(int(SR * 0.25)) / int(SR * 0.25), mode="same")
music = music * (1 - 0.62 * e)
fade = np.minimum(1, t / 0.8) * np.minimum(1, (DUR - t) / 1.6)
music = (music * fade).astype(np.float32)

mix = 0.48 * music + 0.95 * vo
peak = np.abs(mix).max()
if peak > 0.97: mix *= 0.97 / peak
left = mix; right = mix + 0.0
d = int(SR * 0.011)                      # müziğe hafif stereo genişlik (konuşma ortada kalır)
L = 0.48 * music + 0.95 * vo; R = 0.48 * np.concatenate([np.zeros(d, np.float32), music[:-d]]) + 0.95 * vo
st = np.stack([L, R], 1)
st = np.clip(st / max(1, np.abs(st).max() / 0.97), -1, 1)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print("yazıldı:", out)
