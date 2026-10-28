// Beceri yıldızları ve tekrar merdiveni: kelime kartı, oturum sonu ve günlük ilerleme listesinde ortak kullanılır.
import { SKILLS, skillStars, LADDER, ladderStep, normalize } from "./srs.js";
import { icons } from "./icons.js";
import { escapeHtml as h } from "./util.js";

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>';
const SKILL_ICON = { m: icons.languages, l: icons.speaker, w: icons.pencil, s: icons.mic };

export const starsHtml = (n) => `<span class="rate" role="img" aria-label="${n} / 3 yıldız">${[1, 2, 3].map((i) => `<i class="${i <= n ? "on" : ""}">${STAR}</i>`).join("")}</span>`;

/** Dört becerinin (anlam, dinleme, yazma, konuşma) yıldızları. */
export function skillGridHtml(card, { compact = false } = {}) {
  const sk = (card && card.sk) || {};
  return `<div class="skills${compact ? " compact" : ""}">${SKILLS.map((s) => {
    const n = skillStars(sk[s.id] || 0);
    return `<div class="skill s${n}" title="${h(s.hint)}"><span class="sk-ico">${SKILL_ICON[s.id]}</span><b>${s.label}</b>${starsHtml(n)}</div>`;
  }).join("")}</div>`;
}

const dayWord = (d) => (d <= 0 ? "bugün" : d === 1 ? "yarın" : `${d} gün sonra`);

/** 1 · 3 · 7 · 30 · 120 günlük tekrar merdiveni; kartın bulunduğu basamak ve bir sonraki tekrar. */
export function ladderHtml(card, today) {
  const c = normalize(card);
  if (!c || c.s === 3) return "";
  const step = ladderStep(c);
  const next = c.s === 2 ? `Sonraki tekrar: <b>${dayWord(c.due - today)}</b>` : "İlk tekrar: <b>ertesi gün</b>";
  return `<div class="ladder" aria-label="Tekrar merdiveni">
    <div class="ladder-head"><span>Tekrar aralığı (gün)</span><span>${next}</span></div>
    <div class="ladder-track">${LADDER.map((d, i) => `<div class="rung${i < step ? " done" : i === step - 1 ? " now" : ""}"><i></i><b>${d}</b></div>`).join("")}</div>
  </div>`;
}
