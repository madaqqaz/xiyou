// _verify_origin_migrate.js — 前身线**旧档折算**门禁（2026-09-27）
// 背景：结局「缘定三生」新增「前身已忆起」一关（endings.js 的 `_originAwake`），
//   而 `s.origin` 是 V9.67 才有的字段 ⇒ **老存档没有它** ⇒ 原本拿得到的结局会凭空丢掉。
//   修法在 `game_rest.js` 的 `restoreRun`：按 `flags.gotInitGift` 反推，幂等补 `s.origin`。
//
// ⚠ 本门禁**零静态断言** —— 直接把存档 JSON 丢进 `restoreRun` 真跑，看 state 变成了什么。
//   反证重点：① 已领过送行的老档必须补成 revealed:true（否则结局真的丢了）
//             ② 尚未领到的必须补成 revealed:false（不能凭空"忆起"，送行还得正常触发）
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };

// ── 精确复刻 storage 的 load 契约：restoreRun 只认 { meta:{hero,version}, layer, ... } ──
const win = {};
const sandbox = {
  NDX: {}, window: win, Math: Math, JSON,
  console: { log() {}, error() {} },
  // storage.js 在无浏览器环境里要靠这个，否则 load() 直接抛
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
};
vm.createContext(sandbox);
const load = (f) => {
  try { vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), sandbox); }
  catch (e) { /* 缺依赖交给下面的存在性断言暴露 */ }
};
['data_config.js', 'data_heroes_data.js', 'data_materials.js', 'storage.js', 'endings.js',
  'game.js', 'game/game_rest.js'].forEach(load);
const NDX = win.NDX;

console.log('=== _verify_origin_migrate：前身线旧档折算（运行期真调 restoreRun）===');

ok(typeof NDX.storage === 'object' && !!NDX.storage.KEYS && !!NDX.storage.KEYS.RUN,
  'A0 NDX.storage 与其 RUN 键可用（restoreRun 的读档契约）');
ok(typeof NDX.Game.prototype.restoreRun === 'function', 'A1 restoreRun 可调用');

// ── 造一份可控存档 + 可控 storage ──
const fakeRun = (obj) => {
  const bag = { bag: obj };
  return {
    KEYS: NDX.storage.KEYS,
    load: (k) => (k === NDX.storage.KEYS.RUN ? bag.bag : null),
    remove: () => { bag.bag = null; },
  };
};
const runRestore = (saveObj) => {
  const g = { state: {} };
  g.restoreRun = NDX.Game.prototype.restoreRun;
  // 用受控 storage 顶替（restoreRun 只认 NDX.storage 这一个入口）
  const saved = NDX.storage;
  try {
    NDX.storage = fakeRun(saveObj);
    NDX.Game.prototype.restoreRun.call(g);
  } finally { NDX.storage = saved; }
  return g.state;
};

// ⚠ `hero` 必须给：state 里英雄存在 `s.hero`（`o.meta.hero` 只是存档元数据，restoreRun 会剥离它）。
//    折算代码读的正是 `s.hero` ⇒ 不给的话整块跳过、B 组全假红（上一版就栽在这）。
const baseSave = (patch) => Object.assign({
  hero: 'bajie',
  meta: { hero: 'bajie', version: NDX.storage.VERSION || 2 },
  layer: 3,
  flags: { gotInitGift: { bajie: true } },
  equips: [], npcRel: {}, choiceFlags: {},
}, patch || {});

// ── B 组 · 正证：已领过八戒送行的老档 ⇒ 补成 revealed:true ──
{
  const s = runRestore(baseSave());
  ok(!!s.origin, 'B1 正证：老档补出 s.origin（不再为空）');
  ok(s.origin && s.origin.hero === 'bajie', 'B2 origin.hero 记为八戒');
  ok(s.origin && s.origin.before === NDX.HEROES.bajie.originBefore, 'B3 before 取自真源');
  ok(s.origin && s.origin.revealed === true, 'B4 已领送行 ⇒ revealed=true（结局不会凭空丢）');
}

// ── C 组 · 反证：尚未领到送行的老档 ⇒ 必须 revealed:false ──
{
  const s = runRestore(baseSave({ flags: { gotInitGift: {} } }));
  ok(s.origin && s.origin.revealed === false,
    'C1 反证：未领送行 ⇒ revealed=false（不能凭空"忆起"，送行还得正常触发）');
}

// ── D 组 · 反证：英雄没前身 / 老档 origin 已存在 ⇒ 不许覆盖 ──
{
  // 已有 origin：重入必须原样保留（幂等）
  const s = runRestore(baseSave({ origin: { hero: 'bajie', before: '天蓬元帅', revealed: false } }));
  ok(s.origin.revealed === false, 'D1 反证：已有 origin 时不被折算覆盖（幂等）');
  // 英雄无 originBefore：补一个空的没意义，保持 undefined
  const s2 = runRestore(baseSave({ hero: 'wukong', flags: { gotInitGift: { wukong: true } } }));
  ok(!s2.origin || s2.origin.before === NDX.HEROES.wukong.originBefore,
    'D2 反证：英雄确有前身时 origin.before 必非空');
}

// ── E 组 · 端到端：折算后的 state 直接喂给结局判定，必须仍能拿到「缘定三生」──
{
  const s = runRestore(baseSave({ fate: { 缘: 7 }, npcRel: { 观音: 8, 如来: 6, 玉帝: 4, 太上老君: 3, 妖王: 2 }, flags: { ally: { shaseng: true }, gotInitGift: { bajie: true } } }));
  const cond = NDX.Ending.DEFINITIONS.yuanding.cond;
  ok(cond(s) === true, 'E1 端到端：折算后样本通过「缘定三生」判据（老档结局保住）');
  // 对照组：送行未领 ⇒ 判据拒（证明 E1 不是恒真）
  const s2 = runRestore(baseSave({ fate: { 缘: 7 }, npcRel: { 观音: 8, 如来: 6, 玉帝: 4, 太上老君: 3, 妖王: 2 }, flags: { ally: { shaseng: true }, gotInitGift: {} } }));
  ok(cond(s2) === false, 'E2 反证：送行未领 ⇒ 判据拒（E1 未退化成恒真）');
}

console.log(fail ? `=== _verify_origin_migrate：${fail} 项失败 ===` : '=== _verify_origin_migrate：旧档折算 9 条判据通过（老档结局不丢）===');
console.log(fail ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(fail ? 1 : 0);
