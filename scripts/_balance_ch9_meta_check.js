// _balance_ch9_meta_check.js — 验证 ch9 增强后「满meta 渡」仍可通（设计硬锚点 ≥55%）
'use strict';
const CB = require('./_balance_common.js');
const SEEDS = CB.resolveSeeds('40', '', CB.DEFAULT_SEED_N).filter((n) => Number.isFinite(n));
const GAME = CB.loadGame();
const NDX = GAME.NDX, setGlobalRep = GAME.setRep;
const HERO_GEAR_CHAIN = CB.HERO_GEAR_CHAIN;
function threeSlotEquip(NDX, ai, heroId) {
  const chain = HERO_GEAR_CHAIN[heroId] || HERO_GEAR_CHAIN.tangseng;
  const tier = Math.min(Math.max(ai + 1, 1), 4) - 1, out = [];
  for (const slot of ['weapon', 'armor', 'treasure']) {
    const id = chain[slot][tier]; const e = NDX.lootById ? NDX.lootById(id) : null; if (e) out.push(Object.assign({}, e));
  }
  return out;
}
function makeMetaDu(NDX, ai, diff) {
  const h = 'tangseng', eq = threeSlotEquip(NDX, ai, h);
  const bonus = CB.metaBonus(NDX, 81);
  const P = NDX.computeStats(h, eq, [], bonus, diff);
  return { heroId: h, good: 80, daoAtk: CB.DAO_ATK.du,
    spd: P.spd != null ? P.spd : 8,
    ti: Object.assign({}, P.ti, { hp: P.ti.maxHp, curHp: P.ti.maxHp }),
    yuan: { matk: P.yuan.matk, mdef: P.yuan.mdef },
    reflect: P.reflect || 0, shieldPct: P.shieldPct || 0, armorPen: P.armorPen || 0,
    sealReflect: P.sealReflect || 0, lifesteal: P.lifesteal || 0, evaOnDodge: P.evaOnDodge || false,
    fateFlags: P.fateFlags || {}, coll: P.coll || {}, battleFlags: {}, engineTier: P.engineTier || {} };
}
function sample(NDX, rm, diff, ai) {
  let wins = 0, n = 0;
  for (const seed of SEEDS) {
    setGlobalRep(seed);
    let res; try { res = NDX.calcCombat(makeMetaDu(NDX, ai, diff), CB.clone(rm), { stanceSeq: ['ATK'] }); } catch (e) { continue; }
    if (!res) continue; n++; wins += (!!res.win && !res.lose) ? 1 : 0;
  }
  return n ? wins / n : null;
}
const diff = CB.CHAPTER_ENDS[8];
const bossName = (NDX.CHAPTER_BOSS_NAMES || [])[8];
console.log('== ch9 满meta 渡 胜率 vs Boss 战力倍率 ==');
console.log('Boss=' + bossName + ' diff=d' + diff + ' SEEDS=' + SEEDS.length);
const knobs = [1.0, 1.15, 1.19, 1.31, 1.4, 1.5];
for (const k of knobs) {
  const rm = CB.bossRaw(NDX, bossName, diff, { hp: k, atk: k });
  const w = sample(NDX, rm, diff, 8);
  const flag = (w != null && w >= 0.55) ? '✓可通' : '✗破锚点';
  console.log(`  knob×${k.toFixed(2)}\t渡满meta=${(w * 100).toFixed(1)}%\t${flag}`);
}
