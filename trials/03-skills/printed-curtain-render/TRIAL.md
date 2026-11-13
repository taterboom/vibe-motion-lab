# 03 技能 printed-curtain-render（图案织进线帘）

日期：2026-11-13
版本：vibe-motion/skills f558ec4（`.claude/skills/printed-curtain-render/`）。模板里自带 p5.js v1.9.4。抓帧借用 `../light-spotlight-render/capture/capture.mjs`，用的是 puppeteer-core 24.41.0 和 Chrome Headless Shell 144。

## 做了什么

- 触发原话（取自 `agents/openai.yaml`）：「Use $printed-curtain-render to turn my artwork into an interactive woven curtain simulation.」
- 照 SKILL.md 的 Quick Start 跑：`create_printed_curtain.py --image inputs/catalina-sunset.jpg --text "VIBE MOTION" --output-dir out/printed-curtain`
- 照第 4 步，用 `python3 -m http.server 8000` 起服务（只绑 127.0.0.1，用完就关了），在无头浏览器里打开。
- 这是交互作品，不动鼠标的话帘子就静静挂着。为了看动起来是什么样，抓帧脚本让 p5 停下自动循环（`noLoop()`），每帧手动 `redraw()` 一次，等于按 60fps 推进物理。脚本还把 `millis()` 改成按帧计时，并按预设路线移动鼠标：
  - 第 1 到 3 秒，在 45% 高度从左扫到右；
  - 第 3.5 到 5 秒，在 72% 高度从右扫回左；
  - 之后不动，看帘子落回去。

## 跑通了吗

能跑，命令要改一下。SKILL.md 里写死的是 `/usr/local/bin/python3`，这台 Apple Silicon 的 Mac 上没有这个路径（Homebrew 装在 `/opt/homebrew`），照抄会报 `no such file`。改用 `python3` 就一次通过，0.1 秒打出 `VALIDATION=PASS`。

这个 `VALIDATION` 只检查 `index.html` 和 `artwork.js` 在不在，不看画面。

我验证了它的提醒：用 `file://` 打开时，控制台报 `Fetch API cannot load file://...artwork.jpg`，图片层加载失败，只剩文字。所以「必须用 HTTP 打开」这条说得对。

## 耗时和花费

约 3 分钟，抓帧工具是现成的。9 秒的片子抓了 23 秒。

## 成片

- `out/printed-curtain/`：技能产出的离线网页目录
- `out/curtain-sweep.mp4`：900×1200，30fps，9 秒，鼠标扫两次
- 抽帧拼图：`contact.png`（8 帧）

拼图里看到的：克莱因蓝的线帘挂满整个画面，中间织着那张日落海岸照片，下面是白色的「VIBE MOTION」，图案看得出是一根根竖线组成的。鼠标是一个半透明的圆球，扫过去时帘子被大幅推开、甩起来，图案跟着布一起弯折、拉伸，露出白底。之后帘子落回原处，但线是散的，照片和字被扯得歪歪扭扭，第 9 秒还在轻微晃。

问题：
- 鼠标一出现，第 34 帧的画面差分突然变大，是圆球「啪」一下出现在画面上。
- 我的鼠标路线最后停在画布左边缘，因为 puppeteer 不能把鼠标移出视口，半个圆球一直露在左边。这是抓帧脚本的问题，不是技能的问题。
- 我扫得比较猛，帘子被整个掀开，所以中间几帧大半是白底。

## 用户评价

（待填）

## 改一处要多久

换颜色或文字：加 `--overwrite` 重新生成，约 1 秒。要出视频还得再抓一次，约 25 秒。

## 和配音、音效怎么接

不接。这是浏览器里实时互动的作品，技能本身不出视频。

## 它怎么指挥智能体

5 步：定素材、跑脚本、等 `VALIDATION=PASS`、起 HTTP 服务在浏览器里看、回报路径和服务命令。这里第一次出现了「要在浏览器里看一下」，但没有要求截图或者检查什么。它有不少防呆：
- 输出目录不空就拒绝，除非显式加 `--overwrite`；
- 不上传图片，不联网；
- 写明了许可证：CC BY-SA 4.0，改编版要按同样的许可分享；p5 是 LGPL。

## 好的地方 / 不好的地方

- 好：物理效果有质感，图案真的「长在布上」；离线可用；参数多，有实时控制面板；许可证写得清楚。
- 不好：只能在浏览器里互动，没有出视频的办法，要做成片得自己写抓帧和鼠标路线；Python 路径写死；物理引擎是 CC BY-SA，衍生作品要以同样许可公开。

## 结论

只当灵感或互动网页用。要放进视频得自己处理抓帧，还要考虑 ShareAlike 许可。和朝カフェ关系不大。
