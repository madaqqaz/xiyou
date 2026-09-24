# -*- coding: utf-8 -*-
"""金兜洞·青牛精 25帧下载+抠底+合成5GIF"""
import os, urllib.request
from PIL import Image

BASE = r"D:\xiyou\demo\img\portraits\monsters\qingniujing"
RAW = os.path.join(BASE, "raw")
os.makedirs(RAW, exist_ok=True)

FRAMES = {
    "idle": [
        "https://aka.doubaocdn.com/s/oQcgsAYxSM",
        "https://aka.doubaocdn.com/s/ies4LT92Iy",
        "https://aka.doubaocdn.com/s/SOzTPolFy3",
        "https://aka.doubaocdn.com/s/A2UhvKG8bv",
    ],
    "attack": [
        "https://aka.doubaocdn.com/s/LkVuUc8F4m",
        "https://aka.doubaocdn.com/s/bbARrbiaU2",
        "https://aka.doubaocdn.com/s/eftIzMfcUW",
        "https://aka.doubaocdn.com/s/VnvvITXWfe",
        "https://aka.doubaocdn.com/s/StculV3slg",
        "https://aka.doubaocdn.com/s/XtraLjYdRR",
    ],
    "cast": [
        "https://aka.doubaocdn.com/s/9ymGIMtzB5",
        "https://aka.doubaocdn.com/s/tf7GKQxhmc",
        "https://aka.doubaocdn.com/s/QO7a8BeqPV",
        "https://aka.doubaocdn.com/s/UO99Nab4yL",
        "https://aka.doubaocdn.com/s/B5tezJuY9M",
        "https://aka.doubaocdn.com/s/RDZEC4FLvw",
    ],
    "hit": [
        "https://aka.doubaocdn.com/s/ES3QR85JXi",
        "https://aka.doubaocdn.com/s/VTp3VVqFps",
        "https://aka.doubaocdn.com/s/jYs9sPb3aW",
    ],
    "dead": [
        "https://aka.doubaocdn.com/s/C2l0fnbyHD",
        "https://aka.doubaocdn.com/s/qQuoZ7MU2X",
        "https://aka.doubaocdn.com/s/p6ZoQrSiYy",
        "https://aka.doubaocdn.com/s/B0X3vUtfET",
        "https://aka.doubaocdn.com/s/JRp2zAsXyR",
        "https://aka.doubaocdn.com/s/IUY7p1fEvS",
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
    SIZE = 512
    KEY = (255, 0, 255)
    processed = []
    for im in frames:
        im = im.convert("RGBA")
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.paste(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2), im)
        datas = canvas.getdata()
        new_data = []
        for item in datas:
            if item[3] < 128:
                new_data.append(KEY + (255,))
            else:
                new_data.append(item[:3] + (255,))
        canvas.putdata(new_data)
        processed.append(canvas.convert("RGB"))
    total_w = SIZE * len(processed)
    strip = Image.new("RGB", (total_w, SIZE))
    for i, im in enumerate(processed):
        strip.paste(im, (i * SIZE, 0))
    strip_q = strip.quantize(colors=256, method=Image.MEDIANCUT)
    palette = strip_q.getpalette()
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

print("\n=== 合成GIF ===")
for action, frames in all_frames.items():
    out_path = os.path.join(BASE, f"qingniujing_{action}.gif")
    make_gif(frames, out_path, DURATIONS[action])

print("\n金兜洞·青牛精全部完成！")
