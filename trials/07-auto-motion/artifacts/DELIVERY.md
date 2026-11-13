最终成片：[final.mp4](../final.mp4)。三个镜头均由 Claude AI 按顺序独立制作，全部成功，未发生失败或重试。

成片规格：1080×1440、30fps CFR、H.264 High、yuv420p、SAR 1:1、BT.709、静音且无音轨。共 332 帧，视频时长 11.066667 秒。

原始字幕覆盖 00:00:00.300–00:00:11.366，跨度为 11.066 秒；分镜时长之和为 11.066 秒，误差为零。30fps 的帧时长量化使最终成片增加约 0.000667 秒。

| 镜头 | 完整字幕时间区间（秒） | 指定时长（秒） | 成片帧数 / 时长（秒） | 镜头 mp4 |
|---|---|---|---|---|
| scene-001：人工配合 vibe coding 制作 | 0.300–4.200 | 3.900 | 117 / 3.900000 | [scene-001.mp4](scene-001/scene-001.mp4) |
| scene-002：AI 集团全自动制作 | 4.200–8.533 | 4.333 | 130 / 4.333333 | [scene-002.mp4](scene-002/scene-002.mp4) |
| scene-003：Codex 指挥协作 | 8.533–11.366 | 2.833 | 85 / 2.833333 | [scene-003.mp4](scene-003/scene-003.mp4) |

每个镜头目录均保留 `.claude/`、完整的 `transcription.srt`、已填写的 `run-claude-ai.sh`、Hyperframes 项目、`STYLE_NOTES.md` 和原始镜头 mp4。模板的非交互式调用、固定交付文件、阶段消息、日志过滤链保持不变。

每个镜头目录中的日志采用以下命名，其中 `<scene>` 为 `scene-001`、`scene-002` 或 `scene-003`：

- `claude-<scene>.stream.jsonl`：完整原始日志。
- `claude-<scene>.stderr.log`：标准错误日志，三个镜头均为空。
- `claude-<scene>.user.log`：模板过滤后的阶段汇报，必需四阶段均已出现。
- `claude-<scene>.exitcode`：三个镜头均为 `0`。

拼接前检测到首段的 H.264 codec extradata 与后两段存在差异，因此将三段统一转码至 [normalized/](normalized/)，再按 [concat-inputs.txt](concat-inputs.txt) 中的顺序以 ffmpeg 拼接。原始镜头 mp4 均保留。

验证通过：三段各自全片解码与关键帧视觉检查、最终成片全片解码、最终成片首尾与两处接缝视觉检查。最终 332 帧逐帧解码哈希均与三个规范化输入顺序连接的帧序列完全一致，未丢帧、增帧或调换镜头。

复核材料：[分镜清单](manifest.json)、[视频规格与验证记录](media-validation.json)、[最终接缝检查图](qa/final-contact.png)、[镜头 1](qa/scene-001-contact.png)、[镜头 2](qa/scene-002-contact.png)、[镜头 3](qa/scene-003-contact.png)。

ffmpeg 日志：`normalize-scene-001.log`、`normalize-scene-002.log`、`normalize-scene-003.log`、[concat-ffmpeg.log](concat-ffmpeg.log)、[final-decode.log](final-decode.log)。

需要重新执行规格检查、统一转码及拼接时，在工作目录运行 `python3 scenes/assemble-final.py`。该命令使用现有镜头 mp4，不会重新调用 Claude。

最终成片 SHA-256：`7385cfb7ff9a516e5005f804e843a3e67cd951f77cbe574c5f44768e3bbc2d13`。
