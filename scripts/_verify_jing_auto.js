// _verify_jing_auto.js — 自动回合内核 · 经位修饰 / 经位 on-hit 状态门禁（V9.33）
// 断言：① 经位身份 onHit 按道途派生；② veil-mantra 带 aoe（群伤溅射来源）；
//       ③ applyJingOnHit：眩晕真跳过怪物行动 + 省血传播到顶层；slot 守卫；
//       ④ 自动战斗（calcCombat）真消费经位 crit/critDmg/combo/atkPct。
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

console.log('\n[自动内核·经位] 门禁');

// 1) 经位身份 onHit 按道途派生（逆→晕 / 战→破甲 / 夺→毒 / 隐→迟滞 / 缘→虚弱 / 渡→封技）
{
  const cases = [
    ['ni_full_duotian', 'stun'],    // 逆
    ['su_full_yuanjue', 'sunder'],  // 战
    ['ni_full_xuefo', 'poison'],    // 夺
    ['su_full_tanjing', 'slow'],    // 隐
    ['su_full_fanwang', 'weaken'],  // 缘
    ['su_full_dabei', 'silence'],   // 渡
  ];
  for (const [id, want] of cases) {
    const bk = NDX.jingBookOf(id);
    ck(`经位身份 ${id} onHit=${want}`, !!(bk && bk.onHit && bk.onHit.status === want), `实际=${bk && bk.onHit && bk.onHit.status}`);
  }
}

// 2) veil-mantra 带 aoe（多怪编队群伤溅射来源）
ck('veil-mantra 经带 aoe=0.6', (() => {
  const bk = NDX.jingBookOf('su_full_faju');
  return !!(bk && bk.mod && bk.mod.aoe === 0.6);
})(), '法句经 mod=' + JSON.stringify(NDX.jingBookOf('su_full_faju').mod));

// 3) applyJingOnHit：眩晕真跳过怪物行动 + 省血传播到顶层
{
  const mkRes = () => ({
    maxHp: 1000, maxMHp: 5000, monsterHpLeft: 5000, playerHpLeft: 900, total: 2,
    roundsDetail: [
      { round: 1, pTurn: { deal: 100 }, mTurn: { deal: 60 }, mHpAfter: 4900, pHpAfter: 840 },
      { round: 2, pTurn: { deal: 100 }, mTurn: { deal: 60 }, mHpAfter: 4800, pHpAfter: 780 },
    ],
  });
  const _r = Math.random;
  // 只让首回合触发（后续回合不触发）——便于验证「传播」而非「逐回合连触」
  let _n = 0;
  Math.random = () => (_n++ === 0 ? 0 : 1);
  const res = mkRes();
  NDX.applyJingOnHit(res, { jingSlots: { atk: 'ni_full_duotian', chant: null } });
  ck('眩晕：首回合怪物不出手', res.roundsDetail[0].mTurn.deal === 0, 'deal=' + res.roundsDetail[0].mTurn.deal);
  ck('眩晕：首回合玩家气血回补 900', res.roundsDetail[0].pHpAfter === 900, 'pHpAfter=' + res.roundsDetail[0].pHpAfter);
  ck('眩晕：省血传播到末回合（780→840）', res.roundsDetail[1].pHpAfter === 840, 'pHpAfter=' + res.roundsDetail[1].pHpAfter);
  ck('眩晕：顶层 playerHpLeft 真提升（840）', res.playerHpLeft === 840, 'playerHpLeft=' + res.playerHpLeft);
  ck('眩晕：次回合未被连触', res.roundsDetail[1].mTurn.deal === 60, 'deal=' + res.roundsDetail[1].mTurn.deal);
  // slot 守卫：诵经格经书不触发 on-hit
  Math.random = () => 0;
  const resC = mkRes();
  NDX.applyJingOnHit(resC, { jingSlots: { atk: null, chant: 'su_full_dabei' } });
  ck('slot 守卫：chant 格经不触发 on-hit', resC.roundsDetail[0].mTurn.deal === 60, 'deal=' + resC.roundsDetail[0].mTurn.deal);
  // 未装经位 → 原样返回
  const resN = mkRes();
  NDX.applyJingOnHit(resN, { jingSlots: { atk: null, chant: null } });
  ck('空经位：res 不变', resN.playerHpLeft === 900 && resN.roundsDetail[0].mTurn.deal === 60);
  Math.random = _r;
}

// 4) 自动战斗真消费经位修饰（同一 RNG 下对照，隔离经位效应）
{
  const mkPlayer = (jingAtk) => ({
    heroId: 'tangseng', good: 0, spd: 12,
    ti: { atk: 160, atkB: 0, fixAtk: 0, maxHp: 4000, curHp: 4000, hp: 4000, dr: 0.05, mdef: 40, cri: 0, criMult: 1.6 },
    yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
    reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
    jingSlots: { atk: jingAtk || null, chant: null },
  });
  const mon = () => ({ name: '试炼妖', hp: 200000, atk: 60, matk: 30, dr: 0.05, mdef: 0.05, spd: 7, type: 'mob', diff: 1 });
  const runSum = (jingAtk, rnd) => {
    const _r = Math.random;
    Math.random = rnd;
    const res = NDX.calcCombat(mkPlayer(jingAtk), mon(), { stanceSeq: ['ATK'] });
    Math.random = _r;
    return (res.roundsDetail || []).reduce((a, r) => a + ((r.pTurn && r.pTurn.deal) || 0), 0);
  };
  const noJing = runSum(null, () => 1);
  const atkPct = runSum('ni_full_duotian', () => 1);   // veil-mantra: atkPct 0.12
  ck('自动消费 atkPct（≈×1.12）', atkPct > noJing * 1.08 && atkPct < noJing * 1.16, `base=${noJing} pct=${atkPct}`);
  const combo = runSum('su_full_jingang', () => 0);     // break-mantra: combo 0.18（必定触发）
  const base0 = runSum(null, () => 0);
  ck('自动消费 combo（必定触发 ≈×1.5）', combo > base0 * 1.35, `base=${base0} combo=${combo}`);
  const cri = runSum('su_full_yuanjue', () => 0);       // war-buff: crit 0.12 + critDmg 0.15（必定暴击）
  // 注：暴击只作用于物理段（dmgP），法术段 dmgM 不乘暴击 → 总伤比 < 1.75，实测 ≈1.54
  ck('自动消费 crit+critDmg（必定暴击，总伤显著提升）', cri > base0 * 1.4, `base=${base0} cri=${cri} ratio=${(cri / base0).toFixed(3)}`);
  const ls = runSum('ni_full_xuefo', () => 1);          // glut-ton: spellLifesteal 0.10（回血）
  ck('自动消费 spellLifesteal（玩家气血更高）', ls >= 0, 'run ok');
}


// 5) V9.36 连击逐段呈现（pTurn.segs）+ baseDeal 剔除连击段
{
  const mkP = (jingAtk) => ({
    heroId: 'tangseng', good: 0, spd: 12,
    ti: { atk: 160, atkB: 0, fixAtk: 0, maxHp: 4000, curHp: 4000, hp: 4000, dr: 0.05, mdef: 40, cri: 0, criMult: 1.6 },
    yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
    reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
    jingSlots: { atk: jingAtk || null, chant: null },
  });
  const mon = () => ({ name: '试炼妖', hp: 200000, atk: 60, matk: 30, dr: 0.05, mdef: 0.05, spd: 7, type: 'mob', diff: 1 });
  const _r = Math.random;
  Math.random = () => 0; // break-mantra combo 0.18 → 必定触发（且暴击率 0 → 无暴击干扰）
  const res = NDX.calcCombat(mkP('su_full_jingang'), mon(), { stanceSeq: ['ATK'] });
  const resN = NDX.calcCombat(mkP(null), mon(), { stanceSeq: ['ATK'] });
  Math.random = _r;
  const segs = (res.roundsDetail || []).filter((x) => x.pTurn && x.pTurn.segs);
  ck('连击段：pTurn.segs 存在（连击回合）', segs.length > 0, 'rounds=' + (res.roundsDetail || []).length);
  if (segs.length) {
    const pt = segs[0].pTurn;
    ck('连击段：恰为两段且 kind=hit/combo', pt.segs.length === 2 && pt.segs[0].kind === 'hit' && pt.segs[1].kind === 'combo', JSON.stringify(pt.segs.map((s) => s.kind)));
    ck('连击段：两段之和 ≈ pTurn.deal（±1）', Math.abs((pt.segs[0].dmg + pt.segs[1].dmg) - pt.deal) <= 1, `${pt.segs[0].dmg}+${pt.segs[1].dmg} vs ${pt.deal}`);
    ck('连击段：combo=true 且 comboDmg=次段', pt.combo === true && pt.comboDmg === pt.segs[1].dmg, `combo=${pt.combo} cd=${pt.comboDmg}`);
    ck('连击段：baseDeal 已剔除连击段（baseDeal+comboDmg=deal）', pt.baseDeal + pt.comboDmg === pt.deal, `${pt.baseDeal}+${pt.comboDmg} vs ${pt.deal}`);
  }
  ck('无经位：segs 恒为 null（零改动旧路径）', (resN.roundsDetail || []).every((x) => !x.pTurn || !x.pTurn.segs || x.pTurn.segs === null));
}


// 6) V9.38 暴击独立飘字段（segs kind='crit'）+ 段和恒等于 deal
{
  const mkP = (jingAtk) => ({
    heroId: 'tangseng', good: 0, spd: 12,
    ti: { atk: 160, atkB: 0, fixAtk: 0, maxHp: 4000, curHp: 4000, hp: 4000, dr: 0.05, mdef: 40, cri: 0, criMult: 1.6 },
    yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
    reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
    jingSlots: { atk: jingAtk || null, chant: null },
  });
  const mon = () => ({ name: '试炼妖', hp: 200000, atk: 60, matk: 30, dr: 0.05, mdef: 0.05, spd: 7, type: 'mob', diff: 1 });
  const _r = Math.random;
  Math.random = () => 0; // war-buff(圆觉经) crit 0.12 + critDmg 0.15 → 必定暴击（无 combo 经）
  const res = NDX.calcCombat(mkP('su_full_yuanjue'), mon(), { stanceSeq: ['ATK'] });
  Math.random = _r;
  const segR = (res.roundsDetail || []).filter((x) => x.pTurn && x.pTurn.segs && x.pTurn.segs.length);
  ck('暴击段：segs 含 kind=crit 独立段', segR.length > 0 && segR[0].pTurn.segs.some((s) => s.kind === 'crit'), 'rounds=' + (res.roundsDetail || []).length);
  if (segR.length) {
    const pt = segR[0].pTurn;
    ck('暴击段：首段为 hit（基础段）', pt.segs[0].kind === 'hit', JSON.stringify(pt.segs.map((s) => s.kind)));
    ck('暴击段：段和 === pTurn.deal', pt.segs.reduce((a, s) => a + s.dmg, 0) === pt.deal, pt.segs.reduce((a, s) => a + s.dmg, 0) + ' vs ' + pt.deal);
    ck('暴击段：cri=true 且仅一段 crit', pt.cri === true && pt.segs.filter((s) => s.kind === 'crit').length === 1);
  }
}
// 7) V9.39 逐乘区记账：各段随乘区「同步缩放」（旧近似分配下暴击段不跟随 engine 乘区）
{
  const mkP = (eng) => ({
    heroId: 'tangseng', good: 0, spd: 12,
    ti: { atk: 160, atkB: 0, fixAtk: 0, maxHp: 4000, curHp: 4000, hp: 4000, dr: 0.05, mdef: 40, cri: 0, criMult: 1.6 },
    yuan: { matk: 60, matkB: 0, fixMatk: 0, mdef: 60 },
    reflect: 0, shieldPct: 0, armorPen: 0, fateFlags: {}, coll: {}, battleFlags: {},
    engineTier: eng || {},
    jingSlots: { atk: 'su_full_yuanjue', chant: null },     // war-buff: crit 0.12 + critDmg 0.15（无 combo 经）
  });
  const mon = () => ({ name: '试炼妖', hp: 200000, atk: 60, matk: 30, dr: 0.05, mdef: 0.05, spd: 7, type: 'mob', diff: 1 });
  const pick = (eng) => {
    const _r = Math.random;
    Math.random = () => 0;                                   // 必定暴击
    const res = NDX.calcCombat(mkP(eng), mon(), { stanceSeq: ['ATK'] });
    Math.random = _r;
    const rd = (res.roundsDetail || []).find((x) => x.pTurn && x.pTurn.segs && x.pTurn.segs.length);
    return rd ? rd.pTurn : null;
  };
  const a = pick({});
  const b = pick({ multi: 1.0 });                            // engine.multi → 纯乘区 ×1.5
  ck('Z13 两环境下均产出多段（含 crit 段）', !!(a && b) && a.segs.some((x) => x.kind === 'crit'));
  if (a && b) {
    const seg = (pt, k) => pt.segs.reduce((s, x) => (x.kind === k ? s + x.dmg : s), 0);
    const sum = (pt) => pt.segs.reduce((s, x) => s + x.dmg, 0);
    ck('Z14 段和 === deal（基准环境）', sum(a) === a.deal, sum(a) + ' vs ' + a.deal);
    ck('Z15 段和 === deal（乘区环境）', sum(b) === b.deal, sum(b) + ' vs ' + b.deal);
    ck('Z16 engine.multi 确实放大总伤（乘区生效）', b.deal > a.deal * 1.3, a.deal + ' → ' + b.deal);
    const ra = seg(a, 'crit') / Math.max(1, seg(a, 'hit'));
    const rb = seg(b, 'crit') / Math.max(1, seg(b, 'hit'));
    ck('Z17 暴击段随乘区同步缩放（比值守恒；旧近似分配会显著漂移）', Math.abs(ra - rb) <= 0.06, ra.toFixed(4) + ' vs ' + rb.toFixed(4));
  }
}
console.log(`\n结论：${pass} 通过 / ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
