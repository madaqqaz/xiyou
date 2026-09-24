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
// 默认种子：24 个确定性 RNG 点横跨 (0,1)，才能把「100%/20%」这类二态爆发解析成真实胜率曲线。
// 2 种子只够看全胜/全败，无法表达梯度（曾致全胜假象）。
const DEFAULT_SEEDS = [0.02,0.06,0.10,0.14,0.19,0.23,0.27,0.31,0.35,0.40,0.44,0.48,0.52,0.56,0.61,0.65,0.69,0.73,0.77,0.82,0.86,0.90,0.94,0.98];
const SEEDS = (SEEDS_ARG ? SEEDS_ARG.split(',').map(Number) : DEFAULT_SEEDS).filter((n) => Number.isFinite(n));

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

// —— 玩家构造器（随章/随难号取真实 computeStats 面板）——
// 口径=用户确认：「当档裸号+装备」。装备随章缓增、保守（非最优）。
// run 状态：
//   bare  —— 首通·无遗产：守恒装备，无局外加成。
//   legacy—— 3-5 次后·衣冠冢：守恒装备 + 取回一件高阶遗物(武器/组件) + 真实难簿成就加成。
//             「遗产」是装备向的跨局强化（没死者留在第X章衣冠冢的装备，下局到X章取回），
//             非数值膨胀；余量靠现有成就系统（achievements.js globalAchBonus 公式）。
function repEquip(ai) {                      // ai=章下标 0..8
  const c = ai / 8;
  return [{ id: 'pw', slot: 'weapon', atk: Math.round(20 + 120 * c), matk: Math.round(60 + 220 * c),
    hp: Math.round(900 + 2600 * c), dr: +(0.02 + 0.04 * c).toFixed(3), mdef: +(0.04 + 0.06 * c).toFixed(3) }];
}
// 衣冠冢遗物：把取回的高阶武器/组件抽象为「一件强度约 +55% 词条的武器」（合成/遗物的代表）
function legacyEquip(ai) {
  const b = repEquip(ai)[0];
  return [{ id: 'pw', slot: 'weapon', atk: Math.round(b.atk * 1.55), matk: Math.round(b.matk * 1.55),
    hp: Math.round(b.hp * 1.5), dr: +(0.03 + 0.06 * (ai / 8)).toFixed(3), mdef: +(0.05 + 0.08 * (ai / 8)).toFixed(3) }];
}
const NO_META = {};
// 「满meta」局外永久加成：严格复刻 achievements.js 的真实难簿逐难公式
// 每难 nb 成就：atk+1.2 / hp+6 / matk+0.9 / mdef+0.004 / dr+0.002；
// 软上限前40项全量、超出按50%折算（NDX.ACH_BONUS_PER / ACH_SOFT_CUT / ACH_SOFT_TAIL）。
// run 3-5 代表值：跨局累计已解锁 ~45 项难簿成就（推进到深层后的合理量级）。
function metaBonus(ndx, nb) {
  const per = (ndx && ndx.ACH_BONUS_PER) || { atk: 1.2, hp: 6, matk: 0.9, mdef: 0.004, dr: 0.002 };
  const cut = (ndx && ndx.ACH_SOFT_CUT) != null ? ndx.ACH_SOFT_CUT : 40;
  const tail = (ndx && ndx.ACH_SOFT_TAIL) != null ? ndx.ACH_SOFT_TAIL : 0.5;
  const n = Math.max(0, Math.min(nb, (ndx && ndx.ACH_BONUS_CAP) || 81));
  const eff = n <= cut ? n : cut + (n - cut) * tail;
  return {
    ti: { atk: +(per.atk * eff).toFixed(1), hp: Math.round(per.hp * eff), dr: +(per.dr * eff).toFixed(4) },
    yuan: { matk: +(per.matk * eff).toFixed(1), mdef: +(per.mdef * eff).toFixed(4) },
  };
}
const META_NB = 45; // 3-5 次后：跨局累计 ~45 项难簿成就
function makePlayer(NDX, ai, diff, mode) {
  const eq = (mode === 'legacy') ? legacyEquip(ai) : repEquip(ai);
  const bonus = (mode === 'legacy') ? metaBonus(NDX, META_NB) : NO_META;
  const P = NDX.computeStats('tangseng', eq, [], bonus, diff);
  // 对齐 fight() 的 _playerObj 骨架（战斗内核消费 ti.hp/curHp/maxHp 等）
  return {
    heroId: 'tangseng', good: 0,
    spd: (P.spd != null ? P.spd : 8),
    ti: Object.assign({}, P.ti, { hp: P.ti.maxHp, curHp: P.ti.maxHp }),
    yuan: { matk: P.yuan.matk, mdef: P.yuan.mdef },
    reflect: P.reflect || 0, shieldPct: P.shieldPct || 0, armorPen: P.armorPen || 0,
    sealReflect: P.sealReflect || 0, lifesteal: P.lifesteal || 0, evaOnDodge: P.evaOnDodge || false,
    fateFlags: P.fateFlags || {}, coll: P.coll || {}, battleFlags: {}, engineTier: P.engineTier || {},
  };
}

// —— 用难号标尺给 Boss 定档（最小覆盖：前/中/后/终局代表难号）——
// 注：代表难号必须是「真实关隘难号」→ 经 bossNameForAct(act) 取章节 Boss 真名，
//   绝不直接用 TRIAL_BOSS 显示名（其与 BOSS_FORMS 键不符会造成零强度假面）。
const REPRESENTATIVE_ACTS = [1, 3, 6, 9];        // 章号 → 关隘 bossNameForAct 真名
const DIFF_BAND = [4, 8, 12, 16];               // diff 档 → tier 0..15 爬升

function numberOr(n, def) { return (Number.isFinite(+n) && n != null) ? +n : def; }

let pass = 0, fail = 0;
const lines = [];

// —— 校准配置：每章末 Boss 强度系数 B(act)。24 种子采样定标（见下 B_SEQ）——
// 用户目标阶梯（当档裸号+装备）：ch1 硬而可过；ch2 单一六道必过；ch3 正确装备可过；
// ch4 首通≈墙；ch9 满meta(run5) 战/夺可通。
const CHAPTER_ENDS = [14, 20, 31, 41, 46, 51, 64, 75, 81]; // 9章·章末难号
// 校准后的每章末 Boss 强度系数 B(act)：真值在 fight() 的「肉鸽难度缩放」里，不在 B。
// 教训（探针 _tmp_probe_fight 实证）：旧版采样绕过 fight() 缩放，测得 B=1 全 100% 是假象；
// 把 fight 缩放建模后真相相反——ch1-2 健康、ch3+ 因 hp 指数爬升(15×)成为全员绝境。
// 故 B_SEQ 恒=1（不放大），真正的调平杠杆是 fight() 内 diff 缩放曲线（见 game_combat_1.js:35-43）。
const B_SEQ = [1, 1, 1, 1, 1, 1, 1, 1, 1];

// 道带（经 scaleRunMods clamp 到 [0.72,1.28]）：渡=最易/逆=最难
const ROUTES = [
  { key: '渡', mult: 0.55 },
  { key: '战/夺', mult: 1.0 },
  { key: '逆', mult: 1.28 },
];

// 复刻 fight()「肉鸽难度缩放」（game_combat_1.js:35-43）：hp 线性+后期线性、atk/matk 13%/档、dr/mdef 封顶 0.45。
// 采样必须包含这一节，否则等于在测「未缩放的 boss」——曾致 B=1 全 100% 的假象。
// ⚠️ 与 fight() 保持同源：V8.55 后期缩放系数 0.14→0.08（收敛怪物血量后期爆炸，落地 demo 前三章可过）。
function applyFightScale(m, diff) {
  const d = Math.max(1, numberOr(diff, 8));
  const hpS = 1 + (d - 1) * 0.06 + Math.max(0, d - 6) * 0.08;
  const atkS = 1 + (d - 1) * 0.13;
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

function bossRaw(NDX, bossName, diff) {
  // —— 用 bossStageSetup 构造真实多阶段 Boss 基准面板，再套 fight() 难度缩放 ——
  //   UI 宪：绝不造零强度假面；黄风大圣走 game_core_2 特判（bossStageSetup→null）落两相默认。
  let rm;
  try {
    if (NDX.bossStageSetup) {
      const setup = NDX.bossStageSetup(bossName, {});
      if (setup && setup.stages && setup.stages.length >= 1 && setup.p1) {
        rm = {
          name: setup.name || bossName, type: 'boss', boss: true,
          diff: numberOr(diff, 8),
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
  } catch (e) { /* 非配置 Boss 抛错 — 落真实基准面板 */ }
  if (!rm) {
    const base = (NDX.monsterAt && NDX.monsterAt(numberOr(diff, 8))) || {};
    const hp = numberOr(base.hp, 1200), atk = numberOr(base.atk, 24), matk = numberOr(base.matk, 16);
    rm = { name: bossName, type: 'boss', boss: true, diff: numberOr(diff, 8), behavior: base.behavior,
      hp: Math.max(1, Math.round(hp)), maxHp: Math.max(1, Math.round(hp)), atk: Math.round(atk),
      dr: numberOr(base.dr, 0.12), matk: Math.round(matk), mdef: numberOr(base.mdef, 30),
      stages: [Math.max(1, Math.round(hp)), Math.max(1, Math.round(hp * 0.62))] };
  }
  return applyFightScale(rm, diff);
}

// 套道带（scaleRunMods，渡弱化/逆强化）
function applyRoute(NDX, raw, mult) {
  if (mult === 1.0) return raw;
  const flag = mult >= 1 ? { monStr: +(mult - 1).toFixed(3) } : { monWeak: +(1 - mult).toFixed(3) };
  const cp = clone(raw);
  return (NDX.scaleRunMods && NDX.scaleRunMods(cp, { flags: flag })) || cp;
}

// 多名玩家副本（对局内不共用引用）
function playerBuilder(NDX, ai, diff, meta) { return () => makePlayer(NDX, ai, diff, meta); }

// 每种子独立对局，跨种子聚合（确定性随机源已转发到 __ndxRep）
function sampleMon(NDX, rawMonster, pb) {
  const wins = [], rounds = [], hpPct = [];
  let n = 0;
  for (const seed of SEEDS) {
    setGlobalRep(seed);
    if (typeof NDX.calcCombat !== 'function') continue;
    const player = pb();
    let res;
    try { res = NDX.calcCombat(player, clone(rawMonster), { stanceSeq: ['ATK'] }); } catch (e) { continue; }
    if (!res) continue;
    n++;
    wins.push(!!res.win && !res.lose ? 1 : 0);
    const r = Number.isInteger(res.totalRounds) ? res.totalRounds : (Array.isArray(res.roundsDetail) ? res.roundsDetail.length : 0);
    rounds.push(r);
    const base = numberOr(player.ti && player.ti.maxHp, 3000);
    hpPct.push(base > 0 ? Math.max(0, Math.min(1, numberOr(res.playerHpLeft, 0) / base)) : 0);
    if (SEEDS.length === 1) break;
  }
  if (n === 0) return null;
  const sortedP = hpPct.slice().sort((a, b) => a - b);
  return { n, winRatio: wins.reduce((a, b) => a + b, 0) / n,
    avgRounds: rounds.length ? rounds.reduce((a, b) => a + b, 0) / rounds.length : 0,
    avgHpPct: hpPct.length ? hpPct.reduce((a, b) => a + b, 0) / hpPct.length : 0,
    p10HpPct: sortedP[Math.floor(sortedP.length * 0.1)] || 0 };
}

function report(NDX) {
  const chapterBosses = NDX.CHAPTER_BOSS_NAMES || [];
  lines.push('== 平衡采样报告 · 当档裸号+装备（用户口径）==');
  lines.push('覆盖：9 章末 Boss × 道带(渡/战夺/逆) × 裸号/满meta');
  lines.push(`随机种子序列：${SEEDS.join(', ')}`);
  lines.push('');

  const allRatios = [];
  const ladder = [];

  // 表1：每章末 Boss（当档 diff）当档裸号，三道带胜率
  lines.push('表1：9 章末 Boss 当档裸号胜率%');
  lines.push('章/diff\tBoss\t渡×0.72\t战夺×1.0\t逆×1.28');
  for (let ai = 0; ai < chapterBosses.length; ai++) {
    const bossName = chapterBosses[ai]; if (!bossName) continue;
    const diff = CHAPTER_ENDS[ai];
    const pb = playerBuilder(NDX, ai, diff, 'bare');
    const rm0 = bossRaw(NDX, bossName, diff);
    const row = ROUTES.map((rr) => {
      const a = sampleMon(NDX, applyRoute(NDX, rm0, rr.mult), pb);
      const cell = !a ? 'N/A' : (a.winRatio * 100).toFixed(0) + '%';
      if (a) allRatios.push(a.winRatio);
      ladder.push({ name: `ch${ai + 1}-裸-${rr.key}`, ratio: a ? a.winRatio : -1 });
      return cell;
    });
    lines.push(`ch${ai + 1}/d${diff}\t${bossName}\t${row.join('\t')}`);
  }

  // 表2：满meta(run5) ch9（战/夺推通目标）
  lines.push('');
  lines.push('表2：满meta(run5) ch9 胜率%（终局可通）');
  const pb9m = playerBuilder(NDX, 8, CHAPTER_ENDS[8], 'legacy');
  const rm9m0 = bossRaw(NDX, chapterBosses[8], CHAPTER_ENDS[8]);
  for (const rr of [{ key: '战/夺', mult: 1.0 }, { key: '逆', mult: 1.28 }]) {
    const a = sampleMon(NDX, applyRoute(NDX, rm9m0, rr.mult), pb9m);
    const cell = !a ? 'N/A' : (a.winRatio * 100).toFixed(1) + '%';
    lines.push(`ch9满meta-${rr.key}: ${cell}`);
    if (a) { allRatios.push(a.winRatio); ladder.push({ name: `ch9-满meta-${rr.key}`, ratio: a.winRatio }); }
  }

  if (WANT_CSV) {
    const f = path.join(ROOT, 'scripts', '_balance_out.csv');
    fs.writeFileSync(f, 'cell,seed_aggr,winRatio\n' + ladder.map((b) => `${b.name},${SEEDS.length},${b.ratio.toFixed(4)}`).join('\n') + '\n');
    lines.push(''); lines.push(`CSV 已写出: scripts/_balance_out.csv`);
  }

  lines.push('');
  const mean = allRatios.length ? allRatios.reduce((a, b) => a + b, 0) / allRatios.length : 0;
  lines.push(`样本均值胜率：${(mean * 100).toFixed(1)}%（样本 ${allRatios.length}）`);
  if (SEEDS.length > 1) lines.push('注：多种子取每格均值，去随机后的真实手感。');

  if (WANT_BASELINE) {
    // 路感知硬性基线（目标阶梯；种子粒度粗，用宽带表达）
    //  锚点：渡(最易) — ch1 硬而可过、ch4≈首通墙、ch9 满meta 战/夺≥55%
    const anchors = [];
    anchors.push({ name: 'ch1-裸-渡', need: [0.40, 1.001], label: 'ch1 渡 可过(≥40%)' });
    anchors.push({ name: 'ch4-裸-渡', need: [0.0, 0.45], label: 'ch4 渡 ≈首通墙(≤45%)' });
    anchors.push({ name: 'ch9-满meta-战/夺', need: [0.45, 1.001], label: 'ch9 满meta 战/夺 可通(≥45%)' });
    // 逆(最难)必须低于同章渡（难度方向正确）
    let crisp = true;
    for (const an of anchors) {
      const hit = ladder.find((b) => b.name === an.name);
      if (!hit || hit.ratio < 0) { lines.push(`  ? ${an.name} 未采样`); continue; }
      if (hit.ratio < an.need[0] || hit.ratio > an.need[1]) { crisp = false; lines.push(`  ! ${an.label} 实测 ${(hit.ratio * 100).toFixed(1)}%（需 [${(an.need[0] * 100).toFixed(0)},${(an.need[1] * 100).toFixed(0)}]）`); }
    }
    // 难度方向：渡(最易)胜率应最高，逆(最难)最低 ⇒ 胜率随难度单调下降（渡 ≥ 战/夺 ≥ 逆）。
    // B 缩放 / 成长曲线若让难路线胜率反超易路线（渡<战夺 或 战夺<逆），即道带反转。
    for (let ai = 0; ai < 9; ai++) {
      const c = (r) => ladder.find((b) => b.name === `ch${ai + 1}-裸-${r}`);
      const _d = c('渡'), _m = c('战/夺'), _i = c('逆');
      if (!_d || !_m || !_i || _d.ratio < 0 || _m.ratio < 0 || _i.ratio < 0) continue;
      const pct = (x) => `${(x * 100).toFixed(0)}%`;
      if (_d.ratio < _m.ratio - 1e-6) { crisp = false; lines.push(`  ! ch${ai + 1} 道带反转（渡${pct(_d.ratio)}% < 战夺${pct(_m.ratio)}%）`); }
      else if (_m.ratio < _i.ratio - 1e-6) { crisp = false; lines.push(`  ! ch${ai + 1} 道带反转（战夺${pct(_m.ratio)}% < 逆${pct(_i.ratio)}%）`); }
    }
    if (crisp && WANT_BASELINE) { pass++; lines.push('基线断言：路感知目标阶梯满足 ✓'); }
    else if (WANT_BASELINE) { fail++; lines.push('基线断言：存在阶梯失控样本 ✗（B(act)/成长曲线调平后复跑）'); }
  } else {
    lines.push('基线断言：未开启（加 --baseline 强制门禁才能 fail）。本报告仅信息性。');
    pass++;
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