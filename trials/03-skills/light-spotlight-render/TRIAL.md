# 03 技能 light-spotlight-render（摆动聚光灯扫字）

日期：2026-11-13
版本：vibe-motion/skills f558ec4（`.claude/skills/light-spotlight-render/`）。生成的 HTML 从 cdnjs 加载 GSAP 3.12.2。抓帧用的是本试验自己写的工具：puppeteer-core 24.41.0，Chrome Headless Shell 144.0.7559.20。

## 做了什么

- 触发原话（取自 `agents/openai.yaml`）：「做一个聚光灯扫字动画」。
- 照 SKILL.md 的命令跑：`python3 scripts/render_light_spotlight.py --label-text "vibe-motion" --output out/light-spotlight-vibe-motion.html`，全默认参数。
- 技能只出 HTML，原话是「要视频的话建议用别的工具录」。所以我另写了 `capture/capture.mjs`：用无头 Chrome 打开页面，暂停 GSAP 全局时间线，按 30fps 逐帧 seek、截图，再交给 ffmpeg 出 mp4。这个工具不属于技能。
- 加跑两条：
  - `--label-text LIGHT --background-color "#141414"`（照演示 GIF 的文字和底色）
  - 再加 `--lamp-scale 2.5`

## 跑通了吗

生成 HTML 一次通过，0.1 秒。

**但默认参数出来的效果几乎看不见。** 原因有两个：
- 默认背景是 `transparent`，浏览器里就是白底。光的颜色是 `#F5F5F5`，白底上的浅色光看不出来。
- 默认 `lamp_scale=1`，灯罩只照到一个字母的上半截。默认文字有 11 个字符，灯只在中间的「m」附近来回摆。

演示 GIF 是深底、5 个字母的「LIGHT」，光照到整个字母的高度。我试下来要 `--lamp-scale 2.5` 左右才接近 GIF。

还有几个问题：
- 光照形状是一个小梯形遮罩，没有光锥。
- 字体写的是 JetBrains Mono，但没有加载字体文件，实际用的是本机的等宽字体（SF Mono 或 Menlo）。
- GSAP 走 CDN，离线打不开。

SKILL.md 的 Quick Start 只去 `~/.agents`、`~/.claude`、`~/.codex` 下找技能目录，找不到项目里装的 `.claude/skills/`。

抓帧工具调了大约 6 分钟：一开始在 `page.evaluate` 里返回了 GSAP 时间线对象，puppeteer 序列化它时卡死了。

## 耗时和花费

约 12 分钟，其中 6 到 7 分钟花在写和调抓帧工具上。之后每条 HTML 生成加抓帧约 5 秒。

## 成片

- `out/light-spotlight-vibe-motion.html` 和 `out/spotlight-default.mp4`：默认参数，1080×1080，30fps，4 秒
- `out/spotlight-LIGHT-dark.mp4`：深底加 LIGHT，灯的大小还是 1
- `out/spotlight-LIGHT-dark-scale2.5.mp4`：最接近演示 GIF
- 抽帧拼图：`contact.png`（默认那条，6 帧）、`contact-demo-like.png`（lamp-scale 2.5 那条，6 帧）

拼图里看到的：
- `contact.png`：白底，深灰色的「vibe-motion」，6 帧几乎一样，只有「m」上方偶尔有一小块更浅的灰。
- `contact-demo-like.png`：深灰底，暗灰色的「LIGHT」，一块亮白的梯形光左右摆，照亮两三个字母，下面有竖向的辉光拖尾。和演示 GIF 一致。

摆动是 `power1.inOut` 往返，到两端会减速，没有卡顿。

## 用户评价

（待填）

## 改一处要多久

改 `--lamp-scale` 重新生成加抓帧，约 5 秒。

## 和配音、音效怎么接

不接。输出的是网页，要进视频得先录屏或者逐帧抓，再到别处配音。

## 它怎么指挥智能体

3 步：收参数、跑脚本、回报 HTML 路径，让用户自己用浏览器打开看。没有校验，没有自查。明确说「要视频就建议用别的工具，不要改写技能」，所以智能体不会主动出视频。

## 好的地方 / 不好的地方

- 好：一个文件，参数少，透明背景可以叠到别的画面上。
- 不好：默认参数在白底上看不见，也复现不出演示 GIF；不出视频；依赖 CDN；没有加载字体。

## 结论

不用。效果很简单，要用的话在 Remotion 里重写一个遮罩加旋转就行，比走 HTML 再录屏省事。
