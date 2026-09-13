import os

file_path = r'D:\xiyou\demo\js\ui\ui_panel_2.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 统计原始PNG数量
png_count = content.count('.png')
print(f'原始.png引用数量: {png_count}')

# 替换英雄战斗动画路径
content = content.replace("'_strip.png\\')", "'_strip.webp\\')")

# 替换宠物和Boss战斗动画路径
content = content.replace("'.png\\')", "'.webp\\')")

# 统计替换后PNG数量
remaining_png = content.count('.png')
webp_count = content.count('.webp')
print(f'替换后.png引用数量: {remaining_png}')
print(f'替换后.webp引用数量: {webp_count}')

# 写入文件（UTF-8 without BOM）
with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print('文件已保存')

# 验证
with open(file_path, 'r', encoding='utf-8') as f:
    verify_content = f.read()
verify_png = verify_content.count('.png')
print(f'验证：剩余.png引用数量: {verify_png}')
if verify_png > 0:
    lines = verify_content.split('\n')
    for i, line in enumerate(lines):
        if '.png' in line:
            print(f'  第 {i+1} 行: {line.strip()[:100]}')
