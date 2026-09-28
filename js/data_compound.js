// =============================================================
// data_compound.js — 《逆道西行》复合节点系统 · COMPOUND_NODES
// 从 data.js 拆分（2026-08-31）：独立维护复合节点系统（多劫难合并为一个大节点）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.COMPOUND_NODES = {
  // 【2026-09-21 V9.14】全九章按骨架真源 v1.19 的「复合劫难」小节重排。
  //   弧 = 骨架里标〔复合劫难〕的一块（多个难号并为一个地图节点，进入后逐难推进六道抉择）。
  //   章末 Boss 恒独占末行、不入弧（ACT_RANGES.end ↔ CHAPTER_BOSS_NAMES ↔ BOSS_FORMS 三向对齐）。
  //   九章一律 compact:true —— 难号由游标顺序填层、自动跳过入弧难号（见 _assignTrialDiffs）。
  // 一 1-14（layers 10）：弧[1,2,3]@L1 · 弧[5,6,7]@L3 · 弧[10,11]@L6；L2 长安送行(songEvent)
  1: {
    fusions: [
      { layer: 1, diffs: [1, 2, 3], name: '江流儿劫', title: '第1-3难 · 江流儿劫', icon: '🪞', themeTutorial: true },
      { layer: 3, diffs: [5, 6, 7], name: '双叉岭·两界山头', title: '第5-7难 · 双叉岭 · 寅将军 · 两界山头', icon: '⛰' },
      { layer: 6, diffs: [10, 11], name: '观音院·黑风山', title: '第10-11难 · 观音院 ＋ 黑风山', icon: '🏯' },
    ],
    compact: true,
    layer: 1,
    name: '江流儿劫',
    title: '第1-14难 · 黄风岭之劫',
    icon: '🌪',
    diffs: [1, 2, 3, 5, 6, 7, 10, 11], // 兼容字段（不含章末难14 黄风怪）
    themeTutorial: true,
  },
  // 二 15-20（layers 4）：弧[15,16]@L1 · 弧[18,19]@L3；L2 单难 17 四圣试禅心；L4 章末 20 白骨精
  2: {
    fusions: [
      { layer: 1, diffs: [15, 16], name: '流沙河·收沙僧', title: '第15-16难 · 流沙河 · 收沙僧', icon: '🌊' },
      { layer: 3, diffs: [18, 19], name: '五庄观·人参果', title: '第18-19难 · 五庄观 · 人参果', icon: '🍐' },
    ],
    compact: true,
    layer: 1,
    name: '流沙河·五庄观',
    title: '第15-20难 · 白骨岭之劫',
    icon: '⚔️',
    diffs: [15, 16, 18, 19],
  },
  // 三 21-31（layers 7）：弧[21,22,23]@L1 · 弧[24,25]@L2 · 弧[26,27]@L3；L4-L6 单难 28/29/30；L7 章末 31 红孩儿
  3: {
    fusions: [
      { layer: 1, diffs: [21, 22, 23], name: '宝象国·黄袍怪', title: '第21-23难 · 宝象国 · 黄袍怪', icon: '🐺' },
      { layer: 2, diffs: [24, 25], name: '平顶山·金角银角', title: '第24-25难 · 平顶山 · 金角银角', icon: '⛏' },
      { layer: 3, diffs: [26, 27], name: '乌鸡国·金丹救主', title: '第26-27难 · 乌鸡国 · 金丹救主', icon: '💊' },
    ],
    compact: true,
    layer: 1,
    name: '宝象国·平顶山·火云洞',
    title: '第21-31难 · 火云洞之劫',
    icon: '🔥',
    diffs: [21, 22, 23, 24, 25, 26, 27],
  },
  // 四 32-41（layers 6）：L1 单难 32 黑水河 · 弧[33,34,35]@L2 车迟国 · 弧[36,37,38]@L3 通天河
  //   L4-L5 单难 39/40 · L6 章末 41 青牛精。车迟/通天河双标记按子难区间分离（防互污）。
  4: {
    fusions: [
      { layer: 2, diffs: [33, 34, 35], name: '车迟国斗法', title: '第33-35难 · 车迟国斗法', icon: '⚔️', chechi: true },
      { layer: 3, diffs: [36, 37, 38], name: '通天河·灵感', title: '第36-38难 · 通天河', icon: '🌊', tongtian: true },
    ],
    compact: true,
    layer: 2,
    name: '车迟国·通天河',
    title: '第32-41难 · 金兜山之劫',
    icon: '⚔️',
    diffs: [33, 34, 35, 36, 37, 38],
    chechi: true,
    tongtian: true,
    chechiRange: [33, 35],    // 车迟弧子难区间
    tongtianRange: [36, 38],  // 通天河弧子难区间
  },
  // 五 42-46（layers 4）：弧[42,43]@L1 女儿国 · L2-L3 单难 44/45 · L4 章末 46 六耳猕猴
  5: {
    fusions: [
      { layer: 1, diffs: [42, 43], name: '女儿国', title: '第42-43难 · 女儿国', icon: '👑' },
    ],
    compact: true,
    layer: 1,
    name: '女儿国',
    title: '第42-46难 · 女儿国之劫',
    icon: '⚔️',
    diffs: [42, 43],
  },
  // 六 47-51（layers 3）：弧[47,48,49]@L1 火焰山（骨架章末 Boss 牛魔王在 49）· L2 单难 50 · L3 章末 51
  6: {
    fusions: [
      { layer: 1, diffs: [47, 48, 49], name: '火焰山·三调芭蕉扇', title: '第47-49难 · 火焰山 · 三调芭蕉扇', icon: '🔥' },
    ],
    compact: true,
    layer: 1,
    name: '火焰山',
    title: '第47-51难 · 火焰山之劫',
    icon: '⚔️',
    diffs: [47, 48, 49],
  },
  // 七 52-64（layers 10）：L1 单难 52 荆棘岭 · 弧[53,54]@L2 小雷音 · L3 单难 55 稀柿同
  //   弧[56,57,58]@L4 朱紫国 · L5-L9 单难 59/60/61/62/63 · L10 章末 64 狮驼岭三魔
  7: {
    fusions: [
      { layer: 2, diffs: [53, 54], name: '小雷音·黄眉童儿', title: '第53-54难 · 小雷音寺 · 黄眉童儿', icon: '🛕' },
      { layer: 4, diffs: [56, 57, 58], name: '朱紫国·金圣宫', title: '第56-58难 · 朱紫国 · 金圣宫', icon: '🔔' },
    ],
    compact: true,
    layer: 2,
    name: '荆棘岭·朱紫国·狮驼岭',
    title: '第52-64难 · 狮驼岭之劫',
    icon: '⚔️',
    diffs: [53, 54, 56, 57, 58],
  },
  // 八 65-75（layers 8）：弧[65,66]@L1 比丘国 · 弧[67,68,69]@L2 无底洞
  //   L3-L7 单难 70/71/72/73/74 · L8 章末 75 九灵元圣
  8: {
    fusions: [
      { layer: 1, diffs: [65, 66], name: '比丘国·小孩心肝', title: '第65-66难 · 比丘国 · 小孩心肝', icon: '🦌' },
      { layer: 2, diffs: [67, 68, 69], name: '无底洞·老鼠精', title: '第67-69难 · 无底洞 · 金鼻白毛老鼠精', icon: '🕳' },
    ],
    compact: true,
    layer: 1,
    name: '比丘国·无底洞·玉华州',
    title: '第65-75难 · 比丘国之劫',
    icon: '⚔️',
    diffs: [65, 66, 67, 68, 69],
  },
  // 九 76-81（layers 5）：弧[76,77]@L1 金平府 · L2-L4 单难 78/79/80 · L5 章末 81 灵山取经
  9: {
    fusions: [
      { layer: 1, diffs: [76, 77], name: '金平府·三犀', title: '第76-77难 · 金平府 · 三只犀牛精', icon: '🦏' },
    ],
    compact: true,
    layer: 1,
    name: '金平府·灵山',
    title: '第76-81难 · 灵山之劫',
    icon: '⚔️',
    diffs: [76, 77],
  },
};
// V8.34 自动生成 act4~终章 融合节点（基于 ACT_RANGES，地区配额制）
//   规则：非 Boss 难号（start..end-1）分成 2~3 组融合节点，分布在 L1/L2(/L3)；
//   5难地区(4非Boss)→3组[2,1,1]，4难地区(3非Boss)→2组[2,1]，大地区(≥6非Boss)→3组均分；
//   act3 黄风岭 layers=1 特殊，保持原有旧式复合节点逻辑，不自动生成。
// 【2026-09-13 坐标系修正】上界原硬编码 17（17 地区制残留），9 章制下会为不存在的 act10~17
//   生成 COMPOUND_NODES 副本（actRange 回退到末章，污染映射表）。改为按 TOTAL_ACTS 收口。
(function () {
  for (let act = 4; act <= (NDX.TOTAL_ACTS || 9); act++) {
    if (NDX.COMPOUND_NODES[act]) continue; // 已手动定义则跳过
    const r = NDX.actRange(act);
    const nonBoss = [];
    for (let d = r.start; d < r.end; d++) nonBoss.push(d);
    let groups, layers;
    if (nonBoss.length >= 6) {
      // 大地区（≥6非Boss，如天竺·玉兔8难）：3组各2难，覆盖前6难；剩余难号由普通探索层承载
      groups = [nonBoss.slice(0, 2), nonBoss.slice(2, 4), nonBoss.slice(4, 6)];
      layers = [1, 2, 3];
    } else if (nonBoss.length >= 4) {
      // 5难地区（4非Boss）：3组[2,1,1]，分布 L1/L2/L3
      groups = [nonBoss.slice(0, 2), [nonBoss[2]], [nonBoss[3]]];
      layers = [1, 2, 3];
    } else {
      // 4难地区（3非Boss）：2组[2,1]，分布 L1/L2
      groups = [nonBoss.slice(0, 2), [nonBoss[2]]];
      layers = [1, 2];
    }
    const fusions = groups.map((diffs, i) => ({
      layer: layers[i],
      diffs,
      name: r.name + '·融合' + (i + 1),
      title: '第' + diffs[0] + (diffs.length > 1 ? '-' + diffs[diffs.length - 1] : '') + '难 · ' + r.name,
      icon: '⚔️',
    }));
    NDX.COMPOUND_NODES[act] = {
      fusions,
      quotaTier: true,
      layer: 1,
      name: r.name + '·地区配额',
      title: '第' + r.start + '-' + r.end + '难 · ' + r.name,
      icon: '⚔️',
      diffs: nonBoss.slice(),
    };
  }
})();
// 通天河终局矩阵（第二批 §一 / §零.4）：按子难组合决定第36难金鱼精决战的收场。
//   全渡 → 观音持鱼篮收金鱼，决战不战而解；全逆 → 河神怨气反噬，金鱼精攻势 +15%；其余 → 正常决战。
//   仅打标记，不改变融合节点分布（地图结构零影响）。
// 【2026-09-13 坐标系修正】原标记落在 act8，但通天河（难32-36）在 9 章制下属 **act4（28-36）**；
//   act8 现为「天竺·玉兔」（难64-72）。旧标记导致终局矩阵在天竺章错误触发、通天河章永不触发。
if (NDX.COMPOUND_NODES[4]) NDX.COMPOUND_NODES[4].tongtian = true;
NDX.compoundFor = function (act) { return (NDX.COMPOUND_NODES && NDX.COMPOUND_NODES[act]) || null; };
NDX.compoundDiffsFor = function (act) { const c = NDX.compoundFor(act); return c ? c.diffs.slice() : []; };
// V8.34 融合节点序列：复合节点支持 fusions 数组（多融合节点分布各层）。无 fusions 时回退旧式单节点。
NDX.regionFusions = function (act) {
  const c = NDX.compoundFor(act);
  if (c && Array.isArray(c.fusions) && c.fusions.length) return c.fusions;
  return null;
};
// 某层是否有融合节点（返回该融合节点定义，无则 null）
NDX.fusionAtLayer = function (act, layer) {
  const fs = NDX.regionFusions(act);
  if (!fs) return null;
  return fs.find((f) => f.layer === layer) || null;
};
NDX.isCompoundDiff = function (act, diff) { return NDX.compoundDiffsFor(act).indexOf(diff) >= 0; };
NDX.actOf = function (progress) {                                            // 全局难号(1~81) → 17地区号(1~17)
  const p = Math.max(1, progress || 1);
  for (let i = 0; i < NDX.ACT_RANGES.length; i++) {
    if (p <= NDX.ACT_RANGES[i].end) return NDX.ACT_RANGES[i].act;
  }
  return NDX.TOTAL_ACTS;
};
NDX.isBossTrial = function (diff) {                                          // 是否某章关隘 Boss 难号
  const d = +diff;
  return NDX.ACT_RANGES.some((r) => r.end === d);
};
// 地理段落（V8.22）：难簿长卷按地理脉络分段标注，玩家可循国境追索八十一难。
// 【2026-09-13 坐标系修正】原 GEO_SEGMENTS 是 17 地区制硬编码表（act 1~17），与 9 章制 ACT_RANGES
//   完全脱节：ui_misc_1.geoSegmentsHtml 会渲染出「第10地区 · 真假猴王」，而全局其余处已显示「第5章」，
//   同一局里出现两套区划口径。现改为「ACT_RANGES 作章真源 + 17 个原著地理段名作章内细分」派生：
//   长卷的「第N章 · 章名」与全局一致，地理细节不丢（17 段边界天然整段嵌套进 9 章，无跨章残段）。
NDX.GEO_REGION_SEGS = [
  // 【2026-09-21 V9.14 重排】旧 17 段按 17 地区制边界写死，新九章下大量段跨章被 filter 丢弃
  //   （geoSegmentOf 对跨章难返回 null）。现按骨架 v1.19 各章「地理小节」重划为 42 段，
  //   每段整段嵌套进唯一一章，覆盖 1-81 全难无洞。
  { name: '大唐境内',  lo: 1,  hi: 4  },   // 一
  { name: '双叉岭',    lo: 5,  hi: 7  },
  { name: '两界山',    lo: 8,  hi: 8  },
  { name: '鹰愁涧',    lo: 9,  hi: 9  },
  { name: '观音院·黑风山', lo: 10, hi: 11 },
  { name: '高老庄',    lo: 12, hi: 12 },
  { name: '黄风岭',    lo: 13, hi: 14 },
  { name: '流沙河',    lo: 15, hi: 16 },   // 二
  { name: '四圣试禅心', lo: 17, hi: 17 },
  { name: '五庄观',    lo: 18, hi: 19 },
  { name: '白骨岭',    lo: 20, hi: 20 },
  { name: '宝象国',    lo: 21, hi: 23 },   // 三
  { name: '平顶山',    lo: 24, hi: 25 },
  { name: '乌鸡国',    lo: 26, hi: 27 },
  { name: '火云洞',    lo: 28, hi: 31 },
  { name: '黑水河',    lo: 32, hi: 32 },   // 四
  { name: '车迟国',    lo: 33, hi: 35 },
  { name: '通天河',    lo: 36, hi: 38 },
  { name: '金兜山',    lo: 39, hi: 41 },
  { name: '女儿国',    lo: 42, hi: 43 },   // 五
  { name: '琵琶洞',    lo: 44, hi: 44 },
  { name: '真假猴王',  lo: 45, hi: 46 },
  { name: '火焰山',    lo: 47, hi: 49 },   // 六
  { name: '祭赛国',    lo: 50, hi: 51 },
  { name: '荆棘岭',    lo: 52, hi: 52 },   // 七
  { name: '小雷音',    lo: 53, hi: 54 },
  { name: '稀柿同',    lo: 55, hi: 55 },
  { name: '朱紫国',    lo: 56, hi: 58 },
  { name: '盘丝洞',    lo: 59, hi: 59 },
  { name: '黄花观',    lo: 60, hi: 60 },
  { name: '狮驼岭',    lo: 61, hi: 64 },
  { name: '比丘国',    lo: 65, hi: 66 },   // 八
  { name: '无底洞',    lo: 67, hi: 69 },
  { name: '灭法国',    lo: 70, hi: 70 },
  { name: '隐雾山',    lo: 71, hi: 71 },
  { name: '凤仙郡',    lo: 72, hi: 72 },
  { name: '玉华州',    lo: 73, hi: 75 },
  { name: '金平府',    lo: 76, hi: 77 },   // 九
  { name: '天竺国',    lo: 78, hi: 78 },
  { name: '铜台府',    lo: 79, hi: 79 },
  { name: '凌云渡',    lo: 80, hi: 80 },
  { name: '灵山',      lo: 81, hi: 81 },
];
NDX.GEO_SEGMENTS = (NDX.ACT_RANGES || []).map((r) => ({
  act: r.act,
  name: r.name,
  // 章内细分段：只取完全落在本章 [start, end] 内的地理段
  segs: NDX.GEO_REGION_SEGS.filter((g) => g.lo >= r.start && g.hi <= r.end)
    .map((g) => ({ name: g.name, lo: g.lo, hi: g.hi })),
}));
// 由难号取地理段落：返回 { act, region, seg, lo, hi } 或 null
NDX.geoSegmentOf = function (diff) {
  const d = +diff;
  for (let i = 0; i < NDX.GEO_SEGMENTS.length; i++) {
    const g = NDX.GEO_SEGMENTS[i];
    for (let j = 0; j < g.segs.length; j++) {
      const seg = g.segs[j];
      if (d >= seg.lo && d <= seg.hi) return { act: g.act, region: g.name, seg: seg.name, lo: seg.lo, hi: seg.hi };
    }
  }
  return null;
};
// 全局进度（真实第 N 难编号）：全局层 → 所属地区 → 真实难号
NDX.globalProgress = function (s) {
  return NDX.diffOfLayer((s && s.layer) || 1);
};
// 由全局难号(1~81)推断所属**章号**(1~9)；chapterOf 为历史别名，语义与 actOf 完全一致。
// 🩸 2026-09-28 修正：本注释原写「17 地区制，非章节 1~9」——**事实相反**。ACT_RANGES 已 9 项、
//   TOTAL_ACTS=9，chapterOf 返回的就是章号 1~9；照注释去「换算回地区号」反而会引入越界。
NDX.chapterOf = function (progress) {
  return NDX.actOf(progress);
};

// ============================================================
// V8.37 地区→档位映射：修复装备/红材/转职三处标尺错位
// 问题：曾有一段时间 chapterOf/actOf 与「装备4章制 / 红材3档 / 转职9章制」标尺错位，
//       直接用 chapterOf 对比导致凌云级装备/凌云木提前约47难进入掉落池，
//       转职二/三阶门槛被压到一半，中局数值偏膨胀，难度曲线被压平。
// 方案：不动 actOf 的章号语义，新增映射函数统一三处消费点（regionToTier / regionToActChapter）。
//   🩸 2026-09-28：本段旧注释把 actOf 描述为「返回 17 地区号(1-17)」，与实现（返回 1~9）不符，
//      已订正——当前唯一坐标系真源是 data_region_config.js 的 ACT_RANGES / TOTAL_ACTS = 9。
// ============================================================

// P2 正式接口：章号 → 4档装备映射（regionToTier）
// 唯一真源：所有装备章节消费点（掉落池 cap / 章节套件解锁 / 红材阈值）统一走本映射，
// 替代直接拿 chapterOf 与装备 chapter(4章制) 对比的错位写法。
// 【2026-09-13 坐标系修正】09-01 地理重排后 ACT_RANGES 已是 9 章制，chapterOf 返回 9 章号(1~9)，
//   而本函数旧实现仍按「17 地区号」分档（r<=4/9/13），输入 9 章号时永远落在 1~2 档 → 装备档位锁死。
//   现改为「章号 → 章首难号 → 难号分档」，档位边界仍按难号语义（1-18/19-40/41-58/59-81）保持不变。
//   章1(难1)档1  章3(难21)档2  章5(难37)档3  章8(难64)档4
NDX.regionToTier = function (chapter) {
  const c = Math.max(1, Math.min(9, +chapter || 1));
  const d = (NDX.actStart && NDX.actStart(c)) || 1;   // 该章章首难号
  if (d <= 18) return 1;
  if (d <= 40) return 2;
  if (d <= 58) return 3;
  return 4;
};
// 兼容别名（V8.37 旧名，避免遗漏引用）
NDX.regionToEquipChapter = NDX.regionToTier;

// 章号 → 9章转职档位（转职actGate用）
// 【2026-09-13 坐标系修正】09-01 后 chapterOf 已返回 9 章号，消费点传进来的就是章号，
//   旧实现再按「17地区→9章」做 ceil(r/2) 二次映射，导致转职门槛被压到一半（act9→5）。
//   现改为直通（clamp 1~9），与 ACT_RANGES 的 9 章制语义一致。
NDX.regionToActChapter = function (chapter) {
  return Math.max(1, Math.min(9, +chapter || 1));
};
// 推荐战力：根据难号估算该难 Boss 的预估战力（指数成长，与全局难号曲线对齐）
// V9.x 数值重标定：原公式基数280+指数1.25导致前期高估、后期低估，前陡后平严重
// 调整为基数200+指数1.20，匹配怪物HP实际增长曲线（难20后指数1.16）
// 难1≈208，难20≈400，难81≈1190；用于「战力总评」对比条
NDX.recommendPower = function (diff) {
  const d = Math.max(1, diff || 1);
  return Math.round(200 + 200 * Math.pow(d / 20, 1.20));
};
NDX.START_LAYER = 0;           // 逻辑起点层（无节点），位于第 1 层之前，开局即自选第 1 层
NDX.START_COL = 0;             // 起点无固定列：第 1 层多节点由 nextNodes(0) 统一返回

// =============================================================


// =============================================================
// 一生账本（§16.2 单源）：由 state 统算「本世攒得 / 已失落 / 将传承」三项，
// 供 ui.js 常驻面板渲染。避免各系统各自记账（补强项 F）。
// 继承口径复用 achievements 的「本命藏品」（本命红装 setTier>=3 / 专属法宝 owner=该英雄）+ Boss遗物 + 佛经拓印。
// =============================================================
NDX.accountSnapshot = function (s) {
  const empty = { gained: [], lost: [], toInherit: [] };
  if (!s) return empty;
  const hero = s.hero;
  const heroSet = NDX.HERO_SET_NAME && NDX.HERO_SET_NAME[hero];
  const gained = [];
  const toInherit = [];
  const benMing = [];

  // —— 本命藏品（仅本世攒得）：本命红装（该英雄专属套成品）+ 专属法宝 ——
  // V8.60 承继去法宝：承继真源 saveInherit 的 equips 恒空，红装/法宝每世重历重得，故只计入本世攒得、不传承。
  (s.equips || []).forEach((e) => {
    if (!e) return;
    const isBenMing = (NDX.isRedEquip && NDX.isRedEquip(e, heroSet)) || (e.treasure && e.owner === hero);
    if (isBenMing) {
      benMing.push({ kind: '本命', name: e.name || e.treasureId || '无铭' });
      gained.push({ kind: '本命', name: e.name || e.treasureId || '无铭' });
    }
  });

  // Boss 遗物（跨 Act 永久持有 → 传承）
  (s.relics || []).forEach((rid) => {
    const d = (NDX.BOSS_RELICS || []).find((r) => r.id === rid);
    const nm = d ? d.name : rid;
    gained.push({ kind: '遗物', name: nm });
    toInherit.push({ kind: '遗物', name: nm });
  });

  // 劫印（单局构筑层，随行；胜利时传承，失败则失落 —— 对齐 saveInherit 仅通关后触发引渡）
  const seals = s.seals || [];
  if (seals.length) {
    const byDao = {};
    seals.forEach((sd) => { const k = sd.dao || '无道'; byDao[k] = (byDao[k] || 0) + 1; });
    const sealDesc = Object.keys(byDao).map((k) => `${k}×${byDao[k]}`).join(' · ');
    gained.push({ kind: '劫印', name: sealDesc });
    if (s.over && s.over.win) toInherit.push({ kind: '劫印', name: sealDesc });
  }

  // 佛经全本（合成即传承入库）
  (s.sutras || []).forEach((sid) => {
    // P0-3：SUTRA_SIX_CANG 的键是藏 key（tiandao/…），而 sid 是经文全本 id（su_full_jingang），
    // 直接以 sid 取值恒为 undefined，导致传承面板显示裸 id。需先经 SUTRA_DAO_OF 反查藏 key。
    const _cangKey = (NDX.SUTRA_DAO_OF || {})[sid];
    const d = _cangKey && (NDX.SUTRA_SIX_CANG || {})[_cangKey];
    const nm = d ? d.name : sid;
    gained.push({ kind: '佛经', name: nm });
    toInherit.push({ kind: '佛经', name: nm });
  });

  // 逆道经文全本（合成即传承入库 —— 对齐 saveInherit 的 niSutras）
  (s.niSutras || []).forEach((sid) => {
    const d = NDX.niSutraFullById && NDX.niSutraFullById(sid);
    const nm = d ? d.name : sid;
    gained.push({ kind: '逆经', name: nm });
    toInherit.push({ kind: '逆经', name: nm });
  });

  // 师徒缘（V8.17）：徒弟随行一生，计入本世攒得；不传承（未入 saveInherit 引渡匣，死后与世而散）
  (s.disciples || []).forEach((did) => {
    const d = NDX.DISCIPLE_LIB[did];
    if (!d) return;
    gained.push({ kind: '徒弟', name: `${d.name}（${d.desc}）` });
  });

  // 随身家当概览（法宝/兵甲，容上取概览式，过多折叠显示计数）
  const gear = (s.equips || []).filter((e) => e && e.name);
  if (gear.length) {
    const nm = gear.slice(0, 5).map((e) => e.name).join(' · '); 
    gained.push({ kind: '家当', name: gear.length > 5 ? `${nm} 等 ${gear.length} 件` : nm });
  }

  // 随行本命 → 仅本世攒得（见上方本命藏品收集），不传承

  // 拓印经文（跨周目永久）
  let rubbed = 0;
  try { rubbed = NDX.loadRubbing ? Object.keys(NDX.loadRubbing()).length : 0; } catch (e) {}
  if (rubbed) toInherit.push({ kind: '业藏录', name: `已拓印 ${rubbed} 件（藏书阁）` });

  // —— 已失落：一世终结且未通关时，非传承家当随之失落（随遗体留给黄土）；本命随身则可带一魂而归 ——
  const lost = [];
  if (s.over && !s.over.win) {
    const benKey = new Set(benMing.map((b) => b.name));
    (s.equips || []).forEach((e) => {
      if (!e || !e.name || benKey.has(e.name)) return;
      lost.push({ kind: e.treasure ? '法宝' : '兵甲', name: e.name });
    });
    if (seals.length) lost.push({ kind: '劫印', name: '单局随行尽数失落' });
  }

  return { gained, lost, toInherit };
};

// =============================================================
// 本命法宝（V8.17）：每位英雄一件「本命法宝」——其专属法宝（treasure & owner=该英雄）中的
// 唯一签名法宝。今生随身不失落、死后随世而散不复传承（V8.60 承继去法宝：所有法宝每世独立、
// 各英雄法宝重历重得），UI 专属展示位。成长随章节推进（ch1~ch4 各版本），不引入挖矿/无限升级，贴西游主题。
// =============================================================
NDX.HERO_BENMING_FABAO = {
  wukong: 'jingu',        // 金箍
  tangseng: 'ts_bowl',    // 紫金钵盂
  bajie: 'bj_bowl',       // 净坛宝盂
  shaseng: 'ss_bowl',     // 降妖念珠
  xiaobailong: 'lm_bowl', // 避水珠
};
// 返回英雄当前持有的本命法宝装备（取最高阶版本）；未持有返回 null
NDX.benMingFabao = function (s) {
  if (!s || !s.hero) return null;
  const tid = NDX.HERO_BENMING_FABAO[s.hero];
  if (!tid) return null;
  // 稳健匹配：按 owner===hero && treasure（与 upgradeHeroGear 法宝槽同口径）。
  // 成长版 ch2/3/4 的 treasureId 已被改写为 bj_bowl_man 等，按原 treasureId 匹配会在升级后查不到本命法宝（八戒/取经人/沙僧），故改用 owner 匹配。
  const owned = (s.equips || []).filter((e) => e && e.treasure && e.owner === s.hero);
  if (!owned.length) return null;
  return owned.slice().sort((a, b) =>
    ((b.setTier || 0) - (a.setTier || 0)) || ((b.chapter || 0) - (a.chapter || 0)) || ((b.hp || 0) - (a.hp || 0))
  )[0];
};
// 兼容门禁/旧接口：本命法宝随章进阶（委托真实实现 upgradeHeroGear 的法宝槽，避免并行体系）。
NDX.upgradeHeroTreasure = function (s) {
  return (NDX.upgradeHeroGear && s) ? NDX.upgradeHeroGear(s, 'treasure') : null;
};
// 本命法宝成长阶段名（按 chapter）
NDX.benMingStage = function (eq) {
  const ch = (eq && eq.chapter) || 1;
  return ch >= 4 ? '圆满' : (ch === 3 ? '三转' : (ch === 2 ? '二转' : '初醒'));
};
