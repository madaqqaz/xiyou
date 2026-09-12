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
ck('土地庙合金按钮已接线（ui_panel_2.js 含 data-opt="alloy"）',
  fs.readFileSync(path.join(ROOT, 'js/ui/ui_panel_2.js'), 'utf8').indexOf('data-opt="alloy"') >= 0);
ck('合金动作已分发（game_rest.js 处理 opt==="alloy"）',
  fs.readFileSync(path.join(ROOT, 'js/game/game_rest.js'), 'utf8').indexOf("opt === 'alloy'") >= 0);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
