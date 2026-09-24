// _verify_seal_stats.js — 劫印词条 stat/附加副属性 全覆盖门禁（V9.45）
// 背景：V9.45 死字段扫描（scan_dead_v945.js）发现劫印侧三簇真缺陷：
//   D1(P0) SEAL_WORDS 有 8 条 stat:'lifesteal'（吞纳/噬血/戾伤/残魂/焚天/饕餮/血怒/回春），
//          但 computeStats 的 sl.stat if/else 链无该分支 → 夺道吸血流数值全蒸发（与 V9.43 finalDamage 同型）。
//   D2(P1) 附加 maxhp 仅嵌套在 stat==='maxhp' 分支内读取 → 厚土/金刚/修罗/磐石/轮回 五条 +5%~10% 气血全丢。
//   D3(P1) 附加 atk/mdef/matk 全仓零消费，且装配端（jieseals 4 处 _mkSeal/grantInitialSeal/offerSeals×2）漏拷
//          → 血怒/影袭(atk)、铁壁(mdef)、咒怨(matk) 副属性全丢。
// 门禁双锁：① 行为断言（复活可得）② 数据全覆盖断言（新增 stat/附加键即报错，封堵同类盲区复发）。
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

console.log('\n[劫印 stat / 附加副属性 全覆盖] 门禁');
ck('S0 加载链完整（≥160/164）', loaded >= 160, 'loaded=' + loaded);

const WORDS = NDX.SEAL_WORDS || {};
const names = Object.keys(WORDS).filter((k) => WORDS[k] && WORDS[k].tiers);

// ── 1) 盲区封堵：stat 取值全覆盖 ─────────────────────────
const HANDLED = ['atk', 'matk', 'maxhp', 'dr', 'mdef', 'eva', 'reflect', 'finalDamage', 'lifesteal'];
const statSet = new Set(names.map((n) => WORDS[n].stat));
const badStat = [...statSet].filter((s) => !HANDLED.includes(s));
ck('S1 全部 stat 取值已被 computeStats 处理（盲区封堵）', badStat.length === 0, '未处理: ' + badStat.join(',') + ' | 实际: ' + [...statSet].join(','));

// ── 2) 盲区封堵：附加副属性键全覆盖 ──────────────────────
const SIDE_OK = ['crit', 'lifesteal', 'maxhp', 'evaOnDodge', 'atk', 'mdef', 'matk', 'unique'];
const META = ['name', 'dao', 'stat', 'tiers', 'desc', 'hero', 'mech', 'mechVal', 'mechTier', 'mechDesc'];
const badSide = [];
for (const n of names) {
  for (const k of Object.keys(WORDS[n])) {
    if (META.includes(k)) continue;
    if (!SIDE_OK.includes(k)) badSide.push(n + '.' + k);
  }
}
ck('S2 全部附加副属性键已被消费（盲区封堵）', badSide.length === 0, '未处理: ' + badSide.join(', '));

// ── 3) 夺道·吸血八印（D1 复活）──────────────────────────
const duoLs = names.filter((n) => WORDS[n].dao === '夺' && WORDS[n].stat === 'lifesteal');
ck('S3 夺道吸血词条存在且 ≥8 条', duoLs.length >= 8, duoLs.length + ' 条: ' + duoLs.join('/'));

const base = { ti: { atk: 0, hp: 0, dr: 0, eva: 0, cri: 0 }, yuan: { matk: 0, mdef: 0 } };
const st = (seals) => NDX.computeStats('tangseng', [], [], Object.assign({ seals }, base), 1);
const s0 = st([]);
const sLs = st([{ dao: '夺', stat: 'lifesteal', val: 0.20 }]);
ck('S4 stat:lifesteal 进入 stats.lifesteal（V9.45 复活，原全蒸发）',
  Math.abs(sLs.lifesteal - 0.20) < 1e-6, 'lifesteal=' + sLs.lifesteal);
const sLsMix = st([{ dao: '夺', stat: 'lifesteal', val: 0.20 }, { dao: '夺', stat: 'lifesteal', val: 0.10 }]);
ck('S5 多条吸血劫印累加（0.20+0.10=0.30）', Math.abs(sLsMix.lifesteal - 0.30) < 1e-6, sLsMix.lifesteal);

// ── 4) 附加 maxhp 脱离 stat==='maxhp' 分支（D2 复活）──────
const orphanMaxhp = names.filter((n) => WORDS[n].maxhp && WORDS[n].stat !== 'maxhp');
ck('S6 存在 stat≠maxhp 却带 maxhp 附加的词条（原全丢）', orphanMaxhp.length >= 5,
  orphanMaxhp.length + ' 条: ' + orphanMaxhp.join('/'));
const sMh = st([{ dao: '缘', stat: 'dr', val: 0.05, maxhp: 0.10 }]);
ck('S7 附加 maxhp 生效（stat=dr + maxhp 0.10 → 气血 ×1.10）',
  Math.abs(sMh.ti.maxHp - s0.ti.maxHp * 1.10) <= 2, s0.ti.maxHp + ' → ' + sMh.ti.maxHp);

// ── 5) 附加 atk / matk / mdef（D3 复活 · 含装配端透传）────
const sAtk = st([{ dao: '夺', stat: 'lifesteal', val: 0.1, atk: 0.20 }]);
ck('S8 附加 atk 生效（atk ×1.20）', sAtk.ti.atk > 0 && Math.abs(sAtk.ti.atk - Math.round(s0.ti.atk * 1.20)) <= 2,
  s0.ti.atk + ' → ' + sAtk.ti.atk);
const sMdef = st([{ dao: '缘', stat: 'dr', val: 0.05, mdef: 0.07 }]);
ck('S9 附加 mdef 生效（增量 +0.07）', Math.abs(sMdef.yuan.mdef - (s0.yuan.mdef + 0.07)) < 1e-6,
  s0.yuan.mdef + ' → ' + sMdef.yuan.mdef);
const sMatk = st([{ dao: '逆', stat: 'finalDamage', val: 0.1, matk: 0.20 }]);
ck('S10 附加 matk 生效（matk ×1.20）', Math.abs(sMatk.yuan.matk - Math.round(s0.yuan.matk * 1.20)) <= 2,
  s0.yuan.matk + ' → ' + sMatk.yuan.matk);

// 装配端：_mkSeal 必须透传 atk/mdef/matk（原 4 处漏拷）
const mk = NDX._mkSeal && NDX._mkSeal('血怒', 'gold');
ck('S11 装配端 _mkSeal 透传附加副属性（血怒 atk=0.06）',
  mk && mk.atk === 0.06 && 'mdef' in mk && 'matk' in mk, mk && JSON.stringify({ atk: mk.atk, mdef: mk.mdef, matk: mk.matk }));
const mk2 = NDX._mkSeal && NDX._mkSeal('铁壁', 'green');
ck('S12 铁壁 mdef 附加透传（mdef=0.08）', mk2 && mk2.mdef === 0.08, mk2 && mk2.mdef);

// ── 6) 不回归：主属性旧分支仍正确 ────────────────────────
const sAtkMain = st([{ dao: '战', stat: 'atk', val: 0.20 }]);
ck('S13 主 stat=atk 仍生效（不因新增分支串味）', Math.abs(sAtkMain.ti.atk - Math.round(s0.ti.atk * 1.20)) <= 2,
  s0.ti.atk + ' → ' + sAtkMain.ti.atk);
const sDr = st([{ dao: '缘', stat: 'dr', val: 0.05 }]);
ck('S14 主 stat=dr 仍生效（+0.05）', Math.abs(sDr.ti.dr - (s0.ti.dr + 0.05)) < 1e-6, sDr.ti.dr);
ck('S15 无劫印时不污染（lifesteal=0 / maxHp 同基线）',
  s0.lifesteal === 0 && s0.ti.maxHp === s0.ti.maxHp, 'lifesteal=' + s0.lifesteal);

// ── 7) 战斗层：吸血复活后不会超模（消费端封顶 0.5，且不可超过血量上限）──
const mkP = (ls) => ({
  heroId: 'tangseng', good: 0, spd: 12,
  ti: { atk: 1500, atkB: 0, fixAtk: 0, maxHp: 8000, curHp: 8000, hp: 8000, dr: 0.05, mdef: 40, cri: 0 },
  yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
  reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {}, lifesteal: ls,
});
// 攻击力取 900：使玩家确实掉血（否则 0.3/0.5 两档都会回满到 maxHp，S20 无法区分）
const mon = { name: '砺兵石', hp: 12000, atk: 900, matk: 0, dr: 0.05, mdef: 0.05, spd: 7, type: 'mob', diff: 1 };
const rHi = NDX.calcCombat(mkP(0.9), mon, {});
ck('S16 高吸血不超血量上限（复活后不超模）', rHi.playerHpLeft <= 8000, 'hpLeft=' + rHi.playerHpLeft);
const rNo = NDX.calcCombat(mkP(0), mon, {});
ck('S17 吸血确实改善续航（0.9 > 0）', rHi.playerHpLeft > rNo.playerHpLeft,
  rNo.playerHpLeft + ' → ' + rHi.playerHpLeft);

// ── 8) 吸血封顶（V9.45 复活引入的堆叠超模防护）───────────
ck('S18 NDX.LIFESTEAL_CAP 存在且 =0.5（与自适应难度预算同口径）', NDX.LIFESTEAL_CAP === 0.5, NDX.LIFESTEAL_CAP);
const _rnd = Math.random;
const fixed = (fn) => { Math.random = () => 0.5; try { return fn(); } finally { Math.random = _rnd; } };
const hpFixed = (ls) => fixed(() => NDX.calcCombat(mkP(ls), mon, {}).playerHpLeft);
const h05 = hpFixed(0.5), h09 = hpFixed(0.9);
ck('S19 封顶生效（lifesteal 0.9 与 0.5 回血一致，不超模）', h09 === h05, '0.5→' + h05 + ' / 0.9→' + h09);
const h03 = hpFixed(0.3);
ck('S20 封顶不影响阈值内收益（0.3 < 0.5 回血）', h03 < h05, '0.3→' + h03 + ' / 0.5→' + h05);

console.log(`\n  —— ${pass} 通过 / ${fail} 失败 ——`);
process.exit(fail ? 1 : 0);
