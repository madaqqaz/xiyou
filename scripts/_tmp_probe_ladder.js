// _tmp_probe_ladder.js — 临时探针：验证「当档裸号+装备」胜率阶梯可否被采样通道表达
// 目的：confirms 平衡采样全胜根因（玩家不随难度成长）。用 computeStats 真源构造
//   「裸号+代表装备(无meta)  vs  +满meta(第5局累计)」两种面板，扫 9 章末 Boss，
//   输出胜率阶梯，验证设计目标形状：1章~85% → 4章~12% 硬墙 → 9章极低；满meta 后 5-9 可打。
// 用法：node scripts/_tmp_probe_ladder.js [heroId]
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const HERO = process.argv[2] || 'tangseng';

const _noop = () => {};
const _store = {};
let __rep = 0.5;
function setRep(v) { __rep = v; }
function makeCtx() {
  const _Math = Object.create(Math);
  _Math.random = () => __rep;
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
  const ctx = vm.createContext(makeCtx());
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  files.forEach((f) => {
    if (/^https?:/.test(f)) return;
    const fp = path.join(ROOT, f.split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); } catch (e) { /* 单文件失败不中断 */ }
  });
  return ctx.NDX;
}
const numberOr = (n, d) => (Number.isFinite(+n) && n != null) ? +n : d;
const clone = (o) => JSON.parse(JSON.stringify(o));

// 代表装备包络（ai=章下标 0..8）：真实"当档裸号+装备"的体/愿/血成长。
//   血量由装备提供（playerBaseAt.hp 不随 dif 成长）→ 必须在此随章下标攀升。
//   数值为"代表装备"包络，可后续用 rollEquips 换成真实装备聚合并对标。
function repEquip(ai) {
  const c = ai / 8;                       // 0..1 归一
  return [{
    id: 'probe_weapon', slot: 'weapon',
    atk: Math.round(40 + 260 * c),        // 武器体攻
    matk: Math.round(120 + 480 * c),      // 武器愿伤（取经人愿流）
    hp: Math.round(1800 + 7600 * c),      // 甲胄/身法血量——主流护甲承血
    dr: +(0.02 + 0.08 * c).toFixed(3),
    mdef: +(0.04 + 0.14 * c).toFixed(3),
    spd: 0, cri: 0.02, eva: 0.01,
  }];
}
// 满 meta（约第5局累计）：难簿软上限 full + 卷功名 + 舍利/劫灰/轮回随缘小计（保守偏下限）
function metaBonus() {
  return {
    ti: { atk: 120, hp: 480, dr: 0.012 },
    yuan: { matk: 150, mdef: 0.02 },
  };
}

function sampleBoss(NDX, bossName, diff, equipped, bonus) {
  let raw;
  try {
    if (NDX.bossStageSetup) {
      const s = NDX.bossStageSetup(bossName, {});
      if (s && s.stages && s.stages[0] && s.p1) {
        raw = {
          name: s.name || bossName, type: 'boss', boss: true, diff,
          stages: s.stages, hp: numberOr(s.stages[0], 1000), maxHp: numberOr(s.stages[0], 1000),
          atk: numberOr(s.p1.atk, 30), dr: numberOr(s.p1.dr, 0.1),
          matk: numberOr(s.p1.matk, 20), mdef: numberOr(s.p1.mdef, 30),
        };
      }
    }
  } catch (e) {}
  if (!raw) {
    const b = (NDX.monsterAt && NDX.monsterAt(diff)) || {};
    const hp = numberOr(b.hp, 1200);
    raw = { name: bossName, type: 'boss', boss: true, diff, hp, maxHp: hp,
      atk: numberOr(b.atk, 24), dr: numberOr(b.dr, 0.12),
      matk: numberOr(b.matk, 16), mdef: numberOr(b.mdef, 30),
      stages: [hp, Math.round(hp * 0.62)] };
  }
  const SEEDS = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];
  let n = 0, win = 0, rds = 0;
  for (const seed of SEEDS) {
    setRep(seed);
    let P;
    try { P = NDX.computeStats(HERO, equipped, [], bonus, diff); } catch (e) { continue; }
    if (!P) continue;
    let res;
    try { res = NDX.calcCombat(clone(P), clone(raw), { stanceSeq: ['ATK'] }); } catch (e) { continue; }
    if (!res) continue;
    n++;
    if (!!res.win && !res.lose) win++;
    const r = Number.isInteger(res.totalRounds) ? res.totalRounds : (Array.isArray(res.roundsDetail) ? res.roundsDetail.length : 0);
    rds += r;
  }
  if (!n) return null;
  return { n, win: win / n, rds: rds / n };
}

let NDX = loadGame();
if (!NDX || typeof NDX.computeStats !== 'function' || typeof NDX.calcCombat !== 'function') {
  console.log('FATAL: computeStats/calcCombat 未加载'); process.exit(1);
}
const bosses = (NDX.CHAPTER_BOSS_NAMES || []).filter(Boolean);
console.log(`英雄=${HERO}  9 章末 Boss 覆盖=${bosses.length}`);
console.log('章\tdiff\tBoss\t裸号胜率\t裸号回合\t满meta胜率\t满meta回合');
let rows = [];
for (let ai = 0; ai < bosses.length; ai++) {
  const diff = 4 + Math.round((16 - 4) * ai / 8);
  const eq = repEquip(ai);
  const mb = metaBonus();
  const no = sampleBoss(NDX, bosses[ai], diff, eq, {});
  const met = sampleBoss(NDX, bosses[ai], diff, eq, mb);
  const nStr = no ? `${(no.win * 100).toFixed(0)}%` : 'N/A';
  const rStr = no ? no.rds.toFixed(1) : '-';
  const mStr = met ? `${(met.win * 100).toFixed(0)}%` : 'N/A';
  const mrStr = met ? met.rds.toFixed(1) : '-';
  rows.push({ ai, diff, name: bosses[ai], no, met });
  console.log(`${ai + 1}\t${diff}\t${bosses[ai]}\t${nStr}\t${rStr}\t${mStr}\t${mrStr}`);
}
//
const wall = rows[3] && rows[3].no ? rows[3].no.win : 0;
const first = rows[0] && rows[0].no ? rows[0].no.win : 0;
const lastMeta = rows[8] && rows[8].met ? rows[8].met.win : 0;
console.log('\n设计目标对照：');
console.log(`  1章裸号胜率 ${(first * 100).toFixed(0)}% （目标 ~85%，艰难）`);
console.log(`  4章裸号胜率 ${(wall * 100).toFixed(0)}% （目标 ≤~15%，第一次极限）`);
console.log(`  9章满meta胜率 ${(lastMeta * 100).toFixed(0)}% （目标 ≥~55%，第5次可通关）`);
process.exit(0);