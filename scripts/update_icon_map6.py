file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'tre_sanmei_ni' in line:
        print(f"找到tre_sanmei_ni在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第六批，10件）",
            "      'tre_jingangzhuo': 'img/icons/treasures/tr_jingangzhuo.webp',",
            "      'tre_jingangzhuo_du': 'img/icons/treasures/tr_jingangzhuo_du.webp',",
            "      'tre_jingangzhuo_ni': 'img/icons/treasures/tr_jingangzhuo_ni.webp',",
            "      'tre_daomadu': 'img/icons/treasures/tr_daomadu.webp',",
            "      'tre_daomadu_du': 'img/icons/treasures/tr_daomadu_du.webp',",
            "      'tre_daomadu_ni': 'img/icons/treasures/tr_daomadu_ni.webp',",
            "      'tre_bajiaoshan': 'img/icons/treasures/tr_bajiaoshan.webp',",
            "      'tre_bajiaoshan_du': 'img/icons/treasures/tr_bajiaoshan_du.webp',",
            "      'tre_bajiaoshan_duo': 'img/icons/treasures/tr_bajiaoshan_duo.webp',",
            "      'tre_sheli': 'img/icons/treasures/tr_sheli.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第六批法宝图标映射（10件）")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
