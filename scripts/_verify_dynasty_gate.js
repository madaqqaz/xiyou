// _verify_dynasty_gate.js — S12 朝代 · 时序/注册/文案 回归门禁
//
// A 组 §⑤-1（P0 时序死锁）：`game_meta.js` 的结局视频判定**不得**在 `resetDynasty()` 之后
//   再读 `dynastyHas(...)`（复位后读＝恒假）。判据：视频判定所在行必须使用**复位前缓存的**
//   `_dynFeatAtWin`，且该缓存的赋值行必须**早于** `resetDynasty(` 出现行。
// B 组 §⑤-5：`DYNASTY_IDX` 必须注册进 `storage.js` 的唯一 key 注册表，且**值保持历史字符串**
//   `'ndx_dynasty_idx'`（零迁移）。
// C 组 §⑤-7：玩家可见文案不得再出现「十七朝」（真源为 10 朝）。
// D 组 §⑤-2（报告，不判红）：`eliteBonus` 的消费点计数 —— 定义 1 处且零消费时为**待拍板项**，
//   本门禁只报告计数与位置，避免在裁决前用红色断言阻断跑批。
// 含反证：顺序颠倒样本 / 未注册样本 必须被判据拒斥。
//
// 运行：node scripts/_verify_dynasty_gate.js（已登记进 _run_all_gates.js）
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
// 同时剔除**整行注释与行内注释**（保护 `://` 以免误伤 URL）——
// 说明性注释本就该能引用历史文案/原式，否则「记录旧值」反被判红（S07/S08/S12 同一教训）。
const stripComments = (t) => t
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/gm, '$1');
const rawMeta = fs.readFileSync(path.join(ROOT, 'js/game/game_meta.js'), 'utf8');
const codeMeta = stripComments(rawMeta);
const codeStorage = stripComments(fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8'));
const rawChangan = fs.readFileSync(path.join(ROOT, 'js/ui/ui_changan.js'), 'utf8');

// ============ A 组 · §⑤-1 时序死锁 ============
const idxCache = codeMeta.indexOf('_dynFeatAtWin =');
const idxReset = codeMeta.indexOf('NDX.resetDynasty(');
const idxVideo = codeMeta.indexOf('_dynFeatAtWin && s.over.ending.perfect');
ck('A1 复位前缓存 _dynFeatAtWin 存在', idxCache >= 0);
ck('A2 缓存赋值早于 resetDynasty（防"复位后读⇒恒假"）', idxCache >= 0 && idxReset >= 0 && idxCache < idxReset,
  'cache@' + idxCache + ' reset@' + idxReset);
ck('A3 视频判定使用缓存变量（不再直接调 dynastyHas）', idxVideo >= 0);
ck('A4 视频判定处**不再**出现 `NDX.dynastyHas` 直调', codeMeta.indexOf('dynastyHas && NDX.dynastyHas(') < 0);
// 反证：把顺序颠倒的样本喂给 A2 判据必须判红
ck('A5 反证：顺序颠倒样本被 A2 判据拒斥',
  !(('const _x = resetDynasty(); const _dynFeatAtWin = dynastyHas();').indexOf('_dynFeatAtWin =')
    < ('const _x = resetDynasty(); const _dynFeatAtWin = dynastyHas();').indexOf('resetDynasty(')));

// ============ B 组 · §⑤-5 注册表 ============
ck('B1 storage STORE 已注册 DYNASTY_IDX', /DYNASTY_IDX:\s*'ndx_dynasty_idx'/.test(codeStorage));
ck('B2 注册值 = 历史字符串（零迁移）', /DYNASTY_IDX:\s*'ndx_dynasty_idx'/.test(codeStorage));
ck('B3 data_dynasty.js 经真源读取（KEYS.DYNASTY_IDX 存在）',
  !!(N.storage && N.storage.KEYS && N.storage.KEYS.DYNASTY_IDX),
  'KEYS.DYNASTY_IDX=' + (N.storage && N.storage.KEYS && N.storage.KEYS.DYNASTY_IDX));
ck('B4 NDX.DYNASTY_KEY 与注册值一致',
  N.DYNASTY_KEY === 'ndx_dynasty_idx', 'DYNASTY_KEY=' + N.DYNASTY_KEY);
ck('B5 反证：未注册样本被 B1 判据拒斥', !/DYNASTY_IDX:\s*'ndx_dynasty_idx'/.test('var STORE = { AWAKENED: 1 };'));

// ============ C 组 · §⑤-7 文案 ============
ck('C1 玩家可见文案（剔注释）无「十七朝」（真源 10 朝）', stripComments(rawChangan).indexOf('十七朝') < 0);
ck('C2 文案已改为「十朝」', stripComments(rawChangan).indexOf('十朝') >= 0);
ck('C3 反证：含「十七朝」的样本被 C1 判据拒斥', '十七朝'.indexOf('十七朝') >= 0);

// ============ D 组 · §⑤-2 报告（不判红） ============
{
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((it) => {
    const p = path.join(d, it.name);
    if (it.isDirectory()) walk(p); else if (it.name.endsWith('.js')) files.push(p);
  });
  walk(path.join(ROOT, 'js'));
  const hits = [];
  files.forEach((f) => {
    stripComments(fs.readFileSync(f, 'utf8')).split(/\r?\n/).forEach((l, i) => {
      if (l.indexOf('eliteBonus') >= 0) hits.push(path.relative(ROOT, f) + ':' + (i + 1));
    });
  });
  console.log('     —— §⑤-2 报告（不判红）：eliteBonus 消费点 = ' + hits.length + ' 处 ——');
  hits.forEach((h) => console.log('       ' + h));
  console.log('       ⇒ 若 = 1（仅定义）则该 feature 承诺悬空，属**待拍板**（消费它＝加精英/平衡变更；删它＝撤承诺）。');
}

console.log(fail === 0
  ? 'ok / 朝代门禁通过（时序缓存早于复位 · DYNASTY_IDX 已注册且值不变 · 文案已统一十朝）'
  : fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
