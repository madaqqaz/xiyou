// 验收脚本：验证 V8.53 英雄专属装备（法宝/武器/护甲）随章节自动进阶
// 复用 index.html 的加载顺序，用 vm 沙箱模拟浏览器环境，排除 ui/main/audio/sound/platform 渲染层。
// 用法：node tools/verify_hero_gear.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = 'D:/xiyou/demo';

// ---- 沙箱（浏览器最小环境）----
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

// ---- 解析 index.html 的脚本加载顺序 ----
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
  const code = fs.readFileSync(fp, 'utf8');
  try { vm.runInContext(code, ctx, { filename: f }); }
  catch (e) { loadErr++; if (loadErr <= 12) console.log('LOAD_ERR', f, '::', e.message); }
}
const NDX = sandbox.NDX;
if (!NDX || !NDX.upgradeHeroGear) {
  console.log('FATAL typeofNDX=' + typeof NDX + ' loadErr=' + loadErr);
  console.log('  files[0..14]=', files.slice(0, 15).join(', '));
  console.log('  has data_config?', files.includes('js/data_config.js'), ' has equipment?', files.includes('js/equipment.js'));
  console.log('  sandbox own NDX keys=', Object.getOwnPropertyNames(sandbox).filter(k => k.toUpperCase() === 'NDX'));
  console.log('  window===sandbox=', sandbox.window === sandbox);
  process.exit(2);
}
console.log('环境就绪：equipPool=' + (NDX.EQUIP_POOL || []).length +
  ' bossRewards=' + Object.keys(NDX.BOSS_REWARDS || {}).length +
  ' craftPool=' + (NDX.CRAFT_POOL || []).length +
  ' loadErr=' + loadErr);

// ---- 验收数据 ----
const HEROES = ['wukong', 'bajie', 'tangseng', 'xiaobailong', 'shaseng'];
const GIFTS = {
  wukong:      { treasure: 'jingu_treasure', weapon: 'wk_staff_base',  armor: 'wk_caogun' },
  bajie:       { treasure: 'bj_bowl_fan',   weapon: 'bj_rake_fan',   armor: 'bj_robe_fan' },
  tangseng:    { treasure: 'ts_bowl_fan',   weapon: 'ts_staff_fan',  armor: 'ts_robe_base' },
  xiaobailong: { treasure: 'lm_bowl_fan',   weapon: 'lm_hoof_fan',  armor: 'lm_scale_fan' },
  shaseng:     { treasure: 'ss_bowl_fan',   weapon: 'ss_staff_fan',  armor: 'ss_robe_fan' },
};

function mk(hero, act) {
  const g = GIFTS[hero];
  const s = { hero, act, equips: [], over: false, flags: {}, visited: [] };
  for (const slot of ['treasure', 'weapon', 'armor']) {
    const e = NDX.lootById(g[slot]);
    if (e) s.equips.push(Object.assign({}, e));
    else console.log('WARN lootById miss', hero, slot, g[slot]);
  }
  return s;
}
function isOwn(e, slot, hero) {
  if (slot === 'treasure') return e.treasure && e.owner === hero;
  return e.slot === slot && e.set === NDX.HERO_SET_NAME[hero];
}
function findTier(s, slot, hero, tier) {
  return s.equips.filter((e) => isOwn(e, slot, hero) && (e.chapter || 1) === tier);
}

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.log('  FAIL:', msg); } }

for (const hero of HEROES) {
  for (const slot of ['treasure', 'weapon', 'armor']) {
    const tag = hero + '/' + slot;
    // 1) ch1 -> act2 -> 收敛到 ch2
    const s = mk(hero, 2);
    const r = NDX.upgradeHeroGear(s, slot);
    assert(r && r.tier === 2, tag + ' act2返回ch2 (got ' + (r ? r.tier : 'null') + ')');
    assert(findTier(s, slot, hero, 2).length === 1, tag + ' 持有恰好1件ch2');
    assert(findTier(s, slot, hero, 1).length === 0, tag + ' ch1被替换移除');
    // 2) 幂等
    const r2 = NDX.upgradeHeroGear(s, slot);
    assert(r2 === null, tag + ' 幂等(再调返回null)');
    assert(findTier(s, slot, hero, 2).length === 1, tag + ' 幂等后仍1件ch2');
    // 3) 跨章连续进阶 act2->act4
    s.act = 4;
    const r3 = NDX.upgradeHeroGear(s, slot);
    assert(r3 && r3.tier === 4, tag + ' act4收敛到ch4 (got ' + (r3 ? r3.tier : 'null') + ')');
    assert(findTier(s, slot, hero, 4).length === 1, tag + ' 持有1件ch4');
    assert(findTier(s, slot, hero, 2).length === 0, tag + ' ch2被替换移除');
    // 4) 不降级：act 回退到 1，应保持 ch4
    s.act = 1;
    const r4 = NDX.upgradeHeroGear(s, slot);
    assert(r4 === null, tag + ' act1不降级(返回null)');
    assert(findTier(s, slot, hero, 4).length === 1, tag + ' 仍持ch4不降级');
  }
}

console.log('\n验收结果：' + pass + ' pass / ' + fail + ' fail');
process.exit(fail ? 1 : 0);
