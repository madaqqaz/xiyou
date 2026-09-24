// _verify_squad.js — 多怪编队门禁（V9.31）
// 断言：① 编队真源（数量随难度递进 / 性确定性 / 派生倍率）；② buildSquad 结构；
//       ③ calcCombatSquad 单怪委托（零回归）；④ 多怪结算：squad 数组 / 溅射 / 从怪反击 /
//       V9.41 从怪状态「逐层独立计时」（层数组 + 施加当回合不计时 + cap 只封顶层数）
//       群伤（squadAoe）显著提升清场效率；⑤ 主怪亡而从怪存活 → squadWin=false。
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const ck = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra != null ? ' — ' + extra : '')); }
};

const _noop = () => {};
const _store = {};
const sb = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON,
  navigator: { userAgent: 'node' },
  localStorage: { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; } },
  document: {
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop }),
    querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop, body: { appendChild: _noop }, documentElement: { style: {} },
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 0), addEventListener: _noop, removeEventListener: _noop,
};
sb.window = sb; sb.global = sb; sb.self = sb;
const ctx = vm.createContext(sb);
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
files.forEach((f) => {
  if (/^https?:/.test(f)) return;
  const p = f.split('?')[0];
  if (!fs.existsSync(path.join(ROOT, p))) return;
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, p), 'utf8'), ctx, { filename: p }); } catch (e) { }
});
const NDX = sb.NDX;

const player = (aoe) => ({
  heroId: 'tangseng', good: 0, spd: 12,
  ti: { atk: 160, atkB: 0, fixAtk: 0, maxHp: 4000, curHp: 4000, hp: 4000, dr: 0.05, mdef: 40, cri: 0 },
  yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
  reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
  squadAoe: !!aoe,
});
const mon = () => ({ name: '试炼妖', hp: 900, atk: 60, matk: 30, dr: 0.05, mdef: 0.05, spd: 7, type: 'mob', diff: 1 });

console.log('\n[多怪编队] 门禁');

// 1) 真源
ck('S1 编队开关默认开启', NDX.SQUAD_ENABLED === true, 'v=' + NDX.SQUAD_ENABLED);
ck('S2 编队规格覆盖 mob/elite/boss 三类', !!(NDX.SQUAD_COMP.mob && NDX.SQUAD_COMP.elite && NDX.SQUAD_COMP.boss));
ck('S3 从怪数量随难度非递减（mob）', (() => {
  const a = NDX.squadCountOf('mob', 2), b = NDX.squadCountOf('mob', 6), c = NDX.squadCountOf('mob', 12), d = NDX.squadCountOf('mob', 20);
  return a <= b && b <= c && c <= d && d >= 1;
})(), 'mob 2/6/12/20 → ' + [2, 6, 12, 20].map((x) => NDX.squadCountOf('mob', x)).join('/'));
ck('S4 数量确定性（同参同值）', NDX.squadCountOf('elite', 9) === NDX.squadCountOf('elite', 9));

// 2) buildSquad 结构
{
  const sq = NDX.buildSquad(mon(), { type: 'mob', diff: 12, act: 5 });
  ck('S5 buildSquad 返回 >1（中高难 mob 出从怪）', sq.length > 1, 'len=' + sq.length);
  ck('S6 index0 为主怪原样（同引用）', sq[0].name === '试炼妖');
  ck('S7 从怪血/攻低于主怪', sq.slice(1).every((x) => x.hp < 900 && x.atk < 60));
  ck('S8 从怪带反击倍率标记', sq.slice(1).every((x) => typeof x._counterMul === 'number'));
}
{
  const a = NDX.buildSquad(mon(), { type: 'mob', diff: 12, act: 5 }).map((x) => x.name).join(',');
  const b = NDX.buildSquad(mon(), { type: 'mob', diff: 12, act: 5 }).map((x) => x.name).join(',');
  ck('S9 编队具名确定性（同参同名）', a === b, a);
}
{
  const tut = NDX.buildSquad({ name: '教学', hp: 100, atk: 10, tutorial: true }, { type: 'mob', diff: 20, act: 1 });
  ck('S10 教学战不编队（保持单怪）', tut.length === 1);
}

// 3) 单怪委托（零回归）
{
  const r = NDX.calcCombatSquad(player(), [mon()], { stanceSeq: ['ATK'] });
  ck('S11 单怪委托：squad 长度 1 且 role=front', r.squad && r.squad.length === 1 && r.squad[0].role === 'front');
  ck('S12 单怪委托：squadWin === win', r.squadWin === r.win);
}

// 4) 多怪结算
{
  // ⚠ S15 是「多怪承伤 ≥ 单怪」的比较 → 两次战斗必须同编队 / 同 opts / 同掷骰，
  //   否则随机暴击会让单怪场反而更疼（既有抖动源，2026-09-23 修）
  const _rS = Math.random;
  Math.random = () => 0.5;
  const sq = NDX.buildSquad(mon(), { type: 'mob', diff: 12, act: 5 });
  const r = NDX.calcCombatSquad(player(false), sq, { stanceSeq: ['ATK'] });
  const solo = NDX.calcCombat(player(false), mon(), { stanceSeq: ['ATK'] });
  Math.random = _rS;
  ck('S13 多怪：squad 完整返回（长度=编队数）', r.squad && r.squad.length === sq.length, 'len=' + (r.squad && r.squad.length));
  ck('S14 多怪：从怪反击计入（squadCounter>0）', r.squadCounter > 0, 'v=' + r.squadCounter);
  ck('S15 多怪：玩家承伤不少于单怪（反击代价）', r.playerHpLeft <= solo.playerHpLeft, 'multi=' + r.playerHpLeft + ' solo=' + solo.playerHpLeft);
}
{
  // 主怪耐久、从怪极厚：两者都清不掉 → 比较从怪剩余血量（群伤应打掉更多）
  const front = { name: '厚主', hp: 3000, atk: 40, matk: 20, dr: 0.1, mdef: 0.1, spd: 7, type: 'mob', diff: 1 };
  const addA = { name: '从一', hp: 99999, atk: 8, matk: 5, dr: 0.2, mdef: 0.2, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 };
  const addB = { name: '从二', hp: 99999, atk: 8, matk: 5, dr: 0.2, mdef: 0.2, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 };
  const rNo = NDX.calcCombatSquad(player(false), [front, addA, addB], {});
  const rAoe = NDX.calcCombatSquad(player(true), [front, addA, addB], {});
  const hpNo = rNo.squad.filter((x) => x.role === 'add').reduce((a, x) => a + x.hp, 0);
  const hpAoe = rAoe.squad.filter((x) => x.role === 'add').reduce((a, x) => a + x.hp, 0);
  ck('S16 群伤显著提升清场（从怪剩余血更低）', hpAoe < hpNo, `adds hp ${hpNo}→${hpAoe}`);
}

// 5) 主怪亡而从怪存活 → 未全清不判胜
{
  // 主怪极脆、从怪极厚：主怪速死，从怪难清
  const boss = { name: '主', hp: 30, atk: 10, matk: 10, dr: 0, mdef: 0, spd: 7, type: 'mob', diff: 1 };
  const tank = { name: '厚甲从妖', hp: 99999, atk: 5, matk: 5, dr: 0.4, mdef: 0.4, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 };
  const r = NDX.calcCombatSquad(player(true), [boss, tank], {});
  ck('S17 主怪阵亡但从怪未清 → squadWin=false', r.squad[0].alive === false && r.squadWin === false, 'front alive=' + r.squad[0].alive + ' win=' + r.squadWin);
}


// 6) V9.36 从怪吃经位 on-hit（道途派生状态真作用于从怪）
{
  const atkBookWith = (status) => {
    const all = (NDX.SUTRA_FULLS || []).concat(NDX.NI_SUTRA_FULLS || []);
    for (const f of all) {
      const b = NDX.jingBookOf(f.id);
      if (b && b.slot === 'atk' && b.onHit && b.onHit.status === status) return f.id;
    }
    return null;
  };
  const poisonId = atkBookWith('poison');
  const stunId = atkBookWith('stun');
  ck('W1 存在 atk 格 poison / stun 经', !!poisonId && !!stunId, poisonId + ' / ' + stunId);
  ck('W2 SEC_STATUS 覆盖 6 类状态', (() => {
    const S = NDX.SEC_STATUS || {};
    return ['poison', 'sunder', 'slow', 'weaken', 'stun', 'silence'].every((k) => !!S[k]);
  })(), JSON.stringify(Object.keys(NDX.SEC_STATUS || {})));

  if (poisonId && stunId) {
    const mk = () => ({ name: '厚主', hp: 3000, atk: 40, matk: 20, dr: 0.1, mdef: 0.1, spd: 7, type: 'mob', diff: 1 });
    const mkAdd = (n) => ({ name: n, hp: 99999, atk: 40, matk: 5, dr: 0.2, mdef: 0.2, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 });
    const runIt = (jingAtk) => {
      const P = player(false);
      P.jingSlots = { atk: jingAtk || null, chant: null };
      return NDX.calcCombatSquad(P, [mk(), mkAdd('从一'), mkAdd('从二')], {});
    };
    const _r = Math.random;
    Math.random = () => 0; // 必定触发 on-hit
    const rNo = runIt(null);
    const rPoi = runIt(poisonId);
    const rStu = runIt(stunId);
    Math.random = _r;
    const addHp = (r) => r.squad.filter((x) => x.role === 'add').reduce((a, x) => a + x.hp, 0);
    ck('W3 从怪吃 on-hit：蚀毒使从怪总血更低', addHp(rPoi) < addHp(rNo), `${addHp(rNo)} → ${addHp(rPoi)}`);
    ck('W4 squadOnHit 计数 > 0（从怪确被上状态）', rPoi.squadOnHit > 0, 'v=' + rPoi.squadOnHit);
    ck('W5 定身使从怪反击总量下降（停手）', rStu.squadCounter < rNo.squadCounter, `${rNo.squadCounter} → ${rStu.squadCounter}`);
    ck('W6 无经位时 squadOnHit = 0（零回归）', rNo.squadOnHit === 0, 'v=' + rNo.squadOnHit);
    const soloOnHit = NDX.calcCombatSquad(player(false), [mon()], {}).squadOnHit;
    ck('W7 单怪委托 squadOnHit = 0', soloOnHit === 0, 'v=' + soloOnHit);
  }
}

// 7) V9.37 编队战后收口（post-hoc 修正不得破坏编队结果）
{
  const mk = () => ({ name: '脆主', hp: 30, atk: 10, matk: 10, dr: 0, mdef: 0, spd: 7, type: 'mob', diff: 1 });
  const mkAdd = (n) => ({ name: n, hp: 99999, atk: 30, matk: 5, dr: 0.4, mdef: 0.4, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 });
  const mkP = (jingAtk) => {
    const P = player(false);
    P.jingSlots = { atk: jingAtk || null, chant: null };
    return P;
  };
  const _r = Math.random;
  Math.random = () => 0;
  const res = NDX.calcCombatSquad(mkP(null), [mk(), mkAdd('厚甲从妖'), mkAdd('厚甲从妖二')], {});
  const nRounds = res.roundsDetail.length;

  const tail = res.roundsDetail.slice(-6).map((x) => x.pHpAfter);
  ck('W8 阶段二回合 pHpAfter 不再断链为 0', tail.every((h) => h > 0), JSON.stringify(tail));
  ck('W9 末回合 pHpAfter === 顶层 playerHpLeft', res.roundsDetail[nRounds - 1].pHpAfter === res.playerHpLeft, res.roundsDetail[nRounds - 1].pHpAfter + ' vs ' + res.playerHpLeft);
  ck('W10 主怪未清完 → squadWin=false 且 win=false', res.squadWin === false && res.win === false, 'sq=' + res.squadWin + ' win=' + res.win);

  // post-hoc 收口（_resyncFight）不得截断回合 / 覆写胜负
  const before = res.roundsDetail.length;
  NDX._resyncFight(res);
  ck('W11 _resyncFight 不截断点杀回合', res.roundsDetail.length === before, before + ' → ' + res.roundsDetail.length);
  ck('W12 _resyncFight 不覆写 win（false 保持 false）', res.win === false && res.lose === false, 'win=' + res.win + ' lose=' + res.lose);
  ck('W13 _resyncFight 不破坏顶层 playerHpLeft', res.playerHpLeft > 0, 'v=' + res.playerHpLeft);

  // 经位 on-hit 施加后编队结论不变（stun 经）
  const player2 = mkP('ni_full_duotian');
  const res2 = NDX.calcCombatSquad(player2, [mk(), mkAdd('厚甲从妖'), mkAdd('厚甲从妖二')], {});
  const sqWin = res2.squadWin;
  NDX.applyJingOnHit(res2, player2);
  ck('W14 经位 on-hit 后 squadWin / win 不变', res2.squadWin === sqWin && res2.win === sqWin, 'sq=' + res2.squadWin + ' win=' + res2.win);
  ck('W15 经位 on-hit 后回合未截断', res2.roundsDetail.length >= before, 'len=' + res2.roundsDetail.length);
  Math.random = _r;
}


// 8) V9.38 从怪「按顺序依次行动」+ 经位 on-hit 逐怪独立
{
  const atkBookWith = (status) => {
    const all = (NDX.SUTRA_FULLS || []).concat(NDX.NI_SUTRA_FULLS || []);
    for (const f of all) {
      const b = NDX.jingBookOf(f.id);
      if (b && b.slot === 'atk' && b.onHit && b.onHit.status === status) return f.id;
    }
    return null;
  };
  const mkF = () => ({ name: '厚主', hp: 3000, atk: 40, matk: 20, dr: 0.1, mdef: 0.1, spd: 7, type: 'mob', diff: 1 });
  const mkA = (n, atk) => ({ name: n, hp: 99999, atk: atk || 40, matk: 5, dr: 0.2, mdef: 0.2, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 });
  const lineup = () => [mkF(), mkA('从一', 40), mkA('从二', 30), mkA('从三', 20)];
  const _r = Math.random;
  Math.random = () => 0;
  const res = NDX.calcCombatSquad(player(false), lineup(), {});
  Math.random = _r;

  const actRounds = res.roundsDetail.filter((x) => x.squadActs && x.squadActs.length);
  ck('X1 每回合产出从怪行动序列 squadActs', actRounds.length > 0, 'rounds=' + res.roundsDetail.length);
  ck('X2 squadActTotal 汇总行动次数 > 0', res.squadActTotal > 0, 'v=' + res.squadActTotal);

  if (actRounds.length) {
    const a = actRounds[0].squadActs;
    ck('X3 行动序 ord 从 1 起严格递增', a.every((x, i) => x.ord === i + 1), JSON.stringify(a.map((x) => x.ord)));
    ck('X4 行动 idx 对齐编队下标 1..N', a.every((x, i) => x.idx === i + 1), JSON.stringify(a.map((x) => x.idx)));
    ck('X5 行动序长度 = 存活从怪数（3）', a.length === 3, 'len=' + a.length);
    ck('X6 cum 单调不减且末项 = 该回合累计反击', a.every((x, i) => i === 0 || x.cum >= a[i - 1].cum) && a[a.length - 1].cum === actRounds[0].squadCounter, JSON.stringify(a.map((x) => x.cum)) + ' vs ' + actRounds[0].squadCounter);
    ck('X7 反击伤害随从怪攻击力递减（按序逐个结算）', a[0].dmg > a[1].dmg && a[1].dmg > a[2].dmg, JSON.stringify(a.map((x) => x.dmg)));
    ck('X8 counter 段 dmg 恒 > 0', a.filter((x) => x.kind === 'counter').every((x) => x.dmg > 0));
  }

  const poisonId = atkBookWith('poison');
  const stunId = atkBookWith('stun');
  ck('X9 存在 atk 格 poison / stun 经', !!poisonId && !!stunId, poisonId + ' / ' + stunId);
  if (poisonId && stunId) {
    const mkP = (id) => { const P = player(false); P.jingSlots = { atk: id || null, chant: null }; return P; };
    Math.random = () => 0;
    const rPoi = NDX.calcCombatSquad(mkP(poisonId), lineup(), {});
    const nAct = rPoi.roundsDetail.filter((x) => x.squadActs && x.squadActs.length).length;
    ck('X10 逐怪独立 roll：触发次数随存活从怪数放大', rPoi.squadOnHit >= nAct * 2, 'procs=' + rPoi.squadOnHit + ' actRounds=' + nAct);
    const rStu = NDX.calcCombatSquad(mkP(stunId), lineup(), {});
    const rNone = NDX.calcCombatSquad(mkP(null), lineup(), {});
    Math.random = _r;
    const stunActs = rStu.roundsDetail.reduce((acc, x) => acc.concat((x.squadActs || []).filter((y) => y.kind === 'stunned')), []);
    ck('X11 被定身的从怪行动记为 stunned 且 dmg=0', stunActs.length > 0 && stunActs.every((x) => x.dmg === 0 && !!x.tag), 'n=' + stunActs.length + ' tag=' + (stunActs[0] && stunActs[0].tag));
    ck('X12 定身使反击总量下降', rStu.squadCounter < rNone.squadCounter, rNone.squadCounter + ' → ' + rStu.squadCounter);
  }
  const solo = NDX.calcCombatSquad(player(false), [mon()], {});
  ck('X13 单怪委托无行动序列（零回归）', solo.squadActTotal === 0 && !solo.roundsDetail.some((x) => x.squadActs), 'v=' + solo.squadActTotal);
}

// 9) V9.38 编队战 post-hoc 传播须同步顶层（不减明细与顶层自相矛盾）
{
  const mkF = () => ({ name: '厚主', hp: 3000, atk: 40, matk: 20, dr: 0.1, mdef: 0.1, spd: 7, type: 'mob', diff: 1 });
  const mkA = (n) => ({ name: n, hp: 99999, atk: 40, matk: 5, dr: 0.2, mdef: 0.2, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 });
  const mkP = (id) => { const P = player(false); P.jingSlots = { atk: id || null, chant: null }; return P; };
  const lineup = () => [mkF(), mkA('从一'), mkA('从二')];
  const _r = Math.random;
  Math.random = () => 0;
  const res = NDX.calcCombatSquad(mkP('ni_full_duotian'), lineup(), {});
  const pre = { pHp: res.playerHpLeft, tail: res.roundsDetail[res.roundsDetail.length - 1].pHpAfter, win: res.win, sq: res.squadWin, len: res.roundsDetail.length };
  NDX.applyJingOnHit(res, mkP('ni_full_duotian'));
  Math.random = _r;
  const tail = res.roundsDetail[res.roundsDetail.length - 1].pHpAfter;
  ck('Y1 on-hit 后回合数不变', res.roundsDetail.length === pre.len, pre.len + ' → ' + res.roundsDetail.length);
  ck('Y2 on-hit 后顶层 playerHpLeft === 末回合 pHpAfter', res.playerHpLeft === tail, res.playerHpLeft + ' vs ' + tail);
  ck('Y3 on-hit 只回补不减伤（末回合不下降）', tail >= pre.tail, pre.tail + ' → ' + tail);
  ck('Y4 on-hit 后编队胜负字段保持一致', res.win === res.squadWin, 'win=' + res.win + ' sq=' + res.squadWin);
  ck('Y5 _syncSquadTop 直调幂等', (() => { const a = NDX._syncSquadTop(res).playerHpLeft; const b = NDX._syncSquadTop(res).playerHpLeft; return a === b; })());
  ck('Y6 _resyncFight 编队分支同步顶层且不截断', (() => { NDX._resyncFight(res); return res.roundsDetail.length === pre.len && res.playerHpLeft === res.roundsDetail[res.roundsDetail.length - 1].pHpAfter; })());
}
// 10) V9.39 从怪状态「逐怪独立层数叠加」
{
  const atkBookWith = (status) => {
    const all = (NDX.SUTRA_FULLS || []).concat(NDX.NI_SUTRA_FULLS || []);
    for (const f of all) {
      const b = NDX.jingBookOf(f.id);
      if (b && b.slot === 'atk' && b.onHit && b.onHit.status === status) return f.id;
    }
    return null;
  };
  const poisonId = atkBookWith('poison');
  const sunderId = atkBookWith('sunder');
  ck('Z6 存在 atk 格 poison / sunder 经', !!poisonId && !!sunderId, poisonId + ' / ' + sunderId);
  ck('Z7 SEC_STATUS 带单状态层数上限 cap（毒5 / 破甲3 / 定身1）', (() => {
    const S = NDX.SEC_STATUS || {};
    return (S.poison || {}).cap === 5 && (S.sunder || {}).cap === 3 && (S.stun || {}).cap === 1;
  })(), JSON.stringify({ poison: (NDX.SEC_STATUS.poison || {}).cap, sunder: (NDX.SEC_STATUS.sunder || {}).cap, stun: (NDX.SEC_STATUS.stun || {}).cap }));

  const mkF = () => ({ name: '厚主', hp: 3000, atk: 40, matk: 20, dr: 0.1, mdef: 0.1, spd: 7, type: 'mob', diff: 1 });
  // 从怪血量极大：溅射打不死。⚠ DoT 伤害与「自身最大气血」成正比 → 毒系仍会按累计层数和清场，
  //   故毒用「清场速度」观测，破甲（无伤害）用「存活态层数 / 标签」观测。
  const mkA = (n) => ({ name: n, hp: 50000000, atk: 40, matk: 5, dr: 0.2, mdef: 0.2, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 });
  const lineup = () => [mkF(), mkA('从一'), mkA('从二')];
  const mkP = (id) => { const P = player(false); P.jingSlots = { atk: id || null, chant: null }; return P; };
  const addHp = (r) => r.squad.filter((x) => x.role === 'add').reduce((a, x) => a + x.hp, 0);
  const addStk = (r, k) => r.squad.filter((x) => x.role === 'add').map((x) => (x.stk && x.stk[k]) || 0);
  // ⚠ 编队战「阶段二点杀」不再施加 on-hit，末态状态必被衰减清零 → 层数须从逐回合行动序列快照观测
  const actTags = (r) => r.roundsDetail.reduce((a, x) => a.concat((x.squadActs || []).reduce((b, y) => b.concat(y.st || []), [])), []);
  const maxStack = (r) => actTags(r).reduce((m, s) => { const g = /×(\d+)/.exec(s); return g ? Math.max(m, parseInt(g[1], 10)) : Math.max(m, 1); }, 0);
  const run = (id, cap) => {
    const _c = NDX.SEC_STACK_CAP;
    NDX.SEC_STACK_CAP = cap;
    const r = NDX.calcCombatSquad(mkP(id), lineup(), {});
    NDX.SEC_STACK_CAP = _c;
    return r;
  };
  const _r = Math.random;
  Math.random = () => 0;                                  // 每回合、每怪必定触发 on-hit
  const rStack = run(poisonId, 5);
  const rCap1 = run(poisonId, 1);
  const rSun3 = run(sunderId, 3);
  const rSun1 = run(sunderId, 1);
  Math.random = _r;

  // 观测①：蚀毒（DoT 与气血成正比）→ 层数叠加使从怪更早被清 → 行动 / 触发次数更少
  ck('Z8 层数叠加使 DoT 更快清场（cap5 触发次数 < cap1）', rStack.squadOnHit < rCap1.squadOnHit, rCap1.squadOnHit + ' → ' + rStack.squadOnHit);
  ck('Z9 层数叠加使从怪存活行动次数更少（cap5 < cap1）', rStack.squadActTotal < rCap1.squadActTotal, rCap1.squadActTotal + ' → ' + rStack.squadActTotal);
  // 观测②：破甲无直接伤害 → 从怪存活，层数 / 标签可直接观测
  ck('Z10 逐怪独立层数：行动序列状态快照可达 ≥2 层', maxStack(rSun3) >= 2, 'maxStack=' + maxStack(rSun3) + ' tags=' + JSON.stringify(actTags(rSun3)));
  ck('Z11 稳态层数 = 池层寿命（poolRounds5 → 受 cap3 封顶为 ×3），cap 只封顶爆发', maxStack(rSun3) === 3 && maxStack(rSun1) === 1, 'cap3=' + maxStack(rSun3) + ' cap1=' + maxStack(rSun1));
  ck('Z12 状态标签带层数（>1 显示 ×N）', actTags(rSun3).some((s) => /×\d+/.test(s)), JSON.stringify(actTags(rSun3).filter((s) => /×/.test(s))));
  ck('Z14 squad[].stk 降级为镜像仍保留（逐怪各一项）', Array.isArray(addStk(rSun3, 'sunder')) && addStk(rSun3, 'sunder').length === 2, JSON.stringify(addStk(rSun3, 'sunder')));
  ck('Z13 破甲层数叠加使溅射更疼（从怪剩余血更低）', addHp(rSun3) < addHp(rSun1), addHp(rSun1) + ' → ' + addHp(rSun3));

  // —— V9.41 逐层独立计时（条数语义）——
  const T = NDX._secTest;
  ck('Z20 暴露内部状态机测试钩子 _secTest（apply/decay/stack/tags）', !!(T && T.apply && T.decay && T.stack && T.tags));
  if (T) {
    // 层A(born=1,t=2) + 层B(born=2,t=2)：R3 只 A 到期、B 仍存活 ⇒ 逐层各持计时
    const sec = { name: 'x', st: {}, stk: {} };
    T.apply(sec, 'sunder', 2, 1, 9);
    const s1 = T.stack(sec, 'sunder');
    T.decay([sec], 2);
    T.apply(sec, 'sunder', 2, 2, 9);
    const s2 = T.stack(sec, 'sunder');
    T.decay([sec], 3);
    const s3 = T.stack(sec, 'sunder');
    T.decay([sec], 4);
    const s4 = T.stack(sec, 'sunder');
    ck('Z21 逐层独立到期（2 → 1 → 0；旧「共享计时」会 2 → 0 同帧清零）', s1 === 1 && s2 === 2 && s3 === 1 && s4 === 0, [s1, s2, s3, s4].join(' → '));

    const sec2 = { st: {}, stk: {} };
    for (let i = 1; i <= 6; i++) T.apply(sec2, 'sunder', 9, i, 3);
    ck('Z22 cap 只封顶「同时在池层数」（连施 6 层 / cap3 → 3）', T.stack(sec2, 'sunder') === 3, 'stack=' + T.stack(sec2, 'sunder'));

    const sec4 = { st: {}, stk: {} };
    T.apply(sec4, 'sunder', 2, 1, 9);
    T.decay([sec4], 2);
    const aliveAfterApplyRound = T.stack(sec4, 'sunder');
    T.decay([sec4], 3);
    ck('Z23 施加当回合不计时（t=2 的层跨过施加轮后仍活，R3 才到期）',
      aliveAfterApplyRound === 1 && T.stack(sec4, 'sunder') === 0, aliveAfterApplyRound + ' → ' + T.stack(sec4, 'sunder'));
  }
  // 稳态层数不随 cap 放大（cap5 也只到持续回合数 2）
  // ⚠ 本门禁所有 on-hit 用例必须打 Math.random 桩（否则触发次数不确定 → 抖动）
  const rSun5 = (() => { Math.random = () => 0; const r = run(sunderId, 5); Math.random = _r; return r; })();
  ck('Z24 提高全局 cap 不突破单状态 cap（sunder 自身 cap3 → 稳态仍 ×3）', maxStack(rSun5) === 3, 'cap5 maxStack=' + maxStack(rSun5));
  // —— V9.42 从怪池层寿命（poolRounds）与主怪 mStatus 时长（rounds）解耦 ——
  const _JH = NDX.JING_DAO_ONHIT;
  ck('Z25 JING_DAO_ONHIT 六道均带 poolRounds（从怪池层寿命，独立于 rounds）',
    Object.keys(_JH).every((d) => Number.isInteger(_JH[d].poolRounds) && _JH[d].poolRounds >= 1),
    JSON.stringify(Object.keys(_JH).map((d) => d + ':' + _JH[d].rounds + '/' + _JH[d].poolRounds)));
  const _bkP = NDX.jingBookOf(poisonId);
  ck('Z26 经书 onHit 双字段解耦（夺 poison：主怪 rounds=2 / 从怪池 poolRounds=5）',
    !!_bkP && !!_bkP.onHit && _bkP.onHit.rounds === 2 && _bkP.onHit.poolRounds === 5,
    _bkP && _bkP.onHit ? ('rounds=' + _bkP.onHit.rounds + ' pool=' + _bkP.onHit.poolRounds) : 'no book');
  const rMain = (() => {                                  // 主怪路径：仅首个出手回合触发一次
    const P2 = player(false); P2.jingSlots = { atk: poisonId, chant: null };
    // ⚠ 随机桩必须在 calcCombat 之后打（calcCombat 自身消费 Math.random 会吃掉桩）
    const res2m = NDX.calcCombat(P2, mon(), {});
    const _rr2 = Math.random; let _c2 = 0;
    Math.random = () => (_c2++ === 0 ? 0 : 0.99);
    NDX.applyJingOnHit(res2m, P2);
    Math.random = _rr2;
    return res2m;
  })();
  const _dotR = rMain.roundsDetail.filter((x) => x.mStatusFx && x.mStatusFx.dot).length;
  ck('Z27 主怪 mStatus 时长仍 = rounds（2），不被 poolRounds(5) 拉长', _dotR === 2, 'dotRounds=' + _dotR);
}
// 11) V9.40 玩家群伤逐怪记录（演出层按怪错峰出伤害数字的数据源）
{
  const mkF = (hp) => ({ name: '厚主', hp: hp || 3000, atk: 40, matk: 20, dr: 0.1, mdef: 0.1, spd: 7, type: 'mob', diff: 1 });
  const mkA = (n, hp) => ({ name: n, hp: hp || 5000, atk: 40, matk: 5, dr: 0, mdef: 0, spd: 7, type: 'mob', diff: 1, _counterMul: 0.3 });
  const P = () => player(false);

  // —— A. 记录形状（从怪厚血不死，保证阶段一持续产溅射记录）——
  const rA = NDX.calcCombatSquad(P(), [mkF(3000), mkA('从一'), mkA('从二'), mkA('从三')], {});
  const first = rA.roundsDetail.find((x) => x.squadSplash && x.squadSplash.length);
  ck('Z15 每回合记录逐怪群伤 squadSplash（idx/name/dmg/killed 齐备）', !!first && first.squadSplash.length === 3
    && first.squadSplash.every((s) => typeof s.idx === 'number' && typeof s.name === 'string' && typeof s.dmg === 'number' && typeof s.killed === 'boolean'),
    JSON.stringify(first && first.squadSplash));
  ck('Z16 squadSplash 逐怪独立（idx 互不相同且与编队下标对齐 1,2,3）', !!first
    && new Set(first.squadSplash.map((s) => s.idx)).size === first.squadSplash.length
    && first.squadSplash.map((s) => s.idx).join(',') === '1,2,3', JSON.stringify(first && first.squadSplash.map((s) => s.idx)));
  ck('Z17 返回补 squadSpill 计数（= 各回合溅射记录总数）',
    rA.squadSpill === rA.roundsDetail.reduce((a, x) => a + ((x.squadSplash && x.squadSplash.length) || 0), 0) && rA.squadSpill > 0,
    'squadSpill=' + rA.squadSpill);

  // —— B. 点杀阶段：主怪速亡 + 单从怪（血 = 主怪血，保证活过阶段一）。
  //   阶段一溅射总量 ≈ 0.6 × 主怪血 < 从怪血 → 必能进入阶段二并被点杀。 ——
  const rB = NDX.calcCombatSquad(P(), [mkF(300), mkA('从一', 300)], {});
  const clear = rB.roundsDetail.filter((x) => x.squadClear);
  ck('Z18 点杀阶段每次只记录 1 只从怪（非全体溅射）', clear.length > 0
    && clear.every((x) => x.squadSplash && x.squadSplash.length === 1 && x.squadSplash[0].dmg > 0 && typeof x.squadSplash[0].name === 'string'),
    'clearRounds=' + clear.length);
  ck('Z18b 击杀轮 killed=true，非击杀轮为 false（语义一致）', clear.length > 0
    && clear.some((x) => x.squadSplash[0].killed === true)
    && clear.every((x) => typeof x.squadSplash[0].killed === 'boolean'),
    'killed=' + clear.filter((x) => x.squadSplash[0].killed).length + '/' + clear.length);
  ck('Z19 单怪（不编队）路径 squadSpill 归零且无 squadSplash', (() => {
    const s = NDX.calcCombatSquad(P(), [mkF(300)], {});
    return s.squadSpill === 0 && !s.roundsDetail.some((x) => x.squadSplash);
  })());
}
console.log(`\n结论：${pass} 通过 / ${fail} 失败`);
if (fail === 0) console.log('ok / 多怪编队门禁通过');
process.exit(fail ? 1 : 0);
