// =============================================================
// data_skill_variant.js — 《逆道西行》技能变种 / 状态 / 法宝联动 · **执行器**（V9.55）
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
//
// 🔴 V9.55 地位变更（用户拍板 Q4「所有数据汇聚到数据总表统一调配」）：
//   本文件**不再持有任何数值真源**。数值（STATUS_DEFS / TREASURE_STATUS / ATK_VARIANTS /
//   CHANT_VARIANTS / JOB_STYLE / ULT_STYLE_MOD / JOB_STYLE_VARIANT / SKILL_ORDER / 顺序编排）
//   全部迁入 `js/data_skill_index.js`（技能总表 · 三层收口）。
//   本文件只做**落地**：把总表里的声明式数据变成 act 上的字段，以及战斗侧的 post-hoc 修正。
//
//   执行器清单：
//     applyActVariant      变种 fx 解释执行（读总表 ATK/CHANT_VARIANTS）
//     treasureStatusSources / applyTreasureStatus  法宝状态（读总表 TREASURE_STATUS / STATUS_DEFS）
//     applyUltVariant      大招变体落地（读总表 ULT_STYLE_MOD）
//     applyDaoKeyFeel      六道攻式（从 combat_active.js 内联抽出，供总表 dao 层调用）
//     _bumpHp / _syncSquadTop / applyDamageReduction / _resyncFight /
//     applyMonsterStatus / applyGuardCounter / applyJingOnHit
//
// 设计要旨（用户拍板 V9.29）：
//   ① 🔴 V9.51 已废止「本命道」概念：六道 = 玩家的选择，英雄不绑定任何道。
//   ② 「化攻为盾」废除 → 改为「舍攻为盾」：取消本次物理攻击，改为增加护盾（全英雄适用）
//   ③ 技能不再是纯伤害：普攻/诵经各有变种，含 buff / debuff / 多重攻击 / 群伤
//   ④ debuff 与法宝联动：装备金刚琢 → 攻击概率打晕；毒/火类法宝 → 挂中毒/灼烧
//   ⑤ 大招随隐藏职业变更：隐藏职 → 流派标签 → 大招变体（同一英雄多玩法）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// ============================================================
// 一、变种 fx 解释执行（⚠ V9.55：总表数据 → act 字段）
//   未知 op 静默跳过；变种绝不拖垮战斗。
// ============================================================
NDX.applyActVariant = function (act, kind, key) {
  if (!act || !key || key === 'plain') return act;
  const tab = (kind === 'chant') ? NDX.CHANT_VARIANTS : NDX.ATK_VARIANTS;
  const v = tab && tab[key];
  if (!v || !v.fx) return act;
  // 基值：部分 op（shieldOfDmg / healPct…）按「进入本变种时的 dmg」折算，须先于任何改写取
  const base = act.dmg || 0;
  try {
    for (let i = 0; i < v.fx.length; i++) {
      const f = v.fx[i];
      if (!f) continue;
      switch (f.op) {
        case 'dmgScale':  act.dmg = Math.max(1, Math.round((act.dmg || 0) * f.v)); break;
        case 'setDmg':    act.dmg = f.v; break;
        case 'setHeal':   act.heal = f.v; break;
        case 'setTrueDmg':act.trueDmg = f.v; break;
        case 'shieldOfDmg':act.shield = Math.max(1, Math.round(Math.max(1, base) * f.v)); break;
        case 'shieldPct': act.shield = Math.max(1, Math.round((act.dmg || 0) * f.v)); break;
        case 'healPct':   act.heal = Math.max(0, (act.heal || 0) + Math.round((act.dmg || 0) * f.v)); break;
        case 'trueDmgPct':   act.trueDmg = Math.max(1, Math.round((act.trueDmg || 0) + (act.dmg || 0) * f.v)); break;
        case 'trueDmgAddPct':act.trueDmg = Math.max(0, (act.trueDmg || 0) + Math.round((act.dmg || 0) * f.v)); break;
        case 'critHit':   act.critHit = !!f.v; break;
        case 'critDmgAdd':act.critDmg = (act.critDmg || 0) + f.v; break;
        case 'armorBreak':act.armorBreak = !!f.v; break;
        case 'ignoreDef': act.ignoreDef = !!f.v; break;
        case 'noDamage':  act.noDamage = !!f.v; break;
        case 'cleanse':   act.cleanse = !!f.v; break;
        case 'hits':      act.hits = f.v; break;
        case 'spread':    act.spread = f.v; break;
        case 'aoe':       act.aoe = f.v; break;
        case 'dr':        act.dr = (act.dr || 0) + f.v; break;
        case 'guardCounter':     act.guardCounter = !!f.v; break;
        case 'counterPct':       act.counterPct = f.v; break;
        case 'counterLifesteal': act.counterLifesteal = f.v; break;
        case 'counterRounds':    act.counterRounds = f.v; break;
        case 'sBuff':     act.sBuff = Object.assign({}, act.sBuff || {}, f.v || {}); break;
        case 'note':      act.note = (act.note ? act.note + '·' : '') + f.v; break;
        default: break;
      }
    }
  } catch (e) { /* 变种绝不拖垮战斗 */ }
  return act;
};

// ============================================================
// 二、法宝 → 状态联动（用户拍板：debuff 与法宝结合）
//   key = 至宝 id（含道向进化形态），chance = 命中后触发概率，status = 施加状态
// ============================================================
NDX.treasureStatusSources = function (s) {
  const out = [];
  if (!s) return out;
  const pool = [];
  // 装备槽（gear/equip）与持有（treasures / held）都认，兼容两套存档字段。
  // 🩸 X2 接线（2026-09-27 · Batch 0）：**真容器是 `s.equips`**（全库 `.gear = [` 赋值实测 0 处），
  //   原数组漏掉它 ⇒ `NDX.TREASURE_STATUS` 19 条法宝状态注入 **0 条生效**（S02 提出、S08 端到端反证）。
  //   ⚠ `s.equips` 里装的是**装备实例**：`.id` 是实例 id、`.treasureId` 才是至宝 id，
  //     而 TREASURE_STATUS 的 key 一律 `tre_*`（至宝 id）⇒ 必须取 `treasureId`；
  //     若沿用通用分支的 `x.id`，查表会**恒 miss**，等于没修。
  ['equips', 'gear', 'treasures', 'held', 'equip'].forEach(function (k) {
    const v = s[k];
    if (!v) return;
    if (k === 'equips') {
      (Array.isArray(v) ? v : [v]).forEach(function (x) {
        if (!x) return;
        if (typeof x === 'string') { pool.push(x); return; }
        if (x.treasureId) pool.push(x.treasureId);
        else if (x.treasure && typeof x.treasure === 'string') pool.push(x.treasure);
        else if (x.id || x.key) pool.push(x.id || x.key);
      });
      return;
    }
    if (Array.isArray(v)) v.forEach(function (x) { if (x) pool.push(typeof x === 'string' ? x : (x.id || x.key)); });
    else if (typeof v === 'object') Object.keys(v).forEach(function (id) { if (v[id]) pool.push(id); });
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
// 三、绝招变体落地（读总表 ULT_STYLE_MOD）
//   数据驱动，不新造引擎；未知字段由战斗侧按需消费
// ============================================================
NDX.applyUltVariant = function (act, heroId, tier, jobKey, styleOverride) {
  if (!act) return act;
  const v = NDX.ultVariantFor(heroId, tier, jobKey, styleOverride);
  if (!v) return act;
  const dmg = Math.max(1, act.dmg || 0);
  if (v.dmgMul) act.dmg = Math.max(1, Math.round(dmg * v.dmgMul));
  if (v.hits) { act.hits = v.hits; act.spread = v.spread || 0.2; }
  if (v.critHit) { act.critHit = true; act.critDmg = v.critDmg || 0.5; }
  if (v.trueDmg) act.trueDmg = Math.max(1, Math.round((act.dmg || dmg) * v.trueDmg));
  if (v.armorBreak) act.armorBreak = true;
  if (v.shield) act.shield = Math.max(1, Math.round((act.dmg || dmg) * v.shield));
  if (v.heal) act.heal = Math.max(1, Math.round((act.dmg || dmg) * v.heal));
  // V9.51 断线修复：lifesteal 折入 heal（原挂 act.lifesteal，全仓无人读 → 吸血半边失效）
  if (v.lifesteal) act.heal = Math.max(0, (act.heal || 0) + Math.round((act.dmg || dmg) * v.lifesteal));
  // V9.51 断线修复：reflect 改走 guardCounter 管线（act.reflect 全仓无人读；applyGuardCounter 已通）
  if (v.reflect) { act.guardCounter = true; act.counterPct = Math.max(act.counterPct || 0, v.reflect); }
  if (v.guardCounter) {
    act.guardCounter = true;
    act.counterPct = (v.counterPct != null) ? v.counterPct : (act.counterPct || 0.5);
    if (v.counterLifesteal != null) act.counterLifesteal = v.counterLifesteal;
    if (v.counterRounds != null) act.counterRounds = v.counterRounds;
  }
  if (v.dr) act.dr = (act.dr || 0) + v.dr;
  // V9.51 断线修复：evaUp / cleanse / summon 保留标记，由 applyActiveIntervention 补消费分支落地
  if (v.evaUp) { act.evaUp = (act.evaUp || 0) + v.evaUp; if (v.evaUpRounds != null) act.evaUpRounds = v.evaUpRounds; }
  if (v.cleanse) act.cleanse = true;
  if (v.sBuff) act.sBuff = Object.assign({}, act.sBuff || {}, v.sBuff);
  if (v.dot) act.dot = { per: Math.max(1, Math.round((act.dmg || dmg) * v.dot.pct)), rounds: v.dot.rounds, kind: '业火' };
  if (v.summon) { act.summon = true; if (v.summonRounds != null) act.summonRounds = v.summonRounds; }
  act.ultStyle = styleOverride || NDX.jobStyleOf(jobKey);
  act.name = v.name + '（' + act.name + '）';
  act.note = v.desc;
  return act;
};

// ============================================================
// 四、六道攻式（手动三键·攻）——⚠ V9.55 从 combat_active.js 内联抽出
//   抽出原因：它已成为技能总表 SKILL_ORDER 中 `dao` 层的执行体，必须由 resolveSkillAct 按序调用，
//   否则「顺序真源」名存实亡（顺序仍隐含在调用点的语句里）。
//   只改 act 上的原语字段与 note，不夺 dblBase 基值；未进阶/未吃攻式时零操作。
// ============================================================
NDX.applyDaoKeyFeel = function (player, act, s, heroId) {
  if (!act || !act.kind) return act;
  void heroId; void s;
  const S = s || {};
  // 道途进阶（仅「已装备劫印」生效，避免囤印冲突）
  const _sa = (player && player._skillAdvance) || null;
  if (_sa && _sa.atk) return act; // 已进阶走进阶口径，六道攻式不叠加
  // player.daoAtk 由 resolveManualActive 透传；手动风格（combo/burst/pierce）优先
  const _mdA = (player && player.daoAtk) || null;
  const _mk = (_mdA && _mdA.style) ? _mdA.style.key : null;
  const _mp = (_mdA && _mdA.style) ? (_mdA.style.pct || 0) : 0;
  if (!_mk) return act;
  if (_mk === 'crit') {
    if (Math.random() < _mp) { act.dmg = Math.max(1, Math.round(act.dmg * 1.5)); act.critHit = true; act.note += '·战意冲霄'; }
  } else if (_mk === 'heal') { act.heal = Math.max(0, Math.round(act.dmg * _mp)); act.note += '·禅光渡世'; }
  else if (_mk === 'lifesteal') { act.heal = Math.max(0, Math.round(act.dmg * _mp)); act.note += '·夺灵噬血'; }
  else if (_mk === 'shield') { act.shield = Math.max(0, Math.round(act.dmg * _mp)); act.note += '·缘起护身'; }
  else if (_mk === 'true') { act.trueDmg = Math.max(1, Math.round(act.dmg * _mp)); act.note += '·逆锋透骨'; }
  else if (_mk === 'evade-crit' && player.daoEvadeReady) { act.dmg = Math.max(1, Math.round(act.dmg * 1.5)); act.critHit = true; act.note += '·影遁必杀'; }
  // V9.66 逆道·逆血：style.ls 附加回血（与自动轨 combat_part1.js 同口径）。
  //   真伤道（key='true'）原本零续航，是六道中唯一无回血手段的道；ls 独立于 LIFESTEAL_CAP。
  if (_mdA && _mdA.style && _mdA.style.ls && act.dmg > 0) {
    act.heal = (act.heal || 0) + Math.max(0, Math.round(act.dmg * _mdA.style.ls));
    act.note += '·逆血';
  }
  return act;
};

// ============================================================
// 五、累计血量序列传播（V9.34 修复）
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
// 五·一、编队战顶层同步（V9.38）
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
// 五·二、减伤落地（避免「减伤」成为只写在 act 上的死属性）
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
// 五·三、怪物状态落地 —— mStatus 不再是回合明细上的死数据
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
// 五·四、防御反击落地 —— guardCounter 不再是空标志
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
// 五·五、经位经书 on-hit 状态（自动战斗落地，V9.33）
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
