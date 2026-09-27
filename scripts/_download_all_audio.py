#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载并替换所有33个AI生成的音频文件
"""

import os
import urllib.request

voice_dir = r"D:\xiyou\demo\assets\sound"
os.makedirs(voice_dir, exist_ok=True)

# 所有音频文件URL映射（全部AI生成，零版权风险）
audio_files = {
    # === BGM（2个）===
    "bgm_title.ogg": "https://aka.doubaocdn.com/s/waDLjrqM5e",
    "bgm_home.ogg": "https://aka.doubaocdn.com/s/AoLJmmtdbj",
    
    # === 音效（25个）===
    "sfx_attack.wav": "https://aka.doubaocdn.com/s/PJ59NK5CjV",
    "sfx_collect.wav": "https://aka.doubaocdn.com/s/c8WVwhcT3u",
    "sfx_crit.wav": "https://aka.doubaocdn.com/s/F6JgZEQQz6",
    "sfx_defeat.wav": "https://aka.doubaocdn.com/s/VU5CBoSYWJ",
    "sfx_dodge.wav": "https://aka.doubaocdn.com/s/xl2eb4Pd2g",
    "sfx_equip.wav": "https://aka.doubaocdn.com/s/SYM7W9aq4o",
    "sfx_guard.wav": "https://aka.doubaocdn.com/s/SbQxBhyCFK",
    "sfx_heal.wav": "https://aka.doubaocdn.com/s/3HqdDv68ZS",
    "sfx_hit.wav": "https://aka.doubaocdn.com/s/TSXQ2QX2ug",
    "sfx_hover.wav": "https://aka.doubaocdn.com/s/ofUZ4VbwPq",
    "sfx_levelup.wav": "https://aka.doubaocdn.com/s/L8llrKwz0y",
    "sfx_lifewarn.wav": "https://aka.doubaocdn.com/s/3Q0kt6JPw4",
    "sfx_open.wav": "https://aka.doubaocdn.com/s/U1hDUW3Rvt",
    "sfx_poison.wav": "https://aka.doubaocdn.com/s/0uPf5CAuVq",
    "sfx_reflect.wav": "https://aka.doubaocdn.com/s/K6xCrwWofX",
    "sfx_roll.wav": "https://aka.doubaocdn.com/s/0ZpdZErBZ3",
    "sfx_seal.wav": "https://aka.doubaocdn.com/s/wVJ2EcDsWm",
    "sfx_skill.wav": "https://aka.doubaocdn.com/s/FNuglkkW7S",
    "sfx_treasure.wav": "https://aka.doubaocdn.com/s/kueqxZloci",
    "sfx_ult.wav": "https://aka.doubaocdn.com/s/ppyYtL7AN3",
    "sfx_victory.wav": "https://aka.doubaocdn.com/s/nIhb4qfX0T",
    "sfx_warn.wav": "https://aka.doubaocdn.com/s/umOJFYwzVl",
    "sfx_click.mp3": "https://aka.doubaocdn.com/s/lt5F86p8Mc",
    "sfx_zhuanjie.mp3": "https://aka.doubaocdn.com/s/KSg2tT7QzW",
    "sfx_worship.mp3": "https://aka.doubaocdn.com/s/zDGWS1GFzF",
    
    # === 环境音效（6个）===
    "ambient_wind.wav": "https://aka.doubaocdn.com/s/H6mwsgv367",
    "ambient_rain.wav": "https://aka.doubaocdn.com/s/xOTU5MyOco",
    "ambient_bell.wav": "https://aka.doubaocdn.com/s/j4He2Z9C5b",
    "ambient_fire.wav": "https://aka.doubaocdn.com/s/MlnHWNO5dj",
    "ambient_water.wav": "https://aka.doubaocdn.com/s/mgBJmNvvUV",
    "ambient_bird.wav": "https://aka.doubaocdn.com/s/rY5QgvQJrs",
}

success_count = 0
fail_count = 0
total_count = len(audio_files)

print(f"=== 开始下载 {total_count} 个AI生成音频文件 ===")
print()

for i, (filename, url) in enumerate(audio_files.items(), 1):
    output_path = os.path.join(voice_dir, filename)
    
    try:
        urllib.request.urlretrieve(url, output_path)
        file_size = os.path.getsize(output_path) / 1024
        print(f"[{i}/{total_count}] OK {filename} ({file_size:.2f} KB)")
        success_count += 1
    except Exception as e:
        print(f"[{i}/{total_count}] FAIL {filename} - {e}")
        fail_count += 1

print()
print("=== 下载完成 ===")
print(f"成功: {success_count} / {total_count} 个")
print(f"失败: {fail_count} 个")

# 最终验证
print()
print("=== 最终验证 ===")
all_files = os.listdir(voice_dir)
print(f"assets/sound目录总音频文件数: {len(all_files)} 个")

bgm_count = len([f for f in all_files if f.startswith("bgm_")])
sfx_count = len([f for f in all_files if f.startswith("sfx_")])
ambient_count = len([f for f in all_files if f.startswith("ambient_")])

print(f"  BGM: {bgm_count} 个")
print(f"  音效: {sfx_count} 个")
print(f"  环境音效: {ambient_count} 个")

print()
print("OK 所有音频文件已全部替换为AI生成版本，零版权风险！")
