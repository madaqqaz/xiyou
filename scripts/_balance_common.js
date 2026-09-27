// _balance_common.js — 平衡工具链**单一真源**（R1 落地，2026-09-27）
// ---------------------------------------------------------------------------
// 背景（S18 复核 §2.4）：`_balance_sweep.js` 与 `_balance_run_model.js` 各自
//   复制了一份 ROUTES / DAO_ATK / CHAPTER_ENDS / HERO_GEAR_CHAIN / applyFightScale /
//   bossRaw / applyRoute / metaBonus，两份之间一旦漂移，两把尺量出来的就是**两个游戏**，
//   任何以 sweep 为准的定标结论都会在真机上失效。
//   实证：`sweep` 的战/夺 mult 停在 1.0（V9.65 之前），而 `game_event_2.js:307-315` 早已
//   起 `monStr += 0.03 / += 0.05`（4 次封顶 ⇒ 1.12 / 1.20）⇒ sweep 全程在测「道带压强 = 0」
//   的假想局。这是 D2「两尺互斥」从可验证性问题升级为**定标尺自身失真**的根因。
//
// 纪律：
//   - 新增平衡常量/换算**只写这份**，两把尺一律 `require('./_balance_common.js')`；
//   - `scripts/_verify_scale_consistency.js` 会静态断言两脚本内**不再出现这些字面量道带**；
//   - 与 `js/` 真源冲突时，以 `js/` 为准，改 common 而不是改某一把尺。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

// —— 通用小工具 ——
const numberOr = (a, d) => (Number.isFinite(+a) && a != null ? +a : d);
const clone = (o) => JSON.parse(JSON.stringify(o));
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// 种子序列（R7 统一语义：--seeds=N 表示**采样点数**，两尺同源）
//   历史教训：2 种子只够表达全胜/全败，24 种子曾致「满屏 21% 平台 / 0% 陡降」的伪胜率。
//   默认 40 点（≥=_balance_anchor 的采样纪律），序列固定 ⇒ 报告逐格可复现。
const DEFAULT_SEED_N = 40;
function SEED_SEQ(n) {
  const k = Math.max(1, numberOr(n, DEFAULT_SEED_N));
  return Array.from({ length: k }, (_, i) => +(0.02 + i * (0.96 / Math.max(1, k - 1))).toFixed(4));
}
// R7：统一 `--seeds` 语义。历史坑：sweep 的 `--seeds=` 是「种子列表」、run_model 的是「采样点数」，
//   同名异义（审计 §1.5）。现统一为 `--seeds=N`（采样点数，默认 40）+ `--seed-list=a,b,c`（显式序列）。
//   为兼容旧命令，`--seeds=` 传「含逗号」或「值 < 1」的内容仍按列表解释。
function resolveSeeds(seedsArg, listArg, nDefault) {
  const list = String(listArg || '').trim();
  if (list) return list.split(',').map(Number).filter(Number.isFinite);
  const sa = String(seedsArg || '').trim();
  if (sa) {
    if (sa.includes(',') || Number(sa) < 1) return sa.split(',').map(Number).filter(Number.isFinite);
    return SEED_SEQ(Number(sa));
  }
  return SEED_SEQ(nDefault == null ? DEFAULT_SEED_N : nDefault);
}

// —— 六道攻式（与 dao_system.js DAO_ATK_STYLE 同源）——
// V9.63：渡回血 0.25→0.16（与真源同步）。
// V9.66：逆道补 `ls: 0.035`（逆血续航）——真伤道无 heal 分支、零续航已被 demo 实测证伪为死道；
//        demo 口径下「第5次可通」正是靠这 3.5% 换来（0 → 打不穿 / 0.035 → 第 8 次 / 0.05 → 第 5 次）。
const DAO_ATK = {
  du:   { dao: '渡', style: { key: 'heal',      name: '禅光渡世', pct: 0.16 } },
  zhan: { dao: '战', style: { key: 'crit',      name: '战意冲霄', pct: 0.25 } },
  duo:  { dao: '夺', style: { key: 'lifesteal', name: '夺灵噬血', pct: 0.20 } },
  yin:  { dao: '隐', style: { key: 'evade-crit', name: '影遁必杀', pct: 0 } },
  yuan: { dao: '缘', style: { key: 'shield',    name: '缘起护身', pct: 0.20 } },
  ni:   { dao: '逆', style: { key: 'true',      name: '逆锋透骨', pct: 0.30, ls: 0.035 } },
};

// —— 道带压强（四道：run_model 口径）——
// 由 `game_event_2.js:307-315`（V9.65 起）「战 monStr += 0.03 / 夺 monStr += 0.05，4 次封顶」
//   与「渡 monWeak / 逆 monStr」反推 ⇒ 1 + 0.03×4 = 1.12、1 + 0.05×4 = 1.20。
// clamp 边界 [0.72, 1.28] 与 scaleRunMods 一致（`data_heroes.js` scaleRunMods）。
// ⚠ 权威来源在 `js/game/game_event_2.js`；本表只是它的**采样侧镜像**，
//   改动必须同步改 js，并由 `_verify_scale_consistency.js` 双向校验。
const ROUTES_FOUR = [
  { key: '渡', mult: 0.72, dao: 'du',   hero: 'tangseng' },
  { key: '战', mult: 1.12, dao: 'zhan', hero: 'shaseng' },
  { key: '夺', mult: 1.20, dao: 'duo',  hero: 'wukong' },
  { key: '逆', mult: 1.28, dao: 'ni',   hero: 'tangseng' },
];
// —— 六道（demo 模式口径：隐/缘归中性带 1.0）——
const ROUTES_SIX = [
  { key: '渡', mult: 0.72, dao: 'du',   hero: 'tangseng' },
  { key: '战', mult: 1.12, dao: 'zhan', hero: 'shaseng' },
  { key: '夺', mult: 1.20, dao: 'duo',  hero: 'wukong' },
  { key: '隐', mult: 1.00, dao: 'yin',  hero: 'xiaobailong' },
  { key: '缘', mult: 1.00, dao: 'yuan', hero: 'bajie' },
  { key: '逆', mult: 1.28, dao: 'ni',   hero: 'tangseng' },
];

// —— 章末难号（与 ACT_RANGES 对齐，与 _balance_anchor 表②同源）——
const CHAPTER_ENDS = [14, 20, 31, 41, 46, 51, 64, 75, 81];
const CH_DIFF = {}; CHAPTER_ENDS.forEach((d, i) => { CH_DIFF[i + 1] = d; });

// —— 英雄专属成长链（「正道 = 专属成长链」，与 _balance_anchor 表③同源）——
const HERO_GEAR_CHAIN = {
  tangseng: {
    weapon:   ['ts_staff_fan',   'ts_weapon_ch2',   'ts_weapon_ch3',   'ts_weapon_ch4'],
    armor:    ['ts_robe_fan',    'ts_armor_ch2',    'ts_armor_ch3',    'ts_armor_ch4'],
    treasure: ['ts_bowl_fan',    'ts_treasure_ch2', 'ts_treasure_ch3', 'ts_treasure_ch4'],
  },
  shaseng: {
    weapon:   ['ss_staff_fan',   'ss_weapon_ch2',   'ss_weapon_ch3',   'ss_weapon_ch4'],
    armor:    ['ss_robe_fan',    'ss_armor_ch2',    'ss_armor_ch3',    'ss_armor_ch4'],
    treasure: ['ss_bowl_fan',    'ss_treasure_ch2', 'ss_treasure_ch3', 'ss_treasure_ch4'],
  },
  wukong: {
    weapon:   ['wk_staff_base',  'wk_weapon_ch2',   'wk_weapon_ch3',   'wk_weapon_ch4'],
    armor:    ['wk_armor_base',  'wk_armor_ch2',    'wk_armor_ch3',    'wk_armor_ch4'],
    treasure: ['jingu_treasure', 'wk_treasure_ch2', 'wk_treasure_ch3', 'wk_treasure_ch4'],
  },
};
const SLOTS3 = ['weapon', 'armor', 'treasure'];

// —— Boss 强度校准（B(act) 恒 1：真值在 fight() 的 diff 缩放里，不在 B）——
// 教训（探针 _tmp_probe_fight 实证，脚本已归档至 scripts/_retired/_tmp_20260927/_tmp_probe_fight.js）：旧版采样绕过 fight() 缩放，B=1 全 100% 是假象。
const B_SEQ = [1, 1, 1, 1, 1, 1, 1, 1, 1];

// —— 内核环境装配（两把尺共用：index.html 全链 + 可注入 Math.random）——
const _noop = () => {};
const _store = {};
function loadGame() {
  const _Math = Object.create(Math);
  let __rand = mulberry32(0x9e3779b9);
  _Math.random = () => __rand();
  const setRep = (v) => { __rand = mulberry32(((Number.isFinite(+v) ? +v : 0.5) * 0xffffffff) >>> 0); };
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math: _Math,
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
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m) => {
    const f = m[1];
    if (/^https?:/.test(f)) return;
    const fp = path.join(ROOT, f.split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); } catch (e) { /* 单文件失败不中断 */ }
  });
  return { NDX: sb.NDX, setRep: setRep, ctx: sb };
}

// —— fight()「肉鸽难度缩放」复刻（game_combat_1.js fight() 同源）——
// B3/P0-1C（2026-09-26）：统一 0.03/档、封顶 1.6（`_cap = min(d-1,20)` 且 `1+20*0.03 = 1.6`）。
// ⚠ 改这里必须先改 game_combat_1.js fight() + _balance_anchor.js，三处同源。
const FIGHT_SCALE_CAP = 20, FIGHT_SCALE_STEP = 0.03;
function applyFightScale(m, diff, knob) {
  const k = knob || {};
  const ka = numberOr(k.atk, 1), kh = numberOr(k.hp, 1);
  const d = Math.max(1, numberOr(diff, 8));
  const cap = Math.min(d - 1, FIGHT_SCALE_CAP);
  const hpS = (1 + cap * FIGHT_SCALE_STEP) * kh;
  const atkS = (1 + cap * FIGHT_SCALE_STEP) * ka;
  const m2 = {
    name: m.name, type: m.type, boss: !!m.boss, diff: d, behavior: m.behavior,
    hp: Math.max(1, Math.round((m.hp || 100) * hpS)),
    maxHp: Math.max(1, Math.round((m.maxHp || m.hp || 100) * hpS)),
    atk: Math.round((m.atk || 18) * atkS), matk: Math.round((m.matk || 20) * atkS),
    dr: Math.min(0.45, m.dr != null ? m.dr : 0.1), mdef: Math.min(0.45, m.mdef != null ? m.mdef : 0.05),
  };
  m2.stages = (Array.isArray(m.stages) && m.stages.length) ? m.stages.map((h) => Math.max(1, Math.round(h * hpS)))
    : [m2.hp, Math.max(1, Math.round(m2.hp * 0.62))];
  m2.tags = m.tags || ['天庭'];
  if (Array.isArray(m.phaseStats)) m2.phaseStats = m.phaseStats.map((p) => p ? Object.assign({}, p, { atk: Math.round((p.atk || 0) * atkS), matk: Math.round((p.matk || 0) * atkS) }) : p);
  return m2;
}

// —— 用难号标尺给 Boss 定档（真实关隘难号 → bossNameForAct 真名）——
// knob = { atk, hp }：定标扫描用的内存旋钮（仅 run_model 的 --k/--hp 会传，正常采样不传）。
function bossRaw(NDX, bossName, diff, knob) {
  let rm = null;
  try {
    if (NDX.bossStageSetup) {
      const setup = NDX.bossStageSetup(bossName, {});
      if (setup && setup.stages && setup.stages.length >= 1 && setup.p1) {
        rm = {
          name: setup.name || bossName, type: 'boss', boss: true, diff: numberOr(diff, 8),
          stages: setup.stages.map((h) => Math.max(1, Math.round(h))),
          phaseOverrides: setup.phaseOverrides, phaseStats: setup.phaseStats,
          phase2Override: setup.phase2Override, stageRewards: setup.stageRewards,
          breakWith: setup.breakWith, blessTreasure: setup.blessTreasure, phaseSkipOn: setup.phaseSkipOn,
          behavior: setup.behavior,
          hp: Math.max(1, Math.round(numberOr(setup.stages[0], 1000))),
          maxHp: Math.max(1, Math.round(numberOr(setup.stages[0], 1000))),
          atk: Math.round(numberOr(setup.p1.atk, 30)), dr: numberOr(setup.p1.dr, 0.1),
          matk: Math.round(numberOr(setup.p1.matk, 20)), mdef: numberOr(setup.p1.mdef, 30),
        };
      }
    }
  } catch (e) { /* 非配置 Boss 落真实基准面板 */ }
  if (!rm) {
    const base = (NDX.monsterAt && NDX.monsterAt(numberOr(diff, 8))) || {};
    const hp = numberOr(base.hp, 1200), atk = numberOr(base.atk, 24), matk = numberOr(base.matk, 16);
    rm = { name: bossName, type: 'boss', boss: true, diff: numberOr(diff, 8), behavior: base.behavior,
      hp: Math.max(1, Math.round(hp)), maxHp: Math.max(1, Math.round(hp)), atk: Math.round(atk),
      dr: numberOr(base.dr, 0.12), matk: Math.round(matk), mdef: numberOr(base.mdef, 30),
      stages: [Math.max(1, Math.round(hp)), Math.max(1, Math.round(hp * 0.62))] };
  }
  return applyFightScale(rm, diff, knob);
}

// —— 套道带（scaleRunMods：monStr 强化 / monWeak 弱化）——
function applyRoute(NDX, raw, mult) {
  if (mult === 1.0) return raw;
  const flag = mult >= 1 ? { monStr: +(mult - 1).toFixed(3) } : { monWeak: +(1 - mult).toFixed(3) };
  const cp = clone(raw);
  return (NDX.scaleRunMods && NDX.scaleRunMods(cp, { flags: flag })) || cp;
}

// —— 难簿成就加成（真实复刻 achievements.js 的软上限公式）——
//   每难 nb：atk+1.2 / hp+6 / matk+0.9 / mdef+0.004 / dr+0.002；
//   软上限前 ACH_SOFT_CUT 项全量、超出按 ACH_SOFT_TAIL 折算（V9.66：cut 40→18、tail 0.5→0.8）。
// over = { cut, tail, per } 可选覆盖（run_model --cut/--tail/--per 扫描用）。
function metaBonus(ndx, nb, over) {
  const o = over || {};
  const p0 = (ndx && ndx.ACH_BONUS_PER) || { atk: 1.2, hp: 6, matk: 0.9, mdef: 0.004, dr: 0.002 };
  const pk = numberOr(o.per, 1);
  const per = { atk: p0.atk * pk, hp: p0.hp * pk, matk: p0.matk * pk, mdef: p0.mdef * pk, dr: p0.dr * pk };
  const cut = o.cut != null ? o.cut : ((ndx && ndx.ACH_SOFT_CUT) != null ? ndx.ACH_SOFT_CUT : 40);
  const tail = o.tail != null ? o.tail : ((ndx && ndx.ACH_SOFT_TAIL) != null ? ndx.ACH_SOFT_TAIL : 0.5);
  const n = Math.max(0, Math.min(numberOr(nb, 0), (ndx && ndx.ACH_BONUS_CAP) || 81));
  const eff = n <= cut ? n : cut + (n - cut) * tail;
  return {
    ti: { atk: +(per.atk * eff).toFixed(1), hp: Math.round(per.hp * eff), dr: +(per.dr * eff).toFixed(4) },
    yuan: { matk: +(per.matk * eff).toFixed(1), mdef: +(per.mdef * eff).toFixed(4) },
    eff: +eff.toFixed(1),
  };
}

module.exports = {
  ROOT, numberOr, clone, mulberry32, SEED_SEQ, DEFAULT_SEED_N, resolveSeeds,
  DAO_ATK, ROUTES_FOUR, ROUTES_SIX, CHAPTER_ENDS, CH_DIFF, HERO_GEAR_CHAIN, SLOTS3, B_SEQ,
  loadGame, applyFightScale, FIGHT_SCALE_CAP, FIGHT_SCALE_STEP, bossRaw, applyRoute, metaBonus,
};
