#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量生成Boss动画精灵条（strip）
将单帧PNG合并成横向的精灵条图片
"""

import os
from PIL import Image

BASE_DIR = r"D:\xiyou\demo\img\portraits\monsters"
OUTPUT_DIR = r"D:\xiyou\demo\img\portraits\foe"

# Boss列表：(boss_id, 输出前缀)
BOSSES = [
    ("huangfeng", "huangfeng"),
    ("liuermihou", "liuermihou"),
    ("liumowang", "niumowang"),
    ("qingshi", "qingshi"),
    ("baixiang", "baixiang"),
    ("dapeng", "dapeng"),
    ("jiuling", "jiulingyuansheng"),
    ("chuanjingli", "chuanjingli"),
    ("liuhong", "liuhong"),
    ("xiezijing", "xiezijing"),
    ("yutujing", "yutu"),
    ("dashengcanqu", "wuzibei"),
    ("tongtianhelaoyuan", "laoyuan"),
    ("bailong", "bailong"),
    ("shaseng", "shaseng_foe"),
    ("jinyujing", "jinyujing"),
    ("jiutouchong", "jiutouchong"),
]

# 动作配置：(前缀, 帧数, 输出后缀)
ACTIONS = [
    ("idle", 4, "combat_idle_strip"),
    ("attack", 6, "combat_atk_strip"),
    ("cast", 6, "combat_cast_strip"),
    ("hit", 3, "combat_hit_strip"),
    ("death", 6, "combat_death_strip"),
]

def create_strip(boss_id, action_prefix, frame_count, output_path):
    """创建精灵条"""
    boss_dir = os.path.join(BASE_DIR, boss_id)
    frames = []
    
    for i in range(1, frame_count + 1):
        frame_path = os.path.join(boss_dir, f"{action_prefix}_{i}.png")
        if os.path.exists(frame_path):
            img = Image.open(frame_path).convert("RGBA")
            frames.append(img)
        else:
            print(f"  ⚠️ 缺少帧: {frame_path}")
    
    if len(frames) == 0:
        print(f"  ❌ 无可用帧")
        return False
    
    # 创建横向精灵条
    frame_width, frame_height = frames[0].size
    strip_width = frame_width * len(frames)
    strip_height = frame_height
    
    strip = Image.new("RGBA", (strip_width, strip_height), (0, 0, 0, 0))
    
    for i, frame in enumerate(frames):
        strip.paste(frame, (i * frame_width, 0))
    
    # 保存为WebP
    webp_path = output_path.replace(".png", ".webp")
    strip.save(webp_path, "WEBP", quality=85, method=6)
    print(f"  ✅ {len(frames)}帧 -> {os.path.basename(webp_path)} ({strip_width}x{strip_height})")
    return True

def main():
    print("=" * 60)
    print("批量生成Boss动画精灵条（strip）")
    print("=" * 60)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    total_strips = 0
    for boss_id, output_prefix in BOSSES:
        print(f"\n📦 {boss_id} -> {output_prefix}")
        for action_prefix, frame_count, output_suffix in ACTIONS:
            output_path = os.path.join(OUTPUT_DIR, f"{output_prefix}_{output_suffix}.webp")
            if create_strip(boss_id, action_prefix, frame_count, output_path):
                total_strips += 1
    
    print("\n" + "=" * 60)
    print(f"✅ 完成！共生成 {total_strips} 个精灵条文件")
    print(f"输出目录: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
