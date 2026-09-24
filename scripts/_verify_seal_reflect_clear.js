// _verify_seal_reflect_clear.js — 劫印·轮回「反伤触发清除负面状态」机制消费·行为门禁
// ---------------------------------------------------------------------------
// 背景：reflectStackClear 机制（js/jieseals.js:110 轮回·金档）历史上「定义了却零消费者」，
//   M1-SEAL-REFLECT-01 已在 js/combat_part1.js 的 enemyAttack 反伤触发点（≈L598）接上消费：
//     if (reflect > 0 && fate['reflectStackClear'] > 0) { 先清 pDots，再清 pDebuffs；空则 no-op }
//   本门禁以「真实战斗内核」跑批，断言三种语义，并锁死金档门控：
//     ① 正向：玩家带 金档轮回机制 + 反伤触发 + 有负面状态 → 负面状态精确 -1（mechVal 个）
//     ② 正向（无负面）：有机制 + 反伤触发 + 本无负面状态 → 不抛错、no-op
//     ③ 负向：机制缺失（=非金档/移除劫印，上游 _sealMechanism 不生成 mechanism）→ 绝不清除
//     ④ 结构性：机制清除严格受「反伤触发(reflect>0)」门控（无反伤不清除）
//     ⑤ 上游金档门控：jieseals.js 的 _sealMechanism 按 _mechRank 品阶门控（品阶 < gold 不生成 mechanism）
//
// 运行：node scripts/_verify_seal_reflect_clear.js
// 判定：失败数 != 0 时进程非 0 退出（与既有 _verify_*.js 风格一致）。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

// —— 浏览器最小桩（与 _verify_stance_xinmo.js 同范式）——
const _noop = () => {};
const _store = {};
// 确定性随机：0.99 → 不暴击（critRate<0.99）、不闪避（pTi.hit=1 已兜底）、不触发咒蚀/裂伤 DOT 概率分支
const _Math = Object.create(Math);
_Math.random = () => 0.99;
const sb = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math: _Math,
  navigator: { userAgent: 'node' },
  localStorage: { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; } },
  document: {
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
    querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
};
sb.window = sb; sb.global = sb; sb.self = sb;
const ctx = vm.createContext(sb);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
files.forEach((f) => {
  if (/^https?:/.test(f)) return;
  const p = f.split('?')[0];
  if (!fs.existsSync(path.join(ROOT, p))) return;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p }); } catch (e) { }
});
const NDX = sb.NDX;
ck('NDX 已加载（含 calcCombat / _bossDebuffSpec）', !!NDX && typeof NDX.calcCombat === 'function' && typeof NDX._bossDebuffSpec === 'function');

// —— 工厂：确定性战斗（怪物撑过第 1 回合 ⇒ 敌必出手至少一次；boss 招牌 debuff 开战即挂）——
// 关键约束：怪物 hp 远大于玩家单发伤害 ⇒ 第 1 回合玩家打不死 ⇒ 无论先手方是谁，敌方必在第 1 回合出手，
//   反伤触发(reflect>0) ⇒ 清除 1 个负面；随后玩家第 2 回合斩杀 ⇒ 战斗恰好 2 回合，结果可精确比对。
//   （注：normalizeMonster 会改写怪物 spd，故不依赖 spd 控先手，改为"撑过首回合"保证敌出手。）
const player = (over) => Object.assign({
  heroId: 'tangseng', good: 0,
  spd: 5,
  ti: { atk: 50000, atkB: 0, fixAtk: 0, maxHp: 1500, curHp: 1500, hp: 1500, dr: 0, mdef: 40, hit: 1 }, // hit:1 兜底不闪避
  yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
  reflect: 0.15,                // equipReflect ⇒ 反伤触发(reflect>0)
  shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
}, over || {});

// bossMonster：'白骨' ⇒ debuffSpec={type:'atkDown',dur:3,applyAtStart:true,reapplyEvery:4}（combat_part2.js:703,731）
//   选用 atkDown（减攻类）而非 burn/frost/curse/poison：后者属 PDB_DOT（combat_part2.js:677），
//   命中会经 playerAttack 的 DOTS 循环再推一条 pDot（combat_part1.js:757），使 pDots 非空，
//   而机制优先清 pDots（与雪羽·净化同源，combat_part1.js:808-811），导致可观测的 pDebuffs 不被清。
//   用 atkDown 可保证 pDots 恒空，令清除落到 pDebuffs（终局经 res.pDebuffs 透传，combat_part1.js:1023）。
//   tutorial:true ⇒ 怪物每回合强制纯普攻（combat_part1.js:843），杜绝 guard/buff 导致不命中 → 反伤必触发
const bossMonster = (over) => Object.assign({
  name: '白骨', type: 'boss', boss: true, tutorial: true,
  hp: 40000, atk: 50, matk: 0, dr: 0, spd: 20, diff: 1,
}, over || {});
// 无 debuff 的普通怪（用于「本无负面状态」场景），同样撑过首回合以真正走到反伤触发点
const plainMonster = () => ({ name: '试炼妖', type: 'mob', hp: 40000, atk: 50, matk: 0, dr: 0, spd: 20, diff: 1 });

const debuffCount = (res) => Object.keys(res.pDebuffs || {}).length;

console.log('\n[劫印·轮回 reflectStackClear 消费·行为门禁]');

// ===== ① 正向：机制存在 + 反伤触发 + 有负面状态 ⇒ 负面 -1 =====
const rWith = NDX.calcCombat(player({ fateFlags: { reflectStackClear: 1 } }), bossMonster());
const rWithout = NDX.calcCombat(player({ fateFlags: {} }), bossMonster()); // 机制缺失基线
ck('① 有机制时终局负面状态数 = 0（开战挂 1 个 atkDown，被反伤清除）', debuffCount(rWith) === 0, 'count=' + debuffCount(rWith));
ck('① 无机制基线终局负面状态数 = 1（atkDown 挂上、回合末衰减 3→2）', debuffCount(rWithout) === 1, 'count=' + debuffCount(rWithout));
ck('① 精确 -1：有机制比基线少恰好 mechVal(=1) 个', debuffCount(rWith) === debuffCount(rWithout) - 1,
  'with=' + debuffCount(rWith) + ' without=' + debuffCount(rWithout));

// ===== ④ 机制清除严格受「反伤触发」门控：有机制但 reflect=0 ⇒ 不清除 =====
const rNoReflect = NDX.calcCombat(player({ fateFlags: { reflectStackClear: 1 }, reflect: 0 }), bossMonster());
ck('④ 有机制但反伤未触发(reflect=0) ⇒ 不清除（与缺失基线同数）',
  debuffCount(rNoReflect) === debuffCount(rWithout) && debuffCount(rNoReflect) === 1,
  'noReflect=' + debuffCount(rNoReflect) + ' baseline=' + debuffCount(rWithout));

// ===== ③ 负向：机制缺失 ⇒ 绝不清除（=非金档/移除劫印的上游终态） =====
ck('③ 负向·机制缺失绝不清除（有机制比缺失少 1，缺失保持满额）',
  debuffCount(rWithout) === 1 && debuffCount(rWith) < debuffCount(rWithout),
  'without=' + debuffCount(rWithout) + ' with=' + debuffCount(rWith));

// ===== ② 正向（无负面）：有机制 + 反伤触发 + 本无负面状态 ⇒ 不抛错、no-op =====
let noErrThrew = false, rEmpty = null;
try {
  rEmpty = NDX.calcCombat(player({ fateFlags: { reflectStackClear: 1 } }), plainMonster());
} catch (e) { noErrThrew = true; console.log('  ✗ ② 抛错：' + e.message); }
ck('② 无负面状态时触发不抛错（no-op 安全）', !noErrThrew);
ck('② 无负面状态时终局负面状态数仍 = 0（未凭空制造 debuff）', rEmpty != null && debuffCount(rEmpty) === 0,
  'count=' + (rEmpty ? debuffCount(rEmpty) : 'n/a'));
ck('② 无负面场景战斗结算结构完好（res.win 为布尔）', rEmpty != null && typeof rEmpty.win === 'boolean');

// ===== ⑤ 上游金档门控：jieseals.js _sealMechanism 按 _mechRank 品阶门控 =====
const jieSrc = fs.readFileSync(path.join(ROOT, 'js/jieseals.js'), 'utf8');
ck('⑤ 轮回 词条携带 mech:\'reflectStackClear\'', jieSrc.indexOf("mech: 'reflectStackClear'") >= 0);
ck('⑤ 轮回 机制品阶为 gold（mechTier:\'gold\'）', jieSrc.indexOf("mechTier: 'gold'") >= 0);
ck('⑤ _sealMechanism 按 _mechRank 品阶门控（品阶 < gold 不生成 mechanism）',
  jieSrc.indexOf("_mechRank[tier] < NDX._mechRank[tr]") >= 0);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
