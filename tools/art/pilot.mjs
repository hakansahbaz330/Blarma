// Deneme seti: 30 somut kelime. Çalıştır: node tools/art/pilot.mjs <çıktı-klasörü>
import { writeFileSync, mkdirSync } from "node:fs";
import { C, hi, shade, clipShade, wrap } from "./kit.mjs";

const art = {
  apple: `<path d="M48 30c-10-7-27-3-27 18 0 18 12 31 21 31 3 0 4-1 6-1s3 1 6 1c9 0 21-13 21-31 0-21-17-25-27-18z" fill="${C.clay}"/>
    ${clipShade("apple", `<path d="M48 30c-10-7-27-3-27 18 0 18 12 31 21 31 3 0 4-1 6-1s3 1 6 1c9 0 21-13 21-31 0-21-17-25-27-18z"/>`, "M66 20c14 4 20 22 14 40-4 12-16 20-30 22 30 8 46-20 36-48-4-10-12-14-20-14z", C.clay2, .6)}
    <path d="M48 31c0-8 2-14 6-18" stroke="${C.soil2}" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M52 21c6-9 17-9 21-5-4 9-15 11-21 5z" fill="${C.leaf}"/>${hi(31, 45, 4, 9, 15)}`,
  banana: `<path d="M20 28c2 32 24 50 58 42-3 7-8 11-15 13C36 90 12 68 12 36c0-7 7-11 8-8z" fill="${C.butter}"/>
    ${shade("M30 62c14 12 32 14 48 8-3 7-8 11-15 13-14 0-27-8-33-21z", C.butter2, .6)}
    <path d="M20 28c-1-5 1-10 4-12l5 3c-3 3-4 6-5 10z" fill="${C.soil2}"/><circle cx="76" cy="73" r="3.4" fill="${C.soil2}"/>${hi(24, 46, 2.6, 10, -10)}`,
  cat: `<path d="M22 44 18 16l22 12zM74 44l4-28-22 12z" fill="${C.sand2}"/><path d="M24 40 22 24l12 7zM72 40l2-16-12 7z" fill="${C.rose}"/>
    <ellipse cx="48" cy="54" rx="29" ry="26" fill="${C.sand2}"/>${clipShade("cat", `<ellipse cx="48" cy="54" rx="29" ry="26"/>`, "M60 26c18 8 26 40 4 56 24 0 30-26 20-44z", C.soil, .4)}
    <ellipse cx="38" cy="52" rx="3.2" ry="4.4" fill="${C.ink}"/><ellipse cx="58" cy="52" rx="3.2" ry="4.4" fill="${C.ink}"/>
    <path d="M44 61h8l-4 5z" fill="${C.rose2}"/><path d="M48 66c-1 5-6 6-9 4M48 66c1 5 6 6 9 4" stroke="${C.ink}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M24 60l-12-3M24 65l-12 4M72 60l12-3M72 65l12 4" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`,
  dog: `<path d="M22 30c-10 0-14 14-12 26 1 6 8 6 12 0z" fill="${C.soil2}"/><path d="M74 30c10 0 14 14 12 26-1 6-8 6-12 0z" fill="${C.soil2}"/>
    <ellipse cx="48" cy="50" rx="27" ry="27" fill="${C.soil}"/>${clipShade("dog", `<circle cx="48" cy="50" r="27"/>`, "M62 20c20 10 24 44 2 62 20-4 30-30 18-50z", C.soil2, .45)}
    <ellipse cx="48" cy="62" rx="14" ry="11" fill="${C.sand}"/><ellipse cx="48" cy="57" rx="6" ry="4.4" fill="${C.ink}"/>
    <circle cx="37" cy="44" r="3.6" fill="${C.ink}"/><circle cx="59" cy="44" r="3.6" fill="${C.ink}"/><path d="M48 62v5" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>
    <path d="M40 70c4 5 12 5 16 0" stroke="${C.ink}" stroke-width="2" fill="none" stroke-linecap="round"/>${hi(34, 34, 5, 3, -20)}`,
  fish: `<path d="M70 48 90 30v36z" fill="${C.sky2}"/><ellipse cx="44" cy="48" rx="34" ry="22" fill="${C.sky}"/>
    ${shade("M30 68c20 6 42-4 48-20 0 14-14 26-36 26-6 0-10-2-12-6z", C.sky2, .55)}<path d="M30 40c4 6 4 14 0 20" stroke="${C.sky2}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="26" cy="43" r="4.6" fill="${C.white}"/><circle cx="25" cy="43" r="2.6" fill="${C.ink}"/>${hi(40, 36, 8, 3, -10)}`,
  bird: `<ellipse cx="46" cy="52" rx="28" ry="25" fill="${C.sky}"/>${clipShade("bird", `<ellipse cx="46" cy="52" rx="28" ry="25"/>`, "M60 24c20 6 26 40 4 60 22-2 34-24 24-44z", C.sky2, .55)}
    <path d="M18 48 4 52l14 6z" fill="${C.butter2}"/><path d="M52 56c14-2 24 6 26 14-12 2-24-2-26-14z" fill="${C.sky2}"/>
    <circle cx="32" cy="46" r="3.6" fill="${C.ink}"/><circle cx="31" cy="45" r="1.2" fill="#fff"/><path d="M38 78v8M52 78v8" stroke="${C.butter2}" stroke-width="3" stroke-linecap="round"/>${hi(40, 38, 8, 3, -15)}`,
  house: `<rect x="18" y="42" width="60" height="40" rx="3" fill="${C.sand}"/>${shade("M62 42h16v40H62z", C.sand2, .6)}
    <path d="M10 46 48 14l38 32z" fill="${C.clay}"/>${shade("M48 14l38 32H62z", C.clay2, .45)}
    <rect x="40" y="58" width="16" height="24" rx="8 8 2 2" fill="${C.soil}"/><circle cx="52" cy="72" r="1.6" fill="${C.butter}"/>
    <rect x="24" y="52" width="12" height="12" rx="2" fill="${C.sky}"/><rect x="62" y="52" width="10" height="12" rx="2" fill="${C.sky}"/>`,
  car: `<path d="M10 62c0-6 3-9 8-10l8-14c2-3 4-4 8-4h24c4 0 7 1 9 4l9 14c5 1 10 4 10 10v8c0 2-2 4-4 4H14c-2 0-4-2-4-4z" fill="${C.clay}"/>
    ${shade("M10 66h76v6c0 2-2 4-4 4H14c-2 0-4-2-4-4z", C.clay2, .55)}<path d="M30 40h14v12H24zM50 40h14l8 12H50z" fill="${C.sky}"/>
    <circle cx="28" cy="76" r="9" fill="${C.ink}"/><circle cx="68" cy="76" r="9" fill="${C.ink}"/><circle cx="28" cy="76" r="3.6" fill="${C.stone}"/><circle cx="68" cy="76" r="3.6" fill="${C.stone}"/>
    <rect x="80" y="58" width="6" height="5" rx="2" fill="${C.butter}"/>`,
  book: `<rect x="18" y="12" width="56" height="70" rx="5" fill="${C.moss}"/><rect x="26" y="12" width="48" height="70" rx="4" fill="${C.leaf2}"/>
    <rect x="22" y="20" width="56" height="62" rx="3" fill="${C.cream}"/><path d="M22 76h56v6a3 3 0 0 1-3 3H25a3 3 0 0 1-3-3z" fill="${C.sand2}"/>
    <rect x="34" y="30" width="28" height="5" rx="2.5" fill="${C.moss}" opacity=".7"/><rect x="34" y="42" width="20" height="4" rx="2" fill="${C.stone2}" opacity=".7"/>
    <path d="M62 12v22l-6-5-6 5V12z" fill="${C.clay}"/>`,
  chair: `<rect x="26" y="12" width="12" height="42" rx="5" fill="${C.soil}"/><rect x="26" y="12" width="40" height="8" rx="4" fill="${C.soil}"/>
    <rect x="26" y="16" width="38" height="30" rx="4" fill="${C.soil}"/><rect x="34" y="22" width="22" height="18" rx="3" fill="${C.sand2}" opacity=".55"/>
    <rect x="20" y="50" width="52" height="12" rx="5" fill="${C.soil}"/>${shade("M20 58h52v1a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z", C.soil2, .7)}
    <rect x="24" y="60" width="9" height="24" rx="3" fill="${C.soil2}"/><rect x="60" y="60" width="9" height="24" rx="3" fill="${C.soil2}"/>`,
  table: `<rect x="10" y="34" width="76" height="12" rx="5" fill="${C.soil}"/>${shade("M10 42h76v0a5 5 0 0 1-5 4H15a5 5 0 0 1-5-4z", C.soil2, .7)}
    <rect x="18" y="44" width="9" height="40" rx="3" fill="${C.soil2}"/><rect x="69" y="44" width="9" height="40" rx="3" fill="${C.soil2}"/>${hi(30, 38, 12, 1.6)}`,
  cup: `<path d="M20 36h46v26c0 12-8 20-23 20S20 74 20 62z" fill="${C.sky}"/>${shade("M52 36h14v26c0 12-8 20-23 20 12-4 9-30 9-46z", C.sky2, .6)}
    <path d="M66 44h6c8 0 12 5 12 11s-5 11-12 11h-6" stroke="${C.sky2}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="43" cy="36" rx="23" ry="5" fill="${C.soil2}"/><path d="M34 24c-4-5 4-8 0-13M46 24c-4-5 4-8 0-13M58 24c-4-5 4-8 0-13" stroke="${C.stone}" stroke-width="3" fill="none" stroke-linecap="round"/>${hi(30, 56, 3, 9)}`,
  key: `<circle cx="30" cy="34" r="20" fill="${C.butter}"/><circle cx="30" cy="34" r="8" fill="#fbf3e2"/>${shade("M44 22c8 12 2 32-14 32 16 6 34-8 26-26-2-4-6-6-12-6z", C.butter2, .6)}
    <rect x="42" y="46" width="44" height="11" rx="4" transform="rotate(35 42 46)" fill="${C.butter}"/>
    <path d="M70 66l8 8-5 5-8-8zM60 56l7 7-4 4-7-7z" fill="${C.butter2}"/>${hi(22, 24, 5, 2.4, -35)}`,
  tree: `<rect x="42" y="52" width="12" height="32" rx="4" fill="${C.soil}"/>${shade("M50 52h4v32h-4z", C.soil2, .7)}
    <circle cx="48" cy="34" r="24" fill="${C.leaf2}"/><circle cx="28" cy="48" r="16" fill="${C.leaf2}"/><circle cx="68" cy="48" r="16" fill="${C.leaf2}"/>
    ${clipShade("tree", `<circle cx="48" cy="34" r="24"/><circle cx="28" cy="48" r="16"/><circle cx="68" cy="48" r="16"/>`, "M60 6c20 8 34 30 30 56H56c14-14 12-40 4-56z", C.moss, .5)}${hi(36, 24, 7, 3.4, -25)}`,
  flower: `<path d="M48 52v32" stroke="${C.leaf2}" stroke-width="5" stroke-linecap="round"/><path d="M48 70c-10 0-18-6-20-16 10 0 18 6 20 16z" fill="${C.leaf}"/>
    <g fill="${C.rose}"><circle cx="48" cy="22" r="12"/><circle cx="68" cy="36" r="12"/><circle cx="60" cy="58" r="12" transform="translate(-12 -6)"/><circle cx="36" cy="58" r="12" transform="translate(0 -6)"/><circle cx="28" cy="36" r="12"/></g>
    <circle cx="48" cy="40" r="10" fill="${C.butter}"/>${hi(42, 18, 4, 2, -20)}`,
  sun: `<g stroke="${C.butter2}" stroke-width="6" stroke-linecap="round"><path d="M48 8v10M48 78v10M8 48h10M78 48h10M20 20l7 7M69 69l7 7M20 76l7-7M69 27l7-7"/></g>
    <circle cx="48" cy="48" r="24" fill="${C.butter}"/>${clipShade("sun", `<circle cx="48" cy="48" r="24"/>`, "M64 22c14 14 12 36-6 48 22 2 36-22 22-42z", C.butter2, .55)}${hi(38, 38, 7, 3, -35)}`,
  moon: `<path d="M62 10C36 12 20 32 22 54c2 22 22 34 44 30-18-4-28-18-26-36 2-14 10-26 22-38z" fill="${C.butter}"/>
    ${shade("M62 10c-10 10-18 24-18 40 0 16 8 28 22 34-22 4-42-8-44-30z", C.butter2, .45)}<path d="M72 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM80 58l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="${C.sky}"/>`,
  star: `<path d="M48 8l11 24 26 3-19 18 5 26-23-13-23 13 5-26L11 35l26-3z" fill="${C.butter}" stroke="${C.butter}" stroke-width="6" stroke-linejoin="round"/>
    ${shade("M48 8l11 24 26 3-19 18 5 26-23-13z", C.butter2, .45)}${hi(38, 36, 5, 2, -30)}`,
  egg: `<path d="M48 10C30 10 18 36 18 56c0 18 13 28 30 28s30-10 30-28c0-20-12-46-30-46z" fill="${C.cream}"/>
    ${clipShade("egg", `<path d="M48 10C30 10 18 36 18 56c0 18 13 28 30 28s30-10 30-28c0-20-12-46-30-46z"/>`, "M58 8c20 10 30 40 22 62-4 10-14 16-30 18 36 4 46-26 38-52z", C.sand2, .7)}${hi(36, 34, 5, 12, 20)}`,
  bread: `<path d="M12 56c0-18 16-32 36-32s36 14 36 32c0 6-2 10-6 12v10c0 3-2 4-5 4H23c-3 0-5-1-5-4V68c-4-2-6-6-6-12z" fill="${C.soil}"/>
    ${shade("M66 30c12 6 20 16 18 28 0 6-2 10-6 12v10c0 3-2 4-5 4H62c14-8 16-36 4-54z", C.soil2, .55)}
    <path d="M30 40l8 14M46 36l8 16M62 40l7 12" stroke="${C.sand}" stroke-width="4" stroke-linecap="round"/>${hi(26, 46, 3, 7, 40)}`,
  milk: `<path d="M26 28 38 12h20l12 16v52c0 3-2 5-5 5H31c-3 0-5-2-5-5z" fill="${C.white}"/>${shade("M58 12l12 16v52c0 3-2 5-5 5H52c4-2 6-10 6-20z", C.stone, .7)}
    <path d="M26 28h44v8H26z" fill="${C.sky}"/><circle cx="48" cy="56" r="12" fill="${C.sky}"/><path d="M48 49c-3 4-4 6-4 8a4 4 0 0 0 8 0c0-2-1-4-4-8z" fill="#fff"/>`,
  shoe: `<path d="M8 66c0-6 3-9 8-9h8c4 0 7-3 8-8l2-12c1-3 3-4 5-3l12 4c4 3 8 6 14 8l14 4c6 2 9 6 9 12v6c0 3-2 5-5 5H13c-3 0-5-2-5-6z" fill="${C.clay}"/>
    ${shade("M8 72h80v5c0 3-2 5-5 5H13c-3 0-5-2-5-6z", C.cream, 1)}<path d="M36 40l-1 5M44 43l-1 5M52 46l-1 5" stroke="${C.white}" stroke-width="3" stroke-linecap="round"/>${hi(18, 62, 4, 2)}`,
  hat: `<ellipse cx="48" cy="66" rx="40" ry="11" fill="${C.moss}"/><path d="M24 64c0-26 8-40 24-40s24 14 24 40c-8 8-40 8-48 0z" fill="${C.leaf2}"/>
    ${clipShade("hat", `<path d="M24 64c0-26 8-40 24-40s24 14 24 40c-8 8-40 8-48 0z"/>`, "M58 20c10 8 18 24 18 52H46c14-10 16-34 12-52z", C.moss, .5)}<path d="M24 58c8 8 40 8 48 0v8c-8 8-40 8-48 0z" fill="${C.clay}"/>${hi(36, 40, 4, 8, 20)}`,
  clock: `<circle cx="48" cy="48" r="38" fill="${C.soil}"/><circle cx="48" cy="48" r="31" fill="${C.cream}"/>${clipShade("clock", `<circle cx="48" cy="48" r="31"/>`, "M66 14c16 14 18 42-2 60 22-2 32-30 18-48z", C.sand2, .7)}
    <g stroke="${C.ink}" stroke-linecap="round"><path d="M48 20v6M48 70v6M20 48h6M70 48h6" stroke-width="3"/><path d="M48 48V30" stroke-width="4"/><path d="M48 48l13 8" stroke-width="3.4"/></g><circle cx="48" cy="48" r="3.6" fill="${C.clay}"/>`,
  bag: `<path d="M30 36c0-14 6-22 18-22s18 8 18 22" stroke="${C.soil2}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M14 38h68l4 40c0 4-3 6-6 6H16c-3 0-6-2-6-6z" fill="${C.rose}"/>${clipShade("bag", `<path d="M14 38h68l4 40c0 4-3 6-6 6H16c-3 0-6-2-6-6z"/>`, "M62 36h26v52H56c8-12 10-34 6-52z", C.rose2, .6)}
    <rect x="38" y="46" width="20" height="9" rx="3" fill="${C.butter}"/>${hi(24, 50, 3, 9)}`,
  umbrella: `<path d="M48 44v34c0 6 4 9 9 9s8-3 8-8" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M6 48C8 26 26 10 48 10s40 16 42 38c-6-6-14-6-21 0-5-6-13-6-21 0-8-6-15-6-21 0-7-6-14-6-21 0z" fill="${C.sky}"/>
    ${shade("M48 10c22 0 40 16 42 38-6-6-14-6-21 0 4-14-4-32-21-38z", C.sky2, .55)}<path d="M48 6v6" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>${hi(30, 26, 7, 3, -35)}`,
  bed: `<rect x="8" y="30" width="10" height="52" rx="4" fill="${C.soil2}"/><rect x="78" y="46" width="10" height="36" rx="4" fill="${C.soil2}"/>
    <rect x="14" y="58" width="68" height="12" rx="4" fill="${C.soil}"/><rect x="16" y="46" width="64" height="18" rx="6" fill="${C.sky}"/>${shade("M16 58h64v0a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z", C.sky2, .6)}
    <rect x="20" y="36" width="22" height="14" rx="7" fill="${C.white}"/><path d="M46 46h34v18H46z" fill="${C.clay}" opacity=".9"/>`,
  door: `<rect x="22" y="8" width="52" height="78" rx="5" fill="${C.soil}"/>${shade("M58 8h16v78H58z", C.soil2, .7)}
    <rect x="30" y="16" width="16" height="24" rx="3" fill="${C.soil2}" opacity=".55"/><rect x="30" y="48" width="16" height="30" rx="3" fill="${C.soil2}" opacity=".55"/>
    <circle cx="64" cy="50" r="4" fill="${C.butter}"/>`,
  phone: `<rect x="24" y="8" width="48" height="80" rx="9" fill="${C.ink}"/><rect x="29" y="16" width="38" height="58" rx="4" fill="${C.sky}"/>
    ${shade("M52 16h15v58H44c8-18 10-38 8-58z", C.sky2, .55)}<circle cx="48" cy="81" r="3.4" fill="${C.stone2}"/><rect x="40" y="11" width="16" height="3" rx="1.5" fill="${C.stone2}"/>
    <path d="M36 34c4-6 10-8 16-4M38 46c6-4 14-4 20 2" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`,
  lamp: `<path d="M30 12h36l12 36H18z" fill="${C.butter}"/>${shade("M58 12h8l12 36H58c6-10 4-26 0-36z", C.butter2, .6)}
    <rect x="45" y="48" width="6" height="26" rx="3" fill="${C.soil2}"/><path d="M28 84c0-8 8-12 20-12s20 4 20 12z" fill="${C.soil}"/>${hi(36, 24, 4, 8, 25)}`,
};

const out = process.argv[2] || "art/pilot";
mkdirSync(out, { recursive: true });
let sheet = "";
for (const [w, body] of Object.entries(art)) {
  const svg = wrap(body);
  writeFileSync(`${out}/${w}.svg`, svg);
  sheet += `<figure><div class="t">${svg}</div><figcaption>${w}</figcaption></figure>`;
}
writeFileSync(`${out}/_sheet.html`, `<!doctype html><meta charset=utf-8><style>body{margin:0;padding:16px;background:#f4f5f1;font:13px system-ui;display:grid;grid-template-columns:repeat(6,1fr);gap:12px}figure{margin:0;text-align:center}.t{background:#dcebe5;border-radius:18px;padding:10px}svg{width:100%;height:auto;display:block}</style>${sheet}`);
console.log(Object.keys(art).length, "çizim →", out);
