file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'tre_lingzhi' in line:
        print(f"找到tre_lingzhi在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第三批）",
            "      'tre_yueyachan': 'img/icons/treasures/tr_yueyachan.webp',",
            "      'tre_muxin': 'img/icons/treasures/tr_muxin.webp',",
            "      'tre_tidao': 'img/icons/treasures/tr_tidao.webp',",
            "      'tre_yufu': 'img/icons/treasures/tr_yufu.webp',",
            "      'tre_xijiaodeng': 'img/icons/treasures/tr_xijiaodeng.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第三批法宝图标映射")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
