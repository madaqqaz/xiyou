// =============================================================
// equipment_part1.js - 装备系统（第一部分：装备池/合成池）
// 从 equipment.js 拆分，独立IIFE结构，可独立加载
// 外部接口 NDX.* 保持不变，调用方无需修改
// 拆分日期: 2026-09-14
// =============================================================

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
  // ===== V9.9 心魔隐藏线·明镜套（仅由「镜痕」材料合成，绝不进随机掉落；noDrop 为守卫标记） =====
  //   镜痕唯一来源 = 心魔镜本我战取胜；战败不给（防刷）。故本套 = 「敢直面心魔者」的专属 reward。
  { id: 'mj_w', name: '明镜·照心剑', slot: 'weapon', atk: 150, hp: 60, crit: 0.06, armorPen: 0.08, set: '明镜', setTier: 2, chapter: 3, noDrop: true, desc: '攻+150 血+60 暴击+6% 无视护甲+8%（明镜套·由镜痕熔铸）' },
  { id: 'mj_a', name: '明镜·无尘甲', slot: 'armor', hp: 640, dr: 0.16, shieldPct: 0.08, mdef: 0.06, set: '明镜', setTier: 2, chapter: 3, noDrop: true, desc: '血+640 减伤+16% 开局护盾+8% 法防+6%（明镜套·由镜痕熔铸）' },
  { id: 'mj_h', name: '明镜·破妄冠', slot: 'head', matk: 76, mdef: 0.08, crit: 0.05, set: '明镜', setTier: 2, chapter: 3, noDrop: true, desc: '愿伤+76 法防+8% 暴击+5%（明镜套·由镜痕熔铸）' },
  { id: 'mj_b', name: '明镜·踏影履', slot: 'boots', eva: 0.16, spd: 3, hp: 120, set: '明镜', setTier: 2, chapter: 3, noDrop: true, desc: '闪避+16% 速度+3 血+120（明镜套·由镜痕熔铸）' },
  { id: 'mj_t', name: '明镜·观心台', slot: 'treasure', atk: 30, hp: 180, dr: 0.06, reflect: 0.09, lifesteal: 0.04, set: '明镜', setTier: 2, chapter: 3, noDrop: true, desc: '攻+30 血+180 减伤+6% 反伤+9% 吸血+4%（明镜套·由镜痕熔铸）' },
  { id: 'mj_stone', name: '明镜升级石', slot: 'component', atk: 0, hp: 0, set: '明镜', setTier: 2, chapter: 3, component: true, noDrop: true, desc: '镜痕凝就的石心。持之方可唤醒【照镜人·明心见性】（由镜痕×2 熔铸）' },
  { id: 'mj_comp1', name: '明镜·照心', slot: 'component', atk: 0, hp: 0, set: '明镜', setTier: 2, chapter: 3, component: true, compTier: 1, noDrop: true, desc: '明镜三件熔铸的套装灵性。包裹中生效：激活【照镜人·明心见性】（攻+30 血+300 减伤+5% 闪避+5%，且心魔越高攻越高）' },
];

// 合成配方：
//  - 类型A（base+material）：劫难固定宝物 + 其专属材料 → T1 单件（必可合成）
//  - 类型B（套装三合一 set）：集齐同一套装的三件 T1 基座 → 铸成 T2 套装成品（拼图式收集）

})();
