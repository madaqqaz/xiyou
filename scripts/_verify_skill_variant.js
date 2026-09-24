// _verify_skill_variant.js — 技能变种 / 状态 / 法宝联动 / 大招职业变体 门禁（V9.29）
// 断言：① 本命道符合《五英雄养成总表》v1.1（悟空夺/八戒缘/沙僧战/白马隐/唐僧渡）；
//       ② 舍攻为盾 = 取消物理攻击改护盾（全英雄适用）；③ 多重攻击/群伤/buff/净化变种存在；
//       ④ 法宝→状态联动可用（金刚琢晕/毒桩毒/三昧火灼烧）；⑤ 隐藏职业→流派→大招变体生效。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math };
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), sandbox);
load('data_config.js');
load('data_skill_variant.js');
sandbox.NDX = win.NDX;
const NDX = win.NDX;

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };

// 1) 本命道（真源《五英雄养成总表》v1.1；V9.29 修正悟空/沙僧写反）
ok(NDX.HERO_HOME_DAO.wukong === '夺', '悟空本命道应为 夺（原误写为 战）');
ok(NDX.HERO_HOME_DAO.shaseng === '战', '沙僧本命道应为 战（原误写为 夺）');
ok(NDX.HERO_HOME_DAO.tangseng === '渡', '唐僧本命道应为 渡');
ok(NDX.HERO_HOME_DAO.bajie === '缘', '八戒本命道应为 缘');
ok(NDX.HERO_HOME_DAO.xiaobailong === '隐', '小白龙本命道应为 隐');

// 2) 状态字典完整性
['stun', 'poison', 'burn', 'sunder', 'slow', 'weaken', 'silence', 'might', 'ward', 'haste', 'regen']
  .forEach((k) => ok(NDX.STATUS_DEFS[k], `STATUS_DEFS 缺失 ${k}`));
ok(NDX.STATUS_DEFS.stun.noAct === true, '眩晕应标记 noAct');
ok(NDX.STATUS_DEFS.poison.dot && NDX.STATUS_DEFS.poison.dot.rounds === 3, '中毒应为 3 回合 DOT');

// 3) 法宝 → 状态联动（用户拍板：debuff 与法宝结合）
const TRE = NDX.TREASURE_STATUS || {};
ok(Object.keys(TRE).length >= 15, '法宝状态映射条目过少');
Object.keys(TRE).forEach((id) => {
  ok(NDX.STATUS_DEFS[TRE[id].status], `法宝 ${id} 引用了未定义状态 ${TRE[id].status}`);
});
ok(TRE.tre_jingangzhuo && TRE.tre_jingangzhuo.status === 'stun', '金刚琢应挂眩晕');
ok(TRE.tre_daomadu && TRE.tre_daomadu.status === 'poison', '倒马毒桩应挂中毒');
ok(TRE.tre_sanmei && TRE.tre_sanmei.status === 'burn', '三昧真火应挂灼烧');
{
  // 赌博：rng 恒 0 → 必然触发
  const a = { dmg: 100, note: '' };
  NDX.applyTreasureStatus(a, { gear: ['tre_jingangzhuo'] }, () => 0);
  ok(a.mStatus && a.mStatus.stun >= 1, '持金刚琢攻击应挂上眩晕');
  ok(NDX.applyTreasureStatus({ dmg: 100, note: '' }, {}, () => 0).mStatus == null, '无法宝时不应挂状态');
  const b = { dmg: 100, note: '' };
  NDX.applyTreasureStatus(b, { gear: ['tre_jingangzhuo'] }, () => 0.99);
  ok(!b.mStatus, '概率未命中时不应挂状态');
}

// 4) 普攻变种：舍攻为盾（核心修正）+ 多重攻击 + 群伤
{
  const a = { kind: 'atk', dmg: 100, heal: 0, shield: 0, note: '挥兵狠击' };
  NDX.applyActVariant(a, 'atk', 'sac-shield');
  ok(a.dmg === 0, '舍攻为盾应取消物理伤害');
  ok(a.noDamage === true, '舍攻为盾应标记 noDamage');
  ok(a.shield === 90, `舍攻为盾护盾应为 90，实际 ${a.shield}`);
  // 全英雄适用：任意英雄调用结果一致
  const b = { kind: 'atk', dmg: 200, note: '' };
  NDX.applyActVariant(b, 'atk', 'sac-shield');
  ok(b.dmg === 0 && b.shield === 180, '舍攻为盾应对任意英雄同口径');
}
{
  const a = { dmg: 100, note: '' };
  NDX.applyActVariant(a, 'atk', 'multi');
  ok(a.hits === 3 && a.spread > 0, '多重攻击应为 3 段');
  const b = { dmg: 100, note: '' };
  NDX.applyActVariant(b, 'atk', 'aoe');
  ok(b.aoe === 0.6, '群伤应有溅射系数 0.6');
  const c = { dmg: 100, note: '' };
  NDX.applyActVariant(c, 'atk', 'sunder');
  ok(c.trueDmg === 25 && c.armorBreak === true, '破相应附真伤并破甲');
}

// 5) 诵经变种：含 buff / 净化 / 反伤 / 群伤（不再纯伤害）
{
  const a = { dmg: 100, note: '' };
  NDX.applyActVariant(a, 'chant', 'buff');
  ok(a.sBuff && a.sBuff.might === 3 && a.sBuff.ward === 3, '增益诵应挂自身 buff');
  const b = { dmg: 100, note: '' };
  NDX.applyActVariant(b, 'chant', 'cleanse');
  ok(b.cleanse === true && b.heal === 35, '净秽诵应回血并清异常');
  const c = { dmg: 100, note: '' };
  NDX.applyActVariant(c, 'chant', 'reflect');
  ok(c.reflect === 0.25, '业报诵应给反伤');
  const d = { dmg: 100, note: '' };
  NDX.applyActVariant(d, 'chant', 'aoe');
  ok(d.aoe === 0.5, '普照诵应为群伤');
}

// 6) 隐藏职业 → 流派 → 大招变体
ok(NDX.jobStyleOf('齐天·大圣') === 'crit', '齐天·大圣 应归暴击流');
ok(NDX.jobStyleOf('驯兽师·百兽归心') === 'summon', '驯兽师 应归召唤流');
ok(NDX.jobStyleOf('卷帘镇妖') === 'reflect', '卷帘镇妖 应归反伤流');
ok(NDX.jobStyleOf('不存在职') == null, '未识别职业应返回 null');
{
  // 所有流派必须在 ULT_STYLE_MOD 有落地定义
  const styles = {};
  Object.keys(NDX.JOB_STYLE).forEach((j) => { styles[NDX.JOB_STYLE[j]] = 1; });
  Object.keys(styles).forEach((st) => ok(NDX.ULT_STYLE_MOD[st], `流派 ${st} 缺大招变体定义`));
}
{
  const a = { kind: 'ult', name: '大闹天宫', dmg: 1000, heal: 0, shield: 0, note: '' };
  NDX.applyUltVariant(a, 'wukong', 3, '齐天·大圣');
  ok(a.critHit === true && a.critDmg === 0.8, '暴击流大招应必暴且暴伤 +80%');
  const b = { kind: 'ult', name: '绝招', dmg: 1000, note: '' };
  NDX.applyUltVariant(b, 'wukong', 3, '驯兽师·百兽归心');
  ok(b.summon === true && b.hits === 2, '召唤流大招应召唤且 2 段');
  const c = { kind: 'ult', name: '万劫镇狱', dmg: 1000, note: '' };
  NDX.applyUltVariant(c, 'shaseng', 3, '卷帘镇妖');
  ok(c.reflect === 0.35 && c.shield === 400, '反伤流大招应反伤并立盾');
  const d = { kind: 'ult', name: '绝招', dmg: 1000, note: '' };
  NDX.applyUltVariant(d, 'wukong', 3, '不存在职');
  ok(d.critHit == null, '未转职时大招不应被改写');
}

// 7) 统一入口 finalizeActiveAct
{
  const s = { flags: { jobConfirm: '齐天·大圣' } };
  const a = { kind: 'ult', name: '大闹天宫', dmg: 1000, note: '' };
  NDX.finalizeActiveAct(a, 'ult', s, 'wukong', 3);
  ok(a.critHit === true, 'finalizeActiveAct(ult) 应随隐藏职改写大招');
  ok(a.ultStyle === 'crit', 'finalizeActiveAct 应回填 ultStyle');
}

// 8) 减伤（补缺：普攻层/诵经层原本没有减伤套路位）
{
  const a = { kind: 'atk', dmg: 100, note: '' };
  NDX.applyActVariant(a, 'atk', 'guard');
  ok(a.dr === 0.25, '御守应给本回合减伤 25%');
  ok(a.dmg === 80, `御守应把伤害降为 80，实际 ${a.dmg}`);
  const c = { kind: 'chant', dmg: 100, note: '' };
  NDX.applyActVariant(c, 'chant', 'aegis');
  ok(c.sBuff && c.sBuff.ward === 3, '金刚诵应挂 3 回合护体');
  ok(c.dr === 0.15, '金刚诵应给即时减伤 15%');
  ok(c.shield === 20, '金刚诵应给护盾');
  ok(NDX.STATUS_DEFS.ward.drUp === 0.15, '护体状态应为减伤 15%');
}
{
  // 减伤必须真实折减伤害，不能只写在 act 上成为死属性
  const mk = () => ({ maxHp: 1000, roundsDetail: [
    { mTurn: { deal: 100 }, pHpAfter: 900 },
    { mTurn: { deal: 100 }, pHpAfter: 800 },
    { mTurn: { deal: 100 }, pHpAfter: 700 },
  ] });
  const r1 = mk();
  NDX.applyDamageReduction(r1, 0, 0.25, 1);
  ok(r1.roundsDetail[0].mTurn.deal === 75, `本回合怪物实伤应折减为 75，实际 ${r1.roundsDetail[0].mTurn.deal}`);
  ok(r1.roundsDetail[0].pHpAfter === 925, `折减后玩家气血应回补至 925，实际 ${r1.roundsDetail[0].pHpAfter}`);
  ok(r1.roundsDetail[1].mTurn.deal === 100, '单回合减伤不应影响后续回合');
  // V9.34 累计血量序列传播：单点修正须向后传播，否则顶层 playerHpLeft（取末回合）丢掉减免
  ok(r1.roundsDetail[2].pHpAfter === 725, `回补应传播至末回合 725，实际 ${r1.roundsDetail[2].pHpAfter}`);
  ok(r1.playerHpLeft === 725, `顶层玩家气血应重算为 725，实际 ${r1.playerHpLeft}`);
  const r2 = mk();
  NDX.applyDamageReduction(r2, 0, 0.15, 3);
  ok(r2.roundsDetail[2].mTurn.deal === 85, '护体 3 回合应覆盖第 3 回合');
  ok(r2.roundsDetail[2].pHpAfter === 745, `第 3 回合应回补至 745（700+15×3 传播），实际 ${r2.roundsDetail[2].pHpAfter}`);
}

// 9) 怪物状态落地：mStatus 必须真作用于回合明细（不是死数据）
{
  const mk = () => ({ maxHp: 1000, maxMHp: 10000, roundsDetail: [
    { mTurn: { deal: 100 }, pTurn: { deal: 200 }, mHpAfter: 9800, pHpAfter: 900, mIntent: 'atk' },
    { mTurn: { deal: 100 }, pTurn: { deal: 200 }, mHpAfter: 9600, pHpAfter: 800, mIntent: 'heavy' },
  ] });
  // 灼烧：按怪物最大气血 15% 追加真伤（10000×0.15=1500），2 回合
  const r1 = mk();
  NDX.applyMonsterStatus(r1, 0, { burn: 2 });
  ok(r1.roundsDetail[0].mHpAfter === 8300, `灼烧应追加 1500 真伤，实际 ${r1.roundsDetail[0].mHpAfter}`);
  ok(r1.roundsDetail[1].mHpAfter === 6600, `V9.34 灼烧累计两跳且传播：9600-1500×2=6600，实际 ${r1.roundsDetail[1].mHpAfter}`);
  ok(r1.monsterHpLeft === 6600, `V9.34 灼烧须传播到顶层 monsterHpLeft=6600，实际 ${r1.monsterHpLeft}`);
  // 眩晕：本回合怪物不出手 → 伤害归零且玩家回补
  const r2 = mk();
  NDX.applyMonsterStatus(r2, 0, { stun: 1 });
  ok(r2.roundsDetail[0].mTurn.deal === 0, '眩晕应让怪物本回合不出手');
  ok(r2.roundsDetail[0].mTurn.stunned === true, '眩晕应打标记');
  ok(r2.roundsDetail[0].pHpAfter === 1000, `眩晕后玩家应回补 100，实际 ${r2.roundsDetail[0].pHpAfter}`);
  ok(r2.roundsDetail[1].mTurn.deal === 100, '眩晕 1 回合不应影响后续');
  ok(r2.playerHpLeft === 900, `V9.34 眩晕省血须传播到顶层 playerHpLeft=900，实际 ${r2.playerHpLeft}`);
  // 虚弱：伤害 ×0.75 → 折减 25
  const r3 = mk();
  NDX.applyMonsterStatus(r3, 0, { weaken: 1 });
  ok(r3.roundsDetail[0].mTurn.deal === 75, `虚弱应折减怪物伤害至 75，实际 ${r3.roundsDetail[0].mTurn.deal}`);
  ok(r3.roundsDetail[0].pHpAfter === 925, '虚弱差额应回补玩家');
  // 破甲：玩家对怪伤害 +30% → 追加 60（200×0.3）
  const r4 = mk();
  NDX.applyMonsterStatus(r4, 0, { sunder: 1 });
  ok(r4.roundsDetail[0].mHpAfter === 9740, `破甲应追加 60 伤害，实际 ${r4.roundsDetail[0].mHpAfter}`);
  // 封技：非普攻动作折减 40%
  const r5 = mk();
  NDX.applyMonsterStatus(r5, 1, { silence: 1 });
  ok(r5.roundsDetail[1].mTurn.deal === 60, `封技应折减技能回合伤害至 60，实际 ${r5.roundsDetail[1].mTurn.deal}`);
}

// 10) 防御反击落地：guardCounter 必须真回打（不是空标志）
{
  const a = { kind: 'atk', dmg: 100, note: '' };
  NDX.applyActVariant(a, 'atk', 'counter');
  ok(a.guardCounter === true && a.counterPct === 0.6, '普攻反击变种应置 guardCounter 与 counterPct');
  const b = { kind: 'chant', dmg: 100, note: '' };
  NDX.applyActVariant(b, 'chant', 'counter');
  ok(b.guardCounter === true && b.counterLifesteal === 0.3, '护法诵应置反击与吸血');
  const mk = () => ({ maxHp: 1000, maxMHp: 10000, roundsDetail: [
    { mTurn: { deal: 200 }, mHpAfter: 9800, pHpAfter: 800 },
    { mTurn: { deal: 200 }, mHpAfter: 9600, pHpAfter: 600 },
    { mTurn: { deal: 200 }, mHpAfter: 9400, pHpAfter: 400 },
  ] });
  const r = mk();
  NDX.applyGuardCounter(r, 0, { guardCounter: true, counterPct: 0.5, counterLifesteal: 0.3, counterRounds: 2 });
  ok(r.roundsDetail[0].mTurn.counter === 100, `反击应为承伤 50%（100），实际 ${r.roundsDetail[0].mTurn.counter}`);
  ok(r.roundsDetail[0].mHpAfter === 9700, `反击应扣怪物 100，实际 ${r.roundsDetail[0].mHpAfter}`);
  ok(r.roundsDetail[0].pHpAfter === 830, `反击吸血应回补 30，实际 ${r.roundsDetail[0].pHpAfter}`);
  ok(r.roundsDetail[2].mTurn.counter == null, '反击 2 回合不应波及第 3 回合');
  // 怪物未命中（闪避/被眩晕）不触发反击
  const r2 = { maxHp: 1000, roundsDetail: [{ mTurn: { deal: 0 }, mHpAfter: 9800, pHpAfter: 900 }] };
  NDX.applyGuardCounter(r2, 0, { guardCounter: true });
  ok(r2.roundsDetail[0].mTurn.counter == null, '怪物未命中时不应触发反击');
}

if (fail === 0) console.log('ok / 技能变种·状态·法宝联动·大招职业变体门禁通过');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
