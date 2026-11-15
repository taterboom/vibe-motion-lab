# 03 技能 fisheye-motion

日期：2026-11-13
版本：skills 仓库 f558ec4；外部工程 `vibe-motion/fisheye-motion` main **c163ee8**（2026-09-04），2026-11-13 克隆到 `ext/fisheye-motion`。Remotion 4.0.438，pnpm 10.33。

## 做了什么

- 触发原话（README）：「制作屏摄风格的鱼眼畸变效果：桶形畸变 + 摩尔纹 + 暗角，可对任意图片做『推镜聚焦 + 黄色标注滑入』的 Remotion 视频」。
- 照 SKILL.md 走路线 B（视频输出），参数全用默认（自带 `public/test.jpg`，聚焦到「浙大」二字）：
  - `cd vibe-motion-app && pnpm install`
  - `pnpm run remotion:render`（默认透明 ProRes 4444）
  - `REMOTION_OUTPUT=out/fisheye.mp4 REMOTION_CODEC=h264 REMOTION_PIXEL_FORMAT=yuv420p pnpm run remotion:render`
- 没开 `pnpm run dev`（Studio 默认 3000 端口，被占）；路线 A 的 Vite 交互页也没开，渲染不需要。
- 安装前检查：`vibe-motion-app` 的 postinstall 是 `scripts/remotion-ensure-browser.mjs`，和 create-vibe-motion 脚手架同一套，把 Chrome Headless Shell 拷进 `~/Library/Caches/com.zjucat.create-vive-motion/`。没有别的异常。根目录 Vite 应用没有安装钩子。

## 跑通了吗

一次通过。安装 6 秒，ProRes 渲染 7 秒，mp4 4 秒（pnpm 仓库和浏览器缓存已经是热的）。脚手架 1.1 里坏掉的渲染脚本（`.jsx` 导入）在这个仓库里已经修了（改成 `composition-id.js`），h264 也会自动不传 ProRes 参数。

## 耗时和花费

约 6 分钟（含读代码）。无 API 花费。

## 成片

- `out/Motion30fps-transparent.mov`（ProRes 4444，1080×1102，2 秒，60 帧）
- `out/fisheye.mp4`（h264，同尺寸）
- `out/sonoma.mp4`（小改动实测，见下）
- 拼图：`contact.png`（6 帧，0.17s–1.88s）

拼图看到的：一张手机短信截图（作者自带的演示图，含他人短信内容，拼图不入库），整屏是桶形畸变，细横纹的摩尔纹明显，四角暗。0–1 秒聚焦点从画面中心平移到「浙大」，画面跟着弯；1–1.8 秒黄色方块从左往右盖住「浙大」两个字，`screen` 混合下白字变成黄底亮字。最后 0.2 秒静止。

问题：
- 「透明」ProRes 其实整帧不透明（alpha 全满），因为底图铺满画面。透明输出对它没意义。
- 默认素材是作者真实的短信截图，带发件号码和日期，不能直接拿来外用。
- 片子只有 2 秒，只演示一个动作。

## 它怎么指挥智能体

- 技能本身不带代码，第一步永远是 clone；然后改 `motion/config.js` 的参数再渲染。
- 定位目标区域：「用多模态视觉读源图，估计目标区域的 0..1 归一化坐标」，然后「渲染一帧检查……不准就微调坐标重来。畸变会弯曲画面，最终以渲染结果为准。」
- 但「注意事项」又写：**「视觉效果非必要不跑自动化验证，渲染后目测（或发关键帧给用户确认）。」** 工程里 `vibe-motion-app/AGENTS.md` 原话：**「视觉效果非必要不跑自动化验证，写完代码让用户目测。」** 两处说法有点打架：定位时让智能体自己渲一帧看，整体效果交给用户看。
- 另有一条硬约束：Remotion 乱序渲染，动画量必须每帧独立计算，不要引入跨帧状态。
- 没有关卡、没有自查脚本。

## 改一处要多久

把底图换成 `inputs/sonoma-1920.jpg`，聚焦到右侧蓝绿交界处，标注改成 `multiply`。只写了一个 props 文件 `presets/sonoma.json`，用 `REMOTION_PROPS_FILE` 传入，不用改代码；渲染 6 秒，前后约 3 分钟。结果：效果套上去了，但目标在画面右边缘而不是正中，左侧露出源图外的黑边——正是 SKILL.md 说的「要渲一帧看了再调」。聚焦点到画面位置的映射不直观，第一次基本猜不准。

## 和配音、音效怎么接

工程是 create-vibe-motion 同款骨架，可以用同一套音频清单（见 `trials/01-scaffold/TRIAL.md`）。本技能没有提声音。

## 好的地方 / 不好的地方

- 好：开箱即通，很快；效果参数集中在一个 config，props 可以从外部传；shader 写在与框架无关的 `FisheyeRenderer.js` 里，能单独拿走。
- 不好：效果单一（屏摄质感 + 一个高亮），时长 2 秒；坐标定位要试几次；没有许可证文件。

## 用户评价

待填

## 结论（暂定）

只取某部分。「屏摄 + 推镜 + 高亮」适合讲解片里引用截图、聊天记录、新闻标题的镜头。对朝カフェ的对话短片用处不大。
