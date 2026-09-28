// _audit_hero_curve.js — S05 §⑤-3 门禁：英雄五维跨难度曲线（后期收敛封顶不被绕过）
// 断言：5 英雄在 d1/d28/d81 的 NDX.playerBaseAt 输出满足
//   ① 5 英雄全覆盖；② atk/matk 随难度单调不减；
//   ③ 后期收敛封顶（d81−d28 增量 ≤ lateAtk 400 / lateMatk 450，防"取消封顶"静默回归）；
//   ④ 血量不随难度成长（HP 全由装备提供，见 data_heroes.js:26-27）；
//   ⑤ dr = baseDr + 0.06·t（t 在 d28 饱和为 1）；
//   ⑥ 远期收敛（探 d200：d28 之后总增量 ≤ 封顶；封顶失效者会线性外推 ⇒ 拒斥）。
//   注：**不用**「d81/d1 比值」判据——取经人 baseAtk=78（愿流派法器定位）合法产出 11.5×，卡比值会假红。
// 含「反证」：故意不封顶的替身曲线必须被判据拒斥，证明断言非恒真（X4 教训）。
// 运行：node scripts/_audit_hero_curve.js（已登记进 _run_all_gates.js）
global.window = global;
global.NDX = global.NDX || {};
require('../js/data_heroes.js');
require('../js/data_heroes_data.js');

const NDX = global.NDX;
let fail = 0;
const ck = (n, c, extra) => {
  if (c) console.log('ok   ' + n);
  else { console.log('FAIL ' + n + (extra ? '  → ' + extra : '')); fail++; }
};

const HEROES = NDX.HEROES || {};
const ids = Object.keys(HEROES);
const DIFFS = [1, 28, 81];
const CAP_ATK = 400, CAP_MATK = 450;   // 真源：data_heroes.js:20-21

ck('① 英雄数 = 5（平衡基准全集）', ids.length === 5, 'got ' + ids.length);
ck('① playerBaseAt 是函数', typeof NDX.playerBaseAt === 'function');

// —— 输出表（人读基准）——
console.log('     —— 英雄五维曲线（d1 / d28 / d81）——');
ids.forEach((id) => {
  const h = HEROES[id];
  const cells = DIFFS.map((d) => NDX.playerBaseAt(d, h));
  console.log('     ' + id.padEnd(12) + cells.map((c, i) =>
    `d${DIFFS[i]}: atk=${c.atk} matk=${c.matk} hp=${c.hp} dr=${c.dr}`).join(' | '));
});

ids.forEach((id) => {
  const h = HEROES[id];
  const [d1, d28, d81] = DIFFS.map((d) => NDX.playerBaseAt(d, h));

  ck(`② ${id} atk 单调不减`, d1.atk <= d28.atk && d28.atk <= d81.atk, `${d1.atk}/${d28.atk}/${d81.atk}`);
  ck(`② ${id} matk 单调不减`, d1.matk <= d28.matk && d28.matk <= d81.matk, `${d1.matk}/${d28.matk}/${d81.matk}`);

  // ③ t 在 d28 已饱和(=1)，故 d81−d28 的增量即 late 项 ⇒ 直接检验封顶是否被绕过
  ck(`③ ${id} lateAtk 封顶 ≤ ${CAP_ATK}`, (d81.atk - d28.atk) <= CAP_ATK, 'Δ=' + (d81.atk - d28.atk));
  ck(`③ ${id} lateMatk 封顶 ≤ ${CAP_MATK}`, (d81.matk - d28.matk) <= CAP_MATK, 'Δ=' + (d81.matk - d28.matk));

  ck(`④ ${id} 血量不随难度成长（HP 全由装备）`, d1.hp === d28.hp && d28.hp === d81.hp, `${d1.hp}/${d28.hp}/${d81.hp}`);

  const drExp = +((h.baseDr != null ? h.baseDr : 0.20) + 0.06).toFixed(3);
  ck(`⑤ ${id} dr 增长且后期封顶 = baseDr+0.06`,
    d1.dr <= d28.dr && d28.dr === drExp && d81.dr === drExp, `${d1.dr}/${d28.dr}/${drExp}`);

  // ⑥ 远期收敛（封顶不被绕过）：探 d200 —— 封顶失效者会继续线性外推（Δ>cap），本判据直接拒斥。
  //   ⚠ 判据口径诚实性（X4 教训）：**不得**用「d81/d1 比值」做判据——低 baseAtk 英雄
  //     （取经人 baseAtk=78，愿流派法器定位）合法产出 898/78≈11.5×，按比值卡会**假红**。
  //     真正的不变量是「d28 之后的总增量有界」，与 base 值无关。
  const far = NDX.playerBaseAt(200, h);
  ck(`⑥ ${id} 远期收敛（d200−d28 ≤ 封顶，防封顶失效）`,
    (far.atk - d28.atk) <= CAP_ATK, 'Δ=' + (far.atk - d28.atk));
  ck(`⑥ ${id} 远期收敛（d200−d28 愿伤 ≤ 封顶）`,
    (far.matk - d28.matk) <= CAP_MATK, 'Δ=' + (far.matk - d28.matk));
});

// —— 反证（必须真能红）——
// 人为构造"不封顶"的替身曲线：Δ 必然 > CAP_ATK ⇒ 证明 ③ 的判据非恒真。
const _noCapDelta = (h) => {
  const lateD81 = 81 - 28;
  return h.baseAtk + 420 * 1 + lateD81 * 8 - (h.baseAtk + 420 * 1);   // 故意不取 min
};
ck('反证：未封顶替身 Δ(=424) > CAP_ATK(400)，证明判据非恒真',
  _noCapDelta(HEROES.wukong) > CAP_ATK, 'Δ=' + _noCapDelta(HEROES.wukong));

// 反证②：不封顶的替身在 d200 增量必然远超封顶 ⇒ 证明 ⑥ 判据非恒真
const _noCapFar = (200 - 28) * 8;   // 不取 min ⇒ 172×8 = 1376
ck('反证：未封顶替身 d200 增量(=1376) > CAP_ATK(400)，证明 ⑥ 判据非恒真',
  _noCapFar > CAP_ATK, 'Δ=' + _noCapFar);

console.log(fail === 0
  ? `ok / 英雄五维曲线门禁通过（${ids.length} 英雄 × d1/d28/d81，封顶 ${CAP_ATK}/${CAP_MATK} 未被绕过）`
  : fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
