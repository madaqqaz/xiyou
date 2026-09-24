// _smoke_seg_fx.js — 演出层「逐段独立打击特效 + 从怪逐怪行动特效」冒烟门禁（V9.39）
// 断言：① 多段伤害：每段各自飘字 + 各自震屏/刀光/击退（按 SEG_GAP_MS 错峰）
//       ② 单段退回旧路径（不拆分段、特效仍各一次）
//       ③ 编队从怪逐怪行动：counter 怪各有震屏/刀光；stunned 怪只出文字标签
//       ④ fx 处理器接受 delay 且 _fxSlash 已非空实现（结构性断言）
// 注 1：_emitBattleFx 是 main.js 的 script-scope 函数，**必须在 vm 内调用**（跨 realm 直调不产生 emit）。
// 注 2：战斗特效总线签名为 `NDX.ui.emit(evt, data)`（两参）——桩必须按两参接收，否则 data 收不到。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

const _noop = () => {};
const _store = {};
const sb = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON,
  navigator: { userAgent: 'node' },
  localStorage: { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; } },
  document: {
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
    querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
};
sb.window = sb; sb.global = sb; sb.self = sb;
const ctx = vm.createContext(sb);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
[...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]).forEach((f) => {
  if (/^https?:/.test(f)) return;
  const p = f.split('?')[0];
  if (!fs.existsSync(path.join(ROOT, p))) return;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p }); } catch (e) {}
});
const NDX = sb.NDX;

console.log('\n[演出层·逐段打击特效] 冒烟');

// 事件捕获桩（在 vm 内注册，避免跨 realm）；总线签名为 (evt, data)
sb.__seen = [];
vm.runInContext('NDX.ui = NDX.ui || {}; NDX.ui.emit = function (evt, data) { if (evt === "battle-fx" && data && data.type) __seen.push(data); }; NDX.ui.fightSpeed = 1;', ctx);

function runFx(res) {
  sb.__res = res;
  sb.__p = { roundIdx: 0, monster: { hp: 1000 }, maxHp: 4000, mHp: 1 };
  sb.__g = { state: { currentHeroId: 'tangseng' } };
  vm.runInContext('__seen.length = 0; _emitBattleFx(__p, __res, __g, {});', ctx);
  return sb.__seen;
}

ck('E1 _emitBattleFx 可调用（main.js 表现层入口）', typeof sb._emitBattleFx === 'function');
ck('E2 SEG_GAP_MS 为单一真源常量（NDX.TIMING）', NDX.TIMING && NDX.TIMING.SEG_GAP_MS === 150, 'v=' + (NDX.TIMING && NDX.TIMING.SEG_GAP_MS));
const GAP = (NDX.TIMING && NDX.TIMING.SEG_GAP_MS) || 150;

const byType = (seen, t, side) => seen.filter((e) => e.type === t && (side == null || e.side === side));

// ① 多段：3 段（hit + crit + combo）
{
  const seen = runFx({ roundsDetail: [{
    round: 1, first: 'player', resolve: {},
    pTurn: { deal: 300, cri: true, reflect: 0, segs: [{ dmg: 120, kind: 'hit' }, { dmg: 100, kind: 'crit' }, { dmg: 80, kind: 'combo' }] },
    mTurn: null, squadActs: null,
  }] });
  const fly = byType(seen, 'dmg-fly', 'foe');
  const shake = byType(seen, 'shake');
  const slash = byType(seen, 'slash');
  const kb = byType(seen, 'knockback');
  ck('E3 事件桩真收到 battle-fx（总线两参签名）', seen.length > 0, 'n=' + seen.length);
  ck('F1 三段各出一次飘字', fly.length === 3, 'n=' + fly.length);
  ck('F2 段和 === pTurn.deal（300）', fly.reduce((a, x) => a + x.dmg, 0) === 300, JSON.stringify(fly.map((x) => x.dmg)));
  ck('F3 飘字按 SEG_GAP_MS 错峰（0/1/2 档）', fly.length === 3 && fly.every((x, i) => x.delay === i * GAP), JSON.stringify(fly.map((x) => x.delay)));
  ck('F4 首段发声 / 后续段 silent（防叠播）', fly.length === 3 && fly[0].silent !== true && fly[1].silent === true && fly[2].silent === true, JSON.stringify(fly.map((x) => x.silent)));
  ck('F5 逐段独立震屏（3 次，各自错峰）', shake.length === 3 && shake.every((x, i) => x.delay === i * GAP), 'n=' + shake.length + ' ' + JSON.stringify(shake.map((x) => x.delay)));
  ck('F6 逐段独立刀光（3 次，各自错峰）', slash.length === 3 && slash.every((x, i) => x.delay === i * GAP), 'n=' + slash.length + ' ' + JSON.stringify(slash.map((x) => x.delay)));
  ck('F7 逐段独立击退（3 次，各自错峰）', kb.length === 3 && kb.every((x, i) => x.delay === i * GAP), 'n=' + kb.length + ' ' + JSON.stringify(kb.map((x) => x.delay)));
  ck('F8 扑击仍只一次（不随段数放大）', byType(seen, 'strike').length === 1, 'n=' + byType(seen, 'strike').length);
  ck('F9 crit 段飘字 kind=crit 且 cri=true', fly.some((x) => x.kind === 'crit' && x.cri === true), JSON.stringify(fly.map((x) => x.kind + '/' + x.cri)));
  ck('F10 combo 段飘字 kind=combo', fly.some((x) => x.kind === 'combo'));
}

// ② 单段：退回旧路径
{
  const seen = runFx({ roundsDetail: [{ round: 1, first: 'player', resolve: {}, pTurn: { deal: 200, cri: false, reflect: 0, segs: null }, mTurn: null, squadActs: null }] });
  const fly = byType(seen, 'dmg-fly', 'foe');
  ck('G1 单段：仅 1 条飘字（不拆段）', fly.length === 1 && fly[0].dmg === 200, 'n=' + fly.length);
  ck('G2 单段：震屏 / 刀光 / 击退各 1 次（旧路径）', byType(seen, 'shake').length === 1 && byType(seen, 'slash').length === 1 && byType(seen, 'knockback').length === 1, 'shake=' + byType(seen, 'shake').length + ' slash=' + byType(seen, 'slash').length + ' kb=' + byType(seen, 'knockback').length);
  ck('G3 单段：未强制设置 delay（默认无错峰）', fly.length === 1 && fly[0].delay == null, 'delay=' + (fly[0] && fly[0].delay));
}

// ③ 编队从怪逐怪行动特效（主怪先出手一次 → 从怪按序错峰，基址 = SEG_GAP_MS）
{
  const seen = runFx({ roundsDetail: [{
    round: 1, first: 'enemy', resolve: {},
    pTurn: null, mTurn: { deal: 40, reflect: 0 },
    squadActs: [
      { ord: 1, idx: 1, name: '从一', kind: 'counter', dmg: 20, cum: 20, st: ['sunder×2'] },
      { ord: 2, idx: 2, name: '从二', kind: 'stunned', dmg: 0, cum: 20, st: ['stun'], tag: '定身' },
      { ord: 3, idx: 3, name: '从三', kind: 'counter', dmg: 10, cum: 30, st: [] },
    ],
  }] });
  const you = (t) => byType(seen, t, 'you');
  // 主怪那一次 you-side 飘字不带 delay；从怪行动飘字一律带 delay（错峰基址 = SEG_GAP_MS）
  const sfly = you('dmg-fly').filter((x) => x.delay != null);
  ck('H0 主怪行动飘字无 delay（与从怪行动可区分）', you('dmg-fly').filter((x) => x.delay == null).length === 1, 'n=' + you('dmg-fly').filter((x) => x.delay == null).length);
  ck('H1 从怪行动各出飘字（3 次）', sfly.length === 3, 'n=' + sfly.length);
  ck('H2 定身怪只出文字标签（零伤）', (() => { const z = sfly.find((x) => x.kind === 'stun'); return !!z && z.dmg === 0 && z.text === '定身'; })(), JSON.stringify(sfly.map((x) => x.kind + ':' + x.dmg + '/' + x.text)));
  ck('H3 仅出手怪（counter）各有震屏 + 刀光（各 2 次）', you('shake').length === 2 && you('slash').length === 2, 'shake=' + you('shake').length + ' slash=' + you('slash').length);
  ck('H4 从怪行动跟在主怪之后错峰（基址 SEG_GAP_MS，非递减）', sfly.length === 3 && sfly[0].delay === GAP && sfly.every((x, i) => i === 0 || x.delay >= sfly[i - 1].delay), JSON.stringify(sfly.map((x) => x.delay)));
}

// ⑤ 玩家群伤逐怪飘字（V9.40）
{
  const seen = runFx({ roundsDetail: [{
    round: 1, first: 'player', resolve: {},
    pTurn: { deal: 300, cri: true, reflect: 0, segs: [{ dmg: 180, kind: 'hit' }, { dmg: 120, kind: 'crit' }] },
    mTurn: { deal: 40, reflect: 0 },
    squadSplash: [
      { idx: 1, name: '从一', dmg: 60, killed: false },
      { idx: 2, name: '从二', dmg: 55, killed: false },
      { idx: 3, name: '从三', dmg: 0, killed: false },
    ],
    squadActs: [{ ord: 1, idx: 1, name: '从一', kind: 'counter', dmg: 20, cum: 20, st: [] }],
  }] });
  const foeFly = seen.filter((e) => e.type === 'dmg-fly' && e.side === 'foe');
  const segFly = foeFly.filter((e) => e.squad == null);
  const spFly = foeFly.filter((e) => e.squad != null);
  ck('J1 群伤逐怪各出一次飘字（零伤怪跳过 → 2 条）', spFly.length === 2, 'n=' + spFly.length);
  ck('J2 主怪段伤害仍 2 条（不被群伤混入）', segFly.length === 2, 'n=' + segFly.length);
  ck('J3 群伤飘字带从怪名（可归属）', spFly.map((x) => x.squad).join(',') === '从一,从二', JSON.stringify(spFly.map((x) => x.squad)));
  ck('J4 群伤排在主怪段伤害之后并逐怪错峰（基址 = 段数 × GAP）', spFly.length === 2 && spFly[0].delay === 2 * GAP && spFly[1].delay === 3 * GAP, JSON.stringify(spFly.map((x) => x.delay)));
  ck('J5 从怪依次反击再排到群伤之后', (() => {
    const act = seen.find((e) => e.type === 'dmg-fly' && e.side === 'you' && e.delay != null);
    return !!act && act.delay > spFly[1].delay;
  })(), 'act=' + JSON.stringify((seen.find((e) => e.type === 'dmg-fly' && e.side === 'you' && e.delay != null) || {}).delay));
}

// ⑥ 逐段独立命中判定帧（V9.40）
{
  const seen = runFx({ roundsDetail: [{
    round: 1, first: 'player', resolve: {},
    pTurn: { deal: 300, cri: true, reflect: 0, segs: [{ dmg: 180, kind: 'hit' }, { dmg: 120, kind: 'crit' }] },
    mTurn: null, squadActs: null,
  }] });
  const hs = seen.filter((e) => e.type === 'hitstop');
  const hf = seen.filter((e) => e.type === 'hit-flash');
  ck('K1 多段时顿帧逐段发出（2 段 → 2 次，不再是整击一次）', hs.length === 2, 'n=' + hs.length);
  ck('K2 逐段顿帧按 SEG_GAP_MS 错峰（0 / GAP）', hs.length === 2 && hs.every((x, i) => x.delay === i * GAP), JSON.stringify(hs.map((x) => x.delay)));
  ck('K3 顿帧分级：crit 段取 crit，物理段降一档（heavy）', hs.some((x) => x.level === 'crit') && hs.some((x) => x.level === 'heavy'), JSON.stringify(hs.map((x) => x.level)));
  ck('K4 逐段受击白闪（2 次，各自错峰、side=foe）', hf.length === 2 && hf.every((x, i) => x.delay === i * GAP && x.side === 'foe'), JSON.stringify(hf.map((x) => x.delay + '/' + x.side)));
  ck('K5 整击级高潮仍只一次（climax 不随段数放大）', seen.filter((e) => e.type === 'climax').length === 1, 'n=' + seen.filter((e) => e.type === 'climax').length);
}

// ⑦ 单段路径仍「整击一次」，不因 V9.40 变双顿帧
{
  const seen = runFx({ roundsDetail: [{ round: 1, first: 'player', resolve: {}, pTurn: { deal: 200, cri: false, reflect: 0, segs: null }, mTurn: null, squadActs: null }] });
  const hs = seen.filter((e) => e.type === 'hitstop');
  ck('K6 单段只顿帧一次且无 delay（旧路径零回归）', hs.length === 1 && hs[0].delay == null, 'n=' + hs.length + ' delay=' + (hs[0] && hs[0].delay));
  ck('K7 单段不发逐段白闪（走旧路径）', seen.filter((e) => e.type === 'hit-flash').length === 0, 'n=' + seen.filter((e) => e.type === 'hit-flash').length);
}

// ④ fx 处理器接受 delay 且实现非空
{
  let threw = null;
  try {
    NDX.ui._fxScreenShake({ kind: 'crit', side: 'foe', delay: 150 });
    NDX.ui._fxKnockback({ side: 'foe', kind: 'crit', delay: 150 });
    NDX.ui._fxSlash({ kind: 'crit', side: 'foe', delay: 150 });
    NDX.ui._fxSlash({ kind: 'combo', side: 'foe', delay: 0 });
  } catch (e) { threw = e; }
  try { NDX.ui._fxHitFlash('foe', 300); NDX.ui._fxHitFlash('foe', 0); } catch (e) { threw = e; }
  ck('I1 震屏 / 击退 / 刀光 / 受击白闪四处理器接受 delay 且不抛异常', !threw, threw && threw.message);
  ck('I2 _fxSlash 已是真实实现（不再 return 空操作）', String(NDX.ui._fxSlash).includes('fx-seg-spark') && String(NDX.ui._fxSlash).includes('delay'));
  ck('I3 _fxSlash 按 kind 分类样式（hit/crit/combo/hurt）', String(NDX.ui._fxSlash).includes('fx-spark-'));
  ck('I4 刀光样式已落地（.fx-seg-spark 规则存在）', /\.fx-seg-spark\s*\{/.test(fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8')));
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
