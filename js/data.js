// =============================================================
// data.js — 《逆道西行》第一章数据 · 数值与拓扑
// 拓扑：V5.16（20层×4列×76节点·自动对轰·收集癖版）
// 数值：V5.13 图谱版逐难怪物曲线 + 玩家成长曲线（魔塔掉血制）
// 全局命名空间 NDX（同时挂到 window，兼容 combat.js 等以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// =============================================================
// V8.43 五行系统已整体删除（用户拍板：无存在必要）。原 WUXING / HERO_WUXING /
// REGION_WUXING / 五行饰品 / trinket 槽 / 战斗克制结算 已全部移除。
// =============================================================

// 怪物减伤全程固定 20%
// 数值目标：每场战斗 4~7 回合（魔塔掉血制，你先手击杀即止），单场掉血约 15~40% 上限
// 配合 2 个回血点 + 装备增益，连续推进不暴毙；"拿到装备即战力"成立
// 体 / 愿 双攻防：atk=体攻(被玩家dr+eva抵御) / matk=愿攻(被玩家mdef抵御)
//               dr=护体减伤 / mdef=御念减伤
// diff: 难数；hp/atk 随难数爬升；boss 标记关隘
// 平衡修订(V24)：原表后期 hp 膨胀约 5.8 倍（500→2900）、matk 翻 7 倍，
// 而玩家 matk 不随层数成长，导致「未合成组件」的愿流派（取经人/沙僧）15 难后必败。
// 现压缩后期膨胀：hp 约 3.6 倍（500→1800，boss 2300），matk 约 4 倍，
// 配合 playerBaseAt 的成长提速，使裸装备也能在 15 难后推进，合成后明显变强。
// 平衡修订(V39)：取消英雄升级获得的血量成长（playerBaseAt 不再 +1500*t），
// 玩家血量完全由装备提供；血量上限 capHp 由 baseHp*3 放宽至 baseHp*4 承接装备;
// 怪物侧同步降压：第1章末 boss(2300/200/130→2100/185/115)，第2-4章成长指数 1.4→1.25，
// mdef 成长 (diff-20)*0.008→*0.006，匹配「无升级成长」的玩家曲线，避免后期无装备必崩。

// 【已拆分】playerBaseAt / scaleRunMods / buildDeathReview
//           已移至 data_heroes.js（2026-08-31）

// -------------------------------------------------------------
// 第一章地图：LAYERS[layer] = { col: nodeObj }
// 节点类型 type：mob / trial / elite / boss / rest / shop / event
// layer 1..20 为 20 难；layer 0 为逻辑起点层（无节点，开局即自选第 1 层）
// -------------------------------------------------------------
// 第一章地图：开局随机生成（一览无余 · 自选路线）
// 主路径 20 层固定类型配比：5小怪 / 5精英 / 5小劫 / 2坊市 / 2篝火 / 1关隘Boss(第20难)
// 第 1 层即为多节点起点（2~3 列随机），玩家从开局即可自由择路；后续层分支随机
// 节点类型 type：mob / event / elite / boss / rest / shop
// layer 1..20 为 20 难；运行时由 NDX.generateMap() 写入 NDX.LAYERS

// 【已拆分】MAP_PLAN / MAP_PLAN_CH1
//           已移至 data_map_plan.js（2026-08-31）

// 【已拆分】_rand / _clampCol / _pick / mulberry32 / withSeed / SEED_ALPHABET / encodeSeed / decodeSeed
//           已移至 data_seed.js（2026-08-31）

// 【已拆分】GEN_SET_BASES / isGenBase / _GEN_SET_PICKS / _GEN_SET_PICKS_BY_CHAPTER / MAP_TUNE / redEquipPoolFor / _sideNode / upgradeEquip
//           已移至 data_equipment.js（2026-08-31）

// 【已拆分】ACT_BG / ACT_MAP_THEME / _applyActTheme
//           已移至 data_regions.js（2026-08-31）

// 【已拆分】_usedEventIds / _usedTrialTitles / FIXED_EVENT_TRIALS / FIXED_EVENT_LAYERS / _convertStoryTrialsToEvents / _buildRegionSegment / generateMap / _replaceNode / _enforceMapRules / _ensureHiddenTrials / _capTrialNodes / _genBranchCols / _connectLayer / _shuffle / pickTrial
//           已移至 data_map.js（2026-08-31）

// 【已拆分】LAYER_COUNT / ACT_LABEL / MAX_COL / ACT_RANGES / TOTAL_ACTS / TOTAL_TRIALS / ACT_NAMES / actRange / actStart / actEnd / actTrials / actLayers / FIGHT_GATE
//           已移至 data_region_config.js（2026-08-31）

NDX.fightUnlock = function (act) {
  const a = Math.max(1, Math.min(NDX.TOTAL_ACTS, +act || 1));
  return {
    auto:  a >= NDX.FIGHT_GATE.auto,
    speed2: a >= NDX.FIGHT_GATE.speed2,
    speed3: a >= NDX.FIGHT_GATE.speed3,
    skip:   a >= NDX.FIGHT_GATE.skip,
  };
};
// —— 地区辅助函数（全局层 ↔ 地区/局部层/真实难号）——
// 连续地图下 s.layer 为「全局层」（从第 1 地区第 1 层起累计）；地区 act 占据全局层
//   regionLayerOffset(act)+1 .. regionLayerOffset(act)+actLayers(act)。
NDX.regionLayerOffset = function (act) {
  let off = 0;
  for (let i = 0; i < NDX.ACT_RANGES.length; i++) {
    if (NDX.ACT_RANGES[i].act >= act) break;
    off += NDX.ACT_RANGES[i].layers;
  }
  return off;
};
NDX.actOfLayer = function (globalLayer) {                                    // 全局层 → 17地区号(1~17)
  const L = Math.max(1, globalLayer || 1);
  let acc = 0;
  for (let i = 0; i < NDX.ACT_RANGES.length; i++) {
    acc += NDX.ACT_RANGES[i].layers;
    if (L <= acc) return NDX.ACT_RANGES[i].act;
  }
  return NDX.TOTAL_ACTS;
};
NDX.localLayer = function (globalLayer) {                                    // 全局层 → 地区内局部层(1..layers)
  const act = NDX.actOfLayer(globalLayer);
  return Math.max(1, (globalLayer || 1) - NDX.regionLayerOffset(act));
};
NDX.diffOfLayer = function (globalLayer) {                                   // 全局层 → 真实难号(1~81)
  const act = NDX.actOfLayer(globalLayer);
  return NDX.actStart(act) - 1 + NDX.localLayer(globalLayer);
};
NDX.isRegionBoundary = function (L) {                                         // 全局层是否为「某地区段起点」（含逻辑起点 0）
  const l = Math.max(0, L || 0);
  let acc = 0;
  for (let i = 0; i < NDX.ACT_RANGES.length; i++) {
    if (l === acc) return true;
    acc += NDX.ACT_RANGES[i].layers;
  }
  return l === acc;
};
// —— 复合节点（多难合并为一个地图节点）——
// 一个节点 = 多难连续（减少节点数，节点内时间拉长）。键=地区号；layer=复合节点所在层（该地区唯一层）；
// diffs=包含的难号（顺序执行）；routeOptions=进入节点时的路线抉择（渡/恶），决定子难流程与 Boss 强度。
// —— 最新构思（2026-08-25）——
//   第 1 地区：前 3 难合并为「新手指引」节点，开场介绍六道系统；
//   第 2 地区：作为「战斗教学」复合节点，带玩家熟悉战斗/抉择；
//   第 3 地区：作为「主题介绍」复合节点，引入黄风岭主线。
//   由于劫难改为"每难必过"，进入节点即连续经历全部子难，路线选项（渡/恶）只调节奏与 Boss 强度。

// =============================================================
// 地区配额制（V8.34 万世剑冢式）：以「地区」为总量单位，玩家在本地区内自由选路推进
// 小劫难/融合节点，满足「主攻道配额」后解锁本地区最终 Boss；未满足则 Boss 锁定不可进。
// 从第二章（两界山）起启用，第一章（新手教学）不加配额、保持线性引导。
// 六道各有「主路径 + 替代路径」：满足任一即可——防"选道但地区内无对应节点"卡死。
// 替代路径语义（两界山实际道选项少）：渡→诵经/经文、逆→心魔/逆经、缘→休息、隐→闪避、夺→精英。
// 计数口径（由 game.js 进入节点/抉择时累加，见 NDX.addQuota）：
//   battle 战斗场数 / elite 精英数 / ferry 渡抉择 / war 战抉择 / yuan 缘抉择 / yin 隐抉择 /
//   duo 夺抉择 / rebel 逆抉择 / chant 诵经次数 / xinmo 心魔增长 / rest 休息次数 / sutra 渡经全本
// =============================================================
// =============================================================
// 【已拆分】_quotaSix / REGION_QUOTA / regionQuotaOf / quotaEnabled / _quotaItemMet / _quotaSetMet / quotaCheck / QUOTA_LABEL / MAIN_DAO_ORDER / MAIN_DAO_DESC / addQuota / quotaOf / mainDaoOf
//           已移至 data_quota.js（2026-08-31）

// =============================================================
// 复合节点系统（COMPOUND_NODES）：多劫难合并为一个大节点
// =============================================================
// =============================================================
// 关隘必修任务（缘分门槛 v2）：每章需完成「渡难(劫难)/降妖(小怪)/精英/缘遇(事件)」
// 四类指定数量，方可叩开本关隘、走出本区域/往下一国。
// 未达标即「缘分未到」——最终 Boss 不刷新为可战（任务驱动：见 data.js 动态尾 / game.choices）。
// 各数字按「本章要走多少个该类型节点」设定，逐章递增，配合地图随机补充路径自然达标，
// 防「只打怪不历难 / 只赶路不遇缘」的偏科与纯捷径冲关。
// =============================================================
NDX.FATE_GATE = {
  // V8.5x 第一章（大唐境内）取消关隘刷新强制要求：刘洪（第4难）直接可战，不再要求 渡难/杀伐/缘遇 配额
  1: { trials: 0, battle: 0, events: 0 },
  2: { trials: 3, battle: 7, events: 2 },
  3: { trials: 4, battle: 9, events: 2 },
  4: { trials: 4, battle: 10, events: 2 },
  5: { trials: 5, battle: 11, events: 3 },
  6: { trials: 5, battle: 12, events: 3 },
  7: { trials: 5, battle: 13, events: 3 },
  8: { trials: 6, battle: 14, events: 3 },
  9: { trials: 6, battle: 15, events: 3 },
};
// 杀伐值融合权重：小怪=1，精英=BATTLE_ELITE_WT（精英奖励更高、玩家更愿打，
// 故按 2 倍折算进同一「杀伐」池——打小怪或打精英都推进同一进度，避免被钉在低价值小怪上）
NDX.BATTLE_ELITE_WT = 2;
// 各区域（卷）名：第一章为长安，其余为西行途经的国与境（对应"每处劫难"的地理归属）
NDX.AREA_NAME = {
  1: '东土·两界·黄风境',
  2: '流沙·五庄境',
  3: '火云·车迟境',
  4: '通天·女儿境',
  5: '真假·火焰境',
  6: '祭赛·狮驼境',
  7: '比丘·天竺境',
  8: '玉兔·灵山境',
  9: '凌云渡境',
};
// 任务条目：trials 渡难 / battle 杀伐（小怪+精英折算）/ events 缘遇 —— 均为独立必修类别
NDX.MISSION_KINDS = ['trials', 'battle', 'events'];
// 任务项中文名
NDX.MISSION_KIND_LABEL = { trials: '渡难', battle: '杀伐', events: '缘遇' };
// 岁数（寿命）折算示意：按节点类型（进入即耗岁），与任务条目分开，避免 elite/mob 被吞并
NDX.NODE_COST_ORDER = ['trial', 'mob', 'elite', 'event'];
NDX.MISSION_COST_LABEL = {
  trial: { cost: 0.3, txt: '劫难·一难耗岁 0.3' },
  mob:   { cost: 0.2, txt: '小怪·一步耗岁 0.2' },
  elite: { cost: 0.5, txt: '精英·一俯积年 0.5' },
  event: { cost: 0.25, txt: '事件·一缘耗岁 0.25' },
};
NDX.fateGateFor = function (act) {
  return NDX.FATE_GATE[act] || NDX.FATE_GATE[NDX.TOTAL_ACTS] || { trials: 4, battle: 9, events: 2 };
};
// 本卷任务进度：battle = 小怪×1 + 精英×BATTLE_ELITE_WT（读 s.mission 的小怪/精英原数折算）
NDX.fateGateProgress = function (s) {
  const m = (s && s.mission) || {};
  const tri = m.trials || 0, mob = m.mob || 0, elite = m.elite || 0, evt = m.events || 0;
  const battle = mob + elite * NDX.BATTLE_ELITE_WT;
  return { trials: tri, battle, events: evt, mob, elite, kills: tri + mob + elite };
};
// 任务是否已达标：返回 { met, missing:[{key,label,need,cur}], gate, progress }
NDX.fateGateCheck = function (s) {
  const act = (s && s.act) || 1;
  const g = NDX.fateGateFor(act);
  const p = NDX.fateGateProgress(s);
  const missing = [];
  (NDX.MISSION_KINDS || ['trials', 'battle', 'events']).forEach((k) => {
    if (p[k] < (g[k] || 0)) missing.push({ key: k, label: NDX.MISSION_KIND_LABEL[k], need: g[k], cur: p[k] });
  });
  return { met: missing.length === 0, missing, gate: g, progress: p };
};

// =============================================================
// 关隘动态尾（任务驱动）：强制任务未完成时，最终 Boss 不出现在可达路径，
// 由随机补充节点持续延伸路径（可一直走下去、顺带补足任务计数）；
// 一旦四类任务全部达标，下一节点强制收敛为关隘 Boss。
// =============================================================
NDX._makeBossNode = function (act, diff) {
  const d = diff || NDX.actEnd(act);
  return {
    type: 'boss',
    name: NDX.bossNameForAct ? NDX.bossNameForAct(act) : '关隘之主',
    title: (NDX.ACT_NAMES[(act - 1)] || '') + '·关隘',
    icon: '👑',
    diff: d,
    _dynBoss: true,       // 动态尾追加的关隘 Boss 标记
  };
};
// 「任务驱动」补一节尾：追加一层（补充寻缘节点 或 收敛 Boss），把当前节点 next 挂到新层。
// 返回下一跳可去节点 [{layer,col}]（即本步完成后再 Choices 的直接去向）。
// 注意：会变动 NDX.LAYERS 与 NDX.LAYER_COUNT（地图纵向扩展）。
NDX._tailStep = function (s) {
  if (!s || !s.layer || !NDX.LAYERS[s.layer] || !NDX.LAYERS[s.layer][s.col]) return [];
  const met = NDX.fateGateCheck(s).met;
  const cur = NDX.LAYERS[s.layer][s.col];
  // 幂等守卫：同一 (当前节点, 任务是否达标) 只构建/重定向一次。
  // 渲染与 choiceCount 都会调 choices()→_tailStep，若无此守卫会每帧无限追加层。
  const _key = s.layer + '-' + s.col + ':' + (met ? 1 : 0);
  if (s._tailCache === _key && cur.next && cur.next.length
      && NDX.LAYERS[cur.next[0]]) return cur.next.map((c) => ({ layer: NDX.LAYER_COUNT, col: c }));
  s._tailCache = _key;
  const L = NDX.LAYER_COUNT + 1;
  if (met) {
    // 任务已达标 → 当前节点强制收敛为 1 个关隘 Boss
    const bossCol = 2;
    NDX.LAYERS[L] = { [bossCol]: NDX._makeBossNode(s.act, NDX.actEnd(s.act)) };
    NDX.LAYER_COUNT = L;
    cur.next = [bossCol];
    s._tailCache = _key; // 重设，确保幂等分支以最新 LAYER_COUNT 返回
    return [{ layer: L, col: bossCol }];
  }
  // 未达标 → 追加一「节」随机补充寻缘（小怪为主，偶遇事件/劫难，可一路走下去）
  const cnt = NDX._rand(2, 3);
  const pool = ['mob', 'mob', 'event', 'trial'];
  const nodeMap = {};
  const cols = [];
  for (let c = 1; c <= cnt; c++) {
    const t = NDX._pick(pool);
    nodeMap[c] = NDX._sideNode(L, t);
    cols.push(c);
  }
  NDX.LAYERS[L] = nodeMap;
  NDX.LAYER_COUNT = L;
  cur.next = cols;
  return cols.map((c) => ({ layer: L, col: c }));
};

// =============================================================
// 师徒缘（V8.17·轻量）：特定劫难/事件可收徒，徒弟给一个被动增益，
// 计入一生账本与劫灰结算（+3/徒）。不做完整养成，贴合单人主角感。
// =============================================================
NDX.DISCIPLE_LIB = {
  yuhua3: { id: 'yuhua3', name: '玉华州三王子', dao: '缘', source: '玉华州·赴钉耙会', bonus: { hp: 40 }, desc: '血上限+40' },
  fengxian: { id: 'fengxian', name: '凤仙郡民', dao: '渡', source: '凤仙郡·建祠求雨', bonus: { dr: 0.02 }, desc: '减伤+2%' },
  jinping: { id: 'jinping', name: '金平府灯官', dao: '夺', source: '金平府·夺犀角灯', bonus: { hpRegen: 15 }, desc: '战后回血+15' },
};
NDX.discipleById = function (id) { return NDX.DISCIPLE_LIB[id] || null; };
// 汇总徒弟被动增益（供 stats() 读取）
NDX.discipleBonus = function (s) {
  const b = { hp: 0, dr: 0, hpRegen: 0 };
  (s && s.disciples || []).forEach((id) => {
    const d = NDX.DISCIPLE_LIB[id];
    if (!d || !d.bonus) return;
    if (d.bonus.hp) b.hp += d.bonus.hp;
    if (d.bonus.dr) b.dr += d.bonus.dr;
    if (d.bonus.hpRegen) b.hpRegen += d.bonus.hpRegen;
  });
  return b;
};

// =============================================================
// 16.1 返程兑现·三段情感演出（回长安→受封/告别→清点一生）
// 按一生的善恶 / 难度给出受封称号与一句结局结语；清点复用一生账本快照。
// =============================================================
NDX.buildReturnScene = function (s) {
  if (!s) return null;
  const base = (() => {
    const left = s.life || 0;
    const S = NDX.LIFE.SHRINE_R, P = NDX.LIFE.PERFECT_R;
    // V9.7 天数制：大限 50、起点 27（余寿 23）。到西天余寿 R<9 →返程坐化留舍利塔（>41岁到西天）；
    //   R≥14 →完美(≤36岁到西天，45回)；9≤R<14 →不完美(≈37-41岁到西天仍可回，45-50归)
    if (left < S) return { grade: 'shrine', title: '返程坐化 · 留章舍利', years: Math.max(0, Math.floor(left)), region: NDX.returnShrineRegion(left) };
    const perf = left >= P;
    return { grade: 'return', title: perf ? '回长安 · 受封留名' : '回长安 · 迟归受封', perfect: perf, years: Math.max(0, Math.floor(left)) };
  })();

  const good = s.good || 0;
  const evil = s.evil || 0;
  const virtue = good - evil;
  // 难度代理：进到多深的 Chapter / 破了几难
  const acts = s.act || 1;
  const passed = Array.isArray(s.trialsPassed) ? s.trialsPassed.length : 0;
  const depth = acts * 10 + passed;

  let honor, closing;
  // V8.55 朝代称号：完美结局授「朝代+僧」（夏僧/商僧/周僧…），不完美结局授「朝代+和尚」（夏和尚/商和尚…）
  const _curDynasty = NDX.getDynasty ? NDX.getDynasty() : { name: '唐' };
  const _dynastyName = _curDynasty.name || '唐';
  const _rankName = (base.perfect ? _dynastyName + '僧' : _dynastyName + '和尚'); // 完美=僧、不完美=和尚
  if (base.grade !== 'return') {
    honor = virtue >= 0 ? '西行遗偈' : '逆修邪偈';
    closing = base.grade === 'shrine'
      ? `返程 9 岁，你只到归途第 ${base.region || 17} 区便油尽——${_dynastyName}的山水还远，你于途坐化成一枚舍利，替此世留了碑。余寿 ${base.years} 年，正好够你数完归途的郡县。`
      : `返程路上油尽灯枯——衣冠冢立在长安门外。这一世攒的家当留给黄土，只带走一身本命。`;
  } else if (virtue >= 15) {
    honor = `${_rankName} · 功德圆满`;
    closing = `你带着 ${base.years} 年余寿回到长安，御前受封「${_rankName}」。天下人只知取经，不知你这一路把自己渡了几回。`;
  } else if (virtue <= -10) {
    honor = '逆道魔元 · 自封自在';
    closing = `你索性不回取经人该回的地方——长安城头，你留了封给佛祖的信。逆了这一生，自在这一回。`;
  } else if (depth >= 30) {
    honor = `${_rankName} · 杖下留痕`;
    closing = `你在佛前合掌片刻，终究没愿说尽。八十一难只走了${passed}，但这一路的抉择，金蝉记得。`;
  } else {
    honor = `${_rankName} · 取经归来`;
    closing = `你回了长安，领了封号「${_rankName}」，却在夜里把杖子又擦了擦——西天不过寻常，沿途才是你的一世。`;
  }

  const acc = NDX.accountSnapshot(s);

  // —— 里程碑二 · 返程兜底赎回：非本命随行法宝，可按代价（善缘）有限赎回留待下世 ——
  const heroSet2 = NDX.HERO_SET_NAME && NDX.HERO_SET_NAME[s.hero];
  const benKeys = new Set();
  (s.equips || []).forEach((e) => {
    if (!e) return;
    if ((e.treasure && e.owner === s.hero) || (NDX.isRedEquip(e, heroSet2))) benKeys.add(e.name || e.treasureId);
  });
  const redeemable = (s.equips || [])
    .filter((e) => e && e.treasure && e.name && !benKeys.has(e.name))
    .slice(0, 3) // 兜底上限：最多赎回 3 件非本命法宝
    .map((e) => e.name);
  const redeem = {
    count: redeemable.length,
    names: redeemable,
    cost: redeemable.length * 5  // 每件需 5 善缘
  };

  return {
    grade: base.grade, title: base.title, years: base.years,
    perfect: base.perfect, region: base.region, rankName: _rankName,
    honor, closing, redeem,
    acts: [
      { key: '归', text: `转身离了灵山，往东是家。余寿 ${base.years} 年，一步一念。` },
      { key: '封', text: `受封「${honor}」。功过都烙在簿上，这一生落地。` },
      { key: '清', text: `${redeem.count ? `你以 ${redeem.cost} 善缘，从黄土里捡回「${redeem.names.join('、')}」，留待下一世。` : '逆道无多宝，一身清白归，只带一颗心。'}这一世攒得：${acc.gained.length ? acc.gained.slice(0, 3).map((i) => `「${i.name}」`).join('、') : '空空如也，只带一颗心'}` }
    ],
    account: acc
  };
};

// 连通性：读取杀戮尖塔式预生成边集（node.next，存下层列数组）。
// 每条边保证列差 <=1（相邻、平行不交叉）；下层每个节点至少被一个上层连入（无死路）。
NDX.nextNodes = function (layer, col) {
  if (layer >= NDX.LAYER_COUNT) return [];
  if (layer === 0 || NDX.isRegionBoundary(layer)) {
    // 逻辑起点层 / 地区段起点：从「下一层第一个节点（最左侧）」起步，之后才正常分支。
    // 连续地图下每地区段起点 = regionLayerOffset(act)，nextNodes 指向该地区第 1 层。
    // 取该层最小列作为起点（兼容各层分支列分布，不硬编码为 1）。
    const first = NDX.LAYERS[layer + 1] || {};
    const cols = Object.keys(first).map(Number).sort((a, b) => a - b);
    if (!cols.length) return [];
    return [{ layer: layer + 1, col: cols[0] }];
  }
  const node = NDX.LAYERS[layer][col];
  if (!node || !node.next) return [];
  return node.next
    .filter((c) => NDX.LAYERS[layer + 1] && NDX.LAYERS[layer + 1][c])
    .map((c) => ({ layer: layer + 1, col: c }));
};

