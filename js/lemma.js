// Hikâye okuyucusu için basit çekim çözümleyici: "walked" -> "walk", "children" -> "child".
const IRREGULAR = {
  am: "be", is: "be", are: "be", was: "be", were: "be", been: "be", being: "be",
  has: "have", had: "have", does: "do", did: "do", done: "do", doing: "do",
  went: "go", gone: "go", goes: "go", saw: "see", seen: "see", ate: "eat", eaten: "eat",
  said: "say", took: "take", taken: "take", got: "get", gotten: "get", made: "make",
  came: "come", found: "find", gave: "give", given: "give", told: "tell", felt: "feel",
  left: "leave", bought: "buy", ran: "run", sat: "sit", wrote: "write", written: "write",
  knew: "know", known: "know", thought: "think", brought: "bring", began: "begin", begun: "begin",
  broke: "break", broken: "break", chose: "choose", chosen: "choose", drew: "draw", drawn: "draw",
  drank: "drink", drunk: "drink", drove: "drive", driven: "drive", flew: "fly", flown: "fly",
  forgot: "forget", forgotten: "forget", grew: "grow", grown: "grow", heard: "hear", held: "hold",
  kept: "keep", lost: "lose", met: "meet", paid: "pay", put: "put", read: "read", rode: "ride",
  sang: "sing", sung: "sing", slept: "sleep", spoke: "speak", spent: "spend", stood: "stand",
  taught: "teach", understood: "understand", woke: "wake", wore: "wear", worn: "wear", won: "win",
  men: "man", women: "woman", children: "child", feet: "foot", teeth: "tooth", mice: "mouse", people: "people",
  better: "good", best: "good", worse: "bad", worst: "bad", "i'm": "i", "it's": "it", "don't": "do", "can't": "can",
};

/** Verilen belirteç için sözlükteki kelimeyi bulur; yoksa null. */
export function lookupToken(raw, byWord) {
  const t = raw.toLowerCase().replace(/[’`]/g, "'").replace(/^'+|'+$/g, "");
  if (!t) return null;
  const tryW = (w) => (byWord.has(w) ? byWord.get(w) : null);
  let hit = tryW(t);
  if (hit) return hit;
  if (IRREGULAR[t]) { hit = tryW(IRREGULAR[t]); if (hit) return hit; }
  const base = t.replace(/'s$/, "");
  const cands = [base];
  if (/ies$/.test(base)) cands.push(base.slice(0, -3) + "y");
  if (/(es)$/.test(base)) cands.push(base.slice(0, -2));
  if (/s$/.test(base)) cands.push(base.slice(0, -1));
  if (/ied$/.test(base)) cands.push(base.slice(0, -3) + "y");
  if (/ed$/.test(base)) { cands.push(base.slice(0, -2), base.slice(0, -1)); if (/(.)\1ed$/.test(base)) cands.push(base.slice(0, -3)); }
  if (/ing$/.test(base)) { const s = base.slice(0, -3); cands.push(s, s + "e"); if (/(.)\1$/.test(s)) cands.push(s.slice(0, -1)); }
  if (/ly$/.test(base)) cands.push(base.slice(0, -2));
  if (/ier$/.test(base)) cands.push(base.slice(0, -3) + "y");
  if (/iest$/.test(base)) cands.push(base.slice(0, -4) + "y");
  if (/er$/.test(base)) cands.push(base.slice(0, -2), base.slice(0, -1));
  if (/est$/.test(base)) cands.push(base.slice(0, -3), base.slice(0, -2));
  for (const c of cands) { hit = tryW(c); if (hit) return hit; }
  return null;
}

/** Metni kelime/boşluk parçalarına böler: [{t:"Hello", word:true}, {t:", "}] */
export function tokenize(text) {
  const out = [];
  const re = /([A-Za-z]+(?:['’][A-Za-z]+)?)|([^A-Za-z]+)/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1] ? { t: m[1], word: true } : { t: m[2] });
  return out;
}
