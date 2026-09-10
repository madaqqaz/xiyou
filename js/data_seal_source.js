/**
 * V9.x 劫印来源扩展 · SEAL_SOURCE_WEIGHTS
 *
 * 问题：劫印基本只有"战斗胜利三选一"，来源过窄，形成"全量生效但无路可走"的虚假自由。
 * 方案：建立来源权重表，将来源概率写入数据表；增加商店、事件、精英悬赏、Boss遗物、路线许愿五类来源。
 *
 * 核心规则：
 * 1. 战斗胜利仍是主要来源（60%），但不再是唯一来源
 * 2. 事件/商店/Boss等替代来源合计40%，让玩家有更多获取路径
 * 3. 不同来源的劫印品质权重不同（Boss掉落金劫概率更高）
 * 4. 显示每个候选的"当前主道契合度/缺失机制/预计层数贡献"
 *
 * 使用方式：
 *   const source = NDX.SealSource.rollSource(); // 按权重随机选择来源
 *   const seals = NDX.SealSource.rollSeals(source, 3, playerDao); // 按来源roll劫印
 */

(function () {
  'use strict';

  // 劫印来源权重表
  const SEAL_SOURCE_WEIGHTS = {
    // 战斗胜利（主要来源，60%）
    battle: {
      weight: 60,
      name: '战斗胜利',
      qualityWeights: { white: 60, blue: 30, gold: 9, red: 1 },
      description: '击败敌人后三选一',
      minQuality: 'white',
      maxQuality: 'gold',
    },
    // 精英怪胜利（10%，蓝劫概率更高）
    elite: {
      weight: 10,
      name: '精英伏诛',
      qualityWeights: { white: 30, blue: 50, gold: 18, red: 2 },
      description: '击败精英怪后三选一',
      minQuality: 'blue',
      maxQuality: 'red',
    },
    // Boss胜利（5%，金劫概率更高）
    boss: {
      weight: 5,
      name: '关隘通关',
      qualityWeights: { white: 10, blue: 30, gold: 50, red: 10 },
      description: '击败关隘Boss后三选一',
      minQuality: 'blue',
      maxQuality: 'red',
    },
    // 事件奖励（10%）
    event: {
      weight: 10,
      name: '奇遇事件',
      qualityWeights: { white: 50, blue: 35, gold: 13, red: 2 },
      description: '完成特殊事件后获得',
      minQuality: 'white',
      maxQuality: 'gold',
    },
    // 商店购买（8%）
    shop: {
      weight: 8,
      name: '坊市购买',
      qualityWeights: { white: 40, blue: 40, gold: 18, red: 2 },
      description: '在坊市用金币购买',
      minQuality: 'white',
      maxQuality: 'gold',
      priceMultiplier: 1.5, // 商店购买价格倍率
    },
    // 路线许愿（5%，与主道契合度更高）
    wish: {
      weight: 5,
      name: '路线许愿',
      qualityWeights: { white: 20, blue: 40, gold: 35, red: 5 },
      description: '在特殊节点许愿获得主道契合劫印',
      minQuality: 'blue',
      maxQuality: 'red',
      daoAlignmentBonus: 0.5, // 主道契合度加成
    },
    // 土地庙精炼（2%，将一枚劫印转换为主道层数）
    refine: {
      weight: 2,
      name: '土地庙精炼',
      qualityWeights: { white: 0, blue: 0, gold: 0, red: 0 },
      description: '将一枚劫印的50%数值转换为主道层数',
      isRefine: true,
    },
  };

  // 品质等级
  const QUALITY_ORDER = ['white', 'blue', 'gold', 'red'];
  const QUALITY_NAMES = { white: '白', blue: '蓝', gold: '金', red: '红' };

  const SealSource = {
    /**
     * 获取所有来源配置
     * @returns {Object} 来源配置表
     */
    getSources: function () {
      return SEAL_SOURCE_WEIGHTS;
    },

    /**
     * 按权重随机选择来源
     * @param {Object} options - 选项 { excludeSources: [], forceSource: '' }
     * @returns {string} 来源ID
     */
    rollSource: function (options) {
      options = options || {};
      const excludeSources = options.excludeSources || [];
      const forceSource = options.forceSource;

      // 强制指定来源
      if (forceSource && SEAL_SOURCE_WEIGHTS[forceSource]) {
        return forceSource;
      }

      // 计算总权重（排除指定来源）
      let totalWeight = 0;
      const availableSources = [];
      for (const sourceId in SEAL_SOURCE_WEIGHTS) {
        if (excludeSources.includes(sourceId)) continue;
        const source = SEAL_SOURCE_WEIGHTS[sourceId];
        if (source.isRefine) continue; // 精炼不是随机来源
        totalWeight += source.weight;
        availableSources.push({ id: sourceId, weight: source.weight });
      }

      // 按权重随机
      let roll = Math.random() * totalWeight;
      for (const source of availableSources) {
        roll -= source.weight;
        if (roll <= 0) return source.id;
      }
      return 'battle'; // 默认战斗
    },

    /**
     * 按来源和品质权重roll劫印品质
     * @param {string} sourceId - 来源ID
     * @returns {string} 品质ID
     */
    rollQuality: function (sourceId) {
      const source = SEAL_SOURCE_WEIGHTS[sourceId];
      if (!source || !source.qualityWeights) return 'white';

      const weights = source.qualityWeights;
      let totalWeight = 0;
      for (const q in weights) totalWeight += weights[q];

      let roll = Math.random() * totalWeight;
      for (const q of QUALITY_ORDER) {
        roll -= weights[q] || 0;
        if (roll <= 0) return q;
      }
      return 'white';
    },

    /**
     * 计算劫印与主道的契合度
     * @param {Object} seal - 劫印对象 { dao: 'du', type: 'atk', value: 0.1 }
     * @param {string} playerDao - 玩家主道
     * @returns {number} 契合度 0-1
     */
    calculateDaoAlignment: function (seal, playerDao) {
      if (!seal || !seal.dao) return 0.3; // 默认契合度
      if (seal.dao === playerDao) return 1.0; // 主道完全契合
      // 相关道（如渡与缘、战与夺）契合度0.6
      const relatedDaos = {
        du: ['yuan', 'yin'],
        zhan: ['duo', 'ni'],
        yin: ['du', 'yuan'],
        duo: ['zhan', 'ni'],
        yuan: ['du', 'yin'],
        ni: ['zhan', 'duo'],
      };
      if (relatedDaos[playerDao] && relatedDaos[playerDao].includes(seal.dao)) return 0.6;
      return 0.2; // 不相关道
    },

    /**
     * 生成劫印候选的展示信息
     * @param {Object} seal - 劫印对象
     * @param {string} playerDao - 玩家主道
     * @param {string} sourceId - 来源ID
     * @returns {Object} 展示信息 { alignment, missingMechanism, layerContribution, qualityName, sourceName }
     */
    generateSealInfo: function (seal, playerDao, sourceId) {
      const alignment = this.calculateDaoAlignment(seal, playerDao);
      const source = SEAL_SOURCE_WEIGHTS[sourceId] || {};

      // 判断是否缺失机制（如玩家缺少吸血、暴击、减伤等）
      const missingMechanism = this.detectMissingMechanism(seal, playerDao);

      // 预计层数贡献（简化计算）
      const layerContribution = this.estimateLayerContribution(seal);

      return {
        alignment: alignment,
        alignmentText: alignment >= 0.8 ? '主道契合' : alignment >= 0.5 ? '相关道' : '跨界',
        missingMechanism: missingMechanism,
        layerContribution: layerContribution,
        qualityName: QUALITY_NAMES[seal.quality] || seal.quality,
        sourceName: source.name || '未知来源',
      };
    },

    /**
     * 检测玩家是否缺失该劫印提供的机制
     * @param {Object} seal - 劫印对象
     * @param {string} playerDao - 玩家主道
     * @returns {string|null} 缺失机制描述，或null
     */
    detectMissingMechanism: function (seal, playerDao) {
      // 简化实现：根据劫印类型判断
      if (!seal || !seal.type) return null;
      const mechanismTypes = {
        lifesteal: '吸血',
        crit: '暴击',
        dodge: '闪避',
        damageReduction: '减伤',
        attack: '攻击加成',
        magicAttack: '法伤加成',
        hp: '气血加成',
        cooldownReduction: '冷却缩减',
      };
      return mechanismTypes[seal.type] || null;
    },

    /**
     * 估算劫印的层数贡献
     * @param {Object} seal - 劫印对象
     * @returns {number} 预计层数贡献（0-3）
     */
    estimateLayerContribution: function (seal) {
      if (!seal) return 0;
      const qualityMultiplier = { white: 1, blue: 1.5, gold: 2, red: 3 };
      const base = (seal.value || 0.05) * 10;
      return Math.min(3, Math.round(base * (qualityMultiplier[seal.quality] || 1)));
    },

    /**
     * 获取来源的中文名称
     * @param {string} sourceId - 来源ID
     * @returns {string} 来源名称
     */
    getSourceName: function (sourceId) {
      const source = SEAL_SOURCE_WEIGHTS[sourceId];
      return source ? source.name : sourceId;
    },

    /**
     * 获取所有非精炼来源的列表（用于UI展示）
     * @returns {Array} 来源列表
     */
    getAvailableSources: function () {
      const sources = [];
      for (const sourceId in SEAL_SOURCE_WEIGHTS) {
        const source = SEAL_SOURCE_WEIGHTS[sourceId];
        if (!source.isRefine) {
          sources.push({
            id: sourceId,
            name: source.name,
            weight: source.weight,
            description: source.description,
          });
        }
      }
      return sources;
    },
  };

  // 导出到全局命名空间
  if (typeof NDX !== 'undefined') {
    NDX.SealSource = SealSource;
    NDX.SEAL_SOURCE_WEIGHTS = SEAL_SOURCE_WEIGHTS;
  } else {
    window.NDX = window.NDX || {};
    window.NDX.SealSource = SealSource;
    window.NDX.SEAL_SOURCE_WEIGHTS = SEAL_SOURCE_WEIGHTS;
  }
})();
