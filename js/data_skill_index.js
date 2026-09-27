// =============================================================
// data_skill_index.js — 《逆道西行》技能总表（三层收口 · V9.55 / A3 技能）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
//
// 🔴 V9.55 地位变更（用户拍板 Q4「所有数据汇聚到数据总表统一调配」）：
//   本表由「只登记 + 分类」升级为**三层收口**：
//     层一 元信息  SKILL_CLASSES / skillIndex（图鉴用）
//     层二 数值真源 STATUS_DEFS / TREASURE_STATUS / ATK_VARIANTS / CHANT_VARIANTS /
//           ULT_STYLE_MOD / JOB_STYLE / JOB_STYLE_VARIANT —— 全部从 data_skill_variant.js 迁入
//           ⚠ 数值**只在此处定义**，data_skill_variant.js 降级为执行器（只落地、不再持有数值）。
//     层三 顺序真源 SKILL_ORDER + SKILL_LAYERS + resolveSkillAct —— 三键变体的唯一调配出口。
//
// 之所以要层三：此前三键的执行顺序**只存在于 combat_active.js 的语句序列里**，没有任何地方
//   声明「谁先谁后」。「同一变体应用两次」（V9.54 攻键 / 绝招）能藏这么久，正是因为顺序不可见、
//   不可校验。现在顺序是数据，改顺序只改 SKILL_ORDER 一行。
//
// 分类（骨架 v1.0 §3.1）：
//   A 普攻变种   ← NDX.ATK_VARIANTS（层二）
//   B 诵经变种   ← NDX.CHANT_VARIANTS
//   C 大招变体   ← NDX.ULT_STYLE_MOD × NDX.JOB_STYLE（由转职/流派单向驱动，不做 45×10 全展开）
//   D 战斗干预   ← 识破 / 气势爆发（combat_skills.js）
//   V 流派变种   ← NDX.JOB_STYLE_VARIANT（⚠ V9.55 新增：隐藏职流派 → 攻/诵经变种的表现层映射）
//
// 收口规则（新增，骨架 §3.1）：
//   外围文件（skill_* 七件套）只允许**读**总表，**禁止持有倍率常量**。
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// 层一 · 元信息
// ============================================================
NDX.SKILL_CLASSES = {
  A: { key: 'A', name: '普攻变种', src: 'NDX.ATK_VARIANTS',  desc: '攻键的出手变体（多重攻击 / 群伤 / buff / debuff）' },
  B: { key: 'B', name: '诵经变种', src: 'NDX.CHANT_VARIANTS', desc: '诵经键的出手变体（本命诵经分镜）' },
  C: { key: 'C', name: '大招变体', src: 'NDX.ULT_STYLE_MOD × NDX.JOB_STYLE', desc: '绝招随隐藏职业流派变更（转职单向驱动）' },
  D: { key: 'D', name: '战斗干预', src: 'combat_skills.js',   desc: '识破（反制蓄力重击）/ 气势爆发' },
  V: { key: 'V', name: '流派变种', src: 'NDX.JOB_STYLE_VARIANT → ATK/CHANT_VARIANTS', desc: '隐藏职流派在三键上的表现层（转职即换打法形态）' },
};

// ============================================================
// 层二 · 数值真源 ① 状态字典（buff / debuff）
//   side: 'enemy'=施加于怪物｜'self'=施加于自身
//   dot      ：持续伤害（每回合 dmgPct × 施术者攻击）
//   noAct    ：跳过本回合行动（眩晕）
//   atkMul   ：怪物攻击乘数
//   evaDown  ：怪物闪避降低
//   defDown  ：怪物防御降低（破甲）
// ============================================================
NDX.STATUS_DEFS = {
  // —— 对敌 debuff ——
  stun:    { name: '眩晕',   side: 'enemy', desc: '本回合无法行动',                 noAct: true },
  poison:  { name: '中毒',   side: 'enemy', desc: '每回合流失气血，且受疗降低',     dot: { pct: 0.12, rounds: 3 }, healDown: 0.30 },
  burn:    { name: '灼烧',   side: 'enemy', desc: '每回合灼烧真伤',                 dot: { pct: 0.15, rounds: 3 }, trueDmg: true },
  sunder:  { name: '破甲',   side: 'enemy', desc: '防御下降，所受伤害提高',         defDown: 0.30, rounds: 3 },
  slow:    { name: '迟滞',   side: 'enemy', desc: '闪避下降，更易被命中',           evaDown: 0.20, rounds: 3 },
  weaken:  { name: '虚弱',   side: 'enemy', desc: '攻击下降',                       atkMul: 0.75, rounds: 3 },
  silence: { name: '封技',   side: 'enemy', desc: '无法释放技能（仅普攻）',         noSkill: true, rounds: 2 },
  // —— 对己 buff ——
  might:   { name: '金刚怒', side: 'self',  desc: '攻击提高',                       atkUp: 0.25, rounds: 3 },
  ward:    { name: '护体',   side: 'self',  desc: '减伤提高',                       drUp: 0.15, rounds: 3 },
  haste:   { name: '疾行',   side: 'self',  desc: '闪避提高',                       evaUp: 0.15, rounds: 3 },
  regen:   { name: '回春',   side: 'self',  desc: '每回合回复气血',                 regen: 0.05, rounds: 3 },
};

// 层二 · 数值真源 ② 法宝 → 状态联动
//   key = 至宝 id（含道向进化形态），chance = 命中后触发概率，status = 施加状态
//   金刚琢＝套尽神兵 → 眩晕；倒马毒桩＝毒；三昧真火/芭蕉扇＝灼烧；金铙＝封技；金铃＝虚弱
NDX.TREASURE_STATUS = {
  tre_jingangzhuo:      { chance: 0.25, status: 'stun',    tip: '金刚琢套落，妖敌一滞' },
  tre_jingangzhuo_du:   { chance: 0.22, status: 'stun',    tip: '金刚琢·还器：套而不伤' },
  tre_jingangzhuo_ni:   { chance: 0.30, status: 'stun',    tip: '金刚琢·反套：套尽天兵之势' },
  tre_daomadu:          { chance: 0.30, status: 'poison',  tip: '倒马毒桩见血封喉' },
  tre_daomadu_du:       { chance: 0.26, status: 'poison',  tip: '倒马毒·止痛：毒而不烈' },
  tre_daomadu_ni:       { chance: 0.34, status: 'poison',  tip: '倒马毒·弑佛：毒入骨髓' },
  tre_sanmei:           { chance: 0.30, status: 'burn',    tip: '三昧真火焚身' },
  tre_sanmei_du:        { chance: 0.26, status: 'burn',    tip: '三昧·心灯：焚而不灭' },
  tre_sanmei_ni:        { chance: 0.34, status: 'burn',    tip: '三昧·逆火：焚尽功德' },
  tre_bajiaoshan:       { chance: 0.24, status: 'burn',    tip: '芭蕉扇风助火势' },
  tre_bajiaoshan_duo:   { chance: 0.28, status: 'burn',    tip: '芭蕉扇·扇天：风火燎原' },
  tre_jinnao:           { chance: 0.22, status: 'silence', tip: '金铙合拢，法术难施' },
  tre_jinnao_ni:        { chance: 0.28, status: 'silence', tip: '金铙·困佛：佛法亦封' },
  tre_jinling:          { chance: 0.28, status: 'weaken',  tip: '金铃撼神，妖力衰减' },
  tre_jinling_duo:      { chance: 0.32, status: 'weaken',  tip: '金铃·三灾：三灾齐至' },
  tre_hulu:             { chance: 0.25, status: 'slow',    tip: '葫芦应名，迟滞难行' },
  tre_hulu_zhan:        { chance: 0.28, status: 'slow',    tip: '葫芦·装兵：重装迟滞' },
  tre_jingu:            { chance: 0.22, status: 'sunder',  tip: '紧箍束骨，护甲崩解' },
  tre_jingu_ni:         { chance: 0.28, status: 'sunder',  tip: '紧箍·碎：甲胄俱碎' },
};

// 层二 · 数值真源 ③ 普攻变种（攻击键）
//   ⚠ V9.55 参数化：原 `apply(act)` 函数已剔除，改为声明式 fx 数组（执行器见
//     data_skill_variant.js 的 applyActVariant）。参数化是为了「数值可被总表统一调配」
//     —— 改一个数不用碰执行逻辑。
//   fx op 语义（执行器逐条落地）：
//     dmgScale      按当前 dmg 折算后写回
//     trueDmgPct    按 dmg 折算并累加到真伤   trueDmgAddPct 同上但不保底 1
//     healPct/shieldPct 按 dmg 折算增益       setDmg/setHeal/setTrueDmg 直接写值
//     shieldOfDmg   按「本次变体开始时的 dmg 基值」折算护盾（sac-shield 需先归零后取基值）
//     critHit/critDmgAdd/armorBreak/ignoreDef/noDamage   标记与加成
//     hits/spread/aoe/dr                     多段 / 溅射 / 群伤 / 减伤
//     guardCounter/counterPct/counterLifesteal/counterRounds  反击链
//     sBuff{状态:回合} / cleanse              自身增益 / 清异常
// ============================================================
NDX.ATK_VARIANTS = {
  plain: {
    name: '直击', desc: '无变体，本命攻式原样',
    fx: [],
  },
  'sac-shield': {
    name: '舍攻为盾', desc: '放弃本次物理攻击，转为自身护盾（全英雄适用）',
    fx: [
      { op: 'setDmg', v: 0 }, { op: 'noDamage', v: true },
      { op: 'shieldOfDmg', v: 0.9 },
      { op: 'setTrueDmg', v: 0 }, { op: 'setHeal', v: 0 },
    ],
  },
  drain: {
    name: '噬血', desc: '普攻吸血 22%',
    fx: [{ op: 'healPct', v: 0.22 }, { op: 'note', v: '噬血' }],
  },
  combo: {
    name: '连环', desc: '概率追加一段伤害',
    fx: [{ op: 'hits', v: 2 }, { op: 'spread', v: 0.35 }, { op: 'note', v: '连环' }],
  },
  crit: {
    name: '战意', desc: '必胜暴击 + 暴伤 +50%',
    fx: [{ op: 'critHit', v: true }, { op: 'critDmgAdd', v: 0.5 }, { op: 'note', v: '战意' }],
  },
  sunder: {
    name: '破相', desc: '附加 25% 无视防御真伤 + 破甲',
    fx: [{ op: 'trueDmgPct', v: 0.25 }, { op: 'armorBreak', v: true }, { op: 'note', v: '破相' }],
  },
  guard: {
    name: '御守', desc: '攻守兼备：本次伤害 -20%，换取本回合减伤 25%',
    fx: [{ op: 'dmgScale', v: 0.8 }, { op: 'dr', v: 0.25 }, { op: 'note', v: '御守（本回合减伤25%）' }],
  },
  multi: {
    // 🔴 V9.55 接线时发现**旧变种表第二个错误**（第一个是「同一变体应用两次」）。
    //   战斗侧口径（combat_active.js:366）：`(act.spread && act.hits > 1)` ⇒ hits 段**分摊**到
    //   连续回合落地，perHit = (dmg + trueDmg) / hits —— 即 dmg 是**总量**、不是「每段」。
    //   旧数据却写成 dmg×0.42 + hits3，等于「把总伤砍到 42% 再分 3 回合」= **净削弱 58%**，
    //   而 desc 还写着「总伤 ×1.15」——写的与算的完全是两回事（变种表从未接线，故一直没暴露）。
    //   修正：按 desc 的真实语义落地 = dmg 是总量 ⇒ 直接 ×1.15，再拆 3 击跨回合连落。
    name: '多重攻击', desc: '三段连击（总伤 ×1.15，跨回合连续落下）',
    fx: [{ op: 'dmgScale', v: 1.15 }, { op: 'hits', v: 3 }, { op: 'spread', v: 0.20 }, { op: 'note', v: '多重攻击' }],
  },
  aoe: {
    name: '群伤', desc: '主目标全额，其余目标 60% 溅射',
    fx: [{ op: 'aoe', v: 0.6 }, { op: 'note', v: '群伤' }],
  },
  counter: {
    name: '反击', desc: '防御反击流：受击后回打一击（按承伤 60%）并吸血 30%',
    fx: [{ op: 'guardCounter', v: true }, { op: 'counterPct', v: 0.6 }, { op: 'counterLifesteal', v: 0.30 }, { op: 'note', v: '反击' }],
  },
  // ⚠ 2026-09-27 · S02 O2 消撞车：以下 3 个攻键变种专供 burn / reverse / summon 流派，
  //    使 10 流派攻形态互异（原 ward/burn 同 sunder、evade/summon 同 multi、crit/reverse 同 crit）。
  //    全部复用既有 25 op，不新造执行器分支。
  firerain: {
    name: '业火', desc: '烈焰横扫：附加 18% 真伤并溅射 50% 于余敌',
    fx: [{ op: 'trueDmgPct', v: 0.18 }, { op: 'aoe', v: 0.5 }, { op: 'note', v: '业火' }],
  },
  bloodrite: {
    name: '血祭', desc: '以战养战：总伤 ×1.3 并吸血 30%',
    fx: [{ op: 'dmgScale', v: 1.3 }, { op: 'healPct', v: 0.3 }, { op: 'note', v: '血祭' }],
  },
  conjure: {
    name: '协同齐击', desc: '灵兽协同：两段连击 + 40% 群伤溅射',
    fx: [{ op: 'hits', v: 2 }, { op: 'spread', v: 0.3 }, { op: 'aoe', v: 0.4 }, { op: 'note', v: '协同齐击' }],
  },
};

// 层二 · 数值真源 ④ 诵经变种（诵经键）——含治疗 / 净化 / buff / 反伤 / 群伤
//   act.sBuff：给自身挂增益（rounds 回合）
//   act.cleanse：清除自身全部异常（针对不用法宝打 Boss 的续航手段）
NDX.CHANT_VARIANTS = {
  plain:  { name: '诵经', desc: '无变体，本命诵经原样', fx: [] },
  heal:   { name: '回春诵', desc: '诵经回血 50%',
    fx: [{ op: 'healPct', v: 0.5 }, { op: 'note', v: '回春' }] },
  cleanse:{ name: '净秽诵', desc: '回血 35% 并清除自身全部异常状态',
    fx: [{ op: 'healPct', v: 0.35 }, { op: 'cleanse', v: true }, { op: 'note', v: '净秽' }] },
  ward:   { name: '凝护诵', desc: '护盾 35% + 20% 穿刺真伤',
    fx: [{ op: 'shieldPct', v: 0.35 }, { op: 'trueDmgPct', v: 0.2 }, { op: 'note', v: '凝护' }] },
  reflect:{ name: '业报诵', desc: '本回合受击回打（承伤 60%）并吸血 25%',
    fx: [{ op: 'guardCounter', v: true }, { op: 'counterPct', v: 0.6 }, { op: 'counterLifesteal', v: 0.25 }, { op: 'counterRounds', v: 2 }, { op: 'note', v: '业报' }] },
  pierce: { name: '梵音诵', desc: '无视防御真伤 25%',
    fx: [{ op: 'trueDmgPct', v: 0.25 }, { op: 'ignoreDef', v: true }, { op: 'note', v: '梵音' }] },
  aegis: {
    name: '金刚诵', desc: '减伤诵：自身获得「护体」减伤（3 回合）+ 少量护盾',
    fx: [{ op: 'sBuff', v: { ward: 3 } }, { op: 'shieldPct', v: 0.2 }, { op: 'dr', v: 0.15 }, { op: 'note', v: '金刚（减伤）' }],
  },
  buff:   { name: '增益诵', desc: '自身获得金刚怒 + 护体（3 回合）',
    fx: [{ op: 'sBuff', v: { might: 3, ward: 3 } }, { op: 'note', v: '增益' }] },
  aoe:    { name: '普照诵', desc: '群伤：其余目标 50% 溅射 + 附加最大生命真伤',
    fx: [{ op: 'aoe', v: 0.5 }, { op: 'trueDmgAddPct', v: 0.1 }, { op: 'note', v: '普照' }] },
  counter:{ name: '护法诵', desc: '防御反击诵：受击回打一击并吸血（肉盾反打流）',
    fx: [{ op: 'guardCounter', v: true }, { op: 'counterPct', v: 0.5 }, { op: 'counterLifesteal', v: 0.30 }, { op: 'note', v: '护法反击' }] },
  // ⚠ 2026-09-27 · S02 O2 消撞车：以下 2 个诵经变种专供 summon / reverse 流派，
  //    使 10 流派诵经形态互异（原 drain/summon 同 heal、crit/reverse 同 pierce）。
  beckon: {
    name: '召请诵', desc: '召请灵兽护持：回血 45%',
    fx: [{ op: 'healPct', v: 0.45 }, { op: 'note', v: '召请' }],
  },
  hex: {
    name: '逆咒诵', desc: '逆咒焚念：附加 30% 无视防御真伤',
    fx: [{ op: 'trueDmgPct', v: 0.3 }, { op: 'note', v: '逆咒' }],
  },
};

// 层二 · 数值真源 ⑤ 隐藏职业 → 流派标签
//   用户拍板：英雄路线太单一 → 与隐藏职业结合，大招随职业变更
NDX.JOB_STYLE = {
  // 召唤流
  '驯兽师·百兽归心': 'summon', '逆兽师·百逆归心': 'summon', '女儿国·双随从': 'summon',
  // 反伤流
  '卷帘镇妖': 'reflect', '天蓬·负岳': 'reflect', '八戒·护禅': 'reflect', '卷帘·守舍利': 'reflect',
  // 连击流
  '斗战明王': 'combo', '悟空的棒': 'combo', '持棒证道': 'combo',
  // 暴击流
  '齐天·大圣': 'crit', '齐天残念': 'crit', '鹏翼之悟': 'crit',
  // 护盾流
  '卷帘复权': 'ward', '沙·问渡': 'ward', '沙·辨假': 'ward', '天蓬复称': 'ward', '车迟·力士': 'ward',
  // 闪避流
  '白衣渡客': 'evade', '白龙·御水': 'evade', '白龙·渡河': 'evade', '逆鳞白龙': 'evade', '龙太子归': 'evade', '白龙·吐水': 'evade',
  // 吸血流
  '吞天净坛': 'drain', '卷帘夺宴': 'drain', '九头·掠宝': 'drain', '夺宝龙子': 'drain', '净坛·拾遗': 'drain',
  // 净化/治疗流
  '弃经金蝉': 'purify', '弃经者': 'purify', '判官金蝉': 'purify', '金蝉了缘': 'purify',
  '定风金蝉': 'purify', '车迟·谕道': 'purify', '金蝉·谕经': 'purify', '罗刹·铁扇': 'purify',
  // 灼烧/毒流
  //   ⚠ 2026-09-26：罗刹·铁扇 由 purify 改归 burn —— burn 是唯一低于 3 职的薄流派（原本仅 2），不成环；
  //     且铁扇本就是芭蕉扇控火，与红孩儿三昧真火对位，purify（净化/治疗）与它的攻击面不符。
  //     影响：purify 8→7（仍是最大流派）、burn 2→3（成环）；三键变种 burn→atk:sunder/chant:aoe 已存在，无需新接线。
  '净坛·踏焰': 'burn', '圣婴折服': 'burn', '罗刹·铁扇': 'burn',
  // 逆道流
  '六耳·残': 'reverse', '真·逆道': 'reverse', '行旅录主': 'reverse',
  '悟空的空': 'reverse', '悟空的镜': 'reverse', '悟空的嗅': 'reverse',
};
NDX.jobStyleOf = function (jobKey) {
  return (jobKey && NDX.JOB_STYLE && NDX.JOB_STYLE[jobKey]) || null;
};

// ============================================================
// 层二 · 数值真源 ⑥ 隐藏职流派 → 三键变种的表现层映射（⚠ V9.55 新增）
//
// 🔴 这是 Q1-A「接线技能变种表」的**驱动源**。此前「变种从哪来」始终无解（无任何 UI 让玩家选
//    变种），若无来源，接线=固定一个变种、玩家感知不到。定案：**变种 = 隐藏职流派的表现层**——
//    未转职 ⇒ 'plain'，转职瞬间三键打法形态即变。零新 UI、零新数值、存量玩家零副作用。
//
//    取值一律指向层二已有的 ATK_VARIANTS / CHANT_VARIANTS 的 key（不新增变种，避免双真源）。
// ============================================================
NDX.JOB_STYLE_VARIANT = {
  atk: {
    combo:   'combo',    // 连击流 → 连环
    crit:    'crit',     // 暴击流 → 战意
    ward:    'sunder',   // 护盾流 → 破相（以真伤开路）
    evade:   'multi',    // 闪避流 → 多重（多段稳定输出）
    drain:   'drain',    // 吸血流 → 噬血
    purify:  'guard',    // 净化流 → 御守（攻守兼备，续航）
    summon:  'conjure',  // 召唤流 → 协同齐击（2026-09-27 O2：原 multi 与 evade 撞车，改专属变种）
    reflect: 'counter',  // 反伤流 → 反击
    burn:    'firerain', // 灼烧流 → 业火（2026-09-27 O2：原 sunder 与 ward 撞车，改专属变种）
    reverse: 'bloodrite',// 逆道流 → 血祭（2026-09-27 O2：原 crit 与暴击流撞车，改专属变种）
    plain:   'plain',
  },
  chant: {
    combo:   'buff',     // 连击流 → 增益诵
    crit:    'pierce',   // 暴击流 → 梵音诵
    ward:    'aegis',    // 护盾流 → 金刚诵
    evade:   'ward',     // 闪避流 → 凝护诵
    drain:   'heal',     // 吸血流 → 回春诵
    purify:  'cleanse',  // 净化流 → 净秽诵
    summon:  'beckon',   // 召唤流 → 召请诵（2026-09-27 O2：原 heal 与 drain 撞车，改专属变种）
    reflect: 'reflect',  // 反伤流 → 业报诵
    burn:    'aoe',      // 灼烧流 → 普照诵
    reverse: 'hex',      // 逆道流 → 逆咒诵（2026-09-27 O2：原 pierce 与暴击流撞车，改专属变种）
    plain:   'plain',
  },
};
// 流派 → 变种 key 的唯一解析口
NDX.skillVariantFor = function (kind, style) {
  const tab = (kind === 'chant') ? (NDX.JOB_STYLE_VARIANT.chant || {}) : (NDX.JOB_STYLE_VARIANT.atk || {});
  return tab[style || 'plain'] || 'plain';
};

// 层二 · 数值真源 ⑦ 大招随流派变体（同英雄不同隐藏职 → 不同大招效果）
//   在基础大招之上改写；每流派机制唯一，禁止跨流派复用
// 🔴 V9.51 · A1 断线修复（用户拍板 2026-09-25「按设计全部执行」）：
//   原 5 个字段在战斗侧**零消费**（`act.reflect` / `act.evaUp` / `act.cleanse` /
//   `act.summon` / `act.lifesteal` 全仓无读点）→ 反伤/闪避/净化/召唤/吸血**五流派大招形同虚设**。
//   现全部改走**已验证有效**的原语（修接线，不重做设计）：
//     reflect   → guardCounter + counterPct + counterLifesteal（与「业报/护法反击」同管线）
//     evaUp     → 保留标记，由 applyActiveIntervention 按减伤口径折算落地
//     cleanse   → 保留标记，由 applyActiveIntervention 调 NDX.applyBattleCleanse 落地
//     summon    → 保留标记，由 applyActiveIntervention 消费 act.summonStrike（灵兽协同真伤）
//     lifesteal → 直接折入 act.heal（不再挂死字段）
NDX.ULT_STYLE_MOD = {
  summon:  { name: '万兽朝元', desc: '召唤灵兽助战：灵兽协同真伤，并追加一次齐击', summon: true, summonRounds: 2, hits: 2, spread: 0.3 },
  reflect: { name: '万劫反噬', desc: '承伤反噬：受击回打敌身，并立金身护盾',      guardCounter: true, counterPct: 0.9, counterLifesteal: 0.4, counterRounds: 3, shield: 0.40 },
  combo:   { name: '千棍破阵', desc: '五段连击，每段附破甲真伤',            hits: 5, spread: 0.18, armorBreak: true, trueDmg: 0.15 },
  crit:    { name: '一棍定天', desc: '必暴，暴伤 +80%',                     critHit: true, critDmg: 0.8 },
  ward:    { name: '不坏金身', desc: '大护盾 + 减伤，本回合立于不败',        shield: 0.55, dr: 0.20 },
  evade:   { name: '影遁三袭', desc: '三段影袭，并提升自身闪避',             hits: 3, spread: 0.22, evaUp: 0.20, evaUpRounds: 3 },
  drain:   { name: '吞噬天地', desc: '重击并大口吸血',                       heal: 0.55, lifesteal: 0.25 },
  purify:  { name: '大慈大悲', desc: '法伤并净化自身全部异常，回春大地',     cleanse: true, heal: 0.40, sBuff: { regen: 3 } },
  burn:    { name: '业火焚天', desc: '附加三回合灼烧',                       dot: { pct: 0.18, rounds: 3 }, burn: true },
  reverse: { name: '逆鳞血祭', desc: '以战养战：伤害 ×1.3 并吸血 30%',       dmgMul: 1.3, lifesteal: 0.30, heal: 0.30 },
};
NDX.ultVariantFor = function (heroId, tier, jobKey, styleOverride) {
  void heroId; void tier;
  // 🔴 P2′（2026-09-25）：路线优先取显式传入的 currentStyle 结果；
  //   旧调用（只传 jobKey）继续按隐藏职映射回落，保持向后兼容零回归。
  const style = styleOverride || NDX.jobStyleOf(jobKey);
  if (!style) return null;
  return NDX.ULT_STYLE_MOD[style] || null;
};

// ============================================================
// 层三 · 顺序真源 + 统一调配入口
//
//   三键变体的执行顺序**只写一次**，就是下面这一行数组。任何一层要插入/移动/撤销，
//   改这里即可，不必去翻 combat_active.js 的语句序列。
//   注意：variant 必须排在 sutra **之后** —— 这不是顺序偏好，是数值正确性：
//   「舍攻为盾」要抹 dmg，若经文变体的 dmgMul 先加成、再被归零，整层经文收益被白吞。
//   故恒为：… → 经文变体 → 变种 → 法宝状态。
// ============================================================
NDX.SKILL_ORDER = ['hero', 'dao', 'job', 'ult', 'sutra', 'variant', 'jing', 'treasure'];

NDX.SKILL_LAYERS = {
  hero: {
    name: '本命攻式', kinds: ['atk'],
    run: function (act, c) {
      if (NDX.applyHeroKeyFeel) NDX.applyHeroKeyFeel(c.player, act, 'atk', c.s);
      return act;
    },
  },
  dao: {
    name: '六道攻式', kinds: ['atk'],
    run: function (act, c) {
      if (NDX.applyDaoKeyFeel) NDX.applyDaoKeyFeel(c.player, act, c.s, c.heroId);
      return act;
    },
  },
  job: {
    name: '隐藏职流派', kinds: ['atk', 'chant', 'ult'],
    run: function (act, c) {
      if (NDX.applyJobStyle) NDX.applyJobStyle(act, c.kind, c.s, c.heroId, c.player);
      return act;
    },
  },
  ult: {
    name: '大招变体', kinds: ['ult'],
    run: function (act, c) {
      if (NDX.applyUltVariant) NDX.applyUltVariant(act, c.heroId, c.tier, c.jobKey, c.style);
      // V9.51 · summon 流派大招落地：预算灵兽协同真伤，由 applyActiveIntervention 消费
      if (act.summon && !act.summonStrike && NDX.petSynergyTrueDmg) {
        try { act.summonStrike = NDX.petSynergyTrueDmg(c.s, act.dmg || 0); } catch (e) { /* noop */ }
      }
      // 绝招也吃经文招式包（原 combat_active 内联 _sutraVariant(act,'ult')，此处收口）
      if (NDX.sutraVariantOf && NDX.applySutraVariant) {
        const fid = (NDX.atkSutraId ? NDX.atkSutraId(c.s) : null);
        if (fid) {
          const sv = NDX.sutraVariantOf(fid, 'ult');
          if (sv) NDX.applySutraVariant(act, sv.variant, sv.scale);
        }
      }
      return act;
    },
  },
  variant: {
    name: '流派变种', kinds: ['atk', 'chant'],
    run: function (act, c) {
      if (!NDX.applyActVariant) return act;
      NDX.applyActVariant(act, c.kind, c.styleVariant);
      return act;
    },
  },
  sutra: {
    name: '经文变体', kinds: ['atk', 'chant'],
    run: function (act, c) {
      if (!NDX.sutraVariantOf || !NDX.applySutraVariant) return act;
      const fid = (c.kind === 'chant')
        ? (NDX.chantSutraId ? NDX.chantSutraId(c.s) : (c.s.chantSutra || null))
        : (NDX.atkSutraId ? NDX.atkSutraId(c.s) : null);
      if (!fid) return act;
      const sv = NDX.sutraVariantOf(fid, c.kind);
      if (sv) NDX.applySutraVariant(act, sv.variant, sv.scale);
      return act;
    },
  },
  jing: {
    name: '经位修饰', kinds: ['atk', 'chant'],
    run: function (act, c) {
      // V9.64 · 透传 ctx.rng，让门禁能 stub 概率分支；生产不传 → applyJingSlotMods 内部回退 Math.random。
      if (NDX.applyJingSlotMods) NDX.applyJingSlotMods(act, c.s, c.kind, c.rng);
      return act;
    },
  },
  treasure: {
    name: '法宝状态', kinds: ['atk', 'chant', 'ult'],
    run: function (act, c) {
      // 🩸 X3（2026-09-27 · Batch 0）：`applyTreasureStatus(act, s, rng)` 第 3 参早已存在
      //   （data_skill_variant.js:119 `const r = rng || Math.random`），jing 层也已透传 `c.rng`，
      //   唯独本层漏传 ⇒ 法宝状态概率分支在本层恒回退裸 Math.random（门禁无法 stub）。
      //   本层是 `resolveSkillAct` 唯一调配出口的登记项，补上即与 jing 层口径一致。
      if (NDX.applyTreasureStatus) NDX.applyTreasureStatus(act, c.s, c.rng);
      return act;
    },
  },
};

// ⚠ 唯一调配出口。combat_active.js 的三个键分支只调它，不再自己编排顺序。
// 幂等：逐层登记 act._skillDone[layer]，同一层在同一 act 上永不执行两次
// （V9.54「同一变体应用两次」的回归防线；note 不再重复拼接、加法字段不再翻倍）。
NDX.resolveSkillAct = function (act, kind, ctx) {
  if (!act) return act;
  const c = ctx || {};
  const S = c.s || {};
  const heroId = c.heroId || S.hero || 'tangseng';
  const jobKey = NDX.currentJob ? NDX.currentJob(S) : ((S.flags && S.flags.jobConfirm) || S.jobConfirm || null);
  const style = (NDX.currentStyle && NDX.currentStyle(S)) || NDX.jobStyleOf(jobKey) || 'plain';
  const c1 = {
    s: S, heroId: heroId, player: c.player || null, kind: kind,
    tier: c.tier || null, jobKey: jobKey, style: style,
    styleVariant: NDX.skillVariantFor(kind, style),
    rng: (typeof c.rng === 'function' ? c.rng : null), // V9.64 · 概率层可注入 stub；未传 → 各层内部回退 Math.random
  };
  const done = act._skillDone || (act._skillDone = {});
  const order = NDX.SKILL_ORDER || [];
  for (let i = 0; i < order.length; i++) {
    const nm = order[i];
    const layer = NDX.SKILL_LAYERS && NDX.SKILL_LAYERS[nm];
    if (!layer || done[nm]) continue;
    if (layer.kinds && layer.kinds.indexOf(kind) < 0) continue;
    done[nm] = 1;
    try { layer.run(act, c1); } catch (e) { /* 单层异常不得拖垮整条三键链路 */ }
  }
  return act;
};

// 兼容壳：旧调用点（combat_active.js）继续可用，内部转调 resolveSkillAct
NDX.finalizeActiveAct = function (act, kind, s, heroId, tier) {
  return NDX.resolveSkillAct(act, kind, { s: s, heroId: heroId, tier: tier });
};

// ============================================================
// 层一 · 技能总表（动态采集，供图鉴 / 门禁消费）
//   ⚠ V9.55：数值真源已迁到本表，这里只做登记与索引，不再「采集别处的数值」。
// ============================================================
NDX.skillIndex = function () {
  const out = { A: [], B: [], C: [], D: [], V: [], count: 0 };
  const push = (cls, id, name, extra) => {
    out[cls].push(Object.assign({ id: id, name: name || id, cls: cls }, extra || {}));
  };
  // A 普攻变种
  const atk = NDX.ATK_VARIANTS || {};
  Object.keys(atk).forEach((k) => push('A', k, (atk[k] && atk[k].name) || k, { desc: (atk[k] && atk[k].desc) || '' }));
  // B 诵经变种
  const ch = NDX.CHANT_VARIANTS || {};
  Object.keys(ch).forEach((k) => push('B', k, (ch[k] && ch[k].name) || k, { desc: (ch[k] && ch[k].desc) || '' }));
  // C 大招变体：流派 → 大招（ULT_STYLE_MOD 的键即流派标签）
  const ult = NDX.ULT_STYLE_MOD || {};
  Object.keys(ult).forEach((k) => push('C', k, (ult[k] && ult[k].name) || k, { style: k }));
  // V 流派变种映射（V9.55）：例「连击流 → 连环（攻）/ 增益诵（诵）」
  const jv = NDX.JOB_STYLE_VARIANT || {};
  Object.keys(jv.atk || {}).forEach((st) => push('V', st, '流派变种·' + st,
    { atk: jv.atk[st], chant: (jv.chant && jv.chant[st]) || '' }));
  // D 战斗干预（固定两项，实机见 combat_skills.js）
  push('D', 'shiPo', '识破', { note: '反制蓄力重击：本回合怪物重击归零 + 反制伤害' });
  push('D', 'momentumBurst', '气势爆发', { note: '积攒气势后的一次性爆发' });
  out.count = out.A.length + out.B.length + out.C.length + out.D.length + out.V.length;
  return out;
};

// 单键查询（供 UI 悬浮说明 / 图鉴）
NDX.skillIndexFind = function (id) {
  const ix = NDX.skillIndex();
  for (const c of ['A', 'B', 'C', 'D', 'V']) {
    const hit = ix[c].find((x) => x.id === id);
    if (hit) return hit;
  }
  return null;
};

// 大招变体：由「隐藏职业」解析流派 → 取 ULT_STYLE_MOD（转职单向驱动，不做 45×10 全展开）
NDX.skillUltStyleOf = function (jobKey) {
  const style = NDX.jobStyleOf ? NDX.jobStyleOf(jobKey) : ((jobKey && NDX.JOB_STYLE && NDX.JOB_STYLE[jobKey]) || null);
  if (!style) return null;
  const mod = (NDX.ULT_STYLE_MOD && NDX.ULT_STYLE_MOD[style]) || null;
  return { job: jobKey, style: style, mod: mod };
};
