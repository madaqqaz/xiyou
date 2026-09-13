#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统一文件编码为UTF-8 without BOM
检测并转换所有HTML/JS/CSS文件
"""

import os
import sys
from pathlib import Path

DEMO_PATH = r"D:\xiyou\demo"

# 支持的文件扩展名
SUPPORTED_EXTENSIONS = {'.html', '.js', '.css', '.json', '.md', '.txt'}

def detect_encoding(file_path):
    """检测文件编码"""
    try:
        with open(file_path, 'rb') as f:
            raw = f.read()
        
        # 检查BOM
        if raw.startswith(b'\xef\xbb\xbf'):
            return 'utf-8-sig'  # UTF-8 with BOM
        elif raw.startswith(b'\xff\xfe'):
            return 'utf-16-le'
        elif raw.startswith(b'\xfe\xff'):
            return 'utf-16-be'
        
        # 尝试UTF-8解码
        try:
            raw.decode('utf-8')
            return 'utf-8'  # UTF-8 without BOM
        except UnicodeDecodeError:
            pass
        
        # 尝试GBK解码
        try:
            raw.decode('gbk')
            return 'gbk'
        except UnicodeDecodeError:
            pass
        
        return 'unknown'
    except Exception as e:
        return f'error: {e}'

def convert_to_utf8(file_path, source_encoding):
    """转换文件为UTF-8 without BOM"""
    try:
        with open(file_path, 'r', encoding=source_encoding) as f:
            content = f.read()
        
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"  转换失败: {e}")
        return False

def main():
    print("=" * 60)
    print("统一文件编码为UTF-8 without BOM")
    print("=" * 60)
    
    stats = {
        'total': 0,
        'utf8': 0,
        'utf8_sig': 0,
        'gbk': 0,
        'other': 0,
        'converted': 0,
        'failed': 0
    }
    
    # 遍历所有文件
    for root, dirs, files in os.walk(DEMO_PATH):
        # 跳过node_modules和备份目录
        if 'node_modules' in root or '_backup' in root or 'img_backup' in root:
            continue
        
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext not in SUPPORTED_EXTENSIONS:
                continue
            
            file_path = os.path.join(root, file)
            stats['total'] += 1
            
            encoding = detect_encoding(file_path)
            
            if encoding == 'utf-8':
                stats['utf8'] += 1
            elif encoding == 'utf-8-sig':
                stats['utf8_sig'] += 1
                rel_path = os.path.relpath(file_path, DEMO_PATH)
                print(f"转换 (UTF-8 BOM): {rel_path}")
                if convert_to_utf8(file_path, 'utf-8-sig'):
                    stats['converted'] += 1
                else:
                    stats['failed'] += 1
            elif encoding == 'gbk':
                stats['gbk'] += 1
                rel_path = os.path.relpath(file_path, DEMO_PATH)
                print(f"转换 (GBK): {rel_path}")
                if convert_to_utf8(file_path, 'gbk'):
                    stats['converted'] += 1
                else:
                    stats['failed'] += 1
            else:
                stats['other'] += 1
                rel_path = os.path.relpath(file_path, DEMO_PATH)
                print(f"其他编码 ({encoding}): {rel_path}")
    
    print("\n" + "=" * 60)
    print("统计结果:")
    print(f"  总文件数: {stats['total']}")
    print(f"  UTF-8 (无BOM): {stats['utf8']}")
    print(f"  UTF-8 (有BOM): {stats['utf8_sig']}")
    print(f"  GBK: {stats['gbk']}")
    print(f"  其他: {stats['other']}")
    print(f"  成功转换: {stats['converted']}")
    print(f"  转换失败: {stats['failed']}")
    print("=" * 60)

if __name__ == "__main__":
    main()
