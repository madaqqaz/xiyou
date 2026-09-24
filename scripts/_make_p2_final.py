# -*- coding: utf-8 -*-
"""P2最终批量合成：金鱼精/蝎子精/九头虫/黄狮精/玉兔/无字碑/老鼋"""
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

def make_strip(name, base_url, atk_urls, target_h=512):
    tmp = os.path.join(DST, f"_{name}_frames")
    os.makedirs(tmp, exist_ok=True)
    idle_urls = [base_url] * 6
    all_atk = atk_urls + [base_url] * (6 - len(atk_urls))
    for prefix, urls, out_name in [("idle", idle_urls, f"{name}_combat_idle_strip.webp"),
                                     ("atk", all_atk, f"{name}_combat_atk_strip.webp")]:
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

bosses = [
    ("jinyujing", "https://aka.doubaocdn.com/s/7MQu9IdSns", ["https://aka.doubaocdn.com/s/y2s0AZOJOM","https://aka.doubaocdn.com/s/0aCJtVzxCz"]),
    ("xiezijing", "https://aka.doubaocdn.com/s/sC2SYSh90V", ["https://aka.doubaocdn.com/s/V9jGyGecBi","https://aka.doubaocdn.com/s/NiSEENbVHR"]),
    ("jiutouchong", "https://aka.doubaocdn.com/s/9iqAOy4kNU", ["https://aka.doubaocdn.com/s/UVq4626nwH","https://aka.doubaocdn.com/s/RqW1EvhSQ1"]),
    ("huangshijing", "https://aka.doubaocdn.com/s/SUU9GFrAdN", ["https://aka.doubaocdn.com/s/AJCVJAVLbW","https://aka.doubaocdn.com/s/UszUrLHKVa"]),
    ("yutu", "https://aka.doubaocdn.com/s/YzOtVSI4AM", ["https://aka.doubaocdn.com/s/cyQK9dKY2v","https://aka.doubaocdn.com/s/xihUJnAlQ2"]),
    ("wuzibei", "https://aka.doubaocdn.com/s/FHOl7heWPj", ["https://aka.doubaocdn.com/s/CI6jrLSGZ7","https://aka.doubaocdn.com/s/7mUgrgL8qQ"]),
    ("laoyuan", "https://aka.doubaocdn.com/s/Ya8gzS0IBn", ["https://aka.doubaocdn.com/s/0lnNqZHHUP","https://aka.doubaocdn.com/s/EFgJ95jmsw"]),
]

for name, base, atks in bosses:
    print(f"=== {name} ===")
    make_strip(name, base, atks)

print("全部P2 Boss合成完成！")
