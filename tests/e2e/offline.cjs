// Çevrimdışı: servis çalışanı kurulduktan sonra ağ kapatılınca uygulama açılmalı.
const { chromium } = require("playwright");
const URL = process.env.URL || "http://localhost:8080/";
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 780 } });
  const page = await context.newPage();
  await page.goto(URL);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller || true);
  await page.reload(); // kontrolü ele al
  await page.waitForSelector(".modal, .ring");
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector(".modal, .ring", { timeout: 5000 });
  const n = await page.evaluate(() => window.KB_WORDS.length);
  if (n !== 4954) { console.error("FAIL: kelimeler çevrimdışı yüklenmedi", n); process.exit(1); }
  console.log("ok - çevrimdışı açıldı,", n, "kelime yüklü");
  await browser.close();
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
