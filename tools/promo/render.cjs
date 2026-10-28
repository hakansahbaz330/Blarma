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
  // Hafif, kendi sentezlediğimiz (telifsiz) ses dokusu: Am7 benzeri üç sinüs, yavaş titreşim, giriş/çıkış geçişi.
  const pad = [220, 261.63, 329.63, 392].map((f) => `sine=frequency=${f}:duration=${dur}:sample_rate=44100`);
  const aud = ["-f", "lavfi", "-i", pad[0], "-f", "lavfi", "-i", pad[1], "-f", "lavfi", "-i", pad[2], "-f", "lavfi", "-i", pad[3]];
  const flt = `[1:a][2:a][3:a][4:a]amix=inputs=4:normalize=0,volume=0.10,tremolo=f=0.35:d=0.35,afade=t=in:d=1.5,afade=t=out:st=${dur - 2}:d=2[a]`;
  execFileSync("ffmpeg", ["-y", "-framerate", String(fps), "-i", `${dir}/f%04d.jpg`, ...aud, "-filter_complex", flt, "-map", "0:v", "-map", "[a]", "-vf", "format=yuv420p", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", out], { stdio: "ignore" });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("hazır:", out);
})();
