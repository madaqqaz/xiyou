const vm = require("vm");
// _verify_codex_align.js — 「冒险日记图鉴对照」派生层实证探针（v1.0）
// 目的：证明图鉴三张关键列（装备「正常获取途径」/ 转职「进阶·特性」/ 事件「条件·后续」）
//       已落成**派生 + 消费点**，且**零死字段**（项目红线）。
// 依据：docs/《逆道西行》_冒险日记图鉴对照 · 补充完善（v1.0）.md
// 断言：
//   ① 派生函数全有读取端（js/ 源码里除定义处外存在 NDX.xxx( 调用）；
//   ② 装备获取途径守恒于 EQUIP_POOL（466），六维标签值域闭合；
//   ③ 45 隐藏职：职阶/玩法评测 100% 覆盖，职阶值域闭合；
//   ④ 事件门槛字段零死字段（requireNoTreasure / requireFlagNot / requireHero 三字段此前零读取）；
//   ⑤ 事件「后续」三态可判：once / end 均确有数据支撑；
//   ⑥ 门槛 UI 判定与引擎判定同源（同一 option + 同一 state 结论一致）。
// 运行：node scripts/_verify_codex_align.js
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

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };

// 全量 js 源码（含 ui/），用于「读取端」扫描
const walk = (dir, acc) => {
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach((d) => {
    const p = dir + '/' + d.name;
    if (d.isDirectory()) walk(p, acc);
    else if (d.name.endsWith('.js')) acc.push(p);
  });
  return acc;
};
const JS_FILES = walk('js', []);
const SRC = JS_FILES.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');

// ===================== ① 派生函数必须有读取端（禁死字段） =====================
const DERIVED = {
  equipSource: '装备获取途径', equipTags: '装备六维标签',
  jobTier: '职阶层级', jobReview: '玩法评测',
  optionRepeat: '事件重刷语义', optionRepeatAll: '事件重刷语义（并列）',
  optionCondText: '事件门槛文本', optionCondMet: '事件门槛判定',
};
Object.keys(DERIVED).forEach((fn) => {
  ck(`派生函数已定义 · ${DERIVED[fn]}（${fn}）`, typeof NDX[fn] === 'function');
  // 读取端 = 定义（`NDX.fn =` 赋值式）之外出现 `NDX.fn(` 调用；定义与调用句式不重叠，可直接计数
  const uses = (SRC.match(new RegExp('NDX\\.' + fn + '\\s*\\(', 'g')) || []).length;
  // ⚠ X4 判据强度如实标注（2026-09-27）：这条断言判的是「**全树源码里出现过 `NDX.<fn>(` 这串字**」，
  //   不是「读取端存在」。二者不等价 —— 文本命中可以来自注释 / 字符串模板 / 无关旁支文件。
  //   反证已实测：把唯一消费点 `js/ui/ui_modals_1.js` 的 `NDX.equipSource(e)` 等价改写成
  //   `const _f = NDX.equipSource; _f(e)` ⇒ 本断言**立刻红**（调用 0 处）⇒ 它不是假门禁；
  //   但它同样拦不住「命中落在注释里」与「读了却没渲染进 UI」。
  //   ⇒ 真正的活体保障是**本文件下方对同一函数的真调**（如第 68 行 `NDX.equipSource(e)`），
  //     两者互补：文本计数兜「消费点被删」，真调兜「函数死了 / 读了没用」。别只留一个。
  ck(`源码存在调用文本 · ${DERIVED[fn]}（${fn}）【弱门禁：全树文本计数，不验证渲染】`,
    uses >= 1, `文本命中 ${uses} 处`);
});

// ===================== ② 装备：获取途径守恒 + 六维标签值域 =====================
const pool = (NDX.EQUIP_POOL || []).filter(Boolean);
ck('EQUIP_POOL 非空', pool.length > 0, '当前 ' + pool.length);
const srcDist = {};
pool.forEach((e) => { const s = NDX.equipSource(e); srcDist[s] = (srcDist[s] || 0) + 1; });
const srcSum = Object.keys(srcDist).reduce((a, k) => a + srcDist[k], 0);
ck('获取途径守恒（覆盖全池无遗漏）', srcSum === pool.length, `途径合计 ${srcSum} / 池 ${pool.length}`);
console.log(`     · 获取途径分布 ${JSON.stringify(srcDist)}`);

const TAG_KEYS = ['reduce', 'boost', 'crit', 'evade', 'lifesteal', 'set', 'hidden', 'evolve'];
const tagDist = {};
pool.forEach((e) => { NDX.equipTags(e).forEach((t) => { tagDist[t] = (tagDist[t] || 0) + 1; }); });
Object.keys(tagDist).forEach((t) => ck(`标签值域闭合 · ${t}`, TAG_KEYS.indexOf(t) >= 0, '越界标签 ' + t));
console.log(`     · 六维标签分布 ${JSON.stringify(tagDist)}`);

// ===================== ③ 转职：职阶 / 评测 100% 覆盖 =====================
const jobs = [];
Object.keys(NDX.HIDDEN_JOBS || {}).forEach((h) => (NDX.HIDDEN_JOBS[h] || []).forEach((j) => jobs.push(j.job)));
const noTier = jobs.filter((j) => !NDX.jobTier(j).key);
const noReview = jobs.filter((j) => !NDX.jobReview(j));
ck('隐藏职职阶全覆盖', noTier.length === 0, '缺 ' + noTier.slice(0, 5).join(','));
ck('隐藏职玩法评测全覆盖', noReview.length === 0, '缺 ' + noReview.slice(0, 5).join(','));
const tierDist = {};
jobs.forEach((j) => { const k = NDX.jobTier(j).key; tierDist[k] = (tierDist[k] || 0) + 1; });
['origin', 'mid', 'final', 'solo'].forEach((k) => ck(`职阶值域闭合 · ${k}`, tierDist[k] > 0));
const tierSum = Object.keys(tierDist).reduce((a, k) => a + tierDist[k], 0);
ck('职阶分布合计 = 隐藏职总数', tierSum === jobs.length, `${tierSum} / ${jobs.length}`);
console.log(`     · 共 ${jobs.length} 职，职阶分布 ${JSON.stringify(tierDist)}`);

// ===================== ④ 事件门槛字段零死字段 =====================
// 此前 requireNoTreasure / requireFlagNot / requireHero 只写不判，玩家能选到本该被排除的选项
const GATE_SRC = (() => { try { return fs.readFileSync(path.join(ROOT, 'js/game/game_event_4.js'), 'utf8'); } catch (e) { return ''; } })();
['requireNoTreasure', 'requireFlagNot', 'requireHero', 'requireFlag', 'requireLock', 'requireRel']
  .forEach((f) => ck(`引擎有读取端 · ${f}`, GATE_SRC.indexOf(f) >= 0));

const gate = (typeof NDX.Game !== 'undefined' && NDX.Game.prototype && NDX.Game.prototype._optionGate)
  ? NDX.Game.prototype._optionGate : null;
ck('_optionGate 可用', typeof gate === 'function');
if (gate) {
  const s0 = { choiceFlags: {}, equips: [], npcRel: {}, ge: {}, hero: 'wukong', good: 0, evil: 0 };
  // [字段, option, state, 期望 locked, 用例说明]
  const cases = [
    ['requireNoTreasure', { requireNoTreasure: 'tre_zhaoyaojing' }, Object.assign({}, s0, { equips: [{ id: 'tre_zhaoyaojing' }] }), true, '已持该物'],
    ['requireNoTreasure', { requireNoTreasure: 'tre_zhaoyaojing' }, s0, false, '未持该物'],
    ['requireFlagNot', { requireFlagNot: 'n20_baigu:yin' }, Object.assign({}, s0, { choiceFlags: { n20_baigu: 'yin' } }), true, '已落该印'],
    ['requireFlagNot', { requireFlagNot: 'n20_baigu:yin' }, s0, false, '未落该印'],
    ['requireHero', { requireHero: 'wukong' }, s0, false, '主角相符'],
    ['requireHero', { requireHero: 'wukong' }, Object.assign({}, s0, { hero: 'tangtang' }), true, '主角不符'],
  ];
  cases.forEach(([f, opt, st, wantLocked, why]) => {
    const g = gate.call({ state: st }, opt);
    ck(`门槛生效 · ${f}（${why}）`, !!g && g.locked === wantLocked, g ? 'locked=' + g.locked : 'no gate');
  });
}

// ===================== ⑤ 事件「后续」三态可判 =====================
const repDist = {};
let optTot = 0;
const lib = NDX.TRIAL_LIB || {};
Object.keys(lib).forEach((d) => {
  const t = lib[d] || {};
  [].concat(t.options || [], t.opts || []).forEach((o) => {
    if (!o) return; optTot++;
    const r = NDX.optionRepeat(o);
    repDist[r] = (repDist[r] || 0) + 1;
  });
});
ck('TRIAL_LIB 选项非空', optTot > 0, '当前 ' + optTot);
['once', 'end'].forEach((k) => ck(`「后续」态有数据支撑 · ${k}`, repDist[k] > 0));
console.log(`     · ${optTot} 选项，后续分布 ${JSON.stringify(repDist)}`);

// ===================== ⑥ UI 判定与引擎判定同源 =====================
if (gate) {
  const s0 = { choiceFlags: {}, equips: [], npcRel: {}, ge: {}, hero: 'wukong', good: 0, evil: 0 };
  let same = 0, diff = 0; const diffs = [];
  Object.keys(lib).forEach((d) => {
    const t = lib[d] || {};
    [].concat(t.options || [], t.opts || []).forEach((o) => {
      if (!o) return;
      const uiOk = NDX.optionCondMet(o, s0).ok;
      const eng = gate.call({ state: s0 }, o);
      // 引擎侧「逆道未启」等与门槛无关的锁定不计入比对
      if (/凶险未启/.test((eng.reasons || []).join(''))) return;
      if (uiOk === !eng.locked) same++; else { diff++; if (diffs.length < 3) diffs.push(`第${d}难 ${o.label || o.text || ''}`); }
    });
  });
  ck('UI 门槛判定 ≡ 引擎门槛判定', diff === 0, `一致 ${same} / 冲突 ${diff}：${diffs.join('；')}`);
  console.log(`     · 同源比对：一致 ${same} 条，冲突 ${diff} 条`);
}

// ===================== ⑦ UI 渲染消费点（防模板回退） =====================
// 直接调 sceneModal() 渲染一遍带门槛的选项，确认徽章真的出现在 HTML 里。
// 这一条是「门禁绿 ≠ 做对」的兜底：静态断言只能证明函数存在，证明不了它挂上了。
(function () {
  const win = {};
  const ctx = { NDX: {}, window: win, console, Math, JSON, Object, Array, Set, Map, Number, String, Boolean, RegExp, Date };
  vm.createContext(ctx);
  ['data_equip_core.js', 'data_trials.js', 'game/game_event_4.js', 'ui/ui_modals_2.js'].forEach((f) => {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), ctx, { filename: f }); }
    catch (e) { /* 依赖 NDX.Game 等，缺的是加载链不是逻辑；渲染分支会走兜底 */ }
  });
  const U = (win.NDX && win.NDX.ui) || null;
  if (!U || !U.sceneModal) { ck('UI 渲染点可用 · sceneModal', false, 'ui/ui_modals_2.js 未挂载'); return; }
  U._splitScenes = () => ['一段叙事。'];                       // 强制单页才会渲染选项按钮
  U._cleanOptText = (t) => String(t == null ? '' : t);
  U._ditingLine = () => '';
  U._optionGate = () => ({ locked: false, reasons: [] });
  ctx.esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // 玩家此刻持着照妖镜 —— ch2:137 逆选项 requireNoTreasure: tre_zhaoyaojing 应被锁
  win.NDX.game = { state: { hero: 'wukong', equips: [{ id: 'tre_zhaoyaojing' }], choiceFlags: {}, npcRel: {}, ge: {} } };
  const p = { title: 'T', text: 'x', opts: [
    { text: '未请神不用宝，纯实力折服', fate: '逆', effect: { alignEvil: 8 }, requireNoTreasure: 'tre_zhaoyaojing', setFlag: 'n20:ni', fight: true },
    { text: '请神求助', fate: '渡', effect: { alignGood: 5 }, requireFlag: 'n15:du' },
    { text: '普通选项', fate: '隐', effect: {} },
  ] };
  let html = '';
  try { html = U.sceneModal.call(U, p, 'T', p.opts, 'scene-pick', ''); }
  catch (e) { ck('sceneModal 渲染不抛异常', false, e.message); return; }
  ck('渲染出门槛徽章', /opt-cond[^>]*>门槛 · 不得持 · /.test(html));
  ck('未达成门槛标红', /opt-cond-unmet/.test(html));
  ck('渲染出重刷徽章（一次性 / 战斗结束）', /rep-once">一次性/.test(html) && /rep-end">战斗结束/.test(html));
  ck('渲染无 undefined 泄漏', !/undefined/.test(html));
})();

console.log(`\n=== _verify_codex_align：${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail ? 1 : 0);
