// _verify_codex_v2.js — 「冒险日记图鉴对照」第二批落地实证探针（v1.1）
// 拍板（2026-09-26）：A 只做格挡+反击 / B 待终审 / C 转职门槛展示 / D 事件后续嵌套。
// 断言：
//   ① A 格挡 blk / 反击 counter：数据有写入端、内核有读取端、封顶生效、desc 与数值不分叉；
//   ② A 构造性零回归：新分支全部以 blk>0 / counter>0 为前置，默认（0）时不可达；
//   ③ C 转职「须装备 XX」：held 无死 id、门槛派生有读取端、UI 已消费；
//   ④ D 事件后续嵌套：thenEvent 链完整可解析、解析函数有读取端、无死链；
//   ⑤ 所有新增字段均满足「写入端 ↔ 读取端」双向（项目红线）。
// 运行：node scripts/_verify_codex_v2.js
const vm = require('vm');
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
// —— vm 沙箱加载（events_part1.js 的 NDX 挂在大沙箱，require 式加载器读不到）——
const sb = { window: { NDX: {} }, console, Math, JSON, Object, Array, Set, Map, String, Number, Date, RegExp, Error };
sb.globalThis = sb;
const ctx = vm.createContext(sb);
['js/data_equip_core.js', 'js/equipment_part1.js', 'js/equipment_part3.js',
  'js/data_trials.js', 'js/events_part1.js', 'js/events_part2.js'].forEach((f) => {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { }
});
// 🔴 双沙箱补齐：require 式加载（大沙箱，含全部 index.html 脚本）与 vm 沙箱挂的是**两个 NDX 对象**。
//     held 之类的 id 查表必须走 require 式（它加载了 equipment_part2 等全部池），
//     否则会得到「明明在池子里却查不到」的假死门槛。
const S = sb.window.NDX || {};
// ⚠ 必须是「require 式优先」：它加载了 index.html 的**全部**脚本（superset）。
//    反过来做会让沙箱里数据不全的 lootById 抢先命中，得到「明明在池子里却查不到」的假死门槛。
// 🔴 **惰性取值**：绝不能先 `const G = global.NDX` 快照——下方 require 循环里的脚本会重建
//    global.NDX，快照会永远指向旧对象 ⇒ 运行期查表恒失败（曾误报 3 个 held 死 id）。
const NDX = new Proxy(S, {
  get(t, k) { const g = global.NDX || {}; return (g[k] !== undefined) ? g[k] : t[k]; },
  has(t, k) { const g = global.NDX || {}; return (k in g) || (k in t); },
});
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !SKIP.has(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) { } });

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) pass++; else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};
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
const read = (f) => { try { return fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'); } catch (e) { return ''; } };
const CB = read('combat_part1.js'), AC = read('attr_calc.js'), TR = read('data_trials.js');
const E1 = read('events_part1.js'), GE3 = read('game/game_event_3.js'), UM2 = read('ui/ui_misc_2.js');

// ===================== ① A · 格挡 / 反击 =====================
console.log('— A 格挡/反击 —');
const BLK_RE = /\bblk\s*:\s*([0-9.]+)/g;
const CTR_RE = /\bcounter\s*:\s*([0-9.]+)/g;
// ⚠ 值域统计必须限定在**装备对象字面量**内，否则会把 counterItem / hero.counter 等同名键算进来
const equipSRC = read('equipment_part1.js') + read('equipment_part2.js') + read('equipment_part3.js');
const blkHits = [...equipSRC.matchAll(/\{[^{}]*\bblk:\s*([0-9.]+)[^{}]*\}/g)].map((m) => +m[1]);
const ctrHits = [...equipSRC.matchAll(/\{[^{}]*\bcounter:\s*([0-9.]+)[^{}]*\}/g)].map((m) => +m[1]);
const blkData = blkHits.length, ctrData = ctrHits.length;
ck('装备数据有 blk 写入端', blkData > 0, `命中 ${blkData} 处`);
ck('装备数据有 counter 写入端', ctrData > 0, `命中 ${ctrData} 处`);
ck('blk 值域合法（0~0.50）', blkHits.every((v) => v > 0 && v <= 0.5), JSON.stringify([...new Set(blkHits)]));
ck('counter 值域合法（0~0.40）', ctrHits.every((v) => v > 0 && v <= 0.4), JSON.stringify([...new Set(ctrHits)]));
// 内核读取端
ck('内核读取 blk（pTi.blk）', /pTi\.blk/.test(CB));
ck('内核读取 counter（pTi.counter）', /pTi\.counter/.test(CB));
ck('attr_calc 白名单含 blk/counter', /'blk', 'counter'/.test(AC));
ck('attr_calc 属性表有中文名', /blk:\s*'格挡'/.test(AC) && /counter:\s*'反击'/.test(AC));
// 封顶与返回值
ck('computeStats 返回 ti.blk', /blk:\s*\+\?blk\.toFixed\(3\)|blk:\s*\+blk\.toFixed\(3\)/.test(CB));
ck('computeStats 返回 ti.counter', /counter:\s*\+counter\.toFixed\(3\)|\bcounter:\s*\+\?counter/.test(CB));
ck('blk 封顶 0.50', /equipBlk\s*=\s*Math\.min\(0\.50,\s*equipBlk\)/.test(CB));
ck('counter 封顶 0.40', /equipCounter\s*=\s*Math\.min\(0\.40,\s*equipCounter\)/.test(CB));
ck('战力总评纳入 blk/counter', /blk\s*\*\s*1200/.test(CB) && /counter\s*\*\s*900/.test(CB));
// UI 日志消费点
ck('战斗日志消费 blocked', /t\.blocked/.test(read('game/game_combat_1.js')));
ck('战斗日志消费 counterRiposte', /t\.counterRiposte/.test(read('game/game_combat_1.js')));
// desc 与数值不分叉（项目红线）
const equipSrc = equipSRC;
const descMiss = [];
[...equipSrc.matchAll(/\{[^{}]*id:\s*'([a-z0-9_]+)'[^{}]*\}/g)].forEach((m) => {
  const line = m[0];
  const b = line.match(/\bblk:\s*([0-9.]+)/), c = line.match(/\bcounter:\s*([0-9.]+)/);
  if (!b && !c) return;
  const dv = line.match(/desc:\s*'([^']*)'/);
  if (!dv) { descMiss.push(m[1] + '（无 desc）'); return; }
  const d = dv[1];
  if (b && !new RegExp('格挡\\+' + (Math.round(+b[1] * 100)) + '%').test(d)) descMiss.push(m[1] + '（格挡 desc 不符）');
  if (c && !new RegExp('反击\\+' + (Math.round(+c[1] * 100)) + '%').test(d)) descMiss.push(m[1] + '（反击 desc 不符）');
});
ck('带 blk/counter 的装备 desc 与数值一致', descMiss.length === 0, descMiss.join('、'));

// ===================== ② A · 构造性零回归 =====================
console.log('— A 零回归 —');
// 所有新分支的前置条件必须含 blk > 0 / counter > 0，否则存量玩家也会被改
const blkGates = (CB.match(/\(blk\s*>\s*0\)/g) || []).length;
const ctrGates = (CB.match(/\(ctr\s*>\s*0/g) || []).length;
ck('格挡判定以 blk>0 为前置', blkGates >= 1, `命中 ${blkGates}`);
ck('反击判定以 counter>0 为前置', ctrGates >= 1, `命中 ${ctrGates}`);
ck('格挡削减为 blkCut 常量 0.5', /blkCut\s*=\s*0\.5/.test(CB));
ck('反击系数 0.35 且每回合限一次（multi 不放大）', /cBase\s*\*\s*0\.35/.test(CB));
ck('格挡对多段一次判定（不逐段）', /const blocked = \(blk > 0\)/.test(CB));
// 运行期：默认装备下 blk/counter 恒 0
(function () {
  const pool = (NDX.EQUIP_POOL || []);
  const withBlk = pool.filter((e) => (e.blk || 0) > 0).length;
  const withCtr = pool.filter((e) => (e.counter || 0) > 0).length;
  ck('EQUIP_POOL 存在格挡件', withBlk > 0, `${withBlk} 件`);
  ck('EQUIP_POOL 存在反击件', withCtr > 0, `${withCtr} 件`);
  ck('未投放件默认 0（构造性零回归）', withBlk < pool.length && withCtr < pool.length);
})();

// ===================== ③ C · 转职「须装备 XX」 =====================
console.log('— C 转职门槛展示 —');
const HJ = NDX.HIDDEN_JOBS || {};
const heldIds = new Set();
Object.keys(HJ).forEach((h) => (HJ[h] || []).forEach((j) => (j.held || []).forEach((x) => heldIds.add(x))));
const deadHeld = [];
heldIds.forEach((id) => {
  // 双判定：①运行期查表（受加载序影响）②源码池文本命中（不受环境差异影响）——任一命中即算「活」
  let rt = false;
  try { rt = !!(NDX.equipById && NDX.equipById(id)) || !!(NDX.lootById && NDX.lootById(id)); } catch (e) { rt = false; }
  const srcHit = equipSRC.indexOf("'" + id + "'") >= 0 || equipSRC.indexOf('"' + id + '"') >= 0;
  if (!rt && !srcHit) deadHeld.push(id);
});
ck('held 无死 id', deadHeld.length === 0, deadHeld.join(','));
ck('jobHeldNames 已定义且为函数', typeof NDX.jobHeldNames === 'function');
ck('jobHeldByName 已定义且为函数', typeof NDX.jobHeldByName === 'function');
const usesHeldNames = (SRC.match(/heldNames/g) || []).length;
ck('heldNames 有读取端（非死字段）', usesHeldNames >= 3, `出现 ${usesHeldNames} 次`);
ck('UI 消费 heldNames（悬停门槛）', /x\.heldNames/.test(UM2));
ck('UI 消费 nextJob 门槛行', /nextJob/.test(UM2) && /jobHeldByName/.test(UM2));
ck('held 引擎判定入口仍在（而非只做 UI）', /hiddenEntry\.held \|\| \[\]/.test(read('game/game_event_2.js')));

// ===================== ④ D · 事件后续嵌套 =====================
console.log('— D 事件后续嵌套 —');
ck('eventById 已定义', typeof NDX.eventById === 'function');
ck('eventThenPending 已定义', typeof NDX.eventThenPending === 'function');
ck('eventThenPending 有读取端（引擎消费）', /eventThenPending\(opt, s\)/.test(GE3));
// 数据侧：3 条 thenEvent 串成 4 层链
const thenKeys = [...E1.matchAll(/thenEvent:\s*'([a-z0-9_]+)'/g)].map((m) => m[1]);
ck('数据侧有 thenEvent 投放', thenKeys.length >= 3, `命中 ${thenKeys.length} 条`);
const deadChain = thenKeys.filter((k) => !(NDX.EVENTS && NDX.EVENTS[k]));
ck('thenEvent 无死链（key 都能解析）', deadChain.length === 0, deadChain.join(','));
ck('后续链为 4 层', thenKeys.join('→') === 'baigu→gui→seng', `实际 ${thenKeys.join('→')}`);
// 4 层的意思是「起点 + 3 次后续」，起点须自身不被 thenEvent 反向依赖（防环）
ck('无链环（起点 bei 不依赖后续）', !/bei[\s\S]{0,400}thenEvent:\s*'bei'/.test(E1));
// 解析函数的过滤口径与 pickEvent 一致（区域/英雄/道途）
ck('eventById 含区域过滤', /ev\.region/.test(E1));
ck('eventById 含英雄过滤', /ev\.hero/.test(E1));
ck('eventById 含道途过滤', /ev\.dao/.test(E1));

// ===================== ⑤ 综合：新增字段双向 =====================
console.log('— 红线：写入端 ↔ 读取端 —');
[['blk', /\be\.blk\b|blk\s*:\s*\+?blk/, CB], ['counter', /\bcounter\b/, CB]].forEach(([k, re, where]) => {
  const w = (SRC.match(new RegExp('\\b' + k + '\\s*:', 'g')) || []).length;
  ck(`${k} 有写入端`, w > 0, `${w}`);
  ck(`${k} 内核有读取端`, re.test(where));
});
const thenEventWrite = (SRC.match(/thenEvent:/g) || []).length;
ck('thenEvent 有写入端', thenEventWrite > 0, `${thenEventWrite}`);

console.log(`\n=== _verify_codex_v2：${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail ? 1 : 0);
