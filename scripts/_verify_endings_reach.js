// _verify_endings_reach.js — 结局**可达性**门禁（2026-09-27 · 修「缘定三生」永不可达 P0）
// 背景（真 P0）：`endings.js:90` 的「缘定三生」要求 `_hasBajie && _hasShaseng`，
//   而 `_hasBajie` 判 `s.flags.ally.bajie` —— `game_event_3.js:625` 是 `effect.ally` 的**唯一**
//   写入端，全仓 38 个 `effect.ally` 取值里**没有 `bajie`**（全是妖形 id，如 `shaseng_ren` / `baigujing`）
//   ⇒ `s.flags.ally.bajie` 结构性恒 false ⇒ 写好了完整 text 的结局**永不可达**。
//   根因：八戒不是「可收妖」，他是**五英雄之一**，本就随行，压根不存在「收八戒」事件。
// 修法（2026-09-27）：`_hasBajie` 改判「八戒在身边」= 本人即八戒 ∨ `ally.bajie`（保留扩展位）。
//
// ⚠ 本门禁**不做任何静态文本断言** —— 按 X4 教训「门禁绿 ≠ 做对」，只做**运行期真调** `cond(s)`：
//   ① 正证：满足全部门槛的八戒样本必须命中；② 反证：任一门槛不足 / 换英雄都必须**不命中**
//   （防止判据退化成恒真）；③ 反证：验证判据已不再依赖那个永远写不进去的 `ally.bajie`。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };
const pass = (c, m) => { if (c) console.log('  ok · ' + m); };

// ── 沙箱：按产品顺序静默加载，缺依赖不阻断（与 _verify_skill_variant 同款思路）──
const win = {};
const sandbox = { NDX: {}, window: win, console: { log() {} }, Math: Math, JSON };
vm.createContext(sandbox);
const load = (f) => {
  try { vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), sandbox); }
  catch (e) { /* 依赖缺失交由下面的存在性断言暴露 */ }
};
load('data_config.js');
load('endings.js');
const NDX = win.NDX;

console.log('=== _verify_endings_reach：结局可达性（运行期真调，无静态断言）===');

// ── A 组 · 导出面存在 ──
const DEFS = NDX && NDX.Ending && NDX.Ending.DEFINITIONS;
ok(!!DEFS, 'A0 NDX.Ending.DEFINITIONS 已导出（结局判定可被外部真调）');
const yuanding = DEFS && DEFS.yuanding;
ok(!!yuanding, 'A1 结局「缘定三生」定义存在（写好的 text 不该白瞎）');
const cond = yuanding && yuanding.cond;
ok(typeof cond === 'function', 'A2 yuanding.cond 是可调用判定');

// ── B 组 · 真调反证：任一门槛不足都必须拒 ──
// 样本基线：八戒本人 + 缘道 7（≥6）+ NPC 关系 23（≥20）+ 已收沙僧（_hasShaseng 需 ally.shaseng）
const S = (patch) => Object.assign({
  hero: 'bajie',
  fate: { 缘: 7, 渡: 2 },                                          // _yuanCount = 7 ≥ 6
  npcRel: { 观音: 8, 如来: 6, 玉帝: 4, 太上老君: 3, 妖王: 2 },      // _npcRelSum = 23 ≥ 20
  flags: { ally: { shaseng: true } },                               // _hasShaseng = true
  origin: { hero: 'bajie', before: '天蓬元帅', revealed: true },     // 🆕 _originAwake = true
  good: 5, evil: 1, trials: [], equips: [], choiceFlags: {},
}, patch || {});

const tryCond = (s) => { try { return cond(s); } catch (e) { return 'THROW:' + e.message; } };

// 正证：全部满足 ⇒ 必须命中
ok(tryCond(S()) === true, 'B1 正证：八戒本人 + 缘道7 + 关系23 + 收沙僧 ⇒ cond 为真（P0 已修，可达）');
// 反证：换英雄（悟空）且无 ally.bajie ⇒ 必须拒（防判据退化成恒真）
ok(tryCond(S({ hero: 'wukong', flags: { ally: { shaseng: true } } })) === false,
  'B2 反证：非八戒英雄且无 ally.bajie ⇒ 必须不命中（判据未恒真）');
// 反证：NPC 关系不足 20 ⇒ 必须拒
ok(tryCond(S({ npcRel: { 观音: 1 } })) === false, 'B3 反证：NPC 关系 < 20 ⇒ 必须不命中');
// 反证：缘道不足 6 ⇒ 必须拒
ok(tryCond(S({ fate: { 缘: 3 } })) === false, 'B4 反证：缘道 < 6 ⇒ 必须不命中');
// 反证：沙僧没收 ⇒ 必须拒
ok(tryCond(S({ flags: {} })) === false, 'B5 反证：未收沙僧（_hasShaseng 不成立）⇒ 必须不命中');

// ── C 组 · 本 P0 的核心反证：判据不再依赖「永远写不进去」的 ally.bajie ──
// 修复前：`_hasBajie = s.flags.ally.bajie` ⇒ 任何英雄、任何数据流下都恒 false。
// 现在：同一份满足全部门槛的样本，flags.ally 里**没有** bajie 键，却因「八戒在身边」而成立。
// ⚠ 样本必须给足**全部**门槛（缘道/NPC关系/沙僧），否则「不命中」可能来自别处、证不出本条。
const sCore = S();
ok(!(sCore.flags && sCore.flags.ally && sCore.flags.ally.bajie),
  'C1 前置：该样本的 flags.ally 里确实没有 bajie 键（否则反证无效）');
ok(tryCond(sCore) === true,
  'C1 核心反证：flags.ally 无 bajie，仅凭「本人即八戒」⇒ 命中（旧判据在此必为 false ⇒ P0 已修）');
// 双保险：ally.bajie 位仍被支持（未来若加可收机制，不必二次改判据）
ok(tryCond(S({ hero: 'wukong', flags: { ally: { shaseng: true, bajie: true } } })) === true,
  'C2 扩展位：非八戒英雄 + ally.bajie 置位 ⇒ 同样命中（未砍掉未来的可收机制）');

// ── E 组 · 前身线接入结局（2026-09-27）：忆起是**新增的一关**，不是装饰 ──
//    判据 `_originAwake` 只认 `revealed`，不认 `origin.hero` ⇒ 两条反证必须都成立，
//    否则要么「前身关形同虚设」，要么「把 ally.bajie 扩展位堵死」。
ok(tryCond(S({ origin: { hero: 'bajie', before: '天蓬元帅', revealed: false } })) === false,
  'E1 反证：前身未忆起（revealed=false）⇒ 必须不命中（前身关真的在拦）');
ok(tryCond(S({ origin: null })) === false,
  'E2 反证：无 origin（老档 / 未走送行）⇒ 必须不命中（防判据退化成恒真）');
ok(tryCond(S({ origin: { hero: 'bajie', before: '天蓬元帅', revealed: true, extra: 1 } })) === true,
  'E3 正证：revealed=true 且带无关额外键 ⇒ 仍命中（判据只读 revealed，不挑 origin 结构）');
ok(tryCond(S({ hero: 'wukong', flags: { ally: { shaseng: true, bajie: true } },
  origin: { hero: 'wukong', before: '齐天大圣', revealed: true } })) === true,
  'E4 扩展位未被堵：非八戒英雄 + ally.bajie + 自己忆起前身 ⇒ 仍命中');

// ── D 组 · 优先级面：determineEnding 真跑一遍，确认不是只有 cond 通、实际选不中 ──
const determine = NDX && NDX.Ending && NDX.Ending.determineEnding;
ok(typeof determine === 'function', 'D0 NDX.Ending.determineEnding 可调用');
if (typeof determine === 'function') {
  let hit = null;
  try { hit = determine(S()) || null; } catch (e) { hit = 'THROW:' + e.message; }
  ok(hit && hit.title === '缘定三生',
    'D1 端到端：同一份样本喂进 determineEnding ⇒ 实际选中【缘定三生】'
    + (hit && hit.title ? `（实得「${hit.title}」）` : `（实得 ${JSON.stringify(hit)}）`));
}

if (fail === 0) console.log('=== _verify_endings_reach：A/B/C/D/E 五组共 15 条判据全部真调通过（P0 已修 · 前身关已接入且未退化成恒真）===');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
