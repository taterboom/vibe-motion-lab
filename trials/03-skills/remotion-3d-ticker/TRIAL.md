# 03 技能 remotion-3d-ticker（3D 照片滚动墙）

日期：2026-11-13
版本：vibe-motion/skills f558ec4（`.claude/skills/remotion-3d-ticker/`）。工程用 `create-vibe-motion@1.2.2` 脚手架，Remotion 4.0.438。

## 做了什么

- 触发原话：「做一个 3D 照片滚动墙」（取自 description 里的「3D照片滚动墙 / 3D相册瀑布流」）。
- SKILL.md 没指定用什么工程，就用作者的脚手架：`npm create vibe-motion@latest project`。
- 照它的 3 步做：
  1. 把 `assets/VerticalTicker.tsx` 拷到 `project/src/components/animations/`。
  2. 新建 `remotion/TickerDemo.jsx`，在 `remotion/ProjectRoot.jsx` 里加一个 `<Composition id="VerticalTicker">`（1920×1080，30fps，10 秒）。
  3. 填数据：3 列，每列 4 张缩略图（放在 `public/photos/`），周期分别是 10、5、10 秒，方向是上、下、上。
- `pnpm exec remotion render VerticalTicker out/ticker.mp4`

## 跑通了吗

一次通过。脚手架是 JSX，组件是 TSX，Remotion 直接能打包，没报错。

**有一个循环接缝的 bug。** 内容列用 `gap: 30`，复制一份后，-50% 的位置比一份内容的真实周期少 15px（2n 张图只有 2n-1 个间隙）。所以每到循环点，画面会多跳约 15px。实测 5 秒那一列在第 149 到 150 帧位移 27px，平时是 14 到 17px。10 秒那两列的接缝正好落在片尾，成片循环播放时也会跳。

在试验目录的副本里改了一处：去掉 `gap`，给每张图加 `marginBottom: 30`。重渲成 `out/ticker-seamfix.mp4`，循环点的位移回到 17px，和前后一致。技能目录里的原件没动。

还要注意两点：
- 整片要无缝循环，合成时长得是每列周期的整数倍。SKILL.md 没提。
- 每列内容至少要两屏高，否则会露底。SKILL.md 也没提。

## 耗时和花费

约 5 分钟，另加脚手架 16 秒。10 秒片渲染 13 秒。修接缝加重渲约 1 分钟。

## 成片

- `out/ticker.mp4`：原样组件，1920×1080，30fps，10 秒
- `out/ticker-seamfix.mp4`：修了接缝
- 抽帧拼图：`contact.png`（原样那条，8 帧）

拼图里看到的：三列圆角照片卡，整体后仰 20°，上窄下宽，顶部和底部渐隐到黑色。中间一列往下走，两边往上走，有视差。356px 的缩略图拉到 400×500 有点软。列宽写死 400px，在 1920 宽的画面上左右各空出大约四分之一，全是黑边。没有空白帧，滚动是匀速，没有缓动。

## 用户评价

（待填）

## 改一处要多久

修接缝：改两行加重渲，约 1 分钟。

## 和配音、音效怎么接

组件不管声音。要配乐，就在 Composition 里另放 `<Audio>`。

## 它怎么指挥智能体

先讲原理（复制列表后对 50% 取模、3D 透视、上下遮罩），再列「拷文件、注册合成、填数据」三步。没有检查，也没提循环要整除、内容要够高。组件自己调 `useCurrentFrame`，不走脚手架「场景只吃参数、帧计算放 timeline」的约定，两套写法不一样。

## 好的地方 / 不好的地方

- 好：拷进来就能用；原理讲得清楚，能搬到别的无限滚动效果上。
- 不好：循环接缝差 15px；列宽和卡片高写死成像素，不跟画面尺寸走；只能匀速滚动。

## 结论

只取这个效果，改了接缝再用。适合宣传片里的作品墙或相册墙，竖屏会更满。和朝カフェ的对话短片关系不大。
