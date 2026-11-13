# 2B 朝カフェ ep001：两版成片的共同说明

用户的要求（2026-11-14 原话）：「两个都做，我先去睡一觉，醒来我要看到用心做好了的片子」。两个版本：
- **角色版**（`puppet/`）：代码画的人物和场景，人物要有表演。
- **气泡版**（`bubble/`）：不画人物，用对话气泡 + 文字表达整段对话。

## 这一集是什么

日语跟读栏目「日本語の朝カフェ」第 1 集：在公司欢迎会的居酒屋里，邻座的部长夸你「リンさん、日本語、お上手ですね」，怎么回才不尴尬。读者是在日本的中文使用者，A2 水平。

台词和配音（都在 `shared/ep001_f/`，音频是 Fish Audio 合成，已经响度归一）：

| tag | 谁 | 文本 | 中文 | 文件 | 时长 |
|---|---|---|---|---|---|
| ask | 部长（男，40 多岁，微醺温和） | リンさん、日本語、お上手ですね。 | 小林，你日语说得真好啊。 | norm/ask.wav | 2.88s |
| q | 主持人（中文女声） | 被日本人夸日语好，怎么回才不尴尬？ | | norm/q.wav | 3.297s |
| target_normal | 你（女，リン） | え、本当ですか？うれしいです。 | 诶，真的吗？好开心。 | norm/target_normal.wav | 2.47s |
| react | 部长 | いやいや、本当に。日本はどれくらい？ | 不不，真的。来日本多久了？ | norm/react.wav | 2.998s |

注音：日本語（にほんご）、お上手（じょうず）、本当（ほんとう）、日本（にほん）。

一行字（hook）：「别否认。你一否认，对方还得再夸一轮。」
不自然的回法（可做反例）：「いいえ、下手です」（生硬否定，逼对方再安慰）；单独一句「いいえ、まだまだです」（太教科书，像在演）。

## 结构（用户已定，不要改）

时间线由 `src/timeline.ts` 的 `buildTimeline(clips, defaultGaps)` 生成，总长约 29.9 秒：

| 段 | kind | 时长 | 说明 |
|---|---|---|---|
| ① 被问 | ask | 2.88 | 部长说，日文字幕 + 中文 |
| | wait | 2.0 | 部长笑着等你回答 |
| ② 主角 | host | 3.297 | 主持人中文提问 |
| | hostPause | 1.0 | |
| | play1 | 2.47 | 目标句第一遍（常速） |
| | gap | 1.0 | |
| | play2 | 2.47 | 第二遍（常速，不用慢速） |
| | shadow | 2.5 | 跟读留白，观众自己说 |
| ③ 再来一遍 | ask2 | 2.88 | 部长重放，**撤字幕**（观众要靠听） |
| | countdown | 3.0 | 倒计时 3-2-1，观众作答 |
| | answer | 2.47 | 参考答案（目标句） |
| | beforeReact | 0.3 | |
| | react | 2.998 | 部长反应，话题往下走 |
| | tail | 0.6 | 片尾 |

音频播放、帧数计算已经在 `Episode.tsx` / `Root.tsx` 里接好（每段一个 `<Sequence>` + `<Audio>`），画面不决定时长。

## 用户已表态的偏好（来自 `../asakafe/STATUS.md`，只读，不许改那个目录）

- 喜欢**矢量扁平的代码画人物和场景**（就是 `puppet/src/Puppet.tsx`、`Izakaya.tsx` 现在的样子），**不喜欢**赛璐珞风位图立绘（`Sprite.tsx` 和 `assets/chars/`、`izakaya_bg.png` 不要用）。
- 全片一种底色，文字锚在固定槽位，段落切换时版式不跳。
- 短（20–30 秒），段 ② 的目标句常速两遍。

## 现在的基线

`baseline.mp4` / `baseline-contact.png`（每秒一帧）：asakafe 现有的版本。上面 1/3 是居酒屋画框，人物基本只动嘴、换表情；下面是大字和释义；屏幕下半部分大片空着；②③ 的文字切换比较生硬。两个新版本都要明显超过它。

## 这次试验学到的、要用上的做法

1. **先有声音，再做画面**：所有动作对齐音频时间（`segments` 里每段的 start/dur），说话时的嘴形跟音量走（`@remotion/media-utils` 的 `useAudioData` + `visualizeAudio`，基线 `Stage.tsx` 已有写法）。
2. **帧驱动、确定性**（`../05-starter/ext/docs/HARD_RULES.md`）：所有动画由 `useCurrentFrame()` 算；不用 `Math.random` / `Date.now` / CSS transition / CSS animation；`interpolate` 两端都 clamp；`spring` 的结果再用 `interpolate` 映射。
3. **disney 技能的阶段表**（`.claude/skills/disney-animation-rule-skill/SKILL.md` 和 `references/`；用户认可的例子是 `../03-skills/disney-animation-rule-skill/project/motion/timeline.js` 的 B 版）：每个动作先写阶段表（预备 → 动作 → 过冲 → 回稳，次要动作滞后），再选缓动；保持段也要有微小的活气（呼吸、眨眼），不要冻住。
4. **自己看画面**：按每段的起点、中点、终点抽静帧（`npx remotion still src/index.ts Episode out/qa/fNNN.png --frame=NNN --scale=0.5`），用 Read 看图；做全片抽帧拼图（`ffmpeg -i out/x.mp4 -vf "fps=2,scale=216:-1,tile=10x6" -frames:v 1 contact.png`）。重点看：日文和中文有没有缺字/豆腐块、注音位置、文字有没有溢出、版式在切换时跳不跳、空的区域、人物穿模。发现问题就改，再看。
5. **音效**：可用 `src/assets/sfx/` 里现成的 CC0 音效（环境声、pop、tick、clink，出处见 CREDITS.md），基线 `Sfx.tsx` 有用法。要新的可以用 `../06-sound/` 的 sound 技能（`cd ../06-sound && python3 .claude/skills/sound/scripts/sfx.py freesound "<英文>" --license cc0`，`get` 下载），只选 CC0，在 NOTES 里记出处。音效音量要克制，不能盖过人声。

## 环境注意

- Remotion 固定在 **4.0.484**（`--save-exact`）。4.0.541 在这台机器上连空工程都加载不出来（"Waiting for root component" 超时），不要升级。
- 渲染：`npx remotion render src/index.ts Episode out/<名字>.mp4`（约 15 秒）。类型检查：`npx tsc --noEmit`。
- 只在自己那个目录（`puppet/` 或 `bubble/`）里写文件；`shared/` 只读；**绝对不要写 `../asakafe`**；不要动另一个版本的目录。
- 不要播放音频，不要改系统音量；检查音频用 ffprobe / ffmpeg 的 volumedetect。
- 字体用 macOS 系统字体（Hiragino），已在 `theme.ts`。

## 交付（每个版本）

1. 成片 `out/ep001_<版本>.mp4`：1080×1920，30fps，带音频，约 29.9 秒。
2. `contact.png`：全片抽帧拼图（每 0.5 秒一帧）。
3. `NOTES.md`（中文，写给用户看，简洁）：做了什么、画面设计思路、每段怎么演、用了哪些学到的做法、自查发现并修掉了什么、还剩什么问题、花了多久。
