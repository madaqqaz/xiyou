// 只读分析：统计 81 难六道抉择的分布，验证"滥用"假设。不修改任何游戏代码。
const fs = require('fs');
const vm = require('vm');
const sandbox = { NDX: {}, window: null, console };
sandbox.window = sandbox;
vm.createContext(sandbox);
const code = fs.readFileSync(__dirname + '/../js/trials81.js', 'utf8');
vm.runInContext(code, sandbox, { filename: 'trials81.js' });
const LIB = sandbox.NDX.TRIAL_LIB;
const ALL = ['战','渡','隐','夺','缘','逆','问','衡'];
let total = 0, withOpts = 0, withFate = 0;
const optCountDist = {};      // 选项数 -> 难数
const pathCountDist = {};     // 出现几道 -> 难数
let sixFull = 0;              // 六道全开(>=6)
let warSeizeBoth = [];        // 战+夺同框（用户点名违例）
let noFateTrials = [];        // 有选项但无 fate（纯叙事）
for (const id in LIB) {
  const t = LIB[id];
  total++;
  const opts = t.options || [];
  if (!opts.length) continue;
  withOpts++;
  optCountDist[opts.length] = (optCountDist[opts.length] || 0) + 1;
  const paths = new Set();
  let hasFate = false;
  for (const o of opts) {
    if (o.fate && ALL.includes(o.fate)) { paths.add(o.fate); hasFate = true; }
  }
  if (hasFate) {
    withFate++;
    pathCountDist[paths.size] = (pathCountDist[paths.size] || 0) + 1;
    if (paths.size >= 6) sixFull++;
    if (paths.has('战') && paths.has('夺')) warSeizeBoth.push(t.id + ':' + t.name);
  } else {
    noFateTrials.push(t.id + ':' + t.name);
  }
}
console.log('=== 81 难六道抉择分布（只读分析）===');
console.log('总难数:', total, '| 含选项难:', withOpts, '| 含六道 fate 难:', withFate);
console.log('选项数分布(选项数->难数):', JSON.stringify(optCountDist));
console.log('单难出现六道数分布(几道->难数):', JSON.stringify(pathCountDist));
console.log('六道全开(>=6道)的难数:', sixFull);
console.log('【违例】战+夺同框的难:', JSON.stringify(warSeizeBoth));
console.log('【纯叙事】有选项但无 fate 的难(共'+noFateTrials.length+'):', JSON.stringify(noFateTrials.slice(0,12)));
// 抽样：四圣试禅心 / 鹰愁涧 / 车迟 的选项 fate
for (const probe of [15, 64, 9, 28, 37, 81]) {
  const t = LIB[probe]; if (!t) continue;
  const fps = (t.options||[]).map(o => o.fate || (o.noDao?'noDao':'-')).join(',');
  console.log('  抽样 难'+probe+' '+t.name+' -> fate=['+fps+']');
}
