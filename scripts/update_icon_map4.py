file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'tre_xijiaodeng' in line:
        print(f"找到tre_xijiaodeng在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第四批，10件）",
            "      'tre_daoyaochu': 'img/icons/treasures/tr_daoyaochu.webp',",
            "      'tre_daoyaochu_yue': 'img/icons/treasures/tr_daoyaochu_yue.webp',",
            "      'tre_nishang': 'img/icons/treasures/tr_nishang.webp',",
            "      'tre_nishang_du': 'img/icons/treasures/tr_nishang_du.webp',",
            "      'tre_nishang_ni': 'img/icons/treasures/tr_nishang_ni.webp',",
            "      'tre_dingfengdan': 'img/icons/treasures/tr_dingfengdan.webp',",
            "      'tre_dingfengdan_du': 'img/icons/treasures/tr_dingfengdan_du.webp',",
            "      'tre_dingfengdan_yin': 'img/icons/treasures/tr_dingfengdan_yin.webp',",
            "      'tre_renshenguo': 'img/icons/treasures/tr_renshenguo.webp',",
            "      'tre_renshenguo_yuan': 'img/icons/treasures/tr_renshenguo_yuan.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第四批法宝图标映射（10件）")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
