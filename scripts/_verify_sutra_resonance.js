// _verify_sutra_resonance.js — 经文共鸣·吸血/终伤 接线门禁（V9.44）
// 背景（V2.0 深度报告 §8.2 遗留 + V9.43 管线）：
//   V9.43 已修 逆道·终伤 独立乘区，但两条「死字段/大小写分裂」仍未收口：
//   ① 夺道经文共鸣 eff.lifesteal（SUTRA_DAO_BONUS.夺.lifesteal=0.06）被 computeStats 静默丢弃
//      —— sutraLifesteal 声明后从未累加，产出端 lifesteal 只读 sealFlags，漏掉经文来源；
//   ② 逆道经文共鸣 eff.finalDamage 管线已通（V9.43 读 eff.finalDamage），但 SUTRA_DAO_BONUS.逆
//      无 finalDamage 字段 → 逆=终伤 身份与管线脱节，共鸣空转；
//   ③ 战斗内核 pTi.lifesteal（pTi=player.ti 从不带 lifesteal 键）恒 undefined → spellLifestealToShield 命痕死分支；
//   ④ game_combat_1.js 自适应难度 st.ti.lifeSteal（大写 S）恒 undefined → 漏算吸血。
// 本门禁锁：数据填充正确 + 产出端真消费 + 合并累加 + 终伤纳入战力总评。
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
sb.document = { readyState: 'complete', documentElement: _el(), body: _el(), head: _el(), createElement: () => _el(), createElementNS: () => _el(), getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, removeEventListener: _noop, cookie: '' };
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

console.log('\n[经文共鸣·吸血/终伤 接线] 门禁');
ck('R0 加载链完整（≥160/164）', loaded >= 160, 'loaded=' + loaded);

const base = { ti: { atk: 0, hp: 0, dr: 0, eva: 0, cri: 0 }, yuan: { matk: 0, mdef: 0 } };

// ── 1) 数据填充正确 ────────────────────────────────────
ck('R1 夺道共鸣含 lifesteal=0.06', NDX.SUTRA_DAO_BONUS && NDX.SUTRA_DAO_BONUS['夺'] && NDX.SUTRA_DAO_BONUS['夺'].lifesteal === 0.06, NDX.SUTRA_DAO_BONUS && JSON.stringify(NDX.SUTRA_DAO_BONUS['夺']));
ck('R2 逆道共鸣含 finalDamage=0.06（与 逆=终伤 身份一致）', NDX.SUTRA_DAO_BONUS && NDX.SUTRA_DAO_BONUS['逆'] && NDX.SUTRA_DAO_BONUS['逆'].finalDamage === 0.06, NDX.SUTRA_DAO_BONUS && JSON.stringify(NDX.SUTRA_DAO_BONUS['逆']));

// ── 2) 产出端真消费（死字段复活）──────────────────────
const sLs = NDX.computeStats('tangseng', [], [], Object.assign({ sutras: [{ lifesteal: 0.06, ti: {}, matk: 0, mdef: 0 }] }, base), 1);
ck('R3 经文 eff.lifesteal 进入 stats.lifesteal（原 sutraLifesteal 声明后未累加 → 死字段）', sLs && sLs.lifesteal === 0.06, sLs && sLs.lifesteal);
// 注：真实劫印数据里 stat 主属性与 lifesteal 侧通道互斥（V9.45 复核 48 词条无一同时具备），
// 故此处夹具只写 stat 主通道，避免人为双计。
const sMix = NDX.computeStats('tangseng', [], [], Object.assign({ sutras: [{ lifesteal: 0.06, ti: {}, matk: 0, mdef: 0 }], seals: [{ dao: '夺', stat: 'lifesteal', val: 0.10 }] }, base), 1);
ck('R4 经文 + 劫印 吸血合并累加（0.06+0.10=0.16）', sMix && Math.abs(sMix.lifesteal - 0.16) < 1e-6, sMix && sMix.lifesteal);
const sNo = NDX.computeStats('tangseng', [], [], Object.assign({ sutras: [{ ti: {}, matk: 0, mdef: 0 }] }, base), 1);
ck('R5 无吸血经文时 lifesteal === 0（不污染）', sNo && sNo.lifesteal === 0, sNo && sNo.lifesteal);

// ── 3) 逆道共鸣 finalDamage 走 V9.43 管线 ──────────────
const sFd = NDX.computeStats('tangseng', [], [], Object.assign({ sutras: [{ finalDamage: 0.06, ti: {}, matk: 0, mdef: 0 }] }, base), 1);
ck('R6 经文 eff.finalDamage 进入 stats.finalDamage（逆道共鸣终伤生效）', sFd && sFd.finalDamage === 0.06, sFd && sFd.finalDamage);

// ── 4) 终伤纳入战力总评 ───────────────────────────────
const pNoFd = NDX.computeStats('tangseng', [], [], Object.assign({}, base), 1);
const pFd = NDX.computeStats('tangseng', [], [], Object.assign({ sutras: [{ finalDamage: 0.5, ti: {}, matk: 0, mdef: 0 }] }, base), 1);
ck('R7 终伤纳入战力总评（finalDamage 0.5 → power 多出 ≈200）', pFd.power - pNoFd.power === 200, 'Δ=' + (pFd.power - pNoFd.power));

// ── 5) 战斗内核真消费吸血（sealLifesteal = player.lifesteal）──
const mkP = (ls) => ({
  heroId: 'tangseng', good: 0, spd: 12,
  ti: { atk: 1500, atkB: 0, fixAtk: 0, maxHp: 8000, curHp: 8000, hp: 8000, dr: 0.05, mdef: 40, cri: 0 },
  yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
  reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {}, lifesteal: ls,
});
const monTank = (hp) => ({ name: '砺兵石', hp: hp || 12000, atk: 300, matk: 0, dr: 0.05, mdef: 0.05, spd: 7, type: 'mob', diff: 1 });
const hpAfter = (ls) => { const r = NDX.calcCombat(mkP(ls), monTank(), {}); return r.playerHpLeft; };
const h0 = hpAfter(0), hL = hpAfter(0.3);
ck('R8 吸血进入战斗内核（lifesteal 0.3 → 战后血量高于无吸血）', hL > h0, 'h0=' + h0 + ' hL=' + hL);

console.log(`\n结论：${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
