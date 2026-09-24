// =============================================================
// boss_skill_combat.js - Boss专属技能战斗逻辑
// 处理Boss专属技能的触发、效果结算、区域属性传染
// 加载顺序：boss_skills.js -> boss_skill_combat.js -> combat_part1.js
// =============================================================

// =============================================================
// 一、Boss专属技能触发逻辑
// 在怪物行为引擎决定动作后，检查是否触发专属技能
// =============================================================

// Boss专属技能冷却时间（回合数）
const BOSS_SKILL_COOLDOWN = 2;

// 检查Boss是否有专属技能，并根据当前回合和血量决定是否触发
NDX.checkBossSkillTrigger = function(monster, round, mHp, mMaxHp) {
  if (!monster || !monster.name) return null;
  const bossSkills = NDX.getBossSkills(monster.name);
  if (!bossSkills || !bossSkills.skills) return null;

  const hpR = mMaxHp > 0 ? (mHp / mMaxHp) : 1;

  // 冷却机制：检查Boss是否在冷却中
  if (monster._bossSkillCooldown && monster._bossSkillCooldown > 0) {
    monster._bossSkillCooldown--;
    return null;
  }

  // 筛选可触发的技能
  const availableSkills = bossSkills.skills.filter(skill => {
    // 阶段技能：stage=2表示血量≤50%，stage=3表示血量≤30%
    if (skill.stage === 2 && hpR > 0.50) return false;
    if (skill.stage === 3 && hpR > 0.30) return false;
    return true;
  });

  if (availableSkills.length === 0) return null;

  // 技能触发概率：基础20%，低血阶段提高（数值调优v1.1）
  // 原30%/40%/50% → 现20%/30%/40%，避免技能过于频繁
  const triggerChance = hpR <= 0.30 ? 0.40 : (hpR <= 0.50 ? 0.30 : 0.20);

  if (Math.random() > triggerChance) return null;

  // 随机选择一个技能
  const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
  
  // 设置冷却时间
  monster._bossSkillCooldown = BOSS_SKILL_COOLDOWN;
  
  return skill;
};

// =============================================================
// 二、Boss专属技能效果结算
// 根据技能类型应用不同的效果
// =============================================================

// 应用Boss专属技能效果
// 返回 { action: 修正后的怪物动作, extraEffect: 额外效果描述, pDebuffs: 新增的玩家debuff }
NDX.applyBossSkillEffect = function(skill, monster, pDebuffs, pDots, battleContext) {
  if (!skill || !skill.type) return null;

  const result = {
    action: null,
    extraEffect: null,
    newDebuffs: {},
    newDots: [],
    log: []
  };

  const effect = skill.effect || {};

  switch (skill.type) {
    // —— DOT持续伤害型 ——
    case 'dot':
      result.action = { type: 'atk' };
      if (effect.dotType) {
        result.newDebuffs[effect.dotType] = effect.turns || 3;
        result.log.push(`【${skill.name}】施加${NDX.PDB_DOT[effect.dotType]?.kind || effect.dotType}，持续${effect.turns || 3}回合`);
      }
      if (effect.defDebuff) {
        result.newDebuffs['atkDown'] = effect.turns || 3;
        result.log.push(`【${skill.name}】降低玩家防御${Math.round(effect.defDebuff * 100)}%`);
      }
      break;

    // —— 护盾型 ——
    case 'shield':
      result.action = { type: 'guard', pct: effect.absorb || 0.50 };
      if (effect.reflect) {
        result.extraEffect = { shieldReflect: effect.reflect };
        result.log.push(`【${skill.name}】开启护盾，吸收${Math.round((effect.absorb || 0.50) * 100)}%伤害，反弹${Math.round(effect.reflect * 100)}%`);
      } else {
        result.log.push(`【${skill.name}】开启护盾，吸收${Math.round((effect.absorb || 0.50) * 100)}%伤害`);
      }
      if (effect.miss) {
        result.newDebuffs['blind'] = 2;
        result.log.push(`【${skill.name}】护盾存在时玩家攻击miss${Math.round(effect.miss * 100)}%`);
      }
      break;

    // —— 缴械型 ——
    case 'disarm':
      result.action = { type: 'atk' };
      result.newDebuffs['disarm'] = effect.disarmTurns || 3;
      result.log.push(`【${skill.name}】套走玩家兵器${effect.disarmTurns || 3}回合，无法物理攻击`);
      break;

    // —— 眩晕/控制型 ——
    case 'stun':
      result.action = { type: 'heavy' };
      if (effect.stun) {
        result.newDebuffs['stun'] = effect.stun;
        result.log.push(`【${skill.name}】眩晕玩家${effect.stun}回合`);
      }
      if (effect.stunChance) {
        if (Math.random() < effect.stunChance) {
          result.newDebuffs['stun'] = effect.turns || 1;
          result.log.push(`【${skill.name}】玩家被眩晕${effect.turns || 1}回合`);
        } else {
          result.log.push(`【${skill.name}】玩家抵抗了眩晕`);
        }
      }
      break;

    // —— 闪避/致盲型 ——
    case 'debuff':
      result.action = { type: 'atk' };
      if (effect.miss) {
        result.newDebuffs['blind'] = effect.turns || 2;
        result.log.push(`【${skill.name}】玩家攻击miss${Math.round(effect.miss * 100)}%，持续${effect.turns || 2}回合`);
      }
      if (effect.atkDebuff) {
        result.newDebuffs['atkDown'] = effect.turns || 1;
        result.log.push(`【${skill.name}】玩家攻击-${Math.round(effect.atkDebuff * 100)}%，持续${effect.turns || 1}回合`);
      }
      if (effect.aoe) {
        result.extraEffect = { aoe: true };
        result.log.push(`【${skill.name}】全屏AOE`);
      }
      break;

    // —— 吸血型 ——
    case 'lifesteal':
      result.action = { type: 'atk' };
      result.extraEffect = { lifesteal: effect.lifesteal || 0.50 };
      result.log.push(`【${skill.name}】吸血攻击，吸取${Math.round((effect.lifesteal || 0.50) * 100)}%伤害为气血`);
      break;

    // —— 遁形/特殊型 ——
    case 'special':
      if (effect.vanishTurns) {
        result.action = { type: 'guard', pct: 1.0 }; // 完全闪避
        result.extraEffect = { vanish: true, nextCrit: effect.nextCrit || 2.0 };
        result.log.push(`【${skill.name}】遁形消失${effect.vanishTurns}回合，下回合出现时暴击（${effect.nextCrit || 2.0}倍伤害）`);
      }
      if (effect.swapStats) {
        result.action = { type: 'atk' };
        result.extraEffect = { swapStats: true, swapTurns: effect.turns || 1 };
        result.log.push(`【${skill.name}】与玩家交换攻防属性${effect.turns || 1}回合`);
      }
      break;

    // —— 魅惑型 ——
    case 'charm':
      result.action = { type: 'atk' };
      if (Math.random() < (effect.charmChance || 0.50)) {
        result.newDebuffs['charm'] = effect.turns || 1;
        result.log.push(`【${skill.name}】玩家被魅惑，下回合攻击自己`);
      } else {
        result.log.push(`【${skill.name}】玩家抵抗了魅惑`);
      }
      break;

    // —— 召唤型 ——
    case 'summon':
      result.action = { type: 'buff' };
      result.extraEffect = { summon: effect };
      result.log.push(`【${skill.name}】召唤分身，分身拥有本体${Math.round((effect.cloneHpPct || 0.50) * 100)}%血量和攻击`);
      break;

    // —— 终极技能型 ——
    case 'ultimate':
      result.action = { type: 'heavy' };
      if (effect.aoe) {
        result.extraEffect = { aoe: true, ultimate: true };
        result.log.push(`【${skill.name}】终极技能·全屏AOE！`);
      }
      if (effect.instantKill) {
        result.extraEffect = { instantKill: true };
        result.log.push(`【${skill.name}】终极技能·全屏秒杀级AOE！`);
      }
      if (effect.atkBuff) {
        result.extraEffect = { atkBuff: effect.atkBuff, defBuff: effect.defBuff, hpBuff: effect.hpBuff };
        result.log.push(`【${skill.name}】巨大化，攻击+${Math.round(effect.atkBuff * 100)}%，防御+${Math.round((effect.defBuff || 0) * 100)}%`);
      }
      if (effect.treasureCdAdd) {
        result.extraEffect = { treasureCdAdd: effect.treasureCdAdd };
        result.log.push(`【${skill.name}】封印玩家法宝CD+${effect.treasureCdAdd}回合`);
      }
      if (effect.sealSeals) {
        result.extraEffect = { sealSeals: true, sealTurns: effect.turns || 3 };
        result.log.push(`【${skill.name}】封印玩家劫印效果${effect.turns || 3}回合`);
      }
      if (effect.cleansePlayerBuffs) {
        result.extraEffect = { cleansePlayerBuffs: true };
        result.log.push(`【${skill.name}】净化玩家所有增益buff`);
      }
      break;

    // —— 多段攻击型 ——
    case 'multi':
      result.action = { type: 'multi', hits: effect.hits || 3 };
      if (effect.dot) {
        result.newDebuffs[effect.dot] = 2;
        result.log.push(`【${skill.name}】${effect.hits || 3}段攻击，每段附带${NDX.PDB_DOT[effect.dot]?.kind || effect.dot}`);
      } else {
        result.log.push(`【${skill.name}】${effect.hits || 3}段攻击`);
      }
      break;

    // —— 蓄力重击型 ——
    case 'heavy':
      result.action = { type: 'heavy' };
      if (effect.dmg) {
        result.extraEffect = { dmgMult: effect.dmg };
        result.log.push(`【${skill.name}】高伤害（${effect.dmg}倍）`);
      }
      if (effect.stun) {
        result.newDebuffs['stun'] = effect.stun;
        result.log.push(`【${skill.name}】眩晕玩家${effect.stun}回合`);
      }
      if (effect.atkDebuff) {
        result.newDebuffs['atkDown'] = effect.turns || 1;
        result.log.push(`【${skill.name}】玩家攻击-${Math.round(effect.atkDebuff * 100)}%，持续${effect.turns || 1}回合`);
      }
      if (effect.defDebuff) {
        result.newDebuffs['weak'] = effect.turns || 2;
        result.log.push(`【${skill.name}】破甲，玩家防御-${Math.round(effect.defDebuff * 100)}%，持续${effect.turns || 2}回合`);
      }
      break;

    // —— 防御型 ——
    case 'defensive':
      result.action = { type: 'guard', pct: effect.dr || 0.30 };
      if (effect.miss) {
        result.newDebuffs['blind'] = 1;
        result.log.push(`【${skill.name}】玩家攻击miss${Math.round(effect.miss * 100)}%`);
      }
      result.log.push(`【${skill.name}】防御姿态，减伤${Math.round((effect.dr || 0.30) * 100)}%`);
      break;

    // —— 回血型 ——
    case 'heal':
      result.action = { type: 'heal', pct: effect.healPct || 0.15 };
      result.log.push(`【${skill.name}】恢复最大血量${Math.round((effect.healPct || 0.15) * 100)}%`);
      break;

    // —— 增益型 ——
    case 'buff':
      result.action = { type: 'buff' };
      if (effect.atkBuff) {
        result.extraEffect = { atkBuffStack: effect.atkBuff, stackable: effect.stackable, maxStacks: effect.maxStacks };
        result.log.push(`【${skill.name}】攻击力+${Math.round(effect.atkBuff * 100)}%`);
      }
      break;

    // —— 被动型 ——
    case 'passive':
      // 被动技能不触发动作，只在战斗开始时应用
      result.action = { type: 'atk' };
      break;

    // —— 阶段型 ——
    case 'stage':
      // 阶段切换技能，不触发动作
      result.action = { type: 'atk' };
      break;

    default:
      result.action = { type: 'atk' };
      break;
  }

  return result;
};

// =============================================================
// 三、区域属性传染机制
// 在怪物生成时应用区域属性
// =============================================================

// 应用区域属性到小怪/精英
NDX.applyRegionAffixToMob = function(monster, act) {
  if (!monster || !act) return monster;
  const affix = NDX.getRegionAffix(act);
  if (!affix) return monster;

  monster.regionAffix = Object.assign({}, affix);
  if (!monster.tags) monster.tags = [];
  if (monster.tags.indexOf(affix.name) < 0) {
    monster.tags.push(affix.name);
  }

  // 根据区域属性类型调整怪物行为
  if (affix.miss) {
    // 致盲型区域：怪物攻击有概率附加致盲
    monster.regionDebuff = { type: 'blind', chance: 0.20, turns: 1 };
  }
  if (affix.lifesteal) {
    // 吸血型区域：怪物攻击吸血
    monster.regionLifesteal = affix.lifesteal;
  }
  if (affix.dr) {
    // 减伤型区域：怪物减伤
    monster.dr = Math.min(0.45, (monster.dr || 0) + affix.dr);
  }
  if (affix.dot) {
    // DOT型区域：怪物攻击有概率附加DOT
    monster.regionDebuff = { type: affix.dot.type, chance: 0.25, turns: affix.dot.turns || 2 };
  }
  if (affix.multi) {
    // 多段攻击型区域：怪物有概率使用多段攻击
    monster.regionMulti = affix.multi;
  }
  if (affix.atkDebuff) {
    // 减攻型区域：怪物攻击有概率附加减攻
    monster.regionDebuff = { type: 'atkDown', chance: 0.20, turns: 1 };
  }

  return monster;
};

// 在怪物攻击时应用区域属性效果
NDX.applyRegionAffixOnAttack = function(monster, pDebuffs, pDots, dealtDamage, mHp, mMaxHp) {
  if (!monster || !monster.regionAffix) return { pDebuffs, pDots, mHp, log: [] };

  const log = [];
  const affix = monster.regionAffix;

  // 区域DOT
  if (monster.regionDebuff && Math.random() < monster.regionDebuff.chance) {
    const debuffType = monster.regionDebuff.type;
    pDebuffs[debuffType] = Math.max(pDebuffs[debuffType] || 0, monster.regionDebuff.turns);
    log.push(`【区域·${affix.name}】施加${NDX.PDB_DOT[debuffType]?.kind || NDX.PDB_MISS[debuffType] ? '致盲' : debuffType}`);
  }

  // 区域吸血
  if (monster.regionLifesteal && dealtDamage > 0) {
    const heal = Math.round(dealtDamage * monster.regionLifesteal);
    mHp = Math.min(mMaxHp, mHp + heal);
    log.push(`【区域·${affix.name}】吸血 +${heal}`);
  }

  return { pDebuffs, pDots, mHp, log };
};

// =============================================================
// 四、控制型debuff结算
// 在玩家回合开始时检查是否被控制
// =============================================================

// 检查玩家是否被控制（眩晕/缴械/魅惑）
// 返回 { controlled: boolean, controlType: string, skipTurn: boolean, attackSelf: boolean, noPhysical: boolean }
NDX.checkPlayerControl = function(pDebuffs) {
  if (!pDebuffs) return { controlled: false };

  // 眩晕型debuff：跳过回合
  const STUN_TYPES = ['stun', 'frozen', 'swallow', 'fear'];
  for (const stunType of STUN_TYPES) {
    if (pDebuffs[stunType] > 0) {
      return { controlled: true, controlType: stunType, skipTurn: true };
    }
  }

  // 缴械型debuff：无法物理攻击（法宝仍可用）
  const DISARM_TYPES = ['disarm'];
  for (const disarmType of DISARM_TYPES) {
    if (pDebuffs[disarmType] > 0) {
      return { controlled: true, controlType: disarmType, noPhysical: true };
    }
  }

  // 魅惑型debuff：攻击自己
  const CHARM_TYPES = ['charm', 'pipa', 'embroideredBall'];
  for (const charmType of CHARM_TYPES) {
    if (pDebuffs[charmType] > 0) {
      return { controlled: true, controlType: charmType, attackSelf: true };
    }
  }

  return { controlled: false };
};

console.log('[boss_skill_combat] Boss专属技能战斗逻辑已加载');
