# 03 技能 remotion-candlestick（K 线图动画）

日期：2026-11-13
版本：vibe-motion/skills f558ec4（`.claude/skills/remotion-candlestick/`）。工程用 `create-vibe-motion@1.2.2` 脚手架搭，Remotion 4.0.438，pnpm 10.33，Chrome Headless Shell 144.0.7559.20。

## 做了什么

- 触发原话（照 README 和 description 写）：「用 Remotion 做一个 S&P 500 过去 40 年周线 K 线图动画」。
- SKILL.md 的前提是「vibe-motion-app 这个 Remotion 项目」，有插件架构，就是 create-vibe-motion 脚手架，所以先跑 `npm create vibe-motion@latest project`（16 秒）。
- 照它的 4 步走：
  1. 写 `scripts/fetch-sp500-data.mjs`，调 Yahoo Finance，拉到 2238 根周线（1984-01-01 到 2026-11-12），存成 `public/data/sp500-weekly.json`。
  2. 写 `motion/candlestick/` 下的 config、timeline、Scene、plugin 和 `render-presets/default.json`。
  3. 改 `motion/project.js`，切到 `SP500Kline`。
  4. 跑 `remotion:compositions`、`remotion still --frame=420`，再用 `pnpm exec remotion render SP500Kline out/sp500-kline.mp4 --props ...`。

## 跑通了吗

**这个技能不带代码，只有一份制作记录和代码片段。** 四个文件约 300 行，都是照片段由智能体自己写的。片段里给了颜色、蜡烛参数、入场渐显加生长、`delayRender` 加载数据、DPR 适配、分段缓动的思路。没给的部分要自己定：横轴视野怎么随揭示变化、纵轴是线性还是对数、年份标签多密、右上角显示什么。写完第一版就渲出来了。

- 数据接口：一次通过，不用 API key，不加 User-Agent 也行。
- 抽帧自查发现我写的缓动有问题：开头 3% 用了 easeOut，速度在第 3% 处降到 0 再起步，第 19 到 23 帧画面不动。把开头那段改成线性，重渲，差分里就没有静止帧了。这是照它那句「开头 3% 快速建立基线」写出来的坑，片段里没给具体曲线。
- 它写的 `REMOTION_PROPS_FILE=... pnpm run remotion:render` 就是 1.1 里那个坏掉的渲染脚本，本次没再测，直接调 CLI。
- 默认尺寸 1920×1080，没撞上脚手架 1280 宽的上限，因为上限写在示例插件的 timeline 里，新插件是自己写的。

## 耗时和花费

约 12 分钟：脚手架 16 秒，写代码约 2 分钟，看演示 GIF 和抽帧约 5 分钟。28 秒片渲染 14 秒。没有 API 花费。

## 成片

- `out/sp500-kline.mp4`：1920×1080，30fps，28 秒，840 帧，10MB
- `out/frame420.png`：单帧
- 抽帧拼图：`contact.png`（8 帧）

拼图里看到的：深色交易终端风格，左上是标题和副标题（中文显示正常），右上是当前价、涨幅和日期，右侧价格轴，当前价有一条蓝色虚线，底部是蓝色进度条。蜡烛从左往右长出来，横轴视野一路拉远，纵轴跟着已揭示的高低价自动缩放，最后停在 7,592（2026-11）。

缺点：
- 第 0 帧是空图表，没有蜡烛。
- 后半段蜡烛只有 1 像素左右宽，看上去像一条折线，红绿几乎分不清。演示 GIF 也是这样。
- 纵轴每帧都在缩放，整张图会轻微「呼吸」。

## 用户评价

（待填）

## 改一处要多久

改揭示曲线的开头一段：改一行加重渲，约 30 秒（渲染 15 秒）。

## 和配音、音效怎么接

技能里一句没提。脚手架有音频清单（见 1.1），可以把旁白挂上去。进度由 `durationSeconds` 决定，要对齐旁白，得自己在 timeline 里加时间点。

## 它怎么指挥智能体

这是一份「我是怎么做的」记录，加上关键片段和常见问题。没有关卡，没有检查清单，也没有自查要求，只在最后列了 compositions、still、render 三条命令。和脚手架的约定一致：所有动画状态只依赖帧号，场景不自己读帧，参数、时间线、画面分开。

## 好的地方 / 不好的地方

- 好：数据接口能用；插件结构和脚手架一致；暗色配色和蜡烛参数可以直接拿来用；「数据先存成本地 JSON，再用 `delayRender` 等加载」这个做法能搬到别处。
- 不好：说是「自带实现」，其实没代码，要智能体从片段重写，每次写出来的都会不一样；缓动只给了一句话，照着写容易出卡顿；引用的渲染脚本是坏的；40 年周线压在一屏里，后半段看不出蜡烛。

## 结论

只取做法：Yahoo 数据加 Canvas 逐帧画图加 `delayRender`。适合财经或数据讲解类片子。和朝カフェ无关。
