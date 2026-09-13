// _smoke_trials_rewrite.js — 81 难「范式重撰」门禁（第二批·act8/9/10 覆盖 31~45 难）
// 依据：《逆道西行_六道抉择单选项症结分析与多套路方案》§6（隐藏六道标签 + 场景精选）、§7.9（终态极性规则）
//      《八十一难_调整提案_第二批》§一~§六（通天河复合化 / 35 缘→渡+逆 / 37 缘夺→战渡逆 / 38↔39 交换 / 40 补逆）
// 断言：选项去六道前缀、fate 后台保留、善恶逐项签署、结构性调整落位、逆·连续触发标记、全 81 难结构完整
const path = require('path'), fs = require('fs');
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
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;
const T = NDX.TRIAL_LIB;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };

// —— 一、结构完整性（全 81 难）——
ck('TRIAL_LIB 81 条', Object.keys(T).length >= 81, '实际 ' + Object.keys(T).length);
let noOpt = [], noName = [];
for (let n = 1; n <= 81; n++) {
  const t = T[n];
  if (!t) { noName.push(n); continue; }
  if (!t.name) noName.push(n);
  if (!t.options || !t.options.length) noOpt.push(n);
}
ck('全 81 难均有 name', noName.length === 0, JSON.stringify(noName));
ck('全 81 难均有 options', noOpt.length === 0, JSON.stringify(noOpt));

// —— 二、范式重撰（28~45：车迟原型已覆盖 28-30，本轮 31-45）——
const RANGE = [];
for (let n = 28; n <= 45; n++) RANGE.push(n);
let prefixed = [], noFate = [], noAlign = [];
RANGE.forEach((n) => {
  (T[n].options || []).forEach((o, i) => {
    if (/^【/.test(o.label || '')) prefixed.push(n + '#' + i + ':' + o.label);
    if (!o.fate) noFate.push(n + '#' + i);
    const e = o.effect || {};
    if (e.alignGood == null && e.alignEvil == null) noAlign.push(n + '#' + i + ':' + o.label);
  });
});
ck('28-45 选项已去【六道】前缀（隐藏标签）', prefixed.length === 0, prefixed.slice(0, 4).join(' | '));
ck('28-45 选项均保留 fate（后台累加）', noFate.length === 0, JSON.stringify(noFate));
ck('28-45 选项均签署善恶（含战/隐按后果手写）', noAlign.length === 0, noAlign.slice(0, 4).join(' | '));

// —— 三、终态极性规则（§7.9）：渡/缘=善、逆/夺=恶，不得反向 ——
let polarityBad = [];
RANGE.forEach((n) => (T[n].options || []).forEach((o, i) => {
  const e = o.effect || {};
  if ((o.fate === '渡' || o.fate === '缘') && (e.alignEvil != null && e.alignGood == null)) polarityBad.push(n + '#' + i + ' 渡/缘却+恶');
  if ((o.fate === '逆' || o.fate === '夺') && (e.alignGood != null && e.alignEvil == null)) polarityBad.push(n + '#' + i + ' 逆/夺却+善');
}));
ck('极性不反向（渡缘不加恶 / 逆夺不加善）', polarityBad.length === 0, polarityBad.join(' | '));

// —— 四、第二批结构项 ——
ck('难35 金兜金刚 4 选项', (T[35].options || []).length === 4, '实际 ' + (T[35].options || []).length);
ck('难35 含「渡」（原缘改渡）', (T[35].options || []).some((o) => o.fate === '渡'));
ck('难35 含「逆」（新增）', (T[35].options || []).some((o) => o.fate === '逆'));
ck('难35 已移除「缘」', !(T[35].options || []).some((o) => o.fate === '缘'));
// 中文 sort 按 UTF-16 码点序（战<渡<逆），故用集合比较而非数组序比较
// V8.7x 六道供给规则（data_trial_dao.js）更新：难37 有法宝（子母河水/落胎泉）→「夺」应保留
// 2026-09-12 夺道重构：难37「取一葫芦子母河水」不是夺宝（非妖王根本依仗），改归【缘】；
// 该难的「夺」由难38（如意钩·如意真仙守泉之本）承担，符合「夺=少而难」。
ck('难37 四选项 战/渡/缘/逆', JSON.stringify((T[37].options || []).map((o) => o.fate).sort()) === JSON.stringify(['战', '渡', '缘', '逆'].sort()), JSON.stringify((T[37].options || []).map((o) => o.fate)));
ck('难37 缘不加恶（改道后极性同步）', !(T[37].options || []).some((o) => o.fate === '缘' && o.effect && o.effect.alignEvil));
ck('难38 保留夺（如意钩为守泉之本）', (T[38].options || []).some((o) => o.fate === '夺' && o.duo));
ck('难38 = 落胎泉·解阳山（交换后）', T[38].name.indexOf('落胎泉') >= 0, T[38].name);
ck('难38 type=fight', T[38].type === 'fight', T[38].type);
ck('难39 = 女王招亲（交换后）', T[39].name.indexOf('女王') >= 0, T[39].name);
ck('难39 type=event', T[39].type === 'event', T[39].type);
ck('难39 迁移 hidden·弃经者', !!(T[39].hidden && T[39].hidden.job === '弃经者'), JSON.stringify(T[39].hidden || null));
// 难40 蝎精：倒马毒桩是法宝 → 补「夺」（四选项）
ck('难40 四选项且含「逆」', (T[40].options || []).length === 4 && (T[40].options || []).some((o) => o.fate === '逆'), JSON.stringify((T[40].options || []).map((o) => o.fate)));

// —— 五、逆·连续触发标记（第二批 §零.2）——
const niMarks = [];
RANGE.forEach((n) => (T[n].options || []).forEach((o) => { if (o.fate === '逆' && o.ni) niMarks.push(n); }));
ck('28-45 逆选项均标 ni（连续触发链）', (() => {
  let total = 0; RANGE.forEach((n) => (T[n].options || []).forEach((o) => { if (o.fate === '逆') total++; }));
  return niMarks.length === total && total > 0;
})(), '标记 ' + niMarks.length + ' / 逆选项总数');

// —— 六、act4 通天河复合节点（终局矩阵接线）——
// 2026-09-13 坐标系修正：通天河（难32-36）在 9 章制下属 act4（28-36），非旧 17 地区制的 act8。
//   act8 现为「天竺·玉兔」（难64-72）——旧断言在此必然失败，实为坐标系漂移，非内容缺陷。
const C4 = (NDX.COMPOUND_NODES || {})[4];
ck('act4 通天河已标记 tongtian（终局矩阵）', !!(C4 && C4.tongtian), JSON.stringify(Object.keys(C4 || {})));
ck('act4 覆盖子难 32-35', !!(C4 && [32, 33, 34, 35].every((d) => (C4.diffs || []).indexOf(d) >= 0)), JSON.stringify((C4 || {}).diffs));
// 反证守卫：act8 不得再被错标；且不得为不存在的 act10~17 生成复合节点副本
ck('act8 不再错标 tongtian（反证守卫）', !((NDX.COMPOUND_NODES || {})[8] || {}).tongtian);
ck('COMPOUND_NODES 无越界章（act 不超 TOTAL_ACTS）', !Object.keys(NDX.COMPOUND_NODES || {}).some((k) => +k > (NDX.TOTAL_ACTS || 9)), Object.keys(NDX.COMPOUND_NODES || {}).join(','));
const g2 = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_core_2.js'), 'utf8');
const gc = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_compound.js'), 'utf8');
const ge = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_event_2.js'), 'utf8');
// 2026-09-13 重构：特殊弧（车迟/通天河）改为按「子难号区间」激活——两弧同属第 4 章，
//   必须按 diffs 范围判定归属，否则两弧判定互相污染。断言随实现同步。
ck('game_core_2 初始化 tongtian.choices（按弧区间激活）', /tongtian:\s*_hasTongtian\s*\?/.test(g2));
ck('game_core_2 车迟/通天河双弧区间防互污', /chechiRange/.test(g2) && /tongtianRange/.test(g2));
ck('game_event_2 记录通天河每场抉择', /tongtian[\s\S]{0,200}choices\.push/.test(ge));
ck('game_compound 收束判定 tongtianAll', /tongtianAllDu|tongtianAllNi/.test(gc));
ck('game_core_2 难36 终局分支', /tongtianVisited[\s\S]{0,240}(36|bossDiffForAct)/.test(g2));

// —— 七、全 81 难数据卫生（交换/重写后全局兜底）——
const DAO6 = ['战', '渡', '逆', '夺', '缘', '隐'];
const badOpt = [];
for (let n = 1; n <= 81; n++) {
  const t = T[n]; if (!t) continue;
  (t.options || []).forEach((o, i) => {
    if (!o.label || !String(o.label).trim()) badOpt.push(n + '#' + i + ' 空文案');
    if (o.fate && DAO6.indexOf(o.fate) < 0) badOpt.push(n + '#' + i + ' 非法道:' + o.fate);
  });
}
ck('全 81 难选项文案非空 / fate 属六道', badOpt.length === 0, badOpt.slice(0, 5).join(' | '));
// 地区归属一致性（38/39 交换后仍应属 act9 女儿国）
const geoBad = [];
[37, 38, 39, 40].forEach((n) => {
  const g = NDX.geoSegmentOf(n);
  if (!g || g.act !== T[n].act) geoBad.push(n + ' act=' + T[n].act + ' geo=' + (g ? g.act : 'null'));
});
ck('37-40 地区归属与 geoSegmentOf 一致', geoBad.length === 0, geoBad.join(' | '));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
