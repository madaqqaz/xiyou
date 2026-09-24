# -*- coding: utf-8 -*-
"""红孩儿一阶段（孩童）25帧下载+抠底+合成5GIF"""
import os, urllib.request, io
from PIL import Image

BASE = r"D:\xiyou\demo\img\portraits\monsters\honghaier_phase1"
RAW = os.path.join(BASE, "raw")
os.makedirs(RAW, exist_ok=True)

FRAMES = {
    "idle": [
        "https://aka.doubaocdn.com/s/REUU4bAbak",
        "https://aka.doubaocdn.com/s/p3wGuY7iSG",
        "https://aka.doubaocdn.com/s/z5nmgFm8QC",
        "https://aka.doubaocdn.com/s/guMJPhaI9U",
    ],
    "attack": [
        "https://aka.doubaocdn.com/s/DF2sHid6Tk",
        "https://aka.doubaocdn.com/s/ZsUkisQ3hY",
        "https://aka.doubaocdn.com/s/szeZBgaeR2",
        "https://aka.doubaocdn.com/s/3EMMTjx2fr",
        "https://aka.doubaocdn.com/s/PQz2zU4gdW",
        "https://aka.doubaocdn.com/s/v0Q1WTdD1Q",
    ],
    "cast": [
        "https://aka.doubaocdn.com/s/RpR6GTDruw",
        "https://aka.doubaocdn.com/s/ibNuiHlKoU",
        "https://aka.doubaocdn.com/s/xrtRedTdfB",
        "https://aka.doubaocdn.com/s/58ooNDDWaP",
        "https://aka.doubaocdn.com/s/4SjjU73p1Y",
        "https://aka.doubaocdn.com/s/uNfbmSxVvp",
    ],
    "hit": [
        "https://aka.doubaocdn.com/s/Lqpbh2isjh",
        "https://aka.doubaocdn.com/s/lqT2Vw0qw8",
        "https://aka.doubaocdn.com/s/WCLgovYIDm",
    ],
    "dead": [
        "https://aka.doubaocdn.com/s/YrejFY5xPZ",
        "https://aka.doubaocdn.com/s/y7SgBtgDNV",
        "https://aka.doubaocdn.com/s/Ies1mxf6IR",
        "https://aka.doubaocdn.com/s/iLJwYl8TV8",
        "https://aka.doubaocdn.com/s/HAPglKi1iK",
        "https://aka.doubaocdn.com/s/og2Q2lPJGT",
    ],
}

DURATIONS = {"idle": 300, "attack": 150, "cast": 200, "hit": 150, "dead": 400}

def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = r.read()
    with open(path, "wb") as f:
        f.write(data)

def remove_white_bg(im):
    """抠白底：RGB>230的像素→透明"""
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

def make_gif(frames, out_path, duration):
    """统一调色板法合成透明GIF"""
    SIZE = 512
    KEY = (255, 0, 255)  # 品红透明键
    processed = []
    for im in frames:
        im = im.convert("RGBA")
        # 缩放
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2), im)
        # 透明→品红
        datas = canvas.getdata()
        new_data = []
        for item in datas:
            if item[3] < 128:
                new_data.append(KEY + (255,))
            else:
                new_data.append(item[:3] + (255,))
        canvas.putdata(new_data)
        processed.append(canvas.convert("RGB"))
    # 拼接长图quantize
    total_w = SIZE * len(processed)
    strip = Image.new("RGB", (total_w, SIZE))
    for i, im in enumerate(processed):
        strip.paste(im, (i * SIZE, 0))
    strip_q = strip.quantize(colors=256, method=Image.MEDIANCUT)
    palette = strip_q.getpalette()
    # 找品红索引
    key_idx = None
    for i in range(256):
        r, g, b = palette[i*3], palette[i*3+1], palette[i*3+2]
        if r > 240 and g < 30 and b > 240:
            key_idx = i
            break
    frames_out = []
    for i in range(len(processed)):
        crop = strip_q.crop((i * SIZE, 0, (i + 1) * SIZE, SIZE))
        frames_out.append(crop)
    frames_out[0].save(
        out_path, save_all=True, append_images=frames_out[1:],
        duration=duration, loop=0, disposal=2,
        transparency=key_idx if key_idx is not None else 0,
    )
    print(f"  -> {os.path.basename(out_path)}: {len(frames_out)}帧, {os.path.getsize(out_path)//1024}KB")

# 下载+抠底
print("=== 下载+抠底 ===")
all_frames = {}
for action, urls in FRAMES.items():
    all_frames[action] = []
    for i, url in enumerate(urls):
        name = f"{action}_{i+1:02d}"
        raw_path = os.path.join(RAW, f"{name}.png")
        if not os.path.exists(raw_path):
            download(url, raw_path)
            print(f"  下载 {name}")
        im = Image.open(raw_path)
        im = remove_white_bg(im)
        out_path = os.path.join(BASE, f"{name}_transparent.png")
        im.save(out_path, "PNG")
        all_frames[action].append(im)
print("抠底完成")

# 合成GIF
print("\n=== 合成GIF ===")
for action, frames in all_frames.items():
    out_path = os.path.join(BASE, f"honghaier_phase1_{action}.gif")
    make_gif(frames, out_path, DURATIONS[action])

print("\n全部完成！")
