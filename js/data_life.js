// =============================================================
// data_life.js — 《逆道西行》寿命系统与返程系统
// LIFE/lifeCost/lifeTighten/returnShrineRegion
// 从 data.js 拆分（2026-08-31）：独立维护寿命系统与返程系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// =============================================================
// 寿命系统常量（v2-reborn 阶段一）
// 参照开发文档 §4/§15.3：27 岁出发 · 上限 55 · 去程消耗随节点类型递增。
// WARN_AGE 按「剩余寿岁」升序；WARN_TXT 以年龄为 key，对应 _checkLife 的档位播报。
// =============================================================
NDX.LIFE = {
  START: 27,                  // 一世起点年龄（岁）
  MAX: 55,                    // 大限（岁）
  RETURN_COST: 9,             // V8.55 固定返程耗寿：取到真经后回长安固定耗 9 岁（去程26→西天36→回45）
  // —— V8.55 三档结局判定（以「到西天时的余寿 R」为门槛，余寿=MAX-年龄）——
  PERFECT_R: 19,              // 完美结局：到西天余寿 ≥19（≈36岁到西天，返程耗9后仍富余，45岁回长安）
  SHRINE_R: 9,                // 差于此余寿 → 返程途中坐化，留舍利塔（>46岁到西天，无法走完9岁返程）
  MEDITATE_REGAIN: 0.3,       // 土地庙打坐回寿（抵消进入消耗后净回小量）
  // 进入节点时的寿命消耗（按 node.type，单位「岁」）
  COST: {
    rest: 0.1, shop: 0.1, treasure: 0.1,
    branch: 0.2, tutorial: 0.2, mob: 0.2,
    event: 0.25, cave: 0.3, trial: 0.3,
    elite: 0.5, mirror: 0.5, boss: 0.6
  },
  // 剩余寿岁阈值（升序，低→高 = 体力尚可 → 大限将至）
  WARN_AGE: [22, 15, 8, 3],
  WARN_TXT: {
    22: '体力尚可，前路尚远。',
    15: '气喘吁吁，每步如负千斤。',
    8: '油尽灯枯，前路只剩归途。',
    3: '咳血，已知大限将至。'
  },
  // —— V8.27+ 寿命单轴后追加字段（拆分重建，数值待平衡）——
  EVIL_SURCHARGE: 0.5,        // 恶道（战/夺/逆）抉择额外折寿（岁）
  HIDDEN_SURCHARGE: 0.3,      // 隐道抉择额外折寿（岁）
  DRUM: 1                     // 土地神龛敲钟每次加寿（月）
};

// 进入节点耗寿：按 node.type 查 LIFE.COST，缺省回落 mob（普通节点）
NDX.lifeCost = function (node) {
  const t = (node && node.type) || 'mob';
  const c = NDX.LIFE.COST[t];
  return typeof c === 'number' ? c : NDX.LIFE.COST.mob;
};

// =============================================================
// V8.61 难度阶梯显性化（Rev.4 报告批次3，对标杀戮尖塔 Ascension）：
// 把 lifeTighten 的隐性收紧做成开局自选三档「限期」——
//   宽松 = 大限恒为 55、耗寿 ×1.0（叙事玩家 / 首过）
//   标准 = 现行规则：diff≥4 或二周目 → 大限52+×1.08；diff≥5 → 大限50+×1.15（设计基准）
//   严苛 = 大限恒为 50、耗寿 ×1.15（硬核目标 / 冲榜）
// 存储为跨周目设置（ndx_life_mode），startScreen 三选条消费。
// =============================================================
NDX.LIFE_MODES = {
  easy: { name: '宽松', desc: '大限恒为 55 岁 · 耗寿不加息——安心看故事', maxPenalty: 0, costMul: 1 },
  std:  { name: '标准', desc: '随难度与周目自动收紧（大限 52/50）——设计基准', maxPenalty: null, costMul: null },
  hard: { name: '严苛', desc: '大限恒为 50 岁 · 耗寿 ×1.15——拿命硬换', maxPenalty: 5, costMul: 1.15 },
};
NDX.LIFE_MODE_KEY = 'ndx_life_mode';
NDX.getLifeMode = function () {
  const v = NDX.SaveSystem.loadString(NDX.LIFE_MODE_KEY, 'std');
  return NDX.LIFE_MODES[v] ? v : 'std';
};
NDX.setLifeMode = function (mode) {
  if (!NDX.LIFE_MODES[mode]) return NDX.getLifeMode();
  NDX.SaveSystem.saveString(NDX.LIFE_MODE_KEY, mode);
  return mode;
};

// =============================================================
// 寿命收紧（阶段六 · 高难度/多周目）：返回 maxPenalty（额外折寿上限）与 costMul（耗寿倍率）
// 第一版刻意开宽松，使闭环能稳定跑通，后续可收紧。
// V8.61：接入难度阶梯——easy 恒宽 / hard 恒严 / std 走原规则。
// =============================================================
NDX.lifeTighten = function (diff, cycle) {
  const mode = NDX.getLifeMode ? NDX.getLifeMode() : 'std';
  if (mode === 'easy') return { maxPenalty: 0, costMul: 1 };
  if (mode === 'hard') return { maxPenalty: 5, costMul: 1.15 };
  const d = diff || 1;
  const c = cycle || (NDX.getCycle ? NDX.getCycle() : 1);
  let maxPenalty = 0, costMul = 1;
  if (d >= 4 || c >= 2) { maxPenalty = 3; costMul = 1.08; }
  if (d >= 5) { maxPenalty = 5, costMul = 1.15; }
  return { maxPenalty: maxPenalty, costMul: costMul };
};

// =============================================================
// V8.55 返程改动：取消三站子地图，改为「固定耗 9 岁返程」。
// 到西天时按余寿 R 三档落结局（见 NDX.LIFE.PERFECT_R / SHRINE_R）。
// 差于此（R<SHRINE_R）者返程途中坐化，于归途某区立下「舍利塔」——
// 返程横跨 17 区、9 年，约每半年走一区；余寿越少，倒在越靠近西天的那端，
// 舍利塔随之下周目刷新在对应地区（玩家可回访拾遗）。
// =============================================================
// 返程舍利塔所处地区号（1-17）：余寿 R 每半年向前走一区，region=17 靠西天端、1 靠长安端
NDX.returnShrineRegion = function (R) {
  const r = Math.max(0, +R || 0);
  let region = 18 - Math.ceil(r / 0.5);   // 每半年(0.5余寿)推进一区
  region = Math.max(1, Math.min(17, region));
  return region;
}
