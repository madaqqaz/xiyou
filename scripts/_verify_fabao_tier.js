// _verify_fabao_tier.js — 「法宝品阶·宝窟分档投放」实证探针
// 目的：证明 ① 名器品阶不再被误判为 white；② rollFabao 按宝窟档位给品阶加权（low 不出红 / high 抬金抬红）。
// 断言：
//   A. 7 件名器（6 on-hit + 观音瓶）treasureTier === 'gold'；
//   B. FABAO_TIER_W 表存在且 low.red === 0；
//   C. 无主道时（清加权干扰），tier='high' 的金/红占比显著高于 tier='low'；
//   D. tier='low' 永不出红阶；
//   E. 不传 tier 时回退 low（旧调用点不崩、行为不变）；
//   F. 宝窟节点（_sideNode('treasure')）带 tier ∈ {low,high}。
// 运行：node scripts/_verify_fabao_tier.js
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

// —— A. 名器品阶修正 ——
const NAMED = ['zijin_honghulu', 'jinguo_zhuo', 'bajiao_shan', 'kunxian_sheng', 'feilong_zhang', 'jiuhuan_zhang', 'ts_jingping'];
const wrongTier = NAMED.filter((id) => NDX.treasureTier(id) !== 'gold');
ck('7 件名器 treasureTier 均为 gold', wrongTier.length === 0, wrongTier.map((i) => i + '=' + NDX.treasureTier(i)).join(','));

// —— B. 品阶权重表 ——
ck('FABAO_TIER_W 已定义', !!NDX.FABAO_TIER_W && !!NDX.FABAO_TIER_W.low && !!NDX.FABAO_TIER_W.high);
ck('low 档不出红 (red=0)', NDX.FABAO_TIER_W.low.red === 0, 'red=' + NDX.FABAO_TIER_W.low.red);

// —— 统计：无主道（清 dao 加权干扰）下，按宝窟档位抽 1 件的品阶分布 ——
if (NDX.clearRunRng) NDX.clearRunRng();
function dist(tier, times) {
  const c = { white: 0, blue: 0, gold: 0, red: 0 }; let n = 0;
  for (let i = 0; i < times; i++) {
    const s = { equips: [], seals: [], act: 9 }; // 无 mainDao → getMainDao 默认道，但清播种下加权干扰最小
    const got = NDX.rollFabao(1, s, 9, tier);
    if (!got.length) continue;
    n++;
    c[NDX.treasureTier(got[0].treasureId)]++;
  }
  const p = (k) => (n ? c[k] / n : 0);
  return { n, c, gold: p('gold'), red: p('red'), high: p('gold') + p('red') };
}
const lo = dist('low', 4000);
const hi = dist('high', 4000);
ck('low 档抽样非空', lo.n > 0, 'n=' + lo.n);
ck('high 档抽样非空', hi.n > 0, 'n=' + hi.n);

// —— C. high 档金/红占比显著高于 low ——
ck('high 档金+红占比 > low 档', hi.high > lo.high + 0.05,
  'hi=' + hi.high.toFixed(3) + ' lo=' + lo.high.toFixed(3));
ck('high 档金占比 > low 档金占比', hi.gold > lo.gold, 'hi.gold=' + hi.gold.toFixed(3) + ' lo.gold=' + lo.gold.toFixed(3));

// —— D. low 档永不出红 ——
ck('low 档不出红阶', lo.red === 0, 'lo.red=' + lo.red);

// —— E. 不传 tier 时回退 low（旧调用点行为不变）——
const none = dist(undefined, 2000);
ck('缺省 tier 回退 low（不出红）', none.red === 0, 'none.red=' + none.red);

// —— F. 宝窟节点分档（V9.8：已拆为两个独立节点类型 treasure / treasure_lux）——
let tierOk = true, sawHigh = false, sawLow = false, typeOk = true;
try {
  for (let i = 0; i < 400; i++) {
    const nd = NDX._sideNode(60 + (i % 20), 'treasure');
    if (!nd || (nd.type !== 'treasure' && nd.type !== 'treasure_lux')) { typeOk = false; break; }
    const expect = nd.type === 'treasure_lux' ? 'high' : 'low';
    if (nd.tier !== expect) { tierOk = false; break; }
    if (expect === 'high') sawHigh = true; else sawLow = true;
  }
} catch (err) { tierOk = false; typeOk = false; }
ck('宝窟节点仅产出 treasure / treasure_lux 两种独立类型', typeOk);
ck('类型与 tier 一致（treasure=low / treasure_lux=high）', tierOk);
ck('后期层可生成秘藏宝窟(treasure_lux)', sawHigh, 'sawHigh=' + sawHigh);
ck('普通宝窟(treasure)仍会生成', sawLow, 'sawLow=' + sawLow);

console.log('结论：通过 / 失败 = ' + pass + ' / ' + fail);
process.exit(fail ? 1 : 0);
