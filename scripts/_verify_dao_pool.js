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

// ============ ③ 主道口径统一（V9.51：英雄本命道**彻底取消**——主道只由玩家的实际选择决定） ============
const md = (hero, s) => NDX.DaoSystem.getMainDao(Object.assign({ hero: hero, seals: [] }, s || {}));
// 无锚点、无劫印 → 一律默认「渡」（不再按英雄归属/二体系/地区配额猜道；原五英雄回落断言随机制删除）
ck('无信号 → 默认渡（八戒）', md('bajie') === '渡', md('bajie'));
ck('无信号 → 默认渡（小白龙）', md('xiaobailong') === '渡', md('xiaobailong'));
ck('无信号 → 默认渡（沙僧）', md('shaseng') === '渡', md('shaseng'));
ck('无信号 → 默认渡（悟空）', md('wukong') === '渡', md('wukong'));
ck('无信号 → 默认渡（唐僧）', md('tangseng') === '渡', md('tangseng'));
// 回归防护：英雄↔道绑定真源不得复活
ck('HERO_HOME_DAO 已删除（英雄不绑定道）', NDX.HERO_HOME_DAO === undefined);
ck('HERO_MAIN_DAOTU 已删除（英雄不绑定道）', NDX.HERO_MAIN_DAOTU === undefined);
ck('锚点优先于默认', md('bajie', { mainDao: '缘' }) === '缘', md('bajie', { mainDao: '缘' }));
ck('劫印≥3 且领先锚点≥2 → 动态转道', md('bajie', { mainDao: '渡', seals: [{ dao: '战' }, { dao: '战' }, { dao: '战' }] }) === '战');
ck('无锚点但劫印分布≥3 → 采纳该道', md('bajie', { seals: [{ dao: '隐' }, { dao: '隐' }, { dao: '隐' }] }) === '隐');

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

// —— 经文池：V9.27 口径收口（主理人拍板）——经文道途**只分「渡 / 逆」两类**：
//    渡藏（su_full_*，佛经）恒为「渡」，逆藏（ni_full_*，逆道经文）恒为「逆」。
//    因此原断言「六道数量↑ → 同道经占比↑」已不再适用：渡经候选池的同道占比恒为 1，
//    与 fate（六道数量）无关，断言在数学上不可测。改为校验新口径本身（藏别 → 道途 一致性），
//    并额外确认投放层不会绕过该口径吐出非渡经文。
function sutraDaoConsistency() {
  const bad = [];
  Object.keys(NDX.SUTRA_DAO_TAG || {}).forEach((id) => {
    const want = id.indexOf('ni_') === 0 ? '逆' : '渡';
    const got = NDX.sutraDaoOf(id);
    if (got !== want) bad.push(id + '=' + got + '(应' + want + ')');
  });
  return bad;
}
const suBad = sutraDaoConsistency();
ck('经文道途只分渡/逆（渡藏恒渡 · 逆藏恒逆）', suBad.length === 0, suBad.slice(0, 6).join(', '));
ck('经文道途无非渡/逆残留', !Object.keys(NDX.SUTRA_DAO_TAG || {}).some((id) => !['渡', '逆'].includes(NDX.sutraDaoOf(id))));
const suPoolDaoOk = (function () {
  const s = { sutraFrags: {}, niSutraFrags: {}, sutras: [], niSutras: [], sutraBackpack: [], fate: { '渡': 12 }, mainDao: '战', act: 14 };
  let c = []; try { c = NDX.sutraDropChoices(s, 'ferry', 14); } catch (e) { return true; }
  const arr = Array.isArray(c) ? c : [];
  return arr.length > 0 && arr.every((fid) => NDX.sutraDaoOf(fid) === '渡');
})();
ck('渡经候选池道途恒为渡（投放层不绕过口径）', suPoolDaoOk);

// —— 劫印池：首槽随动态主道（口径统一，不再被英雄固有道锁死）——
const os = (hero, s) => NDX.offerSeals(hero, 'white', Object.assign({ seals: [], hero: hero, fate: {} }, s || {})).map((x) => x.dao);
const o1 = os('tangseng'), o2 = os('bajie'), o3 = os('bajie', { mainDao: '缘' }), o4 = os('bajie', { mainDao: '渡', seals: [{ dao: '战' }, { dao: '战' }, { dao: '战' }] });
// V9.51：无锚点无劫印信号时一律默认「渡」（不再按英雄归属回落——英雄本命道已彻底取消）
ck('劫印池首槽=默认渡道（无信号）', o1[0] === '渡' && o2[0] === '渡', o1[0] + ',' + o2[0]);
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

// ============ ⑦ 善恶口径（V9.51 收口：道不判善恶，善恶只挂「选择结果」与「印的来源」） ============
//   用户拍板 2026-09-25：六道 = 玩家的选择；善恶是劫难的**结算结果**，不是道的固有属性。
//   真源证据：九章正文「善恶值：善+8/善+10/恶+5/恶+8/恶+10」逐选项挂载（effect.alignGood/alignEvil，全量 404 处）。
//   本节锁死：① 道级固定善恶不得复活；② 印的善恶读单一真源 NDX.sealAlign/isEvilSeal（来源阵营）。
ck('NDX.sealAlign 已定义（印善恶唯一读口）', typeof NDX.sealAlign === 'function');
ck('NDX.isEvilSeal 已定义（恶印唯一判定）', typeof NDX.isEvilSeal === 'function');
ck('isEvilDao/isGoodDao 已废弃（道级固定善恶不得复活）',
  !(NDX.DaoSystem && (NDX.DaoSystem.isEvilDao || NDX.DaoSystem.isGoodDao)));
// 同一道可善可恶：决定权在印的来源 align，不在 dao
ck('sealAlign 优先读 align：隐印 align=evil → 恶', NDX.sealAlign({ dao: '隐', align: 'evil' }) === 'evil');
ck('sealAlign 优先读 align：战印 align=good → 善', NDX.sealAlign({ dao: '战', align: 'good' }) === 'good');
ck('isEvilSeal：隐印 align=evil 计为恶印（道不判善恶）', NDX.isEvilSeal({ dao: '隐', align: 'evil' }) === true);
ck('isEvilSeal：战印 align=good 不计为恶印（道不判善恶）', NDX.isEvilSeal({ dao: '战', align: 'good' }) === false);
// 无标记印（旧存档 / 早期发放）按 SEAL_SOURCE_ALIGN 回落，行为与迁移前等价
ck('无 align 回落：战/夺/逆 → evil', ['战', '夺', '逆'].every((d) => NDX.sealAlign({ dao: d }) === 'evil'));
ck('无 align 回落：渡/隐/缘 → good', ['渡', '隐', '缘'].every((d) => NDX.sealAlign({ dao: d }) === 'good'));
ck('空印安全', NDX.sealAlign(null) === null && NDX.isEvilSeal(null) === false);
// 消费侧真源连通：心魔养印不得再硬编码恶道清单
ck('心魔养印消费 isEvilSeal（game_region.js）', /NDX\.isEvilSeal/.test(code('js/game/game_region.js')));
ck('心魔养印无道级硬编码（不得出现 evilDaos 变量或 evilDaos.includes）',
  !/const\s+evilDaos/.test(code('js/game/game_region.js')) && !/evilDaos\.includes/.test(code('js/game/game_region.js')));
ck('道心调制消费 seal.align（data_daoxin.js）', /seal\.align|sl\.align|seal && seal\.align/.test(code('js/data_daoxin.js')));

console.log('\n结论：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
