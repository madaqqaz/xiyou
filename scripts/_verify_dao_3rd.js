// _verify_dao_3rd.js — 六道三转「章门槛(actGate)」统一门禁（总纲 v5.14 §六 D1 落地 · V9.9）
// ---------------------------------------------------------------------------
// 背景：六道三转章门槛历史上各道不一（渡/缘 2·5·8、战 3·6·9、夺 4·7·9、隐 3·6·8、逆 4·7·9），
//   导致「同一章、不同道，一个能转一个不能转」，玩家无法建立节奏预期。
//   总纲 v5.13 §六 D1 拍板：**六道统一 3 / 6 / 8，仅【逆】维持 4 / 7 / 9**（逆=高难分支，刻意晚一章）。
//
// 为什么必须写成「运行时」门禁：本项目已两次栽在「定义了但零消费」上（finishFight 作用域、
//   RETURN_COST 死常量）——静态 grep 只能证明字面值，证明不了它被读进判定。故本门禁真调
//   NDX.ZHUANJIE.gateOf / gateMet / chapterOf，并做**临界章反证**（差一章必不过、达章必过），
//   排除「actNeed 被短路 / 被 clamp 吞掉 / gateMet 恒真」三类假通过。
// 运行：node scripts/_verify_dao_3rd.js
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
  .filter((f) => !SKIP.has(f))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;
const Z = NDX && NDX.ZHUANJIE;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};
const rel = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

console.log('\n[六道三转章门槛统一] 门禁');

ck('G0 NDX.ZHUANJIE 已挂载', !!Z && typeof Z.gateOf === 'function' && typeof Z.gateMet === 'function');

// ---------------------------------------------------------------- A 静态真源
const WANT = { '渡': [3, 6, 8], '缘': [3, 6, 8], '战': [3, 6, 8], '夺': [3, 6, 8], '隐': [3, 6, 8], '逆': [4, 7, 9] };
const DAOS = Object.keys(WANT);
DAOS.forEach((dao) => {
  const C = Z && Z.CLASSES && Z.CLASSES[dao];
  const got = C && C.actGate;
  ck('A ' + dao + ' actGate = [' + WANT[dao].join(', ') + ']',
    Array.isArray(got) && got.length === 3 && got.every((v, i) => v === WANT[dao][i]),
    'got=' + JSON.stringify(got));
});
ck('A 六道 daoGate 仍为 18/28/38（D2 维持不变）',
  DAOS.every((d) => JSON.stringify(Z.CLASSES[d].daoGate) === '[18,28,38]'));
ck('A actGate 单调不减（六道）',
  DAOS.every((d) => { const a = Z.CLASSES[d].actGate; return a[0] <= a[1] && a[1] <= a[2]; }));
ck('A Z.selfCheck() 通过', (() => { try { return Z.selfCheck().ok === true; } catch (e) { return false; } })());

const src = rel('js/zhuanjie.js');
ck('A 源码已无旧值 actGate:[2,5,8]（渡/缘）', src.indexOf('actGate: [2, 5, 8]') < 0);
ck('A 源码已无旧值 actGate:[3,6,9]（战）', src.indexOf('actGate: [3, 6, 9]') < 0);
ck('A 源码 [3,6,8] 恰 5 处（渡/缘/战/夺/隐）', (src.match(/actGate: \[3, 6, 8\]/g) || []).length === 5,
  'n=' + (src.match(/actGate: \[3, 6, 8\]/g) || []).length);
ck('A 源码 [4,7,9] 恰 1 处（逆）', (src.match(/actGate: \[4, 7, 9\]/g) || []).length === 1);

// ---------------------------------------------------------------- B 运行时消费
DAOS.forEach((dao) => {
  const g = Z.gateOf(dao, 2);
  ck('B ' + dao + ' 三转 gateOf().actNeed = ' + WANT[dao][2], g && g.actNeed === WANT[dao][2],
    'actNeed=' + (g && g.actNeed));
});
ck('B chapterOf 直通（act 8 → 8，9 章制 clamp）',
  Z.chapterOf({ act: 8 }) === 8 && Z.chapterOf({ act: 9 }) === 9 && Z.chapterOf({ act: 99 }) === 9);

// ---------------------------------------------------------------- C 临界章反证
const mkState = (act, dao) => ({
  act: act,
  fate: { [dao]: 999 },
  good: 99, evil: 0,
  flags: { tierUp: { behavior: { [dao]: 999 } } },
});
DAOS.forEach((dao) => {
  const cut = WANT[dao][2];              // 三转门槛章
  const g = Z.gateOf(dao, 2);
  const before = Z.gateMet(mkState(cut - 1, dao), g);
  const at = Z.gateMet(mkState(cut, dao), g);
  ck('C ' + dao + ' 章 ' + (cut - 1) + '（差 1）→ 不通过', before === false, String(before));
  ck('C ' + dao + ' 章 ' + cut + '（达门槛）→ 通过', at === true, String(at));
});
// C 反向反证：把门槛抬到 9 章，同一 state（章 8 非逆道）必须重新关闸（证明 actNeed 真被消费）
ck('C 反向反证：战三转门槛临时抬到 9 → 章 8 必须关闸', (() => {
  const C = Z.CLASSES['战'], old = C.actGate.slice();
  C.actGate = [3, 6, 9];
  const r = Z.gateMet(mkState(8, '战'), Z.gateOf('战', 2));
  C.actGate = old;
  return r === false;
})());

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
