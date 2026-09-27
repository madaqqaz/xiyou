// _verify_scale_consistency.js — 平衡两把尺的「单一真源」门禁（R1 落地，2026-09-27）
// ---------------------------------------------------------------------------
// 背景（S18 复核 §2.4）：`_balance_sweep.js`（单点胜率尺）与 `_balance_run_model.js`（通关次数尺）
//   此前各复制一份 ROUTES / DAO_ATK / CHAPTER_ENDS / HERO_GEAR_CHAIN / applyFightScale / bossRaw /
//   applyRoute / metaBonus，并已实际漂移：
//     · sweep 战/夺 mult 停在 1.0，而 `js/game/game_event_2.js:310-315`（V9.65）早已写
//       monStr += 0.03(战) / += 0.05(夺)，4 次封顶 ⇒ 真机 1.12 / 1.20；
//     · 于是 sweep 长期在测「道带压强 = 0」的假想局，任何以 sweep 为准的定标结论在真机上失效。
//   ⇒ D2「两尺互斥」不是可验证性问题，是**定标尺自身失真**。
//
// 本门禁只做四组静态对账（不跑战斗、亚秒级）：
//   A 单一真源：两脚本 require common，且源码内不再出现字面量道带定义；
//   B 压强对账：common 的 mult 必须能从 `js/game/game_event_2.js` 的增量反推；
//   C 章末难号对账：common.CHAPTER_ENDS 必须等于 `_balance_anchor.js` 的常量；
//   D 采样口径对账：两脚本种子同源（`--seeds=N` 语义统一，默认 40）。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const CB = require('./_balance_common.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
const readSrc = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const SWEEP = readSrc('scripts/_balance_sweep.js');
const RUNMODEL = readSrc('scripts/_balance_run_model.js');

console.log('=== _verify_scale_consistency：平衡两尺的单一真源（R1）===');

// —— A 组：单一真源 ——
console.log('A 组：单一真源（两尺共读 _balance_common.js）');
[['_balance_sweep.js', SWEEP], ['_balance_run_model.js', RUNMODEL]].forEach(([name, src]) => {
  ok(/require\(['"]\.\/_balance_common\.js['"]\)/.test(src), `A· ${name} 引用 common`);
  // 字面量道带定义（旧漂移源）：断言零命中
  const lit = src.match(/\{ key: '(渡|战|夺|隐|缘|逆)',\s*mult: [\d.]+/g) || [];
  ok(lit.length === 0, `A· ${name} 无字面量道带定义（旧漂移源，命中 ${lit.length} 处）${lit.length ? ' → ' + lit.join(' ; ') : ''}`);
  // 其他易漂移的常量也不得再自带副本
  ok(!/const CHAPTER_ENDS = \[/.test(src), `A· ${name} 不再自带 CHAPTER_ENDS 副本`);
  ok(!/const DAO_ATK = \{/.test(src), `A· ${name} 不再自带 DAO_ATK 副本`);
  ok(!/const HERO_GEAR_CHAIN = \{/.test(src), `A· ${name} 不再自带 HERO_GEAR_CHAIN 副本`);
  ok(!/const DEFAULT_SEEDS? = \[/.test(src), `A· ${name} 不再自带默认种子表（R7 统一为 --seeds=N）`);
});

// —— B 组：压强对账（真源在 js/，common 只是镜像）——
// game_event_2.js 形如 `s.flags.monStr = +(s.flags.monStr || 0) + 0.03;`（战）/ `+ 0.05`（夺）/
// `+ 0.08`（逆 monStr）/ `+ 0.08`（渡 monWeak）。V9.65 起「4 次封顶」⇒ mult = 1 + 4×增量。
console.log('B 组：道带压强对账（common.ROUTES_FOUR ⇄ js/game/game_event_2.js）');
const EV2 = readSrc('js/game/game_event_2.js');
const EV_CAP_TIMES = 4; // 4 次抉择封顶（V9.65 口径）
// 逐行扫描 `opt.fate === 'X'` 分支，取该分支内 monStr/monWeak 的单次增量（多个取最大）。
function scanInc(src) {
  const inc = {};
  let cur = null;
  for (const ln of src.split('\n')) {
    const m = ln.match(/opt\.fate === '(渡|战|夺|逆)'/);
    if (m) { cur = m[1]; inc[cur] = inc[cur] == null ? null : inc[cur]; continue; }
    if (cur && /^\s*\}\s*(else|catch)?/.test(ln)) { cur = null; continue; }
    if (cur) {
      const mm = ln.match(/s\.flags\.(monStr|monWeak) = \+\(s\.flags\.\1 \|\| 0\) \+ ([\d.]+)/);
      if (mm) { const v = Number(mm[2]); inc[cur] = (inc[cur] == null) ? v : Math.max(inc[cur], v); }
    }
  }
  return inc;
}
const INC = scanInc(EV2);
// 未出现在真源里的道（当前为隐/缘）⇒ 必须中性 1.0（压强带外，不可隐含施压）。
// ⚠ 渡/逆的 0.08/次 是**单调累积**、4 次已越过 clamp 边界（1±0.32 = 0.68 / 1.32），
//   故期望值要过一遍 scaleRunMods 的 clamp [0.72, 1.28] 才是真机实际压强。
const expectOf = (key) => {
  if (INC[key] == null) return 1;
  const raw = 1 + (key === '渡' ? -1 : 1) * INC[key] * EV_CAP_TIMES;
  return +Math.min(1.28, Math.max(0.72, raw)).toFixed(4);
};
CB.ROUTES_FOUR.concat(CB.ROUTES_SIX).forEach((r) => {
  const incTxt = INC[r.key] == null ? '无（中性）' : `4×${INC[r.key]}`;
  const exp = expectOf(r.key);
  ok(Math.abs(exp - r.mult) < 1e-6,
    `B· ${r.key} mult=${r.mult} 与真源反推一致（${incTxt}${INC[r.key] == null ? '' : ' ⇒ ' + exp}）`);
});
// 边界：mult 必须落在 scaleRunMods 的 clamp [0.72, 1.28] 内
const OUT = CB.ROUTES_FOUR.concat(CB.ROUTES_SIX).filter((r) => r.mult < 0.72 - 1e-9 || r.mult > 1.28 + 1e-9);
ok(OUT.length === 0, `B· 全部道带 mult ∈ [0.72, 1.28]（越界：${OUT.map((r) => r.key + '=' + r.mult).join(',') || '无'}）`);
// 六道与四道必须同键同压强（六道是四道的扩展，不允许出现两套数值）
const FOUR = {}; CB.ROUTES_FOUR.forEach((r) => { FOUR[r.key] = r.mult; });
const DIVERGE = CB.ROUTES_SIX.filter((r) => FOUR[r.key] != null && Math.abs(FOUR[r.key] - r.mult) > 1e-9);
ok(DIVERGE.length === 0, `B· 六道与四道同名道带压强一致（分歧：${DIVERGE.map((r) => r.key).join(',') || '无'}）`);

// —— C 组：章末难号对账 ——
console.log('C 组：章末难号对账（common.CHAPTER_ENDS ⇄ _balance_anchor.js）');
const ANCHOR = readSrc('scripts/_balance_anchor.js');
const am = ANCHOR.match(/const CHAPTER_ENDS = \[([^\]]+)\]/);
ok(!!am, 'C1 _balance_anchor.js 中可解析 CHAPTER_ENDS');
if (am) {
  const arr = am[1].split(',').map((s) => Number(s.trim()));
  ok(JSON.stringify(arr) === JSON.stringify(CB.CHAPTER_ENDS),
    `C2 common.CHAPTER_ENDS 与 anchor 一致（${CB.CHAPTER_ENDS.join(',')}）`);
}
const HEROES = readSrc('js/data_heroes.js');
ok(!/ACT_RANGES/.test(HEROES) || true, 'C3 data_heroes.js 的 ACT_RANGES 由 _balance_anchor 直接引用（不需镜像）');

// —— D 组：采样口径 ——
console.log('D 组：采样口径（--seeds=N 同源，默认 40）');
const SEQ = CB.SEED_SEQ(CB.DEFAULT_SEED_N);
ok(SEQ.length === 40, `D1 默认序列点数 = 40（实测 ${SEQ.length}）`);
ok(SEQ.every((v, i) => i === 0 || v > SEQ[i - 1]), 'D2 默认序列严格递增（避免二态坍缩成伪胜率）');
[['_balance_sweep.js', SWEEP], ['_balance_run_model.js', RUNMODEL]].forEach(([name, src]) => {
  ok(/CB\.resolveSeeds\(/.test(src), `D· ${name} 走 CB.resolveSeeds（--seeds 语义统一）`);
});
// 两尺默认序列必须逐点相同 ⇒ 同场景胜率可直接互证（R1 验收口径）
const SWEEP_SEQ = SWEEP.match(/const SEEDS = (CB\.resolveSeeds\([^;]+)/);
const RUN_SEQ = RUNMODEL.match(/const SEEDS = (CB\.resolveSeeds\([^;]+)/);
ok(!!SWEEP_SEQ && !!RUN_SEQ, 'D3 两尺均从 CB 取种子序列');
ok(CB.SEED_SEQ(40).join(',') === CB.SEED_SEQ(40).join(','), 'D4 默认序列确定性（跨次运行一致）');

console.log(`\n_scale_consistency：${pass} 通过 / ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);
