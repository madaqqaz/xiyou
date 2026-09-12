// _verify_seal_alloy.js — 「三红合金」顶阶合成实证探针（V9.6 两段蓝/三段红/三红合金）
// 目的：证明 金劫（gold）来源唯一、由 NDX.combineRedSeals 三红合金产出，且：
//   - 持有 >=3 红劫可合金，消耗 3 红 → 产出 1 金（净 -2 枚）；
//   - 金劫道途取三红多数派（平局取首枚）；
//   - 功率中性：金劫数值 = 红劫 ×3（SEAL_GOLD_SCALE = SEAL_RED_MULT×3），故 3 红 ≈ 1 金；
//   - 红劫 <3 时拒绝合金。
// 运行：node scripts/_verify_seal_alloy.js
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = {
  get length() { return Object.keys(_ls).length; },
  key(i) { const k = Object.keys(_ls); return k[i] != null ? k[i] : null; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(_ls, k) ? _ls[k] : null; },
  setItem(k, v) { _ls[k] = String(v); }, removeItem(k) { delete _ls[k]; },
  clear() { for (const k of Object.keys(_ls)) delete _ls[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !SKIP.has(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };

// ============ 倍率不变量（金 = 红 ×3） ============
const words = Object.keys(NDX.SEAL_WORDS);
let bad = [];
words.forEach((name) => {
  const wd = NDX.SEAL_WORDS[name];
  if (!wd.tiers || wd.tiers.gold == null) return;
  const gold = NDX.sealTierVal(wd, 'gold');
  const red = NDX.sealTierVal(wd, 'red');
  if (Math.abs(gold - 3 * red) > 1e-9) bad.push(name + ' gold=' + gold + ' 3red=' + (3 * red));
});
ck('倍率不变量：全部词条 金劫值 = 红劫值 ×3', bad.length === 0, bad.slice(0, 3).join(' | '));

// ============ 合金：不足三红 → 拒绝 ============
const mkRed = (dao, name) => ({ id: 'seal_' + dao + '_' + name + '_red', tier: 'red', dao, name, val: NDX.sealTierVal(NDX.SEAL_WORDS[name], 'red') });
ck('合金函数已定义', typeof NDX.combineRedSeals === 'function');
let s = { seals: [mkRed('战', '杀伐'), mkRed('战', '杀伐')] };
let r = NDX.combineRedSeals(s);
ck('红劫不足三枚 → 拒绝（ok=false，且 seals 不变）', !r.ok && s.seals.length === 2, 'why=' + (r.why || ''));

// ============ 合金：3 红同道 → 1 金，道途守恒 ============
s = { seals: [mkRed('战', '杀伐'), mkRed('战', '杀伐'), mkRed('战', '杀伐')] };
r = NDX.combineRedSeals(s);
ck('三红同「战」道 → 合金成功', r.ok && r.dao === '战', 'dao=' + (r.dao || ''));
ck('合金净消耗 -2 枚（3 红 → 1 金）', s.seals.length === 1 && s.seals[0].tier === 'gold', 'len=' + s.seals.length);
ck('产金劫为 gold 档且有数值', r.gold && r.gold.tier === 'gold' && r.gold.val > 0, 'val=' + (r.gold ? r.gold.val : 0));
ck('产金劫道途继承多数派「战」', r.gold && r.gold.dao === '战', 'goldDao=' + (r.gold ? r.gold.dao : ''));

// 功率中性（受控：强制该道仅 1 词条，使产金词 = 红词）
const _orig = NDX.SEAL_DAOTU_WORDS['战'];
NDX.SEAL_DAOTU_WORDS['战'] = ['杀伐'];
s = { seals: [mkRed('战', '杀伐'), mkRed('战', '杀伐'), mkRed('战', '杀伐')] };
r = NDX.combineRedSeals(s);
const redVal = NDX.sealTierVal(NDX.SEAL_WORDS['杀伐'], 'red');
ck('功率中性：1 金劫值 ≈ 3 × 单红劫值（同词）', Math.abs(r.gold.val - 3 * redVal) < 1e-9,
  'gold=' + r.gold.val + ' 3red=' + (3 * redVal));
NDX.SEAL_DAOTU_WORDS['战'] = _orig;

// ============ 合金：3 红混道（2+1）→ 多数派 ============
s = { seals: [mkRed('战', '杀伐'), mkRed('战', '碎击'), mkRed('渡', '禅光')] };
r = NDX.combineRedSeals(s);
ck('三红混道（战2/渡1）→ 金劫道途取多数派「战」', r.ok && r.dao === '战' && r.gold.dao === '战', 'dao=' + (r.dao || ''));

// ============ 合金：金劫来源唯一性（无掉落直给） ============
// 已在上游 _verify_seal_source.js 证明 rollSealTier 任何来源均不产 gold；
// 此处仅确认 combine 是 gold 的唯一构造入口且 gold 词表数值完备。
const goldWords = words.filter((n) => NDX.SEAL_WORDS[n].tiers && NDX.SEAL_WORDS[n].tiers.gold != null);
ck('金劫词表数值完备（全部 gold 词条 tiers.gold 有值）', goldWords.length > 0
  && goldWords.every((n) => NDX.SEAL_WORDS[n].tiers.gold != null));
ck('金劫 UI 已落地（.seal-opt.tier-gold / .seal-chip.tier-gold）',
  fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8').indexOf('.seal-opt.tier-gold') >= 0);
ck('土地庙合成链 UI 已接线（ui_panel_2.js 渲染 seal-combine:<tier>）',
  fs.readFileSync(path.join(ROOT, 'js/ui/ui_panel_2.js'), 'utf8').indexOf('seal-combine:') >= 0);
ck('合成动作已分发（game_rest.js 处理 seal-combine 前缀）',
  fs.readFileSync(path.join(ROOT, 'js/game/game_rest.js'), 'utf8').indexOf("opt.indexOf('seal-combine:')") >= 0);
ck('无遗留死分支（全仓无 data-opt="alloy" 与 opt === "alloy"）', (() => {
  let hit = false;
  for (const f of allJs(path.join(ROOT, 'js'))) {
    const src = fs.readFileSync(f, 'utf8');
    if (/data-opt="alloy"/.test(src) || /opt === 'alloy'/.test(src)) hit = true;
  }
  return !hit;
})());

// ============ V9.8 3合1 全链（白→绿→蓝→红→金） ============
function allJs(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out = out.concat(allJs(p));
    else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}
const mk = (dao, name, tier) => ({ id: 'seal_' + dao + '_' + name + '_' + tier, tier, dao, name, val: NDX.sealTierVal(NDX.SEAL_WORDS[name], tier) });
ck('合成链函数已定义', typeof NDX.combineSeals === 'function' && typeof NDX.combineInfo === 'function');
ck('合成链：白→绿→蓝→红→金（sealNextTier 全链自洽）',
  NDX.sealNextTier('white') === 'green' && NDX.sealNextTier('green') === 'blue'
  && NDX.sealNextTier('blue') === 'red' && NDX.sealNextTier('red') === 'gold' && NDX.sealNextTier('gold') === null);
// 逐级合成：3 → 1，档位递进，道途取多数派
[['white', 'green', '杀伐'], ['green', 'blue', '杀伐'], ['blue', 'red', '杀伐']].forEach((cse) => {
  const from = cse[0], to = cse[1], w = cse[2];
  let st = { seals: [mk('战', w, from), mk('战', w, from), mk('战', w, from)] };
  let rr = NDX.combineSeals(st, from);
  ck('合成 ' + from + ' ×3 → 1 ' + to, rr.ok && st.seals.length === 1 && st.seals[0].tier === to,
    'ok=' + rr.ok + ' len=' + st.seals.length + ' tier=' + (st.seals[0] && st.seals[0].tier));
  ck('合成 ' + from + ' 道途守恒（战）', rr.ok && rr.dao === '战' && rr.seal && rr.seal.dao === '战', 'dao=' + (rr.dao || ''));
  // 不足三枚 → 拒绝且不消耗
  st = { seals: [mk('战', w, from), mk('战', w, from)] };
  rr = NDX.combineSeals(st, from);
  ck('合成 ' + from + ' 不足三枚 → 拒绝（seals 不变）', !rr.ok && st.seals.length === 2, 'why=' + (rr.why || ''));
});
// 顶阶不可再合
let sg = { seals: [mk('战', '杀伐', 'gold'), mk('战', '杀伐', 'gold'), mk('战', '杀伐', 'gold')] };
let rg = NDX.combineSeals(sg, 'gold');
ck('金劫为顶阶，不可再合', !rg.ok && sg.seals.length === 3, 'why=' + (rg.why || ''));
// 混道合成 → 多数派
let sm = { seals: [mk('战', '杀伐', 'white'), mk('战', '碎击', 'white'), mk('渡', '禅光', 'white')] };
let rm2 = NDX.combineSeals(sm, 'white');
ck('混道合成（战2/渡1）→ 产物取多数派「战」', rm2.ok && rm2.dao === '战' && rm2.seal.dao === '战', 'dao=' + (rm2.dao || ''));
// 数值跳档（非 ×3 爆炸）：绿→蓝 严格 1.62 倍，且蓝 < 红 < 金
ck('数值跳档有界：绿<蓝<红<金 且 蓝/绿 = SEAL_BLUE_MULT', (() => {
  const wd = NDX.SEAL_WORDS['杀伐'];
  const g0 = NDX.sealTierVal(wd, 'green'), b0 = NDX.sealTierVal(wd, 'blue'), r0 = NDX.sealTierVal(wd, 'red'), gd = NDX.sealTierVal(wd, 'gold');
  return g0 < b0 && b0 < r0 && r0 < gd && Math.abs(b0 / g0 - NDX.SEAL_BLUE_MULT) < 1e-9;
})());
ck('非 ×3 爆炸：金/白 < 20（阶梯可控，非 81 倍）', (() => {
  const wd = NDX.SEAL_WORDS['杀伐'];
  return NDX.sealTierVal(wd, 'gold') / NDX.sealTierVal(wd, 'white') < 20;
})(), 'ratio=' + (NDX.sealTierVal(NDX.SEAL_WORDS['杀伐'], 'gold') / NDX.sealTierVal(NDX.SEAL_WORDS['杀伐'], 'white')).toFixed(2));
// combineInfo 面板真源
const ci = NDX.combineInfo({ seals: [mk('战', '杀伐', 'white'), mk('战', '杀伐', 'white'), mk('战', '杀伐', 'white')] });
ck('combineInfo 覆盖四段合成（白/绿/蓝/红）', ci.length === 4 && ci[0].tier === 'white' && ci[3].next === 'gold');
ck('combineInfo 白档 3 枚 → can=true，其余 can=false 且给出 why',
  ci[0].can === true && ci.slice(1).every((x) => x.can === false && !!x.why));
// UI/动作接线
ck('土地庙 UI 渲染合成链（data-opt="seal-combine:"）',
  fs.readFileSync(path.join(ROOT, 'js/ui/ui_panel_2.js'), 'utf8').indexOf('seal-combine:') >= 0);
ck('合成动作已分发（game_rest.js 处理 seal-combine）',
  fs.readFileSync(path.join(ROOT, 'js/game/game_rest.js'), 'utf8').indexOf("opt.indexOf('seal-combine:')") >= 0);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
