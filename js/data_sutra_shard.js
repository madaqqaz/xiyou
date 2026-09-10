// =============================================================
// data_sutra_shard.js — 《逆道西行》经文碎片系统 · SUTRA_SHARD/sutraTierOf
// 从 data.js 拆分（2026-08-31）：独立维护经文碎片系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.SUTRA_SHARD = {
  DAOS: ['ferry', 'rebel'],          // 经匣两个实物系（渡/逆）
  COMPOSE_TIERS: [                    // 拼篇/升阶阈值（按碎片累计数）
    { need: 3, tier: '凡', label: '凡经' },
    { need: 6, tier: '灵', label: '灵经' },
    { need: 9, tier: '真', label: '真经' }
  ],
  REBEL_ZHEN_CYCLE_REQ: 2,           // 真篇逆经的周目门（二周目论道）
  ACT: {                              // 渡/逆经文释放语义
    ferry: { type: 'boost', str: '禅光加持', desc: '诵渡经，禅光附体：后续攻势愈战愈烈（持续增益）' },
    rebel: { type: 'curse', str: '戾骨献祭', desc: '涌逆经，戾骨借形：重创当前妖身，然清气尽散（代价清势）' }
  },
  SIDE: { ferry: 'bless', rebel: 'curse' }   // 遮面板可辨的渡/逆侧别（渡=亮 / 逆=暗）
};
// 依碎片累计数取「未带门限」的最高阶（≥need 判）。无成篇返回 null。
NDX.sutraTierOf = function (count) {
  let best = null;
  for (const t of NDX.SUTRA_SHARD.COMPOSE_TIERS) if (count >= t.need) best = t;
  return best;
};
// 依碎片累计数取「带门限」的最高阶（gate 不满足时降到上一档）。
NDX.sutraTierGated = function (count, gate) {
  const tiers = NDX.SUTRA_SHARD.COMPOSE_TIERS;
  let best = null;
  for (const t of tiers) {
    if (count >= t.need) {
      // 真篇逆经需二周目门限
      if (t.tier === '真' && gate === 'rebel' && (NDX.getCycle ? NDX.getCycle() : 1) < NDX.SUTRA_SHARD.REBEL_ZHEN_CYCLE_REQ) continue;
      best = t;
    }
  }
  return best;
};
// ============================================================
// 模块八·经匣拼篇阶位（V8.6x，局内多轴收集线）
// 绑法：局内每拾一片（渡/逆分计）累计入 s._sutraPieces；累计达凡/灵/真(3/6/9) 则「经匣晋阶」。
// 阶位消费：诵经键释放时放大伤害（戾骨献祭吃逆侧、本命诵经吃渡侧），见 NDX.sutraTierMult。
// 真源声明：阈值与标签在 COMPOSE_TIERS；放大倍率在 PIECE_BONUS；sutraTierOf/Gated 只取阶不取值。
// ============================================================
NDX.SUTRA_SHARD.PIECE_BONUS = {  // 拼篇阶位→诵经/献祭伤害放大（凡/灵/真）
  凡: { ferry: 0.10, rebel: 0.15 },
  灵: { ferry: 0.20, rebel: 0.30 },
  真: { ferry: 0.35, rebel: 0.50 },
};
// 取某侧(渡/逆)当前拼篇阶位（逆·真篇锁二周目；无成篇返回 null）
NDX.sutraSideTier = function (s, side) {
  const acc = (s && s._sutraPieces) || {};
  const count = acc[side] || 0;
  return (side === 'rebel') ? NDX.sutraTierGated(count, 'rebel') : NDX.sutraTierOf(count);
};
// 拼片累计（渡/逆分计，单源 owner：每授予一片调用一次）
NDX.addSutraPiece = function (s, side) {
  if (!s) return;
  s._sutraPieces = s._sutraPieces || {};
  s._sutraPieces[side] = (s._sutraPieces[side] || 0) + 1;
};
// 拼篇阶位对应的诵经/献祭伤害放大倍数（无阶返回 1）
NDX.sutraTierMult = function (tier, side) {
  if (!tier) return 1;
  const b = NDX.SUTRA_SHARD.PIECE_BONUS[tier.tier];
  return b ? (1 + (b[side] || 0)) : 1;
};
