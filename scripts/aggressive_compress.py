#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
激进图片压缩脚本 - 针对手机加载优化
目标：法宝立绘平均200KB/张，总大小减少50%
"""

import os
import sys
from PIL import Image
import io

def compress_webp_aggressive(input_path, output_path, target_size_kb=200, quality_range=(40, 85)):
    """
    激进压缩WebP图片，目标文件大小
    使用二分法查找最佳质量参数
    """
    try:
        img = Image.open(input_path)
        
        # 如果是RGBA模式，保留透明度
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        
        # 二分法查找最佳质量
        low, high = quality_range
        best_quality = low
        best_data = None
        
        for _ in range(8):  # 最多8次迭代
            mid = (low + high) // 2
            
            # 保存到内存
            buffer = io.BytesIO()
            img.save(buffer, format='WEBP', quality=mid, method=6)
            data = buffer.getvalue()
            size_kb = len(data) / 1024
            
            if size_kb <= target_size_kb:
                best_quality = mid
                best_data = data
                low = mid + 1  # 尝试更高质量
            else:
                high = mid - 1  # 降低质量
        
        # 如果没有找到合适的质量，使用最低质量
        if best_data is None:
            buffer = io.BytesIO()
            img.save(buffer, format='WEBP', quality=quality_range[0], method=6)
            best_data = buffer.getvalue()
        
        # 写入文件
        with open(output_path, 'wb') as f:
            f.write(best_data)
        
        original_size = os.path.getsize(input_path)
        compressed_size = len(best_data)
        reduction = (1 - compressed_size / original_size) * 100
        
        return {
            'success': True,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'reduction': reduction,
            'quality': best_quality
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def compress_directory(directory, target_size_kb=200, backup=False):
    """
    压缩目录中的所有WebP图片
    """
    results = []
    files = [f for f in os.listdir(directory) if f.lower().endswith('.webp')]
    
    print(f"开始压缩目录: {directory}")
    print(f"文件数量: {len(files)}")
    print(f"目标大小: {target_size_kb} KB/张")
    print("-" * 60)
    
    total_original = 0
    total_compressed = 0
    success_count = 0
    
    for i, filename in enumerate(files, 1):
        input_path = os.path.join(directory, filename)
        
        # 备份原文件
        if backup:
            backup_path = input_path + '.bak'
            if not os.path.exists(backup_path):
                import shutil
                shutil.copy2(input_path, backup_path)
        
        # 压缩（覆盖原文件）
        result = compress_webp_aggressive(input_path, input_path, target_size_kb)
        
        if result['success']:
            total_original += result['original_size']
            total_compressed += result['compressed_size']
            success_count += 1
            
            if i % 10 == 0 or i == len(files):
                print(f"[{i}/{len(files)}] {filename}: "
                      f"{result['original_size']//1024}KB -> {result['compressed_size']//1024}KB "
                      f"(-{result['reduction']:.1f}%, Q{result['quality']})")
        else:
            print(f"[{i}/{len(files)}] {filename}: 失败 - {result['error']}")
        
        results.append(result)
    
    print("-" * 60)
    print(f"压缩完成: {success_count}/{len(files)} 成功")
    print(f"原始总大小: {total_original/1024/1024:.2f} MB")
    print(f"压缩后大小: {total_compressed/1024/1024:.2f} MB")
    print(f"节省空间: {(total_original-total_compressed)/1024/1024:.2f} MB "
          f"({(1-total_compressed/total_original)*100:.1f}%)")
    print(f"平均大小: {total_compressed/success_count/1024:.1f} KB/张")
    
    return results

if __name__ == '__main__':
    # 法宝立绘目录
    treasure_dir = r'D:\xiyou\demo\img\icons\treasures'
    
    # 压缩法宝立绘，目标200KB/张
    if os.path.exists(treasure_dir):
        compress_directory(treasure_dir, target_size_kb=200, backup=True)
    else:
        print(f"目录不存在: {treasure_dir}")
