// =============================================================
// equipment_part2.js - 装备系统（第二部分：配方/宝物/协同）
// 从 equipment.js 拆分，独立IIFE结构，可独立加载
// 外部接口 NDX.* 保持不变，调用方无需修改
// 拆分日期: 2026-09-14
// =============================================================

(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;

NDX.RECIPES = [
  // —— 套装：基座(胚) + 两种专属材料 → T2 套装成品（劫难必掉基座与材料，故必可合成） ——
  { out: 'set_weapon_top',   set: '破军', base: 'set_weapon_base',   materials: { '破军·锋': 1, '破军·脊': 1 } },
  { out: 'set_armor_top',    set: '玄武', base: 'set_armor_base',    materials: { '玄武·鳞': 1, '玄武·心': 1 } },
  { out: 'set_treasure_top', set: '贪狼', base: 'set_treasure_base', materials: { '贪狼·牙': 1, '贪狼·瞳': 1 } },
  // —— 取经人初始三件套：三件基座 + 各自专属材料 → 取经人初始三件套(T2) ——
  { out: 'ts_robe_top',  set: '取经人', base: 'ts_robe_base',  materials: { '袈裟·金线': 1, '袈裟·佛纹': 1 } },
  { out: 'ts_staff_top', set: '取经人', base: 'ts_staff_base', materials: { '锡杖·九环': 1, '锡杖·檀木': 1 } },
  { out: 'ts_bowl_top',  set: '取经人', base: 'ts_bowl_base',  materials: { '钵·紫金': 1, '钵·禅心': 1 } },
  // —— 孙悟空初始三件套：侧重物伤 ——
  { out: 'wk_crown_top', set: '悟空', base: 'wk_crown_base', materials: { '冠·翎': 1, '冠·金': 1 } },
  { out: 'wk_armor_top', set: '悟空', base: 'wk_armor_base', materials: { '甲·环': 1, '甲·金': 1 } },
  { out: 'wk_staff_top', set: '悟空', base: 'wk_staff_base', materials: { '棒·定海': 1, '棒·神铁': 1 } },
  // —— 猪八戒初始三件套：侧重防御 ——
  { out: 'bj_rake_top',  set: '八戒', base: 'bj_rake_base',  materials: { '耙·齿': 1, '耙·柄': 1 } },
  { out: 'bj_robe_top',  set: '八戒', base: 'bj_robe_base',  materials: { '衣·棉': 1, '衣·戒': 1 } },
  { out: 'bj_belly_top', set: '八戒', base: 'bj_belly_base', materials: { '腹·膘': 1, '腹·福': 1 } },
  // —— 猪八戒初始三件套 · 章节成长配方（第1章凡品 → 第4章终极）——
  // 第2章装在第一章即可用第一章专属材料升级（凡品→ch2），保证八戒第一章能成长
  { out: 'bj_rake_ch2', set: '八戒', base: 'bj_rake_fan', materials: { '玄武·鳞': 2, '灵筋': 1 }, chapter: 2, growth: true },
  { out: 'bj_robe_ch2', set: '八戒', base: 'bj_robe_fan', materials: { '玄武·心': 2, '定风珠碎片': 1 }, chapter: 2, growth: true },
  { out: 'bj_bowl_ch2', set: '八戒', base: 'bj_bowl_fan', materials: { '灵筋': 2, '乌巢心经': 1 }, chapter: 2, growth: true },
  { out: 'bj_rake_ch3', set: '八戒', base: 'bj_rake_ch2', materials: { '狮驼骨': 2, '金翅羽': 1 }, chapter: 3, growth: true },
  { out: 'bj_robe_ch3', set: '八戒', base: 'bj_robe_ch2', materials: { '狮驼骨': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'bj_bowl_ch3', set: '八戒', base: 'bj_bowl_ch2', materials: { '金翅羽': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'bj_rake_ch4', set: '八戒', base: 'bj_rake_ch3', materials: { '天竺佛香': 2, '月宫桂': 1 }, chapter: 4, growth: true },
  { out: 'bj_robe_ch4', set: '八戒', base: 'bj_robe_ch3', materials: { '凌云木': 2, '天竺佛香': 1 }, chapter: 4, growth: true },
  { out: 'bj_bowl_ch4', set: '八戒', base: 'bj_bowl_ch3', materials: { '月宫桂': 2, '凌云木': 1 }, chapter: 4, growth: true },
  // —— 孙悟空初始三件套 · 章节成长配方（第1章凡品 → 第4章终极）——
  { out: 'wk_weapon_ch2',  set: '悟空', base: 'wk_staff_base', materials: { '玄武·鳞': 2, '灵筋': 1 }, chapter: 2, growth: true },
  { out: 'wk_armor_ch2',   set: '悟空', base: 'wk_caogun',    materials: { '玄武·心': 2, '定风珠碎片': 1 }, chapter: 2, growth: true },
  { out: 'wk_treasure_ch2',set: '悟空', base: 'jiuming',      materials: { '灵筋': 2, '乌巢心经': 1 }, chapter: 2, growth: true },
  { out: 'wk_weapon_ch3',  set: '悟空', base: 'wk_weapon_ch2',  materials: { '兜率火': 2, '三昧烬': 1 }, chapter: 3, growth: true },
  { out: 'wk_armor_ch3',   set: '悟空', base: 'wk_armor_ch2',   materials: { '狮驼骨': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'wk_treasure_ch3',set: '悟空', base: 'wk_treasure_ch2', materials: { '金翅羽': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'wk_weapon_ch4',  set: '悟空', base: 'wk_weapon_ch3',  materials: { '天竺佛香': 2, '月宫桂': 1 }, chapter: 4, growth: true },
  { out: 'wk_armor_ch4',   set: '悟空', base: 'wk_armor_ch3',   materials: { '凌云木': 2, '天竺佛香': 1 }, chapter: 4, growth: true },
  { out: 'wk_treasure_ch4',set: '悟空', base: 'wk_treasure_ch3', materials: { '月宫桂': 2, '凌云木': 1 }, chapter: 4, growth: true },
  // —— 取经人初始三件套 · 章节成长配方（第1章凡品 → 第4章终极）——
  { out: 'ts_weapon_ch2',  set: '取经人', base: 'ts_staff_fan',  materials: { '玄武·鳞': 2, '灵筋': 1 }, chapter: 2, growth: true },
  { out: 'ts_armor_ch2',   set: '取经人', base: 'ts_robe_base',  materials: { '玄武·心': 2, '定风珠碎片': 1 }, chapter: 2, growth: true },
  { out: 'ts_treasure_ch2',set: '取经人', base: 'ts_bowl_fan',   materials: { '灵筋': 2, '乌巢心经': 1 }, chapter: 2, growth: true },
  { out: 'ts_weapon_ch3',  set: '取经人', base: 'ts_weapon_ch2',  materials: { '兜率火': 2, '三昧烬': 1 }, chapter: 3, growth: true },
  { out: 'ts_armor_ch3',   set: '取经人', base: 'ts_armor_ch2',   materials: { '狮驼骨': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'ts_treasure_ch3',set: '取经人', base: 'ts_treasure_ch2', materials: { '金翅羽': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'ts_weapon_ch4',  set: '取经人', base: 'ts_weapon_ch3',  materials: { '天竺佛香': 2, '月宫桂': 1 }, chapter: 4, growth: true },
  { out: 'ts_armor_ch4',   set: '取经人', base: 'ts_armor_ch3',   materials: { '凌云木': 2, '天竺佛香': 1 }, chapter: 4, growth: true },
  { out: 'ts_treasure_ch4',set: '取经人', base: 'ts_treasure_ch3', materials: { '月宫桂': 2, '凌云木': 1 }, chapter: 4, growth: true },
  // —— 小白龙(龙马)初始三件套 · 章节成长配方（第1章凡品 → 第4章终极）——
  { out: 'lm_weapon_ch2',  set: '龙马', base: 'lm_hoof_fan',   materials: { '玄武·鳞': 2, '灵筋': 1 }, chapter: 2, growth: true },
  { out: 'lm_armor_ch2',   set: '龙马', base: 'lm_scale_fan',  materials: { '玄武·心': 2, '定风珠碎片': 1 }, chapter: 2, growth: true },
  { out: 'lm_treasure_ch2',set: '龙马', base: 'lm_bowl_fan',   materials: { '灵筋': 2, '乌巢心经': 1 }, chapter: 2, growth: true },
  { out: 'lm_weapon_ch3',  set: '龙马', base: 'lm_weapon_ch2',  materials: { '兜率火': 2, '三昧烬': 1 }, chapter: 3, growth: true },
  { out: 'lm_armor_ch3',   set: '龙马', base: 'lm_armor_ch2',   materials: { '狮驼骨': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'lm_treasure_ch3',set: '龙马', base: 'lm_treasure_ch2', materials: { '金翅羽': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'lm_weapon_ch4',  set: '龙马', base: 'lm_weapon_ch3',  materials: { '天竺佛香': 2, '月宫桂': 1 }, chapter: 4, growth: true },
  { out: 'lm_armor_ch4',   set: '龙马', base: 'lm_armor_ch3',   materials: { '凌云木': 2, '天竺佛香': 1 }, chapter: 4, growth: true },
  { out: 'lm_treasure_ch4',set: '龙马', base: 'lm_treasure_ch3', materials: { '月宫桂': 2, '凌云木': 1 }, chapter: 4, growth: true },
  // —— 沙僧初始三件套 · 章节成长配方（第1章凡品 → 第4章终极）——
  { out: 'ss_weapon_ch2',  set: '沙僧', base: 'ss_staff_fan',  materials: { '玄武·鳞': 2, '灵筋': 1 }, chapter: 2, growth: true },
  { out: 'ss_armor_ch2',   set: '沙僧', base: 'ss_robe_fan',   materials: { '玄武·心': 2, '定风珠碎片': 1 }, chapter: 2, growth: true },
  { out: 'ss_treasure_ch2',set: '沙僧', base: 'ss_bowl_fan',   materials: { '灵筋': 2, '乌巢心经': 1 }, chapter: 2, growth: true },
  { out: 'ss_weapon_ch3',  set: '沙僧', base: 'ss_weapon_ch2',  materials: { '兜率火': 2, '三昧烬': 1 }, chapter: 3, growth: true },
  { out: 'ss_armor_ch3',   set: '沙僧', base: 'ss_armor_ch2',   materials: { '狮驼骨': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'ss_treasure_ch3',set: '沙僧', base: 'ss_treasure_ch2', materials: { '金翅羽': 2, '巨蟒涎': 1 }, chapter: 3, growth: true },
  { out: 'ss_weapon_ch4',  set: '沙僧', base: 'ss_weapon_ch3',  materials: { '天竺佛香': 2, '月宫桂': 1 }, chapter: 4, growth: true },
  { out: 'ss_armor_ch4',   set: '沙僧', base: 'ss_armor_ch3',   materials: { '凌云木': 2, '天竺佛香': 1 }, chapter: 4, growth: true },
  { out: 'ss_treasure_ch4',set: '沙僧', base: 'ss_treasure_ch3', materials: { '月宫桂': 2, '凌云木': 1 }, chapter: 4, growth: true },
  // —— 小白龙(龙马)初始三件套：侧重闪避 ——
  { out: 'lm_saddle_top',set: '龙马', base: 'lm_saddle_base',materials: { '鞍·云': 1, '鞍·风': 1 } },
  { out: 'lm_scale_top', set: '龙马', base: 'lm_scale_base', materials: { '鳞·逆': 1, '鳞·寒': 1 } },
  { out: 'lm_hoof_top',  set: '龙马', base: 'lm_hoof_base',  materials: { '蹄·疾': 1, '蹄·雷': 1 } },
  // —— 沙僧初始三件套：侧重法防 ——
  { out: 'ss_staff_top', set: '沙僧', base: 'ss_staff_base', materials: { '杖·降妖': 1, '杖·沉': 1 } },
  { out: 'ss_skull_top', set: '沙僧', base: 'ss_skull_base', materials: { '串·髑': 1, '串·咒': 1 } },
  { out: 'ss_robe_top',  set: '沙僧', base: 'ss_robe_base',  materials: { '袍·麻': 1, '袍·禅': 1 } },
  // ===== 第二章·合成配方（难21-40）·黑风套三件套 =====
  { out: 'hunkui',  base: 'langyajia',  set: '黑风', material: '黑风铁',  count: 2, chapter: 2 },
  { out: 'yushou',  base: 'jingangying', set: '黑风', material: '兜率火', count: 2, chapter: 2 },
  { out: 'sanmei_top', base: 'sanmei', set: '黑风', material: '三昧烬', count: 2, chapter: 2 },
  { out: 'jingangying_top', base: 'jingangying', set: '黑风', material: '黑风铁', count: 2, chapter: 2 },
  // ===== 第三章·合成配方（难41-60）·狮驼套三件套 =====
  { out: 'tianying', base: 'jiutouji', set: '狮驼', material: '金翅羽',  count: 1, chapter: 3 },
  { out: 'jinhuayin',base: 'pengyu',  set: '狮驼', material: '狮驼骨',  count: 2, chapter: 3 },
  { out: 'mangzhu_top', base: 'mangzhu', set: '狮驼', material: '巨蟒涎', count: 2, chapter: 3 },
  { out: 'gongwu_top',  base: 'gongwu', set: '狮驼', material: '巨蟒涎', count: 2, chapter: 3 },
  // ===== 第四章·合成配方（难61-81）·凌云套三件套 =====
  { out: 'chanyu',   base: 'shajingshi', set: '凌云', material: '天竺佛香', count: 1, chapter: 4 },
  { out: 'biantong', base: 'meiban',   set: '凌云', material: '凌云木',  count: 1, chapter: 4 },
  { out: 'yuehua_top', base: 'yuehua', set: '凌云', material: '月宫桂', count: 2, chapter: 4 },
  { out: 'xijiao_top', base: 'xijiao', set: '凌云', material: '月宫桂', count: 2, chapter: 4 },
  // ===== 多重合成配方（T3 升阶）：T2 套装成品 + 高阶材料「二次合成」 =====
  // 基础三套（破军/玄武/贪狼）：由 T2 成品再熔高阶材料
  { out: 'set_weapon_t3',  set: '破军', base: 'set_weapon_top',  materials: { '兜率火': 2, '三昧烬': 1 }, chapter: 2, growth: true, multi: true },
  { out: 'set_armor_t3',   set: '玄武', base: 'set_armor_top',   materials: { '狮驼骨': 2, '金翅羽': 1 }, chapter: 2, growth: true, multi: true },
  { out: 'set_treasure_t3',set: '贪狼', base: 'set_treasure_top',materials: { '金翅羽': 2, '巨蟒涎': 1 }, chapter: 2, growth: true, multi: true },
  // ===== 六道专职·隐/逆 旧三件套合成链已由 V8.42 四件套升级链取代（组件 comps 配方见 RECIPES 尾部） =====
  // 黑风套 T3
  { out: 'heifeng_w_t3', set: '黑风', base: 'jingangying_top', materials: { '狮驼骨': 2, '金翅羽': 1 }, chapter: 3, growth: true, multi: true },
  { out: 'heifeng_a_t3', set: '黑风', base: 'hunkui',         materials: { '狮驼骨': 2, '巨蟒涎': 1 }, chapter: 3, growth: true, multi: true },
  { out: 'heifeng_t_t3', set: '黑风', base: 'sanmei_top',     materials: { '金翅羽': 2, '兜率火': 1 }, chapter: 3, growth: true, multi: true },
  // 狮驼套 T3
  { out: 'shituo_w_t3', set: '狮驼', base: 'tianying',   materials: { '天竺佛香': 2, '月宫桂': 1 }, chapter: 4, growth: true, multi: true },
  { out: 'shituo_a_t3', set: '狮驼', base: 'gongwu_top', materials: { '凌云木': 2, '天竺佛香': 1 }, chapter: 4, growth: true, multi: true },
  { out: 'shituo_t_t3', set: '狮驼', base: 'mangzhu_top', materials: { '月宫桂': 2, '凌云木': 1 }, chapter: 4, growth: true, multi: true },
  // 凌云套 T3（终局毕业）
  { out: 'lingyun_w_t3', set: '凌云', base: 'xijiao_top', materials: { '天竺佛香': 2, '月宫桂': 2 }, chapter: 4, growth: true, multi: true },
  { out: 'lingyun_a_t3', set: '凌云', base: 'biantong',  materials: { '凌云木': 2, '天竺佛香': 2 }, chapter: 4, growth: true, multi: true },
  { out: 'lingyun_t_t3', set: '凌云', base: 'yuehua_top', materials: { '月宫桂': 2, '凌云木': 2 }, chapter: 4, growth: true, multi: true },
  // ===== 八套合成套装·T2 配方（V8.23·基座+材料→成品） =====
  // —— 第一章·天命套 T2 ——
  { out: 'tm_w_top', set: '天命', base: 'tm_w_base', materials: { '灵筋': 1, '玄武·鳞': 1 }, chapter: 1 },
  { out: 'tm_a_top', set: '天命', base: 'tm_a_base', materials: { '玄武·心': 1, '定风珠碎片': 1 }, chapter: 1 },
  { out: 'tm_t_top', set: '天命', base: 'tm_t_base', materials: { '灵筋': 1, '乌巢心经': 1 }, chapter: 1 },
  // —— 第一章·渡厄套 T2 ——
  { out: 'de_w_top', set: '渡厄', base: 'de_w_base', materials: { '玄武·鳞': 1, '定风珠碎片': 1 }, chapter: 1 },
  { out: 'de_a_top', set: '渡厄', base: 'de_a_base', materials: { '玄武·心': 2, '灵筋': 1 }, chapter: 1 },
  { out: 'de_t_top', set: '渡厄', base: 'de_t_base', materials: { '定风珠碎片': 2, '乌巢心经': 1 }, chapter: 1 },
  // —— 第二章·镇妖套 T2 ——
  { out: 'zy_w_top', set: '镇妖', base: 'zy_w_base', materials: { '兜率火': 1, '三昧烬': 1 }, chapter: 2 },
  { out: 'zy_a_top', set: '镇妖', base: 'zy_a_base', materials: { '狮驼骨': 1, '兜率火': 1 }, chapter: 2 },
  { out: 'zy_t_top', set: '镇妖', base: 'zy_t_base', materials: { '三昧烬': 1, '金翅羽': 1 }, chapter: 2 },
  // —— 第二章·幽冥套 T2 ——
  { out: 'ym_w_top', set: '幽冥', base: 'ym_w_base', materials: { '狮驼骨': 1, '三昧烬': 1 }, chapter: 2 },
  { out: 'ym_a_top', set: '幽冥', base: 'ym_a_base', materials: { '金翅羽': 1, '兜率火': 1 }, chapter: 2 },
  { out: 'ym_t_top', set: '幽冥', base: 'ym_t_base', materials: { '狮驼骨': 1, '金翅羽': 1 }, chapter: 2 },
  // —— 第三章·涅槃套 T2 ——
  { out: 'np_w_top', set: '涅槃', base: 'np_w_base', materials: { '天竺佛香': 1, '月宫桂': 1 }, chapter: 3 },
  { out: 'np_a_top', set: '涅槃', base: 'np_a_base', materials: { '凌云木': 1, '天竺佛香': 1 }, chapter: 3 },
  { out: 'np_t_top', set: '涅槃', base: 'np_t_base', materials: { '月宫桂': 1, '凌云木': 1 }, chapter: 3 },
  // —— 第三章·降魔套 T2 ——
  { out: 'jm_w_top', set: '降魔', base: 'jm_w_base', materials: { '天竺佛香': 2, '三昧烬': 1 }, chapter: 3 },
  { out: 'jm_a_top', set: '降魔', base: 'jm_a_base', materials: { '狮驼骨': 2, '天竺佛香': 1 }, chapter: 3 },
  { out: 'jm_t_top', set: '降魔', base: 'jm_t_base', materials: { '金翅羽': 2, '兜率火': 1 }, chapter: 3 },
  // —— 第四章·封神套 T2 ——
  { out: 'fs_w_top', set: '封神', base: 'fs_w_base', materials: { '天竺佛香': 2, '月宫桂': 1 }, chapter: 4 },
  { out: 'fs_a_top', set: '封神', base: 'fs_a_base', materials: { '凌云木': 2, '天竺佛香': 1 }, chapter: 4 },
  { out: 'fs_t_top', set: '封神', base: 'fs_t_base', materials: { '月宫桂': 2, '凌云木': 1 }, chapter: 4 },
  // —— 第四章·轮回套 T2 ——
  { out: 'lh_w_top', set: '轮回', base: 'lh_w_base', materials: { '天竺佛香': 1, '金翅羽': 2 }, chapter: 4 },
  { out: 'lh_a_top', set: '轮回', base: 'lh_a_base', materials: { '凌云木': 2, '月宫桂': 1 }, chapter: 4 },
  { out: 'lh_t_top', set: '轮回', base: 'lh_t_base', materials: { '月宫桂': 2, '金翅羽': 1 }, chapter: 4 },
  // ===== 八套合成套装·T3 配方（多重合成） =====
  // —— 第一章·天命套 T3 ——
  { out: 'tm_w_t3', set: '天命', base: 'tm_w_top', materials: { '兜率火': 2, '三昧烬': 1 }, chapter: 2, growth: true, multi: true },
  { out: 'tm_a_t3', set: '天命', base: 'tm_a_top', materials: { '狮驼骨': 2, '巨蟒涎': 1 }, chapter: 2, growth: true, multi: true },
  { out: 'tm_t_t3', set: '天命', base: 'tm_t_top', materials: { '金翅羽': 2, '兜率火': 1 }, chapter: 2, growth: true, multi: true },
  // —— 第一章·渡厄套 T3 ——
  { out: 'de_w_t3', set: '渡厄', base: 'de_w_top', materials: { '狮驼骨': 2, '三昧烬': 1 }, chapter: 2, growth: true, multi: true },
  { out: 'de_a_t3', set: '渡厄', base: 'de_a_top', materials: { '金翅羽': 2, '兜率火': 1 }, chapter: 2, growth: true, multi: true },
  { out: 'de_t_t3', set: '渡厄', base: 'de_t_top', materials: { '狮驼骨': 2, '金翅羽': 1 }, chapter: 2, growth: true, multi: true },
  // —— 第二章·镇妖套 T3 ——
  { out: 'zy_w_t3', set: '镇妖', base: 'zy_w_top', materials: { '天竺佛香': 2, '月宫桂': 1 }, chapter: 3, growth: true, multi: true },
  { out: 'zy_a_t3', set: '镇妖', base: 'zy_a_top', materials: { '凌云木': 2, '天竺佛香': 1 }, chapter: 3, growth: true, multi: true },
  { out: 'zy_t_t3', set: '镇妖', base: 'zy_t_top', materials: { '月宫桂': 2, '凌云木': 1 }, chapter: 3, growth: true, multi: true },
  // —— 第二章·幽冥套 T3 ——
  { out: 'ym_w_t3', set: '幽冥', base: 'ym_w_top', materials: { '天竺佛香': 2, '金翅羽': 1 }, chapter: 3, growth: true, multi: true },
  { out: 'ym_a_t3', set: '幽冥', base: 'ym_a_top', materials: { '凌云木': 2, '月宫桂': 1 }, chapter: 3, growth: true, multi: true },
  { out: 'ym_t_t3', set: '幽冥', base: 'ym_t_top', materials: { '月宫桂': 2, '凌云木': 1 }, chapter: 3, growth: true, multi: true },
  // —— 第三章·涅槃套 T3 ——
  { out: 'np_w_t3', set: '涅槃', base: 'np_w_top', materials: { '天竺佛香': 2, '月宫桂': 2 }, chapter: 4, growth: true, multi: true },
  { out: 'np_a_t3', set: '涅槃', base: 'np_a_top', materials: { '凌云木': 2, '天竺佛香': 2 }, chapter: 4, growth: true, multi: true },
  { out: 'np_t_t3', set: '涅槃', base: 'np_t_top', materials: { '月宫桂': 2, '凌云木': 2 }, chapter: 4, growth: true, multi: true },
  // —— 第三章·降魔套 T3 ——
  { out: 'jm_w_t3', set: '降魔', base: 'jm_w_top', materials: { '天竺佛香': 3, '月宫桂': 1 }, chapter: 4, growth: true, multi: true },
  { out: 'jm_a_t3', set: '降魔', base: 'jm_a_top', materials: { '凌云木': 3, '天竺佛香': 1 }, chapter: 4, growth: true, multi: true },
  { out: 'jm_t_t3', set: '降魔', base: 'jm_t_top', materials: { '月宫桂': 3, '凌云木': 1 }, chapter: 4, growth: true, multi: true },
  // —— 第四章·封神套 T3 ——
  { out: 'fs_w_t3', set: '封神', base: 'fs_w_top', materials: { '天竺佛香': 3, '月宫桂': 2 }, chapter: 4, growth: true, multi: true },
  { out: 'fs_a_t3', set: '封神', base: 'fs_a_top', materials: { '凌云木': 3, '天竺佛香': 2 }, chapter: 4, growth: true, multi: true },
  { out: 'fs_t_t3', set: '封神', base: 'fs_t_top', materials: { '月宫桂': 3, '凌云木': 2 }, chapter: 4, growth: true, multi: true },
  // —— 第四章·轮回套 T3 ——
  { out: 'lh_w_t3', set: '轮回', base: 'lh_w_top', materials: { '天竺佛香': 2, '金翅羽': 2 }, chapter: 4, growth: true, multi: true },
  { out: 'lh_a_t3', set: '轮回', base: 'lh_a_top', materials: { '凌云木': 3, '金翅羽': 1 }, chapter: 4, growth: true, multi: true },
  { out: 'lh_t_t3', set: '轮回', base: 'lh_t_top', materials: { '月宫桂': 3, '金翅羽': 1 }, chapter: 4, growth: true, multi: true },
  // ========== 灵宠进化公式（petEvolve 标记） ==========
  // 小黑龙 → 三分支进化
  { out: 'shuijingmolang',  petEvolve: true, base: 'xiaoheilong', materials: { '龙鳞': 2, '净水珠': 1 }, chapter: 2 },
  { out: 'lieyanhuolong',   petEvolve: true, base: 'xiaoheilong', materials: { '龙鳞': 2, '火精': 1 }, chapter: 2 },
  { out: 'puzhaozhenlong',  petEvolve: true, base: 'xiaoheilong', materials: { '龙鳞': 2, '佛光舍利': 1 }, chapter: 2 },
  // 小石猴 → 通臂猿猴
  { out: 'tongbiyuanhou',   petEvolve: true, base: 'xiaoshihou', materials: { '灵石': 2, '猿毛': 1 }, chapter: 2 },
  // 金蟾 → 金蟾·灵
  { out: 'jinchan_er',      petEvolve: true, base: 'jinchan', materials: { '金叶': 2, '灵泉': 1 }, chapter: 2 },
  // 人参果仔 → 人参果·灵
  { out: 'renshanguozi_er', petEvolve: true, base: 'renshanguozi', materials: { '灵泉': 2, '仙土': 1 }, chapter: 2 },
  // —— V8.22 洪荒百兽·进化链（多重组合：同本体可走不同进化方向；材料复用既有素材）——
  { out: 'lingyan_ju',   petEvolve: true, base: 'lingyan',     materials: { '灵石': 2, '仙土': 1 }, chapter: 2 },   // 灵岩幼兽→灵岩巨像
  { out: 'yanlin_wang',  petEvolve: true, base: 'yanlin',      materials: { '灵石': 1, '龙鳞': 1 }, chapter: 2 },   // 岩鳞石卫→岩甲兽王
  { out: 'yueying',      petEvolve: true, base: 'qingyuehu',   materials: { '灵泉': 2, '净水珠': 1 }, chapter: 3 },   // 清月灵狐→月影妖狐
  { out: 'xueqi',        petEvolve: true, base: 'taxue',       materials: { '灵泉': 1, '仙土': 1 }, chapter: 3 },   // 踏雪灵鹿→雪羽麒麟
  { out: 'youming',      petEvolve: true, base: 'huangzhonghu',materials: { '龙鳞': 1, '灵泉': 1 }, chapter: 4 },   // 荒冢灵狐→幽冥妖狐
  { out: 'jialan_he',    petEvolve: true, base: 'huangzhonghu',materials: { '佛光舍利': 2, '灵泉': 1 }, chapter: 5 }, // 荒冢灵狐→迦蓝灵鹤（二选一）
  { out: 'fanyin_he',    petEvolve: true, base: 'huangzhonghu',materials: { '佛光舍利': 1, '金叶': 1 }, chapter: 5 }, // 荒冢灵狐→梵音灵鹤（二选一）
  { out: 'huangyuan',    petEvolve: true, base: 'shilang',     materials: { '龙鳞': 1, '火精': 1 }, chapter: 4 },   // 噬骨狼崽→荒原狼王
  { out: 'qietian',      petEvolve: true, base: 'xunzhen',     materials: { '火精': 2, '金叶': 1 }, chapter: 5 },   // 寻珍风狸→窃天灵貂
  { out: 'baiyu',        petEvolve: true, base: 'xunzhen',     materials: { '火精': 2, '灵泉': 1 }, chapter: 5 },   // 寻珍风狸→白羽风王
  { out: 'huangyan',     petEvolve: true, base: 'qingzhang',   materials: { '火精': 1, '金叶': 1 }, chapter: 5 },   // 清瘴萤灵→煌炎萤灵
  { out: 'diting',       petEvolve: true, base: 'ditingyou',   materials: { '佛光舍利': 3, '净水珠': 1 }, chapter: 6 }, // 谛听幼兽→谛听·明心
  { out: 'tongbishiyuan',petEvolve: true, base: 'xiaoshihou',  materials: { '佛光舍利': 2, '猿毛': 2 }, chapter: 7 }, // 小石猴→通臂石猿（证道·隐藏，多组合链之一）
  // ========== 贪狼升级链：四件套 → 组件 → 套装隐藏职三转 ==========
  // 设计口径（用户拍板）：四件初级套→合成组件1→隐藏一转；四件中级套→合成组件2（1+2合成）→隐藏二转；
  //   4 升级组件→合成组件3（1+2+3合成）→隐藏三转。组件为包裹道具，不占装备格，包裹中生效。
  // 组件1：四件 T1 基座 熔铸 → 贪狼·聚灵（一转）
  { out: 'tl_comp1', set: '贪狼', comps: ['tl_w1', 'tl_a1', 'tl_h1', 'tl_b1'], chapter: 1 },
  // 组件2：组件1 + 四件 T2 基座 熔铸 → 贪狼·凝魂（二转）
  { out: 'tl_comp2', set: '贪狼', comps: ['tl_comp1', 'tl_w2', 'tl_a2', 'tl_h2', 'tl_b2'], chapter: 2 },
  // 组件3：组件2 + 四件 T3 基座 + 专属遗物残片 熔铸 → 贪狼·天狼（三转，L5）
  // relicId：夺均 L5 需唯一专属遗物（材料入库 via ZHUANJIE.giveRelic），杜绝纯随机卡死三转（设计定稿 §6.2）
  { out: 'tl_comp3', set: '贪狼', comps: ['tl_comp2', 'tl_w3', 'tl_a3', 'tl_h3', 'tl_b3'], relicId: 'yinyuan_zl', chapter: 3 },
  // ============ 六道同构升级链配方（V8.42）：破军/玄武/影遁/逆命 ============
  // 与贪狼同构：四件 T1→组件1(一转)；组件1+四件 T2→组件2(二转)；组件2+四件 T3→组件3(三转)
  // —— 破军（战·攻击向）——
  { out: 'pw_comp1', set: '破军', comps: ['pw_w1', 'pw_a1', 'pw_h1', 'pw_b1'], chapter: 1 },
  { out: 'pw_comp2', set: '破军', comps: ['pw_comp1', 'pw_w2', 'pw_a2', 'pw_h2', 'pw_b2'], chapter: 2 },
  { out: 'pw_comp3', set: '破军', comps: ['pw_comp2', 'pw_w3', 'pw_a3', 'pw_h3', 'pw_b3'], relicId: 'pojun_cui', chapter: 3 },
  // —— 玄武（渡·防御向）——
  { out: 'xw_comp1', set: '玄武', comps: ['xw_w1', 'xw_a1', 'xw_h1', 'xw_b1'], chapter: 1 },
  { out: 'xw_comp2', set: '玄武', comps: ['xw_comp1', 'xw_w2', 'xw_a2', 'xw_h2', 'xw_b2'], chapter: 2 },
  { out: 'xw_comp3', set: '玄武', comps: ['xw_comp2', 'xw_w3', 'xw_a3', 'xw_h3', 'xw_b3'], relicId: 'xuanwu_lingjia', chapter: 3 },
  // —— 影遁（隐·闪避向）——
  { out: 'yd_comp1', set: '影遁', comps: ['yd_w1', 'yd_a1', 'yd_h1', 'yd_b1'], chapter: 1 },
  { out: 'yd_comp2', set: '影遁', comps: ['yd_comp1', 'yd_w2', 'yd_a2', 'yd_h2', 'yd_b2'], chapter: 2 },
  { out: 'yd_comp3', set: '影遁', comps: ['yd_comp2', 'yd_w3', 'yd_a3', 'yd_h3', 'yd_b3'], relicId: 'yingdun_ys', chapter: 3 },
  // —— 逆命（逆·全加向）——
  { out: 'nm_comp1', set: '逆命', comps: ['nm_w1', 'nm_a1', 'nm_h1', 'nm_b1'], chapter: 1 },
  { out: 'nm_comp2', set: '逆命', comps: ['nm_comp1', 'nm_w2', 'nm_a2', 'nm_h2', 'nm_b2'], chapter: 2 },
  { out: 'nm_comp3', set: '逆命', comps: ['nm_comp2', 'nm_w3', 'nm_a3', 'nm_h3', 'nm_b3'], relicId: 'niming_luan', chapter: 3 },
  // —— 饕餮（夺·掠夺向）——
  { out: 'tt_comp1', set: '饕餮', comps: ['tt_w1', 'tt_a1', 'tt_h1', 'tt_b1'], chapter: 1 },
  { out: 'tt_comp2', set: '饕餮', comps: ['tt_comp1', 'tt_w2', 'tt_a2', 'tt_h2', 'tt_b2'], chapter: 2 },
  { out: 'tt_comp3', set: '饕餮', comps: ['tt_comp2', 'tt_w3', 'tt_a3', 'tt_h3', 'tt_b3'], relicId: 'tanlan_ya', chapter: 3 },
  // ===== V8.44 事件装备·多样化合成（不设 set，故无劫难前置；基座为事件专属装备，天然需要多走事件收集） =====
  { out: 'cf_wa_shashen', name: '双件套·弑神不坏', comps: ['ev_w_langya', 'ev_a_wudang'], chapter: 3 },   // 武器+甲胄 → 双件套武器栏
  { out: 'cf_t_hunhe', name: '高级饰品·混元社稷', comps: ['ev_t_hunyuan', 'ev_t_shanhe'], chapter: 3 },   // 法宝+法宝 → 高级饰品
  { out: 'cf_a_wudangjin', name: '甲胄升级·无当金身', set: '无当', base: 'ev_a_wudang', materials: { '天竺佛香': 1, '凌云木': 2 }, chapter: 3, growth: true }, // 单防具+材料 → 升级
  // ===== V8.50 游历散宝·进阶合成（eventCombo：土地庙装备组合面板专属入口；无 set、无劫难前置） =====
  // 初等散宝 + 组合件 → 中等锻造散宝
  { out: 'adv_w_jingang_mk', name: '精钢戒刀·锻', comps: ['adv_w_lvdao', 'cmp_xuantie'], eventCombo: true },
  { out: 'adv_a_bailian_mk', name: '百炼甲·锻', comps: ['adv_a_buyi', 'cmp_xuantie'], eventCombo: true },
  { out: 'adv_b_jifeng_mk', name: '疾风靴·锻', comps: ['adv_b_caoxie', 'cmp_xuantie'], eventCombo: true },
  { out: 'adv_t_bixie_mk', name: '辟邪符·锻', comps: ['adv_t_tongling', 'cmp_xuantie'], eventCombo: true },
  // 中等锻造散宝 + 升级件 → 顶级锻造散宝
  { out: 'adv_w_wanjun_mk', name: '镇妖万钧杵·锻', comps: ['adv_w_jingang_mk', 'upg_cuiling'], eventCombo: true },
  { out: 'adv_a_jiuzhuan_mk', name: '九转金身甲·锻', comps: ['adv_a_bailian_mk', 'upg_cuiling'], eventCombo: true },
  { out: 'adv_b_zhuri_mk', name: '逐日靴·锻', comps: ['adv_b_jifeng_mk', 'upg_duanhun'], eventCombo: true },
  { out: 'adv_t_qiankun_mk', name: '乾坤宝镜·锻', comps: ['adv_t_bixie_mk', 'upg_duanhun'], eventCombo: true },
  // —— 精炼（V8.51）：精英原生散宝本是死端，接入顶链，使每一件掉落都有组合去处 ——
  //   adv_w_jingang（精英原生·中）＋ 淬灵砂 → 顶级·mk；与其「低装＋玄铁→中·锻＋灵砂→顶」并存为双配方（引擎取首个可满足者）。
  { out: 'adv_w_wanjun_mk', name: '镇妖万钧杵·锻', comps: ['adv_w_jingang', 'upg_cuiling'], eventCombo: true },
  { out: 'adv_a_jiuzhuan_mk', name: '九转金身甲·锻', comps: ['adv_a_bailian', 'upg_cuiling'], eventCombo: true },
  { out: 'adv_b_zhuri_mk', name: '逐日靴·锻', comps: ['adv_b_jifeng', 'upg_duanhun'], eventCombo: true },
  { out: 'adv_t_qiankun_mk', name: '乾坤宝镜·锻', comps: ['adv_t_bixie', 'upg_duanhun'], eventCombo: true },
  // 事件装备 + 组合件/升级件 → 进阶事件装备（长事件链装备也可再上一层）
  { out: 'ev_w_nilin2', name: '逆鳞刀·淬', comps: ['ev_w_nilin', 'cmp_xuantie'], eventCombo: true },
  { out: 'ev_a_fentian2', name: '焚天甲·淬', comps: ['ev_a_fentian', 'upg_cuiling'], eventCombo: true },
  { out: 'ev_w_liuzhi2', name: '柳杖·净·淬', comps: ['ev_w_liuzhi', 'cmp_lingyun'], eventCombo: true },
  { out: 'ev_a_gongde2', name: '功德袈裟·淬', comps: ['ev_a_gongde', 'upg_cuiling'], eventCombo: true },
  { out: 'ev_h_pilu2', name: '毗卢冠·淬', comps: ['ev_h_pilu', 'cmp_lingyun'], eventCombo: true },
  { out: 'ev_b_dengyun2', name: '登云履·淬', comps: ['ev_b_dengyun', 'upg_duanhun'], eventCombo: true },
  { out: 'ev_t_hunyuan2', name: '混元袋·淬', comps: ['ev_t_hunyuan', 'cmp_yaohun'], eventCombo: true },
  // 顶级组合件 + 天工谱 → 圆满（冒险日记式超多组合收束）
  { out: 'cf_wa_shashen2', name: '弑神·不坏·双绝·圆满', comps: ['cf_wa_shashen', 'cmp_tiangong'], eventCombo: true },
  { out: 'cf_t_hunhe2', name: '混元社稷图·圆满', comps: ['cf_t_hunhe', 'cmp_tiangong'], eventCombo: true },
  { out: 'cf_a_wudangjin2', name: '无当金身·圆满', comps: ['cf_a_wudangjin', 'cmp_tiangong'], eventCombo: true },
  // ===== V8.52 渡/逆顶级事件装备·组合件/升级件升级链（次级事件装备 + 组合件/升级件 → 对应路线顶级） =====
  // 每路线 5 槽位均可由次级事件装备淬至顶级：事件渠道（高地区发放）与合成渠道（次级+材料）双轨获取，
  // 强化「每条路线选择更丰富 + 组合件/升级件有去处」——与游历散宝「初等→锻→顶」链同构。
  // —— 渡线（法伤/渡化/回血向）——
  { out: 'ev_w_jiedu', name: '净渡锡杖', comps: ['ev_w_liuzhi', 'cmp_lingyun'], eventCombo: true },
  { out: 'ev_a_puti', name: '菩提金身', comps: ['ev_a_gongde', 'upg_cuiling'], eventCombo: true },
  { out: 'ev_h_rulaizang', name: '如来藏冠', comps: ['ev_h_baoxiang', 'cmp_lingyun'], eventCombo: true },
  { out: 'ev_b_jieyin', name: '接引莲台靴', comps: ['ev_b_lianbu', 'upg_duanhun'], eventCombo: true },
  { out: 'ev_t_bafu', name: '八宝功德斛', comps: ['ev_t_ganlu', 'upg_cuiling'], eventCombo: true },
  // —— 逆线（物攻/破甲/掠夺向）——
  { out: 'ev_w_kuanglong', name: '狂龙戟', comps: ['ev_w_nilin', 'cmp_yaohun'], eventCombo: true },
  { out: 'ev_a_mojiang', name: '魔将玄甲', comps: ['ev_a_fentian', 'upg_cuiling'], eventCombo: true },
  { out: 'ev_h_zhanshen', name: '战神冠', comps: ['ev_h_xiuluo', 'cmp_lingyun'], eventCombo: true },
  { out: 'ev_b_yasha', name: '夜叉逐风靴', comps: ['ev_b_tahuo', 'upg_duanhun'], eventCombo: true },
  { out: 'ev_t_panyu', name: '盘狱炼魂铃', comps: ['ev_t_yehuo', 'cmp_yaohun'], eventCombo: true },
  // —— V9.9 心魔隐藏线：镜痕（镜本我战取胜所得）熔铸明镜套 ——
  { out: 'mj_w', name: '明镜·照心剑', materials: { '镜痕': 1 } },
  { out: 'mj_a', name: '明镜·无尘甲', materials: { '镜痕': 1 } },
  { out: 'mj_h', name: '明镜·破妄冠', materials: { '镜痕': 1 } },
  { out: 'mj_b', name: '明镜·踏影履', materials: { '镜痕': 1 } },
  { out: 'mj_t', name: '明镜·观心台', materials: { '镜痕': 1 } },
  { out: 'mj_stone', name: '明镜升级石', materials: { '镜痕': 2 } },
  { out: 'mj_comp1', name: '明镜·照心', comps: ['mj_w', 'mj_a', 'mj_h'] },
];

// 合成劫难前置（V40 新增）：某些组件的合成必须经过特定劫难——逃课（绕开劫难）则无法铸成。
//   · 八戒隐藏套（set='八戒'）→ 需历经八戒特定的九次劫难（天蓬身份线）
//   · 章节套（黑风/狮驼/凌云）→ 需历经本章范围内的关键劫难（从 HIDDEN_TRIAL_REQ 取本章难号）
//   · 其余（通用三套、各英雄初始套）→ 无劫难约束（基础合成，人人可铸）
// 返回：null 表示无约束；数组表示「需全部经过」；{ any:true, req:[...] } 表示「本章任一劫难即可」（8.11：放宽狮驼套等章节套过严问题）
NDX._recipeReqTrials = function (r) {
  if (!r || !r.set) return null;
  // 英雄初始套「章节成长线」配方不附加隐藏劫难约束，保证随章节自然升级。
  if (r.growth) return null;
  if (r.set === '八戒') return (NDX.HIDDEN_TRIAL_REQ.bajie || []).slice();
  if (['黑风', '狮驼', '凌云'].indexOf(r.set) >= 0 && r.chapter) {
    const lo = (r.chapter - 1) * 20, hi = r.chapter * 20;
    const set = new Set();
    Object.keys(NDX.HIDDEN_TRIAL_REQ).forEach((h) => {
      (NDX.HIDDEN_TRIAL_REQ[h] || []).forEach((d) => { if (d > lo && d <= hi) set.add(d); });
    });
    // 8.11：章节套只需「本章任一关键劫难」即可解锁，避免三件套强制同时历全部暗线（如狮驼套 ch3 原需 35+39 双难）
    return { any: true, req: [...set] };
  }
  return null;
};

NDX.craftById = function (id) {
  return NDX.CRAFT_POOL.find((e) => e.id === id);
};

  /* ============================ 关隘法宝掉落 BOSS_REWARDS ============================ */
NDX.BOSS_REWARDS = {
  1: [
    { id: 'bf_dinghai',      name: '定海神针·仿', slot: 'treasure', treasure: true, treasureId: 'bf_dinghai', phase: 'in',  charges: 3, atk: 40, hp: 200, dr: 0.05, cri: 0.05, matk: 10, mdef: 0.03, desc: '【第一章·天命】大圣遗物，天命所归。仿大圣定海神针：体攻+40，气血+200，护体+5%，暴击+5%；临阵可祭出重创妖敌。' },
    { id: 'bf_jingangzhuo',  name: '金刚琢',     slot: 'treasure', treasure: true, treasureId: 'bf_jingangzhuo', phase: 'both', charges: 2, hp: 250, dr: 0.08, mdef: 0.05, desc: '【第一章·渡厄】老君法器，渡劫护身。太上老君金刚琢：气血+250，护体+8%，御念+5%；临阵/化缘皆可用，削敌来势。' },
    { id: 'bf_zijinling',    name: '紫金铃·仿',  slot: 'treasure', treasure: true, treasureId: 'bf_zijinling', phase: 'both', charges: 2, matk: 30, mdef: 0.06, hp: 200, desc: '【第一章·渡厄】观音慈悲，渡厄众生。仿观音紫金铃：愿伤+30，御念+6%，气血+200；临阵摄魂伤敌并回护自身。' },
  ],
  2: [
    { id: 'bf_baojiao_zhen', name: '芭蕉扇·真',  slot: 'treasure', treasure: true, treasureId: 'bf_baojiao_zhen', phase: 'both', charges: 2, atk: 30, hp: 300, dr: 0.05, matk: 20, desc: '【第二章·幽冥】罗刹阴风，幽冥暗杀。罗刹真芭蕉扇：体攻+30，气血+300，护体+5%，愿伤+20；一扇阴风重创妖敌。' },
    { id: 'bf_sanmei',       name: '三昧真火炉', slot: 'treasure', treasure: true, treasureId: 'bf_sanmei', phase: 'in',  charges: 2, atk: 50, matk: 40, hp: 150, desc: '【第二章·镇妖】三昧真火，镇妖炼邪。三昧真火炉：体攻+50，愿伤+40，气血+150；临阵喷火重创妖敌。' },
    { id: 'bf_bihuo',        name: '避火罩',     slot: 'treasure', treasure: true, treasureId: 'bf_bihuo', phase: 'out', charges: 3, hp: 400, dr: 0.10, desc: '【第二章·镇妖】避火破阵，镇妖先锋。避火罩：气血+400，护体+10%；非战斗引甘露回满气血。' },
  ],
  3: [
    { id: 'bf_yinerping',    name: '阴阳二气瓶', slot: 'treasure', treasure: true, treasureId: 'bf_yinerping', phase: 'in',  charges: 1, atk: 60, hp: 200, desc: '【第三章·降魔】阴阳收妖，降魔伏邪。阴阳二气瓶：体攻+60，气血+200；临阵吞噬妖敌过半气血，可破死劫。' },
    { id: 'bf_renzhongdai',  name: '人种袋',     slot: 'treasure', treasure: true, treasureId: 'bf_renzhongdai', phase: 'in',  charges: 2, hp: 300, dr: 0.05, desc: '【第三章·降魔】黄眉摄妖，降魔收邪。人种袋：气血+300，护体+5%；临阵摄敌并削其来势。' },
    { id: 'bf_jinnao',       name: '金铙',       slot: 'treasure', treasure: true, treasureId: 'bf_jinnao', phase: 'both', charges: 2, mdef: 0.10, hp: 250, desc: '【第三章·涅槃】金铙护身，涅槃回韵。金铙：御念+10%，气血+250；临阵伤敌，化缘余韵护身回血。' },
  ],
  4: [
    { id: 'bf_wuzizhenjing', name: '无字真经',   slot: 'treasure', treasure: true, treasureId: 'bf_wuzizhenjing', phase: 'both', charges: 3, hp: 500, dr: 0.10, matk: 50, mdef: 0.05, desc: '【第四章·轮回】无字真经，轮回悟道。无字真经：气血+500，护体+10%，愿伤+50，御念+5%；化缘回满、临阵化刃。' },
    { id: 'bf_lunhui',       name: '轮回镜',     slot: 'treasure', treasure: true, treasureId: 'bf_lunhui', phase: 'in',  charges: 1, atk: 80, matk: 80, hp: 300, desc: '【第四章·轮回】轮回镜照，破劫重生。轮回镜：体攻+80，愿伤+80，气血+300；临阵镜照，破劫重创妖敌。' },
    { id: 'bf_puti',         name: '菩提念珠',   slot: 'treasure', treasure: true, treasureId: 'bf_puti', phase: 'both', charges: 2, hp: 600, mdef: 0.15, dr: 0.05, desc: '【第四章·封神】菩提悟道，封神归位。菩提念珠：气血+600，御念+15%，护体+5%；捻珠续命回血并削来敌。' },
  ],
};
// 关隘通关三选一：按章节发放不同的强力法宝（未知/越界章节回退第四章）。
// 返回全新克隆（重置充能），避免污染原型、并便于按当前章节正确发奖。
NDX.bossRewardsFor = (hero, act) => {
  const list = NDX.BOSS_REWARDS[act] || NDX.BOSS_REWARDS[4];
  return (list || []).map((e) => Object.assign({}, e, { chargesLeft: e.charges || 0 }));
};

// 三/四章（逆道开放）关隘 Boss 追加的「金色法宝」：bf_* 级强力主动战技，单章解锁其一，
// 使后期金色法宝掉落概率显著上升。按章解锁（三章起出芭蕉扇·真/三昧真火炉，四章额外出定海神针·仿）。
// 若玩家本局身负逆道劫印（ni），则红阶逆道真器「业火红莲」有概率入池（一局至多一件红宝）。
NDX.goldenBossTreasureFor = (act, state) => {
  const hasNi = state && state.hSeals && state.hSeals.indexOf('ni') >= 0;
  let pool = act >= 4
    ? ['bf_baojiao_zhen', 'bf_sanmei', 'bf_dinghai']
    : ['bf_baojiao_zhen', 'bf_sanmei'];
  // S1-6：三件 red 级逆道真器（灭世黑莲/万毒蛊经/战神魔铠）曾在 TREASURES 有定义却无任何获取口，
  // 玩家永远拿不到。接入逆道专属池，与业火红莲四选一（一局至多一件红宝的约束不变）。
  if (hasNi) pool = pool.concat(['bf_ni_lian', 'bf_ni_mie', 'bf_ni_du', 'bf_ni_zhan']); // 逆道劫印者可获红阶真器
  const id = NDX._pick(pool);
  return NDX.TREASURES[id];
};

// 战斗 AI 底层逻辑 —— 法宝自动分级
// high：金色 / 红色高阶法宝（bf_* 关隘真器与仿品），AI 禁用，必须玩家手动祭出（策略与操作爽点）
// low ：白色 / 蓝色低阶法宝（桃木类套装主动法宝、基础原型、护盾/治疗类），AI 可在血危时自动触发（挂机友好）
NDX.treasureGrade = (id) => {
  if (!id) return 'low';
  if (id.indexOf('bf_') === 0) return 'high';        // 关隘真器 / 仿品（金、红阶）
  return 'low';                                       // 其余主动法宝均视为低阶，可自动
};
// AI 自动祭宝允许的对象：仅 low 阶且战斗中可祭出的主动 / 护盾 / 治疗类
NDX.aiCanAuto = (treasureId) => {
  const T = NDX.TREASURES[treasureId];
  if (!T) return false;
  if (NDX.treasureGrade(treasureId) !== 'low') return false;
  // 仅战场内可祭（in/both），被动类（out/passive）由系统常驻结算、无需祭
  return T.phase === 'in' || T.phase === 'both';
};
// 法宝四档底色：白（浅灰）/ 蓝（浅蓝）/ 金（鎏金）/ 红（暗红鎏金边）
// 与战斗画面「竖屏底部 6 格法宝栏」的分层底色一致。
NDX.treasureTier = (id) => {
  if (!id) return 'white';
  if (id.indexOf('bf_') === 0) {
    const T = NDX.TREASURES[id] || {};
    // 逆道 / 魔气类 → 红阶；其余关隘真器 / 仿品 → 金阶
    if (id.indexOf('ni') >= 0 || id.indexOf('mo') >= 0 || (T.tag === 'red')) return 'red';
    if (T.tag === 'blue') return 'blue';
    return 'gold';
  }
  const T = NDX.TREASURES[id] || {};
  if (T.tag === 'gold') return 'gold';
  if (T.tag === 'blue') return 'blue';
  if (T.tag === 'red') return 'red';
  // 低阶：较强（愿伤 / 高血 / 治疗护身）→ 蓝；其余 → 白
  if (T.matk > 0 || (T.hp && T.hp >= 60) || (T.effect && (T.effect.healPct || T.effect.save))) return 'blue';
  return 'white';
};

// =============================================================
// 法宝体系（treasure system）
// 法宝是「主动使用」的器物，区别于被动装备：玩家需在点选界面/战斗中主动祭出，
// 提升打怪过程的参与感与策略性。每个法宝有：
//   phase : 'out'（非战斗·地图空闲时使用） / 'in'（战斗中祭出） / 'both'（皆可）
//   charges: 可使用次数（用完即尽，需再觅新法宝）
//   effect: 行为描述（被 game.js 的 useItem 解读执行）
//     - healPct / healFlat : 回复自身气血（占上限比例 / 固定值）
//     - dmgPct  / dmgFlat  : 对当前妖敌造成伤害（占敌气血比例 / 固定值）
//     - evil / good        : 使用后增减的善恶（如紫金钵化缘迷失本心）
//     - weakNext           : 非战斗使用→下一战难度-1
//     - capHeal            : 是否直接回满（true=回满气血）
//     - save               : 是否为「救命」类——战斗中若本将败亡，可逆转战局（heal 类在回血后尚存则活；dmg 类在扇灭妖敌则活）
// 说明：战斗胜负由战斗结算预先判定，但「救命」类法宝可在演出中强行逆转，
//       让玩家用一次珍稀法宝换一条命——这正是打怪参与感的核心。

  /* ============================ 法宝库 TREASURES ============================ */
NDX.TREASURES = {
  // —— V9.6 西游释厄传名器（on-hit 被动法宝）：普攻命中按概率触发，phase:'passive' 自动发动、不耗充能、不入祭宝列表 ——
  // 数值 [已调优]（2026-09-14）：6 件名器 on-hit proc 0.18~0.30 均在 procCap 0.35 之下，梯度自洽
  //   （捆仙绳 proc0.18/stun2 弱概率长控 ↔ 金刚琢 proc0.20/stun1 强概率短控）；Boss 豁免 shrink/silence 仅 2 回合。
  //   复核无越界，确认保持原值（具体 proc 未被门禁锁死，故本轮只做审计不改数）。
  zijin_honghulu: {
    dao: '战', name: '紫金红葫芦', phase: 'passive', auto: true, charges: 0, tag: 'gold',
    desc: '太上老君盛丹之器。攻击有 25% 概率将妖敌收作小人——怪物造成伤害骤降 50%（变小），持续 2 回合。',
    effect: { onHit: { proc: 0.25, shrink: 0.5, dur: 2 } },
  },
  jinguo_zhuo: {
    dao: '缘', name: '金刚琢', phase: 'passive', auto: true, charges: 0, tag: 'gold',
    desc: '金钢不坏之圈。攻击有 20% 概率套住妖敌，令其晕眩 1 回合（无法行动）。',
    effect: { onHit: { proc: 0.20, stun: 1 } },
  },
  bajiao_shan: {
    dao: '隐', name: '芭蕉扇', phase: 'passive', auto: true, charges: 0, tag: 'gold',
    desc: '罗刹女之宝扇。攻击有 30% 概率煽出阴风真火，妖敌每回合流失 4% 最大气血（灼烧），持续 2 回合。',
    effect: { onHit: { proc: 0.30, burn: 0.04, dur: 2 } },
  },
  kunxian_sheng: {
    dao: '隐', name: '捆仙绳', phase: 'passive', auto: true, charges: 0, tag: 'gold',
    desc: '惧留孙之缚仙绳。攻击有 18% 概率将妖敌定身，令其 2 回合不得动弹。',
    effect: { onHit: { proc: 0.18, stun: 2 } },
  },
  feilong_zhang: {
    dao: '缘', name: '飞龙宝杖', phase: 'passive', auto: true, charges: 0, tag: 'gold',
    desc: '龙宫镇海之杖。攻击有 28% 概率驯龙压下，妖敌攻击减弱 30%，持续 2 回合。',
    effect: { onHit: { proc: 0.28, slow: 0.30, dur: 2 } },
  },
  jiuhuan_zhang: {
    dao: '渡', name: '九环锡杖', phase: 'passive', auto: true, charges: 0, tag: 'gold',
    desc: '唐僧九环锡杖。攻击有 22% 概率震出佛门圣伤（附加 8% 真伤），并令妖敌沉默 1 回合（技能被禁）。',
    effect: { onHit: { proc: 0.22, silence: 1, trueDmg: 0.08 } },
  },
  // —— V9.6 观音玉净瓶（主动净化，phase:'in' 战斗中可祭出，5 次可土地庙补）——
  ts_jingping: {
    dao: '渡', name: '观音玉净瓶', phase: 'in', charges: 5, tag: 'gold',
    desc: '南海甘露宝瓶。主动：涤荡一身业障，清除全部异常状态（致盲/怯战/灼烧/摄魂/寒封/咒缚/毒蚀/蚀骨），并赐 15% 气血护盾（5/5）；可在土地庙补满。',
    effect: { cleanse: ['all'], shieldPct: 0.15 },
  },
  // —— 紫金钵（取经人）：非战斗回满血，代价是每用一次迷失一分本心（恶+），解锁取经人暗线 ——
  ts_bowl: {
    dao: '渡',
    name: '紫金钵', phase: 'out', charges: 3,
    desc: '非战斗：化缘甘露，回满气血。然每用一次便迷失一分本心（恶+），本心尽失三分成取经人"舍身饲魔"暗线。',
    effect: { capHeal: true, evil: 12 },
  },
  // —— 紫金钵·成长链（取经人）：慈悲渐深，迷失渐浅 ——
  ts_bowl_ci: {
    dao: '渡',
    name: '紫金钵·慈', phase: 'out', charges: 3,
    desc: '非战斗：化缘甘露，回满气血。慈悲渐深，本心代价稍减（恶+8）（第二章成长）。',
    effect: { capHeal: true, evil: 8 },
  },
  ts_bowl_bei: {
    dao: '渡',
    name: '紫金钵·悲悯', phase: 'out', charges: 4,
    desc: '非战斗：化缘甘露，回满气血且佛光护体（下战怪物攻-10%）。本心代价再减（恶+5）（第三章成长）。',
    effect: { capHeal: true, evil: 5, weakNext: 1 },
  },
  ts_bowl_wl: {
    dao: '渡',
    name: '紫金钵·无量', phase: 'out', charges: 5,
    cd: 1,
    desc: '非战斗：化缘甘露，回满气血且佛光普照（下战怪物攻-20%）。本心代价极微（恶+3）（终极·无量）。',
    effect: { capHeal: true, evil: 3, weakNext: 2 },
  },
  // —— 三根救命毫毛（悟空·观世音所赐）：护身禁器，败亡瞬间自行飘落替劫、复活满血，无法主动祭出亦无法补满 ——
  jiuming: {
    dao: '渡',
    name: '三根救命毫毛', phase: 'dead', charges: 3,
    desc: '南海观世音菩萨临行所赐。败亡将临之际，毫毛自行飘落化作替身，替你挡下死劫、于满血中重生（3/3）；不可主动祭出，亦无法在土地庙补满，耗尽即止。',
    effect: { capHeal: true, revive: true },
  },
  // —— 净坛宝盂（八戒）：非战斗回满血+下战减伤，3/3 ——
  bj_bowl: {
    dao: '缘',
    name: '净坛宝盂', phase: 'out', charges: 3,
    desc: '非战斗：净坛化缘，回满气血且饱食护体（下战怪物攻-10%）（3/3）；可在土地庙补满。',
    effect: { capHeal: true, weakNext: 1 },
  },
  // —— 净坛宝盂·成长链（八戒）：饱食护体渐强 ——
  bj_bowl_man: {
    dao: '缘',
    name: '净坛宝盂·满', phase: 'out', charges: 3,
    desc: '非战斗：净坛化缘，回满气血且饱食护体（下战怪物攻-10%）（第二章成长）。',
    effect: { capHeal: true, weakNext: 1 },
  },
  bj_bowl_ying: {
    dao: '缘',
    name: '净坛宝盂·盈', phase: 'out', charges: 3,
    desc: '非战斗：净坛化缘，回满气血且饱食厚护（下战怪物攻-20%）（第三章成长）。',
    effect: { capHeal: true, weakNext: 2 },
  },
  bj_bowl_wl: {
    dao: '缘',
    name: '净坛宝盂·无量', phase: 'out', charges: 5,
    cd: 1,
    desc: '非战斗：净坛化缘，回满气血且饱食极护（下战怪物攻-30%）（终极·无量）。',
    effect: { capHeal: true, weakNext: 3 },
  },
  // —— 降妖念珠（沙僧）：非战斗回满血+降妖削弱，3/3 ——
  ss_bowl: {
    dao: '隐',
    name: '降妖念珠', phase: 'out', charges: 3,
    desc: '非战斗：捻珠诵咒，回满气血且降妖之力加护（下战怪物攻-10%）（3/3）；可在土地庙补满。',
    effect: { capHeal: true, weakNext: 1 },
  },
  // —— 降妖念珠·成长链（沙僧）：降妖之力渐强 ——
  ss_bowl_jing: {
    dao: '隐',
    name: '降妖念珠·净', phase: 'both', charges: 3,
    desc: '非战斗：捻珠诵咒，回满气血且降妖加护（下战怪物攻-10%）；战斗中：佛光伤敌10%（第二章成长）。',
    effect: { capHeal: true, weakNext: 1, dmgPct: 0.10 },
  },
  ss_bowl_fanyin: {
    dao: '隐',
    name: '降妖念珠·梵音', phase: 'both', charges: 4,
    desc: '非战斗：捻珠诵咒，回满气血且降妖厚护（下战怪物攻-20%）；战斗中：佛光伤敌15%（第三章成长）。',
    effect: { capHeal: true, weakNext: 2, dmgPct: 0.15, cleanse: ['poison'] },
  },
  ss_bowl_wl: {
    dao: '隐',
    name: '降妖念珠·无量', phase: 'both', charges: 5,
    cd: 1,
    desc: '非战斗：捻珠诵咒，回满气血且降妖极护（下战怪物攻-30%）；战斗中：佛光伤敌20%（终极·无量）。',
    effect: { capHeal: true, weakNext: 3, dmgPct: 0.20 },
  },
  // —— 避水珠（小白龙）：非战斗回血60%+水遁削弱，3/3 ——
  lm_bowl: {
    dao: '隐',
    name: '避水珠', phase: 'out', charges: 3,
    desc: '非战斗：珠光护体，回复60%气血且水遁加护（下战怪物攻-20%）（3/3）；可在土地庙补满。',
    effect: { healPct: 0.60, weakNext: 2 },
  },
  // —— 芭蕉扇（罗刹神扇）：战斗中一扇，对当前妖敌造成巨量伤害；若能扇灭则反败为胜 ——
  baojiao: {
    dao: '隐',
    name: '芭蕉扇', phase: 'in', charges: 1,
    desc: '战斗中：一扇阴风，破红孩儿三昧真火之灼烧，并重创妖敌约 20% 气血。',
    effect: { cleanse: ['burn'], dmgPct: 0.20 },
  },
  // —— 定风珠：战斗中镇住妖风，回复自身约 35% 气血并令敌攻势稍挫；若回血后尚存则活 ——
  dingfeng: {
    dao: '缘',
    name: '定风珠', phase: 'in', charges: 2,
    desc: '战斗中：定住漫天妖风，化解黄风怪三昧神风之致盲，并回复自身约 20% 气血。',
    effect: { cleanse: ['blind'], healPct: 0.20, shieldPct: 0.2, },
  },
  // —— 紧箍（金箍）：敌人现身（战斗开始）时金箍骤紧，立削其 5%~10% 气血；被动自动发动，不耗充能、不可手动祭出 ——
  jingu: {
    dao: '战',
    name: '紧箍', phase: 'passive', auto: true, charges: 0,
    desc: '被动·敌人现身（战斗开始）时金箍骤紧，立削当前妖敌 5%~10% 气血。自动发动，不耗充能、不可主动祭出。',
    effect: { dmgPctStart: [0.05, 0.10] },
  },
  // —— 紫金红葫芦：战斗中叫一声"宝贝"，按当前敌血概率重创；若收住则胜 ——
  zijinhu: {
    dao: '战',
    name: '紫金红葫芦', phase: 'in', charges: 1,
    desc: '战斗中：葫芦口一开，唤"宝贝"收妖，重创当前妖敌约 40% 气血。若当场收住，则胜。',
    effect: { dmgPct: 0.40, dmgFlat: 30, save: true, cleanse: ['daze'] },
  },
  // —— 照妖镜：非战斗照出前路妖隐（下一战难度-1）；战斗中照妖，使敌现出本相、受创+（造成其约 12% 额外伤） ——
  zhaoyao: {
    dao: '战',
    name: '照妖镜', phase: 'both', charges: 2,
    desc: '非战斗：照出前路妖隐，下一战难度-1。战斗中点照：使敌现本相，立即受创约 12% 气血，并破白骨精之怯战减攻。',
    effect: { weakNext: 1, cleanse: ['atkDown'], dmgPct: 0.12 },
  },
  // —— 金蝉舍利（香火袋）：非战斗化缘，回复约 50% 气血，无本心代价（温和续命） ——
  jinchan: {
    dao: '渡',
    name: '金蝉舍利', phase: 'out', charges: 3,
    desc: '非战斗：捻动舍利，化缘香火，回复约 50% 气血。无迷失本心之虞，最是温和的续命法宝。',
    effect: { healPct: 0.5 },
  },
  // —— 关隘通关·强力法宝（按章节发放，见 NDX.BOSS_REWARDS）——
  bf_dinghai: {
    dao: '战', name: '定海神针·仿', phase: 'in',  charges: 3, chapter: 1, setHint: '天命', desc: '【第一章·天命】大圣遗物，天命所归。战斗中：仿大圣定海神针，对当前妖敌重创约 30% 气血 + 固定重创。若能破劫则胜。', effect: { dmgPct: 0.30, dmgFlat: 40, save: true } },
  bf_jingangzhuo: {
    dao: '缘', name: '金刚琢',     phase: 'both', charges: 2, chapter: 1, setHint: '渡厄', desc: '【第一章·渡厄】老君法器，渡劫护身。非战斗：祭出削敌来势，下一战难度-1；战斗中：罩住妖敌，伤其约 20% 气血。', effect: { weakNext: 1, dmgPct: 0.20, save: true } },
  bf_zijinling: {
    dao: '战', name: '紫金铃·仿',  phase: 'both', charges: 2, chapter: 1, setHint: '渡厄', desc: '【第一章·渡厄】观音慈悲，渡厄众生。战斗中：摇铃摄魂，伤敌约 18% 并回护自身约 30% 气血。', effect: { dmgPct: 0.18, healPct: 0.30, save: true, cleanse: ['curse'], lifestealPct: 0.3, } },
  bf_baojiao_zhen: {
    dao: '隐', name: '芭蕉扇·真',  phase: 'both', charges: 2, chapter: 2, setHint: '幽冥', desc: '【第二章·幽冥】罗刹阴风，幽冥暗杀。战斗中：真芭蕉扇阴风，重创妖敌约 35% 气血 + 固定重创；非战斗亦可扇散火气回血。', effect: { dmgPct: 0.35, dmgFlat: 60, healPct: 0.20, save: true } },
  bf_sanmei: {
    dao: '夺', name: '三昧真火炉', phase: 'in',  charges: 2, chapter: 2, setHint: '镇妖', desc: '【第二章·镇妖】三昧真火，镇妖炼邪。战斗中：炉火喷涌，对当前妖敌重创约 40% 气血。', effect: { dmgPct: 0.40, dmgFlat: 50, save: true, cleanse: ['frost'] } },
  bf_bihuo: {
    dao: '缘', name: '避火罩',     phase: 'out',  charges: 3, chapter: 2, setHint: '镇妖', desc: '【第二章·镇妖】避火破阵，镇妖先锋。非战斗：罩体避火，引甘露回满气血。', effect: { capHeal: true, stunTurns: 1, } },
  bf_yinerping: {
    dao: '夺', name: '阴阳二气瓶', phase: 'in',  charges: 1, chapter: 3, setHint: '降魔', desc: '【第三章·降魔】阴阳收妖，降魔伏邪。战斗中：瓶口一合，吞噬妖敌约 50% 气血。若能收住，则胜。', effect: { dmgPct: 0.50, dmgFlat: 30, save: true, stunTurns: 2, } },
  bf_renzhongdai: {
    dao: '夺', name: '人种袋',     phase: 'in',  charges: 2, chapter: 3, setHint: '降魔', desc: '【第三章·降魔】黄眉摄妖，降魔收邪。战斗中：袋口一张，摄敌约 30% 气血，并削其来势（下一战-1）。', effect: { dmgPct: 0.30, weakNext: 1, save: true, shieldPct: 0.3, } },
  bf_jinnao: {
    dao: '战', name: '金铙',       phase: 'both', charges: 2, chapter: 3, setHint: '涅槃', desc: '【第三章·涅槃】金铙护身，涅槃回韵。战斗中：金铙罩顶，伤敌约 18%；非战斗：余韵护身回血约 40%。', effect: { dmgPct: 0.18, healPct: 0.40, save: true, lifestealPct: 0.2, } },
  bf_wuzizhenjing: {
    dao: '渡', name: '无字真经',   phase: 'both', charges: 3, chapter: 4, setHint: '轮回', desc: '【第四章·轮回】无字真经，轮回悟道。非战斗：真经化缘回满气血；战斗中：经文化刃，伤敌约 28% 气血。', effect: { capHeal: true, dmgPct: 0.28, save: true } },
  bf_lunhui: {
    dao: '渡', name: '轮回镜',     phase: 'in',  charges: 1, chapter: 4, setHint: '轮回', desc: '【第四章·轮回】轮回镜照，破劫重生。战斗中：镜照轮回，对当前妖敌重创约 55% 气血。若能破劫，则胜。', effect: { dmgPct: 0.55, dmgFlat: 40, save: true } },
  bf_puti: {
    dao: '渡', name: '菩提念珠',   phase: 'both', charges: 2, chapter: 4, setHint: '封神', desc: '【第四章·封神】菩提悟道，封神归位。非战斗：捻珠续命，回血约 60% 并削来敌（下一战-1）；战斗中亦可镇心伤敌约 15%。', effect: { healPct: 0.60, weakNext: 1, dmgPct: 0.15, save: true } },
  // —— 红色逆道法宝：一局仅持有一件（逆道劫印解锁的关隘真器），释放时全屏水墨法相 ——
  bf_ni_lian: {
    dao: '逆', name: '逆道·业火红莲', phase: 'in', charges: 2, noRecharge: true, desc: '逆道真器：红莲业火焚尽妖魔，重创当前妖敌约 60% 气血 + 固定重创；若当场焚灭，则胜。红阶法宝，一局仅此一件，唯逆道劫印者可持。不可在土地庙补满，耗尽即止。', effect: { dmgPct: 0.60, dmgFlat: 80, save: true } },
  // —— V8.54 P2-2 逆道真器扩充（red 级，cd=2，每3场可用1次）——
  bf_ni_mie: {
    name: '灭世黑莲', icon: '🖤', tier: 'red', cd: 2, dao: '逆',
    desc: '逆道真器·灭世：黑莲绽放，对妖物造成 45% 最大气血伤害并吸取 30% 为己用（斩杀线以下直接收割）。',
    charges: 2, phase: 'in', save: true,
    effect: { dmgPct: 0.40, lifestealPct: 0.30 },
    counter: { tags: ['佛','天庭'], dmgX: 1.3, note: '对佛门/天庭伤害×1.3' }
  },
  bf_ni_du: {
    name: '万毒蛊经', icon: '☠️', tier: 'red', cd: 2, dao: '逆',
    desc: '逆道真器·万毒：蛊毒噬体，造成 35% 最大气血伤害并眩晕妖物 2 回合（斩杀线以下直接收割）。',
    charges: 2, phase: 'in', save: true,
    effect: { dmgPct: 0.35, stunTurns: 2 },
    counter: { tags: ['妖','兽'], dmgX: 1.3, note: '对妖族/兽族伤害×1.3' }
  },
  bf_ni_zhan: {
    name: '战神魔铠', icon: '⚔️', tier: 'red', cd: 2, dao: '逆',
    desc: '逆道真器·战神：魔铠加身，造成 30% 最大气血伤害并获得 40% 最大气血护盾（斩杀线以下直接收割）。',
    charges: 2, phase: 'in', save: true,
    effect: { dmgPct: 0.30, shieldPct: 0.40 },
    counter: { tags: ['人','仙'], dmgX: 1.3, note: '对人族/仙族伤害×1.3' }
  },
  // —— 8.11 每难专属·成长链法宝 / 转职持有硬门槛件 ——
  jingu_shu: {
    dao: '战', name: '金箍·束缚', phase: 'passive', auto: true, charges: 0, desc: '紧箍第一阶·束缚。悟空专属成长起点（难22掉）；齐天残念转职持有门槛。', effect: { dmgPctStart: [0.04, 0.08] } },
  jingu_zhen: {
    dao: '战', name: '金箍·镇魔', phase: 'passive', auto: true, charges: 0, desc: '紧箍第二阶·镇魔。', effect: { dmgPctStart: [0.06, 0.11] } },
  jingu_po: {
    dao: '战', name: '金箍·破妄', phase: 'passive', auto: true, charges: 0, desc: '紧箍第三阶·破妄。', effect: { dmgPctStart: [0.08, 0.14] } },
  jingu_gui: {
    dao: '战', name: '金箍·归一', phase: 'passive', auto: true, charges: 0, desc: '紧箍终阶·归一。', effect: { dmgPctStart: [0.10, 0.18] } },
  bis_an: {
    dao: '隐', name: '避水珠·黯', phase: 'out', charges: 2, desc: '避水珠起点·黯（难6掉，小白龙逆鳞白龙转职持有门槛）。非战斗回血 30%。', effect: { healPct: 0.30 } },
  bis_qian: {
    dao: '隐', name: '避水珠·潜流', phase: 'out', charges: 2, desc: '避水珠第一阶·潜流（难21掉，龙马成长）。非战斗回血 40%。', effect: { healPct: 0.40 } },
  bis_fen: {
    dao: '隐', name: '避水珠·分浪', phase: 'out', charges: 3, desc: '避水珠第二阶·分浪。非战斗回血 70%。', effect: { healPct: 0.70 } },
  bis_shui_hua: {
    dao: '隐', name: '避水珠·化龙', phase: 'out', charges: 3, desc: '避水珠终态·化龙（难59掉，小白龙龙太子归转职持有门槛）。非战斗回满气血，水战无敌。', effect: { capHeal: true } },
  bis_ding: {
    dao: '隐', name: '避水珠·定海', phase: 'out', charges: 3, desc: '避水珠第四阶·定海。非战斗回满气血。', effect: { capHeal: true } },
  liuer: {
    dao: '隐', name: '六耳化身印', phase: 'passive', auto: true, charges: 0, desc: '六耳猕猴所遗化身之印（难29/39掉，六耳·残转职持有门槛）。佩之则真假归一，可化分身参战。', effect: { dmgPctStart: [0.06, 0.12] } },
  wuzi: {
    dao: '逆', name: '无字天书', phase: 'both', charges: 2, desc: '凌云渡头一页无字天书（转职持有门槛件）。非战斗翻阅回血 50%；战斗中化刃伤敌 22%。', effect: { healPct: 0.50, dmgPct: 0.22, save: true } },
  // —— 独立剧情法宝（trials81 剧情分支掉落，非关隘/非套装）——
  duanshanfu: {
    dao: '缘', name: '断山符', phase: 'passive', auto: true, charges: 0, desc: '被动·开局破紧箍一次：首回合金箍不触发，削敌来势稍挫。自动发动，不耗充能。', effect: { breakJingu: 1 } },
  huijinzao: {
    dao: '夺', name: '灰烬罩', phase: 'in', charges: 2, desc: '战斗中：灰烬覆体，敌攻-40%持续整场。以烬制火，以退为进。', effect: { enemyAtkDebuff: 0.40, save: false } },
  zhuosui: {
    dao: '夺', name: '琢碎片', phase: 'in', charges: 1, desc: '战斗中：琢碎片一震，敌攻-40%永久（跨战持续）。金刚琢之残片，虽碎犹威。', effect: { enemyAtkDebuffPerm: 0.40, save: false } },
  jingangzhuo: {
    dao: '缘', name: '金刚琢', phase: 'in', charges: 2, desc: '青牛精金刚琢（难25掉）。战斗中祭出套住妖敌，重创约 35% 气血。', effect: { dmgPct: 0.35, dmgFlat: 40, save: true, cleanse: ['weak'] } },
  // —— 八套合成套装专属法宝 ——
  tm_jing: {
    dao: '缘', name: '天命镜', phase: 'both', charges: 2, desc: '天命套专属。照见天命：非战斗回血30%，战斗中照妖弱敌（下战-1）。', effect: { healPct: 0.30, weakNext: 1, save: true } },
  de_zhong: {
    dao: '渡', name: '渡厄钟', phase: 'out', charges: 2, desc: '渡厄套专属。钟鸣渡厄：非战斗回满气血，但钟声引魔（恶+5）。', effect: { capHeal: true, evil: 5 } },
  zy_ling: {
    dao: '缘', name: '镇妖铃', phase: 'in', charges: 2, desc: '镇妖套专属。铃震镇妖：战斗中祭出，伤敌35%且克妖。', effect: { dmgPct: 0.35, save: true } },
  ym_deng: {
    dao: '逆', name: '幽冥灯', phase: 'in', charges: 2, desc: '幽冥套专属。灯引幽冥：战斗中祭出，敌攻-30%（灰烬覆体，以暗制明）。', effect: { enemyAtkDebuff: 0.30, save: false } },
  np_lian: {
    dao: '渡', name: '涅槃莲', phase: 'dead', auto: true, charges: 1, noRecharge: true, desc: '涅槃套专属。败亡时自动触发：涅槃重生，满血复活一次。不可在土地庙补满，耗尽即止。', effect: { capHeal: true } },
  xm_yin: {
    dao: '战', name: '降魔印', phase: 'in', charges: 2, desc: '降魔套专属。印镇群魔：战斗中祭出，伤敌40%且克魔。', effect: { dmgPct: 0.40, save: true } },
  fs_juan: {
    dao: '战', name: '封神卷', phase: 'both', charges: 2, desc: '封神套专属。卷诏封神：战斗中伤敌25%+回血25%，非战斗回血25%。', effect: { dmgPct: 0.25, healPct: 0.25, save: true } },
  lh_pan: {
    dao: '缘', name: '轮回盘', phase: 'passive', auto: true, charges: 0, desc: '轮回套专属。被动·轮回转生：每战开局自动削敌8%气血。自动发动，不耗充能。', effect: { dmgPctStart: 0.08 } },
};

// —— V8.54 P2-3 法宝共鸣系统：同时持有两件法宝时触发额外效果 ——
// 检查时机：resolveOpTreasure 使用法宝前，若玩家持有共鸣件则临时放大 effect
NDX.TREASURE_SYNERGY = [
  { id: 'shan_fo', pair: ['ts_bowl','ss_bowl'], name: '佛法双宝',
    desc: '同时持有紫金钵与降妖念珠：善系法宝伤害+15%，回血+15%',
    bonus: { dmgX: 1.15, healX: 1.15 } },
  { id: 'feng_shan', pair: ['dingfeng','bf_bihuo'], name: '风火相济',
    desc: '同时持有定风珠与芭蕉扇：眩晕回合+1，护盾+10%',
    bonus: { stunBonus: 1, shieldBonus: 0.10 } },
  { id: 'jin_gu', pair: ['jingu','bf_jinnao'], name: '金锢双锁',
    desc: '同时持有金箍与紫金铙：怪物攻击-10%，吸血+10%',
    bonus: { atkDown: 0.10, lifestealBonus: 0.10 } },
  { id: 'ni_san', pair: ['bf_ni_lian','bf_ni_mie'], name: '逆道双灭',
    desc: '同时持有两件逆道真器：逆道法宝伤害+20%',
    bonus: { dmgX: 1.20 } },
];
// 检查玩家是否持有某共鸣组合的另一件法宝
NDX.hasSynergy = function (state, treasureId) {
  if (!state || !state.equips || !NDX.TREASURE_SYNERGY) return null;
  const ownedIds = new Set(state.equips.filter(e => e.treasureId).map(e => e.treasureId));
  for (const syn of NDX.TREASURE_SYNERGY) {
    if (syn.pair.includes(treasureId)) {
      const other = syn.pair.find(id => id !== treasureId);
      if (ownedIds.has(other)) return syn;
    }
  }
  return null;
};

// —— 法宝「克制 counter」字段（软克制，联动识破/爆发×1.5，见《法宝克制系统设计方案》）——
// tags 命中怪物 tags 即生效：放大法宝数值 + 置位 res.countered（识破/爆发×1.5）。
// 阵营标签与 enemies.js 的 tags 对齐：天庭 / 佛门 / 妖 / 魔。
(function () {
  const C = {
    // —— 贪狼套法宝：克妖 ——
    baojiao: ['妖'], dingfeng: ['妖'], zijinhu: ['妖'], zhaoyao: ['妖'],
    // —— 关隘法宝：按章节叙事克制 ——
    bf_renzhongdai: ['妖'], bf_yinerping: ['妖'], bf_baojiao_zhen: ['妖', '魔'],
    bf_dinghai: ['妖'], bf_zijinling: ['妖'], bf_puti: ['佛门'],
    jingangzhuo: ['天庭'], bf_jingangzhuo: ['天庭'],
    bf_sanmei: ['魔'], bf_bihuo: ['魔'], bf_ni_lian: ['魔'], bf_wuzizhenjing: ['魔', '佛门'],
    bf_lunhui: ['佛门'], bf_jinnao: ['佛门'],
    // —— 本命法宝：按英雄叙事克制 ——
    ts_bowl: ['佛门'], jiuming: ['妖'], bj_bowl: ['魔'], lm_bowl: ['妖'], ss_bowl: ['妖'],
    // —— 本命法宝·成长链：取经人克佛门·八戒克魔·沙僧克妖 ——
    ts_bowl_ci: ['佛门'], ts_bowl_bei: ['佛门'], ts_bowl_wl: ['佛门'],
    bj_bowl_man: ['魔'], bj_bowl_ying: ['魔'], bj_bowl_wl: ['魔'],
    ss_bowl_jing: ['妖'], ss_bowl_fanyin: ['妖'], ss_bowl_wl: ['妖'],
    // —— 成长链法宝：金箍克妖·避水珠克妖 ——
    jingu_shu: ['妖'], jingu_zhen: ['妖'], jingu_po: ['妖'], jingu_gui: ['妖'],
    bis_an: ['妖'], bis_qian: ['妖'], bis_fen: ['妖'], bis_shui_hua: ['妖'], bis_ding: ['妖'],
    // —— 特殊法宝 ——
    liuer: ['妖'], wuzi: ['佛门'],
    // —— 新增法宝 ——
    duanshanfu: ['天庭'], huijinzao: ['魔'], zhuosui: ['天庭'],
    // —— 八套合成套装专属法宝 ——
    tm_jing: ['妖'], de_zhong: ['魔'], zy_ling: ['妖'], ym_deng: ['魔'],
    np_lian: ['魔', '佛门'], xm_yin: ['魔'], fs_juan: ['天庭'], lh_pan: ['妖', '魔'],
  };
  for (const k in C) {
    if (NDX.TREASURES[k]) NDX.TREASURES[k].counter = { tags: C[k], dmgX: 1.5, healX: 1.0, note: '克制' + C[k].join('/') + '系妖敌' };
  }
})();

  /* ============================ 套装隐藏职 SET_JOBS ============================ */
  // 套装独立通用隐藏职：不与英雄隐藏职（HIDDEN_JOBS）重合，任何英雄走该套均可获得。
  // 通过「套装组件」（slot:'component'）激活，组件为合成产物，包裹中生效、不占装备格——
  // 使英雄可在原有路线之外补足多重特性（如唐僧走玄武套补防御，不影响其加法伤路线）。
  // 结构：{ 套装名: { name, dao(六道归属), tiers: [{ comp, job, tier, bonus:{ti/yuan} }] } }
  // 贪狼升级链（用户拍板）：四件初级套→组件1→一转；四件中级套→组件2→二转；4升级组件→组件3→三转。
  // 贪狼定位：攻守兼备（攻+血），与 SET_RESONANCE 贪狼 tier 一致。
  NDX.SET_JOBS = {
    贪狼: {
      name: '贪狼',
      dao: '缘',
      tiers: [
        { comp: 'tl_comp1', job: '贪狼·聚灵', tier: 1, bonus: { ti: { atk: 20, hp: 180 } } },
        { comp: 'tl_comp2', job: '贪狼·凝魂', tier: 2, bonus: { ti: { atk: 45, hp: 400, dr: 0.05 } } },
        { comp: 'tl_comp3', job: '贪狼·天狼', tier: 3, bonus: { ti: { atk: 80, hp: 750, dr: 0.09, eva: 0.04 } } },
      ],
    },
    // 破军（战·攻击向）：四件套同构升级链，与贪狼同构。攻击核心。
    破军: {
      name: '破军',
      dao: '战',
      tiers: [
        { comp: 'pw_comp1', job: '破军·聚锋', tier: 1, bonus: { ti: { atk: 32, hp: 120 } } },
        { comp: 'pw_comp2', job: '破军·裂阵', tier: 2, bonus: { ti: { atk: 60, hp: 260, dr: 0.05 } } },
        { comp: 'pw_comp3', job: '破军·弑神', tier: 3, bonus: { ti: { atk: 105, hp: 480, dr: 0.09, crit: 0.06 } } },
      ],
    },
    // 玄武套（渡·防御向）：四件套同构升级链（V8.42 装备就位启用）。
    玄武: {
      name: '玄武',
      dao: '渡',
      tiers: [
        { comp: 'xw_comp1', job: '玄武·镇海灵', tier: 1, bonus: { ti: { hp: 220, dr: 0.06, reflect: 0.05 } } },
        { comp: 'xw_comp2', job: '玄武·镇海魂', tier: 2, bonus: { ti: { hp: 480, dr: 0.13, reflect: 0.10 } } },
        { comp: 'xw_comp3', job: '玄武·镇海神', tier: 3, bonus: { ti: { hp: 850, dr: 0.22, reflect: 0.16 } } },
      ],
    },
    // 影遁（隐·闪避向）：四件套同构升级链。
    影遁: {
      name: '影遁',
      dao: '隐',
      tiers: [
        { comp: 'yd_comp1', job: '影遁·无痕', tier: 1, bonus: { ti: { eva: 0.08, atk: 15 } } },
        { comp: 'yd_comp2', job: '影遁·遁空', tier: 2, bonus: { ti: { eva: 0.15, atk: 30, hp: 160 } } },
        { comp: 'yd_comp3', job: '影遁·归墟', tier: 3, bonus: { ti: { eva: 0.24, atk: 52, hp: 340, dr: 0.06 } } },
      ],
    },
    // 逆命（逆·全加向）：四件套同构升级链。
    逆命: {
      name: '逆命',
      dao: '逆',
      tiers: [
        { comp: 'nm_comp1', job: '逆命·逆乱', tier: 1, bonus: { ti: { atk: 20, hp: 150, dr: 0.03 } } },
        { comp: 'nm_comp2', job: '逆命·逆天', tier: 2, bonus: { ti: { atk: 40, hp: 330, dr: 0.07, eva: 0.04 } } },
        { comp: 'nm_comp3', job: '逆命·大道崩', tier: 3, bonus: { ti: { atk: 70, hp: 600, dr: 0.12, eva: 0.07, crit: 0.04 } } },
      ],
    },
    // 饕餮（夺·掠夺向）：四件套同构升级链。暴击+身法掠夺流。
    饕餮: {
      name: '饕餮',
      dao: '夺',
      tiers: [
        { comp: 'tt_comp1', job: '饕餮·吞金', tier: 1, bonus: { ti: { atk: 26, hp: 140, crit: 0.04 } } },
        { comp: 'tt_comp2', job: '饕餮·噬宝', tier: 2, bonus: { ti: { atk: 52, hp: 300, crit: 0.07, eva: 0.04 } } },
        { comp: 'tt_comp3', job: '饕餮·吞天', tier: 3, bonus: { ti: { atk: 90, hp: 550, crit: 0.11, eva: 0.06 } } },
      ],
    },
    // 明镜（心魔线·照见本我）：V9.9 隐藏职「照镜人·明心见性」。
    //   激活链：镜战取胜→镜痕→明镜三件+升级石→组件 mj_comp1。xinmoAtk = 心魔转临时攻击（以魔证道）。
    明镜: {
      name: '明镜',
      dao: '缘',
      tiers: [
        { comp: 'mj_comp1', job: '照镜人·明心见性', tier: 1, bonus: { ti: { atk: 30, hp: 300, dr: 0.05, eva: 0.05 }, xinmoAtk: 0.30 } },
      ],
    },
  };
  // 由组件 id 反查套装隐藏职效果：返回 { set, job, tier, bonus } 或 null
  NDX.setJobByComp = function (compId) {
    if (!compId || !NDX.SET_JOBS) return null;
    for (const setKey of Object.keys(NDX.SET_JOBS)) {
      const def = NDX.SET_JOBS[setKey];
      if (!def || !def.tiers) continue;
      const hit = def.tiers.find((t) => t.comp === compId);
      if (hit) return { set: setKey, job: hit.job, tier: hit.tier, bonus: hit.bonus };
    }
    return null;
  };
  // 六道套装隐藏职升级石：只有持有对应升级石，该套装的组件才会激活隐藏职。
  // 升级石由第一难六道抉择后发放；普通合成的组件1/2/3不再自动触发隐藏职。
  NDX.JOB_STONES = {
    xw_stone: { set: '玄武', dao: '渡', name: '玄武升级石' },
    tl_stone: { set: '贪狼', dao: '缘', name: '贪狼升级石' },
    pw_stone: { set: '破军', dao: '战', name: '破军升级石' },
    yd_stone: { set: '影遁', dao: '隐', name: '影遁升级石' },
    nm_stone: { set: '逆命', dao: '逆', name: '逆命升级石' },
    tt_stone: { set: '饕餮', dao: '夺', name: '饕餮升级石' },
    mj_stone: { set: '明镜', dao: '缘', name: '明镜升级石' },  // V9.9 心魔隐藏线：镜痕熔铸，唤醒「照镜人·明心见性」
  };

  // 从 s.equips 中收集全部已持有的套装组件（slot:'component'），按最高转职档取最终效果
  // V8.5x 修订：组件本身不再自动激活隐藏职，必须持有对应六道升级石（JOB_STONES）方可唤醒。
  // 返回 { maxTier, bonus(最高档), jobs: [已解锁职业名] } —— 供面板/隐藏职展示与战斗结算
  NDX.setJobBonusFor = function (s) {
    const bonus = { ti: {}, yuan: {} };
    const jobs = [];
    let maxTier = 0;
    let extra = 0;   // V9.9 附加效果系数（如 照镜人 xinmoAtk：心魔转临时攻击）
    const unlocked = new Set();
    // 1) 由包裹中的升级石决定可激活哪些套装隐藏职
    (s && s.equips || []).forEach((e) => {
      if (!e || e.slot !== 'component') return;
      const stone = NDX.JOB_STONES && NDX.JOB_STONES[e.id];
      if (stone) unlocked.add(stone.set);
    });
    // 兼容：通过 flags.jobStones 直接解锁的旧存档/特殊途径
    if (s && s.flags && s.flags.jobStones) {
      Object.keys(s.flags.jobStones).forEach((set) => { if (s.flags.jobStones[set]) unlocked.add(set); });
    }
    // 2) 仅对已解锁套装的组件生效，取最高 tier
    (s && s.equips || []).forEach((e) => {
      if (!e || e.slot !== 'component' || !e.set) return;
      if (!unlocked.has(e.set)) return;
      const sj = NDX.setJobByComp(e.id);
      if (!sj) return;
      jobs.push(sj.job);
      if (sj.tier > maxTier) {
        maxTier = sj.tier;
        extra = sj.bonus.xinmoAtk || 0;
        bonus.ti = Object.assign({}, sj.bonus.ti || {});
        bonus.yuan = Object.assign({}, sj.bonus.yuan || {});
      }
    });
    return { maxTier, bonus, jobs, extra };
  };

  /* ============================ 套装共鸣 SET_RESONANCE ============================ */
    /* ============================ V9.9 心魔隐藏线·明镜套 ============================ */
  // 明镜套 = 心魔系统的 reward 侧：镜本我战取胜得「镜痕」，镜痕熔铸明镜五件套。
  //   ① 套装共鸣 tier3 附「明心见性」：心魔增长 -15%（全仓唯一心魔减幅源，刻意唯一以防叠没）。
  //   ② 集齐三件 + 明镜升级石 → 组件「明镜·照心」→ 觉醒隐藏职「照镜人·明心见性」（心魔转临时攻击）。
  // 数值 [已调优]（2026-09-14）：MIRROR_SET xinmoSuppress 0.15 / xinmoAtk 0.30 已被门禁 _verify_mirror_hidden
  //   C2/D3/D5/G2 写死（3 件减幅恰 0.15、照镜人 extra 恰 0.30），不得改动。复核 0.15 为全仓唯一心魔减幅源（刻意唯一防叠没）、
  //   0.30 为隐藏职心魔转攻系数，设计自洽，确认保持。
  NDX.MIRROR_SET = { set: '明镜', need: 3, xinmoSuppress: 0.15, xinmoAtk: 0.30 };
  // 身体四槽中明镜件数（与 applySetResonance 同口径：只计 weapon/armor/head/boots）
  NDX.mirrorSetCount = function (s) {
    const body = new Set(['weapon', 'armor', 'head', 'boots']);
    return ((s && s.equips) || []).filter((e) => e && e.set === NDX.MIRROR_SET.set && body.has(e.slot)).length;
  };
  // 明心见性：明镜件数达标 → 心魔增长减幅（0 表示未生效）。
  // 减幅数值单一真源 = SET_RESONANCE['明镜'].tier3.xinmoSuppress（MIRROR_SET.xinmoSuppress 仅作兜底），
  // 避免「共鸣表写了值、消费点读另一处」的死数据（本项目已三犯此类错误）。
  NDX.mirrorSetSuppress = function (s) {
    if (NDX.mirrorSetCount(s) < NDX.MIRROR_SET.need) return 0;
    const def = NDX.SET_RESONANCE && NDX.SET_RESONANCE[NDX.MIRROR_SET.set];
    const v = def && def.tier3 ? def.tier3.xinmoSuppress : null;
    return v != null ? v : NDX.MIRROR_SET.xinmoSuppress;
  };

})();
