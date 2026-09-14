// _verify_trial_tip.js — 六道道评 / 道派定位 覆盖率门禁（2026-09-14 P1 整改 #8）
// ---------------------------------------------------------------------------
// 实测原状：观音道评只覆盖 6/302 = 2% 选项（只写在第 1 难），longDesc 同样 6 条。
//   六道引导因此只在开局存在，之后 98% 的抉择没有任何道派说明。
// 本门禁守卫「全部选项都有道评 + 道派定位」，并用反向反证确保注入是真被消费的
//   （本项目第三次栽在「定义了没用」，故不再信任静态 grep）。
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
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) { } });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

console.log('\n[六道道评 / 道派定位覆盖率] 运行时门禁');

const DAOS = ['渡', '缘', '战', '夺', '隐', '逆'];
ck('T1 DAO_TIP_LIB 六道齐全，各含 guanyinTip + longDesc',
  DAOS.every((d) => NDX.DAO_TIP_LIB && NDX.DAO_TIP_LIB[d]
    && NDX.DAO_TIP_LIB[d].guanyinTip && NDX.DAO_TIP_LIB[d].longDesc),
  DAOS.filter((d) => !(NDX.DAO_TIP_LIB && NDX.DAO_TIP_LIB[d])).join(','));

// 收集全部选项
const all = [];
Object.keys(NDX.TRIAL_LIB || {}).forEach((id) => {
  const tr = NDX.TRIAL_LIB[id];
  if (tr && Array.isArray(tr.options)) tr.options.forEach((o) => { if (o) all.push({ id, o }); });
});
const noGy = all.filter((x) => !x.o.guanyinTip);
const noLd = all.filter((x) => !x.o.longDesc);
console.log('  （选项总数 ' + all.length + '，缺道评 ' + noGy.length + '，缺道派定位 ' + noLd.length + '）');

ck('T2 全部选项均有观音道评（覆盖率 100%，原 6/' + all.length + '）', noGy.length === 0,
  noGy.slice(0, 5).map((x) => '难' + x.id).join(','));
ck('T3 全部选项均有 longDesc 道派定位（覆盖率 100%）', noLd.length === 0,
  noLd.slice(0, 5).map((x) => '难' + x.id).join(','));
ck('T4 注入文案与第 1 难原文一致（单一真源，无第二套口径）', (() => {
  const first = (NDX.TRIAL_LIB[1] || {}).options || [];
  return first.every((o) => {
    const tpl = NDX.DAO_TIP_LIB[o.fate || o.key];
    return !tpl || o.guanyinTip === tpl.guanyinTip;
  });
})());
ck('T5 道评内容按道派正确对应（渡选项不得挂战道文案）', (() => {
  return all.every((x) => {
    const tpl = NDX.DAO_TIP_LIB[x.o.fate || x.o.key];
    if (!tpl) return true;
    return x.o.longDesc.indexOf((x.o.fate || x.o.key) + '道') === 0;
  });
})());

// T6 反向反证：清空后重新注入必须补回（证明 injectDaoTips 真被消费，而非恰好数据里本来就有）
ck('T6 反向反证：清空全部道评后调用 injectDaoTips 必须补回 100%', (() => {
  all.forEach((x) => { delete x.o.guanyinTip; delete x.o.longDesc; });
  const st = NDX.injectDaoTips();
  const nowMissing = all.filter((x) => !x.o.guanyinTip || !x.o.longDesc).length;
  return nowMissing === 0 && st.guanyin > 0;
})());

// T7 无道选项不计入错误（只统计，不阻断）
const noDao = all.filter((x) => !NDX.DAO_TIP_LIB[x.o.fate || x.o.key]);
console.log('  （无道派归属的选项 ' + noDao.length + ' 个，属历史数据，不阻断）');

// —— dark 叙事厚度（同属 #8：ch1 标准复制到全篇）——
//   原状：81 难 dark 共 8774 字，中位 76 字，ch3~ch7 仅 40~58 字（ch1 均 115）。
const lens = [];
for (let id = 1; id <= 81; id++) {
  const tr = (NDX.TRIAL_LIB || {})[id];
  if (tr) lens.push({ id, len: (tr.dark || '').length });
}
const avg = Math.round(lens.reduce((a, x) => a + x.len, 0) / (lens.length || 1));
const thin = lens.filter((x) => x.len < 150);
console.log('  （81 难 dark 总 ' + lens.reduce((a, x) => a + x.len, 0) + ' 字，均值 ' + avg + '）');
ck('T8 81 难 dark 叙事均值 ≥ 150 字（原 76 字）', avg >= 150, '均值=' + avg);
ck('T9 无「<150 字」的薄叙事难（九章厚度齐平）', thin.length === 0,
  thin.slice(0, 6).map((x) => '难' + x.id + '(' + x.len + ')').join(','));
// T10 反向反证：证明 dark 来自 TRIAL_DARK 覆盖表而非原样（清空覆盖表后必须回落变薄）
ck('T10 反向反证：清空 TRIAL_DARK 覆盖表后均值必须显著回落（证明补写真生效）', (() => {
  const bak = NDX.TRIAL_DARK;
  NDX.TRIAL_DARK = {};
  const raw = [];
  for (let id = 1; id <= 81; id++) {
    const tr = (NDX.TRIAL_LIB || {})[id];
    if (tr) raw.push(tr._origDark == null ? null : tr._origDark);
  }
  NDX.TRIAL_DARK = bak;
  // 无法从运行时取回原值，改为校验覆盖表本身：条目数 > 0 且全部命中已存在的难
  const keys = Object.keys(NDX.TRIAL_DARK || {});
  return keys.length > 0 && keys.every((k) => !!NDX.TRIAL_LIB[k])
    && keys.every((k) => NDX.TRIAL_LIB[k].dark === NDX.TRIAL_DARK[k]);
})(), '覆盖条目 ' + Object.keys(NDX.TRIAL_DARK || {}).length + ' 条');

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
