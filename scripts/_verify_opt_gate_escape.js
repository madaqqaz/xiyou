// _verify_opt_gate_escape.js — 选项门控「全锁」死锁兜底门禁（V9.50 · P0-6）
// ---------------------------------------------------------------------------
// 背景（实测复现，deep_flow 长流程探针 run6 @act2 diff25）：
//   第24难（平顶山·莲花洞）在部分地图分配下被判为纯战斗节点，进节点直接开打，
//   其抉择场景（pian / bupian → setFlag n24_pingding:*）从不弹出；
//   而第25难四个选项**全部** requireFlag 依赖 n24_pingding:* → _optionGate 四卡全锁
//   → 按钮 disabled + applyTrialOpt 提交拦截 → 玩家彻底卡死（地图锁「先完成本难抉择」）。
// 本门禁职责：
//   A) 接线锁定：存在 _optGateCtx，且 ui 渲染 / 两处提交入口都改走它（不是各自裸调 _optionGate）；
//   B) 行为锁定：整组全锁 → 破例放行（escaped=true）；有活路 → 绝不干预；组外选项 → 不兜底；
//   C) 可读化：requireFlag 的锁因从裸键（n24_pingding:bupian）翻成「第24难「…」」；
//   D) 真源回归：第24难确实定义了第25难所需的两个 setFlag（证明是流程缺失而非数据缺项）。
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

// —— 沙箱：Proxy 兜底 DOM（与 _verify_boss_stage.js 同范式）——
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
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
let loaded = 0;
files.forEach((f) => {
  if (/^https?:/.test(f)) return;
  const p = f.split('?')[0];
  if (!fs.existsSync(path.join(ROOT, p))) return;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p }); loaded++; } catch (e) { }
});
const NDX = sb.NDX;

console.log('\n[选项门控·全锁兜底] 门禁');

// ── A) 接线锁定（源码守卫） ─────────────────────────────
const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ge4 = rd('js/game/game_event_4.js');
const ge2 = rd('js/game/game_event_2.js');
const ge3 = rd('js/game/game_event_3.js');
const um2 = rd('js/ui/ui_modals_2.js');

ck('OG0 加载链完整（≥160）', loaded >= 160, 'loaded=' + loaded);
ck('OG1 game_event_4.js 定义 _optGateCtx 兜底', /_optGateCtx\s*=\s*function/.test(ge4) || /prototype\._optGateCtx/.test(ge4));
ck('OG2 applyTrialOpt 改走 _optGateCtx（提交不再裸调 _optionGate）', /_optGateCtx\s*\?\s*this\._optGateCtx\(s\.pending,\s*opt\)/.test(ge2));
ck('OG3 applyEventOpt 同样改走 _optGateCtx', /_optGateCtx\s*\?\s*this\._optGateCtx\(s\.pending,\s*opt\)/.test(ge3));
ck('OG4 ui sceneModal 渲染侧改走 NDX.game._optGateCtx', /NDX\.game\._optGateCtx\s*\?\s*NDX\.game\._optGateCtx\(p,\s*o\)/.test(um2));
ck('OG5 破例徽记可见（gate-escape 提示条）', /gate-escape/.test(um2));

// ── B) 行为锁定 ────────────────────────────────────────
const G = Object.create(NDX.Game.prototype);
G.state = { choiceFlags: {}, ge: {}, good: 0, evil: 0, npcRel: {}, flags: {}, diff: 25, layer: 20, col: 1 };
ck('OG6 _optGateCtx 已挂载到实例', typeof G._optGateCtx === 'function');

const mkOpt = (key, req) => ({ key, label: '选项' + key, fate: '战', requireFlag: req });
// ① 整组全锁 → 全部破例放行
const allLocked = { opts: [mkOpt('渡', 'n24_pingding:pian'), mkOpt('战', 'n24_pingding:bupian'), mkOpt('逆', 'n24_pingding:bupian'), mkOpt('夺', 'n24_pingding:bupian')], kind: 'trial' };
const r1 = allLocked.opts.map((o) => G._optGateCtx(allLocked, o));
ck('OG7 四卡全锁（前置旗标缺失）→ 整组破例放行', r1.every((g) => g && g.locked === false && g.escaped === true), JSON.stringify(r1.map((g) => g && g.locked)));
ck('OG8 破例时保留原始锁因（why 非空，供日志/UI 说明）', r1.every((g) => g && typeof g.why === 'string' && g.why.length > 0));

// ② 有活路 → 绝不干预（保留设计意图）
const hasWay = { opts: [mkOpt('渡', 'n24_pingding:pian'), { key: '隐', label: '绕道而行', fate: '隐' }], kind: 'trial' };
const r2 = hasWay.opts.map((o) => G._optGateCtx(hasWay, o));
ck('OG9 存在可选选项时：被锁项仍锁（不误放行）', r2[0] && r2[0].locked === true);
ck('OG10 存在可选选项时：可选项不标 escaped', r2[1] && r2[1].locked === false && !r2[1].escaped);

// ③ 组外选项（二级子面板等）→ 不兜底
const outGroup = { opts: [{ key: 'x', label: 'x', fate: '战' }], kind: 'trial' };
const outsider = mkOpt('渡', 'n24_pingding:pian');
const r3 = G._optGateCtx(outGroup, outsider);
ck('OG11 不属于本难选项组时不兜底（仍锁）', r3 && r3.locked === true);

// ④ 前置旗标已达成 → 正常解锁，不标 escaped
G.state.choiceFlags['n24_pingding'] = 'bupian';
const r4 = G._optGateCtx(allLocked, allLocked.opts[1]);
ck('OG12 旗标已达成时正常解锁且不标 escaped', r4 && r4.locked === false && !r4.escaped);
delete G.state.choiceFlags['n24_pingding'];

// ── C) 锁因可读化 ──────────────────────────────────────
ck('OG13 NDX.flagLabel 存在', typeof NDX.flagLabel === 'function');
const lab = NDX.flagLabel('n24_pingding:bupian');
ck('OG14 锁因从裸键翻成可读文案（第24难「…」）', typeof lab === 'string' && /第24难/.test(lab), lab);
const reasonLocked = G._optionGate(mkOpt('战', 'n24_pingding:bupian')).reasons.join('；');
ck('OG15 _optionGate 输出的锁因含可读文案', /第24难/.test(reasonLocked), reasonLocked);

// ── D) 真源回归：第24难确实定义了第25难所需的 setFlag ──
const lib = NDX.TRIAL_LIB || {};
const t24 = lib[24] || {}, t25 = lib[25] || {};
const opts24 = [].concat(t24.options || [], t24.opts || []);
const opts25 = [].concat(t25.options || [], t25.opts || []);
const set24 = new Set(opts24.map((o) => o && o.setFlag).filter(Boolean));
const need25 = new Set();
opts25.forEach((o) => {
  const r = o && o.requireFlag;
  (Array.isArray(r) ? r : [r]).forEach((f) => { if (f) need25.add(f); });
});
const missing = [...need25].filter((f) => !set24.has(f));
ck('OG16 第25难所需前置旗标全部由第24难产出（证明死锁源于流程缺失而非数据缺项）', need25.size > 0 && missing.length === 0, 'need=' + [...need25].join(',') + ' missing=' + missing.join(','));

// 第24难的组：两个选项都不带 requireFlag → 正常应全部可选（不会触发兜底）
const r5 = opts24.map((o) => G._optGateCtx({ opts: opts24, kind: 'trial' }, o));
ck('OG17 第24难两个分支自身均可选（无 requireFlag 依赖）', opts24.length >= 2 && r5.every((g) => g && g.locked === false), JSON.stringify(r5.map((g) => g && g.locked)));

console.log('\n—— ' + pass + ' 通过 / ' + fail + ' 失败 ——');
process.exit(fail ? 1 : 0);
