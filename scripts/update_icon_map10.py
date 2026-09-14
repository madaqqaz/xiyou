file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'lm_treasure_ch2' in line:
        print(f"找到lm_treasure_ch2在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第十批，10件 - 英雄专属法宝进阶版+套装成品）",
            "      'lm_treasure_ch3': 'img/icons/treasures/tr_lm_treasure_ch3.webp',",
            "      'lm_treasure_ch4': 'img/icons/treasures/tr_lm_treasure_ch4.webp',",
            "      'ss_treasure_ch2': 'img/icons/treasures/tr_ss_treasure_ch2.webp',",
            "      'ss_treasure_ch3': 'img/icons/treasures/tr_ss_treasure_ch3.webp',",
            "      'ss_treasure_ch4': 'img/icons/treasures/tr_ss_treasure_ch4.webp',",
            "      'ss_skull_top': 'img/icons/treasures/tr_ss_skull_top.webp',",
            "      'yushou': 'img/icons/treasures/tr_yushou.webp',",
            "      'chanyu': 'img/icons/treasures/tr_chanyu.webp',",
            "      'sanmei_top': 'img/icons/treasures/tr_sanmei_top.webp',",
            "      'mangzhu_top': 'img/icons/treasures/tr_mangzhu_top.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第十批法宝图标映射（10件）")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
