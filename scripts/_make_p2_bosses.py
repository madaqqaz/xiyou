# -*- coding: utf-8 -*-
"""通用Boss精灵条合成：从URL列表下载+抠底+合成webp"""
import os, urllib.request, sys
from PIL import Image

DST = r"D:\xiyou\demo\img\portraits\foe"

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

def make_strip(name, idle_urls, atk_urls, target_h=512):
    tmp = os.path.join(DST, f"_{name}_frames")
    os.makedirs(tmp, exist_ok=True)
    for prefix, urls, out_name in [("idle", idle_urls, f"{name}_combat_idle_strip.webp"),
                                     ("atk", atk_urls, f"{name}_combat_atk_strip.webp")]:
        frames = []
        for i, url in enumerate(urls):
            raw_path = os.path.join(tmp, f"{prefix}_{i+1:02d}_raw.png")
            if not os.path.exists(raw_path):
                try: download(url, raw_path)
                except: continue
            im = remove_bg(Image.open(raw_path))
            w = int(im.width * target_h / im.height)
            im = im.resize((w, target_h), Image.LANCZOS)
            frames.append(im)
        if not frames: continue
        total_w = sum(im.width for im in frames)
        strip = Image.new("RGBA", (total_w, target_h), (0, 0, 0, 0))
        x = 0
        for im in frames:
            strip.paste(im, (x, 0), im); x += im.width
        out_path = os.path.join(DST, out_name)
        strip.save(out_path, "WEBP", quality=85, method=6)
        print(f"  {out_name}: {len(frames)}帧, {os.path.getsize(out_path)//1024}KB")

# 大鹏金翅雕
print("=== 大鹏金翅雕 ===")
dapeng_idle = ["https://aka.doubaocdn.com/s/Lag7DJ2fLu","https://aka.doubaocdn.com/s/ES9aUQYzZI",
    "https://aka.doubaocdn.com/s/t97PwfOIDu","https://aka.doubaocdn.com/s/AynqZ3u2p9",
    "https://aka.doubaocdn.com/s/Mq4eQiZk5b","https://aka.doubaocdn.com/s/Lag7DJ2fLu"]
dapeng_atk = ["https://aka.doubaocdn.com/s/WEv7t2zYvr","https://aka.doubaocdn.com/s/7CUx6s6JqK",
    "https://aka.doubaocdn.com/s/N9QPuHN60c","https://aka.doubaocdn.com/s/fnAeSbVsq7",
    "https://aka.doubaocdn.com/s/2Ca7fwU0bF","https://aka.doubaocdn.com/s/Lag7DJ2fLu"]
make_strip("dapeng", dapeng_idle, dapeng_atk)

print("完成！")
