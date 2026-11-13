# 03 技能 wechat-2d-render

日期：2026-11-13
版本：skills 仓库 f558ec4；外部工程 `sxhzju/wechat-2d` main **45a2f84**（2026-04-27），2026-11-13 克隆到 `ext/wechat-2d`。Remotion 4.0.438，pnpm 10.33。

## 做了什么

- 触发原话（README）：「克隆或更新 sxhzju/wechat-2d，并渲染默认微信聊天 2D 动效视频」。
- 先自己克隆到 `ext/` 并看了 `package.json`，再照 SKILL.md 跑脚本：
  `bash .claude/skills/wechat-2d-render/scripts/render_wechat_2d.sh <trial>/ext <trial>/out/wechat-2d-transparent.mov`
  脚本走「复用已有仓库」分支：fetch + pull（无更新）→ `pnpm install` → `pnpm run remotion:ensure-browser` → `pnpm run remotion:render`。
- 安装前检查：postinstall 是 `remotion-ensure-browser.mjs`（同脚手架，拷 Chrome Headless Shell 到 `~/Library/Caches/com.zjucat.create-vive-motion/`）。另有 `deploy:edgeone*` 脚本会打开腾讯 EdgeOne 部署页，技能不调用，没跑。

## 跑通了吗

改了调用方式才通，脚本本身一次通过。

- SKILL.md 的「Installed Skill Resolution」只在 `~/.agents`、`~/.claude`、`~/.codex` 下找技能，**找不到装在项目里的 `.claude/skills/`**，原样执行会报 not found 退出。照 todo.md 是装在项目级，所以直接用项目里的脚本路径。没改技能文件。
- 脚本运行 15 秒（pnpm 仓库是热的）。

## 耗时和花费

约 5 分钟。无 API 花费。

## 成片

- `out/wechat-2d-transparent.mov`：ProRes 4444，780×1582（默认 390×791，渲染时放大 2 倍），30fps，5.33 秒，160 帧。带一条静音音轨（-91dB）。
- 拼图：`contact.png`（8 帧，0.33s–5.0s）

拼图看到的：仿微信聊天界面，标题「猫学长的龙虾」。对方（红色龙虾头像）发一句「任何比例的视频消息都可以发送」，文字逐字出现；然后自己（像素猫头像）依次发出 9:16、3:4、1:1、4:3、16:9 五个视频消息，每个先灰后黑地淡入，列表往上滚。节奏顺，像真实操作录屏。

问题：
- **默认「透明」输出其实整帧不透明**：alpha 每帧每个像素都是满的，聊天界面铺满画面。SKILL.md 说适合透明背景工作流，实际没有透明区域。
- 视频消息里的播放按钮（白色圆圈+三角）压在白色的比例数字上，糊在一起，看不清。
- 消息内容和头像写死在 `shared/features/demoMotion/scenes/chatMotionData.js`，参数面板只有宽高两个。要换对话内容得改代码。

## 它怎么指挥智能体

很薄：「用脚本，传目录和输出路径，等它跑完，返回绝对路径」。另有两条工程规则：「动画状态必须每帧确定……不要依赖计时器、可变游标、之前的渲染或渲染顺序」；帧相关数据从 `buildSceneProps` 的 `{frame, fps, loop, sceneContext, pluginParams}` 构建。没有关卡，没有画面自查。

## 改一处要多久

没测。改对话内容需要改 `chatMotionData.js`，不是参数级的改动。

## 和配音、音效怎么接

骨架同 create-vibe-motion（scaffold/plugin 分层），理论上可以挂音频清单；本技能没提声音。消息弹出的时间点适合配「叮」一类的短音效。

## 好的地方 / 不好的地方

- 好：开箱就出，快；聊天界面还原度高，逐字出现、淡入、滚动都顺。
- 不好：内容写死，不是「给台词就出聊天动画」的工具；透明输出名不副实；播放按钮和数字重叠；没有许可证。

## 用户评价

待填

## 结论（暂定）

只取某部分。聊天界面这个场景本身对「对话」类内容有参考价值（朝カフェ的对话也可以做成聊天气泡形式），但要用得先把 `chatMotionData.js` 改成吃数据。直接用不了。
