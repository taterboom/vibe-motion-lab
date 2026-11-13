# 03 技能 brand-launch-video-star（缩小版试跑）

日期：2026-11-13
版本：skills 仓库 f558ec4（`.claude/skills/brand-launch-video-star/`）；脚手架 `create-vibe-motion`（npm latest，Remotion 4.0.438）
真实产品的完整制作是 2A（Hiraishin），这里只按它的流程走一遍缩小版。

## 做了什么

- 读完 `SKILL.md`、`references/` 全部（story-patterns、motion-quality、asset-authenticity、两个示例 JSON）、两个校验脚本。
- 题材：README 的两个示例（Burger King、Moonshot AI）是真品牌，技能目录里只有 GIF，没有素材，复现不了，也不该用别人的 logo。所以按指示虚构一个产品：**orbitask**，一个"说一句目标就排好一周任务"的 AI 任务工具。logo 和字标是我在本试验里写的 SVG，片尾标注 "Fictional product · concept film · not a real brand"。
- 照 README 的触发句意思走：`Use $brand-launch-video-star to create a 1x-second 16:9 English launch film ...`，时长改成 12 秒（任务要求 10–15 秒）。
- 脚手架：技能说"没有工程就 `npx create-vibe-motion`"，用了 `npm create vibe-motion@latest .../project`。
- 渲染：`pnpm exec remotion render Motion30fps out/orbitask-launch.mp4 --codec h264 --crf 18`。

## 按技能流程走的每一步

1. **定需求**：12 秒、16:9、1920×1080、30fps、英文、无声（技能默认"先出画面，声音按需"）。
2. **品牌真相表**：虚构产品没有官网可查。颜色自定：neutral `#0E0F13` / interaction-blue `#0C1B3F` / execution-violet `#22123F` / result-amber `#F4B23C`，四个颜色状态（技能要求 2–5 个，按含义命名）。
3. **素材清单**：`asset-manifest.json`，两条（mark、wordmark），`sourceType: user-provided-original`，带 sha256。
4. **故事线**：技能给 4 种。选 AI/SaaS 这条：intent → thinking/planning → capabilities → execution → output → proof → logo。去掉 proof（没有可核实的数据，技能禁止编数字）。
5. **逐帧节拍**（`project/motion/shots.js` 是唯一来源，`scripts/export-timeline.mjs` 生成 `timeline.json`）：

| 拍 | 帧 | 主动作 | 颜色 |
|---|---|---|---|
| brand-hook | 0–40 | 轨道小点加速落到标志上，标志被扫出来 | neutral |
| intent | 34–110 | 输入框展开，打字 "Plan our launch week"，光标点 Send | blue |
| routing | 102–170 | Send 的冲击把小点弹出，依次点亮 Plan / Assign / Schedule | violet |
| board | 162–250 | 三个节点变成三列看板，5 张卡片落下后依次飞进 Done | violet |
| result | 242–306 | 卡片变成周日历上的色块，标题 "Launch week, planned." 停住 | amber |
| lockup | 298–360 | 色块收拢成一个点，点落成标志，出 CTA 和"虚构"声明 | neutral |

   每次换颜色都由画面里的一个事件触发（标志升起、Send 按下、最后一张卡落地、色块收拢），从事件的位置圆形扩散。这是 motion-quality.md 里"颜色状态机 + 由真实事件触发"的做法。
6. **实现**：`project/motion/timeline.js` 是纯函数 `buildState(frame)`，`Scene.jsx` 只渲染。标志用 `<Img>` 原样放 SVG 文件，入场只用遮罩（conic 扫描）和缩放，没有用代码重画标志——这是技能"logo 零容忍"的要求。
7. **校验**：两个脚本都过了；再抽帧自查一次，改了两处（见下）。

## 跑通了吗

改了才通，改动都在我自己的工程里，没动技能：

- 脚手架的 `timeline.js` 把宽限死在 1280 以内，技能默认 1920×1080。我整个替换了 `motion/` 下的 config、timeline、Scene，尺寸就不受限了。
- `pnpm remotion:render` 坏的（1.1 已知），直接用 `pnpm exec remotion render`。
- 12 秒不在校验器默认的 15–30 秒里，要在 `timeline.json` 里写 `"allowCustomDuration": true`，否则报错。

渲染本身一次通过：360 帧 9 秒。`remotion compositions` 显示 `Motion30fps 30 1920x1080 360 (12.00 sec)`。输出是 h264 1920×1080 30fps，附带一条静音 aac 轨（脚手架的音轨组件带出来的）。

## 两个校验脚本实测

| 命令 | 结果 |
|---|---|
| `validate-assets.mjs asset-manifest.json`（我的） | 通过，2 个 |
| `validate-timeline.mjs timeline.json`（我的） | 通过，6 shots / 360 帧 |
| `validate-timeline.mjs references/timeline.example.json` | 通过，6 shots / 450 帧 |
| `validate-assets.mjs references/asset-manifest.example.json --schema-only` | 通过 |
| `validate-assets.mjs references/asset-manifest.example.json`（完整） | 失败：两个本地文件不存在。符合预期，示例只给结构 |

另外故意试了三种它查不出的情况（文件在 scratchpad，没留）：
- 30 秒只有 2 个镜头、零重叠：**通过**。它不查节拍数，也不查最少重叠。
- 随便一个文件声称 `official-website`，来源写 `https://example.com/logo.svg`：**通过**。它只查字段格式和文件存在，脚本自己也写明"不证明来源真实"。
- 12 秒不加 `allowCustomDuration`：失败，提示清楚。

结论：时间线校验只管"首尾覆盖、无空档、重叠 ≤12 帧、时长 15–30 秒"，素材校验只管"字段齐、来源类型在白名单、文件在、校验和对得上"。节奏和真实性还是靠人。

## 素材真实性规则要求什么（asset-authenticity.md）

- 来源优先级：用户给的原件 > 官网/静态包 > 新闻室/媒体包 > 公司自有媒体库 > 授权图库。禁止搜索缩略图、logo 聚合站、Pinterest、AI 生成替身。
- logo：去官网下原文件，比对外形、字形、间距、颜色、比例，记录来源；只有内联 SVG 就存原始路径；**禁止重画、描摹、用字体打字标**。
- 产品、界面截图、人物、吉祥物、包装、车辆建筑、合作方 logo 都要真实来源。程序生成的图形只能当遮罩、渐变、粒子、转场几何、真实数据图表，不能冒充这些。
- 拿不到真的就停下来问用户要，不许做"看起来像"的替身。
- 产品名、功能描述、数字、口号要记官方页面和访问日期。

和虚构产品的矛盾：规则是为真品牌写的。虚构产品的"原件"就是我们自己画的 SVG，只能登记为 `user-provided-original`（`sourceUrl` 必须是 `user-provided://`）。字标是 SVG 里的 `<text>`，严格说就是规则禁止的"用字体打字标"，只是这里我们本来就是作者。另外它要求"真实产品界面"，虚构产品没有，这条片里的输入框、看板、日历都是**概念示意**，规则允许"clearly conceptual abstract motion"，但我的看板画得比较像真界面，放到真品牌上就越界了。2A 用 Hiraishin 时要用它的真实截图（`docs/store-assets/`）。

## 假设 7 实测（`project/scripts/measure-beats.mjs`）

- **节拍密度**：6 拍 / 12 秒 = 0.5 拍/秒。技能自己的标准：15 秒 5–8 拍（0.33–0.53），30 秒 8–12 拍（0.27–0.4）。
  作者的两个示例 GIF 按画面数下来：Burger King 约 11 拍 / 15 秒（0.73），Moonshot 约 9 拍 / 15 秒（0.6），**都比技能自己写的上限密**。
- **一拍一个主动作**：按动作表逐帧数，322 帧不在重叠区里，其中 253 帧恰好 1 个主动作，58 帧 0 个（停顿），11 帧 2 个（标志升起时输入框已开始展开；节点变列时卡片已开始落）。基本做到。
- **转场重叠**：5 处，6/8/8/8/8 帧，都在 6–12 内。
- **成片的运动量**（每帧平均像素差，0–255）：最大的两个峰是两次整屏换色（琥珀色铺开、回到深色），不是产品动作。第一版换色 14 帧，单帧跳变到 69，像闪一下；改成 22/24 帧后降到 43。intent 这一拍 75 帧里有 46 帧几乎不动（只在打字），偏慢。

结论：**部分成立**。这套数字能排出结构清楚、每拍一件事的片子，规则本身容易执行、容易量。但"节奏好"它保证不了：作者自己的示例就比规则快；整屏换色天然是最强的视觉事件，会抢过产品动作；打字这类动作像素变化小，拍子会显得拖。好不好要用户看。

## 耗时和花费

约 25 分钟（10:50 开始读，11:05 出第二版成片，其后写记录）。脚手架安装 13 秒，抽 15 张静帧约 1 分钟，整片渲染 9 秒。没有 API 花费。

## 成片

- `project/out/orbitask-launch.mp4`：第二版（换色放慢后），12 秒
- `project/out/orbitask-launch-v1.mp4`：第一版
- `contact.png`：8 帧（第 22、67、112、157、202、247、292、337 帧）
- `timeline.json`、`asset-manifest.json`：技能要求的两份规划文件

拼图里看到的（照实说）：
- 第 1 格：标志和字标都出来了，但入场的小点和它的残影正好划过字标的 "o"，有点脏。
- 第 2 格：输入框只打了 "Plan"，画面大部分是空的。
- 第 3 格：小点从 Send 弹回第一个节点，有拖尾，节点还没点亮，画面很空。
- 第 4 格：三个节点点亮、标题 "One goal. Every step."，干净但像幻灯片。
- 第 5 格：卡片正在从 To do 飞向 Done，有倾斜和阴影，这一拍最有动感。
- 第 6 格：琥珀色铺开中，看板半透明残留，过渡中间态不好看。
- 第 7 格：周日历和大标题，读得清；色块里的小字（21px）在缩略图上看不清。
- 第 8 格：标志+字标+CTA 居中，CTA 还在淡入。
- 总体：干净、可读，但风格是常见的深色 SaaS 模板感，"强视觉冲击"谈不上。没有真实产品素材时，这个技能能给的主要是结构和节奏。

## 用户评价

2026-11-13：看了 orbitask-launch.mp4，觉得很好。

## 改一处要多久

把两次整屏换色从 14 帧放慢到 22/24 帧：改 `timeline.js` 两个数字，重渲染加重测共 8 秒。因为所有镜头边界和动作时间都在两个常量文件里，改时间类的东西非常快。

## 和配音、音效怎么接

技能默认 V1 无声，"有要求或有素材再加"，没写任何声画规则。但它逼出来的东西很适合配音效：每个主动作都有明确的冲击帧（标志落点第 24 帧、Send 按下第 96 帧、5 张卡落地第 208/214/220/226/232 帧、色块收拢第 318 帧），都在 `timeline.js` 里。用脚手架的 `public/.vibe-motion/audio-tracks.json` 写音轨清单，按这些帧挂音效即可。

## 好的地方

- 流程完整：需求 → 品牌真相 → 素材清单 → 故事线 → 逐帧节拍 → 实现 → 校验 → 交付来源说明。每一步都有可检查的产出。
- 动作分 6 段（setup / anticipation / commitment / impact / brake / settle）、次要层延后 2–6 帧、颜色状态机由事件触发、"一个镜头管速度，下一个管落点"，这些写得具体，能直接照做，也能搬到别的片子。
- 素材真实性规则很严，适合真品牌（2A 的 Hiraishin 正好有真实素材）。
- `state = f(frame)`、镜头边界集中在一个文件，和脚手架的结构一致。

## 不好的地方

- 校验脚本很薄：只查 JSON 结构和文件存在，节拍数、最少重叠、一拍一动作、来源真伪都不查。
- 作者示例比自己的规则快，规则和示例不一致。
- 指定的脚手架和它冲突：脚手架 `AGENTS.md` 说"视觉效果非必要不跑自动化验证，让用户目测"，技能第 9 步要求"检查代表性帧和整片"。脚手架的尺寸上限也挡住技能默认的 1920×1080。
- 没有声音、没有视觉风格指导（字体、构图、质感），出来的东西容易是通用模板感。
- 示例只有两个真品牌 GIF，没有工程，没法复现。

## 结论

只取方法。留用它的规划方法（故事线、逐帧节拍表、动作 6 段、颜色状态机、素材清单），适合产品宣传片和发布片；2A 照它走。校验脚本作用有限，可以自己补一个量节拍的脚本（本次的 `measure-beats.mjs` 就是）。画面质量要靠真实素材和另外的视觉方向。
