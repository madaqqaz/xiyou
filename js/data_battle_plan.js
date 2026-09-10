/**
 * V9.x 战斗正确性闭环 · BattlePlan 确定性快照回放
 *
 * 定义：固定随机种子、玩家输入、敌人行为索引、每回合可用的操作点列表及版本号。
 * 目的：解决"预模拟 + 回放"与限时QTE/临场法宝/爆发干预混合运行时的正确性风险。
 *
 * 核心规则：
 * 1. 任何"后来发生的干预"，都只能基于预模拟中已预留的确定性决策点改变结果；
 *    它不能默默改写已经完成的历史。
 * 2. 同一 (seed, plan, interventionList) 必须 100% 复现最终 roundsDetail。
 * 3. 禁止从 Math.random()、当前时间和 DOM 状态读取不可重放信息。
 *
 * 使用方式：
 *   const plan = NDX.BattlePlan.create({ hero: 'tangseng', monsterId: 'liuhong', seed: 12345 });
 *   const res = NDX.calcCombat(player, monster, plan);
 *   // 干预后：
 *   NDX.BattlePlan.applyIntervention(plan, roundIndex, { type: 'treasure', id: 'zijinboyu' });
 *   const res2 = NDX.calcCombat(player, monster, plan);
 *   // 差分断言：
 *   NDX.BattlePlan.assertDeterministic(res, res2, ['timestamp']);
 */

(function () {
  'use strict';

  const BattlePlan = {
    /**
     * 创建一个 BattlePlan 实例
     * @param {Object} opts - 配置项
     * @param {string} opts.hero - 英雄ID
     * @param {string} opts.monsterId - 怪物ID
     * @param {number} opts.seed - 随机种子（可选，默认随机生成）
     * @param {number} opts.maxRounds - 最大回合数（可选，默认100）
     * @returns {Object} BattlePlan 实例
     */
    create: function (opts) {
      opts = opts || {};
      const seed = opts.seed != null ? opts.seed : Math.floor(Math.random() * 1000000);
      return {
        version: 1,
        hero: opts.hero || 'tangseng',
        monsterId: opts.monsterId || '',
        seed: seed,
        maxRounds: opts.maxRounds || 100,
        createdAt: Date.now(),
        interventions: [],      // 干预列表：{ roundIndex, type, id, params }
        operationPoints: [],    // 可用操作点列表：{ roundIndex, type, available }
        inputLog: [],           // 玩家输入日志
        rngState: seed,         // RNG状态（用于确定性随机数生成）
      };
    },

    /**
     * 确定性随机数生成器（基于种子的LCG）
     * 禁止使用 Math.random()，所有战斗内随机必须通过此函数
     * @param {Object} plan - BattlePlan 实例
     * @returns {number} 0-1 之间的随机数
     */
    random: function (plan) {
      // LCG 线性同余生成器：确定性、可复现
      plan.rngState = (plan.rngState * 1103515245 + 12345) & 0x7fffffff;
      return plan.rngState / 0x7fffffff;
    },

    /**
     * 记录干预操作
     * @param {Object} plan - BattlePlan 实例
     * @param {number} roundIndex - 回合索引（0-based）
     * @param {Object} intervention - 干预内容 { type, id, params }
     */
    applyIntervention: function (plan, roundIndex, intervention) {
      plan.interventions.push({
        roundIndex: roundIndex,
        type: intervention.type || 'unknown',
        id: intervention.id || '',
        params: intervention.params || {},
        timestamp: Date.now(),
      });
      plan.version += 1; // 版本号递增，标记计划已改变
    },

    /**
     * 记录玩家输入
     * @param {Object} plan - BattlePlan 实例
     * @param {string} inputType - 输入类型（attack/chant/ultimate/treasure/shipo/burst/guard）
     * @param {Object} params - 输入参数
     */
    logInput: function (plan, inputType, params) {
      plan.inputLog.push({
        round: plan.inputLog.length + 1,
        type: inputType,
        params: params || {},
        timestamp: Date.now(),
      });
    },

    /**
     * 注册可用操作点
     * @param {Object} plan - BattlePlan 实例
     * @param {number} roundIndex - 回合索引（0-based）
     * @param {string} opType - 操作点类型（telegraph/enrage/lowhp/routine）
     */
    registerOperationPoint: function (plan, roundIndex, opType) {
      plan.operationPoints.push({
        roundIndex: roundIndex,
        type: opType,
        available: true,
        used: false,
      });
    },

    /**
     * 差分断言：比较两个战斗结果，验证确定性
     * 除指定忽略字段外，所有回合字段必须完全一致
     * @param {Object} res1 - 第一次战斗结果
     * @param {Object} res2 - 第二次战斗结果
     * @param {Array<string>} ignoreFields - 忽略的字段列表（如 ['timestamp']）
     * @returns {Object} { pass: boolean, diffs: Array }
     */
    assertDeterministic: function (res1, res2, ignoreFields) {
      ignoreFields = ignoreFields || [];
      const diffs = [];

      // 比较基本字段
      const baseFields = ['win', 'lose', 'total', 'maxHp', 'maxMHp'];
      for (const field of baseFields) {
        if (res1[field] !== res2[field]) {
          diffs.push({ field: field, expected: res1[field], actual: res2[field] });
        }
      }

      // 比较回合详情
      if (res1.roundsDetail && res2.roundsDetail) {
        const len = Math.min(res1.roundsDetail.length, res2.roundsDetail.length);
        for (let i = 0; i < len; i++) {
          const r1 = res1.roundsDetail[i];
          const r2 = res2.roundsDetail[i];
          for (const key in r1) {
            if (ignoreFields.includes(key)) continue;
            if (JSON.stringify(r1[key]) !== JSON.stringify(r2[key])) {
              diffs.push({
                field: `roundsDetail[${i}].${key}`,
                expected: r1[key],
                actual: r2[key],
              });
            }
          }
        }
        if (res1.roundsDetail.length !== res2.roundsDetail.length) {
          diffs.push({
            field: 'roundsDetail.length',
            expected: res1.roundsDetail.length,
            actual: res2.roundsDetail.length,
          });
        }
      }

      return {
        pass: diffs.length === 0,
        diffs: diffs,
      };
    },

    /**
     * 序列化 BattlePlan 为 JSON（用于存档和回放）
     * @param {Object} plan - BattlePlan 实例
     * @returns {string} JSON 字符串
     */
    serialize: function (plan) {
      return JSON.stringify({
        version: plan.version,
        hero: plan.hero,
        monsterId: plan.monsterId,
        seed: plan.seed,
        maxRounds: plan.maxRounds,
        interventions: plan.interventions,
        operationPoints: plan.operationPoints,
        inputLog: plan.inputLog,
      });
    },

    /**
     * 从 JSON 反序列化 BattlePlan
     * @param {string} json - JSON 字符串
     * @returns {Object} BattlePlan 实例
     */
    deserialize: function (json) {
      const data = JSON.parse(json);
      return {
        version: data.version,
        hero: data.hero,
        monsterId: data.monsterId,
        seed: data.seed,
        maxRounds: data.maxRounds,
        createdAt: Date.now(),
        interventions: data.interventions || [],
        operationPoints: data.operationPoints || [],
        inputLog: data.inputLog || [],
        rngState: data.seed,
      };
    },
  };

  // 导出到全局命名空间
  if (typeof NDX !== 'undefined') {
    NDX.BattlePlan = BattlePlan;
  } else {
    window.NDX = window.NDX || {};
    window.NDX.BattlePlan = BattlePlan;
  }
})();
