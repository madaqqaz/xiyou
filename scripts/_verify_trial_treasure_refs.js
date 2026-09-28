// _verify_trial_treasure_refs.js — 81 难主数据「至宝/宝物引用」可解析性门禁
// ---------------------------------------------------------------------------
// 建立原因（2026-09-28）：js/trials_ch*.js 里 `treasure` / `requireNoTreasure` / `refill`
// 三个键长期挂着**字典里不存在的 id**。消费端（game_event_2.js:364 / game_event_1.js:306 /
// game_core_2.js:452）一律 `NDX.lootById(tid)` 取不到就静默回落，于是：
//   · 掉落 → 回落到 `_heroBaseDrop(hero)`（玩家看不出，但设计里的宝物等于没写）
//   · `requireNoTreasure` → `_owns` 恒 false ⇒ **门槛形同虚设**（本该锁死的【逆】路随时可走）
// 这类缺陷不报错、不崩溃，只能靠「引用 id ↔ 真源字典」的对照**真调**拦住。
//
// 本轮收口的 9 个悬空（脚本实测，旧账「11 个」不准 —— `ni_sanshou`/`ni_yulong` 在宠物储备池）：
//   · 7 个 `*sheli`：note 里的「蓝/红劫印」是**章末 Boss 的劫印结算档位**（骨架 v1.6:61-71），
//     不是掉落物 ⇒ 删除节点，掉落回落 _heroBaseDrop（行为与删前一致）。
//   · `tre_bishuizhu`：避水珠真身 = `lm_bowl`（通用条目）/ `bis_an`（黯）⇒ 改指真源。
//   · `ni_heifeng`：无实体 ⇒ 删除死引用（逆道经文由 grantNiSutraFrag 自动发，不缺）。
//
// 🩸 X4 三条教训（本门禁的写法准则，违反任意一条就是假门禁）：
//   ① 不许永真断言 —— 每条判据都要配反证，证明它**能红**；
//   ② 不许文本匹配冒充语义 —— 必须真调 `lootById` / `petEntryById` / `_owns` 等价逻辑；
//   ③ 不许存在性冒充行为 —— 「文件里有这个字符串」不等于「运行期真的能拿到」。
// 🩸 扫描前必须**剥离注释**：修复注释里会写被删掉的 id（便于追溯），不剥离会把注释当成
//    代码、产生永远消不掉的红（本会话已栽 2 次）。
// 🩸🩸 剥离前必须先**统一行尾**：本仓部分文件是 CRLF、部分是 LF（同一文件内还会混）。
//    `/\/\/.*$/` 对 CRLF 行**永远匹配不上** —— JS 规范里 `\r` 也是 LineTerminator，
//    `.` 不消费它，而 `$`（非多行模式）又要求绝对字符串末尾 ⇒ 整条正则失配，
//    表现为「LF 文件剥离成功、CRLF 文件剥离失败」，极难察觉。本会话实锤一次。
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
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) { /* 与既有门禁同口径 */ } });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

// ─────────────────────────────────────────────────────────────
// 扫描：剥离注释 → 取引用 id
// ─────────────────────────────────────────────────────────────
const SRC_DIR = path.join(ROOT, 'js');
const SRC_FILES = fs.readdirSync(SRC_DIR).filter((f) => /^(trials_|events_|hero_trials_)/.test(f) && f.endsWith('.js'));

// 先统一行尾（CRLF/CR → LF），再去块注释 /* */
function stripComments(src) {
  return src.replace(/\r\n?/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '');
}
const ID_RE = /["']?(?:requireNoTreasure|refill|treasure)["']?\s*:\s*(?:["']([a-z0-9_]+)["']|\{\s*["']?id["']?\s*:\s*["']([a-z0-9_]+)["'])/g;
const ARR_RE = /["']?(?:requireNoTreasure|refill|treasure)["']?\s*:\s*\[([^\]]*)\]/g;
const STR_RE = /["']([a-z0-9_]+)["']/g;

const refs = new Map(); // id -> [loc]
function addRef(id, loc) { if (!refs.has(id)) refs.set(id, []); refs.get(id).push(loc); }

SRC_FILES.forEach((f) => {
  const lines = stripComments(fs.readFileSync(path.join(SRC_DIR, f), 'utf8')).split('\n');
  lines.forEach((raw, i) => {
    const code = raw.replace(/\/\/.*$/, '');
    const loc = f + ':' + (i + 1);
    let m;
    ID_RE.lastIndex = 0;
    while ((m = ID_RE.exec(code))) addRef(m[1] || m[2], loc);
    ARR_RE.lastIndex = 0;
    while ((m = ARR_RE.exec(code))) {
      STR_RE.lastIndex = 0;
      let s; while ((s = STR_RE.exec(m[1]))) addRef(s[1], loc);
    }
  });
});

// 真源判据：装备池 ∪ 法宝字典 ∪ 宠物条目（三者任一命中即算可解析）
const resolvable = (id) => !!(NDX.lootById && NDX.lootById(id)) || !!(NDX.petEntryById && NDX.petEntryById(id));

// 已收口的 9 个旧悬空（硬编码，不从文件读 —— 文件里只在注释中出现）
const CLEARED = ['ni_heifeng', 'tre_bishuizhu',
  'honghai_sheli', 'qingniu_sheli', 'liuer_sheli', 'niu_sheli', 'shitu_sheli', 'jiuling_sheli', 'lingshan_sheli'];

console.log('\n[A] 代码区引用的至宝 id 必须全部可解析（真调 lootById / petEntryById）');
const bad = [...refs.entries()].filter(([id]) => !resolvable(id));
console.log('    扫描 ' + SRC_FILES.length + ' 个数据文件，引用 id ' + refs.size + ' 个');
ck('A1 全部引用 id 在真源里可解析', bad.length === 0,
  bad.slice(0, 10).map(([id, loc]) => id + ' ← ' + loc[0]).join(' | '));

// 反证①：判据必须有区分力（否则 A1 是恒真断言）
const fakeProbe = CLEARED.filter((id) => resolvable(id));
ck('A2 反证：9 个已清除的旧悬空 id 逐个真调仍判「不可解析」（证明 A1 不是恒真）',
  fakeProbe.length === 0, '被误判为可解析：' + fakeProbe.join(', '));

// 反证②：判据对真存在的 id 必须判「可解析」
const realProbe = ['lm_bowl', 'bis_an', 'ts_robe_base'].filter((id) => resolvable(id));
ck('A3 反证：3 个真实存在的 id 逐个真调判「可解析」（证明 A2 不是反向恒真）',
  realProbe.length === 3, '实际命中 ' + realProbe.length + '/3');

// A4：旧悬空不得再出现在代码区
const stillThere = CLEARED.filter((id) => refs.has(id));
ck('A4 9 个旧悬空 id 已不在代码区（仅允许留在追溯注释里）', stillThere.length === 0,
  stillThere.map((id) => id + ' ← ' + refs.get(id)[0]).join(' | '));

console.log('\n[B] requireNoTreasure 门槛必须真的能判（行为级，不靠文本）');
// 与 game_event_4.js:183-187 同构：`e.id === tid || e.treasureId === tid`
const makeOwns = (equips) => (tid) => equips.some((e) => e && (e.id === tid || e.treasureId === tid));
const CH2_GATE = ['lm_bowl', 'bis_an'];               // trials_ch2.js:28 改后的值
const OLD_GATE = ['tre_bishuizhu'];                    // 改前的值

// 玩家持避水珠的三种真实形态
const HELD_FORMS = [
  { name: '通用避水珠 lm_bowl', equips: [{ id: 'lm_bowl', treasureId: 'lm_bowl' }] },
  { name: '白龙起始 lm_bowl_fan', equips: [{ id: 'lm_bowl_fan', treasureId: 'lm_bowl' }] },
  { name: '白龙三阶 lm_treasure_ch3', equips: [{ id: 'lm_treasure_ch3', treasureId: 'lm_bowl' }] },
  { name: '避水珠·黯 bis_an', equips: [{ id: 'bis_an' }] },
];
const gateHits = HELD_FORMS.filter((f) => CH2_GATE.some(makeOwns(f.equips)));
ck('B1 持 4 种避水珠形态中的任意一种，门槛都能拦住（' + gateHits.length + '/4）',
  gateHits.length === 4, HELD_FORMS.filter((f) => !CH2_GATE.some(makeOwns(f.equips))).map((f) => f.name).join(' | '));

// 反证：旧 id 拦不住任何形态 —— 这就是「门槛形同虚设」的实锤
const oldHits = HELD_FORMS.filter((f) => OLD_GATE.some(makeOwns(f.equips)));
ck('B2 反证：改前的 tre_bishuizhu 对 4 种形态一律拦不住（实锤旧门槛恒通过＝真 bug）',
  oldHits.length === 0, '竟能命中：' + oldHits.map((f) => f.name).join(' | '));

// 未持宝时必须放行
ck('B3 未持任何避水珠时门槛放行（不误伤正路）',
  !CH2_GATE.some(makeOwns([{ id: 'ts_robe_base' }, { id: 'ss_staff_base' }])));

const nodeTre = NDX.lootById('lm_bowl');
ck('B4 难15 流沙河宝物节点 lm_bowl 真调可解析且确为法宝',
  !!(nodeTre && nodeTre.slot === 'treasure' && /避水珠/.test(nodeTre.name || '')),
  nodeTre ? JSON.stringify({ id: nodeTre.id, name: nodeTre.name, slot: nodeTre.slot }) : 'lootById 返回空');

console.log('\n[C] 章末 Boss 伪掉落节点已删（行为级：trial 真源里 treasure 为空）');
// 章末 Boss 难号 —— 骨架 v1.6:61-71
const ACT_END = [];
for (let a = 1; a <= NDX.TOTAL_ACTS; a++) ACT_END.push(NDX.actEnd(a));
const SHELI_CH = ACT_END.slice(2);   // 三~九章（前两章原本就不是舍利）
const withTre = [];
SHELI_CH.forEach((d) => {
  const tr = NDX.trialByLayer ? NDX.trialByLayer(d, 'wukong') : null;
  const norm = tr ? (NDX.normalizeTrial ? NDX.normalizeTrial(tr) : tr) : null;
  if (norm && norm.treasure && norm.treasure.id) withTre.push(d + '→' + norm.treasure.id);
});
ck('C1 三~九章共 ' + SHELI_CH.length + ' 个章末难，treasure 字段已清空（掉落回落 _heroBaseDrop）',
  withTre.length === 0, withTre.join(' | '));

// 反证：判据能区分「有 treasure」的难 —— 否则 C1 是恒真
const HAS_TRE = 11;   // 难11「黑风山·夺袈裟」真源挂 ts_robe_base
const ctl = NDX.trialByLayer ? NDX.normalizeTrial(NDX.trialByLayer(HAS_TRE, 'wukong')) : null;
ck('C2 反证：难' + HAS_TRE + ' 的 treasure 确实非空（证明 C1 不是恒真）',
  !!(ctl && ctl.treasure && ctl.treasure.id), ctl ? JSON.stringify(ctl.treasure) : '取不到难' + HAS_TRE);

console.log('\n[D] 防回归：相关注释不得再引用失真数字');
const alignSrc = fs.readFileSync(path.join(__dirname, '_verify_hero_trials_align.js'), 'utf8');
ck('D1 _verify_hero_trials_align.js 不再声称「11 处悬空」（旧账数字不准，实测 9 个）',
  !/确有\s*11\s*处悬空/.test(alignSrc));

console.log('\n———— ' + pass + ' 通过 / ' + fail + ' 失败 ————');
process.exit(fail ? 1 : 0);
