// =============================================================
// data_trials.js — 《逆道西行》隐藏转职数据 · HIDDEN_JOBS/HIDDEN_TRIAL_REQ + 命数工具
// 从 data.js 拆分（2026-08-31）：独立维护隐藏转职数据与命数工具
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================

// ============ 隐藏转职速查（首次通关后激活）============
// 合并原 NDX.HIDDEN_JOBS（如有）与剧情库新增项：八戒转正(trial 14/69)、小白龙倒序转正(trial 59)
// 供 game.js 在难号节点结算时校验 cond 触发隐藏职业。cond 为剧情库 hidden.cond 文本，判定逻辑在 game.js。
NDX.HIDDEN_JOBS = (function (prev) {
  // effect.bonus : 隐藏职基础数值加成（进入 computeStats，叠加不替换原英雄基础）
  // effect.passive: 隐藏职新增被动钩子（进入 calcCombat，与英雄原 passive 合并叠加）
  //   buddha_def  : 受击按承伤比例反震（取经人弃经·反震6%）
  //   reverseScale: 残血叠攻（每损失10%气血攻击+3%，上限+30%）+ 免疫一次致命暴击
  //   empty       : 每次出手 X 概率「空」——本次攻击无视防御与减伤（绝对穿透）
  //   glutton     : 每场开局获 maxHp*X 饱食护盾，且每次受击回血 2%（恶≥20 护盾+5%）
  //   restored    : 反震比例由英雄原 mReflect 提升，且每场首次受击免伤 20%
  const add = {
    tangseng: [
      { trial: 1, cond: '逆 + 紫金钵', job: '弃经金蝉', held: ['ts_bowl'],
        chainId: 'ts_jinchan', chainStep: 1, nextJob: '定风金蝉',
        effect: { bonus: { ti: { hp: 200, dr: 0.08, mdef: 0.06 }, good: 10 }, passive: { buddha_def: 0.06 } } },
      // 原著地理重排（2026-09-01）：弃经者原 trial 27(女儿国王) → 38(女王招亲)
      { trial: 39, cond: '逆 + 紫金钵 + 善≥20', job: '弃经者', held: ['ts_bowl'],
        chainId: 'ts_jinchan', chainStep: 5, nextJob: '金蝉·谕经',
        effect: { bonus: { yuan: { matk: 30 } }, passive: { mercy: 0.05 } } },
      // V41.1 六道联动新增：隐·判官金蝉（难61 隐雾梅花，需隐≥3 + 索命簿残卷素材）
      { trial: 61, cond: '隐 + 隐≥3 + 索命簿残卷', job: '判官金蝉', held: [],
        chainId: 'ts_jinchan', chainStep: 7, chainTail: true,
        effect: { bonus: { yuan: { matk: 35, mdef: 0.08 } }, passive: { restored: true } },
        note: '断人生死，替天行道' },
      // V41.1 六道联动新增：缘·金蝉了缘（难19 五庄观人参，需缘≥3）
      { trial: 19, cond: '缘 + 缘≥3', job: '金蝉了缘', held: [],
        chainId: 'ts_jinchan', chainStep: 3, nextJob: '车迟·谕道',
        effect: { bonus: { yuan: { matk: 30, mdef: 0.06 }, good: 15 }, passive: { mercy: 0.06 } },
        note: '缘了缘续，因果自了' },
      // 【A9 骨架·第42-46难女儿国】取经人携来福同队触发的特殊职（原为零门槛空壳，本次补注册）
      { trial: 43, cond: '取经人+来福在队', job: '女儿国·双随从', held: [],
        hint: '取经人携来福同入女儿国——双随从之情，缘法自见',
        effect: { bonus: { ti: { hp: 60 }, yuan: { matk: 20 } }, passive: { mercy: 0.04 } },
        note: '取经人与来福同队，双随从之缘（骨架 A9 女儿国特殊对话）' }
    ],
    wukong: [
      // V41.1 六道联动新增：战·斗战明王（难9 两界山·鹰愁涧，需战≥3）
      { trial: 9, cond: '战 + 战≥3 + 战x3', job: '斗战明王', held: [],
        effect: { bonus: { ti: { atk: 35, cri: 0.06 } }, passive: { empty: 0.10 } },
        note: '以战正道，战意化刃' },
      // 原著地理重排：悟空的空 原 trial 16(白骨三戏) → 20(白骨三戏)
      // 【持棒者链·第1节】chainId:'wk_chibang' —— 链序：悟空的空(20)→圣婴折服(31)→悟空的棒(41)
      //   →悟空的镜(46)→鹏翼之悟(64)→悟空的嗅(75)→持棒证道(81)。链尾为悟空终极隐藏职。
      { trial: 20, cond: '第3打选渡 + 救命毫毛', job: '悟空的空', held: ['jiuming'],
        chainId: 'wk_chibang', chainStep: 1, nextJob: '圣婴折服',
        effect: { bonus: { ti: { atk: 30, spd: 2 } }, passive: { empty: 0.12 } } },
      // 原著地理重排：齐天残念 原 trial 22(紧箍咒灵) → 21(贬退心猿)
      { trial: 21, cond: '逆 + 紧箍 + 夺宝≥1', job: '齐天残念', held: ['jingu_shu'],
        effect: { bonus: { ti: { atk: 15 } }, passive: { empty: 0.08 } } },
      // 原著地理重排：齐天·大圣 原 trial 29(六耳猕猴) → 45(真假美猴王)
      { trial: 45, cond: '逆 + 紧箍 + 夺宝≥1', job: '齐天·大圣', held: ['liuer'],
        effect: { bonus: { ti: { atk: 40, spd: 3 } }, passive: { empty: 0.15, sunder: 0.05 } } },
      // V41.1 六道联动新增：隐·白衣渡客（原难36 盘丝吐丝 → 重排后难34 冰河渡难，需隐≥3）
      { trial: 34, cond: '隐 + 隐≥3 + 隐x3', job: '白衣渡客', held: [],
        effect: { bonus: { ti: { spd: 4, eva: 0.06 } }, passive: { empty: 0.08 } },
        note: '白衣渡尽，不着一物' },
      // 【持棒者链·第2节】红孩儿逆收、未催法宝——以力服妖
      { trial: 31, cond: '逆 + 未用法宝', job: '圣婴折服', held: [],
        chainId: 'wk_chibang', chainStep: 2, nextJob: '悟空的棒',
        hint: '红孩儿逆收、未催法宝——以力服妖',
        effect: {bonus: {ti: {atk: 15, hp: 80}}, passive: {sunder: 0.05}},
        note: '红孩儿逆收、未催法宝——以力服妖' },
      // 【持棒者链·第3节】金兜山纯凭实力折服青牛、不借法宝——棒下无宝
      { trial: 41, cond: '逆 + 未用法宝', job: '悟空的棒', held: [],
        chainId: 'wk_chibang', chainStep: 3, nextJob: '悟空的镜',
        hint: '金兜山纯凭实力折服青牛、不借法宝——棒下无宝',
        effect: {bonus: {ti: {atk: 30}}, passive: {empty: 0.14}},
        note: '金兜山纯凭实力折服青牛、不借法宝——棒下无宝' },
      // 【持棒者链·第4节】六耳终局择「逆」、持紧箍——镜里镜外，都是俺老孙
      { trial: 46, cond: '逆 + 紧箍', job: '悟空的镜', held: ['jingu_shu'],
        chainId: 'wk_chibang', chainStep: 4, nextJob: '鹏翼之悟',
        hint: '六耳终局择「逆」、持紧箍——镜里镜外，都是俺老孙',
        effect: {bonus: {ti: {atk: 35, spd: 2}}, passive: {empty: 0.16}},
        note: '六耳终局择「逆」、持紧箍——镜里镜外，都是俺老孙' },
      // 【持棒者链·第5节】割大鹏翅、持大鹏翅膀——一翅九万里，你比它还快
      { trial: 64, cond: '夺 + 大鹏翅膀', job: '鹏翼之悟', held: [],
        chainId: 'wk_chibang', chainStep: 5, nextJob: '悟空的嗅',
        hint: '割大鹏翅、持大鹏翅膀——一翅九万里，你比它还快',
        effect: {bonus: {ti: {spd: 4, eva: 0.06}}},
        note: '割大鹏翅、持大鹏翅膀——一翅九万里，你比它还快' },
      // 【持棒者链·第6节】夺九灵之力、纯凭实力不借法宝——以鼻嗅真，方得本命
      { trial: 75, cond: '夺 + 未请救兵', job: '悟空的嗅', held: [],
        chainId: 'wk_chibang', chainStep: 6, nextJob: '持棒证道',
        hint: '夺九灵之力、纯凭实力不借法宝——以鼻嗅真，方得本命',
        effect: {bonus: {ti: {atk: 20, cri: 0.05}}, passive: {empty: 0.15}},
        note: '夺九灵之力、纯凭实力不借法宝——以鼻嗅真，方得本命' },
      // 【持棒者链·第7节】灵山择「逆」、纯凭实力折服阿傩迦叶、不借法宝——棒下见真佛
      { trial: 81, cond: '逆 + 未用法宝', job: '持棒证道', held: [],
        chainId: 'wk_chibang', chainStep: 7, chainTail: true,
        hint: '灵山择「逆」、纯凭实力折服阿傩迦叶、不借法宝——棒下见真佛',
        effect: {bonus: {ti: {atk: 50, hp: 200, dr: 0.06}}, passive: {empty: 0.2, sunder: 0.08}},
        note: '灵山择「逆」、纯凭实力折服阿傩迦叶、不借法宝——棒下见真佛' }
    ],
    bajie: [
      // 8.11《五人隐藏专职明细》：八戒主隐藏职 = 第24难·平顶山宝「逆 + 净坛宝盂」（原第18难，重排后 18→24）
      { trial: 24, cond: '逆 + 净坛宝盂', job: '吞天净坛', held: ['bj_bowl'],
        chainId: 'bj_tianpeng', chainStep: 2, nextJob: '天蓬复称',
        effect: { bonus: { ti: { hp: 250, dr: 0.05, atk: 10 } }, passive: { glutton: 0.15 } },
        note: '吞食万物，饱食成盾' },
      // 原著地理重排：天蓬复称 原 trial 69(乌鸡假王·返程) → 25(乌鸡井龙，立新王标记补于该难逆选项)
      { trial: 25, cond: '逆 + 扶新王', job: '天蓬复称', held: ['bj_bowl'],
        chainId: 'bj_tianpeng', chainStep: 3, nextJob: '车迟·力士',
        effect: { bonus: { ti: { hp: 300, dr: 0.06, atk: 15 } }, passive: { glutton: 0.20 } },
        note: '重称天蓬，倒海翻江' },
      // 2026-09-01 八戒·血反伤路线（渡道·善≥30，难23 黑松林失）：与吞天/天蓬（逆道·血防攻吞食）形成 2 条路线
      { trial: 23, cond: '渡 + 善≥30', job: '天蓬·负岳', held: [],
        chainId: 'bj_tianpeng', chainStep: 1, nextJob: '吞天净坛',
        effect: { bonus: { ti: { hp: 250, dr: 0.06 } }, passive: { mReflect: 0.25 } },
        note: '以背承山，以伤还伤' }
    ],
    xiaobailong: [
      { trial: 6, cond: '逆 + 避水珠', job: '逆鳞白龙', held: ['bis_an'],
        chainId: 'xbl_longzi', chainStep: 1, nextJob: '龙太子归',
        effect: { bonus: { ti: { atk: 20, cri: 0.04, eva: 0.05 } }, passive: { reverseScale: true } } },
      // 原著地理重排：龙太子归 原 trial 59(返程) → 9(鹰愁涧收白龙，缘选项补 避水珠·化龙 treasure)
      { trial: 9, cond: '助讨龙筋 + 闪避≥阈值', job: '龙太子归', held: ['bis_shui_hua'],
        chainId: 'xbl_longzi', chainStep: 2, nextJob: '白龙·御水',
        effect: { bonus: { ti: { atk: 25, cri: 0.05 } }, passive: { reverseScale: true, criBonus: 0.05 } } },
      // V41.1 六道联动新增：夺·夺宝龙子（原难61 黑风开箱 → 重排后难29 三妖赌胜，需夺≥3）
      { trial: 29, cond: '战 + 战≥2 + 夺宝≥1', job: '夺宝龙子', held: [],
        chainId: 'xbl_longzi', chainStep: 4, nextJob: '白龙·渡河',
        effect: { bonus: { ti: { atk: 25, cri: 0.05, eva: 0.04 } }, passive: { reverseScale: true } },
        note: '龙的宝，迟早游回龙手里' },
      // 2026-09-01 小白龙·血防路线（隐道·隐≥3，难26 黑水鼍龙）：与攻击残血系形成 2 条路线
      { trial: 26, cond: '隐 + 隐≥3 + 隐x3', job: '白龙·御水', held: [],
        chainId: 'xbl_longzi', chainStep: 3, nextJob: '夺宝龙子',
        effect: { bonus: { ti: { hp: 200, dr: 0.06, eva: 0.05 } }, passive: { restored: true } },
        note: '御水成甲，潜渊自守' }
    ],
    shaseng: [
      // 原著地理重排：卷帘复权 原 trial 14(流沙河收沙僧) → 17(流沙河收沙僧)【2026-09-14 注册审计：与 HIDDEN_TRIAL_REQ.shaseng=[17,...] 对齐】
      { trial: 17, cond: '渡 + 善≥30', job: '卷帘复权', held: ['ss_bowl'],
        chainId: 'ss_juanlian', chainStep: 2, nextJob: '沙·问渡',
        effect: { bonus: { ti: { hp: 150, dr: 0.04, mdef: 0.05 } }, passive: { restored: true } } },
      // 原著地理重排：卷帘镇妖 原 trial 63(流沙数颅·返程) → 16(流沙九颅，问九世因标记补于该难逆选项)
      { trial: 16, cond: '问九世因 + 降妖念珠', job: '卷帘镇妖', held: ['ss_bowl'],
        chainId: 'ss_juanlian', chainStep: 1, nextJob: '卷帘复权',
        effect: { bonus: { ti: { hp: 200, dr: 0.05, mdef: 0.06 } }, passive: { restored: true, mReflectBoost: 0.10 } } },
      // V41.1 六道联动新增：夺·卷帘夺宴（难65 金平犀灯，需夺≥3）
      { trial: 65, cond: '夺 + 夺≥3 + 夺宝≥2', job: '卷帘夺宴', held: [],
        chainId: 'ss_juanlian', chainStep: 6, chainTail: true,
        effect: { bonus: { ti: { hp: 180, dr: 0.05 } }, passive: { glutton: 0.12 } },
        note: '夺他人之宴，喂自己之腹' }
    ],
    all: [
      // 原著地理重排：六耳·残 原 trial 39(金翅大鹏雕) → 58(狮驼尸山·如来收鹏)
      { trial: 58, cond: '逆 + 第29难曾选逆', job: '六耳·残', held: ['liuer'],
        effect: { bonus: { ti: { atk: 20, cri: 0.05 } }, passive: { empty: 0.10 } },
        note: '解锁隐藏第四人·六耳可参战' },
      // 8.11《81难全文》第81难：真·逆道结局解锁全英雄终极隐藏职
      { trial: 81, cond: '逆 + 真·逆道结局', job: '真·逆道', held: [],
        effect: { bonus: { ti: { hp: 300, atk: 30, dr: 0.08 } }, passive: { empty: 0.15, glutton: 0.15, restored: true, reverseScale: true } },
        note: '逆道之极：全英雄终极隐藏职' },
      // 驯兽师·百兽归心（难64 竹节九狮 收九灵为御兽）：全英雄级，凭「收服随从 ＋ 御兽套」觉醒。
      //   🔴 A2 修死锁（2026-09-25 用户拍板「开工」）：原门槛「**出阵灵兽≥3**」与「宠物初始仅 2 格」
      //   构成**循环依赖**（要先觉醒才有 6 格，而觉醒又要求出阵 3 只）→ 改为「**随从≥3**」（累计收服，
      //   不要求出阵）。⚠ 2026-09-26：effect 原为 `{}` 空壳（只靠 note 描述，数值全无）→ 补 bonus，
      //   与 note「百兽归心」对应；宠物格 2→6 由 JOB_PET_SLOT 注册表承载（不重复叠加）。
      { trial: 64, cond: '夺 + 随从≥3 + 御兽套', job: '驯兽师·百兽归心', held: [],
        effect: { bonus: { ti: { hp: 200, dr: 0.05 }, yuan: { atk: 15 } } },
        note: '收九灵为御兽——宠物格 2→6，上阵灵兽越多全属性越强（御兽套共鸣）；随从可三阶炼化' },
      // 逆兽师·百逆归心（难64 竹节九狮 逆道变体）：承「逆」道之驯兽隐藏职，与驯兽师(夺)同源异道。
      //   同 A2 修死锁：门槛「随从≥3」。⚠ 2026-09-26：effect 原为 `{}` 空壳 → 补 bonus；
      //   「额外出战位 +1」与「御兽套 perPet ×1.5」已收归 JOB_PET_SLOT / JOB_TREASURE_SYNERGY 注册表。
      { trial: 64, cond: '逆 + 随从≥3 + 御兽套', job: '逆兽师·百逆归心', held: [],
        effect: { bonus: { ti: { hp: 220, atk: 25, dr: 0.04 }, yuan: { atk: 15 } } },
        note: '逆道驯兽，逆修之兽更凶（额外出战位 ＋ 御兽逆道增幅）；随从可三阶炼化' },
      // —— 参照「冒险日记事件装备体系」新增的特殊隐藏职（六道平衡 2026-09-12）——
      // 条件以「日记装备≥N」为凭证：日记里记载的事件专属奇物收集越多，越可触达。
      // ⚠ 2026-09-26 修正：不再是「id 以 ev_ 开头」——经文双线 21 件（jade_vase/sanjian_p1..6 等）
      //   同为事件专属却无前缀，按旧约定会被漏计。判定改走 NDX.isDiaryEquip（见 equipment_part3.js）。
      // 补足此前缺隐藏职的章节：act3(难13)/act12(难50)/act16(难77)，并 enrichment act15(难66)。
      { trial: 13, cond: '渡 + 日记装备≥1', job: '定风金蝉', hero: 'tangseng', held: [],
        chainId: 'ts_jinchan', chainStep: 2, nextJob: '金蝉了缘',
        effect: { bonus: { ti: { hp: 60, eva: 0.10 }, yuan: { dr: 0.03 } } },
        note: '缘路拾奇，风不能迷其眼（参照冒险日记·事件奇物门槛）' },
      { trial: 50, cond: '夺 + 日记装备≥3', job: '九头·掠宝', hero: 'wukong', held: [],
        effect: { bonus: { ti: { atk: 25, dr: 0.04 }, passive: { glutton: 0.10 } } },
        note: '逆夺九虫佛宝，日记载其名（夺道+日记奇物门槛）' },
      { trial: 66, cond: '渡 + 日记装备≥2', job: '净坛·拾遗', hero: 'bajie', held: [],
        chainId: 'bj_tianpeng', chainStep: 7, chainTail: true,
        effect: { bonus: { ti: { hp: 80 }, yuan: { heal: 0.06 } } },
        note: '渡了玉兔，行囊里多了几件奇物（渡道+日记奇物门槛）' },
      { trial: 77, cond: '逆 + 日记装备≥4', job: '行旅录主', hero: 'all', held: [],
        effect: { bonus: { ti: { atk: 15, hp: 60 }, yuan: { atk: 10, hp: 40 } }, passive: { restored: true } },
        note: '一路奇物皆入日记，逆上灵山以物证道（全英雄·日记奇物门槛）' },
      // —— 章节分布补全（2026-09-12）：填充 章4/5/6 缺隐藏职的英雄，使每非序章无全英雄职的章节覆盖全部五英雄 ——
      // 章4（车迟国/通天河，难28-36）：补 唐/八/沙
      { trial: 28, cond: '渡 + 善≥25', job: '车迟·谕道', hero: 'tangseng', held: [],
        chainId: 'ts_jinchan', chainStep: 4, nextJob: '弃经者',
        effect: { bonus: { ti: { hp: 120, dr: 0.06, mdef: 0.05 }, good: 10 }, passive: { mercy: 0.06 } },
        hint: '车迟国祈雨谕道，顺命者得天助——踏实走「渡」、善行满二十五', note: '车迟国祈雨，顺命者得天时' },
      { trial: 31, cond: '战 + 战≥2', job: '车迟·力士', hero: 'bajie', held: [],
        chainId: 'bj_tianpeng', chainStep: 4, nextJob: '八戒·护禅',
        effect: { bonus: { ti: { atk: 25, hp: 120, dr: 0.04 } }, passive: { sunder: 0.05 } },
        hint: '车迟斗法扛山，力士之勇——一贯以「战」收场两难', note: '车迟斗法，力士扛山' },
      { trial: 32, cond: '渡 + 善≥20', job: '沙·问渡', hero: 'shaseng', held: [],
        chainId: 'ss_juanlian', chainStep: 3, nextJob: '沙·辨假',
        effect: { bonus: { ti: { hp: 140, dr: 0.05, mdef: 0.05 } }, passive: { restored: true } },
        hint: '通天河问渡，河神指路——走「渡」、善行满二十', note: '通天河问渡，河神指路' },
      // 章5（女儿国/真假猴王，难37-45）：补 八/白龙/沙
      { trial: 37, cond: '隐 + 隐≥2', job: '白龙·渡河', hero: 'xiaobailong', held: [],
        chainId: 'xbl_longzi', chainStep: 5, nextJob: '白龙·吐水',
        effect: { bonus: { ti: { spd: 3, eva: 0.06, cri: 0.04 } }, passive: { reverseScale: true } },
        hint: '女儿国渡河，龙隐水脉——一贯以「隐」收场两难', note: '女儿国渡河，白龙隐身水脉' },
      { trial: 40, cond: '战 + 战≥2', job: '八戒·护禅', hero: 'bajie', held: [],
        chainId: 'bj_tianpeng', chainStep: 5, nextJob: '净坛·踏焰',
        effect: { bonus: { ti: { atk: 22, hp: 100, dr: 0.04 } }, passive: { glutton: 0.12 } },
        hint: '蝎精摄僧，八戒护禅——以「战」退敌', note: '蝎精摄僧，八戒护禅' },
      { trial: 42, cond: '渡 + 善≥20', job: '沙·辨假', hero: 'shaseng', held: [],
        chainId: 'ss_juanlian', chainStep: 4, nextJob: '卷帘·守舍利',
        effect: { bonus: { ti: { hp: 130, dr: 0.05, mdef: 0.06 } }, passive: { restored: true, mReflectBoost: 0.08 } },
        hint: '真假之间，沙僧独辨——走「渡」、善行满二十', note: '真假之间，沙僧独辨' },
      // 章6（火焰山/祭赛国，难46-54）：补 八/白龙/沙/唐（罗刹·铁扇为全英雄，已另立）
      { trial: 46, cond: '战 + 战≥3', job: '净坛·踏焰', hero: 'bajie', held: [],
        chainId: 'bj_tianpeng', chainStep: 6, nextJob: '净坛·拾遗',
        effect: { bonus: { ti: { atk: 28, hp: 130, dr: 0.04 } }, passive: { glutton: 0.14 } },
        hint: '火焰山踏焰，净坛吞火——一贯以「战」三难', note: '火焰山踏焰，净坛吞火' },
      { trial: 48, cond: '渡 + 善≥25', job: '白龙·吐水', hero: 'xiaobailong', held: [],
        chainId: 'xbl_longzi', chainStep: 6, chainTail: true,
        effect: { bonus: { ti: { hp: 130, mdef: 0.06, eva: 0.05 } }, passive: { restored: true } },
        hint: '化龙吐水，灭焰济众——走「渡」、善行满二十五', note: '化龙吐水，灭焰济众' },
      { trial: 52, cond: '缘 + 缘≥4', job: '卷帘·守舍利', hero: 'shaseng', held: [],
        chainId: 'ss_juanlian', chainStep: 5, nextJob: '卷帘夺宴',
        effect: { bonus: { ti: { hp: 150, dr: 0.06, mdef: 0.06 } }, passive: { restored: true } },
        hint: '金光寺守舍利，卷帘护宝——一贯以「缘」四难', note: '金光寺守舍利，卷帘护宝' },
      { trial: 53, cond: '缘 + 缘≥3', job: '金蝉·谕经', hero: 'tangseng', held: [],
        chainId: 'ts_jinchan', chainStep: 6, nextJob: '判官金蝉',
        effect: { bonus: { yuan: { matk: 28, mdef: 0.06 }, good: 10 }, passive: { mercy: 0.06 } },
        hint: '二郎捕怪，金蝉谕经退敌——一贯以「缘」三难', note: '二郎捕怪，金蝉谕经退敌' },
      // 罗刹·铁扇：原 trials81.js 已有 TRIAL_LIB.hidden 节点（难48）但缺 HIDDEN_JOBS 注册且 cond 引用未实现标记；
      // 此处补注册，cond 改为「渡 + 渡≥3」（走「渡」三难即可在火焰山受铁扇真法），确保可达。
      { trial: 49, cond: '渡 + 渡≥3', job: '罗刹·铁扇', hero: 'all', held: [],
        effect: { bonus: { ti: { atk: 20, hp: 100, dr: 0.04 }, yuan: { matk: 20, mdef: 0.05 } }, passive: { sunder: 0.05, chaos: 0.10 } },
        hint: '火焰山以「渡」化铁扇，芭蕉真法自渡——走「渡」三难', note: '铁扇公主授芭蕉真法，全英雄可参（须于难48走「渡」）' }
    ]
  };

  // —— 一周目 / 二周目全局开关（V8.12 轮回限制核心）——
  // V8.16 取消善恶固定路线：移除一周目逆道封锁（逆选项/逆命数/逆隐藏职/逆劫印/逆难簿一周目全开）。
  // cycle>=2 仍保留的差异：佛经/红劫产出、41-81 逆道单线等（见各功能处独立开关）。
  NDX.isCycle1 = function () { return (NDX.getCycle ? NDX.getCycle() : 1) < 2; };
  NDX.isCycle2 = function () { return (NDX.getCycle ? NDX.getCycle() : 1) >= 2; };
  // 一周目「逆」选项是否锁（灰色不可选）——V8.16 起不再封锁，恒为 false
  NDX.cycleLockEvil = function () { return false; };

  // —— 隐藏职「hidden 节点」条件求值（被 game.js 的 applyTrialOpt 消费）——
  // cond 形如：'逆 + 紫金钵' / '第3打选渡 + 救命毫毛' / '渡 + 善≥30' / '逆 + 紧箍' /
  //            '逆 + 第29难曾选逆' / '助讨龙筋 + 闪避≥阈值' / '逆 + 真·逆道结局'
  // 返回结构化判定结果：
  //   { ok:true }  或  { ok:false, kind, dao, need, cur, msg }
  //   kind：'fate'(六道数值/选项道不符) | 'good'(善不足) | 'evil'(恶不足)
  //         | 'eva'(闪避不足) | 'plot'(特殊剧情未满足)
  // 调用方据此生成「缺失 XX 难 / 六道数值不足 / 持有 XX 法宝」等分级弹窗。
  // 隐藏职「顺命两道」硬性门槛阈值（V8.23）：渡/缘 各达此值方可触发任意隐藏职。
  NDX.HIDDEN_SHUNMING_NEED = 10;
  // 六道命数雷达图·轴刻度上限（超出封顶，图形不溢出）
  NDX.FATE_AXIS_MAX = 16;
  // 材料替代组（V41.1 六道联动·判官金蝉）：主材料不足时，组内任一替代材料持有即满足门槛。
  // 判官金蝉「索命簿/城隍断笔」任一素材——对应 events.js 山鬼献舞/城隍断案 的素材投放（设计文档《隐藏职业与六道联动》§3.3）。
  NDX.MATERIAL_ALIAS = { '索命簿残卷': ['城隍断笔'] };
  NDX.evalHiddenCond = function (cond, s, opt) {
    const c = (cond || '').trim();
    if (!c) return { ok: false };
    const fail = (kind, extra) => Object.assign({ ok: false, kind }, extra || {});
    // 0) 顺命两道硬性门槛（改·原隐藏职"心魔强制要求"）：顺命型（渡/缘）隐藏职须「渡 + 缘」各累计达阈值方可触发。
    //    对应「顺命可无心魔」——只要踏踏实实走顺命（渡/缘），不必积恶(心魔)也能触达隐藏职；积恶反倒与顺命相悖。
    //    逆道型隐藏职（条件以「逆」起首）不受此限：逆线须踏破命数，与渡/缘相悖，首难逆择即可直入序章逆职（如【弃经金蝉】）。
    //    V41.1 扩展：战/隐/夺 型隐藏职（以各自道途命数为门槛）同样不受此限——否则「难9 斗战明王(战≥3)」
    //    会被 渡+缘≥10 前置卡死，与六道联动设计相悖。
    const SHUN = NDX.HIDDEN_SHUNMING_NEED || 10;
    const _fate = s.fate || {};
    const _isNiDao = /^(逆\s*\+|逆≥)/.test(c);
    const _isShunMing = /^(渡|缘)\s*\+|^(渡|缘)≥/.test(c) ||
      c.indexOf('第3打选渡') === 0 || c.indexOf('助讨龙筋') === 0 || c.indexOf('问九世因') === 0;
    // 日记系隐藏职（条件含 日记装备/持ev_）以「日记奇物」为替代凭证，豁免 缘≥10 顺命前置——
    // 否则 渡+日记装备 类会在缘不足时被卡死，与「收集事件奇物即可触达」的设计相悖。
    const _isDiary = /日记装备|持ev_/.test(c);
    if (_isShunMing && !_isDiary && (((_fate['渡']||0) < SHUN || (_fate['缘']||0) < SHUN))) {
      return fail('fate', {
        dao: '渡/缘', need: '渡+缘分各≥' + SHUN,
        cur: `渡${_fate['渡']||0}/缘${_fate['缘']||0}`,
      });
    }
    // 1) 命运累计数值门槛（新增语法：如「渡≥5」/「战 + 战≥3」——该道累积分需达阈值）
    let m = c.match(/(逆|渡|缘|战|夺|隐)≥(\d+)/);
    if (m) {
      const dao = m[1]; const need = +m[2];
      // 对齐六道劫印：命数累计 OR 生效劫印道数 任一达标即可（build 六道 via 劫印 同样能解锁隐藏职，单一词汇降学习成本）
      const _dc = (NDX.DaoSystem && NDX.DaoSystem.calcDaoStats) ? NDX.DaoSystem.calcDaoStats(s) : {};
      const cur = Math.max((s.fate && s.fate[dao]) || 0, _dc[dao] || 0);
      if (cur < need) return fail('fate', { dao, need, cur });
    }
    // 2) 命运前缀（决定必须选哪个选项道）
    let reqFate = null;
    if (c.indexOf('第3打选渡') === 0) reqFate = '渡';
    else {
      const mm = c.match(/^(逆|渡|缘|战|夺|隐)\s*\+/);
      if (mm) reqFate = mm[1];
    }
    if (reqFate && opt.fate !== reqFate) {
      return fail('fate', { dao: reqFate, need: '此道抉择', cur: opt.fate || '未择' });
    }
    // 5.0) 一周目逆道隐藏职（V8.16 取消善恶固定路线后不再封锁，逆道转职一周目即可触发）
    // 3) 善 / 恶 门槛
    m = c.match(/善≥(\d+)/);
    if (m) {
      let need = +m[1];
      if (s.flags.d1Ni) need -= 10;   // 难1逆：弃经者等"善≥"门槛降低一档
      const cur = (s.good || 0);
      if (cur < need) return fail('good', { need, cur });
    }
    m = c.match(/恶≥(\d+)/); if (m) {
      const need = +m[1]; const cur = (s.evil || 0);
      if (cur < need) return fail('evil', { need, cur });
    }
    // 4) 闪避门槛（小白龙·龙太子归）
    m = c.match(/闪避≥(\d+)/);
    if (m && !s.flags.d6Ni) {
      const eva = (NDX.stats(s).eva || 0);
      if (eva < +m[1]) return fail('eva', { need: +m[1], cur: eva });
    }
    // 4.5) 夺宝门槛（六道平衡 2026-09-12）：以「夺得至宝件数」为条件——
    //   夺道少而难，抢到手的至宝才是夺道深度的凭证（由 s.flags.duoTreasures 记账）。
    m = c.match(/夺宝≥(\d+)/);
    if (m) {
      const need = +m[1];
      const cur = NDX.duoTreasureCount ? NDX.duoTreasureCount(s) : 0;
      if (cur < need) return fail('duo', { need, cur });
    }
    // 4.6) 道途连击门槛：如「渡x3」= 曾连续三难以渡道收场（不止累计够数，还要一贯到底）
    m = c.match(/(战|渡|缘|夺|隐|逆)\s*[xX]\s*(\d+)/);
    if (m) {
      const dao = m[1]; const need = +m[2];
      const cur = (s.flags.daoStreak && s.flags.daoStreak.max ? s.flags.daoStreak.max[dao] : 0) || 0;
      if (cur < need) return fail('streak', { dao, need, cur });
    }
    // 5) 特殊剧情门槛
    if (c.indexOf('第29难曾选逆') >= 0 && !s.flags.d29Ni) return fail('plot', { tag: '第29难曾选逆' });
    if (c.indexOf('真·逆道结局') >= 0 && !(opt.ending && opt.ending.indexOf('真·逆道结局') >= 0)) return fail('plot', { tag: '真·逆道结局' });
    // 5.0) 难16 问九世因 / 难25 扶新王：须于对应难号选过该逆选项（沙僧·卷帘镇妖 / 八戒·天蓬复称 前置）
    if (c.indexOf('问九世因') >= 0 && !s.flags.jiushiyin) return fail('plot', { tag: '问九世因', msg: '须于难16流沙九颅择「问九世因」' });
    if (c.indexOf('扶新王') >= 0 && !s.flags.fuxinwang) return fail('plot', { tag: '扶新王', msg: '须于难25乌鸡井龙择「立新王」' });
    // 5.1) D1：六耳·残标注「全英雄」，逻辑自洽——须先已解锁悟空·齐天大圣，否则封锁
    if (c.indexOf('第29难曾选逆') >= 0 && !NDX.isAwakened('齐天·大圣') && !(s.flags.jobConfirm === '齐天·大圣')) {
      return fail('plot', { tag: '齐天·大圣', msg: '六耳残躯需先觉醒齐天·大圣' });
    }
    // 5.2) D2：真·逆道终职前置——33 卷中至少 10 卷逆道难簿已解锁（避免一周目直达终职）
    if (c.indexOf('真·逆道结局') >= 0) {
      const evilNb = NDX.countEvilNanbu ? NDX.countEvilNanbu(s) : 0;
      if (evilNb < 10) return fail('plot', { tag: '逆道难簿≥10', need: 10, cur: evilNb });
    }
    // 6) 助讨龙筋：需选「还筋化马」(缘) 且持有避水珠·化龙（本难 treasure）
    if (c.indexOf('助讨龙筋') >= 0 && !s.flags.d6Ni) {
      if (opt.key !== '缘') return fail('fate', { dao: '缘', need: '此道抉择', cur: opt.key || '未择' });
      const has = (s.equips || []).some((e) => e.id === 'bis_shui_hua') ||
        (s.pending && s.pending.node && s.pending.node.treasure && s.pending.node.treasure.id === 'bis_shui_hua');
      if (!has) return fail('plot', { tag: '避水珠·化龙' });
    }
    // 7) 随从门槛（A2 · 2026-09-25 用户拍板「开工」）：**累计收服随从**（妖王随从 ＋ 徒弟）≥N。
    //    取代原「出阵灵兽≥N」——后者与「宠物初始仅 2 格」构成**循环依赖**（驯兽师死锁：
    //    要先觉醒才有 6 格，而觉醒又要求出阵 ≥3 只灵兽），已收口。语法：随从≥3 / 随从≥2 …
    if (c.indexOf('随从≥') >= 0) {
      const mmC = c.match(/随从≥(\d+)/);
      const needC = +(mmC && mmC[1]) || 0;
      const curC = ((s.followers || []).length) + ((s.disciples || []).length);
      if (curC < needC) {
        return fail('plot', { tag: `随从≥${needC}`, msg: `需累计收服 ${needC} 名随从（当前 ${curC}）` });
      }
    }
    // 7.1) 御兽套在身（驯兽师系战力由御兽套共鸣 perPet 承载 —— 无套则觉醒即空转，故仍作门槛）
    if (c.indexOf('御兽套') >= 0) {
      let hasYushou = false;
      try {
        const act = (window.NDX && NDX.activeEquipsFor) ? NDX.activeEquipsFor(s) : (s.equips || []);
        hasYushou = (act || []).some((e) => e && e.set === '御兽');
      } catch (e) { hasYushou = false; }
      if (!hasYushou) return fail('plot', { tag: '御兽套装备', msg: '需身着御兽套装备（驯兽师战力由其共鸣承载）' });
    }
    // 7.5) 冒险日记装备门槛（六道平衡 2026-09-12 增补）：参照「冒险日记事件装备体系」——
    //   日记装备 = 仅由事件 gear 发放、不入随机掉落/商店 的事件专属装备（武器/甲/冠/靴/法宝）。
    //   ⚠ 2026-09-26 修正：真源是 diary:true 标记 + NDX.DIARY_EQUIP_IDS，**不再按 ev_ 前缀**。
    //   收集日记里记载的奇物，是「行旅录主」一类特殊隐藏职的凭证。
    //   语法：日记装备≥N（持有件数）/ 持ev_<id>（持有指定一件日记装备）。
    m = c.match(/日记装备≥(\d+)/);
    if (m) {
      const need = +m[1];
      // 2026-09-26 修正：不再按「id 以 ev_ 开头」判定（经文双线 21 件无 ev_ 前缀，会被漏计），
      // 改走单一真源 NDX.isDiaryEquip（diary:true 标记 + DIARY_EQUIP_IDS 兜底 + ev_ 前缀兼容）。
      const _isDiaryOne = (e) => (NDX.isDiaryEquip ? NDX.isDiaryEquip(e) : String(e.id || '').indexOf('ev_') === 0);
      const cur = (s.equips || []).filter((e) => e && _isDiaryOne(e)).length;
      if (cur < need) return fail('diary', { need, cur });
    }
    m = c.match(/持(ev_[a-z0-9_]+)/);
    if (m) {
      const gid = m[1];
      const has = (s.equips || []).some((e) => e && String(e.id || '') === gid);
      if (!has) return fail('hold', { tag: gid });
    }
    // 8) 材料持有门槛（V41.1 新增）：cond 中未匹配任何已知模式的裸词视为材料名（如「索命簿残卷」）。
    //    判官金蝉等隐职以材料为持有门槛（对应 events.js 山鬼献舞/城隍断案 的素材投放）。
    //    已知模式 = 六道前缀 / 道途阈值 / 善恶阈值 / 闪避阈值 / 特殊剧情词；装备与法宝名由 lootById 排除（走 held 门槛）。
    //    六道平衡（2026-09-12）新增两种已知模式：夺宝≥N（夺得至宝件数）、道xN（道途连击），
    //    须一并排除，否则会被当作「需持有材料」的裸词而永远判负。
    const _KNOWN = /^(逆|渡|缘|战|夺|隐|衡)$|^(逆|渡|缘|战|夺|隐)≥\d+$|^夺宝≥\d+$|^(战|渡|缘|夺|隐|逆)\s*[xX]\s*\d+$|^(善|恶)≥\d+$|^闪避≥(阈值|\d+)$|^(第3打选渡|第29难曾选逆|真·逆道结局|助讨龙筋|问九世因|扶新王)$|^随从≥\d+$|^御兽套$|^日记装备≥\d+$|^持ev_[a-z0-9_]+$/;
    const _mats = c.split('+').map((t) => t.trim()).filter((t) => t && !_KNOWN.test(t) && !NDX.lootById(t));
    for (const _mt of _mats) {
      // 材料替代组：主材料不足时，组内任一替代材料持有即满足（判官金蝉「索命簿/城隍断笔」任一素材）
      const alias = (NDX.MATERIAL_ALIAS && NDX.MATERIAL_ALIAS[_mt]) || [];
      const have = (s.materials && s.materials[_mt] >= 1) || alias.some((a) => s.materials && s.materials[a] >= 1);
      if (!have) {
        return fail('plot', { tag: _mt, msg: `需持有材料「${_mt}」` });
      }
    }
    return { ok: true };
  };

  // —— 跨周目「已觉醒隐藏职」持久化（localStorage，多周目保留，避免再次触发劫难时重复弹窗）——
  NDX.AWAKEN_KEY = 'ndx_awakened_jobs';
  NDX.awakenedJobs = function () {
    // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
    const data = NDX.SaveSystem.load(NDX.AWAKEN_KEY, []);
    return Array.isArray(data) ? data : [];
  };
  NDX.isAwakened = function (job) {
    if (!job) return false;
    if (job === '六耳·残' && (NDX.loadFavor().allHidden || {}).liuer) return true;
    if (job === '真·逆道' && (NDX.loadFavor().allHidden || {}).zhenti) return true;
    return NDX.awakenedJobs().indexOf(job) >= 0;
  };
  NDX.recordAwakened = function (job) {
    if (!job) return;
    // 隐藏职觉醒高光：四连上行（与六道转职共用 levelup）
    if (NDX.sfx) NDX.sfx('levelup');
    if (job === '六耳·残') { const f = NDX.loadFavor(); f.allHidden = f.allHidden || {}; f.allHidden.liuer = true; NDX.saveFavor(f); return; }
    if (job === '真·逆道') { const f = NDX.loadFavor(); f.allHidden = f.allHidden || {}; f.allHidden.zhenti = true; NDX.saveFavor(f); return; }
    const l = NDX.awakenedJobs();
    if (l.indexOf(job) < 0) { l.push(job); NDX.SaveSystem.save(NDX.AWAKEN_KEY, l); }
  };

  // 按 (hero, job) 取 HIDDEN_JOBS 条目
  //   ⚠ hero 为 null/undefined 时改为**全表查找**（2026-09-26 修正：原先直接 NDX.HIDDEN_JOBS[null] ⇒ 恒 null）
  NDX.hiddenJobEntry = function (hero, job) {
    if (hero && NDX.HIDDEN_JOBS[hero]) {
      return (NDX.HIDDEN_JOBS[hero] || []).find((x) => x.job === job) || null;
    }
    for (const k of Object.keys(NDX.HIDDEN_JOBS || {})) {
      const hit = (NDX.HIDDEN_JOBS[k] || []).find((x) => x.job === job);
      if (hit) return hit;
    }
    return null;
  };
  const _entryByName = (name) => (name ? NDX.hiddenJobEntry(null, name) : null);

  // ============================================================
  // 隐藏职「链上叠加」合并器（2026-09-26）
  //   设计真源：docs/《逆道西行》转职系统 · 链上叠加与跨周目继承（v1.0）.md
  //
  // 🔴 旧口径：s.flags.jobConfirm 是**单值**，两条合并路径（attr_calc / combat_part1）
  //   都是 find(...)+break ⇒ 玩家转了 7 次职只有最后一次算数
  //   （实测悟空持棒者链全中：atk 理论 +180 实得 +50，丢弃 72%；hp 丢弃 29%）。
  //   玩家体感不是「数值小」，而是「转了 7 次几乎没变化」。
  //
  // 新口径：已确认职存为**有序列表** s.flags.jobs；合并时
  //   · 数值（ti / yuan / good）逐键累加
  //   · passive **同名取最大、异名累加**，且逐键套硬顶
  //     ⚠ 不能简单全叠：悟空链 passive 全是绝对穿透系（empty 0.12/0.14/0.16/0.20），
  //       11 个 empty 职全叠 = 143% 绝对穿透率，游戏当场崩盘。
  // ============================================================

  // passive 硬顶表（同名取值上限）—— 已逐个 grep 确认：这些键在 combat_part1/active 均有消费点
  NDX.JOB_PASSIVE_CAP = {
    empty: 0.30, sunder: 0.18, glutton: 0.20, mercy: 0.08,
    mReflect: 0.40, mReflectBoost: 0.20, buddha_def: 0.15,
    chaos: 0.15, criBonus: 0.10,
  };
  // 布尔系 passive：同名取 or（无溢出风险，故不入 CAP 逻辑的数值分支）
  NDX.JOB_PASSIVE_BOOL = { restored: true, reverseScale: true };

  // 跨周目「觉醒印记（Legacy Seal）」——继承的是战力，不只是门槛豁免
  NDX.JOB_LEGACY_CAP = 9;     // 继承槽位上限
  NDX.JOB_LEGACY_PCT = 0.03;  // 每槽给隐藏职数值 +3%（满槽 ×1.27）

  // 隐藏职数值封顶（相对英雄基础，防多链全中爆炸）
  NDX.JOB_BONUS_CAP = { atk: 3.0, hp: 4.0, maxHp: 4.0, matk: 3.0 };

  // 职责注册表：原 equipment_part3.js 的两条硬编码特例，收归此处作单一真源
  NDX.JOB_PET_SLOT = { '逆兽师·百逆归心': 1 };                        // 额外宠物格
  NDX.JOB_TREASURE_SYNERGY = { '逆兽师·百逆归心': { perPetMult: 1.5 } }; // 御兽套 perPet 增幅

  // —— 已确认隐藏职列表：按确认顺序、去重、过滤不存在的条目 ——
  //   ⚠ 兼容：旧存档无 jobs ⇒ 回退 jobConfirm 单值，行为与改造前完全一致（零迁移）
  NDX.activeJobs = function (s) {
    if (!s) return [];
    const fl = s.flags || s;
    let list = Array.isArray(fl.jobs) ? fl.jobs : null;
    if (!list || !list.length) {
      const one = fl.jobConfirm || s.jobConfirm;
      list = one ? [one] : [];
    }
    const out = [];
    for (const n of list) {
      if (typeof n !== 'string' || !n) continue;
      if (out.indexOf(n) >= 0) continue;
      if (!_entryByName(n)) continue;
      out.push(n);
    }
    return out;
  };
  // 当前形态 = 末位（与旧 jobConfirm 语义等价）
  NDX.currentJob = function (s) {
    const a = NDX.activeJobs(s);
    return a.length ? a[a.length - 1] : null;
  };

  // —— 确认转职的**写入端唯一入口** ——
  //   2026-09-26：写入 s.flags.jobs 有序列表（去重追加），并同步 jobConfirm = 末位（兼容旧读法）。
  //   ⚠ 任何「转职成功」分支都必须走这里，禁止再写裸 `s.flags.jobConfirm = x`
  //     ——否则该职不进 jobs，链上中间职仍会被静默丢弃。
  //   零迁移：旧存档无 jobs ⇒ 首次确认时 jobs = [name]，与改造前行为完全一致。
  NDX.confirmHiddenJob = function (s, name) {
    if (!s || typeof name !== 'string' || !name) return false;
    const fl = (s.flags = s.flags || {});
    if (!Array.isArray(fl.jobs)) fl.jobs = [];
    if (fl.jobs.indexOf(name) < 0) fl.jobs.push(name);
    fl.jobConfirm = name;
    return true;
  };
  // 本局已确认职数（供 UI 显示「N 链承袭」）
  NDX.jobStackCount = function (s) {
    return (NDX.activeJobs ? NDX.activeJobs(s) : []).length;
  };

  // —— 转职外观联动的唯一取色/取链来源（UI 层不得再自己解析 HIDDEN_JOBS）——
  //   《报告》判「转职无外观变化」属实；本表是**零美术成本**的显影：按流派给徽章字色。
  //   真立绘联动待后续美术批次，不在此处占位。
  NDX.JOB_STYLE_COLOR = {
    summon: '#9a7bd6', combo: '#e0724a', reflect: '#6fa8c7', crit: '#d94f5c', ward: '#5f9e6f',
    evade: '#4f9bb5', drain: '#c07a3e', purify: '#d6b25f', burn: '#c94f2e', reverse: '#8a4fbf',
  };
  NDX.jobStackOf = function (s) {
    const names = NDX.activeJobs ? NDX.activeJobs(s) : [];
    const out = [];
    for (const n of names) {
      const e = _entryByName(n);
      if (!e) continue;
      const style = (NDX.JOB_STYLE && NDX.JOB_STYLE[n]) || null;
      out.push({
        job: n, chainId: e.chainId || null, step: e.chainStep || 0, tail: !!e.chainTail,
        style: style, color: (NDX.JOB_STYLE_COLOR || {})[style || ''] || null,
        tier: NDX.jobTier(n).key, tierLabel: NDX.jobTier(n).label,
        review: NDX.jobReview(n),
        // 🆕 V9.60「须装备 XX」门槛（对标冒险日记图鉴·职业表的条件列）：
        //   held 判定早已在 game_event_2.js:521 落地，但**玩家看不到自己缺什么**，
        //   只能转职失败后吃一条 toast。此处把门槛文案派生出来，供 UI 前置展示（零新增数据）。
        nextJob: e.nextJob || null,
        heldNames: NDX.jobHeldNames(e),
        cond: e.cond || '',
      });
    }
    return out;
  };

  // 把 HIDDEN_JOBS 条目的 held（[] 或装备 id 数组）翻成玩家读得懂的「须持有 · XX、YY」。
  //   ⚠ 数据里 held 的 id 一律能在字典查到（已由 _verify_codex_align 断言），查不到时回落 id 本身。
  NDX.jobHeldNames = function (entry) {
    if (!entry) return [];
    const h = entry.held || [];
    return h.map((id) => {
      let it = null;
      try { it = NDX.lootById ? NDX.lootById(id) : null; } catch (e) { it = null; }
      return (it && it.name) || id;
    });
  };

  // 按职名反查门槛（用于「已激活链的下一职」——它不在 stack 里，只能按名回查）
  NDX.jobHeldByName = function (jobName) {
    const e = _entryByName(jobName);
    return e ? { names: NDX.jobHeldNames(e), cond: e.cond || '' } : null;
  };

  // =============================================================
  // 职阶层级（对标「冒险日记图鉴 · 职业表」的「战士 → 守护骑士（普转）→ 元气骑士」层级）
  // -------------------------------------------------------------
  //  冒险日记用「普转 / 进阶 / 隐藏」显式标注层级；逆道的 45 职里
  //    · 5 条链共 33 职有 chainId，职位名本身即递进（弃经金蝉→定风金蝉→…→判官金蝉）
  //    · 12 职无链（六耳·残 / 真·逆道 / 斗战明王 / 罗刹·铁扇 …）是**孤本**
  //  故按链内序号派生，不新增数据字段：改链结构，职阶自动跟着变。
  // =============================================================
  NDX.JOB_TIER_LABEL = { origin: '本相', mid: '进阶', final: '终极', solo: '孤本' };

  // 取某职所在英雄的 HIDDEN_JOBS 列表（条目不带 hero 字段，需回查）
  const _jobHeroList = (jobName) => {
    const H = NDX.HIDDEN_JOBS || {};
    for (const k of Object.keys(H)) {
      const hit = (H[k] || []).find((x) => x.job === jobName);
      if (hit) return { hero: k, list: H[k] || [] };
    }
    return { hero: null, list: [] };
  };
  // 全英雄聚合某条链的全部成员。
  // ⚠ 不能只在条目所属英雄的列表里找链友——八戒线 bj_tianpeng 在 shaseng 之外的英雄列表里
  //   只有 3 条（天蓬·负岳/吞天净坛/天蓬复称），链实为 7 步；只看本英雄会把 step3 误判为终极。
  const _chainMembers = (cid) => {
    const H = NDX.HIDDEN_JOBS || {};
    const out = [];
    for (const k of Object.keys(H)) {
      for (const x of (H[k] || [])) {
        if ((x.chainId || x.chain) === cid) out.push(x);
      }
    }
    return out;
  };

  NDX.jobTier = function (jobName) {
    const e = _entryByName(jobName);
    if (!e) return { key: 'solo', label: '孤本', chainId: null, step: 0, total: 0 };
    const cid = e.chainId || e.chain;
    if (!cid) return { key: 'solo', label: '孤本', chainId: null, step: 0, total: 0 };
    // ⚠ 链内序号以条目自带的 chainStep 为准（1-based、已按转职先后排好），
    //   不要按 trial 重排——部分链的 trial 与链序并不单调，重排会算错阶。
    const step = e.chainStep || 1;
    let total = step;
    for (const x of _chainMembers(cid)) {
      if ((x.chainStep || 0) > total) total = x.chainStep;
    }
    const key = step <= 1 ? 'origin' : (step >= total ? 'final' : 'mid');
    return { key: key, label: NDX.JOB_TIER_LABEL[key], chainId: cid, step: step, total: total };
  };

  // =============================================================
  // 玩法评测（对标「冒险日记图鉴 · 职业图鉴」的「评测」列）
  // -------------------------------------------------------------
  //  图鉴的「评测」是玩家社区给职业打的玩法定位标签（如"被时代抛弃了"）。
  //  逆道的 45 职此前只有 note 一句叙述，玩家无法一眼判断"这个职值不值得刻意凑"。
  //  以下文案**不新增设定**，只把既有 note + 流派 + 增益方向归纳成一句玩家视角定位。
  // =============================================================
  NDX.JOB_REVIEW = {
    // —— 唐僧线（ts_jinchan）——
    '弃经金蝉': '起点：走逆道弃经的岔口，后面七步都从这里长出来',
    '定风金蝉': '过渡：靠定风珠续命，收益随法宝走',
    '金蝉了缘': '缘道分支：了因果者，善值收益最厚',
    '车迟·谕道': '道争：比拼道行而非武力，法抗向',
    '弃经者': '逆道核心：弃经即弃枷锁，愿伤成主',
    '金蝉·谕经': '收束：既弃又谕，矛盾合一',
    '判官金蝉': '结局向终职：赢的是「判」不是「打」',
    // —— 悟空线（wk_chibang）——
    '悟空的空': '悟空起点：不借法宝的空手搏杀，反 Bohr 里最难的一档',
    '圣婴折服': '收红孩儿为助力，burn 流起点',
    '悟空的棒': '形态之变：棒法随链逐级增伤',
    '悟空的镜': '反伤向：挨打越多越强',
    '鹏翼之悟': '飞行形态，增伤窗口更宽',
    '悟空的嗅': '感知：提前识破破韧窗口',
    '持棒证道': '悟空线数值终点，全链增益在此收口（比例最高）',
    // —— 八戒线（bj_tianpeng）——
    '天蓬·负岳': '八戒起点：以躯承重，血厚起手',
    '吞天净坛': '吞吐：击杀回血滚雪球',
    '天蓬复称': '称重：战力随受击累积',
    '车迟·力士': '力量向：物攻最高的一档',
    '八戒·护禅': '护禅：护盾与减伤并重',
    '净坛·踏焰': 'burn 终点：踏焰即灼烧',
    '净坛·拾遗': '收尾：拾遗者，捡漏全链剩余收益',
    // —— 白龙线（xbl_longzi）——
    '逆鳞白龙': '白龙起点：逆鳞在背，受击反制',
    '龙太子归': '归位：化作龙太子形态',
    '白龙·御水': '水属：控场与增伤兼顾',
    '夺宝龙子': '夺：从敌人身上抢宝，evil 收益',
    '白龙·渡河': '渡：救人与自渡并存',
    '白龙·吐水': '终章：吐水成海，控场收口',
    // —— 沙僧线（ss_juanlian）——
    '卷帘镇妖': '沙僧起点：降妖念珠在手的稳开局',
    '卷帘复权': '复权：夺回卷帘大将的权柄',
    '沙·问渡': '问渡：走渡道的低风险分支',
    '沙·辨假': '识破向：分辨真假，克制分身',
    '卷帘·守舍利': '守：护住舍利，队伍续航',
    '卷帘夺宴': '夺宴：终章既守又夺',
    // —— 无链独立职 ——
    '斗战明王': '孤本：战力直给，无需凑链',
    '齐天·大圣': '孤本：悟空线外的高爆发替代解',
    '齐天残念': '孤本：大圣退位后的残念，过渡位',
    '白衣渡客': '孤本：渡人终渡己，治疗向',
    '女儿国·双随从': '孤本：绑定双随从，走随从流不看脸',
    '六耳·残': '孤本：隐藏第四人，可参战',
    '真·逆道': '孤本：全英雄终极隐藏职，逆道尽头',
    '驯兽师·百兽归心': '孤本：宠物格 2→6，养兽流专用',
    '逆兽师·百逆归心': '孤本：逆道养兽，额外出战位',
    '九头·掠宝': '孤本：掠宝专精， evil 收益',
    '行旅录主': '孤本：行旅之主，探索收益',
    '罗刹·铁扇': '孤本：芭蕉扇控火，burn 流可用',
  };

  NDX.jobReview = function (jobName) {
    return NDX.JOB_REVIEW[jobName] || '';
  };

  // —— 跨周目觉醒继承强度（0 ~ JOB_LEGACY_CAP）——
  NDX.jobLegacyCount = function () {
    let n = 0;
    try { n = (NDX.awakenedJobs ? NDX.awakenedJobs() : []) || []; n = n.length; } catch (e) { n = 0; }
    try {
      if (typeof NDX.loadFavor === 'function') {
        const ah = (NDX.loadFavor() || {}).allHidden || {};
        if (ah.liuer) n += 1;
        if (ah.zhenti) n += 1;
      }
    } catch (e) { /* 读档异常不影响主线 */ }
    return Math.max(0, Math.min(NDX.JOB_LEGACY_CAP || 0, n));
  };

  // —— 数值合并：逐键累加 → 跨周目放大 → 相对英雄基础封顶 ——
  NDX.mergeJobBonus = function (names, hero) {
    const ti = {}, yuan = {};
    let good = 0;
    for (const name of (names || [])) {
      const e = _entryByName(name);
      if (!e || !e.effect || !e.effect.bonus) continue;
      const b = e.effect.bonus;
      if (b.ti) for (const k of Object.keys(b.ti)) ti[k] = (ti[k] || 0) + b.ti[k];
      if (b.yuan) for (const k of Object.keys(b.yuan)) yuan[k] = (yuan[k] || 0) + b.yuan[k];
      if (b.good) good += b.good;
    }
    // 跨周目继承：只放大隐藏职自身，不动英雄基础与装备 ⇒ 溢出可控
    const mult = 1 + (NDX.JOB_LEGACY_PCT || 0) * (NDX.jobLegacyCount ? NDX.jobLegacyCount() : 0);
    for (const k of Object.keys(ti)) ti[k] *= mult;
    for (const k of Object.keys(yuan)) yuan[k] *= mult;
    good *= mult;
    // 封顶
    const cap = NDX.JOB_BONUS_CAP || {};
    if (hero) {
      const base = { atk: hero.baseAtk, hp: hero.baseHp, maxHp: hero.baseHp, matk: hero.baseMatk };
      for (const k of Object.keys(cap)) {
        if (ti[k] == null) continue;
        const lim = (base[k] || 0) * cap[k];
        if (lim > 0 && ti[k] > lim) ti[k] = lim;
      }
    }
    return { ti, yuan, good };
  };

  // —— 被动合并：同名取最大、异名累加、逐键硬顶 ——
  NDX.mergeJobPassive = function (names) {
    const caps = NDX.JOB_PASSIVE_CAP || {};
    const bools = NDX.JOB_PASSIVE_BOOL || {};
    const perKey = {};
    for (const name of (names || [])) {
      const e = _entryByName(name);
      if (!e || !e.effect || !e.effect.passive) continue;
      const p = e.effect.passive;
      for (const k of Object.keys(p)) {
        const v = p[k];
        if (bools[k]) { (perKey[k] = perKey[k] || []).push(!!v); continue; }
        (perKey[k] = perKey[k] || []).push(Number(v) || 0);
      }
    }
    const out = {};
    for (const k of Object.keys(perKey)) {
      const arr = perKey[k];
      if (bools[k]) { if (arr.some(Boolean)) out[k] = true; continue; }
      // 同名取最大（同一键被多个职声明时取 max，不累加）；跨键互不影响 ⇒ 天然「异名累加」
      let v = Math.max.apply(null, arr);
      if (caps[k] != null && v > caps[k]) v = caps[k];   // 硬顶
      if (v) out[k] = v;
    }
    return out;
  };
  // —— 隐藏转职「长链」只读查询（V9.24）——
  // 链由 HIDDEN_JOBS 条目上的 chainId/chainStep/nextJob(/chainTail) 声明，可跨 tangseng|wukong|...|all 数组；
  // all 数组中以 hero 字段托管的分英雄职同样入链（如「定风金蝉」hero:'tangseng'）。
  // ⚠ 本组函数**只读**：不参与触发判定，不改变任何现有可玩性；仅供 UI/统计展示「链 N/M」。
  //   触发门槛仍由 evalHiddenCond(hidden.cond) + hiddenTrialsMet 决定（注册表 cond 字段零消费，仅为文档）。
  NDX.hiddenChainsOf = function (hero) {
    const out = {};
    const keys = Object.keys(NDX.HIDDEN_JOBS || {});
    for (const k of keys) {
      for (const it of (NDX.HIDDEN_JOBS[k] || [])) {
        if (!it.chainId) continue;
        if (hero && k !== hero && it.hero !== hero && k !== "all") continue;
        const c = out[it.chainId] || (out[it.chainId] = { chainId: it.chainId, steps: [] });
        c.steps.push({ step: it.chainStep, trial: it.trial, job: it.job, hero: it.hero || k, tail: !!it.chainTail, next: it.nextJob || null });
      }
    }
    for (const id in out) out[id].steps.sort((a, b) => (a.step || 0) - (b.step || 0));
    return out;
  };
  // 返回 { chainId, total, awoken, steps:[{...job, done}] }；awoken 用 NDX.isAwakened 判定（跨周目持久）
  NDX.hiddenChainProgress = function (s, hero, chainId) {
    const all = NDX.hiddenChainsOf(hero);
    const pick = chainId ? (all[chainId] ? [all[chainId]] : []) : Object.keys(all).map((k) => all[k]);
    return pick.map((c) => {
      const steps = c.steps.map((x) => Object.assign({}, x, { done: !!(NDX.isAwakened && NDX.isAwakened(x.job)) }));
      return { chainId: c.chainId, total: steps.length, awoken: steps.filter((x) => x.done).length, steps: steps };
    });
  };

  const out = {};
  const keys = ['tangseng', 'wukong', 'bajie', 'xiaobailong', 'shaseng', 'all'];
  keys.forEach((k) => {
    const list = (prev && prev[k] && prev[k].slice()) || [];
    (add[k] || []).forEach((it) => {
      if (!list.some((x) => x.trial === it.trial && x.job === it.job)) list.push(it);
    });
    out[k] = list;
  });
  return out;
})(typeof NDX.HIDDEN_JOBS !== 'undefined' ? NDX.HIDDEN_JOBS : null);

// ============ 隐藏专职「必经劫难」约束（V40 新增）============
// 设计：英雄隐藏专职（含八戒终极「天蓬归来/天蓬复称」）不仅需要 fate/道具条件，
// 还必须「实际经过」一组特定的关键劫难。这些劫难在地图生成时「必定出现」（见 generateMap 后处理），
// 但玩家仍可绕道逃课——若某章节经过的劫难不够多，则无法完成隐藏（trialsPassed 校验不通过）。
//   · 键为英雄 id（'all' 视为六耳残隐线共用）
//   · diff 列表为该英雄隐藏专职所需的「关键劫难难号」，按剧情身份成长线选取
//   · 八戒需经过特定的九次劫难（天蓬身份线：投胎→谪贬→云栈→遇狼→试力→比拼→真假→钉耙会→金平府）
NDX.HIDDEN_TRIAL_REQ = {
  bajie: [1, 2, 13, 23, 24, 37, 50, 58, 64],   // 天蓬身份线（原著地理重排后难号：金蝉贬→出胎→黄风→黑松林→火云→女儿国→祭赛→狮驼→天竺；23 为天蓬·负岳）
  wukong: [1, 9, 20, 21, 45, 58, 60, 81],  // 斗战明王线（重排后：出城虎→鹰愁→白骨→黄袍→真假→狮驼→比丘→终局）
  tangseng: [1, 38, 53, 61, 66, 81],       // 金蝉了缘线（重排后：贬→女王→万圣→比丘→给孤→终局）
  xiaobailong: [6, 26, 62],                // 夺宝龙子线（重排后：落坑→黑水御水→凤仙）
  // 【2026-09-13 PHASE 7 修正】原写 18：PHASE 4 把「流沙河收沙僧」由难18 前移至难17 时漏改本表，
  //   而 18 现为「四圣试禅心」（纯事件，非沙僧线必经战斗劫难），等于沙僧线的必经劫难指向了错误内容。
  //   17 现属 ch2 融合弧 diffs，由 _ensureHiddenTrials 的 _compG.diffs 排除逻辑自动满足
  //   （弧内子难由复合流程逐难结算并计入 trialsPassed）。
  shaseng: [17, 64, 65, 81],               // 卷帘复权线（重排后：流沙收沙僧→天竺竹节→金平→终局）
  all: [45, 58],                           // 六耳残隐线共用（重排后：真假→狮驼）
};
// 所有英雄隐藏职「必经劫难」全局难号汇总集合（用于判定某劫是否固定难号，不可随机分配）
NDX._HIDDEN_TRIAL_SET = (function () {
  const set = new Set();
  Object.keys(NDX.HIDDEN_TRIAL_REQ || {}).forEach((h) => {
    (NDX.HIDDEN_TRIAL_REQ[h] || []).forEach((g) => set.add(g));
  });
  return set;
})();

// 便捷方法：判断玩家是否已实际经过某英雄隐藏职所需的全部关键劫难
//   heroId：英雄 id；trialsPassed：s.trialsPassed（[{diff,act,name}]）
//   curDiff（可选）：当前难号。传入后启用「位置感知」门槛（设计稿 V41.1 落地）：
//     只要求「必经劫难 ≤ 当前难号」的子集已过，且当前难本身视为已达成——
//     避免「难43判官金蝉须先过难65/73/81」的死锁，同时保留「逃课过多则无法触发」的反逃课约束。
// 返回 { ok, missing:[diff...], req } —— ok=false 时 missing 为未经过的劫难难号
NDX.hiddenTrialsMet = function (heroId, trialsPassed, curDiff) {
  const req = NDX.HIDDEN_TRIAL_REQ[heroId] || [];
  const passed = new Set((trialsPassed || []).map((t) => t.diff));
  let relevant = req;
  if (curDiff != null) {
    const cur = +curDiff || 0;
    passed.add(cur); // 当前难本身视为已达成
    relevant = req.filter((d) => d <= cur);
  }
  const missing = relevant.filter((d) => !passed.has(d));
  return { ok: missing.length === 0, missing, req: relevant };
};

// =============================================================
// 事件选项 · 条件门槛与可重刷语义
// -------------------------------------------------------------
//  对标「冒险日记图鉴 · 事件表」的两个关键列：
//    · 「条件」列 —— 选项按玩家状态显隐（图鉴里大量出现「善>0」「金币<50」）
//    · 「后续」列 —— 事件是「重复事件」还是「结束事件」
//  逆道的门槛字段本来就写在 option 上（网状叙事 P0/P1，引擎读端在 game_event_4._optionGate），
//  但 UI 侧从不明示 ⇒ 玩家不知道某选项为何锁、为何不在。
//  本段把「门槛文本」与「门槛判定」收口到一处：写入端 = 数据字段，读取端 = 引擎 + UI 徽章。
// ⚠ 只认**门槛字段**。effect.good/alignGood 是「善+N」的**收益**，不是门槛，切勿反读。
// =============================================================

// 参与门槛判定的字段；顺序即徽章展示顺序
NDX.OPTION_COND_FIELDS = ['cond', 'requireFlag', 'requireFlagNot', 'requireLock',
  'requireRel', 'requireNoTreasure', 'requireHero', 'ge'];

// —— 「后续」列三态：once（落过即不再出）/ end（打完即结束）/ repeat（可重复刷）——
NDX.OPTION_REPEAT_LABEL = { once: '一次性', end: '战斗结束', repeat: '可重复' };

NDX.optionRepeat = function (opt) {
  if (!opt) return 'repeat';
  if (opt.once === true) return 'once';
  if (opt.repeat === false) return 'once';
  if (opt.setFlag) return 'once';      // 写了 setFlag 的选项是"落过一笔"，不应反复刷
  if (opt.fight === true) return 'end';
  return 'repeat';
};

// optionRepeat 的并列版：同一选项可同时「战完才出现」且「落过不再出」，
// UI 一次给全，避免 fight + setFlag 并存时只显示一条而丢信息。
NDX.optionRepeatAll = function (opt) {
  if (!opt) return ['repeat'];
  const out = [];
  if (opt.once === true || opt.repeat === false || opt.setFlag) out.push('once');
  if (opt.fight === true) out.push('end');
  return out.length ? out : [NDX.optionRepeat(opt)];
};

// —— 内部：把内部 id 翻成人名/物名 ——
NDX._condLabel = function (id) {
  if (!id) return id;
  try {
    if (NDX.equipById) { const e = NDX.equipById(id); if (e && e.name) return e.name; }
  } catch (e2) { /* 查表失败就回显 id，不影响主流程 */ }
  return id;
};

// —— 「条件」列：把门槛字段翻成玩家读得懂的一句话 ——
NDX.optionCondText = function (opt) {
  if (!opt) return '';
  const bits = [];
  if (opt.cond) bits.push(String(opt.cond));                      // 作者显式声明，最优先
  const _arr = (v) => (v == null ? [] : (Array.isArray(v) ? v : [v]));
  _arr(opt.requireFlag).forEach((f) => bits.push('须先 · ' + (NDX.flagLabel ? NDX.flagLabel(f) : f)));
  _arr(opt.requireFlagNot).forEach((f) => bits.push('不可 · ' + (NDX.flagLabel ? NDX.flagLabel(f) : f)));
  _arr(opt.requireLock).forEach((f) => bits.push('已被阻断 · ' + (NDX.flagLabel ? NDX.flagLabel(f) : f)));
  if (opt.requireRel) {
    for (const npc in opt.requireRel) bits.push(npc + '缘 ≥ ' + opt.requireRel[npc]);
  }
  _arr(opt.requireNoTreasure).forEach((t) => bits.push('不得持 · ' + NDX._condLabel(t)));
  if (opt.requireHero) bits.push('限 · ' + opt.requireHero);
  if (opt.ge && opt.geVal > 0) bits.push(opt.ge + '道行 ≥ ' + opt.geVal);
  return bits.join(' · ');
};

// —— 门槛是否满足（供 UI 徽章与置灰）——
// ⚠ 只判**明示的**门槛；收益类数值（善/恶/结缘）的结算在其他模块，不在此重复判定，避免两套真源。
NDX.optionCondMet = function (opt, s) {
  if (!opt) return { ok: true, text: '' };
  const text = NDX.optionCondText(opt);
  if (!text) return { ok: true, text: '' };
  if (!s) return { ok: true, text };

  const _hitFlag = (flags, f) => {
    const i = String(f).indexOf(':');
    if (i >= 0) { const k = f.slice(0, i), v = f.slice(i + 1); return flags[k] === v; }
    return !!flags[f];
  };
  const flags = (s.choiceFlags) || {};
  const _arr = (v) => (v == null ? [] : (Array.isArray(v) ? v : [v]));

  for (const f of _arr(opt.requireFlag)) if (!_hitFlag(flags, f)) return { ok: false, text };
  for (const f of _arr(opt.requireFlagNot)) if (_hitFlag(flags, f)) return { ok: false, text };
  for (const f of _arr(opt.requireLock)) if (_hitFlag(flags, f)) return { ok: false, text };
  if (opt.requireRel) {
    const rel = s.npcRel || {};
    for (const npc in opt.requireRel) if ((rel[npc] || 0) < opt.requireRel[npc]) return { ok: false, text };
  }
  for (const t of _arr(opt.requireNoTreasure)) {
    if ((s.equips || []).some((e) => e.id === t || e.treasureId === t)) return { ok: false, text };
  }
  if (opt.requireHero && s.hero !== opt.requireHero) return { ok: false, text };
  if (opt.ge && opt.geVal > 0) {
    const cur = (s.ge && s.ge[opt.ge]) || 0;
    if (cur < opt.geVal) return { ok: false, text };
  }
  return { ok: true, text };
};
