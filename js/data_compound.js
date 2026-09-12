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
    layer: 1,
    name: '新手指引·前三难',
    title: '第1-3难 · 新手指引',
    icon: '🧭',
    diffs: [1, 2, 3],
    tutorial: true,            // 标记为教学复合节点：三难分授六道/油灯/战斗+劫印
    // V8.27 follow-up：取消入口长文案，让玩家直接进入「第一难·金蝉遭贬」叙事与姿态抉择；
    // 三个选项各自带「新手说明」说明该选项将获得的具体内容与影响。
    routePrompt: '',
    routeOptions: [
      // V8.27 follow-up：routeOptions tip 也按「X与Y道」格式重写，让玩家一眼看出选这条路线会获得什么道途。
      { key: '顺命', label: '【顺命】慈悲顺命',
        tip: '你将走上渡与缘道。渡道，参悟经文，诵经渡敌；缘道，防御加身，肉生成圣。',
        effect: { alignGood: 12 }, skipDiffs: [2], bossMul: 0.9 },
      { key: '砥行', label: '【砥行】众善奉行',
        tip: '你将走上渡道。稳扎稳打，步步为营；三难皆历，不跳过中段教战，根基更稳。',
        effect: { alignGood: 8 }, bossMul: 0.95 },
      { key: '逆命', label: '【逆命】以杀止劫',
        tip: '你将走上战与逆道。战道，以杀止杀，以力破法；逆道，我命由我，普度众人。',
        effect: { alignEvil: 12 }, bossMul: 1.15 },
    ],
  },
  // 第二章·两界山（V8.34 地区配额制重构）：不再是"5难全并1节点"，
  // 改为「3 个融合节点 + 中间层 + 配额 Boss」——每个融合节点独立存在于地图某层，
  // 玩家自由选路推进，满足主攻道配额后解锁地区 Boss（鹰愁涧白龙）。
  // 融合节点拆分：融合1=难5+6（出城逢虎·落坑折从）、融合2=难7（双叉岭上）、融合3=难8（两界山头收悟空）；
  // 难9 为地区 Boss（鹰愁涧白龙），由地图 L5 Boss 层承载（不再并入复合节点）。
  2: {
    // 融合节点序列（由 _buildRegionSegment 按 layer 分布生成，替代原单复合节点）
    fusions: [
      { layer: 1, diffs: [5, 6], name: '两界山·出城逢虎', title: '第5-6难 · 虎口与深坑', icon: '🐅', combatTutorial: true },
      { layer: 2, diffs: [7], name: '两界山·双叉岭上', title: '第7难 · 双叉岭上', icon: '⛰️' },
      { layer: 3, diffs: [8], name: '两界山·两界山头', title: '第8难 · 两界山头收悟空', icon: '🐒' },
    ],
    quotaTier: true,          // 启用地区配额制（六道主攻道选择 + 配额锁 Boss）
    layer: 1,                 // 兼容：默认起点融合节点层
    name: '两界山·降妖教学',
    title: '第5-9难 · 地区配额试炼',
    icon: '⚔️',
    diffs: [5, 6, 7, 8],      // 兼容字段：fusion diffs 合并（不含 Boss 难9）
    combatTutorial: true,     // 首子难附战斗/抉择提示
  },
  // 第三章·黄风岭：主题介绍复合节点（承接原黄风岭三连难）
  3: {
    layer: 1,
    name: '黄风岭三连难',
    title: '第10-13难 · 黄风岭',
    icon: '🌪',
    diffs: [10, 11, 12, 13],
    themeTutorial: true,       // 标记为主题介绍：开场点出黄风岭主线
    routePrompt: '黄风卷沙，虎先锋拦路——此处是西行第一场"妖也向佛"的戏。你如何过这黄风岭？',
    routeOptions: [
      { key: '渡', label: '【渡】渡化前行——虎先锋前哨化风而去，少打一怪；黄风大圣气焰稍敛', effect: { alignGood: 10 }, skipDiffs: [10], bossMul: 0.9 },
      { key: '恶', label: '【恶】逆道直行——四段全打，黄风大圣狂性更炽，难度大增', effect: { alignEvil: 10 }, bossMul: 1.15 },
    ],
  },
  // 第七章·车迟国：三场斗法（求雨/赌胜/灭僧）合并为「车迟国斗法」单一复合节点。
  // 每场斗法可独立择 战/渡/隐：选「隐」即避战、妖占车迟、直接收场（不出现后续斗法与合体战）；
  // 三场全「战」→ 解锁第31难「车迟三妖·魁首」一打三合体终战；含「渡」（无隐）则斗法折服三妖、跳过合体战。
  7: {
    fusions: [
      { layer: 1, diffs: [28, 29, 30], name: '车迟国斗法', title: '第28-30难 · 车迟国斗法', icon: '⚔️', chechi: true },
    ],
    layer: 1,
    name: '车迟国·斗法三场',
    title: '第28-30难 · 车迟国',
    icon: '⚔️',
    diffs: [28, 29, 30],
    chechi: true,
  },
};
// V8.34 自动生成 act4~17 融合节点（基于 ACT_RANGES，地区配额制）
//   规则：非 Boss 难号（start..end-1）分成 2~3 组融合节点，分布在 L1/L2(/L3)；
//   5难地区(4非Boss)→3组[2,1,1]，4难地区(3非Boss)→2组[2,1]，大地区(≥6非Boss)→3组均分；
//   act3 黄风岭 layers=1 特殊，保持原有旧式复合节点逻辑，不自动生成。
(function () {
  for (let act = 4; act <= 17; act++) {
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
// 第八章·通天河（act8）终局矩阵（第二批 §一 / §零.4）：按子难组合决定第36难金鱼精决战的收场。
//   全渡 → 观音持鱼篮收金鱼，决战不战而解；全逆 → 河神怨气反噬，金鱼精攻势 +15%；其余 → 正常决战。
//   仅打标记，不改变融合节点分布（地图结构零影响）。
if (NDX.COMPOUND_NODES[8]) NDX.COMPOUND_NODES[8].tongtian = true;
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
// 地理段落（V8.22）：劫难以国家/地区为划分，每地区一段，难簿长卷按段标注，玩家可循地理脉络追索八十一难。
// 完全按地理段落分地区后，GEO_SEGMENTS 与 ACT_RANGES 一一对应（每地区一段，段名=地区名）。
NDX.GEO_SEGMENTS = [
  { act: 1, name: '大唐境内', segs: [ { name: '大唐境内', lo: 1, hi: 4 } ] },
  { act: 2, name: '两界山', segs: [ { name: '两界山', lo: 5, hi: 9 } ] },
  { act: 3, name: '黄风岭', segs: [ { name: '黄风岭', lo: 10, hi: 13 } ] },
  { act: 4, name: '流沙河', segs: [ { name: '流沙河', lo: 14, hi: 18 } ] },
  { act: 5, name: '五庄观', segs: [ { name: '五庄观', lo: 19, hi: 22 } ] },
  { act: 6, name: '火云洞', segs: [ { name: '火云洞', lo: 23, hi: 27 } ] },
  { act: 7, name: '车迟国', segs: [ { name: '车迟国', lo: 28, hi: 31 } ] },
  { act: 8, name: '通天河', segs: [ { name: '通天河', lo: 32, hi: 36 } ] },
  { act: 9, name: '女儿国', segs: [ { name: '女儿国', lo: 37, hi: 40 } ] },
  { act: 10, name: '真假猴王', segs: [ { name: '真假猴王', lo: 41, hi: 45 } ] },
  { act: 11, name: '火焰山', segs: [ { name: '火焰山', lo: 46, hi: 49 } ] },
  { act: 12, name: '祭赛国', segs: [ { name: '祭赛国', lo: 50, hi: 54 } ] },
  { act: 13, name: '狮驼岭', segs: [ { name: '狮驼岭', lo: 55, hi: 58 } ] },
  { act: 14, name: '比丘国', segs: [ { name: '比丘国', lo: 59, hi: 63 } ] },
  { act: 15, name: '天竺·玉兔', segs: [ { name: '天竺·玉兔', lo: 64, hi: 72 } ] },
  { act: 16, name: '灵山', segs: [ { name: '灵山', lo: 73, hi: 77 } ] },
  { act: 17, name: '凌云渡', segs: [ { name: '凌云渡', lo: 78, hi: 81 } ] },
];
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

// P2 正式接口：17地区 → 4档装备映射（regionToTier）
// 唯一真源：所有装备章节消费点（掉落池 cap / 章节套件解锁 / 红材阈值）统一走本映射，
// 替代直接拿 chapterOf(17地区号) 与装备 chapter(4章制) 对比的错位写法。
// 章1: 地区1-4(难1-18, 大唐→流沙河)  章2: 地区5-9(难19-40, 五庄→女儿国)
// 章3: 地区10-13(难41-58, 真假→狮驼) 章4: 地区14-17(难59-81, 比丘→凌云渡)
// 对齐设计标尺：凌云套（chapter:4）地区4(难14)不入池，地区14(难59)起才解锁——消除提前约47难错位。
NDX.regionToTier = function (region) {
  const r = Math.max(1, Math.min(17, +region || 1));
  if (r <= 4) return 1;
  if (r <= 9) return 2;
  if (r <= 13) return 3;
  return 4;
};
// 兼容别名（V8.37 旧名，避免遗漏引用）
NDX.regionToEquipChapter = NDX.regionToTier;

// 17地区 → 9章转职档位（转职actGate用）
// 每2个地区对应1章，最后地区17单独为第9章
NDX.regionToActChapter = function (region) {
  const r = Math.max(1, Math.min(17, +region || 1));
  return Math.min(9, Math.ceil(r / 2));
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
