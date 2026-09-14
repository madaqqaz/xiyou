#!/usr/bin/env node
// =============================================================
// _verify_life_days.js — 寿命「天数制」门禁（V9.7，2026-09-12）
// A 段：真源口径（价目常量为整数天 / s.life 存年 / 换算单一真源）
// B 段：两段式计费（赶路费 + 节点附加费）与六道日程表
// C 段：源码守卫（禁裸 0.0x 岁价目；禁 EVIL/HIDDEN_SURCHARGE 复活）
// D 段：心魔三档念经（30→3天 / 60→6天 / 败→15天回 60）
// 用法：node scripts/_verify_life_days.js   （通过 exit 0）
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

// ---------- A 段：桩环境加载真源 data_life.js ----------
const sandbox = { window: {}, console, Math };
sandbox.window.NDX = sandbox.window.NDX || {};
sandbox.NDX = sandbox.window.NDX;
vm.createContext(sandbox);
try {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data_life.js'), 'utf8'), sandbox, { filename: 'data_life.js' });
} catch (e) {
  console.log('  ✗ 桩环境加载 data_life.js 失败: ' + e.message);
  process.exit(1);
}
const NDX = sandbox.NDX;
const L = NDX.LIFE || {};
const D = L.DAYS_PER_YEAR || 360;

ck('A0 真源就位：LIFE / lifeCost / lifeCostDays / daoDays / fmtLife',
  !!(L && NDX.lifeCost && NDX.lifeCostDays && NDX.daoDays && NDX.fmtLife && NDX.daysToYears));
ck('A1 DAYS_PER_YEAR = 360', D === 360, 'D=' + D);
ck('A2 起点/大限自洽：START = MAX_AGE - START_AGE = 23 年',
  L.START_AGE === 27 && L.MAX_AGE === 50 && L.START === 23 && L.MAX === 23,
  JSON.stringify([L.START_AGE, L.MAX_AGE, L.START, L.MAX]));
ck('A3 三档结局：PERFECT_R=14（≤36岁到西天）· SHRINE_R=9（>41岁坐化）· RETURN_COST=9',
  L.PERFECT_R === 14 && L.SHRINE_R === 9 && L.RETURN_COST === 9,
  JSON.stringify([L.PERFECT_R, L.SHRINE_R, L.RETURN_COST]));

// —— 价目真源必须是整数天 ——
const dayKeys = ['RIDE_DAYS'];
ck('A4 赶路费 RIDE_DAYS 为整数天', Number.isInteger(L.RIDE_DAYS), 'RIDE_DAYS=' + L.RIDE_DAYS);
const ND_ = L.NODE_DAYS || {};
const nodeTypes = ['mob', 'elite', 'boss', 'trial', 'event', 'rest', 'shop', 'treasure', 'branch', 'tutorial', 'cave', 'mirror'];
ck('A5 NODE_DAYS 覆盖全部 12 类节点且均为整数天',
  nodeTypes.every((t) => Number.isInteger(ND_[t])),
  nodeTypes.map((t) => t + ':' + ND_[t]).join(','));
ck('A6 节点附加费梯度合理：mob<elite<boss 且 mirror 最贵',
  ND_.mob < ND_.elite && ND_.elite < ND_.boss && ND_.mirror >= ND_.boss * 2,
  JSON.stringify([ND_.mob, ND_.elite, ND_.boss, ND_.mirror]));
const DD_ = L.DAO_DAYS || {};
ck('A7 六道日程表六道齐全、均为整数天', ['战', '渡', '隐', '夺', '缘', '逆'].every((d) => Number.isInteger(DD_[d])),
  JSON.stringify(DD_));
// 【2026-09-14 修正】原写死 1/10，调价即误报。改为语义断言：战最省、渡最贵（"战快渡慢"）。
ck('A8 六道日程：战最省 · 渡最贵 ——「战快渡慢」',
  ['夺', '隐', '逆', '缘', '渡'].every((d) => DD_.战 < DD_[d])
  && ['战', '夺', '隐', '逆', '缘'].every((d) => DD_.渡 > DD_[d]),
  '战=' + DD_.战 + ' 渡=' + DD_.渡);
ck('A9 善恶与寿命解绑：EVIL_SURCHARGE / HIDDEN_SURCHARGE 已废除',
  L.EVIL_SURCHARGE === undefined && L.HIDDEN_SURCHARGE === undefined,
  'EVIL=' + L.EVIL_SURCHARGE + ' HIDDEN=' + L.HIDDEN_SURCHARGE);
ck('A10 回补给为天常量：MEDITATE_DAYS / DRUM_DAYS 整数天且与兼容岁字段一致',
  Number.isInteger(L.MEDITATE_DAYS) && Number.isInteger(L.DRUM_DAYS)
  && Math.abs(L.MEDITATE_REGAIN - L.MEDITATE_DAYS / D) < 1e-9
  && Math.abs(L.DRUM - L.DRUM_DAYS / D) < 1e-9,
  JSON.stringify([L.MEDITATE_DAYS, L.DRUM_DAYS, L.MEDITATE_REGAIN, L.DRUM]));

// ---------- B 段：两段式计费与换算 ----------
{
  const d1 = NDX.lifeCostDays({ type: 'mob' });
  const d2 = NDX.lifeCostDays({ type: 'elite' });
  const d3 = NDX.lifeCostDays({ type: 'boss' });
  const d4 = NDX.lifeCostDays({});            // 无 type → 回落 mob
  const d5 = NDX.lifeCostDays({ type: '__unknown__' });
  ck('B1 赶路费计入：mob = RIDE(' + L.RIDE_DAYS + ') + ' + ND_.mob + ' = ' + (L.RIDE_DAYS + ND_.mob) + ' 天', d1 === L.RIDE_DAYS + ND_.mob, 'd1=' + d1);
  ck('B2 阶梯：mob < elite < boss', d1 < d2 && d2 < d3, [d1, d2, d3].join('/'));
  ck('B3 未知/缺失类型回落 mob', d4 === d1 && d5 === d1, [d4, d5].join('/'));
  const y1 = NDX.lifeCost({ type: 'mob' });
  ck('B4 lifeCost 返回年 = 天 / DAYS_PER_YEAR', Math.abs(y1 - d1 / D) < 1e-12, 'y=' + y1);
  ck('B5 daysToYears 与 fmtLife 自洽（360 天 = 1 岁 0 天）',
    NDX.daysToYears(360) === 1 && NDX.fmtLife(1) === '1 岁',
    NDX.fmtLife(1) + '|' + NDX.fmtLife(1.5));
  ck('B6 fmtLife 天位输出（例：1.5 年 → 1 岁 180 天）', NDX.fmtLife(1.5) === '1 岁 180 天', NDX.fmtLife(1.5));
  // ⚠【2026-09-14 修正】原模型按「73 难 × 4 段 = 292 节点」估算，与实机（每层走一格 = **73 节点/局**）
  //   严重脱节，导致区间口径失真。现改为 73 节点实测模型，仅统计【节点耗寿主轴】，
  //   六道日程（DAO_DAYS）与土地庙回补（MEDITATE_DAYS）由 B7c / B9 系另计，不混进主轴。
  //   【2026-09-14 用户拍板·NODE_DAYS 整体 ×2】新档位：mob/小类=11、elite/event/rest=13、boss/cave=15。
  ck('B7 节点主轴（73 节点/局，不含六道日程与回补）落在 2.2~3.0 年', (() => {
    const common2 = ['mob', 'elite', 'boss', 'trial', 'event', 'rest', 'shop', 'treasure', 'branch', 'tutorial', 'cave'];
    const avg = common2.reduce((a, t) => a + (L.RIDE_DAYS + (ND_[t] || 0)), 0) / common2.length;
    return (73 * avg / D) >= 2.2 && (73 * avg / D) <= 3.0;
  })(), (() => {
    const common2 = ['mob', 'elite', 'boss', 'trial', 'event', 'rest', 'shop', 'treasure', 'branch', 'tutorial', 'cave'];
    const avg = common2.reduce((a, t) => a + (L.RIDE_DAYS + (ND_[t] || 0)), 0) / common2.length;
    return (73 * avg / D).toFixed(2) + ' 年（均 ' + avg.toFixed(2) + ' 天/节点 × 73）';
  })());
  ck('B7b【2026-09-14 拍板】单节点总耗时（赶路+附加）落在 11~15 天；mirror 除外（25 天大日程）', (() => {
    const common2 = ['mob', 'elite', 'boss', 'trial', 'event', 'rest', 'shop', 'treasure', 'branch', 'tutorial', 'cave'];
    return common2.every((t) => { const v = L.RIDE_DAYS + ND_[t]; return v >= 11 && v <= 15; })
      && L.RIDE_DAYS + ND_.mirror === 25;
  })(), ['mob', 'elite', 'boss', 'trial', 'event', 'rest', 'shop', 'treasure', 'branch', 'tutorial', 'cave'].map((t) => t + '=' + (L.RIDE_DAYS + (ND_[t] || 0))).join(','));
  ck('B7c【2026-09-14 拍板·拉大日程差】战/渡日程差 ≥ 26 天，且 战<夺=隐<缘<逆<渡 阶梯成立', (() => {
    const dd = (L.DAO_DAYS || {});
    const gap = (dd['渡'] || 0) - (dd['战'] || 0);
    return gap >= 26 && dd['战'] < dd['夺'] && dd['夺'] === dd['隐']
      && dd['隐'] < dd['缘'] && dd['缘'] < dd['逆'] && dd['逆'] < dd['渡'];
  })(), '差距=' + (((L.DAO_DAYS || {})['渡'] || 0) - ((L.DAO_DAYS || {})['战'] || 0)) + ' 天 | ' + JSON.stringify(L.DAO_DAYS || {}));
  ck('B8 lifeTighten 三档：easy 不罚 / hard 罚 3 年×1.15 / std 高难罚 5 年×1.15', (() => {
    try {
      NDX.SaveSystem = { loadString: () => 'easy', saveString: () => {} };
      const e = NDX.lifeTighten(5, 3);
      NDX.SaveSystem = { loadString: () => 'hard', saveString: () => {} };
      const h = NDX.lifeTighten(1, 1);
      NDX.SaveSystem = { loadString: () => 'std', saveString: () => {} };
      NDX.getCycle = () => 1;
      const s = NDX.lifeTighten(5, 1);
      return e.maxPenalty === 0 && e.costMul === 1 && h.maxPenalty === 3 && h.costMul === 1.15
        && s.maxPenalty === 5 && s.costMul === 1.15;
    } catch (e) { return false; }
  })());
  ck('B9 告警档位 WARN_AGE 升序且与 WARN_TXT 键一一对应',
    Array.isArray(L.WARN_AGE) && L.WARN_AGE.every((a, i) => i === 0 || a > L.WARN_AGE[i - 1])
    && L.WARN_AGE.every((a) => !!L.WARN_TXT[a]), JSON.stringify(L.WARN_AGE));
}

// ---------- C 段：源码守卫 ----------
{
  const files = [];
  (function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      const st = fs.statSync(p);
      if (st.isDirectory()) { if (f !== 'node_modules' && f !== '.git') walk(p); }
      else if (f.endsWith('.js')) files.push(p);
    }
  })(path.join(ROOT, 'js'));

  // C1：data_life.js 内不得出现裸小数价目（0.0x 岁）——除兼容字段（由天换算）
  const lifeSrc = fs.readFileSync(path.join(ROOT, 'js/data_life.js'), 'utf8');
  const evilRe = /EVIL_SURCHARGE|HIDDEN_SURCHARGE/;
  ck('C1 全仓（data_life 外）无 EVIL_SURCHARGE / HIDDEN_SURCHARGE 残留',
    !files.some((f) => f.indexOf('data_life.js') < 0 && evilRe.test(fs.readFileSync(f, 'utf8'))));
  ck('C2 data_life.js 内 EVIL/HIDDEN_SURCHARGE 已移除', !evilRe.test(lifeSrc));
  // C3/C4【2026-09-14 修正】原用正则扫源码文本，会把**注释里的小数**（如「约 1.5 个节点」）
  //   误判成价目小数 → 注释一改就误报。现改为运行时解析真值：只看 NODE_DAYS / DAO_DAYS 的
  //   实际数值是否为整数天，注释与文案不再干扰。
  ck('C3 NODE_DAYS 各项价目均为整数天（运行时解析真值，不扫注释）',
    Object.keys(ND_).length > 0 && Object.keys(ND_).every((k) => Number.isInteger(ND_[k])),
    Object.keys(ND_).filter((k) => !Number.isInteger(ND_[k])).join(',') || 'all int');
  ck('C4 DAO_DAYS 六道日程均为整数天（运行时解析真值，不扫注释）',
    ['战', '夺', '隐', '逆', '缘', '渡'].every((k) => Number.isInteger(DD_[k])),
    ['战', '夺', '隐', '逆', '缘', '渡'].map((k) => k + '=' + DD_[k]).join(','));
  // C5：禁止在 data_life 外硬编码节点耗寿小数（历史 0.1/0.2/0.3/0.5/0.6 价目）
  const costRe = /lifeCost|NODE_DAYS/;
  ck('C5 价目引用统一走 NDX.lifeCost / NODE_DAYS（仓内存在引用）',
    files.some((f) => costRe.test(fs.readFileSync(f, 'utf8'))));
  // C6：fmtLife / lifeDays 已在 UI 生效（天数显示落地）
  const uiSrc = ['js/ui/ui_map.js', 'js/ui/ui_modals_1.js', 'js/game/game_region.js']
    .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  ck('C6 天数显示接线：UI/日志使用 NDX.fmtLife 或 NDX.lifeDays',
    /fmtLife\(|lifeDays\(/.test(uiSrc));
}

// ---------- D 段：心魔三档念经（真源 XINMO）----------
{
  const sb2 = { window: {}, console, Math };
  sb2.window.NDX = {};
  sb2.NDX = sb2.window.NDX;
  vm.createContext(sb2);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data_xinmo.js'), 'utf8'), sb2, { filename: 'data_xinmo.js' });
  const X = sb2.NDX.XINMO || {};
  ck('D1 三档念经常量：30→3 天 / 60→6 天 / 败→15 天',
    X.CHANT_DAYS && X.CHANT_DAYS[30] === 3 && X.CHANT_DAYS[60] === 6 && X.CHANT_DAYS.fail === 15,
    JSON.stringify(X.CHANT_DAYS));
  ck('D2 降魔量为正且 60 档强于 30 档',
    X.CHANT_RELEASE && X.CHANT_RELEASE[30] > 0 && X.CHANT_RELEASE[60] > X.CHANT_RELEASE[30],
    JSON.stringify(X.CHANT_RELEASE));
  ck('D3 镜战败回悬 60（原 70）', X.MIRROR_FALLBACK === 60, 'MIRROR_FALLBACK=' + X.MIRROR_FALLBACK);
  ck('D4 惩罚简化：不再削减气血上限（BATTLE_MAXHP_LOSS=0）', X.BATTLE_MAXHP_LOSS === 0, '' + X.BATTLE_MAXHP_LOSS);
  ck('D5 惩罚简化：不再夺劫印（SEAL_LOSS=false）', X.SEAL_LOSS === false, '' + X.SEAL_LOSS);
  ck('D6 档位只剩 0/30/60/100（85 已并入）',
    Object.keys(X.TIER_TXT || {}).sort().join(',') === '0,100,30,60', Object.keys(X.TIER_TXT || {}).join(','));
}

console.log('\n  通过 ' + pass + ' / 失败 ' + fail);
if (fail) { console.log('  失败项：\n   - ' + fails.join('\n   - ')); process.exit(1); }
process.exit(0);
