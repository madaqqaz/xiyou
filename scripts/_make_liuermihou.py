# -*- coding: utf-8 -*-
"""六耳猕猴：下载+抠底+合成webp精灵条"""
import os, urllib.request
from PIL import Image

DST = r"D:\xiyou\demo\img\portraits\foe"
TMP = os.path.join(DST, "_liuermihou_frames")
os.makedirs(TMP, exist_ok=True)

IDLE_URLS = [
    "https://aka.doubaocdn.com/s/1WEumf7HiZ",  # idle_01 基准帧
    "https://aka.doubaocdn.com/s/m1ruENPMeK",  # idle_02
    "https://aka.doubaocdn.com/s/P9ESlbRwJh",  # idle_03
    "https://aka.doubaocdn.com/s/Gn9zS9aWUm",  # idle_04
    "https://aka.doubaocdn.com/s/QvtKDfELXY",  # idle_05
    "https://aka.doubaocdn.com/s/iK2pHsmIli",  # idle_06
]
ATK_URLS = [
    "https://aka.doubaocdn.com/s/4L9uNVDeXD",  # atk_01
    "https://aka.doubaocdn.com/s/KMbfkWNjVT",  # atk_02
    "https://aka.doubaocdn.com/s/mL60FtCCa6",  # atk_03
    "https://aka.doubaocdn.com/s/kEp9z2Z3L2",  # atk_04
    "https://aka.doubaocdn.com/s/tjmUVjjYUl",  # atk_05
    "https://aka.doubaocdn.com/s/K6eXYlvrzC",  # atk_06
]

def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        with open(path, "wb") as f:
            f.write(r.read())

def remove_bg(im):
    im = im.convert("RGBA")
    datas = im.getdata()
    new_data = []
    for item in datas:
        if item[0] > 235 and item[1] > 235 and item[2] > 235:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    im.putdata(new_data)
    return im

def make_strip(urls, prefix, out_name, target_h=512):
    frames = []
    for i, url in enumerate(urls):
        raw_path = os.path.join(TMP, f"{prefix}_{i+1:02d}_raw.png")
        if not os.path.exists(raw_path):
            download(url, raw_path)
        im = Image.open(raw_path)
        im = remove_bg(im)
        w = int(im.width * target_h / im.height)
        im = im.resize((w, target_h), Image.LANCZOS)
        frames.append(im)
    total_w = sum(im.width for im in frames)
    strip = Image.new("RGBA", (total_w, target_h), (0, 0, 0, 0))
    x = 0
    for im in frames:
        strip.paste(im, (x, 0), im)
        x += im.width
    out_path = os.path.join(DST, out_name)
    strip.save(out_path, "WEBP", quality=85, method=6)
    print(f"  {out_name}: {len(frames)}帧, {total_w}x{target_h}, {os.path.getsize(out_path)//1024}KB")

print("=== 六耳猕猴精灵条合成 ===")
make_strip(IDLE_URLS, "idle", "liuermihou_combat_idle_strip.webp")
make_strip(ATK_URLS, "atk", "liuermihou_combat_atk_strip.webp")
print("六耳猕猴完成！")
