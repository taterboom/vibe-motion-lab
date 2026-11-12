# 02 脚手架 create-vibe-motion-3d

日期：2026-11-13
版本：npm `create-vibe-motion-3d@1.0.0`（仓库 b88aa99），three 0.161，puppeteer-core 24.41，pnpm 10.33

## 做了什么

- `npm create vibe-motion-3d@latest trials/02-scaffold-3d`
- `pnpm dev` 启动导出服务（http://127.0.0.1:4173）
- `POST /export/sequence {"startFrame":0,"endFrame":89}` 导出整段 zip，解压到 `frames/`，ffmpeg 拼成 mp4
- `POST /export/frame {"frame":45}` 连导两次，和序列里的第 45 帧比对

## 跑通了吗

一次通过。安装 9 秒，走的是 `registry.npmmirror.com`，没有问题。导出 90 帧（2048×1152）用了 16 秒。

## 耗时和花费

约 5 分钟。没有 API 花费。

## 成片

- `out/scene3d.mp4`：90 帧拼成的 3 秒视频
- `out/contact.png`：抽帧拼图
- `frames/`：PNG 序列（不入库）

画面：黑底，一个发光的青色三维结绕着「vibe motion 3d」文字面板转，周围飘着彩色小方块，有景深感。

## 结构

- 不是 Remotion，是纯 Three.js 网页（`index.html` + `index.js`），加一个 Node 服务（`scripts/export-api.mjs`）用 puppeteer 打开页面、逐帧 `setFrame` 后截图
- 页面对外暴露 `window.__SCENE_3D_EXPORT__`：`isReady / getCurrentFrame / getTotalFrames / getSize / setFrame`
- 帧率和总帧数是 `index.js` 顶部的常量（30fps，90 帧）
- 没有带 AGENTS.md

## 验证

- 确定性：同一帧导三次（两次单帧、一次序列里），md5 完全一样。「每帧由帧号算出」这条成立。
- 输出是 RGB，**没有透明通道**。要叠到别的画面上得自己改。
- 没有音频的概念，出的是图片序列，配音要在后面另外合。

## 改一处要多久

（待测）

## 用户评价

（待用户看 `out/scene3d.mp4` 后填）

## 好的地方 / 不好的地方

- 好：开箱即用，导出接口简单，确定性好；适合做三维的标题、标志、过场，导成序列交给 Remotion 或剪辑软件。
- 不好：和 1.1 是两套东西，不能在同一个工程里混用；不出透明；没有声音；参数要改源码常量。

## 结论（暂定）

只取部分：需要真三维镜头（标志、片头）时单独用它出序列，再拿去合成。朝カフェ的对话短片用不上；飛雷神宣传片的片头可能用得上。
