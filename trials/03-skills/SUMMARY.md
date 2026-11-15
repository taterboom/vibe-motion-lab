# 1.3 技能包汇总

2026-11-13。仓库 vibe-motion/skills@f558ec4，17 个技能。每个技能的详细记录在 `<技能名>/TRIAL.md`，抽帧拼图在 `<技能名>/contact.png`，成片在 `<技能名>/out/`（不入库）。由四个子代理并行执行，主会话抽查。

**不入库的**（为了仓库能公开，2026-11-15 从历史里移除，本地还在）：perspective-illusion 的工程（原样拷自无许可证的技能仓库，含作者的立绘素材）、vinyl 和 3d-ticker 的 `project/`（技能自带的组件原样拷入）、fisheye 的拼图（作者演示图是他人短信截图）、`inputs/*.jpg`（macOS 壁纸）。记录和拼图保留。

## 总表

| 技能 | 开箱 | 暂定结论 | 一句话 |
|---|---|---|---|
| disney-animation-rule-skill | 跑通 | **留用** | A/B 对比 B 明显有分量；给方法和清单，数值要自己定 |
| pixel2motion | 改了才通 | 只取部分 | 有成套数值档位和 QA 脚本；描边类素材会误报，不出视频 |
| perspective-illusion | 改了才通（4 处环境小修） | 只取方法 | 镜头系统和「平时偷换」的错觉设计可复用；带闪烁检查脚本 |
| brand-launch-video-star | 改了才通 | 只取方法 | 节拍表和阶段写法清楚；校验器只查结构；成片偏模板感 |
| colorize | 跑通 | 只取效果 | 黑白变彩色转场，1 秒出片；结尾不缓停 |
| remotion-candlestick | 改了才通 | 只取做法 | 技能里没有代码，约 300 行要智能体照片段写 |
| remotion-3d-ticker | 跑通，有 bug | 只取效果 | 循环接缝多跳约 15px，改一处可修 |
| remotion-vinyl-player | 跑通 | 只取效果 | 好看；「音频可视化」名不副实，不接音频 |
| light-spotlight-render | 改了才对 | 不用 | 默认参数几乎看不见；只出 HTML |
| printed-curtain-render | 改了才通 | 只当灵感 | 物理质感好；只能浏览器互动，无视频导出；CC BY-SA |
| fisheye-motion | 跑通 | 只取部分 | 讲解片引用截图的镜头可用；高亮框要反复试位置 |
| wechat-2d-render | 改了才通 | 只取部分 | 聊天界面逼真；消息写死在代码里 |
| ruler-progress-render | 改了才通 | 不用或当素材 | 第二次运行必失败（脚本 bug） |
| procedural-fish-render | 改了才通 | 不用 | 透明、无缝循环，但只是一条鱼转圈 |
| threejs-earth-render | 改了才通 | 只取部分 | 默认分支 `main` 已不存在 |
| 3d-chladni-render | 改了才通 | 只取部分 | 可吃音频，画面很暗，反应弱；素材 CC BY-NC |
| claude-typer | **没通** | 不用 | 作者网站已不渲染，远程依赖失效 |

原样一次跑通的只有 4 个（disney、colorize、vinyl、fisheye）。

## 反复出现的问题

1. **路径写死在作者的环境里**：多个技能的命令只在 `~/.claude`、`~/.agents`、`~/.codex` 里找自己，装在项目 `.claude/skills/` 下会找不到；有的写死 `/usr/local/bin/python3`（Homebrew 在 `/opt/homebrew`）；perspective-illusion 的快速开始用了作者电脑的路径。
2. **外部工程没锁版本**：threejs-earth（分支改名）、claude-typer（网站改版）已经因为上游变化坏掉。
3. **「校验」不看画面**：colorize、线帘、克拉尼的 `VALIDATION=PASS` 和 brand-launch 的校验器只查尺寸、时长、文件和 JSON 结构。真正看画面的只有 pixel2motion 的 QA 脚本和 perspective-illusion 的 `blink_map.py`。卡顿、接缝都是代理自己抽帧查出来的。
4. **两个技能的 YAML 头不合法**（pixel2motion、remotion-vinyl-player），`npx skills add` 会跳过；Claude Code 自己能识别。
5. **在 VS Code 里的 Claude Code 跑 Electron 工具**要先 `unset ELECTRON_RUN_AS_NODE`（克拉尼）。

## 对后续任务的意义

- **2B 朝カフェ**：真正用得上的是 disney（角色小动作的阶段表）+ pixel2motion 的数值档位 + 1.1 脚手架。wechat-2d 的聊天界面可作「对话做成气泡」的参考。建议 2B 开工前先把 disney B 版的写法抽成一个可复用的阶段表小工具。
- **2A 飛雷神**：brand-launch 的节拍表方法 + pixel2motion 的标志动效思路（已有 SVG，几何阶段可跳过）+ 可选的 3D 片头。素材要用真实截图。
- **抽帧自查**值得做成自己的工具：按阶段边界抽帧拼图 + 时间线函数的数值探针 + 最终帧比对，这次在多个技能上都靠它发现了问题。

## 要用户做的

看成片并在各 `TRIAL.md` 填「用户评价」。优先看：
1. `disney-animation-rule-skill/project/out/AB.mp4`：B 起跳那一帧（17–19）是否像瞬移，落地（44–48）和顶点悬停 12 帧是否发飘
2. `pixel2motion/outputs/preview/preview.mp4`：700–900ms 的闪光变成了暗橄榄色
3. `perspective-illusion/out/final.mp4`：约 9.4 秒处的运动模糊
4. `brand-launch-video-star/project/out/orbitask-launch.mp4`：整体节奏，第 240、320 帧的整屏换色
