# 03 技能 threejs-earth-render

日期：2026-11-13
版本：skills 仓库 f558ec4；外部工程 `vibe-motion/threejs-earth` 分支 `dist` **19fbaf6**（2026-05-20，「Modularize route arc styling」），2026-11-13 克隆到 `ext/threejs-earth`。Puppeteer 24.43.1（脚本装的是 `^24.0.0`，没锁）。

## 做了什么

- 触发原话（README）：「克隆或更新 vibe-motion/threejs-earth，并使用 Puppeteer 渲染 Three.js 3D 地球航线飞行动画」。
- 照 SKILL.md 原样跑：
  `python3 .claude/skills/threejs-earth-render/scripts/render_threejs_earth.py --workspace <trial>/ext --output <trial>/out/threejs-earth.gif`
  → **失败**（见下）。
- 加一个命令行参数重跑：`... --branch dist --keep-frames`。脚本流程：克隆/更新 → 在 `ext/.threejs-earth-renderer/` 写一个 `package.json` 并 `npm install puppeteer` → 起本地 HTTP 服务（随机空闲端口）→ Puppeteer 逐帧调 `window.__SCENE_3D_EXPORT__.setFrame(n)` 截图 → ffmpeg 编 GIF。
- 为了看清画面，另用保留下来的 2048×1152 原帧编了一个 mp4（`out/threejs-earth-2048-from-frames.mp4`），之后删掉了 256MB 的 PNG 帧。
- 安装前检查：仓库本身没有 `package.json` 脚本、没有依赖，就是静态页；Three.js 从 `cdn.jsdelivr.net/npm/three@0.161` 加载。Puppeteer 安装时会下载 Chrome for Testing 到 `~/.cache/puppeteer`。Puppeteer 启动参数带 `--disable-web-security --no-sandbox`，只加载本地页面，风险不大，但值得知道。

## 跑通了吗

改了参数才通。

- **默认分支写错了**：脚本 `DEFAULT_BRANCH = "main"`，但这个仓库现在只有 `dist` 一个分支（`origin/HEAD` 指向 dist），`git clone --branch main` 直接 128 退出（`out/run-default.log`）。传 `--branch dist` 后一次通过，68 秒（含 npm 装 Puppeteer）。没改技能文件。
- 同样有 `/usr/local/bin/python3` 写死和只在用户目录找技能的问题，改用 `python3` 和项目路径。
- 本地 HTTP 服务由脚本自己起停，用的随机端口，没碰 3000/4173；跑完没有残留进程。

## 耗时和花费

约 6 分钟。无 API 花费。

## 成片

- `out/threejs-earth.gif`：默认产物，**448×252**，30fps，4.03 秒，121 帧，7.4MB。
- `out/threejs-earth-2048-from-frames.mp4`：同一组帧的原尺寸版本，2048×1152。
- 拼图：`contact.png`（8 帧，0.25s–3.78s，取自 2048 版）

拼图看到的：星空背景下一个写实地球（8K 贴图，有云层、大气边缘光）。开场地球小、偏左，镜头推近并转到中国，拉近到杭州（带圆圈标记和中文标签）；然后拉远、转向西，一条白色弧线从杭州画向巴黎；最后推近到巴黎。逐帧差分曲线是连续的先加速后减速，中间在杭州停了约 0.1 秒，没有跳帧。

问题：
- **默认只出 448 宽的 GIF**，拿来做视频完全不够用，要自己加 `--output-width 0` 或输出 mp4。
- 4 秒里推、拉、转三次，节奏很赶。
- 航线是一条等粗的白色实线，没有光晕或渐隐；某些角度下弧线伸出地球轮廓，看起来像一根直杆插向太空。
- 地名标签字体和大小随镜头远近变化，远景时几乎看不清。

## 它怎么指挥智能体

「跑脚本，等完成，返回路径」。另有两条：要改航线就先改 `src/routeConfig.js` 再加 `--skip-update` 渲染，免得被 pull 覆盖；必须走本地 HTTP 服务，不要用 `file://`。没有画面自查。

## 改一处要多久

没测。航线在 `src/routeConfig.js`，起止城市是数据，换城市应该只改这一个文件。

## 和配音、音效怎么接

没提。输出是无声 GIF/mp4，要在别处合成。

## 好的地方 / 不好的地方

- 好：画面质感好（真实贴图 + 大气光）；逐帧调 `setFrame` 截图，结果可复现；不依赖 Remotion。
- 不好：默认分支写错导致开箱即挂；默认输出分辨率太低；节奏赶；外部工程没锁版本、没许可证；地球贴图来自 Solar System Scope（CC BY 4.0），仓库里没写署名。

## 用户评价

待填

## 结论（暂定）

只取某部分。适合宣传片或讲解片里一个「从 A 飞到 B」的转场镜头；用之前要修分支名、改输出尺寸、放慢节奏。朝カフェ用不上。
