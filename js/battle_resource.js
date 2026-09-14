/**
 * 战斗资源模块（V8.40）
 * 统一管理战意/经力系统的初始化、获取、消耗、修正
 * 解耦：将散落在game.js/main.js/ui.js中的战意/经力逻辑集中到此处
 *
 * 设计原则：
 * 1. 单一职责：只负责战意/经力的计算和状态管理
 * 2. 统一接口：所有系统通过NDX.BattleResource访问战意/经力
 * 3. 渐进式迁移：保持旧接口兼容，逐步迁移到新模块
 */
(function () {
  'use strict';

  var NDX = window.NDX || (window.NDX = {});

  /**
   * 战意/经力默认配置
   */
  const DEFAULT_CONFIG = {
    zhanYiMax: 10,        // 战意默认上限
    jingLiMax: 5,         // 经力默认上限
    zhanYiGain: 1,        // 战意默认获取速度
    jingLiGain: 1,        // 经力默认获取速度
    keepZhanYiChance: 0,  // 受击保留战意概率
    ultBonusPerLayer: 0,  // 绝招每层额外伤害加成
    zhanYiDamagePerLayer: 0.03,  // 战意每层伤害加成（3%）
  };

  /**
   * 英雄差异化配置
   * 不同英雄有不同的战意/经力基础上限
   */
  const HERO_CONFIG = {
    tangseng:    { zhanYiMax: 10, jingLiMax: 5, name: '取经人' },     // 平衡型
    wukong:      { zhanYiMax: 15, jingLiMax: 3, name: '悟空' },     // 战意型
    bajie:       { zhanYiMax: 8,  jingLiMax: 7, name: '八戒' },     // 经力型
    shaseng:     { zhanYiMax: 12, jingLiMax: 4, name: '沙僧' },     // 防御型
    xiaobailong: { zhanYiMax: 10, jingLiMax: 6, name: '龙马' },     // 速度型
  };

  /**
   * 初始化战意/经力参数
   * 综合考虑：英雄基础值 + 劫印道途 + 经文数量 + 装备套装
   * @param {Object} s - 游戏状态
   * @returns {Object} 战意/经力配置
   */
  function initConfig(s) {
    if (!s) return Object.assign({}, DEFAULT_CONFIG);

    const cfg = Object.assign({}, DEFAULT_CONFIG);

    // 1. 英雄差异化
    const heroId = s.hero || 'tangseng';
    const heroCfg = HERO_CONFIG[heroId] || HERO_CONFIG.tangseng;
    cfg.zhanYiMax = heroCfg.zhanYiMax;
    cfg.jingLiMax = heroCfg.jingLiMax;

    // 2. 劫印道途加成（通过统一模块NDX.DaoSystem计算）
    if (NDX.DaoSystem && typeof NDX.DaoSystem.getDaoBonus === 'function') {
      const daoBonus = NDX.DaoSystem.getDaoBonus(s);
      cfg.zhanYiMax += daoBonus.zhanYiMax || 0;
      cfg.jingLiMax += daoBonus.jingLiMax || 0;
      cfg.zhanYiGain *= daoBonus.zhanYiGainMult || 1;
      cfg.jingLiGain *= daoBonus.jingLiGainMult || 1;
      cfg.keepZhanYiChance = Math.max(cfg.keepZhanYiChance, daoBonus.keepZhanYiChance || 0);
      cfg.ultBonusPerLayer += daoBonus.ultBonusPerLayer || 0;
    } else {
      // 降级：手动计算道途加成（V3 §1.1 全量自动生效）
      const activeSeals = (s.seals || []).filter((sl) => sl && sl.dao);
      const daoCount = {};
      activeSeals.forEach((sl) => {
        if (sl && sl.dao) daoCount[sl.dao] = (daoCount[sl.dao] || 0) + 1;
      });
      if (daoCount['战']) {
        cfg.zhanYiMax += daoCount['战'] * 2;
        cfg.zhanYiGain *= (1 + daoCount['战'] * 0.5);
        cfg.keepZhanYiChance = Math.min(0.8, (cfg.keepZhanYiChance || 0) + daoCount['战'] * 0.2);
      }
      if (daoCount['渡']) {
        cfg.jingLiMax += daoCount['渡'] * 2;
        cfg.jingLiGain *= (1 + daoCount['渡'] * 0.5);
      }
      if (daoCount['隐']) {
        cfg.keepZhanYiChance = Math.min(0.8, daoCount['隐'] * 0.2);
      }
      if (daoCount['夺']) {
        cfg.ultBonusPerLayer += daoCount['夺'] * 0.05;
      }
      if (daoCount['缘']) {
        cfg.zhanYiGain *= (1 + daoCount['缘'] * 0.25);
        cfg.jingLiGain *= (1 + daoCount['缘'] * 0.25);
      }
      if (daoCount['逆']) {
        cfg.zhanYiMax += daoCount['逆'];
        cfg.jingLiMax += daoCount['逆'];
        cfg.ultBonusPerLayer += daoCount['逆'] * 0.1;
      }
    }

    // 3. 经文系统协同
    const frags = s.sutraFrags || {};
    let ferryCount = 0, rebelCount = 0;
    Object.keys(frags).forEach((fid) => {
      if (fid.indexOf('ferry') >= 0 || fid.indexOf('渡') >= 0) ferryCount += (frags[fid] || 0);
      if (fid.indexOf('rebel') >= 0 || fid.indexOf('逆') >= 0) rebelCount += (frags[fid] || 0);
    });
    if (ferryCount > 0) {
      cfg.jingLiGain *= (1 + ferryCount * 0.1);
      cfg.jingLiMax += Math.floor(ferryCount / 3);
    }
    if (rebelCount > 0) {
      cfg.zhanYiGain *= (1 + rebelCount * 0.1);
      cfg.zhanYiMax += Math.floor(rebelCount / 3);
    }

    // 4. 装备套装协同
    const equips = s.equips || [];
    const setCount = {};
    equips.forEach((eq) => {
      if (eq && eq.set) setCount[eq.set] = (setCount[eq.set] || 0) + 1;
    });
    const duE = setCount['渡厄'] || setCount['du_e'] || 0;
    const zy = setCount['战意'] || setCount['zhan_yi'] || 0;
    const sx = setCount['守心'] || setCount['shou_xin'] || setCount['防御'] || 0;
    if (duE > 0) {
      cfg.jingLiGain *= (1 + duE * 0.2);
      if (duE >= 2) cfg.jingLiMax += 1;
    }
    if (zy > 0) {
      cfg.zhanYiGain *= (1 + zy * 0.2);
      if (zy >= 2) cfg.zhanYiMax += 1;
    }
    if (sx > 0) {
      cfg.keepZhanYiChance = Math.min(0.8, (cfg.keepZhanYiChance || 0) + sx * 0.1);
    }

    return cfg;
  }

  /**
   * 创建战斗资源状态
   * @param {Object} s - 游戏状态
   * @returns {Object} 战斗资源状态
   */
  function createState(s) {
    const cfg = initConfig(s);
    return {
      zhanYi: 0,
      jingLi: 0,
      zhanYiMax: cfg.zhanYiMax,
      jingLiMax: cfg.jingLiMax,
      zhanYiGain: cfg.zhanYiGain,
      jingLiGain: cfg.jingLiGain,
      keepZhanYiChance: cfg.keepZhanYiChance,
      ultBonusPerLayer: cfg.ultBonusPerLayer,
      jingLiReady: false,
      keepZhanYiBuff: 0,  // 防御型法宝护体回合数
      // P2-1 满而不溢：战意满后溢出攒「昂扬」层（≤3），绝招时每层 +15% 伤害；
      //            经力满后溢出攒「化雨」层（≤3），诵经时每层回复 6% 最大气血
      zhanYiOverflow: 0,
      jingLiOverflow: 0,
    };
  }

  /**
   * 获取战意
   * @param {Object} state - 战斗资源状态
   * @returns {number} 实际获取量
   */
  function gainZhanYi(state) {
    if (!state) return 0;
    const gain = Math.max(1, Math.round((state.zhanYiGain || 1) * 10) / 10);
    const old = state.zhanYi || 0;
    const max = state.zhanYiMax || 1;
    // P2-1 战意昂扬（满而不溢）：已满时溢出不再白白浪费，转为「昂扬」层（≤3），绝招时每层 +15% 伤害
    if (old >= max) {
      state.zhanYiOverflow = Math.min(3, (state.zhanYiOverflow || 0) + 1);
      return 0;
    }
    state.zhanYi = Math.min(max, old + gain);
    return state.zhanYi - old;
  }

  /**
   * 获取经力
   * @param {Object} state - 战斗资源状态
   * @returns {Object} { gained: number, ready: boolean }
   */
  function gainJingLi(state) {
    if (!state) return { gained: 0, ready: false };
    if (state.jingLiReady) {
      // 经力已满，触发金刚经后清零
      state.jingLi = 0;
      state.jingLiReady = false;
      return { gained: 0, ready: true, triggered: true };
    }
    const gain = Math.max(1, Math.round((state.jingLiGain || 1) * 10) / 10);
    const old = state.jingLi || 0;
    state.jingLi = Math.min(state.jingLiMax, old + gain);
    const ready = state.jingLi >= state.jingLiMax;
    if (ready) state.jingLiReady = true;
    return { gained: state.jingLi - old, ready: ready };
  }

  /**
   * 绝招消耗战意/经力
   * @param {Object} state - 战斗资源状态
   * @returns {Object} { totalPower: number, bonus: number }
   */
  function consumeForUlt(state) {
    if (!state) return { totalPower: 0, bonus: 0, overflow: 0 };
    const totalPower = (state.zhanYi || 0) + (state.jingLi || 0);
    const bonus = totalPower * (state.ultBonusPerLayer || 0);
    const overflow = state.zhanYiOverflow || 0;
    state.zhanYi = 0;
    state.jingLi = 0;
    state.jingLiReady = false;
    // P2-1 战意昂扬：随绝招尽数倾注（combat.js 已按层加成伤害），倾注后清零
    state.zhanYiOverflow = 0;
    return { totalPower: totalPower, bonus: bonus, overflow: overflow };
  }

  /**
   * 受击处理：可能清零战意
   * @param {Object} state - 战斗资源状态
   * @param {number} oldHp - 受击前血量
   * @param {number} newHp - 受击后血量
   * @returns {boolean} 是否清零了战意
   */
  function onHit(state, oldHp, newHp) {
    if (!state) return false;
    if ((newHp || 0) >= (oldHp || 0)) return false;  // 未受击
    if ((state.zhanYi || 0) <= 0) return false;      // 无意可清

    // 防御型法宝护体
    if ((state.keepZhanYiBuff || 0) > 0) {
      state.keepZhanYiBuff = Math.max(0, state.keepZhanYiBuff - 1);
      return false;
    }

    // 隐道劫印概率保留
    const keepChance = state.keepZhanYiChance || 0;
    if (keepChance > 0 && Math.random() < keepChance) {
      return false;
    }

    state.zhanYi = 0;
    return true;
  }

  /**
   * 计算战意伤害加成
   * @param {Object} state - 战斗资源状态
   * @returns {number} 伤害加成倍率
   */
  function getZhanYiDamageBonus(state) {
    if (!state) return 1;
    return 1 + (state.zhanYi || 0) * (DEFAULT_CONFIG.zhanYiDamagePerLayer);
  }

  /**
   * 法宝协同：使用法宝后调整战意/经力
   * @param {Object} state - 战斗资源状态
   * @param {Object} eff - 法宝效果
   * @returns {Object} 调整结果
   */
  function onTreasureUse(state, eff) {
    if (!state || !eff) return {};
    const result = {};

    // 攻击型法宝：战意+2；已满则溢出攒「昂扬」层（P2-1 满而不溢）
    if (eff.dmgPct || eff.dmgFlat) {
      const old = state.zhanYi || 0;
      const max = state.zhanYiMax || 1;
      if (old >= max) {
        state.zhanYiOverflow = Math.min(3, (state.zhanYiOverflow || 0) + 1);
        result.zhanYiOverflow = state.zhanYiOverflow;
      } else {
        state.zhanYi = Math.min(max, old + 2);
        result.zhanYiGained = state.zhanYi - old;
      }
    }

    // 诵经型法宝：经力+2；已满则溢出攒「化雨」层（P2-1 满而不溢，诵经时每层回 6% 最大气血）
    if (eff.healPct || eff.healFlat || eff.capHeal) {
      const old = state.jingLi || 0;
      const max = state.jingLiMax || 1;
      if (old >= max && state.jingLiReady) {
        state.jingLiOverflow = Math.min(3, (state.jingLiOverflow || 0) + 1);
        result.jingLiOverflow = state.jingLiOverflow;
      } else {
        state.jingLi = Math.min(max, old + 2);
        result.jingLiGained = state.jingLi - old;
        if (state.jingLi >= max && !state.jingLiReady) {
          state.jingLiReady = true;
          result.jingLiReady = true;
        }
      }
    }

    // 防御型法宝：3回合护体
    if (eff.enemyAtkDebuff || eff.enemyAtkDebuffPerm || eff.shield) {
      state.keepZhanYiBuff = (state.keepZhanYiBuff || 0) + 3;
      result.keepZhanYiBuff = state.keepZhanYiBuff;
    }

    return result;
  }

  /**
   * 读取溢流层（供 UI 展示「昂扬×N / 化雨×N」角标）
   * @param {Object} state - 战斗资源状态
   * @returns {Object} { zhanYiOverflow, jingLiOverflow }
   */
  function getOverflow(state) {
    if (!state) return { zhanYiOverflow: 0, jingLiOverflow: 0 };
    return {
      zhanYiOverflow: state.zhanYiOverflow || 0,
      jingLiOverflow: state.jingLiOverflow || 0,
    };
  }

  // 导出模块
  NDX.BattleResource = {
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    HERO_CONFIG: HERO_CONFIG,
    initConfig: initConfig,
    createState: createState,
    gainZhanYi: gainZhanYi,
    gainJingLi: gainJingLi,
    consumeForUlt: consumeForUlt,
    onHit: onHit,
    getZhanYiDamageBonus: getZhanYiDamageBonus,
    onTreasureUse: onTreasureUse,
    getOverflow: getOverflow,
  };

})();
