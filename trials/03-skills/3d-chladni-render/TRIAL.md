# 03 技能 3d-chladni-render

日期：2026-11-13
版本：skills 仓库 f558ec4；外部工程 `nolangz/3D-Chladni` main **74d31fa**（2026-07-18），2026-11-13 克隆到 `ext/3D-Chladni`。Electron 42.5.0（`^42.5.0`，用 `npm ci` 按锁文件装）。

## 做了什么

- 触发原话（README）：「克隆或更新 nolangz/3D-Chladni，并通过项目自带的确定性导出器生成 3D 克拉尼粒子 MP4」；`agents/openai.yaml` 的默认提示：「create a 6-second 16:9 Cosmic Web MP4」。
- 照 SKILL.md 的 Quick Start，全默认（cosmic、1280×720、30fps、6 秒、15% 粒子、precess 旋转、种子 20260710）：
  `python3 .claude/skills/3d-chladni-render/scripts/render_3d_chladni.py --workspace <trial>/ext --output <trial>/out/3d-chladni-cosmic.mp4`
  脚本流程：检查仓库是否干净 → fetch/pull → 没有 Electron 就 `npm ci` → `npm run export:video -- ...` → ffprobe 校验 → 打印 `VALIDATION=PASS`。
- 额外两项：同参数再渲一次比对确定性；用 ffmpeg 合成一段 6 秒的测试节拍音（110Hz 每秒一下 + 3–4.5 秒加一个 440Hz），走 `--style dcosmic --audio` 看音频驱动。**全程没有播放声音**，只用 ffprobe/ffmpeg 分析。
- 安装前检查：`package.json` 只有 devDependencies（electron、electron-builder），没有自定义 install 钩子；Electron 自己的 postinstall 会下载二进制。仓库里还有装 macOS 屏保、锁屏启动器的脚本（`install:screensaver:mac`、`install:lock:mac`，会写 `/Applications` 或 `~/Library`），技能不调用，没跑。导出器开的是隐藏的离屏窗口（`show:false, offscreen:true`），页面里的音频播放都要用户点按钮才触发，导出时不会出声。

## 跑通了吗

改了环境才通。

- 第一次：`npm ci` 成功，但导出器崩溃 `TypeError: Cannot read properties of undefined (reading 'commandLine')`（`out/run-fail-electron-run-as-node.log`）。原因是**这个会话的环境变量里有 `ELECTRON_RUN_AS_NODE=1`**（VS Code 扩展宿主带进来的），Electron 被当成普通 Node 跑，`require('electron').app` 是空的。不是技能的 bug，但**在 VS Code 里用 Claude Code 的人都会撞上**，技能和工程都没提。
- 加 `env -u ELECTRON_RUN_AS_NODE` 重跑：12 秒完成，`VALIDATION=PASS video=h264 size=1280x720 duration=6.000s audio=no`。
- 这个技能用的是 `python3`（不是写死路径），比同组其他几个好；但找技能目录的循环同样找不到项目级安装。

## 耗时和花费

约 8 分钟（含排查 Electron）。首次 `npm ci` 约 15 秒。无 API 花费。

## 成片

- `out/3d-chladni-cosmic.mp4`：h264，1280×720，30fps，6 秒，无音轨。
- `out/audio-chladni.mp4`：音频驱动版（dcosmic + 测试节拍），带 AAC 音轨。
- `out/rerun-check.mp4`：确定性比对用。
- 拼图：`contact.png`（8 帧，0.38s–5.63s）

拼图看到的：黑底上一团米白、浅金色的粒子，组成几片扭曲的薄膜/丝带（宇宙网），带扫光；整体缓慢地进动旋转，形状随角度变化。逐帧差分很平稳，没有跳变。

问题：
- **很暗**：整片平均亮度只有 23/255，粒子只占画面中间约 1/4，大面积纯黑。直接用会显得空和闷，要加亮或加粒子。
- 6 秒不循环（首尾形状不同）。

确定性：两次同参数渲染，逐帧解码后的 MD5 完全一致。**说到做到。**

音频驱动：导出器先用 ffmpeg 逐帧分析音量（日志：energy 0.182..1.043），再驱动画面并把音频混进成片。帧差曲线在节拍处有小幅上升（约每 30 帧一个小峰），但反应很弱，肉眼可能看不出来。测试音只是正弦波，换成真实音乐可能更明显，待用户看。

## 它怎么指挥智能体

这一组里写得最认真的一个：
- 先确定工作区、输出、时长、尺寸、模式；用户没选就用 `cosmic`；要音频驱动时推荐 `sand` 或 `dcosmic`。
- 等脚本打印 `VALIDATION=PASS` 和 `OUTPUT_VIDEO=` 才算完成。这是同组唯一有「完成判据」的，但检查的只是容器：尺寸、时长、有没有音轨，**不看画面**。
- 仓库有本地改动就拒绝更新，要 `--skip-update` 才继续，保护手改。
- 明确说离线导出不涉及麦克风或系统声音采集，「不要那样描述」。
- 附了预览素材的许可：CC BY-NC 4.0。

## 改一处要多久

换模式加音频（见上）9 秒渲完，只改命令行参数。

## 和配音、音效怎么接

这是同组唯一直接吃音频的：`--audio` 传文件，画面按音量逐帧驱动，音频一起混进成片。适合给一段配乐做可视化。

## 好的地方 / 不好的地方

- 好：导出器是项目作者自己写的逐帧离屏渲染，确定、快；脚本参数校验和完成判据都清楚；有许可证（代码 Apache-2.0）。
- 不好：默认画面太暗；音频反应弱；`ELECTRON_RUN_AS_NODE` 的坑没提；媒体素材和预设是 CC BY-NC 4.0（不能商用），自带的 lofi 配乐是 Pixabay 许可。

## 用户评价

待填

## 结论（暂定）

只取某部分。适合当音乐类、氛围类片子的背景或片头。朝カフェ用不上；导出器「离屏窗口逐帧截图 + ffmpeg 管道 + 确定种子」的写法值得参考。
