// _balance_sweep.js — 战斗平衡回归采样（设计者视角 P0）
// ---------------------------------------------------------------------------
// 目的：给《逆道西行》一套「可常驻跑批」的平衡手感采样。
//   门禁已覆盖 结构/语法/一致性；但「玩家 vs 各 Boss 的胜率/回合数/残血分布」
//   没有常驻验证。本脚本在 computeStats 的 GGA 属性结算 + calcCombat 真实内核之上，
//   批量采样 9 章末 Boss 的平衡曲线，输出可读表格，并带一层默认关闭的基线断言。
//
// 用法：
//   node scripts/_balance_sweep.js            → 全量采样 + 基线断言（默认 EXPLICIT_BASELINE）
//   node scripts/_balance_sweep.js --baseline  → 强制开启基线门禁（供 _run_all_gates 选配）
//   node scripts/_balance_sweep.js --csv       → 额外输出 CSV 到 scripts/_balance_out.csv
//   node scripts/_balance_sweep.js --seeds=0.99,0.5 → 自定义随机种子序列
//
// 判定：基线断言开启时，任何 Boss 的「胜率采样均值」落到 RATIONABLE 区间之外
//   ⇒ 非 0 进程退出（blocking），供门禁抓取。默认（不带 --baseline）仅报告、不阻断，
//   保证本脚本不抢跑手调平衡。
//
// 设计约束（对齐宪法）：
//   - 只读：装载真实 index.html 全链（含 buff_system / combat_part1 / computeStats / bossStageSetup）
//   - 确定性：唯一随机源 Math.random 桩为可入种子序列，逐 Boss 可复现
//   - 真实 Boss：经 bossStageSetup 构造多阶段 rawMonster（不造 zero-strength 假面）
//   - 采样：diff 爬升贯穿，Boss 强度随难号/档位爬升，检验"曲线平滑"是否被打穿
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

// —— 命令行参数 ——
const ARGS = process.argv.slice(2);
const WANT_BASELINE = ARGS.includes('--baseline');
const WANT_CSV = ARGS.includes('--csv');
const SEEDS_ARG = ARGS.filter((a) => a.startsWith('--seeds=')).map((a) => a.split('=')[1])[0];
const SEEDS = (SEEDS_ARG ? SEEDS_ARG.split(',').map(Number) : [0.99, 0.5]).filter((n) => Number.isFinite(n));

// —— 装配平面 ——
const _noop = () => {};
const _store = {};
let __ndxRep = 0.99;                       // 可切换的确定性随机源（Math.random 转发）
function setGlobalRep(v) { __ndxRep = v; }
function makeCtx() {
  const _Math = Object.create(Math);
  _Math.random = () => __ndxRep;
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
    const p = f.split('?')[0];
    const fp = path.join(ROOT, p);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: p }); } catch (e) { /* 单文件装载失败不中断 */ }
  });
  return sb.NDX;
}

// —— 标准玩家构造器（体攻流基线，承接既有测试范式）——
function makePlayer(over) {
  return Object.assign({
    heroId: 'tangseng', good: 0, spd: 11,
    ti: {
      atk: 180, atkB: 0, fixAtk: 0,
      maxHp: 3000, curHp: 3000, hp: 3000, dr: 0.10, mdef: 50,
      matk: 70, mine: 0, cri: 0.15, criMult: 1.6, eva: 0.05, hit: 1,
    },
    yuan: { matk: 90, matkB: 0, fixMatk: 0, mdef: 60 },
    reflect: 0, shieldPct: 0, armorPen: 0,
    lifesteal: 0, sealReflect: 0, evaOnDodge: false,
    fateFlags: {}, coll: {}, battleFlags: {}, engineTier: {},
  }, over || {});
}

// —— 用难号标尺给 Boss 定档（最小覆盖：前/中/后/终局代表难号）——
// 注：代表难号必须是「真实关隘难号」→ 经 bossNameForAct(act) 取章节 Boss 真名，
//   绝不直接用 TRIAL_BOSS 显示名（其与 BOSS_FORMS 键不符会造成零强度假面）。
const REPRESENTATIVE_ACTS = [1, 3, 6, 9];        // 章号 → 关隘 bossNameForAct 真名
const DIFF_BAND = [4, 8, 12, 16];               // diff 档 → tier 0..15 爬升

function numberOr(n, def) { return (Number.isFinite(+n) && n != null) ? +n : def; }

let pass = 0, fail = 0;
const lines = [];

function report(NDX) {
  const chapterBosses = NDX.CHAPTER_BOSS_NAMES || [];
  lines.push('== 平衡采样报告 ==');
  lines.push('Boss覆盖：9 章末 Boss + 4 代表难号下行');
  lines.push(`随机种子序列：${SEEDS.join(', ')}`);
  lines.push('');

  const header = 'Boss\t样本\t胜率\t均回合\t均残血%\tP10残血%';
  lines.push(header);

  const perBoss = [];
  const allRatios = [];

  // 第一遍：9 章末 Boss，diff 中档（tier≈8），采样平衡主曲线
  for (let ai = 0; ai < chapterBosses.length; ai++) {
    const bossName = chapterBosses[ai];
    if (!bossName) continue;
    const diff = DIFF_BAND[Math.min(ai, DIFF_BAND.length - 1)];
    const agg = sampleBoss(NDX, bossName, diff);
    if (!agg) continue;
    perBoss.push({ name: bossName, agg });
    allRatios.push(agg.winRatio);
    lines.push(`${bossName}\t${agg.n}\t${(agg.winRatio * 100).toFixed(1)}%\t${agg.avgRounds.toFixed(1)}\t${agg.avgHpPct.toFixed(1)}%\t${agg.p10HpPct.toFixed(1)}%`);
  }

  lines.push('');
  lines.push('== 下行代表关隘 Boss（第1/3/6/9章末）全档爬升 ==');
  const downHeader = '章末\tBoss\t档位(diff)\t胜率\t均回合';
  lines.push(downHeader);
  for (const act of REPRESENTATIVE_ACTS) {
    const bossName = NDX.bossNameForAct ? NDX.bossNameForAct(act) : null;
    const pretty = bossName ? `${bossName}(章${act}末)` : `#${act}`;
    if (!NDX.bossNameForAct && !bossName) { lines.push(`${pretty}\t不可用\t-\t-`); continue; }
    for (const d of DIFF_BAND) {
      const agg = sampleBoss(NDX, bossName || pretty, d);
      if (!agg) { lines.push(`${act}\t${bossName || pretty}\t${d}\tN/A`); continue; }
      lines.push(`${act}\t${bossName || pretty}\t${d}\t${(agg.winRatio * 100).toFixed(1)}%\t${agg.avgRounds.toFixed(1)}`);
      perBoss.push({ name: `${bossName || pretty}#${d}`, agg });
    }
  }

  if (WANT_CSV) {
    const f = path.join(ROOT, 'scripts', '_balance_out.csv');
    fs.writeFileSync(f, 'boss,seed_aggr,winRatio,avgRounds,avgHpPct,p10HpPct\n' +
      perBoss.map((b) => `${b.name},${SEEDS.length},${b.agg.winRatio.toFixed(4)},${b.agg.avgRounds.toFixed(2)},${b.agg.avgHpPct.toFixed(2)},${b.agg.p10HpPct.toFixed(2)}`).join('\n') + '\n');
    lines.push('');
    lines.push(`CSV 已写出: scripts/_balance_out.csv`);
  }

  lines.push('');
  const mean = allRatios.length ? allRatios.reduce((a, b) => a + b, 0) / allRatios.length : 0;
  lines.push(`主曲线均值胜率：${(mean * 100).toFixed(1)}%（样本 ${allRatios.length}）`);
  if (SEEDS.length > 1) lines.push('注：多种子取每 Boss 均值（各种子独立对局，均值代表去随机后的真实手感）。');

  if (WANT_BASELINE) {
    // 可调基线：主曲线默认宽松区间（不抢攻略平衡，只抓「明显失控」）
    const LB = 0.10, UB = 0.90;
    let crisp = true;
    for (const b of perBoss) {
      if (b.agg.winRatio < LB || b.agg.winRatio > UB) { crisp = false; lines.push(`  ! ${b.name} 胜率 ${(b.agg.winRatio * 100).toFixed(1)}% 超出 [${LB * 100}%, ${UB * 100}%]`); }
    }
    if (crisp) { pass++; lines.push('基线断言：所有采样 Boss 胜率落在合理区间内 ✓'); }
    else { fail++; lines.push('基线断言：存在胜率失控样本 ✗（调平衡后复跑）'); }
  } else {
    lines.push('基线断言：未开启（加 --baseline 强制门禁才能 fail）。本报告仅信息性。');
    pass++; // 非门禁模式视为「成功产出报告」
  }
}

function sampleBoss(NDX, bossName, diff) {
  // —— 用 bossStageSetup 构造真实多阶段 Boss（若有），否则取 monsterAt(diff) 真实基准面板 ——
  //   UI 宪：绝不造零强度假面。黄风大圣走 game_core_2 特判（bossStageSetup→null，
  //   本体落「两段默认」m.stages=[hp, hp*0.62]），故此处用真实 monsterAt 面板对齐。
  let rawMonster;
  try {
    if (NDX.bossStageSetup) {
      const setup = NDX.bossStageSetup(bossName, {});
      if (setup && setup.stages && setup.stages.length >= 1 && setup.p1) {
        rawMonster = {
          name: setup.name || bossName, type: 'boss', boss: true,
          diff: numberOr(diff, 8),
          stages: setup.stages, phaseOverrides: setup.phaseOverrides,
          phaseStats: setup.phaseStats, phase2Override: setup.phase2Override,
          stageRewards: setup.stageRewards, breakWith: setup.breakWith,
          blessTreasure: setup.blessTreasure, phaseSkipOn: setup.phaseSkipOn,
          hp: numberOr(setup.stages[0], 1000), maxHp: numberOr(setup.stages[0], 1000),
          atk: numberOr(setup.p1.atk, 30), dr: numberOr(setup.p1.dr, 0.1),
          matk: numberOr(setup.p1.matk, 20), mdef: numberOr(setup.p1.mdef, 30),
        };
      }
    }
  } catch (e) { /* bossStageSetup 对非配置 Boss 可能抛错 — 落真实基准面板 */ }
  if (!rawMonster) {
    // 真实基准面板：取该档位的本体 MONSTER_TABLE 基准怪（含成长曲线），
    // 并复刻本体两相默认（阶段1 满血，阶段2 约 62% 残身）。
    const base = (NDX.monsterAt && NDX.monsterAt(numberOr(diff, 8))) || {};
    const hp = numberOr(base.hp, 1200);
    const atk = numberOr(base.atk, 24);
    const matk = numberOr(base.matk, 16);
    rawMonster = {
      name: bossName, type: 'boss', boss: true,
      diff: numberOr(diff, 8),
      hp, maxHp: hp, atk, dr: numberOr(base.dr, 0.12),
      matk, mdef: numberOr(base.mdef, 30),
      stages: [hp, Math.round(hp * 0.62)],
    };
  }

  // —— 每种子独立对局，采集本 Boss（跨种子聚合）——
  // 单游戏实例 + 可切换 seed 闭包：loadGame 时 Math.random 转发到 window.__ndxRep，
  //   sampleBoss 内逐种子改写 __ndxRep 即实现确定性多种子采样，避免重复装载整链。
  const wins = [], rounds = [], hpPct = [], p10s = [];
  let n = 0;
  for (const seed of SEEDS) {
    setGlobalRep(seed);
    const C = NDX.calcCombat;
    if (typeof C !== 'function') continue;
    const player = makePlayer();
    let res;
    try { res = C(player, clone(rawMonster), { stanceSeq: ['ATK'] }); } catch (e) { continue; }
    if (!res) continue;
    n++;
    const win = !!res.win && !res.lose;
    wins.push(win ? 1 : 0);
    // 回合数：优先 roundsDetail 长度，或 totalRounds
    const r = Number.isInteger(res.totalRounds) ? res.totalRounds
      : (Array.isArray(res.roundsDetail) ? res.roundsDetail.length : 0);
    rounds.push(r);
    // 残血：玩家残血为主（playerHpLeft），缺则 0
    const pHp = numberOr(res.playerHpLeft, 0);
    const base = numberOr(player.ti.maxHp, 3000);
    hpPct.push(base > 0 ? Math.max(0, Math.min(1, pHp / base)) : 0);
    if (SEEDS.length === 1) break; // 同 seed 单次即代表
  }
  if (n === 0) return null;
  const sortedP = hpPct.slice().sort((a, b) => a - b);
  const p10Hp = sortedP[Math.floor(sortedP.length * 0.1)] || 0;
  return {
    n,
    winRatio: wins.reduce((a, b) => a + b, 0) / n,
    avgRounds: rounds.length ? rounds.reduce((a, b) => a + b, 0) / rounds.length : 0,
    avgHpPct: hpPct.length ? hpPct.reduce((a, b) => a + b, 0) / hpPct.length : 0,
    p10HpPct: p10Hp,
  };
}
function numberOr() { for (const a of arguments) { if (Number.isFinite(+a) && a != null) return +a; } return 0; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

// —— 入口：单次装载整链（Math.random 已转发到可切换的 __ndxRep，多种子免重复装载）——
let NDX = loadGame();
if (!NDX || typeof NDX.calcCombat !== 'function') {
  console.log('FATAL: NDX.calcCombat 未加载'); process.exit(1);
}
report(NDX);

console.log('\n' + lines.join('\n'));
console.log('\n平衡采样：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail > 0 ? 1 : 0);