// =============================================================
// data_daoxin.js — 《逆道西行》道心系统 · DAOXIN/daoxinTier/daoxinWorld
// 从 data.js 拆分（2026-08-31）：独立维护道心系统（善恶+心魔合并为道心，三档世界态）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// =============================================================
// 道心系统（参照 nidao-xiyou 最新设计，2026-08-24 对齐）
// 善恶 + 心魔 合并为「道心」：三档世界态驱动视觉/叙事变化。
// 对外文案统一为道心；内部字段沿用 s.good / s.evil / s.xinmo。
// 三档：明镜台(calm, score<30) / 心城(drift, 30≤score<60) / 无底深渊(abyss, score≥60)
// score = evil + xinmo × 0.3（心魔占道心 30% 权重，V8.27 交叉对接）
// =============================================================
NDX.DAOXIN = {
  THRESHOLDS: { calm: 30, drift: 60 },   // evil < 30 → calm；30 ≤ evil < 60 → drift；≥ 60 → abyss
  SEAL_MOD: {                             // 道心调制劫印效果（V8.27；V9.51 改基为「印的来源阵营」）：
    // 深渊态 恶印+15%/善印-10%，明镜态 善印+15%/恶印-10%。此处「善印/恶印」= 印的**来源**
    // （非战斗劫难兵不血刃得善印 / 战斗破劫得恶印），**不指道的善恶**——道本身不判善恶。
    abyss: { evil: 1.15, good: 0.90 },    // 无底深渊：恶印增幅 15%，善印衰减 10%
    drift: { evil: 1.0,  good: 1.0  },    // 心城：原值不变
    calm:  { evil: 0.90, good: 1.15 }     // 明镜台：善印增幅 15%，恶印衰减 10%
  },
  WORLD: {
    calm:  { id: 'calm',  name: '明镜台',   attr: '明', badge: '心澄如镜', worldDesc: '山明水净，草木含情。此界待你以善。' },
    drift: { id: 'drift', name: '心城',     attr: '浊', badge: '心城渐深', worldDesc: '天色微暗，路人的目光在你身上多停了一瞬。' },
    abyss: { id: 'abyss', name: '无底深渊', attr: '渊', badge: '渊中无光', worldDesc: '风里带着铁锈味。此界已识得你的恶。' }
  }
};
// 道心档位：以 s.evil + s.xinmo×0.3 联合推导（心魔占道心 30% 权重，不再与道心平行）
NDX.daoxinTier = function (s) {
  const evil = (s && s.evil) || 0;
  const xinmo = (s && s.xinmo) || 0;
  const score = evil + xinmo * 0.3;   // 心魔 100 + evil 0 = score 30，刚好跌入「心城」
  if (score >= NDX.DAOXIN.THRESHOLDS.drift) return 'abyss';
  if (score >= NDX.DAOXIN.THRESHOLDS.calm) return 'drift';
  return 'calm';
};
// 道心世界态 VM：{ tier, name, attr, badge, worldDesc }
NDX.daoxinWorld = function (s) {
  const t = NDX.daoxinTier(s);
  return Object.assign({ tier: t }, NDX.DAOXIN.WORLD[t]);
};
// 道心调制劫印倍率（模块三）：按劫印的**来源阵营** seal.align
//   'good' = 非战斗劫难 · 兵不血刃所得；'evil' = 战斗破劫所得（真源 NDX.SEAL_SOURCE_ALIGN）。
// × 道心档位倍率（SEAL_MOD）。档位缺失或印无阵营标记 → 1.0（不调制）。
//   🔴 V9.51 改基：原按「词条道途善恶」判定（NDX.DaoSystem.isEvilDao/isGoodDao）——
//      那道级固定善恶已废弃（六道 = 玩家的选择，道不判善恶）。善恶现挂在**来源**上：
//      ① 逐选项 effect.alignGood/alignEvil → s.good/s.evil（结局判定 + 转职善门槛）
//      ② 劫印来源阵营 seal.align（本函数消费）
//   调用点：combat_part1.js computeStats 劫印循环（传整枚印对象，不再传 dao）。
NDX.sealDaoMod = function (daoxinTier, seal) {
  const mod = (daoxinTier && NDX.DAOXIN.SEAL_MOD[daoxinTier]) || null;
  if (!mod) return 1.0;
  const al = (seal && seal.align) || null;
  if (al === 'evil') return mod.evil;
  if (al === 'good') return mod.good;
  return 1.0;
};
