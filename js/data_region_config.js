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
// 设计：完全按国家/地区划分章节，不再强求每章 9 难。第一章含黄风岭（难1-13），
//   以黄风大圣（黄风怪·三形态抉择战）为第一章关隘 Boss；终章凌云渡仅 4 难（难78-81）。
//   ACT_RANGES 为唯一事实来源：各章起始难号 / 末难号 / 地图层数。
//   s.layer 永远在 1~layers 之间循环，单凭 layer 无法区分「第 2 章第 5 难」与「第 1 章第 5 难」，
//   故引入「全局进度」= actStart(act)-1 + layer，把循环层映射为真实的第 N 难（1~81），
//   章节感知函数（材料池 / 散件池 / 装备摇奖）据此解锁对应章节内容。
//   Boss 全局难号 = actEnd(act)（难 4/9/13/18/22/27/31/36/40/45/49/54/58/63/72/77/81）。
// =============================================================
NDX.ACT_RANGES = [
  // 9 大区域（1 地区 = 1 章，单一坐标系统）：每区域 9 难、一段地图、区域末 Boss 收尾。
  // 玉兔精(64-72) 独占区域 8；灵山(73-77) 与 凌云渡(78-81) 合并为区域 9。
  { act: 1,  start: 1,  end: 9,  layers: 10, name: '大唐境内·两界山' },
  { act: 2,  start: 10, end: 18, layers: 6,  name: '黄风岭·流沙河' },
  { act: 3,  start: 19, end: 27, layers: 9,  name: '五庄观·火云洞' },
  { act: 4,  start: 28, end: 36, layers: 9,  name: '车迟国·通天河' },
  { act: 5,  start: 37, end: 45, layers: 9,  name: '女儿国·真假猴王' },
  { act: 6,  start: 46, end: 54, layers: 9,  name: '火焰山·祭赛国' },
  { act: 7,  start: 55, end: 63, layers: 9,  name: '狮驼岭·比丘国' },
  { act: 8,  start: 64, end: 72, layers: 9,  name: '天竺·玉兔' },
  { act: 9,  start: 73, end: 81, layers: 9,  name: '灵山·凌云渡' },
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
