#!/usr/bin/env node
// =============================================================
// _verify_return_cost.js — 返程九年（RETURN_COST）【兑现】门禁
// 【2026-09-14 新建】RETURN_COST=9 自 V8.55 定义后从未被真正消费：结算把
//   「到西天余寿」直接当「回长安余寿」返回，结局文案 / 排行榜 life / 归乡档位
//   全部虚高 9 年。而 _verify_life_days 的 A3 只校验常量【有没有定义】——
//   静态断言查不出「定义了却没用」，本项目已第二次栽在这个坑
//   （另一次：finishFight 的 nodeType 块级作用域，node --check 全绿、症状隐形）。
//   故本门禁改为运行时：真正调用 buildReturnScene，断言扣减确实发生。
// R 段：运行时兑现 / 三档边界 / 源码消费点 / 反向反证
// 用法：node scripts/_verify_return_cost.js   （失败 exit 1）
// =============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
const fails = [];
function ck(name, ok, extra) {
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; fails.push(name); console.log('  ✗ ' + name + (extra ? ' —— ' + extra : '')); }
}

// ---------- 桩环境 ----------
const win = {};
const ctx = vm.createContext({
  window: win, document: {}, console, Math, JSON, Date, Object, Array, String, Number,
  Boolean, RegExp, parseInt, parseFloat, isNaN, isFinite, setTimeout, clearTimeout,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
});
ctx.globalThis = ctx;
ctx.NDX = win.NDX = win.NDX || {};

function load(f) {
  try {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
    return true;
  } catch (e) {
    console.log('  ✗ 加载失败 ' + f + ': ' + e.message);
    return false;
  }
}

if (!load('js/data_life.js')) process.exit(1);
const NDX = ctx.NDX;
const L = NDX.LIFE || {};
const RC = L.RETURN_COST;

// data.js 的旁支依赖（与本门禁无关）：stub 掉，只验证返程公式本身
NDX.accountSnapshot = () => ({ gained: [] });
NDX.getDynasty = () => ({ name: '唐', full: '大唐' });
NDX.isRedEquip = () => false;
if (!load('js/data.js')) process.exit(1);

// ---------- R 段 ----------
ck('R0 buildReturnScene 真源就位', typeof NDX.buildReturnScene === 'function');
ck('R1 RETURN_COST 为整数年且 >0', Number.isInteger(RC) && RC > 0, 'RC=' + RC);
// 语义自洽：SHRINE_R 就是「付不起返程费」的线，两者必须同为 RETURN_COST
ck('R2 SHRINE_R 与 RETURN_COST 语义一致（余寿<返程费 → 付不起 → 坐化）',
  L.SHRINE_R === RC, 'SHRINE_R=' + L.SHRINE_R + ' RC=' + RC);

const mk = (life) => ({ life, good: 0, evil: 0, act: 9, trialsPassed: [], hero: 'tangseng', equips: [], playerName: 'T' });
const run = (life) => { try { return NDX.buildReturnScene(mk(life)); } catch (e) { return { __err: e.message }; } };

// 主用例：当前实际盘面（单局净耗 0.93 年 → 到西天余 22.07）
const A = run(22.07);
ck('R3 返程九年已兑现：years = 到西天余寿 − 9（22.07 → 13，而非虚高的 22）',
  !A.__err && A.years === 13, 'years=' + (A.__err || A.years));
ck('R4 保留到西天原值 shrineLife 供演出引用（22.07 → 22）',
  !A.__err && A.shrineLife === 22, 'shrineLife=' + (A.__err || A.shrineLife));
ck('R5 完美判定仍按【到西天余寿】与 PERFECT_R=14 比较（22.07 ≥ 14 → 完美）',
  !A.__err && A.perfect === true && A.grade === 'return', 'perfect=' + (A.__err || A.perfect));

// 三档边界
const B = run(14);      // 恰好踩完美线：回长安余 5 年（45 岁归）
ck('R6 下边界 R=14（完美线）：回长安余 5 年、判定完美',
  !B.__err && B.years === 5 && B.perfect === true, 'years=' + (B.__err || B.years));
const C = run(13.99);   // 差一点点
ck('R7 R=13.99：跌出完美（迟归），回长安余 4 年',
  !C.__err && C.perfect === false && C.years === 4, 'perfect=' + (C.__err || C.perfect) + ' years=' + (C.__err || C.years));
const D2 = run(9);      // 刚好够返程费：归长安即油尽
ck('R8 R=9（够付返程费）：可归，回长安余 0 年',
  !D2.__err && D2.grade === 'return' && D2.years === 0, 'grade=' + (D2.__err || D2.grade));
const E = run(8.99);    // 付不起
ck('R9 R=8.99（付不起返程费）：坐化留舍利塔',
  !E.__err && E.grade === 'shrine', 'grade=' + (E.__err || E.grade));

// 源码消费点守卫：防止有人把扣减代码删掉（A3 那种只查定义的断言抓不到这个）
const srcData = fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8');
const srcMeta = fs.readFileSync(path.join(ROOT, 'js/game/game_meta.js'), 'utf8');
ck('R10 data.js 结算处存在 RETURN_COST 消费（非仅注释）',
  /RETURN_COST/.test(srcData) && /left\s*-\s*RC/.test(srcData));
ck('R11 game_meta.js settleReturn 真正扣减 s.life',
  /s\.life\s*=\s*Math\.max\(\s*0\s*,\s*\(s\.life\s*\|\|\s*0\)\s*-\s*_rc\s*\)/.test(srcMeta));

// 反向反证：把 RETURN_COST 改成 0，years 必须退回「不扣减」的旧值
// （若 years 不受 RC 影响，说明扣减只是摆设——这条能当场抓住「假兑现」）
const oldRC = L.RETURN_COST;
L.RETURN_COST = 0;
const Z = run(22.07);
L.RETURN_COST = oldRC;
ck('R12 反向反证：RC 置 0 后 years 退回未扣减值（证明 years 真受返程费驱动）',
  !Z.__err && Z.years === 22, 'years=' + (Z.__err || Z.years));

console.log('\n  通过 ' + pass + ' / 失败 ' + fail);
if (fail) { console.log('  失败项：' + fails.join(' | ')); process.exit(1); }
