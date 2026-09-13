file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 查找tre_jinshen行，在其后插入第二批
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'tre_jinshen' in line and 'treasures' in line:
        print(f"找到tre_jinshen在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第二批）",
            "      'tre_ruyigou': 'img/icons/treasures/tr_ruyigou.webp',",
            "      'tre_suixinbing': 'img/icons/treasures/tr_suixinbing.webp',",
            "      'tre_bajiaoshan_ying': 'img/icons/treasures/tr_bajiaoshan_ying.webp',",
            "      'tre_foguang': 'img/icons/treasures/tr_foguang.webp',",
            "      'tre_lingzhi': 'img/icons/treasures/tr_lingzhi.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第二批法宝图标映射")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
