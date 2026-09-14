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
        effect: { bonus: { ti: { hp: 200, dr: 0.08, mdef: 0.06 }, good: 10 }, passive: { buddha_def: 0.06 } } },
      // 原著地理重排（2026-09-01）：弃经者原 trial 27(女儿国王) → 38(女王招亲)
      { trial: 39, cond: '逆 + 紫金钵 + 善≥20', job: '弃经者', held: ['ts_bowl'],
        effect: { bonus: { yuan: { matk: 30 } }, passive: { mercy: 0.05 } } },
      // V41.1 六道联动新增：隐·判官金蝉（难61 隐雾梅花，需隐≥3 + 索命簿残卷素材）
      { trial: 61, cond: '隐 + 隐≥3 + 索命簿残卷', job: '判官金蝉', held: [],
        effect: { bonus: { yuan: { matk: 35, mdef: 0.08 } }, passive: { restored: true } },
        note: '断人生死，替天行道' },
      // V41.1 六道联动新增：缘·金蝉了缘（难19 五庄观人参，需缘≥3）
      { trial: 19, cond: '缘 + 缘≥3', job: '金蝉了缘', held: [],
        effect: { bonus: { yuan: { matk: 30, mdef: 0.06 }, good: 15 }, passive: { mercy: 0.06 } },
        note: '缘了缘续，因果自了' }
    ],
    wukong: [
      // V41.1 六道联动新增：战·斗战明王（难9 两界山·鹰愁涧，需战≥3）
      { trial: 9, cond: '战 + 战≥3 + 战x3', job: '斗战明王', held: [],
        effect: { bonus: { ti: { atk: 35, cri: 0.06 } }, passive: { empty: 0.10 } },
        note: '以战正道，战意化刃' },
      // 原著地理重排：悟空的空 原 trial 16(白骨三戏) → 20(白骨三戏)
      { trial: 20, cond: '第3打选渡 + 救命毫毛', job: '悟空的空', held: ['jiuming'],
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
        note: '白衣渡尽，不着一物' }
    ],
    bajie: [
      // 8.11《五人隐藏专职明细》：八戒主隐藏职 = 第24难·平顶山宝「逆 + 净坛宝盂」（原第18难，重排后 18→24）
      { trial: 24, cond: '逆 + 净坛宝盂', job: '吞天净坛', held: ['bj_bowl'],
        effect: { bonus: { ti: { hp: 250, dr: 0.05, atk: 10 } }, passive: { glutton: 0.15 } },
        note: '吞食万物，饱食成盾' },
      // 原著地理重排：天蓬复称 原 trial 69(乌鸡假王·返程) → 25(乌鸡井龙，立新王标记补于该难逆选项)
      { trial: 25, cond: '逆 + 扶新王', job: '天蓬复称', held: ['bj_bowl'],
        effect: { bonus: { ti: { hp: 300, dr: 0.06, atk: 15 } }, passive: { glutton: 0.20 } },
        note: '重称天蓬，倒海翻江' },
      // 2026-09-01 八戒·血反伤路线（渡道·善≥30，难23 黑松林失）：与吞天/天蓬（逆道·血防攻吞食）形成 2 条路线
      { trial: 23, cond: '渡 + 善≥30', job: '天蓬·负岳', held: [],
        effect: { bonus: { ti: { hp: 250, dr: 0.06 } }, passive: { mReflect: 0.25 } },
        note: '以背承山，以伤还伤' }
    ],
    xiaobailong: [
      { trial: 6, cond: '逆 + 避水珠', job: '逆鳞白龙', held: ['bis_an'],
        effect: { bonus: { ti: { atk: 20, cri: 0.04, eva: 0.05 } }, passive: { reverseScale: true } } },
      // 原著地理重排：龙太子归 原 trial 59(返程) → 9(鹰愁涧收白龙，缘选项补 避水珠·化龙 treasure)
      { trial: 9, cond: '助讨龙筋 + 闪避≥阈值', job: '龙太子归', held: ['bis_shui_hua'],
        effect: { bonus: { ti: { atk: 25, cri: 0.05 } }, passive: { reverseScale: true, criBonus: 0.05 } } },
      // V41.1 六道联动新增：夺·夺宝龙子（原难61 黑风开箱 → 重排后难29 三妖赌胜，需夺≥3）
      { trial: 29, cond: '战 + 战≥2 + 夺宝≥1', job: '夺宝龙子', held: [],
        effect: { bonus: { ti: { atk: 25, cri: 0.05, eva: 0.04 } }, passive: { reverseScale: true } },
        note: '龙的宝，迟早游回龙手里' },
      // 2026-09-01 小白龙·血防路线（隐道·隐≥3，难26 黑水鼍龙）：与攻击残血系形成 2 条路线
      { trial: 26, cond: '隐 + 隐≥3 + 隐x3', job: '白龙·御水', held: [],
        effect: { bonus: { ti: { hp: 200, dr: 0.06, eva: 0.05 } }, passive: { restored: true } },
        note: '御水成甲，潜渊自守' }
    ],
    shaseng: [
      // 原著地理重排：卷帘复权 原 trial 14(流沙河收沙僧) → 17(流沙河收沙僧)【2026-09-14 注册审计：与 HIDDEN_TRIAL_REQ.shaseng=[17,...] 对齐】
      { trial: 17, cond: '渡 + 善≥30', job: '卷帘复权', held: ['ss_bowl'],
        effect: { bonus: { ti: { hp: 150, dr: 0.04, mdef: 0.05 } }, passive: { restored: true } } },
      // 原著地理重排：卷帘镇妖 原 trial 63(流沙数颅·返程) → 16(流沙九颅，问九世因标记补于该难逆选项)
      { trial: 16, cond: '问九世因 + 降妖念珠', job: '卷帘镇妖', held: ['ss_bowl'],
        effect: { bonus: { ti: { hp: 200, dr: 0.05, mdef: 0.06 } }, passive: { restored: true, mReflectBoost: 0.10 } } },
      // V41.1 六道联动新增：夺·卷帘夺宴（难65 金平犀灯，需夺≥3）
      { trial: 65, cond: '夺 + 夺≥3 + 夺宝≥2', job: '卷帘夺宴', held: [],
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
      // 驯兽师·百兽归心（难64 竹节九狮 收九灵为御兽）：全英雄级，凭「出阵灵兽 + 御兽套」觉醒（V8.22 宠物修订版）
      // 效果由御兽套共鸣 applySetResonance perPet 缩放实现，此处仅注册条目，不重复叠加（effect 留空）
      { trial: 64, cond: '夺 + 出阵灵兽≥3', job: '驯兽师·百兽归心', held: [],
        effect: {}, note: '收九灵为御兽，上阵灵兽越多全属性越强（御兽套共鸣）' },
      // 逆兽师·百逆归心（难64 竹节九狮 逆道变体）：承「逆」道之驯兽隐藏职，与驯兽师(夺)同源异道。
      // 触发不在 trials81.js（避免触碰并行会话文件），由 game.js 在难64 + 逆路线 + 出阵灵兽≥3 + 御兽套 时独立觉醒；
      // 觉醒后于 equipment.js 再 +1 出战位、御兽套逆道共鸣再 ×1.5（叠加 isNiRoute 基础增幅）。
      { trial: 64, cond: '逆 + 出阵灵兽≥3', job: '逆兽师·百逆归心', held: [],
        effect: {}, note: '逆道驯兽，逆修之兽更凶（额外出战位 + 御兽逆道增幅）' },
      // —— 参照「冒险日记事件装备体系」新增的特殊隐藏职（六道平衡 2026-09-12）——
      // 条件以「日记装备≥N」为凭证：日记里记载的事件专属奇物（id 以 ev_ 开头）收集越多，越可触达。
      // 补足此前缺隐藏职的章节：act3(难13)/act12(难50)/act16(难77)，并 enrichment act15(难66)。
      { trial: 13, cond: '渡 + 日记装备≥1', job: '定风金蝉', hero: 'tangseng', held: [],
        effect: { bonus: { ti: { hp: 60, eva: 0.10 }, yuan: { dr: 0.03 } } },
        note: '缘路拾奇，风不能迷其眼（参照冒险日记·事件奇物门槛）' },
      { trial: 50, cond: '夺 + 日记装备≥3', job: '九头·掠宝', hero: 'wukong', held: [],
        effect: { bonus: { ti: { atk: 25, dr: 0.04 }, passive: { glutton: 0.10 } } },
        note: '逆夺九虫佛宝，日记载其名（夺道+日记奇物门槛）' },
      { trial: 66, cond: '渡 + 日记装备≥2', job: '净坛·拾遗', hero: 'bajie', held: [],
        effect: { bonus: { ti: { hp: 80 }, yuan: { heal: 0.06 } } },
        note: '渡了玉兔，行囊里多了几件奇物（渡道+日记奇物门槛）' },
      { trial: 77, cond: '逆 + 日记装备≥4', job: '行旅录主', hero: 'all', held: [],
        effect: { bonus: { ti: { atk: 15, hp: 60 }, yuan: { atk: 10, hp: 40 } }, passive: { restored: true } },
        note: '一路奇物皆入日记，逆上灵山以物证道（全英雄·日记奇物门槛）' },
      // —— 章节分布补全（2026-09-12）：填充 章4/5/6 缺隐藏职的英雄，使每非序章无全英雄职的章节覆盖全部五英雄 ——
      // 章4（车迟国/通天河，难28-36）：补 唐/八/沙
      { trial: 28, cond: '渡 + 善≥25', job: '车迟·谕道', hero: 'tangseng', held: [],
        effect: { bonus: { ti: { hp: 120, dr: 0.06, mdef: 0.05 }, good: 10 }, passive: { mercy: 0.06 } },
        hint: '车迟国祈雨谕道，顺命者得天助——踏实走「渡」、善行满二十五', note: '车迟国祈雨，顺命者得天时' },
      { trial: 31, cond: '战 + 战≥2', job: '车迟·力士', hero: 'bajie', held: [],
        effect: { bonus: { ti: { atk: 25, hp: 120, dr: 0.04 } }, passive: { sunder: 0.05 } },
        hint: '车迟斗法扛山，力士之勇——一贯以「战」收场两难', note: '车迟斗法，力士扛山' },
      { trial: 32, cond: '渡 + 善≥20', job: '沙·问渡', hero: 'shaseng', held: [],
        effect: { bonus: { ti: { hp: 140, dr: 0.05, mdef: 0.05 } }, passive: { restored: true } },
        hint: '通天河问渡，河神指路——走「渡」、善行满二十', note: '通天河问渡，河神指路' },
      // 章5（女儿国/真假猴王，难37-45）：补 八/白龙/沙
      { trial: 37, cond: '隐 + 隐≥2', job: '白龙·渡河', hero: 'xiaobailong', held: [],
        effect: { bonus: { ti: { spd: 3, eva: 0.06, cri: 0.04 } }, passive: { reverseScale: true } },
        hint: '女儿国渡河，龙隐水脉——一贯以「隐」收场两难', note: '女儿国渡河，白龙隐身水脉' },
      { trial: 40, cond: '战 + 战≥2', job: '八戒·护禅', hero: 'bajie', held: [],
        effect: { bonus: { ti: { atk: 22, hp: 100, dr: 0.04 } }, passive: { glutton: 0.12 } },
        hint: '蝎精摄僧，八戒护禅——以「战」退敌', note: '蝎精摄僧，八戒护禅' },
      { trial: 42, cond: '渡 + 善≥20', job: '沙·辨假', hero: 'shaseng', held: [],
        effect: { bonus: { ti: { hp: 130, dr: 0.05, mdef: 0.06 } }, passive: { restored: true, mReflectBoost: 0.08 } },
        hint: '真假之间，沙僧独辨——走「渡」、善行满二十', note: '真假之间，沙僧独辨' },
      // 章6（火焰山/祭赛国，难46-54）：补 八/白龙/沙/唐（罗刹·铁扇为全英雄，已另立）
      { trial: 46, cond: '战 + 战≥3', job: '净坛·踏焰', hero: 'bajie', held: [],
        effect: { bonus: { ti: { atk: 28, hp: 130, dr: 0.04 } }, passive: { glutton: 0.14 } },
        hint: '火焰山踏焰，净坛吞火——一贯以「战」三难', note: '火焰山踏焰，净坛吞火' },
      { trial: 48, cond: '渡 + 善≥25', job: '白龙·吐水', hero: 'xiaobailong', held: [],
        effect: { bonus: { ti: { hp: 130, mdef: 0.06, eva: 0.05 } }, passive: { restored: true } },
        hint: '化龙吐水，灭焰济众——走「渡」、善行满二十五', note: '化龙吐水，灭焰济众' },
      { trial: 52, cond: '缘 + 缘≥4', job: '卷帘·守舍利', hero: 'shaseng', held: [],
        effect: { bonus: { ti: { hp: 150, dr: 0.06, mdef: 0.06 } }, passive: { restored: true } },
        hint: '金光寺守舍利，卷帘护宝——一贯以「缘」四难', note: '金光寺守舍利，卷帘护宝' },
      { trial: 53, cond: '缘 + 缘≥3', job: '金蝉·谕经', hero: 'tangseng', held: [],
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
    // 7) 驯兽师·出阵灵兽门槛（难46·竹节九狮 收九灵为御兽）：需实际出阵 ≥N 只灵兽，且着御兽套装备
    //    （V8.22 宠物修订版接入；依赖于 equipment.js 的 activeEquipsFor，运行时已就绪）
    if (c.indexOf('出阵灵兽≥') >= 0) {
      const mm9 = c.match(/出阵灵兽≥(\d+)/);
      const need = +(mm9 && mm9[1]) || 0;
      let petN = 0, hasYushou = false;
      try {
        const act = (window.NDX && NDX.activeEquipsFor) ? NDX.activeEquipsFor(s) : (s.equips || []);
        petN = (act || []).filter((e) => e && e.slot === 'pet').length;
        hasYushou = (act || []).some((e) => e && e.set === '御兽');
      } catch (e) {}
      if (petN < need) return fail('plot', { tag: `出阵灵兽≥${need}`, msg: `需出阵 ${need} 只灵兽（当前 ${petN}）` });
      if (!hasYushou) return fail('plot', { tag: '御兽套装备', msg: '需身着御兽套装备后方可收服' });
    }
    // 7.5) 冒险日记装备门槛（六道平衡 2026-09-12 增补）：参照「冒险日记事件装备体系」——
    //   日记装备 = id 以 ev_ 开头的事件专属装备（武器/甲/冠/靴/法宝，仅事件授予、不可掉落/商店）。
    //   收集日记里记载的奇物，是「行旅录主」一类特殊隐藏职的凭证。
    //   语法：日记装备≥N（持有件数）/ 持ev_<id>（持有指定一件日记装备）。
    m = c.match(/日记装备≥(\d+)/);
    if (m) {
      const need = +m[1];
      const cur = (s.equips || []).filter((e) => e && String(e.id || '').indexOf('ev_') === 0).length;
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
    const _KNOWN = /^(逆|渡|缘|战|夺|隐|衡)$|^(逆|渡|缘|战|夺|隐)≥\d+$|^夺宝≥\d+$|^(战|渡|缘|夺|隐|逆)\s*[xX]\s*\d+$|^(善|恶)≥\d+$|^闪避≥(阈值|\d+)$|^(第3打选渡|第29难曾选逆|真·逆道结局|助讨龙筋|问九世因|扶新王)$|^出阵灵兽≥\d+$|^日记装备≥\d+$|^持ev_[a-z0-9_]+$/;
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
  NDX.hiddenJobEntry = function (hero, job) {
    const list = NDX.HIDDEN_JOBS[hero] || [];
    return list.find((x) => x.job === job) || null;
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
