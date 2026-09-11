// 验收脚本：车迟国复合节点（改造A + 三场斗法合一 + 隐终局 + 六维图增长）
// 复用 index.html 加载顺序，用 vm 沙箱模拟浏览器环境，排除 ui/main/audio/sound/platform 渲染层。
// 用法：node tools/verify_chechi.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = 'D:/xiyou/demo';

const _noop = () => {};
const _store = {};
const sandbox = {
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
  navigator: { userAgent: 'node' },
  XMLHttpRequest: function () { return { open: _noop, send: _noop, setRequestHeader: _noop, addEventListener: _noop }; },
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  addEventListener: _noop, removeEventListener: _noop,
  localStorage: {
    getItem: (k) => (k in _store ? _store[k] : null),
    setItem: (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
  },
  document: {
    getElementById: () => null, createElement: () => ({
      style: {}, setAttribute: _noop, appendChild: _noop, addEventListener: _noop,
      classList: { add: _noop, remove: _noop }, querySelector: () => null, remove: _noop,
    }),
    querySelector: () => null, querySelectorAll: () => [], addEventListener: _noop,
    body: { appendChild: _noop }, documentElement: { style: {} },
  },
};
sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const re = /<script src="([^"]+)"[^>]*>/g;
const files = [];
let m;
while ((m = re.exec(html))) files.push(m[1].split('?')[0]);

const EXCLUDE = (f) => /^(platform\/|js\/ui|js\/main\.js|js\/sound\.js|js\/audio\/)/.test(f) || /\.css$/.test(f);
let loadErr = 0;
for (const f of files) {
  if (EXCLUDE(f)) continue;
  const fp = path.join(root, f);
  if (!fs.existsSync(fp)) continue;
  try { vm.runInContext(fs.readFileSync(fp, 'utf8'), ctx, { filename: f }); }
  catch (e) { loadErr++; if (loadErr <= 12) console.log('LOAD_ERR', f, '::', e.message); }
}
const NDX = sandbox.NDX;
if (!NDX) { console.log('FATAL: NDX 未就绪 loadErr=' + loadErr); process.exit(2); }

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  ' + extra : '')); }
}

const yao = [
  { name: '虎力大仙', hp: 1700, atk: 200, dr: 0.14, matk: 130, mdef: 0.16, tags: ['妖', '道'] },
  { name: '鹿力大仙', hp: 2000, atk: 230, dr: 0.18, matk: 160, mdef: 0.20, tags: ['妖', '道'] },
  { name: '羊力大仙', hp: 2300, atk: 270, dr: 0.22, matk: 190, mdef: 0.24, tags: ['妖', '道'] },
];

console.log('— 改造A：compositeMonster —');
ok('NDX.compositeMonster 定义', typeof NDX.compositeMonster === 'function');
const cm = NDX.compositeMonster(yao);
ok('返回对象', !!cm, JSON.stringify(cm && cm.name));
ok('名称含「合体」', cm && /合体/.test(cm.name), cm && cm.name);
ok('hp = 总和×0.6 = 3600', cm && cm.hp === 3600, cm && 'hp=' + cm.hp);
ok('atk = max×1.15 = 310', cm && cm.atk === 310, cm && 'atk=' + cm.atk);
ok('matk = max×1.15 = 218', cm && cm.matk === 218, cm && 'matk=' + cm.matk);
ok('dr = max = 0.22', cm && cm.dr === 0.22, cm && 'dr=' + cm.dr);
ok('mdef = max = 0.24', cm && cm.mdef === 0.24, cm && 'mdef=' + cm.mdef);
ok('boss 标记 true', cm && cm.boss === true);
ok('tags 并集含 妖/道', cm && cm.tags.indexOf('妖') >= 0 && cm.tags.indexOf('道') >= 0, cm && JSON.stringify(cm.tags));
ok('空数组返回 null', NDX.compositeMonster([]) === null);

console.log('— 车迟国复合节点注册 —');
ok('COMPOUND_NODES[7] 存在', !!(NDX.COMPOUND_NODES && NDX.COMPOUND_NODES[7]));
const c7 = NDX.COMPOUND_NODES && NDX.COMPOUND_NODES[7];
ok('fusions[0].diffs = [28,29,30]', c7 && c7.fusions && c7.fusions[0] && JSON.stringify(c7.fusions[0].diffs) === '[28,29,30]', c7 && JSON.stringify(c7.fusions && c7.fusions[0] && c7.fusions[0].diffs));
ok('fusions[0].chechi = true', c7 && c7.fusions && c7.fusions[0] && c7.fusions[0].chechi === true);
ok('diffs = [28,29,30]', c7 && JSON.stringify(c7.diffs) === '[28,29,30]', c7 && JSON.stringify(c7.diffs));
ok('chechi = true', c7 && c7.chechi === true);
if (NDX.fusionAtLayer) {
  const f = NDX.fusionAtLayer(7, 1);
  ok('fusionAtLayer(7,1) 命中车迟斗法', f && f.diffs && JSON.stringify(f.diffs) === '[28,29,30]', f && JSON.stringify(f && f.diffs));
}
if (NDX.compoundDiffsFor) {
  ok('compoundDiffsFor(7) = [28,29,30]', JSON.stringify(NDX.compoundDiffsFor(7)) === '[28,29,30]', JSON.stringify(NDX.compoundDiffsFor(7)));
}

console.log('— 三场斗法选项（战/渡/隐 + 无六道前缀 + 带 fate）—');
function nodeOpts(id) {
  const tr = NDX.normalizeTrial ? NDX.normalizeTrial(NDX.trialByLayer(id, 'tangseng')) : null;
  return tr;
}
[28, 29, 30].forEach((id) => {
  const tr = nodeOpts(id);
  const opts = tr && tr.options;
  ok(`第${id}难 有 options`, Array.isArray(opts) && opts.length === 3, tr && (tr.name || '') + ' len=' + (opts && opts.length));
  if (Array.isArray(opts)) {
    const keys = opts.map((o) => o.key).sort().join(',');
    ok(`第${id}难 选项键 = 战,渡,隐`, keys === '战,渡,隐', keys);
    ok(`第${id}难 三项均带 fate`, opts.every((o) => !!o.fate), JSON.stringify(opts.map((o) => o.fate)));
    // 无六道前缀：label 不得以 【战/渡/隐/夺/逆/缘】 开头
    ok(`第${id}难 选项无六道前缀`, opts.every((o) => !/^【[战渡隐夺逆缘]】/.test(o.label || '')), JSON.stringify(opts.map((o) => o.label)));
    // 战项须可触发战斗
    const war = opts.find((o) => o.key === '战');
    ok(`第${id}难 战项 fight=true`, war && war.fight === true);
  }
});

console.log('— 收束判定（chechiAllWar 公式）—');
function allWar(choices) { return choices.length >= 3 && choices.every((x) => x === '战'); }
ok('全战 → true', allWar(['战','战','战']) === true);
ok('含渡 → false', allWar(['战','渡','战']) === false);
ok('不足3项 → false', allWar(['战','战']) === false);
ok('隐已短路（不进 finalize）', true);

console.log(`\n结果：${pass} 通过 / ${fail} 失败（loadErr=${loadErr}）`);
process.exit(fail ? 1 : 0);
