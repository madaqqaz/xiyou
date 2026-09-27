// =============================================================
// _verify_operation_point.js — 操作点（识破 / 破韧）行为门禁
//
// 依据：用户拍板 2026-09-25「P1」
//   · P1-C 操作点瘦身：删掉第 4 类「周期 routine 窗口」—— 它原本承担的「择机用牌」
//     已由两个**常驻按钮**接管（法宝 op-manual / 气势 op-burst-hud），只剩无谓暂停演出。
//   · P1-B 自动战斗不再被操作点打断：自动模式（非 Boss）下按「按兵不动 / 放弃破韧」处理，
//     走挂机兜底（idle 奖励），不弹限时窗口；手动才享 识破/狂暴逆转/濒死续命 与 claim 厚赏。
//
// 本门禁锁死三条：① routine 不得复活 ② 自动短路不得被移除 ③ 保留项不得被误删
// =============================================================
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
function code(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

let pass = 0, fail = 0;
function ck(name, cond) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

const p1 = code('js/combat_part1.js');
const mj = code('js/main.js');
const eq = code('js/data_equip_core.js');

console.log('【① 操作点三窗口：routine 不得复活】');
ck("combat_part1 不含 operationPoint = 'routine' 赋值", !/operationPoint\s*=\s*'routine'/.test(p1));
ck('combat_part1 不含 _routineEvery（周期常量已删）', !/_routineEvery/.test(p1));
ck('combat_part1 不含 _rbDropped（小怪破爆发兜底标记已删）', !/_rbDropped/.test(p1));
ck("保留 telegraph 窗口（识破独占钩子）", /operationPoint\s*=\s*'telegraph'/.test(p1));
ck("保留 enrage 窗口（狂暴逆转）", /operationPoint\s*=\s*'enrage'/.test(p1));
ck("保留 lowhp 窗口（濒死续命）", /operationPoint\s*=\s*'lowhp'/.test(p1));
ck('保留教学战豁免 _isTutorialFight', /_isTutorialFight/.test(p1));
ck('保留 stageBreakPoint 破韧通道（多阶段 Boss）', /stageBreakPoint/.test(p1));

console.log('\n【② 自动战斗短路：不得被移除】');
ck('main 破韧分支含 p.autoFight 短路', /p\.autoFight\s*&&\s*!_isBossStage/.test(mj));
ck('main 操作点分支含 p.autoFight 短路', /p\.autoFight\s*&&\s*!_isBossOp/.test(mj));
ck('自动放弃破韧会标记 stageBreakHandled', /stageBreakHandled\s*=\s*p\.stageBreakHandled\s*\|\|\s*\[\][\s\S]{0,200}stageBreakHandled\.push\(p\.roundIdx\s*\+\s*1\)/.test(mj));
ck('自动放弃操作点会标记 opHandled', /_opHandledArr\.push\(p\.roundIdx\s*\+\s*1\)/.test(mj));
ck('Boss 战仍强制手动（V8.45 保留）', /BOSS 战强制手动操作/.test(mj) || /p\.autoFight\s*&&\s*p\.res\.monsterTags/.test(mj));
ck('手动路径仍设置 p.awaitOp（未误伤）', /p\.awaitOp\s*=\s*p\.roundIdx\s*\+\s*1/.test(mj));
ck('手动路径仍设置 p.awaitStageBreak（未误伤）', /p\.awaitStageBreak\s*=\s*p\.roundIdx\s*\+\s*1/.test(mj));
ck('限时倒计时调用保留（手动路径）', /startOpCountdown\(p,\s*g\)/.test(mj) && /startStageBreakTimer\(p,\s*g\)/.test(mj));

console.log('\n【③ 常驻按钮：routine 被取代的前提】');
ck('法宝常驻按钮 op-manual 仍在', /case\s*'op-manual'/.test(mj));
ck('气势常驻按钮 op-burst-hud 仍在', /case\s*'op-burst-hud'/.test(mj));
ck('resolveManualTreasure 仍在（随时祭宝）', /resolveManualTreasure/.test(mj));
ck('resolveHudBurst 仍在（随时爆发）', /resolveHudBurst/.test(mj));
ck('OP_POINT_TIP 表仍在', /NDX\.OP_POINT_TIP\s*=/.test(eq));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
