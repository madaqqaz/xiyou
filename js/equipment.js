/* =============================================================================
 * 逆道西行 · 装备数据库（独立维护文件）
 * -----------------------------------------------------------------------------
 * 本文件集中存放所有「装备相关」数据，从 window.NDX 命名空间统一调取。
 * 修改装备参数、新增/删除装备，只需编辑本文件，无需改动 data.js / combat.js。
 *
 * 挂载到 NDX 的表：
 *   NDX.EQUIP_POOL    装备池（slot: weapon/armor/treasure/pet；含每难专属与合成成品）
 *   NDX.CRAFT_POOL    可打造素材/合成件池（含 RECIPES 合成公式）
 *   NDX.RECIPES       合成公式（out 产出 CRAFT_POOL/装备 ID）
 *   NDX.BOSS_REWARDS  关隘通关掉落法宝（按章节编号）
 *   NDX.TREASURES     法宝库（战斗/非战斗/被动/双形态/逆道真器）
 *   NDX.SET_RESONANCE 套装共鸣阈值与加成（供 combat.computeStats 调用）
 *
 * 加载顺序（见 index.html）：data.js → equipment.js → hero_trials.js → combat.js → ...
 * 即本文件须在 data.js 之后、combat.js 之前加载。
 * 注：装备的「体/愿」体系标注逻辑 SET_SYS 与 _tagSys 仍保留在 data.js（通用工具）。
 * ========================================================================== */
(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;

  /* ============================ 装备池 EQUIP_POOL ============================ */
NDX.EQUIP_POOL = [
  // —— 8.11 每难专属基础装备（按劫难原著意象，难1-9 专属掉落）——
  // V8.42 散件清理：langya/tiegou/shutong/caoxie（破军孤儿散件）、douli/fuguan/xuanxue（玄武孤儿散件）
  //   无配方无共鸣、与四槽三阶四件套体系冲突，已删除（仅保留英雄凡品/灵宠/法宝散件）。
  { id: 'taomu_sword',  name: '桃木剑',     slot: 'weapon',   atk: 8,  matk: 14, hp: 0, dr: 0, desc: '攻+8 愿伤+14（难3·满月抛江·江流儿避难）', set: '取经人', setTier: 1, chapter: 1 },
  { id: 'shanque',      name: '山雀',       slot: 'pet',      atk: 10, hp: 20, dr: 0,    desc: '攻+10 血+20（难5·出城逢虎·伯钦之缘）', set: '破军', setTier: 1, chapter: 1 },
  { id: 'bis_an',       name: '避水珠·黯',  slot: 'treasure', atk: 0,  hp: 30, dr: 0.03, desc: '血+30 减伤+3%（难6·落坑折从·白龙专属）', set: '贪狼', setTier: 1, chapter: 1 },
  { id: 'longti',       name: '龙蹄·凡',    slot: 'weapon',   atk: 14, hp: 10, dr: 0,    desc: '攻+14 血+10（难9·陡涧换马·龙马武器）', set: '悟空', setTier: 1, chapter: 1 },
  { id: 'jinchan_sheli', name: '金蝉舍利',  slot: 'treasure', atk: 0,  hp: 40, dr: 0.04, desc: '血+40 减伤+4%（难1·十世余泽·取经人机缘）', set: '贪狼', setTier: 1, chapter: 1 },
  { id: 'renshen',      name: '人参果',     slot: 'treasure', atk: 0,  hp: 50, dr: 0.02, desc: '血+50 减伤+2%（难15·五庄观人参·镇元子机缘）', set: '贪狼', setTier: 1, chapter: 1 },
  // —— 灵宠·进化体系（V8.15 宠物修订版）——
  // quality: 0=凡器, 1=灵器, 2=宝器（属性倍率×1.0/×1.3/×1.6，由 computeStats 读取）
  // evolveFrom: 进化来源id（仅进化形态有）；evolveTo: 可进化目标id数组（仅基础形态有）
  // petPassive: 战斗被动类型 gold_per_turn/regen/poison/dragon_aura（由战斗循环读取）
  // branch: 进化分支标记 dragon/water/fire/light/ape/fox/jinchan/crane/qilin/gu/renshen
  { id: 'xiaoheilong',     name: '小黑龙',     slot: 'pet', atk: 8,  hp: 30, dr: 0,    matk: 5,  desc: '攻+8 血+30 愿伤+5（灵宠·龙系·可进化三分支）', set: '破军', setTier: 1, chapter: 1, quality: 0, evolveTo: ['shuijingmolang', 'lieyanhuolong', 'puzhaozhenlong'], petPassive: 'dragon_aura', branch: 'dragon' },
  { id: 'xiaoshihou',      name: '小石猴',     slot: 'pet', atk: 12, hp: 25, dr: 0.02, desc: '攻+12 血+25 减伤+2%（灵宠·猿系·可进化）', set: '破军', setTier: 1, chapter: 1, quality: 0, evolveTo: ['tongbiyuanhou'], petPassive: null, branch: 'ape' },
  { id: 'xiaohuli',        name: '小火狐',     slot: 'pet', atk: 6,  matk: 12, hp: 15, dr: 0, desc: '攻+6 愿伤+12 血+15（灵宠·狐系）', set: '贪狼', setTier: 1, chapter: 1, quality: 0, petPassive: null, branch: 'fox' },
  { id: 'jinchan',         name: '金蟾',       slot: 'pet', atk: 0,  hp: 40, dr: 0.02, desc: '血+40 减伤+2%（灵宠·金蟾系·每战+金）', set: '贪狼', setTier: 1, chapter: 1, quality: 0, evolveTo: ['jinchan_er'], petPassive: 'gold_per_turn', branch: 'jinchan' },
  { id: 'zhihe',           name: '纸鹤',       slot: 'pet', atk: 0,  matk: 8, hp: 20, mdef: 0.03, desc: '愿伤+8 血+20 御念+3%（灵宠·纸鹤系）', set: '取经人', setTier: 1, chapter: 1, quality: 0, petPassive: null, branch: 'crane' },
  { id: 'younianqilin',    name: '幼年麒麟',   slot: 'pet', atk: 10, hp: 50, dr: 0.03, desc: '攻+10 血+50 减伤+3%（灵宠·麒麟系）', set: '玄武', setTier: 1, chapter: 1, quality: 0, petPassive: null, branch: 'qilin' },
  { id: 'guchong',         name: '蛊虫',       slot: 'pet', atk: 5,  hp: 10, dr: 0,    desc: '攻+5 血+10（灵宠·蛊虫系·每回合毒）', set: '破军', setTier: 1, chapter: 1, quality: 0, petPassive: 'poison', branch: 'gu' },
  { id: 'renshanguozi',    name: '人参果仔',   slot: 'pet', atk: 0,  hp: 35, dr: 0.01, desc: '血+35 减伤+1%（灵宠·人参系·每战回血）', set: '贪狼', setTier: 1, chapter: 1, quality: 0, evolveTo: ['renshanguozi_er'], petPassive: 'regen', branch: 'renshen' },
  // —— 灵兽·洪荒百兽（V8.22 宠物修订版整合）：新增西游化灵兽，含进化链/羁绊/章节动机 ——
  // quality: 0=凡(普通) 1=灵(精英) 2=宝(传说)  attrs: 心魔/年月类效果因底座未接为悬空，仅展示
  // fetter: 羁绊组id   branch: 原属系  src: 获得动机(劫难来源/章节)
  // —— 普通组本体（9 只，荒山/林泉/泽畔偶得）——
  { id: 'lingyan',     name: '灵岩幼兽', slot: 'pet', atk: 4,  hp: 26, dr: 0.03, desc: '攻+4 血+26 减伤+3%（洪荒·灵岩系·憨直护主;可进化）', set: '御兽', setTier: 1, chapter: 1, quality: 0, evolveTo: ['lingyan_ju'], petPassive: 'guard', branch: 'rock', fetter: '顽石生灵', src: '第1地区荒山石隙拾得' },
  { id: 'yanlin',      name: '岩鳞石卫', slot: 'pet', atk: 3,  hp: 30, dr: 0.06, desc: '攻+3 血+30 减伤+6%（洪荒·岩鳞系·被暴伤-15%无形）（可进化）', set: '御兽', setTier: 1, chapter: 1, quality: 0, evolveTo: ['yanlin_wang'], petPassive: null, branch: 'rock', fetter: '顽石生灵', src: '第2地区古岩阵遇' },
  { id: 'qingyuehu',   name: '清月灵狐', slot: 'pet', atk: 0,  hp: 8,  matk: 10, eva: 0.06, desc: '愿伤+10 血+8 闪避+6%（洪荒·月狐系·战后恶-2）（可进化）', set: '御兽', setTier: 1, chapter: 2, quality: 0, evolveTo: ['yueying'], petPassive: null, branch: 'fox', fetter: '顺随天性', src: '第2地区月夜随行' },
  { id: 'taxue',       name: '踏雪灵鹿', slot: 'pet', atk: 0,  hp: 22, eva: 0.05, desc: '血+22 闪避+5%（洪荒·瑞鹿系·开场轻身免控）（可进化）', set: '御兽', setTier: 1, chapter: 2, quality: 0, evolveTo: ['xueqi'], petPassive: 'whisk', branch: 'deer', fetter: '顺随天性', src: '第2地区踏雪偶遇' },
  { id: 'huangzhonghu',name: '荒冢灵狐', slot: 'pet', atk: 6,  hp: 16, eva: 0.04, desc: '攻+6 血+16 闪避+4%（洪荒·幽狐系·劫力获取提升）（多重进化）', set: '御兽', setTier: 1, chapter: 3, quality: 0, evolveTo: ['youming', 'jialan_he', 'fanyin_he'], petPassive: null, branch: 'fox', fetter: '山野妖群', src: '第3地区荒冢孤魂' },
  { id: 'shilang',     name: '噬骨狼崽', slot: 'pet', atk: 12, hp: 8,  dr: 0, desc: '攻+12 血+8（洪荒·狼系·对低血敌+10%伤）（可进化）', set: '御兽', setTier: 1, chapter: 3, quality: 0, evolveTo: ['huangyuan'], petPassive: 'rend', branch: 'wolf', fetter: '山野妖群', src: '第3地区荒野狼群' },
  { id: 'xunzhen',     name: '寻珍风狸', slot: 'pet', atk: 8,  hp: 12, eva: 0.03, desc: '攻+8 血+12 闪避+3%（洪荒·风狸系·幸运/窃取）（多重进化）', set: '御兽', setTier: 1, chapter: 4, quality: 0, evolveTo: ['qietian', 'baiyu'], petPassive: '', branch: 'marten', src: '第4地区秘窟幽径' },
  { id: 'qingzhang',   name: '清瘴萤灵', slot: 'pet', atk: 0,  hp: 10, matk: 8, mdef: 0.04, desc: '愿伤+8 血+10 御念+4%（洪荒·萤系·清净瘴疠）（可进化）', set: '御兽', setTier: 1, chapter: 4, quality: 0, evolveTo: ['huangyan'], petPassive: null, branch: 'firefly', src: '第4地区腐泽夜萤' },
  // —— 普通组进化形（精英 1 阶，8 只）——
  { id: 'lingyan_ju',  name: '灵岩巨像', slot: 'pet', atk: 10, hp: 60, dr: 0.08, desc: '攻+10 血+60 减伤+8%（灵岩·石心·首次受致命伤保命）', set: '御兽', setTier: 2, chapter: 2, quality: 1, evolveFrom: 'lingyan', petPassive: 'stoneheart', branch: 'rock', fetter: '顽石生灵', src: '灵岩幼兽·授以岩心' },
  { id: 'yanlin_wang', name: '岩甲兽王', slot: 'pet', atk: 8,  hp: 70, dr: 0.10, desc: '攻+8 血+70 减伤+10%（岩甲·统御石群·全队减伤+4%无形）', set: '御兽', setTier: 2, chapter: 2, quality: 1, evolveFrom: 'yanlin', petPassive: 'rockwall', branch: 'rock', fetter: '顽石生灵', src: '岩鳞石卫·引动岩脉' },
  { id: 'yueying',     name: '月影妖狐', slot: 'pet', atk: 2,  hp: 14, matk: 18, eva: 0.12, cri: 0.10, desc: '愿伤+18 闪避+12% 暴击+10%（月狐·月华淬魂）', set: '御兽', setTier: 2, chapter: 3, quality: 1, evolveFrom: 'qingyuehu', petPassive: null, branch: 'fox', fetter: '顺随天性', src: '清月灵狐·引月入魂' },
  { id: 'xueqi',       name: '雪羽麒麟', slot: 'pet', atk: 6,  hp: 50, eva: 0.10, mdef: 0.06, desc: '攻+6 血+50 闪避+10% 御念+6%（瑞鹿·每回合净负面）', set: '御兽', setTier: 2, chapter: 3, quality: 1, evolveFrom: 'taxue', petPassive: 'cleanse', branch: 'deer', fetter: '顺随天性', src: '踏雪灵鹿·渡雪成麟' },
  { id: 'youming',     name: '幽冥妖狐', slot: 'pet', atk: 14, hp: 20, eva: 0.06, desc: '攻+14 血+20 闪避+6%（幽狐·纳幽淬魂·劫力获取提升）', set: '御兽', setTier: 2, chapter: 4, quality: 1, evolveFrom: 'huangzhonghu', petPassive: null, branch: 'fox', fetter: '山野妖群', src: '荒冢灵狐·纳幽淬魂' },
  { id: 'huangyuan',   name: '荒原狼王', slot: 'pet', atk: 24, hp: 12, dr: 0.02, desc: '攻+24 血+12 减伤+2%（狼王·对低血敌+20%伤）', set: '御兽', setTier: 2, chapter: 4, quality: 1, evolveFrom: 'shilang', petPassive: 'rend', branch: 'wolf', fetter: '山野妖群', src: '噬骨狼崽·授以狼印' },
  { id: 'qietian',     name: '窃天灵貂', slot: 'pet', atk: 18, hp: 18, eva: 0.08, desc: '攻+18 血+18 闪避+8%（灵貂·每场窃取敌人1件装备）', set: '御兽', setTier: 2, chapter: 5, quality: 1, evolveFrom: 'xunzhen', petPassive: null, branch: 'marten', src: '寻珍风狸·启窍通灵' },
  { id: 'huangyan',    name: '煌炎萤灵', slot: 'pet', atk: 6,  hp: 16, matk: 14, mdef: 0.08, desc: '愿伤+14 血+16 御念+8%（煌炎·火德护持）', set: '御兽', setTier: 2, chapter: 5, quality: 1, evolveFrom: 'qingzhang', petPassive: null, branch: 'firefly', src: '清瘴萤灵·引火化煌' },
  // —— 精英·二选一鹤系/风系（与荒冢灵狐/寻珍风狸互斥进化）——
  { id: 'jialan_he',   name: '迦蓝灵鹤', slot: 'pet', atk: 6,  hp: 40, dr: 0.04, desc: '攻+6 血+40 减伤+4%（鹤·引渡亡魂·渡化首判+20%,悬空心魔-12%）', set: '取经人', setTier: 2, chapter: 5, quality: 1, evolveFrom: 'huangzhonghu', petPassive: 'guide', branch: 'crane', src: '荒冢灵狐·引渡亡魂', virtue: '渡' },
  { id: 'fanyin_he',   name: '梵音灵鹤', slot: 'pet', atk: 4,  hp: 50, dr: 0.06, desc: '攻+4 血+50 减伤+6%（鹤·梵音护法·全队受伤-5%无形·净化1层）', set: '取经人', setTier: 2, chapter: 5, quality: 1, evolveFrom: 'huangzhonghu', petPassive: 'hymn', branch: 'crane', src: '荒冢灵狐·梵音护法', virtue: '善' },
  { id: 'baiyu',       name: '白羽风王', slot: 'pet', atk: 20, hp: 26, cri: 0.08, desc: '攻+20 血+26 暴击+8%（风王·携风而行·来去如电）', set: '贪狼', setTier: 2, chapter: 5, quality: 1, evolveFrom: 'xunzhen', petPassive: null, branch: 'marten', src: '寻珍风狸·携风而行' },
  // —— 传说组（2 本体 + 隐藏进化）——
  { id: 'ditingyou',   name: '谛听幼兽', slot: 'pet', atk: 8,  hp: 40, matk: 12, desc: '攻+8 愿伤+12 血+40（传说·地藏座下·每地区可听六道与代价）（可进化）', set: '取经人', setTier: 1, chapter: 6, quality: 2, evolveTo: ['diting'], petPassive: null, branch: 'listen', fetter: '禅门护法', virtue: '缘', src: '第6地区谛听地脉' },
  { id: 'foguangque',  name: '佛光白雀', slot: 'pet', atk: 6,  hp: 36, mdef: 0.05, desc: '攻+6 血+36 御念+5%（传说·佛光渡雀·净心）（与谛听结禅门护法）', set: '取经人', setTier: 1, chapter: 6, quality: 2, petPassive: null, branch: 'bird', fetter: '禅门护法', virtue: '善', src: '第6地区佛光偶渡' },
  { id: 'diting',      name: '谛听',     slot: 'pet', atk: 16, hp: 70, matk: 22, desc: '攻+16 愿伤+22 血+70（传说·谛听明心·能听三界隐秘,六道+5）', set: '取经人', setTier: 3, chapter: 6, quality: 2, evolveFrom: 'ditingyou', petPassive: null, branch: 'listen', fetter: '禅门护法', virtue: '缘', src: '谛听幼兽·静听地脉' },
  { id: 'tongbishiyuan', name: '通臂石猿', slot: 'pet', atk: 28, hp: 40, dr: 0.06, eva: 0.05, desc: '攻+28 血+40 减伤+6% 闪避+5%（传说·隐藏进化·夺+8/暴伤+40%无形·狂战士）', set: '破军', setTier: 3, chapter: 7, quality: 2, evolveFrom: 'xiaoshihou', petPassive: 'berserk', branch: 'ape', virtue: '夺', src: '第6地区古洞顽猿·维持现状+第7地区证道' },
  // —— 逆兽组（V8.7x 六道供给规则）：八十一难中「有来历的妖王」，【逆】道说动后可收为御兽 ——
  // 获得途径：对应劫难的逆选项（effect.treasure = id），不进普通掉落；逆道专属，御兽套共鸣
  // 佛法口径：收妖不是奴役——是给它们一条不被收编、不入轮回的路
  { id: 'ni_sanshou', name: '双叉岭三兽', slot: 'pet', atk: 10, hp: 30, dr: 0.03, matk: 0, eva: 0, cri: 0, desc: '攻+10 血+30 减伤+3%（寅将军·熊山君·特处士三兽同契（逆兽·反出无主之山））', set: '御兽', setTier: 2, chapter: 1, quality: 2, petPassive: 'guard', branch: 'ni', virtue: '逆', src: '逆道·双叉岭三兽·说动反出' },
  { id: 'ni_yulong', name: '玉龙·未受鞍', slot: 'pet', atk: 16, hp: 40, dr: 0, matk: 0, eva: 0.05, cri: 0, desc: '攻+16 血+40 闪避+5%（西海三太子（逆兽·不回龙宫·不受那副鞍））', set: '御兽', setTier: 2, chapter: 2, quality: 2, petPassive: 'dragon_aura', branch: 'ni', virtue: '逆', src: '逆道·玉龙·未受鞍·说动反出' },
  { id: 'ni_huxianfeng', name: '虎先锋', slot: 'pet', atk: 20, hp: 22, dr: 0, matk: 0, eva: 0.04, cri: 0.04, desc: '攻+20 血+22 闪避+4% 暴击+4%（黄风岭前部（逆兽·第一次有人问它想守什么））', set: '御兽', setTier: 2, chapter: 2, quality: 2, petPassive: 'rend', branch: 'ni', virtue: '逆', src: '逆道·虎先锋·说动反出' },
  { id: 'ni_huangfeng', name: '黄毛貂鼠', slot: 'pet', atk: 14, hp: 26, dr: 0, matk: 8, eva: 0.08, cri: 0, desc: '攻+14 血+26 愿伤+8 闪避+8%（灵山脚下偷油得道（逆兽·佛门不认它修的道））', set: '御兽', setTier: 2, chapter: 3, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·黄毛貂鼠·说动反出' },
  { id: 'ni_baigu', name: '白骨夫人', slot: 'pet', atk: 12, hp: 10, dr: 0, matk: 6, eva: 0.12, cri: 0.06, desc: '攻+12 血+10 愿伤+6 闪避+12% 暴击+6%（尸魔三戏（逆兽·白骨观·以骨同行））', set: '御兽', setTier: 2, chapter: 3, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·白骨夫人·说动反出' },
  { id: 'ni_jiukulou', name: '九骷髅', slot: 'pet', atk: 18, hp: 20, dr: 0.02, matk: 0, eva: 0, cri: 0, desc: '攻+18 血+20 减伤+2%（九个取经人没走完的路（逆兽·挂在颈上的九次西行））', set: '御兽', setTier: 2, chapter: 3, quality: 2, petPassive: 'rend', branch: 'ni', virtue: '逆', src: '逆道·九骷髅·说动反出' },
  { id: 'ni_kui', name: '奎木狼', slot: 'pet', atk: 22, hp: 30, dr: 0, matk: 0, eva: 0.03, cri: 0.06, desc: '攻+22 血+30 闪避+3% 暴击+6%（二十八宿下界（逆兽·天庭当逃犯，你当他是人））', set: '御兽', setTier: 2, chapter: 4, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·奎木狼·说动反出' },
  { id: 'ni_lutong', name: '炉边童子', slot: 'pet', atk: 10, hp: 24, dr: 0.02, matk: 18, eva: 0, cri: 0, desc: '攻+10 血+24 愿伤+18 减伤+2%（金角银角（逆兽·五件宝贝都不是它们的））', set: '御兽', setTier: 2, chapter: 4, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·炉边童子·说动反出' },
  { id: 'ni_qingshi', name: '青毛狮子', slot: 'pet', atk: 24, hp: 45, dr: 0.04, matk: 0, eva: 0, cri: 0, desc: '攻+24 血+45 减伤+4%（文殊坐骑（逆兽·仇报完了，自己也成了罪））', set: '御兽', setTier: 2, chapter: 4, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·青毛狮子·说动反出' },
  { id: 'ni_tuolong', name: '黑水鼍龙', slot: 'pet', atk: 18, hp: 35, dr: 0.03, matk: 4, eva: 0.04, cri: 0, desc: '攻+18 血+35 愿伤+4 减伤+3% 闪避+4%（西海龙族穷亲（逆兽·它只想有个自己的水府））', set: '御兽', setTier: 2, chapter: 4, quality: 2, petPassive: 'dragon_aura', branch: 'ni', virtue: '逆', src: '逆道·黑水鼍龙·说动反出' },
  { id: 'ni_honghai', name: '红孩儿', slot: 'pet', atk: 12, hp: 28, dr: 0, matk: 26, eva: 0.02, cri: 0.05, desc: '攻+12 血+28 愿伤+26 闪避+2% 暴击+5%（牛魔王之子（逆兽·观音要收它，问过它了吗））', set: '御兽', setTier: 2, chapter: 4, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·红孩儿·说动反出' },
  { id: 'ni_jinyu', name: '灵感金鱼', slot: 'pet', atk: 16, hp: 35, dr: 0.02, matk: 10, eva: 0.05, cri: 0, desc: '攻+16 血+35 愿伤+10 减伤+2% 闪避+5%（观音莲池听经百年（逆兽·被放生就成了妖））', set: '御兽', setTier: 2, chapter: 5, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·灵感金鱼·说动反出' },
  { id: 'ni_qingniu', name: '板角青牛', slot: 'pet', atk: 20, hp: 70, dr: 0.08, matk: 0, eva: 0, cri: 0, desc: '攻+20 血+70 减伤+8%（老君青牛（逆兽·主人从未把它当过别的什么））', set: '御兽', setTier: 2, chapter: 5, quality: 2, petPassive: 'rockwall', branch: 'ni', virtue: '逆', src: '逆道·板角青牛·说动反出' },
  { id: 'ni_xiejing', name: '琵琶蝎', slot: 'pet', atk: 18, hp: 20, dr: 0, matk: 8, eva: 0.06, cri: 0.1, desc: '攻+18 血+20 愿伤+8 闪避+6% 暴击+10%（雷音听经之虫（逆兽·它反，是被推出来的））', set: '御兽', setTier: 2, chapter: 5, quality: 2, petPassive: 'poison', branch: 'ni', virtue: '逆', src: '逆道·琵琶蝎·说动反出' },
  { id: 'ni_luocha', name: '罗刹女', slot: 'pet', atk: 8, hp: 34, dr: 0.02, matk: 24, eva: 0.02, cri: 0, desc: '攻+8 血+34 愿伤+24 减伤+2% 闪避+2%（铁扇公主（逆兽·她守扇，是替红孩儿守的））', set: '御兽', setTier: 2, chapter: 6, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·罗刹女·说动反出' },
  { id: 'ni_niumo', name: '牛魔王·未降', slot: 'pet', atk: 30, hp: 50, dr: 0.05, matk: 0, eva: 0, cri: 0.05, desc: '攻+30 血+50 减伤+5% 暴击+5%（平天大圣（逆兽·他本就反过一次））', set: '御兽', setTier: 2, chapter: 6, quality: 2, petPassive: 'berserk', branch: 'ni', virtue: '逆', src: '逆道·牛魔王·未降·说动反出' },
  { id: 'ni_jiutou', name: '九头虫', slot: 'pet', atk: 26, hp: 40, dr: 0.03, matk: 0, eva: 0.05, cri: 0.04, desc: '攻+26 血+40 减伤+3% 闪避+5% 暴击+4%（碧波潭驸马（逆兽·八十一难里唯一逃出去的妖））', set: '御兽', setTier: 2, chapter: 6, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·九头虫·说动反出' },
  { id: 'ni_huangmei', name: '黄眉·假佛', slot: 'pet', atk: 14, hp: 32, dr: 0.03, matk: 22, eva: 0, cri: 0, desc: '攻+14 血+32 愿伤+22 减伤+3%（弥勒司磬童儿（逆兽·他只想坐一回那张位子））', set: '御兽', setTier: 2, chapter: 6, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·黄眉·假佛·说动反出' },
  { id: 'ni_jinmaohou', name: '金毛犼', slot: 'pet', atk: 20, hp: 40, dr: 0.04, matk: 0, eva: 0, cri: 0, desc: '攻+20 血+40 减伤+4%（观音坐骑（逆兽·三年无人问它一句苦））', set: '御兽', setTier: 2, chapter: 6, quality: 2, petPassive: 'guard', branch: 'ni', virtue: '逆', src: '逆道·金毛犼·说动反出' },
  { id: 'ni_shujing', name: '十八公', slot: 'pet', atk: 4, hp: 60, dr: 0.05, matk: 14, eva: 0, cri: 0, desc: '攻+4 血+60 愿伤+14 减伤+5%（荆棘岭树精（逆兽·它只想谈一夜诗））', set: '御兽', setTier: 2, chapter: 6, quality: 2, petPassive: 'regen', branch: 'ni', virtue: '逆', src: '逆道·十八公·说动反出' },
  { id: 'ni_bailu', name: '寿星白鹿', slot: 'pet', atk: 8, hp: 50, dr: 0.02, matk: 12, eva: 0.06, cri: 0, desc: '攻+8 血+50 愿伤+12 减伤+2% 闪避+6%（南极仙翁坐骑（逆兽·拉了千年车））', set: '御兽', setTier: 2, chapter: 7, quality: 2, petPassive: 'whisk', branch: 'ni', virtue: '逆', src: '逆道·寿星白鹿·说动反出' },
  { id: 'ni_baozi', name: '艾叶花皮豹', slot: 'pet', atk: 16, hp: 24, dr: 0, matk: 0, eva: 0.06, cri: 0.05, desc: '攻+16 血+24 闪避+6% 暴击+5%（隐雾山南山大王（逆兽·不害人，只抢些行李））', set: '御兽', setTier: 2, chapter: 7, quality: 2, petPassive: null, branch: 'ni', virtue: '逆', src: '逆道·艾叶花皮豹·说动反出' },
  { id: 'ni_huangshi', name: '黄狮精', slot: 'pet', atk: 14, hp: 45, dr: 0.04, matk: 0, eva: 0, cri: 0, desc: '攻+14 血+45 减伤+4%（豹头山（逆兽·八十一难里唯一一个像人的妖））', set: '御兽', setTier: 2, chapter: 7, quality: 2, petPassive: 'guard', branch: 'ni', virtue: '逆', src: '逆道·黄狮精·说动反出' },
  { id: 'ni_jiuling', name: '九灵元圣', slot: 'pet', atk: 34, hp: 80, dr: 0.1, matk: 0, eva: 0, cri: 0, desc: '攻+34 血+80 减伤+10%（太乙坐骑九头狮（逆兽·一声吼开九幽·驯兽师御兽））', set: '御兽', setTier: 2, chapter: 7, quality: 2, petPassive: 'berserk', branch: 'ni', virtue: '逆', src: '逆道·九灵元圣·说动反出' },
  { id: 'ni_xiniu', name: '辟寒犀', slot: 'pet', atk: 18, hp: 55, dr: 0.06, matk: 0, eva: 0, cri: 0, desc: '攻+18 血+55 减伤+6%（金平府假佛（逆兽·人跪的不是佛，是三支犀角））', set: '御兽', setTier: 2, chapter: 7, quality: 2, petPassive: 'stoneheart', branch: 'ni', virtue: '逆', src: '逆道·辟寒犀·说动反出' },
  { id: 'ni_yutu', name: '捣药玉兔', slot: 'pet', atk: 10, hp: 28, dr: 0, matk: 18, eva: 0.1, cri: 0.04, desc: '攻+10 血+28 愿伤+18 闪避+10% 暴击+4%（广寒宫玉兔（逆兽·它下界只为报那一记掌））', set: '御兽', setTier: 2, chapter: 7, quality: 2, petPassive: 'whisk', branch: 'ni', virtue: '逆', src: '逆道·捣药玉兔·说动反出' },
  { id: 'ni_laoyuan', name: '通天老鼋', slot: 'pet', atk: 6, hp: 120, dr: 0.12, matk: 0, eva: 0, cri: 0, desc: '攻+6 血+120 减伤+12%（通天河老鼋（逆兽·它问寿数，如来没答））', set: '御兽', setTier: 2, chapter: 8, quality: 2, petPassive: 'rockwall', branch: 'ni', virtue: '逆', src: '逆道·通天老鼋·说动反出' },
  // V8.43 五行饰品（trinket）已删除（五行系统整体移除）
  // —— 第一章补充散件：扩充前期装备池，延缓"拿全后重复" ——
  // —— 套装 · 第一阶（T1 套装基座）：劫难固定宝物附带对应材料，必可合成 ——
  { id: 'set_weapon_base', name: '破军胚', slot: 'weapon',   atk: 22, hp: 0,  dr: 0,    desc: '攻+22（套装·破军 基座）', set: '破军', setTier: 1, chapter: 1, craftHint: '集齐 破军·锋/破军·脊 可铸【破军枪】' },
  { id: 'set_armor_base',  name: '玄武胚', slot: 'armor',    atk: 0,  hp: 100, dr: 0.06, reflect: 0.05, desc: '血+100 减伤+6% 反伤+5%（套装·玄武 基座）', set: '玄武', setTier: 1, chapter: 1, craftHint: '集齐 玄武·鳞/玄武·心 可铸【玄武甲】' },
  { id: 'set_treasure_base',name: '贪狼胚', slot: 'treasure', atk: 10, hp: 30, dr: 0.04, desc: '攻+10 血+30 减伤+4%（套装·贪狼 基座）', set: '贪狼', setTier: 1, chapter: 1, craftHint: '集齐 贪狼·牙/贪狼·瞳 可铸【贪狼坠】' },
  // —— 取经人初始三件套 · 第一阶（T1 基座）：任何英雄第一章皆可集齐，熔炼成取经人初始套装 ——
  { id: 'ts_robe_base', name: '锦襕袈裟胚', slot: 'armor',    atk: 0,  hp: 80,  dr: 0.05, reflect: 0.04, desc: '血+80 减伤+5% 反伤+4%（取经人·袈裟 基座）', set: '取经人', setTier: 1, chapter: 1, craftHint: '集齐 袈裟·金线/袈裟·佛纹 可织【锦襕袈裟】' },
  { id: 'ts_staff_base',name: '九环锡杖胚', slot: 'weapon',   atk: 8, matk: 24, hp: 20,  dr: 0,    desc: '攻+8 愿伤+24 血+20（取经人·锡杖 基座·法杖·以愿伤为主）', set: '取经人', setTier: 1, chapter: 1, craftHint: '集齐 锡杖·九环/锡杖·檀木 可铸【九环锡杖】' },
  { id: 'ts_bowl_base', name: '紫金钵胚',   slot: 'treasure', atk: 0,  hp: 20,  dr: 0.03, shieldPct: 0.05, desc: '血+20 减伤+3% 开局护盾+5%（取经人·钵 基座）', set: '取经人', setTier: 1, chapter: 1, craftHint: '集齐 钵·紫金/钵·禅心 可成【紫金钵】' },
  // —— 孙悟空初始三件套 · T1 基座（侧重物伤）——
  { id: 'wk_crown_base', name: '凤翅冠胚',   slot: 'head',    atk: 18, hp: 40, dr: 0.02, desc: '攻+18 血+40（悟空·冠 基座·头冠）', set: '悟空', setTier: 1, chapter: 1, craftHint: '集齐 冠·翎/冠·金 可铸【凤翅紫金冠】' },
  { id: 'wk_armor_base', name: '锁子甲胚',   slot: 'armor',    atk: 10, hp: 90, dr: 0.05, desc: '攻+10 血+90 减伤+5%（悟空·甲 基座）', set: '悟空', setTier: 1, chapter: 1, craftHint: '集齐 甲·环/甲·金 可铸【锁子黄金甲】' },
  { id: 'wk_staff_base', name: '金箍棒胚',   slot: 'weapon',   atk: 35, hp: 20, dr: 0,    desc: '攻+35 血+20（悟空·棒 基座）', set: '悟空', setTier: 1, chapter: 1, craftHint: '集齐 棒·定海/棒·神铁 可铸【如意金箍棒·仿】' },
  // —— 猪八戒初始三件套 · T1 基座（侧重防御）——
  { id: 'bj_rake_base',  name: '钉耙胚',     slot: 'weapon',   atk: 22, hp: 60, dr: 0.04, desc: '攻+22 血+60 减伤+4%（八戒·耙 基座）', set: '八戒', setTier: 1, chapter: 1, craftHint: '集齐 耙·齿/耙·柄 可铸【九齿钉耙】' },
  { id: 'bj_robe_base',  name: '僧衣胚',     slot: 'armor',    atk: 0,  hp: 120,dr: 0.07, reflect: 0.06, desc: '血+120 减伤+7% 反伤+6%（八戒·衣 基座）', set: '八戒', setTier: 1, chapter: 1, craftHint: '集齐 衣·棉/衣·戒 可织【贪嗔僧衣】' },
  { id: 'bj_belly_base', name: '便便肚胚',   slot: 'treasure', atk: 0,  hp: 100,dr: 0.05, shieldPct: 0.08, desc: '血+100 减伤+5% 开局护盾+8%（八戒·腹 基座）', set: '八戒', setTier: 1, chapter: 1, craftHint: '集齐 腹·膘/腹·福 可成【吞山便便肚】' },
  // —— 小白龙(龙马)初始三件套 · T1 基座（侧重闪避）——
  { id: 'lm_saddle_base',name: '马鞍胚',     slot: 'armor',    atk: 8,  hp: 50, dr: 0.03, eva: 0.06, desc: '攻+8 血+50 减伤+3% 闪避+6%（龙马·鞍 基座）', set: '龙马', setTier: 1, chapter: 1, craftHint: '集齐 鞍·云/鞍·风 可铸【踏云马鞍】' },
  { id: 'lm_scale_base', name: '逆鳞胚',     slot: 'armor',    atk: 12, hp: 40, dr: 0.02, eva: 0.05, desc: '攻+12 血+40 减伤+2% 闪避+5%（龙马·鳞 基座）', set: '龙马', setTier: 1, chapter: 1, craftHint: '集齐 鳞·逆/鳞·寒 可铸【护心逆鳞】' },
  { id: 'lm_hoof_base',  name: '龙蹄胚',     slot: 'weapon',   atk: 26, hp: 10, dr: 0,    eva: 0.07, desc: '攻+26 血+10 闪避+7%（龙马·蹄 基座）', set: '龙马', setTier: 1, chapter: 1, craftHint: '集齐 蹄·疾/蹄·雷 可铸【追风龙蹄】' },
  // —— 沙僧初始三件套 · T1 基座（侧重法防）——
  { id: 'ss_staff_base', name: '宝杖胚',     slot: 'weapon',   atk: 30, hp: 50, dr: 0.03, mdef: 0.05, desc: '攻+30 血+50 减伤+3% 法防+5%（沙僧·杖 基座）', set: '沙僧', setTier: 1, chapter: 1, craftHint: '集齐 杖·降妖/杖·沉 可铸【降妖宝杖】' },
  { id: 'ss_skull_base', name: '骷髅串胚',   slot: 'treasure', atk: 5,  hp: 40, dr: 0.04, mdef: 0.06, desc: '攻+5 血+40 减伤+4% 法防+6%（沙僧·串 基座）', set: '沙僧', setTier: 1, chapter: 1, craftHint: '集齐 串·髑/串·咒 可成【骷髅念珠】' },
  { id: 'ss_robe_base',  name: '僧袍胚',     slot: 'armor',    atk: 0,  hp: 90, dr: 0.05, mdef: 0.05, desc: '血+90 减伤+5% 法防+5%（沙僧·袍 基座）', set: '沙僧', setTier: 1, chapter: 1, craftHint: '集齐 袍·麻/袍·禅 可织【沉沙僧袍】' },
  // —— 英雄初始「·凡」凡品（长安临行所赐，弱于 T1 套装，但足以启程）——
  { id: 'ts_staff_fan', name: '九环锡杖·凡', slot: 'weapon',   atk: 0,  matk: 22, hp: 20, dr: 0,    desc: '愿伤+22 血+20（取经人·凡品锡杖·法杖·纯愿伤）', set: '取经人', chapter: 1 },
  { id: 'ts_robe_fan',  name: '锦斓袈裟·凡', slot: 'armor',    atk: 0,  hp: 120,dr: 0.08, mdef: 0.02, desc: '血+120 减伤+8% 法防+2%（取经人·凡品袈裟）', set: '取经人', chapter: 1 },
  { id: 'ts_bowl_fan',  name: '紫金钵盂',     slot: 'treasure', atk: 0,  hp: 30, dr: 0.03, treasure: true, treasureId: 'ts_bowl', owner: 'tangseng', set: '取经人', phase: 'out', charges: 3, desc: '血+30 减伤+3%。【法宝·紫金钵盂·取经人特有】非战斗回满气血（3/3）；可在土地庙补满。', chapter: 1 },
  { id: 'wk_caogun',    name: '草裙',         slot: 'armor',    atk: 0,  hp: 30, dr: 0.02, set: '悟空', desc: '血+30 减伤+2%（悟空·花果山草裙·悟空套）', chapter: 1 },
  { id: 'bj_rake_fan',  name: '九齿钉耙·凡', slot: 'weapon',   atk: 22, hp: 40, dr: 0.02, desc: '攻+22 血+40 减伤+2%（八戒·凡品钉耙）', set: '八戒', chapter: 1 },
  { id: 'bj_robe_fan',  name: '贪嗔僧衣·凡', slot: 'armor',    atk: 0,  hp: 130,dr: 0.06, desc: '血+130 减伤+6%（八戒·凡品僧衣）', set: '八戒', chapter: 1 },
  { id: 'bj_bowl_fan',  name: '净坛宝盂',     slot: 'treasure', atk: 0,  hp: 30, dr: 0.03, treasure: true, treasureId: 'bj_bowl', owner: 'bajie', set: '八戒', phase: 'out', charges: 3, desc: '血+30 减伤+3%。【法宝·净坛宝盂·八戒特有】非战斗回满气血+下战怪物攻-10%（3/3）；可在土地庙补满。', chapter: 1 },
  { id: 'lm_hoof_fan',  name: '追风龙蹄·凡', slot: 'weapon',   atk: 26, hp: 10, dr: 0,    eva: 0.06, desc: '攻+26 血+10 闪避+6%（龙马·凡品龙蹄）', set: '龙马', chapter: 1 },
  { id: 'lm_scale_fan', name: '护心逆鳞·凡', slot: 'armor',    atk: 10, hp: 30, dr: 0.02, eva: 0.05, desc: '攻+10 血+30 减伤+2% 闪避+5%（龙马·凡品逆鳞）', set: '龙马', chapter: 1 },
  { id: 'lm_bowl_fan',  name: '避水珠',       slot: 'treasure', atk: 0,  hp: 30, dr: 0.03, treasure: true, treasureId: 'lm_bowl', owner: 'xiaobailong', set: '龙马', phase: 'out', charges: 3, desc: '血+30 减伤+3%。【法宝·避水珠·龙马专属】非战斗回满气血（3/3）；可在土地庙补满。', chapter: 1 },
  { id: 'ss_staff_fan', name: '降妖宝杖·凡', slot: 'weapon',   atk: 30, hp: 40, dr: 0.03, mdef: 0.04, desc: '攻+30 血+40 减伤+3% 法防+4%（沙僧·凡品宝杖）', set: '沙僧', chapter: 1 },
  { id: 'ss_robe_fan',  name: '沉沙僧袍·凡', slot: 'armor',    atk: 0,  hp: 90, dr: 0.05, mdef: 0.04, desc: '血+90 减伤+5% 法防+4%（沙僧·凡品僧袍）', set: '沙僧', chapter: 1 },
  { id: 'ss_bowl_fan',  name: '降妖念珠·凡', slot: 'treasure', atk: 5,  hp: 30, dr: 0.03, mdef: 0.04, treasure: true, treasureId: 'ss_bowl', owner: 'shaseng', set: '沙僧', phase: 'out', charges: 3, desc: '攻+5 血+30 减伤+3% 法防+4%。【法宝·降妖念珠·沙僧专属】非战斗回满气血+下战怪物攻-10%（3/3）；可在土地庙补满。', chapter: 1 },
  { id: 'jingu_treasure', name: '如意精箍棒', slot: 'treasure', atk: 16, hp: 20, dr: 0.06, treasure: true, treasureId: 'jingu', owner: 'wukong', set: '悟空', phase: 'passive', charges: 0, desc: '攻+16 血+20 减伤+6%。【法宝·如意精箍棒·悟空专属】被动·金箍骤紧：敌人现身即削其 5%~10% 气血；每回合有概率（随法宝增强而提高）附带一记额外物理重击，自动发动、不耗充能。', chapter: 1 },
  // —— 英雄初始四件套补件（头冠·战靴）：长安送行一并赐予，仅作起始行装，eventOnly 不进随机掉池，亦不入顶阶合成链 ——
  { id: 'ts_crown_fan', name: '锦襕僧冠·凡', slot: 'head',    atk: 0,  hp: 60, dr: 0.03, mdef: 0.02, desc: '血+60 减伤+3% 法防+2%（取经人·凡品僧冠）', set: '取经人', chapter: 1, eventOnly: true },
  { id: 'ts_boots_fan', name: '锦襕僧履·凡', slot: 'boots',   atk: 0,  hp: 45, eva: 0.03, desc: '血+45 闪避+3%（取经人·凡品僧履）', set: '取经人', chapter: 1, eventOnly: true },
  { id: 'wk_boots_fan', name: '藕丝步云履·凡', slot: 'boots', atk: 14, hp: 30, eva: 0.05, desc: '攻+14 血+30 闪避+5%（悟空·凡品战靴）', set: '悟空', chapter: 1, eventOnly: true },
  { id: 'bj_crown_fan', name: '僧冠·凡', slot: 'head',   atk: 0,  hp: 65, dr: 0.03, desc: '血+65 减伤+3%（八戒·凡品僧冠）', set: '八戒', chapter: 1, eventOnly: true },
  { id: 'bj_boots_fan', name: '僧履·凡', slot: 'boots',  atk: 0,  hp: 50, eva: 0.02, desc: '血+50 闪避+2%（八戒·凡品僧履）', set: '八戒', chapter: 1, eventOnly: true },
  { id: 'lm_crown_fan', name: '龙鳞冠·凡', slot: 'head',   atk: 6,  hp: 40, dr: 0.02, eva: 0.03, desc: '攻+6 血+40 减伤+2% 闪避+3%（龙马·凡品龙鳞冠）', set: '龙马', chapter: 1, eventOnly: true },
  { id: 'lm_boots_fan', name: '龙鳞履·凡', slot: 'boots',  atk: 8,  hp: 35, eva: 0.06, desc: '攻+8 血+35 闪避+6%（龙马·凡品龙鳞履）', set: '龙马', chapter: 1, eventOnly: true },
  { id: 'ss_crown_fan', name: '僧冠·凡', slot: 'head',   atk: 0,  hp: 60, dr: 0.03, mdef: 0.03, desc: '血+60 减伤+3% 法防+3%（沙僧·凡品僧冠）', set: '沙僧', chapter: 1, eventOnly: true },
  { id: 'ss_boots_fan', name: '僧履·凡', slot: 'boots',  atk: 0,  hp: 45, eva: 0.02, mdef: 0.03, desc: '血+45 闪避+2% 法防+3%（沙僧·凡品僧履）', set: '沙僧', chapter: 1, eventOnly: true },
  // ===== 第二章·中程·迷障（难21-40）装备 =====
  // 21难·金角银角（莲花洞）：紫金红葫芦 → 法宝已含在 CRAFT_POOL
  // —— 第二章·黑风套（中程·迷障）：本章散件统一归入「黑风」套，三主件(甲/宝/兵)可合成升级，副件同套可穿戴 ——
  { id: 'langyajia', name: '狼牙铠',   slot: 'armor',    atk: 0,  hp: 110, dr: 0.10, desc: '血+110 减伤+10%（20难·黑风妖铠·黑风套·甲基座）', set: '黑风', setTier: 1, chapter: 2 },
  { id: 'sanmei',    name: '三昧火种', slot: 'treasure', atk: 15, hp: 30,  dr: 0.06, desc: '攻+15 血+30 减伤+6%（29难·红孩儿·黑风套·宝基座）', set: '黑风', setTier: 1, chapter: 2 },
  { id: 'jingangying', name: '金刚琢影', slot: 'weapon', atk: 35, hp: 30,  dr: 0.08, desc: '攻+35 血+30 减伤+8%（31难·青牛精·黑风套·兵基座）', set: '黑风', setTier: 1, chapter: 2 },
  { id: 'guixi',     name: '龟息甲',   slot: 'armor',    atk: 0,  hp: 150, dr: 0.12, hpRegen: 50, desc: '血+150 减伤+12% 每场战后回血+50（32难·通天河·黑风套·副甲）', set: '黑风', setTier: 1, chapter: 2 },
  { id: 'luotaishi', name: '落胎石',   slot: 'treasure', atk: 0,  hp: 100, dr: 0.08, desc: '血+100 减伤+8%（33难·女儿国·子母河·黑风套·副宝）', set: '黑风', setTier: 1, chapter: 2 },
  { id: 'xieweizhen', name: '蝎尾针',  slot: 'weapon',   atk: 45, hp: 0,   dr: 0,    desc: '攻+45（36难·蝎子精·黑风套·副兵）', set: '黑风', setTier: 1, chapter: 2 },
  // ===== 第三章·乱程·分裂（难41-60）装备 =====
  // —— 第三章·狮驼套（乱程·分裂）：本章散件统一归入「狮驼」套 ——
  { id: 'jiutouji',  name: '九头戟',   slot: 'weapon',   atk: 55, hp: 30, dr: 0.04, desc: '攻+55 血+30 减伤+4%（40难·九头虫·狮驼套·兵基座）', set: '狮驼', setTier: 1, chapter: 3 },
  { id: 'mangzhu',   name: '蟒珠',     slot: 'treasure', atk: 10, hp: 80, dr: 0.06, desc: '攻+10 血+80 减伤+6%（47难·蟒蛇精·狮驼套·宝基座）', set: '狮驼', setTier: 1, chapter: 3 },
  { id: 'gongwu',    name: '拱污甲',   slot: 'armor',    atk: 0,  hp: 170, dr: 0.10, eva: 0.05, desc: '血+170 减伤+10% 闪避+5%（49难·猪圈污妖·狮驼套·甲基座）', set: '狮驼', setTier: 1, chapter: 3 },
  { id: 'zhusi',     name: '蛛丝网',   slot: 'treasure', atk: 5,  hp: 60,  dr: 0.06, eva: 0.10, desc: '攻+5 血+60 减伤+6% 闪避+10%（51难·盘丝洞·狮驼套·副宝）', set: '狮驼', setTier: 1, chapter: 3 },
  { id: 'pengyu',    name: '鹏羽刃',   slot: 'weapon',   atk: 65, hp: 0,   dr: 0,    desc: '攻+65（54难·狮驼岭·大鹏·狮驼套·副兵）', set: '狮驼', setTier: 1, chapter: 3 },
  // ===== 第四章·终程·脱局（难61-81）装备 =====
  // —— 第四章·凌云套（终程·脱局）：本章散件统一归入「凌云」套 ——
  { id: 'meiban',    name: '梅瓣甲',   slot: 'armor',    atk: 0,  hp: 200, dr: 0.15, eva: 0.08, desc: '血+200 减伤+15% 闪避+8%（62难·梅岭梅妖·凌云套·甲基座）', set: '凌云', setTier: 1, chapter: 4 },
  { id: 'xijiao',    name: '犀角刃',   slot: 'weapon',   atk: 70, hp: 40,  dr: 0.05, desc: '攻+70 血+40 减伤+5%（67难·犀牛精·凌云套·兵基座）', set: '凌云', setTier: 1, chapter: 4 },
  { id: 'yuehua',    name: '月华影',   slot: 'treasure', atk: 15, hp: 90,  dr: 0.08, eva: 0.10, desc: '攻+15 血+90 减伤+8% 闪避+10%（73难·玉兔·天竺·凌云套·宝基座）', set: '凌云', setTier: 1, chapter: 4 },
  { id: 'shajingshi',name: '晒经石',   slot: 'treasure', atk: 0,  hp: 150, dr: 0.12, hpRegen: 100, desc: '血+150 减伤+12% 每场战后回血+100（80难·晒经·终局纪念·凌云套·副宝）', set: '凌云', setTier: 1, chapter: 4 },
  { id: 'wudichuan', name: '无底船骨', slot: 'treasure', atk: 10, hp: 120, dr: 0.10, desc: '攻+10 血+120 减伤+10%（79难·凌云渡·无底船·凌云套·副宝）', set: '凌云', setTier: 1, chapter: 4 },

  // ============ 扩充·各章中高阶散件（白字基础装备，魔塔随节点掉落，增加池深避免重复） ============
  // —— 第一章·杂项散件（廉价值，凡品过渡填充） ——

  // —— 第二章·中阶散件（黑风/黄风/流沙中段，魔王部将） ——

  // —— 第三章·高阶散件（狮驼/盘丝/狐火段） ——

  // —— 第四章·终阶散件（天竺/月宫/凌云段） ——

  // ============ 随节点升级的「金钱套装」（盘缠套：纯靠gold在坊市/土地庙升级购买，不靠材料合成） ============
  // 每章一套三件（武器/护甲/法宝），分初/中/高三阶，随进度替换上阶、旧阶自动退居可选。
  // —— 第一章·散财套（行脚商贩线） ——
  { id: 'pc_w1', name: '散财短刀',   slot: 'weapon',   atk: 26, hp: 0,   dr: 0,    desc: '攻+26（盘缠套·初阶·坊市购）', set: '盘缠', setTier: 1, chapter: 1, cost: 40 },
  { id: 'pc_a1', name: '散财布衣',   slot: 'armor',    atk: 0,  hp: 90,  dr: 0.05, desc: '血+90 减伤+5%（盘缠套·初阶·坊市购）', set: '盘缠', setTier: 1, chapter: 1, cost: 40 },
  { id: 'pc_t1', name: '散财钱袋',   slot: 'treasure', atk: 0,  hp: 40,  dr: 0.04, desc: '血+40 减伤+4%（盘缠套·初阶·坊市购）', set: '盘缠', setTier: 1, chapter: 1, cost: 40 },
  { id: 'pc_w1m',name: '散财钢刀',   slot: 'weapon',   atk: 42, hp: 10,  dr: 0.02, desc: '攻+42 血+10 减伤+2%（盘缠套·中阶）', set: '盘缠', setTier: 2, chapter: 1, cost: 120 },
  { id: 'pc_a1m',name: '散财皮甲',   slot: 'armor',    atk: 0,  hp: 150, dr: 0.08, desc: '血+150 减伤+8%（盘缠套·中阶）', set: '盘缠', setTier: 2, chapter: 1, cost: 120 },
  { id: 'pc_t1m',name: '散财银囊',   slot: 'treasure', atk: 0,  hp: 70,  dr: 0.07, desc: '血+70 减伤+7%（盘缠套·中阶）', set: '盘缠', setTier: 2, chapter: 1, cost: 120 },
  { id: 'pc_w1h',name: '散财宝刃',   slot: 'weapon',   atk: 60, hp: 30,  dr: 0.04, desc: '攻+60 血+30 减伤+4%（盘缠套·高阶）', set: '盘缠', setTier: 3, chapter: 1, cost: 320 },
  { id: 'pc_a1h',name: '散财锦衣',   slot: 'armor',    atk: 0,  hp: 220, dr: 0.12, desc: '血+220 减伤+12%（盘缠套·高阶）', set: '盘缠', setTier: 3, chapter: 1, cost: 320 },
  { id: 'pc_t1h',name: '散财金珠',   slot: 'treasure', atk: 10, hp: 110, dr: 0.10, desc: '攻+10 血+110 减伤+10%（盘缠套·高阶）', set: '盘缠', setTier: 3, chapter: 1, cost: 320 },

  // —— 第二章·盘缠套（黑市商队线） ——
  { id: 'pc_w2', name: '黑市弯刀',   slot: 'weapon',   atk: 50, hp: 20,  dr: 0.03, desc: '攻+50 血+20 减伤+3%（盘缠套·二阶初阶）', set: '盘缠', setTier: 1, chapter: 2, cost: 180 },
  { id: 'pc_a2', name: '黑市皮甲',   slot: 'armor',    atk: 0,  hp: 180, dr: 0.10, desc: '血+180 减伤+10%（盘缠套·二阶初阶）', set: '盘缠', setTier: 1, chapter: 2, cost: 180 },
  { id: 'pc_t2', name: '黑市密囊',   slot: 'treasure', atk: 0,  hp: 90,  dr: 0.08, desc: '血+90 减伤+8%（盘缠套·二阶初阶）', set: '盘缠', setTier: 1, chapter: 2, cost: 180 },
  { id: 'pc_w2m',name: '黑市精钢刀', slot: 'weapon',   atk: 70, hp: 40,  dr: 0.05, desc: '攻+70 血+40 减伤+5%（盘缠套·二阶中阶）', set: '盘缠', setTier: 2, chapter: 2, cost: 460 },
  { id: 'pc_a2m',name: '黑市锁子甲', slot: 'armor',    atk: 0,  hp: 260, dr: 0.14, desc: '血+260 减伤+14%（盘缠套·二阶中阶）', set: '盘缠', setTier: 2, chapter: 2, cost: 460 },
  { id: 'pc_t2m',name: '黑市宝匣',   slot: 'treasure', atk: 10, hp: 140, dr: 0.11, desc: '攻+10 血+140 减伤+11%（盘缠套·二阶中阶）', set: '盘缠', setTier: 2, chapter: 2, cost: 460 },
  { id: 'pc_w2h',name: '黑市魔刃',   slot: 'weapon',   atk: 92, hp: 60,  dr: 0.07, desc: '攻+92 血+60 减伤+7%（盘缠套·二阶高阶）', set: '盘缠', setTier: 3, chapter: 2, cost: 980 },
  { id: 'pc_a2h',name: '黑市玄甲',   slot: 'armor',    atk: 0,  hp: 340, dr: 0.18, desc: '血+340 减伤+18%（盘缠套·二阶高阶）', set: '盘缠', setTier: 3, chapter: 2, cost: 980 },
  { id: 'pc_t2h',name: '黑市秘珠',   slot: 'treasure', atk: 20, hp: 190, dr: 0.14, desc: '攻+20 血+190 减伤+14%（盘缠套·二阶高阶）', set: '盘缠', setTier: 3, chapter: 2, cost: 980 },

  // —— 第三章·盘缠套（西域商路） ——
  { id: 'pc_w3', name: '西域长剑',   slot: 'weapon',   atk: 80, hp: 50,  dr: 0.05, eva: 0.04, desc: '攻+80 血+50 减伤+5% 闪避+4%（盘缠套·三阶初阶）', set: '盘缠', setTier: 1, chapter: 3, cost: 640 },
  { id: 'pc_a3', name: '西域战甲',   slot: 'armor',    atk: 0,  hp: 320, dr: 0.16, eva: 0.04, desc: '血+320 减伤+16% 闪避+4%（盘缠套·三阶初阶）', set: '盘缠', setTier: 1, chapter: 3, cost: 640 },
  { id: 'pc_t3', name: '西域圣物',   slot: 'treasure', atk: 15, hp: 170, dr: 0.13, eva: 0.04, desc: '攻+15 血+170 减伤+13% 闪避+4%（盘缠套·三阶初阶）', set: '盘缠', setTier: 1, chapter: 3, cost: 640 },
  { id: 'pc_w3m',name: '西域魔剑',   slot: 'weapon',   atk: 104,hp: 80,  dr: 0.07, eva: 0.06, desc: '攻+104 血+80 减伤+7% 闪避+6%（盘缠套·三阶中阶）', set: '盘缠', setTier: 2, chapter: 3, cost: 1480 },
  { id: 'pc_a3m',name: '西域龙鳞甲', slot: 'armor',    atk: 0,  hp: 420, dr: 0.20, eva: 0.06, desc: '血+420 减伤+20% 闪避+6%（盘缠套·三阶中阶）', set: '盘缠', setTier: 2, chapter: 3, cost: 1480 },
  { id: 'pc_t3m',name: '西域佛珠',   slot: 'treasure', atk: 25, hp: 230, dr: 0.16, eva: 0.06, desc: '攻+25 血+230 减伤+16% 闪避+6%（盘缠套·三阶中阶）', set: '盘缠', setTier: 2, chapter: 3, cost: 1480 },
  { id: 'pc_w3h',name: '西域圣刃',   slot: 'weapon',   atk: 128,hp: 110, dr: 0.09, eva: 0.08, desc: '攻+128 血+110 减伤+9% 闪避+8%（盘缠套·三阶高阶）', set: '盘缠', setTier: 3, chapter: 3, cost: 2980 },
  { id: 'pc_a3h',name: '西域金身甲', slot: 'armor',    atk: 0,  hp: 520, dr: 0.24, eva: 0.08, desc: '血+520 减伤+24% 闪避+8%（盘缠套·三阶高阶）', set: '盘缠', setTier: 3, chapter: 3, cost: 2980 },
  { id: 'pc_t3h',name: '西域舍利',   slot: 'treasure', atk: 35, hp: 290, dr: 0.18, eva: 0.08, desc: '攻+35 血+290 减伤+18% 闪避+8%（盘缠套·三阶高阶）', set: '盘缠', setTier: 3, chapter: 3, cost: 2980 },

  // —— 第四章·盘缠套（灵山贡品） ——
  { id: 'pc_w4', name: '贡品金戈',   slot: 'weapon',   atk: 110,hp: 80,  dr: 0.07, eva: 0.05, desc: '攻+110 血+80 减伤+7% 闪避+5%（盘缠套·四阶初阶）', set: '盘缠', setTier: 1, chapter: 4, cost: 1680 },
  { id: 'pc_a4', name: '贡品法衣',   slot: 'armor',    atk: 0,  hp: 440, dr: 0.20, eva: 0.05, desc: '血+440 减伤+20% 闪避+5%（盘缠套·四阶初阶）', set: '盘缠', setTier: 1, chapter: 4, cost: 1680 },
  { id: 'pc_t4', name: '贡品宝瓶',   slot: 'treasure', atk: 20, hp: 240, dr: 0.16, eva: 0.05, desc: '攻+20 血+240 减伤+16% 闪避+5%（盘缠套·四阶初阶）', set: '盘缠', setTier: 1, chapter: 4, cost: 1680 },
  { id: 'pc_w4m',name: '贡品神戈',   slot: 'weapon',   atk: 138,hp: 120, dr: 0.10, eva: 0.07, desc: '攻+138 血+120 减伤+10% 闪避+7%（盘缠套·四阶中阶）', set: '盘缠', setTier: 2, chapter: 4, cost: 3680 },
  { id: 'pc_a4m',name: '贡品金缕衣', slot: 'armor',    atk: 0,  hp: 560, dr: 0.25, eva: 0.07, desc: '血+560 减伤+25% 闪避+7%（盘缠套·四阶中阶）', set: '盘缠', setTier: 2, chapter: 4, cost: 3680 },
  { id: 'pc_t4m',name: '贡品舍利瓶', slot: 'treasure', atk: 35, hp: 310, dr: 0.20, eva: 0.07, desc: '攻+35 血+310 减伤+20% 闪避+7%（盘缠套·四阶中阶）', set: '盘缠', setTier: 2, chapter: 4, cost: 3680 },
  { id: 'pc_w4h',name: '贡品圣戟',   slot: 'weapon',   atk: 168,hp: 160, dr: 0.13, eva: 0.10, desc: '攻+168 血+160 减伤+13% 闪避+10%（盘缠套·四阶高阶）', set: '盘缠', setTier: 3, chapter: 4, cost: 6880 },
  { id: 'pc_a4h',name: '贡品佛光衣', slot: 'armor',    atk: 0,  hp: 700, dr: 0.30, eva: 0.10, desc: '血+700 减伤+30% 闪避+10%（盘缠套·四阶高阶）', set: '盘缠', setTier: 3, chapter: 4, cost: 6880 },
  { id: 'pc_t4h',name: '贡品功德珠', slot: 'treasure', atk: 50, hp: 380, dr: 0.24, eva: 0.10, desc: '攻+50 血+380 减伤+24% 闪避+10%（盘缠套·四阶高阶）', set: '盘缠', setTier: 3, chapter: 4, cost: 6880 },

  // ============ 六道专职·隐/逆 两套旧三件套已由 V8.42 四件套升级链取代 ============
  // 影遁(隐)→yd_* 四件套+组件；逆命(逆)→nm_* 四件套+组件（见 EQUIP_POOL 尾部六道同构四件套）
  // ============ 八套合成套装·基座（V8.23·参照47场战斗规划，每章2套） ============
  // —— 第一章·天命套：攻防均衡 ——
  { id: 'tm_w_base', name: '天命剑胚',   slot: 'weapon',   atk: 22, hp: 15,  dr: 0,    desc: '攻+22 血+15（天命·剑·兵基座）', set: '天命', chapter: 1 },
  { id: 'tm_a_base', name: '天命甲胚',   slot: 'armor',    atk: 0,  hp: 100, dr: 0.06, desc: '血+100 减伤+6%（天命·甲·甲基座）', set: '天命', chapter: 1 },
  { id: 'tm_t_base', name: '天命佩胚',   slot: 'treasure', atk: 8,  hp: 45,  dr: 0.04, desc: '攻+8 血+45 减伤+4%（天命·佩·宝基座）', set: '天命', chapter: 1 },
  // —— 第一章·渡厄套：减伤回复 ——
  { id: 'de_w_base', name: '渡厄杖胚',   slot: 'weapon',   atk: 15, hp: 25,  dr: 0.04, desc: '攻+15 血+25 减伤+4%（渡厄·杖·兵基座）', set: '渡厄', chapter: 1 },
  { id: 'de_a_base', name: '渡厄袍胚',   slot: 'armor',    atk: 0,  hp: 130, dr: 0.08, hpRegen: 5, desc: '血+130 减伤+8% 回血+5（渡厄·袍·甲基座）', set: '渡厄', chapter: 1 },
  { id: 'de_t_base', name: '渡厄珠胚',   slot: 'treasure', atk: 0,  hp: 60,  dr: 0.06, hpRegen: 3, desc: '血+60 减伤+6% 回血+3（渡厄·珠·宝基座）', set: '渡厄', chapter: 1 },
  // —— 第二章·镇妖套：暴击破甲 ——
  { id: 'zy_w_base', name: '镇妖剑胚',   slot: 'weapon',   atk: 28, hp: 10,  dr: 0,    crit: 0.04, desc: '攻+28 暴击+4%（镇妖·剑·兵基座）', set: '镇妖', chapter: 2 },
  { id: 'zy_a_base', name: '镇妖甲胚',   slot: 'armor',    atk: 0,  hp: 90,  dr: 0.05, desc: '血+90 减伤+5%（镇妖·甲·甲基座）', set: '镇妖', chapter: 2 },
  { id: 'zy_t_base', name: '镇妖符胚',   slot: 'treasure', atk: 12, hp: 40,  dr: 0,    crit: 0.03, desc: '攻+12 血+40 暴击+3%（镇妖·符·宝基座）', set: '镇妖', chapter: 2 },
  // —— 第二章·幽冥套：闪避暗杀 ——
  { id: 'ym_w_base', name: '幽冥刃胚',   slot: 'weapon',   atk: 20, hp: 8,   dr: 0,    eva: 0.06, desc: '攻+20 闪避+6%（幽冥·刃·兵基座）', set: '幽冥', chapter: 2 },
  { id: 'ym_a_base', name: '幽冥衣胚',   slot: 'armor',    atk: 0,  hp: 100, dr: 0.04, eva: 0.08, desc: '血+100 减伤+4% 闪避+8%（幽冥·衣·甲基座）', set: '幽冥', chapter: 2 },
  { id: 'ym_t_base', name: '幽冥佩胚',   slot: 'treasure', atk: 8,  hp: 50,  dr: 0,    eva: 0.10, desc: '攻+8 血+50 闪避+10%（幽冥·佩·宝基座）', set: '幽冥', chapter: 2 },
  // —— 第三章·涅槃套：气血回复 ——
  { id: 'np_w_base', name: '涅槃杖胚',   slot: 'weapon',   atk: 18, hp: 30,  dr: 0,    hpRegen: 4, desc: '攻+18 血+30 回血+4（涅槃·杖·兵基座）', set: '涅槃', chapter: 3 },
  { id: 'np_a_base', name: '涅槃袍胚',   slot: 'armor',    atk: 0,  hp: 140, dr: 0.07, hpRegen: 8, desc: '血+140 减伤+7% 回血+8（涅槃·袍·甲基座）', set: '涅槃', chapter: 3 },
  { id: 'np_t_base', name: '涅槃珠胚',   slot: 'treasure', atk: 0,  hp: 70,  dr: 0.05, hpRegen: 5, desc: '血+70 减伤+5% 回血+5（涅槃·珠·宝基座）', set: '涅槃', chapter: 3 },
  // —— 第三章·降魔套：攻击爆发 ——
  { id: 'jm_w_base', name: '降魔枪胚',   slot: 'weapon',   atk: 35, hp: 5,   dr: 0,    desc: '攻+35 血+5（降魔·枪·兵基座）', set: '降魔', chapter: 3 },
  { id: 'jm_a_base', name: '降魔甲胚',   slot: 'armor',    atk: 10, hp: 80,  dr: 0.04, desc: '攻+10 血+80 减伤+4%（降魔·甲·甲基座）', set: '降魔', chapter: 3 },
  { id: 'jm_t_base', name: '降魔坠胚',   slot: 'treasure', atk: 18, hp: 30,  dr: 0,    desc: '攻+18 血+30（降魔·坠·宝基座）', set: '降魔', chapter: 3 },
  // —— 第四章·封神套：全属性 ——
  { id: 'fs_w_base', name: '封神剑胚',   slot: 'weapon',   atk: 32, hp: 20,  dr: 0.03, crit: 0.03, desc: '攻+32 血+20 减伤+3% 暴击+3%（封神·剑·兵基座）', set: '封神', chapter: 4 },
  { id: 'fs_a_base', name: '封神甲胚',   slot: 'armor',    atk: 0,  hp: 150, dr: 0.09, hpRegen: 6, desc: '血+150 减伤+9% 回血+6（封神·甲·甲基座）', set: '封神', chapter: 4 },
  { id: 'fs_t_base', name: '封神佩胚',   slot: 'treasure', atk: 15, hp: 70,  dr: 0.06, desc: '攻+15 血+70 减伤+6%（封神·佩·宝基座）', set: '封神', chapter: 4 },
  // —— 第四章·轮回套：闪避暴击 ——
  { id: 'lh_w_base', name: '轮回刃胚',   slot: 'weapon',   atk: 25, hp: 12,  dr: 0,    eva: 0.04, crit: 0.03, desc: '攻+25 血+12 闪避+4% 暴击+3%（轮回·刃·兵基座）', set: '轮回', chapter: 4 },
  { id: 'lh_a_base', name: '轮回衣胚',   slot: 'armor',    atk: 0,  hp: 120, dr: 0.06, eva: 0.06, desc: '血+120 减伤+6% 闪避+6%（轮回·衣·甲基座）', set: '轮回', chapter: 4 },
  { id: 'lh_t_base', name: '轮回珠胚',   slot: 'treasure', atk: 10, hp: 55,  dr: 0,    eva: 0.08, crit: 0.04, desc: '攻+10 血+55 闪避+8% 暴击+4%（轮回·珠·宝基座）', set: '轮回', chapter: 4 },
  // —— 贪狼四件套 · 第一阶（T1 基座，chapter 1~2 可掉落）：四槽各一件，攻守兼备（攻+血）——
  // 凑齐四件 T1 可合成【贪狼·聚灵】组件（一转）；后随章节升级链推进（T2→T3）
  { id: 'tl_w1', name: '贪狼·初刃', slot: 'weapon', atk: 25, hp: 10, dr: 0,    desc: '攻+25 血+10（贪狼套·兵·T1 基座）', set: '贪狼', setTier: 1, chapter: 1 },
  { id: 'tl_a1', name: '贪狼·初甲', slot: 'armor',  atk: 0,  hp: 95, dr: 0.05, desc: '血+95 减伤+5%（贪狼套·甲·T1 基座）', set: '贪狼', setTier: 1, chapter: 1 },
  { id: 'tl_h1', name: '贪狼·初盔', slot: 'head',   atk: 9,  hp: 40, dr: 0,    desc: '攻+9 血+40（贪狼套·盔·T1 基座）', set: '贪狼', setTier: 1, chapter: 1 },
  { id: 'tl_b1', name: '贪狼·初靴', slot: 'boots',  atk: 0,  hp: 35, eva: 0.02, desc: '血+35 闪避+2%（贪狼套·靴·T1 基座）', set: '贪狼', setTier: 1, chapter: 1 },
  // —— 贪狼四件套 · 第二阶（T2 基座，chapter 2~3 可掉落）——
  { id: 'tl_w2', name: '贪狼·中刃', slot: 'weapon', atk: 50, hp: 22, dr: 0,    desc: '攻+50 血+22（贪狼套·兵·T2 基座）', set: '贪狼', setTier: 1, chapter: 2 },
  { id: 'tl_a2', name: '贪狼·中甲', slot: 'armor',  atk: 0,  hp: 185, dr: 0.10, desc: '血+185 减伤+10%（贪狼套·甲·T2 基座）', set: '贪狼', setTier: 1, chapter: 2 },
  { id: 'tl_h2', name: '贪狼·中盔', slot: 'head',   atk: 18, hp: 78, dr: 0,    desc: '攻+18 血+78（贪狼套·盔·T2 基座）', set: '贪狼', setTier: 1, chapter: 2 },
  { id: 'tl_b2', name: '贪狼·中靴', slot: 'boots',  atk: 0,  hp: 68, eva: 0.05, desc: '血+68 闪避+5%（贪狼套·靴·T2 基座）', set: '贪狼', setTier: 1, chapter: 2 },
  // —— 贪狼四件套 · 第三阶（T3 基座，chapter 3~4 可掉落）——
  { id: 'tl_w3', name: '贪狼·天狼刃', slot: 'weapon', atk: 88, hp: 35, dr: 0,    desc: '攻+88 血+35（贪狼套·兵·T3 基座）', set: '贪狼', setTier: 1, chapter: 3 },
  { id: 'tl_a3', name: '贪狼·天狼甲', slot: 'armor',  atk: 0,  hp: 330, dr: 0.18, desc: '血+330 减伤+18%（贪狼套·甲·T3 基座）', set: '贪狼', setTier: 1, chapter: 3 },
  { id: 'tl_h3', name: '贪狼·天狼盔', slot: 'head',   atk: 32, hp: 138, dr: 0,    desc: '攻+32 血+138（贪狼套·盔·T3 基座）', set: '贪狼', setTier: 1, chapter: 3 },
  { id: 'tl_b3', name: '贪狼·天狼靴', slot: 'boots',  atk: 0,  hp: 118, eva: 0.08, desc: '血+118 闪避+8%（贪狼套·靴·T3 基座）', set: '贪狼', setTier: 1, chapter: 3 },
  // ============ 六道同构四件套（V8.42）：破军(战)/玄武(渡)/影遁(隐)/逆命(逆) ============
  // 与贪狼同构：四槽(weapon/armor/head/boots)三阶(T1/T2/T3)各一件，chapter 1/2/3 逐章解锁；
  // 凑齐四件 T1→合成组件1(一转)、+T2→组件2(二转)、+T3→组件3(三转)，组件包裹中生效激活 SET_JOBS。
  // —— 破军套（战·攻击向）· T1 ——
  { id: 'pw_w1', name: '破军·初刃', slot: 'weapon', atk: 32, hp: 8, dr: 0,    desc: '攻+32 血+8（破军套·兵·T1 基座）', set: '破军', setTier: 1, chapter: 1 },
  { id: 'pw_a1', name: '破军·初甲', slot: 'armor',  atk: 6,  hp: 80, dr: 0.04, desc: '攻+6 血+80 减伤+4%（破军套·甲·T1 基座）', set: '破军', setTier: 1, chapter: 1 },
  { id: 'pw_h1', name: '破军·初盔', slot: 'head',   atk: 12, hp: 32, dr: 0,    desc: '攻+12 血+32（破军套·盔·T1 基座）', set: '破军', setTier: 1, chapter: 1 },
  { id: 'pw_b1', name: '破军·初靴', slot: 'boots',  atk: 10, hp: 26, eva: 0.02, desc: '攻+10 血+26 闪避+2%（破军套·靴·T1 基座）', set: '破军', setTier: 1, chapter: 1 },
  // —— 破军套 · T2 ——
  { id: 'pw_w2', name: '破军·中刃', slot: 'weapon', atk: 60, hp: 16, dr: 0,    desc: '攻+60 血+16（破军套·兵·T2 基座）', set: '破军', setTier: 1, chapter: 2 },
  { id: 'pw_a2', name: '破军·中甲', slot: 'armor',  atk: 12, hp: 155, dr: 0.08, desc: '攻+12 血+155 减伤+8%（破军套·甲·T2 基座）', set: '破军', setTier: 1, chapter: 2 },
  { id: 'pw_h2', name: '破军·中盔', slot: 'head',   atk: 24, hp: 62, dr: 0,    desc: '攻+24 血+62（破军套·盔·T2 基座）', set: '破军', setTier: 1, chapter: 2 },
  { id: 'pw_b2', name: '破军·中靴', slot: 'boots',  atk: 20, hp: 50, eva: 0.04, desc: '攻+20 血+50 闪避+4%（破军套·靴·T2 基座）', set: '破军', setTier: 1, chapter: 2 },
  // —— 破军套 · T3 ——
  { id: 'pw_w3', name: '破军·弑神刃', slot: 'weapon', atk: 105, hp: 28, dr: 0,    desc: '攻+105 血+28（破军套·兵·T3 基座）', set: '破军', setTier: 1, chapter: 3 },
  { id: 'pw_a3', name: '破军·弑神甲', slot: 'armor',  atk: 22, hp: 275, dr: 0.14, desc: '攻+22 血+275 减伤+14%（破军套·甲·T3 基座）', set: '破军', setTier: 1, chapter: 3 },
  { id: 'pw_h3', name: '破军·弑神盔', slot: 'head',   atk: 42, hp: 110, dr: 0,    desc: '攻+42 血+110（破军套·盔·T3 基座）', set: '破军', setTier: 1, chapter: 3 },
  { id: 'pw_b3', name: '破军·弑神靴', slot: 'boots',  atk: 35, hp: 88, eva: 0.07, desc: '攻+35 血+88 闪避+7%（破军套·靴·T3 基座）', set: '破军', setTier: 1, chapter: 3 },
  // —— 玄武套（渡·防御向）· T1 ——
  { id: 'xw_w1', name: '玄武·初柱', slot: 'weapon', atk: 18, hp: 28, dr: 0,    desc: '攻+18 血+28（玄武套·兵·T1 基座）', set: '玄武', setTier: 1, chapter: 1 },
  { id: 'xw_a1', name: '玄武·初甲', slot: 'armor',  atk: 0,  hp: 130, dr: 0.08, desc: '血+130 减伤+8%（玄武套·甲·T1 基座）', set: '玄武', setTier: 1, chapter: 1 },
  { id: 'xw_h1', name: '玄武·初盔', slot: 'head',   atk: 6,  hp: 58, dr: 0.04,  desc: '攻+6 血+58 减伤+4%（玄武套·盔·T1 基座）', set: '玄武', setTier: 1, chapter: 1 },
  { id: 'xw_b1', name: '玄武·初靴', slot: 'boots',  atk: 0,  hp: 50, dr: 0.03,  desc: '血+50 减伤+3%（玄武套·靴·T1 基座）', set: '玄武', setTier: 1, chapter: 1 },
  // —— 玄武套 · T2 ——
  { id: 'xw_w2', name: '玄武·中柱', slot: 'weapon', atk: 34, hp: 55, dr: 0,    desc: '攻+34 血+55（玄武套·兵·T2 基座）', set: '玄武', setTier: 1, chapter: 2 },
  { id: 'xw_a2', name: '玄武·中甲', slot: 'armor',  atk: 0,  hp: 255, dr: 0.16, desc: '血+255 减伤+16%（玄武套·甲·T2 基座）', set: '玄武', setTier: 1, chapter: 2 },
  { id: 'xw_h2', name: '玄武·中盔', slot: 'head',   atk: 12, hp: 115, dr: 0.08, desc: '攻+12 血+115 减伤+8%（玄武套·盔·T2 基座）', set: '玄武', setTier: 1, chapter: 2 },
  { id: 'xw_b2', name: '玄武·中靴', slot: 'boots',  atk: 0,  hp: 98, dr: 0.06,  desc: '血+98 减伤+6%（玄武套·靴·T2 基座）', set: '玄武', setTier: 1, chapter: 2 },
  // —— 玄武套 · T3 ——
  { id: 'xw_w3', name: '玄武·镇海柱', slot: 'weapon', atk: 58, hp: 95, dr: 0,    desc: '攻+58 血+95（玄武套·兵·T3 基座）', set: '玄武', setTier: 1, chapter: 3 },
  { id: 'xw_a3', name: '玄武·镇海甲', slot: 'armor',  atk: 0,  hp: 450, dr: 0.28, desc: '血+450 减伤+28%（玄武套·甲·T3 基座）', set: '玄武', setTier: 1, chapter: 3 },
  { id: 'xw_h3', name: '玄武·镇海盔', slot: 'head',   atk: 20, hp: 200, dr: 0.14, desc: '攻+20 血+200 减伤+14%（玄武套·盔·T3 基座）', set: '玄武', setTier: 1, chapter: 3 },
  { id: 'xw_b3', name: '玄武·镇海靴', slot: 'boots',  atk: 0,  hp: 170, dr: 0.10, desc: '血+170 减伤+10%（玄武套·靴·T3 基座）', set: '玄武', setTier: 1, chapter: 3 },
  // —— 影遁套（隐·闪避向）· T1 ——
  { id: 'yd_w1', name: '影遁·初影', slot: 'weapon', atk: 22, hp: 8, dr: 0,    eva: 0.04, desc: '攻+22 闪避+4%（影遁套·兵·T1 基座）', set: '影遁', setTier: 1, chapter: 1 },
  { id: 'yd_a1', name: '影遁·初袍', slot: 'armor',  atk: 0,  hp: 85, dr: 0.05, eva: 0.05, desc: '血+85 减伤+5% 闪避+5%（影遁套·甲·T1 基座）', set: '影遁', setTier: 1, chapter: 1 },
  { id: 'yd_h1', name: '影遁·初冠', slot: 'head',   atk: 8,  hp: 30, dr: 0,    eva: 0.05, desc: '攻+8 血+30 闪避+5%（影遁套·盔·T1 基座）', set: '影遁', setTier: 1, chapter: 1 },
  { id: 'yd_b1', name: '影遁·初靴', slot: 'boots',  atk: 6,  hp: 24, dr: 0,    eva: 0.06, desc: '攻+6 血+24 闪避+6%（影遁套·靴·T1 基座）', set: '影遁', setTier: 1, chapter: 1 },
  // —— 影遁套 · T2 ——
  { id: 'yd_w2', name: '影遁·中影', slot: 'weapon', atk: 42, hp: 16, dr: 0,    eva: 0.08, desc: '攻+42 闪避+8%（影遁套·兵·T2 基座）', set: '影遁', setTier: 1, chapter: 2 },
  { id: 'yd_a2', name: '影遁·中袍', slot: 'armor',  atk: 0,  hp: 165, dr: 0.10, eva: 0.10, desc: '血+165 减伤+10% 闪避+10%（影遁套·甲·T2 基座）', set: '影遁', setTier: 1, chapter: 2 },
  { id: 'yd_h2', name: '影遁·中冠', slot: 'head',   atk: 16, hp: 58, dr: 0,    eva: 0.10, desc: '攻+16 血+58 闪避+10%（影遁套·盔·T2 基座）', set: '影遁', setTier: 1, chapter: 2 },
  { id: 'yd_b2', name: '影遁·中靴', slot: 'boots',  atk: 12, hp: 46, dr: 0,    eva: 0.12, desc: '攻+12 血+46 闪避+12%（影遁套·靴·T2 基座）', set: '影遁', setTier: 1, chapter: 2 },
  // —— 影遁套 · T3 ——
  { id: 'yd_w3', name: '影遁·无形刃', slot: 'weapon', atk: 72, hp: 28, dr: 0,    eva: 0.14, desc: '攻+72 闪避+14%（影遁套·兵·T3 基座）', set: '影遁', setTier: 1, chapter: 3 },
  { id: 'yd_a3', name: '影遁·无形袍', slot: 'armor',  atk: 0,  hp: 290, dr: 0.18, eva: 0.18, desc: '血+290 减伤+18% 闪避+18%（影遁套·甲·T3 基座）', set: '影遁', setTier: 1, chapter: 3 },
  { id: 'yd_h3', name: '影遁·无形冠', slot: 'head',   atk: 28, hp: 100, dr: 0,    eva: 0.18, desc: '攻+28 血+100 闪避+18%（影遁套·盔·T3 基座）', set: '影遁', setTier: 1, chapter: 3 },
  { id: 'yd_b3', name: '影遁·无形靴', slot: 'boots',  atk: 20, hp: 80, dr: 0,    eva: 0.22, desc: '攻+20 血+80 闪避+22%（影遁套·靴·T3 基座）', set: '影遁', setTier: 1, chapter: 3 },
  // —— 逆命套（逆·全加向）· T1 ——
  { id: 'nm_w1', name: '逆命·初刃', slot: 'weapon', atk: 26, hp: 12, dr: 0,    desc: '攻+26 血+12（逆命套·兵·T1 基座）', set: '逆命', setTier: 1, chapter: 1 },
  { id: 'nm_a1', name: '逆命·初甲', slot: 'armor',  atk: 4,  hp: 95, dr: 0.05, desc: '攻+4 血+95 减伤+5%（逆命套·甲·T1 基座）', set: '逆命', setTier: 1, chapter: 1 },
  { id: 'nm_h1', name: '逆命·初盔', slot: 'head',   atk: 10, hp: 36, dr: 0.02, desc: '攻+10 血+36 减伤+2%（逆命套·盔·T1 基座）', set: '逆命', setTier: 1, chapter: 1 },
  { id: 'nm_b1', name: '逆命·初靴', slot: 'boots',  atk: 8,  hp: 30, eva: 0.02, desc: '攻+8 血+30 闪避+2%（逆命套·靴·T1 基座）', set: '逆命', setTier: 1, chapter: 1 },
  // —— 逆命套 · T2 ——
  { id: 'nm_w2', name: '逆命·中刃', slot: 'weapon', atk: 50, hp: 24, dr: 0,    desc: '攻+50 血+24（逆命套·兵·T2 基座）', set: '逆命', setTier: 1, chapter: 2 },
  { id: 'nm_a2', name: '逆命·中甲', slot: 'armor',  atk: 8,  hp: 185, dr: 0.10, desc: '攻+8 血+185 减伤+10%（逆命套·甲·T2 基座）', set: '逆命', setTier: 1, chapter: 2 },
  { id: 'nm_h2', name: '逆命·中盔', slot: 'head',   atk: 20, hp: 70, dr: 0.04, desc: '攻+20 血+70 减伤+4%（逆命套·盔·T2 基座）', set: '逆命', setTier: 1, chapter: 2 },
  { id: 'nm_b2', name: '逆命·中靴', slot: 'boots',  atk: 16, hp: 58, eva: 0.04, desc: '攻+16 血+58 闪避+4%（逆命套·靴·T2 基座）', set: '逆命', setTier: 1, chapter: 2 },
  // —— 逆命套 · T3 ——
  { id: 'nm_w3', name: '逆命·乱纲刃', slot: 'weapon', atk: 88, hp: 42, dr: 0,    desc: '攻+88 血+42（逆命套·兵·T3 基座）', set: '逆命', setTier: 1, chapter: 3 },
  { id: 'nm_a3', name: '逆命·乱纲甲', slot: 'armor',  atk: 14, hp: 330, dr: 0.18, desc: '攻+14 血+330 减伤+18%（逆命套·甲·T3 基座）', set: '逆命', setTier: 1, chapter: 3 },
  { id: 'nm_h3', name: '逆命·乱纲盔', slot: 'head',   atk: 35, hp: 125, dr: 0.07, desc: '攻+35 血+125 减伤+7%（逆命套·盔·T3 基座）', set: '逆命', setTier: 1, chapter: 3 },
  { id: 'nm_b3', name: '逆命·乱纲靴', slot: 'boots',  atk: 28, hp: 102, eva: 0.07, desc: '攻+28 血+102 闪避+7%（逆命套·靴·T3 基座）', set: '逆命', setTier: 1, chapter: 3 },
  // —— 饕餮套（夺·掠夺向，V8.5x 补全第六道）：攻+暴击+身法 ——
  { id: 'tt_w1', name: '饕餮·初爪', slot: 'weapon', atk: 28, hp: 10, dr: 0,    desc: '攻+28 血+10（饕餮套·兵·T1 基座）', set: '饕餮', setTier: 1, chapter: 1 },
  { id: 'tt_a1', name: '饕餮·初鳞', slot: 'armor',  atk: 4,  hp: 90, dr: 0.05, desc: '攻+4 血+90 减伤+5%（饕餮套·甲·T1 基座）', set: '饕餮', setTier: 1, chapter: 1 },
  { id: 'tt_h1', name: '饕餮·初角', slot: 'head',   atk: 11, hp: 34, dr: 0.02, desc: '攻+11 血+34 减伤+2%（饕餮套·盔·T1 基座）', set: '饕餮', setTier: 1, chapter: 1 },
  { id: 'tt_b1', name: '饕餮·初靴', slot: 'boots',  atk: 9,  hp: 28, eva: 0.02, desc: '攻+9 血+28 闪避+2%（饕餮套·靴·T1 基座）', set: '饕餮', setTier: 1, chapter: 1 },
  // —— 饕餮套 · T2 ——
  { id: 'tt_w2', name: '饕餮·中爪', slot: 'weapon', atk: 54, hp: 20, dr: 0,    desc: '攻+54 血+20（饕餮套·兵·T2 基座）', set: '饕餮', setTier: 1, chapter: 2 },
  { id: 'tt_a2', name: '饕餮·中鳞', slot: 'armor',  atk: 8,  hp: 175, dr: 0.09, desc: '攻+8 血+175 减伤+9%（饕餮套·甲·T2 基座）', set: '饕餮', setTier: 1, chapter: 2 },
  { id: 'tt_h2', name: '饕餮·中角', slot: 'head',   atk: 21, hp: 66, dr: 0.04, desc: '攻+21 血+66 减伤+4%（饕餮套·盔·T2 基座）', set: '饕餮', setTier: 1, chapter: 2 },
  { id: 'tt_b2', name: '饕餮·中靴', slot: 'boots',  atk: 17, hp: 54, eva: 0.04, desc: '攻+17 血+54 闪避+4%（饕餮套·靴·T2 基座）', set: '饕餮', setTier: 1, chapter: 2 },
  // —— 饕餮套 · T3 ——
  { id: 'tt_w3', name: '饕餮·吞天爪', slot: 'weapon', atk: 92, hp: 38, dr: 0,    desc: '攻+92 血+38（饕餮套·兵·T3 基座）', set: '饕餮', setTier: 1, chapter: 3 },
  { id: 'tt_a3', name: '饕餮·吞天鳞', slot: 'armor',  atk: 15, hp: 320, dr: 0.17, desc: '攻+15 血+320 减伤+17%（饕餮套·甲·T3 基座）', set: '饕餮', setTier: 1, chapter: 3 },
  { id: 'tt_h3', name: '饕餮·吞天角', slot: 'head',   atk: 36, hp: 120, dr: 0.06, desc: '攻+36 血+120 减伤+6%（饕餮套·盔·T3 基座）', set: '饕餮', setTier: 1, chapter: 3 },
  { id: 'tt_b3', name: '饕餮·吞天靴', slot: 'boots',  atk: 29, hp: 98, eva: 0.07, desc: '攻+29 血+98 闪避+7%（饕餮套·靴·T3 基座）', set: '饕餮', setTier: 1, chapter: 3 },
];

  /* ====================== 合成件池 CRAFT_POOL + 合成公式 RECIPES ====================== */
NDX.CRAFT_POOL = [
  // —— 套装 · 第二阶（T2 套装成品）：由三件 T1 基座合成，集齐即强力套装 ——
  { id: 'set_weapon_top', name: '破军枪', slot: 'weapon', atk: 60, hp: 0, dr: 0.06, stackable: true, desc: '攻+60 减伤+6%（套装·破军 成品）', set: '破军', setTier: 2, chapter: 1 },
  { id: 'set_armor_top',  name: '玄武甲', slot: 'armor',  atk: 0,  hp: 220, dr: 0.16, hpRegen: 90, stackable: true, desc: '血+220 减伤+16% 每场战斗后回血+90（套装·玄武 成品）', set: '玄武', setTier: 2, chapter: 1 },
  { id: 'set_treasure_top',name: '贪狼坠',slot: 'treasure',atk: 22, hp: 70, dr: 0.10, stackable: true, desc: '攻+22 血+70 减伤+10%（套装·贪狼 成品）', set: '贪狼', setTier: 2, chapter: 1 },
  // —— 取经人初始三件套 · 第二阶（T2 成品）：由三件基座熔炼，集齐即"取经人初始套装" ——
  { id: 'ts_robe_top', name: '锦襕袈裟', slot: 'armor',    atk: 0,  hp: 200, dr: 0.14, hpRegen: 70, stackable: true, desc: '血+200 减伤+14% 每场战斗后回血+70（取经人·袈裟 成品）', set: '取经人', setTier: 2, chapter: 1 },
  { id: 'ts_staff_top',name: '九环锡杖', slot: 'weapon',   atk: 16, matk: 46, hp: 30,  dr: 0.04, stackable: true, desc: '攻+16 愿伤+46 血+30 减伤+4%（取经人·锡杖 成品·法杖·以愿伤为主）', set: '取经人', setTier: 2, chapter: 1 },
  { id: 'ts_bowl_top', name: '紫金钵',   slot: 'treasure', atk: 0,  hp: 60,  dr: 0.06, hpRegen: 40, stackable: true, treasure: true, treasureId: 'ts_bowl', owner: 'tangseng', phase: 'out', charges: 3, desc: '血+60 减伤+6% 每场战斗后回血+40（取经人·钵 成品）。【法宝·紫金钵·取经人特有】非战斗可祭出：化缘回满气血，然每用一次迷失一分本心（恶+，解锁取经人暗线）', set: '取经人', setTier: 2, chapter: 1 },
  // —— 主动法宝（可掉落）：战斗中/非战斗祭出，增强打怪参与感与策略性 ——
  // 三根救命毫毛：南海观世音菩萨临行所赐，护身禁器。仅于性命垂危（败亡瞬间）自行飘落替劫，复活满血；无法主动祭出，亦无法在土地庙补满。为孙悟空专属法宝。
  { id: 'jiuming', name: '三根救命毫毛', slot: 'treasure', atk: 0, hp: 30, dr: 0.03, stackable: true, treasure: true, treasureId: 'jiuming', owner: 'wukong', set: '悟空', phase: 'dead', charges: 3, noRecharge: true, desc: '血+30 减伤+3%。【法宝·三根救命毫毛·悟空专属】南海观世音所赐：败亡瞬间自行飘落替劫、复活满血（3/3）；不可主动祭出，亦无法在土地庙补满，耗尽即止。', chapter: 1 },
  { id: 'baojiao', name: '芭蕉扇',   slot: 'treasure', atk: 12, hp: 20, dr: 0.04, stackable: true, treasure: true, treasureId: 'baojiao', set: '贪狼', phase: 'in', charges: 1, desc: '攻+12 血+20 减伤+4%。【法宝·芭蕉扇·贪狼套】战斗中一扇，对敌造成巨创；若扇灭则反败为胜。', chapter: 3 },
  { id: 'dingfeng', name: '定风珠',   slot: 'treasure', atk: 6,  hp: 40, dr: 0.05, stackable: true, treasure: true, treasureId: 'dingfeng', set: '贪狼', phase: 'in', charges: 2, desc: '攻+6 血+40 减伤+5%。【法宝·定风珠·贪狼套】战斗中镇风回血并削敌；回血后尚存则挡下死劫。', chapter: 1 },
  { id: 'jingu',   name: '如意精箍棒',     slot: 'treasure', atk: 16, hp: 20, dr: 0.06, stackable: true, treasure: true, treasureId: 'jingu', set: '悟空', phase: 'passive', charges: 0, desc: '攻+16 血+20 减伤+6%。【法宝·如意精箍棒】被动·金箍骤紧：敌人现身即削其 5%~10% 气血；每回合有概率（随法宝增强而提高）附带一记额外物理重击，自动发动、不耗充能。', chapter: 1 },
  // —— V9.6 西游释厄传名器（on-hit 被动法宝，EQUIP_POOL 条目；掉落节点 placement 待内容平衡）——
  { id: 'zijin_honghulu', name: '紫金红葫芦', slot: 'treasure', treasure: true, treasureId: 'zijin_honghulu', dao: '战', phase: 'passive', charges: 0, auto: true, hp: 10, desc: '太上老君盛丹之器。攻击概率将妖敌收作小人（变小）。', chapter: 2 },
  { id: 'jinguo_zhuo', name: '金刚琢', slot: 'treasure', treasure: true, treasureId: 'jinguo_zhuo', dao: '缘', phase: 'passive', charges: 0, auto: true, hp: 10, desc: '金钢不坏之圈。攻击概率套住妖敌（晕眩）。', chapter: 2 },
  { id: 'ts_jingping', name: '观音玉净瓶', slot: 'treasure', treasure: true, treasureId: 'ts_jingping', dao: '渡', phase: 'in', charges: 5, hp: 10, desc: '南海甘露宝瓶。主动清除全部异常状态并赐护盾（5/5）。', chapter: 2 },
  { id: 'bajiao_shan', name: '芭蕉扇', slot: 'treasure', treasure: true, treasureId: 'bajiao_shan', dao: '隐', phase: 'passive', charges: 0, auto: true, hp: 10, desc: '罗刹女之宝扇。攻击概率煽出阴风真火（灼烧）。', chapter: 3 },
  { id: 'kunxian_sheng', name: '捆仙绳', slot: 'treasure', treasure: true, treasureId: 'kunxian_sheng', dao: '隐', phase: 'passive', charges: 0, auto: true, hp: 10, desc: '惧留孙之缚仙绳。攻击概率定身妖敌。', chapter: 3 },
  { id: 'feilong_zhang', name: '飞龙宝杖', slot: 'treasure', treasure: true, treasureId: 'feilong_zhang', dao: '缘', phase: 'passive', charges: 0, auto: true, hp: 10, desc: '龙宫镇海之杖。攻击概率驯龙压下（减速）。', chapter: 4 },
  { id: 'jiuhuan_zhang', name: '九环锡杖', slot: 'treasure', treasure: true, treasureId: 'jiuhuan_zhang', dao: '渡', phase: 'passive', charges: 0, auto: true, hp: 10, desc: '佛门九环锡杖。攻击概率震出圣伤并沉默。', chapter: 4 },
  { id: 'zijinhu', name: '紫金红葫芦', slot: 'treasure', atk: 10, hp: 30, dr: 0.04, stackable: true, treasure: true, treasureId: 'zijinhu', set: '贪狼', phase: 'in', charges: 1, desc: '攻+10 血+30 减伤+4%。【法宝·紫金红葫芦·贪狼套】战斗中收妖，重创当前妖敌；若收住则胜。', chapter: 2 },
  { id: 'zhaoyao', name: '照妖镜',   slot: 'treasure', atk: 8,  hp: 20, dr: 0.04, stackable: true, treasure: true, treasureId: 'zhaoyao', set: '贪狼', phase: 'both', charges: 2, desc: '攻+8 血+20 减伤+4%。【法宝·照妖镜·贪狼套】非战斗照出前路（下战-1难）；战斗中照妖削敌。', chapter: 1 },
  { id: 'jinchan', name: '金蝉舍利', slot: 'treasure', atk: 0,  hp: 50, dr: 0.04, stackable: true, treasure: true, treasureId: 'jinchan', set: '贪狼', phase: 'out', charges: 3, desc: '血+50 减伤+4%。【法宝·金蝉舍利·贪狼套】非战斗化缘，回复约 50% 气血，无本心代价。', chapter: 1 },
  // —— 孙悟空初始三件套 · T2 成品（侧重物伤）——
  { id: 'wk_crown_top', name: '凤翅紫金冠', slot: 'head',    atk: 30, hp: 70,  dr: 0.04, stackable: true, desc: '攻+30 血+70 减伤+4%（悟空·冠 成品·头冠）', set: '悟空', setTier: 2, chapter: 1 },
  { id: 'wk_armor_top', name: '锁子黄金甲', slot: 'armor',    atk: 15, hp: 160, dr: 0.10, hpRegen: 60, stackable: true, desc: '攻+15 血+160 减伤+10% 每场战斗后回血+60（悟空·甲 成品）', set: '悟空', setTier: 2, chapter: 1 },
  { id: 'wk_staff_top', name: '如意金箍棒·仿', slot: 'weapon', atk: 70, hp: 40, dr: 0.04, stackable: true, desc: '攻+70 血+40 减伤+4%（悟空·棒 成品）', set: '悟空', setTier: 2, chapter: 1 },
  // —— 猪八戒初始三件套 · T2 成品（侧重防御）——
  { id: 'bj_rake_top',  name: '九齿钉耙',   slot: 'weapon',   atk: 35, hp: 90,  dr: 0.06, stackable: true, desc: '攻+35 血+90 减伤+6%（八戒·耙 成品）', set: '八戒', setTier: 2, chapter: 1 },
  { id: 'bj_robe_top',  name: '贪嗔僧衣',   slot: 'armor',    atk: 0,  hp: 200, dr: 0.12, stackable: true, desc: '血+200 减伤+12%（八戒·衣 成品）', set: '八戒', setTier: 2, chapter: 1 },
  { id: 'bj_belly_top', name: '吞山便便肚', slot: 'treasure', atk: 0,  hp: 170, dr: 0.08, stackable: true, desc: '血+170 减伤+8%（八戒·腹 成品）', set: '八戒', setTier: 2, chapter: 1 },
  // —— 猪八戒初始三件套 · 章节成长线（第1章凡品起步 → 第4章合成终极装备）——
  { id: 'bj_rake_ch2', name: '九齿钉耙·破', slot: 'weapon', atk: 38, hp: 70, dr: 0.03, crit: 0.02, desc: '攻+38 血+70 减伤+3% 暴击+2%（八戒·钉耙·第二章成长）', set: '八戒', setTier: 2, chapter: 2 },
  { id: 'bj_robe_ch2', name: '贪嗔僧衣·韧', slot: 'armor', atk: 0, hp: 230, dr: 0.10, hpRegen: 15, desc: '血+230 减伤+10% 每场战斗后回血+15（八戒·僧衣·第二章成长）', set: '八戒', setTier: 2, chapter: 2 },
  { id: 'bj_bowl_ch2', name: '净坛宝盂·满', slot: 'treasure', atk: 0, hp: 65, dr: 0.05, treasure: true, treasureId: 'bj_bowl_man', owner: 'bajie', phase: 'out', charges: 3, desc: '血+65 减伤+5%。【法宝·净坛宝盂·满·八戒特有·第二章成长】非战斗回满气血+下战怪物攻-10%（3/3）；可在土地庙补满。', set: '八戒', setTier: 2, chapter: 2 },
  { id: 'bj_rake_ch3', name: '九齿钉耙·狂', slot: 'weapon', atk: 58, hp: 110, dr: 0.04, crit: 0.04, desc: '攻+58 血+110 减伤+4% 暴击+4%（八戒·钉耙·第三章成长）', set: '八戒', setTier: 2, chapter: 3 },
  { id: 'bj_robe_ch3', name: '贪嗔僧衣·厚', slot: 'armor', atk: 0, hp: 360, dr: 0.14, hpRegen: 30, desc: '血+360 减伤+14% 每场战斗后回血+30（八戒·僧衣·第三章成长）', set: '八戒', setTier: 2, chapter: 3 },
  { id: 'bj_bowl_ch3', name: '净坛宝盂·盈', slot: 'treasure', atk: 0, hp: 110, dr: 0.07, treasure: true, treasureId: 'bj_bowl_ying', owner: 'bajie', phase: 'out', charges: 3, desc: '血+110 减伤+7%。【法宝·净坛宝盂·盈·八戒特有·第三章成长】非战斗回满气血+下战怪物攻-20%（3/3）；可在土地庙补满。', set: '八戒', setTier: 2, chapter: 3 },
  { id: 'bj_rake_ch4', name: '九齿钉耙·天蓬真传', slot: 'weapon', atk: 90, hp: 180, dr: 0.06, crit: 0.08, desc: '攻+90 血+180 减伤+6% 暴击+8%（八戒·终极钉耙）', set: '八戒', setTier: 3, chapter: 4 },
  { id: 'bj_robe_ch4', name: '贪嗔僧衣·净坛金身', slot: 'armor', atk: 0, hp: 520, dr: 0.18, hpRegen: 60, desc: '血+520 减伤+18% 每场战斗后回血+60（八戒·终极僧衣）', set: '八戒', setTier: 3, chapter: 4 },
  { id: 'bj_bowl_ch4', name: '净坛宝盂·无量', slot: 'treasure', atk: 0, hp: 160, dr: 0.10, treasure: true, treasureId: 'bj_bowl_wl', owner: 'bajie', phase: 'out', charges: 5, desc: '血+160 减伤+10%。【法宝·净坛宝盂·无量·八戒终极】非战斗回满气血+下战怪物攻-30%（5/5）；可在土地庙补满。', set: '八戒', setTier: 3, chapter: 4 },
  // —— 孙悟空初始三件套 · 章节成长线（第1章凡品起步 → 第4章合成终极装备）——
  { id: 'wk_weapon_ch2', name: '如意金箍棒·初醒', slot: 'weapon', atk: 55, hp: 30, dr: 0.03, crit: 0.04, desc: '攻+55 血+30 减伤+3% 暴击+4%（悟空·兵·第二章成长）', set: '悟空', setTier: 2, chapter: 2 },
  { id: 'wk_armor_ch2',  name: '锁子黄金甲·韧',   slot: 'armor',  atk: 12, hp: 120, dr: 0.08, desc: '攻+12 血+120 减伤+8%（悟空·甲·第二章成长）', set: '悟空', setTier: 2, chapter: 2 },
  { id: 'wk_treasure_ch2', name: '如意精箍棒·束缚',       slot: 'treasure', atk: 22, hp: 40, dr: 0.06, treasure: true, treasureId: 'jingu', owner: 'wukong', phase: 'passive', charges: 0, desc: '攻+22 血+40 减伤+6%。【法宝·如意精箍棒·悟空特有·第二章成长】敌人现身即削其5%~10%气血；每回合概率更高地附带一记额外物理重击，自动发动。', set: '悟空', setTier: 2, chapter: 2 },
  { id: 'wk_weapon_ch3', name: '如意金箍棒·闹天', slot: 'weapon', atk: 80, hp: 60, dr: 0.05, crit: 0.08, desc: '攻+80 血+60 减伤+5% 暴击+8%（悟空·兵·第三章成长）', set: '悟空', setTier: 2, chapter: 3 },
  { id: 'wk_armor_ch3',  name: '锁子黄金甲·烈',   slot: 'armor',  atk: 22, hp: 200, dr: 0.12, hpRegen: 30, desc: '攻+22 血+200 减伤+12% 每场战斗后回血+30（悟空·甲·第三章成长）', set: '悟空', setTier: 2, chapter: 3 },
  { id: 'wk_treasure_ch3', name: '如意精箍棒·镇魔',       slot: 'treasure', atk: 36, hp: 60, dr: 0.10, treasure: true, treasureId: 'jingu', owner: 'wukong', phase: 'passive', charges: 0, desc: '攻+36 血+60 减伤+10%。【法宝·如意精箍棒·悟空特有·第三章成长】敌人现身即削其8%~15%气血；每回合概率更高地附带一记额外物理重击，自动发动。', set: '悟空', setTier: 2, chapter: 3 },
  { id: 'wk_weapon_ch4', name: '如意金箍棒·齐天', slot: 'weapon', atk: 120, hp: 100, dr: 0.08, crit: 0.12, desc: '攻+120 血+100 减伤+8% 暴击+12%（悟空·终极兵）', set: '悟空', setTier: 3, chapter: 4 },
  { id: 'wk_armor_ch4',  name: '锁子黄金甲·大圣', slot: 'armor',  atk: 35, hp: 320, dr: 0.16, hpRegen: 60, desc: '攻+35 血+320 减伤+16% 每场战斗后回血+60（悟空·终极甲）', set: '悟空', setTier: 3, chapter: 4 },
  { id: 'wk_treasure_ch4', name: '如意精箍棒·天命',       slot: 'treasure', atk: 50, hp: 90, dr: 0.14, treasure: true, treasureId: 'jingu', owner: 'wukong', phase: 'passive', charges: 0, desc: '攻+50 血+90 减伤+14%。【法宝·如意精箍棒·悟空终极】敌人现身即削其12%~20%气血；每回合高概率附带一记额外物理重击，自动发动。', set: '悟空', setTier: 3, chapter: 4 },
  // —— 取经人初始三件套 · 章节成长线（第1章凡品起步 → 第4章合成终极装备）——
  { id: 'ts_weapon_ch2', name: '九环锡杖·度', slot: 'weapon', atk: 12, matk: 40, hp: 30, dr: 0.03, desc: '攻+12 愿伤+40 血+30 减伤+3%（取经人·杖·第二章成长·以愿伤为主）', set: '取经人', setTier: 2, chapter: 2 },
  { id: 'ts_armor_ch2',  name: '锦襕袈裟·净', slot: 'armor',  atk: 0,  hp: 180, dr: 0.12, mdef: 0.06, hpRegen: 30, desc: '血+180 减伤+12% 御念+6% 每场战斗后回血+30（取经人·衣·第二章成长）', set: '取经人', setTier: 2, chapter: 2 },
  { id: 'ts_treasure_ch2', name: '紫金钵盂·慈', slot: 'treasure', atk: 0, hp: 50, dr: 0.05, treasure: true, treasureId: 'ts_bowl_ci', owner: 'tangseng', phase: 'out', charges: 3, desc: '血+50 减伤+5%。【法宝·紫金钵盂·慈·取经人特有·第二章成长】非战斗回满气血（恶+8，代价稍减）（3/3）；可在土地庙补满。', set: '取经人', setTier: 2, chapter: 2 },
  { id: 'ts_weapon_ch3', name: '九环锡杖·渡厄', slot: 'weapon', atk: 22, matk: 70, hp: 60, dr: 0.05, desc: '攻+22 愿伤+70 血+60 减伤+5%（取经人·杖·第三章成长·以愿伤为主）', set: '取经人', setTier: 2, chapter: 3 },
  { id: 'ts_armor_ch3',  name: '锦襕袈裟·金身', slot: 'armor',  atk: 0,  hp: 300, dr: 0.16, mdef: 0.10, hpRegen: 60, desc: '血+300 减伤+16% 御念+10% 每场战斗后回血+60（取经人·衣·第三章成长）', set: '取经人', setTier: 2, chapter: 3 },
  { id: 'ts_treasure_ch3', name: '紫金钵盂·悲悯', slot: 'treasure', atk: 0, hp: 90, dr: 0.07, treasure: true, treasureId: 'ts_bowl_bei', owner: 'tangseng', phase: 'out', charges: 4, desc: '血+90 减伤+7%。【法宝·紫金钵盂·悲悯·取经人特有·第三章成长】非战斗回满气血+下战怪物攻-10%（恶+5）（4/4）；可在土地庙补满。', set: '取经人', setTier: 2, chapter: 3 },
  { id: 'ts_weapon_ch4', name: '九环锡杖·大乘', slot: 'weapon', atk: 32, matk: 110, hp: 100, dr: 0.08, desc: '攻+32 愿伤+110 血+100 减伤+8%（取经人·终极杖·以愿伤为主）', set: '取经人', setTier: 3, chapter: 4 },
  { id: 'ts_armor_ch4',  name: '锦襕袈裟·佛光', slot: 'armor',  atk: 0,  hp: 480, dr: 0.20, mdef: 0.16, hpRegen: 100, desc: '血+480 减伤+20% 御念+16% 每场战斗后回血+100（取经人·终极衣）', set: '取经人', setTier: 3, chapter: 4 },
  { id: 'ts_treasure_ch4', name: '紫金钵盂·无量', slot: 'treasure', atk: 0, hp: 140, dr: 0.10, treasure: true, treasureId: 'ts_bowl_wl', owner: 'tangseng', phase: 'out', charges: 5, desc: '血+140 减伤+10%。【法宝·紫金钵盂·无量·取经人终极】非战斗回满气血+下战怪物攻-20%（恶+3，代价极微）（5/5）；可在土地庙补满。', set: '取经人', setTier: 3, chapter: 4 },
  // —— 小白龙(龙马)初始三件套 · 章节成长线（第1章凡品起步 → 第4章合成终极装备）——
  { id: 'lm_weapon_ch2', name: '追风龙蹄·疾', slot: 'weapon', atk: 45, hp: 20, dr: 0, eva: 0.10, crit: 0.04, desc: '攻+45 血+20 闪避+10% 暴击+4%（龙马·蹄·第二章成长）', set: '龙马', setTier: 2, chapter: 2 },
  { id: 'lm_armor_ch2',  name: '护心逆鳞·寒', slot: 'armor',  atk: 16, hp: 60, dr: 0.04, eva: 0.08, desc: '攻+16 血+60 减伤+4% 闪避+8%（龙马·鳞·第二章成长）', set: '龙马', setTier: 2, chapter: 2 },
  { id: 'lm_treasure_ch2', name: '避水珠·渊', slot: 'treasure', atk: 0, hp: 55, dr: 0.05, treasure: true, treasureId: 'lm_bowl', owner: 'xiaobailong', phase: 'out', charges: 3, desc: '血+55 减伤+5%。【法宝·避水珠·龙马专属·第二章成长】非战斗回满气血（3/3）；可在土地庙补满。', set: '龙马', setTier: 2, chapter: 2 },
  { id: 'lm_weapon_ch3', name: '追风龙蹄·雷', slot: 'weapon', atk: 70, hp: 40, dr: 0, eva: 0.14, crit: 0.08, desc: '攻+70 血+40 闪避+14% 暴击+8%（龙马·蹄·第三章成长）', set: '龙马', setTier: 2, chapter: 3 },
  { id: 'lm_armor_ch3',  name: '护心逆鳞·霜', slot: 'armor',  atk: 28, hp: 100, dr: 0.06, eva: 0.12, desc: '攻+28 血+100 减伤+6% 闪避+12%（龙马·鳞·第三章成长）', set: '龙马', setTier: 2, chapter: 3 },
  { id: 'lm_treasure_ch3', name: '避水珠·溟', slot: 'treasure', atk: 0, hp: 95, dr: 0.07, treasure: true, treasureId: 'lm_bowl', owner: 'xiaobailong', phase: 'out', charges: 4, desc: '血+95 减伤+7%。【法宝·避水珠·龙马专属·第三章成长】非战斗回满气血（4/4）；可在土地庙补满。', set: '龙马', setTier: 2, chapter: 3 },
  { id: 'lm_weapon_ch4', name: '追风龙蹄·踏云', slot: 'weapon', atk: 110, hp: 70, dr: 0, eva: 0.20, crit: 0.12, desc: '攻+110 血+70 闪避+20% 暴击+12%（龙马·终极蹄）', set: '龙马', setTier: 3, chapter: 4 },
  { id: 'lm_armor_ch4',  name: '护心逆鳞·龙皇', slot: 'armor',  atk: 42, hp: 160, dr: 0.10, eva: 0.16, desc: '攻+42 血+160 减伤+10% 闪避+16%（龙马·终极鳞）', set: '龙马', setTier: 3, chapter: 4 },
  { id: 'lm_treasure_ch4', name: '避水珠·无量', slot: 'treasure', atk: 0, hp: 150, dr: 0.10, treasure: true, treasureId: 'lm_bowl', owner: 'xiaobailong', phase: 'out', charges: 5, desc: '血+150 减伤+10%。【法宝·避水珠·龙马终极】非战斗回满气血（5/5）；可在土地庙补满。', set: '龙马', setTier: 3, chapter: 4 },
  // —— 沙僧初始三件套 · 章节成长线（第1章凡品起步 → 第4章合成终极装备）——
  { id: 'ss_weapon_ch2', name: '降妖宝杖·沉', slot: 'weapon', atk: 42, hp: 70, dr: 0.04, mdef: 0.08, desc: '攻+42 血+70 减伤+4% 法防+8%（沙僧·杖·第二章成长）', set: '沙僧', setTier: 2, chapter: 2 },
  { id: 'ss_armor_ch2',  name: '沉沙僧袍·固', slot: 'armor',  atk: 0,  hp: 140, dr: 0.08, mdef: 0.08, desc: '血+140 减伤+8% 法防+8%（沙僧·袍·第二章成长）', set: '沙僧', setTier: 2, chapter: 2 },
  { id: 'ss_treasure_ch2', name: '降妖念珠·净', slot: 'treasure', atk: 8, hp: 60, dr: 0.05, mdef: 0.08, treasure: true, treasureId: 'ss_bowl_jing', owner: 'shaseng', phase: 'both', charges: 3, desc: '攻+8 血+60 减伤+5% 法防+8%。【法宝·降妖念珠·净·沙僧专属·第二章成长】非战斗回满气血+下战怪物攻-10%；战斗中佛光伤敌10%（3/3）；可在土地庙补满。', set: '沙僧', setTier: 2, chapter: 2 },
  { id: 'ss_weapon_ch3', name: '降妖宝杖·卷澜', slot: 'weapon', atk: 68, hp: 120, dr: 0.06, mdef: 0.12, desc: '攻+68 血+120 减伤+6% 法防+12%（沙僧·杖·第三章成长）', set: '沙僧', setTier: 2, chapter: 3 },
  { id: 'ss_armor_ch3',  name: '沉沙僧袍·护念', slot: 'armor',  atk: 0,  hp: 230, dr: 0.12, mdef: 0.12, hpRegen: 40, desc: '血+230 减伤+12% 法防+12% 每场战斗后回血+40（沙僧·袍·第三章成长）', set: '沙僧', setTier: 2, chapter: 3 },
  { id: 'ss_treasure_ch3', name: '降妖念珠·梵音', slot: 'treasure', atk: 14, hp: 100, dr: 0.07, mdef: 0.12, treasure: true, treasureId: 'ss_bowl_fanyin', owner: 'shaseng', phase: 'both', charges: 4, desc: '攻+14 血+100 减伤+7% 法防+12%。【法宝·降妖念珠·梵音·沙僧专属·第三章成长】非战斗回满气血+下战怪物攻-20%；战斗中佛光伤敌15%（4/4）；可在土地庙补满。', set: '沙僧', setTier: 2, chapter: 3 },
  { id: 'ss_weapon_ch4', name: '降妖宝杖·天河', slot: 'weapon', atk: 105, hp: 190, dr: 0.10, mdef: 0.18, desc: '攻+105 血+190 减伤+10% 法防+18%（沙僧·终极杖）', set: '沙僧', setTier: 3, chapter: 4 },
  { id: 'ss_armor_ch4',  name: '沉沙僧袍·流沙', slot: 'armor',  atk: 0,  hp: 380, dr: 0.16, mdef: 0.18, hpRegen: 80, desc: '血+380 减伤+16% 法防+18% 每场战斗后回血+80（沙僧·终极袍）', set: '沙僧', setTier: 3, chapter: 4 },
  { id: 'ss_treasure_ch4', name: '降妖念珠·无量', slot: 'treasure', atk: 20, hp: 160, dr: 0.10, mdef: 0.16, treasure: true, treasureId: 'ss_bowl_wl', owner: 'shaseng', phase: 'both', charges: 5, desc: '攻+20 血+160 减伤+10% 法防+16%。【法宝·降妖念珠·无量·沙僧终极】非战斗回满气血+下战怪物攻-30%；战斗中佛光伤敌20%（5/5）；可在土地庙补满。', set: '沙僧', setTier: 3, chapter: 4 },
  // —— 小白龙(龙马)初始三件套 · T2 成品（侧重闪避）——
  { id: 'lm_saddle_top',name: '踏云马鞍',   slot: 'armor',    atk: 14, hp: 80,  dr: 0.05, eva: 0.12, stackable: true, desc: '攻+14 血+80 减伤+5% 闪避+12%（龙马·鞍 成品）', set: '龙马', setTier: 2, chapter: 1 },
  { id: 'lm_scale_top', name: '护心逆鳞',   slot: 'armor',    atk: 20, hp: 60,  dr: 0.04, eva: 0.10, stackable: true, desc: '攻+20 血+60 减伤+4% 闪避+10%（龙马·鳞 成品）', set: '龙马', setTier: 2, chapter: 1 },
  { id: 'lm_hoof_top',  name: '追风龙蹄',   slot: 'weapon',   atk: 42, hp: 20,  dr: 0,    eva: 0.14, stackable: true, desc: '攻+42 血+20 闪避+14%（龙马·蹄 成品）', set: '龙马', setTier: 2, chapter: 1 },
  // —— 沙僧初始三件套 · T2 成品（侧重法防）——
  { id: 'ss_staff_top', name: '降妖宝杖',   slot: 'weapon',   atk: 48, hp: 80,  dr: 0.04, mdef: 0.10, stackable: true, desc: '攻+48 血+80 减伤+4% 法防+10%（沙僧·杖 成品）', set: '沙僧', setTier: 2, chapter: 1 },
  { id: 'ss_skull_top', name: '骷髅念珠',   slot: 'treasure', atk: 10, hp: 70,  dr: 0.05, mdef: 0.12, stackable: true, desc: '攻+10 血+70 减伤+5% 法防+12%（沙僧·串 成品）', set: '沙僧', setTier: 2, chapter: 1 },
  { id: 'ss_robe_top',  name: '沉沙僧袍',   slot: 'armor',    atk: 0,  hp: 150, dr: 0.08, mdef: 0.10, stackable: true, desc: '血+150 减伤+8% 法防+10%（沙僧·袍 成品）', set: '沙僧', setTier: 2, chapter: 1 },
  // ===== 第二章·合成成品（难21-40）=====
  { id: 'hunkui', name: '混铁盔',  slot: 'armor',    atk: 10, hp: 140, dr: 0.10, stackable: true, desc: '攻+10 血+140 减伤+10%（第二章·合成·黑风套·甲成品）', set: '黑风', setTier: 2, chapter: 2 },
  { id: 'yushou', name: '御兽环',  slot: 'treasure', atk: 20, hp: 60,  dr: 0.06, stackable: true, desc: '攻+20 血+60 减伤+6%（第二章·合成·黑风套·宝成品）', set: '黑风', setTier: 2, chapter: 2 },
  // ===== 第三章·合成成品（难41-60）=====
  { id: 'tianying', name: '天鹰弩',   slot: 'weapon',   atk: 65, hp: 20,  dr: 0.04, stackable: true, desc: '攻+65 血+20 减伤+4%（第三章·合成·狮驼套·兵成品）', set: '狮驼', setTier: 2, chapter: 3 },
  { id: 'jinhuayin',name: '金划银钩', slot: 'weapon',   atk: 58, hp: 40,  dr: 0.06, stackable: true, desc: '攻+58 血+40 减伤+6%（第三章·合成·狮驼套·兵副成品）', set: '狮驼', setTier: 2, chapter: 3 },
  // ===== 第四章·合成成品（难61-81）=====
  { id: 'chanyu', name: '禅语灯',     slot: 'treasure', atk: 12, hp: 180, dr: 0.12, hpRegen: 120, stackable: true, desc: '攻+12 血+180 减伤+12% 每场战后回血+120（第四章·合成·凌云套·宝成品）', set: '凌云', setTier: 2, chapter: 4 },
  { id: 'biantong', name: '变通袈裟', slot: 'armor',    atk: 0,  hp: 220, dr: 0.16, eva: 0.08, stackable: true, desc: '血+220 减伤+16% 闪避+8%（第四章·合成·凌云套·甲成品）', set: '凌云', setTier: 2, chapter: 4 },
  // —— 第2~4章套件·宝成品（对应各章三件套的 treasure 主件）——
  { id: 'sanmei_top', name: '三昧真火', slot: 'treasure', atk: 30, hp: 60, dr: 0.12, stackable: true, desc: '攻+30 血+60 减伤+12%（第二章·黑风套·宝成品·由三昧火种+三昧烬合成）', set: '黑风', setTier: 2, chapter: 2 },
  { id: 'jingangying_top', name: '金刚琢', slot: 'weapon', atk: 65, hp: 60, dr: 0.12, stackable: true, desc: '攻+65 血+60 减伤+12%（第二章·黑风套·兵成品·由金刚琢影+黑风铁合成）', set: '黑风', setTier: 2, chapter: 2 },
  { id: 'mangzhu_top', name: '蟒珠坠', slot: 'treasure', atk: 18, hp: 120, dr: 0.10, stackable: true, desc: '攻+18 血+120 减伤+10%（第三章·狮驼套·宝成品·由蟒珠+巨蟒涎合成）', set: '狮驼', setTier: 2, chapter: 3 },
  { id: 'yuehua_top', name: '月华轮', slot: 'treasure', atk: 28, hp: 120, dr: 0.12, eva: 0.12, stackable: true, desc: '攻+28 血+120 减伤+12% 闪避+12%（第四章·凌云套·宝成品·由月华影+月宫桂合成）', set: '凌云', setTier: 2, chapter: 4 },
  { id: 'gongwu_top', name: '拱污宝甲', slot: 'armor', atk: 0, hp: 220, dr: 0.14, eva: 0.06, stackable: true, desc: '血+220 减伤+14% 闪避+6%（第三章·狮驼套·甲成品·由拱污甲+巨蟒涎合成）', set: '狮驼', setTier: 2, chapter: 3 },
  { id: 'xijiao_top', name: '犀角裂刃', slot: 'weapon', atk: 95, hp: 60, dr: 0.08, stackable: true, desc: '攻+95 血+60 减伤+8%（第四章·凌云套·兵成品·由犀角刃+月宫桂合成）', set: '凌云', setTier: 2, chapter: 4 },
  // ===== 多重合成组件（T3 升阶成品）：由 T2 套装成品 + 高阶材料「二次合成」，拉长合成树深度 =====
  // —— 第一章通用套装·T3 多重合成（破军/玄武/贪狼 由 T2 成品再熔高阶材料）——
  { id: 'set_weapon_t3',  name: '破军·弑神枪', slot: 'weapon',   atk: 110, hp: 40, dr: 0.10, crit: 0.06, stackable: true, desc: '攻+110 血+40 减伤+10% 暴击+6%（破军套·多重合成·T3）', set: '破军', setTier: 3, chapter: 2 },
  { id: 'set_armor_t3',   name: '玄武·玄龟甲', slot: 'armor',    atk: 0,   hp: 360, dr: 0.22, hpRegen: 140, stackable: true, desc: '血+360 减伤+22% 每场战后回血+140（玄武套·多重合成·T3）', set: '玄武', setTier: 3, chapter: 2 },
  { id: 'set_treasure_t3',name: '贪狼·天狼坠', slot: 'treasure', atk: 40,  hp: 110, dr: 0.14, stackable: true, desc: '攻+40 血+110 减伤+14%（贪狼套·多重合成·T3）', set: '贪狼', setTier: 3, chapter: 2 },
  // ===== 六道专职·隐/逆 T2/T3 旧三件套已由 V8.42 四件套升级链取代（yd_*/nm_*，见 EQUIP_POOL 尾部） =====
  // —— 第二章·黑风套 T3 多重合成（由 T2 黑风成品再熔高阶材料）——
  { id: 'heifeng_w_t3', name: '黑风·裂空刃', slot: 'weapon', atk: 78, hp: 50, dr: 0.08, eva: 0.06, stackable: true, desc: '攻+78 血+50 减伤+8% 闪避+6%（黑风套·多重合成·T3）', set: '黑风', setTier: 3, chapter: 3 },
  { id: 'heifeng_a_t3', name: '黑风·镇山铠', slot: 'armor',  atk: 0,  hp: 300, dr: 0.18, eva: 0.04, stackable: true, desc: '血+300 减伤+18% 闪避+4%（黑风套·多重合成·T3）', set: '黑风', setTier: 3, chapter: 3 },
  { id: 'heifeng_t_t3', name: '黑风·炼狱炉', slot: 'treasure', atk: 30, hp: 130, dr: 0.12, stackable: true, desc: '攻+30 血+130 减伤+12%（黑风套·多重合成·T3）', set: '黑风', setTier: 3, chapter: 3 },
  // —— 第三章·狮驼套 T3 多重合成 ——
  { id: 'shituo_w_t3', name: '狮驼·金翅戟', slot: 'weapon', atk: 120, hp: 70, dr: 0.10, crit: 0.08, stackable: true, desc: '攻+120 血+70 减伤+10% 暴击+8%（狮驼套·多重合成·T3）', set: '狮驼', setTier: 3, chapter: 4 },
  { id: 'shituo_a_t3', name: '狮驼·磐石胄', slot: 'armor',  atk: 0,   hp: 420, dr: 0.24, stackable: true, desc: '血+420 减伤+24%（狮驼套·多重合成·T3）', set: '狮驼', setTier: 3, chapter: 4 },
  { id: 'shituo_t_t3', name: '狮驼·擒龙环', slot: 'treasure', atk: 45, hp: 180, dr: 0.16, stackable: true, desc: '攻+45 血+180 减伤+16%（狮驼套·多重合成·T3）', set: '狮驼', setTier: 3, chapter: 4 },
  // —— 第四章·凌云套 T3 多重合成（终局毕业装）——
  { id: 'lingyun_w_t3', name: '凌云·渡世戟', slot: 'weapon', atk: 160, hp: 110, dr: 0.12, eva: 0.08, stackable: true, desc: '攻+160 血+110 减伤+12% 闪避+8%（凌云套·多重合成·T3）', set: '凌云', setTier: 3, chapter: 4 },
  { id: 'lingyun_a_t3', name: '凌云·功德铠', slot: 'armor',  atk: 0,   hp: 560, dr: 0.28, hpRegen: 160, stackable: true, desc: '血+560 减伤+28% 每场战后回血+160（凌云套·多重合成·T3）', set: '凌云', setTier: 3, chapter: 4 },
  { id: 'lingyun_t_t3', name: '凌云·圆满灯', slot: 'treasure', atk: 40, hp: 240, dr: 0.20, hpRegen: 120, stackable: true, desc: '攻+40 血+240 减伤+20% 每场战后回血+120（凌云套·多重合成·T3）', set: '凌云', setTier: 3, chapter: 4 },
  // —— 灵宠·进化形态（需通过进化合成获得，petEvolve 配方替换基础形态）——
  { id: 'shuijingmolang',  name: '水晶魔龙',   slot: 'pet', atk: 18, hp: 60,  dr: 0.05, matk: 15, desc: '攻+18 血+60 减伤+5% 愿伤+15（龙系·水分支进化）', set: '破军', setTier: 2, chapter: 2, quality: 1, evolveFrom: 'xiaoheilong', petPassive: 'dragon_aura', branch: 'water', stackable: true },
  { id: 'lieyanhuolong',   name: '烈焰火龙',   slot: 'pet', atk: 25, hp: 40,  dr: 0.02, matk: 10, desc: '攻+25 血+40 减伤+2% 愿伤+10（龙系·火分支进化）', set: '破军', setTier: 2, chapter: 2, quality: 1, evolveFrom: 'xiaoheilong', petPassive: 'dragon_aura', branch: 'fire', stackable: true },
  { id: 'puzhaozhenlong',  name: '普照真龙',   slot: 'pet', atk: 15, hp: 80,  dr: 0.08, matk: 20, desc: '攻+15 血+80 减伤+8% 愿伤+20（龙系·光分支进化）', set: '贪狼', setTier: 2, chapter: 2, quality: 1, evolveFrom: 'xiaoheilong', petPassive: 'dragon_aura', branch: 'light', stackable: true },
  { id: 'tongbiyuanhou',   name: '通臂猿猴',   slot: 'pet', atk: 22, hp: 50,  dr: 0.04, desc: '攻+22 血+50 减伤+4%（猿系·一阶进化）', set: '破军', setTier: 2, chapter: 2, quality: 1, evolveFrom: 'xiaoshihou', petPassive: null, branch: 'ape', stackable: true },
  { id: 'jinchan_er',      name: '金蟾·灵',    slot: 'pet', atk: 0,  hp: 70,  dr: 0.04, desc: '血+70 减伤+4%（金蟾系·一阶进化·每战+金）', set: '贪狼', setTier: 2, chapter: 2, quality: 1, evolveFrom: 'jinchan', petPassive: 'gold_per_turn', branch: 'jinchan', stackable: true },
  { id: 'renshanguozi_er', name: '人参果·灵',  slot: 'pet', atk: 0,  hp: 70,  dr: 0.03, hpRegen: 15, desc: '血+70 减伤+3% 每场回血+15（人参系·一阶进化）', set: '贪狼', setTier: 2, chapter: 2, quality: 1, evolveFrom: 'renshanguozi', petPassive: 'regen', branch: 'renshen', stackable: true },
  // —— V8.56 终极二段进化形态（第8-9章·传说级）——
  { id: 'taigu_shanling', name: '太古山灵', slot: 'pet', atk: 12, hp: 180, dr: 0.12, hpRegen: 30, desc: '攻+12 血+180 减伤+12% 每场回血+30（灵岩巨像·终极二段进化·石心留存2点生命·全队减伤+6%）', set: '玄武', setTier: 4, chapter: 8, quality: 3, evolveFrom: 'lingyan_ju', petPassive: 'stoneheart_2', branch: 'rock', stackable: true, petSynergy: 'yan_shuang_wei' },
  { id: 'taiyin_xinghu', name: '太阴星狐', slot: 'pet', atk: 30, hp: 80, dr: 0.04, eva: 0.18, crit: 0.10, desc: '攻+30 血+80 减伤+4% 闪避+18% 暴击+10%（月影妖狐·终极二段进化·暴伤+50%·隐道协同+10%）', set: '影遁', setTier: 4, chapter: 9, quality: 3, evolveFrom: 'yueying', petPassive: 'taiyin_aura', branch: 'fox', stackable: true, petSynergy: 'yue_shuang_hu' },
  // ===== 八套合成套装·T2 成品（V8.23·每章2套，基座+材料合成） =====
  // —— 第一章·天命套 T2 ——
  { id: 'tm_w_top', name: '天命·归元剑',   slot: 'weapon',   atk: 55, hp: 30,  dr: 0.04, stackable: true, desc: '攻+55 血+30 减伤+4%（天命套·成品）', set: '天命', setTier: 2, chapter: 1 },
  { id: 'tm_a_top', name: '天命·归元甲',   slot: 'armor',    atk: 0,  hp: 240, dr: 0.14, hpRegen: 50, stackable: true, desc: '血+240 减伤+14% 每场战后回血+50（天命套·成品）', set: '天命', setTier: 2, chapter: 1 },
  { id: 'tm_t_top', name: '天命·归元佩',   slot: 'treasure', atk: 20, hp: 100, dr: 0.08, stackable: true, desc: '攻+20 血+100 减伤+8%（天命套·成品）', set: '天命', setTier: 2, chapter: 1 },
  // —— 第一章·渡厄套 T2 ——
  { id: 'de_w_top', name: '渡厄·慈航杖',   slot: 'weapon',   atk: 40, hp: 50,  dr: 0.08, stackable: true, desc: '攻+40 血+50 减伤+8%（渡厄套·成品）', set: '渡厄', setTier: 2, chapter: 1 },
  { id: 'de_a_top', name: '渡厄·慈航袍',   slot: 'armor',    atk: 0,  hp: 280, dr: 0.16, hpRegen: 60, stackable: true, desc: '血+280 减伤+16% 每场战后回血+60（渡厄套·成品）', set: '渡厄', setTier: 2, chapter: 1 },
  { id: 'de_t_top', name: '渡厄·慈航珠',   slot: 'treasure', atk: 0,  hp: 120, dr: 0.10, hpRegen: 30, stackable: true, desc: '血+120 减伤+10% 每场战后回血+30（渡厄套·成品）', set: '渡厄', setTier: 2, chapter: 1 },
  // —— 第二章·镇妖套 T2 ——
  { id: 'zy_w_top', name: '镇妖·伏魔剑',   slot: 'weapon',   atk: 65, hp: 25,  dr: 0,    crit: 0.08, stackable: true, desc: '攻+65 暴击+8%（镇妖套·成品）', set: '镇妖', setTier: 2, chapter: 2 },
  { id: 'zy_a_top', name: '镇妖·伏魔甲',   slot: 'armor',    atk: 0,  hp: 220, dr: 0.12, crit: 0.04, stackable: true, desc: '血+220 减伤+12% 暴击+4%（镇妖套·成品）', set: '镇妖', setTier: 2, chapter: 2 },
  { id: 'zy_t_top', name: '镇妖·伏魔符',   slot: 'treasure', atk: 28, hp: 90,  dr: 0,    crit: 0.06, stackable: true, desc: '攻+28 血+90 暴击+6%（镇妖套·成品）', set: '镇妖', setTier: 2, chapter: 2 },
  // —— 第二章·幽冥套 T2 ——
  { id: 'ym_w_top', name: '幽冥·鬼泣刃',   slot: 'weapon',   atk: 50, hp: 20,  dr: 0,    eva: 0.12, stackable: true, desc: '攻+50 闪避+12%（幽冥套·成品）', set: '幽冥', setTier: 2, chapter: 2 },
  { id: 'ym_a_top', name: '幽冥·鬼泣衣',   slot: 'armor',    atk: 0,  hp: 240, dr: 0.10, eva: 0.16, stackable: true, desc: '血+240 减伤+10% 闪避+16%（幽冥套·成品）', set: '幽冥', setTier: 2, chapter: 2 },
  { id: 'ym_t_top', name: '幽冥·鬼泣佩',   slot: 'treasure', atk: 18, hp: 100, dr: 0,    eva: 0.18, stackable: true, desc: '攻+18 血+100 闪避+18%（幽冥套·成品）', set: '幽冥', setTier: 2, chapter: 2 },
  // —— 第三章·涅槃套 T2 ——
  { id: 'np_w_top', name: '涅槃·重生杖',   slot: 'weapon',   atk: 45, hp: 60,  dr: 0,    hpRegen: 15, stackable: true, desc: '攻+45 血+60 每场战后回血+15（涅槃套·成品）', set: '涅槃', setTier: 2, chapter: 3 },
  { id: 'np_a_top', name: '涅槃·重生袍',   slot: 'armor',    atk: 0,  hp: 300, dr: 0.15, hpRegen: 70, stackable: true, desc: '血+300 减伤+15% 每场战后回血+70（涅槃套·成品）', set: '涅槃', setTier: 2, chapter: 3 },
  { id: 'np_t_top', name: '涅槃·重生珠',   slot: 'treasure', atk: 0,  hp: 140, dr: 0.10, hpRegen: 40, stackable: true, desc: '血+140 减伤+10% 每场战后回血+40（涅槃套·成品）', set: '涅槃', setTier: 2, chapter: 3 },
  // —— 第三章·降魔套 T2 ——
  { id: 'jm_w_top', name: '降魔·诛邪枪',   slot: 'weapon',   atk: 80, hp: 15,  dr: 0.04, stackable: true, desc: '攻+80 血+15 减伤+4%（降魔套·成品）', set: '降魔', setTier: 2, chapter: 3 },
  { id: 'jm_a_top', name: '降魔·诛邪甲',   slot: 'armor',    atk: 20, hp: 200, dr: 0.10, stackable: true, desc: '攻+20 血+200 减伤+10%（降魔套·成品）', set: '降魔', setTier: 2, chapter: 3 },
  { id: 'jm_t_top', name: '降魔·诛邪坠',   slot: 'treasure', atk: 40, hp: 60,  dr: 0.06, stackable: true, desc: '攻+40 血+60 减伤+6%（降魔套·成品）', set: '降魔', setTier: 2, chapter: 3 },
  // —— 第四章·封神套 T2 ——
  { id: 'fs_w_top', name: '封神·天威剑',   slot: 'weapon',   atk: 75, hp: 45,  dr: 0.06, crit: 0.06, stackable: true, desc: '攻+75 血+45 减伤+6% 暴击+6%（封神套·成品）', set: '封神', setTier: 2, chapter: 4 },
  { id: 'fs_a_top', name: '封神·天威甲',   slot: 'armor',    atk: 0,  hp: 340, dr: 0.18, hpRegen: 80, stackable: true, desc: '血+340 减伤+18% 每场战后回血+80（封神套·成品）', set: '封神', setTier: 2, chapter: 4 },
  { id: 'fs_t_top', name: '封神·天威佩',   slot: 'treasure', atk: 35, hp: 140, dr: 0.12, stackable: true, desc: '攻+35 血+140 减伤+12%（封神套·成品）', set: '封神', setTier: 2, chapter: 4 },
  // —— 第四章·轮回套 T2 ——
  { id: 'lh_w_top', name: '轮回·宿命刃',   slot: 'weapon',   atk: 60, hp: 30,  dr: 0,    eva: 0.10, crit: 0.08, stackable: true, desc: '攻+60 血+30 闪避+10% 暴击+8%（轮回套·成品）', set: '轮回', setTier: 2, chapter: 4 },
  { id: 'lh_a_top', name: '轮回·宿命衣',   slot: 'armor',    atk: 0,  hp: 270, dr: 0.14, eva: 0.14, stackable: true, desc: '血+270 减伤+14% 闪避+14%（轮回套·成品）', set: '轮回', setTier: 2, chapter: 4 },
  { id: 'lh_t_top', name: '轮回·宿命珠',   slot: 'treasure', atk: 25, hp: 120, dr: 0,    eva: 0.16, crit: 0.10, stackable: true, desc: '攻+25 血+120 闪避+16% 暴击+10%（轮回套·成品）', set: '轮回', setTier: 2, chapter: 4 },
  // ===== 八套合成套装·T3 成品（多重合成） =====
  // —— 第一章·天命套 T3 ——
  { id: 'tm_w_t3', name: '天命·天命归元剑', slot: 'weapon',   atk: 95,  hp: 60,  dr: 0.08, crit: 0.06, stackable: true, desc: '攻+95 血+60 减伤+8% 暴击+6%（天命套·T3）', set: '天命', setTier: 3, chapter: 2 },
  { id: 'tm_a_t3', name: '天命·天命归元甲', slot: 'armor',    atk: 0,   hp: 380, dr: 0.20, hpRegen: 100, stackable: true, desc: '血+380 减伤+20% 每场战后回血+100（天命套·T3）', set: '天命', setTier: 3, chapter: 2 },
  { id: 'tm_t_t3', name: '天命·天命归元佩', slot: 'treasure', atk: 35,  hp: 160, dr: 0.12, crit: 0.08, stackable: true, desc: '攻+35 血+160 减伤+12% 暴击+8%（天命套·T3）', set: '天命', setTier: 3, chapter: 2 },
  // —— 第一章·渡厄套 T3 ——
  { id: 'de_w_t3', name: '渡厄·大慈航杖',  slot: 'weapon',   atk: 70,  hp: 90,  dr: 0.12, stackable: true, desc: '攻+70 血+90 减伤+12%（渡厄套·T3）', set: '渡厄', setTier: 3, chapter: 2 },
  { id: 'de_a_t3', name: '渡厄·大慈航袍',  slot: 'armor',    atk: 0,   hp: 440, dr: 0.24, hpRegen: 120, stackable: true, desc: '血+440 减伤+24% 每场战后回血+120（渡厄套·T3）', set: '渡厄', setTier: 3, chapter: 2 },
  { id: 'de_t_t3', name: '渡厄·大慈航珠',  slot: 'treasure', atk: 0,   hp: 200, dr: 0.15, hpRegen: 60, stackable: true, desc: '血+200 减伤+15% 每场战后回血+60（渡厄套·T3）', set: '渡厄', setTier: 3, chapter: 2 },
  // —— 第二章·镇妖套 T3 ——
  { id: 'zy_w_t3', name: '镇妖·天师剑',   slot: 'weapon',   atk: 110, hp: 50,  dr: 0,    crit: 0.14, stackable: true, desc: '攻+110 血+50 暴击+14%（镇妖套·T3）', set: '镇妖', setTier: 3, chapter: 3 },
  { id: 'zy_a_t3', name: '镇妖·天师甲',   slot: 'armor',    atk: 0,   hp: 350, dr: 0.18, crit: 0.08, stackable: true, desc: '血+350 减伤+18% 暴击+8%（镇妖套·T3）', set: '镇妖', setTier: 3, chapter: 3 },
  { id: 'zy_t_t3', name: '镇妖·天师符',   slot: 'treasure', atk: 50,  hp: 150, dr: 0,    crit: 0.12, stackable: true, desc: '攻+50 血+150 暴击+12%（镇妖套·T3）', set: '镇妖', setTier: 3, chapter: 3 },
  // —— 第二章·幽冥套 T3 ——
  { id: 'ym_w_t3', name: '幽冥·阎罗刃',   slot: 'weapon',   atk: 85,  hp: 40,  dr: 0,    eva: 0.20, stackable: true, desc: '攻+85 血+40 闪避+20%（幽冥套·T3）', set: '幽冥', setTier: 3, chapter: 3 },
  { id: 'ym_a_t3', name: '幽冥·阎罗衣',   slot: 'armor',    atk: 0,   hp: 380, dr: 0.16, eva: 0.25, stackable: true, desc: '血+380 减伤+16% 闪避+25%（幽冥套·T3）', set: '幽冥', setTier: 3, chapter: 3 },
  { id: 'ym_t_t3', name: '幽冥·阎罗佩',   slot: 'treasure', atk: 32,  hp: 160, dr: 0,    eva: 0.28, stackable: true, desc: '攻+32 血+160 闪避+28%（幽冥套·T3）', set: '幽冥', setTier: 3, chapter: 3 },
  // —— 第三章·涅槃套 T3 ——
  { id: 'np_w_t3', name: '涅槃·不灭杖',   slot: 'weapon',   atk: 78,  hp: 100, dr: 0,    hpRegen: 30, stackable: true, desc: '攻+78 血+100 每场战后回血+30（涅槃套·T3）', set: '涅槃', setTier: 3, chapter: 4 },
  { id: 'np_a_t3', name: '涅槃·不灭袍',   slot: 'armor',    atk: 0,   hp: 480, dr: 0.22, hpRegen: 130, stackable: true, desc: '血+480 减伤+22% 每场战后回血+130（涅槃套·T3）', set: '涅槃', setTier: 3, chapter: 4 },
  { id: 'np_t_t3', name: '涅槃·不灭珠',   slot: 'treasure', atk: 0,   hp: 240, dr: 0.16, hpRegen: 80, stackable: true, desc: '血+240 减伤+16% 每场战后回血+80（涅槃套·T3）', set: '涅槃', setTier: 3, chapter: 4 },
  // —— 第三章·降魔套 T3 ——
  { id: 'jm_w_t3', name: '降魔·灭世枪',   slot: 'weapon',   atk: 135, hp: 35,  dr: 0.08, stackable: true, desc: '攻+135 血+35 减伤+8%（降魔套·T3）', set: '降魔', setTier: 3, chapter: 4 },
  { id: 'jm_a_t3', name: '降魔·灭世甲',   slot: 'armor',    atk: 35,  hp: 320, dr: 0.16, stackable: true, desc: '攻+35 血+320 减伤+16%（降魔套·T3）', set: '降魔', setTier: 3, chapter: 4 },
  { id: 'jm_t_t3', name: '降魔·灭世坠',   slot: 'treasure', atk: 70,  hp: 100, dr: 0.10, stackable: true, desc: '攻+70 血+100 减伤+10%（降魔套·T3）', set: '降魔', setTier: 3, chapter: 4 },
  // —— 第四章·封神套 T3 ——
  { id: 'fs_w_t3', name: '封神·封天剑',   slot: 'weapon',   atk: 130, hp: 80,  dr: 0.10, crit: 0.12, stackable: true, desc: '攻+130 血+80 减伤+10% 暴击+12%（封神套·T3）', set: '封神', setTier: 3, chapter: 4 },
  { id: 'fs_a_t3', name: '封神·封天甲',   slot: 'armor',    atk: 0,   hp: 520, dr: 0.26, hpRegen: 150, stackable: true, desc: '血+520 减伤+26% 每场战后回血+150（封神套·T3）', set: '封神', setTier: 3, chapter: 4 },
  { id: 'fs_t_t3', name: '封神·封天佩',   slot: 'treasure', atk: 60,  hp: 220, dr: 0.18, crit: 0.08, stackable: true, desc: '攻+60 血+220 减伤+18% 暴击+8%（封神套·T3）', set: '封神', setTier: 3, chapter: 4 },
  // —— 第四章·轮回套 T3 ——
  { id: 'lh_w_t3', name: '轮回·无间刃',   slot: 'weapon',   atk: 105, hp: 55,  dr: 0,    eva: 0.18, crit: 0.14, stackable: true, desc: '攻+105 血+55 闪避+18% 暴击+14%（轮回套·T3）', set: '轮回', setTier: 3, chapter: 4 },
  { id: 'lh_a_t3', name: '轮回·无间衣',   slot: 'armor',    atk: 0,   hp: 420, dr: 0.22, eva: 0.22, stackable: true, desc: '血+420 减伤+22% 闪避+22%（轮回套·T3）', set: '轮回', setTier: 3, chapter: 4 },
  { id: 'lh_t_t3', name: '轮回·无间珠',   slot: 'treasure', atk: 45,  hp: 190, dr: 0,    eva: 0.24, crit: 0.18, stackable: true, desc: '攻+45 血+190 闪避+24% 暴击+18%（轮回套·T3）', set: '轮回', setTier: 3, chapter: 4 },
  // —— 贪狼升级链 · 套装组件（slot:'component'，包裹中生效，不占装备格）——
  // 组件为合成产物：四件套基座熔炼而成。持有即激活对应套装隐藏职（见 NDX.SET_JOBS）。
  // 贪狼：一转「贪狼·聚灵」/ 二转「贪狼·凝魂」/ 三转「贪狼·天狼」
  { id: 'tl_comp1', name: '贪狼·聚灵', slot: 'component', atk: 0, hp: 0, desc: '贪狼套四件T1熔铸的套装灵性。包裹中生效：激活【贪狼·聚灵】一转（攻+20 血+180）', set: '贪狼', setTier: 2, chapter: 1, component: true, compTier: 1 },
  { id: 'tl_comp2', name: '贪狼·凝魂', slot: 'component', atk: 0, hp: 0, desc: '贪狼套四件T2熔铸的套装灵性。包裹中生效：激活【贪狼·凝魂】二转（攻+45 血+400 减伤+5%）', set: '贪狼', setTier: 2, chapter: 2, component: true, compTier: 2 },
  { id: 'tl_comp3', name: '贪狼·天狼', slot: 'component', atk: 0, hp: 0, desc: '贪狼套四件T3熔铸的套装灵性。包裹中生效：激活【贪狼·天狼】三转（攻+80 血+750 减伤+9% 闪避+4%）', set: '贪狼', setTier: 2, chapter: 3, component: true, compTier: 3 },
  // ============ 六道同构组件（V8.42）：破军/玄武/影遁/逆命 ============
  // 破军（战·攻击向）：一转/二转/三转
  { id: 'pw_comp1', name: '破军·聚锋', slot: 'component', atk: 0, hp: 0, desc: '破军套四件T1熔铸的套装灵性。包裹中生效：激活【破军·聚锋】一转（攻+32 血+120）', set: '破军', setTier: 2, chapter: 1, component: true, compTier: 1 },
  { id: 'pw_comp2', name: '破军·裂阵', slot: 'component', atk: 0, hp: 0, desc: '破军套四件T2熔铸的套装灵性。包裹中生效：激活【破军·裂阵】二转（攻+60 血+260 减伤+5%）', set: '破军', setTier: 2, chapter: 2, component: true, compTier: 2 },
  { id: 'pw_comp3', name: '破军·弑神', slot: 'component', atk: 0, hp: 0, desc: '破军套四件T3熔铸的套装灵性。包裹中生效：激活【破军·弑神】三转（攻+105 血+480 减伤+9% 暴击+6%）', set: '破军', setTier: 2, chapter: 3, component: true, compTier: 3 },
  // 玄武（渡·防御向）：一转/二转/三转
  { id: 'xw_comp1', name: '玄武·镇海灵', slot: 'component', atk: 0, hp: 0, desc: '玄武套四件T1熔铸的套装灵性。包裹中生效：激活【玄武·镇海灵】一转（血+220 减伤+6% 反伤+5%）', set: '玄武', setTier: 2, chapter: 1, component: true, compTier: 1 },
  { id: 'xw_comp2', name: '玄武·镇海魂', slot: 'component', atk: 0, hp: 0, desc: '玄武套四件T2熔铸的套装灵性。包裹中生效：激活【玄武·镇海魂】二转（血+480 减伤+13% 反伤+10%）', set: '玄武', setTier: 2, chapter: 2, component: true, compTier: 2 },
  { id: 'xw_comp3', name: '玄武·镇海神', slot: 'component', atk: 0, hp: 0, desc: '玄武套四件T3熔铸的套装灵性。包裹中生效：激活【玄武·镇海神】三转（血+850 减伤+22% 反伤+16%）', set: '玄武', setTier: 2, chapter: 3, component: true, compTier: 3 },
  // 影遁（隐·闪避向）：一转/二转/三转
  { id: 'yd_comp1', name: '影遁·无痕', slot: 'component', atk: 0, hp: 0, desc: '影遁套四件T1熔铸的套装灵性。包裹中生效：激活【影遁·无痕】一转（闪避+8% 攻+15）', set: '影遁', setTier: 2, chapter: 1, component: true, compTier: 1 },
  { id: 'yd_comp2', name: '影遁·遁空', slot: 'component', atk: 0, hp: 0, desc: '影遁套四件T2熔铸的套装灵性。包裹中生效：激活【影遁·遁空】二转（闪避+15% 攻+30 血+160）', set: '影遁', setTier: 2, chapter: 2, component: true, compTier: 2 },
  { id: 'yd_comp3', name: '影遁·归墟', slot: 'component', atk: 0, hp: 0, desc: '影遁套四件T3熔铸的套装灵性。包裹中生效：激活【影遁·归墟】三转（闪避+24% 攻+52 血+340 减伤+6%）', set: '影遁', setTier: 2, chapter: 3, component: true, compTier: 3 },
  // 逆命（逆·全加向）：一转/二转/三转
  { id: 'nm_comp1', name: '逆命·逆乱', slot: 'component', atk: 0, hp: 0, desc: '逆命套四件T1熔铸的套装灵性。包裹中生效：激活【逆命·逆乱】一转（攻+20 血+150 减伤+3%）', set: '逆命', setTier: 2, chapter: 1, component: true, compTier: 1 },
  { id: 'nm_comp2', name: '逆命·逆天', slot: 'component', atk: 0, hp: 0, desc: '逆命套四件T2熔铸的套装灵性。包裹中生效：激活【逆命·逆天】二转（攻+40 血+330 减伤+7% 闪避+4%）', set: '逆命', setTier: 2, chapter: 2, component: true, compTier: 2 },
  { id: 'nm_comp3', name: '逆命·大道崩', slot: 'component', atk: 0, hp: 0, desc: '逆命套四件T3熔铸的套装灵性。包裹中生效：激活【逆命·大道崩】三转（攻+70 血+600 减伤+12% 闪避+7% 暴击+4%）', set: '逆命', setTier: 2, chapter: 3, component: true, compTier: 3 },
  // 饕餮（夺·掠夺向）：一转/二转/三转
  { id: 'tt_comp1', name: '饕餮·吞金', slot: 'component', atk: 0, hp: 0, desc: '饕餮套四件T1熔铸的套装灵性。包裹中生效：激活【饕餮·吞金】一转（攻+26 血+140 暴击+4%）', set: '饕餮', setTier: 2, chapter: 1, component: true, compTier: 1 },
  { id: 'tt_comp2', name: '饕餮·噬宝', slot: 'component', atk: 0, hp: 0, desc: '饕餮套四件T2熔铸的套装灵性。包裹中生效：激活【饕餮·噬宝】二转（攻+52 血+300 暴击+7% 闪避+4%）', set: '饕餮', setTier: 2, chapter: 2, component: true, compTier: 2 },
  { id: 'tt_comp3', name: '饕餮·吞天', slot: 'component', atk: 0, hp: 0, desc: '饕餮套四件T3熔铸的套装灵性。包裹中生效：激活【饕餮·吞天】三转（攻+90 血+550 暴击+11% 闪避+6%）', set: '饕餮', setTier: 2, chapter: 3, component: true, compTier: 3 },
  // ===== V8.44 事件装备·多样化合成产物（仅由事件装备/材料合成获得，不进随机掉落） =====
  { id: 'cf_wa_shashen', name: '弑神·不坏·双绝', slot: 'weapon', atk: 190, hp: 520, dr: 0.16, shieldPct: 0.10, armorPen: 0.10, desc: '啸天狼牙与无当袈裟双绝合铸——攻+190 血+520 减伤+16% 开局护盾+10% 无视护甲+10%（双件套·武器栏·由啸天狼牙+无当袈裟合成）', chapter: 3 },
  { id: 'cf_t_hunhe', name: '混元社稷图', slot: 'treasure', atk: 52, hp: 240, dr: 0.10, reflect: 0.14, lifesteal: 0.06, desc: '混元一气袋与山河社稷图残卷合绘——攻+52 血+240 减伤+10% 反伤+14% 吸血+6%（高级饰品·由混元一气袋+山河社稷图·残合成）', chapter: 3 },
  { id: 'cf_a_wudangjin', name: '无当金身', slot: 'armor', hp: 700, dr: 0.20, shieldPct: 0.13, mdef: 0.05, desc: '无当袈裟经百炼之金再铸——血+700 减伤+20% 开局护盾+13% 法防+5%（甲胄升级·由无当袈裟+天竺佛香+凌云木升级）', chapter: 3 },
  // ===== V8.50 游历散宝·锻造产物（仅由组合面板合成获得，与直落散宝 id 区分，避免背包重 id） =====
  { id: 'adv_w_jingang_mk', name: '精钢戒刀·锻', slot: 'weapon', atk: 82, hp: 34, crit: 0.04, fixAtk: 10, desc: '旅人短刃淬以玄铁——攻+82 血+34 暴击+4% 破甲+10（锻造·游历散宝）' },
  { id: 'adv_a_bailian_mk', name: '百炼甲·锻', slot: 'armor', hp: 400, dr: 0.13, shieldPct: 0.06, desc: '粗布衣淬以玄铁——血+400 减伤+13% 开局护盾+6%（锻造·游历散宝）' },
  { id: 'adv_b_jifeng_mk', name: '疾风靴·锻', slot: 'boots', eva: 0.12, spd: 2, desc: '草鞋淬以玄铁——闪避+12% 速度+2（锻造·游历散宝）' },
  { id: 'adv_t_bixie_mk', name: '辟邪符·锻', slot: 'treasure', atk: 20, hp: 96, dr: 0.05, reflect: 0.07, lifesteal: 0.03, desc: '铜铃淬以玄铁——攻+20 血+96 减伤+5% 反伤+7% 吸血+3%（锻造·游历散宝）' },
  { id: 'adv_w_wanjun_mk', name: '镇妖万钧杵·锻', slot: 'weapon', atk: 138, hp: 54, crit: 0.06, fixAtk: 30, armorPen: 0.10, desc: '精钢戒刀淬以灵砂——攻+138 血+54 暴击+6% 破甲+30 无视护甲+10%（锻造·游历散宝）' },
  { id: 'adv_a_jiuzhuan_mk', name: '九转金身甲·锻', slot: 'armor', hp: 710, dr: 0.21, shieldPct: 0.14, mdef: 0.06, desc: '百炼甲淬以灵砂——血+710 减伤+21% 开局护盾+14% 法防+6%（锻造·游历散宝）' },
  { id: 'adv_b_zhuri_mk', name: '逐日靴·锻', slot: 'boots', eva: 0.18, spd: 4, desc: '疾风靴淬以锻魂玉——闪避+18% 速度+4（锻造·游历散宝）' },
  { id: 'adv_t_qiankun_mk', name: '乾坤宝镜·锻', slot: 'treasure', atk: 32, hp: 158, dr: 0.08, reflect: 0.11, lifesteal: 0.06, desc: '辟邪符淬以锻魂玉——攻+32 血+158 减伤+8% 反伤+11% 吸血+6%（锻造·游历散宝）' },
  { id: 'ev_w_nilin2', name: '逆鳞刀·淬', slot: 'weapon', atk: 122, hp: 46, crit: 0.05, fixAtk: 16, desc: '逆鳞刀淬以玄铁——攻+122 血+46 暴击+5% 破甲+16（事件装备进阶·由逆鳞刀·次+玄铁锭合成）' },
  { id: 'ev_a_fentian2', name: '焚天甲·淬', slot: 'armor', hp: 580, dr: 0.16, shieldPct: 0.09, desc: '焚天甲淬以灵砂——血+580 减伤+16% 开局护盾+9%（事件装备进阶·由焚天甲+淬灵砂合成）' },
  { id: 'ev_w_liuzhi2', name: '柳杖·净·淬', slot: 'weapon', matk: 80, hp: 48, crit: 0.05, desc: '柳杖·净淬以灵蕴珠——愿伤+80 血+48 暴击+5%（事件装备进阶·由柳杖·净+灵蕴珠合成）' },
  { id: 'ev_a_gongde2', name: '功德袈裟·淬', slot: 'armor', hp: 580, dr: 0.16, shieldPct: 0.09, desc: '功德袈裟淬以灵砂——血+580 减伤+16% 开局护盾+9%（事件装备进阶·由功德袈裟·次+淬灵砂合成）' },
  { id: 'ev_h_pilu2', name: '毗卢冠·淬', slot: 'head', matk: 72, mdef: 0.06, crit: 0.06, criMult: 0.10, desc: '毗卢遮那冠淬以灵蕴珠——愿伤+72 法防+6% 暴击+6% 暴伤+10%（事件装备进阶·由毗卢遮那冠+灵蕴珠合成）' },
  { id: 'ev_b_dengyun2', name: '登云履·淬', slot: 'boots', eva: 0.15, spd: 3, desc: '登云履淬以锻魂玉——闪避+15% 速度+3（事件装备进阶·由登云履+锻魂玉合成）' },
  { id: 'ev_t_hunyuan2', name: '混元袋·淬', slot: 'treasure', atk: 28, hp: 134, dr: 0.06, reflect: 0.08, lifesteal: 0.05, desc: '混元一气袋淬以妖魂核——攻+28 血+134 减伤+6% 反伤+8% 吸血+5%（事件装备进阶·由混元一气袋+妖魂核合成）' },
  { id: 'cf_wa_shashen2', name: '弑神·不坏·双绝·圆满', slot: 'weapon', atk: 210, hp: 560, dr: 0.18, shieldPct: 0.12, armorPen: 0.14, desc: '双绝再淬以天工谱——攻+210 血+560 减伤+18% 开局护盾+12% 无视护甲+14%（组合圆满·由弑神·不坏·双绝+天工谱合成）' },
  { id: 'cf_t_hunhe2', name: '混元社稷图·圆满', slot: 'treasure', atk: 58, hp: 260, dr: 0.12, reflect: 0.16, lifesteal: 0.08, desc: '混元社稷图再淬以天工谱——攻+58 血+260 减伤+12% 反伤+16% 吸血+8%（组合圆满·由混元社稷图+天工谱合成）' },
  { id: 'cf_a_wudangjin2', name: '无当金身·圆满', slot: 'armor', hp: 760, dr: 0.22, shieldPct: 0.15, mdef: 0.07, desc: '无当金身再淬以天工谱——血+760 减伤+22% 开局护盾+15% 法防+7%（组合圆满·由无当金身+天工谱合成）' },
];

// 合成配方：
//  - 类型A（base+material）：劫难固定宝物 + 其专属材料 → T1 单件（必可合成）
//  - 类型B（套装三合一 set）：集齐同一套装的三件 T1 基座 → 铸成 T2 套装成品（拼图式收集）
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
  // 数值 [PLACEHOLDER·待10局采样]：proc 上限 35%、同击封顶 50%、Boss 豁免 shrink/silence 永久化（仅限 2 回合）
  zijin_honghulu: {
    dao: '战', name: '紫金红葫芦', phase: 'passive', auto: true, charges: 0,
    desc: '太上老君盛丹之器。攻击有 25% 概率将妖敌收作小人——怪物造成伤害骤降 50%（变小），持续 2 回合。',
    effect: { onHit: { proc: 0.25, shrink: 0.5, dur: 2 } },
  },
  jinguo_zhuo: {
    dao: '缘', name: '金刚琢', phase: 'passive', auto: true, charges: 0,
    desc: '金钢不坏之圈。攻击有 20% 概率套住妖敌，令其晕眩 1 回合（无法行动）。',
    effect: { onHit: { proc: 0.20, stun: 1 } },
  },
  bajiao_shan: {
    dao: '隐', name: '芭蕉扇', phase: 'passive', auto: true, charges: 0,
    desc: '罗刹女之宝扇。攻击有 30% 概率煽出阴风真火，妖敌每回合流失 4% 最大气血（灼烧），持续 2 回合。',
    effect: { onHit: { proc: 0.30, burn: 0.04, dur: 2 } },
  },
  kunxian_sheng: {
    dao: '隐', name: '捆仙绳', phase: 'passive', auto: true, charges: 0,
    desc: '惧留孙之缚仙绳。攻击有 18% 概率将妖敌定身，令其 2 回合不得动弹。',
    effect: { onHit: { proc: 0.18, stun: 2 } },
  },
  feilong_zhang: {
    dao: '缘', name: '飞龙宝杖', phase: 'passive', auto: true, charges: 0,
    desc: '龙宫镇海之杖。攻击有 28% 概率驯龙压下，妖敌攻击减弱 30%，持续 2 回合。',
    effect: { onHit: { proc: 0.28, slow: 0.30, dur: 2 } },
  },
  jiuhuan_zhang: {
    dao: '渡', name: '九环锡杖', phase: 'passive', auto: true, charges: 0,
    desc: '唐僧九环锡杖。攻击有 22% 概率震出佛门圣伤（附加 8% 真伤），并令妖敌沉默 1 回合（技能被禁）。',
    effect: { onHit: { proc: 0.22, silence: 1, trueDmg: 0.08 } },
  },
  // —— V9.6 观音玉净瓶（主动净化，phase:'in' 战斗中可祭出，5 次可土地庙补）——
  ts_jingping: {
    dao: '渡', name: '观音玉净瓶', phase: 'in', charges: 5,
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
  };

  // 从 s.equips 中收集全部已持有的套装组件（slot:'component'），按最高转职档取最终效果
  // V8.5x 修订：组件本身不再自动激活隐藏职，必须持有对应六道升级石（JOB_STONES）方可唤醒。
  // 返回 { maxTier, bonus(最高档), jobs: [已解锁职业名] } —— 供面板/隐藏职展示与战斗结算
  NDX.setJobBonusFor = function (s) {
    const bonus = { ti: {}, yuan: {} };
    const jobs = [];
    let maxTier = 0;
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
        bonus.ti = Object.assign({}, sj.bonus.ti || {});
        bonus.yuan = Object.assign({}, sj.bonus.yuan || {});
      }
    });
    return { maxTier, bonus, jobs };
  };

  /* ============================ 套装共鸣 SET_RESONANCE ============================ */
  NDX.SET_RESONANCE = {
    破军: {       // 破军套：物理爆发核心（攻击向独占）
      name: '破军·杀伐', tier2: { atkPct: 0.15 }, tier3: { atkPct: 0.30, cri: 0.10 } },
    玄武: {        // 玄武套：防御流核心（减伤独占 + 缘道劫印联动）
      name: '玄武·镇海', tier2: { drPlus: 0.06, drMult: 1.04 }, tier3: { drPlus: 0.14, drMult: 1.12, drSealMult: 1.30 } },
    贪狼: {       // 贪狼套：攻守兼备（攻击+气血双修）
      name: '贪狼·贪狼', tier2: { atkPct: 0.10, hpPct: 0.10 }, tier3: { atkPct: 0.20, hpPct: 0.22 } },
    取经人: {       // 取经人·锡杖套：法术核心（法伤+法防）
      name: '旃檀·法相', tier2: { matkPct: 0.15, mdefPlus: 0.06 }, tier3: { matkPct: 0.30, mdefPlus: 0.12 } },
    八戒: {       // 八戒·钉耙套：肉盾回复（气血+每秒回复）
      name: '净坛·饱食', tier2: { hpPct: 0.18, hpRegenPct: 0.02 }, tier3: { hpPct: 0.35, hpRegenPct: 0.04 } },
    悟空: {       // 悟空·齐天套：暴击速攻（暴击+攻速向）
      name: '齐天·斗战', tier2: { atkPct: 0.12, cri: 0.08 }, tier3: { atkPct: 0.22, cri: 0.16, criMult: 0.2 } },
    龙马: {       // 龙马·白龙套：闪避风行（闪避独占）
      name: '白龙·疾风', tier2: { evaPlus: 0.08 }, tier3: { evaPlus: 0.16, evaOnDodge: true } },
    沙僧: {       // 沙僧·卷帘套：御念铁壁（法防独占）
      name: '卷帘·御念', tier2: { mdefPlus: 0.10 }, tier3: { mdefPlus: 0.20, drPlus: 0.05 } },
    御兽: {       // 御兽·百兽套（V8.22 驯兽师）：上阵灵兽越多加成越强（按活阵灵兽数 perPet 缩放，见 applySetResonance）
      name: '百兽·亲合', tier2: { perPetAtkPct: 0.06, perPetHpPct: 0.06, perPetEva: 0.02 }, tier3: { perPetAtkPct: 0.05, perPetHpPct: 0.05, perPetEva: 0.02, petRes: true } },
    盘缠: {       // 盘缠·散财套：经济核心（金币加成+商店折扣+气血兜底）
      name: '散财·聚宝', tier2: { goldPct: 0.15, shopDiscount: 0.10 }, tier3: { goldPct: 0.30, shopDiscount: 0.20, hpPct: 0.10 } },
    // ===== 八套合成套装共鸣（V8.23） =====
    天命: {       // 天命套（Ch1）：攻防均衡，新手过渡首选
      name: '天命·均衡', tier2: { atkPct: 0.08, drPlus: 0.03 }, tier3: { atkPct: 0.15, drPlus: 0.06, hpPct: 0.10 } },
    渡厄: {       // 渡厄套（Ch1）：减伤回复，稳健续航
      name: '渡厄·护生', tier2: { drPlus: 0.05, hpRegenPct: 0.02 }, tier3: { drPlus: 0.10, hpRegenPct: 0.04, hpPct: 0.15 } },
    镇妖: {       // 镇妖套（Ch2）：暴击破甲，暴力输出
      name: '镇妖·破阵', tier2: { cri: 0.10, criMult: 0.15 }, tier3: { cri: 0.18, criMult: 0.30, atkPct: 0.10 } },
    幽冥: {       // 幽冥套（Ch2）：闪避暗杀，刺客流
      name: '幽冥·影杀', tier2: { evaPlus: 0.08, cri: 0.06 }, tier3: { evaPlus: 0.14, cri: 0.12, criMult: 0.20 } },
    涅槃: {       // 涅槃套（Ch3）：气血回复，不死之身
      name: '涅槃·重生', tier2: { hpPct: 0.15, hpRegenPct: 0.03 }, tier3: { hpPct: 0.30, hpRegenPct: 0.05, drPlus: 0.05 } },
    降魔: {       // 降魔套（Ch3）：攻击爆发，斩杀流
      name: '降魔·诛邪', tier2: { atkPct: 0.15, cri: 0.08 }, tier3: { atkPct: 0.25, cri: 0.15, criMult: 0.25 } },
    封神: {       // 封神套（Ch4）：全属性，终局万能
      name: '封神·万法', tier2: { atkPct: 0.10, hpPct: 0.10, drPlus: 0.03 }, tier3: { atkPct: 0.18, hpPct: 0.18, drPlus: 0.06, cri: 0.08 } },
    轮回: {       // 轮回套（Ch4）：闪避暴击，终局刺客
      name: '轮回·无常', tier2: { evaPlus: 0.10, cri: 0.10 }, tier3: { evaPlus: 0.18, cri: 0.18, criMult: 0.25, atkPct: 0.08 } },
    // ===== 六道专职套共鸣（V8.42 补齐）：影遁(隐)/逆命(逆) =====
    影遁: {       // 影遁套：隐道闪避核心（闪避+身法向）
      name: '影遁·无痕', tier2: { evaPlus: 0.10, atkPct: 0.08 }, tier3: { evaPlus: 0.20, atkPct: 0.16, cri: 0.08 } },
    逆命: {       // 逆命套：逆道全加（攻血减伤闪避全面）
      name: '逆命·逆乱', tier2: { atkPct: 0.10, hpPct: 0.10, drPlus: 0.04 }, tier3: { atkPct: 0.18, hpPct: 0.18, drPlus: 0.08, evaPlus: 0.06 } },
    饕餮: {       // 饕餮套：夺道·掠夺向（攻+暴击+身法，与破军纯攻/BOSS压制、贪狼攻血双修区分）
      name: '饕餮·夺势', tier2: { atkPct: 0.14, cri: 0.08 }, tier3: { atkPct: 0.26, cri: 0.16, criMult: 0.15 } },
    // ===== 章节套共鸣补齐（V8.42）：黑风/狮驼/凌云 =====
    黑风: {       // 黑风套：战道·攻防兼备（黑风山章节专属）
      name: '黑风·裂空', tier2: { atkPct: 0.10, drPlus: 0.04 }, tier3: { atkPct: 0.20, drPlus: 0.08, hpPct: 0.10 } },
    狮驼: {       // 狮驼套：夺道·强攻夺势（狮驼岭章节专属）
      name: '狮驼·金翅', tier2: { atkPct: 0.12, cri: 0.06 }, tier3: { atkPct: 0.22, cri: 0.12, criMult: 0.20 } },
    凌云: {       // 凌云套：渡道·御念凌云（终局渡线章节专属）
      name: '凌云·渡世', tier2: { matkPct: 0.12, mdefPlus: 0.06 }, tier3: { matkPct: 0.24, mdefPlus: 0.12, hpPct: 0.10 } },
  };
  // 套装件数统计 + 共鸣结算（供 computeStats 调用）
  NDX.applySetResonance = function (equips, ctx, s) {
    // ctx: { atk, maxHp, dr, matk, mdef, eva, cri, criMult, hpRegen, sealDr(劫印已贡献的减伤), flags }
    if (!s && window.NDX && NDX.game && NDX.game.state) s = NDX.game.state; // 逆道共鸣需读状态：逆经/觉醒旗标
    const cnt = {};
    // 套装共鸣件数只统计身体四槽（weapon/armor/head/boots）+ 部分体系的特殊槽位。
    // 组件(slot:'component')是套装升级链的"包裹灵性"，不计入共鸣；法宝/宠物挂的旧 set 标签也不计入，
    // 避免持有 2 件历史贪狼法宝就误触贪狼共鸣。
    const _bodySlots = new Set(['weapon', 'armor', 'head', 'boots']);
    (equips || []).forEach((e) => { if (e && e.set && _bodySlots.has(e.slot)) cnt[e.set] = (cnt[e.set] || 0) + 1; });
    const flags = ctx.flags || {};
    Object.keys(cnt).forEach((setKey) => {
      const def = NDX.SET_RESONANCE[setKey];
      if (!def) return;
      const n = cnt[setKey];
      if (n < 2) return; // 未达共鸣门槛
      const tier = (n >= 3 && def.tier3) ? def.tier3 : (n >= 2 ? def.tier2 : null);
      if (!tier) return;
      // —— 攻击/法伤/气血：百分比乘区 ——
      if (tier.atkPct) ctx.atk *= (1 + tier.atkPct);
      if (tier.matkPct) ctx.matk *= (1 + tier.matkPct);
      if (tier.hpPct) ctx.maxHp *= (1 + tier.hpPct);
      // —— 御兽套·按上阵灵兽数缩放（驯兽师核心）：perPet*N 只上阵灵兽 ——
      {
        // 逆道共鸣：逆道路线 / 逆兽师觉醒 时，御兽套「按灵兽缩放」额外增幅（逆经强化灵兽，不动宠物数据本身）
        let _niMult = 1;
        if (s && NDX.isNiRoute && NDX.isNiRoute(s)) _niMult *= 1.5;
        if (s && NDX.isAwakened && NDX.isAwakened('逆兽师·百逆归心')) _niMult *= 1.5;
        const _petN = (equips || []).filter((e) => e && e.slot === 'pet').length;
        if (tier.perPetAtkPct) ctx.atk *= (1 + tier.perPetAtkPct * _petN * _niMult);
        if (tier.perPetHpPct) ctx.maxHp *= (1 + tier.perPetHpPct * _petN * _niMult);
        if (tier.perPetEva) ctx.eva += tier.perPetEva * _petN * _niMult;
        if (tier.petRes) flags.petRes = true; // 御兽·亲合：灵兽共鸣（羁绊增益放大）
      }
      // —— 减伤：固定增量 + 已累积减伤乘区（玄武核心）——
      if (tier.drMult) {
        // 玄武：对已累积减伤(含劫印缘道)做乘区放大，叠劫印越多收益越大
        ctx.dr = ctx.dr * tier.drMult;
        if (tier.drSealMult && ctx.sealDr) ctx.dr += ctx.sealDr * (tier.drSealMult - 1);
      }
      if (tier.drPlus) ctx.dr += tier.drPlus;
      // —— 法防 / 闪避：固定增量 ——
      if (tier.mdefPlus) ctx.mdef += tier.mdefPlus;
      if (tier.evaPlus) ctx.eva += tier.evaPlus;
      // —— 暴击 ——
      if (tier.cri) ctx.cri += tier.cri;
      if (tier.criMult) ctx.criMult += tier.criMult;
      // —— 回复：基于当前气血上限百分比 ——
      if (tier.hpRegenPct) ctx.hpRegen += Math.round(ctx.maxHp * tier.hpRegenPct);
      // —— 经济（盘缠）：标记回传 ——
      if (tier.goldPct) flags.goldPct = Math.max(flags.goldPct || 0, tier.goldPct);
      if (tier.shopDiscount) flags.shopDiscount = Math.max(flags.shopDiscount || 0, tier.shopDiscount);
      if (tier.evaOnDodge) flags.evaOnDodge = true;
      // 共鸣达成标记（供 UI 展示"已共鸣"）
      flags.resonated = flags.resonated || [];
      flags.resonated.push({ set: setKey, name: def.name, tier: (n >= 3 ? 3 : 2) });
    });
    return ctx;
  };

  // ============================================================
  //  装备栏（V8.20）：背包栏内按「类型」设定格子数量，避免盲目堆积装备。
  //    · 装备(兵刃/甲胄/头冠/战靴等非宠非法宝) = 4 格
  //    · 灵宠 = 2 格
  //    · 法宝(主动系) = 2 格，随章节递增（2 + [(章-1)/2]，封顶 6）
  //    · 劫印（V3 §1.1）全量自动生效、不占格，仅受 81 难可获得总数自然约束
  //  自动择优：同级装备按品质/数值评分取前 N；手动 active=true 锁定优先，manualOff 放弃。
  // ============================================================
  NDX.gearSlotCap = 4;    // 装备四件
NDX.petSlotCap = 2;     // 宠物两格

// —— 万世剑冢式 · 传承衰减（V8.21）——
// 取消局内「磨损+打磨」。改为：跨周目承继的本命神器，每被带入一世衰减 20%。
//   uses：该物已历经的世数（含本世）。第1世完全体(×1)，第2世×0.8，第3世×0.6，第4世×0.4；
//   到第5世（uses>4）破损销毁、不再入匣随行。完全体→衰减→破损，最多传世4次。
//   专属/传承神器无需「永不消除」兜底——每世重走81难必然重新获得。
NDX.INHERIT_MAX_USES = 4;
NDX.inheritPowerMult = function (e) {
  const u = (e && e.uses) || 1;
  if (u <= 1) return 1;
  if (u >= NDX.INHERIT_MAX_USES + 1) return 0;
  return Math.max(0.4, 1 - 0.2 * (u - 1));
};
NDX.inheritTierOf = function (u) {
  u = (u || 1) | 0;
  if (u >= NDX.INHERIT_MAX_USES + 1) return { mult: 0, label: '已破损', left: 0 };
  if (u <= 1) return { mult: 1, label: '完全体', left: 3 };
  const m = Math.max(0.4, 1 - 0.2 * (u - 1));
  const label = m >= 0.75 ? '八分' : (m >= 0.55 ? '六分' : '四分');
  return { mult: m, label: label, left: Math.max(0, NDX.INHERIT_MAX_USES - u) };
};
// 红装判定统一真源（§16.2 一生账本）：替换散布的 `e.setTier >= 3 || e.red === true`。
//   e.red 为无赋值来源的残影字段，一律忽略，以 setTier>=3 为准。
//   传 heroSet（英雄专属套装名）时限定为「本命红装」（该英雄专属套成品）；
//   专属法宝（treasure + owner 匹配英雄）不归本函数，由调用方另行判定。
NDX.isRedEquip = function (e, heroSet) {
  if (!e || (e.setTier || 0) < 3) return false;
  return heroSet ? (e.set === heroSet) : true;
};
  // 法宝随章节递增：第1章2格 → 第9章6格
  NDX.treasureSlotCap = function (act) { return Math.min(6, 2 + Math.floor((Math.max(1, act || 1) - 1) / 2)); };
  NDX.EQUIP_SLOT_LABEL = { weapon: '兵刃', armor: '甲胄', head: '头冠', boots: '战靴', treasure: '法宝', pet: '灵宠' };
  // 兵刃/甲胄/头冠/战靴 · 四格身体装备（V8.23）：每格各装一件、一一对应，取消原先「兵刃+甲胄混算 4 格」的模糊
  NDX.GEAR_SLOTS = ['weapon', 'armor', 'head', 'boots'];
  NDX.GEAR_SLOT_LABEL = { weapon: '兵刃', armor: '甲胄', head: '头冠', boots: '战靴' };

  // ============================================================
  // 灵兽·羁绊（V8.22 宠物修订版）：同场上阵 2 只特定灵兽激活绑定加成
  // a/b: 两灵兽 id；说明以 desc；数值在 computeStats 统一结算
  // ============================================================
  NDX.PET_FETTERS = [
    { id: '顽石生灵', a: 'lingyan', b: 'yanlin', hpPct: 0.30, desc: '顽石生灵（灵岩幼兽+岩鳞石卫）：全队最大生命 +30%' },
    { id: '顺随天性', a: 'qingyuehu', b: 'taxue', eva: 0.12, firstStrike: 1, desc: '顺随天性（清月灵狐+踏雪灵鹿）：闪避 +12%，战斗开场先手 +1' },
    { id: '山野妖群', a: 'shilang', b: 'huangzhonghu', atkPct: 0.18, desc: '山野妖群（噬骨狼崽+荒冢灵狐）：全队攻击 +18%，劫力获取提升' },
    { id: '禅门护法', a: 'ditingyou', b: 'foguangque', matkPct: 0.20, desc: '禅门护法（谛听幼兽+佛光白雀）：渡化判定成功率 +25%（愿力+20%），心魔积累 −18%' },
    { id: '逆兽同契', a: 'ni_huangshi', b: 'ni_jiuling', hpPct: 0.25, atkPct: 0.12, desc: '逆兽同契（黄狮精+九灵元圣）：全队生命 +25%、攻击 +12%——说动的妖越多，反的越稳' },
    { id: '火焰余脉', a: 'ni_honghai', b: 'ni_niumo', matkPct: 0.30, desc: '火焰余脉（红孩儿+牛魔王）：愿伤 +30%——积雷山一门三口，都不肯被收编' },
    { id: '佛门弃徒', a: 'ni_huangfeng', b: 'ni_xiejing', cri: 0.08, desc: '佛门弃徒（黄毛貂鼠+琵琶蝎）：暴击 +8%——一个偷油被追，一个听经被推' }
  ];
  // 检测同阵激活的羁绊：activeEquips 为当前生效装备数组；返回激活的羁绊对象列表
  NDX.petFetterEffects = function (activeEquips) {
    const ids = (activeEquips || []).filter((e) => e && e.slot === 'pet').map((e) => e.id);
    if (ids.length < 2) return [];
    return (NDX.PET_FETTERS || []).filter((f) => ids.indexOf(f.a) >= 0 && ids.indexOf(f.b) >= 0);
  };
  // 模块八·灵宠被动聚合（单源 owner）：把上阵灵宠的 petPassive 汇总为战斗标记字典，
  // 供 computeStats 静态并入（dragon_aura/rockwall/hymn/guard/gold_per_turn）与 simulateSingle 机制消费
  // （regen/poison/stoneheart/whisk/cleanse/rend），羁绊 firstStrike 亦并此。同型可叠加计数。
  // 数值/语义真源在宠物条目 desc；此处仅聚合「哪些被动正在上阵、属几档」。
  NDX.aggregatePetPassive = function (equips) {
    const pp = {};
    (equips || []).forEach((e) => {
      if (e && e.slot === 'pet' && e.petPassive) pp[e.petPassive] = (pp[e.petPassive] || 0) + 1;
    });
    const fets = NDX.petFetterEffects(equips);
    fets.forEach((f) => {
      if (f.firstStrike) pp.firstStrike = (pp.firstStrike || 0) + (f.firstStrike || 0);
    });
    return pp;
  };

  // 收徒进度（修订版·难8收悟空 / 难12收八戒 / 难16收沙僧）→ 上阵槽 +1/徒，封顶 4 格
  NDX.recruitedCount = function (s) {
    const tp = (s && s.trialsPassed) || [];
    let maxDiff = 0;
    tp.forEach((t) => { const d = (t && (t.diff || t.id)) | 0; if (d > maxDiff) maxDiff = d; });
    if (maxDiff >= 16) return 3; if (maxDiff >= 12) return 2; if (maxDiff >= 8) return 1;
    return 0;
  };
  // 灵宠上阵槽动态上限：初始 2 格，每收一徒 +1（封顶 4）；逆道融合再开放额外出战位
  NDX.petSlotCapFor = function (ctx) {
    let s = (ctx && ctx.equips) ? ctx : null;
    if (!s && window.NDX && NDX.game && NDX.game.state) s = NDX.game.state;
    const n = s ? NDX.recruitedCount(s) : 0;
    let cap = 2 + n;
    // 逆道融合：逆道路线（逆道劫印≥2 / 已合成逆经）额外开放 1 个出战位——逆修之兽更凶，逆道配置额外宠物出战
    if (s && NDX.isNiRoute && NDX.isNiRoute(s)) cap += 1;
    // 逆兽师·百逆归心（隐藏职）：再 +1 出战位
    if (s && NDX.isAwakened && NDX.isAwakened('逆兽师·百逆归心')) cap += 1;
    return Math.min(6, cap);
  };

  // ============================================================
  // 灵兽进化劫难（宠物修订版 V8.17 §七）：基础本体在「指定章节」以约 35%
  // 概率经问号(?)节点刷出进化事件；持有满 2 个该章节点仍未触发则保底强制。
  //   base    进化来源本体 id（须持有在背包）
  //   chapter 指定触发章节（act），跨过该章即不再刷
  //   cond    可选附加条件（'balance' → 六道均衡）
  //   opts    选项：target 目标形态 id / keep 保留本体(关闭进化)
  // 目标形态必已在 EQUIP_POOL；进化通过既有 upgrade:{from,to} 结算。
  // ============================================================
  // 双线事件装备（V8.27 经文系统：渡线善系 8 + 逆线叛逆 14 含三尖 6 部件）
  // 由双线事件选项 gear 字段发放（applyEffectCore 消费）；数值为草案量级。
  // ============================================================
  NDX.SUTRA_EVENT_GEAR = [
    // 渡线 · 善系
    { id: 'jade_vase', name: '玉净瓶', slot: 'treasure', desc: '观音净瓶——局内一次：满血+清心魔（观音好感≥3 额外复活一次）' },
    { id: 'wuchao_robe', name: '乌巢禅衣', slot: 'armor', hp: 60, dr: 0.08, desc: '乌巢旧衲——心经加持，御寒亦御妖' },
    { id: 'dizang_staff', name: '地藏锡杖', slot: 'weapon', matk: 30, desc: '点化枯骨，亦渡亡魂（对妖/鬼系伤害+10%）' },
    { id: 'puti_seal', name: '菩提心印', slot: 'treasure', desc: '局内一次：三选一可重掷' },
    { id: 'renshen_branch', name: '人参果树·枝', slot: 'treasure', hp: 120, desc: '草还丹枝——气血+120，回复+5%' },
    { id: 'wenshu_sword', name: '文殊慧剑', slot: 'weapon', atk: 40, desc: '慧剑斩无明（破防）' },
    { id: 'houtian_bag', name: '后天袋', slot: 'treasure', desc: '局内一次：收妖跳过一场战斗' },
    { id: 'liuli_lamp', name: '琉璃灯', slot: 'treasure', desc: '局内一次：免死/破暗' },
    // 逆线 · 叛逆
    { id: 'qiankun_ring', name: '乾坤圈·浑天', slot: 'treasure', eva: 0.06, desc: '哪吒旧圈——身法+6%，暴击+5%，闪避后下一击必中' },
    { id: 'sanjian_p1', name: '三尖两刃刀·戟刃', slot: 'treasure', desc: '二郎神六部件之一（集齐合成完整三尖两刃刀）' },
    { id: 'sanjian_p2', name: '三尖两刃刀·戟脊', slot: 'treasure', desc: '二郎神六部件之一' },
    { id: 'sanjian_p3', name: '三尖两刃刀·戟柄', slot: 'treasure', desc: '二郎神六部件之一' },
    { id: 'sanjian_p4', name: '三尖两刃刀·神纹', slot: 'treasure', desc: '二郎神六部件之一' },
    { id: 'sanjian_p5', name: '三尖两刃刀·哮天环', slot: 'treasure', desc: '二郎神六部件之一' },
    { id: 'sanjian_p6', name: '三尖两刃刀·天眼石', slot: 'treasure', desc: '二郎神六部件之一' },
    { id: 'liuer_mao', name: '六耳毫毛', slot: 'treasure', eva: 0.04, desc: '闪避后反击' },
    { id: 'baigu_sheli', name: '白骨舍利', slot: 'treasure', hp: 50, dr: 0.03, desc: '枯骨亦有归处——气血+50，减伤+3%' },
    { id: 'huojian_spear', name: '火尖枪·残', slot: 'weapon', matk: 20, desc: '圣婴红缨（火系克制+10%）' },
    { id: 'bajiao_fan', name: '芭蕉扇·残', slot: 'treasure', desc: '局内一次：重掷任一次三选一' },
    { id: 'yinyang_bottle', name: '阴阳二气瓶·残', slot: 'treasure', desc: '反弹所受伤害8%' },
    { id: 'jiuzhang_seal', name: '旧账·逆道印', slot: 'treasure', desc: '二周目论道凭证（《旧账》meta 联动）' }
  ];
  // ============================================================
  // V8.44 事件专属装备（每槽位独立特殊装备，参照冒险日记事件装备体系）
  // 三级梯度：英雄专属顶级单件 < 次级事件装备 < 顶级事件装备 < 4件英雄专属组合套件。
  // 单件顶级亦不及四件英雄专属套件组合（四件基础总和+共鸣），保证"英雄专属四件套"仍是主力成套路线。
  // 全部 eventOnly：只从事件选项 gear 发放，逼迫玩家多走事件；不入随机掉落/商店。
  // 槽位特色：武器=物理极高+无视护甲(armorPen)、甲胄=自带护盾(shieldPct)、头冠=法伤暴击、
  //          战靴=闪避速度(spd)、法宝=反伤吸血(reflect/lifesteal)。
  // ============================================================
  const EVENT_GEAR = [
    // —— 武器：物理极高 + 破甲/无视护甲 ——
    { id: 'ev_w_langya',   name: '啸天狼牙', slot: 'weapon', atk: 118, hp: 40, crit: 0.04, fixAtk: 15, desc: '哮天犬之獠牙——攻+118 血+40 暴击+4% 破甲+15（无视怪物部分护甲；次级·事件专属）' },
    { id: 'ev_w_xingtian', name: '开天斧·刑天', slot: 'weapon', atk: 165, hp: 60, crit: 0.06, fixAtk: 35, armorPen: 0.12, desc: '刑天断首所持之斧——攻+165 血+60 暴击+6% 破甲+35 无视护甲+12%（顶级·事件专属）' },
    // —— 甲胄：自带护盾 + 高血 ——
    { id: 'ev_a_wudang',   name: '无当袈裟', slot: 'armor', hp: 560, dr: 0.16, shieldPct: 0.08, desc: '地藏无当之衲——血+560 减伤+16% 开局护盾+8%（次级·事件专属）' },
    { id: 'ev_a_ruyi',     name: '金缕玉衣·如来', slot: 'armor', hp: 760, dr: 0.22, shieldPct: 0.15, mdef: 0.06, desc: '如来金缕所织——血+760 减伤+22% 开局护盾+15% 法防+6%（顶级·事件专属）' },
    // —— 头冠：法伤暴击 ——
    { id: 'ev_h_pilu',     name: '毗卢遮那冠', slot: 'head', matk: 66, mdef: 0.05, crit: 0.05, desc: '文殊普贤所戴毗卢冠——愿伤+66 法防+5% 暴击+5%（次级·事件专属）' },
    { id: 'ev_h_wufo',     name: '五佛冠·真', slot: 'head', matk: 92, mdef: 0.08, crit: 0.08, criMult: 0.2, desc: '灵山五佛之冠——愿伤+92 法防+8% 暴击+8% 暴伤+20%（顶级·事件专属）' },
    // —— 战靴：闪避速度 ——
    { id: 'ev_b_dengyun',  name: '登云履', slot: 'boots', eva: 0.13, spd: 2, desc: '哪吒登云之履——闪避+13% 速度+2（次级·事件专属）' },
    { id: 'ev_b_tayun',    name: '踏云追风靴', slot: 'boots', eva: 0.19, spd: 4, desc: '踏云追风、日行万里——闪避+19% 速度+4（顶级·事件专属）' },
    // —— 法宝：反伤吸血 ——
    { id: 'ev_t_hunyuan',  name: '混元一气袋', slot: 'treasure', atk: 24, hp: 120, dr: 0.05, reflect: 0.06, desc: '镇元混元一气所凝——攻+24 血+120 减伤+5% 反伤+6%（次级·事件专属）' },
    { id: 'ev_t_shanhe',   name: '山河社稷图·残', slot: 'treasure', atk: 36, hp: 170, dr: 0.08, reflect: 0.10, lifesteal: 0.04, desc: '女娲山河社稷图残卷——攻+36 血+170 减伤+8% 反伤+10% 吸血+4%（顶级·事件专属）' },
    // —— 渡线 · 善系次级（丰富「渡」路线选择）——
    { id: 'ev_w_liuzhi',   name: '柳杖·净', slot: 'weapon', matk: 70, hp: 40, crit: 0.04, desc: '净瓶柳枝所化——愿伤+70 血+40 暴击+4%（渡线·次级·事件专属）' },
    { id: 'ev_a_gongde',   name: '功德袈裟·次', slot: 'armor', hp: 540, dr: 0.15, shieldPct: 0.07, desc: '功德所织之衲——血+540 减伤+15% 开局护盾+7%（渡线·次级·事件专属）' },
    { id: 'ev_h_baoxiang', name: '宝相冠', slot: 'head', matk: 60, mdef: 0.05, crit: 0.05, desc: '宝相庄严之冠——愿伤+60 法防+5% 暴击+5%（渡线·次级·事件专属）' },
    { id: 'ev_b_lianbu',   name: '莲步履', slot: 'boots', eva: 0.12, spd: 2, desc: '步步生莲之履——闪避+12% 速度+2（渡线·次级·事件专属）' },
    { id: 'ev_t_ganlu',    name: '甘露宝囊', slot: 'treasure', atk: 20, hp: 110, dr: 0.05, reflect: 0.05, desc: '甘露所凝之囊——攻+20 血+110 减伤+5% 反伤+5%（渡线·次级·事件专属）' },
    // —— 逆线 · 叛逆次级（丰富「逆」路线选择）——
    { id: 'ev_w_nilin',    name: '逆鳞刀·次', slot: 'weapon', atk: 110, hp: 40, crit: 0.04, fixAtk: 12, desc: '逆鳞所铸之刀——攻+110 血+40 暴击+4% 破甲+12（逆线·次级·事件专属）' },
    { id: 'ev_a_fentian',  name: '焚天甲', slot: 'armor', hp: 540, dr: 0.15, shieldPct: 0.07, desc: '焚天业火所锻之甲——血+540 减伤+15% 开局护盾+7%（逆线·次级·事件专属）' },
    { id: 'ev_h_xiuluo',   name: '修罗冠', slot: 'head', atk: 55, matk: 40, crit: 0.06, desc: '修罗所戴之冠——体攻+55 愿伤+40 暴击+6%（逆线·次级·事件专属）' },
    { id: 'ev_b_tahuo',    name: '踏火靴', slot: 'boots', eva: 0.13, spd: 3, desc: '踏火无痕之靴——闪避+13% 速度+3（逆线·次级·事件专属）' },
    { id: 'ev_t_yehuo',    name: '业火囊', slot: 'treasure', atk: 22, hp: 110, dr: 0.05, reflect: 0.06, lifesteal: 0.02, desc: '业火所凝之囊——攻+22 血+110 减伤+5% 反伤+6% 吸血+2%（逆线·次级·事件专属）' },
    // —— 渡线 · 善系顶级（地区 12-16 事件发放，亦可由次级+组合件/升级件合成，法伤/渡化/回血向）——
    { id: 'ev_w_jiedu',    name: '净渡锡杖', slot: 'weapon', matk: 124, hp: 50, crit: 0.05, lifesteal: 0.02, desc: '接引净渡之杖——愿伤+124 血+50 暴击+5% 吸血+2%（渡线·顶级·事件专属）' },
    { id: 'ev_a_puti',     name: '菩提金身', slot: 'armor', hp: 660, dr: 0.19, shieldPct: 0.12, mdef: 0.05, desc: '菩提树下所悟金身——血+660 减伤+19% 开局护盾+12% 法防+5%（渡线·顶级·事件专属）' },
    { id: 'ev_h_rulaizang', name: '如来藏冠', slot: 'head', matk: 88, mdef: 0.07, crit: 0.07, criMult: 0.15, desc: '如来藏性所化之冠——愿伤+88 法防+7% 暴击+7% 暴伤+15%（渡线·顶级·事件专属）' },
    { id: 'ev_b_jieyin',   name: '接引莲台靴', slot: 'boots', eva: 0.17, spd: 3, hp: 60, desc: '步步莲台接引之履——闪避+17% 速度+3 血+60（渡线·顶级·事件专属）' },
    { id: 'ev_t_bafu',     name: '八宝功德斛', slot: 'treasure', atk: 30, hp: 160, dr: 0.07, reflect: 0.08, lifesteal: 0.05, desc: '八宝功德所凝之斛——攻+30 血+160 减伤+7% 反伤+8% 吸血+5%（渡线·顶级·事件专属）' },
    // —— 逆线 · 叛逆顶级（地区 12-16 事件发放，亦可由次级+组合件/升级件合成，物攻/破甲/掠夺向）——
    { id: 'ev_w_kuanglong', name: '狂龙戟', slot: 'weapon', atk: 152, hp: 55, crit: 0.05, fixAtk: 30, armorPen: 0.06, desc: '狂龙逆鳞所铸之戟——攻+152 血+55 暴击+5% 破甲+30 无视护甲+6%（逆线·顶级·事件专属）' },
    { id: 'ev_a_mojiang',  name: '魔将玄甲', slot: 'armor', atk: 30, hp: 640, dr: 0.18, shieldPct: 0.11, desc: '魔将陨落所遗玄甲——攻+30 血+640 减伤+18% 开局护盾+11%（逆线·顶级·事件专属）' },
    { id: 'ev_h_zhanshen', name: '战神冠', slot: 'head', atk: 55, matk: 55, crit: 0.07, desc: '上古战神之冠——体攻+55 愿伤+55 暴击+7%（逆线·顶级·事件专属）' },
    { id: 'ev_b_yasha',    name: '夜叉逐风靴', slot: 'boots', eva: 0.18, spd: 4, desc: '夜叉逐风之靴——闪避+18% 速度+4（逆线·顶级·事件专属）' },
    { id: 'ev_t_panyu',    name: '盘狱炼魂铃', slot: 'treasure', atk: 34, hp: 150, dr: 0.07, reflect: 0.09, lifesteal: 0.04, desc: '盘狱炼魂之铃——攻+34 血+150 减伤+7% 反伤+9% 吸血+4%（逆线·顶级·事件专属）' }
  ];
  EVENT_GEAR.forEach((g) => { g.eventOnly = true; NDX.EQUIP_POOL.push(g); });
  // 双线事件装备由事件选项 gear 发放，打 eventOnly 标记：rollEquips 掉落/坊市彻底排除，
  // 只从事件渠道获得，杜绝"剧情专属装备混入随机掉落/商店"（V8.42 散件清理）。
  NDX.SUTRA_EVENT_GEAR.forEach((g) => { g.eventOnly = true; NDX.EQUIP_POOL.push(g); });

  // ============================================================
  // V8.50 游历散宝 · 冒险日记式超多装备组合体系
  // 三类：① 组合件(slot comp) / 升级件(slot upg) —— 喂养土地庙装备组合面板；
  //       ② 独立散宝(无 set) —— boss/精英/小怪 按概率掉落，不入套装合成线(rollEquips 天然排除)，
  //       亦可在土地庙·遗珠回流以极低概率补刷。全部 adv:true，与事件专属(eventOnly)区分。
  // 掉落档位 dropTier：low=小怪 / elite=精英 / boss=Boss。
  // ============================================================
  NDX.ADVENTURE_GEAR = [
    // —— 组合件（喂养组合面板，按 tier 分池）——
    { id: 'cmp_xuantie',  name: '玄铁锭', slot: 'comp', desc: '百炼玄铁所凝——组合件，可喂养装备进阶（初级）', adv: true, dropTier: 'low' },
    { id: 'cmp_lingyun',  name: '灵蕴珠', slot: 'comp', desc: '天地灵蕴所凝——组合件，可喂养装备进阶（中级）', adv: true, dropTier: 'elite' },
    { id: 'cmp_yaohun',   name: '妖魂核', slot: 'comp', desc: '大妖魂核所凝——组合件，可喂养装备进阶（中级）', adv: true, dropTier: 'elite' },
    { id: 'cmp_tiangong', name: '天工谱', slot: 'comp', desc: '天工巧匠遗谱——组合件，可喂养顶级装备进阶（高级）', adv: true, dropTier: 'boss' },
    // —— 升级件（喂养组合面板，升级已持装备）——
    { id: 'upg_cuiling',  name: '淬灵砂', slot: 'upg', desc: '淬炼灵砂——升级件，可将次级装备淬至更高阶', adv: true, dropTier: 'elite' },
    { id: 'upg_duanhun',  name: '锻魂玉', slot: 'upg', desc: '锻魂宝玉——升级件，可将顶级装备淬至圆满', adv: true, dropTier: 'boss' },
    // —— 独立散宝（冒险日记式，boss/精英/小怪 按概率掉落，不入套装线）——
    // 初等（小怪）
    { id: 'adv_w_lvdao',  name: '旅人短刃', slot: 'weapon', atk: 42, hp: 12, desc: '江湖旅人随身短刃——攻+42 血+12（初等·游历散宝）', adv: true, dropTier: 'low' },
    { id: 'adv_a_buyi',   name: '粗布衣',   slot: 'armor',  hp: 160, dr: 0.06, desc: '寻常粗布衣——血+160 减伤+6%（初等·游历散宝）', adv: true, dropTier: 'low' },
    { id: 'adv_b_caoxie', name: '草鞋',     slot: 'boots',  eva: 0.06, spd: 1, desc: '芒鞋踏破——闪避+6% 速度+1（初等·游历散宝）', adv: true, dropTier: 'low' },
    { id: 'adv_t_tongling', name: '铜铃',   slot: 'treasure', atk: 8, hp: 40, dr: 0.02, reflect: 0.03, desc: '风动铜铃——攻+8 血+40 减伤+2% 反伤+3%（初等·游历散宝）', adv: true, dropTier: 'low' },
    // 中等（精英）
    { id: 'adv_w_jingang', name: '精钢戒刀', slot: 'weapon', atk: 78, hp: 30, crit: 0.03, fixAtk: 8, desc: '精钢打造的戒刀——攻+78 血+30 暴击+3% 破甲+8（中等·游历散宝）', adv: true, dropTier: 'elite' },
    { id: 'adv_a_bailian', name: '百炼甲',   slot: 'armor',  hp: 380, dr: 0.12, shieldPct: 0.05, desc: '百炼成钢之甲——血+380 减伤+12% 开局护盾+5%（中等·游历散宝）', adv: true, dropTier: 'elite' },
    { id: 'adv_b_jifeng',  name: '疾风靴',   slot: 'boots',  eva: 0.11, spd: 2, desc: '疾风所化之靴——闪避+11% 速度+2（中等·游历散宝）', adv: true, dropTier: 'elite' },
    { id: 'adv_t_bixie',   name: '辟邪符',   slot: 'treasure', atk: 18, hp: 90, dr: 0.04, reflect: 0.06, lifesteal: 0.02, desc: '朱砂辟邪符——攻+18 血+90 减伤+4% 反伤+6% 吸血+2%（中等·游历散宝）', adv: true, dropTier: 'elite' },
    // 顶级（Boss）
    { id: 'adv_w_wanjun',  name: '镇妖万钧杵', slot: 'weapon', atk: 132, hp: 50, crit: 0.05, fixAtk: 28, armorPen: 0.08, desc: '镇妖之杵，重逾万钧——攻+132 血+50 暴击+5% 破甲+28 无视护甲+8%（顶级·游历散宝）', adv: true, dropTier: 'boss' },
    { id: 'adv_a_jiuzhuan', name: '九转金身甲', slot: 'armor',  hp: 680, dr: 0.20, shieldPct: 0.13, mdef: 0.05, desc: '九转金身所铸——血+680 减伤+20% 开局护盾+13% 法防+5%（顶级·游历散宝）', adv: true, dropTier: 'boss' },
    { id: 'adv_b_zhuri',   name: '逐日靴',   slot: 'boots',  eva: 0.17, spd: 4, desc: '夸父逐日之遗——闪避+17% 速度+4（顶级·游历散宝）', adv: true, dropTier: 'boss' },
    { id: 'adv_t_qiankun', name: '乾坤宝镜', slot: 'treasure', atk: 30, hp: 150, dr: 0.07, reflect: 0.10, lifesteal: 0.05, desc: '照彻乾坤之镜——攻+30 血+150 减伤+7% 反伤+10% 吸血+5%（顶级·游历散宝）', adv: true, dropTier: 'boss' },
  ];
  NDX.ADVENTURE_GEAR.forEach((g) => { NDX.EQUIP_POOL.push(g); });
  // 各档掉落池（id 取自 ADVENTURE_GEAR 的 dropTier 分类；
  //   同时混入少量事件顶级装备作为 Boss 稀有回流，强化「长事件链装备」的错过补偿）
  NDX.LOW_EQUIP_DROPS = ['adv_w_lvdao', 'adv_a_buyi', 'adv_b_caoxie', 'adv_t_tongling', 'cmp_xuantie'];
  NDX.ELITE_EQUIP_DROPS = ['adv_w_jingang', 'adv_a_bailian', 'adv_b_jifeng', 'adv_t_bixie', 'cmp_lingyun', 'cmp_yaohun', 'upg_cuiling'];
  NDX.BOSS_EQUIP_DROPS = ['adv_w_wanjun', 'adv_a_jiuzhuan', 'adv_b_zhuri', 'adv_t_qiankun', 'cmp_tiangong', 'upg_duanhun', 'upg_cuiling', 'ev_w_xingtian', 'ev_a_ruyi', 'ev_h_wufo', 'ev_b_tayun', 'ev_t_shanhe'];

  // 三尖两刃刀·完整神兵（V8.27 二郎神六部件重铸）
  // 不参与掉落池（避免战斗/宝窟污染），仅由 tryCombineSanjian 集齐 6 部件后合成授予。
  NDX.SANJIAN_FULL = {
    id: 'sanjian_full', name: '三尖两刃刀', slot: 'weapon', atk: 45, crit: 0.06,
    desc: '二郎真君六部件重铸——听调不听宣，三尖破天条（对天庭系伤害+10%，暴击+6%）'
  };
  // 六部件合成：行囊集齐 戟刃/戟脊/戟柄/神纹/哮天环/天眼石 → 移除部件、授予完整神兵。
  // 返回合成结果（null=未集齐），由调用方（事件 gear 发放后）触发。
  NDX.tryCombineSanjian = function (s) {
    if (!s || !s.equips) return null;
    const need = ['sanjian_p1', 'sanjian_p2', 'sanjian_p3', 'sanjian_p4', 'sanjian_p5', 'sanjian_p6'];
    const has = s.equips || [];
    if (!need.every((id) => has.some((e) => e.id === id))) return null;
    s.equips = has.filter((e) => need.indexOf(e.id) < 0);
    s.equips.push(Object.assign({}, NDX.SANJIAN_FULL));
    return NDX.SANJIAN_FULL;
  };

  // ============================================================
  // V8.50 游历散宝·装备组合函数（土地庙「装备组合」面板调用）
  // 仅消费 eventCombo 配方：校验背包含全部 comps（按 id，各耗 1 件），产出 out 件。
  // 产品查 NDX.lootById（EQUIP_POOL 内 558-579 已定义，无 set 故不污染 rollEquips）。
  // ============================================================
  NDX.eventComboRecipes = function () {
    return (NDX.RECIPES || []).filter((r) => r.eventCombo);
  };
  NDX.canCombine = function (s, outId) {
    if ((s.equips || []).some((e) => e.id === outId)) return false; // 已持有则不再合成，避免浪费材料
    const rs = (NDX.RECIPES || []).filter((x) => x.eventCombo && x.out === outId);
    if (!rs.length) return false;
    // 同产物可有多条配方（如·mk 既有「低装→中·锻→顶」亦有「精英原生→顶」），任一可满足即可合成
    return rs.some((r) => (r.comps || []).every((id) => (s.equips || []).some((e) => e.id === id)));
  };
  NDX.combineEquip = function (s, outId) {
    if (!s || !s.equips) return { ok: false, msg: '行囊未就绪' };
    const rs = (NDX.RECIPES || []).filter((r) => r.eventCombo && r.out === outId);
    if (!rs.length) return { ok: false, msg: '无此组合配方' };
    // 已持有同 id 产物：仅耗材料不产新（防止重复件堆积），提示回收
    if (s.equips.some((e) => e.id === outId)) {
      const r0 = rs[0];
      (r0.comps || []).forEach((id) => { const i = s.equips.findIndex((e) => e.id === id); if (i >= 0) s.equips.splice(i, 1); });
      return { ok: false, msg: (NDX.lootById(outId) || { name: outId }).name + ' 已在行囊（材料已耗）', consumed: true };
    }
    // 选首个材料齐备的配方（多配方并存时择优）
    let recipe = rs.find((r) => (r.comps || []).every((id) => (s.equips || []).some((e) => e.id === id)));
    if (!recipe) {
      // 材料不足：取已持有材料最多的配方做缺失提示
      let best = rs[0], bestHave = -1;
      rs.forEach((r) => {
        const have = (r.comps || []).filter((id) => (s.equips || []).some((e) => e.id === id)).length;
        if (have > bestHave) { bestHave = have; best = r; }
      });
      const missing = (best.comps || []).filter((id) => !(s.equips.some((e) => e.id === id)));
      const names = missing.map((id) => (NDX.lootById(id) || { name: id }).name);
      return { ok: false, msg: '材料不足：' + names.join('、'), missing: missing };
    }
    const comps = recipe.comps || [];
    const product = NDX.lootById(outId);
    if (!product) return { ok: false, msg: '组合产物未收录于装备库' };
    // 消耗材料（各 comp 一件，深拷贝避免误删同类多件）
    comps.forEach((id) => { const i = s.equips.findIndex((e) => e.id === id); if (i >= 0) s.equips.splice(i, 1); });
    const clone = Object.assign({}, product);
    s.equips.push(clone);
    if (NDX.telemetry) { try { NDX.telemetry.track('combine_equip', { out: outId }); } catch (e) {} }
    return { ok: true, out: clone, msg: '合成 ' + product.name };
  };

  // V8.51 土地庙·自动合成：循环合成所有可合成链直至稳定（级联：低装→中·锻→顶·mk 一气呵成）
  NDX.autoCombineShrine = function (s) {
    if (!s || !s.equips) return { made: [], count: 0 };
    const made = [];
    let changed = true, guard = 0;
    while (changed && guard < 60) {
      changed = false; guard++;
      const outs = {};
      (NDX.RECIPES || []).forEach((r) => { if (r.eventCombo) outs[r.out] = true; });
      for (const outId in outs) {
        if (NDX.canCombine(s, outId)) {
          const r = NDX.combineEquip(s, outId);
          if (r && r.ok) { made.push(outId); changed = true; }
        }
      }
    }
    return { made: made, count: made.length };
  };

  // V8.52→V8.53 英雄专属装备·随章节自动进阶（泛化 upgradeHeroGear）
  // 英雄专属成长链（法宝·钵/盂/珠/念珠/精箍棒 ＋ 武器/护甲·各英雄 set 专属 ch2/3/4）按 chapter(1~4) 定义成长。
  // 进入节点时调用：把英雄当前持有的低阶专属装备收敛为「当前章节对应 tier」的一件，形成“成长感”。
  //   · macth 三槽：
  //       - 法宝(slot='treasure')：e.treasure && e.owner === s.hero（与 V8.52 一致）；
  //       - 武器/护甲(slot='weapon'|'armor')：e.slot === slot && e.set === HERO_SET_NAME[s.hero]
  //         （hero 英文 key → set 中文名，单一真源 NDX.HERO_SET_NAME，achievements.js）。
  //   · 不降级：已持有 targetTier 或更高阶(如手动合成)则保持不动；
  //   · 幂等：重复调用安全；
  //   · 替换时移除所有 chapter < targetTier 的该英雄该槽专属件(含初阶)，push 一件 targetTier 满充能副本。
  // 查找源注意：成长版 ch2/3/4 有的在 CRAFT/BOSS 字典而不全在 EQUIP_POOL 动态数组，
  //   必须扫描「全量装备注册表」(EQUIP_POOL+BOSS_REWARDS+CRAFT_POOL) —— 这正是 lootById/equipById 走的那张表。
  NDX.upgradeHeroGear = function (s, slot) {
    if (!s || !s.equips || !s.hero || !slot) return null;
    const hero = s.hero;
    const targetTier = Math.min(Math.max(s.act || 1, 1), 4);
    const isTr = slot === 'treasure';
    const cn = isTr ? null : ((NDX.HERO_SET_NAME || {})[hero] || null);
    const isMatch = (e) => isTr ? (e.treasure && e.owner === hero) : (cn && e.slot === slot && e.set === cn);
    const owned = (s.equips || []).filter(isMatch);
    if (owned.some((e) => (e.chapter || 1) >= targetTier)) return null; // 已达标，不降级/幂等
    // 全量装备注册表 = EQUIP_POOL + BOSS_REWARDS + CRAFT_POOL（与 equipById 同口径）。
    const _boss = Object.values(NDX.BOSS_REWARDS || {}).reduce((a, b) => a.concat(Array.isArray(b) ? b : [b]), []);
    const registry = (NDX.EQUIP_POOL || []).concat(_boss).concat(NDX.CRAFT_POOL || []);
    const target = registry.find(
      (e) => e && isMatch(e) && (e.chapter || 1) === targetTier
    );
    if (!target) return null;
    let fromName = '', fromCh = 0;
    owned.forEach((e) => { const c = e.chapter || 1; if (c >= fromCh) { fromCh = c; fromName = e.name; } });
    for (let i = s.equips.length - 1; i >= 0; i--) {
      const e = s.equips[i];
      if (isMatch(e) && (e.chapter || 1) < targetTier) s.equips.splice(i, 1);
    }
    const clone = Object.assign({}, target);
    s.equips.push(clone);
    return { from: fromName, to: target.name, tier: targetTier };
  };
  // V8.50 按敌种分档掉落游历散宝：low=小怪 / elite=精英 / boss=Boss
  NDX.rollAdvDrops = function (tier, state, count) {
    count = count || 1;
    const _map = { low: NDX.LOW_EQUIP_DROPS, elite: NDX.ELITE_EQUIP_DROPS, boss: NDX.BOSS_EQUIP_DROPS };
    const ids = _map[tier] || [];
    const out = [];
    for (let i = 0; i < count && ids.length; i++) {
      const id = ids[NDX._rand(0, ids.length - 1)];
      const eq = NDX.lootById(id);
      if (eq) out.push(eq);
    }
    return out;
  };

  NDX.PET_EVOLUTIONS = [
    { base: 'lingyan',   baseName: '灵岩幼兽', chapter: 2, title: '灵兽进化 · 岩心生灵',
      text: '荒山石隙，幼兽蜷卧。它睁眼望你，似懂非懂——一路随行的岩气，正顺你指间叩它心窍。选其一，定它一生形状。',
      opts: [
        { text: '授以岩心 → 进化为精英【灵岩巨像】（减伤 8%·石心留存 1 点生命）', target: 'lingyan_ju' },
        { text: '任其自在 → 保留灵岩幼兽（关闭进化）', keep: true },
      ] },
    { base: 'yanlin',    baseName: '岩鳞石卫', chapter: 2, title: '灵兽进化 · 岩脉为骨',
      text: '古岩阵中，石卫肃立，岩脉的气息缓缓自地脉渗出，一层层裹上它的鳞甲。',
      opts: [
        { text: '引动岩脉 → 进化为精英【岩甲兽王】（减伤 8%·全队减伤 +4%）', target: 'yanlin_wang' },
        { text: '守其本分 → 保留岩鳞石卫（关闭进化）', keep: true },
      ] },
    { base: 'qingyuehu', baseName: '清月灵狐', chapter: 3, title: '灵兽进化 · 引月入魂',
      text: '月华如练，灵狐独立，银白的月光正一点点凝入它眉间，勾出一轮残月。',
      opts: [
        { text: '引月入魂 → 进化为精英【月影妖狐】（闪避 +12%·暴伤 +20%）', target: 'yueying' },
        { text: '纵其清冷 → 保留清月灵狐（关闭进化）', keep: true },
      ] },
    { base: 'taxue',     baseName: '踏雪灵鹿', chapter: 3, title: '灵兽进化 · 渡雪成麟',
      text: '雪落无声，灵鹿踏歌，雪花在它蹄下结成霜纹，隐隐透出祥瑞之光。',
      opts: [
        { text: '渡雪成麟 → 进化为精英【雪羽麒麟】（闪避 +10%·每回合净化负面）', target: 'xueqi' },
        { text: '随其踏雪 → 保留踏雪灵鹿（关闭进化）', keep: true },
      ] },
    { base: 'huangzhonghu', baseName: '荒冢灵狐', chapter: 4, title: '灵兽进化 · 幽光知返',
      text: '荒冢鬼火，孤狐回眸。旧日亡魂的幽火与一线佛光，同时撞进它眼底，它竟不知该往哪条路转。',
      opts: [
        { text: '纳幽淬魂 → 进化为精英【幽冥妖狐】（攻 +8%·劫力获取提升·闪避 +6%）', target: 'youming' },
        { text: '引渡亡魂 → 化鹤为精英【迦蓝灵鹤】（渡 +8·首渡化率 +20%）', target: 'jialan_he' },
        { text: '梵音护法 → 化鹤为精英【梵音灵鹤】（善 +6·全队受伤 −5%）', target: 'fanyin_he' },
        { text: '放其独行 → 保留荒冢灵狐（关闭进化）', keep: true },
      ] },
    { base: 'shilang',   baseName: '噬骨狼崽', chapter: 4, title: '灵兽进化 · 授以狼印',
      text: '荒野长啸，狼崽磨牙，莽原的野性正一下下撞在它胸腔上，眼中泛起苍黄。',
      opts: [
        { text: '授以狼印 → 进化为精英【荒原狼王】（攻 +14%·对低危敌人伤 +20%）', target: 'huangyuan' },
        { text: '纵其野性 → 保留噬骨狼崽（关闭进化）', keep: true },
      ] },
    { base: 'xunzhen',   baseName: '寻珍风狸', chapter: 5, title: '灵兽进化 · 窃天通灵',
      text: '秘窟微光，风狸探头，风与宝光在它鼻尖缠绕不休——是带走一件秘宝，还是化一缕清风而去？',
      opts: [
        { text: '启窍通灵 → 进化为精英【窃天灵貂】（幸运 +10%·每场窃敌 1 件装备）', target: 'qietian' },
        { text: '携风而行 → 进化为精英【白羽风王】（攻 +12%·暴率 +8%）', target: 'baiyu' },
        { text: '纵其贪玩 → 保留寻珍风狸（关闭进化）', keep: true },
      ] },
    { base: 'qingzhang', baseName: '清瘴萤灵', chapter: 5, title: '灵兽进化 · 引火化煌',
      text: '腐泽萤火，微光渐盛，一缕火意自萤腹悄然亮起，将四周瘴气烧成一线金边。',
      opts: [
        { text: '引火化煌 → 进化为精英【煌炎萤灵】（幸运 +12%·毒灼减免 +25%）', target: 'huangyan' },
        { text: '守其清微 → 保留清瘴萤灵（关闭进化）', keep: true },
      ] },
    { base: 'ditingyou', baseName: '谛听幼兽', chapter: 6, title: '灵兽进化 · 谛听明心', cond: 'balance',
      text: '谛听幼兽伏于听地之畔，敛息闭目，三界隐秘随地脉一层层涌来。此刻你六道心念恰好均衡如水，足以压住那万声杂音，听清它心底那一声「明」。',
      opts: [
        { text: '静听地脉 → 进化为传说【谛听】（六道 +5·每地区预览劫难走向）', target: 'diting' },
        { text: '封印听力 → 保留谛听幼兽，放弃进化（仍可上阵）', keep: true },
      ] },
    { base: 'xiaoshihou', baseName: '小石猴', chapter: 7, title: '灵兽进化 · 石猿证道',
      text: '乱石残峰，风云翻卷。那只石猴一路西行，既未被你刻意教化收敛，亦未被你放任纵逞——野性骁勇与灵秀本真，在它身上自在共生。它立于乱石之间，望向西天云海，似在叩问自身来路。',
      opts: [
        { text: '任由两气相融，促成证道 → 进化为传说【通臂石猿】（夺 +8·攻 +12%·暴伤 +40%）', target: 'tongbishiyuan' },
        { text: '顺其自然，不夺其真 → 保留小石猴本体（本局永久关闭通臂进化）', keep: true },
      ] },
    // —— V8.56 第8-9章终极二段进化：中级形态→传说终极形态 ——
    { base: 'lingyan_ju', baseName: '灵岩巨像', chapter: 8, title: '灵兽进化 · 太古山灵',
      text: '万山之根，岩心深处。灵岩巨像伏地叩首，地脉龙气自四面八方汇聚而来，一层层裹上它的石躯——它的眼中，渐渐映出太古之初那座撑天而立的山影。',
      opts: [
        { text: '引地脉入体 → 进化为传说【太古山灵】（减伤+12%·石心留存2点生命·全队减伤+6%）', target: 'taigu_shanling' },
        { text: '守岩心本分 → 保留灵岩巨像（关闭进化）', keep: true },
      ] },
    { base: 'yueying', baseName: '月影妖狐', chapter: 9, title: '灵兽进化 · 太阴星狐', cond: 'yin',
      text: '月至中天，星辉如练。月影妖狐独立于凌云渡头，月华与星辉同时灌入它眉间那轮残月——九尾渐生，狐影中隐隐透出太阴星主的清冷神威。',
      opts: [
        { text: '引太阴入魂 → 进化为传说【太阴星狐】（闪避+18%·暴伤+50%·隐道协同+10%）', target: 'taiyin_xinghu' },
        { text: '守月影清冷 → 保留月影妖狐（关闭进化）', keep: true },
      ] },
  ];

// —— V8.56 宠物协同系统：同时上阵2只特定宠物触发额外效果 ——
NDX.PET_SYNERGY = [
  { id: 'yan_shuang_wei', pair: ['lingyan_ju','yanlin_wang'], name: '岩心双卫',
    desc: '同时上阵灵岩巨像与岩甲兽王：全队减伤+8%，石心留存概率+20%',
    bonus: { drAll: 0.08, stoneheartChance: 0.20 } },
  { id: 'yue_shuang_hu', pair: ['yueying','youming'], name: '月影双幽',
    desc: '同时上阵月影妖狐与幽冥妖狐：闪避+10%，暴伤+20%，劫力获取+15%',
    bonus: { eva: 0.10, criDmg: 0.20, jieGain: 0.15 } },
  { id: 'di_tong_bi', pair: ['diting','tongbishiyuan'], name: '谛听通臂',
    desc: '同时上阵谛听与通臂石猿：六道+3，攻击+8%，每地区预览劫难走向',
    bonus: { sixDao: 3, atkPct: 0.08, previewTrial: true } },
  { id: 'xue_jia_lin', pair: ['xueqi','jialan_he'], name: '雪羽迦蓝',
    desc: '同时上阵雪羽麒麟与迦蓝灵鹤：每回合净化负面，全队受伤-8%，渡化率+15%',
    bonus: { cleanse: true, dmgTakenAll: -0.08, duRate: 0.15 } },
];
// 检查玩家是否持有某宠物协同组合的另一件
NDX.hasPetSynergy = function (state, petId) {
  if (!state || !state.equips || !NDX.PET_SYNERGY) return null;
  const ownedIds = new Set(state.equips.filter(e => e.slot === 'pet').map(e => e.id));
  for (const syn of NDX.PET_SYNERGY) {
    if (syn.pair.includes(petId)) {
      const other = syn.pair.find(id => id !== petId);
      if (ownedIds.has(other)) return syn;
    }
  }
  return null;
};
// 获取当前所有生效的宠物协同
NDX.activePetSynergies = function (state) {
  if (!state || !state.equips || !NDX.PET_SYNERGY) return [];
  const ownedIds = new Set(state.equips.filter(e => e.slot === 'pet').map(e => e.id));
  return NDX.PET_SYNERGY.filter(syn => syn.pair.every(id => ownedIds.has(id)));
};

// —— V8.56 跨系统协同：劫印+法宝 / 经文+法宝 / 劫印+宠物 / 经文+宠物 ——
NDX.CROSS_SYNERGY = [
  // === 劫印+法宝协同（4组）===
  { id: 'cs_zhan_feng', type: 'seal_treasure', seal: '战', treasure: 'bf_bihuo', name: '战风相济',
    desc: '战道劫印+芭蕉扇：攻击+15%，眩晕回合+1', bonus: { atkPct: 0.15, stunBonus: 1 } },
  { id: 'cs_du_bo', type: 'seal_treasure', seal: '渡', treasure: 'ts_bowl', name: '渡钵禅光',
    desc: '渡道劫印+紫金钵：回血+20%，善系效果+10%', bonus: { healPct: 0.20, goodBonus: 0.10 } },
  { id: 'cs_yin_ding', type: 'seal_treasure', seal: '隐', treasure: 'dingfeng', name: '隐风遁形',
    desc: '隐道劫印+定风珠：闪避+10%，护盾+10%', bonus: { eva: 0.10, shieldBonus: 0.10 } },
  { id: 'cs_ni_lian', type: 'seal_treasure', seal: '逆', treasure: 'bf_ni_lian', name: '逆莲灭世',
    desc: '逆道劫印+业火红莲：伤害+20%，斩杀线+5%', bonus: { dmgPct: 0.20, executeBonus: 0.05 } },
  // === 经文+法宝协同（4组）===
  { id: 'cs_xin_bo', type: 'sutra_treasure', sutra: 'su_full_xinjing', treasure: 'ts_bowl', name: '心经禅钵',
    desc: '心经+紫金钵：善系效果+20%，回血+15%', bonus: { goodBonus: 0.20, healPct: 0.15 } },
  { id: 'cs_jingang_gu', type: 'sutra_treasure', sutra: 'su_full_jingang', treasure: 'jingu', name: '金刚箍',
    desc: '金刚经+金箍：攻击+15%，暴击+10%', bonus: { atkPct: 0.15, crit: 0.10 } },
  { id: 'cs_nijing_lian', type: 'sutra_treasure', sutra: 'ni_full_nitian', treasure: 'bf_ni_lian', name: '逆天红莲',
    desc: '逆天录+业火红莲：恶系效果+20%，伤害+15%', bonus: { evilBonus: 0.20, dmgPct: 0.15 } },
  { id: 'cs_fahua_dai', type: 'sutra_treasure', sutra: 'su_full_fahua', treasure: 'bf_renzhongdai', name: '法华宝袋',
    desc: '法华经+人种袋：护盾+15%，减伤+10%', bonus: { shieldBonus: 0.15, dr: 0.10 } },
  // === 劫印+宠物协同（3组）===
  { id: 'cs_zhan_lang', type: 'seal_pet', seal: '战', pet: 'huangyuan', name: '战狼合击',
    desc: '战道劫印+荒原狼王：攻击+12%，对低危伤害+15%', bonus: { atkPct: 0.12, lowEnemyDmg: 0.15 } },
  { id: 'cs_du_he', type: 'seal_pet', seal: '渡', pet: 'jialan_he', name: '渡鹤双行',
    desc: '渡道劫印+迦蓝灵鹤：渡化率+20%，全队减伤+8%', bonus: { duRate: 0.20, drAll: 0.08 } },
  { id: 'cs_yin_hu', type: 'seal_pet', seal: '隐', pet: 'yueying', name: '隐狐月影',
    desc: '隐道劫印+月影妖狐：闪避+12%，暴伤+25%', bonus: { eva: 0.12, criDmg: 0.25 } },
  // === 经文+宠物协同（3组）===
  { id: 'cs_xin_fanyin', type: 'sutra_pet', sutra: 'su_full_xinjing', pet: 'fanyin_he', name: '心经梵音',
    desc: '心经+梵音灵鹤：善系效果+15%，全队受伤-8%', bonus: { goodBonus: 0.15, dmgTakenAll: -0.08 } },
  { id: 'cs_nijing_youming', type: 'sutra_pet', sutra: 'ni_full_pojie', pet: 'youming', name: '破戒幽冥',
    desc: '破戒录+幽冥妖狐：恶系效果+15%，劫力获取+20%', bonus: { evilBonus: 0.15, jieGain: 0.20 } },
  { id: 'cs_jingang_tongbi', type: 'sutra_pet', sutra: 'su_full_jingang', pet: 'tongbishiyuan', name: '金刚通臂',
    desc: '金刚经+通臂石猿：攻击+12%，暴伤+30%', bonus: { atkPct: 0.12, criDmg: 0.30 } },
];

// 检查玩家是否满足某跨系统协同
NDX.checkCrossSynergy = function (state, syn) {
  if (!state || !syn) return false;
  const ownedTreasures = new Set((state.equips||[]).filter(e => e.slot === 'treasure').map(e => e.id));
  const ownedPets = new Set((state.equips||[]).filter(e => e.slot === 'pet').map(e => e.id));
  const ownedSutras = new Set((state.sutras||state.fullSutras||[]).map(s => s.id || s));
  const activeSeals = new Set((state.seals||state.activeSeals||[]).map(s => s.key || s.dao || s));
  if (syn.type === 'seal_treasure') return activeSeals.has(syn.seal) && ownedTreasures.has(syn.treasure);
  if (syn.type === 'sutra_treasure') return ownedSutras.has(syn.sutra) && ownedTreasures.has(syn.treasure);
  if (syn.type === 'seal_pet') return activeSeals.has(syn.seal) && ownedPets.has(syn.pet);
  if (syn.type === 'sutra_pet') return ownedSutras.has(syn.sutra) && ownedPets.has(syn.pet);
  return false;
};

// 获取当前所有生效的跨系统协同
NDX.activeCrossSynergies = function (state) {
  if (!state || !NDX.CROSS_SYNERGY) return [];
  return NDX.CROSS_SYNERGY.filter(syn => NDX.checkCrossSynergy(state, syn));
};

// 计算所有协同（法宝共鸣+宠物协同+跨系统协同）的总加成
NDX.totalSynergyBonus = function (state) {
  const bonus = { atkPct:0, healPct:0, dmgPct:0, eva:0, crit:0, criDmg:0, dr:0, drAll:0, shieldBonus:0, stunBonus:0, executeBonus:0, goodBonus:0, evilBonus:0, duRate:0, jieGain:0, lowEnemyDmg:0, dmgTakenAll:0, sixDao:0, previewTrial:false, cleanse:false, stoneheartChance:0 };
  // 法宝共鸣
  (NDX.TREASURE_SYNERGY||[]).forEach(syn => {
    const owned = new Set((state.equips||[]).filter(e => e.slot === 'treasure').map(e => e.id));
    if (syn.pair && syn.pair.every(id => owned.has(id)) && syn.bonus) {
      for (const k in syn.bonus) bonus[k] = (bonus[k]||0) + syn.bonus[k];
    }
  });
  // 宠物协同
  (NDX.activePetSynergies(state)||[]).forEach(syn => {
    if (syn.bonus) for (const k in syn.bonus) bonus[k] = (bonus[k]||0) + syn.bonus[k];
  });
  // 跨系统协同
  (NDX.activeCrossSynergies(state)||[]).forEach(syn => {
    if (syn.bonus) for (const k in syn.bonus) bonus[k] = (bonus[k]||0) + syn.bonus[k];
  });
  return bonus;
};

  // 六道数值键（渡/逆/缘/战/夺/隐），用于谛听·六道均衡判定（任意两项差 ≤6 且全部 ≥0）
  NDX.SIX_DAO_KEYS = ['渡', '逆', '缘', '战', '夺', '隐'];
  NDX.sixDoubtBalanced = function (s) {
    const f = (s && s.fate) || {};
    const vals = NDX.SIX_DAO_KEYS.map((k) => f[k] || 0);
    if (vals.some((v) => v < 0)) return false;
    return (Math.max.apply(null, vals) - Math.min.apply(null, vals)) <= 6;
  };

  // 某进化条目的附加条件是否满足
  NDX.petEvolCondOk = function (s, ev) {
    if (ev.cond === 'balance') return NDX.sixDoubtBalanced(s);
    if (ev.cond === 'yin') {
      const f = (s && s.fate) || {};
      return (f['隐'] || 0) >= 8;  // 隐道属性≥8 可触发太阴星狐进化
    }
    return true;
  };

  // 判定当前章节「可触发」的进化本体（须持有、未关闭、未已进化）
  NDX.petEvolEligible = function (s, act) {
    const held = {};
    (s && s.equips || []).forEach((e) => { if (e && e.id) held[e.id] = true; });
    const closed = (s && s.petEvolClosed) || {};
    return (NDX.PET_EVOLUTIONS || []).filter((ev) => {
      if (ev.chapter !== act || !held[ev.base] || closed[ev.base]) return false;
      // 本体已进化为任一目标形态 → 不再刷
      return !(ev.opts || []).some((o) => o.target && held[o.target]);
    });
  };

  // 将 petEvolutes 描述转成事件对象（opts 各带 effect，走既有 event 结算链路）
  NDX.petEvolToEvent = function (s, ev) {
    const opts = (ev.opts || []).map((o) => {
      if (o.target) {
        return { text: o.text, effect: { upgrade: { from: ev.base, to: o.target } } };
      }
      return { text: o.text, effect: { petEvolClose: ev.base } };
    });
    return { title: ev.title, text: ev.text, opts };
  };

  // 问号(?)节点：按约 35% + 保底(持有满 2 个该章节点) 判定是否刷出本体进化劫难
  NDX.rollPetEvolution = function (s, act, rng) {
    if (!s) return null;
    const rand = rng || function () { return Math.random(); };
    const eligible = NDX.petEvolEligible(s, act);
    if (!eligible.length) return null;
    s.petEvolPity = s.petEvolPity || {};
    let chosen = null;
    for (const ev of eligible) {
      if (!NDX.petEvolCondOk(s, ev)) continue;
      const n = (s.petEvolPity[ev.base] || 0) + 1;
      s.petEvolPity[ev.base] = n;   // 每过一个该章节点，其保底计数 +1
      if (!chosen && (n >= 2 || rand() < 0.35)) chosen = ev;
    }
    if (!chosen) return null;
    s.petEvolPity[chosen.base] = 0;
    return NDX.petEvolToEvent(s, chosen);
  };

  // 当前章节（兼容纯列表入参与装备栏传入的 state/ctx）
  NDX._actOf = function (ctx) {
    if (ctx && ctx.act) return ctx.act;
    if (NDX.game && NDX.game.state && NDX.game.state.act) return NDX.game.state.act;
    return 1;
  };

  // 装备归属类型：gear(非宠非法宝) / pet / treasure / component(套装组件·包裹生效)
  NDX._equipKind = function (e) {
    if (e.slot === 'pet') return 'pet';
    if (e.slot === 'treasure') return 'treasure';
    if (e.slot === 'component') return 'component';
    return 'gear';
  };

  // 单槽评分：quality(等阶)最优先，再按数值合计（用于无手动标记时的默认择优）
  NDX._equipScore = function (e) {
    if (!e) return -1;
    return (e.quality || 0) * 1e6 +
      (e.atk || 0) + (e.hp || 0) + (e.matk || 0) +
      (e.mdef || 0) * 3 + (e.dr || 0) * 120 + (e.eva || 0) * 80 +
      (e.cri || 0) * 120 + (e.maxhp || 0) * 0.2 + (e.fixAtk || 0) + (e.fixMatk || 0) +
      // V8.44 事件装备专属机制词计入评分：无视护甲/护盾/反伤/吸血/暴伤/速度
      (e.shieldPct || 0) * 200 + (e.reflect || 0) * 150 + (e.armorPen || 0) * 250 +
      (e.criMult || 0) * 100 + (e.lifesteal || 0) * 200 + (e.spd || 0) * 30;
  };

  // 该类别的装备栏上限
  NDX.slotCapForKind = function (ctx, kind) {
    const act = NDX._actOf(ctx);
    if (kind === 'pet') return NDX.petSlotCapFor(ctx);
    if (kind === 'treasure') return NDX.treasureSlotCap(act);
    if (kind === 'component') return 0; // 套装组件不占装备栏：包裹中持有即生效
    // 身体装备：按槽位各 1 格（兵刃/甲胄/头冠/战靴 · 一一对应），不再「混合取前 N」
    return (NDX.GEAR_SLOTS && NDX.GEAR_SLOTS.length) || NDX.gearSlotCap || 4;
  };

  // 从该类型候选里取「生效」前 N 件：active=true(手动锁定) 优先，其次按评分自动择优；manualOff 排除
  NDX._pickActiveN = function (items, cap, scoreFn) {
    const cand = (items || []).map((e) => ({ e, sc: scoreFn ? scoreFn(e) : 0 }));
    const locked = cand.filter((o) => o.e.active === true).sort((a, b) => b.sc - a.sc);
    const auto = cand.filter((o) => o.e.active !== true && o.e.manualOff !== true).sort((a, b) => b.sc - a.sc);
    const out = [];
    for (const o of locked) { if (out.length >= cap) break; out.push(o.e); }
    for (const o of auto) { if (out.length >= cap) break; out.push(o.e); }
    return out;
  };

  // 当前生效装备：装备/灵宠/法宝按各自格数取生效件（compat：可传 s / {equips,act} / 纯数组）
  NDX.activeEquipsFor = function (ctx) {
    const list = (ctx && ctx.equips) || ctx || [];
    const actCtx = NDX._actOf(ctx);
    // 身体装备四格：每个槽位（兵刃/甲胄/头冠/战靴）各取最高评分 1 件（active 手动锁定优先，manualOff 弃权）
    const gear = [];
    (NDX.GEAR_SLOTS || ['weapon', 'armor']).forEach((sl) => {
      const one = NDX._pickActiveN(list.filter((e) => e && e.slot === sl), 1, NDX._equipScore);
      if (one.length) gear.push(one[0]);
    });
    const pets = NDX._pickActiveN(list.filter((e) => e && e.slot === 'pet'), NDX.petSlotCapFor(ctx), NDX._equipScore);
    const treas = NDX._pickActiveN(list.filter((e) => e && e.slot === 'treasure'), NDX.treasureSlotCap(actCtx), NDX._equipScore);
    return gear.concat(pets).concat(treas);
  };

  // 该装备是否当前生效（按槽位判定：身体装备四格各自取 1 件，避免全局取前 N 造成「空槽也算生效」）
  NDX.isEquipActive = function (s, id) {
    const e = (s.equips || []).find((x) => x.id === id);
    if (!e) return false;
    return NDX.activeEquipsFor(s).some((x) => x === e || x.id === e.id);
  };

  // 装备栏内切换：穿戴 / 卸下（respect 该类别的槽位上限）
  NDX.toggleEquipActive = function (s, id) {
    const e = (s.equips || []).find((x) => x.id === id);
    if (!e) return { ok: false, reason: '无此装备' };
    const kind = NDX._equipKind(e);
    const cap = NDX.slotCapForKind(s, kind);
    if (NDX.isEquipActive(s, id)) {
      // 撤下：取消手动锁定，并标记手动放弃，避免又被自动择优选回
      e.active = false; e.manualOff = true;
      return { ok: true, e, on: false, cap };
    }
    e.manualOff = false;
    const same = NDX.activeEquipsFor(s).filter((x) => x.slot === e.slot);
    if (kind === 'gear') {
      // 身体装备四格（兵刃/甲胄/头冠/战靴）槽内各 1 格：点任一可装项即「替换当前占用者」，
      // 避免「装备栏已满，请先卸下一件」阻断换装——点选即换身上装，直觉达成。
      for (const occ of same) { occ.active = false; occ.manualOff = false; }
    } else if (same.length >= cap) {
      // 装备栏已满时，自动卸下评分最低的非手动锁定项，腾出空位给新激活项
      // （与身体装备「点选即换」逻辑一致，避免「请先撤下一件」阻断操作）
      const scored = same.map((x) => ({ x, sc: NDX._equipScore(x) })).sort((a, b) => a.sc - b.sc);
      const victim = scored.find((o) => o.x.active !== true); // 优先撤下非手动锁定项
      if (victim) {
        victim.x.active = false;
        victim.x.manualOff = true; // 标记手动放弃，避免又被自动择优选回
      } else {
        // 所有生效项都是手动锁定的，无法自动撤下
        return { ok: false, reason: (NDX.EQUIP_SLOT_LABEL[e.slot] || '该类别') + '装备栏已满（所有穿戴项均已手动锁定，请先手动卸下一件）', cap };
      }
    }
    e.active = true;
    return { ok: true, e, on: true, cap };
  };

  // 六道套装隐藏职升级石（道具）：第一难六道抉择后发放，作为唤醒隐藏职的资格凭证。
  // 普通合成的组件1/2/3不会自动触发隐藏职，必须持有对应升级石。
  [
    { id: 'xw_stone', name: '玄武升级石', slot: 'component', desc: '渡道套装之枢。持有方可唤醒玄武隐藏职；组件镇海灵/魂/神仅在有此石时生效。', set: '玄武', chapter: 1, quality: 2, jobStone: true },
    { id: 'tl_stone', name: '贪狼升级石', slot: 'component', desc: '缘道套装之枢。持有方可唤醒贪狼隐藏职；组件聚灵/凝魂/天狼仅在有此石时生效。', set: '贪狼', chapter: 1, quality: 2, jobStone: true },
    { id: 'pw_stone', name: '破军升级石', slot: 'component', desc: '战道套装之枢。持有方可唤醒破军隐藏职；组件聚锋/裂阵/弑神仅在有此石时生效。', set: '破军', chapter: 1, quality: 2, jobStone: true },
    { id: 'yd_stone', name: '影遁升级石', slot: 'component', desc: '隐道套装之枢。持有方可唤醒影遁隐藏职；组件无痕/遁空/归墟仅在有此石时生效。', set: '影遁', chapter: 1, quality: 2, jobStone: true },
    { id: 'nm_stone', name: '逆命升级石', slot: 'component', desc: '逆道套装之枢。持有方可唤醒逆命隐藏职；组件逆乱/逆天/大道崩仅在有此石时生效。', set: '逆命', chapter: 1, quality: 2, jobStone: true },
    { id: 'tt_stone', name: '饕餮升级石', slot: 'component', desc: '夺道套装之枢。持有方可唤醒饕餮隐藏职；组件吞金/噬宝/吞天仅在有此石时生效。', set: '饕餮', chapter: 1, quality: 2, jobStone: true },
  ].forEach((e) => NDX.EQUIP_POOL.push(e));

  // 装备统一标签（供搜索/筛选/分类显示）——SET_SYS/_tagSys 定义在 data.js
  NDX._tagSys(NDX.EQUIP_POOL);
  NDX._tagSys(NDX.CRAFT_POOL);
  NDX._tagSys(NDX.RECIPES);
  NDX._tagSys(NDX.BOSS_REWARDS);
  NDX._tagSys(NDX.TREASURES);
})();
