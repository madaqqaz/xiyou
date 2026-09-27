#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修改节点CSS样式，去掉黑框和深色背景，使用透明背景
"""

import re

css_path = r"D:\xiyou\demo\css\style.css"

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修改.nbm-node样式，去掉黑框和深色背景
old_nbm_node = """.nbm-node {
  position: relative; width: 100%; height: 100%; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: transform .15s ease, box-shadow .2s ease;
  border: 1px solid rgba(212,169,78,.25);
  background: rgba(23,19,14,.85);
  box-shadow: inset 0 0 10px rgba(0,0,0,.5), 0 1px 3px rgba(0,0,0,.4);
}"""

new_nbm_node = """.nbm-node {
  position: relative; width: 100%; height: 100%; border-radius: 50%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: transform .15s ease, filter .2s ease;
  border: none;
  background: transparent;
  box-shadow: none;
}"""

if old_nbm_node in content:
    content = content.replace(old_nbm_node, new_nbm_node)
    print("✅ .nbm-node样式已更新（去掉黑框和深色背景）")
else:
    print("⚠️ 使用正则替换.nbm-node样式")
    pattern = r'\.nbm-node\s*\{[^}]+\}'
    content = re.sub(pattern, new_nbm_node, content)
    print("✅ .nbm-node样式已通过正则更新")

# 2. 修改.nbm-node.tone-locked样式
old_locked = ".nbm-node.tone-locked { color: #6f6a5e; background: rgba(15,12,8,.6); }"
new_locked = ".nbm-node.tone-locked { color: #6f6a5e; background: transparent; opacity: .5; filter: grayscale(0.8); }"
if old_locked in content:
    content = content.replace(old_locked, new_locked)
    print("✅ .nbm-node.tone-locked样式已更新")

# 3. 修改.nbm-node.tone-zheng样式
old_zheng = ".nbm-node.tone-zheng { color: #ffd76a; border-color: #d4a94e; background: radial-gradient(circle, rgba(212,169,78,.25), rgba(23,19,14,.85)); }"
new_zheng = ".nbm-node.tone-zheng { color: #ffd76a; background: transparent; filter: drop-shadow(0 0 6px rgba(212,169,78,.6)); }"
if old_zheng in content:
    content = content.replace(old_zheng, new_zheng)
    print("✅ .nbm-node.tone-zheng样式已更新")

# 4. 修改.nbm-node.tone-ni样式
old_ni = ".nbm-node.tone-ni { color: #ff9a8a; border-color: #c0392b; background: radial-gradient(circle, rgba(192,57,43,.25), rgba(23,19,14,.85)); }"
new_ni = ".nbm-node.tone-ni { color: #ff9a8a; background: transparent; filter: drop-shadow(0 0 6px rgba(192,57,43,.6)); }"
if old_ni in content:
    content = content.replace(old_ni, new_ni)
    print("✅ .nbm-node.tone-ni样式已更新")

# 5. 修改.nbm-node.boss样式
old_boss = ".nbm-node.boss { width: 116%; height: 116%; z-index: 2; border-width: 2px; }"
new_boss = ".nbm-node.boss { width: 120%; height: 120%; z-index: 2; }"
if old_boss in content:
    content = content.replace(old_boss, new_boss)
    print("✅ .nbm-node.boss样式已更新")

# 6. 修改.nbm-node.start样式
old_start = ".nbm-node.start { border-color: #4a9e4a; box-shadow: 0 0 10px rgba(74,158,74,.45); background: radial-gradient(circle, rgba(74,158,74,.2), rgba(23,19,14,.85)); }"
new_start = ".nbm-node.start { background: transparent; filter: drop-shadow(0 0 8px rgba(74,158,74,.6)); }"
if old_start in content:
    content = content.replace(old_start, new_start)
    print("✅ .nbm-node.start样式已更新")

# 7. 修改.nbm-node.end样式
old_end = ".nbm-node.end { border-color: #d4a94e; box-shadow: 0 0 14px rgba(212,169,78,.55); background: radial-gradient(circle, rgba(212,169,78,.25), rgba(23,19,14,.85)); }"
new_end = ".nbm-node.end { background: transparent; filter: drop-shadow(0 0 10px rgba(212,169,78,.7)); }"
if old_end in content:
    content = content.replace(old_end, new_end)
    print("✅ .nbm-node.end样式已更新")

# 8. 修改.nbm-node:hover样式
old_hover = ".nbm-node:hover { transform: scale(1.18); z-index: 5; }"
new_hover = ".nbm-node:hover { transform: scale(1.15); z-index: 5; filter: brightness(1.2) drop-shadow(0 0 10px rgba(255,215,106,.8)); }"
if old_hover in content:
    content = content.replace(old_hover, new_hover)
    print("✅ .nbm-node:hover样式已更新")

# 9. 修改.nbm-dot样式，支持图片图标
old_dot = ".nbm-node .nbm-dot { font-size: 14px; line-height: 1; }"
new_dot = """.nbm-node .nbm-dot { font-size: 14px; line-height: 1; width: 70%; height: 70%; display: flex; align-items: center; justify-content: center; }
.nbm-node .nbm-dot img { width: 100%; height: 100%; object-fit: contain; }"""
if old_dot in content:
    content = content.replace(old_dot, new_dot)
    print("✅ .nbm-node .nbm-dot样式已更新（支持图片图标）")

# 10. 修改.nbm-node.boss .nbm-dot样式
old_boss_dot = ".nbm-node.boss .nbm-dot { font-size: 18px; }"
new_boss_dot = ".nbm-node.boss .nbm-dot { width: 75%; height: 75%; }"
if old_boss_dot in content:
    content = content.replace(old_boss_dot, new_boss_dot)
    print("✅ .nbm-node.boss .nbm-dot样式已更新")

# 保存文件
with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ CSS样式更新完成！")
