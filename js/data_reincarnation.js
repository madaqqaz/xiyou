// =============================================================
// data_reincarnation.js — 《逆道西行》轮回赐福系统 · ROLL_BASE/ASH_KEY
// 从 data.js 拆分（2026-08-31）：独立维护轮回赐福系统
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

NDX.ROLL_BASE = 0.70; // 兜底基准
NDX.ROLL_BASE_FATE = { yong: 0.65, du: 0.75 }; // 勇(fight/reverse) / 渡(渡/隐)
NDX.ROLL_REROLL_COST = 30; // 金：失败后耗材重投的次数成本
NDX.ROLL_ETHOS_SPAN = 40;  // 每 40 点善恶倾向差的修正跨度 ±25%
NDX.summyRoll = function (s, opt) {
  const fate = opt && opt.fate;
  const gentle = fate === '渡' || fate === '隐';
  const base = (opt && opt.rollBase) || NDX.ROLL_BASE_FATE[(gentle ? 'du' : 'yong')] || NDX.ROLL_BASE;
  let chance = base;
  // 善恶成败：善恶积淀入骰面
  const good = (s && s.good) || 0, evil = (s && s.evil) || 0;
  const ethos = (good - evil) / NDX.ROLL_ETHOS_SPAN;
  const bias = Math.max(-0.25, Math.min(0.25, ethos));
  const sign = gentle ? 1 : -1; // 渡/隐偏袒善念，勇/夺/逆偏袒恶念
  chance += sign * bias;
  // 六道劫印（V8.26 命痕砍除改版）：随身劫印越多，越能测得天地玄机（最多 +12%）
  chance += Math.min(0.12, ((s && s.seals) || []).length * 0.02);
  // 阶段六·劫灰升级「六道亲和」（§11.2）：每级 +5% 判定成功率（至多 +25%）
  chance += Math.min(0.25, NDX.ashLevel('roll') * NDX.ASH_SHOP[2].step);
  // 高难度（收严寿命的一面向）让天地更吝啬
  if ((s && s.diff) >= 3) chance -= 0.05;
  return Math.max(0.05, Math.min(0.95, chance));
};
// 把骰面渲染成"几成把握"（供 UI / 日志）
NDX.rollPct = function (chance) {
  return Math.round(chance * 100);
};

// ============================================================
// 阶段六 · 劫灰结算与永久升级（对应 §11.1 / §11.2）
// 失败/通关皆会累积「劫灰」——它是「这一生没白走」的凭证，可在劫灰坊
// 兑换永久强化，构成跨周的 Meta 压力反馈。数据落地 localStorage。
// ============================================================
NDX.ASH_KEY = 'xynj_ash_shop';
NDX.loadAsh = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const data = NDX.SaveSystem.load(NDX.ASH_KEY, { credits: 0, up: {} });
  return (data && typeof data === 'object') ? data : { credits: 0, up: {} };
};
NDX.saveAsh = function (a) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.ASH_KEY, a);
};
// 永久升级店（§11.2）：id / 名称 / 每级效果 / 单价 / 上限 / 单级步长
// unit：当前生效后缀（percent={pct} 表示百分比线，否则为数量线）——劫灰坊「五线进度/生效归因」据此诚实折算。
// P0-C（V3 §3.1）去纵向：金蝉余韵/逆心初萌 由「全局+%气血/伤害」改为「横向解锁——每级解锁一名传承英雄」，
//   不再提供任何全局数值加成；六道亲和(roll)/法宝共鸣(chg)/劫印拓印(seal) 属工具/解锁型，保留纵向。
NDX.ASH_SHOP = [
  { id: 'hp',  name: '金蝉余韵', icon: '✚', desc: '每级解锁一名传承英雄（气血改为横向——不增数值，只开人选）', cost: 8,  max: 2, step: 1, unit: { pct: false, txt: '传承英雄' } },
  { id: 'dmg', name: '逆心初萌', icon: '⚔', desc: '每级再解锁一名传承英雄（伤害改为横向——不增数值，只开人选）', cost: 8,  max: 2, step: 1, unit: { pct: false, txt: '传承英雄' } },
  { id: 'roll',name: '六道亲和', icon: '☯', desc: '每级 +5% 劫运骰成功',    cost: 6,  max: 5,  step: 0.05, unit: { pct: true, txt: '劫运骰成功' } },
  { id: 'chg', name: '法宝共鸣', icon: '🜂', desc: '每级 +1 次法宝初始充能', cost: 10, max: 5,  step: 1, unit: { pct: false, txt: '法宝初始充能' } },
  { id: 'seal',name: '劫印拓印', icon: '🜀', desc: '每级 +1 永久劫印槽（各品阶各扩 1 席，单局可带更多）', cost: 12, max: 3, step: 1, unit: { pct: false, txt: '永久劫印槽' } },
];
NDX.ashLevel = function (id) { const a = NDX.loadAsh(); return (a.up && a.up[id]) || 0; };
// P0-C 横向解锁量：劫灰两线（金蝉/逆心）各级各解锁一名传承英雄（不含取经人），至多 4 名。
//   与「死亡渐进解锁」合并成英雄解锁的「横向三通道」——通关全解锁 / 劫灰买印逐解 / 死亡递进逐解。
NDX.ashUnlockHeroCount = function () {
  return Math.min(4, NDX.ashLevel('hp') + NDX.ashLevel('dmg'));
};
// P0-C 死亡渐进解锁（V3 §3.2 补横向）：落地 UI 壳已备好的 DEATH_UNLOCKS 后端。
//   英雄解锁阈值：1/2/4/8 次死亡逐解 悟空/八戒/沙僧/小白龙——「每死一局＝有横向正反馈」。
NDX.DEATH_UNLOCK_KEY = 'xynj_death_unlock_v1';
NDX.loadDeathUnlocks = function () {
  const d = NDX.SaveSystem.load(NDX.DEATH_UNLOCK_KEY, null);
  return (d && typeof d === 'object') ? d : { deathCount: 0 };
};
NDX.saveDeathUnlocks = function (d) { NDX.SaveSystem.save(NDX.DEATH_UNLOCK_KEY, d || { deathCount: 0 }); };
NDX.deathCount = function () { return NDX.loadDeathUnlocks().deathCount || 0; };
NDX.bumpDeathCount = function () {
  const d = NDX.loadDeathUnlocks();
  d.deathCount = (d.deathCount || 0) + 1;
  NDX.saveDeathUnlocks(d);
  return d.deathCount;
};
// 死亡解锁条目表（横向解锁清册）——类别键与 ui_misc_3 category 对齐：heroes/sutras/events/zhuanjie。
// P0-C 补齐三类：sutras=传承经文（deathReq 进渡经候选池）、events=传承事件（deathReq 进问号池）。
NDX.DEATH_UNLOCKS = {
  heroes: [
    { id: 'wukong',            name: '孙悟空',    death: 1, desc: '大闹天宫的美猴王——体攻暴发流，金箍战力暴涨' },
    { id: 'bajie',             name: '猪八戒',    death: 2, desc: '天蓬元帅——缘道血换输，贪狼吸血流' },
    { id: 'shaseng',           name: '沙悟净',    death: 4, desc: '卷帘大将——夺道旧伤压制，狮驼攻守兼备' },
    { id: 'xiaobailong',       name: '小白龙',    death: 8, desc: '西海龙三太子——隐道影遁规避，龙马疾速布局' },
  ],
  sutras: [
    { id: 'su_full_guanyin',   name: '《观音经》', death: 3, desc: '闻声救苦的传承经——自此进入渡经候选池，集齐全本气血自愈同涨' },
    { id: 'su_full_wenshu',    name: '《文殊般若经》', death: 6, desc: '慧剑断执的传承经——自此进入渡经候选池，集齐全本体攻暴击并明' },
  ],
  events: [
    { id: 'ev_death_guanyin',  name: '观音·化缘旧事', death: 3, desc: '传承事件入问号池——听前几世的旧事，或得观音经残片，或得金' },
    { id: 'ev_death_wenshu',   name: '文殊·慧剑遗痕', death: 6, desc: '传承事件入问号池——悟慧剑遗痕，或得文殊经残片，或得金' },
  ],
  zhuanjie: [],
};
// 死亡已达阈值解锁的条目 id（按类别；仅死亡通道，不含通关/劫灰通道）
NDX.deathUnlockedOf = function (cat) {
  const n = NDX.deathCount();
  return (NDX.DEATH_UNLOCKS[cat] || []).filter((x) => n >= x.death).map((x) => x.id);
};
// 死亡已达阈值解锁的英雄 id（heroes 便捷封装）
NDX.deathHeroesUnlocked = function () {
  return NDX.deathUnlockedOf('heroes');
};
// 三类（heroes/sutras/events/zhuanjie）all：返回 P0-C 已登记的横向解锁清单
NDX.getDeathUnlocks = function () {
  const dc = NDX.deathCount();
  const unlocked = {
    heroes: NDX.deathUnlockedOf('heroes'),
    sutras: NDX.deathUnlockedOf('sutras'),
    events: NDX.deathUnlockedOf('events'),
    zhuanjie: NDX.deathUnlockedOf('zhuanjie'),
  };
  return { deathCount: dc, unlocked: unlocked };
};
// UI「即将解锁」：返回逐类尚未达阈值、且未被劫灰提前解锁的条目（heroes 受劫灰通道覆盖）
NDX.getNextDeathUnlock = function () {
  const dc = NDX.deathCount();
  const ahc = NDX.ashUnlockHeroCount();
  const out = [];
  Object.keys(NDX.DEATH_UNLOCKS || {}).forEach((cat) => {
    (NDX.DEATH_UNLOCKS[cat] || []).forEach((x, i) => {
      if (dc >= x.death) return;
      // heroes 条目已被劫灰提前解锁 → 不再列为「即将解锁」
      if (cat === 'heroes' && i < ahc) return;
      out.push({
        id: x.id, name: x.name, cat: cat, remaining: Math.max(1, x.death - dc), desc: x.desc
          + (cat === 'heroes' ? '（亦可于劫灰坊「金蝉余韵/逆心初萌」提前解锁）' : '（死亡渐进解锁）'),
      });
    });
  });
  return out;
};
// 重置传承（纯肉鸽模式开关）：清空死亡次数，并卸下劫灰两线的「传承英雄」解锁（保留其它工具线与劫灰币）
NDX.resetDeathUnlocks = function () {
  NDX.saveDeathUnlocks({ deathCount: 0 });
  const a = NDX.loadAsh();
  if (a.up) { delete a.up.hp; delete a.up.dmg; }
  NDX.saveAsh(a);
};
// V8.6x 模块十·五线生效归因 + 毕业导向：劫灰坊五条永久升级线的单源折算。
//   per-line.eff = 当前已生效的诚实数值（百分比线 ≈ +X% 气血/伤害/劫运；数量线 = +X 次/槽）；
//   completion = 五线总进度（已升合计级 / 上限合计级 · pct），maxedAll 触「五线毕业」导语。
NDX.ashProgress = function () {
  const a = NDX.loadAsh();
  const defs = NDX.ASH_SHOP || [];
  const lines = defs.map((d) => {
    const lv = (a.up && a.up[d.id]) || 0;
    const maxed = lv >= d.max;
    const effLv = Math.min(lv, d.max); // 横向线（传承英雄）上限钳制：多余级数不回显数值
    let eff;
    if (d.unit && d.unit.pct) eff = '+' + Math.round(effLv * d.step * 100) + '% ' + d.unit.txt;
    else if (d.unit) eff = '+' + (effLv * d.step) + ' ' + d.unit.txt;
    else eff = '';
    return { id: d.id, name: d.name, icon: d.icon, lv, max: d.max, maxed, eff, unit: d.unit, desc: d.desc };
  });
  const total = defs.reduce((n, d) => n + d.max, 0);
  const current = lines.reduce((n, l) => n + l.lv, 0);
  const pct = total ? Math.round((current / total) * 100) : 0;
  const maxedAll = defs.length > 0 && lines.every((l) => l.maxed);
  const maxedCount = lines.filter((l) => l.maxed).length;
  return { lines, total, current, pct, maxedAll, maxedCount };
};
// §11.1 结算：每通过一难 +1 · 收徒 +3 · 选六道 +0.5 · 通关 +20 · 善恶 +（善+恶）×0.1
NDX.ashFromRun = function (s) {
  let a = 0;
  const parts = { trials: 0, fate: 0, disciples: 0, ethos: 0, win: 0 }; // V8.61 分项记录（死亡/通关结算页展示）
  parts.trials += (s.layer || 0) + ((s.act - 1 || 0) * 12); // 已通晓难数（层数 + 已转章折算）
  a += parts.trials;
  parts.fate += ((s.trialFateLog || []).length) * 0.5;           // 每选一次六道
  a += parts.fate;
  parts.disciples += ((s.disciples || []).length) * 3;           // 每收一徒 +3（师徒缘 V8.17）
  a += parts.disciples;
  parts.ethos += ((s.good || 0) + (s.evil || 0)) * 0.1;          // 善恶绝对值折算（V8.61 收口：善恶同权×0.1，对齐 §11.1；恶道已负心魔+折寿，不再叠加劫灰歧视）
  a += parts.ethos;
  if (s.over && s.over.win) { parts.win += 20; a += 20; }        // 通关（含返程诸档位）
  try { if (s) s._ashDetail = { parts: parts, total: a }; } catch (e) {} // V8.61：结算页劫灰入账分项（deathScreen 消费）
  return Math.max(1, Math.round(a));
};
NDX.credAsh = function (s) {
  const a = NDX.loadAsh();
  a.credits = (a.credits || 0) + NDX.ashFromRun(s);
  // 劫灰来源日志（供 UI 回看本局入账）
  a.last = NDX.ashFromRun(s);
  NDX.saveAsh(a);
  return a.last;
};

// ============================================================
// 阶段六 · NG+ 转世重修结转（对应 §11.3）
// 通关（返程回长安）后，把「本命家当 + 遗物 + 佛经」存入本地「引渡匣」；
// 下一世开局 start() 读匣承继（一次性），实现「带家当与经文自夏重新开始」。
// 难度随周目收紧见 NDX.lifeTighten，与承继正交。
// ============================================================
NDX.INHERIT_KEY = 'xynj_inherit_stash';
NDX.MONUMENT_GEAR_KEY = 'xynj_monument_gear_v1';
// —— 衣冠冢遗物（V8.18）：挑战失败时，衣冠冢随机掉落于当前章节国度，玩家择装备带入下世。
//   仅保留装备（劫印/法宝/经文随遗体归尘）；同一件装备只可经此路穿越一次（已得则不再重复获得）。
NDX.loadMonumentGear = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const o = NDX.SaveSystem.load(NDX.MONUMENT_GEAR_KEY, { pending: {}, given: {} });
  o.pending = o.pending || {};
  o.given = o.given || {};
  return o;
};
NDX.saveMonumentGear = function (o) {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.save(NDX.MONUMENT_GEAR_KEY, o);
};
// 选保留装备：存为待穿越的 pending；同一装备 id 已曾在 given 中则不再记入（防重复获得）
NDX.keepMonumentGear = function (heroId, equips) {
  const o = NDX.loadMonumentGear();
  const given = o.given[heroId] = o.given[heroId] || {};
  const p = o.pending[heroId] = o.pending[heroId] || {};
  let kept = 0;
  (equips || []).forEach((e) => {
    if (!e || !e.id || e.treasure) return;          // 仅装备，不保留法宝
    if (p[e.id] || given[e.id]) return;              // 已在待承接或已曾穿越 → 不再记入
    p[e.id] = e.name || e.id;
    given[e.id] = e.name || e.id;
    kept++;
  });
  NDX.saveMonumentGear(o);
  return kept;
};
// 下一周目开局：取出本英雄的待承接装备（并清空该英雄 pending）
NDX.takeMonumentGear = function (heroId) {
  const o = NDX.loadMonumentGear();
  const p = o.pending[heroId] || {};
  const ids = Object.keys(p);
  delete o.pending[heroId];
  NDX.saveMonumentGear(o);
  return ids.map((id) => ({ id, name: p[id] || id }));
};
NDX.saveInherit = function (s) {
  try {
    const hero = (s && s.hero) || null;
    // V8.60 承继去法宝：本命法宝/红装（金箍、紫金钵、净坛宝盂等）不再死后传承——
    // 每世各英雄法宝独立重历重得，跨世仅保留 遗物 / 经文 / 劫印。
    const stash = {
      hero: hero,
      equips: [],                                      // 法宝不入引渡匣
      relics: (s.relics || []).slice(),
      sutras: (s.sutras || []).slice(),
      niSutras: (s.niSutras || []).slice(),
      seals: (s.seals || []).slice(),   // V8.56 完美/不完美结局自长安出发 100% 承继劫印
      ts: Date.now(),
    };
    // 轴二·逐件承继账（§4 P0·③）：把当前随行件写为 stash.ledger，逐件累计传世数——
    // 「已承第 N 世」= 该件被存入引渡匣的次数（含本世）。ledger 只保留当前随行件，随匣入库、随消费清空。
    stash.ledger = NDX.inheritCarryOf(s).map((it) => ({
      type: it.type, id: it.id, name: it.name, times: (it.times || 0) + 1,
    }));
    // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
    NDX.SaveSystem.save(NDX.INHERIT_KEY, stash);
    return stash.relics.length + stash.sutras.length + stash.niSutras.length + stash.seals.length;
  } catch (e) { return 0; }
};
// —— 轴二·承继件逐件真源（§4 P0·③ 子轴二，供 saveInherit 写账 + start() 开局预览共用）——
// inheritCarryOf(s)：把 s 当前随行件摊成逐件列表 [{type,id,name,times}]；
// times 取自 s._inheritLedger（本世开局读回的旧账）——旧账未收录者 times=0（本世首次入账）。
NDX.inheritItemName = function (type, it, id) {
  try {
    if (type === 'seal') return (it && it.name) || id;
    if (type === 'relic') { const r = (NDX.ZHUANJIE && NDX.ZHUANJIE.relicById) ? NDX.ZHUANJIE.relicById(id) : null; return (r && r.name) || (it && it.name) || id; }
    if (type === 'sutra') { const f = NDX.sutraFullById ? NDX.sutraFullById(id) : null; return (f && f.name) || id; }
    if (type === 'niSutra') { const f = NDX.niSutraFullById ? NDX.niSutraFullById(id) : null; return (f && f.name) || id; }
    return (it && it.name) || id;
  } catch (e) { return (it && it.name) || id; }
};
NDX.inheritCarryOf = function (s) {
  const out = [];
  const prior = (s && s._inheritLedger) || {};
  const add = (type, items) => {
    (items || []).forEach((it) => {
      const id = (typeof it === 'string') ? it : (it && it.id != null ? it.id : (it && it.name) || '');
      if (id == null || id === '') return;
      const k = type + ':' + id;
      const prev = prior[k];
      out.push({ type, id, name: NDX.inheritItemName(type, it, id), times: (prev && prev.times) || 0 });
    });
  };
  add('relic', s && s.relics);
  add('sutra', s && s.sutras);
  add('niSutra', s && s.niSutras);
  add('seal', s && s.seals);
  return out;
};
NDX.loadInherit = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  const a = NDX.SaveSystem.load(NDX.INHERIT_KEY, null);
  return (a && typeof a === 'object') ? a : null;
};
NDX.clearInherit = function () {
  // V8.41 统一使用NDX.SaveSystem，删除降级逻辑
  NDX.SaveSystem.remove(NDX.INHERIT_KEY);
};
// 永久劫印槽（§11.2 劫印拓印）：劫灰商店升级等级 → 各品阶额外席位
NDX.sealBonusSlots = function () { return NDX.ashLevel ? NDX.ashLevel('seal') : 0; };

// 把赐福进度换算为「感受性保底」（仅二周目 cycle>=2 解锁；P0-C V3 §3.1 去纵向）
// 每 3 次失败累计 +1 保底层（至多 3 层）：作用于掉装 soft-pity 提前——「失败越多，越早得套装保底」
// 不再提供任何乘法攻/血/减伤/法强/法抗；仅保留 起始金（经济层）与保底层（安全网），诚实不越线。
// 返回结构保持 { unlocked, progress, bonusTi, bonusYuan, startGold, pityGrace, note } 兼容消费点。
NDX.favorBonus = function (progress, cycle) {
  const unlocked = (cycle || 1) >= 2;
  const p = unlocked ? Math.max(0, progress | 0) : 0;
  const pityGrace = Math.min(3, Math.floor(p / 3));
  return {
    unlocked: unlocked,
    progress: p,
    bonusTi: { atk: 0, hp: 0, dr: 0, eva: 0 },   // 纵向已砍：恒为 0
    bonusYuan: { matk: 0, mdef: 0 },            // 纵向已砍：恒为 0
    pityGrace: pityGrace,
    startGold: Math.floor(p / 5) * 5, // 每5点 +5 起始金（经济层，非攻血）
    note: unlocked
      ? `轮回赐福·累计 ${p} 次失败庇佑（感受性保底·降伤害不掉落差）：掉装保底提前 ${pityGrace} 层 · 开局金+${Math.floor(p / 5) * 5}`
      : '轮回赐福尚未解锁（需二周目）',
  };
};

// ============================================================
// 轮回殿·双线赐福体系（最终定稿）
// 秩序赐福（正道）→ orderLv ；混沌赐福（逆道）→ chaosLv
// 制衡规则：仅「混沌等级」单向稀释「秩序收益」；秩序等级不干扰混沌生效。
// ============================================================

// 秩序赐福定义：循守戒律，增益稳定，无原生负面代价
