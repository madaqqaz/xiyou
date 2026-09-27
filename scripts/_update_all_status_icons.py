#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新DEBUFF_ICONS注册表，为所有异常状态添加iconImg字段
"""

import re

file_path = r"D:\xiyou\demo\js\battle_ui_enhance.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 新的DEBUFF_ICONS定义，所有异常状态都有iconImg
new_icons = """// debuff图标映射（优先使用图标图片，emoji作为fallback）
NDX.BattleUI.DEBUFF_ICONS = {
  burn: { icon: '🔥', iconImg: 'img/icons/status/status_burn.webp', name: '灼烧', color: '#ff6b6b' },
  poison: { icon: '☠️', iconImg: 'img/icons/status/status_poison.webp', name: '剧毒', color: '#51cf66' },
  curse: { icon: '💀', iconImg: 'img/icons/status/status_curse.webp', name: '咒蚀', color: '#845ef7' },
  bleed: { icon: '🩸', iconImg: 'img/icons/status/status_bleed.webp', name: '裂伤', color: '#ff8787' },
  stun: { icon: '💫', iconImg: 'img/icons/status/status_stun.webp', name: '眩晕', color: '#ffd43b' },
  disarm: { icon: '🔒', iconImg: 'img/icons/status/status_disarm.webp', name: '缴械', color: '#868e96' },
  blind: { icon: '👁️', iconImg: 'img/icons/status/status_blind.webp', name: '致盲', color: '#74c0fc' },
  atkDown: { icon: '⬇️', iconImg: 'img/icons/status/status_atkDown.webp', name: '攻击下降', color: '#ffa94d' },
  defDown: { icon: '🛡️', iconImg: 'img/icons/status/status_defDown.webp', name: '防御下降', color: '#63e6be' },
  charm: { icon: '💕', iconImg: 'img/icons/status/status_charm.webp', name: '魅惑', color: '#f783ac' },
  freeze: { icon: '❄️', iconImg: 'img/icons/status/status_freeze.webp', name: '冰冻', color: '#4dabf7' },
  paralyze: { icon: '⚡', iconImg: 'img/icons/status/status_paralyze.webp', name: '麻痹', color: '#ffd43b' }
};"""

# 使用正则替换DEBUFF_ICONS定义
pattern = r"// debuff图标映射[^\n]*\s*NDX\.BattleUI\.DEBUFF_ICONS = \{[^}]+\};"
content = re.sub(pattern, new_icons, content)

# 保存文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ DEBUFF_ICONS注册表已更新，所有12种异常状态都有iconImg字段")
print("完成！")
