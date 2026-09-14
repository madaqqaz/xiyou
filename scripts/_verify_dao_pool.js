// _verify_dao_pool.js — 「六道概率主干」（GDD §2.2/§2.3）实证探针
// 目的：证明六道（s.fate）已从「属性给予者」降级为「投放池概率偏置向量」，且四池同口径消费同一真源。
// 断言：① 真源契约（daoPoolWeights/daoPoolMult，中性回落）；② 软饱和曲线（单调/上界/半饱和点）；
//       ③ 主道口径统一（五英雄回落 + 锚点优先 + 劫印累积转道，修八戒/小白龙/沙僧错道）；
//       ④ 四池行为（装备/法宝/经文/劫印，六道数量提升同道占比 / 首槽随动态主道）；
//       ⑤ 零回归（无 fate 中性；恶缘当道加权失效）；⑥ 真源连通（四池文件均消费真源）。
// 运行：node scripts/_verify_dao_pool.js
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
// 固定播种候选流：分布类断言必须可复现——真随机会让「占比阈值」断言抖动（2026-09-12 修）。
//   走项目自带 NDX.initRunRng（mulberry32）→ 同种子 + 同状态 = 同候选流。
if (NDX.initRunRng) NDX.initRunRng(20260912);

let pass = 0, fail = 0;
const ck = (name, cond, extra) => { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); } };
const DAOS = ['战', '渡', '缘', '隐', '夺', '逆'];
const near = (a, b, e) => Math.abs(a - b) < (e || 1e-9);

// ============ ① 真源契约 ============
ck('NDX.daoPoolWeights 已定义', typeof NDX.daoPoolWeights === 'function');
ck('NDX.daoPoolMult 已定义', typeof NDX.daoPoolMult === 'function');
ck('无 state → null（中性）', NDX.daoPoolWeights(null) === null);
ck('无 fate → null（中性）', NDX.daoPoolWeights({}) === null && NDX.daoPoolWeights({ fate: {} }) === null);
ck('fate 全 0 → null（中性）', NDX.daoPoolWeights({ fate: { '渡': 0 } }) === null);
ck('有 fate → 六道全覆盖', DAOS.every((d) => NDX.daoPoolWeights({ fate: { '渡': 5 } })[d] != null));
ck('恶缘当道 → null（加权失效）', NDX.daoPoolWeights({ fate: { '渡': 5 }, curses: ['eyuan'] }) === null);
ck('恶缘当道 → daoPoolMult 恒 1（调用方回落中性）', NDX.daoPoolMult({ fate: { '渡': 5 }, curses: ['eyuan'] }, '渡') === 1);

// ============ ② 软饱和曲线（GDD §2.3） ============
// fate 全 0 → 真源返回 null（中性），此处折算为权重 1（无偏置）
const W = (f) => { const w = NDX.daoPoolWeights({ fate: { '渡': f } }); return w ? w['渡'] : 1; };
const MAXB = NDX.FATE_POOL_W_MAX, HALF = NDX.FATE_POOL_W_HALF;
ck('w(fate=0) = 1（不偏置）', near(W(0), 1), 'W0=' + W(0));
ck('严格单调递增', W(1) < W(3) && W(3) < W(8) && W(8) < W(30), [W(1), W(3), W(8), W(30)].join('<'));
ck('半饱和点：w(HALF)=1+MAX/2', near(W(HALF), 1 + MAXB / 2), 'w=' + W(HALF));
ck('有上界且严格小于上界（不垄断）', W(100000) < 1 + MAXB && W(100000) > 1 + MAXB - 1e-3, 'w∞=' + W(100000));
ck('其它道不因偏置降到 1 以下', DAOS.every((d) => NDX.daoPoolWeights({ fate: { '渡': 50 } })[d] >= 1));

// ============ ③ 主道口径统一（五英雄回落 + 动态转道） ============
const md = (hero, s) => NDX.DaoSystem.getMainDao(Object.assign({ hero: hero, seals: [] }, s || {}));
ck('八戒回落「夺」（修错道：旧为战）', md('bajie') === '夺', md('bajie'));
ck('小白龙回落「隐」（修错道：旧为战）', md('xiaobailong') === '隐', md('xiaobailong'));
ck('沙僧回落「缘」（修错道：旧为渡）', md('shaseng') === '缘', md('shaseng'));
ck('悟空回落「战」（不回归）', md('wukong') === '战', md('wukong'));
ck('唐僧回落「渡」（不回归）', md('tangseng') === '渡', md('tangseng'));
ck('锚点优先于英雄回落', md('bajie', { mainDao: '缘' }) === '缘', md('bajie', { mainDao: '缘' }));
ck('劫印≥3 且领先锚点≥2 → 动态转道', md('bajie', { mainDao: '渡', seals: [{ dao: '战' }, { dao: '战' }, { dao: '战' }] }) === '战');

// ============ ④ 四池行为 ============
// —— 装备池：六道数量提升同道装备占比（固定主道=逆，隔离主道 ×4 的干扰）——
function eqShare(fateN, n, dao, eyuan) {
  let hit = 0, tot = 0;
  for (let i = 0; i < n; i++) {
    const s = { equips: [], seals: [], shownEquips: [], fate: fateN ? { '渡': fateN } : {}, mainDao: '逆', act: 9, _equipPity: 0 };
    if (eyuan) s.curses = ['eyuan'];
    let out = []; try { out = NDX.rollEquips(1, s); } catch (e) {}
    out.forEach((e) => { if (e && e.set && NDX.setDao && NDX.setDao(e.set) === dao) hit++; tot++; });
  }
  return tot ? hit / tot : 0;
}
const eqBase = eqShare(0, 600, '渡'), eqHigh = eqShare(12, 600, '渡'), eqEy = eqShare(12, 600, '渡', true);
ck('装备池：六道数量↑ → 同道装备占比↑', eqHigh > eqBase + 0.03, 'base=' + eqBase.toFixed(3) + ' high=' + eqHigh.toFixed(3));

// —— 法宝池：同上 ——
function fbShare(fateN, n, dao) {
  let hit = 0, tot = 0;
  for (let i = 0; i < n; i++) {
    const s = { equips: [], seals: [], fate: fateN ? { '渡': fateN } : {}, mainDao: '逆', act: 9 };
    let out = []; try { out = NDX.rollFabao(1, s, 9); } catch (e) {}
    out.forEach((e) => { const d = (NDX.TREASURES[e.treasureId] || {}).dao; if (d === dao) hit++; tot++; });
  }
  return tot ? hit / tot : 0;
}
const fbBase = fbShare(0, 600, '渡'), fbHigh = fbShare(12, 600, '渡');
ck('法宝池：六道数量↑ → 同道法宝占比↑', fbHigh > fbBase + 0.02, 'base=' + fbBase.toFixed(3) + ' high=' + fbHigh.toFixed(3));

// —— 经文池：三选一候选（act14 走全局池 5 部：华严/楞伽[渡]·解深密[隐]·涅槃/坛经[缘]，取 3 有区分度）——
//    固定 mainDao='战'（不在该池内）以隔离主道 ×4，仅观察六道数量（fate）之效。
function sutraShare(fateN, n, dao) {
  let hit = 0, tot = 0;
  for (let i = 0; i < n; i++) {
    const s = { sutraFrags: {}, niSutraFrags: {}, sutras: [], niSutras: [], sutraBackpack: [], fate: fateN ? { '渡': fateN } : {}, mainDao: '战', act: 14 };
    let c = []; try { c = NDX.sutraDropChoices(s, 'ferry', 14); } catch (e) {}
    c.forEach((fid) => { if (NDX.sutraDaoOf(fid) === dao) hit++; tot++; });
  }
  return tot ? hit / tot : 0;
}
const suBase = sutraShare(0, 600, '渡'), suHigh = sutraShare(12, 600, '渡');
ck('经文池：六道数量↑ → 同道经占比↑', suHigh > suBase + 0.03, 'base=' + suBase.toFixed(3) + ' high=' + suHigh.toFixed(3));

// —— 劫印池：首槽随动态主道（口径统一，不再被英雄固有道锁死）——
const os = (hero, s) => NDX.offerSeals(hero, 'white', Object.assign({ seals: [], hero: hero, fate: {} }, s || {})).map((x) => x.dao);
const o1 = os('tangseng'), o2 = os('bajie'), o3 = os('bajie', { mainDao: '缘' }), o4 = os('bajie', { mainDao: '渡', seals: [{ dao: '战' }, { dao: '战' }, { dao: '战' }] });
ck('劫印池首槽=英雄本命道（无信号）', o1[0] === '渡' && o2[0] === '夺', o1[0] + ',' + o2[0]);
ck('劫印池首槽随锚点改道', o3[0] === '缘', o3[0]);
ck('劫印池首槽随劫印累积转道', o4[0] === '战', o4[0]);
ck('劫印池恒出 3 项且道不重复', o2.length === 3 && new Set(o2).size === 3, o2.join(','));

// ============ ⑤ 零回归 / 失效语义 ============
ck('无 fate 时 daoPoolMult 全道为 1（中性）', DAOS.every((d) => NDX.daoPoolMult({ fate: {} }, d) === 1));
ck('恶缘当道：六道加权失效（同道占比回落）', eqEy < eqHigh - 0.02, 'eyuan=' + eqEy.toFixed(3) + ' high=' + eqHigh.toFixed(3));
ck('daoPoolMult 缺 state 不抛错', (function () { try { NDX.daoPoolMult(undefined, '渡'); return true; } catch (e) { return false; } })());

// ============ ⑥ 真源连通（四池文件均消费同一真源） ============
const code = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
ck('装备/法宝池消费 daoPoolWeights', /daoPoolWeights/.test(code('js/data_equip_core.js')));
ck('劫印池消费 daoPoolMult', /daoPoolMult/.test(code('js/jieseals.js')));
ck('经文池（候选/碎片）消费 daoPoolMult', /daoPoolMult/.test(code('js/data_sutra.js')) && /daoPoolMult/.test(code('js/game/game_sutra.js')));
ck('真源唯一定义于 dao_system.js', /NDX\.daoPoolWeights = function/.test(code('js/dao_system.js')));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
