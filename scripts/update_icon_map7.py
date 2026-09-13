file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'tre_sheli' in line and 'tre_sheli_du' not in line:
        print(f"找到tre_sheli在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第七批，10件）",
            "      'tre_sheli_du': 'img/icons/treasures/tr_sheli_du.webp',",
            "      'tre_sheli_duo': 'img/icons/treasures/tr_sheli_duo.webp',",
            "      'tre_jinnao': 'img/icons/treasures/tr_jinnao.webp',",
            "      'tre_jinnao_du': 'img/icons/treasures/tr_jinnao_du.webp',",
            "      'tre_jinnao_ni': 'img/icons/treasures/tr_jinnao_ni.webp',",
            "      'tre_jinling': 'img/icons/treasures/tr_jinling.webp',",
            "      'tre_jinling_du': 'img/icons/treasures/tr_jinling_du.webp',",
            "      'tre_jinling_duo': 'img/icons/treasures/tr_jinling_duo.webp',",
            "      'tre_yinyangping': 'img/icons/treasures/tr_yinyangping.webp',",
            "      'tre_yinyangping_du': 'img/icons/treasures/tr_yinyangping_du.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第七批法宝图标映射（10件）")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
