"""白龙马v2战斗帧：抠白底成透明 + 合成GIF"""
from PIL import Image
import os

frames_dir = r"D:\xiyou\demo\img\portraits\heroes\longma_frames_v2"
out_dir = frames_dir

def remove_white_bg(im, fuzz=30):
    """将接近白色的背景变为透明"""
    im = im.convert("RGBA")
    datas = im.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        # 接近白色的像素设为透明
        if r > 255 - fuzz and g > 255 - fuzz and b > 255 - fuzz:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append((r, g, b, a))
    im.putdata(new_data)
    return im

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
        # 抠白底
        im = remove_white_bg(im, fuzz=25)
        # 缩放到目标尺寸（透明背景）
        im.thumbnail(TARGET_SIZE, Image.LANCZOS)
        canvas = Image.new("RGBA", TARGET_SIZE, (0,0,0,0))
        pos = ((TARGET_SIZE[0]-im.width)//2, (TARGET_SIZE[1]-im.height)//2)
        canvas.paste(im, pos, im)
        # 保存透明PNG
        png_out = os.path.join(frames_dir, f.replace(".png", "_transparent.png"))
        canvas.save(png_out, "PNG")
        # 转P模式用于GIF（带透明索引）
        p_im = canvas.convert("P", palette=Image.ADAPTIVE, colors=256)
        imgs.append(p_im)
    
    if imgs:
        out_path = os.path.join(out_dir, f"longma_{gname}.gif")
        imgs[0].save(out_path, save_all=True, append_images=imgs[1:], 
                     duration=duration, loop=0, disposal=2, transparency=0)
        sz = os.path.getsize(out_path) // 1024
        print(f"  {gname}: {len(imgs)}帧, {sz}KB -> {out_path}")

print("完成")
