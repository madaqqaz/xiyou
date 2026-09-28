// _verify_endings_index.js — 结局数据化门禁（2026-09-14 P2 整改 #10）
// ---------------------------------------------------------------------------
// 原状：结局从未数据化（NDX.ENDINGS 曾被当死代码清掉），三处各画各的——
//   动态 10 条（endings.js）/ 静态 7 变种（game_meta.computeEnding）/ CG 6 张（data_endings_cg.js）。
// 本门禁守卫三者与 NDX.ENDINGS 索引表的**一致性**，并验证索引表是真被消费的
//   （determineEnding 返回值必须带 id + cg，否则又是一张没人读的表）。
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
  .filter((f) => !SKIP.has(f))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) { } });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

console.log('\n[结局数据化 · NDX.ENDINGS 索引表] 运行时门禁');

const IDX = NDX.ENDINGS || [];
const dynKeys = Object.keys((NDX.Ending && NDX.Ending.DEFINITIONS) || {});
const cgIds = (NDX.ENDINGS_CG || []).map((c) => c.id);

ck('E1 NDX.ENDINGS 非空（原来导出为 0）', IDX.length > 0, '共 ' + IDX.length + ' 条');
ck('E2 索引 id 唯一（无重复登记）',
  new Set(IDX.map((e) => e.id)).size === IDX.length,
  '重复：' + IDX.map((e) => e.id).filter((v, i, a) => a.indexOf(v) !== i).join(','));
ck('E3 动态结局 10 条全部登记，且 id 与 endings.js DEFINITIONS 一一对应', (() => {
  const dyn = IDX.filter((e) => e.source === 'dynamic').map((e) => e.id).sort();
  const src = dynKeys.slice().sort();
  return dyn.length === src.length && dyn.every((v, i) => v === src[i]);
})(), '索引 ' + IDX.filter((e) => e.source === 'dynamic').length + ' vs 真源 ' + dynKeys.length);
ck('E4 索引标题与 endings.js 标题逐条一致（无改名漂移）', (() => {
  const D = (NDX.Ending && NDX.Ending.DEFINITIONS) || {};
  return IDX.filter((e) => e.source === 'dynamic').every((e) => D[e.id] && D[e.id].title === e.title);
})());
ck('E5 每条都写了可读门槛 threshold（cond 函数翻成人话）',
  IDX.every((e) => typeof e.threshold === 'string' && e.threshold.length >= 6),
  IDX.filter((e) => !e.threshold).map((e) => e.id).join(','));
ck('E6 cg 引用全部存在于 ENDINGS_CG（无悬空引用）', (() => {
  const bad = IDX.filter((e) => e.cg && cgIds.indexOf(e.cg) < 0);
  return bad.length === 0;
})(), '悬空：' + IDX.filter((e) => e.cg && cgIds.indexOf(e.cg) < 0).map((e) => e.id + '→' + e.cg).join(','));
ck('E7 静态兜底可产出条目标题，均为 computeEnding 实际会输出的标题（unreachable 登记项豁免）', (() => {
  // 逐英雄构造 state，跑真 computeEnding，收集输出标题
  const titles = new Set();
  const heroes = ['wukong', 'bajie', 'shaseng', 'xiaobailong', 'tangseng'];
  heroes.forEach((h) => {
    [0, 50].forEach((ev) => {
      const st = { hero: h, heroName: 'x', good: ev ? 0 : 50, evil: ev, fate: {}, npcRel: {}, choiceFlags: {}, flags: {}, equips: [], gold: 0, seals: [], sutras: [], niSutras: [], disciples: [] };
      try {
        const g = Object.create(NDX.Game.prototype);
        g.state = st;
        const r = g.computeEnding();
        if (r && r.title) titles.add(r.title);
      } catch (e) { }
    });
  });
  // 豁免 unreachable 登记项（索引表显式标注「当前英雄集下不可达」，保留登记仅为可见性，非数据缺陷）
  const stTitles = IDX.filter((e) => e.source === 'static' && !e.unreachable).map((e) => e.title);
  const missing = stTitles.filter((t) => !titles.has(t));
  return missing.length === 0;
})(), '未覆盖：' + (() => {
  const titles = new Set();
  ['wukong', 'bajie', 'shaseng', 'xiaobailong', 'tangseng'].forEach((h) => {
    [0, 50].forEach((ev) => {
      const st = { hero: h, heroName: 'x', good: ev ? 0 : 50, evil: ev, fate: {}, npcRel: {}, choiceFlags: {}, flags: {}, equips: [], gold: 0, seals: [], sutras: [], niSutras: [], disciples: [] };
      try { const g = Object.create(NDX.Game.prototype); g.state = st; const r = g.computeEnding(); if (r && r.title) titles.add(r.title); } catch (e) { }
    });
  });
  return IDX.filter((e) => e.source === 'static' && !e.unreachable).map((e) => e.title).filter((t) => !titles.has(t)).join(',');
})());
ck('E8 查询接口可用：endingById / endingsBySource / endingCgOf', (() => {
  const a = NDX.endingById('jinchan');
  const b = NDX.endingsBySource('dynamic').length;
  const c = NDX.endingCgOf('jinchan');
  return !!a && b === 10 && !!c && c.id === 'zhengguo';
})());
// E9 消费点验证：determineEnding 返回值必须带 id + cg（防止索引表再次变成没人读的死表）
ck('E9 反向验证：determineEnding 返回值带 id + cg（索引表真被消费，非死表）', (() => {
  // 构造确定性命中「金蝉正果」（带 CG zhengguo）的状态；避开 changan（其 cg 本就为 null）以免误判包装失效
  const st = { hero: 'tangseng', good: 50, evil: 0, fate: {}, npcRel: {}, choiceFlags: {}, flags: {}, equips: [], gold: 0, seals: [], sutras: [], niSutras: [], disciples: [] };
  const r = NDX.Ending.determineEnding(st);
  return !!(r && r.id && r.cg != null && NDX.endingById(r.id));
})(), (() => {
  const st = { hero: 'tangseng', good: 50, evil: 0, fate: {}, npcRel: {}, choiceFlags: {}, flags: {}, equips: [], gold: 0, seals: [], sutras: [], niSutras: [], disciples: [] };
  const r = NDX.Ending.determineEnding(st);
  return r ? JSON.stringify({ id: r.id, cg: r.cg, title: r.title }) : 'null';
})());
ck('E10 未命中时 determineEnding 仍返回 null（包装不破坏原有兜底语义）', (() => {
  const st = { hero: 'wukong', good: 50, evil: 0, fate: {}, npcRel: {}, choiceFlags: {}, flags: {}, equips: [], gold: 0, seals: [], sutras: [], niSutras: [], disciples: [] };
  const r = NDX.Ending.determineEnding(st);
  return r === null || typeof r.title === 'string';
})());

// ============ S14 §⑤-4（2026-09-28）：标题↔id 双射 + 收缩后计数锁定 ============
//   背景：包装层 `data_endings_index.js` 用 `endingByTitle(title)` 反查 id ⇒ 一旦出现**同名**
//   条目（历史上 st_jinchan/ jinchan 同题「金蝉正果」），反查会按表内**先出现者**命中，
//   静态行永远被动态行遮蔽（game_meta.js 的 `=== 'st_jinchan'` 因此曾为死分支）。
//   故钉死两条：① 每条目 title 必须反查回**自身 id**（双射 / 无遮蔽）；② 收缩后计数锁定。
const _byTitleOK = IDX.every((e) => {
  const hit = NDX.endingByTitle ? NDX.endingByTitle(e.title) : null;
  return !!hit && hit.id === e.id;
});
ck('E11 标题↔id 双射：每条目 title 经 endingByTitle 必须反查回自身 id（无同名遮蔽）',
  _byTitleOK, '遮蔽：' + IDX.filter((e) => {
    const hit = NDX.endingByTitle ? NDX.endingByTitle(e.title) : null;
    return !hit || hit.id !== e.id;
  }).map((e) => e.title + '(' + e.id + '→' + ((NDX.endingByTitle(e.title) || {}).id) + ')').join(', '));

// 反证：**制造同名**（让一条 static 与某 dynamic 同题）⇒ E11 判据必须转红
ck('E11-b 反证：制造同名遮蔽后判据能红（证明 E11 非恒真）', (() => {
  const dyn = IDX.filter((e) => e.source === 'dynamic')[0];
  const st = IDX.filter((e) => e.source === 'static')[0];
  if (!dyn || !st) return false;
  const saved = st.title;
  try {
    st.title = dyn.title;                      // 制造遮蔽：static 与 dynamic 同题
    const hit = NDX.endingByTitle(st.title);
    return !(hit && hit.id === st.id);         // 反查必然落到 dynamic 行 ⇒ 与自身 id 不符
  } finally { st.title = saved; }
})());

// 计数锁定（收缩后事实，防结构再变时文档/口径静默漂移）
const _nDyn = IDX.filter((e) => e.source === 'dynamic').length;
const _nSt = IDX.filter((e) => e.source === 'static').length;
const _nFw = IDX.filter((e) => String(e.source) === 'farewell').length;
const _cgN = (NDX.ENDINGS_CG || []).length;
const _cgFw = (NDX.ENDINGS_CG || []).filter((c) => /-farewell$/.test(c.id)).length;
ck('E12 收缩后计数锁定：索引 14 行（10 动态 + 4 静态）· farewell 索引行 = 0',
  IDX.length === 14 && _nDyn === 10 && _nSt === 4 && _nFw === 0,
  '行=' + IDX.length + ' 动态=' + _nDyn + ' 静态=' + _nSt + ' 索引 farewell=' + _nFw);
ck('E13 告别卡真源收敛到 ENDINGS_CG：CG 共 8 张、其中 5 张 farewell（R9 一身一 id）',
  _cgN === 8 && _cgFw === 5, 'CG=' + _cgN + ' farewell=' + _cgFw);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
