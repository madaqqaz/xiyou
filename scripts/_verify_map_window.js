// _verify_map_window.js — 地图渲染门禁：聚焦窗口（万世剑冢式）+ 整屏地区背景接线
// ---------------------------------------------------------------------------
// 背景：玩家反馈地图「背景显示不完整 + 路径太乱」。
//   ① 背景：旧实现只在 .nodes 内画一条 mapH(≈300px) 的 .region-bg 横带，带外上下露 #trail
//      深底；而本该铺满整屏的 #mapBgLayer（_applyActBg 驱动）全仓没有一条 CSS，等于死代码。
//      修法：#mapBgLayer/.map-bg-img 补 CSS + _applyActBg 改用 <img>（file:// 也能加载本地 webp），
//      .region-bg 退化为半透明分色薄罩并铺满整高。
//   ② 路径：9-11 层 × 最多 5 列整图铺开 + 全图 ln-base 虚线连通网 → 手机小屏糊成一团。
//      修法：以当前层为锚，仅点亮「前 WIN_AHEAD 层 / 后 WIN_BACK 层」，窗口外 dimwin→offwin 渐隐
//      （节点与连线同步）。同时 centerCurrent 锚点 0.5 → 0.82，把视野推向前方几步路。
//
// 断言（本门禁锁死上面两条不回归）：
//   A) mapHtml 可正常产出（不抛异常）
//   B) 窗口外存在 dimwin / offwin；当前节点（id="map-cur"）绝不被隐去
//   C) 明亮节点 < 总数的 70%（降噪确实生效，而非全亮）
//   D) .region-bg 不再内联 background-image / height（贴图与铺满职责已移交 #mapBgLayer + CSS）
//   E) _mapGeom 正常（几何未被破坏）
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
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) { /* 可选文件失败不阻断，与既有门禁同口径 */ } });
// ui_core.js 依赖真实 DOM，跳过；ui_map.js 只在 NDX.ui 上挂函数，故单独 require 并补最小 DOM 桩
global.document = global.document || {
  documentElement: { classList: { contains: () => false } },
  getElementById: () => null,
  addEventListener: () => {},
  querySelector: () => null,
  createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, setAttribute() {} }),
};
require(path.join(ROOT, 'js/ui/ui_map.js'));
const NDX = global.NDX;
NDX.ui.TAGS = NDX.ui.TAGS || {};
NDX.ui._typeDisplayName = NDX.ui._typeDisplayName || (() => '');

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  \u2713 ' + name); }
  else { fail++; console.log('  \u2717 ' + name + (extra != null ? ' \u2014 ' + extra : '')); }
};

// 建出第一章地图（与 _verify_map_ch1_arc 同口径）
try { NDX.generateMap(1); } catch (e) { console.log('generateMap error:', e && e.message); }
const rows = (NDX.LAYERS || []).length;
console.log('  LAYER_COUNT=' + NDX.LAYER_COUNT + ' MAX_COL=' + NDX.MAX_COL + ' rows=' + rows);
ck('A1 第一章地图已建出（层数 > 0）', rows > 2 && NDX.LAYER_COUNT > 2, 'rows=' + rows);

// 构造「已走到第 5 层」的存档态
const visited = [];
for (let L = 1; L <= 5; L++) visited.push({ layer: L, col: 1 });
const s = { act: 1, layer: 5, col: 1, visited, mode: 'outbound', gateOpen: false, diff: 5 };
const g = { choices: () => (NDX.LAYERS[6] ? Object.keys(NDX.LAYERS[6]).map((c) => NDX.LAYERS[6][c]).filter(Boolean).slice(0, 1) : []) };

let out = '';
try { out = NDX.ui.mapHtml.call(NDX.ui, s, g); } catch (e) { console.log('RENDER THROW:', e && e.message); }
ck('A2 mapHtml 正常产出（不抛异常）', out.length > 200, 'len=' + out.length);

// —— B/C 聚焦窗口 ——
const cnt = (re) => (out.match(re) || []).length;
ck('B1 窗口外节点带 offwin', cnt(/class="cell[^"]*\boffwin\b/g) > 0);
ck('B2 窗口边缘节点带 dimwin', cnt(/class="cell[^"]*\bdimwin\b/g) > 0);
ck('B3 当前节点仍带 id="map-cur"（未被窗口隐去）', /class="cell[^"]*"[^>]*id="map-cur"/.test(out));
ck('B4 连线同步渐隐（ln-base 带 offwin/dimwin）', cnt(/class="ln ln-base[^"]*\b(offwin|dimwin)\b/g) > 0);
const cellAll = cnt(/class="cell\b/g);
const faded = cnt(/class="cell[^"]*\b(dimwin|offwin)\b/g);
ck('C 明亮节点 < 总数 70%（降噪生效）', cellAll > 0 && (cellAll - faded) < cellAll * 0.7, (cellAll - faded) + '/' + cellAll);

// —— D region-bg 职责移交 ——
const rb = out.match(/<div class="region-bg[\s\S]*?<\/div>/g) || [];
ck('D1 region-bg 存在（cur/next 两条）', rb.length >= 2, 'n=' + rb.length);
ck('D2 region-bg 不再内联 background-image', rb.every((r) => !/background-image/.test(r)));
ck('D3 region-bg 不再内联 height（改由 CSS 铺满整高）', rb.every((r) => !/height:/.test(r)));
ck('D4 region-bg 保留半透明分色薄罩', rb.every((r) => /background:/.test(r)));

// —— E 几何 ——
const geom = NDX.ui._mapGeom.call(NDX.ui);
ck('E _mapGeom 正常（mapW > 0）', geom.mapW > 0, 'mapW=' + geom.mapW);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
