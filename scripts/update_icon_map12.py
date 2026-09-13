file_path = r'D:\xiyou\demo\js\icon_map.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'np_t_top' in line:
        print(f"找到np_t_top在第{i+1}行")
        insert_lines = [
            "      // V10.x 新增法宝立绘（第十二批，17件 - 套装T3成品+高级饰品，全部完成）",
            "      'jm_t_top': 'img/icons/treasures/tr_jm_t_top.webp',",
            "      'fs_t_top': 'img/icons/treasures/tr_fs_t_top.webp',",
            "      'lh_t_top': 'img/icons/treasures/tr_lh_t_top.webp',",
            "      'tm_t_t3': 'img/icons/treasures/tr_tm_t_t3.webp',",
            "      'de_t_t3': 'img/icons/treasures/tr_de_t_t3.webp',",
            "      'zy_t_t3': 'img/icons/treasures/tr_zy_t_t3.webp',",
            "      'ym_t_t3': 'img/icons/treasures/tr_ym_t_t3.webp',",
            "      'np_t_t3': 'img/icons/treasures/tr_np_t_t3.webp',",
            "      'jm_t_t3': 'img/icons/treasures/tr_jm_t_t3.webp',",
            "      'fs_t_t3': 'img/icons/treasures/tr_fs_t_t3.webp',",
            "      'lh_t_t3': 'img/icons/treasures/tr_lh_t_t3.webp',",
            "      'cf_t_hunhe': 'img/icons/treasures/tr_cf_t_hunhe.webp',",
            "      'adv_t_bixie_mk': 'img/icons/treasures/tr_adv_t_bixie_mk.webp',",
            "      'adv_t_qiankun_mk': 'img/icons/treasures/tr_adv_t_qiankun_mk.webp',",
            "      'ev_t_hunyuan2': 'img/icons/treasures/tr_ev_t_hunyuan2.webp',",
            "      'cf_t_hunhe2': 'img/icons/treasures/tr_cf_t_hunhe2.webp',",
            "      'mj_t': 'img/icons/treasures/tr_mj_t.webp',"
        ]
        lines[i+1:i+1] = insert_lines
        content = '\n'.join(lines)
        print("已插入第十二批法宝图标映射（17件）")
        print("法宝立绘全部完成！")
        break

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print("文件已保存")
