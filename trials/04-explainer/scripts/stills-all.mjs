// 打包一次，给镜头库里每个合成渲一张 70% 处的静帧（缩放 0.2），用于判断整体画风。
import {createRequire} from 'node:module';
import path from 'node:path';
const lib = path.resolve(process.argv[2]);
const outDir = path.resolve(process.argv[3]);
const require = createRequire(path.join(lib, 'package.json'));
const {bundle} = require('@remotion/bundler');
const {getCompositions, renderStill, openBrowser} = require('@remotion/renderer');
const serveUrl = await bundle({entryPoint: path.join(lib, 'src/index.ts')});
const browser = await openBrowser('chrome');
const comps = await getCompositions(serveUrl, {puppeteerInstance: browser});
for (const c of comps) {
  const frame = Math.floor(c.durationInFrames * 0.7);
  await renderStill({composition: c, serveUrl, output: path.join(outDir, `${c.id}.png`), frame, scale: 0.2, puppeteerInstance: browser});
  console.log(c.id, c.width + 'x' + c.height, frame);
}
await browser.close({silent: true});
