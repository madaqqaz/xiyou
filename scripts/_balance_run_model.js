// _balance_run_model.js — 「第几次能通关」推演器（设计者视角）
// ---------------------------------------------------------------------------
// 目的：把 sweep 的单点胜率升级为**通关次数模型**。
//   sweep 只回答「某章某道胜率多少」；本脚本回答用户真正关心的问题：
//   「玩家要死几次才能通关？乱选装备/六道能不能过？」
//
// 三维建模：
//   ① 装备质量 random（乱选：当章池随机三槽，不管道/英雄匹配）
//                 proper（当档：英雄专属成长链，随章进阶——现有的「正常玩」口径）
//                 optimal（精选：当章池每槽 power 最高件——「配装 BD 玩明白了」）
//   ② run 积累   run1/3/5/8/10/15：难簿成就数(nb) + 衣冠冢遗物(1.55×武器) + 善念 随次数递增
//   ③ 六道       渡×0.72 / 战×1.0 / 夺×1.0 / 逆×1.28
//
// 用法：
//   node scripts/_balance_run_model.js                 → 全矩阵（当前数值）
//   node scripts/_balance_run_model.js --k=1.4         → Boss 攻/愿伤 ×1.4 试算（定标扫描用，不写盘）
//   node scripts/_balance_run_model.js --k=1.4 --hp=1.2→ 同时缩放 Boss 血
//   node scripts/_balance_run_model.js --ch=1,2,3      → 只看 demo 前三章
//   node scripts/_balance_run_model.js --seeds=12      → 每格采样数（默认 12）
//
// ⚠ 只读：不写任何游戏文件。--k/--hp 仅内存缩放，用于「该把 Boss 调到多强」的反推。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
// R1（2026-09-27）：与 _balance_sweep.js 共用同一份真源（道带/攻式/章末难号/装备链/缩放/难簿加成）。
//   此前 run_model 的战/夺 mult 已对齐 V9.65（1.12/1.20）而 sweep 仍停在 1.0 ⇒ 两尺测的是两个游戏。
const CB = require('./_balance_common.js');

const ARGS = process.argv.slice(2);
const numArg = (n, d) => { const a = ARGS.find((x) => x.startsWith('--' + n + '=')); return a ? Number(a.split('=')[1]) : d; };
const strArg2 = (n, d) => { const a = ARGS.find((x) => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const K_ATK = numArg('k', 1);        // Boss 攻/愿伤全局倍率（定标旋钮）
const K_HP = numArg('hp', 1);        // Boss 血全局倍率
// R7：`--seeds=N` 统一为**采样点数**，默认由 12 提到 40（与 sweep 同纪律、同默认序列）。
const N_SEEDS = numArg('seeds', CB.DEFAULT_SEED_N);
// 逐章微调旋钮（A 方案用）：--ck=1:1.07,3:0.90 → 按章缩放 Boss 攻/愿伤；--chp= 同理缩放血
const _parseChMap = (n) => {
  const a = ARGS.find((x) => x.startsWith('--' + n + '='));
  if (!a) return {};
  const o = {};
  a.split('=')[1].split(',').forEach((p) => {
    const kv = p.split(':').map(Number);
    if (kv.length === 2 && kv[0] >= 1 && kv[0] <= 9 && kv[1] > 0) o[kv[0]] = kv[1];
  });
  return o;
};
const CH_ATK = _parseChMap('ck');
const CH_HP = _parseChMap('chp');
// —— run 积累曲线旋钮（A 方案扫描用；只内存试算，不写盘）——
//   --cut=N    覆盖 ACH_SOFT_CUT（软削起点：前 N 项全额生效）
//   --tail=0.8 覆盖 ACH_SOFT_TAIL（超出部分每项计入比例）
//   --per=0.8  ACH_BONUS_PER 全局缩放（每份难簿的价值）
//   --nbs=7    每周目新增难簿数（模型估算：默认 10，放缓后 r10 才接近上限）
//   --nbb=6    首周目起始难簿数
const META_CUT = numArg('cut', null);
const META_TAIL = numArg('tail', null);
const META_PER = numArg('per', 1);
const NB_SLOPE = numArg('nbs', 7);
// 显式 nb 表：--nbt=20,20,20,20,20,20 直接指定 RUNS 六档的难簿数（用真实曲线覆盖线性假设）
const NB_TABLE = strArg2('nbt', null);
const NB_BASE = numArg('nbb', 6);
const CH_ARG = ARGS.find((x) => x.startsWith('--ch='));
const CHS = CH_ARG ? CH_ARG.split('=')[1].split(',').map(Number).filter((n) => n >= 1 && n <= 9) : [1, 2, 3, 4, 5, 6, 7, 8, 9];

const _noop = () => {};
const _store = {};
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// R1：内核装载 + 种子化 PRNG 已抽到 _balance_common.loadGame()。
const numberOr = (v, d) => (Number.isFinite(+v) ? +v : d);
const clone = (o) => JSON.parse(JSON.stringify(o));

// —— 六道攻式（R1：真源在 _balance_common.DAO_ATK，与 dao_system.js DAO_ATK_STYLE 同源）——
const DAO_ATK = CB.DAO_ATK;
// —— 道续航旋钮（试算用）：--dls=逆:0.10 → 给该道额外吸血比例（真伤道无 heal 分支，靠 player.lifesteal 补）
// ⚠ 必须在 DAO_ATK 之后：ROUTES 里按 dao key 索引。
const DAO_LS = {};
{
  const a = ARGS.find((x) => x.startsWith('--dls='));
  if (a) {
    a.split('=')[1].split(',').forEach((p) => {
      const kv = p.split(':');
      const k = { 渡: 'du', 战: 'zhan', 夺: 'duo', 逆: 'ni' }[kv[0]];
      if (k && Number(kv[1]) >= 0) DAO_LS[k] = Number(kv[1]);
    });
    console.log('道续航覆盖: ' + Object.keys(DAO_LS).map((k) => k + '+' + DAO_LS[k]).join(' '));
  }
}
// V9.65：压强与真实 scaleRunMods 对齐 —— 战 +0.03/次→1.12、夺 +0.05/次→1.20（4 次封顶）、
//   渡 -0.28→0.72、逆 +0.28→1.28（clamp 边界）。
// R1：真源已抽到 _balance_common.ROUTES_FOUR（sweep 现与本尺同读一份 ⇒ 两尺可互证）。
const ROUTES = CB.ROUTES_FOUR;
// 道压强系数覆盖试算：--dm=逆:1.15,夺:1.05（仅内存，用于找「该道该多难」）
// ⚠ 必须在 ROUTES 之后：ARGS 在文件头部解析，此处 ROUTES 才已初始化（TDZ）。
const DM_ARG = ARGS.find((x) => x.startsWith('--dm='));
if (DM_ARG) {
  DM_ARG.split('=')[1].split(',').forEach((p) => {
    const kv = p.split(':');
    const r = ROUTES.find((x) => x.key === kv[0]);
    if (r && Number(kv[1]) > 0) r.mult = Number(kv[1]);
  });
  console.log('道压强覆盖: ' + ROUTES.map((r) => r.key + '×' + r.mult).join(' '));
}
// R1：英雄专属成长链真源在 _balance_common.HERO_GEAR_CHAIN。
const HERO_GEAR_CHAIN = CB.HERO_GEAR_CHAIN;
const SLOTS3 = CB.SLOTS3;
// ⚠ 权重纪律：dr/eva 是「比例」字段，一旦给到 1e5 量级就会压倒 atk/hp，
// 精选档会挑出一身纯防装 ⇒ 打不死 Boss ⇒ 假性 0%。此处按战斗量级折算成等效战力。
const powerOf = (e) => (e.atk || 0) * 10 + (e.matk || 0) * 10 + (e.hp || 0) + (e.dr || 0) * 2000 + (e.eva || 0) * 1500 + (e.mdef || 0) * 20;

// 当章可用池（排除事件专属/日记/商店经济套，与 rollAdvDrops 同口径）
let _poolCache = null;
function chapterPool(NDX, ch) {
  if (!_poolCache) {
    _poolCache = {};
    (NDX.EQUIP_POOL || []).forEach((e) => {
      if (!e || !e.id || e.eventOnly || e.diary || e.cost) return;
      const c = e.chapter || 1;
      (_poolCache[c] = _poolCache[c] || []).push(e);
    });
  }
  return _poolCache[ch] || [];
}
// ① 乱选：当章池随机取三槽各一件（固定伪随机，可复现）
function randomEquip(NDX, ch, salt) {
  const pool = chapterPool(NDX, ch);
  const rnd = mulberry32(0x1234 + ch * 977 + salt * 31);
  const out = [];
  SLOTS3.forEach((slot) => {
    const cand = pool.filter((e) => e.slot === slot);
    if (!cand.length) return;
    out.push(Object.assign({}, cand[Math.floor(rnd() * cand.length) % cand.length]));
  });
  return out.length ? out : properEquip(NDX, ch, 'tangseng');
}
// ② 当档：英雄专属成长链（tier 封顶 4）
function properEquip(NDX, ch, heroId) {
  const chain = HERO_GEAR_CHAIN[heroId] || HERO_GEAR_CHAIN.tangseng;
  const tier = Math.min(Math.max(ch, 1), 4) - 1;
  const out = [];
  SLOTS3.forEach((slot) => {
    const e = NDX.lootById ? NDX.lootById(chain[slot][tier]) : null;
    if (e) out.push(Object.assign({}, e));
  });
  return out;
}
// ③ 精选：在「专属链件 vs 当章池同槽最强件」中逐槽取优。
// ⚠ 实测（2026-09-26）：英雄专属链数值是通用池的 ~6 倍（ts_weapon_ch2 power3950 vs 池顶 pw_w2 616）
//   ——「正道=专属成长链」，通用池是杂鱼。若直接只用池子选最强，精选反而弱于当档（假性 38%），
//   违背单调性。故精选定义为：以专属链为底，弱槽才被池中更强件替换 ⇒ 保证 optimal ≥ proper。
function optimalEquip(NDX, ch, heroId) {
  const base = properEquip(NDX, ch, heroId);
  if (!base.length) return base;
  const pool = chapterPool(NDX, ch);
  return base.map((e) => {
    const cand = pool.filter((x) => x.slot === e.slot).sort((a, b) => powerOf(b) - powerOf(a))[0];
    return (cand && powerOf(cand) > powerOf(e)) ? Object.assign({}, cand) : e;
  });
}
function buildEquip(NDX, quality, ch, heroId, salt) {
  let eq;
  if (quality === 'random') eq = randomEquip(NDX, ch, salt);
  else if (quality === 'optimal') eq = optimalEquip(NDX, ch, heroId);
  else eq = properEquip(NDX, ch, heroId);
  // 衣冠冢遗物：第 3 次起可取回高阶武器（1.55×），第 8 次起全槽
  return eq;
}
// —— run 积累模型 ——
// nb（难簿成就数）随次数递增、封顶 81；good（善念）同理；legacy（衣冠冢遗物）第 3 次起生效。
const RUNS = [1, 3, 5, 8, 10, 15];
function runState(run) {
  const nb = (function () {
    if (NB_TABLE) {
      const arr = NB_TABLE.split(',').map(Number);
      const i = RUNS.indexOf(run);
      if (i >= 0 && Number.isFinite(arr[i])) return arr[i];
    }
    return Math.min(81, Math.round(NB_BASE + (run - 1) * NB_SLOPE));
  })();
  return {
    nb: nb,
    good: Math.min(120, Math.round(12 + (run - 1) * 9)),
    legacy: run >= 3,
    legacyAll: run >= 8,
  };
}
// R1：软上限公式真源在 _balance_common.metaBonus（over 覆盖 cut/tail/per）。
function metaBonus(ndx, nb) {
  return CB.metaBonus(ndx, nb, { cut: META_CUT, tail: META_TAIL, per: META_PER });
}
// ⚠ 骨架纪律：必须复刻 _balance_sweep.js 的 player 映射（ti/yuan/spd/…），
// 不能直接把 computeStats 的原始返回体丢给 calcCombat——字段结构不同会让内核
// 读不到 ti.maxHp/curHp，玩家被当成零面板 ⇒ 假性全败（曾致 ch3+ 全 0%）。
// 新增成长轴旋钮：--layer=0.04 → 第 run 周目给 (1+0.04×(run-1)) 面板乘区（模拟「周目层数」永久加成）
const LAYER = numArg('layer', 0);
function makePlayer(NDX, ch, diff, rs, daoKey, heroId, quality, salt, run) {
  const eq = buildEquip(NDX, quality, ch, heroId, salt);
  const bonus = metaBonus(NDX, rs.nb);
  const P = NDX.computeStats(heroId, eq, [], bonus, diff);
  const dA = DAO_ATK[daoKey] || null;
  // ⚠ 口径纪律：ls 走 style.ls（真机 combat_part1.js 逆血分支），不用 player.lifesteal
  //   ——后者走 sealLifesteal 分支、受 LIFESTEAL_CAP 封顶且与劫印吸血叠加，与真机不同。
  const daoAtk = dA ? clone(dA) : null;
  if (daoAtk && DAO_LS[daoKey] != null) daoAtk.style.ls = DAO_LS[daoKey];
  const pl = {
    heroId: heroId, good: rs.good, daoAtk: daoAtk, dao: dA ? dA.dao : null,
    spd: (P.spd != null ? P.spd : 8),
    ti: Object.assign({}, P.ti, { hp: P.ti.maxHp, curHp: P.ti.maxHp }),
    yuan: { matk: P.yuan.matk, mdef: P.yuan.mdef },
    reflect: P.reflect || 0, shieldPct: P.shieldPct || 0, armorPen: P.armorPen || 0,
    sealReflect: P.sealReflect || 0, lifesteal: P.lifesteal || 0, evaOnDodge: P.evaOnDodge || false,
    fateFlags: P.fateFlags || {}, coll: P.coll || {}, battleFlags: {}, engineTier: P.engineTier || {},
  };
  // 衣冠冢遗物：战斗内核读的是 ti.atk / yuan.matk，不是面板顶层字段
  if (rs.legacy) {
    pl.ti.atk = Math.round((pl.ti.atk || 0) * 1.55);
    pl.yuan.matk = Math.round((pl.yuan.matk || 0) * 1.55);
  }
  // 新成长轴（层）：按周目数线性放大体/愿面板（试算用，决定是否新建 ACH 之外的积累源）
  if (LAYER > 0) {
    const k = 1 + LAYER * (Math.max(1, numberOr(run, 1)) - 1);
    pl.ti.atk = Math.round((pl.ti.atk || 0) * k);
    pl.ti.maxHp = Math.round((pl.ti.maxHp || 0) * k);
    pl.ti.hp = pl.ti.maxHp; pl.ti.curHp = pl.ti.maxHp;
    pl.ti.dr = Math.min(0.45, (pl.ti.dr || 0) + LAYER * 0.06 * (Math.max(1, numberOr(run, 1)) - 1));
    pl.yuan.mdef = (pl.yuan.mdef || 0) + LAYER * 0.05 * (Math.max(1, numberOr(run, 1)) - 1);
    pl.yuan.matk = Math.round((pl.yuan.matk || 0) * k);
  }
  return pl;
}
// R1：Boss 构造 / fight() 同源缩放 / 道带套用 已抽到 _balance_common。
//   其中 applyFightScale 带定标旋钮（K_ATK/K_HP 仅内存试算，不写盘）。
//   ⚠ knob 必须显式下传：本尺的 --k/--hp 定标旋钮走这里，漏传会导致旋钮静默失效（曾踩）。
const bossRaw = (NDX, bossName, diff) => CB.bossRaw(NDX, bossName, diff, { atk: K_ATK, hp: K_HP });
const applyRoute = (NDX, raw, mult) => CB.applyRoute(NDX, raw, mult);
// 章→难号（与 ACT_RANGES 对齐：R1 起并入 _balance_common.CH_DIFF，两尺同源）
const CH_DIFF = CB.CH_DIFF;

const GAME = CB.loadGame();
const NDX = GAME.NDX;
const setGlobalRep = GAME.setRep;
// R7：`--seeds=N` 与 sweep 同语义（采样点数），默认 40、序列与 sweep 完全一致 ⇒ 两尺可逐格互证。
const SEEDS = CB.resolveSeeds(
  (ARGS.find((x) => x.startsWith('--seeds=')) || '').split('=')[1], '', N_SEEDS
).filter((n) => Number.isFinite(n));
const lines = [];
const P = (s) => lines.push(s);

P('== 《逆道西行》通关次数推演（装备质量 × 积累次数 × 六道）==');
P(`定标旋钮：Boss攻×${K_ATK} / Boss血×${K_HP}（仅内存试算，未写盘）`);
// R7：自打印采样口径（与 sweep 同源序列），跨版本数字可直接对账
P(`随机种子采样：SEEDS=${SEEDS.length}（首 ${SEEDS.slice(0, 3).join(',')} … 末 ${SEEDS.slice(-2).join(',')}）`);
P(`积累曲线：nb=${NB_BASE}+${NB_SLOPE}×(run-1) 封顶81｜软削 cut=${META_CUT == null ? NDX.ACH_SOFT_CUT : META_CUT} tail=${META_TAIL == null ? NDX.ACH_SOFT_TAIL : META_TAIL}｜per×${META_PER}`);
P('  eff 档位：' + RUNS.map((r) => 'r' + r + '=' + metaBonus(NDX, runState(r).nb).eff).join(' '));
P('胜率口径：单场章末 Boss；「通关」= 该章胜率 ≥60%（能稳定farm过）');
P('');

function sampleWin(NDX, rawMonster, pb) {
  let wins = 0, n = 0;
  for (const seed of SEEDS) {
    setGlobalRep(seed);
    if (typeof NDX.calcCombat !== 'function') continue;
    let res;
    try { res = NDX.calcCombat(pb(), clone(rawMonster), { stanceSeq: ['ATK'] }); } catch (e) { continue; }
    if (!res) continue;
    n++;
    if (res.win && !res.lose) wins++;
  }
  return n ? wins / n : null;
}

// 主矩阵：每「装备质量」一张表，行=章，列=道×run
const QUALITIES = [
  { k: 'random', name: '①乱选（当章池随机三槽，不管道/英雄）' },
  { k: 'proper', name: '②当档（英雄专属成长链，正常玩）' },
  { k: 'optimal', name: '③精选（当章池每槽最强件，配装玩明白）' },
];
const bossNames = NDX.CHAPTER_BOSS_NAMES || [];
const results = {}; // results[quality][ch][dao][run] = winRate
for (const q of QUALITIES) {
  results[q.k] = {};
  P('—— ' + q.name + ' ——');
  P('章\t' + ROUTES.map((r) => r.key).join('\t\t\t') + '');
  P('\t' + RUNS.map((r) => ('r' + r).padEnd(5)).join(' ').repeat(1) + '\t'.repeat(0));
  for (const ch of CHS) {
    const diff = CH_DIFF[ch];
    const bName = bossNames[ch - 1] || ('ch' + ch + 'Boss');
    let rawBase = bossRaw(NDX, bName, diff);
    // 逐章微调（--ck / --chp）
    const ka = CH_ATK[ch], kh = CH_HP[ch];
    if (ka || kh) {
      rawBase = clone(rawBase);
      if (ka && ka !== 1) {
        rawBase.atk = Math.round((rawBase.atk || 0) * ka);
        rawBase.matk = Math.round((rawBase.matk || 0) * ka);
        if (Array.isArray(rawBase.phaseStats)) {
          rawBase.phaseStats = rawBase.phaseStats.map((p) => p ? Object.assign({}, p, {
            atk: Math.round((p.atk || 0) * ka), matk: Math.round((p.matk || 0) * ka),
          }) : p);
        }
      }
      if (kh && kh !== 1) {
        rawBase.hp = Math.max(1, Math.round((rawBase.hp || 0) * kh));
        rawBase.maxHp = rawBase.hp;
        if (Array.isArray(rawBase.stages)) rawBase.stages = rawBase.stages.map((s) => Math.max(1, Math.round(s * kh)));
      }
    }
    const cells = [];
    results[q.k][ch] = {};
    for (const r of ROUTES) {
      results[q.k][ch][r.key] = {};
      const raw = applyRoute(NDX, rawBase, r.mult);
      for (const run of RUNS) {
        const rs = runState(run);
        const pb = () => makePlayer(NDX, ch, diff, rs, r.dao, r.hero, q.k, run);
        const w = sampleWin(NDX, raw, pb);
        results[q.k][ch][r.key][run] = w;
        cells.push(w == null ? ' -- ' : (Math.round(w * 100) + '%').padEnd(5));
      }
    }
    P(`ch${ch}\t` + cells.join(' '));
  }
  P('\t' + RUNS.map((r) => ('r' + r).padEnd(5)).join(' ') + '  ← 列序：' + ROUTES.map((r) => r.key).join('/') + ' 各 6 个 run 档');
  P('');
}

// 推断「第几次能通关」：对每条道，找最小的 run 使全 9 章（或指定章）胜率均 ≥60%
P('== 推演结论：第几次能打穿（全部选定章均 ≥60%）==');
P('道\t乱选\t当档\t精选\t（— = 15 次内打不穿）');
for (const r of ROUTES) {
  const row = [];
  for (const q of QUALITIES) {
    let firstRun = null;
    for (const run of RUNS) {
      const ok = CHS.every((ch) => (results[q.k][ch][r.key][run] || 0) >= 0.6);
      if (ok) { firstRun = run; break; }
    }
    row.push(firstRun ? ('第' + firstRun + '次') : '—');
  }
  P(`${r.key}\t` + row.join('\t'));
}
P('');
P('== 逐章首次可通次数（当档装备口径，正常玩）==');
P('章\t' + ROUTES.map((r) => r.key).join('\t'));
for (const ch of CHS) {
  const cells = ROUTES.map((r) => {
    for (const run of RUNS) if ((results.proper[ch][r.key][run] || 0) >= 0.6) return '第' + run + '次';
    return '—';
  });
  P(`ch${ch}\t` + cells.join('\t'));
}

const out = lines.join('\n');
console.log(out);
try { fs.writeFileSync(path.join(__dirname, '_balance_run_out.txt'), out, 'utf8'); } catch (e) { /* 只读脚本，写出失败不阻断 */ }
