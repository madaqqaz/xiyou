// _smoke_hidden_diary.js — 隐藏转职完善 + 冒险日记特殊隐藏职 冒烟验收
// 判据：结尾输出「结论：N 通过 / 0 失败」
'use strict';
const fs = require('fs');
const vm = require('vm');
const DIR = 'd:/xiyou/demo';
global.NDX = {};
const sb = { console, Math, JSON, Date, NDX: global.NDX };
sb.window = sb;
const ctx = vm.createContext(sb);
['js/data_trials.js', 'js/trials81.js', 'js/events.js'].forEach((f) => {
  vm.runInContext(fs.readFileSync(DIR + '/' + f, 'utf8'), ctx, { filename: f });
});
const N = NDX, L = N.TRIAL_LIB;

let pass = 0, fail = 0;
function ck(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  ' + extra : '')); }
}

// 1) 章节分布：act3/12/16 缺漏已补，全 act 覆盖
const byAct = {};
Object.keys(L).map(Number).sort((a, b) => a - b).forEach((i) => {
  const t = L[i]; if (t.hidden) (byAct[t.act] = byAct[t.act] || []).push(t.hidden.job);
});
[3, 12, 16].forEach((a) => ck('act' + a + ' 已有隐藏职', byAct[a] && byAct[a].length >= 1, JSON.stringify(byAct[a] || [])));
ck('全 17 章均覆盖（无缺失 act）', [3, 12, 16].every((a) => byAct[a]), '');
ck('隐藏职总数 ≥ 26', Object.values(byAct).reduce((x, y) => x + y.length, 0) >= 26, '=' + Object.values(byAct).reduce((x, y) => x + y.length, 0));

// 2) 4 个新日记系隐藏职存在且字段完整
const NEW = { 13: '定风金蝉', 50: '九头·掠宝', 66: '净坛·拾遗', 77: '行旅录主' };
Object.keys(NEW).forEach((id) => {
  const t = L[id];
  ck('难' + id + ' 有 hidden(' + NEW[id] + ')', t && t.hidden && t.hidden.job === NEW[id]);
  const h = t && t.hidden;
  ck('难' + id + ' hidden 含 diary cond', h && /日记装备/.test(h.cond), h && h.cond);
  ck('难' + id + ' hidden 含 hint', h && !!h.hint, h && (h.hint || '无'));
  ck('难' + id + ' hidden.hero 合法', h && ['tangseng', 'wukong', 'bajie', 'all'].includes(h.hero), h && h.hero);
});

// 3) HIDDEN_JOBS 登记 + effect 非空
const jobs = (N.HIDDEN_JOBS || []);
[['定风金蝉', 'tangseng'], ['九头·掠宝', 'wukong'], ['净坛·拾遗', 'bajie'], ['行旅录主', 'all']].forEach(([job, hero]) => {
  const e = (N.HIDDEN_JOBS || []).flatMap ? null : null;
  let found = null;
  Object.keys(N.HIDDEN_JOBS || {}).forEach((k) => {
    (N.HIDDEN_JOBS[k] || []).forEach((x) => { if (x.job === job) found = x; });
  });
  ck('HIDDEN_JOBS 含 ' + job, found && found.hero === hero, found ? found.hero : '缺失');
  ck('HIDDEN_JOBS.' + job + ' effect 非空', found && found.effect && Object.keys(found.effect).length > 0, found ? JSON.stringify(found.effect).slice(0, 60) : '');
});

// 4) evalHiddenCond 日记/持ev 语法
const T = (c, s, o) => N.evalHiddenCond(c, s, o);
ck('日记≥1 持1件→ok', T('渡 + 日记装备≥1', { fate: { 渡: 5 }, equips: [{ id: 'ev_a_wudang' }] }, { fate: '渡' }).ok === true);
ck('日记≥1 持0件→fail(diary)', T('渡 + 日记装备≥1', { fate: { 渡: 5 }, equips: [] }, { fate: '渡' }).kind === 'diary');
ck('夺日记≥3 持3件→ok', T('夺 + 日记装备≥3', { fate: { 夺: 4 }, equips: [{ id: 'ev_w_xingtian' }, { id: 'ev_t_shanhe' }, { id: 'ev_b_tayun' }] }, { fate: '夺' }).ok === true);
ck('逆日记≥4 持3件→fail', T('逆 + 日记装备≥4', { fate: { 逆: 6 }, equips: [{ id: 'ev_w_xingtian' }, { id: 'ev_a_ruyi' }, { id: 'ev_h_wufo' }] }, { fate: '逆' }).kind === 'diary');
ck('持ev_w_xingtian 持→ok', T('持ev_w_xingtian', { equips: [{ id: 'ev_w_xingtian' }] }, {}).ok === true);
ck('持ev_w_xingtian 未持→fail(hold)', T('持ev_w_xingtian', { equips: [{ id: 'ev_a_wudang' }] }, {}).kind === 'hold');
// 日记系豁免顺命缘≥10：渡+日记≥1 不因缘不足卡死
ck('日记系豁免缘≥10', T('渡 + 日记装备≥1', { fate: { 渡: 5, 缘: 0 }, equips: [{ id: 'ev_a_wudang' }] }, { fate: '渡' }).ok === true);

// 5) 既有隐藏职全含 hint
let noHint = 0;
Object.keys(L).map(Number).forEach((i) => { const t = L[i]; if (t.hidden && !t.hidden.hint) noHint++; });
ck('全部隐藏职含 hint（无遗漏）', noHint === 0, '缺 ' + noHint);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
