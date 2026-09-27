// _balance_anchor.js — 全系统综合数值重定标 · 锚点基线（设计者视角 P0）
// ---------------------------------------------------------------------------
// 目的：在「移除 GLOBAL_DMG_MUL=0.5 + dr 封顶 0.60 + 固定值体系重定标」之前，
//   先量化当前真实基线：每章「当档裸号 / 三槽装备」面板 × 六道代表英雄，
//   对照每章章末 Boss 的 HP/攻，估算回合数与承伤，暴露"玩家成长 vs 怪物经济"的真实差。
//   锚点 = 重定标的目标基准（每章目标 DPS/承伤 由此推导）。
//
// 用法：node scripts/_balance_anchor.js
// 只读：装载真实 index.html 全链，不修改任何游戏文件。
// ---------------------------------------------------------------------------
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

const _noop = () => {};
const _store = {};
function makeCtx() {
  const _Math = Object.create(Math); _Math.random = () => 0.5;
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
  return sb;
}
function loadGame() {
  const sb = makeCtx();
  const ctx = vm.createContext(sb);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  files.forEach((f) => {
    if (/^https?:/.test(f)) return;
    const fp = path.join(ROOT, f.split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); } catch (e) { /* noop */ }
  });
  return sb.NDX;
}
const numberOr = (n, d) => (Number.isFinite(+n) && n != null) ? +n : d;

const NDX = loadGame();
if (!NDX || typeof NDX.computeStats !== 'function') { console.log('FATAL'); process.exit(1); }

// —— 章末难号 / 章末 Boss 名（与 _balance_sweep 同源）——
const CHAPTER_ENDS = [14, 20, 31, 41, 46, 51, 64, 75, 81];
const chapterBosses = NDX.CHAPTER_BOSS_NAMES || [];

// —— 六道代表英雄（**平衡取样用**，非游戏内机制：V9.51 起英雄本命道已取消——
//    渡=取经人/战=沙僧/夺=悟空/隐=白龙/缘=八戒；逆无对应英雄，用取经人作保守代表）——
const DAO_HERO = [
  { dao: '渡', hero: 'tangseng' },
  { dao: '战', hero: 'shaseng' },
  { dao: '夺', hero: 'wukong' },
  { dao: '隐', hero: 'xiaobailong' },
  { dao: '缘', hero: 'bajie' },
  { dao: '逆', hero: 'tangseng' },
];

// —— 三槽装备链（与 _balance_sweep 同源；白龙/八戒缺专属链时兜底取经人）——
const HERO_GEAR_CHAIN = {
  tangseng: { weapon: ['ts_staff_fan', 'ts_weapon_ch2', 'ts_weapon_ch3', 'ts_weapon_ch4'], armor: ['ts_robe_fan', 'ts_armor_ch2', 'ts_armor_ch3', 'ts_armor_ch4'], treasure: ['ts_bowl_fan', 'ts_treasure_ch2', 'ts_treasure_ch3', 'ts_treasure_ch4'] },
  shaseng:  { weapon: ['ss_staff_fan', 'ss_weapon_ch2', 'ss_weapon_ch3', 'ss_weapon_ch4'], armor: ['ss_robe_fan', 'ss_armor_ch2', 'ss_armor_ch3', 'ss_armor_ch4'], treasure: ['ss_bowl_fan', 'ss_treasure_ch2', 'ss_treasure_ch3', 'ss_treasure_ch4'] },
  wukong:   { weapon: ['wk_staff_base', 'wk_weapon_ch2', 'wk_weapon_ch3', 'wk_weapon_ch4'], armor: ['wk_armor_base', 'wk_armor_ch2', 'wk_armor_ch3', 'wk_armor_ch4'], treasure: ['jingu_treasure', 'wk_treasure_ch2', 'wk_treasure_ch3', 'wk_treasure_ch4'] },
};
function threeSlotEquip(NDX, ai, heroId) {
  const chain = HERO_GEAR_CHAIN[heroId] || HERO_GEAR_CHAIN.tangseng;
  const tier = Math.min(Math.max(ai + 1, 1), 4) - 1;
  const out = [];
  for (const slot of ['weapon', 'armor', 'treasure']) {
    const id = chain[slot][tier];
    const e = NDX.lootById ? NDX.lootById(id) : null;
    if (e) out.push(Object.assign({}, e));
  }
  return out;
}

// —— 每章章末 Boss 基准（bossStageSetup 真源，黄风落 monsterAt 两相默认）——
function bossRaw(NDX, bossName, diff) {
  let rm;
  try {
    if (NDX.bossStageSetup) {
      const setup = NDX.bossStageSetup(bossName, {});
      if (setup && setup.stages && setup.stages.length >= 1 && setup.p1) {
        rm = { stages: setup.stages.map((h) => Math.round(h)), hp: Math.round(numberOr(setup.stages[0], 1000)), atk: Math.round(numberOr(setup.p1.atk, 30)), matk: Math.round(numberOr(setup.p1.matk, 20)), dr: numberOr(setup.p1.dr, 0.1), mdef: numberOr(setup.p1.mdef, 0.1) };
      }
    }
  } catch (e) { rm = null; }
  if (!rm) {
    const base = (NDX.monsterAt && NDX.monsterAt(numberOr(diff, 8))) || {};
    const hp = numberOr(base.hp, 1200), atk = numberOr(base.atk, 24);
    rm = { stages: [Math.round(hp), Math.round(hp * 0.62)], hp: Math.round(hp), atk: Math.round(atk), matk: Math.round(numberOr(base.matk, 16)), dr: numberOr(base.dr, 0.12), mdef: numberOr(base.mdef, 0.1) };
  }
  // fight() 肉鸽难度缩放（game_combat_1.js:35-43 同源）：hp 0.06/档 + 后期 0.08；atk 0.13/档
  const d = Math.max(1, numberOr(diff, 8));
  // B3/P0-1C（2026-09-26）与 game_combat_1.js fight() 同源：统一 0.03/档、封顶 1.6
  const _cap = Math.min(d - 1, 20);
  const hpS = 1 + _cap * 0.03;
  const atkS = 1 + _cap * 0.03;
  rm.hp = Math.max(1, Math.round(rm.hp * hpS));
  rm.stages = rm.stages.map((h) => Math.max(1, Math.round(h * hpS)));
  rm.atk = Math.round(rm.atk * atkS);
  rm.matk = Math.round(rm.matk * atkS);
  return rm;
}

// —— 玩家 DPS / 承伤估算（当前公式，含 GLOBAL_DMG_MUL=0.5 与暴击期望）——
// 普攻 DPS = (atk×0.5) × [1 + cri×(criMult-1)] × (1 - 怪物dr)；愿伤 DPS = matk×0.5 × (1 - 怪物mdef)
function estDPS(P, m) {
  const atkDPS = (P.ti.atk || 0) * 0.5 * (1 + (P.ti.cri || 0) * ((P.ti.criMult || 1.6) - 1)) * (1 - (m.dr || 0));
  const matkDPS = (P.yuan.matk || 0) * 0.5 * (1 - (m.mdef || 0));
  return atkDPS + matkDPS;
}
// 承伤/回合 = 怪物普攻 × (1 - 玩家dr)；愿伤 = matk × (1 - mdef)
function estIncoming(P, m) {
  return { atk: Math.round((m.atk || 0) * (1 - (P.ti.dr || 0))), matk: Math.round((m.matk || 0) * (1 - (P.yuan.mdef || 0))) };
}

const lines = [];
lines.push('== 全系统重定标 · 锚点基线（当前公式 · 当档裸号/三槽装备 × 六道代表英雄）==');
lines.push(`战斗公式现状：GLOBAL_DMG_MUL=0.5（普攻/反击×0.5）、dr 封顶 0.50、mdef 封顶 0.50、maxHp 封顶 baseHp×4`);
lines.push('');

// 表1：每章裸号面板（无装备无加成）
lines.push('表1：每章「裸号」面板（playerBaseAt+computeStats，无装备/劫印/经文/meta）');
lines.push('章/diff\t渡-取经人(攻/血/dr)\t战-沙僧\t夺-悟空\t隐-白龙\t缘-八戒');
const bareRows = [];
for (let ai = 0; ai < 9; ai++) {
  const diff = CHAPTER_ENDS[ai];
  const cells = DAO_HERO.map(({ hero }) => {
    const P = NDX.computeStats(hero, [], [], {}, diff);
    return `${P.ti.atk}/${P.ti.maxHp}/${P.ti.dr}`;
  });
  bareRows.push(cells);
  lines.push(`ch${ai + 1}/d${diff}\t${cells.join('\t')}`);
}

lines.push('');
lines.push('表2：每章「三槽装备」面板（当档英雄专属链，经 lootById 真值装载）');
lines.push('章/diff\t渡-取经人(攻/血/dr)\t战-沙僧\t夺-悟空\t隐-白龙\t缘-八戒\t[装备atk贡献倍率]');
const gearRows = [];
for (let ai = 0; ai < 9; ai++) {
  const diff = CHAPTER_ENDS[ai];
  const cells = DAO_HERO.map(({ hero }) => {
    const eq = threeSlotEquip(NDX, ai, hero);
    const P = NDX.computeStats(hero, eq, [], {}, diff);
    const bare = NDX.computeStats(hero, [], [], {}, diff);
    const mult = bare.ti.atk > 0 ? (P.ti.atk / bare.ti.atk).toFixed(2) : '-';
    return `${P.ti.atk}/${P.ti.maxHp}/${P.ti.dr}[×${mult}]`;
  });
  gearRows.push(cells);
  lines.push(`ch${ai + 1}/d${diff}\t${cells.join('\t')}`);
}

lines.push('');
lines.push('表3：每章章末 Boss 基准（fight 缩放后） vs 六道代表玩家（三槽）——估算回合/承伤');
lines.push('章/Boss\tBossHP(总阶段)\tBoss攻\t渡DPS/回合\t战DPS/回合\t夺DPS/回合\t隐DPS/回合\t缘DPS/回合\t渡承伤/回合');
for (let ai = 0; ai < 9; ai++) {
  const bossName = chapterBosses[ai] || '?';
  const diff = CHAPTER_ENDS[ai];
  const m = bossRaw(NDX, bossName, diff);
  const totalHp = m.stages.reduce((a, b) => a + b, 0);
  const dpsCells = DAO_HERO.map(({ hero }) => {
    const eq = threeSlotEquip(NDX, ai, hero);
    const P = NDX.computeStats(hero, eq, [], {}, diff);
    const dps = estDPS(P, m);
    return Math.round(dps);
  });
  const du = NDX.computeStats('tangseng', threeSlotEquip(NDX, ai, 'tangseng'), [], {}, diff);
  const inc = estIncoming(du, m);
  lines.push(`ch${ai + 1}/${bossName}\t${totalHp}\t${m.atk}/${m.matk}\t${dpsCells.join('\t')}\t${inc.atk}`);
}

// 表4：回合数估算（三槽渡取经人 vs 各章 Boss）——暴露玩家输出 vs 怪物血量的真实差
lines.push('');
lines.push('表4：三槽「渡-取经人」对章末 Boss 估算回合（总阶段血/DPS），含承伤预算回合（血/承伤每回合）');
lines.push('章\tBoss总血\tDPS\t估算回合\t玩家血\t承伤/回合\t承伤预算回合');
for (let ai = 0; ai < 9; ai++) {
  const bossName = chapterBosses[ai] || '?';
  const diff = CHAPTER_ENDS[ai];
  const m = bossRaw(NDX, bossName, diff);
  const P = NDX.computeStats('tangseng', threeSlotEquip(NDX, ai, 'tangseng'), [], {}, diff);
  const totalHp = m.stages.reduce((a, b) => a + b, 0);
  const dps = Math.max(1, Math.round(estDPS(P, m)));
  const rounds = Math.round(totalHp / dps);
  const inc = estIncoming(P, m).atk;
  const tankRounds = inc > 0 ? Math.round(P.ti.maxHp / inc) : 999;
  lines.push(`ch${ai + 1}\t${totalHp}\t${dps}\t${rounds}\t${P.ti.maxHp}\t${inc}\t${tankRounds}`);
}

console.log(lines.join('\n'));
