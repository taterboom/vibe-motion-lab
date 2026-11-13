"""第 6 步的 QC 证据。用法（在 film/ 下）：../.venv/bin/python scripts/qc.py ../out/film.mp4
- 运动窗口：5 个 4–6 秒窗口（相邻重叠 1 秒），每窗 8 帧拼一行
- 全片联系表 qc/contact-sheet.jpg（16 帧）
- 定格：用 remotion still 渲 631 和 659 两帧 PNG，逐像素比；再比成片里解码出的两帧
- 确定性：frame 400 渲两次逐像素比
- ffprobe 技术参数
只读视频，不播放。
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
QC = ROOT / "qc"
VIDEO = Path(sys.argv[1]).resolve()
FPS = 30
WINDOWS = [(0, 150), (120, 300), (270, 450), (420, 600), (570, 660)]


def grab(frame, dst):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(VIDEO), "-vf", f"select=eq(n\\,{frame})",
                    "-vframes", "1", str(dst)], check=True)
    return Image.open(dst).convert("RGB")


def still(frame, dst):
    subprocess.run(["npx", "remotion", "still", "src/index.ts", "FramePipelineExplainer", str(dst),
                    "--frame", str(frame), "--log=error"], cwd=ROOT, check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return Image.open(dst).convert("RGB")


def strip(frames, out, tile_w=480):
    with tempfile.TemporaryDirectory() as tmp:
        ims = [grab(f, Path(tmp) / "f.png").resize((tile_w, tile_w * 9 // 16)) for f in frames]
    th = ims[0].height
    S = Image.new("RGB", (tile_w * len(ims) + 4 * (len(ims) - 1), th), (60, 60, 60))
    for i, (f, im) in enumerate(zip(frames, ims)):
        ImageDraw.Draw(im).text((6, 4), f"f{f}", fill=(255, 255, 0))
        S.paste(im, (i * (tile_w + 4), 0))
    S.save(out)


def diff_count(a, b):
    bbox = ImageChops.difference(a, b).getbbox()
    if bbox is None:
        return 0
    d = ImageChops.difference(a, b).convert("L").point(lambda v: 255 if v else 0)
    return sum(1 for v in d.getdata() if v)


def main():
    (QC / "windows").mkdir(parents=True, exist_ok=True)
    (QC / "stills").mkdir(parents=True, exist_ok=True)
    windows = []
    for a, b in WINDOWS:
        frames = [round(a + i * (b - 1 - a) / 7) for i in range(8)]
        out = QC / "windows" / f"window-{a:03d}-{b:03d}.png"
        strip(frames, out)
        windows.append({"from": a, "to": b, "frames": frames, "sheet": str(out.relative_to(ROOT))})

    frames16 = [round(i * 659 / 15) for i in range(16)]
    with tempfile.TemporaryDirectory() as tmp:
        ims = [grab(f, Path(tmp) / "f.png").resize((480, 270)) for f in frames16]
    sheet = Image.new("RGB", (480 * 4 + 12, 270 * 4 + 12), (60, 60, 60))
    for i, (f, im) in enumerate(zip(frames16, ims)):
        ImageDraw.Draw(im).text((6, 4), f"f{f}", fill=(255, 255, 0))
        sheet.paste(im, ((i % 4) * 484, (i // 4) * 274))
    sheet.save(QC / "contact-sheet.jpg", quality=88)

    a, b = still(631, QC / "stills" / "hold-631.png"), still(659, QC / "stills" / "hold-659.png")
    hold_png = diff_count(a, b)
    with tempfile.TemporaryDirectory() as tmp:
        va, vb = grab(631, Path(tmp) / "a.png"), grab(659, Path(tmp) / "b.png")
        hold_mp4 = diff_count(va, vb)
    d1, d2 = still(400, QC / "stills" / "det-400-a.png"), still(400, QC / "stills" / "det-400-b.png")
    det = diff_count(d1, d2)

    probe = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,pix_fmt:format=duration,size",
         "-of", "json", str(VIDEO)], capture_output=True, text=True, check=True).stdout)
    v = [s for s in probe["streams"] if s["codec_type"] == "video"][0]
    tech = {
        "width": v["width"], "height": v["height"], "fps": v["r_frame_rate"], "frames": int(v["nb_frames"]),
        "codec": v["codec_name"], "pix_fmt": v["pix_fmt"], "duration": float(probe["format"]["duration"]),
        "sizeBytes": int(probe["format"]["size"]),
        "audioStreams": sum(1 for s in probe["streams"] if s["codec_type"] == "audio"),
    }
    tech["pass"] = (tech["width"], tech["height"], tech["fps"], tech["frames"], tech["codec"], tech["audioStreams"]) == \
        (1920, 1080, "30/1", 660, "h264", 0)
    result = {
        "windows": windows,
        "contactSheet": "qc/contact-sheet.jpg",
        "finalHold": {"frameA": 631, "frameB": 659, "pngDifferentPixels": hold_png, "mp4DecodedDifferentPixels": hold_mp4,
                      "identical": hold_png == 0},
        "determinism": {"frame": 400, "renders": 2, "differentPixels": det, "identical": det == 0},
        "technical": tech,
    }
    (QC / "qc-auto.json").write_text(json.dumps(result, indent=2, ensure_ascii=False))
    print(json.dumps({k: result[k] for k in ("finalHold", "determinism", "technical")}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
