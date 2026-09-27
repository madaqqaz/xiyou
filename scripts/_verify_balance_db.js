// _verify_balance_db.js — 数值数据库门禁：注册表完整性 + 锚点 + dump 幂等 + JSON 快照一致
// 用途：跑批门禁（_run_all_gates.js 自动发现）；数值真源变更后与 _dump_balance_db.js 同步重建快照。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const JSON_OUT = path.join(ROOT, 'data', 'balance_db.json');

const _noop = () => {};
const _store = {};
function makeCtx() {
  const _Math = Object.create(Math);
  _Math.random = () => 0.5;
  const sb = {
    console, setTimeout, clearTimeout, setInterval, clearInterval, Date, JSON, Math: _Math,
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
  return sb;
}
function loadGame() {
  const sb = makeCtx();
  const ctx = vm.createContext(sb);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  files.forEach((f) => {
    if (/^https?:/.test(f)) return;
    const fp = path.join(ROOT, f.split('?')[0]);
    if (!fs.existsSync(fp)) return;
    try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); } catch (e) { console.log(`[load-fail] ${f}: ${e.message}`); }
  });
  return sb.NDX;
}

const NDX = loadGame();
if (!NDX || !NDX.BalanceDB) { console.error('FAIL _verify_balance_db.js：BalanceDB 未装载'); process.exit(1); }
const B = NDX.BalanceDB;

// 去时间戳的规范化 dump（幂等/快照对比用）
const stableDump = () => { const d = B.dump(); delete d.meta.builtAt; return JSON.stringify(d); };

let fail = 0;
const check = (name, ok, detail) => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) fail++;
};

// —— F1 注册表完整性：各系统条目数下限（按 2026-09-25 实际规模留余量） ——
//   ⚠ v1.4 宠物下限 60 → 24：宠物池按「兽印轴」重组（8 轴 × 3 阶 = 24 活跃），
//     其余 91 只进 `NDX.PET_RESERVE`（**不删数据**，但不入池、不入本 DB）。
//     ⇒ 下限随之改锚为「8 轴 × 3 阶」，防「池子又被无声塞回」。
const MIN = { hero: 5, equipment: 600, pet: 24, sutra: 30, sutra_rule: 20, seal: 40, zhuanjie: 6, ultimate: 15, monster: 30, boss: 20, achievement: 60 };
console.log('数值数据库门禁：');
for (const [sys, min] of Object.entries(MIN)) {
  const n = (B.list(sys) || []).length;
  check(`F1 ${sys} 条目数 ≥ ${min}`, n >= min, `实际 ${n}`);
}

// —— F1b 宠物条目数的**结构**约束（比下限更强）：必须是「轴数 × 3 阶」——
//   防「下限调到 24 之后，有人往池里塞第 25 只」而门禁仍绿。
{
  const n = (B.list('pet') || []).length;
  const axes = (NDX.PET_AXIS_ORDER || []).length;
  check(`F1b 宠物条目数 === 兽印轴数 × 3 阶（${axes} × 3 = ${axes * 3}）`,
    axes > 0 && n === axes * 3, `实际 ${n}`);
}

// —— F2 锚点：装备重定标真值（ts_staff_fan matk=176） ——
const staff = B.get('equipment', 'ts_staff_fan');
check('F2 装备锚点 ts_staff_fan.matk === 176', !!staff && staff.values.matk === 176, staff ? `实际 matk=${staff.values.matk}` : '未找到');

// —— F3 锚点：宠物注册表仍在（lingyan_ju） ——
check('F3 宠物锚点 lingyan_ju 存在', !!B.get('pet', 'lingyan_ju'));

// —— F4 dump 幂等（去掉 builtAt 后两次序列化一致） ——
const d1 = stableDump(), d2 = stableDump();
check('F4 dump 幂等', d1 === d2);

// —— F5 stats 聚合可用（equipment.atk 有按章聚合） ——
const st = B.stats('equipment', 'atk');
check('F5 stats(equipment,atk) 可聚合', !!st && st.count > 100 && !!st.byChapter && !!st.byChapter[1], st ? `count=${st.count} ch1.max=${st.byChapter[1] ? st.byChapter[1].max : '-'}` : 'null');

// —— F6 JSON 快照一致（文件存在时对比；不存在则 INFO） ——
if (fs.existsSync(JSON_OUT)) {
  let snap = null;
  try { snap = JSON.parse(fs.readFileSync(JSON_OUT, 'utf8')); } catch (e) { /* 下方报失败 */ }
  if (snap && snap.systems) {
    const stableSnap = JSON.stringify(Object.assign({}, snap, { meta: Object.assign({}, snap.meta, { builtAt: undefined }) }));
    check('F6 JSON 快照与运行库一致', stableSnap === d1, stableSnap === d1 ? '' : '快照陈旧，请重跑 scripts/_dump_balance_db.js');
  } else {
    check('F6 JSON 快照可解析', false, 'data/balance_db.json 损坏');
  }
} else {
  console.log('  INFO F6 JSON 快照不存在（先跑 scripts/_dump_balance_db.js 生成）');
}

console.log(fail === 0 ? '结论：' + Object.keys(MIN).length + ' 系统 + 锚点/幂等/快照全部通过' : `结论：${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
