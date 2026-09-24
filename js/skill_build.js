// =============================================================
// skill_build.js - 技能流派构筑系统（Build Diversity）
// 功能：技能标签系统、标签协同、流派核心法宝、流派成就
// 加载顺序：skill_cooldown_ui.js -> skill_build.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.SkillBuild = NDX.SkillBuild || {};

// =============================================================
// 一、技能标签定义
// =============================================================
NDX.SkillBuild.TAGS = {
  FIRE: 'fire',           // 火系
  WATER: 'water',         // 水系
  THUNDER: 'thunder',     // 雷系
  PHYSICAL: 'physical',   // 物理
  HEAL: 'heal',           // 治疗
  DEFENSE: 'defense',     // 防御
  CURSE: 'curse',         // 诅咒
  BUFF: 'buff'            // 增益
};

// =============================================================
// 二、标签协同效果
// =============================================================
NDX.SkillBuild.TAG_SYNERGY = {
  fire: {
    name: '火系',
    color: '#ff4400',
    effects: [
      { count: 2, bonus: '火系伤害+15%', atkBonus: 0.15 },
      { count: 3, bonus: '火系伤害+30%，灼烧DOT+50%', atkBonus: 0.30, dotBonus: 0.50 },
      { count: 4, bonus: '火系伤害+50%，暴击率+10%', atkBonus: 0.50, critBonus: 0.10 }
    ]
  },
  water: {
    name: '水系',
    color: '#0088ff',
    effects: [
      { count: 2, bonus: '冰冻概率+20%', freezeBonus: 0.20 },
      { count: 3, bonus: '冰冻概率+40%，减速效果+30%', freezeBonus: 0.40, slowBonus: 0.30 },
      { count: 4, bonus: '冰冻概率+60%，冰冻伤害+50%', freezeBonus: 0.60, freezeDamageBonus: 0.50 }
    ]
  },
  thunder: {
    name: '雷系',
    color: '#aa00ff',
    effects: [
      { count: 2, bonus: '连击伤害+10%', comboBonus: 0.10 },
      { count: 3, bonus: '连击伤害+25%，麻痹概率+15%', comboBonus: 0.25, paralyzeBonus: 0.15 },
      { count: 4, bonus: '连击伤害+40%，麻痹概率+30%，麻痹时伤害+30%', comboBonus: 0.40, paralyzeBonus: 0.30, paralyzeDamageBonus: 0.30 }
    ]
  },
  physical: {
    name: '物理',
    color: '#cccccc',
    effects: [
      { count: 2, bonus: '物理伤害+15%', physBonus: 0.15 },
      { count: 3, bonus: '物理伤害+30%，吸血+5%', physBonus: 0.30, lifestealBonus: 0.05 },
      { count: 4, bonus: '物理伤害+50%，暴击伤害+25%', physBonus: 0.50, critDamageBonus: 0.25 }
    ]
  },
  heal: {
    name: '治疗',
    color: '#00ff88',
    effects: [
      { count: 2, bonus: '治疗效果+20%', healBonus: 0.20 },
      { count: 3, bonus: '治疗效果+40%，每回合恢复2%最大气血', healBonus: 0.40, regenBonus: 0.02 },
      { count: 4, bonus: '治疗效果+60%，受到致命伤害时恢复30%气血（每场1次）', healBonus: 0.60, reviveBonus: 0.30 }
    ]
  },
  defense: {
    name: '防御',
    color: '#8888ff',
    effects: [
      { count: 2, bonus: '防御+15%', defBonus: 0.15 },
      { count: 3, bonus: '防御+30%，反伤+10%', defBonus: 0.30, reflectBonus: 0.10 },
      { count: 4, bonus: '防御+50%，反伤+20%，护盾效果+30%', defBonus: 0.50, reflectBonus: 0.20, shieldBonus: 0.30 }
    ]
  }
};

// =============================================================
// 三、流派核心法宝定义
// =============================================================
NDX.SkillBuild.CORE_TREASURES = {
  fireBurst: {
    name: '烈焰珠',
    tag: 'fire',
    buildName: '火系爆发流',
    description: '以烈焰珠为核心，叠加火系伤害和灼烧DOT，追求极致爆发',
    recommendedTreasures: ['烈焰珠', '火尖枪', '火云扇', '三昧火'],
    playstyle: '快速叠加灼烧DOT，在敌人高灼烧时释放烈焰珠造成爆发伤害'
  },
  waterControl: {
    name: '寒冰镜',
    tag: 'water',
    buildName: '水系控制流',
    description: '以寒冰镜为核心，通过冰冻和减速控制敌人，逐步消耗',
    recommendedTreasures: ['寒冰镜', '玄冰盾', '冻神珠', '甘霖露'],
    playstyle: '先冰冻控制，再用其他水系法宝造成碎冰额外伤害'
  },
  thunderCombo: {
    name: '紫电锤',
    tag: 'thunder',
    buildName: '雷系连击流',
    description: '以紫电锤为核心，通过高频连击和麻痹效果压制敌人',
    recommendedTreasures: ['紫电锤', '雷公凿', '闪电鞭', '五雷符'],
    playstyle: '快速释放法宝叠加连击，利用麻痹效果打断敌人技能'
  },
  physLifesteal: {
    name: '嗜血刃',
    tag: 'physical',
    buildName: '物理吸血流',
    description: '以嗜血刃为核心，通过高暴击和吸血持续作战',
    recommendedTreasures: ['嗜血刃', '破甲枪', '暴击符', '狂战斧'],
    playstyle: '堆暴击和攻击，通过吸血保持血量，持续输出'
  },
  defReflect: {
    name: '金刚盾',
    tag: 'defense',
    buildName: '防御反伤流',
    description: '以金刚盾为核心，通过高防御和反伤消耗敌人',
    recommendedTreasures: ['金刚盾', '反伤甲', '铁布衫', '金钟罩'],
    playstyle: '堆防御和反伤，用护盾吸收伤害，通过反伤消耗敌人'
  }
};

// =============================================================
// 四、核心功能
// =============================================================

// 计算玩家当前的标签分布
NDX.SkillBuild.calcTagDistribution = function(treasures) {
  const distribution = {};
  if (!treasures || !Array.isArray(treasures)) return distribution;
  
  for (const t of treasures) {
    if (t && t.tags && Array.isArray(t.tags)) {
      for (const tag of t.tags) {
        distribution[tag] = (distribution[tag] || 0) + 1;
      }
    }
  }
  return distribution;
};

// 获取当前激活的标签协同效果
NDX.SkillBuild.getActiveSynergies = function(treasures) {
  const distribution = this.calcTagDistribution(treasures);
  const activeSynergies = [];
  
  for (const tag in distribution) {
    const count = distribution[tag];
    const synergy = this.TAG_SYNERGY[tag];
    if (synergy) {
      for (const effect of synergy.effects) {
        if (count >= effect.count) {
          activeSynergies.push({
            tag: tag,
            tagName: synergy.name,
            color: synergy.color,
            count: count,
            bonus: effect.bonus,
            effect: effect
          });
        }
      }
    }
  }
  
  return activeSynergies;
};

// 计算总属性加成
NDX.SkillBuild.calcTotalBonus = function(treasures) {
  const synergies = this.getActiveSynergies(treasures);
  const totalBonus = {
    atkBonus: 0,
    physBonus: 0,
    magicBonus: 0,
    defBonus: 0,
    critBonus: 0,
    critDamageBonus: 0,
    lifestealBonus: 0,
    healBonus: 0,
    reflectBonus: 0,
    comboBonus: 0,
    dotBonus: 0
  };
  
  for (const synergy of synergies) {
    const effect = synergy.effect;
    for (const key in effect) {
      if (key !== 'count' && key !== 'bonus' && typeof effect[key] === 'number') {
        totalBonus[key] = (totalBonus[key] || 0) + effect[key];
      }
    }
  }
  
  return totalBonus;
};

// 检测当前流派
NDX.SkillBuild.detectBuild = function(treasures) {
  const distribution = this.calcTagDistribution(treasures);
  
  for (const buildKey in this.CORE_TREASURES) {
    const build = this.CORE_TREASURES[buildKey];
    // 检查是否有核心法宝
    const hasCore = treasures.some(t => t && t.name === build.name);
    if (hasCore) {
      // 检查标签数量是否足够
      const tagCount = distribution[build.tag] || 0;
      if (tagCount >= 2) {
        return {
          buildKey: buildKey,
          buildName: build.buildName,
          coreTreasure: build.name,
          tagCount: tagCount,
          description: build.description,
          playstyle: build.playstyle
        };
      }
    }
  }
  
  return null;
};

// 获取流派推荐法宝
NDX.SkillBuild.getRecommendedTreasures = function(buildKey) {
  const build = this.CORE_TREASURES[buildKey];
  return build ? build.recommendedTreasures : [];
};
