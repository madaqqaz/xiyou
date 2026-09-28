// _balance_scan_knob.js — 章末 Boss 战力灵敏度扫描（提议蓝图用）
// ---------------------------------------------------------------------------
// 目的：对每个章末 Boss，扫描「整体战力倍率 knob（作用于 hp/atk/matk）」→ 渡档裸号胜率，
//   反解「目标胜率」对应的 knob，作为 BOSS_FORMS 基础值调整系数（base × knob = 当前有效战力 × knob）。
// 只读：装载真实 index.html 全链，不写任何 js/ 文件。
// 用法：node scripts/_balance_scan_knob.js --seeds=40
'use strict';
const path = require('path');
const CB = require('./_balance_common.js');
const ROOT = CB.ROOT;

const ARGS = process.argv.slice(2);
const SEEDS_ARG = (ARGS.filter((a) => a.startsWith('--seeds=')).map((a) => a.split('=')[1]) || [''])[0];
const SEEDS = CB.resolveSeeds(SEEDS_ARG, '', CB.DEFAULT_SEED_N).filter((n) => Number.isFinite(n));

const GAME = CB.loadGame();
const NDX = GAME.NDX;
const setGlobalRep = GAME.setRep;
if (!NDX || typeof NDX.calcCombat !== 'function') { console.log('FATAL: calcCombat 未加载'); process.exit(1); }

// —— 玩家构造（复刻 sweep 口径：当档三槽裸号 + 渡道）——
const HERO_GEAR_CHAIN = CB.HERO_GEAR_CHAIN;
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
const BARE_GOOD = [12, 18, 24, 30, 34, 38, 42, 46, 50];
function makeDuPlayer(NDX, ai, diff) {
  const h = 'tangseng';
  const eq = threeSlotEquip(NDX, ai, h);
  const P = NDX.computeStats(h, eq, [], {}, diff);
  const daoAtk = CB.DAO_ATK.du || null;
  return {
    heroId: h, good: BARE_GOOD[Math.min(Math.max(ai, 0), 8)], daoAtk,
    spd: (P.spd != null ? P.spd : 8),
    ti: Object.assign({}, P.ti, { hp: P.ti.maxHp, curHp: P.ti.maxHp }),
    yuan: { matk: P.yuan.matk, mdef: P.yuan.mdef },
    reflect: P.reflect || 0, shieldPct: P.shieldPct || 0, armorPen: P.armorPen || 0,
    sealReflect: P.sealReflect || 0, lifesteal: P.lifesteal || 0, evaOnDodge: P.evaOnDodge || false,
    fateFlags: P.fateFlags || {}, coll: P.coll || {}, battleFlags: {}, engineTier: P.engineTier || {},
  };
}
function sampleMon(NDX, rawMonster, diff, ai) {
  const pb = () => makeDuPlayer(NDX, ai, diff);
  let wins = 0, n = 0;
  for (const seed of SEEDS) {
    setGlobalRep(seed);
    const player = pb();
    let res;
    try { res = NDX.calcCombat(player, CB.clone(rawMonster), { stanceSeq: ['ATK'] }); } catch (e) { continue; }
    if (!res) continue;
    n++; wins += (!!res.win && !res.lose) ? 1 : 0;
  }
  return n ? wins / n : null;
}

const CHAPTER_ENDS = CB.CHAPTER_ENDS;
const chapterBosses = NDX.CHAPTER_BOSS_NAMES || [];
const KNOBS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4, 1.7, 2.0];

console.log('== 章末 Boss 战力灵敏度扫描（渡档裸号，SEEDS=' + SEEDS.length + '）==');
console.log('knob 列：作用于 boss hp/atk/matk 的整体倍率；胜率为 渡×0.72 裸号');
console.log('');
console.log('章\tBoss\tdiff\t' + KNOBS.map((k) => '×' + k).join('\t'));

const curves = [];
for (let ai = 0; ai < chapterBosses.length; ai++) {
  const bossName = chapterBosses[ai]; if (!bossName) continue;
  const diff = CHAPTER_ENDS[ai];
  const cells = KNOBS.map((k) => {
    const rm = CB.bossRaw(NDX, bossName, diff, { hp: k, atk: k });
    const w = sampleMon(NDX, rm, diff, ai);
    return w == null ? 'N/A' : (w * 100).toFixed(0) + '%';
  });
  curves.push({ ai, bossName, diff, cells });
  console.log(`ch${ai + 1}\t${bossName}\td${diff}\t${cells.join('\t')}`);
}

// —— 反解：给定目标胜率，线性插值找 knob ——
// winByKnob: [{k, w}]，k 升序 ⇒ w 降序（boss 越弱胜率越高）。
function invertKnob(targetWin, winByKnob) {
  const pts = winByKnob.slice().sort((a, b) => a.k - b.k);
  if (targetWin >= pts[0].w) return pts[0].k;            // 目标高于最高胜率（已全胜/封顶）
  if (targetWin <= pts[pts.length - 1].w) return pts[pts.length - 1].k; // 目标低于最低胜率（已全败）
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (targetWin <= a.w && targetWin >= b.w) {
      const t = (a.w - targetWin) / (a.w - b.w || 1e-9);
      return +(a.k + (b.k - a.k) * t).toFixed(3);
    }
  }
  return null;
}

console.log('');
console.log('== 反解：目标胜率 → 建议 BOSS_FORMS 倍率（base × knob）==');
// 推荐蓝图目标（渡档裸号）：ch1 教学可过；ch2 仅渡可过(≥55%)；ch3 运气窗(15-25%)；
//   ch3→ch9 单调递减收口；ch9 满meta 渡另≥55%（单独锚点，不约束裸号）。
const TARGET = { 1: 1.00, 2: 0.65, 3: 0.22, 4: 0.18, 5: 0.15, 6: 0.12, 7: 0.10, 8: 0.09, 9: 0.07 };
console.log('目标(渡裸): ' + Object.keys(TARGET).map((k) => `ch${k}=${(TARGET[k] * 100).toFixed(0)}%`).join(' '));
console.log('');
console.log('章\tBoss\t当前(×1)\t目标\t建议knob\t方向');
for (const c of curves) {
  const winByKnob = KNOBS.map((k, i) => {
    const cell = c.cells[i];
    const w = cell === 'N/A' ? null : parseFloat(cell) / 100;
    return { k, w };
  }).filter((p) => p.w != null);
  const curW = (winByKnob.find((p) => p.k === 1.0) || {}).w;
  const tgt = TARGET[c.ai + 1];
  const knob = invertKnob(tgt, winByKnob);
  // 若 ×1.0 已接近目标（±5pp），建议保持。
  let dir;
  if (knob == null) dir = '—';
  else if (curW != null && Math.abs(curW - tgt) <= 0.05) dir = '保持 ×1.0（已接近）';
  else if (knob > 1.0) dir = `增强×${knob.toFixed(2)}（更难）`;
  else dir = `削弱×${knob.toFixed(2)}（更易）`;
  console.log(`ch${c.ai + 1}\t${c.bossName}\t${curW == null ? 'N/A' : (curW * 100).toFixed(0) + '%'}\t${(tgt * 100).toFixed(0)}%\t${knob == null ? 'N/A' : '×' + knob.toFixed(2)}\t${dir}`);
}
