// _verify_fabao_dao.js — 「六道加权·法宝投放」实证探针
// 目的：证明 NDX.rollFabao 的六道加权真的生效（而非静默回退等权），并与装备（rollEquips 同道 ×4）同规则。
// 断言：① 契约：daoAtkStyleOf 返回中文道名 / TREASURES.dao 均为六道中文名；
//       ② 六道轮流做主道时，同道法宝抽取频率均高于池内基线；
//       ③ 恶缘当道（curses 含 eyuan）时加权失效，回退等权（接近基线）；
//       ④ 无 runWeightedPick 依赖缺失时安全回退（不崩、仍出件）。
// 运行：node scripts/_verify_fabao_dao.js
const path = require('path'), fs = require('fs');
const ROOT = path.join(__dirname, '..');
Object.defineProperty(global, 'window', { value: global, writable: true, configurable: true });
global.location = { href: 'http://client', search: '' };
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node', platform: 'linux' }, writable: true, configurable: true });
const _ls = {};
global.localStorage = {
  get length() { return Object.keys(_ls).length; },
  key(i) { const k = Object.keys(_ls); return k[i] != null ? k[i] : null; },
  getItem(k) { return Object.prototype.hasOwnProperty.call(_ls, k) ? _ls[k] : null; },
  setItem(k, v) { _ls[k] = String(v); }, removeItem(k) { delete _ls[k]; },
  clear() { for (const k of Object.keys(_ls)) delete _ls[k]; },
};
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const SKIP = new Set(['sound.js', 'ui.js', 'main.js']);
[...html.matchAll(/js\/([\w\/-]+\.js)/g)].map((m) => m[1])
  .filter((f, i, a) => a.indexOf(f) === i)
  .filter((f) => !SKIP.has(f) && !f.startsWith('ui/'))
  .forEach((f) => { try { require(path.join(ROOT, 'js', f)); } catch (e) {} });
const NDX = global.NDX;

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };

const DAOS = ['战', '渡', '缘', '隐', '夺', '逆'];

// —— ① 契约：格式对齐（否则加权会静默失效）——
ck('daoAtkStyleOf 返回的道名为中文', (NDX.daoAtkStyleOf({ mainDao: '渡', seals: [] }) || {}).dao === '渡',
  '实际=' + JSON.stringify((NDX.daoAtkStyleOf({ mainDao: '渡', seals: [] }) || {}).dao));
const badDao = Object.keys(NDX.TREASURES).filter((k) => NDX.TREASURES[k].dao && DAOS.indexOf(NDX.TREASURES[k].dao) < 0);
ck('TREASURES.dao 均为六道中文名', badDao.length === 0, badDao.join(','));
ck('DAO_FABAO_W 已定义且为数值', typeof NDX.DAO_FABAO_W === 'number' && NDX.DAO_FABAO_W > 1, 'W=' + NDX.DAO_FABAO_W);

// —— 基线：ch9 池内「可抽取法宝」的各道占比 ——
const pool0 = NDX.FABAO_POOL[9].slice();
const valid = pool0.filter((t) => { const e = NDX.lootById(t); return e && e.treasure; });
const daoOf = (t) => (NDX.TREASURES[t] || {}).dao;
const baseOf = (d) => valid.filter((t) => daoOf(t) === d).length / valid.length;
ck('ch9 池可抽取法宝非空', valid.length > 0, 'valid=' + valid.length);

// 真随机（清播种），统计「抽到的法宝中同道占比」
if (NDX.clearRunRng) NDX.clearRunRng();
function sample(mainDao, curses, times) {
  let n = 0, hit = 0;
  for (let i = 0; i < times; i++) {
    const s = { equips: [], seals: [], mainDao: mainDao, curses: curses || [], act: 9 };
    const got = NDX.rollFabao(1, s, 9);
    if (!got.length) continue;
    n++;
    if (daoOf(got[0].treasureId) === mainDao) hit++;
  }
  return { n, p: n ? hit / n : 0 };
}

// —— ② 六道轮流做主道：同道占比均高于基线 ——
let liftOk = 0; const lifts = [];
DAOS.forEach((d) => {
  const b = baseOf(d);
  const r = sample(d, [], 4000);
  lifts.push(d + ' ' + r.p.toFixed(3) + '>' + b.toFixed(3));
  if (r.p > b + 1e-9) liftOk++;
});
ck('每道做主道时同道法宝占比均提升', liftOk === DAOS.length, lifts.join(' | '));

// —— ③ 恶缘当道：加权失效，回退等权（接近基线）——
const bDu = baseOf('渡');
const e = sample('渡', ['eyuan'], 4000);
ck('恶缘当道加权失效(接近基线)', Math.abs(e.p - bDu) < 0.06, 'p=' + e.p.toFixed(3) + ' base=' + bDu.toFixed(3));

// —— ④ 安全回退：临时抽掉 runWeightedPick 仍能出件、不崩 ——
const _saveW = NDX.runWeightedPick;
try {
  NDX.runWeightedPick = undefined;
  let ok4 = true, n4 = 0;
  try {
    const s = { equips: [], seals: [], mainDao: '渡', curses: [], act: 9 };
    for (let i = 0; i < 50; i++) { if (NDX.rollFabao(1, s, 9).length) n4++; }
  } catch (err) { ok4 = false; }
  ck('runWeightedPick 缺失时安全回退(仍出件)', ok4 && n4 === 50, 'n4=' + n4);
} finally { NDX.runWeightedPick = _saveW; }

// —— ⑤ 回归：无主道锚点时不应崩（getMainDao 有默认道，仍走加权分支）——
let ok5 = true;
try { const s = { equips: [], seals: [], act: 9 }; NDX.rollFabao(2, s, 9); } catch (err) { ok5 = false; }
ck('无 mainDao 锚点不崩', ok5);

console.log('结论：通过 / 失败 = ' + pass + ' / ' + fail);
process.exit(fail ? 1 : 0);
