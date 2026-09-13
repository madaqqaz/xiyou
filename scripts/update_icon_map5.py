file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'tre_renshenguo_yuan' in line:
        print(f"找到tre_renshenguo_yuan在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第五批，10件）",
            "      'tre_renshenguo_duo': 'img/icons/treasures/tr_renshenguo_duo.webp',",
            "      'tre_jingu': 'img/icons/treasures/tr_jingu.webp',",
            "      'tre_jingu_du': 'img/icons/treasures/tr_jingu_du.webp',",
            "      'tre_jingu_ni': 'img/icons/treasures/tr_jingu_ni.webp',",
            "      'tre_hulu': 'img/icons/treasures/tr_hulu.webp',",
            "      'tre_hulu_zhan': 'img/icons/treasures/tr_hulu_zhan.webp',",
            "      'tre_hulu_ni': 'img/icons/treasures/tr_hulu_ni.webp',",
            "      'tre_sanmei': 'img/icons/treasures/tr_sanmei.webp',",
            "      'tre_sanmei_du': 'img/icons/treasures/tr_sanmei_du.webp',",
            "      'tre_sanmei_ni': 'img/icons/treasures/tr_sanmei_ni.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第五批法宝图标映射（10件）")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
