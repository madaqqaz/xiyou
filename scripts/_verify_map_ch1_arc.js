// _verify_map_ch1_arc.js — 地图层·复合弧落位 · 难号承载完整性门禁（九章制坐标系）
// ---------------------------------------------------------------------------
// 【2026-09-13 契约变更】劫难融合后 layers ≠ 章内难数
//   用户授权「把无战斗／地点相近／纯事件劫难融合」后，第 1 章的难1-3（金蝉遭贬／出胎几杀／
//   满月抛江——三步纯叙事、各只做一次六道抉择）被并为一个复合节点「江流儿劫」，
//   ACT_RANGES[1].layers 由 13 → 11。layers 语义因此从「章内难数」变为「章内必经节点数」。
//   旧断言「行数 = 章内难数」随之失效，但它当初要防的是「diffOfLayer 断号」：难号 16-18 那类
//   既不在层映射里、也永远抽不到的情况，会让该难从地图上静默消失。
//   故本门禁把守卫升级为更强的正面断言：**章内每个难号都必须被某个节点承载**
//   （融合弧子难 ∪ 单难位 fixedTrial ∪ 缘事件位 fixedEventTrial ∪ 关隘 Boss），实测建图验证，
//   并要求 0 漏承载 / 0 越界。这比「层数相等」更贴近原意，且不再阻碍后续融合。
//
// 断言对象：
//   A) act1：江流儿劫弧(1,2,3)@第1行、黄风岭弧(10,11,12)@第10行；第2行 = 长安送行(songEvent)
//   B) act1：行数 = actLayers(1)=11；关隘 Boss 唯一、难13、落末行
//   C) act4：车迟弧(28-30) 与 通天河弧(32-35) 双弧同章共存且各自成节点
//   D) 全章：行数 = actLayers；关隘 Boss 落末行且难号 = actEnd(act)
//   E) 全章：难号承载完整性（每个 [start,end] 难号都被承载；无越界难号）—— 旧契约的正面替代
//   F) 反证：不得有融合弧落在末行（关隘 Boss 层不可被弧占用）
//   G) compact 章（紧凑分配）：层数 < 章内难数 · 无空层；全章：同一难号不被两处承载
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = {
  get length() { return Object.keys(_ls).length; },
  key(i) { const k = Object.keys(_ls); return k[i] != null ? k[i] : null; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(_ls, k) ? _ls[k] : null; },
  setItem(k, v) { _ls[k] = String(v); }, removeItem(k) { delete _ls[k]; },
  clear() { for (const k of Object.keys(_ls)) delete _ls[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !SKIP.has(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) { /* 与既有门禁同口径：可选文件失败不阻断 */ } });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

const allNodes = (layers) => {
  const out = [];
  for (let L = 1; L < layers.length; L++) {
    const row = layers[L];
    if (!row) continue;
    Object.keys(row).map(Number).forEach((c) => { if (row[c]) out.push({ L, c, n: row[c] }); });
  }
  return out;
};
const compoundsOf = (layers) => allNodes(layers).filter((x) => x.n.type === 'compound' && x.n.fusionDiffs);
const bossOf = (layers) => allNodes(layers).filter((x) => x.n.type === 'boss');
// 承载表：难号 → 承载它的节点描述（融合弧 / 单难位 / 缘事件位 / 关隘 Boss）
const carriedMap = (layers) => {
  const m = new Map();
  allNodes(layers).forEach(({ L, n }) => {
    const tag = 'L' + L + '·' + n.type;
    if (n.type === 'compound' && n.fusionDiffs) n.fusionDiffs.forEach((d) => m.set(d, tag + '(弧)'));
    else if (n.fixedTrial) m.set(n.fixedTrial, tag + '(单难)');
    else if (n.fixedEventTrial) m.set(n.fixedEventTrial, tag + '(缘事件)');
    else if (n.type === 'boss') m.set(n.diff, tag + '(Boss)');
  });
  return m;
};

// 建图带随机性（岔路列/节点类型），结构断言须多次采样才能证伪
const REPS = 12;

console.log('\n[A] act1 弧落位（江流儿劫@1 · 黄风岭@10 · 长安送行@2）');
{
  let missJ = 0, missH = 0, badL2 = 0, dup = 0, layerBad = 0;
  for (let i = 0; i < REPS; i++) {
    const layers = NDX._buildRegionSegment(1, 0);
    if (layers.length - 1 !== NDX.actLayers(1)) layerBad++;
    const cps = compoundsOf(layers);
    const jl = cps.filter((x) => (x.n.fusionDiffs || []).join(',') === '1,2,3');
    const hf = cps.filter((x) => (x.n.fusionDiffs || []).join(',') === '10,11,12');
    if (jl.length !== 1 || jl[0].L !== 1) missJ++;
    if (hf.length !== 1 || hf[0].L !== 10) missH++;
    if (cps.length !== 2) dup++;
    const n2 = layers[2] && layers[2][2];
    if (!(n2 && n2.type === 'event' && n2.songEvent)) badL2++;
  }
  ck('act1 行数 = actLayers(1)', layerBad === 0, layerBad + '/' + REPS + ' 次不符');
  ck('江流儿劫弧（难1,2,3）固定落在第 1 行', missJ === 0, missJ + '/' + REPS + ' 次缺失或错行');
  ck('黄风岭弧（难10,11,12）固定落在第 10 行', missH === 0, missH + '/' + REPS + ' 次缺失或错行');
  ck('act1 全图恰好 2 个复合弧（无重复弧）', dup === 0, dup + '/' + REPS + ' 次弧数不符');
  ck('第 2 行 = 长安送行（songEvent 赠宝教学，不可并入弧）', badL2 === 0, badL2 + '/' + REPS + ' 次不符');
}

console.log('\n[B] act1 关隘 Boss');
{
  let bossBad = 0;
  for (let i = 0; i < REPS; i++) {
    const layers = NDX._buildRegionSegment(1, 0);
    const bs = bossOf(layers);
    if (bs.length !== 1 || bs[0].n.diff !== 13 || bs[0].L !== NDX.actLayers(1)) bossBad++;
  }
  ck('act1 关隘 Boss 唯一、难13、落末行', bossBad === 0, bossBad + '/' + REPS + ' 次不符');
}

console.log('\n[C] act4 双弧共存（车迟 28-30 / 通天河 32-35）');
{
  let missA = 0, missB = 0, bad = 0;
  for (let i = 0; i < REPS; i++) {
    const layers = NDX._buildRegionSegment(4, NDX.actStart(4) - 1);
    const cps = compoundsOf(layers);
    if (!cps.some((x) => (x.n.fusionDiffs || []).join(',') === '28,29,30')) missA++;
    if (!cps.some((x) => (x.n.fusionDiffs || []).join(',') === '32,33,34,35')) missB++;
    const bs = bossOf(layers);
    if (bs.length !== 1 || bs[0].n.diff !== 36) bad++;
  }
  ck('act4 车迟弧（28-30）成节点', missA === 0, missA + '/' + REPS + ' 次缺失');
  ck('act4 通天河弧（32-35）成节点', missB === 0, missB + '/' + REPS + ' 次缺失');
  ck('act4 关隘 Boss 唯一且为难36（金鱼精）', bad === 0, bad + '/' + REPS + ' 次不符');
}

console.log('\n[D] 全章：行数 = actLayers · Boss 落末行 = actEnd');
{
  const bad = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    const layers = NDX._buildRegionSegment(act, NDX.actStart(act) - 1);
    const want = NDX.actLayers(act);
    if (layers.length - 1 !== want) bad.push('act' + act + ' 行' + (layers.length - 1) + '≠' + want);
    const bs = bossOf(layers);
    if (bs.length !== 1) bad.push('act' + act + ' Boss 数=' + bs.length);
    else {
      if (bs[0].n.diff !== NDX.actEnd(act)) bad.push('act' + act + ' Boss难' + bs[0].n.diff + '≠' + NDX.actEnd(act));
      if (bs[0].L !== want) bad.push('act' + act + ' Boss 行' + bs[0].L + '≠' + want);
    }
  }
  ck('9 章行数/关隘 Boss 与 ACT_RANGES 自洽', bad.length === 0, bad.slice(0, 5).join(' | '));
}

console.log('\n[E] 全章：难号承载完整性（旧「层数=难数」契约的正面替代）');
{
  const missAll = [], extraAll = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    const lo = NDX.actStart(act), hi = NDX.actEnd(act);
    const layers = NDX._buildRegionSegment(act, lo - 1);
    const m = carriedMap(layers);
    const miss = [];
    for (let d = lo; d <= hi; d++) if (!m.has(d)) miss.push(d);
    const extra = [...m.keys()].filter((d) => d < lo || d > hi);
    if (miss.length) missAll.push('act' + act + '缺[' + miss.join(',') + ']');
    if (extra.length) extraAll.push('act' + act + '越界[' + extra.join(',') + ']');
  }
  ck('每章 [start,end] 全部难号都被某个节点承载（0 漏承载）', missAll.length === 0, missAll.join(' | '));
  ck('承载表中不含本章之外的难号（0 越界）', extraAll.length === 0, extraAll.join(' | '));
  // 反证①：弧子难必须全部落在本章 [start,end) 内（防 09-01／09-13 两次坐标系重排的越界回归）。
  // 反证②：弧并集不得超过该章非 Boss 难总数（超出即含重复或含关隘 Boss，属坐标错误）。
  //   注：小章（如 act7「狮驼岭」4 难 → 3 非 Boss）允许全部非 Boss 难都由弧承载，这是合法的
  //   紧凑高潮章形态，不再是错误；「防过度排除致普通层无法承载」的守卫已由上面的
  //   「0 漏承载」正面断言承担（历史反例：用 compoundFor(act).diffs 当排除集时 ch8 漏承载
  //   难 65-71 共 7 难，见 _assignTrialDiffs 的 _fusedSet 注释）。
  const badOver = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    const fus = NDX.regionFusions(act) || [];
    const union = new Set(); fus.forEach((f) => (f.diffs || []).forEach((d) => union.add(d)));
    const lo = NDX.actStart(act), hi = NDX.actEnd(act);
    [...union].forEach((d) => { if (d < lo || d >= hi) badOver.push('act' + act + ' 弧含越界难' + d); });
    if (union.size > (hi - lo)) badOver.push('act' + act + ' 弧并集' + union.size + '>非Boss难' + (hi - lo));
  }
  ck('融合弧子难全在本章非 Boss 难区间内且不超出总数（防坐标越界）', badOver.length === 0, badOver.join(' | '));
}

console.log('\n[F] 反证：融合弧不得落在末行（关隘 Boss 层）');
{
  const bad = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    const LC = NDX.actLayers(act);
    const layers = NDX._buildRegionSegment(act, NDX.actStart(act) - 1);
    compoundsOf(layers).forEach((x) => { if (x.L === LC) bad.push('act' + act + ' 弧落末行'); });
  }
  ck('没有融合弧占用关隘 Boss 层', bad.length === 0, bad.slice(0, 4).join(' | '));
}

console.log('\n[G] 紧凑融合章（compact）：无空层 · 难号不重复承载');
{
  // compact 语义（PHASE 7）：章内难号由「游标」顺序填进每个可承载层（见 _assignTrialDiffs）。
  // 【2026-09-14 语义修订】原 G1 断言「层数必须严格小于章内难数」是 PHASE 7「compact = 压层」期的
  //   假设。2026-09-14 补 ch7 层数（4→9）后 compact 有了第二种用途：**补层纵深**——
  //   ch7 章内仅 3 个非 Boss 难号，靠 5 个无劫难位的探索层把体量撑到 9 层（详见
  //   COMPOUND_NODES[7] 注释）。两种用途下 compact 真正要保证的都是同一件事：
  //   **难号不越界**（不侵占邻章难号，也不会把 55-58 映射到 ch8 的 59+）。故 G1 改为越界检查。
  //   G2 同理拆成两条：真空层（零节点）永远非法；无劫难位的「探索层」合法，但分支度不得塌陷。
  const tightBad = [], emptyBad = [], thinBad = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    const c = NDX.compoundFor(act);
    if (!c || !c.compact) continue;
    const lo = NDX.actStart(act), hi = NDX.actEnd(act), LC = NDX.actLayers(act);
    for (let rep = 0; rep < REPS; rep++) {
      const layers = NDX._buildRegionSegment(act, lo - 1);
      for (let L = 1; L <= LC; L++) {
        const row = layers[L] || {};
        const ns = Object.keys(row).map((k) => row[k]).filter(Boolean);
        // G1：难号归属检查（只查真正承载难号的节点：融合弧 / 劫难位）
        ns.forEach((n) => {
          const ds = [];
          if (n.type === 'compound' && Array.isArray(n.fusionDiffs)) ds.push(...n.fusionDiffs);
          if (typeof n.fixedTrial === 'number') ds.push(n.fixedTrial);
          else if (n.type === 'trial' && typeof n.diff === 'number') ds.push(n.diff);
          ds.forEach((d) => {
            if (d < lo || d > hi) tightBad.push('act' + act + ' L' + L + ' 难号' + d + ' 越界[' + lo + ',' + hi + ']');
          });
        });
        const hasArc = ns.some((n) => n.type === 'compound');
        const hasBoss = ns.some((n) => n.type === 'boss');
        const hasCarry = ns.some((n) => n.type === 'trial' || n.fixedEventTrial);
        if (!ns.length) emptyBad.push('act' + act + ' L' + L);                       // 真空层：零节点
        else if (!hasArc && !hasBoss && !hasCarry && ns.length < 3) {
          thinBad.push('act' + act + ' L' + L + ' 仅 ' + ns.length + ' 格');          // 探索层分支度塌陷
        }
      }
    }
  }
  ck('compact 章承载的难号不越界（不侵占邻章，压层/补层两种用途同守卫）',
    tightBad.length === 0, [...new Set(tightBad)].slice(0, 6).join(' | '));
  ck('compact 章无「零节点」真空层（' + REPS + ' 次采样）',
    emptyBad.length === 0, [...new Set(emptyBad)].slice(0, 6).join(' | '));
  ck('compact 章探索层（无弧/无劫难/非 Boss）分支度不塌：≥3 格（' + REPS + ' 次采样）',
    thinBad.length === 0, [...new Set(thinBad)].slice(0, 6).join(' | '));

  // G3 同一难号不得被两处承载（弧与单难位重复）—— 全章守卫，不限 compact。
  //   历史反例：PHASE 5 引入 _fusedSet 之前，act1 的难 11/12 既被黄风岭弧承载、又被 L11/L12 各绑一次。
  const dupBad = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    const lo = NDX.actStart(act), hi = NDX.actEnd(act);
    for (let rep = 0; rep < 4; rep++) {
      const cnt = {};
      allNodes(NDX._buildRegionSegment(act, lo - 1)).forEach(({ n }) => {
        if (n.type === 'compound' && n.fusionDiffs) n.fusionDiffs.forEach((d) => { cnt[d] = (cnt[d] || 0) + 1; });
        else if (n.type === 'boss') cnt[hi] = (cnt[hi] || 0) + 1;
        else if (n.fixedTrial) cnt[n.fixedTrial] = (cnt[n.fixedTrial] || 0) + 1;
        else if (n.fixedEventTrial) cnt[n.fixedEventTrial] = (cnt[n.fixedEventTrial] || 0) + 1;
      });
      Object.keys(cnt).forEach((d) => { if (cnt[d] > 1) dupBad.push('act' + act + ' 难' + d + '×' + cnt[d]); });
    }
  }
  ck('同一难号不被两处承载（弧与单难位不重复，4 次采样/章）',
    dupBad.length === 0, [...new Set(dupBad)].slice(0, 6).join(' | '));
}

console.log('\n[H] 节点设计契约（PHASE 8 · 参照杀戮尖塔）：宝窟保底 · 开局禁则 · 列宽上限');
{
  // H1 每章宝窟 ≥2（杀戮尖塔「中点全宝箱行 F9」的本土化，_enforceMapRules 规则 4）。
  //    历史反例：V9.8 宝窟回归后仅在后段岔路池低权重投放，实测全 9 章 209 格仅 2 个（1%），
  //    玩家常整章零法宝收入。
  const treBad = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    for (let rep = 0; rep < 4; rep++) {
      const lo = NDX.actStart(act);
      const layers = NDX._buildRegionSegment(act, lo - 1);
      let tre = 0;
      allNodes(layers).forEach(({ n }) => { if (n.type === 'treasure' || n.type === 'treasure_lux') tre++; });
      if (tre < 2) treBad.push('act' + act + ' 宝窟' + tre + '（rep' + rep + '）');
    }
  }
  ck('每章宝窟（含秘藏）保底 ≥2（4 次采样/章）', treBad.length === 0, [...new Set(treBad)].slice(0, 5).join(' | '));

  // H2 开局禁则：L≤2 不得出现精英/土地庙（杀戮尖塔「前 5 行禁精英/营火」的层制弱化版）。
  //    开局两层内出精英=劝退；出土地庙=节奏塌陷（尚未建立战斗需求就先躺营火）。
  const earlyBad = [];
  for (let act = 2; act <= NDX.TOTAL_ACTS; act++) {   // ch1 前层为固定序章教学，不适用
    for (let rep = 0; rep < 4; rep++) {
      const lo = NDX.actStart(act);
      const layers = NDX._buildRegionSegment(act, lo - 1);
      for (let L = 1; L <= 2; L++) {
        Object.keys(layers[L] || {}).forEach((c) => {
          const n = layers[L][c];
          if (n && (n.type === 'elite' || n.type === 'rest')) earlyBad.push('act' + act + ' L' + L + ' ' + n.type);
        });
      }
    }
  }
  ck('L≤2 无精英、无土地庙（开局禁则，4 次采样/章）', earlyBad.length === 0, [...new Set(earlyBad)].slice(0, 5).join(' | '));

  // H3 列宽上限：非 Boss 层格子数 ≤ MAX_COL（PHASE 8：4→5，横向选择深度对齐杀戮尖塔 4-6）。
  const colBad = [];
  for (let act = 1; act <= NDX.TOTAL_ACTS; act++) {
    const lo = NDX.actStart(act), LC = NDX.actLayers(act);
    const layers = NDX._buildRegionSegment(act, lo - 1);
    for (let L = 1; L <= LC; L++) {
      const cols = Object.keys(layers[L] || {}).length;
      if (cols > NDX.MAX_COL) colBad.push('act' + act + ' L' + L + ' ' + cols + '格>' + NDX.MAX_COL);
    }
  }
  ck('每层格子数不超过 MAX_COL（' + NDX.MAX_COL + '）', colBad.length === 0, colBad.slice(0, 5).join(' | '));

  // H4 静态文本：动态尾池含 trial×2 + elite + rest（S5：延伸层从杂鱼汤变有规划价值的支线）。
  const tailSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');
  ck('动态尾池含 trial×2 + elite + rest（S5 延伸层升级）',
    /'mob',\s*'event',\s*'trial',\s*'trial',\s*'elite',\s*'rest'/.test(tailSrc));
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
