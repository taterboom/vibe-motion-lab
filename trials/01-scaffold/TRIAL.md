# 01 脚手架 create-vibe-motion

日期：2026-11-13
版本：npm `create-vibe-motion@1.2.2`（仓库 2657ae9），Remotion 4.0.438，pnpm 10.33（由 packageManager 指定）

## 做了什么

- `npm create vibe-motion@latest trials/01-scaffold`
- `pnpm verify`（lint + 列出合成）
- `pnpm remotion:render:demo`（失败，见下）→ 改用 `pnpm exec remotion render Motion30fps out/motion-defaults-transparent.mov --codec prores --prores-profile 4444 --pixel-format yuva444p10le --image-format png --props motion/render-presets/default.json`
- 手写音频清单，放一句朝カフェ ep001 配音（`ask.wav`），渲染 h264 验证声音能带上
- `pnpm dev` 打开 Studio（http://localhost:3000）

## 跑通了吗

- 安装：一次通过，22 秒，含下载 90MB 的 Chrome Headless Shell。全局 `~/.npmrc` 的私有源 只报警告，不影响。
- `pnpm verify`：通过，7 秒。
- **`pnpm remotion:render:demo`：没通过。** `scripts/remotion-render.mjs` 开头 `import { ACTIVE_COMPOSITION_ID } from "../motion/project.js"`，一路引到 `Scene.jsx`，Node 报 `ERR_UNKNOWN_FILE_EXTENSION ".jsx"`。照它的参数直接调 Remotion CLI 就能渲出来，所以只是渲染脚本的 bug，工程本身没问题。官方的「一键出透明片」开箱是坏的。
- 直接用 CLI 渲染：通过，3 秒片渲染 7 秒。输出 ProRes 4444，`yuva444p12le`，带透明通道，48MB。
- 音频清单：通过。往 `public/.vibe-motion/audio-tracks.json` 写一条 `{src, startFrame, durationInFrames, volume}`，渲染出的 mp4 带上了声音，起始时间对得上。
- Studio 里拖拽音频：**待用户在浏览器里操作**。

## 耗时和花费

总共约 15 分钟（含读代码）。没有 API 花费。

## 成片

- `out/motion-defaults-transparent.mov`：默认示例，透明
- `out/with-audio.mp4`：带一句配音的版本
- `out/contact.png`：抽帧拼图（垫了棋盘格看透明）

画面：一张毛玻璃卡片按正弦曲线左右摆，徽章左右滑，底部一条进度条。只是演示结构用的，没有动效设计可言。

## 结构

- `motion/config.js`：默认参数
- `motion/timeline.js`：纯函数，输入帧号和参数，一次算出所有随帧变化的量（`cardRotateDeg`、`chipOffset`、`progress`），不依赖渲染顺序
- `motion/Scene.jsx`：只吃参数的 React 组件，自己不读帧号
- `motion/plugin.js`：把上面三样打包成插件；`motion/project.js` 选当前插件和帧率
- `remotion/`：外壳，基本不用动。字体加载完才放行渲染；音轨按清单挂上
- `AGENTS.md` 只有两行：每帧独立可算；**视觉效果非必要不跑自动化验证，写完让用户目测**

拆成「参数 → 时间线纯函数 → 无状态场景」，对智能体来说很好改：动画逻辑全在 `timeline.js`，可以单测，也可以只算不渲染就检查数值。

## 发现的问题

1. 渲染脚本坏了（见上）。
2. **尺寸被写死了上限**：`timeline.js` 把宽限制在 480–1280，高限制在 480–1440。传 1080×1920 进去，出来还是 1080×1440。朝カフェ的竖屏要先改这两个数。
3. 清单里预置的合成名是 `ScaffoldDemo30fps`，实际合成叫 `Motion30fps`，对不上。不影响使用，拖入或手写时会新建正确的键。
4. 浏览器缓存目录叫 `com.zjucat.create-vive-motion`（拼错了），无害。

## 和配音、音效怎么接

- 作者的方式：在 Studio 里把音频拖到时间线上，落点就是起始帧。背后是 `writeStaticFile` 把文件写进 `public/`、再改清单 JSON。
- 智能体的方式：直接写清单 JSON 就行，不需要拖。朝カフェ 已有 `_clips.json`（每句时长），可以直接生成清单，再让 `timeline.js` 读同一份时间点做动画。这条路 2B 能用。

## 改一处要多久

（待测：挑一个小改动，比如把卡片摆动换成弹入）

## 用户评价

（待用户看过 `out/` 里的成片、试过拖音频后填）

## 好的地方 / 不好的地方

- 好：结构干净，参数、时间线、画面分开；透明 ProRes 方便后期叠；音频清单可以由程序生成。
- 不好：一键渲染坏的；尺寸上限挡竖屏；默认示例没有任何动效方法，只是骨架。

## 结论（暂定）

留用骨架。适合做「声音先行、时间点由数据驱动」的片子，朝カフェ对话短片可以直接在它上面做；动效方法要从别的技能来。用之前修掉渲染脚本和尺寸上限。
