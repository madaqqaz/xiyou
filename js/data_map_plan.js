// =============================================================
// data_map_plan.js — 《逆道西行》地图计划 · MAP_PLAN/MAP_PLAN_CH1
// 从 data.js 拆分（2026-08-31）：独立维护地图计划模板
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// 通用地图模板（第 2~9 章复用）：9 层结构（第 1 层被固定序章覆盖，
// 第 8 层为 Boss 前休整，第 9 层=唯一关隘 Boss 汇聚点；位置由 generateMap 随机游走决定）
NDX.MAP_PLAN = [
  { type: 'mob',   name: '山道喽啰', diff: 1, gold: 22, drop: 'tm_w_base' }, // idx0 第1层(被固定序章覆盖)
  { type: 'trial', name: '劫难', diff: 2, drop: ['tm_w_base', 'set_weapon_base', '破军·锋', '破军·脊', 'pj_armor_base', '破军·铠', '破军·骨', 'pj_treasure_base', '破军·印', '破军·魄', 'ss_staff_base', 'ss_skull_base', 'ss_robe_base', '杖·降妖', '杖·沉', '串·髑', '串·咒', '袍·麻', '袍·禅'] },
  { type: 'elite', name: '高老招亲', diff: 3 },
  { type: 'mob',   name: '山神庙外·拦路小妖', diff: 4, gold: 30 },
  { type: 'trial', name: '劫难', diff: 5, drop: ['de_t_base', 'ts_robe_base', '袈裟·金线', '袈裟·佛纹'] },
  { type: 'shop',  name: '游方货郎', diff: 6, priceTier: 2 },
  { type: 'elite', name: '金兜洞·青牛精', diff: 7 }, // 第7层精英：提前体验"兵器被套"机制（呼应第18难黄风大圣）
  { type: 'rest',  name: '土地庙', diff: 8 },  // Boss 前一层必定是火堆（最后休整）
  { type: 'boss',  name: '', diff: 9 },        // 第9层：唯一关隘 Boss 汇聚点（第9难打boss）
];

// 第一章（新手 难1~13）专属地图模板：在 MAP_PLAN 基础上做新手友好化改造，
// 仅 act===1 使用（第 2~9 章复用 MAP_PLAN + ACT_MAP_THEME，不受影响）：
//   · 精英少（第 3/11 层 2 个），降低机制理解成本（命痕/韧性条等新机制少而精）
//   · 保留问号事件(event) 节点：满足第一部分缘分门槛「缘遇」、保留西行奇遇感
//   · 功能房只留「篝火(土地庙) + 商店」：移除宝窟(treasure)，避免过多功能房机制
//   · 第一章按地理段落收尾：大唐境内(1-4)→两界山(5-9)→黄风岭(10-13)，
//     第 13 层=最终关隘 Boss 汇聚点（黄风大圣·三形态抉择战），黄风岭为第一章收官
// 【2026-09-13 章节重排】act1 章内难数 = 13（原 17 地区制下 大唐境内4 + 两界山5 + 黄风岭1 合并而来），
//   故地图行数由 10 扩到 13，数组补齐到 13 项（与行号一一对应，索引 = 行号-1）：
//     行1-4 固定序章（trial×3 + songEvent，见 data_map._buildRegionSegment 硬固定，本模板不生效）
//     行10 黄风岭三连难弧（COMPOUND_NODES[1] 融合节点占位，本模板第 10 项不生效）
//     行13 关隘 Boss（由 data_map 按 actEnd(1)=13 强制生成，本模板末项不生效）
//   行11 精英「黄风岭·虎先锋」+ 行12 篝火「土地庙」：补齐弧后到 Boss 前的两行，
//   形成「三连难弧 → 精英挑衅 → 庙前休整 → 黄风大圣」的收束节奏（Boss 前一层必为火堆）。
NDX.MAP_PLAN_CH1 = [
  { type: 'mob',   name: '山道喽啰', diff: 1, gold: 22, drop: 'tm_w_base' }, // idx0 第1层(被固定序章覆盖)
  { type: 'trial', name: '劫难', diff: 2, drop: ['tm_w_base', 'set_weapon_base', '破军·锋', '破军·脊', 'pj_armor_base', '破军·铠', '破军·骨', 'pj_treasure_base', '破军·印', '破军·魄', 'ss_staff_base', 'ss_skull_base', 'ss_robe_base', '杖·降妖', '杖·沉', '串·髑', '串·咒', '袍·麻', '袍·禅'] }, // idx1 第2层(被固定序章覆盖)
  { type: 'elite', name: '黄风卷岭', diff: 3 }, // idx2 第3层(被固定序章覆盖)
  { type: 'mob',   name: '山神庙外·拦路小妖', diff: 4, gold: 30 }, // idx3 第4层(被固定序章覆盖)
  { type: 'event', name: '缘', diff: 5 }, // idx4 第5层：缘分门槛·缘遇
  { type: 'trial', name: '劫难', diff: 6, drop: ['de_t_base', 'ts_robe_base', '袈裟·金线', '袈裟·佛纹'] }, // idx5 第6层
  { type: 'shop',  name: '游方货郎', diff: 7, priceTier: 2 }, // idx6 第7层
  { type: 'rest',  name: '土地庙', diff: 8 },  // idx7 第8层：两界山段休整
  { type: 'trial', name: '劫难', diff: 9, drop: ['set_armor_base', '玄武·鳞', '玄武·心'] },  // idx8 第9层：两界山收尾
  { type: 'trial', name: '劫难', diff: 10, drop: ['de_a_base'] }, // idx9 第10层：被黄风岭弧融合节点占位，不生效
  { type: 'elite', name: '黄风岭·虎先锋', diff: 11 }, // idx10 第11层：弧后挑衅，虎先锋横刀拦路
  { type: 'rest',  name: '土地庙', diff: 12 },  // idx11 第12层：Boss 前最后休整（关隘前必为火堆）
];
