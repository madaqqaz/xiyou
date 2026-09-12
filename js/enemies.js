// ============================================================================
//  敌人与 Boss 数据库（怪物属性 / 词缀 / 精英 / 关隘 Boss / 遗物）
//  独立维护：本文件包含全部敌人实体的可调参数。
//  怪物属性：NDX.MONSTER_TABLE / NDX.MONSTER_DR / NDX.monsterAt
//  怪物词缀：NDX.MONSTER_AFFIXES / NDX.MONSTER_AFFIX_LIST / NDX.attachAffix
//  关隘 Boss：NDX.bossDiffForAct / NDX.BOSS_NAMES / NDX.bossNameForAct / NDX.BOSS_RELICS
//  精英库：  NDX.ELITE_TABLE（键=精英名，含 diff/drop/material）
//  Boss 库： NDX.BOSS_TABLE  （键=Boss名，含 diff/drop/material）
//  读取：    NDX.enemyDefOf(node) → 返回该精英/Boss 的权威定义
//  修改精英/Boss 的名称、难度、掉落、材料，直接编辑 ELITE_TABLE / BOSS_TABLE 即可。
// ============================================================================

// 怪物减伤全程固定 20%（默认减伤率，战斗结算统一引用）
NDX.MONSTER_DR = 0.20;

// ---- 怪物属性缩放表 ----
NDX.MONSTER_TABLE = [
  { diff: 1,  hp: 330,  atk: 32,  matk: 15,  mdef: 0.06 },
  { diff: 2,  hp: 380,  atk: 37,  matk: 18,  mdef: 0.07 },
  { diff: 3,  hp: 430,  atk: 42,  matk: 21,  mdef: 0.08 },
  { diff: 4,  hp: 500,  atk: 48,  matk: 25,  mdef: 0.09 },
  { diff: 5,  hp: 570,  atk: 54,  matk: 29,  mdef: 0.10 },
  { diff: 6,  hp: 650,  atk: 61,  matk: 33,  mdef: 0.11 },
  { diff: 7,  hp: 740,  atk: 68,  matk: 38,  mdef: 0.12 },
  { diff: 8,  hp: 830,  atk: 76,  matk: 43,  mdef: 0.13 },
  { diff: 9,  hp: 920,  atk: 84,  matk: 48,  mdef: 0.14 },
  { diff: 10, hp: 1010, atk: 92,  matk: 53,  mdef: 0.15 },
  { diff: 11, hp: 1100, atk: 100, matk: 58,  mdef: 0.16 },
  { diff: 12, hp: 1200, atk: 108, matk: 64,  mdef: 0.17 },
  { diff: 13, hp: 1300, atk: 116, matk: 70,  mdef: 0.18 },
  { diff: 14, hp: 1400, atk: 118, matk: 70, mdef: 0.19 },
  { diff: 15, hp: 1500, atk: 125, matk: 74, mdef: 0.20 },
  { diff: 16, hp: 1600, atk: 132, matk: 80, mdef: 0.21 },
  { diff: 17, hp: 1710, atk: 140, matk: 86, mdef: 0.22 },
  { diff: 18, hp: 1820, atk: 150, matk: 92, mdef: 0.23 },
  { diff: 19, hp: 1940, atk: 160, matk: 98, mdef: 0.24 },
  // V9.x 数值修正：难20非意图台阶修复——原HP=2100/atk=185环比+8.25%，是相邻难的1.65倍
  // 调整为HP=2020/atk=172，环比+4.12%，与相邻难(6.59%/3.43%)平滑过渡
  { diff: 20, hp: 2020, atk: 172, matk: 108, mdef: 0.25, boss: true },
];

// ============================================================================
//  小怪类型库（《敌人种类扩充》：让普通小怪有独立名字/阵营标签/属性倾向）
//  键 = 章节编号(1~17，对应 ACT_NAMES)，值 = 该地区小怪名数组。
//  每项：{ name: 小怪名, tags: 阵营标签（供法宝「克制 counter」命中）, dr/mdef 倾向 }
//  战斗时 NDX.rollMob(act) 随机抽取；name 用于战斗头像/日志，tags 供法宝克制。
//  覆盖范围：17 地区 × 4~6 种 = 80+ 种西游风味小怪，替代"无名数值怪"。
// ============================================================================
NDX.MOB_TYPES = [
  // 1 大唐境内（凡俗水贼 + 山野小妖）
  [ { name: '山道喽啰', tags: ['妖'] },
    { name: '拦路山魈', tags: ['妖'] },
    { name: '断桥水卒', tags: ['水'] },
    { name: '野祠饿鬼', tags: ['鬼'] },
    { name: '山神庙外·拦路小妖', tags: ['妖'] } ],
  // 2 两界山（兽形妖 + 山魈）
  [ { name: '黑松夜叉', tags: ['鬼'] },
    { name: '双叉岭山魈', tags: ['妖'] },
    { name: '猎户刘家仆', tags: ['人'] },
    { name: '寅将军麾下', tags: ['妖'] } ],
  // 3 黄风岭（鼠妖 + 风沙）
  [ { name: '黄风沙卒', tags: ['妖'] },
    { name: '鼠妖小校', tags: ['妖'] },
    { name: '风卷妖兵', tags: ['妖'] },
    { name: '黄毛貂鼠徒', tags: ['妖'] } ],
  // 4 流沙河（水族 + 水怪）
  [ { name: '流沙水怪', tags: ['水'] },
    { name: '水底夜叉', tags: ['鬼'] },
    { name: '溺亡冤魂', tags: ['鬼'] },
    { name: '河伯水卒', tags: ['水'] } ],
  // 5 五庄观（山中精怪 + 道童）
  [ { name: '人参果树精', tags: ['木'] },
    { name: '镇元观道童', tags: ['人'] },
    { name: '荒山野狐', tags: ['妖'] },
    { name: '采药老道', tags: ['人'] } ],
  // 6 火云洞（火怪 + 兽妖）
  [ { name: '火云洞小妖', tags: ['妖'] },
    { name: '喷火夜叉', tags: ['鬼'] },
    { name: '炎岩兽', tags: ['火'] },
    { name: '红孩儿麾下', tags: ['妖'] } ],
  // 7 车迟国（虎鹿羊三妖 + 道教徒）
  [ { name: '虎力大仙门徒', tags: ['妖'] },
    { name: '鹿力小妖', tags: ['妖'] },
    { name: '羊力妖卒', tags: ['妖'] },
    { name: '车迟国巫师', tags: ['人'] } ],
  // 8 通天河（水族 + 鱼怪）
  [ { name: '金鱼精水卒', tags: ['水'] },
    { name: '黑鱼妖', tags: ['水'] },
    { name: '河底蚌精', tags: ['水'] },
    { name: '蟹将虾兵', tags: ['水'] } ],
  // 9 女儿国（毒虫 + 女妖）
  [ { name: '子母河毒虫', tags: ['虫'] },
    { name: '女国花妖', tags: ['妖'] },
    { name: '蝎子精徒', tags: ['虫'] },
    { name: '落胎泉妖', tags: ['妖'] } ],
  // 10 真假猴王（猿猴 + 幻妖）
  [ { name: '六耳猕猴兵', tags: ['妖'] },
    { name: '花果山猴', tags: ['妖'] },
    { name: '幻影妖猿', tags: ['妖'] },
    { name: '心魔幻相', tags: ['鬼'] } ],
  // 11 火焰山（火怪 + 牛魔王部）
  [ { name: '火焰山火妖', tags: ['火'] },
    { name: '牛魔王部卒', tags: ['妖'] },
    { name: '岩浆火蜥', tags: ['火'] },
    { name: '芭蕉洞妖', tags: ['妖'] } ],
  // 12 祭赛国（佛寺妖僧 + 乱世妖）
  [ { name: '祭赛国妖僧', tags: ['妖'] },
    { name: '金光寺淫贼', tags: ['人'] },
    { name: '碧波潭水妖', tags: ['水'] },
    { name: '万圣龙王兵', tags: ['水'] } ],
  // 13 狮驼岭（群魔 + 兽妖）
  [ { name: '狮驼岭小魔', tags: ['魔'] },
    { name: '青狮麾下', tags: ['妖'] },
    { name: '白象精兵', tags: ['妖'] },
    { name: '大鹏鸟羽', tags: ['妖'] } ],
  // 14 比丘国（妖道 + 乱臣）
  [ { name: '比丘国妖道', tags: ['妖'] },
    { name: '鹿精国丈卒', tags: ['妖'] },
    { name: '昏君禁卫', tags: ['人'] },
    { name: '婴尸怨魂', tags: ['鬼'] } ],
  // 15 天竺·玉兔（佛国妖 + 兔精）
  [ { name: '天竺妖僧', tags: ['妖'] },
    { name: '玉兔精兵', tags: ['妖'] },
    { name: '广寒宫兔', tags: ['妖'] },
    { name: '舍卫国妖', tags: ['妖'] } ],
  // 16 灵山（佛魔一念 + 守山金刚）
  [ { name: '灵山金刚', tags: ['佛门'] },
    { name: '佛前怨灵', tags: ['鬼'] },
    { name: '降龙伏虎侍', tags: ['佛门'] },
    { name: '传经吏仆', tags: ['佛门'] } ],
  // 17 凌云渡（佛魔 + 水怪）
  [ { name: '凌云渡水妖', tags: ['水'] },
    { name: '接引铁船夫', tags: ['人'] },
    { name: '无底船怨魂', tags: ['鬼'] },
    { name: '最后心魔', tags: ['魔'] } ],
];

// 按章节抽取一个小怪类型（含标签），供普通小怪战斗赋予名字/阵营
NDX.rollMob = function (act) {
  const a = Math.max(1, Math.min(28, Number(act) || 1));
  const pool = NDX.MOB_TYPES[Math.min(a - 1, NDX.MOB_TYPES.length - 1)] || NDX.MOB_TYPES[0];
  const idx = Math.floor(Math.random() * pool.length);
  const mob = pool[idx];
  return mob;
};

// ---- 怪物属性取用 + 词缀库 + 词缀注入 ----

NDX.monsterAt = function (diff) {
  const table = NDX.MONSTER_TABLE;
  if (!diff || diff < 1) return { dr: NDX.MONSTER_DR, ...table[0] };
  const exact = table.find((x) => x.diff === diff);
  if (exact) return { dr: NDX.MONSTER_DR, ...exact, mdef: Math.round(exact.mdef * 0.8 * 100) / 100 };
  if (diff <= 20) return { dr: NDX.MONSTER_DR, ...table[Math.max(0, Math.min(table.length - 1, diff - 1))] };
  // 第 2~4 章（diff>20）：以末档为基准按难号指数成长 f=(diff/20)^1.25（V39 放缓，
  // 匹配"玩家血量改由装备提供、取消升级成长"后的曲线，避免后期无装备必崩）。
  const base = table[table.length - 1];
  // 平衡 V43：成长指数 1.25 → 1.16，平滑后期怪物血量/攻击膨胀，
  // 配合 clampHp 恢复 baseHp*4 与转章平滑爬升，使善线中后期更可过、恶线仍会暴毙。
  // 中期缓坡 V46（2026-08-29 · 改进路线·第二步·B1）：难 21~39 做「钟形局部降斜」。
  //   根因：玩家血量改由装备提供后，难 15~22 是"装备/续航不足 → 砍不动+被秒"的断层带。
  //   做法：diff∈(20,40) 用 t(diff-20)/20 的钟形系数压平增幅，最大约 -12%（t=0.5，即难30）；
  //   两端 t→0/1 时系数→1，故难20 与难40+ 均回到原曲线，后期强度、终局压迫感完全保留。
  const f = Math.pow(diff / 20, 1.16) * midSlope(diff);
  return {
    dr: NDX.MONSTER_DR,
    diff: diff,
    hp: Math.round(base.hp * f),
    atk: Math.round(base.atk * f),
    matk: Math.round(base.matk * f),
    mdef: Math.min(0.45, +((base.mdef * 0.8) + (diff - 20) * 0.003).toFixed(3)),
  };
};

// 改造A · 复合怪物构造器（V8.6x）：将多个怪物定义合并为单个「合体」实体，
// 供车迟国「三妖同框·一打三」等场景使用。合并策略：
//   血量取总和×0.6（避免 3 倍暴增），攻/法攻取各成员最大值×1.15（聚合最强攻势），
//   减伤/御念取最大值，阵营标签取并集。返回仍是标准怪物形状（hp/atk/dr/matk/mdef/tags/boss），
// 下游 calcCombat 与 Boss 流程无需改动即可消费。
NDX.compositeMonster = function (list) {
  if (!Array.isArray(list) || !list.length) return null;
  const items = list.filter(Boolean);
  if (!items.length) return null;
  const names = items.map((m) => m.name || '妖').join('·');
  const hp = Math.round(items.reduce((a, m) => a + (m.hp || 1), 0) * 0.6);
  const atk = Math.round(Math.max.apply(null, items.map((m) => m.atk || 0)) * 1.15);
  const matk = Math.round(Math.max.apply(null, items.map((m) => m.matk || 0)) * 1.15);
  const dr = Math.max.apply(null, items.map((m) => (typeof m.dr === 'number' ? m.dr : 0)));
  const mdef = Math.max.apply(null, items.map((m) => (typeof m.mdef === 'number' ? m.mdef : 0)));
  const tags = Array.from(new Set([].concat.apply([], items.map((m) => m.tags || []))));
  return {
    name: names + '·合体',
    hp, atk, matk, dr, mdef,
    tags,
    boss: true,
    _composite: true,
    affix: '三妖同框·合体一战',
  };
};

// 中期缓坡系数（难 21~39）：钟形削峰，两端归零、40+ 不生效。
// 0.48 × t(1-t) 在 t=0.5（难30）达最大 0.12，即该难怪物攻/血较原指数约降 12%。
function midSlope(diff) {
  if (diff <= 20 || diff >= 40) return 1;
  const t = (diff - 20) / 20;   // 0→1 对应 20→40
  return 1 - 0.48 * t * (1 - t);
}

// —— 心魔镜像自我（六道·心魔满值强制战）——
// 属性随玩家当前 build 成长：你有多强，镜中的你就有多难缠——但略逊一筹，
// 提供「以战破镜」的可能；胜利纯惩罚（无战利品），失败削本局气血上限。
// 字段 __xinmoReflex 供 finishFight 识别，__void 沿用业镜「不落战利品」语义。
NDX.buildXinmoMirror = function (st) {
  st = st || {};
  const ti = st.ti || {};
  const yuan = st.yuan || {};
  const maxHp = Math.round(ti.maxHp || 400);
  return {
    name: (NDX.XINMO && NDX.XINMO.MIRROR_NAME) || '心魔·镜中你',
    type: 'elite',
    boss: true,                 // 走 Boss 档动画/韧性条，营造强敌压迫
    diff: (NDX.game && NDX.game.state && NDX.game.state.diff) || 10,
    hp: Math.round(maxHp * 1.35),
    atk: Math.round((ti.atk || 60) * 1.15),
    matk: Math.round((yuan.matk || 20) * 1.15),
    mdef: Math.min(0.5, (yuan.mdef || 0.2) * 0.9),
    dr: Math.min(0.8, (ti.dr || 0.2) * 0.9),
    eva: Math.min(0.5, (ti.eva || 0.05) * 0.8),
    spd: 7,
    counter: 0.26,
    affix: ['reflect', 'armor'],
    __xinmoReflex: true,
    __void: true,               // 沿用「本层不落战利品」：胜利不吃任何掉落
  };
};

// =============================================================
// 怪物随机词缀库（《体系补全》·一阶补全）
// 词缀是怪物的随机修饰层，与劫印/命痕（玩家构筑层）彻底分离——
// 玩家不持有词缀，词缀只作用于本场怪物，使每一战都略有差异。
// 词缀经 NDX.attachAffix 注入怪物对象（m.affix 数组），由 combat.js·normalizeMonster 解析生效。
// 准入门槛：diff>=4 起才可能出现词缀（前期不加压）；高层(diff>=20)可叠 2 条。
// =============================================================
NDX.MONSTER_AFFIXES = {
  fury:     { name: '狂暴', icon: '暴', desc: '残血狂暴时攻击 ×1.8（原 ×1.5）', weight: 100 },
  ironwall: { name: '铁壁', icon: '壁', desc: '护甲 +8%', weight: 100 },
  vampiric: { name: '噬血', icon: '血', desc: '命中玩家时吸取 12% 伤害为气血', weight: 90 },
  swift:    { name: '迅捷', icon: '速', desc: '速度 +3（更易抢先出手）', weight: 80 },
  hexbone:  { name: '咒骨', icon: '咒', desc: '攻击附加 2 回合咒蚀（每回合 ≈6% 攻击）', weight: 80 },
  tough:    { name: '坚甲', icon: '甲', desc: '气血 ×1.2', weight: 70 },
  blasphemy:{ name: '亵渎', icon: '渎', desc: '玩家每回合始损失 3% 当前气血（环境侵蚀）', weight: 60 },
  focused:  { name: '凝念', icon: '念', desc: '法伤 ×1.25', weight: 70 },
  // —— 逆特质：二周目起怪物新增「逆」道侵蚀词缀（一周目封锁，属多周目差异化解锁）——
  niTrait:  { name: '逆蚀', icon: '蚀', desc: '攻击附带「逆道侵蚀」：命中玩家使其本轮劫印增益 -8%（跳出簿子者反噬簿外之人）', weight: 85, cycleReq: 2 },
  // —— 逆道·裂界：第三/四章（逆道开放）Boss 第二阶段专属词缀。
  // 使二阶段更凶（护甲+10%、法伤×1.3、狂暴阈值降至 50%），但刻意留出「手动法宝连锁 COMBO」破局口——
  // 连环祭宝可瞬间压垮韧性条，给熟练玩家大幅缩短回合的操作爽点。
  nidaobane: { name: '逆道·裂界', icon: '裂', desc: '逆道侵蚀第二阶段：护甲+10%、法伤×1.3、狂暴阈值降至 50%；然韧性条更易被手动法宝连锁击碎——连段收益更高', weight: 100, nidao: true },
};
NDX.MONSTER_AFFIX_LIST = Object.keys(NDX.MONSTER_AFFIXES);

// 按难度为怪物随机附加词缀（返回带 affix 字段的怪物副本）
NDX.attachAffix = function (m, diff) {
  if (!m) return m;
  const d = diff || m.diff || 1;
  if (d < 4) return m; // 前期无词缀
  const cycle = NDX.getCycle ? NDX.getCycle() : 1;
  const copy = Object.assign({}, m);
  // 词缀数量：4~19 难 1 条；>=20 难 2 条（高层更乱）
  const count = d >= 20 ? 2 : 1;
  // 候选池：逆特质仅二周目起解锁，一周目不出现
  let pool = NDX.MONSTER_AFFIX_LIST.slice();
  if (cycle < 2) pool = pool.filter((k) => !NDX.MONSTER_AFFIXES[k].cycleReq);
  const chosen = [];
  for (let i = 0; i < count && pool.length; i++) {
    const weights = pool.map((k) => NDX.MONSTER_AFFIXES[k].weight);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) { r -= weights[idx]; if (r <= 0) break; }
    const k = pool[Math.min(idx, pool.length - 1)];
    chosen.push(k);
    pool.splice(pool.indexOf(k), 1);
  }
  // 精英/Boss 不叠「亵渎」（环境掉血对低血量英雄过苛），保险剔除
  if ((m.type === 'elite' || m.boss) && chosen.indexOf('blasphemy') >= 0) {
    chosen.splice(chosen.indexOf('blasphemy'), 1);
  }
  if (!chosen.length) return m;
  copy.affix = chosen;
  // 预计算词缀派生数值，combat 直接读取
  const A = NDX.MONSTER_AFFIXES;
  if (chosen.indexOf('ironwall') >= 0) copy.dr = Math.min(0.6, (copy.dr || 0) + 0.08);
  if (chosen.indexOf('tough') >= 0) copy.hp = Math.round(copy.hp * 1.2);
  if (chosen.indexOf('focused') >= 0) copy.matk = Math.round(copy.matk * 1.25);
  if (chosen.indexOf('vampiric') >= 0) copy.hpRegenPct = 0.12;       // 命中回血比例
  if (chosen.indexOf('hexbone') >= 0) copy.hexDmgPct = 0.06;          // 每回合咒蚀占攻击比
  if (chosen.indexOf('blasphemy') >= 0) copy.envDrainPct = 0.03;      // 玩家回合始掉血比例
  if (chosen.indexOf('swift') >= 0) copy.affixSpd = 3;                // 速度附加（combat 累加）
  if (chosen.indexOf('fury') >= 0) copy.furyMult = 1.8;               // 狂暴倍率覆盖
  if (chosen.indexOf('nidaobane') >= 0) {                              // 逆道·裂界：二阶段专属强化
    copy.dr = Math.min(0.72, (copy.dr || 0) + 0.10);
    copy.matk = Math.round(copy.matk * 1.3);
    copy.enrage = 0.5;                                                 // 狂暴阈值降至 50%
  }
  return copy;
};

// ---- 关隘 Boss 难度阶梯 ----
NDX.bossDiffForAct = function (act) {
  // 关隘 Boss 难度阶梯（按 17 地区 · 每地区末难取用，Boss 全局难号 = 4/9/13/18/22/27/31/36/40/45/49/54/58/63/72/77/81）：
  // 完全按地理段落分地区后，每地区 4~5 难、地区末 Boss 收尾，难度随地区逐段温和爬升，
  // 终局（灵山·凌云渡）逼近第 81 难，使「遵照原著善线、装备成长正常」的玩家能稳定推进，
  // 恶线（装备/续航缺失）仍会暴毙，契合"善 50-60% / 恶 20-30%"的设计目标。
  return [4, 9, 13, 18, 22, 27, 31, 36, 40, 45, 49, 54, 58, 63, 72, 77, 81][Math.max(0, Math.min(16, (act || 1) - 1))];
};

// ---- 关隘 Boss 遗物 / 命名 ----
NDX.BOSS_RELICS = [
  { id: 'relic_act1',  name: '江流木匣', icon: '匣', act: 1,
    desc: '大唐江上漂来的旧木匣：体攻 +8%，气血 +6%',
    effect: { atkPct: 0.08, hpPct: 0.06 } },
  { id: 'relic_act2',  name: '白骨舍利', icon: '骨', act: 2,
    desc: '白骨夫人三戏之身化出的一枚舍利：御念 +8%，身法 +6%',
    effect: { mdef: 0.08, eva: 0.06 } },
  { id: 'relic_act3',  name: '雷音残魂', icon: '魂', act: 3,
    desc: '黄风岭上残留的一缕大圣残魂：体攻 +12%，愿伤 +12%，气血 +8%',
    effect: { atkPct: 0.12, matkPct: 0.12, hpPct: 0.08 } },
  { id: 'relic_act4',  name: '流沙铁胆', icon: '胆', act: 4,
    desc: '流沙河底一枚沉铁胆：护体 +8%，体攻 +6%，每战开局得 8% 气血护盾',
    effect: { dr: 0.08, atkPct: 0.06, shieldPct: 0.08 } },
  { id: 'relic_act5',  name: '人参果核', icon: '核', act: 5,
    desc: '五庄观人参果树的一枚果核：气血 +12%，每战回合回 3% 气血',
    effect: { hpPct: 0.12, regenPct: 0.03 } },
  { id: 'relic_act6',  name: '三昧火种', icon: '火', act: 6,
    desc: '火云洞三昧真火的一粒火种：法伤 +14%，每战开局先烧敌 5% 气血',
    effect: { matkPct: 0.14, burnPct: 0.05 } },
  { id: 'relic_act7',  name: '三清道符', icon: '符', act: 7,
    desc: '车迟国三妖供奉的三清道符：法伤 +10%，御念 +10%，气血 +6%',
    effect: { matkPct: 0.10, mdef: 0.10, hpPct: 0.06 } },
  { id: 'relic_act8',  name: '灵感鱼鳞', icon: '鳞', act: 8,
    desc: '灵感大王金鳞一片：身法 +10%，护体 +6%，每战开局得 10% 气血护盾',
    effect: { eva: 0.10, dr: 0.06, shieldPct: 0.10 } },
  { id: 'relic_act9',  name: '女儿国玺', icon: '玺', act: 9,
    desc: '女儿国一枚玉玺：御念 +10%，气血 +8%，每战回合回 2% 气血',
    effect: { mdef: 0.10, hpPct: 0.08, regenPct: 0.02 } },
  { id: 'relic_act10', name: '如意神铁', icon: '铁', act: 10,
    desc: '真假之间一根如意神铁：体攻 +15%，身法 +12%，护体 +8%',
    effect: { atkPct: 0.15, eva: 0.12, dr: 0.08 } },
  { id: 'relic_act11', name: '芭蕉扇骨', icon: '扇', act: 11,
    desc: '火焰山下的一枚扇骨：法伤 +16%，每战开局烈火先烧敌 6% 气血',
    effect: { matkPct: 0.16, burnPct: 0.06 } },
  { id: 'relic_act12', name: '碧波龙珠', icon: '珠', act: 12,
    desc: '碧波潭九头虫的龙珠：法伤 +12%，护体 +8%，气血 +8%',
    effect: { matkPct: 0.12, dr: 0.08, hpPct: 0.08 } },
  { id: 'relic_act13', name: '佛祖金翎', icon: '翎', act: 13,
    desc: '金翅鹏王遗落的一根金翎：身法 +14%，御念 +10%，气血 +10%',
    effect: { eva: 0.14, mdef: 0.10, hpPct: 0.10 } },
  { id: 'relic_act14', name: '寿星仙桃', icon: '桃', act: 14,
    desc: '比丘国白鹿窃来的寿星仙桃：气血 +14%，每战回合回 4% 气血',
    effect: { hpPct: 0.14, regenPct: 0.04 } },
  { id: 'relic_act15', name: '捣药玉杵', icon: '杵', act: 15,
    desc: '月宫玉兔的捣药杵：护体 +10%，愿伤 +16%，每地区回血 +6%',
    effect: { dr: 0.10, matkPct: 0.16, regenPct: 0.06 } },
  { id: 'relic_act16', name: '无字真经', icon: '经', act: 16,
    desc: '灵山一页无字真经：体攻 +15%，愿伤 +15%，气血 +12%，护体 +6%，御念 +6%',
    effect: { atkPct: 0.15, matkPct: 0.15, hpPct: 0.12, dr: 0.06, mdef: 0.06 } },
  { id: 'relic_act17', name: '金蝉蜕壳', icon: '蜕', act: 17,
    desc: '凌云渡头一缕真蜕金壳：全系 +18%，气血 +15%，破韧后连住三重',
    effect: { atkPct: 0.18, matkPct: 0.18, hpPct: 0.15, dr: 0.06, mdef: 0.06 } },
];

// 各地区关隘 Boss 名（按 act 取，17 地区 · 第 N 地区 Boss = 该地区末难 4/9/13/18/22/27/31/36/40/45/49/54/58/63/72/77/81）：
//   给「完全按地理段落分地区」的每地区末关隘赋予专属叙事 Boss，使十七地区推进有明显 Boss 节奏与终局感。
//   三段变身 Boss（8）：白骨夫人·五行归墟 / 黄风大圣 / 红孩儿 / 车迟三妖 / 六耳猕猴 / 牛魔王 / 大鹏金翅雕 / 通天河老鼋。
NDX.BOSS_NAMES = [
  '刘洪·江流索命',      // 第 1 地区关隘（难 4 · 大唐境内 · 水贼刘洪）
  '白龙·鹰愁涧',        // 第 2 地区关隘（难 9 · 两界山 · 鹰愁涧白龙）
  '黄风大圣',           // 第 3 地区关隘（难 13 · 黄风岭 · 黄风怪·三形态抉择战）
  '流沙河·沙僧',        // 第 4 地区关隘（难 18 · 流沙河 · 收沙僧）
  '奎木狼·黄袍怪',      // 第 5 地区关隘（难 22 · 五庄观 · 黄袍掳公主）
  '红孩儿·三昧真火',    // 第 6 地区关隘（难 27 · 火云洞 · 红孩儿三段）
  '车迟三妖·虎鹿羊',    // 第 7 地区关隘（难 31 · 车迟国 · 虎力/鹿力/羊力三段）
  '金鱼精·灵感大王',    // 第 8 地区关隘（难 36 · 通天河 · 金鱼精）
  '女儿国·蝎子精',      // 第 9 地区关隘（难 40 · 女儿国 · 蝎子精）
  '六耳猕猴',           // 第 10 地区关隘（难 45 · 真假猴王 · 六耳三段）
  '牛魔王',             // 第 11 地区关隘（难 49 · 火焰山 · 牛魔王三段）
  '九头虫·碧波潭',      // 第 12 地区关隘（难 54 · 祭赛国 · 九头虫）
  '大鹏金翅雕',         // 第 13 地区关隘（难 58 · 狮驼岭 · 大鹏三段）
  '黄狮精·玉华州',      // 第 14 地区关隘（难 63 · 比丘国 · 玉华盗兵）
  '假公主·玉兔',        // 第 15 地区关隘（难 72 · 天竺·玉兔 · 玉兔精）
  '大圣残躯·无字碑',    // 第 16 地区关隘（难 77 · 灵山 · 灵山无字）
  '通天河老鼋·湿经',    // 第 17 地区关隘（难 81 · 凌云渡 · 通天河老鼋 · 终局 Boss 三段）
];

// ============================================================
// 第二章最终 Boss：白骨夫人（固定第 22 难）
//   白骨精「三戏」之身，依玩家本局「六道命数」(s.fate 累计倾向) 显化不同形态，
//   与战 / 渡 / 逆 / 隐 / 夺 / 缘 六道一一对应。平局或无倾向时显「尸魔真身」基准相。
//   注：坐标为本人技能包（combat.js 自带六件套），此处只改外观与属性面板。
// ============================================================
NDX.BAIGU_FORMS = {
  // 衡：尸魔真身（基准形态，无六道倾向 / 多道并列时）
  衡: {
    name: '白骨夫人 · 尸魔真身', dao: '衡',
    desc: '一具真尸魔骨，无相无偏。三戏未分，杀机未显——这是她最本来的样子。',
    hp: 1600, atk: 110, dr: 0.10, matk: 55, mdef: 0.10,
    affix: '白骨三戏·未分之身（每3回合轮转战/渡/逆三相）',
    sanxi: true,
  },
  战: {
    name: '白骨夫人 · 金刚怒相', dao: '战',
    desc: '尸魔暴起，金戈骨戟。她以你一路砸出的硬骨为甲，越打越凶——这是你"斗战"之道的倒影。',
    hp: 1400, atk: 150, dr: 0.04, matk: 60, mdef: 0.06,
    affix: '白骨·狂骨怒涛（攻高防薄，狂暴连击）',
  },
  渡: {
    name: '白骨夫人 · 慈妪相', dao: '渡',
    desc: '她化作送斋老妪，以慈悲为刃。你渡得多，她便渡得久——骨中渗出佛光，越伤越养。',
    hp: 1900, atk: 80, dr: 0.12, matk: 90, mdef: 0.22,
    affix: '白骨·慈航渡骨（法防极高，残血自愈）',
  },
  逆: {
    name: '白骨夫人 · 散魂相', dao: '逆',
    desc: '三魂散尽，无相无踪。你越不肯低头，她越无迹可寻——骨影飘忽，打中的都是空。',
    hp: 1500, atk: 130, dr: 0.06, matk: 80, mdef: 0.14,
    affix: '白骨·散魂无相（高敏闪避，真假难辨）',
  },
  隐: {
    name: '白骨夫人 · 敛形相', dao: '隐',
    desc: '她敛去周身杀机，藏骨于雾。你一路卸力藏形，她便把骨甲淬到最厚——最安静的，往往最硬。',
    hp: 1800, atk: 90, dr: 0.26, matk: 48, mdef: 0.16,
    affix: '白骨·敛形雾甲（护甲极厚，存在感极低）',
  },
  夺: {
    name: '白骨夫人 · 噬骨相', dao: '夺',
    desc: '她吞骨夺修，越战越肥。你逆取的每一件好处，都成了她吸血的养分——打她，便是养她。',
    hp: 1650, atk: 120, dr: 0.08, matk: 64, mdef: 0.10,
    affix: '白骨·噬骨夺生（吸血，击杀回血）',
  },
  缘: {
    name: '白骨夫人 · 三戏相', dao: '缘',
    desc: '村姑、老妪、老翁三戏合一，机缘所钟。她把你一路遇见的每个人，都演了一遍——这是"缘"的回响。',
    hp: 1700, atk: 115, dr: 0.14, matk: 66, mdef: 0.14,
    affix: '白骨·三戏归元（全能中庸，三戏轮转）',
    sanxi: true,
  },
};
// 六道命数键（与 ENDINGS / 各劫 fate 字段一致）
NDX.BAIGU_DAO_KEYS = ['战', '渡', '逆', '隐', '夺', '缘'];
// 依 s.fate 累计取最高道；并列或全 0 返回 '衡'（尸魔真身基准相）
NDX.baiguFormForFate = function (fate) {
  fate = fate || {};
  let best = '衡', max = 0, tie = false;
  for (const k of NDX.BAIGU_DAO_KEYS) {
    const v = fate[k] || 0;
    if (v > max) { max = v; best = k; tie = false; }
    else if (v === max && v > 0) { tie = true; }
  }
  if (max === 0 || tie) return NDX.BAIGU_FORMS['衡'];
  return NDX.BAIGU_FORMS[best];
};
NDX.bossNameForAct = function (act) {
  const i = Math.max(0, Math.min(NDX.BOSS_NAMES.length - 1, (act || 1) - 1));
  return NDX.BOSS_NAMES[i];
};

// ============================================================
// 第一章最终 Boss：黄风怪 · 三形态抉择战（参照 nidao-xiyou 的 HUANGFENG 设计）
//   三形态：妖鼠本相(初战立威) → 三昧神风·失忆形(风伤咒蚀) → 黄风大圣·狂形(狂暴点名)。
//   适配 demo 现有「两相劫」战斗：阶段1=妖鼠本相，阶段2=三昧神风·失忆形，
//   阶段2 残血(<30%)触发狂暴 → 黄风大圣·狂形（攻击×1.5，狂暴点名）。
//   数值按 demo 第一章 Boss 量纲缩放（原参考项目 900/2200/2800 为全新平衡，此处对齐旧白骨夫人）。
// ============================================================
NDX.HUANGFENG_FORMS = {
  p1: {
    name: '黄风怪 · 妖鼠本相', dao: '初',
    desc: '黄毛貂鼠现出本相，三目齐开。风未起，杀机已至——这是它最本来的样子。',
    hp: 880, atk: 72, dr: 0.15, matk: 55, mdef: 0.15,
    affix: '黄风·妖鼠本相（初战立威）',
  },
  p2: {
    name: '黄风怪 · 三昧神风·失忆形', dao: '风',
    desc: '三昧神风接天，随从抱头蹲地，喃喃自语。这风不伤皮肉，只掏人心里的"为什么"。',
    hp: 1060, atk: 88, dr: 0.20, matk: 70, mdef: 0.20,
    affix: '黄风·三昧神风（风伤咒蚀）',
  },
  p3: {
    name: '黄风怪 · 黄风大圣·狂形', dao: '狂',
    desc: '他忽然收风，金目直射你："降龙志，破军意，渡江心——你这辈子，到底为谁而取经？"（话音落，重击）',
    hp: 0, atk: 0, dr: 0.20, matk: 0, mdef: 0.20,
    affix: '黄风·狂暴点名（残血狂暴，攻击×1.5）',
  },
};
// 黄风怪两相劫阶段装配：阶段1=妖鼠本相，阶段2=三昧神风·失忆形（残血狂暴→黄风大圣·狂形）
NDX.huangfengStageSetup = function () {
  const hf = NDX.HUANGFENG_FORMS;
  return {
    name: hf.p1.name,
    stages: [hf.p1.hp, hf.p2.hp],
    phaseOverrides: [null, {
      dr: hf.p2.dr, matk: hf.p2.matk,
      enrage: 0.3, enrageMul: 1.5,
      affix: hf.p2.affix,
    }],
    phaseStats: [null, {
      atk: hf.p2.atk, matk: hf.p2.matk, mdef: hf.p2.mdef, dr: hf.p2.dr, affix: hf.p2.affix,
    }],
    phase2Override: {
      dr: hf.p2.dr, matk: hf.p2.matk,
      enrage: 0.3, enrageMul: 1.5,
      affix: hf.p2.affix,
    },
    stageRewards: [
      { claim: { gold: 120, ling: 30, note: '妖鼠本相·破韧厚赏' }, idle: { gold: 30, note: '妖鼠本相·挂机兜底' } },
      { claim: { gold: 160, ling: 40, note: '三昧神风·破韧厚赏' }, idle: { gold: 40, note: '三昧神风·挂机兜底' } },
    ],
  };
};

// ============================================================
// 三段变身 Boss 库（8 个）：白骨夫人·五行归墟 / 黄风大圣 / 红孩儿 / 车迟三妖 / 六耳猕猴 / 牛魔王 / 大鹏金翅雕 / 通天河老鼋
//   每项 phases=[p1,p2,p3] 为三段变身（p1 初相 → p2 中相 → p3 终相），overrides[i] 为第 i+1 阶段的派生数值
//   （dr/matk/enrage/enrageMul/affix），供 combat.js 按 phaseOverrides[stage] 逐段覆盖。
//   黄风大圣沿用上方 HUANGFENG_FORMS（两相+残血狂暴=三形态），不在此重复定义。
//   其余 9 个地区 Boss 为「两段变身」，走战斗系统默认两相（stages=[hp, hp*0.62]），无需在此登记。
// ============================================================
NDX.BOSS_FORMS = {
  // 白骨夫人·五行归墟（两界山）：三戏之身——村姑送斋 → 老妪寻女 → 老翁寻妻
  '五行归墟': {
    name: '白骨夫人 · 三戏之身',
    sanxi: true,              // V8.35 三戏轮转：每3回合切换战/渡/逆三相
    sanxiEvery: 3,
    sanxiPhases: [
      { name: '金刚怒相', atkMul: 1.3, drMul: 0.7, matkMul: 1.0, affix: '三戏·战相（攻高防薄）' },
      { name: '慈妪相',   atkMul: 0.9, drMul: 1.3, matkMul: 1.2, affix: '三戏·渡相（防高攻缓）' },
      { name: '散魂相',   atkMul: 1.1, drMul: 1.0, matkMul: 1.1, affix: '三戏·逆相（飘忽不定）' },
    ],
    phases: [
      { name: '白骨夫人 · 村姑送斋', dao: '一戏',
        desc: '荒山野径，村姑提篮而来，笑盈盈捧出斋饭。你接过时，她指间白骨一闪——这是白骨精的第一戏。',
        hp: 600, atk: 90, dr: 0.10, matk: 50, mdef: 0.12, affix: '白骨·村姑送斋（初相·法防渐起）' },
      { name: '白骨夫人 · 老妪寻女', dao: '二戏',
        desc: '村姑化作老妪，哭喊着寻女儿。她每哭一声，骨甲便厚一分——这是白骨精的第二戏。',
        hp: 750, atk: 110, dr: 0.14, matk: 60, mdef: 0.16, affix: '白骨·老妪寻女（中相·护甲渐厚）' },
      { name: '白骨夫人 · 老翁寻妻', dao: '三戏',
        desc: '老妪又化老翁，拄杖索妻。三戏归元，白骨森然——她不再演了，要你偿这一路杀身之债。',
        hp: 900, atk: 130, dr: 0.18, matk: 70, mdef: 0.20, affix: '白骨·老翁寻妻（终相·狂暴）' },
    ],
    overrides: [
      null,
      { dr: 0.14, matk: 60, enrage: 0.3, enrageMul: 1.5, affix: '白骨·老妪寻女（中相·护甲渐厚）' },
      { dr: 0.18, matk: 70, enrage: 0.3, enrageMul: 1.5, affix: '白骨·老翁寻妻（终相·狂暴）' },
    ],
  },
  // 红孩儿·三昧真火（火云洞）：孩童相 → 三昧真火 → 火云焚天
  '红孩儿·三昧真火': {
    name: '红孩儿 · 三昧真火',
    phases: [
      { name: '红孩儿 · 赤足孩童', dao: '初',
        desc: '一个赤足孩童拦在车前，嬉笑玩火。你正要上前，他掌心已腾起一缕青焰——圣婴大王，不是孩子。',
        hp: 1500, atk: 170, dr: 0.12, matk: 110, mdef: 0.14, affix: '火云·孩童相（初相·法伤渐起）' },
      { name: '红孩儿 · 三昧真火', dao: '火',
        desc: '他张口一喷，三昧真火铺天盖地。这火不烧皮肉，专焚心念——你越急，火越旺。',
        hp: 1800, atk: 200, dr: 0.16, matk: 140, mdef: 0.18, affix: '火云·三昧真火（中相·法伤暴涨）' },
      { name: '红孩儿 · 火云焚天', dao: '焚',
        desc: '火云洞天火齐燃，他立于火中狂笑："我父是牛魔王，我母是罗刹女——这火，烧的就是你们这些取经人！"',
        hp: 2100, atk: 240, dr: 0.20, matk: 170, mdef: 0.22, affix: '火云·火云焚天（终相·狂暴）' },
    ],
    overrides: [
      null,
      { dr: 0.16, matk: 140, enrage: 0.3, enrageMul: 1.5, affix: '火云·三昧真火（中相·法伤暴涨）' },
      { dr: 0.20, matk: 170, enrage: 0.3, enrageMul: 1.5, affix: '火云·火云焚天（终相·狂暴）' },
    ],
  },
  // 车迟三妖·虎鹿羊（车迟国）：虎力大仙 → 鹿力大仙 → 羊力大仙（三妖轮战）
  '车迟三妖·虎鹿羊': {
    name: '车迟三妖 · 虎鹿羊',
    phases: [
      { name: '车迟国 · 虎力大仙', dao: '虎',
        desc: '虎力大仙登坛求雨，虎啸震天。他拍胸喝道："贫道受三清敕令，保车迟国风调雨顺——尔等妖僧，也配来此？"',
        hp: 1700, atk: 200, dr: 0.14, matk: 130, mdef: 0.16, affix: '车迟·虎力（初相·体攻为主）' },
      { name: '车迟国 · 鹿力大仙', dao: '鹿',
        desc: '虎力败退，鹿力大仙踏云而上，鹿角生寒。他擅剖腹剜心、隔板猜物——这一战，赌的是命。',
        hp: 2000, atk: 230, dr: 0.18, matk: 160, mdef: 0.20, affix: '车迟·鹿力（中相·法防渐厚）' },
      { name: '车迟国 · 羊力大仙', dao: '羊',
        desc: '鹿力又败，羊力大仙怒极，羊角燃起冷焰。三妖同气连枝，虎鹿既倒，羊力便是最后一道关。',
        hp: 2300, atk: 270, dr: 0.22, matk: 190, mdef: 0.24, affix: '车迟·羊力（终相·狂暴）' },
    ],
    overrides: [
      null,
      { dr: 0.18, matk: 160, enrage: 0.3, enrageMul: 1.5, affix: '车迟·鹿力（中相·法防渐厚）' },
      { dr: 0.22, matk: 190, enrage: 0.3, enrageMul: 1.5, affix: '车迟·羊力（终相·狂暴）' },
    ],
  },
  // 六耳猕猴（真假猴王）：假行者 → 真假难辨 → 心猿怒相
  '六耳猕猴': {
    name: '六耳猕猴 · 真假难辨',
    phases: [
      { name: '六耳猕猴 · 假行者', dao: '假',
        desc: '他与你生得一般无二，金箍棒、虎皮裙、火眼金睛——连那根毫毛都分毫不差。他笑："我是真的，你是假的。"',
        hp: 2600, atk: 310, dr: 0.14, matk: 200, mdef: 0.16, affix: '六耳·假行者（初相·镜像）' },
      { name: '六耳猕猴 · 真假难辨', dao: '辨',
        desc: '两个行者斗在一处，观音念咒、玉帝照妖、地府查簿，皆辨不出。他越打越像你——你越像他。',
        hp: 3100, atk: 360, dr: 0.18, matk: 240, mdef: 0.20, affix: '六耳·真假难辨（中相·镜像渐深）' },
      { name: '六耳猕猴 · 心猿怒相', dao: '怒',
        desc: '他忽然收了笑，金目赤红："既然天地只认一个，那便——只留一个！"二心相搏，至死方休。',
        hp: 3600, atk: 420, dr: 0.22, matk: 280, mdef: 0.24, affix: '六耳·心猿怒相（终相·狂暴）' },
    ],
    overrides: [
      null,
      { dr: 0.18, matk: 240, enrage: 0.3, enrageMul: 1.5, affix: '六耳·真假难辨（中相·镜像渐深）' },
      { dr: 0.22, matk: 280, enrage: 0.3, enrageMul: 1.5, affix: '六耳·心猿怒相（终相·狂暴）' },
    ],
  },
  // 牛魔王（火焰山）：本相 → 魔躯 → 狂暴
  '牛魔王': {
    name: '牛魔王 · 大力王',
    phases: [
      { name: '牛魔王 · 本相', dao: '初',
        desc: '积雷山摩云洞前，牛魔王现出本相，双角如戟。他哼一声："俺老牛与那猴子结拜一场，今日倒要看看，他的传人有多大本事！"',
        hp: 2900, atk: 340, dr: 0.16, matk: 220, mdef: 0.18, affix: '大力·本相（初相·体攻为主）' },
      { name: '牛魔王 · 魔躯', dao: '魔',
        desc: '他摇身一变，化作千丈魔躯，踏碎山岳。芭蕉扇扇不灭他心头火，反助他魔焰更炽。',
        hp: 3400, atk: 400, dr: 0.20, matk: 260, mdef: 0.22, affix: '大力·魔躯（中相·护甲暴涨）' },
      { name: '牛魔王 · 狂暴', dao: '狂',
        desc: '魔躯再变，牛魔王双目赤红，鼻喷烈焰："俺老牛一生不服天、不服地——今日，也不服你这取经人！"',
        hp: 4000, atk: 470, dr: 0.24, matk: 300, mdef: 0.26, affix: '大力·狂暴（终相·狂暴）' },
    ],
    overrides: [
      null,
      { dr: 0.20, matk: 260, enrage: 0.3, enrageMul: 1.5, affix: '大力·魔躯（中相·护甲暴涨）' },
      { dr: 0.24, matk: 300, enrage: 0.3, enrageMul: 1.5, affix: '大力·狂暴（终相·狂暴）' },
    ],
  },
  // 大鹏金翅雕（狮驼岭）：金翅 → 云程万里 → 吞天
  '大鹏金翅雕': {
    name: '大鹏金翅雕 · 云程万里',
    phases: [
      { name: '大鹏金翅雕 · 金翅', dao: '初',
        desc: '狮驼岭头，金翅大鹏敛翅而立。他俯视你，如看蝼蚁："狮驼国八百里，皆是我口中食——你也要来填这一口？"',
        hp: 3500, atk: 420, dr: 0.16, matk: 270, mdef: 0.18, affix: '大鹏·金翅（初相·身法为主）' },
      { name: '大鹏金翅雕 · 云程万里', dao: '云',
        desc: '他振翅一扇，云程万里，天地倒转。你追不上他的影子——他快得连影子都追不上。',
        hp: 4200, atk: 490, dr: 0.20, matk: 320, mdef: 0.22, affix: '大鹏·云程万里（中相·身法暴涨）' },
      { name: '大鹏金翅雕 · 吞天', dao: '吞',
        desc: '他张口一吸，山河倒卷。这一口，连如来都曾被他吞入腹中——如今，轮到你了。',
        hp: 4800, atk: 570, dr: 0.24, matk: 370, mdef: 0.26, affix: '大鹏·吞天（终相·狂暴）' },
    ],
    overrides: [
      null,
      { dr: 0.20, matk: 320, enrage: 0.3, enrageMul: 1.5, affix: '大鹏·云程万里（中相·身法暴涨）' },
      { dr: 0.24, matk: 370, enrage: 0.3, enrageMul: 1.5, affix: '大鹏·吞天（终相·狂暴）' },
    ],
  },
  // 狮驼岭·三魔拦路（狮驼岭）：青毛狮子怪 → 黄牙老象 → 大鹏金翅雕（三魔轮转）
  '狮驼岭·三魔拦路': {
    name: '狮驼岭 · 三魔拦路',
    phases: [
      { name: '狮驼岭 · 青毛狮子怪', dao: '青狮',
        desc: '狮驼岭头，青毛狮子怪拦路而笑："我乃文殊菩萨坐骑，下界为妖——你这取经人，也配过我这八百里狮驼岭？"他张口一吸，山河倒卷，要把你连人带马吞入腹中。',
        hp: 3200, atk: 380, dr: 0.15, matk: 240, mdef: 0.17, affix: '狮驼·青毛狮（初相·蛮力为主）' },
      { name: '狮驼岭 · 黄牙老象', dao: '白象',
        desc: '青狮败退，黄牙老象踏云而上，长鼻如鞭。他原是普贤菩萨坐骑，与青狮同下界为妖。他长鼻一卷，要把你卷到半空，摔个粉身碎骨。',
        hp: 3800, atk: 440, dr: 0.19, matk: 280, mdef: 0.21, affix: '狮驼·黄牙象（中相·防高攻猛）' },
      { name: '狮驼岭 · 大鹏金翅雕', dao: '大鹏',
        desc: '白象又败，大鹏金翅雕振翅而起，翼遮日月。他是如来佛祖的娘舅，一扇九万里，两扇就追上悟空。他俯视你，如看蝼蚁："狮驼国八百里，皆是我口中食——你也要来填这一口？"',
        hp: 4500, atk: 520, dr: 0.23, matk: 340, mdef: 0.25, affix: '狮驼·大鹏雕（终相·身法暴涨）' },
    ],
    overrides: [
      null,
      { dr: 0.19, matk: 280, enrage: 0.3, enrageMul: 1.5, affix: '狮驼·黄牙象（中相·防高攻猛）' },
      { dr: 0.23, matk: 340, enrage: 0.3, enrageMul: 1.5, affix: '狮驼·大鹏雕（终相·身法暴涨）' },
    ],
  },
  // 通天河老鼋·湿经（凌云渡·终局）：负经 → 问寿 → 覆舟
  '通天河老鼋·湿经': {
    name: '通天河老鼋 · 覆舟',
    phases: [
      { name: '通天河老鼋 · 负经', dao: '初',
        desc: '通天河畔，老鼋浮出水面，背负真经："我驮你们过河，只问一句——可替我向如来问过寿数？"',
        hp: 5200, atk: 620, dr: 0.18, matk: 400, mdef: 0.20, affix: '老鼋·负经（初相·水覆为怒）' },
      { name: '通天河老鼋 · 问寿', dao: '问',
        desc: '你答不出那一句。老鼋长叹一声，河水倒流，真经尽湿："千年修行，只求一问——你们这些取经人，何曾把我放在心上？"',
        hp: 6200, atk: 720, dr: 0.22, matk: 470, mdef: 0.24, affix: '老鼋·问寿（中相·水怒渐深）' },
      { name: '通天河老鼋 · 覆舟', dao: '覆',
        desc: '它再不言语，翻覆沉河。通天河水化作千丈怒涛，要连人带经，一并沉入这最后一难。',
        hp: 7200, atk: 850, dr: 0.26, matk: 540, mdef: 0.28, affix: '老鼋·覆舟（终相·狂暴）' },
    ],
    overrides: [
      null,
      { dr: 0.22, matk: 470, enrage: 0.3, enrageMul: 1.5, affix: '老鼋·问寿（中相·水怒渐深）' },
      { dr: 0.26, matk: 540, enrage: 0.3, enrageMul: 1.5, affix: '老鼋·覆舟（终相·狂暴）' },
    ],
  },
  // V8.41 9个数值兜底boss基础两阶段形态框架（后续可细化专属叙事与机制）
  '刘洪·江流索命': {
    name: '刘洪 · 江流索命',
    phases: [
      { name: '刘洪 · 水贼头目', dao: '初', desc: '江风萧瑟，水贼刘洪持刀拦路。他杀了你生父，夺了你生母——这一世的血债，要从这一刀算起。', hp: 2500, atk: 120, dr: 0.10, matk: 50, mdef: 0.12, affix: '刘洪·水贼（初相·体攻为主）' },
      { name: '刘洪 · 亡命反扑', dao: '终', desc: '他见势不妙，拔刀拼命。江水染红，他嘶吼着扑来——这是水贼的末路，也是你西行的第一笔血债。', hp: 3500, atk: 150, dr: 0.15, matk: 60, mdef: 0.16, affix: '刘洪·亡命（终相·狂暴）' },
    ],
    overrides: [null, { dr: 0.15, enrage: 0.3, enrageMul: 1.5, affix: '刘洪·亡命（终相·狂暴）' }],
  },
  '流沙河·沙僧': {
    name: '沙僧 · 流沙河',
    phases: [
      { name: '沙僧 · 卷帘大将', dao: '初', desc: '流沙河水深百丈，一个红发蓝脸的妖怪从河中跃起，项下挂着九个骷髅。他本是天庭卷帘大将，被贬下凡，占了流沙河——这是你西行的第三个徒弟。', hp: 1200, atk: 140, dr: 0.14, matk: 60, mdef: 0.16, affix: '沙僧·卷帘（初相·体攻为主）' },
      { name: '沙僧 · 降妖宝杖', dao: '终', desc: '他见你神通广大，收起宝杖，跪倒在地："弟子愿随师父西行，将功折罪。"九个骷髅化作法船，渡你过了流沙河。', hp: 1500, atk: 170, dr: 0.18, matk: 70, mdef: 0.20, affix: '沙僧·归降（终相·收徒）' },
    ],
    overrides: [null, { dr: 0.18, enrage: 0.3, enrageMul: 1.5, affix: '沙僧·归降（终相·收徒）' }],
  },
  '镇元子·人参果树': {
    name: '镇元子 · 人参果树',
    phases: [
      { name: '镇元子 · 地仙之祖', dao: '初', desc: '五庄观中，一个老道袖手而立。他是地仙之祖镇元子，与三清同辈。你徒弟偷吃了他的人参果，推倒了他的仙树——这一战，是你西行最大的祸事。', hp: 1800, atk: 200, dr: 0.20, matk: 120, mdef: 0.22, affix: '镇元子·地仙（初相·法攻为主）' },
      { name: '镇元子 · 袖里乾坤', dao: '终', desc: '他大袖一展，乾坤尽入袖中。你师徒四人连同白龙马，一并被他收入袖里——这是地仙之祖的神通，非你所能敌。', hp: 2200, atk: 240, dr: 0.24, matk: 150, mdef: 0.26, affix: '镇元子·乾坤（终相·狂暴）' },
    ],
    overrides: [null, { dr: 0.24, matk: 150, enrage: 0.3, enrageMul: 1.5, affix: '镇元子·乾坤（终相·狂暴）' }],
  },
  '金鱼精·灵感大王': {
    name: '金鱼精 · 灵感大王',
    phases: [
      { name: '灵感大王 · 金鱼精', dao: '初', desc: '通天河结冰，一个金鱼精从冰下钻出。他本是观音菩萨莲花池里的金鱼，偷跑下凡，占了通天河，每年要吃一对童男童女——这一战，是为了救陈家庄的孩子。', hp: 1600, atk: 180, dr: 0.16, matk: 100, mdef: 0.18, affix: '金鱼精·灵感（初相·水攻为主）' },
      { name: '灵感大王 · 冰封通天河', dao: '终', desc: '他口吐寒气，通天河冰封千里。你师徒四人被困冰上，他从冰下钻出，要把你们一并冻成冰雕——这是金鱼精的本命神通。', hp: 2000, atk: 220, dr: 0.20, matk: 130, mdef: 0.22, affix: '金鱼精·冰封（终相·狂暴）' },
    ],
    overrides: [null, { dr: 0.20, matk: 130, enrage: 0.3, enrageMul: 1.5, affix: '金鱼精·冰封（终相·狂暴）' }],
  },
  '女儿国·蝎子精': {
    name: '蝎子精 · 琵琶洞',
    phases: [
      { name: '蝎子精 · 毒敌山', dao: '初', desc: '女儿国西，毒敌山琵琶洞，一个蝎子精把你掳走。她曾在雷音寺听经，被如来推了一把，回头蜇了如来手指——连如来都怕她的毒，何况是你。', hp: 1700, atk: 190, dr: 0.18, matk: 110, mdef: 0.20, affix: '蝎子精·毒敌（初相·毒攻为主）' },
      { name: '蝎子精 · 倒马毒桩', dao: '终', desc: '她尾钩一甩，倒马毒桩刺来。这毒连金刚都怕，你悟空铜头铁脑也被蜇得疼痛难忍——这是西行路上最毒的妖怪。', hp: 2100, atk: 230, dr: 0.22, matk: 140, mdef: 0.24, affix: '蝎子精·倒马毒（终相·狂暴）' },
    ],
    overrides: [null, { dr: 0.22, matk: 140, enrage: 0.3, enrageMul: 1.5, affix: '蝎子精·倒马毒（终相·狂暴）' }],
  },
  '九头虫·碧波潭': {
    name: '九头虫 · 碧波潭',
    phases: [
      { name: '九头虫 · 碧波潭驸马', dao: '初', desc: '祭赛国金光寺，宝塔上的佛宝舍利被九头虫偷走。他是碧波潭万圣龙王的女婿，九个头，神通广大——这一战，是为了夺回佛宝，洗刷金光寺僧人的冤屈。', hp: 2000, atk: 220, dr: 0.20, matk: 130, mdef: 0.22, affix: '九头虫·碧波（初相·多头攻击）' },
      { name: '九头虫 · 九头齐出', dao: '终', desc: '他九个头一齐伸出，九种神通齐发。你悟空八戒联手，也只能与他打个平手——这是西行路上最凶悍的妖怪之一。', hp: 2500, atk: 270, dr: 0.24, matk: 160, mdef: 0.26, affix: '九头虫·九头（终相·狂暴）' },
    ],
    overrides: [null, { dr: 0.24, matk: 160, enrage: 0.3, enrageMul: 1.5, affix: '九头虫·九头（终相·狂暴）' }],
  },
  '白鹿国丈·寿星坐骑': {
    name: '白鹿精 · 比丘国',
    phases: [
      { name: '白鹿精 · 比丘国丈', dao: '初', desc: '比丘国中，一个老道自称国丈，要用一千一百一十一个小儿的心肝做药引。他本是南极寿星的坐骑白鹿，偷跑下凡，作孽多端——这一战，是为了救比丘国的孩子。', hp: 1900, atk: 210, dr: 0.20, matk: 120, mdef: 0.22, affix: '白鹿精·国丈（初相·法攻为主）' },
      { name: '白鹿精 · 寿星拐杖', dao: '终', desc: '他现出原形，一只白鹿，口吐人言，手持寿星拐杖。这拐杖是南极寿星的宝物，神通不小——这是坐骑下凡作乱的典型。', hp: 2300, atk: 250, dr: 0.24, matk: 150, mdef: 0.26, affix: '白鹿精·拐杖（终相·狂暴）' },
    ],
    overrides: [null, { dr: 0.24, matk: 150, enrage: 0.3, enrageMul: 1.5, affix: '白鹿精·拐杖（终相·狂暴）' }],
  },
  '假公主·玉兔': {
    name: '玉兔精 · 天竺国',
    phases: [
      { name: '玉兔精 · 天竺公主', dao: '初', desc: '天竺国，一个公主抛绣球招亲，打中了你取经人。她本是广寒宫捣药的玉兔，偷跑下凡，要报素娥仙子一掌之仇——这一战，是为了救你师父，也是为了了结广寒宫的旧怨。', hp: 2100, atk: 230, dr: 0.22, matk: 140, mdef: 0.24, affix: '玉兔精·公主（初相·捣药杵攻击）' },
      { name: '玉兔精 · 广寒捣药', dao: '终', desc: '她现出原形，一只玉兔，手持捣药杵。这杵是广寒宫的宝物，能捣出仙药，也能砸出神通——这是月宫仙子的坐骑作乱。', hp: 2600, atk: 280, dr: 0.26, matk: 170, mdef: 0.28, affix: '玉兔精·捣药（终相·狂暴）' },
    ],
    overrides: [null, { dr: 0.26, matk: 170, enrage: 0.3, enrageMul: 1.5, affix: '玉兔精·捣药（终相·狂暴）' }],
  },
  '传经吏·索经': {
    name: '传经吏 · 灵山索经',
    phases: [
      { name: '传经吏 · 索人事', dao: '初', desc: '灵山雷音寺，两位传经吏传经，却向你索要"人事"。你师徒四人穷得叮当响，只有一个紫金钵盂——这是西天取经的最后一关，也是最讽刺的一关。', hp: 2400, atk: 260, dr: 0.24, matk: 160, mdef: 0.26, affix: '传经吏·索经（初相·佛攻为主）' },
      { name: '传经吏 · 无字真经', dao: '终', desc: '你不给人事，他们便传你无字真经。你师徒四人捧着白纸回东土，才发现上了当——这是西天的"人事"规矩，灵山也不免俗。', hp: 3000, atk: 320, dr: 0.28, matk: 200, mdef: 0.30, affix: '传经吏·无字（终相·狂暴）' },
    ],
    overrides: [null, { dr: 0.28, matk: 200, enrage: 0.3, enrageMul: 1.5, affix: '传经吏·无字（终相·狂暴）' }],
  },
};

// 通用三段变身装配：返回 { name, stages, phaseOverrides, phase2Override, stageRewards, descs, daos }
//   bossName 无三段登记 → 返回 null（走战斗默认两相）。
//   白骨夫人·五行归墟额外依六道命数（fate）决定开场叙事道相（沿用 baiguFormForFate 的判定）。
NDX.bossStageSetup = function (bossName, fate) {
  const cfg = NDX.BOSS_FORMS && NDX.BOSS_FORMS[bossName];
  if (!cfg) return null;
  const ps = cfg.phases;
  const stages = ps.map((p) => p.hp);
  const overrides = cfg.overrides || [null];
  const phaseOverrides = [null];
  const phaseStats = [null];
  for (let i = 1; i < ps.length; i++) {
    phaseOverrides.push(overrides[i] || null);
    // 逐阶段完整面板覆盖（atk/matk/mdef/dr/affix），供 combat.js calcMultiStage 按阶段套用
    phaseStats.push({
      atk: ps[i].atk, matk: ps[i].matk, mdef: ps[i].mdef, dr: ps[i].dr, affix: ps[i].affix,
    });
  }
  const stageRewards = ps.map((p, i) => ({
    claim: { gold: 120 + i * 40, ling: 30 + i * 10, note: `${p.dao}相·破韧厚赏` },
    idle: { gold: 30 + i * 10, note: `${p.dao}相·挂机兜底` },
  }));
  const setup = {
    name: cfg.name,
    stages,
    phaseOverrides,
    phaseStats,
    phase2Override: phaseOverrides[1] || null,
    stageRewards,
    descs: ps.map((p) => p.desc),
    daos: ps.map((p) => p.dao),
    names: ps.map((p) => p.name),
    p1: ps[0], // 阶段1 基础面板（game.js 装配 Boss 时作为首相数值）
  };
  // 白骨夫人：开场道相依六道命数显化（沿用原单相机制的道相判定，仅作叙事）
  if (bossName === '五行归墟' && NDX.baiguFormForFate) {
    const form = NDX.baiguFormForFate(fate);
    setup.fateDao = form.dao;
    setup.fateDesc = form.desc;
    setup.fateName = form.name;
  }
  return setup;
};

// =============================================================
//  接引使者 · 教学战怪物（V8.30 开局流程重构）
//  玩家首战对手：3-4 回合可击败，无特殊机制，纯教学攻/经/绝三键。
//  属性不随难度缩放（开局固定），血量 = 玩家普攻 × 3.5，攻击 = 玩家气血 × 10%。
// =============================================================
NDX.TUTORIAL_MONSTER = {
  name: '接引使者',
  type: 'mob',
  // 基础属性（fight() 会按 diff=1 做温和缩放，但教学战已设 alreadyScaled=true 跳过缩放）
  // V8.44 教学战脚本化：血条设为大数值（「血条无上限」感），攻/经在四回合内无法击杀，
  //             完整剧本由 game.js「绝招必杀」保证只有点【绝】方能终结，见 applyActiveSkill。
  hp: 2500,    // 大血条：绝招前攻/经只能削去零头，怪物保持存活
  atk: 12,     // 约玩家气血10%（玩家开局气血约300-400），3回合仅扣36，不致命
  matk: 6,     // 愿伤极低，教学战不构成威胁
  dr: 0.02,    // 减伤极低：让玩家攻/经的伤害肉眼可见地打在血条上（但打不死）
  mdef: 0.02,  // 法防极低
  boss: false,
  tags: ['佛门'],
  heavyEvery: 0,   // 无蓄力重击（教学战不引入识破机制）
  heavyMult: 1.0,
  // 教学战标记：跳过词缀附加、跳过小怪节奏校准
  tutorial: true,
};

// =============================================================
// V8.37 敌人行为原型（Behavior Prototypes）
// 定义4种敌人行为模式，提升战斗质感，不改数值只加框架。
// 每个原型定义：telegraph周期、特殊行为、玩家可反制窗口。
// combat.js 中根据 enemy.behavior 字段触发对应行为。
// =============================================================
NDX.BEHAVIOR_PROTOTYPES = {
  // 冲锋型：奇数回合蓄力，偶数回合冲锋（高伤害+破韧）
  // 玩家可在蓄力回合识破/闪避反制
  charger: {
    name: '冲锋型',
    desc: '蓄力→冲锋，高伤害破韧',
    chargeEvery: 2,        // 每2回合蓄力一次
    chargeTelegraph: true, // 蓄力回合telegraph提示
    chargeBonus: { break: 0.3, dmgMult: 1.4 }, // 冲锋额外效果
  },
  // 守护型：每4回合进入防御姿态（减伤50%+反伤），持续1回合
  // 玩家可在防御回合用破韧技能或等待
  guardian: {
    name: '守护型',
    desc: '周期性防御，减伤反伤',
    guardEvery: 4,         // 每4回合防御一次
    guardDuration: 1,       // 持续1回合
    guardBonus: { dr: 0.5, reflect: 0.2 }, // 防御额外效果
  },
  // 法术型：每3回合施放法术（AOE或减益），法术回合telegraph
  // 玩家可在法术回合打断/闪避
  caster: {
    name: '法术型',
    desc: '周期性施法，AOE减益',
    castEvery: 3,          // 每3回合施法一次
    castTelegraph: true,   // 施法回合telegraph提示
    castTypes: ['aoe', 'debuff', 'dot'], // 法术类型池
  },
  // 减益型：每4回合施放减益（降低玩家攻击/防御），持续2回合
  // 玩家可在施法回合打断
  debuffer: {
    name: '减益型',
    desc: '周期性施减益，削弱玩家',
    debuffEvery: 4,        // 每4回合施减益一次
    debuffDuration: 2,      // 持续2回合
    debuffTypes: ['atkDown', 'defDown', 'evaDown'], // 减益类型池
  },

  // —— V8.42 新增行为原型：狂暴型 / 治疗型 / 暗杀型 ——
  // 狂暴型：血量低于50%时进入狂暴，攻击+30%，攻击频率+1，蓄力周期缩短
  berserker: {
    name: '狂暴型',
    desc: '低血狂暴，攻频倍增',
    berserkThreshold: 0.5,  // 血量低于50%触发狂暴
    berserkAtkMul: 1.3,     // 狂暴攻击倍率
    berserkHeavyEvery: 2,    // 狂暴时蓄力周期缩短为2
    berserkPattern: ['atk', 'atk', 'heavy', 'multi'], // 狂暴时攻击模式
  },
  // 治疗型：每5回合回血一次，回血回合telegraph，玩家可集火打断
  healer: {
    name: '治疗型',
    desc: '周期性回血，集火打断',
    healEvery: 5,            // 每5回合回血一次
    healTelegraph: true,     // 回血回合telegraph提示
    healPct: 0.15,           // 回血量=最大气血15%
    healMinion: true,        // 同时治疗随从
  },
  // 暗杀型：高暴击高闪避，每3回合进入潜行（下次攻击必暴击+破韧）
  assassin: {
    name: '暗杀型',
    desc: '潜行暴击，高闪高暴',
    stealthEvery: 3,          // 每3回合潜行一次
    stealthTelegraph: false,  // 潜行不telegraph（暗杀特性）
    stealthCritMul: 2.0,      // 潜行后攻击暴击倍率
    stealthBreak: 0.5,         // 潜行后攻击破韧+50%
    baseEva: 0.25,             // 基础闪避25%
    baseCrit: 0.20,            // 基础暴击20%
  },
};

// 行为原型分配表：精英怪/Boss名 → 行为原型
// 未分配的敌人默认使用普通攻击+蓄力重击（原有逻辑）
NDX.ENEMY_BEHAVIOR_MAP = {
  // 精英怪行为分配
  '黄风卷岭': 'caster',      // 黄风怪：法术型（吹风）
  '高老招亲': 'charger',     // 猪八戒：冲锋型（蛮力）
  '金角银角': 'debuffer',    // 金角银角：减益型（法宝）
  '乌巢禅师': 'guardian',    // 乌巢禅师：守护型（防御）
  '狮驼初现': 'charger',     // 青狮白象：冲锋型（蛮力）
  '金兜洞·青牛精': 'guardian', // 青牛精：守护型（金刚琢防御）
  '白虎岭·白骨精': 'debuffer', // 白骨精：减益型（妖气）
  '碗子山·黄袍怪': 'charger',  // 黄袍怪：冲锋型（蛮力）
  '乌鸡国·青毛狮': 'guardian', // 青毛狮：守护型（伪装）
  '毒敌山·蝎子精': 'debuffer', // 蝎子精：减益型（毒）
  '火焰山·铁扇公主': 'caster', // 铁扇公主：法术型（芭蕉扇）
  '祭赛国·九头虫': 'charger',  // 九头虫：冲锋型（蛮力）
  // Boss行为分配（后续逐步添加）
};

// 获取敌人行为原型
NDX.getEnemyBehavior = function (enemyName) {
  if (!enemyName) return null;
  var key = NDX.ENEMY_BEHAVIOR_MAP[enemyName];
  if (!key) return null;
  return NDX.BEHAVIOR_PROTOTYPES[key] || null;
};

// =============================================================
// 精英怪数据库（独立可调参数源）
// 键 = 精英名（与 MAP_PLAN / MAP_PLAN_CH1 的 elite 节点 name 对应）。
// 修改精英的难度/掉落装备/掉落材料，直接编辑对应条目即可。
// =============================================================
NDX.ELITE_TABLE = {
  // tags：阵营标签（供法宝「克制 counter」命中）；heavyEvery：蓄力重击周期（触发识破窗口）；heavyMult：蓄力重击倍率
  '黄风卷岭': { name: '黄风卷岭', diff: 3,  tags: ['妖'],   heavyEvery: 3, heavyMult: 1.6, drop: ['set_armor_base', 'set_weapon_base', '玄武·鳞', '玄武·心', '破军·锋', '破军·脊'] },
  '高老招亲': { name: '高老招亲', diff: 8,  tags: ['妖'],   heavyEvery: 3, heavyMult: 1.6, drop: ['wk_crown_base', 'wk_armor_base', 'wk_staff_base', '冠·翎', '冠·金', '甲·环', '甲·金', '棒·定海', '棒·神铁'], material: '翠兰绣帕' },
  '金角银角': { name: '金角银角', diff: 11, tags: ['天庭'], heavyEvery: 3, heavyMult: 1.7, drop: ['set_treasure_base', 'pj_armor_base', 'pj_treasure_base', '贪狼·牙', '贪狼·瞳', '破军·铠', '破军·骨', '破军·印', '破军·魄'],
    // V9.x 专属脚本：金银双怪轮转 —— 紫金红葫芦/羊脂玉净瓶交替吸摄（buff 叠攻）→ 兵器齐出（multi）
    // P1-1 随从：精细鬼/伶俐虫先行挡刀（30% 本体血），先破胆再打双怪本体
    minion: { name: '精细鬼/伶俐虫', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'multi', 'atk', 'buff', 'heavy', 'multi'], guardPct: 0.30, buffAtkPct: 0.25 } },
  '乌巢禅师': { name: '乌巢禅师', diff: 16, tags: ['佛门'], heavyEvery: 4, heavyMult: 1.6, drop: ['de_t_base', 'bj_rake_base', 'bj_robe_base', 'bj_belly_base', '耙·齿', '耙·柄', '衣·棉', '衣·戒', '腹·膘', '腹·福'], material: '乌巢心经' },
  '狮驼初现': { name: '狮驼初现', diff: 19, tags: ['妖'],   heavyEvery: 3, heavyMult: 1.7, drop: ['lm_saddle_base', 'lm_scale_base', 'lm_hoof_base', '鞍·云', '鞍·风', '鳞·逆', '鳞·寒', '蹄·疾', '蹄·雷'], material: '阴阳二气瓶' },
  // 第15层精英：青牛精提前登场，让玩家预习"金刚琢套走兵器"机制（破韧+缴械），为第二章关隘老君战铺垫
  '金兜洞·青牛精': { name: '金兜洞·青牛精', diff: 15, tags: ['天庭'], heavyEvery: 3, heavyMult: 1.8, jinguo: true, drop: ['wk_staff_base', '棒·定海', '棒·神铁'], material: '兜率火',
    // V9.x 专属脚本：金刚琢预习 —— 与第二章关隘 Boss 同主题简化版（guard 套兵器 → heavy 反打 → multi 兵器齐飞）
    // P1-1 随从：看炉小妖挡刀（25% 本体血）—— 预习"先破随从再打本体"的肉盾节奏
    minion: { name: '看炉小妖', hpPct: 0.25 },
    behavior: { mode: 'pattern', pattern: ['guard', 'atk', 'heavy', 'multi', 'atk'], guardPct: 0.35, buffAtkPct: 0.2 } },
  // —— V8.37 精英怪扩充：新增6个经典西游妖怪精英战 ——
  '白虎岭·白骨精': { name: '白虎岭·白骨精', diff: 5, tags: ['妖', '鬼'], heavyEvery: 3, heavyMult: 1.5, drop: ['set_armor_base', 'set_weapon_base', '白骨·爪', '白骨·心'], material: '白骨舍利',
    // V9.x 专属脚本：三戏白骨精 —— 遁形（guard）/骨爪连击（multi）/夺命重击（heavy），教学精英展示脚本化节奏
    behavior: { mode: 'pattern', pattern: ['atk', 'guard', 'atk', 'multi', 'heavy'], guardPct: 0.30, buffAtkPct: 0.2 } },
  '碗子山·黄袍怪': { name: '碗子山·黄袍怪', diff: 7, tags: ['天庭', '妖'], heavyEvery: 3, heavyMult: 1.6, drop: ['wk_crown_base', 'wk_armor_base', '黄袍·翎', '黄袍·金'], material: '舍利子玲珑内丹' },
  '乌鸡国·青毛狮': { name: '乌鸡国·青毛狮', diff: 10, tags: ['天庭', '妖'], heavyEvery: 3, heavyMult: 1.7, drop: ['set_treasure_base', 'pj_armor_base', '狮·鬃', '狮·牙'], material: '金丹' },
  '毒敌山·蝎子精': { name: '毒敌山·蝎子精', diff: 13, tags: ['妖'], heavyEvery: 2, heavyMult: 1.6, poison: true, drop: ['de_t_base', 'bj_rake_base', '蝎·尾', '蝎·甲'], material: '倒马毒桩',
    // V9.x 专属脚本：倒马毒桩 —— 高频蓄力蛰刺（heavy 频率对齐 heavyEvery=2）→ 尾针连刺（multi）
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'atk', 'heavy', 'multi'], guardPct: 0.25, buffAtkPct: 0.2 } },
  '火焰山·铁扇公主': { name: '火焰山·铁扇公主', diff: 17, tags: ['妖', '罗刹'], heavyEvery: 4, heavyMult: 1.7, drop: ['lm_saddle_base', 'lm_scale_base', '芭蕉·叶', '芭蕉·灵'], material: '芭蕉扇',
    // V9.x 专属脚本：芭蕉扇风 —— 扇风助火（buff 叠攻）→ 风刃重击（heavy）→ 风卷连击（multi），低血切「三扇风火」
    behavior: { mode: 'pattern', pattern: ['atk', 'buff', 'atk', 'heavy', 'multi'], stagePatterns: { 0.30: ['heavy', 'multi', 'buff'] }, guardPct: 0.30, buffAtkPct: 0.25 } },
  '祭赛国·九头虫': { name: '祭赛国·九头虫', diff: 18, tags: ['妖', '水'], heavyEvery: 3, heavyMult: 1.8, drop: ['set_weapon_base', 'wk_staff_base', '九头·羽', '九头·珠'], material: '佛宝舍利',
    // P1-1 随从：碧波潭虾兵蟹将挡刀（25% 本体血）—— 九头虫本体被水族簇拥，先清杂再斩首
    minion: { name: '虾兵蟹将', hpPct: 0.25 } },
};

// =============================================================
// 关隘 Boss 数据库（独立可调参数源）
// 键 = Boss 名（game.js 用 NDX.bossNameForAct(act) 赋名，MAP_PLAN 的 boss 节点 name 仅作回退）。
// 修改关隘 Boss 难度/掉落，直接编辑对应条目；跨章 Boss 名见 NDX.BOSS_NAMES。
// =============================================================
NDX.BOSS_TABLE = {
  // tags：阵营标签（供法宝「克制 counter」命中）；heavyEvery：蓄力重击周期（触发识破窗口）；heavyMult：蓄力重击倍率
  // V8.33 第一章关隘 Boss：刘洪·江流索命（难4·大唐境内·水贼刘洪）
  //   作为新手第一章 Boss，蓄力周期从默认 4 降到 3（更频繁、节奏更清晰，教玩家识破蓄力），
  //   蓄力倍率从默认 1.6 降到 1.4（温和，新手扛得住，避免第一章 Boss 暴毙）。
  //   阵营 tags 修正为 ['人','水贼']（默认 Boss 是 ['天庭']，与刘洪身份不符）。
  '刘洪·江流索命': {
    name: '刘洪·江流索命',
    diff: 4,
    tags: ['人', '水贼'],
    heavyEvery: 3,
    heavyMult: 1.4,
    // V9.x 专属行为脚本：第一章首个 Boss，教「识破」节奏 —— 3 回合一个蓄力重击 + 间隔铁壁蓄势，
    // 让玩家掌握"蓄力→识破反制 / 蓄势→趁机输出"的取舍。behavior 存在时 heavy 由脚本驱动（周期恰与 heavyEvery 对齐）。
    behavior: { mode: 'pattern', pattern: ['atk', 'guard', 'heavy'], guardPct: 0.30, buffAtkPct: 0.2 },
    desc: '水贼刘洪杀状元陈光蕊，占其妻殷温娇，冒名赴任江州。十八年后，江流儿寻亲报冤——这是你西行前最后的人间债。蓄力重击时可识破反制。',
  },
  '黄风大圣': { name: '黄风大圣', diff: 9,  tags: ['妖'],   heavyEvery: 3, heavyMult: 1.7,
    // V9.x 专属脚本：三昧神风 —— 风起（buff 叠攻）→ 风袭（重击）→ 蓄势，低血切「狂暴风眼」重击连发
    // P1-1 随从：虎先锋挡刀（20% 本体血）—— 第二章首个带随从 Boss，温和教学"先破胆再打本体"
    minion: { name: '虎先锋', hpPct: 0.20 },
    behavior: { mode: 'pattern', pattern: ['atk', 'buff', 'atk', 'heavy', 'guard'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'buff'] }, guardPct: 0.35, buffAtkPct: 0.25 },
    desc: '黄风怪三形态抉择战：妖鼠本相→三昧神风·失忆形→黄风大圣·狂形。' },
  '五行归墟': { name: '五行归墟', diff: 18, tags: ['魔'],   heavyEvery: 4, heavyMult: 1.7,
    // V9.x 专属脚本：白骨三戏 —— 蓄势/重击/连击/暴涨轮转（呼应三戏轮转设计），低血切「尸魔夺命」重击+连击连发
    behavior: { mode: 'pattern', pattern: ['atk', 'guard', 'heavy', 'multi', 'buff'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'guard'] }, guardPct: 0.40, buffAtkPct: 0.25 } },
  '五行归墟·大圣残躯': { name: '五行归墟·大圣残躯', diff: 20, tags: ['魔'], heavyEvery: 4, heavyMult: 1.8,
    // V9.x 专属脚本：残躯搏命 —— 重击/连击密度更高，低血切「无字杀伐」连击+暴涨
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'multi', 'buff', 'heavy'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'buff'] }, guardPct: 0.40, buffAtkPct: 0.30 } },
  // 第二章准 Boss / 最终 Boss（第40难青牛、第41难老君，呼应天庭征伐主题）
  '青牛精·独角兕':      { name: '青牛精·独角兕', diff: 38, tags: ['天庭'], heavyEvery: 3, heavyMult: 1.9, jinguo: true,
    // V9.x 专属脚本：金刚琢套尽三界兵器 —— 套走兵器（guard 蓄势）→ 兵器反打（heavy）→ 兵器齐飞（multi），
    // 低血切「独角冲撞」重击连发；guardPct 偏高呼应金刚琢护体（破韧+缴械须以非兵器手段破业障槽）。
    // P1-1 随从：看炉小童挡刀（35% 本体血）—— 青牛精被兜率宫看炉小童簇拥
    minion: { name: '看炉小童', hpPct: 0.35 },
    behavior: { mode: 'pattern', pattern: ['guard', 'atk', 'guard', 'heavy', 'multi', 'atk'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'guard'] }, guardPct: 0.40, buffAtkPct: 0.25 },
    desc: '金刚琢套尽三界兵器：破韧+缴械，二阶段无敌帧须以非兵器手段破业障槽。' },
  '太上老君化身':       { name: '太上老君化身', diff: 40, tags: ['天庭'], heavyEvery: 4, heavyMult: 1.9, jinguo: true,
    // V9.x 专属脚本：丹炉真火 —— 添火炼丹（buff 叠攻）→ 炉火灼烧 → 爆炉（heavy）→ 丹火连燃（multi），
    // buffAtkPct 偏高：老君越炼越猛，逼迫玩家优先拆 buff 窗口。
    behavior: { mode: 'pattern', pattern: ['atk', 'buff', 'atk', 'heavy', 'buff', 'multi'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'buff', 'atk'] }, guardPct: 0.35, buffAtkPct: 0.30 },
    desc: '丹炉真火炼万物：高阶法伤 Boss，二阶段焚尽法宝 CD。' },
  '火焰山·牛魔王':      { name: '火焰山·牛魔王', diff: 60, tags: ['妖'], heavyEvery: 4, heavyMult: 1.8,
    // V9.x 专属脚本：魔王力沉 —— 牛角顶（atk）/踏地（heavy）/皮厚（guard）/连顶（multi），
    // 低血切「魔焰踏地」重击连发。
    // P1-1 随从：玉面狐狸精挡刀（40% 本体血）—— 牛魔王风月场合驱媚，先驱散侧室再战正主
    minion: { name: '玉面狐狸精', hpPct: 0.40 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'guard', 'atk', 'multi', 'heavy'], stagePatterns: { 0.30: ['heavy', 'heavy', 'multi', 'atk'] }, guardPct: 0.40, buffAtkPct: 0.25 } },
  '狮驼岭·三魔拦路':    { name: '狮驼岭·三魔拦路', diff: 60, tags: ['妖'], heavyEvery: 4, heavyMult: 1.8,
    // V9.x 专属脚本：青狮/白象/大鹏三魔轮转 —— 连击密度高（multi 频繁），低血切「三魔齐喙」连击+重击
    // P1-1 随从：小钻风挡刀（30% 本体血）—— 狮驼岭小妖簇拥"大王叫我来巡山"
    minion: { name: '小钻风', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'multi', 'atk', 'heavy', 'multi', 'buff'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'heavy', 'buff'] }, guardPct: 0.35, buffAtkPct: 0.25 } },
  '凌云渡·金蝉脱壳':    { name: '凌云渡·金蝉脱壳', diff: 80, tags: ['佛门'], heavyEvery: 5, heavyMult: 1.7,
    // V9.x 专属脚本：金蝉脱壳 —— 脱壳护体（guard）/蝉鸣（atk）/回春（heal 脱壳重生）/蝉翼斩（heavy），
    // heal 制造"集火打断"压力：回春回合怪物不出手，玩家白嫖输出窗口。
    // P1-1 随从：无底船使者挡刀（25% 本体血）
    minion: { name: '无底船使者', hpPct: 0.25 },
    behavior: { mode: 'pattern', pattern: ['atk', 'guard', 'heal', 'atk', 'heavy', 'buff'], stagePatterns: { 0.30: ['heal', 'heavy', 'heal', 'multi', 'atk'] }, guardPct: 0.35, healPct: 0.12, buffAtkPct: 0.20 } },
  '第八十一难 · 通天河遇鼋湿经': { name: '第八十一难 · 通天河遇鼋湿经', diff: 81, tags: ['妖', '佛门'], heavyEvery: 5, heavyMult: 2.0,
    // V9.x 专属脚本：终局水覆之怒 —— 六种动作全量轮转（atk/heavy/multi/heal/guard/buff），
    // heal 回春制造集火打断压力；低血切「水覆翻舟」重击+连击+回春连发，终局施压。
    // P1-1 随从：通天河鱼鳖挡刀（45% 本体血）—— 终战随从最厚，呼应"随从随终局施压"
    minion: { name: '通天河鱼鳖', hpPct: 0.45 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'multi', 'heal', 'guard', 'buff'], stagePatterns: { 0.30: ['heavy', 'multi', 'heal', 'heavy', 'multi', 'buff'] }, guardPct: 0.40, healPct: 0.10, buffAtkPct: 0.30 },
    desc: '通天河老鼋背负真经渡水，半途问寿——你答不出，它翻覆沉河，真经尽湿。终局之劫，水覆之怒，以力渡之亦或承其诘问。' },
  // —— 补全：地区2/4/5/6/7/8/10 关隘 Boss（V8.42 补全，按 diff 递增）——
  '白龙·鹰愁涧': { name: '白龙·鹰愁涧', diff: 12, tags: ['妖', '龙'], heavyEvery: 3, heavyMult: 1.5,
    minion: { name: '鹰愁涧水妖', hpPct: 0.20 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'guard', 'multi'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'atk'] }, guardPct: 0.30, buffAtkPct: 0.20 },
    desc: '鹰愁涧中白龙腾浪，本是西海龙王三太子，因纵火烧了殿上明珠被贬。它吞了你的白马，却也将成为你西行的脚力——此战，是收伏，也是结缘。' },
  '流沙河·沙僧': { name: '流沙河·沙僧', diff: 18, tags: ['妖', '水'], heavyEvery: 4, heavyMult: 1.6,
    minion: { name: '流沙水卒', hpPct: 0.25 },
    behavior: { mode: 'pattern', pattern: ['guard', 'atk', 'heavy', 'multi', 'guard'], stagePatterns: { 0.30: ['heavy', 'multi', 'guard', 'heavy'] }, guardPct: 0.45, buffAtkPct: 0.20 },
    desc: '流沙河中卷帘大将被贬为妖，项下挂着九个取经人头骨。他原是天庭灵霄殿下侍銮舆的卷帘大将，只因在蟠桃会上打碎了玻璃盏，被贬下界。此战收伏，他将成为你最可靠的盾。' },
  '奎木狼·黄袍怪': { name: '奎木狼·黄袍怪', diff: 22, tags: ['妖', '天庭'], heavyEvery: 3, heavyMult: 1.7,
    minion: { name: '黑松林小妖', hpPct: 0.25 },
    behavior: { mode: 'pattern', pattern: ['atk', 'buff', 'heavy', 'atk', 'multi'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'buff'] }, guardPct: 0.30, buffAtkPct: 0.30 },
    desc: '碗子山波月洞黄袍怪，原是天上二十八宿之奎木狼，因与披香殿侍香的玉女有情，思凡下界占山为妖。他掳了宝象国公主，也将你化作猛虎——此战，是情劫，也是天规。' },
  '红孩儿·三昧真火': { name: '红孩儿·三昧真火', diff: 27, tags: ['妖', '火'], heavyEvery: 3, heavyMult: 1.8,
    minion: { name: '火云洞小妖', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'buff', 'heavy', 'multi', 'buff'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'multi', 'buff'] }, guardPct: 0.25, buffAtkPct: 0.35 },
    desc: '号山枯松涧火云洞圣婴大王红孩儿，牛魔王与铁扇公主之子，在火焰山修行三百年，炼成三昧真火。他化作七岁顽童诱你入洞，一口真火烧得你九死一生——此战，是火劫，也是观音收伏的机缘。' },
  '车迟三妖·虎鹿羊': { name: '车迟三妖·虎鹿羊', diff: 31, tags: ['妖', '道'], heavyEvery: 4, heavyMult: 1.7,
    minion: { name: '车迟道士', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'multi', 'atk', 'heavy', 'guard', 'multi'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'heavy', 'guard'] }, guardPct: 0.35, buffAtkPct: 0.25 },
    desc: '车迟国虎力、鹿力、羊力三妖道，在三清观冒充三清，蛊惑国王敬道灭僧。你与他们斗法求雨、坐禅、隔板猜物——比高台坐禅，比云梯显圣，比剖腹剜心。此战，是佛道之争，也是民心所向。' },
  '金鱼精·灵感大王': { name: '金鱼精·灵感大王', diff: 36, tags: ['妖', '水', '佛门'], heavyEvery: 4, heavyMult: 1.8,
    minion: { name: '通天河鱼鳖', hpPct: 0.35 },
    behavior: { mode: 'pattern', pattern: ['atk', 'guard', 'heavy', 'multi', 'heal'], stagePatterns: { 0.30: ['heavy', 'multi', 'heal', 'heavy', 'multi'] }, guardPct: 0.35, healPct: 0.10, buffAtkPct: 0.20 },
    desc: '通天河灵感大王，原是观音菩萨莲花池里养大的金鱼，每日浮头听经，修成手段。它下凡为妖，在陈家庄要吃童男童女，冻结通天河阻你西行。此战，是水劫，也是观音鱼篮收伏的前缘。' },
  '六耳猕猴': { name: '六耳猕猴', diff: 45, tags: ['妖', '魔'], heavyEvery: 3, heavyMult: 1.9,
    minion: { name: '花果山小猴', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'atk', 'multi', 'heavy', 'buff'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'multi', 'buff'] }, guardPct: 0.25, buffAtkPct: 0.30 },
    desc: '六耳猕猴，混世四猴之一，善聆音，能察理，知前后，万物皆明。它化作悟空模样，打昏唐僧，抢走行李，要自己上西方拜佛求经。三界无人能辨真假——直到灵山如来面前，它才现出本相。此战，是心劫，也是真假之辨。' },
  // —— 补全：地区9/11/12/13/14/15/16/17 关隘 Boss（V8.42 补全，别名引用+ELITE升级+全新）——
  // 地区9：女儿国·蝎子精（ELITE升级，毒敌山琵琶洞）
  '女儿国·蝎子精': { name: '女儿国·蝎子精', diff: 42, tags: ['妖', '毒'], heavyEvery: 3, heavyMult: 1.8,
    minion: { name: '琵琶洞女妖', hpPct: 0.25 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'guard', 'multi', 'buff'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'guard'] }, guardPct: 0.30, buffAtkPct: 0.30 },
    desc: '毒敌山琵琶洞蝎子精，曾在雷音寺听佛谈经，如来不合用手推她一把，她就转过钩子，把如来左手中拇指上扎了一下。她掳唐僧要做夫妻，悟空八戒都敌不过她的倒马毒桩——此战，是毒劫，也是昴日星官收伏的机缘。' },
  // 地区11：牛魔王（别名引用火焰山·牛魔王）
  '牛魔王': { name: '牛魔王', diff: 60, tags: ['妖'], heavyEvery: 4, heavyMult: 1.8,
    minion: { name: '玉面狐狸精', hpPct: 0.40 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'guard', 'atk', 'multi', 'heavy'], stagePatterns: { 0.30: ['heavy', 'heavy', 'multi', 'atk'] }, guardPct: 0.40, buffAtkPct: 0.25 },
    desc: '火焰山牛魔王，平天大圣，悟空结拜兄长。芭蕉扇、避水金睛兽，力大无穷。你三借芭蕉扇，与他赌变化、斗神通——此战，是义劫，也是火焰山熄灭火焰的关键。' },
  // 地区12：九头虫·碧波潭（ELITE升级，祭赛国碧波潭）
  '九头虫·碧波潭': { name: '九头虫·碧波潭', diff: 56, tags: ['妖', '水'], heavyEvery: 4, heavyMult: 1.8,
    minion: { name: '碧波潭小妖', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'multi', 'heavy', 'guard', 'multi', 'buff'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'heavy', 'buff'] }, guardPct: 0.30, buffAtkPct: 0.30 },
    desc: '碧波潭九头虫，乱石山碧波潭万圣龙王之婿。他与万圣龙王合谋，下血雨盗了祭赛国金光寺宝塔上的舍利子佛宝。九个头，九条命，斩不尽杀不绝——此战，是水劫，也是二郎真君助战收伏的前缘。' },
  // 地区13：大鹏金翅雕（别名引用狮驼岭·三魔拦路）
  '大鹏金翅雕': { name: '大鹏金翅雕', diff: 60, tags: ['妖', '佛门'], heavyEvery: 4, heavyMult: 1.9,
    minion: { name: '小钻风', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'multi', 'atk', 'heavy', 'multi', 'buff'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'heavy', 'buff'] }, guardPct: 0.35, buffAtkPct: 0.30 },
    desc: '狮驼岭大鹏金翅雕，如来佛祖的娘舅。青狮白象大鹏三魔盘踞八百里狮驼岭，吃尽了这一国的人。他一扇九万里，两扇就追上悟空，把悟空装在阴阳二气瓶里——此战，是最恐怖的劫，也是如来亲降收伏的终局。' },
  // 地区14：黄狮精·玉华州（全新，玉华州竹节山九曲盘桓洞）
  '黄狮精·玉华州': { name: '黄狮精·玉华州', diff: 66, tags: ['妖'], heavyEvery: 4, heavyMult: 1.8,
    minion: { name: '竹节山小妖', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'guard', 'multi', 'atk', 'heavy'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'guard'] }, guardPct: 0.35, buffAtkPct: 0.25 },
    desc: '玉华州黄狮精，竹节山九曲盘桓洞九灵元圣之孙。他趁夜盗了悟空八戒沙僧的兵器，要在虎口洞办"钉钯会"。这是西行路上最善良的妖怪——他买肉还给钱，不伤人不吃人——但你还是要打他，因为他偷了你的兵器。此战，是善劫，也是九灵元圣收伏的前缘。' },
  // 地区15：假公主·玉兔（全新，天竺国布金寺）
  '假公主·玉兔': { name: '假公主·玉兔', diff: 72, tags: ['妖', '月'], heavyEvery: 4, heavyMult: 1.8,
    minion: { name: '月宫捣药仙', hpPct: 0.25 },
    behavior: { mode: 'pattern', pattern: ['atk', 'buff', 'heavy', 'multi', 'guard', 'heal'], stagePatterns: { 0.30: ['heavy', 'multi', 'buff', 'heavy', 'multi'] }, guardPct: 0.30, healPct: 0.08, buffAtkPct: 0.30 },
    desc: '天竺国假公主玉兔精，广寒宫捣玄霜仙药的玉兔。她因十八年前被素娥仙子打了一掌，思凡下界，把真公主抛在布金寺，自己化作公主，要抛绣球招唐僧为驸马，取唐僧元阳成太乙上仙。此战，是情劫，也是太阴星君收伏的前缘。' },
  // 地区16：大圣残躯·无字碑（别名引用五行归墟·大圣残躯）
  '大圣残躯·无字碑': { name: '大圣残躯·无字碑', diff: 77, tags: ['魔'], heavyEvery: 4, heavyMult: 1.9,
    minion: { name: '无字碑守灵', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'multi', 'buff', 'heavy'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'buff'] }, guardPct: 0.40, buffAtkPct: 0.30 },
    desc: '灵山无字碑前，大圣残躯显化。这是悟空在五行山下压了五百年的怨念所化，也是他取经路上未曾消解的杀意。无字碑上没有字——因为悟空的一生，功过难评，善恶难断。此战，是心劫，也是你与悟空共同的终局。' },
  // 地区17：通天河老鼋·湿经（别名引用第八十一难·通天河遇鼋湿经）
  '通天河老鼋·湿经': { name: '通天河老鼋·湿经', diff: 81, tags: ['妖', '佛门'], heavyEvery: 5, heavyMult: 2.0,
    minion: { name: '通天河鱼鳖', hpPct: 0.45 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'multi', 'heal', 'guard', 'buff'], stagePatterns: { 0.30: ['heavy', 'multi', 'heal', 'heavy', 'multi', 'buff'] }, guardPct: 0.40, healPct: 0.10, buffAtkPct: 0.30 },
    desc: '通天河老鼋背负真经渡水，半途问寿——你答不出，它翻覆沉河，真经尽湿。终局之劫，水覆之怒，以力渡之亦或承其诘问。九九八十一难，最后一难，不是妖魔，不是天劫，是一句你答不出的"我今年多少岁"。' },


};

// 辅助：按节点名从敌库取精英/Boss 定义（game.js 在开战前调用，覆盖 MAP_PLAN 的 drop/material）
NDX.enemyDefOf = function (node) {
  if (!node || (node.type !== 'elite' && node.type !== 'boss')) return null;
  const tbl = node.type === 'boss' ? NDX.BOSS_TABLE : NDX.ELITE_TABLE;
  return (tbl && tbl[node.name]) || null;
};

// =============================================================
// 怪物立绘映射（img/portraits/ 六子目录下的立绘资源，由 resolvePortraitPath 解析子目录）
// 键 = 战斗名（怪物名），值 = 纯文件名，子目录由 resolvePortraitPath 自动解析。
// 未登记 → 按类型兜底（boss→流沙妖王 / elite→赤鬃妖帅 / mob→巡山小妖）。
// 立绘经 game.js fight() 注入怪物对象 m.portrait，由 ui.js 战斗头像动态读取。
// =============================================================
NDX.MONSTER_PORTRAITS = {
  // —— 小怪（mon_combat_*）——
  '山道喽啰': 'mon_shandao_louluo.webp',
  '山神庙外·拦路小妖': 'mon_shanshenmiao_xiaoyao.webp',
  '拦路山魈': 'mon_lanlu_shanxiao.webp',
  '黑松夜叉': 'mon_heisong_yecha.webp',
  '野祠饿鬼': 'mon_combat_shisha_yaotong.webp',
  '断桥水卒': 'mon_combat_tengchan_yesha.webp',
  '焦尾妖狐': 'mon_combat_shisha_yaotong.webp',
  '无名妖': 'mon_combat_xunshan_xiaoyao.webp',
  '缘中妖兵': 'mon_combat_xunshan_xiaoyao.webp',
  '接引使者': '接引使者.webp',
  // —— 小怪类型库（NDX.MOB_TYPES 抽取，映射到已有 4 张小怪立绘轮换）——
  '双叉岭山魈': 'mon_shuangchaling_shanxiao.webp',
  '猎户刘家仆': 'mon_liuhu_jiapu.webp',
  '寅将军麾下': 'mon_yin_jiangjun.webp',
  '黄风沙卒': 'mon_huangfeng_shazu.webp',
  '鼠妖小校': 'mon_shuyao_xiaoxiao.webp',
  '风卷妖兵': 'mon_combat_lanlu_shanxiao.webp',
  '黄毛貂鼠徒': 'mon_combat_xunshan_xiaoyao.webp',
  '流沙水怪': 'mon_combat_shisha_yaotong.webp',
  '水底夜叉': 'mon_shuidi_yecha.webp',
  '溺亡冤魂': 'mon_combat_shisha_yaotong.webp',
  '河伯水卒': 'mon_combat_tengchan_yesha.webp',
  '人参果树精': 'mon_renshen_guoshu.webp',
  '镇元观道童': 'mon_zhenyuan_daotong.webp',
  '荒山野狐': 'mon_huangshan_yehu.webp',
  '采药老道': 'mon_caiyao_laodao.webp',
  '火云洞小妖': 'mon_huoyun_xiaoyao.webp',
  '喷火夜叉': 'mon_penhuo_yecha.webp',
  '炎岩兽': 'mon_combat_tengchan_yesha.webp',
  '红孩儿麾下': 'mon_honghaier_huixia.webp',
  '虎力大仙门徒': 'mon_huli_mentu.webp',
  '鹿力小妖': 'mon_luli_xiaoyao.webp',
  '羊力妖卒': 'mon_yangli_yaozu.webp',
  '车迟国巫师': 'mon_combat_xunshan_xiaoyao.webp',
  '金鱼精水卒': 'mon_combat_shisha_yaotong.webp',
  '黑鱼妖': 'mon_heiyu_yao.webp',
  '河底蚌精': 'mon_hedi_bangjing.webp',
  '蟹将虾兵': 'mon_xiejiang_xiabing.webp',
  '子母河毒虫': 'mon_combat_shisha_yaotong.webp',
  '女国花妖': 'mon_nvguo_huayao.webp',
  '蝎子精徒': 'mon_combat_tengchan_yesha.webp',
  '落胎泉妖': 'mon_combat_shisha_yaotong.webp',
  '六耳猕猴兵': 'mon_liuer_mihoubing.webp',
  '花果山猴': 'mon_huaguoshan_hou.webp',
  '幻影妖猿': 'mon_huanying_yaoyuan.webp',
  '心魔幻相': 'mon_xinmo_huanxiang.webp',
  '火焰山火妖': 'mon_combat_tengchan_yesha.webp',
  '牛魔王部卒': 'mon_niumowang_buzu.webp',
  '岩浆火蜥': 'mon_combat_tengchan_yesha.webp',
  '芭蕉洞妖': 'mon_combat_lanlu_shanxiao.webp',
  '祭赛国妖僧': 'mon_jisaiguo_yaoseng.webp',
  '金光寺淫贼': 'mon_combat_xunshan_xiaoyao.webp',
  '碧波潭水妖': 'mon_combat_shisha_yaotong.webp',
  '万圣龙王兵': 'mon_combat_shisha_yaotong.webp',
  '狮驼岭小魔': 'mon_combat_tengchan_yesha.webp',
  '青狮麾下': 'mon_qingshi_huixia.webp',
  '白象精兵': 'mon_baixiang_jingbing.webp',
  '大鹏鸟羽': 'mon_combat_tengchan_yesha.webp',
  '比丘国妖道': 'mon_biqiuguo_yaodao.webp',
  '鹿精国丈卒': 'mon_combat_lanlu_shanxiao.webp',
  '昏君禁卫': 'mon_combat_xunshan_xiaoyao.webp',
  '婴尸怨魂': 'mon_combat_shisha_yaotong.webp',
  '天竺妖僧': 'mon_combat_xunshan_xiaoyao.webp',
  '玉兔精兵': 'mon_yutu_jingbing.webp',
  '广寒宫兔': 'mon_guanghangong_tu.webp',
  '舍卫国妖': 'mon_combat_xunshan_xiaoyao.webp',
  '灵山金刚': 'mon_lingshan_jingang.webp',
  '佛前怨灵': 'mon_foqian_yuanling.webp',
  '降龙伏虎侍': 'mon_xianglong_fuhu.webp',
  '传经吏仆': 'mon_combat_xunshan_xiaoyao.webp',
  '凌云渡水妖': 'mon_combat_shisha_yaotong.webp',
  '接引铁船夫': 'mon_jieyin_tiechuanfu.webp',
  '无底船怨魂': 'mon_combat_shisha_yaotong.webp',
  '最后心魔': 'mon_zuihou_xinmo.webp',
  // —— 精英（mon_elite_* + 中文名立绘）——
  '黑熊精': '黑熊精.webp',
  '黄风卷岭': 'mon_elite_chizong_yaoshuai.webp',
  '高老招亲': 'mon_elite_pijia_yaojiang.webp',
  '金角银角': 'boss_jinjiao_yinjiao.webp',
  '乌巢禅师': 'boss_wuchao_chanshi.webp',
  '狮驼初现': 'boss_shituo_chuxian.webp',
  '金兜洞·青牛精': 'boss_qingniu_jingdou.webp',
  '熊罴老怪': 'boss_xiongpi_laoguai.webp',
  '赤发鬼王': 'boss_chifa_guwang.webp',
  '独脚魈王': 'boss_dujiao_xiaowang.webp',
  '黑风大圣': '黑熊精.webp',
  '黄眉童子': 'boss_huangmei_tongzi.webp',
  // —— V8.37 新增精英怪立绘映射（先使用通用精英立绘，后续可生成独特立绘）——
  '白虎岭·白骨精': 'mon_elite_tiebei_xionyao.webp',
  '碗子山·黄袍怪': 'boss_huangpao_guai.webp',
  '乌鸡国·青毛狮': 'boss_qingmao_shi.webp',
  '毒敌山·蝎子精': 'mon_elite_tiebei_xionyao.webp',
  '火焰山·铁扇公主': 'boss_tieshan_gongzhu.webp',
  '祭赛国·九头虫': 'mon_elite_chizong_yaoshuai.webp',
  // —— Boss（17 地区关隘 · 2026-08-27 中文名立绘接入）——
  '虎力大仙': '虎仔.webp',
  '虎仔': '虎仔.webp',
  '黄风大圣': '黄风怪.webp',
  '黄风怪 · 妖鼠本相': '黄风怪.webp',
  '黄风怪 · 三昧神风·失忆形': '黄风怪.webp',
  '黄风怪 · 黄风大圣·狂形': '黄风怪.webp',
  // 第 1 地区 · 刘洪·江流索命
  '刘洪·江流索命': '刘洪.webp',
  '刘洪': '刘洪.webp',
  '水贼刘洪': '刘洪.webp',
  '刘洪水卒': '刘洪.webp',
  '江流儿': '江流儿.webp',
  // 第 2 地区 · 五行归墟（白骨夫人·三戏三段）
  '五行归墟': 'boss_baigujing.webp',
  '白骨夫人': 'boss_baigujing.webp',
  '白骨夫人 · 三戏之身': 'boss_baigujing.webp',
  '白骨夫人 · 村姑送斋': 'boss_baigujing.webp',
  '白骨夫人 · 老妪寻女': 'boss_baigujing.webp',
  '白骨夫人 · 老翁寻妻': 'boss_baigujing.webp',
  '白骨夫人 · 尸魔真身': 'boss_baigujing.webp',
  '白骨夫人 · 金刚怒相': 'boss_baigujing.webp',
  '白骨夫人 · 慈妪相': 'boss_baigujing.webp',
  '白骨夫人 · 散魂相': 'boss_baigujing.webp',
  '白骨夫人 · 敛形相': 'boss_baigujing.webp',
  '白骨夫人 · 噬骨相': 'boss_baigujing.webp',
  '白骨夫人 · 三戏相': 'boss_baigujing.webp',
  // 第 4 地区 · 流沙河·沙僧
  '流沙河·沙僧': 'npc_shaseng_liushahe.webp',
  '流沙河沙僧': 'npc_shaseng_liushahe.webp',
  '沙僧 · 卷帘水相': 'npc_shaseng_liushahe.webp',
  // 第 5 地区 · 镇元子·人参果树
  '镇元子·人参果树': '镇元大仙.webp',
  '镇元子': '镇元大仙.webp',
  '镇元子 · 人参果树': '镇元大仙.webp',
  '镇元子道童': '镇元大仙.webp',
  '灵吉菩萨': '灵吉菩萨.webp',
  // 第 6 地区 · 红孩儿·三昧真火（三段）
  '红孩儿·三昧真火': 'boss_honghaier.webp',
  '红孩儿 · 三昧真火': 'boss_honghaier.webp',
  '红孩儿 · 赤足孩童': 'boss_honghaier.webp',
  '红孩儿 · 火云焚天': 'boss_honghaier.webp',
  '圣婴红孩儿': 'boss_honghaier.webp',
  // 第 7 地区 · 车迟三妖·虎鹿羊（三段）
  '车迟三妖·虎鹿羊': 'boss_chechi_sanyao.webp',
  '车迟三妖 · 虎鹿羊': 'boss_chechi_sanyao.webp',
  '车迟国 · 虎力大仙': 'boss_chechi_sanyao.webp',
  '车迟国 · 鹿力大仙': 'boss_chechi_sanyao.webp',
  '车迟国 · 羊力大仙': 'boss_chechi_sanyao.webp',
  // 第 8 地区 · 金鱼精·灵感大王
  '金鱼精·灵感大王': 'boss_linggan_daiwang.webp',
  '金鱼精': 'boss_linggan_daiwang.webp',
  '灵感大王': 'boss_linggan_daiwang.webp',
  // 第 9 地区 · 女儿国·蝎子精
  '女儿国·蝎子精': 'boss_xiezi.webp',
  '蝎子精': 'boss_xiezi.webp',
  '蝎精歌魅': 'boss_xiezi.webp',
  // 第 10 地区 · 六耳猕猴（三段）
  '六耳猕猴': 'boss_liuermihou.webp',
  '六耳猕猴 · 真假难辨': 'boss_liuermihou.webp',
  '六耳残念': 'boss_liuermihou.webp',
  // 第 11 地区 · 牛魔王（三段）
  '牛魔王': 'boss_niumowang.webp',
  '牛魔假父': 'boss_niumowang.webp',
  // 第 12 地区 · 九头虫·碧波潭
  '九头虫·碧波潭': 'boss_jiutou.webp',
  '九头虫': 'boss_jiutou.webp',
  // 第 13 地区 · 大鹏金翅雕（三段）
  '大鹏金翅雕': 'boss_dapeng.webp',
  '金翅大鹏雕': 'boss_dapeng.webp',
  // 第 14 地区 · 白鹿国丈·寿星坐骑
  '白鹿国丈·寿星坐骑': 'boss_bailu_guozhang.webp',
  '白鹿国丈': 'boss_bailu_guozhang.webp',
  // 第 15 地区 · 假公主·玉兔
  '假公主·玉兔': 'boss_yutu.webp',
  '玉兔精': 'boss_yutu.webp',
  '天竺玉兔精': 'boss_yutu.webp',
  // 第 16 地区 · 传经吏·索经
  '传经吏·索经': 'boss_anuo_jiaye.webp',
  '传经吏': 'boss_anuo_jiaye.webp',
  '执事': 'boss_anuo_jiaye.webp',
  // 第 17 地区 · 通天河老鼋·湿经
  '通天河老鼋·湿经': 'boss_laoyuan.webp',
  '通天河老鼋': 'boss_laoyuan.webp',
  '通天河老龟': 'boss_laoyuan.webp',
  '老鼋': 'boss_laoyuan.webp',
};

// =============================================================
// 阵营立绘映射（V8.35 · 完善文档第11项·敌人立绘扩充）
// 键 = 怪物阵营 tag，值 = assets/ 下按阵营生成的专属水墨立绘。
// 战斗时 m.tags 传入 portraitOf，tags 命中即优先使用该阵营立绘，
// 覆盖 80+ 种小怪"仅 4 张立绘轮换"的视觉重复痛点。
// 未命中 tag → 回落到既有 名称精确匹配 → 关键词 → 类型兜底。
// =============================================================
NDX.MONSTER_TAG_PORTRAITS = {
  '妖': 'mon_tag_yao.webp',
  '水': 'mon_tag_shui.webp',
  '鬼': 'mon_tag_gui.webp',
  '火': 'mon_tag_huo.webp',
  '木': 'mon_tag_mu.webp',
  '虫': 'mon_tag_chong.webp',
  '魔': 'mon_tag_yao.webp',
  '怪': 'mon_tag_mu.webp',
};

// 解析怪物立绘 URL：优先精确名匹配，其次「黄风」系列归黄风怪立绘，
// 再按「关键词别名」匹配（覆盖 17 地区 Boss 及 TRIAL_BOSS 登场名变体），
// 最后按类型兜底（boss→流沙妖王 / elite→赤鬃妖帅 / mob→巡山小妖）。
NDX.PORTRAIT_KEYWORDS = [
  // [关键词, 文件名] —— 按序匹配，首个命中即返回
  // —— 中文名立绘优先匹配（2026-08-27 接入）——
  ['黑熊', '黑熊精.webp'],
  ['虎仔', '虎仔.webp'],
  ['虎力', '虎仔.webp'],
  ['江流儿', '江流儿.webp'],
  ['灵吉', '灵吉菩萨.webp'],
  // —— 原有关键词（更新为中文名立绘）——
  ['白骨', 'boss_baigujing.webp'],
  ['刘洪', '刘洪.webp'],
  ['江流', '刘洪.webp'],
  ['黄风', '黄风怪.webp'],
  ['流沙河沙僧', 'npc_shaseng_liushahe.webp'],
  ['沙僧', 'npc_shaseng_liushahe.webp'],
  ['卷帘', 'npc_shaseng_liushahe.webp'],
  ['镇元', '镇元大仙.webp'],
  ['人参果树', '镇元大仙.webp'],
  ['红孩儿', 'boss_honghaier.webp'],
  ['圣婴', 'boss_honghaier.webp'],
  ['车迟', 'boss_chechi_sanyao.webp'],
  ['鹿力', 'boss_chechi_sanyao.webp'],
  ['羊力', 'boss_chechi_sanyao.webp'],
  ['灵感大王', 'boss_linggan_daiwang.webp'],
  ['金鱼', 'boss_linggan_daiwang.webp'],
  ['蝎子', 'boss_xiezi.webp'],
  ['蝎精', 'boss_xiezi.webp'],
  ['琵琶', 'boss_xiezi.webp'],
  ['六耳', 'boss_liuermihou.webp'],
  ['真假', 'boss_liuermihou.webp'],
  ['牛魔王', 'boss_niumowang.webp'],
  ['牛魔', 'boss_niumowang.webp'],
  ['九头虫', 'boss_jiutou.webp'],
  ['大鹏', 'boss_dapeng.webp'],
  ['金翅', 'boss_dapeng.webp'],
  ['白鹿', 'boss_bailu_guozhang.webp'],
  ['国丈', 'boss_bailu_guozhang.webp'],
  ['玉兔', 'boss_yutu.webp'],
  ['传经吏', 'boss_anuo_jiaye.webp'],
  ['执事', 'boss_anuo_jiaye.webp'],
  ['索经', 'boss_anuo_jiaye.webp'],
  ['老鼋', 'boss_laoyuan.webp'],
  ['老龟', 'boss_laoyuan.webp'],
  ['湿经', 'boss_laoyuan.webp'],
  ['晒经', 'boss_laoyuan.webp'],
  ['鼋', 'boss_laoyuan.webp'],
];
// =============================================================
// 立绘路径解析（2026-08-29 修复：原 img/char/ 目录已清空，
// 文件迁移至 img/portraits/ 六子目录；按文件名特征映射到正确子目录）
// =============================================================
NDX.resolvePortraitPath = function (filename) {
  if (!filename) return '';
  const f = String(filename);
  if (f.indexOf('mon_') === 0) return 'img/portraits/enemies/' + f;
  if (f.indexOf('boss_') === 0) return 'img/portraits/bosses/' + f;
  if (f.indexOf('npc_') === 0) return 'img/portraits/npcs/' + f;
  if (f.indexOf('zy_') === 0) return 'img/portraits/bosses/' + f;
  if (f.indexOf('pet_') === 0) return 'img/portraits/pets/' + f;
  const heroPrefixes = ['tangseng', 'wukong', 'bajie', 'longma', 'shaseng', 'player_main'];
  for (let i = 0; i < heroPrefixes.length; i++) {
    if (f.indexOf(heroPrefixes[i]) === 0) return 'img/portraits/heroes/' + f;
  }
  const bossCn = ['黑熊精', '黄风怪', '镇元大仙', '灵吉菩萨'];
  for (let i = 0; i < bossCn.length; i++) { if (f.indexOf(bossCn[i]) >= 0) return 'img/portraits/bosses/' + f; }
  const specialCn = ['接引使者', '观音菩萨', '地藏王菩萨', '菩提祖师', '文殊菩萨', '弥勒佛', '燃灯古佛', '乌巢禅师', '如来', '太上老君', '太白金星', '哪吒', '二郎真君', '龙王', '土地', '城隍'];
  for (let i = 0; i < specialCn.length; i++) { if (f.indexOf(specialCn[i]) >= 0) return 'img/portraits/special/' + f; }
  return 'img/portraits/npcs/' + f;
};

NDX.portraitOf = function (name, type, boss, tags) {
  const n = String(name || '');
  const rp = NDX.resolvePortraitPath;
  // V8.35 阵营立绘优先：怪物 tags 命中 MONSTER_TAG_PORTRAITS 即用阵营专属立绘
  // （覆盖 80+ 小怪，避免全用 4 张轮换；Boss/精英不被 tag 抢占，保留专属立绘）
  if (!boss && type === 'mob' && Array.isArray(tags) && NDX.MONSTER_TAG_PORTRAITS) {
    for (let i = 0; i < tags.length; i++) {
      const hit = NDX.MONSTER_TAG_PORTRAITS[tags[i]];
      if (hit) return rp(hit);
    }
  }
  if (NDX.MONSTER_PORTRAITS[n]) return rp(NDX.MONSTER_PORTRAITS[n]);
  if (NDX.PORTRAIT_KEYWORDS) {
    for (let i = 0; i < NDX.PORTRAIT_KEYWORDS.length; i++) {
      const k = NDX.PORTRAIT_KEYWORDS[i];
      if (n.indexOf(k[0]) >= 0) return rp(k[1]);
    }
  }
  if (boss || type === 'boss') return rp('mon_boss_liusha_yaowang.webp');
  if (type === 'elite') return rp('mon_elite_chizong_yaoshuai.webp');
  return rp('mon_combat_xunshan_xiaoyao.webp');
};

// NPC 立绘映射（事件/叙事/送行场景用，assets/ 下的中文名立绘）
// 键 = NPC 名，值 = assets/ 下的文件名。供 game.js / ui.js 在非战斗场景读取。
// =============================================================
NDX.NPC_PORTRAITS = {
  // —— 取经人系（幼年/转职/恶线）——
  '江流儿': '江流儿.webp',
  '取经人': 'tangseng.webp',
  '取经人·恶': 'tangseng_evil.webp',
  '取经人·一转': 'tangseng_tier1.webp',
  '取经人·二转': 'tangseng_tier2.webp',
  '取经人·终转': 'tangseng_final.webp',
  // —— 沙僧系——
  '沙僧': 'shaseng.webp',
  // —— 佛菩萨系列（渡道事件，已生成专属立绘）——
  '灵吉菩萨': '灵吉菩萨.webp',
  '接引使者': '接引使者.webp',
  '观音': '观音菩萨.webp',
  '观音菩萨': '观音菩萨.webp',
  '地藏王菩萨': '地藏王菩萨.webp',
  '地藏菩萨': '地藏王菩萨.webp',
  '菩提祖师': '菩提祖师.webp',
  '菩提老祖': '菩提祖师.webp',
  '文殊菩萨': '文殊菩萨.webp',
  '弥勒佛': '弥勒佛.webp',
  '燃灯古佛': '燃灯古佛.webp',
  '乌巢禅师': 'boss_wuchao_chanshi.webp',
  // —— 佛祖/道祖（已生成专属立绘）——
  '如来': '如来.webp',
  '如来佛祖': '如来.webp',
  '太上老君': '太上老君.webp',
  '太白金星': '太白金星.webp',
  // —— 天庭武将（逆道事件，已生成专属立绘）——
  '哪吒': '哪吒.webp',
  '哪吒三太子': '哪吒.webp',
  '二郎真君': '二郎真君.webp',
  '二郎神': '二郎真君.webp',
  '杨戬': '二郎真君.webp',
  // —— 大唐皇室（已生成专属立绘）——
  '唐太宗': '唐太宗.webp',
  '李世民': '唐太宗.webp',
  '唐王': '唐太宗.webp',
  // —— 取经人亲属（已生成专属立绘）——
  '殷温娇': '殷温娇.webp',
  '陈光蕊': '陈光蕊.webp',
  // —— 地方神祇（已生成专属立绘）——
  '龙王': '龙王.webp',
  '东海龙王': '龙王.webp',
  '西海龙王': '龙王.webp',
  '南海龙王': '龙王.webp',
  '北海龙王': '龙王.webp',
  '土地': '土地.webp',
  '土地公': '土地.webp',
  '城隍': '城隍.webp',
  '城隍庙': '城隍.webp',
  // —— Boss/NPC 双用角色（中文名立绘）——
  '刘洪': '刘洪.webp',
  '镇元大仙': '镇元大仙.webp',
  '黑熊精': '黑熊精.webp',
  '黄风怪': '黄风怪.webp',
  '虎力大仙': '虎仔.webp',
  '虎仔': '虎仔.webp',
};

NDX.npcPortraitOf = function (name) {
  return NDX.NPC_PORTRAITS[name] ? NDX.resolvePortraitPath(NDX.NPC_PORTRAITS[name]) : '';
};

// 英雄转职立绘映射（assets/ 下的中文名立绘）
// 键 = hero id，值 = { base, evil, tier1, tier2, final } 各阶段立绘文件名。
// 供 game.js getHeroPortrait() 按转职阶段动态切换。
// =============================================================
NDX.HERO_EVOLVE_PORTRAITS = {
  tangseng: {
    base: 'tangseng_base.webp', evil: 'tangseng_evil.webp', tier1: 'tangseng_tier1.webp',
    tier2: 'tangseng_tier2.webp', final: 'tangseng_final.webp', hidden: 'tangseng_hidden.webp',
  },
  wukong: {
    base: 'wukong.webp', evil: 'wukong_evil.webp', tier1: 'wukong_tier1.webp',
    tier2: 'wukong_tier2.webp', final: 'wukong_final.webp', hidden: 'wukong_hidden.webp',
  },
  bajie: {
    base: 'bajie.webp', evil: 'bajie_evil.webp', tier1: 'bajie_tier1.webp',
    tier2: 'bajie_tier2.webp', final: 'bajie_final.webp', hidden: 'bajie_hidden.webp',
  },
  xiaobailong: {
    base: 'longma.webp', evil: 'longma_evil.webp', tier1: 'longma_tier1.webp',
    tier2: 'longma_tier2.webp', final: 'longma_final.webp', hidden: 'longma_hidden.webp',
  },
  shaseng: {
    base: 'shaseng.webp', evil: 'shaseng_evil.webp', tier1: 'shaseng_tier1.webp',
    tier2: 'shaseng_tier2.webp', final: 'shaseng_final.webp', hidden: 'shaseng_hidden.webp',
  },
};

