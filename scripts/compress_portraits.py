#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
压缩英雄立绘和敌人立绘 - 针对手机加载优化
目标：平均150KB/张
"""

import os
import io
from PIL import Image

def compress_webp(input_path, output_path, target_size_kb=150, quality_range=(35, 80)):
    """压缩WebP图片"""
    try:
        img = Image.open(input_path)
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        
        # 二分法查找最佳质量
        low, high = quality_range
        best_data = None
        
        for _ in range(8):
            mid = (low + high) // 2
            buffer = io.BytesIO()
            img.save(buffer, format='WEBP', quality=mid, method=6)
            data = buffer.getvalue()
            size_kb = len(data) / 1024
            
            if size_kb <= target_size_kb:
                best_data = data
                low = mid + 1
            else:
                high = mid - 1
        
        if best_data is None:
            buffer = io.BytesIO()
            img.save(buffer, format='WEBP', quality=quality_range[0], method=6)
            best_data = buffer.getvalue()
        
        with open(output_path, 'wb') as f:
            f.write(best_data)
        
        return True, len(best_data)
    except Exception as e:
        print(f"  错误: {e}")
        return False, 0

def compress_directory(directory, target_size_kb=150):
    """压缩目录中的所有WebP图片（递归）"""
    files = []
    for root, dirs, filenames in os.walk(directory):
        for f in filenames:
            if f.lower().endswith('.webp'):
                files.append(os.path.join(root, f))
    
    print(f"目录: {directory}")
    print(f"文件数量: {len(files)}")
    print(f"目标大小: {target_size_kb} KB/张")
    
    total_original = 0
    total_compressed = 0
    success_count = 0
    
    for i, filepath in enumerate(files, 1):
        original_size = os.path.getsize(filepath)
        total_original += original_size
        
        success, compressed_size = compress_webp(filepath, filepath, target_size_kb)
        if success:
            total_compressed += compressed_size
            success_count += 1
        
        if i % 10 == 0 or i == len(files):
            print(f"  [{i}/{len(files)}] 已处理")
    
    print(f"完成: {success_count}/{len(files)} 成功")
    print(f"原始: {total_original/1024/1024:.2f} MB -> 压缩后: {total_compressed/1024/1024:.2f} MB")
    print(f"节省: {(total_original-total_compressed)/1024/1024:.2f} MB ({(1-total_compressed/total_original)*100:.1f}%)")
    print(f"平均: {total_compressed/success_count/1024:.1f} KB/张")
    print()

if __name__ == '__main__':
    base_path = r'D:\xiyou\demo\img\portraits'
    
    # 压缩英雄立绘
    hero_path = os.path.join(base_path, 'heroes')
    if os.path.exists(hero_path):
        compress_directory(hero_path, target_size_kb=150)
    
    # 压缩敌人立绘
    enemy_path = os.path.join(base_path, 'enemies')
    if os.path.exists(enemy_path):
        compress_directory(enemy_path, target_size_kb=150)
