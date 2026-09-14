// _run_all_gates.js — 全量门禁跑批器（不依赖 shell glob，Windows/Git Bash 均稳）
// 判据：退出码 != 0 或 输出结论行中「N 失败 / N fail」的 N != 0
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname);
const files = fs.readdirSync(DIR).filter((f) => /^(_smoke_|test_|_verify_).*\.js$/.test(f))
  .concat(['regression.js', 'platform_test.js', 'validate_audio.js', 'bus_decoupling_test.js',
    // 六道供给规则门禁（data_trial_dao.js）：审查=必给缺失数，字段守卫=重写丢字段数
    '_audit_trial_dao.js', '_check_dao_fieldloss.js', '_audit_trials81.js'])
  .filter((f) => fs.existsSync(path.join(DIR, f)))
  .filter((f, i, a) => a.indexOf(f) === i)
  .sort();
let worst = 0, okN = 0;
const rows = [];
files.forEach((f) => {
  const r = spawnSync(process.execPath, [path.join(DIR, f)], { encoding: 'utf8', cwd: path.join(DIR, '..') });
  const out = (r.stdout || '') + (r.stderr || '');
  const concl = (out.match(/^.*(结论|通过 \/|ok \/).*$/gm) || []).slice(-1)[0] || '';
  // 失败数判据兼容两种结论格式：中文「N 失败」；以及「通过 / 失败 = A / B」（取 B）
  const m1 = concl.match(/(\d+)\s*(失败|fail)/);
  const m2 = concl.match(/失败\s*[=:]\s*\d+\s*\/\s*(\d+)/);
  const failN = m1 ? +m1[1] : (m2 ? +m2[1] : 0);
  const bad = r.status !== 0 || failN !== 0;
  if (bad) { worst = 1; rows.push('*** FAIL ' + f + ' exit=' + r.status + ' ' + concl.trim()); }
  else { okN++; rows.push('ok   ' + f.padEnd(40) + ' ' + concl.trim()); }
});
console.log(rows.join('\n'));
console.log('\n=== 脚本数=' + files.length + ' 通过=' + okN + ' worst=' + worst + '（0=全绿）===');
process.exit(worst);
