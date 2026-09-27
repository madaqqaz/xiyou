// =============================================================
// boss_skills.js - Boss专属技能系统
// 定义所有Boss和精英的专属技能，以及区域属性传染机制
// 加载顺序：enemies_part2.js -> boss_skills.js -> combat_part1.js
// =============================================================

// =============================================================
// 一、Boss专属技能注册表
// 键 = Boss名（与BOSS_TABLE键对应）
// 每个Boss可配置多个技能，技能在战斗中按行为脚本触发
// =============================================================
NDX.BOSS_SKILLS = {
  // —— 第1章 ——
  '刘洪·江流索命': {
    skills: [
      { id: 'water_thief', name: '水贼横斩', type: 'atk', desc: '基础攻击' },
      { id: 'iron_wall', name: '铁壁蓄势', type: 'guard', desc: '减伤30%，下回合攻击+20%' },
      { id: 'heavy_slash', name: '蓄力重击', type: 'heavy', desc: '1.4倍伤害，触发识破窗口' }
    ],
    regionAffix: null // 新手区域无传染
  },

  '黄风大圣': {
    skills: [
      { id: 'flying_sand', name: '飞沙走石', type: 'debuff', effect: { miss: 0.60, turns: 2 }, desc: '玩家攻击miss60%，持续2回合' },
      { id: 'yellow_sand_shield', name: '黄沙护盾', type: 'shield', effect: { absorb: 0.50 }, desc: '吸收伤害，护盾存在时减伤50%' },
      { id: 'wind_blade_combo', name: '风刃连击', type: 'multi', effect: { hits: 3 }, desc: '3段攻击' },
      { id: 'samadhi_wind', name: '三昧神风', type: 'ultimate', effect: { miss: 1.0, turns: 1, aoe: true }, desc: '全屏AOE+致盲（miss100%），持续1回合', stage: 3 }
    ],
    regionAffix: { name: '吹沙', miss: 0.30, desc: '玩家攻击miss30%' },
    counterItem: '定风珠',
    humanFormDr: 0.80
  },

  // —— 第2章 ——
  '五行归墟': { // 白骨夫人
    skills: [
      { id: 'human_form', name: '人形态减伤', type: 'passive', effect: { dr: 0.80 }, desc: '人形态在场时，玩家对其伤害-80%' },
      { id: 'vanish', name: '遁形', type: 'special', effect: { vanishTurns: 1, nextCrit: 2.0 }, desc: '消失1回合，下回合出现时暴击（2倍伤害）' },
      { id: 'bone_claw', name: '骨爪', type: 'lifesteal', effect: { lifesteal: 0.30 }, desc: '造成伤害的30%转化为回血' },
      { id: 'three_tricks', name: '三戏幻化', type: 'stage', effect: { forms: ['村姑', '老妪', '老翁'] }, desc: '人形态三变体，每变体血量独立' },
      { id: 'bone_demon_kill', name: '尸魔夺命', type: 'ultimate', effect: { dmg: 2.0, debuff: { atk: -0.50, turns: 1 } }, desc: '高伤害+诅咒（玩家下回合攻击-50%）', stage: 2 }
    ],
    regionAffix: { name: '骨爪', lifesteal: 0.10, desc: '吸血10%' },
    counterItem: '照妖镜',
    humanFormDr: 0.80
  },

  // —— 第3章 ——
  '红孩儿·三昧真火': {
    skills: [
      { id: 'samadhi_fire', name: '三昧真火', type: 'dot', effect: { dotType: 'fire', dmgPct: 0.08, turns: 3, noWaterCounter: true }, desc: '持续灼烧，每回合掉最大血量8%，持续3回合，不可水克（反激）' },
      { id: 'fire_shield', name: '火焰护盾', type: 'shield', effect: { absorb: 0.50, reflect: 0.30 }, desc: '吸收伤害，受到攻击时反伤30%' },
      { id: 'fire_spear_thrust', name: '火尖枪突刺', type: 'heavy', effect: { dot: 'fire' }, desc: '高伤害+灼烧（叠加DOT）' },
      { id: 'fire_cloud_combo', name: '火云连击', type: 'multi', effect: { hits: 3, dot: 'fire' }, desc: '3段火焰攻击，每段附带灼烧' },
      { id: 'holy_infant_fire', name: '圣婴大王·真火焚天', type: 'ultimate', effect: { aoe: true, dotMax: true }, desc: '全屏AOE，灼烧DOT叠加到最大层数', stage: 3 }
    ],
    regionAffix: { name: '火星', dot: { type: 'fire', dmgPct: 0.05, turns: 2 }, desc: '灼烧DOT，伤害为Boss的50%' },
    counterItem: '避火珠',
    humanFormDr: 0.80
  },

  '车迟三妖·虎鹿羊': {
    skills: [
      { id: 'tiger_thunder', name: '召雷部', type: 'debuff', effect: { dmg: 1.5, stunChance: 0.50, turns: 1 }, desc: '召唤雷电，高伤害+麻痹（玩家下回合有50%概率跳过）', caster: '虎力大仙' },
      { id: 'deer_meditation', name: '云梯显圣', type: 'guard', effect: { dr: 0.50, regen: 0.05 }, desc: '高台坐禅，减伤50%，每回合回血5%', caster: '鹿力大仙' },
      { id: 'sheep_illusion', name: '隔板猜物', type: 'debuff', effect: { miss: 0.40, turns: 1 }, desc: '幻术，玩家攻击miss40%', caster: '羊力大仙' }
    ],
    regionAffix: { name: '小幻术', miss: 0.20, desc: '玩家攻击miss20%' },
    counterItem: '避雷珠',
    rotation: true // 三妖轮转
  },

  // —— 第4章 ——
  '青牛精·独角兕': {
    skills: [
      { id: 'golden_ring', name: '金刚琢', type: 'disarm', effect: { disarmTurns: 2 }, desc: '套走玩家兵器2回合，无法物理攻击（法宝仍可用）' },
      { id: 'horn_charge', name: '独角冲撞', type: 'heavy', effect: { dmg: 2.0, stun: 1 }, desc: '高伤害+眩晕1回合（玩家跳过1回合）' },
      { id: 'diamond_body', name: '金刚护体', type: 'guard', effect: { dr: 0.40, reflect: 0.20 }, desc: '减伤40%，反弹物理攻击20%' },
      { id: 'weapon_fly', name: '兵器齐飞', type: 'multi', effect: { hits: 3, usePlayerAtk: true }, desc: '多段攻击，使用套来的玩家兵器攻击（伤害基于玩家攻击）' },
      { id: 'giant_form', name: '独角兕·法天象地', type: 'ultimate', effect: { atkBuff: 0.50, defBuff: 0.30 }, desc: '巨大化，攻击+50%，防御+30%', stage: 3 }
    ],
    regionAffix: { name: '兵刃格挡', dr: 0.20, desc: '减伤20%' },
    counterItem: '芭蕉扇',
    humanFormDr: 0.80
  },

  '金鱼精·灵感大王': {
    skills: [
      { id: 'water_escape', name: '水遁', type: 'defensive', effect: { miss: 0.50, dr: 0.30 }, desc: '潜入水中，玩家攻击miss50%，减伤30%' },
      { id: 'ice_freeze', name: '寒冰冻结', type: 'stun', effect: { stun: 1 }, desc: '冻结玩家1回合（跳过1回合）' },
      { id: 'giant_wave', name: '巨浪拍击', type: 'multi', effect: { hits: 3 }, desc: '3段水系攻击' },
      { id: 'inspiration_king_water', name: '灵感大王·水覆翻舟', type: 'ultimate', effect: { aoe: true, miss: 0.70, turns: 1 }, desc: '全屏AOE+水遁（下回合miss70%）' }
    ],
    regionAffix: { name: '水盾', dr: 0.20, desc: '减伤20%' },
    counterItem: '避水珠',
    humanFormDr: 0.80,
    manEatingRedLine: true // 食人红线
  },

  '女儿国·蝎子精': {
    skills: [
      { id: 'reverse_horse_poison', name: '倒马毒桩', type: 'dot', effect: { dotType: 'poison', dmgPct: 0.08, turns: 3, defDebuff: 0.30 }, desc: '剧毒DOT，每回合掉血8%，同时降低玩家防御30%，持续3回合' },
      { id: 'tail_sting_combo', name: '尾针连刺', type: 'multi', effect: { hits: 5, dot: 'poison' }, desc: '5段攻击，每段附带剧毒（叠加DOT层数）' },
      { id: 'pipa_charm', name: '琵琶魅惑', type: 'charm', effect: { charmChance: 0.50, turns: 1 }, desc: '玩家有50%概率被魅惑，下回合攻击自己' },
      { id: 'scorpion_armor', name: '蝎甲护身', type: 'guard', effect: { dr: 0.35, poisonReflect: 0.20 }, desc: '减伤35%，反弹毒伤害20%' }
    ],
    regionAffix: { name: '毒刺', dot: { type: 'poison', dmgPct: 0.04, turns: 2 }, desc: '中毒DOT，伤害为Boss的50%' },
    counterItem: '昴日星官',
    humanFormDr: 0.80
  },

  // —— 第5章 ——
  '六耳猕猴': {
    skills: [
      { id: 'mirror_clone', name: '镜像分身', type: 'summon', effect: { cloneHpPct: 0.50, cloneAtkPct: 0.50, turns: 3 }, desc: '召唤1个分身，分身拥有本体50%血量和攻击，持续3回合' },
      { id: 'listen_shape', name: '听音辨形', type: 'passive', effect: { miss: 0.30, dodgeHeavy: true }, desc: '预知玩家行动，玩家攻击miss30%，识破玩家蓄力（玩家heavy被闪避）' },
      { id: 'ruyi_staff', name: '如意金箍棒', type: 'heavy', effect: { dmg: 1.8, atkDebuff: 0.20, turns: 1 }, desc: '高伤害+击退（玩家下回合攻击-20%）' },
      { id: 'true_false_hard', name: '真假难辨', type: 'special', effect: { swapStats: true, turns: 1 }, desc: '与玩家交换攻防属性1回合（玩家用怪物属性，怪物用玩家属性）' },
      { id: 'six_ears_true', name: '六耳真身·万法皆明', type: 'ultimate', effect: { aoe: true, treasureCdAdd: 2 }, desc: '全屏AOE+封印（玩家法宝CD+2回合）', stage: 3 }
    ],
    regionAffix: { name: '分身', summon: { cloneHpPct: 0.30 }, desc: '召唤1个小怪（血量30%）' },
    counterItem: '如来金钵',
    counterItemNote: '照妖镜失效，特殊请神型',
    humanFormDr: 0.80
  },

  // —— 第6章 ——
  '火焰山·牛魔王': {
    skills: [
      { id: 'bull_horn_thrust', name: '牛角顶', type: 'heavy', effect: { dmg: 1.8, atkDebuff: 0.25, turns: 1 }, desc: '高伤害+击退（玩家下回合攻击-25%）' },
      { id: 'thick_skin', name: '皮厚肉糙', type: 'passive', effect: { dr: 0.25, critResist: 0.50 }, desc: '减伤25%，受到暴击伤害减半' },
      { id: 'continuous_thrust', name: '连顶', type: 'multi', effect: { hits: 3 }, desc: '3段冲撞攻击' },
      { id: 'banana_fan_storm', name: '芭蕉扇风暴', type: 'debuff', effect: { aoe: true, miss: 0.50, turns: 2 }, desc: '全屏AOE+玩家攻击miss50%，持续2回合' },
      { id: 'ping_tian_giant', name: '平天大圣·法天象地', type: 'ultimate', effect: { atkBuff: 0.60, defBuff: 0.40, hpBuff: 0.30 }, desc: '巨大化，攻击+60%，防御+40%，血量+30%', stage: 3 }
    ],
    regionAffix: { name: '风刃', miss: 0.20, desc: '玩家攻击miss20%' },
    counterItem: '定风珠',
    humanFormDr: 0.80
  },

  // —— 第7章 ——
  '狮驼岭·三魔拦路': {
    skills: [
      { id: 'green_lion_swallow', name: '吞山河', type: 'heavy', effect: { dmg: 2.0, swallowChance: 0.30, turns: 1 }, desc: '高伤害+吞咽（玩家下回合有30%概率被吞，跳过1回合）', caster: '青狮精' },
      { id: 'white_elephant_trunk', name: '象鼻卷半空', type: 'multi', effect: { hits: 3, atkDebuff: 0.30, turns: 1 }, desc: '控制+多段攻击，象鼻卷住玩家，3段攻击+束缚（玩家下回合攻击-30%）', caster: '白象精' },
      { id: 'roc_wing_blade', name: '翅膀风刃', type: 'debuff', effect: { aoe: true, miss: 0.40, turns: 1 }, desc: '全屏AOE+玩家攻击miss40%', caster: '大鹏金翅雕' },
      { id: 'yin_yang_vase', name: '阴阳二气瓶', type: 'dot', effect: { aoe: true, dotType: 'thunder_fire', dmgPct: 0.12, turns: 2, stunChance: 0.30 }, desc: '雷火齐发，高伤害+麻痹+灼烧（双DOT）', caster: '大鹏金翅雕' }
    ],
    regionAffix: { name: '群攻', multi: { hits: 2 }, desc: '多段攻击（2段）' },
    counterItem: '避火珠+避雷珠',
    counterItemNote: '双开克制大鹏阴阳二气瓶',
    rotation: true, // 三魔轮转
    manEatingRedLine: true // 食人红线
  },

  // —— 第8章 ——
  '黄狮精·玉华州': {
    skills: [
      { id: 'nail_party', name: '钉钯会·兵器齐舞', type: 'multi', effect: { hits: 3 }, desc: '3段攻击，使用偷来的兵器（八戒钉钯/沙僧宝杖/悟空金箍棒）' },
      { id: 'kind_heart', name: '善良之心', type: 'passive', effect: { atkDebuff: 0.20, defBuff: 0.20 }, desc: '攻击伤害-20%（不忍心下杀手），但防御+20%' },
      { id: 'nine_lion_grandson_roar', name: '九灵之孙·怒吼', type: 'heavy', effect: { dmg: 1.7, fearChance: 0.30, turns: 1 }, desc: '高伤害+恐惧（玩家下回合有30%概率逃跑，跳过1回合）' }
    ],
    regionAffix: null,
    humanFormDr: 0.80
  },

  '九灵元圣': { // 第8章章末Boss（地区15后）
    skills: [
      { id: 'nine_head_bite', name: '九头噬咬', type: 'multi', effect: { hits: 9 }, desc: '9段攻击，每段伤害中等，但9段总和极高' },
      { id: 'one_roar_mountain_break', name: '一声断岳', type: 'ultimate', effect: { aoe: true, instantKill: true, noItemCounter: true }, desc: '全屏秒杀级AOE，无宝可破（必须请太乙天尊）', stage: 3 },
      { id: 'nine_spirit_dharma', name: '九灵法相', type: 'passive', effect: { dr: 0.40, regen: 0.10, atkBuff: 0.30 }, desc: '减伤40%，每回合回血10%，攻击+30%', stage: 3 },
      { id: 'bamboo_mountain_illusion', name: '竹节山老妖·幻术', type: 'charm', effect: { charmChance: 0.40, turns: 1 }, desc: '玩家有40%概率被幻术迷惑，下回合攻击随机目标（可能攻击自己）' }
    ],
    regionAffix: { name: '小幻术', miss: 0.25, desc: '玩家攻击miss25%' },
    counterItem: '太乙救苦天尊',
    counterItemNote: '主人收回，非物理钩子，剧情请神',
    humanFormDr: 0.80
  },

  // —— 第9章 ——
  '假公主·玉兔': {
    skills: [
      { id: 'pestle_xuan_shuang', name: '捣药杵·玄霜', type: 'dot', effect: { dotType: 'xuan_shuang', dmgPct: 0.06, turns: 3, atkDebuff: 0.20 }, desc: '玄霜仙药DOT，每回合掉血6%，同时降低玩家攻击20%，持续3回合' },
      { id: 'embroidered_ball_marriage', name: '绣球招亲', type: 'charm', effect: { charmChance: 0.50, atkDebuff: 0.50, turns: 1 }, desc: '抛绣球，玩家有50%概率被魅惑，下回合攻击-50%' },
      { id: 'jade_rabbit_consecutive_pestle', name: '玉兔连捣', type: 'multi', effect: { hits: 3 }, desc: '3段捣药杵攻击' },
      { id: 'moon_palace_moonlight', name: '广寒宫·月华护体', type: 'shield', effect: { absorb: 0.50, miss: 0.30 }, desc: '吸收伤害，护盾存在时玩家攻击miss30%' }
    ],
    regionAffix: { name: '小玄霜', dot: { type: 'xuan_shuang', dmgPct: 0.03, turns: 2 }, desc: 'DOT，每回合掉血3%' },
    counterItem: '太阴星君',
    counterItemNote: '嫦娥收回型，剧情请神',
    humanFormDr: 0.80
  },

  '大圣残躯·无字碑': {
    skills: [
      { id: 'resentment_impact', name: '怨念冲击', type: 'heavy', effect: { dmg: 1.8, allStatsDebuff: 0.20, turns: 1 }, desc: '高伤害+诅咒（玩家下回合所有属性-20%）' },
      { id: 'golden_headband', name: '金箍紧箍', type: 'dot', effect: { dotType: 'curse', dmgPct: 0.05, turns: 3 }, desc: '紧箍咒，玩家每回合掉血5%，持续3回合' },
      { id: 'true_false_hard_residual', name: '真假难辨·残躯', type: 'passive', effect: { miss: 0.35 }, desc: '玩家攻击miss35%（残躯虚实难辨）' },
      { id: 'wordless_kill', name: '无字杀伐', type: 'ultimate', effect: { aoe: true, sealSeals: true, turns: 3 }, desc: '全屏AOE+封印（玩家劫印效果失效3回合）' }
    ],
    regionAffix: { name: '怨念', atkDebuff: 0.10, desc: '玩家攻击-10%' },
    humanFormDr: 0.80
  },

  '凌云渡·金蝉脱壳': {
    skills: [
      { id: 'shell_escape_body', name: '脱壳护体', type: 'guard', effect: { dr: 0.50, dodgeChance: 0.30 }, desc: '减伤50%，受到攻击时有30%概率闪避（脱壳）' },
      { id: 'cicada_chirp', name: '蝉鸣', type: 'stun', effect: { stunChance: 0.40, turns: 1 }, desc: '蝉鸣刺耳，玩家有40%概率被眩晕1回合' },
      { id: 'rejuvenation', name: '回春', type: 'heal', effect: { healPct: 0.15 }, desc: '恢复最大血量15%（脱壳重生）' },
      { id: 'cicada_wing_slash', name: '蝉翼斩', type: 'heavy', effect: { dmg: 1.8, defDebuff: 0.30, turns: 2 }, desc: '高伤害+破甲（玩家防御-30%，持续2回合）' },
      { id: 'golden_cicada_ten_lives', name: '金蝉子·十世修行', type: 'ultimate', effect: { aoe: true, cleansePlayerBuffs: true }, desc: '全屏AOE+净化（玩家所有增益buff失效）' }
    ],
    regionAffix: null,
    counterItem: '无底船',
    counterItemNote: '剧情道具，渡河脱壳',
    humanFormDr: 0.80
  },

  '第八十一难 · 通天河遇鼋湿经': {
    skills: [
      { id: 'water_capsize', name: '水覆翻舟', type: 'debuff', effect: { aoe: true, miss: 0.50, turns: 2 }, desc: '全屏AOE+玩家攻击miss50%，持续2回合' },
      { id: 'age_question_rage', name: '问寿之怒', type: 'heavy', effect: { dmg: 2.0, atkBuffStack: true }, desc: '高伤害+愤怒（老鼋攻击力+30%，可叠加）' },
      { id: 'giant_waves_soaring', name: '巨浪滔天', type: 'multi', effect: { hits: 5 }, desc: '5段水系攻击' },
      { id: 'rejuvenation_millennium', name: '回春·千年修为', type: 'heal', effect: { healPct: 0.20 }, desc: '恢复最大血量20%（千年老鼋修为）' },
      { id: 'final_robin_water_rage', name: '终局之劫·水覆之怒', type: 'ultimate', effect: { aoe: true, miss: 0.50, healPct: 0.10 }, desc: '全屏AOE+水遁+回春（三合一，终局施压）' }
    ],
    regionAffix: null,
    humanFormDr: 0.80
  },

  // —— 其他重要Boss ——
  '白龙·鹰愁涧': {
    skills: [
      { id: 'dragon_breath', name: '龙息', type: 'heavy', effect: { dmg: 1.6, dot: 'fire' }, desc: '高伤害+灼烧（龙息真火）' },
      { id: 'dragon_soar', name: '龙腾', type: 'defensive', effect: { miss: 0.40 }, desc: '玩家攻击miss40%（龙腾九天）' },
      { id: 'dragon_claw_combo', name: '龙爪连击', type: 'multi', effect: { hits: 3 }, desc: '3段龙爪攻击' },
      { id: 'west_sea_dragon_water_escape', name: '西海孽龙·水遁', type: 'passive', effect: { dr: 0.20, waterImmune: true }, desc: '减伤20%，水系攻击免疫' }
    ],
    regionAffix: null,
    dragonForm: true // 龙族形态
  },

  '流沙河·沙僧': {
    skills: [
      { id: 'demon_subduing_staff', name: '降妖宝杖', type: 'heavy', effect: { dmg: 1.7, atkDebuff: 0.20, turns: 1 }, desc: '高伤害+击退' },
      { id: 'nine_scripture_skulls', name: '九个取经人头骨', type: 'passive', effect: { dr: 0.25, regen: 0.05 }, desc: '减伤25%，每回合回血5%' },
      { id: 'quicksand_devour', name: '流沙吞噬', type: 'stun', effect: { stunChance: 0.40, turns: 1 }, desc: '玩家有40%概率被流沙吞噬，跳过1回合' },
      { id: 'curtain_lord_martial', name: '卷帘大将·天庭武艺', type: 'multi', effect: { hits: 3 }, desc: '3段攻击，天庭灵霄殿武艺' }
    ],
    regionAffix: null,
    humanFormDr: 0.80
  },

  '奎木狼·黄袍怪': {
    skills: [
      { id: 'yellow_robe', name: '黄袍加身', type: 'passive', effect: { dr: 0.30, atkBuff: 0.20 }, desc: '减伤30%，攻击+20%' },
      { id: 'sharira_elixir', name: '舍利子玲珑内丹', type: 'heavy', effect: { dmg: 1.8, dot: 'fire' }, desc: '高伤害+灼烧（内丹真火）' },
      { id: 'kuimu_wolf_star_power', name: '奎木狼·星辰之力', type: 'buff', effect: { atkBuff: 0.40, turns: 2 }, desc: '攻击力+40%，持续2回合（二十八宿星辰之力）' },
      { id: 'baoxiang_prince_human', name: '宝象国驸马·人形态', type: 'passive', effect: { dr: 0.80 }, desc: '人形态减伤80%' }
    ],
    regionAffix: null,
    humanFormDr: 0.80
  },

  '太上老君化身': {
    skills: [
      { id: 'alchemy_furnace_true_fire', name: '丹炉真火', type: 'dot', effect: { dotType: 'fire', dmgPct: 0.12, turns: 3 }, desc: '持续灼烧，每回合掉最大血量12%' },
      { id: 'add_fire_alchemy', name: '添火炼丹', type: 'buff', effect: { atkBuff: 0.30, stackable: true }, desc: '攻击叠层（越炼越猛）' },
      { id: 'furnace_explosion', name: '爆炉', type: 'heavy', effect: { dmg: 2.2 }, desc: '高伤害（爆炉）' },
      { id: 'alchemy_fire_consecutive', name: '丹火连燃', type: 'multi', effect: { hits: 3, dot: 'fire' }, desc: '3段火焰攻击' }
    ],
    regionAffix: null,
    humanFormDr: 0.80
  }
};

// =============================================================
// 二、精英怪专属技能注册表
// =============================================================
NDX.ELITE_SKILLS = {
  '金角银角': {
    skills: [
      { id: 'purple_gold_gourd', name: '紫金红葫芦', type: 'stun', effect: { stunChance: 0.50, turns: 1 }, desc: '喊名即收，玩家有50%概率被收入葫芦（跳过1回合）', caster: '金角大王' },
      { id: 'sheep_fat_jade_vase', name: '羊脂玉净瓶', type: 'stun', effect: { stunChance: 0.50, turns: 1 }, desc: '喊名即收，玩家有50%概率被收入净瓶（跳过1回合）', caster: '银角大王' },
      { id: 'weapons_together', name: '兵器齐出', type: 'multi', effect: { hits: 3 }, desc: '3段攻击' }
    ],
    minion: { name: '精细鬼/伶俐虫', hpPct: 0.30 },
    rotation: true // 金银双怪轮转
  },

  '火焰山·铁扇公主': {
    skills: [
      { id: 'banana_fan_fire_wind', name: '芭蕉扇·扇风助火', type: 'buff', effect: { atkBuff: 0.30, stackable: true, maxStacks: 3 }, desc: '攻击力+30%，可叠加3层' },
      { id: 'banana_fan_wind_blade', name: '芭蕉扇·风刃重击', type: 'heavy', effect: { dmg: 1.8, atkDebuff: 0.20, turns: 1 }, desc: '高伤害+击退' },
      { id: 'banana_fan_wind_combo', name: '芭蕉扇·风卷连击', type: 'multi', effect: { hits: 3 }, desc: '3段风系攻击' },
      { id: 'three_fans_wind_fire', name: '三扇风火', type: 'ultimate', effect: { consecutive: 3 }, desc: '低血阶段：连续3次芭蕉扇攻击', stage: 2 }
    ],
    regionAffix: { name: '风刃', miss: 0.20, desc: '玩家攻击miss20%' }
  },

  '毒敌山·蝎子精': {
    skills: [
      { id: 'reverse_horse_poison_elite', name: '倒马毒桩', type: 'dot', effect: { dotType: 'poison', dmgPct: 0.06, turns: 3, defDebuff: 0.25 }, desc: '剧毒DOT，每回合掉血6%，降低玩家防御25%' },
      { id: 'tail_sting_combo_elite', name: '尾针连刺', type: 'multi', effect: { hits: 4, dot: 'poison' }, desc: '4段攻击，每段附带剧毒' }
    ],
    regionAffix: { name: '毒刺', dot: { type: 'poison', dmgPct: 0.03, turns: 2 }, desc: '中毒DOT' }
  },

  '金兜洞·青牛精': {
    skills: [
      { id: 'golden_ring_elite', name: '金刚琢（预习）', type: 'disarm', effect: { disarmTurns: 2 }, desc: '套走玩家兵器2回合（预习版）' },
      { id: 'weapon_counter_elite', name: '兵器反打', type: 'heavy', effect: { dmg: 1.7 }, desc: '高伤害' },
      { id: 'weapons_fly_elite', name: '兵器齐飞', type: 'multi', effect: { hits: 3 }, desc: '3段攻击' }
    ],
    minion: { name: '看炉小妖', hpPct: 0.25 },
    regionAffix: { name: '兵刃格挡', dr: 0.20, desc: '减伤20%' }
  },

  '白虎岭·白骨精': {
    skills: [
      { id: 'vanish_elite', name: '遁形', type: 'special', effect: { vanishTurns: 1, nextCrit: 1.8 }, desc: '消失1回合，下回合出现时暴击（1.8倍）' },
      { id: 'bone_claw_combo_elite', name: '骨爪连击', type: 'multi', effect: { hits: 3, lifesteal: 0.30 }, desc: '3段攻击，吸血30%' },
      { id: 'death_blow_elite', name: '夺命重击', type: 'heavy', effect: { dmg: 1.7 }, desc: '高伤害' }
    ],
    regionAffix: { name: '骨爪', lifesteal: 0.10, desc: '吸血10%' }
  },

  '碗子山·黄袍怪': {
    skills: [
      { id: 'yellow_robe_elite', name: '黄袍加身', type: 'passive', effect: { dr: 0.25, atkBuff: 0.15 }, desc: '减伤25%，攻击+15%' },
      { id: 'sharira_elixir_elite', name: '舍利子玲珑内丹', type: 'heavy', effect: { dmg: 1.7, dot: 'fire' }, desc: '高伤害+灼烧' }
    ],
    regionAffix: null
  },

  '祭赛国·九头虫': {
    skills: [
      { id: 'nine_head_bite_elite', name: '九头噬咬', type: 'multi', effect: { hits: 5 }, desc: '5段攻击' },
      { id: 'water_escape_elite', name: '水遁', type: 'defensive', effect: { miss: 0.40, dr: 0.25 }, desc: '玩家攻击miss40%，减伤25%' },
      { id: 'blood_rain_curse', name: '血雨诅咒', type: 'dot', effect: { dotType: 'curse', dmgPct: 0.07, turns: 3 }, desc: '诅咒DOT，每回合掉血7%' }
    ],
    minion: { name: '虾兵蟹将', hpPct: 0.25 },
    regionAffix: { name: '水盾', dr: 0.20, desc: '减伤20%' }
  },

  '黄风卷岭': {
    skills: [
      { id: 'wind_blow_elite', name: '吹风', type: 'debuff', effect: { miss: 0.30, turns: 1 }, desc: '玩家攻击miss30%' },
      { id: 'wind_blade_elite', name: '风刃', type: 'atk', effect: {}, desc: '基础攻击' }
    ],
    regionAffix: { name: '吹沙', miss: 0.30, desc: '玩家攻击miss30%' }
  },

  '狮驼初现': {
    skills: [
      { id: 'group_attack_elite', name: '群攻', type: 'multi', effect: { hits: 2 }, desc: '2段攻击' },
      { id: 'demon_roar', name: '妖吼', type: 'debuff', effect: { atkDebuff: 0.15, turns: 1 }, desc: '玩家攻击-15%' }
    ],
    regionAffix: { name: '群攻', multi: { hits: 2 }, desc: '多段攻击（2段）' }
  },

  '乌巢禅师': {
    skills: [
      { id: 'heart_sutra', name: '心经', type: 'heal', effect: { healPct: 0.15 }, desc: '恢复最大血量15%' },
      { id: 'zen_illusion', name: '禅意幻术', type: 'debuff', effect: { miss: 0.35, turns: 1 }, desc: '玩家攻击miss35%' },
      { id: 'palm_strike', name: '一掌', type: 'heavy', effect: { dmg: 1.8 }, desc: '高伤害' }
    ],
    regionAffix: null
  },

  '高老招亲': { // 猪八戒
    skills: [
      { id: 'nine_tooth_rake', name: '九齿钉耙', type: 'heavy', effect: { dmg: 1.7 }, desc: '高伤害' },
      { id: 'rake_combo', name: '钉耙连击', type: 'multi', effect: { hits: 3 }, desc: '3段攻击' },
      { id: 'marshal_canopy', name: '天蓬元帅', type: 'passive', effect: { dr: 0.20, atkBuff: 0.15 }, desc: '减伤20%，攻击+15%' }
    ],
    regionAffix: null
  },

  // —— 补充Boss专属技能 ——
  '乌鸡国·青毛狮': {
    skills: [
      { id: 'lion_roar', name: '狮吼功', type: 'debuff', effect: { atk: -0.30, turns: 2 }, desc: '玩家攻击-30%，持续2回合' },
      { id: 'royal_seal', name: '玉玺镇压', type: 'heavy', effect: { dmg: 1.8, stun: 1 }, desc: '高伤害+眩晕1回合' },
      { id: 'lion_claw', name: '狮爪撕裂', type: 'multi', effect: { hits: 2, bleed: true }, desc: '2段攻击+流血DOT' },
      { id: 'false_king', name: '假国王', type: 'passive', effect: { dr: 0.25 }, desc: '减伤25%' }
    ],
    regionAffix: { name: '狮威', atkDebuff: 0.15, desc: '玩家攻击-15%' }
  },

  '五行归墟·大圣残躯': {
    skills: [
      { id: 'broken_staff', name: '残棍横扫', type: 'heavy', effect: { dmg: 2.0 }, desc: '超高伤害' },
      { id: 'golden_eyes', name: '火眼金睛', type: 'debuff', effect: { miss: 0.40, turns: 1 }, desc: '玩家攻击miss40%' },
      { id: 'monkey_clone', name: '身外身法', type: 'summon', effect: { cloneHpPct: 0.40 }, desc: '召唤1个分身（血量40%）' },
      { id: 'great_sage', name: '大圣之怒', type: 'ultimate', effect: { dmg: 2.5, aoe: true }, desc: '全屏AOE超高伤害', stage: 3 }
    ],
    regionAffix: { name: '妖气', atkBuff: 0.10, desc: '怪物攻击+10%' }
  },

  '牛魔王': {
    skills: [
      { id: 'bull_charge', name: '蛮牛冲撞', type: 'heavy', effect: { dmg: 1.9, knockback: true }, desc: '高伤害+击退' },
      { id: 'fire_breath', name: '火焰吐息', type: 'dot', effect: { dmgPct: 0.08, turns: 3 }, desc: '灼烧DOT，每回合掉血8%，持续3回合' },
      { id: 'bull_roar', name: '牛吼震天', type: 'debuff', effect: { def: -0.30, turns: 2 }, desc: '玩家防御-30%，持续2回合' },
      { id: 'demon_bull', name: '魔牛真身', type: 'passive', effect: { dr: 0.30, atkBuff: 0.20 }, desc: '减伤30%，攻击+20%' }
    ],
    regionAffix: { name: '火焰', dot: { type: 'fire', dmgPct: 0.04, turns: 2 }, desc: '灼烧DOT' }
  },

  '九头虫·碧波潭': {
    skills: [
      { id: 'nine_heads', name: '九头齐攻', type: 'multi', effect: { hits: 9 }, desc: '9段攻击（每段伤害较低）' },
      { id: 'poison_fog', name: '毒雾弥漫', type: 'dot', effect: { dmgPct: 0.06, turns: 3, poison: true }, desc: '剧毒DOT，每回合掉血6%，持续3回合' },
      { id: 'water_prison', name: '水牢困锁', type: 'stun', effect: { stunTurns: 2 }, desc: '眩晕2回合' },
      { id: 'dragon_blood', name: '龙血再生', type: 'heal', effect: { healPct: 0.20 }, desc: '恢复最大血量20%' }
    ],
    regionAffix: { name: '毒雾', dot: { type: 'poison', dmgPct: 0.03, turns: 2 }, desc: '剧毒DOT' }
  },

  '大鹏金翅雕': {
    skills: [
      { id: 'wing_slash', name: '金翅斩', type: 'heavy', effect: { dmg: 2.0 }, desc: '超高伤害' },
      { id: 'sky_dive', name: '天翔俯冲', type: 'multi', effect: { hits: 3 }, desc: '3段攻击' },
      { id: 'wind_storm', name: '飓风席卷', type: 'debuff', effect: { miss: 0.50, turns: 2 }, desc: '玩家攻击miss50%，持续2回合' },
      { id: 'golden_wings', name: '金翅护体', type: 'shield', effect: { absorb: 0.60 }, desc: '吸收伤害，护盾存在时减伤60%' },
      { id: 'peng_ultimate', name: '大鹏展翅', type: 'ultimate', effect: { dmg: 2.5, aoe: true, miss: 0.30 }, desc: '全屏AOE+致盲（miss30%）', stage: 3 }
    ],
    regionAffix: { name: '飓风', miss: 0.25, desc: '玩家攻击miss25%' }
  },

  '通天河老鼋·湿经': {
    skills: [
      { id: 'shell_smash', name: '龟壳碾压', type: 'heavy', effect: { dmg: 1.8 }, desc: '高伤害' },
      { id: 'water_surge', name: '河水暴涨', type: 'dot', effect: { dmgPct: 0.05, turns: 3 }, desc: '水属性DOT，每回合掉血5%，持续3回合' },
      { id: 'ancient_shell', name: '上古龟壳', type: 'passive', effect: { dr: 0.40 }, desc: '减伤40%（超高防御）' },
      { id: 'script_wet', name: '湿经之厄', type: 'debuff', effect: { atk: -0.25, def: -0.25, turns: 3 }, desc: '玩家攻击-25%，防御-25%，持续3回合' }
    ],
    regionAffix: { name: '河水', dot: { type: 'water', dmgPct: 0.02, turns: 2 }, desc: '水属性DOT' }
  }
};

// =============================================================
// 三、区域属性传染表
// 键 = 地区号（act），值 = 该区域的属性传染配置
// =============================================================
NDX.REGION_AFFIXES = {
  1: { name: '吹沙', miss: 0.30, desc: '玩家攻击miss30%', boss: '黄风大圣' },
  2: { name: '骨爪', lifesteal: 0.10, desc: '吸血10%', boss: '五行归墟' },
  3: { name: '火星', dot: { type: 'fire', dmgPct: 0.05, turns: 2 }, desc: '灼烧DOT，伤害为Boss的50%', boss: '红孩儿·三昧真火' },
  4: { name: '兵刃格挡', dr: 0.20, desc: '减伤20%', boss: '青牛精·独角兕' },
  5: { name: '分身', summon: { cloneHpPct: 0.30 }, desc: '召唤1个小怪（血量30%）', boss: '六耳猕猴' },
  6: { name: '风刃', miss: 0.20, desc: '玩家攻击miss20%', boss: '火焰山·牛魔王' },
  7: { name: '群攻', multi: { hits: 2 }, desc: '多段攻击（2段）', boss: '狮驼岭·三魔拦路' },
  8: { name: '小幻术', miss: 0.25, desc: '玩家攻击miss25%', boss: '九灵元圣' },
  9: { name: '小玄霜', dot: { type: 'xuan_shuang', dmgPct: 0.03, turns: 2 }, desc: 'DOT，每回合掉血3%', boss: '假公主·玉兔' }
};

// =============================================================
// 四、辅助函数
// =============================================================

// 显示名 → BOSS_SKILLS 内部键 别名表（单一真源）
//   运行时 monster.name = NDX.CHAPTER_BOSS_NAMES[i]（「给玩家看的叙事全名」），
//   而 BOSS_SKILLS 的键是「技能表内部键」，两者不总一致（如 '白骨夫人·五行归墟' vs '五行归墟'）。
//   getBossSkills 走 BOSS_SKILLS[键] 精确查找，缺别名会使章末 Boss 静默丧失专属技能。
//   镜像 enemies_part1.js:BOSS_FORM_ALIAS 的模式，但作用于技能层。
//   新增章末 Boss 时：若显示名与 BOSS_SKILLS 键不一致，必须同步新增本表项，并由
//   scripts/_verify_boss_skills.js 「九章末 Boss 技能命中」断拦截。
NDX.BOSS_SKILL_ALIAS = {
  '白骨夫人·五行归墟': '五行归墟',      // ch2
  '青牛精·金刚琢':     '青牛精·独角兕',  // ch4
  '牛魔王':             '火焰山·牛魔王',   // ch6
  '九灵元圣·断岳法相': '九灵元圣',        // ch8
  // ch9 '传经吏·索经' 尚无对应 BOSS_SKILLS 键：终局 Boss 待补新内容（已在门禁中作为非阻断 TODO 标注）
};

// 获取Boss专属技能（先解析显示名别名，再处理 entry.aliasOf 引用）
NDX.getBossSkills = function(bossName) {
  if (!bossName) return null;
  // V9.62: 显示名→内部键别名（镜像 BOSS_FORM_ALIAS 模式）
  const resolved = (NDX.BOSS_SKILL_ALIAS && NDX.BOSS_SKILL_ALIAS[bossName]) || bossName;
  const entry = NDX.BOSS_SKILLS[resolved];
  if (!entry) return null;
  if (entry.aliasOf) {
    return NDX.BOSS_SKILLS[entry.aliasOf] || null;
  }
  return entry;
};

// 获取精英专属技能
NDX.getEliteSkills = function(eliteName) {
  return NDX.ELITE_SKILLS[eliteName] || null;
};

// 获取区域属性传染
NDX.getRegionAffix = function(act) {
  return NDX.REGION_AFFIXES[act] || null;
};

// 应用区域属性到怪物
NDX.applyRegionAffix = function(monster, act) {
  const affix = NDX.getRegionAffix(act);
  if (!affix) return monster;
  monster.regionAffix = Object.assign({}, affix);
  if (!monster.tags) monster.tags = [];
  if (monster.tags.indexOf(affix.name) < 0) {
    monster.tags.push(affix.name);
  }
  return monster;
};


// =============================================================
// 五、Boss专属技能图标系统
// 按技能类型映射图标（emoji 为 interim 方案；接入真实图标资源后此处改为 sprite/icon 引用，见 boss_skill_icons.js）
// =============================================================
NDX.BOSS_SKILL_ICONS = {
  // 基础攻击类
  'atk': '⚔️',
  'heavy': '💥',
  'multi': '🗡️',
  // 防御类
  'guard': '🛡️',
  'shield': '🔰',
  'defensive': '🛡️',
  // 增益类
  'buff': '⬆️',
  'heal': '💚',
  // DOT持续伤害类
  'dot': '🔥',
  // 控制类
  'stun': '💫',
  'disarm': '🔓',
  'charm': '💕',
  // 减益类
  'debuff': '🌫️',
  // 特殊类
  'lifesteal': '🩸',
  'special': '✨',
  'summon': '👥',
  'ultimate': '🌟',
  'passive': '⚡',
  'stage': '🔄'
};

// 获取技能图标
NDX.getBossSkillIcon = function(skillType) {
  return NDX.BOSS_SKILL_ICONS[skillType] || '⚔️';
};

// 获取技能图标HTML
NDX.getBossSkillIconHtml = function(skillType, size) {
  const icon = NDX.getBossSkillIcon(skillType);
  const s = size || 20;
  return '<span class="boss-skill-icon" style="font-size:' + s + 'px;display:inline-block;text-align:center;line-height:1;">' + icon + '</span>';
};

console.log('[boss_skills] Boss专属技能系统已加载：' +
  Object.keys(NDX.BOSS_SKILLS).length + '个Boss / ' +
  Object.keys(NDX.ELITE_SKILLS).length + '个精英 / ' +
  Object.keys(NDX.REGION_AFFIXES).length + '个区域属性');

// =============================================================
// 🆕 V9.61 玩家侧 debuff 参数表（Boss 技能链复活·第五块断链补全）
//   背景：内核消费层（combat_part1 V8.50）读 NDX.PDB_DOT/PDB_MISS/PDB_ATKMUL，
//   但三表全仓从未定义 ⇒ 消费层读空表。本表为**新增数值**（v1 估值，平衡批次实测后复核）。
//   消费口径（combat_part1.js:982-1010）：
//     DOT  ：dmg = max(flat, maxHp×pctMaxHp + m.atk×atkMul)，每回合 tick
//     MISS ：取同时生效者中概率最高者，命中判定（stun→1.0 ≈ 跳过玩家攻击回合的近似实现）
//     ATKMUL：取同时生效者中乘数最小者（惩罚最强）
NDX.PDB_DOT = {
  fire:         { kind: '灼烧', pctMaxHp: 0.04, atkMul: 0.6, flat: 20 },
  poison:       { kind: '毒蚀', pctMaxHp: 0.03, atkMul: 0.5, flat: 15 },
  thunder_fire: { kind: '雷火', pctMaxHp: 0.05, atkMul: 0.7, flat: 25 },
  xuan_shuang:  { kind: '玄霜', pctMaxHp: 0.03, atkMul: 0.4, flat: 15 },
  curse:        { kind: '咒蚀', pctMaxHp: 0.03, atkMul: 0.5, flat: 15 }
};
NDX.PDB_MISS = {
  blind: 0.50,  // 致盲：技能效果 miss 0.20~0.60 收敛为单档 v1（平衡批次可分级）
  stun: 1.0     // 眩晕：近似跳过玩家攻击回合
};
NDX.PDB_ATKMUL = {
  weak: 0.70,    // 破甲（defDebuff）
  atkDown: 0.75  // 减攻（atkDebuff）
};
