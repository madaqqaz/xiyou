// =============================================================
// data_region_config.js — 《逆道西行》地区配置 · 章节/全局进度
// 从 data.js 拆分（2026-08-31）：独立维护地区配置与章节进度
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.LAYER_COUNT = 9;           // 运行时地图层数（generateMap 按章写入；此处为初始默认值）
NDX.ACT_LABEL = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']; // 卷（Act）中文序号
NDX.MAX_COL = 5;               // 每行（每层）列上限：节点数在 3~5 之间（PHASE 8：4→5，分支度对齐杀戮尖塔 4-6 格/行，每章格数 23→约30）

// =============================================================
// 章节 / 全局进度（九章 · 八十一难 · 按地理段落分章）
// 设计：完全按国家/地区划分章节，不再强求每章 9 难。
// 【2026-09-13 章节边界重排】目标：让「章末难 = 章末标志性 Boss」严格对齐，兑现用户的
//   「第一章打黄风、第二章打白骨」体验诉求。原表 act1=1-9（章末白龙·鹰愁涧）导致玩家
//   前期只觉「打了 3 章才见到黄风」，阶段性成就感缺失。
//   重排后每章章末难 = 9 大章末超级 Boss 的难号：
//     13 黄风 / 22 白骨 / 27 红孩儿 / 36 金鱼精 / 45 六耳 / 54 九头虫 / 58 大鹏 / 72 玉兔 / 81 老鼋。
//   白骨章末取 22（第 2 章末难），第 20 难「白骨三戏」作为章内前戏保留——
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
  // 【2026-09-13 劫难融合】layers 由 13 → 11：难1-3（金蝉遭贬／出胎几杀／满月抛江，皆纯叙事
  //   仅需六道一择）合并为 1 个复合节点「江流儿劫」；长安送行仍单占 1 层（赠宝教学不可并入）。
  //   层号不再等于章内难数——除融合弧外的层，难号仍按 L → actStart+L-1 绑定（见 _assignTrialDiffs）。
  { act: 1,  start: 1,  end: 13, layers: 11, name: '大唐·两界山·黄风岭' }, // 章末 黄风大圣
  // 【2026-09-13 PHASE 7 劫难融合】layers 9 → 7：14/15（高老庄）、16/17（流沙河）各并为 1 弧，
  //   章内 9 难 → 2 弧（共承载 4 难）+ 4 单层（18-21）+ 1 关隘 Boss = 7 层，无纯填充层。
  { act: 2,  start: 14, end: 22, layers: 7,  name: '高老庄·流沙河·白骨岭' },       // 章末 白骨夫人（20 三戏为前戏）
  { act: 3,  start: 23, end: 27, layers: 5,  name: '黑松林·平顶山·火云洞' },              // 章末 红孩儿
  { act: 4,  start: 28, end: 36, layers: 9,  name: '车迟国·通天河' },       // 章末 金鱼精（28-30 车迟斗法为弧中高潮）
  { act: 5,  start: 37, end: 45, layers: 9,  name: '女儿国·真假猴王' },     // 章末 六耳猕猴
  { act: 6,  start: 46, end: 54, layers: 9,  name: '火焰山·祭赛国' },       // 章末 九头虫（48-49 牛魔王为弧中高潮）
  // 【2026-09-14 P0 整改·ch7 塌陷】layers 4 → 9（原 4 层 / 7.5 格 / 分支度 1.88，全九章垫底）。
  //   结构：L1 荆棘岭弧 / L2 小雷音弧 / L3 朱紫国弧 / L4-L8 探索纵深 5 层 / L9 章末 Boss。
  //   章内仅 3 个非 Boss 难号（55/56/57），故 L4-L8 为无劫难位的纯探索层（compact 游标在
  //   cursor >= hi(58) 后自动跳过，详见 COMPOUND_NODES[7] 注释）。
  { act: 7,  start: 55, end: 58, layers: 9,  name: '荆棘岭·小雷音·狮驼岭' },              // 章末 大鹏金翅雕（紧凑高潮章）
  { act: 8,  start: 59, end: 72, layers: 10, name: '比丘国·天竺' },         // 章末 假公主·玉兔（5 弧承载 59-66/68-71；67 铜台辨冤落 L9）
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
