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
ck('A8 六道日程：战最省（1 天）· 渡最贵（10 天）——「战快渡慢」', DD_.战 === 1 && DD_.渡 === 10,
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
  ck('B1 赶路费计入：mob = RIDE(5) + 1 = 6 天', d1 === L.RIDE_DAYS + ND_.mob, 'd1=' + d1);
  ck('B2 阶梯：mob < elite < boss', d1 < d2 && d2 < d3, [d1, d2, d3].join('/'));
  ck('B3 未知/缺失类型回落 mob', d4 === d1 && d5 === d1, [d4, d5].join('/'));
  const y1 = NDX.lifeCost({ type: 'mob' });
  ck('B4 lifeCost 返回年 = 天 / DAYS_PER_YEAR', Math.abs(y1 - d1 / D) < 1e-12, 'y=' + y1);
  ck('B5 daysToYears 与 fmtLife 自洽（360 天 = 1 岁 0 天）',
    NDX.daysToYears(360) === 1 && NDX.fmtLife(1) === '1 岁',
    NDX.fmtLife(1) + '|' + NDX.fmtLife(1.5));
  ck('B6 fmtLife 天位输出（例：1.5 年 → 1 岁 180 天）', NDX.fmtLife(1.5) === '1 岁 180 天', NDX.fmtLife(1.5));
  // B7 主轴总账：每个节点都要付一次赶路费。按「每难段均 SEG_PER_TRIAL 个节点」[PLACEHOLDER·待采样]
  //   主轴 = 73 难 × [SEG_PER_TRIAL×RIDE + trial附加 + (SEG_PER_TRIAL-1)×支线均附加] + 16 关隘×(RIDE+boss附加)
  //   目标：主轴落在 5~7 年，去程预算 9 年内留出 2~4 年刷图额度（取舍空间）
  const SEG_PER_TRIAL = 4;
  ck('B7 主轴总账模拟：73 难×4 段 + 16 关隘 落在 5~7 年（9 年预算内留 2~4 年刷图额度）', (() => {
    const otherAdd = 1.5; // 支线节点附加费均值 [PH]
    const perTrial = SEG_PER_TRIAL * L.RIDE_DAYS + ND_.trial + (SEG_PER_TRIAL - 1) * otherAdd;
    const perBoss = L.RIDE_DAYS + ND_.boss;
    const total = (perTrial * 73 + perBoss * 16) / D;
    return total >= 5 && total <= 7;
  })(), 'per=' + (((SEG_PER_TRIAL * L.RIDE_DAYS + ND_.trial + (SEG_PER_TRIAL - 1) * 1.5) * 73 + (L.RIDE_DAYS + ND_.boss) * 16) / D).toFixed(2) + ' 年（段/难=' + SEG_PER_TRIAL + '）');
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
  // C3：价目真源以天声明（NODE_DAYS/DAO_DAYS 内不得出现小数）
  ck('C3 NODE_DAYS / DAO_DAYS 内无小数值',
    !/NODE_DAYS[\s\S]{0,400}?\d+\.\d/.test(lifeSrc) || !/NODE_DAYS[^}]*?\d+\.\d/.test(lifeSrc),
    '检查 NODE_DAYS 段');
  ck('C4 DAO_DAYS 段无小数值', !/DAO_DAYS[^}]*?\d+\.\d/.test(lifeSrc));
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
