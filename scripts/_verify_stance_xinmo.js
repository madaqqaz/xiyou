// _verify_stance_xinmo.js — STANCE 攻守姿态心魔单一入口门禁（2026-09-14）
// ---------------------------------------------------------------------------
// 背景：STANCE（战前攻守姿态）曾在战斗内核内直写 NDX.game.state.xinmo（绕过唯一写入入口
//   gainXinmo），被 _verify_xinmo_single_source.js B 段源码守卫判红。本门禁锁死其正确形态：
//   ① 战斗内核不写全局态，改在 res.stanceXinmo 返回「本场净量」（无 stanceSeq 时为 0，零副作用）；
//   ② 净量经唯一入口 gainXinmo 落账，可加可撤；setStance 切换即「撤销旧净量 + 落账新净量」，
//      不会累积（攻→守切换后 = 入场值 + 守态净量，而非 入场 + 攻 + 守）。
// 运行：node scripts/_verify_stance_xinmo.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

// —— 浏览器最小桩（index.html 全量脚本注入，与 _smoke_boss_hook.js 同范式）——
const _noop = () => {};
const _store = {};
const sb = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON,
  navigator: { userAgent: 'node' },
  localStorage: { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; } },
  document: {
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
    querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
};
sb.window = sb; sb.global = sb; sb.self = sb;
const ctx = vm.createContext(sb);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
files.forEach((f) => {
  if (/^https?:/.test(f)) return;
  const p = f.split('?')[0];
  if (!fs.existsSync(path.join(ROOT, p))) return;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p }); } catch (e) { }
});
const NDX = sb.NDX;

const player = () => ({
  heroId: 'tangseng', good: 0, spd: 12,
  ti: { atk: 140, atkB: 0, fixAtk: 0, maxHp: 1500, curHp: 1500, hp: 1500, dr: 0, mdef: 40 },
  yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
  reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
});
const monster = () => ({ name: '试炼妖', hp: 700, atk: 70, matk: 30, dr: 0, spd: 7, type: 'mob', diff: 1 });

console.log('\n[STANCE 攻守姿态心魔单一入口] 门禁');

// —— 1) 内核返回净量，且不再依赖 NDX.game（无全局态也能算）——
const rAtk = NDX.calcCombat(player(), monster(), { stanceSeq: ['ATK'] });
const rGd = NDX.calcCombat(player(), monster(), { stanceSeq: ['GUARD'] });
const rNone = NDX.calcCombat(player(), monster());
ck('S1 攻态 res.stanceXinmo > 0（每日 +2，净量为正）', typeof rAtk.stanceXinmo === 'number' && rAtk.stanceXinmo > 0, 'v=' + rAtk.stanceXinmo);
ck('S2 守态 res.stanceXinmo < 0（每日 -2，净量为负）', typeof rGd.stanceXinmo === 'number' && rGd.stanceXinmo < 0, 'v=' + rGd.stanceXinmo);
ck('S3 老调用（无 stanceSeq）净量为 0（零副作用，向后兼容）', !rNone.stanceXinmo, 'v=' + rNone.stanceXinmo);
ck('S4 攻守净量对称（|ATK| ≈ |GUARD|，同场次）', Math.abs(rAtk.stanceXinmo + rGd.stanceXinmo) <= 2,
  'atk=' + rAtk.stanceXinmo + ' guard=' + rGd.stanceXinmo);

// —— 2) 净量经唯一入口 gainXinmo 落账 / 撤销（复刻 fight→setStance 切换）——
const g = Object.create(NDX.Game.prototype);
g.pushLog = _noop; g.toast = _noop;
const OPT = { cap: false, countGain: false, quota: false, silent: true, source: 'stance' };
g.state = { xinmo: 60, xinmoChGain: 0, act: 1 };
const appliedAtk = g.gainXinmo(rAtk.stanceXinmo, OPT);
ck('S5 攻态净量落账：xinmo = 入场 + 净量（实量=净量）', g.state.xinmo === 60 + rAtk.stanceXinmo && appliedAtk === rAtk.stanceXinmo,
  'xinmo=' + g.state.xinmo + ' applied=' + appliedAtk);
g.gainXinmo(-appliedAtk, OPT);
ck('S6 撤销攻态净量后精确复位到入场值', g.state.xinmo === 60, 'xinmo=' + g.state.xinmo);
g.gainXinmo(rGd.stanceXinmo, OPT);
ck('S7 守态落账后 = 入场 + 守态净量（非累积 入场+攻+守）', g.state.xinmo === 60 + rGd.stanceXinmo,
  'xinmo=' + g.state.xinmo + ' (expected ' + (60 + rGd.stanceXinmo) + ')');
ck('S8 切换守态后心魔低于入场值（守态安心魔）', g.state.xinmo < 60, 'xinmo=' + g.state.xinmo);

// —— 3) 源码守卫：战斗内核区不得出现全局心魔直写 ——
const cp1 = fs.readFileSync(path.join(ROOT, 'js/combat_part1.js'), 'utf8');
ck('S9 战斗内核无 _gstate.xinmo 直写（改经 res.stanceXinmo 透传）', !/_gstate\s*\.\s*xinmo\s*=/.test(cp1) && !/_gstate\s*=/.test(cp1));
const gc1 = fs.readFileSync(path.join(ROOT, 'js/game/game_combat_1.js'), 'utf8');
ck('S10 接线层无 s.xinmo 直写（唯一入口 gainXinmo）', !/s\.xinmo\s*=(?!=)/.test(gc1));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
