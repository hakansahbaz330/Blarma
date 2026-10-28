// Kelime Bahçesi çizim kuralları (vektör, 96×96).
//  - Çizgi yok; düz renk alanları. Her nesne: ana renk + bir koyu ton (sağ/alt gölge) + küçük beyaz parlama.
//  - Yalnızca aşağıdaki palet kullanılır (marka renkleriyle uyumlu, sıcak ve doğal).
//  - Nesne kutunun ortasında, en fazla ~76 birim yüksekliğinde; altında yumuşak zemin gölgesi.
//  - Köşeler yuvarlak; sivri uçlar yalnızca gerçekten sivri şeylerde (yıldız, çatı).
export const C = {
  ink: "#2b3a36", moss: "#1a5c4f", leaf: "#8dbb5a", leaf2: "#4f9a62", clay: "#d9542b", clay2: "#a93f1d",
  soil: "#a67c52", soil2: "#7d5a37", sand: "#f1d9b0", sand2: "#d9b98a", sky: "#8fc3e4", sky2: "#5b9cc6",
  butter: "#f4c95d", butter2: "#d9a62e", rose: "#e88a8a", rose2: "#c45f63", stone: "#c9d1cc", stone2: "#98a39d",
  white: "#ffffff", cream: "#fbf3e2", plum: "#7a5bb5",
};

export const hi = (x, y, rx, ry, rot = 0) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".4" transform="rotate(${rot} ${x} ${y})"/>`;
export const shade = (d, fill, op = 0.35) => `<path d="${d}" fill="${fill}" opacity="${op}"/>`;

export function wrap(body, { ground = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img">${
    ground ? `<ellipse cx="48" cy="86" rx="26" ry="3.6" fill="#17231f" opacity=".12"/>` : ""
  }${body}</svg>`;
}

/** Gölgeyi gövde şekline kırpar; gölge dışarı taşmaz. clipShapes: gövdeyi oluşturan şekil(ler). */
export const clipShade = (id, clipShapes, d, fill, op = 0.35) =>
  `<clipPath id="cp-${id}">${clipShapes}</clipPath><g clip-path="url(#cp-${id})"><path d="${d}" fill="${fill}" opacity="${op}"/></g>`;
