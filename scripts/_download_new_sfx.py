#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载15个新生成的音效文件
"""

import os
import urllib.request

voice_dir = r"D:\xiyou\demo\assets\sound"
os.makedirs(voice_dir, exist_ok=True)

# 15个新音效文件URL映射（全部AI生成，零版权风险）
audio_files = {
    # === 六道抉择音效（6个）===
    "sfx_du.wav": "https://aka.doubaocdn.com/s/aUhhEuHeGC",
    "sfx_zhan.wav": "https://aka.doubaocdn.com/s/UwsMqSZ2cP",
    "sfx_yuan.wav": "https://aka.doubaocdn.com/s/fBLabkwUMe",
    "sfx_duo.wav": "https://aka.doubaocdn.com/s/MUNVlQVBuU",
    "sfx_yin.wav": "https://aka.doubaocdn.com/s/fPSUPy99Jk",
    "sfx_ni.wav": "https://aka.doubaocdn.com/s/amayo3gnVT",
    
    # === 其他音效（9个）===
    "sfx_craft.wav": "https://aka.doubaocdn.com/s/w7mJais8cr",
    "sfx_achievement.wav": "https://aka.doubaocdn.com/s/FW1LxtpUbU",
    "sfx_reincarnation.wav": "https://aka.doubaocdn.com/s/fYAxVPhM48",
    "sfx_heart_warn.wav": "https://aka.doubaocdn.com/s/0jK1WdKkB2",
    "sfx_heart_critical.wav": "https://aka.doubaocdn.com/s/OcQsfNYo60",
    "sfx_sutra.wav": "https://aka.doubaocdn.com/s/Ib8biKaqUg",
    "sfx_pet.wav": "https://aka.doubaocdn.com/s/UaqvbUPQtI",
    "sfx_codex.wav": "https://aka.doubaocdn.com/s/tPy0pgtU61",
    "sfx_death.wav": "https://aka.doubaocdn.com/s/7Gtos4XzVT",
}

success_count = 0
fail_count = 0
total_count = len(audio_files)

print(f"=== 开始下载 {total_count} 个新音效文件 ===")
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

sfx_count = len([f for f in all_files if f.startswith("sfx_")])
print(f"  音效: {sfx_count} 个（原25个 + 新15个 = 40个）")

print()
print("OK 所有新音效文件下载完成！")
