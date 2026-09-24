# -*- coding: utf-8 -*-
"""6种施法特效：下载+抠底+保存"""
import os, urllib.request
from PIL import Image

BASE = r"D:\xiyou\demo\img\portraits\foe\generic\fx"
os.makedirs(BASE, exist_ok=True)

# fire有4帧，其他1帧
FX = {
    "fire": ["UUVgLg1yRB", "t64DJs5iBN", "9n2UvUuE6k", "1uwMNEem4O"],
    "wind": ["MPuuyKCsS7"],
    "water": ["VbcEnq9hJW"],
    "poison": ["kAXIsIDVot"],
    "thunder": ["Nat3Wu5WRt"],
    "rock": ["ZaBbUWcKhd"],
}

def download(token, path):
    url = f"https://aka.doubaocdn.com/s/{token}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    with open(path, "wb") as f:
        f.write(data)

def remove_white_bg(im):
    im = im.convert("RGBA")
    datas = im.getdata()
    new_data = []
    for item in datas:
        # 白底/黑底都变透明（特效图可能有黑底）
        if (item[0] > 230 and item[1] > 230 and item[2] > 230) or \
           (item[0] < 25 and item[1] < 25 and item[2] < 25):
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    im.putdata(new_data)
    return im

print("=== 下载+抠底特效 ===")
for name, tokens in FX.items():
    frames = []
    for i, token in enumerate(tokens):
        raw_path = os.path.join(BASE, f"{name}_{i+1:02d}_raw.png")
        if not os.path.exists(raw_path):
            download(token, raw_path)
        im = Image.open(raw_path)
        im = remove_white_bg(im)
        # 缩放到512x256
        im = im.resize((512, 256), Image.LANCZOS)
        out_path = os.path.join(BASE, f"fx_{name}_{i+1:02d}.png")
        im.save(out_path, "PNG")
        frames.append(im)
        print(f"  {name}_{i+1:02d}: {im.size}, {os.path.getsize(out_path)//1024}KB")

    # 如果有多帧，合成webp粒子条
    if len(frames) > 1:
        total_w = 512 * len(frames)
        strip = Image.new("RGBA", (total_w, 256), (0, 0, 0, 0))
        for i, im in enumerate(frames):
            strip.paste(im, (i * 512, 0))
        strip_path = os.path.join(BASE, f"fx_{name}_strip.webp")
        strip.save(strip_path, "WEBP", quality=85, method=6)
        print(f"  -> {name}_strip.webp: {len(frames)}帧, {os.path.getsize(strip_path)//1024}KB")

print("\n6种施法特效全部完成！")
