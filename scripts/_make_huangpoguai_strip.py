# -*- coding: utf-8 -*-
"""黄袍怪：从GIF提取帧 → 抠底 → 合成webp精灵条"""
import os
from PIL import Image

SRC = r"D:\xiyou\demo\img\portraits\monsters\huangpoguai"
DST = r"D:\xiyou\demo\img\portraits\foe"
TMP = os.path.join(SRC, "_frames")
os.makedirs(TMP, exist_ok=True)

def extract_gif_frames(gif_path, prefix, max_frames=6):
    """从GIF提取帧，返回帧列表"""
    im = Image.open(gif_path)
    frames = []
    try:
        for i in range(max_frames):
            im.seek(i)
            frame = im.convert("RGBA").copy()
            frames.append(frame)
    except EOFError:
        pass
    return frames

def remove_bg(im):
    """白底/黑底变透明"""
    im = im.convert("RGBA")
    datas = im.getdata()
    new_data = []
    for item in datas:
        if (item[0] > 230 and item[1] > 230 and item[2] > 230) or \
           (item[0] < 20 and item[1] < 20 and item[2] < 20):
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    im.putdata(new_data)
    return im

def make_strip_from_gif(gif_name, prefix, out_name, target_h=512, max_frames=6):
    gif_path = os.path.join(SRC, gif_name)
    if not os.path.exists(gif_path):
        print(f"  {gif_name}: 不存在!")
        return
    frames = extract_gif_frames(gif_path, prefix, max_frames)
    if not frames:
        print(f"  {gif_name}: 无帧!")
        return
    processed = []
    for i, frame in enumerate(frames):
        frame = remove_bg(frame)
        w = int(frame.width * target_h / frame.height)
        frame = frame.resize((w, target_h), Image.LANCZOS)
        processed.append(frame)
    total_w = sum(im.width for im in processed)
    strip = Image.new("RGBA", (total_w, target_h), (0, 0, 0, 0))
    x = 0
    for im in processed:
        strip.paste(im, (x, 0), im)
        x += im.width
    out_path = os.path.join(DST, out_name)
    strip.save(out_path, "WEBP", quality=85, method=6)
    print(f"  {out_name}: {len(processed)}帧, {total_w}x{target_h}, {os.path.getsize(out_path)//1024}KB")

print("=== 黄袍怪人形态精灵条合成 ===")
make_strip_from_gif("黄袍怪_人形态_待机.gif", "idle", "huangpoguai_combat_idle_strip.webp", max_frames=6)
make_strip_from_gif("黄袍怪_人形态_攻击.gif", "atk", "huangpoguai_combat_atk_strip.webp", max_frames=6)
make_strip_from_gif("黄袍怪_人形态_受击.gif", "hit", "huangpoguai_combat_hit_strip.webp", max_frames=4)
print("黄袍怪完成！")
