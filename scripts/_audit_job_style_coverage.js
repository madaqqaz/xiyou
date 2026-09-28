// _audit_job_style_coverage.js — S04 §⑤-3 门禁：隐藏职 → 流派 覆盖守卫
// 断言：NDX.JOB_STYLE 的键集必须 ⊇ HIDDEN_JOBS 全部 job（无孤儿职），且不多余键（无悬空键），
//       且每个流派值 ∈ STYLE_LIST（合法路线）。防「新增隐藏职却漏打流派标签」的静默回归。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_|_audit_).*\.js$/ 正则自动收录。
global.window = global;
global.NDX = global.NDX || {};
require('../js/data_trials.js');
require('../js/data_skill_index.js');
require('../js/data_jobspec.js');

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };
const ok = (c, m) => { if (!c) failMsg(m); };

// 1) 收集全部隐藏职 job（去重）
const jobs = {};
Object.keys(NDX.HIDDEN_JOBS || {}).forEach((hero) => {
  (NDX.HIDDEN_JOBS[hero] || []).forEach((e) => { if (e && e.job) jobs[e.job] = 1; });
});
const allJobs = Object.keys(jobs);
ok(allJobs.length === 45, `HIDDEN_JOBS 唯一职数应为 45（实测 ${allJobs.length}）`);

// 2) 收集 JOB_STYLE 键
const styledKeys = Object.keys(NDX.JOB_STYLE || {});
ok(styledKeys.length > 0, 'JOB_STYLE 非空');

// 3) 孤儿职：有职无流派
const orphan = allJobs.filter((j) => !styledKeys.includes(j));
ok(orphan.length === 0, `孤儿职（隐藏职无流派标签）必须为 0（实测 ${orphan.length}：${orphan.join(',')}）`);

// 4) 悬空键：有流派键无对应职
const extra = styledKeys.filter((j) => !jobs[j]);
ok(extra.length === 0, `悬空流派键（JOB_STYLE 多出的键）必须为 0（实测 ${extra.length}：${extra.join(',')}）`);

// 5) 流派值合法性
const valid = NDX.STYLE_LIST || [];
const bad = styledKeys.filter((j) => valid.indexOf(NDX.JOB_STYLE[j]) < 0);
ok(bad.length === 0, `JOB_STYLE 流派值必须 ∈ STYLE_LIST（非法：${bad.join(',')}）`);

if (fail === 0) console.log(`ok / 隐藏职→流派覆盖守卫通过（${allJobs.length} 职 ↔ ${styledKeys.length} 流派键，孤儿/悬空=0）`);
else console.log(fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
