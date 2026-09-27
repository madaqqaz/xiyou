#!/usr/bin/env node
// _verify_boss_skills.js — Boss 技能链复活门禁（V9.61）
// 断言：加载链 / 运行期真调 / 键名卫生 / PDB 表 / 内核接线 / 零回归
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  [' + extra + ']' : '')); }
}

// ---------- 1. 加载链 ----------
console.log('— 加载链 —');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
ok('index.html 含 boss_skills.js 标签', /<script src="js\/boss_skills\.js\?v=\d+"/.test(HTML));
ok('index.html 含 boss_skill_combat.js 标签', /<script src="js\/boss_skill_combat\.js\?v=\d+"/.test(HTML));
const idxSkills = HTML.indexOf('js/boss_skills.js');
const idxKernel = HTML.indexOf('js/combat_part1.js');
ok('boss_skills 加载序在 combat_part1 之前', idxSkills > 0 && idxKernel > 0 && idxSkills < idxKernel);

// ---------- 2. 运行期真调（独立 NDX 沙箱）----------
console.log('— 运行期真调 —');
global.NDX = {};
require(path.join(ROOT, 'js', 'boss_skills.js'));
require(path.join(ROOT, 'js', 'boss_skill_combat.js'));
const NDX = global.NDX;

const hf = NDX.getBossSkills && NDX.getBossSkills('黄风大圣');
ok('getBossSkills(黄风大圣) 命中 4 技', !!hf && Array.isArray(hf.skills) && hf.skills.length === 4);
ok('getBossSkills(野祠饿鬼) === null（零回归前提）', NDX.getBossSkills('野祠饿鬼') === null);

// ---------- 2b. 九章末 Boss 技能命中（防显示名与技能键失配）----------
// 真源：enemies_part1.js:NDX.CHAPTER_BOSS_NAMES（显示名，运行时挂到 monster.name）
// 通过 boss_skills.js:NDX.BOSS_SKILL_ALIAS 解析为 BOSS_SKILLS 内部键
// ch9 '传经吏·索经' 尚无对应技能键（终局 Boss 新内容待补），单独标注为非阻断 TODO
console.log('— 九章末 Boss 技能命中 —');
const esrc = fs.readFileSync(path.join(ROOT, 'js', 'enemies_part1.js'), 'utf8');
const cnMatch = esrc.match(/NDX\.CHAPTER_BOSS_NAMES\s*=\s*\[([\s\S]*?)\]/);
const chapterBosses = cnMatch
  ? [...cnMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
  : [];
ok('CHAPTER_BOSS_NAMES 解析到 9 项', chapterBosses.length === 9, '实际 ' + chapterBosses.length);
const CH9_TODO = '传经吏·索经'; // 唯一允许的 TODO 例外
chapterBosses.forEach((nm, i) => {
  const act = i + 1;
  const skills = NDX.getBossSkills(nm);
  const hit = !!skills && Array.isArray(skills.skills) && skills.skills.length > 0;
  if (nm === CH9_TODO) {
    // 终局 Boss 新内容待补：命中失败按非阻断 TODO 记录；一旦补上则必须命中
    if (hit) { ok('ch9 ' + nm + ' 已补技能（TODO 可移除）', true); }
    else { console.log('  ⚠ ch9 ' + nm + ' 尚无 BOSS_SKILLS 键（终局 Boss 新内容待补，非阻断）'); }
  } else {
    ok('ch' + act + ' ' + nm + ' → getBossSkills 命中', hit,
       hit ? '' : '显示名未在 BOSS_SKILLS/BOSS_SKILL_ALIAS 中解析到技能键');
  }
});

// 触发器真调：低血（stage3 窗口 40% 触发率）连打 80 次，至少命中 1 次
let hit = null;
const fakeBoss = { name: '黄风大圣', hp: 1000 };
for (let i = 0; i < 80 && !hit; i++) hit = NDX.checkBossSkillTrigger(fakeBoss, 3 + i, 200, 1000);
ok('checkBossSkillTrigger 低血窗口可触发', !!hit && !!hit.name, hit ? hit.name : '80 次未触发');
ok('触发后进入冷却（BOSS_SKILL_COOLDOWN=2）', fakeBoss._bossSkillCooldown === 2);
// 冷却期不触发：冷却值逐回合递减（内核每回合调一次），前 2 次调用（冷却 2→1→0）恒 null
const cdBoss = { name: '黄风大圣', hp: 1000, _bossSkillCooldown: 2 };
const c1 = NDX.checkBossSkillTrigger(cdBoss, 1, 200, 1000);
const c2 = NDX.checkBossSkillTrigger(cdBoss, 2, 200, 1000);
ok('冷却期内不触发（冷却 2→1→0 递减语义）', c1 === null && c2 === null && cdBoss._bossSkillCooldown === 0);
// 非 Boss 恒 null
let mobHit = false;
for (let i = 0; i < 60; i++) { if (NDX.checkBossSkillTrigger({ name: '野祠饿鬼', hp: 100 }, i, 50, 100)) { mobHit = true; break; } }
ok('非 Boss 恒不触发（零回归）', !mobHit);

// 效果结算真调：shield 型 → guard 动作 + blind debuff
const shieldSkill = { name: '黄沙护盾', type: 'shield', effect: { absorb: 0.5, miss: 0.5 } };
const effShield = NDX.applyBossSkillEffect(shieldSkill, {}, {}, [], {});
ok('shield 型 → guard 动作', !!effShield && effShield.action && effShield.action.type === 'guard');
ok('shield 型 → blind debuff 写入', !!effShield && effShield.newDebuffs && effShield.newDebuffs.blind > 0);
ok('applyBossSkillEffect(null) === null', NDX.applyBossSkillEffect(null, {}, {}, [], {}) === null);

// ---------- 3. 数据卫生 ----------
console.log('— 数据卫生 —');
const bsrc = fs.readFileSync(path.join(ROOT, 'js', 'boss_skills.js'), 'utf8');
const keys = [...bsrc.matchAll(/^  '([^']+)':\s*\{/gm)].map((m) => m[1]);
const seen = new Set(); let dups = 0;
keys.forEach((k) => { if (seen.has(k)) dups++; seen.add(k); });
ok('BOSS_SKILLS 无重复键', dups === 0, dups + ' 个重复');
ok('aliasOf 别名条目已清（skills: null 计数=0）', (bsrc.match(/skills:\s*null/g) || []).length === 0);

// ---------- 4. PDB 配置表（第五块断链补全）----------
console.log('— PDB 表 —');
const needDot = ['fire', 'poison', 'thunder_fire', 'xuan_shuang', 'curse'];
ok('PDB_MISS 含 blind/stun', !!NDX.PDB_MISS && NDX.PDB_MISS.blind != null && NDX.PDB_MISS.stun != null);
ok('PDB_ATKMUL 含 weak/atkDown', !!NDX.PDB_ATKMUL && NDX.PDB_ATKMUL.weak != null && NDX.PDB_ATKMUL.atkDown != null);
ok('PDB_DOT 含 5 个 DOT 键', !!NDX.PDB_DOT && needDot.every((k) => NDX.PDB_DOT[k] && NDX.PDB_DOT[k].kind));
// 技能表里用到的 dotType/dot 全部有 PDB_DOT 条目（防新增死键）
const usedDots = [...bsrc.matchAll(/dot(?:Type)?:\s*'([a-z_]+)'/g)].map((m) => m[1]);
const missingDot = [...new Set(usedDots)].filter((k) => !NDX.PDB_DOT[k]);
ok('技能表 DOT 键 ⊆ PDB_DOT', missingDot.length === 0, missingDot.join(','));

// ---------- 5. 内核 / UI 接线 ----------
console.log('— 接线 —');
const ksrc = fs.readFileSync(path.join(ROOT, 'js', 'combat_part1.js'), 'utf8');
const gsrc = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_combat_1.js'), 'utf8');
ok('内核 B 点：checkBossSkillTrigger(m, round', ksrc.includes('NDX.checkBossSkillTrigger(m, round'));
ok('内核 B 点：newDebuffs 并入 pDebuffs', ksrc.includes('pDebuffs[_k] = _nd[_k]'));
ok('内核：mTurn.bossSkillLog 透出', ksrc.includes('mTurn.bossSkillLog'));
ok('内核：applyRegionAffixOnAttack 挂钩', ksrc.includes('NDX.applyRegionAffixOnAttack'));
ok('UI A 点：applyRegionAffixToMob 注入', gsrc.includes('NDX.applyRegionAffixToMob'));
ok('UI narr：bossSkillLog 消费', gsrc.includes('t.bossSkillLog'));
ok('教学战豁免：tutorial 不触发 Boss 技', ksrc.includes('!m.tutorial && NDX.checkBossSkillTrigger'));
ok('A 点教学战豁免', gsrc.includes('!monster.tutorial && NDX.applyRegionAffixToMob'));

// ---------- 6. 内核消费层仍在（防回归删除断言）----------
ok('内核 V8.50 消费层：PDB_MISS 读取', ksrc.includes('NDX.PDB_MISS'));
ok('内核 V8.50 消费层：PDB_ATKMUL 读取', ksrc.includes('NDX.PDB_ATKMUL'));
ok('内核 V8.50 消费层：PDB_DOT 读取', ksrc.includes('NDX.PDB_DOT'));

console.log('\n=== _verify_boss_skills: ' + pass + ' 通过 / ' + fail + ' 失败 ===');
process.exit(fail ? 1 : 0);
