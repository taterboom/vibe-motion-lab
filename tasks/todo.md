# vibe-motion-lab 计划

2026-11-12 写。状态：2026-11-13 开始执行，进度见 STATUS.md。

## 这是什么

起因是 `../asakafe`：日语跟读栏目「日本語の朝カフェ」，每集二三十秒的竖屏对话短片。它的脚本、配音（Fish Audio）和出片管线（Remotion）都有了，只差动画。这个目录要给它找到动画的做法，顺带让用户其他要做动画的项目也能用。

办法是动手把 [vibe-motion](https://github.com/vibe-motion) 用熟。vibe-motion 是 B 站 UP 主「浙大猫学长」牵头的一组仓库，用 AI 智能体写代码做动画（Remotion、Three.js、HyperFrames）。

目标有三个，按先后：

1. 把它的每个部分按作者的用法跑起来，知道它怎么工作。
2. 套到真实任务上，对每个部分得出「好、不好、适合做什么」的结论。结论以跑出来的成片和用户看过的评价为准。
3. 把留下来的东西沉淀成做法，先在朝カフェ上成立，再推到用户的其他项目（宣传片、剧情和讲解类）。

## 原则

- **先用，再评。** 每一项先照 README 的方式安装和触发，先跑它自带的示例，不改东西。
- **不预设画风和技术路线。** 朝カフェ 的 `ep001-visual-prototype` 分支只是一次试验，里面的画风和实现都不是已定方案。
- **读代码得出的评价只是假设。** 之前只读过仓库、看过低帧率的 GIF，结论记在 [notes/hypotheses.md](../notes/hypotheses.md)，每条都要用试验验证或推翻。
- **每次试验都留记录**，格式见本文末尾。
- **成片好不好由用户看了说。** 智能体看不了视频，只能抽帧自查。

## 目录约定

```
vibe-motion-lab/
  STATUS.md            进度
  tasks/todo.md        本计划
  notes/hypotheses.md  读代码得出的待验证假设
  notes/scorecard.md   好坏清单（第三阶段写）
  trials/NN-名字/      每次试验一个目录：工程、成片、TRIAL.md（试验记录；不用 README.md，免得和外部工程自带的冲突）
```

试验用到的仓库版本（2026-11-12 的最新提交），执行时如果上游更新了，在试验记录里写明实际版本：

| 仓库 | 提交 | 日期 |
|---|---|---|
| skills | f558ec4 | 2026-11-11 |
| sound | 85a3715 | 2026-10-30 |
| auto-motion | 17ead62 | 2026-07-23 |
| create-vibe-motion | 2657ae9 | 2026-08-18 |
| create-vibe-motion-3d | b88aa99 | 2026-05-17 |
| remotion-starter | 6a52139 | 2026-07-05 |
| remotion-code-motion-explainer | d93c643 | 2026-07-27 |

## 第 0 阶段：准备

- [x] `git init`，把本目录纳入版本管理；`node_modules`、成片和克隆下来的外部工程不入库。
- [x] 环境检查。2026-11-12 在这台 Mac 上查到：Node 24.11、pnpm 9.15、ffmpeg 8.1、jq、Claude Code 2.1.322 都有；**Codex 命令行没装**。2026-11-13 复查一致，Claude Code 已是 2.1.323。
- [ ] **需要用户做**：安装并登录 Codex 命令行。只有 1.7 和 2C 的 `auto-motion` 用到，其他项不受影响。
- [x] 确认 npm 源能用。2026-11-13：两个脚手架都直接装通，私有源 只报警告。`~/.npmrc` 里有私有源配置，pnpm 每次都报令牌警告；脚手架默认走 `registry.npmmirror.com`。先试一次安装，不通就加 `--registry=https://registry.npmjs.org`。
- [x] 定执行会话开在哪。2026-11-13：就在本目录的会话里执行。技能和 hook 只对「在那个目录里启动的 Claude Code 会话」生效，所以建议用户在 VS Code 里打开 `vibe-motion-lab`，新开会话后说「按 tasks/todo.md 执行第 N 项」。`remotion-starter` 的 hook 要在它自己的目录里开会话才会触发。

## 第 1 阶段：按作者的用法装上，复现官方效果

每一项要回答四个问题：能不能开箱跑通；实际帧率下的成片什么样；它是怎么指挥智能体的；花了多少时间。

- [x] **1.1 脚手架 create-vibe-motion**（2026-11-13 完成；拖拽音频经用户同意跳过，底层已验证；记录见 `trials/01-scaffold/TRIAL.md`）
  - `npm create vibe-motion@latest trials/01-scaffold`，`pnpm dev` 打开 Studio，渲染默认工程。
  - 弄清它的结构：只吃参数的 `Scene`、一次算出所有随帧变化量的纯函数 `timeline`、打包成插件的 `plugin`。
  - 试它的两个特色：在 Studio 里把音频文件拖到时间线上（**需要用户在浏览器里操作**）；默认输出带透明通道的 ProRes 4444。
- [x] **1.2 脚手架 create-vibe-motion-3d**（2026-11-13，记录见 `trials/02-scaffold-3d/TRIAL.md`）
  - `npm create vibe-motion-3d@latest trials/02-scaffold-3d`，`pnpm dev`，导出一段帧序列。
- [x] **1.3 技能包 skills（17 个）**（2026-11-13 完成，汇总见 `trials/03-skills/SUMMARY.md`；用户评价待填）
  - `npx skills add vibe-motion/skills`，装到本目录，智能体选 Claude Code。
  - 2026-11-13 实装：`npx skills add vibe-motion/skills --skill '*' --agent claude-code -y --copy` 只装上 15 个。`pixel2motion` 和 `remotion-vinyl-player` 的 SKILL.md 头部 YAML 不合法（description 未加引号且含 `: `），被安装器跳过，已手工拷入 `.claude/skills/`，文件未改。共用素材放在 `trials/03-skills/inputs/`。分四组由子代理并行执行。
  - 逐个用 README 里的触发方式跑一遍示例，每个技能一条试验记录。分三组：
    - 写了方法的：`disney-animation-rule-skill`、`pixel2motion`、`brand-launch-video-star`、`perspective-illusion`
    - 自带实现的：`colorize`、`remotion-candlestick`、`remotion-3d-ticker`、`remotion-vinyl-player`、`light-spotlight-render`、`printed-curtain-render`
    - 先克隆外部工程再渲染的：`fisheye-motion`、`wechat-2d-render`、`ruler-progress-render`、`procedural-fish-render`、`threejs-earth-render`、`3d-chladni-render`、`claude-typer`
  - `disney-animation-rule-skill` 没有自带示例。用法是在别的任务里叫它：同一个小动作（比如一个角色跳一下）做两遍，一遍不用它，一遍用它，并排对比。
- [x] **1.4 讲解片 remotion-code-motion-explainer**（2026-11-13 完成，记录见 `trials/04-explainer/TRIAL.md`；用户评价待填）
  - `npx skills add vibe-motion/remotion-code-motion-explainer`。
  - 跑它带的镜头库：`cd assets/shot-library && npm install && npm run validate:shots && npm run test:bundle`，渲染几条有代表性的竖屏和横屏镜头。
  - 用 README 的示例提示词触发一次，看它的六步流程和每步的关卡实际怎么走。
- [ ] **1.5 工作台 remotion-starter**
  - 克隆到 `trials/05-starter`，`cd template && npm install && npx remotion studio`，渲染自带的三个镜头。
  - 在它的目录里开会话，看 7 个 hook 实际拦不拦（故意写一个 `Math.random`）、渲染前的确认清单、收工时的类型检查。
  - 走一遍它的出片流程技能 `cyxj-remotion-produce`。
- [ ] **1.6 音效 sound**
  - 按 README 安装：`git clone https://github.com/vibe-motion/sound.git .claude/skills/sound`。
  - 用 README 的两条示例提示词触发，看它怎么选、怎么报理由、下载了什么。
  - 已知它的 `SKILL.md` 会让智能体在交付后推荐付费版，原样跑一次并记录实际表现。之后要不要删掉那几行，由用户定。
- [ ] **1.7 全自动 auto-motion**（放在本阶段最后，耗时最长）
  - 前提：Codex 命令行已登录。
  - 克隆到 `trials/07-auto-motion`，用它自带的 `transcription.srt`（20 条字幕，约 41 秒），在该目录里运行 README 的命令：`codex exec --cd . --sandbox danger-full-access --ask-for-approval never - < PROMPT.md`。
  - 记录拆成了几个镜头、每个镜头多久、总花费。作者给的证据是约 24 分钟一个镜头，所以这一项可能要跑几个小时。

## 第 2 阶段：套到真实任务上

每条都尽量用它原生的流程走完。开工前有几件事要用户先定，列在每条下面。三条的先后由用户定，编号不代表顺序。

- [ ] **2A 宣传片：飛雷神 Hiraishin**
  - 题材：`../hiraishin`，一个 Chrome 扩展，按住 Option / Alt 甩鼠标出轮盘，切换和整理标签页，把选中文字发给 AI。它的 `TODO` 里第一条就是「制作宣传片」。
  - 现成素材：`../hiraishin/site/`（三语落地页）、`icons/mark.svg`、`docs/STORE_LISTING.md`（三语商店文案）、`docs/store-assets/`（商店截图和宣传图）。
  - 流程：`brand-launch-video-star` 做主片，`pixel2motion` 做标志动画，`sound` 配音效。
  - **开工前用户定**：时长（15 秒还是 30 秒）、画幅、语言、要不要配音。
  - 成片和工程都留在本目录的试验目录里，不往 `hiraishin` 仓库写东西。
- [ ] **2B 对话短片：朝カフェ ep001**（起因项目，整个试验最终要回答的就是它的动画怎么做）
  - 题材：`../asakafe`，ep001 是「日本語お上手ですね」怎么回。竖屏 1080×1920，30 帧每秒。项目现状看 `../asakafe/STATUS.md`。
  - 现成的声音：`../asakafe/out/ep001_f/norm/` 里每句归一过的音频，`../asakafe/out/ep001_f/_clips.json` 里的时长。
  - 方法：照作者「先有声音，再做画面」的做法，在脚手架工程里先放进音频，再对着音频的时间点做动画；角色动作叫 `disney-animation-rule-skill`；音效用 `sound`，落在动作发生的那一帧。
  - **开工前用户定**：画面素材用什么。可以让它按作者「全代码画角色」的路子现画，也可以拿试验分支里已有的图当占位。
- [ ] **2C 讲解或剧情：同一段旁白，两条路线对比**
  - 同一段带时间戳的旁白，一条交给 `auto-motion`，一条交给 `remotion-code-motion-explainer`，成片并排比较。
  - **开工前用户定**：旁白用什么内容。字幕文件可以由 TTS 的片段时长直接生成。

## 第 3 阶段：好坏清单和沉淀

- [ ] 写 `notes/scorecard.md`：每个部分一行，写清楚好在哪、不好在哪、适合哪类片子、要不要留。
- [ ] 回到 `notes/hypotheses.md`，给每条假设标「成立」「不成立」或「没测到」。
- [ ] 和用户讨论怎么沉淀：做成自己的技能、工作流，还是直接用它的某几个部分。这一步有了前面的依据再谈。

## 安全边界

- 所有安装、克隆和运行都在本目录内。有 7 个技能会克隆没锁版本的外部工程并执行安装，`auto-motion` 以不询问权限的方式运行智能体，这些都只在各自的试验目录里跑。
- 不运行 `sound/scripts/clash_freesound.py --fix`：它会改写本机 Clash 的配置并切换节点。Freesound 连不上就记为失败。
- `claude-typer` 会把输入的文字传给作者的网站渲染，试验时只用无关紧要的示例文字。
- 不往 `asakafe`、`hiraishin` 等其他项目的仓库里写东西，除非用户明确要求。

## 完成标准

- 第 1 阶段的每一项都有试验记录和结论。
- 第 2 阶段三条真实任务各有一条成片，用户看过并给了评价。
- `notes/scorecard.md` 写完，`notes/hypotheses.md` 里的假设逐条有了结果。

## 试验记录格式

每个 `trials/NN-名字/TRIAL.md` 写这几项：

```
# NN 名字
日期 / 用的仓库和提交版本
做了什么：安装命令、触发用的原话
跑通了吗：一次通过 / 改了什么才通过 / 没通过，卡在哪
耗时和花费
成片：文件路径，抽帧拼图的路径
用户评价：（用户看过后填）
改一处要多久：挑一个小改动实测
和配音、音效怎么接
好的地方 / 不好的地方
结论：留用 / 只取某部分 / 不用，以及适合哪类片子
```

## Review

（阶段结束时写）
