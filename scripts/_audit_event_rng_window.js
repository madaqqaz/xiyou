// _audit_event_rng_window.js — S10 事件 · 区域窗口合法性 + rng 可注入 门禁
//
// A 组 §⑤-4：事件区域窗口必须落在**章制口径 1 ≤ regionMin ≤ regionMax ≤ 9**（越界会让窗口"上方无界"），
//   且不得存在恒假阈值（如 `regionMin >= 12` 在 1..9 口径下永不命中 ⇒ 加权高档从未生效）。
// B 组 §⑤-6：`rollYuan` / `weightedSutraPick` 必须支持 `rng` 注入——注入时**完全由该 rng 决定**（可复现），
//   不传时走**播种轴** `NDX.runRandom`（非裸 Math.random）。
// 含反证：越界窗口样本与恒假阈值样本必须被判据拒斥。
//
// 运行：node scripts/_audit_event_rng_window.js（已登记进 _run_all_gates.js）
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
const stripComments = (t) => t.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
const codeEv1 = stripComments(fs.readFileSync(path.join(ROOT, 'js/events_part1.js'), 'utf8'));
const codeEv2 = stripComments(fs.readFileSync(path.join(ROOT, 'js/events_part2.js'), 'utf8'));

// ============ A 组 · §⑤-4 区域窗口合法性 ============
const MIN_ACT = 1, MAX_ACT = 9;   // 章制口径（9 章）
const okWin = (e) => e.regionMin >= MIN_ACT && e.regionMax <= MAX_ACT && e.regionMin <= e.regionMax;
// 自发现所有含 regionMin 的事件表（防写死表名漏检）
const tables = Object.keys(NDX).filter((k) => Array.isArray(NDX[k])
  && NDX[k].some((e) => e && typeof e === 'object' && 'regionMin' in e));
ck('A1 自发现事件表（防取不到真源空过）', tables.length > 0, 'tables=' + tables.join(','));
let allN = 0, bad = [];
tables.forEach((t) => (NDX[t] || []).forEach((e) => {
  if (!e || typeof e !== 'object' || !('regionMin' in e)) return;
  allN++;
  if (!okWin(e)) bad.push(t + ':' + (e.id || '?') + '[' + e.regionMin + ',' + e.regionMax + ']');
}));
ck('A2 全部事件窗口满足 1 ≤ min ≤ max ≤ ' + MAX_ACT + '（n=' + allN + '）', bad.length === 0, bad.slice(0, 6).join(' , '));
ck('A3 源码（剔注释）无恒假阈值「regionMin >= 12」', codeEv2.indexOf('regionMin >= 12') < 0);
ck('A4 源码含修正后的可达阈值「regionMin >= 8」', codeEv2.indexOf('regionMin >= 8') >= 0);
// 反证
ck('A5 反证：越界窗口 {min:8,max:13} 被 A2 判据拒斥', !okWin({ regionMin: 8, regionMax: 13 }));
ck('A6 反证：恒假阈值样本能被 A3 判据识别',
  /regionMin\s*>=\s*12/.test('w *= (ev.regionMin >= 12) ? 1.5 : 1.2;'));

// ============ B 组 · §⑤-6 rng 可注入 ============
ck('B1 rollYuan / weightedSutraPick 均已定义（arity ≥ 2）',
  typeof NDX.rollYuan === 'function' && NDX.rollYuan.length >= 2
  && typeof NDX.weightedSutraPick === 'function' && NDX.weightedSutraPick.length >= 2,
  'rollYuan.length=' + (NDX.rollYuan && NDX.rollYuan.length) + ' pick.length=' + (NDX.weightedSutraPick && NDX.weightedSutraPick.length));

// rollYuan：注入 rng 必须**完全决定**结果
{
  let calls = 0;
  const zero = () => { calls++; return 0; };
  const r1 = NDX.rollYuan({ eventPity: 0 }, zero);
  ck('B2 rollYuan 注入 rng=0 ⇒ 遭遇战且「小怪」（0<10% 且 0<0.5）', r1 === 'mob', 'got=' + r1);
  ck('B3 rollYuan 确实消费注入 rng（非改写 Math.random）', calls === 2, 'calls=' + calls);

  const hi = NDX.rollYuan({ eventPity: 0 }, () => 0.99);
  ck('B4 rollYuan 注入 rng=0.99 ⇒ 未遇战（0.99 ≥ 10%）', hi === 'event', 'got=' + hi);

  const seq = [0.05, 0.9]; let k = 0;
  const r3 = NDX.rollYuan({ eventPity: 0 }, () => seq[k++]);
  ck('B5 rollYuan 序列 rng=[0.05,0.9] ⇒ 遭遇战「劫(elite)」', r3 === 'elite', 'got=' + r3);

  // 同 rng 序列两次 ⇒ 同结果（可复现）
  const mkSeq = () => { const a = [0.05, 0.9]; let i = 0; return () => a[i++]; };
  ck('B6 rollYuan 同 seed 复现：两次同序列结果一致',
    NDX.rollYuan({ eventPity: 0 }, mkSeq()) === NDX.rollYuan({ eventPity: 0 }, mkSeq()));
}

// weightedSutraPick：注入 rng=0 ⇒ 取首项；且消费 rng
{
  const pool = [{ id: 'a', side: 'ferry', regionMin: 3 }, { id: 'b', side: 'rebel', regionMin: 8 }];
  let calls = 0;
  const p1 = NDX.weightedSutraPick(pool, {}, () => { calls++; return 0; });
  ck('B7 weightedSutraPick 注入 rng=0 ⇒ 返回首项', p1 && p1.id === 'a', 'got=' + (p1 && p1.id));
  ck('B8 weightedSutraPick 确实消费注入 rng', calls === 1, 'calls=' + calls);
  let q = 0;
  const p2 = NDX.weightedSutraPick(pool, {}, () => { q++; return 0.999; });
  ck('B9 weightedSutraPick 注入 rng≈1 ⇒ 返回末项（证明 rng 决定结果）', p2 && p2.id === 'b', 'got=' + (p2 && p2.id));
}

// 默认路径走播种轴（源码级）
ck('B10 源码（剔注释）不含裸「Math.random() * total」', codeEv2.indexOf('Math.random() * total') < 0);
ck('B11 rollYuan 默认走播种轴（`rng || NDX.runRandom`）', /rng \|\| NDX\.runRandom/.test(codeEv1));
ck('B12 反证：B10 判据对裸写样本能红', /Math\.random\(\) \* total/.test('  var r = Math.random() * total;'));

console.log(fail === 0
  ? `ok / 事件窗口 + rng 注入门禁通过（窗口全合法 n=${allN}；rollYuan/weightedSutraPick 注入可复现、默认播种轴）`
  : fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
