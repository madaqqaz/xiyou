// _verify_sutra_wrapped.js — 包裹型（技能变更性）经文门禁（V9.68）
// 断言：① 包裹型经**必须是少数**（34 部全带是 2026-09-28 已定位的缺陷，不得复发）；
//       ② 每条包裹型 mod 字段在战斗内核**真接线**（真跑战斗实锤，非源码文本计数）；
//       ③ 两条封顶（atkToShield 0.35 / counter 0.40）在数据层已钉住；
//       ④ 未装包裹型经 ⇒ 战斗结果零回归；
//       ⑤ 反证：掐掉内核接线后 ②④ 必须判红（证明本门禁不是恒真空断言）。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 自动收录。
//
// 🔴 本门禁的两个「反证必须真的能红」要点（2026-09-28 定稿）：
//   · 反证要**改源码文本**后重跑实锤（把 `_wrapped && _wrapped.atkToShield &&` 打成 `false &&`），
//     而不是去找注释里有没有这个标识符 —— 后者会被「注释里写了同名词」骗过（X4 弱门禁老毛病）。
//   · 断言匹配**调用式**：正则须命中 `_wrapped.atkToShield` 这种真实读取形态。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
// ── 沙箱 A：只装经文真源（派生判据 / 封顶 / mod 表都在这里）──
const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math, Object: Object, Array: Array, JSON: JSON };
vm.createContext(sandbox);
['js/data_core.js', 'js/data.js', 'js/data_sutra.js'].forEach((f) => {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox); }
  catch (e) { /* data_core.js 不存在时忽略 */ }
});
const NDX = win.NDX;

let pass = 0, fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? '  → ' + extra : '')); }
};

const all = [].concat(NDX.SUTRA_FULLS || [], NDX.NI_SUTRA_FULLS || []);
const wrappedIds = all.filter((f) => NDX.isWrappedSutra(f.id)).map((f) => f.id);
const wrappedSet = new Set(wrappedIds);

// ============================================================
// A 组：包裹型必须是「少数派」——这是用户 2026-09-28 原始诉求（34/34 全带是缺陷）
// ============================================================
console.log('--- A 组：规模与派生 ---');
ok(typeof NDX.isWrappedSutra === 'function', 'A1 NDX.isWrappedSutra 已导出（派生判据，非手写清单）');
ok(typeof NDX.jingWrappedMods === 'function', 'A2 NDX.jingWrappedMods 已导出（内核侧唯一读取口）');
ok(typeof NDX.wrappedSutraKinds === 'function', 'A3 NDX.wrappedSutraKinds 已导出（族判据）');
ok(all.length >= 30 && wrappedIds.length > 0 && wrappedIds.length < all.length,
  'A4 包裹型经应为少数派（既非空集、也非全部）：' + wrappedIds.length + ' / ' + all.length,
  '全部 ' + all.length + ' 部都判包裹型 ⇒ 「技能变更性」又退化成 chantSkill!==null 的别名');
ok(NDX.wrappedSutraKinds().length <= 3,
  'A5 包裹型族数 ≤3（行为改写级效果天然少而精）：' + NDX.wrappedSutraKinds().join(', '));
{
  // 漂移守卫：给某个未注册的 kind 手工加包裹键 ⇒ isWrappedSutra 必须立刻认
  const before = NDX.isWrappedSutra('su_full_xinjing');
  const bak = NDX.JING_KIND_MOD['zen-heal'].mod;
  NDX.JING_KIND_MOD['zen-heal'].mod = Object.assign({}, bak, { counter: 0.20 });
  const after = NDX.isWrappedSutra('su_full_xinjing');
  NDX.JING_KIND_MOD['zen-heal'].mod = bak;
  ok(before === false && after === true,
    'A6 漂移守卫：给 kind 补包裹键后 isWrappedSutra 立即为真（防「注册了却不判包裹」）',
    'before=' + before + ' after=' + after);
}

// ============================================================
// B 组：封顶 — 包裹型是「行为改写」级效果，系数失控会直接废掉普攻
// ============================================================
console.log('--- B 组：封顶 ---');
{
  const cap = NDX.SUTRA_WRAP_CAP || {};
  ok(cap.atkToShield === 0.35, 'B1 atkToShield 封顶 = 0.35（普攻永不归零）', String(cap.atkToShield));
  ok(cap.counter === 0.40, 'B2 counter 封顶 = 0.40（与 V9.60 COUNTER_CAP 同值）', String(cap.counter));
  let over = [];
  Object.keys(NDX.JING_KIND_MOD || {}).forEach((k) => {
    const m = (NDX.JING_KIND_MOD[k] || {}).mod || {};
    if (typeof m.atkToShield === 'number' && m.atkToShield > cap.atkToShield) over.push(k + '.atkToShield=' + m.atkToShield);
    if (typeof m.counter === 'number' && m.counter > cap.counter) over.push(k + '.counter=' + m.counter);
  });
  ok(over.length === 0, 'B3 所有注册族的包裹系数不超封顶', over.join(' ; '));
}

// ============================================================
// C 组：战斗内核实锤（真跑 calcCombat，不读源码文本）
// ============================================================
// 加载顺序照抄 index.html —— data_sutra.js / combat_part1.js 之外的层（HEROES 等）必须同序，
// 否则 calcCombat 里 `NDX.HEROES[player.heroId]` 直接抛 ⇒ 静默假绿（MEMORY §2 铁律）。
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const loadOrder = [];
html.replace(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g, (m, u) => {
  if (/^(https?:)?\/\//.test(u)) return m;
  loadOrder.push(u.replace(/^\.?\//, '').split('?')[0]);
  return m;
});

// 构建一个「战斗用」沙箱：src 可注入（反证时换成改过的源码）
function buildCombatSandbox(mutateSrc) {
  const w = {};
  const sb = { NDX: {}, window: w, console: console, Math: Math, Object: Object, Array: Array, JSON: JSON, Date: Date };
  vm.createContext(sb);
  loadOrder.forEach((u) => {
    const p = path.join(ROOT, u);
    if (!fs.existsSync(p)) return;
    let code = fs.readFileSync(p, 'utf8');
    if (/combat_part1\.js$/.test(u) && mutateSrc) code = mutateSrc(code);
    try { vm.runInContext(code, sb, { filename: u }); } catch (e) { /* 非战斗链可容忍 */ }
  });
  return w.NDX;
}

const BASE_PLAYER = {
  heroId: 'wukong',
  ti: { atk: 420, maxHp: 3000, hp: 3000, dr: 0, eva: 0, cri: 0.1, criMult: 1.6, hit: 1, blk: 0, counter: 0 },
  yuan: { matk: 0, mdef: 0 },
  jingSlots: { atk: null, chant: null },
  fateFlags: {}, daoAtk: null,
};
const BASE_MON = { name: '白骨精', hp: 999999, atk: 300, matk: 80, dr: 0.05, mdef: 0, spd: 8, counter: 0 };
function runBattle(NDXx, sutraId, slot, rounds) {
  const p = JSON.parse(JSON.stringify(BASE_PLAYER));
  if (sutraId) p.jingSlots[slot || 'chant'] = sutraId;
  const out = { NDX: NDXx, Math: Math, console: console, Object: Object, Array: Array, JSON: JSON };
  vm.createContext(out);
  vm.runInContext(
    '__r = NDX.calcCombat(__p, __m, {maxRounds: ' + (rounds || 30) + '});',
    Object.assign(out, { __p: p, __m: JSON.parse(JSON.stringify(BASE_MON)) })
  );
  const r = out.__r;
  let dmg = 0, riposte = 0, roundsUsed = 0, shield = 0, shieldRounds = 0;
  (r.roundsDetail || []).forEach((t) => {
    roundsUsed++;
    if (t.pTurn) dmg += (t.pTurn.deal || 0);
    if (t.mTurn) riposte += (t.mTurn.counterRiposte || 0);
    // 🆕 V9.69：护盾侧观测点（atkToShield 的唯一直接证据 —— 见 C1 组注释）
    const _sh = t.shieldAfter || 0;
    shield += _sh;
    if (_sh > 0) shieldRounds++;
  });
  return { dmg: dmg, riposte: riposte, rounds: roundsUsed, shield: shield, shieldRounds: shieldRounds, raw: r };
}

console.log('--- C 组：内核实锤 ---');
function cmp(prefix, label, cond, extra) { ok(cond, prefix + ' ' + label, extra); }

{
  // C1 舍攻为盾（V9.68 实锤）· 判据＝**回合末护盾**（roundsDetail[].shieldAfter 求和）
  //   🔴 2026-09-29 更正：本条原用「单回合伤害下探率 rate = 1-(d1/r1)/(d0/r0)」，实测证明那是
  //      **噪声主导的代理指标**，测的根本不是 atkToShield：
  //      · 装 fanwang 后总伤害只降 0.85%（该经的 def 被动把伤害补了回来）；
  //      · 但回合数从 140 涨到 175 ⇒ 旧的 rate 恰好把「回合数变多」读成「单回合伤害下探 22%」；
  //      · 这也是 D1 反证偶发 9.3% 抖动的根因（噪声尾巴越过 8% 容差）。
  //      真正零噪声的观测点：`deal -= _trim; shield += _trim` 是同一笔账 —— 护盾不可能凭空出现，
  //      所以「带盾回合 > 0」就是 atkToShield 生效的决定性证据（噪声恒 0，无需放宽容差）。
  const N0 = buildCombatSandbox(null);
  const N1 = buildCombatSandbox(null);
  let s0 = 0, s1 = 0, w0 = 0, w1 = 0;
  const S = 8;
  for (let i = 0; i < S; i++) {
    const a = runBattle(N0, null, null, 30); s0 += a.shield; w0 += a.shieldRounds;
    const b = runBattle(N1, 'su_full_fanwang', 'chant', 30); s1 += b.shield; w1 += b.shieldRounds;
  }
  cmp('C1', '舍攻为盾：装包裹型经后必须出现回合末护盾（atkToShield 实锤）', s1 > 0 && w1 > 0,
    '无经 Σ盾=' + s0 + '(带盾回合 ' + w0 + ') / 有经 Σ盾=' + s1 + '(带盾回合 ' + w1 + ') · ' + S + ' 局');
  cmp('C1b', '舍攻为盾零回归：不装包裹型经时护盾恒零', s0 === 0 && w0 === 0, '对照组 Σ盾=' + s0 + ' 带盾回合=' + w0);
}
// C1c 零回归：非包裹型经（ glut-ton 噬血 · veil-mantra 破相 ）装备后同样不得产生护盾
{
  const N0 = buildCombatSandbox(null);
  let bad = [];
  ['su_full_wuliangshou', 'su_full_wuzi'].forEach((id) => {
    const kind = (NDX.sutraFullById(id) || NDX.niSutraFullById(id) || {}).chantSkill;
    const slot = (NDX.JING_KIND_MOD[(kind || {}).kind] || {}).slot || 'chant';
    let sh = 0;
    for (let i = 0; i < 4; i++) sh += runBattle(N0, id, slot, 30).shield;
    if (sh > 0) bad.push(id + '(Σ盾=' + sh + ')');
  });
  ok(bad.length === 0, 'C1c 零回归：部非包裹型经装备后不产生舍攻为盾护盾', bad.join(', '));
}
{
  // C2 被动反击：装 war-buff 经后必须出现 counterRiposte
  const N0 = buildCombatSandbox(null);
  const N1 = buildCombatSandbox(null);
  let c0 = 0, c1 = 0;
  for (let i = 0; i < 8; i++) {
    c0 += runBattle(N0, null, null, 30).riposte;
    c1 += runBattle(N1, 'su_full_yuanjue', 'atk', 30).riposte;
  }
  cmp('C2', '被动反击：war-buff 经装备后战斗出现反击伤害', c1 > 0, '无经=' + c0 + ' 有经=' + c1);
  cmp('C2b', '被动反击：未装包裹型经时零反击（零回归）', c0 === 0, '对照组反击量=' + c0);
}
{
  // C3 零回归：**非包裹型**经装备后，包裹层必须返回 null（内核新分支不可达）。
  //   ⚠ 判据不能取「战斗回合数相同」——非包裹型经的 def 被动（dr/hp/eva…）本来就会改回合数，
  //     拿回合数当回归判据会把「经位被动正常生效」误报成缺陷。
  const N0 = buildCombatSandbox(null);
  const nonWrapped = all.filter((f) => !wrappedSet.has(f.id)).map((f) => f.id);
  let bad = [];
  nonWrapped.forEach((id) => {
    const st = { jingSlots: { atk: null, chant: null } };
    const kind = (NDX.sutraFullById(id) || NDX.niSutraFullById(id) || {}).chantSkill;
    const slot = (NDX.JING_KIND_MOD[(kind || {}).kind] || {}).slot || 'chant';
    st.jingSlots[slot] = id;
    if (NDX.jingWrappedMods(st) !== null) bad.push(id);
  });
  ok(bad.length === 0,
    'C3 零回归：' + nonWrapped.length + ' 部非包裹型经装备后 jingWrappedMods 恒为 null',
    '误判为包裹型的：' + bad.join(', '));
  // 战斗侧只钉「不产生反击」这条硬底线
  let rip = 0;
  for (let i = 0; i < 4; i++) rip += runBattle(N0, 'su_full_wuliangshou', 'atk', 30).riposte;
  ok(rip === 0, 'C3b 零回归：非包裹型经（ glut-ton 噬血 ）不产生反击', '反击量=' + rip);
}

// ============================================================
// D 组：反证 — 掐掉内核接线后，上面两条实锤必须判红
// ============================================================
console.log('--- D 组：反证（改源码后必须红）---');
{
  // D1 掐掉 atkToShield 接线
  const Nm = buildCombatSandbox((src) => src.replace('_wrapped && _wrapped.atkToShield &&', 'false &&'));
  ok(Nm != null && typeof Nm.calcCombat === 'function', 'D1 反证可构建（ mutated combat_part1 可加载）');
  if (Nm && typeof Nm.calcCombat === 'function') {
    // 🔴 判据同样用「回合末护盾」而非伤害比率（理由见 C1 组注释）：护盾零噪声 ⇒ 反证**必然**严格命中。
    let sh = 0;
    for (let i = 0; i < 8; i++) sh += runBattle(Nm, 'su_full_fanwang', 'chant', 30).shield;
    ok(sh === 0,
      'D1 反证：掐掉 atkToShield 接线后必须零护盾（本断言应「绿」= 反证成立）',
      '掐线后 Σ盾=' + sh + '（非 0 ⇒ atkToShield 不是护盾的唯一成因）');
  }
}
{
  // D2 掐掉 counter 接线
  const Nm = buildCombatSandbox((src) => src.replace('((_wrapped && _wrapped.counter) || 0)', '0'));
  if (Nm && typeof Nm.calcCombat === 'function') {
    let c1 = 0;
    for (let i = 0; i < 8; i++) c1 += runBattle(Nm, 'su_full_yuanjue', 'atk', 30).riposte;
    ok(c1 === 0, 'D2 反证：掐掉 counter 接线后必须零反击（本断言应「红」= 反证成立）', '仍有 ' + c1);
  }
}
{
  // D3 源码级：两处读取必须以「调用/取值」形态出现（防注释假绿）
  const src = fs.readFileSync(path.join(ROOT, 'js', 'combat_part1.js'), 'utf8');
  function _re(k) { return new RegExp('_wrapped\\s*&&\\s*_wrapped\\.' + k).test(src); }
  ok(_re('atkToShield'), 'D3 反证：源码含 `_wrapped.atkToShield` 真实取值形态（匹配调用式而非注释）');
  ok(_re('counter'), 'D4 反证：源码含 `_wrapped.counter` 真实取值形态');
}

// ============================================================
// E 组（V9.69）：包裹型「优先投放」—— 三选一的保底席
//   用户拍板「技能变更性经文优先 + 首章不发」，落地为 `sutraDropChoices` 的 1 个保底席位。
// ============================================================
console.log('--- E 组：包裹型保底席 ---');
function sampleChoices(Nm, side, act, n) {
  const s = { sutraFrags: {}, niSutraFrags: {}, sutras: [], niSutras: [], sutraBackpack: [], fate: {} };
  let pickedWithWrap = 0, ids = 0, wrapIds = 0, rounds = 0;
  for (let i = 0; i < n; i++) {
    const c = Nm.sutraDropChoices(s, side, act) || [];
    rounds++;
    if (c.some((id) => wrappedSet.has(id))) pickedWithWrap++;
    c.forEach((id) => { ids++; if (wrappedSet.has(id)) wrapIds++; });
  }
  return { rounds, pickedWithWrap, rate: ids ? wrapIds / ids : 0, ids, wrapIds };
}
{
  const Nm = buildCombatSandbox(null);
  // E1 首章不发 + ch2 起 1 席
  ok(!(Nm.sutraWrapGuarantee && Nm.sutraWrapGuarantee(1)), 'E1 首章不发：sutraWrapGuarantee(1) 应为 0');
  ok(Nm.sutraWrapGuarantee && Nm.sutraWrapGuarantee(2) === Nm.SUTRA_WRAP_GUARANTEE && Nm.SUTRA_WRAP_GUARANTEE === 1,
    'E1b 第 2 章起每章 1 个保底席', 'guarantee(2)=' + (Nm.sutraWrapGuarantee && Nm.sutraWrapGuarantee(2)));
  ok(Nm.sutraWrapGuarantee && Nm.sutraWrapGuarantee(0) === 0 && Nm.sutraWrapGuarantee(-1) === 0,
    'E1c 越界/未定章号不发保底（构造性零回归）');
  // E2 保底池：跨章 + 排除华严 + 完成后出池
  const cross = Nm.sutraWrappedCrossPool ? Nm.sutraWrappedCrossPool('ferry', {}) : null;
  ok(Array.isArray(cross) && cross.length > 0, 'E2 保底池非空（跨章）', '实际 ' + (cross && cross.length));
  ok(!!cross && cross.indexOf('su_full_huayan') < 0, 'E2b 华严不蹭保底席（走 HUAYAN_QUOTA 低频专属通道）');
  ok(!!cross && cross.every((id) => wrappedSet.has(id)),
    'E2c 保底池内的每一部都必须是包裹型经', (cross || []).filter((id) => !wrappedSet.has(id)).join(','));
  const doneS = { sutraFrags: {}, niSutraFrags: {}, sutras: ['su_full_fanwang'], niSutras: [], sutraBackpack: [] };
  const crossDone = Nm.sutraWrappedCrossPool('ferry', doneS) || [];
  ok(crossDone.indexOf('su_full_fanwang') < 0 && crossDone.length === cross.length - 1,
    'E2d 已完成（含待投背包）经自动出保底池',
    'cross(done)=' + crossDone.join(',') + '（应比空档少恰好 1 部 fanwang）');
  // E3 实锤：ch2~ch9 每次三选一必含 ≥1 部包裹型（首章不发 ⇒ ch2 起）
  let miss = [];
  for (let a = 2; a <= 9; a++) {
    const r = sampleChoices(Nm, 'ferry', a, 40);
    if (r.pickedWithWrap < r.rounds) miss.push('ch' + a + '(' + r.pickedWithWrap + '/' + r.rounds + ')');
  }
  ok(miss.length === 0, 'E3 包裹型优先实锤：第 2~9 章每次三选一都含 ≥1 部包裹型（40 次 × 8 章）', miss.join(' '));
  // E4 逆侧同样生效
  const rn = sampleChoices(Nm, 'rebel', 5, 40);
  ok(rn.pickedWithWrap >= rn.rounds, 'E4 逆侧三选一同样含 ≥1 部包裹型', rn.pickedWithWrap + '/' + rn.rounds);
  // E5/E6 反证（V9.70 二次改写 · **确定性穷举**，替掉会抖的概率抽样）：
  //   🩸 上一版是 `N_S=200` 抽样后断言「关保底漏网率 > 2%」，实测该比例在 **1.0%~3.0%** 之间跳，
  //      连跑 5 次 4 绿 1 红 ⇒ 是断言本身不稳，不是代码回归；靠调阈值迁就不解决，只能改判据形态。
  //   ✅ 改法：**钉住随机源** `runWeightedPick = () => k` 且 `runRandom = () => 0.5`（`sutraDropChoices`
  //      第 437 行对越界 k 会回落到 `runRandom`，不一起钉住就不是逐位确定的），再对
  //      `act∈[2,9] × k∈[0,64)` 穷举，找**结构性 witness**：关保底 ⇒ 0 部包裹型，开保底 ⇒ ≥1 部。
  //      找到 witness 即"保底是包裹型的唯一来源"被构造性证明，且与随机种子、与机器速度都无关。
  //      实测 witness：ch2 k=5/6/11/12/13/26、ch3 k=32/36、ch4 k=22、ch5 k=20/29、ch6 k=22、ch9 k=26。
  const sFlat = { sutraFrags: {}, niSutraFrags: {}, sutras: [], niSutras: [], sutraBackpack: [], flags: {}, fate: {} };
  const _oW = Nm.runWeightedPick, _oR = Nm.runRandom, _oG = Nm.sutraWrapGuarantee;
  const probeAt = (act, k, g) => {
    Nm.runWeightedPick = function () { return k; };
    Nm.runRandom = function () { return 0.5; };
    if (g != null) Nm.sutraWrapGuarantee = function () { return g; };
    return (Nm.sutraDropChoices(sFlat, 'ferry', act) || []).filter((id) => wrappedSet.has(id)).length;
  };
  const witnesses = [];
  for (let a = 2; a <= 9; a++) {
    for (let k = 0; k < 64; k++) {
      const off = probeAt(a, k, 0);
      if (off !== 0) continue;
      const on = probeAt(a, k, 1);
      if (on >= 1) witnesses.push({ act: a, k: k, on: on });
    }
  }
  Nm.runWeightedPick = _oW; Nm.runRandom = _oR; Nm.sutraWrapGuarantee = _oG;
  const _ws = witnesses.map((w) => 'ch' + w.act + '/k' + w.k + '(开保底→' + w.on + '部)').join(' ');
  ok(witnesses.length > 0,
    'E5 反证（确定性）：必须存在「关掉保底 ⇒ 三选一零包裹型」的抽取序列（本断言应「绿」= 反证成立）',
    witnesses.length ? _ws : 'act2~9 × k0~63 穷举无 witness ⇒ 宽面已必含包裹型，保底可能是冗余代码');
  ok(witnesses.every((w) => w.on >= 1 && w.on > 0),
    'E6 反证：每个 witness 处开启保底后包裹型数 ≥1（保底确有边际价值，不是空转）', _ws);
  // 🩸 确定性自证：重跑一遍穷举必须拿到完全相同的 witness 集合（若不一样，说明上面还有没钉住的随机源）
  const _oW2 = Nm.runWeightedPick, _oR2 = Nm.runRandom, _oG2 = Nm.sutraWrapGuarantee;
  const again = [];
  for (let a = 2; a <= 9; a++) {
    for (let k = 0; k < 64; k++) {
      const off = probeAt(a, k, 0);
      if (off === 0 && probeAt(a, k, 1) >= 1) again.push(a + ':' + k);
    }
  }
  Nm.runWeightedPick = _oW2; Nm.runRandom = _oR2; Nm.sutraWrapGuarantee = _oG2;
  ok(again.join(',') === witnesses.map((w) => w.act + ':' + w.k).join(','),
    'E6b 确定性自证：穷举两轮 witness 集合完全一致（钉住随机源有效，断言不再抖）',
    '一轮 ' + witnesses.length + ' 个 / 二轮 ' + again.length + ' 个');
  ok(witnesses.every((w) => w.on <= Nm.SUTRA_WRAP_MAX_PER_SIDE),
    'E6c 保底不超额：witness 处包裹型数不超过单侧投放配额 ' + Nm.SUTRA_WRAP_MAX_PER_SIDE, _ws);
  // E6 源码级：保底取值必须以调用式出现（防注释假绿 / 防函数从未被调用）
  const src2 = fs.readFileSync(path.join(ROOT, 'js', 'data_sutra.js'), 'utf8');
  ok(/NDX\.sutraWrappedCrossPool\s*\(/.test(src2) && /NDX\.sutraWrapGuarantee\s*\(/.test(src2),
    'E6 保底段在 sutraDropChoices 内真实取值（匹配调用式 `NDX.x(`）');
  ok(/sutraWrapGuarantee\s*=\s*function/.test(src2) && /sutraWrappedCrossPool\s*=\s*function/.test(src2),
    'E6b 两个派生函数已定义（非一次性 IIFE，门禁可实时重算）');
}

// ============================================================
// F 组：包裹型的「玩家可见」徽标（V9.70）——行为改写不能只藏在抽取概率里
// ============================================================
console.log('--- F 组：可见化（派生 + UI 消费 + 反证）---');
ok(typeof NDX.sutraWrapTagText === 'function' && typeof NDX.sutraWrapBadgeHtml === 'function',
  'F1 徽标派生已导出（sutraWrapTagText / sutraWrapBadgeHtml）');
{
  // 真调：包裹型→非空、非包裹型→空串（不是读源码文本）
  const _wBadge = NDX.sutraWrapBadgeHtml(wrappedIds[0]);
  const _nbId = all.map((f) => f.id).find((id) => !wrappedSet.has(id));
  const _nBadge = _nbId ? NDX.sutraWrapBadgeHtml(_nbId) : '（无非包裹型样本）';
  ok(!!_wBadge && _wBadge.indexOf(NDX.SUTRA_WRAP_TAG) >= 0 && _wBadge.indexOf('sutra-wrap-badge') >= 0,
    'F2 真调：包裹型经的徽标 HTML 非空且含类名', _wBadge);
  ok(_nbId ? (_nBadge === '') : true,
    'F3 真调：非包裹型经的徽标为空串（UI 拼接零副作用）', '样本=' + _nbId + ' 值=' + JSON.stringify(_nBadge));
}
{
  // 真反证：把判据打成恒 false ⇒ 全场徽标必须消失（证明徽标真的由判据驱动，不是写死清单）
  const w2 = {};
  const sb2 = { NDX: {}, window: w2, console: { log() {}, warn() {}, error() {} }, Math: Math, Object: Object, Array: Array, JSON: JSON };
  vm.createContext(sb2);
  ['js/data_core.js', 'js/data.js', 'js/data_sutra.js'].forEach((f) => {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb2); } catch (e) {}
  });
  const N2 = w2.NDX;
  N2.isWrappedSutra = function () { return false; };
  const anyBadge = wrappedIds.some((id) => N2.sutraWrapBadgeHtml(id) !== '');
  ok(!anyBadge, 'F4 反证：掐掉包裹型判据后徽标必须全部消失（本断言应「绿」= 反证成立）');
}
{
  // 消费端实锤：UI 必须真调用（匹配调用式，防「定义了没人用」的死派生）
  const uiSrc = fs.readFileSync(path.join(ROOT, 'js', 'ui', 'ui_panel_2.js'), 'utf8');
  const calls = (uiSrc.match(/NDX\.sutraWrapBadgeHtml\s*\(/g) || []).length;
  ok(calls >= 2, 'F5 消费端实锤：ui_panel_2.js 中 NDX.sutraWrapBadgeHtml( 调用点 ≥2（合本列表 + 经位目录）',
    '实际 ' + calls + ' 处');
  ok(/class="sutra-wrap-badge"|sutra-wrap-badge/.test(NDX.sutraWrapBadgeHtml(wrappedIds[0]))
     && fs.readFileSync(path.join(ROOT, 'css', 'style.css'), 'utf8').indexOf('.sutra-wrap-badge') >= 0,
    'F6 徽标有样式落点（CSS 含 .sutra-wrap-badge，避免「有标记无外观」）');
}

// ============================================================
// G 组：候选面放宽（V9.70）——解「六道倾向 / 权重恒不生效」的结构性死代码
// ============================================================
console.log('--- G 组：候选面与权重（真跑 + 反证）---');
{
  // ⚠ 必须用**全量沙箱**（NDX.runRandom 由 engine 层注入，只装 data_sutra 的小沙箱里没有 ⇒ 会直接抛）
  const Nm = buildCombatSandbox(null);
  const sEmpty = { sutraFrags: {}, niSutraFrags: {}, sutras: [], niSutras: [], sutraBackpack: [], flags: {}, fate: {} };
  const seenAt = (act) => {
    const seen = {};
    for (let i = 0; i < 60; i++) (Nm.sutraDropChoices(sEmpty, 'ferry', act) || []).forEach((x) => { seen[x] = 1; });
    return Object.keys(seen);
  };
  const seen = seenAt(4);
  ok(seen.length >= NDX.SUTRA_PICK_WIDE - 1,
    'G1 真跑：放宽后候选面 ≥ 池宽（6），抽 3 才是「取舍」而非「全取」', '实测 ' + seen.length + ' 部可中');
  const _ow = Nm.SUTRA_PICK_WIDE;
  Nm.SUTRA_PICK_WIDE = 0;                        // 反证：退回旧行为（章池恒 3 ⇒ while 一次全取）
  const seenOff = seenAt(4);
  const _chap = (NDX.sutraRegionPool(4) || []).slice();
  //   🔴 断言要写「真实现状」而非「理想现状」：关掉放宽后候选**并非**恒 ⊆ 本章池 ——
  //      V9.69 的保底席本来就是跨章的，它会把 1 席换成跨章包裹型经。所以正确的形态是
  //      「抽 3 恒等于全取（集合规模恒 3）」+「至多 1 部来自跨章保底池」。
  const _cross = (Nm.sutraWrappedCrossPool ? Nm.sutraWrappedCrossPool('ferry', sEmpty) : []);
  ok(seenOff.length === 3 && seenOff.every((x) => _chap.indexOf(x) >= 0 || _cross.indexOf(x) >= 0),
    'G2 反证：关掉放宽后抽 3 恒为全取、且跨章部数 ≤ 保底席数（本断言应「绿」= 反证成立）',
    '关掉时可达 ' + seenOff.length + ' 部 · ' + seenOff.join(','));
  Nm.SUTRA_PICK_WIDE = _ow;

  // G3/G4：本地保底席（V9.70）—— 放宽后必须有「本章经至少 1 席」的**结构性保证**，
  //   否则纯加权抽 3 会经常一部本章经都不中，章池（地域叙事载体）事实上被架空。
  //   ⚠ 踩坑：常量必须改在**跑代码的那个 NDX** 上（这里是 Nm），改文件级 `NDX`（小沙箱那份）
  //     会静默写到另一个对象 ⇒ 反证恒不成立（实测 mult=1 与 mult=3 都是 30%左右，毫无差别）。
  const localSeats = (seat, n) => {
    const _os = Nm.SUTRA_PICK_LOCAL_SEAT;
    if (seat != null) Nm.SUTRA_PICK_LOCAL_SEAT = seat;
    let zero = 0, sum = 0;
    for (let i = 0; i < n; i++) {
      const c = Nm.sutraDropChoices(sEmpty, 'ferry', 4) || [];
      const k = c.filter((x) => _chap.indexOf(x) >= 0 || x === 'su_full_huayan').length;
      if (k === 0) zero++;
      sum += k;
    }
    Nm.SUTRA_PICK_LOCAL_SEAT = _os;
    // 🩸 判据要用**每样本席数**而不是「席数/总席数」：后者把 3 席当分母，
    //   「每次恰 1 席」会被读成 33%（V9.70 初版 G4b 就这样把结构性保证误判成越界）。
    return { zeroRate: zero / n, mean: sum / n, seats: n };
  };
  const L_on = localSeats(1, 200), L_off = localSeats(0, 200);
  ok(L_on.zeroRate === 0, 'G3 实锤：本地保底席开启后「零本章经」必须为 0（结构性保证，非概率）',
    '200 次中零本地席 ' + (L_on.zeroRate * 100).toFixed(1) + '%');
  ok(L_off.zeroRate > 0.05 && L_on.zeroRate < L_off.zeroRate,
    'G4 反证：关掉本地保底席后必须出现「零本章经」（本断言应「绿」= 反证成立）',
    '关掉时零本地席率 ' + (L_off.zeroRate * 100).toFixed(1) + '% → 开启时 ' + (L_on.zeroRate * 100).toFixed(1) + '%');
  ok(L_on.mean >= 1.0 - 1e-9 && L_on.mean <= 2.5,
    'G4b 本地席不越界：本章经平均占 ' + L_on.mean.toFixed(2) + ' 席/次',
    '区间应为 [1.00, 2.50] 席（≥1＝结构保证生效，≤2.5＝没把 3 席全吃掉）');
  //   LOCAL_MULT 只在「本地席」内部调权重：它决定的是**本章内部 3 部之间的相对高低**，
  //   不再决定「本章 vs 跨章」的边界（边界已由本地保底席结构性钉住），故不再单独做占比断言。

  // G5 条件断言：经文一旦有了多道标签，六道权重必须真有区分度（现在标签全同 ⇒ 本条只是事实记录）
  const daoSet = Array.from(new Set(all.map((f) => (NDX.sutraDaoOf ? NDX.sutraDaoOf(f.id) : null)).filter(Boolean)));
  if (daoSet.length > 1) {
    let hiMain = 0;
    for (let i = 0; i < 200; i++) {
      (Nm.sutraDropChoices(sEmpty, 'ferry', 4) || []).forEach((x) => {
        if (NDX.sutraDaoOf(x) === daoSet[0]) hiMain++;
      });
    }
    ok(hiMain / 600 > 1 / all.length, 'G5 条件断言：多道标签下主道经抽中率必须高于均匀（真跑实锤）',
      '主道经 ' + (hiMain / 600 * 100).toFixed(1) + '%');
  } else {
    ok(true, 'G5 条件断言：当前经文六道标签全同为「' + daoSet.join('/') + '」⇒ 六道权重对集合零区分度'
      + '（已由 data_sutra.js 注释与本报告记录；要给经文打六道标签方可激活）');
  }
}

// ============================================================
// H 组：投放配额 + 招式包双留（V9.70 用户拍板 A / 「按建议来」）
// ============================================================
console.log('--- H 组：投放配额 / 招式包双留 ---');
{
  // H1/H2：每侧「可投放」包裹型配额。华严不占配额（走 HUAYAN_QUOTA 专属通道，不在保底池）。
  const _ex = NDX.SUTRA_WRAP_EXCLUDE || [];
  const _sideWrapped = () => (NDX.SUTRA_FULLS || [])
    .filter((f) => NDX.isWrappedSutra(f.id) && _ex.indexOf(f.id) < 0).length;
  const _sideWrappedNi = () => (NDX.NI_SUTRA_FULLS || [])
    .filter((f) => NDX.isWrappedSutra(f.id) && _ex.indexOf(f.id) < 0).length;
  const _maxOk = (m) => _sideWrapped() <= m && _sideWrappedNi() <= m;
  const _max = NDX.SUTRA_WRAP_MAX_PER_SIDE || 8;
  ok(_maxOk(_max),
    'H1 每侧可投放包裹型 ≤ SUTRA_WRAP_MAX_PER_SIDE(' + _max + ')',
    '渡 ' + _sideWrapped() + ' / 逆 ' + _sideWrappedNi() + '（未排除华严前各再多 1 部）');
  //   🩸 反证必须真能红：把上限砍到 4 ⇒ 渡 8 > 4 必须判红。若这条仍绿，说明 H1 是恒真空断言。
  const _bak = NDX.SUTRA_WRAP_MAX_PER_SIDE;
  NDX.SUTRA_WRAP_MAX_PER_SIDE = 4;
  const _red = !_maxOk(4);
  NDX.SUTRA_WRAP_MAX_PER_SIDE = _bak;
  ok(_red, 'H2 反证：上限砍到 4 必须判红（本断言应「绿」= 反证成立）',
    '渡 ' + _sideWrapped() + ' / 逆 ' + _sideWrappedNi() + ' 已超 4，若仍判绿 ⇒ H1 是恒真空断言');

  // H3/H4：招式包双留（用户拍板 A —— 包裹效果与招式包并列保留，不是二选一）
  const _noSkill = () => all.filter((f) => !f.chantSkill).map((f) => f.id);
  ok(_noSkill().length === 0,
    'H3 招式包双留：渡/逆全本 100% 带 chantSkill（A 方案，非「只留包裹」也非「全删」）',
    '缺招式包的：' + _noSkill().join(','));
  //   🩸 反证：摘掉一部经的 chantSkill ⇒ H3 必须立刻判红。
  const _bakSkill = (NDX.SUTRA_FULLS[0] || {}).chantSkill;
  if (_bakSkill) {
    delete NDX.SUTRA_FULLS[0].chantSkill;
    const _missing = _noSkill();
    NDX.SUTRA_FULLS[0].chantSkill = _bakSkill;
    ok(_missing.length > 0,
      'H4 反证：摘掉一部经的 chantSkill 后必须判红（本断言应「绿」= 反证成立）',
      '摘了还全绿 ⇒ H3 压根没在检查招式包');
  }
}

console.log('\n=== _verify_sutra_wrapped: ' + pass + ' 通过 / ' + fail + ' 失败 ===');
console.log(fail === 0
  ? 'OK 包裹型经（' + wrappedIds.length + '/' + all.length + ' 部 · 族 ' + NDX.wrappedSutraKinds().join('/') + ' · 内核双接线实锤）'
  : '包裹型经门禁：' + fail + ' 项失败');
process.exit(fail === 0 ? 0 : 1);
