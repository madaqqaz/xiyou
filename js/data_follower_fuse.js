// =============================================================
// data_follower_fuse.js — 《逆道西行》随从「点化」三阶（A2 · 随从的出口）
//
// 设计要旨（v2.0 重写，2026-09-25 用户拍板）：
//   用户拍板（原话见设计文档 §一）：旧的「同阶 2 合 1 材料堆叠」不符合西游背景，
//   要求参照《冒险日记》的合成机制重新设计。
//
//   ⇒ **v1.0 的「凡→灵→真 / 同阶 2 合 1 材料堆叠」作废**（那是炼丹/炼器口吻，
//      与西游「点化度人」的语境相悖）。本版改为**点化体系**：
//
//       ① 命名回归西游：本相（凡）→ 显形（灵）→ 证道（真）。
//       ② **两类晋升路径**（对标《冒险日记》的合成特征）：
//          · **机缘**（主路径·不消耗随从）：满足该妖王专属的点化条件即可**原地升阶**。
//            对应冒险日记「合成需**特定条件**（神殿 / 强化大师 / 善恶值门槛），
//            而不是无脑堆材料」。
//          · **渡引**（兜底路径·消耗 1 名同阶随从）：已有随从升阶无门时的保底出口。
//            对应冒险日记「合成区＝背包区，多件可互相吞并」。
//       ③ 收服因此**第一次有了目标**：升「证道」要靠配装（克星法宝）、善恶（救/杀）、
//          羁绊（同行妖王），而不是靠「多收几个」。
//
// 数据结构（存档）
//   s.followers     : string[]  妖王随从 id 列表（真源 data_negotiate.js FOLLOWERS）
//   s.followerTiers : {[id]: 'fan'|'ling'|'zhen'}  **缺省视为 'fan'**
// 铁律：本文件不写 s 之外的任何全局，阶数读取一律走 followerTierOf（单一真源）。
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// 一、三阶定义（单一真源 · 名称已回归西游）
// ============================================================
NDX.FOLLOWER_TIERS = {
  fan:  { key: 'fan',  name: '本相', mult: 1.0, desc: '谈判收服时的妖形' },
  ling: { key: 'ling', name: '显形', mult: 1.8, desc: '受点化而脱尽妖气，助战 ×1.8' },
  zhen: { key: 'zhen', name: '证道', mult: 2.5, desc: '立誓皈依、愿力凝身，助战 ×2.5' },
};
// 阶序（统计/排序/未来 UI 一律以此为序，勿硬编码数组）
NDX.FOLLOWER_TIER_ORDER = ['fan', 'ling', 'zhen'];

// ============================================================
// 一·附 证道阶羁绊技（A2-2 · 用户拍板「证道阶补羁绊技」）
//   只有证道（zhen）阶随从上阵才生效——显形/本相只是助战倍率，不具「技」。
//   口径与 NDX.FOLLOWERS 助战平铺字段一致（atk/matk/hp/dr/mdef），走既有
//   computeStats 通道，**不新开战斗接线**（避免第二次真源）。
//   数值取助战基线的 1.2~1.6 倍：证道本已 ×2.5，羁绊技再加「质变」而非单纯放大。
// ============================================================
NDX.FOLLOWER_BONDS = {
  huangfeng: { name: '三昧神风', desc: '风起而火炽，攻势如风卷残云', atk: 18, dr: 0.03 },
  baigu:     { name: '白骨归寂', desc: '肉身虽灭，愿力不散，法伤与法防同固', matk: 22, mdef: 0.04 },
  honghaier: { name: '三昧真火', desc: '火气凝誓，焚尽轮转，体攻与护体同坚', atk: 20, dr: 0.02 },
  jinyu:     { name: '鱼篮普渡', desc: '水势载舟，气血如江常注', hp: 160, dr: 0.03 },
  xiezi:     { name: '倒马毒桩', desc: '毒入骨缝，一击透甲势', atk: 24, hp: 60 },
  liuer:     { name: '混世听心', desc: '真假难辨，虚实同修', atk: 16, mdef: 0.04 },
  niumo:     { name: '大力撼山', desc: '蛮力归正，肩挑山河', atk: 28, hp: 180 },
  jiutou:    { name: '九头噬敌', desc: '九首齐张，法伤不绝', matk: 26, dr: 0.02 },
  dapeng:    { name: '云程万里', desc: '扶摇九万，气脉悠长', atk: 26, hp: 120 },
  yutu:      { name: '月华捣药', desc: '广寒药香，法术精纯粹', matk: 28, mdef: 0.04 },
  qingniu:   { name: '金刚琢护主', desc: '金刚不坏，减伤自成壁垒', dr: 0.06, hp: 140 },
  huangpao:  { name: '奎木狼星力', desc: '星君下凡，攻法双修', atk: 22, matk: 14 },
  // ⚠ v1.4 补登（存量红修复）：`tieshan` 一直是 `FOLLOWERS` 的第 13 位（`human:true`，
  //   且是「风火连天」组合技的另一半），却既不在机缘表也不在本命加持里 —— 纯遗漏，
  //   不是内容决策。① 造成 `_verify_follower_fuse` 两条断言常年报红；② 她在面板上
  //   会显示为「无本命加持的随从」。
  //   定位：罗刹女，火焰山主。本命偏「法伤 + 守」（芭蕉扇扇风灭火 ⇒ 攻防同修的守御向）。
  tieshan:   { name: '罗刹芭蕉', desc: '一扇熄火，法护同持', matk: 24, dr: 0.03, mdef: 0.03 },
  // 🩸 X7 分容器同步（2026-09-27）：与 FOLLOWER_STYLE 同批补齐，口径对齐上表（atk/matk ≤ 24、dr/mdef ≤ 0.04）。
  kouqi_ren: { name: '斋饭回春', desc: '粗茶淡饭亦养一队人马', matk: 12, hp: 45 },
  jieyin_ren: { name: '慈航渡世', desc: '一苇渡江，众生同登彼岸', matk: 20, dr: 0.03, mdef: 0.04 },
  anuo_ren: { name: '传经授业', desc: '三藏真言，字字千钧', matk: 18, dr: 0.02 },
  chechi_sanyao_ren: { name: '三仙并显', desc: '虎鹿羊三显神通，道法齐来', atk: 20, matk: 14, hp: 70 },
};

// ============================================================
// 一·附 随从流派映射（v1.4 · 「与英雄的某种路线互补」的唯一落点）
// ------------------------------------------------------------
//   命名与 `NDX.PET_AXES` / `NDX.JOBSPEC` / `NDX.HERO_STYLE_BASE` **同一套流派键**：
//     tangseng purify / wukong combo·crit·reverse / bajie drain·ward·reflect
//     shaseng ward·reflect / xiaobailong evade·drain
//   ⇒ 消费点 = `combat_part1.js` 装配 `followerSkills` 时：
//     **随从流派 == 玩家当前路线（`NDX.currentStyle`）⇒ 该随从主动技 CD −1**。
//   语义 = **放大**（你走这条路，走这条路的随从出手更勤）。不匹配者保持中性（不改 CD、不改数值），
//   不做「补位惩罚」——否则会把「配同一路线」逼成唯一解。
//   ⚠ 判据可确定性验证：CD 只减不增，且缺少该表时回落 `d.cd`（构造性零回归）。
// ============================================================
NDX.FOLLOWER_STYLE = {
  huangfeng: 'ward',        // 三昧神风：全体敌减攻 ⇒ 守势
  baigu: 'ward',            // 白骨化盾
  honghaier: 'burn',        // 三昧真火（英雄底色无人有 ⇒ 唯一补位者）
  jinyu: 'purify',          // 鱼篮普渡：治疗
  xiezi: 'rend',            // 倒马毒桩：破甲
  liuer: 'combo',           // 真假猴身：复刻
  niumo: 'rend',            // 大力撼山：破甲重击
  jiutou: 'combo',          // 九头噬敌：3 段
  dapeng: 'crit',           // 云程万里：锐攻
  yutu: 'purify',           // 月华捣药：法护
  qingniu: 'ward',          // 金刚琢护主：极致防御
  huangpao: 'reverse',      // 奎木狼星力：攻法双修
  tieshan: 'burn',          // 芭蕉扇：风火（组合技另一半）
  // 🩸 X7 分容器（2026-09-27 · 用户拍板「人形态归随从」）：4 位新增人形随从的流派归属。
  //   ⚠ 这批人形随从是 X7 接线时补进 FOLLOWERS 的，若不同步补流派表 ⇒ `_verify_pet` S9 红
  //     （「FOLLOWER_STYLE 与池 1:1」）。此处补齐，池 13 → 17。
  kouqi_ren: 'purify',       // 斋饭济众：后勤治疗向
  jieyin_ren: 'purify',      // 接引渡船：渡人即渡己
  anuo_ren: 'ward',          // 传经授业：守正
  chechi_sanyao_ren: 'burn', // 虎鹿羊三仙道法：燔烧向
};

// ============================================================
// 一·附二 组合羁绊（真·两只随从，v1.4：1 → 5 条）
// ------------------------------------------------------------
//   🔴 现状问题：`FOLLOWER_BONDS` 名为「羁绊」，实际内容是**单只随从的本命加持**
//      （如黄风大圣 atk+18），**不是组合**。真正的组合此前只有 `FOLLOWER_COMBO_FIREWIND`
//      一条 ⇒ 13 只随从里 11 只没有组合出口。本文档统一用词：
//        `FOLLOWER_BONDS` = **本命加持**（单只） ／  `FOLLOWER_COMBOS` = **组合羁绊**（多只）
//   ⚠ 纪律：新增组合一律**不高于** `firewind` 的量级（它 dmgMul 2.0 + 灼烧 3 回合），
//      且成员必须在 `FOLLOWERS` 内且未被归档（随从池恒 13，门禁 S9）。
// ============================================================
NDX.FOLLOWER_COMBOS = [
  { id: 'firewind', name: '风火连天', need: ['niumo', 'tieshan'], style: 'burn',
    desc: '牛魔王 + 铁扇公主：红孩儿主动技伤害 ×2、灼烧 3 回合（一家三口全在阵再 +20% 灼烧）' },
  { id: 'dualfeng', name: '毒风两断', need: ['huangfeng', 'xiezi'], style: 'rend',
    desc: '黄风大圣 + 蝎子精：减攻与中毒在同一敌人身上叠满时，该敌破甲效果再 +5%' },
  { id: 'zhenjia', name: '真假同途', need: ['liuer', 'dapeng'], style: 'combo',
    desc: '六耳猕猴 + 大鹏金翅雕：复刻伤害由 40% 提升到 55%，且复刻可暴击' },
  { id: 'baigu', name: '白骨渡江', need: ['baigu', 'jinyu'], style: 'ward',
    desc: '白骨夫人 + 灵感大王：护盾与治疗同回合命中时，溢出量转为等额护盾（不浪费）' },
  { id: 'sansheng', name: '三圣并尊', need: ['honghaier', 'niumo', 'jiutou'], style: 'combo',
    desc: '红孩儿 + 牛魔王 + 九头虫：每 3 回合三者主动技同回合触发一次（齐出手）' },
];
// 招式上阵的随从 id 列表 ⇒ 命中的组合羁绊（全成员在册即命中；无则 []）
NDX.followerCombosActive = function (ids) {
  const inSet = Object.create(null);
  (ids || []).forEach(function (i) { if (i) inSet[i] = true; });
  return (NDX.FOLLOWER_COMBOS || []).filter(function (c) {
    return (c.need || []).every(function (n) { return !!inSet[n]; });
  });
};

// 上阵的证道阶随从 → 羁绊技列表（非上阵不计，仅「随行位」生效）
NDX.activeFollowerBonds = function (s) {
  const ids = (NDX.companionFollowerIds ? NDX.companionFollowerIds(s) : ((s && s.followers) || [])) || [];
  const tiers = (s && s.followerTiers) || {};
  const out = [];
  ids.forEach(function (id) {
    if ((tiers[id] || 'fan') !== 'zhen') return;
    const bond = NDX.FOLLOWER_BONDS[id];
    if (!bond) return;
    out.push({
      id: id, name: (NDX.FOLLOWERS[id] || {}).name || id,
      skill: bond.name, desc: bond.desc,
      atk: bond.atk || 0, matk: bond.matk || 0, hp: bond.hp || 0,
      dr: bond.dr || 0, mdef: bond.mdef || 0,
    });
  });
  return out;
};

// 羁绊技汇总修正（computeStats 消费；无证道上阵 → 全 0，零操作）
NDX.followerBondMods = function (s) {
  const out = { atk: 0, matk: 0, hp: 0, dr: 0, mdef: 0, names: [] };
  NDX.activeFollowerBonds(s).forEach(function (b) {
    out.atk += b.atk || 0; out.matk += b.matk || 0; out.hp += b.hp || 0;
    out.dr += b.dr || 0; out.mdef += b.mdef || 0;
    out.names.push(b.name);
  });
  return out;
};

// ============================================================
// 一·附2 随从主动技层（Action · 2026-09-25 机制层设计 §3 —— 填补「随从只有属性、无主动技」的真空）
//
//   定位：**随从 = 行动补位者**。玩家三键盖不住的缺口（清怪 / 解控 / 驱散 / 持续伤害）
//   由这里补上。与宠物（Field）的判据：宠物**不出手改规则**，随从**周期出手**。
//
//   硬约束（设计文档 §3.3）：**随从主动技的 DPS 贡献 ≤ 玩家普攻的 35%**。
//      ⇒ 反推：系数 / CD ≤ 0.35，故 CD=3 的技系数不得 > 1.05。全表已逐条核对。
//   伤害基准 = 玩家攻击力（随玩家成长自动缩放，不另设成长曲线 ⇒ 不会后期脱节）。
//
//   调度契约：每回合末遍历随行位随从，round % cd === 0 且目标存活 ⇒ 触发；
//   构造的 act 直接走 combat_active.js 的统一结算链路，**不另开伤害通道**（避免第二真源）。
// ============================================================
NDX.FOLLOWER_ACTIVE_SKILLS = {
  huangfeng: { id: 'huangfeng', name: '黄风大圣', skill: '三昧神风', cd: 3, kind: 'debuff',
    desc: '风起而火炽，全体敌减攻 20%，2 回合。', effect: { atkDown: 0.20, rounds: 2, target: 'all' } },
  baigu:     { id: 'baigu', name: '白骨夫人', skill: '白骨化盾', cd: 4, kind: 'shield',
    desc: '骨气凝盾，为玩家罩上 10% 最大生命的护盾。', effect: { pctOfMaxHp: 0.10 } },
  // 🔴 用户点名原话：「随从红孩儿每三回合释放一次三味真火，群伤这种，灼烧两回合」
  honghaier: { id: 'honghaier', name: '红孩儿', skill: '三昧真火', cd: 3, kind: 'aoe',
    desc: '三昧真火焚野：群伤，并灼烧 2 回合。', effect: { coef: 0.55, dot: { pct: 0.15, rounds: 2 } } },
  jinyu:     { id: 'jinyu', name: '灵感大王', skill: '鱼篮普渡', cd: 4, kind: 'heal',
    desc: '水势载舟，治疗玩家 8% 最大生命。', effect: { pctOfMaxHp: 0.08 } },
  xiezi:     { id: 'xiezi', name: '蝎子精', skill: '倒马毒桩', cd: 3, kind: 'strike',
    desc: '毒入骨缝，单体破甲重击并中毒 2 回合。', effect: { coef: 0.90, armorBreak: true, poisonRounds: 2 } },
  liuer:     { id: 'liuer', name: '六耳猕猴', skill: '真假猴身', cd: 4, kind: 'echo',
    desc: '真假难辨，复刻本回合玩家已造成伤害的 40%。', effect: { ratio: 0.40 } },
  niumo:     { id: 'niumo', name: '牛魔王', skill: '大力撼山', cd: 5, kind: 'strike',
    desc: '蛮力归正，单体破甲重击。', effect: { coef: 1.10, armorBreak: true } },
  jiutou:    { id: 'jiutou', name: '九头虫', skill: '九头噬敌', cd: 3, kind: 'multi',
    desc: '九首齐张，3 段连击。', effect: { coef: 0.35, hits: 3 } },
  dapeng:    { id: 'dapeng', name: '大鹏金翅雕', skill: '云程万里', cd: 4, kind: 'debuff',
    desc: '扶摇九万，全体敌易伤（受击增伤 15%），2 回合。', effect: { vuln: 0.15, rounds: 2, target: 'all' } },
  yutu:      { id: 'yutu', name: '玉兔精', skill: '月华捣药', cd: 5, kind: 'strike',
    desc: '广寒药香，清除敌方护盾并造成小伤。', effect: { coef: 0.40, stripShield: true } },
  qingniu:   { id: 'qingniu', name: '青牛精', skill: '金刚琢护主', cd: 5, kind: 'support',
    desc: '金刚不坏，解除玩家异常并减伤 15%（2 回合）。', effect: { cleanse: true, dr: 0.15, rounds: 2 } },
  huangpao:  { id: 'huangpao', name: '黄袍怪', skill: '奎木狼星力', cd: 4, kind: 'buff',
    desc: '星君下凡，玩家下回合暴击率 +15%。', effect: { critUp: 0.15, rounds: 1 } },
  tieshan:   { id: 'tieshan', name: '铁扇公主', skill: '芭蕉扇·风', cd: 4, kind: 'aoe',
    desc: '芭蕉一扇，群伤并推延敌方出手 1 回合。', effect: { coef: 0.50, delay: 1 } }, // 人形态（human）
};

// ⚠ **内核落地边界**（2026-09-25 实测，勿误以为已实装）：
//   本战斗内核是**玩家单侧模拟**结构 —— 全仓搜索无 `mDebuffs`／敌人状态变量，
//   故以下 5 类 kind 目前**下调不到战斗内核**，数据保留但标 needsKernel：
//     debuff   huangfeng 三昧神风 / dapeng 云程万里（要写敌人减攻、易伤 ⇒ 内核缺敌人 debuff 池）
//     support  qingniu 金刚琢护主（要解玩家异常 + 玩家减伤 ⇒ 需玩家侧 debuff 表）
//     echo     liuer 真假猴身（要读「本回合玩家已造成伤害」⇒ 需回合内伤害记账）
//     strike+stripShield yutu 月华捣药（要清除敌护盾 ⇒ 需敌人护盾池）
//   ✅ 已实装（combat_part1.js 主循环）：aoe / strike / multi / heal / shield 五类。
//     用户点名的**红孩儿三味真火（aoe + 灼烧 2 回合）** 属实装范围，已生效。

// 上阵随从 → 主动技列表（非上阵不计；缺表/非证道阶同样不进战斗调度）
NDX.activeFollowerSkills = function (s) {
  const ids = (NDX.companionFollowerIds ? NDX.companionFollowerIds(s) : ((s && s.followers) || [])) || [];
  const tiers = (s && s.followerTiers) || {};
  const out = [];
  ids.forEach(function (id) {
    if (!NDX.FOLLOWER_ACTIVE_SKILLS[id]) return;
    // 主动技随点化阶解锁：本相(1.0)只有基础，显形(1.8)/证道(2.5)逐级强化
    const t = tiers[id] || 'fan';
    const sk = NDX.FOLLOWER_ACTIVE_SKILLS[id];
    out.push({
      id: id, skill: sk.skill, cd: sk.cd, kind: sk.kind, desc: sk.desc,
      tier: t,
      mult: (t === 'zhen' ? 1.5 : (t === 'ling' ? 1.2 : 1.0)), // 阶数放大效果而非仅数值
      enabled: t !== 'fan',
    });
  });
  return out;
};

// ============================================================
// 一·附3 羁绊组合技（风火连天 · 用户点名）
//   牛魔王（火扇）+ 铁扇公主（风扇）同阵 ⇒ 红孩儿三味真火 伤害 ×2、灼烧 3 回合（原 2）
//   一家三口全在阵（牛+铁扇+红孩）⇒ 额外灼烧伤害 +20%
//   若红孩儿不在阵，由铁扇公主代放「风火连天」
// ============================================================
NDX.FOLLOWER_COMBO_FIREWIND = {
  key: 'firewind', name: '风火连天',
  need: ['niumo', 'tieshan'],          // 硬门槛：牛魔王 + 铁扇公主人形态同阵
  boostId: 'honghaier',                 // 被强化的主动技宿主
  dmgMul: 2.0,                          // 伤害 ×2
  dotRounds: 3,                         // 灼烧 3 回合（原 2）
  fullFamilyBonus: { dotPctUp: 0.20 },  // 一家三口全在阵的额外加成
  // 红孩儿不在阵时的代放者
  fallbackId: 'tieshan',
  fallbackSkill: '风火连天',
};

NDX.activeFollowerCombo = function (s, skillId) {
  const ids = (NDX.companionFollowerIds ? NDX.companionFollowerIds(s) : ((s && s.followers) || [])) || [];
  const inSet = {};
  ids.forEach(function (i) { inSet[i] = true; });
  if (skillId && !inSet[skillId]) return null;
  const C = NDX.FOLLOWER_COMBO_FIREWIND;
  if (!(C.need.every(function (n) { return inSet[n]; }))) return null;
  const hasBoy = !!inSet[C.boostId];
  return {
    key: C.key, name: C.name, active: true,
    boostedSkill: hasBoy ? C.boostId : C.fallbackId,
    boostedName: hasBoy ? (NDX.FOLLOWER_ACTIVE_SKILLS[C.boostId] || {}).skill : C.fallbackSkill,
    dmgMul: C.dmgMul, dotRounds: C.dotRounds,
    dotPctUp: inSet[C.boostId] ? (C.fullFamilyBonus.dotPctUp || 0) : 0,
    family: hasBoy,
  };
};

// ============================================================
// 二、点化机缘（v2.0 核心 · 每个妖王的两条「路」）
//      conds 为「多取一」：任一条达成 ⇒ 该妖王可走**机缘**升阶（不消耗任何随从）。
//      条件类型（全部可确定性判定，无随机）：
//        { type:'item', id|name }  持有/装配该法宝（读 s.equips）
//        { type:'seal', id }       拥有该劫印（读 s.seals）
//        { type:'good', n }        本局累计善 ≥ n
//        { type:'evil', n }        本局累计恶 ≥ n
//        { type:'with', id }       该随从在册（羁绊组合，如「红孩儿 + 牛魔王」）
//        { type:'act',  min }      当前地区 s.act ≥ min（须在该地完成点化）
// ============================================================
NDX.FOLLOWER_RITUALS = {
  huangfeng: { // 黄风大圣 · 三昧神风
    toLing: { text: '以「定风珠」镇其三昧神风',
      conds: [ { type: 'item', name: '定风珠', id: 'dingfeng' } ] },
    toZhen: { text: '既已镇风，再以降伏之威立誓',
      conds: [ { type: 'evil', n: 25 }, { type: 'act', min: 2 } ] },
  },
  baigu: { // 白骨夫人 · 尸魔
    toLing: { text: '持「照妖镜」照出骷髅本相，逼其自惭',
      conds: [ { type: 'item', name: '照妖镜', id: 'zhaoyao' } ] },
    toZhen: { text: '唐僧亲手超度，愿力洗骨',
      conds: [ { type: 'good', n: 40 } ] },
  },
  honghaier: { // 红孩儿 · 圣婴大王
    toLing: { text: '父子缘聚：与「牛魔王」同列（机缘来自羁绊）',
      conds: [ { type: 'with', id: 'niumo' } ] },
    toZhen: { text: '火气未消，以杀伐立誓',
      conds: [ { type: 'evil', n: 45 } ] },
  },
  jinyu: { // 灵感大王 · 金鱼精
    toLing: { text: '放生积德，金鱼回头',
      conds: [ { type: 'good', n: 30 } ] },
    toZhen: { text: '照出鱼篮本相',
      conds: [ { type: 'item', name: '照妖镜', id: 'zhaoyao' } ] },
  },
  xiezi: { // 蝎子精 · 倒马毒桩
    toLing: { text: '以毒攻毒，性与汝同',
      conds: [ { type: 'evil', n: 30 } ] },
    toZhen: { text: '毒敌山旧识照面',
      conds: [ { type: 'with', id: 'yutu' } ] },
  },
  liuer: { // 六耳猕猴 · 真假猴王
    toLing: { text: '照妖镜前一照，真假立辨',
      conds: [ { type: 'item', name: '照妖镜', id: 'zhaoyao' } ] },
    toZhen: { text: '如来自辩，明心见性',
      conds: [ { type: 'good', n: 60 } ] },
  },
  niumo: { // 牛魔王 · 大力王
    toLing: { text: '持「芭蕉扇」扇开火焰山之困',
      conds: [ { type: 'item', name: '芭蕉扇', id: 'baojiao' } ] },
    toZhen: { text: '父子同列：与「红孩儿」同行',
      conds: [ { type: 'with', id: 'honghaier' } ] },
  },
  jiutou: { // 九头虫 · 碧波潭
    toLing: { text: '夺宝之手已染，妖气自显',
      conds: [ { type: 'evil', n: 40 } ] },
    toZhen: { text: '老君法器临之，无用武之地',
      conds: [ { type: 'item', name: '金刚琢', id: 'bf_jingangzhuo' } ] },
  },
  dapeng: { // 大鹏金翅雕 · 狮驼岭
    toLing: { text: '狮驼三魔啸聚，与「青牛精」同势',
      conds: [ { type: 'with', id: 'qingniu' } ] },
    toZhen: { text: '吞天之愿，唯杀证道',
      conds: [ { type: 'evil', n: 60 } ] },
  },
  yutu: { // 玉兔精 · 天竺假公主
    toLing: { text: '不启杀念，捣药月华',
      conds: [ { type: 'good', n: 30 } ] },
    toZhen: { text: '天庭法器压之，妖心自伏',
      conds: [ { type: 'item', name: '金刚琢', id: 'bf_jingangzhuo' } ] },
  },
  qingniu: { // 青牛精 · 独角兕
    toLing: { text: '持「金刚琢」或「芭蕉扇」，套尽其力',
      conds: [ { type: 'item', name: '金刚琢', id: 'bf_jingangzhuo' },
               { type: 'item', name: '芭蕉扇', id: 'baojiao' } ] },
    toZhen: { text: '牛兄在前：与「牛魔王」同行',
      conds: [ { type: 'with', id: 'niumo' } ] },
  },
  huangpao: { // 黄袍怪 · 奎木狼
    toLing: { text: '照妖镜照出二十八宿本相',
      conds: [ { type: 'item', name: '照妖镜', id: 'zhaoyao' } ] },
    toZhen: { text: '夫妻之义，塔下重逢',
      conds: [ { type: 'good', n: 40 } ] },
  },
  // v1.4 补登（存量红）：铁扇公主是第 13 位随从，机缘表此前只覆盖 12 妖王。
  //   她的机缘**不靠杀伐**，靠「一家三口同列」与「以扇灭火」——
  //   与 `FOLLOWER_COMBOS.firewind`（风火连天）同源，是她的叙事身份。
  tieshan: { // 铁扇公主 · 罗刹女
    toLing: { text: '一家三口同列：牛魔王与红孩儿俱在',
      conds: [ { type: 'with', id: 'niumo' }, { type: 'with', id: 'honghaier' } ] },
    toZhen: { text: '以扇熄火焰山，立誓护行',
      conds: [ { type: 'good', n: 45 }, { type: 'act', min: 5 } ] },
  },
  // 🩸 X7 分容器同步（2026-09-27 · 用户拍板「人形态归随从」）：4 位人形随从的机缘。
  //   ⚠ 口径：这批是「正果系」，机缘**不靠杀伐**，走 `good`/`act`；
  //     **刻意不写 `item`** —— `_verify_follower_fuse` 有一条「机缘引用的法宝必须真实存在，
  //     否则该路永远空转」的防死条件断言，引用未登记 id 会造出新的死条件。
  kouqi_ren: { // 寇妻 · 铜台府斋饭济众
    toLing: { text: '广行斋饭，愿力及于铜台',
      conds: [ { type: 'good', n: 25 } ] },
    toZhen: { text: '一饭之恩，终成正果',
      conds: [ { type: 'good', n: 55 }, { type: 'act', min: 6 } ] },
  },
  jieyin_ren: { // 接引佛祖 · 灵山
    toLing: { text: '灵山近畿，广度有缘',
      conds: [ { type: 'good', n: 40 } ] },
    toZhen: { text: '真经归位，共登彼岸',
      conds: [ { type: 'good', n: 70 } ] },
  },
  anuo_ren: { // 阿傩迦叶 · 灵山二尊者
    toLing: { text: '传经授业，字字无稍错',
      conds: [ { type: 'good', n: 45 } ] },
    toZhen: { text: '无字真经处，转授众生',
      conds: [ { type: 'good', n: 80 }, { type: 'act', min: 8 } ] },
  },
  chechi_sanyao_ren: { // 车迟三仙 · 虎鹿羊
    toLing: { text: '许以取经正果，三妖顿悟',
      conds: [ { type: 'good', n: 30 } ] },
    toZhen: { text: '斗法之心尽化，道法自成',
      conds: [ { type: 'good', n: 60 } ] },
  },
};

// 未登记机缘的随从（如将来新增）——走**纯渡引**，不静默吞条件
NDX.FOLLOWER_RITUAL_DEFAULT = null;

// ============================================================
// 三、阶数读取（唯一读口）
// ============================================================
NDX.followerTierOf = function (s, id) {
  const t = (s && s.followerTiers && id && s.followerTiers[id]) || 'fan';
  return NDX.FOLLOWER_TIERS[t] ? t : 'fan';
};
NDX.followerTierInfo = function (s, id) { return NDX.FOLLOWER_TIERS[NDX.followerTierOf(s, id)]; };
// 属性倍率（供 followerBonus 使用；s 可为存档，也可为 computeStats 的 bonus 对象）
NDX.followerMultOf = function (s, id) { return NDX.followerTierInfo(s, id).mult; };

// 三阶统计（UI/简报用；按 FOLLOWER_TIER_ORDER 生成，勿硬编码阶名）
NDX.followerTierSummary = function (s) {
  const out = {};
  NDX.FOLLOWER_TIER_ORDER.forEach(function (k) { out[k] = 0; });
  out.total = 0;
  ((s && s.followers) || []).forEach(function (id) {
    const t = NDX.followerTierOf(s, id);
    if (out[t] == null) out[t] = 0;
    out[t]++;
    out.total++;
  });
  return out;
};

// ============================================================
// 四、机缘判定（单一真源）
//   followerRitualOf(s, id) →
//     { ready, met:[text], unmet:[text], toLing:{...}|null, toZhen:{...}|null }
//   ready = 当前阶可走机缘（toLing / toZhen 中任一达成）
// ============================================================
NDX._followerCondMet = function (s, c) {
  const S = s || {};
  switch (c.type) {
    case 'item': {
      const list = (S.equips) || [];
      return list.some(function (e) {
        if (!e) return false;
        if (c.id) return e.id === c.id || e.treasureId === c.id || (e.key && e.key === c.id);
        return !!e.name && e.name === c.name;
      });
    }
    case 'seal': {
      const list = (S.seals) || [];
      return list.some(function (k) { return (typeof k === 'string' ? k : (k && k.id)) === c.id; });
    }
    case 'good':  return ((S.good || 0) >= c.n);
    case 'evil':  return ((S.evil || 0) >= c.n);
    case 'with':  return ((S.followers || []).indexOf(c.id) >= 0);
    case 'act':   return ((S.act || 0) >= c.min);
    default:      return false;
  }
};

// 某一阶的机缘状态：{ ok, met:[], unmet:[] }
NDX._followerRitualStep = function (s, id, step) {
  const out = { ok: false, met: [], unmet: [] };
  if (!step || !step.conds || !step.conds.length) return out;
  step.conds.forEach(function (c) {
    (NDX._followerCondMet(s, c) ? out.met : out.unmet).push(step.text);
  });
  out.ok = out.met.length > 0;
  return out;
};

NDX.followerRitualOf = function (s, id) {
  const tbl = NDX.FOLLOWER_RITUALS || {};
  const r = tbl[id] || NDX.FOLLOWER_RITUAL_DEFAULT;
  const from = NDX.followerTierOf(s, id);
  const toLing = from === 'fan'  ? NDX._followerRitualStep(s, id, r && r.toLing) : null;
  const toZhen = from === 'ling' ? NDX._followerRitualStep(s, id, r && r.toZhen) : null;
  return {
    hasRitual: !!r,
    from: from,
    ready: !!(toLing && toLing.ok) || !!(toZhen && toZhen.ok),
    toLing: toLing, toZhen: toZhen,
    toLingText: (r && r.toLing && r.toLing.text) || '',
    toZhenText: (r && r.toZhen && r.toZhen.text) || '',
  };
};

// ============================================================
// 五、可行晋升枚举（UI 直接消费）
//   每条方案带 channel：`ritual`（机缘·不消耗） / `guide`（渡引·消耗 1 名同阶）
//   返回顺序：机缘优先（玩家可预期的首选路径）
// ============================================================
NDX.followerFuseOptions = function (s) {
  const list = ((s && s.followers) || []);
  const out = [];
  const F = NDX.FOLLOWER_TIERS;

  // —— ① 机缘：原地升阶，不消耗任何随从 ——
  list.forEach(function (id) {
    const r = NDX.followerRitualOf(s, id);
    if (!r.ready) return;
    const isZhen = r.toLing && !r.toLing.ok && r.toZhen && r.toZhen.ok;
    const toKey = (isZhen || (r.from === 'ling')) ? 'zhen' : 'ling';
    const to = F[toKey];
    out.push({
      channel: 'ritual', recipeId: 'to_' + toKey, from: r.from, to: toKey, need: 1,
      mainId: id, mainName: (NDX.FOLLOWERS[id] || {}).name || id,
      feedIds: [], feedNames: [],
      toName: to.name, toMult: to.mult,
      reason: isZhen ? (r.toZhenText || '') : (r.toLingText || ''),
    });
  });

  // —— ② 渡引：献上 1 名同阶随从（保底出口，永不成死局）——
  NDX.FOLLOWER_TIER_ORDER.forEach(function (from) {
    if (from === 'zhen') return;
    const to = F[NDX.FOLLOWER_TIER_ORDER[NDX.FOLLOWER_TIER_ORDER.indexOf(from) + 1]];
    if (!to) return;
    const pool = list.filter(function (id) { return NDX.followerTierOf(s, id) === from; });
    if (pool.length < 2) return;
    let onStage = [];
    try { onStage = (NDX.companionFollowerIds ? NDX.companionFollowerIds(s) : []) || []; } catch (e) { onStage = []; }
    pool.slice().sort(function (a, b) {
      const ia = onStage.indexOf(a) >= 0 ? 0 : 1, ib = onStage.indexOf(b) >= 0 ? 0 : 1;
      return ia - ib;
    }).forEach(function (mainId) {
      const others = pool.filter(function (x) { return x !== mainId; });
      // 饲料优先取「待命」者；若已无待命（随行位全满），仍给出方案并标记 consumesOnStage，
      //   由 fuseFollowers 原子摘除阵容引用 —— 否则「4 位全满」时渡引永远无出口。
      const feeds = others.filter(function (x) { return onStage.indexOf(x) < 0; });
      const fallback = feeds.length ? feeds : others;
      if (!fallback.length) return;
      const feeds2 = fallback.slice(0, 1);
      out.push({
        channel: 'guide', recipeId: 'to_' + to.key, from: from, to: to.key, need: 2,
        mainId: mainId, mainName: (NDX.FOLLOWERS[mainId] || {}).name || mainId,
        feedIds: feeds2,
        feedNames: feeds2.map(function (x) { return (NDX.FOLLOWERS[x] || {}).name || x; }),
        consumesOnStage: feeds.length === 0,
        toName: to.name, toMult: to.mult,
        reason: '以「' + feeds2.map(function (x) { return (NDX.FOLLOWERS[x] || {}).name || x; }).join('、') + '」为引，渡其升「' + to.name + '」',
      });
    });
  });
  return out;
};

// ============================================================
// 六、执行晋升（唯一写口）
//   channel 由 call.feedIds 决定：
//     · 空数组  → **机缘**：仅升阶，不移除任何人（校验条件仍生效）
//     · 非空    → **渡引**：消耗 feedIds 中的同阶随从
//   成功 → { ok:true, id, from, to, toName, mult, channel }
//   失败 → { ok:false, reason }（不抛异常，UI 可直接展示 reason）
// ============================================================
NDX.fuseFollowers = function (s, mainId, feedIds) {
  if (!s || !mainId) return { ok: false, reason: '无点化主体' };
  const list = (s.followers || []).slice();
  if (list.indexOf(mainId) < 0) return { ok: false, reason: '主体不在随从册' };
  const from = NDX.followerTierOf(s, mainId);
  const rec = NDX.followerRitualOf(s, mainId);
  const feeds = (feedIds || []).filter(function (id) { return id && id !== mainId; });

  let channel = 'guide';
  if (!feeds.length) {
    channel = 'ritual';
    if (!rec.ready) return { ok: false, reason: '机缘未至：' + (rec.toLingText || rec.toZhenText || '尚无点化条件') };
  }

  let toKey;
  if (channel === 'ritual') {
    toKey = (rec.from === 'ling') ? 'zhen' : 'ling';
  } else {
    const order = NDX.FOLLOWER_TIER_ORDER;
    toKey = order[order.indexOf(from) + 1];
    if (NDX.followerTierOf(s, feeds[0]) !== from) return { ok: false, reason: '为引者须与主体同阶' };
    if (list.indexOf(feeds[0]) < 0) return { ok: false, reason: '为引者不在随从册' };
  }
  const to = NDX.FOLLOWER_TIERS[toKey];
  if (!to) return { ok: false, reason: '已至「证道」，无可再升' };

  // —— 落账 ——
  if (channel === 'guide') {
    s.followers = list.filter(function (id) { return feeds.indexOf(id) < 0; });
    if (Array.isArray(s.companionLineup)) {
      s.companionLineup = s.companionLineup.filter(function (k) {
        return feeds.indexOf(String(k).replace(/^f:/, '')) < 0;
      });
    }
  }
  if (!s.followerTiers) s.followerTiers = {};
  s.followerTiers[mainId] = toKey;
  return { ok: true, id: mainId, from: from, to: toKey, channel: channel,
    toName: to.name, mult: to.mult, recipe: 'to_' + toKey,
    name: (NDX.FOLLOWERS[mainId] || {}).name || mainId };
};

// ============================================================
// 七、驯兽师平行成长线（summon 流派 · 用户原话「不同于六道的变种」）
//   御兽之力 = Σ 上阵随从的阶数倍率（本相1.0 / 显形1.8 / 证道2.5）
//   → 英雄 atk/matk/hp 百分比提升（SUMMONER_PER_POINT，封顶 SUMMONER_CAP）
//   非 summon 路线返回 null（零操作，绝不干扰其他流派与存量存档）。
// ============================================================
NDX.FOLLOWER_FUSE = {
  // 驯兽师平行线：每点「御兽之力」给英雄的加成
  //   御兽之力 = Σ 上阵随从阶数倍率；随行位上限 4（`SLOT_CAP.companion`，与徒弟共用）
  //   ⇒ 理论极值 = 4 只「证道」= 4 × 2.5 = 10 点（pct = 10 × 2% = 20%）
  SUMMONER_PER_POINT: 0.02,   // +2% / 点
  SUMMONER_CAP: 0.20,         // 封顶 +20%（＝ 4 只证道满配）
};

NDX.isSummonerRoute = function (s) {
  const st = s || {};
  const job = NDX.currentJob ? NDX.currentJob(st) : ((st.flags && st.flags.jobConfirm) || st.jobConfirm || null);
  if (job && NDX.PET_SUMMONER_JOBS && NDX.PET_SUMMONER_JOBS.indexOf(job) >= 0) return true;
  try {
    if (NDX.currentStyle && NDX.currentStyle(st) === 'summon') return true;
    if (NDX.JOB_STYLE && job && NDX.JOB_STYLE[job] === 'summon') return true;
  } catch (e) { /* noop */ }
  return false;
};
// 御兽之力点数（0 表示未上阵/非驯兽师）
NDX.summonerPower = function (s) {
  if (!NDX.isSummonerRoute(s)) return 0;
  let p = 0;
  try {
    const on = (NDX.companionFollowerIds ? NDX.companionFollowerIds(s) : (s && s.followers) || []) || [];
    on.forEach(function (id) { p += NDX.followerMultOf(s, id); });
  } catch (e) { p = 0; }
  return Math.round(p * 100) / 100;
};
// 驯兽师加成快照（供 computeStats 的 bonus 直接消费；非驯兽师 → null）
NDX.summonerFollowerBonus = function (s) {
  const p = NDX.summonerPower(s);
  if (!p) return null;
  const pct = Math.min(NDX.FOLLOWER_FUSE.SUMMONER_CAP || 0.30, p * (NDX.FOLLOWER_FUSE.SUMMONER_PER_POINT || 0.02));
  return { power: p, pct: Math.round(pct * 1000) / 1000 };
};

// ============================================================
// 八、computeStats 的 bonus 片段（单一来源）
//   三处调用点（game_meta.js / game_event_2.js / attr_calc.js）统一展开本片段，
//   避免「有的地方带阶数、有的地方不带」的口径漂移。
//   展开后可覆盖既有写法：`{ ...ctx, seals: s.seals, ... }`。
// ============================================================
NDX.followerBonusCtx = function (s) {
  return {
    followers: (NDX.companionFollowerIds ? NDX.companionFollowerIds(s) : ((s && s.followers) || [])),
    followerTiers: (s && s.followerTiers) || null,
    summonerBonus: (NDX.summonerFollowerBonus ? NDX.summonerFollowerBonus(s) : null),
    // A2-2 证道阶羁绊技：computeStats 消费（无羁绊 → 全 0，行为逐字节不变）
    followerBonds: (NDX.activeFollowerBonds ? NDX.activeFollowerBonds(s) : null),
  };
};

// 随从册简报（面板一句话：本局随从家底）
NDX.followerFuseBrief = function (s) {
  const sum = NDX.followerTierSummary(s);
  if (!sum.total) return '尚无随从在册——逆道谈判可收服妖王。';
  const parts = ['本相 ' + sum.fan];
  if (sum.ling) parts.push('显形 ' + sum.ling);
  if (sum.zhen) parts.push('证道 ' + sum.zhen);
  let txt = '随从 ' + sum.total + ' 名（' + parts.join(' · ') + '）';
  const opts = NDX.followerFuseOptions(s);
  const ritual = opts.filter(function (o) { return o.channel === 'ritual'; }).length;
  txt += opts.length ? '　可点化 ' + opts.length + ' 项' + (ritual ? '（其中机缘 ' + ritual + '）' : '') : '　（暂无机缘、无可渡引）';
  if (NDX.isSummonerRoute(s)) {
    const b = NDX.summonerFollowerBonus(s);
    if (b) txt += '　｜ 御兽之力 ' + b.power + ' → 全属性 +' + Math.round(b.pct * 100) + '%';
  }
  return txt;
};
