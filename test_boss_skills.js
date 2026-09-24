// =============================================================
// test_boss_skills.js - Boss专属技能系统测试脚本
// 运行方式：node test_boss_skills.js
// =============================================================

// 模拟NDX对象
global.NDX = {};

// 加载boss_skills.js
require('./js/boss_skills.js');

// 加载boss_skill_combat.js
require('./js/boss_skill_combat.js');

// 模拟PDB配置（实际在combat_part2.js中定义）
NDX.PDB_DOT = {
  burn: { pctMaxHp: 0.04, atkMul: 0.10, flat: 8, kind: '灼烧' },
  frost: { pctMaxHp: 0.02, atkMul: 0.00, flat: 6, kind: '冻伤' },
  curse: { pctMaxHp: 0.03, atkMul: 0.04, flat: 8, kind: '咒蚀' },
  poison: { pctMaxHp: 0.03, atkMul: 0.02, flat: 6, kind: '中毒' },
  xuanShuang: { pctMaxHp: 0.06, atkMul: 0.05, flat: 10, kind: '玄霜' },
  thunderFire: { pctMaxHp: 0.12, atkMul: 0.15, flat: 15, kind: '雷火' },
  headband: { pctMaxHp: 0.05, atkMul: 0.03, flat: 8, kind: '紧箍' },
};
NDX.PDB_MISS = { blind: 0.80, daze: 0.45, sand: 0.30, illusion: 0.35, windBlade: 0.20 };
NDX.PDB_ATKMUL = { atkDown: 0.20, frost: 0.50, curse: 0.35, poison: 0.75, weak: 0.60, xuanShuang: 0.80, resentment: 0.90 };
NDX.PDB_STUN = { stun: 1.0, frozen: 1.0, swallow: 0.30, fear: 0.30 };
NDX.PDB_DISARM = { disarm: true };
NDX.PDB_CHARM = { charm: 0.50, pipa: 0.50, embroideredBall: 0.50 };

console.log('========================================');
console.log('Boss专属技能系统测试');
console.log('========================================\n');

// 测试1：Boss专属技能注册表
console.log('【测试1】Boss专属技能注册表');
const bossCount = Object.keys(NDX.BOSS_SKILLS).length;
const eliteCount = Object.keys(NDX.ELITE_SKILLS).length;
const regionCount = Object.keys(NDX.REGION_AFFIXES).length;
console.log(`  Boss数量: ${bossCount}`);
console.log(`  精英数量: ${eliteCount}`);
console.log(`  区域属性数量: ${regionCount}`);
console.log(`  测试结果: ${bossCount > 0 && eliteCount > 0 && regionCount > 0 ? '通过' : '失败'}\n`);

// 测试2：获取Boss专属技能
console.log('【测试2】获取Boss专属技能');
const huangfengSkills = NDX.getBossSkills('黄风大圣');
console.log(`  黄风大圣技能数量: ${huangfengSkills ? huangfengSkills.skills.length : 0}`);
console.log(`  黄风大圣区域属性: ${huangfengSkills ? huangfengSkills.regionAffix.name : '无'}`);
console.log(`  黄风大圣克制法宝: ${huangfengSkills ? huangfengSkills.counterItem : '无'}`);
console.log(`  测试结果: ${huangfengSkills && huangfengSkills.skills.length > 0 ? '通过' : '失败'}\n`);

// 测试3：别名引用
console.log('【测试3】别名引用');
const niumowangSkills = NDX.getBossSkills('牛魔王');
console.log(`  牛魔王别名引用: ${niumowangSkills ? '成功' : '失败'}`);
console.log(`  测试结果: ${niumowangSkills ? '通过' : '失败'}\n`);

// 测试4：Boss专属技能触发
console.log('【测试4】Boss专属技能触发');
let triggerCount = 0;
for (let i = 0; i < 100; i++) {
  const skill = NDX.checkBossSkillTrigger({ name: '黄风大圣' }, 5, 80, 100);
  if (skill) triggerCount++;
}
console.log(`  100次测试中触发次数: ${triggerCount}（预期约30次）`);
console.log(`  测试结果: ${triggerCount > 0 && triggerCount < 60 ? '通过' : '失败'}\n`);

// 测试5：Boss专属技能效果结算 - DOT
console.log('【测试5】Boss专属技能效果结算 - DOT');
const dotSkill = { id: 'samadhi_fire', name: '三昧真火', type: 'dot', effect: { dotType: 'burn', dmgPct: 0.10, turns: 3 } };
const dotResult = NDX.applyBossSkillEffect(dotSkill, { name: '红孩儿' }, {}, [], {});
console.log(`  技能名称: ${dotSkill.name}`);
console.log(`  新增debuff: ${JSON.stringify(dotResult.newDebuffs)}`);
console.log(`  日志: ${dotResult.log.join(', ')}`);
console.log(`  测试结果: ${dotResult.newDebuffs.burn === 3 ? '通过' : '失败'}\n`);

// 测试6：Boss专属技能效果结算 - 缴械
console.log('【测试6】Boss专属技能效果结算 - 缴械');
const disarmSkill = { id: 'golden_ring', name: '金刚琢', type: 'disarm', effect: { disarmTurns: 3 } };
const disarmResult = NDX.applyBossSkillEffect(disarmSkill, { name: '青牛精' }, {}, [], {});
console.log(`  技能名称: ${disarmSkill.name}`);
console.log(`  新增debuff: ${JSON.stringify(disarmResult.newDebuffs)}`);
console.log(`  日志: ${disarmResult.log.join(', ')}`);
console.log(`  测试结果: ${disarmResult.newDebuffs.disarm === 3 ? '通过' : '失败'}\n`);

// 测试7：控制型debuff检查
console.log('【测试7】控制型debuff检查');
const stunCheck = NDX.checkPlayerControl({ stun: 1 });
console.log(`  眩晕检查: ${JSON.stringify(stunCheck)}`);
const disarmCheck = NDX.checkPlayerControl({ disarm: 2 });
console.log(`  缴械检查: ${JSON.stringify(disarmCheck)}`);
const charmCheck = NDX.checkPlayerControl({ charm: 1 });
console.log(`  魅惑检查: ${JSON.stringify(charmCheck)}`);
const noControlCheck = NDX.checkPlayerControl({});
console.log(`  无控制检查: ${JSON.stringify(noControlCheck)}`);
console.log(`  测试结果: ${stunCheck.skipTurn && disarmCheck.noPhysical && charmCheck.attackSelf && !noControlCheck.controlled ? '通过' : '失败'}\n`);

// 测试8：区域属性传染
console.log('【测试8】区域属性传染');
const regionAffix = NDX.getRegionAffix(1);
console.log(`  第1章区域属性: ${regionAffix ? regionAffix.name : '无'}`);
console.log(`  第1章区域属性描述: ${regionAffix ? regionAffix.desc : '无'}`);
const mob = { name: '测试小怪', hp: 100, atk: 20 };
NDX.applyRegionAffixToMob(mob, 1);
console.log(`  小怪应用区域属性后tags: ${mob.tags ? mob.tags.join(', ') : '无'}`);
console.log(`  测试结果: ${regionAffix && mob.regionAffix && mob.tags ? '通过' : '失败'}\n`);

// 测试9：所有Boss技能数量统计
console.log('【测试9】所有Boss技能数量统计');
let totalSkills = 0;
for (const bossName in NDX.BOSS_SKILLS) {
  const boss = NDX.BOSS_SKILLS[bossName];
  if (boss.skills) {
    totalSkills += boss.skills.length;
    console.log(`  ${bossName}: ${boss.skills.length}个技能`);
  }
}
console.log(`  总技能数量: ${totalSkills}`);
console.log(`  测试结果: ${totalSkills > 50 ? '通过' : '失败'}\n`);

console.log('========================================');
console.log('所有测试完成！');
console.log('========================================');
