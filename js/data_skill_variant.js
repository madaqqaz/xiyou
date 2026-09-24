// =============================================================
// data_skill_variant.js — 《逆道西行》技能变种 / 状态 / 法宝联动 · 真源（V9.29）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
//
// 设计要旨（用户拍板 V9.29）：
//   ① 本命道修正：悟空＝夺 / 八戒＝缘 / 沙僧＝战 / 白马＝隐 / 唐僧＝渡（见 data_config.js HERO_HOME_DAO）
//   ② 「化攻为盾」废除 → 改为「舍攻为盾」：取消本次物理攻击，改为增加护盾（全英雄适用）
//   ③ 技能不再是纯伤害：普攻/诵经各有变种，含 buff / debuff / 多重攻击 / 群伤
//   ④ debuff 与法宝联动：装备金刚琢 → 攻击概率打晕；毒/火类法宝 → 挂中毒/灼烧
//   ⑤ 大招随隐藏职业变更：隐藏职 → 流派标签 → 大招变体（同一英雄多玩法）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// 一、状态字典（buff / debuff）
//   统一真源。side: 'enemy'=施加于怪物｜'self'=施加于自身
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

// ============================================================
// 二、法宝 → 状态联动（用户拍板：debuff 与法宝结合）
//   key = 至宝 id（含道向进化形态），chance = 命中后触发概率，status = 施加状态
//   金刚琢＝套尽神兵 → 眩晕；倒马毒桩＝毒；三昧真火/芭蕉扇＝灼烧；金铙＝封技；金铃＝虚弱
// ============================================================
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

// 取玩家当前生效的法宝状态源（装备/持有皆可）；返回 [{status, chance, tip}]
NDX.treasureStatusSources = function (s) {
  const out = [];
  if (!s) return out;
  const pool = [];
  // 装备槽（gear）与持有（treasures / held）都认，兼容两套存档字段
  ['gear', 'treasures', 'held', 'equip'].forEach(function (k) {
    const v = s[k];
    if (Array.isArray(v)) v.forEach(function (x) { if (x) pool.push(typeof x === 'string' ? x : (x.id || x.key)); });
    else if (v && typeof v === 'object') Object.keys(v).forEach(function (id) { if (v[id]) pool.push(id); });
  });
  const seen = {};
  pool.forEach(function (id) {
    if (!id || seen[id]) return;
    seen[id] = 1;
    const cfg = NDX.TREASURE_STATUS[id];
    if (cfg) out.push({ status: cfg.status, chance: cfg.chance, tip: cfg.tip, src: id });
  });
  return out;
};

// 法宝状态注入：按概率把状态挂到 act.mStatus（对敌）/ act.sStatus（对己）
NDX.applyTreasureStatus = function (act, s, rng) {
  if (!act) return act;
  const r = rng || Math.random;
  const srcs = NDX.treasureStatusSources(s);
  for (let i = 0; i < srcs.length; i++) {
    const it = srcs[i];
    if (r() < it.chance) {
      act.mStatus = act.mStatus || {};
      act.mStatus[it.status] = Math.max(act.mStatus[it.status] || 0, (NDX.STATUS_DEFS[it.status] || {}).rounds || 1);
      act.note = (act.note ? act.note + '·' : '') + (NDX.STATUS_DEFS[it.status] || {}).name;
      act.statusTip = act.statusTip || it.tip;
    }
  }
  return act;
};

// ============================================================
// 三、普攻变种（攻击键）
//   用户拍板：舍攻为盾 = 取消物理攻击 → 改为增加护盾（全英雄适用）
//   hits/spread：多重攻击；aoe：群伤（溅射系数）
// ============================================================
NDX.ATK_VARIANTS = {
  plain: {
    name: '直击', desc: '无变体，本命攻式原样',
    apply: function (act) { return act; },
  },
  'sac-shield': {
    name: '舍攻为盾', desc: '放弃本次物理攻击，转为自身护盾（全英雄适用）',
    apply: function (act) {
      const base = Math.max(1, act.dmg || 0);
      act.dmg = 0; act.noDamage = true;
      act.shield = Math.max(1, Math.round(base * 0.9));
      act.trueDmg = 0; act.heal = 0;
      act.note = '舍攻为盾：弃攻成壁';
      return act;
    },
  },
  drain: {
    name: '噬血', desc: '普攻吸血 22%',
    apply: function (act) { act.heal = Math.max(1, Math.round((act.dmg || 0) * 0.22)); act.note = (act.note ? act.note + '·' : '') + '噬血'; return act; },
  },
  combo: {
    name: '连环', desc: '概率追加一段伤害',
    apply: function (act) { act.hits = 2; act.spread = 0.35; act.note = (act.note ? act.note + '·' : '') + '连环'; return act; },
  },
  crit: {
    name: '战意', desc: '必胜暴击 + 暴伤 +50%',
    apply: function (act) { act.critHit = true; act.critDmg = (act.critDmg || 0) + 0.5; act.note = (act.note ? act.note + '·' : '') + '战意'; return act; },
  },
  sunder: {
    name: '破相', desc: '附加 25% 无视防御真伤 + 破甲',
    apply: function (act) { act.trueDmg = Math.max(1, Math.round((act.dmg || 0) * 0.25)); act.armorBreak = true; act.note = (act.note ? act.note + '·' : '') + '破相'; return act; },
  },
  guard: {
    name: '御守', desc: '攻守兼备：本次伤害 -20%，换取本回合减伤 25%',
    apply: function (act) {
      act.dmg = Math.max(1, Math.round((act.dmg || 0) * 0.8));
      act.dr = 0.25;
      act.note = (act.note ? act.note + '·' : '') + '御守（本回合减伤25%）';
      return act;
    },
  },
  multi: {
    name: '多重攻击', desc: '三段连击（总伤 ×1.15 分摊）',
    apply: function (act) { act.dmg = Math.max(1, Math.round((act.dmg || 0) * 0.42)); act.hits = 3; act.spread = 0.20; act.note = (act.note ? act.note + '·' : '') + '多重攻击'; return act; },
  },
  aoe: {
    name: '群伤', desc: '主目标全额，其余目标 60% 溅射',
    apply: function (act) { act.aoe = 0.6; act.note = (act.note ? act.note + '·' : '') + '群伤'; return act; },
  },
  counter: {
    name: '反击', desc: '防御反击流：受击后回打一击（按承伤 60%）并吸血 30%',
    apply: function (act) { act.guardCounter = true; act.counterPct = 0.6; act.counterLifesteal = 0.30; act.note = (act.note ? act.note + '·' : '') + '反击'; return act; },
  },
};

// ============================================================
// 四、诵经变种（诵经键）——含治疗 / 净化 / buff / 反伤 / 群伤
//   act.sBuff：给自身挂增益（rounds 回合）
//   act.cleanse：清除自身全部异常（针对不用法宝打 Boss 的续航手段）
// ============================================================
NDX.CHANT_VARIANTS = {
  plain:  { name: '诵经', desc: '无变体，本命诵经原样', apply: function (act) { return act; } },
  heal:   { name: '回春诵', desc: '诵经回血 50%',
    apply: function (act) { act.heal = Math.max(1, Math.round((act.dmg || 0) * 0.5)); act.note = (act.note ? act.note + '·' : '') + '回春'; return act; } },
  cleanse:{ name: '净秽诵', desc: '回血 35% 并清除自身全部异常状态',
    apply: function (act) { act.heal = Math.max(1, Math.round((act.dmg || 0) * 0.35)); act.cleanse = true; act.note = (act.note ? act.note + '·' : '') + '净秽'; return act; } },
  ward:   { name: '凝护诵', desc: '护盾 35% + 20% 穿刺真伤',
    apply: function (act) { act.shield = Math.max(1, Math.round((act.dmg || 0) * 0.35)); act.trueDmg = Math.max(1, Math.round((act.dmg || 0) * 0.2)); act.note = (act.note ? act.note + '·' : '') + '凝护'; return act; } },
  reflect:{ name: '业报诵', desc: '本回合受击反伤 25%',
    apply: function (act) { act.reflect = 0.25; act.note = (act.note ? act.note + '·' : '') + '业报'; return act; } },
  pierce: { name: '梵音诵', desc: '无视防御真伤 25%',
    apply: function (act) { act.trueDmg = Math.max(1, Math.round((act.dmg || 0) * 0.25)); act.ignoreDef = true; act.note = (act.note ? act.note + '·' : '') + '梵音'; return act; } },
  aegis: {
    name: '金刚诵', desc: '减伤诵：自身获得「护体」减伤（3 回合）+ 少量护盾',
    apply: function (act) {
      act.sBuff = { ward: 3 };
      act.shield = Math.max(1, Math.round((act.dmg || 0) * 0.2));
      act.dr = (act.dr || 0) + 0.15;
      act.note = (act.note ? act.note + '·' : '') + '金刚（减伤）';
      return act;
    },
  },
  buff:   { name: '增益诵', desc: '自身获得金刚怒 + 护体（3 回合）',
    apply: function (act) { act.sBuff = { might: 3, ward: 3 }; act.note = (act.note ? act.note + '·' : '') + '增益'; return act; } },
  aoe:    { name: '普照诵', desc: '群伤：其余目标 50% 溅射 + 附加最大生命真伤',
    apply: function (act) { act.aoe = 0.5; act.trueDmg = Math.max(1, (act.trueDmg || 0) + Math.round((act.dmg || 0) * 0.1)); act.note = (act.note ? act.note + '·' : '') + '普照'; return act; } },
  counter:{ name: '护法诵', desc: '防御反击诵：受击回打一击并吸血（肉盾反打流）',
    apply: function (act) { act.guardCounter = true; act.counterPct = 0.5; act.counterLifesteal = 0.30; act.note = (act.note ? act.note + '·' : '') + '护法反击'; return act; } },
};

// 应用变种（安全：未知 key 直返原 act）
NDX.applyActVariant = function (act, kind, key) {
  if (!act || !key || key === 'plain') return act;
  const tab = (kind === 'chant') ? NDX.CHANT_VARIANTS : NDX.ATK_VARIANTS;
  const v = tab && tab[key];
  if (v && typeof v.apply === 'function') { try { v.apply(act); } catch (e) { /* 变种绝不拖垮战斗 */ } }
  return act;
};

// ============================================================
// 五、隐藏职业 → 流派标签（大招变体的驱动源）
//   用户拍板：英雄路线太单一 → 与隐藏职业结合，大招随职业变更
// ============================================================
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
  '净坛·踏焰': 'burn', '圣婴折服': 'burn',
  // 逆道流
  '六耳·残': 'reverse', '真·逆道': 'reverse', '行旅录主': 'reverse',
  '悟空的空': 'reverse', '悟空的镜': 'reverse', '悟空的嗅': 'reverse',
};
NDX.jobStyleOf = function (jobKey) {
  return (jobKey && NDX.JOB_STYLE[jobKey]) || null;
};

// ============================================================
// 六、大招随流派变体（同英雄不同隐藏职 → 不同大招效果）
//   在基础大招之上改写；每流派机制唯一，禁止跨流派复用
// ============================================================
NDX.ULT_STYLE_MOD = {
  summon:  { name: '万兽朝元', desc: '召唤灵兽助战：本回合追加一次灵兽打击', summon: true, hits: 2, spread: 0.3 },
  reflect: { name: '万劫反噬', desc: '受击全额反伤，并立金身护盾',          reflect: 0.35, shield: 0.40 },
  combo:   { name: '千棍破阵', desc: '五段连击，每段附破甲真伤',            hits: 5, spread: 0.18, armorBreak: true, trueDmg: 0.15 },
  crit:    { name: '一棍定天', desc: '必暴，暴伤 +80%',                     critHit: true, critDmg: 0.8 },
  ward:    { name: '不坏金身', desc: '大护盾 + 减伤，本回合立于不败',        shield: 0.55, dr: 0.20 },
  evade:   { name: '影遁三袭', desc: '三段影袭，并提升自身闪避',             hits: 3, spread: 0.22, evaUp: 0.20 },
  drain:   { name: '吞噬天地', desc: '重击并大口吸血',                       heal: 0.55, lifesteal: 0.25 },
  purify:  { name: '大慈大悲', desc: '法伤并净化自身全部异常，回春大地',     cleanse: true, heal: 0.40, sBuff: { regen: 3 } },
  burn:    { name: '业火焚天', desc: '附加三回合灼烧',                       dot: { pct: 0.18, rounds: 3 }, burn: true },
  reverse: { name: '逆鳞血祭', desc: '以战养战：伤害 ×1.3 并吸血 30%',       dmgMul: 1.3, lifesteal: 0.30, heal: 0.30 },
};

// 取大招变体（未转职/未识别 → null，保持原大招）
NDX.ultVariantFor = function (heroId, tier, jobKey) {
  void heroId; void tier;
  const style = NDX.jobStyleOf(jobKey);
  if (!style) return null;
  return NDX.ULT_STYLE_MOD[style] || null;
};

// 应用大招变体（数据驱动，不新造引擎；未知字段由战斗侧按需消费）
NDX.applyUltVariant = function (act, heroId, tier, jobKey) {
  if (!act) return act;
  const v = NDX.ultVariantFor(heroId, tier, jobKey);
  if (!v) return act;
  const dmg = Math.max(1, act.dmg || 0);
  if (v.dmgMul) act.dmg = Math.max(1, Math.round(dmg * v.dmgMul));
  if (v.hits) { act.hits = v.hits; act.spread = v.spread || 0.2; }
  if (v.critHit) { act.critHit = true; act.critDmg = v.critDmg || 0.5; }
  if (v.trueDmg) act.trueDmg = Math.max(1, Math.round((act.dmg || dmg) * v.trueDmg));
  if (v.armorBreak) act.armorBreak = true;
  if (v.shield) act.shield = Math.max(1, Math.round((act.dmg || dmg) * v.shield));
  if (v.heal) act.heal = Math.max(1, Math.round((act.dmg || dmg) * v.heal));
  if (v.lifesteal) act.lifesteal = (act.lifesteal || 0) + v.lifesteal;
  if (v.reflect) act.reflect = (act.reflect || 0) + v.reflect;
  if (v.dr) act.dr = (act.dr || 0) + v.dr;
  if (v.evaUp) act.evaUp = (act.evaUp || 0) + v.evaUp;
  if (v.cleanse) act.cleanse = true;
  if (v.sBuff) act.sBuff = v.sBuff;
  if (v.dot) act.dot = { per: Math.max(1, Math.round((act.dmg || dmg) * v.dot.pct)), rounds: v.dot.rounds, kind: '业火' };
  if (v.summon) act.summon = true;
  act.ultStyle = NDX.jobStyleOf(jobKey);
  act.name = v.name + '（' + act.name + '）';
  act.note = v.desc;
  return act;
};

// ============================================================
// 六·四、累计血量序列传播（V9.34 修复）
//   战斗明细的 pHpAfter / mHpAfter 是「逐回合累计 running 值」，而顶层 res.playerHpLeft /
//   res.monsterHpLeft 取【末回合】值。故任何 post-hoc 单点修正（减伤/眩晕/虚弱/封技/破甲/
//   DoT/反击/法宝 on-hit）都必须向后续回合传播，否则修正只改某回合显示，对最终胜负与
//   战后气血毫无影响（此前 V9.30-9.33 的落地即因此形同虚设）。
//   _bumpHp(res, list, fromIdx, key, delta)：把 delta 施加于 fromIdx 起的所有回合（含）。
// ============================================================
NDX._bumpHp = function (res, list, fromIdx, key, delta) {
  if (!res || !list || !delta) return;
  const maxHp = res.maxHp || 1;
  const maxM = res.maxMHp || 0;
  for (let j = Math.max(0, fromIdx); j < list.length; j++) {
    const r = list[j];
    if (!r) break;
    if (key === 'p') r.pHpAfter = Math.min(maxHp, Math.max(0, (r.pHpAfter || 0) + delta));
    else r.mHpAfter = Math.max(0, maxM ? Math.min(maxM, (r.mHpAfter || 0) + delta) : ((r.mHpAfter || 0) + delta));
  }
};

// ============================================================
// 六·四·一、编队战顶层同步（V9.38）
//   编队战（res.squad.length > 1）的胜负 / 回合截断由 calcCombatSquad 收口，不能按主怪死亡点切片、
//   也不能据 monsterHpLeft 重判 win。但 post-hoc 传播（减伤 / 眩晕 / 虚弱 / 封技 / 破甲 / DoT /
//   反击 / 经位 on-hit）已把修正写进 roundsDetail 的累计序列 —— 顶层玩家气血必须跟随末回合，
//   否则「明细已回补、顶层仍是旧值」，玩家看到的战后气血与回合表自相矛盾（V9.34 的编队残留）。
// ============================================================
NDX._syncSquadTop = function (res) {
  if (!res || !res.roundsDetail || !res.roundsDetail.length) return res;
  const last = res.roundsDetail[res.roundsDetail.length - 1];
  res.playerHpLeft = Math.min(res.maxHp || 1, Math.max(0, last.pHpAfter || 0));
  res.lose = res.playerHpLeft <= 0;
  if (res.lose) res.win = false;   // 玩家阵亡 → 无论从怪是否清完都不判胜；胜局不因回补降级
  return res;
};

// ============================================================
// 六·五、减伤落地（避免「减伤」成为只写在 act 上的死属性）
//   把受影响回合内怪物的实伤（mTurn.deal）按 pct 折减，并把差额回补玩家气血。
//   与 applyActiveIntervention 中 heal 的「逐回合回补」同口径，保证回合表自洽。
// ============================================================
NDX.applyDamageReduction = function (res, idx, pct, rounds) {
  if (!res || !res.roundsDetail || !(pct > 0)) return res;
  const list = res.roundsDetail;
  const maxHp = res.maxHp || 1;
  const _isSquad = !!(res.squad && res.squad.length > 1);
  const end = Math.min(list.length, idx + Math.max(1, rounds || 1));
  for (let i = Math.max(0, idx); i < end; i++) {
    const r = list[i];
    if (!r) break;
    const dealt = (r.mTurn && r.mTurn.deal) || 0;
    if (dealt <= 0) continue;
    const cut = Math.min(dealt, Math.round(dealt * pct));
    if (cut <= 0) continue;
    if (r.mTurn) { r.mTurn.deal = Math.max(0, r.mTurn.deal - cut); r.mTurn.reduced = (r.mTurn.reduced || 0) + cut; }
    NDX._bumpHp(res, list, i, 'p', cut); // V9.34 累计序列传播
  }
  // V9.34 顶层玩家气血须随传播后的末回合重算（减伤只涉玩家承伤，不动怪物侧语义）
  // V9.37 编队战跳过：末回合可能是「点杀回合」，且顶层由 calcCombatSquad 统一收口
  if (list.length) {
    if (_isSquad) NDX._syncSquadTop(res); // V9.38 编队战：顶层跟随末回合（胜负仍由 calcCombatSquad 收口）
    else res.playerHpLeft = Math.min(res.maxHp || 1, list[list.length - 1].pHpAfter || res.playerHpLeft);
  }
  return res;
};

// 顶层胜负重算（与 applyActiveIntervention 步骤 5 同口径；post-hoc 修正后统一收口）
NDX._resyncFight = function (res) {
  if (!res || !res.roundsDetail) return res;
  // V9.37 编队战特例：mHpAfter 只代表【主怪】；主怪亡后仍有「点杀回合」，照常按主怪死亡点
  //   切片会截掉点杀回合，且末回合反推会把玩家误判为阵亡、把 win 覆写为 true。
  //   → 编队战的「胜负 / 回合截断」仍由 calcCombatSquad 收口，但玩家气血须跟随末回合同步
  //     （V9.38：否则 post-hoc 传播只改明细、不改顶层结论）。
  if (res.squad && res.squad.length > 1) return NDX._syncSquadTop(res);
  const list = res.roundsDetail;
  const maxHp = res.maxHp || 1;
  res.monsterHpLeft = list.length ? Math.max(0, list[list.length - 1].mHpAfter || 0) : res.monsterHpLeft;
  res.playerHpLeft = list.length ? Math.min(maxHp, list[list.length - 1].pHpAfter || 0) : res.playerHpLeft;
  let killAt = -1;
  for (let i = 0; i < list.length; i++) { if ((list[i].mHpAfter || 0) <= 0) { killAt = i; break; } }
  if (killAt >= 0) { res.roundsDetail = list.slice(0, killAt + 1); res.total = res.roundsDetail.length; }
  res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
  res.lose = res.playerHpLeft <= 0;
  return res;
};

// ============================================================
// 六·六、怪物状态落地 —— mStatus 不再是回合明细上的死数据
//   与 applyDamageReduction 同构：post-hoc 修正 roundsDetail，逐回合消费状态：
//     dot（灼烧/中毒）→ 按怪物最大气血比例追加真伤扣血
//     noAct（眩晕）   → 本回合怪物不出手，伤害回补玩家
//     atkMul（虚弱）  → 怪物伤害乘数下降，差额回补玩家
//     noSkill（封技） → 怪物非普攻动作折减（封住大招）
//     defDown（破甲） → 玩家本回合对怪伤害提高，追加扣血
// ============================================================
NDX.applyMonsterStatus = function (res, idx, mStatus) {
  if (!res || !res.roundsDetail || !mStatus) return res;
  const list = res.roundsDetail;
  const maxHp = res.maxHp || 1;
  const mMax = res.maxMHp || 0;
  let touched = false;
  for (const k in mStatus) {
    const rounds = Math.max(0, mStatus[k] | 0);
    if (!rounds) continue;
    const D = NDX.STATUS_DEFS[k];
    if (!D || (D.side || 'enemy') !== 'enemy') continue;
    const end = Math.min(list.length, Math.max(0, idx) + rounds);
    for (let i = Math.max(0, idx); i < end; i++) {
      const r = list[i];
      if (!r) break;
      // ① 持续伤害：按怪物最大气血比例追加扣血（真伤，不可减免）
      if (D.dot) {
        const per = Math.max(1, Math.round((mMax || maxHp) * (D.dot.pct || 0)));
        NDX._bumpHp(res, list, i, 'm', -per); // V9.34 累计序列传播
        if (r.mTurn) r.mTurn.hpAfter = r.mHpAfter;
        r.mStatusFx = Object.assign({}, r.mStatusFx || {}, { dot: (r.mStatusFx && r.mStatusFx.dot || 0) + per, dotKind: D.name });
        touched = true;
      }
      if (!r.mTurn) continue;
      const dealt = r.mTurn.deal || 0;
      // ② 眩晕：本回合怪物不出手 → 伤害归零并回补玩家
      if (D.noAct && dealt > 0) {
        r.mTurn.deal = 0; r.mTurn.stunned = true;
        NDX._bumpHp(res, list, i, 'p', dealt); // V9.34 累计序列传播（眩晕真省血）
        r.mStatusFx = Object.assign({}, r.mStatusFx || {}, { stunned: 1 });
        touched = true;
      }
      // ③ 虚弱：怪物伤害乘数下降 → 差额回补玩家
      else if (D.atkMul && D.atkMul < 1 && dealt > 0) {
        const cut = Math.round(dealt * (1 - D.atkMul));
        if (cut > 0) {
          r.mTurn.deal = Math.max(0, dealt - cut);
          r.mTurn.weakened = (r.mTurn.weakened || 0) + cut;
          NDX._bumpHp(res, list, i, 'p', cut); // V9.34 累计序列传播
          r.mStatusFx = Object.assign({}, r.mStatusFx || {}, { weakened: (r.mStatusFx && r.mStatusFx.weakened || 0) + cut });
          touched = true;
        }
      }
      // ④ 封技：怪物技能被封 → 非普攻动作折减 40%（封住大招）
      else if (D.noSkill && dealt > 0 && r.mIntent && r.mIntent !== 'atk') {
        const cut = Math.round(dealt * 0.4);
        if (cut > 0) {
          r.mTurn.deal = Math.max(0, dealt - cut);
          r.mTurn.silenced = true;
          NDX._bumpHp(res, list, i, 'p', cut); // V9.34 累计序列传播
          r.mStatusFx = Object.assign({}, r.mStatusFx || {}, { silenced: cut });
          touched = true;
        }
      }
      // ⑤ 破甲：玩家本回合对怪伤害提高 → 追加扣血
      if (D.defDown && r.pTurn && (r.pTurn.deal || 0) > 0) {
        const add = Math.round(r.pTurn.deal * D.defDown);
        if (add > 0) {
          NDX._bumpHp(res, list, i, 'm', -add); // V9.34 累计序列传播
          r.mTurn.hpAfter = r.mHpAfter;
          r.mStatusFx = Object.assign({}, r.mStatusFx || {}, { sundered: (r.mStatusFx && r.mStatusFx.sundered || 0) + add });
          touched = true;
        }
      }
    }
  }
  return touched ? NDX._resyncFight(res) : res;
};

// ============================================================
// 六·七、防御反击落地 —— guardCounter 不再是空标志
//   路线⑤「防御反击／反击吸血」：受影响回合内怪物每打出一次实伤，
//   玩家回打一击（按承伤 pct），并按反击量吸血（counterLifesteal）。
//   与 enemyAttack 的「沙僧流沙反震」同口径，但走玩家侧、可叠吸血。
// ============================================================
NDX.applyGuardCounter = function (res, idx, act) {
  if (!res || !res.roundsDetail || !act || !act.guardCounter) return res;
  const list = res.roundsDetail;
  const maxHp = res.maxHp || 1;
  const pct = (act.counterPct != null) ? act.counterPct : 0.5;
  const ls = (act.counterLifesteal != null) ? act.counterLifesteal : 0;
  const rounds = Math.max(1, act.counterRounds || 2);
  const end = Math.min(list.length, Math.max(0, idx) + rounds);
  let back = 0, heal = 0;
  for (let i = Math.max(0, idx); i < end; i++) {
    const r = list[i];
    if (!r || !r.mTurn) continue;
    const dealt = r.mTurn.deal || 0;
    if (dealt <= 0) continue; // 怪物未命中（闪避/被眩晕）则不触发反击
    const c = Math.max(1, Math.round(dealt * pct));
    NDX._bumpHp(res, list, i, 'm', -c); // V9.34 累计序列传播
    r.mTurn.hpAfter = r.mHpAfter;
    r.mTurn.counter = (r.mTurn.counter || 0) + c;
    back += c;
    if (ls > 0) {
      const h = Math.round(c * ls);
      if (h > 0) { NDX._bumpHp(res, list, i, 'p', h); heal += h; } // V9.34 累计序列传播
    }
  }
  if (back > 0 || heal > 0) {
    const rd = list[Math.max(0, idx)];
    if (rd) rd.intervention = Object.assign({}, rd.intervention || {}, { counter: back, counterHeal: heal });
    return NDX._resyncFight(res);
  }
  return res;
};

// ============================================================
// 六·八、经位经书 on-hit 状态（自动战斗落地，V9.33）
//   手动三键：经文技能经 act.mStatus → applyMonsterStatus（finalizeActiveAct 链）；
//   自动回合：无按键，故经位 atk 格经书按「所属道途」派生 on-hit debuff（JING_DAO_ONHIT），
//   逐回合概率触发并复用 applyMonsterStatus —— 眩晕真跳过怪物行动、灼烧真扣血、破甲真增伤。
// ============================================================
NDX.applyJingOnHit = function (res, player) {
  if (!res || !res.roundsDetail || !player || !NDX.jingBookOf) return res;
  const slots = player.jingSlots || null;
  const id = slots && slots.atk;
  if (!id) return res;
  const bk = NDX.jingBookOf(id);
  if (!bk || bk.slot !== 'atk' || !bk.onHit) return res;
  const H = bk.onHit;
  const list = res.roundsDetail;
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (!r || !r.pTurn || (r.pTurn.deal || 0) <= 0) continue;
    if (typeof Math.random !== 'function' || Math.random() >= H.chance) continue;
    const stx = {}; stx[H.status] = H.rounds;
    NDX.applyMonsterStatus(res, i, stx);
  }
  return res;
};

// ============================================================
// 七、统一入口：三键技能后处理（种类变种 + 法宝状态 + 大招职业变体）
//   由 combat_active.js 在 activeSkill 各分支末尾调用
// ============================================================
NDX.finalizeActiveAct = function (act, kind, s, heroId, tier) {
  if (!act) return act;
  const st = s || {};
  const jobKey = (st.flags && st.flags.jobConfirm) || st.jobConfirm || null;
  if (kind === 'ult') {
    NDX.applyUltVariant(act, heroId, tier, jobKey);
  } else {
    // 变种来源优先级：经位装配的变种 > 无
    const slots = st.jingSlots || {};
    const key = (kind === 'chant') ? slots.chant : slots.atk;
    if (key && NDX.sutraVariantOf && NDX.sutraVariantOf(key)) {
      NDX.applyActVariant(act, kind, NDX.sutraVariantOf(key));
    }
  }
  // 法宝状态：攻击/诵经/大招均可挂（大招概率减半，避免失控）
  if (kind !== 'ult') NDX.applyTreasureStatus(act, st);
  return act;
};
