#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量生成Boss动画GIF预览
每个Boss生成5个GIF：待机、攻击、施法、受击、死亡
"""

import os
from PIL import Image

BASE_DIR = r"D:\xiyou\demo\img\portraits\monsters"

# Boss列表
BOSSES = [
    ("huangfeng", "黄风大圣"),
    ("liuermihou", "六耳猕猴"),
    ("liumowang", "牛魔王"),
    ("qingshi", "青狮精"),
    ("baixiang", "白象精"),
    ("dapeng", "大鹏金翅雕"),
    ("jiuling", "九灵元圣"),
    ("chuanjingli", "传经吏"),
    ("liuhong", "刘洪"),
    ("xiezijing", "蝎子精"),
    ("yutujing", "玉兔精"),
    ("dashengcanqu", "大圣残躯"),
    ("tongtianhelaoyuan", "通天河老鼋"),
    ("bailong", "白龙"),
    ("shaseng", "沙僧"),
    ("jinyujing", "金鱼精"),
    ("jiutouchong", "九头虫"),
]

# 动作配置：(前缀, 帧数, 持续时间ms)
ACTIONS = [
    ("idle", 4, 300),    # 待机
    ("attack", 6, 150),  # 攻击
    ("cast", 6, 200),    # 施法
    ("hit", 3, 150),     # 受击
    ("death", 6, 400),   # 死亡
]

def resize_image(img, target_size=512):
    """调整图片大小，保持比例"""
    w, h = img.size
    if w > h:
        new_w = target_size
        new_h = int(h * target_size / w)
    else:
        new_h = target_size
        new_w = int(w * target_size / h)
    return img.resize((new_w, new_h), Image.LANCZOS)

def generate_gif(boss_id, boss_name, action_prefix, frame_count, duration):
    """生成单个动作的GIF"""
    boss_dir = os.path.join(BASE_DIR, boss_id)
    gif_dir = os.path.join(boss_dir, "GIF预览")
    os.makedirs(gif_dir, exist_ok=True)
    
    frames = []
    for i in range(1, frame_count + 1):
        frame_path = os.path.join(boss_dir, f"{action_prefix}_{i}.png")
        if os.path.exists(frame_path):
            img = Image.open(frame_path).convert("RGBA")
            img = resize_image(img, 512)
            frames.append(img)
        else:
            print(f"  ⚠️ 缺少帧: {frame_path}")
    
    if len(frames) == 0:
        print(f"  ❌ {boss_name} - {action_prefix}: 无可用帧")
        return False
    
    # 生成GIF
    gif_path = os.path.join(gif_dir, f"{action_prefix}.gif")
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=duration,
        loop=0,
        disposal=2,
        optimize=True
    )
    print(f"  ✅ {boss_name} - {action_prefix}: {len(frames)}帧 -> {os.path.basename(gif_path)}")
    return True

def main():
    print("=" * 60)
    print("批量生成Boss动画GIF预览")
    print("=" * 60)
    
    total_gifs = 0
    for boss_id, boss_name in BOSSES:
        print(f"\n📦 {boss_name} ({boss_id})")
        for action_prefix, frame_count, duration in ACTIONS:
            if generate_gif(boss_id, boss_name, action_prefix, frame_count, duration):
                total_gifs += 1
    
    print("\n" + "=" * 60)
    print(f"✅ 完成！共生成 {total_gifs} 个GIF文件")
    print("=" * 60)

if __name__ == "__main__":
    main()
