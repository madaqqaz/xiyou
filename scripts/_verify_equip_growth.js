// _verify_equip_growth.js — 六道装备成长门禁（V9.30 / 缘改固防 V9.31）
// 断言：① 缘/战/夺/渡/隐/逆 六道成长规格齐全且成长轴正确（缘=加防固定值 fixDr）；
//       ② 成长计算（挨打每 10 次 +per / 熔铸 +forge / 封顶）；③ 注入不污染原装备；
//       ④ 战后挨打计数与土地庙熔铸可用。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math };
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), sandbox);
load('data_equip_growth.js');
sandbox.NDX = win.NDX;
const NDX = win.NDX;

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };

// 1) 六道成长规格齐全 + 成长轴正确
['缘', '战', '夺', '渡', '隐', '逆'].forEach((d) => ok(NDX.EQUIP_GROWTH[d], `缺 ${d} 道成长规格`));
ok(NDX.EQUIP_GROWTH_PER_HITS === 10, '成长周期应为 10 次挨打');
ok(NDX.EQUIP_GROWTH.缘.field === 'fixDr', '缘应成长固防（加防固定值，用户 2026-09-23 拍板）');
ok(NDX.EQUIP_GROWTH.战.field === 'fixAtk', '战应成长攻击');
ok(NDX.EQUIP_GROWTH.夺.field === 'hp', '夺应成长气血');
ok(NDX.EQUIP_GROWTH.渡.field === 'fixMatk', '渡应成长法伤');
ok(NDX.EQUIP_GROWTH.隐.field === 'eva', '隐应成长闪避');
ok(NDX.EQUIP_GROWTH.逆.field === 'reflect', '逆应成长反伤');

// 2) 成长计算：20 次挨打(=2 步) + 3 次熔铸 → 缘 fixDr = 2×2 + 3×1 = 7
const eq = { id: 'e1', name: '玄武甲', dao: '缘' };
{
  const s = { equips: [eq], equipGrowth: { e1: { hits: 20, forge: 3 } } };
  const g = NDX.equipGrowthBonus(s, eq);
  ok(g && Math.abs(g.fixDr - 7) < 1e-9, `缘固防成长应为 7，实际 ${g && g.fixDr}`);
}
{
  const s2 = { equips: [eq], equipGrowth: { e1: { hits: 9, forge: 0 } } };
  ok(NDX.equipGrowthBonus(s2, eq) == null, '未满 10 次不应有成长');
}

// 3) 注入不污染原装备对象（返回浅拷贝）
{
  const s3 = { equips: [eq], equipGrowth: { e1: { hits: 10, forge: 0 } } };
  const grown = NDX.applyEquipGrowth(s3, s3.equips);
  ok(grown[0] !== eq, 'applyEquipGrowth 应返回浅拷贝');
  ok(eq.fixDr == null, '不应污染原装备对象');
  ok(Math.abs(grown[0].fixDr - 2) < 1e-9, '拷贝应带成长值');
  ok(NDX.applyEquipGrowth({ equips: [{ id: 'x', dao: null }] })[0].fixDr == null, '无 dao 装备不应被加成长');
}

// 3b) 成长须与装备**基础值相加**（不覆盖）——V9.31 修复固防被覆盖丢基础的 bug
{
  const eqB = { id: 'e2', name: '玄武甲·厚', dao: '缘', fixDr: 3 };
  const sB = { equips: [eqB], equipGrowth: { e2: { hits: 10, forge: 0 } } };
  const grownB = NDX.applyEquipGrowth(sB, sB.equips);
  ok(Math.abs(grownB[0].fixDr - 5) < 1e-9, `基础 3 + 成长 2 应 = 5，实际 ${grownB[0].fixDr}`);
  ok(eqB.fixDr === 3, '原装备基础值不应被修改');
  // 战道 fixAtk 同理（装备常有基础 fixAtk）
  const eqC = { id: 'e3', name: '铁棒', dao: '战', fixAtk: 4 };
  const sC = { equips: [eqC], equipGrowth: { e3: { hits: 10, forge: 0 } } };
  ok(NDX.applyEquipGrowth(sC, sC.equips)[0].fixAtk === 6, '战道应基础 4 + 成长 2 = 6');
}

// 4) 战后挨打计数（每 10 次一档）
{
  const s4 = { equips: [{ id: 'a', dao: '战' }, { id: 'b', dao: '缘' }, { id: 'c' }], equipGrowth: {} };
  ok(NDX.bumpEquipGrowthHits(s4, 5) === 0, '5 次不应成长');
  ok(s4.equipGrowth.a.hits === 5, '计数应累加');
  ok(NDX.bumpEquipGrowthHits(s4, 5) === 2, '再 5 次应 2 件成长');
  ok(s4.equipGrowth.a.hits === 10, '累计应为 10 次');
  ok(s4.equipGrowth.c == null, '无 dao 装备不应计数');
  ok(NDX.bumpEquipGrowthHits(s4, 0) === 0, '0 次不应计数');
}

// 5) 土地庙熔铸（包裹永久 +forge）
{
  const s5 = { equips: [{ id: 'a', name: '如意棒', dao: '战' }] };
  const f = NDX.forgeEquipGrowth(s5, 'a');
  ok(f && f.forge === 1, '熔铸应 +1');
  ok(s5.equipGrowth.a.forge === 1, '存档应记 forge');
  ok(NDX.forgeEquipGrowth(s5, '不存在') == null, '不存在装备熔铸应返回 null');
  ok(NDX.forgeableEquips(s5).length === 1, '可熔铸清单应含 1 件');
  ok(NDX.forgeableEquips({ equips: [{ id: 'z' }] }).length === 0, '无 dao 装备不可熔铸');
}

// 6) 封顶（防止无限堆）
{
  const s6 = { equips: [eq], equipGrowth: { e1: { hits: 100000, forge: 0 } } };
  const g6 = NDX.equipGrowthBonus(s6, eq);
  ok(Math.abs(g6.fixDr - 40) < 1e-9, `缘固防应封顶 40，实际 ${g6 && g6.fixDr}`);
}

// 7) 进度文本（UI 用）
{
  const s7 = { equips: [{ id: 'a', dao: '战' }], equipGrowth: { a: { hits: 10, forge: 2 } } };
  const txt = NDX.equipGrowthText(s7, s7.equips[0]);
  ok(typeof txt === 'string' && txt.indexOf('攻击') >= 0, '进度文本应含成长轴名');
  ok(NDX.equipGrowthText(s7, { id: 'q' }) == null, '无 dao 不应有进度文本');
}

if (fail === 0) console.log('ok / 六道装备成长（挨打计数 / 熔铸 / 六轴注入）门禁通过');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
