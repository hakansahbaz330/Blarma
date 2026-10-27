// Uçtan uca duman testi: gerçek tarayıcıda onboarding, oturum, kelime listesi ve ayarlar.
// Kullanım: npm start (ayrı terminal) ardından  NODE_PATH=$(npm root -g) node tests/e2e/smoke.cjs
const { chromium } = require("playwright");
const URL = process.env.URL || "http://localhost:8080/";
const OUT = process.env.OUT || "/tmp";

const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; throw new Error(m); } else console.log("ok -", m); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(URL);
  await page.waitForSelector(".modal");
  assert(await page.locator("text=Kelime Bahçesi'ne hoş geldin").count() === 1, "onboarding görünür");
  await page.screenshot({ path: `${OUT}/01-onboarding.png` });
  await page.click('[data-a="onb-a1"]');
  await page.waitForSelector(".ring");
  assert((await page.textContent(".ring")).includes("0/10"), "günlük hedef 0/10");
  await page.screenshot({ path: `${OUT}/02-home.png` });

  // Oturum: tanıtım kartları
  await page.click('[data-a="start-daily"]');
  await page.waitForSelector(".flash");
  const first = await page.textContent(".flash .big");
  assert(first.length > 0, `ilk kelime tanıtıldı: ${first}`);
  assert((await page.locator(".flash li").count()) >= 1, "Türkçe karşılıklar listelendi");
  await page.screenshot({ path: `${OUT}/03-intro.png` });

  // Sürükleme ile "öğrenelim"
  const box = await page.locator("#flash").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 160, box.y + 100, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const second = await page.textContent(".flash .big");
  assert(second !== first, `sağa kaydırınca sonraki kelimeye geçti: ${second}`);

  // Bir kelimeyi "zaten biliyorum" ile geç
  await page.click('[data-a="s:known"]');
  await page.waitForTimeout(400);
  const third = await page.textContent(".flash .big");
  assert(third !== second, `biliyorum sonrası yeni kelime: ${third}`);
  await page.click('[data-a="s:learn"]');
  await page.waitForTimeout(400);
  // Kalan tanıtımlar (3'lü grup)
  while (await page.locator(".flash").count()) {
    await page.click('[data-a="s:learn"]');
    await page.waitForTimeout(350);
  }

  // Alıştırmalar: doğru seçenekleri tarayıcı içinden bilerek seç
  let answered = 0, guard = 0;
  while (guard++ < 400) {
    if (await page.locator(".summary").count()) break;
    if (await page.locator(".flash").count()) { await page.click('[data-a="s:learn"]'); await page.waitForTimeout(300); continue; }
    if (await page.locator('[data-a="s:next"]').count()) { await page.click('[data-a="s:next"]'); await page.waitForTimeout(60); continue; }
    if (await page.locator("#opts .opt").count()) {
      const idx = await page.evaluate(() => {
        // Etkin görevin doğru seçeneğini bul (test için)
        const t = window.__kb.currentExercise && window.__kb.currentExercise();
        return t ? t.options.findIndex((o) => o.correct) : 0;
      });
      await page.locator("#opts .opt").nth(Math.max(0, idx)).click();
      answered++;
      await page.waitForTimeout(60);
      continue;
    }
    if (await page.locator("#ans").count()) {
      const ans = await page.evaluate(() => window.__kb.currentExercise().answer);
      await page.fill("#ans", ans);
      await page.press("#ans", "Enter");
      answered++;
      await page.waitForTimeout(60);
      continue;
    }
    await page.waitForTimeout(100);
  }
  console.log("guard", guard, "answered", answered);
  assert(answered >= 6, `alıştırmalar çözüldü (${answered})`);
  await page.waitForSelector(".summary");
  await page.screenshot({ path: `${OUT}/04-summary.png` });
  assert((await page.textContent(".summary")).includes("yeni kelime"), "özet ekranı");
  await page.click('[data-a="s:done"]');
  await page.waitForSelector(".ring");
  const ring = await page.textContent(".ring");
  console.log("ring:", ring.replace(/\s+/g, " "));
  assert(/[1-9]\d*\/10/.test(ring), "günlük hedef ilerledi");

  // Kelimeler sekmesi: arama (Türkçe ve İngilizce), filtre
  await page.click('[data-a="nav"][data-v="words"]');
  await page.fill("#q", "elma");
  await page.waitForSelector(".witem");
  assert((await page.textContent("#wlist")).includes("apple"), "Türkçe aramayla 'apple' bulundu");
  await page.fill("#q", "ağ");
  await page.waitForTimeout(100);
  await page.fill("#q", "");
  await page.click('[data-a="w-level"][data-v="c1"]');
  assert((await page.locator(".witem").count()) > 0, "C1 filtresi çalışır");
  await page.screenshot({ path: `${OUT}/05-words.png` });
  await page.click('[data-a="w-open"]');
  await page.waitForSelector("#modal");
  await page.screenshot({ path: `${OUT}/06-word-modal.png` });
  await page.click('[data-a="close-modal"]');

  // Kendi kelimeni ekle
  await page.click('[data-a="w-level"][data-v="all"]');
  await page.click('[data-a="add-word"]');
  await page.fill("#f-en", "blarmaword");
  await page.fill("#f-tr", "deneme, test");
  await page.click('#add-form button[type="submit"]');
  await page.fill("#q", "blarmaword");
  await page.waitForSelector(".witem");
  assert((await page.locator(".witem").count()) === 1, "özel kelime eklendi ve aranabildi");

  // İstatistik ve ayarlar
  await page.click('[data-a="nav"][data-v="stats"]');
  await page.waitForSelector(".bars");
  await page.screenshot({ path: `${OUT}/07-stats.png` });
  await page.click('[data-a="nav"][data-v="settings"]');
  await page.click('[data-a="set"][data-k="goal"][data-v="5"]');
  assert((await page.locator('[data-k="goal"][data-v="5"]').getAttribute("aria-pressed")) === "true", "hedef ayarı değişti");
  await page.click('[data-a="set"][data-k="theme"][data-v="dark"]');
  await page.screenshot({ path: `${OUT}/08-settings-dark.png` });
  await page.click('[data-a="nav"][data-v="home"]');
  await page.screenshot({ path: `${OUT}/09-home-dark.png` });

  // Kalıcılık
  await page.reload();
  await page.waitForSelector(".ring");
  assert((await page.textContent(".ring")).includes("/5"), "ayarlar yenilemeden sonra korundu");

  assert(errors.length === 0, "konsolda hata yok " + JSON.stringify(errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
