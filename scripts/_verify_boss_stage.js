// _verify_boss_stage.js — Boss 逐阶段变身（二阶/三阶）门禁（V9.50）
// ---------------------------------------------------------------------------
// 背景（V2.0 现状报告 P0-4「二阶变身未能正常实现」）：
//   enemies_part1.js `bossStageSetup` 产出 phases/phasesStats 并明确注释
//   「逐阶段完整面板覆盖（atk/matk/mdef/dr/affix），供 combat.js calcMultiStage 按阶段套用」，
//   但 combat_part1.js `calcMultiStage` 此前**只读 phase2Override**（= phaseOverrides[1]），于是：
//     ① 三段变身 Boss 的二/三形态 atk / mdef 恒为首相值（变身只有血条变化，面板不变）；
//     ② 第三形态套的是第二形态的 overrides（phaseOverrides[2] 从未被用）。
//   本门禁职责：
//     A) 数据自洽：BOSS_FORMS 三段形态表的 atk 逐段抬升（防手滑写反）；
//     B) 产出端一致：bossStageSetup 的 phaseStats[s] 与 phases[s] 同源；
//     C) 接线锁定（核心）：calcMultiStage 真按阶段套用 phaseStats[s].atk / phaseOverrides[s]；
//     D) 反证：移除逐段表后阶段间无差异（证明差异确实来自逐段覆盖，而非其它机制）。
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

// —— 沙箱：Proxy 兜底 DOM（与 _verify_final_damage.js 同范式）——
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

console.log('\n[Boss 逐阶段变身] 门禁');

// ── 0) 前置 ─────────────────────────────────────────────
ck('BS0 加载链完整（≥160）且 calcCombat 可用', loaded >= 160 && typeof NDX.calcCombat === 'function', 'loaded=' + loaded);
ck('BS0b NDX.bossStageSetup 存在', typeof NDX.bossStageSetup === 'function');

// ── A) 数据自洽：三段形态表 atk 必须逐段抬升 ────────────
const forms = NDX.BOSS_FORMS || {};
const threeStage = Object.keys(forms).filter((k) => Array.isArray(forms[k].phases) && forms[k].phases.length >= 3);
const flat = [];
threeStage.forEach((k) => {
  const ps = forms[k].phases;
  if (!(ps[ps.length - 1].atk > ps[0].atk)) flat.push(k + '(' + ps.map((p) => p.atk).join('/') + ')');
});
ck('BS1 三段形态表 atk 终相 > 初相（' + threeStage.length + ' 个三段 Boss）', flat.length === 0, flat.join(','));

const seqBad = [];
threeStage.forEach((k) => {
  const ps = forms[k].phases;
  const names = ps.map((p) => p.name);
  if (names.some((n) => !n) || new Set(names).size !== names.length) seqBad.push(k);
});
ck('BS2 三段形态各有独立名号（供变身宣告消费）', seqBad.length === 0, seqBad.join(','));

// ── B) 产出端一致：bossStageSetup.phaseStats[s] ↔ phases[s] ──
const mismatch = [];
threeStage.forEach((k) => {
  const st = NDX.bossStageSetup(k, {});
  if (!st) { mismatch.push(k + ':setup=null'); return; }
  for (let i = 1; i < st.phaseStats.length; i++) {
    const ps = st.phaseStats[i];
    if (!ps || ps.atk !== forms[k].phases[i].atk) mismatch.push(k + '#' + i + ':' + (ps && ps.atk) + '≠' + forms[k].phases[i].atk);
  }
  if (!Array.isArray(st.names) || st.names.length !== forms[k].phases.length) mismatch.push(k + ':names 长度不符');
});
ck('BS3 bossStageSetup 的 phaseStats[s].atk ≡ phases[s].atk，且 names 齐全', mismatch.length === 0, mismatch.slice(0, 5).join(','));

// ── C/D) 接线锁定 + 反证：真实跑 calcCombat，逐阶段看怪物伤害 ──
const _rnd = Math.random;
const fixed = (fn) => { Math.random = () => 0.5; try { return fn(); } finally { Math.random = _rnd; } };
const mkP = () => ({
  heroId: 'tangseng', good: 0, spd: 12,
  ti: { atk: 160, atkB: 0, fixAtk: 0, maxHp: 60000, curHp: 60000, hp: 60000, dr: 0.0, mdef: 0, cri: 0 },
  yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
  reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
});
const baseMon = (extra) => Object.assign({
  name: '三相试炼妖', hp: 600, atk: 90, matk: 50, dr: 0.10, mdef: 0.12, spd: 7, type: 'boss', boss: true, diff: 1,
  stages: [600, 750, 900],
  stageRewards: [{ claim: {}, idle: {} }, { claim: {}, idle: {} }, { claim: {}, idle: {} }],
}, extra || {});
// 每阶段怪物最大单次伤害（规避随机暴击 / 蓄力拍差异，取两端即可判定）
const stageMonHitMax = (mon) => {
  const r = NDX.calcCombat(mkP(), mon, {});
  const out = {};
  (r.roundsDetail || []).forEach((d) => {
    if (d.mTurn && d.mTurn.deal > 0 && d.mTurn.dodged !== true) {
      const s = d.stage || 1;
      out[s] = Math.max(out[s] || 0, d.mTurn.deal);
    }
  });
  return out;
};
const monWith = baseMon({
  phaseStats: [null, { atk: 110, matk: 60, mdef: 0.16, dr: 0.14, affix: '中相' },
    { atk: 130, matk: 70, mdef: 0.20, dr: 0.18, affix: '终相' }],
  phaseOverrides: [null, { dr: 0.14, matk: 60, affix: '中相' }, { dr: 0.18, matk: 70, affix: '终相' }],
});
const a = fixed(() => stageMonHitMax(monWith));
const a1 = a[1] || 0, a3 = a[3] || 0;
ck('BS4 calcMultiStage 按阶段套用 phaseStats.atk（终相怪伤 > 初相 ×1.2）',
  a1 > 0 && a3 > a1 * 1.2, 'stage1=' + a1 + ' stage3=' + a3);

// 反证：删掉逐段表 → 阶段间怪物伤害无差异（差异确实来自逐段覆盖）
const monWo = baseMon({});
const b = fixed(() => stageMonHitMax(monWo));
const b1 = b[1] || 0, b3 = b[3] || 0;
ck('BS5 反证：无逐段表时阶段间怪伤一致（变身不动面板）',
  b1 > 0 && Math.abs(b3 - b1) / b1 <= 0.02, 'stage1=' + b1 + ' stage3=' + b3);

// ── D2) phaseOverrides[s] 必须按阶段索引 s 生效（第三形态不得误用第二形态数值）──
//   手法：只改 dr（玩家伤害侧可观测）—— overrides[2].dr 拉高 → 终相玩家伤害显著下降；
//   若代码误用 phase2Override(=overrides[1])，终相 dr 仍为 0.10，玩家伤害不会下降。
const playerDealByStage = (mon) => {
  const r = NDX.calcCombat(mkP(), mon, {});
  const out = {};
  (r.roundsDetail || []).forEach((d) => {
    if (d.pTurn && d.pTurn.deal > 0 && !d.pTurn.dodged) {
      const s = d.stage || 1;
      out[s] = Math.max(out[s] || 0, d.pTurn.deal);
    }
  });
  return out;
};
const monDr = baseMon({
  phaseStats: [null, { atk: 90, dr: 0.10 }, { atk: 90, dr: 0.10 }],
  phaseOverrides: [null, { dr: 0.10 }, { dr: 0.60 }],
});
const d3 = fixed(() => playerDealByStage(monDr));
const d1v = d3[1] || 0, d3v = d3[3] || 0;
ck('BS6 phaseOverrides[s] 按阶段索引生效（终相 dr0.6 → 玩家伤害显著下降）',
  d1v > 0 && d3v > 0 && d3v < d1v * 0.7, 'stage1玩家伤=' + d1v + ' stage3玩家伤=' + d3v);

// ── E) 源码守卫：防再次把逐段覆盖删掉 ──────────────────
let cp1 = '';
try { cp1 = fs.readFileSync(path.join(ROOT, 'js', 'combat_part1.js'), 'utf8'); } catch (e) {}
ck('BS7 源码守卫：calcMultiStage 读取 phaseStats 与 phaseOverrides', /rawMonster\.phaseStats/.test(cp1) && /rawMonster\.phaseOverrides/.test(cp1));
ck('BS8 源码守卫：破韧拍携带 nextStageName（变身宣告可被演出层消费）', /nextStageName/.test(cp1));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
