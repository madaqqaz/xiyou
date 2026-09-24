// _verify_sutra_gain.js — 经文获取侧门禁（V9.31）
// 断言：① 残片 X/N 计数（N=命名表长度，半部=⌈N/2⌉）；② 半部发放 → 满 N 自动合成整本；
//       ③ 章末正常结算发 6 片残片；④ 半部选经（未完成优先/本地区优先）；
//       ⑤ 渡/逆两侧归属正确。
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

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };

// 1) 渡/逆归属
ok(NDX.sutraSideOf('su_full_xinjing') === 'ferry', '心经应属渡藏(ferry)');
ok(NDX.sutraSideOf('ni_full_pojie') === 'rebel', '破戒录应属逆藏(rebel)');
ok(NDX.sutraSideOf('不存在的经') === null, '未知经应返回 null');

// 2) 残片 X/N 计数（心经 N=5 → 半部 ⌈5/2⌉=3）
{
  const s = {};
  const p = NDX.sutraFragProgress(s, 'su_full_xinjing');
  ok(p && p.need === 5, `心经 need 应=5，实际 ${p && p.need}`);
  ok(p && p.halfNeed === 3, `心经 halfNeed 应=3（⌈5/2⌉），实际 ${p && p.halfNeed}`);
  ok(p && p.have === 0 && p.done === false, '初始应 0/5 未完成');
}

// 3) 半部发放：心经 0/5 → +3 → 3/5；再 +2 → 5/5 合成整本
{
  const s = {};
  const r1 = NDX.grantSutraHalf(s, 'su_full_xinjing', 2);
  ok(r1 && r1.granted === 3, `首半部应发 3 片，实际 ${r1 && r1.granted}`);
  ok(r1.prog.have === 3 && r1.prog.done === false, `首半部后应 3/5 未完成，实际 ${r1.prog.have}`);
  const r2 = NDX.grantSutraHalf(s, 'su_full_xinjing', 2);
  ok(r2 && r2.granted === 2, `次半部应补 2 片，实际 ${r2 && r2.granted}`);
  ok(r2.prog.done === true, '两半部后心经应已合成');
  ok((s.sutras || []).indexOf('su_full_xinjing') >= 0, '合成后应入 s.sutras');
  ok(NDX.grantSutraHalf(s, 'su_full_xinjing', 2) === null, '已完成经不应再发半部');
}

// 4) 半部 = ⌈N/2⌉：华严 N=16 → 8 片
{
  const s = {};
  const p = NDX.sutraFragProgress(s, 'su_full_huayan');
  ok(p && p.need === 16 && p.halfNeed === 8, `华严应 16/半部8，实际 ${p && p.need}/${p && p.halfNeed}`);
  const r = NDX.grantSutraHalf(s, 'su_full_huayan', 3);
  ok(r && r.granted === 8, `华严半部应发 8 片，实际 ${r && r.granted}`);
}

// 5) 逆藏半部可发（破戒录 N=3 → 半部 2）
{
  const s = {};
  const p = NDX.sutraFragProgress(s, 'ni_full_pojie');
  ok(p && p.side === 'rebel' && p.need === 3, `破戒录应归逆藏且 N=3，实际 ${p && p.side}/${p && p.need}`);
  const r = NDX.grantSutraHalf(s, 'ni_full_pojie', 1);
  ok(r && r.granted === 2, `破戒录半部应发 2 片，实际 ${r && r.granted}`);
  ok((s.niSutraFrags && Object.keys(s.niSutraFrags).length) === 2, '逆片应写入 s.niSutraFrags');
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

// 8) 规模真源自洽（渡22/逆12/合计34 部）
{
  ok(NDX.SUTRA_SPEC.total.bu === 34, '经文总部数真源应=34');
  ok((NDX.SUTRA_FULLS || []).length === NDX.SUTRA_SPEC.ferry.bu, '渡藏部数与真源不符');
  ok((NDX.NI_SUTRA_FULLS || []).length === NDX.SUTRA_SPEC.rebel.bu, '逆藏部数与真源不符');
}

// 9) 残片总览（V9.35）：渡/逆 全本计数 + 残片 X/N
{
  const s = {};
  const f0 = NDX.sutraFragOverview(s, 'ferry');
  ok(f0 && f0.fullN === 22 && f0.doneN === 0 && f0.have === 0 && f0.total === 203,
    `渡藏总览应为 0/22 · 0/203，实际 ${f0 && f0.doneN}/${f0 && f0.fullN} · ${f0 && f0.have}/${f0 && f0.total}`);
  const n0 = NDX.sutraFragOverview(s, 'rebel');
  ok(n0 && n0.fullN === 12 && n0.total === 76, `逆藏总览应为 12 部/76 片，实际 ${n0 && n0.fullN}/${n0 && n0.total}`);
  NDX.grantSutraHalf(s, 'su_full_xinjing', 2);
  NDX.grantSutraHalf(s, 'ni_full_pojie', 1);
  const f1 = NDX.sutraFragOverview(s, 'ferry');
  const n1 = NDX.sutraFragOverview(s, 'rebel');
  ok(f1.have === 3 && f1.total === 203, `渡藏残片应 3/203，实际 ${f1.have}/${f1.total}`);
  ok(n1.have === 2 && n1.total === 76, `逆藏残片应 2/76，实际 ${n1.have}/${n1.total}`);
  NDX.grantSutraHalf(s, 'su_full_xinjing', 2);
  const f2 = NDX.sutraFragOverview(s, 'ferry');
  ok(f2.doneN === 1, `心经合全本后渡藏全本计数应=1，实际 ${f2.doneN}`);
}

if (fail === 0) console.log('ok / 经文获取侧（残片X/N · 半部发放 · 章末结算 · 半部选经）门禁通过');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
