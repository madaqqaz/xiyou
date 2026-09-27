// =============================================================
// equipment_part3.js - 装备系统（第三部分：套装共鸣/传承/宠物）
// 从 equipment.js 拆分，独立IIFE结构，可独立加载
// 外部接口 NDX.* 保持不变，调用方无需修改
// 拆分日期: 2026-09-14
// =============================================================

(function () {
  if (!window.NDX) window.NDX = {};
  var NDX = window.NDX;

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
    巡游: {       // 巡游·行路套：经济核心（爬节点额外生金，服务 渡/缘/逆/隐）
      name: '巡游·生金', tier2: { nodeGold: 18 }, tier3: { nodeGold: 45, hpPct: 0.06 } },
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
    明镜: {       // 明镜套（V9.9 心魔隐藏线）：tier3 附「明心见性」——心魔增长 -15%（唯一减幅来源，防叠没）
      name: '明镜·明心', tier2: { drPlus: 0.05, mdefPlus: 0.05 }, tier3: { drPlus: 0.10, mdefPlus: 0.10, xinmoSuppress: 0.15 } },
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
        // ⚠ 2026-09-26：不再硬编码「逆兽师」——改读注册表 NDX.JOB_TREASURE_SYNERGY（data_trials.js）。
        //   顺带把口径从「跨周目觉醒过」收紧到「本局已确认此职」，本职效果不再靠上周目残留触发。
        const _jobs = (NDX.activeJobs ? NDX.activeJobs(s) : []);
        for (const _j of _jobs) {
          const _sy = (NDX.JOB_TREASURE_SYNERGY || {})[_j];
          if (_sy && _sy.perPetMult) _niMult *= _sy.perPetMult;
        }
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
      if (tier.nodeGold) flags.nodeGold = (flags.nodeGold || 0) + tier.nodeGold;
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
  // 🔴 B2（2026-09-25）删除残留常量 `NDX.petSlotCap = 2`：它与真源 `petSlotCapFor(ctx)` 并存，
  //   曾是「第二真源」。历史上 ui_bag / ui_map / ui_modals_1 三处读它，导致开到 4/6 格的玩家
  //   UI 仍显示 2 格（已改读 petSlotCapOf）。槽位一律走 petSlotCapFor / petSlotCapOf。
  // V9.26 经济套·已装备共鸣经济标记（goldPct/shopDiscount/nodeGold）快取，供 enterNode 发放巡游生金
  NDX.equipEconFlags = function (s) {
    const ctx = { atk: 1, maxHp: 1, dr: 0, matk: 1, mdef: 1, eva: 1, cri: 1, criMult: 1, hpRegen: 0, sealDr: 0, flags: {} };
    try { NDX.applySetResonance((s && s.equips) || [], ctx, s); } catch (e) {}
    return ctx.flags;
  };

// ============================================================
//  槽位真源（V9.10 · 用户 2026-09-20 拍板）—— 所有槽位上限一律经此表读取，禁止散落常量
//    · 装备 4 ：兵刃/甲胄/头冠/战靴 各 1（固定，NDX.GEAR_SLOTS）
//    · 随从 4 ：**随行位＝妖王随从 ＋ 徒弟 共用**（用户 2026-09-21 定调），玩家自选上阵（NDX.companionLineupOf）
//    · 灵宠 2 ：+ 逆道 1 + 逆兽师 1 + 成就「兽园初成」1（V9.10 去掉「收徒加槽」）
//    · 劫印 2 ：+ 成就「印海无涯」1 + 劫印拓印等级 + 王朝「礼乐文明」1
//        ⚠ 展示/承载用——劫印自 V3 §1.1 起**全量自动生效**，槽位**不 gate 结算**（用户拍板：保持全量生效）
//    · 法宝 2 ：**2 格全纳真法宝**（B1 v1.1 · 2026-09-25 用户拍板）
//        真法宝＝「祭出式」（treasure:true / treasureId / charges）。
//        🔴 原「被动件」（数值件 / 套装件）已**迁出至装备区第 5 栏「器胚」**（slot:'special'），
//           不再占法宝槽 —— 源头设计只有紫金钵（唐僧）＋ 三根救命毫毛（悟空）两件。
//        槽位可经成就 `slot_treasure` 增加（NDX.achvSlotBonus）。
// ============================================================
NDX.SLOT_CAP = { gear: 4, companion: 4, pet: 2, seal: 2,
  // 法宝：2 格全纳真法宝（主动/被动不再分槽 —— 被动件已迁 special）
  treasure: { active: 2, passiveBase: 0, passiveStep: 99, passiveMax: 0 } };

// 成就给出的槽位加成（单一入口 · 无来源返回 0）：成就 id 见 achievements.js「卷四·收藏」
NDX.achvSlotBonus = function (kind) {
  try {
    if (!NDX.loadAch) return 0;
    const got = NDX.loadAch() || [];
    if (kind === 'seal') return got.indexOf('slot_seal') >= 0 ? 1 : 0;
    if (kind === 'pet') return got.indexOf('slot_pet') >= 0 ? 1 : 0;
    if (kind === 'treasure') return got.indexOf('slot_treasure') >= 0 ? 1 : 0;
  } catch (e) { /* noop */ }
  return 0;
};
// 随行位（**妖王随从 ＋ 徒弟 共用** · 用户 2026-09-21 定调）：4 固定
NDX.companionSlotCap = function () { return NDX.SLOT_CAP.companion; };

// —— 随行位 · 单一真源（V9.13）——
// 池 = 已收服妖王随从（s.followers · NDX.FOLLOWERS）+ 已收徒弟（s.disciples · NDX.DISCIPLE_LIB）。
// 上阵 = s.companionLineup（key 列表，形如 'f:xxx' / 'd:xxx'）；**缺省自动取前 N 位**（保持旧行为）。
// 只有上阵者计入战斗助战（followerBonus / discipleBonus），待命者不计。
NDX._companionScore = function (o) {
  o = o || {};
  return (o.atk || 0) * 2 + (o.matk || 0) * 2 + (o.hp || 0) * 0.5
    + (o.dr || 0) * 400 + (o.mdef || 0) * 400 + (o.hpRegen || 0) * 2;
};
NDX.companionPoolOf = function (s) {
  const out = [];
  ((s && s.followers) || []).forEach((id) => {
    const f = NDX.FOLLOWERS && NDX.FOLLOWERS[id];
    if (f) out.push({ key: 'f:' + id, kind: 'follower', id: id, name: f.name, desc: f.desc || '', score: NDX._companionScore(f) });
  });
  ((s && s.disciples) || []).forEach((id) => {
    const d = NDX.DISCIPLE_LIB && NDX.DISCIPLE_LIB[id];
    if (d) out.push({ key: 'd:' + id, kind: 'disciple', id: id, name: d.name, desc: (d.desc || (d.source ? d.source : '')), score: NDX._companionScore(d.bonus) });
  });
  return out;
};
// 当前上阵列表（已剔除失效 id、去重、截断至 cap；未指定则自动取前 cap）
NDX.companionLineupOf = function (s) {
  const pool = NDX.companionPoolOf(s);
  const cap = NDX.companionSlotCap();
  const valid = {};
  pool.forEach((p) => { valid[p.key] = 1; });
  // ⚠ 区分「未指定（null/undefined）」与「已指定为空数组」——空数组＝玩家主动全部撤下，不得自动补满
  const hasLineup = !!(s && s.companionLineup);
  let keys = hasLineup ? ((s && s.companionLineup) || []).filter((k) => valid[k]) : null;
  if (!keys) {
    keys = pool.slice().sort((a, b) => b.score - a.score).slice(0, cap).map((p) => p.key);
  }
  const seen = {};
  keys = keys.filter((k) => { if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, cap);
  return pool.filter((p) => keys.indexOf(p.key) >= 0);
};
NDX.companionFollowerIds = function (s) {
  return NDX.companionLineupOf(s).filter((p) => p.kind === 'follower').map((p) => p.id);
};
NDX.companionDiscipleIds = function (s) {
  return NDX.companionLineupOf(s).filter((p) => p.kind === 'disciple').map((p) => p.id);
};
// 上阵 / 待命切换：满位时加入返回 {ok:false,reason:'随行位已满'}
NDX.toggleCompanion = function (s, key) {
  if (!s) return { ok: false, reason: '无状态' };
  const pool = NDX.companionPoolOf(s);
  if (!pool.some((p) => p.key === key)) return { ok: false, reason: '未拥有此人' };
  const cap = NDX.companionSlotCap();
  // ⚠ 同上：空数组＝玩家已全部撤下，不得自动补满
  let keys = (s && s.companionLineup) ? ((s && s.companionLineup) || []).slice() : null;
  if (!keys) keys = NDX.companionLineupOf(s).map((p) => p.key);
  const at = keys.indexOf(key);
  if (at >= 0) { keys.splice(at, 1); }
  else {
    if (keys.length >= cap) return { ok: false, reason: '随行位已满（' + cap + '/' + cap + '）' };
    keys.push(key);
  }
  s.companionLineup = keys;
  return { ok: true, on: at < 0, keys: keys };
};
// 王朝（朝代）提供的初始劫印槽：消费 data_dynasty「礼乐文明」feature.sealSlot（原为悬空字段）
NDX.dynastySealSlot = function () {
  try { return (NDX.dynastyValue ? (NDX.dynastyValue('sealSlot', 0) | 0) : 0); } catch (e) { return 0; }
};
// 劫印槽（展示/承载用；**不 gate 结算**）：base 2 + 成就 + 劫印拓印（劫灰坊）+ 王朝
NDX.sealSlotCap = function () {
  return NDX.SLOT_CAP.seal
    + NDX.achvSlotBonus('seal')
    + (NDX.sealBonusSlots ? NDX.sealBonusSlots() : 0)
    + NDX.dynastySealSlot();
};

// ============================================================
//  槽位真源（V9.10 · 用户 2026-09-20 拍板）—— 所有槽位上限一律经此表读取，禁止散落常量
//    · 装备 4 ：兵刃/甲胄/头冠/战靴 各 1（固定，NDX.GEAR_SLOTS）
//    · 随从 4 ：**随行位＝妖王随从 ＋ 徒弟 共用**（用户 2026-09-21 定调），玩家自选上阵（NDX.companionLineupOf）
//    · 灵宠 2 ：+ 逆道 1 + 逆兽师 1 + 成就「兽园初成」1（V9.10 去掉「收徒加槽」）
//    · 劫印 2 ：+ 成就「印海无涯」1 + 劫印拓印等级 + 王朝「礼乐文明」1
//        ⚠ 展示/承载用——劫印自 V3 §1.1 起**全量自动生效**，槽位**不 gate 结算**（用户拍板：保持全量生效）
//    · 法宝 2 ：**2 格全纳真法宝**（B1 v1.1 · 2026-09-25 用户拍板）
//        真法宝＝「祭出式」（treasure:true / treasureId / charges）。
//        🔴 原「被动件」（数值件 / 套装件）已**迁出至装备区第 5 栏「器胚」**（slot:'special'），
//           不再占法宝槽 —— 源头设计只有紫金钵（唐僧）＋ 三根救命毫毛（悟空）两件。
//        槽位可经成就 `slot_treasure` 增加（NDX.achvSlotBonus）。
// ============================================================
NDX.SLOT_CAP = { gear: 4, companion: 4, pet: 2, seal: 2,
  // 法宝：2 格全纳真法宝（主动/被动不再分槽 —— 被动件已迁 special）
  treasure: { active: 2, passiveBase: 0, passiveStep: 99, passiveMax: 0 } };

// 成就给出的槽位加成（单一入口 · 无来源返回 0）：成就 id 见 achievements.js「卷四·收藏」
NDX.achvSlotBonus = function (kind) {
  try {
    if (!NDX.loadAch) return 0;
    const got = NDX.loadAch() || [];
    if (kind === 'seal') return got.indexOf('slot_seal') >= 0 ? 1 : 0;
    if (kind === 'pet') return got.indexOf('slot_pet') >= 0 ? 1 : 0;
    if (kind === 'treasure') return got.indexOf('slot_treasure') >= 0 ? 1 : 0;
  } catch (e) { /* noop */ }
  return 0;
};
// 随行位（**妖王随从 ＋ 徒弟 共用** · 用户 2026-09-21 定调）：4 固定
NDX.companionSlotCap = function () { return NDX.SLOT_CAP.companion; };

// —— 随行位 · 单一真源（V9.13）——
// 池 = 已收服妖王随从（s.followers · NDX.FOLLOWERS）+ 已收徒弟（s.disciples · NDX.DISCIPLE_LIB）。
// 上阵 = s.companionLineup（key 列表，形如 'f:xxx' / 'd:xxx'）；**缺省自动取前 N 位**（保持旧行为）。
// 只有上阵者计入战斗助战（followerBonus / discipleBonus），待命者不计。
NDX._companionScore = function (o) {
  o = o || {};
  return (o.atk || 0) * 2 + (o.matk || 0) * 2 + (o.hp || 0) * 0.5
    + (o.dr || 0) * 400 + (o.mdef || 0) * 400 + (o.hpRegen || 0) * 2;
};
NDX.companionPoolOf = function (s) {
  const out = [];
  ((s && s.followers) || []).forEach((id) => {
    const f = NDX.FOLLOWERS && NDX.FOLLOWERS[id];
    if (f) out.push({ key: 'f:' + id, kind: 'follower', id: id, name: f.name, desc: f.desc || '', score: NDX._companionScore(f) });
  });
  ((s && s.disciples) || []).forEach((id) => {
    const d = NDX.DISCIPLE_LIB && NDX.DISCIPLE_LIB[id];
    if (d) out.push({ key: 'd:' + id, kind: 'disciple', id: id, name: d.name, desc: (d.desc || (d.source ? d.source : '')), score: NDX._companionScore(d.bonus) });
  });
  return out;
};
// 当前上阵列表（已剔除失效 id、去重、截断至 cap；未指定则自动取前 cap）
NDX.companionLineupOf = function (s) {
  const pool = NDX.companionPoolOf(s);
  const cap = NDX.companionSlotCap();
  const valid = {};
  pool.forEach((p) => { valid[p.key] = 1; });
  // ⚠ 区分「未指定（null/undefined）」与「已指定为空数组」——空数组＝玩家主动全部撤下，不得自动补满
  const hasLineup = !!(s && s.companionLineup);
  let keys = hasLineup ? ((s && s.companionLineup) || []).filter((k) => valid[k]) : null;
  if (!keys) {
    keys = pool.slice().sort((a, b) => b.score - a.score).slice(0, cap).map((p) => p.key);
  }
  const seen = {};
  keys = keys.filter((k) => { if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, cap);
  return pool.filter((p) => keys.indexOf(p.key) >= 0);
};
NDX.companionFollowerIds = function (s) {
  return NDX.companionLineupOf(s).filter((p) => p.kind === 'follower').map((p) => p.id);
};
NDX.companionDiscipleIds = function (s) {
  return NDX.companionLineupOf(s).filter((p) => p.kind === 'disciple').map((p) => p.id);
};
// 上阵 / 待命切换：满位时加入返回 {ok:false,reason:'随行位已满'}
NDX.toggleCompanion = function (s, key) {
  if (!s) return { ok: false, reason: '无状态' };
  const pool = NDX.companionPoolOf(s);
  if (!pool.some((p) => p.key === key)) return { ok: false, reason: '未拥有此人' };
  const cap = NDX.companionSlotCap();
  // ⚠ 同上：空数组＝玩家已全部撤下，不得自动补满
  let keys = (s && s.companionLineup) ? ((s && s.companionLineup) || []).slice() : null;
  if (!keys) keys = NDX.companionLineupOf(s).map((p) => p.key);
  const at = keys.indexOf(key);
  if (at >= 0) { keys.splice(at, 1); }
  else {
    if (keys.length >= cap) return { ok: false, reason: '随行位已满（' + cap + '/' + cap + '）' };
    keys.push(key);
  }
  s.companionLineup = keys;
  return { ok: true, on: at < 0, keys: keys };
};
// 王朝（朝代）提供的初始劫印槽：消费 data_dynasty「礼乐文明」feature.sealSlot（原为悬空字段）
NDX.dynastySealSlot = function () {
  try { return (NDX.dynastyValue ? (NDX.dynastyValue('sealSlot', 0) | 0) : 0); } catch (e) { return 0; }
};
// 劫印槽（展示/承载用；**不 gate 结算**）：base 2 + 成就 + 劫印拓印（劫灰坊）+ 王朝
NDX.sealSlotCap = function () {
  return NDX.SLOT_CAP.seal
    + NDX.achvSlotBonus('seal')
    + (NDX.sealBonusSlots ? NDX.sealBonusSlots() : 0)
    + NDX.dynastySealSlot();
};

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
  // —— 法宝槽 · 单一真源（V9.12）——
  // 主动法宝＝「祭出式」：数据侧自带 treasure:true / treasureId / charges（临阵祭出、有充能）。
  // 其余 slot:'treasure'（数值件/套装件）一律为被动。机械判定，无需逐件标注。
  NDX.isActiveTreasure = function (e) {
    if (!e) return false;
    return e.treasure === true || !!e.treasureId || (e.charges || 0) > 0;
  };
  // —— 槽位归一化 · 单一入口（B1 v1.1 · 2026-09-25 用户拍板）——
  // 装备区第 5 栏（slot:'special'）：法宝位中**非祭出式**的条目
  //   ⚠ 命名沿革：2026-09-25 曾因「特殊装备」一名被两处占用而自造「器胚」；
  //     2026-09-26 用户拍板改回**骨架用词「特殊装备」**（骨架全文 0 次「器胚」＝代码自造词）。
  //     仅改**显示名**，slot 键仍为 'special' ⇒ 零存档影响。下述两处占用仍在：
  //     ① 真源《特殊装备系统·开发文档（v1.2）》＝ 虎皮裙／九齿钉耙／降妖宝杖／锦襕袈裟 4 系列 + 7 件独立件
  //     ② 代码 V8.44「事件专属装备」（equipment_part3.js:557 / events_part2.js:874）
  //   （原「被动件」＝ 数值件 / 套装件 / 合成基座「XX胚」）一律归此栏。
  // 🔴 数据侧**不改**（106 条字面量仍写 'treasure'）⇒ 老存档天然兼容，零迁移。
  // ⚠ 凡「按槽位分栏 / 判定」处一律走本函数；禁止再写 `e.slot === 'treasure'` 裸判定。
  NDX.equipSlotOf = function (e) {
    if (!e) return null;
    if (e.slot === 'treasure' && !NDX.isActiveTreasure(e)) return 'special';
    return e.slot;
  };
  // 按槽位取件（统一入口）：equipsOfSlot(list,'special') ／ equipsOfSlot(list,'treasure')
  NDX.equipsOfSlot = function (list, slot) {
    return (list || []).filter((e) => e && NDX.equipSlotOf(e) === slot);
  };
  // 被动槽数：base + 每 passiveStep 章 +1，封顶 passiveMax
  NDX.treasurePassiveCap = function (act) {
    const C = (NDX.SLOT_CAP && NDX.SLOT_CAP.treasure) || { passiveBase: 0, passiveStep: 99, passiveMax: 0 };
    const a = Math.max(1, act || 1) | 0;
    return Math.min(C.passiveMax, C.passiveBase + Math.floor((a - 1) / (C.passiveStep || 2)));
  };
  // { active, passive, total }：total 与旧曲线逐章一致（第1章2 → 第9章6）
  NDX.treasureCaps = function (act) {
    const C = (NDX.SLOT_CAP && NDX.SLOT_CAP.treasure) || { active: 2 };
    // 成就「slot_treasure」→ 法宝槽 +1（机制与 petSlotCapFor 的 achvSlotBonus 同构 · R8）
    const bonus = (typeof NDX.achvSlotBonus === 'function') ? NDX.achvSlotBonus('treasure') : 0;
    const a = ((C.active == null ? 2 : C.active) | 0) + bonus;
    const p = NDX.treasurePassiveCap(act);
    return { active: a, passive: p, total: a + p };
  };
  // 兼容入口（ui_bag/ui_map/ui_panel_2/ui_modals_1 共 5 处消费）：返回**总槽数**
  NDX.treasureSlotCap = function (act) { return NDX.treasureCaps(act).total; };
  NDX.EQUIP_SLOT_LABEL = { weapon: '兵刃', armor: '甲胄', head: '头冠', boots: '战靴', special: '特殊装备', treasure: '法宝', pet: '灵宠' };
  // 兵刃/甲胄/头冠/战靴 · 四格身体装备（V8.23）：每格各装一件、一一对应，取消原先「兵刃+甲胄混算 4 格」的模糊
  NDX.GEAR_SLOTS = ['weapon', 'armor', 'head', 'boots'];
  NDX.GEAR_SLOT_LABEL = { weapon: '兵刃', armor: '甲胄', head: '头冠', boots: '战靴' };

  // ============================================================
  // 灵兽·羁绊 —— **v1.4 已停用**，组合线改由「兽印共鸣」承担
  //   🔴 停用原因（真源文档 v1.4 §三）：
  //     角色羁绊的成员是**固定两只具体宠**。v1.4 把池子按「8 轴 × 3 阶」收敛到 24 只后，
  //     原 18 条里绝大多数成员会被归档 ⇒ 必然重现「永久激活不了的死羁绊」
  //     （v1.2 的 18 条里已有 15 条是这个下场）。
  //   ⇒ 组合线改为 **`NDX.PET_ECHO`「兽印共鸣」**（`data_pet.js`）：按「轴 → 类」聚合、
  //     只写 10 条即覆盖全部 36 种轴对 ⇒ **2 格配置必然命中 1 条，不存在配不出来的组合**。
  //   本数组保留为空数组是为了兼容既有读取点（`petFetterEffects` / 门禁），**不再写入内容**。
  // ============================================================
  NDX.PET_FETTERS = [];

  // 检测同阵激活的羁绊：activeEquips 为当前生效装备数组；返回激活的羁绊对象列表
  //   v1.2：支持星阶加成（★3 ⇒ 该条全部数值项 ×1.20）。
  //   `state` 可取 `{petStarOf:{...}}`；缺省时星阶全 0 ⇒ 倍率 1.00（构造性零副作用）。
  //   🔴 双方都 ★3 时取 `Math.max`（=1.20）**不取乘积**（会成 1.44）——
  //      否则「两边都堆星阶」成为唯一解；取 max 逼迫第二只的 ★3 收益
  //      转移到它自己参与的**另一条**羁绊上 ⇒ 鼓励铺开而非叠一头。
  NDX.petFetterEffects = function (activeEquips, state) {
    const ids = (activeEquips || []).filter((e) => e && e.slot === 'pet').map((e) => e.id);
    if (ids.length < 2) return [];
    const hit = (NDX.PET_FETTERS || []).filter((f) => ids.indexOf(f.a) >= 0 && ids.indexOf(f.b) >= 0);
    if (!hit.length) return hit;
    const starOf = (NDX.petStarOf) ? NDX.petStarOf : null;
    return hit.map(function (f) {
      let boost = 1;
      if (starOf && NDX.petFetterBoost) {
        boost = NDX.petFetterBoost(starOf(state, f.a), starOf(state, f.b));
      }
      if (boost === 1) return f;
      // 倍率仅作用于**数值项**，不改 id/desc（desc 是名，非量）
      const o = {};
      Object.keys(f).forEach(function (k) { o[k] = f[k]; });
      ['hpPct', 'atkPct', 'matkPct', 'dr', 'eva', 'cri'].forEach(function (k) {
        if (f[k]) o[k] = +(f[k] * boost).toFixed(4);
      });
      o.boost = boost;
      return o;
    });
  };
  // 模块八·灵宠被动聚合（单源 owner）：把上阵灵宠的 petPassive 汇总为战斗标记字典，
  // 供 computeStats 静态并入（dragon_aura/rockwall/hymn/guard/gold_per_turn）与 simulateSingle 机制消费
  // （regen/poison/stoneheart/whisk/cleanse/rend），羁绊 firstStrike 亦并此。同型可叠加计数。
  // 数值/语义真源在宠物条目 desc；此处仅聚合「哪些被动正在上阵、属几档」。
  //   v1.2：★2 ⇒ 该宠物计 2 档 / ★5 ⇒ 计 3 档（`petStarPassiveExtra`）。
  //   语义 = 「这只宠物顶两只同型」——复用既有「档数」概念，不新开槽位字段。
  NDX.aggregatePetPassive = function (equips, state) {
    const pp = {};
    const extraOf = NDX.petStarPassiveExtra;
    const tierW = NDX.petTierWeight;
    (equips || []).forEach((e) => {
      if (!e || e.slot !== 'pet' || !e.petPassive) return;
      // v1.4：档数 = **阶权重**（本相 1 / 显形 2 / 证道 3） + 星阶额外档（★2/★5 各 +1）。
      //   🔴 加性叠加、**不乘**：乘法会让「阶 × 星」变成第四条成长轴 ⇒ 三重叠加爆炸（v1.1 已踩）。
      //   ⚠ `petTier` 未标注的老条目回落 1（与 v1.3 行为一致 ⇒ 构造性零回归）。
      const w = (tierW ? tierW(e.petTier || 1) : 1) + (extraOf ? extraOf(state, e.id) : 0);
      pp[e.petPassive] = (pp[e.petPassive] || 0) + w;
    });
    const fets = NDX.petFetterEffects(equips, state);
    fets.forEach((f) => {
      if (f.firstStrike) pp.firstStrike = (pp.firstStrike || 0) + (f.firstStrike || 0);
    });
    return pp;
  };

  // 灵宠上阵槽上限（V9.10 · 用户拍板「折中」）：base 2 + 逆道 1 + 逆兽师 1 + 成就 1
  //   注：**取消旧「每收一徒 +1（封顶 4）」**——随从/徒弟不再扩宠物位；原 derived 值
  //   recruitedCount（难8/12/16 收徒进度）随之删除（其唯一消费点即本函数）。
  //   V9.51 追加「召唤师」档：隐藏职走**召唤流**（JOB_STYLE==='summon'：驯兽师·百兽归心 /
  //   逆兽师·百逆归心 / 女儿国·双随从）→ 保底 4 并 +2，封顶 6（用户拍板：普通 2→4，召唤师 6）。
  NDX.petSlotCapFor = function (ctx) {
    let s = (ctx && ctx.equips) ? ctx : null;
    if (!s && window.NDX && NDX.game && NDX.game.state) s = NDX.game.state;
    let cap = NDX.SLOT_CAP.pet;
    // 逆道融合：逆道路线（逆道劫印≥2 / 已合成逆经）额外开放 1 个出战位——逆修之兽更凶
    if (s && NDX.isNiRoute && NDX.isNiRoute(s)) cap += 1;
    // 逆兽师·百逆归心（隐藏职）：再 +1 出战位
    //   ⚠ 2026-09-26：改读注册表 NDX.JOB_PET_SLOT（data_trials.js），不再硬编码职位名
    const _jobsCap = (NDX.activeJobs ? NDX.activeJobs(s) : []);
    for (const _j of _jobsCap) cap += ((NDX.JOB_PET_SLOT || {})[_j] || 0);
    // 成就「兽园初成」：灵宠槽 +1
    cap += NDX.achvSlotBonus('pet');
    // 召唤师（隐藏职·召唤流）：保底 4 再 +2 → 封顶 6
    //   ⚠ ctx 可能只带 jobConfirm（无 equips），此时上面 s 为 null —— 故回退取 ctx 本身
    const _st0 = s || ctx || {};
    const _job = NDX.currentJob ? NDX.currentJob(_st0) : ((_st0.flags && _st0.flags.jobConfirm) || _st0.jobConfirm || null);
    const _style = (_job && NDX.JOB_STYLE && NDX.JOB_STYLE[_job]) || null;
    if (_style === 'summon' || (_job && NDX.PET_SUMMONER_JOBS && NDX.PET_SUMMONER_JOBS.indexOf(_job) >= 0)) {
      cap = Math.max(4, cap) + 2;
    }
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
    { id: 'wuchao_robe', name: '乌巢禅衣', slot: 'armor', hp: 60, dr: 0.08, counter: 0.05, desc: '乌巢旧衲——心经加持，御寒亦御妖 反击+5%' },
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
    { id: 'ev_a_wudang',   name: '无当袈裟', slot: 'armor', hp: 560, dr: 0.16, shieldPct: 0.08, blk: 0.03, desc: '地藏无当之衲——血+560 减伤+16% 开局护盾+8%（次级·事件专属） 格挡+3%' },
    { id: 'ev_a_ruyi',     name: '金缕玉衣·如来', slot: 'armor', hp: 760, dr: 0.22, shieldPct: 0.15, mdef: 0.06, blk: 0.05, desc: '如来金缕所织——血+760 减伤+22% 开局护盾+15% 法防+6%（顶级·事件专属） 格挡+5%' },
    // —— 头冠：法伤暴击 ——
    { id: 'ev_h_pilu',     name: '毗卢遮那冠', slot: 'head', matk: 66, mdef: 0.05, crit: 0.05, desc: '文殊普贤所戴毗卢冠——愿伤+66 法防+5% 暴击+5%（次级·事件专属）' },
    { id: 'ev_h_wufo',     name: '五佛冠·真', slot: 'head', matk: 92, mdef: 0.08, crit: 0.08, criMult: 0.2, desc: '灵山五佛之冠——愿伤+92 法防+8% 暴击+8% 暴伤+20%（顶级·事件专属）' },
    // —— 战靴：闪避速度 ——
    { id: 'ev_b_dengyun',  name: '登云履', slot: 'boots', eva: 0.13, spd: 2, desc: '哪吒登云之履——闪避+13% 速度+2（次级·事件专属）' },
    { id: 'ev_b_tayun',    name: '踏云追风靴', slot: 'boots', eva: 0.19, spd: 4, blk: 0.06, desc: '踏云追风、日行万里——闪避+19% 速度+4（顶级·事件专属） 格挡+6%' },
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
  EVENT_GEAR.forEach((g) => { g.eventOnly = true; g.diary = true; NDX.EQUIP_POOL.push(g); });
  // 双线事件装备由事件选项 gear 发放，打 eventOnly 标记：rollEquips 掉落/坊市彻底排除，
  // 只从事件渠道获得，杜绝"剧情专属装备混入随机掉落/商店"（V8.42 散件清理）。
  NDX.SUTRA_EVENT_GEAR.forEach((g) => { g.eventOnly = true; g.diary = true; NDX.EQUIP_POOL.push(g); });

  // ============================================================
  // 冒险日记 · 日记装备单一真源（2026-09-26 统一）
  // 定义出处：docs/_归档/03_系统设计旧稿/逆道西行·隐藏转职完善与冒险日记体系（2026-09-12）§二
  //   「日记装备」= 仅由事件选项 gear 发放、不入随机掉落/商店 的事件专属奇物，
  //   收集越多越能触达「行旅录主」一类依赖 日记装备≥N / 持ev_<id> 的隐藏职。
  //
  // 🔴 已修缺陷：判定原按「id 以 ev_ 开头」（data_trials.js 旧实现），但经文双线 21 件
  //   （jade_vase / wuchao_robe / dizang_staff / sanjian_p1..p6 / bajiao_fan 等）
  //   实质完全符合日记装备定义（eventOnly、不入掉落/商店、仅事件发放），却无 ev_ 前缀
  //   ⇒ 被漏计，玩家拿到也不涨计数，「日记装备≥N」类隐藏职被静默卡死。
  //   修法：**显式 diary:true 标记 + id 兜底集合**双轨，命名约定降级为兼容、不再作真源。
  //   不改 id（保存档兼容），也不改握持者的持有形态。
  // ============================================================
  NDX.DIARY_EQUIP_IDS = new Set(EVENT_GEAR.concat(NDX.SUTRA_EVENT_GEAR).map((g) => g.id));
  // 判定唯一入口：任何「是否日记装备」的判断必须调此函数，禁止各处自行 startsWith('ev_')。
  NDX.isDiaryEquip = function (e) {
    if (!e) return false;
    const id = String(e.id || '');
    return e.diary === true || NDX.DIARY_EQUIP_IDS.has(id) || id.indexOf('ev_') === 0;
  };

  // ============================================================
  // 宝物 id「数据缺口」判定（2026-09-26）
  // `treasure:` 字段历史上是杂物筐：真法宝 / 经文残片 / 装备 / 中文材料名混装其中。
  // 消费端 lootById 查不到时，旧实现盲目 addMaterial(tid)，于是内部英文 id
  // 被当作「材料」塞进背包、印在日志上（玩家看到「拾得 tre_huojianqiang」）。
  // 本函数把两者分开：
  //   返回 true  ⇒ 形如内部编码且查无此物 = **实体未建**（数据缺口）⇒ 不入库，交给门禁兜
  //   返回 false ⇒ 查得到，或形如中文材料名 ⇒ 按既有逻辑正常入材料/入装备
  // ============================================================
  NDX.isUnresolvedTreasureId = function (tid) {
    const id = String(tid || '');
    if (!id) return false;
    if (NDX.lootById && NDX.lootById(id)) return false;      // 查得到 ⇒ 不是缺口
    if (/[\u4e00-\u9fa5]/.test(id)) return false;            // 含汉字 ⇒ 材料名/中文宝名
    // 编码形：含下划线，或命中任一已知体系前缀
    return id.indexOf('_') >= 0 ||
      /^(tre|chan|ni|equip|shanwen|bf|bis|jingu|ts|ev|adv|cmp|upg)/.test(id);
  };

  // ============================================================
  // V8.50 游历散宝 · 冒险日记式超多装备组合体系
  // 三类：① 组合件 / 升级件（统一 slot:'component'。2026-09-25 修正：原误写 'comp'/'upg'，
  //        会被 _equipKind 落进默认 gear 分支、当普通装备处理 —— 这是 bug，非设计）—— 喂养土地庙装备组合面板；
  //       ② 独立散宝(无 set) —— boss/精英/小怪 按概率掉落，不入套装合成线(rollEquips 天然排除)，
  //       亦可在土地庙·遗珠回流以极低概率补刷。全部 adv:true，与事件专属(eventOnly)区分。
  // 掉落档位 dropTier：low=小怪 / elite=精英 / boss=Boss。
  // ============================================================
  NDX.ADVENTURE_GEAR = [
    // —— 组合件（喂养组合面板，按 tier 分池）——
    { id: 'cmp_xuantie',  name: '玄铁锭', slot: 'component', desc: '百炼玄铁所凝——组合件，可喂养装备进阶（初级）', adv: true, dropTier: 'low' },
    { id: 'cmp_lingyun',  name: '灵蕴珠', slot: 'component', desc: '天地灵蕴所凝——组合件，可喂养装备进阶（中级）', adv: true, dropTier: 'elite' },
    { id: 'cmp_yaohun',   name: '妖魂核', slot: 'component', desc: '大妖魂核所凝——组合件，可喂养装备进阶（中级）', adv: true, dropTier: 'elite' },
    { id: 'cmp_tiangong', name: '天工谱', slot: 'component', desc: '天工巧匠遗谱——组合件，可喂养顶级装备进阶（高级）', adv: true, dropTier: 'boss' },
    // —— 升级件（喂养组合面板，升级已持装备）——
    { id: 'upg_cuiling',  name: '淬灵砂', slot: 'component', desc: '淬炼灵砂——升级件，可将次级装备淬至更高阶', adv: true, dropTier: 'elite' },
    { id: 'upg_duanhun',  name: '锻魂玉', slot: 'component', desc: '锻魂宝玉——升级件，可将顶级装备淬至圆满', adv: true, dropTier: 'boss' },
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
  // 🔴 B3/P0-3（2026-09-26）：原表末 5 件 ev_*（开天斧·刑天 / 金缕玉衣·如来 / 五佛冠·真 /
  //   踏云追风靴 / 山河社稷图·残）为 `eventOnly + diary` 的冒险日记凭据——按既定纪律
  //   「事件专属装备只由剧情/事件发放，不进掉落、不进商店」，已从 Boss 掉落表摘除。
  //   （原注释称其为「长事件链错过补偿」；若日后要恢复补偿，请走**明确的补偿通道**——
  //    例如事件结束后单独推送，而不是混进随机掉落表稀释日记凭据语义。）
  //   注：rollAdvDrops 内已加 eventOnly/diary 兜底拦截，防止日后手工加表再漏。
  NDX.BOSS_EQUIP_DROPS = ['adv_w_wanjun', 'adv_a_jiuzhuan', 'adv_b_zhuri', 'adv_t_qiankun', 'cmp_tiangong', 'upg_duanhun', 'upg_cuiling'];

  // 三尖两刃刀·完整神兵（V8.27 二郎神六部件重铸）
  // 不参与掉落池（避免战斗/宝窟污染），仅由 tryCombineSanjian 集齐 6 部件后合成授予。
  NDX.SANJIAN_FULL = {
    id: 'sanjian_full', name: '三尖两刃刀', slot: 'weapon', atk: 45, crit: 0.06,
    desc: '二郎真君六部件重铸——听调不听宣，三尖破天条（对天庭系伤害+10%，暴击+6%）'
  };

  // 山文甲（2026-09-26 补建）：难20 白骨岭【隐】道专属产出（effect.treasure:'shanwenjia'）。
  //   consequence 明写「结局丙·白骨的铠甲：山文甲」，但字典与装备池此前均无此条目
  //   ⇒ 玩家走【隐】拿到的是空。仅由该抉择发放（eventOnly），不入随机掉落/商店。
  NDX.SHANWEN_ARMOR = {
    id: 'shanwenjia', name: '山文甲', slot: 'armor', chapter: 2,
    hp: 210, dr: 0.09, eva: 0.05,
    desc: '白骨所炼之甲——血+210 减伤+9% 闪避+5%（结局丙·白骨的铠甲）'
  };
  NDX.EQUIP_POOL.push(Object.assign({ eventOnly: true }, NDX.SHANWEN_ARMOR));

  // ============================================================
  // 八十一难「战斗抉择掉落物」（2026-09-26 补建）
  // ------------------------------------------------------------
  // 这批 id 长期挂在 effect.treasure 上却被 lootById 查不到 ⇒ 玩家打赢了拿不到东西，
  // 且因为 game_event_2.js 的兜底分支，英文 id 会被当材料塞进行囊、印在日志上。
  // 语义全部取自各难的 consequences（战/隐道打赢或智取时掉落的战利品）。
  // 全部 eventOnly：只由该抉择发放，不进随机掉落与坊市。
  // 数值按「章节＝难度」推导（ch8 中后期 ≈ 血 260~340 / 减伤 9~12%，
  // ch9 终盘 ≈ 血 380~500 / 减伤 10~15%，隐道件额外给闪避与速度）。
  // ============================================================
  const TRIAL_DROPS = [
    // —— 第八章（难 65~75）——
    { id: 'equip_biqiu',        name: '白鹿妖甲',     slot: 'armor',   hp: 260, dr: 0.10,
      desc: '白鹿之革所制——血+260 减伤+10%（难65·白鹿精【战】掉落）' },
    { id: 'equip_biqiu_yin',    name: '白面狐裘',     slot: 'armor',   hp: 210, dr: 0.07, eva: 0.06,
      desc: '白面狐狸的皮毛——血+210 减伤+7% 闪避+6%（难65·白面狐狸【隐】智取）' },
    { id: 'equip_wudidong',     name: '无底洞妖铠',   slot: 'armor',   hp: 300, dr: 0.11,
      desc: '无底洞群妖合力的甲——血+300 减伤+11%（难67·老鼠精【战】掉落）' },
    { id: 'equip_wudidong_yin', name: '无底洞潜影靴', slot: 'boots',   eva: 0.09, spd: 2,
      desc: '探得洞府深浅的靴——闪避+9% 速度+2（难67·无底洞【隐】绕行）' },
    { id: 'equip_miefa',        name: '钦法国王袍',   slot: 'armor',   hp: 280, dr: 0.11,
      desc: '钦法国王的王袍——血+280 减伤+11%（难70·灭法国【战】踏平王军所得）' },
    { id: 'equip_miefa_yin',    name: '剃度僧衣',     slot: 'head',    hp: 120, eva: 0.07,
      desc: '夜剃王发所留的僧衣——血+120 闪避+7%（难70·灭法国【隐】剃度度王）' },
    { id: 'equip_nanshan',      name: '隐雾山大王甲', slot: 'armor',   hp: 300, dr: 0.11,
      desc: '隐雾山寨主的皮甲——血+300 减伤+11%（难71·南山大王【战】掉落）' },
    { id: 'equip_fengxian_yin', name: '凤仙甘霖符',   slot: 'boots',   eva: 0.08, spd: 2,
      desc: '甘霖所润的符——闪避+8% 速度+2（难72·凤仙郡【隐】施雨）' },
    { id: 'equip_yuhua_yin',    name: '九灵竹节衣',   slot: 'armor',   hp: 320, dr: 0.10, eva: 0.05,
      desc: '竹节为骨、九灵为纹——血+320 减伤+10% 闪避+5%（难75·九灵元圣洞府【隐】退出）' },
    { id: 'tre_huangshi_pi',    name: '黄狮皮甲',     slot: 'armor',   hp: 340, dr: 0.12,
      desc: '黄狮精的皮——血+340 减伤+12%（难73·黄狮精【战】以力降之）' },
    { id: 'tre_dingbapyan_qingjian', name: '定巴扇轻剑', slot: 'weapon', atk: 88, crit: 0.05,
      desc: '钉钯宴上夺回的兵刃——攻+88 暴击+5%（难73·黄狮精宴【隐】用计夺回）' },
    // —— 第九章终盘（难 76~81）——
    { id: 'tre_jinping_jia',    name: '玄英犀甲',     slot: 'armor',   hp: 460, dr: 0.14,
      desc: '三犀的皮所制——血+460 减伤+14%（难76·玄英洞【战】以力降妖）' },
    { id: 'shanwen_jinping',    name: '山文·假佛看破衣', slot: 'armor', hp: 380, dr: 0.10, eva: 0.07,
      desc: '看破「佛非佛，是心」所悟之衣——血+380 减伤+10% 闪避+7%（难76·玄英洞【隐】点破破绽）' },
    { id: 'shanwen_tianzhu',    name: '山文·凡胎落水衣', slot: 'armor', hp: 380, dr: 0.10, eva: 0.07,
      desc: '凡胎顺水漂走后留下的觉悟——血+380 减伤+10% 闪避+7%（难78·天竺国【隐】趁夜出城）' },
    { id: 'tre_tongtai_jia',    name: '铜台刑具甲',   slot: 'armor',   hp: 460, dr: 0.14,
      desc: '大牢刑具所铸之甲——血+460 减伤+14%（难79·铜台府【战】打出大牢）' },
    { id: 'shanwen_tongtai',    name: '山文·铜台看破袍', slot: 'armor', hp: 390, dr: 0.10, eva: 0.07,
      desc: '看破「善的虚妄」所悟之袍——血+390 减伤+10% 闪避+7%（难79·铜台府【隐】不洗冤而走）' },
    { id: 'tre_lingyun_jia',    name: '凌云渡凡胎甲', slot: 'armor',   hp: 480, dr: 0.14,
      desc: '未脱的凡胎所凝——血+480 减伤+14%（难80·凌云渡【战】强行过河）' },
    { id: 'shanwen_lingyun',    name: '山文·空门西行衣', slot: 'armor', hp: 390, dr: 0.10, eva: 0.07,
      desc: '绕开凌云渡、空门西行之悟——血+390 减伤+10% 闪避+7%（难80·凌云渡【隐】绕道）' },
    { id: 'tre_lingshan_jia',   name: '灵山有字经甲', slot: 'armor',   hp: 500, dr: 0.15,
      desc: '有字真经的气息所凝——血+500 减伤+15%（难81·灵山【战】强取有字真经）' },
    { id: 'shanwen_lingshan',   name: '山文·人事看破衣', slot: 'armor', hp: 400, dr: 0.11, eva: 0.07,
      desc: '看破「人事」所悟之衣——血+400 减伤+11% 闪避+7%（难81·灵山【隐】绕道不取真经）' },
  ];
  TRIAL_DROPS.forEach((g) => { g.eventOnly = true; NDX.EQUIP_POOL.push(g); });

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
  // 🆕 B3/P0-2A（2026-09-26）分章掉落池：三张静态表全是 ch1 装备 ⇒ ch9 的 Boss 掉「攻 132 的 ch1 装」。
  //   改为「按当前章取池」：优先该章匹配的游历散宝/部件（排除商店经济套 cost 与事件专属），
  //   池为空时回退原静态表。缓存一次，避免每次掉落遍历全池。
  NDX._advPoolByChapter = null;
  NDX._advChapterPool = function (ch) {
    if (!NDX._advPoolByChapter) {
      const m = {};
      (NDX.EQUIP_POOL || []).forEach(function (e) {
        if (!e || !e.id || e.eventOnly || e.diary || e.cost) return;  // 事件专属 / 商店经济套不进掉落
        if (['weapon', 'armor', 'head', 'boots', 'treasure'].indexOf(e.slot) < 0) return;
        const c = Math.min(9, Math.max(1, e.chapter || 1));
        (m[c] = m[c] || []).push(e.id);
      });
      NDX._advPoolByChapter = m;
    }
    return NDX._advPoolByChapter[ch] || [];
  };
  NDX.rollAdvDrops = function (tier, state, count) {
    count = count || 1;
    const _map = { low: NDX.LOW_EQUIP_DROPS, elite: NDX.ELITE_EQUIP_DROPS, boss: NDX.BOSS_EQUIP_DROPS };
    let ids = _map[tier] || [];
    // 当前章（1~9）：优先 globalProgress→chapterOf，回退 state.act/region
    let _ch = 0;
    if (state && NDX.globalProgress && NDX.chapterOf) {
      try { _ch = Math.min(9, Math.max(1, NDX.chapterOf(NDX.globalProgress(state)) || 1)); } catch (e) { _ch = 0; }
    }
    if (!_ch) _ch = Math.min(9, Math.max(1, (state && (state.act || state.region)) || 1));
    const _chPool = NDX._advChapterPool(_ch);
    if (_chPool.length) ids = _chPool.concat(ids.slice(0, 2)); // 章匹配池 + 少量通用件兜底
    const out = [];
    for (let i = 0; i < count && ids.length; i++) {
      const id = ids[NDX._rand(0, ids.length - 1)];
      const eq = NDX.lootById(id);
      // 🔴 B3/P0-3 兜底拦截：事件专属（eventOnly / diary）装备绝不从随机掉落流出，
      //   与 rollEquips 的 `!e.eventOnly` 同口径。表内若被手工加回日记件，此处静默跳过。
      if (eq && (eq.eventOnly || eq.diary)) continue;
      if (eq) out.push(eq);
    }
    return out;
  };

  // 🔴 v1.4：`PET_EVOLUTIONS` 的**真源改为 `PET_SEAL`**（本数组整体重写，旧 13 条手写条目作废）。
  //   为什么必须派生：旧表是手写的 13 条，成员散落在 20 个角色族里；v1.4 把池子按
  //   「8 轴 × 3 阶」重组后，旧表**绝大部分 base/target 落在归档池** ⇒ 门禁 C2/C3
  //   报「进化 base/target 不在装备池内」，也就是「演进事件指向了玩家拿不到的宠物」。
  //   ⚠ **本表只覆盖「本相 → 显形」**（阶1→阶2，章节奇遇点化）。
  //     阶2→阶3（证道）**不走本表**：证道唯一入口是「说动反出」（劫难逆选项 `effect.treasure`）
  //     ⇒ 升级线 = **掉落（本相）→ 点化进化（显形）→ 说动反出（证道）**，三段全是内容驱动。
  NDX.PET_EVOLUTIONS = (function () {
    const out = [];
    const SEAL = NDX.PET_SEAL || {};
    (NDX.PET_AXIS_ORDER || []).forEach(function (ax) {
      const col = SEAL[ax] || {};
      const b = NDX.petById ? NDX.petById(col[1]) : null;
      const t = NDX.petById ? NDX.petById(col[2]) : null;
      if (!b || !t) return;
      const meta = (NDX.PET_AXES || {})[ax] || {};
      out.push({
        base: b.id, baseName: b.name, chapter: b.chapter || 1,
        title: '兽印进化 · ' + (meta.name || ax),
        text: b.name + '随行已久。' + (meta.desc || '') + '如今它伏在你脚边，等你替它定一个方向。',
        opts: [
          { text: '点化显形 → 进化为【' + t.name + '】（' + (meta.mechanic || '') + ' 档数 ×2）', target: t.id },
          { text: '任其自在 → 保留' + b.name + '（关闭进化）', keep: true },
        ],
      });
    });
    return out;
  })();

  // 🗑 v1.4 删除 `PET_EVOLUTIONS` 的旧 13 条手写条目（原 799~876 行）。
  //   删除原因：成员散落在 20 个角色族里，v1.4 按「8 轴 × 3 阶」重组池子后，
  //   旧条目的 base/target **几乎全部落在归档池** ⇒ 门禁 C2/C3 报「进化指向玩家拿不到的宠」。
  //   保留副本会让「死了但还在的进化线」继续误导（本项目已发生过 7 类同型问题），故整体移除；
  //   需要复原请查 git 历史。新真源 = 上方由 `PET_SEAL` 派生的 `NDX.PET_EVOLUTIONS`。

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

  // 装备归属类型：gear(身体装备) / special(器胚·第 5 栏) / pet / treasure(真法宝) / component(套装组件·包裹生效)
  //   ⚠ 槽位一律经 NDX.equipSlotOf 归一化（法宝位里的非祭出式 → special）
  NDX._equipKind = function (e) {
    if (!e) return 'gear';
    const sl = NDX.equipSlotOf(e);
    if (sl === 'pet') return 'pet';
    if (sl === 'treasure') return 'treasure';
    if (sl === 'special') return 'special';
    if (sl === 'component') return 'component';
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
    if (kind === 'special') return 1;   // 装备区第 5 栏「器胚」：1 格（与兵刃/甲胄/头冠/战靴同构）
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
    // 🆕 器胚（第 5 栏 · B1 v1.1）：法宝位里的非祭出式（原「被动件」）各取 1 件
    const specials = NDX._pickActiveN(list.filter((e) => e && NDX.equipSlotOf(e) === 'special'), 1, NDX._equipScore);
    const pets = NDX._pickActiveN(list.filter((e) => e && e.slot === 'pet'), NDX.petSlotCapFor(ctx), NDX._equipScore);
    // 法宝槽：**只纳真法宝（祭出式）**，槽数 = treasureCaps.total（2 格，可经成就扩）
    const _allTr = list.filter((e) => e && NDX.equipSlotOf(e) === 'treasure');
    const _tc = NDX.treasureCaps(actCtx);
    const _actTr = NDX._pickActiveN(_allTr.filter((e) => NDX.isActiveTreasure(e)), _tc.active, NDX._equipScore);
    const _actIds = {};
    _actTr.forEach((e) => { _actIds[e.id] = 1; });
    const _pasN = _tc.passive + (_tc.active - _actTr.length);
    const _pasTr = NDX._pickActiveN(_allTr.filter((e) => !_actIds[e.id]), _pasN, NDX._equipScore);
    const treas = _actTr.concat(_pasTr);
    return gear.concat(specials).concat(pets).concat(treas);
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
