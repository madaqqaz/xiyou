# -*- coding: utf-8 -*-
"""P2 Boss批量合成：九灵元圣、传经吏、虎力大仙"""
import os, urllib.request
from PIL import Image

DST = r"D:\xiyou\demo\img\portraits\foe"

def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        with open(path, "wb") as f: f.write(r.read())

def remove_bg(im):
    im = im.convert("RGBA")
    datas = im.getdata()
    new_data = [(255,255,255,0) if (item[0]>235 and item[1]>235 and item[2]>235) else item for item in datas]
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
        for im in frames: strip.paste(im, (x, 0), im); x += im.width
        out_path = os.path.join(DST, out_name)
        strip.save(out_path, "WEBP", quality=85, method=6)
        print(f"  {out_name}: {len(frames)}帧, {os.path.getsize(out_path)//1024}KB")

# 九灵元圣
print("=== 九灵元圣 ===")
jiu_idle = ["https://aka.doubaocdn.com/s/rWnc8cHyJI","https://aka.doubaocdn.com/s/mpOxSLnAFV",
    "https://aka.doubaocdn.com/s/drNA9Pj2j9","https://aka.doubaocdn.com/s/CoYnyUVmrt",
    "https://aka.doubaocdn.com/s/rWnc8cHyJI","https://aka.doubaocdn.com/s/rWnc8cHyJI"]
jiu_atk = ["https://aka.doubaocdn.com/s/SDvROfDFSr","https://aka.doubaocdn.com/s/acywGnfVMg",
    "https://aka.doubaocdn.com/s/jQVA7FT9z5","https://aka.doubaocdn.com/s/rWnc8cHyJI",
    "https://aka.doubaocdn.com/s/rWnc8cHyJI","https://aka.doubaocdn.com/s/rWnc8cHyJI"]
make_strip("jiulingyuansheng", jiu_idle, jiu_atk)

# 传经吏
print("=== 传经吏 ===")
chuan_idle = ["https://aka.doubaocdn.com/s/jDxm66bi5d","https://aka.doubaocdn.com/s/4QCVyq3USH",
    "https://aka.doubaocdn.com/s/AhOpzz6ve9","https://aka.doubaocdn.com/s/jDxm66bi5d",
    "https://aka.doubaocdn.com/s/jDxm66bi5d","https://aka.doubaocdn.com/s/jDxm66bi5d"]
chuan_atk = ["https://aka.doubaocdn.com/s/tOEuT0RVFw","https://aka.doubaocdn.com/s/U2hd3U6yEB",
    "https://aka.doubaocdn.com/s/jDxm66bi5d","https://aka.doubaocdn.com/s/jDxm66bi5d",
    "https://aka.doubaocdn.com/s/jDxm66bi5d","https://aka.doubaocdn.com/s/jDxm66bi5d"]
make_strip("chuanjingli", chuan_idle, chuan_atk)

# 虎力大仙（车迟三妖）
print("=== 虎力大仙 ===")
hu_idle = ["https://aka.doubaocdn.com/s/Qd2u3dD8bb","https://aka.doubaocdn.com/s/ROjJ2feAYU",
    "https://aka.doubaocdn.com/s/8ivqo86rHE","https://aka.doubaocdn.com/s/Qd2u3dD8bb",
    "https://aka.doubaocdn.com/s/Qd2u3dD8bb","https://aka.doubaocdn.com/s/Qd2u3dD8bb"]
hu_atk = ["https://aka.doubaocdn.com/s/GUGFqYtO1F","https://aka.doubaocdn.com/s/qVMdcdvKvp",
    "https://aka.doubaocdn.com/s/MOUZBNj11i","https://aka.doubaocdn.com/s/8J0ra4J2CR",
    "https://aka.doubaocdn.com/s/Qd2u3dD8bb","https://aka.doubaocdn.com/s/Qd2u3dD8bb"]
make_strip("huli", hu_idle, hu_atk)

print("全部完成！")
