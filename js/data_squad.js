// ============================================================
// data_squad.js — 多怪编队真源（V9.31）
//   用户点名：「现在战斗只有一个怪物不合理」→ 本章落地多目标战斗。
//
//   设计要点：
//     · 编队＝「前排主怪 + 若干从怪」，从怪由主怪按倍率派生（不依赖独立怪库）。
//     · 数量与倍率按 类型（mob/elite/boss）× 难度层 确定，**确定性**（不用 Math.random，
//       保证门禁可复现），仅用 act/diff 的奇偶与阈值做伪随机分布。
//     · 战斗结算走 NDX.calcCombatSquad（combat_squad.js），主怪仍走既有 simulateSingle
//       （零回归），从怪走「溅射 + 轮流反击」派生模型。
//
//   战斗角色：
//     · 前排（index 0）＝ 主怪，吃全额单体伤害。
//     · 从怪（index 1..n）＝ 吃「群伤溅射」；若无群伤，只有极小概率被顺手扫到。
//     · 从怪每回合对玩家反击（比例低于主怪），使「清场」有代价 → 群伤/多重攻击真正有价值。
// ============================================================
(function () {
  'use strict';

  // 全局开关（可关：置 false 即退回单怪，便于排查）
  NDX.SQUAD_ENABLED = (NDX.SQUAD_ENABLED !== false);

  // —— 编队规格：从怪数量与派生倍率 ——
  //   count：不同难度层下的从怪数量（按 diff 阈值递进）
  //   hpMul/atkMul：从怪相对主怪的血量/攻击倍率
  //   counterMul：从怪对玩家的反击比例（相对自身 atk）
  NDX.SQUAD_COMP = {
    mob:   { count: [0, 1, 1, 2], hpMul: 0.45, atkMul: 0.55, counterMul: 0.30 },
    elite: { count: [1, 1, 2, 2], hpMul: 0.55, atkMul: 0.65, counterMul: 0.38 },
    // @reserved（R14·D8）：'boss' 档由 game_combat_1.js:415 的 !m.boss 排除，永不进 buildSquad；保留以备未来 Boss 编队
    boss:  { count: [2, 2, 2, 3], hpMul: 0.40, atkMul: 0.60, counterMul: 0.45 },
  };

  // 溅射比例：玩家「群伤」动作对每个从怪的伤害系数
  NDX.SQUAD_SPLASH_AOE = 0.60;   // 带群伤（act.aoe）
  NDX.SQUAD_SPLASH_BASE = 0.12;  // 无群伤时的顺手扫击（很低，凸显群伤价值）

  // 从怪名称池（按 type，纯风味；确定性命中）
  NDX.SQUAD_NAMES = {
    mob:   ['小妖', '喽啰', '鬼卒', '精怪'],
    elite: ['妖将', '头目', '洞主'],
    boss:  ['护法', '妖帅', '魔将'],
  };

  // 当前编队数量（确定性）：按 diff 阈值档位取
  NDX.squadCountOf = function (type, diff) {
    const comp = NDX.SQUAD_COMP[type] || NDX.SQUAD_COMP.mob;
    const d = diff || 1;
    const idx = d <= 3 ? 0 : (d <= 8 ? 1 : (d <= 15 ? 2 : 3));
    return comp.count[idx] || 0;
  };

  // 由主怪派生编队（返回完整怪 spec 数组，index 0 = 主怪原样）
  //   ctx: { type, diff, act }
  NDX.buildSquad = function (baseMonster, ctx) {
    const out = [baseMonster];
    if (!NDX.SQUAD_ENABLED || !baseMonster) return out;
    const type = (ctx && ctx.type) || baseMonster.type || 'mob';
    // ⚠ R14·D8：保留 tutorial 提前返回——门禁 _verify_squad 直接调用 buildSquad(tutorialMonster)，
    //   调用方 game_combat_1.js:415 的 !m.tutorial 守卫不覆盖该路径；删此分支会破坏「教学战不编队」断言。
    if (type === 'tutorial' || baseMonster.tutorial) return out;
    const diff = (ctx && ctx.diff) || 1;
    const n = NDX.squadCountOf(type, diff);
    if (n <= 0) return out;
    const comp = NDX.SQUAD_COMP[type] || NDX.SQUAD_COMP.mob;
    const pool = NDX.SQUAD_NAMES[type] || NDX.SQUAD_NAMES.mob;
    const seed = ((ctx && ctx.act) || 1) + diff;
    for (let i = 0; i < n; i++) {
      const nm = pool[(seed + i) % pool.length];
      out.push({
        name: nm + (i > 0 ? '·' + (i + 1) : ''),
        type: type,
        hp: Math.max(1, Math.round((baseMonster.hp || 100) * comp.hpMul)),
        atk: Math.max(1, Math.round((baseMonster.atk || 18) * comp.atkMul)),
        matk: Math.max(1, Math.round((baseMonster.matk || 20) * comp.atkMul)),
        dr: Math.min(0.45, (baseMonster.dr != null ? baseMonster.dr : 0.1) * 0.8),
        mdef: Math.min(0.45, (baseMonster.mdef != null ? baseMonster.mdef : 0.05) * 0.8),
        boss: false,
        tags: baseMonster.tags || ['妖'],
        // 从怪不做行为脚本（简化）：仅在 squad 结算里按 counterMul 反击
        _squadAdd: true,
        _counterMul: comp.counterMul,
      });
    }
    return out;
  };
})();
