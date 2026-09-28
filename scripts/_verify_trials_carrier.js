// _verify_trials_carrier.js — S11 劫难 81 难 · 承载回归门禁
//
// ⚠ 实现说明（2026-09-27 实测）：`NDX.generateMap(act)` 是**渐进有状态**的——单次首次调 `act=9`
//   只产出第 9 章段（76-81）；只有按 1→9 连续调用才累积出全图。且生成过程受 `_usedEventIds` 等
//   模块级状态影响 ⇒ 「逐章建图断言并集」**不适合**做硬门禁（会随调用顺序/状态抖动）。
//   故本门禁把**确定性不变量**钉死（A/C/D 组），运行时承载仅作**报告**（B 组，不判红）。
//
// 断言：
//   A 难号 ↔ 章 ↔ 范围 三者自洽：∀d∈1..81，TRIAL_LIB[d] 存在、act∈1..9、且 d 落在该章 ACT_RANGES 内
//   C 真源一致：Object.keys(TRIAL_LIB).length === TOTAL_TRIALS === 81
//   D §⑤-4 回归：历难总数读取不得再把 `NDX.TRIALS`（对象）当数组取 `.length`（恒得 0）
// 含反证：越界难号 / 错章样本必须被判据拒斥。
//
// 运行：node scripts/_verify_trials_carrier.js（已登记进 _run_all_gates.js）
'use strict';
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
global.window = global;
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, configurable: true, writable: true });
const _s = {};
global.localStorage = {
  get length() { return Object.keys(_s).length; }, key(i) { return Object.keys(_s)[i] != null ? Object.keys(_s)[i] : null; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(_s, k) ? _s[k] : null; }, setItem(k, v) { _s[k] = String(v); },
  removeItem(k) { delete _s[k]; }, clear() { for (const k of Object.keys(_s)) delete _s[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !['sound.js', 'ui.js', 'main.js'].includes(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const N = global.NDX;

let fail = 0;
const ck = (n, c, extra) => {
  if (c) console.log('ok   ' + n);
  else { console.log('FAIL ' + n + (extra ? '  → ' + extra : '')); fail++; }
};

const TOTAL = N.TOTAL_TRIALS || 81;
const ACTS = N.TOTAL_ACTS || 9;
const RANGES = N.ACT_RANGES || [];
ck('A0 ACT_RANGES 齐备（取不到即失败，防假门禁）', RANGES.length === ACTS, 'n=' + RANGES.length);

const rangeOf = (act) => { const r = RANGES.filter((x) => x.act === act)[0]; return r ? [r.start, r.end] : null; };

// ============ A 组 · 难号 ↔ 章 ↔ 范围 自洽 ============
const LIB = N.TRIAL_LIB || {};
const prob = [];
for (let d = 1; d <= TOTAL; d++) {
  const t = LIB[d];
  if (!t) { prob.push(d + ':缺条目'); continue; }
  const act = t.act;
  if (!(act >= 1 && act <= ACTS)) { prob.push(d + ':章越界(' + act + ')'); continue; }
  const rg = rangeOf(act);
  if (!rg) { prob.push(d + ':章无范围'); continue; }
  if (d < rg[0] || d > rg[1]) prob.push(d + ':章' + act + '范围[' + rg[0] + ',' + rg[1] + ']不含');
}
ck('A1 全部难号满足「有条目 ∧ 章∈1..' + ACTS + ' ∧ 落在本章范围」（81 条全部自洽）',
  prob.length === 0, prob.slice(0, 8).join(' , '));

// 章覆盖：每章至少 1 难
{
  const per = {};
  Object.keys(LIB).forEach((k) => { const a = LIB[k] && LIB[k].act; if (a) per[a] = (per[a] || 0) + 1; });
  const empty = [];
  for (let a = 1; a <= ACTS; a++) if (!per[a]) empty.push(a);
  ck('A2 每章至少承载 1 难（无空章）', empty.length === 0, '空章=' + empty.join(','));
  console.log('     —— 各章难数 ——');
  for (let a = 1; a <= ACTS; a++) {
    const rg = rangeOf(a) || ['-', '-'];
    console.log('     act' + a + ' 范围[' + rg[0] + ',' + rg[1] + '] 条目 ' + String(per[a] || 0).padStart(2) +
      ' ⇒ ' + (per[a] === (rg[1] - rg[0] + 1) ? '满' : '差 ' + ((rg[1] - rg[0] + 1) - (per[a] || 0))));
  }
}

// ============ C 组 · 真源一致 ============
ck('C1 TRIAL_LIB 条目数 === TOTAL_TRIALS === 81',
  Object.keys(LIB).length === TOTAL && TOTAL === 81,
  'lib=' + Object.keys(LIB).length + ' total=' + TOTAL);

// ============ D 组 · §⑤-4 回归 ============
const gr = fs.readFileSync(path.join(ROOT, 'js/game/game_rest.js'), 'utf8')
  .split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
ck('D1 源码（剔注释）无「(NDX.TRIALS || []).length」写法', gr.indexOf('(NDX.TRIALS || []).length') < 0);
ck('D2 源码含真源读取 NDX.TOTAL_TRIALS', gr.indexOf('NDX.TOTAL_TRIALS') >= 0);
ck('D3 `NDX.TRIALS` 确为**对象**（证明把它当数组取 length 恒得 0）',
  !!N.TRIALS && typeof N.TRIALS === 'object' && !Array.isArray(N.TRIALS),
  'type=' + (Array.isArray(N.TRIALS) ? 'array' : typeof N.TRIALS));

// ============ 反证 ============
const okTrial = (d, t) => {
  if (!t) return false;
  const a = t.act;
  if (!(a >= 1 && a <= ACTS)) return false;
  const rg = rangeOf(a);
  return !!rg && d >= rg[0] && d <= rg[1];
};
ck('E1 反证：越界难号(82) 被 A1 判据拒斥', !okTrial(82, { act: 9 }));
ck('E2 反证：错章样本(难 5 标为 act9) 被 A1 判据拒斥', !okTrial(5, { act: 9 }));
ck('E3 反证：合法样本(难 5 标为 act1) 通过判据（证明判据非恒假）', okTrial(5, { act: 1 }));

// ============ B 组 · 运行时承载（报告，不判红） ============
console.log('     —— 运行时承载报告（渐进建图，仅供对照，不判红）——');
{
  const carrier = (o, out, depth) => {
    if (!o || depth > 8) return;
    if (Array.isArray(o)) { o.forEach((x) => carrier(x, out, depth + 1)); return; }
    if (typeof o !== 'object') return;
    if (typeof o.diff === 'number') out.push(o.diff);
    if (typeof o.fixedTrial === 'number') out.push(o.fixedTrial);
    if (typeof o.fixedEventTrial === 'number') out.push(o.fixedEventTrial);
    Object.keys(o).forEach((k) => { if (k === 'next') return; carrier(o[k], out, depth + 1); });
  };
  const seen = new Set();
  try {
    for (let a = 1; a <= ACTS; a++) {
      const layers = N.generateMap(a);
      const out = [];
      carrier(layers, out, 0);
      out.forEach((d) => seen.add(d));
    }
  } catch (e) { /* 报告，忽略 */ }
  const miss = [];
  for (let d = 1; d <= TOTAL; d++) if (!seen.has(d)) miss.push(d);
  console.log('     渐进建图 1→' + ACTS + ' 承载并集 = ' + seen.size + ' / ' + TOTAL +
    '；未在节点出现：' + (miss.join(',') || '无'));
}

console.log(fail === 0
  ? `ok / 81 难承载门禁通过（难号↔章↔范围 全自洽；TRIAL_LIB=${Object.keys(LIB).length}；历难总数真源已修正）`
  : fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
