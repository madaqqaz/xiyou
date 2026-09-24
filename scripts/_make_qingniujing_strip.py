# -*- coding: utf-8 -*-
"""青牛精：从已有PNG帧合成idle/atk/hit webp精灵条"""
import os
from PIL import Image

SRC = r"D:\xiyou\demo\img\portraits\monsters\qingniujing"
DST = r"D:\xiyou\demo\img\portraits\foe"
os.makedirs(DST, exist_ok=True)

def make_strip(prefix, frames, out_name, target_h=512):
    imgs = []
    for i in range(1, frames + 1):
        # 尝试不同命名
        for name_fmt in [f"{prefix}_{i:02d}_transparent.png", f"{prefix}_{i:02d}.png"]:
            p = os.path.join(SRC, name_fmt)
            if os.path.exists(p):
                im = Image.open(p).convert("RGBA")
                # 缩放到统一高度
                w = int(im.width * target_h / im.height)
                im = im.resize((w, target_h), Image.LANCZOS)
                imgs.append(im)
                break
    if not imgs:
        print(f"  {prefix}: 未找到帧!")
        return
    total_w = sum(im.width for im in imgs)
    strip = Image.new("RGBA", (total_w, target_h), (0, 0, 0, 0))
    x = 0
    for im in imgs:
        strip.paste(im, (x, 0), im)
        x += im.width
    out_path = os.path.join(DST, out_name)
    strip.save(out_path, "WEBP", quality=85, method=6)
    print(f"  {out_name}: {len(imgs)}帧, {total_w}x{target_h}, {os.path.getsize(out_path)//1024}KB")

print("=== 青牛精精灵条合成 ===")
make_strip("idle", 4, "qingniujing_combat_idle_strip.webp")
make_strip("attack", 6, "qingniujing_combat_atk_strip.webp")
make_strip("hit", 3, "qingniujing_combat_hit_strip.webp")
print("青牛精完成！")
