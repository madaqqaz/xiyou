// =============================================================
// data_map.js — 《逆道西行》地图生成 · generateMap/_buildRegionSegment等
// 从 data.js 拆分（2026-08-31）：独立维护地图生成逻辑
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX._usedEventIds = [];   // 缘池已用 id（进入时随机抽，不预分配）—— 顶层初始化，加载即得
NDX._usedTrialTitles = []; // 劫池已用 key（进入时随机抽，不预分配）

// 劫难转事件（V8.22）：story 类劫难（无战斗的叙事难）改以「缘(?)」节点呈现，
// 保留其剧情内容但不再占用战斗劫难点位——进入时按固定难号触发剧情劫难（见 game.js 节点分发）。
// 地区 → 固定事件难号 → 所在局部层（该层主线劫难点被替换为事件节点）
// 【2026-09-13 章节重排】坐标系同步：难8（两界山头·收悟空）现属 **act1**（1-13），
//   局部层 = 8 - actStart(1) + 1 = 8；难73（化电归真）现属 act9（73-81），局部层 = 1。
//   原表 {2:{8:4}, 16:{73:1}} 是 17 地区制残留（act2=两界山、act16=灵山），重排后已越界失效。
//   注：重排前 难39 如来收鹏(女儿国) 已并入 难58 狮驼尸山·如来收鹏(fight Boss)；难77 灵山无字·大圣残躯 为 Boss，均不需转事件。
NDX.FIXED_EVENT_TRIALS = [8, 73];
NDX.FIXED_EVENT_LAYERS = {
  1: { 8: 8 },   // 第1章 难8 两界山头（收悟空）→ 第8层主线劫难点
  9: { 73: 1 },  // 第9章 难73 化电归真 → 第1层（卷首）主线劫难点
};
NDX._convertStoryTrialsToEvents = function (layers, act) {
  const map = NDX.FIXED_EVENT_LAYERS[act];
  if (!map) return;
  Object.keys(map).forEach((trialNo) => {
    const L = map[trialNo];
    const layer = layers[L];
    if (!layer) return;
    const cols = Object.keys(layer).map(Number);
    const target = cols.find((c) => layer[c] && layer[c].type === 'trial') || cols[0];
    if (target == null) return;
    const old = layer[target];
    layer[target] = {
      type: 'event',
      name: '缘',
      diff: +trialNo,
      fixedEventTrial: +trialNo,
      drop: old && old.drop ? old.drop : null,
      next: old && old.next ? old.next : undefined, // 保留通往下一层的连线（Boss 收敛层已设 next）
    };
  });
};

// 生成「第 act 地区」的地图段（局部层 1..actLayers(act)），返回局部 layers 数组。
// 连续地图：每地区一段，段内局部层从 1 起；off 为该段在全局地图中的起始全局层偏移
// （第 1 地区 off=0，第 2 地区 off=第1地区层数，依此类推）。段内所有 _sideNode 调用
// 一律用「全局层 = off + 局部层」换算真实难号（1~81），保证小怪/精英/劫难难度跨地区平滑爬升。
NDX._buildRegionSegment = function (act, off) {
  off = off || 0;
NDX.LAYER_COUNT = NDX.actLayers(act); // 段内局部层数（后处理函数依赖 LAYER_COUNT）
NDX._usedEventIds = [];   // 每次建图重置缘池已用 id
NDX._usedTrialTitles = []; // 每次建图重置劫池已用 key
const layers = [null];
let prevCols = [];
// 第一章（新手）使用专属模板：精英仅 3 个、屏蔽问号、功能房只留篝火+商店（见 NDX.MAP_PLAN_CH1）
const _isCh1 = (act === 1);
const _plan = _isCh1 ? NDX.MAP_PLAN_CH1 : NDX.MAP_PLAN;

  // 前 3 层强制「差异化路线展示」：固定三列分别对应
  //   历练线(小怪练级) / 劫印线(劫难堆印) / 精英线(精英机制)，
  // 让玩家从开局即直观看到「路线选择会改变整局玩法」，建立肉鸽核心认知（剧情劫难同步教学）
  const _FRONT_ROUTE = { 1: 'lian', 2: 'jie', 3: 'jing' };
  const _FRONT_TYPE = { 1: 'mob', 2: 'trial', 3: 'elite' };
  for (let L = 1; L <= NDX.LAYER_COUNT; L++) {
    // 第一章前4层固定线性路径（难1→难2→难3→长安送行），第5层为关隘 Boss（难4·刘洪·寻亲报冤）。
    // V8.5x 修订：难1-3一律走 trial + fixedTrial，完整保留 TRIAL_LIB 原文本与选项；第4层 songEvent
    //   走「观音偈语 + 赠宝单窗」流程，完整保留赠宝教学收口（与刘洪战前引导衔接）。
    if (_isCh1 && L <= 4) {
      const _fixedNodes = {
        1: { type: 'trial', name: '金蝉遭贬', title: '第1难·金蝉遭贬', icon: '🪞', diff: 1, fixedTrial: 1, startPoint: true, skipPostProcess: true, next: [2] },
        2: { type: 'trial', name: '出胎几杀', title: '第2难·出胎几杀', icon: '📿', diff: 2, fixedTrial: 2, skipPostProcess: true, next: [2], skipChoice: true },
        3: { type: 'trial', name: '满月抛江', title: '第3难·满月抛江', icon: '🌊', diff: 3, fixedTrial: 3, skipPostProcess: true, next: [2], skipChoice: true },
        4: { type: 'event', name: '长安送行', title: '长安送行·观音赠宝', icon: '🏮', diff: 4, songEvent: true, skipPostProcess: true },
      };
      layers[L] = { 2: Object.assign({}, _fixedNodes[L]) };
      prevCols = [2];
      continue;
    }
    // V8.34 融合节点分布（地区配额制）：某层若有融合节点定义（如两界山 fusions），
    // 该层生成「融合节点（多难合并，可走）+ 并行岔路节点」——既保留多难合并的节奏，
    // 又恢复杀戮尖塔式多路拓扑（玩家可选走融合节点或绕行岔路攒配额）。
    const _fus = NDX.fusionAtLayer(act, L);
    if (_fus) {
      // 融合节点列：位于主列（2）；若该层非末层，旁列补 1~2 个岔路节点（可选绕行）
      const _fusionNode = {
        type: 'compound',
        name: _fus.name,
        title: _fus.title,
        icon: _fus.icon,
        diff: _fus.diffs[0],
        fusionDiffs: _fus.diffs.slice(),   // 融合节点专属难号（由复合流程逐难推进）
        startPoint: (L === 1),
      };
      const _row = { 2: _fusionNode };
      // 融合节点旁列岔路（L2/L3 融合层才配；L1 起点层单列起手，避免开局过密）
      if (L > 1 && L < NDX.LAYER_COUNT) {
        const sideCnt = NDX._rand(1, 2);
        const sideCols = [1, 3].slice(0, sideCnt);
        sideCols.forEach((c) => {
          const _t = NDX._pick(['mob', 'mob', 'event', 'event', 'rest', 'elite']);
          _row[c] = NDX._sideNode(off + L, _t);
        });
      }
      layers[L] = _row;
      prevCols = Object.keys(_row).map(Number);
      continue;
    }
    // 复合节点层（该章末层）：生成复合节点（多难合并，含路线抉择），不参与普通分支生成。
    // V8.26 复合节点即该章卷首起点（合并前若干难），带 startPoint 起点标记恢复「出发」视觉。
    const _comp = NDX.compoundFor(act);
    if (_comp && L === _comp.layer) {
      layers[L] = {
        2: {
          type: 'compound',
          name: _comp.name,
          title: _comp.title,
          icon: _comp.icon,
          diff: _comp.diffs[0],
          startPoint: (L === 1),
        },
      };
      prevCols = [2];
      continue;
    }
    // 章节卷首节点：
    //  - 若本章存在复合节点（新手指引/战斗教学/主题介绍），则该复合节点即为卷首第一节点（起点），
    //    它已合并本章前若干难（如 ch1 的难1~3），故不再单列序章劫难；
    //  - 否则保留原「卷首第一难」单行节点（如非复合章），从自己章节第一难起步（类杀戮尖塔铁人像）。
    if (L === 1) {
      const _comp1 = NDX.compoundFor(act);
      if (_comp1) {
        // 复合节点作为卷首起点：合并前若干难，开场即新手指引/教学/主题介绍
        layers[L] = {
          2: {
            type: 'compound',
            name: _comp1.name,
            title: _comp1.title,
            icon: _comp1.icon,
            diff: _comp1.diffs[0],
            startPoint: true, // 起点标识（UI 高亮 + 标签）
          },
        };
        prevCols = [2];
        continue;
      }
      const firstGlobal = NDX.actStart(act);               // 本章第一难的全局难号
      const regionName = NDX.ACT_NAMES[Math.min(act, NDX.TOTAL_ACTS) - 1] || '';
      const startTpl = (NDX.TRIAL_LIB && NDX.TRIAL_LIB[firstGlobal]) || null;
      const startName = startTpl && startTpl.name ? startTpl.name : `第${firstGlobal}难·卷首`;
      const startNode = {
        type: 'trial',
        fixedTrial: firstGlobal, // 固定全局难号（第一章=1·金蝉遭贬；其余地区=该地区卷首第一难），跳过随机分配
        startPoint: true,        // 地图起点标识（UI 高亮 + 标签）
        name: startName,
        title: act > 1 ? `${regionName}·卷首·${startName}` : `第一难·${startName}`,
        icon: (startTpl && startTpl.icon) || '🪞',
      };
      layers[L] = { 2: startNode };  // 居中单列（col=2），从虚拟起点层(0)连入
      prevCols = [2];
      continue;
    }
    let cols;
    if (L === NDX.LAYER_COUNT) {
      // 关隘 Boss 层：单列汇聚（末层前一层每个节点强制连到此处）
      cols = [prevCols.length ? NDX._pick(prevCols) : NDX._rand(1, NDX.MAX_COL)];
    } else if (L <= 3) {
      // 前 3 层：锁定三列，路线分工明确且整条路线连贯（选劫印线则后续两层同列仍走劫难）
      cols = [1, 2, 3];
    } else {
      // 每层 3~4 个并列节点，开局第 1 层亦为 3~4 节点，玩家一进场即可多选一
      cols = NDX._genBranchCols(prevCols);
    }

    layers[L] = {};
    // 本层"主类型"节点随机落在某一列，其余为岔路补充节点
    const mainC = NDX._pick(cols);
    cols.forEach((c) => {
      // 前 3 层：按锁定路线类型生成节点并标注 route（整条路线连贯，供 UI 展示差异化标签）
      if (!_isCh1 && L <= 3 && _FRONT_TYPE[c]) {
        const node = NDX._sideNode(off + L, _FRONT_TYPE[c]);
        node.route = _FRONT_ROUTE[c];
        // V8.33 移除第一章层2/3中列 fixedTrial=2/3：
        //   难1-3已并入层1复合节点（前三难连续教学），不再于层3中列重复固定难2/3；
        //   第一章劫难配额(actTrials 4 - Boss 1 - 复合非Boss 3 = 0)由 _capTrialNodes 自动处理。
        layers[L][c] = node;
        return;
      }
      if (c === mainC) {
        if (L === NDX.LAYER_COUNT) {
          // 关隘 Boss 层：强制为本章关隘 Boss（难号=本章末难），不依赖模板末项——
          // 非 9 层章（第一章13层/第七章10层/终章4层）模板末项并非 Boss，须在此收敛。
          layers[L][c] = {
            type: 'boss',
            name: NDX.bossNameForAct ? NDX.bossNameForAct(act) : '关隘之主',
            title: (NDX.ACT_NAMES[(act - 1)] || '') + '·关隘',
            icon: '👑',
            diff: NDX.actEnd(act),
          };
        } else {
          const tpl = _plan[L - 1];
          // 【2026-09-13 重排修正】模板末项（MAP_PLAN 第 9 项）是「关隘 Boss 汇聚点」占位，
          //   只在 L === LAYER_COUNT 时有意义——而那种情况已由上方分支强制生成关隘 Boss，不会走到这里。
          //   章内行数 > 9 的章（第 1 章 13 行、第 8 章 14 行）会命中 tpl = _plan[8] 这个 Boss 占位，
          //   照搬就会在章中凭空多出一个关隘 Boss（实测：第 8 章第 9 行多出 1 个 Boss，共 2 个）。
          //   故此处把「模板 Boss 占位」在非末行降级为普通小怪，关隘 Boss 仍只由末行唯一产出。
          const _tplUsable = tpl && !(tpl.type === 'boss' && L !== NDX.LAYER_COUNT);
          // 模板节点难号统一覆盖为「真实难号(1~81)」：连续地图下局部层≠难号，
          // 否则第 2 地区起主线节点会按局部层(1~9)取怪，难度错位。
          layers[L][c] = _tplUsable ? { ...tpl, diff: NDX.diffOfLayer(off + L) } : NDX._sideNode(off + L, 'mob');
        }
      } else {
        // 岔路补充：劫/缘只标类型不标名，进入时再从对应池随机抽具体内容，故节点数量不受劫/缘名限制
        let t;
        if (L <= 5) {
          // 前段：以「兵」小怪为主体，但保证早期混入事件/缘（满足缘分门槛·缘遇），避免"前段全兵"
          // V8.52 五种节点收口：小怪 / 精英 / 土地庙 / 市场 / 缘事件。
          //   劫难(trial)不再进随机池——每层唯一劫难位由 _assignTrialDiffs 固定分配；宝窟/洞天移除。
          t = _isCh1
            ? NDX._pick(['mob', 'mob', 'mob', 'event', 'event', 'trial', 'trial', 'elite'])
            : NDX._pick(['mob', 'mob', 'mob', 'mob', 'event', 'event', 'elite', 'rest', 'shop']);
        } else {
          // 后段：仍以「兵」为骨干（约 1/3），休/宝低频，市场仅保留主线 2 处（diff 7/15），
          // 不在岔路随机刷市——避免「市太多」与「连续两层市」打断战斗节奏
          // 三周目起：隐藏洞天（cave）纳入后段岔路候选，约 1/12 概率出现（与精英相当），全开放深度秘境
          // 第一章（新手）：保留问号(event)低频（缘分门槛·缘遇）、功能房只留篝火(rest)+商店(shop)，
          // 屏蔽宝窟(treasure)/洞天(cave)，精英低频
          const cycle = NDX.getCycle ? NDX.getCycle() : 1;
          if (_isCh1) {
            t = NDX._pick(['mob', 'mob', 'mob', 'mob', 'event', 'trial', 'trial', 'rest', 'shop', 'elite']);
          } else {
            // V8.52 五种节点收口（同上）：劫难位由 _assignTrialDiffs 独占。
            //   三周目起精英权重小幅提升（原「隐藏洞天」位改为精英，保持后段压迫感）。
            // V9.8 宝窟回归：宝窟(treasure)作为「特殊奖励房」重新进入后段岔路池（低权重，
            //   约 1/12），且宝窟节点有 NDX.TREASURE_LUX_CHANCE 概率升格为独立的「秘藏宝窟」。
            //   仅后段（L>5）投放，前段与第一章不受影响，避免新手期法宝过载。
            const backPool = cycle >= 3
              ? ['mob', 'mob', 'mob', 'mob', 'event', 'event', 'elite', 'elite', 'elite', 'rest', 'shop', 'treasure']
              : ['mob', 'mob', 'mob', 'mob', 'event', 'event', 'elite', 'elite', 'rest', 'shop', 'treasure'];
            t = NDX._pick(backPool);
          }
        }
        layers[L][c] = NDX._sideNode(off + L, t);
      }
    });

    // 三/四章（逆道开放）地图调优：在已生成节点上，依 MAP_TUNE 概率将部分「小怪」升级为
    // 精英（概率提升）/ 问号（event，占比提高），实现「精英概率小幅提升、功能房问号占比提高」。
    // 仅作用于 act>=3，前两章维持既有节奏；不增删节点数，仅改写类型，保持 20 节点配额。
    if (act >= 3) {
      const _tune = NDX.MAP_TUNE[act] || {};
      Object.keys(layers[L]).forEach((c) => {
        const n = layers[L][c];
        if (n && n.type === 'mob') {
          const r = Math.random();
          if (_tune.elite && r < _tune.elite) { n.type = 'elite'; n.name = NDX._pick(['熊罴老怪', '赤发鬼王', '独脚魈王', '黑风大圣', '黄眉童子']); }
          else if (_tune.event && r < _tune.elite + _tune.event) { n.type = 'event'; n.name = '缘'; }
        }
      });
    }

    prevCols = cols;
  }
  // 全部层建好后再统一连线：此时 layers[L+1] 已存在，可正确生成 next 边集
  for (let L = 1; L < NDX.LAYER_COUNT; L++) NDX._connectLayer(layers, L);

  // 末层前一层 → 关隘 Boss：强制每条路径汇聚到唯一 Boss 节点（列差可能 >1，用直线汇聚）
  // 单层地区（如黄风岭三连难复合节点区，layers=1）无 Boss 收敛层，跳过
  if (NDX.LAYER_COUNT >= 2) {
    const bossC = Object.keys(layers[NDX.LAYER_COUNT]).map(Number)[0];
    Object.keys(layers[NDX.LAYER_COUNT - 1]).forEach((pc) => {
      layers[NDX.LAYER_COUNT - 1][pc].next = [bossC];
    });
  }

  // 劫难转事件：story 类劫难以「缘(?)」节点呈现（难8/39/55/77），须在 _ensureHiddenTrials 之前替换
  NDX._convertStoryTrialsToEvents(layers, act);
  // V8.52 劫难收束：本地区难号按层「固定绑定」到劫难节点——进入时不再从剩余难号随机抽。
  //   须在 _convertStoryTrialsToEvents 之后（难8 已转缘节点，不参与战斗劫难位分配）。
  NDX._assignTrialDiffs(layers, act, off);
  // 按章套用专属地图皮肤（节点名/精英掉落）：第一章用 MAP_PLAN 默认名，第 2~4 章套 ACT_MAP_THEME
  if (act && NDX.ACT_MAP_THEME[act]) NDX._applyActTheme(layers, act);
  // 规则后处理：抑制「市」过密 / 保证 Boss 前回血点
  NDX._enforceMapRules(layers, off);
  // 隐藏专职「必经劫难」必现：保证本章程节所需的特定劫难节点确实存在于地图
  // （否则随机生成可能漏掉，导致玩家即便想走也无法经过——必现 = 给机会，逃课 = 玩家自己绕开）
  NDX._ensureHiddenTrials(layers, act, off);
  // 每章硬性劫难配额：非 Boss 劫难节点不超过 actTrials(act)-1（如第一章 12 个普通劫难点 + 末层 1 个 Boss = 13 难）。
  // 超出部分降级为妖兵，确保「完成本章所需劫难数之后，不再刷新劫难节点」。
  NDX._capTrialNodes(layers, act, off);
  return layers;
};

// 连续地图生成：按地区分段，不清空不重置——清掉上一地区 Boss 后，地图向下延伸出下一地区段。
//   · NDX.LAYERS 为全局层数组（index 0 = 逻辑起点层），地区 act 占据全局层
//     regionLayerOffset(act)+1 .. regionLayerOffset(act)+actLayers(act)。
//   · 首次(act=1)从空数组起建；后续地区在现有地图上拼接，玩家感知为一条连续西行路。
//   · 任务驱动动态尾（_tailStep 延伸的层）在拼接前截断，避免与下一地区段重叠。
NDX.generateMap = function (act) {
  act = act || 1;
  if (!NDX.LAYERS || !NDX.LAYERS.length) NDX.LAYERS = [null];
  const off = NDX.regionLayerOffset(act);
  // 截断动态尾：地区段从 off+1 起，若此前任务驱动延伸过层（LAYER_COUNT > off），先裁掉
  if (NDX.LAYERS.length > off + 1) NDX.LAYERS.length = off + 1;
  const seg = NDX._buildRegionSegment(act, off);
  for (let L = 1; L < seg.length; L++) NDX.LAYERS[off + L] = seg[L];
  NDX.LAYER_COUNT = off + NDX.actLayers(act);
  NDX.LAYERS[0] = {};
  NDX.START_LAYER = 0;
  return NDX.LAYERS;
};

// 地图规则后处理：抑制「市」过密、保证最终 Boss 前一层有回血土地庙
//  - 单层内市只保留一个，其余降级为战斗（避免「市太多」）
//  - 禁止连续两层都出现市（避免「连续两个市」打断战斗/选择节奏）
//  - 最终 Boss 前一层(layer=LAYER_COUNT-1)强制至少有一个 rest(土地庙)，确保能回血再战 Boss
// 原地替换节点类型（保留已建好的 next 边，避免地图后处理破坏连通性）
NDX._replaceNode = function (layers, L, c, t, off) {
  const old = layers[L][c] || {};
  const keep = old.next;            // 关键：保留通往下一层的连线
  const fresh = NDX._sideNode((off || 0) + L, t);
  if (keep) fresh.next = keep;
  layers[L][c] = fresh;
  return fresh;
};

NDX._enforceMapRules = function (layers, off) {
  const LC = NDX.LAYER_COUNT;
  if (LC < 2) return; // 单层地区（黄风岭三连难复合节点区）无 Boss 前休整/市约束
  const colsOf = (L) => Object.keys(layers[L] || {}).map(Number);
  const hasType = (L, t) => colsOf(L).some((c) => layers[L][c] && layers[L][c].type === t);

  // 1) 保证 Boss 前一层至少有一个回血点（优先占用岔路节点，保留主线精英/剧情）
  const preBoss = LC - 1;
  // V8.5x 跳过含 skipPostProcess 固定教学节点的层（如长安送行），避免教学节点被替换为休息点
  const _preBossHasFixed = colsOf(preBoss).some((c) => layers[preBoss][c] && layers[preBoss][c].skipPostProcess);
  if (!_preBossHasFixed && !hasType(preBoss, 'rest')) {
    const cols = colsOf(preBoss);
    // V8.52 防护：优先占用「非劫难位、非固定教学」的列。
    //   劫难位（fixedTrial）承载本地区唯一难号，若被替换为土地庙，该难号将永远无法历到——
    //   直接导致 Boss 门槛（须历满本地区难数）不可达成，形成死局。
    const locked = (c) => {
      const n = layers[preBoss][c];
      return !n || !!(n.fixedTrial || n.skipPostProcess || n.songEvent || n.fixedEventTrial
        || n.type === 'compound' || n.type === 'boss');
    };
    const free = cols.filter((c) => !locked(c));
    const pool = free.length ? free : cols;
    const target = pool[NDX._rand(0, pool.length - 1)];
    NDX._replaceNode(layers, preBoss, target, 'rest', off);
  }

  // 2) 单层内市最多保留2个，其余改为战斗（保留 next，不断连）
  // V8.58 调整：原规则单层仅1市导致全游戏商店占比仅0.2%，金流无出口；放宽至2市/层
  for (let L = 1; L <= LC; L++) {
    const shopCols = colsOf(L).filter((c) => layers[L][c].type === 'shop');
    shopCols.slice(2).forEach((c) => { NDX._replaceNode(layers, L, c, 'mob', off); });
  }

  // 3) 禁止连续三层都出现市：自底向上，遇连续三层市则把中间层所有市改为战斗（保留 next）
  // V8.58 调整：原规则禁止连续两层市过于严格，放宽为禁止连续三层市，保证商店有合理密度
  for (let L = 3; L <= LC; L++) {
    if (hasType(L, 'shop') && hasType(L - 1, 'shop') && hasType(L - 2, 'shop')) {
      colsOf(L - 1).forEach((c) => {
        if (layers[L - 1][c].type === 'shop') NDX._replaceNode(layers, L - 1, c, 'mob', off);
      });
    }
  }
};

// 隐藏专职「必经劫难」必现（V40 新增）：遍历 NDX.HIDDEN_TRIAL_REQ 中所有英雄所需的难号，
// 将落在当前章（act）范围内的难号，强制在对应局部层生成/确保一个 trial 节点。
//   · 全局难号 G → 局部层 L = G - (actStart(act)-1)，仅当 1<=L<=LAYER_COUNT 时属于本章
//   · 若该层已存在 trial 节点则跳过（不重复注入）；否则在该层随机一列强制放置
//   · 必现只是「给玩家经过的机会」；玩家仍可在分支网中绕开——绕开即逃课，隐藏职校验不通过
NDX._ensureHiddenTrials = function (layers, act, off) {
  const lo = NDX.actStart(act) - 1, hi = NDX.actEnd(act);
  const needed = [];
  Object.keys(NDX.HIDDEN_TRIAL_REQ || {}).forEach((h) => {
    (NDX.HIDDEN_TRIAL_REQ[h] || []).forEach((g) => {
      if (g > lo && g <= hi && needed.indexOf(g) < 0) needed.push(g);
    });
  });
  needed.forEach((g) => {
    // 已转为「缘(?)」事件节点的固定难号（劫难转事件）不再注入为战斗劫难——由事件节点承载剧情
    if (NDX.FIXED_EVENT_TRIALS && NDX.FIXED_EVENT_TRIALS.indexOf(g) >= 0) return;
    // V8.33 复合节点已合并的难号（如第一章难1-3）不再重复注入：
    //   其子难由 game.js 复合流程逐难结算并计入 trialsPassed，隐藏职必经难号同样满足。
    //   若不排除，_ensureHiddenTrials 会把复合节点后的关键教学节点（如层2「长安送行」）
    //   覆盖成 trial 再被 _capTrialNodes 降级为 mob，导致长安送行教学丢失。
    const _compG = NDX.compoundFor(act);
    if (_compG && _compG.diffs && _compG.diffs.indexOf(g) >= 0) return;
    const L = g - lo;                 // 局部层（1~LAYER_COUNT）
    // 关隘 Boss 层的难号（如 18/27/63/81）即该章末难 Boss，绝不可被隐藏劫替换成普通 trial 节点——
    // 否则本章将失去最终 Boss（第 9 章更是如此，第 81 难「通天河遇鼋湿经」即终局 Boss）。
    // 该难号经 game.js 的 case 'boss' 进入时即计入 trialsPassed，隐藏职必经要求照样满足。
    if (L >= NDX.LAYER_COUNT) return;
    const layer = layers[L];
    if (!layer) return;
    const cols = Object.keys(layer).map(Number);
    // V8.33 防御：含 songEvent 关键教学节点（如「长安送行」五步教学）的层不可被替换——
    // 教学节点是三难后必经收口，替换会直接丢失装备/法宝/地图引导。
    const hasKeyEvent = cols.some((c) => layer[c] && layer[c].songEvent);
    if (hasKeyEvent) return;
    // V8.26 复合节点层（如第 1 章「新手指引·前三难」合并难1-3）视为已有劫难——
    // 其子难由 game.js 复合流程逐难结算并计入 trialsPassed，隐藏职必经难号同样满足。
    // 若不加此判断，_ensureHiddenTrials 会把复合节点当"无劫难层"覆盖成普通 trial（再被降级为 mob）。
    const hasTrial = cols.some((c) => layer[c] && (layer[c].type === 'trial' || layer[c].type === 'compound'));
    if (hasTrial) return;             // 该层已有劫难/复合劫难，无需注入
    // 优先占用岔路列（非主线/主类型列），保留主线叙事节点（复合节点为必须保留的主干）
    const mainC = cols.find((c) => layer[c] && ['elite', 'boss', 'treasure', 'shop', 'rest', 'compound'].indexOf(layer[c].type) >= 0) || NDX._pick(cols);
    const target = cols.find((c) => c !== mainC) || mainC;
    NDX._replaceNode(layers, L, target, 'trial', off);
  });
};

// 每章硬性劫难配额：非 Boss 劫难节点不得超过 actTrials(act)-1（第一章 12，其余 8/9）。
// 必现/固定劫难点（fixedTrial 或 diff 属隐藏必经难号）优先保留；超过配额的多余通用「劫难点」降级为妖兵，
// 使「完成本章所需劫难数之后不再刷新劫难节点」，且不破坏每章 actTrials 难（普通 + 末层 Boss）的硬性结构。
NDX._capTrialNodes = function (layers, act, off) {
  // 每章普通劫难点配额 = 本章难数 - 末层 Boss(1) - 复合节点内非 Boss 难数（第一章 13-1-3=9）
  const _comp = NDX.compoundFor(act);
  const _compNonBoss = _comp ? _comp.diffs.filter((d) => !NDX.isBossTrial(d)).length : 0;
  const cap = NDX.actTrials(act) - 1 - _compNonBoss;
  const tucked = NDX._HIDDEN_TRIAL_SET;
  let trials = [], keepers = [];
  for (let L = 1; L < NDX.LAYER_COUNT; L++) {      // 末层为 Boss 层，不参与配额
    const layer = layers[L] || {};
    Object.keys(layer).forEach((c) => {
      const n = layer[c];
      if (!n || n.type !== 'trial') return;
      // V8.5x 保留 skipPostProcess 固定教学节点（如第一难金蝉遭贬），不被劫难配额降级
      const keep = !!(n.fixedTrial || n.skipPostProcess || (n.diff && tucked && tucked.has(n.diff)));
      trials.push({ L, c });
      if (keep) keepers.push({ L, c });
    });
  }
  const droppable = trials.filter((e) => !keepers.some((k) => k.L === e.L && k.c === e.c));
  const excess = trials.length - cap;              // 若已超配额，多余个数
  if (excess <= 0) return;
  // 优先剔除「非必现」的通用劫难点；仍超额则依序剔除
  let toDrop = Math.min(excess, droppable.length);
  for (let i = 0; i < toDrop; i++) {
    const e = droppable[i];
    NDX._replaceNode(layers, e.L, e.c, 'mob', off);
  }
  // 极端情况：必现劫难本身已超配额（如多英雄隐藏难号集中在单章，>8 个）——此时不再强行保必现
  // V8.5x 跳过 skipPostProcess/fixedTrial 固定教学节点（如第一难金蝉遭贬），不被极端配额降级
  if (trials.length - toDrop > cap) {
    let still = trials.filter((e) => !droppable.slice(0, toDrop).some((d) => d.L === e.L && d.c === e.c));
    still = still.filter((e) => {
      const n = layers[e.L] && layers[e.L][e.c];
      return !(n && (n.skipPostProcess || n.fixedTrial));
    });
    for (let i = cap; i < still.length; i++) {
      NDX._replaceNode(layers, still[i].L, still[i].c, 'mob', off);
    }
  }
};

// V8.52 劫难收束（唯一 owner：本文件）：把本地区难号按层「固定绑定」到劫难节点，
//   杜绝「进入 trial 节点时才从本章剩余难号随机抽」的随机刷新（原 game.js case 'trial' 随机分支）。
// 规则：
//   · 局部层 L（1..LAYER_COUNT-1；末层为关隘 Boss 层，不参与）→ 全局难号 g = actStart(act) + L - 1
//   · 每层恰好保留 1 个「劫难位」= 当前路线的唯一节点：
//       - 该层已有 trial → 取第一个打上 fixedTrial=g，其余 trial 降级为小怪（保证唯一）
//       - 该层无 trial   → 挑一个未锁定的列升为 trial 并打上 fixedTrial=g
//   · 锁定列（固定教学节点 / 复合节点 / Boss / 已转缘的固定难号）既不作劫难位，也不被覆盖
//   · 第一章（新手固定序章，难1-3 已各自 fixedTrial）与单层地区（黄风岭复合节点区）不参与收束
// 注：_sideNode 的 diff 本就等于 actStart-1+L，故绑定不产生难度错位。
NDX._assignTrialDiffs = function (layers, act, off) {
  if (!act || act === 1) return;                 // 第一章：固定序章，保持原样
  const LC = NDX.LAYER_COUNT;
  if (!LC || LC < 2) return;                     // 单层地区（黄风岭）无分层劫难位
  const lo = NDX.actStart(act);
  const hi = NDX.actEnd(act);                    // 末难 = 关隘 Boss 难号，不参与
  const fixedEventSet = new Set(NDX.FIXED_EVENT_TRIALS || []);
  const isLocked = (n) => !n || !!(n.skipPostProcess || n.songEvent || n.fixedEventTrial
    || n.startPoint || n.type === 'compound' || n.type === 'boss' || n.type === 'branch');
  for (let L = 1; L < LC; L++) {
    const layer = layers[L];
    if (!layer) continue;
    const g = lo + L - 1;                        // 该层应承载的全局难号
    if (g > hi) break;                           // 超出本地区难号范围
    if (fixedEventSet.has(g)) continue;          // 已转为「缘(?)」事件节点，剧情由事件承载
    const cols = Object.keys(layer).map(Number).sort((a, b) => a - b);
    // 该层已有劫难节点：首个保留为劫难位，其余降级为小怪（每层唯一）
    const exist = cols.filter((c) => layer[c] && layer[c].type === 'trial' && !isLocked(layer[c]));
    exist.slice(1).forEach((c) => { NDX._replaceNode(layers, L, c, 'mob', off); });
    let slot = exist.length ? exist[0] : null;
    if (slot == null) {
      // 该层无劫难节点 → 挑一个未锁定列升为劫难位（优先岔路列，避开主线固定节点）
      const free = cols.filter((c) => !isLocked(layer[c]));
      if (!free.length) continue;
      slot = free[NDX._rand(0, free.length - 1)];
      NDX._replaceNode(layers, L, slot, 'trial', off);
    }
    const n = layers[L][slot];
    if (!n || n.type !== 'trial') continue;
    n.fixedTrial = g;                            // 固定难号：进入时直接使用，不再随机抽
    n.diff = g;
    const tpl = NDX.TRIAL_LIB && NDX.TRIAL_LIB[g];
    if (tpl && tpl.name) {
      n.name = tpl.name;
      n.title = tpl.title || ('第' + g + '难 · ' + tpl.name);
      if (tpl.icon) n.icon = tpl.icon;
    } else if (n.title == null) {
      n.title = '第' + g + '难';
    }
  }
};

// 由上一层节点列集合，生成本层 3~4 个可达节点列（每行 3-4 个，避免过密）：
//  - 优先落在与上层相邻的可达列（保证连线平行、不交叉）
//  - 列尽量分散在 1~MAX_COL，形成并列多路
NDX._genBranchCols = function (prevCols) {
  const N = NDX._rand(3, Math.min(4, NDX.MAX_COL)); // 每层 3 或 4 个节点
  let pool, prefer;
  if (!prevCols.length) {
    // 开局第 1 层：从全部列取 N 个（分散）
    pool = [];
    for (let i = 1; i <= NDX.MAX_COL; i++) pool.push(i);
    prefer = [];
  } else {
    // 错开式：优先取上层列之间的「缝隙」列（上层列±1），使上下层节点交错、连线呈网状而非直线
    const gaps = new Set();
    prevCols.forEach((pc) => [pc - 1, pc + 1].forEach((x) => { if (x >= 1 && x <= NDX.MAX_COL) gaps.add(x); }));
    prefer = [...gaps];
    pool = [...gaps];
    prevCols.forEach((pc) => { if (!pool.includes(pc)) pool.push(pc); });
  }
  // 优先填满「缝隙」列；不足 N 个时，从剩余候选中选「与已选最分散」的列补齐
  const chosen = prefer.slice();
  const rest = pool.filter((x) => !chosen.includes(x));
  while (chosen.length < N && rest.length) {
    let best = rest[0], bestScore = -1;
    rest.forEach((x) => {
      const minD = Math.min(...chosen.map((c) => Math.abs(c - x)));
      if (minD > bestScore) { bestScore = minD; best = x; }
    });
    chosen.push(best);
    rest.splice(rest.indexOf(best), 1);
  }
  return chosen.sort((a, b) => a - b);
};

// 杀戮尖塔式连线：为相邻两层连边。规则：
//  - 每个上层节点向下连 1~2 个「相邻列(列差<=1)」的下层节点（连线平行、不交叉）
//  - 保证下层每个节点至少被一个上层连入（无孤岛/死路）
NDX._connectLayer = function (layers, L) {
  const cur = layers[L] || {};
  const nxt = layers[L + 1] || {};
  const curCols = Object.keys(cur).map(Number).sort((a, b) => a - b);
  const nxtCols = Object.keys(nxt).map(Number).sort((a, b) => a - b);
  const inbound = new Set();
  curCols.forEach((pc) => {
    let cand = nxtCols.filter((c) => Math.abs(c - pc) <= 1);
    if (!cand.length) cand = nxtCols.slice(); // 兜底：极端情况下连全部，避免断连
    NDX._shuffle(cand);
    const k = NDX._rand(1, Math.min(2, cand.length)); // 每个节点 1~2 条出边
    const pick = cand.slice(0, k);
    cur[pc].next = pick;
    pick.forEach((c) => inbound.add(c));
  });
  // 修复下层孤岛：未被连入的节点，连一个最近的上层节点
  nxtCols.forEach((nc) => {
    if (!inbound.has(nc)) {
      let best = curCols[0], bd = 99;
      curCols.forEach((pc) => { const d = Math.abs(pc - nc); if (d < bd) { bd = d; best = pc; } });
      if (!cur[best].next.includes(nc)) cur[best].next.push(nc);
    }
  });
};

// 数组原地洗牌（Fisher–Yates）
NDX._shuffle = function (arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = NDX._rand(0, i);
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
};

// 进入「劫」节点时，从 TRIALS 池随机挑一个具体内容（地图只标类型不标名，故节点数量不受劫名数量限制）
NDX.pickTrial = function (act) {
  const gs = NDX.game && NDX.game.state;
  const hero = gs ? gs.hero : null;
  const curAct = act || (gs ? gs.act : 1) || 1;
  const cycle = NDX.getCycle ? NDX.getCycle() : 1;
  const keys = Object.keys(NDX.TRIALS);
  // 章节归属：数字键 = 全局难号（某章专属），难号所属章 = chapterOf；非常规键（英雄专属/心魔）不限章
  const chapterOfKey = (k) => (k > 0 ? NDX.chapterOf(+k) : 0);
  // 英雄专属劫难（heroLock）仅对指定英雄开放；其余英雄不可遇到
  // 隐藏劫（cycleReq）仅达到对应周目才解锁；心魔劫等为二周目专属内容（与善恶路线无关）
  const openToHero = (k) => {
    const t = NDX.TRIALS[k];
    const lock = t.heroLock;
    const cyc = t.cycleReq;
    if (cyc && cycle < cyc) return false;
    return !lock || lock === hero;
  };
  const fresh = keys.filter((k) => openToHero(k) && !NDX._usedTrialTitles.includes(k));
  // 章节感知兜底：优先取「未用过且隶属当前章」的劫难，避免第二~九章复用第一章内容；
  // 本局该章劫难用尽则回退全池未用，再尽则全池复用（保不卡死）
  const sameAct = fresh.filter((k) => chapterOfKey(k) === curAct);
  let pool = sameAct.length ? sameAct : fresh;
  if (!pool.length) pool = keys.filter(openToHero);
  // 英雄专属劫难优先：heroLock 匹配当前英雄且未用过的，强制优先（保证小猴子必过两界山）
  const locked = pool.filter((k) => NDX.TRIALS[k].heroLock === hero);
  const use = locked.length ? locked : pool;
  const k = NDX._pick(use);
  if (!NDX._usedTrialTitles.includes(k)) NDX._usedTrialTitles.push(k);
  return NDX.TRIALS[k];
};
