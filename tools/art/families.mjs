// Aileler: renkler, sayılar, duygu yüzleri, yönler, zaman. Her kelime için kendi çizimi üretilir.
import { T, INK } from "./kit2.mjs";

/* ---------------------------------------------------------------- renkler */
const COLORS = {
  black: ["#7a828a", "#1a1e22", "#050607"], blue: ["#b4dcf8", "#3f86c0", "#1a4f98"], brown: ["#d9aa7a", "#8a5a30", "#4a2a10"],
  green: ["#c0ee88", "#4aa83a", "#1f6a2a"], grey: ["#f1f4f6", "#aab4ba", "#6a767c"], pink: ["#ffd2e0", "#f0709a", "#c4306a"],
  purple: ["#d8c0f8", "#8a5ad0", "#52289a"], red: ["#ff9a8a", "#e02a1a", "#8f0e08"], white: ["#ffffff", "#eef2f4", "#c0ccd2"], yellow: ["#fff8b0", "#ffd028", "#d89a08"],
};
const splash = (name) => (k) => [
  k.P("M48 10c10 0 14 8 22 10 10 2 18 10 16 22-1 8-8 10-6 18 2 10-6 20-18 20-8 0-10-6-18-6-10 0-22-4-24-16-1-8 6-12 4-20-2-12 6-22 18-24 4-1 6-4 6-4z", COLORS[name], { cx: 0.35, cy: 0.3 }),
  k.C(86, 76, 5, COLORS[name]), k.C(12, 80, 3.4, COLORS[name]), k.C(80, 14, 3, COLORS[name]),
  k.G(34, 32, 12, 7, -30, name === "white" ? 0.9 : 0.6), k.G(62, 70, 8, 2.4, -20, 0.2),
].join("");

/* ---------------------------------------------------------------- sayılar */
const NUM = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15",
  sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19", twenty: "20", thirty: "30", forty: "40", fifty: "50", sixty: "60", seventy: "70", eighty: "80", ninety: "90",
  hundred: "100", thousand: "1000", million: "1M", billion: "1B", trillion: "1T", dozen: "12", first: "1st", second: "2nd", third: "3rd", fourth: "4th", fifth: "5th",
};
const number = (word) => (k) => {
  const t = NUM[word];
  const n = parseInt(t, 10);
  const dots = n >= 1 && n <= 10 && /^\d+$/.test(t) ? [...Array(n)].map((_, i) => k.C(48 - (Math.min(n, 5) - 1) * 6 + (i % 5) * 12, 70 + Math.floor(i / 5) * 9, 3.2, "#fff", { op: 0.9 })).join("") : "";
  const size = t.length <= 2 ? 46 : t.length === 3 ? 38 : 30;
  return [
    k.R(10, 10, 76, 76, 18, ["#8fe0c8", "#2a8a74", "#145a4c"], { lin: true, x1: 0.1, y1: 0, x2: 0.9, y2: 1 }), k.X(48, dots ? 52 : 60, t, size), dots, k.G(28, 22, 14, 3, -10, 0.45),
  ].join("");
};

/* ---------------------------------------------------------------- yönler */
const DIR = { up: 0, upwards: 0, right: 90, east: 90, down: 180, downwards: 180, left: 270, west: 270, north: 0, south: 180 };
const COMPASS = { north: "N", south: "S", east: "E", west: "W" };
const direction = (word) => (k) => {
  const r = { rot: DIR[word], rx: 48, ry: 48 };
  const arrow = k.P("M48 14 74 46H58v34H38V46H22z", ["#9fe8d0", "#2a8a74", "#145a4c"], { lin: true, x1: 0.2, y1: 0, x2: 0.8, y2: 1, ...r });
  if (COMPASS[word]) {
    return [k.C(48, 48, 40, ["#f4f7f9", "#cfd8dc"]), k.S("M48 12v8M48 76v8M12 48h8M76 48h8", "#8a98a0", 2.4), k.P("M48 18 60 48H36z", T.red, r), k.P("M48 78 36 48h24z", T.steel, r), k.C(48, 48, 4, T.dark), k.X(48, 15, COMPASS[word] === "N" ? "N" : "", 9, "#fff")].join("");
  }
  const lines = /wards$/.test(word) ? k.S("M30 86h36M38 92h20", "#2a8a74", 3, { op: 0.5, ...r }) : "";
  return [k.C(48, 48, 40, ["#e8f4f0", "#b8d8cc"]), arrow, lines, k.G(34, 30, 10, 3, -30, 0.5)].join("");
};

/* ---------------------------------------------------------------- duygular (yüz) */
const FACE = {
  happy: { skin: "y", eyes: "arc", mouth: "smile", ex: ["blush"] }, glad: { skin: "y", eyes: "arc", mouth: "smile" }, delighted: { skin: "y", eyes: "arc", mouth: "grin", ex: ["blush"] },
  thrilled: { skin: "y", eyes: "star", mouth: "grin", ex: ["sparkle"] }, excited: { skin: "y", eyes: "star", mouth: "grin", ex: ["sparkle"] }, relieved: { skin: "y", eyes: "closed", mouth: "smile", ex: ["sweat"] },
  satisfied: { skin: "y", eyes: "closed", mouth: "smile", ex: ["blush"] }, impressed: { skin: "y", eyes: "wide", mouth: "smile", brows: "up", ex: ["sparkle"] },
  sad: { skin: "b", eyes: "dot", mouth: "frown", brows: "worry", ex: ["tear"] }, sadly: { skin: "b", eyes: "dot", mouth: "frown", brows: "worry", ex: ["tear"] }, unhappy: { skin: "b", eyes: "dot", mouth: "frown", brows: "worry" },
  miserable: { skin: "b", eyes: "closed", mouth: "frown", brows: "worry", ex: ["tear", "tear2"] }, depressed: { skin: "b", eyes: "droop", mouth: "frown", brows: "worry" }, disappointed: { skin: "y", eyes: "droop", mouth: "frown", brows: "worry", ex: ["sweat"] },
  lonely: { skin: "b", eyes: "dot", mouth: "frown", brows: "worry", ex: ["tear"] },
  angry: { skin: "r", eyes: "dot", mouth: "frown", brows: "angry" }, mad: { skin: "r", eyes: "dot", mouth: "frown", brows: "angry", ex: ["steam"] }, furious: { skin: "r", eyes: "dot", mouth: "open", brows: "angry", ex: ["steam"] },
  annoyed: { skin: "y", eyes: "droop", mouth: "flat", brows: "angry" }, frustrated: { skin: "r", eyes: "closed", mouth: "wavy", brows: "angry", ex: ["steam"] },
  afraid: { skin: "g", eyes: "wide", mouth: "wavy", brows: "up", ex: ["sweat"] }, scared: { skin: "g", eyes: "wide", mouth: "open", brows: "up", ex: ["sweat"] }, frightened: { skin: "g", eyes: "wide", mouth: "o", brows: "up", ex: ["sweat"] },
  nervous: { skin: "y", eyes: "wide", mouth: "wavy", brows: "worry", ex: ["sweat"] }, anxious: { skin: "y", eyes: "wide", mouth: "wavy", brows: "worry", ex: ["sweat"] }, worried: { skin: "y", eyes: "dot", mouth: "wavy", brows: "worry", ex: ["sweat"] },
  shy: { skin: "p", eyes: "side", mouth: "smile", ex: ["blush"] }, embarrassed: { skin: "p", eyes: "side", mouth: "wavy", ex: ["blush", "sweat"] }, ashamed: { skin: "p", eyes: "closed", mouth: "frown", ex: ["blush"] },
  surprised: { skin: "y", eyes: "wide", mouth: "o", brows: "up" }, amazed: { skin: "y", eyes: "star", mouth: "o", brows: "up" }, shocked: { skin: "y", eyes: "wide", mouth: "o", brows: "up", ex: ["bolt"] },
  bored: { skin: "y", eyes: "droop", mouth: "flat" }, tired: { skin: "y", eyes: "closed", mouth: "open", ex: ["zzz"] }, sick: { skin: "g", eyes: "droop", mouth: "wavy", ex: ["sweat", "therm"] },
  hungry: { skin: "y", eyes: "dot", mouth: "open", ex: ["drool"] }, thirsty: { skin: "y", eyes: "dot", mouth: "tongue", ex: ["drop"] }, confused: { skin: "y", eyes: "dot", mouth: "wavy", brows: "tilt", ex: ["q"] },
};
const SKIN = { y: ["#fff0a0", "#f0b020", "#b87c0c"], b: ["#d0e6ff", "#7fb0e0", "#3f6fa8"], r: ["#ffb09a", "#e8452a", "#8f1a0c"], g: ["#e0f0b8", "#a8c868", "#6a8f2a"], p: ["#ffd0d8", "#f0a0b0", "#c06880"] };
const emotion = (word) => (k) => {
  const f = FACE[word] || { skin: "y", eyes: "dot", mouth: "flat" };
  const ex = f.ex || [];
  const eyes = {
    dot: k.eye(36, 44, 4) + k.eye(60, 44, 4),
    wide: k.C(36, 44, 7, "#fff") + k.C(60, 44, 7, "#fff") + k.C(36, 44, 3.4, INK) + k.C(60, 44, 3.4, INK) + k.C(35, 42.6, 1.2, "#fff") + k.C(59, 42.6, 1.2, "#fff"),
    arc: k.S("M29 46c3-6 10-6 13 0M54 46c3-6 10-6 13 0", INK, 3.2),
    closed: k.S("M29 44c3 5 10 5 13 0M54 44c3 5 10 5 13 0", INK, 3.2),
    droop: k.S("M29 44h13M54 44h13", INK, 3.2) + k.P("M29 44c0 6 13 6 13 0z", "#59656b", { op: 0.5 }) + k.P("M54 44c0 6 13 6 13 0z", "#59656b", { op: 0.5 }),
    star: k.P("M36 36l2.4 6 6.4.4-5 4 1.8 6.4-5.6-3.6-5.6 3.6 1.8-6.4-5-4 6.4-.4z", "#e8601a") + k.P("M60 36l2.4 6 6.4.4-5 4 1.8 6.4-5.6-3.6-5.6 3.6 1.8-6.4-5-4 6.4-.4z", "#e8601a"),
    side: k.C(38, 44, 4, INK) + k.C(62, 44, 4, INK) + k.C(39.4, 43, 1.2, "#fff") + k.C(63.4, 43, 1.2, "#fff"),
  }[f.eyes];
  const brows = { up: k.S("M28 33c4-4 10-4 14 0M54 33c4-4 10-4 14 0", INK, 2.6), angry: k.S("M28 34l14 6M68 34 54 40", INK, 3.4), worry: k.S("M28 38l14-5M68 38l-14-5", INK, 2.6), tilt: k.S("M28 34l14-3M54 38l14-6", INK, 2.6) }[f.brows] || "";
  const mouth = {
    smile: k.S("M34 62c8 10 20 10 28 0", INK, 3.2), grin: k.P("M32 58h32c0 12-6 18-16 18s-16-6-16-18z", "#7a1a14") + k.P("M34 58h28c0 4-4 5-14 5s-14-1-14-5z", "#fff"),
    frown: k.S("M34 70c8-10 20-10 28 0", INK, 3.2), o: k.E(48, 66, 6, 8, "#7a1a14"), flat: k.S("M36 66h24", INK, 3.2), wavy: k.S("M32 66c4-5 8 5 12 0s8 5 12 0 8 5 8 0", INK, 3),
    open: k.E(48, 66, 10, 9, "#7a1a14"), tongue: k.P("M36 60h24v8c0 8-24 8-24 0z", "#7a1a14") + k.P("M42 66h12v8c0 5-12 5-12 0z", "#ff8a9a"),
  }[f.mouth];
  const extras = {
    blush: k.E(28, 56, 6, 3.4, "#ff6a8a", { op: 0.45 }) + k.E(68, 56, 6, 3.4, "#ff6a8a", { op: 0.45 }),
    sweat: k.P("M76 24c-3 5-4 8-1 9s4-3 1-9z", T.blue), tear: k.P("M34 52c-2 5-3 8 0 8s3-3 0-8z", T.blue), tear2: k.P("M62 52c-2 5-3 8 0 8s3-3 0-8z", T.blue),
    zzz: k.X(80, 28, "z", 16, "#59656b", 800) + k.X(88, 18, "z", 11, "#59656b", 800), q: k.X(80, 30, "?", 26, "#e8601a"),
    drool: k.P("M56 72c-1 6-2 8 1 8s3-2 2-8z", T.blue), drop: k.P("M72 64c-3 5-4 8-1 9s4-3 1-9z", T.blue),
    steam: k.S("M20 20c-4-4 2-6-2-10M76 20c4-4-2-6 2-10", "#aab6bc", 3, { op: 0.9 }), sparkle: k.P("M82 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z", "#ffb02e") + k.P("M14 24l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z", "#ffb02e"),
    bolt: k.P("M80 10 72 26h7l-4 12 11-18h-7z", "#ffb02e"), therm: k.R(70, 60, 6, 22, 3, "#fff") + k.C(73, 82, 5, T.red) + k.R(72, 62, 2, 16, 1, T.red),
  };
  return [k.C(48, 50, 36, SKIN[f.skin], { cx: 0.35, cy: 0.28 }), eyes, brows, mouth, ex.map((e) => extras[e] || "").join(""), k.G(32, 30, 10, 5, -30, 0.5)].join("");
};

/* ---------------------------------------------------------------- zaman */
const cal = (k, head, top, body, hl = []) => {
  let cells = "";
  for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
    const i = r * 7 + c;
    cells += k.R(18 + c * 9.4, 52 + r * 8.4, 7.4, 6.2, 1.4, hl.includes(i) ? top : ["#e8eef2", "#c8d4da"]);
  }
  return [
    k.R(10, 14, 76, 72, 8, ["#ffffff", "#dfe7eb"], { lin: true, x1: 0, y1: 0, x2: 0, y2: 1 }), k.P("M10 22c0-6 4-8 8-8h60c4 0 8 2 8 8v14H10z", top, { lin: true }),
    k.R(28, 8, 4, 12, 2, "#59656b"), k.R(64, 8, 4, 12, 2, "#59656b"), k.X(48, 34, head, 17, "#fff"), body, cells, k.G(24, 20, 14, 2, 0, 0.4),
  ].join("");
};
const WD = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
const MONTHS = { january: "JAN", february: "FEB", march: "MAR", april: "APR", june: "JUN", july: "JUL", august: "AUG", september: "SEP", october: "OCT", november: "NOV", december: "DEC" };
const MCOL = [T.blue, T.blue, T.green, T.green, T.orange, T.orange, T.orange, T.red, T.red, T.brown, T.navy];
const sky = (k, { top, bot, sun, moon, stars, hill = ["#7cc56a", "#2f7a3e"], extra = "" }) => [
  k.R(8, 8, 80, 80, 14, [top[0], bot[1]], { lin: true, x1: 0, y1: 0, x2: 0, y2: 1 }),
  stars ? [[24, 24], [40, 18], [66, 28], [74, 16], [54, 38], [20, 44]].map(([x, y]) => k.C(x, y, 1.6, "#fff")).join("") : "",
  sun ? k.C(sun[0], sun[1], sun[2], ["#fff8c4", sun[3] || "#ffcf3a", "#f2961c"]) + k.C(sun[0], sun[1], sun[2] + 8, "#ffe27a", { op: 0.3 }) : "",
  moon ? k.P("M62 22c-14 2-22 12-20 26 2 12 12 18 24 16-10-4-14-12-12-22 1-8 4-14 8-20z", ["#fff8d0", "#e0c860"]) : "",
  k.P(`M8 80c14-14 30-18 44-10 12 6 24 2 36-8v26H8z`, hill, { lin: true, x1: 0, y1: 0, x2: 0, y2: 1 }), extra,
].join("");
const clockFace = (k, h, m, tint = ["#ffffff", "#e0e6ea"]) => {
  let t = "";
  for (let a = 0; a < 360; a += 30) t += k.S("M48 18v4", INK, a % 90 === 0 ? 2.6 : 1.4, { rot: a, rx: 48, ry: 48 });
  const ha = (h % 12) * 30 + m * 0.5, ma = m * 6;
  return [k.C(48, 48, 38, ["#c79a6b", "#5e3b1d"]), k.C(48, 48, 32, tint), t, k.S("M48 48v-16", INK, 3.6, { rot: ha, rx: 48, ry: 48 }), k.S("M48 48v-24", INK, 2.4, { rot: ma, rx: 48, ry: 48 }), k.C(48, 48, 3, T.red), k.G(36, 30, 12, 5, -35, 0.5)].join("");
};
const TIME = {
  afternoon: (k) => sky(k, { top: ["#bfe6fa", "#9fd4f6"], bot: ["#e8f6ff", "#bfe6fa"], sun: [66, 28, 12] }),
  morning: (k) => sky(k, { top: ["#ffd9a0", "#ffe9c4"], bot: ["#fff3d8", "#ffe0a8"], sun: [34, 58, 12, "#ffb02e"] }),
  dawn: (k) => sky(k, { top: ["#c8a8f0", "#8a6ad0"], bot: ["#ffd0d8", "#ffb8a8"], sun: [48, 62, 10, "#ff8a5a"] }),
  evening: (k) => sky(k, { top: ["#8a6ad0", "#4a3a8a"], bot: ["#ffb02e", "#e0602a"], sun: [60, 60, 12, "#ff6a3a"], hill: ["#4a3a6a", "#1a1030"] }),
  night: (k) => sky(k, { top: ["#27406e", "#0e1a3a"], bot: ["#27406e", "#0e1a3a"], moon: true, stars: true, hill: ["#2a3a6a", "#0a1230"] }),
  day: (k) => sky(k, { top: ["#8fd0f0", "#5aa8d8"], bot: ["#bfe6fa", "#8fd0f0"], sun: [48, 34, 13] }),
  midnight: (k) => [k.R(8, 8, 80, 80, 14, ["#27406e", "#0e1a3a"], { lin: true, x1: 0, y1: 0, x2: 0, y2: 1 }), [[20, 20], [74, 18], [24, 74], [74, 72]].map(([x, y]) => k.C(x, y, 1.6, "#fff")).join(""), clockFace(k, 12, 0, ["#27406e", "#14234a"]).replace(new RegExp(INK, "g"), "#fff")].join(""),
  noon: (k) => [k.R(8, 8, 80, 80, 14, ["#8fd0f0", "#bfe6fa"], { lin: true, x1: 0, y1: 0, x2: 0, y2: 1 }), k.C(72, 24, 10, ["#fff8c4", "#ffcf3a", "#f2961c"]), clockFace(k, 12, 0)].join(""),
  "o'clock": (k) => clockFace(k, 3, 0), hour: (k) => clockFace(k, 4, 0) + k.P("M48 48 60 29a24 24 0 0 1 12 12z", T.red, { op: 0.35 }),
  minute: (k) => [k.R(44, 6, 8, 8, 2, "#59656b"), k.S("M70 20l6-6", "#59656b", 4), clockFace(k, 12, 25).replace('r="38"', 'r="38"')].join("") + k.P("M48 48V24a24 24 0 0 1 24 24z", T.green, { op: 0.35 }),
  week: (k) => cal(k, "WEEK", T.purple, "", [7, 8, 9, 10, 11, 12, 13]), weekend: (k) => cal(k, "SAT SUN", T.orange, "", [12, 13]), month: (k) => cal(k, "MONTH", T.blue, "", [...Array(28).keys()]),
  year: (k) => cal(k, "YEAR", T.green, k.S("M70 46a22 22 0 1 0-6 16", T.green[1], 3, { op: 0 }), [...Array(28).keys()].filter((i) => i % 2 === 0)),
  season: (k) => [
    k.R(8, 8, 38, 38, 10, ["#bfe6fa", "#7cc56a"], { lin: true }), k.C(27, 28, 8, T.pink), k.R(46, 8, 42, 38, 10, ["#bfe6fa", "#ffcf3a"], { lin: true }), k.C(66, 27, 9, ["#fff8c4", "#ffb02e"]),
    k.R(8, 50, 38, 38, 10, ["#ffd9a0", "#e0701a"], { lin: true }), k.P("M27 58c8 4 10 12 6 20-8 2-14-4-12-12z", T.orange), k.R(46, 50, 42, 38, 10, ["#e8f6ff", "#9fd4f6"], { lin: true }), k.S("M67 58v22M56 62l22 14M56 76l22-14", "#6fb6e4", 2.4),
  ].join(""),
  spring: (k) => sky(k, { top: ["#bfe6fa", "#9fd4f6"], bot: ["#e8f6ff", "#bfe6fa"], sun: [70, 24, 9], extra: [k.S("M30 74v-14", "#3a7a2e", 3), k.C(30, 56, 6, T.pink), k.C(30, 56, 2.6, T.yellow), k.S("M56 76v-10", "#3a7a2e", 3), k.C(56, 62, 5, "#fff"), k.C(56, 62, 2.2, T.yellow)].join("") }),
  summer: (k) => sky(k, { top: ["#8fd0f0", "#4aa0d8"], bot: ["#e8f6ff", "#8fd0f0"], sun: [62, 30, 15], hill: ["#fbe9b8", "#e0be78"] }),
  autumn: (k) => sky(k, { top: ["#ffe0b0", "#ffc88a"], bot: ["#fff0d8", "#ffe0b0"], hill: ["#d9a86c", "#8f5f33"], extra: [k.P("M28 28c8 4 10 12 6 20-8 2-14-4-12-12z", T.orange), k.P("M62 40c6 3 8 9 5 15-6 1-11-3-9-9z", T.red), k.P("M46 20c5 3 6 8 3 12-5 1-9-2-8-7z", T.yellow)].join("") }),
  winter: (k) => sky(k, { top: ["#c8dcf0", "#8fb0d8"], bot: ["#f4faff", "#d8e8f6"], hill: ["#ffffff", "#d3e0ee"], extra: [...[[24, 26], [60, 20], [72, 44], [36, 48]].map(([x, y]) => k.S(`M${x} ${y - 4}v8M${x - 4} ${y}h8M${x - 3} ${y - 3}l6 6M${x + 3} ${y - 3}l-6 6`, "#fff", 1.6))].join("") }),
};

export function familyEntries(words) {
  const out = {};
  for (const w of words) {
    if (COLORS[w.word]) out[w.word] = splash(w.word);
    else if (NUM[w.word]) out[w.word] = number(w.word);
    else if (DIR[w.word] != null) out[w.word] = direction(w.word);
    else if (FACE[w.word]) out[w.word] = emotion(w.word);
    else if (WD[w.word] != null) out[w.word] = (k) => cal(k, w.word.slice(0, 3).toUpperCase(), T.red, "", [WD[w.word], WD[w.word] + 7, WD[w.word] + 14, WD[w.word] + 21]);
    else if (MONTHS[w.word]) { const i = Object.keys(MONTHS).indexOf(w.word); out[w.word] = (k) => cal(k, MONTHS[w.word], MCOL[i], "", [i % 28, (i * 3 + 9) % 28]); }
    else if (TIME[w.word]) out[w.word] = TIME[w.word];
  }
  return out;
}
export const FAMILY_WORDS = [...Object.keys(COLORS), ...Object.keys(NUM), ...Object.keys(DIR), ...Object.keys(FACE), ...Object.keys(WD), ...Object.keys(MONTHS), ...Object.keys(TIME)];
