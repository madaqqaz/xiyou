// =============================================================
// skill_synergy.js - 技能相互作用系统（Synergy）
// 功能：技能联动、技能抵消、技能强化、技能共鸣
// 加载顺序：skill_timing.js -> skill_synergy.js
// =============================================================

window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.SkillSynergy = NDX.SkillSynergy || {};

// =============================================================
// 一、技能联动定义
// =============================================================
NDX.SkillSynergy.LINKS = [
  {
    id: 'fire_ice_break',
    name: '冰火碎冰',
    trigger: { first: 'ice', second: 'fire' },
    condition: '敌人处于冰冻状态时，火系技能造成额外伤害',
    effect: { extraDamage: 0.5, damageType: 'fire' },
    description: '寒冰镜冰冻敌人后，烈焰珠造成50%额外碎冰伤害'
  },
  {
    id: 'thunder_paralyze_chain',
    name: '雷链麻痹',
    trigger: { first: 'thunder', second: 'thunder' },
    condition: '连续释放雷系技能时，第二次有概率麻痹敌人',
    effect: { paralyzeChance: 0.3, paralyzeDuration: 1 },
    description: '紫电锤后接雷公凿，30%概率麻痹敌人1回合'
  },
  {
    id: 'physical_bleed_finish',
    name: '流血终结',
    trigger: { first: 'physical', second: 'physical' },
    condition: '敌人处于流血状态时，物理技能造成额外伤害',
    effect: { extraDamage: 0.3, damageType: 'physical' },
    description: '嗜血刃造成流血后，破甲枪造成30%额外伤害'
  },
  {
    id: 'heal_defense_wall',
    name: '铁壁回血',
    trigger: { first: 'defense', second: 'heal' },
    condition: '有护盾时，治疗效果提升',
    effect: { healBonus: 0.3 },
    description: '金刚盾护盾存在时，甘霖露治疗效果+30%'
  },
  {
    id: 'curse_defense_punish',
    name: '诅咒反伤',
    trigger: { first: 'curse', second: 'defense' },
    condition: '敌人被诅咒时，反伤效果提升',
    effect: { reflectBonus: 0.2 },
    description: '诅咒敌人后，反伤甲反伤+20%'
  }
];

// =============================================================
// 二、技能抵消定义
// =============================================================
NDX.SkillSynergy.COUNTERS = [
  {
    id: 'purify_counter',
    name: '净化抵消',
    skill: '清心咒',
    counters: ['shield', 'buff', 'curse'],
    effect: '解除敌人的护盾/增益/诅咒效果',
    description: '清心咒可以解除敌人的护盾和增益效果'
  },
  {
    id: 'dispel_magic',
    name: '驱散魔法',
    skill: '破魔符',
    counters: ['magic_shield', 'magic_buff'],
    effect: '驱散敌人的魔法护盾和魔法增益',
    description: '破魔符可以驱散敌人的魔法效果'
  }
];

// =============================================================
// 三、技能强化定义
// =============================================================
NDX.SkillSynergy.BUFFS = [
  {
    id: 'charge_skill',
    name: '蓄力强化',
    skill: '蓄力诀',
    effect: { nextSkillDamageBonus: 0.5 },
    duration: 1,
    description: '蓄力诀使下一个法宝伤害+50%'
  },
  {
    id: 'focus_skill',
    name: '专注强化',
    skill: '专注符',
    effect: { nextSkillCritBonus: 0.3 },
    duration: 1,
    description: '专注符使下一个法宝暴击率+30%'
  },
  {
    id: 'haste_skill',
    name: '急速强化',
    skill: '急速诀',
    effect: { cooldownReduction: 1 },
    duration: 2,
    description: '急速诀使接下来2回合法宝冷却-1'
  }
];

// =============================================================
// 四、技能共鸣定义
// =============================================================
NDX.SkillSynergy.RESONANCES = [
  {
    id: 'taishang_dual',
    name: '太上双修',
    treasures: ['紫金葫芦', '羊脂玉瓶'],
    effect: { momentumRegen: 1, regenInterval: 2 },
    description: '同时装备紫金葫芦和羊脂玉瓶，每2回合自动恢复1点气势'
  },
  {
    id: 'buddha_trio',
    name: '佛门三宝',
    treasures: ['九环锡杖', '锦襕袈裟', '紫金钵盂'],
    effect: { healBonus: 0.2, defBonus: 0.15 },
    description: '同时装备佛门三件套，治疗+20%，防御+15%'
  },
  {
    id: 'demon_pair',
    name: '魔道双煞',
    treasures: ['嗜血刃', '噬魂幡'],
    effect: { lifestealBonus: 0.1, atkBonus: 0.1 },
    description: '同时装备嗜血刃和噬魂幡，吸血+10%，攻击+10%'
  }
];

// =============================================================
// 五、核心功能
// =============================================================

// 检查技能联动
NDX.SkillSynergy.checkLink = function(skillTag, enemyDebuffs, lastSkillTag) {
  if (!skillTag || !lastSkillTag) return null;
  
  for (const link of this.LINKS) {
    if (link.trigger.first === lastSkillTag && link.trigger.second === skillTag) {
      // 检查条件
      if (link.condition.includes('冰冻') && !enemyDebuffs.freeze) continue;
      if (link.condition.includes('流血') && !enemyDebuffs.bleed) continue;
      
      return link;
    }
  }
  return null;
};

// 应用技能联动效果
NDX.SkillSynergy.applyLink = function(link, baseDamage) {
  if (!link || !link.effect) return baseDamage;
  
  let damage = baseDamage;
  
  if (link.effect.extraDamage) {
    damage = Math.round(damage * (1 + link.effect.extraDamage));
  }
  
  return {
    damage: damage,
    linkName: link.name,
    effect: link.effect
  };
};

// 检查技能共鸣
NDX.SkillSynergy.checkResonance = function(treasures) {
  if (!treasures || !Array.isArray(treasures)) return [];
  
  const activeResonances = [];
  const treasureNames = treasures.map(t => t && t.name).filter(n => n);
  
  for (const resonance of this.RESONANCES) {
    const hasAll = resonance.treasures.every(t => treasureNames.includes(t));
    if (hasAll) {
      activeResonances.push(resonance);
    }
  }
  
  return activeResonances;
};

// 计算共鸣总加成
NDX.SkillSynergy.calcResonanceBonus = function(treasures) {
  const resonances = this.checkResonance(treasures);
  const totalBonus = {
    atkBonus: 0,
    defBonus: 0,
    healBonus: 0,
    lifestealBonus: 0,
    momentumRegen: 0
  };
  
  for (const r of resonances) {
    if (r.effect.atkBonus) totalBonus.atkBonus += r.effect.atkBonus;
    if (r.effect.defBonus) totalBonus.defBonus += r.effect.defBonus;
    if (r.effect.healBonus) totalBonus.healBonus += r.effect.healBonus;
    if (r.effect.lifestealBonus) totalBonus.lifestealBonus += r.effect.lifestealBonus;
    if (r.effect.momentumRegen) totalBonus.momentumRegen += r.effect.momentumRegen;
  }
  
  return totalBonus;
};

// 检查技能抵消
NDX.SkillSynergy.checkCounter = function(skillName, enemyEffects) {
  if (!skillName || !enemyEffects) return null;
  
  for (const counter of this.COUNTERS) {
    if (counter.skill === skillName) {
      // 检查敌人是否有可抵消的效果
      for (const effectType of counter.counters) {
        if (enemyEffects[effectType]) {
          return counter;
        }
      }
    }
  }
  return null;
};

// 检查技能强化
NDX.SkillSynergy.checkBuff = function(skillName, activeBuffs) {
  if (!skillName || !activeBuffs) return null;
  
  for (const buff of this.BUFFS) {
    if (activeBuffs[buff.id]) {
      return buff;
    }
  }
  return null;
};
