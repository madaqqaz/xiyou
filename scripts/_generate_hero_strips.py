#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量生成英雄动画精灵条（strip）
将单帧WebP合并成横向的精灵条图片
"""

import os
from PIL import Image

BASE_DIR = r"D:\xiyou\demo\img\portraits\heroes"
OUTPUT_DIR = r"D:\xiyou\demo\img\portraits\heroes"

# 英雄列表
HEROES = ["tangseng", "wukong", "bajie", "shaseng", "longma"]

# 动作配置：(前缀, 帧数, 输出后缀)
ACTIONS = [
    ("cast", 6, "combat_cast_strip"),
    ("dead", 6, "combat_death_strip"),
]

def create_strip(hero_id, action_prefix, frame_count, output_path):
    """创建精灵条"""
    hero_dir = os.path.join(BASE_DIR, hero_id)
    frames = []
    
    for i in range(1, frame_count + 1):
        # 使用两位数格式（01, 02, ...）
        frame_num = f"{i:02d}"
        # 优先使用webp格式
        frame_path = os.path.join(hero_dir, f"{action_prefix}_{frame_num}.webp")
        if not os.path.exists(frame_path):
            frame_path = os.path.join(hero_dir, f"{action_prefix}_{frame_num}.png")
        
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
    print(f"  ✅ {len(frames)}帧 -> {os.path.basename(webp_path)} ({strip_width}x{strip_height}, {os.path.getsize(webp_path)//1024}KB)")
    return True

def main():
    print("=" * 60)
    print("批量生成英雄动画精灵条（strip）")
    print("=" * 60)
    
    total_created = 0
    for hero in HEROES:
        print(f"\n【{hero}】")
        for action_prefix, frame_count, output_suffix in ACTIONS:
            output_filename = f"{hero}_{output_suffix}.webp"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            print(f"  生成 {action_prefix} 动画...")
            if create_strip(hero, action_prefix, frame_count, output_path):
                total_created += 1
    
    print(f"\n{'=' * 60}")
    print(f"完成！共生成 {total_created} 个精灵条文件")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
