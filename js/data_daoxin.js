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
  SEAL_MOD: {                             // 道心调制劫印效果（V8.27）：深渊态恶印+15%/善印-10%，明镜态善印+15%/恶印-10%
    abyss: { evil: 1.15, good: 0.90 },    // 无底深渊：恶道劫印增幅 15%，善道劫印衰减 10%
    drift: { evil: 1.0,  good: 1.0  },    // 心城：原值不变
    calm:  { evil: 0.90, good: 1.15 }     // 明镜台：善道劫印增幅 15%，恶道劫印衰减 10%
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
// 道心调制劫印倍率（模块三）：按词条道途善恶（恶=战/夺/逆、善=渡/隐/缘，单源 NDX.DaoSystem.isEvilDao/isGoodDao）
// × 道心档位倍率（SEAL_MOD）。档位缺失或道途无法归类 → 1.0（不调制）。
// 仅在战斗/统计结算（computeStats 内）调用，此时 dao_system.js 已加载。
NDX.sealDaoMod = function (daoxinTier, dao) {
  const mod = (daoxinTier && NDX.DAOXIN.SEAL_MOD[daoxinTier]) || null;
  if (!mod) return 1.0;
  const DS = NDX.DaoSystem || null;
  if (DS && typeof DS.isEvilDao === 'function' && DS.isEvilDao(dao)) return mod.evil;
  if (DS && typeof DS.isGoodDao === 'function' && DS.isGoodDao(dao)) return mod.good;
  return 1.0;
};
