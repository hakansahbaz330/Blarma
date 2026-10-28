// Set 9: meslekler ve kişiler (ortak üst gövde çizimiyle)
import { T, INK } from "./kit2.mjs";
import { bust, hairCap, crown, HAIR, SK } from "./set8.mjs";

const GLASS = (k, c = INK) => k.S("M30 40a8 8 0 1 0 16 0a8 8 0 1 0-16 0M50 40a8 8 0 1 0 16 0a8 8 0 1 0-16 0", c, 2) + k.S("M46 40h4", c, 2);
const SUN = (k) => k.R(29, 36, 17, 9, 4, ["#4a565c", "#0a0e10"]) + k.R(50, 36, 17, 9, 4, ["#4a565c", "#0a0e10"]) + k.S("M46 40h4", INK, 2);
const MUST = (k, c = HAIR.black) => k.P("M36 51c4-3 8-2 12 0 4-2 8-3 12 0-2 4-8 5-12 3-4 2-10 1-12-3z", c);
const BEARD = (k, c = HAIR.gray) => k.P("M28 46c2 16 10 24 20 24s18-8 20-24c-4 6-10 8-20 8s-16-2-20-8z", c);
const TIE = (k, c = T.red) => k.P("M44 62h8l2 8-6 16-6-16z", c, { lin: true });
const COLLAR = (k, c = "#fff") => k.P("M38 62 48 72 58 62l-3-2-7 6-7-6z", c);
const CAPH = (k, c = T.navy) => k.P("M25 34c0-16 10-22 23-22s23 6 23 22z", c, { lin: true }) + k.R(22, 31, 52, 6, 3, ["#2a3a6a", "#101a3a"]) + k.C(48, 14, 3, T.gold);
const HARD = (k, c = T.yellow) => k.P("M24 34c0-18 10-26 24-26s24 8 24 26z", c, { lin: true }) + k.R(20, 31, 56, 6, 3, c) + k.R(44, 10, 8, 22, 2, c);
const HELM = (k, c = ["#8a9a6a", "#4a5a2a"]) => k.P("M24 36c0-18 10-26 24-26s24 8 24 26z", c, { lin: true }) + k.R(22, 32, 52, 5, 2.5, ["#6a7a4a", "#3a4a1a"]);
const BERET = (k, c = T.red) => k.E(46, 22, 26, 10, c, { rot: -10 }) + k.C(60, 12, 2.4, c[1]);
const FEDORA = (k, c = ["#8a6a4a", "#3f2a18"]) => k.E(48, 30, 32, 7, c) + k.P("M30 30c0-14 6-20 18-20s18 6 18 20z", c, { lin: true }) + k.R(30, 24, 36, 5, 1, "#2a1a10");
const MORTAR = (k) => k.P("M48 6 84 18 48 30 12 18z", ["#4a565c", "#161b1d"], { lin: true }) + k.R(32, 24, 32, 8, 3, "#2a3236") + k.S("M80 20v14", T.gold[1], 2) + k.C(80, 36, 2.6, T.gold);
const SCARF = (k, c) => k.R(34, 62, 28, 9, 4, c) + k.R(54, 64, 8, 18, 3, c);
const LABCOAT = ["#ffffff", "#cfd8dc"];
const SUIT = ["#59656b", "#2f3a40"];
const PEN = (k) => k.R(66, 56, 5, 26, 2.5, ["#7fa0d8", "#2a4a86"], { rot: 25, rx: 68, ry: 69 }) + k.P("M62 83 66 80l-1 6z", "#3a3a3a");
const BOOK = (k, c = ["#4a90c8", "#254f86"]) => k.R(60, 70, 26, 20, 2, c) + k.R(63, 72, 21, 16, 1, "#fffaf0");
const MIC = (k) => k.R(66, 52, 10, 20, 5, ["#59656b", "#161b1d"]) + k.S("M71 72v14", "#59656b", 3) + k.S("M68 58h6M68 62h6", "#aab8c0", 1.2);
const HEADSET = (k) => k.S("M28 38c0-16 8-24 20-24s20 8 20 24", "#2a3236", 3) + k.R(24, 36, 8, 14, 4, ["#59656b", "#161b1d"]) + k.R(64, 36, 8, 14, 4, ["#59656b", "#161b1d"]) + k.S("M30 52c4 10 14 12 22 10", "#2a3236", 2) + k.C(54, 62, 2.6, "#2a3236");
const CROSS = (k) => k.R(46, 74, 4, 12, 1, "#fff") + k.R(42, 77, 12, 4, 1, "#fff");
const BADGE = (k) => k.P("M66 72l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z", T.gold);
const WHISTLE = (k) => k.S("M48 62c0 8 6 12 10 12", "#aab8c0", 1.6) + k.E(60, 76, 6, 4, ["#f1f5f7", "#8795a0"]);
const P = (opt) => (k) => bust(k, typeof opt === "function" ? opt(k) : opt);
const hair = (k, c = HAIR.brown) => hairCap(k, c);
const long = (k, c) => k.P("M22 38c-6 20-2 40 6 48h40c8-8 12-28 6-48-4-16-14-22-26-22S26 22 22 38z", c);

export const set9 = {
  accountant: P((k) => ({ shirt: ["#cfeaff", "#5aa8d8"], front: hair(k, HAIR.black), extra: TIE(k, T.navy) + COLLAR(k), late: GLASS(k) + k.R(64, 70, 22, 18, 3, ["#f4f7f9", "#aab8c0"]) + k.R(67, 73, 16, 5, 1, "#59656b") + k.C(70, 82, 1.6, T.red) + k.C(76, 82, 1.6, T.green) + k.C(82, 82, 1.6, T.blue) })),
  actor: P((k) => ({ shirt: ["#4a565c", "#161b1d"], front: hair(k, HAIR.black), extra: COLLAR(k) + k.P("M42 64h12l-3 4h-6z", T.red), late: k.P("M82 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z", T.gold) })),
  actress: P((k) => ({ shirt: ["#ff8aa8", "#a82a4e"], back: long(k, HAIR.blond), front: k.P("M26 36c0-14 8-20 22-20s22 6 22 20c-8-2-16-6-22-12-4 6-12 10-22 12z", HAIR.blond), late: k.C(26, 54, 2.4, T.gold) + k.C(70, 54, 2.4, T.gold) + k.P("M82 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z", T.gold) })),
  architect: P((k) => ({ shirt: ["#cfeaff", "#5aa8d8"], front: hair(k, HAIR.black), late: HARD(k, T.yellow) + GLASS(k) + k.R(62, 66, 8, 26, 3, ["#fffdf6", "#dde4e8"], { rot: 20, rx: 66, ry: 79 }) + k.S("M64 68l-3 22", "#3f86c0", 1.2, { op: 0.8 }) })),
  artist: P((k) => ({ shirt: ["#9fe0c4", "#3f9a78"], front: hair(k, HAIR.brown), late: BERET(k, T.red) + k.S("M74 90 62 62", "#a8703a", 3) + k.P("M62 62l-3-6 6 1z", T.red) })),
  athlete: P((k) => ({ shirt: ["#ffb25a", "#e0701a"], front: hair(k, HAIR.black), late: k.R(26, 24, 44, 6, 3, T.red) })),
  attorney: P((k) => ({ shirt: SUIT, front: hair(k, HAIR.gray), extra: COLLAR(k) + TIE(k, T.navy), late: k.R(60, 72, 28, 18, 3, ["#8a5a2a", "#3f2410"]) + k.R(70, 69, 8, 4, 2, "#3f2410") })),
  lawyer: P((k) => ({ shirt: SUIT, front: hair(k, HAIR.black), extra: COLLAR(k) + TIE(k, T.red), late: k.R(60, 72, 28, 18, 3, ["#8a5a2a", "#3f2410"]) + k.R(70, 69, 8, 4, 2, "#3f2410") })),
  solicitor: P((k) => ({ shirt: ["#6a7a82", "#2a3236"], front: hair(k, HAIR.brown), extra: COLLAR(k) + TIE(k, T.blue), late: GLASS(k) })),
  author: P((k) => ({ shirt: ["#d7bff2", "#8a5cc8"], front: hair(k, HAIR.brown), late: GLASS(k) + BOOK(k, ["#ff8a6a", "#a82410"]) })),
  novelist: P((k) => ({ shirt: ["#ffb8c8", "#c4506a"], back: long(k, HAIR.red), front: k.P("M26 36c0-14 8-20 22-20s22 6 22 20c-8-2-16-6-22-12-4 6-12 10-22 12z", HAIR.red), late: GLASS(k) + PEN(k) })),
  writer: P((k) => ({ shirt: ["#8fd0a0", "#3f9a68"], front: hair(k, HAIR.black), late: PEN(k) + k.R(64, 76, 22, 14, 2, "#fffaf0") })),
  poet: P((k) => ({ shirt: ["#b79be0", "#6a47a8"], front: hair(k, HAIR.brown), extra: SCARF(k, T.red), late: BERET(k, T.navy) + k.P("M72 70c6-4 12 0 12 6-6 2-12 0-12-6z", "#fffaf0") })),
  columnist: P((k) => ({ shirt: ["#e8eef2", "#9aa8b2"], front: hair(k, HAIR.gray), late: GLASS(k) + k.R(60, 70, 26, 20, 2, "#fffdf6") + k.S("M64 76h18M64 81h18M64 86h12", "#6a7a82", 1.4) })),
  boss: P((k) => ({ shirt: ["#4a565c", "#161b1d"], front: hair(k, HAIR.gray), extra: COLLAR(k) + TIE(k, T.gold), late: SUN(k) })),
  manager: P((k) => ({ shirt: SUIT, front: hair(k, HAIR.brown), extra: COLLAR(k) + TIE(k, T.green), late: GLASS(k) + k.R(62, 66, 24, 24, 2, ["#c79a6b", "#7a5230"]) + k.R(66, 71, 16, 4, 1, "#fffaf0") + k.S("M66 80h16M66 85h12", "#fffaf0", 1.4) })),
  businessman: P((k) => ({ shirt: ["#4a565c", "#161b1d"], front: hair(k, HAIR.black), extra: COLLAR(k) + TIE(k, T.red), late: k.R(58, 72, 30, 18, 3, ["#8a5a2a", "#3f2410"]) + k.S("M66 72v-4h14v4", "#59656b", 3) })),
  secretary: P((k) => ({ shirt: ["#cfeaff", "#5aa8d8"], back: long(k, HAIR.brown), front: k.P("M26 36c0-14 8-20 22-20s22 6 22 20c-8-2-16-6-22-12-4 6-12 10-22 12z", HAIR.brown), late: HEADSET(k) })),
  bride: P((k) => ({ shirt: ["#ffffff", "#e6ecef"], back: k.P("M16 90V30c0-16 14-22 32-22s32 6 32 22v60z", ["#ffffff", "#dde6ea"], { op: 0.9 }), front: k.P("M26 36c0-14 8-20 22-20s22 6 22 20c-8-2-16-6-22-12-4 6-12 10-22 12z", HAIR.blond), late: k.P("M30 24c4-10 12-14 18-14s14 4 18 14z", "#fff", { op: 0.9 }) + k.C(70, 82, 7, T.pink) + k.C(78, 78, 5, T.red) + k.C(64, 76, 5, "#fff") })),
  gentleman: P((k) => ({ shirt: ["#4a565c", "#161b1d"], front: hair(k, HAIR.gray), extra: COLLAR(k) + k.P("M42 64h12l-3 5h-6z", T.red), late: MUST(k, HAIR.gray) + k.E(48, 20, 22, 5, "#161b1d") + k.R(34, 2, 28, 18, 3, ["#4a565c", "#161b1d"]) + k.R(34, 12, 28, 4, 0, T.red) })),
  broadcaster: P((k) => ({ shirt: ["#6fa3d6", "#27406e"], front: hair(k, HAIR.black), late: HEADSET(k) + MIC(k) })),
  commentator: P((k) => ({ shirt: ["#ff9a8a", "#c8402a"], front: hair(k, HAIR.brown), late: HEADSET(k) })),
  reporter: P((k) => ({ shirt: ["#e0c29a", "#a07a48"], front: hair(k, HAIR.brown), late: MIC(k) + k.R(24, 70, 16, 18, 2, "#fffdf6") + k.S("M27 75h10M27 80h10", "#8a98a0", 1.2) })),
  journalist: P((k) => ({ shirt: ["#cfd8dc", "#8795a0"], front: hair(k, HAIR.brown), late: FEDORA(k) + k.R(30, 70, 18, 16, 2, "#fffdf6") + k.S("M33 75h12M33 80h12", "#8a98a0", 1.2) })),
  captain: P((k) => ({ shirt: ["#ffffff", "#cfd8dc"], front: hair(k, HAIR.gray), extra: k.P("M40 62 48 72 56 62z", T.navy), late: k.P("M24 32c0-14 10-20 24-20s24 6 24 20z", ["#ffffff", "#d3dce2"]) + k.R(22, 30, 52, 6, 3, ["#2a3a6a", "#101a3a"]) + k.C(48, 20, 4, T.gold) + k.R(14, 70, 10, 4, 1, T.gold) + k.R(72, 70, 10, 4, 1, T.gold) })),
  sailor: P((k) => ({ shirt: ["#ffffff", "#e0e8ec"], front: hair(k, HAIR.brown), extra: k.P("M30 62h36l-4 12H34z", T.navy, { op: 0.9 }) + k.S("M36 66h24M36 70h24", "#fff", 1.6), late: k.P("M28 30c0-12 8-18 20-18s20 6 20 18z", ["#ffffff", "#e0e8ec"]) + k.R(26, 28, 44, 6, 3, T.navy) })),
  pirate: P((k) => ({ shirt: ["#d9402a", "#7a1008"], front: hair(k, HAIR.black), late: k.P("M22 30c0-14 10-20 26-20s26 6 26 20c-14-4-38-4-52 0z", ["#161b1d", "#000"]) + k.C(48, 14, 3, "#fff") + k.R(32, 36, 14, 10, 5, "#161b1d") + k.S("M24 34l24 4", "#161b1d", 1.4) + k.C(70, 54, 3, T.gold) + MUST(k, HAIR.black) })),
  champion: P((k) => ({ shirt: ["#ffd36a", "#e0701a"], front: hair(k, HAIR.brown), late: k.S("M26 66c10 14 34 14 44 0", T.gold[1], 3) + k.C(48, 80, 9, T.gold) + k.P("M48 74l2.4 4.8 5.2.8-3.8 3.6 1 5.2-4.8-2.6-4.8 2.6 1-5.2-3.8-3.6 5.2-.8z", "#fff7c8") + k.S("M28 22c4-8 12-12 20-12s16 4 20 12", "#7cc56a", 3) })),
  winner: P((k) => ({ shirt: ["#9bd0f2", "#3f86c0"], front: hair(k, HAIR.red), late: k.R(62, 62, 6, 8, 2, T.gold) + k.P("M58 40h22c0 14-4 20-11 20s-11-6-11-20z", T.gold, { lin: true }) + k.R(66, 60, 6, 10, 2, T.gold) + k.R(60, 70, 18, 5, 2, ["#8a5a2a", "#3f2410"]) })),
  child: (k) => bust(k, { shirt: ["#ffb8c2", "#e0707f"], head: 24, y: 42, front: k.P("M24 40c0-16 8-22 24-22s24 6 24 22c-6-6-12-8-24-8s-18 2-24 8z", HAIR.brown) + k.C(48, 20, 5, HAIR.brown[1]) }),
  pupil: P((k) => ({ shirt: ["#ffffff", "#d3dce2"], front: hair(k, HAIR.brown), extra: k.P("M38 62 48 76 58 62z", T.navy) + k.S("M32 66c-4 10-4 20 0 24M64 66c4 10 4 20 0 24", "#c42a14", 4), late: k.R(14, 70, 14, 20, 4, ["#ff8a6a", "#c42a14"]) })),
  student: P((k) => ({ shirt: ["#9bd0f2", "#3f86c0"], front: hair(k, HAIR.black), late: k.S("M30 66c-4 8-4 18 0 24M66 66c4 8 4 18 0 24", "#e0701a", 4) + BOOK(k, ["#a8d86e", "#4a8f2e"]) })),
  composer: P((k) => ({ shirt: ["#8a5a8a", "#4a2a5a"], back: k.E(22, 46, 8, 14, HAIR.gray) + k.E(74, 46, 8, 14, HAIR.gray), front: k.P("M26 34c0-14 8-20 22-20s22 6 22 20c-6-6-14-8-22-8s-16 2-22 8z", HAIR.gray), extra: k.P("M40 62h16l-8 6z", "#fff"), late: k.P("M80 14v18M80 14l8 3", INK, 0) + k.S("M80 16v16", INK, 2) + k.E(77, 33, 4, 3, INK) + k.S("M80 16l7 3", INK, 2) })),
  musician: P((k) => ({ shirt: ["#ff8a6a", "#a82410"], front: hair(k, HAIR.black), late: k.S("M80 14v18", INK, 2) + k.E(77, 33, 4, 3, INK) + k.S("M80 16l7 3", INK, 2) + k.S("M14 90 34 60", "#8a5a2a", 3.4) + k.E(26, 78, 10, 8, ["#e6b676", "#8a5226"]) })),
  singer: P((k) => ({ shirt: ["#d7bff2", "#8a5cc8"], front: hair(k, HAIR.red), late: MIC(k) + k.P("M80 20l2 5 5 2-5 2-2 5-2-5-5-2 5-2z", T.gold) })),
  dancer: P((k) => ({ shirt: ["#ffb8c8", "#e0587a"], back: k.C(48, 16, 8, HAIR.brown), front: k.P("M26 36c0-14 8-20 22-20s22 6 22 20c-8-2-16-6-22-12-4 6-12 10-22 12z", HAIR.brown), extra: k.P("M14 90c4-8 12-12 34-12s30 4 34 12z", ["#ffd0dc", "#e0587a"]), late: k.C(48, 8, 4, T.red) })),
  contractor: P((k) => ({ shirt: ["#ffb25a", "#e0701a"], front: hair(k, HAIR.brown), late: HARD(k, T.yellow) + k.S("M32 64l16 22M64 64 48 86", "#ffe27a", 3) })),
  worker: P((k) => ({ shirt: ["#ff9a5a", "#d9501a"], front: hair(k, HAIR.black), late: HARD(k, T.orange) + k.S("M32 64l16 22M64 64 48 86", "#f1f5f7", 3) })),
  mechanic: P((k) => ({ shirt: ["#6fa3d6", "#27406e"], front: hair(k, HAIR.black), extra: k.R(40, 66, 16, 24, 3, ["#4a7fb8", "#1c2f6a"]), late: CAPH(k, T.navy) + k.R(70, 66, 6, 24, 3, ["#f1f5f7", "#8795a0"], { rot: 20, rx: 73, ry: 78 }) })),
  miner: P((k) => ({ shirt: ["#8a98a0", "#3a4448"], front: hair(k, HAIR.black), late: HARD(k, T.gray) + k.C(48, 20, 5, ["#fff8c4", "#ffcf3a"]) + k.C(32, 52, 3, "#000", { op: 0.25 }) + k.C(62, 50, 3, "#000", { op: 0.2 }) })),
  cop: P((k) => ({ shirt: ["#6fa3d6", "#27406e"], front: hair(k, HAIR.brown), extra: BADGE(k), late: CAPH(k, T.navy) + SUN(k) })),
  policeman: P((k) => ({ shirt: ["#6fa3d6", "#27406e"], front: hair(k, HAIR.black), extra: BADGE(k) + MUST(k, HAIR.black), late: CAPH(k, T.navy) })),
  dentist: P((k) => ({ shirt: ["#ffffff", "#cfd8dc"], front: hair(k, HAIR.brown), late: k.P("M34 48c4 12 24 12 28 0z", ["#9bd0f2", "#3f86c0"]) + k.P("M28 28c0-12 8-18 20-18s20 6 20 18z", ["#cfeaff", "#5aa8d8"]) })),
  physician: P((k) => ({ shirt: LABCOAT, front: hair(k, HAIR.gray), extra: k.P("M36 62 48 88 60 62z", T.blue, { op: 0.9 }) + k.S("M34 66c-6 12 4 22 14 20M62 66c6 12-4 22-14 20", "#59656b", 2.4), late: k.C(48, 16, 6, ["#f1f5f7", "#8795a0"]) + k.S("M28 22h40", "#aab8c0", 3) })),
  surgeon: P((k) => ({ shirt: ["#8fe0c8", "#2a8a74"], front: "", late: k.P("M24 40c0-18 10-26 24-26s24 8 24 26c-8-6-14-8-24-8s-16 2-24 8z", ["#8fe0c8", "#2a8a74"]) + k.P("M32 42c2 16 10 22 16 22s14-6 16-22c-4 6-10 8-16 8s-12-2-16-8z", ["#cfeaf8", "#7fc4e0"]) })),
  psychologist: P((k) => ({ shirt: ["#d7c0a0", "#a08460"], front: hair(k, HAIR.gray), late: GLASS(k) + k.R(60, 68, 26, 22, 2, "#fffdf6") + k.S("M64 74h18M64 79h18M64 84h12", "#8a98a0", 1.4) })),
  designer: P((k) => ({ shirt: ["#ffd9a0", "#e08a3a"], back: long(k, HAIR.red), front: k.P("M26 36c0-14 8-20 22-20s22 6 22 20c-8-2-16-6-22-12-4 6-12 10-22 12z", HAIR.red), extra: k.S("M32 62c0 12 8 20 16 22M64 62c0 12-8 20-16 22", "#f1c040", 3), late: GLASS(k, "#c43a62") })),
  detective: P((k) => ({ shirt: ["#a08a6a", "#5a4630"], front: hair(k, HAIR.brown), extra: k.P("M30 62h36l-4 14H34z", ["#c0a880", "#7a6040"]), late: FEDORA(k) + k.C(74, 74, 10, "#cfeaff", { op: 0.8 }) + k.S("M74 74a10 10 0 1 0 0.1 0", "#8795a0", 2.6) + k.S("M81 81l8 9", "#6a4a2a", 3.4) })),
  spy: P((k) => ({ shirt: ["#2a3236", "#0a0e10"], front: hair(k, HAIR.black), extra: k.P("M26 62 38 70l-2 18-10 2zM70 62 58 70l2 18 10 2z", "#161b1d"), late: FEDORA(k, ["#4a565c", "#161b1d"]) + SUN(k) })),
  diplomat: P((k) => ({ shirt: ["#4a565c", "#161b1d"], front: hair(k, HAIR.gray), extra: COLLAR(k) + TIE(k, T.blue), late: k.R(62, 70, 14, 10, 1, T.red) + k.R(62, 70, 7, 5, 0, T.blue) })),
  director: P((k) => ({ shirt: ["#ffb25a", "#e0701a"], front: hair(k, HAIR.black), late: k.P("M24 30c0-12 10-18 24-18s24 6 24 18z", ["#59656b", "#161b1d"]) + k.R(22, 28, 20, 6, 3, "#161b1d") + k.P("M62 66 86 56v22L62 72z", ["#e8eef2", "#9aa8b2"]) })),
  "film-maker": P((k) => ({ shirt: ["#8a98a0", "#3a4448"], front: hair(k, HAIR.brown), late: BERET(k, T.navy) + k.R(60, 62, 28, 20, 4, ["#59656b", "#161b1d"]) + k.C(70, 72, 6, ["#7fa8d8", "#1b2a4a"]) + k.C(82, 66, 2, T.red) })),
  photographer: P((k) => ({ shirt: ["#9bd0f2", "#3f86c0"], front: hair(k, HAIR.brown), late: k.R(26, 42, 44, 22, 5, ["#59656b", "#161b1d"]) + k.C(48, 54, 9, ["#7fa8d8", "#1b2a4a"]) + k.C(48, 54, 4, "#0a1020") + k.R(30, 40, 10, 5, 2, T.steel) })),
  driver: P((k) => ({ shirt: ["#8a98a0", "#3a4448"], front: hair(k, HAIR.black), late: CAPH(k, ["#59656b", "#161b1d"]) + k.S("M20 84a28 14 0 0 1 56 0", "#2a3236", 5) + k.R(44, 86, 8, 4, 1, "#59656b") })),
  engineer: P((k) => ({ shirt: ["#ffffff", "#cfd8dc"], front: hair(k, HAIR.black), extra: k.R(38, 64, 20, 22, 2, T.orange), late: HARD(k, ["#ffffff", "#cfd8dc"]) + GLASS(k) + k.R(62, 66, 8, 24, 3, ["#fffdf6", "#dde4e8"], { rot: -20, rx: 66, ry: 78 }) })),
  scientist: P((k) => ({ shirt: LABCOAT, front: hair(k, HAIR.black), extra: k.P("M40 62 48 80 56 62z", T.blue, { op: 0.9 }), late: k.R(26, 34, 44, 11, 5, ["#cfeaf8", "#7fc4e0"], { op: 0.7 }) + k.C(70, 78, 7, ["#9fe0c8", "#2a8a74"]) + k.R(68, 66, 4, 8, 1, "#f4fbff") })),
  researcher: P((k) => ({ shirt: LABCOAT, front: hair(k, HAIR.red), late: GLASS(k) + k.C(74, 74, 9, "#cfeaff", { op: 0.8 }) + k.S("M74 74a9 9 0 1 0 0.1 0", "#8795a0", 2.4) + k.S("M80 81l8 9", "#6a4a2a", 3.4) })),
  professor: P((k) => ({ shirt: ["#8a6a4a", "#4a3418"], front: k.P("M26 36c-2-12 6-20 22-20s24 8 22 20c-6-6-14-8-22-8s-16 2-22 8z", HAIR.gray), extra: k.P("M40 62 48 72 56 62z", "#fff") + k.R(36, 66, 24, 4, 1, T.red), late: GLASS(k) + k.R(60, 68, 26, 22, 2, ["#4a90c8", "#254f86"]) + k.R(63, 71, 20, 16, 1, "#fffaf0") })),
  philosopher: P((k) => ({ shirt: ["#f4ecd8", "#d8c8a0"], front: k.P("M28 34c0-12 8-18 20-18s20 6 20 18c-4-4-10-6-20-6s-16 2-20 6z", HAIR.gray), extra: BEARD(k), late: k.S("M26 22c4-8 12-12 22-12s18 4 22 12", "#7cc56a", 3) })),
  farmer: P((k) => ({ shirt: ["#6fa3d6", "#27406e"], front: hair(k, HAIR.brown), extra: k.P("M30 62h36v28H30z", ["#4a7fb8", "#1c2f6a"]) + k.R(34, 62, 6, 12, 1, "#e8c070") + k.R(56, 62, 6, 12, 1, "#e8c070"), late: k.E(48, 28, 34, 7, ["#f0d890", "#c0a050"]) + k.P("M30 28c0-14 6-20 18-20s18 6 18 20z", ["#f0d890", "#c0a050"]) + k.R(30, 22, 36, 4, 1, T.red) + k.S("M78 90 82 56M74 62l12-2M74 68l12-2", "#8a5a2a", 2.4) })),
  peasant: P((k) => ({ shirt: ["#c0a880", "#7a6040"], front: hair(k, HAIR.brown), late: k.P("M24 40c0-18 10-26 24-26s24 8 24 26c-4-4-8-6-12-6-8 0-12-4-12-4s-4 4-12 4c-4 0-8 2-12 6z", T.brown) + k.S("M26 42c6 14 6 20 10 24M70 42c-6 14-6 20-10 24", T.brown[1], 3) })),
  villager: P((k) => ({ shirt: ["#a8d86e", "#4a8f2e"], front: hair(k, HAIR.red), late: k.R(26, 60, 44, 8, 3, ["#c79a6b", "#7a5230"]) + k.R(30, 70, 10, 20, 2, ["#8a5a30", "#4a2a10"]) })),
  firefighter: P((k) => ({ shirt: ["#ffe27a", "#e0a82a"], front: hair(k, HAIR.brown), extra: k.R(30, 70, 36, 5, 0, "#cfd8dc") + k.R(30, 80, 36, 5, 0, "#cfd8dc"), late: k.P("M24 34c0-16 10-24 24-24s24 8 24 24z", ["#ff8a6a", "#c42a14"]) + k.R(18, 32, 60, 8, 4, ["#ff8a6a", "#a82410"]) + k.R(40, 14, 16, 12, 3, T.gold) })),
  guard: P((k) => ({ shirt: ["#59656b", "#2a3236"], front: hair(k, HAIR.black), extra: BADGE(k), late: CAPH(k, ["#8a98a0", "#3a4448"]) + WHISTLE(k) })),
  soldier: P((k) => ({ shirt: ["#8a9a6a", "#4a5a2a"], front: hair(k, HAIR.brown), extra: k.R(24, 72, 10, 4, 1, T.gold), late: HELM(k) + k.S("M32 44l8 2M60 48l8 2", "#3a4a1a", 3, { op: 0.5 }) })),
  warrior: P((k) => ({ shirt: ["#c79a6b", "#7a5230"], back: "", front: hair(k, HAIR.red), extra: BEARD(k, HAIR.red), late: k.P("M22 36c0-18 10-26 26-26s26 8 26 26z", ["#d8dedb", "#7a8590"]) + k.R(20, 33, 56, 5, 2.5, ["#8a98a0", "#3a4448"]) + k.R(44, 14, 8, 22, 3, ["#c8d2d8", "#5a6a74"]) + k.P("M46 2c6 0 10 6 8 12h-8z", T.red) })),
  inspector: P((k) => ({ shirt: ["#a08a6a", "#5a4630"], front: hair(k, HAIR.black), late: CAPH(k, ["#8a98a0", "#3a4448"]) + k.R(60, 64, 24, 26, 2, ["#c79a6b", "#7a5230"]) + k.R(64, 68, 16, 4, 1, "#fff") + k.S("M64 76h16M64 82h12", "#fff", 1.4) })),
  monk: P((k) => ({ shirt: ["#a8763f", "#5e3b1d"], front: k.P("M28 44c0-6 2-10 4-12M68 44c0-6-2-10-4-12", HAIR.brown[1], 0) + k.S("M28 44c0-8 2-12 4-16M68 44c0-8-2-12-4-16", HAIR.brown[1], 5), extra: k.R(30, 70, 36, 5, 0, "#f1c040", { op: 0.8 }), late: k.C(48, 12, 0, "#fff") })),
  priest: P((k) => ({ shirt: ["#3a4448", "#0e1214"], front: hair(k, HAIR.gray), extra: k.R(42, 62, 12, 6, 1, "#fff"), late: k.R(62, 72, 4, 14, 1, T.gold) + k.R(58, 76, 12, 4, 1, T.gold) })),
  pastor: P((k) => ({ shirt: ["#4a3a6a", "#1a1030"], front: hair(k, HAIR.brown), extra: k.R(42, 62, 12, 6, 1, "#fff"), late: k.R(14, 70, 24, 18, 2, ["#fffaf0", "#d8caa0"]) + k.R(24, 74, 4, 10, 1, T.gold) + k.R(20, 78, 12, 3, 1, T.gold) })),
  bishop: P((k) => ({ shirt: ["#a82a8a", "#5a0a4a"], front: hair(k, HAIR.gray), late: k.P("M30 20c0-14 8-18 18-18s18 4 18 18z", ["#fffaf0", "#d8caa0"]) + k.R(46, 4, 4, 16, 1, T.gold) + k.R(42, 8, 12, 3, 1, T.gold) + k.R(28, 20, 40, 6, 3, T.gold) })),
  saint: P((k) => ({ shirt: ["#f4ecd8", "#d8c8a0"], front: hair(k, HAIR.brown), late: k.S("M32 12a16 4.4 0 1 0 32 0a16 4.4 0 1 0-32 0", T.gold[1], 3.4) + k.S("M32 12a16 4.4 0 1 0 32 0a16 4.4 0 1 0-32 0", "#fff3a8", 1.4) })),
  referee: P((k) => ({ shirt: ["#2a3236", "#0a0e10"], front: hair(k, HAIR.black), extra: k.R(26, 66, 6, 24, 0, "#fff") + k.R(40, 66, 6, 24, 0, "#fff") + k.R(54, 66, 6, 24, 0, "#fff") + k.R(68, 66, 6, 24, 0, "#fff"), late: WHISTLE(k) })),
  trainer: P((k) => ({ shirt: ["#ff8a6a", "#c42a14"], front: hair(k, HAIR.brown), late: CAPH(k, T.blue) + WHISTLE(k) })),
  coach: P((k) => ({ shirt: ["#6fa3d6", "#27406e"], front: hair(k, HAIR.gray), late: CAPH(k, ["#ffffff", "#cfd8dc"]) + WHISTLE(k) + k.R(60, 70, 28, 20, 2, ["#a8d86e", "#4a8f2e"]) + k.S("M66 76l6 4-6 4M80 76l-6 4 6 4", "#fff", 1.6) })),
  runner: P((k) => ({ shirt: ["#ffd36a", "#e0a82a"], front: hair(k, HAIR.black), late: k.R(24, 24, 48, 6, 3, T.blue) + k.R(38, 70, 20, 14, 2, "#fff") + k.X(48, 82, "7", 12, INK) })),
  politician: P((k) => ({ shirt: ["#4a565c", "#161b1d"], front: hair(k, HAIR.gray), extra: COLLAR(k) + TIE(k, T.blue), late: k.R(70, 70, 12, 8, 1, T.red) + k.R(70, 70, 6, 4, 0, T.blue) })),
  senator: P((k) => ({ shirt: ["#3a4a6a", "#101a3a"], front: hair(k, HAIR.gray), extra: COLLAR(k) + k.P("M42 62h12l-3 6h-6z", T.red), late: k.P("M72 70l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z", ["#fff", "#d3dce2"]) })),
  servant: P((k) => ({ shirt: ["#2a3236", "#0a0e10"], front: hair(k, HAIR.gray), extra: COLLAR(k) + k.P("M42 62h12l-4 4h-4z", "#161b1d"), late: k.E(76, 80, 14, 4, ["#f1f5f7", "#8795a0"]) + k.R(70, 66, 12, 12, 3, ["#fffaf0", "#d8caa0"]) })),
  waiter: P((k) => ({ shirt: ["#ffffff", "#d3dce2"], front: hair(k, HAIR.black), extra: k.P("M30 64h36v26H30z", ["#2a3236", "#0a0e10"], { op: 0.95 }) + k.P("M42 62h12l-3 5h-6z", "#161b1d"), late: MUST(k, HAIR.black) + k.E(74, 78, 16, 4, ["#f1f5f7", "#8795a0"]) + k.R(68, 66, 12, 10, 3, ["#fffaf0", "#d8caa0"]) + k.S("M70 62c-2-4 2-4 0-8", "#aab6bc", 1.6) })),
  thief: P((k) => ({ shirt: ["#ffffff", "#161b1d"], front: "", extra: k.R(26, 66, 44, 5, 0, "#161b1d") + k.R(26, 76, 44, 5, 0, "#161b1d"), late: k.P("M24 34c0-16 10-24 24-24s24 8 24 24z", ["#4a565c", "#161b1d"]) + k.R(24, 30, 48, 6, 3, "#161b1d") + k.R(28, 36, 40, 10, 5, ["#2a3236", "#0a0e10"]) + k.E(38, 41, 3, 2.6, "#fff") + k.E(58, 41, 3, 2.6, "#fff") + k.R(64, 70, 24, 20, 4, ["#c79a6b", "#7a5230"]) + k.X(76, 86, "$", 12, T.gold[0]) })),
};
