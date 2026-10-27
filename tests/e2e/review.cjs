// Tekrar akışı, yazılı/cloze/dikte alıştırmaları, yanlış cevap ve seviye testi için uçtan uca test.
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

  // 24 kelimeyi, farklı olgunlukta ve bugün vadesi gelmiş olarak ekle
  await page.evaluate(() => {
    const { store, ctx } = window.__kb;
    const today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    const words = ctx.words.filter((w) => w.level === "a2").slice(0, 24);
    words.forEach((w, i) => { store.state.prog[w.word] = { s: 2, due: today - 1, iv: 10, ease: 2.5, reps: [0, 1, 2, 3, 4, 6][i % 6], lapses: 0, ok: 3, seen: 3, fav: 0 }; });
    store.state.settings.goal = 0;
    store.state.placed = true;
    store.save();
    window.__kb.render();
  });
  assert((await page.textContent("#app")).includes("24 kelime seni bekliyor"), "24 tekrar bekliyor");
  await page.screenshot({ path: `${OUT}/10-home-due.png` });
  await page.click('[data-a="task-review"]');
  await page.waitForSelector(".sess-body");

  const seen = new Set();
  let wrongDone = false, shots = {};
  for (let g = 0; g < 300; g++) {
    if (await page.locator(".summary").count()) break;
    if (await page.locator('[data-a="s:next"]').count()) { await page.click('[data-a="s:next"]'); await page.waitForTimeout(40); continue; }
    const ex = await page.evaluate(() => window.__kb.currentExercise());
    if (!ex) { await page.waitForTimeout(80); continue; }
    seen.add(ex.type + (ex.mode ? ":" + ex.mode : ""));
    if (!shots[ex.type]) { shots[ex.type] = 1; await page.screenshot({ path: `${OUT}/ex-${ex.type}${ex.mode ? "-" + ex.mode : ""}.png` }); }
    if (ex.type === "speak") { await page.click('[data-a="s:skipspeak"]'); await page.waitForTimeout(40); continue; }
    if (ex.options) {
      let idx = ex.options.findIndex((o) => o.correct);
      if (!wrongDone) { wrongDone = true; idx = ex.options.findIndex((o) => !o.correct); }
      await page.locator("#opts .opt").nth(idx).click();
      if (idx !== ex.options.findIndex((o) => o.correct)) {
        assert(await page.locator(".feedback.bad").count() === 1, "yanlış cevapta kırmızı geri bildirim");
        await page.screenshot({ path: `${OUT}/11-wrong.png` });
      }
    } else if (await page.locator("#ans").count()) {
      // ilk yazılı soruda yakın (1 harf hatalı) cevap dene
      const typo = !shots.__typo && ex.answer.length >= 5;
      if (typo) shots.__typo = 1;
      await page.fill("#ans", typo ? ex.answer.slice(0, -1) + (ex.answer.endsWith("x") ? "y" : "x") : ex.answer);
      await page.press("#ans", "Enter");
      if (typo) assert((await page.textContent("#fb")).includes("Neredeyse"), "1 harf hatası 'neredeyse' olarak kabul edildi");
    }
    await page.waitForTimeout(40);
  }
  console.log("görülen alıştırma türleri:", [...seen].join(", "));
  assert(seen.has("type_en") || seen.has("dictation") || seen.has("cloze:type"), "yazılı alıştırmalar kullanıldı");
  assert(seen.has("mcq_en_tr") && seen.has("mcq_tr_en"), "çoktan seçmeli alıştırmalar kullanıldı");
  await page.waitForSelector(".summary");
  const due = await page.evaluate(() => {
    const { store } = window.__kb;
    const today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    const cards = Object.values(store.state.prog);
    return { notDue: cards.filter((c) => c.due > today).length, lapsed: cards.filter((c) => c.lapses > 0).length, total: cards.length };
  });
  assert(due.notDue === 24, `tüm kartlar ileri bir tarihe ertelendi (${due.notDue}/24)`);
  assert(due.lapsed >= 1, "yanlış cevap bir kartta unutma sayısını artırdı");
  await page.click('[data-a="s:done"]');

  // Seviye belirleme testi
  await page.click('[data-a="go-settings"]');
  await page.click('[data-a="placement"]');
  await page.waitForSelector(".q-prompt");
  await page.screenshot({ path: `${OUT}/12-placement.png` });
  for (let g = 0; g < 40; g++) {
    if (await page.locator(".summary").count()) break;
    const ok = await page.evaluate(() => !!document.querySelector("#opts"));
    if (!ok) { await page.waitForTimeout(100); continue; }
    // doğru seçeneği DOM'dan bilemeyiz; ilk 2 seviyede rastgele işaretle, sonra "bilmiyorum"
    const label = await page.textContent(".q-prompt .kicker");
    const n = Number(label.match(/(\d)\/6/)[1]);
    await page.click(n <= 3 ? '[data-a="s:idk"]' : '[data-a="s:idk"]');
    await page.waitForTimeout(800);
  }
  await page.waitForSelector(".summary");
  await page.screenshot({ path: `${OUT}/13-placement-result.png` });
  assert((await page.textContent(".summary")).includes("Seviyen: A1"), "hiç bilmeyen kullanıcı A1'e yerleştirildi");
  await page.click('[data-a="s:placement-done"]');
  const lv = await page.evaluate(() => window.__kb.store.state.settings.levels);
  assert(lv.join() === "a1,a2", "seviyeler a1+a2 olarak ayarlandı");

  assert(errors.length === 0, "konsolda hata yok " + JSON.stringify(errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
