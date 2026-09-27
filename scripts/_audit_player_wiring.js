// _audit_player_wiring.js — 装配层接线审计（R1 / R10，W1–W4）
// ---------------------------------------------------------------------------
// 背景：_playerObj（game_combat_1.js）是「属性结算结果 st → 战斗内核 _playerObj」的
//   唯一装配点。文档 R1/R10 指出该白名单曾漏拷 immuneDeath/hpDrainPct/coll 四键/
//   finalDamage/engineTier/petPassive/petCombo/followerSkills，导致：
//   · immuneDeath=true 必死局 ReferenceError（TDZ，已修）
//   · coll 四键读 s.*（恒 0）而非 st.*（R1② 已修，启用业藏录加成，须 S18 重定标）
//   · 身份字段未透传 → 六职/灵宠/随从三条构筑轴被卡（R10，须 S18 重定标）
// 本审计锁死装配点形态：W1 关键身份字段存在（供透传）；W2 immuneDeath/hpDrainPct 已进；
//   W4 coll 四键改读 st.* 且不再死读 s.*。
// 运行：node scripts/_audit_player_wiring.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ck = (n, c, e) => {
  if (c) { pass++; console.log('  ✓ ' + n); }
  else { fail++; console.log('  ✗ ' + n + (e != null ? ' — ' + e : '')); }
};

// —— 浏览器最小桩（与 _verify_stance_xinmo.js 同范式）——
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

console.log('\n[装配层接线审计 R1/R10] W1–W4');

// 取 _playerObj 装配段（game_combat_1.js 内 _playerObj = { ... } 直到下一个顶层赋值）
const gc = fs.readFileSync(path.join(ROOT, 'js/game/game_combat_1.js'), 'utf8');
const _start = gc.indexOf('_playerObj =');
const _blk = gc.slice(_start, _start + 4200);

// W1：computeStats 产出关键身份字段应存在（供 _playerObj 全量透传基线）
const _cs = NDX.computeStats('tangseng', [], [], {}, 1);
// W1：computeStats 产出关键字段应存在（供 _playerObj 透传基线）；coll 为 _playerObj 另行组装，不在此列
const _need = ['finalDamage', 'engineTier', 'petPassive', 'petCombo', 'followerSkills', 'ti', 'yuan', 'reflect', 'shieldPct', 'armorPen'];
_need.forEach((k) => ck('W1 computeStats 产出字段「' + k + '」存在（供 _playerObj 透传）', k in _cs, 'missing'));

// W2：immuneDeath / hpDrainPct 已进 _playerObj（R1①，此前缺失致 TDZ）
ck('W2 _playerObj 含 immuneDeath（!!st.immuneDeath）', /immuneDeath:\s*!!st\.immuneDeath/.test(_blk));
ck('W2 _playerObj 含 hpDrainPct（st.hpDrainPct）', /hpDrainPct:\s*st\.hpDrainPct/.test(_blk));

// W4：coll 四键改读 st.*（dmgTakenColl/breakEffColl/bossDmgMul/dmgTiantingColl）
ck('W4 装配段 coll 四键读 st.*（st.x ?? s.x ?? 0 范式）',
  /st\.dmgTakenColl/.test(_blk) && /st\.breakEffColl/.test(_blk) && /st\.bossDmgMul/.test(_blk) && /st\.dmgTiantingColl/.test(_blk));
// W4（续）：s.* 仅允许作 `?? s.x ?? 0` 兜底（文档 R1② 范式），禁止作 `s.x || 0` 主源死读
ck('W4 装配段 s.* 四键仅作 ?? 兜底、无 `||` 死读（R1② 范式）',
  !/(s\.dmgTakenColl|s\.bossDmgMul|s\.breakEffColl|s\.dmgTiantingColl)\s*\|\|/.test(_blk));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
