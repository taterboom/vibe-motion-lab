# 03 技能 procedural-fish-render

日期：2026-11-13
版本：skills 仓库 f558ec4；外部工程 `vibe-motion/procedural-fish` main **2036ba0**（2026-04-05），2026-11-13 克隆到 `ext/procedural-fish`。Remotion 4.0.438，pnpm 10.33。

## 做了什么

- 触发原话（README）：「生成循环游动的 procedural fish 动画」；SKILL.md 例句「渲染程序鱼」「导出程序鱼视频」。
- 先自己克隆到 `ext/` 并看 `package.json`，再跑技能脚本：
  `python3 .claude/skills/procedural-fish-render/scripts/render_procedural_fish.py --workspace <trial>/ext --output <trial>/out/procedural-fish-transparent.mov`
  脚本：fetch/checkout/pull main → `pnpm install` → `pnpm run remotion:render`。
- 脚本只用标准库，不需要 venv。
- 安装前检查：postinstall 同脚手架（拷 Chrome Headless Shell 到 `~/Library/Caches/com.zjucat.create-vive-motion/`），没有别的。

## 跑通了吗

改了调用方式才通，脚本本身一次通过（16 秒）。

两处照抄 SKILL.md 会失败的地方，都没改技能文件，只是换了调用：
- SKILL.md 写死 `/usr/local/bin/python3`（脚本首行 shebang 也是）。这台 Apple Silicon Mac 上 Homebrew 的 Python 在 `/opt/homebrew/bin`，`/usr/local/bin/python3` 不存在。改用 `python3`。
- 找技能目录的循环只查 `~/.agents`、`~/.claude`、`~/.codex`，找不到项目级安装。直接用项目路径。

## 耗时和花费

约 4 分钟。无 API 花费。

## 成片

- `out/procedural-fish-transparent.mov`：ProRes 4444，960×960（默认 480×480，放大 2 倍），30fps，3 秒，90 帧。真透明。带静音音轨。
- 拼图：`contact.png`（8 帧，0.19s–2.81s，棋盘格底）

拼图看到的：一条扁平风格的蓝色锦鲤，俯视，白描边、浅蓝鳍、两点白眼，在画面里绕圈游一整圈，身体随转弯弯成 C 形，尾鳍和胸鳍跟着摆。3 秒正好一圈。量了首尾：第 89 帧到第 0 帧的差别和相邻帧之间一样（PSNR 都约 17），**循环无缝**。

问题：只有一条鱼、一种轨迹（圆），身体弯曲幅度在拼图里看很均匀，没有加速、停顿这类节奏变化，看久了会机械。

## 它怎么指挥智能体

很薄：「解析技能目录，跑脚本，返回输出路径」。没有规则、关卡或自查。

## 改一处要多久

没测。props 里有 `speed`、`orbitRadius`、`fishScale`、`maxStep`，看起来改参数就行。

## 和配音、音效怎么接

没提。

## 好的地方 / 不好的地方

- 好：快；真透明；无缝循环；造型干净。
- 不好：就是一条鱼绕圈，用途很窄；Python 路径写死；没有许可证。

## 用户评价

待填

## 结论（暂定）

不用，最多当装饰素材（加载动画、角落点缀）。程序化身体弯曲的写法（`shared/` 里）如果以后要做会动的小生物可以参考。
