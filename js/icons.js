const svg = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;

export const icons = {
  speaker: svg('<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'),
  close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  flame: svg('<path d="M12 3c1 3-1 4-1 6a2.5 2.5 0 0 0 5 0c2 2 3 4 3 6.5a7 7 0 0 1-14 0C5 12 7 10 8 8c1 1 2 1 2 1 0-2 1-4 2-6z"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  star: svg('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  home: svg('<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>'),
  book: svg('<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 4v12"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  flag: svg('<path d="M5 21V4h11l-1.5 4L16 12H5"/>'),
  arrowRight: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  snow: svg('<path d="M12 2v20M4.9 6l14.2 12M4.9 18 19.1 6"/>'),
  bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
  bookOpen: svg('<path d="M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2z"/><path d="M22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z"/>'),
  chevronLeft: svg('<path d="m15 18-6-6 6-6"/>'),
  chevronRight: svg('<path d="m9 18 6-6-6-6"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  headphones: svg('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="2"/><rect x="17" y="14" width="4" height="7" rx="2"/>'),
  pencil: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/>'),
  eye: svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  languages: svg('<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>'),
  slides: svg('<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M7 3h14v12"/>'),
  shuffle: svg('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
  fill: svg('<path d="M4 7h16M4 12h6M14 12h6M4 17h16"/>'),
  play: svg('<path d="m6 4 14 8-14 8z"/>'),
  pause: svg('<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>'),
  skipBack: svg('<path d="M19 20 9 12l10-8zM5 4v16"/>'),
  skipNext: svg('<path d="m5 4 10 8-10 8zM19 4v16"/>'),
  trophy: svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  sparkles: svg('<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>'),
  sprout: svg('<path d="M12 21v-9"/><path d="M12 13c-4.5 0-6.5-2-6.5-5.5C10 7.5 12 9.5 12 13zM12 11c3.5 0 5.5-1.8 5.5-4.5-3.5 0-5.5 1.8-5.5 4.5z"/>'),
  check2: svg('<path d="m5 12 5 5 9-10"/>'),
};

/** Hafıza aşamaları: tohum, filiz, fidan, ağaç (kararlılığa göre, bkz. srs.js). */
const plant = (body, size) =>
  `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><path d="M8 41c4-5 28-5 32 0z" fill="var(--seed)" opacity=".55"/>${body}</svg>`;
export const plants = [
  (n = 40) => plant('<ellipse cx="24" cy="37" rx="3.2" ry="2.2" fill="var(--seed)"/>', n),
  (n = 40) => plant('<path d="M24 38V25" stroke="var(--sprout)" stroke-width="2.6" stroke-linecap="round"/><path d="M24 28c-6 0-9-3-9-8 6 0 9 3 9 8zM24 25c5 0 8-3 8-7-5 0-8 3-8 7z" fill="var(--sprout)"/>', n),
  (n = 40) => plant('<path d="M24 39V18" stroke="var(--sapling)" stroke-width="3" stroke-linecap="round"/><path d="M24 30c-7 0-10-4-10-9 7 0 10 4 10 9zM24 24c6 0 9-4 9-9-6 0-9 4-9 9zM24 19c-4-1-6-4-6-8 4 1 6 4 6 8z" fill="var(--sapling)"/>', n),
  (n = 40) => plant('<path d="M24 40V24" stroke="var(--seed)" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="18" r="11" fill="var(--tree)"/><circle cx="16" cy="23" r="6" fill="var(--tree)"/><circle cx="32" cy="23" r="6" fill="var(--tree)"/>', n),
];

/** Uygulama işareti: yaprak çıkan filiz. */
export const brandMark = (n = 28) =>
  `<svg viewBox="0 0 32 32" width="${n}" height="${n}" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--primary)"/><path d="M16 25V15" stroke="var(--primary-ink)" stroke-width="2.4" stroke-linecap="round"/><path d="M16 17c-5 0-7.5-2.5-7.5-6.5 5 0 7.5 2.5 7.5 6.5zM16 14.5c4 0 6.5-2.2 6.5-5.5-4 0-6.5 2.2-6.5 5.5z" fill="var(--primary-ink)"/></svg>`;
