// _verify_final_damage.js — 逆道·终伤乘区门禁（V9.43）
// 背景（V2.0 深度报告 §8.1 / §8.2）：
//   逆道六道轴 stat='finalDamage'（jieseals.js 八印：戾骨/蚀骨/万劫/流沙/修罗/咒怨/不灭/轮回），
//   但 combat_part1.js 产出端读的是**未声明**变量 `sealFinalDamage` → NDX.computeStats() 必抛
//   ReferenceError（3 个调用点 game_meta.js:43 / game_event_2.js:746 / attr_calc.js:333 全中）；
//   且全仓无任何读取端 → 逆道玩家零可感知收益（死字段）。
//   更糟的是：42 项门禁**无一项调用 computeStats** → 「42/42 全绿」与「走到了就崩」同时成立。
// 本门禁同时承担两个职责：
//   ① 盲区封堵：真实调用 NDX.computeStats（产出端不再抛 + 字段形状正确）；
//   ② 接线锁定：逆印累计 / 独立乘区 ×(1+Σ) / 封顶 / 段和恒等（V9.39 不变量保持）。
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

// —— 沙箱：Proxy 兜底 DOM（使含 document 的模块也能加载，尽量逼近 164/164）——
const _noop = () => {};
const _store = {};
const _el = () => new Proxy({
  style: {}, dataset: {}, classList: { add: _noop, remove: _noop, toggle: _noop, contains: () => false },
  children: [], innerHTML: '', textContent: '', value: '', width: 0, height: 0,
  appendChild: _noop, removeChild: _noop, remove: _noop, insertBefore: _noop,
  setAttribute: _noop, getAttribute: () => null, removeAttribute: _noop,
  addEventListener: _noop, removeEventListener: _noop,
  querySelector: () => _el(), querySelectorAll: () => [],
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0 }),
  getContext: () => ({ fillRect: _noop, clearRect: _noop, drawImage: _noop, beginPath: _noop, fill: _noop, stroke: _noop, fillText: _noop, save: _noop, restore: _noop, translate: _noop, scale: _noop, arc: _noop, moveTo: _noop, lineTo: _noop, closePath: _noop }),
}, { get(t, k) { if (k in t) return t[k]; if (k === 'parentNode' || k === 'parentElement') return null; return _noop; } });

const sb = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON, Object, Array, String, Number,
  Boolean, RegExp, Error, Map, Set, Promise, isNaN, isFinite, parseInt, parseFloat,
  encodeURIComponent, decodeURIComponent, requestAnimationFrame: (cb) => setTimeout(cb, 0),
  performance: { now: () => 0 }, alert: _noop,
  navigator: { userAgent: 'node', language: 'zh-CN', vibrate: _noop, onLine: true },
  location: { href: 'http://localhost/', protocol: 'http:', host: 'localhost', search: '', hash: '' },
  localStorage: { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; }, clear: _noop },
  sessionStorage: { getItem: () => null, setItem: _noop, removeItem: _noop, clear: _noop },
  addEventListener: _noop, removeEventListener: _noop, dispatchEvent: _noop,
  getComputedStyle: () => ({ getPropertyValue: () => '' }), matchMedia: () => ({ matches: false, addEventListener: _noop }),
  innerWidth: 1280, innerHeight: 720,
  Audio: function () { return { play: _noop, pause: _noop, addEventListener: _noop, currentTime: 0, volume: 1 }; },
  Image: function () { return { addEventListener: _noop, style: {} }; },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), text: () => Promise.resolve('') }),
};
sb.document = {
  readyState: 'complete', documentElement: _el(), body: _el(), head: _el(),
  createElement: () => _el(), createElementNS: () => _el(),
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener: _noop, removeEventListener: _noop, cookie: '',
};
sb.window = sb; sb.global = sb; sb.self = sb; sb.globalThis = sb;
sb.window.NDX = sb.window.NDX || {};
const ctx = vm.createContext(sb);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
let loaded = 0;
files.forEach((f) => {
  if (/^https?:/.test(f)) return;
  const p = f.split('?')[0];
  if (!fs.existsSync(path.join(ROOT, p))) return;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p }); loaded++; } catch (e) { }
});
const NDX = sb.NDX;

console.log('\n[终伤乘区] 门禁');

// ── 0) 前置：加载链与真源 ──────────────────────────────
ck('F0 加载链完整（≥160/164，含 combat_part1）', loaded >= 160 && typeof NDX.calcCombat === 'function', 'loaded=' + loaded);
ck('F1 封顶常量存在且为正数', typeof NDX.FINAL_DMG_CAP === 'number' && NDX.FINAL_DMG_CAP > 0, 'cap=' + NDX.FINAL_DMG_CAP);
ck('F2 逆道八印 stat 全为 finalDamage（产出端真源一致）', (() => {
  const ni = Object.keys(NDX.SEAL_WORDS || {}).filter((k) => NDX.SEAL_WORDS[k].dao === '逆');
  return ni.length >= 8 && ni.every((k) => NDX.SEAL_WORDS[k].stat === 'finalDamage');
})(), '逆印数=' + Object.keys(NDX.SEAL_WORDS || {}).filter((k) => NDX.SEAL_WORDS[k].dao === '逆').length);

// ── 1) 盲区封堵：computeStats 必须可调用（P0 回归）──────
const base = { ti: { atk: 0, hp: 0, dr: 0, eva: 0, cri: 0 }, yuan: { matk: 0, mdef: 0 } };
let st0 = null, err0 = null;
try { st0 = NDX.computeStats('tangseng', [], [], base, 1); } catch (e) { err0 = e; }
ck('F3 computeStats 不抛（P0 sealFinalDamage 未声明已修）', !err0, err0 && err0.message);
ck('F4 computeStats 返回 finalDamage 为数值', st0 && typeof st0.finalDamage === 'number', st0 && st0.finalDamage);
ck('F5 无劫印时 finalDamage === 0', st0 && st0.finalDamage === 0, st0 && st0.finalDamage);
ck('F6 computeStats 三个调用点参数形状可用（严进严出：空 op 不崩）',
  (() => { try { NDX.computeStats('wukong', [], [], {}, 1); NDX.computeStats('bajie', [], [], { ti: {}, yuan: {}, sutras: [], seals: [] }, 1); return true; } catch (e) { return false; } })());

// ── 2) 逆印累计 ────────────────────────────────────────
const mk = (names, tier) => names.map((n) => NDX._mkSeal(n, tier));
const sumVal = (arr) => arr.reduce((a, s) => a + s.val, 0);
const withSeals = (names, tier) => NDX.computeStats('tangseng', [], [], Object.assign({ seals: mk(names, tier) }, base), 1);

const g1 = mk(['戾骨'], 'green');
ck('F7 单枚绿·戾骨 → finalDamage === sealTierVal', withSeals(['戾骨'], 'green').finalDamage === +sumVal(g1).toFixed(3), withSeals(['戾骨'], 'green').finalDamage + ' vs ' + sumVal(g1));
const g3 = mk(['戾骨', '蚀骨', '万劫'], 'green');
ck('F8 三枚逆印累加（= Σ val）', withSeals(['戾骨', '蚀骨', '万劫'], 'green').finalDamage === +sumVal(g3).toFixed(3), withSeals(['戾骨', '蚀骨', '万劫'], 'green').finalDamage + ' vs ' + sumVal(g3));
ck('F9 非逆印不污染 finalDamage（战/渡/夺 印 → 0）', withSeals(['杀伐', '禅光', '吞纳'], 'green').finalDamage === 0, withSeals(['杀伐', '禅光', '吞纳'], 'green').finalDamage);
const gg = mk(['戾骨'], 'gold');
ck('F10 金劫走 SEAL_GOLD_SCALE（0.20×4.65=0.93）', withSeals(['戾骨'], 'gold').finalDamage === +sumVal(gg).toFixed(3), withSeals(['戾骨'], 'gold').finalDamage + ' vs ' + sumVal(gg));

// ── 3) 经文侧接线（eff.finalDamage → stats.finalDamage）──
const sSu = NDX.computeStats('tangseng', [], [], Object.assign({ sutras: [{ finalDamage: 0.07, ti: {}, matk: 0, mdef: 0 }] }, base), 1);
ck('F11 经文 eff.finalDamage 进入 stats.finalDamage（原为声明后未累加的死字段）', sSu.finalDamage === 0.07, sSu.finalDamage);
const sMix = NDX.computeStats('tangseng', [], [], Object.assign({ sutras: [{ finalDamage: 0.07, ti: {}, matk: 0, mdef: 0 }], seals: mk(['戾骨'], 'green') }, base), 1);
ck('F12 经文 + 劫印 同管线合并累加（0.07+0.13=0.20）', sMix.finalDamage === 0.2, sMix.finalDamage);

// ── 4) 乘区真实生效 / 封顶 / 段和恒等 ───────────────────
const mkP = (fd) => ({
  heroId: 'tangseng', good: 0, spd: 12,
  ti: { atk: 160, atkB: 0, fixAtk: 0, maxHp: 4000, curHp: 4000, hp: 4000, dr: 0.05, mdef: 40, cri: 0 },
  yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
  reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
  finalDamage: fd,
});
const mon = (hp) => ({ name: '试炼妖', hp: hp || 900000, atk: 60, matk: 30, dr: 0.05, mdef: 0.05, spd: 7, type: 'mob', diff: 1 });
const firstDeal = (p, hp) => {
  const r = NDX.calcCombat(p, mon(hp), {});
  const rd = (r.roundsDetail || []).find((x) => x.pTurn && x.pTurn.deal > 0);
  return rd ? rd.pTurn.deal : 0;
};
// ⚠ 项目门禁纪律：战斗内核含随机判定（暴击 / 怪物出手类型 roll），同一配置两次独立运行结果可不同。
// F16 原为「两次独立运行严格相等」的脆弱断言（V9.45 全量跑时首次暴露）。此处统一打 Math.random 桩，
// 使基线 d0 与比值 ratio 可复现；桩在每次被测调用前打、用完还原，不影响其它用例。
const _rnd = Math.random;
const fixed = (fn) => { Math.random = () => 0.5; try { return fn(); } finally { Math.random = _rnd; } };
const d0 = fixed(() => firstDeal(mkP(0)));
const ratio = (fd) => fixed(() => firstDeal(mkP(fd))) / d0;
ck('F13 终伤乘区真实生效（finalDamage 0.2 → 伤害 ≈×1.2）', Math.abs(ratio(0.2) - 1.2) <= 0.03, 'ratio=' + ratio(0.2).toFixed(4));
ck('F14 乘区口径为 (1+Σ)（0.5 → ≈×1.5）', Math.abs(ratio(0.5) - 1.5) <= 0.03, 'ratio=' + ratio(0.5).toFixed(4));
ck('F15 封顶生效（Σ=9.9 → ≈×(1+cap)，不无限放大）', Math.abs(ratio(9.9) - (1 + NDX.FINAL_DMG_CAP)) <= 0.05, 'ratio=' + ratio(9.9).toFixed(4) + ' cap=' + NDX.FINAL_DMG_CAP);
ck('F16 finalDamage=0 时零改动（无乘区路径）', fixed(() => firstDeal(mkP(0))) === d0, fixed(() => firstDeal(mkP(0))) + ' vs ' + d0);

const pCri = mkP(0.5);
pCri.ti.cri = 1; pCri.ti.criMult = 2.0;
const rc = NDX.calcCombat(pCri, mon(), {});
const rdC = (rc.roundsDetail || []).find((x) => x.pTurn && x.pTurn.segs && x.pTurn.segs.length);
ck('F17 加乘区后仍产出多段（含 crit 段）', !!rdC && rdC.pTurn.segs.some((s) => s.kind === 'crit'));
ck('F18 段和 === deal（V9.39 逐乘区记账不变量保持）', !!rdC && rdC.pTurn.segs.reduce((a, s) => a + s.dmg, 0) === rdC.pTurn.deal,
  rdC && (rdC.pTurn.segs.reduce((a, s) => a + s.dmg, 0) + ' vs ' + rdC.pTurn.deal));

// ── 5) 编队战（走同一 calcCombat 管线）自动继承 ──────────
ck('F19 编队战入口存在（从怪伤害复用 calcCombat，故自动继承乘区）', typeof NDX.calcCombatSquad === 'function');
if (typeof NDX.calcCombatSquad === 'function' && typeof NDX.buildSquad === 'function') {
  const sq = NDX.buildSquad(mon(4000), { type: 'mob', diff: 12, act: 5 });
  const ra = NDX.calcCombatSquad(mkP(0), sq, {});
  const rb = NDX.calcCombatSquad(mkP(0.5), sq, {});
  const sumDeal = (r) => (r.roundsDetail || []).reduce((a, x) => a + ((x.pTurn && x.pTurn.deal) || 0), 0);
  ck('F20 编队战同样吃到终伤乘区（总输出上升）', sumDeal(rb) > sumDeal(ra), sumDeal(ra) + ' → ' + sumDeal(rb));
}

console.log(`\n结论：${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
