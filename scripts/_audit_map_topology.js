// _audit_map_topology.js — S16 §⑤-8：地图拓扑**零回归门禁**（2026-09-28）
// ---------------------------------------------------------------------------
// 审计 §⑤-8（P0）：地图全链**无自动化拓扑门禁**，`cells/width/fork/paths/orphans` 全靠人眼；
//   §⑤-2（P0）：朝代特色 `mapNode`（data_map.js:384-399）把新节点挂在 `maxCol+1` 列，
//   却**不回补上一层任何节点的 `next`** ⇒ 该节点无入边（orphan）⇒「可达 0 / 渲染 0」。
//
// 本门禁逐章建图并断言六项不变量：
//   A1 非空  · A2 **orphans == 0**（含开启 `mapNode` 特色时，直接钉死 §⑤-2）
//   A3 paths ≥ 5 · A4 末层（Boss 层）节点数 == 1 · A5 类型直方图可枚举
//   A6 反证（注入孤岛 ⇒ A2 判定必红）
//
// ⚠ 确定性：建图走 `NDX._rand`，故先把 `Math.random` 换成**固定种子 LCG**（照抄
//   `_balance_sweep.js` 的做法），否则本门禁会像 `_verify_final_damage` 一样随机红。
// ⚠ 判据诚实性（X4）：A2 的 orphan 定义 = 「非首层节点、且从首层沿 `next` 不可达」。
//   首层节点天然是根（`LAYERS[0]` 为空对象，无入边概念），**不算 orphan**，否则假红。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0;
const ck = (name, cond, extra) => {
  if (cond) console.log('ok   ' + name);
  else { console.log('FAIL ' + name + (extra ? '  → ' + extra : '')); fail++; }
};

const ROOT = path.join(__dirname, '..');

// —— 固定种子 LCG（复现性）——
let _seed = 20260928;
Math.random = function () {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
};

// —— 沙箱：只加载建图所需文件（顺序照抄 index.html 中出现的相对次序）——
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const ORDER = (HTML.match(/src="(js\/[^"?]+\.js)(?:\?[^"]*)?"/g) || [])
  .map((s) => s.replace(/^src="js\//, '').replace(/"$/, '').replace(/\?[^"]*$/, ''));
const sb = {
  NDX: {}, Math: Math, JSON: JSON, Date: Date, isNaN: isNaN, parseInt: parseInt, parseFloat: parseFloat,
  console: { log() {}, warn() {}, error() {} },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
};
sb.window = sb;
vm.createContext(sb);
ORDER.forEach((f) => {
  const p = path.join(ROOT, 'js', f);
  if (!fs.existsSync(p)) return;
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), sb); } catch (e) { /* 宿主差异容忍 */ }
});
const NDX = sb.NDX;

console.log('=== _audit_map_topology：逐章拓扑不变量（固定种子 ' + 20260928 + '） ===');

// —— 建图：取一段的层集合（seg[1..] 为层，seg[0] 空）——
function segLayers(act, forceMapNode) {
  const _saved = NDX.dynastyHas;
  if (forceMapNode) NDX.dynastyHas = function (f) { return f === 'mapNode'; };
  try {
    const off = NDX.regionLayerOffset(act);
    const seg = NDX._buildRegionSegment(act, off);
    const layers = [];
    for (let L = 1; L < seg.length; L++) layers.push(seg[L] || {});
    return layers;
  } finally { NDX.dynastyHas = _saved; }
}

// —— 拓扑度量 ——
function metrics(layersIn) {
  // ⚠ 归一化：`generateMap` 会写 `LAYERS[off] = {}`（空起点层）⇒ 若把空层当首层，
  //   则「首层无节点 ⇒ 无根 ⇒ 全图判孤岛」（本门禁首版 B 组就栽在这，实测 orphans==cells）。
  //   故先剥掉前导空层，以**第一个非空层**为根层。
  const layers = layersIn.slice();
  while (layers.length && Object.keys(layers[0]).length === 0) layers.shift();
  const cells = layers.reduce((a, l) => a + Object.keys(l).length, 0);
  const width = layers.reduce((a, l) => Math.max(a, Object.keys(l).length), 0);
  const fork = layers.filter((l) => Object.keys(l).length >= 2).length;
  const types = {};
  layers.forEach((l) => Object.values(l).forEach((n) => {
    const t = (n && n.type) || '?';
    types[t] = (types[t] || 0) + 1;
  }));
  // 可达集：首层全为根，沿 next（下一层列号）下推
  const seen = layers.map(() => ({}));
  const roots = Object.keys(layers[0] || {}).map(Number);
  roots.forEach((c) => { seen[0][c] = 1; });
  for (let i = 0; i < layers.length - 1; i++) {
    Object.keys(layers[i]).map(Number).forEach((c) => {
      if (!seen[i][c]) return;
      const nx = (layers[i][c] && layers[i][c].next) || [];
      nx.forEach((nc) => { if (layers[i + 1][nc]) seen[i + 1][nc] = 1; });
    });
  }
  let orphans = 0;
  layers.forEach((l, i) => {
    if (i === 0) return;                       // 首层 = 根，无入边概念，不算 orphan
    Object.keys(l).map(Number).forEach((c) => { if (!seen[i][c]) orphans++; });
  });
  // 路径数：逐层累加可达路径（首层每节点记 1 条）
  let paths = 0;
  const cnt = layers.map(() => ({}));
  Object.keys(layers[0] || {}).map(Number).forEach((c) => { cnt[0][c] = 1; });
  for (let i = 0; i < layers.length - 1; i++) {
    Object.keys(layers[i]).map(Number).forEach((c) => {
      const nx = (layers[i][c] && layers[i][c].next) || [];
      nx.forEach((nc) => {
        if (layers[i + 1][nc]) cnt[i + 1][nc] = (cnt[i + 1][nc] || 0) + (cnt[i][c] || 0);
      });
    });
  }
  const last = layers.length - 1;
  paths = Object.keys(layers[last] || {}).map(Number)
    .reduce((a, c) => a + (cnt[last][c] || 0), 0);
  return { cells, width, fork, paths, orphans, types, lastCount: Object.keys(layers[last] || {}).length };
}

const TOTAL = NDX.TOTAL_ACTS || (NDX.MAP_PLAN || []).length || 9;
const rows = [];
let badOrphans = 0, badPaths = 0, badLast = 0, badEmpty = 0;
for (let act = 1; act <= TOTAL; act++) {
  const m = metrics(segLayers(act, false));
  rows.push({ act, m });
  if (m.cells <= 0) badEmpty++;
  if (m.orphans !== 0) badOrphans++;
  if (m.paths < 5) badPaths++;
  if (m.lastCount !== 1) badLast++;
}

console.log('\nact | cells | width | fork | paths | orphans | 末层');
rows.forEach(({ act, m }) => {
  console.log(' ' + String(act).padStart(2) + ' | ' + String(m.cells).padStart(5) + ' | '
    + String(m.width).padStart(5) + ' | ' + String(m.fork).padStart(4) + ' | '
    + String(m.paths).padStart(5) + ' | ' + String(m.orphans).padStart(7) + ' | ' + m.lastCount);
});
const hist = {};
rows.forEach(({ m }) => Object.entries(m.types).forEach(([t, n]) => { hist[t] = (hist[t] || 0) + n; }));
console.log('类型直方图：' + JSON.stringify(hist) + '\n');

ck('A1 每章建图非空（cells > 0）', badEmpty === 0, badEmpty + ' 章为空');
ck('A2 **orphans == 0**（§⑤-8 保护点；非首层节点必须可从首层沿 next 抵达）',
  badOrphans === 0, badOrphans + ' 章存在孤岛');
ck('A3 paths ≥ 5（不塌成单线）', badPaths === 0, badPaths + ' 章路径不足');
ck('A4 末层（Boss 层）节点数 == 1（末层纯净性）', badLast === 0, badLast + ' 章末层节点数 ≠ 1');
ck('A5 类型直方图可枚举（≥ 4 类节点被实际投放）', Object.keys(hist).length >= 4,
  '实测 ' + Object.keys(hist).length + ' 类：' + Object.keys(hist).join(','));

// —— A6 反证：手工注入一个无入边的孤岛 ⇒ A2 判定必须转红 ——
{
  const probe = segLayers(1, false);
  const lastIdx = probe.length - 1;
  probe[lastIdx][999] = { type: 'probe', next: [] };   // 末层挂一个谁也不指向的节点
  const m2 = metrics(probe);
  ck('A6 反证：注入无入边节点 ⇒ orphans 由 0 变 ' + m2.orphans + '（A2 非恒真）',
    m2.orphans === 1);
}

// —— A7 · §⑤-3：同一 `diff` 的 mob 节点 `gold` 必须相等（金钱口径单源）——
//   ⚠ 必须走 `generateMap` 路径（归一化写在 generateMap 内），`segLayers` 拿不到该修复 ⇒ 会假红。
function gmLayersEarly(act) {
  NDX.generateMap(act);
  const off = NDX.regionLayerOffset(act);
  const layers = [NDX.LAYERS[off] || {}];
  for (let L = 1; L <= (NDX.LAYER_COUNT - off); L++) layers.push(NDX.LAYERS[off + L] || {});
  return layers;
}
{
  const byKey = {};
  for (let act = 1; act <= TOTAL; act++) {
    gmLayersEarly(act).forEach((l) => Object.values(l).forEach((n) => {
      if (!n || typeof n.gold !== 'number') return;
      const k = (n.type || '?') + '@' + (n.diff || 1);
      (byKey[k] = byKey[k] || {})[n.gold] = 1;
    }));
  }
  const bad = Object.entries(byKey).filter(([, set]) => Object.keys(set).length > 1);
  ck('A7 同一 `type@diff` 的节点 `gold` 唯一（主线模板与岔路 _sideNode 同源 `12+diff*3`）',
    bad.length === 0,
    bad.map(([k, set]) => k + '→{' + Object.keys(set).join(',') + '}').join(' | '));
}

// —— B 组 · §⑤-2 P0 复现：开启朝代 `mapNode` 特色后是否出现孤岛 ——
//   ⚠ 关键：`mapNode` 的「追加列」逻辑在 **`NDX.generateMap`**（data_map.js:384-399），
//     不在 `_buildRegionSegment` —— 必须真调 `generateMap` 才能打到该分支
//     （本门禁首版用 segLayers 探 B 组，探针**根本没执行到**那段代码，属「假绿」，已修）。
function gmLayers(act, forceMapNode) {
  const _saved = NDX.dynastyHas;
  if (forceMapNode) NDX.dynastyHas = function (f) { return f === 'mapNode'; };
  try {
    NDX.generateMap(act);
    const off = NDX.regionLayerOffset(act);
    const layers = [NDX.LAYERS[off] || {}];
    for (let L = 1; L <= (NDX.LAYER_COUNT - off); L++) layers.push(NDX.LAYERS[off + L] || {});
    return layers;
  } finally { NDX.dynastyHas = _saved; }
}
{
  const off1 = metrics(gmLayers(1, false));
  const on1 = metrics(gmLayers(1, true));
  ck('B1 §⑤-2 复现：开启 `dynastyHas("mapNode")` 后 orphans 仍 == 0'
    + '（新增岔路支线必须有入边，否则「可达 0 / 渲染 0」）',
    on1.orphans === 0,
    '关闭时 cells=' + off1.cells + '/orphans=' + off1.orphans
    + '，开启后 cells=' + on1.cells + '/orphans=' + on1.orphans);
  ck('B2 探针有效性：开启 `mapNode` 确实**增加了节点**（否则 B1 是空跑假绿）',
    on1.cells > off1.cells, '关闭 ' + off1.cells + ' → 开启 ' + on1.cells);
}

console.log(fail
  ? '=== _audit_map_topology：' + fail + ' 项失败 ==='
  : '=== _audit_map_topology：' + TOTAL + ' 章拓扑不变量全部成立（orphans=0 / paths≥5 / 末层=1） ===');
console.log(fail ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(fail ? 1 : 0);
