import os

file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 查找并替换
old_string = "      'ts_jingping': 'img/icons/treasures/tr_bishuizhu.webp',\n    },"
new_string = """      'ts_jingping': 'img/icons/treasures/tr_bishuizhu.webp',
      // V10.x 新增法宝立绘（第一批）
      'tre_fengdai': 'img/icons/treasures/tr_fengdai.webp',
      'tre_dingfengzhu': 'img/icons/treasures/tr_dingfengzhu.webp',
      'tre_baozhang': 'img/icons/treasures/tr_baozhang.webp',
      'tre_yemingzhu': 'img/icons/treasures/tr_yemingzhu.webp',
      'tre_jinshen': 'img/icons/treasures/tr_jinshen.webp',
    },"""

if old_string in content:
    content = content.replace(old_string, new_string)
    print("已添加法宝图标映射")
else:
    print("未找到目标字符串，尝试其他方式...")
    # 查找ts_jingping行
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'ts_jingping' in line:
            print(f"找到ts_jingping在第{i+1}行: {line}")
            # 在该行后插入新行
            insert_lines = [
                "      // V10.x 新增法宝立绘（第一批）",
                "      'tre_fengdai': 'img/icons/treasures/tr_fengdai.webp',",
                "      'tre_dingfengzhu': 'img/icons/treasures/tr_dingfengzhu.webp',",
                "      'tre_baozhang': 'img/icons/treasures/tr_baozhang.webp',",
                "      'tre_yemingzhu': 'img/icons/treasures/tr_yemingzhu.webp',",
                "      'tre_jinshen': 'img/icons/treasures/tr_jinshen.webp',"
            ]
            lines[i+1:i+1] = insert_lines
            content = '\n'.join(lines)
            print("已插入法宝图标映射")
            break

# 写入文件
with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")

# 验证
with open(file_path, 'r', encoding='utf-8') as f:
    verify_content = f.read()
if 'tre_fengdai' in verify_content:
    print("验证：法宝图标映射已成功添加")
else:
    print("验证：法宝图标映射未找到")
