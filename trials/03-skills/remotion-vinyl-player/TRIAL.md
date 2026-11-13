# 03 技能 remotion-vinyl-player（黑胶唱片播放器）

日期：2026-11-13
版本：vibe-motion/skills f558ec4（`.claude/skills/remotion-vinyl-player/`）。工程用 `create-vibe-motion@1.2.2` 脚手架，Remotion 4.0.438。

## 做了什么

- 触发原话：「做一个黑胶唱片机音乐播放器动画」。
- SKILL.md 没指定工程，就用作者的脚手架：`npm create vibe-motion@latest project`。
- 照它的 3 步做：
  1. 把 `assets/VinylPlayer.tsx` 拷到 `project/src/components/animations/`（SKILL.md 指定的就是 `src/components/animations/`）。
  2. 在 `remotion/ProjectRoot.jsx` 里注册两个 Composition，都是 1080×1920、30fps、10 秒。
  3. 填数据，两种：
     - `VinylDefault`：全用组件默认值，封面从 Unsplash 拉，底纹从 transparenttextures.com 拉。
     - `VinylCustom`：本地封面 `catalina-sunset.jpg`，歌名和歌手都是编的占位字。
- `pnpm exec remotion render VinylDefault|VinylCustom out/...mp4`

## 跑通了吗

一次通过，没改代码。两条各 10 秒左右渲完。

注意：
- **默认值依赖外网。** 封面用的是 `<Img>`，Remotion 会等它加载完。但卡片底纹是 CSS 的 `backgroundImage: url(https://www.transparenttextures.com/...)`，Remotion 不会等它，断网或者加载慢时，有些帧会没有底纹。本次两条都正常加载了。
- 组件不读音频。唱片按每 2 秒一圈转，进度条按 `durationInSeconds` 走，跑马灯 6 秒一圈，三样都和真正的歌没关系。

## 耗时和花费

约 3 分钟，另加脚手架 16 秒。每条渲染约 12 秒。

## 成片

- `out/vinyl-custom.mp4`：本地封面加占位字，1080×1920，10 秒
- `out/vinyl-default.mp4`：全默认，封面是演示 GIF 里那只狗
- 抽帧拼图：`contact.png`（custom 那条，6 帧）

拼图里看到的：深色卡片，有星点底纹，黑胶唱片，中间圆形封面在转，下面是跑马灯歌名（日文正常显示，左右两端渐隐）、灰色歌手名、白色进度条带圆点、五个按钮（随机播放是绿色的）。整体像 Spotify 的样式，干净。

缺点：
- 唱片纹路是同心圆渐变，转起来看不出动，只有封面在转。封面如果是对称图案，整张唱片看上去就是静止的。
- 播放器写死 360px 宽，再乘 `scale=1.5`，在 1080×1920 画面里只占中间一半宽，上下空出大片。
- 跑马灯 6 秒一圈，10 秒的片子循环播放时，歌名会跳一下。
- 跑马灯第 0 帧歌名是从头显示的，没有入场动画；整片也没有任何入场或退场。

## 用户评价

（待填）

## 改一处要多久

换封面和文字只改 props。本次第二条从写 props 到出片约 1 分钟。

## 和配音、音效怎么接

组件里没有 `<Audio>`。要配歌，就在 Composition 里另放 `<Audio>`，再把 `durationInSeconds` 设成歌的长度。SKILL.md 的 description 写了「audio-visualizer interface」，实际上没有任何随音频变化的东西。

## 它怎么指挥智能体

和 3d-ticker 是同一个模板：先讲原理（帧号换算旋转角度、复制文字做跑马灯、进度条、CSS 纹理），再列「拷文件、注册、填 props」三步。没有检查。组件自己读帧号。

## 好的地方 / 不好的地方

- 好：拷进来就能用，样子不错，换数据只改 props。
- 不好：依赖外网资源，其中底纹不在 Remotion 的等待范围里；尺寸写死；唱片纹路转起来看不出动；不接音频。

## 结论

只取这个效果。适合音乐推荐、歌单类短片当一个画面元素用。和朝カフェ关系不大，除非要做「今日 BGM」那种角标。
