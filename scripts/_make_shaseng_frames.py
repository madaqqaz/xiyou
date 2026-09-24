"""沙僧战斗帧：下载+抠底+合成GIF（统一调色板法）"""
import os
import urllib.request
from PIL import Image

BASE = r"D:\xiyou\demo\img\portraits\heroes"
OUT_DIR = os.path.join(BASE, "shaseng_frames")
os.makedirs(OUT_DIR, exist_ok=True)

frames = {
    "idle_01": "https://aka.doubaocdn.com/s/49VBdEqeZY",
    "idle_02": "https://aka.doubaocdn.com/s/sj7cg1eOG1",
    "idle_03": "https://aka.doubaocdn.com/s/cOrySHId7W",
    "idle_04": "https://aka.doubaocdn.com/s/DeYBLwG5pf",
    "attack_01": "https://aka.doubaocdn.com/s/jasn66C4F8",
    "attack_02": "https://aka.doubaocdn.com/s/y6QLOidU7N",
    "attack_03": "https://aka.doubaocdn.com/s/t4w45755lA",
    "attack_04": "https://aka.doubaocdn.com/s/Tys0b35Xnh",
    "attack_05": "https://aka.doubaocdn.com/s/Ry6MBKUGZw",
    "attack_06": "https://aka.doubaocdn.com/s/ge7xH65Yws",
    "hit_01": "https://aka.doubaocdn.com/s/d4GN89em8r",
    "hit_02": "https://aka.doubaocdn.com/s/izbSNvtkBL",
    "hit_03": "https://aka.doubaocdn.com/s/21pwC63wOk",
    "dead_01": "https://aka.doubaocdn.com/s/XxSClFBsYb",
    "dead_02": "https://aka.doubaocdn.com/s/KifKxuEUe0",
    "dead_03": "https://aka.doubaocdn.com/s/Pi17v8g9xV",
    "dead_04": "https://aka.doubaocdn.com/s/r7RfUGPSjU",
    "dead_05": "https://aka.doubaocdn.com/s/QTczN60aVg",
    "dead_06": "https://aka.doubaocdn.com/s/bN1Te3sOga",
}

# 1. 下载
print("=== 下载 ===")
for fname, url in frames.items():
    out = os.path.join(OUT_DIR, f"{fname}.png")
    if os.path.exists(out) and os.path.getsize(out) > 10000:
        continue
    try:
        urllib.request.urlretrieve(url, out)
    except Exception as e:
        print(f"  失败: {fname} - {e}")
print(f"  完成: {len([f for f in os.listdir(OUT_DIR) if f.endswith('.png') and '_transparent' not in f])} 文件")

# 2. 抠白底
print("=== 抠白底 ===")
for f in os.listdir(OUT_DIR):
    if f.endswith(".png") and "_transparent" not in f:
        p = os.path.join(OUT_DIR, f)
        im = Image.open(p).convert("RGBA")
        datas = im.getdata()
        new_data = []
        for r, g, b, a in datas:
            if r > 230 and g > 230 and b > 230:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append((r, g, b, a))
        im.putdata(new_data)
        # 缩放到512
        TARGET = (512, 512)
        im.thumbnail(TARGET, Image.LANCZOS)
        canvas = Image.new("RGBA", TARGET, (0,0,0,0))
        pos = ((TARGET[0]-im.width)//2, (TARGET[1]-im.height)//2)
        canvas.paste(im, pos, im)
        out_p = os.path.join(OUT_DIR, f.replace(".png", "_transparent.png"))
        canvas.save(out_p, "PNG")

# 3. 统一调色板合成GIF
print("=== 合成GIF ===")
def make_gif(frames_paths, out_path, duration):
    frames_rgba = []
    for p in frames_paths:
        if not os.path.exists(p):
            print(f"  缺: {p}")
            continue
        im = Image.open(p).convert("RGBA")
        datas = im.getdata()
        new_data = []
        for r, g, b, a in datas:
            if a < 128:
                new_data.append((255, 0, 255, 255))
            else:
                new_data.append((r, g, b, a))
        im.putdata(new_data)
        frames_rgba.append(im.convert("RGB"))
    
    if not frames_rgba:
        return
    
    w, h = frames_rgba[0].size
    strip = Image.new("RGB", (w, h * len(frames_rgba)))
    for i, fr in enumerate(frames_rgba):
        strip.paste(fr, (0, i * h))
    strip_q = strip.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    unified_palette = strip_q.getpalette()
    
    trans_idx = 0
    for i in range(256):
        if unified_palette[i*3] == 255 and unified_palette[i*3+1] == 0 and unified_palette[i*3+2] == 255:
            trans_idx = i
            break
    
    frames_p = []
    for fr in frames_rgba:
        p_im = fr.quantize(palette=strip_q)
        frames_p.append(p_im)
    
    frames_p[0].save(out_path, save_all=True, append_images=frames_p[1:],
                     duration=duration, loop=0, disposal=2, transparency=trans_idx)
    sz = os.path.getsize(out_path) // 1024
    print(f"  -> {os.path.basename(out_path)}: {len(frames_p)}帧, {sz}KB")

groups = {
    "idle":   (["idle_01_transparent.png","idle_02_transparent.png","idle_03_transparent.png","idle_04_transparent.png"], 500),
    "attack": (["attack_01_transparent.png","attack_02_transparent.png","attack_03_transparent.png","attack_04_transparent.png","attack_05_transparent.png","attack_06_transparent.png"], 150),
    "hit":    (["hit_01_transparent.png","hit_02_transparent.png","hit_03_transparent.png"], 200),
    "dead":   (["dead_01_transparent.png","dead_02_transparent.png","dead_03_transparent.png","dead_04_transparent.png","dead_05_transparent.png","dead_06_transparent.png"], 300),
}
for gname, (files, dur) in groups.items():
    paths = [os.path.join(OUT_DIR, f) for f in files]
    make_gif(paths, os.path.join(OUT_DIR, f"shaseng_{gname}.gif"), dur)

print("完成")
