import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender } from "remotion";
import vo from "../public/vo.json";

export const FPS = 30;
const C = { bg: "#f4f5f1", ink: "#17231f", muted: "#5b6862", pri: "#1a5c4f", priSoft: "#dcebe5", acc: "#d9542b", accSoft: "#fbe4da", ok: "#2f8a4f", bd: "#dde2dc", star: "#e5a62a" };
const sec = (s: number) => Math.round(s * FPS);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const seg = vo.segments;

// ---------------------------------------------------------------- yazı tipleri
const useFonts = () => {
  const [h] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    const faces = [
      ["Bricolage Grotesque", "bricolage-grotesque-latin-wght-normal.woff2", "200 800"], ["Bricolage Grotesque", "bricolage-grotesque-latin-ext-wght-normal.woff2", "200 800"],
      ["Figtree", "figtree-latin-wght-normal.woff2", "300 900"], ["Figtree", "figtree-latin-ext-wght-normal.woff2", "300 900"],
    ].map(([n, f, w]) => new FontFace(n, `url(${staticFile("fonts/" + f)})`, { weight: w }));
    Promise.all(faces.map((f) => f.load())).then((l) => { l.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};
const DISPLAY = "'Bricolage Grotesque', Figtree, system-ui, sans-serif";
const BODY = "Figtree, system-ui, sans-serif";

// ---------------------------------------------------------------- yardımcılar
const useSpring = (delay = 0, damping = 14, stiffness = 130) => {
  const frame = useCurrentFrame();
  return spring({ frame: frame - delay, fps: FPS, config: { damping, stiffness, mass: 0.8 } });
};

const Scene: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => (
  <Sequence from={from} durationInFrames={to - from}><SceneFx dur={to - from}>{children}</SceneFx></Sequence>
);
const SceneFx: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 9, dur - 9, dur], [0, 1, 1, 0], clamp);
  const y = interpolate(f, [0, 16], [50, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = interpolate(f, [0, dur], [1, 1.035], clamp);       // yavaş yaklaşma
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${y}px) scale(${s})` }}>{children}</AbsoluteFill>;
};

const Words: React.FC<{ text: string; delay?: number; size?: number; color?: string; accent?: Record<number, string>; gap?: number; style?: React.CSSProperties }> = ({ text, delay = 0, size = 104, color = C.ink, accent = {}, gap = 4, style }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1.04, letterSpacing: "-0.03em", textAlign: "center", color, ...style }}>
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: frame - delay - i * gap, fps: FPS, config: { damping: 13, stiffness: 140, mass: 0.7 } });
        return <span key={i} style={{ display: "inline-block", marginRight: "0.26em", opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})`, color: accent[i] || color }}>{w}</span>;
      })}
    </div>
  );
};

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const blob = (x: number, y: number, r: number, c: string, ph: number) => (
    <div style={{ position: "absolute", left: x + Math.sin(t * 0.5 + ph) * 60, top: y + Math.cos(t * 0.4 + ph) * 70, width: r, height: r, borderRadius: "50%", background: c, filter: "blur(120px)", opacity: 0.85 }} />
  );
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {blob(560, -120, 760, "#cfe6dc", 0)}{blob(-260, 1250, 820, "#fbe4da", 2)}{blob(500, 700, 520, "#e9f3d9", 4)}
    </AbsoluteFill>
  );
};

const Phone: React.FC<{ children: React.ReactNode; width?: number; style?: React.CSSProperties }> = ({ children, width = 640, style }) => (
  <div style={{ width, borderRadius: 78, background: "#17231f", padding: 18, boxShadow: "0 70px 130px -50px rgba(23,35,31,.55), 0 0 0 2px #2c3a35 inset", ...style }}>
    <div style={{ borderRadius: 62, overflow: "hidden", position: "relative", background: C.bg, aspectRatio: "1170 / 2532" }}>{children}</div>
  </div>
);
const Shot: React.FC<{ name: string; style?: React.CSSProperties }> = ({ name, style }) => <Img src={staticFile(`shots/${name}.png`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }} />;

const Chip: React.FC<{ label: string; delay: number; style: React.CSSProperties; tone?: "pri" | "acc" }> = ({ label, delay, style, tone = "pri" }) => {
  const p = useSpring(delay, 11, 150);
  return <div style={{ position: "absolute", padding: "20px 38px", borderRadius: 999, fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, background: tone === "pri" ? C.pri : C.acc, color: "#fff", boxShadow: "0 24px 50px -22px rgba(0,0,0,.45)", transform: `scale(${p}) rotate(${(1 - p) * -8}deg)`, opacity: Math.min(1, p * 2), ...style }}>{label}</div>;
};

const Logo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.26, background: C.pri, display: "grid", placeItems: "center", boxShadow: `0 ${size * 0.2}px ${size * 0.4}px -${size * 0.15}px rgba(26,92,79,.6)` }}>
    <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 21v-9" /><path d="M12 13c-4.5 0-6.5-2-6.5-5.5C10 7.5 12 9.5 12 13z" /><path d="M12 11c0-4 2.5-6 6.5-6 0 4-2 6-6.5 6z" /></svg>
  </div>
);

// ---------------------------------------------------------------- altyazı
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cur = seg.find((s) => t >= s.start - 0.05 && t <= s.end + 0.35);
  if (!cur) return null;
  const words = cur.text.replace("…", "…").split(" ");
  const total = words.reduce((a, w) => a + w.length + 2, 0);
  let acc = 0;
  const local = (t - cur.start) / (cur.end - cur.start);
  const o = interpolate(t, [cur.start - 0.05, cur.start + 0.1, cur.end + 0.1, cur.end + 0.35], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom: 64, textAlign: "center", opacity: o }}>
      <div style={{ display: "inline-block", padding: "26px 44px", borderRadius: 40, background: "rgba(23,35,31,.88)", backdropFilter: "blur(6px)", fontFamily: DISPLAY, fontWeight: 800, fontSize: 56, lineHeight: 1.18, color: "#fff", boxShadow: "0 30px 60px -30px rgba(0,0,0,.6)" }}>
        {words.map((w, i) => {
          const a = acc / total; acc += w.length + 2;
          const on = local >= a - 0.02;
          return <span key={i} style={{ marginRight: "0.28em", color: on ? "#fff" : "rgba(255,255,255,.45)", display: "inline-block" }}>{w}</span>;
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- sahneler
const FORGOT = ["give", "always", "brave", "decide", "although", "borrow", "journey", "improve"];
const S1: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [30, 78], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 190, left: 0, right: 0 }}><Words text="Kelimeleri öğreniyorsun…" size={106} /></div>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0 }}><Words text="sonra unutuyorsun." delay={26} size={94} color={C.acc} style={{ padding: "0 40px" }} /></div>
      {FORGOT.map((w, i) => {
        const x = 90 + (i % 4) * 235 + (i % 2) * 20, y0 = 900 + Math.floor(i / 4) * 150;
        const p = interpolate(f, [18 + i * 4, 60 + i * 6, 110], [0, 1, 0.0], clamp);
        const gone = interpolate(f, [50 + i * 5, 90 + i * 5], [1, 0], clamp);
        return <div key={w} style={{ position: "absolute", left: x, top: y0 + (1 - gone) * 40, opacity: Math.min(p, gone * 0.9 + 0.08), filter: `blur(${(1 - gone) * 7}px)`, padding: "16px 30px", borderRadius: 26, background: "#fff", border: `3px solid ${C.bd}`, fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, boxShadow: "0 18px 34px -22px rgba(16,36,30,.35)" }}>{w}</div>;
      })}
      <svg style={{ position: "absolute", left: 70, top: 1130 }} width={940} height={400} viewBox="0 0 940 400">
        <path d="M40 10V370H900" stroke="#c9d0c9" strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M50 40C140 220 280 330 880 360" stroke={C.acc} strokeWidth={14} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      </svg>
    </AbsoluteFill>
  );
};

const S2: React.FC = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [18, 84], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const dots: [number, number, string][] = [[200, 420, "1. gün"], [430, 470, "3. gün"], [760, 450, "7. gün"]];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 200, left: 0, right: 0 }}><Words text="Tam unutacağın" size={104} /></div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0 }}><Words text="anda tekrar et." delay={10} size={104} color={C.pri} /></div>
      <svg style={{ position: "absolute", left: 70, top: 700 }} width={940} height={760} viewBox="0 0 940 760">
        <path d="M40 20V700H900" stroke="#c9d0c9" strokeWidth={6} fill="none" strokeLinecap="round" />
        <line x1={40} x2={900} y1={150} y2={150} stroke="#c9d0c9" strokeWidth={4} strokeDasharray="14 14" />
        <path d="M50 80C100 200 150 300 200 420 L200 100C260 230 340 330 430 470 L430 140C540 250 660 340 760 450 L760 170C800 240 850 280 890 320" stroke={C.pri} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        {dots.map(([x, y, l], i) => {
          const p = spring({ frame: f - 30 - i * 22, fps: FPS, config: { damping: 9, stiffness: 160, mass: 0.7 } });
          return <g key={l} transform={`translate(${x} ${y})`}><circle r={46 * Math.max(0, p)} fill={C.acc} /><circle r={46 * Math.max(0, p) + 14 * Math.max(0, p)} fill="none" stroke={C.acc} strokeOpacity={0.3} strokeWidth={6} /></g>;
        })}
      </svg>
      <div style={{ position: "absolute", left: 70, top: 1500, width: 940, height: 90 }}>
        {dots.map(([x, , l], i) => <div key={l} style={{ position: "absolute", left: x - 90, width: 180, textAlign: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 42, color: C.pri, opacity: interpolate(f, [34 + i * 22, 48 + i * 22], [0, 1], clamp) }}>{l}</div>)}
      </div>
    </AbsoluteFill>
  );
};

const S3: React.FC = () => {
  const f = useCurrentFrame();
  const p = useSpring(14, 15, 110);
  const pop = useSpring(0, 11, 150);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 170, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 36, transform: `scale(${0.6 + 0.4 * pop})`, opacity: pop }}>
        <Logo size={170} /><div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 112, lineHeight: 0.98, letterSpacing: "-0.03em" }}>Kelime<br />Bahçesi</div>
      </div>
      <div style={{ position: "absolute", left: 262, top: 450 + (1 - p) * 1300, transform: `rotate(${(1 - p) * 6}deg)` }}><Phone width={520}><Shot name="home" /></Phone></div>
      <Chip label="Bugünkü plan hazır" delay={44} style={{ left: 40, top: 700 }} />
      <Chip label="≈ 5 dakika" delay={58} tone="acc" style={{ right: 40, top: 980 }} />
    </AbsoluteFill>
  );
};

const S4: React.FC = () => {
  const f = useCurrentFrame();
  const sw = interpolate(f, [34, 58], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const enter = useSpring(0, 16, 110);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 190, left: 0, right: 0 }}><Words text="Gör. Dinle. Yaz. Söyle." size={100} accent={{ 0: C.pri }} /></div>
      <div style={{ position: "absolute", left: 262, top: 440 + (1 - enter) * 900 }}>
        <Phone width={520}>
          <Shot name="correct" />
          <Shot name="intro" style={{ transform: `translateX(${sw * 1250}px) rotate(${sw * 16}deg)`, opacity: 1 - interpolate(f, [52, 62], [0, 1], clamp) }} />
        </Phone>
      </div>
      <Chip label="Çizim + ses" delay={20} style={{ left: 30, top: 600 }} />
      <Chip label="Örnek cümle" delay={32} tone="acc" style={{ right: 30, top: 860 }} />
      <Chip label="Anında geri bildirim" delay={66} style={{ left: 60, top: 1150 }} />
    </AbsoluteFill>
  );
};

const SK = [["Anlam", 3], ["Dinleme", 2], ["Yazma", 2], ["Konuşma", 1]] as const;
const ICONS: Record<string, string> = { Anlam: "m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6", Dinleme: "M11 5 6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13", Yazma: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z", Konuşma: "M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3" };
const Star: React.FC<{ on: number }> = ({ on }) => <svg viewBox="0 0 24 24" width={56} height={56} style={{ transform: `scale(${1 + 0.4 * Math.sin(Math.min(1, on) * Math.PI)})` }}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill={on > 0.5 ? C.star : C.bd} /></svg>;

const S5: React.FC = () => {
  const f = useCurrentFrame();
  const st = interpolate(f, [58, 100], [0, 4], clamp);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 170, left: 0, right: 0 }}><Words text="Her kelimede" size={98} /></div>
      <div style={{ position: "absolute", top: 292, left: 0, right: 0 }}><Words text="4 beceri." delay={8} size={98} color={C.pri} /></div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 500, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        {SK.map(([name, n], i) => {
          const p = spring({ frame: f - 14 - i * 8, fps: FPS, config: { damping: 12, stiffness: 140, mass: 0.8 } });
          const full = n >= 3;
          return (
            <div key={name} style={{ transform: `scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 1.6), background: "#fff", border: `3px solid ${C.bd}`, borderRadius: 46, padding: "38px 30px", textAlign: "center", boxShadow: "0 22px 44px -26px rgba(16,36,30,.35)" }}>
              <div style={{ width: 116, height: 116, borderRadius: "50%", margin: "0 auto 18px", display: "grid", placeItems: "center", background: full ? C.ok : C.priSoft, color: full ? "#fff" : C.pri }}>
                <svg viewBox="0 0 24 24" width={60} height={60} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[name]} /></svg>
              </div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 46 }}>{name}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>{[0, 1, 2].map((j) => <Star key={j} on={j < n ? interpolate(f, [34 + i * 8 + j * 7, 44 + i * 8 + j * 7], [0, 1], clamp) : 0} />)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 1240, background: "#fff", border: `3px solid ${C.bd}`, borderRadius: 46, padding: "40px 42px 36px", boxShadow: "0 22px 44px -26px rgba(16,36,30,.35)", opacity: interpolate(f, [48, 62], [0, 1], clamp), transform: `translateY(${interpolate(f, [48, 66], [40, 0], clamp)}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 36, color: C.muted, fontWeight: 600 }}><span>Tekrar aralığı (gün)</span><span>Sonraki: <b style={{ color: C.ink }}>{st >= 3 ? "7 gün sonra" : "yarın"}</b></span></div>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(5,1fr)", marginTop: 34 }}>
          <div style={{ position: "absolute", left: "10%", right: "10%", top: 22, height: 9, background: C.bd, borderRadius: 5 }} />
          <div style={{ position: "absolute", left: "10%", top: 22, height: 9, background: C.pri, borderRadius: 5, width: `${Math.min(st, 4) / 4 * 80}%` }} />
          {[1, 3, 7, 30, 120].map((d, i) => { const on = st >= i - 0.01 && f > 58; return <div key={d} style={{ textAlign: "center", position: "relative" }}><div style={{ width: 52, height: 52, margin: "0 auto", borderRadius: "50%", background: on ? C.pri : "#fff", border: `9px solid ${on ? C.pri : C.bd}`, transform: `scale(${on && Math.abs(st - i) < 0.5 ? 1.18 : 1})` }} /><div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 46, marginTop: 14, color: on ? C.ink : C.muted }}>{d}</div></div>; })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TILES = ["apple", "cat", "rocket", "castle", "guitar", "camera", "trophy", "tree", "bicycle"];
const S6: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(4954 * Easing.out(Easing.cubic)(interpolate(f, [4, 46], [0, 1], clamp)));
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 140, left: 0, right: 0, textAlign: "center", fontFamily: DISPLAY, fontWeight: 800, fontSize: 168, color: C.pri, letterSpacing: "-0.03em" }}>{n.toLocaleString("tr-TR")}</div>
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 14 }}>
        {["A1", "A2", "B1", "B2", "C1"].map((l, i) => { const p = spring({ frame: f - 10 - i * 4, fps: FPS, config: { damping: 12, stiffness: 170, mass: 0.6 } }); const col = ["#3a8f5c", "#2f7fb0", "#7a5bb5", "#c0742a", "#b8456b"][i]; return <div key={l} style={{ transform: `scale(${p})`, padding: "14px 34px", borderRadius: 99, background: col, color: "#fff", fontFamily: DISPLAY, fontWeight: 800, fontSize: 46 }}>{l}</div>; })}
      </div>
      <div style={{ position: "absolute", top: 430, left: 0, right: 0 }}><Words text="kelime, hepsi görselli" size={70} color={C.ink} delay={14} /></div>
      <div style={{ position: "absolute", left: 100, right: 100, top: 640, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 30 }}>
        {TILES.map((t, i) => { const p = spring({ frame: f - 8 - i * 4, fps: FPS, config: { damping: 11, stiffness: 150, mass: 0.7 } }); return <div key={t} style={{ aspectRatio: "1", borderRadius: 52, background: C.priSoft, display: "grid", placeItems: "center", transform: `scale(${p}) rotate(${(1 - p) * 10}deg)`, boxShadow: "0 24px 44px -28px rgba(16,36,30,.4)" }}><Img src={staticFile(`art/${t}.svg`)} style={{ width: "76%", height: "76%" }} /></div>; })}
      </div>
    </AbsoluteFill>
  );
};

const S7: React.FC = () => {
  const f = useCurrentFrame();
  const p = useSpring(0, 12, 120);
  const cta = useSpring(26, 11, 150);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 430, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 44, transform: `scale(${0.7 + 0.3 * p})`, opacity: p }}>
        <Logo size={290} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, lineHeight: 0.98, letterSpacing: "-0.03em", textAlign: "center" }}>Kelime<br />Bahçesi</div>
      </div>
      <div style={{ position: "absolute", top: 1180, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ transform: `scale(${cta * (1 + 0.04 * Math.sin(Math.max(0, f - 40) / 5))})`, opacity: cta, background: C.pri, color: "#fff", fontFamily: DISPLAY, fontWeight: 800, fontSize: 60, padding: "36px 90px", borderRadius: 48, boxShadow: "0 34px 66px -30px rgba(26,92,79,.75)" }}>Bahçeni bugün ek</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- ana kompozisyon
export const Promo: React.FC = () => {
  useFonts();
  const { durationInFrames } = useVideoConfig();
  const pad = 10;
  const cut = [0, ...seg.slice(1).map((s) => sec(s.start - 0.15)), durationInFrames];
  // 6 sahne: 1-2-3-4(+5 birleşik değil)… segment sırası: [öğreniyorsun, çözüm, bahçesi planlar, görür dinler, zayıf beceri, 4954, bitiş]
  const scenes = [S1, S2, S3, S4, S5, S6, S7];
  return (
    <AbsoluteFill>
      <Background />
      {scenes.map((S, i) => <Scene key={i} from={cut[i]} to={Math.min(durationInFrames, cut[i + 1] + pad)}><S /></Scene>)}
      <Captions />
      <Audio src={staticFile("audio/mix.wav")} />
    </AbsoluteFill>
  );
};
