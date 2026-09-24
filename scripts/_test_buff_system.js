// _test_buff_system.js — buff_system.js（V8.53 移植 GGA Buff 生命周期模型）单元验收
// 判据：结尾输出「结论：N 通过 / 0 失败」；_run_all_gates.js 自动发现本脚本。
'use strict';
const fs = require('fs');
const vm = require('vm');
const DIR = 'd:/xiyou/demo';
global.NDX = {};
const sb = { console, Math, JSON, Date, NDX: global.NDX };
sb.window = sb;
const ctx = vm.createContext(sb);
vm.runInContext(fs.readFileSync(DIR + '/js/buff_system.js', 'utf8'), ctx, { filename: 'js/buff_system.js' });

// 与 combat_part2.js 实际参数表一致（单一真源引用，此处为单测 mock）
NDX.PDB_MISS = { blind: 0.80, daze: 0.45 };
NDX.PDB_ATKMUL = { atkDown: 0.20, frost: 0.50, curse: 0.35, poison: 0.75, weak: 0.60 };
NDX.PDB_DOT = {
  burn: { pctMaxHp: 0.04, atkMul: 0.10, flat: 8, kind: '灼烧' },
  frost: { pctMaxHp: 0.02, atkMul: 0.00, flat: 6, kind: '冻伤' },
  curse: { pctMaxHp: 0.03, atkMul: 0.04, flat: 8, kind: '咒蚀' },
  poison: { pctMaxHp: 0.03, atkMul: 0.02, flat: 6, kind: '中毒' },
};

const BS = NDX.BuffSystem;
let pass = 0, fail = 0;
function ck(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  ' + extra : '')); }
}

// —— 生命周期：RESTART 同型复挂刷新（Boss 招牌）——
{
  const m = {};
  const p = BS.pool(m);
  p.apply({ id: 'curse', dur: 3 });            // 首挂
  ck('RESTART 首挂 dur=3', m.curse === 3, 'm.curse=' + m.curse);
  ck('has("curse") 生效', p.has('curse'));
  ck('duration("curse")=3', p.duration('curse') === 3, '=' + p.duration('curse'));
  p.apply({ id: 'curse', dur: 3 });            // 同型复挂（round1/reapply很常见）
  ck('RESTART 复挂刷新到 3（不叠到 6）', m.curse === 3, 'm.curse=' + m.curse);
  const clone = JSON.parse(JSON.stringify(m));
  p.tick(); ck('tick 一次 → 2', m.curse === 2, 'm.curse=' + m.curse);
  p.tick(); ck('tick 二次 → 1', m.curse === 1);
  p.tick(); ck('tick 三次 → 0 移除', m.curse === undefined && !p.has('curse'));
  // 与旧内联代码逐值对等：3 回合自然衰减到消失
  const old = Object.assign({}, clone); old.curse = 3;
  for (let i = 0; i < 3; i++) { if (old.curse > 0) old.curse -= 1; if (old.curse <= 0) delete old.curse; }
  ck('tick 与原内联衰减逐值对等', JSON.stringify(m) === JSON.stringify(old));
}

// —— DURATION.ADD 累加——
{
  const m = {};
  const p = BS.pool(m);
  p.apply({ id: 'x', dur: 3, merge: BS.DURATION.ADD });
  p.apply({ id: 'x', dur: 2, merge: BS.DURATION.ADD });
  ck('ADD 累加 3+2=5', m.x === 5, 'm.x=' + m.x);
}

// —— DURATION.STACK + maxStacks 封顶——
{
  const m = {};
  const p = BS.pool(m);
  p.apply({ id: 's', dur: 1, merge: BS.DURATION.STACK });
  p.apply({ id: 's', dur: 1, merge: BS.DURATION.STACK });
  p.apply({ id: 's', dur: 1, merge: BS.DURATION.STACK });
  ck('STACK 叠到 3', m.s === 3, 'm.s=' + m.s);
  const m2 = {};
  const p2 = BS.pool(m2);
  p2.apply({ id: 't', dur: 1, merge: BS.DURATION.STACK, maxStacks: 2 });
  p2.apply({ id: 't', dur: 1, merge: BS.DURATION.STACK, maxStacks: 2 });
  p2.apply({ id: 't', dur: 1, merge: BS.DURATION.STACK, maxStacks: 2 });
  ck('STACK 受 maxStacks=2 封顶', m2.t === 2, 'm2.t=' + m2.t);
}

// —— clear 清空托管池——
{
  const m = {};
  const p = BS.pool(m);
  p.apply({ id: 'burn', dur: 2 });
  p.apply({ id: 'blind', dur: 2 });
  p.clear();
  ck('clear 清空全部', Object.keys(m).length === 0 && !p.has('burn') && !p.has('blind'));
}

// —— 物主存储共享：外部直写/直删对池可见（消费方零改动的前提）——
{
  const m = {};
  const p = BS.pool(m);
  p.apply({ id: 'curse', dur: 2 });
  delete m.curse;                       // 模拟 game_combat 法宝破除 / 劫印轮回直删
  ck('外部直删即刻反应到池', !p.has('curse'));
  m.poison = 3;                         // 模拟 boss_skill_combat 区域词缀直写
  ck('外部直写即刻反应到池', p.has('poison') && p.duration('poison') === 3);
  const pdbMiss = p.miss(); ck('外部直写 poison 参与出账', pdbMiss.prob === 0 && pdbMiss.type === null); // 出账命中表无 poison
  const pd = p.activeDots(); ck('外部直写 poison 进入 activeDots', pd.length === 1 && pd[0].type === 'poison');
}

// —— 出账 DOT：仅生效的 DOT 型出账——
{
  const m = {};
  const p = BS.pool(m);
  p.apply({ id: 'burn', dur: 2 });
  p.apply({ id: 'blind', dur: 2 });   // 落空型，不进 DOT
  const dots = p.activeDots();
  ck('activeDots 只含 burn', dots.length === 1 && dots[0].type === 'burn', JSON.stringify(dots));
  ck('activeDots 携带完整 def（kind/比例）', dots[0].def.kind === '灼烧' && dots[0].def.pctMaxHp === 0.04);
}

// —— 出账 miss：同时生效取最高—— 
{
  const m = {};
  const p = BS.pool(m);
  p.apply({ id: 'blind', dur: 2 });
  p.apply({ id: 'daze', dur: 2 });
  const r = p.miss();
  ck('miss 取最高 0.80/blind', r.prob === 0.80 && r.type === 'blind', JSON.stringify(r));
  const p2 = BS.pool({});
  p2.apply({ id: 'blind', dur: 0 });
  ck('dur=0（已移除）不参与出账', p2.miss().prob === 0);
}

// —— 出账 atkMul：同时生效取最小——
{
  const m = {};
  const p = BS.pool(m);
  p.apply({ id: 'atkDown', dur: 2 });
  p.apply({ id: 'curse', dur: 2 });
  const r = p.atkMul();
  ck('atkMul 取最小 0.20/atkDown', r.mul === 0.20 && r.type === 'atkDown', JSON.stringify(r));
  const p2 = BS.pool({});
  p2.apply({ id: 'frost', dur: 2 });
  ck('atkMul 单效果 0.50/frost', p2.atkMul().mul === 0.50 && p2.atkMul().type === 'frost');
  ck('atkMul 无效果=1/null', BS.pool({}).atkMul().mul === 1 && BS.pool({}).atkMul().type === null);
}

// —— StackPool：妖气暴涨叠层—— 
{
  const sp = BS.stackPool('yaoqi', 1);   // m.buffLayersStart=1
  ck('Stack 初始层', sp.count() === 1);
  const v1 = sp.add();                    // 一次 buff 动作 +1
  ck('Stack add →2', v1 === 2 && sp.count() === 2);
  sp.cap(3); sp.add(); sp.add();
  ck('Stack 受 cap 封顶 3', sp.count() === 3);
  ck('Stack count 取值稳定', sp.count() === 3);
}

// —— 差分：脚本化一整套 Boss 招牌战，新旧生命周期逐轮对等——
{
  // 复刻旧内联逻辑（combat_part1：round1/reapplyEvery 挂，回合末衰减）
  function oldBattle(spec, rounds, whisk) {
    const m = {};
    for (let r = 1; r <= rounds; r++) {
      if (!(r <= whisk)) {
        if (spec.applyAtStart && r === 1) m[spec.type] = spec.dur;
        if (spec.reapplyEvery && r % spec.reapplyEvery === 0) m[spec.type] = spec.dur;
      }
      for (const k in m) { if (m[k] > 0) m[k] -= 1; if (m[k] <= 0) delete m[k]; }
    }
    return m;
  }
  function newBattle(spec, rounds, whisk) {
    const m = {};
    const p = BS.pool(m);
    for (let r = 1; r <= rounds; r++) {
      if (!(r <= whisk)) {
        if (spec.applyAtStart && r === 1) p.apply({ id: spec.type, dur: spec.dur });
        if (spec.reapplyEvery && r % spec.reapplyEvery === 0) p.apply({ id: spec.type, dur: spec.dur });
      }
      p.tick();
    }
    return m;
  }
  // 覆盖 whisk=0 + whisk=2 免控、多周期 reapply 组合；断言每轮差分一致
  const cases = [
    { type: 'curse', dur: 3, reapplyEvery: 4 },  // 白骨系
    { type: 'burn', dur: 3, reapplyEvery: 3 },   // 红孩系
    { type: 'blind', dur: 3, reapplyEvery: 4 },  // 黄风系
  ];
  let diffOk = true;
  for (const c of cases) {
    for (const whisk of [0, 2]) {
      for (let rounds = 1; rounds <= 12; rounds++) {
        const o = oldBattle({ type: c.type, dur: c.dur, applyAtStart: true, reapplyEvery: c.reapplyEvery }, rounds, whisk);
        const n = newBattle({ type: c.type, dur: c.dur, applyAtStart: true, reapplyEvery: c.reapplyEvery }, rounds, whisk);
        if (JSON.stringify(o) !== JSON.stringify(n)) { diffOk = false; console.log('   差分失配', c, 'whisk=' + whisk, 'r=' + rounds, JSON.stringify(o), JSON.stringify(n)); break; }
      }
    }
  }
  ck('Boss 招牌 12 轮差分（含免控/复挂）逐轮对等', diffOk);
}

// —— B.resolve：GGA AttributeContainer 顺序结算（computeStats 纯加性段接入）——
{
  // ① 顺序 ADD 累加：多来源同属性逐条 applyOp
  const r1 = BS.resolve([
    { key: 'atk', op: BS.Op.ADD, value: 10 },
    { key: 'atk', op: BS.Op.ADD, value: 5 },
    { key: 'atk', op: BS.Op.ADD, value: 2 },
  ], { atk: 100 });
  ck('resolve 顺序 ADD 100+10+5+2=117', r1.atk === 117, 'atk=' + r1.atk);

  // ② 未入链字段原样保留（hit/reflect 等独立字段不在链内）
  const _base2 = { atk: 50, hit: 1, reflect: 0.15 };
  const r2 = BS.resolve([{ key: 'atk', op: BS.Op.ADD, value: 7 }], _base2);
  ck('resolve 保留未入链字段', r2.hit === 1 && r2.reflect === 0.15);
  ck('resolve 不污染基线对象（只读快照）', _base2.atk === 50 && _base2.hit === 1);

  // ③ applyOp 全操作符组合：ADD→MUL→PERCENTAGE→SET 按序
  const r3 = BS.resolve([
    { key: 'x', op: BS.Op.ADD, value: 10 },          // 0+10
    { key: 'x', op: BS.Op.MUL, value: 2 },            // 10*2
    { key: 'x', op: BS.Op.PERCENTAGE, value: 0.5 },   // 20*1.5
    { key: 'x', op: BS.Op.SET, value: 99 },           // 99
  ], {});
  ck('resolve op 链 ADD→MUL→PERCENTAGE→SET', r3.x === 99, 'x=' + r3.x);

  // ④ 差分：computeStats 原内联 `field += x` 与 op 链逐项等价（模拟 _fAdd 攒链）
  function oldAcc(equips, bonus) {   // 原内联累加（consuming段，follower/经文独立）
    let atk = 100, maxHp = 200, eva = 0.1;
    (equips || []).forEach((e) => { atk += e.atk || 0; maxHp += e.hp || 0; eva += e.eva || 0; });
    if (bonus && bonus.ti) { atk += bonus.ti.atk || 0; maxHp += bonus.ti.hp || 0; eva += bonus.ti.eva || 0; }
    if (bonus && bonus.sutras) (bonus.sutras || []).forEach((ef) => { if (!ef) return; const st = ef.ti || {}; atk += st.atk || 0; maxHp += st.hp || 0; eva += st.eva || 0; });
    return { atk, maxHp, eva };
  }
  function newAcc(equips, bonus) {   // GGA op 链结算（computeStats 实际接法）
    const ops = [];
    const add = (k, v) => { if (v) ops.push({ key: k, op: BS.Op.ADD, value: v }); };
    (equips || []).forEach((e) => { add('atk', e.atk); add('maxHp', e.hp); add('eva', e.eva); });
    if (bonus && bonus.ti) { add('atk', bonus.ti.atk); add('maxHp', bonus.ti.hp); add('eva', bonus.ti.eva); }
    if (bonus && bonus.sutras) (bonus.sutras || []).forEach((ef) => { if (!ef) return; const st = ef.ti || {}; add('atk', st.atk); add('maxHp', st.hp); add('eva', st.eva); });
    return BS.resolve(ops, { atk: 100, maxHp: 200, eva: 0.1 });
  }
  const eqCombos = [
    [],
    [{ atk: 3, hp: 5, eva: 0.02 }],
    [{ atk: 3, hp: 5 }, { atk: 7, hp: 0, eva: 0.01 }],
  ];
  const bonusCombos = [
    {},
    { ti: { atk: 4, hp: 8, eva: 0.01 } },
    { ti: { atk: 4 }, sutras: [{ ti: { atk: 2, hp: 3, eva: 0.005 } }] },
    { sutras: [{ ti: { atk: 9 } }, { ti: { hp: 12, eva: 0.02 } }] },
  ];
  let accDiff = true;
  for (const eq of eqCombos) for (const b of bonusCombos) {
    const o = oldAcc(eq, b), n = newAcc(eq, b);
    if (JSON.stringify(o) !== JSON.stringify(n)) { accDiff = false; console.log('   累加差分失配', JSON.stringify(eq), JSON.stringify(b), JSON.stringify(o), JSON.stringify(n)); }
  }
  ck('computeStats 原内联累加 vs op 链逐项对等', accDiff);
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail > 0 ? 1 : 0);