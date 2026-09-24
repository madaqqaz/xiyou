"""修复悟空/八戒GIF透明背景：用品红色作透明色键"""
from PIL import Image
import os

BASE = r"D:\xiyou\demo\img\portraits\heroes"
MAGENTA = (255, 0, 255, 255)  # 透明色键

def make_transparent_gif(frames_paths, out_path, duration):
    imgs = []
    trans_idx = None
    for p in frames_paths:
        if not os.path.exists(p):
            print(f"  缺: {p}")
            continue
        im = Image.open(p).convert("RGBA")
        # 把透明像素替换成品红色
        datas = im.getdata()
        new_data = []
        for r, g, b, a in datas:
            if a < 10:  # 接近透明
                new_data.append(MAGENTA)
            else:
                new_data.append((r, g, b, a))
        im.putdata(new_data)
        # 转P模式（256色，品红色会占据一个索引）
        p_im = im.convert("P", palette=Image.ADAPTIVE, colors=256)
        # 找到品红色对应的索引
        if trans_idx is None:
            palette = p_im.getpalette()
            for i in range(256):
                if palette[i*3] == 255 and palette[i*3+1] == 0 and palette[i*3+2] == 255:
                    trans_idx = i
                    break
        imgs.append(p_im)
    
    if imgs and trans_idx is not None:
        imgs[0].save(out_path, save_all=True, append_images=imgs[1:],
                     duration=duration, loop=0, disposal=2, transparency=trans_idx)
        sz = os.path.getsize(out_path) // 1024
        print(f"  -> {os.path.basename(out_path)}: {len(imgs)}帧, {sz}KB, 透明索引={trans_idx}")

# 修复悟空
print("=== 悟空 ===")
wk_dir = os.path.join(BASE, "wukong_frames")
groups = {
    "idle":   (["idle_01_transparent.png","idle_02_transparent.png","idle_03_transparent.png","idle_04_transparent.png"], 500),
    "attack": (["attack_01_transparent.png","attack_02_transparent.png","attack_03_transparent.png","attack_04_transparent.png","attack_05_transparent.png","attack_06_transparent.png"], 150),
    "hit":    (["hit_01_transparent.png","hit_02_transparent.png","hit_03_transparent.png"], 200),
    "dead":   (["dead_01_transparent.png","dead_02_transparent.png","dead_03_transparent.png","dead_04_transparent.png","dead_05_transparent.png","dead_06_transparent.png"], 300),
}
for gname, (files, dur) in groups.items():
    paths = [os.path.join(wk_dir, f) for f in files]
    make_transparent_gif(paths, os.path.join(wk_dir, f"wukong_{gname}.gif"), dur)

# 修复八戒
print("=== 八戒 ===")
bj_dir = os.path.join(BASE, "bajie_frames")
for gname, (files, dur) in groups.items():
    paths = [os.path.join(bj_dir, f) for f in files]
    make_transparent_gif(paths, os.path.join(bj_dir, f"bajie_{gname}.gif"), dur)

print("完成")
