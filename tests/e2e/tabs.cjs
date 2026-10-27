// Pratik yap, Hikâyeler (okuyucu + dokunarak çeviri), slayt gösterisi ve günün görevleri için uçtan uca test.
const { chromium } = require("playwright");
const URL = process.env.URL || "http://localhost:8080/";
const OUT = process.env.OUT || "/tmp";
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; throw new Error(m); } else console.log("ok -", m); };

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(URL);
  await page.waitForSelector(".modal");
  await page.click('[data-a="onb-a1"]');
  await page.waitForSelector(".plan");
  await page.screenshot({ path: `${OUT}/20-learn.png`, fullPage: true });
  assert((await page.locator(".wod-item").count()) === 6, "günün kelimeleri 6 görsel");

  // Öğrenilmiş kelimeler ekle (emoji'li)
  await page.evaluate(() => {
    const { store, ctx } = window.__kb;
    const today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    const have = ctx.words.filter((w) => window.KB_EMOJI[w.word] && w.level === "a1").slice(0, 12);
    have.forEach((w) => { store.state.prog[w.word] = { s: 2, due: today + 5, iv: 3, ease: 2.5, reps: 2, lapses: 0, ok: 2, seen: 2, fav: 0 }; });
    store.save(); window.__kb.render();
  });

  // Pratik yap
  await page.click('[data-a="nav"][data-v="practice"]');
  await page.waitForSelector(".plist-row");
  assert((await page.locator(".plist-row").count()) === 12, "12 pratik modu listelendi");
  await page.screenshot({ path: `${OUT}/21-practice.png`, fullPage: true });
  await page.click('[data-a="pr:visual"]');
  await page.waitForSelector(".emoji-big");
  await page.screenshot({ path: `${OUT}/22-visual.png` });
  for (let g = 0; g < 60 && !(await page.locator(".summary").count()); g++) {
    if (await page.locator('[data-a="s:next"]').count()) { await page.click('[data-a="s:next"]'); await page.waitForTimeout(40); continue; }
    const ex = await page.evaluate(() => window.__kb.currentExercise());
    if (ex && ex.options) { await page.locator("#opts .opt").nth(ex.options.findIndex((o) => o.correct)).click(); await page.waitForTimeout(40); }
    else await page.waitForTimeout(80);
  }
  await page.waitForSelector(".summary");
  const before = await page.evaluate(() => JSON.stringify(Object.values(window.__kb.store.state.prog).map((c) => c.due)));
  await page.click('[data-a="s:done"]');
  const after = await page.evaluate(() => JSON.stringify(Object.values(window.__kb.store.state.prog).map((c) => c.due)));
  assert(before === after, "pratik modu zamanlamayı değiştirmedi");

  // Harf kutularıyla yazma
  await page.evaluate(() => { window.__kb.store.state.settings.writeMode = "tiles"; window.__kb.store.save(); });
  await page.click('[data-a="pr:write"]');
  await page.waitForSelector(".slots");
  await page.screenshot({ path: `${OUT}/21b-tiles.png` });
  let typed = 0;
  for (let g = 0; g < 60 && !(await page.locator(".summary").count()); g++) {
    if (await page.locator('[data-a="s:next"]').count()) { await page.click('[data-a="s:next"]'); await page.waitForTimeout(40); continue; }
    const ex = await page.evaluate(() => window.__kb.currentExercise());
    if (ex && ex.answer && await page.locator(".slots").count()) {
      if (typed === 0) { // ipucu: ilk harfi doldurur
        await page.click('[data-a="s:hint"]');
        assert((await page.locator(".slot.f").count()) === 1, "ipucu bir harf yerleştirdi");
        await page.click('.slot.f'); // geri al
      }
      for (const ch of ex.answer.toLowerCase()) await page.click(`.ltile[data-l="${ch}"]:not([disabled])`);
      typed++;
      await page.waitForTimeout(250);
    } else await page.waitForTimeout(80);
  }
  assert(typed >= 5, `harf kutularıyla ${typed} kelime yazıldı`);
  await page.click('[data-a="s:done"]');
  // Dinleme: görsel seçenekler
  await page.click('[data-a="pr:listen"]');
  await page.waitForSelector("#opts");
  let sawEmojiOpts = false;
  for (let g = 0; g < 40 && !(await page.locator(".summary").count()); g++) {
    if (await page.locator('[data-a="s:next"]').count()) { await page.click('[data-a="s:next"]'); await page.waitForTimeout(40); continue; }
    const ex = await page.evaluate(() => window.__kb.currentExercise());
    if (ex && ex.options) { if (ex.emojiOptions) sawEmojiOpts = true; await page.locator("#opts .opt").nth(ex.options.findIndex((o) => o.correct)).click(); await page.waitForTimeout(40); }
    else await page.waitForTimeout(60);
  }
  assert(sawEmojiOpts, "dinleme modunda görsel seçenekli soru çıktı");
  await page.click('[data-a="s:done"]');

  // Liste ekranından pratik + "bildiklerimden çıkar"
  await page.evaluate(() => { const { store } = window.__kb; store.state.prog.apple = { s: 3, due: 0 }; store.state.prog.cat = { s: 3, due: 0 }; store.state.prog.dog = { s: 3, due: 0 }; store.state.prog.egg = { s: 3, due: 0 }; store.state.prog.cup = { s: 3, due: 0 }; store.state.prog.pen = { s: 3, due: 0 }; store.state.prog.bus = { s: 3, due: 0 }; store.save(); });
  await page.click('[data-a="nav"][data-v="progress"]');
  await page.click('[data-a="prog-open"][data-v="known"]');
  await page.waitForSelector(".x-btn");
  assert(await page.locator('[data-a="list-practice"]').count() === 1, "liste ekranında Pratik yap düğmesi");
  const nKnown = await page.locator(".witem").count();
  await page.locator(".x-btn").first().click();
  assert((await page.locator(".witem").count()) === nKnown - 1, "X ile bildiklerimden çıkarıldı");
  await page.click('[data-a="list-practice"]');
  await page.waitForSelector(".sess-body");
  await page.click('[data-a="s:exit"]');
  await page.click('[data-a="s:exit-yes"]');
  await page.click('[data-a="nav"][data-v="practice"]');

  // Meditasyon
  await page.evaluate(() => { const d = document.querySelector('.more-modes'); if (d) d.open = true; });
  await page.click('[data-a="pr:meditate"]');
  await page.waitForSelector("#med-range");
  await page.screenshot({ path: `${OUT}/27-meditation-setup.png` });
  await page.click('[data-a="med:start"]');
  await page.waitForSelector(".med-tr.in");
  await page.waitForSelector(".med-en.in", { timeout: 6000 });
  assert((await page.textContent("#med-en")).length > 0, "meditasyonda İngilizce kelime göründü");
  await page.screenshot({ path: `${OUT}/28-meditation.png` });
  await page.click('[data-a="med:close"]');

  // Slayt gösterisi
  await page.evaluate(() => { const d = document.querySelector('.more-modes'); if (d) d.open = true; });
  await page.click('[data-a="pr:slides"]');
  await page.waitForSelector("#slide .big");
  await page.screenshot({ path: `${OUT}/23-slides.png` });
  const w1 = await page.textContent("#slide .big");
  await page.click('[data-a="slide:next"]');
  await page.waitForTimeout(200);
  assert((await page.textContent("#slide .big")) !== w1, "slayt ilerledi");
  await page.click('[data-a="slide:close"]');

  // Hikâyeler
  await page.click('[data-a="nav"][data-v="stories"]');
  await page.waitForSelector(".story-card");
  assert((await page.locator(".story-card").count()) === 10, "10 hikâye listelendi");
  await page.screenshot({ path: `${OUT}/24-stories.png`, fullPage: true });
  await page.fill("#sq", "cafe");
  await page.waitForTimeout(100);
  assert((await page.locator(".story-card").count()) === 1, "hikâyelerde kelime araması çalıştı");
  await page.fill("#sq", "");
  await page.click('[data-a="st-filter"][data-v="b1"]');
  assert((await page.locator(".story-card").count()) === 2, "B1 filtresi 2 hikâye");
  await page.click('[data-a="st-filter"][data-v="all"]');
  await page.click('[data-a="story-read"][data-id="my-day"]');
  await page.waitForSelector(".detail-hero");
  assert((await page.textContent(".detail")).includes("Hedef kelimeler"), "hikâye detay sayfası");
  await page.screenshot({ path: `${OUT}/24b-detail.png` });
  await page.click('[data-a="target-open"]');
  await page.waitForSelector("#tok-sheet");
  const nTarget = await page.locator("#tok-sheet .row.grow, #tok-sheet .stack > .row").count();
  assert(nTarget > 3, "hedef kelimeler listelendi (" + nTarget + ")");
  await page.click('[data-a="target-add-all"]');
  assert(await page.evaluate(() => Object.keys(window.__kb.store.state.prog).length) > 15, "hedef kelimeler öğrenme listesine eklendi");
  await page.click('[data-a="reader-start"]');
  await page.waitForSelector(".sent");
  assert((await page.locator(".sent").count()) === 9, "9 cümle satırı");
  await page.click('.sent-tr[data-i="0"]');
  assert((await page.textContent("#sent-0")).includes("Saat yedide kalkarım"), "cümle çevirisi açıldı");
  await page.click('[data-a="reader-font"]');
  await page.click('.tok[data-w="breakfast"]');
  await page.waitForSelector("#tok-sheet");
  assert((await page.textContent("#tok-sheet")).includes("kahvaltı"), "kelimeye dokununca Türkçe karşılık açıldı");
  await page.screenshot({ path: `${OUT}/25-token.png` });
  await page.click('[data-a="tok-close"]');
  await page.click('[data-a="reader-tr"]');
  assert((await page.textContent("#reader-text")).includes("Sekizde otobüsle"), "tüm çeviriler açıldı");
  await page.screenshot({ path: `${OUT}/26-reader.png` });
  // Dinle: ses yoksa zamanlayıcıyla cümleler vurgulanır
  await page.click('[data-a="reader-listen"]');
  await page.waitForSelector(".sent.on", { timeout: 4000 });
  assert(true, "dinleme modunda cümle vurgulandı");
  await page.click('[data-a="reader-listen"]');
  await page.click('[data-a="reader-done"]');
  await page.waitForSelector(".story-card");
  assert((await page.textContent("#app")).includes("Okundu"), "hikâye okundu işaretlendi");

  // Günün hikâyesi görevi
  await page.click('[data-a="nav"][data-v="learn"]');
  await page.waitForSelector(".plan");
  assert((await page.locator(".plan-row.done").count()) >= 1, "günün hikâyesi görevi tamamlandı (seri sayacı)");

  assert(errors.length === 0, "konsol hatası yok " + JSON.stringify(errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
