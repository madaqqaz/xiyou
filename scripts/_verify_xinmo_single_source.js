#!/usr/bin/env node
// =============================================================
// _verify_xinmo_single_source.js — 心魔系统唯一写入入口门禁（2026-09-12 P0-1/P0-3）
// A 段：功能断言（vm 桩环境加载真源 game_event_3.js 的 gainXinmo）
// B 段：源码守卫（全仓扫描 s.xinmo 直写，白名单外一律 FAIL）
// C 段：常量化与视觉接线落位断言（MIRROR_FALLBACK / MAXHP_LOSS_CAP / RiskVisual 接线）
// 用法：node scripts/_verify_xinmo_single_source.js   （通过 exit 0）
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

// ---------- A 段：vm 桩环境加载真源 ----------
const sandbox = { window: {}, console, Math };
sandbox.window.NDX = sandbox.window.NDX || {};
sandbox.NDX = sandbox.window.NDX;
vm.createContext(sandbox);
try {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data_xinmo.js'), 'utf8'), sandbox, { filename: 'data_xinmo.js' });
  // V9.7：心魔三档念经依赖寿命天数制真源（daysToYears / fmtLife），桩环境须一并加载
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data_life.js'), 'utf8'), sandbox, { filename: 'data_life.js' });
  vm.runInContext('NDX.Game = function NDXGameStub() {};', sandbox, { filename: 'stub.js' });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/game/game_event_3.js'), 'utf8'), sandbox, { filename: 'game_event_3.js' });
} catch (e) {
  console.log('  ✗ 桩环境加载真源失败: ' + e.message);
  process.exit(1);
}
const NDX = sandbox.NDX;
ck('A0 真源加载：NDX.XINMO 与 gainXinmo 就位', !!(NDX.XINMO && NDX.Game && NDX.Game.prototype.gainXinmo && NDX.Game.prototype._gainXinmo));

// 桩 Game 实例：捕获 log/toast 与配额
function mkGame(state) {
  const logs = [], toasts = [];
  const g = new NDX.Game();
  g.state = state;
  g.pushLog = (m) => logs.push(m);
  g.toast = (m) => toasts.push(m);
  g._logs = logs; g._toasts = toasts;
  return g;
}
const quota = {};
NDX.quotaEnabled = () => true;
NDX.addQuota = (s, k, v) => { quota[k] = (quota[k] || 0) + v; };

// A1 六道口径：章封顶生效
{
  const g = mkGame({ xinmo: 0, xinmoChGain: 0, act: 1 });
  // V9.7：跨 30/60 会触发「三档念经」（降魔+耗天），此段只测入口/封顶语义，故 noChant 隔离
  const d1 = g.gainXinmo(15, { noChant: true });           // 0→15
  const d2 = g.gainXinmo(15, { noChant: true });           // 15→30
  const d3 = g.gainXinmo(15, { noChant: true });           // 30→45（ChGain 30<35 仍放行）
  const d4 = g.gainXinmo(15, { noChant: true });           // ChGain 45≥35 → 封顶拦截
  ck('A1 六道口径：+15×3 放行、第 4 次章封顶拦截', d1 === 15 && d2 === 15 && d3 === 15 && d4 === 0,
    'd=' + [d1, d2, d3, d4].join(','));
  ck('A1b 章封顶后 xinmo 不变', g.state.xinmo === 45, 'xinmo=' + g.state.xinmo);
}
// A2 cap:false 豁免（罪业贸易口径）
{
  const g = mkGame({ xinmo: 10, xinmoChGain: 35, act: 1 });
  const d = g.gainXinmo(40, { cap: false, noChant: true });
  ck('A2 cap:false 可越过章封顶（贸易口径）', d === 40 && g.state.xinmo === 50, 'd=' + d);
}
// A3 负值与下限钳制 + 涤心跨档播报
{
  const g = mkGame({ xinmo: 50, xinmoChGain: 0, act: 1 });
  const n0 = g._logs.length;
  const d = g.gainXinmo(-200, { cap: false });
  ck('A3 负增长钳到 0 且返回实量', d === -50 && g.state.xinmo === 0, 'd=' + d);
  ck('A3b 跨档播报：降至 0 触发涤心 log', g._logs.length > n0);
}
// A4 MAX 上限钳制
{
  const g = mkGame({ xinmo: 95, xinmoChGain: 0, act: 1 });
  const d = g.gainXinmo(999, { cap: false, silent: true });
  ck('A4 触 MAX 钳到 100、实量 +5', d === 5 && g.state.xinmo === 100, 'd=' + d);
  const d2 = g.gainXinmo(10, { cap: false });
  ck('A4b 已满再涨实量为 0', d2 === 0 && g.state.xinmo === 100);
}
// A5 配额按实量记账
{
  quota.xinmo = 0;
  const g = mkGame({ xinmo: 92, xinmoChGain: 0, act: 1 });
  g.gainXinmo(15, { cap: false });
  ck('A5 配额按实量记账（92+15 触顶只计 8）', quota.xinmo === 8, 'quota=' + quota.xinmo);
}
// A6 跨档播报：30/60/85/100
{
  const g = mkGame({ xinmo: 0, xinmoChGain: 0, act: 1 });
  g.gainXinmo(31, { cap: false, noChant: true }); g._logs.length = 0;
  g.gainXinmo(29, { cap: false, noChant: true });
  ck('A6 跨 60 档播报「暗生」', g._logs.some((m) => m.indexOf('暗生') >= 0), g._logs.join('|'));
  g.gainXinmo(25, { cap: false, noChant: true }); g._logs.length = 0;   // 60→85
  g.gainXinmo(15, { cap: false, noChant: true });                        // 85→100 跨「临门」
  ck('A6b 跨 100 档播报「临门」', g._logs.some((m) => m.indexOf('临门') >= 0), g._logs.join('|'));
}
// A7 silent 静默
{
  const g = mkGame({ xinmo: 0, xinmoChGain: 0, act: 1 });
  const n0 = g._logs.length;
  g.gainXinmo(50, { cap: false, silent: true, noChant: true });
  ck('A7 silent 无播报', g._logs.length === n0);
}
// A8 _gainXinmo 委托：隐+8（渡/缘 0 不写入）
{
  const g = mkGame({ xinmo: 0, xinmoChGain: 0, act: 1, flags: {} });
  g._gainXinmo('渡'); g._gainXinmo('缘');
  ck('A8 渡/缘零心魔', g.state.xinmo === 0);
  g._gainXinmo('隐');
  ck('A8b 隐 +8 且走入口（ChGain 同步）', g.state.xinmo === 8 && g.state.xinmoChGain === 8,
    'xinmo=' + g.state.xinmo + ' ch=' + g.state.xinmoChGain);
}

// ---------- B 段：源码守卫 —— s.xinmo 直写白名单 ----------
// 归一化：压缩空白后按「文件 + 语句形态」白名单。白名单外任何 s.xinmo = 直写 → FAIL。
// V9.7：镜战双出口（胜/败）均已改走 gainXinmo 入口，game_event_4 / game_combat_2 的直写随之清零
const ALLOW = {
  'game_event_3.js': ['s.xinmo=Math.max(0,Math.min(X.MAX||100,before+n));'],
  'game_rest.js': ['s.xinmo=Math.max(0,(s.xinmo||0)-cut);'],
  'game_region.js': ['s.xinmo=Math.max(0,(s.xinmo||0)-cut);'],
  'jieseals.js': ['pay:(s,n)=>{s.xinmo=Math.max(0,(s.xinmo||0)-n);},'],
};
const jsDir = path.join(ROOT, 'js');
const offenders = [];
function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    if (!e.name.endsWith('.js')) return;
    const src = fs.readFileSync(p, 'utf8');
    const rel = path.relative(jsDir, p).replace(/\\/g, '/');
    src.split(/\r?\n/).forEach((line, i) => {
      const m = line.match(/s\.xinmo\s*=(?!=)/);
      if (!m) return;
      const norm = line.trim().replace(/\s+/g, '');
      const base = path.basename(p);
      const ok = (ALLOW[base] || []).some((pat) => norm === pat.replace(/\s+/g, ''));
      if (!ok) offenders.push(rel + ':' + (i + 1) + '  ' + line.trim().slice(0, 80));
    });
  });
}
walk(jsDir);
ck('B1 全仓 s.xinmo 直写白名单守卫（' + Object.keys(ALLOW).length + ' 文件白名单）', offenders.length === 0,
  offenders.slice(0, 4).join(' | '));

// ---------- C 段：常量化与视觉接线 ----------
{
  const dx = fs.readFileSync(path.join(ROOT, 'js/data_xinmo.js'), 'utf8');
  ck('C1 MIRROR_FALLBACK 常量就位（V9.7 改 60）', /MIRROR_FALLBACK:\s*60/.test(dx));
  ck('C2 三档念经常量就位（30→3 / 60→6 / fail→15 天）',
    /CHANT_DAYS:\s*\{\s*30:\s*3,\s*60:\s*6,\s*fail:\s*15\s*\}/.test(dx));
  const e4 = fs.readFileSync(path.join(ROOT, 'js/game/game_event_4.js'), 'utf8');
  ck('C3 战败回悬走 MIRROR_FALLBACK 且经 gainXinmo 入口（无直写）',
    /s\.xinmo\s*=\s*(70|60);/.test(e4) === false && e4.indexOf('X.MIRROR_FALLBACK') >= 0
    && e4.indexOf('this.gainXinmo(') >= 0);
  ck('C4 V9.7 惩罚简化：不再削减气血上限 / 不再夺印',
    /BATTLE_MAXHP_LOSS:\s*0/.test(dx) && /SEAL_LOSS:\s*false/.test(dx)
    && e4.indexOf('xinmoMaxHpLoss') < 0 && e4.indexOf('s.seals.splice') < 0);
  const uc = fs.readFileSync(path.join(ROOT, 'js/ui/ui_core.js'), 'utf8');
  ck('C5 RiskVisual 已接线 render 总线', uc.indexOf('NDX.RiskVisual.update') >= 0 && uc.indexOf("NDX.bus.on('render'") >= 0);
  const rv = fs.readFileSync(path.join(ROOT, 'js/ui/ui_risk_visual.js'), 'utf8');
  ck('C6 RiskVisual.update 汇聚三特效（立绘/寿数/临门）', /RiskVisual\.update\s*=\s*function/.test(rv)
    && rv.indexOf('updateHeroDarken') >= 0 && rv.indexOf('updateLifeWarning') >= 0 && rv.indexOf('triggerXinmoClimax') >= 0);
}

// ---------- E 段：V9.7 三档念经（跨档自动念经：耗天 + 降魔）----------
{
  const X2 = NDX.XINMO || {};
  const D0 = (NDX.LIFE && NDX.LIFE.DAYS_PER_YEAR) || 360;
  // E1 跨 30：念经 3 天 + 降魔 20
  const g1 = mkGame({ xinmo: 0, xinmoChGain: 0, act: 1, life: 23, mode: 'outbound' });
  g1._loseLife = function (n) { this.state.life = Math.max(0, (this.state.life || 0) - n); };
  g1.gainXinmo(35, { cap: false });
  const rel30 = (X2.CHANT_RELEASE || {})[30] || 0;
  const day30 = (X2.CHANT_DAYS || {})[30] || 0;
  ck('E1 跨 30 档：自动念经降魔（xinmo = 35 - ' + rel30 + '）',
    g1.state.xinmo === 35 - rel30, 'xinmo=' + g1.state.xinmo);
  ck('E2 跨 30 档：耗寿 ' + day30 + ' 天（life 精确 -' + (day30 / D0) + ' 年）',
    Math.abs(g1.state.life - (23 - day30 / D0)) < 1e-9, 'life=' + g1.state.life);
  ck('E3 念经日志落盘', g1._logs.some((m) => m.indexOf('念经') >= 0), g1._logs.join('|'));
  // E4 跨 60：念经 6 天
  const g2 = mkGame({ xinmo: 55, xinmoChGain: 0, act: 1, life: 23, mode: 'outbound' });
  g2._loseLife = function (n) { this.state.life = Math.max(0, (this.state.life || 0) - n); };
  g2.gainXinmo(10, { cap: false });
  const rel60 = (X2.CHANT_RELEASE || {})[60] || 0;
  const day60 = (X2.CHANT_DAYS || {})[60] || 0;
  ck('E4 跨 60 档：降魔 ' + rel60 + '、耗寿 ' + day60 + ' 天',
    g2.state.xinmo === 65 - rel60 && Math.abs(g2.state.life - (23 - day60 / D0)) < 1e-9,
    'xinmo=' + g2.state.xinmo + ' life=' + g2.state.life);
  // E5 noChant 隔离（测试/剧情口径可豁免）
  const g3 = mkGame({ xinmo: 0, xinmoChGain: 0, act: 1, life: 23, mode: 'outbound' });
  g3.gainXinmo(35, { cap: false, noChant: true });
  ck('E5 noChant:true 时不念经（xinmo 不回落、life 不动）',
    g3.state.xinmo === 35 && g3.state.life === 23, 'xinmo=' + g3.state.xinmo);
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
if (fail > 0) { fails.forEach((f) => console.log('  FAIL: ' + f)); process.exit(1); }
