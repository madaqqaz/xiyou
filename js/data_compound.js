// =============================================================
// data_compound.js — 《逆道西行》复合节点系统 · COMPOUND_NODES
// 从 data.js 拆分（2026-08-31）：独立维护复合节点系统（多劫难合并为一个大节点）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.COMPOUND_NODES = {
  // 第一章·大唐境内：前 3 难合并为「新手指引」节点——逐难分授核心系统
  //   第 1 难 金蝉遭贬 → 介绍【六道】
  //   第 2 难 出胎几杀 → 介绍【寿命油灯】
  //   第 3 难 满月抛江 → 介绍【战斗系统 + 劫印系统】（改为首场教学战斗）
  1: {
    // 【2026-09-13 章节重排】黄风岭（难10-13）在 9 章制下已属第 1 章。本节点承载的唯一融合弧是
    //   「黄风岭三连难（难10-12）」；难13 为章末黄风大圣（关隘 Boss 层，不入弧）。
    //   难 1-4（金蝉遭贬／出胎几杀／满月抛江／长安送行）由 _buildRegionSegment 的
    //     「第一章固定序章」硬固定承载（trial×3 + songEvent×1），不经复合节点；
    //   难 5-9（刘洪·江流索命 + 两界山收悟空）由普通地图层承载，不入弧。
    //   融合弧的 layer = 该弧落在本地区第几层地图行。act1 的地图第 1-4 行已被固定序章占用，
    //   故黄风岭弧落在第 10 行（= 全局难10，act1 的 actStart=1 使行号与难号同值）——
    //   行内由 _compoundNext 依次 walk 难10 → 11 → 12，与子难号一一对齐。
    //   旧版把新手指引也写成一层融合弧（layer 1）是死数据：第 1-4 行被固定序章 continue 掉，
    //   fusionAtLayer 永不命中；且 routeOptions 入口页已由 V8.27 取消、全仓零消费，故一并移除。
    fusions: [
      // 【2026-09-13 劫难融合】难1-3 原为三层「单列固定序章」，玩家三步步步零选择、且都只是
      //   六道一择的纯叙事——合并为单个复合节点，一次进入连续做三次六道抉择。
      { layer: 1, diffs: [1, 2, 3], name: '江流儿劫', title: '第1-3难 · 江流儿劫', icon: '🪞', themeTutorial: true },
      { layer: 10, diffs: [10, 11, 12], name: '黄风岭三连难', title: '第10-12难 · 黄风岭', icon: '🌪', themeTutorial: true },
    ],
    layer: 1,                  // 兼容字段：与 fusions[0].layer 同源
    name: '江流儿劫',
    title: '第10-13难 · 黄风岭',
    icon: '🌪',
    diffs: [1, 2, 3, 10, 11, 12], // 兼容字段：fusion diffs 合并（不含章末难13 黄风大圣）
    themeTutorial: true,       // 标记为主题介绍：开场点出黄风岭主线
  },
  // 第二章·高老庄·流沙河·白骨岭（难14-22，章末白骨夫人）：9 难压为 7 层。
  // 【2026-09-13 PHASE 7 · 劫难融合】14/15 同属高老庄（闻妖 → 云栈洞收八戒）、16/17 同属流沙河
  //   （流沙九颅 → 收沙僧），各并为 1 弧 → 玩家一次进入连续做两次六道抉择，而不是两层各一次。
  //   compact: true 表示本章走「难号游标分配」（见 _assignTrialDiffs）——否则线性映射会把 L3/L4
  //   钉死在难16/17 上（已被弧吃掉）而空转成两个纯填充层，压层反而变成加层。
  //   融合后：L1 高老庄弧 · L2 流沙河弧 · L3-L6 单层（18 四圣 / 19 五庄观 / 20 白骨三戏 /
  //   21 贬退心猿）· L7 关隘 Boss（22 白骨夫人·五行归墟）。
  2: {
    fusions: [
      { layer: 1, diffs: [14, 15], name: '高老庄·收八戒', title: '第14-15难 · 高老庄闻妖 / 云栈洞收八戒', icon: '🐷' },
      { layer: 2, diffs: [16, 17], name: '流沙河·收沙僧', title: '第16-17难 · 流沙九颅 / 收沙僧', icon: '🌊' },
    ],
    compact: true,
    layer: 1,
    name: '高老庄·流沙河',
    title: '第14-22难 · 第二章',
    icon: '⚔️',
    diffs: [14, 15, 16, 17], // 兼容字段：fusion diffs 合并（不含 18-21 单层难、不含章末难22）
  },
  // 第三章·火云洞（难23-27，章末红孩儿）走下自动生成器，按 ACT_RANGES 把非 Boss 难号分组成弧。
  // 【2026-09-13 章节重排】原「第二章·两界山（act2）」与「第三章·黄风岭（act3）」手动定义已废止——
  //   两界山（5-9）与黄风岭（10-13）现同属第 1 章，其弧定义上移至 COMPOUND_NODES[1]。
  // 第四章·车迟国·通天河（难28-36，章末金鱼精）：双弧章，两个特殊标记共存于同一 act：
  //   弧1 车迟国斗法（28-30）：三场斗法，选「隐」避战收场；三场全「战」→ 第31难三妖合体终战（chechi）
  //   弧2 通天河·灵感（32-35）：全渡→观音鱼篮收伏跳过决战；全逆→河神反噬决战强化（tongtian 终局矩阵）
  //   两弧的抉择记录按【子难号区间】区分，避免 act 级标记互污（见 game_core_2 初始化 lo/hi）。
  4: {
    fusions: [
      { layer: 1, diffs: [28, 29, 30], name: '车迟国斗法', title: '第28-30难 · 车迟国斗法', icon: '⚔️', chechi: true },
      { layer: 2, diffs: [32, 33, 34, 35], name: '通天河·灵感', title: '第32-35难 · 通天河', icon: '🌊', tongtian: true },
    ],
    layer: 1,
    name: '车迟国·通天河',
    title: '第28-36难 · 第四章',
    icon: '⚔️',
    diffs: [28, 29, 30, 32, 33, 34, 35], // 兼容字段：fusion diffs 合并（不含章末难36）
    chechi: true,
    tongtian: true,
    chechiRange: [28, 31],   // 车迟弧子难区间（含第31难三妖合体终战）
    tongtianRange: [31, 36], // 通天河弧子难区间（含第36难决战收场判定）
  },
  // 第七章·荆棘岭·小雷音·狮驼岭（难55-58，章末大鹏）：4 层 → 9 层。
  // 【2026-09-14 P0 整改·ch7 塌陷】原 layers=4 / 7.5 格 / 分支度 1.88，扛「荆棘岭·小雷音·
  //   狮驼岭」三个原著大地名却体量全九章垫底（ch4 为 9 层 31.4 格 3.49），中期体验断崖。
  //   现补到 9 层：三弧（L1 荆棘岭 / L2 小雷音 / L3 朱紫）各承载 1 难 + L4-L8 探索纵深 5 层
  //   + L9 章末 Boss。
  //   ⚠「狮驼岭单独成弧」无法按字面执行：狮驼岭 = 第 58 难 = **章末关隘 Boss**，Boss 三向对齐
  //   （ACT_RANGES.end ↔ CHAPTER_BOSS_NAMES ↔ BOSS_FORMS）禁止其入弧。改为「独占 L9 末层 +
  //   L4-L8 五层纵深铺垫」，体量由层数与分支度承担（狮驼岭尸山的压迫感在 Boss 层集中兑现）。
  //   compact: true —— 三弧已吃掉全部非 Boss 难号（55/56/57），线性映射会让 L4+ 越界到 ch8 的
  //   难59+；游标模式在 cursor >= hi(58) 后自动把余层置为无劫难位的纯探索层，正是所需行为。
  7: {
    fusions: [
      { layer: 1, diffs: [55], name: '荆棘岭·木仙', title: '第55难 · 木仙谈诗（荆棘岭树精）', icon: '🌳' },
      { layer: 2, diffs: [56], name: '小雷音·假佛', title: '第56难 · 小雷音假佛（黄眉·人种袋金铙）', icon: '🛕' },
      { layer: 3, diffs: [57], name: '朱紫国·赛太岁', title: '第57难 · 朱紫医王（金毛犼·三金铃）', icon: '🔔' },
    ],
    compact: true,
    layer: 1,
    name: '荆棘岭·小雷音·狮驼岭',
    title: '第55-58难 · 第七章',
    icon: '⚔️',
    diffs: [55, 56, 57], // 兼容字段：fusion diffs 合并（不含章末难58 狮驼尸山）
  },
  // 第八章·比丘国·天竺（难59-72，章末假公主·玉兔）：14 难压为 9 层。
  // 【2026-09-13 PHASE 6 · 劫难融合】原走自动生成器，只覆盖前 6 难（59-64）分 3 弧，
  //   余下 65-71 各占一层单列 → 14 层 / 46 格（全游戏最臃肿），且 L4-L6 为无劫难承载的纯填充层。
  //   现按「地点相近 + 主题同源」重划为 5 弧，13 个非 Boss 难号全部入弧：
  //     弧1 59-60 比丘灭法  二王皆因妖言／恶梦而害僧害童（救童 · 剃王）
  //     弧2 61-62 隐雾凤仙  天时不利（破分瓣梅花计 · 建祠求雨）
  //     弧3 63-64 玉华竹节  兵器与兽（夺回三般兵器 · 收九灵元圣）
  //     弧4 65-66 金平给孤  香火与布金（假佛收灯油 · 长者黄金铺地）——供养的虚妄
  //     弧5 68-71 天竺玉兔  若归月（招亲 · 月宫往事 · 捣药杵 · 遁月）——原著第93-95回一整段
  //   第 67 难「铜台辨冤」为独立人间事件（寇员外斋僧冤案，原著第96-97回），不入弧，单层承载。
  //   第 72 难为章末关隘 Boss。layers 14 → 10（弧 5 + 探索 3 + 难67 单层 + Boss 1）。
  //   注：layers 不可取 9——_assignTrialDiffs 的层号→难号是线性映射（actStart + L - 1），
  //   难67 的自然层号 = 67-59+1 = 9；若 L9 即 Boss 层，该难将无处承载（实测已复现）。
  8: {
    fusions: [
      { layer: 1, diffs: [59, 60], name: '比丘灭法', title: '第59-60难 · 比丘国救童 / 灭法国剃王', icon: '🦌' },
      { layer: 2, diffs: [61, 62], name: '隐雾凤仙', title: '第61-62难 · 隐雾梅花计 / 凤仙郡求雨', icon: '🌫' },
      { layer: 3, diffs: [63, 64], name: '玉华竹节', title: '第63-64难 · 玉华盗兵 / 竹节九狮', icon: '🦁' },
      { layer: 4, diffs: [65, 66], name: '金平给孤', title: '第65-66难 · 金平犀灯 / 给孤布金', icon: '🏮' },
      { layer: 5, diffs: [68, 69, 70, 71], name: '天竺玉兔', title: '第68-71难 · 天竺招亲 · 月宫桂影 · 捣药杵 · 遁月', icon: '🌙' },
    ],
    layer: 1,
    name: '比丘国·天竺',
    title: '第59-72难 · 第八章',
    icon: '⚔️',
    diffs: [59, 60, 61, 62, 63, 64, 65, 66, 68, 69, 70, 71], // 兼容字段：fusion diffs 合并（不含第67难铜台辨冤、不含章末难72）
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
  { name: '大唐境内',  lo: 1,  hi: 4  },
  { name: '两界山',    lo: 5,  hi: 9  },
  { name: '黄风岭',    lo: 10, hi: 13 },
  { name: '流沙河',    lo: 14, hi: 18 },
  { name: '五庄观',    lo: 19, hi: 22 },
  { name: '火云洞',    lo: 23, hi: 27 },
  { name: '车迟国',    lo: 28, hi: 31 },
  { name: '通天河',    lo: 32, hi: 36 },
  { name: '女儿国',    lo: 37, hi: 40 },
  { name: '真假猴王',  lo: 41, hi: 45 },
  { name: '火焰山',    lo: 46, hi: 49 },
  { name: '祭赛国',    lo: 50, hi: 54 },
  { name: '狮驼岭',    lo: 55, hi: 58 },
  { name: '比丘国',    lo: 59, hi: 63 },
  { name: '天竺·玉兔', lo: 64, hi: 72 },
  { name: '灵山',      lo: 73, hi: 77 },
  { name: '凌云渡',    lo: 78, hi: 81 },
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
// 由全局难号(1~81)推断所属地区(1~17)；chapterOf 为历史别名，语义与 actOf 完全一致（17 地区制，非「章节 1~9」）
NDX.chapterOf = function (progress) {
  return NDX.actOf(progress);
};

// ============================================================
// V8.37 地区→档位映射：修复装备/红材/转职三处标尺错位
// 问题：chapterOf/actOf 返回 17 地区号(1-17)，但装备用4章制、红材用3档、转职务9章制，
//       直接用 chapterOf 对比导致凌云级装备/凌云木从地区4(难14)起提前约47难进入掉落池，
//       转职二/三阶门槛提前至地区6/7，中局数值偏膨胀，难度曲线被压平。
// 方案：保留 chapterOf 语义(17地区号)不变，新增映射函数统一三处消费点。
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
