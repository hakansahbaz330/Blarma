// Kelime Bahçesi — gerçekçi vektör çizim kiti (96×96).
// Kurallar: her yüzey gradyanlı (ışık sol üstten), yumuşak parlama (bulanık beyaz elips),
// yumuşak zemin gölgesi. Çizgi yok; kenar tanımı gradyanın koyu tonundan gelir.
// Renkler [açık, koyu] çiftleri; çizimler yalnızca bu paletten renk alır.
export const T = {
  red: ["#ff8767", "#c2331a"], darkred: ["#d9533a", "#7f1d12"], orange: ["#ffb25a", "#e0701a"], yellow: ["#ffe68a", "#e2ac2c"],
  green: ["#a8d86e", "#4a8f2e"], leaf: ["#7cc56a", "#2f7a3e"], deepgreen: ["#4f9a62", "#1f5a3a"], blue: ["#9bd0f2", "#3f86c0"],
  navy: ["#5b7fb8", "#27406e"], purple: ["#b79be0", "#6a47a8"], pink: ["#ffb8c2", "#e0707f"], brown: ["#c79a6b", "#7a5230"],
  wood: ["#d9a86c", "#8f5f33"], darkwood: ["#a8763f", "#5e3b1d"], tan: ["#f0cf9a", "#c79a5e"], fur: ["#eac58a", "#b98650"],
  cream: ["#fffaf0", "#e8d9b8"], white: ["#ffffff", "#cfd8dc"], gray: ["#dfe5e8", "#8e9a9f"], steel: ["#f1f5f7", "#8795a0"],
  stone: ["#d8dedb", "#98a39d"], dark: ["#59656b", "#1c2427"], gold: ["#fff0a0", "#d89a1c"], skin: ["#ffd9bd", "#e0a47c"], glass: ["#e6f6ff", "#9fcfe8"],
};
export const INK = "#1c2427";

export function makeKit(rawId) {
  const id = String(rawId).replace(/[^a-zA-Z0-9]/g, "_");
  const defs = [];
  let n = 0;
  const stops = (a) => a.map((c, i) => `<stop offset="${a.length === 1 ? 0 : i / (a.length - 1)}" stop-color="${c}"/>`).join("");
  const F = (f, o = {}) => {
    if (typeof f === "string") return f;
    const g = `${id}${n++}`;
    defs.push(o.lin
      ? `<linearGradient id="${g}" x1="${o.x1 ?? 0}" y1="${o.y1 ?? 0}" x2="${o.x2 ?? 1}" y2="${o.y2 ?? 1}">${stops(f)}</linearGradient>`
      : `<radialGradient id="${g}" cx="${o.cx ?? 0.35}" cy="${o.cy ?? 0.3}" r="${o.r ?? 0.85}">${stops(f)}</radialGradient>`);
    return `url(#${g})`;
  };
  const tr = (o, cx, cy) => (o.rot ? ` transform="rotate(${o.rot} ${o.rx ?? cx} ${o.ry ?? cy})"` : "");
  const op = (o) => (o.op != null ? ` opacity="${o.op}"` : "");
  const k = {
    P: (d, f, o = {}) => `<path d="${d}" fill="${F(f, o)}"${op(o)}${tr(o, 48, 48)}/>`,
    E: (cx, cy, rx, ry, f, o = {}) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${F(f, o)}"${op(o)}${tr(o, cx, cy)}/>`,
    C: (cx, cy, r, f, o = {}) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${F(f, o)}"${op(o)}/>`,
    R: (x, y, w, h, r, f, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${F(f, o)}"${op(o)}${tr(o, x + w / 2, y + h / 2)}/>`,
    S: (d, c, w = 2, o = {}) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op(o)}${tr(o, 48, 48)}/>`,
    // yumuşak parlama
    G: (x, y, rx, ry, rot = 0, o = 0.6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${o}" filter="url(#kb)" transform="rotate(${rot} ${x} ${y})"/>`,
    // bulanık koyu gölge (gövde içi derinlik)
    D: (d, c = "#000", o = 0.18) => `<path d="${d}" fill="${c}" opacity="${o}" filter="url(#kb)"/>`,
    // metin (görseller <img> içinde yüklendiği için sistem yazı tipi kullanılır)
    X: (x, y, str, size = 40, fill = "#fff", w = 800) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-weight="${w}" font-size="${size}" fill="${fill}">${str}</text>`,
    // gözler
    eye: (x, y, r = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.36}" fill="#fff"/>`,
    clip: (cid, shapes, inner) => `<clipPath id="${id}${cid}">${shapes}</clipPath><g clip-path="url(#${id}${cid})">${inner}</g>`,
    render(body, { ground = 22, gy = 86 } = {}) {
      const sh = ground ? `<ellipse cx="48" cy="${gy}" rx="${ground}" ry="4" fill="#0b1512" opacity=".26" filter="url(#kb2)"/>` : "";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img"><defs><filter id="kb" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6"/></filter><filter id="kb2" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="2.4"/></filter>${defs.join("")}</defs>${sh}${body}</svg>`;
    },
  };
  return k;
}
