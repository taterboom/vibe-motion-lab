"""抽帧拼图。用法：
  python contact.py OUT.png --n 8 --cols 4 --tile-h 240 VIDEO [VIDEO ...]
每个视频一行（或按 --cols 换行），等间隔抽 N 帧，标注帧号。只读视频，不播放。
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
         "-show_entries", "stream=nb_read_packets,width,height", "-of", "json", path],
        capture_output=True, text=True, check=True).stdout
    s = json.loads(out)["streams"][0]
    return int(s["nb_read_packets"]), int(s["width"]), int(s["height"])


def grab(path, frame, dst):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-vf",
                    f"select=eq(n\\,{frame})", "-vframes", "1", dst], check=True)
    return Image.open(dst).convert("RGB")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("videos", nargs="+")
    ap.add_argument("--n", type=int, default=6)
    ap.add_argument("--tile-h", type=int, default=240)
    ap.add_argument("--cols", type=int, default=0, help="wrap each video into rows of this many tiles")
    args = ap.parse_args()
    font = ImageFont.truetype("/System/Library/Fonts/Hiragino Sans GB.ttc", 18) \
        if Path("/System/Library/Fonts/Hiragino Sans GB.ttc").exists() else ImageFont.load_default()
    rows = []
    with tempfile.TemporaryDirectory() as tmp:
        for v in args.videos:
            n, w, h = probe(v)
            frames = [round(i * (n - 1) / (args.n - 1)) for i in range(args.n)]
            tw = round(args.tile_h * w / h)
            tiles = []
            for f in frames:
                im = grab(v, f, f"{tmp}/f.png").resize((tw, args.tile_h), Image.LANCZOS)
                d = ImageDraw.Draw(im)
                d.rectangle([0, 0, 90, 24], fill=(0, 0, 0))
                d.text((4, 2), f"f{f}", fill=(255, 255, 0), font=font)
                tiles.append(im)
            step = args.cols or len(tiles)
            for k in range(0, len(tiles), step):
                rows.append((Path(v).stem if k == 0 else "", tiles[k:k + step]))
    gap, label_h = 6, 26
    width = max(sum(t.width for t in ts) + gap * (len(ts) + 1) for _, ts in rows)
    height = sum(label_h + args.tile_h + gap for _ in rows) + gap
    sheet = Image.new("RGB", (width, height), (40, 40, 40))
    d = ImageDraw.Draw(sheet)
    y = gap
    for name, tiles in rows:
        d.text((gap, y + 3), name, fill=(255, 255, 255), font=font)
        y += label_h
        x = gap
        for t in tiles:
            sheet.paste(t, (x, y))
            x += t.width + gap
        y += args.tile_h + gap
    sheet.save(args.out)
    print(args.out, sheet.size)


if __name__ == "__main__":
    main()
