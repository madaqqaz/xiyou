// _verify_skill_variant.js — 技能变种 / 状态 / 法宝联动 / 大招职业变体 门禁（V9.51）
// 断言：① 英雄**推荐路线**数据（纯展示用；V9.51 英雄本命道机制已彻底取消）+ 旧机制不得复活；
//       ② 劫印来源阵营（seal.align）驱动道心调制；道级固定善恶（isEvilDao/isGoodDao）已废弃；
//       ③ 舍攻为盾 = 取消物理攻击改护盾（全英雄适用）；④ 多重攻击/群伤/buff/净化变种存在；
//       ⑤ 法宝→状态联动可用（金刚琢晕/毒桩毒/三昧火灼烧）；⑥ 隐藏职业→流派→大招变体生效。
//       ⑦ 【V9.55 A3 技能 · G1~G7】变种表接线 / 组合差异 / **同一变体只应用一次** /
//          未转职零变化 / 总表数值↔执行器字段一一对应 / 流派映射覆盖 / 总表先于执行器加载。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math };
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), sandbox);
load('data_config.js');
// 🔴 V9.55：数值真源已迁到技能总表，必须先于执行器加载（顺序即本门禁 G7）
load('data_skill_index.js');
load('data_skill_variant.js');
// V9.51：道心调制（sealDaoMod，按印的来源阵营）+ 六道系统（DaoSystem，验证固定善恶已移除）
load('data_daoxin.js');
try { load('dao_system.js'); } catch (e) { /* 依赖缺失不阻断本门禁 */ }
try { load('data_sutra.js'); } catch (e) { /* 依赖缺失时经文层断言自动跳过 */ }
sandbox.NDX = win.NDX;
const NDX = win.NDX;

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };

// 1) 英雄推荐路线（V9.51：英雄本命道机制**彻底取消**——六道 = 玩家的选择，英雄不绑定任何道）
//    这里只校验**纯展示用**的推荐路线数据（死亡复盘提示），不涉及任何数值 / 发印 / 攻式。
ok(NDX.HERO_RECOMMEND_DAO.wukong === '夺', '悟空推荐路线应为 夺');
ok(NDX.HERO_RECOMMEND_DAO.shaseng === '战', '沙僧推荐路线应为 战');
ok(NDX.HERO_RECOMMEND_DAO.tangseng === '渡', '取经人推荐路线应为 渡');
ok(NDX.HERO_RECOMMEND_DAO.bajie === '缘', '八戒推荐路线应为 缘');
ok(NDX.HERO_RECOMMEND_DAO.xiaobailong === '隐', '小白龙推荐路线应为 隐');
// 1b) 回归防护：已废弃机制不得复活
ok(NDX.HERO_HOME_DAO === undefined, 'HERO_HOME_DAO 应已删除（英雄本命道取消）');
ok(NDX.HERO_MAIN_DAOTU === undefined, 'HERO_MAIN_DAOTU 应已删除（英雄六道归属取消）');
ok(NDX.HOME_DAO_MULT === undefined, 'HOME_DAO_MULT 应已删除（本命道收益 ×1.25 取消）');
ok(typeof NDX.isHomeDao !== 'function', 'isHomeDao 应已删除');
ok(typeof NDX.homeDaoMult !== 'function', 'homeDaoMult 应已删除');
ok(!(NDX.DaoSystem && NDX.DaoSystem.isEvilDao), 'isEvilDao 应已删除（道级固定善恶废弃）');
ok(!(NDX.DaoSystem && NDX.DaoSystem.isGoodDao), 'isGoodDao 应已删除（道级固定善恶废弃）');
// 1c) 劫印来源阵营：善恶挂在印的**来源**上，不再按「道的固定善恶」判定
ok(typeof NDX.sealDaoMod === 'function', 'sealDaoMod 应存在（按 seal.align 调制）');
ok(NDX.sealDaoMod('abyss', { align: 'evil' }) > 1, '深渊态恶印应被增幅');
ok(NDX.sealDaoMod('calm', { align: 'evil' }) < 1, '明镜台恶印应被衰减');
ok(NDX.sealDaoMod('calm', { align: 'good' }) > 1, '明镜台善印应被增幅');
ok(NDX.sealDaoMod('drift', { align: 'good' }) === 1, '心城不调制');
ok(NDX.sealDaoMod('abyss', { dao: '战' }) === 1, '无来源阵营标记的印不调制（不再按道判定）');

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
  // V9.51 · A1 断线修复：业报诵改走 guardCounter 管线（原写 act.reflect 死字段，全仓无人读）
  ok(c.guardCounter === true && c.counterPct === 0.6, '业报诵应给反震（guardCounter 管线）');
  ok(c.reflect === undefined, '业报诵不得再写 reflect 死字段');
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
  // V9.51 · A1 断线修复：反伤流大招改走 guardCounter 管线（原写 act.reflect 死字段）
  ok(c.guardCounter === true && c.counterPct === 0.9 && c.shield === 400, '反伤流大招应反震（counterPct 0.9）并立盾');
  ok(c.reflect === undefined, '反伤流大招不得再写 reflect 死字段');
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

// 10b) S02 O3 三选一获取：显式选择覆盖流派映射（向后兼容零回归）
{
  const s = { flags: { jobConfirm: '齐天·大圣' } }; // crit 流 → 默认攻=crit
  const a = { kind: 'atk', dmg: 100, note: '' };
  NDX.resolveSkillAct(a, 'atk', { s: s, heroId: 'wukong' });
  ok(a.critHit === true, 'O3 未选招 → 攻招回落流派默认 crit（critHit 应置）');
  // 显式选招覆盖
  s.selectedVariant = { atk: 'aoe', chant: null };
  const b = { kind: 'atk', dmg: 100, note: '' };
  NDX.resolveSkillAct(b, 'atk', { s: s, heroId: 'wukong' });
  ok(b.aoe === 0.6, 'O3 显式 selectedVariant.atk=aoe 应覆盖默认 crit（aoe 应置）');
  ok(b.critHit !== true, 'O3 覆盖后不应再带默认 crit 标记');
  // 候选集生成：含默认项 + 补足互异项，且来自同一 kind 池
  const cands = NDX.skillChoiceCandidates('atk', 'crit', 3);
  ok(cands.length >= 2 && cands.length <= 3, 'O3 攻招候选应为 2~3 项');
  ok(cands.every((x) => !!NDX.ATK_VARIANTS[x.key]), 'O3 候选 key 必须落在 ATK_VARIANTS 池');
  ok(cands[0].key === NDX.skillVariantFor('atk', 'crit'), 'O3 候选首项是当前流派默认攻招');
  ok(cands.every((x) => x.name && typeof x.desc === 'string'), 'O3 候选须带 name/desc 供 UI');
  // applySkillChoice 落账
  const s2 = {};
  NDX.applySkillChoice(s2, 'atk', 'bloodrite');
  ok(s2.selectedVariant && s2.selectedVariant.atk === 'bloodrite', 'O3 applySkillChoice 应落账 selectedVariant.atk');
  NDX.applySkillChoice(s2, 'chant', null);
  ok(s2.selectedVariant.chant === null, 'O3 applySkillChoice(key=null) 应清回回落');
}

// ============================================================
// 11) 【V9.55 · A3 技能】技能总表三层收口 + 变种表接线 门禁 G1~G7
// ============================================================
console.log('—— V9.55 A3 技能 · 总表收口 ——');
const ROOT = path.join(__dirname, '..');
const srcOf = (f) => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
const IDX_SRC = srcOf('data_skill_index.js');
const VAR_SRC = srcOf('data_skill_variant.js');
const ACT_SRC = srcOf('combat_active.js');
const HTML_SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// G1 · 变种表必须真的接线（此前 applyActVariant 在 js/ 内零生产调用 = 死数据）
ok(ACT_SRC.indexOf('NDX.resolveSkillAct') >= 0, 'G1 攻/诵/绝三键应统一调用 NDX.resolveSkillAct');
ok(VAR_SRC.indexOf('NDX.applyActVariant') >= 0, 'G1 执行器应仍提供 applyActVariant');
ok(IDX_SRC.indexOf('NDX.ATK_VARIANTS') >= 0 && IDX_SRC.indexOf('NDX.CHANT_VARIANTS') >= 0,
  'G1 变种数值真源应落在技能总表 data_skill_index.js');
ok(!/NDX\.(ATK_VARIANTS|CHANT_VARIANTS|STATUS_DEFS|TREASURE_STATUS|ULT_STYLE_MOD)\s*=\s*\{/.test(VAR_SRC),
  'G1 单源纪律：执行器 data_skill_variant.js 不得重复声明数值真源');
ok(NDX.applyActVariant && typeof NDX.applyActVariant === 'function', 'G1 applyActVariant 应可用');

// G2 · 流派 → 变种组合差异可枚举（不能 10 流派全塌成同一个变种 / 互相撞车）
//     ⚠ 2026-09-27 · S02 O2：强化断言——10 流派攻/诵形态必须**各自互异**（每流派可感知差异）
{
  const styles = {};
  Object.keys(NDX.JOB_STYLE).forEach((j) => { styles[NDX.JOB_STYLE[j]] = 1; });
  const styleList = Object.keys(styles);
  ok(styleList.length === 10, `G2 应覆盖 10 个流派，实际 ${styleList.length}`);
  const atkByStyle = {}, chantByStyle = {};
  let dupAtk = null, dupChant = null;
  styleList.forEach((st) => {
    const a = NDX.skillVariantFor('atk', st);
    const c = NDX.skillVariantFor('chant', st);
    ok(NDX.ATK_VARIANTS[a], `G2 攻键变种 ${a}（${st}）不在 ATK_VARIANTS 中`);
    ok(NDX.CHANT_VARIANTS[c], `G2 诵经变种 ${c}（${st}）不在 CHANT_VARIANTS 中`);
    // 撞车检测：同一变种被 ≥2 流派共用（plain 是未转职回落，不参与互异计数）
    if (a !== 'plain') { if (atkByStyle[a]) dupAtk = `${st} 与 ${atkByStyle[a]} 共用攻键变种 ${a}`; else atkByStyle[a] = st; }
    if (c !== 'plain') { if (chantByStyle[c]) dupChant = `${st} 与 ${chantByStyle[c]} 共用诵经变种 ${c}`; else chantByStyle[c] = st; }
  });
  ok(!dupAtk, 'G2 攻键变种不得撞车：' + (dupAtk || ''));
  ok(!dupChant, 'G2 诵经变种不得撞车：' + (dupChant || ''));
  ok(Object.keys(atkByStyle).length === 10, `G2 攻键变种应覆盖 10 个互异形态，实际 ${Object.keys(atkByStyle).length}`);
  ok(Object.keys(chantByStyle).length === 10, `G2 诵经变种应覆盖 10 个互异形态，实际 ${Object.keys(chantByStyle).length}`);
  ok(NDX.skillVariantFor('atk', null) === 'plain' && NDX.skillVariantFor('atk', '不存在') === 'plain',
    'G2 未知/空流派应回落 plain');
}

// G3 · 🔴 同一变体只应用一次（V9.54「重复应用」回归）
//     攻键此前在 combat_active.js 直调 _sutraVariant + finalizeActiveAct 内又调一次，
//     导致加法字段翻倍 / dmgMul 平方 / note 拼两遍。
// V9.64 · jing 层 applyJingSlotMods 有 Math.random 概率分支（combo/crit/_tier≥2 追暴）；
//         本用例传 stub rng 让概率分支变确定，才能对「幂等」做严格断言。
//         选 () => 0 让所有 _roll 恒 true → 必触发概率；两次调用与二次跳过都在同一确定态。
{
  const mk = () => ({ kind: 'atk', dmg: 100, heal: 0, shield: 0, note: '挥兵狠击' });
  const s = { flags: { jobConfirm: '斗战明王' }, jingSlots: { atk: null, chant: null } };
  if (NDX.SUTRA_FULLS && NDX.SUTRA_FULLS[0]) s.jingSlots.atk = NDX.SUTRA_FULLS[0].id;
  const rngStub = () => 0;
  const a1 = mk(); NDX.resolveSkillAct(a1, 'atk', { s: s, rng: rngStub });
  const a2 = mk(); NDX.resolveSkillAct(a2, 'atk', { s: s, rng: rngStub }); NDX.resolveSkillAct(a2, 'atk', { s: s, rng: rngStub });
  ok(a1.note === a2.note, `G3 重复调用不得重复拼接 note：「${a1.note}」 vs 「${a2.note}」`);
  ok(a1.dmg === a2.dmg, `G3 重复调用不得二次缩放 dmg：${a1.dmg} vs ${a2.dmg}`);
  ok(a1.heal === a2.heal && a1.shield === a2.shield, 'G3 重复调用不得二次叠加 heal/shield');
  // 「连环」类变种在同一 act 上只能出现一次
  ok((a1.note.match(/连环/g) || []).length === 1, `G3 note 中「连环」应只出现一次，实际「${a1.note}」`);
  // 绝招同口径（ult 层不走概率，仍传 rng 保持 API 一致）
  const u1 = { kind: 'ult', name: '大闹天宫', dmg: 1000, heal: 0, shield: 0, note: '' };
  const u2 = { kind: 'ult', name: '大闹天宫', dmg: 1000, heal: 0, shield: 0, note: '' };
  const su = { flags: { jobConfirm: '齐天·大圣' } };
  NDX.resolveSkillAct(u1, 'ult', { s: su, heroId: 'wukong', tier: 3, rng: rngStub });
  NDX.resolveSkillAct(u2, 'ult', { s: su, heroId: 'wukong', tier: 3, rng: rngStub });
  NDX.resolveSkillAct(u2, 'ult', { s: su, heroId: 'wukong', tier: 3, rng: rngStub });
  ok(u1.note === u2.note && u1.dmg === u2.dmg, 'G3 绝招重复调用同样不得重复应用');
}

// G4 · 未转职 / 未持经 ⇒ 逐字节不变（存量玩家零副作用）
{
  const a = { kind: 'atk', dmg: 100, heal: 0, shield: 0, note: '挥兵狠击' };
  const snap = Object.assign({}, a);
  NDX.resolveSkillAct(a, 'atk', { s: {} });
  ['dmg', 'heal', 'shield', 'note', 'hits', 'trueDmg', 'dr', 'aoe', 'critHit', 'guardCounter'].forEach((k) => {
    ok(JSON.stringify(a[k]) === JSON.stringify(snap[k]), `G4 未转职时 ${k} 不得改变：${snap[k]} → ${a[k]}`);
  });
  const c = { kind: 'chant', dmg: 100, heal: 0, shield: 0, note: '' };
  NDX.resolveSkillAct(c, 'chant', { s: {} });
  delete c._skillDone; // 幂等登记是 resolveSkillAct 的内部产物，不算「行为改变」
  ok(JSON.stringify(c) === JSON.stringify({ kind: 'chant', dmg: 100, heal: 0, shield: 0, note: '' }),
    'G4 未转职诵经应逐字段不变，实际 ' + JSON.stringify(c));
}

// G5 · 总表数值 ↔ 执行器字段一一对应（总表写 fx op，执行器必须认得）
{
  const ops = {};
  ['ATK_VARIANTS', 'CHANT_VARIANTS'].forEach((t) => {
    const tab = NDX[t] || {};
    Object.keys(tab).forEach((k) => (tab[k].fx || []).forEach((f) => { ops[f.op] = 1; }));
  });
  const bad = Object.keys(ops).filter((op) => VAR_SRC.indexOf('case \'' + op + '\':') < 0);
  ok(bad.length === 0, 'G5 总表 fx op 在执行器中缺少落地分支：' + bad.join(', '));
  ok(Object.keys(ops).length >= 12, `G5 应存在至少 12 种 fx op，实际 ${Object.keys(ops).length}`);
}

// G5b · 执行器不得有孤儿 case（op 未被任何变种引用 = 死分支，如已删除的 dmgPct）
{
  const caseRe = /case\s+'([^']+)'\s*:/g;
  let m; const cases = new Set();
  while ((m = caseRe.exec(VAR_SRC)) !== null) cases.add(m[1]);
  const used = new Set();
  ['ATK_VARIANTS', 'CHANT_VARIANTS'].forEach((t) => {
    const tab = NDX[t] || {};
    Object.keys(tab).forEach((k) => (tab[k].fx || []).forEach((f) => { if (f && f.op) used.add(f.op); }));
  });
  const orphan = [...cases].filter((op) => !used.has(op));
  ok(orphan.length === 0, 'G5b 执行器孤儿 case（无变种引用）：' + orphan.join(', '));
}

// G6 · 运行时烟雾：每个攻/诵变种经 applyActVariant(act, kind, key) 实际执行，不得抛错且须产生预期形变
//     （重点验证 O2 新增 5 变种：firerain/bloodrite/conjure/beckon/hex 真实可跑、数值符合设计）
{
  const base = () => ({ dmg: 100, trueDmg: 0, heal: 0, hits: 1, spread: 0, aoe: 0, dr: 0,
    shield: 0, crit: false, critDmgAdd: 0, armorBreak: false, ignoreDef: false,
    guardCounter: false, counterPct: 0, counterLifesteal: 0, counterRounds: 0,
    sBuff: null, cleanse: null, note: '' });
  const run = (kind, key) => { const a = base(); NDX.applyActVariant(a, kind, key); return a; };
  let threw = null; const unch = [];
  ['atk', 'chant'].forEach((kind) => {
    const tab = (kind === 'chant') ? NDX.CHANT_VARIANTS : NDX.ATK_VARIANTS;
    Object.keys(tab).forEach((k) => {
      const a0 = base(), a1 = base();
      try { NDX.applyActVariant(a1, kind, k); } catch (e) { threw = `${kind}.${k} → ${e.message}`; }
      if (k !== 'plain' && JSON.stringify(a0) === JSON.stringify(a1)) unch.push(`${kind}.${k}`);
    });
  });
  ok(!threw, 'G6 运行时烟雾：所有攻/诵变种执行未抛错' + (threw ? ' → ' + threw : ''));
  ok(unch.length === 0, 'G6 非 plain 变种应产生形变：' + unch.join(', '));
  const fr = run('atk', 'firerain');
  ok(fr.aoe === 0.5 && fr.trueDmg >= 1, 'G6 firerain：aoe=0.5 且 附加真伤');
  const br = run('atk', 'bloodrite');
  ok(br.dmg === 130 && br.heal >= 30, 'G6 bloodrite：总伤 ×1.3=130 且 吸血≥30');
  const cj = run('atk', 'conjure');
  ok(cj.hits === 2 && cj.spread === 0.3 && cj.aoe === 0.4, 'G6 conjure：hits=2/spread=0.3/aoe=0.4');
  const bk = run('chant', 'beckon');
  ok(bk.heal === 45, 'G6 beckon：回血 45%');
  const hx = run('chant', 'hex');
  ok(hx.trueDmg >= 1, 'G6 hex：附加真伤');
}

// G6 · 顺序真源：SKILL_ORDER 与 SKILL_LAYERS 一一对应，且覆盖三键全链路
{
  const order = NDX.SKILL_ORDER || [];
  ok(order.length >= 6, 'G6 SKILL_ORDER 层数过少');
  order.forEach((n) => ok(NDX.SKILL_LAYERS && NDX.SKILL_LAYERS[n], `G6 SKILL_ORDER 中的 ${n} 层缺少执行体`));
  ok(order.indexOf('variant') > order.indexOf('sutra'),
    'G6 变种必须排在经文变体之后（舍攻为盾要抹 dmg，否则整层经文收益被吞）');
  ok(order.indexOf('treasure') === order.length - 1, 'G6 法宝状态应最后落地');
  const kindsCovered = {};
  order.forEach((n) => { const l = NDX.SKILL_LAYERS[n]; (l.kinds || []).forEach((k) => { kindsCovered[k] = 1; }); });
  ['atk', 'chant', 'ult'].forEach((k) => ok(kindsCovered[k], `G6 ${k} 键缺少任何变体层覆盖`));
}

// G7 · index.html 加载顺序：总表必须先于执行器
{
  const ln = (f) => { const m = HTML_SRC.split('\n').findIndex((l) => l.indexOf(f) >= 0); return m; };
  const iIdx = ln('data_skill_index.js'), iVar = ln('data_skill_variant.js'), iAct = ln('combat_active.js');
  ok(iIdx > 0 && iVar > 0, 'G7 index.html 应同时加载总表与执行器');
  ok(iIdx < iVar, 'G7 总表 data_skill_index.js 必须先于执行器 data_skill_variant.js 加载');
  ok(iAct > 0, 'G7 index.html 应加载 combat_active.js');
  // 三文件均须带 ?v= 版本号（AGENTS.md §五：改 js 必递增缓存版本）
  ['data_skill_index.js', 'data_skill_variant.js', 'combat_active.js'].forEach((f) => {
    const l = HTML_SRC.split('\n')[ln(f)] || '';
    ok(/\?v=\d+/.test(l), `G7 ${f} 的 script 标签应带 ?v= 版本号`);
  });
  // 单源纪律：数值不得同时存在于两处（执行器里出现赋值式声明即为第二真源）
  ok(!/NDX\.(ATK_VARIANTS|CHANT_VARIANTS)\s*=\s*\{/.test(VAR_SRC), 'G7 执行器不得再声明变种数值');
}

if (fail === 0) console.log('ok / 技能变种·状态·法宝联动·大招职业变体门禁通过');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
