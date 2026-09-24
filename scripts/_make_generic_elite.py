# -*- coding: utf-8 -*-
"""3种精英装饰：下载+抠底+保存"""
import os, urllib.request
from PIL import Image

BASE = r"D:\xiyou\demo\img\portraits\foe\generic\elite"
os.makedirs(BASE, exist_ok=True)

ELITE = {
    "armor": "HOiAjKhOVG",
    "cloak": "nHEDCiIT2j",
    "aura": "ZU9VPVsoiw",
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
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    im.putdata(new_data)
    return im

print("=== 下载+抠底精英装饰 ===")
for name, token in ELITE.items():
    raw_path = os.path.join(BASE, f"{name}_raw.png")
    if not os.path.exists(raw_path):
        download(token, raw_path)
    im = Image.open(raw_path)
    im = remove_white_bg(im)
    im.thumbnail((512, 512), Image.LANCZOS)
    out_path = os.path.join(BASE, f"elite_{name}.png")
    im.save(out_path, "PNG")
    print(f"  {name}: {im.size}, {os.path.getsize(out_path)//1024}KB")

print("\n3种精英装饰全部完成！")
