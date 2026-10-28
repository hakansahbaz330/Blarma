// Kullanım: node render.mjs [çıktı.mp4] [kare]   (kare verilirse yalnızca o kareyi PNG olarak yazar)
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const out = process.argv[2] || "out/tanitim.mp4";
const still = process.argv[3];
const browserExecutable = process.env.CHROME || "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const comp = await selectComposition({ serveUrl, id: "Promo", browserExecutable });
if (still) {
  await renderStill({ composition: comp, serveUrl, output: out, frame: Number(still), browserExecutable });
} else {
  await renderMedia({ composition: comp, serveUrl, codec: "h264", outputLocation: out, browserExecutable, crf: 17, concurrency: 4, onProgress: ({ progress }) => process.stdout.write(`\r${Math.round(progress * 100)}%`) });
}
console.log("\nhazır:", out);
