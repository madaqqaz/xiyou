/**
 * 属性计算模块（V8.40 · V8.5x 收口标记：仅 applyPostProcessing 活跃，其余为旧内联死代码，保留不删）
 * 统一管理英雄属性的计算，解耦散落在data.js/game.js/combat.js中的属性计算逻辑
 *
 * 设计原则：
 * 1. 单一职责：只负责属性计算，不负责状态管理
 * 2. 统一接口：所有系统通过NDX.AttrCalc访问属性计算
 * 3. 渐进式迁移：提供统一接口，逐步迁移现有属性计算逻辑
 * 4. 来源追踪：记录每个属性的来源，便于调试和平衡
 */
(function () {
  'use strict';

  var NDX = window.NDX || (window.NDX = {});

  /**
   * 属性类型定义
   */
  const ATTR_TYPES = {
    // 基础属性
    atk: '体攻',        // 物理攻击
    matk: '法攻',       // 法术攻击
    hp: '气血',         // 生命值
    maxHp: '气血上限',  // 生命值上限
    dr: '护体',         // 物理防御
    mdef: '法防',       // 法术防御
    eva: '闪避',        // 闪避率
    cri: '暴击',        // 暴击率
    criMult: '暴击倍率', // 暴击伤害倍率
    // 战斗资源
    zhanYi: '战意',     // 战意
    jingLi: '经力',     // 经力
    // 其他
    speed: '速度',      // 速度
    lifeSteal: '吸血',  // 吸血率
    shield: '护盾',     // 护盾
  };

  /**
   * 属性来源类型
   */
  const SOURCE_TYPES = {
    hero: '英雄基础',
    equipment: '装备',
    seal: '劫印',
    sutra: '经文',
    battleResource: '战意/经力',
    buff: 'Buff',
    debuff: 'Debuff',
    difficulty: '难度',
  };

  /**
   * 计算英雄的基础属性
   * @param {Object} s - 游戏状态
   * @returns {Object} 基础属性
   */
  function calcBaseAttrs(s) {
    if (!s || !s.hero) return {};
    const heroId = s.hero;
    // 英雄基础属性从NDX.HEROES或类似结构获取
    const heroData = (NDX.HEROES && NDX.HEROES[heroId]) || {};
    return {
      atk: heroData.atk || 0,
      matk: heroData.matk || 0,
      hp: heroData.hp || 0,
      maxHp: heroData.maxHp || heroData.hp || 0,
      dr: heroData.dr || 0,
      mdef: heroData.mdef || 0,
      eva: heroData.eva || 0,
      cri: heroData.cri || 0,
      criMult: heroData.criMult || 1.5,
      speed: heroData.speed || 10,
    };
  }

  /**
   * 计算装备属性加成
   * @param {Object} s - 游戏状态
   * @returns {Object} 装备属性加成
   */
  function calcEquipmentBonus(s) {
    if (!s || !Array.isArray(s.equips)) return {};
    const bonus = {};
    s.equips.forEach((eq) => {
      if (!eq) return;
      // 装备属性加成
      ['atk', 'matk', 'hp', 'maxHp', 'dr', 'mdef', 'eva', 'cri', 'criMult', 'speed', 'lifeSteal'].forEach((attr) => {
        if (eq[attr] != null) {
          bonus[attr] = (bonus[attr] || 0) + eq[attr];
        }
      });
      // 百分比加成
      ['atkPct', 'matkPct', 'hpPct', 'drPct', 'mdefPct'].forEach((attr) => {
        if (eq[attr] != null) {
          bonus[attr] = (bonus[attr] || 0) + eq[attr];
        }
      });
    });
    return bonus;
  }

  /**
   * 计算劫印属性加成
   * @param {Object} s - 游戏状态
   * @returns {Object} 劫印属性加成
   */
  function calcSealBonus(s) {
    if (!s || !Array.isArray(s.seals)) return {};
    const bonus = {};
    const activeSeals = s.seals.filter((sl) => !!sl);
    // V3 §1.1 全数自动生效：所有已刻劫印一并提供基础加成，不再区分生效/捺存
    // V9.6 口径修正：劫印词条以 `stat`（加成目标）+ `val`（百分比/增量）表达，
    //   与战斗真源 NDX.computeStats（combat.js）同口径。此处历史遗留按**不存在的字段名**
    //   （maxHp / cri / lifeSteal 直读 seal 对象）取值，对劫印恒零命中 → 恒返回 {} 的陷阱实现。
    //   注意：战斗数值真源唯一在 combat.js computeStats；本函数仅供 AttrCalc 的
    //   调试/追踪接口（calcFinalAttrs / traceAttrSource）使用，不得与真源分叉。
    activeSeals.forEach((sl) => {
      if (!sl) return;
      const v = sl.val;
      if (v != null) {
        switch (sl.stat) {
          case 'atk': bonus.atkPct = (bonus.atkPct || 0) + v; break;
          case 'matk': bonus.matkPct = (bonus.matkPct || 0) + v; break;
          case 'maxhp': bonus.hpPct = (bonus.hpPct || 0) + v; break;
          case 'dr': bonus.dr = (bonus.dr || 0) + v; break;
          case 'mdef': bonus.mdef = (bonus.mdef || 0) + v; break;
          case 'eva': bonus.eva = (bonus.eva || 0) + v; break;
          // reflect（反伤）为战斗专属语义，AttrCalc 白名单无对应字段，由 combat 真源结算
          default: break;
        }
      }
      // 附随小词条：暴击 / 气血上限 / 吸血（seal 对象的直挂字段，命名以劫印真源为准）
      if (sl.crit) bonus.cri = (bonus.cri || 0) + sl.crit;
      if (sl.maxhp) bonus.hpPct = (bonus.hpPct || 0) + sl.maxhp;
      if (sl.lifesteal) bonus.lifeSteal = (bonus.lifeSteal || 0) + sl.lifesteal;
    });
    // V3 §1.3/§1.4 道途阶段碑：自动累计于全部持有印（无需生效格管理），叠加层不推翻每印百分比
    if (typeof NDX.sealBreakAll === 'function') {
      const _sb = NDX.sealBreakAll(s) || {};
      for (const k of Object.keys(_sb)) {
        if (_sb[k] == null) continue;
        bonus[k] = (bonus[k] || 0) + _sb[k];
      }
    }
    return bonus;
  }

  /**
   * 计算经文属性加成
   * @param {Object} s - 游戏状态
   * @returns {Object} 经文属性加成
   */
  function calcSutraBonus(s) {
    if (!s) return {};
    // 经文数量加成通过NDX.sutraCountBonus计算
    if (typeof NDX.sutraCountBonus === 'function') {
      return NDX.sutraCountBonus(s) || {};
    }
    return {};
  }

  /**
   * 计算战意/经力属性加成
   * @param {Object} state - 战斗资源状态
   * @returns {Object} 战意/经力属性加成
   */
  function calcBattleResourceBonus(state) {
    if (!state) return {};
    const bonus = {};
    // 战意每层+3%攻击
    if (state.zhanYi > 0) {
      bonus.atkPct = (bonus.atkPct || 0) + state.zhanYi * 0.03;
    }
    // 经力每层+5%法攻
    if (state.jingLi > 0) {
      bonus.matkPct = (bonus.matkPct || 0) + state.jingLi * 0.05;
    }
    return bonus;
  }

  /**
   * 合并多个属性加成
   * @param {...Object} bonuses - 属性加成对象列表
   * @returns {Object} 合并后的属性加成
   */
  function mergeBonuses(...bonuses) {
    const result = {};
    bonuses.forEach((b) => {
      if (!b) return;
      Object.keys(b).forEach((key) => {
        result[key] = (result[key] || 0) + b[key];
      });
    });
    return result;
  }

  /**
   * 应用百分比加成到基础属性
   * @param {Object} base - 基础属性
   * @param {Object} bonus - 属性加成（包含绝对值和百分比）
   * @returns {Object} 最终属性
   */
  function applyBonus(base, bonus) {
    if (!base) return {};
    const result = Object.assign({}, base);
    if (!bonus) return result;

    // 应用绝对值加成
    ['atk', 'matk', 'hp', 'maxHp', 'dr', 'mdef', 'eva', 'cri', 'criMult', 'speed', 'lifeSteal'].forEach((attr) => {
      if (bonus[attr] != null) {
        result[attr] = (result[attr] || 0) + bonus[attr];
      }
    });

    // 应用百分比加成
    const pctMap = {
      atkPct: 'atk',
      matkPct: 'matk',
      hpPct: 'maxHp',
      drPct: 'dr',
      mdefPct: 'mdef',
    };
    Object.keys(pctMap).forEach((pctAttr) => {
      const baseAttr = pctMap[pctAttr];
      if (bonus[pctAttr] != null && result[baseAttr] != null) {
        result[baseAttr] = result[baseAttr] * (1 + bonus[pctAttr]);
      }
    });

    return result;
  }

  /**
   * 计算英雄的最终属性（综合所有来源）
   * @param {Object} s - 游戏状态
   * @param {Object} battleState - 战斗资源状态（可选）
   * @returns {Object} 最终属性
   */
  function calcFinalAttrs(s, battleState) {
    const base = calcBaseAttrs(s);
    const eqBonus = calcEquipmentBonus(s);
    const sealBonus = calcSealBonus(s);
    const sutraBonus = calcSutraBonus(s);
    const brBonus = battleState ? calcBattleResourceBonus(battleState) : {};

    const totalBonus = mergeBonuses(eqBonus, sealBonus, sutraBonus, brBonus);
    return applyBonus(base, totalBonus);
  }

  /**
   * 追踪属性来源（用于调试和平衡）
   * @param {Object} s - 游戏状态
   * @param {string} attr - 属性名
   * @returns {Object} 属性来源明细
   */
  function traceAttrSource(s, attr) {
    if (!s || !attr) return {};
    const base = calcBaseAttrs(s);
    const eqBonus = calcEquipmentBonus(s);
    const sealBonus = calcSealBonus(s);
    const sutraBonus = calcSutraBonus(s);

    return {
      base: base[attr] || 0,
      equipment: eqBonus[attr] || 0,
      seal: sealBonus[attr] || 0,
      sutra: sutraBonus[attr] || 0,
      total: (base[attr] || 0) + (eqBonus[attr] || 0) + (sealBonus[attr] || 0) + (sutraBonus[attr] || 0),
    };
  }

  /**
   * 计算玩家综合属性（包装NDX.computeStats，提供统一接口）
   * @param {Object} s - 游戏状态
   * @param {Object} options - 额外选项
   * @returns {Object} 综合属性 { ti: {...}, yuan: {...}, sealFlags: {...}, ... }
   */
  function computePlayerStats(s, options) {
    if (!s || !NDX.computeStats) return null;
    const opts = options || {};
    // 收集佛经全本效果（含佛经全本+逆道经文全本+经文宏愿·数量加成）
    const sutraEffs = [];
    // V3 §二 自动路由：本经道途 === 当前主道途 → 该经效果 ×1.5（经文自动流向所走之道）
    const mainDao = NDX.playerDao ? NDX.playerDao(s) : null;
    const _routeDao = (eff, id) => {
      if (!eff) return null;
      if (!NDX.sutraDaoOf || NDX.sutraDaoOf(id) !== mainDao) return eff;
      const out = JSON.parse(JSON.stringify(eff));
      const _mul = (o) => { if (!o) return; for (const k of Object.keys(o)) { if (typeof o[k] === 'number') o[k] = Math.round(o[k] * 150) / 100; } };
      _mul(out); if (out.ti) _mul(out.ti); if (out.yuan) _mul(out.yuan);
      out._sutraMainDao = 1;
      return out;
    };
    // 佛经全本效果
    (s.sutras || []).forEach((id) => {
      const eff = _routeDao((NDX.sutraFullById && NDX.sutraFullById(id) || {}).effect, id);
      if (eff) sutraEffs.push(eff);
    });
    // 逆道经文全本（选逆攒齐自动合成）：与佛经全本同管线并入被动战力
    (s.niSutras || []).forEach((id) => {
      const eff = _routeDao((NDX.niSutraFullById && NDX.niSutraFullById(id) || {}).effect, id);
      if (eff) sutraEffs.push(eff);
    });
    // 经文宏愿·数量加成（V8.35）：按集齐经文总数分档给全属性加成 + 主攻道专属加成
    if (typeof NDX.sutraCountBonus === 'function') {
      const eff = NDX.sutraCountBonus(s);
      if (eff) sutraEffs.push(eff);
    }
    // 隐藏职加成
    let jobTi = Object.assign({}, s.bonusTi || {});
    let jobYuan = Object.assign({}, s.bonusYuan || {});
    let goodAdd = 0;
    const jobKey = s.flags && s.flags.jobConfirm;
    if (jobKey && NDX.HIDDEN_JOBS) {
      for (const k of Object.keys(NDX.HIDDEN_JOBS)) {
        const hit = (NDX.HIDDEN_JOBS[k] || []).find((x) => x.job === jobKey);
        if (hit && hit.effect && hit.effect.bonus) {
          const b = hit.effect.bonus;
          if (b.ti) for (const k2 of Object.keys(b.ti)) jobTi[k2] = (jobTi[k2] || 0) + b.ti[k2];
          if (b.yuan) for (const k2 of Object.keys(b.yuan)) jobYuan[k2] = (jobYuan[k2] || 0) + b.yuan[k2];
          if (b.good) goodAdd = b.good;
          break;
        }
      }
    }
    // 调用NDX.computeStats
    const result = NDX.computeStats(
      s.hero,
      s.equips,
      s.materials,
      {
        ti: jobTi,
        yuan: jobYuan,
        sutras: sutraEffs,
        seals: s.seals,
        tier: (NDX.ZHUANJIE ? NDX.ZHUANJIE.tierBonus(s) : null),
        daoxinTier: (typeof NDX.daoxinTier === 'function' ? NDX.daoxinTier(s) : null),
      },
      s.diff,
      s.act
    );
    // V3 §二 暴露经路由处理后的经文效果，供面板/门禁读取实际生效值（含主道途×1.5）
    result.sutras = sutraEffs;
    return result;
  }

  /**
   * 追踪玩家属性来源（综合所有来源，用于调试和平衡）
   * @param {Object} s - 游戏状态
   * @param {string} attr - 属性名（如 'atk', 'matk', 'maxHp', 'dr'）
   * @returns {Object} 属性来源明细
   */
  function tracePlayerStats(s, attr) {
    if (!s || !attr) return {};
    const hero = (NDX.HEROES && NDX.HEROES[s.hero]) || {};
    const d = s.diff || 1;
    // 基础属性
    const base = (typeof NDX.playerBaseAt === 'function') ? NDX.playerBaseAt(d, hero) : {};
    // 装备加成
    let eqBonus = 0;
    const barEquips = (typeof NDX.activeEquipsFor === 'function') ? NDX.activeEquipsFor(s.equips || []) : (s.equips || []);
    barEquips.forEach((e) => {
      if (e && e[attr] != null) eqBonus += e[attr];
    });
    // bonusTi/bonusYuan加成
    let bonusTiVal = 0, bonusYuanVal = 0;
    if (s.bonusTi && s.bonusTi[attr] != null) bonusTiVal = s.bonusTi[attr];
    if (s.bonusYuan && s.bonusYuan[attr] != null) bonusYuanVal = s.bonusYuan[attr];
    // 劫印加成（简化：只统计绝对值）（V3 §1.1 全量自动生效）
    let sealBonus = 0;
    const activeSeals = (s.seals || []).filter((sl) => sl && sl.dao);
    activeSeals.forEach((sl) => {
      if (sl && sl.stat === attr && sl.val) {
        // 劫印是百分比加成，这里只记录比例
        sealBonus += sl.val;
      }
    });
    return {
      base: base[attr] || 0,
      equipment: eqBonus,
      bonusTi: bonusTiVal,
      bonusYuan: bonusYuanVal,
      sealPct: sealBonus, // 劫印是百分比加成
      total: (base[attr] || 0) + eqBonus + bonusTiVal + bonusYuanVal,
    };
  }

  /**
   * 应用属性后处理（迁移自game.js stats()的后续处理逻辑）
   * 包括：上限百分比加成、劫灰永久升级、Boss遗物、师徒缘、佛经全本被动、金箍、隐藏职善值加成等
   * @param {Object} s - 游戏状态
   * @param {Object} base - 基础属性（由computePlayerStats返回）
   * @param {Array} sutraEffs - 佛经效果列表（用于百分比类处理）
   * @returns {Object} 处理后的属性
   */
  function applyPostProcessing(s, base, sutraEffs) {
    if (!s || !base) return base;
    const result = base;

    // 1. 上限百分比加成（来自 maxhpPct 类效果）作用于体·气血；心魔战失败削减本局气血上限
    if (result.ti && result.ti.maxHp != null) {
      result.ti.maxHp = Math.round(result.ti.maxHp * (1 + (s.maxhpPctBonus || 0)) * (1 - (s.xinmoMaxHpLoss || 0)));
    }

    // P0-C 去纵向：阶段六·劫灰「金蝉余韵」不再 +% 全局气血上限，改为横向解锁传承英雄（见 data_reincarnation.js）
    // 2. 阶段六·劫灰永久升级「金蝉余韵」：全局气血上限 +2%/级（P0-C 已移除）

    // 3. Boss 遗物（跨 Act 永久被动）并入面板
    if (Array.isArray(s.relics) && Array.isArray(NDX.BOSS_RELICS)) {
      s.relics.forEach((rel) => {
        const ef = (NDX.BOSS_RELICS.find((r) => r.id === rel) || {}).effect || {};
        if (ef.atkPct && result.ti && result.ti.atk != null) result.ti.atk = Math.round(result.ti.atk * (1 + ef.atkPct));
        if (ef.matkPct && result.yuan && result.yuan.matk != null) result.yuan.matk = Math.round(result.yuan.matk * (1 + ef.matkPct));
        if (ef.hpPct && result.ti && result.ti.maxHp != null) { result.ti.maxHp = Math.round(result.ti.maxHp * (1 + ef.hpPct)); result.hp = result.ti.maxHp; }
        if (ef.dr && result.ti) result.ti.dr = Math.min(0.85, (result.ti.dr || 0) + ef.dr);
        if (ef.mdef && result.yuan) result.yuan.mdef = Math.min(0.85, (result.yuan.mdef || 0) + ef.mdef);
        if (ef.eva && result.ti) result.ti.eva = Math.min(0.6, (result.ti.eva || 0) + ef.eva);
        if (ef.shieldPct) s._relicShieldPct = Math.max(s._relicShieldPct || 0, ef.shieldPct);
        if (ef.regenPct) s._relicRegenPct = Math.max(s._relicRegenPct || 0, ef.regenPct);
      });
    }

    // 4. 师徒缘：徒弟被动增益并入面板（血上限/减伤/战后回血）
    if (typeof NDX.discipleBonus === 'function') {
      const _db = NDX.discipleBonus(s);
      if (_db.hp && result.ti && result.ti.maxHp != null) { result.ti.maxHp = Math.round(result.ti.maxHp + _db.hp); result.hp = result.ti.maxHp; }
      if (_db.dr && result.ti) result.ti.dr = Math.min(0.85, (result.ti.dr || 0) + _db.dr);
      if (_db.hpRegen && result.ti) result.ti.hpRegen = (result.ti.hpRegen || 0) + _db.hpRegen;
    }

    // 5. 佛经全本被动（百分比类与暴击/自愈字段）
    if (Array.isArray(sutraEffs)) {
      sutraEffs.forEach((ef) => {
        if (ef.maxhpPct && result.ti && result.ti.maxHp != null) result.ti.maxHp = Math.round(result.ti.maxHp * (1 + ef.maxhpPct));
        if (ef.healPct && result.ti && result.ti.maxHp != null) result.ti.hpRegen = (result.ti.hpRegen || 0) + Math.round(result.ti.maxHp * ef.healPct);
        if (ef.crit && result.ti) result.ti.cri = Math.min(1, (result.ti.cri || 0) + ef.crit);
      });
    }

    // 6. 金箍：战力暴涨百分百（+100% 体攻）。悟空走暗线不戴金箍时，残留妖性爆发作为补偿
    if (s.flags && s.flags.jingu && result.ti && result.ti.atk != null) {
      result.ti.atk = Math.round(result.ti.atk * 2);
    } else if (s.hero === 'wukong' && result.ti) {
      if (result.ti.atk != null) result.ti.atk = Math.round(result.ti.atk * 1.35);
      if (result.ti.maxHp != null) result.ti.maxHp = Math.round(result.ti.maxHp * 1.2);
    }

    // 7. 隐藏职善值加成（如弃经金蝉 +10 善）
    let goodAdd = 0;
    const jobKey = s.flags && s.flags.jobConfirm;
    if (jobKey && NDX.HIDDEN_JOBS) {
      for (const k of Object.keys(NDX.HIDDEN_JOBS)) {
        const hit = (NDX.HIDDEN_JOBS[k] || []).find((x) => x.job === jobKey);
        if (hit && hit.effect && hit.effect.bonus && hit.effect.bonus.good) {
          goodAdd = hit.effect.bonus.good;
          break;
        }
      }
    }
    if (goodAdd && result.yuan) {
      result.yuan.good = (result.yuan.good || 0) + goodAdd;
    }

    // 7.5 套装独立通用隐藏职（SET_JOBS）：由包裹中的套装组件（slot:'component'）激活，
    // 最高转职档生效，任何英雄走该套均可获得，不与英雄隐藏职重合（如唐僧走玄武套补防御不影响法伤）。
    // 效果为固定值增量，并入面板（攻/血/减伤/闪避/反伤）；jobs 写回 s 供 UI 展示。
    if (NDX.setJobBonusFor && NDX.SET_JOBS) {
      const _sj = NDX.setJobBonusFor(s);
      if (_sj && _sj.bonus && _sj.bonus.ti) {
        const _b = _sj.bonus.ti;
        if (_b.atk && result.ti && result.ti.atk != null) result.ti.atk = Math.round(result.ti.atk + _b.atk);
        if (_b.hp && result.ti && result.ti.maxHp != null) { result.ti.maxHp = Math.round(result.ti.maxHp + _b.hp); result.hp = result.ti.maxHp; }
        if (_b.dr && result.ti) result.ti.dr = Math.min(0.85, (result.ti.dr || 0) + _b.dr);
        if (_b.eva && result.ti) result.ti.eva = Math.min(0.6, (result.ti.eva || 0) + _b.eva);
        if (_b.reflect && result.ti) result.ti.reflect = (result.ti.reflect || 0) + _b.reflect;
        if (_b.crit && result.ti) result.ti.crit = Math.min(1.0, (result.ti.crit || 0) + _b.crit);
      }
      if (_sj && _sj.jobs) {
        s._setJobs = _sj.jobs;
        s._setJobMaxTier = _sj.maxTier;
      }
    }

    // 8. 双线赐福（秩序/混沌）百分比乘区：对接轮回殿最终定稿 NDX.applyBlessing
    if (typeof NDX.applyBlessing === 'function' && typeof NDX.loadFavor === 'function') {
      NDX.applyBlessing(result, NDX.loadFavor());
    }

    // 9. 业镜持续状态乘区：本局业镜抉择写入 s.mirror 的"百分比/标记"在此并入面板
    const mr = s.mirror || {};
    if (mr.atkPct && result.ti && result.ti.atk != null) result.ti.atk = Math.round(result.ti.atk * (1 + mr.atkPct));
    if (mr.drPct && result.ti) result.ti.drPct = (result.ti.drPct || 0) + mr.drPct;   // 百分比减伤（与减法 dr 叠加）
    if (mr.bossDmgMul) result.bossDmgMul = (result.bossDmgMul || 0) + mr.bossDmgMul; // 对BOSS伤害加成
    if (mr.trueDmgLayer) result.trueDmgLayer = true;                  // 本层攻击附真实伤害
    if (mr.voidLayer) result.voidLayer = true;                        // 本层隐形
    // 本层最大生命 -X%（不可逆）：直接折损气血上限
    if (mr.maxHpLossPct && result.ti && result.ti.maxHp != null) result.ti.maxHp = Math.round(result.ti.maxHp * (1 - mr.maxHpLossPct));
    // 狂战血怒：生命越低伤害越高（最高 +50%）
    if (mr.bloodFury && result.ti && result.ti.atk != null && result.ti.maxHp != null) {
      const ratio = Math.max(0, Math.min(1, s.hp / Math.max(1, result.ti.maxHp)));
      const fury = 0.5 * (1 - ratio);
      result.ti.atk = Math.round(result.ti.atk * (1 + fury));
    }
    // 挑担：负面状态转攻击力（简化：+20% 体攻）
    if (mr.negativeToAtk && result.ti && result.ti.atk != null) result.ti.atk = Math.round(result.ti.atk * 1.2);
    // 业镜·护盾/免疫致死/持续掉血：透传给战斗模拟层
    if (mr.shieldPct) result.shieldPct = (result.shieldPct || 0) + mr.shieldPct;
    // 土地神龛「舍利·金刚」相：每级开局气血护盾比例并入护盾乘区（通用来源，非体攻流专属）
    if (s.campShieldPct) result.shieldPct = (result.shieldPct || 0) + s.campShieldPct;
    if (mr.immuneDeath) result.immuneDeath = true;
    if (mr.hpDrainPct) result.hpDrainPct = (result.hpDrainPct || 0) + mr.hpDrainPct;

    // 10. 业藏录加成（无怒气版 · 全局永久加成，与赐福/成就同池）：从缓存读取，避免每帧重算
    const cb = NDX._collBonus || {};
    if (cb.dmgBoss_coll) result.bossDmgMul = (result.bossDmgMul || 0) + cb.dmgBoss_coll;       // 对BOSS伤害
    if (cb.dmgTaken_coll) result.dmgTakenColl = (result.dmgTakenColl || 0) + cb.dmgTaken_coll;  // 受击减伤（负值=减伤）
    if (cb.breakEff_coll) result.breakEffColl = (result.breakEffColl || 0) + cb.breakEff_coll;  // 破韧效率
    if (cb.tough_coll) result.toughColl = (result.toughColl || 0) + cb.tough_coll;             // 韧性(抗打断)
    if (cb.cdRed_coll) result.cdRedColl = (result.cdRedColl || 0) + cb.cdRed_coll;             // 法宝冷却缩减
    if (cb.miGain_coll) result.miGainColl = (result.miGainColl || 0) + cb.miGain_coll;          // 混元点获取
    if (cb.orderMultAdd_coll) result.orderMultAddColl = (result.orderMultAddColl || 0) + cb.orderMultAdd_coll; // 秩序赐福额外
    if (cb.healBoost_coll) result.healBoostColl = (result.healBoostColl || 0) + cb.healBoost_coll;             // 受治疗提升
    if (cb.dmgTianting_coll) result.dmgTiantingColl = (result.dmgTiantingColl || 0) + cb.dmgTianting_coll;     // 对天庭特攻
    if (cb.karmaSpeed_coll) result.karmaSpeedColl = (result.karmaSpeedColl || 0) + cb.karmaSpeed_coll;         // 业障积累速度(逆道)

    return result;
  }

  // 导出模块
  NDX.AttrCalc = {
    ATTR_TYPES: ATTR_TYPES,
    SOURCE_TYPES: SOURCE_TYPES,
    calcBaseAttrs: calcBaseAttrs,
    calcEquipmentBonus: calcEquipmentBonus,
    calcSealBonus: calcSealBonus,
    calcSutraBonus: calcSutraBonus,
    calcBattleResourceBonus: calcBattleResourceBonus,
    mergeBonuses: mergeBonuses,
    applyBonus: applyBonus,
    calcFinalAttrs: calcFinalAttrs,
    traceAttrSource: traceAttrSource,
    computePlayerStats: computePlayerStats,
    tracePlayerStats: tracePlayerStats,
    applyPostProcessing: applyPostProcessing,
  };

})();
