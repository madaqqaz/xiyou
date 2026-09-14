// =============================================================
// combat_part2.js - 战斗系统（第二部分：叙事/干预/状态效果/连击）
// 从 combat.js 拆分，内容第1122-1945行
// 外部接口 NDX.* 保持不变，调用方无需修改
// 拆分日期: 2026-09-14
// =============================================================

(function () {

  NDX._buildFightNarrative = function (res) {
    const parts = [];
    (res.roundsDetail || []).forEach((rd) => {
      if (rd.stageBreakPoint) return; // 破韧窗口非交锋拍，不写入旁白
      const segs = [];
      if (rd.first === 'enemy') segs.push('妖物抢得先机，率先扑来');
      if (rd.pTurn) {
        const t = rd.pTurn;
        const ai = rd.ai || {};
        const attrTag = ai.blackMiasma ? '〔黑瘴〕' : (ai.atkAttr === '佛光' ? '〔佛光〕' : '〔金光〕');
        if (t.dodged) segs.push('悟空一棒落空，妖身已避让');
        else {
          segs.push('悟空抡起金箍棒' + (t.cri ? '——金光暴涌·暴击' : '狠狠砸下'));
          segs[segs.length - 1] = '【' + (ai.blackMiasma ? '逆道·黑瘴' : ai.atkAttr) + '】' + segs[segs.length - 1];
          if (t.phys) segs.push('体伤 ' + t.phys);
          if (t.magic) segs.push('愿伤 ' + t.magic);
          if (t.dot) segs.push('裂伤渗入 ' + t.dot);
          if (t.counter) segs.push('妖怪反击·裂缝反弹 ' + t.counter);
          // 命痕/劫印被动命中标注（AI 实时结算，无需玩家操作）
          if (t.boosted) segs.push('〔法宝增益〕伤害已放大');
        }
      }
      if (rd.mTurn) {
        const t = rd.mTurn;
        if (t.dodged) segs.push('悟空身形一晃，避过妖击');
        else {
          segs.push('妖物反扑' + (t.cri ? '·蓄力重创' : ''));
          if (t.deal) segs.push('悟空受创 ' + t.deal);
          if (t.absorbed) segs.push('护盾挡下 ' + t.absorbed);
          if (t.reflect) segs.push('反震 ' + t.reflect);
          if (t.shieldBomb) segs.push('护盾碎裂震敌 ' + t.shieldBomb);
          // 词缀·高反伤：命中后裂缝反弹（来源标注，便于玩家归因"为何被秒"）
          if (t.counter) segs.push('〔高反伤〕妖怪反击·裂缝反弹 ' + t.counter);
        }
      }
      if (rd.resolve && rd.resolve.dots.length) {
        rd.resolve.dots.forEach((d) => segs.push((d.tgt === 'p' ? '悟空' : '妖物') + '持续〔' + d.kind + '〕 ' + d.dmg + (d.kind === '咒蚀' ? '（词缀·持续毒）' : '')));
      }
      // 词缀·封印侵蚀（亵渎）：每回合始流失气血，无视护盾
      if (rd.envDrain) segs.push('〔封印侵蚀〕妖氛锁体，气血流失 ' + rd.envDrain);
      if (rd.justEnraged) segs.push('〔狂暴〕妖目赤红——攻击暴涨，破绽更少');
      const _rl = rd.stage ? ('第' + rd.stage + '阶·第' + (rd.round || rd.gRound || '?') + '合') : ('第' + (rd.round || rd.gRound) + '合');
      parts.push(_rl + '：' + segs.join('，') + '。');
    });
    return parts;
  };

  // —— 主动操作点 · 战斗内干预 ——
  // 玩家在 atRound（操作点回合，1-based）祭出法宝后，对既算好的 roundsDetail 做确定性就地修正，
  // 使"择机祭宝"真实改变战局（打破纯回放）。法宝效果复用 TREASURES[id].effect 字段：
  //   healPct / capHeal              → 回复玩家气血（抬升 atRound 之后 pHpAfter）
  //   dmgPct / dmgFlat               → 直接削怪（下调 atRound 之后 mHpAfter）
  //   matkPct（愿伤增益）/ atkPct    → 放大 atRound 之后玩家每次出手的 deal 并据此重算 mHpAfter
  // 返回修改后的 res（同一引用），并给被干预回合打标 intervention。
  NDX.applyBattleIntervention = function (res, atRound, treasureId, playerDao) {
    const T = NDX.TREASURES && NDX.TREASURES[treasureId];
    if (!res || !T || !T.effect) return res;
    let eff = T.effect;
    const list = res.roundsDetail || [];
    const maxHp = res.maxHp || 1;
    const maxMHp = res.maxMHp || 1;
    const idx0 = Math.max(0, atRound - 1); // 0-based 起点
    if (idx0 >= list.length) return res;

    // —— V8.54 P2-1 六道协同：法宝 dao 与玩家主六道一致时，效果+25% ——
    const _pDao = playerDao || (res.playerDao) || null;
    let _daoMult = 1;
    if (_pDao && T.dao && T.dao === _pDao) { _daoMult = (NDX.TREASURE_SYN && NDX.TREASURE_SYN.daoMatch) || 1.25; }
    if (_daoMult > 1) {
      eff = Object.assign({}, eff, {
        dmgPct: (eff.dmgPct || 0) * _daoMult,
        healPct: (eff.healPct || 0) * _daoMult,
        shieldPct: (eff.shieldPct || 0) * _daoMult,
        lifestealPct: (eff.lifestealPct || 0) * _daoMult,
      });
    }

    // —— V8.54 P1-3 新效果变量 ——
    const _shieldAmt = eff.shieldPct ? Math.round(maxHp * eff.shieldPct) : 0;
    const _stunTurns = eff.stunTurns || 0;
    const _lifestealPct = eff.lifestealPct || 0;

    // —— 法宝克制（软克制）：命中 → 放大 effect + 置位 res.countered（联动识破/爆发）——
    // 沿用《法宝克制系统设计方案》：counter.tags 命中任一怪物标签即生效；
    // 命中仅放大数值，不引入新结算分支；未命中走原逻辑零回归。
    if (T.counter && res.monsterTags && T.counter.tags.some((t) => res.monsterTags.includes(t))) {
      const c = T.counter;
      eff = Object.assign({}, eff, {
        dmgPct: (eff.dmgPct || 0) * (c.dmgX || 1),
        healPct: (eff.healPct || 0) * (c.healX || 1),
      });
      res.countered = { treasureId: treasureId, tag: c.tags[0], note: c.note };
      // 联动气势：克制命中额外 +1 气势（本回合展示）
      const rd0 = list[idx0];
      if (rd0) rd0.momentum = Math.min(5, (rd0.momentum || 0) + 1);
    }

    // 1) 玩家回复（在起点回合即时生效，并抬升之后所有 pHpAfter / pTurn.hpBefore）
    let healDelta = 0;
    if (eff.capHeal) healDelta = maxHp - (list[idx0].pHpAfter || 0);
    else if (eff.healPct) healDelta = Math.round(maxHp * eff.healPct);
    if (healDelta > 0) {
      for (let i = idx0; i < list.length; i++) {
        const rd = list[i];
        if (rd.pTurn) rd.pTurn.hpBefore = Math.min(maxHp, (rd.pTurn.hpBefore || 0) + healDelta);
        rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + healDelta);
      }
    }

    // 2) 攻击增益：放大 atRound 之后每次玩家出手的 deal，并据新 deal 重算 mHpAfter
    const atkMult = 1 + (eff.matkPct || 0) + (eff.atkPct || 0);
    if (atkMult > 1) {
      for (let i = idx0; i < list.length; i++) {
        const rd = list[i];
        if (rd.pTurn && rd.pTurn.deal > 0) {
          const extra = Math.round(rd.pTurn.deal * (atkMult - 1));
          rd.pTurn.deal += extra;
          rd.pTurn.boosted = true;
          const mBefore = rd.mTurn ? (rd.mTurn.hpBefore || 0) : (rd.mHpAfter || 0);
          const mAfter = Math.max(0, mBefore - rd.pTurn.deal);
          if (rd.mTurn) rd.mTurn.hpAfter = mAfter;
          rd.mHpAfter = mAfter;
        }
      }
    }

    // 3) 直接削怪（dmgPct/dmgFlat）：在起点回合立即生效，并下拉之后所有 mHpAfter
    // —— 命痕·戾伤（hpLossBoostTreasure）：玩家已损失气血越多，法宝伤害越高（越伤越狠）——
    // V8.54 斩杀线机制：save:true 生效为"怪物血量<30%时直接斩杀"，否则基础伤害全局×0.55
    const _curMhp = list[idx0] ? (list[idx0].mHpAfter || 0) : maxMHp;
    const _isExecute = !!(eff.save) && _curMhp > 0 && _curMhp <= maxMHp * 0.30;
    let dmg;
    if (_isExecute) {
      dmg = _curMhp;
    } else {
      dmg = Math.round(maxMHp * (eff.dmgPct || 0) * 0.55) + (eff.dmgFlat || 0);
    }
    const _ffTre = res.fateFlags || {};
    if (_ffTre.hpLossBoostTreasure && _ffTre.hpLossBoostTreasure > 0 && !_isExecute) {
      const _rd0 = list[idx0];
      const _lost = (maxHp > 0 && _rd0) ? Math.max(0, 1 - (_rd0.pHpAfter || maxHp) / maxHp) : 0;
      if (_lost > 0) dmg = Math.round(dmg * (1 + _ffTre.hpLossBoostTreasure * _lost));
    }
    if (dmg > 0) {
      for (let i = idx0; i < list.length; i++) {
        const rd = list[i];
        // 起点回合：从当前 mHpAfter 扣；之后回合：从本回合 mTurn.hpBefore（已含上一拍结果）扣
        let cur = rd.mTurn ? (rd.mTurn.hpBefore || 0) : (rd.mHpAfter || 0);
        if (i === idx0) cur = rd.mHpAfter || 0;
        const after = Math.max(0, cur - dmg);
        if (rd.mTurn) rd.mTurn.hpAfter = after;
        rd.mHpAfter = after;
      }
    }
    // V8.54 P1-3 吸血：法宝伤害的 X% 转化为玩家回血
    if (_lifestealPct > 0 && dmg > 0) {
      const _lsHeal = Math.round(dmg * _lifestealPct);
      if (_lsHeal > 0) {
        for (let i = idx0; i < list.length; i++) {
          const rd = list[i];
          if (rd.pTurn) rd.pTurn.hpBefore = Math.min(maxHp, (rd.pTurn.hpBefore || 0) + _lsHeal);
          rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + _lsHeal);
        }
      }
    }
    // V8.54 P1-3 眩晕：接下来 N 回合怪物不攻击（deal=0）
    if (_stunTurns > 0) {
      for (let i = idx0; i < Math.min(list.length, idx0 + _stunTurns); i++) {
        const rd = list[i];
        if (rd.mTurn) { rd.mTurn.deal = 0; rd.mTurn.stunned = true; }
      }
    }
    // V8.54 P1-3 护盾：给玩家加护盾值，在后续回合优先吸收伤害（简化为减伤）
    if (_shieldAmt > 0) {
      let _shieldLeft = _shieldAmt;
      for (let i = idx0; i < list.length && _shieldLeft > 0; i++) {
        const rd = list[i];
        if (rd.mTurn && rd.mTurn.deal > 0) {
          const _absorb = Math.min(_shieldLeft, rd.mTurn.deal);
          rd.mTurn.deal -= _absorb;
          rd.mTurn.shieldAbsorb = _absorb;
          _shieldLeft -= _absorb;
          // 重算玩家血量
          if (rd.mTurn.hpAfter != null) rd.mTurn.hpAfter = Math.min(maxHp, (rd.mTurn.hpAfter || 0) + _absorb);
          rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + _absorb);
        }
      }
    }

    // 4) 打标被干预回合，并重算顶层胜负
    list[idx0].intervention = { treasureId: treasureId, name: T.name };
    res.monsterHpLeft = list.length ? list[list.length - 1].mHpAfter : res.monsterHpLeft;
    res.playerHpLeft = list.length ? Math.min(maxHp, list[list.length - 1].pHpAfter) : res.playerHpLeft;
    // 若干预后怪物提前归零，截断后续回合并判胜
    let killAt = -1;
    for (let i = idx0; i < list.length; i++) {
      if (list[i].mHpAfter <= 0) { killAt = i; break; }
    }
    if (killAt >= 0) {
      res.roundsDetail = list.slice(0, killAt + 1);
      res.total = res.roundsDetail.length;
      res.win = res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    } else {
      res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    }
    return res;
  };

  // V8.50 法宝克制·解厄：清除指定玩家 debuff 并修补后续回合（与 applyBattleIntervention 同构）
  // 致盲/怯战被清除的回合：还原该玩家攻击真实伤害，重算怪物血量与胜负
  NDX.applyBattleCleanse = function (res, atRound, types) {
    if (!res || !res.roundsDetail || !types || !types.length) return res;
    const list = res.roundsDetail;
    const idx0 = Math.max(0, atRound - 1);
    if (idx0 >= list.length) return res;
    for (let i = idx0; i < list.length; i++) {
      const rd = list[i];
      if (rd.pDebuffs) {
        if (types.indexOf('all') >= 0) { for (const _k in rd.pDebuffs) delete rd.pDebuffs[_k]; }
        else types.forEach((t) => { if (rd.pDebuffs[t]) delete rd.pDebuffs[t]; });
      }
      if (rd.pTurn && rd.pTurn.realDeal != null) {
        const pt = rd.pTurn;
        // 还原条件：本回合造成「落空 / 减攻」的 debuff 正是本次被解除的那一类。
        // 新快照带 pdbMiss/pdbAtk 精确类型；旧快照（仅有布尔）退回 blind/atkDown 兼容判定。
        const _hasTyped = (pt.pdbMiss != null) || (pt.pdbAtk != null);
        const _cleared = _hasTyped
          ? ((pt.pdbMiss && (types.indexOf('all') >= 0 || types.indexOf(pt.pdbMiss) >= 0)) || (pt.pdbAtk && (types.indexOf('all') >= 0 || types.indexOf(pt.pdbAtk) >= 0)))
          : ((pt.blindMiss && (types.indexOf('all') >= 0 || types.indexOf('blind') >= 0)) || (pt.atkDown && (types.indexOf('all') >= 0 || types.indexOf('atkDown') >= 0)));
        if (_cleared) {
          const real = pt.realDeal;
          pt.deal = real; pt.phys = real; pt.magic = 0;
          pt.blindMiss = false; pt.atkDown = false;
          pt.pdbMiss = null; pt.pdbAtk = null;
          const mBefore = rd.mTurn ? (rd.mTurn.hpBefore || 0) : (rd.mHpAfter || 0);
          const mAfter = Math.max(0, mBefore - real);
          if (rd.mTurn) rd.mTurn.hpAfter = mAfter;
          rd.mHpAfter = mAfter;
        }
      }
    }
    res.monsterHpLeft = list.length ? list[list.length - 1].mHpAfter : res.monsterHpLeft;
    res.playerHpLeft = list.length ? Math.min((res.maxHp || 1), list[list.length - 1].pHpAfter) : res.playerHpLeft;
    let killAt = -1;
    for (let i = idx0; i < list.length; i++) { if (list[i].mHpAfter <= 0) { killAt = i; break; } }
    if (killAt >= 0) {
      res.roundsDetail = list.slice(0, killAt + 1);
      res.total = res.roundsDetail.length;
      res.win = res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    } else {
      res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    }
    return res;
  };

  // —— 回合识破 · 结算 ——
  // 在 telegraph 回合（识破窗口）玩家选择"识破"：反制蓄力重击。
  // 1) 本回合 mTurn.deal 归零（重击被格挡，玩家不掉血）
  // 2) 追加反制伤害（玩家双攻 ×0.8；本场克制命中 ×1.5）
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
    const base = (res._playerAtk || 0) + (res._playerMatk || 0);
    const burstDmg = Math.round(base * BURST_X[tier] * (res.countered ? 1.5 : 1));
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
    rd.intervention = Object.assign({}, rd.intervention || {}, { burst: true, burstTier: tier, burstDmg: burstDmg });
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

  // —— 连招 / 暴击链系统（V8.46）——
  // 基础攻击链：连续基础攻击（atk / chant，手动与自动均生效）每 N 次触发一次暴击；
  //   手动受 2s 窗口约束（超时中断连段），自动不受时间约束（AI 即时出手，连续命中即累积）。
  // 手动风格串联（combo→burst→pierce）保留为手操深度奖励，仅限玩家手动指定 atk 风格时累计（见 game.js.resolveManualActive）。
  // 数值真源集中此处，game.js 仅调用纯函数施加倍率，避免散落补丁。
  NDX.COMBO_BASIC_EVERY = 3;        // 每 N 次连续基础攻击触发一次暴击
  NDX.COMBO_BASIC_CRIT_MUL = 1.5;   // 基础攻击链暴击倍率
  NDX.COMBO_BASIC_WINDOW = 2000;    // 手动连段窗口（ms）；超过则连段计数中断
  // 基础攻击链步进：原地 mutate p.comboBasic / p.comboBasicLastTime / p.comboStreak，返回 { mul, crit, tier }
  // V8.47 连段分层递增：累计连击 3/6/9 各升一档（武斗家式），与「每 N 次必暴」同源共存。
  NDX.comboBasicStep = function (p, isManual, now) {
    p = p || {};
    p.comboBasic = p.comboBasic || 0;
    p.comboBasicLastTime = p.comboBasicLastTime || 0;
    p.comboStreak = p.comboStreak || 0;
    if (isManual && p.comboBasicLastTime && (now - p.comboBasicLastTime) > (NDX.COMBO_BASIC_WINDOW || 2000)) {
      p.comboBasic = 0; p.comboStreak = 0; // 手动超时，连段中断
    }
    p.comboBasicLastTime = now;
    p.comboBasic += 1; p.comboStreak += 1;
    const every = NDX.COMBO_BASIC_EVERY || 3;
    let mul = 1, crit = false, tier = 0;
    if (p.comboBasic >= every) { mul = NDX.COMBO_BASIC_CRIT_MUL || 1.5; crit = true; } // 每 N 次必暴（基础档）
    // 连段分层递增：累计连击 3/6/9 各升一档（与基础必暴叠加取高）
    if (p.comboStreak >= 9) { tier = 3; mul = Math.max(mul, 2.2); crit = true; }
    else if (p.comboStreak === 6) { tier = 2; mul = Math.max(mul, 1.8); crit = true; }
    else if (p.comboStreak === 3) { tier = 1; mul = Math.max(mul, 1.5); crit = true; }
    if (p.comboBasic >= every) p.comboBasic = 0; // 基础计数重置开启下一组（累计连击数保留以计档）
    return { mul: mul, crit: crit, tier: tier };
  };
  NDX.COMBO_CHAIN_MUL = 1.25;     // 三式有序衔接（combo→burst→pierce）串联倍率（手操深度）
  // 连招链串联判定：链尾出现有序 [combo, burst, pierce] 子串则触发（仅手动风格攻击累计）
  NDX.comboChainBonus = function (chain) {
    if (!Array.isArray(chain) || chain.length < 3) return { mul: 1, triggered: false };
    const n = chain.length;
    if (chain[n - 3] === 'combo' && chain[n - 2] === 'burst' && chain[n - 1] === 'pierce') {
      return { mul: NDX.COMBO_CHAIN_MUL || 1.25, triggered: true };
    }
    return { mul: 1, triggered: false };
  };

  // —— V8.47 战斗完善：状态 / 连招扩展模块（数值真源集中此处，game.js 仅调用纯函数）——
  // 放弃六道相克（用户决策）。保留并新增：状态堆叠协同、通用易伤/标记、连段分层递增(V8.47)、
  // 搓招序列奥义、怪物叠甲(减伤)+Boss控制免疫、状态 UI 角标、气势-连招联动、冻结/沉默、
  // 宠物连招协同、夺盾反转。所有倍率/层数常量定义于此，禁止散落补丁。
  NDX.DEBUFF_DEFS = {
    vuln:   { name: '易伤', icon: '🩸', kind: 'debuff' },
    mark:   { name: '标记', icon: '🎯', kind: 'debuff' },
    frozen: { name: '冻结', icon: '❄', kind: 'debuff' },
    silence: { name: '沉默', icon: '🔇', kind: 'debuff' }
  };
  // —— 玩家侧 debuff（Boss 招牌 debuff 体系，V8.50 法宝克制）——
  NDX.PDEBUFF_DEFS = {
    blind:   { name: '致盲', icon: '🌪', kind: 'debuff', desc: '黄风怪·三昧神风：英雄攻击 80% 几率落空' },
    atkDown: { name: '怯战', icon: '🛡', kind: 'debuff', desc: '白骨精·尸气化盾：玩家攻击 -80%' },
    burn:    { name: '灼烧', icon: '🔥', kind: 'debuff', desc: '红孩儿·三昧真火：每回合持续灼伤' },
    daze:    { name: '摄魂', icon: '🌀', kind: 'debuff', desc: '妖法摄魂：英雄攻击 45% 几率落空' },
    frost:   { name: '寒封', icon: '❄', kind: 'debuff', desc: '寒气封体：玩家攻击 -50%，每回合冻伤' },
    curse:   { name: '咒缚', icon: '💀', kind: 'debuff', desc: '咒缚缠身：玩家攻击 -65%，每回合气血流逝' },
    poison:  { name: '毒蚀', icon: '🐍', kind: 'debuff', desc: '剧毒蚀骨：玩家攻击 -25%，每回合中毒' },
    weak:    { name: '蚀骨', icon: '🦴', kind: 'debuff', desc: '骨蚀筋软：玩家攻击 -40%' },
  };

  // V9.6 法宝·on-hit（西游释厄传名器）：怪物侧 debuff 词库（单一真源，新增只登记不写逻辑）
  NDX.MDEBUFF_DEFS = {
    shrink:   { name: '变小', icon: '🤏', kind: 'debuff', desc: '紫金红葫芦：怪物造成伤害大幅下降' },
    slow:     { name: '迟缓', icon: '🐌', kind: 'debuff', desc: '飞龙宝杖：怪物攻击减弱' },
    burned:   { name: '灼烧', icon: '🔥', kind: 'debuff', desc: '芭蕉扇：每回合流失气血' },
    silenced: { name: '沉默', icon: '🔇', kind: 'debuff', desc: '九环锡杖：怪物技能被禁' },
  };
  // V9.9 加持·请菩萨：持 blessTreasure 临战赐福，弱化妖物（三模式第三档）
  //   与 破除(cleanse 解厄) / 破韧(breakWith) 鼎足——困难→正常→加持 三档递进。
  //   dmgMul：妖物全伤害输出乘算（恐惧/收妖即降妖物输出）；cleanseGimmick：自动破除其伪相 gimmick。
  NDX.BLESS_EFFECTS = {
    feilong_zhang:   { dmgMul: 0.80, label: '飞龙宝杖·恐惧：妖物伤害-20%' },
    jiuhuan_zhang:   { dmgMul: 0.80, label: '九环锡杖·禁言：妖物伤害大减' },
    zijin_honghulu:  { dmgMul: 0.80, label: '紫金红葫芦·收妖：妖物伤害大减' },
    baojiao:         { dmgMul: 0.85, label: '芭蕉扇·烈焰：妖物每回合灼伤' },
    ts_jingping:     { dmgMul: 0.85, cleanseGimmick: true, label: '观音玉净瓶·慈悲：清负面+压制妖术' },
    bf_wuzizhenjing: { dmgMul: 0.80, label: '无字真经·空相：妖物失序' },
  };
  // 玩家是否持有某法宝（在法宝栏内、有充能）——加持/跳形态钩子的持有判定
  NDX.playerHoldsTreasure = function (s, id) {
    if (!s || !id) return false;
    const eqs = (s.equips || []).filter((e) => {
      const T = NDX.TREASURES && NDX.TREASURES[e.treasureId];
      return e.treasureId === id && T && (e.chargesLeft == null || e.chargesLeft > 0);
    });
    return eqs.length > 0;
  };
  NDX.treasureName = function (id) {
    const T = NDX.TREASURES && NDX.TREASURES[id];
    return (T && T.name) || id;
  };
  // V9.9 装备五档（白绿蓝红金，镜像劫印五档）：给玩家「成就感台阶」
  //   不重写 setTier 合成经济——tier 由现有 quality/setTier/chapter 派生，display 用 color。
  //   章末 Boss 必掉阶梯核心物（掉落 tier 下限见 bossDropTierFloor），令每次通关都有可见战力台阶。
  NDX.EQUIP_TIERS = [
    { key: 'white', name: '白装', color: '#cfd8dc', layer: 1 },
    { key: 'green', name: '绿装', color: '#4caf50', layer: 2 },
    { key: 'blue',  name: '蓝装', color: '#42a5f5', layer: 3 },
    { key: 'red',   name: '红装', color: '#ef5350', layer: 4 },
    { key: 'gold',  name: '金装', color: '#ffca28', layer: 5 },
  ];
  // 装备 → 五档颜色键（派生，零合成风险）
  NDX.equipTierOf = function (eq) {
    if (!eq) return 'white';
    const st = eq.setTier || 0;       // 1=基座 2=成品 3+=高阶
    const q = (eq.quality != null) ? eq.quality : 0;
    const ch = eq.chapter || 1;
    if (st >= 4 || q >= 3) return 'gold';
    if (st >= 3 || q >= 2) return 'red';
    if (st >= 2 || q >= 1) return 'blue';
    return ch >= 3 ? 'green' : 'white';
  };
  // Boss 掉落 tier 下限（保证「每章必掉阶梯核心」的成就感台阶）
  NDX.bossDropTierFloor = function (s, isChapterEnd) {
    const act = (s && s.act) || 1;
    if (isChapterEnd) {
      if (act >= 14) return 'gold';   // 后段章末必掉金
      if (act >= 10) return 'red';    // 中段章末必掉红
      if (act >= 4)  return 'blue';   // 前段章末必掉蓝
      return 'green';
    }
    return act >= 8 ? 'red' : 'blue'; // 章中事件妖怪 Boss（车迟/黄袍/蝎子…）：二阶蓝、三阶红
  };
  // V9.6 on-hit 触发表现层标签（单一真源：效果键 → 飘字文案/图标，供 main.js 出飘字）
  NDX.ONHIT_FX_LABELS = [
    ['stun', '晕眩', '💫'],
    ['silence', '沉默', '🔇'],
    ['shrink', '收妖·变小', '🤏'],
    ['slow', '迟缓', '🐌'],
    ['burn', '灼烧', '🔥'],
    ['trueDmg', '圣伤', '✨'],
    ['lifesteal', '夺元', '🩸'],
    ['reflect', '反震', '🌀'],
  ];
  // V9.6 法宝·on-hit 结算：普攻命中按概率触发削弱/控制/灼烧，纯数据驱动，复用 applyBattleIntervention 的
  // res.roundsDetail 就地修正范式（演出与结算一致）。零新战斗内核，仅扩展入参。
  //   onHit: { proc, shrink, slow, stun, silence, burn, reflect, lifesteal, trueDmg, dur, dao }
  //   结算点：calcCombat 之后由 game_combat_1.js 在"法宝栏内被动法宝"上调用（与 applyJinguProc 同思路）。
  // V9.6 法宝协同真源（单一事实来源）：on-hit 命中时按「六道同源 × 经文共鸣」放大触发概率与效果强度。
  //   daoMatch   六道同源——法宝道途 === 玩家主道途（祭宝与 on-hit 共用此系数）
  //   sutraMatch 经文共鸣——玩家持「同道全本经文」，该道法宝威力再增（经文喂法宝，形成正向循环）
  //   sutraProc  经文共鸣额外触发概率（加法；总概率仍受 procCap 封顶，防滚雪球）
  //   数值 [已调优]（2026-09-14）：daoMatch1.25/sutraMatch1.15/sutraProc0.06/procCap0.35 已被门禁
  //     _verify_treasure_synergy 写死在断言（A1~A5/B1~B7/F1 + 内置兜底双处同值），不得改动。复核：sutraMatch +15%
  //     落在复合联动 10~20% 区间；daoMatch +25% 略高，但 procCap0.35 封顶 + Boss 豁免 shrink/silence 仅 2 回合，
  //     已堵滚雪球，设计自洽，确认保持原值。
  NDX.TREASURE_SYN = {
    daoMatch: 1.25,
    sutraMatch: 1.15,
    sutraProc: 0.06,
    procCap: 0.35,
  };
  NDX.applyTreasureOnHit = function (res, onHitList, ctx) {
    if (!res || !res.roundsDetail || !onHitList || !onHitList.length) return res;
    const list = res.roundsDetail;
    const maxHp = res.maxHp || 1;
    const maxMHp = res.maxMHp || 1;
    const boss = !!(ctx && ctx.boss);
    const pDao = (ctx && ctx.playerDao) || null;
    const sealMechs = (ctx && ctx.sealMechs) || [];
    const sutraDaos = (ctx && ctx.sutraDaos) || [];   // V9.6 玩家所持全本经文的道途集合（法宝×经文耦合入参）
    const SYN = NDX.TREASURE_SYN || { daoMatch: 1.25, sutraMatch: 1.15, sutraProc: 0.06, procCap: 0.35 };
    const SHRINK_FLOOR = 0.30; // 减伤类下限：怪物伤害最低保留 30%（变小/迟缓不归零，避免 Boss 变木桩）
    const _hasSeal = function (mech) { return sealMechs.indexOf(mech) >= 0; };
    const _bossDur = function (n) { return boss ? Math.min(2, n) : n; };
    const N = list.length;
    const origMHp = list.map(function (rd) { return rd.mHpAfter || 0; });
    // 先收集、后一次性结算：避免“同击/窗口内逐回合重掷”造成的重复叠乘
    const red = [], ctrl = [], flag = [], mLoss = [], bTick = [];
    for (let j = 0; j < N; j++) { red[j] = 1; ctrl[j] = 0; flag[j] = {}; mLoss[j] = 0; bTick[j] = 0; }
    for (let i = 0; i < N; i++) {
      const rd = list[i];
      if (!rd.pTurn || rd.pTurn.deal <= 0) continue; // 仅“普攻命中”回合触发
      let procsThisRound = 0;
      for (let k = 0; k < onHitList.length; k++) {
        const H = onHitList[k];
        if (!H || !H.proc) continue;
        if (procsThisRound >= 2) break; // 同击多件 on-hit 合并封顶（防滚雪球）
        // V9.6 协同：六道同源 × 经文共鸣（经文与法宝同道 → 威力再增，见 NDX.TREASURE_SYN）
        const _daoHit = !!(pDao && H.dao && H.dao === pDao);
        const _sutraHit = !!(H.dao && sutraDaos.indexOf(H.dao) >= 0);
        const _syn = (_daoHit ? SYN.daoMatch : 1) * (_sutraHit ? SYN.sutraMatch : 1);
        const proc = Math.min(SYN.procCap, H.proc * _syn + (_sutraHit ? SYN.sutraProc : 0));
        if (Math.random() >= proc) continue;
        procsThisRound++;
        // V9.6 表现层回执：记录本次触发，供 main.js 出飘字（与 d.jinguProc 同范式，读 roundsDetail）
        {
          const _mk = NDX.ONHIT_FX_LABELS.find(function (L) { return H[L[0]]; });
          if (_mk) {
            if (!rd.onHitFx) rd.onHitFx = [];
            rd.onHitFx.push({ tid: H._tid || null, name: H._name || '', kind: _mk[0], label: _mk[1], icon: _mk[2], syn: _sutraHit ? 'sutra' : (_daoHit ? 'dao' : '') });
          }
        }
        // shrink / slow / reflect：削减怪物 dur 回合内伤害（多源取最小乘数=最强）
        if (H.shrink || H.slow || H.reflect) {
          const mag = Math.min(0.70, (H.shrink || H.slow || H.reflect) * _syn);
          const e = Math.min(N, i + (H.dur || 2));
          for (let j = i; j < e; j++) {
            red[j] = Math.min(red[j], 1 - mag);
            if (H.shrink) flag[j].shrunk = true;
            if (H.slow) flag[j].slowed = true;
            if (H.reflect) flag[j].reflected = true;
          }
        }
        // stun / silence：控制（眩晕伤害归零 / 沉默减半）
        if (H.stun || H.silence) {
          const turns = _bossDur(H.stun || H.silence);
          const e = Math.min(N, i + turns);
          for (let j = i; j < e; j++) {
            red[j] = Math.min(red[j], H.silence ? 0.5 : 0);
            ctrl[j] = Math.max(ctrl[j], H.silence ? 1 : 2);
            if (H.stun) flag[j].stunned = true;
            if (H.silence) flag[j].silenced = true;
            if (H.stun && _hasSeal('critBreakShield')) flag[j].shieldBreak = true; // 劫印协同·齐天
          }
        }
        // burn：怪物每回合流失气血（DoT，按回合累积推进）
        if (H.burn) {
          const dmg = Math.max(1, Math.round(maxMHp * H.burn * _syn));
          const e = Math.min(N, i + (H.dur || 2));
          for (let j = i; j < e; j++) { bTick[j] += dmg; flag[j].burned = true; }
        }
        // trueDmg：此次伤害按比例转为对怪真伤
        if (H.trueDmg) {
          const td = Math.max(1, Math.round((rd.pTurn.deal || 0) * H.trueDmg * _syn));
          mLoss[i] += td; flag[i].trueDmg = true;
        }
        // lifesteal：此次伤害按比例回血
        if (H.lifesteal) {
          const heal = Math.round((rd.pTurn.deal || 0) * H.lifesteal * _syn);
          if (heal > 0) {
            rd.pTurn.hpBefore = Math.min(maxHp, (rd.pTurn.hpBefore || 0) + heal);
            rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + heal);
          }
        }
      }
    }
    // 一次性结算：减伤/控制（玩家因此少受→回补），仅减伤类保留地板、控制类可归零
    for (let j = 0; j < N; j++) {
      const rd = list[j];
      if (!rd.mTurn) continue;
      const before = rd.mTurn.deal || 0;
      if (before <= 0) continue;
      let mult = red[j];
      if (mult < 1 && ctrl[j] === 0) mult = Math.max(SHRINK_FLOOR, mult);
      const after = Math.max(0, Math.round(before * mult));
      const delta = before - after;
      rd.mTurn.deal = after;
      const f = flag[j];
      if (f.shrunk) rd.mTurn.shrunk = true;
      if (f.slowed) rd.mTurn.slowed = true;
      if (f.reflected) rd.mTurn.reflected = true;
      if (f.stunned) rd.mTurn.stunned = true;
      if (f.silenced) rd.mTurn.silenced = true;
      if (f.shieldBreak) rd.mTurn.shieldBreak = true;
      if (delta > 0) rd.pHpAfter = Math.min(maxHp, (rd.pHpAfter || 0) + delta);
    }
    // 一次性结算：怪物额外损血（trueDmg + burn），按回合累积推进，保持 mHpAfter 单调递减
    let cum = 0;
    for (let j = 0; j < N; j++) {
      cum += (mLoss[j] || 0) + (bTick[j] || 0);
      const rd = list[j];
      if (cum > 0) {
        const hp = Math.max(0, origMHp[j] - cum);
        rd.mHpAfter = hp;
        if (rd.mTurn) rd.mTurn.hpAfter = hp;
      }
      if (flag[j].burned && rd.mTurn) rd.mTurn.burned = true;
      if (flag[j].trueDmg && rd.mTurn) rd.mTurn.trueDmg = true;
    }
    // 重算顶层血量（与 applyBattleIntervention 同构）
    res.monsterHpLeft = N ? list[N - 1].mHpAfter : res.monsterHpLeft;
    res.playerHpLeft = N ? Math.min(maxHp, list[N - 1].pHpAfter) : res.playerHpLeft;
    let killAt = -1;
    for (let i = 0; i < N; i++) { if (list[i].mHpAfter <= 0) { killAt = i; break; } }
    if (killAt >= 0) {
      res.roundsDetail = list.slice(0, killAt + 1);
      res.total = res.roundsDetail.length;
      res.win = res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    } else {
      res.win = res.monsterHpLeft <= 0 && res.playerHpLeft > 0;
      res.lose = res.playerHpLeft <= 0;
    }
    return res;
  };
  // V8.50 玩家侧 debuff 惩罚参数表（单一真源）
  //   新增 debuff 只在此登记，playerAttack 与 applyBattleCleanse 均通用结算，无需改逻辑。
  // 落空型：MISS[类型] = 落空概率（同时生效时取最高者）
  NDX.PDB_MISS = { blind: 0.80, daze: 0.45 };
  // 减攻型：ATKMUL[类型] = 攻击乘数（同时生效时取最小者，即最强惩罚）
  NDX.PDB_ATKMUL = { atkDown: 0.20, frost: 0.50, curse: 0.35, poison: 0.75, weak: 0.60 };
  // 持续伤害型：DOT[类型] = { pctMaxHp 最大气血占比, atkMul 怪物攻击系数, flat 保底伤害, kind 伤害显示名 }
  NDX.PDB_DOT = {
    burn:   { pctMaxHp: 0.04, atkMul: 0.10, flat: 8, kind: '灼烧' },
    frost:  { pctMaxHp: 0.02, atkMul: 0.00, flat: 6, kind: '冻伤' },
    curse:  { pctMaxHp: 0.03, atkMul: 0.04, flat: 8, kind: '咒蚀' },
    poison: { pctMaxHp: 0.03, atkMul: 0.02, flat: 6, kind: '中毒' },
  };
  // 反查：能解除该 debuff 的法宝名（真源为 equipment.js 的 TREASURES[id].effect.cleanse）
  NDX.pdebuffCleanseTreasure = function (type) {
    if (!type) return null;
    const T = NDX.TREASURES || {};
    const ids = Object.keys(T);
    for (let i = 0; i < ids.length; i++) {
      const c = T[ids[i]] && T[ids[i]].effect && T[ids[i]].effect.cleanse;
      if (c && c.indexOf(type) >= 0) return T[ids[i]].name || ids[i];
    }
    return null;
  };
  // Boss 招牌 debuff 映射：按怪物名（含子串）解析；返回 { type, dur, applyAtStart, reapplyEvery }
  // V8.50 Boss 招牌 debuff 映射表（数据驱动，按序匹配名字子串，先命中先得）
  //   行格式：[名字子串, debuff 类型, 持续回合, 复挂周期]
  //   克制法宝**不在此登记** —— 真源是 equipment.js 的 TREASURES[id].effect.cleanse，
  //   反查统一走 NDX.pdebuffCleanseTreasure(type)，避免两处维护。
  NDX._BOSS_DEBUFF_MAP = [
    // —— 致盲 blind：风沙迷眼 / 金翅遮天 ——
    ['黄风', 'blind', 3, 4], ['大鹏', 'blind', 3, 4],
    // —— 怯战 atkDown：攻势受挫（尸气化盾 / 兵器被套 / 盗兵）——
    ['白骨', 'atkDown', 3, 4], ['黄狮', 'atkDown', 3, 4],
    ['青牛', 'atkDown', 3, 4], ['高老招亲', 'atkDown', 3, 4],
    // —— 灼烧 burn：三昧真火 / 火焰山 ——
    ['红孩', 'burn', 3, 3], ['牛魔', 'burn', 3, 3], ['铁扇', 'burn', 3, 3], ['老君', 'burn', 3, 3],
    // —— 摄魂 daze：妖法迷魂 / 真假难辨 / 葫芦收人 ——
    ['奎木狼', 'daze', 3, 4], ['黄袍', 'daze', 3, 4],
    ['六耳', 'daze', 3, 4], ['玉兔', 'daze', 3, 4], ['金角', 'daze', 3, 4], ['金蝉脱壳', 'daze', 3, 4],
    // —— 寒封 frost：涧水 / 河冰浸寒 ——
    ['白龙', 'frost', 3, 4], ['灵感', 'frost', 3, 4], ['金鱼', 'frost', 3, 4],
    ['老鼋', 'frost', 3, 4], ['通天河', 'frost', 3, 4],
    // —— 咒缚 curse：骷髅咒怨 / 心魔缠身 ——
    ['沙僧', 'curse', 3, 4], ['大圣残躯', 'curse', 3, 4],
    ['乌巢', 'curse', 3, 4], ['镇元', 'curse', 3, 4], ['五行归墟', 'curse', 3, 4],
    // —— 毒蚀 poison：倒马毒桩 / 虫毒 ——
    ['蝎子', 'poison', 3, 3], ['九头', 'poison', 3, 3],
    // —— 蚀骨 weak：刀伤断骨 / 雷法削骨 ——
    ['刘洪', 'weak', 3, 4], ['车迟', 'weak', 3, 4],
    ['青毛狮', 'weak', 3, 4], ['狮驼', 'weak', 3, 4], ['白鹿', 'weak', 3, 4],
  ];
  NDX._bossDebuffSpec = function (nameOrMon) {
    const m = (nameOrMon && typeof nameOrMon === 'object') ? nameOrMon : null;
    if (m && m.skipGimmick) return null; // 跳形态：持 phaseSkipOn 自动破除伪相，不挂 gimmick（白骨照妖镜跳过人形态怯战）
    const name = m ? m.name : nameOrMon;
    if (!name) return null;
    const n = String(name);
    const M = NDX._BOSS_DEBUFF_MAP || [];
    for (let i = 0; i < M.length; i++) {
      if (n.indexOf(M[i][0]) >= 0) {
        return { type: M[i][1], dur: M[i][2] || 3, applyAtStart: true, reapplyEvery: M[i][3] || 4 };
      }
    }
    return null;
  };
  NDX.BUFF_DEFS = { armor: { name: '叠甲', icon: '🛡', kind: 'buff' } };
  NDX.CFX_QIAO_SEQ = ['atk', 'atk', 'chant']; // 搓招：攻击·攻击·诵经 → 蓄力奥义
  NDX.CFX_QIAO_MUL = 2.5;                     // 奥义倍率
  NDX.CFX_SYNERGY_MUL = 1.15;                 // 状态堆叠协同（≥2 种 debuff）
  NDX.CFX_VULN_MUL = 1.25;                    // 易伤
  NDX.CFX_MARK_STEP = 0.08;                   // 标记每栈 +8%
  NDX.CFX_MARK_CAP = 5;
  NDX.CFX_FROZEN_MUL = 1.20;                  // 冻结
  NDX.CFX_SILENCE_MUL = 1.15;                 // 沉默
  NDX.CFX_ARMOR_STEP = 0.06;                  // 怪物叠甲每层减伤 6%
  NDX.CFX_ARMOR_CAP = 5;
  NDX.CFX_PET_SYN = 12;                       // 宠物连招协同追加真伤
  NDX.CFX_SHIELD_REV_STEP = 0.3;              // 夺盾反转反射系数（×每层甲）

  // 战斗状态初始化（挂于 pending.combatFx，随每场战斗重置）
  NDX.cfxInit = function (monster) {
    return {
      vuln: 0, mark: 0, frozen: 0, silence: 0, armor: 0,
      seq: [], qiaoReady: false,
      bossControlImmune: !!(monster && monster.boss),
      mMaxHp: (monster && (monster.maxHp || monster.hp)) || 1
    };
  };
  // 怪物当前生效的 debuff 种类数（用于状态堆叠协同；叠甲为怪物自身增益，不计）
  NDX.cfxMonsterDebuffCount = function (fx) {
    fx = fx || {}; let c = 0;
    if ((fx.vuln || 0) > 0) c++;
    if ((fx.mark || 0) > 0) c++;
    if ((fx.frozen || 0) > 0) c++;
    if ((fx.silence || 0) > 0) c++;
    return c;
  };
  // 施加 debuff：控制类（冻结/沉默）对 Boss 免疫；返回日志文案或 null
  NDX.cfxApplyDebuff = function (fx, type, amt) {
    fx = fx || {};
    if ((type === 'frozen' || type === 'silence') && fx.bossControlImmune) return null;
    if (type === 'vuln') { fx.vuln = (fx.vuln || 0) + (amt || 3); return '【易伤】透骨穿刺破防，妖物受到伤害 +25%（' + fx.vuln + ' 回合）'; }
    if (type === 'mark') { fx.mark = Math.min(NDX.CFX_MARK_CAP, (fx.mark || 0) + (amt || 1)); return '【标记】业火灼印，妖物受到伤害 +' + (fx.mark * NDX.CFX_MARK_STEP * 100) + '%'; }
    if (type === 'frozen') { fx.frozen = (fx.frozen || 0) + (amt || 1); return '【冻结】凝滞封脉，妖物受到伤害 +20%（Boss 免疫）'; }
    if (type === 'silence') { fx.silence = (fx.silence || 0) + (amt || 1); return '【沉默】封其妖术，妖物受到伤害 +15%（Boss 免疫）'; }
    return null;
  };
  // 综合进攻倍率：状态堆叠协同 + 易伤 + 标记 + 冻结 + 沉默 - 怪物叠甲（减伤）
  NDX.cfxOffenseMul = function (fx) {
    fx = fx || {};
    let mul = 1; const parts = [];
    const dc = NDX.cfxMonsterDebuffCount ? NDX.cfxMonsterDebuffCount(fx) : 0;
    if (dc >= 2) { mul *= NDX.CFX_SYNERGY_MUL; parts.push('·状态协同×' + NDX.CFX_SYNERGY_MUL); }
    if ((fx.vuln || 0) > 0) { mul *= NDX.CFX_VULN_MUL; parts.push('·易伤×' + NDX.CFX_VULN_MUL); }
    if ((fx.mark || 0) > 0) { const m = 1 + Math.min(NDX.CFX_MARK_CAP, fx.mark) * NDX.CFX_MARK_STEP; mul *= m; parts.push('·标记×' + m.toFixed(2)); }
    if ((fx.frozen || 0) > 0) { mul *= NDX.CFX_FROZEN_MUL; parts.push('·冻结×' + NDX.CFX_FROZEN_MUL); }
    if ((fx.silence || 0) > 0) { mul *= NDX.CFX_SILENCE_MUL; parts.push('·沉默×' + NDX.CFX_SILENCE_MUL); }
    if ((fx.armor || 0) > 0) { const a = 1 - Math.min(NDX.CFX_ARMOR_CAP, fx.armor) * NDX.CFX_ARMOR_STEP; mul *= a; parts.push('·叠甲×' + a.toFixed(2)); }
    return { mul: mul, parts: parts };
  };
  // 搓招序列：推入本次输入，检测 atk→atk→chant 并置奥义就绪
  NDX.cfxQiaoStep = function (p, kind) {
    p = p || {}; const fx = p.combatFx || {}; p.combatFx = fx;
    fx.seq = fx.seq || [];
    fx.seq.push(kind); if (fx.seq.length > 4) fx.seq.shift();
    const L = fx.seq.length, S = NDX.CFX_QIAO_SEQ;
    if (L >= 3 && fx.seq[L - 3] === S[0] && fx.seq[L - 2] === S[1] && fx.seq[L - 1] === S[2]) {
      fx.qiaoReady = true; fx.seq = []; return { qiaoReady: true };
    }
    return { qiaoReady: !!fx.qiaoReady };
  };
  // 怪物叠甲累积：怪物血量尚足时每次玩家行动 +1（封顶），营造"速破 or 久战变硬"张力
  NDX.cfxMonsterArmorTick = function (fx, hpRatio) {
    fx = fx || {}; if (hpRatio == null) hpRatio = 1;
    if (hpRatio > 0.6 && (fx.armor || 0) < NDX.CFX_ARMOR_CAP) fx.armor = (fx.armor || 0) + 1;
  };
  // 计时类 debuff 衰减（每次玩家行动后调用）
  NDX.cfxTickDown = function (fx) {
    fx = fx || {};
    if ((fx.vuln || 0) > 0) fx.vuln -= 1;
    if ((fx.frozen || 0) > 0) fx.frozen -= 1;
    if ((fx.silence || 0) > 0) fx.silence -= 1;
  };
  // 气势-连招联动：连击暴击时为后续回合积攒气势（与 MOMENTUM 阈值同口径）
  NDX.cfxBumpMomentum = function (res, fromIdx, n) {
    if (!res || !res.roundsDetail) return;
    const MAX = 5;
    for (let i = Math.max(0, fromIdx); i < res.roundsDetail.length; i++) {
      const rd = res.roundsDetail[i]; if (!rd) continue;
      rd.momentum = Math.min(MAX, (rd.momentum || 0) + n);
      rd.momentumTier = (rd.momentum >= 5 ? 3 : rd.momentum >= 3 ? 2 : rd.momentum >= 1 ? 1 : 0);
    }
  };
  // 宠物连招协同：玩家连击暴击时灵宠追加小额真伤（仅当本局携带灵宠）
  NDX.cfxPetSynergy = function (s) {
    if (!s || !s.pet) return 0;
    return NDX.CFX_PET_SYN || 12;
  };

  // —— 三键主动技能（activeSkill / applyHeroKeyFeel / applyActiveIntervention）——
  // 2026-09-09 已拆分至 js/combat_active.js（单一真源）；V9.6 清理此处重复定义的拆分残留。

  NDX.combatReady = true;

})();
