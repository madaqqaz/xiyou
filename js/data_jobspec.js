// =============================================================
// data_jobspec.js — 《逆道西行》隐藏职业 · L3 套路层真源（V9.51）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
//
// 设计要旨（用户拍板 2026-09-25「按你的设计全部执行」；见
//   docs/《逆道西行》隐藏职业 · L3 套路层设计（v1.0）.md）：
//   ① 三层模型：L1 数值（HIDDEN_JOBS.effect.bonus）+ L2 机制（passive / 大招变体）+ **L3 套路层（本文件）**
//      —— L3 = 「职业改变我怎么打」：核心资源 / 三键改造 / 适配 / 禁忌
//   ② L3 只改 act 上**已被 applyActiveIntervention 消费**的原语，**不改战斗架构**（calcCombat 一次性预结算不变）
//   ③ 未转职 / 未识别流派 / 非 MVP 流派 → **零操作**（返回原 act，行为逐字节不变）
//   ④ 不新增美术、职业、流派标签；不新增倍率常量（全部复用 data_pet.js / STATUS_DEFS 既有表）
//   ⑤ 45 隐藏职 → JOB_STYLE 45 条一一对应（实测），本文件为 10 个**流派**建卡
//
// 与大招变体的分工（data_skill_variant.js ULT_STYLE_MOD）：
//   绝招（ult）由 finalizeActiveAct → applyUltVariant 承担；本文件只补「绝招的流派清算」（如 combo 层数清算）。
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// 一、10 流派套路卡（唯一真源）
//   res  ：核心资源（职业的独立循环）
//   atk/chant/ult：三键改造要点（brief 供面板展示）
//   fit  ：适配（推荐经文 kind / 套装）
//   taboo：禁忌/弱点（有取舍 BD 才成立）
//   impl ：是否已有代码落地（10 流派均已实现战斗侧落地，见 JOBSPEC_IMPL / 套路层）
// ============================================================
NDX.JOBSPEC = {
  summon: {
    style: 'summon', name: '召唤', impl: true,
    how: '带满灵兽上场，攻键吃灵兽协同真伤，诵经唤伴齐击；灵宠全灭则套路失效',
    res: { key: 'pets', name: '灵兽', desc: '上阵灵兽数 × 等级（每只提供协同真伤）' },
    atk: { brief: '灵宠协同追加真伤' },
    chant: { brief: '唤伴：灵宠齐击并回血' },
    ult: { brief: '万兽朝元：灵兽齐击' },
    fit: { sutra: ['bond-mantra'], set: '御兽' },
    taboo: { name: '清场腰斩', desc: '灵宠全灭（0 只）时三键改造全部失效' },
  },
  combo: {
    style: 'combo', name: '连击', impl: true,
    how: '不断出手叠连击层（0→5），层越高攻段越多；绝招一次性清算层数，出手后清零',
    res: { key: 'comboStack', name: '连击层', desc: '每次攻键 +1（上限 5），绝招倾泻后归零' },
    atk: { brief: '叠层：2 段 → 3 段（≥3 层）' },
    chant: { brief: '蓄势：保层并回血' },
    ult: { brief: '层数清算：伤害 ×(1+0.15×层)' },
    fit: { sutra: ['war-buff'], set: '连击' },
    taboo: { name: '断连清零', desc: '绝招后层数归零；怕封技（无法出手即无法叠层）' },
  },
  reflect: {
    style: 'reflect', name: '反伤', impl: true,
    how: '以承伤为资源：攻键蓄势减伤，诵经反震回打；绝招承伤反噬，越挨打越强',
    res: { key: 'taken', name: '承伤', desc: '本轮所受伤害总量（越高反打越重）' },
    atk: { brief: '蓄势：本回合减伤 20% + 穿刺真伤' },
    chant: { brief: '反震强化：承伤回打 60% 并吸血' },
    ult: { brief: '万劫反噬：承伤回打 90% + 金身护盾' },
    fit: { sutra: ['ward-mantra'], set: '反伤' },
    taboo: { name: '蓄势未成', desc: '高爆发敌人在反震成型前直接暴毙；无反震则资源空转' },
  },
  // —— 其余 7 流派：P3 已接三键改造（见第十章），战斗侧全量生效 ——
  crit: {
    style: 'crit', name: '暴击', impl: true,
    how: '堆暴击率与暴伤，攻键铺垫、诵经开必暴窗口，绝招一棍定天',
    res: { key: 'critRate', name: '暴击率', desc: '暴击概率与暴伤倍率' },
    atk: { brief: '铺垫：小幅提升本回合暴击率' },
    chant: { brief: '必暴窗口：下回合必定暴击' },
    ult: { brief: '一棍定天：必暴 + 暴伤 +80%' },
    fit: { sutra: ['war-buff'], set: '暴击' },
    taboo: { name: '怕闪避', desc: '被闪避流克制，暴击落空即资源空转' },
  },
  ward: {
    style: 'ward', name: '护盾', impl: true,
    how: '以盾量为资源，攻键把盾转伤、诵经续盾，绝招不坏金身',
    res: { key: 'shield', name: '盾量', desc: '当前护盾值' },
    atk: { brief: '盾转伤：消耗部分护盾转为真伤' },
    chant: { brief: '续盾：大量补盾' },
    ult: { brief: '不坏金身：大护盾 + 减伤' },
    fit: { sutra: ['ward-mantra'], set: '护盾' },
    taboo: { name: '破盾真空', desc: '盾被击穿后有一段真空期，容错骤降' },
  },
  evade: {
    style: 'evade', name: '闪避', impl: true,
    how: '以闪避次数为资源，闪后反击、预兆闪避，绝招影遁三袭',
    res: { key: 'evade', name: '闪避次数', desc: '本场已蓄积的闪避机会' },
    atk: { brief: '闪后反击：闪避成功后追加一击' },
    chant: { brief: '预兆闪避：提升下回合闪避' },
    ult: { brief: '影遁三袭：三段影袭 + 提升闪避' },
    fit: { sutra: ['veil-mantra'], set: '隐系' },
    taboo: { name: '怕必中', desc: '无视防御/必中类攻击直接穿透闪避' },
  },
  drain: {
    style: 'drain', name: '吸血', impl: true,
    how: '以吸血量为资源，攻键吸血续航、诵经偷取增益，绝招吞噬天地',
    res: { key: 'lifesteal', name: '吸血量', desc: '本轮累计吸血总量' },
    atk: { brief: '吸血：按伤害回复气血' },
    chant: { brief: '偷增益：夺取敌方一层增益' },
    ult: { brief: '吞噬天地：重击并大口吸血' },
    fit: { sutra: ['glut-ton'], set: '夺系' },
    taboo: { name: '怕禁疗', desc: '被禁疗/减疗克制，续航链断裂则崩盘' },
  },
  purify: {
    style: 'purify', name: '净化', impl: true,
    how: '以净化层数为资源，攻键驱散、诵经净化自身，绝招大慈大悲',
    res: { key: 'cleanse', name: '净化层', desc: '可消耗的净化次数' },
    atk: { brief: '驱散：清除敌方一层增益' },
    chant: { brief: '净化：清除自身全部负面' },
    ult: { brief: '大慈大悲：净化自身全部异常并回春' },
    fit: { sutra: [], set: '渡系' },
    taboo: { name: '对无状态敌无效', desc: '敌方无增益、自身无负面时资源空转' },
  },
  burn: {
    style: 'burn', name: '灼烧', impl: true,
    how: '以持续伤害层数为资源，攻键挂火、诵经爆燃，绝招业火焚天',
    res: { key: 'dot', name: '火层', desc: '敌人身上灼烧层数' },
    atk: { brief: '挂火：附加一层灼烧' },
    chant: { brief: '爆燃：立即结算全部灼烧' },
    ult: { brief: '业火焚天：附加三回合灼烧' },
    fit: { sutra: [], set: '火系法宝' },
    taboo: { name: '怕免疫/驱散', desc: '免疫灼烧或驱散类敌人直接废掉本流派' },
  },
  reverse: {
    style: 'reverse', name: '逆修', impl: true,
    how: '以残血比例为资源，血越低伤害越高，诵经主动控血，绝招逆鳞血祭',
    res: { key: 'lowHp', name: '残血比', desc: '当前气血越低，增伤越高' },
    atk: { brief: '血越低越强：按残血比增伤' },
    chant: { brief: '控血：主动压低气血换取增伤' },
    ult: { brief: '逆鳞血祭：伤害 ×1.3 并吸血 30%' },
    fit: { sutra: [], set: '逆系经文' },
    taboo: { name: '控血失败即死', desc: '控血失误或遭遇爆发直接阵亡' },
  },
};

// 已有代码落地的流派（P3 起 = 10/10 全量；applyJobStyle 对全流派生效）
NDX.JOBSPEC_IMPL = ['summon', 'combo', 'reflect', 'crit', 'ward', 'evade', 'drain', 'purify', 'burn', 'reverse'];

NDX.jobSpecOf = function (style) { return (style && NDX.JOBSPEC[style]) || null; };

// ============================================================
// 二、当前流派（唯一读取口）
//   与 NDX.finalizeActiveAct 同源：jobConfirm 可能在 s.flags 或 s 顶层
// ============================================================
NDX.currentJobStyle = function (s) {
  const S = s || {};
  //   🔴 2026-09-26：改调 NDX.currentJob（旧口径只认 s.flags.jobConfirm 单值，
  //     多职并发时会漏判「当前形态」，且无法解释链上中间职）
  const jobKey = NDX.currentJob ? NDX.currentJob(S) : ((S.flags && S.flags.jobConfirm) || S.jobConfirm || null);
  if (!jobKey) return null;
  return (NDX.JOB_STYLE && NDX.JOB_STYLE[jobKey]) || null;
};

// ============================================================
// 三、连击层资源通道（combo 流派专属）
//   落点：S.pending.comboStack（与 zhanYiOverflow / jingLiOverflow 同族，见 battle_resource.js）
//   读写在 game_core_3.js resolveManualActive 结算后按 act.comboDelta / act.comboReset 落账
// ============================================================
NDX.COMBO_STACK_MAX = 5;
NDX.comboStackOf = function (s) {
  const S = s || {};
  return Math.max(0, Math.min(NDX.COMBO_STACK_MAX, (S.pending && S.pending.comboStack) || 0));
};
NDX.bumpComboStack = function (s, n) {
  const S = s || {};
  if (!S.pending) S.pending = {};
  S.pending.comboStack = Math.max(0, Math.min(NDX.COMBO_STACK_MAX, (S.pending.comboStack || 0) + (Number(n) || 0)));
  return S.pending.comboStack;
};
NDX.resetComboStack = function (s) {
  const S = s || {};
  if (S.pending) S.pending.comboStack = 0;
  return 0;
};

// ============================================================
// 四、经职相合（同 kind 经文 × 职业流派 → ×1.15）
//   fit.sutra 命中当前持诵经的 chantSkill.kind → 该键伤害 ×1.15（BD 深度：职业要配对口经）
//   口径与 combat_active.js 一致：kind 取自 NDX.sutraFullById(id).chantSkill.kind
// ============================================================
NDX.JOB_SUTRA_SYNERGY = 1.15;
NDX._jobSutraSynergy = function (act, S, card) {
  const fit = card && card.fit && card.fit.sutra;
  if (!fit || !fit.length) return act;
  // 🔴 V9.54 经职相合：读**诵经格**（含旧持诵位回落），不再直读 s.chantSutra
  const id = (NDX.chantSutraId ? NDX.chantSutraId(S) : ((S && S.chantSutra) || null));
  if (!id) return act;
  const full = (NDX.sutraFullById && NDX.sutraFullById(id)) || (NDX.niSutraFullById && NDX.niSutraFullById(id)) || null;
  const kind = full && full.chantSkill && full.chantSkill.kind;
  if (!kind || fit.indexOf(kind) < 0) return act;
  act.dmg = Math.max(1, Math.round((act.dmg || 0) * NDX.JOB_SUTRA_SYNERGY));
  if (act.trueDmg) act.trueDmg = Math.max(1, Math.round(act.trueDmg * NDX.JOB_SUTRA_SYNERGY));
  act.note = (act.note || '') + '·经职相合×' + NDX.JOB_SUTRA_SYNERGY;
  return act;
};

// ============================================================
// 五、三键改造实现（MVP 三流派）
// ============================================================

// —— summon 召唤 ——
// 禁忌自然成立：n=0（灵宠全灭）时 atk/chant 改造均返回原 act
NDX._jobSummon = function (act, key, S) {
  const n = (NDX.petDeployCount ? NDX.petDeployCount(S) : 0);
  if (n <= 0) return act;                       // 禁忌：清场腰斩
  const base = Math.max(1, act.dmg || 0);
  if (key === 'atk') {
    // 攻：灵宠协同追加真伤（复用 data_pet.js 独立加成层：0.12 × 等级 × 齐击）
    const syn = NDX.petSynergyTrueDmg ? NDX.petSynergyTrueDmg(S, base) : 0;
    if (syn > 0) {
      act.trueDmg = Math.max(1, (act.trueDmg || 0) + syn);
      act.note = (act.note || '') + '·唤兽×' + n;
    }
  } else if (key === 'chant') {
    // 诵：唤伴 —— 灵宠立即行动（多段齐击）+ 回血
    const h = 1 + Math.min(n, 3);
    act.hits = Math.max(act.hits || 1, h);
    act.spread = true;
    act.heal = Math.max(0, (act.heal || 0) + Math.round(base * 0.15));
    act.note = (act.note || '') + '·唤伴×' + n;
  }
  return act;
};

// —— combo 连击 ——
NDX._jobCombo = function (act, key, S) {
  const stack = NDX.comboStackOf(S);
  const base = Math.max(1, act.dmg || 0);
  if (key === 'atk') {
    // 攻：叠层 —— 2 段基础，≥3 层升 3 段；结算后 +1 层
    const h = stack >= 3 ? 3 : 2;
    act.hits = Math.max(act.hits || 1, h);
    act.spread = true;
    act.comboDelta = 1;
    act.note = (act.note || '') + '·连击×' + h + '（层' + stack + '）';
  } else if (key === 'chant') {
    // 诵：蓄势 —— 保层（层数不因诵经折损）+ 回血
    act.heal = Math.max(0, (act.heal || 0) + Math.round(base * 0.12));
    act.note = (act.note || '') + '·蓄势（保层' + stack + '）';
  } else if (key === 'ult') {
    // 绝：层数清算 —— 伤害 ×(1+0.15×层)，出手后层数归零
    if (stack > 0) {
      const mul = 1 + 0.15 * stack;
      act.dmg = Math.max(1, Math.round((act.dmg || 0) * mul));
      act.note = (act.note || '') + '·清算×' + mul.toFixed(2) + '（层' + stack + '）';
    }
    act.comboReset = true;
  }
  return act;
};

// —— reflect 反伤 ——
NDX._jobReflect = function (act, key, S) {
  const base = Math.max(1, act.dmg || 0);
  if (key === 'atk') {
    // 攻：蓄势 —— 本回合减伤 20%（dr 已被 applyDamageReduction 消费）+ 穿刺真伤
    act.dr = Math.max(act.dr || 0, 0.20);
    act.trueDmg = Math.max(1, (act.trueDmg || 0) + Math.round(base * 0.15));
    act.note = (act.note || '') + '·蓄势';
  } else if (key === 'chant') {
    // 诵：反震强化 —— 承伤回打 60% + 吸血 30% + 护体 3 回合（guardCounter 已被 applyGuardCounter 消费）
    act.guardCounter = true;
    act.counterPct = Math.max(act.counterPct || 0, 0.6);
    act.counterLifesteal = Math.max(act.counterLifesteal || 0, 0.30);
    act.counterRounds = Math.max(act.counterRounds || 0, 2);
    act.sBuff = Object.assign({}, act.sBuff || {}, { ward: 3 });
    act.note = (act.note || '') + '·反震';
  }
  return act;
};

// ============================================================
// 六、统一入口：三键套路改造
//   key ∈ 'atk' | 'chant' | 'ult'（与三键链路一致）
//   未转职 / 未识别 / 非 MVP 流派 → 零操作（返回原 act，行为逐字节不变）
//   调用点（combat_active.js）：
//     atk   ：applyHeroKeyFeel 之后、_sutraVariant 之前
//     chant ：applyJingSlotMods 之前
//     ult   ：finalizeActiveAct 之后（补齐流派清算）
// ============================================================
NDX.applyJobStyle = function (act, key, s, heroId, player) {
  void heroId; void player;
  if (!act || !key) return act;
  const S = s || {};
  // 🔴 P2′（2026-09-25 用户拍板）：驱动源由「隐藏职」改为「权重向量」——
  //   英雄底色 + 劫印 + 经文 + 隐藏职倾向 加权投票；无配装信号 → currentStyle 返回 null → 零操作。
  const style = (NDX.currentStyle ? NDX.currentStyle(S) : NDX.currentJobStyle(S));
  if (!style || NDX.JOBSPEC_IMPL.indexOf(style) < 0) return act; // 无信号 / 未落地流派 → 零操作
  const card = NDX.JOBSPEC[style];
  if (!card) return act;
  try {
    const _f = {
      summon: NDX._jobSummon, combo: NDX._jobCombo, reflect: NDX._jobReflect,
      crit: NDX._jobCrit, ward: NDX._jobWard, evade: NDX._jobEvade, drain: NDX._jobDrain,
      purify: NDX._jobPurify, burn: NDX._jobBurn, reverse: NDX._jobReverse,
    }[style];
    if (_f) _f(act, key, S);
    // 经职相合：仅对「本键」加 ×1.15（绝招同样吃）
    NDX._jobSutraSynergy(act, S, card);
  } catch (e) { /* 套路层绝不拖垮战斗 */ }
  return act;
};

// ============================================================
// 七、面板展示（「本职业怎么打」一句 + 资源 + 禁忌）
// ============================================================
NDX.jobBriefOf = function (style) {
  const card = (style && NDX.JOBSPEC[style]) || null;
  if (!card) return null;
  return { style: card.style, name: card.name, how: card.how, res: card.res, taboo: card.taboo, impl: !!card.impl };
};
// 按存档取当前路线简述（UI 直接调；驱动源与 applyJobStyle 同源 = currentStyle）
NDX.currentJobBrief = function (s) {
  const style = (NDX.currentStyle ? NDX.currentStyle(s) : NDX.currentJobStyle(s));
  if (!style) return null;
  const b = NDX.jobBriefOf(style);
  if (!b) return null;
  if (style === 'combo') b.stack = NDX.comboStackOf(s);
  const src = NDX.styleSourcesOf ? NDX.styleSourcesOf(s) : null;
  if (src && src.sources) b.sources = src.sources;
  return b;
};

// 转职即时的「怎么打」提示串（game_event_2.js 转职成功后 pushLog 用；未转职 → 空串）
NDX.jobStyleHint = function (s) {
  const b = NDX.currentJobBrief(s);
  if (!b) return '';
  const _res = b.res ? `核心资源「${b.res.name}」——${b.res.desc}` : '';
  const _tab = b.taboo ? `禁忌「${b.taboo.name}」——${b.taboo.desc}` : '';
  const _impl = b.impl ? '' : '（此流派设计已定，战斗改造待后续批次落地）';
  const _src = (b.sources && b.sources.length) ? `（来源：${b.sources.join(' + ')}）` : '';
  return `【本局路线·玩法】${b.name}流${_src}${_impl}：${b.how}｜${_res}｜${_tab}`;
};

// ============================================================
// 九、流派生成模型（P2′ · 2026-09-25 用户拍板）
//   根定义：docs/《逆道西行》英雄底色与流派生成模型（v1.0）.md
//
//   「英雄的特性只是底色，上面的建筑是装备与劫印与经文共同的叠加。」
//   —— 流派 ≠ 英雄身份，而是【英雄底色（小权重先验）+ 劫印 + 经文 + 隐藏职倾向】的
//      加权投票结果。由此「唐僧 7/8 purify」自动消解：流派不从英雄来，唐僧照样能走盾/加血/法吸。
//
//   与六道正交：六道 = 价值取向（善恶/因果），流派 = 打法。可自由组合（走逆道 × 玩法吸）。
//   与六道同构：复用 dao_system.js 的「锚点 + 动态覆盖」骨架（此处为纯确定性 argmax，零抖动）。
// ============================================================

// 10 路线固定顺序（tie-break 稳定：权重并列时取靠前者）
NDX.STYLE_LIST = ['summon', 'combo', 'reflect', 'crit', 'ward', 'evade', 'drain', 'purify', 'burn', 'reverse'];

// ① 英雄底色（L0 先验 · 小权重：只给「起手倾向」与「并列裁决」，绝不锁死玩法）
//    值本身 < SEAL 单条权重 ⇒ 只要捡到 1 枚指向他路的劫印，即可转向（＝「第一章掉落决定路线」）
NDX.HERO_STYLE_BASE = {
  tangseng:    { purify: 1.0, ward: 0.4 },               // 唐僧：法伤/慈悲底色
  wukong:      { combo: 1.0, crit: 0.7, reverse: 0.4 },  // 悟空：物攻爆发底色
  bajie:       { drain: 1.0, ward: 0.7, reflect: 0.4 },  // 八戒：续航/攒盾底色
  xiaobailong: { evade: 1.0, drain: 0.4 },               // 龙马：闪避底色（用户原话「他只是闪避」）
  shaseng:     { ward: 1.0, reflect: 1.0 },              // 沙僧：肉盾底色
};

// ② 劫印 → 路线（六道一道可映射多路线；首项全权重、次项折减，保证同来源也有区分度）
NDX.SEAL_STYLE_MAP = {
  '战': ['combo', 'crit'], '渡': ['purify', 'ward'], '隐': ['evade'],
  '夺': ['drain', 'burn'], '缘': ['summon', 'ward'], '逆': ['reverse', 'reflect'],
};

// ③ 经文（按持诵经 chantSkill.kind）→ 路线
NDX.SUTRA_KIND_STYLE = {
  'zen-heal':     ['purify', 'ward'],
  'war-buff':     ['crit', 'combo'],
  'glut-ton':     ['drain', 'burn'],
  'ward-mantra':  ['ward', 'reflect'],
  'veil-mantra':  ['evade'],
  'break-mantra': ['crit', 'reverse'],
};

// 权重系数（单源，调平衡只改这里）
//   🔴 V9.52 用户拍板（2026-09-25）：「经文只能微调，核心的数值是装备。」
//      ⇒ EQUIP **2.4 = 最高**（核心数值源；B 批打 `it.style` 标签后自动生效，现网数据恒为 0）
//      ⇒ SEAL 1.2 > BASE 1.0 ⇒ 「一枚劫印即可转向」（玩家的选择 > 英雄底色）
//   🔴 V9.53 追加拍板（2026-09-25）：「经文分技能经与被动经」
//      ⇒ 经文**两条通道**，权重不再一刀切：
//         · **技能经**（持诵位 `s.chantSutra`）1.5 —— 念什么经、使什么法：
//           替换 chant 形态（combat_active.js 本体替换）+ **高路线权重**，是 BD 主动支点
//         · **被动经**（其余持有全本）0.5/部、**软饱和封顶 1.0** —— 只叠属性不换形态，
//           恒 < 底色 1.0 ⇒ 永远只是"微调"，且**一部经也压不倒底色、一枚劫印也压不倒它**
//      ⇒ 上一轮「SUTRA 一律 0.8」作废：0.8 时期被动经与技能经同权，等于抹掉了这次分流
NDX.STYLE_W = {
  BASE: 1.0, EQUIP: 2.4, SEAL: 1.2, JOB: 2.0, SECOND: 0.6,
  SUTRA: 1.5,            // 技能经（持诵位）：定形态 + 高权重
  SUTRA_PASSIVE: 0.5,    // 被动经（持有位）：每部基数
  SUTRA_PASSIVE_CAP: 1.0,// 被动经合并封顶（恒 < BASE 1.0 ⇒ 只微调，铁律）
  SUTRA_PASSIVE_HALF: 4, // 软饱和半程：持 4 部到半额，越堆越钝（防多经刷权重）
};
// 「有配装信号」的下限：**非底色**信号总量低于此值 → 路线不显影（零操作，存量玩家行为逐字节不变）
NDX.STYLE_MIN_SIGNAL = 0.5;

// 当前诵经经的 kind（与 _jobSutraSynergy 同源取法）
// 🔴 V9.54：改走经位诵经格 `NDX.chantSutraId`（含旧持诵位回落），不再直读 s.chantSutra
NDX.chantSutraKind = function (S) {
  const id = (NDX.chantSutraId ? NDX.chantSutraId(S) : ((S && S.chantSutra) || null));
  if (!id) return null;
  const full = (NDX.sutraFullById && NDX.sutraFullById(id)) || (NDX.niSutraFullById && NDX.niSutraFullById(id)) || null;
  return (full && full.chantSkill && full.chantSkill.kind) || null;
};

// 经文消费类型判定（V9.53 分流 + V9.54 双格）：**位置判定优先**，字段仅作新增经文的显式声明
//   'chant'   技能经 = **诵经格**（jingSlots.chant，旧持诵位 s.chantSutra 回落）→ 换 chant 形态 + 高路线权重
//   'atk'     技能经 = **攻击格**（jingSlots.atk）→ 换 atk 形态 + 同权路线权重（一手一形态）
//   'passive' 被动经 = 双格之外的一切持有全本 → 只叠属性，不换形态
//   ⚠ 数据字段 `full.sutraKind` 显式标 'passive' 者，即使装在格上也按被动经计（新经文用）
//   ⚠ 判定按「该经此刻被哪一格消费」，非「它属于哪一类经」——同一部经装上攻击格即 'atk'。
NDX.sutraConsumeKind = function (S, fullId) {
  if (!fullId) return null;
  const full = (NDX.sutraFullById && NDX.sutraFullById(fullId)) ||
               (NDX.niSutraFullById && NDX.niSutraFullById(fullId)) || null;
  if (full && full.sutraKind === 'passive') return 'passive';   // 显式数据声明优先
  if (!S) return 'passive';
  if (NDX.chantSutraId && NDX.chantSutraId(S) === fullId) return 'chant';
  if (NDX.atkSutraId && NDX.atkSutraId(S) === fullId) return 'atk';
  if (!NDX.atkSutraId && S.chantSutra === fullId) return 'chant';
  return 'passive';
};
// 「是否技能经」判定（路线权重用：攻击格与诵经格**同权**，都是 1.5）
NDX.isActiveSutra = function (S, fullId) {
  const k = NDX.sutraConsumeKind(S, fullId);
  return k === 'chant' || k === 'atk';
};

// 被动经列表（**双格之外**的持有全本，已合成口径：s.sutras / s.niSutras，不含待投背包）
//   去重：同一 id 只出现一次；排除双格（该部已按技能经计数，避免重复计入）
//   🔴 V9.54 用户拍板「其他包裹被动生效」⇒ 被动经 = 除攻击格/诵经格外的一切持有全本
NDX.passiveSutraIds = function (S) {
  const out = [], seen = {};
  const _push = function (id) {
    if (!id || seen[id]) return;
    seen[id] = 1; out.push(id);
  };
  // 双格（含旧持诵位回落）一律排除
  let _inSlot = {};
  if (S) {
    const a = NDX.atkSutraId ? NDX.atkSutraId(S) : null;
    const c = NDX.chantSutraId ? NDX.chantSutraId(S) : ((S.chantSutra || null));
    if (a) _inSlot[a] = 1;
    if (c) _inSlot[c] = 1;
  }
  ((S && S.sutras) || []).forEach(_push);
  ((S && S.niSutras) || []).forEach(_push);
  // 待投背包（sutraBackpack）尚未生效 ⇒ 不计入路线（与 attr_calc 生效口径一致）
  return out.filter(function (id) { return !_inSlot[id]; });
};

// 被动经 → 路线（去重后每种路线只计一次，避免多部同向经刷同一路线）
NDX.passiveSutraStyles = function (S) {
  const out = [];
  NDX.passiveSutraIds(S).forEach(function (id) {
    const full = (NDX.sutraFullById && NDX.sutraFullById(id)) || (NDX.niSutraFullById && NDX.niSutraFullById(id)) || null;
    const kind = full && full.chantSkill && full.chantSkill.kind;
    if (!kind) return;
    // 只取映射首项（次项 SECOND 折减后 <0.3，重复计无意义）
    const st = (NDX.SUTRA_KIND_STYLE[kind] || [])[0];
    if (st && out.indexOf(st) < 0) out.push(st);
  });
  return out;
};

// 被动经合并权重：软饱和 CAP*n/(n+HALF) ⇒ n=1→0.20 / 4→0.50 / ∞→1.00（恒 < 底色 1.0）
NDX.passiveSutraWeight = function (S) {
  const n = NDX.passiveSutraStyles(S).length;
  if (n <= 0) return 0;
  const C = NDX.STYLE_W.SUTRA_PASSIVE_CAP, H = NDX.STYLE_W.SUTRA_PASSIVE_HALF;
  return +(C * n / (n + H)).toFixed(3);
};

// 权重向量（唯一真源）：w[style] = 底色 + 劫印 + 经文 + 隐藏职倾向
// 同时返回 sig[]（仅非底色信号），供 currentStyle 判定「是否真有配装信号」
NDX.styleWeightVector2 = function (s) {
  const S = s || {};
  const w = {}, sig = {};
  NDX.STYLE_LIST.forEach(function (st) { w[st] = 0; sig[st] = 0; });
  const add = function (st, v, isSig) {
    if (!st || w[st] == null) return;
    w[st] += v; if (isSig) sig[st] += v;
  };
  // L0 英雄底色（非信号）
  const base = NDX.HERO_STYLE_BASE[S.hero || 'tangseng'] || {};
  Object.keys(base).forEach(function (k) { add(k, base[k] * NDX.STYLE_W.BASE, false); });
  // L1 装备（**核心数值源** · 用户拍板「核心的数值是装备」）
  //   读件级路线标签 `it.style`（字符串或数组）。B 批打标签后自动生效；
  //   现网 300+ 件尚无该字段 ⇒ 本项恒为 0，零副作用（用户 2026-09-25 拍板「不打」）。
  ((S.equips) || []).forEach(function (it) {
    if (!it || !it.style) return;
    (Array.isArray(it.style) ? it.style : [it.style]).forEach(function (style, i) {
      add(style, NDX.STYLE_W.EQUIP * (i === 0 ? 1 : NDX.STYLE_W.SECOND), true);
    });
  });
  // L1 劫印（全量持有；六道 → 路线，首项满分、次项折减）
  ((S.seals) || []).forEach(function (sl) {
    if (!sl || !sl.dao) return;
    (NDX.SEAL_STYLE_MAP[sl.dao] || []).forEach(function (st, i) {
      add(st, NDX.STYLE_W.SEAL * (i === 0 ? 1 : NDX.STYLE_W.SECOND), true);
    });
  });
  // L1 经文（**技能经 / 被动经分流** · V9.53 用户拍板「经文分技能经与被动经」）
  //   ① 技能经 = 持诵位（s.chantSutra）：定 chant 形态，权重高（1.5）—— 换经即换套路
  const _k = NDX.chantSutraKind(S);
  if (_k) (NDX.SUTRA_KIND_STYLE[_k] || []).forEach(function (st, i) {
    add(st, NDX.STYLE_W.SUTRA * (i === 0 ? 1 : NDX.STYLE_W.SECOND), true);
  });
  //   ② 被动经 = 其余持有全本：合并后**软饱和封顶**，恒 < 底色 ⇒ 只微调，压不倒底线与劫印
  const _pw = NDX.passiveSutraWeight(S);
  if (_pw > 0) NDX.passiveSutraStyles(S).forEach(function (st) {
    add(st, _pw, true);
  });
  // L1 隐藏职倾向（收敛机制：引导玩家选到同一路线，但不封死）
  const _js = NDX.currentJobStyle(S);
  if (_js) add(_js, NDX.STYLE_W.JOB, true);
  return { w: w, sig: sig };
};

// 简洁读取口（只取权重）
NDX.styleWeightVector = function (s) { return NDX.styleWeightVector2(s).w; };

// 当前路线（唯一读取口）：仍有非底色信号才成立，否则返回 null（＝零操作，存量不变）
NDX.currentStyle = function (s) {
  const S = s || {};
  const v = NDX.styleWeightVector2(S);
  const w = v.w, sig = v.sig;
  let best = null, bestW = 0;
  NDX.STYLE_LIST.forEach(function (st) { if (w[st] > bestW) { bestW = w[st]; best = st; } });
  if (!best) return null;
  // V9.52：判据由「最佳路线*自身*须有信号」改为「**存在**非底色配装信号」——
  //   因经文降为微调（0.8 < 底色 1.0）后，单持一部经不再能压过底色；此时仍应显影
  //   （显影出底色所主导的路线），否则玩家「持了经却毫无反馈」。
  //   无任何配装 → 非底色信号总量 0 → 仍返回 null（零操作，存量玩家行为逐字节不变）。
  let _sigTotal = 0;
  NDX.STYLE_LIST.forEach(function (st) { _sigTotal += (sig[st] || 0); });
  if (!(_sigTotal >= NDX.STYLE_MIN_SIGNAL)) return null;
  return best;
};

// 路线来源拆解（面板显影：告诉玩家「你这条路线是怎么来的」）
NDX.styleSourcesOf = function (s) {
  const S = s || {};
  const v = NDX.styleWeightVector2(S);
  const w = v.w, sig = v.sig;
  let best = null, bestW = 0;
  NDX.STYLE_LIST.forEach(function (st) { if (w[st] > bestW) { bestW = w[st]; best = st; } });
  // 与 currentStyle 同口径：无**任何**非底色信号 → 路线未定（底色不单独产出路线）
  let _sigSum = 0;
  NDX.STYLE_LIST.forEach(function (st) { _sigSum += (sig[st] || 0); });
  if (!best || !(_sigSum >= NDX.STYLE_MIN_SIGNAL)) return { style: null, name: '', weight: 0, sources: [] };
  const out = [];
  const base = NDX.HERO_STYLE_BASE[S.hero || 'tangseng'] || {};
  if (base[best]) out.push('英雄底色');
  let _eqHit = 0;
  ((S.equips) || []).forEach(function (it) {
    if (!it || !it.style) return;
    const _arr = Array.isArray(it.style) ? it.style : [it.style];
    if (_arr.indexOf(best) === 0) _eqHit++;   // 仅首项计（与权重口径一致）
  });
  if (_eqHit > 0) out.push('装备×' + _eqHit);
  let _sealHit = 0;
  ((S.seals) || []).forEach(function (sl) {
    if (sl && sl.dao && (NDX.SEAL_STYLE_MAP[sl.dao] || []).indexOf(best) >= 0) _sealHit++;
  });
  if (_sealHit > 0) out.push('劫印×' + _sealHit);
  const _k = NDX.chantSutraKind(S);
  if (_k && (NDX.SUTRA_KIND_STYLE[_k] || []).indexOf(best) >= 0) out.push('技能经（持诵）');
  if (NDX.passiveSutraStyles(S).indexOf(best) >= 0) out.push('被动经×' + NDX.passiveSutraStyles(S).length);
  const _js = NDX.currentJobStyle(S);
  if (_js === best) out.push('隐藏职倾向');
  const card = NDX.JOBSPEC[best] || null;
  return { style: best, name: (card && card.name) || best, weight: bestW, sources: out };
};

// ============================================================
// 十、三键改造实现（P3 · 补齐 crit/ward/evade/drain/purify/burn/reverse）
//   铁律：只写 applyActiveIntervention **已消费**的原语（combat_active.js:387-519）：
//     dmg / trueDmg / heal / shield / hits+spread / dr / dot / mStatus / sBuff /
//     armorBreak / ignoreDef / guardCounter / critHit(打标) / summon / evaUp / cleanse
//   禁写死字段（全仓无读点）：reflect / lifesteal / （evaUp/cleanse/summon 已接线，可用）
// ============================================================

// —— crit 暴击：核心资源 = 暴击窗口 ——
NDX._jobCrit = function (act, key, S) {
  void S;
  const base = Math.max(1, act.dmg || 0);
  if (key === 'atk') {
    // 铺垫：小幅提伤 + 暴击穿透（critHit 仅打标，故用 trueDmg 体现「暴击级」实感）
    act.dmg = Math.max(1, Math.round(base * 1.12));
    act.trueDmg = Math.max(1, (act.trueDmg || 0) + Math.round(base * 0.10));
    act.critHit = true;
    act.note = (act.note || '') + '·蓄暴';
  } else if (key === 'chant') {
    // 必暴窗口：金刚怒（atkUp 25% / 3 回合）+ 必暴标记
    act.sBuff = Object.assign({}, act.sBuff || {}, { might: 3 });
    act.critHit = true;
    act.note = (act.note || '') + '·必暴窗口';
  } else if (key === 'ult') {
    // 一棍定天：critDmg 只打标无消费 → 折算为实际倍率（保证必暴确有实感）
    const cd = Number(act.critDmg) || 0.8;
    act.dmg = Math.max(1, Math.round(base * (1 + cd)));
    act.critHit = true;
    act.note = (act.note || '') + '·暴伤×' + (1 + cd).toFixed(2);
  }
  return act;
};

// —— ward 护盾：核心资源 = 盾量 ——
NDX._jobWard = function (act, key) {
  const base = Math.max(1, act.dmg || 0);
  if (key === 'atk') {
    // 凝盾：舍少量伤害换护盾
    act.dmg = Math.max(1, Math.round(base * 0.85));
    act.shield = Math.max(0, (act.shield || 0) + Math.round(base * 0.30));
    act.note = (act.note || '') + '·凝盾';
  } else if (key === 'chant') {
    // 续盾：大量补盾 + 护体（drUp 已由 applyDamageReduction 消费）
    act.shield = Math.max(0, (act.shield || 0) + Math.round(base * 0.55));
    act.sBuff = Object.assign({}, act.sBuff || {}, { ward: 3 });
    act.note = (act.note || '') + '·续盾';
  }
  return act;
};

// —— evade 闪避：核心资源 = 闪避次数（以减伤等效落地，见 applyActiveIntervention） ——
NDX._jobEvade = function (act, key) {
  if (key === 'atk') {
    // 游走：本回合闪避提升（怪物出手落空 = 该次伤害不生效）
    act.evaUp = Math.max(act.evaUp || 0, 0.15);
    act.evaUpRounds = Math.max(act.evaUpRounds || 0, 1);
    act.note = (act.note || '') + '·游走';
  } else if (key === 'chant') {
    // 预兆闪避：大幅提升闪避并持续 2 回合
    act.evaUp = Math.max(act.evaUp || 0, 0.30);
    act.evaUpRounds = Math.max(act.evaUpRounds || 0, 2);
    act.note = (act.note || '') + '·预兆闪避';
  }
  return act;
};

// —— drain 吸血：核心资源 = 吸血量 ——
NDX._jobDrain = function (act, key) {
  const base = Math.max(1, act.dmg || 0);
  if (key === 'atk') {
    act.heal = Math.max(0, (act.heal || 0) + Math.round(base * 0.22));
    act.note = (act.note || '') + '·噬血';
  } else if (key === 'chant') {
    // 偷势：夺敌之势为己用（破甲 + 金刚怒 + 回血）
    act.armorBreak = true;
    act.heal = Math.max(0, (act.heal || 0) + Math.round(base * 0.45));
    act.sBuff = Object.assign({}, act.sBuff || {}, { might: 3 });
    act.note = (act.note || '') + '·偷势';
  }
  return act;
};

// —— purify 净化：核心资源 = 净化层（cleanse 已由 applyBattleCleanse 消费） ——
NDX._jobPurify = function (act, key) {
  const base = Math.max(1, act.dmg || 0);
  if (key === 'atk') {
    // 驱散：驱敌增益的等价落地 = 破甲 + 法伤穿透
    act.armorBreak = true;
    act.trueDmg = Math.max(1, (act.trueDmg || 0) + Math.round(base * 0.12));
    act.note = (act.note || '') + '·驱散';
  } else if (key === 'chant') {
    act.cleanse = true;
    act.heal = Math.max(0, (act.heal || 0) + Math.round(base * 0.40));
    act.note = (act.note || '') + '·净化';
  }
  return act;
};

// —— burn 灼烧：核心资源 = 火层（dot 已由 applyActiveIntervention 消费） ——
NDX._jobBurn = function (act, key) {
  const base = Math.max(1, act.dmg || 0);
  if (key === 'atk') {
    act.dot = { per: Math.max(1, Math.round(base * 0.15)), rounds: 3 };
    act.note = (act.note || '') + '·挂火';
  } else if (key === 'chant') {
    // 爆燃：立即结算（以增伤表达）+ 续火
    act.dmg = Math.max(1, Math.round(base * 1.30));
    act.dot = { per: Math.max(1, Math.round(base * 0.18)), rounds: 3 };
    act.note = (act.note || '') + '·爆燃';
  }
  return act;
};

// —— reverse 逆修：核心资源 = 残血比（血越低越强） ——
NDX._jobReverse = function (act, key, S) {
  const base = Math.max(1, act.dmg || 0);
  const hp = Number(S && S.hp), mx = Number(S && S.maxHp);
  const ratio = (hp > 0 && mx > 0) ? Math.max(0, Math.min(1, hp / mx)) : 1;
  const lowBonus = 1 + 0.5 * (1 - ratio); // 满血 ×1.00 → 濒死 ×1.50
  if (key === 'atk') {
    act.dmg = Math.max(1, Math.round(base * lowBonus));
    act.note = (act.note || '') + '·逆血×' + lowBonus.toFixed(2);
  } else if (key === 'chant') {
    // 以痛换力：破防真伤（不真的扣血，避免预结算架构下自杀）
    act.trueDmg = Math.max(1, (act.trueDmg || 0) + Math.round(base * 0.28));
    act.ignoreDef = true;
    act.note = (act.note || '') + '·以痛换力';
  }
  return act;
};
