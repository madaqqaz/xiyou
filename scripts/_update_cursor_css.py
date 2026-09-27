#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新CSS中的cursor样式，设置cursor热点
"""

css_path = r"D:\xiyou\demo\css\style.css"

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 更新body等元素的cursor样式，添加热点（0 0表示左上角）
old_cursor_1 = """body, #app, .frame, #panel, .win-bg {
  cursor: url("../img/rpg/cursorSword_gold.webp"), auto;
}"""

new_cursor_1 = """body, #app, .frame, #panel, .win-bg {
  cursor: url("../img/rpg/cursorSword_gold.webp") 0 0, auto;
}"""

if old_cursor_1 in content:
    content = content.replace(old_cursor_1, new_cursor_1)
    print("✅ body等元素的cursor样式已更新（添加热点0 0）")
else:
    print("⚠️ 使用正则替换body等元素的cursor样式")
    import re
    pattern = r'body, #app, \.frame, #panel, \.win-bg \{\s*cursor: url\("\.\./img/rpg/cursorSword_gold\.webp"\), auto;\s*\}'
    content = re.sub(pattern, new_cursor_1, content)
    print("✅ body等元素的cursor样式已通过正则更新")

# 2. 更新button等元素的cursor样式，添加热点
old_cursor_2 = """button, .opt-btn, .big-btn, .use-btn, .win-btn, .cell, .bag-cell, [data-action] {
  cursor: url("../img/rpg/cursorSword_gold.webp"), pointer;
}"""

new_cursor_2 = """button, .opt-btn, .big-btn, .use-btn, .win-btn, .cell, .bag-cell, [data-action] {
  cursor: url("../img/rpg/cursorSword_gold.webp") 0 0, pointer;
}"""

if old_cursor_2 in content:
    content = content.replace(old_cursor_2, new_cursor_2)
    print("✅ button等元素的cursor样式已更新（添加热点0 0）")
else:
    print("⚠️ 使用正则替换button等元素的cursor样式")
    pattern = r'button, \.opt-btn, \.big-btn, \.use-btn, \.win-btn, \.cell, \.bag-cell, \[data-action\] \{\s*cursor: url\("\.\./img/rpg/cursorSword_gold\.webp"\), pointer;\s*\}'
    content = re.sub(pattern, new_cursor_2, content)
    print("✅ button等元素的cursor样式已通过正则更新")

# 保存文件
with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ CSS cursor样式更新完成！")
