#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新ui_map.js中的节点渲染逻辑，使用新的节点图标替代emoji
"""

import re

ui_map_path = r"D:\xiyou\demo\js\ui\ui_map.js"

with open(ui_map_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 找到节点图标渲染的位置并修改
# 原代码: const icon = info.icon || (isBoss ? '☠' : '·');
# 修改为: 根据节点类型使用对应的图片图标

old_icon_line = "const icon = info.icon || (isBoss ? '☠' : '·');"

new_icon_code = """// 节点类型图标映射（使用图片图标替代emoji）
const NODE_ICON_MAP = {
  battle: 'img/icons/nodes/node_battle.webp',
  event: 'img/icons/nodes/node_event.webp',
  treasure: 'img/icons/nodes/node_treasure.webp',
  boss: 'img/icons/nodes/node_boss.webp',
  elite: 'img/icons/nodes/node_elite.webp',
  shop: 'img/icons/nodes/node_shop.webp',
  rest: 'img/icons/nodes/node_rest.webp',
  story: 'img/icons/nodes/node_story.webp'
};
// 确定节点类型
const nodeType = isBoss ? 'boss' : (info.type || 'event');
const nodeIconImg = NODE_ICON_MAP[nodeType] || NODE_ICON_MAP['event'];
const icon = info.icon || (isBoss ? '☠' : '·');
const iconHtml = `<img src="${nodeIconImg}" alt="${nodeType}" onerror="this.style.display='none';this.parentNode.innerHTML='${icon}';" />`;"""

if old_icon_line in content:
    content = content.replace(old_icon_line, new_icon_code)
    print("✅ 节点图标渲染逻辑已更新")
else:
    print("⚠️ 使用正则替换节点图标渲染逻辑")
    pattern = r'const icon = info\.icon \|\| \(isBoss \? .☠. : .·.\);'
    content = re.sub(pattern, new_icon_code, content)
    print("✅ 节点图标渲染逻辑已通过正则更新")

# 2. 修改节点渲染HTML，使用iconHtml替代icon
# 原代码: <span class="nbm-dot">${icon}</span>
# 修改为: <span class="nbm-dot">${iconHtml}</span>

old_dot_html = '<span class="nbm-dot">${icon}</span>'
new_dot_html = '<span class="nbm-dot">${iconHtml}</span>'

if old_dot_html in content:
    content = content.replace(old_dot_html, new_dot_html)
    print("✅ 节点渲染HTML已更新（使用iconHtml）")
else:
    print("⚠️ 使用正则替换节点渲染HTML")
    pattern = r'<span class="nbm-dot">\$\{icon\}</span>'
    content = re.sub(pattern, new_dot_html, content)
    print("✅ 节点渲染HTML已通过正则更新")

# 保存文件
with open(ui_map_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ ui_map.js更新完成！")
