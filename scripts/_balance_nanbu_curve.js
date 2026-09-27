// _balance_nanbu_curve.js — 「难簿成就是怎么随周目累积的」真值曲线（只读，不进门禁）
// ---------------------------------------------------------------------------
// 背景：_balance_run_model.js 里 nb = BASE + SLOPE×(run-1) 是**拍脑袋的线性假设**。
//   真实机制：checkAch 用「本局 s.fate（道计数）+ 本局 trialsPassed」逐局独立判定，
//   解出的 nb_ 集合并入跨周目历史（并集）⇒ 累积曲线是**凹的**：早期快、很快饱和。
//   本脚本用真实 NANBU_ALL.req + 真实 reqMet 还原这条曲线，用来校正模型的 nbs 假设。
//
// 用法：
//   node scripts/_balance_nanbu_curve.js
//   node scripts/_balance_nanbu_curve.js --depth=31      → 只看到第 31 难（demo 口径）
//   node scripts/_balance_nanbu_curve.js --dao=渡        → 只看某主道
//   node scripts/_balance_nanbu_curve.js --rate=0.6      → 每难发生抉择的概率
//   node scripts/_balance_nanbu_curve.js --pur=0.8       → 主道占比
//
// ⚠ 只读：不写任何游戏文件。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

const ARGS = process.argv.slice(2);
const strArg = (n, d) => { const a = ARGS.find((x) => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : d; };
const DEPTHS = strArg('depth', '31,81').split(',').map(Number).filter((n) => n > 0);
const DAOS = strArg('dao', '渡,战,夺,逆').split(',');
const RATE = Number(strArg('rate', 1));    // 每难平均抉择次数
const PURITY = Number(strArg('pur', 0.8)); // 主道占抉择数的比例

const _noop = () => {};
function loadGame() {
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math,
    navigator: { userAgent: 'node' },
    localStorage: { getItem: () => null, setItem: _noop, removeItem: _noop },
    document: {
      getElementById: () => null, createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
      querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
  };
  sb.window = sb; sb.global = sb; sb.self = sb;
  const ctx = vm.createContext(sb);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].forEach((m) => {
    const fp = path.join(ROOT, m[1].split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: m[1] }); } catch (e) { /* noop */ }
  });
  return sb.NDX;
}
const NDX = loadGame();

// —— 一周目模型 ——
// 走到第 Depth 难（trialsPassed 覆盖 1..Depth），抉择总数 = Depth×RATE，主道占 PURITY。
function runTrialState(depth, mainDao, cycle) {
  const total = Math.max(1, Math.round(depth * RATE));
  const main = Math.max(1, Math.round(total * PURITY));
  const rest = total - main;
  const others = ['渡', '战', '夺', '逆', '隐', '缘'].filter((d) => d !== mainDao);
  const fate = {};
  fate[mainDao] = main;
  // 剩余抉择分散到其余五道（人为 diverse 一点点，模拟玩家不会 100% 纯种）
  others.forEach((d, i) => { fate[d] = Math.floor(rest / others.length) + (i < rest % others.length ? 1 : 0); });
  const trialsPassed = [];
  for (let d = 1; d <= depth; d++) trialsPassed.push({ diff: d });
  return { fate, trialsPassed, cycle };
}
function unlockThisRun(st, hist) {
  const got = [];
  (NDX.NANBU_ALL || []).forEach((a) => {
    if (hist.indexOf(a.id) >= 0) return;               // 已解锁
    const r = NDX.reqMet(a.req, st.fate, st.cycle, { trialsPassed: st.trialsPassed });
    if (r.ok) got.push(a.id);
  });
  return got;
}
// eff 换算（复刻 globalAchBonus）
function effOf(nb) {
  const cut = NDX.ACH_SOFT_CUT, tail = NDX.ACH_SOFT_TAIL;
  const n = Math.min(nb, NDX.ACH_BONUS_CAP);
  return n <= cut ? n : cut + (n - cut) * tail;
}
// 若第 N 周目主道轮换（模拟玩家换路线刷成就）：cycle r 用第 ((r-1) % DAOS.length) 条道
const lines = [];
const P = (s) => lines.push(s);

P('== 难簿 nb 累积真值曲线（真实 reqMet 判定 · 跨周目并集）==');
P(`NANBU_ALL=${(NDX.NANBU_ALL || []).length} ｜ ACH_BONUS_CAP=${NDX.ACH_BONUS_CAP} ｜ 软削 cut=${NDX.ACH_SOFT_CUT} tail=${NDX.ACH_SOFT_TAIL} ｜ per=${JSON.stringify(NDX.ACH_BONUS_PER)}`);
P(`周目模型：走到第 N 难，抉择数=N×${RATE}，主道占 ${Math.round(PURITY * 100)}%，轮换主道=${DAOS.join('/')}`);
P('');
for (const depth of DEPTHS) {
  P(`—— 每周目深度：走到第 ${depth} 难 ——`);
  P('主道\t' + [1, 2, 3, 5, 8, 10, 15].map((r) => ('r' + r).padEnd(6)).join('') + '饱和点(周目/总数)');
  for (const dao of DAOS) {
    const hist = [];
    const nbAt = {};
    let satRun = null;
    for (let run = 1; run <= 15; run++) {
      const st = runTrialState(depth, dao, run);
      const got = unlockThisRun(st, hist);
      got.forEach((id) => hist.push(id));
      nbAt[run] = hist.filter((id) => id.indexOf('nb_') === 0).length;
      if (satRun == null && got.length === 0) satRun = run - 1;
    }
    const cells = [1, 2, 3, 5, 8, 10, 15].map((r) => ((satRun && r > satRun ? '↑' : '') + nbAt[r]).padEnd(6));
    P(`${dao}\t` + cells.join('') + `${satRun || '>15'} / ${nbAt[15]}`);
  }
  P('  ↑ = 该周目起已无新增（饱和）');
  P('');
}
// 与模型假设的对照
P('== 模型假设 nbs 的偏差 ==');
P('周目\trun_model 旧(nb=6+7(r-1))\t真实主道轮换(depth81)\teff 旧\teff 真');
{
  const hist = [];
  const real = {};
  for (let run = 1; run <= 15; run++) {
    const dao = DAOS[(run - 1) % DAOS.length];
    const st = runTrialState(81, dao, run);
    unlockThisRun(st, hist).forEach((id) => hist.push(id));
    real[run] = hist.filter((id) => id.indexOf('nb_') === 0).length;
  }
  [1, 2, 3, 5, 8, 10, 15].forEach((run) => {
    const model = Math.min(81, Math.round(6 + (run - 1) * 7));
    P(`${run}\t${model}\t\t\t\t${real[run]}\t\t\t${effOf(model).toFixed(1)}\t${effOf(real[run]).toFixed(1)}`);
  });
}
const out = lines.join('\n');
console.log(out);
try { fs.writeFileSync(path.join(__dirname, '_balance_nanbu_out.txt'), out, 'utf8'); } catch (e) { /* noop */ }
