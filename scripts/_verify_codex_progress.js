// _verify_codex_progress.js — 「图鉴进度分母」实证探针
// 背景：data_codex.js 原用 NDX.EQUIPMENTS / NDX.SEALS / NDX.TREASURES.length 求分母，
//   但 equip/seal 真源字段不存在、treasure 是对象 → 三者分母恒 0、进度条永远 0%。
// 断言：6 个分类的分母均 > 0，且法宝分母 = TREASURES 条目数、劫印 = SEAL_WORDS 条目数。
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

ck('_count helper 已定义', typeof NDX.CODEX._count === 'function');
ck('全部分类 progress 可调用', typeof NDX.CODEX.progress === 'function');

const cats = Object.keys(NDX.CODEX.CATEGORIES);
cats.forEach((c) => {
  const p = NDX.CODEX.progress(c);
  ck('分母 > 0 : ' + c, p.total > 0, 'total=' + p.total);
});

const pt = NDX.CODEX.progress('treasure');
const expTre = Object.keys(NDX.TREASURES || {}).length;
ck('法宝分母 = TREASURES 条目数', pt.total === expTre, 'got=' + pt.total + ' exp=' + expTre);

const ps = NDX.CODEX.progress('seal');
const expSeal = Object.keys(NDX.SEAL_WORDS || {}).length;
ck('劫印分母 = SEAL_WORDS 条目数', ps.total === expSeal, 'got=' + ps.total + ' exp=' + expSeal);

const pe = NDX.CODEX.progress('equip');
ck('装备分母 > 0（EQUIP_POOL+CRAFT_POOL 去重）', pe.total > 0, 'got=' + pe.total);

// 新名器应计入法宝分母（证明新内容已纳入图鉴统计口径）
ck('法宝分母包含新增名器（≥6 件）', expTre >= 6, 'exp=' + expTre);

console.log('结论：通过 / 失败 = ' + pass + ' / ' + fail);
process.exit(fail ? 1 : 0);
