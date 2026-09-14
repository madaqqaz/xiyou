// _verify_treasure_lux.js — 「秘藏宝窟·独立节点」实证探针
// 目的：证明宝窟已从「同一节点随机改名/改档」升级为「两个独立节点类型」，且秘藏具备确定性特殊奖励。
// 断言：
//   A. _sideNode('treasure') 会产出两个独立类型：treasure(low) 与 treasure_lux(high)；
//   B. 升格概率 ≈ NDX.TREASURE_LUX_CHANCE（统计区间校验）；
//   C. treasure_lux 的金币 > 普通宝窟；
//   D. rollFabao(tier='high') 保底：每批候选必含金/红名器（对照组 low 无此保证）；
//   E. 后段地图池已纳入 treasure（源码断言）；
//   F. UI 契约：TAGS 有 treasure_lux 条目；节点分发含 case 'treasure_lux'。
// 运行：node scripts/_verify_treasure_lux.js
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

// —— A/B/C. 节点类型与金币 ——
ck('TREASURE_LUX_CHANCE 已定义', typeof NDX.TREASURE_LUX_CHANCE === 'number' && NDX.TREASURE_LUX_CHANCE > 0,
  'v=' + NDX.TREASURE_LUX_CHANCE);
const N = 4000;
let nLow = 0, nLux = 0, badType = 0, lowGold = 0, luxGold = 0, luxTierBad = 0, lowTierBad = 0;
for (let i = 0; i < N; i++) {
  const nd = NDX._sideNode(40 + (i % 40), 'treasure');
  if (!nd) { badType++; continue; }
  if (nd.type === 'treasure') {
    nLow++;
    if (nd.tier !== 'low') lowTierBad++;
    lowGold += nd.gold || 0;
  } else if (nd.type === 'treasure_lux') {
    nLux++;
    if (nd.tier !== 'high') luxTierBad++;
    if (!nd.lux) badType++;
    luxGold += nd.gold || 0;
  } else { badType++; }
}
ck('宝窟节点产出两种独立类型（无第三种）', badType === 0 && nLow > 0 && nLux > 0,
  'low=' + nLow + ' lux=' + nLux + ' bad=' + badType);
ck('普通宝窟 tier 恒为 low', lowTierBad === 0, 'bad=' + lowTierBad);
ck('秘藏宝窟 tier 恒为 high', luxTierBad === 0, 'bad=' + luxTierBad);
const rate = nLux / (nLow + nLux);
ck('升格概率 ≈ TREASURE_LUX_CHANCE', Math.abs(rate - NDX.TREASURE_LUX_CHANCE) < 0.05,
  'rate=' + rate.toFixed(3) + ' expect=' + NDX.TREASURE_LUX_CHANCE);
const lowAvg = nLow ? lowGold / nLow : 0, luxAvg = nLux ? luxGold / nLux : 0;
ck('秘藏宝窟金币 > 普通宝窟', luxAvg > lowAvg * 1.2, 'lux=' + Math.round(luxAvg) + ' low=' + Math.round(lowAvg));

// —— D. 秘藏保底：每批候选必含金/红名器 ——
if (NDX.clearRunRng) NDX.clearRunRng();
const _tierOf = (e) => NDX.treasureTier(e.treasureId);
let hiMiss = 0, hiRuns = 0, loGold = 0, loRuns = 0;
for (let i = 0; i < 300; i++) {
  const s = { equips: [], seals: [], act: 9 };
  const got = NDX.rollFabao(2, s, 9, 'high');
  if (got.length) {
    hiRuns++;
    if (!got.some((e) => ['gold', 'red'].indexOf(_tierOf(e)) >= 0)) hiMiss++;
  }
  const s2 = { equips: [], seals: [], act: 9 };
  const got2 = NDX.rollFabao(2, s2, 9, 'low');
  if (got2.length) {
    loRuns++;
    if (got2.some((e) => ['gold', 'red'].indexOf(_tierOf(e)) >= 0)) loGold++;
  }
}
ck('秘藏(high)抽样非空', hiRuns > 0, 'runs=' + hiRuns);
ck('秘藏保底：每批必含金/红名器', hiMiss === 0, 'miss=' + hiMiss + '/' + hiRuns);
ck('对照：普通(low)不保证金红（保底为秘藏专属）', loGold < loRuns, 'low有金红批=' + loGold + '/' + loRuns);

// —— E. 后段地图池纳入 treasure ——
const mapSrc = fs.readFileSync(path.join(ROOT, 'js', 'data_map.js'), 'utf8');
ck('后段地图池含 treasure', /'shop',\s*'treasure'/.test(mapSrc));   // PHASE 8：treasure 权重 ×2 后池尾为 'treasure','treasure']，去 ] 锚定（意图不变：treasure 在池中）

// —— F. UI / 分发契约 ——
const uiSrc = fs.readFileSync(path.join(ROOT, 'js', 'ui.js'), 'utf8');
const coreSrc = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_core_2.js'), 'utf8');
const mapUiSrc = fs.readFileSync(path.join(ROOT, 'js', 'ui', 'ui_map.js'), 'utf8');
ck('TAGS 含 treasure_lux 条目', /treasure_lux:/.test(uiSrc));
ck('节点分发含 case treasure_lux', /case 'treasure_lux':/.test(coreSrc));
ck('地图 UI 含 treasure_lux 提示', /treasure_lux/.test(mapUiSrc));

console.log('结论：通过 / 失败 = ' + pass + ' / ' + fail);
process.exit(fail ? 1 : 0);
