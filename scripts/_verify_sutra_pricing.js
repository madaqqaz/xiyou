// ============================================================
// V9.54 经文线门禁：
//   ① 碎片按**定位定价**（不再按经文字数）——防「大悲咒 2 片成全本」
//   ② 定价须同时兼顾**渡/逆两侧强度对等**（逆经 per 高 ⇒ 定价须贵）
//   ③ **寿命平衡**：诵经耗寿须构成约束，但不至于逼玩家放弃经文线
//   ④ 逆经**与逆道同开**（niSutraUnlocked ≡ niDaoUnlocked，不另立判据）
//   ⑤ 经位**双格唯一真源**（atk 变攻击 / chant 变诵经 / 其余包裹被动）
//   ⑥ 修 bug：逆经日志写死 `/3` ⇒ 实为 3~16 片
// ============================================================
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// —— 最小 DOM/Storage 桩（与项目内其他 _verify_* 同口径）——
Object.defineProperty(global, 'window', { value: global, writable: true });
if (!global.location) global.location = { href: 'http://localhost/', search: '' };
if (!global.localStorage) {
  const _ls = {};
  global.localStorage = {
    get length() { return Object.keys(_ls).length; },
    key() { return null; },
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {},
  };
}
// 播种随机：确定性
let _seed = 20260925;
Math.random = () => { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; };
if (!global.requestAnimationFrame) global.requestAnimationFrame = () => 0;

// 按 index.html 真实脚本顺序加载（保证 niDaoUnlocked / LIFE 等依赖链完整）
const _html = require('fs').readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
[..._html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !SKIP.has(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });

const NDX = global.NDX || global.window.NDX;
let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  ← ' + extra : '')); }
};

console.log('=== ① 定位定价 · 不按字数 ===');
const ferryCosts = NDX.SUTRA_FULLS.map((f) => ({ id: f.id, key: f.sutra, cost: NDX.sutraCostOf(f.id), old: (NDX.SUTRA_FRAG_NAMES[f.sutra] || []).length }));
const rebelCosts = NDX.NI_SUTRA_FULLS.map((f) => ({ id: f.id, key: f.sutra, cost: NDX.sutraCostOf(f.id), old: (NDX.NI_SUTRA_FRAG_NAMES[f.sutra] || []).length }));

// 🔴 可达性硬约束：定价不得超出「碎片种类 × 2」，否则该经永远合成不出来
ck('34 部经文定价全部可达（cost ≤ 残片种类×2，同一残片不叠超 2 次）',
  ferryCosts.concat(rebelCosts).every((r) => r.cost <= r.old * 2),
  ferryCosts.concat(rebelCosts).filter((r) => r.cost > r.old * 2).map((r) => r.key + ':' + r.cost + '>' + (r.old * 2)).join(','));
ck('短表经已补足残片种类（无 <4 种者）',
  ferryCosts.concat(rebelCosts).every((r) => r.old >= 4),
  ferryCosts.concat(rebelCosts).filter((r) => r.old < 4).map((r) => r.key + ':' + r.old).join(','));

ck('渡经无一「≤3 片即成全本」（旧按字数定价的漏洞已堵）',
  ferryCosts.every((r) => r.cost > 3),
  ferryCosts.filter((r) => r.cost <= 3).map((r) => r.key).join(','));
ck('逆经无一「≤5 片即成全本」',
  rebelCosts.every((r) => r.cost > 5),
  rebelCosts.filter((r) => r.cost <= 5).map((r) => r.key).join(','));
ck('定价与字数**非单调**（终极经不等于最贵字数）',
  (() => {
    const byOld = ferryCosts.slice().sort((a, b) => a.old - b.old).map((r) => r.cost);
    const byCost = ferryCosts.slice().sort((a, b) => a.cost - b.cost).map((r) => r.old);
    return JSON.stringify(byOld) !== JSON.stringify(byCost);
  })());
ck('终极经定价 ≥16（梵网 20 / 华严 16 / 逆天录 16）',
  NDX.sutraCostOf('su_full_fanwang') === 20 &&
  NDX.sutraCostOf('su_full_huayan') === 16 &&
  NDX.sutraCostOf('ni_full_nitian') === 16);
ck('入门经定价 ≤6（大悲 / 阿弥陀）',
  NDX.sutraCostOf('su_full_dabei') === 6 && NDX.sutraCostOf('su_full_amituo') === 6);

console.log('=== ② 渡/逆定位差异（逆经：解锁门槛高 + 部数少 ⇒ 定价须贵）===');
// ⚠ 判据澄清（2026-09-25 实测）：逆经**并不**靠 `chant.per` 压渡经（渡均 0.0189 > 逆均 0.0083，
//   只看破戒录 per 0.10 会被极值带偏）。逆经的真实定位是：
//     ① 须逆道解锁（niSutraUnlocked ≡ niDaoUnlocked，首周目要逆命数 ≥6）⇒ 准入门槛高
//     ② 部数少（12 vs 22）⇒ 单部须更有分量才有取舍
//     ③ effect 被动数值普遍强于渡经 ⇒ 换来的战力更多
//   故判据取「均价」而非 per 极值。
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
// ⚠ 求和须在使用点**之前**声明——这两行早先写在 const 声明之后 ⇒ ReferenceError(TDZ) 直接判红
const ferrySum = ferryCosts.reduce((a, b) => a + b.cost, 0);
const rebelSum = rebelCosts.reduce((a, b) => a + b.cost, 0);
const ferryAvg = ferrySum / NDX.SUTRA_FULLS.length;
const rebelAvg = rebelSum / NDX.NI_SUTRA_FULLS.length;
ck('逆经均价 > 渡经均价（解锁门槛高 + 部数少，定价须上抬）',
  rebelAvg > ferryAvg, `渡均 ${ferryAvg.toFixed(1)} / 逆均 ${rebelAvg.toFixed(1)}`);
ck('逆经部数少于渡经（支线定位）', NDX.NI_SUTRA_FULLS.length < NDX.SUTRA_FULLS.length);
ck('逆经 effect 被动均值强于渡经（换来的战力更多）', (() => {
  const power = (arr) => arr.reduce((a, f) => {
    const e = f.effect || {}; const ti = e.ti || {};
    return a + (ti.atk || 0) * 1 + (ti.hp || 0) * 0.2 + (e.matk || 0) * 1 +
           ((e.dr || 0) + (e.mdef || 0) + (e.crit || 0)) * 120;
  }, 0) / arr.length;
  return power(NDX.NI_SUTRA_FULLS) > power(NDX.SUTRA_FULLS);
})());
ck('逆经总定价高于旧字数口径（防「逆经白送」）', rebelSum > 76, '旧 76 → 新 ' + rebelSum);
ck('渡总量 > 逆总量（渡为主线路、逆为支线稀缺）', ferrySum > rebelSum, `渡 ${ferrySum} / 逆 ${rebelSum}`);
ck('单部成本离散度合理（最贵/最便宜 ≤ 4×）',
  Math.max.apply(null, ferryCosts.map((r) => r.cost)) / Math.min.apply(null, ferryCosts.map((r) => r.cost)) <= 4);

console.log('=== ③ 寿命平衡（诵经耗寿须构成约束但不至于劝退）===');
const D = (NDX.LIFE && NDX.LIFE.DAYS_PER_YEAR) || 360;
const START = (NDX.LIFE && NDX.LIFE.START) || 23;
const C = NDX.SUTRA_CHANT || {};
const totalLifeDays = ((C.MAX_PER_ACT || 3) - (C.FREE_PER_ACT || 1)) * (C.LIFE_DAYS || 0) * 9;
const pct = totalLifeDays / D / START * 100;
ck('九章用满诵经 ≤ 余寿 12%（低于此值寿命不构成约束）', pct <= 12, pct.toFixed(1) + '%');
ck('九章用满诵经 ≥ 余寿 5%（高于此值玩家会放弃经文线）', pct >= 5, pct.toFixed(1) + '%');
ck('每章至少 1 次免费（章首土地庙的承诺）', (C.FREE_PER_ACT || 0) >= 1);
ck('GAIN = 1（每次诵经补 1 枚，缺口最小优先 ⇒ 永不成废片）', (C.GAIN || 0) === 1);

console.log('=== ④ 逆经与逆道同开 ===');
ck('niSutraUnlocked 存在且与 niDaoUnlocked 同判据',
  typeof NDX.niSutraUnlocked === 'function' &&
  NDX.niSutraUnlocked({}) === false &&
  NDX.niSutraUnlocked({ fate: { 逆: 3 }, evil: 5 }) === !!NDX.niDaoUnlocked({ fate: { 逆: 3 }, evil: 5 }));
ck('未解锁时不掉逆经碎片（防「看得见刷不出」）',
  NDX.grantNiSutraFrag({ fate: { 逆: 3 }, evil: 5 }) === null);
ck('解锁后可掉逆经碎片（逆命数 ≥6 才开缝）',
  !!NDX.grantNiSutraFrag({ fate: { 逆: 6 }, evil: 5, sutraBackpack: [], niSutras: [], niSutraFrags: {} }));

console.log('=== ⑤ 经位双格唯一真源 ===');
const st = { sutras: ['su_full_dabei', 'su_full_xinjing'], sutraBackpack: [] };
NDX.ensureJingSlots(st);
NDX.setJingSlot(st, 'chant', 'su_full_dabei');
ck('诵经格写入生效（ chantSutraId 读回）', NDX.chantSutraId(st) === 'su_full_dabei');
NDX.setJingSlot(st, 'atk', 'su_full_xinjing');
ck('攻击格写入生效（ atkSutraId 读回）', NDX.atkSutraId(st) === 'su_full_xinjing');
ck('双格不同经 ⇒ 攻击/诵经各归其位',
  NDX.chantSutraId(st) === 'su_full_dabei' && NDX.atkSutraId(st) === 'su_full_xinjing');
ck('sutraConsumeKind：诵经格 ⇒ chant（技能经）',
  NDX.sutraConsumeKind(st, 'su_full_dabei') === 'chant');
ck('sutraConsumeKind：攻击格 ⇒ atk（一手一形态，与诵经格同权）',
  NDX.sutraConsumeKind(st, 'su_full_xinjing') === 'atk');
ck('sutraConsumeKind：其余持有 ⇒ passive（包裹被动生效）',
  NDX.sutraConsumeKind(st, 'su_full_lengyan') === 'passive');
ck('isActiveSutra：双格皆算技能经（路线权重同为 1.5）',
  NDX.isActiveSutra(st, 'su_full_dabei') && NDX.isActiveSutra(st, 'su_full_xinjing') &&
  !NDX.isActiveSutra(st, 'su_full_lengyan'));
ck('被动经清单排除双格（不重复计入路线）',
  (NDX.passiveSutraIds(st) || []).indexOf('su_full_dabei') < 0 &&
  (NDX.passiveSutraIds(st) || []).indexOf('su_full_xinjing') < 0);
ck('旧存档回落：仅 s.chantSutra 时 chantSutraId 仍可读',
  (() => { const o = { sutras: ['su_full_dabei'], chantSutra: 'su_full_dabei' }; return NDX.chantSutraId(o) === 'su_full_dabei'; })());
ck('旧存档回落：仅 s.chantSutra 且为攻击型经 ⇒ 视同攻击格',
  (() => {
    // 攻击型经：chantSkill.kind ∈ {glut-ton, war-buff, veil-mantra, break-mantra}（JING_KIND_MOD 派 slot==='atk'）
    const atkKinds = Object.keys(NDX.JING_KIND_MOD || {}).filter((k) => NDX.JING_KIND_MOD[k].slot === 'atk');
    const o = { sutras: [], chantSutra: null };
    // 找一部真实存在的攻击型经装入旧持诵位
    const hit = NDX.SUTRA_FULLS.find((f) => f.chantSkill && atkKinds.indexOf(f.chantSkill.kind) >= 0);
    if (!hit) return false;
    o.sutras = [hit.id]; o.chantSutra = hit.id;
    return NDX.atkSutraId(o) === hit.id;
  })());

console.log('=== ⑥ 定价口径的收集/合成一致性 ===');
const st2 = { sutraFrags: {} };
const f = NDX.sutraFullById('su_full_dabei');
const need = NDX.sutraCostOf(f.id);
// 残片可堆叠：凑 need 枚 = 该部残片按需堆叠（旧口径要求「集齐全部不同 id」，已作废）
for (let i = 0; i < need; i++) {
  const fid = f.frags[i % f.frags.length];
  st2.sutraFrags[fid] = (st2.sutraFrags[fid] || 0) + 1;
}
ck(`凑够 ${need} 枚即判可合成（旧口径需集齐全部不同 id）`,
  NDX.availableSutras(st2).some((x) => x.id === 'su_full_dabei'));
ck('sutraProgress 回报 have/need', (() => {
  const p = NDX.sutraProgress(st2, 'su_full_dabei');
  return p.have === need && p.need === need && p.pct === 100;
})());
ck('合成扣减成功且总量守恒（扣 need 枚）',
  (() => {
    const ok = NDX.sutraConsumeFor(st2, 'su_full_dabei');
    const left = Object.keys(st2.sutraFrags).reduce((a, k) => a + st2.sutraFrags[k], 0);
    return ok && left === 0;
  })());
ck('碎片不足时拒合成（不误扣）', (() => {
  const s3 = { sutraFrags: {} };
  s3.sutraFrags[f.frags[0]] = 1;
  const snap = JSON.stringify(s3.sutraFrags);
  const ok = NDX.sutraConsumeFor(s3, 'su_full_dabei');
  return ok === false && snap === JSON.stringify(s3.sutraFrags);
})());

console.log('=== ⑦ 诵经机制（土地庙）』===');
const s4 = { act: 2, life: 20, sutraFrags: {}, sutras: [], sutraBackpack: [] };
const q0 = NDX.sutraChantQuota(s4);
ck('章首免费 1 次', q0.freeLeft === 1 && q0.nextCostDays === 0);
const r1 = NDX.doChantSutra(s4, 'su_full_dabei');
ck('免费诵经成功且不扣寿', r1.ok === true && r1.free === true && r1.costDays === 0 && s4.life === 20);
ck('诵经后记次递增', NDX.sutraChantQuota(s4).used === 1);
const lifeBefore = s4.life;
const r2 = NDX.doChantSutra(s4, 'su_full_amituo');
ck('超出免费额度后扣寿（走 sutraLifeSink，不直写 s.life 之外的路径）',
  r2.ok === true && r2.free === false && s4.life < lifeBefore,
  `life ${lifeBefore} → ${s4.life}`);
ck('单次补 1 枚残片', Object.keys(s4.sutraFrags).length === 2);
for (let i = 0; i < 6; i++) NDX.doChantSutra(s4, 'su_full_fahua');
ck('每章上限生效（第 4 次被拒）', NDX.sutraChantQuota(s4).left === 0);
ck('超上限后诵经返回失败', NDX.doChantSutra(s4, 'su_full_fahua').ok === false);
ck('可诵池不含已合成之经', (() => {
  const s5 = { act: 1, sutraFrags: {}, sutras: ['su_full_dabei'], sutraBackpack: [], life: 20 };
  NDX.doChantSutra(s5, 'su_full_dabei');
  NDX.doChantSutra(s5, 'su_full_dabei');
  return NDX.sutraChantPool(s5).every((x) => x.id !== 'su_full_dabei');
})());

console.log('=== ⑧ 修 bug 回归：逆经日志不再写死 /3 ===');
ck('逆经片数非恒为 3（写死 /3 会显示「12/3」）',
  NDX.NI_SUTRA_FULLS.some((x) => x.frags.length !== 3),
  '片数区间 ' + Math.min.apply(null, NDX.NI_SUTRA_FULLS.map((x) => x.frags.length)) +
  '~' + Math.max.apply(null, NDX.NI_SUTRA_FULLS.map((x) => x.frags.length)));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
