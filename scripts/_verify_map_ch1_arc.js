// _verify_map_ch1_arc.js — 地图层·复合弧落位门禁（九章制坐标系）
// ---------------------------------------------------------------------------
// 为什么需要这条门禁：
//   09-01 地理重排与 09-13 九章边界重排后，COMPOUND_NODES 的融合弧靠 `layer`（章内地图行号）
//   落到地图上，而章内行数、固定序章占用行数、关隘 Boss 行都由 ACT_RANGES 决定。
//   三者一旦不同步，弧会「静默失效」——不报错、不崩溃，只是那几难再也不会出现在地图上
//   （2026-09-13 实测踩中：黄风岭弧被写在第 1/2 行，而 act1 第 1-4 行被固定序章 continue 掉）。
//   静态断言（读数据表）抓不到这类问题，故本门禁直接跑真实建图函数，按节点结构断言。
//
// 断言对象：
//   A) act1：黄风岭弧落在第 10 行，fusionDiffs = [10,11,12]；第 13 行 = 关隘 Boss(难13)
//   B) act1：第 1-4 行 = 固定序章（3 trial + 1 songEvent），且行数 = 13
//   C) act4：车迟弧(28-30) 与 通天河弧(32-35) 双弧同章共存且各自成节点
//   D) 全章：每章地图行数 = 章内难数；关隘 Boss 行 = actEnd(act)
//   E) 反证：不得出现「本章没有的难号」被写进弧（防坐标错位回归）
'use strict';
const fs = require('fs');
const path = require('path');
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
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) { /* 与既有门禁同口径：可选文件失败不阻断 */ } });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

// 收集某张图（layers 数组）里的全部节点
const allNodes = (layers) => {
  const out = [];
  for (let L = 1; L < layers.length; L++) {
    const row = layers[L];
    if (!row) continue;
    Object.keys(row).map(Number).forEach((c) => { if (row[c]) out.push({ L, c, n: row[c] }); });
  }
  return out;
};
const compoundsOf = (layers) => allNodes(layers).filter((x) => x.n.type === 'compound' && x.n.fusionDiffs);
const bossOf = (layers) => allNodes(layers).filter((x) => x.n.type === 'boss');

// 建图带随机性（岔路列/节点类型），结构断言须多次采样才能证伪
const REPS = 12;

console.log('\n[A] act1 黄风岭弧落位（第 10 行 · 难10-12）');
{
  let missRow = 0, missDiffs = 0, multi = 0, bossBad = 0, layerBad = 0, okRows = 0;
  for (let i = 0; i < REPS; i++) {
    const layers = NDX._buildRegionSegment(1, NDX.actStart(1) - 1);
    if (layers.length - 1 !== 13) layerBad++;
    const cps = compoundsOf(layers);
    const hf = cps.filter((x) => (x.n.fusionDiffs || []).join(',') === '10,11,12');
    if (hf.length === 0) missDiffs++; else { okRows++; if (hf[0].L !== 10) missRow++; }
    if (cps.length > 1) multi++;
    const bs = bossOf(layers);
    if (bs.length !== 1 || bs[0].n.diff !== 13 || bs[0].L !== 13) bossBad++;
  }
  ck('act1 地图行数 = 13（= 章内难数）', layerBad === 0, layerBad + '/' + REPS + ' 次不符');
  ck('act1 每次建图都生成黄风岭弧（难10,11,12）', missDiffs === 0, missDiffs + '/' + REPS + ' 次缺失');
  ck('黄风岭弧固定落在第 10 行', missRow === 0 && okRows === REPS, missRow + ' 次错行');
  ck('act1 全图仅 1 个复合弧（无重复弧）', multi === 0, multi + '/' + REPS + ' 次重复');
  ck('act1 关隘 Boss 唯一且在第 13 行 / 难号 13', bossBad === 0, bossBad + '/' + REPS + ' 次不符');
}

console.log('\n[B] act1 固定序章（第 1-4 行）');
{
  let bad = 0;
  const seen = [];
  for (let i = 0; i < REPS; i++) {
    const layers = NDX._buildRegionSegment(1, 0);
    const n1 = layers[1] && layers[1][2], n2 = layers[2] && layers[2][2];
    const n3 = layers[3] && layers[3][2], n4 = layers[4] && layers[4][2];
    if (!(n1 && n1.type === 'trial' && n1.fixedTrial === 1)) bad++;
    if (!(n2 && n2.type === 'trial' && n2.fixedTrial === 2)) bad++;
    if (!(n3 && n3.type === 'trial' && n3.fixedTrial === 3)) bad++;
    if (!(n4 && n4.type === 'event' && n4.songEvent)) bad++;
    if (i === 0) [n1, n2, n3, n4].forEach((n) => { if (n) seen.push(n.name); });
  }
  ck('第 1-4 行 = 固定序章（trial1/trial2/trial3/songEvent）', bad === 0, bad + ' 处不符');
  ck('固定序章难号 = 1/2/3/4（行号与难号同值）',
    seen.join('|') === '金蝉遭贬|出胎几杀|满月抛江|长安送行', seen.join('|'));
  // 反证：第 5-9 行不得再出现复合弧（否则与黄风岭弧撞车）
  let dup = 0;
  for (let i = 0; i < REPS; i++) {
    const layers = NDX._buildRegionSegment(1, 0);
    compoundsOf(layers).forEach((x) => { if (x.L !== 10) dup++; });
  }
  ck('act1 复合弧不出现在第 10 行之外（反证）', dup === 0, dup + ' 次越位');
}

console.log('\n[C] act4 双弧共存（车迟 28-30 / 通天河 32-35）');
{
  let missA = 0, missB = 0, bad = 0;
  for (let i = 0; i < REPS; i++) {
    const layers = NDX._buildRegionSegment(4, NDX.actStart(4) - 1);
    const cps = compoundsOf(layers);
    const a = cps.some((x) => (x.n.fusionDiffs || []).join(',') === '28,29,30');
    const b = cps.some((x) => (x.n.fusionDiffs || []).join(',') === '32,33,34,35');
    if (!a) missA++;
    if (!b) missB++;
    const bs = bossOf(layers);
    if (bs.length !== 1 || bs[0].n.diff !== 36) bad++;
  }
  ck('act4 车迟弧（28-30）成节点', missA === 0, missA + '/' + REPS + ' 次缺失');
  ck('act4 通天河弧（32-35）成节点', missB === 0, missB + '/' + REPS + ' 次缺失');
  ck('act4 关隘 Boss 唯一且为难36（金鱼精）', bad === 0, bad + '/' + REPS + ' 次不符');
}

console.log('\n[D] 全章：行数 = 章内难数 · Boss 行 = actEnd');
{
  const bad = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    const layers = NDX._buildRegionSegment(act, NDX.actStart(act) - 1);
    const want = NDX.actEnd(act) - NDX.actStart(act) + 1;
    if (layers.length - 1 !== want) bad.push('act' + act + ' 行' + (layers.length - 1) + '≠' + want);
    const bs = bossOf(layers);
    if (bs.length !== 1) bad.push('act' + act + ' Boss 数=' + bs.length);
    else if (bs[0].n.diff !== NDX.actEnd(act)) bad.push('act' + act + ' Boss难' + bs[0].n.diff + '≠' + NDX.actEnd(act));
  }
  ck('9 章行数/关隘 Boss 全部与 ACT_RANGES 自洽', bad.length === 0, bad.slice(0, 5).join(' | '));
}

console.log('\n[E] 反证：弧内难号必须落在本chapter区间内');
{
  const bad = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    const lo = NDX.actStart(act), hi = NDX.actEnd(act);
    const layers = NDX._buildRegionSegment(act, lo - 1);
    compoundsOf(layers).forEach((x) => {
      (x.n.fusionDiffs || []).forEach((d) => { if (d < lo || d >= hi) bad.push('act' + act + ' 弧含难' + d + ' 越界[' + lo + ',' + hi + ')'); });
    });
  }
  ck('所有融合弧的子难号都在本章 [start, end) 内', bad.length === 0, bad.slice(0, 5).join(' | '));
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
