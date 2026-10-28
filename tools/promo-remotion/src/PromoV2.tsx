import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, continueRender, delayRender } from "remotion";
import TL from "../public/timeline2.json";

export const FPS2 = TL.fps;
export const DURATION2 = Math.ceil(TL.duration * TL.fps);
const S = TL.scenes;
const K = { dark: "#0c1512", dark2: "#173a32", green: "#1a5c4f", greenSoft: "#dcebe5", cream: "#f6f4ec", ink: "#14201c", muted: "#6a756f", amber: "#f2b742", red: "#d9542b", ok: "#2f8a4f", line: "#e2e5dc" };
const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";
const BODY = "Figtree, system-ui, sans-serif";
const SERIF = "'Instrument Serif', 'Times New Roman', serif";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.out(Easing.cubic);

const useFonts = () => {
  const [h] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    const faces = [
      ["Bricolage Grotesque", "bricolage-grotesque-latin-wght-normal.woff2", "200 800", "normal"], ["Bricolage Grotesque", "bricolage-grotesque-latin-ext-wght-normal.woff2", "200 800", "normal"],
      ["Figtree", "figtree-latin-wght-normal.woff2", "300 900", "normal"], ["Figtree", "figtree-latin-ext-wght-normal.woff2", "300 900", "normal"],
      ["Instrument Serif", "instrument-serif-latin-400-italic.woff2", "400", "italic"], ["Instrument Serif", "instrument-serif-latin-ext-400-italic.woff2", "400", "italic"],
    ].map(([n, f, w, st]) => new FontFace(n, `url(${staticFile("fonts/" + f)})`, { weight: w, style: st }));
    Promise.all(faces.map((f) => f.load())).then((l) => { l.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

const useT = () => useCurrentFrame() / FPS2;
const sp = (t: number, at: number, damping = 13, stiffness = 150) => spring({ frame: Math.round((t - at) * FPS2), fps: FPS2, config: { damping, stiffness, mass: 0.7 } });

/** Başlık: kalın grotesk + italik serif vurgu. parts: [metin, vurgu?] */
const Title: React.FC<{ parts: [string, boolean?][]; size?: number; color?: string; accent?: string; at: number; t: number; align?: "center" | "left"; lh?: number }> = ({ parts, size = 92, color = "#fff", accent = K.amber, at, t, align = "center", lh = 1.04 }) => {
  let i = 0;
  return (
    <div style={{ textAlign: align, lineHeight: lh, letterSpacing: "-0.02em" }}>
      {parts.flatMap(([text, em], pi) => text.split(" ").filter(Boolean).map((w) => {
        const p = sp(t, at + i * 0.07, 14, 140); i++;
        return <span key={pi + w + i} style={{ display: "inline-block", marginRight: "0.24em", opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 34}px)`, fontFamily: em ? SERIF : DISPLAY, fontStyle: em ? "italic" : "normal", fontWeight: em ? 400 : 800, fontSize: em ? size * 1.16 : size, color: em ? accent : color }}>{w}</span>;
      }))}
    </div>
  );
};

const Logo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.27, background: K.green, display: "grid", placeItems: "center", boxShadow: `0 ${size * 0.18}px ${size * 0.4}px -${size * 0.16}px rgba(26,92,79,.65)` }}>
    <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 21v-9" /><path d="M12 13c-4.5 0-6.5-2-6.5-5.5C10 7.5 12 9.5 12 13z" /><path d="M12 11c0-4 2.5-6 6.5-6 0 4-2 6-6.5 6z" /></svg>
  </div>
);

const ART = (n: string) => staticFile(`art/${n}.svg`);
const WORDS: [string, string, string][] = [["apple", "apple", "elma"], ["cat", "cat", "kedi"], ["rocket", "rocket", "roket"], ["castle", "castle", "kale"], ["guitar", "guitar", "gitar"]];

const Card: React.FC<{ art: string; word: string; tr: string; w?: number; dim?: number; shadow?: boolean }> = ({ art, word, tr, w = 560, dim = 0 }) => (
  <div style={{ width: w, borderRadius: w * 0.09, background: "#fff", padding: w * 0.07, boxShadow: "0 50px 90px -40px rgba(0,0,0,.65)", filter: `brightness(${1 - dim})`, textAlign: "center" }}>
    <div style={{ background: K.greenSoft, borderRadius: w * 0.07, height: w * 0.62, display: "grid", placeItems: "center" }}><Img src={ART(art)} style={{ width: "72%", height: "72%" }} /></div>
    <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: w * 0.15, marginTop: w * 0.05, color: K.ink, letterSpacing: "-0.02em" }}>{word}</div>
    <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: w * 0.1, color: K.muted, marginTop: -4 }}>{tr}</div>
  </div>
);

const Stamp: React.FC<{ text: string; color: string; p: number }> = ({ text, color, p }) => (
  <div style={{ position: "absolute", left: 40, top: 120, transform: `rotate(-14deg) scale(${1.5 - 0.5 * p})`, opacity: Math.min(1, p * 2.2), border: `7px solid ${color}`, color, borderRadius: 18, padding: "6px 22px", fontFamily: DISPLAY, fontWeight: 800, fontSize: 54, letterSpacing: "0.06em", background: "rgba(255,255,255,.12)" }}>{text}</div>
);

/* ------------------------------------------------------------ sahneler */
const Hook: React.FC<{ t: number }> = ({ t }) => {
  const FIN = [86, 64, 41, 22, 9];
  const times = [0.3, 0.92, 1.55, 2.2, 2.85];
  const k = Math.max(0, times.filter((x) => t >= x).length - 1);
  const lt = t - times[k];
  const slide = ease(interpolate(lt, [0, 0.35], [0, 1], clamp));
  const prev = k > 0 ? WORDS[k - 1] : null;
  const cnt = Math.round(interpolate(lt, [0.05, 0.5], [100, FIN[k]], clamp));
  const stampP = sp(t, times[k] + 0.5, 9, 200);
  const bad = FIN[k] < 60;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(900px 700px at 50% 38%, ${K.dark2} 0%, ${K.dark} 70%)` }}>
      <div style={{ position: "absolute", top: 190, left: 60, right: 60 }}><Title parts={[["Bir kelimeyi"], ["gerçekten", true], ["öğrenmek kaç tekrar sürer?"]]} size={74} at={0.05} t={t} /></div>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 96, color: K.amber, letterSpacing: "-0.02em" }}>%{cnt}<span style={{ fontSize: 40, marginLeft: 10, color: K.amber }}>hatırlama</span></div>
      <div style={{ position: "absolute", left: 260, top: 700 }}>
        {prev && <div style={{ position: "absolute", transform: `translateX(${-slide * 900}px) rotate(${-slide * 10}deg)`, opacity: 1 - slide }}><Card art={prev[0]} word={prev[1]} tr={prev[2]} /></div>}
        <div style={{ position: "relative", transform: `translateX(${(1 - slide) * 900}px) rotate(${(1 - slide) * 9}deg)` }}>
          <Card art={WORDS[k][0]} word={WORDS[k][1]} tr={WORDS[k][2]} />
          <Stamp text={bad ? "UNUTTUN" : "HATIRLADIN"} color={bad ? K.red : K.ok} p={stampP} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Stop: React.FC<{ t: number }> = ({ t }) => {
  const lt = t - S.stop;
  const p = sp(t, S.stop, 9, 190);
  const flash = interpolate(lt, [0, 0.05, 0.28], [0.55, 0.55, 0], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(900px 700px at 50% 38%, ${K.dark2} 0%, ${K.dark} 70%)` }}>
      <div style={{ position: "absolute", left: 260, top: 700, transform: `scale(${1 + lt * 0.015})` }}><Card art={WORDS[4][0]} word={WORDS[4][1]} tr={WORDS[4][2]} dim={0.55} /></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 780, textAlign: "center", transform: `scale(${1.7 - 0.7 * p}) rotate(${-5 + 4 * p}deg)`, opacity: Math.min(1, p * 3), fontFamily: DISPLAY, fontWeight: 800, fontSize: 330, color: "#fff", letterSpacing: "-0.04em", textShadow: "0 20px 60px rgba(0,0,0,.5)" }}>Dur!</div>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

const Ask: React.FC<{ t: number }> = ({ t }) => {
  const bub = (txt: string, at: number, style: React.CSSProperties, hi: string) => {
    const p = sp(t, at, 10, 190);
    return <div style={{ position: "absolute", padding: "20px 34px", borderRadius: 999, background: "#fff", fontFamily: DISPLAY, fontWeight: 800, fontSize: 44, color: K.ink, boxShadow: "0 24px 44px -24px rgba(0,0,0,.6)", transform: `scale(${p}) rotate(${(1 - p) * -8 + (style as any).rot}deg)`, opacity: Math.min(1, p * 2), whiteSpace: "nowrap", ...style }}>{txt.replace(hi, "")}<span style={{ color: K.red }}>{hi}</span></div>;
  };
  const cap = sp(t, 6.25, 16, 110);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(900px 700px at 50% 38%, ${K.dark2} 0%, ${K.dark} 70%)` }}>
      <div style={{ position: "absolute", left: 300, top: 380 }}><Card art={WORDS[4][0]} word={WORDS[4][1]} tr={WORDS[4][2]} w={480} /></div>
      {bub("Ne zaman unutuyorsun?", 5.35, { left: 40, top: 350, rot: -6 } as any, "unutuyorsun?")}
      {bub("Kaçıncı gün tekrar?", 5.7, { right: 30, top: 600, rot: 5 } as any, "tekrar?")}
      {bub("Yine baştan mı?", 6.05, { left: 70, top: 880, rot: -4 } as any, "baştan mı?")}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1060, textAlign: "center", opacity: cap, transform: `translateY(${(1 - cap) * 30}px)` }}>
        <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 46, color: "rgba(255,255,255,.8)" }}>Tekrarı</div>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 118, color: "#fff", lineHeight: 1.02, padding: "0 50px" }}>zamanında yaptın mı?</div>
      </div>
    </AbsoluteFill>
  );
};

const Brand: React.FC<{ t: number }> = ({ t }) => {
  const lt = t - S.brand;
  const a = sp(t, S.brand + 0.1, 14, 130), b = sp(t, S.brand + 0.55, 14, 120);
  return (
    <AbsoluteFill style={{ background: K.green }}>
      <div style={{ position: "absolute", top: 650, left: 0, right: 0, textAlign: "center", fontFamily: BODY, fontWeight: 600, fontSize: 34, letterSpacing: "0.32em", color: "rgba(255,255,255,.85)", opacity: Math.min(1, a * 2) }}>KELİME BAHÇESİ'NDE</div>
      <div style={{ position: "absolute", top: 720, left: 0, right: 0, textAlign: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 280, color: "#fff", letterSpacing: "-0.05em", transform: `scale(${0.8 + 0.2 * a})`, opacity: Math.min(1, a * 1.6), filter: lt < 0.25 ? "none" : "none" }}>tekrar</div>
      <div style={{ position: "absolute", top: 1010, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 130, color: "rgba(255,255,255,.88)", opacity: Math.min(1, b * 1.6), transform: `translateY(${(1 - b) * 30}px)` }}>zamanlama işi</div>
    </AbsoluteFill>
  );
};

const Ring: React.FC<{ v: number; size: number }> = ({ v, size }) => {
  const r = size / 2 - 12, c = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "#fff", boxShadow: "0 16px 34px -14px rgba(0,0,0,.35)", position: "relative" }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8ece6" strokeWidth={13} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={K.green} strokeWidth={13} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} /></svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center" }}><div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: size * 0.27, color: K.ink, lineHeight: 1 }}>%{Math.round(v)}</div><div style={{ fontFamily: BODY, fontWeight: 800, fontSize: size * 0.1, color: K.muted, letterSpacing: "0.08em" }}>HATIRLAMA</div></div>
    </div>
  );
};

const See: React.FC<{ t: number }> = ({ t }) => {
  const c = sp(t, S.see + 0.25, 15, 110);
  const v = interpolate(t, [11.65, 12.6], [0, 87], { ...clamp, easing: ease });
  const pill = (txt: string, at: number, on = false) => { const p = sp(t, at, 12, 170); return <span style={{ display: "inline-block", margin: "0 8px", padding: "12px 26px", borderRadius: 99, background: on ? K.green : K.greenSoft, color: on ? "#fff" : K.green, fontFamily: DISPLAY, fontWeight: 800, fontSize: 34, transform: `scale(${p})`, opacity: p }}>{txt}</span>; };
  const quote = sp(t, 11.3, 14, 120);
  return (
    <AbsoluteFill style={{ background: K.cream }}>
      <div style={{ position: "absolute", top: 190, left: 40, right: 40 }}><Title parts={[["Kelimenin"], ["ötesini", true], ["gör"]]} size={84} color={K.ink} accent={K.green} at={S.see + 0.1} t={t} /></div>
      <div style={{ position: "absolute", left: 160, top: 410 + (1 - c) * 500, opacity: Math.min(1, c * 2), width: 760, borderRadius: 60, background: "#fff", boxShadow: "0 50px 90px -46px rgba(20,32,28,.5)", overflow: "hidden" }}>
        <div style={{ position: "relative", background: K.greenSoft, height: 430, display: "grid", placeItems: "center" }}>
          <Img src={ART("gift")} style={{ width: 300, height: 300 }} />
          <div style={{ position: "absolute", right: 40, bottom: -64 }}><Ring v={v} size={170} /></div>
        </div>
        <div style={{ padding: "40px 48px 44px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}><span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, color: K.ink, letterSpacing: "-0.03em" }}>give</span><span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 52, color: K.muted }}>fiil</span></div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 48, color: K.green, marginTop: 4 }}>vermek · hediye etmek</div>
          <div style={{ marginTop: 22, marginLeft: -8 }}>{pill("A1", S.see + 0.8, true)}{pill("Anlam", 10.9)}{pill("Dinleme", 11.05)}{pill("Yazma", 11.2)}</div>
          <div style={{ marginTop: 26, padding: "22px 28px", borderRadius: 24, background: "#f2f3ec", opacity: quote, transform: `translateY(${(1 - quote) * 20}px)` }}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: "0.04em", color: K.muted }}>ÖRNEK CÜMLE</div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 54, color: K.ink }}>“Give me the book.”</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SK = [["Anlam", "m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6", 3], ["Dinleme", "M11 5 6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13", 2], ["Yazma", "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z", 2], ["Konuşma", "M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3", 1]] as const;
const Skills: React.FC<{ t: number }> = ({ t }) => {
  const lt = t - S.skills;
  const bars = Array.from({ length: 41 }, (_, i) => {
    const x = (i - 20) / 20, base = Math.exp(-x * x * 2.2);
    const h = 18 + 150 * base * (0.45 + 0.55 * Math.abs(Math.sin(t * 6 + i * 0.7) * Math.cos(t * 3.1 + i * 0.31)));
    return <div key={i} style={{ width: 11, height: h, borderRadius: 6, background: `rgba(255,255,255,${0.35 + 0.65 * base})` }} />;
  });
  const pillP = sp(t, S.skills + 0.15, 14, 150);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(800px 800px at 50% 42%, #22685a 0%, ${K.dark2} 45%, #0a1412 100%)` }}>
      <div style={{ position: "absolute", top: 160, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: pillP, transform: `scale(${pillP})` }}><div style={{ padding: "14px 34px", borderRadius: 99, background: "rgba(255,255,255,.14)", fontFamily: DISPLAY, fontWeight: 800, fontSize: 36, color: "#fff" }}>4 beceri</div></div>
      <div style={{ position: "absolute", top: 260, left: 40, right: 40 }}><Title parts={[["Her kelimede"], ["dört", true], ["beceri"]]} size={86} at={S.skills + 0.25} t={t} /></div>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 7, height: 190, opacity: interpolate(lt, [0.5, 1.0], [0, 1], clamp) }}>{bars}</div>
      <div style={{ position: "absolute", top: 830, left: 70, right: 70, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34 }}>
        {SK.map(([name, d, n], i) => {
          const at = 15.55 + i * 0.4, p = sp(t, at, 11, 160);
          return (
            <div key={name} style={{ transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 2), borderRadius: 44, padding: "36px 24px", textAlign: "center", background: "rgba(255,255,255,.1)", border: "2px solid rgba(255,255,255,.16)" }}>
              <div style={{ width: 120, height: 120, borderRadius: "50%", margin: "0 auto 16px", display: "grid", placeItems: "center", background: i % 2 ? "linear-gradient(145deg,#3c7fc8,#1b4a86)" : "linear-gradient(145deg,#f0876b,#c94a36)", boxShadow: "0 0 0 10px rgba(255,255,255,.08)" }}>
                <svg viewBox="0 0 24 24" width={62} height={62} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
              </div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 48, color: "#fff" }}>{name}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>{[0, 1, 2].map((j) => <svg key={j} viewBox="0 0 24 24" width={50} height={50}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill={j < n && p > 0.6 ? K.amber : "rgba(255,255,255,.25)"} /></svg>)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1500, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 62, color: "rgba(255,255,255,.85)", opacity: interpolate(lt, [3.0, 3.6], [0, 1], clamp) }}>zayıf olanı daha sık sorarız</div>
    </AbsoluteFill>
  );
};

const FEATS: [string, string, string][] = [["Aralıklı tekrar", "Her kelime kendi zamanında gelir", "M12 6v6l4 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"], ["Sana uyarlanır", "Başarına göre aralıklar ayarlanır", "M3 12h4l3-8 4 16 3-8h4"], ["Verin cihazında", "İlerlemen telefonunda saklanır", "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"]];
const Timing: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: K.cream }}>
    <div style={{ position: "absolute", top: 210, left: 40, right: 40 }}><Title parts={[["Zamanında", true], ["tekrar"]]} size={92} color={K.ink} accent={K.green} at={S.timing + 0.1} t={t} /></div>
    <div style={{ position: "absolute", top: 470, left: 80, right: 80, display: "grid", gap: 28 }}>
      {FEATS.map(([a, b, d], i) => {
        const p = sp(t, 20.25 + i * 0.55, 13, 140);
        return (
          <div key={a} style={{ display: "flex", alignItems: "center", gap: 30, padding: "32px 38px", borderRadius: 40, background: "#fff", boxShadow: "0 30px 56px -34px rgba(20,32,28,.45)", transform: `translateY(${(1 - p) * 70}px) scale(${0.94 + 0.06 * p})`, opacity: Math.min(1, p * 2) }}>
            <div style={{ width: 104, height: 104, borderRadius: 30, background: K.greenSoft, display: "grid", placeItems: "center", flex: "none" }}><svg viewBox="0 0 24 24" width={56} height={56} fill="none" stroke={K.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg></div>
            <div><div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: K.ink, letterSpacing: "-0.02em" }}>{a}</div><div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 32, color: K.muted, marginTop: 4 }}>{b}</div></div>
          </div>
        );
      })}
    </div>
    <div style={{ position: "absolute", top: 1170, left: 80, right: 80, padding: "36px 40px 34px", borderRadius: 40, background: "#fff", boxShadow: "0 30px 56px -34px rgba(20,32,28,.45)", opacity: interpolate(t, [21.9, 22.2], [0, 1], clamp) }}>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: K.muted, marginBottom: 26 }}>Tekrar aralığı (gün)</div>
      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(5,1fr)" }}>
        <div style={{ position: "absolute", left: "10%", right: "10%", top: 21, height: 9, background: K.line, borderRadius: 5 }} />
        <div style={{ position: "absolute", left: "10%", top: 21, height: 9, background: K.green, borderRadius: 5, width: `${interpolate(t, [22.1, 22.98], [0, 80], clamp)}%` }} />
        {[1, 3, 7, 30, 120].map((d, i) => { const on = t >= 22.1 + i * 0.22; return <div key={d} style={{ textAlign: "center", position: "relative" }}><div style={{ width: 50, height: 50, margin: "0 auto", borderRadius: "50%", background: on ? K.green : "#fff", border: `9px solid ${on ? K.green : K.line}`, transform: `scale(${on ? 1 + 0.25 * Math.max(0, 1 - (t - 22.1 - i * 0.22) * 5) : 1})` }} /><div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 44, marginTop: 12, color: on ? K.ink : K.muted }}>{d}</div></div>; })}
      </div>
    </div>
  </AbsoluteFill>
);

const Outro: React.FC<{ t: number }> = ({ t }) => {
  const lg = sp(t, S.outro + 0.1, 12, 120), name = sp(t, S.outro + 0.45, 14, 120), line = sp(t, S.outro + 0.9, 16, 100), cta = sp(t, 25.75, 10, 170);
  return (
    <AbsoluteFill style={{ background: K.cream }}>
      <div style={{ position: "absolute", top: 420, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${0.6 + 0.4 * lg})`, opacity: Math.min(1, lg * 2) }}><Logo size={270} /></div>
      <div style={{ position: "absolute", top: 740, left: 0, right: 0, textAlign: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 130, color: K.green, letterSpacing: "-0.03em", opacity: Math.min(1, name * 2), transform: `translateY(${(1 - name) * 30}px)` }}>Kelime Bahçesi</div>
      <div style={{ position: "absolute", top: 905, left: 0, right: 0, textAlign: "center", fontFamily: BODY, fontWeight: 600, fontSize: 30, letterSpacing: "0.34em", color: K.muted, opacity: Math.min(1, name * 2) }}>UNUTMADAN ÖĞREN</div>
      <div style={{ position: "absolute", top: 975, left: 0, right: 0, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 96, color: K.ink, opacity: Math.min(1, line * 2), transform: `translateY(${(1 - line) * 24}px)` }}>günde beş dakika</div>
      <div style={{ position: "absolute", top: 1160, left: 0, right: 0, display: "flex", justifyContent: "center" }}><div style={{ transform: `scale(${cta})`, opacity: Math.min(1, cta * 2), padding: "34px 84px", borderRadius: 999, background: K.green, color: "#fff", fontFamily: DISPLAY, fontWeight: 800, fontSize: 58, boxShadow: "0 30px 60px -28px rgba(26,92,79,.75)" }}>Bahçeni bugün ek</div></div>
      <div style={{ position: "absolute", top: 1330, left: 0, right: 0, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 32, color: K.muted, opacity: interpolate(t, [26.2, 26.6], [0, 1], clamp) }}>4.954 kelime · A1’den C1’e</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ kompozisyon */
type Wipe = "tr" | "br" | "bl" | "fade" | "none";
const LAYERS: { start: number; node: (t: number) => React.ReactNode; wipe: Wipe; dur: number }[] = [
  { start: 0, node: (t) => <Hook t={t} />, wipe: "none", dur: 0 },
  { start: S.stop, node: (t) => <Stop t={t} />, wipe: "none", dur: 0 },
  { start: S.ask, node: (t) => <Ask t={t} />, wipe: "fade", dur: 0.18 },
  { start: S.brand, node: (t) => <Brand t={t} />, wipe: "tr", dur: 0.5 },
  { start: S.see, node: (t) => <See t={t} />, wipe: "br", dur: 0.55 },
  { start: S.skills, node: (t) => <Skills t={t} />, wipe: "fade", dur: 0.5 },
  { start: S.timing, node: (t) => <Timing t={t} />, wipe: "bl", dur: 0.55 },
  { start: S.outro, node: (t) => <Outro t={t} />, wipe: "fade", dur: 0.5 },
];
const wipeStyle = (w: Wipe, p: number): React.CSSProperties => {
  const e = Easing.inOut(Easing.cubic)(p), r = (1 - e) * 100;
  if (w === "tr") return { clipPath: `inset(0 0 ${r}% ${r}%)` };
  if (w === "br") return { clipPath: `inset(${r}% 0 0 ${r}%)` };
  if (w === "bl") return { clipPath: `inset(${r}% ${r}% 0 0)` };
  if (w === "fade") return { opacity: p };
  return {};
};

export const PromoV2: React.FC<{ voice?: boolean }> = ({ voice = true }) => {
  useFonts();
  const t = useT();
  const idx = LAYERS.reduce((a, l, i) => (t >= l.start - l.dur ? i : a), 0);
  const visible = LAYERS.map((l, i) => ({ l, i })).filter(({ i }) => i === idx || i === idx - 1);
  return (
    <AbsoluteFill style={{ background: K.dark }}>
      {visible.map(({ l, i }) => {
        const p = l.dur ? interpolate(t, [l.start - l.dur, l.start], [0, 1], clamp) : 1;
        return <AbsoluteFill key={i} style={wipeStyle(l.wipe, p)}>{l.node(t)}</AbsoluteFill>;
      })}
      <Audio src={staticFile(voice ? "audio2/mix.wav" : "audio2/mix_novo.wav")} />
    </AbsoluteFill>
  );
};
