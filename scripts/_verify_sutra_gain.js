// _verify_sutra_gain.js — 经文获取侧门禁
// 断言：① 残片 X/N 计数（N = 该部定价 cost，半部 = ⌈cost/2⌉）；② 半部发放 → 满 cost 自动合成整本；
//       ③ 章末正常结算发 6 片残片；④ 半部选经（未完成优先/本地区优先）；
//       ⑤ 渡/逆两侧归属正确；⑥ 合成扣片**不吃超额**（定价改版回归）。
// 🔴 V9.54：所有数字一律读 `NDX.sutraCostOf` / `NDX.SUTRA_SPEC`，**不写死常量**——
//   定价表调整后门禁须自动收敛，否则会像上一版那样出现「203/76 过期硬编码」的红。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const win = {};
const sandbox = { NDX: {}, window: win, console: console, Math: Math };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data_sutra.js'), 'utf8'), sandbox);
const NDX = win.NDX;
// 依赖桩：整局播种随机（真源在 data_seed.js，此处不加载）
NDX.runRandom = function () { return 0.5; };
NDX.playerDao = function () { return null; };   // 自动路由（合成后入 s.sutras）要走此口

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };
// 某侧残片存量总和（可堆叠，用于「合成不吃超额」回归）
const sideSum = (s, side) => {
  const bag = side === 'rebel' ? (s.niSutraFrags || {}) : (s.sutraFrags || {});
  return Object.keys(bag).reduce((a, k) => a + (bag[k] || 0), 0);
};
const COST = (id) => NDX.sutraCostOf(id);

// 1) 渡/逆归属
ok(NDX.sutraSideOf('su_full_xinjing') === 'ferry', '心经应属渡藏(ferry)');
ok(NDX.sutraSideOf('ni_full_pojie') === 'rebel', '破戒录应属逆藏(rebel)');
ok(NDX.sutraSideOf('不存在的经') === null, '未知经应返回 null');

// 2) 残片 X/N 计数（口径 = 按定价）
{
  const s = {};
  const need = COST('su_full_xinjing');
  const p = NDX.sutraFragProgress(s, 'su_full_xinjing');
  ok(p && p.need === need, `心经 need 应=定价 ${need}，实际 ${p && p.need}`);
  ok(p && p.halfNeed === Math.ceil(need / 2), `心经 halfNeed 应=⌈${need}/2⌉，实际 ${p && p.halfNeed}`);
  ok(p && p.kinds === 5, `心经碎片种类应=5，实际 ${p && p.kinds}`);
  ok(p && p.have === 0 && p.done === false, '初始应 0/N 未完成');
}

// 3) 半部发放：0/N → +⌈N/2⌉ → 再补至 N 自动合成整本
{
  const s = {};
  const need = COST('su_full_xinjing');
  const half = Math.ceil(need / 2);
  const r1 = NDX.grantSutraHalf(s, 'su_full_xinjing', 2);
  ok(r1 && r1.granted === half, `首半部应发 ${half} 片，实际 ${r1 && r1.granted}`);
  ok(r1.prog.have === half && r1.prog.done === false, `首半部后应 ${half}/${need} 未完成，实际 ${r1.prog.have}`);
  const r2 = NDX.grantSutraHalf(s, 'su_full_xinjing', 2);
  ok(r2 && r2.granted === need - half, `次半部应补 ${need - half} 片，实际 ${r2 && r2.granted}`);
  ok(r2.prog.done === true, '两半部后心经应已合成');
  ok((s.sutras || []).indexOf('su_full_xinjing') >= 0, '合成后应入 s.sutras');
  ok(NDX.grantSutraHalf(s, 'su_full_xinjing', 2) === null, '已完成经不应再发半部');
}

// 4) 半部 = ⌈cost/2⌉：以真源定价为准，不写死（此处取定价最高的一部做上界校验）
{
  const s = {};
  const best = (NDX.SUTRA_FULLS || []).reduce((a, f) => (COST(f.id) > COST(a.id) ? f : a));
  const c = COST(best.id);
  const r = NDX.grantSutraHalf(s, best.id, 14);
  ok(r && r.granted === Math.ceil(c / 2), `${best.name} 半部应发 ⌈${c}/2⌉ 片，实际 ${r && r.granted}`);
}

// 5) 逆藏：按定价 + 写 s.niSutraFrags
{
  const s = {};
  const id = 'ni_full_pojie';
  const c = COST(id);
  const p = NDX.sutraFragProgress(s, id);
  ok(p && p.side === 'rebel' && p.need === c, `破戒录应归逆藏且 N=${c}，实际 ${p && p.side}/${p && p.need}`);
  const r = NDX.grantSutraHalf(s, id, 1);
  ok(r && r.granted === Math.ceil(c / 2), `破戒录半部应发 ⌈${c}/2⌉ 片，实际 ${r && r.granted}`);
  ok(sideSum(s, 'rebel') === r.granted, '逆片应写入 s.niSutraFrags');
}

// 6) 章末正常结算：发 6 片残片（用全局池章 act=14，避免小地区池耗尽）
{
  const s = {};
  const got = NDX.grantChapterSutraShards(s, 14, 6);
  ok(got.length === 6, `章末应发 6 片残片，实际 ${got.length}`);
  ok(NDX.CHAPTER_SHARD_N === 6, '章末残片数真源应=6');
}

// 7) 半部选经：未完成 + 本地区优先（act=2 → 心经/地藏 池）
{
  const s = {};
  const fid = NDX.sutraHalfPick(s, 2, 'ferry');
  ok(!!fid, '应有可续之经');
  const pool = NDX.sutraRegionPool(2) || [];
  ok(pool.indexOf(fid) >= 0, `act=2 应优先本地区池，实际 ${fid}`);
}

// 8) 规模真源自洽（渡22/逆12/合计34 部；片数以 SUTRA_SPEC 为准）
{
  ok(NDX.SUTRA_SPEC.total.bu === 34, '经文总部数真源应=34');
  ok((NDX.SUTRA_FULLS || []).length === NDX.SUTRA_SPEC.ferry.bu, '渡藏部数与真源不符');
  ok((NDX.NI_SUTRA_FULLS || []).length === NDX.SUTRA_SPEC.rebel.bu, '逆藏部数与真源不符');
  // 定价可达性硬约束：cost ≤ 碎片种类 × 2
  const bad = [].concat(NDX.SUTRA_FULLS || [], NDX.NI_SUTRA_FULLS || [])
    .filter((f) => COST(f.id) > ((f.frags || []).length * 2));
  ok(bad.length === 0, `存在不可达定价（cost > 种类×2）：${bad.map((f) => f.id + '=' + COST(f.id)).join(',')}`);
}

// 9) 残片总览（口径 = 按定价）：have/total 均为可堆叠片数
{
  const s = {};
  const fTot = (NDX.SUTRA_FULLS || []).reduce((a, f) => a + COST(f.id), 0);
  const nTot = (NDX.NI_SUTRA_FULLS || []).reduce((a, f) => a + COST(f.id), 0);
  const f0 = NDX.sutraFragOverview(s, 'ferry');
  ok(f0 && f0.fullN === 22 && f0.doneN === 0 && f0.have === 0 && f0.total === fTot,
    `渡藏总览应为 0/22 · 0/${fTot}，实际 ${f0 && f0.doneN}/${f0 && f0.fullN} · ${f0 && f0.have}/${f0 && f0.total}`);
  const n0 = NDX.sutraFragOverview(s, 'rebel');
  ok(n0 && n0.fullN === 12 && n0.total === nTot, `逆藏总览应为 12 部/${nTot} 片，实际 ${n0 && n0.fullN}/${n0 && n0.total}`);
  NDX.grantSutraHalf(s, 'su_full_xinjing', 2);
  NDX.grantSutraHalf(s, 'ni_full_pojie', 1);
  const f1 = NDX.sutraFragOverview(s, 'ferry');
  const n1 = NDX.sutraFragOverview(s, 'rebel');
  ok(f1.have === Math.ceil(COST('su_full_xinjing') / 2) && f1.total === fTot,
    `渡藏残片应 ${Math.ceil(COST('su_full_xinjing') / 2)}/${fTot}，实际 ${f1.have}/${f1.total}`);
  ok(n1.have === Math.ceil(COST('ni_full_pojie') / 2) && n1.total === nTot,
    `逆藏残片应 ${Math.ceil(COST('ni_full_pojie') / 2)}/${nTot}，实际 ${n1.have}/${n1.total}`);
  NDX.grantSutraHalf(s, 'su_full_xinjing', 2);
  const f2 = NDX.sutraFragOverview(s, 'ferry');
  ok(f2.doneN === 1, `心经合全本后渡藏全本计数应=1，实际 ${f2.doneN}`);
}

// 10) 🔴 V9.54 回归：合成扣片**不得吞掉超额残片**
//     旧逻辑「集齐全不同片 + 每种片各 -1」在按定价下会把 surplus 一起抹掉。
{
  const s = { sutraFrags: {}, sutraBackpack: [], sutras: [] };
  const fid = NDX.sutraFullById('su_full_xinjing');
  // 手工堆到 need+2（超额 2 片），再走第 10 片触发自动合成
  fid.frags.forEach((k, i) => { s.sutraFrags[k] = (i < 3 ? 3 : i < 5 ? 2 : 1); });
  const before = sideSum(s, 'ferry');
  const need = COST('su_full_xinjing');
  ok(before > need, `前置条件：存量 ${before} 应 > 定价 ${need}`);
  const g = NDX.grantSutraShard(s, 'ferry', 'su_full_xinjing', null);
  ok(!!g, '应发出残片');
  const after = sideSum(s, 'ferry');
  ok(after === (before + 1) - need, `合成后应剩 ${before + 1 - need} 片（只扣定价），实际 ${after}`);
  ok((s.sutras || []).indexOf('su_full_xinjing') >= 0, '应自动入 s.sutras 生效');
  ok(Object.keys(s.sutraFrags).every((k) => s.sutraFrags[k] > 0), '不应出现 ≤0 的碎片键');
}

if (fail === 0) console.log('ok / 经文获取侧（残片X/N · 半部发放 · 章末结算 · 半部选经 · 定价口径）门禁通过');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
