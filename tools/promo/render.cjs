// Tanıtım videosu: promo.html'i kare kare yakalar, ffmpeg ile birleştirir. Kullanım: node render.cjs <çıktı.mp4> [süre-sn]
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const out = process.argv[2] || "promo.mp4", dur = Number(process.argv[3] || 28), fps = 30;
(async () => {
  const dir = fs.mkdtempSync("/tmp/promo-");
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto("http://localhost:8080/tools/promo/promo.html");
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  const n = Math.round(dur * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => window.setT(t), i / fps);
    await p.screenshot({ path: `${dir}/f${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 92 });
  }
  await b.close();
  // Ses: tools/promo/audio.py ile üretilen müzik + seslendirme (istenirse üçüncü argüman olarak verilir)
  const audio = process.argv[4];
  const aud = audio ? ["-i", audio] : [];
  const map = audio ? ["-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-shortest"] : [];
  execFileSync("ffmpeg", ["-y", "-framerate", String(fps), "-i", `${dir}/f%04d.jpg`, ...aud, ...map, "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", out], { stdio: "ignore" });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("hazır:", out);
})();
