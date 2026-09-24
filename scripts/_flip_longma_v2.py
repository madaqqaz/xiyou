"""白龙马v2帧：水平镜像翻转（面向左→面向右）"""
from PIL import Image
import os

frames_dir = r"D:\xiyou\demo\img\portraits\heroes\longma_frames_v2"

files = [f for f in os.listdir(frames_dir) if f.endswith(".png") and "_transparent" not in f]
for f in files:
    p = os.path.join(frames_dir, f)
    im = Image.open(p).convert("RGBA")
    im_flipped = im.transpose(Image.FLIP_LEFT_RIGHT)
    im_flipped.save(p, "PNG")
    print(f"  镜像: {f}")

print(f"完成，共 {len(files)} 帧")
