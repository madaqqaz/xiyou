// _verify_jing_slot_ui.js — 经位 UI 装配门禁（V9.32：经位目录 = 既有 34 部）
// 断言：Game.prototype.setJingSlot 包装层正确（main.js 以 g.setJingSlot(slot, fullId) 调用），
// 装/卸/越权三态与 data 层 NDX.setJingSlot 对齐，且经位聚合 / 生命周期随之生效。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data_sutra.js'), 'utf8'), sandbox);
// data_sutra 通过 window.NDX 暴露；让 bare NDX 与 window.NDX 指向同一对象，供 game_sutra.js 的 NDX.Game.prototype.* 写入
sandbox.NDX = win.NDX;
// Game 构造器占位：门禁只测 prototype 方法，不跑完整战斗
win.NDX.Game = function () {};
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'game', 'game_sutra.js'), 'utf8'), sandbox);
const NDX = win.NDX;

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };

// Game 实例工厂：仅注入经位门禁所需的最小 state + 空 pushLog
function makeGame(state) {
  const g = Object.create(NDX.Game.prototype);
  g.state = state;
  g.pushLog = function () {};
  return g;
}

// 1) 包装层存在
if (typeof NDX.Game.prototype.setJingSlot !== 'function') {
  failMsg('Game.prototype.setJingSlot 未定义（main.js 装配入口缺失）');
} else {
  // 2) 装：已持有的经（有 chantSkill → 有经位身份）可装入对应格
  //    圆觉经 = war-buff → 攻击格；大悲咒 = zen-heal → 诵经格
  const s = { sutras: ['su_full_yuanjue'], niSutras: ['su_full_dabei'] };
  const g = makeGame(s);
  if (g.setJingSlot('atk', 'su_full_yuanjue') !== true) failMsg('setJingSlot(atk, 圆觉经) 应成功');
  if (s.jingSlots.atk !== 'su_full_yuanjue') failMsg('setJingSlot 后 atk 格未写入');
  if (g.setJingSlot('chant', 'su_full_dabei') !== true) failMsg('setJingSlot(chant, 大悲咒) 应成功');
  // 3) 聚合 / 战斗生命周期随之生效
  if ((NDX.jingSlotMods(s).atk || {}).crit !== 0.12) failMsg('装配后 atk 聚合 crit 期望 0.12');
  if (NDX.battleModsOf(s).regenPct !== 0.04) failMsg('装配后 chant 大悲咒 regen 期望 0.04');
  // 4) 越权：未持有的经不可装
  if (g.setJingSlot('chant', 'su_full_fanwang') !== false) failMsg('未持有经(梵网经) 不应可装');
  // 4b) 越权：已废弃的 V9.28 自造经 id 不可装（目录已删）
  if (g.setJingSlot('atk', 'su_ch3_pozhang') !== false) failMsg('已废弃的章经 id 不应可装');
  // 4c) 越权：不存在的 id 不可装
  if (g.setJingSlot('atk', '不存在的经') !== false) failMsg('不存在 id 不应可装');
  // 5) 卸：传 null 清空该格
  if (g.setJingSlot('atk', null) !== true) failMsg('setJingSlot(atk, null) 应成功卸下');
  if (s.jingSlots.atk !== null) failMsg('卸下后 atk 格应为 null');
  // 6) 卸 atk 不改其它格（chant 现为大悲咒）
  if (s.jingSlots.chant !== 'su_full_dabei') failMsg('卸 atk 不应影响 chant 格');
}

// 7) main.js 调用形态对齐：g.setJingSlot(slot, fullId) 双参（非 data 层三参 s, slot, fullId）
{
  const s = { sutras: ['su_full_jingang'] };
  const g = makeGame(s);
  if (g.setJingSlot('atk', 'su_full_jingang') !== true) failMsg('双参签名 g.setJingSlot(slot, id) 形态不符');
}

if (fail === 0) console.log('ok / 经位 UI 装配门禁通过');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
