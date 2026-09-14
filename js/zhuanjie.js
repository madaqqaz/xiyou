/* =============================================================================
 * 逆道西行 · 六道专职转职子系统（集中条件?+ 事件判定点）
 * -----------------------------------------------------------------------------
 * 对应设计定稿：《六套专职装?· 三阶转职 · 合成进化链》V8.18
 *   §2 逆命一周目开放（仅三处灵山判定锁二周目论道后? *   §3 与英雄专属隐藏职双轨并存（槽位分?/ 事件优先队列 / forbidFlags 守卫? *   §4 转职只作用取经人数值，不砍弟子/随从助战
 *   §5 六道统一门槛 + 行为累计 4/9/15 加权?+ 岁月/心魔收敛
 *   §6 合成拆解返还（≤2次）+ 专属遗物确定获取
 *   §7 集中条件?+ 事件判定点聚合判? *   §8 六套 flag / signature 岁月 / 三转大额返岁月（仅两处保留）
 *
 * 挂载?NDX.ZHUANJIE，操作一个通用局?state（含 s.fate / s.act / s.good /
 *   s.niInsights / s.flags.tierUp / s.materials / s.equips），并尽力复用既? *   NDX.getCycle / NDX.isCycle2 / NDX.RECIPES。模块自包含、可无头回测? * 加载顺序：data.js ?equipment.js ?zhuanjie.js ?…（需?combat.js 前）? * ========================================================================== */
(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;
  var Z = (NDX.ZHUANJIE = {});
  Z.VERSION = 1;

  /* ----------------------------- 周目 / 论道助手 ----------------------------- */
  Z.cycle = function (s) {
    if (s && typeof s.flags === 'object' && typeof s.flags.cycle === 'number') return s.flags.cycle;
    if (NDX.getCycle) { try { var c = NDX.getCycle(); if (c && c > 0) return c; } catch (e) {} }
    if (NDX.isCycle2 && NDX.isCycle2()) return 2;
    return 1;
  };
  Z.isCycle2 = function (s) { return Z.cycle(s) >= 2; };
  // 论道开启：二周?+ s.niInsights 集满 3 条（沿用项目既定触发?  
  Z.lundaoOpen = function (s) {
    var ins = (s && s.niInsights) || [];
    return Z.isCycle2(s) && (ins.length || 0) >= 3;
  };

  /* ============================ 六道专职元数?============================ */
  // 道键→专职类。tier[0/1/2] = 一/二/三转；行为累计：战/夺为标准 4/9/15；逆为高难度下调档 4/8/13（V8.2）。章节统一 4/6/7（V8.1）  
  Z.CLASSES = {
    '渡': {
      cls: '玄武', dao: '渡',
      tier: ['厚土守心', '山河载苦', '万劫地藏'],
      sig: '渡厄结缘', t3Year: true,                      // §5.3 三转大额返岁月保留      
      attrs: { atkPct: 0.12, hpPct: 0.4, drPlus: 0.2, shieldPct: 0.18, hpRegen: 16 },
      alignMin: [25, null, null],                          // §5.1 一转玄武需 善≥25
      daoGate: [18, 28, 38], behGate: [4, 8, 13], actGate: [2, 5, 8], behType: '渡化',
    },
    '缘': {
      cls: '玄武', dao: '缘',
      tier: ['结缘行者', '命数执手', '造化牵机'],
      sig: '惜缘得时', t3Year: false, t3Type: 'casual',    // 三转回报=因果资源
      attrs: { atkPct: 0.1, hpPct: 0.26, drPlus: 0.14, crit: 0.12, eva: 0.1 },
      daoGate: [18, 28, 38], behGate: [4, 8, 13], actGate: [2, 5, 8], behType: '机缘',
    },
    '战': {
      cls: '破军', dao: '战',
      tier: ['摧锋战士', '千伤战神', '碎世狂将'],
      sig: '死战求存', t3Year: false, t3Type: 'battle',    // §5.4 破军=单体/压制/旧伤
      attrs: { atkPct: 0.42, hpPct: 0.22, drPlus: 0.1, sunder: 0.3, crit: 0.15, bossDmg: 0.25, oldWound: 0.2 },
      daoGate: [18, 28, 38], behGate: [4, 9, 15], actGate: [3, 6, 9], behType: '正面击溃', behUnit: '精英',
    },
    '夺': {
      cls: '贪狼', dao: '夺',
      tier: ['噬血', '吞骸', '万劫狼主'],
      sig: '掠夺血食', t3Year: false, t3Type: 'loot',      // §5.4 贪狼=AOE/吸血/血换输''      
      attrs: { atkPct: 0.36, hpPct: 0.18, drPlus: 0.06, lifesteal: 0.25, multi: 0.4, crit: 0.1 },
      daoGate: [18, 28, 38], behGate: [4, 9, 15], actGate: [4, 7, 9], behType: '击杀', behUnit: '任意敌对',
    },
    '隐': {
      cls: '影遁', dao: '隐',
      tier: ['幽行者', '虚陌行者', '无迹幽冥'],
      sig: '避祸求安', t3Year: false, t3Type: 'evade',     // 三转新增【回影入世''      
      attrs: { atkPct: 0.14, hpPct: 0.3, drPlus: 0.16, eva: 0.28, vanish: 0.2, evadeLoot: 0.25 },
      daoGate: [18, 28, 38], behGate: [4, 8, 13], actGate: [3, 6, 8], behType: '规避',
    },
    '逆': {
      cls: '逆命', dao: '逆',
      tier: ['悖道行者', '乱纲狂徒', '问天之逆子'],
      sig: '逆道僭越', t3Year: true,                       // §5.3 逆命归时保留（灵山段锁二周目''      
      attrs: { atkPct: 0.4, hpPct: 0.2, drPlus: 0.12, chaos: 0.3, paradox: 0.25 },
      daoGate: [18, 28, 38], behGate: [4, 8, 13], actGate: [4, 7, 9], behType: '悖逆',
      // §2 逆命仅三处灵山判定锁二周目论道后；数值与一二转一周目即可触发
      lingshanLocks: ['tier3Narrative', 'verdict', 'returnFall'],
    },
  };
  Z.DAOS = Object.keys(Z.CLASSES);

  /* ============================ 集中条件表（7.1?============================ */
  // 每个转职台阶?道点?行为累计/善恶/章节/守卫 归一化为一条门槛记录?  
  Z.gateOf = function (dao, tierIdx) {
    var C = Z.CLASSES[dao]; if (!C) return null;
    tierIdx = tierIdx == null ? 0 : tierIdx;
    if (tierIdx < 0 || tierIdx > 2) return null;
    return {
      dao: dao, cls: C.cls, tier: tierIdx,
      name: C.tier[tierIdx],
      daoNeed: C.daoGate[tierIdx],        // 道点数门槛（s.fate[dao]?      
      behNeed: C.behGate[tierIdx],        // 行为累计门槛
      actNeed: C.actGate[tierIdx],        // 章节下限（≥第X章）
      alignMin: C.alignMin ? C.alignMin[tierIdx] : null, // ?恶硬性（玄武一?善≥25?      
      t3Year: C.t3Year, t3Type: C.t3Type,
      // 三处灵山判定锁（仅逆命）：tier2=L3叙事特权 / verdict / returnFall
      lingshan: (C.lingshanLocks ? C.lingshanLocks[tierIdx] : null) || null,
    };
  };

  // 计算某道当前已达成转职阶?=未转?=一转，2=二转?=三转?  
  Z.currentTier = function (s, dao) {
    if (!s || !s.flags) return 0;
    s.flags.tierUp = s.flags.tierUp || {};
    s.flags.tierUp.current = s.flags.tierUp.current || {};
    return s.flags.tierUp.current[dao] || 0;
  };
  Z.setTier = function (s, dao, t) {
    if (!s || !s.flags) return;
    s.flags.tierUp = s.flags.tierUp || {};
    s.flags.tierUp.current = s.flags.tierUp.current || {};
    var _prev = s.flags.tierUp.current[dao] || 0;
    var _next = Math.max(0, Math.min(3, t | 0));
    s.flags.tierUp.current[dao] = _next;
    // 六道转职升阶：仅阶数真正提升时奏「四连上行」（存档回写等同阶不发声）
    if (_next > _prev && NDX.sfx) NDX.sfx('levelup');
  };

  // 行为累计：每道独立计数，权重作用于当道的门槛判定（加权档已体现在 behGate）?  
  // 模块七·诚实化：行为累计当前由「每道抉择次数」驱动（game.js _gainFate → _maybePromote 传 i?choice?），
  // 非「击杀/精英/渡化」等实战行为分型。behType/behUnit 仅作 CLASSES 语义标注与门槛文案，
  // 不作为统计口径。按实战行为分型的行为统计记为可记录债务（见开发文档，避免「声称实现却未实现」）。
  Z.behavior = function (s, dao) {
    if (!s || !s.flags) return 0;
    s.flags.tierUp = s.flags.tierUp || {};
    s.flags.tierUp.behavior = s.flags.tierUp.behavior || {};
    return s.flags.tierUp.behavior[dao] || 0;
  };
  Z.accumulate = function (s, dao, type, qty) {
    if (!s || !s.flags) return;
    if (!Z.CLASSES[dao]) return;
    s.flags.tierUp = s.flags.tierUp || {};
    s.flags.tierUp.behavior = s.flags.tierUp.behavior || {};
    // §6.4 ?夺全局互斥闸门：破??与贪??不可并行堆专职。一方命数达互斥阈值即停另一?    // 转职行为累计；只闸专职进度，命运点数仍可涨（不破坏命运主导线 / 拓印 / 难簿，实现机制分流）?
    var gate = Z.exclusiveGate(s, dao);
    if (gate.gated) {
      return { gated: true, stop: gate.stop, dao: dao, v: s.flags.tierUp.behavior[dao] || 0 };
    }
    var v = (s.flags.tierUp.behavior[dao] || 0) + (qty || 1);
    s.flags.tierUp.behavior[dao] = v;
    // §5.4 回影入世前置积累：隐择积「幽影」，?缘择积「结缘」，供三转重介入消'
    if (dao === '隐') Z.addGhost(s, 1);
    if (dao === '战' || dao === '夺') Z.addKarma(s, 1);
    return v;
  };

  // §6.4 互斥闸判定辅助（纯函数，可单测）?  //   战↔夺互斥，互斥阈?MUTEX_AT=16（略低于一?daoGate 18）。一方命数达 16 ?停另一方专职'  
  Z.MUTEX_AT = 16;
  Z.MUTEX_PAIRS = { '战': '渡', '夺': '缘' };
  Z.exclusiveGate = function (s, dao) {
    var stop = Z.MUTEX_PAIRS[dao];
    if (!stop || !s || !s.fate) return { gated: false, dao: dao || null };
    if ((s.fate[stop] || 0) < Z.MUTEX_AT) return { gated: false, dao: dao };
    return { gated: true, dao: dao, stop: stop, stopAt: s.fate[stop] || 0 };
  };

  // 守卫：forbidFlags —?已被触发的转职台?key，oncePerGame?  
  Z.forbidden = function (s, key) {
    if (!s || !s.flags) return false;
    s.flags.tierUp = s.flags.tierUp || {};
    return !!(s.flags.tierUp.forbid && s.flags.tierUp.forbid[key]);
  };
  Z.forbid = function (s, key) {
    if (!s || !s.flags) return;
    s.flags.tierUp = s.flags.tierUp || {};
    s.flags.tierUp.forbid = s.flags.tierUp.forbid || {};
    s.flags.tierUp.forbid[key] = true;
  };

  // 章节识别：优先 s.act；实机用 NDX.chapterOf(node.diff)（难号→17地区号）
  // V8.37 修复标尺错位：actGate=[2,6,7] 是9章制门槛，chapterOf返回17地区号，
  //       原逻辑直接用17地区号对比9章制门槛，导致二/三阶提前至地区6/7解锁。
  //       新增 regionToActChapter 映射：17地区→9章，使转职门槛与设计意图对齐。
  Z.chapterOf = function (s) {
    var raw = 0;
    if (s && typeof s.act === 'number') raw = s.act;
    else {
      var prog = 0;
      if (s) {
        if (typeof s.diff === 'number') prog = s.diff;
        else if (s.pending && typeof s.pending.act === 'number') raw = s.pending.act;
        else if (NDX.globalProgress) { try { prog = NDX.globalProgress(s); } catch (e) {} }
      }
      if (!raw && NDX.chapterOf) { try { raw = NDX.chapterOf(prog || 1); } catch (e) {} }
    }
    // 映射为9章制（转职actGate用）
    if (NDX.regionToActChapter) { try { return NDX.regionToActChapter(raw || 1); } catch (e) {} }
    return raw || 0;
  };

  // 单个台阶是否已完全达成（不含「是否已触发」）。逆命三处灵山锁在此生效?  
  Z.gateMet = function (s, gate) {
    var fateC = (s && s.fate && s.fate[gate.dao]) || 0;
    if (fateC < gate.daoNeed) return false;
    if (Z.behavior(s, gate.dao) < gate.behNeed) return false;
    if (gate.actNeed && Z.chapterOf(s) < gate.actNeed) return false;
    if (gate.alignMin != null && ((s && s.good || 0) < gate.alignMin)) return false;
    // 注：逆命三处「灵山结局判据改写」不拦转职阶本身（? 逆命三转一周目可达成）?    // ?Z.lingshanLocked(s, key) 在具体结局判定调用点作运行时守卫'
    return true;
  };
  Z.gateKey = function (dao, tierIdx) { return dao + '@' + tierIdx; };

  /* ==================== 模块七·专职命数深度复利（六道的复利兑现）==================== */
  // 六道命数（s.fate[dao]）过去只作 daoGate 线性门槛：达 18/28/38 即转职，再积无用。
  // 本模块引入「命数深度乘区」：某道专职入阶后，若其命数仍继续超出「当前阶门槛」，
  // 超出部分按档位放大该道专职收益——命数越深、专职越强，兑现「六道复利」。
  // 纯附加放大（未超门槛恒为 1，不退化/不伤既有基线），全程封顶防溢出。
  Z.DEPTH_DIV = 6;         // 每溢出 6 点命数 → 1 档
  Z.DEPTH_STEP = 0.06;     // 每档 +6%
  Z.DEPTH_TIER_CAP = 5;    // 至多 5 档（+30% 封顶，溢出 30 点后不再涨）
  // 命数深度乘区：返回该道当前专职收益应放大的倍率（≥1）。s.fate 低于/等于当前阶门槛时恒为 1。
  Z.fateDepthMult = function (s, dao) {
    if (!s || !s.fate || !Z.CLASSES[dao]) return 1;
    var t = Z.currentTier(s, dao);
    if (!t) return 1;                                   // 未入阶：无专职收益可放大
    var gateNeed = Z.CLASSES[dao].daoGate[Math.min(t - 1, 2)] || 0; // 当前阶所需 daoNeed
    var f = s.fate[dao] || 0;
    if (f <= gateNeed) return 1;
    var tiers = Math.floor((f - gateNeed) / Z.DEPTH_DIV);
    return 1 + Math.min(tiers, Z.DEPTH_TIER_CAP) * Z.DEPTH_STEP;
  };

  // 转职词条聚合：把已达成阶(1-3)的六?attrs 合并为战斗可消费的百分比/增量加成?  // 数值按「当前阶/3」线性生效；识别类词条回?engineTier 供回合内?词缀扩展?  // combat.computeStats ?bonus.tier 消费（见 combat.js）'  
  Z.tierBonus = function (s) {
    var heroId = s && s.hero;
    var res = { atkPct: 0, hpPct: 0, drPlus: 0, eva: 0, cri: 0, hpRegen: 0, engineTier: {} };
    Z.DAOS.forEach(function (dao) {
      var t = Z.currentTier(s, dao);
      if (!t) return;
      var A = Z.CLASSES[dao].attrs || {};
      var k = t / 3;
      // 本命道放大（V8.5x 身份透镜）：英雄走自己的本命道时，该道转职收益按 NDX.HOME_DAO_MULT 放大。
      // 非本命道仍全额计入（万世剑冢式：人人可走全部路线，只是本命道更划算）。
      var hm = (typeof NDX.homeDaoMult === 'function') ? NDX.homeDaoMult(heroId, dao) : 1;
      // 模块七·命数深度复利：超出「当前阶门槛」的命数按档放大该道专职收益（封顶 +30%）。
      var dm = Z.fateDepthMult(s, dao);
      var mul = k * hm * dm;
      res.atkPct += (A.atkPct || 0) * mul;
      res.hpPct += (A.hpPct || 0) * mul;
      res.drPlus += (A.drPlus || 0) * mul;
      res.eva += (A.eva || 0) * mul;
      res.cri += (A.crit || 0) * mul;
      res.hpRegen += (A.hpRegen || 0) * mul;
      ['sunder', 'lifesteal', 'multi', 'bossDmg', 'oldWound', 'vanish', 'chaos', 'paradox', 'shieldPct', 'evadeLoot'].forEach(function (kk) {
        if (A[kk]) res.engineTier[kk] = (res.engineTier[kk] || 0) + (A[kk] * mul);
      });
    });
    return res;
  };

  /* ===================== 事件判定点（聚合判定?.1?===================== */
  // 一次性评?6 ?× 3 阶的全部待解锁转职。it creates a queue, only the NEXT
  // 未触发且达成的台阶会被弹出（进阶必须逐阶 0→1→2），§3 优先队列保证同节点只弹一个  
  Z.evaluate = function (s) {
    var out = [];
    Z.DAOS.forEach(function (dao) {
      var cur = Z.currentTier(s, dao);
      if (cur >= 3) return;                    // 已满
      var gate = Z.gateOf(dao, cur);     // 下一步必须是「恰好下一阶」
      if (!gate) return;
      if (Z.forbidden(s, Z.gateKey(dao, cur))) return;
      if (Z.gateMet(s, gate)) out.push(gate);
    });
    // 优先队列：按章节分量的汇报——同读者在同一节点只稳步前进一步，但列表供 UI 展示全部可达?
    out.sort(function (a, b) { return (a.actNeed - b.actNeed) || (a.tier - b.tier); });
    return out;
  };

  // 取「本节点唯一应弹」的转职事件：优先队列只弹一个，其余顺延（?）?  
  Z.nextEvent = function (s) {
    var list = Z.evaluate(s);
    if (!list.length) return null;
    // latching：同一节点已弹过则不重复弹
    s.flags.tierUp = s.flags.tierUp || {};
    if (s.flags.tierUp.nodePopped) return null;
    s.flags.tierUp.nodePopped = true;
    var g = list[0];
    Z.forbid(s, Z.gateKey(g.dao, g.tier));
    Z.setTier(s, g.dao, g.tier + 1);
    return g;
  };
  // 离开节点 / 新章节重置一次?latch（每节点只弹一次）
  Z.enterNode = function (s) {
    if (!s || !s.flags) return;
    s.flags.tierUp = s.flags.tierUp || {};
    s.flags.tierUp.nodePopped = false;
  };

  /* ============================ 合成拆解返还?.1?============================ */
  // L2–L5 可拆回上一级坯?组件/部分材料；单局拆解 ? ?+ 每次附矿石损耗；
  // 不可拆回核心专属遗物（防无限生成遗物）'
  Z.MAX_DISASSEMBLY = 2;
  Z.disassemble = function (s, prevTierItem, matsBack) {
    if (!s || !s.flags) return { ok: false, why: 'no-state' };
    s.flags.tierUp = s.flags.tierUp || {};
    var used = s.flags.tierUp.disassembled || 0;
    if (used >= Z.MAX_DISASSEMBLY) return { ok: false, why: '超过本局拆解上限' };
    if (!matsBack || !matsBack.length) return { ok: false, why: '缺返还配' };
    s.flags.tierUp.disassembled = used + 1;
    s.materials = s.materials || {};
    // 拆解损耗：少量矿石（确定性，便于调参'
    var loss = { '矿石': 1 };
    var got = [];
    matsBack.forEach(function (m) {
      s.materials[m] = (s.materials[m] || 0) + 1;
      got.push(m);
    });
    Object.keys(loss).forEach(function (k) {
      var have = s.materials[k] || 0;
      s.materials[k] = Math.max(0, have - loss[k]);
    });
    return { ok: true, got: got, used: used + 1, loss: loss };
  };

  /* ============================ 专属遗物?.2?============================ */
  // 每套专属遗物给「确定获取途径」，杜绝纯随机卡?L5'  
  Z.RELICS = {
    '渡': { id: 'xuanwu_lingjia',  name: '玄武灵甲残片', route: '章秘境商店固'+' 渡化妖王主线必掉' },
    '夺': { id: 'tanlan_ya',       name: '贪婪獠牙残片', route: '夺向支线必掉（掠魂系列事件）' },
    '战': { id: 'pojun_cui',       name: '摧锋战魂残片', route: '战场类主?Boss 必给（第7章某强敌' },
    '隐': { id: 'yingdun_ys',      name: '幽纱残片',     route: '山林洞窟隐藏商店固定出售' },
    '缘': { id: 'yinyuan_zl',      name: '造化线残',   route: '寺庙道场机缘事件最高档奖励（必得档' },
    '逆': { id: 'niming_luan',     name: '乱纲残片',     route: '逆道幻境隐藏事件固定（逆道可用时）' },
  };

  /* ============================ 专属遗物·确定性授予（6.2?============================ */
  // 六条 route 落到两处确定性面：主?关隘 Boss 必掉「当前主导道」遗物（??夺主线）?  // 坊市固定出售未获的主导道残片（兜底，呼应隐·洞窟商店）。均幂等，杜绝纯随机卡死 L5'  
  Z.dominantDao = function (s) {
    if (!s || !s.fate) return null;
    var best = null, bestN = -1;
    Z.DAOS.forEach(function (dao) {
      var n = s.fate[dao] || 0;
      if (n > bestN) { bestN = n; best = dao; }
    });
    return bestN > 0 ? best : null;   // 未抉命运（无主导道）则不授，避免强迫站队
  };
  Z.relicOf = function (dao) { return (dao && Z.RELICS[dao]) || null; };
  // 按残片 id 反查：遗物残片是「材料」（s.materials 入库），不存在装备池，UI/合成按 id 查名展示
  Z.relicById = function (id) {
    if (!id) return null;
    for (var d in Z.RELICS) { if (Z.RELICS[d].id === id) return { id: id, name: Z.RELICS[d].name, dao: d, route: Z.RELICS[d].route }; }
    return null;
  };
  Z.relicDao = function (id) { var r = Z.relicById(id); return r ? r.dao : null; };
  Z.hasRelicById = function (s, id) {
    return !!(s && s.materials && s.materials[id] > 0);
  };
  // comp3(L5) 合成时消耗唯一专属遗物材料：杜绝「一局无限锻造同名 L5」白送（设计定稿 §6.1 不可拆回核心遗物）
  Z.consumeRelicById = function (s, id, log) {
    if (!s) return { ok: false, why: 'no-state' };
    s.materials = s.materials || {};
    if (!(s.materials[id] > 0)) return { ok: false, why: 'no-relic' };
    s.materials[id]--;
    if (s.materials[id] <= 0) delete s.materials[id];
    var r = Z.relicById(id);
    if (r && log && typeof log === 'function') log(`【三转】熔入${r.name}，铸成整套灵性（遗物耗去，此局不再返场）`);
    return { ok: true, id: id };
  };
  Z.haveRelic = function (s, dao) {
    var r = Z.RELICS[dao]; if (!r || !s) return false;
    if (s.materials && s.materials[r.id] > 0) return true;
    return !!(s.flags && s.flags.hasRelic && s.flags.hasRelic[r.id]);
  };
  Z.giveRelic = function (s, dao, log) {
    var r = Z.RELICS[dao]; if (!r) return { ok: false, why: 'no-relic' };
    s.materials = s.materials || {}; s.flags = s.flags || {};
    s.flags.hasRelic = s.flags.hasRelic || {};
    var first = !(s.materials[r.id] > 0);
    s.materials[r.id] = (s.materials[r.id] || 0) + 1;
    s.flags.hasRelic[r.id] = true;
    if (first && log && typeof log === 'function') log(`【专属遗物】获得${r.name}」—${r.route}`);
    return { ok: true, id: r.id, name: r.name, first: first };
  };

  /* ============================ 三转回报定向?.3?============================ */
  // 仅玄武·地藏渡世、逆命·逆命归时 保留「大额返还旅途年月」；其余四套差异化回报'  
  Z.t3Reward = function (dao) {
    var C = Z.CLASSES[dao]; if (!C) return null;
    if (C.t3Year) return { type: 'year', note: '大额返还旅途年月（全局限量序号，见 §5.3 全局限量' };
    var map = { battle: '短期攻防 + 旧伤增伤（破军）', loot: '劫印碎片 / 战利品（贪狼）', evade: '规避奖励 + 【回影入世】重介入（影遁）', casual: '经文 / 锻造材料（玄武·缘道）' };
    return { type: C.t3Type || 'other', note: map[C.t3Type] || '差异化回' };
  };

  /* ============================ 三转 / 二周目锁??============================ */
  // 逆命三处灵山判定：tier3Narrative / verdict / returnFall 只有在论道激活后放行'  
  Z.lingshanLocked = function (s, lockKey) {
    var CW = Z.CLASSES['渡'];
    if (!CW || CW.lingshanLocks.indexOf(lockKey) < 0) return false;
    return !Z.lundaoOpen(s);
  };
  // §5.3 全局限量：任意一局内「大额返还岁月」事件限?? 处（锁定 signature）?  
  Z.yearReturnSlots = function (s) {
    if (!s || !s.flags) return { left: 2, max: 2 };
    s.flags.tierUp = s.flags.tierUp || {};
    var used = s.flags.tierUp.bigYearReturn || 0;
    return { left: Math.max(0, 2 - used), max: 2, used: used };
  };
  Z.spendBigYearReturn = function (s) {
    if (!s || !s.flags) return false;
    var r = Z.yearReturnSlots(s);
    if (r.left <= 0) return false;
    s.flags.tierUp.bigYearReturn = r.used + 1;
    return true;
  };
  // §5.3 收敛上限：三转阶段每场固定消耗岁?/ 心魔暴涨，设「每章累计上?+ 单场封顶」?  
  Z.actCap = function (s, kind) {
    var CAPS = { year: { perAct: 14, perFight: 3 }, heart: { perAct: 16, perFight: 4 } };
    return CAPS[kind] || CAPS.year;
  };

  /* ============================ 缘劫反噬保底?.4·缘道归玄武） ============================ */
  // 【缘劫反噬】：高价值机缘（玄武·缘道）事件可能反噬——重大失败扣岁月/善恶。保底三措：
  //   ?单局反噬次数硬上??（用尽即绝无反噬，杜绝「失败无限累积」）
  //   ?条件概率：非纯随机——基?+ 风险上探 - 善修 - 缘修为，夹在 [0.05,0.35]
  //   ?重大失败扣减免随善修递减（善?0 免扣善恶、≥60 岁月降至 1），不无限累积濒死扣
  Z.MAX_KARMA_BACKLASH = 3;
  Z.karmaSlots = function (s) {
    if (!s || !s.flags) return { used: 0, left: Z.MAX_KARMA_BACKLASH, max: Z.MAX_KARMA_BACKLASH };
    s.flags.tierUp = s.flags.tierUp || {};
    var used = s.flags.tierUp.karmaBacklash || 0;
    return { used: used, left: Math.max(0, Z.MAX_KARMA_BACKLASH - used), max: Z.MAX_KARMA_BACKLASH };
  };
  // 条件概率?..1）。返回?0 表示保底（次数用尽），调用方应直接判为不反噬?  
  Z.karmaBacklashChance = function (s, opts) {
    if (Z.karmaSlots(s).left <= 0) return 0;              // 保底①：用尽即绝无反噬
    opts = opts || {};
    var good = (s && typeof s.good === 'number') ? Math.max(0, s.good) : 0;
    var yuan = (s && s.fate && s.fate['缘']) ? s.fate['缘'] : 0;
    var p = 0.18 + (opts.risk || 0);                      // 基准 + 高风险机缘上调
    p -= Math.min(good / 50, 0.10);                       // 善修心减
    p -= Math.min(yuan / 120, 0.06);                      // 缘修为再减
    return Math.max(0.05, Math.min(p, 0.35));             // 有底有顶（保底②）
  };
  // 重大失败扣减免（保底③）：随善修减免，不无限累积扣岁?善恶'  
  Z.karmaPenalty = function (s) {
    var good = (s && typeof s.good === 'number') ? Math.max(0, s.good) : 0;
    var year = Math.max(1, 3 - Math.floor(good / 30));    // 善≥60 ?岁月降至 1
    var alignEvil = good >= 30 ? 0 : 2;                   // 善≥30 ?不再叠罪?
    return { year: year, alignEvil: alignEvil };
  };
  // 消耗一次本局反噬额度；达到上限即拒（保底①）'  
  Z.karmaConsume = function (s) {
    if (!s || !s.flags) return { ok: false };
    var st = Z.karmaSlots(s);
    if (st.left <= 0) return { ok: false, why: '本局反噬次数已用', used: st.used, left: 0 };
    s.flags.tierUp.karmaBacklash = st.used + 1;
    return { ok: true, used: st.used + 1, left: st.left - 1 };
  };
  // 统一入事件口：掷一次反噬判定。rnd 注入 [0,1) 便于无头回测（缺省交给事件方掷随机）'  
  Z.karmaTryBacklash = function (s, opts, rnd) {
    var p = Z.karmaBacklashChance(s, opts);
    if (p <= 0) return { backlash: false, chance: p, capHit: true };   // 保底：用尽即绝无反噬
    if (typeof rnd === 'number' && rnd >= p) return { backlash: false, chance: p };
    var c = Z.karmaConsume(s);
    if (!c.ok) return { backlash: false, chance: p, capHit: true };    // 超额兜底为不反噬
    return { backlash: true, chance: p, used: c.used, left: c.left, penalty: Z.karmaPenalty(s) };
  };

  /* ============================ 回影入世?.4 · 影遁三转重介入） ============================ */
  // 【回影入世】：影遁三转「无迹幽冥」后几乎脱离纷争（后期空洞），提供一次性主动重介入当前节点?  //   前置积累——隐择积【幽影】（累计?accumulate），?缘择积【结缘（karmaBon）】；
  //   可用条件——影遁三?+ 幽影满层 + 有足额岁?寿命 life) ?结缘?  //   消耗——满层幽影清?+ 扣岁?costYear) + 扣结?costKarma)?  //   限制——同节点仅一?+ 单局 ? 次（防滥用于反复刷同一节点奖励）?
  Z.MAX_GHOST = 4;        // 幽影满层层数
  Z.MAX_HUIYING = 2;      // 单局重介入上限
  Z.costDays = 90;        // 每次重介入扣寿（天）[已调优]（2026-09-14）—— V9.7 天数制：真源为天。
                          //   复核：重介入为影遁三转一次性补救、单局上限 2 次（MAX_HUIYING）、另扣 2 结缘；
                          //   90 天≈0.25 年占余寿约 1%，有代价但不致形同虚设，无门禁引用、无 Telemetry 反证，确认保持。
  Z.costYear = 90 / 360;  // 兼容字段（年）= costDays / DAYS_PER_YEAR，与 s.life 同轴
  Z.costKarma = 2;        // 每次重介入扣结缘  
  Z.ghostStacks = function (s) { return (s && s.ghostLayers) || 0; };
  Z.ghostFull = function (s) { return Z.ghostStacks(s) >= Z.MAX_GHOST; };
  Z.addGhost = function (s, n) {
    if (!s) return 0;
    s.ghostLayers = Math.min(Z.MAX_GHOST, (s.ghostLayers || 0) + ((n || 1) > 0 ? n : 1));
    return s.ghostLayers;
  };
  Z.karmaValue = function (s) { return (s && s.karmaBon) || 0; };
  Z.addKarma = function (s, n) {
    if (!s) return 0;
    s.karmaBon = (s.karmaBon || 0) + (n || 1);
    return s.karmaBon;
  };
  Z.huiyingUsed = function (s) {
    return (!s || !s.flags || !s.flags.tierUp) ? 0 : (s.flags.tierUp.huiyingUsed || 0);
  };
  // 可用性闸口（纯函数，可单测）。key = 当前节点唯一定位（缺省取 diff.layer.col 拼接）'  
  Z.reengageGate = function (s, key) {
    if (!s) return { ok: false, why: 'no-state' };
    if (Z.currentTier(s, '隐') !== 3) return { ok: false, why: '需影遁三转·无迹幽冥' };
    if (!Z.ghostFull(s)) return { ok: false, why: `幽影未满（${Z.ghostStacks(s)}/${Z.MAX_GHOST}），需满层` };
    if (Z.karmaValue(s) < Z.costKarma) return { ok: false, why: `结缘不足（需 ${Z.costKarma}，现 ${Z.karmaValue(s)}）` };
    if (typeof s.life === 'number' && s.life < Z.costYear) return { ok: false, why: `岁月不足（需 ${Z.costYear}）` };
    if (Z.huiyingUsed(s) >= Z.MAX_HUIYING) return { ok: false, why: `本局已重介入 ${Z.MAX_HUIYING} 次（上限）` };
    var k = key || (s.diff + '#' + (s.layer || 0) + '.' + (s.col || 0));
    var last = (s.flags && s.flags.tierUp && s.flags.tierUp.huiyingNode) || null;
    if (last === k) return { ok: false, why: '本节点已重介入过' };
    return { ok: true, key: k, ghost: Z.ghostStacks(s), karma: Z.karmaValue(s), life: s.life };
  };
  // 执行重介入：验证闸口 ?消耗幽?岁月/结缘 ?标记（同结点一?+ 单局上限）。返回描述供 UI/战斗结算'  
  Z.reengage = function (s, key) {
    var g = Z.reengageGate(s, key);
    if (!g.ok) return g;
    s.flags = s.flags || {}; s.flags.tierUp = s.flags.tierUp || {};
    s.ghostLayers = 0;                                    // 满层幽影清零
    s.karmaBon = (s.karmaBon || 0) - Z.costKarma;
    if (typeof s.life === 'number') s.life -= Z.costYear;
    s.flags.tierUp.huiyingNode = g.key;
    s.flags.tierUp.huiyingUsed = (s.flags.tierUp.huiyingUsed || 0) + 1;
    return {
      ok: true, key: g.key, ghost: 0, karmaAfter: s.karmaBon, lifeAfter: s.life,
      used: s.flags.tierUp.huiyingUsed,
      note: `回影入世 · 重介入当前节点（耗寿 ${Z.costDays} 天 + 结缘 ${Z.costKarma}，幽影返空）`,
    };
  };

  // 自检：所有道 × 三阶的门槛与命名完整
  Z.selfCheck = function () {
    var bad = [];
    Z.DAOS.forEach(function (dao) {
      var C = Z.CLASSES[dao];
      if (!C || C.tier.length !== 3) bad.push(dao + ':tier');
      for (var i = 0; i < 3; i++) {
        var g = Z.gateOf(dao, i);
        if (!g) bad.push(dao + '@' + i + ':gate');
        if (!Array.isArray(C.daoGate) || C.daoGate.length < 3) bad.push(dao + ':daoGate');
        if (!Array.isArray(C.behGate) || C.behGate.length < 3) bad.push(dao + ':behGate');
        if (!Array.isArray(C.actGate) || C.actGate.length < 3) bad.push(dao + ':actGate');
        if (C.actGate && i > 0 && !(C.actGate[i] >= C.actGate[i - 1])) bad.push(dao + '@' + i + ':actOrder');
        if (i > 0 && !(C.daoGate[i] >= C.daoGate[i - 1])) bad.push(dao + '@' + i + ':daoOrder');
      }
    });
    return { ok: bad.length === 0, bad: bad };
  };

  /* ============================ §3 边框协调：六道专??英雄专属隐藏?· 同节点只弹一?============================ */
  // 优先级：英雄隐藏职觉?> 六道专职转职。同一选项结算同时排入二者时，六道转职浮层顺延到下一劫?  // deferPromote：把当前挂起的六道转职浮层移入顺延队列；返回被顺延的专职名（无则 null）'  
  Z.deferPromote = function (s) {
    if (!s || !s.pending || !s.pending.promote) return null;
    if (!s._promoteDefer) s._promoteDefer = [];
    var pm = s.pending.promote;
    s._promoteDefer.push(pm);
    delete s.pending.promote;
    return pm && pm.name ? pm.name : '(转职)';
  };
  // drainPromote：进入下一劫节点后（此?s.pending 已被新节点重建），把顺延队列最旧的转职补弹?  // 若新节点自身又排入转职（pending.promote 已占位），则让位、继续顺延到更下一劫'  
  Z.drainPromote = function (s) {
    if (!s || !s._promoteDefer || !s._promoteDefer.length) return null;
    var pm = s._promoteDefer.shift();
    s.pending = s.pending || {};
    if (s.pending.promote) { s._promoteDefer.unshift(pm); return null; }
    s.pending.promote = pm;
    return pm && pm.name ? pm.name : '(转职)';
  };
})();
