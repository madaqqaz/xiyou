"""修复GIF透明：统一调色板法"""
from PIL import Image
import os

BASE = r"D:\xiyou\demo\img\portraits\heroes"

def make_gif_with_unified_palette(frames_paths, out_path, duration):
    # 1. 加载所有帧，透明像素→品红色
    frames_rgba = []
    for p in frames_paths:
        if not os.path.exists(p):
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
    
    # 2. 把所有帧拼在一起quantize，得到统一调色板
    w, h = frames_rgba[0].size
    strip = Image.new("RGB", (w, h * len(frames_rgba)))
    for i, fr in enumerate(frames_rgba):
        strip.paste(fr, (0, i * h))
    strip_q = strip.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    unified_palette = strip_q.getpalette()
    
    # 3. 找到品红色在统一调色板中的索引
    trans_idx = 0
    for i in range(256):
        if unified_palette[i*3] == 255 and unified_palette[i*3+1] == 0 and unified_palette[i*3+2] == 255:
            trans_idx = i
            break
    
    # 4. 每帧用统一调色板
    frames_p = []
    for fr in frames_rgba:
        p_im = fr.quantize(palette=strip_q)
        frames_p.append(p_im)
    
    # 5. 保存GIF
    frames_p[0].save(out_path, save_all=True, append_images=frames_p[1:],
                     duration=duration, loop=0, disposal=2, transparency=trans_idx)
    sz = os.path.getsize(out_path) // 1024
    print(f"  -> {os.path.basename(out_path)}: {len(frames_p)}帧, {sz}KB, 透明索引={trans_idx}")

for hero in ["wukong", "bajie"]:
    print(f"=== {hero} ===")
    hdir = os.path.join(BASE, f"{hero}_frames")
    groups = {
        "idle":   (["idle_01_transparent.png","idle_02_transparent.png","idle_03_transparent.png","idle_04_transparent.png"], 500),
        "attack": (["attack_01_transparent.png","attack_02_transparent.png","attack_03_transparent.png","attack_04_transparent.png","attack_05_transparent.png","attack_06_transparent.png"], 150),
        "hit":    (["hit_01_transparent.png","hit_02_transparent.png","hit_03_transparent.png"], 200),
        "dead":   (["dead_01_transparent.png","dead_02_transparent.png","dead_03_transparent.png","dead_04_transparent.png","dead_05_transparent.png","dead_06_transparent.png"], 300),
    }
    for gname, (files, dur) in groups.items():
        paths = [os.path.join(hdir, f) for f in files]
        make_gif_with_unified_palette(paths, os.path.join(hdir, f"{hero}_{gname}.gif"), dur)

print("完成")
