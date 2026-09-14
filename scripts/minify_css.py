#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSS压缩脚本 - 移除注释、空白、优化选择器
"""

import re
import os

def minify_css(css):
    """压缩CSS"""
    # 移除注释
    css = re.sub(r'/\*[\s\S]*?\*/', '', css)
    
    # 移除多余空白
    css = re.sub(r'\s+', ' ', css)
    
    # 移除选择器和大括号之间的空白
    css = re.sub(r'\s*([{}:;,])\s*', r'\1', css)
    
    # 移除最后一个分号
    css = re.sub(r';}', '}', css)
    
    # 移除 leading/trailing 空白
    css = css.strip()
    
    return css

def main():
    css_path = r'D:\xiyou\demo\css\style.css'
    output_path = r'D:\xiyou\demo\css\style.min.css'
    
    # 读取原始CSS
    with open(css_path, 'r', encoding='utf-8') as f:
        original = f.read()
    
    original_size = len(original.encode('utf-8'))
    
    # 压缩CSS
    minified = minify_css(original)
    minified_size = len(minified.encode('utf-8'))
    
    # 写入压缩后的CSS
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(minified)
    
    reduction = (1 - minified_size / original_size) * 100
    
    print(f"CSS压缩完成:")
    print(f"  原始大小: {original_size/1024:.2f} KB")
    print(f"  压缩大小: {minified_size/1024:.2f} KB")
    print(f"  节省: {reduction:.1f}%")
    print(f"  输出文件: {output_path}")

if __name__ == '__main__':
    main()
