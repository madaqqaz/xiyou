# -*- coding: utf-8 -*-
"""刘洪：下载+抠底+合成webp精灵条"""
import os, urllib.request
from PIL import Image

DST = r"D:\xiyou\demo\img\portraits\foe"
TMP = os.path.join(DST, "_liuhong_frames")
os.makedirs(TMP, exist_ok=True)

IDLE_URLS = [
    "https://aka.doubaocdn.com/s/mGJFRtqqLV", "https://aka.doubaocdn.com/s/jXeQewvQop",
    "https://aka.doubaocdn.com/s/aGp6XRPDuG", "https://aka.doubaocdn.com/s/pctzfA68UA",
    "https://aka.doubaocdn.com/s/K9yKs6pfkN", "https://aka.doubaocdn.com/s/OVm7YqV4zC",
]
ATK_URLS = [
    "https://aka.doubaocdn.com/s/HwOw28Znxe", "https://aka.doubaocdn.com/s/0p8i4t8Jpg",
    "https://aka.doubaocdn.com/s/gg5WGl3Mn3", "https://aka.doubaocdn.com/s/V7cQbvbpVS",
    "https://aka.doubaocdn.com/s/S4W1U0CwnX", "https://aka.doubaocdn.com/s/XuFrqJtm2Z",
]

def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        with open(path, "wb") as f: f.write(r.read())

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
        if not os.path.exists(raw_path): download(url, raw_path)
        im = remove_bg(Image.open(raw_path))
        w = int(im.width * target_h / im.height)
        im = im.resize((w, target_h), Image.LANCZOS)
        frames.append(im)
    total_w = sum(im.width for im in frames)
    strip = Image.new("RGBA", (total_w, target_h), (0, 0, 0, 0))
    x = 0
    for im in frames:
        strip.paste(im, (x, 0), im); x += im.width
    out_path = os.path.join(DST, out_name)
    strip.save(out_path, "WEBP", quality=85, method=6)
    print(f"  {out_name}: {len(frames)}帧, {os.path.getsize(out_path)//1024}KB")

print("=== 刘洪精灵条合成 ===")
make_strip(IDLE_URLS, "idle", "liuhong_combat_idle_strip.webp")
make_strip(ATK_URLS, "atk", "liuhong_combat_atk_strip.webp")
print("刘洪完成！")
