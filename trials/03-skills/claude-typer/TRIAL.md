# 03 技能 claude-typer

日期：2026-11-13
版本：skills 仓库 f558ec4（`claude-typer/` 自 2026-03-30 的 35bf2d1 起没改过）。没有可克隆的工程：技能直接渲染作者网站 `https://www.laosunwendao.com` 上的远程 Remotion 合成 `Typer30fps`。`ext/` 是空的。

## 做了什么

- 触发原话（README）：「把提示词文本转换为 Claude Code CLI 风格的打字动画演示」；`agents/openai.yaml` 默认提示「做一个 claude 的提示词打字机动画」。
- 要打的字用无关紧要的 `Hello from vibe-motion-lab`。
- 先 `--dry-run` 看命令，再在 `out/` 里正式跑：
  `python3 .claude/skills/claude-typer/scripts/render_claude_typer.py "Hello from vibe-motion-lab"`
- 脚本按顺序试两个运行器：先 `bunx @remotion/cli`（**不锁版本，拉的是最新版**，装在系统临时目录），失败再试 `npx -y -p @remotion/cli@4.0.440 -p @remotion/tailwind-v4@4.0.440 remotion`（装在 `~/.npm/_npx`）。浏览器自动用了本机的 **Google Chrome 正式版**（`/Applications/Google Chrome.app`，无头模式、临时配置目录）。

## 发了什么、发到哪

- 渲染命令：`remotion render https://www.laosunwendao.com Typer30fps <out>.mov --props={"prompt":"Hello from vibe-motion-lab","typingSpeedMs":30,"model":"MiniMax-M2.7","videoWidth":1080,"videoHeight":1080,"claudeWidth":880,...}`
- 本机无头 Chrome 打开了 `https://www.laosunwendao.com/index.html` 和它引用的 JS/CSS（两次，每个运行器一次）。
- 文字作为 Remotion 的 inputProps 注入到这个页面的 JS 环境里，不在请求 URL 里；但远程页面的脚本能读到它，想发回服务器也做得到。这次页面是作者的官网首页，没有证据表明它读了这些 props。
- 另外为做参考拼图，下载了 README 里的预览 GIF（`img.laosunwendao.com/skill-uploads/3dbc...gif`），没有带任何我们的数据。

## 跑通了吗

**没通过**，24 秒后两个运行器都失败：

```
Tried to go to https://www.laosunwendao.com/index.html and verify that it is a Remotion project
by checking if window.getStaticCompositions is defined. However, the function was undefined ...
<h1 class="logo"><a href="#headerbg">老孙问道官网</a></h1> ...
```

这个域名现在放的是作者的官网（Vite 单页应用，「老孙问道，您的 AI 编程引路人」），Remotion 包已经不在根路径了。技能写死了这个地址，**技能从此不能用**，本地也没有可替代的源码。没有往下猜别的路径。

顺带：这个域名的 IPv6 地址在本机返回的证书链不完整（curl 报 `unable to get local issuer certificate`），IPv4 正常；Chrome 能打开，不影响结论。

其他开箱问题（同组共有）：`/usr/local/bin/python3` 写死；技能目录只在 `~/.agents`、`~/.claude`、`~/.codex` 下找。

## 耗时和花费

约 6 分钟（含排查），无 API 花费。

## 成片

无。

- `contact.png` 是**作者 README 预览 GIF 的抽帧（`out/upstream-preview.gif`，692×410，2.47 秒），不是这次的产物**，只用来说明它本来长什么样：一个仿 Claude Code 终端的黑色窗口，橙色像素小怪物图标，标题「Claude Code」，模型名写的是「MiniMax-M2.7」；提示词逐字打出，中文自动换行；窗口带 3D 倾斜，从右倾慢慢转到左倾。透明背景。
- 注意：画面借用了 Claude Code 的名字和图标样式。

## 它怎么指挥智能体

「从用户话里抽出要打的字 → 跑脚本 → 返回当前目录里的视频路径」。输出文件名按提示词压缩生成（去掉「帮我」「做一个」之类开头）。超时就保持并发 1、加大超时。没有画面检查，也没有说远程站点不可用时怎么办。

## 改一处要多久

不适用。

## 和配音、音效怎么接

不适用。原设计可选 `--audio-codec aac`，但合成本身是否带声音无从验证。

## 好的地方 / 不好的地方

- 好：想法简单直接，参数（倾斜角度、宽度、打字速度）都暴露成 props。
- 不好：依赖作者网站上的闭源远程包，现在已经失效；`bunx` 路径拉最新版 Remotion CLI，不锁版本；用户的文字要交给第三方网页的脚本处理；借用 Claude Code 的品牌。

## 用户评价

待填（只有官方预览可看）

## 结论

不用。远程依赖已经失效，就算恢复，把内容交给远程网页渲染也不适合放进工作流。要这个效果，自己在 Remotion 里写一个打字机组件更稳。
