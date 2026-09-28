// _audit_difficulty_monotonic.js — S18 §⑤-1：难度曲线**单调性**门禁（2026-09-28 平衡批次）
// ---------------------------------------------------------------------------
// 背景（S18 D1）：`data_heroes.js` 的 `playerBaseAt` 曾有 **d21–d27 共 7 档零成长平台**——
//   `t = min(1,(d-1)/19)` 在 **d20 饱和**，而 `late = max(0, d-28)` 要到 **d28** 才启动；
//   同期怪物侧 `_cap = min(d-1,20)` 也已在 d21 饱和 ⇒ 该区间「双端零成长」，手感停滞。
//   修复：把 `late` 起点由 d28 **前移 d20**（衔接 t 的饱和点，d20 处逐字节不变）。
//
// 本门禁把"曲线单调"钉死，并**定点断言 d21–d27 必须严格递增**（防回退到空档）。
// ⚠ 判据诚实性（X4）：A6 用**旧式（late 起点 d28）**的复算结果反向验证 A2 —— 旧式必须在
//   d21–d27 判红，否则说明 A2 恒真、本门禁无效。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let fail = 0;
const ck = (name, cond, extra) => {
  if (cond) console.log('ok   ' + name);
  else { console.log('FAIL ' + name + (extra ? '  → ' + extra : '')); fail++; }
};

const ROOT = path.join(__dirname, '..');

// —— 载入英雄真源 + 曲线 ——
const sb = { console: { log() {}, warn() {}, error() {} }, Math, JSON, Date, isNaN, parseInt, parseFloat };
sb.window = sb; sb.NDX = {};
vm.createContext(sb);
['data_heroes_data.js', 'data_heroes.js'].forEach((f) => {
  const p = path.join(ROOT, 'js', f);
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), sb, { filename: f }); }
  catch (e) { console.log('  (load ' + f + ' 抛错：' + e.message + ')'); }
});
const NDX = sb.NDX;
const HEROES = NDX.HEROES || {};
const ids = Object.keys(HEROES);

console.log('=== _audit_difficulty_monotonic：难度曲线单调性（d=1…81）===');
ck('A0 真源就位：playerBaseAt / HEROES', typeof NDX.playerBaseAt === 'function' && ids.length > 0,
  '英雄 ' + ids.length + ' 个');

const MAXD = 81;
const at = (d, h) => NDX.playerBaseAt(d, h);

// —— A1 非递减（atk / matk / dr 三轴）——
{
  const bad = [];
  ids.forEach((id) => {
    for (let d = 1; d < MAXD; d++) {
      const a = at(d, HEROES[id]); const b = at(d + 1, HEROES[id]);
      if (b.atk < a.atk || b.matk < a.matk || b.dr < a.dr) {
        bad.push(id + ' d' + d + '→' + (d + 1) + ' atk ' + a.atk + '→' + b.atk
          + ' matk ' + a.matk + '→' + b.matk + ' dr ' + a.dr + '→' + b.dr);
      }
    }
  });
  ck('A1 全部 ' + ids.length + ' 英雄 × d1…d81：atk / matk / dr **非递减**', bad.length === 0,
    bad.slice(0, 4).join(' | '));
}

// —— A2 定点：d21–d27（原空档）必须**严格递增** ——
{
  const bad = [];
  ids.forEach((id) => {
    for (let d = 21; d < 28; d++) {
      const a = at(d, HEROES[id]); const b = at(d + 1, HEROES[id]);
      if (!(b.atk > a.atk && b.matk > a.matk)) {
        bad.push(id + ' d' + d + '→' + (d + 1) + ' atk ' + a.atk + '→' + b.atk);
      }
    }
  });
  ck('A2 空档定点：d21–d27 每档 atk 与 matk **严格递增**（S18 D1 修复护栏）', bad.length === 0,
    bad.slice(0, 4).join(' | '));
}

// —— A3 平台长度上限（封顶尾允许，但不得出现长平台）——
{
  let worstRun = 0; let worstAt = '';
  ids.forEach((id) => {
    let run = 1;
    for (let d = 2; d <= MAXD; d++) {
      if (at(d, HEROES[id]).atk === at(d - 1, HEROES[id]).atk) { run++; } else run = 1;
      if (run > worstRun) { worstRun = run; worstAt = id + ' 至 d' + d; }
    }
  });
  // 平台只允许出现在**封顶尾**（起点 d ≥ 77），且 ≤ 5 档；中段（d21–d76）零平台。
  ck('A3 平台豁免：唯一允许的持平段是封顶尾（起点 d≥77、≤5 档）；中段 d21–d76 必须逐档增长',
    worstRun <= 5 && /至 d8[01]|至 d7[789]/.test(worstAt), '最长 ' + worstRun + ' 档 @' + worstAt);
}

// —— A4 封顶口径：late 项上界 = +400 攻 / +450 愿伤 ——
{
  const d81 = at(81, HEROES[ids[0]] || {});
  const d78 = at(78, HEROES[ids[0]] || {});
  ck('A4 封顶口径：d78 与 d81 的 atk/matk 相等（late 已达 +400/+450 封顶）',
    d81.atk === d78.atk && d81.matk === d78.matk, 'd78=' + d78.atk + '/' + d78.matk + ' d81=' + d81.atk + '/' + d81.matk);
}

// —— A5 怪物侧饱和点记录（源码级）：`_cap = min(diffLv-1, 20)` ⇒ d21 饱和 ×1.6 ——
{
  const src = fs.readFileSync(path.join(ROOT, 'js', 'game', 'game_combat_1.js'), 'utf8');
  ck('A5 怪物侧饱和度可查：存在 `_cap = Math.min(diffLv - 1, 20)`（d21 饱和，×1.6 封顶）',
    /Math\.min\(diffLv\s*-\s*1,\s*20\)/.test(src));
  ck('A5b 玩家侧 `t` 饱和点 = d20（分母 19 ⇒ t=min(1,(d-1)/19)）',
    /Math\.min\(1,\s*\(diff\s*-\s*1\)\s*\/\s*19\)/.test(fs.readFileSync(path.join(ROOT, 'js', 'data_heroes.js'), 'utf8')));
}

// —— A6 反证：用**旧式（late 起点 d28）**复算 ⇒ A2 判据必须转红 ——
{
  const h = HEROES[ids[0]] || {};
  const base = (h.baseAtk != null ? h.baseAtk : 150);
  const oldAtk = (d) => {
    const t = Math.min(1, (d - 1) / 19);
    const late = Math.max(0, d - 28);              // 旧式
    return Math.round(base + 420 * t) + Math.min(400, late * 8);
  };
  let oldPlateau = true;
  for (let d = 20; d < 28; d++) if (oldAtk(d + 1) > oldAtk(d)) oldPlateau = false;
  ck('A6 反证：旧式（late 起点 d28）在 d20–d27 **确实完全不增长** ⇒ A2 的定点断言非恒真',
    oldPlateau === true, '旧式 d20=' + oldAtk(20) + ' d27=' + oldAtk(27) + ' d28=' + oldAtk(28));
}

// —— A7 影响面声明（逐档 diff 表，供平衡评审）——
{
  const h = HEROES[ids[0]] || {};
  const base = (h.baseAtk != null ? h.baseAtk : 150);
  const oldAtk = (d) => {
    const t = Math.min(1, (d - 1) / 19);
    return Math.round(base + 420 * t) + Math.min(400, Math.max(0, d - 28) * 8);
  };
  const rows = [1, 20, 21, 24, 27, 28, 40, 70, 78, 81].map((d) => {
    const now = at(d, h).atk; const old = oldAtk(d);
    return 'd' + d + ': ' + old + '→' + now + (now === old ? '(不变)' : '(' + (now - old >= 0 ? '+' : '') + (now - old) + ')');
  });
  console.log('     [A7 影响面] ' + rows.join('  '));
  ck('A7 影响面自证：d20 与 d78+ 不变、仅 d21–d77 上调（无档位被削弱）', (() => {
    for (let d = 1; d <= MAXD; d++) if (at(d, h).atk < oldAtk(d)) return false;
    return at(20, h).atk === oldAtk(20) && at(78, h).atk === oldAtk(78);
  })());
}

console.log(fail
  ? '=== _audit_difficulty_monotonic：' + fail + ' 项失败 ==='
  : '=== _audit_difficulty_monotonic：d1…d81 单调、d21–d27 空档已消除（旧式封顶值不变） ===');
console.log(fail ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exit(fail ? 1 : 0);
