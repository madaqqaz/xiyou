file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'bj_belly_top' in line:
        print(f"找到bj_belly_top在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第九批，10件 - 英雄专属法宝进阶版）",
            "      'bj_bowl_ch2': 'img/icons/treasures/tr_bj_bowl_ch2.webp',",
            "      'bj_bowl_ch3': 'img/icons/treasures/tr_bj_bowl_ch3.webp',",
            "      'bj_bowl_ch4': 'img/icons/treasures/tr_bj_bowl_ch4.webp',",
            "      'wk_treasure_ch2': 'img/icons/treasures/tr_wk_treasure_ch2.webp',",
            "      'wk_treasure_ch3': 'img/icons/treasures/tr_wk_treasure_ch3.webp',",
            "      'wk_treasure_ch4': 'img/icons/treasures/tr_wk_treasure_ch4.webp',",
            "      'ts_treasure_ch2': 'img/icons/treasures/tr_ts_treasure_ch2.webp',",
            "      'ts_treasure_ch3': 'img/icons/treasures/tr_ts_treasure_ch3.webp',",
            "      'ts_treasure_ch4': 'img/icons/treasures/tr_ts_treasure_ch4.webp',",
            "      'lm_treasure_ch2': 'img/icons/treasures/tr_lm_treasure_ch2.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第九批法宝图标映射（10件）")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
