// _verify_hero_origin.js — 前身线门禁（2026-09-27 · 用户拍板 B 档）
// 背景：`NDX.INIT_GIFT_EVENTS`（events_part2.js:33-59）五英雄各一段「送行」事件，
//   文本里早已埋了前身钩子（金蝉子转世 / 压了五百年 / 西海三太子 / 天蓬元帅那会儿 / 卷帘府的旧物），
//   但**代码层零承载** —— 前身既无状态位也无 UI ⇒ 埋得再好也等于没埋。
// 落地：`HEROES[id].originBefore`（真源）→ `grantInitGift` 写 `s.origin={hero,before,revealed}`
//   → `applyEventOpt` 落选项时翻 `revealed` → `ui_modals_1.js` 英雄面板显示「前身」行。
//
// ⚠ 按 X4 教训「门禁绿 ≠ 做对」：`revealed` 这类「开关位」最容易退化成**恒真/恒 false 的死字段**
//   ⇒ 本门禁以**运行期真调**为主，且**必须有反证**：干净 state 不写 origin、非送行选项不翻 revealed。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };
const pass = (c, m) => { if (c) console.log('  ok · ' + m); };

// ── 沙箱：按依赖顺序静默加载 ──
const win = {};
const sandbox = { NDX: {}, window: win, console: { log() {} }, Math: Math, JSON };
vm.createContext(sandbox);
const load = (f) => {
  try { vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), sandbox); }
  catch (e) { /* 依赖缺失交由下方存在性断言暴露 */ }
};
// ⚠ 加载次序有讲究：`game_event_3.js` 顶层就是 `NDX.Game.prototype.xxx = ...`，
//   而 `NDX.Game` 由更早在 index.html 加载的 `js/game.js:41` 定义 ⇒ 必须先载 game.js。
['data_config.js', 'data_heroes_data.js', 'equipment_part1.js', 'equipment_part2.js',
  'equipment_part3.js', 'data_equip_core.js', 'events_part2.js',
  'game.js', 'game/game_event_3.js'].forEach(load);
const NDX = win.NDX;

console.log('=== _verify_hero_origin：前身线（真源 · 写入 · 翻转 · 读取）===');

// ── A 组 · 真源：5 英雄各有一个前身名 ──
const HERO_IDS = ['wukong', 'tangseng', 'bajie', 'xiaobailong', 'shaseng'];
HERO_IDS.forEach((id) => {
  const d = NDX.HEROES && NDX.HEROES[id];
  ok(!!d, `A· ${id} 英雄定义存在`);
  ok(d && !!d.originBefore && typeof d.originBefore === 'string' && d.originBefore.length > 0,
    `A· ${id}.originBefore 非空（前身名真源，当前=${d && d.originBefore}）`);
});
// A零：前身名必须五英雄互不相同（否则等于复制粘贴占位）
const beforeSet = new Set(HERO_IDS.map((id) => (NDX.HEROES[id] || {}).originBefore).filter(Boolean));
ok(beforeSet.size === HERO_IDS.length,
  `A· 5 个前身名互不重复（实测去重后 ${beforeSet.size}/${HERO_IDS.length}）`);

// ── B 组 · 写入端真调：grantInitGift 必须把 s.origin 落进 state ──
const stubGame = (state) => ({
  state: state,
  grantEquip() {},
  pushLog() {},
  render() {},
});
const callGrant = (hero) => {
  const s = { equips: [], flags: { gotInitGift: {} }, logs: [] };
  const g = stubGame(s);
  NDX.Game.prototype.grantInitGift.call(g, hero);
  return s;
};

const sb = callGrant('bajie');
ok(!!sb.origin, 'B1 写入：`grantInitGift("bajie")` 后 `s.origin` 存在');
ok(sb.origin && sb.origin.hero === 'bajie', 'B2 `s.origin.hero` 记录的是该英雄自身');
ok(sb.origin && sb.origin.before === NDX.HEROES.bajie.originBefore,
  'B3 s.origin.before 取自真源（' + (sb.origin && sb.origin.before) + '）');
ok(sb.origin && sb.origin.revealed === false,
  'B4 初始 `revealed === false`（认领尚未忆起，不是直接给满）');
// 反证：不发礼的英雄不该凭空冒出 origin（防写入端被写成恒赋值）
const sbClean = { equips: [], flags: { gotInitGift: {} }, logs: [] };
NDX.Game.prototype.grantInitGift.call(stubGame(sbClean), 'nonexistent_hero');
ok(!sbClean.origin, 'B5 反证：英雄不存在时不写 origin（写入端未退化成恒赋值）');

// ── C 组 · 翻转真调：送行选项落定 ⇒ revealed 翻 true；非送行 ⇒ 不动 ──
// ⚠ `_optionGate` 会读一大堆 state，这里直接注入 `_optGateCtx` 短路掉门槛（与产品门槛口径无关）
const mkGame = (pending) => {
  const s = { equips: [], flags: { gotInitGift: { bajie: true } }, logs: [], pending: pending };
  const g = stubGame(s);
  g._optGateCtx = () => ({ locked: false });
  return { s: s, g: g };
};
const tryOpt = (g, opt) => { try { NDX.Game.prototype.applyEventOpt.call(g, opt); } catch (e) { /* 后续分支与本判据无关 */ } };

// 正证
{
  const { s, g } = mkGame({ kind: 'song-event', grantHero: 'bajie' });
  s.origin = { hero: 'bajie', before: NDX.HEROES.bajie.originBefore, revealed: false };
  tryOpt(g, { text: '抓耙就啃庄主敬的肉', effect: { good: 4 } });
  ok(s.origin.revealed === true, 'C1 正证：送行事件选项落定 ⇒ `revealed` 翻 true');
}
// 反证一：非送行事件（pending 无 grantHero）⇒ 绝不能翻（防判据恒真）
{
  const { s, g } = mkGame({ kind: 'choices' });
  s.origin = { hero: 'bajie', before: NDX.HEROES.bajie.originBefore, revealed: false };
  tryOpt(g, { text: '随便一个选项', effect: { good: 1 } });
  ok(s.origin.revealed === false, 'C2 反证：非送行事件 ⇒ revealed 保持 false（判据未恒真）');
}
// 反证二：门槛未过（此路未通）⇒ 不该忆起
{
  const { s, g } = mkGame({ kind: 'song-event', grantHero: 'bajie' });
  s.origin = { hero: 'bajie', before: NDX.HEROES.bajie.originBefore, revealed: false };
  g._optGateCtx = () => ({ locked: true, reasons: ['测试门槛'] });
  tryOpt(g, { text: '被门槛拦下的选项', effect: { good: 4 } });
  ok(s.origin.revealed === false, 'C3 反证：门槛未通（此路未通）⇒ 不忆起');
}

// ── D 组 · 读取端：UI 确实渲染「前身」行（存在性；行为由 C 组真调覆盖）──
const uiSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui', 'ui_modals_1.js'), 'utf8');
ok(/s\.origin/.test(uiSrc), 'D1 读取端：ui_modals_1.js 引用 `s.origin`');
ok(/revealed/.test(uiSrc), 'D2 `revealed` 有 UI 展示分支（未忆起显示问号 → 忆起显示前身名）');
ok(/s\.origin/.test(fs.readFileSync(path.join(__dirname, '..', 'js', 'game', 'game_event_3.js'), 'utf8')),
  'D3 写入端在 game_event_3.js（与注释登记的位置一致）');

if (!fail) {
  console.log('=== _verify_hero_origin：前身线 —— 写入/翻转/读取三端点齐备，反证有效 ===');
} else {
  console.log(`=== _verify_hero_origin：${fail} 项失败 ===`);
}
console.log(fail ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(fail ? 1 : 0);
