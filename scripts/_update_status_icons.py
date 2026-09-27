#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修改battle_ui_enhance.js，将emoji图标替换为真正的图标图片
"""

import re

file_path = r"D:\xiyou\demo\js\battle_ui_enhance.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 替换DEBUFF_ICONS定义
old_icons = """// debuff图标映射
NDX.BattleUI.DEBUFF_ICONS = {
  burn: { icon: '🔥', name: '灼烧', color: '#ff6b6b' },
  poison: { icon: '☠️', name: '剧毒', color: '#51cf66' },
  curse: { icon: '💀', name: '咒蚀', color: '#845ef7' },
  bleed: { icon: '🩸', name: '裂伤', color: '#ff8787' },
  stun: { icon: '💫', name: '眩晕', color: '#ffd43b' },
  disarm: { icon: '🔒', name: '缴械', color: '#868e96' },
  blind: { icon: '👁️', name: '致盲', color: '#74c0fc' },
  atkDown: { icon: '⬇️', name: '攻击下降', color: '#ffa94d' },
  defDown: { icon: '🛡️', name: '防御下降', color: '#63e6be' },
  charm: { icon: '💕', name: '魅惑', color: '#f783ac' },
  freeze: { icon: '❄️', name: '冰冻', color: '#4dabf7' }
};"""

new_icons = """// debuff图标映射（优先使用图标图片，emoji作为fallback）
NDX.BattleUI.DEBUFF_ICONS = {
  burn: { icon: '🔥', iconImg: 'img/icons/status/status_burn.webp', name: '灼烧', color: '#ff6b6b' },
  poison: { icon: '☠️', iconImg: 'img/icons/status/status_poison.webp', name: '剧毒', color: '#51cf66' },
  curse: { icon: '💀', name: '咒蚀', color: '#845ef7' },
  bleed: { icon: '🩸', name: '裂伤', color: '#ff8787' },
  stun: { icon: '💫', iconImg: 'img/icons/status/status_stun.webp', name: '眩晕', color: '#ffd43b' },
  disarm: { icon: '🔒', name: '缴械', color: '#868e96' },
  blind: { icon: '👁️', name: '致盲', color: '#74c0fc' },
  atkDown: { icon: '⬇️', name: '攻击下降', color: '#ffa94d' },
  defDown: { icon: '🛡️', name: '防御下降', color: '#63e6be' },
  charm: { icon: '💕', name: '魅惑', color: '#f783ac' },
  freeze: { icon: '❄️', iconImg: 'img/icons/status/status_freeze.webp', name: '冰冻', color: '#4dabf7' },
  paralyze: { icon: '⚡', iconImg: 'img/icons/status/status_paralyze.webp', name: '麻痹', color: '#ffd43b' }
};"""

if old_icons in content:
    content = content.replace(old_icons, new_icons)
    print("✅ DEBUFF_ICONS注册表已更新")
else:
    print("⚠️ 使用正则替换DEBUFF_ICONS")
    pattern = r"// debuff图标映射\s*NDX\.BattleUI\.DEBUFF_ICONS = \{[^}]+\};"
    content = re.sub(pattern, new_icons, content)
    print("✅ DEBUFF_ICONS注册表已通过正则更新")

# 2. 修改渲染逻辑，优先使用图标图片
old_render = """    debuffEl.innerHTML = `
      <span>` + info.icon + `</span>
      <span style=\""""

new_render = """    // 优先使用图标图片，emoji作为fallback
    var iconHtml = info.iconImg ? '<img src=\"' + info.iconImg + '\" style=\"width:20px;height:20px;object-fit:contain;\" />' : '<span>' + info.icon + '</span>';
    debuffEl.innerHTML = `
      ` + iconHtml + `
      <span style=\""""

if old_render in content:
    content = content.replace(old_render, new_render)
    print("✅ 渲染逻辑已更新")
else:
    print("⚠️ 使用正则替换渲染逻辑")
    pattern = r"debuffEl\.innerHTML = `\s*<span>` \+ info\.icon \+ `</span>"
    replacement = "var iconHtml = info.iconImg ? '<img src=\"' + info.iconImg + '\" style=\"width:20px;height:20px;object-fit:contain;\" />' : '<span>' + info.icon + '</span>';\n    debuffEl.innerHTML = `\n      ` + iconHtml"
    content = re.sub(pattern, replacement, content)
    print("✅ 渲染逻辑已通过正则更新")

# 保存文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ 文件已保存")
print("完成！")
