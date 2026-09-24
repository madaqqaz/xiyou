// ============================================================
// combat_squad.js — 多怪编队战斗结算（V9.31 · V9.36 从怪状态化 · V9.38 按顺序依次行动 · V9.39 逐怪独立层数 · V9.41 逐层独立计时）
//   入口：NDX.calcCombatSquad(player, squad, opts)
//   语义：squad = [主怪, 从怪...]（由 data_squad.buildSquad 产出）
//     · 主怪（index 0）走既有 NDX.calcCombat（simulateSingle）→ 零回归；
//     · 玩家每回合伤害对从怪按「群伤溅射」结算（有 act.aoe → 60%，无 → 12%）；
//     · 从怪每回合对玩家反击（自身 atk × counterMul），使清场有代价；
//     · 主怪阵亡后，玩家火力转为「逐个点杀」剩余从怪（全额，不再溅射）。
//   V9.36：从怪不再只是「血包」——经位 atk 格（道途派生 on-hit）对从怪同样生效：
//     蚀毒/焚身逐回合真伤、破甲等效增伤、眩晕/封技停反击、迟滞/虚弱减反击。
//   V9.38：怪物「按顺序依次行动」——主怪（编队首位）先行，从怪按编队下标升序逐个出手；
//     每回合产出 r.squadActs = [{ord, idx, name, kind, dmg, cum, tag}] 供演出层逐怪错峰出飘字；
//     经位 on-hit 由「一次 roll 全体同施」改为「逐怪独立 roll」。
//   V9.40：逐回合记录 r.squadSplash = [{idx, name, dmg, killed}] —— 玩家群伤打到每只从怪的
//     各自伤害，供演出层按怪错峰出伤害数字（此前玩家侧群伤只出「从怪行动」的我方受击飘字）。
//   V9.41：从怪状态由「N 层共享一个剩余回合计数（浓度语义）」改为「逐层独立计时（条数语义）」——
//     回合内顺序：剪除到期层 → on-hit 施加 → DoT → 溅射 → 从怪行动（层数 ≡ 本回合生效层数）；
//     sec.st[k] = [{t, born}]，每层各自到期；施加当回合不计时（否则 rounds=2 只撑 1 回合）；
//     层数 ≡ 存活层数组长度，cap 只封顶「同时在池层数」；sec.stk 降级为镜像。
//   返回：在单怪结果之上追加 squad[] 与 squadWin / squadOnHit / squadActTotal 标记。
// ============================================================
(function () {
  'use strict';

  const AOE = () => (NDX.SQUAD_SPLASH_AOE != null ? NDX.SQUAD_SPLASH_AOE : 0.60);
  const BASE = () => (NDX.SQUAD_SPLASH_BASE != null ? NDX.SQUAD_SPLASH_BASE : 0.12);

  // V9.36 从怪状态语义表（与 JING_DAO_ONHIT 的 6 状态一一对应）
  //   dot       每回合按自身最大气血比例真伤
  //   dr        破甲：等效降低从怪减伤 → 溅射 / 点杀更疼
  //   counter   反击倍率修正（<1 减弱）
  //   noCounter 该回合不出手（眩晕 / 封技）
  //   cap       V9.39 逐怪独立层数上限（>1 可叠加，效果按层数放大）
  NDX.SEC_STATUS = NDX.SEC_STATUS || {
    poison:  { label: '蚀毒', dot: 0.05, cap: 5 },
    burn:    { label: '焚身', dot: 0.06, cap: 5 },
    sunder:  { label: '破甲', dr: 0.15, cap: 3 },
    slow:    { label: '迟滞', counter: 0.50, cap: 3 },
    weaken:  { label: '虚弱', counter: 0.65, cap: 3 },
    stun:    { label: '定身', noCounter: true, cap: 1 },
    silence: { label: '禁法', noCounter: true, cap: 1 },
  };

  // V9.39 层数上限：单状态 cap 与全局 NDX.SEC_STACK_CAP 取小（全局可一键压制/开关叠加）
  function secCap(k, D) {
    const g = (NDX.SEC_STACK_CAP != null ? NDX.SEC_STACK_CAP : 99);
    const c = (D && D.cap != null ? D.cap : 99);
    return Math.max(1, Math.min(g, c));
  }
  // V9.42 从怪池「单层寿命」：优先 poolRounds（与主怪 mStatus 时长 rounds 解耦），回退 rounds
  //   · 层数上限仍由 secCap（SEC_STATUS[st].cap ∩ SEC_STACK_CAP）负责，二者互不干扰
  function secPoolLife(onHit) {
    if (!onHit) return 1;
    const v = (onHit.poolRounds != null ? onHit.poolRounds : onHit.rounds);
    return Math.max(1, v || 1);
  }
  // V9.41 层数单一真源：sec.st[k] = [{ t: 总回合数, born: 施加回合号 }]（逐层各持计时）
  //   · 层数 ≡ 数组长度（到期层由 secDecay 剪除，数组恒只含「存活层」）
  //   · sec.stk 降级为「镜像」（由 secSyncStk 重算），仅为返回契约 / 演出层兼容保留
  function secStack(sec, k) {
    const a = (sec && sec.st) ? sec.st[k] : null;
    if (Array.isArray(a)) return a.length;
    return (a > 0) ? 1 : 0;                                    // 兼容历史「单值」写法
  }
  // 施加 1 层（受 cap 封顶）；rounds = 该层持续回合数，round = 施加时的回合号（1 起）
  function secApply(sec, k, rounds, round, cap) {
    if (!sec.st) sec.st = {};
    let a = sec.st[k];
    if (!Array.isArray(a)) a = (a > 0) ? [{ t: a, born: round - 1 }] : [];
    if (a.length < cap) a.push({ t: Math.max(1, rounds || 1), born: round });
    sec.st[k] = a;
    if (!sec.stk) sec.stk = {};
    sec.stk[k] = a.length;
  }
  function secSyncStk(secs) {                                  // 把 stk 镜像重算为「存活层数」
    for (const sec of secs) {
      if (!sec) continue;
      const m = {};
      for (const k in (sec.st || {})) { const n = secStack(sec, k); if (n > 0) m[k] = n; }
      sec.stk = m;
    }
  }

  function mkSec(mon) {
    return {
      name: mon.name || '妖',
      hp: mon.hp || 1,
      maxHp: mon.hp || 1,
      atk: mon.atk || 0,
      dr: mon.dr || 0,
      counterMul: (mon._counterMul != null ? mon._counterMul : 0.30),
      alive: true,
      role: 'add',
      st: {},           // V9.41 状态池：{ status: [{t, born}] }（逐层各持计时，单一真源）
      stk: {},          // V9.39 层数「镜像」：{ status: 存活层数 }（由 secSyncStk 重算）
      dotTaken: 0,      // V9.36 累计 DoT 真伤（便于结算回溯）
    };
  }

  // —— V9.36 从怪状态统一消费 ——
  function secTick(secs, SST) {           // DoT 结算
    for (const sec of secs) {
      if (!sec.st) continue;
      for (const k in sec.st) {
        if (!(secStack(sec, k) > 0)) continue;
        const D = SST[k];
        if (!D || !D.dot) continue;
        const _n = Math.max(1, Math.min(secCap(k, D), secStack(sec, k)));        // V9.39 按层数放大（V9.41 逐层独立计时）
        const d = Math.max(1, Math.round(sec.maxHp * D.dot * _n));
        sec.hp -= d; sec.dotTaken += d;
        if (sec.hp <= 0) { sec.hp = 0; sec.alive = false; }
      }
    }
  }
  function secEffDr(sec, SST) {           // 有效减伤（破甲 → 下降）
    let dr = sec.dr || 0;
    if (secStack(sec, 'sunder') > 0 && SST.sunder) {
      const _n = Math.max(1, Math.min(secCap('sunder', SST.sunder), secStack(sec, 'sunder')));
      dr -= (SST.sunder.dr || 0) * _n;                                        // V9.39 破甲按层数加深
    }
    return Math.max(-0.5, dr);
  }
  function secCounterMul(sec, SST) {      // 反击倍率（眩晕/封技 → 0）
    if (sec.st) {
      if (secStack(sec, 'stun') > 0 && SST.stun && SST.stun.noCounter) return 0;
      if (secStack(sec, 'silence') > 0 && SST.silence && SST.silence.noCounter) return 0;
    }
    let mul = sec.counterMul;
    if (secStack(sec, 'slow') > 0 && SST.slow) {
      const _n = Math.max(1, Math.min(secCap('slow', SST.slow), secStack(sec, 'slow')));
      mul *= Math.pow(SST.slow.counter != null ? SST.slow.counter : 1, _n);     // V9.39 迟滞按层数复利
    }
    if (secStack(sec, 'weaken') > 0 && SST.weaken) {
      const _n = Math.max(1, Math.min(secCap('weaken', SST.weaken), secStack(sec, 'weaken')));
      mul *= Math.pow(SST.weaken.counter != null ? SST.weaken.counter : 1, _n);
    }
    return mul;
  }
  // V9.41 回合末递减：逐层各自计时 —— 只让「已存活满 t 回合」的层到期
  //   存活条件 (round - born) < t ⇒ 施加当回合不计时（保证 rounds=2 的层覆盖 2 个后续回合）
  function secDecay(secs, round) {
    const R = (round != null ? round : 1);
    for (const sec of secs) {
      if (!sec.st) continue;
      for (const k in sec.st) {
        const a = sec.st[k];
        if (!Array.isArray(a)) { sec.st[k] = 0; continue; }   // 历史单值 → 直接清（不再有语义）
        const next = a.filter((s) => (R - s.born) < s.t);
        sec.st[k] = next.length ? next : 0;
      }
      secSyncStk([sec]);                                       // 镜像同步
    }
  }
  function secTags(sec) {
    const out = [];
    const st = sec.st || {};
    for (const k in st) {
      const _n = secStack(sec, k);
      if (!(_n > 0)) continue;
      out.push(_n > 1 ? (k + '×' + _n) : k);                                  // V9.39 标签带层数
    }
    return out;
  }

  // —— V9.38 从怪行动序列：按编队顺序依次出手 ——
  //   · ord  行动次序（从 1 递增；主怪为编队首位 → 从怪依次 2..N）
  //   · idx  在编队中的下标（1 = 第一个从怪）
  //   · kind 'counter' 正常反击 / 'stunned' 被定身·禁法 → 本回合不出手
  //   · cum  截至该怪出手后的累计反击总量（供逐回合 pHpAfter 对齐）
  //   · st   该怪此刻的状态快照（V9.39 含 ×N 层数，供演出层 / 门禁逐回合观测）
  function squadActSeq(secs, SST, pDr, pFixDr, cumStart) {
    const acts = [];
    let cum = cumStart, ord = 0;
    for (let si = 0; si < secs.length; si++) {
      const sec = secs[si];
      if (!sec.alive) continue;
      ord++;
      const mul = secCounterMul(sec, SST);
      if (mul <= 0) {
        acts.push({ ord: ord, idx: si + 1, name: sec.name, kind: 'stunned', dmg: 0, cum: cum, st: secTags(sec), tag: (secStack(sec, 'stun') > 0) ? '定身' : '禁法' });
        continue;
      }
      const c = Math.max(0, Math.round(sec.atk * mul * (1 - pDr) - pFixDr));
      cum += c;
      acts.push({ ord: ord, idx: si + 1, name: sec.name, kind: 'counter', dmg: c, cum: cum, st: secTags(sec) });
    }
    return acts;
  }

  NDX.calcCombatSquad = function (player, squad, opts) {
    const pTi = (player && player.ti) || {};
    // 单怪（或编队关闭）→ 直接委托，保持既有行为与返回结构完整
    if (!squad || squad.length <= 1) {
      const solo = NDX.calcCombat(player, (squad && squad[0]) || {}, opts);
      const mon = (squad && squad[0]) || {};
      solo.squad = [{ name: mon.name || '妖', hp: Math.max(0, solo.monsterHpLeft || 0), maxHp: mon.hp || 0, alive: (solo.monsterHpLeft || 0) > 0, role: 'front', st: [], ord: 0 }];
      solo.squadWin = solo.win;
      solo.squadOnHit = 0;
      solo.squadActTotal = 0;
      solo.squadSpill = 0;   // V9.40 单怪无群伤
      return solo;
    }

    const SST = NDX.SEC_STATUS || {};
    // V9.36 经位 atk 格 on-hit（道途派生）：从怪同样吃状态
    const onHit = (function () {
      if (!player || !player.jingSlots || !player.jingSlots.atk || !NDX.jingBookOf) return null;
      const b = NDX.jingBookOf(player.jingSlots.atk);
      return (b && b.slot === 'atk' && b.onHit) ? b.onHit : null;
    })();

    const front = squad[0];
    const base = NDX.calcCombat(player, front, opts);
    const secs = squad.slice(1).map(mkSec);

    const pDr = Math.min(0.9, pTi.dr || 0);
    const pFixDr = pTi.fixDr || 0;
    const splashPct = player.squadAoe ? AOE() : BASE();

    const rounds = base.roundsDetail || [];
    const nFront = rounds.length; // V9.37 主怪战回合数（其后为主怪亡后的点杀回合）
    let counterTotal = 0;
    let onHitProcs = 0;
    const counterPerRound = []; // 与 rounds 对齐的累计反击量
    const dealSamples = [];

    // —— 阶段一：主怪战期间的 DoT / 溅射 / 经位 on-hit / 从怪反击 ——
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      if (!r || r.intro || r.outro || r.stageBreakPoint) { counterPerRound.push(counterTotal); continue; }
      // ⓪ 回合初：剪除已到期层（V9.41 逐层独立计时）→ 层数 ≡ 本回合真正生效的层数
      secDecay(secs, i + 1);
      // ① 经位 on-hit 施加（V9.38 逐怪独立 roll；V9.41 提到回合初 → 本层「可见轮数 ≡ 生效回合数」）
      if (onHit && typeof Math.random === 'function') {
        for (const sec of secs) {
          if (!sec.alive) continue;
          if (Math.random() >= onHit.chance) continue;
          // V9.41 逐层独立计时：每层单独入池（各自 born/t）；cap 只封顶「同时在池层数」
          secApply(sec, onHit.status, secPoolLife(onHit), i + 1, secCap(onHit.status, SST[onHit.status]));
          onHitProcs++;
        }
      }
      // ② DoT 结算（含本回合初刚施加的蚀毒 / 焚身）
      secTick(secs, SST);
      const dmg = (r.pTurn && (r.pTurn.deal || r.pTurn.baseDeal)) || 0;
      if (dmg > 0) dealSamples.push(dmg);
      // ③ 溅射到全部存活从怪（破甲 → 有效减伤下降）
      if (dmg > 0) {
        const _spill = [];   // V9.40 逐怪记录，供演出层按怪出伤害数字
        for (let si = 0; si < secs.length; si++) {
          const sec = secs[si];
          if (!sec.alive) continue;
          const hit = Math.max(0, Math.round(dmg * splashPct * (1 - secEffDr(sec, SST))));
          sec.hp -= hit;
          if (sec.hp <= 0) { sec.hp = 0; sec.alive = false; }
          _spill.push({ idx: si + 1, name: sec.name, dmg: hit, killed: !sec.alive });
        }
        if (_spill.length) r.squadSplash = _spill;
      }
      // ④ 存活从怪「按顺序依次行动」（V9.38）：编队下标升序逐个出手，各自独立判定
      //    · 定身 / 禁法 → 本回合不出手（kind:'stunned'，dmg 0）
      //    · 迟滞 / 虚弱 → 仍出手，但反击更轻
      r.squadActs = squadActSeq(secs, SST, pDr, pFixDr, counterTotal);
      if (r.squadActs.length) counterTotal = r.squadActs[r.squadActs.length - 1].cum;
      counterPerRound.push(counterTotal);
    }

    // —— 阶段二：主怪已亡但仍有从怪存活 → 逐个点杀（全额火力）——
    const avgDeal = dealSamples.length
      ? Math.max(1, Math.round(dealSamples.reduce((a, b) => a + b, 0) / dealSamples.length))
      : Math.max(1, Math.round(((pTi.atk || 30) + (player.yuan && player.yuan.matk || 0)) * 0.8));
    let guard = 0;
    while (secs.some((x) => x.alive) && guard < 20) {
      guard++;
      secDecay(secs, nFront + guard);   // V9.41 回合初剪除到期层（点杀回合连续编号）
      secTick(secs, SST);               // V9.36 点杀阶段同样吃 DoT
      const tgt = secs.find((x) => x.alive);
      const hit = Math.max(0, Math.round(avgDeal * (1 - secEffDr(tgt, SST))));
      tgt.hp -= hit;
      if (tgt.hp <= 0) { tgt.hp = 0; tgt.alive = false; }
      const _tgtIdx = secs.indexOf(tgt) + 1;   // V9.40 点杀目标的编队下标（1 = 第一个从怪）
      // 存活从怪同样「按顺序依次行动」（点杀阶段共用同一行动序）
      const _acts2 = squadActSeq(secs, SST, pDr, pFixDr, counterTotal);
      if (_acts2.length) counterTotal = _acts2[_acts2.length - 1].cum;
      rounds.push({
        round: (rounds.length ? rounds[rounds.length - 1].round : 0) + 1,
        first: 'player', squadClear: true,
        pTurn: { deal: hit, baseDeal: hit, cri: false },
        mTurn: null, resolve: { dots: [] },
        mHpAfter: 0, pHpAfter: 0,
        squadActs: _acts2,
        // V9.40 点杀阶段同样逐怪记录（主怪已亡，全额火力落在该只从怪上）
        squadSplash: [{ idx: _tgtIdx, name: tgt.name, dmg: hit, killed: !tgt.alive }],
        squadNote: `点杀 ${tgt.name}（-${hit}）`,
      });
      counterPerRound.push(counterTotal);
    }

    // —— 累计反击落到玩家血量与逐回合 pHpAfter ——
    const maxHp = base.maxHp || pTi.maxHp || 1000;
    // V9.37 点杀回合没有「主怪承伤基线」→ 取主怪战终值续行，否则那些回合 pHpAfter 停在 0，
    //   会把玩家显示成阵亡（并让 _resyncFight 反推出错误的顶层气血）。
    const baseFinal = (base.playerHpLeft != null ? base.playerHpLeft : maxHp);
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      if (!r) continue;
      const cum = (counterPerRound[i] != null ? counterPerRound[i] : counterTotal);
      const baseHp = (i < nFront && r.pHpAfter != null) ? r.pHpAfter : baseFinal;
      // pHpAfter 已含主怪造成的伤害；此处再叠加「截至本回合的累计从怪反击」
      r.pHpAfter = Math.max(0, baseHp - cum);
      r.squadCounter = cum;
    }

    const playerHpAfter = Math.max(0, (base.playerHpLeft != null ? base.playerHpLeft : maxHp) - counterTotal);
    const allSecDead = !secs.some((x) => x.alive);
    const frontDead = (base.monsterHpLeft || 0) <= 0;
    const win = frontDead && allSecDead && playerHpAfter > 0;
    const lose = playerHpAfter <= 0;

    secSyncStk(secs);   // V9.41 末态把 stk 镜像重算为「存活层数」
    const squadOut = [
      { name: front.name || '妖', hp: Math.max(0, base.monsterHpLeft || 0), maxHp: front.hp || 0, alive: frontDead === false, role: 'front', st: [], ord: 0 },
    ].concat(secs.map((s, i) => ({ name: s.name, hp: Math.max(0, s.hp), maxHp: s.maxHp, alive: s.alive, role: 'add', st: secTags(s), stk: Object.assign({}, s.stk || {}), dot: s.dotTaken, ord: i + 1 })));

    return Object.assign({}, base, {
      win: win, lose: lose,
      playerHpLeft: playerHpAfter,
      squad: squadOut,
      squadWin: win,
      squadCounter: counterTotal,
      squadOnHit: onHitProcs,
      squadSpill: rounds.reduce((a, x) => a + ((x && x.squadSplash) ? x.squadSplash.length : 0), 0),
      squadActTotal: rounds.reduce((a, x) => a + ((x && x.squadActs) ? x.squadActs.length : 0), 0),
      squadNote: allSecDead ? null : `尚有 ${squadOut.filter((x) => x.role === 'add').filter((x) => x.alive).length} 名从妖未清`,
    });
  };

  // V9.41 内部状态机测试钩子（供门禁直证「逐层独立计时」；不参与游戏逻辑）
  //   · apply(sec, k, rounds, round, cap) 施加 1 层；· decay(secs, round) 回合初剪除到期层
  //   · stack(sec, k) 当前存活层数；· tags(sec) 状态标签（含 ×N）
  NDX._secTest = { apply: secApply, decay: secDecay, stack: secStack, tags: secTags, sync: secSyncStk };
})();
