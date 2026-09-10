// =============================================================
// combat_skills.js — 《逆道西行》战斗技能结算（识破/气势爆发）
// 从 combat.js 拆分（2026-09-09）：独立维护战斗技能结算逻辑
// 全局命名空间 NDX（同时挂到 window，兼容其他文件以 window.NDX 引用）
// =============================================================
window.NDX = window.NDX || {};
var NDX = window.NDX;

// —— 回合识破 · 结算 ——
// 在 telegraph 回合（识破窗口）玩家选择"识破"：反制蓄力重击。
// 1) 本回合 mTurn.deal 归零（重击被格挡，玩家不掉血）
// 2) 反制伤害 = 玩家双攻 ×0.8（克制命中再 ×1.5）
// 3) 反制成功奖励 2 点气势（联动气势系统，后续回合展示 +2）
// 返回修改后的 res（同一引用），并给被干预回合打标 intervention.shiPo。
NDX.applyShiPo = function (res, atRound) {
  if (!res || !res.roundsDetail) return res;
  const idx = Math.max(0, atRound - 1);
  const rd = res.roundsDetail[idx];
  if (!rd || !rd.telegraph || !rd.mTurn) return res;
  // —— 识破结算常量（修复 V8.5x 引用未定义变量：反制倍率×0.8 / 气势奖励+2）——
  const _shiPoMult = 0.8;          // 反制伤害 = 玩家双攻 ×0.8（注释语义；克制命中再 ×1.5）
  const _shiPoGain = 2;            // 识破成功奖励 2 点气势（与下方 +2 一致）
  const _shiPoTier = 1;            // 识破为单一反制动作，无进阶阶次
  const _timing = 'telegraph';     // 识破成立于蓄力重击（telegraph）窗口
  const list = res.roundsDetail;
  const maxHp = res.maxHp || 1;
  // 1) 格挡：本回合怪物重击归零
  const negated = rd.mTurn.deal || 0;
  rd.mTurn.deal = 0; rd.mTurn.phys = 0; rd.mTurn.magic = 0; rd.mTurn.shp = true;
  // 2) 反制伤害（克制联动 ×1.5）
  const base = (res._playerAtk || 0) + (res._playerMatk || 0);
  const shpDmg = Math.round(base * _shiPoMult * (res.countered ? 1.5 : 1));
  // 3) 本回合血量重算：玩家被格挡的扣血回补，怪物被反制扣血
  rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + negated);
  const mBefore = rd.mHpAfter || 0;
  const mAfter = Math.max(0, mBefore - shpDmg);
  rd.mHpAfter = mAfter;
  if (rd.mTurn) rd.mTurn.hpAfter = mAfter;
  // 4) 后续回合 mHpAfter 同步下拉 shpDmg（与 applyBattleIntervention 的 dmg 处理一致）
  for (let i = idx + 1; i < list.length; i++) {
    const r2 = list[i];
    const cur = r2.mTurn ? (r2.mTurn.hpBefore || 0) : (r2.mHpAfter || 0);
    const after = Math.max(0, cur - shpDmg);
    if (r2.mTurn) r2.mTurn.hpAfter = after;
    r2.mHpAfter = after;
  }
  // 5) 联动气势：识破成功 +2（后续回合展示）
  for (let i = idx; i < list.length; i++) {
    const r2 = list[i];
    r2.momentum = Math.min(5, (r2.momentum || 0) + 2);
  }
  // 6) 打标
  rd.intervention = Object.assign({}, rd.intervention || {}, { shiPo: true, shiPoTier: _shiPoTier, shiPoTiming: _timing, shpDmg: shpDmg, negated: negated, shpGain: _shiPoGain });
  // 7) 重算顶层胜负 + 怪物提前归零截断
  res.monsterHpLeft = list.length ? list[list.length - 1].mHpAfter : res.monsterHpLeft;
  res.playerHpLeft = list.length ? Math.min(maxHp, list[list.length - 1].pHpAfter) : res.playerHpLeft;
  let killAt = -1;
  for (let i = idx; i < list.length; i++) {
    if (list[i].mHpAfter <= 0) { killAt = i; break; }
  }
  if (killAt >= 0) {
    res.roundsDetail = list.slice(0, killAt + 1);
    res.total = res.roundsDetail.length;
  }
  res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
  res.lose = res.playerHpLeft <= 0;
  return res;
};

// —— 气势爆发 · 结算 ——
// 在常规操作点（routine / enrage / lowhp）玩家选择"爆发"：消耗当前气势，按层级造成爆发伤害。
// 层级越高倍率越高（一势×0.6 / 二势×1.0 / 三势×1.5）；本场克制命中（res.countered）再 ×1.5。
// 返回修改后的 res（同一引用），并给被干预回合打标 intervention.burst。
NDX.applyMomentumBurst = function (res, atRound) {
  if (!res || !res.roundsDetail) return res;
  const idx = Math.max(0, atRound - 1);
  const rd = res.roundsDetail[idx];
  if (!rd) return res;
  const list = res.roundsDetail;
  const maxHp = res.maxHp || 1;
  const tier = rd.momentumTier || 0;
  if (tier <= 0) return res; // 无气势不可爆发
  const BURST_X = [0, 0.6, 1.0, 1.5];
  // S1-1 防御：tier 越界（>3 / 非整数 / NaN）时 BURST_X[tier] 为 undefined → 伤害 NaN。
  // 钳到 [1,3] 有效档位，杜绝 NaN 外溢到 mHpAfter / UI 伤害数字。
  const _tier = Math.max(1, Math.min(3, Math.floor(tier) || 0)) || 1;
  const base = (res._playerAtk || 0) + (res._playerMatk || 0);
  const burstDmg = Math.round(base * (BURST_X[_tier] || BURST_X[3]) * (res.countered ? 1.5 : 1));
  // 起点回合扣血 + 后续下拉（与 applyBattleIntervention 的 dmg 处理一致）
  const mBefore = rd.mHpAfter || 0;
  const mAfter = Math.max(0, mBefore - burstDmg);
  rd.mHpAfter = mAfter;
  if (rd.mTurn) rd.mTurn.hpAfter = mAfter;
  for (let i = idx + 1; i < list.length; i++) {
    const r2 = list[i];
    const cur = r2.mTurn ? (r2.mTurn.hpBefore || 0) : (r2.mHpAfter || 0);
    const after = Math.max(0, cur - burstDmg);
    if (r2.mTurn) r2.mTurn.hpAfter = after;
    r2.mHpAfter = after;
  }
  // 消耗气势：后续回合展示清零
  for (let i = idx; i < list.length; i++) {
    list[i].momentum = 0;
    list[i].momentumTier = 0;
  }
  // 打标
  rd.intervention = Object.assign({}, rd.intervention || {}, { burst: true, burstTier: _tier, burstDmg: burstDmg });
  // 重算顶层胜负 + 怪物提前归零截断
  res.monsterHpLeft = list.length ? list[list.length - 1].mHpAfter : res.monsterHpLeft;
  res.playerHpLeft = list.length ? Math.min(maxHp, list[list.length - 1].pHpAfter) : res.playerHpLeft;
  let killAt = -1;
  for (let i = idx; i < list.length; i++) {
    if (list[i].mHpAfter <= 0) { killAt = i; break; }
  }
  if (killAt >= 0) {
    res.roundsDetail = list.slice(0, killAt + 1);
    res.total = res.roundsDetail.length;
  }
  res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
  res.lose = res.playerHpLeft <= 0;
  return res;
};
