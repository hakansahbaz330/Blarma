import test from "node:test";
import assert from "node:assert/strict";
import { review, graduate, newProgress, dueWords, forecast, pickNewWords, hashKey, MAX_INTERVAL, retrievability, intervalFor, gradeFor, normalize, stageIndex, memoryStrength, newWordBudget } from "../js/srs.js";
import { checkTyped, toWordObjects, buildIndex, distractors, clozeParts, makeExercise, pickType } from "../js/exercises.js";
import { levenshtein, normalizeAnswer, mulberry32, dayNumber } from "../js/util.js";
import { createStore } from "../js/store.js";
import { createSession } from "../js/session.js";
import { readFileSync } from "node:fs";

// Gerçek veri dosyasını yükle
const src = readFileSync(new URL("../data/words.js", import.meta.url), "utf8");
const rows = JSON.parse(src.slice(src.indexOf("[["), src.lastIndexOf("]") + 1));
const words = toWordObjects(rows);
const index = buildIndex(words);

test("veri: 4954 kelime, A1-C1, her kelimede en az 1 Türkçe karşılık", () => {
  assert.equal(words.length, 4954);
  const levels = new Set(words.map((w) => w.level));
  assert.deepEqual([...levels].sort(), ["a1", "a2", "b1", "b2", "c1"]);
  assert.ok(words.every((w) => w.tr.length >= 1 && w.tr.every((t) => t.length > 0)));
  assert.equal(new Set(words.map((w) => w.word)).size, words.length);
  const multi = words.filter((w) => w.tr.length >= 2).length;
  assert.ok(multi / words.length > 0.9, "kelimelerin %90+ında birden fazla karşılık olmalı");
});

test("srs: ilk tekrar ertesi gün, sonra aralıklar yaklaşık 2-3 kat büyür", () => {
  let c = graduate(newProgress(100), 0, 100);
  assert.equal(c.due, 101);
  const ivs = [];
  for (let i = 0; i < 6; i++) { c = review(c, 2, c.due); ivs.push(c.iv); }
  assert.ok(ivs[0] >= 2 && ivs[0] <= 4, `ilk aralık ${ivs}`);
  for (let i = 1; i < ivs.length; i++) assert.ok(ivs[i] > ivs[i - 1] * 1.5, `aralık büyümüyor: ${ivs}`);
  for (let i = 0; i < 12; i++) c = review(c, 2, c.due);
  assert.equal(c.iv, MAX_INTERVAL);
});

test("srs: unutma eğrisi t=kararlılık iken %90, süre uzadıkça düşer; aralık hedef oranla uyumlu", () => {
  const c = { s: 2, st: 10, last: 0, due: 10 };
  assert.ok(Math.abs(retrievability(c, 10) - 0.9) < 1e-9);
  assert.ok(retrievability(c, 40) < retrievability(c, 10));
  assert.equal(intervalFor(10, 0.9), 10);
  assert.ok(intervalFor(10, 0.8) > intervalFor(10, 0.9));
});

test("srs: geç yapılan başarılı tekrar (hafıza zayıfken) kararlılığı daha çok artırır", () => {
  const base = graduate(newProgress(0), 0, 0);
  const onTime = review(review(base, 2, base.due), 2, base.due + 3);
  const late = review(review(base, 2, base.due), 2, base.due + 12);
  assert.ok(late.st > onTime.st, `${late.st} > ${onTime.st}`);
});

test("srs: zor cevap az, kolay cevap çok artırır; yanlış kararlılığı düşürür ve ertesi güne alır", () => {
  let c = graduate(newProgress(0), 0, 0);
  c = review(c, 2, c.due);
  const hard = review(c, 1, c.due), good = review(c, 2, c.due), easy = review(c, 3, c.due);
  assert.ok(hard.st < good.st && good.st < easy.st);
  const lapse = review(c, 0, c.due);
  assert.equal(lapse.iv, 1);
  assert.ok(lapse.st < c.st);
  assert.equal(lapse.lapses, 1);
  assert.ok(lapse.d > c.d && easy.d < c.d, "güçlük yanlışta artar, kolayda azalır");
});

test("srs: eski kartlar yeni modele çevrilir, yeni kartlara dokunulmaz", () => {
  const old = { s: 2, due: 20, iv: 10, ease: 2.5, reps: 3, lapses: 0, ok: 3, seen: 3, fav: 0 };
  const n = normalize(old);
  assert.equal(n.st, 10);
  assert.equal(n.last, 10);
  assert.equal(normalize(n), n);
});

test("srs: otomatik not — doğru/hızlı, ipucu, yakın yazım, yavaş", () => {
  assert.equal(gradeFor({ correct: false }), 0);
  assert.equal(gradeFor({ correct: true, hinted: true }), 1);
  assert.equal(gradeFor({ correct: true, close: true, typed: true }), 1);
  assert.equal(gradeFor({ correct: true, ms: 20000 }), 1);
  assert.equal(gradeFor({ correct: true, ms: 3000 }), 2, "çoktan seçmeli hızlı doğru 'kolay' sayılmaz (şans payı)");
  assert.equal(gradeFor({ correct: true, typed: true, reps: 3, ms: 4000 }), 3);
});

test("srs: aşamalar ve hafıza gücü", () => {
  assert.equal(stageIndex({ s: 1 }), 0);
  assert.equal(stageIndex({ s: 2, st: 5, last: 0, due: 5 }), 1);
  assert.equal(stageIndex({ s: 2, st: 15, last: 0, due: 15 }), 2);
  assert.equal(stageIndex({ s: 2, st: 45, last: 0, due: 45 }), 3);
  assert.equal(stageIndex({ s: 3 }), -1);
  assert.equal(memoryStrength({}, 5), null);
  const m = memoryStrength({ a: { s: 2, st: 10, last: 0, due: 10 } }, 10);
  assert.ok(Math.abs(m - 0.9) < 1e-9);
});

test("srs: tekrarlar birikince yeni kelime azalır, başarı düşükse de azalır", () => {
  assert.deepEqual(newWordBudget({ goal: 10, doneToday: 0, dueCount: 3, recentAccuracy: 0.9 }), { count: 10, reason: null });
  assert.equal(newWordBudget({ goal: 10, doneToday: 4, dueCount: 3, recentAccuracy: null }).count, 6);
  assert.equal(newWordBudget({ goal: 10, doneToday: 0, dueCount: 20, recentAccuracy: 0.9 }).count, 4);
  assert.equal(newWordBudget({ goal: 10, doneToday: 0, dueCount: 40, recentAccuracy: 0.9 }).count, 0);
  assert.equal(newWordBudget({ goal: 10, doneToday: 0, dueCount: 2, recentAccuracy: 0.6 }).count, 5);
});

test("srs: dueWords ve forecast", () => {
  const prog = {
    a: { s: 2, due: 5 }, b: { s: 2, due: 10 }, c: { s: 3, due: 0 }, d: { s: 1, due: 0 }, e: { s: 2, due: 3 },
  };
  assert.deepEqual(dueWords(prog, 6), ["e", "a"]);
  assert.deepEqual(forecast(prog, 6, 7), [2, 0, 0, 0, 1, 0, 0]);
});

test("pickNewWords: seviye sırasına uyar, görülenleri atlar", () => {
  const prog = { [words.find((w) => w.level === "a1").word]: { s: 3 } };
  const picked = pickNewWords(words, prog, ["a1", "a2"], 20, (w) => hashKey(w, 7));
  assert.equal(picked.length, 20);
  assert.ok(picked.every((w) => w.level === "a1"));
  assert.ok(!picked.some((w) => prog[w.word]));
  const again = pickNewWords(words, prog, ["a1", "a2"], 20, (w) => hashKey(w, 7));
  assert.deepEqual(picked.map((w) => w.word), again.map((w) => w.word), "sıra kararlı olmalı");
});

test("cevap denetimi: tam, küçük harf, 1 harf hatası", () => {
  assert.deepEqual(checkTyped("beautiful", "Beautiful "), { ok: true, close: false });
  assert.deepEqual(checkTyped("beautiful", "beautifull"), { ok: true, close: true });
  assert.deepEqual(checkTyped("cat", "car"), { ok: false, close: false });
  assert.deepEqual(checkTyped("ice cream", "ice  cream"), { ok: true, close: false });
  assert.deepEqual(checkTyped("beautiful", ""), { ok: false, close: false });
  assert.equal(levenshtein("kitten", "sitting"), 3);
  assert.equal(normalizeAnswer("  Don’t! "), "don't");
});

test("alıştırmalar: çeldiriciler doğru cevapla çakışmaz, tüm türler üretilir", () => {
  const rng = mulberry32(42);
  const sample = words.filter((_, i) => i % 37 === 0);
  for (const w of sample) {
    for (const type of ["mcq_en_tr", "mcq_tr_en", "listen_mcq", "type_en", "dictation", "cloze", "speak"]) {
      const ex = makeExercise(type, w, index, rng, {});
      assert.ok(ex.type);
      if (ex.options) {
        assert.equal(ex.options.filter((o) => o.correct).length, 1, `${w.word}/${type}`);
        assert.equal(new Set(ex.options.map((o) => o.label)).size, ex.options.length, "tekrarlı seçenek");
        assert.ok(ex.options.length >= 3, `${w.word}/${type} seçenek sayısı`);
      }
    }
  }
});

test("cloze: örnek cümlede birebir geçen kelime boşlukla değiştirilir", () => {
  const w = words.find((x) => x.word === "apple");
  const p = clozeParts(w);
  assert.equal(p.token.toLowerCase(), "apple");
  assert.equal(p.before + p.token + p.after, w.example);
  const share = words.filter((x) => clozeParts(x)).length / words.length;
  assert.ok(share > 0.5, `cloze oranı düşük: ${share}`);
});

test("pickType: yeni kart basit, olgun kart yazılı alıştırma alır", () => {
  const rng = mulberry32(1);
  const w = words.find((x) => x.word === "apple");
  const caps = { audio: true, speaking: false };
  for (let i = 0; i < 20; i++) assert.ok(["mcq_en_tr", "listen_mcq", "mcq_tr_en"].includes(pickType({ reps: 0 }, w, caps, null, rng)));
  const mature = new Set(Array.from({ length: 60 }, () => pickType({ reps: 6 }, w, caps, null, rng)));
  assert.ok(mature.has("type_en") && !mature.has("speak"));
});

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
}

test("seri: ardışık gün artar, tek gün kaçırınca dondurma kullanılır, sonra sıfırlanır", () => {
  const store = createStore(memStorage());
  store.recordAnswer({ ok: true, xp: 10 }, 100);
  assert.equal(store.state.stats.streak, 1);
  store.recordAnswer({ ok: true, xp: 10 }, 101);
  assert.equal(store.state.stats.streak, 2);
  store.recordAnswer({ ok: true, xp: 10 }, 103); // 1 gün atlandı, dondurma var
  assert.equal(store.state.stats.streak, 3);
  assert.equal(store.state.stats.freezes, 0);
  assert.equal(store.currentStreak(104), 3);
  store.recordAnswer({ ok: true, xp: 10 }, 107); // 3 gün boşluk
  assert.equal(store.state.stats.streak, 1);
});

test("depo: dışa/içe aktarma ve bozuk veriye dayanıklılık", () => {
  const s = memStorage();
  const a = createStore(s);
  a.state.prog.apple = { s: 3 };
  a.save();
  const b = createStore(s);
  assert.deepEqual(b.state.prog.apple, { s: 3 });
  const json = b.exportJson();
  const c = createStore(memStorage());
  c.importJson(json);
  assert.deepEqual(c.state.prog.apple, { s: 3 });
  assert.throws(() => c.importJson("{}"));
  const bad = memStorage();
  bad.setItem("kelimebahcesi.v1", "{bozuk");
  assert.doesNotThrow(() => createStore(bad));
});

test("oturum: yeni kelimeler tanıtılır, iki doğru cevapla tekrar aşamasına geçer", () => {
  const store = createStore(memStorage());
  store.state.settings.goal = 3;
  store.state.settings.levels = ["a1"];
  const today = 500;
  const s = createSession({ store, index, mode: "daily", rng: mulberry32(3), caps: { audio: false, speaking: false }, today });
  assert.equal(s.total, 9); // 3 tanıtım + 3 + 3 alıştırma
  const learned = [];
  let guard = 0;
  while (!s.done && guard++ < 100) {
    const t = s.current();
    if (t.kind === "intro") { s.decideIntro("learn"); continue; }
    const r = s.submit({ correct: true });
    assert.ok(r.xp > 0);
  }
  const sum = s.summary();
  assert.equal(sum.learned.length, 3);
  for (const w of sum.learned) {
    assert.equal(store.state.prog[w].s, 2);
    assert.equal(store.state.prog[w].due, today + 1);
    learned.push(w);
  }
  assert.equal(store.dayStats(today).n, 3);
  // Ertesi gün tekrar listesinde olmalı
  assert.deepEqual(new Set(dueWords(store.state.prog, today + 1)), new Set(learned));
});

test("oturum: yanlış cevap aynı görevi tekrar kuyruğa koyar; biliyorum işareti yeni kelime getirir", () => {
  const store = createStore(memStorage());
  store.state.settings.goal = 3;
  store.state.settings.levels = ["a1"];
  const s = createSession({ store, index, mode: "daily", rng: mulberry32(9), caps: {}, today: 10 });
  const first = s.current();
  assert.equal(first.kind, "intro");
  const w = first.word;
  s.decideIntro("known");
  assert.equal(store.state.prog[w].s, 3);
  // Bir kelime düştü, yerine bir yenisi eklendi: toplam yine 3 kelime
  const seen = new Set();
  let guard = 0;
  while (!s.done && guard++ < 100) {
    const t = s.current();
    seen.add(t.word);
    if (t.kind === "intro") { s.decideIntro("learn"); continue; }
    s.submit({ correct: true });
  }
  assert.equal(seen.size, 3);
  assert.ok(!seen.has(w));

  // Yanlış cevap
  const store2 = createStore(memStorage());
  store2.state.settings.goal = 3; store2.state.settings.levels = ["a1"];
  const s2 = createSession({ store: store2, index, mode: "daily", rng: mulberry32(9), caps: {}, today: 10 });
  while (s2.current().kind === "intro") s2.decideIntro("learn");
  const before = s2.remaining;
  const t = s2.current();
  s2.submit({ correct: false });
  assert.equal(s2.remaining, before, "yanlış cevap görevi geri koyar");
  assert.equal(s2.current().word === t.word || s2.remaining > 0, true);
});

test("oturum: tekrar sorusu yanlışsa kart sıfırlanır ve 'relearn' görevi eklenir", () => {
  const store = createStore(memStorage());
  store.state.settings.goal = 0;
  const wd = words[0].word;
  store.state.prog[wd] = { ...newProgress(0), s: 2, due: 5, iv: 20, reps: 4, ease: 2.5 };
  const s = createSession({ store, index, mode: "review", rng: mulberry32(5), caps: {}, today: 6 });
  assert.equal(s.total, 1);
  s.current();
  s.submit({ correct: false });
  assert.equal(store.state.prog[wd].iv, 1);
  assert.equal(store.state.prog[wd].lapses, 1);
  assert.equal(s.remaining, 1);
  s.current();
  s.submit({ correct: true });
  assert.ok(s.done);
});

test("oturum: yarım kalan öğrenme kartları ertesi oturumda yeniden gelir", () => {
  const store = createStore(memStorage());
  store.state.settings.goal = 3;
  store.state.settings.levels = ["a1"];
  const s1 = createSession({ store, index, mode: "daily", rng: mulberry32(2), caps: {}, today: 20 });
  const w = s1.current().word;
  s1.decideIntro("learn"); // s=1 olarak kaldı, oturum yarıda bırakıldı
  const s2 = createSession({ store, index, mode: "daily", rng: mulberry32(2), caps: {}, today: 20 });
  const words2 = new Set();
  while (!s2.done) { const t = s2.current(); words2.add(t.word); if (t.kind === "intro") s2.decideIntro("learn"); else s2.submit({ correct: true }); }
  assert.ok(words2.has(w));
});

test("dayNumber yerel gün sınırını kullanır", () => {
  const a = dayNumber(new Date(2026, 0, 1, 0, 5));
  const b = dayNumber(new Date(2026, 0, 1, 23, 55));
  const c = dayNumber(new Date(2026, 0, 2, 0, 5));
  assert.equal(a, b);
  assert.equal(c, a + 1);
});

test("oturum: 'biliyorum' ile yerine gelen kelime sırada zaten bulunan bir kelime olamaz (yinelenme yok)", () => {
  const store = createStore(memStorage());
  store.state.settings.goal = 10;
  store.state.settings.levels = ["a1"];
  const s = createSession({ store, index, mode: "daily", rng: mulberry32(11), caps: {}, today: 30 });
  const introduced = [];
  let guard = 0;
  while (!s.done && guard++ < 500) {
    const t = s.current();
    if (t.kind === "intro") {
      introduced.push(t.word);
      s.decideIntro(introduced.length % 3 === 0 ? "known" : "learn"); // her üçüncüyü biliyorum de
    } else s.submit({ correct: true });
  }
  assert.equal(new Set(introduced).size, introduced.length, "bir kelime iki kez tanıtıldı");
  assert.equal(s.summary().learned.length, 10, "hedef kadar yeni kelime öğrenilmeli");
  assert.equal(new Set(s.summary().learned).size, 10);
});

import { buildPrompt, parseStory, missingWords, renderStoryHtml, generateStory, pickStoryWords } from "../js/stories.js";

test("hikâye: istem, ayrıştırma, doğrulama ve güvenli çıktı", () => {
  const p = buildPrompt({ words: ["apple", "run"], level: "a2", length: 100 });
  assert.ok(p.includes("apple, run") && p.includes("A2") && p.includes("ONLY valid JSON"));
  const story = parseStory('```json\n{"title":"T","story_en":"I **run** to the **apple** tree.","story_tr":"Elma ağacına **koşarım**."}\n```');
  assert.equal(story.tr.includes("*"), false);
  assert.deepEqual(missingWords(story, ["apple", "run", "cat"]), ["cat"]);
  assert.deepEqual(missingWords({ en: "She is **running** fast." }, ["run"]), [], "çekimli biçim kabul edilir");
  assert.equal(renderStoryHtml("<b>x</b> **hi**"), "<p>&lt;b&gt;x&lt;/b&gt; <mark>hi</mark></p>", "HTML kaçışlanmalı");
  assert.throws(() => parseStory("not json"));
});

test("hikâye: eksik kelimede bir kez yeniden dener, anahtar yoksa hata verir", async () => {
  const calls = [];
  const replies = [
    '{"title":"A","story_en":"I **run**.","story_tr":"Koşarım."}',
    '{"title":"B","story_en":"I **run** and eat an **apple**.","story_tr":"Koşar ve elma yerim."}',
  ];
  const fetchImpl = async (url, init) => {
    calls.push(JSON.parse(init.body));
    assert.equal(init.headers["x-api-key"], "sk-test");
    return { ok: true, status: 200, json: async () => ({ content: [{ type: "text", text: replies[calls.length - 1] }] }) };
  };
  const r = await generateStory({ apiKey: "sk-test", words: ["run", "apple"], level: "a1", fetchImpl });
  assert.equal(calls.length, 2);
  assert.ok(calls[1].messages[0].content.includes("forgot these target words: apple"));
  assert.equal(r.title, "B");
  assert.deepEqual(r.missing, []);
  await assert.rejects(() => generateStory({ apiKey: "", words: ["a"], fetchImpl }), /API anahtarını/);
  const bad = async () => ({ ok: false, status: 401, json: async () => ({}) });
  await assert.rejects(() => generateStory({ apiKey: "x", words: ["a"], fetchImpl: bad }), /geçersiz/);
});

test("hikâye kelime seçimi yalnızca tekrar aşamasındaki kelimelerden gelir", () => {
  const prog = { apple: { s: 2, reps: 1, due: 5, lapses: 0 }, book: { s: 2, reps: 3, due: 9, lapses: 4 }, cat: { s: 1 }, dog: { s: 3 } };
  const idx = { byWord: new Map(["apple", "book", "cat", "dog"].map((w) => [w, {}])) };
  assert.deepEqual(pickStoryWords(prog, idx, "hard", 5), ["book", "apple"]);
  assert.deepEqual(pickStoryWords(prog, idx, "recent", 1), ["apple"]);
});

import { lookupToken, tokenize } from "../js/lemma.js";

test("lemma: çekimli kelimeler sözlükteki karşılığına bağlanır", () => {
  const expect = { walked: "walk", children: "child", went: "go", was: "be", jumping: "jump", boxes: "box", studies: "study", bought: "buy", Walking: "walk", "teacher's": "teacher", happier: "happy" };
  for (const [tok, base] of Object.entries(expect)) {
    const hit = lookupToken(tok, index.byWord);
    assert.equal(hit && hit.word, base, `${tok} -> ${base}`);
  }
  assert.equal(lookupToken("zzzxq", index.byWord), null);
  assert.deepEqual(tokenize("It's 5 o'clock!").filter((t) => t.word).map((t) => t.t), ["It's", "o'clock"]);
});

test("hikâye kütüphanesi: paragraflar eşleşir, kelimelerin çoğu sözlükte bulunur", () => {
  const src = readFileSync(new URL("../data/stories.js", import.meta.url), "utf8");
  const stories = new Function("window", src + "; return window.KB_STORIES;")({});
  assert.equal(stories.length, 10);
  const ids = new Set();
  for (const s of stories) {
    assert.ok(!ids.has(s.id)); ids.add(s.id);
    assert.equal(s.en.length, s.tr.length, s.id);
    assert.ok(["a1", "a2", "b1", "b2", "c1"].includes(s.level));
    const toks = tokenize(s.en.join(" ")).filter((t) => t.word);
    const found = toks.filter((t) => lookupToken(t.t, index.byWord)).length;
    assert.ok(found / toks.length > 0.8, `${s.id}: sözlük kapsamı ${found}/${toks.length}`);
  }
});

test("emoji verisi: yalnızca listedeki kelimeler, görsel testi 4 farklı seçenek üretir", () => {
  const src = readFileSync(new URL("../data/emoji.js", import.meta.url), "utf8");
  const map = new Function("window", src + "; return window.KB_EMOJI;")({});
  const keys = Object.keys(map);
  assert.ok(keys.length > 500);
  assert.ok(keys.every((k) => index.byWord.has(k)), "emoji anahtarları kelime listesinde olmalı");
  globalThis.window = { KB_EMOJI: map };
  const rng = mulberry32(5);
  for (const w of keys.slice(0, 60).map((k) => index.byWord.get(k))) {
    const ex = makeExercise("emoji_mcq", w, index, rng, {});
    assert.equal(ex.type, "emoji_mcq");
    assert.equal(ex.options.filter((o) => o.correct).length, 1);
    assert.ok(ex.options.length >= 3 && new Set(ex.options.map((o) => o.label)).size === ex.options.length);
  }
  const nonEmoji = index.byWord.get("abandon");
  assert.equal(makeExercise("emoji_mcq", nonEmoji, index, rng, {}).type, "mcq_en_tr", "görseli olmayan kelime yedeğe düşer");
  delete globalThis.window;
});

test("örnek cümle çevirileri: her kelimede var, boş ya da İngilizce kopya değil", () => {
  assert.equal(words.length, 4954);
  const bad = words.filter((w) => !w.exampleTr || w.exampleTr.length < 4 || w.exampleTr === w.example);
  assert.equal(bad.length, 0, "eksik/bozuk: " + bad.slice(0, 5).map((w) => w.word).join(","));
  assert.ok(words.filter((w) => /[çğıöşüÇĞİÖŞÜ]/.test(w.exampleTr)).length / words.length > 0.5, "çoğu çeviride Türkçe karakter olmalı");
});
