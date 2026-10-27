// Hikâye özelliği: API istekleri tarayıcıda taklit edilir (gerçek ağ/anahtar kullanılmaz).
const { chromium } = require("playwright");
const URL = process.env.URL || "http://localhost:8080/";
const OUT = process.env.OUT || "/tmp";
const assert = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; throw new Error(m); } else console.log("ok -", m); };

(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let sent = null;
  await page.route("https://api.anthropic.com/v1/messages", async (route) => {
    sent = JSON.parse(route.request().postData());
    const words = sent.messages[0].content.match(/inflection: ([^\n]+)\./)[1].split(", ");
    const en = `Tom has a quiet day. He sees ${words.map((w) => `**${w}**`).join(", ")} and smiles.`;
    await route.fulfill({
      status: 200, contentType: "application/json",
      headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" },
      body: JSON.stringify({ content: [{ type: "text", text: JSON.stringify({ title: "A Quiet Day", story_en: en, story_tr: "Tom sakin bir gün geçirir." }) }] }),
    });
  });
  await page.goto(URL);
  await page.waitForSelector(".modal");
  await page.click('[data-a="onb-a1"]');
  await page.evaluate(() => {
    const { store, ctx } = window.__kb;
    ctx.words.filter((w) => w.level === "a1").slice(0, 5).forEach((w) => { store.state.prog[w.word] = { s: 2, due: 99999, iv: 3, ease: 2.5, reps: 1, lapses: 0, ok: 1, seen: 1, fav: 0 }; });
    store.save(); window.__kb.render();
  });
  await page.click('[data-a="nav"][data-v="stories"]');
  await page.click('[data-a="gen-open"]');
  assert(await page.locator('[data-a="gen-go"][disabled]').count() === 1, "anahtar yokken hikâye düğmesi kapalı");
  await page.click('[data-a="close-modal"]');
  await page.click('[data-a="nav"][data-v="learn"]');
  await page.click('[data-a="go-settings"]');
  await page.fill("#apikey", "sk-ant-test");
  await page.press("#apikey", "Tab");
  await page.click('[data-a="nav"][data-v="stories"]');
  await page.click('[data-a="gen-open"]');
  await page.click('[data-a="gen-go"]');
  await page.waitForSelector("#story-box mark");
  assert((await page.locator("#story-box mark").count()) === 5, "5 hedef kelime vurgulandı");
  assert(sent && sent.model === "claude-haiku-5-5", "model adı istekte");
  await page.screenshot({ path: `${OUT}/14-story.png` });
  await page.click('[data-a="gen-tr"]');
  assert((await page.textContent("#story-box")).includes("Tom sakin bir gün"), "Türkçe çeviri gösterildi");
  assert(errors.length === 0, "konsol hatası yok " + JSON.stringify(errors));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
