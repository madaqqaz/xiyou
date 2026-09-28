// _audit_sutra_single_source.js — S09 经文 · 单一来源 / 注释真值 / 叠量同构 门禁
//
// A 组 §⑤-7：SUTRA_CHANT 兜底**同源**
//   断言 `sutraChantCfg().LIFE_DAYS === SUTRA_CHANT.LIFE_DAYS`，且源码（剔整行注释）无 stale `LIFE_DAYS || 18`
//   （原兜底 18 vs 真值 40 ⇒ 真源缺失时诵经寿元代价**静默降价 55%**）。
// B 组 §⑤-3：SPEC 注释的「渡/逆/合计」数字必须与 `Σ sutraCostOf` **对拍一致**（防再次漂移），
//   并断言已登记「`sutraFragOverview()` 仅覆盖渡侧」以免再被误当合计引用。
// C 组 §⑤-1：残片写入口径**三处同构**（渡侧掉落 / 事件侧 / 逆侧），杜绝「只产种类不产数量」的孤例。
//
// 运行：node scripts/_audit_sutra_single_source.js（已登记进 _run_all_gates.js）
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = {
  get length() { return Object.keys(_ls).length; }, key(i) { return Object.keys(_ls)[i] || null; },
  getItem(k) { return _ls[k] ?? null; }, setItem(k, v) { _ls[k] = String(v); },
  removeItem(k) { delete _ls[k]; }, clear() { for (const k of Object.keys(_ls)) delete _ls[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !['sound.js', 'ui.js', 'main.js'].includes(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let fail = 0;
const ck = (n, c, extra) => {
  if (c) console.log('ok   ' + n);
  else { console.log('FAIL ' + n + (extra ? '  → ' + extra : '')); fail++; }
};
// 剔整行注释后再做源码级断言：说明性注释本就该能引用历史原式（S07/S08 同款防自我误判）
const stripComments = (t) => t.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
const rawSutra = fs.readFileSync(path.join(ROOT, 'js/data_sutra.js'), 'utf8');
const codeSutra = stripComments(rawSutra);
const codeGameSutra = stripComments(fs.readFileSync(path.join(ROOT, 'js/game/game_sutra.js'), 'utf8'));
const codeEvent3 = stripComments(fs.readFileSync(path.join(ROOT, 'js/game/game_event_3.js'), 'utf8'));

// ============ A 组 · §⑤-7 兜底同源 ============
const CFG = NDX.sutraChantCfg ? NDX.sutraChantCfg() : null;
ck('A1 sutraChantCfg 已定义', !!CFG);
ck('A2 兜底 LIFE_DAYS 与真值同源（非 18）',
  !!CFG && !!NDX.SUTRA_CHANT && CFG.LIFE_DAYS === NDX.SUTRA_CHANT.LIFE_DAYS,
  'cfg=' + (CFG && CFG.LIFE_DAYS) + ' truth=' + (NDX.SUTRA_CHANT && NDX.SUTRA_CHANT.LIFE_DAYS));
ck('A3 源码（剔注释）无 stale 兜底「LIFE_DAYS || 18」', codeSutra.indexOf('LIFE_DAYS || 18') < 0);
ck('A4 反证：判据对含「LIFE_DAYS || 18」的样本能红（证明 A3 非恒真）',
  /LIFE_DAYS\s*\|\|\s*18/.test('costDays = C.LIFE_DAYS || 18;'));

// ============ B 组 · §⑤-3 注释真值对拍 ============
const sumSide = (tbl) => Object.keys(tbl || {}).reduce((a, k) => {
  const e = tbl[k] || {};
  const v = NDX.sutraCostOf ? NDX.sutraCostOf(e.id || k) : null;
  return a + (typeof v === 'number' ? v : 0);
}, 0);
const ferryCost = sumSide(NDX.SUTRA_FULLS);
const rebelCost = sumSide(NDX.NI_SUTRA_FULLS);
ck('B1 渡侧定价总和 = 223（设计锁）', ferryCost === 223, 'got=' + ferryCost);
ck('B2 逆侧定价总和 = 134（设计锁·正是注释曾写错的 127）', rebelCost === 134, 'got=' + rebelCost);
ck('B3 合计 = 357（设计锁·正是注释曾写错的 350）', ferryCost + rebelCost === 357, 'got=' + (ferryCost + rebelCost));
ck('B4 SPEC 注释已改真值：含「合计 357」且无旧值「合计 350」',
  rawSutra.indexOf('合计 357') >= 0 && rawSutra.indexOf('合计 350') < 0);
ck('B5 已登记「sutraFragOverview() 仅覆盖渡侧」（防再被当合计引用）',
  rawSutra.indexOf('只覆盖渡侧') >= 0);
ck('B6 sutraFragOverview().total 确为**渡侧**单侧值（与 B1 一致，证明它不能当合计）',
  (function () { const o = NDX.sutraFragOverview ? NDX.sutraFragOverview() : null; return !!o && o.total === ferryCost; })());

// ============ C 组 · §⑤-1 叠量三写者同构 ============
ck('C1 渡侧掉落已改为**叠量**（不再是「仅首次记 1」的守卫）',
  /s\.sutraFrags\[fid\]\s*=\s*_prevN \+ 1/.test(codeGameSutra) &&
  codeGameSutra.indexOf('if (!s.sutraFrags[fid])') < 0);
ck('C2 事件侧写者已是叠量（game_event_3）',
  /s\.sutraFrags\[fid\]\s*=\s*\(s\.sutraFrags\[fid\] \|\| 0\) \+/.test(codeEvent3));
ck('C3 逆侧写者已是叠量（data_sutra·niSutraFrags）',
  /s\.niSutraFrags\[fragId\]\s*=\s*\(s\.niSutraFrags\[fragId\] \|\| 0\) \+ 1/.test(codeSutra));
ck('C4 反证：旧守卫写法必须能被 C1 判据拒斥',
  !(/s\.sutraFrags\[fid\]\s*=\s*_prevN \+ 1/.test('if (!s.sutraFrags[fid]) { s.sutraFrags[fid] = 1; }')));

console.log(fail === 0
  ? `ok / 经文单一来源门禁通过（兜底同源 · 注释真值 223/134/357 对拍一致 · 三写者叠量同构）`
  : fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
