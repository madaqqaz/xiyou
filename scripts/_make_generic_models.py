# -*- coding: utf-8 -*-
"""通用怪物4基础模型：下载+抠底+合成webp精灵条"""
import os, urllib.request
from PIL import Image

BASE = r"D:\xiyou\demo\img\portraits\foe\generic"
RAW = os.path.join(BASE, "raw")
os.makedirs(RAW, exist_ok=True)

FRAMES = {
    "humanoid": {
        "idle": ["VzrmsfDVQS","1LBQwTdHPT","QVKlz1E6B7","HdLRK2CCsn","3p1DeFXkOh","4B7lOM1v37"],
        "atk":  ["9c1NrU67Ds","J8zFomoAMm","smU1YxbBpI","VfO0z1PHuY","VIVg7417uV","bXURZC7xFh"],
    },
    "beast": {
        "idle": ["jrMNoQZ4em","Uh0hZ5qFEz","oOuGZhj0uV","ewayx4K8yo","UHpzqyUrlE","n0idA1xXSt"],
        "atk":  ["hwFT6rJq35","tbjcUiyqsG","UdurGGCLSy","uyQrhULDbb","0vn6ScKtvY","tB6lwkIUVq"],
    },
    "aquatic": {
        "idle": ["EUANjI0m5s","Xg81Tq82KU","hfYHPNdILN","kG4U4JOcpy","1tM6a4f2vu","uLf2TBehbf"],
        "atk":  ["UUW8cPJcRL","wn1pdQLSVE","DWXGS2SVRD","aEcJV6vLFW","VeUQ2wKh1D","jeaXqp3ABr"],
    },
    "ghost": {
        "idle": ["zsIATJSRcK","V7hauazESz","TJnQ26vBCf","PXSdB3ElhW","T0248dTRk3","UU3UgDxCUb"],
        "atk":  ["HA5DU4paTb","zM6OrRs7VZ","IXSzULTrAL","GnAjkQPI0r","iuSMlvA21I","suA3y4SPiu"],
    },
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

def make_strip(frames, out_path, frame_size=512):
    """合成横向webp精灵条"""
    processed = []
    for im in frames:
        im = im.convert("RGBA")
        im.thumbnail((frame_size, frame_size), Image.LANCZOS)
        canvas = Image.new("RGBA", (frame_size, frame_size), (0, 0, 0, 0))
        canvas.paste(im, ((frame_size - im.width) // 2, (frame_size - im.height) // 2), im)
        processed.append(canvas)
    total_w = frame_size * len(processed)
    strip = Image.new("RGBA", (total_w, frame_size), (0, 0, 0, 0))
    for i, im in enumerate(processed):
        strip.paste(im, (i * frame_size, 0))
    strip.save(out_path, "WEBP", quality=85, method=6)
    print(f"  -> {os.path.basename(out_path)}: {len(processed)}帧, {os.path.getsize(out_path)//1024}KB, {total_w}x{frame_size}")

print("=== 下载+抠底 ===")
for model, actions in FRAMES.items():
    model_dir = os.path.join(BASE, model)
    os.makedirs(model_dir, exist_ok=True)
    for action, tokens in actions.items():
        frames = []
        for i, token in enumerate(tokens):
            name = f"{model}_{action}_{i+1:02d}"
            raw_path = os.path.join(RAW, f"{name}.png")
            if not os.path.exists(raw_path):
                download(token, raw_path)
            im = Image.open(raw_path)
            im = remove_white_bg(im)
            out_path = os.path.join(model_dir, f"{name}_transparent.png")
            im.save(out_path, "PNG")
            frames.append(im)
        print(f"  {model}/{action}: {len(frames)}帧抠底完成")

print("\n=== 合成webp精灵条 ===")
for model, actions in FRAMES.items():
    model_dir = os.path.join(BASE, model)
    for action, tokens in actions.items():
        frames = []
        for i, token in enumerate(tokens):
            name = f"{model}_{action}_{i+1:02d}"
            out_path = os.path.join(model_dir, f"{name}_transparent.png")
            frames.append(Image.open(out_path))
        strip_path = os.path.join(model_dir, f"{model}_{action}_strip.webp")
        make_strip(frames, strip_path)

print("\n4基础模型全部完成！")
