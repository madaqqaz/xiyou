// =============================================================
// combat.js — 《逆道西行》第一章战斗内核 · 分阶段状态机结算
// 状态机：INTRO → BATTLE_LOOP(TURN_START→PLAYER_PHASE→ENEMY_PHASE
//           →TURN_RESOLVE→CHECK_END[→ENRAGE]) → VICTORY/DEFEAT
// 新增机制：速度先手 / 怪物反击(反弹裂缝) / DOT 持续伤害 / 残血<30%狂暴(×1.5)
// 纯逻辑（无 DOM）：产出 roundsDetail 供 UI 逐拍演出
// =============================================================

(function () {
  var NDX = window.NDX;

  // V8.49 多回合制平衡：所有英雄/怪物普攻/反击全局削力（0.5=50% 伤害），
  // 让暴击/法宝/破韧/绝招有时间生效，否则怪物两下就死绝招都放不出来。
  // 只改这一个值即可生效。DOT/持续伤害不在此处（语义上是"攻击"，不受此调）。
  const GLOBAL_DMG_MUL = 0.5;

  // 怪物归一：补全速度 spd 与反击率 counter（精英/Boss 反击更高、速度更低）
  function normalizeMonster(m) {
    const tier = m.diff ? (m.diff - 1) : 0;
    let spd = 6 + tier * 0.45;       // 怪物基准速度随难度爬升
    let counter = 0.12;              // 命中后反击（反弹裂缝）基础概率
    if (m.type === 'elite') { spd = 5 + tier * 0.40; counter = 0.22; }
    else if (m.boss) { spd = 4 + tier * 0.30; counter = 0.30; }
    else if (m.type === 'mob') { spd = 8 + tier * 0.50; counter = 0.10; }
    const dr = (m.dr != null) ? m.dr : NDX.MONSTER_DR;
    // 词缀·迅捷：附加速度（抢先手）
    if (m.affixSpd) spd += m.affixSpd;
    // 词缀·狂暴：覆盖狂暴倍率（默认 1.5）
    const furyMult = (m.furyMult != null) ? m.furyMult : 1.5;
    return Object.assign({}, m, {
      spd: +spd.toFixed(2),
      counter: +counter.toFixed(2),
      dr: dr,
      furyMult: furyMult,
    });
  }

  function clampHp(hp, hero, maxHp) {
    // 与 computeStats 的 capHp 一致（baseHp*4），承接装备提供的血量上限；
    // 原先误用 *3 导致战斗中把已放大的血量再次截断 25%，是后期通关率过低的核心瓶颈。
    const cap = hero && hero.baseHp ? hero.baseHp * 4 : 4000;
    const effMax = Math.max(maxHp || 0, Math.min(cap, maxHp || 0));
    return Math.max(1, Math.min(effMax, hp));
  }

  // 单次 DOT 结算：每个效果造成 dmg 后 turns-1，归零则移除
  function tickDots(list) {
    let sum = 0;
    const keep = [];
    for (const d of list) {
      sum += d.dmg;
      d.turns -= 1;
      if (d.turns > 0) keep.push(d);
    }
    return { sum: sum, keep: keep };
  }

  // =============================================================
  // 套装共鸣系统（平衡 V47·装备差异重构）
  // 解决「各套装差距不大、玄武套在防御上无本质优势」的设计失衡：
  //   每个套装集齐 2/3 件触发「共鸣」，施加独占式加成，使套装定位清晰分化。
  // 玄武套为「防御流核心」：集齐即大幅放大减伤(dr)，且对劫印·缘道的减伤做
  //   乘区放大（叠缘道劫印越多玄武收益越大），与劫印系统形成正反馈闭环。
  // 共鸣在装备基础值累加之后、劫印/事件 bonus 之后统一结算（乘区叠加，避免被稀释）。
  // 字段含义：
  //   tier.2 : 集齐 2 件生效；tier.3 : 集齐 3 件生效（3 件同时享用 2 件效果，本表已合并最终值）
  //   drPlus : 额外固定减伤增量；drMult : 对已累积减伤(dr，含劫印)的乘区放大
  //   drSealMult : 对「劫印提供的减伤」的专属放大（仅玄武·缘道联动用）
  //   其余字段为各套装特色共鸣（atk/hp/matk/mdef/eva/cri/hpRegen 增量）
  // =============================================================

  // 玩家综合属性结算：基础曲线(playerBaseAt·随层成长) + 装备/法宝 + 事件 bonus + 套装共鸣
  // 签名：(heroId, equips, materials, bonus, diff)；diff 决定随层数成长的属性
  NDX.computeStats = function (heroId, equips, materials, bonus, diff) {
    const hero = NDX.HEROES[heroId] || {};
    const P = hero.passive || {};
    const d = diff || (NDX.game && NDX.game.state && NDX.game.state.diff) || 1;
    const base = NDX.playerBaseAt(d, hero); // { atk, hp, dr, eva, matk, mdef }
    // V8.58 修复：修炼年轮永久数值（hp/atk）接入 computeStats
    // 原 RING_UPGRADES 的 hp/atk 只在 ui_cultivation.js 展示，无战斗消费点，玩家投入年轮买攻击/气血后战斗数值毫无反馈
    let atk = base.atk, maxHp = base.hp, dr = base.dr, eva = base.eva;
    let matk = base.matk, mdef = base.mdef;
    // 修炼年轮永久加成：基于基础属性的百分比加成（初始气血 +5%/级，初始攻击 +5%/级）
    try {
      if (NDX.Cultivation && NDX.Cultivation.getAllBonuses) {
        const _cult = NDX.Cultivation.getAllBonuses();
        if (_cult.atkBonus && _cult.atkBonus > 0) atk = Math.round(atk * (1 + _cult.atkBonus));
        if (_cult.hpBonus && _cult.hpBonus > 0) maxHp = Math.round(maxHp * (1 + _cult.hpBonus));
      }
    } catch (e) { /* 修炼年轮加载失败不影响战斗 */ }
    // 模块七·criBonus（隐藏职常驻暴击率加成）唯一消费点：加性叠加在基础暴击 10% 之上（单源，勿在回合判定再叠以免双倍）。
    let cri = 0.10 + (P.criBonus || 0);
    let criMult = P.criMult || 1.6;
    let hit = 1, atkB = 0, fixAtk = 0, fixDr = 0, matkB = 0, fixMatk = 0, fixMdef = 0, hpRegen = 0;
    // V8.5x 构筑分化：装备通用来源（反伤/速度/护盾），收敛体攻暴击流唯一解
    let equipReflect = 0, equipSpd = 0, equipShieldPct = 0, equipArmorPen = 0;
    (equips || []).forEach((e) => {
      atk += e.atk || 0; maxHp += e.hp || 0; dr += e.dr || 0;
      matk += e.matk || 0; mdef += e.mdef || 0; eva += e.eva || 0; cri += e.cri || 0;
      hit = Math.min(1, hit + (e.hit || 0));
      atkB += e.atkB || 0; fixAtk += e.fixAtk || 0; fixDr += e.fixDr || 0;
      matkB += e.matkB || 0; fixMatk += e.fixMatk || 0; fixMdef += e.fixMdef || 0;
      hpRegen += e.hpRegen || 0;
      equipReflect += e.reflect || 0; equipSpd += e.spd || 0; equipShieldPct += e.shieldPct || 0;
      equipArmorPen += e.armorPen || 0;
    });
    if (bonus && bonus.ti) {
      atk += bonus.ti.atk || 0; maxHp += bonus.ti.hp || 0; dr += bonus.ti.dr || 0;
      eva += bonus.ti.eva || 0; cri += bonus.ti.cri || 0;
      matk += bonus.ti.matk || 0; mdef += bonus.ti.mdef || 0;
    }
    if (bonus && bonus.yuan) { matk += bonus.yuan.matk || 0; mdef += bonus.yuan.mdef || 0; }
    // 佛经全本体/愿加成（effect.ti 兼容 atk/hp/dr/eva/cri，平铺 matk/mdef 也可）
    if (bonus && bonus.sutras) {
      bonus.sutras.forEach((eff) => {
        if (!eff) return;
        const st = eff.ti || {};
        atk += st.atk || 0; maxHp += st.hp || 0; dr += st.dr || 0;
        eva += st.eva || 0; cri += st.cri || 0;
        matk += eff.matk || 0; mdef += eff.mdef || 0;
      });
    }
    // 随从助战（《竞品借鉴》§3）：已收服妖王随从平铺属性并入（攻/血/减伤/法伤/法防）
    if (bonus && bonus.followers) {
      const fb = NDX.followerBonus(bonus.followers);
      atk += fb.atk; maxHp += fb.hp; dr += fb.dr;
      matk += fb.matk; mdef += fb.mdef;
    }
    // 劫印系统（单局临时战力构筑）：百分比加成并入
    //   atk/matk/maxHp 按当前值百分比（乘）；dr/mdef/eva 按增量百分比（加）；crit/reflect 累加
    //   吸血/残影等作为标记回传给结算层（存储在返回值的 sealFlags）
    let sealFlags = { lifesteal: 0, evaOnDodge: false };
    let sealReflectTotal = 0;
    let sealDrTotal = 0; // 劫印·缘道已贡献的减伤合计（玄武共鸣联动用）
    if (bonus && bonus.seals && bonus.seals.length) {
      // 道心调制（模块三）：劫印词条按其道途善恶（恶=战/夺/逆、善=渡/隐/缘）× 道心档位倍率放大/衰减。
      // 明镜台善印+15%/恶印-10%，无底深渊恶印+15%/善印-10%，心城不变（单源 data_daoxin.js SEAL_MOD/sealDaoMod）。
      const _daoMod = (typeof NDX.sealDaoMod === 'function') ? NDX.sealDaoMod : null;
      const _daoxTier = (bonus && bonus.daoxinTier) || null;
      bonus.seals.forEach((sl) => {
        let v = sl.val || 0;
        // 道心调制：乘数与下方本命道放大/词条百分比相乘（乘法可交换，顺序不影响）
        if (_daoMod && _daoxTier) v *= _daoMod(_daoxTier, sl.dao);
        // 本命道放大（V8.5x 身份透镜）：劫印词条所属道命中英雄本命道时，属性按比例放大。
        // 非本命道劫印全额计入——万世剑冢式下人人可走全部路线，只是本命道更划算。
        if (sl.dao && NDX.isHomeDao && NDX.isHomeDao(heroId, sl.dao)) v *= (NDX.HOME_DAO_MULT || 1);
        if (sl.stat === 'atk') atk += atk * v;
        else if (sl.stat === 'matk') matk += matk * v;
        else if (sl.stat === 'maxhp') { maxHp += maxHp * v; if (sl.maxhp) maxHp += maxHp * sl.maxhp; }
        else if (sl.stat === 'dr') { dr += v; sealDrTotal += v; }
        else if (sl.stat === 'mdef') mdef += v;
        else if (sl.stat === 'eva') eva += v;
        else if (sl.stat === 'reflect') sealReflectTotal += v; // 逆道·戾骨/反噬：反伤比例
        if (sl.lifesteal) sealFlags.lifesteal += sl.lifesteal;
        if (sl.evaOnDodge) sealFlags.evaOnDodge = true;
        if (sl.crit) cri += sl.crit;
      });
    }
    // 六道专职转职加成（bonus.tier）：恢复设计本意（zhuanjie.js:199 注释指明 computeStats 应消费 bonus.tier，
    // 此前长期未接线，转职加成为空实现）。本命道已在 ZH.tierBonus 内按 HOME_DAO_MULT 放大。
    // 接入点选在劫印之后、套装共鸣之前，使转职加成同样走减伤/法防/闪避封顶与套装共鸣。
    if (bonus && bonus.tier) {
      const tb = bonus.tier;
      if (tb.atkPct) atk += atk * tb.atkPct;
      if (tb.hpPct) maxHp += maxHp * tb.hpPct;
      if (tb.drPlus) dr += tb.drPlus;
      if (tb.eva) eva += tb.eva;
      if (tb.cri) cri += tb.cri;
      if (tb.hpRegen) hpRegen += tb.hpRegen;
      if (tb.engineTier && tb.engineTier.shieldPct) equipShieldPct += tb.engineTier.shieldPct;
      // engineTier 的机制类词条（sunder/multi/vanish/chaos/paradox 等）为回合内核签名，需战斗层单独接线，
      // 超出本任务范围；此处仅落地可映射为数值的护盾词条。
    }
    // 命痕系统（机制改写层）：把持有的命痕 mechanism 聚合为 fateFlags，供回合内核识别
    //   critAtkStack / killRefreshTreasure / critBreakShield / spellLifestealToShield /
    //   shieldLifesteal / reviveOnce / shieldBreakSlow / regenShieldEachTurn / shieldImmuneCtrl /
    //   hurtStackReflect / lowHpReflectMult / reflectMagic / evaSpeedUp / doubleEvaResetCd /
    //   evaImmuneBurn / hpLossBoostTreasure / shieldBreakReflect / lowHpTreasureCdHalf
    const fateFlags = {};
    // 模块三·命痕并入劫印：劫印达到 mechTier 品阶后附着的 mechanism 聚合进 fateFlags，
    // 供回合内核（critAtkStack / reviveOnce / regenShieldEachTurn / ...18 项）实施规则改写。
    // （原 bonus.fates 命痕通路已随命痕系统移除，劫印为单局机制唯一真源。）
    if (bonus && bonus.seals && bonus.seals.length) {
      bonus.seals.forEach((sl) => {
        if (sl && sl.mechanism) {
          fateFlags[sl.mechanism] = (fateFlags[sl.mechanism] || 0) + (sl.mechVal || 1);
        }
      });
    }
    // 套装共鸣系统（平衡 V47）：在劫印/事件加成之后、封顶之前统一结算，
    // 玄武套的减伤乘区可大幅推高 dr（封顶 0.85 即为其防御本质天花板，与其它套拉开差距）。
    const _resFlags = {};
    const _ctx = { atk, maxHp, dr, matk, mdef, eva, cri, criMult, hpRegen, sealDr: sealDrTotal, flags: _resFlags };
    const _state = (NDX.game && NDX.game.state) || null;
    NDX.applySetResonance(equips, _ctx, _state);
    // V9.9 照镜人·明心见性（心魔隐藏线觉醒）：心魔转临时攻击——魔念愈盛，出手愈重。
    // 仅取 SET_JOBS 的 extra(xinmoAtk) 进战斗；SET_JOBS 的 ti 数值加成仍按既有口径并入面板（attr_calc 7.5），
    // 不在战斗重复计入，避免既有套装隐藏职（贪狼/破军/…）数值突变。
    if (NDX.setJobBonusFor && _state && (_state.xinmo || 0) > 0) {
      const _sj = NDX.setJobBonusFor(_state);
      if (_sj && _sj.extra) _ctx.atk *= (1 + (_state.xinmo || 0) / 100 * _sj.extra);
    }
    // 系统间协同共鸣（V3 §6）：劫印+经文 / 劫印+装备 / 经文+装备 / 三者大协同，
    // 在套装共鸣之后、封顶之前统一结算（乘区/加区叠加，随减伤/闪避封顶收敛）。
    if (NDX.applyCrossResonance) NDX.applyCrossResonance(equips, _ctx, _state);
    atk = _ctx.atk; maxHp = _ctx.maxHp; dr = _ctx.dr; matk = _ctx.matk; mdef = _ctx.mdef;
    eva = _ctx.eva; cri = _ctx.cri; criMult = _ctx.criMult; hpRegen = _ctx.hpRegen;
    // —— 模块八·灵宠被动 + 同阵羁绊（V8.6x）：把「收集灵兽→变强」这条线真正接入战斗 ——
    // 静态型 petPassive（dragon_aura/rockwall/hymn/guard/gold_per_turn）在此并入属性；
    // 机制型（regen/poison/stoneheart/whisk/cleanse/rend/firstStrike）以标记并入返回 petPassive，
    // 由 simulateSingle 的回合内核消费。羁绊属性直接并入；御兽·亲合(petRes)放大羁绊/灵兽数值。
    let petGold = 0;
    const m8pp = NDX.aggregatePetPassive(equips);
    const _petResMult = _resFlags.petRes ? 1.4 : 1; // 御兽·亲合：御兽套 tier3 灵兽共鸣（羁绊收益放大）
    NDX.petFetterEffects(equips).forEach((f) => {
      if (f.hpPct) maxHp *= (1 + f.hpPct * _petResMult);
      if (f.atkPct) atk *= (1 + f.atkPct * _petResMult);
      if (f.matkPct) matk *= (1 + f.matkPct * _petResMult);
      if (f.eva) eva += f.eva * _petResMult;
    });
    // 静态 petPassive：龙威(攻/暴) / 岩甲减伤 / 梵音减伤 / 憨直护主减伤 / 金蟾战后金
    if (m8pp.dragon_aura) { atk *= (1 + 0.06 * m8pp.dragon_aura); cri += 0.02 * m8pp.dragon_aura; }
    if (m8pp.rockwall) dr += 0.04 * m8pp.rockwall;
    if (m8pp.hymn) dr += 0.05 * m8pp.hymn;
    if (m8pp.guard) dr += 0.02 * m8pp.guard;
    if (m8pp.gold_per_turn) petGold = 20 + 15 * (m8pp.gold_per_turn - 1); // 每战+金（场均 20，多只递增）
    // 血量上限随英雄基数放大：取消升级成长后，装备需承载主要血量（V39 修订 *4）
    const capHp = hero.baseHp ? hero.baseHp * 4 : 4000;
    maxHp = Math.min(capHp, maxHp);
    dr = Math.min(0.85, dr); mdef = Math.min(0.85, mdef); eva = Math.min(0.6, eva);
    return {
      ti: {
        atk: Math.round(atk), maxHp: Math.round(maxHp), hp: Math.round(maxHp),
        dr: +dr.toFixed(3), eva: +eva.toFixed(3), cri: +cri.toFixed(3), criMult: criMult, hit: hit,
        atkB: +atkB.toFixed(3), fixAtk: Math.round(fixAtk), fixDr: Math.round(fixDr), hpRegen: Math.round(hpRegen),
      },
      yuan: {
        matk: Math.round(matk), mdef: +mdef.toFixed(3), matkB: +matkB.toFixed(3),
        fixMatk: Math.round(fixMatk), fixMdef: Math.round(fixMdef),
      },
      hp: Math.round(maxHp),
      // 战力总评：后台聚合复杂公式，前台只展示一个直观数字（颜色随强弱变化）
      // 体攻/愿伤主权重；气血按生存换算；减伤/法防/闪避/暴击按等效战力折算；命痕机制额外加权
      power: Math.round(
        atk +
        matk * 0.8 +
        maxHp * 0.12 +
        dr * 1500 +
        mdef * 1500 +
        eva * 800 +
        cri * 700 +
        criMult * 120 +
        (Object.keys(fateFlags).length * 60)
      ),
      // 劫印派生标记：供 calcCombat 读取（反伤比例/吸血/残影必中）
      sealReflect: sealReflectTotal,
      lifesteal: +sealFlags.lifesteal.toFixed(3),
      evaOnDodge: sealFlags.evaOnDodge || !!_resFlags.evaOnDodge,
      // 命痕机制标记：聚合后的 mechanism 字典，供回合内核实施规则改写
      fateFlags,
      // 套装共鸣标记（平衡 V47）：供 UI 展示「已共鸣」套装、盘缠经济、残影联动
      setResonance: _resFlags.resonated || [],
      // 系统间协同共鸣标记（V3 §6）：劫印+经文 / 劫印+装备 / 经文+装备 / 三者大协同词条
      crossResonance: _resFlags.crossResonated || [],
      goldPct: _resFlags.goldPct || 0,        // 盘缠套：战斗掉落金加成
      shopDiscount: _resFlags.shopDiscount || 0, // 盘缠套：商店折扣
      // V8.5x 构筑分化：装备通用来源（反伤/速度/护盾），收敛体攻暴击流唯一解
      reflect: +equipReflect.toFixed(3),
      spd: (hero.baseSpd != null ? hero.baseSpd : 8) + equipSpd,
      shieldPct: +equipShieldPct.toFixed(3),
      // V8.44 事件装备：无视护甲（armorPen 穿透怪物减伤，装备专用来源）
      armorPen: +equipArmorPen.toFixed(3),
      // 转职·engineTier 全机制词透传（破甲/多段/旧伤/悖论/混沌/吸血/对Boss/遁影），供回合内核消费
      engineTier: ((bonus && bonus.tier && bonus.tier.engineTier) || {}),
      // —— 模块八·灵宠被动字典透传（V8.6x）：机制型被动标记（regen/poison/stoneheart/whisk/cleanse/rend/berserk/firstStrike）供 simulateSingle 回合内核消费 ——
      petPassive: m8pp,
      // —— 金蟾·每战+金：战斗结算时兑现（game_combat_2 读取 res.petGold 累加盘缠）——
      petGold: m8pp.gold_per_turn ? (20 + 15 * (m8pp.gold_per_turn - 1)) : 0,
    };
  };

  NDX.calcCombat = function (player, rawMonster) {
    // 多阶段 Boss：m.stages 为各阶段血量数组（≥2），逐阶段模拟，阶段衔接处植入"破韧窗口"
    if (rawMonster.stages && rawMonster.stages.length >= 2) return calcMultiStage(player, rawMonster);
    const m = normalizeMonster(rawMonster);
    const single = simulateSingle(player, m);
    return Object.assign({}, single, {
      multiStage: false,
      // —— 气势·识破·克制联动：透传克制标签与玩家双攻（供 applyShiPo / applyMomentumBurst 结算读取）——
      monsterTags: rawMonster.tags || [],
      _playerAtk: (player.ti && player.ti.atk) || 0,
      _playerMatk: (player.yuan && player.yuan.matk) || 0,
    });
  };

  // 单阶段战斗模拟：原 calcCombat 内核，独立为可被多阶段复用的纯函数
  function simulateSingle(player, m) {
    const pTi = player.ti, pYuan = player.yuan;
    // 劫印派生标记（来自 computeStats 并入的 seals）
    const sealReflect = player.sealReflect || 0;        // 逆道反伤比例
    const sealLifesteal = player.lifesteal || 0;        // 吸血比例（渡厄/噬血）
    let evaOnDodgeSeal = !!player.evaOnDodge;            // 残影：闪避后下一击必中
    let nextHitSure = false;                             // 残影触发标记（闪避后置 true，下次普攻必中）

    // 命痕机制标记（来自 computeStats.fateFlags）：聚合后的 mechanism 字典
    const fate = player.fateFlags || {};
    // 转职·engineTier 机制词（回合内核消费）
    const engine = player.engineTier || {};
    // —— 模块八·灵宠机制被动（V8.6x）：computeStats.aggregatePetPassive 透传的标记字典，
    // 回合内核消费 regen/poison/stoneheart/whisk/cleanse/rend/berserk/firstStrike ——
    const _m8 = player.petPassive || {};
    const _pp = (k) => (_m8[k] || 0) > 0;        // 被动是否上阵
    const _ppN = (k) => (_m8[k] || 0);           // 被动档数（同型可多只叠加）
    const _whiskRounds = _pp('whisk') ? _ppN('whisk') : 0; // 踏雪·开场轻身免控（前 N 回）
    let battleRound = 0;                          // 供 whisk 等按回合判定的被动使用（enemyAttack 闭包读）
    let petStoneUsed = false;                     // 灵岩·石心：首次受致命伤保命已消耗
    // V8.50 玩家侧 debuff（Boss 招牌）：从怪物名解析招牌 debuff 规格
    const debuffSpec = NDX._bossDebuffSpec ? NDX._bossDebuffSpec(m.name) : null;
    const F = (k) => (fate[k] || 0) > 0;                 // 标记是否存在
    let fateCritStackAtk = 0;                            // 碎骨：已叠永久物攻
    let fateEvaSpeed = false;                            // 轻影：闪避后下一击抢先出手
    let fateDoubleEvaCount = 0;                          // 逐风：本场连续闪避计数
    let fateHurtReflect = 0;                            // 蚀骨：受伤叠反伤比例（受击累积）
    let fateRevived = false;                             // 金蝉：是否已复活
    let fateKillCount = 0;                               // 逐杀：本场击杀计数（供 game 层刷法宝CD）
    let fateEvadeLoot = 0;                               // 影遁·闪避掉宝：本场闪避掉宝次数
    let _immuneDeathUsed = false;                        // 业镜·天命护符：致死免疫是否已消耗
    let evaImmuneBurnThisTurn = false;                   // 逆鳞：本回合闪避免灼烧
    let fateDoubleEvaReset = false;                      // 逐风：已达成双闪重置法宝CD
    const hero = (player.heroId && NDX.HEROES[player.heroId]) ? NDX.HEROES[player.heroId] : null;
    // 隐藏职 passive：从已确认转职抽取 effect.passive，与英雄原 passive 合并（新增键直接补充）
    let P = (hero && hero.passive) ? Object.assign({}, hero.passive) : {};
    const jobConfirm = player.jobConfirm || null;
    if (jobConfirm) {
      for (const k of Object.keys(NDX.HIDDEN_JOBS || {})) {
        const hit = (NDX.HIDDEN_JOBS[k] || []).find((x) => x.job === jobConfirm);
        if (hit && hit.effect && hit.effect.passive) {
          Object.assign(P, hit.effect.passive);
          break;
        }
      }
    }
    const good = Number(player.good) || 0;
    const pSpd = Number(player.spd) || 8;
    const mSpd = Number(m.spd) || 8;
    const ENRAGE_MULT = 1.5;

    // 八戒·净坛善缘：善念转化为体攻(随 pPhysBase)与真实气血上限(hp 同步涨，封顶 baseHp*4)
    // 注意：不调减伤，否则怪物难破盾、反伤触发慢，反而自损输出(护盾悖论)
    if (P.mercyHp) {
      const cap = (hero && hero.baseHp) ? hero.baseHp * 4 : 4000;
      pTi.maxHp = Math.min(cap, Math.round(pTi.maxHp * (1 + P.mercyHp * good)));
      pTi.hp = pTi.maxHp;
    }

    let pHp = clampHp(pTi.hp, hero, pTi.maxHp);
    let mHp = m.hp;
    // P1-1 精英/Boss 随从（第一期·前置肉盾）：玩家伤害先扣随从血条，随从破胆（血尽）后溢出伤害直打本体。
    // 随从本身即「本体减伤」的具象：随从存活期间本体不受任何伤害（肉盾挡刀），破胆后攻势长驱直入。
    let minionHp = 0, minionMax = 0, minionBroken = false;
    if (m.minion && m.minion.hpPct > 0 && m.hp > 0) {
      minionMax = minionHp = Math.max(1, Math.round(m.hp * m.minion.hpPct));
    }

    // 八戒·净坛护盾：开局气血 15% 护盾吸收（兼容业镜·星宿护盾 player.shieldPct）
    let shield = ((P.shieldPct || player.shieldPct) && pTi.maxHp) ? Math.round(pTi.maxHp * (P.shieldPct || player.shieldPct)) : 0;
    // 隐藏职·吞食护盾（八戒净坛逆食/天蓬复称）：开局额外饱食护盾，恶≥20 再 +5%
    if (P.glutton && pTi.maxHp) shield += Math.round(pTi.maxHp * P.glutton);
    // 沙僧·复权：反震比例由英雄原 mReflect 提升（卷帘镇妖 +10%）
    if (P.mReflectBoost && P.mReflect) P.mReflect = Math.min(0.85, P.mReflect + P.mReflectBoost);
    // 小白龙·疾风连击：闪避成功叠暴击层（每层 +50%，至多 3）
    let criStack = 0;
    // 方案X2·六道攻式（自动战斗）：按当前主要道途单一生效（player.daoAtk 由 stats() 透传）
    const _dA = (player && player.daoAtk) || null;
    const _dKey = (_dA && _dA.style) ? _dA.style.key : null;
    const _dPct = (_dA && _dA.style) ? (_dA.style.pct || 0) : 0;
    let daoEvadeCrit = false; // 隐道·影遁必杀：玩家闪避后下一次攻击必爆
    // 沙僧·沉沙御念：御念额外 +8%（上限 85%）。玩家法防取 yuan.mdef（御念体系）
    let pMdef = (pYuan.mdef || 0) + (P.guardMdef || 0); if (pMdef > 0.85) pMdef = 0.85;
    // 悟空·金睛破甲：每次物理出手使怪物护甲临时-（叠加，最低 0）
    let sunderStack = 0;
    // 隐藏职·吞食护盾：每次受击回血 2%（八戒净坛逆食/天蓬复称）
    const gluttonHeal = P.glutton ? 0.02 : 0;
    // 隐藏职·复权：每场首次受击免伤 20%（沙僧卷帘复权/镇妖）
    let restoredFirstUsed = false;
    const restoredFirst = !!P.restored;
    // 隐藏职·残血叠攻：按损失气血比例提升攻击（小白龙逆鳞白龙/龙太子归）
    const reverseScale = !!P.reverseScale;

    let enraged = false;       // 怪物是否已狂暴
    let pDots = [], mDots = []; // DOT 状态池
    let pDebuffs = {};          // 玩家侧 debuff 状态池（Boss 招牌，V8.50）

    // —— V9.x 怪物行为引擎：动作决定（普攻/蓄力重击/铁壁蓄势/妖气暴涨）——
    // 借鉴杀戮尖塔意图脚本 + 暗黑地牢技能池：mob 用技能池加权随机，elite/boss 用 pattern 循环，
    // 低血 ≤30% 且配置 stagePatterns 时切换阶段脚本（与狂暴 enrage 并存）。
    // guard=本回合不出手+玩家攻击减伤（白嫖爆发窗口）；buff=本回合不出手+攻击永久叠层。
    let mBuffLayers = m.buffLayersStart || 0;  // 妖气暴涨层数（怪物攻击 ×(1+0.2×层)，本场持久；词条·妖气弥漫可开场起手 1 层）
    let mGuardPct = 0;            // 本回合铁壁蓄势减伤比例（玩家回合结算，回合末重置）
    let _mPatIdx = 0;             // 意图脚本游标（elite/boss pattern 循环）
    const _mB = m.behavior || {};
    const _mHasBehavior = !!(_mB.pattern || _mB.pool || _mB.mode);

    // —— 气势系统（黑神话棍势的回合制抽象：积累→爆发）——
    // 每次命中 +1 气势；三势封顶（5 点）；受重击（>15% 最大气血）-1（风险要素）；
    // 操作点可"爆发"倾泻（applyMomentumBurst），层级决定倍率。
    let momentum = 0;                    // 气势点数（0~MAX_MOMENTUM）
    const MAX_MOMENTUM = 5;              // 三势封顶
    const MOMENTUM_TIER = [0, 1, 3, 5];  // 层级阈值：一势≥1 / 二势≥3 / 三势=5
    const MOMENTUM_BURST_X = [0, 0.6, 1.0, 1.5]; // 层级爆发倍率（基于玩家双攻）
    const tierOf = (v) => (v >= 5 ? 3 : v >= 3 ? 2 : v >= 1 ? 1 : 0);

    const pPhysBase = Math.round(pTi.atk * (1 + (pTi.atkB || 0) + (P.mercyAtk || 0) * good) + (pTi.fixAtk || 0));
    const pMagicBase = Math.round(pYuan.matk * (1 + (pYuan.matkB || 0)) + (pYuan.fixMatk || 0));

    // —— V9.x 怪物行为引擎：动作决定器 ——
    // 返回 { type: 'atk'|'heavy'|'guard'|'buff' }；pattern 脚本元素可带附加字段（如 {type:'guard',pct:0.4}）。
    function _mSeqOf(b, hpR) {
      if (b && b.stagePatterns && hpR > 0 && hpR <= 0.30 && Array.isArray(b.stagePatterns[0.30])) return b.stagePatterns[0.30];
      if (b && Array.isArray(b.pattern)) return b.pattern;
      return null;
    }
    function decideMonsterAction(round, mHpAlive) {
      const b = m.behavior || {};
      const mode = b.mode || (m.type === 'mob' ? 'pool' : 'pattern');
      const hpR = m.hp > 0 ? (mHpAlive / m.hp) : 0;
      const seq = _mSeqOf(b, hpR);
      if (mode === 'pool' || !seq) {
        // 技能池加权随机（mob 默认；guard/buff 权重低，避免拖慢小怪速杀节奏）
        // 兼容旧字段：未配置 behavior 但走 heavyEvery 蓄力周期的怪（如蓄力试炼妖），
        // 随机池剔除 heavy —— 重击仅由 heavyEvery 周期驱动，避免与意图预告(telegraphSoon)互斥冲突。
        const _legacyHeavy = !!(b.pool || b.pattern || b.mode) ? false : (m.heavyEvery || 0) > 0;
        const pool = b.pool || (m.type === 'mob'
          ? ( _legacyHeavy
              ? [{ type: 'atk', w: 8 }, { type: 'guard', w: 0.5 }, { type: 'buff', w: 0.5 }]
              : [{ type: 'atk', w: 8 }, { type: 'heavy', w: 1 }, { type: 'guard', w: 0.5 }, { type: 'buff', w: 0.5 }])
          : ( _legacyHeavy
              ? [{ type: 'atk', w: 5 }, { type: 'guard', w: 1 }, { type: 'buff', w: 1 }]
              : [{ type: 'atk', w: 5 }, { type: 'heavy', w: 2 }, { type: 'guard', w: 1 }, { type: 'buff', w: 1 }]));
        let sum = 0; for (const x of pool) sum += (x.w || 1);
        let r = Math.random() * sum;
        for (const x of pool) { r -= (x.w || 1); if (r < 0) return { type: x.type }; }
        return { type: 'atk' };
      }
      const act = seq[_mPatIdx % seq.length] || 'atk';
      _mPatIdx++;
      return typeof act === 'string' ? { type: act } : Object.assign({}, act);
    }
    // 下一回合意图预告（仅 pattern 脚本可预知；技能池随机不预告）
    function peekNextMonsterAction(mHpAlive) {
      const b = m.behavior || {};
      const hpR = m.hp > 0 ? (mHpAlive / m.hp) : 0;
      const seq = _mSeqOf(b, hpR);
      if (!seq) return null;
      const act = seq[_mPatIdx % seq.length];
      return typeof act === 'string' ? act : (act && act.type) || null;
    }

    // —— 怪物的一次攻击（受狂暴 ×1.5 / 蓄力重击 heavy / 多段连击 multi / 玩家闪避 / 护盾 / 沙僧反震 / 附加咒蚀 DOT）——
    // V9.x：heavy 由调用方显式传入（行为引擎动作类型 或 旧 heavyEvery/残血狂暴前兆），不再闭包读循环作用域 telegraph。
    // multi=疾风连击（hits 段×hitMult 逐段独立闪避，总伤≈hits×hitMult×普攻，方差高、单段轻不削气势）；
    // heal=妖法回春（本回合不出手，回复最大血量 pct，制造"集火打断"压力）。
    function enemyAttack(action, isHeavy) {
      const act = action || {};
      // V9.x 铁壁蓄势 / 妖气暴涨 / 妖法回春：本回合怪物不出手（白嫖爆发窗口），结算状态变化
      if (act.type === 'guard' || act.type === 'buff' || act.type === 'heal') {
        let healAmt = 0;
        if (act.type === 'buff') { mBuffLayers++; }
        else if (act.type === 'guard') { mGuardPct = (act.pct != null ? act.pct : (_mB.guardPct != null ? _mB.guardPct : (m.guardPct || 0.30))); }
        else if (act.type === 'heal') {
          healAmt = Math.round(m.hp * (act.pct != null ? act.pct : (_mB.healPct != null ? _mB.healPct : (m.healPct || 0.10))));
          mHp = Math.min(m.hp, mHp + healAmt);
        }
        return { dodged: false, phys: 0, magic: 0, deal: 0, cri: false, heavy: false, guard: act.type === 'guard', buff: act.type === 'buff', heal: act.type === 'heal', healAmt: healAmt, buffLayers: mBuffLayers };
      }
      const multiHits = act.type === 'multi' ? Math.max(2, (act.hits || 3)) : 1;
      const heavy = multiHits === 1 && (isHeavy || act.type === 'heavy');
      const mMult = multiHits > 1 ? (act.hitMult || 0.55) : (heavy ? (m.heavyMult || 1.6) : 1); // 蓄力重击倍率（识破窗口标记生效）
      const buffAtk = 1 + mBuffLayers * (_mB.buffAtkPct != null ? _mB.buffAtkPct : (m.buffAtkPct || 0.2));   // 妖气暴涨：攻击 ×(1+0.2×层)
      const atkMult = enraged ? (m.furyMult || ENRAGE_MULT) : 1;
      const perPhys = Math.round(m.atk * (1 + (m.atkB || 0)) * atkMult * buffAtk * mMult + (m.fixAtk || 0));
      const perMgc = Math.round((m.matk || 0) * (1 + (m.matkB || 0)) * atkMult * buffAtk * mMult + (m.fixMatk || 0));
      const eva = Math.min(0.6, (pTi.eva || 0) + (engine.vanish || 0)); // 转职·遁影提升闪避（P.evasion 死键已移除）
      // 闪避特效统一入口（单段全闪 / 多段全闪皆经此）：白龙连击叠暴击 / 隐道必爆 / 残影必中 / 轻影抢先 / 逆鳞免灼 / 逐风双闪 / 影遁掉宝
      const _dodgeReturn = () => {
        if (P.criOnDodge) criStack = Math.min((P.criCap || 3), criStack + 1); // 闪避叠暴击
        if (_dKey === 'evade-crit') daoEvadeCrit = true; // 隐道·影遁必杀：闪避蓄势，下一次攻击必爆
        if (evaOnDodgeSeal) nextHitSure = true; // 劫印·残影：闪避后下一击必中
        // 命痕·轻影：闪避后下次攻击抢先出手
        if (F('evaSpeedUp')) fateEvaSpeed = true;
        // 命痕·逆鳞：闪避成功免疫灼烧（本回合不计咒蚀 DOT）
        if (F('evaImmuneBurn')) evaImmuneBurnThisTurn = true;
        // 命痕·逐风：单场连续两次闪避，重置一件法宝冷却（计次，战斗后透传 game 层）
        if (F('doubleEvaResetCd')) { fateDoubleEvaCount++; if (fateDoubleEvaCount >= 2) fateDoubleEvaReset = true; }
        // 转职·影遁：闪避时概率从敌身上掠下宝物（战斗结算时折为碎金）
        if (engine.evadeLoot && Math.random() < engine.evadeLoot) fateEvadeLoot++;
        return { dodged: true, phys: 0, magic: 0, deal: 0, cri: false, absorbed: 0, reflect: 0, shieldBomb: 0, heavy: heavy, multi: multiHits > 1, hits: multiHits, hitCount: 0 };
      };
      let hitCount = multiHits;
      if (multiHits > 1) {
        // 多段连击：逐段独立闪避；全闪才触发闪避特效（部分命中不触发，公平）
        let landed = 0;
        for (let i = 0; i < multiHits; i++) { if (Math.random() >= eva) landed++; }
        if (landed === 0) return _dodgeReturn();
        hitCount = landed;
      } else if (Math.random() < eva) {
        return _dodgeReturn();
      }
      const phys = perPhys * hitCount;
      const mgc = perMgc * hitCount;
      const dmgP0 = Math.max(0, Math.round(phys * (1 - pTi.dr) * (1 + (player.coll ? player.coll.dmgTakenColl || 0 : 0)) - (pTi.fixDr || 0)));
      const dmgM0 = Math.max(0, Math.round(mgc * (1 - pMdef) - (pYuan.fixMdef || 0)));
      let dmgP = dmgP0, dmgM = dmgM0;
      let absorbed = 0;
      let shieldBomb = 0;
      if (shield > 0) {
        absorbed = Math.min(shield, dmgP + dmgM);
        shield -= absorbed;
        if (shield <= 0) {
          if (P.shieldBomb && pTi.maxHp) { shieldBomb = Math.round(pTi.maxHp * P.shieldBomb); mHp -= shieldBomb; }
          // 命痕·坚甲：护盾被击碎时，攻击者减速（降低怪物速度与先手权，下回合表现）
          if (F('shieldBreakSlow')) { mSpd = Math.max(1, mSpd - Math.round(mSpd * fate['shieldBreakSlow'])); }
          // 命痕·残魂：护盾被击碎时，对全场敌人反弹该护盾值的 50% 伤害
          if (F('shieldBreakReflect') && pTi.maxHp) { mHp -= Math.round(Math.abs(absorbed) * fate['shieldBreakReflect']); }
          shield = 0;
        }
      }
      const dealt = dmgP + dmgM - absorbed;
      // 隐藏职·复权：每场首次受击免伤 20%（在扣血前先扣减）
      let preDealt = dealt;
      if (restoredFirst && !restoredFirstUsed && preDealt > 0) {
        preDealt = Math.round(preDealt * 0.8);
        restoredFirstUsed = true;
      }
      // V8.49 多回合制：怪物攻击全局削力
      preDealt = Math.round(preDealt * GLOBAL_DMG_MUL);
      pHp -= Math.max(0, preDealt);
      // 气势衰减：受重击（>15% 最大气血）掉 1 点气势（风险要素，防无脑攒势）
      // 多段连击按单段判定（段伤轻不削气势，与 heavy 单发大伤的"破势"定位区分）
      if ((preDealt / Math.max(1, hitCount)) > pTi.maxHp * 0.15 && momentum > 0) momentum -= 1;
      let reflect = 0;
      // 沙僧「流沙反震」：受击即按所承伤害比例反伤（物理+法术皆生效），契合肉盾定位
      if (P.mReflect && dealt > 0) {
        const rPct = P.mReflect * (dmgM > 0 ? 1 : 0.7); // 法术承伤全额反，物理承伤七成反
        reflect = Math.round(dealt * rPct);
        mHp -= reflect;
      }
      // 劫印·逆道（戾骨/反噬）：受击按比例反伤（与英雄 mReflect 独立叠加）
      if (sealReflect > 0 && dealt > 0) {
        const rR = Math.round(dealt * sealReflect);
        if (rR > 0) { mHp -= rR; reflect += rR; }
      }
      // V8.5x 构筑分化：装备反伤（通用来源，与劫印/英雄被动独立叠加），收敛体攻暴击流唯一解
      const equipReflect = player.reflect || 0;
      if (equipReflect > 0 && dealt > 0) {
        const rE = Math.round(dealt * equipReflect);
        if (rE > 0) { mHp -= rE; reflect += rE; }
      }
      // 命痕·蚀骨：每次受伤叠加反伤比例（持续累积，本场越打反伤越高）
      if (F('hurtStackReflect') && dealt > 0) {
        fateHurtReflect = Math.min(0.5, fateHurtReflect + fate['hurtStackReflect']);
        const hR = Math.round(dealt * fateHurtReflect);
        if (hR > 0) { mHp -= hR; reflect += hR; }
      }
      // 命痕·万劫：气血低于 35% 时，反伤触发 2 段（在既有反伤基础上追加一段等值反伤）
      if (F('lowHpReflectMult') && pHp > 0 && pHp <= pTi.maxHp * 0.35 && dealt > 0) {
        const extra = Math.round(dealt); // 低血追加一段等值反伤（修复 deal→dealt 崩溃；原倍率三元恒为1，清理）
        if (extra > 0) { mHp -= extra; reflect += extra; }
      }
      // 命痕·流沙：反伤附带等量法术伤害（将本回合反伤量再加成一次法伤反震）
      if (F('reflectMagic') && reflect > 0) {
        const mR = Math.round(reflect * 1);
        if (mR > 0) { mHp -= mR; reflect += mR; }
      }
      // 隐藏职·弃经金蝉：受击按承伤比例反震 6%（独立比例，不依赖英雄 mReflect）
      if (P.buddha_def && dealt > 0) {
        const bR = Math.round(dealt * P.buddha_def);
        if (bR > 0) { mHp -= bR; reflect += bR; }
      }
      // 隐藏职·吞食护盾：每次受击回血 2%
      if (gluttonHeal > 0 && preDealt > 0) {
        pHp = Math.min(pTi.maxHp, pHp + Math.round(pTi.maxHp * gluttonHeal));
      }
      // 小概率对玩家附加「咒蚀」DOT
      // 命痕·逆鳞：本回合闪避成功则免疫灼烧（不附加咒蚀 DOT）
      // 命痕·万象：自身有护盾时免疫一切控制（含咒蚀 DOT 与减速）
      const immuneCtrl = F('shieldImmuneCtrl') && shield > 0;
      // 踏雪·轻身免控（V8.6x）：开场前 _whiskRounds 回合也不中咒蚀（免控/轻身）
      const whiskImmune = _whiskRounds > 0 && battleRound <= _whiskRounds;
      if (Math.random() < 0.12 && !evaImmuneBurnThisTurn && !immuneCtrl && !whiskImmune) {
        const dotDmg = Math.max(8, Math.round(m.atk * 0.12 * atkMult));
        pDots.push({ dmg: dotDmg, kind: '咒蚀', turns: 2 });
      }
      // 词缀·咒骨：怪物攻击必附加 2 回合咒蚀（无视免控—此为被动侵蚀，非控制类）
      if (m.hexDmgPct && !evaImmuneBurnThisTurn) {
        const hexDmg = Math.max(8, Math.round(m.atk * m.hexDmgPct * atkMult));
        pDots.push({ dmg: hexDmg, kind: '咒蚀', turns: 2 });
      }
      // 词缀·噬血：怪物命中玩家时吸取 12% 伤害为自身气血
      if (m.hpRegenPct && preDealt > 0) {
        mHp = Math.min(m.hp, mHp + Math.round(preDealt * m.hpRegenPct));
      }
      return { dodged: false, phys: dmgP, magic: dmgM, deal: Math.max(0, preDealt), absorbed: absorbed, reflect: reflect, shieldBomb: shieldBomb, cri: false, heavy: !!heavy, guard: false, buff: false, buffLayers: mBuffLayers, multi: multiHits > 1, hits: multiHits, hitCount: hitCount };
    }

    // —— 玩家的一次攻击（受破甲 / 暴击 / 命中判定 / 怪物反击 / 附加裂伤 DOT）——
    function playerAttack() {
      if (P.sunder) sunderStack = Math.min(0.5, sunderStack + P.sunder); // 破甲叠加
      if (engine.sunder) sunderStack = Math.min(0.9, sunderStack + engine.sunder); // 转职·破甲
      if (player.coll && player.coll.breakEffColl) sunderStack = Math.min(0.9, sunderStack + player.coll.breakEffColl); // 业藏录·破韧效率
      const effMDr = Math.max(0, m.dr - sunderStack);
      // 隐藏职·残血叠攻（小白龙逆鳞白龙/龙太子归）：每损失 10% 气血，攻击 +3%，上限 +30%
      let rsMult = 1;
      if (reverseScale && pTi.maxHp > 0) {
        const lost = Math.max(0, (pTi.maxHp - pHp) / pTi.maxHp);
        rsMult = 1 + Math.min(0.30, 0.03 * Math.floor(lost * 10));
      }
      // 隐藏职·空（悟空悟空的空/齐天系列/六耳残）：每次出手概率「空」——本次攻击无视防御与减伤（绝对穿透）
      const emptyHit = P.empty ? (Math.random() < P.empty) : false;
      let bonus = P.criOnDodge ? (P.criOnDodge * criStack) : 0; criStack = 0; // 暴击层倾泻后清零
      // 模块七·criBonus 已由 computeStats 单源加性消费（基础 0.10 + P.criBonus），此处若再叠会造成双倍暴击，故不再重复接线。
      // 方案X2·战道攻式：暴击率加性叠加（独立于 criBonus 单源，不双倍）
      let pCri = Math.random() < ((pTi.cri || 0) + bonus + (_dKey === 'crit' ? _dPct : 0));
      // 隐道·影遁必杀：闪避后下一次攻击必爆（daoEvadeCrit 由 enemyAttack 闪避分支置位）
      if (_dKey === 'evade-crit' && daoEvadeCrit) { pCri = true; daoEvadeCrit = false; }
      const phys = Math.round(pPhysBase * rsMult * (pCri ? (pTi.criMult || 1.6) : 1));
      // 命痕·碎骨：每次暴击永久 +val 物攻（越打越狠，累积到 pPhysBase）
      if (F('critAtkStack') && pCri) { fateCritStackAtk += fate['critAtkStack']; pPhysBase += fate['critAtkStack']; }
      // 命痕·齐天：暴击必破护盾，并使该敌减防（本次攻击无视怪物护盾概念——此处对怪物护甲做临时削减）
      // V8.44 事件装备·无视护甲：armorPen 基础穿透怪物减伤（装备专用来源），与齐天命痕可叠加
      let effMDr2 = Math.max(0, effMDr - (player.armorPen || 0));
      if (F('critBreakShield') && pCri) { effMDr2 = Math.max(0, effMDr2 - fate['critBreakShield']); }
      // 劫印·残影：闪避后下一击必中（忽略命中判定）
      if (nextHitSure) { nextHitSure = false; }
      else if (pTi.hit && Math.random() > pTi.hit) {
        return { dodged: true, phys: 0, magic: 0, deal: 0, cri: false, counter: 0, dot: 0 };
      }
      const dmgP = Math.max(0, Math.round(phys * (1 - (emptyHit ? 0 : effMDr2)) - (emptyHit ? 0 : (pTi.fixDr || 0))));
      const magic = Math.round(pMagicBase * (1 + (P.mercy || 0) * good));
      const dmgM = Math.max(0, Math.round(magic * (1 - (emptyHit ? 0 : (m.mdef || 0))) - (emptyHit ? 0 : (pYuan.fixMdef || 0))));
      // 业藏录加成：对BOSS伤害 / 对天庭特攻（基于 stats 注入的乘区）
      let deal = dmgP + dmgM;
      const _bossMul = (player.coll && player.coll.bossDmgMul || 0) + (engine.bossDmg || 0);
      if (_bossMul && m.boss) deal = Math.round(deal * (1 + _bossMul));
      if (player.coll && player.coll.dmgTiantingColl && m.tianting) deal = Math.round(deal * (1 + player.coll.dmgTiantingColl));
      // 转职·engineTier 机制词（多段/旧伤/悖论/混沌）：命中前单点接线
      if (engine.multi && engine.multi > 0) deal = Math.round(deal * (1 + engine.multi * 0.5));
      if (engine.oldWound && engine.oldWound > 0 && m.hp > 0) { const _lost = Math.max(0, 1 - mHp / m.hp); deal = Math.round(deal * (1 + engine.oldWound * _lost)); }
      if (engine.paradox && engine.paradox > 0) deal = Math.round(deal * (1 + engine.paradox * (m.dr || 0)));
      if (engine.chaos && engine.chaos > 0) deal = Math.round(deal * (1 + (Math.random() * 2 - 1) * engine.chaos));
      // 灵宠·裂伤/狂战（V8.6x）：噬骨狼崽（敌残血≤40% 伤 +10%/档） / 通臂石猿（己残血≤50% 伤 +20%/档）
      if (_pp('rend') && mHp > 0 && m.hp > 0 && (mHp / m.hp) <= 0.4) deal = Math.round(deal * (1 + 0.10 * _ppN('rend')));
      if (_pp('berserk') && pTi.maxHp > 0 && (pHp / pTi.maxHp) <= 0.5) deal = Math.round(deal * (1 + 0.20 * _ppN('berserk')));
      // V8.49 多回合制：玩家攻击全局削力
      deal = Math.round(deal * GLOBAL_DMG_MUL);
      // —— 方案X2·六道攻式结算（自动战斗，按当前主要道途单一生效）——
      let tdAmt = 0; // P0-1 真伤量记录：真伤不吃暴击，baseDeal 反除暴击倍率时单独保留
      if (_dKey === 'true' && _dPct > 0 && deal > 0) { // 逆道·逆锋透骨：附带真伤（无视防御；仍受随从肉盾挡刀，统一走下方分流）
        tdAmt = Math.max(1, Math.round(deal * _dPct));
        deal += tdAmt;
      }
      // V9.x 铁壁蓄势：怪物本回合防御姿态，玩家直接攻击 -guardPct（至少保留 1 点，可破势）
      if (mGuardPct > 0 && deal > 0) deal = Math.max(1, Math.round(deal * (1 - mGuardPct)));
      // P1-1 随从·前置肉盾分流：随从存活期间伤害全吃随从，破胆后溢出直打本体
      if (minionHp > 0 && deal > 0) {
        const _prev = minionHp;
        minionHp = Math.max(0, minionHp - deal);
        const _hit = _prev - minionHp;                 // 随从承受部分
        const _leak = deal - _hit;                     // 破胆溢出部分 → 直打本体
        if (_leak > 0) mHp = Math.max(0, mHp - _leak);
        if (minionHp <= 0 && !minionBroken) { minionBroken = true; } // 破胆（本拍起永久标记，UI 显示「💥 破胆」）
      } else {
        mHp -= deal;
      }
      // 气势积累：命中即涨（克制命中额外 +1，由 applyBattleIntervention 联动置位）
      if (deal > 0) momentum = Math.min(MAX_MOMENTUM, momentum + 1);
      // 渡道·禅光渡世（回血）/ 夺道·夺灵噬血（吸血）/ 缘道·缘起护身（护盾）
      if (_dPct > 0 && deal > 0) {
        const _dGain = Math.round(deal * _dPct);
        if (_dKey === 'heal' || _dKey === 'lifesteal') pHp = Math.min(pTi.maxHp, pHp + _dGain);
        else if (_dKey === 'shield') shield += _dGain;
      }
      // 命痕·渡生：自身有护盾时，普攻附带吸血（有盾才生效）
      if (F('shieldLifesteal') && shield > 0 && deal > 0) {
        pHp = Math.min(pTi.maxHp, pHp + Math.round(deal * fate['shieldLifesteal']));
      }
      // 命痕·禅息：法术吸血有 50% 转为护盾（法伤部分 dmgM 的吸血转盾）
      if (F('spellLifestealToShield') && dmgM > 0) {
        const ls = Math.round(dmgM * (pTi.lifesteal || 0) * fate['spellLifestealToShield']);
        if (ls > 0) { shield += ls; pHp = Math.min(pTi.maxHp, pHp + Math.round(dmgM * (pTi.lifesteal || 0) * (1 - fate['spellLifestealToShield']))); }
        else if (pTi.lifesteal && dmgM > 0) pHp = Math.min(pTi.maxHp, pHp + Math.round(dmgM * (pTi.lifesteal || 0)));
      } else {
        // 劫印·吸血（渡厄/噬血）：按造成伤害比例回血（不超过气血上限）
        if (sealLifesteal > 0 && deal > 0) {
          pHp = Math.min(pTi.maxHp, pHp + Math.round(deal * sealLifesteal));
        }
      }
      // 转职·engineTier 吸血（夺道）：按造成伤害比例回血（与劫印吸血同口径叠加）
      if (engine.lifesteal && engine.lifesteal > 0 && deal > 0) pHp = Math.min(pTi.maxHp, pHp + Math.round(deal * engine.lifesteal));
      // P0-2 绝境反制（BloodRush 式以杀止杀）：玩家气血 ≤25%（命悬一线）时击杀怪物 →
      // 回复 10% 最大气血 + 气势 +2（当拍回血，UI 浮字/角标见 ui_panel_2）。夺道「贪狼·吞噬」同源可叠加。
      let killHeal = 0;
      if (mHp <= 0 && pHp > 0 && pTi.maxHp > 0 && pHp <= pTi.maxHp * 0.25) {
        killHeal = Math.max(1, Math.round(pTi.maxHp * 0.10));
        pHp = Math.min(pTi.maxHp, pHp + killHeal);
        momentum = Math.min(MAX_MOMENTUM, momentum + 2);
      }
      // 命痕·逐杀：本次攻击击杀单位 → 计入击杀（战斗后透传 game 层刷新法宝冷却）
      if (mHp <= 0) fateKillCount++;
      // 命中后：怪物反击（反弹裂缝）——吃玩家减伤（简化不重复吃护盾闪避）
      let counter = 0;
      if (mHp > 0 && Math.random() < (m.counter || 0)) {
        const cAtk = Math.round(m.atk * (1 + (m.atkB || 0)) * (enraged ? (m.furyMult || ENRAGE_MULT) : 1) + (m.fixAtk || 0));
        counter = Math.max(0, Math.round(cAtk * (1 - pTi.dr) - (pTi.fixDr || 0)));
        // V8.49 多回合制：怪物反击也全局削力
        counter = Math.round(counter * GLOBAL_DMG_MUL);
        pHp -= counter;
      }
      // 命中后小概率附加「裂伤」DOT（持续 2 回合）
      let dot = 0;
      if (mHp > 0 && Math.random() < 0.16) {
        dot = Math.max(10, Math.round(pPhysBase * 0.12));
        mDots.push({ dmg: dot, kind: '裂伤', turns: 2 });
      }
      // V8.50 Boss 招牌 debuff：通用结算（落空 / 减攻 / 持续伤害，参数表见 NDX.PDB_*）
      // ① 持续伤害：所有生效的 DOT 型 debuff 各推一条
      const DOTS = NDX.PDB_DOT || {};
      for (const _dt in DOTS) {
        if (pDebuffs[_dt] > 0) {
          const _D = DOTS[_dt];
          pDots.push({
            dmg: Math.max(_D.flat, Math.round((pTi.maxHp || 1) * _D.pctMaxHp + (m.atk || 0) * _D.atkMul)),
            kind: _D.kind, turns: 1,
          });
        }
      }
      // ② 落空：取同时生效者中概率最高者
      const MISS = NDX.PDB_MISS || {};
      let _missP = 0, _missType = null;
      for (const _mt in MISS) {
        if (pDebuffs[_mt] > 0 && MISS[_mt] > _missP) { _missP = MISS[_mt]; _missType = _mt; }
      }
      const _missHit = _missP > 0 && Math.random() < _missP;
      // ③ 减攻：取同时生效者中乘数最小者（惩罚最强）
      const AMUL = NDX.PDB_ATKMUL || {};
      let _atkMul = 1, _atkType = null;
      for (const _at in AMUL) {
        if (pDebuffs[_at] > 0 && AMUL[_at] < _atkMul) { _atkMul = AMUL[_at]; _atkType = _at; }
      }
      const _finalDeal = _missHit ? 0 : Math.round(deal * _atkMul);
      // P0-1 击杀判定：确定性基准伤害（无暴击反除；真伤不吃暴击单独保留），UI「可斩」判定用
      const _tdScaled = Math.round(tdAmt * _atkMul);
      const _baseDeal = (_finalDeal <= 0) ? 0 : (pCri && (pTi.criMult || 1.6) > 1
        ? Math.max(1, Math.round((_finalDeal - _tdScaled) / (pTi.criMult || 1.6) + _tdScaled))
        : _finalDeal);
      return {
        dodged: false,
        phys: _missHit ? 0 : Math.round(dmgP * _atkMul),
        magic: _missHit ? 0 : Math.round(dmgM * _atkMul),
        deal: _finalDeal,
        cri: pCri, counter: counter, dot: dot,
        blindMiss: _missHit, atkDown: _atkMul < 1, realDeal: deal,
        pdbMiss: _missHit ? _missType : null, // 造成落空的 debuff 类型（供 cleanse 还原）
        pdbAtk: _atkType,                     // 造成减攻的 debuff 类型（供 cleanse 还原）
        baseDeal: _baseDeal,                  // P0-1 确定性基准（UI「可斩」判定用）
        killHeal: killHeal,                   // P0-2 绝境反制：低血击杀回血量（UI 浮字展示）
      };
    }

    const roundsDetail = [];
    let round = 0; const MAX = 100; // V9.x 数值止血：回合上限从60提高到100，避免后期Boss战静默撞线
    let roundLimitHit = false; // 回合上限触发标记

    while (pHp > 0 && mHp > 0 && round < MAX) {
      round++;
      // 回合上限触发标记：用于后续显式提示和超时判定
      if (round >= MAX) roundLimitHit = true;
      battleRound = round; // 供 whisk 开场免控等按回合判定的灵宠被动读取
      // —— 模块八·灵宠机制被动（回合内核）——
      // 雪羽·净化：每回合净负面（清 1 条玩家咒蚀 DOT + 清空 Boss 招牌 debuff）
      if (_pp('cleanse')) {
        if (pDots.length) pDots.pop();
        for (const _c of Object.keys(pDebuffs)) delete pDebuffs[_c];
      }
      // 人参·回春：每战回血（每回合开始回 12×档数）
      if (_pp('regen')) pHp = Math.min(pTi.maxHp, pHp + 12 * _ppN('regen'));
      // 蛊虫·蛊毒：每回合始对敌施毒（按敌最大气血 4%/档）
      if (_pp('poison')) mHp -= Math.max(8, Math.round(m.hp * 0.04 * _ppN('poison')));
      // 命痕·厚土：每回合开始恢复 8% 最大气血的护盾（厚土载物）
      if (F('regenShieldEachTurn') && pTi.maxHp) shield += Math.round(pTi.maxHp * fate['regenShieldEachTurn']);
      // 词缀·亵渎：玩家每回合始损失 3% 当前气血（环境侵蚀/封印法宝，无视护盾）
      let _envDrain = 0;
      if (m.envDrainPct && pHp > 0) { _envDrain = Math.max(1, Math.round(pHp * m.envDrainPct)); pHp -= _envDrain; }
      // V8.50 Boss 招牌 debuff：开战即挂、按周期复挂（持续施压，可用对应法宝解除）
      // 踏雪·轻身免控：开场前 _whiskRounds 回合免疫 Boss 招牌 debuff
      if (debuffSpec && !(battleRound <= _whiskRounds)) {
        if (debuffSpec.applyAtStart && round === 1) pDebuffs[debuffSpec.type] = debuffSpec.dur;
        if (debuffSpec.reapplyEvery && round % debuffSpec.reapplyEvery === 0) pDebuffs[debuffSpec.type] = debuffSpec.dur;
      }
      const first = (_pp('firstStrike') && round === 1) ? 'player' : ((pSpd >= mSpd) ? 'player' : 'enemy'); // 羁绊·先手 + 速度判定
      // —— 战斗 AI 底层标注：自动为主、法宝人为干预 ——
      // 普攻属性匹配劫印：法伤主导→佛光（白），物攻主导→金光（金），逆道反伤态叠加黑瘴
      const aiAtkAttr = (pMagicBase > pPhysBase) ? '佛光' : '金光';
      const aiBlack = (sealReflect > 0) || !!(P.mReflect && P.mReflect > 0); // 逆道·黑瘴反伤态
      let justEnraged = false;
      let pTurn = null, mTurn = null;
      // —— V9.x 怪物行为引擎：决定本回合动作（取代旧 heavyEvery 布尔 telegraph）——
      // 兼容旧字段：未配置 behavior 的旧怪保留 heavyEvery 周期（每 N 回合蓄力重击 → 识破窗口）
      const heavyEvery = m.heavyEvery || 0;
      let mAction = null;
      // 教学战（tutorial）强制纯普攻：不注入 behavior（见 game_combat_1），此处再兜一层，
      // 避免未命中注入路径时技能池随机到 guard/buff/heavy 破坏「接引使者/首战」三键教学节奏。
      if (m.tutorial) {
        mAction = { type: 'atk' };
      } else {
        if (!_mHasBehavior && heavyEvery > 0 && round % heavyEvery === 0 && mHp > 0) {
          mAction = { type: 'heavy' };
        } else {
          mAction = decideMonsterAction(round, mHp);
        }
      }
      let telegraph = !!(mAction && mAction.type === 'heavy');
      // 狂暴前兆保留：残血 30% 且偶数回合 → 蓄力重击（识破窗口）
      // V9.x 脚本化怪物（behavior 存在）不受此覆盖：低血强度由 stagePatterns 阶段脚本接管，
      // 保证意图预告（mIntent/mNextIntent）与实际出手一致，不破坏脚本承诺。
      if (!_mHasBehavior && !telegraph && !enraged && mHp > 0 && mHp <= m.hp * 0.30 && round % 2 === 0) { telegraph = true; mAction = { type: 'heavy' }; }
      // V9.x 怪物冒泡说话提醒：根据怪物意图显示冒泡，提醒玩家采取对应策略
      if (NDX.MonsterBubble && NDX.MonsterBubble.showByIntent && round > 1) {
        const _intentType = telegraph ? 'heavy' : (mAction && mAction.type ? mAction.type : 'atk');
        // 只在特殊意图时显示冒泡，普通攻击30%概率说话
        if (_intentType !== 'atk' || Math.random() < 0.2) {
          try { NDX.MonsterBubble.showByIntent(_intentType, { duration: 2500 }); } catch (e) {}
        }
      }
      // 铁壁蓄势：本回合怪物防御姿态 → 玩家本回合攻击减伤（回合末重置）
      mGuardPct = (mAction && mAction.type === 'guard') ? (mAction.pct != null ? mAction.pct : (_mB.guardPct != null ? _mB.guardPct : (m.guardPct || 0.30))) : 0;
      // TURN_START：先手方先出手；若先手击杀，后手不出手
      // 方案X2·隐道影遁必杀：快照本回合玩家攻击前的必爆状态（供手动三键透传，见 game_core_3.js resolveManualActive）
      let _evBefore = false;
      if (first === 'player') {
        _evBefore = daoEvadeCrit;
        pTurn = playerAttack();
        if (mHp > 0) mTurn = enemyAttack(mAction, telegraph);
      } else {
        mTurn = enemyAttack(mAction, telegraph);
        _evBefore = daoEvadeCrit;
        if (pHp > 0) pTurn = playerAttack();
      }
      // TURN_RESOLVE：结算双方 DOT
      const pr = tickDots(pDots); pDots = pr.keep;
      const mr = tickDots(mDots); mDots = mr.keep;
      // V8.50 玩家侧 debuff 回合衰减
      for (const _dk in pDebuffs) { if (pDebuffs[_dk] > 0) pDebuffs[_dk] -= 1; if (pDebuffs[_dk] <= 0) delete pDebuffs[_dk]; }
      const resolve = { dots: [] };
      if (pr.sum > 0) { pHp -= pr.sum; resolve.dots.push({ tgt: 'p', dmg: pr.sum, kind: '咒蚀' }); }
      if (mr.sum > 0) { mHp -= mr.sum; resolve.dots.push({ tgt: 'm', dmg: mr.sum, kind: '裂伤' }); }
      // 业镜·燃寿换力：每秒流失 X% 最大气血（自动战斗中以每回合等值折算）
      if (player.hpDrainPct && pHp > 0) { const _d = Math.max(1, Math.round(pTi.maxHp * player.hpDrainPct)); pHp -= _d; resolve.dots.push({ tgt: 'p', dmg: _d, kind: '燃寿' }); }
      // P0-3 劫难词条·心魔缠身：每 5 回合玩家流失 3% 当前气血（持续施压）
      if (player._curseXinmo && pHp > 0 && round % 5 === 0) {
        const _d = Math.max(1, Math.round(pHp * 0.03));
        pHp -= _d; resolve.dots.push({ tgt: 'p', dmg: _d, kind: '心魔' });
      }
      // 灵岩·石心（V8.6x）：首次受致命伤保命——气血归零时保为 1 点（仅一次，护主救命）
      if (pHp <= 0 && _pp('stoneheart') && !petStoneUsed) { pHp = 1; petStoneUsed = true; }
      // CHECK_END：怪物残血 <30% 且未狂暴 → 触发 ENRAGE（攻击 ×1.5，持续至战斗结束）
      if (!enraged && mHp > 0 && mHp <= m.hp * 0.30) { enraged = true; justEnraged = true; }
      // —— 主动操作点：在关键时刻标记，供玩家"择机祭宝"（打破纯被动回放）——
      //   telegraph ：怪物蓄力重击回合 → 玩家可"识破"反制（优先于其他窗口）
      //   enrage ：妖敌将狂暴（上一回合尚冷静、本回合刚越 30% 阈）→ 此刻祭宝可逆转战局
      //   lowhp  ：玩家命悬一线（上一回合尚 >25%、本回合落到 ≤25%）→ 此刻续命珠可救命
      //   routine ：精英每 4 回合、其余每 5 回合节奏点（双方皆存活）→ 常规择机窗口
      let operationPoint = null;
      const prev = round > 1 ? roundsDetail[round - 2] : null;
      const _isMob = m.type === 'mob'; // V8.4x 破爆发：识别普通小怪战，为其兜底三势爆发点
      // V9.x 精英战操作点加密：精英每 4 回合一个 routine 窗口（原先全 5 回合），
      // 精英战普遍 6-12 回合，5 回合/点太疏；加密到 4 回合保持"每场至少 1-2 次择机"的密度。
      const _routineEvery = (m.type === 'elite') ? 4 : 5;
      // V8.5x 新手指引：接引使者/前三难首战不触发操作点，避免 QTE 打断攻/经/绝三键教学
      const _isTutorialFight = !!m.tutorial;
      if (!_isTutorialFight) {
        if (telegraph) operationPoint = 'telegraph';
        else if (justEnraged) operationPoint = 'enrage';
        else if (prev && prev.pHpAfter > pTi.maxHp * 0.25 && pHp <= pTi.maxHp * 0.25 && pHp > 0) operationPoint = 'lowhp';
        else if (round % _routineEvery === 0 && pHp > 0 && mHp > 0) operationPoint = 'routine';
        // —— 破爆发铺垫：普通小怪战为"二势及以上爆发"兜底一个 routine 操作点 ——
        // 小怪抵抗力低，命中叠气势快；在血量首次跌破 60% 且气势已攒到二势(≥2)但未满三势时，
        // 插入一个 routine 操作点——让玩家完成"憋气势→点爆发"的完整快感，破爆发这记贯穿每场战斗，
        // 而非只有精英/Boss 独享。要求 momentum≥2 确保点击爆发有实际收益（不会空攒），
        // m._rbDropped 保证每场小怪战仅兜底一次；enrage/telegraph 等更关键窗口优先级更高。
        else if (_isMob && !m._rbDropped && pHp > 0 && mHp > 0 && momentum >= 2 && momentum < MAX_MOMENTUM && mHp <= m.hp * 0.6) {
          operationPoint = 'routine';
          m._rbDropped = true;
        }
      }
      roundsDetail.push({
        round: round, first: first, enraged: enraged, justEnraged: justEnraged,
        operationPoint: operationPoint,
        pDebuffs: Object.assign({}, pDebuffs), // V8.50 本回合玩家侧 debuff 快照（UI 角标用）
        // 方案X2·隐道影遁必杀：本回合玩家攻击前/回合末必爆状态快照（手动三键经此透传）
        daoEvadeBefore: _dKey === 'evade-crit' ? _evBefore : false,
        daoEvadeAfter: _dKey === 'evade-crit' ? daoEvadeCrit : false,
        pTurn: pTurn, mTurn: mTurn, resolve: resolve, envDrain: _envDrain,
        pBaseDeal: (pTurn && pTurn.baseDeal) || (pTurn && pTurn.deal) || 0, // P0-1 玩家确定性基准伤害（UI「可斩」判定用）
        pDesperate: pHp > 0 && pTi.maxHp > 0 && pHp <= pTi.maxHp * 0.25, // P0-2 绝境状态（UI 红雾角标）
        pKillHeal: (pTurn && pTurn.killHeal) || 0,                        // P0-2 绝境反制·击杀回血量（UI 浮字）
        // P1-1 随从（精英/Boss 前置肉盾）：本拍随从血条 + 破胆标记（UI 显示独立随从条）
        minionHp: minionHp, minionMax: minionMax, minionBroken: minionBroken,
        mHpAfter: Math.max(0, mHp), pHpAfter: Math.max(0, pHp),
        shieldAfter: Math.max(0, shield),   // 我方当前护盾值（护盾淡金条用）
        // —— 气势·识破：本拍气势点数/层级 + 识破窗口标记（UI 气势条与识破按钮用）——
        momentum: momentum,
        momentumTier: tierOf(momentum),
        telegraph: telegraph,
        // V9.x 怪物行为引擎：本回合/下一回合动作意图（UI 意图区显示；pattern 可预知下一动）
        mIntent: mAction ? mAction.type : (telegraph ? 'heavy' : 'atk'),
        mNextIntent: _mHasBehavior ? peekNextMonsterAction(mHp) : null,
        mBuffLayers: mBuffLayers,             // 妖气暴涨层数（UI 显示 ×N）
        mHealAmt: (mTurn && mTurn.healAmt) || 0,      // 妖法回春回复量（UI 意图区显示 +N）
        mMultiHits: (mTurn && mTurn.multi) ? (mTurn.hits || 0) : 0,      // 多段连击脚本段数
        mMultiLanded: (mTurn && mTurn.multi) ? (mTurn.hitCount || 0) : 0, // 多段连击实际命中段数
        // V9.x 蓄力重击提前一轮预告：
        // 脚本化怪物（behavior 存在）→ 下一回合意图即 heavy 才预告（脚本承诺，绝不虚报）；
        // 旧字段怪（无 behavior 但 heavyEvery）→ 保留原周期预告（重击蓄力周期 heavyEvery 的次回合）。
        // UI 意图区显示次级预警「🌀 妖气凝聚」，给玩家提前决策的规划感（杀戮尖塔式意图预告）
        telegraphSoon: _mHasBehavior
          ? peekNextMonsterAction(mHp) === 'heavy'
          : (heavyEvery > 0 && (round + 1) % heavyEvery === 0 && mHp > 0),
        // AI 底层逻辑标注：行动顺序条依据 + 普攻属性匹配 + 目标规则（固定攻击血最低敌）
        ai: {
          targetRule: 'lowestHp',          // 我方固定优先攻击血量最低敌人（多体场景生效；单体即当前敌）
          atkAttr: aiAtkAttr,               // 普攻光效：金光（物攻）/ 佛光（法伤）
          blackMiasma: aiBlack,             // 逆道反伤态·黑瘴光效叠加
          pSpd: pSpd, mSpd: mSpd,           // 敌我速度，供行动顺序条进度计算
          first: first,                     // 本拍先手方
        },
      });
    }

    // V9.x 数值止血：回合上限超时判定——避免静默撞线
    // 超时后根据剩余血量判定：玩家血量>怪物血量则险胜（耗时惩罚），否则力竭而亡
    let timeoutWin = false, timeoutLose = false, timeoutNote = null;
    if (roundLimitHit && pHp > 0 && mHp > 0) {
      if (pHp > mHp) {
        timeoutWin = true;
        timeoutNote = `回合上限触发（${MAX}回合），你以剩余气血优势险胜——久战伤身，此战奖励减半`;
      } else {
        timeoutLose = true;
        timeoutNote = `回合上限触发（${MAX}回合），你力竭而亡——久战不下，气血耗尽`;
      }
    }

    const win = (mHp <= 0 && pHp > 0) || timeoutWin;
    let lose = (pHp <= 0) || timeoutLose;
    // 业镜·天命护符：免疫一次致死（镜像 BOSS 外亦生效），触发后复活为 30% 气血
    if (lose && player.immuneDeath && !_immuneDeathUsed) {
      _immuneDeathUsed = true;
      pHp = Math.max(1, Math.round(maxHp * 0.30));
      finalWin = (mHp <= 0); finalLose = (pHp <= 0 && mHp > 0);
      revivedNote = (revivedNote ? revivedNote + '；' : '') + '天命护符·免疫致死，残血 rebirth';
      lose = false;
    }
    const first = roundsDetail.length ? roundsDetail[0].first : 'player';
    const maxHp = pTi.maxHp || pHp;
    const maxMHp = m.hp;

    // 命痕·金蝉：首次阵亡复活，并以 2 倍法伤反噬击杀者（翻盘判定）
    let revivedNote = null;
    let finalWin = win, finalLose = lose, finalPHp = pHp, finalMHp = mHp;
    if (lose && F('reviveOnce') && !fateRevived) {
      fateRevived = true;
      const reviveHp = Math.max(1, Math.round(maxHp * 0.30));
      const karmic = Math.round(pMagicBase * 2); // ×2 法伤反噬
      finalMHp = mHp - karmic;
      if (finalMHp <= 0) { finalWin = true; finalLose = false; finalPHp = reviveHp; revivedNote = '金蝉脱壳·阵亡复活，并以 2 倍法伤反噬击杀者'; }
      else { finalPHp = reviveHp; revivedNote = '金蝉脱壳·首次阵亡复活（' + reviveHp + ' 气血），反噬 ' + karmic + ' 法伤'; }
    }

    return {
      win: finalWin, lose: finalLose,
      monsterHpLeft: Math.max(0, finalMHp),
      playerHpLeft: Math.max(0, clampHp(finalPHp, hero, maxHp)),
      // P1-1 随从（精英/Boss 前置肉盾）：终局随从血条 + 破胆标记（战斗面板底部 / 结算展示）
      minion: (minionMax > 0)
        ? { cur: Math.max(0, minionHp), max: minionMax, broken: minionMax > 0 && minionHp <= 0, name: (m.minion && m.minion.name) || '随从妖' }
        : null,
      maxHp: maxHp, maxMHp: maxMHp,
      total: roundsDetail.length,
      roundsDetail: roundsDetail,
      pDebuffs: Object.assign({}, pDebuffs), // V8.50 终局玩家侧 debuff（活体 pending 初始化用）
      first: first, // 先手方：player / enemy
      narr: NDX._buildFightNarrative({ roundsDetail: roundsDetail }),
      // 气势战斗后透传：供结算展示"本场攒了多少势"
      momentumAfter: momentum,
      // 命痕战斗后透传标记：供 game 层处理法宝冷却类机制（逐杀/逐风）
      fateAfter: {
        kills: fateKillCount,
        killRefreshTreasure: F('killRefreshTreasure') && fateKillCount > 0,
        doubleEvaResetCd: fateDoubleEvaReset,
        revived: fateRevived,
        revivedNote: revivedNote,
      },
      // 命痕机制原始字典：透传至 applyBattleIntervention，供法宝「戾伤」等机制在手动祭宝时读取
      fateFlags: fate,
      // 转职·影遁：本场闪避掉宝次数（战斗结算时兑现为碎金/物资）
      evadeLoot: fateEvadeLoot,
      // V9.x 数值止血：回合上限超时提示（供UI层显式展示，避免静默撞线）
      timeoutNote: timeoutNote,
      roundLimitHit: roundLimitHit,
    };
  }

  // 多阶段 Boss 编排：逐阶段调用 simulateSingle，阶段衔接处插入破韧窗口回合。
  // 破韧窗口（stageBreakPoint）暂停演出，玩家须手动临阵祭宝(breakToughness)方可领取阶段奖励；
  // 否则超时/跳过则自动进入下一阶段，仅得挂机兜底奖励（区分挂机与手动收益）。
  function calcMultiStage(player, rawMonster) {
    const debuffSpec = NDX._bossDebuffSpec ? NDX._bossDebuffSpec(rawMonster) : null;
    const stages = rawMonster.stages;
    const pTi = player.ti;
    const maxHp = pTi.maxHp || (player.hp || 1000);
    const full = []; // 拼接后的全局回合序列
    let pHp = maxHp;
    let first = 'player';
    let totalRounds = 0;
    const stageRewards = rawMonster.stageRewards || []; // [{claim:{...}, idle:{...}}, ...]
    full.push({ intro: true, first: (player.spd || 8) >= (rawMonster.spd || 8) ? 'player' : 'enemy', pHpAfter: pHp, mHpAfter: stages[0], stage: 1, stageMax: stages[0] });
    for (let s = 0; s < stages.length; s++) {
      const stageMon = normalizeMonster(Object.assign({}, rawMonster, {
        hp: stages[s],
        type: rawMonster.type || (rawMonster.boss ? 'boss' : 'mob'),
        // 阶段内复用狂暴阈值（仅首阶段按 30% 触发，后续阶段默认锁定 1x 便于手动破韧）
        stageIndex: s,
      }));
      // 三/四章关隘 Boss 第二阶段：叠加「逆道·裂界」专属词缀派生数值（护甲/法伤/狂暴阈值）。
      if (s > 0 && rawMonster.phase2Override) {
        const ov = rawMonster.phase2Override;
        if (ov.dr !== undefined) stageMon.dr = ov.dr;
        if (ov.matk !== undefined) stageMon.matk = ov.matk;
        if (ov.enrage !== undefined) stageMon.enrage = ov.enrage;
        if (ov.enrageMul !== undefined) stageMon.enrageMul = ov.enrageMul;
        if (ov.affix) stageMon.affix = ov.affix;
      }
      const sub = simulateSingle(player, stageMon);
      first = sub.first;
      if (s === 0) {
        // 首阶段：保留其 INTRO 已写入，仅拼接交锋+收尾
      }
      // 剥离子阶段 INTRO/OUTRO，改写为带 stage 标记的交锋拍
      const subRounds = sub.roundsDetail; // 含 INTRO(0) ... OUTRO(last)
      for (let k = 1; k < subRounds.length - 1; k++) {
        const d = subRounds[k];
        const nd = Object.assign({}, d, {
          stage: s + 1,
          stageMax: stages[s],
          gRound: totalRounds + d.round,
        });
        // 玩家血量跨阶段延续：子阶段 simulateSingle 均从满血起算，
        // 故将本阶段伤害量（maxHp - d.pHpAfter）折算到「上阶段残血」基准上，保证血量条连续。
        if (s > 0) nd.pHpAfter = Math.max(0, pHp - (maxHp - d.pHpAfter));
        // 阶段衔接点：非最后阶段，且本拍为玩家回合 → 标记破韧窗口（下一拍前弹出限时领取）
        if (s < stages.length - 1 && d.first === 'player') nd.stageBreak = true;
        full.push(nd);
        totalRounds++;
      }
      pHp = Math.min(maxHp, sub.playerHpLeft > 0 ? sub.playerHpLeft : pHp);
      // 阶段衔接破韧窗口（独立回合，暂停演出、限时领取）
      if (s < stages.length - 1) {
        full.push({
          stageBreakPoint: true,
          stage: s + 1,
          stageMax: stages[s],
          breakStage: s + 1,        // 已破碎的第几阶段
          nextStage: s + 2,         // 解锁的下一阶段
          nextStageHp: stages[s + 1],
          reward: stageRewards[s] || null,
          pHpAfter: pHp,
          mHpAfter: 0,
        });
        totalRounds++;
      }
    }
    // 收尾拍
    full.push({ outro: true, win: true, pHpAfter: pHp, mHpAfter: 0, resolve: { dots: [] } });
    return {
      win: true, lose: false,
      monsterHpLeft: 0,
      playerHpLeft: Math.max(0, pHp),
      maxHp: maxHp, maxMHp: stages[stages.length - 1],
      total: full.length,
      roundsDetail: full,
      pDebuffs: debuffSpec ? Object.assign({}, { [debuffSpec.type]: 99 }) : {}, // V8.50 终局 debuff（pending 初始化用）
      first: first,
      narr: NDX._buildFightNarrative({ roundsDetail: full }),
      multiStage: true,
      stageCount: stages.length,
      // —— 气势·识破·克制联动：多阶段同样透传克制标签与玩家双攻 ——
      monsterTags: rawMonster.tags || [],
      _playerAtk: (player.ti && player.ti.atk) || 0,
      _playerMatk: (player.yuan && player.yuan.matk) || 0,
    };
  }

  // 战斗旁注：把分阶段回合数据转换为可读旁白
  NDX._buildFightNarrative = function (res) {
    const parts = [];
    (res.roundsDetail || []).forEach((rd) => {
      if (rd.stageBreakPoint) return; // 破韧窗口非交锋拍，不写入旁白
      const segs = [];
      if (rd.first === 'enemy') segs.push('妖物抢得先机，率先扑来');
      if (rd.pTurn) {
        const t = rd.pTurn;
        const ai = rd.ai || {};
        const attrTag = ai.blackMiasma ? '〔黑瘴〕' : (ai.atkAttr === '佛光' ? '〔佛光〕' : '〔金光〕');
        if (t.dodged) segs.push('悟空一棒落空，妖身已避让');
        else {
          segs.push('悟空抡起金箍棒' + (t.cri ? '——金光暴涌·暴击' : '狠狠砸下'));
          segs[segs.length - 1] = '【' + (ai.blackMiasma ? '逆道·黑瘴' : ai.atkAttr) + '】' + segs[segs.length - 1];
          if (t.phys) segs.push('体伤 ' + t.phys);
          if (t.magic) segs.push('愿伤 ' + t.magic);
          if (t.dot) segs.push('裂伤渗入 ' + t.dot);
          if (t.counter) segs.push('妖怪反击·裂缝反弹 ' + t.counter);
          // 命痕/劫印被动命中标注（AI 实时结算，无需玩家操作）
          if (t.boosted) segs.push('〔法宝增益〕伤害已放大');
        }
      }
      if (rd.mTurn) {
        const t = rd.mTurn;
        if (t.dodged) segs.push('悟空身形一晃，避过妖击');
        else {
          segs.push('妖物反扑' + (t.cri ? '·蓄力重创' : ''));
          if (t.deal) segs.push('悟空受创 ' + t.deal);
          if (t.absorbed) segs.push('护盾挡下 ' + t.absorbed);
          if (t.reflect) segs.push('反震 ' + t.reflect);
          if (t.shieldBomb) segs.push('护盾碎裂震敌 ' + t.shieldBomb);
          // 词缀·高反伤：命中后裂缝反弹（来源标注，便于玩家归因"为何被秒"）
          if (t.counter) segs.push('〔高反伤〕妖怪反击·裂缝反弹 ' + t.counter);
        }
      }
      if (rd.resolve && rd.resolve.dots.length) {
        rd.resolve.dots.forEach((d) => segs.push((d.tgt === 'p' ? '悟空' : '妖物') + '持续〔' + d.kind + '〕 ' + d.dmg + (d.kind === '咒蚀' ? '（词缀·持续毒）' : '')));
      }
      // 词缀·封印侵蚀（亵渎）：每回合始流失气血，无视护盾
      if (rd.envDrain) segs.push('〔封印侵蚀〕妖氛锁体，气血流失 ' + rd.envDrain);
      if (rd.justEnraged) segs.push('〔狂暴〕妖目赤红——攻击暴涨，破绽更少');
      const _rl = rd.stage ? ('第' + rd.stage + '阶·第' + (rd.round || rd.gRound || '?') + '合') : ('第' + (rd.round || rd.gRound) + '合');
      parts.push(_rl + '：' + segs.join('，') + '。');
    });
    return parts;
  };

  // —— 主动操作点 · 战斗内干预 ——
  // 玩家在 atRound（操作点回合，1-based）祭出法宝后，对既算好的 roundsDetail 做确定性就地修正，
  // 使"择机祭宝"真实改变战局（打破纯回放）。法宝效果复用 TREASURES[id].effect 字段：
  //   healPct / capHeal              → 回复玩家气血（抬升 atRound 之后 pHpAfter）
  //   dmgPct / dmgFlat               → 直接削怪（下调 atRound 之后 mHpAfter）
  //   matkPct（愿伤增益）/ atkPct    → 放大 atRound 之后玩家每次出手的 deal 并据此重算 mHpAfter
  // 返回修改后的 res（同一引用），并给被干预回合打标 intervention。
  NDX.applyBattleIntervention = function (res, atRound, treasureId, playerDao) {
    const T = NDX.TREASURES && NDX.TREASURES[treasureId];
    if (!res || !T || !T.effect) return res;
    let eff = T.effect;
    const list = res.roundsDetail || [];
    const maxHp = res.maxHp || 1;
    const maxMHp = res.maxMHp || 1;
    const idx0 = Math.max(0, atRound - 1); // 0-based 起点
    if (idx0 >= list.length) return res;

    // —— V8.54 P2-1 六道协同：法宝 dao 与玩家主六道一致时，效果+25% ——
    const _pDao = playerDao || (res.playerDao) || null;
    let _daoMult = 1;
    if (_pDao && T.dao && T.dao === _pDao) { _daoMult = (NDX.TREASURE_SYN && NDX.TREASURE_SYN.daoMatch) || 1.25; }
    if (_daoMult > 1) {
      eff = Object.assign({}, eff, {
        dmgPct: (eff.dmgPct || 0) * _daoMult,
        healPct: (eff.healPct || 0) * _daoMult,
        shieldPct: (eff.shieldPct || 0) * _daoMult,
        lifestealPct: (eff.lifestealPct || 0) * _daoMult,
      });
    }

    // —— V8.54 P1-3 新效果变量 ——
    const _shieldAmt = eff.shieldPct ? Math.round(maxHp * eff.shieldPct) : 0;
    const _stunTurns = eff.stunTurns || 0;
    const _lifestealPct = eff.lifestealPct || 0;

    // —— 法宝克制（软克制）：命中 → 放大 effect + 置位 res.countered（联动识破/爆发）——
    // 沿用《法宝克制系统设计方案》：counter.tags 命中任一怪物标签即生效；
    // 命中仅放大数值，不引入新结算分支；未命中走原逻辑零回归。
    if (T.counter && res.monsterTags && T.counter.tags.some((t) => res.monsterTags.includes(t))) {
      const c = T.counter;
      eff = Object.assign({}, eff, {
        dmgPct: (eff.dmgPct || 0) * (c.dmgX || 1),
        healPct: (eff.healPct || 0) * (c.healX || 1),
      });
      res.countered = { treasureId: treasureId, tag: c.tags[0], note: c.note };
      // 联动气势：克制命中额外 +1 气势（本回合展示）
      const rd0 = list[idx0];
      if (rd0) rd0.momentum = Math.min(5, (rd0.momentum || 0) + 1);
    }

    // 1) 玩家回复（在起点回合即时生效，并抬升之后所有 pHpAfter / pTurn.hpBefore）
    let healDelta = 0;
    if (eff.capHeal) healDelta = maxHp - (list[idx0].pHpAfter || 0);
    else if (eff.healPct) healDelta = Math.round(maxHp * eff.healPct);
    if (healDelta > 0) {
      for (let i = idx0; i < list.length; i++) {
        const rd = list[i];
        if (rd.pTurn) rd.pTurn.hpBefore = Math.min(maxHp, (rd.pTurn.hpBefore || 0) + healDelta);
        rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + healDelta);
      }
    }

    // 2) 攻击增益：放大 atRound 之后每次玩家出手的 deal，并据新 deal 重算 mHpAfter
    const atkMult = 1 + (eff.matkPct || 0) + (eff.atkPct || 0);
    if (atkMult > 1) {
      for (let i = idx0; i < list.length; i++) {
        const rd = list[i];
        if (rd.pTurn && rd.pTurn.deal > 0) {
          const extra = Math.round(rd.pTurn.deal * (atkMult - 1));
          rd.pTurn.deal += extra;
          rd.pTurn.boosted = true;
          const mBefore = rd.mTurn ? (rd.mTurn.hpBefore || 0) : (rd.mHpAfter || 0);
          const mAfter = Math.max(0, mBefore - rd.pTurn.deal);
          if (rd.mTurn) rd.mTurn.hpAfter = mAfter;
          rd.mHpAfter = mAfter;
        }
      }
    }

    // 3) 直接削怪（dmgPct/dmgFlat）：在起点回合立即生效，并下拉之后所有 mHpAfter
    // —— 命痕·戾伤（hpLossBoostTreasure）：玩家已损失气血越多，法宝伤害越高（越伤越狠）——
    // V8.54 斩杀线机制：save:true 生效为"怪物血量<30%时直接斩杀"，否则基础伤害全局×0.55
    const _curMhp = list[idx0] ? (list[idx0].mHpAfter || 0) : maxMHp;
    const _isExecute = !!(eff.save) && _curMhp > 0 && _curMhp <= maxMHp * 0.30;
    let dmg;
    if (_isExecute) {
      dmg = _curMhp;
    } else {
      dmg = Math.round(maxMHp * (eff.dmgPct || 0) * 0.55) + (eff.dmgFlat || 0);
    }
    const _ffTre = res.fateFlags || {};
    if (_ffTre.hpLossBoostTreasure && _ffTre.hpLossBoostTreasure > 0 && !_isExecute) {
      const _rd0 = list[idx0];
      const _lost = (maxHp > 0 && _rd0) ? Math.max(0, 1 - (_rd0.pHpAfter || maxHp) / maxHp) : 0;
      if (_lost > 0) dmg = Math.round(dmg * (1 + _ffTre.hpLossBoostTreasure * _lost));
    }
    if (dmg > 0) {
      for (let i = idx0; i < list.length; i++) {
        const rd = list[i];
        // 起点回合：从当前 mHpAfter 扣；之后回合：从本回合 mTurn.hpBefore（已含上一拍结果）扣
        let cur = rd.mTurn ? (rd.mTurn.hpBefore || 0) : (rd.mHpAfter || 0);
        if (i === idx0) cur = rd.mHpAfter || 0;
        const after = Math.max(0, cur - dmg);
        if (rd.mTurn) rd.mTurn.hpAfter = after;
        rd.mHpAfter = after;
      }
    }
    // V8.54 P1-3 吸血：法宝伤害的 X% 转化为玩家回血
    if (_lifestealPct > 0 && dmg > 0) {
      const _lsHeal = Math.round(dmg * _lifestealPct);
      if (_lsHeal > 0) {
        for (let i = idx0; i < list.length; i++) {
          const rd = list[i];
          if (rd.pTurn) rd.pTurn.hpBefore = Math.min(maxHp, (rd.pTurn.hpBefore || 0) + _lsHeal);
          rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + _lsHeal);
        }
      }
    }
    // V8.54 P1-3 眩晕：接下来 N 回合怪物不攻击（deal=0）
    if (_stunTurns > 0) {
      for (let i = idx0; i < Math.min(list.length, idx0 + _stunTurns); i++) {
        const rd = list[i];
        if (rd.mTurn) { rd.mTurn.deal = 0; rd.mTurn.stunned = true; }
      }
    }
    // V8.54 P1-3 护盾：给玩家加护盾值，在后续回合优先吸收伤害（简化为减伤）
    if (_shieldAmt > 0) {
      let _shieldLeft = _shieldAmt;
      for (let i = idx0; i < list.length && _shieldLeft > 0; i++) {
        const rd = list[i];
        if (rd.mTurn && rd.mTurn.deal > 0) {
          const _absorb = Math.min(_shieldLeft, rd.mTurn.deal);
          rd.mTurn.deal -= _absorb;
          rd.mTurn.shieldAbsorb = _absorb;
          _shieldLeft -= _absorb;
          // 重算玩家血量
          if (rd.mTurn.hpAfter != null) rd.mTurn.hpAfter = Math.min(maxHp, (rd.mTurn.hpAfter || 0) + _absorb);
          rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + _absorb);
        }
      }
    }

    // 4) 打标被干预回合，并重算顶层胜负
    list[idx0].intervention = { treasureId: treasureId, name: T.name };
    res.monsterHpLeft = list.length ? list[list.length - 1].mHpAfter : res.monsterHpLeft;
    res.playerHpLeft = list.length ? Math.min(maxHp, list[list.length - 1].pHpAfter) : res.playerHpLeft;
    // 若干预后怪物提前归零，截断后续回合并判胜
    let killAt = -1;
    for (let i = idx0; i < list.length; i++) {
      if (list[i].mHpAfter <= 0) { killAt = i; break; }
    }
    if (killAt >= 0) {
      res.roundsDetail = list.slice(0, killAt + 1);
      res.total = res.roundsDetail.length;
      res.win = res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    } else {
      res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    }
    return res;
  };

  // V8.50 法宝克制·解厄：清除指定玩家 debuff 并修补后续回合（与 applyBattleIntervention 同构）
  // 致盲/怯战被清除的回合：还原该玩家攻击真实伤害，重算怪物血量与胜负
  NDX.applyBattleCleanse = function (res, atRound, types) {
    if (!res || !res.roundsDetail || !types || !types.length) return res;
    const list = res.roundsDetail;
    const idx0 = Math.max(0, atRound - 1);
    if (idx0 >= list.length) return res;
    for (let i = idx0; i < list.length; i++) {
      const rd = list[i];
      if (rd.pDebuffs) {
        if (types.indexOf('all') >= 0) { for (const _k in rd.pDebuffs) delete rd.pDebuffs[_k]; }
        else types.forEach((t) => { if (rd.pDebuffs[t]) delete rd.pDebuffs[t]; });
      }
      if (rd.pTurn && rd.pTurn.realDeal != null) {
        const pt = rd.pTurn;
        // 还原条件：本回合造成「落空 / 减攻」的 debuff 正是本次被解除的那一类。
        // 新快照带 pdbMiss/pdbAtk 精确类型；旧快照（仅有布尔）退回 blind/atkDown 兼容判定。
        const _hasTyped = (pt.pdbMiss != null) || (pt.pdbAtk != null);
        const _cleared = _hasTyped
          ? ((pt.pdbMiss && (types.indexOf('all') >= 0 || types.indexOf(pt.pdbMiss) >= 0)) || (pt.pdbAtk && (types.indexOf('all') >= 0 || types.indexOf(pt.pdbAtk) >= 0)))
          : ((pt.blindMiss && (types.indexOf('all') >= 0 || types.indexOf('blind') >= 0)) || (pt.atkDown && (types.indexOf('all') >= 0 || types.indexOf('atkDown') >= 0)));
        if (_cleared) {
          const real = pt.realDeal;
          pt.deal = real; pt.phys = real; pt.magic = 0;
          pt.blindMiss = false; pt.atkDown = false;
          pt.pdbMiss = null; pt.pdbAtk = null;
          const mBefore = rd.mTurn ? (rd.mTurn.hpBefore || 0) : (rd.mHpAfter || 0);
          const mAfter = Math.max(0, mBefore - real);
          if (rd.mTurn) rd.mTurn.hpAfter = mAfter;
          rd.mHpAfter = mAfter;
        }
      }
    }
    res.monsterHpLeft = list.length ? list[list.length - 1].mHpAfter : res.monsterHpLeft;
    res.playerHpLeft = list.length ? Math.min((res.maxHp || 1), list[list.length - 1].pHpAfter) : res.playerHpLeft;
    let killAt = -1;
    for (let i = idx0; i < list.length; i++) { if (list[i].mHpAfter <= 0) { killAt = i; break; } }
    if (killAt >= 0) {
      res.roundsDetail = list.slice(0, killAt + 1);
      res.total = res.roundsDetail.length;
      res.win = res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    } else {
      res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    }
    return res;
  };

  // —— 回合识破 · 结算 ——
  // 在 telegraph 回合（识破窗口）玩家选择"识破"：反制蓄力重击。
  // 1) 本回合 mTurn.deal 归零（重击被格挡，玩家不掉血）
  // 2) 追加反制伤害（玩家双攻 ×0.8；本场克制命中 ×1.5）
  // 3) 反制成功奖励 2 点气势（联动气势系统，后续回合展示 +2）
  // 返回修改后的 res（同一引用），并给被干预回合打标 intervention.shiPo。
  NDX.applyShiPo = function (res, atRound) {
    if (!res || !res.roundsDetail) return res;
    const idx = Math.max(0, atRound - 1);
    const rd = res.roundsDetail[idx];
    if (!rd || !rd.telegraph || !rd.mTurn) return res;
    // —— 识破结算常量（修复 V8.5x 引用未定义变量：反制倍率×0.8 / 气势奖励+2）——
    const _shiPoMult = 0.8;          // 反制伤害 = 玩家双攻 ×0.8（注释语义；克制命中再 ×1.5）
    const _shiPoGain = 2;            // 识破成功奖励 2 点气势（与下方 +2 一致）
    const _shiPoTier = 1;            // 识破为单一反制动作，无进阶阶次
    const _timing = 'telegraph';     // 识破成立于蓄力重击（telegraph）窗口
    const list = res.roundsDetail;
    const maxHp = res.maxHp || 1;
    // 1) 格挡：本回合怪物重击归零
    const negated = rd.mTurn.deal || 0;
    rd.mTurn.deal = 0; rd.mTurn.phys = 0; rd.mTurn.magic = 0; rd.mTurn.shp = true;
    // 2) 反制伤害（克制联动 ×1.5）
    const base = (res._playerAtk || 0) + (res._playerMatk || 0);
    const shpDmg = Math.round(base * _shiPoMult * (res.countered ? 1.5 : 1));
    // 3) 本回合血量重算：玩家被格挡的扣血回补，怪物被反制扣血
    rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + negated);
    const mBefore = rd.mHpAfter || 0;
    const mAfter = Math.max(0, mBefore - shpDmg);
    rd.mHpAfter = mAfter;
    if (rd.mTurn) rd.mTurn.hpAfter = mAfter;
    // 4) 后续回合 mHpAfter 同步下拉 shpDmg（与 applyBattleIntervention 的 dmg 处理一致）
    for (let i = idx + 1; i < list.length; i++) {
      const r2 = list[i];
      const cur = r2.mTurn ? (r2.mTurn.hpBefore || 0) : (r2.mHpAfter || 0);
      const after = Math.max(0, cur - shpDmg);
      if (r2.mTurn) r2.mTurn.hpAfter = after;
      r2.mHpAfter = after;
    }
    // 5) 联动气势：识破成功 +2（后续回合展示）
    for (let i = idx; i < list.length; i++) {
      const r2 = list[i];
      r2.momentum = Math.min(5, (r2.momentum || 0) + 2);
    }
    // 6) 打标
    rd.intervention = Object.assign({}, rd.intervention || {}, { shiPo: true, shiPoTier: _shiPoTier, shiPoTiming: _timing, shpDmg: shpDmg, negated: negated, shpGain: _shiPoGain });
    // 7) 重算顶层胜负 + 怪物提前归零截断
    res.monsterHpLeft = list.length ? list[list.length - 1].mHpAfter : res.monsterHpLeft;
    res.playerHpLeft = list.length ? Math.min(maxHp, list[list.length - 1].pHpAfter) : res.playerHpLeft;
    let killAt = -1;
    for (let i = idx; i < list.length; i++) {
      if (list[i].mHpAfter <= 0) { killAt = i; break; }
    }
    if (killAt >= 0) {
      res.roundsDetail = list.slice(0, killAt + 1);
      res.total = res.roundsDetail.length;
    }
    res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
    res.lose = res.playerHpLeft <= 0;
    return res;
  };

  // —— 气势爆发 · 结算 ——
  // 在常规操作点（routine / enrage / lowhp）玩家选择"爆发"：消耗当前气势，按层级造成爆发伤害。
  // 层级越高倍率越高（一势×0.6 / 二势×1.0 / 三势×1.5）；本场克制命中（res.countered）再 ×1.5。
  // 返回修改后的 res（同一引用），并给被干预回合打标 intervention.burst。
  NDX.applyMomentumBurst = function (res, atRound) {
    if (!res || !res.roundsDetail) return res;
    const idx = Math.max(0, atRound - 1);
    const rd = res.roundsDetail[idx];
    if (!rd) return res;
    const list = res.roundsDetail;
    const maxHp = res.maxHp || 1;
    const tier = rd.momentumTier || 0;
    if (tier <= 0) return res; // 无气势不可爆发
    const BURST_X = [0, 0.6, 1.0, 1.5];
    const base = (res._playerAtk || 0) + (res._playerMatk || 0);
    const burstDmg = Math.round(base * BURST_X[tier] * (res.countered ? 1.5 : 1));
    // 起点回合扣血 + 后续下拉（与 applyBattleIntervention 的 dmg 处理一致）
    const mBefore = rd.mHpAfter || 0;
    const mAfter = Math.max(0, mBefore - burstDmg);
    rd.mHpAfter = mAfter;
    if (rd.mTurn) rd.mTurn.hpAfter = mAfter;
    for (let i = idx + 1; i < list.length; i++) {
      const r2 = list[i];
      const cur = r2.mTurn ? (r2.mTurn.hpBefore || 0) : (r2.mHpAfter || 0);
      const after = Math.max(0, cur - burstDmg);
      if (r2.mTurn) r2.mTurn.hpAfter = after;
      r2.mHpAfter = after;
    }
    // 消耗气势：后续回合展示清零
    for (let i = idx; i < list.length; i++) {
      list[i].momentum = 0;
      list[i].momentumTier = 0;
    }
    // 打标
    rd.intervention = Object.assign({}, rd.intervention || {}, { burst: true, burstTier: tier, burstDmg: burstDmg });
    // 重算顶层胜负 + 怪物提前归零截断
    res.monsterHpLeft = list.length ? list[list.length - 1].mHpAfter : res.monsterHpLeft;
    res.playerHpLeft = list.length ? Math.min(maxHp, list[list.length - 1].pHpAfter) : res.playerHpLeft;
    let killAt = -1;
    for (let i = idx; i < list.length; i++) {
      if (list[i].mHpAfter <= 0) { killAt = i; break; }
    }
    if (killAt >= 0) {
      res.roundsDetail = list.slice(0, killAt + 1);
      res.total = res.roundsDetail.length;
    }
    res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
    res.lose = res.playerHpLeft <= 0;
    return res;
  };

  // —— 连招 / 暴击链系统（V8.46）——
  // 基础攻击链：连续基础攻击（atk / chant，手动与自动均生效）每 N 次触发一次暴击；
  //   手动受 2s 窗口约束（超时中断连段），自动不受时间约束（AI 即时出手，连续命中即累积）。
  // 手动风格串联（combo→burst→pierce）保留为手操深度奖励，仅限玩家手动指定 atk 风格时累计（见 game.js.resolveManualActive）。
  // 数值真源集中此处，game.js 仅调用纯函数施加倍率，避免散落补丁。
  NDX.COMBO_BASIC_EVERY = 3;        // 每 N 次连续基础攻击触发一次暴击
  NDX.COMBO_BASIC_CRIT_MUL = 1.5;   // 基础攻击链暴击倍率
  NDX.COMBO_BASIC_WINDOW = 2000;    // 手动连段窗口（ms）；超过则连段计数中断
  // 基础攻击链步进：原地 mutate p.comboBasic / p.comboBasicLastTime / p.comboStreak，返回 { mul, crit, tier }
  // V8.47 连段分层递增：累计连击 3/6/9 各升一档（武斗家式），与「每 N 次必暴」同源共存。
  NDX.comboBasicStep = function (p, isManual, now) {
    p = p || {};
    p.comboBasic = p.comboBasic || 0;
    p.comboBasicLastTime = p.comboBasicLastTime || 0;
    p.comboStreak = p.comboStreak || 0;
    if (isManual && p.comboBasicLastTime && (now - p.comboBasicLastTime) > (NDX.COMBO_BASIC_WINDOW || 2000)) {
      p.comboBasic = 0; p.comboStreak = 0; // 手动超时，连段中断
    }
    p.comboBasicLastTime = now;
    p.comboBasic += 1; p.comboStreak += 1;
    const every = NDX.COMBO_BASIC_EVERY || 3;
    let mul = 1, crit = false, tier = 0;
    if (p.comboBasic >= every) { mul = NDX.COMBO_BASIC_CRIT_MUL || 1.5; crit = true; } // 每 N 次必暴（基础档）
    // 连段分层递增：累计连击 3/6/9 各升一档（与基础必暴叠加取高）
    if (p.comboStreak >= 9) { tier = 3; mul = Math.max(mul, 2.2); crit = true; }
    else if (p.comboStreak === 6) { tier = 2; mul = Math.max(mul, 1.8); crit = true; }
    else if (p.comboStreak === 3) { tier = 1; mul = Math.max(mul, 1.5); crit = true; }
    if (p.comboBasic >= every) p.comboBasic = 0; // 基础计数重置开启下一组（累计连击数保留以计档）
    return { mul: mul, crit: crit, tier: tier };
  };
  NDX.COMBO_CHAIN_MUL = 1.25;     // 三式有序衔接（combo→burst→pierce）串联倍率（手操深度）
  // 连招链串联判定：链尾出现有序 [combo, burst, pierce] 子串则触发（仅手动风格攻击累计）
  NDX.comboChainBonus = function (chain) {
    if (!Array.isArray(chain) || chain.length < 3) return { mul: 1, triggered: false };
    const n = chain.length;
    if (chain[n - 3] === 'combo' && chain[n - 2] === 'burst' && chain[n - 1] === 'pierce') {
      return { mul: NDX.COMBO_CHAIN_MUL || 1.25, triggered: true };
    }
    return { mul: 1, triggered: false };
  };

  // —— V8.47 战斗完善：状态 / 连招扩展模块（数值真源集中此处，game.js 仅调用纯函数）——
  // 放弃六道相克（用户决策）。保留并新增：状态堆叠协同、通用易伤/标记、连段分层递增(V8.47)、
  // 搓招序列奥义、怪物叠甲(减伤)+Boss控制免疫、状态 UI 角标、气势-连招联动、冻结/沉默、
  // 宠物连招协同、夺盾反转。所有倍率/层数常量定义于此，禁止散落补丁。
  NDX.DEBUFF_DEFS = {
    vuln:   { name: '易伤', icon: '🩸', kind: 'debuff' },
    mark:   { name: '标记', icon: '🎯', kind: 'debuff' },
    frozen: { name: '冻结', icon: '❄', kind: 'debuff' },
    silence: { name: '沉默', icon: '🔇', kind: 'debuff' }
  };
  // —— 玩家侧 debuff（Boss 招牌 debuff 体系，V8.50 法宝克制）——
  NDX.PDEBUFF_DEFS = {
    blind:   { name: '致盲', icon: '🌪', kind: 'debuff', desc: '黄风怪·三昧神风：英雄攻击 80% 几率落空' },
    atkDown: { name: '怯战', icon: '🛡', kind: 'debuff', desc: '白骨精·尸气化盾：玩家攻击 -80%' },
    burn:    { name: '灼烧', icon: '🔥', kind: 'debuff', desc: '红孩儿·三昧真火：每回合持续灼伤' },
    daze:    { name: '摄魂', icon: '🌀', kind: 'debuff', desc: '妖法摄魂：英雄攻击 45% 几率落空' },
    frost:   { name: '寒封', icon: '❄', kind: 'debuff', desc: '寒气封体：玩家攻击 -50%，每回合冻伤' },
    curse:   { name: '咒缚', icon: '💀', kind: 'debuff', desc: '咒缚缠身：玩家攻击 -65%，每回合气血流逝' },
    poison:  { name: '毒蚀', icon: '🐍', kind: 'debuff', desc: '剧毒蚀骨：玩家攻击 -25%，每回合中毒' },
    weak:    { name: '蚀骨', icon: '🦴', kind: 'debuff', desc: '骨蚀筋软：玩家攻击 -40%' },
  };

  // V9.6 法宝·on-hit（西游释厄传名器）：怪物侧 debuff 词库（单一真源，新增只登记不写逻辑）
  NDX.MDEBUFF_DEFS = {
    shrink:   { name: '变小', icon: '🤏', kind: 'debuff', desc: '紫金红葫芦：怪物造成伤害大幅下降' },
    slow:     { name: '迟缓', icon: '🐌', kind: 'debuff', desc: '飞龙宝杖：怪物攻击减弱' },
    burned:   { name: '灼烧', icon: '🔥', kind: 'debuff', desc: '芭蕉扇：每回合流失气血' },
    silenced: { name: '沉默', icon: '🔇', kind: 'debuff', desc: '九环锡杖：怪物技能被禁' },
  };
  // V9.9 加持·请菩萨：持 blessTreasure 临战赐福，弱化妖物（三模式第三档）
  //   与 破除(cleanse 解厄) / 破韧(breakWith) 鼎足——困难→正常→加持 三档递进。
  //   dmgMul：妖物全伤害输出乘算（恐惧/收妖即降妖物输出）；cleanseGimmick：自动破除其伪相 gimmick。
  NDX.BLESS_EFFECTS = {
    feilong_zhang:   { dmgMul: 0.80, label: '飞龙宝杖·恐惧：妖物伤害-20%' },
    jiuhuan_zhang:   { dmgMul: 0.80, label: '九环锡杖·禁言：妖物伤害大减' },
    zijin_honghulu:  { dmgMul: 0.80, label: '紫金红葫芦·收妖：妖物伤害大减' },
    baojiao:         { dmgMul: 0.85, label: '芭蕉扇·烈焰：妖物每回合灼伤' },
    ts_jingping:     { dmgMul: 0.85, cleanseGimmick: true, label: '观音玉净瓶·慈悲：清负面+压制妖术' },
    bf_wuzizhenjing: { dmgMul: 0.80, label: '无字真经·空相：妖物失序' },
  };
  // 玩家是否持有某法宝（在法宝栏内、有充能）——加持/跳形态钩子的持有判定
  NDX.playerHoldsTreasure = function (s, id) {
    if (!s || !id) return false;
    const eqs = (s.equips || []).filter((e) => {
      const T = NDX.TREASURES && NDX.TREASURES[e.treasureId];
      return e.treasureId === id && T && (e.chargesLeft == null || e.chargesLeft > 0);
    });
    return eqs.length > 0;
  };
  NDX.treasureName = function (id) {
    const T = NDX.TREASURES && NDX.TREASURES[id];
    return (T && T.name) || id;
  };
  // V9.9 装备五档（白绿蓝红金，镜像劫印五档）：给玩家「成就感台阶」
  //   不重写 setTier 合成经济——tier 由现有 quality/setTier/chapter 派生，display 用 color。
  //   章末 Boss 必掉阶梯核心物（掉落 tier 下限见 bossDropTierFloor），令每次通关都有可见战力台阶。
  NDX.EQUIP_TIERS = [
    { key: 'white', name: '白装', color: '#cfd8dc', layer: 1 },
    { key: 'green', name: '绿装', color: '#4caf50', layer: 2 },
    { key: 'blue',  name: '蓝装', color: '#42a5f5', layer: 3 },
    { key: 'red',   name: '红装', color: '#ef5350', layer: 4 },
    { key: 'gold',  name: '金装', color: '#ffca28', layer: 5 },
  ];
  // 装备 → 五档颜色键（派生，零合成风险）
  NDX.equipTierOf = function (eq) {
    if (!eq) return 'white';
    const st = eq.setTier || 0;       // 1=基座 2=成品 3+=高阶
    const q = (eq.quality != null) ? eq.quality : 0;
    const ch = eq.chapter || 1;
    if (st >= 4 || q >= 3) return 'gold';
    if (st >= 3 || q >= 2) return 'red';
    if (st >= 2 || q >= 1) return 'blue';
    return ch >= 3 ? 'green' : 'white';
  };
  // Boss 掉落 tier 下限（保证「每章必掉阶梯核心」的成就感台阶）
  NDX.bossDropTierFloor = function (s, isChapterEnd) {
    const act = (s && s.act) || 1;
    if (isChapterEnd) {
      if (act >= 14) return 'gold';   // 后段章末必掉金
      if (act >= 10) return 'red';    // 中段章末必掉红
      if (act >= 4)  return 'blue';   // 前段章末必掉蓝
      return 'green';
    }
    return act >= 8 ? 'red' : 'blue'; // 章中事件妖怪 Boss（车迟/黄袍/蝎子…）：二阶蓝、三阶红
  };
  // V9.6 on-hit 触发表现层标签（单一真源：效果键 → 飘字文案/图标，供 main.js 出飘字）
  NDX.ONHIT_FX_LABELS = [
    ['stun', '晕眩', '💫'],
    ['silence', '沉默', '🔇'],
    ['shrink', '收妖·变小', '🤏'],
    ['slow', '迟缓', '🐌'],
    ['burn', '灼烧', '🔥'],
    ['trueDmg', '圣伤', '✨'],
    ['lifesteal', '夺元', '🩸'],
    ['reflect', '反震', '🌀'],
  ];
  // V9.6 法宝·on-hit 结算：普攻命中按概率触发削弱/控制/灼烧，纯数据驱动，复用 applyBattleIntervention 的
  // res.roundsDetail 就地修正范式（演出与结算一致）。零新战斗内核，仅扩展入参。
  //   onHit: { proc, shrink, slow, stun, silence, burn, reflect, lifesteal, trueDmg, dur, dao }
  //   结算点：calcCombat 之后由 game_combat_1.js 在"法宝栏内被动法宝"上调用（与 applyJinguProc 同思路）。
  // V9.6 法宝协同真源（单一事实来源）：on-hit 命中时按「六道同源 × 经文共鸣」放大触发概率与效果强度。
  //   daoMatch   六道同源——法宝道途 === 玩家主道途（祭宝与 on-hit 共用此系数）
  //   sutraMatch 经文共鸣——玩家持「同道全本经文」，该道法宝威力再增（经文喂法宝，形成正向循环）
  //   sutraProc  经文共鸣额外触发概率（加法；总概率仍受 procCap 封顶，防滚雪球）
  //   数值 [PLACEHOLDER·待10局采样]
  NDX.TREASURE_SYN = {
    daoMatch: 1.25,
    sutraMatch: 1.15,
    sutraProc: 0.06,
    procCap: 0.35,
  };
  NDX.applyTreasureOnHit = function (res, onHitList, ctx) {
    if (!res || !res.roundsDetail || !onHitList || !onHitList.length) return res;
    const list = res.roundsDetail;
    const maxHp = res.maxHp || 1;
    const maxMHp = res.maxMHp || 1;
    const boss = !!(ctx && ctx.boss);
    const pDao = (ctx && ctx.playerDao) || null;
    const sealMechs = (ctx && ctx.sealMechs) || [];
    const sutraDaos = (ctx && ctx.sutraDaos) || [];   // V9.6 玩家所持全本经文的道途集合（法宝×经文耦合入参）
    const SYN = NDX.TREASURE_SYN || { daoMatch: 1.25, sutraMatch: 1.15, sutraProc: 0.06, procCap: 0.35 };
    const SHRINK_FLOOR = 0.30; // 减伤类下限：怪物伤害最低保留 30%（变小/迟缓不归零，避免 Boss 变木桩）
    const _hasSeal = function (mech) { return sealMechs.indexOf(mech) >= 0; };
    const _bossDur = function (n) { return boss ? Math.min(2, n) : n; };
    const N = list.length;
    const origMHp = list.map(function (rd) { return rd.mHpAfter || 0; });
    // 先收集、后一次性结算：避免“同击/窗口内逐回合重掷”造成的重复叠乘
    const red = [], ctrl = [], flag = [], mLoss = [], bTick = [];
    for (let j = 0; j < N; j++) { red[j] = 1; ctrl[j] = 0; flag[j] = {}; mLoss[j] = 0; bTick[j] = 0; }
    for (let i = 0; i < N; i++) {
      const rd = list[i];
      if (!rd.pTurn || rd.pTurn.deal <= 0) continue; // 仅“普攻命中”回合触发
      let procsThisRound = 0;
      for (let k = 0; k < onHitList.length; k++) {
        const H = onHitList[k];
        if (!H || !H.proc) continue;
        if (procsThisRound >= 2) break; // 同击多件 on-hit 合并封顶（防滚雪球）
        // V9.6 协同：六道同源 × 经文共鸣（经文与法宝同道 → 威力再增，见 NDX.TREASURE_SYN）
        const _daoHit = !!(pDao && H.dao && H.dao === pDao);
        const _sutraHit = !!(H.dao && sutraDaos.indexOf(H.dao) >= 0);
        const _syn = (_daoHit ? SYN.daoMatch : 1) * (_sutraHit ? SYN.sutraMatch : 1);
        const proc = Math.min(SYN.procCap, H.proc * _syn + (_sutraHit ? SYN.sutraProc : 0));
        if (Math.random() >= proc) continue;
        procsThisRound++;
        // V9.6 表现层回执：记录本次触发，供 main.js 出飘字（与 d.jinguProc 同范式，读 roundsDetail）
        {
          const _mk = NDX.ONHIT_FX_LABELS.find(function (L) { return H[L[0]]; });
          if (_mk) {
            if (!rd.onHitFx) rd.onHitFx = [];
            rd.onHitFx.push({ tid: H._tid || null, name: H._name || '', kind: _mk[0], label: _mk[1], icon: _mk[2], syn: _sutraHit ? 'sutra' : (_daoHit ? 'dao' : '') });
          }
        }
        // shrink / slow / reflect：削减怪物 dur 回合内伤害（多源取最小乘数=最强）
        if (H.shrink || H.slow || H.reflect) {
          const mag = Math.min(0.70, (H.shrink || H.slow || H.reflect) * _syn);
          const e = Math.min(N, i + (H.dur || 2));
          for (let j = i; j < e; j++) {
            red[j] = Math.min(red[j], 1 - mag);
            if (H.shrink) flag[j].shrunk = true;
            if (H.slow) flag[j].slowed = true;
            if (H.reflect) flag[j].reflected = true;
          }
        }
        // stun / silence：控制（眩晕伤害归零 / 沉默减半）
        if (H.stun || H.silence) {
          const turns = _bossDur(H.stun || H.silence);
          const e = Math.min(N, i + turns);
          for (let j = i; j < e; j++) {
            red[j] = Math.min(red[j], H.silence ? 0.5 : 0);
            ctrl[j] = Math.max(ctrl[j], H.silence ? 1 : 2);
            if (H.stun) flag[j].stunned = true;
            if (H.silence) flag[j].silenced = true;
            if (H.stun && _hasSeal('critBreakShield')) flag[j].shieldBreak = true; // 劫印协同·齐天
          }
        }
        // burn：怪物每回合流失气血（DoT，按回合累积推进）
        if (H.burn) {
          const dmg = Math.max(1, Math.round(maxMHp * H.burn * _syn));
          const e = Math.min(N, i + (H.dur || 2));
          for (let j = i; j < e; j++) { bTick[j] += dmg; flag[j].burned = true; }
        }
        // trueDmg：此次伤害按比例转为对怪真伤
        if (H.trueDmg) {
          const td = Math.max(1, Math.round((rd.pTurn.deal || 0) * H.trueDmg * _syn));
          mLoss[i] += td; flag[i].trueDmg = true;
        }
        // lifesteal：此次伤害按比例回血
        if (H.lifesteal) {
          const heal = Math.round((rd.pTurn.deal || 0) * H.lifesteal * _syn);
          if (heal > 0) {
            rd.pTurn.hpBefore = Math.min(maxHp, (rd.pTurn.hpBefore || 0) + heal);
            rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + heal);
          }
        }
      }
    }
    // 一次性结算：减伤/控制（玩家因此少受→回补），仅减伤类保留地板、控制类可归零
    for (let j = 0; j < N; j++) {
      const rd = list[j];
      if (!rd.mTurn) continue;
      const before = rd.mTurn.deal || 0;
      if (before <= 0) continue;
      let mult = red[j];
      if (mult < 1 && ctrl[j] === 0) mult = Math.max(SHRINK_FLOOR, mult);
      const after = Math.max(0, Math.round(before * mult));
      const delta = before - after;
      rd.mTurn.deal = after;
      const f = flag[j];
      if (f.shrunk) rd.mTurn.shrunk = true;
      if (f.slowed) rd.mTurn.slowed = true;
      if (f.reflected) rd.mTurn.reflected = true;
      if (f.stunned) rd.mTurn.stunned = true;
      if (f.silenced) rd.mTurn.silenced = true;
      if (f.shieldBreak) rd.mTurn.shieldBreak = true;
      if (delta > 0) rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + delta);
    }
    // 一次性结算：怪物额外损血（trueDmg + burn），按回合累积推进，保持 mHpAfter 单调递减
    let cum = 0;
    for (let j = 0; j < N; j++) {
      cum += (mLoss[j] || 0) + (bTick[j] || 0);
      const rd = list[j];
      if (cum > 0) {
        const hp = Math.max(0, origMHp[j] - cum);
        rd.mHpAfter = hp;
        if (rd.mTurn) rd.mTurn.hpAfter = hp;
      }
      if (flag[j].burned && rd.mTurn) rd.mTurn.burned = true;
      if (flag[j].trueDmg && rd.mTurn) rd.mTurn.trueDmg = true;
    }
    // 重算顶层血量（与 applyBattleIntervention 同构）
    res.monsterHpLeft = N ? list[N - 1].mHpAfter : res.monsterHpLeft;
    res.playerHpLeft = N ? Math.min(maxHp, list[N - 1].pHpAfter) : res.playerHpLeft;
    let killAt = -1;
    for (let i = 0; i < N; i++) { if (list[i].mHpAfter <= 0) { killAt = i; break; } }
    if (killAt >= 0) {
      res.roundsDetail = list.slice(0, killAt + 1);
      res.total = res.roundsDetail.length;
      res.win = res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    } else {
      res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    }
    return res;
  };
  // V8.50 玩家侧 debuff 惩罚参数表（单一真源）
  //   新增 debuff 只在此登记，playerAttack 与 applyBattleCleanse 均通用结算，无需改逻辑。
  // 落空型：MISS[类型] = 落空概率（同时生效时取最高者）
  NDX.PDB_MISS = { blind: 0.80, daze: 0.45 };
  // 减攻型：ATKMUL[类型] = 攻击乘数（同时生效时取最小者，即最强惩罚）
  NDX.PDB_ATKMUL = { atkDown: 0.20, frost: 0.50, curse: 0.35, poison: 0.75, weak: 0.60 };
  // 持续伤害型：DOT[类型] = { pctMaxHp 最大气血占比, atkMul 怪物攻击系数, flat 保底伤害, kind 伤害显示名 }
  NDX.PDB_DOT = {
    burn:   { pctMaxHp: 0.04, atkMul: 0.10, flat: 8, kind: '灼烧' },
    frost:  { pctMaxHp: 0.02, atkMul: 0.00, flat: 6, kind: '冻伤' },
    curse:  { pctMaxHp: 0.03, atkMul: 0.04, flat: 8, kind: '咒蚀' },
    poison: { pctMaxHp: 0.03, atkMul: 0.02, flat: 6, kind: '中毒' },
  };
  // 反查：能解除该 debuff 的法宝名（真源为 equipment.js 的 TREASURES[id].effect.cleanse）
  NDX.pdebuffCleanseTreasure = function (type) {
    if (!type) return null;
    const T = NDX.TREASURES || {};
    const ids = Object.keys(T);
    for (let i = 0; i < ids.length; i++) {
      const c = T[ids[i]] && T[ids[i]].effect && T[ids[i]].effect.cleanse;
      if (c && c.indexOf(type) >= 0) return T[ids[i]].name || ids[i];
    }
    return null;
  };
  // Boss 招牌 debuff 映射：按怪物名（含子串）解析；返回 { type, dur, applyAtStart, reapplyEvery }
  // V8.50 Boss 招牌 debuff 映射表（数据驱动，按序匹配名字子串，先命中先得）
  //   行格式：[名字子串, debuff 类型, 持续回合, 复挂周期]
  //   克制法宝**不在此登记** —— 真源是 equipment.js 的 TREASURES[id].effect.cleanse，
  //   反查统一走 NDX.pdebuffCleanseTreasure(type)，避免两处维护。
  NDX._BOSS_DEBUFF_MAP = [
    // —— 致盲 blind：风沙迷眼 / 金翅遮天 ——
    ['黄风', 'blind', 3, 4], ['大鹏', 'blind', 3, 4],
    // —— 怯战 atkDown：攻势受挫（尸气化盾 / 兵器被套 / 盗兵）——
    ['白骨', 'atkDown', 3, 4], ['黄狮', 'atkDown', 3, 4],
    ['青牛', 'atkDown', 3, 4], ['高老招亲', 'atkDown', 3, 4],
    // —— 灼烧 burn：三昧真火 / 火焰山 ——
    ['红孩', 'burn', 3, 3], ['牛魔', 'burn', 3, 3], ['铁扇', 'burn', 3, 3], ['老君', 'burn', 3, 3],
    // —— 摄魂 daze：妖法迷魂 / 真假难辨 / 葫芦收人 ——
    ['奎木狼', 'daze', 3, 4], ['黄袍', 'daze', 3, 4],
    ['六耳', 'daze', 3, 4], ['玉兔', 'daze', 3, 4], ['金角', 'daze', 3, 4], ['金蝉脱壳', 'daze', 3, 4],
    // —— 寒封 frost：涧水 / 河冰浸寒 ——
    ['白龙', 'frost', 3, 4], ['灵感', 'frost', 3, 4], ['金鱼', 'frost', 3, 4],
    ['老鼋', 'frost', 3, 4], ['通天河', 'frost', 3, 4],
    // —— 咒缚 curse：骷髅咒怨 / 心魔缠身 ——
    ['沙僧', 'curse', 3, 4], ['大圣残躯', 'curse', 3, 4],
    ['乌巢', 'curse', 3, 4], ['镇元', 'curse', 3, 4], ['五行归墟', 'curse', 3, 4],
    // —— 毒蚀 poison：倒马毒桩 / 虫毒 ——
    ['蝎子', 'poison', 3, 3], ['九头', 'poison', 3, 3],
    // —— 蚀骨 weak：刀伤断骨 / 雷法削骨 ——
    ['刘洪', 'weak', 3, 4], ['车迟', 'weak', 3, 4],
    ['青毛狮', 'weak', 3, 4], ['狮驼', 'weak', 3, 4], ['白鹿', 'weak', 3, 4],
  ];
  NDX._bossDebuffSpec = function (nameOrMon) {
    const m = (nameOrMon && typeof nameOrMon === 'object') ? nameOrMon : null;
    if (m && m.skipGimmick) return null; // 跳形态：持 phaseSkipOn 自动破除伪相，不挂 gimmick（白骨照妖镜跳过人形态怯战）
    const name = m ? m.name : nameOrMon;
    if (!name) return null;
    const n = String(name);
    const M = NDX._BOSS_DEBUFF_MAP || [];
    for (let i = 0; i < M.length; i++) {
      if (n.indexOf(M[i][0]) >= 0) {
        return { type: M[i][1], dur: M[i][2] || 3, applyAtStart: true, reapplyEvery: M[i][3] || 4 };
      }
    }
    return null;
  };
  NDX.BUFF_DEFS = { armor: { name: '叠甲', icon: '🛡', kind: 'buff' } };
  NDX.CFX_QIAO_SEQ = ['atk', 'atk', 'chant']; // 搓招：攻击·攻击·诵经 → 蓄力奥义
  NDX.CFX_QIAO_MUL = 2.5;                     // 奥义倍率
  NDX.CFX_SYNERGY_MUL = 1.15;                 // 状态堆叠协同（≥2 种 debuff）
  NDX.CFX_VULN_MUL = 1.25;                    // 易伤
  NDX.CFX_MARK_STEP = 0.08;                   // 标记每栈 +8%
  NDX.CFX_MARK_CAP = 5;
  NDX.CFX_FROZEN_MUL = 1.20;                  // 冻结
  NDX.CFX_SILENCE_MUL = 1.15;                 // 沉默
  NDX.CFX_ARMOR_STEP = 0.06;                  // 怪物叠甲每层减伤 6%
  NDX.CFX_ARMOR_CAP = 5;
  NDX.CFX_PET_SYN = 12;                       // 宠物连招协同追加真伤
  NDX.CFX_SHIELD_REV_STEP = 0.3;              // 夺盾反转反射系数（×每层甲）

  // 战斗状态初始化（挂于 pending.combatFx，随每场战斗重置）
  NDX.cfxInit = function (monster) {
    return {
      vuln: 0, mark: 0, frozen: 0, silence: 0, armor: 0,
      seq: [], qiaoReady: false,
      bossControlImmune: !!(monster && monster.boss),
      mMaxHp: (monster && (monster.maxHp || monster.hp)) || 1
    };
  };
  // 怪物当前生效的 debuff 种类数（用于状态堆叠协同；叠甲为怪物自身增益，不计）
  NDX.cfxMonsterDebuffCount = function (fx) {
    fx = fx || {}; let c = 0;
    if ((fx.vuln || 0) > 0) c++;
    if ((fx.mark || 0) > 0) c++;
    if ((fx.frozen || 0) > 0) c++;
    if ((fx.silence || 0) > 0) c++;
    return c;
  };
  // 施加 debuff：控制类（冻结/沉默）对 Boss 免疫；返回日志文案或 null
  NDX.cfxApplyDebuff = function (fx, type, amt) {
    fx = fx || {};
    if ((type === 'frozen' || type === 'silence') && fx.bossControlImmune) return null;
    if (type === 'vuln') { fx.vuln = (fx.vuln || 0) + (amt || 3); return '【易伤】透骨穿刺破防，妖物受到伤害 +25%（' + fx.vuln + ' 回合）'; }
    if (type === 'mark') { fx.mark = Math.min(NDX.CFX_MARK_CAP, (fx.mark || 0) + (amt || 1)); return '【标记】业火灼印，妖物受到伤害 +' + (fx.mark * NDX.CFX_MARK_STEP * 100) + '%'; }
    if (type === 'frozen') { fx.frozen = (fx.frozen || 0) + (amt || 1); return '【冻结】凝滞封脉，妖物受到伤害 +20%（Boss 免疫）'; }
    if (type === 'silence') { fx.silence = (fx.silence || 0) + (amt || 1); return '【沉默】封其妖术，妖物受到伤害 +15%（Boss 免疫）'; }
    return null;
  };
  // 综合进攻倍率：状态堆叠协同 + 易伤 + 标记 + 冻结 + 沉默 - 怪物叠甲（减伤）
  NDX.cfxOffenseMul = function (fx) {
    fx = fx || {};
    let mul = 1; const parts = [];
    const dc = NDX.cfxMonsterDebuffCount ? NDX.cfxMonsterDebuffCount(fx) : 0;
    if (dc >= 2) { mul *= NDX.CFX_SYNERGY_MUL; parts.push('·状态协同×' + NDX.CFX_SYNERGY_MUL); }
    if ((fx.vuln || 0) > 0) { mul *= NDX.CFX_VULN_MUL; parts.push('·易伤×' + NDX.CFX_VULN_MUL); }
    if ((fx.mark || 0) > 0) { const m = 1 + Math.min(NDX.CFX_MARK_CAP, fx.mark) * NDX.CFX_MARK_STEP; mul *= m; parts.push('·标记×' + m.toFixed(2)); }
    if ((fx.frozen || 0) > 0) { mul *= NDX.CFX_FROZEN_MUL; parts.push('·冻结×' + NDX.CFX_FROZEN_MUL); }
    if ((fx.silence || 0) > 0) { mul *= NDX.CFX_SILENCE_MUL; parts.push('·沉默×' + NDX.CFX_SILENCE_MUL); }
    if ((fx.armor || 0) > 0) { const a = 1 - Math.min(NDX.CFX_ARMOR_CAP, fx.armor) * NDX.CFX_ARMOR_STEP; mul *= a; parts.push('·叠甲×' + a.toFixed(2)); }
    return { mul: mul, parts: parts };
  };
  // 搓招序列：推入本次输入，检测 atk→atk→chant 并置奥义就绪
  NDX.cfxQiaoStep = function (p, kind) {
    p = p || {}; const fx = p.combatFx || {}; p.combatFx = fx;
    fx.seq = fx.seq || [];
    fx.seq.push(kind); if (fx.seq.length > 4) fx.seq.shift();
    const L = fx.seq.length, S = NDX.CFX_QIAO_SEQ;
    if (L >= 3 && fx.seq[L - 3] === S[0] && fx.seq[L - 2] === S[1] && fx.seq[L - 1] === S[2]) {
      fx.qiaoReady = true; fx.seq = []; return { qiaoReady: true };
    }
    return { qiaoReady: !!fx.qiaoReady };
  };
  // 怪物叠甲累积：怪物血量尚足时每次玩家行动 +1（封顶），营造"速破 or 久战变硬"张力
  NDX.cfxMonsterArmorTick = function (fx, hpRatio) {
    fx = fx || {}; if (hpRatio == null) hpRatio = 1;
    if (hpRatio > 0.6 && (fx.armor || 0) < NDX.CFX_ARMOR_CAP) fx.armor = (fx.armor || 0) + 1;
  };
  // 计时类 debuff 衰减（每次玩家行动后调用）
  NDX.cfxTickDown = function (fx) {
    fx = fx || {};
    if ((fx.vuln || 0) > 0) fx.vuln -= 1;
    if ((fx.frozen || 0) > 0) fx.frozen -= 1;
    if ((fx.silence || 0) > 0) fx.silence -= 1;
  };
  // 气势-连招联动：连击暴击时为后续回合积攒气势（与 MOMENTUM 阈值同口径）
  NDX.cfxBumpMomentum = function (res, fromIdx, n) {
    if (!res || !res.roundsDetail) return;
    const MAX = 5;
    for (let i = Math.max(0, fromIdx); i < res.roundsDetail.length; i++) {
      const rd = res.roundsDetail[i]; if (!rd) continue;
      rd.momentum = Math.min(MAX, (rd.momentum || 0) + n);
      rd.momentumTier = (rd.momentum >= 5 ? 3 : rd.momentum >= 3 ? 2 : rd.momentum >= 1 ? 1 : 0);
    }
  };
  // 宠物连招协同：玩家连击暴击时灵宠追加小额真伤（仅当本局携带灵宠）
  NDX.cfxPetSynergy = function (s) {
    if (!s || !s.pet) return 0;
    return NDX.CFX_PET_SYN || 12;
  };

  // —— 三键主动技能（activeSkill / applyHeroKeyFeel / applyActiveIntervention）——
  // 2026-09-09 已拆分至 js/combat_active.js（单一真源）；V9.6 清理此处重复定义的拆分残留。

  NDX.combatReady = true;
})();
