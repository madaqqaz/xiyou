// _verify_seal_daotu.js — 六道属性轴门禁（B7 等效 · V9.27 批A）
// 断言 NDX.SEAL_DAOTU 的 stat 映射与骨架真源一致，并校验夺/逆 劫印词条 stat 与轴对齐，
// 防止六道属性轴漂移（夺=吸血 / 逆=最终伤害 / 战=物攻 / 渡=气血 / 缘=双防 / 隐=闪避）。
// 由 scripts/_run_all_gates.js 的 /^(_smoke_|test_|_verify_).*\.js$/ 正则自动收录。
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'jieseals.js'), 'utf8');
const sandbox = { NDX: {}, console: console, Math: Math };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const NDX = sandbox.NDX;

const EXPECT = {
  战: 'atk',
  渡: 'maxhp',
  缘: 'dr+mdef',
  夺: 'lifesteal',
  隐: 'eva',
  逆: 'finalDamage',
};

let fail = 0;
const failMsg = (m) => { console.log('FAIL ' + m); fail++; };

// 1) SEAL_DAOTU 顶层轴映射
for (const k of Object.keys(EXPECT)) {
  const got = NDX.SEAL_DAOTU[k] && NDX.SEAL_DAOTU[k].stat;
  if (got !== EXPECT[k]) failMsg(`六道轴[${k}] 期望=${EXPECT[k]} 实际=${got}`);
}

// 2) 夺/逆 劫印词条 stat 必须与新轴一致
for (const name of Object.keys(NDX.SEAL_WORDS || {})) {
  const w = NDX.SEAL_WORDS[name];
  if (!w || !w.dao) continue;
  if (w.dao === '夺' && w.stat !== 'lifesteal') failMsg(`劫印[${name}] 夺道 stat 应为 lifesteal 实际=${w.stat}`);
  if (w.dao === '逆' && w.stat !== 'finalDamage') failMsg(`劫印[${name}] 逆道 stat 应为 finalDamage 实际=${w.stat}`);
}

if (fail === 0) console.log('ok / 六道属性轴门禁通过');
else console.log(`${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);
