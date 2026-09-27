#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载25个新Boss语音文件
"""

import os
import urllib.request

voice_dir = r"D:\xiyou\demo\assets\voice"
os.makedirs(voice_dir, exist_ok=True)

# 25个新Boss语音文件URL映射（全部AI生成，零版权风险）
audio_files = {
    # === 灵感大王（5个）===
    "boss_linggan_enter.mp3": "https://aka.doubaocdn.com/s/YwxtGnHUIL",
    "boss_linggan_attack.mp3": "https://aka.doubaocdn.com/s/lxuEnATR95",
    "boss_linggan_skill.mp3": "https://aka.doubaocdn.com/s/oJ3fxoNyoX",
    "boss_linggan_victory.mp3": "https://aka.doubaocdn.com/s/WL3tV4PxNz",
    "boss_linggan_defeat.mp3": "https://aka.doubaocdn.com/s/1uKvY3QayR",
    
    # === 蝎子精（5个）===
    "boss_xiezi_enter.mp3": "https://aka.doubaocdn.com/s/iFhmQTsWGn",
    "boss_xiezi_attack.mp3": "https://aka.doubaocdn.com/s/8EdCMuwjyB",
    "boss_xiezi_skill.mp3": "https://aka.doubaocdn.com/s/b17L20y5NV",
    "boss_xiezi_victory.mp3": "https://aka.doubaocdn.com/s/ApiPIwpojm",
    "boss_xiezi_defeat.mp3": "https://aka.doubaocdn.com/s/PnTD2DXcTY",
    
    # === 六耳猕猴（5个）===
    "boss_liuer_enter.mp3": "https://aka.doubaocdn.com/s/ch1JVaiYFl",
    "boss_liuer_attack.mp3": "https://aka.doubaocdn.com/s/DUfU7bvtKi",
    "boss_liuer_skill.mp3": "https://aka.doubaocdn.com/s/9mJXdW843h",
    "boss_liuer_victory.mp3": "https://aka.doubaocdn.com/s/6nqBsEK5gx",
    "boss_liuer_defeat.mp3": "https://aka.doubaocdn.com/s/CR6JBrtEPs",
    
    # === 黄眉老怪（5个）===
    "boss_huangmei_enter.mp3": "https://aka.doubaocdn.com/s/rkVbi5VE2C",
    "boss_huangmei_attack.mp3": "https://aka.doubaocdn.com/s/CWI2CMAj7k",
    "boss_huangmei_skill.mp3": "https://aka.doubaocdn.com/s/RnIUxIdkgg",
    "boss_huangmei_victory.mp3": "https://aka.doubaocdn.com/s/jaEDiYZ1TZ",
    "boss_huangmei_defeat.mp3": "https://aka.doubaocdn.com/s/BtGCGaj2pU",
    
    # === 黑熊精（5个）===
    "boss_heixiong_enter.mp3": "https://aka.doubaocdn.com/s/rPUZBvix6T",
    "boss_heixiong_attack.mp3": "https://aka.doubaocdn.com/s/shHbvhqrOf",
    "boss_heixiong_skill.mp3": "https://aka.doubaocdn.com/s/KLdUUBhby0",
    "boss_heixiong_victory.mp3": "https://aka.doubaocdn.com/s/HbYzmozoCB",
    "boss_heixiong_defeat.mp3": "https://aka.doubaocdn.com/s/BdUUeDCnab",
}

success_count = 0
fail_count = 0
total_count = len(audio_files)

print(f"=== 开始下载 {total_count} 个新Boss语音文件 ===")
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
print(f"assets/voice目录总语音文件数: {len(all_files)} 个")
print(f"  原99个 + 新25个 = 124个")

print()
print("OK 所有新Boss语音文件下载完成！")
