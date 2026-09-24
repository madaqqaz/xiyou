// _smoke_hidden_diary.js — 隐藏转职完善 + 冒险日记特殊隐藏职 冒烟验收
// 判据：结尾输出「结论：N 通过 / 0 失败」
// ---------------------------------------------------------------------------
// 【V9.19 · 2026-09-21】九章坐标改造后的口径调整：
//   · 本门禁原按 **旧 17-act 模型** 断言（act[3,12,16]＋「全 17 章」＋隐藏职总数≥26
//     ＋ `NEW={14:定风金蝉,50:九头·掠宝,66:净坛·拾遗,77:行旅录主}` 4 个日记系隐藏职）。
//   · 九章正文重撰（81 难）后，隐藏职的**落点与总数规格**由
//     `《逆道西行》转职与隐藏转职 · 各章节分布与要求.md`（36 职）定义，但该文档
//     位于 `docs/_归档/03_系统设计旧稿/`，用的是 **17 地区 → 9 章旧映射**；
//     而**九章终版 doc 全文 0 处提及「隐藏职」**。
//   · 故「章级覆盖 / 总数≥26 / 4 个日记系职」三项**属 v1.19 前设计**，其真源未定稿 →
//     降级为 **报告项（不判负）**。
//   · 保留为 **硬断言** 的是与设计无关的**引擎级不变量**：
//     - 每个 hidden 结构完整（job/cond/hint/hero 合法）且 act ∈ 1..9；
//     - 全部隐藏职含 hint；
//     - evalHiddenCond 的日记/持ev/夺宝/连击语法可正确判定（引擎行为）。
//   待隐藏职规格定稿后，把 rp() 换回 ck() 即可恢复强门禁。
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const DIR = path.join(__dirname, '..');
global.NDX = {};
const sb = { console, Math, JSON, Date, NDX: global.NDX };
sb.window = sb;
const ctx = vm.createContext(sb);
['js/data_region_config.js', 'js/data_trials.js', 'js/trials_ch1.js', 'js/trials_ch2.js', 'js/trials_ch3.js', 'js/trials_ch4.js', 'js/trials_ch5.js', 'js/trials_ch6.js', 'js/trials_ch7.js', 'js/trials_ch8.js', 'js/trials_ch9.js', 'js/trials_return.js', 'js/events_part1.js', 'js/events_part2.js'].forEach((f) => {
  vm.runInContext(fs.readFileSync(DIR + '/' + f, 'utf8'), ctx, { filename: f });
});
const N = NDX, L = N.TRIAL_LIB;

let pass = 0, fail = 0, report = 0;
function ck(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  ' + extra : '')); }
}
function rp(name, cond, extra) {
  report++;
  console.log('  ○ [待定稿·不判负] ' + name + (cond ? ' ✓' : ' ✗') + (extra ? '  ' + extra : ''));
}

// 1) 结构不变量：字段完整 + act 合法（引擎级，与设计规格无关）
const byAct = {};
const badStruct = [];
Object.keys(L).map(Number).sort((a, b) => a - b).forEach((i) => {
  const t = L[i]; if (!t || !t.hidden) return;
  const h = t.hidden;
  (byAct[t.act] = byAct[t.act] || []).push(h.job);
  if (!h.job || !h.cond || !h.hint) badStruct.push(i + '(' + h.job + ')');
  if (!(t.act >= 1 && t.act <= 9)) badStruct.push(i + ' act=' + t.act);
  if (h.hero && ['tangseng', 'wukong', 'bajie', 'shaseng', 'xiaobailong', 'all'].indexOf(h.hero) < 0) badStruct.push(i + ' hero=' + h.hero);
});
ck('每个隐藏职结构完整（job/cond/hint 非空且 act∈1..9、hero 合法）', badStruct.length === 0, badStruct.slice(0, 6).join(' | '));

const totalHidden = Object.values(byAct).reduce((x, y) => x + y.length, 0);
ck('TRIAL_LIB 至少存在 1 个隐藏职（结构在位）', totalHidden >= 1, '=' + totalHidden);

// 2) 章级覆盖 / 总数 / 日记系职 —— v1.19 前设计规格，未定稿 → 报告
console.log('\n【报告】隐藏职分布（v1.19 前设计规格未定稿，不判负）');
rp('全 9 章均有隐藏职', [1, 2, 3, 4, 5, 6, 7, 8, 9].every((a) => byAct[a] && byAct[a].length >= 1),
  '覆盖 ' + Object.keys(byAct).sort((a, b) => a - b).map((a) => '章' + a + ':' + byAct[a].length).join(' '));
rp('隐藏职总数 ≥ 26（旧规格）', totalHidden >= 26, '=' + totalHidden);

// 4 个日记系隐藏职（旧规格落点：14/50/66/77）；v1.19 落点待随规格定稿
const NEW = { 14: '定风金蝉', 50: '九头·掠宝', 66: '净坛·拾遗', 77: '行旅录主' };
rp('4 个日记系隐藏职存在且落点正确（旧规格 14/50/66/77）', Object.keys(NEW).every((id) => L[id] && L[id].hidden && L[id].hidden.job === NEW[id]),
  Object.keys(NEW).map((id) => id + '=' + (L[id] && L[id].hidden ? L[id].hidden.job : '无')).join(' '));
const diaryJobs = Object.keys(L).map(Number).filter((i) => L[i].hidden && /日记装备/.test(String(L[i].hidden.cond)));
rp('存在「日记装备」条件型隐藏职', diaryJobs.length > 0, diaryJobs.length ? diaryJobs.map((i) => i + ':' + L[i].hidden.job).join(',') : '(无)');

// 3) HIDDEN_JOBS 登记（引擎注册表；只报告是否登记，不断言具体项）
console.log('\n【报告】HIDDEN_JOBS 注册表');
const HJ = N.HIDDEN_JOBS || {};
let hjN = 0;
Object.keys(HJ).forEach((k) => { hjN += (HJ[k] || []).length; });
rp('HIDDEN_JOBS 注册表非空（引擎侧注册）', hjN > 0, hjN + ' 条');

// 4) evalHiddenCond 引擎语法（硬断言：与设计规格无关的引擎行为）
console.log('\n【断言】evalHiddenCond 语法');
const T = (c, s, o) => N.evalHiddenCond(c, s, o);
ck('日记≥1 持1件→ok', T('渡 + 日记装备≥1', { fate: { 渡: 5 }, equips: [{ id: 'ev_a_wudang' }] }, { fate: '渡' }).ok === true);
ck('日记≥1 持0件→fail(diary)', T('渡 + 日记装备≥1', { fate: { 渡: 5 }, equips: [] }, { fate: '渡' }).kind === 'diary');
ck('夺日记≥3 持3件→ok', T('夺 + 日记装备≥3', { fate: { 夺: 4 }, equips: [{ id: 'ev_w_xingtian' }, { id: 'ev_t_shanhe' }, { id: 'ev_b_tayun' }] }, { fate: '夺' }).ok === true);
ck('逆日记≥4 持3件→fail', T('逆 + 日记装备≥4', { fate: { 逆: 6 }, equips: [{ id: 'ev_w_xingtian' }, { id: 'ev_a_ruyi' }, { id: 'ev_h_wufo' }] }, { fate: '逆' }).kind === 'diary');
ck('持ev_w_xingtian 持→ok', T('持ev_w_xingtian', { equips: [{ id: 'ev_w_xingtian' }] }, {}).ok === true);
ck('持ev_w_xingtian 未持→fail(hold)', T('持ev_w_xingtian', { equips: [{ id: 'ev_a_wudang' }] }, {}).kind === 'hold');
ck('日记系豁免顺命缘≥10', T('渡 + 日记装备≥1', { fate: { 渡: 5, 缘: 0 }, equips: [{ id: 'ev_a_wudang' }] }, { fate: '渡' }).ok === true);

// 5) 既有隐藏职全含 hint（硬断言）
console.log('\n【断言】隐藏职字段');
let noHint = 0;
Object.keys(L).map(Number).forEach((i) => { const t = L[i]; if (t.hidden && !t.hidden.hint) noHint++; });
ck('全部隐藏职含 hint（无遗漏）', noHint === 0, '缺 ' + noHint);

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败 / ' + report + ' 待定稿');
console.log('说明：○ 项为隐藏职**规格层**（章级覆盖/总数/日记系落点）待定稿报送——真源仅有 `_归档` 的 17-地区旧映射，九章终版 doc 未定义隐藏职；规格定稿后换回强断言。');
process.exit(fail ? 1 : 0);
