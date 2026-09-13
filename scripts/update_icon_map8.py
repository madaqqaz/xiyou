file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'tre_yinyangping_du' in line:
        print(f"找到tre_yinyangping_du在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第八批，10件）",
            "      'tre_yinyangping_ni': 'img/icons/treasures/tr_yinyangping_ni.webp',",
            "      'set_treasure_top': 'img/icons/treasures/tr_tanlangzhui.webp',",
            "      'ts_bowl_top': 'img/icons/treasures/tr_zijinbo.webp',",
            "      'jiuming': 'img/icons/treasures/tr_jiuminghaomao.webp',",
            "      'baojiao': 'img/icons/treasures/tr_baojiaoshan_tanlang.webp',",
            "      'dingfeng': 'img/icons/treasures/tr_dingfengzhu_tanlang.webp',",
            "      'jingu': 'img/icons/treasures/tr_ruyijingubang.webp',",
            "      'zijinhu': 'img/icons/treasures/tr_zijinhonghulu_tanlang.webp',",
            "      'zhaoyao': 'img/icons/treasures/tr_zhaoyaojing.webp',",
            "      'bj_belly_top': 'img/icons/treasures/tr_tunshanbiandudu.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第八批法宝图标映射（10件）")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
