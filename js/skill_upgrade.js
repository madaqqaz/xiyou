// =============================================================
// skill_upgrade.js - 技能升级/进化系统
// 功能：法宝升级、法宝进化、法宝觉醒、法宝熟练度
// 加载顺序：skill_synergy.js -> skill_upgrade.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.SkillUpgrade = NDX.SkillUpgrade || {};

// =============================================================
// 一、配置
// =============================================================
NDX.SkillUpgrade.config = {
  maxLevel: 3,              // 最大等级
  upgradeDamageBonus: 0.2,  // 每级伤害加成
  upgradeCooldownReduction: 0, // 每级冷却减少
  awakeningMomentumCost: 5, // 觉醒消耗气势
  awakeningDamageMult: 2.0, // 觉醒伤害倍率
  proficiencyMax: 100,      // 熟练度上限
  proficiencyBonus: 0.05,   // 每10点熟练度加成
  enabled: true              // 是否启用
};

// =============================================================
// 二、法宝进化路线定义
// =============================================================
NDX.SkillUpgrade.EVOLUTIONS = {
  '锡杖': {
    name: '锡杖',
    stages: [
      { level: 1, name: '普通锡杖', description: '基础法器' },
      { level: 2, name: '九环锡杖', description: '镶嵌九枚金环，威力增强' },
      { level: 3, name: '达摩锡杖', description: '达摩祖师传承法器，蕴含佛力' }
    ],
    evolveCondition: '同名法宝合成升级'
  },
  '烈焰珠': {
    name: '烈焰珠',
    stages: [
      { level: 1, name: '烈焰珠', description: '蕴含火焰之力的宝珠' },
      { level: 2, name: '三昧火珠', description: '融合三昧真火，威力倍增' },
      { level: 3, name: '太阳神珠', description: '蕴含太阳真火，焚尽万物' }
    ],
    evolveCondition: '同名法宝合成升级'
  },
  '寒冰镜': {
    name: '寒冰镜',
    stages: [
      { level: 1, name: '寒冰镜', description: '散发寒气的铜镜' },
      { level: 2, name: '玄冰镜', description: '融合玄冰之力，冰冻增强' },
      { level: 3, name: '北极镜', description: '蕴含北极玄冰，冻结一切' }
    ],
    evolveCondition: '同名法宝合成升级'
  }
};

// =============================================================
// 三、核心功能
// =============================================================

// 获取法宝当前等级
NDX.SkillUpgrade.getLevel = function(treasure) {
  if (!treasure) return 1;
  return treasure.level || 1;
};

// 升级法宝
NDX.SkillUpgrade.upgrade = function(treasure) {
  if (!treasure) return null;
  
  const currentLevel = this.getLevel(treasure);
  if (currentLevel >= this.config.maxLevel) return null;
  
  treasure.level = currentLevel + 1;
  
  // 更新属性
  treasure.damage = Math.round((treasure.damage || 10) * (1 + this.config.upgradeDamageBonus));
  treasure.cooldown = Math.max(1, (treasure.cooldown || 3) - this.config.upgradeCooldownReduction);
  
  // 更新名称
  const evolution = this.EVOLUTIONS[treasure.baseName || treasure.name];
  if (evolution) {
    const stage = evolution.stages[treasure.level - 1];
    if (stage) {
      treasure.name = stage.name;
      treasure.description = stage.description;
    }
  }
  
  return treasure;
};

// 检查是否可以觉醒
NDX.SkillUpgrade.canAwaken = function(treasure, momentum) {
  if (!treasure || !this.config.enabled) return false;
  return momentum >= this.config.awakeningMomentumCost;
};

// 法宝觉醒（满气势时释放强化版技能）
NDX.SkillUpgrade.awaken = function(treasure, momentum) {
  if (!this.canAwaken(treasure, momentum)) return null;
  
  return {
    name: treasure.name + '·觉醒',
    damage: Math.round((treasure.damage || 10) * this.config.awakeningDamageMult),
    cooldown: treasure.cooldown,
    effect: '觉醒版：伤害×' + this.config.awakeningDamageMult + '，效果增强',
    momentumCost: this.config.awakeningMomentumCost
  };
};

// 获取法宝熟练度
NDX.SkillUpgrade.getProficiency = function(treasure) {
  if (!treasure) return 0;
  return treasure.proficiency || 0;
};

// 增加法宝熟练度
NDX.SkillUpgrade.addProficiency = function(treasure, amount) {
  if (!treasure || !this.config.enabled) return 0;
  
  treasure.proficiency = Math.min(this.config.proficiencyMax, (treasure.proficiency || 0) + (amount || 1));
  return treasure.proficiency;
};

// 获取熟练度加成
NDX.SkillUpgrade.getProficiencyBonus = function(treasure) {
  if (!treasure || !this.config.enabled) return 0;
  
  const proficiency = this.getProficiency(treasure);
  return Math.floor(proficiency / 10) * this.config.proficiencyBonus;
};

// 计算法宝总伤害（基础+等级+熟练度）
NDX.SkillUpgrade.calcTotalDamage = function(treasure) {
  if (!treasure) return 0;
  
  let damage = treasure.damage || 10;
  
  // 等级加成
  const level = this.getLevel(treasure);
  damage = Math.round(damage * (1 + (level - 1) * this.config.upgradeDamageBonus));
  
  // 熟练度加成
  damage = Math.round(damage * (1 + this.getProficiencyBonus(treasure)));
  
  return damage;
};

// 合成两个同名法宝
NDX.SkillUpgrade.merge = function(treasure1, treasure2) {
  if (!treasure1 || !treasure2) return null;
  
  // 检查是否同名
  const baseName1 = treasure1.baseName || treasure1.name;
  const baseName2 = treasure2.baseName || treasure2.name;
  if (baseName1 !== baseName2) return null;
  
  // 取等级较高的作为基础
  const base = treasure1.level >= treasure2.level ? treasure1 : treasure2;
  const material = treasure1.level >= treasure2.level ? treasure2 : treasure1;
  
  // 升级
  const result = this.upgrade(base);
  if (result) {
    // 继承熟练度
    result.proficiency = Math.min(
      this.config.proficiencyMax,
      (treasure1.proficiency || 0) + (treasure2.proficiency || 0)
    );
  }
  
  return result || base;
};
