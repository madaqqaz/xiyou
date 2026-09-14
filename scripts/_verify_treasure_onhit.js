// _verify_treasure_onhit.js — 法宝 on-hit 机制实证探针（V9.6）
// 门禁 harness 会固定 Math.random，故探针内接管 RNG 以确定性触发：
//   _setAll()  => 每次掷骰必中（测单回合效果/控制/标记）
//   _setOnce() => 仅首次掷骰必中（测 debuff 窗口边界与不叠乘）
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = { get length() { return Object.keys(_ls).length; }, key(i){return Object.keys(_ls)[i]||null;}, getItem(k){return _ls[k]??null;}, setItem(k,v){_ls[k]=String(v);}, removeItem(k){delete _ls[k];}, clear(){for(const k of Object.keys(_ls))delete _ls[k];} };
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !['sound.js','ui.js','main.js'].includes(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };
const _mkRes = (rounds) => {
  const list = [];
  for (let i = 0; i < rounds; i++) list.push({
    pTurn: { deal: 100, hpBefore: 500, realDeal: 100 },
    mTurn: { deal: 50, hpBefore: 1000, hpAfter: 1000 },
    mHpAfter: 1000, pHpAfter: 500, momentum: 0,
  });
  return { roundsDetail: list, maxHp: 1000, maxMHp: 2000, monsterHpLeft: 1000, playerHpLeft: 500, total: rounds, win: false, lose: false };
};
const _setAll = () => { Math.random = () => 0; };
const _setOnce = () => { let c = 0; Math.random = () => (c++ === 0 ? 0 : 1); };

// 1) shrink：怪伤×0.5，玩家少受→回补；单次触发 → 仅 3 回合窗口，且不叠乘
{
  _setOnce();
  const res = _mkRes(5);
  NDX.applyTreasureOnHit(res, [{ proc: 0.25, shrink: 0.5, dur: 3 }], { boss: false });
  const rd = res.roundsDetail;
  ck('shrink 怪伤×0.5', rd[0].mTurn.deal === 25, 'deal=' + rd[0].mTurn.deal);
  ck('shrink 玩家回补 +25', rd[0].pHpAfter === 525, 'pHp=' + rd[0].pHpAfter);
  ck('shrink 标记', rd[0].mTurn.shrunk === true);
  ck('shrink 窗口内不叠乘(r2仍25)', rd[2].mTurn.deal === 25, 'r2 deal=' + rd[2].mTurn.deal);
  ck('shrink 窗口外不受影响(r3=50)', rd[3].mTurn.deal === 50, 'r3 deal=' + rd[3].mTurn.deal);
  ck('shrink 仅前3回合(r4=50)', rd[4].mTurn.deal === 50, 'r4 deal=' + rd[4].mTurn.deal);
}
// 2) stun：deal 归零 + 玩家回补全额
{
  _setAll();
  const res = _mkRes(3);
  NDX.applyTreasureOnHit(res, [{ proc: 0.20, stun: 1 }], { boss: false });
  ck('stun deal=0', res.roundsDetail[0].mTurn.deal === 0 && res.roundsDetail[0].mTurn.stunned === true);
  ck('stun 玩家回补 +50', res.roundsDetail[0].pHpAfter === 550, 'pHp=' + res.roundsDetail[0].pHpAfter);
}
// 3) burn：怪物每回合流失 maxMHp*0.04 = 80（DoT 按回合累积推进，mHpAfter 单调不回升）
{
  _setOnce();
  const res = _mkRes(3);
  NDX.applyTreasureOnHit(res, [{ proc: 0.30, burn: 0.04, dur: 2 }], { boss: false });
  const rd = res.roundsDetail;
  ck('burn r0 怪物血-80', rd[0].mHpAfter === 920, 'mHp=' + rd[0].mHpAfter);
  ck('burn 累积 r2 怪物血-160', rd[2].mHpAfter === 840, 'r2 mHp=' + rd[2].mHpAfter);
  ck('burn 单调不回升', rd[1].mHpAfter <= rd[0].mHpAfter && rd[2].mHpAfter <= rd[1].mHpAfter);
}
// 4) trueDmg：附加 8% 玩家伤害真伤
{
  _setAll();
  const res = _mkRes(1);
  NDX.applyTreasureOnHit(res, [{ proc: 0.22, trueDmg: 0.08 }], { boss: false });
  ck('trueDmg 怪物-8', res.roundsDetail[0].mHpAfter === 992, 'mHp=' + res.roundsDetail[0].mHpAfter);
}
// 5) lifesteal：回血 15% 玩家伤害
{
  _setAll();
  const res = _mkRes(1);
  NDX.applyTreasureOnHit(res, [{ proc: 0.25, lifesteal: 0.15 }], { boss: false });
  ck('lifesteal 回血+15', res.roundsDetail[0].pHpAfter === 515, 'pHp=' + res.roundsDetail[0].pHpAfter);
}
// 6) Boss shrink 下限（shrink 0.9 → 最低保留 30% = 15）
{
  _setOnce();
  const res = _mkRes(2);
  NDX.applyTreasureOnHit(res, [{ proc: 0.25, shrink: 0.9, dur: 2 }], { boss: true });
  ck('Boss shrink 地板 15', res.roundsDetail[0].mTurn.deal === 15, 'deal=' + res.roundsDetail[0].mTurn.deal);
  ck('Boss shrink 仅2回合', res.roundsDetail[1].mTurn.deal === 15 && res.roundsDetail[1].mTurn.shrunk === true);
}
// 7) 六道协同 ×1.25（dao 一致，shrink 0.4 → 0.5 等效，deal 25）
{
  _setAll();
  const res = _mkRes(1);
  NDX.applyTreasureOnHit(res, [{ proc: 0.25, shrink: 0.4, dao: '战' }], { boss: false, playerDao: '战' });
  ck('六道协同 shrink 0.4×1.25=0.5 → deal25', res.roundsDetail[0].mTurn.deal === 25, 'deal=' + res.roundsDetail[0].mTurn.deal);
}
// 8) cleanse:['all'] 清空全部玩家 debuff
{
  const res = _mkRes(1);
  res.roundsDetail[0].pDebuffs = { blind: 1, burn: 2, atkDown: 1 };
  res.roundsDetail[0].pTurn.pdbMiss = 'blind'; res.roundsDetail[0].pTurn.blindMiss = true;
  NDX.applyBattleCleanse(res, 1, ['all']);
  ck('cleanse all 清空', Object.keys(res.roundsDetail[0].pDebuffs || {}).length === 0, JSON.stringify(res.roundsDetail[0].pDebuffs));
}
// 9) 非命中回合不触发
{
  _setAll();
  const res = _mkRes(2);
  res.roundsDetail[1].pTurn.deal = 0;
  NDX.applyTreasureOnHit(res, [{ proc: 0.25, stun: 1 }], { boss: false });
  ck('落空回合不触发', res.roundsDetail[1].mTurn.deal === 50 && !res.roundsDetail[1].mTurn.stunned);
}
// 10) 六道协同 + 齐天(critBreakShield) 眩晕破盾标记
{
  _setAll();
  const res = _mkRes(2);
  NDX.applyTreasureOnHit(res, [{ proc: 0.20, stun: 1, dao: '缘' }], { boss: false, playerDao: '缘', sealMechs: ['critBreakShield'] });
  ck('齐天 眩晕破盾标记', res.roundsDetail[0].mTurn.shieldBreak === true, 'shieldBreak=' + res.roundsDetail[0].mTurn.shieldBreak);
}
// 11) onHitFx 表现层回执：触发时在 roundsDetail 记录 label/法宝名（供 main.js 出飘字）
{
  _setAll();
  const res = _mkRes(1);
  NDX.applyTreasureOnHit(res, [{ proc: 0.25, shrink: 0.5, _tid: 'zijin_honghulu', _name: '紫金红葫芦' }], { boss: false });
  const fx = res.roundsDetail[0].onHitFx;
  ck('onHitFx 记录触发', !!(fx && fx.length === 1), JSON.stringify(fx));
  ck('onHitFx 含文案/法宝名/kind', !!(fx && fx[0].label === '收妖·变小' && fx[0].name === '紫金红葫芦' && fx[0].kind === 'shrink' && fx[0].icon), JSON.stringify(fx && fx[0]));
}
// 12) 未触发（高掷）时不留 onHitFx，避免表现层误报
{
  Math.random = () => 0.99;
  const res = _mkRes(1);
  NDX.applyTreasureOnHit(res, [{ proc: 0.25, stun: 1 }], { boss: false });
  ck('未触发无 onHitFx', !res.roundsDetail[0].onHitFx);
}
// 13) 投放：7 件名器已按章累积进 FABAO_POOL，且 lootById 可解析为法宝（否则宝窟发不出）
{
  const newIds = ['zijin_honghulu','jinguo_zhuo','ts_jingping','bajiao_shan','kunxian_sheng','feilong_zhang','jiuhuan_zhang'];
  const P = NDX.FABAO_POOL || {};
  ck('FABAO_POOL[2] 含3件ch2名器', ['zijin_honghulu','jinguo_zhuo','ts_jingping'].every((x) => (P[2] || []).indexOf(x) >= 0));
  ck('FABAO_POOL[1] 不出名器', !newIds.some((x) => (P[1] || []).indexOf(x) >= 0));
  ck('FABAO_POOL[2] 不含ch3/ch4名器', ['bajiao_shan','feilong_zhang'].every((x) => (P[2] || []).indexOf(x) < 0));
  ck('FABAO_POOL[4~9] 含全部7件', [4,5,6,7,8,9].every((k) => newIds.every((x) => (P[k] || []).indexOf(x) >= 0)));
  ck('7件均可被 lootById 解析为法宝', newIds.every((x) => { const e = NDX.lootById(x); return !!(e && e.treasure && e.treasureId === x); }));
}

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
