#!/usr/bin/env node
// _smoke_xinmo_purify.js — 心魔·土地庙主动净化冒烟测试（V9.9 用户裁定：耗寿15天·心魔−15%）
// 真实加载 data_life.js（daysToYears 真源）+ game_rest.js（chooseRest 真源），stub 渲染/播报，
// 验证 purify-xinmo 分支的扣天、降魔、双拦截。node scripts/_smoke_xinmo_purify.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const sandbox = { window: {}, console, Math };
sandbox.window.NDX = sandbox.window.NDX || {};
sandbox.NDX = sandbox.window.NDX;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data_life.js'), 'utf8'), sandbox, { filename: 'data_life.js' });
sandbox.NDX.Game = function NDXGameStub() {};
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/game/game_rest.js'), 'utf8'), sandbox, { filename: 'game_rest.js' });
const NDX = sandbox.NDX;

let pass = 0, fail = 0; const fails = [];
function ck(n, ok, ex) { if (ok) { pass++; console.log('  ✓ ' + n); } else { fail++; fails.push(n); console.log('  ✗ ' + n + (ex ? ' —— ' + ex : '')); } }

function mkGame(xinmo, life) {
  const g = new NDX.Game();
  g.state = { xinmo, life, seals: [], equips: [] };
  g._logs = []; g.pushLog = (m) => g._logs.push(m);
  g._toast = null; g.toast = (m) => { g._toast = m; };
  g.render = () => {};
  g._loseLife = (y) => { g.state.life = Math.max(0, g.state.life - y); };
  return g;
}

// T1 正常：心魔100 → 85（-15%），寿数 30 → 30 - 15/360
{
  const g = mkGame(100, 30);
  g.chooseRest('purify-xinmo');
  ck('T1 心魔 100 → 85（-15%）', Math.round(g.state.xinmo) === 85, 'xinmo=' + g.state.xinmo);
  ck('T1 寿数扣 15/360 年', Math.abs(g.state.life - (30 - 15 / 360)) < 1e-9, 'life=' + g.state.life);
}
// T2 低心魔：10 → ceil(1.5)=2 → 8
{
  const g = mkGame(10, 30); g.chooseRest('purify-xinmo');
  ck('T2 心魔 10 → 8（ceil 15%）', g.state.xinmo === 8, 'xinmo=' + g.state.xinmo);
}
// T3 心魔0：不净化，给提示
{
  const g = mkGame(0, 30); g.chooseRest('purify-xinmo');
  ck('T3 心魔0 不净化（xinmo 不变）', g.state.xinmo === 0);
  ck('T3 触发提示', !!g._toast, 'toast=' + g._toast);
}
// T4 寿数不足：拦截，不动
{
  const g = mkGame(50, 0.01); g.chooseRest('purify-xinmo');
  ck('T4 寿数不足拦截（life/xinmo 不变）', g.state.life === 0.01 && g.state.xinmo === 50, 'life=' + g.state.life + ' xinmo=' + g.state.xinmo);
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
if (fail > 0) { fails.forEach((f) => console.log('  FAIL: ' + f)); process.exit(1); }
