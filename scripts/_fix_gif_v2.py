"""修复GIF透明：固定调色板+品红色透明键"""
from PIL import Image
import os

BASE = r"D:\xiyou\demo\img\portraits\heroes"

def make_fixed_palette():
    """创建256色调色板，索引0=品红(透明键)，其余=灰度渐变"""
    palette = [0] * 768
    palette[0] = 255; palette[1] = 0; palette[2] = 255  # 索引0=品红
    for i in range(1, 256):
        v = int((i - 1) * 255 / 254)
        palette[i*3] = v; palette[i*3+1] = v; palette[i*3+2] = v
    return palette

FIXED_PALETTE = make_fixed_palette()

def make_transparent_gif(frames_paths, out_path, duration):
    imgs = []
    for p in frames_paths:
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert("RGBA")
        # 透明像素→品红色
        datas = im.getdata()
        new_data = []
        for r, g, b, a in datas:
            if a < 128:
                new_data.append((255, 0, 255, 255))
            else:
                new_data.append((r, g, b, a))
        im.putdata(new_data)
        # 用固定调色板转P模式（索引0=品红=透明）
        p_im = Image.new("P", im.size)
        p_im.putpalette(FIXED_PALETTE)
        # 量化到固定调色板
        im_rgb = im.convert("RGB")
        # 用quantize映射到固定调色板
        p_im = im_rgb.quantize(palette=Image.new("P", (1,1)), colors=256)
        # 重新设置固定调色板
        p_im.putpalette(FIXED_PALETTE)
        imgs.append(p_im)
    
    if imgs:
        imgs[0].save(out_path, save_all=True, append_images=imgs[1:],
                     duration=duration, loop=0, disposal=2, transparency=0)
        sz = os.path.getsize(out_path) // 1024
        print(f"  -> {os.path.basename(out_path)}: {len(imgs)}帧, {sz}KB")

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
        make_transparent_gif(paths, os.path.join(hdir, f"{hero}_{gname}.gif"), dur)

print("完成")
