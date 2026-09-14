// =============================================================
// data_life.js — 《逆道西行》寿命系统与返程系统
// LIFE/lifeCost/lifeTighten/returnShrineRegion
// 从 data.js 拆分（2026-08-31）：独立维护寿命系统与返程系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
//
// V9.7 天数制重构（2026-09-12 用户拍板）：
//   寿命的「价目真源」全部改为整数【天】——原典取经本就是按天过日子（黄风岭打一次一天、
//   连战三次三天、走渡请神仙耗十天）。s.life 内部仍以「年」为浮点（零存档迁移风险），
//   换算由 DAYS_PER_YEAR 统一承担：一切对外价目常量以天声明，lifeCost 返回年。
//   —— 铁律：本文件内不得再出现 0.0x 岁之类的裸小数价目；调价一律改天数值。
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// =============================================================
// 寿命系统常量（V9.7 天数制）
//   s.life   = 剩余寿数（年，浮点）；年龄 = MAX_AGE - life
//   DAYS_PER_YEAR = 360（游戏化整除，便于「X岁X天」口播）
//   价目真源（天）：
//     RIDE_DAYS     —— 赶路费：节点与节点之间的行路，消耗大头
//     NODE_DAYS     —— 节点附加费：进节点后实际发生的事（打怪一天、事件三天…）
//     DAO_DAYS      —— 六道日程表：六道的区别在日程（战快渡慢），善恶与寿命解绑
// =============================================================
NDX.LIFE = {
  DAYS_PER_YEAR: 360,
  START_AGE: 27,              // 一世起点年龄（岁）
  MAX_AGE: 50,                // 大限（岁）
  START: 23,                  // 余寿起点（年）= MAX_AGE - START_AGE
  MAX: 23,                    // 余寿上限（年）= 大限基准（受 lifeTighten 扣减后即大限收紧）
  RETURN_COST: 9,             // 固定返程耗寿（年）：西天回长安 9 年
  // —— 三档结局判定（以「到西天时的余寿 R」为门槛，单位年）——
  PERFECT_R: 14,              // 完美：到西天余寿 ≥14（≤36 岁到西天，回程 9 后 45 岁归）
  SHRINE_R: 9,                // 差于此（余寿 <9，即 >41 岁到西天）→ 返程坐化，留舍利塔
  // —— 价目真源（天）· 赶路费：走一个节点就付一次行路成本 ——
  RIDE_DAYS: 5,               // [已调优] 节点间赶路消耗大头——2026-09-14 用户拍板「赶路本身不背锅，不动」；
                              //   门禁 _verify_life_days B7b 锁死单节点总耗（赶路+附加∈[11,15]、mirror 恰 25），故 5 不可改，确认保持。
  // —— 价目真源（天）· 节点附加费 ——
  // 【2026-09-14 用户拍板·整体 ×2】原 8~10 天/节点的档位是「拍脑袋偏松」的一版：
  //   实测单局净耗仅 333 天 = 0.92 年，寿命张力只跑满 10.3%，完美结局 100% 必得。
  //   现节点附加费整体 ×2（赶路费 RIDE_DAYS 不动，行路本身不背锅）：
  //   mob=11、elite/event/rest=13、boss/cave=15、mirror=25（特殊大日程，全图最贵）。
  //   ⚠ 门禁 B7b 的守卫区间已同步改为新的拍板档位（见 scripts/_verify_life_days.js）。
  NODE_DAYS: {
    mob: 6,                   // 小怪战：一场遭遇战六天了事（多刷怪≠多耗命）
    elite: 8,                 // 精英：硬仗多打一阵
    boss: 10,                 // 关隘：连战按场次累计（黄风岭三场多日）
    trial: 6,                 // 劫难本体（入难/了难），重头在 DAO_DAYS（抉择后 24~84 天）
    event: 8,                 // 奇遇要处理（宠物/法宝/特殊装备入口）
    rest: 6,                  // 土地庙：歇息打坐要日子（回寿见 MEDITATE_DAYS）
    shop: 6, treasure: 6, branch: 6, tutorial: 6,
    cave: 10,                 // 洞天：逆经独家，探洞费日程
    mirror: 20,               // 心魔镜战：直面镜本我是大日程（5+20=25，全图最贵）
  },
  // —— 价目真源（天）· 六道日程表（V9.7 核心：六道的区别是「日程」，不是折寿）——
  //   战=自己动手速战速决（最省天）；渡=请神仙降莅临（最贵，但安全、零战损、善果）
  // 【2026-09-14 用户拍板·拉大日程差】旧表战 1 / 渡 10 只差 9 天，一次抉择的代价
  //   不足半个节点的耗寿，「战快渡慢」是句空话。现拉到战 2 / 渡 28（差 26 天 ≈ 2 个节点）：
  //   渡道玩家（28 天/次）会真正逼近失手线，抉择开始有代价。善恶仍与寿命解绑（日程≠折寿）。
  DAO_DAYS: { 战: 2, 夺: 6, 隐: 6, 逆: 12, 缘: 8, 渡: 28 },
  // —— 回补给（天）· 土地庙=寿命补给站：花几天歇息换寿数 ——
  // 【2026-09-14 用户拍板·收紧出水口】原打坐净回 42 天 = 白嫖 5 个节点消耗，单局入庙 7.2 次
  //   回 302 天，抵消 46% 支出——进水口加压而不同步关出水口，怎么加都白加（9-13 那轮加压
  //   没见效即此因）。现下调到净回 12 天（约 1.5 个节点）：土地庙仍是正收益，但不再能
  //   把西行走成「免费散步」。注：DRUM_DAYS(敲钟) 目前只被 UI 文案引用、无实际消费，暂不动。
  MEDITATE_DAYS: 15,          // 打坐回寿（天）：入庙 3 天 + 回 15 天 → 净回 12 天
  DRUM_DAYS: 30,              // 土地神龛敲钟加寿（天/次）[文案引用·暂无实际消费点]
  // —— 兼容字段（年，由天换算；历史代码读岁口径的入口仍可用）——
  MEDITATE_REGAIN: 15 / 360,  // = MEDITATE_DAYS / DAYS_PER_YEAR（净回需扣 rest 附加）
  DRUM: 30 / 360,             // = DRUM_DAYS / DAYS_PER_YEAR
  // 剩余寿岁告警档位（年，升序：低→高 = 大限将至 → 体力尚可）
  WARN_AGE: [2, 6, 12, 18],
  WARN_TXT: {
    18: '体力尚可，前路尚远。',
    12: '气喘吁吁，每步如负千斤。',
    6: '油尽灯枯，前路只剩归途。',
    2: '咳血，已知大限将至。'
  }
};

// —— 天 → 年 ——
NDX.daysToYears = function (days) {
  const D = (NDX.LIFE && NDX.LIFE.DAYS_PER_YEAR) || 360;
  return (+(days || 0)) / D;
};
// —— 显示格式化：余寿（年）→「X 岁 X 天」——
NDX.fmtLife = function (years) {
  const D = (NDX.LIFE && NDX.LIFE.DAYS_PER_YEAR) || 360;
  const total = Math.max(0, Math.round((+(years || 0)) * D));
  const y = Math.floor(total / D);
  const d = total % D;
  return y > 0 ? (d > 0 ? (y + ' 岁 ' + d + ' 天') : (y + ' 岁'))
               : (d + ' 天');
};
// —— 显示格式化：当前年龄（由余寿换算）→「X 岁 X 天」——
//   当前年龄 = 大限年龄 - 余寿；大限年龄默认 MAX_AGE（50），高难度受 lifeTighten 扣减
NDX.fmtAge = function (remainingYears, maxAge) {
  const D = (NDX.LIFE && NDX.LIFE.DAYS_PER_YEAR) || 360;
  const max = (typeof maxAge === 'number') ? maxAge : ((NDX.LIFE && NDX.LIFE.MAX_AGE) || 50);
  const ageYears = Math.max(0, max - (+(remainingYears || 0)));
  const total = Math.max(0, Math.round(ageYears * D));
  const y = Math.floor(total / D);
  const d = total % D;
  return y > 0 ? (d > 0 ? (y + ' 岁 ' + d + ' 天') : (y + ' 岁'))
               : (d + ' 天');
};
// —— 玩家当前余寿天数（供 UI/日志使用）——
NDX.lifeDays = function (state) {
  const D = (NDX.LIFE && NDX.LIFE.DAYS_PER_YEAR) || 360;
  return Math.max(0, Math.round((((state || {}).life) || 0) * D));
};

// 进入节点耗寿（天）：赶路费 + 节点附加费。缺类型回落 mob。
NDX.lifeCostDays = function (node) {
  const L = NDX.LIFE || {};
  const t = (node && node.type) || 'mob';
  const ride = +L.RIDE_DAYS || 0;
  const add = (L.NODE_DAYS && typeof L.NODE_DAYS[t] === 'number') ? L.NODE_DAYS[t] : (L.NODE_DAYS || {}).mob || 1;
  return ride + add;
};
// 进入节点耗寿（年）——给既有 s.life（年）消费；真源是上面的天口径
NDX.lifeCost = function (node) {
  return NDX.daysToYears(NDX.lifeCostDays(node));
};
// 六道日程（天）
NDX.daoDays = function (dao) {
  const t = (NDX.LIFE && NDX.LIFE.DAO_DAYS) || {};
  return typeof t[dao] === 'number' ? t[dao] : 0;
};

// =============================================================
// V8.61 难度阶梯显性化（Rev.4 报告批次3，对标杀戮尖塔 Ascension）：
//   宽松 = 大限恒为 50、耗寿 ×1.0（叙事玩家 / 首过）
//   标准 = 随难度与周目自动收紧（大限 47/45）
//   严苛 = 大限恒为 45、耗寿 ×1.15（硬核目标 / 冲榜）
// V9.7：maxPenalty 单位改为【年】（与 s.life 同轴），数值由天常量换算思想等价。
// =============================================================
NDX.LIFE_MODES = {
  easy: { name: '宽松', desc: '大限恒为 50 岁 · 耗寿不加息——安心看故事', maxPenalty: 0, costMul: 1 },
  std:  { name: '标准', desc: '随难度与周目自动收紧（大限 47/45）——设计基准', maxPenalty: null, costMul: null },
  hard: { name: '严苛', desc: '大限恒为 45 岁 · 耗寿 ×1.15——拿命硬换', maxPenalty: 3, costMul: 1.15 },
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
// 寿命收紧（高难度/多周目）：返回 maxPenalty（额外折寿上限·年）与 costMul（耗寿倍率）
// =============================================================
NDX.lifeTighten = function (diff, cycle) {
  const mode = NDX.getLifeMode ? NDX.getLifeMode() : 'std';
  if (mode === 'easy') return { maxPenalty: 0, costMul: 1 };
  if (mode === 'hard') return { maxPenalty: 3, costMul: 1.15 };
  const d = diff || 1;
  const c = cycle || (NDX.getCycle ? NDX.getCycle() : 1);
  let maxPenalty = 0, costMul = 1;
  if (d >= 4 || c >= 2) { maxPenalty = 3; costMul = 1.08; }
  if (d >= 5) { maxPenalty = 5; costMul = 1.15; }
  return { maxPenalty: maxPenalty, costMul: costMul };
};

// =============================================================
// V8.55 返程改动：取消三站子地图，改为「固定耗 9 岁返程」。
// 到西天时按余寿 R 三档落结局（见 NDX.LIFE.PERFECT_R / SHRINE_R）。
// =============================================================
NDX.returnShrineRegion = function (R) {
  const r = Math.max(0, +R || 0);
  let region = 18 - Math.ceil(r / 0.5);   // 每半年(0.5余寿)推进一区
  region = Math.max(1, Math.min(17, region));
  return region;
}
