"""合成小怪战斗帧 GIF"""
from PIL import Image
import os

frames_dir = r"D:\xiyou\demo\img\portraits\enemies\heifeng_frames"
out_dir = frames_dir

groups = {
    "idle":   (["idle_01.png","idle_02.png","idle_03.png","idle_04.png"], 500),
    "attack": (["attack_01.png","attack_02.png","attack_03.png","attack_04.png","attack_05.png","attack_06.png"], 150),
    "hit":    (["hit_01.png","hit_02.png","hit_03.png"], 200),
    "dead":   (["dead_01.png","dead_02.png","dead_03.png","dead_04.png","dead_05.png","dead_06.png"], 300),
}

TARGET_SIZE = (512, 512)

for gname, (files, duration) in groups.items():
    imgs = []
    for f in files:
        p = os.path.join(frames_dir, f)
        if not os.path.exists(p):
            print(f"  缺: {f}")
            continue
        im = Image.open(p).convert("RGBA")
        im.thumbnail(TARGET_SIZE, Image.LANCZOS)
        bg = Image.new("RGBA", TARGET_SIZE, (255,255,255,255))
        pos = ((TARGET_SIZE[0]-im.width)//2, (TARGET_SIZE[1]-im.height)//2)
        bg.paste(im, pos, im)
        imgs.append(bg.convert("P", palette=Image.ADAPTIVE))
    
    if imgs:
        out_path = os.path.join(out_dir, f"heifeng_{gname}.gif")
        imgs[0].save(out_path, save_all=True, append_images=imgs[1:], 
                     duration=duration, loop=0, disposal=2)
        sz = os.path.getsize(out_path) // 1024
        print(f"  {gname}: {len(imgs)}帧, {sz}KB -> {out_path}")

print("完成")
