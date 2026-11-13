# 03 技能 colorize（黑白→彩色上色转场）

日期：2026-11-13
版本：vibe-motion/skills f558ec4（`.claude/skills/colorize/`）。Python 3.12.12（uv venv），numpy 2.5.4、moderngl 5.13.0、glcontext 3.1.0、Pillow 13.0.0；ffmpeg 8.1。

## 做了什么

- 触发原话（取自 `agents/openai.yaml` 的默认提示）：「Use $colorize to turn my photo into a 2-second black-and-white to color reveal MP4.」本次没有真的走 Skill 工具，是照 SKILL.md 的流程一步步做。
- `uv venv` + `uv pip install -r .claude/skills/colorize/scripts/requirements.txt`（SKILL.md 原文是 `python3 -m pip install`，按本实验规矩改用 venv；本机 Homebrew Python 3.14 直接 pip 也会被 PEP 668 拦）。
- 默认参数：`colorize.py inputs/sonoma-1920.jpg -o out/sonoma_colorize.mp4`
- 另跑两条常用命令：竖屏 `--size 1080x1920 --hold 0.5 --set angle=0.09`；两张缩略图拼一条 `big-sur-road.jpg catalina-sunset.jpg --hold 0.5`。

## 跑通了吗

一次通过，没改东西。依赖装好用了 1 秒（moderngl 有现成的 wheel，不用从源码编）。三条命令都打出 `VALIDATION=PASS` 和 `OUTPUT_VIDEO=`。

小问题：SKILL.md 的 Quick Start 只去 `~/.agents`、`~/.claude`、`~/.codex` 下找技能目录。装在项目里的 `.claude/skills/` 找不到，会报 not found 退出。文里也写了「已知目录就直接用」，所以不算卡住。

## 耗时和花费

总共约 8 分钟，大部分时间在读文档、看图。渲染很快：1920² 两秒片 2.6 秒，竖屏 1 秒，两张小图 0.4 秒。没有 API 花费。

## 成片

- `out/sonoma_colorize.mp4`：1920×1920，30fps，2 秒，60 帧（默认）
- `out/sonoma_vertical_strong.mp4`：1080×1920，2.5 秒，旋焦加强
- `out/reel_small.mp4`：356×356，5 秒，两段拼接
- 抽帧拼图：`contact.png`（默认那条，8 帧）

拼图里看到的：开头整幅是灰度加旋转模糊，从第 17 帧前后左下角先出现绿色，彩色从左往右、略带斜向扫过去，到第 51 帧右上角的天空还是灰的，最后一帧全彩，带一层柔光，比原图软。Sonoma 壁纸本身就是糊的抽象图，看不太出旋焦；换成 big-sur-road 那种有路和山的照片，开头的旋转模糊和最后的回正就很清楚。

逐帧差分很平滑，没有跳帧，也没有空白帧。**不好的地方**：默认 `--hold 0` 时画面在最后一帧还在动（帧差还有 0.5），片子戛然而止；加 `--hold` 后，第 59 到 60 帧运动从 0.5 一下降到 0，等于没有缓停，是一个「急刹」。多段拼接时段与段之间是硬切，前一段刚变彩色，下一段直接从黑白开始。

## 用户评价

（待填）

## 改一处要多久

`--set angle=0.09`（加强旋焦）加 `--size 1080x1920` 换竖屏：改命令重跑，1 秒出片。参数都在命令行上，不用改代码。

## 和配音、音效怎么接

视频素材自带的声音会保留。只要有一段带声音，图片段就补静音轨，拼起来不会错位。它不管配乐和音效，要在别处另配。

## 它怎么指挥智能体

流程只有 6 步：收素材、装依赖、跑脚本、等 `VALIDATION=PASS`、**可选**抽几帧看效果、回报路径和参数。这个 `VALIDATION` 只用 ffprobe 查尺寸、时长和音轨，不看画面。没有关卡，也没有检查清单。参数表写得很清楚，标明了默认值是对着剪映的效果拟合出来的。

## 好的地方 / 不好的地方

- 好：开箱即用，快，参数文档清楚；支持实况照片、动态照片和视频；能出竖屏。
- 不好：效果是固定的一种；结尾没有缓停；多段之间是硬切；依赖 OpenGL 3.3，无头 Linux 要靠 EGL。

## 结论

只取这一个效果用。适合宣传片或回忆类片子里「老照片变彩色」这种一次性转场。和朝カフェ的对话短片关系不大。
