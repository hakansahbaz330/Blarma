// Gerçek uygulamadan ekran görüntüleri (Playwright). Kullanım: node capture.cjs (uygulama http://localhost:8080 üzerinde açık olmalı)
const { chromium } = require("playwright");
const OUT = __dirname + "/public/shots";
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const p = await c.newPage();
  await p.goto("http://localhost:8080/");
  await p.waitForSelector(".modal");
  await p.click('[data-a="onb-a1"]');
  await p.waitForSelector(".plan");
  await p.screenshot({ path: `${OUT}/home.png` });
  await p.click('[data-a="start-daily"]');
  await p.waitForSelector(".flash");
  await p.screenshot({ path: `${OUT}/intro.png` });
  for (let i = 0; i < 3; i++) { await p.click('[data-a="s:learn"]'); await p.waitForTimeout(450); }
  let wrongLeft = 2, shot = false, n = 0;
  while (n++ < 60) {
    await p.waitForTimeout(250);
    if (await p.locator(".summary").count()) break;
    if (await p.locator('[data-a="s:learn"]').count()) { await p.click('[data-a="s:learn"]'); continue; }
    if (await p.locator("#opts .opt").count() && await p.locator("#btn-next").count() === 0) {
      const ci = await p.evaluate(() => window.__kbExercise().options.findIndex((o) => o.correct));
      let pick = ci;
      if (wrongLeft > 0 && n > 6) { pick = ci === 0 ? 1 : 0; wrongLeft--; }
      await p.click(`#opts .opt >> nth=${pick}`);
      await p.waitForTimeout(450);
      if (!shot && pick === ci) { await p.screenshot({ path: `${OUT}/correct.png` }); shot = true; }
      if (pick !== ci) await p.screenshot({ path: `${OUT}/wrong.png` });
    } else if (await p.locator("#btn-next").count()) await p.click("#btn-next");
    else if (await p.locator("#ans").count()) { const a = await p.evaluate(() => window.__kbExercise().answer); await p.fill("#ans", a); await p.keyboard.press("Enter"); }
    else if (await p.locator(".tiles").count()) { await p.click('[data-a="s:idk"]').catch(() => {}); }
  }
  await p.waitForSelector(".summary", { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/result.png` });
  await p.evaluate(() => { const b = document.querySelector(".fb-list"); if (b) b.scrollIntoView(); });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/result-list.png` });
  await p.click('[data-a="s:done"]');
  await p.waitForSelector(".plan");
  await p.evaluate(() => document.querySelector('[data-a="nav"][data-v="progress"]').click());
  await p.waitForTimeout(300);
  await p.click('[data-a="go-today"]');
  await p.waitForTimeout(300);
  const row = p.locator(".td-head").first();
  if (await row.count()) { await row.click(); await p.waitForTimeout(300); }
  await p.screenshot({ path: `${OUT}/today.png` });
  await b.close();
  console.log("tamam");
})();
