file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'mangzhu_top' in line:
        print(f"找到mangzhu_top在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第十一批，10件 - 套装成品法宝）",
            "      'yuehua_top': 'img/icons/treasures/tr_yuehua_top.webp',",
            "      'set_treasure_t3': 'img/icons/treasures/tr_set_treasure_t3.webp',",
            "      'heifeng_t_t3': 'img/icons/treasures/tr_heifeng_t_t3.webp',",
            "      'shituo_t_t3': 'img/icons/treasures/tr_shituo_t_t3.webp',",
            "      'lingyun_t_t3': 'img/icons/treasures/tr_lingyun_t_t3.webp',",
            "      'tm_t_top': 'img/icons/treasures/tr_tm_t_top.webp',",
            "      'de_t_top': 'img/icons/treasures/tr_de_t_top.webp',",
            "      'zy_t_top': 'img/icons/treasures/tr_zy_t_top.webp',",
            "      'ym_t_top': 'img/icons/treasures/tr_ym_t_top.webp',",
            "      'np_t_top': 'img/icons/treasures/tr_np_t_top.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第十一批法宝图标映射（10件）")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
