// =============================================================
// enemies_part2.js - 敌人数据（第二部分：教学怪物/行为/精英怪/Boss表/立绘）
// 从 enemies.js 拆分，第889-1613行
// 外部接口 NDX.* 保持不变，调用方无需修改
// 拆分日期: 2026-09-14
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
  '黄风大圣': { name: '黄风大圣', diff: 13, tags: ['妖'],   heavyEvery: 3, heavyMult: 1.7,
    // V9.x 专属脚本：三昧神风 —— 风起（buff 叠攻）→ 风袭（重击）→ 蓄势，低血切「狂暴风眼」重击连发
    // P1-1 随从：虎先锋挡刀（20% 本体血）—— 第二章首个带随从 Boss，温和教学"先破胆再打本体"
    minion: { name: '虎先锋', hpPct: 0.20 },
    behavior: { mode: 'pattern', pattern: ['atk', 'buff', 'atk', 'heavy', 'guard'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'buff'] }, guardPct: 0.35, buffAtkPct: 0.25 },
    desc: '黄风怪三形态抉择战：妖鼠本相→三昧神风·失忆形→黄风大圣·狂形。' },
  '五行归墟': { name: '五行归墟', diff: 22, tags: ['魔'],   heavyEvery: 4, heavyMult: 1.7,
    // V9.x 专属脚本：白骨三戏 —— 蓄势/重击/连击/暴涨轮转（呼应三戏轮转设计），低血切「尸魔夺命」重击+连击连发
    behavior: { mode: 'pattern', pattern: ['atk', 'guard', 'heavy', 'multi', 'buff'], stagePatterns: { 0.30: ['heavy', 'multi', 'heavy', 'guard'] }, guardPct: 0.40, buffAtkPct: 0.25 },
    desc: '白骨夫人三戏之身显化：村姑送斋、老妪寻女、老翁寻妻，依你一路六道命数映出不同骨相。三戏归元，她要你偿这一路杀身之债——这是西行第二关的尸骨劫。' },
  '五行归墟·大圣残躯': { name: '五行归墟·大圣残躯', diff: 20, tags: ['魔'], heavyEvery: 4, heavyMult: 1.8,
    // V9.x 专属脚本：残躯搏命 —— 重击/连击密度更高，低血切「无字杀伐」连击+暴涨
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'multi', 'buff', 'heavy'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'buff'] }, guardPct: 0.40, buffAtkPct: 0.30 },
    desc: '五行山下压了五百年的怨念所化大圣残躯，与灵山无字碑同根。功过难评，杀意未散——它要与你再搏一场，了却这未竟的金箍账。' },
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
    desc: '火焰山牛魔王，平天大圣，悟空结拜兄长。芭蕉扇、避水金睛兽，力大无穷。你三借芭蕉扇，与他赌变化、斗神通——此战，是义劫，也是熄灭火焰山的关键。',
    // V9.x 专属脚本：魔王力沉 —— 牛角顶（atk）/踏地（heavy）/皮厚（guard）/连顶（multi），
    // 低血切「魔焰踏地」重击连发。
    // P1-1 随从：玉面狐狸精挡刀（40% 本体血）—— 牛魔王风月场合驱媚，先驱散侧室再战正主
    minion: { name: '玉面狐狸精', hpPct: 0.40 },
    behavior: { mode: 'pattern', pattern: ['atk', 'heavy', 'guard', 'atk', 'multi', 'heavy'], stagePatterns: { 0.30: ['heavy', 'heavy', 'multi', 'atk'] }, guardPct: 0.40, buffAtkPct: 0.25 } },
  '狮驼岭·三魔拦路':    { name: '狮驼岭·三魔拦路', diff: 60, tags: ['妖'], heavyEvery: 4, heavyMult: 1.8,
    desc: '狮驼岭头青狮、白象、大鹏三魔同气连枝，盘踞八百里狮驼岭，吃尽一国之人。青狮吞山河、白象卷半空、大鹏扇九万里——三魔轮转，这是西行路上最恐怖的一关。',
    // V9.x 专属脚本：青狮/白象/大鹏三魔轮转 —— 连击密度高（multi 频繁），低血切「三魔齐喙」连击+重击
    // P1-1 随从：小钻风挡刀（30% 本体血）—— 狮驼岭小妖簇拥"大王叫我来巡山"
    minion: { name: '小钻风', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'multi', 'atk', 'heavy', 'multi', 'buff'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'heavy', 'buff'] }, guardPct: 0.35, buffAtkPct: 0.25 } },
  '凌云渡·金蝉脱壳':    { name: '凌云渡·金蝉脱壳', diff: 80, tags: ['佛门'], heavyEvery: 5, heavyMult: 1.7,
    desc: '凌云渡头，金蝉子十世修行的凡蜕在此脱壳。你已非前世金蝉，亦非初入长安的江流——这一战，是你与旧我的最后一击，脱去皮囊，方见真经。',
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
  '九头虫·碧波潭': { name: '九头虫·碧波潭', diff: 54, tags: ['妖', '水'], heavyEvery: 4, heavyMult: 1.8,
    minion: { name: '碧波潭小妖', hpPct: 0.30 },
    behavior: { mode: 'pattern', pattern: ['atk', 'multi', 'heavy', 'guard', 'multi', 'buff'], stagePatterns: { 0.30: ['multi', 'heavy', 'multi', 'heavy', 'buff'] }, guardPct: 0.30, buffAtkPct: 0.30 },
    desc: '碧波潭九头虫，乱石山碧波潭万圣龙王之婿。他与万圣龙王合谋，下血雨盗了祭赛国金光寺宝塔上的舍利子佛宝。九个头，九条命，斩不尽杀不绝——此战，是水劫，也是二郎真君助战收伏的前缘。' },
  // 地区13：大鹏金翅雕（别名引用狮驼岭·三魔拦路）
  '大鹏金翅雕': { name: '大鹏金翅雕', diff: 58, tags: ['妖', '佛门'], heavyEvery: 4, heavyMult: 1.9,
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
  if (!tbl) return null;
  if (tbl[node.name]) return tbl[node.name];
  // Boss 别名兜底：node.name 可能是「给玩家看的叙事全名」（如「白骨夫人·五行归墟」），
  // 而 BOSS_TABLE / BOSS_FORMS 的键是内部键（「五行归墟」）。缺此兜底会静默丢失
  // 专属 drop / material / affix / 行为脚本。与 bossStageSetup 同走 bossFormKeyOf 单一真源。
  if (node.type === 'boss' && NDX.bossFormKeyOf) {
    const _k = NDX.bossFormKeyOf(node.name);
    if (_k && tbl[_k]) return tbl[_k];
  }
  return null;
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
  '刘洪·江流索命': 'boss_liuhong.webp',
  '刘洪': 'boss_liuhong.webp',
  '水贼刘洪': 'boss_liuhong.webp',
  '刘洪水卒': 'boss_liuhong.webp',
  '江流儿': 'npc_jiangliuer.webp',
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
  ['江流儿', 'npc_jiangliuer.webp'],
  ['灵吉', '灵吉菩萨.webp'],
  // —— 原有关键词（更新为中文名立绘）——
  ['白骨', 'boss_baigujing.webp'],
  ['刘洪', 'boss_liuhong.webp'],
  ['江流', 'boss_liuhong.webp'],
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
  '江流儿': 'npc_jiangliuer.webp',
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
  '刘洪': 'boss_liuhong.webp',
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

