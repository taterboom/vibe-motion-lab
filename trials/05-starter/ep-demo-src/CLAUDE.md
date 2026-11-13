# CLAUDE.md — ep-demo

竖屏 1080×1920、15s、**纯图形无口播**的日语表达小片:被夸「日本語お上手ですね」怎么回(01 先道谢 / 02 まだまだです / 03 顺势反问)。
从 `../template/` 起手,规则同 `../template/CLAUDE.md`(本文件不复述),硬规则真源 `../docs/HARD_RULES.md`。

## 结构

- 改片只动 `props.json`。镜头用 kit 的竖屏镜头 `vchat`(开场/收尾聊天气泡)+ `vtip`(编号要点 + 对话演示),在 `../kit/scenes/vertical.tsx`。
- 无 `speaker` → TalkingHead 只渲背景色 + 镜头图形。

## 视觉 / 流程禁区

- **竖屏安全框**:内容只放在 top 250 / bottom 420 / left 90 / right 150 以内(顶部标题栏、底部文案区、右侧按钮列)。`vtip` 第 03 条对话区最满,改文案后必抽帧看底部有没有压线。
- **日文假名靠 `Noto Sans SC` 渲染**:改 / 加日文文案后必须真渲抽帧,确认假名不是系统回退字体、不掉豆腐块。
- 颜色只走 `kit/theme.ts` token(`background` 用 `warmPaper.canvas` 同值)。
- 最后一镜 `disableFadeOut: true`,成片停在完整对话上,不淡到空白。

## QA

⚠️ `npm run qa:still` 的临时入口把画布写死成 1920×1080,竖屏镜头会被按横屏渲,**本片别用它**(待修 `.claude/skills/cyxj-remotion-produce/assets/qa-still.mjs`)。
用整片抽帧(真实 1080×1920 合成):
`npx remotion still TalkingHead qa-frames/fN.png --frame=N --scale=0.5`。
