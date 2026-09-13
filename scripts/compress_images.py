#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片压缩和格式转换脚本
将PNG/JPG图片转换为WebP格式，并压缩图片质量
"""

import os
import sys
from PIL import Image
import shutil
from pathlib import Path

# 配置
DEMO_PATH = r"D:\xiyou\demo"
IMG_PATH = os.path.join(DEMO_PATH, "img")
ASSETS_PATH = os.path.join(DEMO_PATH, "assets")
BACKUP_PATH = os.path.join(DEMO_PATH, "img_backup")

# 图片质量设置
WEBP_QUALITY = 80  # WebP质量 (0-100)
JPEG_QUALITY = 80  # JPEG质量 (0-100)

# 支持的图片格式
SUPPORTED_FORMATS = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff'}

def backup_images():
    """备份原始图片"""
    print("=== 备份原始图片 ===")
    if not os.path.exists(BACKUP_PATH):
        os.makedirs(BACKUP_PATH)
    
    # 备份img目录
    img_backup = os.path.join(BACKUP_PATH, "img")
    if os.path.exists(img_backup):
        shutil.rmtree(img_backup)
    shutil.copytree(IMG_PATH, img_backup)
    print(f"img目录已备份到: {img_backup}")
    
    # 备份assets目录中的图片
    assets_backup = os.path.join(BACKUP_PATH, "assets")
    if os.path.exists(assets_backup):
        shutil.rmtree(assets_backup)
    os.makedirs(assets_backup)
    
    for root, dirs, files in os.walk(ASSETS_PATH):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in SUPPORTED_FORMATS:
                src = os.path.join(root, file)
                rel_path = os.path.relpath(src, ASSETS_PATH)
                dst = os.path.join(assets_backup, rel_path)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)
    
    print(f"assets目录中的图片已备份到: {assets_backup}")
    print("备份完成！\n")

def convert_to_webp(image_path, quality=WEBP_QUALITY):
    """将图片转换为WebP格式"""
    try:
        img = Image.open(image_path)
        
        # 如果是RGBA模式，保留透明度
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        
        # 生成WebP文件路径
        webp_path = os.path.splitext(image_path)[0] + '.webp'
        
        # 保存为WebP
        img.save(webp_path, 'WEBP', quality=quality, method=6)
        
        # 获取文件大小
        original_size = os.path.getsize(image_path)
        webp_size = os.path.getsize(webp_path)
        
        return {
            'success': True,
            'original_size': original_size,
            'webp_size': webp_size,
            'saved': original_size - webp_size,
            'saved_percent': (original_size - webp_size) / original_size * 100 if original_size > 0 else 0
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def compress_jpeg(image_path, quality=JPEG_QUALITY):
    """压缩JPEG图片"""
    try:
        img = Image.open(image_path)
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
        
        original_size = os.path.getsize(image_path)
        
        # 覆盖保存
        img.save(image_path, 'JPEG', quality=quality, optimize=True)
        
        compressed_size = os.path.getsize(image_path)
        
        return {
            'success': True,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'saved': original_size - compressed_size,
            'saved_percent': (original_size - compressed_size) / original_size * 100 if original_size > 0 else 0
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def process_directory(directory, convert_png=True, compress_jpg=True):
    """处理目录中的所有图片"""
    print(f"\n=== 处理目录: {directory} ===")
    
    stats = {
        'total': 0,
        'converted': 0,
        'failed': 0,
        'original_total_size': 0,
        'webp_total_size': 0,
        'saved_total': 0
    }
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in SUPPORTED_FORMATS:
                continue
            
            image_path = os.path.join(root, file)
            stats['total'] += 1
            
            if ext == '.png' and convert_png:
                result = convert_to_webp(image_path)
                if result['success']:
                    stats['converted'] += 1
                    stats['original_total_size'] += result['original_size']
                    stats['webp_total_size'] += result['webp_size']
                    stats['saved_total'] += result['saved']
                    
                    if stats['converted'] % 50 == 0:
                        print(f"  已转换 {stats['converted']} 张图片...")
                else:
                    stats['failed'] += 1
                    print(f"  转换失败: {image_path} - {result['error']}")
            
            elif ext in ('.jpg', '.jpeg') and compress_jpg:
                result = compress_jpeg(image_path)
                if result['success']:
                    stats['converted'] += 1
                    stats['original_total_size'] += result['original_size']
                    stats['webp_total_size'] += result['compressed_size']
                    stats['saved_total'] += result['saved']
                else:
                    stats['failed'] += 1
                    print(f"  压缩失败: {image_path} - {result['error']}")
    
    # 打印统计
    print(f"\n--- 处理统计 ---")
    print(f"总图片数: {stats['total']}")
    print(f"成功转换/压缩: {stats['converted']}")
    print(f"失败: {stats['failed']}")
    print(f"原始总大小: {stats['original_total_size'] / 1024 / 1024:.2f} MB")
    print(f"转换后总大小: {stats['webp_total_size'] / 1024 / 1024:.2f} MB")
    print(f"节省空间: {stats['saved_total'] / 1024 / 1024:.2f} MB")
    if stats['original_total_size'] > 0:
        print(f"节省比例: {stats['saved_total'] / stats['original_total_size'] * 100:.2f}%")
    
    return stats

def main():
    """主函数"""
    print("=" * 60)
    print("图片压缩和格式转换脚本")
    print("=" * 60)
    
    # 检查目录是否存在
    if not os.path.exists(IMG_PATH):
        print(f"错误: img目录不存在: {IMG_PATH}")
        return
    
    # 备份原始图片
    backup_images()
    
    # 处理img目录
    img_stats = process_directory(IMG_PATH, convert_png=True, compress_jpg=True)
    
    # 处理assets目录中的图片
    assets_stats = process_directory(ASSETS_PATH, convert_png=True, compress_jpg=True)
    
    # 总计
    total_saved = img_stats['saved_total'] + assets_stats['saved_total']
    print("\n" + "=" * 60)
    print("处理完成！")
    print(f"总共节省空间: {total_saved / 1024 / 1024:.2f} MB")
    print(f"原始图片已备份到: {BACKUP_PATH}")
    print("=" * 60)

if __name__ == "__main__":
    main()
