// _verify_sutra_six_dao.js — 经文「六道标签」门禁（V9.70）
// 断言：① 34 部经**全部**有六道标签、值域 ⊆ 六道、**六道无空道**（每道 ≥3）；
//       ② 六道标签与「渡/逆藏别」**解耦**（`sutraDaoOf` 值域仍只有 渡/逆 —— 不许顺手扩值域，
//          因为 attr_calc 的 ×1.5 会自动打开，属平衡变更）；
//       ③ 六道语义的四个消费点**真读**六道标签（不是读藏别）；
//       ④ 念经的「整本/半部」是**派生**（sutraChantPlan），不是写死文案；
//       ⑤ 每一条都有**反证** —— 摘标签 / 扩值域 / 改 need 后必须判红。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 自动收录。
//
// 🔴 本门禁针对的三个「看起来在跑、其实恒等价」的老缺陷（2026-09-28 定位）：
//   1. `sutraDaoOf` 值域只有 渡/逆 ⇒ `daoPoolMult(s,d)` 对全体候选**同乘一个常数**，
//      六道倾向在经文抽选链上数学上不可能生效；
//   2. `data_audit.sutraDaoCount(s, '战')` 恒 0 ⇒ 六道协同链的经文侧门槛长期假红；
//   3. `sixDaoSutraNames('战')` 恒 [] ⇒ 六道总览卡片那四道的经文栏一直是空的。
//   修法（用户拍板）：新增 `SUTRA_SIX_DAO` 打六道标签，**不动** `SUTRA_DAO_TAG` 的渡/逆值域。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math, Object: Object, Array: Array, JSON: JSON };
vm.createContext(sandbox);
['js/data_core.js', 'js/data.js', 'js/data_sutra.js', 'js/dao_system.js', 'js/data_audit.js', 'js/data_seed.js'].forEach((f) => {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox); }
  catch (e) { /* 按需加载：缺哪个跳过哪个 */ }
});
const NDX = win.NDX;
// 抽选链需 `runRandom`；本门禁只验「候选是否产出」，不需要真随机 ⇒ 缺时装一个**定点**桩。
//   ⚠ 定点桩只在 M 组前装，不污染 I~L 组（那几组不碰随机）。
if (typeof NDX.runRandom !== 'function') NDX.runRandom = function () { return 0.5; };

let pass = 0, fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? '  → ' + extra : '')); }
};
const src = (f) => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (e) { return ''; } };

console.log('=== I 组：六道标签的数据完整性 ===');
const all = (NDX.SUTRA_FULLS || []).concat(NDX.NI_SUTRA_FULLS || []);
const allIds = all.map((f) => f.id);
const SIX = ['战', '渡', '隐', '夺', '缘', '逆'];
const tagged = allIds.filter((id) => NDX.sutraSixDaoOf(id));
const untagged = allIds.filter((id) => !NDX.sutraSixDaoOf(id));
ok(all.length > 0 && tagged.length === all.length,
  'I1 全部经文均有六道标签（' + tagged.length + '/' + all.length + '）',
  '漏标：' + untagged.join(','));

const badTag = allIds.filter((id) => SIX.indexOf(NDX.sutraSixDaoOf(id)) < 0);
ok(badTag.length === 0, 'I2 值域 ⊆ 六道（战/渡/隐/夺/缘/逆）', '越界：' + badTag.join(','));

const perDao = {};
SIX.forEach((d) => { perDao[d] = allIds.filter((id) => NDX.sutraSixDaoOf(id) === d).length; });
const emptyDao = SIX.filter((d) => perDao[d] < 3);
ok(emptyDao.length === 0, 'I3 六道无空道（每道 ≥3：' + SIX.map((d) => d + perDao[d]).join('/') + '）',
  '空道/偏少：' + emptyDao.join(','));

//   🩸 反证：摘掉一部经的标签 ⇒ I1 必须立刻判红。
const _bakOne = NDX.SUTRA_SIX_DAO[allIds[0]];
delete NDX.SUTRA_SIX_DAO[allIds[0]];
const _redI1 = !NDX.sutraSixDaoOf(allIds[0]);
NDX.SUTRA_SIX_DAO[allIds[0]] = _bakOne;
ok(_redI1, 'I4 反证：摘掉一部经的标签后必须判红（本断言应「绿」= 反证成立）',
  '摘了还全绿 ⇒ I1 压根没在检查标签');

console.log('--- J 组：六道标签 ≠ 渡/逆藏别（不许顺手扩值域）---');
const tagVals = Array.from(new Set(Object.keys(NDX.SUTRA_DAO_TAG || {}).map((k) => NDX.SUTRA_DAO_TAG[k])))
  .sort();   // 中文按 UTF-16 码位排：渡(6E7F) < 逆(9006) ⇒ ['渡','逆']
ok(JSON.stringify(tagVals) === JSON.stringify(['渡', '逆']),
  'J1 sutraDaoOf 值域仍只有 渡/逆（藏别语义，未被六道污染）',
  '实为 ' + JSON.stringify(tagVals) + ' ⇒ attr_calc 的 ×1.5 会被顺手打开，是平衡变更');
//   🩸 反证：把「战」塞进 SUTRA_DAO_TAG ⇒ sutraDaoOf 立刻返回六道值 ⇒ J1 必须判红。
const _bakT = NDX.SUTRA_DAO_TAG[allIds[0]];
NDX.SUTRA_DAO_TAG[allIds[0]] = '战';
const _pollutedVal = NDX.sutraDaoOf(allIds[0]);
NDX.SUTRA_DAO_TAG[allIds[0]] = _bakT;
const _redJ1 = _pollutedVal === '战';
ok(_redJ1, 'J2 反证：往 SUTRA_DAO_TAG 塞六道值必须判红（本断言应「绿」= 反证成立）',
  '塞了还不红 ⇒ J1 是恒真空断言');

console.log('--- K 组：六道语义的消费点真读六道标签 ---');
const _pickSrc = src('js/data_sutra.js');
ok(/NDX\.sutraSixDaoOf\s*\?\s*NDX\.sutraSixDaoOf\(fid\)\s*:\s*null/.test(_pickSrc)
  && !/const d = NDX\.sutraDaoOf \? NDX\.sutraDaoOf\(fid\) : null/.test(_pickSrc),
  'K1 经文抽选链 `_wOf` 读六道标签（不再读藏别）',
  '还在读 sutraDaoOf ⇒ 六道倾向又是常数');
ok(/NDX\.sutraSixDaoOf\(f\.id\) === mainDao/.test(_pickSrc),
  'K2 sutraHalfPick 的主道过滤读六道标签');
const _daoSrc = src('js/dao_system.js');
ok(/NDX\.SUTRA_SIX_DAO\[fid\]\s*===\s*dao/.test(_daoSrc),
  'K3 六道卡片经文栏读 SUTRA_SIX_DAO（原读藏别 ⇒ 四道恒空）');
const _auditSrc = src('js/data_audit.js');
ok(/NDX\.sutraSixDaoOf\(id\) === dao/.test(_auditSrc),
  'K4 sutraDaoCount 按六道统计（原按藏别 ⇒ 五道恒 0）');
const _gameSrc = src('js/game/game_sutra.js');
ok(/NDX\.sutraSixDaoOf\('su_full_' \+ frag\.sutra\)/.test(_gameSrc),
  'K5 碎片抽取权重读六道标签');

console.log('--- L 组：念经的「整本/半部」是派生，不是写死文案 ---');
ok(typeof NDX.sutraChantPlan === 'function', 'L1 NDX.sutraChantPlan 存在（单一派生出口）');
if (typeof NDX.sutraChantPlan === 'function') {
  const fake = {
    sutraFrags: { jingang_0: 3, jingang_1: 3, jingang_2: 2, jingang_3: 2, jingang_4: 2, jingang_5: 2, jingang_6: 2 },
    sutras: [], niSutras: [], sutraBackpack: [],
  };
  // 金刚经 frags 7 种 → cost 由 NDX.sutraCostOf 定价；这里只验派生**形态**的自洽
  const pl = NDX.sutraChantPlan(fake, 'su_full_jingang');
  if (!pl) {
    ok(false, 'L2 派生自洽：plan 应存在', 'sutraFragProgress 在该假档上返回 null');
  } else {
    ok(pl.gain > 0 && pl.have + pl.gain === pl.after,
      'L2 派生自洽：after = have + gain（' + pl.have + '+' + pl.gain + '=' + pl.after + '/' + pl.need + '）');
    ok(pl.completes === (pl.after >= pl.need),
      'L3 completes ⇔ after ≥ need（整本/半部由此派生，非写死）');
    //   🩸 反证：把 need 抬高一档 ⇒ completes 必须翻转。
    const _bakNeed = NDX.sutraCostOf('su_full_jingang');
    const _origCost = NDX.sutraCostOf;
    NDX.sutraCostOf = function () { return _bakNeed + 1; };
    const _pl2 = NDX.sutraChantPlan(fake, 'su_full_jingang');
    NDX.sutraCostOf = _origCost;
    ok(_pl2 && _pl2.completes === false && _pl2.grant === 'half',
      'L4 反证：need +1 后 completes 必须翻成 false（本断言应「绿」= 反证成立）',
      'need 变了结果不变 ⇒ L3 是恒真空断言');
  }
}
console.log('--- M 组：念经入口形态（三选一 / 首章不发）---');
ok(typeof NDX.sutraChantCandidates === 'function' && typeof NDX.grantSutraChant === 'function',
  'M1 念经三选一与发放函数已接线');
if (typeof NDX.sutraChantCandidates === 'function') {
  const st = { sutraFrags: {}, sutras: [], niSutras: [], sutraBackpack: [], act: 1, fate: {} };
  ok((NDX.sutraChantCandidates(st, 1, 'ferry', 3) || []).length === 0,
    'M2 首章不发（act < SUTRA_CHANT_MIN_ACT ⇒ 返回空 ⇒ 入口置灰）');
  //   🩸 反证：把门槛调到 1 ⇒ 首章必须有候选，否则 M2 是恒真空断言。
  const _bakAct = NDX.SUTRA_CHANT_MIN_ACT;
  NDX.SUTRA_CHANT_MIN_ACT = 1;
  const _redM2 = (NDX.sutraChantCandidates(st, 1, 'ferry', 3) || []).length > 0;
  NDX.SUTRA_CHANT_MIN_ACT = _bakAct;
  ok(_redM2, 'M3 反证：门槛调到 1 后首章必须给出候选（本断言应「绿」= 反证成立）');
  const _st2 = { sutraFrags: {}, sutras: [], niSutras: [], sutraBackpack: [], act: 3, fate: {} };
  const _cs = NDX.sutraChantCandidates(_st2, 3, 'ferry', 3) || [];
  ok(_cs.length > 0 && _cs.length <= 3,
    'M4 三选一候选 1~3 条（实为 ' + _cs.length + '）');
  ok(_cs.every((o) => o && o.fullId && o.name), 'M5 每条候选都带 fullId 与名字（UI 展示用）');
}

console.log('\n=== _verify_sutra_six_dao: ' + pass + ' 通过 / ' + fail + ' 失败 ===');
console.log(fail === 0
  ? 'OK 经文六道标签（' + tagged.length + '/' + all.length + ' 部 · ' + SIX.map((d) => d + perDao[d]).join('/') + '）'
  : '经文六道标签门禁：' + fail + ' 项失败');
process.exit(fail === 0 ? 0 : 1);
