// 试验用抓帧工具（不属于技能）：把 HTML 动画逐帧截图，管道给 ffmpeg 出 mp4。
// 用法：node capture.mjs <url> <out.mp4> --mode gsap|p5 --seconds 6 --fps 30 --w 1080 --h 1080 [--script pointer.json]
// gsap 模式：暂停 gsap 全局时间线，逐帧 seek，结果与墙钟无关。
// p5 模式：noLoop() 后每帧 redraw()，millis() 改成按帧计；可按脚本移动鼠标。
import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const url = args[0];
const out = args[1];
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const mode = opt("mode", "gsap");
const seconds = Number(opt("seconds", 6));
const fps = Number(opt("fps", 30));
const W = Number(opt("w", 1080));
const H = Number(opt("h", 1080));
const pointerPath = opt("pointer", "");
const exe =
  process.env.CHROME ||
  new URL("../../remotion-3d-ticker/project/node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell", import.meta.url).pathname;

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});
try {
  const page = await browser.newPage();
  page.on("console", (m) => console.log("[page]", m.text()));
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  console.log("goto"); await page.goto(url, { waitUntil: "load", timeout: 60000 }); console.log("loaded");

  if (mode === "gsap") {
    await page.waitForFunction(() => !!window.gsap, { timeout: 30000 }); console.log("gsap ok");
    await page.evaluate(() => {
      gsap.ticker.lagSmoothing(0);
      gsap.globalTimeline.pause();
    });
  } else {
    await page.waitForFunction(() => window.__PRINTED_CURTAIN_READY__ === true, { timeout: 30000 });
    await page.evaluate(() => {
      noLoop();
      window.millis = () => frameCount * (1000 / 60);
    });
  }

  // 鼠标路径：[[t秒, x比例, y比例], ...]，线性插值；画布外用 x<0 或 >1
  const path = pointerPath ? JSON.parse(pointerPath) : null;
  const pointerAt = (t) => {
    if (!path) return null;
    if (t <= path[0][0]) return null;
    for (let i = 1; i < path.length; i++) {
      if (t <= path[i][0]) {
        const [t0, x0, y0] = path[i - 1];
        const [t1, x1, y1] = path[i];
        const k = (t - t0) / (t1 - t0);
        return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
      }
    }
    const last = path[path.length - 1];
    return [last[1], last[2]];
  };

  const ff = spawn("ffmpeg", [
    "-v", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });

  const total = Math.round(seconds * fps);
  const canvasBox = mode === "p5" ? await page.evaluate(() => {
    const r = document.querySelector("canvas").getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  }) : null;
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const t = f / fps;
    if (mode === "gsap") {
      await page.evaluate((tt) => { gsap.globalTimeline.time(tt); }, t);
    } else {
      // 浏览器里 p5 默认 60fps；每个输出帧推进 60/fps 步物理
      const steps = Math.max(1, Math.round(60 / fps));
      for (let s = 0; s < steps; s++) {
        const p = pointerAt(t + s / 60);
        if (p) await page.mouse.move(canvasBox.x + p[0] * canvasBox.w, canvasBox.y + p[1] * canvasBox.h);
        await page.evaluate(() => redraw());
      }
    }
    if (f === 0) console.log("first shot");
    const buf = await page.screenshot({ type: "png" });
    ff.stdin.write(buf);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(`captured ${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${out}`);
} finally {
  await browser.close();
}
