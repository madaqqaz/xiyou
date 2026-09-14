// =============================================================
// enemies_part1.js - 敌人数据（第一部分：怪物属性/类型/生成/词缀/Boss形态）
// 从 enemies.js 拆分，第1-888行
// 外部接口 NDX.* 保持不变，调用方无需修改
// 拆分日期: 2026-09-14
// =============================================================

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
  // 【2026-09-13 重排修正】原实现是硬编码 17 元素数组按 act-1 索引（17 地区制残留）：
  //   9 章制下 act1~9 只取到 [4,9,13,18,22,27,31,36,40] —— 第 9 章终局 Boss 竟只有 diff 40 强度，
  //   这是用户实测「前两章刷吐、好不容易打个 Boss 也没感觉难度」的**数值根因**之一。
  //   现直接取 ACT_RANGES.end（章末难号），与章末 Boss / CHAPTER_BOSS_NAMES 严格三向对齐：
  //   13 黄风 / 22 白骨 / 27 红孩儿 / 36 金鱼精 / 45 六耳 / 54 九头虫 / 58 大鹏 / 72 玉兔 / 81 老鼋。
  if (NDX.actEnd) {
    try {
      const a = Math.max(1, Math.min(NDX.TOTAL_ACTS || 9, act || 1));
      return NDX.actEnd(a);
    } catch (e) { /* 回退旧表 */ }
  }
  return [4, 9, 13, 18, 22, 27, 31, 36, 40, 45, 49, 54, 58, 63, 72, 77, 81][Math.max(0, Math.min(16, (act || 1) - 1))];
};

// ---- 关隘 Boss 遗物 / 命名 ----
NDX.BOSS_RELICS = [
  // 【2026-09-13 重排】原 act1~9 按 17 地区制命名（act3=黄风岭遗物、act5=五庄观果核…），
  //   与 9 章制的章末 Boss 完全不匹配（act3 章末是红孩儿却给「雷音残魂」）。
  //   现按 CHAPTER_BOSS_NAMES / ACT_RANGES.end 逐章对齐重写，数值按章序单调递增。
  //   注：act10~17 为旧 17 地区制残留（9 章制下 s.act ≤ 9，永不触发），保留条目仅为兼容老存档 id。
  { id: 'relic_act1',  name: '黄风定风珠', icon: '珠', act: 1,
    desc: '黄风岭余风凝成的一枚定风珠：体攻 +9%，气血 +6%',
    effect: { atkPct: 0.09, hpPct: 0.06 } },
  { id: 'relic_act2',  name: '白骨舍利', icon: '骨', act: 2,
    desc: '白骨夫人三戏之身化出的一枚舍利：御念 +10%，身法 +8%',
    effect: { mdef: 0.10, eva: 0.08 } },
  { id: 'relic_act3',  name: '三昧火种', icon: '火', act: 3,
    desc: '火云洞三昧真火的一粒火种：法伤 +12%，每战开局先烧敌 4% 气血',
    effect: { matkPct: 0.12, burnPct: 0.04 } },
  { id: 'relic_act4',  name: '灵感鱼鳞', icon: '鳞', act: 4,
    desc: '灵感大王金鳞一片：身法 +11%，护体 +7%，每战开局得 8% 气血护盾',
    effect: { eva: 0.11, dr: 0.07, shieldPct: 0.08 } },
  { id: 'relic_act5',  name: '如意神铁', icon: '铁', act: 5,
    desc: '真假之间一根如意神铁：体攻 +14%，身法 +10%，护体 +7%',
    effect: { atkPct: 0.14, eva: 0.10, dr: 0.07 } },
  { id: 'relic_act6',  name: '碧波龙珠', icon: '珠', act: 6,
    desc: '碧波潭九头虫的龙珠：法伤 +14%，护体 +8%，气血 +8%',
    effect: { matkPct: 0.14, dr: 0.08, hpPct: 0.08 } },
  { id: 'relic_act7',  name: '佛祖金翎', icon: '翎', act: 7,
    desc: '金翅鹏王遗落的一根金翎：身法 +14%，御念 +10%，气血 +10%',
    effect: { eva: 0.14, mdef: 0.10, hpPct: 0.10 } },
  { id: 'relic_act8',  name: '捣药玉杵', icon: '杵', act: 8,
    desc: '月宫玉兔的捣药杵：护体 +11%，愿伤 +15%，每战回合回 4% 气血',
    effect: { dr: 0.11, matkPct: 0.15, regenPct: 0.04 } },
  { id: 'relic_act9',  name: '金蝉蜕壳', icon: '蜕', act: 9,
    desc: '凌云渡头一缕真蜕金壳：全系 +18%，气血 +15%，破韧后连住三重',
    effect: { atkPct: 0.18, matkPct: 0.18, hpPct: 0.15, dr: 0.06, mdef: 0.06 } },
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
// 九章末超级 Boss 链（2026-09-13 新增 · 9 章制真源）
//   【为什么需要它】09-01 地理重排后 ACT_RANGES 已是 **9 章制**（s.act ∈ 1~9），
//   而 NDX.BOSS_NAMES 仍是 17 地区制旧链（长 17）。旧 bossNameForAct 直接按 act-1 索引，
//   9 章只取到前 9 条 → 章末 Boss 全线错位（act1 挂刘洪、act2 挂白龙、act9 挂女儿国蝎子精），
//   这正是用户实测「第二章打白龙马、毫无阶段成就感」的代码根因。
//   本链按「章末难 = 章末标志性 Boss」严格对齐 ACT_RANGES.end（13/22/27/36/45/54/58/72/81）。
//   BOSS_NAMES（17 条）保留不动，继续作为图鉴总数真源（data_codex.js / ui_codex.js 消费）。
NDX.CHAPTER_BOSS_NAMES = [
  '黄风大圣',          // 第 1 章 章末（难 13 · 黄风岭）· 三形态抉择战，走 HUANGFENG_FORMS
  '白骨夫人·五行归墟',  // 第 2 章 章末（难 22 · 五庄观）· 七相依六道命数，键见 BOSS_FORM_ALIAS
  '红孩儿·三昧真火',    // 第 3 章 章末（难 27 · 火云洞）· 三段
  '金鱼精·灵感大王',    // 第 4 章 章末（难 36 · 通天河）· 观音玉净瓶
  '六耳猕猴',          // 第 5 章 章末（难 45 · 真假猴王）· 三段
  '九头虫·碧波潭',      // 第 6 章 章末（难 54 · 祭赛国）· 再生禁疗
  '大鹏金翅雕',        // 第 7 章 章末（难 58 · 狮驼岭）· 三段
  '假公主·玉兔',        // 第 8 章 章末（难 72 · 天竺）· 幻月
  '通天河老鼋·湿经',    // 第 9 章 章末（难 81 · 凌云渡）· 终局三段
];
// 显示名 → BOSS_FORMS 键 别名表（单一真源）
//   bossNameForAct 返回的是「给玩家看的叙事全名」，而 NDX.BOSS_FORMS 的键是「形态表内部键」，
//   两者不总一致（如 BOSS_FORMS['五行归墟']）。bossStageSetup 走 BOSS_FORMS[键] 精确查找，
//   缺别名会使 Boss 静默退化为单段普通怪（三段变身 / 破韧钩子 / 跳形态全部失效）。
NDX.BOSS_FORM_ALIAS = {
  '白骨夫人·五行归墟': '五行归墟',
};

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
  // 9 章制优先：章末 Boss 取 CHAPTER_BOSS_NAMES（与 ACT_RANGES.end 严格对齐）
  const L = (NDX.CHAPTER_BOSS_NAMES && NDX.CHAPTER_BOSS_NAMES.length) || 0;
  if (L) {
    const i = Math.max(0, Math.min(L - 1, (act || 1) - 1));
    return NDX.CHAPTER_BOSS_NAMES[i];
  }
  // 回退：旧 17 地区链（CHAPTER_BOSS_NAMES 缺失时的保底，避免脏数据直接崩）
  const i = Math.max(0, Math.min(NDX.BOSS_NAMES.length - 1, (act || 1) - 1));
  return NDX.BOSS_NAMES[i];
};
// 显示名 → BOSS_FORMS 键 解析（别名兜底，未登记别名者原样返回）
NDX.bossFormKeyOf = function (bossName) {
  if (!bossName) return null;
  const AL = NDX.BOSS_FORM_ALIAS || {};
  return AL[bossName] || bossName;
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
    breakWith: 'zhaoyao',        // 正常·渡：持照妖镜破韧 + 显形
    phaseSkipOn: 'zhaoyao',      // 照妖镜→跳过人形态直入白骨形态
    blessTreasure: 'ts_jingping', // 加持·请菩萨：观音玉净瓶清场+护盾
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
    breakWith: 'baojiao', blessTreasure: 'ts_jingping', // 破韧=芭蕉扇清灼烧；加持=观音玉净瓶
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
    breakWith: 'ts_jingping', blessTreasure: 'feilong_zhang', // 破韧=玉净瓶清弱；加持=飞龙宝杖
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
    breakWith: 'zijinhu', blessTreasure: 'zhaoyao', // 破韧=红葫芦清摄魂；加持=照妖镜
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
    breakWith: 'baojiao', blessTreasure: 'jinguo_zhuo', // 破韧=芭蕉扇清灼烧；加持=金刚琢
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
    breakWith: 'dingfeng', blessTreasure: 'zijin_honghulu', // 破韧=定风珠清致盲；加持=红葫芦
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
    breakWith: 'ts_jingping', blessTreasure: 'bf_wuzizhenjing', // 破韧=观音玉净瓶清寒封(frost)；加持=无字真经（灵山终局）
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
    breakWith: 'ts_jingping', blessTreasure: 'feilong_zhang', // 破韧=玉净瓶清寒封；加持=飞龙宝杖
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
    breakWith: 'ts_jingping', blessTreasure: 'bajiao_shan', // 破韧=玉净瓶清毒蚀；加持=芭蕉扇(修正:九头debuff=poison非burn)
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
    breakWith: 'zijinhu', blessTreasure: 'jiuhuan_zhang', // 破韧=红葫芦清摄魂；加持=九环锡杖
    phases: [
      { name: '玉兔精 · 天竺公主', dao: '初', desc: '天竺国，一个公主抛绣球招亲，打中了你取经人。她本是广寒宫捣药的玉兔，偷跑下凡，要报素娥仙子一掌之仇——这一战，是为了救你师父，也是为了了结广寒宫的旧怨。', hp: 2100, atk: 230, dr: 0.22, matk: 140, mdef: 0.24, affix: '玉兔精·公主（初相·捣药杵攻击）' },
      { name: '玉兔精 · 广寒捣药', dao: '终', desc: '她现出原形，一只玉兔，手持捣药杵。这杵是广寒宫的宝物，能捣出仙药，也能砸出神通——这是月宫仙子的坐骑作乱。', hp: 2600, atk: 280, dr: 0.26, matk: 170, mdef: 0.28, affix: '玉兔精·捣药（终相·狂暴）' },
    ],
    overrides: [null, { dr: 0.26, matk: 170, enrage: 0.3, enrageMul: 1.5, affix: '玉兔精·捣药（终相·狂暴）' }],
  },
  '传经吏·索经': {
    name: '传经吏 · 灵山索经',
    breakWith: 'ts_bowl', blessTreasure: 'bf_wuzizhenjing', // 破韧=紫金钵(索人事)；加持=无字真经
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
  const _formKey = NDX.bossFormKeyOf ? NDX.bossFormKeyOf(bossName) : bossName; // 显示名 → 形态表键（别名兜底）
  const cfg = NDX.BOSS_FORMS && NDX.BOSS_FORMS[_formKey];
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
    breakWith: cfg.breakWith || null,       // 章末 Boss 破韧专属钩子（覆盖通用指派）
    blessTreasure: cfg.blessTreasure || null, // 加持·请菩萨钩子
    phaseSkipOn: cfg.phaseSkipOn || null,    // 跳形态钩子（如白骨照妖镜）
  };
  // 白骨夫人：开场道相依六道命数显化（沿用原单相机制的道相判定，仅作叙事）
  // 注：按 _formKey 判定（bossName 是显示名「白骨夫人·五行归墟」，形态表键才是「五行归墟」）
  if (_formKey === '五行归墟' && NDX.baiguFormForFate) {
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
