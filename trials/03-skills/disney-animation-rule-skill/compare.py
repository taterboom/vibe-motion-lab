"""A/B 对比产物：out/AB.mp4（并排带标签）、contact.png（两行各 8 帧）、curves.png（逐帧数值曲线）。
用法：.venv/bin/python compare.py
"""
import json
import subprocess
import tempfile
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
PROJ = HERE / "project"
OUT = PROJ / "out"
FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FRAMES = [0, 8, 16, 24, 32, 40, 48, 56]
FPS = 30
COLOR_A = "#2a78d6"
COLOR_B = "#eb6834"


def font(size):
    return ImageFont.truetype(FONT, size)


def side_by_side():
    overlay = Image.new("RGBA", (2160, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.text((48, 40), "A  不用技能", font=font(60), fill=(40, 40, 40, 255))
    d.text((1080 + 48, 40), "B  照 disney 技能", font=font(60), fill=(40, 40, 40, 255))
    d.rectangle([1078, 0, 1081, 1080], fill=(150, 150, 150, 255))
    with tempfile.TemporaryDirectory() as tmp:
        ov = Path(tmp) / "overlay.png"
        overlay.save(ov)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", OUT / "A.mp4", "-i", OUT / "B.mp4", "-i", ov,
             "-filter_complex", "[0:v][1:v]hstack=inputs=2[s];[s][2:v]overlay=0:0[v]",
             "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", OUT / "AB.mp4"],
            check=True,
        )


def contact_sheet():
    cell, pad, left, top = 300, 6, 90, 60
    W = left + len(FRAMES) * (cell + pad)
    H = top + 2 * (cell + pad)
    sheet = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(sheet)
    with tempfile.TemporaryDirectory() as tmp:
        for row, name in enumerate(["A", "B"]):
            d.text((24, top + row * (cell + pad) + cell // 2 - 30), name, font=font(56), fill=(40, 40, 40))
            for col, f in enumerate(FRAMES):
                png = Path(tmp) / f"{name}_{f}.png"
                subprocess.run(
                    ["ffmpeg", "-v", "error", "-y", "-i", OUT / f"{name}.mp4", "-vf",
                     f"select=eq(n\\,{f})", "-frames:v", "1", png],
                    check=True,
                )
                img = Image.open(png).convert("RGB").resize((cell, cell), Image.LANCZOS)
                sheet.paste(img, (left + col * (cell + pad), top + row * (cell + pad)))
        for col, f in enumerate(FRAMES):
            d.text((left + col * (cell + pad) + 8, 14), f"帧 {f}  ({f / FPS:.2f}s)", font=font(26), fill=(60, 60, 60))
    sheet.save(HERE / "contact.png")


def curves():
    rows = json.loads(
        subprocess.run(["node", "scripts/dump-poses.mjs", "--json"], cwd=PROJ, check=True,
                       capture_output=True, text=True).stdout
    )
    font_manager.fontManager.addfont(FONT)
    plt.rcParams["font.family"] = font_manager.FontProperties(fname=FONT).get_name()
    plt.rcParams["axes.unicode_minus"] = False
    f = [r["f"] for r in rows]
    panels = [
        ("离地高度 px", "aLift", "bLift"),
        ("竖向缩放 scaleY（<1 压扁，>1 拉长）", "aSy", "bSy"),
        ("眼睛相对身体偏移 px（正 = 向下）", "aEye", "bEye"),
    ]
    # B 的阶段边界（帧）
    phases = [("站定", 0, 6), ("预备下蹲", 6, 14), ("蹲住", 14, 17), ("上升", 17, 26),
              ("顶点悬停", 26, 38), ("下落", 38, 45), ("砸地", 45, 49), ("回弹", 49, 60)]
    fig, axes = plt.subplots(3, 1, figsize=(12, 9), sharex=True)
    for ax, (title, ka, kb) in zip(axes, panels):
        for i, (_, s, e) in enumerate(phases):
            if i % 2:
                ax.axvspan(s - 0.5, e - 0.5, color="#f1efe8", lw=0)
        ax.plot(f, [r[ka] for r in rows], color=COLOR_A, lw=2, ls="--", marker="o", ms=3, label="A 不用技能")
        ax.plot(f, [r[kb] for r in rows], color=COLOR_B, lw=2, marker="o", ms=3, label="B 照技能")
        ax.set_title(title, loc="left", fontsize=12, color="#333")
        ax.grid(axis="y", color="#e5e5e5", lw=0.8)
        for s in ("top", "right"):
            ax.spines[s].set_visible(False)
    for name, s, e in phases:
        axes[0].text((s + e) / 2 - 0.5, 372, name, ha="center", va="top", fontsize=9, color="#777")
    axes[0].set_ylim(-15, 380)
    axes[0].legend(loc="upper right", frameon=False, bbox_to_anchor=(1.0, 0.8))
    axes[-1].set_xlabel("帧（30fps，共 60 帧；灰白条 = B 的阶段）")
    fig.tight_layout()
    fig.savefig(HERE / "curves.png", dpi=110)


if __name__ == "__main__":
    side_by_side()
    contact_sheet()
    curves()
    print("ok")
