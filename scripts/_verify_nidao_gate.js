// _verify_nidao_gate.js — 逆道首周目开缝门禁（2026-09-14 P1 整改 #7）
// ---------------------------------------------------------------------------
// 背景：旧规则下逆道（劫印池 / 谈判收妖 / 逆道随从）被 niDaoUnlocked() 全锁，
//   门槛是「通关任意英雄一次」——首周目玩家完全见不到「暗黑西游」的题眼。
//   现保留通关作为**完全体**门槛，另开首周目通道：本局「逆」命数 ≥ NIDAO_FIRST_CYCLE_GATE 即开缝。
//
// 为什么必须写成「运行时」门禁：本项目已两次栽在「定义了但零消费」上
//   （finishFight nodeType 作用域、RETURN_COST 死常量）——静态 grep 只能证明常量存在，
//   证明不了它被真的读进判定。故本门禁真调 niDaoUnlocked / offerSealsAligned，
//   并用反向反证（抬高阈值后必须重新锁上）确保阈值不是摆设。
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

console.log('\n[逆道首周目开缝] 运行时门禁');

// 固定：未通关（hasClearedAny = false）
NDX.hasClearedAny = () => false;
const G = NDX.NIDAO_FIRST_CYCLE_GATE;

ck('N1 阈值常量 NIDAO_FIRST_CYCLE_GATE 已定义且为正整数', Number.isInteger(G) && G > 0, 'GATE=' + G);
ck('N2 无 state 且未通关 → 不开缝（保守回落，防误解锁）', NDX.niDaoUnlocked() === false, String(NDX.niDaoUnlocked()));
ck('N3 未通关 + 逆命数 ' + (G - 1) + '（差 1）→ 仍锁',
  NDX.niDaoUnlocked({ fate: { 逆: G - 1 } }) === false, String(NDX.niDaoUnlocked({ fate: { 逆: G - 1 } })));
ck('N4 未通关 + 逆命数 ' + G + '（达阈值）→ 开缝',
  NDX.niDaoUnlocked({ fate: { 逆: G } }) === true, String(NDX.niDaoUnlocked({ fate: { 逆: G } })));
ck('N5 未通关 + 逆命数远超阈值 → 开缝', NDX.niDaoUnlocked({ fate: { 逆: G + 20 } }) === true);
ck('N6 未通关 + 他道命数高但逆为 0 → 仍锁（只认逆，不是任意命数）',
  NDX.niDaoUnlocked({ fate: { 战: 30, 渡: 30 } }) === false);
ck('N7 通关后无条件开缝（完全体门槛保留）', (() => {
  NDX.hasClearedAny = () => true;
  const r = NDX.niDaoUnlocked({ fate: { 逆: 0 } }) && NDX.niDaoUnlocked();
  NDX.hasClearedAny = () => false;
  return r === true;
})());

// N8 反向反证：把阈值抬到极高，同一 state 必须重新锁上（证明阈值真被消费，而非恒 true）
ck('N8 反向反证：阈值抬到 999 后，逆命数 ' + G + ' 必须重新锁上', (() => {
  const old = NDX.NIDAO_FIRST_CYCLE_GATE;
  NDX.NIDAO_FIRST_CYCLE_GATE = 999;
  const r = NDX.niDaoUnlocked({ fate: { 逆: G } });
  NDX.NIDAO_FIRST_CYCLE_GATE = old;
  return r === false;
})());

// N9 运行时链路：恶阵营劫印池在「未通关 + 逆命数达标」时应含「逆」，未达标时应剔除
const mkState = (ni) => ({ hero: 'wukong', fate: { 逆: ni }, seals: [], equips: [] });
ck('N9 劫印恶阵营池：未通关 + 逆命数达标 → 池含「逆」', (() => {
  try {
    const out = NDX.offerSealsAligned('wukong', 1, mkState(G), 'evil');
    const names = (out || []).map((x) => (x && x.dao) || (x && x.name) || '').join(',');
    return (out || []).some((x) => x && x.dao === '逆');
  } catch (e) { return false; }
})());
ck('N10 劫印恶阵营池：未通关 + 逆命数 0 → 池不含「逆」（旧行为保留）', (() => {
  try {
    const out = NDX.offerSealsAligned('wukong', 1, mkState(0), 'evil');
    return !(out || []).some((x) => x && x.dao === '逆');
  } catch (e) { return false; }
})());

// N11 源码守卫：调用点必须把 state 传进去（空参调用会让首周目旁路永不生效）
const srcFiles = ['js/jieseals.js', 'js/data_negotiate.js', 'js/ui/ui_misc_2.js'];
const emptyCalls = [];
srcFiles.forEach((f) => {
  const t = fs.readFileSync(path.join(ROOT, f), 'utf8');
  // 排除函数定义行本身（function niDaoUnlocked(s)）
  t.split(/\r?\n/).forEach((l, i) => {
    if (/niDaoUnlocked\(\s*\)/.test(l) && !/function\s+niDaoUnlocked/.test(l)) {
      emptyCalls.push(f + ':' + (i + 1));
    }
  });
});
ck('N11 无「空参 niDaoUnlocked()」调用（st 须透传，否则首周目旁路形同虚设）',
  emptyCalls.length === 0, emptyCalls.join(' | '));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
