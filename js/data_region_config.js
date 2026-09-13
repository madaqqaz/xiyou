// =============================================================
// data_region_config.js — 《逆道西行》地区配置 · 章节/全局进度
// 从 data.js 拆分（2026-08-31）：独立维护地区配置与章节进度
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.LAYER_COUNT = 9;           // 运行时地图层数（generateMap 按章写入；此处为初始默认值）
NDX.ACT_LABEL = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']; // 卷（Act）中文序号
NDX.MAX_COL = 4;               // 每行（每层）列上限：节点数在 3~4 之间，避免一行五个过密

// =============================================================
// 章节 / 全局进度（九章 · 八十一难 · 按地理段落分章）
// 设计：完全按国家/地区划分章节，不再强求每章 9 难。
// 【2026-09-13 章节边界重排】目标：让「章末难 = 章末标志性 Boss」严格对齐，兑现用户的
//   「第一章打黄风、第二章打白骨」体验诉求。原表 act1=1-9（章末白龙·鹰愁涧）导致玩家
//   前期只觉「打了 3 章才见到黄风」，阶段性成就感缺失。
//   重排后每章章末难 = 9 大章末超级 Boss 的难号：
//     13 黄风 / 22 白骨 / 27 红孩儿 / 36 金鱼精 / 45 六耳 / 54 九头虫 / 58 大鹏 / 72 玉兔 / 81 老鼋。
//   白骨章末取 22（五庄观地区末难），第 20 难「白骨三戏」作为章内前戏保留——
//   三戏(人形态·怯战) → 章末真身(五行归墟)，叙事闭环，不再是两次同质 Boss。
//   layers 严格等于章内难数（start..end 闭区间），修复原表 layers 合计 79≠81 造成的
//   diffOfLayer 断号（难 16-18 等永不出现在地图层映射中）。
//   ACT_RANGES 为唯一事实来源：各章起始难号 / 末难号 / 地图层数。
//   s.layer 永远在 1~layers 之间循环，单凭 layer 无法区分「第 2 章第 5 难」与「第 1 章第 5 难」，
//   故引入「全局进度」= actStart(act)-1 + layer，把循环层映射为真实的第 N 难（1~81），
//   章节感知函数（材料池 / 散件池 / 装备摇奖）据此解锁对应章节内容。
//   Boss 全局难号 = actEnd(act)（难 13/22/27/36/45/54/58/72/81）。
// =============================================================
NDX.ACT_RANGES = [
  // 9 大区域（1 地区 = 1 章，单一坐标系统）：章末即标志性超级 Boss，区域末 Boss 收尾。
  { act: 1,  start: 1,  end: 13, layers: 13, name: '大唐·两界山·黄风岭' }, // 章末 黄风大圣
  { act: 2,  start: 14, end: 22, layers: 9,  name: '流沙河·五庄观' },       // 章末 白骨夫人（20 三戏为前戏）
  { act: 3,  start: 23, end: 27, layers: 5,  name: '火云洞' },              // 章末 红孩儿
  { act: 4,  start: 28, end: 36, layers: 9,  name: '车迟国·通天河' },       // 章末 金鱼精（28-30 车迟斗法为弧中高潮）
  { act: 5,  start: 37, end: 45, layers: 9,  name: '女儿国·真假猴王' },     // 章末 六耳猕猴
  { act: 6,  start: 46, end: 54, layers: 9,  name: '火焰山·祭赛国' },       // 章末 九头虫（48-49 牛魔王为弧中高潮）
  { act: 7,  start: 55, end: 58, layers: 4,  name: '狮驼岭' },              // 章末 大鹏金翅雕（紧凑高潮章）
  { act: 8,  start: 59, end: 72, layers: 14, name: '比丘国·天竺' },         // 章末 假公主·玉兔（长线铺陈章）
  { act: 9,  start: 73, end: 81, layers: 9,  name: '灵山·凌云渡' },         // 章末 老鼋（80 阿难迦叶为章内 Boss）
];
NDX.TOTAL_ACTS = NDX.ACT_RANGES.length;      // 九大区域（=章，1:1）
NDX.TOTAL_TRIALS = 81; // 八十一难：第 81 难「金蝉脱壳」为终局叙事
NDX.ACT_NAMES = NDX.ACT_RANGES.map((r) => r.name); // 地区叙事名
// —— 章节辅助函数（唯一事实来源 ACT_RANGES）——
NDX.actRange = function (act) { return NDX.ACT_RANGES.find((r) => r.act === act) || NDX.ACT_RANGES[NDX.ACT_RANGES.length - 1]; };
NDX.actStart = function (act) { return NDX.actRange(act).start; };          // 本章起始难号
NDX.actEnd = function (act) { return NDX.actRange(act).end; };              // 本章末难（关隘 Boss 难号）
NDX.actTrials = function (act) { const r = NDX.actRange(act); return r.end - r.start + 1; }; // 本章难数
NDX.actLayers = function (act) { return NDX.actRange(act).layers; };        // 本章地图层数
// —— 战斗功能章节门禁（17地区制 s.act，单一真源）——
// 单局肉鸽渐进解锁，降低前期学习成本：强制手动→自动战斗→2x→3x→跳过，随地区推进逐步开放。
NDX.FIGHT_GATE = { auto: 4, speed2: 1, speed3: 6, skip: 8 }; // 节奏对标尖塔：2x 首地区即解锁（自动战斗的观看时长是新手流失主因）；3x 第6区、跳过第8区
