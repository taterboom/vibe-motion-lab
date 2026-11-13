# 03 技能 ruler-progress-render

日期：2026-11-13
版本：skills 仓库 f558ec4；外部工程 `sxhzju/ruler-progress-animator` 默认分支 `skill/ruler-black-theme` **7052f50**（2026-04-08），2026-11-13 克隆到 `ext/ruler-progress-animator`。Remotion 4.0.438，npm。

## 做了什么

- 触发原话（README）：「生成尺子进度动画。触发关键词：尺子进度动画」；SKILL.md 例句「做个尺子进度动画」。
- 照 SKILL.md：`bash .claude/skills/ruler-progress-render/scripts/render_ruler_progress.sh <trial>/ext <trial>/out/scaffold-demo-defaults-transparent.mov`
- 本机有 `bunx`，所以走脚本的「新流程」：`npm install` → `npm run remotion:ensure-browser` → `REMOTION_PROPS_FILE=shared/project/render-presets/default.json npm run remotion:render`。
- 安装前检查：`package.json` 没有 install 钩子（不像其他几个有 postinstall）；`deploy:edgeone*` 不调用。

## 跑通了吗

第一次没通，删掉预先克隆的仓库后一次通过。

- **复用已有仓库的分支是坏的**：脚本里 `git ls-remote --symref origin HEAD` 少了 `-C "$REPO_DIR_NAME"`，在工作目录（不是那个仓库）里执行，加上 `set -euo pipefail`，直接以 128 退出（`out/run-reuse-fail.log`）。也就是说**同一目录第二次调用这个技能必然失败**。wechat-2d-render 的同款脚本加了 `-C`，这个没加。
- 删掉 `ext/ruler-progress-animator` 让脚本自己克隆：77 秒跑完（含 npm install）。克隆到的提交和我先前看过的一样。

## 耗时和花费

约 6 分钟，另加小改动 2 分钟。无 API 花费。

## 成片

- `out/scaffold-demo-defaults-transparent.mov`：ProRes 4444，2160×2160（默认 1080×1080，`--scale` 2），30fps，6.03 秒，224MB。带静音音轨。真透明。
- `out/label-ja.mov`：小改动实测。
- 拼图：`contact.png`（8 帧，0.38s–5.66s，棋盘格底）

拼图看到的：一把带刻度的圆角尺子当进度条，上方标签「vibe-motion」+ 百分比。前 3.75 秒走到 66%，镜头从带透视倾斜的近景拉正，尺子颜色从蓝渐变到红；停 0.45 秒；再 1.8 秒走到 88%，66% 处留一条虚线标记，镜头向右推。

问题：
- 开头几帧，标签还在逐字出现，「vi」和「19%」叠在一起。
- 镜头推得近，开头尺子右端出画，结尾标签左边被裁（「be-motion」）。
- 文字和刻度是黑色，透明底放在深色背景上会看不见。分支名叫 black-theme，但默认看起来是给浅底用的。
- 画面只占正方形上部 1/3 左右，下面大片空。

## 它怎么指挥智能体

最薄的一种：「跑脚本，等完成，返回输出的绝对路径」。没有任何设计规则、关卡或自查。

## 改一处要多久

把标签改成「朝カフェ ep001」：写一个 props 文件 `presets/asakafe.json`（只改 `labelText`），`REMOTION_PROPS_FILE` 传入，26 秒渲完，前后 2 分钟。日文走系统字体回退，显示正常；结尾同样被镜头裁掉一部分。

顺带发现：照 fisheye 的写法用 `REMOTION_CODEC=h264` 出 mp4 会报错，这个仓库的 `remotion-render.mjs` 不管编码器都传 `--prores-profile`。只能出 ProRes。

## 和配音、音效怎么接

没提。进度推进和停顿的时间点都在 props 里（`phaseOneDurationSeconds` 等），可以对着音效卡点。

## 好的地方 / 不好的地方

- 好：参数化做得好（目标百分比、各段时长、标签都能用 props 改）；真透明，适合叠加。
- 不好：二次调用必失败；不能出 h264；镜头裁字；开头文字重叠；没有许可证。

## 用户评价

待填

## 结论（暂定）

不用，或只当素材。一个小部件级的效果，适合讲解片里表示进度、目标完成度。修掉两个脚本 bug 后可以当透明素材叠用。
